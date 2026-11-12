#!/usr/bin/env python3
"""1.8.8 -> 1.8.9 version sweep for the TEST SUITES (the app tree's own
furniture already speaks 1.8.9 — version_furniture_189.py seated it, and
the README was written whole as the public face). Moves every live version
pin in the gendex_*.test.mjs fixtures: the APP/pkg/README equal-pins, the
escaped regex pins, the changelog HEAD pins (the 1.8.9 entry is "The
Library's Own House"), and the battery counts (71 -> 72).

The README's version-roll paragraphs are GONE by law in 1.8.9 (the public
face carries no version history), so the swept lowercase tagline pins
(`^1.8.9 — the library's own house.`) are retired to the public-face
absence law by patch_law_pins_189.py's second pass, together with every
older paragraph pin that watched the retired roll.

Historical notes are LEFT ALONE by the comment skip (the 1.8.8 laws keep
their birth version in the prose where the skip catches them); pins
over-swept inside ok() bodies get reverted to their birth versions by
patch_law_pins_189.py's second pass exactly the way the 1.8.4 and 1.8.8
passes taught.

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.8.8"
NEW = "1.8.9"
OLD_TAG = "The Layout Census"
NEW_TAG = "The Library's Own House"
OLD_TAG_LOW = "the layout census"
NEW_TAG_LOW = "the library's own house"


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
    # the battery count (71 -> 72; escaped and plain forms)
    line = line.replace("71 DOM\\/source test suites", "72 DOM\\/source test suites")
    line = line.replace("71 DOM/source test suites", "72 DOM/source test suites")
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
