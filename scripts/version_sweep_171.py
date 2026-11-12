#!/usr/bin/env python3
"""1.7.0 -> 1.7.1 version sweep for the TEST SUITES (the app tree's own
furniture already speaks 1.7.1). Moves every live version pin in the
gendex_*.test.mjs fixtures: the APP/pkg/README/website equal-pins, the
escaped regex pins, the changelog HEAD pins (the 1.7.1 entry is "The One
Breath"), and the "version is X everywhere" titles. Historical notes are
LEFT ALONE.

Special 1.7.1 law pins (the laws this version legitimately superseded):

  gendex_166/167/169 (the website current-row includes-pin):
    - the ">"-preceded table pin the generic line sweep cannot reach
      (the same follow-up the 1.7.0 sweep needed)

  gendex_173 (the K arrows + the N1 mask laws):
    - K: the arrows LEFT the card-switch fade list ("dont make the left
      and right arrow buttons fade with the card switch feedback") —
      the seat + the gd-cv-arrow-swap keyframes are retired; the date
      keeps its seat, the arrows keep the gd-sort-live drag fade
    - N1: the ellipse hole retired with its soft return band that sat
      exactly over the wash's solid full-width corners — the carve now
      speaks the BAND'S OWN GEOMETRY (full width at the base, a soft
      shoulder tracking the wash's dissolve, a centered logos column)
      behind the .gd-has-stampart scope, the plate-only seat LIFTS over
      the trims for real (the 1.7.1 z fix), and the composites are the
      two symmetric voices (add + intersect)

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.7.0"
NEW = "1.7.1"
OLD_TAG = "The Smooth Carries"
NEW_TAG = "The One Breath"


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

    if name in ("gendex_166_batch_dom.test.mjs", "gendex_167_batch_dom.test.mjs", "gendex_169_batch_dom.test.mjs"):
        # the website current-row includes-pin: preceded by ">", unreachable
        # by the generic line sweep (the 1.7.0 sweep's own follow-up)
        out = move(
            'class="v">' + OLD + '</td>\'), \'the website current-row never moved\'',
            'class="v">' + NEW + '</td>\'), \'the website current-row never moved\'',
            out, name,
        )

    if name == "gendex_173_batch_dom.test.mjs":
        # K — the arrows retire from the card-switch fade (1.7.1): the date
        # keeps its seat; the arrows keep chrome
        out = move(
            "console.log('\\nK. THE DATE + THE ARROWS BREATHE (\"also left and right scroll buttons … also the date on top\")');",
            "console.log('\\nK. THE DATE BREATHES, THE ARROWS STAY SOLID (1.7.1: \"dont make the left and right arrow buttons fade with the card switch feedback\")');",
            out, name,
        )
        out = move(
            "ok('K1 — the date + the edge keys join the flight', () => {",
            "ok('K1 — the date joins the flight alone; the arrows keep their chrome', () => {",
            out, name,
        )
        out = move(
            "  assertMatch(cssSrc, /\\.gd-cv-swap \\.gd-flow-arrow \\{/, 'the arrow seat never joined');",
            "  assert.ok(!/\\.gd-cv-swap \\.gd-flow-arrow/.test(cssSrc), 'the arrows still ride the card-switch fade (1.7.1: they stay solid)');",
            out, name,
        )
        out = move(
            '  assertMatch(cssSrc, /@keyframes gd-cv-arrow-swap \\{[\\s\\S]*?from \\{\\s*\\n\\s*opacity: 0;\\s*\\n\\s*\\}/, "the arrow keyframes lost their implicit to");',
            "  assert.ok(!/@keyframes gd-cv-arrow-swap/.test(cssSrc), 'the retired arrow keyframes survived');",
            out, name,
        )

        # N1 — the carve speaks the band's own ground (1.7.1)
        out = move(
            "ok('N1 — the hole follows the stamp\\'s own paint while the stamp switch is off (1.7.0: the ellipse)', () => {",
            "ok('N1 — the carve speaks the band\\'s own ground; the layers take the coat independently (1.7.1)', () => {",
            out, name,
        )
        out = move(
            r"  assertMatch(cssSrc, /\.gd-fin-on-trim:not\(\.gd-fin-on-stamp\) \.gd-card-face-finish\.is-over-trim:not\(\.is-plate-only\),/, 'the mask scope never spoke');",
            r"  assertMatch(cssSrc, /\.gd-fin-on-trim\.gd-has-stampart:not\(\.gd-fin-on-stamp\) \.gd-card-face-finish\.is-over-trim:not\(\.is-plate-only\),/, 'the mask scope never spoke (1.7.1: stamps gate the carve)');",
            out, name,
        )
        out = move(
            "  // 1.7.0 — the band-rect hole (the straight 48% cut) retired with the\n"
            "  // report that it stripped the whole lower face: the hole is an ELLIPSE\n"
            "  // riding the stamp's own paint now — full-width at the wash's ground,\n"
            "  // rising the centered logos' column — and the foot's restore line still\n"
            "  // hands the coat back below the art.",
            "  // 1.7.1 — the ellipse's soft return band sat exactly over the wash's\n"
            "  // solid full-width corners (part of the stamp still read coated): the\n"
            "  // carve now speaks the BAND'S OWN GEOMETRY — full width through the\n"
            "  // wash's solid ground, a soft shoulder tracking the wash's own upward\n"
            "  // dissolve, a centered column for the tall logos — and the plate-only\n"
            "  // seat lifts over the trims for real (the 1.7.0 z bug: the under-art\n"
            "  // rule's specificity won forever, the trim effect died with the image\n"
            "  // switch off).",
            out, name,
        )
        out = move(
            r"  assertMatch(cssSrc, /ellipse 62% calc\(var\(--gd-art-h\) \* 0\.56\) at 50% calc\(var\(--gd-art-h\) - 0\.5px\)/, 'the ellipse hole never spoke');",
            r"""  assertMatch(cssSrc, /#000 calc\(var\(--gd-art-h\) \* 0\.48\),\s*\n\s*rgba\(0, 0, 0, 0\) calc\(var\(--gd-art-h\) \* 0\.62\),/, 'the soft shoulder never spoke (the wash dissolve tracked)');""",
            out, name,
        )
        out = move(
            r"  assertMatch(cssSrc, /rgba\(0, 0, 0, 0\) 0%,[\s\S]*?rgba\(0, 0, 0, 0\) 58%,[\s\S]*?#000 78%/, 'the hole\'s soft return band never spoke');",
            r"""  assertMatch(cssSrc, /rgba\(0, 0, 0, 0\) 0 72%,\s*\n\s*#000 100%\)/, 'the logos column keep never spoke');""",
            out, name,
        )
        out = move(
            r"  assertMatch(cssSrc, /linear-gradient\(to bottom, transparent calc\(var\(--gd-art-h\) - 0\.5px\), #000 var\(--gd-art-h\)\)/, 'the foot restore line never spoke');",
            r"  assertMatch(cssSrc, /linear-gradient\(to bottom, rgba\(0, 0, 0, 0\) calc\(var\(--gd-art-h\) - 0\.5px\), #000 var\(--gd-art-h\)\)/, 'the foot restore line never spoke');",
            out, name,
        )
        out = move(
            r"  assertMatch(cssSrc, /mask-composite: add;/, 'the hole halves never joined');",
            r"  assertMatch(cssSrc, /\.gd-fin-on-trim \.gd-card-face-finish\.is-plate-only\.is-over-trim \{\s*\n\s*z-index: 4;/, 'the veiled coat never lifted over the trims (the 1.7.1 z fix)');"
            "\n"
            r"  assertMatch(cssSrc, /linear-gradient\(to right, #000 0, #000 6%, rgba\(0, 0, 0, 0\) 6%\)/, 'the rim strips never spoke');",
            out, name,
        )
        out = move(
            r"  assertMatch(cssSrc, /mask-composite: intersect, add;/, 'the artfin never intersected');",
            r"  assertMatch(cssSrc, /mask-composite: intersect, intersect;/, 'the artfin never intersected');",
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
print(f"{moved} fixture file(s) swept {OLD} -> {NEW} (+ the 1.7.1 law pins in 166/167/169/173)")
