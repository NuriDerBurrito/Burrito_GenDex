// 1.9.6 batch — The Certain Ink.
// (Named 197 in the sequence: 190 pins the 1.8.9 laws, 191 the 1.8.10,
//  192 the 1.9.1, 193 the 1.9.2, 194 the 1.9.3, 195 the 1.9.4, 196 the
//  1.9.5; this suite pins the 1.9.6 laws at their roots. Built on the
//  1.9.5 tree — the release line continues.)
// The reported items, pinned at their root laws:
//   A.  THE CERTAIN INK ("the same issue still occurs, but its specific
//       to when i make the card color to the white ... the bloom effects
//       in numeix theme dissapear, nuri's effect becomes invisible/
//       negative, foil effects are invisible unless i make the card color
//       darker, auric becomes invisible when i do bright white, prismatic
//       stars becomes invisible when i lean towards the left half of the
//       color wheel ... holographic becomes invisibel, fix that ... values
//       dont loop or these mistakes occur"): the ink's contrast is
//       guaranteed at its own derivation — the light ground swaps every
//       tint-leaning stop's tint for the plate's SHADOW TWIN
//       (--gd-tint-hand, one monotone lightness rail), the bodies rejoin
//       the multiply stack WITHOUT any crushing filter, the white-ink
//       seats alone speak the gray facet, the veil keeps its overlay with
//       the twin as its ink, and the dapple's blooms carry the 1.6 hand.
//   B.  THE SPLIT VOLUME ("add a checkbox that adds another transparency
//       slider, but this slider affects the transparency of teh finishes
//       on the image itself ... the main one will only affect the
//       finishes over the trim and the card, but the second one will
//       affect the finishes over images"): the checkbox + the second
//       slider in the shared section (both windows), the pair rendering
//       (plate twin + art twin), the .gd-fin-split scope, and the two
//       fields riding the card object through every rail.
//   C.  THE WALL FOLLOWS THE OPEN CARD ("it should still scroll to follow
//       the selected card so its fully in view, currently its chaotic,
//       should also apply when opening a card thats half out or such"):
//       keepInViewId rides MasonryGrid — resize beats pin, selection
//       settles smooth, an unmounted selection scrolls to its packed seat.
//   D.  THE SIDE PANEL'S BAR BREATHES ("it should not just snap the items
//       in the side pannel, it should expand smoothly or retract smoothly
//       simmilar to the fade and right and left buttons"): the root
//       scroller joins the 1.7.0 breath family, and the hook itself
//       observes the content wrapper (a fixed-height scroller never
//       resizes when its content does).
//   E.  THE EMBLEMS TAKE THEIR SEAT ("emotes clip outside of the tag
//       containers on the card ... especially on special shaped ones like
//       bead and v ... improve their apperance so they dont look too
//       plain"): every trim derives the largest emblem its own geometry
//       honestly holds, and the emblem gains the raised seat + the halo.
//   F.  THE FURNITURE — the version seats speak 1.9.6, the changelog head
//       tells this story, the README badge + battery count welcome this
//       very suite, and the battery runner runs it.
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
const masonry = src('src/components/MasonryGrid.jsx');
const look = src('src/components/CardLookEditor.jsx');
const style = src('src/components/CardStyleControls.jsx');
const newchar = src('src/components/NewCharacterModal.jsx');
const charview = src('src/components/CharacterView.jsx');
const breath = src('src/components/useScrollbarBreath.js');
const app = src('src/App.jsx');
const constants = src('src/constants/index.js');
const helpers = src('src/utils/helpers.js');
const pkg = src('package.json');
const readme = src('README.md');
const changelog = src('CHANGELOG.md');
const runner = src('scripts/run_battery_171.sh');

console.log('A. THE CERTAIN INK ("the same issue still occurs ... at the white")');

ok('A1 — the ink derivation carries its own contrast (1.9.9: the lean, the fixed seats, the solver)', () => {
  assertMatch(ribbon, /export function finishTintLean\(cardColor, seat\) \{/, 'finishTintLean never left TagRibbon');
  // 1.9.9 — the twin retired whole (its lightness was solved against the
  // PLATE's luminance — the brightness-dependence the report retired);
  // the lean keeps the hue + saturation whole at a FIXED luma seat
  assert.ok(!/finishInkTwin/.test(ribbon), 'the twin survived its retirement');
  assertMatch(ribbon, /const LEAN_LUMA = Number\.isFinite\(\+seat\) \? Math\.min\(0\.9, Math\.max\(0\.1, \+seat\)\) : 0\.45;/, 'the lean lost its fixed seat');
  // the lightness SOLVED exactly (bisection against the lean's own luma
  // curve — no threshold branches, nothing to loop past)
  assertMatch(ribbon, /const lumaAt = \(ll\) => \{/, 'the solver never spoke');
  assertMatch(ribbon, /for \(let i = 0; i < 24; i \+= 1\) \{/, 'the bisection lost its steps');
  // the passthrough is GONE (the 1.9.6 dark passthrough was the yellow's
  // whole disease) — and the plate's own brightness never enters the
  // derivation at all (no lum measure, no ground seam, no compression)
  const lean = /export function finishTintLean[\s\S]*?\n\}/.exec(ribbon)?.[0] || '';
  assert.ok(!/return `#\$\{m\.slice\(1\)/.test(lean), 'the raw passthrough survived');
  assert.ok(!/const lum = 0\.2126/.test(lean), 'the lean still measured the plate');
  assert.ok(!/lum >= 0\.7|0\.35 \+ 0\.3|lum \+ 0\.16/.test(lean), 'a ground rail leaked into the lean');
});

ok('A2 — the hand speaks everywhere (1.9.9: the base declaration carries the lean)', () => {
  const seat = block(css, '.gd-card-face-finish');
  assertMatch(seat, /--gd-tint-hand: var\(--gd-fin-ink, var\(--gd-card-tint, var\(--gd-panel\)\)\);/, 'the base hand never spoke the lean');
  // 1.9.9 — the 1.9.7 universal override retired INTO the base (the same
  // word spoken once); the dark ground's screen family reads the GLOW seat
  assert.ok(!/\.gd-card-face-finish,\s*\n\.gd-card-face-artfin \{\s*\n  --gd-tint-hand: var\(--gd-fin-ink/.test(css), 'the universal override survived as a duplicate');
  assertMatch(css, /\.gd-fin-ground-dark \.gd-card-face-finish:not\(\.is-art-zone\),\s*\n\.gd-fin-ground-dark \.gd-card-face-artfin:not\(\.is-art-zone\) \{\s*\n  --gd-tint-hand: var\(--gd-fin-glow, var\(--gd-fin-ink, var\(--gd-card-tint, var\(--gd-panel\)\)\)\);\s*\n\}/, 'the dark glow hand never spoke');
});

ok('A3 — the hand speaks for the X signature alone (the classic coat returns)', () => {
  const handed = (css.match(/var\(--gd-tint-hand, var\(--gd-card-tint, var\(--gd-panel\)\)\)/g) || []).length;
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the hand's readers are the X
     looms ALONE (10 lean stops); every other coat seat speaks its
     classic fixed anchors, verbatim from the 1.9.2 sheet — the artfins
     and the veil returned to their classic words with it. */
  assert.equal(handed, 10, `the X looms' hand reads drifted (${handed})`);
  for (const fin of ['numeix', 'auric']) {
    const art = block(css, `.gd-artfin-${fin}`);
    assert.ok(!art.includes('var(--gd-tint-hand'), `the artfin-${fin} kept a hand read`);
  }
  // the artfins speak their classic anchors (the sepia band, the honey)
  assertMatch(block(css, '.gd-artfin-numeix'), /rgba\(238, 226, 186, 0\.56\) 0%/, 'the artfin-numeix lost its classic band');
  assertMatch(block(css, '.gd-artfin-auric'), /rgba\(255, 224, 140, 0\.36\) 0%/, 'the artfin-auric lost its classic honey');
  // the veil reads the card's RAW tint again (the classic forge law)
  const veil = /^\.gd-finish-nuri::before \{[\s\S]*?\n\}/m.exec(css)?.[0]?.replace(/:not\(\.is-art-zone\)/g, '').replace(/\.gd-card-face-finish /g, '') ?? '';
  assertMatch(veil, /background: var\(--gd-card-tint, var\(--gd-panel\)\);/, 'the veil never read the raw tint');
});

ok('A4 — the light law retired whole (the classic blends speak on every plate)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the mid-bright multiply washes,
     the rainbow normal seat and the bright subclass's one normal list
     retired with the derivation — every coat speaks its classic native
     blend wherever the plate sits. */
  assert.ok(!css.includes('.gd-fin-ground-light .gd-finish-numeix'), 'the light wash law survived');
  assert.ok(!css.includes('.gd-fin-ground-light .gd-finish-holographic'), 'the rainbow normal seat survived');
  assert.ok(!css.includes('.gd-fin-ground-bright'), 'the bright subclass survived');
  // the twin is written on every card surface that can class a ground
  for (const surface of [grid, look, ribbon]) {
    assertMatch(surface, /\['--gd-fin-ink'\]: finishTintLean\(/, 'a surface lost the lean write');
  }
});

ok('A5 — the silver facet retired (the X\'s pen is the one filter left)', () => {
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!cssLaws.includes('brightness(0.55) saturate(1.18)'), 'the silver facet survived somewhere');
  assert.ok(!cssLaws.includes('brightness(0.74) saturate(1.5)'), 'the 1.9.5 gentle hand survived in a rule');
  assert.ok(!cssLaws.includes('brightness(0.55) saturate(1.35)'), 'the 1.9.4 crushing hand survived in a rule');
  assertMatch(css, /\.gd-fin-ground-light \.gd-numeix-xmarks:not\(\.is-art-zone\) \{\s*\n  filter: brightness\(0\.78\) saturate\(1\.05\);\s*\n\}/, 'the X\'s pen lost its seat');
});

ok('A6 — the veil\'s stack seats retired (the classic overlay everywhere)', () => {
  assert.ok(!css.includes('.gd-fin-ground-light .gd-finish-nuri'), 'the veil\'s light multiply survived');
  assert.ok(!css.includes('.gd-fin-ground-dark .gd-finish-nuri'), 'the veil\'s dark screen survived');
  assert.ok(!css.includes('.gd-fin-ground-vivid'), 'the vivid class survived its retirement');
  assert.ok(!/return 'gd-fin-ground-vivid'/.test(ribbon), 'finishGroundTone still speaks the vivid class');
});

ok("A7 — the bloom's lift retired (the dapple speaks its classic voice)", () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the dapple's scoped opacity
     lifts retired with the flip stack — the sunlight speaks its classic
     screen blend at its classic voice on every plate. */
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!cssLaws.includes('opacity: min(1, calc(var(--gd-fin-strength, 1) * 1.6))'), 'the 1.6 lift survived somewhere');
  assert.ok(!/gd-fin-ground(?:-light|-dark)? \.gd-numeix-dapple/.test(cssLaws), 'the dapple lift selector survived');
  assertMatch(css, /\.gd-numeix-dapple \{[^{}]*mix-blend-mode: screen;/, 'the dapple lost its native screen');
});

console.log('\nB. THE SPLIT VOLUME ("a checkbox that adds another transparency slider")');

ok('B1 — the shared section speaks the checkbox + the second slider', () => {
  assertMatch(style, /separate image transparency/, 'the checkbox never spoke its name');
  assertMatch(style, /Image transparency/, 'the second knob never spoke its name');
  assertMatch(style, /finishSplitImage = false,\s*\n\s*onFinishSplitImage = null,\s*\n\s*finishImageTransparency = null,\s*\n\s*onFinishImageTransparency = null,/, 'the split props never joined the section');
  // the second knob renders ONLY while the checkbox holds
  assertMatch(style, /\{finishSplitImage && \(onFinishImageTransparency \|\| Number\.isFinite\(\+finishImageTransparency\)\) && \(/, 'the second knob forgot its gate');
  // the subject-truth law: no image or image effect off, the switch greys
  assertMatch(style, /clsx\('gd-check-row', \(coatSilent \|\| noImage \|\| !finishOnImage\) && 'is-off'\)/, 'the split key lost its grey law');
});

ok('B2 — the pair rendering (plate twin + art twin, one continuous coat)', () => {
  assertMatch(ribbon, /splitArt = false \}\) \{/, 'CardFinishLayer never learned the split');
  assertMatch(ribbon, /const pair = onImage && hasImage;/, 'the pair gate never spoke');
  assertMatch(ribbon, /one\('is-plate-only'\)\}\s*\n\s*\{one\('is-art-zone'\)\}/, 'the complementary twins never rendered');
  // holographic + foil ride the same factory (their children ride twins)
  assertMatch(ribbon, /seat\(\s*'gd-finish-holographic',/, 'the holo body left the seat factory');
  assertMatch(ribbon, /seat\(\s*'gd-finish-foil-ripples',/, 'the ripple sibling left the seat factory');
});

ok('B3 — the split scope (the art seats read the second knob)', () => {
  assertMatch(css, /\.gd-card-face-finish\.is-art-zone \{/, 'the coat class never gained the art-zone mask');
  assertMatch(css, /\.gd-fin-split \.gd-card-face-finish\.is-art-zone,\s*\n\.gd-fin-split \.gd-card-face-artfin\.is-art-zone \{\s*\n  --gd-fin-strength: var\(--gd-fin-strength-art, var\(--gd-fin-strength\)\);\s*\n\}/, 'the split scope never re-spoke the volume');
});

ok('B4 — the two fields ride the card object through every rail', () => {
  assertMatch(constants, /finishSplitImage: normalizeFinishSplit\(card\.finishSplitImage\),\s*\n  finishImageTransparency: normalizeFinishTransparency\(card\.finishImageTransparency\),/, 'sanitizeCardLook never gained the split rails');
  assertMatch(constants, /cardFinishSplitImage: sanitizeCardLook\(card\)\.finishSplitImage,\s*\n  cardFinishImageTransparency: sanitizeCardLook\(card\)\.finishImageTransparency,/, 'makeCharacter never gained the card fields');
  assertMatch(helpers, /cardFinishSplitImage: character\?\.cardFinishSplitImage === true,\s*\n    cardFinishImageTransparency: normalizeFinishTransparency\(character\?\.cardFinishImageTransparency\),/, 'the sanitize rail never gained the fields');
  assertMatch(app, /cardFinishSplitImage: card\.finishSplitImage === true,\s*\n                    cardFinishImageTransparency: normalizeFinishTransparency\(card\.finishImageTransparency\),/, 'the commit lane never gained the fields');
});

ok('B5 — both windows speak the drafts (creation + edit card)', () => {
  assertMatch(newchar, /const \[finishSplitImage, setFinishSplitImage\] = useState\(false\);/, 'the creation window never drafted the split');
  assertMatch(newchar, /setFinishSplitImage\(false\);\s*\n    setFinishImageTransparency\(DEFAULT_FINISH_TRANSPARENCY\);/, 'the reset law never re-seeded the split');
  assertMatch(newchar, /finishTransparency, finishSplitImage, finishImageTransparency, imageMotion, stampMotion \}/, 'CREATE never shipped the split');
  assertMatch(newchar, /finishSplitImage=\{finishSplitImage\}\s*\n            onFinishSplitImage=\{setFinishSplitImage\}/, 'the creation window never threaded the checkbox');
  assertMatch(charview, /const \[finishSplitImage, setFinishSplitImage\] = useState\(character\.cardFinishSplitImage === true\);/, 'the edit window never drafted the split');
  assertMatch(charview, /finishSplitImage,\s*\n                finishImageTransparency,\s*\n                \/\/ 1\.4\.1 — the image's own sway switch/, 'DONE never committed the split');
  assertMatch(charview, /onFinishSplitImage=\{touch\(setFinishSplitImage\)\}/, 'the edit window never threaded the checkbox');
});

ok('B6 — every surface writes the second knob + the scope class', () => {
  for (const surface of [grid, look, ribbon]) {
    assertMatch(surface, /\['--gd-fin-strength-art'\]: finishStrength\(/, 'a surface lost the art var write');
  }
  assertMatch(grid, /character\.cardFinishSplitImage && character\.cardFinishOnImage && 'gd-fin-split'/, 'the grid card lost the split scope');
  assertMatch(look, /finishSplitImage && 'gd-fin-split'/, 'the panzoom lost the split scope');
  assertMatch(ribbon, /finishSplitImage && 'gd-fin-split'/, 'the compact preview lost the split scope');
  assertMatch(grid, /splitArt=\{cardFinishSplitImage\}/, 'the grid card never threaded the pair');
  assertMatch(look, /splitArt=\{finishSplitImage\}/, 'the panzoom never threaded the pair');
  assertMatch(ribbon, /splitArt=\{finishSplitImage\}/, 'the compact preview never threaded the pair');
});

console.log('\nC. THE WALL FOLLOWS THE OPEN CARD ("currently its chaotic")');

ok('C1 — MasonryGrid keeps the open card in view (pin + smooth + packed seat)', () => {
  assertMatch(masonry, /keepInViewId = null \}\) \{/, 'the wall never learned the selection');
  assertMatch(masonry, /new ResizeObserver\(\(\) => schedule\(false\)\)/, 'the resize beats never pinned');
  assertMatch(masonry, /schedule\(true\);/, 'the selection change never settled smooth');
  assertMatch(masonry, /el\.scrollTo\(\{ top: clampTop\(top\), behavior: 'smooth' \}\);/, 'the smooth settle never spoke');
  /* 1.9.16 — THE WALL WAITS FOR THE OPEN re-seated this pin: the
     follow effect re-runs on the selection alone now, so the
     packed-seat fallback reads the LIVE pack through the ref. */
  assertMatch(masonry, /const p = posByIdRef\.current\.get\(keepInViewId\);/, 'the packed-seat fallback never spoke');
  assertMatch(masonry, /const card = itemEls\.current\.get\(keepInViewId\);/, 'the mounted read never spoke');
});

ok('C2 — GridView passes the selection to the wall', () => {
  assertMatch(grid, /keepInViewId=\{selectedId\}/, 'the grid never passed the selection');
});

console.log('\nD. THE SIDE PANEL\'S BAR BREATHES ("expand smoothly or retract smoothly")');

ok('D1 — the root scroller joins the breath family', () => {
  assertMatch(charview, /useScrollbarBreath\(rootRef, 'y', \[character\.id, activeVerId, tab, versions\.length\]\);/, 'the panel root never breathed');
  assertMatch(charview, /'h-full overflow-y-auto overflow-x-hidden relative gd-tex-scroll gd-sb-breath'/, 'the root class never wore the breath');
});

ok('D2 — the hook observes the content wrapper too (the deeper law)', () => {
  assertMatch(breath, /content = el\.firstElementChild \|\| null;\s*\n      if \(content\) ro\.observe\(content\);/, 'the content observer never spoke');
});

console.log('\nE. THE EMBLEMS TAKE THEIR SEAT ("especially on special shaped ones like bead and v")');

ok('E1 — every trim derives the emblem its own geometry holds', () => {
  assertMatch(ribbon, /const glyphFit = \(\(\) => \{/, 'the fit law never spoke');
  assertMatch(ribbon, /const g = Math\.floor\(\(2 \* \(cx - a - m\) - 2 \* slope \* \(t - a\)\) \/ \(1 \+ 2 \* slope\)\);/, 'the V lost its exact solve');
  /* 1.9.6 — the bead's honest square pays the rim's own reach too (the
     strict √2 inscribed square seats the corners on the stroke and the
     rim poked its last hair past at the bigger scales — measured live). */
  assertMatch(ribbon, /const g = Math\.floor\(\(beadR - m\) \* 1\.3\); \/\/ the circle's honest square, rim paid/, 'the bead lost its honest square');
  assertMatch(ribbon, /const g = Math\.floor\(w - 2 \* \(OUTLINE_W \/ 2 \+ m\)\); \/\/ straight \/ notch \/ point bodies/, 'the bodies lost their inner width');
  assertMatch(ribbon, /const glyphSize = glyphFit\.size;\s*\n  const glyphTop = glyphFit\.top;/, 'the fit never fed the glyph');
});

ok('E2 — the emblem\'s plain truth (1.9.7: the mark and its rim alone, no shadows)', () => {
  // the 1.9.6 polish seated a luminous halo (the pale stain below the
  // emoji the report caught) and an under-shadow — both retire
  assert.ok(!css.includes('.gd-ribbon-glyph::before'), 'the halo survived the retirement');
  assert.ok(!/drop-shadow\(0 1px 1px rgba\(0, 0, 0, 0\.42\)\)/.test(css), 'the under-shadow survived the retirement');
  // the rim keeps its fence seat (the outline the report keeps)
  assertMatch(css, /drop-shadow\(0 0 0\.75px var\(--gd-glyph-rim, rgba\(0, 0, 0, 0\.55\)\)\)/, 'the rim lost its fence');
  assertMatch(ribbon, /'--gd-glyph-size': `\$\{glyphSize\}px`,/, 'the glyph never threaded its measure');
});

console.log('\nF. THE FURNITURE');

ok('F1 — the version is 1.9.6 everywhere', () => {
  assertMatch(pkg, /"version": "1\.9\.19",/, 'package.json drifted');
  assertMatch(constants, /version: '1\.9\.19',/, 'constants drifted');
  assertMatch(readme, /\*\*v1\.9\.19\*\* · a local card & prompt-version tracker/, 'the README badge line drifted');
});

ok('F2 — the changelog head tells this story', () => {
  assertMatch(changelog, /## 1\.9\.19 — The Ends Trade Places/, 'the changelog head drifted');
  assertMatch(changelog, /Five laws — the ink's contrast is guaranteed at its own derivation/, 'the changelog summary drifted');
});

ok('F3 — the README badge + battery count welcome this very suite', () => {
  assertMatch(readme, /version-1\.9\.19-purple/, 'the shield drifted');
  assertMatch(readme, /the regression battery \(93 DOM\/source test suites\)/, 'the battery count drifted');
});

ok('F4 — the battery runner runs this very suite', () => {
  assertMatch(runner, /gendex_197_batch_dom/, 'the runner never welcomed this suite');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('FIX ABOVE');
  process.exit(1);
}
