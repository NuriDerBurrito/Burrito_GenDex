// 1.7.3 batch — The Honest Ring.
// (Named 174 in the sequence: 172 -> 1.6.8, 173 -> 1.6.9, ... this suite
//  pins the 1.7.3 laws at their roots.)
// The reported items, each pinned at its root law:
//   A.  THE RING'S TRUE PAINT ORDER ("the trim effect does 3 things wrong —
//       the bottom label's edges bare + the image coated with IMAGE EFFECT
//       off + the stamp forced over the trim")
//   B.  THE HUE ANSWERS ITS SWITCH ("hue over stamp option isnt working in
//       stamp settings")
//   C.  THE CONTAINER'S OWN SCROLLBAR ("prompt/note scrollbar on right
//       should follow the theme of the container")
//   D.  THE EXPANDED TITLE WEARS THE CONTAINER ("the title in the expanded
//       note/prompt is not following theme")
//   E.  THE ROW'S RAIL SITS INSIDE THE FRAME ("the left stripe covers the
//       click highlight — the outline clips on the left")
//   F.  THE LADDER SPEAKS ITS OWN STEPS ("the colors seem to blend in too
//       much between each different component")
//   G.  THE MANAGER RIDES ABOVE THE VIEWER ("image manager should open on
//       it, dont close the big image preview then open image manager")
//   H.  THE PULSE'S RE-ENTRY ANSWERS THE FLIGHT ("unhover then hover again —
//       it should play again (only if the pulse animation is done)")
//   I.  THE HIDDEN CLOCK HOLDS IN THE MODEL ("the card finishes suddenly
//       snap as if it calculated where it should have been")
// Plus the version furniture (1.7.3 everywhere).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS } from '../src/constants/index.js';

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
const ribbon = src('src/components/TagRibbon.jsx');
const grid = src('src/components/GridView.jsx');
const look = src('src/components/CardLookEditor.jsx');
const parts = src('src/components/PartEditor.jsx');
const charview = src('src/components/CharacterView.jsx');
const stage = src('src/components/ImageStage.jsx');
const manager = src('src/components/ImageManagerModal.jsx');
const viewer = src('src/components/ImageViewer.jsx');
const modal = src('src/components/Modal.jsx');
const app = src('src/App.jsx');
const helpers = src('src/utils/helpers.js');
const constants = src('src/constants/index.js');

console.log('\nA. THE RING\'S TRUE PAINT ORDER ("the trim effect does 3 things wrong")');
ok('A1 — THE RING RETIRES, THE TRIM WEARS ITSELF (1.7.4 — "the trim effect isnt perfect on the trims, it just does an area, i want it to fit the trim perfectly so if it has gabs it wont effect the gabs")', () => {
  // the 1.7.3 four-layer composite (core base + full-box subtract + rail +
  // plate) left with the SYNTHETIC ring it painted — the 1.7.4 law seats a
  // CLONE of the card's own trim re-inked in the finish's voice instead
  // (TrimCoatLayer), and the washes keep the plate + the seam rail ALONE.
  // 1.7.5 — THE SEAM RAIL RETIRES TOO ("the finish clips horizontally
  // at the bottom of the card's image"): the plate ALONE below the art
  // line, one layer, one plain cut — no composite list, no rail band.
  const rule = css.slice(
    css.indexOf('.gd-fin-on-trim .gd-card-face-finish.is-plate-only.is-over-trim {'),
    css.indexOf('}', css.indexOf('.gd-fin-on-trim .gd-card-face-finish.is-plate-only.is-over-trim {'))
  ).replace(/\/\*[\s\S]*?\*\//g, ''); // the law note may NAME the retired geometry — the CODE may not speak it
  // 1.7.9 supersede — THE WASH SPEAKS THE FAMILY'S OWN SHAPE ("its not
  // accounting for the trim's shape and the gabs that it has"): the
  // uniform ring band retired for good — every family carries its OWN
  // mask now (unioned with the plate, no composite anywhere) and the
  // base rule is the plate alone, one layer, one plain cut.
  assert.ok(!/-webkit-mask-clip: border-box, border-box, content-box;/.test(rule), 'the ring clip survived the family-shape retirement');
  assert.ok(!/mask-composite/.test(rule), 'the composite list survived the family-shape retirement');
  assert.ok(!/- 12px/.test(rule), 'the rail\'s soft shoulder survived the 1.7.5 retirement');
  assert.ok(!/- 9px/.test(rule), 'the rail\'s opaque tail survived the 1.7.5 retirement');
  assertMatch(rule, /-webkit-mask-image: linear-gradient\(\s*\n\s*to bottom,\s*\n\s*rgba\(0, 0, 0, 0\) 0,\s*\n\s*rgba\(0, 0, 0, 0\) calc\(var\(--gd-art-h\) - 0\.5px\),\s*\n\s*#000 calc\(var\(--gd-art-h\) - 0\.5px\)\s*\n\s*\);/, 'the plate mask never spoke (the base rule is the plate alone)');
  assert.ok(!/content-box/.test(rule), 'the 9px-inset core survived the family-shape retirement');
  assert.ok(css.includes('.gd-fin-on-trim:has(.gd-trim-dash) .gd-card-face-finish.is-plate-only.is-over-trim {'), 'the family masks never spoke');
  assert.ok(!/--gd-trim-reach/.test(rule), 'the ring-reach padding survived the retirement');
  // the clone carries the law: one rung above the trim's own ink
  assertMatch(css, /\.gd-trim\.gd-trim-coat \{\s*\n\s*z-index: 4;\s*\n\}/, 'the coat clone never took its rung');
  assertMatch(css, /THE SYNTHETIC RING IS RETIRED, THE TRIM WEARS ITSELF/, 'the 1.7.4 law note is missing');
  // 1.7.5 — the clone speaks the TRIM'S OWN ink ladder now (trimCoatInk)
  // and FINISH_TRIM_INK retired with its map. 1.7.7 — the card-color
  // rung retired with it: the picker's word or the theme's default.
  assertMatch(ribbon, /export function TrimCoatLayer\(\{ trim, seamless = false, ink = null \}\)/, 'the clone component never spoke');
  assertMatch(ribbon, /export function trimCoatInk\(trim, trimColor = null\) \{/, 'the trim\'s-own ink ladder never spoke');
  assert.ok(!/export const FINISH_TRIM_INK = \{/.test(ribbon), 'the retired signature ink map survived');
  assertMatch(grid, /<TrimCoatLayer\s*\n\s*trim=\{character\.cardTrim\}/, 'the grid card never rendered the clone');
  assertMatch(look, /<TrimCoatLayer\s*\n\s*trim=\{trim \|\| DEFAULT_CARD_TRIM\}/, 'the look editor never rendered the clone');
});
ok('A2 — the trim-effect stamp lift is retired (the stamps never clip over the trim)', () => {
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/\.gd-fin-on-trim \.gd-card-stamp-band\s*\{/.test(cssLaws), 'the z-5 band lift survived');
  assert.ok(!/\.gd-fin-on-trim \.gd-card-stamp-free\.is-clipped\s*\{/.test(cssLaws), 'the z-5 sticker lift survived');
  assertMatch(css, /THE TRIM-EFFECT STAMP LIFT RETIRES/, 'the retirement tombstone is missing');
  // the image effect's z-1 law remains the ladder's one mover
  assertMatch(cssLaws, /\.gd-fin-on-image \.gd-card-stamp-band,\s*\n\.gd-fin-on-image \.gd-card-stamp-free\.is-clipped \{\s*\n\s*z-index: 1;/, 'the image scope never seated the stamps');
});

console.log('\nB. THE HUE ANSWERS ITS SWITCH ("hue over stamp option isnt working in stamp settings")');
ok('B1 — the band washes ride their true seats (classic FIRST, hueOver LAST)', () => {
  const band = grid.slice(grid.indexOf('{bandStamps.length > 0 && ('), grid.indexOf('{/* 1.6.2 — THE HUE\'S OWN SEAT'));
  const classicAt = band.indexOf('hue && !hueOver && !hueOverTrim && !coatOverTrim && (');
  const overAt = band.indexOf('hue && hueOver && !hueOverTrim && !coatOverTrim && (');
  const logosAt = band.indexOf('{bandStamps.map((s, i) => (');
  assert.ok(classicAt >= 0 && classicAt < logosAt, 'the classic wash never painted before the logos');
  assert.ok(overAt > logosAt, 'the hueOver wash never painted after the logos');
});
ok('B2 — the free layer\'s flip speaks the DOM order (the z law scoped to its stampless home)', () => {
  const free = grid.slice(grid.indexOf('{freeStamps.length > 0 && ('), grid.indexOf('{/* 0.18.0 — the SHINE'));
  const classicAt = free.indexOf('hue && !hueOver && !hueOverTrim && !coatOverTrim && (');
  const overAt = free.indexOf('hue && hueOver && !hueOverTrim && !coatOverTrim && (');
  const stickersAt = free.indexOf('{freeStamps.map((s, i) => (');
  assert.ok(classicAt >= 0 && classicAt < stickersAt, 'the classic wash never painted before the stickers');
  assert.ok(overAt > stickersAt, 'the hueOver wash never painted after the stickers');
  assertMatch(css, /\.gd-card-stamp-free \.gd-card-stamp-hue\.gd-hue-halfcard \{\s*\n\s*z-index: auto;/, 'the in-layer washes never left the stampless z law');
  // the stampless twin keeps its own rung
  assertMatch(css, /\.gd-card-stamp-hue\.gd-hue-halfcard \{\s*\n\s*z-index: 2;\s*\n\}/, 'the stampless wash lost its rung');
});
ok('B3 — THE COAT-PERIOD WASH SPEAKS ITS UNDER-SEAT (1.7.4 — "when trim effect is turned on, it shouldnt automatically make the hue hover over the stamp")', () => {
  // the 1.7.3 modifier (is-over-stamp lifting the single DOM-later wash)
  // re-spoke only the ON half — the OFF half painted OVER the logos both
  // ways. The 1.7.4 law renders the wash BEFORE the band while the switch
  // is off (DOM-earlier at the band's own rung) and AFTER it with the lift
  // while on — one switch, one promise, both halves.
  const under = grid.slice(grid.indexOf("{/* 1.7.4 — THE UNDER-STAMP SEAT OF THE COAT-PERIOD WASH"), grid.indexOf('{bandStamps.length > 0 && ('));
  const underAt = under.indexOf('hue && !hueOver && !hueOverTrim && coatOverTrim && (bandStamps.length > 0 || freeStamps.length > 0) && (');
  assert.ok(underAt >= 0, 'the grid never rendered the under-stamp seat before the band');
  const after = grid.slice(grid.indexOf("THE OVER-STAMP HALF ALONE"), grid.indexOf("{/* 1.4.5 — THE STAMPLESS HUE'S OWN SEAT"));
  assert.ok(/hue && hueOver && !hueOverTrim && coatOverTrim && \(bandStamps\.length > 0 \|\| freeStamps\.length > 0\) && \(/.test(after), 'the grid never rendered the over-stamp half after the band');
  assertMatch(grid, /'gd-card-stamp-hue gd-hue-band-own', 'is-over-stamp'\)/, 'the grid never threaded the modifier onto the over seat');
  const lookUnder = look.slice(look.indexOf("{/* 1.6.2 — THE HUE'S OWN SEAT UNDER THE RIDING COAT"), look.indexOf('{stampUrl && !stampPos && ('));
  assert.ok(/stampHueHex && !stampHueOver && !stampHueOverTrim && coatOverTrim && stampUrl && \(/.test(lookUnder), 'the look editor never rendered the under-stamp seat');
  assertMatch(look, /gd-hue-band-own is-over-stamp"/, 'the look editor never threaded the modifier onto the over seat');
  assertMatch(css, /\.gd-card-stamp-hue\.gd-hue-band-own\.is-over-stamp \{\s*\n\s*z-index: 3;/, 'the over-stamp rung never spoke');
  assertMatch(grid, /THE UNDER-STAMP SEAT OF THE COAT-PERIOD WASH/, 'the 1.7.4 law note is missing');
});
ok('B4 — the look editor\'s band + overlay speak the same swap', () => {
  const band = look.slice(look.indexOf('{stampUrl && !stampPos && ('), look.indexOf('{/* 1.4.5 — THE STAMPLESS HUE'));
  const classicAt = band.indexOf('stampHueHex && !stampHueOver && !stampHueOverTrim && !coatOverTrim && (');
  const overAt = band.indexOf('stampHueHex && stampHueOver && !stampHueOverTrim && !coatOverTrim && (');
  const logosAt = band.indexOf('<span className="gd-card-stamp-slicebox">');
  assert.ok(classicAt >= 0 && classicAt < logosAt, 'the preview band never painted the classic wash first');
  assert.ok(overAt > logosAt, 'the preview band never painted the hueOver wash last');
  const overlay = look.slice(look.indexOf('{stampUrl && stampPos && ('), look.indexOf('{/* 0.40.0 — NO SEPARATOR'));
  const freeClassic = overlay.indexOf('stampHueHex && !stampHueOver && !stampHueOverTrim && !coatOverTrim && (');
  const freeOver = overlay.indexOf('stampHueHex && stampHueOver && !stampHueOverTrim && !coatOverTrim && (');
  const stickerAt = overlay.indexOf('<span\n            className="gd-card-stamp-placed"');
  assert.ok(freeClassic >= 0 && freeClassic < stickerAt, 'the preview overlay never painted the classic wash first');
  assert.ok(freeOver > stickerAt, 'the preview overlay never painted the hueOver wash last');
});

console.log('\nC. THE CONTAINER\'S OWN SCROLLBAR ("prompt/note scrollbar on right should follow the theme of the container")');
ok('C1 — scoped scrollbar laws read the container\'s own vars', () => {
  assertMatch(css, /\.gd-part-row\.is-colored \.gd-prompt-box::-webkit-scrollbar-thumb,/, 'the row\'s thumb law is missing');
  assertMatch(css, /\.gd-modal-card\.is-part-tinted \.gd-prompt-stage::-webkit-scrollbar-thumb,/, 'the tinted stage\'s thumb law is missing');
  // 1.7.9 — the quiet capsule: the part ink mixed toward TRANSPARENT
  // (the field's own face speaks through), no ground border.
  assertMatch(css, /\.gd-modal-card\.is-part-tinted \.gd-notes-stage::-webkit-scrollbar-thumb \{\s*\n[^}]*?background: color-mix\(in srgb, var\(--part-ink, var\(--gd-ink\)\) 42%, transparent\);/, 'the thumb never read the container\'s ink');
  assert.ok(!/border: 2px solid var\(--part-well, var\(--gd-bg\)\);/.test(css), 'the thumb\'s ground border survived the quiet chrome');
  assertMatch(css, /\.gd-part-row\.is-colored \.gd-prompt-box::-webkit-scrollbar-track,/, 'the track law is missing');
});

console.log('\nD. THE EXPANDED TITLE WEARS THE CONTAINER ("the title in the expanded note/prompt is not following theme")');
ok('D1 — the tinted window\'s title box speaks the ladder\'s title rung', () => {
  assertMatch(css, /\.gd-modal-card\.is-part-tinted \.gd-notes-title\.gd-input,\s*\n\.gd-modal-card\.is-part-tinted \.gd-notes-title\.gd-rt-edit \{\s*\n\s*(?:\/\*[\s\S]*?\*\/\s*\n\s*)?background: var\(--part-well,/, 'the title box never wore the title rung');
  assertMatch(css, /\.gd-modal-card\.is-part-tinted \.gd-notes-title:empty::before \{\s*\n\s*color: color-mix\(in srgb, var\(--part-well-ink, var\(--part-ink, var\(--gd-mute\)\)\) 46%, transparent\);/, 'the title placeholder never whispered the well\'s own ink');
  // 1.7.8 supersede — ONE WINDOW, ONE FIELD: the focus law speaks as a
  // FAMILY now (the stage + the title share one selector list).
  assertMatch(css, /\.gd-modal-card\.is-part-tinted \.gd-notes-title:focus,\s*\n\.gd-modal-card\.is-part-tinted \.gd-notes-title:focus-visible,/, 'the title focus law is missing');
  assertMatch(css, /\.gd-modal-card\.is-part-tinted \.gd-notes-title \{\s*\n\s*color: var\(--part-ink, var\(--gd-panel-text\)\);/, 'the title ink law left (the 1.7.2 seat, kept)');
});

console.log('\nE. THE ROW\'S RAIL SITS INSIDE THE FRAME ("the left stripe covers the click highlight")');
ok('E1 — the prompt well\'s stripe is an inset spine, the border keeps all four sides', () => {
  const well = /\.gd-prompt-box \{[^}]*\}/.exec(css)?.[0] || '';
  assert.ok(!/border-left:/.test(well), 'the stripe still replaced the left border');
  assertMatch(well, /border: 1\.5px solid color-mix\(in srgb, var\(--gd-ink\) 40%, transparent\);/, 'the four-sided frame is missing');
  assertMatch(well, /inset 3px 0 0 color-mix\(in srgb, var\(--gd-accent\) 55%, transparent\)/, 'the inset spine is missing');
  const focus = /\.gd-prompt-box:focus \{[^}]*\}/.exec(css)?.[0] || '';
  assertMatch(focus, /inset 3px 0 0 var\(--gd-accent\),/, 'the focus spine never spoke the accent');
  assert.ok(!/border-left-color/.test(focus), 'the focus law still spoke a left border color');
});
ok('E2 — the colored well speaks the spine + a focus seat of its own (never clipped on the left)', () => {
  const colored = css.slice(css.indexOf('.gd-part-row.is-colored .gd-prompt-box {'), css.indexOf('/* 1.7.1 — THE NOTES\' CAP READS THE FACE'));
  assert.ok(!/border-left-color/.test(colored), 'the colored law still replaced the left border');
  // 1.7.6 — the spine is the LIGHTEST ELEMENT (--part-spine's climb
  // toward white; the 82% / 92% mixes retired with the anchor-walk)
  assertMatch(colored, /inset 3px 0 0 var\(--part-spine, color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 42%, #ffffff\)\)/, 'the colored spine never climbed toward white');
  assertMatch(colored, /\.gd-part-row\.is-colored \.gd-prompt-box:focus \{/, 'the colored focus seat is missing');
  assertMatch(colored, /inset 3px 0 0 var\(--part-spine, color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 42%, #ffffff\)\)/, 'the colored focus spine never kept the climb');
});

console.log('\nF. THE LADDER SPEAKS ITS OWN STEPS ("the colors blend in too much between components")');
ok('F1 — THE LADDER EARNS ITS RUNGS BY CONTRAST (1.7.4 — "colors such as pink and such blend in too much, add outlines and improve the coloring pallet")', () => {
  // the 1.7.3 fixed-percent rungs (8% / 24% around a cliff-named anchor)
  // left with the 1.7.4 law: every rung walks to a TARGET CONTRAST, the
  // anchor is whichever extreme separates by measurement, the ink is the
  // direction that reads best against every rung, and a new --part-line
  // OUTLINE ink joins the ladder.
  assertMatch(helpers, /function partStepToContrast\(base, toward, target, against\)/, 'the contrast walk never spoke');
  assertMatch(helpers, /const anchor = contrastRatio\(face, darkProbe\) >= contrastRatio\(face, lightProbe\) \? '#101010' : '#ffffff';/, 'the anchor never spoke by probe');
  assertMatch(helpers, /const title = partStepToContrast\(face, anchor, 1\.35, face\);/, 'the title rung never earned its contrast');
  assertMatch(helpers, /const well = partStepToContrast\(face, anchor, 1\.8, face\);/, 'the well rung never earned its contrast');
  assertMatch(helpers, /const line = partStepToContrast\(raw, anchor, 1\.45, face\);/, 'the outline ink never earned its contrast');
  assertMatch(helpers, /\['--part-line'\]: line,/, 'the outline var never left the ladder');
  assertMatch(helpers, /let ink = worst\(partInkDark\) >= worst\(partInkLight\) \? partInkDark : partInkLight;/, 'the ink never spoke by measurement');
  assertMatch(helpers, /THE LADDER EARNS ITS RUNGS BY CONTRAST/, 'the 1.7.4 ladder note is missing');
});
ok('F2 — the row\'s title field reads the title rung, the well keeps its own', () => {
  assertMatch(css, /\.gd-part-row\.is-colored \.gd-rt-edit \{\s*\n\s*background: var\(--part-title,/, 'the title field never spoke the title rung');
  assertMatch(css, /\.gd-part-row\.is-colored \.gd-prompt-box \{\s*\n\s*background: var\(--part-well,/, 'the content well never kept its rung');
});

console.log('\nG. THE MANAGER RIDES ABOVE THE VIEWER ("dont close the big image preview then open image manager")');
ok('G1 — the over-viewer lane exists (z 920, above the 900 veil)', () => {
  assertMatch(css, /\.gd-modal-layer\.is-over-viewer \{\s*\n\s*z-index: 920;\s*\n\}/, 'the over-viewer lane never spoke');
});
ok('G2 — Modal carries the overViewer + overAll props + the topmost-layer Escape law', () => {
  assertMatch(modal, /overViewer = false,/, 'the prop never lived');
  assertMatch(modal, /overAll = false,/, 'the 1.7.4 over-all prop never lived');
  assertMatch(modal, /overViewer && 'is-over-viewer',/, 'the layer never wore the class');
  assertMatch(modal, /overAll && 'is-over-all',/, 'the layer never wore the over-all class');
  assertMatch(modal, /if \(!overViewer && !overAll && typeof document !== 'undefined' && document\.querySelector\('\.gd-imgview'\)\) return;/, 'the under-viewer Escape yield never spoke');
});
ok('G3 — the hand-off keeps the viewer seated (no setViewer(null) in the signal path)', () => {
  const start = charview.indexOf('onOpenManager={() => {');
  const handoff = charview
    .slice(start, charview.indexOf('setManagerSignal((s) => s + 1);', start) + 40)
    .replace(/\/\*[\s\S]*?\*\//g, ''); // the law note may NAME the retired call — the CODE may not speak it
  assert.ok(!/setViewer\(null\)/.test(handoff), 'the hand-off still folded the viewer first');
  assertMatch(stage, /setManagerOverViewer\(true\);/, 'the remote opener never seated the manager above');
  assertMatch(stage, /overViewer=\{managerOverViewer\}/, 'the stage never threaded the lane');
  assertMatch(manager, /overViewer = false,/, 'the manager never received the lane');
  assertMatch(manager, /overViewer=\{overViewer\}/, 'the manager never threaded the lane to Modal');
});
ok('G4 — the viewer yields its keys to a layer riding above it', () => {
  assertMatch(viewer, /document\.querySelector\('\.gd-modal-layer\.is-over-viewer'\)/, 'the viewer never asked who rides above');
});

console.log('\nH. THE PULSE\'S RE-ENTRY ANSWERS THE FLIGHT ("only if the pulse animation is done")');
ok('H1 — the 2.2s entry window is retired; the in-flight guard + heartbeat stay', () => {
  assert.ok(!/if \(pulseAt && Date\.now\(\) - pulseAt < SHINE_PULSE_CYCLE\) return;/.test(grid), 'the entry window survived');
  assertMatch(grid, /THE ENTRY WINDOW RETIRES/, 'the re-entry law never spoke its name');
  assertMatch(grid, /const SHINE_PULSE_CYCLE = 2200;/, 'the heartbeat cycle never spoke');
  assertMatch(grid, /host\._gdPulseRest = setTimeout\(/, 'the retire lost its heartbeat');
  assertMatch(grid, /if \(!startedAt \|\| Date\.now\(\) - startedAt <= 700\) return;/, 'the in-flight guard left');
});

console.log('\nI. THE HIDDEN CLOCK HOLDS IN THE MODEL ("the card finishes snap after an alt-tab")');
ok('I1 — the visibility signal drives the Web Animations pause/play', () => {
  assertMatch(app, /document\.getAnimations\(\)\.filter\(\(a\) => a\.playState === 'running'\)/, 'the running voices were never gathered');
  assertMatch(app, /try \{ a\.pause\(\); \} catch/, 'the model freeze never spoke');
  assertMatch(app, /if \(infinite\) a\.currentTime = 0;\s*\n\s*a\.play\(\);/, 'the wake never came back fresh');
  assertMatch(app, /const hiddenAnimsRef = useRef\(null\);/, 'the held list never lived');
  assertMatch(app, /THE HIDDEN CLOCK HOLDS IN THE ANIMATION MODEL/, 'the law note is missing');
});
ok('I2 — the CSS family gains the two clocks it never named', () => {
  const hidden = css.slice(css.indexOf('html.gd-app-hidden .gd-card-face-finish,'), css.indexOf('/* 1.5.7 — THE LIVING FINISHES SWITCH'));
  assertMatch(hidden, /html\.gd-app-hidden \.gd-card-selected::after,/, 'the selection breathe never joined');
  assertMatch(hidden, /html\.gd-app-hidden \.gd-card-shine::before \{/, 'the shine sweep never joined');
});

console.log('\nJ. VERSION FURNITURE');
ok('J1 — the version is 1.7.3 everywhere (the furniture sweep)', () => {
  assertMatch(constants, /version: '1\.9\.19',/, 'constants still speak 1.7.2');
  const pkg = JSON.parse(src('package.json'));
  assert.equal(pkg.version, '1.9.19', 'package.json still speaks 1.7.2');
  assertMatch(src('package-lock.json'), /"version": "1\.9\.19"/, 'the lock root still speaks 1.7.2');
  assertMatch(src('README.md'), /\*\*v1\.9\.19\*\*/, 'the README header never moved');
  assertMatch(src('README.md'), /the regression battery \(93 DOM\/source test suites\)/, 'the README battery count never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(src('website/index.html'), /<span class="ver">v1\.8\.6<\/span>/, 'the website current card never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(src('website/index.html'), /releases\/download\/v1\.8\.6\/Burrito_GenDex_1\.8\.6_source\.zip/, 'the website source URL never moved');
  assertMatch(src('CHANGELOG.md'), /^## 1\.9\.19 — The Ends Trade Places/, 'the changelog head never landed');
  assert.equal(DEFAULT_SETTINGS.shineMode, 'sweep', 'a stray edit touched the defaults');
});

console.log(`\n${passed} passed, ${failed} failed — ${failed ? 'FIX ABOVE' : 'ALL GREEN'}`);
process.exit(failed ? 1 : 0);
