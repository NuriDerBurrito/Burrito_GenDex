#!/usr/bin/env python3
"""1.9.5 law-pin healing — the suites whose pinned laws MOVED this release
keep their seats, re-worded to the law's new shape (exactly the way the
1.9.4 pass healed the 194 suite's stroke band and the 159 suite's veil
weight).

The moved laws and their patients:
  · the X band + caps — gendex_171's F2 (the true-X cap pin),
    gendex_194's A2 and gendex_195's B1/B2 (the 2.9-4.6 band, the
    round-cap pins): 1.9.5 cuts the caps FLAT (butt) and steps the band
    to 3.3-5.2 (~17-23% of the span);
  · the light-ground stack — gendex_194's C1 and gendex_195's C5 pin the
    1.9.3 light law with its three broad bodies (foil / auric / numeix
    multiply): the bodies RETIRED from the stack (the plate's own light
    is sacred) — the pins now speak the details-only shape and assert the
    retirement;
  · the ink law — gendex_195's C1 pins brightness(0.55) saturate(1.35)
    with the bodies seated: the value gentled to brightness(0.74)
    saturate(1.5) and the bodies left the list;
  · the overlay flips — gendex_195's C2 anchors on the forge BODY seat
    (retired) and C3 pins the veil's light multiply flip (retired): the
    anchors move to the licks and the veil's light flip asserts its
    absence (the dark screen flip keeps its word).

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def sub(path: str, old: str, new: str, count=1) -> None:
    p = ROOT / path
    raw = p.read_text(encoding="utf8")
    found = raw.count(old)
    assert found == count, f"{path}: expected {count} seat(s) of {old[:90]!r}, found {found}"
    raw = raw.replace(old, new, count)
    p.write_text(raw, encoding="utf8")
    print(f"  {path}: healed — {old[:60]!r}")


# ---------------------------------------------------------------------------
# gendex_171 — the true-X cap pin (F2)
# ---------------------------------------------------------------------------
sub(
    "scripts/gendex_171_batch_dom.test.mjs",
    """  // straight crossing diagonals, round caps, not one Q curve anywhere
  assert.ok(/M20 36 L38 54 M20 54 L38 36/.test(before), 'the true X never arrived');
  assert.ok(!/Q\\d+\\.\\d+ \\d+\\.\\d/.test(before), 'a calligraphic curve survived the retirement');
  assert.ok(before.includes("stroke-linecap='round'"), 'the round caps never spoke');""",
    """  // straight crossing diagonals, FLAT butt caps (1.9.5 — the round
  // pebble tips retired with "xs ... should not be round edged"), not one
  // Q curve anywhere
  assert.ok(/M20 36 L38 54 M20 54 L38 36/.test(before), 'the true X never arrived');
  assert.ok(!/Q\\d+\\.\\d+ \\d+\\.\\d/.test(before), 'a calligraphic curve survived the retirement');
  assert.ok(before.includes("stroke-linecap='butt'"), 'the flat caps never spoke (1.9.5)');""",
)

# ---------------------------------------------------------------------------
# gendex_194 — the X band + caps (A2) and the light law's bodies (C1)
# ---------------------------------------------------------------------------
sub(
    "scripts/gendex_194_batch_dom.test.mjs",
    """  /* 1.9.4 — THE X'S TAKE THEIR FULL WEIGHT ("the x's arent thick
     enough sometimes, fix that"): every stroke steps up to the ✖'s own
     proportion (~16-18% of its diagonal span — 2.9-4.6 on the same
     12-20px spans), still semi-thick, never bold. */
  for (const w of [...widths, ...widthsFar]) {
    assert.ok(w >= 2.9 && w <= 4.6, `a stroke left the full-weight band: ${w}`);
  }
  // round caps (the ink's own voice), and the sizes still vary mark to mark
  assertMatch(b, /stroke-linecap='round'/, 'the round caps never spoke');""",
    """  /* 1.9.4 — THE X'S TAKE THEIR FULL WEIGHT ("the x's arent thick
     enough sometimes, fix that"), and 1.9.5 CUTS THEM FLAT ("xs in numeix
     theme should not be round edged and should also be slightly more
     thicker again"): butt caps (the ✖'s own square ends) and one more
     step of weight — 3.3-5.2 on the same 12-20px spans, the flat cut
     retiring the cap's half-stroke extension so the heavier stroke keeps
     the mark's full presence. */
  for (const w of [...widths, ...widthsFar]) {
    assert.ok(w >= 3.3 && w <= 5.2, `a stroke left the flat-cut band: ${w}`);
  }
  // flat caps (the ink's own voice since 1.9.5), and the sizes still vary mark to mark
  assertMatch(b, /stroke-linecap='butt'/, 'the flat caps never spoke');""",
)

sub(
    "scripts/gendex_194_batch_dom.test.mjs",
    """  assertMatch(css, /\\.gd-fin-ground-light \\.gd-numeix-dapple,\\s*\\n\\.gd-fin-ground-light \\.gd-numeix-streams,/, 'the light law never seated the luminous family');
  assertMatch(css, /\\.gd-fin-ground-light \\.gd-finish-foil,\\s*\\n\\.gd-fin-ground-light \\.gd-finish-auric,\\s*\\n\\.gd-fin-ground-light \\.gd-finish-numeix \\{\\s*\\n  mix-blend-mode: multiply;/, 'the light law never turned the seats to tints');""",
    """  assertMatch(css, /\\.gd-fin-ground-light \\.gd-numeix-dapple,\\s*\\n\\.gd-fin-ground-light \\.gd-numeix-streams,/, 'the light law never seated the luminous family');
  /* 1.9.5 — THE PLATE'S OWN LIGHT IS SACRED ("it would darken the card
     color and then make the effects darker"): the three broad bodies
     retired from the light multiply stack (numeix's paper, auric's honey,
     foil's metal keep their native seats — the multiply law answers the
     DETAIL inks alone now), so a bright plate keeps its own light under
     the coat. The pin speaks the retirement: the details keep the tint,
     the bodies keep their native blends. */
  assertMatch(css, /\\.gd-fin-ground-light \\.gd-finish-foil-ripples \\{\\s*\\n  mix-blend-mode: multiply;/, 'the light law never kept the detail inks');
  for (const body of ['.gd-finish-foil', '.gd-finish-auric', '.gd-finish-numeix', '.gd-finish-nuri']) {
    assert.ok(!css.includes(`.gd-fin-ground-light ${body},\\n`) && !css.includes(`.gd-fin-ground-light ${body} {\\n  mix-blend-mode: multiply;`), `a broad body rejoined the light multiply stack: ${body}`);
  }""",
)

# ---------------------------------------------------------------------------
# gendex_195 — the X band/caps (B1/B2), the ink law (C1), the flips (C2/C3),
#              the 1.9.3 light law (C5)
# ---------------------------------------------------------------------------
sub(
    "scripts/gendex_195_batch_dom.test.mjs",
    """//   B.  THE X'S TAKE THEIR FULL WEIGHT ("the x's arent thick enough
//       sometimes, fix that"): every stroke in both looms steps up to the
//       ✖'s own proportion (~23-26% of its span, 2.9-4.6 on the same
//       12-20px spans) — semi-thick, never bold, every clock kept.""",
    """//   B.  THE X'S TAKE THEIR FULL WEIGHT ("the x's arent thick enough
//       sometimes, fix that"), and 1.9.5 CUTS THEM FLAT ("xs in numeix
//       theme should not be round edged and should also be slightly more
//       thicker again"): butt caps, one more step of weight (3.3-5.2 on
//       the same 12-20px spans) — semi-thick, never bold, every clock kept.""",
)

sub(
    "scripts/gendex_195_batch_dom.test.mjs",
    """ok('B1 — every stroke sits at the ✖\\'s own proportion (~1/6 of its diagonal)', () => {""",
    """ok('B1 — every stroke sits at the ✖\\'s own proportion (the flat-cut band)', () => {""",
)

sub(
    "scripts/gendex_195_batch_dom.test.mjs",
    """      const span = Math.hypot(m[3] - m[1], m[4] - m[2]);
      const w = Number(m[9]);
      assert.ok(w >= 2.9 && w <= 4.6, `${name}: a stroke left the full-weight band: ${w}`);
      // the stroke sits at ~16-18% of the mark's own diagonal span (the
      // ✖ character's build — the 1.9.3 band's thin floor retired)
      const ratio = w / span;
      assert.ok(ratio >= 0.15 && ratio <= 0.2, `${name}: the ✖ proportion broke at ${m[1]},${m[2]} (w ${w} / span ${span.toFixed(1)} = ${ratio.toFixed(2)})`);""",
    """      const span = Math.hypot(m[3] - m[1], m[4] - m[2]);
      const w = Number(m[9]);
      assert.ok(w >= 3.3 && w <= 5.2, `${name}: a stroke left the flat-cut band: ${w}`);
      // the stroke sits at ~17-23% of the mark's own diagonal span (the
      // ✖ character's build — 1.9.5 took the band one step heavier and
      // cut the caps flat, retiring the round tip's half-stroke reach)
      const ratio = w / span;
      assert.ok(ratio >= 0.17 && ratio <= 0.23, `${name}: the ✖ proportion broke at ${m[1]},${m[2]} (w ${w} / span ${span.toFixed(1)} = ${ratio.toFixed(2)})`);""",
)

sub(
    "scripts/gendex_195_batch_dom.test.mjs",
    """  // the floor rose with the ceiling: the thinnest mark in EITHER loom is
  // heavier than the 1.9.3 band's own floor (2.4-3.5 retired)
  const widths = [...css.matchAll(/stroke-width='([\\d.]+)'/g)].map((m) => Number(m[1])).filter((w) => w <= 5);
  const xWidths = [...near.matchAll(/stroke-width='([\\d.]+)'/g), ...far.matchAll(/stroke-width='([\\d.]+)'/g)].map((m) => Number(m[1]));
  assert.equal(xWidths.length, 38, `the looms lost strokes (${xWidths.length})`);
  assert.ok(Math.min(...xWidths) >= 2.9, `a thin survivor: ${Math.min(...xWidths)}`);
  assert.ok(Math.max(...xWidths) <= 4.6, `a bold trespasser: ${Math.max(...xWidths)}`);""",
    """  // the floor rose with the ceiling: the thinnest mark in EITHER loom is
  // heavier than the 1.9.4 band's own floor (2.9-4.6 retired by 1.9.5)
  const widths = [...css.matchAll(/stroke-width='([\\d.]+)'/g)].map((m) => Number(m[1])).filter((w) => w <= 6);
  const xWidths = [...near.matchAll(/stroke-width='([\\d.]+)'/g), ...far.matchAll(/stroke-width='([\\d.]+)'/g)].map((m) => Number(m[1]));
  assert.equal(xWidths.length, 38, `the looms lost strokes (${xWidths.length})`);
  assert.ok(Math.min(...xWidths) >= 3.3, `a thin survivor: ${Math.min(...xWidths)}`);
  assert.ok(Math.max(...xWidths) <= 5.2, `a bold trespasser: ${Math.max(...xWidths)}`);""",
)

sub(
    "scripts/gendex_195_batch_dom.test.mjs",
    """ok('B2 — every clock and cap keeps its seat (only the weight moved)', () => {""",
    """ok('B2 — every clock keeps its seat, the caps cut flat (1.9.5)', () => {""",
)

sub(
    "scripts/gendex_195_batch_dom.test.mjs",
    """  assertMatch(block(css, '.gd-numeix-xmarks::before'), /stroke-linecap='round'/, 'the round caps left');
  assertMatch(block(css, '.gd-numeix-xmarks::after'), /stroke-linecap='round'/, 'the far round caps left');""",
    """  assertMatch(block(css, '.gd-numeix-xmarks::before'), /stroke-linecap='butt'/, 'the flat caps left (1.9.5)');
  assertMatch(block(css, '.gd-numeix-xmarks::after'), /stroke-linecap='butt'/, 'the far flat caps left (1.9.5)');""",
)

# the ink law: the value gentled, the bodies left the list
sub(
    "scripts/gendex_195_batch_dom.test.mjs",
    """  const ink = /\\.gd-fin-ground-light \\.gd-numeix-dapple,\\n(?:\\.gd-fin-ground-light [^\\n]+,\\n)*\\.gd-fin-ground-light [^\\n]+ \\{\\n  filter: brightness\\(0\\.55\\) saturate\\(1\\.35\\);\\n\\}/.exec(css)?.[0] || '';
  assert.ok(ink, 'the ink law never spoke');
  // every seat the 1.9.4 law promised, present in the one rule
  for (const seat of [
    '.gd-numeix-dapple', '.gd-numeix-streams', '.gd-numeix-moon', '.gd-numeix-stars', '.gd-numeix-xmarks',
    '.gd-auric-currents', '.gd-auric-flakes', '.gd-auric-sweep', '.gd-auric-summon',
    '.gd-finish-foil-ripples', '.gd-finish-foil::before', '.gd-finish-holographic::before', '.gd-holo-shards',
    '.gd-finish-numeix', '.gd-finish-auric', '.gd-finish-nuri', '.gd-nuri-licks', '.gd-nuri-sparks', '.gd-nuri-flare',
    '.gd-holo-dots', '.gd-prism-stars', '.gd-prism-particles', '.gd-prism-waves', '.gd-prism-sweep',
  ]) {
    assert.ok(ink.includes(`.gd-fin-ground-light ${seat},`) || ink.includes(`.gd-fin-ground-light ${seat} {`), `the ink law never seated ${seat}`);
  }""",
    """  /* 1.9.5 — the ink law learned the GENTLE hand ("it would darken the
     card color and then make the effects darker ... when its too bright
     it becomes black"): the filter rises from the crushing
     brightness(0.55) saturate(1.35) to brightness(0.74) saturate(1.5),
     and the broad BODIES left the list (a wash at 0.55 was the black the
     light-plate stack printed — see the 1.9.5 rules in index.css). */
  const ink = /\\.gd-fin-ground-light \\.gd-numeix-dapple,\\n(?:\\.gd-fin-ground-light [^\\n]+,\\n)*\\.gd-fin-ground-light [^\\n]+ \\{\\n  filter: brightness\\(0\\.74\\) saturate\\(1\\.5\\);\\n\\}/.exec(css)?.[0] || '';
  assert.ok(ink, 'the ink law never spoke');
  // every DETAIL seat the law promises, present in the one rule — and
  // every broad body absent (the 1.9.5 retirement)
  for (const seat of [
    '.gd-numeix-dapple', '.gd-numeix-streams', '.gd-numeix-moon', '.gd-numeix-stars', '.gd-numeix-xmarks',
    '.gd-auric-currents', '.gd-auric-flakes', '.gd-auric-sweep', '.gd-auric-summon',
    '.gd-finish-foil-ripples', '.gd-finish-foil::before', '.gd-finish-holographic::before', '.gd-holo-shards',
    '.gd-nuri-licks', '.gd-nuri-sparks', '.gd-nuri-flare',
    '.gd-holo-dots', '.gd-prism-stars', '.gd-prism-particles', '.gd-prism-waves', '.gd-prism-sweep',
  ]) {
    assert.ok(ink.includes(`.gd-fin-ground-light ${seat},`) || ink.includes(`.gd-fin-ground-light ${seat} {`), `the ink law never seated ${seat}`);
  }
  for (const body of ['.gd-finish-numeix', '.gd-finish-auric', '.gd-finish-nuri']) {
    assert.ok(!ink.includes(`.gd-fin-ground-light ${body},`) && !ink.includes(`.gd-fin-ground-light ${body} {`), `a broad body rejoined the ink law: ${body}`);
  }""",
)

# the overlay flips: the forge body retired from the light multiply list
sub(
    "scripts/gendex_195_batch_dom.test.mjs",
    """ok('C2 — the overlay coats flip on the extremes (they were identity there)', () => {
  // light: multiply — the saturated anchors land on their own
  const lightFlips = /\\.gd-fin-ground-light \\.gd-finish-nuri,[\\s\\S]*?mix-blend-mode: multiply;/.exec(css)?.[0] || '';
  assert.ok(lightFlips, 'the light flip never spoke');
  for (const seat of ['.gd-finish-nuri', '.gd-nuri-licks', '.gd-nuri-sparks', '.gd-nuri-flare', '.gd-finish-holographic', '.gd-holo-dots', '.gd-finish-prismatic', '.gd-prism-stars', '.gd-prism-particles', '.gd-prism-waves', '.gd-prism-sweep']) {""",
    """ok('C2 — the overlay coats flip on the extremes (they were identity there)', () => {
  /* 1.9.5 — the forge BODY retired from the light multiply stack (the
     plate's own light is sacred — the licks, sparks and flare carry the
     ink law alone); the anchor moves to the licks. */
  // light: multiply — the saturated anchors land on their own
  const lightFlips = /\\.gd-fin-ground-light \\.gd-nuri-licks,[\\s\\S]*?mix-blend-mode: multiply;/.exec(css)?.[0] || '';
  assert.ok(lightFlips, 'the light flip never spoke');
  for (const seat of ['.gd-nuri-licks', '.gd-nuri-sparks', '.gd-nuri-flare', '.gd-finish-holographic', '.gd-holo-dots', '.gd-finish-prismatic', '.gd-prism-stars', '.gd-prism-particles', '.gd-prism-waves', '.gd-prism-sweep']) {""",
)

# the veil: the light flip retired (it only darkened the fire it tinted)
sub(
    "scripts/gendex_195_batch_dom.test.mjs",
    """ok('C3 — the forge\\'s veil turns identity on the extremes (it only ever tinted)', () => {
  assertMatch(css, /\\.gd-fin-ground-light \\.gd-finish-nuri::before \\{\\s*\\n  mix-blend-mode: multiply;\\s*\\n\\}/, 'the light veil never stepped aside');
  assertMatch(css, /\\.gd-fin-ground-dark \\.gd-finish-nuri::before \\{\\s*\\n  mix-blend-mode: screen;\\s*\\n\\}/, 'the dark veil never stepped aside');""",
    """ok('C3 — the forge\\'s veil keeps its overlay seat on light, glows on dark (1.9.5)', () => {
  assert.ok(!/\\.gd-fin-ground-light \\.gd-finish-nuri::before \\{/.test(css), 'the light veil flip survived the 1.9.5 retirement (it only ever darkened the fire it was meant to tint)');
  assertMatch(css, /\\.gd-fin-ground-dark \\.gd-finish-nuri::before \\{\\s*\\n  mix-blend-mode: screen;\\s*\\n\\}/, 'the dark veil never stepped aside');""",
)

# the 1.9.3 light law pin: the bodies' retirement
sub(
    "scripts/gendex_195_batch_dom.test.mjs",
    """ok('C5 — the 1.9.3 laws keep their own words (the release line holds)', () => {
  // the three original blend laws stay seated beside the ink law
  assertMatch(css, /\\.gd-fin-ground-light \\.gd-finish-foil,\\s*\\n\\.gd-fin-ground-light \\.gd-finish-auric,\\s*\\n\\.gd-fin-ground-light \\.gd-finish-numeix \\{\\s*\\n  mix-blend-mode: multiply;/, 'the 1.9.3 light law left');""",
    """ok('C5 — the 1.9.3 laws keep their own words (the release line holds)', () => {
  /* 1.9.5 — the light law's BODIES retired ("it would darken the card
     color"): the detail inks keep the multiply tint, the broad bodies
     keep their native seats — the retirement is the pin now. */
  assertMatch(css, /\\.gd-fin-ground-light \\.gd-finish-foil-ripples \\{\\s*\\n  mix-blend-mode: multiply;/, 'the 1.9.3 light law left the detail inks');
  for (const body of ['.gd-finish-foil', '.gd-finish-auric', '.gd-finish-numeix', '.gd-finish-nuri']) {
    assert.ok(!css.includes(`.gd-fin-ground-light ${body},\\n`) && !css.includes(`.gd-fin-ground-light ${body} {\\n  mix-blend-mode: multiply;`), `a broad body rejoined the light multiply stack: ${body}`);
  }""",
)

# gendex_176 — the grid import list grew by the volume derivation (A4)
sub(
    "scripts/gendex_176_batch_dom.test.mjs",
    "assertMatch(grid, /import TagRibbon, \\{ CardFinishLayer, FINISH_GROUND, TrimCoatLayer, TrimOverlay, cropFrame, finishGroundTone, finishPhase, markRibbonHeadRoom, ribbonSize, ribbonTopOffset, trimCoatInk \\}/, 'the grid never imported the ladder');",
    "assertMatch(grid, /import TagRibbon, \\{ CardFinishLayer, FINISH_GROUND, TrimCoatLayer, TrimOverlay, cropFrame, finishGroundTone, finishPhase, finishStrength, markRibbonHeadRoom, ribbonSize, ribbonTopOffset, trimCoatInk \\}/, 'the grid never imported the ladder');",
)

# ---------------------------------------------------------------------------
# the badge pins the sweep's lookbehind cannot reach (the 1.9.4 pass's own
# lesson, verbatim): version-1.9.4-purple -> version-1.9.5-purple in every
# suite that pins the README shield (the [vV(] lookbehind stops at the
# hyphenated badge form)
# ---------------------------------------------------------------------------
for f in ["gendex_192_batch_dom.test.mjs", "gendex_193_batch_dom.test.mjs", "gendex_194_batch_dom.test.mjs", "gendex_195_batch_dom.test.mjs"]:
    sub(f"scripts/{f}", "version-1.9.4-purple", "version-1.9.5-purple")

print("\n1.9.5 law pins healed (171, 194, 195 + the badge sweep).")
