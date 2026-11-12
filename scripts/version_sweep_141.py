#!/usr/bin/env python3
"""1.4.0 -> 1.4.1 version sweep for the TEST SUITES (the app tree's own
furniture — package.json, lock, constants, README, START.bat, website —
already speaks 1.4.1). Moves every live version pin in the
gendex_*.test.mjs fixtures: the APP/pkg/lock equal-pins, the escaped
regex pins, the CURRENT gate arrays, the changelog HEAD pins, the
website tagline pins, the zip links and the "version is X everywhere"
titles. Historical notes are LEFT ALONE. Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.4.0"
NEW = "1.4.1"
OLD_TAG = "The Shader Coat"
NEW_TAG = "The Living Card"
OLD_TAG_UP = "THE SHADER COAT"
NEW_TAG_UP = "THE LIVING CARD"


def sweep_line(line: str) -> str:
    stripped = line.lstrip()
    if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
        if f"the version is {OLD} everywhere" in line:
            line = line.replace(f"the version is {OLD} everywhere", f"the version is {NEW} everywhere")
        if f"THE VERSION IS {OLD} EVERYWHERE" in line:
            line = line.replace(f"THE VERSION IS {OLD} EVERYWHERE", f"THE VERSION IS {NEW} EVERYWHERE")
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
    line = line.replace("var CURRENT = [1, 4, 0];", "var CURRENT = [1, 4, 1];")
    line = line.replace("var CURRENT = \\[1, 4, 0\\];", "var CURRENT = \\[1, 4, 1\\];")
    line = line.replace(f"the version is {OLD} everywhere", f"the version is {NEW} everywhere")
    return line


def main():
    total = 0
    for t in sorted((ROOT / "scripts").glob("gendex_*.test.mjs")):
        src = t.read_text(encoding="utf-8")
        out_lines = [sweep_line(ln) for ln in src.split("\n")]
        out = "\n".join(out_lines)
        if out != src:
            n = sum(1 for a, b in zip(src.split("\n"), out_lines) if a != b)
            t.write_text(out, encoding="utf-8")
            print(f"{t.name}: {n} lines")
            total += n
    print(f"TOTAL lines moved: {total}")


if __name__ == "__main__":
    main()
