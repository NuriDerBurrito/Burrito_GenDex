#!/usr/bin/env python3
"""1.4.9 -> 1.5.4 version sweep for the TEST SUITES (the app tree's own
furniture — package.json, constants, README, START.bat, website — already
speaks 1.5.4). Moves every live version pin in the gendex_*.test.mjs
fixtures: the APP/pkg/lock equal-pins, the escaped regex pins, the CURRENT
gate arrays, the changelog HEAD pins, the website tagline pins, the zip
links and the "version is X everywhere" titles. Historical notes are LEFT
ALONE. Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.4.9"
NEW = "1.5.4"
OLD_TAG = "The Ink Signs Its X"
NEW_TAG = "The Window Is Already There"
OLD_TAG_UP = "THE INK SIGNS ITS X"
NEW_TAG_UP = "THE WINDOW IS ALREADY THERE"


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
    line = line.replace(f"## {OLD} — {OLD_TAG}", f"## {NEW} — {NEW_TAG}")
    line = line.replace(f"## {OLD} — {OLD_TAG}".replace(".", "\\."), f"## {NEW} — {NEW_TAG}".replace(".", "\\."))
    line = line.replace(f"'{OLD_TAG_UP}'", f"'{NEW_TAG_UP}'")
    line = line.replace(f"/{OLD_TAG_UP}/", f"/{NEW_TAG_UP}/")
    line = line.replace(f"'{OLD}'", f"'{NEW}'")
    line = line.replace(OLD.replace(".", "\\."), NEW.replace(".", "\\."))
    if "assert" in line or "includes(" in line or "startsWith(" in line or "endsWith(" in line:
        line = re.sub(r"(?<=[vV(])" + re.escape(OLD) + r"(?=[_s<)' /])", NEW, line)
        line = line.replace(f"Burrito_GenDex_{OLD}_source.zip", f"Burrito_GenDex_{NEW}_source.zip")
        line = line.replace(f"Burrito%GenDex-{OLD}%Setup.exe", f"Burrito%GenDex-{NEW}%Setup.exe")
    line = line.replace("var CURRENT = [1, 4, 9];", "var CURRENT = [1, 5, 4];")
    line = line.replace("var CURRENT = \\[1, 4, 9\\];", "var CURRENT = \\[1, 5, 4\\];")
    return line


def sweep_file(path: Path) -> bool:
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
    if f.name.startswith("gendex_"):
        continue
    if sweep_file(f):
        moved += 1
        print(f"  swept {f.name}")
print(f"{moved} fixture file(s) swept {OLD} -> {NEW}")
