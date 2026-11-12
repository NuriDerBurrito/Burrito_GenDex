#!/usr/bin/env python3
"""1.5.7 -> 1.5.8 version sweep for the TEST SUITES (the app tree's own
furniture already speaks 1.5.8). Moves every live version pin in the
gendex_*.test.mjs fixtures: the APP/pkg/README/website equal-pins, the
escaped regex pins, the changelog HEAD pins (the 1.5.8 entry is "The Field
Pass of Small Comforts"), and the "version is X everywhere" titles.
Historical notes are LEFT ALONE.

Special 1.5.8 law pins inside gendex_163 (the battery that pinned 1.5.7's
own laws, which 1.5.8 legitimately superseded):
  - TOS_VERSION pins '1.0.1' -> '1.0.2' (the terms bump; both the source-law
    regex and the pure equal)
  - the LIVING FINISHES switch-title pin -> EXPERIMENTAL FINISHES (the
    rename the owner asked for; the law itself is unchanged)
  - the settle re-arm's useEffect dialect -> useLayoutEffect (the pre-paint
    move; the law itself is unchanged)
gendex_162's stub getVersion is swept like any live pin; its 1.5.5-stamped
seeded archive is the deliberate past-version fixture and stays. Run from
the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.5.7"
NEW = "1.5.8"
OLD_TAG = "The Ghost Learns Its Manners"
NEW_TAG = "The Field Pass of Small Comforts"


def sweep_line(line: str) -> str:
    stripped = line.lstrip()
    if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
        if f"the version is {OLD} everywhere" in line:
            line = line.replace(f"the version is {OLD} everywhere", f"the version is {NEW} everywhere")
        return line
    # the ok() labels (159/160 carry the born title from the 154 sweep)
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


def sweep_file(path: Path) -> bool:
    try:
        raw = path.read_text(encoding="utf8")
    except Exception:
        return False
    lines = raw.split("\n")
    out = [sweep_line(l) for l in lines]
    # 163's own 1.5.7-era law pins, superseded by 1.5.8's laws:
    if path.name == "gendex_163_batch_dom.test.mjs":
        out = [
            l.replace(
                "export const TOS_VERSION = '1\\.0\\.1';",
                "export const TOS_VERSION = '1\\.0\\.2';",
            ).replace(
                "the terms version never moved to 1.0.1",
                "the terms version never moved to 1.0.2",
            )
            if "TOS_VERSION = '1" in l
            else l.replace("assert.equal(TOS_VERSION, '1.0.1');", "assert.equal(TOS_VERSION, '1.0.2');")
            if "assert.equal(TOS_VERSION" in l
            else l.replace('title="LIVING FINISHES"', 'title="EXPERIMENTAL FINISHES"')
            if "LIVING FINISHES" in l and "title=" in l
            else l.replace(
                "useEffect\\(\\(\\) => \\{\\s*if \\(!flightOpened\\) return undefined;",
                "useLayoutEffect\\(\\(\\) => \\{\\s*if \\(!flightOpened\\) return undefined;",
            )
            if "flightOpened" in l and "useEffect" in l and "assert" in l
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
    if f.name.startswith("gendex_") or f.name.startswith("version_sweep"):
        continue
    if sweep_file(f):
        moved += 1
        print(f"  swept {f.name}")
print(f"{moved} fixture file(s) swept {OLD} -> {NEW} (+ 163's TOS 1.0.2 / EXPERIMENTAL FINISHES / useLayoutEffect pins)")
