#!/usr/bin/env python3
"""1.6.3 -> 1.6.4 version sweep for the TEST SUITES (the app tree's own
furniture already speaks 1.6.4 — "The Ink Signs Its Name"). Moves every
live version pin: the APP/pkg/README/website equal-pins, the CHANGELOG
HEAD pins, the "version is X everywhere" titles, the boot harnesses'
lastRun seeds (a stale lastRun mounts the update window and breaks the
parked-seat live passes), and the website current-row pin. Historical
notes are LEFT ALONE (the 1.6.3-law mentions inside old batteries keep
their voice).

Special 1.6.4 law moves:
  gendex_166 + gendex_167 — the README battery count: 52 -> 53 (the 169
  battery arrives).

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.6.3"
NEW = "1.6.4"
OLD_TAG = "The Stack Finds Its Voice"
NEW_TAG = "The Ink Signs Its Name"


def sweep_line(line: str) -> str:
    stripped = line.lstrip()
    if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
        if f"the version is {OLD} everywhere" in line:
            line = line.replace(f"the version is {OLD} everywhere", f"the version is {NEW} everywhere")
        return line
    line = line.replace(f"'the version is {OLD} everywhere'", f"'the version is {NEW} everywhere'")
    line = line.replace(f"## {OLD} — {OLD_TAG}", f"## {NEW} — {NEW_TAG}")
    line = line.replace(f"## {OLD} — {OLD_TAG}".replace(".", "\\."), f"## {NEW} — {NEW_TAG}".replace(".", "\\."))
    line = line.replace(f"'{OLD_TAG}'", f"'{NEW_TAG}'")
    line = line.replace(f"/{OLD_TAG}/", f"/{NEW_TAG}/")
    line = line.replace(f"'{OLD}'", f"'{NEW}'")
    line = line.replace(OLD.replace(".", "\\."), NEW.replace(".", "\\."))
    if "assert" in line or "includes(" in line or "startsWith(" in line or "endsWith(" in line:
        line = re.sub(r"(?<=[vV(])" + re.escape(OLD) + r"(?=[_s<)' /*])", NEW, line)
        line = line.replace(f"**v{OLD}**", f"**v{NEW}**")
    return line


def move(old: str, new: str, text: str, where: str) -> str:
    if old in text:
        return text.replace(old, new)
    print(f"  !! pin not found in {where}: {old[:70]!r}")
    return text


def sweep_file(path: Path) -> bool:
    try:
        raw = path.read_text(encoding="utf8")
    except Exception:
        return False
    out = "\n".join(sweep_line(l) for l in raw.split("\n"))
    name = path.name

    if name in ("gendex_166_batch_dom.test.mjs", "gendex_167_batch_dom.test.mjs"):
        # the battery count grew with the 169 suite.
        out = move(
            "the regression battery \\(52 DOM\\/source test suites\\)",
            "the regression battery \\(53 DOM\\/source test suites\\)",
            out, name,
        )

    if out != raw:
        path.write_text(out, encoding="utf8")
        return True
    return False


def main():
    print(f"sweeping {OLD} -> {NEW} ({OLD_TAG} -> {NEW_TAG})")
    for path in sorted(ROOT.glob("scripts/*.test.mjs")):
        if sweep_file(path):
            print(f"  swept {path.name}")
    for path in sorted(ROOT.glob("scripts/probe_159_drag.mjs")):
        if sweep_file(path):
            print(f"  swept {path.name}")
    # the README battery count itself
    readme = ROOT / "README.md"
    t = readme.read_text(encoding="utf8")
    t = t.replace("the regression battery (52 DOM/source test suites)", "the regression battery (53 DOM/source test suites)")
    readme.write_text(t, encoding="utf8")
    print("  swept README.md (battery count 52 -> 53)")


if __name__ == "__main__":
    main()
