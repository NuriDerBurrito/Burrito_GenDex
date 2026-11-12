#!/usr/bin/env python3
"""1.9.2 -> 1.9.3 version sweep for the TEST SUITES (the app tree's own
furniture already speaks 1.9.3 — the seats were moved by
version_furniture_193.py this pass).
Moves every live version pin in the gendex_*.test.mjs fixtures: the
APP/pkg/README equal-pins, the escaped regex pins, the changelog HEAD pins
(the 1.9.3 entry is "The Speaking Coat"), and the battery counts
(76 -> 77).

The gendex_194 suite is EXCLUDED BY LAW: it is born speaking 1.9.3, and its
pins are birth pins by design; sweeping them would unmoor the laws they
pin.

Both tags ("The Listening Ground" / "The Speaking Coat") carry no
apostrophe, so every swept shape lands in its plain form.

Historical notes are LEFT ALONE by the comment skip (the 1.9.2 laws keep
their birth version in the prose where the skip catches them); the seats
whose laws themselves MOVED this release (the 169 suite's artfin stop
pins, the 172 suite's calligraphic X pin) are re-worded by
patch_law_pins_194.py, exactly the way the 1.8.4, 1.8.8, 1.8.9, 1.8.10,
1.9.0, 1.9.1 and 1.9.2 passes taught.

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.9.2"
NEW = "1.9.3"
OLD_TAG = "The Listening Ground"
NEW_TAG = "The Speaking Coat"
EXCLUDE = {"gendex_194_batch_dom.test.mjs"}


def sweep_line(line: str) -> str:
    stripped = line.lstrip()
    if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
        if f"the version is {OLD} everywhere" in line:
            line = line.replace(f"the version is {OLD} everywhere", f"the version is {NEW} everywhere")
        return line
    # the ok() titles
    line = line.replace(f"'the version is {OLD} everywhere'", f"'the version is {NEW} everywhere'")
    # the changelog HEAD pins — plain shape (plain dots)
    line = line.replace(f"## {OLD} — {OLD_TAG}", f"## {NEW} — {NEW_TAG}")
    # the changelog HEAD pins — regex shape (escaped dots)
    line = line.replace(f"## {OLD} — {OLD_TAG}".replace(".", "\\."), f"## {NEW} — {NEW_TAG}".replace(".", "\\."))
    # the tag quotes / regex forms (neither tag carries an apostrophe)
    line = line.replace(f"'{OLD_TAG}'", f"'{NEW_TAG}'")
    line = line.replace(f"/{OLD_TAG}/", f"/{NEW_TAG}/")
    # the version digits (quoted + escaped)
    line = line.replace(f"'{OLD}'", f"'{NEW}'")
    line = line.replace(OLD.replace(".", "\\."), NEW.replace(".", "\\."))
    # the battery count (76 -> 77; escaped and plain forms)
    line = line.replace("76 DOM\\/source test suites", "77 DOM\\/source test suites")
    line = line.replace("76 DOM/source test suites", "77 DOM/source test suites")
    if "assert" in line or "includes(" in line or "startsWith(" in line or "endsWith(" in line:
        line = re.sub(r"(?<=[vV(])" + re.escape(OLD) + r"(?=[_s<)' /*])", NEW, line)
        line = line.replace(f"**v{OLD}**", f"**v{NEW}**")
    return line


def main() -> None:
    files = sorted(p for p in ROOT.glob("scripts/gendex_*.test.mjs") if p.name not in EXCLUDE)
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
