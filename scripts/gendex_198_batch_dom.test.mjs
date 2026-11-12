// 1.9.7 batch — The Cornered Ink.
// (Named 198 in the sequence: 190 pins the 1.8.9 laws, 191 the 1.8.10,
//  192 the 1.9.1, 193 the 1.9.2, 194 the 1.9.3, 195 the 1.9.4, 196 the
//  1.9.5, 197 the 1.9.6; this suite pins the 1.9.7 laws at their roots.
//  Built on the 1.9.6 tree — the release line continues.)
// The reported items, pinned at their root laws:
//   A.  THE CORNERED INK ("the effects vanishing or becoming inverted or
//       turn from white to black when the color is going to high
//       saturation or high brightness or low brightness or low
//       saturation (aka if i pull the color wheel to the most extreme 4
//       corners, top left or top right bottom left bottom right) they
//       always break, and it varries between finishes how they break,
//       some effects become invisible, some turn from bright white to
//       dark black, some just shift in hue weirdly, please test each
//       finish with different colors (especially yellow in the color
//       suggestions) and fix this"): the twin measures in PERCEPTUAL
//       LUMINANCE with a guaranteed 0.16-of-light distance on both
//       sides of its one seam (the yellow suggestion's own #ffd400
//       speaks a dark gold ink — the 1.9.6 HSL rail let it pass through
//       raw), the lightness is solved exactly by bisection, the hand
//       speaks on every ground, the ground classes follow the twin's
//       own 0.5 seam (light + the bright subclass past 0.78, dark
//       below — the vivid class retired), the bright ground speaks
//       normal for the whole coat (normal and multiply are the same
//       pixel over white; the channel-pure brights gain the channels
//       multiply killed), the mid-bright half keeps its glows, the X
//       signature signs in ink, and the dark family gains foil's rings.
//   B.  THE EMBLEM'S PLAIN TRUTH ("the tags are semi worse below the
//       emoji, as if there is a pale spot or a stain or shadow that is
//       too large fix that so there isnt that, i want the emojie and
//       the emojie outline and thats it, no shadows (on the tag ofc)"):
//       the 1.9.6 halo (::before) and under-shadow retire; the mark and
//       its rim alone speak.
//   C.  THE CLASS'S OWN CONTAINER FOLLOWS THE CURSOR ("the preview that
//       follows the cursor is the class with background and so on as if
//       its a cropped screenshot, fix that so its only the class
//       container"): setDragImage hands the cursor the gd-tree-card
//       itself, not the row's snapshot.
//   D.  THE SELECTED LANE SPEAKS LOUDER ("when a class is selected and
//       the accent color affects the background, make it a bit more
//       visible since right now it somewhat blends in"): the lane wash
//       steps 9% -> 16%, the card 14% -> 20% (hover 24%), the bars and
//       the colored ladder step with them.
//   E.  THE FURNITURE — the version seats speak 1.9.7, the changelog
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
const block = (css, selector) => {
  const re = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' \\{[\\s\\S]*?\\n\\}');
  const m = re.exec(css);
  return m ? m[0] : '';
};

const css = src('src/index.css');
const ribbon = src('src/components/TagRibbon.jsx');
const grid = src('src/components/GridView.jsx');
const look = src('src/components/CardLookEditor.jsx');
const sidebar = src('src/components/ClassSidebar.jsx');
const pkg = src('package.json');
const readme = src('README.md');
const changelog = src('CHANGELOG.md');
const runner = src('scripts/run_battery_171.sh');

console.log('A. THE CORNERED INK ("if i pull the color wheel to the most extreme 4 corners ... they always break")');

ok('A1 — the ink derivation carries its own contrast (1.9.9: the lean, the fixed seat, the exact solve)', () => {
  const fnSrc = /export function finishTintLean[\s\S]*?\n\}/.exec(ribbon)?.[0] || '';
  assertMatch(fnSrc, /const LEAN_LUMA = Number\.isFinite\(\+seat\) \? Math\.min\(0\.9, Math\.max\(0\.1, \+seat\)\) : 0\.45;/, 'the fixed seat never spoke');
  assertMatch(fnSrc, /const lumaAt = \(ll\) => \{/, 'the exact solve never spoke');
  assertMatch(fnSrc, /for \(let i = 0; i < 24; i \+= 1\) \{/, 'the bisection lost its steps');
  assert.ok(!/return `#\$\{m\.slice\(1\)/.test(fnSrc), 'the raw passthrough survived');
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
});

ok('A2 — the grounds follow the twin\'s own seam (the vivid class retires)', () => {
  const toneSrc = /export function finishGroundTone[\s\S]*?\n\}/.exec(ribbon)?.[0] || '';
  assertMatch(toneSrc, /if \(lum >= 0\.7\) return lum >= 0\.78 \? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';/, 'the seam law never spoke');
  assertMatch(toneSrc, /return 'gd-fin-ground-dark';/, 'the dark half never spoke');
  assert.ok(!/gd-fin-ground-vivid/.test(toneSrc), 'the vivid class survived its retirement');
  assert.ok(!css.includes('.gd-fin-ground-vivid .gd-finish-foil,'), 'a vivid rule survived in the sheet');
});

ok('A3 — the hand speaks everywhere (1.9.9: the base declaration carries the lean)', () => {
  const seat = block(css, '.gd-card-face-finish');
  assertMatch(seat, /--gd-tint-hand: var\(--gd-fin-ink, var\(--gd-card-tint, var\(--gd-panel\)\)\);/, 'the base hand never spoke the lean');
  assert.ok(!/\.gd-card-face-finish,\s*\n\.gd-card-face-artfin \{\s*\n  --gd-tint-hand: var\(--gd-fin-ink/.test(css), 'the universal override survived as a duplicate');
});

ok('A4 — the light law retired whole (the classic blends speak on every plate)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the mid-bright washes, the
     rainbow normal seat and the bright normal list retired with the
     derivation — the classic native blends speak on every plate. */
  assert.ok(!css.includes('.gd-fin-ground-light .gd-finish-numeix'), 'the mid-bright wash law survived');
  assert.ok(!css.includes('.gd-fin-ground-light .gd-finish-holographic'), 'the rainbow normal seat survived');
  assert.ok(!css.includes('.gd-fin-ground-bright'), 'the bright normal law survived');
  const seatRules = (css.match(/^[^\n/{}]*gd-fin-ground[^\n{]*\{/gm) || []).map((s) => s.trim()).filter((s) => s.startsWith('.gd-fin-ground'));
  assert.equal(seatRules.length, 2, `the ground classes have ${seatRules.length} seat readers`);
});

ok('A5 — the facet retired with the bright subclass (no gray hand anywhere)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the facet and the subclass it
     rode retired with the flip stack — the X signature's depth pen is
     the one filter the sheet keeps. */
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!cssLaws.includes('brightness(0.55) saturate(1.18)'), 'the silver-facet law survived somewhere');
  assert.ok(!/\.gd-fin-ground-light \.gd-prism-stars,/.test(css), 'the facet leaked into the mid-bright half');
  assertMatch(css, /\.gd-fin-ground-light \.gd-numeix-xmarks:not\(\.is-art-zone\) \{\s*\n  filter: brightness\(0\.78\) saturate\(1\.05\);\s*\n\}/, 'the X\'s pen lost its seat');
});

ok('A6 — the dark family\'s flips retired (the classic blends speak in the dark)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the dark screen family retired
     with the flip stack — every seat speaks its classic native blend
     on the dark plates too, exactly as the classic physics spoke them. */
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/gd-fin-ground-dark [^\n{]*\{[^{}]*mix-blend-mode: screen/.test(cssLaws), 'a dark screen flip survived');
  assertMatch(css, /\.gd-finish-foil \{[^{}]*mix-blend-mode: soft-light;/, 'the metal\'s heart lost its soft-light');
});

ok('A7 — the X signature signs in ink on the light ground', () => {
  assertMatch(css, /\.gd-fin-ground-light \.gd-numeix-xmarks:not\(\.is-art-zone\) \{\s*\n  filter: brightness\(0\.78\) saturate\(1\.05\);\s*\n\}/, 'the X\'s pen never deepened');
});

ok('A8 — every card surface writes the lean and its seats (a color picks a ground now)', () => {
  for (const surface of [grid, look, ribbon]) {
    assertMatch(surface, /\['--gd-fin-ink'\]: finishTintLean\(/, 'a surface lost the lean write');
    assertMatch(surface, /\['--gd-fin-glow'\]: finishTintLean\((?:character\.)?cardColor, 0\.78\)/, 'a surface lost the glow seat');
    assertMatch(surface, /\['--gd-fin-art'\]: finishTintLean\((?:character\.)?cardColor, 0\.75\)/, 'a surface lost the art seat');
  }
});

console.log('\nB. THE EMBLEM\'S PLAIN TRUTH ("i want the emojie and the emojie outline and thats it, no shadows")');

ok('B1 — the mark and its rim alone (the halo and the under-shadow retire)', () => {
  assert.ok(!css.includes('.gd-ribbon-glyph::before'), 'the halo survived the retirement');
  assert.ok(!/drop-shadow\(0 1px 1px rgba\(0, 0, 0, 0\.42\)\)/.test(css), 'the under-shadow survived the retirement');
  const glyph = /^\.gd-ribbon-glyph \{[\s\S]*?\n\}/m.exec(css)?.[0]?.replace(/:not\(\.is-art-zone\)/g, '').replace(/\.gd-card-face-finish /g, '') ?? '';
  assert.ok(glyph, 'the glyph rule itself never spoke');
  assertMatch(glyph, /drop-shadow\(0 0 0\.75px var\(--gd-glyph-rim, rgba\(0, 0, 0, 0\.55\)\)\)/, 'the rim lost its fence');
  assertMatch(glyph, /drop-shadow\(0 0 1px var\(--gd-glyph-rim, rgba\(0, 0, 0, 0\.55\)\)\)/, 'the rim lost its outer rail');
});

console.log('\nC. THE CLASS\'S OWN CONTAINER FOLLOWS THE CURSOR ("as if its a cropped screenshot")');

ok('C1 — the ghost is the class card, handed at its leading edge', () => {
  assertMatch(sidebar, /e\.currentTarget\.querySelector\('\.gd-tree-card'\)/, 'the ghost never found the class card');
  /* 1.9.8 — the ghost is a STATIC offscreen clone now (one raster at
     dragstart, retired at the gesture's end — never a live seat the
     browser tracks through the drag). */
  assertMatch(sidebar, /cardEl\.cloneNode\(true\)/, 'the ghost never took its static clone');
  assertMatch(sidebar, /document\.body\.appendChild\(host\);/, 'the offscreen host never seated');
  assertMatch(sidebar, /e\.dataTransfer\.setDragImage\(\s*host,/, 'setDragImage never spoke to the host');
  assertMatch(sidebar, /Math\.max\(10, Math\.min\(16, Math\.round\(r\.width \* 0\.12\)\)\),\s*\n\s*Math\.round\(r\.height \/ 2\)\s*\n\s*\);/, 'the grab point lost its seat');
  assertMatch(sidebar, /retireGhost\(\);/, 'the ghost never learned its retirement');
});

console.log('\nD. THE SELECTED LANE SPEAKS LOUDER ("it somewhat blends in")');

ok('D1 — the lane + the card + the colored ladder step a register', () => {
  const lane = block(css, '.gd-tree-row[data-selected]');
  assertMatch(lane, /var\(--gd-accent\) 16%, transparent/, 'the lane wash never deepened');
  assertMatch(lane, /var\(--gd-accent\) 72%, transparent/, 'the lane bar never deepened');
  const card = /\.gd-tree-card\[data-selected\] \{[\s\S]*?\n\}/.exec(css)?.[0]?.replace(/:not\(\.is-art-zone\)/g, '').replace(/\.gd-card-face-finish /g, '') ?? '';
  assertMatch(card, /var\(--gd-accent\) 20%, var\(--gd-panel\)/, 'the card wash never deepened');
  assertMatch(card, /var\(--gd-accent\) 68%, transparent/, 'the card ring never deepened');
  assertMatch(css, /\.gd-tree-row:hover \.gd-tree-card\[data-selected\] \{\s*\n  background: color-mix\(in srgb, var\(--gd-accent\) 24%, var\(--gd-panel\)\);\s*\n\}/, 'the hover wash never deepened');
  assertMatch(css, /\.gd-tree-row\[data-colored\] \.gd-tree-card\[data-selected\] \{\s*\n  background: color-mix\(in srgb, var\(--cls\) 38%, var\(--gd-panel\)\);/, 'the colored ladder never stepped');
});

console.log('\nE. THE FURNITURE');

ok('E1 — the version is 1.9.7 everywhere', () => {
  assertMatch(pkg, /"version": "1\.9\.19",/, 'package.json drifted');
  const constants = src('src/constants/index.js');
  assertMatch(constants, /version: '1\.9\.19',/, 'constants drifted');
  assertMatch(readme, /\*\*v1\.9\.19\*\* · a local card & prompt-version tracker/, 'the README badge line drifted');
});

ok('E2 — the changelog head tells this story', () => {
  assertMatch(changelog, /## 1\.9\.19 — The Ends Trade Places/, 'the changelog head drifted');
  assertMatch(changelog, /no corner of the color wheel can swallow a coat again/, 'the changelog summary drifted');
});

ok('E3 — the README badge + battery count welcome this very suite', () => {
  assertMatch(readme, /version-1\.9\.19-purple/, 'the shield drifted');
  assertMatch(readme, /the regression battery \(93 DOM\/source test suites\)/, 'the battery count drifted');
});

ok('E4 — the battery runner runs this very suite', () => {
  assertMatch(runner, /gendex_198_batch_dom/, 'the runner never welcomed this suite');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('FIX ABOVE');
  process.exit(1);
}
