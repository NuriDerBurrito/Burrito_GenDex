#!/usr/bin/env python3
"""1.6.9 -> 1.7.0 version sweep for the TEST SUITES (the app tree's own
furniture already speaks 1.7.0). Moves every live version pin in the
gendex_*.test.mjs fixtures: the APP/pkg/README/website equal-pins, the
escaped regex pins, the changelog HEAD pins (the 1.7.0 entry is "The
Smooth Carries"), and the "version is X everywhere" titles. Historical
notes are LEFT ALONE.

Special 1.7.0 law pins (the laws this version legitimately superseded):

  gendex_170 (the 1.5.2 wash pins, restated by the 1.7.0 face law):
    - the row's style seat threads partContainerFace's var spread now
    - the frame law: 82% color + theme ink -> 72% color + the face
      (see .gd-part-row.is-colored in index.css)

  gendex_171 (the A1 dragstart pattern + the G3 pulse clock):
    - the startCardDrag body carries the 1.7.0 click-suppression window
      between dragRef and dragPtRef (the memory reset itself is intact)
    - the pulse voice: gd-shine-pulse 2s -> 0.5s (the 4x clock)

  gendex_172 (the pulse bloom pins):
    - the 2s clock -> the 0.5s clock (the same 0.85/0.95/1.18 shape)

  gendex_173 (the N1 band-mask pins, restated by the ellipse law):
    - the band top edge (48% cut) -> the ellipse hole riding the stamp's
      own paint footprint (62% x 0.56*--gd-art-h at the art's base)

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.6.9"
NEW = "1.7.0"
OLD_TAG = "The True Seats"
NEW_TAG = "The Smooth Carries"


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

    if name == "gendex_170_batch_dom.test.mjs":
        # A4: the row's style seat threads the face vars (the 1.7.0 law)
        out = move(
            r"style=\{part\.color \? \{ \['--part-color'\]: part\.color \} : undefined\}",
            r"style=\{part\.color \? \{ \['--part-color'\]: part\.color, \.\.\.\(partContainerFace\(part\.color, part\.colorShade === 'deep'\) \|\| \{\}\) \} : undefined\}",
            out, name,
        )
        out = move(
            r"border-color: color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 82%, var\(--gd-ink\)\);",
            r"border-color: color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 72%, var\(--part-face, color-mix\(in srgb, var\(--gd-ink\) 18%, var\(--gd-panel\)\)\)\);",
            out, name,
        )

    if name == "gendex_171_batch_dom.test.mjs":
        # A1: the dragstart body carries the 1.7.0 suppression window; the
        # memory reset itself is intact (the comment + the arm are between)
        out = move(
            r"const startCardDrag = \(e, id\) => \{\s*\n\s*dragRef\.current = \{ type: 'card', id \};\s*\n\s*dragPtRef\.current = null;",
            r"const startCardDrag = \(e, id\) => \{\s*\n\s*dragRef\.current = \{ type: 'card', id \};[\s\S]*?dragPtRef\.current = null;",
            out, name,
        )
        # G3: the pulse clock is a quarter of the old voice
        out = move(
            r"animation: gd-shine-pulse 2s ease-in-out 1 forwards;",
            r"animation: gd-shine-pulse 0\.5s ease-in-out 1 forwards;",
            out, name,
        )

    if name == "gendex_172_batch_dom.test.mjs":
        out = move(
            r"animation: gd-shine-pulse 2s ease-in-out 1 forwards;",
            r"animation: gd-shine-pulse 0\.5s ease-in-out 1 forwards;",
            out, name,
        )
        out = move(
            "'the pulse bloom speaks at full voice (0.85 core, 0.95 peaks, 2s)'",
            "'the pulse bloom speaks at full voice (0.85 core, 0.95 peaks, 0.5s — the 1.7.0 clock)'",
            out, name,
        )

    if name == "gendex_173_batch_dom.test.mjs":
        # N1: the band top edge dies with the rect hole; the ellipse law speaks
        out = move(
            r"assertMatch\(cssSrc, /calc\(var\(--gd-art-h\) \* 0\.48 - 0\.5px\)/, 'the band top edge never spoke'\);",
            r"assertMatch(cssSrc, /ellipse 62% calc\(var\(--gd-art-h\) \* 0\.56\) at 50% calc\(var\(--gd-art-h\) - 0\.5px\)/, 'the ellipse hole never spoke (1.7.0: the hole follows the stamp\\'s own paint)');",
            out, name,
        )

    if out != raw:
        path.write_text(out, encoding="utf8")
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
print(f"{moved} fixture file(s) swept {OLD} -> {NEW} (+ the 1.7.0 law pins in 170/171/172/173)")
