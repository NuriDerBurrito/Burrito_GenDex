#!/usr/bin/env python3
"""1.9.3 law-pin healing — the seats whose laws themselves MOVED this
release speak their new words (exactly the way the 1.8.4, 1.8.8, 1.8.9,
1.8.10, 1.9.0, 1.9.1 and 1.9.2 passes taught):

· 169 — H2's artfin stop pins (numeix + auric): the fixed rgba washes
  became the 1.9.3 premultiplied card-color leans; J2's bloom/dot budget
  counts the tile ONCE now that both engines' mask seats carry it.
· 171 — F2's calligraphy pins: the 1.6.7 curves are retired BY THE
  1.9.3 REPORT ITSELF ("the x's ... should be actual xs"), so the pin
  speaks the true-X law (straight diagonals, round caps, the fall kept).
· 172 — the four-arm curve pin: same retirement, same new law.
· 176 — A4's import pin: the grid's TagRibbon import gained
  finishGroundTone (the 1.9.3 extreme-grounds reader).
· 192 — E3's badge pin: the README badge is a LIVE seat (it tracks the
  current release's own color); it speaks 1.9.3 now.
· 193 — A2's law-note pin was OVER-SWEPT (the sweep moved its escaped
  birth version forward); the 1.9.2 law keeps its birth version in the
  prose, and the pin reverts to it. E3's badge pin speaks 1.9.3 (live).

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def sub(path: str, old: str, new: str) -> None:
    p = ROOT / path
    raw = p.read_text(encoding="utf8")
    if new in raw and old not in raw:
        print(f"  {path}: already healed")
        return
    assert old in raw, f"{path}: missing seat:\n{old[:160]}"
    raw = raw.replace(old, new, 1)
    p.write_text(raw, encoding="utf8")
    print(f"  {path}: healed")


S169 = "scripts/gendex_169_batch_dom.test.mjs"

# H2 — the artfin washes speak the card's own color now (the nuri pin
# below keeps its own seat: the forge's wash never moved this release)
sub(
    S169,
    """ok('H2 — the washes step up to speak whole over the picture', () => {
  assert.match(cssSrc, /rgba\\(238, 226, 186, 0\\.56\\) 0%/, 'the numeix wash stops drifted');
  assert.match(cssSrc, /rgba\\(255, 224, 140, 0\\.36\\) 0%/, 'the auric wash stops drifted');""",
    """ok('H2 — the washes step up to speak whole over the picture', () => {
  /* 1.9.3 — the numeix + auric artfin washes lean the card's own color
     now ("it would be creamy in the color of the card still"): the fixed
     rgba stops became premultiplied color-mix leans, every alpha exact.
     The nuri stop below keeps its 1.6.4 seat — the forge already spoke
     the card-color law this release generalized. */
  assert.match(cssSrc, /color-mix\\(in srgb, transparent 44%, color-mix\\(in srgb, var\\(--gd-card-tint, var\\(--gd-panel\\)\\) 52%, #fff0c8\\)\\) 0%/, 'the numeix wash stops drifted');
  assert.match(cssSrc, /color-mix\\(in srgb, transparent 64%, color-mix\\(in srgb, var\\(--gd-card-tint, var\\(--gd-panel\\)\\) 48%, #ffe08c\\)\\) 0%/, 'the auric wash stops drifted');""",
)

# J2 — the dapple tile rides BOTH engines' mask seats now, so every
# ellipse and spark dot speaks twice; the budget counts 20 / 4.
sub(
    S169,
    """  const blooms = (dapple.match(/%3Cellipse/g) || []).length;
  assert.equal(blooms, 10, 'the bloom budget drifted (got ' + blooms + ')');
  const dots = (dapple.match(/%3Ccircle/g) || []).length;
  assert.equal(dots, 2, 'the spark dot budget drifted (got ' + dots + ')');""",
    """  /* 1.9.3 — the tile is the seat's own ALPHA MASK now, and both engines'
     seats (-webkit-mask-image + mask-image) carry it: every bloom and
     spark dot speaks twice. The budget counts them where they live. */
  const blooms = (dapple.match(/%3Cellipse/g) || []).length;
  assert.equal(blooms, 20, 'the bloom budget drifted (got ' + blooms + ')');
  const dots = (dapple.match(/%3Ccircle/g) || []).length;
  assert.equal(dots, 4, 'the spark dot budget drifted (got ' + dots + ')');""",
)

# 171 — F2 speaks the true-X law (the report's own retirement of the
# calligraphy; the 1.6.8 prose keeps its historical seat)
sub(
    "scripts/gendex_171_batch_dom.test.mjs",
    """ok('F2 — the numeix X\\'s are calligraphic signatures', () => {
  // 1.6.8 — the glyph moved on: the beads and the crossing lens left;
  // four arms converge short of the center (THE CENTER BREATHES).
  assert.match(cssSrc, /THE CENTER BREATHES/, 'the law never spoke its name');
  const before = cssSrc.match(/\\.gd-numeix-xmarks::before \\{[\\s\\S]*?\\n\\}/)?.[0] || '';
  assert.ok(/Q\\d+\\.\\d+ \\d+\\.\\d/.test(before), 'the curved strokes never arrived');
  assert.ok(!before.includes('L31.5 45 L29 47.5 L26.5 45 Z'), 'the center diamond survived the 1.6.8 pass');
  assert.ok(!/M20 36 L38 54 M38 36 L20 54/.test(before), 'the straight crosses survived');""",
    """ok('F2 — the numeix X\\'s are TRUE rotated-plus marks (1.9.3)', () => {
  // 1.9.3 — the glyph moved on BY THE REPORT'S OWN WORDS ("the x's ...
  // should be actual xs ... like rotated '+' ... semi thick stroked"):
  // the 1.6.7 calligraphy retired; the true X speaks. (The 1.6.8 CENTER
  // BREATHES prose keeps its historical seat below.)
  assert.match(cssSrc, /THE CENTER BREATHES/, 'the law never spoke its name');
  const before = cssSrc.match(/\\.gd-numeix-xmarks::before \\{[\\s\\S]*?\\n\\}/)?.[0] || '';
  // straight crossing diagonals, round caps, not one Q curve anywhere
  assert.ok(/M20 36 L38 54 M20 54 L38 36/.test(before), 'the true X never arrived');
  assert.ok(!/Q\\d+\\.\\d+ \\d+\\.\\d/.test(before), 'a calligraphic curve survived the retirement');
  assert.ok(before.includes("stroke-linecap='round'"), 'the round caps never spoke');""",
)

# 172 — the four-arm curve pin speaks the true-X law
sub(
    "scripts/gendex_172_batch_dom.test.mjs",
    """ok('the arms converge short of the center (four quarter-curves per X)', () => {
  const xmark = css.slice(css.indexOf('.gd-numeix-xmarks::before'), css.indexOf('@keyframes gd-numeix-fall-a'));
  assertMatch(xmark, /M20 34 Q21\\.4 38\\.7 27\\.7 43\\.4 M38 34 Q36\\.6 38\\.7 30\\.3 43\\.4/, 'the first X no longer speaks four arms');
});""",
    """ok('every X is a true rotated plus (two straight diagonals, 1.9.3)', () => {
  const xmark = css.slice(css.indexOf('.gd-numeix-xmarks::before'), css.indexOf('@keyframes gd-numeix-fall-a'));
  /* 1.9.3 — THE TRUE X retired the 1.6.7 four-arm curves BY THE REPORT'S
     OWN WORDS ("actual xs ... like rotated '+' ... semi thick stroked not
     thin or bolded"): the first mark speaks two straight crossing
     diagonals with a round cap, and not one Q curve survives anywhere. */
  assertMatch(xmark, /M20 36 L38 54 M20 54 L38 36/, 'the first X no longer speaks two straight diagonals');
  assert.ok(!/Q\\d/.test(xmark), 'a calligraphic curve survived the retirement');
});""",
)

# 176 — the grid's import gained the 1.9.3 extreme-grounds reader
sub(
    "scripts/gendex_176_batch_dom.test.mjs",
    """  assertMatch(grid, /import TagRibbon, \\{ CardFinishLayer, FINISH_GROUND, TrimCoatLayer, TrimOverlay, cropFrame, finishPhase, markRibbonHeadRoom, ribbonSize, ribbonTopOffset, trimCoatInk \\}/, 'the grid never imported the ladder');""",
    """  /* 1.9.3 — the import gained finishGroundTone (the extreme-grounds
     reader — see .gd-fin-ground-* in index.css). */
  assertMatch(grid, /import TagRibbon, \\{ CardFinishLayer, FINISH_GROUND, TrimCoatLayer, TrimOverlay, cropFrame, finishGroundTone, finishPhase, markRibbonHeadRoom, ribbonSize, ribbonTopOffset, trimCoatInk \\}/, 'the grid never imported the ladder');""",
)

# 192 — the README badge is a live seat; it speaks the current release
sub(
    "scripts/gendex_192_batch_dom.test.mjs",
    """  assert.ok(readme.includes('version-1.9.2-purple'));""",
    """  /* 1.9.3 — the badge is a LIVE seat (it tracks the current release);
     it speaks 1.9.3 now. */
  assert.ok(readme.includes('version-1.9.3-purple'));""",
)

# 193 — A2's law-note pin was over-swept: the 1.9.2 law keeps its BIRTH
# version in the prose; the pin reverts to it.
sub(
    "scripts/gendex_193_batch_dom.test.mjs",
    """  assertMatch(ribbon, /1\\.9\\.3 — THE GROUND LISTENS TO THE CLOTH/, 'the 1.9.2 law note never spoke');""",
    """  /* 1.9.3 — the pin reverts the sweep's over-reach: the law keeps its
     birth version in the prose (the comment skip's own promise). */
  assertMatch(ribbon, /1\\.9\\.2 — THE GROUND LISTENS TO THE CLOTH/, 'the 1.9.2 law note never spoke');""",
)

# 193 — E3's badge pin speaks the current release (live seat)
sub(
    "scripts/gendex_193_batch_dom.test.mjs",
    """  assert.ok(readme.includes('version-1.9.2-purple'));""",
    """  /* 1.9.3 — the badge is a LIVE seat; it speaks the current release. */
  assert.ok(readme.includes('version-1.9.3-purple'));""",
)

print("\n1.9.3 law pins healed.")
