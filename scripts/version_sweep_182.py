#!/usr/bin/env python3
"""1.8.1 -> 1.8.2 version sweep for the TEST SUITES (the app tree's own
furniture already speaks 1.8.2). Moves every live version pin in the
gendex_*.test.mjs fixtures: the APP/pkg/README/website equal-pins, the
escaped regex pins, the changelog HEAD pins (the 1.8.2 entry is "The
Still Wall"), the lowercase README-paragraph tagline pins, the all-caps
website-hero pins, the battery counts (65 -> 66), and the "version is X
everywhere" titles. Historical notes are LEFT ALONE (the 1.8.1 laws keep
their birth version in the prose).

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.8.1"
NEW = "1.8.2"
OLD_TAG = "The Soft Chrome"
NEW_TAG = "The Still Wall"
OLD_TAG_LOW = "the soft chrome"
NEW_TAG_LOW = "the still wall"
OLD_HERO = "THE SOFT CHROME"
NEW_HERO = "THE STILL WALL"


def sweep_line(line: str) -> str:
    stripped = line.lstrip()
    if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
        if f"the version is {OLD} everywhere" in line:
            line = line.replace(f"the version is {OLD} everywhere", f"the version is {NEW} everywhere")
        return line
    # the ok() titles
    line = line.replace(f"'the version is {OLD} everywhere'", f"'the version is {NEW} everywhere'")
    # the changelog HEAD pins (title case, plain + escaped)
    line = line.replace(f"## {OLD} — {OLD_TAG}", f"## {NEW} — {NEW_TAG}")
    line = line.replace(f"## {OLD} — {OLD_TAG}".replace(".", "\\."), f"## {NEW} — {NEW_TAG}".replace(".", "\\."))
    # the README paragraph pins (lowercase tagline, plain + escaped)
    line = line.replace(f"{OLD} — {OLD_TAG_LOW}", f"{NEW} — {NEW_TAG_LOW}")
    line = line.replace(f"{OLD} — {OLD_TAG_LOW}".replace(".", "\\."), f"{NEW} — {NEW_TAG_LOW}".replace(".", "\\."))
    # the website hero pins (all caps)
    line = line.replace(OLD_HERO, NEW_HERO)
    # the tag quotes / regex forms
    line = line.replace(f"'{OLD_TAG}'", f"'{NEW_TAG}'")
    line = line.replace(f"/{OLD_TAG}/", f"/{NEW_TAG}/")
    # the version digits (quoted + escaped)
    line = line.replace(f"'{OLD}'", f"'{NEW}'")
    line = line.replace(OLD.replace(".", "\\."), NEW.replace(".", "\\."))
    # the battery count (65 -> 66; escaped and plain forms)
    line = line.replace("65 DOM\\/source test suites", "66 DOM\\/source test suites")
    line = line.replace("65 DOM/source test suites", "66 DOM/source test suites")
    if "assert" in line or "includes(" in line or "startsWith(" in line or "endsWith(" in line:
        line = re.sub(r"(?<=[vV(])" + re.escape(OLD) + r"(?=[_s<)' /*])", NEW, line)
        line = line.replace(f"**v{OLD}**", f"**v{NEW}**")
    return line


def main() -> None:
    files = sorted(ROOT.glob("scripts/gendex_*.test.mjs"))
    touched = 0
    for p in files:
        try:
            raw = p.read_text(encoding="utf8")
        except Exception:
            continue
        out = "\n".join(sweep_line(l) for l in raw.split("\n"))
        if out != raw:
            p.write_text(out, encoding="utf8")
            touched += 1
            print(f"  swept {p.name}")
    print(f"swept {touched} of {len(files)} suites")


if __name__ == "__main__":
    main()
