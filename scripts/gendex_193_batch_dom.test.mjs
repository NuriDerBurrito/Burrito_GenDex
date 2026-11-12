// 1.9.2 batch — The Listening Ground.
// (Named 193 in the sequence: 190 pins the 1.8.9 laws, 191 the 1.8.10,
//  192 the 1.9.1 laws; this suite pins the 1.9.2 laws at their roots.
//  Built on the 1.9.1 tree — the release line continues.)
// The reported item, pinned at its root law:
//   A.  THE GROUND LISTENS TO THE CLOTH ("when applying finishes to
//       colorless cards (aka cards defaulted to theme color) it should
//       react to the theme color itself, since for some reason in finishes
//       such as numeix finish would make it inverted or not react to the
//       color correctly, fix that so it does"): the 1.7.4 grounds were
//       FIXED HEXES (numeix's bright parchment among them), so an uncolored
//       card wearing a coat spoke the COAT's own plate no matter what cloth
//       the app wore — inverted on a dark theme, deaf to a Manual Colors
//       drag. The plates retire: every ground is a color-mix over
//       var(--gd-panel) itself, the ink seats speak the theme's own tokens,
//       and every card surface (grid, look editor, compact preview) carries
//       the one law.
//   B.  THE DIRECTION LAW, COMPUTED — the mix can never invert: a dark
//       panel stays dark under every material's lean, a light panel stays
//       light (the reported numeix inversion, disproven by arithmetic on
//       the real theme presets' own panels).
//   C.  THE FURNITURE — the version seats speak 1.9.2, the changelog head
//       tells this story, the README badge + battery count welcome this
//       very suite, and the battery runner runs it.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { THEME_PRESETS } from '../src/constants/index.js';

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

const css = src('src/index.css');
const grid = src('src/components/GridView.jsx');
const look = src('src/components/CardLookEditor.jsx');
const ribbon = src('src/components/TagRibbon.jsx');

// The ground map itself, parsed straight out of the source (the law's own
// seat — no fixture, no copy): { numeix: 'color-mix(in srgb, var(--gd-panel) 72%, #a5814f 28%)', ... }
const GROUND_BLOCK = ribbon.match(
  /export const FINISH_GROUND = \{\n((?:[ ]+\w+: '[^']+',\n)+)\};/
);
const GROUND = {};
if (GROUND_BLOCK) {
  for (const line of GROUND_BLOCK[1].trim().split('\n')) {
    const m = line.match(/^\s*(\w+): '(.+)',\s*$/);
    if (m) GROUND[m[1]] = m[2];
  }
}

// A tiny sRGB mixer — the browser's own color-mix(in srgb) law, spoken in
// numbers so the direction law can be PROVEN, not just asserted.
const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const relLum = ([r, g, b]) => {
  const lin = [r, g, b].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
};
const mixSrgb = (a, b, ratioB) =>
  hexToRgb(a).map((c, i) => Math.round(c * (1 - ratioB) + hexToRgb(b)[i] * ratioB));

console.log('A. THE GROUND LISTENS TO THE CLOTH ("it should react to the theme color itself")');

ok('A1 — every ground is a color-mix over the theme\'s own panel (six materials, zero fixed plates)', () => {
  assert.ok(GROUND_BLOCK, 'the FINISH_GROUND map never spoke');
  for (const f of ['numeix', 'foil', 'auric', 'holographic', 'prismatic', 'nuri']) {
    assert.ok(GROUND[f], `the ${f} ground never spoke`);
    assert.ok(
      GROUND[f].startsWith('color-mix(in srgb, var(--gd-panel) '),
      `the ${f} ground never mixed the theme's own panel — it spoke: ${GROUND[f]}`
    );
    assert.match(GROUND[f], /%, #[0-9a-fA-F]{6} \d+%\)$/, `the ${f} ground's mix ratio never spoke`);
  }
  // the old fixed plates are gone — no ground is a bare hex anymore
  for (const v of Object.values(GROUND)) {
    assert.ok(!/^#[0-9a-fA-F]{6}$/.test(v), `a retired fixed plate survived: ${v}`);
  }
});

ok('A2 — the numeix inversion plate is retired (the reported hex is gone from the map)', () => {
  // the reported finish's old ground — a bright parchment that read as
  // INVERTED on every dark theme — must not survive anywhere in the map
  assert.ok(!ribbon.includes("'#e9dec4'"), 'the bright parchment plate survived the retirement');
  // and the law itself is told at the map's own seat
  /* 1.9.3 — the pin reverts the sweep's over-reach: the law keeps its
     birth version in the prose (the comment skip's own promise). */
  assertMatch(ribbon, /1\.9\.2 — THE GROUND LISTENS TO THE CLOTH/, 'the 1.9.2 law note never spoke');
  // the report's own words, quoted at the law's own seat (the quote wraps
  // across the comment's lines — the pin speaks the wrapped shape)
  assertMatch(ribbon, /it should react\s*\n\/\/\s*to the theme color itself/, 'the report\'s own words never spoke');
});

ok('A3 — the theme var is spoken by NAME in every ground (the live-reactivity law)', () => {
  // the mix must read the live CSS var — not a snapshot of it — so a theme
  // switch AND a Manual Colors drag both answer in the same frame
  for (const [f, v] of Object.entries(GROUND)) {
    assert.ok(v.includes('var(--gd-panel)'), `the ${f} ground never spoke the live panel var`);
  }
});

console.log('\nB. THE GRID CARD\'S SEATS (the borrowed ground arrives for colorless cards only)');

ok('B1 — the ground still arrives only when the card speaks no color of its own', () => {
  assertMatch(grid, /const finishGround =\s*\n\s*cardFinish !== 'none' && !character\.cardColor \? FINISH_GROUND\[cardFinish\] \|\| null : null;/, 'the ground const never spoke');
  assertMatch(grid, /\['--gd-card-tint'\]: character\.cardColor \|\| finishGround \|\| 'var\(--gd-panel\)'/, 'the tint never read the ground');
  assertMatch(grid, /\.\.\.\(finishGround \? \{ backgroundColor: finishGround \} : null\),/, 'the card paper never painted the ground');
  assertMatch(grid, /\['--gd-foot-plate'\]: character\.cardColor \|\| finishGround \|\| 'var\(--gd-panel\)'/, 'the corner rise never spoke the ground');
});

ok('B2 — the ink seats speak the THEME\'S OWN tokens (readableInk never reads a mix)', () => {
  // the plate's printing on a ground card speaks the theme's panel text
  assertMatch(grid, /: finishGround\s*\n\s*\? \{ backgroundColor: finishGround, color: 'var\(--gd-panel-text\)' \}/, 'the foot never spoke the theme text token');
  // the readableInk(finishGround) era is over — a color-mix is not a hex
  assert.ok(!grid.includes('readableInk(finishGround)'), 'the grid still inked the mix as if it were a hex');
  assert.ok(!look.includes('readableInk(finishGround)'), 'the look editor still inked the mix as if it were a hex');
  assert.ok(!ribbon.includes('readableInk(finishGround)'), 'the compact preview still inked the mix as if it were a hex');
  // the title/meta/badge seats carry no ground rung anymore — the themed
  // tokens speak directly, exactly as the uncoated card always spoke
  assertMatch(grid, /style=\{\{ color: character\.cardColor \? readableInk\(character\.cardColor\) : 'var\(--gd-panel-text\)' \}\}/, 'the title never spoke the theme token');
  assertMatch(grid, /style=\{\{ color: character\.cardColor \? readableInk\(character\.cardColor\) : 'var\(--gd-mute\)' \}\}/, 'the meta never spoke the theme token');
  assertMatch(grid, /style=\{\{ color: character\.cardColor \? readableInk\(character\.cardColor\) : 'var\(--gd-accent\)' \}\}/, 'the badge never spoke the theme token');
});

ok('B3 — the rim derives from the picked ink alone; colorless falls to the theme\'s counter', () => {
  assertMatch(grid, /const plateInk = character\.cardColor \? readableInk\(character\.cardColor\) : null;/, 'the rim never shed the ground rung');
  assertMatch(grid, /const finRim = plateInk\s*\n\s*\? counterRimFor\(plateInk\) \|\| 'var\(--gd-text-counter\)'\s*\n\s*: 'var\(--gd-text-counter\)';/, 'the rim ladder never spoke');
});

console.log('\nC. THE LOOK EDITOR + THE COMPACT PREVIEW SPEAK THE SAME LAW');

ok('C1 — the look editor\'s panzoom carries the ground + theme-token seats', () => {
  assertMatch(look, /const finishGround = finish !== 'none' && !cardColor \? FINISH_GROUND\[finish\] \|\| null : null;/, 'the editor ground never spoke');
  assertMatch(look, /\['--gd-card-tint'\]: cardColor \|\| finishGround \|\| 'var\(--gd-panel\)'/, 'the editor tint never read the ground');
  assertMatch(look, /: finishGround\s*\n\s*\? \{ backgroundColor: finishGround, color: 'var\(--gd-panel-text\)' \}/, 'the editor foot never spoke the theme text token');
  assertMatch(look, /const plateInk = cardColor \? readableInk\(cardColor\) : null;/, 'the editor rim never shed the ground rung');
  assertMatch(look, /style=\{\{ color: cardColor \? readableInk\(cardColor\) : 'var\(--gd-panel-text\)' \}\}/, 'the editor title never spoke the theme token');
});

ok('C2 — the compact preview (CardPreview) carries the same seats', () => {
  assertMatch(ribbon, /const finishGround = finish !== 'none' && !cardColor \? FINISH_GROUND\[finish\] \|\| null : null;/, 'the preview ground never spoke');
  assertMatch(ribbon, /\['--gd-card-tint'\]: cardColor \|\| finishGround \|\| 'var\(--gd-panel\)'/, 'the preview tint never read the ground');
  assertMatch(ribbon, /: finishGround\s*\n\s*\? \{ backgroundColor: finishGround, color: 'var\(--gd-panel-text\)' \}/, 'the preview foot never spoke the theme text token');
  assertMatch(ribbon, /const plateInk = cardColor \? readableInk\(cardColor\) : null;/, 'the preview rim never shed the ground rung');
});

ok('C3 — the CSS seats keep consuming the vars inside color-mix (the nested-mix law)', () => {
  // the nuri lean reads --gd-card-tint INSIDE a color-mix — a ground that
  // is itself a mix is a legal nested color, and the seat proves it stays
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the nested-mix law keeps its
     word in the classic form — the picture's fire band reads the card's
     RAW tint inside a color-mix (a ground that is itself a mix is a
     legal nested color), verbatim from the 1.9.2 sheet. */
  assertMatch(css, /color-mix\(in srgb, var\(--gd-card-tint, var\(--gd-panel\)\) 58%, transparent\)/, 'the nuri lean never read the tint inside a mix');
  // the foot plate's corner rise reads the var as a plain background
  assertMatch(css, /background: var\(--gd-foot-plate, transparent\);/, 'the corner rise never read the plate var');
});

console.log('\nD. THE DIRECTION LAW, COMPUTED (the numeix inversion disproven by arithmetic)');

ok('D1 — a dark theme\'s panels stay dark under every material\'s lean (no inversion)', () => {
  // every dark preset panel (rel luminance < 0.5) mixed with every
  // material's tint must STAY in the dark half — the 1.7.4 era's bright
  // parchment plate read at ~0.74 on this same rail
  const darkPanels = THEME_PRESETS.filter((t) => relLum(hexToRgb(t.panel)) < 0.5);
  assert.ok(darkPanels.length >= 8, 'the preset ladder lost its dark cloths');
  for (const t of darkPanels) {
    for (const [f, v] of Object.entries(GROUND)) {
      const ratio = Number(v.match(/(\d+)%\)$/)[1]) / 100;
      const tint = v.match(/#([0-9a-fA-F]{6})/)[1];
      const mixed = mixSrgb(t.panel, tint, ratio);
      assert.ok(
        relLum(mixed) < 0.5,
        `${f} over ${t.id}'s panel (#${t.panel}) inverted the cloth: ${relLum(mixed).toFixed(3)}`
      );
    }
  }
});

ok('D2 — a light theme\'s panels stay light under every material\'s lean', () => {
  // the ivory family keeps its daylight — the deep plates (holo, prism,
  // nuri) lean harder but never drag the cloth past the mid rail
  const lightPanels = THEME_PRESETS.filter((t) => relLum(hexToRgb(t.panel)) >= 0.5);
  assert.ok(lightPanels.length >= 1, 'the preset ladder lost its light cloths');
  for (const t of lightPanels) {
    for (const [f, v] of Object.entries(GROUND)) {
      const ratio = Number(v.match(/(\d+)%\)$/)[1]) / 100;
      const tint = v.match(/#([0-9a-fA-F]{6})/)[1];
      const mixed = mixSrgb(t.panel, tint, ratio);
      assert.ok(
        relLum(mixed) > 0.14,
        `${f} over ${t.id}'s panel (#${t.panel}) sank the cloth into pitch: ${relLum(mixed).toFixed(3)}`
      );
    }
  }
});

ok('D3 — every ground keeps the theme\'s own text readable (the token law, computed)', () => {
  // the plate's printing speaks var(--gd-panel-text) — the theme's own
  // text on its own cloth. The ground is at most 36% tint, so the theme's
  // designed contrast survives the lean on every preset
  for (const t of THEME_PRESETS) {
    for (const [f, v] of Object.entries(GROUND)) {
      const ratio = Number(v.match(/(\d+)%\)$/)[1]) / 100;
      const tint = v.match(/#([0-9a-fA-F]{6})/)[1];
      const mixed = mixSrgb(t.panel, tint, ratio);
      const lumText = relLum(hexToRgb(t.panelText));
      const lumGround = relLum(mixed);
      const hi = Math.max(lumText, lumGround);
      const lo = Math.min(lumText, lumGround);
      const ratio4 = (hi + 0.05) / (lo + 0.05);
      assert.ok(
        ratio4 >= 3.0,
        `${t.id}'s panel text fell under 3:1 on the ${f} ground (${ratio4.toFixed(2)}:1)`
      );
    }
  }
});

console.log('\nE. THE FURNITURE');

ok('E1 — the version is 1.9.2 everywhere', () => {
  const pkg = JSON.parse(src('package.json'));
  assert.equal(pkg.version, '1.9.19', 'package.json');
  const lock = JSON.parse(src('package-lock.json'));
  assert.equal(lock.version, '1.9.19', 'package-lock.json head');
  assert.equal(lock.packages[''].version, '1.9.19', 'package-lock.json root seat');
  const constants = src('src/constants/index.js');
  assert.ok(constants.includes("version: '1.9.19'"), 'the APP constant');
});

ok('E2 — the changelog head tells this story', () => {
  const head = src('CHANGELOG.md');
  assert.ok(head.startsWith('## 1.9.19 — The Ends Trade Places'));
  assert.ok(head.includes('color-mix over var(--gd-panel)'));
  assert.ok(head.includes('react to the theme color itself'));
});

ok('E3 — the README badge + battery count welcome this very suite', () => {
  const readme = src('README.md');
  /* 1.9.3 — the badge is a LIVE seat; it speaks the current release. */
  /* 1.9.6 — the badge is a LIVE seat: it speaks 1.9.6 now. */
  assert.ok(readme.includes('version-1.9.19-purple'));
  assert.ok(readme.includes('93 DOM/source test suites'));
});

ok('E4 — the battery runner welcomes this very suite', () => {
  const runner = src('scripts/run_battery_171.sh');
  assert.ok(runner.includes('gendex_193_batch_dom'));
});

console.log(`${passed} passed, ${failed} failed`);
if (failed) console.log('FIX ABOVE');
else console.log('ALL GREEN');
process.exit(failed ? 1 : 0);
