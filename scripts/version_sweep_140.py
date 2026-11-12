#!/usr/bin/env python3
"""1.3.9 -> 1.4.0 version sweep for the TEST SUITES (the app tree's own
furniture — package.json, lock, constants, README, START.bat, website —
already speaks 1.4.0). Moves every live version pin in the
gendex_*.test.mjs fixtures: the APP/pkg/lock equal-pins, the escaped
regex pins (package.json/README/START.bat/website/lock), the CURRENT
gate arrays, the changelog HEAD pins (## 1.4.0 — The Shader Coat), the
website tagline pins (THE SHADER COAT), the splash V-literal, the zip
links, the "version is X everywhere" titles, and the last-run fixture.
Historical notes ("1.3.9 supersede", "1.3.9:", "since 1.3.9", "the
1.3.9 batch") are LEFT ALONE — they document when a law was written.
Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.3.9"
NEW = "1.4.0"
OLD_TAG = "The Living Coat"
NEW_TAG = "The Shader Coat"
OLD_TAG_UP = "THE LIVING COAT"
NEW_TAG_UP = "THE SHADER COAT"


def sweep_line(line: str) -> str:
    # comment-only lines and historical notes keep their history — the
    # sweep only moves PIN content (asserted literals, quoted pins, the
    # setItem fixture, the suite titles that describe the current check)
    stripped = line.lstrip()
    if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
        # the suite headers that DESCRIBE the current expectation move;
        # true history (supersede notes, era notes) stays
        if "the version is 1.3.9 everywhere" in line:
            line = line.replace("the version is 1.3.9 everywhere", "the version is 1.4.0 everywhere")
        if "THE VERSION IS 1.3.9 EVERYWHERE" in line:
            line = line.replace("THE VERSION IS 1.3.9 EVERYWHERE", "THE VERSION IS 1.4.0 EVERYWHERE")
        return line
    # changelog HEAD pins (startsWith + anchored regex forms)
    line = line.replace(f"## {OLD} — {OLD_TAG}", f"## {NEW} — {NEW_TAG}")
    line = line.replace(f"## {OLD} — {OLD_TAG}".replace(".", "\\."), f"## {NEW} — {NEW_TAG}".replace(".", "\\."))
    # website tagline pins (uppercase form)
    line = line.replace(f"'{OLD_TAG_UP}'", f"'{NEW_TAG_UP}'")
    line = line.replace(f"/{OLD_TAG_UP}/", f"/{NEW_TAG_UP}/")
    # quoted pins (APP.version / pkg / lock / setItem / includes)
    line = line.replace(f"'{OLD}'", f"'{NEW}'")
    # escaped regex pins (v1\.3\.9, "version": "1\.3\.9", zip links)
    line = line.replace(OLD.replace(".", "\\."), NEW.replace(".", "\\."))
    # plain unquoted pins inside includes(...) strings: v1.3.9, zip names
    if "assert" in line or "includes(" in line or "startsWith(" in line or "endsWith(" in line:
        line = re.sub(r"(?<=[vV(])" + re.escape(OLD) + r"(?=[_s<)' /])", NEW, line)
        line = line.replace(f"Burrito_GenDex_{OLD}_source.zip", f"Burrito_GenDex_{NEW}_source.zip")
        line = line.replace(f"Burrito%GenDex-{OLD}%Setup.exe", f"Burrito%GenDex-{NEW}%Setup.exe")
    # the CURRENT gate arrays
    line = line.replace("var CURRENT = [1, 3, 9];", "var CURRENT = [1, 4, 0];")
    line = line.replace("var CURRENT = \\[1, 3, 9\\];", "var CURRENT = \\[1, 4, 0\\];")
    # suite titles that describe the current check
    line = line.replace("the version is 1.3.9 everywhere", "the version is 1.4.0 everywhere")
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
