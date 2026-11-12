// 1.7.5 batch — The Trim's Own Ink.
// (Named 176 in the sequence: 175 pins the 1.7.4 laws; this suite pins
//  the 1.7.5 laws at their roots.)
// The reported items, each pinned at its root law:
//   A.  THE COAT'S INK IS THE TRIM'S OWN ("you broke the trim color, its
//       always yellow now, fix that (only the gold trim has a default
//       color, the rest follow the card's color, if card has no color
//       then it follows the theme color)")
//   B.  THE FINISH LEAVES THE IMAGE'S BOTTOM EDGE ALONE ("the finish
//       clips horizontally at the bottom of the card's image … without
//       ruining the corner fix we did in previous sessions")
//   C.  THE PROMPT EDITOR'S TITLE DRAWS ITS OUTLINE + HIGHLIGHTS UNDER
//       THE CURSOR ("add an outline around the prompt's title" + "the
//       outline of the prompt should be highlighted when i select it
//       like the title")
//   D.  THE PALLET'S LEFT RIBBON SPEAKS A RUNG OF ITS OWN ("it shouldnt
//       match the inner container of the prompt nor the overall
//       container")
//   E.  THE EMPTY IMAGE STAGE'S MARKS READ ("a weird dotted pattern that
//       blends the x and the 'no image yet' text")
//   F.  UNDO BRINGS DELETED IMAGES BACK WHOLE ("when undoing when i
//       delete an image or something, the image comes back broken")
//   G.  THE IMAGE MANAGER'S EMPTY STATE FITS THE ROW ("the label is too
//       big, it should fit into the row and have the bottons on same
//       row too")
//   H.  THE UNSELECTED TAGS SWITCH ("add an option in setting … when
//       pressing + tags to first open a window that shows tags and
//       allow the user to add them, then the tag manager button")
//   I.  THE TAGS' CARD-SWITCH FLIGHT ANSWERS THE SWITCH ("making the
//       tags fade then the new ones fade in when its off, but when its
//       on then it will just be the colors (while you are at it, the
//       color shift seems to happen very quick, fix that)")
// Plus the version furniture (1.7.5 everywhere).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS } from '../src/constants/index.js';
import { partContainerFace, createSafeDb } from '../src/utils/helpers.js';
import { markImageDead, probeImageAliveness, sweepImageDeaths } from '../src/utils/imageDeaths.js';

// Transpile TagRibbon.jsx on the fly with the project's babel (the smoke
// render suite's own loader — trimCoatInk is a real function, and its law
// deserves a REAL measurement, not a regex).
const require = createRequire(import.meta.url);
const babel = require('@babel/core');
require.extensions['.jsx'] = (module, filename) => {
  const { code } = babel.transformFileSync(filename, {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      ['@babel/preset-react', { runtime: 'automatic' }],
    ],
  });
  module._compile(code, filename);
};
const { trimCoatInk } = require('../src/components/TagRibbon.jsx');

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
const picker = src('src/components/TagPickerModal.jsx');
const settings = src('src/components/SettingsModal.jsx');
const app = src('src/App.jsx');
const helpers = src('src/utils/helpers.js');
const constants = src('src/constants/index.js');
const deaths = src('src/utils/imageDeaths.js');

console.log('\nA. THE COAT\'S INK IS THE TRIM\'S OWN ("only the gold trim has a default color, the rest follow the card\'s color")');
ok('A1 — the trim\'s-own ink ladder speaks (picked -> gold default -> the theme; 1.7.7 retired the card-color rung)', () => {
  assertMatch(ribbon, /export function trimCoatInk\(trim, trimColor = null\) \{/, 'the ladder function never spoke');
  assertMatch(ribbon, /THE TRIM'S OWN INK LADDER/, 'the 1.7.5 ladder note is missing');
  // the law, measured: picked wins, gold keeps null (its own palette),
  // and the card's color NEVER follows (1.7.7 retired the rung)
  assert.equal(trimCoatInk('dash', '#123456', '#654321'), '#123456', 'the picked ink never won');
  assert.equal(trimCoatInk('gold', null, '#654321'), null, 'the gold engraving never kept its own default');
  assert.equal(trimCoatInk('dash', null, '#654321'), null, "the card's color still followed (1.8.9 retired the rung)");
  assert.equal(trimCoatInk('dash', null, null), null, 'a colorless card never fell to the theme');
  assert.equal(trimCoatInk('gold', '#123456', '#654321'), '#123456', 'a pick never overrode the gold');
});
ok('A2 — the clone speaks the ladder (is-user only while there is an ink to speak)', () => {
  assertMatch(ribbon, /export function TrimCoatLayer\(\{ trim, seamless = false, ink = null \}\) \{/, 'the clone never took the ink prop');
  assertMatch(ribbon, /const userInk = typeof ink === 'string'/, 'the ink validation never spoke');
  assertMatch(ribbon, /\.test\(ink\) \? ink : null;/, 'the ink validation never finished');
  assertMatch(ribbon, /if \(!overlay \|\| !userInk\) return null;/, 'the no-ink clone never stood down');
  assertMatch(ribbon, /userInk && 'is-user'/, 'the is-user arm never followed the ink');
});
ok('A3 — FINISH_TRIM_INK is retired (no material speaks for the trim\'s line)', () => {
  assert.ok(!/export const FINISH_TRIM_INK = \{/.test(ribbon), 'the signature ink map survived');
  assert.ok(!/FINISH_TRIM_INK\[/.test(grid), 'the grid card still spoke the finish signature');
  assert.ok(!/FINISH_TRIM_INK\[/.test(look), 'the look editor still spoke the finish signature');
  assert.ok(!/FINISH_TRIM_INK\[/.test(ribbon), 'the compact preview still spoke the finish signature');
  assertMatch(ribbon, /RETIRED IN 1\.7\.5/, 'the retirement tombstone never spoke');
});
ok('A4 — every surface threads the ladder (grid, look editor, compact preview)', () => {
  assertMatch(grid, /ink=\{coatOverTrim \? trimCoatInk\(character\.cardTrim, character\.cardTrimColor\) : null\}/, 'the grid card never walked the ladder');
  /* 1.9.3 — the import gained finishGroundTone (the extreme-grounds
     reader — see .gd-fin-ground-* in index.css). 1.9.6 — it gained
     finishInkTwin too (the shadow twin the light ground's seats
     read — see --gd-tint-hand in index.css). */
  assertMatch(grid, /import TagRibbon, \{ CardFinishLayer, FINISH_GROUND, TrimCoatLayer, TrimOverlay, cropFrame, finishGroundTone, finishTintLean, finishPhase, finishStrength, markRibbonHeadRoom, ribbonSize, ribbonTopOffset, trimCoatInk \}/, 'the grid never imported the ladder');
  assertMatch(look, /ink=\{coatOverTrim \? trimCoatInk\(trim \|\| DEFAULT_CARD_TRIM, trimColor\) : null\}/, 'the look editor never walked the ladder');
  assertMatch(ribbon, /const coatInk = trimCoatInk\(trim, trimColor\);/, 'the compact preview never walked the ladder');
});

console.log('\nB. THE FINISH LEAVES THE IMAGE\'S BOTTOM EDGE ALONE ("without ruining the corner fix")');
ok('B1 — the seam rail retired: the over-trim mask is the plate alone', () => {
  const at = css.indexOf('.gd-fin-on-trim .gd-card-face-finish.is-plate-only.is-over-trim {');
  const rule = css.slice(at, css.indexOf('}', at)).replace(/\/\*[\s\S]*?\*\//g, '');
  // 1.7.9 supersede — THE WASH SPEAKS THE FAMILY'S OWN SHAPE ("its not
  // accounting for the trim's shape and the gabs that it has"): the
  // uniform ring band retired for good — every family carries its OWN
  // mask (unioned with the plate, no composite anywhere) and the base
  // rule is the plate alone. The rail stays retired.
  assertMatch(rule, /-webkit-mask-image: linear-gradient\(/, 'the plate mask never spoke');
  assert.ok(!/art-h\) - 12px/.test(rule), 'the rail\'s soft shoulder survived');
  assert.ok(!/art-h\) - 9px/.test(rule), 'the rail\'s opaque tail survived');
  assert.ok(!/mask-composite/.test(rule), 'the composite list survived the family-shape retirement');
  assert.ok(css.includes('.gd-fin-on-trim:has(.gd-trim-dash) .gd-card-face-finish.is-plate-only.is-over-trim {'), 'the family masks never spoke');
  assertMatch(css, /THE SEAM RAIL IS RETIRED, THE IMAGE KEEPS ITS RAW BOTTOM EDGE/, 'the 1.7.5 rail note is missing');
});
ok('B2 — the corner fix keeps its whole voice (the rise, the square fill, the four corners)', () => {
  // the 1.3.1/1.3.5 rise — the plate fills the carved corners with the card's color
  const rise = css.slice(css.indexOf('.gd-card-foot::before'), css.indexOf('}', css.indexOf('.gd-card-foot::before')) + 1);
  assertMatch(rise, /bottom: 100%;/, 'the rise never rose');
  assertMatch(rise, /height: calc\(max\(var\(--gd-shape-radius, var\(--gd-radius\)\) - 2px, 0px\) \+ 1px\);/, 'the rise height law never spoke');
  assertMatch(rise, /background: var\(--gd-foot-plate, transparent\);/, 'the rise plate never spoke');
  assertMatch(rise, /border-radius: 0;/, 'the square fill never spoke');
  // the 1.3.4 all-four-corners radius rides every surface
  assertMatch(grid, /borderRadius:\s*\n\s*'calc\(var\(--gd-shape-radius, var\(--gd-radius\)\) - 2px\)/, 'the grid sleeve radius never spoke');
  assertMatch(ribbon, /borderRadius:\s*\n\s*'calc\(var\(--gd-shape-radius, var\(--gd-radius\)\) - 2px\)/, 'the preview art radius never spoke');
});

console.log('\nC. THE PROMPT EDITOR\'S TITLE DRAWS ITS OUTLINE + HIGHLIGHTS ("like the title")');
ok('C1 — the untinted window\'s title wears the well\'s own frame + the accent focus', () => {
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // 1.7.8 supersede — ONE WINDOW, ONE FIELD ("the title should have the
  // same style as the prompt/note below it"): the untinted title needs NO
  // rule of its own — the .gd-input base IS the stage's resting law.
  assert.ok(!/\.gd-modal-card \.gd-notes-title\.gd-input,\s*\n\.gd-modal-card \.gd-notes-title\.gd-rt-edit \{/.test(cssLaws), 'the private untinted title law survived');
  assertMatch(css, /ONE WINDOW, ONE FIELD/, 'the 1.7.8 one-field note is missing');
  assertMatch(cssLaws, /\.gd-modal-card \.gd-notes-title\.gd-input:focus,\s*\n\.gd-modal-card \.gd-notes-title\.gd-rt-edit:focus,\s*\n\.gd-modal-card \.gd-notes-title\.gd-input:focus-visible,\s*\n\.gd-modal-card \.gd-notes-title\.gd-rt-edit:focus-visible,\s*\n\.gd-modal-card \.gd-prompt-stage:focus,\s*\n\.gd-modal-card \.gd-notes-stage:focus \{/, 'the family focus gate never spoke');
  assertMatch(cssLaws, /\.gd-modal-card \.gd-prompt-stage:focus,\s*\n\.gd-modal-card \.gd-notes-stage:focus \{\s*\n\s*outline: none;\s*\n\s*border-color: var\(--gd-accent\);[\s\S]*?0 0 0 2px color-mix\(in srgb, var\(--gd-accent\) 60%, transparent\),/, 'the accent flip + ring never spoke');
  assertMatch(css, /the 1\.7\.5 outline\s*\n\s*and the 1\.7\.6 recess retire with this law/, 'the 1.7.8 retirement note is missing');
});
ok('C2 — the tinted window\'s title frame + focus ring speak the line ink / the picked color', () => {
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // 1.7.8 supersede — the tinted title wears the STAGE's carved well
  // verbatim (border-COLOR on the .gd-input base + the spine + the
  // grounded offset shadow), never its private 1.5px frame again.
  assertMatch(cssLaws, /\.gd-modal-card\.is-part-tinted \.gd-notes-title\.gd-input,\s*\n\.gd-modal-card\.is-part-tinted \.gd-notes-title\.gd-rt-edit \{\s*\n\s*background: var\(--part-well[\s\S]*?\s*border-color: var\(--part-line[\s\S]*?\s*inset 3px 0 0 var\(--part-spine,/, 'the tinted carved well never spoke');
  assertMatch(cssLaws, /\.gd-modal-card\.is-part-tinted \.gd-notes-title:focus,\s*\n\.gd-modal-card\.is-part-tinted \.gd-notes-title:focus-visible,\s*\n\.gd-modal-card\.is-part-tinted \.gd-prompt-stage:focus,\s*\n\.gd-modal-card\.is-part-tinted \.gd-notes-stage:focus \{[\s\S]*?border-color: color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 78%, var\(--part-ink, var\(--gd-ink\)\)\);[\s\S]*?0 0 0 2px color-mix\(in srgb, var\(--gd-accent\) 60%, transparent\),/, 'the tinted focus ring never spoke');
  assertMatch(css, /ONE WINDOW, ONE FIELD/, 'the 1.7.8 one-field note is missing');
  // 1.7.8 — the FAMILY blocks speak the order now: the untinted focus
  // list leads, the tinted family follows (the later-word win).
  const untintedAt = css.indexOf('.gd-modal-card .gd-notes-title.gd-input:focus,');
  const tintedAt = css.indexOf('.gd-modal-card.is-part-tinted .gd-notes-title:focus,');
  assert.ok(untintedAt >= 0 && tintedAt > untintedAt, 'the tinted laws never overtook the untinted ones');
});

console.log('\nD. THE PALLET\'S LEFT RIBBON SPEAKS A RUNG OF ITS OWN ("never the well, never the face")');
ok('D1 — the ladder grows the --part-spine rung (the raw color walked to 1.6:1)', () => {
  assertMatch(helpers, /const spineTarget = lightestSeat \+ 0\.09;/, 'the spine rung never walked');
  assertMatch(helpers, /\['--part-spine'\]: spine,/, 'the spine var never shipped');
  assertMatch(helpers, /THE SPINE JOINS THE LADDER/, 'the 1.7.5 spine note is missing');
  // measured: the spine never equals the well or the face, on both shades
  const faces = ['#ff6fa5', '#1d3557', '#e9c46a', '#7b2d8b', '#2a9d8f', '#f4a261'];
  for (const hex of faces) {
    for (const deep of [false, true]) {
      const face = partContainerFace(hex, deep);
      assert.ok(face, `the ladder never spoke for ${hex}`);
      assert.notEqual(face['--part-spine'], face['--part-well'], `the spine matched the well on ${hex} (${deep ? 'deep' : 'light'})`);
      assert.notEqual(face['--part-spine'], face['--part-face'], `the spine matched the face on ${hex} (${deep ? 'deep' : 'light'})`);
      assert.notEqual(face['--part-spine'], face['--part-title'], `the spine matched the title on ${hex} (${deep ? 'deep' : 'light'})`);
    }
  }
});
ok('D2 — every spine seat speaks the rung (row well, deep, focus, stage, deep stage)', () => {
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rowWell = cssLaws.slice(cssLaws.indexOf('.gd-part-row.is-colored .gd-prompt-box {'), cssLaws.indexOf('.gd-part-row.is-colored.is-shade-deep .gd-prompt-box {'));
  assertMatch(rowWell, /inset 3px 0 0 var\(--part-spine,/, 'the row well spine never spoke the rung');
  const deepWell = cssLaws.slice(cssLaws.indexOf('.gd-part-row.is-colored.is-shade-deep .gd-prompt-box {'), cssLaws.indexOf('/* 1.7.3 — THE COLORED WELL\'S OWN FOCUS'));
  assertMatch(deepWell, /inset 3px 0 0 var\(--part-spine,/, 'the deep well spine never spoke the rung');
  const focusWell = cssLaws.slice(cssLaws.indexOf('.gd-part-row.is-colored .gd-prompt-box:focus {'), cssLaws.indexOf('/* 1.7.1 — THE NOTES\' CAP READS THE FACE'));
  assertMatch(focusWell, /inset 3px 0 0 var\(--part-spine,/, 'the focus spine never spoke the rung');
  const stage = cssLaws.slice(cssLaws.indexOf('.gd-prompt-stage.is-colored,'), cssLaws.indexOf('.gd-prompt-stage.is-colored::placeholder'));
  assertMatch(stage, /inset 3px 0 0 var\(--part-spine,/, 'the stage spine never spoke the rung');
  const deepStage = cssLaws.slice(cssLaws.indexOf('.gd-prompt-stage.is-colored.is-shade-deep,'), cssLaws.indexOf('.gd-part-row.is-colored.is-move-flash'));
  assertMatch(deepStage, /inset 3px 0 0 var\(--part-spine,/, 'the deep stage spine never spoke the rung');
});

console.log('\nE. THE EMPTY IMAGE STAGE\'S MARKS READ ("the pattern blends the x and the text")');
ok('E1 — the paper leaves; the marks climb', () => {
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/radial-gradient\(color-mix\(in srgb, var\(--gd-ink\) 13%, transparent\) 1px/.test(cssLaws), 'the dot-grid paper survived');
  assertMatch(cssLaws, /\.gd-stage-card\.is-empty \.gd-empty-mark \{\s*\n\s*color: color-mix\(in srgb, var\(--gd-ink\) 55%, transparent\);\s*\n\}/, 'the empty mark never climbed');
  assertMatch(cssLaws, /\.gd-stage-card\.is-empty \.gd-stage \{\s*\n\s*background: color-mix\(in srgb, var\(--gd-ink\) 14%, var\(--gd-panel\)\);/, 'the opaque ground never stayed');
  assertMatch(css, /THE PAPER LEAVES, THE MARKS ARRIVE/, 'the 1.7.5 marks note is missing');
});

console.log('\nF. UNDO BRINGS DELETED IMAGES BACK WHOLE ("the image comes back broken")');
ok('F1 — the death row module speaks (mark, probe, sweep)', () => {
  assertMatch(deaths, /export function markImageDead\(filename\) \{/, 'the mark never spoke');
  assertMatch(deaths, /export function probeImageAliveness\(probe\) \{/, 'the probe never spoke');
  assertMatch(deaths, /export function sweepImageDeaths\(api\) \{/, 'the sweep never spoke');
  assertMatch(deaths, /THE IMAGE DEATH ROW/, 'the 1.7.5 law note is missing');
});
ok('F2 — App registers the probe + sweeps with every mutation, undo and redo', () => {
  assertMatch(app, /probeImageAliveness\(\(file\) => \{/, 'the probe never registered');
  assertMatch(app, /for \(const snap of undoStackRef\.current\) if \(inDb\(snap\)\) return true;/, 'the probe never walked the undo stack');
  assertMatch(app, /for \(const snap of redoStackRef\.current\) if \(inDb\(snap\)\) return true;/, 'the probe never walked the redo stack');
  const mutate = app.slice(app.indexOf('const mutateDb = useCallback('), app.indexOf('const undo = useCallback('));
  assertMatch(mutate, /sweepImageDeaths\(api\);/, 'the mutation sweep never spoke');
  const undoBody = app.slice(app.indexOf('const undo = useCallback('), app.indexOf('const redo = useCallback('));
  assertMatch(undoBody, /sweepImageDeaths\(api\);/, 'the undo sweep never spoke');
  const redoBody = app.slice(app.indexOf('const redo = useCallback('), app.indexOf('const imageProbeOnceRef'));
  assertMatch(redoBody, /sweepImageDeaths\(api\);/, 'the redo sweep never spoke');
});
ok('F3 — every delete door rides the row (image, version, character)', () => {
  const del = charview.slice(charview.indexOf('const deleteImage = (index) => {'), charview.indexOf('const askDeleteViewerImage'));
  assertMatch(del, /markImageDead\(img\.file\);/, 'the image door never rode the row');
  assert.ok(!/deleteImageFile/.test(del), 'the image door still unlinked in the same breath');
  const delVer = charview.slice(charview.indexOf('const deleteVersionNow = (vId) => {'), charview.indexOf('const deleteVersion = (vId) => {'));
  assertMatch(delVer, /\(victim\.images \|\| \[\]\)\.forEach\(\(img\) => markImageDead\(img\.file\)\);/, 'the version door never rode the row');
  const delChar = app.slice(app.indexOf('const deleteCharacterNow = useCallback('), app.indexOf('const askDeleteCharacter = useCallback('));
  assertMatch(delChar, /victim\.versions\?\.forEach\(\(v\) => v\.images\?\.forEach\(\(img\) => markImageDead\(img\.file\)\)\);/, 'the character door never rode the row');
  assert.ok(!/api\?\.deleteImageFile/.test(delChar), 'the character door still unlinked in the same breath');
});
ok('F4 — the row holds the file while any snapshot speaks its name (measured)', () => {
  // simulate: mark -> alive while the db holds it; gone once nothing does
  const calls = [];
  const api = { deleteImageFile: (f) => calls.push(f) };
  const db = { characters: [{ versions: [{ images: [{ file: 'img_a.png' }] }] }] };
  probeImageAliveness((file) => db.characters.some((c) => c.versions.some((v) => v.images.some((i) => i.file === file))));
  markImageDead('img_a.png');
  sweepImageDeaths(api);
  assert.deepEqual(calls, [], 'the sweep unlinked a file the db still references');
  db.characters[0].versions[0].images = [];
  sweepImageDeaths(api);
  assert.deepEqual(calls, ['img_a.png'], 'the sweep never unlinked the orphaned file');
});

console.log('\nG. THE IMAGE MANAGER\'S EMPTY STATE FITS THE ROW ("the label too big, buttons on same row")');
ok('G1 — one compact row: mark + label + ADD + PASTE', () => {
  const empty = manager.slice(manager.indexOf('{images.length === 0 ? ('), manager.indexOf(') : (\n        <div className="gd-img-manager-slots"'));
  assertMatch(empty, /className="gd-panel p-3 flex items-center gap-2\.5"/, 'the compact row never spoke');
  assertMatch(empty, /style=\{\{ fontSize: 16 \}\}/, 'the mark never shrank');
  assertMatch(empty, /flex-1 min-w-0 truncate/, 'the label never fitted the row');
  assertMatch(empty, /ADD\n/, 'the ADD key never rode the row');
  assertMatch(empty, /PASTE\n/, 'the PASTE key never rode the row');
  assert.ok(!/flex flex-col items-center gap-3/.test(empty), 'the tall stack survived');
  assert.ok(!/gd-btn-solid/.test(empty), 'the empty body still spoke a second solid key');
  assertMatch(manager, /THE EMPTY SEAT FITS THE ROW/, 'the 1.7.5 row note is missing');
});

console.log('\nH. THE UNSELECTED TAGS SWITCH ("when its on tags that are not selected onto the card will be visible (default)")');
ok('H1 — the setting speaks (default ON, sanitized on load)', () => {
  assert.equal(DEFAULT_SETTINGS.showAllTags, true, 'the default never spoke ON');
  assertMatch(constants, /showAllTags: true,/, 'the default seat never spoke');
  assertMatch(helpers, /showAllTags: typeof rawSettings\.showAllTags === 'boolean' \? rawSettings\.showAllTags : DEFAULT_SETTINGS\.showAllTags,/, 'the sanitize law never spoke');
  const safe = createSafeDb({ settings: { showAllTags: false } });
  assert.equal(safe.settings.showAllTags, false, 'a stored OFF never survived');
  const safeFresh = createSafeDb({ settings: {} });
  assert.equal(safeFresh.settings.showAllTags, true, 'a fresh db never fell to ON');
});
ok('H2 — the settings window carries the switch (CARDS & TAGS, house toggle law)', () => {
  assertMatch(settings, /title="UNSELECTED TAGS"/, 'the switch never spoke its name');
  assertMatch(settings, /className=\{clsx\('gd-switch', settings\.showAllTags !== false && 'is-on'\)\}/, 'the toggle never spoke the house law');
  assertMatch(settings, /onClick=\{\(\) => set\('showAllTags', settings\.showAllTags === false\)\}/, 'the toggle click never spoke');
  assertMatch(settings, /THE UNSELECTED TAGS SWITCH/, 'the 1.7.5 switch note is missing');
});
ok('H3 — App threads the switch + the picker door to both view mounts', () => {
  assertMatch(app, /const openTagPickerWindow = useCallback\(\(characterId\) => \{/, 'the picker door never spoke');
  assertMatch(app, /setModal\(\{ type: 'tagPicker', characterId: characterId \|\| null \}\);/, 'the picker seat never spoke');
  assertMatch(app, /showAllTags=\{db\.settings\.showAllTags !== false\}/, 'a mount never read the switch');
  assert.equal((app.match(/showAllTags=\{db\.settings\.showAllTags !== false\}/g) || []).length, 2, 'both mounts never read the switch');
  assert.equal((app.match(/onOpenTagPicker=\{openTagPickerWindow\}/g) || []).length, 2, 'both mounts never took the picker door');
});
ok('H4 — the row speaks the census (visibleTags + the probe + the sorting stand-down)', () => {
  assertMatch(charview, /const visibleTags = pickerMode \? tags\.filter\(\(t\) => activeIds\.includes\(t\.id\)\) : tags;/, 'the census never spoke');
  assertMatch(charview, /\.\.\.visibleTags\.map\(\(tag\) => \{/, 'the probe never spoke the census');
  assertMatch(charview, /count: pickerMode \? 0 : tags\.length,/, 'the sorting never stood down');
  assertMatch(charview, /\{\.\.\.\(pickerMode \? null : bindItem\(i\)\)\}/, 'the drag bindings never stood down');
  assertMatch(charview, /THE ROW'S OWN CENSUS/, 'the 1.7.5 census note is missing');
});
ok('H5 — the + TAGS keys follow the switch (the header key + the row\'s trailing key)', () => {
  const headerKey = charview.slice(charview.indexOf('THE DOOR FOLLOWS THE SWITCH'), charview.indexOf('TAG\n                </button>'));
  assertMatch(headerKey, /if \(showAllTags === false\) onOpenTagPicker\?\.\(character\.id\);/, 'the header key never followed the switch');
  const rowKey = charview.slice(charview.indexOf("THE + KEY'S DOOR"), charview.indexOf('title={showAllTags === false'));
  assertMatch(rowKey, /if \(showAllTags === false\) onOpenTagPicker\?\.\(character\.id\);/, 'the row key never followed the switch');
});

console.log('\nI. THE TAG PICKER WINDOW ("first open a window that shows tags and allow the user to add them, then the tag manager button")');
ok('I1 — the picker window speaks (the row\'s own chip law + the manager inside)', () => {
  assertMatch(picker, /title="TAG PICKER"/, 'the picker title never spoke');
  // 1.7.9 — the picker speaks the sort door too (the wall's own hand)
  assertMatch(picker, /export default function TagPickerModal\(\{[\s\S]*?onReorderTags,[\s\S]*?onClose,[\s\S]*?showHelp = false,\s*\}\)/, 'the picker signature never spoke');
  assertMatch(picker, /onClick=\{\(\) => onToggleTag\?\.\(character\?\.id, tag\.id\)\}/, 'the picker toggle never spoke');
  assertMatch(picker, /onClick=\{onOpenTagManager\}/, 'the manager key never rode the picker');
  assertMatch(picker, /THE TAG PICKER WINDOW/, 'the 1.7.5 picker note is missing');
});
ok('I2 — App mounts the picker in the modal slot', () => {
  assertMatch(app, /import TagPickerModal from '\.\/components\/TagPickerModal\.jsx';/, 'the picker import never spoke');
  const mount = app.slice(app.indexOf("modal?.type === 'tagPicker'"), app.indexOf('{confirmState && ('));
  assertMatch(mount, /<TagPickerModal\s*\n\s*key="tag-picker-window"/, 'the picker mount never spoke');
  assertMatch(mount, /character=\{db\.characters\.find\(\(c\) => c\.id === modal\.characterId\) \|\| null\}/, 'the picker character never resolved');
  assertMatch(mount, /onToggleTag=\{toggleTag\}/, 'the picker toggle never wired');
});

console.log('\nJ. THE TAGS\' CARD-SWITCH FLIGHT ANSWERS THE SWITCH ("fade then fade in when off, just the colors when on")');
ok('J1 — the two-phase flight speaks (ghost out, delayed arrival, kept solid)', () => {
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assertMatch(css, /THE PICKER MODE'S TWO-PHASE FLIGHT/, 'the 1.7.5 flight note is missing');
  assertMatch(cssLaws, /@keyframes gd-tag-ghost-out \{/, 'the ghost keyframe never spoke');
  assertMatch(cssLaws, /@keyframes gd-tag-chip-in \{/, 'the arrival keyframe never spoke');
  // 1.7.9 — the family's own clock: the ghost out at 0.07s, the arrival 0.08s at 0.07s
  assertMatch(cssLaws, /\.gd-tag-ghost-row \{[\s\S]*?animation: gd-tag-ghost-out 0\.07s ease-out forwards;/, 'the ghost flight never spoke');
  assertMatch(cssLaws, /\.gd-cv-tagflight \.gd-rows-tray \.gd-tag-chip:not\(\.is-ghost\),\s*\n\.gd-cv-tagflight \.gd-tag-zone-seat \.gd-btn\[data-no-sort\] \{\s*\n\s*animation: gd-tag-chip-in 0\.08s ease-out 0\.07s both;/, 'the delayed arrival never spoke');
});
ok('J2 — the ghost layer + the kept chip speak in the row', () => {
  assertMatch(charview, /const ghostTags = pickerMode && swapOldActive \? tags\.filter\(\(t\) => swapOldActive\.has\(t\.id\)\) : \[\];/, 'the ghost set never spoke');
  // 1.7.8 supersede — THE FAREWELL IS A SNAPSHOT: the ghost row arms its
  // seat-memory law (is-seated) through clsx now.
  assertMatch(charview, /className=\{clsx\('gd-tag-ghost-row', ghostSeatsRef\.current && 'is-seated'\)\}/, 'the ghost layer never mounted');
  assert.ok(!charview.includes("'is-kept'"), 'the kept class never retired');
  assertMatch(charview, /gd-tag-chip is-ghost !py-1 !px-2 text-\[10px\]/, 'the ghost chips never wore their exemption');
});
ok('J3 — the ceremony splits its clocks (wholesale 190ms, tags 170ms) + the tagflight class', () => {
  const ceremony = charview.slice(charview.indexOf('const swapTagTimerRef = useRef(0);'), charview.indexOf('useEffect(\n    () => () => {\n      if (swapCleanTimerRef.current)'));
  assertMatch(ceremony, /el\.classList\.add\('gd-cv-tagflight'\);/, 'the tagflight class never armed');
  assertMatch(ceremony, /\}, 190\);/, 'the wholesale clock never kept its law');
  // 1.7.9 — the tags speak the family's own clock (320ms -> 170ms)
  assertMatch(ceremony, /\}, 170\);/, 'the tags\' own clock never spoke');
  assertMatch(charview, /THE TAGS' OWN FLIGHT CLOCK/, 'the 1.7.5 clock note is missing');
});
ok('J4 — the on mode keeps the pour alone, at the family\'s own 0.15s clock', () => {
  // 1.7.9 — the pour returns to the 0.15s clock the title and the stamps speak
  assertMatch(css, /animation: gd-tag-color-swap 0\.15s cubic-bezier\(0\.16, 1, 0\.3, 1\);/, 'the pour never took its time');
  assertMatch(css, /THE POUR TAKES ITS TIME/, 'the 1.7.5 pour note is missing');
  assertMatch(charview, /const colorSwap = !pickerMode && swapOldActive !== null && wasActive !== null && wasActive !== active;/, 'the pour gate never spoke the on mode');
  // reduced motion stills every new beat — the ghost + the arrival each
  // speak BOTH stills (the .gd-reduced-motion law + the OS media law)
  assert.equal((css.match(/\.gd-reduced-motion \.gd-tag-ghost-row,/g) || []).length, 1, 'reduced motion never stilled the ghost');
  assert.equal((css.match(/\.gd-reduced-motion \.gd-cv-tagflight \.gd-rows-tray \.gd-tag-chip:not\(\.is-ghost\)/g) || []).length, 1, 'reduced motion never stilled the arrival');
  const media = css.slice(css.indexOf('.gd-reduced-motion .gd-cv-swap .gd-name-fold,'));
  assert.ok(media.includes('.gd-tag-ghost-row,'), 'the OS media law never stilled the ghost');
  assert.ok(media.includes('.gd-cv-tagflight .gd-rows-tray .gd-tag-chip:not(.is-ghost)'), 'the OS media law never stilled the arrival');
});

console.log('\nK. VERSION FURNITURE');
ok('K1 — the version is 1.7.5 everywhere', () => {
  assertMatch(constants, /version: '1\.9\.19',/, 'constants never spoke 1.7.5');
  const pkg = JSON.parse(src('package.json'));
  assert.equal(pkg.version, '1.9.19', 'package.json never spoke 1.7.5');
  assertMatch(src('README.md'), /\*\*v1\.9\.19\*\*/, 'the README header never moved');
  // 1.8.9 — THE README IS THE PUBLIC FACE: the version roll retired with it
  // (the first public release speaks features, not history; the changelog
  // keeps the story). The paragraph's old seat is gone by law.
  assert.ok(!/^1\.\d+\.\d+ — /m.test(src('README.md')), 'the version roll retired with the public README');
  assertMatch(src('CHANGELOG.md'), /^## 1\.9\.19 — The Ends Trade Places/, 'the changelog head never landed');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(src('website/index.html'), /THE PATIENT WHEEL<\/span>/, 'the website hero never moved');
});

console.log(`\n${passed} passed, ${failed} failed — ${failed ? 'FIX ABOVE' : 'ALL GREEN'}`);
process.exit(failed ? 1 : 0);
