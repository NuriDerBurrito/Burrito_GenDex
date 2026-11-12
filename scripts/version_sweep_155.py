#!/usr/bin/env python3
"""1.5.4 -> 1.5.5 version sweep for the TEST SUITES (the app tree's own
furniture — package.json, constants, README, website — already speaks
1.5.5). Moves every live version pin in the gendex_*.test.mjs fixtures:
the APP/pkg/README/website equal-pins, the escaped regex pins, the
changelog HEAD pins (the 1.5.5 entry is "The Archive Keeps Its Promise"),
and the "version is X everywhere" titles (including 159's own stale
1.4.9-born title, which the 154 sweep missed because it lived inside an
ok() label rather than a comment). Historical notes are LEFT ALONE. Run
from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.5.4"
NEW = "1.5.5"
OLD_TAG = "The Window Is Already There"
NEW_TAG = "The Archive Keeps Its Promise"
OLD_TAG_UP = "THE WINDOW IS ALREADY THERE"
NEW_TAG_UP = "THE ARCHIVE KEEPS ITS PROMISE"


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
    # the ok() labels the 154 sweep missed (159 carries a 1.4.9-born title)
    line = line.replace(f"'the version is 1.4.9 everywhere'", f"'the version is {NEW} everywhere'")
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
