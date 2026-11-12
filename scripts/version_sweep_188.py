#!/usr/bin/env python3
"""1.8.6 -> 1.8.8 version sweep for the TEST SUITES (the app tree's own
furniture already speaks 1.8.8 — built from the 1.8.6 tree, the 1.8.7
line discarded). Moves every live version pin in the gendex_*.test.mjs
fixtures: the APP/pkg/README equal-pins, the escaped regex pins, the
changelog HEAD pins (the 1.8.8 entry is "The Layout Census"), the
lowercase README-paragraph tagline pins, and the battery counts
(70 -> 71).

1.8.8 has NO website hero pins to sweep — the page retired with the
final release (retire_web_pins_188.py already spoke that), and the
retired comment lines are left alone by the comment skip, keeping the
history they tell.

Historical notes are LEFT ALONE by the comment skip (the 1.8.6 laws keep
their birth version in the prose where the skip catches them); pins
over-swept inside ok() bodies get reverted to their birth versions by
patch_law_pins_188.py's second pass exactly the way the 1.8.4 pass taught.

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.8.6"
NEW = "1.8.8"
OLD_TAG = "The Patient Wheel"
NEW_TAG = "The Layout Census"
OLD_TAG_LOW = "the patient wheel"
NEW_TAG_LOW = "the layout census"


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
    # the tag quotes / regex forms
    line = line.replace(f"'{OLD_TAG}'", f"'{NEW_TAG}'")
    line = line.replace(f"/{OLD_TAG}/", f"/{NEW_TAG}/")
    # the version digits (quoted + escaped)
    line = line.replace(f"'{OLD}'", f"'{NEW}'")
    line = line.replace(OLD.replace(".", "\\."), NEW.replace(".", "\\."))
    # the battery count (70 -> 71; escaped and plain forms)
    line = line.replace("70 DOM\\/source test suites", "71 DOM\\/source test suites")
    line = line.replace("70 DOM/source test suites", "71 DOM/source test suites")
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
