#!/usr/bin/env python3
"""patch_law_pins_200.py — heal the suites whose pinned laws MOVED with
1.9.9 (the same office every release keeps: the sweep moves the version
digits, this patch re-words the law pins themselves).

The 1.9.9 rework retired the ink TWIN (finishInkTwin — its lightness was
solved against the PLATE's luminance, the exact brightness-dependence
the report retired) and seated finishTintLean in its place (hue + HSL
saturation whole at FIXED luma seats: base 0.45, glow 0.78, art 0.75).
The art zone's raw-tint override retired with it (the art seats read the
lean's own art seat), and the universal 1.9.7 hand override retired into
the base declaration.

Suites healed:
  · 197 (1.9.6 — The Certain Ink): A1 the twin's rail -> the lean's
    fixed seats; A2 the universal hand -> the base lean hand; A3 the
    artfins' raw-tint law -> the handed law; the twin-write pin -> the
    lean write.
  · 198 (1.9.7 — The Cornered Ink): A1 the twin's numbers -> the lean's
    (the distance table still holds — the fixed seat carries its own
    contrast; white's shadow gray is the honest #737373 now); A3 the
    universal hand -> the base hand; A8 the twin writes -> the lean
    writes (all three seats).
  · 199 (1.9.8 — The Quiet Seam): B1 the twin's rail + pastel lift ->
    the lean's fixed seats + the glow seat's lift; C2 the art twin's
    raw tint -> the art seat hand.

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def patch(path: str, old: str, new: str) -> None:
    p = ROOT / path
    raw = p.read_text(encoding="utf8")
    if new in raw and old not in raw:
        print(f"  {path}: already healed")
        return
    assert old in raw, f"{path}: missing pin:\n{old[:160]}"
    raw = raw.replace(old, new, 1)
    p.write_text(raw, encoding="utf8")
    print(f"  {path}: healed")


# ---------------------------------------------------------------- 197 (1.9.6)
S = "scripts/gendex_197_batch_dom.test.mjs"

patch(S, """ok('A1 — the twin measures in light (1.9.7: the luma rail, both sides, the solver)', () => {
  assertMatch(ribbon, /export function finishInkTwin\\(cardColor\\) \\{/, 'finishInkTwin never left TagRibbon');
  // the yardstick: perceptual luminance (the HSL-lightness rail let the
  // fully-saturated high-luminance corners pass through raw — the yellow)
  assertMatch(ribbon, /const lum = 0\\.2126 \\* r \\+ 0\\.7152 \\* g \\+ 0\\.0722 \\* b;/, 'the twin lost its luminance yardstick');
  // the ONE rail, both sides: the bright half's shadow (compression where
  // it carries, floored 0.16 of light below the plate), the dark half's
  // lift (0.16 above it)
  assertMatch(ribbon, /const target = lum >= 0\\.7 \\? Math\\.min\\(0\\.35 \\+ 0\\.3 \\* lum, lum - 0\\.16\\) : lum \\+ 0\\.16;/, 'the twin lost its two-sided rail');
  // the lightness SOLVED exactly (bisection against the twin's own luma
  // curve — no threshold branches, nothing to loop past)
  assertMatch(ribbon, /const lumaAt = \\(ll\\) => \\{/, 'the solver never spoke');
  assertMatch(ribbon, /for \\(let i = 0; i < 24; i \\+= 1\\) \\{/, 'the bisection lost its steps');
  // the passthrough is GONE (the 1.9.6 dark passthrough was the yellow's
  // whole disease: HSL L <= 0.5 returned the raw hex)
  const twin = /export function finishInkTwin[\\s\\S]*?\\n\\}/.exec(ribbon)?.[0] || '';
  assert.ok(!/return `#\\$\\{m\\.slice\\(1\\)/.test(twin), 'the raw passthrough survived');
  assert.ok(!/finishGroundTone|0\\.78|0\\.19|0\\.85/.test(twin), 'a ground threshold leaked into the twin');
});""",
"""ok('A1 — the ink derivation carries its own contrast (1.9.9: the lean, the fixed seats, the solver)', () => {
  assertMatch(ribbon, /export function finishTintLean\\(cardColor, seat\\) \\{/, 'finishTintLean never left TagRibbon');
  // 1.9.9 — the twin retired whole (its lightness was solved against the
  // PLATE's luminance — the brightness-dependence the report retired);
  // the lean keeps the hue + saturation whole at a FIXED luma seat
  assert.ok(!/finishInkTwin/.test(ribbon), 'the twin survived its retirement');
  assertMatch(ribbon, /const LEAN_LUMA = Number\\.isFinite\\(\\+seat\\) \\? Math\\.min\\(0\\.9, Math\\.max\\(0\\.1, \\+seat\\)\\) : 0\\.45;/, 'the lean lost its fixed seat');
  // the lightness SOLVED exactly (bisection against the lean's own luma
  // curve — no threshold branches, nothing to loop past)
  assertMatch(ribbon, /const lumaAt = \\(ll\\) => \\{/, 'the solver never spoke');
  assertMatch(ribbon, /for \\(let i = 0; i < 24; i \\+= 1\\) \\{/, 'the bisection lost its steps');
  // the passthrough is GONE (the 1.9.6 dark passthrough was the yellow's
  // whole disease) — and the plate's own brightness never enters the
  // derivation at all (no lum measure, no ground seam, no compression)
  const lean = /export function finishTintLean[\\s\\S]*?\\n\\}/.exec(ribbon)?.[0] || '';
  assert.ok(!/return `#\\$\\{m\\.slice\\(1\\)/.test(lean), 'the raw passthrough survived');
  assert.ok(!/const lum = 0\\.2126/.test(lean), 'the lean still measured the plate');
  assert.ok(!/lum >= 0\\.7|0\\.35 \\+ 0\\.3|lum \\+ 0\\.16/.test(lean), 'a ground rail leaked into the lean');
});""")

patch(S, """ok('A2 — the hand speaks everywhere (1.9.7: the universal swap, both wrappers)', () => {
  const seat = block(css, '.gd-card-face-finish');
  assertMatch(seat, /--gd-tint-hand: var\\(--gd-card-tint, var\\(--gd-panel\\)\\);/, 'the coat never declared the hand');
  assertMatch(css, /\\.gd-card-face-finish,\\s*\\n\\.gd-card-face-artfin \\{\\s*\\n  --gd-tint-hand: var\\(--gd-fin-ink, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\);\\s*\\n\\}/, 'the universal hand never spoke');
});""",
"""ok('A2 — the hand speaks everywhere (1.9.9: the base declaration carries the lean)', () => {
  const seat = block(css, '.gd-card-face-finish');
  assertMatch(seat, /--gd-tint-hand: var\\(--gd-fin-ink, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\);/, 'the base hand never spoke the lean');
  // 1.9.9 — the 1.9.7 universal override retired INTO the base (the same
  // word spoken once); the dark ground's screen family reads the GLOW seat
  assert.ok(!/\\.gd-card-face-finish,\\s*\\n\\.gd-card-face-artfin \\{\\s*\\n  --gd-tint-hand: var\\(--gd-fin-ink/.test(css), 'the universal override survived as a duplicate');
  assertMatch(css, /\\.gd-fin-ground-dark \\.gd-card-face-finish:not\\(\\.is-art-zone\\),\\s*\\n\\.gd-fin-ground-dark \\.gd-card-face-artfin:not\\(\\.is-art-zone\\) \\{\\s*\\n  --gd-tint-hand: var\\(--gd-fin-glow, var\\(--gd-fin-ink, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\)\\);\\s*\\n\\}/, 'the dark glow hand never spoke');
});""")

patch(S, """ok('A3 — every tint-leaning stop reads the hand (the artfin keeps the raw tint)', () => {
  const handed = (css.match(/var\\(--gd-tint-hand, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\)/g) || []).length;
  assert.ok(handed >= 80, `the handed stops thinned: ${handed} < 80`);
  // the artfin seats stay raw BY LAW (the sprite blends against the picture)
  for (const fin of ['numeix', 'auric', 'nuri']) {
    const art = block(css, `.gd-artfin-${fin}`);
    assertMatch(art, /var\\(--gd-card-tint, var\\(--gd-panel\\)\\)/, `the artfin-${fin} lost the raw tint`);
    assert.ok(!art.includes('--gd-tint-hand,'), `the artfin-${fin} was handed — the law is broken`);
  }
  // the veil reads the hand too (its ink is the twin — overlay deepens)
  const veil = /^\\.gd-finish-nuri::before \\{[\\s\\S]*?\\n\\}/m.exec(css)?.[0]?.replace(/:not\\(\\.is-art-zone\\)/g, '').replace(/\\.gd-card-face-finish /g, '') ?? '';
  assertMatch(veil, /background: var\\(--gd-tint-hand, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\);/, 'the veil never read the hand');
});""",
"""ok('A3 — every tint-leaning stop reads the hand (1.9.9: the artfins join it)', () => {
  const handed = (css.match(/var\\(--gd-tint-hand, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\)/g) || []).length;
  assert.ok(handed >= 80, `the handed stops thinned: ${handed} < 80`);
  // 1.9.9 — the artfin seats JOIN the hand (the picture's coat is colored
  // by the card's hue and saturation too, at the lean's own art seat —
  // the raw-tint law retired with the brightness-dependence it carried)
  for (const fin of ['numeix', 'auric', 'nuri']) {
    const art = block(css, `.gd-artfin-${fin}`);
    assertMatch(art, /var\\(--gd-tint-hand, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)/, `the artfin-${fin} never joined the hand`);
  }
  // the veil reads the hand too (its ink is the lean — overlay deepens)
  const veil = /^\\.gd-finish-nuri::before \\{[\\s\\S]*?\\n\\}/m.exec(css)?.[0]?.replace(/:not\\(\\.is-art-zone\\)/g, '').replace(/\\.gd-card-face-finish /g, '') ?? '';
  assertMatch(veil, /background: var\\(--gd-tint-hand, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\);/, 'the veil never read the hand');
});""")

# the twin-write pin inside 197's A8
patch(S, """    assertMatch(surface, /\\['--gd-fin-ink'\\]: finishInkTwin\\(/, 'a surface lost the twin write');""",
"""    assertMatch(surface, /\\['--gd-fin-ink'\\]: finishTintLean\\(/, 'a surface lost the lean write');""")

# ---------------------------------------------------------------- 198 (1.9.7)
S = "scripts/gendex_198_batch_dom.test.mjs"

patch(S, """ok('A1 — the twin measures in light (the luma rail, both sides, the exact solve)', () => {
  const fnSrc = /export function finishInkTwin[\\s\\S]*?\\n\\}/.exec(ribbon)?.[0] || '';
  assertMatch(fnSrc, /const lum = 0\\.2126 \\* r \\+ 0\\.7152 \\* g \\+ 0\\.0722 \\* b;/, 'the luminance yardstick never spoke');
  assertMatch(fnSrc, /const target = lum >= 0\\.7 \\? Math\\.min\\(0\\.35 \\+ 0\\.3 \\* lum, lum - 0\\.16\\) : lum \\+ 0\\.16;/, 'the two-sided rail never spoke');
  assertMatch(fnSrc, /const lumaAt = \\(ll\\) => \\{/, 'the exact solve never spoke');
  assertMatch(fnSrc, /for \\(let i = 0; i < 24; i \\+= 1\\) \\{/, 'the bisection lost its steps');
  assert.ok(!/return `#\\$\\{m\\.slice\\(1\\)/.test(fnSrc), 'the raw passthrough survived');
  // the derivation itself, spoken in numbers: the yellow suggestion's
  // own cure (HSL L = 0.5 passed through raw in 1.9.6; the luma rail
  // hands it a dark gold shadow a full fifth of light below the plate)
  const twin = new Function('return ' + fnSrc.replace('export function', 'function'))();
  const lumOf = (h) => {
    const n = parseInt(h.slice(1), 16);
    return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  };
  for (const [plate, minDist] of [['#ffffff', 0.3], ['#ffd400', 0.18], ['#ffff00', 0.2], ['#00ff00', 0.15], ['#ff0000', 0.15], ['#000000', 0.15], ['#800000', 0.15], ['#7fd1d8', 0.15]]) {
    const t = twin(plate);
    assert.ok(/^#[0-9a-f]{6}$/.test(t), `${plate}: the twin did not speak a hex`);
    const dist = Math.abs(lumOf(t) - lumOf(plate));
    assert.ok(dist >= minDist, `${plate}: the twin sat ${dist.toFixed(3)} from its plate (needed ${minDist})`);
  }
  // the measured-good white keeps its 1.9.6 gray shadow
  assert.equal(twin('#ffffff'), '#a6a6a6', 'white lost its measured shadow');
});""",
"""ok('A1 — the ink derivation carries its own contrast (1.9.9: the lean, the fixed seat, the exact solve)', () => {
  const fnSrc = /export function finishTintLean[\\s\\S]*?\\n\\}/.exec(ribbon)?.[0] || '';
  assertMatch(fnSrc, /const LEAN_LUMA = Number\\.isFinite\\(\\+seat\\) \\? Math\\.min\\(0\\.9, Math\\.max\\(0\\.1, \\+seat\\)\\) : 0\\.45;/, 'the fixed seat never spoke');
  assertMatch(fnSrc, /const lumaAt = \\(ll\\) => \\{/, 'the exact solve never spoke');
  assertMatch(fnSrc, /for \\(let i = 0; i < 24; i \\+= 1\\) \\{/, 'the bisection lost its steps');
  assert.ok(!/return `#\\$\\{m\\.slice\\(1\\)/.test(fnSrc), 'the raw passthrough survived');
  // the derivation itself, spoken in numbers: the yellow suggestion's
  // own cure lands BY LAW now (the fixed 0.45 seat hands the
  // high-luminance hues a dark gold a full fifth of light below the
  // plate — the 1.9.7 patch's own seat, derived instead of pinned)
  const lean = new Function('return ' + fnSrc.replace('export function', 'function'))();
  const lumOf = (h) => {
    const n = parseInt(h.slice(1), 16);
    return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  };
  for (const [plate, minDist] of [['#ffffff', 0.3], ['#ffd400', 0.18], ['#ffff00', 0.2], ['#00ff00', 0.15], ['#ff0000', 0.15], ['#000000', 0.15], ['#800000', 0.15], ['#7fd1d8', 0.15]]) {
    const t = lean(plate);
    assert.ok(/^#[0-9a-f]{6}$/.test(t), `${plate}: the lean did not speak a hex`);
    const dist = Math.abs(lumOf(t) - lumOf(plate));
    assert.ok(dist >= minDist, `${plate}: the lean sat ${dist.toFixed(3)} from its plate (needed ${minDist})`);
  }
  // 1.9.9 — white keeps its honest gray at the fixed seat (the 1.9.6
  // shadow gray #a6a6a6 retired with the plate-solved rail)
  assert.equal(lean('#ffffff'), '#737373', 'white lost its honest gray');
});""")

patch(S, """ok('A3 — the hand speaks everywhere (both wrappers, every ground)', () => {
  assertMatch(css, /\\.gd-card-face-finish,\\s*\\n\\.gd-card-face-artfin \\{\\s*\\n  --gd-tint-hand: var\\(--gd-fin-ink, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\);\\s*\\n\\}/, 'the universal hand never spoke');
});""",
"""ok('A3 — the hand speaks everywhere (1.9.9: the base declaration carries the lean)', () => {
  const seat = block(css, '.gd-card-face-finish');
  assertMatch(seat, /--gd-tint-hand: var\\(--gd-fin-ink, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\);/, 'the base hand never spoke the lean');
  assert.ok(!/\\.gd-card-face-finish,\\s*\\n\\.gd-card-face-artfin \\{\\s*\\n  --gd-tint-hand: var\\(--gd-fin-ink/.test(css), 'the universal override survived as a duplicate');
});""")

patch(S, """ok('A8 — every card surface writes the twin (a color picks a ground now)', () => {
  for (const surface of [grid, look, ribbon]) {
    assertMatch(surface, /\\['--gd-fin-ink'\\]: finishInkTwin\\(/, 'a surface lost the twin write');
  }
});""",
"""ok('A8 — every card surface writes the lean and its seats (a color picks a ground now)', () => {
  for (const surface of [grid, look, ribbon]) {
    assertMatch(surface, /\\['--gd-fin-ink'\\]: finishTintLean\\(/, 'a surface lost the lean write');
    assertMatch(surface, /\\['--gd-fin-glow'\\]: finishTintLean\\((?:character\\.)?cardColor, 0\\.78\\)/, 'a surface lost the glow seat');
    assertMatch(surface, /\\['--gd-fin-art'\\]: finishTintLean\\((?:character\\.)?cardColor, 0\\.75\\)/, 'a surface lost the art seat');
  }
});""")

# ---------------------------------------------------------------- 199 (1.9.8)
S = "scripts/gendex_199_batch_dom.test.mjs"

patch(S, """ok('B1 — the twin\\'s rail speaks the 0.70 line (the glow fades past it)', () => {
  const fnSrc = /export function finishInkTwin[\\s\\S]*?\\n\\}/.exec(ribbon)?.[0] || '';
  assertMatch(fnSrc, /const target = lum >= 0\\.7 \\? Math\\.min\\(0\\.35 \\+ 0\\.3 \\* lum, lum - 0\\.16\\) : lum \\+ 0\\.16;/, 'the quiet seam never spoke');
  // evaluated live: the pastel band LIFTS now (the glow side of the rail)
  const twin = new Function('return ' + fnSrc.replace('export function', 'function'))();
  const lumOf = (h) => {
    const n = parseInt(h.slice(1), 16);
    return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  };
  // the center-top patients the report names: the twin sits ABOVE them
  // (the screen family's lift ink — the glow, not the inversion)
  for (const plate of ['#8080ff', '#9a80ff', '#ff8080', '#ff80ff', '#ff9980']) {
    const t = twin(plate);
    const d = lumOf(t) - lumOf(plate);
    assert.ok(d >= 0.15, `${plate}: the pastel twin sat ${d.toFixed(3)} above the plate (needed the lift)`);
  }
  // the bright edge keeps the shadow (white's measured gray, the
  // sunburst's dark gold — the 1.9.7 cures keep their seats)
  assert.equal(twin('#ffffff'), '#a6a6a6', 'white lost its measured shadow');
  for (const [plate, minDist] of [['#ffffff', 0.3], ['#ffd400', 0.18], ['#ffff00', 0.2], ['#00ff00', 0.15], ['#ff0000', 0.15], ['#000000', 0.15]]) {
    const dist = Math.abs(lumOf(twin(plate)) - lumOf(plate));
    assert.ok(dist >= minDist, `${plate}: the twin sat ${dist.toFixed(3)} from its plate (needed ${minDist})`);
  }
});""",
"""ok('B1 — the lean speaks the fixed seats (1.9.9: brightness never enters the ink)', () => {
  const fnSrc = /export function finishTintLean[\\s\\S]*?\\n\\}/.exec(ribbon)?.[0] || '';
  assertMatch(fnSrc, /const LEAN_LUMA = Number\\.isFinite\\(\\+seat\\) \\? Math\\.min\\(0\\.9, Math\\.max\\(0\\.1, \\+seat\\)\\) : 0\\.45;/, 'the fixed seat never spoke');
  assert.ok(!/const lum = 0\\.2126/.test(fnSrc), 'the lean still measured the plate');
  // evaluated live: the center-top patients the report names keep their
  // glow — the GLOW seat (0.78) sits above every pastel plate (the
  // screen family's carrying light, fixed and brightness-blind now)
  const lean = new Function('return ' + fnSrc.replace('export function', 'function'))();
  const lumOf = (h) => {
    const n = parseInt(h.slice(1), 16);
    return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  };
  for (const plate of ['#8080ff', '#9a80ff', '#ff8080', '#ff80ff', '#ff9980']) {
    const t = lean(plate, 0.78);
    const d = lumOf(t) - lumOf(plate);
    assert.ok(d >= 0.15, `${plate}: the pastel glow sat ${d.toFixed(3)} above the plate (needed the lift)`);
  }
  // the bright edge keeps its contrast (white's honest gray at the fixed
  // seat, the sunburst's dark gold — the 1.9.7 cures keep their seats)
  assert.equal(lean('#ffffff'), '#737373', 'white lost its honest gray');
  for (const [plate, minDist] of [['#ffffff', 0.3], ['#ffd400', 0.18], ['#ffff00', 0.2], ['#00ff00', 0.15], ['#ff0000', 0.15], ['#000000', 0.15]]) {
    const dist = Math.abs(lumOf(lean(plate)) - lumOf(plate));
    assert.ok(dist >= minDist, `${plate}: the lean sat ${dist.toFixed(3)} from its plate (needed ${minDist})`);
  }
  // and the quiet seam lives on in the GROUND classes alone (the blend
  // families' own line — the ink's seam retired with the twin)
  assertMatch(ribbon, /if \\(lum >= 0\\.7\\) return lum >= 0\\.78 \\? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';/, 'the ground seam law never spoke');
});""")

patch(S, """ok('C2 — the art twin keeps the RAW tint (the artfin\\'s own law, extended)', () => {
  assertMatch(
    css,
    /\\.gd-card-face-finish\\.is-art-zone,\\s*\\n\\.gd-card-face-artfin\\.is-art-zone \\{\\s*\\n  --gd-tint-hand: var\\(--gd-card-tint, var\\(--gd-panel\\)\\);\\s*\\n\\}/,
    'the art twin never fell back to the raw tint'
  );
});""",
"""ok('C2 — the art twin speaks the lean\\'s own ART seat (1.9.9: hue + saturation at the picture\\'s register)', () => {
  assertMatch(
    css,
    /\\.gd-card-face-finish\\.is-art-zone,\\s*\\n\\.gd-card-face-artfin\\.is-art-zone \\{\\s*\\n  --gd-tint-hand: var\\(--gd-fin-art, var\\(--gd-fin-ink, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\)\\);\\s*\\n\\}/,
    'the art twin never spoke the art seat'
  );
});""")

print("patch_law_pins_200: 197/198/199 healed to the lean's laws")
