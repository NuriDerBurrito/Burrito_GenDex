#!/usr/bin/env python3
"""1.5.5 -> 1.5.6 version sweep for the TEST SUITES (the app tree's own
furniture — package.json, package-lock root, constants, README, website —
already speaks 1.5.6). Moves every live version pin in the gendex_*.test.mjs
fixtures: the APP/pkg/README/website equal-pins, the escaped regex pins, the
changelog HEAD pins (the 1.5.6 entry is "The Door Ships With The House"),
and the "version is X everywhere" titles. Historical notes are LEFT ALONE.
gendex_162 (the new packaging battery) is SKIPPED BY DESIGN: its C2 fixture
deliberately seeds a 1.5.5-stamped archive — a past-version database reading
whole inside the current app is the compatibility story itself, and sweeping
it would erase the point. Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.5.5"
NEW = "1.5.6"
OLD_TAG = "The Archive Keeps Its Promise"
NEW_TAG = "The Door Ships With The House"
OLD_TAG_UP = "THE ARCHIVE KEEPS ITS PROMISE"
NEW_TAG_UP = "THE DOOR SHIPS WITH THE HOUSE"
SKIP = {"gendex_162_pack_main.test.mjs"}


def sweep_line(line: str) -> str:
    stripped = line.lstrip()
    if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
        if f"the version is {OLD} everywhere" in line:
            line = line.replace(f"the version is {OLD} everywhere", f"the version is {NEW} everywhere")
        if f"THE VERSION IS {OLD} EVERYWHERE" in line:
            line = line.replace(f"THE VERSION IS {OLD} EVERYWHERE", f"THE VERSION IS {NEW} EVERYWHERE")
        if "Plus: the version is" in line:
            line = line.replace(f"the version is {OLD} everywhere", f"the version is {NEW} everywhere")
        return line
    # the ok() labels (159 carries an older-born title from the 154 sweep)
    line = line.replace(f"'the version is {OLD} everywhere'", f"'the version is {NEW} everywhere'")
    line = line.replace(f"## {OLD} — {OLD_TAG}", f"## {NEW} — {NEW_TAG}")
    line = line.replace(f"## {OLD} — {OLD_TAG}".replace(".", "\\."), f"## {NEW} — {NEW_TAG}".replace(".", "\\."))
    line = line.replace(f"'{OLD_TAG_UP}'", f"'{NEW_TAG_UP}'")
    line = line.replace(f"/{OLD_TAG_UP}/", f"/{NEW_TAG_UP}/")
    line = line.replace(f"'{OLD}'", f"'{NEW}'")
    line = line.replace(OLD.replace(".", "\\."), NEW.replace(".", "\\."))
    if "assert" in line or "includes(" in line or "startsWith(" in line or "endsWith(" in line:
        line = re.sub(r"(?<=[vV(])" + re.escape(OLD) + r"(?=[_s<)' /*])", NEW, line)
        line = line.replace(f"**v{OLD}**", f"**v{NEW}**")
        line = line.replace(f"Burrito_GenDex_{OLD}_source.zip", f"Burrito_GenDex_{NEW}_source.zip")
        line = line.replace(f"Burrito%GenDex-{OLD}%Setup.exe", f"Burrito%GenDex-{NEW}%Setup.exe")
    return line


def sweep_file(path: Path) -> bool:
    if path.name in SKIP:
        return False
    try:
        raw = path.read_text(encoding="utf8")
    except Exception:
        return False
    lines = raw.split("\n")
    out = [sweep_line(l) for l in lines]
    if out != lines:
        path.write_text("\n".join(out), encoding="utf8")
        return True
    return False


moved = 0
for f in sorted(ROOT.glob("scripts/gendex_*.test.mjs")):
    if sweep_file(f):
        moved += 1
        print(f"  swept {f.name}")
for f in sorted(ROOT.glob("scripts/*.mjs")):
    if f.name.startswith("gendex_") or f.name in SKIP:
        continue
    if sweep_file(f):
        moved += 1
        print(f"  swept {f.name}")
print(f"{moved} fixture file(s) swept {OLD} -> {NEW} (gendex_162 skipped by design)")
