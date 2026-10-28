#!/usr/bin/env python3
"""Page hub: one server on port 3200 that indexes and serves every agent page and app link.

Run it from the project directory you work in; the repo and worktree come from there.
"""

import argparse
import contextlib
import errno
import fcntl
import functools
import http.client
import itertools
import json
import mimetypes
import os
import re
import shutil
import signal
import socket
import socketserver
import subprocess
import sys
import tempfile
import threading
import time
from collections.abc import Callable, Iterator
from dataclasses import dataclass
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit

PORT = 3200
# Bump VERSION with every change to hub.py's behavior, including the fields list.json gives hub.html.
# `ensure` replaces a running hub only when its VERSION is lower, so an unchanged number keeps the
# old code running.
VERSION = 5
APP_ID = "artifact-hub"
ROUTE_PROBE = ("8.8.8.8", 80)
LOCAL_REPO = "_local"
RESERVED = {"_hub", LOCAL_REPO}
PAGE_NAME = re.compile(r"[a-z0-9][a-z0-9._-]*")
RANGE = re.compile(r"bytes=(\d{0,18})-(\d{0,18})")
TERM_WAIT = 5
START_WAIT = 5
# A page nobody opened or published for this long is not served again when the hub starts.
IDLE_DAYS = 7
MAX_BODY = 4096
# Keeps another site from framing the index and steering clicks onto its buttons.
FRAME_GUARD = {"X-Frame-Options": "DENY", "Content-Security-Policy": "frame-ancestors 'none'"}

STATE_DIR = Path(os.environ.get("XDG_STATE_HOME") or Path.home() / ".local" / "state") / APP_ID
REPOS_FILE = STATE_DIR / "repos.json"
LOCAL_ROOT = STATE_DIR / LOCAL_REPO
LOCK_FILE = STATE_DIR / "hub.lock"
LOG_FILE = STATE_DIR / "hub.log"
APP_LOGS = STATE_DIR / "apps"
INDEX_HTML = Path(__file__).resolve().parent.parent / "hub.html"


class HubError(Exception):
    """A request the hub refuses or could not finish; `status` is the HTTP code for the browser."""

    def __init__(self, message: str, status: int = 400) -> None:
        super().__init__(message)
        self.status = status


class RangeNotSatisfiableError(Exception):
    """The requested byte range lies outside the file."""


def now() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def note(message: str) -> None:
    print(f"{now()} {message}", file=sys.stderr, flush=True)


# ======================================================================================
#                                  STATE ON DISK
# ======================================================================================
def read_json(path: Path, default: dict | None) -> dict | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return default


def write_json(path: Path, data: dict) -> None:
    """Write through a unique temp file in the same folder so readers never see half a file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    handle, name = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
    temp = Path(name)
    try:
        with os.fdopen(handle, "w", encoding="utf-8") as stream:
            json.dump(data, stream, indent=2)
        temp.replace(path)
    except BaseException:
        temp.unlink(missing_ok=True)
        raise


@contextlib.contextmanager
def locked() -> Iterator[None]:
    """Hold the hub-wide file lock. It is not re-entrant: take it once per command or request."""
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    with LOCK_FILE.open("a", encoding="utf-8") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        yield


def numbered(name: str) -> Iterator[str]:
    """Yield name, name-2, name-3, ..."""
    yield name
    for number in itertools.count(2):
        yield f"{name}-{number}"


def repo_root(common: str | Path) -> Path:
    return Path(common) / "agent-memory" / "artifacts"


def main_checkout(root: Path) -> Path:
    """The main checkout of the repo whose artifacts folder is root."""
    return root.parents[2]


def known_roots() -> dict[str, Path]:
    """Map repo name to its artifacts folder, plus `_local`.

    A registered repo whose Git directory is gone is left out; `register_repo` reuses its name.
    """
    repos = read_json(REPOS_FILE, {})
    roots = {name: repo_root(common) for name, common in repos.items() if Path(common).is_dir()}
    roots[LOCAL_REPO] = LOCAL_ROOT
    return roots


def folder_label(folder: str | Path) -> str:
    """A folder name usable as a URL segment: segments that start with a dot are never served."""
    return Path(folder).name.lstrip(".") or "folder"


def register_repo(common: str) -> str:
    """Return the sticky name of a repo, adding it to repos.json. Call under the lock."""
    repos = read_json(REPOS_FILE, {})
    for name, known in repos.items():
        if known == str(common):
            return name
    # A name whose repo folder is gone is taken over, so a moved repo keeps its address.
    taken = {name for name, known in repos.items() if Path(known).is_dir()} | RESERVED
    name = next(
        candidate
        for candidate in numbered(folder_label(Path(common).parent))
        if candidate not in taken
    )
    write_json(REPOS_FILE, {**repos, name: str(common)})
    return name


def record_file(root: Path, name: str) -> Path:
    return root / ".records" / f"{name}.json"


def read_record(root: Path, name: str) -> dict | None:
    record = read_json(record_file(root, name), None)
    return record if isinstance(record, dict) else None


def write_record(root: Path, name: str, record: dict) -> None:
    write_json(record_file(root, name), record)


def opened_file(root: Path, name: str) -> Path:
    """Touched each time a browser opens the page, so its mtime is when it was last opened."""
    return record_file(root, name).with_suffix(".opened")


def stored_records(root: Path) -> Iterator[tuple[str, dict]]:
    """Yield (name, record) for every readable record under an artifacts folder."""
    for path in sorted((root / ".records").glob("*.json")):
        record = read_json(path, None)
        if isinstance(record, dict):
            yield path.stem, record


def is_page_dir(root: Path, name: str) -> bool:
    """True for a real folder (not a symlink) that is a direct child of the artifacts folder."""
    path = root / name
    return path.is_dir() and not path.is_symlink() and path.resolve() == root.resolve() / name


def entry_id(repo: str, worktree: str, name: str) -> str:
    return "/".join(part for part in (repo, worktree, name) if part)


# ======================================================================================
#                                  WHO IS CALLING
# ======================================================================================
@dataclass(frozen=True)
class Caller:
    """The place a command runs from; it owns the pages and apps it creates."""

    path: str  # worktree top level, or the working directory outside Git
    label: str  # worktree folder name; "" on the main checkout and outside Git
    branch: str
    main: bool
    common: str | None  # Git common directory; None outside Git


def git_output(*args: str) -> str | None:
    try:
        result = subprocess.run(["git", *args], capture_output=True, text=True, check=False)
    except OSError:
        return None
    return result.stdout.strip() if result.returncode == 0 else None


def current_caller() -> Caller:
    common = git_output("rev-parse", "--path-format=absolute", "--git-common-dir")
    if common is None:
        return Caller(os.path.realpath(Path.cwd()), "", "", False, None)

    # Inside the .git folder the common dir is known but there is no work tree to name the owner.
    toplevel = git_output("rev-parse", "--show-toplevel")
    if toplevel is None:
        raise HubError("run hub.py from a worktree of the repo, not from inside its .git folder")

    common, toplevel = os.path.realpath(common), os.path.realpath(toplevel)
    main = toplevel == str(Path(common).parent)
    branch = git_output("rev-parse", "--abbrev-ref", "HEAD") or ""
    return Caller(toplevel, "" if main else folder_label(toplevel), branch, main, common)


def worktree_labels() -> set[str]:
    """Labels of every linked worktree of the repo the command runs in, recorded or not."""
    listing = git_output("worktree", "list", "--porcelain") or ""
    paths = [
        line.removeprefix("worktree ")
        for line in listing.splitlines()
        if line.startswith("worktree ")
    ]
    return {folder_label(path) for path in paths[1:]}  # the first entry is the main checkout


def root_of(caller: Caller) -> Path:
    return LOCAL_ROOT if caller.common is None else repo_root(caller.common)


# The fields every entry shows, so a new record, an old one, and a folder with none all start here.
BLANK = {
    "title": "",
    "desc": "",
    "by": "",
    "worktree_path": "",
    "worktree": "",
    "branch": "",
    "state": "stopped",
    "updated": "",
}


def new_record(kind: str, caller: Caller) -> dict:
    stamp = now()
    return {
        **BLANK,
        "type": kind,
        "worktree_path": caller.path,
        "worktree": caller.label,
        "branch": caller.branch,
        "created": stamp,
        "updated": stamp,
    }


def claimable(root: Path, name: str, caller: Caller, kind: str) -> bool:
    record = read_record(root, name)
    if record is not None:
        return record.get("worktree_path") == caller.path and record.get("type") == kind
    if not os.path.lexists(root / name):
        return True
    return kind == "page" and caller.main and is_page_dir(root, name)


def claim_name(root: Path, name: str, caller: Caller, kind: str) -> str:
    """Return the name this caller may use under root: its own earlier one or a free `-N` variant.

    The caller's own earlier name wins even when the plain name has been freed since, so a
    revision keeps its address. Otherwise a name is taken when another caller's record holds it,
    a folder is in the way (an unrecorded folder is adopted by a page from the main checkout), or
    it equals a worktree label of the repo, which would make `<repo>/<label>/` ambiguous.
    """
    records = list(stored_records(root))
    # A record keeps the name that was asked for (`base`), so a page the caller deliberately
    # named `dqn-2` is never taken for a variant of `dqn`. Records made before `base` existed
    # have none and match by their name alone.
    pattern = re.compile(rf"{re.escape(name)}(?:-([2-9]|[1-9]\d+))?")
    found = []
    for stored, record in records:
        match = pattern.fullmatch(stored)
        if (
            match
            and record.get("base", name) == name
            and record.get("worktree_path") == caller.path
            and record.get("type") == kind
        ):
            found.append((int(match[1] or 1), stored))
    if found:
        return min(found)[1]

    labels = {caller.label, *worktree_labels(), *(record.get("worktree") for _, record in records)}
    return next(
        candidate
        for candidate in numbered(name)
        if candidate not in labels and claimable(root, candidate, caller, kind)
    )


# ======================================================================================
#                                   THE CATALOG
# ======================================================================================
@dataclass
class Entry:
    """One page folder or app record. `record` holds defaults for a folder with no record."""

    repo: str
    root: Path
    name: str
    kind: str
    record: dict
    recorded: bool

    @property
    def id(self) -> str:
        return entry_id(self.repo, self.record["worktree"], self.name)

    @property
    def folder(self) -> Path:
        return self.root / self.name


def with_defaults(record: dict) -> dict:
    return {**BLANK, **record}


def unrecorded_page(folder: Path, owner: str) -> dict:
    """The record of a folder that has none; the main checkout owns it, so `dir` can reuse it."""
    stamp = (
        datetime.fromtimestamp(folder.stat().st_mtime).astimezone().isoformat(timespec="seconds")
    )
    return {"type": "page", "worktree_path": owner, "created": stamp, "updated": stamp}


def list_entries(roots: dict[str, Path] | None = None) -> list[Entry]:
    """Read every page folder and app record from disk; nothing is cached."""
    entries = []
    for repo, root in (known_roots() if roots is None else roots).items():
        if not root.is_dir():
            continue
        records = dict(stored_records(root))
        owner = "" if repo == LOCAL_REPO else str(main_checkout(root))
        for child in sorted(root.iterdir()):
            if child.name.startswith(".") or not child.is_dir():
                continue
            stored = records.get(child.name)
            recorded = stored is not None and stored.get("type") == "page"
            record = stored if recorded else unrecorded_page(child, owner)
            entries.append(Entry(repo, root, child.name, "page", with_defaults(record), recorded))
        entries.extend(
            Entry(repo, root, name, "app", with_defaults(record), True)
            for name, record in records.items()
            if record.get("type") == "app"
        )
    return entries


def find_entry(target: str) -> Entry:
    for entry in list_entries():
        if entry.id == target:
            return entry
    raise HubError(f"no page or app with id {target}", 404)


def repo_entries(name: str) -> list[Entry]:
    roots = known_roots()
    if name not in roots:
        raise HubError(f"no repo named {name}", 404)
    return list_entries({name: roots[name]})


def save(entry: Entry, **changes: object) -> None:
    entry.record.update(changes, updated=now())
    write_record(entry.root, entry.name, entry.record)


def entry_view(entry: Entry) -> dict:
    record = entry.record
    view = {
        "id": entry.id,
        "name": entry.name,
        "kind": entry.kind,
        "title": record["title"] or entry.name,
        "desc": record["desc"],
        "by": record["by"] or "unknown",
        "worktree": record["worktree"],
        "branch": record["branch"],
        "updated": record["updated"],
        "recorded": entry.recorded,
    }
    if entry.kind == "page":
        view["state"] = record["state"]
        view["path"] = page_path(entry.id)
        view["folder"] = display_path(entry.folder)
        view["no_index"] = not (entry.folder / "index.html").is_file()
    else:
        view["state"] = app_status(record)
        view.update(url=record.get("url", ""), cmd=record.get("cmd", ""), pid=record.get("pid"))
    return view


def display_path(path: str | Path) -> str:
    home = str(Path.home())
    text = str(path)
    return "~" + text[len(home) :] if text.startswith(home + os.sep) else text


def catalog() -> dict:
    """The data behind GET /_hub/list.json and `hub.py list`."""
    roots = known_roots()
    items = {}
    for entry in list_entries(roots):
        items.setdefault(entry.repo, []).append(entry_view(entry))

    repos = []
    for name in sorted(items, key=lambda repo: (repo == LOCAL_REPO, repo.lower())):
        root = roots[name]
        location = root if name == LOCAL_REPO else main_checkout(root)
        entries = sorted(items[name], key=lambda item: item["updated"], reverse=True)
        repos.append({"name": name, "path": display_path(location), "items": entries})
    return {"version": VERSION, "hub": hub_urls("/")[0], "repos": repos}


# ======================================================================================
#                                    NETWORK FACTS
# ======================================================================================
def lan_address() -> str | None:
    """Return the address of the interface used for outbound traffic, or None without a route.

    A UDP socket "connects" to a public address only to let the kernel pick the route;
    no packet is sent.
    """
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as probe:
        try:
            probe.connect(ROUTE_PROBE)
        except OSError:
            return None
        return probe.getsockname()[0]


@functools.cache
def own_names() -> tuple[str, ...]:
    """This machine's host name and Tailscale MagicDNS name, so `host:3200` works over Tailscale."""
    names = [socket.gethostname()]
    with contextlib.suppress(OSError, ValueError, KeyError, subprocess.SubprocessError):
        status = subprocess.run(
            ["tailscale", "status", "--json"], capture_output=True, text=True, timeout=5
        ).stdout
        names.append(json.loads(status)["Self"]["DNSName"].rstrip("."))
    return tuple(names)


def page_path(target: str) -> str:
    return "/" + quote(target) + "/"


def hub_urls(path: str) -> list[str]:
    """The LAN URL, then the local one, for a path on the hub."""
    hosts = [host for host in (lan_address(), "127.0.0.1") if host]
    return [f"http://{host}:{PORT}{path}" for host in hosts]


# ======================================================================================
#                                 PROCESSES (LINUX /proc)
# ======================================================================================
def proc_stat(pid: int) -> tuple[int, int] | None:
    """Return (parent pid, start time) of a live process, or None when it is gone or a zombie."""
    try:
        # Another process's name can hold bytes that are not UTF-8 (the kernel cuts it at 15 bytes).
        text = Path(f"/proc/{pid}/stat").read_text(encoding="utf-8", errors="replace")
    except OSError:
        return None
    # The command name can hold spaces and parentheses, so fields start after the last ")".
    fields = text[text.rindex(")") + 2 :].split()
    if fields[0] == "Z":
        return None
    return int(fields[1]), int(fields[19])


def start_time(pid: int) -> int | None:
    stat = proc_stat(pid)
    return stat[1] if stat else None


def descendants(pid: int) -> dict[int, int]:
    """Map pid to start time for every live descendant of pid."""
    children = {}
    for entry in Path("/proc").iterdir():
        stat = proc_stat(int(entry.name)) if entry.name.isdigit() else None
        if stat:
            children.setdefault(stat[0], []).append((int(entry.name), stat[1]))

    found, pending = {}, [pid]
    while pending:
        for child, started in children.get(pending.pop(), []):
            found[child] = started
            pending.append(child)
    return found


def listener_sockets(port: int) -> set[str]:
    """The `socket:[inode]` names of every LISTEN socket on a TCP port."""
    wanted = set()
    for table in ("/proc/net/tcp", "/proc/net/tcp6"):
        try:
            rows = Path(table).read_text(encoding="utf-8").splitlines()[1:]
        except OSError:
            continue
        for row in rows:
            fields = row.split()
            if fields[3] == "0A" and int(fields[1].rsplit(":", 1)[1], 16) == port:
                wanted.add(f"socket:[{fields[9]}]")
    return wanted


def socket_names(pid: int) -> set[str]:
    names = set()
    with contextlib.suppress(OSError):
        for descriptor in Path(f"/proc/{pid}/fd").iterdir():
            with contextlib.suppress(OSError):
                target = str(descriptor.readlink())
                if target.startswith("socket:"):
                    names.add(target)
    return names


def holds_listener(pid: int, port: int) -> bool:
    """True when pid, or a process it started, owns a LISTEN socket on the port."""
    wanted = listener_sockets(port)
    if not wanted:
        return False
    return bool(socket_names(pid) & wanted) or any(
        socket_names(child) & wanted for child in descendants(pid)
    )


def app_process(record: dict) -> bool:
    """True while the process a record names is still the one that was started."""
    pid, started = record.get("pid"), record.get("starttime")
    return bool(pid) and started is not None and start_time(pid) == started


def app_status(record: dict) -> str:
    """`running` (listening), `starting` (alive, not listening yet), `stopped` or `dead`."""
    if app_process(record):
        return "running" if holds_listener(record["pid"], record.get("port", 0)) else "starting"
    return "stopped" if record["state"] == "stopped" else "dead"


def ancestors(pid: int) -> set[int]:
    """The pid and every parent above it, up to init."""
    found: set[int] = set()
    while pid > 1 and pid not in found:
        found.add(pid)
        stat = proc_stat(pid)
        pid = stat[0] if stat else 0
    return found


def signal_process(pid: int, started: int, sig: signal.Signals) -> None:
    """Signal a process only while it is still the one that was recorded."""
    if start_time(pid) == started:
        with contextlib.suppress(ProcessLookupError):
            os.kill(pid, sig)


def process_group(pid: int) -> int | None:
    try:
        return os.getpgid(pid)
    except ProcessLookupError:
        return None


def wait_gone(tree: dict[int, int], seconds: float) -> bool:
    deadline = time.monotonic() + seconds
    while any(start_time(pid) == started for pid, started in tree.items()):
        if time.monotonic() > deadline:
            return False
        time.sleep(0.1)
    return True


def terminate(pid: int, started: int) -> None:
    """End an app: SIGTERM its group (when it leads one) and descendants, then SIGKILL leftovers."""
    tree = {**descendants(pid), pid: started}
    leads_group = process_group(pid) == pid
    if leads_group:
        with contextlib.suppress(ProcessLookupError):
            os.killpg(pid, signal.SIGTERM)
    for member, born in tree.items():
        if not leads_group or process_group(member) != pid:
            signal_process(member, born, signal.SIGTERM)

    if wait_gone(tree, TERM_WAIT):
        return
    for member, born in tree.items():
        signal_process(member, born, signal.SIGKILL)
    if not wait_gone(tree, 2):
        raise HubError(f"process {pid} is still running after SIGKILL")


# ======================================================================================
#                                      ACTIONS
# ======================================================================================
def reason(error: Exception) -> str:
    """An error's message without file paths, which the browser would show to the whole LAN."""
    if isinstance(error, OSError):
        return error.strerror or "the operation failed"
    return str(error)


def end_app(entry: Entry) -> bool:
    """End the app's processes while they live, listening or not; return whether any did."""
    record = entry.record
    if not app_process(record):
        return False
    try:
        terminate(record["pid"], record["starttime"])
    except OSError as error:
        raise HubError(f"could not stop {entry.id}: {reason(error)}") from error
    return True


def stop_entry(entry: Entry) -> str:
    if entry.kind == "app":
        was_running = end_app(entry)
        save(entry, state="stopped")
        return f"stopped {entry.id}" if was_running else f"{entry.id} was not running"
    if entry.recorded:
        save(entry, state="stopped")
    return f"stopped {entry.id}"


def resume_entry(entry: Entry) -> str:
    if entry.kind != "page":
        raise HubError("apps use start, not resume")
    if not is_page_dir(entry.root, entry.name):
        raise HubError(f"{entry.name} is not a plain folder inside the artifacts folder")
    if not (entry.folder / "index.html").is_file():
        raise HubError(f"{entry.id} has no page file (index.html)")
    save(entry, state="serving")
    return f"serving {entry.id}"


def delete_entry(entry: Entry) -> str:
    if entry.kind == "app":
        end_app(entry)
    elif is_page_dir(entry.root, entry.name):
        shutil.rmtree(entry.folder)
    elif os.path.lexists(entry.folder):
        raise HubError(
            f"refusing to delete {entry.name}: not a plain folder inside the artifacts folder"
        )
    record_file(entry.root, entry.name).unlink(missing_ok=True)
    opened_file(entry.root, entry.name).unlink(missing_ok=True)
    return f"deleted {entry.id}"


def start_entry(entry: Entry) -> str:
    """Re-run an app's stored command and wait up to START_WAIT seconds for its port.

    The wait happens under the lock on purpose: a second Start must see this process. Start
    refuses while the recorded process lives, listening or not, so two copies never run and
    Stop always finds the one the record names.
    """
    record = entry.record
    if entry.kind != "app":
        raise HubError("pages use resume, not start")
    status = app_status(record)
    if status == "running":
        return f"{entry.id} is already running"
    if status == "starting":
        raise HubError(f"{entry.id} is still starting; wait for its port or stop it first")

    APP_LOGS.mkdir(parents=True, exist_ok=True)
    log_path = APP_LOGS / f"{entry.name}.log"
    with log_path.open("ab") as log:
        process = subprocess.Popen(
            ["/bin/sh", "-c", record["cmd"]],
            cwd=record["cwd"],
            stdin=subprocess.DEVNULL,
            stdout=log,
            stderr=log,
            start_new_session=True,
        )
    threading.Thread(target=process.wait, daemon=True).start()  # reap it when it ends
    # Record the process before the wait, so Stop and Delete can reach it while it starts.
    save(entry, state="running", pid=process.pid, starttime=start_time(process.pid))

    deadline = time.monotonic() + START_WAIT
    while not holds_listener(process.pid, record["port"]):
        if process.poll() is not None:
            raise HubError(f"{entry.id} exited right away; see {display_path(log_path)}")
        if time.monotonic() > deadline:
            return (
                f"started {entry.id} (pid {process.pid}); not listening yet,"
                f" see {display_path(log_path)}"
            )
        time.sleep(0.1)
    return f"started {entry.id} (pid {process.pid})"


def run_each(entries: list[Entry], action: Callable[[Entry], str], verb: str, where: str) -> str:
    """Apply one action to many entries, keep going after failures, and report them together."""
    failures = []
    for entry in entries:
        try:
            action(entry)
        except (HubError, OSError) as error:
            failures.append(
                reason(error) if isinstance(error, HubError) else f"{entry.id}: {reason(error)}"
            )
    if failures:
        raise HubError("; ".join(failures))
    return f"{verb} {len(entries)} in {where}"


ENTRY_ACTIONS: dict[str, Callable[[Entry], str]] = {
    "stop": stop_entry,
    "resume": resume_entry,
    "delete": delete_entry,
    "start": start_entry,
}
REPO_ACTIONS: dict[str, tuple[Callable[[Entry], str], str]] = {
    "stop-repo": (stop_entry, "stopped"),
    "delete-repo": (delete_entry, "deleted"),
}


def run_action(action: str, target: str) -> str:
    """Run one action under the lock; return a one-line result or raise HubError."""
    try:
        with locked():
            if action in REPO_ACTIONS:
                each, verb = REPO_ACTIONS[action]
                return run_each(repo_entries(target), each, verb, target)
            if action in ENTRY_ACTIONS:
                return ENTRY_ACTIONS[action](find_entry(target))
    except OSError as error:
        note(f"{action} {target} failed: {error}")  # the full text, with paths, stays in the log
        raise HubError(reason(error), 500) from error
    raise HubError(f"unknown action {action}")


# ======================================================================================
#                                      HTTP SERVER
# ======================================================================================
def parse_range(header: str | None, size: int) -> tuple[int, int] | None:
    """Return (start, end) for one satisfiable byte range, or None to send the whole file."""
    match = RANGE.fullmatch(header or "")
    if not match or header == "bytes=-":
        return None

    first, last = match.groups()
    if first == "":
        if int(last) == 0:
            raise RangeNotSatisfiableError
        start, end = max(size - int(last), 0), size - 1
    else:
        start = int(first)
        if last and int(last) < start:
            return None
        end = min(int(last), size - 1) if last else size - 1
    if start >= size:
        raise RangeNotSatisfiableError
    return start, end


def locate_page(path: str) -> tuple[Entry, list[str], bool] | None:
    """Map a URL path to (page entry, remaining segments, ends with a slash), or None.

    Only `serving` pages match, by their exact id (`repo/worktree/page`, else `repo/page`).
    Any empty or `.`-prefixed segment rules the path out, and so does a path with no leading
    slash (a request line such as `GET x HTTP/1.0` reaches the handler as is).
    """
    if not path.startswith("/"):
        return None
    segments = [unquote(part) for part in path.split("/")[1:]]
    trailing_slash = segments[-1] == ""
    if trailing_slash:
        segments.pop()
    if any(not part or part.startswith(".") or "/" in part or "\0" in part for part in segments):
        return None

    serving = {
        entry.id: entry
        for entry in list_entries()
        if entry.kind == "page" and entry.record["state"] == "serving"
    }
    for count in (3, 2):
        entry = serving.get("/".join(segments[:count]))
        if entry and is_page_dir(entry.root, entry.name):
            return entry, segments[count:], trailing_slash
    return None


def content_type(path: Path) -> str:
    kind, encoding = mimetypes.guess_type(path.name)
    # `x.csv.gz` is a gzip file, not text, and we send no Content-Encoding.
    if kind is None or encoding:
        return "application/octet-stream"
    return f"{kind}; charset=utf-8" if kind.startswith("text/") else kind


def inside(root: Path, path: Path) -> Path | None:
    """Resolve a path; return it only when it stays in the root and no segment is hidden."""
    resolved = Path(os.path.realpath(path))
    try:
        relative = resolved.relative_to(root)
    except ValueError:
        return None
    return None if any(part.startswith(".") for part in relative.parts) else resolved


class HubServer(ThreadingHTTPServer):
    def server_bind(self) -> None:
        # HTTPServer.server_bind also resolves this machine's name, and that reverse lookup can
        # block for 10 s; no handler here uses the name, and `ensure` waits only 5 s for the hub.
        socketserver.TCPServer.server_bind(self)

    def handle_error(self, request: socket.socket, client_address: tuple[str, int]) -> None:
        # A browser that seeks in a video drops its old connection; that is not an error.
        if not isinstance(sys.exc_info()[1], ConnectionError):
            super().handle_error(request, client_address)


class HubHandler(BaseHTTPRequestHandler):
    server_version = f"{APP_ID}/{VERSION}"
    sys_version = ""

    def log_message(self, *args: object) -> None:
        pass

    # ---- replies ----
    def reply(
        self, status: int, kind: str, body: bytes, headers: dict[str, str] | None = None
    ) -> None:
        self.send_response(status)
        self.send_header("Content-Type", kind)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for name, value in (headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def reply_json(self, data: dict, status: int = 200) -> None:
        self.reply(status, "application/json", json.dumps(data).encode())

    def fail(self, status: int, message: str = "Not found") -> None:
        self.reply(status, "text/plain; charset=utf-8", f"{message}\n".encode())

    def host_allowed(self) -> bool:
        """True when the Host header names this machine, by the address the client reached.

        A page that rebinds its own name to this machine sends that name as Host, so refusing
        other names stops it from reading the lists or pressing buttons.
        """
        own = self.connection.getsockname()[0]
        return self.headers.get("Host") in {
            f"{name}:{PORT}" for name in ("localhost", "127.0.0.1", own, *own_names())
        }

    # ---- GET and HEAD ----
    def do_HEAD(self) -> None:
        self.do_GET()

    def do_GET(self) -> None:
        if not self.host_allowed():
            self.fail(403, "Forbidden: open the hub by this machine's IP address")
            return

        path = self.path.split("?", 1)[0].split("#", 1)[0]
        if path == "/":
            self.reply(200, "text/html; charset=utf-8", INDEX_HTML.read_bytes(), FRAME_GUARD)
        elif path == "/_hub/ping":
            self.reply_json({"app": APP_ID, "version": VERSION, "pid": os.getpid()})
        elif path == "/_hub/list.json":
            self.reply_json(catalog())
        else:
            self.serve_page(path)

    def serve_page(self, path: str) -> None:
        """Serve a file of a `serving` page; every other path is a plain 404."""
        found = locate_page(path)
        if found is None:
            self.fail(404)
            return
        entry, rest, trailing_slash = found
        root = Path(os.path.realpath(entry.folder))
        target = inside(root, root.joinpath(*rest))
        if target and target.is_dir():
            if not trailing_slash:
                self.redirect_to_folder(path)
                return
            target = inside(root, target / "index.html")
        if target and target.is_file():
            if target == root / "index.html":
                try:
                    opened_file(entry.root, entry.name).touch()  # no lock: a load never waits
                except OSError as error:
                    note(f"could not mark {entry.id} opened: {error}")
            self.send_file(target)
        else:
            self.fail(404)

    def redirect_to_folder(self, path: str) -> None:
        """Send the browser to the same address with a slash at the end, keeping any query."""
        query = self.path.partition("?")[2]
        location = path + "/" + (f"?{query}" if query else "")
        self.reply(301, "text/plain; charset=utf-8", b"", {"Location": location})

    def not_modified(self, etag: str) -> bool:
        """True when If-None-Match names the file's current ETag (or `*`)."""
        listed = self.headers.get("If-None-Match", "")
        return listed.strip() == "*" or etag in {
            tag.strip().removeprefix("W/") for tag in listed.split(",")
        }

    def send_file(self, path: Path) -> None:
        """Send a whole file, or the one byte range asked for, with exact length headers.

        Every file carries an ETag made from its modification time in nanoseconds and its size,
        and only a matching If-None-Match gets a 304, so a page that reloads itself skips each
        unchanged image, plot and video. Last-Modified has a 1 s resolution: a file rewritten
        within the second of the last fetch would stay stale behind a 304, so it decides nothing.
        """
        try:
            with path.open("rb") as stream:
                info = os.fstat(stream.fileno())
                size = info.st_size
                etag = f'"{info.st_mtime_ns}-{size}"'
                modified = self.date_time_string(info.st_mtime)
                if self.not_modified(etag):
                    self.send_response(304)
                    self.send_header("ETag", etag)
                    self.send_header("Last-Modified", modified)
                    self.send_header("Cache-Control", "no-cache")
                    self.end_headers()
                    return

                try:
                    span = parse_range(self.headers.get("Range"), size)
                except RangeNotSatisfiableError:
                    self.reply(
                        416, "text/plain; charset=utf-8", b"", {"Content-Range": f"bytes */{size}"}
                    )
                    return

                start, end = span or (0, size - 1)
                length = end - start + 1 if size else 0
                self.send_response(206 if span else 200)
                self.send_header("Content-Type", content_type(path))
                self.send_header("Content-Length", str(length))
                self.send_header("Accept-Ranges", "bytes")
                self.send_header("Cache-Control", "no-cache")
                self.send_header("ETag", etag)
                self.send_header("Last-Modified", modified)
                if span:
                    self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
                self.end_headers()
                if length and self.command != "HEAD":  # sendfile refuses a count of 0
                    self.connection.sendfile(stream, start, length)
        except (FileNotFoundError, PermissionError):
            self.fail(404)

    # ---- POST ----
    def do_POST(self) -> None:
        if self.path.split("?", 1)[0] != "/_hub/action":
            self.fail(404)
        elif not self.host_allowed():
            self.fail(403, "Forbidden: open the hub by this machine's IP address")
        elif self.headers.get_content_type() != "application/json":
            self.fail(415, "Send application/json")
        else:
            self.run_posted_action()

    def run_posted_action(self) -> None:
        try:
            length = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(length)) if 0 < length <= MAX_BODY else None
            action = body["action"]
            target = body["repo" if action in REPO_ACTIONS else "id"]
            if not isinstance(action, str) or not isinstance(target, str):
                raise TypeError
        except (ValueError, KeyError, TypeError):
            self.fail(400, 'Send JSON like {"action": "stop", "id": "repo/page"}')
            return

        note(f"{self.client_address[0]} {action} {target}")
        try:
            self.reply_json({"ok": True, "message": run_action(action, target)})
        except HubError as error:
            self.reply_json({"ok": False, "error": str(error)}, error.status)


def serve() -> None:
    try:
        server = HubServer(("0.0.0.0", PORT), HubHandler)
    except OSError as error:
        if error.errno == errno.EADDRINUSE:
            # Another hub won the race, or a stranger holds the port.
            note(f"port {PORT} is already in use; not starting")
            return
        raise SystemExit(f"hub failed: {error}") from error

    note(f"hub {VERSION} listening on {PORT}, pid {os.getpid()}")
    with contextlib.suppress(KeyboardInterrupt), server:
        server.serve_forever()


# ======================================================================================
#                                   START AND REPLACE
# ======================================================================================
def ping() -> dict | None:
    """Return what a server on PORT answers to /_hub/ping, or None when nothing answers.

    Anything that answers but is not this hub's JSON gives an empty dict, so a stranger on the
    port is told apart from a free port at once.
    """
    connection = http.client.HTTPConnection("127.0.0.1", PORT, timeout=2)
    try:
        connection.request("GET", "/_hub/ping")
        body = connection.getresponse().read()
    except OSError:
        return None
    except http.client.HTTPException:
        return {}
    finally:
        connection.close()
    try:
        answer = json.loads(body)
    except ValueError:
        return {}
    return answer if isinstance(answer, dict) else {}


def is_hub(answer: dict | None, minimum: int = 0) -> bool:
    if not answer or answer.get("app") != APP_ID or not isinstance(answer.get("version"), int):
        return False
    return answer["version"] >= minimum


def foreign_port_error() -> HubError:
    return HubError(
        f"port {PORT} is taken by something that is not the artifact hub; "
        f"find it with: ss -ltnp 'sport = :{PORT}'"
    )


def used_since(entry: Entry, cutoff: datetime) -> bool:
    """True when the page was opened in a browser, published, or served again after cutoff.

    A date the hub cannot read counts as recent, so one hand-edited record never blocks the start.
    """
    with contextlib.suppress(FileNotFoundError):
        if opened_file(entry.root, entry.name).stat().st_mtime > cutoff.timestamp():
            return True
    try:
        return datetime.fromisoformat(entry.record["updated"]) > cutoff
    except (TypeError, ValueError):
        return True


def stop_idle_pages() -> None:
    """Stop serving pages unused for IDLE_DAYS; their files stay. Call under the lock."""
    cutoff = datetime.now().astimezone() - timedelta(days=IDLE_DAYS)
    idle = [
        entry
        for entry in list_entries()
        if entry.kind == "page"
        and entry.record["state"] == "serving"
        and not used_since(entry, cutoff)
    ]
    for entry in idle:
        # Not `save`, which would date the page as updated today.
        write_record(entry.root, entry.name, {**entry.record, "state": "stopped"})
    if idle:
        note(f"stopped {len(idle)} pages nobody opened in {IDLE_DAYS} days")


def spawn_hub() -> None:
    """Start the hub process, first stopping idle pages so they are not served again."""
    try:
        stop_idle_pages()
    except OSError as error:  # an unreadable folder must not keep the hub from starting
        note(f"could not stop idle pages: {error}")
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    with LOG_FILE.open("ab") as log:
        subprocess.Popen(
            [sys.executable, str(Path(__file__).resolve()), "run"],
            stdin=subprocess.DEVNULL,
            stdout=log,
            stderr=log,
            start_new_session=True,
        )
    deadline = time.monotonic() + 5
    while time.monotonic() < deadline:
        if is_hub(ping(), VERSION):
            return
        time.sleep(0.1)

    # Say what is really there: nothing, an older hub, or another program.
    answer = ping()
    if answer is None:
        raise HubError(
            f"the hub did not start on port {PORT}; see {display_path(LOG_FILE)}, and check who "
            f"holds the port with: ss -ltnp 'sport = :{PORT}'"
        )
    if is_hub(answer):
        raise HubError(
            f"hub version {answer['version']} still answers on port {PORT}, not {VERSION}"
        )
    raise foreign_port_error()


def ensure() -> None:
    """Make sure a current hub answers on PORT; start one, or replace an older one, when needed.

    Everything after the first look runs under the lock, so two commands that start the hub
    at once spawn one. An older hub is stopped only when it is this user's process holding PORT.
    """
    if is_hub(ping(), VERSION):
        return

    with locked():
        answer = ping()
        if answer is None:  # nothing answers: start one
            spawn_hub()
            return
        if not is_hub(answer):
            raise foreign_port_error()
        if answer["version"] >= VERSION:  # another command replaced it first
            return

        pid = answer.get("pid")
        owned = (
            isinstance(pid, int)
            and proc_stat(pid) is not None
            and Path(f"/proc/{pid}").stat().st_uid == os.getuid()
            and socket_names(pid) & listener_sockets(PORT)
        )
        if not owned:
            raise HubError(
                f"an older hub answers on port {PORT} but pid {pid} is not yours to stop"
            )

        os.kill(pid, signal.SIGTERM)
        deadline = time.monotonic() + 5
        while proc_stat(pid) is not None:
            if time.monotonic() > deadline:
                raise HubError(f"the older hub (pid {pid}) did not stop")
            time.sleep(0.1)
        spawn_hub()


# ======================================================================================
#                                      COMMAND LINE
# ======================================================================================
def check_name(name: str) -> None:
    if not PAGE_NAME.fullmatch(name):
        raise HubError(f"name {name!r} must match [a-z0-9][a-z0-9._-]*")


def cmd_dir(args: argparse.Namespace) -> None:
    check_name(args.name)
    caller = current_caller()
    root = root_of(caller)
    with locked():
        name = claim_name(root, args.name, caller, "page")
        (root / name).mkdir(parents=True, exist_ok=True)
        if read_record(root, name) is None:
            write_record(root, name, {**new_record("page", caller), "base": args.name})
    print(root / name)


def cmd_publish(args: argparse.Namespace) -> None:
    if Path(args.directory).is_symlink():
        raise HubError(f"{args.directory} is a symlink; publish the page folder itself")
    folder = Path(os.path.realpath(args.directory))
    root = folder.parent
    is_local = root == Path(os.path.realpath(LOCAL_ROOT))
    if not is_local and (root.name, root.parent.name) != ("artifacts", "agent-memory"):
        raise HubError(f"{folder} is not a page folder made by `hub.py dir`")
    if not (folder / "index.html").is_file():
        raise HubError(f"{folder} has no index.html; render the page first")

    with locked():
        record = read_record(root, folder.name)
        if record is None or record.get("type") != "page":
            raise HubError(f"{folder} has no hub record; make the folder with `hub.py dir`")
        repo = LOCAL_REPO if is_local else register_repo(root.parent.parent)
        record.update(title=args.title, desc=args.desc, by=args.by, state="serving", updated=now())
        write_record(root, folder.name, record)

    ensure()
    page_id = entry_id(repo, record.get("worktree", ""), folder.name)
    print("\n".join(hub_urls(page_path(page_id))))


def cmd_app(args: argparse.Namespace) -> None:
    check_name(args.name)
    if not 0 < args.port < 65536 or args.pid <= 0:
        raise HubError("--port and --pid must be positive, the port below 65536")
    if args.port == PORT:
        raise HubError(f"port {PORT} is the hub itself; register the app's own port")
    # Stop ends the whole tree under the pid, so it must be the app's own, never a parent of this command.
    if args.pid in ancestors(os.getpid()):
        raise HubError(
            f"pid {args.pid} is this command or one of its parents; pass the app's own pid "
            "(start the app with `&` and use `$!`)"
        )
    hub = ping()
    if hub and hub.get("pid") == args.pid:
        raise HubError("that pid is the hub itself; pass the app's own pid")
    url = args.url or f"http://{lan_address() or '127.0.0.1'}:{args.port}/"
    parts = urlsplit(url)
    if parts.scheme not in ("http", "https") or not parts.netloc:
        raise HubError("--url must be an http or https address")
    if not holds_listener(args.pid, args.port):
        raise HubError(
            f"pid {args.pid} (or a process it started) does not listen on port {args.port}"
        )

    caller = current_caller()
    root = root_of(caller)
    with locked():
        repo = LOCAL_REPO if caller.common is None else register_repo(caller.common)
        name = claim_name(root, args.name, caller, "app")
        previous = read_record(root, name)
        record = {
            **new_record("app", caller),
            "base": args.name,
            "title": name,
            "desc": args.desc,
            "by": args.by,
            "state": "running",
            "url": url,
            "port": args.port,
            "pid": args.pid,
            "starttime": start_time(args.pid),
            "cmd": args.cmd,
            "cwd": str(Path(args.cwd or Path.cwd()).resolve()),
        }
        if previous:
            record["created"] = previous.get("created", record["created"])
        write_record(root, name, record)

    ensure()
    print(entry_id(repo, caller.label, name))
    print("\n".join(hub_urls("/")))


def cmd_ensure(_args: argparse.Namespace) -> None:
    ensure()
    print("\n".join(hub_urls("/")))


def cmd_action(args: argparse.Namespace) -> None:
    command = args.command
    if command == "delete" and not args.yes:
        raise HubError("delete needs --yes")

    if args.repo is not None:
        message = run_action(f"{command}-repo", args.repo)
    else:
        message = run_action(command, args.id)
    print(message)
    if command == "resume":
        ensure()
        print("\n".join(hub_urls(page_path(args.id))))


def cmd_list(args: argparse.Namespace) -> None:
    data = catalog()
    data["repos"] = [repo for repo in data["repos"] if args.repo in (None, repo["name"])]
    if args.json:
        print(json.dumps(data, indent=2))
        return
    for repo in data["repos"]:
        for item in repo["items"]:
            print(f"{item['id']}\t{item['kind']}\t{item['state']}\t{item['title']}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawTextHelpFormatter
    )
    commands = parser.add_subparsers(dest="command", required=True)

    dir_parser = commands.add_parser("dir", help="print the folder for a new or revised page")
    dir_parser.add_argument("name")
    dir_parser.set_defaults(func=cmd_dir)

    publish = commands.add_parser("publish", help="serve a rendered page and print its address")
    publish.add_argument("directory")
    publish.add_argument("--title", required=True)
    publish.add_argument("--desc", required=True)
    publish.add_argument("--by", required=True, help='"<harness> · <model>"')
    publish.set_defaults(func=cmd_publish)

    app = commands.add_parser("app", help="register a running app as a link")
    app.add_argument("name")
    app.add_argument("--port", type=int, required=True)
    app.add_argument("--pid", type=int, required=True)
    app.add_argument("--cmd", required=True, help="foreground, self-contained command")
    app.add_argument("--cwd", metavar="DIR")
    app.add_argument("--url")
    app.add_argument("--desc", required=True)
    app.add_argument("--by", required=True)
    app.set_defaults(func=cmd_app)

    for name in ("stop", "resume", "delete", "start"):
        action = commands.add_parser(name, help=f"{name} a page or app by id")
        if name in ("stop", "delete"):
            target = action.add_mutually_exclusive_group(required=True)
            target.add_argument("id", nargs="?")
            target.add_argument("--repo", help="every page and app of this repo")
        else:
            action.add_argument("id")
        if name == "delete":
            action.add_argument("--yes", action="store_true", help="confirm the deletion")
        action.set_defaults(func=cmd_action, repo=None)

    listing = commands.add_parser("list", help="list pages and apps")
    listing.add_argument("--repo")
    listing.add_argument("--json", action="store_true")
    listing.set_defaults(func=cmd_list)

    commands.add_parser("ensure", help="start the hub if it is not running").set_defaults(
        func=cmd_ensure
    )
    commands.add_parser("run", help="run the hub server").set_defaults(func=lambda _args: serve())
    return parser


def main() -> None:
    args = build_parser().parse_args()
    try:
        args.func(args)
    except (HubError, OSError) as error:
        raise SystemExit(f"hub: {error}") from error


if __name__ == "__main__":
    main()
