#!/usr/bin/env python3
"""1.8.9 -> 1.8.10 version sweep for the TEST SUITES (the app tree's own
furniture already speaks 1.8.10 — version_furniture_1810.py seated it).
Moves every live version pin in the gendex_*.test.mjs fixtures: the
APP/pkg/README equal-pins, the escaped regex pins, the changelog HEAD pins
(the 1.8.10 entry is "The Engine's Own Seat"), and the battery counts
(72 -> 73).

The gendex_191 suite is EXCLUDED BY LAW: it is born speaking 1.8.10, and
its 1.8.9 pins are birth pins by design (the changelog's second entry, the
legacy seeds the import door folds in) — sweeping them would unmoor the
laws they pin.

The 1.8.10 pass carries one lesson the 1.8.9 pass learned too late to
teach its own sweep: the OLD tag ("The Library's Own House") carries an
apostrophe, so pins wear it in two shapes — raw inside regex literals,
escaped inside single-quoted strings — and both shapes are swept here in
their own seats (the 189 pass had to fix the escaped shape in a third
pass; this pass speaks it up front). The NEW tag ("The Engine's Own
Seat") carries an apostrophe too, so the swept single-quoted pins get the
escaped form directly.

Historical notes are LEFT ALONE by the comment skip (the 1.8.9 laws keep
their birth version in the prose where the skip catches them); pins
over-swept inside ok() bodies get reverted to their birth versions by
patch_law_pins_1810.py exactly the way the 1.8.4, 1.8.8 and 1.8.9 passes
taught.

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.8.9"
NEW = "1.8.10"
OLD_TAG = "The Library's Own House"
NEW_TAG = "The Engine's Own Seat"
OLD_TAG_ESC = "The Library\\'s Own House"
NEW_TAG_ESC = "The Engine\\'s Own Seat"
OLD_TAG_LOW = "the library's own house"
NEW_TAG_LOW = "the engine's own seat"
EXCLUDE = {"gendex_191_batch_dom.test.mjs"}


def sweep_line(line: str) -> str:
    stripped = line.lstrip()
    if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
        if f"the version is {OLD} everywhere" in line:
            line = line.replace(f"the version is {OLD} everywhere", f"the version is {NEW} everywhere")
        return line
    # the ok() titles
    line = line.replace(f"'the version is {OLD} everywhere'", f"'the version is {NEW} everywhere'")
    # the changelog HEAD pins — plain shape (raw apostrophe, plain dots)
    line = line.replace(f"## {OLD} — {OLD_TAG}", f"## {NEW} — {NEW_TAG}")
    # the changelog HEAD pins — regex shape (raw apostrophe, escaped dots)
    line = line.replace(f"## {OLD} — {OLD_TAG}".replace(".", "\\."), f"## {NEW} — {NEW_TAG}".replace(".", "\\."))
    # the changelog HEAD pins — single-quoted shape (ESCAPED apostrophe, plain dots)
    line = line.replace(f"## {OLD} — {OLD_TAG_ESC}", f"## {NEW} — {NEW_TAG_ESC}")
    # the tag quotes / regex forms
    line = line.replace(f"'{OLD_TAG}'", f"'{NEW_TAG}'")
    line = line.replace(f"/{OLD_TAG}/", f"/{NEW_TAG}/")
    # the version digits (quoted + escaped)
    line = line.replace(f"'{OLD}'", f"'{NEW}'")
    line = line.replace(OLD.replace(".", "\\."), NEW.replace(".", "\\."))
    # the battery count (72 -> 73; escaped and plain forms)
    line = line.replace("72 DOM\\/source test suites", "73 DOM\\/source test suites")
    line = line.replace("72 DOM/source test suites", "73 DOM/source test suites")
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
