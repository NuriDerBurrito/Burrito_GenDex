#!/usr/bin/env python3
"""1.5.6 -> 1.5.7 version sweep for the TEST SUITES (the app tree's own
furniture — package.json, package-lock root, constants, README, website —
already speaks 1.5.7). Moves every live version pin in the gendex_*.test.mjs
fixtures: the APP/pkg/README/website equal-pins, the escaped regex pins, the
changelog HEAD pins (the 1.5.7 entry is "The Ghost Learns Its Manners"),
and the "version is X everywhere" titles. Historical notes are LEFT ALONE.
gendex_162 IS swept this time: its only live 1.5.6 pin is the stub-boot's
app.getVersion() (the stamp the compiled main writes must match the version
the app actually runs); its 1.5.5-stamped SEEDED archive is the deliberate
past-version fixture and a 1.5.6 -> 1.5.7 sweep cannot touch it.
gendex_161 additionally carries the TOS_VERSION pin (D1) — '1.0.0' ->
'1.0.1' on that one line (the terms bump; every other '1.0.0' in the tree
is a historical battery label and stays). Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.5.6"
NEW = "1.5.7"
OLD_TAG = "The Door Ships With The House"
NEW_TAG = "The Ghost Learns Its Manners"
OLD_TAG_UP = "THE DOOR SHIPS WITH THE HOUSE"
NEW_TAG_UP = "THE GHOST LEARNS ITS MANNERS"


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
    try:
        raw = path.read_text(encoding="utf8")
    except Exception:
        return False
    lines = raw.split("\n")
    out = [sweep_line(l) for l in lines]
    # 161's TOS_VERSION pin rides its own line (the terms bump 1.0.0 -> 1.0.1);
    # every other '1.0.0' in the fixtures is a historical label and stays.
    if path.name == "gendex_161_compat_legal.test.mjs":
        out = [
            l.replace("export const TOS_VERSION = '1\\.0\\.0';", "export const TOS_VERSION = '1\\.0\\.1';")
            if "TOS_VERSION = '1" in l and "legalSrc" in l
            else l
            for l in out
        ]
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
    if f.name.startswith("gendex_") or f.name in {"version_sweep_157.py"}:
        continue
    if sweep_file(f):
        moved += 1
        print(f"  swept {f.name}")
print(f"{moved} fixture file(s) swept {OLD} -> {NEW} (+ the 161 TOS_VERSION pin 1.0.0 -> 1.0.1)")
