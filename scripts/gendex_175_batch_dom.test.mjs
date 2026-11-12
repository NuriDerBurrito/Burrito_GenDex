// 1.7.4 batch — The Trim's Own Shape.
// (Named 175 in the sequence: 172 -> 1.6.8, 173 -> 1.6.9, 174 -> 1.7.3,
//  this suite pins the 1.7.4 laws at their roots.)
// The reported items, each pinned at its root law:
//   A.  THE TRIM EFFECT WEARS THE TRIM ITSELF ("the trim effect isnt
//       perfect on the trims, it just does an area, i want it to fit the
//       trim perfectly so if it has gabs it wont effect the gabs")
//   B.  FINISHES REACH THE DEFAULT-THEME CARDS ("finishes should affect
//       cards even if the cards are on default theme color")
//   C.  THE TRIM EFFECT STOPS FORCING THE HUE OVER THE STAMP ("when trim
//       effect is turned on, it shouldnt automatically make the hue hover
//       over the stamp, fix that")
//   D.  THE PROMPT/NOTE PALLET EARNS ITS CONTRAST ("colors such as pink
//       and such blend in too much, add outlines and improve the coloring
//       pallet ... and text colors should also be fixed")
//   E.  THE DELETE ASK RIDES ABOVE EVERY WINDOW + THE HUGE PREVIEW
//       ARRANGES AND DELETES ("the confirmation window should be above the
//       windows not below it ... account for arranging and deleting images
//       while in huge preview ... go to a valid image in the version, if
//       none exists then just show the casual no images yet")
//   F.  THE EMPTY IMAGE STAGE HOLDS ITS OWN GROUND ("should not be see
//       through and expose background pattern, fix that and have
//       something in it")
//   G.  THE CROP'S DOTS WEAR THE OUTLINE'S OWN THICKNESS ("the black
//       outline around the dots doesnt seem visible ... allow them to
//       follow the last letter before the crop")
//   H.  THE PILL GROWS TO HOLD THE WHOLE TRUTH ("the notifcification cuts
//       after the first row, fix that so the noticification container can
//       extend below to fit the info")
//   I.  THE TAG CHIPS' COLOR FADES ON EVERY CHIP ("have the color inside
//       of all fade, dont fade the tags themselves, just fade the color
//       regardless")
// Plus the version furniture (1.7.4 everywhere).

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
const charview = src('src/components/CharacterView.jsx');
const manager = src('src/components/ImageManagerModal.jsx');
const viewer = src('src/components/ImageViewer.jsx');
const modal = src('src/components/Modal.jsx');
const dialogs = src('src/components/Dialogs.jsx');
const app = src('src/App.jsx');
const helpers = src('src/utils/helpers.js');
const constants = src('src/constants/index.js');
const toasthub = src('src/components/ToastHub.jsx');

console.log('\nA. THE TRIM EFFECT WEARS THE TRIM ITSELF ("it just does an area — fit the trim perfectly, gaps stay gaps")');
// 1.7.5 amendment — the pins below were re-seated on the 1.7.5 truths
// (the coat's ink is the trim's own now — trimCoatInk; FINISH_TRIM_INK
// retired; the seam rail retired with the plate-alone mask; the pour
// slowed to 0.24s; the empty stage's paper left).
ok('A1 — the clone component speaks (TrimCoatLayer re-inks through the picker\'s own is-user ladders)', () => {
  // 1.7.5 — the ink prop + the trim's-own derivation (FINISH_TRIM_INK retired)
  assertMatch(ribbon, /export function TrimCoatLayer\(\{ trim, seamless = false, ink = null \}\) \{/, 'the clone component never spoke');
  assertMatch(ribbon, /'gd-trim', overlay, 'gd-trim-coat', seamless && 'is-seamless', 'is-user'/, 'the clone never rode the is-user ladders');
  assertMatch(ribbon, /style=\{\{ \['--trim-user'\]: userInk \}\}/, 'the clone never threaded its ink');
  assertMatch(ribbon, /export function trimCoatInk\(trim, trimColor = null\) \{/, 'the trim\'s-own ink ladder never spoke');
  assertMatch(ribbon, /if \(String\(trim \|\| 'dash'\) === 'gold'\) return hex6\(trimColor\);/, 'the gold default never kept its own voice');
  assert.ok(!/export const FINISH_TRIM_INK = \{/.test(ribbon), 'the retired signature ink map survived');
  assertMatch(ribbon, /RETIRED IN 1\.7\.5/, 'the retirement tombstone never spoke');
});
ok('A2 — the clone rides one rung above the trim\'s own ink, in the deco\'s context', () => {
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assertMatch(cssLaws, /\.gd-trim\.gd-trim-coat \{\s*\n\s*z-index: 4;\s*\n\}/, 'the clone rung never spoke');
  assertMatch(css, /THE COAT'S TRIM VOICE RIDES ONE RUNG ABOVE THE TRIM'S OWN INK/, 'the 1.7.4 law note is missing');
});
ok('A3 — the synthetic ring retired: the washes keep the plate + the seam rail alone', () => {
  // 1.7.5 — the seam rail retired too: the plate ALONE below the art line
  const rule = css.slice(
    css.indexOf('.gd-fin-on-trim .gd-card-face-finish.is-plate-only.is-over-trim {'),
    css.indexOf('}', css.indexOf('.gd-fin-on-trim .gd-card-face-finish.is-plate-only.is-over-trim {'))
  ).replace(/\/\*[\s\S]*?\*\//g, '');
  // 1.7.9 supersede — THE WASH SPEAKS THE FAMILY'S OWN SHAPE ("its not
  // accounting for the trim's shape and the gabs that it has"): the
  // uniform ring band retired for good — every family carries its OWN
  // mask now (unioned with the plate, no composite anywhere) and the
  // base rule is the plate alone, one layer, one plain cut.
  assertMatch(rule, /-webkit-mask-image: linear-gradient\(\s*\n\s*to bottom,\s*\n\s*rgba\(0, 0, 0, 0\) 0,\s*\n\s*rgba\(0, 0, 0, 0\) calc\(var\(--gd-art-h\) - 0\.5px\),\s*\n\s*#000 calc\(var\(--gd-art-h\) - 0\.5px\)\s*\n\s*\);/, 'the plate mask never spoke');
  assert.ok(!/mask-composite/.test(rule), 'the composite list survived the family-shape retirement');
  assert.ok(!/art-h\) - 12px/.test(rule), 'the seam rail survived the 1.7.5 retirement');
  assert.ok(!/content-box/.test(rule), 'the 9px-inset core survived the family-shape retirement');
  assert.ok(css.includes('.gd-fin-on-trim:has(.gd-trim-dash) .gd-card-face-finish.is-plate-only.is-over-trim {'), 'the family masks never spoke');
  assert.ok(!/--gd-trim-reach/.test(rule), 'the ring-reach padding survived');
  assertMatch(css, /THE SYNTHETIC RING IS RETIRED, THE TRIM WEARS ITSELF/, 'the retirement note is missing');
  assertMatch(css, /THE SEAM RAIL IS RETIRED, THE IMAGE KEEPS ITS RAW BOTTOM EDGE/, 'the 1.7.5 rail retirement note is missing');
});
ok('A4 — every card surface renders the clone (grid, look editor, compact preview)', () => {
  // 1.7.5 — the seats thread the trim's own ladder (trimCoatInk), not the
  // retired finish signature
  assertMatch(grid, /<TrimCoatLayer\s*\n\s*trim=\{character\.cardTrim\}\s*\n\s*seamless=\{seamless\}\s*\n\s*ink=\{coatOverTrim \? trimCoatInk\(character\.cardTrim, character\.cardTrimColor\) : null\}/, 'the grid card never rendered the clone');
  assertMatch(look, /<TrimCoatLayer\s*\n\s*trim=\{trim \|\| DEFAULT_CARD_TRIM\}\s*\n\s*seamless=\{!!cardColor && isExtremePlateHex\(cardColor\)\}\s*\n\s*ink=\{coatOverTrim \? trimCoatInk\(trim \|\| DEFAULT_CARD_TRIM, trimColor\) : null\}/, 'the look editor never rendered the clone');
  // the compact preview's clone rides the preview's own geometry seat
  assertMatch(ribbon, /'gd-trim', overlay, 'gd-trim-coat', seamless && 'is-seamless', 'is-user'/, 'the preview clone never spoke');
  assertMatch(ribbon, /\{overlay && finish !== 'none' && finishOnTrim && \(\(\) => \{/, 'the preview clone gate never spoke');
  assertMatch(ribbon, /const coatInk = trimCoatInk\(trim, trimColor\);/, 'the preview clone ink never walked the trim\'s own ladder');
});

console.log('\nB. FINISHES REACH THE DEFAULT-THEME CARDS ("finishes should affect cards even if the cards are on default theme color")');
ok('B1 — the finish ground map speaks (one receptive plate per material)', () => {
  assertMatch(ribbon, /export const FINISH_GROUND = \{/, 'the ground map never spoke');
  // 1.9.2 — THE GROUND LISTENS TO THE CLOTH: the fixed hex plates retired
  // (an uncolored card read INVERTED on dark themes, deaf to the theme's
  // own color); every ground mixes the theme's panel with the material's
  // hue now — pinned at the map's own seat.
  for (const f of ['numeix', 'foil', 'auric', 'holographic', 'prismatic', 'nuri']) {
    assertMatch(ribbon, new RegExp(`${f}: 'color-mix\\(in srgb, var\\(--gd-panel\\) \\d+%, #[0-9a-f]{6} \\d+%\\)',`), `the ${f} ground never spoke the theme's own cloth`);
  }
});
ok('B2 — the grid card borrows the ground when it speaks no color of its own', () => {
  assertMatch(grid, /const finishGround =\s*\n\s*cardFinish !== 'none' && !character\.cardColor \? FINISH_GROUND\[cardFinish\] \|\| null : null;/, 'the ground const never spoke');
  assertMatch(grid, /\['--gd-card-tint'\]: character\.cardColor \|\| finishGround \|\| 'var\(--gd-panel\)'/, 'the tint never read the ground');
  assertMatch(grid, /\.\.\.\(finishGround \? \{ backgroundColor: finishGround \} : null\),/, 'the card paper never painted the ground');
  // the foot plate + printing earn the ground exactly as a picked color does
  // 1.9.2 — the ground is the theme's cloth now; the plate's printing
  // speaks the theme's own text token (readableInk never reads a mix).
  assertMatch(grid, /: finishGround\s*\n\s*\? \{ backgroundColor: finishGround, color: 'var\(--gd-panel-text\)' \}/, 'the foot never painted the ground');
  assertMatch(grid, /\['--gd-foot-plate'\]: character\.cardColor \|\| finishGround \|\| 'var\(--gd-panel\)'/, 'the corner rise never spoke the ground');
  // 1.9.2 — the printing's ground rung is retired with the fixed plates;
  // the theme's panel text speaks exactly as the uncoated card's always did.
  assertMatch(grid, /style=\{\{ color: character\.cardColor \? readableInk\(character\.cardColor\) : 'var\(--gd-panel-text\)' \}\}/, 'the printing never spoke the theme text');
  // 1.9.2 — the rim derives from the picked ink alone; a colorless card
  // falls to the theme's own counter token (the ground rung is retired).
  assertMatch(grid, /const plateInk = character\.cardColor \? readableInk\(character\.cardColor\) : null;/, 'the rim never shed the ground rung');
});
ok('B3 — the look editor + the compact preview speak the same ground law', () => {
  assertMatch(look, /const finishGround = finish !== 'none' && !cardColor \? FINISH_GROUND\[finish\] \|\| null : null;/, 'the editor ground never spoke');
  assertMatch(look, /\['--gd-card-tint'\]: cardColor \|\| finishGround \|\| 'var\(--gd-panel\)'/, 'the editor tint never read the ground');
  assertMatch(ribbon, /const finishGround = finish !== 'none' && !cardColor \? FINISH_GROUND\[finish\] \|\| null : null;/, 'the preview ground never spoke');
  assertMatch(ribbon, /\['--gd-card-tint'\]: cardColor \|\| finishGround \|\| 'var\(--gd-panel\)'/, 'the preview tint never read the ground');
});

console.log('\nC. THE TRIM EFFECT STOPS FORCING THE HUE OVER THE STAMP ("it shouldnt automatically make the hue hover over the stamp")');
ok('C1 — the under-stamp seat renders BEFORE the band (grid + look editor)', () => {
  const under = grid.slice(grid.indexOf('{/* 1.7.4 — THE UNDER-STAMP SEAT OF THE COAT-PERIOD WASH'), grid.indexOf('{bandStamps.length > 0 && ('));
  assert.ok(/hue && !hueOver && !hueOverTrim && coatOverTrim && \(bandStamps\.length > 0 \|\| freeStamps\.length > 0\) && \(/.test(under), 'the grid never rendered the under-stamp seat');
  const bandStart = grid.indexOf('{bandStamps.length > 0 && (');
  const underAt = grid.indexOf('hue && !hueOver && !hueOverTrim && coatOverTrim && (bandStamps.length > 0 || freeStamps.length > 0) && (');
  assert.ok(underAt >= 0 && underAt < bandStart, 'the under seat never rode before the band');
  const lookUnder = look.slice(look.indexOf("{/* 1.6.2 — THE HUE'S OWN SEAT UNDER THE RIDING COAT"), look.indexOf('{stampUrl && !stampPos && ('));
  assert.ok(/stampHueHex && !stampHueOver && !stampHueOverTrim && coatOverTrim && stampUrl && \(/.test(lookUnder), 'the look editor never rendered the under-stamp seat');
});
ok('C2 — the over-stamp half rides after the band with the lift', () => {
  const after = grid.slice(grid.indexOf('THE OVER-STAMP HALF ALONE'), grid.indexOf("{/* 1.4.5 — THE STAMPLESS HUE'S OWN SEAT"));
  assert.ok(/hue && hueOver && !hueOverTrim && coatOverTrim && \(bandStamps\.length > 0 \|\| freeStamps\.length > 0\) && \(/.test(after), 'the grid never rendered the over-stamp half');
  assertMatch(grid, /'gd-card-stamp-hue gd-hue-band-own', 'is-over-stamp'\)/, 'the grid never threaded the modifier');
  assertMatch(look, /gd-hue-band-own is-over-stamp"/, 'the look editor never threaded the modifier');
  assertMatch(css, /\.gd-card-stamp-hue\.gd-hue-band-own\.is-over-stamp \{\s*\n\s*z-index: 3;/, 'the over-stamp rung never spoke');
});

console.log('\nD. THE PROMPT/NOTE PALLET EARNS ITS CONTRAST ("colors such as pink and such blend in too much")');
ok('D1 — the ladder walks to target contrast (anchor by probe, title, well, line, ink by measurement)', () => {
  assertMatch(helpers, /function partStepToContrast\(base, toward, target, against\)/, 'the contrast walk never spoke');
  assertMatch(helpers, /const anchor = contrastRatio\(face, darkProbe\) >= contrastRatio\(face, lightProbe\) \? '#101010' : '#ffffff';/, 'the anchor never spoke by probe');
  assertMatch(helpers, /const title = partStepToContrast\(face, anchor, 1\.35, face\);/, 'the title rung never earned 1.35:1');
  assertMatch(helpers, /const well = partStepToContrast\(face, anchor, 1\.8, face\);/, 'the well rung never earned 1.8:1');
  assertMatch(helpers, /const line = partStepToContrast\(raw, anchor, 1\.45, face\);/, 'the outline ink never earned 1.45:1');
  assertMatch(helpers, /let ink = worst\(partInkDark\) >= worst\(partInkLight\) \? partInkDark : partInkLight;/, 'the ink never spoke by measurement');
  assertMatch(helpers, /if \(worst\(ink\) < 3\) ink = ink === partInkDark \? '#000000' : '#ffffff';/, 'the pure-extreme floor never spoke');
  assertMatch(helpers, /\['--part-line'\]: line,/, 'the outline var never left the ladder');
});
ok('D2 — the frames speak the outline ink (row, title field, well rim, stage, window)', () => {
  assertMatch(css, /\.gd-part-row\.is-colored \{\s*\n\s*\/\* 1\.7\.4 — THE OUTLINE INK/, 'the row frame note never spoke');
  assertMatch(css, /border-color: var\(--part-line, color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 72%,/, 'the row border never spoke the line');
  assertMatch(css, /\.gd-part-row\.is-colored \.gd-rt-edit \{[\s\S]*?border-color: color-mix\(in srgb, var\(--part-line[\s\S]*?82%,/, 'the title field rim never spoke the line');
  assertMatch(css, /\.gd-part-row\.is-colored \.gd-prompt-box \{[\s\S]*?border-color: color-mix\(in srgb, var\(--part-line[\s\S]*?58%,/, 'the well rim never spoke the line');
  assertMatch(css, /\.gd-prompt-stage\.is-colored,\s*\n\.gd-notes-stage\.is-colored \{[\s\S]*?border-color: var\(--part-line,/, 'the stage frame never spoke the line');
  assertMatch(css, /\.gd-modal-card\.is-part-tinted \{[\s\S]*?border-color: var\(--part-line,/, 'the tinted window frame never spoke the line');
});
ok('D3 — the whispers climb (placeholder 62%, the notes cap 70%) + the window header speaks the title rung', () => {
  assertMatch(css, /\.gd-part-row\.is-colored \.gd-rt-edit::placeholder \{[\s\S]*?color: color-mix\(in srgb, var\(--part-ink, var\(--gd-mute\)\) 62%, transparent\);/, 'the placeholder never climbed');
  assertMatch(css, /\.gd-part-row\.is-colored \.gd-notes-cap \{\s*\n\s*\/\* 1\.7\.4 — the cap climbs to 70%/, 'the notes cap never climbed');
  assertMatch(modal, /background: 'var\(--part-title, var\(--part-face, var\(--gd-panel\)\)\)'/, 'the header band never spoke the title rung');
});

console.log('\nE. THE ASK RIDES ABOVE EVERY WINDOW + THE PREVIEW ARRANGES AND DELETES');
ok('E1 — the over-all lane exists (z 960 — above the veil, the manager, the tooltips and the menus)', () => {
  assertMatch(css, /\.gd-modal-layer\.is-over-all \{\s*\n\s*z-index: 960;\s*\n\}/, 'the over-all lane never spoke');
  assertMatch(css, /THE CONFIRM RIDES ABOVE EVERY WINDOW/, 'the 1.7.4 lane note is missing');
});
ok('E2 — ConfirmModal + App thread the lane flag', () => {
  assertMatch(dialogs, /overAll = false,/, 'the confirm never carried the flag');
  assertMatch(dialogs, /overAll=\{overAll\}/, 'the confirm never threaded the flag to Modal');
  assertMatch(app, /overAll: opts\.overAll === true,/, 'App never recorded the lane');
  assertMatch(app, /overAll=\{confirmState\.overAll === true\}/, 'App never threaded the lane');
  assertMatch(modal, /overAll = false,/, 'Modal never carried the prop');
  assertMatch(modal, /overAll && 'is-over-all',/, 'the layer never wore the class');
});
ok('E3 — the manager\'s delete ask passes the lane while it rides the over-viewer seat', () => {
  assertMatch(manager, /overAll: overViewer === true,/, 'the manager never passed the lane');
});
ok('E4 — the huge preview owns a DELETE item, wired from CharacterView on the over-all lane', () => {
  assertMatch(viewer, /onDeleteImage = null/, 'the viewer never carried the delete prop');
  assertMatch(viewer, /\{ id: 'delete', label: 'Delete image', icon: Trash2, danger: true, disabled: !onDeleteImage, onPick: \(\) => onDeleteImage\?\.\(safeIndex\) \}/, 'the menu never spoke the delete item');
  assertMatch(charview, /const askDeleteViewerImage = \(i\) => \{/, 'CharacterView never spoke the ask');
  assertMatch(charview, /overAll: true,\s*\n\s*onConfirm: \(\) => deleteImage\(i\),/, 'the viewer ask never rode the over-all lane');
  assertMatch(charview, /onDeleteImage=\{askDeleteViewerImage\}/, 'the viewer was never wired');
});
ok('E5 — a deletion pins the NEAREST survivor; an emptied set lands on the casual empty seat', () => {
  assertMatch(charview, /const viewerPrevImagesRef = useRef\(\[\]\);/, 'the previous-list ref never spoke');
  assertMatch(charview, /const prevIdx = viewerPrevImagesRef\.current\.findIndex\(\(im\) => im\.file === viewer\.file\);/, 'the pre-deletion index never spoke');
  assertMatch(charview, /const next = Math\.max\(0, Math\.min\(prevIdx > -1 \? prevIdx : 0, imgs\.length - 1\)\);/, 'the nearest-survivor clamp never spoke');
  assertMatch(charview, /THE SURVIVOR IS THE NEAREST ONE, NOT THE FIRST/, 'the 1.7.4 survivor note is missing');
  // the emptied set still closes the viewer onto the stage's own empty seat
  assertMatch(charview, /if \(!imgs\.length\) \{\s*\n\s*setViewer\(null\);/, 'the emptied set stopped closing the viewer');
});

console.log('\nF. THE EMPTY IMAGE STAGE HOLDS ITS OWN GROUND ("not see through, have something in it")');
ok('F1 — the empty stage speaks an opaque ground + a paper of its own', () => {
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assertMatch(cssLaws, /\.gd-stage-card\.is-empty \{\s*\n\s*background: var\(--gd-panel\);\s*\n\}/, 'the empty card never spoke an opaque ground');
  // 1.7.5 — the paper left, the marks climb: the stage speaks the flat
  // opaque ground + the rim, the \u2716 climbs to the ink's 55%
  assertMatch(cssLaws, /\.gd-stage-card\.is-empty \.gd-stage \{\s*\n\s*background: color-mix\(in srgb, var\(--gd-ink\) 14%, var\(--gd-panel\)\);\s*\n\s*box-shadow: inset 0 0 0 1px color-mix\(in srgb, var\(--gd-ink\) 22%, transparent\);\s*\n\}/, 'the empty stage never spoke its flat ground + rim');
  assert.ok(!/radial-gradient\(color-mix\(in srgb, var\(--gd-ink\) 13%, transparent\) 1px/.test(cssLaws), 'the dot-grid paper survived the 1.7.5 retirement');
  assertMatch(cssLaws, /\.gd-stage-card\.is-empty \.gd-empty-mark \{\s*\n\s*color: color-mix\(in srgb, var\(--gd-ink\) 55%, transparent\);\s*\n\}/, 'the empty mark never climbed');
  assertMatch(css, /THE PAPER LEAVES, THE MARKS ARRIVE/, 'the 1.7.5 marks note is missing');
  assertMatch(css, /THE EMPTY STAGE SPEAKS ITS OWN GROUND/, 'the 1.7.4 ground note is missing');
});

console.log('\nG. THE CROP\'S DOTS WEAR THE OUTLINE\'S OWN THICKNESS ("the outline around the dots doesnt seem visible")');
ok('G1 — the truncating box reads its children (:has carries the format\'s stroke at its own weight)', () => {
  assertMatch(css, /\.gd-card-title:has\(\.rt-outline\) \{\s*\n\s*-webkit-text-stroke: 1\.5px rgb\(from currentColor calc\(255 - r\) calc\(255 - g\) calc\(255 - b\)\);\s*\n\s*paint-order: stroke fill;\s*\n\}/, 'the plain outline stroke never reached the truncating box');
  assertMatch(css, /\.gd-card-title:has\(\.rt-b\.rt-outline\) \{\s*\n\s*-webkit-text-stroke: 2px rgb\(from currentColor calc\(255 - r\) calc\(255 - g\) calc\(255 - b\)\);\s*\n\s*paint-order: stroke fill;\s*\n\}/, 'the bold outline stroke never reached the truncating box');
  // declared AFTER the rim law so the drawn outline outranks the lent one
  const rimAt = css.indexOf('.gd-has-finish .gd-card-title,');
  const hasAt = css.indexOf('.gd-card-title:has(.rt-outline)');
  assert.ok(rimAt >= 0 && hasAt > rimAt, 'the :has laws never overtook the rim law');
  assertMatch(css, /THE CROP SPEAKS THE OUTLINE'S OWN THICKNESS/, 'the 1.7.4 crop note is missing');
});
ok('G2 — the headroom law gains its right-side mirror (the dots\' overhang clears the clip plane)', () => {
  const title = css.slice(css.indexOf('.gd-card-title {'), css.indexOf('.gd-card-meta {'));
  assertMatch(title, /padding-left: 0\.14em;\s*\n\s*margin-left: -0\.14em;/, 'the left law never survived');
  assertMatch(title, /padding-right: 0\.14em;\s*\n\s*margin-right: -0\.14em;/, 'the right mirror never spoke');
  assertMatch(css, /RIGHT HEADROOM FOR THE CROP'S OWN DOTS/, 'the 1.7.4 headroom note is missing');
});

console.log('\nH. THE PILL GROWS TO HOLD THE WHOLE TRUTH ("the notifcification cuts after the first row")');
ok('H1 — the two-line clamp retired; the pill wraps, caps its width, and grows downward', () => {
  const toast = css.slice(css.indexOf('.gd-toast {'), css.indexOf('.gd-toast.is-fail'));
  assertMatch(toast, /white-space: normal;/, 'the wrap law never survived');
  assertMatch(toast, /max-width: min\(420px, calc\(100vw - 48px\)\);/, 'the width cap never survived');
  const cssLaws = toast.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/-webkit-line-clamp/.test(cssLaws), 'the line clamp survived');
  assert.ok(!/display: -webkit-box/.test(cssLaws), 'the box clamp survived');
  assert.ok(!/overflow: hidden/.test(cssLaws), 'the overflow clip survived');
  assertMatch(css, /THE PILL GROWS TO HOLD THE WHOLE TRUTH/, 'the 1.7.4 growth note is missing');
  // the text still renders raw (no truncation in the hub either)
  assertMatch(toasthub, /\{t\.text\}/, 'the toast text ever spoke a truncation');
});

console.log('\nI. THE TAG CHIPS\' COLOR FADES ON EVERY CHIP ("have the color inside of all fade, dont fade the tags themselves")');
ok('I1 — the window arms EVERY chip (the membership gate retired)', () => {
  // 1.7.5 — the pour is the ON mode's own voice: the gate keeps the
  // every-chip law and stands down in the picker mode (the off mode
  // speaks the two-phase flight instead)
  assertMatch(charview, /const colorSwap = !pickerMode && swapOldActive !== null && wasActive !== null && wasActive !== active;/, 'the every-chip gate never spoke');
  assertMatch(charview, /THE COLOR FADES ON EVERY CHIP/, 'the 1.7.4 arm note is missing');
  assertMatch(charview, /THE GATE RETURNS, AND THE POUR IS ALL IT SAYS/, 'the 1.7.6 gate note is missing');
});
ok('I2 — the old face is neutral wherever the chip HOLDS its color (kept fills pour in, lost seats drain)', () => {
  assertMatch(charview, /const oldFace = active \? 'var\(--gd-panel\)' : wasActive \? tag\.color : 'var\(--gd-panel\)';/, 'the neutral old face never spoke');
  assertMatch(charview, /const oldInk = active \? 'var\(--gd-panel-text\)' : wasActive \? readableInk\(tag\.color\) : 'var\(--gd-panel-text\)';/, 'the neutral old ink never spoke');
  // 1.7.9 — the pour returns to the family's own 0.15s clock (still expo-out)
  assertMatch(css, /animation: gd-tag-color-swap 0\.15s cubic-bezier\(0\.16, 1, 0\.3, 1\);/, 'the pour never widened');
  assertMatch(css, /THE POUR TAKES ITS TIME/, 'the 1.7.5 pour note is missing');
});
ok('I3 — the chips themselves never fade (the wholesale list keeps its 1.6.9 retirement)', () => {
  const list = css.slice(css.indexOf('.gd-cv-swap .gd-name-fold,'), css.indexOf('@keyframes gd-cv-swap'));
  assert.ok(!/gd-tag-chip/.test(list), 'the whole chip rejoined the opacity fade');
});

console.log('\nJ. VERSION FURNITURE');
ok('J1 — the version is 1.7.4 everywhere (the furniture sweep)', () => {
  // 1.7.5 — the sweep pins the 1.7.5 furniture now (the suite keeps its
  // name; the law is the CURRENT truth)
  assertMatch(constants, /version: '1\.9\.19',/, 'constants still speak 1.7.4');
  const pkg = JSON.parse(src('package.json'));
  assert.equal(pkg.version, '1.9.19', 'package.json still speaks 1.7.4');
  assertMatch(src('package-lock.json'), /"version": "1\.9\.19"/, 'the lock root still speaks 1.7.4');
  assertMatch(src('README.md'), /\*\*v1\.9\.19\*\*/, 'the README header never moved');
  assertMatch(src('README.md'), /the regression battery \(93 DOM\/source test suites\)/, 'the README battery count never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(src('website/index.html'), /<span class="ver">v1\.8\.6<\/span>/, 'the website current card never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(src('website/index.html'), /releases\/download\/v1\.8\.6\/Burrito_GenDex_1\.8\.6_source\.zip/, 'the website source URL never moved');
  assertMatch(src('CHANGELOG.md'), /^## 1\.9\.19 — The Ends Trade Places/, 'the changelog head never landed');
  assert.equal(DEFAULT_SETTINGS.shineMode, 'sweep', 'a stray edit touched the defaults');
  assert.equal(DEFAULT_SETTINGS.showAllTags, true, 'the unselected-tags default never spoke');
});

console.log(`\n${passed} passed, ${failed} failed — ${failed ? 'FIX ABOVE' : 'ALL GREEN'}`);
process.exit(failed ? 1 : 0);
