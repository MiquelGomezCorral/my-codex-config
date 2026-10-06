#!/usr/bin/env python3
"""Write a self-contained artifact page from a JSON data file.

Usage: python3 fill.py <data.json> <output.html>

Copies the skill's page.html and replaces its data block with the validated JSON.
"""

import argparse
import json
import re
from pathlib import Path

PAGE = Path(__file__).resolve().parent.parent / "page.html"
DATA_BLOCK = re.compile(r'(<script type="application/json" id="data">\n).*?(\n</script>)', re.S)


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("data", type=Path, help="JSON data file, usually started from templates/")
    parser.add_argument("output", type=Path, help="HTML file to write")
    args = parser.parse_args()

    data = json.loads(args.data.read_text(encoding="utf-8"))
    # "</" inside the block would end the script element early, so escape it as JSON allows.
    block = json.dumps(data, indent=2, ensure_ascii=False).replace("</", "<\\/")
    page, count = DATA_BLOCK.subn(lambda m: m[1] + block + m[2], PAGE.read_text(encoding="utf-8"), count=1)
    if count != 1:
        raise SystemExit(f"Data block not found in {PAGE}")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(page, encoding="utf-8")
    print(args.output)


if __name__ == "__main__":
    main()
