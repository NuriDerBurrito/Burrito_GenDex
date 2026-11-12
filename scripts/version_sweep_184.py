#!/usr/bin/env python3
"""1.8.3 -> 1.8.4 version sweep for the TEST SUITES (the app tree's own
furniture already speaks 1.8.4). Moves every live version pin in the
gendex_*.test.mjs fixtures: the APP/pkg/README/website equal-pins, the
escaped regex pins, the changelog HEAD pins (the 1.8.4 entry is "The
Cover"), the lowercase README-paragraph tagline pins, the all-caps
website-hero pins, the battery counts (67 -> 68), and the "version is X
everywhere" titles. Historical notes are LEFT ALONE (the 1.8.3 laws keep
their birth version in the prose — patch_law_pins_184.py reverts the
over-swept note pins and re-pins the superseded same-breath give-back
law to the seat the cover holds).

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.8.3"
NEW = "1.8.4"
OLD_TAG = "The Same Breath"
NEW_TAG = "The Cover"
OLD_TAG_LOW = "the same breath"
NEW_TAG_LOW = "the cover"
OLD_HERO = "THE SAME BREATH"
NEW_HERO = "THE COVER"


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
    # the battery count (67 -> 68; escaped and plain forms)
    line = line.replace("67 DOM\\/source test suites", "68 DOM\\/source test suites")
    line = line.replace("67 DOM/source test suites", "68 DOM/source test suites")
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
