#!/usr/bin/env python3
"""1.9.16 -> 1.9.17 version sweep for the TEST SUITES (the app tree's own
furniture already speaks 1.9.17 — version_furniture_1917.py seated it;
this sweep follows the standing law of every release).
Moves every live version pin in the gendex_*.test.mjs fixtures: the
APP/pkg/README equal-pins, the escaped regex pins, the changelog HEAD pins
(the 1.9.17 entry is "The Middle Belongs to the Switcher"), the jsdom boots'
lastRun seats, and the battery counts (90 -> 91).

The gendex_1917 suite is EXCLUDED BY LAW: it is born speaking 1.9.17, and
its pins are birth pins by design; sweeping them would unmoor the laws
they pin.

The tag ("The Middle Belongs to the Switcher") carries no apostrophe, so
every swept shape lands in its plain form.

Known collateral (healed by patch_law_pins_1917.py, exactly as every
release heals its own): the digit pass over-carries the PREVIOUS suite's
law-birth pins (the 1916 suite's `1.9.16 — THE ...` markers, which live
in the source stamped 1.9.16 forever as comment history), and the plain
`readme.includes('version-1.9.16-purple')` badge shapes the regex passes
never touch (the 192-196 breed).

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.9.16"
NEW = "1.9.17"
OLD_TAG = "The Wall Waits for the Open"
NEW_TAG = "The Middle Belongs to the Switcher"
EXCLUDE = {"gendex_1917_batch_dom.test.mjs"}


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
    # the tag quotes / regex forms (the tag carries no apostrophe)
    line = line.replace(f"'{OLD_TAG}'", f"'{NEW_TAG}'")
    line = line.replace(f"/{OLD_TAG}/", f"/{NEW_TAG}/")
    # the version digits (quoted + escaped) — this also carries the jsdom
    # boots' lastRun seats (a lastRun that equals the current version must
    # not read as an update)
    line = line.replace(f"'{OLD}'", f"'{NEW}'")
    line = line.replace(OLD.replace(".", "\\."), NEW.replace(".", "\\."))
    # the battery count (90 -> 91; escaped and plain forms)
    line = line.replace("90 DOM\\/source test suites", "91 DOM\\/source test suites")
    line = line.replace("90 DOM/source test suites", "91 DOM/source test suites")
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
