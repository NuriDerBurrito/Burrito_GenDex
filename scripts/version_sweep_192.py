#!/usr/bin/env python3
"""1.9.0 -> 1.9.1 version sweep for the TEST SUITES (the app tree's own
furniture already speaks 1.9.1 — the seats were moved by hand this pass).
Moves every live version pin in the gendex_*.test.mjs fixtures: the
APP/pkg/README equal-pins, the escaped regex pins, the changelog HEAD pins
(the 1.9.1 entry is "The Paper House"), and the battery counts (74 -> 75).

The gendex_192 suite is EXCLUDED BY LAW: it is born speaking 1.9.1, and its
1.9.0 pins are birth pins by design (the translation fixture's appVersion —
the OLD app's own word, read out of the SQLite snapshot — stays 1.9.0
forever); sweeping them would unmoor the laws they pin.

Both tags ("The Clear Pane" / "The Paper House") carry no apostrophe, so
every swept shape lands in its plain form.

Historical notes are LEFT ALONE by the comment skip (the 1.9.0 laws keep
their birth version in the prose where the skip catches them); the seats
whose laws themselves MOVED this release (the paper house's live seats in
suite 190, the reveal law's roads in suite 187) are re-worded by
patch_law_pins_192.py, exactly the way the 1.8.4, 1.8.8, 1.8.9, 1.8.10 and
1.9.0 passes taught.

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.9.0"
NEW = "1.9.1"
OLD_TAG = "The Clear Pane"
NEW_TAG = "The Paper House"
EXCLUDE = {"gendex_192_batch_dom.test.mjs"}


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
    # the battery count (74 -> 75; escaped and plain forms)
    line = line.replace("74 DOM\\/source test suites", "75 DOM\\/source test suites")
    line = line.replace("74 DOM/source test suites", "75 DOM/source test suites")
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
