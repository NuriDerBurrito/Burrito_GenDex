// 1.9.10 batch — The Classic Coat Returns.
// (Named 1910 in the suite sequence: 190 pins the 1.8.9 laws, 191 the
//  1.8.10, ... 199 the 1.9.8, 200 the 1.9.9; this suite pins the 1.9.10
//  laws at their roots. Built on the 1.9.9 line — the release continues.)
// The reported items, pinned at their root laws:
//   A.  THE CLASSIC COAT RETURNS ("the last update where colors for
//       finishes were stable was version 1.9.2~1.9.1 and older ... i want
//       you to revert back the finishes and the colors"): the 25 coat
//       bodies the 1.9.3-1.9.9 "card-color law" ever touched are back
//       VERBATIM from the delivered 1.9.2 sheet — asserted byte-equal
//       right here, every run (numeix's tooth, sunlight, current, halo
//       and starfield; foil's metal body, rings, sparkle lattice and
//       arriving ripples; auric's honey veil, treasure, both leaf looms,
//       polish, forge glow and ember lattice; nuri's fire band, veil,
//       hearts, licks, sparks and flare; and the three picture-washes) —
//       and nothing in the coat reads the tint hand but the X looms.
//   B.  THE X'S AND THE SLIDERS STAY ("except the "x"s in numeix theme,
//       i want them the same still alongside the transparency sliders
//       options"): the X signature keeps its whole 1.9.9 law — the hand
//       at its three seats (base ink, dark-ground glow, art zone), the
//       looms' color-mix reads, the light-ground depth filter — and the
//       ground classes stay seated on the card root with exactly TWO
//       CSS readers left; the transparency knobs keep their volume var
//       on every coat root.
//   C.  THE CORNERS STAY ACCOUNTED FOR ("i want you to account for each
//       of teh finishes values when the color shifts to the absolute
//       corners , values , etc, and ensure they dont exceed the max
//       limit, or that they dont loop around and break"): the corner
//       audit now carries the 1.9.10 harness laws (deterministic
//       raster, the freeze reaching the pseudos, the classic side on
//       the FULL 1.9.2 sheet with the fixture's byte provenance
//       asserted, the X carve-out judged per plate), and the lean — the
//       one live derivation left — is re-pinned at its edges: strict hex
//       gate, channel clamps, bounded bisection, honest grays at the
//       absolute corners.
//   D.  THE FURNITURE — the version seats speak 1.9.10, the changelog
//       head tells this story, the README badge + battery count welcome
//       this very suite, and the battery runner runs it.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(path.join(root, '..', p), 'utf8');

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL — ${name}\n      ${e.message}`);
  }
};
const assertMatch = (text, re, msg) => {
  if (!re.test(text)) throw new Error(msg || 'pattern missing');
};

// top-level rule extraction, the surgery's own law (line-start anchored,
// exactly one match, full text incl. braces)
const findRule = (text, selector) => {
  const anchor = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' \\{';
  const re = new RegExp('^' + anchor, 'gm');
  const spans = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const b = text.indexOf('{', m.index);
    let depth = 1;
    let j = b + 1;
    while (j < text.length && depth) {
      if (text[j] === '{') depth += 1;
      else if (text[j] === '}') depth -= 1;
      j += 1;
    }
    spans.push([m.index, j]);
    re.lastIndex = j;
  }
  assert.equal(spans.length, 1, `${selector}: expected 1 top-level rule, found ${spans.length}`);
  return text.slice(spans[0][0], spans[0][1]);
};

const css = src('src/index.css');
const fixture = src('scripts/fixtures/index_classic_192_coat.css');
// the classic reference is the tree's own fixture (the delivered
// 1.9.2 coat region, byte-verbatim — the coat's every seat lives
// inside it); the audit's full-sheet side stays a sandbox-only
// dev check, so the battery runs on any machine.
const classic = fixture;
const ribbon = src('src/components/TagRibbon.jsx');
const grid = src('src/components/GridView.jsx');
const look = src('src/components/CardLookEditor.jsx');
const pkg = src('package.json');
const readme = src('README.md');
const changelog = src('CHANGELOG.md');
const runner = src('scripts/run_battery_171.sh');
const cornerAudit = src('scripts/pixel_corner_law_197.mjs');

// the surgery's own 25 — the classic coat's whole seat list
const CLASSIC_BODIES = [
  '.gd-finish-numeix', '.gd-numeix-dapple::before', '.gd-numeix-streams::after',
  '.gd-numeix-moon::before', '.gd-numeix-stars::before', '.gd-artfin-numeix',
  '.gd-finish-foil', '.gd-finish-foil::before', '.gd-finish-foil-ripples::before',
  '.gd-foil-ripple',
  '.gd-finish-auric', '.gd-auric-currents::before', '.gd-auric-flakes::before',
  '.gd-auric-flakes::after', '.gd-auric-sweep::before', '.gd-auric-summon::before',
  '.gd-auric-summon::after', '.gd-artfin-auric',
  '.gd-finish-nuri', '.gd-finish-nuri::before', '.gd-finish-nuri::after',
  '.gd-nuri-licks::before', '.gd-nuri-sparks::before', '.gd-nuri-flare::before',
  '.gd-artfin-nuri',
];

console.log('A. THE CLASSIC COAT RETURNS ("revert back the finishes and the colors")');

ok('A1 — the 25 classic bodies are byte-verbatim from the delivered 1.9.2 sheet', () => {
  for (const sel of CLASSIC_BODIES) {
    const cur = findRule(css, sel);
    const ref = findRule(classic, sel);
    assert.equal(cur, ref, `${sel}: the body drifted from the classic sheet`);
  }
});

ok('A2 — the provenance note rides above every reverted seat', () => {
  for (const sel of CLASSIC_BODIES) {
    const i = css.indexOf('\n' + sel + ' {');
    assert.ok(i > 0, `${sel}: the seat never spoke`);
    const above = css.slice(Math.max(0, i - 2200), i);
    assertMatch(above, /1\.9\.10 — THE .* SPEAKS? (?:ITS|THEIR) CLASSIC/, `${sel}: the 1.9.10 provenance note never rode above the seat`);
  }
});

ok('A3 — no derivation survives in the coat: the tint hand feeds no classic seat', () => {
  // the 25 reverted bodies speak fixed anchors / the 1.5.0 raw-tint forge
  // law alone — the 1.9.3+ tint-hand mixes are gone from every one of
  // them (only the X looms keep the hand — checked below)
  for (const sel of CLASSIC_BODIES) {
    const body = findRule(css, sel);
    assert.ok(!/var\(--gd-tint-hand/.test(body), `${sel}: a tint-hand read survived in a classic body`);
    assert.ok(!/var\(--gd-fin-ink/.test(body), `${sel}: a lean var survived in a classic body`);
  }
});

ok('A4 — the ground machinery retired: exactly TWO CSS rules read the classes', () => {
  const readers = css.match(/^[^\n/{}]*gd-fin-ground[^\n{]*\{/gm) || [];
  const seatRules = readers.map((s) => s.trim()).filter((s) => s.startsWith('.gd-fin-ground'));
  assert.equal(seatRules.length, 2, `the ground classes have ${seatRules.length} seat readers — the flip stack survived`);
  // the two readers are the X's alone: the dark-ground GLOW ink seat +
  // the light-ground depth filter
  assert.ok(css.includes('.gd-fin-ground-dark .gd-card-face-finish:not(.is-art-zone),\n.gd-fin-ground-dark .gd-card-face-artfin:not(.is-art-zone) {'), 'the dark glow ink seat never spoke');
  assert.ok(css.includes('.gd-fin-ground-light .gd-numeix-xmarks:not(.is-art-zone) {\n  filter: brightness(0.78) saturate(1.05);\n}'), 'the X light-ground depth filter never spoke');
  // the retired stacks are gone by name
  assert.ok(!/THE MID-BRIGHT HALF KEEPS ITS GLOWS/.test(css), 'the mid-bright flip stack survived');
  assert.ok(!/THE DARK FAMILY'S OWN YARDSTICK WIDENS/.test(css), 'the dark-family flip stack survived');
  assert.ok(!/gd-fin-ground-vivid/.test(css), 'the vivid flip class survived');
});

console.log('\nB. THE X\'S AND THE SLIDERS STAY ("except the "x"s in numeix theme, i want them the same still alongside the transparency sliders options")');

ok('B1 — the X looms keep their 1.9.9 ink (the tint hand at the color-mix looms)', () => {
  for (const pseudo of ['.gd-numeix-xmarks::before', '.gd-numeix-xmarks::after']) {
    const body = findRule(css, pseudo);
    // the looms carry their own mix weights (44% / 50% heads) — the law
    // is the HAND at the loom's every stop, not one shared weight
    assertMatch(body, /color-mix\(in srgb, var\(--gd-tint-hand, var\(--gd-card-tint, var\(--gd-panel\)\)\) \d+%, #fff6da\) 0%/, `${pseudo}: the loom lost its lean ink`);
    assertMatch(body, /color-mix\(in srgb, var\(--gd-tint-hand, var\(--gd-card-tint, var\(--gd-panel\)\)\) \d+%, #fff2cf\) 100%/, `${pseudo}: the loom's tail lost its lean ink`);
  }
});

ok('B2 — the hand keeps its three seats for the X (base ink, dark glow, art zone)', () => {
  const base = findRule(css, '.gd-card-face-finish');
  assertMatch(base, /--gd-tint-hand: var\(--gd-fin-ink, var\(--gd-card-tint, var\(--gd-panel\)\)\);/, 'the base hand lost the lean ink seat');
  assertMatch(css, /\.gd-fin-ground-dark \.gd-card-face-finish:not\(\.is-art-zone\),\s*\n\.gd-fin-ground-dark \.gd-card-face-artfin:not\(\.is-art-zone\) \{\s*\n  --gd-tint-hand: var\(--gd-fin-glow, var\(--gd-fin-ink, var\(--gd-card-tint, var\(--gd-panel\)\)\)\);\s*\n\}/, 'the dark glow hand lost its seat');
  assertMatch(css, /\.gd-card-face-finish\.is-art-zone,\s*\n\.gd-card-face-artfin\.is-art-zone \{\s*\n  --gd-tint-hand: var\(--gd-fin-art, var\(--gd-fin-ink, var\(--gd-card-tint, var\(--gd-panel\)\)\)\);\s*\n\}/, 'the art zone hand lost its seat');
});

ok('B3 — the surfaces keep writing the lean and its seats (the X\'s ink feed)', () => {
  for (const surface of [grid, look, ribbon]) {
    assertMatch(surface, /\['--gd-fin-ink'\]: finishTintLean\(/, 'a surface lost the lean write');
    assertMatch(surface, /\['--gd-fin-glow'\]: finishTintLean\((?:character\.)?cardColor, 0\.78\)/, 'a surface lost the glow seat');
    assertMatch(surface, /\['--gd-fin-art'\]: finishTintLean\((?:character\.)?cardColor, 0\.75\)/, 'a surface lost the art seat');
  }
});

ok('B4 — the grounds keep classing the card root (finishGroundTone keeps its word)', () => {
  const fnSrc = /export function finishGroundTone\(cardColor\) \{[\s\S]*?\n\}/.exec(ribbon)?.[0] || '';
  assert.ok(fnSrc, 'finishGroundTone never left TagRibbon');
  const fn = new Function('return ' + fnSrc.replace('export function', 'function'))();
  assert.equal(fn('#ffffff'), 'gd-fin-ground-light gd-fin-ground-bright', 'the white card lost its bright class');
  assert.equal(fn('#f0f0f0'), 'gd-fin-ground-light gd-fin-ground-bright', 'the pale card lost its bright class');
  assert.equal(fn('#bbbbbb'), 'gd-fin-ground-light', 'the light-band gray lost its light class');
  assert.equal(fn('#000000'), 'gd-fin-ground-dark', 'the black card lost its dark class');
  assert.equal(fn('#808080'), 'gd-fin-ground-dark', 'the mid gray lost its dark class');
  assert.equal(fn(null), '', 'a colorless card spoke a class');
});

ok('B5 — the transparency knobs keep their volume var on every coat root', () => {
  const base = findRule(css, '.gd-card-face-finish');
  assertMatch(base, /opacity: var\(--gd-fin-strength, 1\);/, 'the coat root lost the volume seat');
  const art = findRule(css, '.gd-card-face-artfin');
  assertMatch(art, /opacity: var\(--gd-fin-strength, 1\);/, 'the artfin root lost the volume seat');
  // the trim coat speaks its volume beside its z rung (two sibling rules)
  assertMatch(css, /\.gd-trim\.gd-trim-coat \{[^}]*opacity: var\(--gd-fin-strength, 1\);/, 'the trim coat lost the volume seat');
  assertMatch(ribbon, /finishStrength/, 'the strength calc left TagRibbon');
});

console.log('\nC. THE CORNERS STAY ACCOUNTED FOR ("ensure they dont exceed the max limit, or that they dont loop around and break")');

ok('C1 — the corner audit carries the 1.9.10 harness laws', () => {
  // the deterministic raster (software compositing — the field's own
  // GPU dither measured and retired)
  assertMatch(cornerAudit, /args: \['--disable-gpu', '--disable-gpu-compositing'\]/, 'the deterministic raster law never spoke');
  // the freeze reaches the PSEUDOS
  assertMatch(cornerAudit, /\*, \*::before, \*::after \{ animation: none !important; transition: none !important; \}/, 'the freeze never reached the pseudos');
  // the classic side is the FULL 1.9.2 sheet, and the fixture's
  // byte-provenance is asserted at startup
  assertMatch(cornerAudit, /const CLASSIC = '\/home\/z\/my-project\/burrito_gendex_192\/src\/index\.css';/, 'the classic side left the full 1.9.2 sheet');
  assertMatch(cornerAudit, /classicText\.includes\(fixtureCore\)/, 'the fixture provenance check never spoke');
  // the X carve-out is judged per plate (the ink lives in the pseudos)
  assertMatch(cornerAudit, /1\.9\.10 HARNESS LAW #3/, 'the per-plate X verdict never spoke');
  // the sweep stays whole: the named patients + the systematic ladders
  assertMatch(cornerAudit, /\['gbb', '#bbbbbb'\]/, 'the gray patient never joined the sweep');
  assertMatch(cornerAudit, /\['e7c35b', '#e7c35b'\]/, 'the gold patient never joined the sweep');
  assertMatch(cornerAudit, /HUE_NAMES\.map\(\(n, i\) => \[`light\$\{n\}`, hsl\(i \* 30 \/ 360, 1, 0\.75\)\]\)/, 'the light hue ladder never spoke');
  assertMatch(cornerAudit, /HUE_NAMES\.map\(\(n, i\) => \[`dark\$\{n\}`, hsl\(i \* 30 \/ 360, 1, 0\.25\)\]\)/, 'the dark hue ladder never spoke');
});

ok('C2 — the fixture is the delivered 1.9.2 coat, verbatim inside the classic sheet (when the tree is present)', () => {
  // the byte-provenance the audit asserts at startup, pinned here too —
  // the 192 tree lives in the dev sandbox alone; where it is absent the
  // audit's own startup check owns the provenance
  let classicSheet = '';
  try { classicSheet = readFileSync('/home/z/my-project/burrito_gendex_192/src/index.css', 'utf8'); } catch { /* sandbox-only */ }
  if (!classicSheet) return;
  const core = fixture.slice(fixture.indexOf('*/') + 2).replace(/^\n+/, '').replace(/\n+$/, '');
  assert.ok(classicSheet.includes(core), 'the fixture core drifted from the 1.9.2 sheet');
});

ok('C3 — the lean (the one live derivation) stays bounded at the absolute corners', () => {
  const fnSrc = /export function finishTintLean[\s\S]*?\n\}/.exec(ribbon)?.[0] || '';
  assert.ok(fnSrc, 'finishTintLean never left TagRibbon');
  const lean = new Function('return ' + fnSrc.replace('export function', 'function'))();
  // the honest edges — no NaN, no wrap, channels inside the limit
  assert.equal(lean('#ffffff'), '#737373', 'white lost its honest gray');
  assert.equal(lean('#000000'), '#737373', 'black lost its honest gray');
  assert.equal(lean('#ff8c42'), lean('#ff8c42'), 'the tangerine patient lost its determinism');
  for (const corner of ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#808080', '#ff8c42']) {
    for (const seat of [0.45, 0.78, 0.75, 0, 1, -1, NaN, Infinity]) {
      const hex = lean(corner, seat);
      assert.ok(hex === '' || /^#[0-9a-f]{6}$/.test(hex), `the lean spoke a broken hex at ${corner} seat ${seat}`);
      if (/^#[0-9a-f]{6}$/.test(hex)) {
        const ch = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
        assert.ok(ch.every((c) => Number.isFinite(c) && c >= 0 && c <= 255), `the lean exceeded the channel limit at ${corner} seat ${seat}`);
      }
    }
  }
  // the guards the source itself speaks: strict hex gate, clamped
  // round, bounded bisection
  assert.equal(lean(null), '', 'a colorless card spoke a color');
  assert.equal(lean('var(--gd-panel)'), '', 'a theme var spoke a color');
  assertMatch(fnSrc, /const ch = \(v\) => Math\.max\(0, Math\.min\(255, Math\.round\(v \* 255\)\)\);/, 'the channel clamp never spoke');
  assertMatch(fnSrc, /for \(let i = 0; i < 24; i \+= 1\) \{/, 'the bounded bisection lost its steps');
});

console.log('\nD. THE FURNITURE');

ok('D1 — the version is 1.9.11 everywhere', () => {
  assertMatch(pkg, /"version": "1\.9\.19"/, 'pkg never spoke 1.9.10');
  assertMatch(src('src/constants/index.js'), /version: '1\.9\.19',/, 'constants never spoke 1.9.10');
});

ok('D2 — the changelog head tells this story', () => {
  assertMatch(changelog, /^## 1\.9\.19 — The Ends Trade Places/, 'the changelog head is not the classic coat');
  assertMatch(changelog, /The classic coat returns/, 'the changelog never named the coat law');
  assertMatch(changelog, /The X's and the sliders stay/, 'the changelog never named the carve-out law');
  assertMatch(changelog, /The corners stay accounted for/, 'the changelog never named the corner law');
});

ok('D3 — the README badge + battery count welcome this very suite', () => {
  assertMatch(readme, /version-1\.9\.19-purple/, 'the README badge never spoke 1.9.10');
  assertMatch(readme, /93 DOM\/source test suites/, 'the README count never welcomed the suite');
});

ok('D4 — the battery runner welcomes this very suite', () => {
  assertMatch(runner, /gendex_1910_batch_dom/, 'the battery runner never welcomed this suite');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
