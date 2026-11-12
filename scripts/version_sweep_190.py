#!/usr/bin/env python3
"""1.8.10 -> 1.9.0 version sweep for the TEST SUITES (the app tree's own
furniture already speaks 1.9.0 — version_furniture_190.py seated it).
Moves every live version pin in the gendex_*.test.mjs fixtures: the
APP/pkg/README equal-pins, the escaped regex pins, the changelog HEAD pins
(the 1.9.0 entry is "The Clear Pane"), and the battery counts (73 -> 74).

The gendex_192 suite is EXCLUDED BY LAW: it is born speaking 1.9.0, and
its 1.8.10 pins are birth pins by design (the changelog's second entry,
the engine seat it guards) — sweeping them would unmoor the laws they pin.

The OLD tag ("The Engine's Own Seat") carries an apostrophe, so its pins
wear two shapes — raw inside regex literals, escaped inside single-quoted
strings — and both shapes are swept here in their own seats (the 1810
lesson, spoken up front). The NEW tag ("The Clear Pane") carries no
apostrophe, so every swept shape lands in its plain form.

Historical notes are LEFT ALONE by the comment skip (the 1.8.10 laws keep
their birth version in the prose where the skip catches them); pins
over-swept inside ok() bodies get reverted to their birth versions by
patch_law_pins_190.py exactly the way the 1.8.4, 1.8.8, 1.8.9 and 1.8.10
passes taught.

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.8.10"
NEW = "1.9.0"
OLD_TAG = "The Engine's Own Seat"
NEW_TAG = "The Clear Pane"
OLD_TAG_ESC = "The Engine\\'s Own Seat"
OLD_TAG_LOW = "the engine's own seat"
NEW_TAG_LOW = "the clear pane"
EXCLUDE = {"gendex_192_batch_dom.test.mjs"}


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
    line = line.replace(f"## {OLD} — {OLD_TAG_ESC}", f"## {NEW} — {NEW_TAG}")
    # the tag quotes / regex forms (the new tag has no apostrophe)
    line = line.replace(f"'{OLD_TAG}'", f"'{NEW_TAG}'")
    line = line.replace(f"/{OLD_TAG}/", f"/{NEW_TAG}/")
    line = line.replace(f"'{OLD_TAG_ESC}'", f"'{NEW_TAG}'")
    # the version digits (quoted + escaped)
    line = line.replace(f"'{OLD}'", f"'{NEW}'")
    line = line.replace(OLD.replace(".", "\\."), NEW.replace(".", "\\."))
    # the battery count (73 -> 74; escaped and plain forms)
    line = line.replace("73 DOM\\/source test suites", "74 DOM\\/source test suites")
    line = line.replace("73 DOM/source test suites", "74 DOM/source test suites")
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
