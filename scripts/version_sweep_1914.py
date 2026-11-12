#!/usr/bin/env python3
"""1.9.13 -> 1.9.14 version sweep for the TEST SUITES (the app tree's own
furniture already speaks 1.9.14 — version_furniture_1914.py seated it;
this sweep follows the standing law of every release).
Moves every live version pin in the gendex_*.test.mjs fixtures: the
APP/pkg/README equal-pins, the escaped regex pins, the changelog HEAD pins
(the 1.9.14 entry is "The Shadow Keeps Its Ink"), the jsdom boots' lastRun
seats, and the battery counts (87 -> 88).

The gendex_1914 suite is EXCLUDED BY LAW: it is born speaking 1.9.14, and
its pins are birth pins by design; sweeping them would unmoor the laws
they pin.

The tag ("The Shadow Keeps Its Ink") carries no apostrophe, so every swept
shape lands in its plain form.

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.9.13"
NEW = "1.9.14"
OLD_TAG = "The Ring Keeps Its Width"
NEW_TAG = "The Shadow Keeps Its Ink"
EXCLUDE = {"gendex_1914_batch_dom.test.mjs"}


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
    # the battery count (87 -> 88; escaped and plain forms)
    line = line.replace("87 DOM\\/source test suites", "88 DOM\\/source test suites")
    line = line.replace("87 DOM/source test suites", "88 DOM/source test suites")
    return line


def main() -> None:
    suites = sorted((ROOT / "scripts").glob("gendex_*.test.mjs"))
    moved = 0
    for suite in suites:
        if suite.name in EXCLUDE:
            print(f"  {suite.name}: EXCLUDED (birth pins)")
            continue
        raw = suite.read_text(encoding="utf8")
        swept = "\n".join(sweep_line(l) for l in raw.split("\n"))
        if swept != raw:
            suite.write_text(swept, encoding="utf8")
            moved += 1
            print(f"  {suite.name}: swept")
        else:
            print(f"  {suite.name}: no pins")
    print(f"sweep done: {moved} suites moved {OLD} -> {NEW} (tag: {NEW_TAG})")


if __name__ == "__main__":
    main()
