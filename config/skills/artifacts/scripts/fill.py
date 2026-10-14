#!/usr/bin/env python3
"""Write a self-contained artifact page from a JSON data file.

Usage: python3 fill.py <data.json | -> <output.html> [--keep-baseline]

Copies the skill's page.html, replaces its data block with the JSON (read from stdin for `-`),
and copies in the icon catalog from icons.json. The page
already at the output path counts as the version the user last saw: its data becomes
`previous`, `version` goes up by one, and the page marks what changed. `--keep-baseline`
re-renders without moving the baseline, for fixes made before the user sees the new version.
"""

import argparse
import json
import re
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
PAGE = SKILL / "page.html"
ICONS = SKILL / "icons.json"
DATA_BLOCK = re.compile(r'(<script type="application/json" id="data">\n)(.*?)(\n</script>)', re.S)
ICONS_BLOCK = re.compile(r'(<script type="application/json" id="icons">\n)(.*?)(\n</script>)', re.S)
HISTORY_KEYS = ("version", "previous")


def read_embedded_data(page: Path) -> dict | None:
    """Return the data embedded in an existing artifact page, or None when it has none.

    Raises:
        json.JSONDecodeError: The embedded data is corrupt, so the baseline is not lost silently.
    """
    if not page.is_file():
        return None
    found = DATA_BLOCK.search(page.read_text(encoding="utf-8"))
    return json.loads(found[2]) if found else None


def without_history(data: dict) -> dict:
    """Return the content of a data object without its version and baseline."""
    return {key: value for key, value in data.items() if key not in HISTORY_KEYS}


def with_history(data: dict, shown: dict | None, keep_baseline: bool) -> dict:
    """Stamp new data with its version and the baseline the page compares against.

    Args:
        data (dict): The content to show; any version or baseline in it is ignored.
        shown (dict | None): Data of the page now at the output path, if any.
        keep_baseline (bool): Keep the shown page's version and baseline instead of
            treating the shown page as the new baseline.

    Returns:
        dict: The content plus `version` and, from the second version on, `previous`.
    """
    content = without_history(data)
    if shown is None:
        return {**content, "version": 1}

    version = shown.get("version", 1)
    if keep_baseline:
        baseline = {"previous": shown["previous"]} if "previous" in shown else {}
        return {**content, "version": version, **baseline}
    return {**content, "version": version + 1, "previous": without_history(shown)}


def unknown_icons(value, catalog: dict) -> set[str]:
    """Return the `icon` names in the data that the catalog lacks; the page draws nothing for them."""
    if isinstance(value, list):
        return set().union(*(unknown_icons(item, catalog) for item in value))
    if not isinstance(value, dict):
        return set()
    icon = value.get("icon")
    found = {icon} if isinstance(icon, str) and icon not in catalog else set()
    return found.union(*(unknown_icons(item, catalog) for item in value.values()))


def script_json(value: dict) -> str:
    """Return JSON safe inside a script element.

    Every "<" is escaped: "</" would end the element early, and "<!--" before "<script"
    would keep it from closing at its own end tag.
    """
    return json.dumps(value, indent=2, ensure_ascii=False).replace("<", "\\u003c")


def fill_block(page: str, block: re.Pattern, value: dict) -> str:
    """Return the page with one JSON block replaced, failing when the block is missing."""
    page, count = block.subn(lambda m: m[1] + script_json(value) + m[3], page, count=1)
    if count != 1:
        raise SystemExit(f"JSON block {block.pattern[:60]} not found in {PAGE}")
    return page


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("data", help="JSON data file, usually started from templates/, or - for stdin")
    parser.add_argument("output", type=Path, help="HTML file to write")
    parser.add_argument(
        "--keep-baseline",
        action="store_true",
        help="re-render without making the page now at the output path the new baseline",
    )
    args = parser.parse_args()

    source = sys.stdin.read() if args.data == "-" else Path(args.data).read_text(encoding="utf-8")
    data = with_history(json.loads(source), read_embedded_data(args.output), args.keep_baseline)
    icons = json.loads(ICONS.read_text(encoding="utf-8"))
    for name in sorted(unknown_icons(data, icons)):
        print(
            f"warning: icon {name!r} is not in icons.json and draws nothing;"
            " add it (references/templates.md, Icons) or pick another",
            file=sys.stderr,
        )
    # Icons first: the data block comes earlier in the page, so data text cannot fake the icons block.
    page = fill_block(PAGE.read_text(encoding="utf-8"), ICONS_BLOCK, icons)
    page = fill_block(page, DATA_BLOCK, data)

    # Swap a finished file in: a reload during a plain write reads an empty or partial page, and a
    # page cut off before its last script never starts its auto-refresh. The temp file sits beside
    # the resolved output, so a symlinked output keeps its link, and a failed write leaves nothing.
    output = args.output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    temp = output.with_name(f".{output.name}.tmp")
    try:
        temp.write_text(page, encoding="utf-8")
        temp.replace(output)
    finally:
        temp.unlink(missing_ok=True)
    print(args.output)


if __name__ == "__main__":
    main()
