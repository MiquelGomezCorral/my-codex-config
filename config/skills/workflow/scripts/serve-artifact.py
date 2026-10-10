#!/usr/bin/env python3
"""Serve one artifact directory over HTTP on the shared artifact port range.

Usage: python3 serve-artifact.py --directory <artifact-directory> [--port 3100]

Prints the local URL, then the LAN URL when the machine has a route out, then a bind note.
"""

import argparse
import errno
import functools
import os
import socket
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

FIRST_PORT = 3100
LAST_PORT = 3199
ROUTE_PROBE = ("8.8.8.8", 80)


class ArtifactDirectoryHandler(SimpleHTTPRequestHandler):
    """Serve the artifact directory without following symlinks outside it."""

    def send_head(self):
        """Refuse requests whose real path escapes the served directory."""
        requested = super().translate_path(self.path)
        served_paths = [requested]
        if os.path.isdir(requested):
            for name in ("index.html", "index.htm"):
                index = os.path.join(requested, name)
                if os.path.isfile(index):
                    served_paths.append(index)
                    break
        root = os.path.realpath(self.directory)
        if any(os.path.commonpath((root, os.path.realpath(path))) != root for path in served_paths):
            self.send_error(404, "File not found")
            return None
        return super().send_head()


def parse_arguments():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", required=True, help="artifact directory to serve")
    parser.add_argument(
        "--port", type=int, default=FIRST_PORT, help=f"first port to try ({FIRST_PORT}-{LAST_PORT})"
    )
    args = parser.parse_args()

    if not os.path.isdir(args.directory):
        parser.error(f"--directory is not an existing directory: {args.directory}")
    if not FIRST_PORT <= args.port <= LAST_PORT:
        parser.error(f"--port must be between {FIRST_PORT} and {LAST_PORT}")
    return os.path.realpath(args.directory), args.port


def lan_address():
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


def serve(directory, first_port):
    handler = functools.partial(ArtifactDirectoryHandler, directory=directory)
    for port in range(first_port, LAST_PORT + 1):
        try:
            server = ThreadingHTTPServer(("0.0.0.0", port), handler)
        except OSError as error:
            if error.errno == errno.EADDRINUSE:
                continue
            raise SystemExit(f"serve failed: {error}") from error
        break
    else:
        raise SystemExit(f"serve failed: ports {first_port}-{LAST_PORT} are all in use")

    bound_port = server.server_address[1]
    print(f"http://127.0.0.1:{bound_port}/", flush=True)
    address = lan_address()
    if address:
        print(f"http://{address}:{bound_port}/", flush=True)
    print(
        f"bound 0.0.0.0:{bound_port}; remote clients use this machine's "
        "observed host/IP with the same port",
        flush=True,
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    directory, port = parse_arguments()
    serve(directory, port)
