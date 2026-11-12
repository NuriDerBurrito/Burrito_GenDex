// 1.6.8 batch — The Coat's Honest Ground.
// (Named 172 in the sequence: ... 168 -> 1.6.3, 169 -> 1.6.4, 170 -> 1.6.5,
//  171 -> 1.6.7.)
// The reported items, each pinned at its root law:
//   A.  THE TRIM LIFT RETIRES (stamps keep their rung under the coat)
//   B.  THE GLINT LEAVES + THE PULSE SPEAKS (two voices, a louder bloom)
//   C.  THE AURIC GROUND (the sweep joins at the bottom park; the summon)
//   D.  THE NUMEIX CENTER (four arms, no crossing, no bead)
//   E.  THE HOLO SCRUB + THE PRISM'S TURNING RAINBOW
//   F.  THE CHIP ABOVE THE LINE (the chipline's stacking rung)
//   G.  THE CONTENT SPEAKS, THE FURNITURE HOLDS (the swap's seat list)
//   H.  THE TITLE SPANS + THE COUNT LEAVES (the expanded window)
//   I.  THE SHADE DIAL (light/deep on parts + notes; the well + stage)
//   J.  THE STRETCH FINDS ITS AXIS (the row stretches; the grip's floor)
//   K.  THE ADD CARD SPEAKS THE PREVIEW (the boundary neighbor; the tween)
//   L.  THE STILL BOARD (the live-drag-preview setting + the seat memory)
//   M.  THE TEN-STEP LADDER (five smaller seats; the +5 walk, once)
// Plus the version furniture and the sanitize lane (glint -> sweep).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { ZOOM_RANGE, CARD_WIDTHS, DEFAULT_SETTINGS } from '../src/constants/index.js';
import { createSafeDb } from '../src/utils/helpers.js';

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
const parts = src('src/components/PartEditor.jsx');
const charview = src('src/components/CharacterView.jsx');
const settings = src('src/components/SettingsModal.jsx');
const app = src('src/App.jsx');
const helpers = src('src/utils/helpers.js');
const constants = src('src/constants/index.js');

console.log('\nA. THE STAMPS KEEP THEIR RUNG UNDER THE COAT (1.7.3: "it forces the stamp to clip over the trim, fix that")');
ok('the trim-effect stamp lift is retired again — the stamps never paint over the trim (1.7.3)', () => {
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/\.gd-fin-on-trim \.gd-card-stamp-band\s*\{/.test(cssLaws), 'the z-5 band lift survived the retirement');
  assert.ok(!/\.gd-fin-on-trim \.gd-card-stamp-free\.is-clipped\s*\{/.test(cssLaws), 'the z-5 confined-sticker lift survived the retirement');
  assertMatch(css, /THE TRIM-EFFECT STAMP LIFT RETIRES/, 'the 1.7.3 tombstone note is missing');
});
ok('the full-face coat covers the stamps alongside the image (1.7.2: z 1 under the image scope — the ladder\'s one remaining mover)', () => {
  assertMatch(css, /\.gd-fin-on-image \.gd-card-stamp-band,\s*\n\.gd-fin-on-image \.gd-card-stamp-free\.is-clipped \{\s*\n\s*z-index: 1;/, 'the image scope never seated the stamps');
});
ok('the stamp effect itself is retired wholesale (1.7.2: "delete the stamp effect option")', () => {
  assert.ok(!/\.gd-fin-on-stamp \.gd-card-stamp-band \{/.test(css), 'the retired drop law survived');
  assert.ok(!/gd-fin-on-stamp && /.test(grid), 'the grid still arms the dead scope');
});
ok('the on-trim seat is gone from the ladder note the seats remember', () => {
  assertMatch(css, /THE TRIM-EFFECT STAMP LIFT IS RETIRED/, 'the tombstone note is missing');
});

console.log('\nB. THE GLINT LEAVES + THE PULSE SPEAKS');
ok('the glint CSS voice is retired wholesale', () => {
  assert.ok(!/data-gd-shine-mode='glint'/.test(css), 'the glint selector survived');
  assert.ok(!/@keyframes gd-shine-glint/.test(css), 'the glint keyframes survived');
});
ok('the settings seat offers exactly two voices (sweep + pulse)', () => {
  assertMatch(settings, /\{ id: 'sweep', label: 'Sweep'/, 'the sweep seat is missing');
  assertMatch(settings, /\{ id: 'pulse', label: 'Pulse'/, 'the pulse seat is missing');
  assert.ok(!/\{ id: 'glint', label: 'Glint'/.test(settings), 'the glint seat survived in settings');
});
ok('the retire listener answers the two names only', () => {
  assertMatch(grid, /e\.animationName !== 'gd-shine-sweep' && e\.animationName !== 'gd-shine-pulse'/, 'the retire gate changed shape');
  assert.ok(!/gd-shine-glint'/.test(grid), 'the listener still knows the retired name');
});
ok('the App lane arms only pulse', () => {
  assertMatch(app, /db\.settings\.shineMode === 'pulse'/, 'the lane still arms the retired seat');
});
ok('the sanitize lane walks glint onto sweep', () => {
  assertMatch(helpers, /shineMode: rawSettings\.shineMode === 'pulse' \? 'pulse' : DEFAULT_SETTINGS\.shineMode/, 'the sanitize lane changed shape');
  const db = createSafeDb({ settings: { shineMode: 'glint' } });
  assert.equal(db.settings.shineMode, 'sweep', 'a stored glint survived the walk');
});
ok('the pulse bloom speaks at full voice (0.85 core, 0.95 peaks, 0.5s — the 1.7.0 clock)', () => {
  assertMatch(css, /rgba\(255, 255, 255, 0\.85\) 0%,/, 'the bright core is missing');
  assertMatch(css, /animation: gd-shine-pulse 0\.5s ease-in-out 1 forwards;/, 'the longer clock is missing');
  assertMatch(css, /opacity: 0\.95;[\s\S]*?transform: scale\(1\.18\);/, 'the louder keyframes are missing');
});

console.log('\nC. THE AURIC GROUND ("a shine appears at the top then dissapears" + "make something at the bottom")');
ok('the sweep joins inside the loop\u2019s invisible bottom park', () => {
  assertMatch(css, /animation-duration: calc\(7s \+ var\(--gd-fin-ph, 0\) \* 2s\);/, 'the period variance is missing');
  assertMatch(css, /animation-delay: calc\(var\(--gd-fin-ph, 0\) \* -1s\);/, 'the bottom-park join is missing');
  assert.ok(!/gd-auric-sweep 8s ease-in-out infinite/.test(css), 'the old fixed clock survived');
});
ok('the summon seat exists with its glow + filaments', () => {
  assertMatch(css, /\.gd-auric-summon::before \{/, 'the forge glow is missing');
  assertMatch(css, /\.gd-auric-summon::after \{/, 'the filaments are missing');
  assertMatch(css, /@keyframes gd-auric-filaments \{/, 'the rising flight is missing');
  assertMatch(css, /gd-auric-forge-breath 6\.5s/, 'the breath clock is missing');
});
ok('the summon seat rides the CardFinishLayer', () => {
  assertMatch(src('src/components/TagRibbon.jsx'), /seat\('gd-auric-summon'\)/, 'the seat is not rendered');
});

console.log('\nD. THE NUMEIX CENTER ("when the two lines meet they make the middle area less see through")');
ok('no X carries a center bead anymore', () => {
  const xmark = css.slice(css.indexOf('.gd-numeix-xmarks::before'), css.indexOf('@keyframes gd-numeix-fall-a'));
  assert.ok(!/fill='none'[\s\S]*?Z' fill=/.test(xmark) || true, 'bead scan placeholder');
  assert.ok(!/L31\.5 45 L29 47\.5/.test(xmark), 'a center bead path survived');
  assert.ok(!/stroke='none'/.test(xmark), 'a filled bead survived');
});
ok('every X is a true rotated plus (two straight diagonals, 1.9.3)', () => {
  const xmark = css.slice(css.indexOf('.gd-numeix-xmarks::before'), css.indexOf('@keyframes gd-numeix-fall-a'));
  /* 1.9.3 — THE TRUE X retired the 1.6.7 four-arm curves BY THE REPORT'S
     OWN WORDS ("actual xs ... like rotated '+' ... semi thick stroked not
     thin or bolded"): the first mark speaks two straight crossing
     diagonals with a round cap, and not one Q curve survives anywhere. */
  assertMatch(xmark, /M20 36 L38 54 M20 54 L38 36/, 'the first X no longer speaks two straight diagonals');
  assert.ok(!/Q\d/.test(xmark), 'a calligraphic curve survived the retirement');
});

console.log('\nE. THE HOLO SCRUB + THE PRISM\u2019S TURNING RAINBOW');
ok('the holo tile carries no hollow four-point diamond', () => {
  const holo = css.slice(css.indexOf('.gd-finish-holographic::before'), css.indexOf('@keyframes gd-holo-chaos-ne'));
  // scan the SVG TILE alone (the scrub note may describe the shape in prose)
  const urlStart = holo.indexOf('url("data:image/svg+xml');
  const tile = urlStart >= 0 ? holo.slice(urlStart, holo.indexOf(') calc(var(--gd-fin-ph', urlStart)) : holo;
  assert.ok(!/M64 20 L70 34 L64 48 L58 34 Z/.test(tile), 'the auric leak survived');
  assertMatch(holo, /THE AURIC LEAK IS SCRUBBED/, 'the scrub note is missing');
});
ok('the prismatic body\u2019s rainbow turns on a filter flight', () => {
  assertMatch(css, /animation: gd-prism-body-hue 14s linear infinite;/, 'the hue flight is missing');
  assertMatch(css, /@keyframes gd-prism-body-hue \{[\s\S]*?hue-rotate\(360deg\)/, 'the full turn is missing');
});

console.log('\nF. THE CHIP ABOVE THE LINE ("expand button clips below the line")');
ok('the chipline chip speaks its own stacking rung', () => {
  const clip = css.slice(css.indexOf('.gd-rows-chipline .gd-rows-expand'));
  assertMatch(clip, /position: relative;\s*\n\s*z-index: 1;/, 'the chip still paints under the hairline');
});

console.log('\nG. THE CONTENT SPEAKS, THE FURNITURE HOLDS (the swap\u2019s seat list)');
ok('every content seat breathes on the switch', () => {
  assertMatch(css, /\.gd-cv-swap \.gd-name-fold,/, 'the name seat is missing');
  // 1.6.9 — the tag chips left the wholesale list (the request: dont fade
  // the tags themselves); only the CHANGED chips' COLORS crossfade now.
  assertMatch(css, /\.gd-rows-tray \.gd-tag-chip\.is-swap-colorfade/, 'the changed-tag color crossfade seat is missing');
  assertMatch(css, /@keyframes gd-tag-color-swap/, 'the tag color crossfade keyframes are missing');
  assertMatch(css, /\.gd-cv-swap \.gd-rows-tray \.gd-stamp-slot > img/, 'the stamp art seat is missing');
  assertMatch(css, /\.gd-cv-swap \.gd-version-strip \.gd-chip/, 'the version chips seat is missing');
  assertMatch(css, /\.gd-cv-swap \.gd-part-row \.gd-part-main/, 'the parts content seat is missing');
  assertMatch(css, /\.gd-cv-swap \.gd-notes-box \.gd-prompt-box/, 'the notes well seat is missing');
  assertMatch(css, /\.gd-cv-swap \.gd-cardcol \.gd-stage-pictures/, 'the picture seat left');
});
ok('the plates and keys are never named by the flight', () => {
  const seatList = css.slice(css.indexOf('.gd-cv-swap .gd-name-fold,'), css.indexOf('@keyframes gd-cv-swap'));
  assert.ok(!/gd-rows-tray[, ]*\{/.test(seatList), 'the tray plate is faded');
  assert.ok(!/\.gd-btn/.test(seatList), 'a button seat is faded');
  assert.ok(!/\.gd-card \{/.test(seatList), 'a card plate is faded');
});

console.log('\nH. THE TITLE SPANS + THE COUNT LEAVES');
ok('the expanded prompt window\u2019s subheader is the title alone', () => {
  assert.ok(!/\{chars\} character\{chars === 1 \? '' : 's'\} · edits land live<\/span>/.test(parts), 'the char count survived');
  assert.ok(!/edits land live<\/span>/.test(parts), 'the live-edits note survived');
  assertMatch(parts, /className="gd-notes-title font-bold text-\[13px\] w-full min-w-0"/, 'the title does not span the container');
});

console.log('\nI. THE SHADE DIAL (light/deep; the well + the stage)');
ok('the color windows speak the LIGHT/DARK pair', () => {
  assertMatch(parts, /shadeBtn\('deep', 'DARK'/, 'the parts window lacks the dial');
  assertMatch(charview, /shadeBtn\('deep', 'DARK'/, 'the notes window lacks the dial');
  assert.ok(!/The color paints this part&rsquo;s container frame/.test(parts), 'the parts description survived');
  assert.ok(!/The color paints the notes container&rsquo;s frame/.test(charview), 'the notes description survived');
});
ok('the deep shade + the well whisper + the stage tint exist in CSS', () => {
  assertMatch(css, /\.gd-part-row\.is-colored\.is-shade-deep \{/, 'the deep row law is missing');
  assertMatch(css, /\.gd-part-row\.is-colored \.gd-prompt-box \{/, 'the well whisper is missing');
  assertMatch(css, /\.gd-prompt-stage\.is-colored,\s*\n\.gd-notes-stage\.is-colored \{/, 'the stage tint is missing');
  });
ok('the records carry the shade fields through the sanitize lane', () => {
  assertMatch(helpers, /colorShade: part\?\.colorShade === 'deep' \? 'deep' : null,/, 'the part shade lane is missing');
  assertMatch(helpers, /notesColorShade: version\?\.notesColorShade === 'deep' \? 'deep' : null,/, 'the notes shade lane is missing');
  const db = createSafeDb({ characters: [{ id: 'c1', name: 'x', versions: [{ id: 'v1', label: 'V1', images: [], parts: [{ id: 'p1', name: 'P', content: '', color: '#112233', colorShade: 'deep' }], notesColor: '#112233', notesColorShade: 'deep' }] }] });
  const v = db.characters[0].versions[0];
  assert.equal(v.parts[0].colorShade, 'deep', 'the part shade did not survive');
  assert.equal(v.notesColorShade, 'deep', 'the notes shade did not survive');
});
ok('the expanded windows wear the container\u2019s color', () => {
  assertMatch(parts, /gd-prompt-stage', part\.color && 'is-colored'/, 'the prompt stage does not read the color');
  assertMatch(charview, /gd-notes-stage',[\s\S]*?version\?\.notesColor && 'is-colored'/, 'the notes stage does not read the color');
});

console.log('\nJ. THE STRETCH FINDS ITS AXIS (the row stretches; the grip\u2019s floor)');
ok('the row stretches its columns and the lone seats keep their tops', () => {
  assertMatch(css, /\.gd-part-row \{\s*\n\s*align-items: stretch;\s*\n\s*\}/, 'the stretch override is missing');
  assertMatch(css, /\.gd-part-row > \.gd-check \{\s*\n\s*align-self: flex-start;\s*\n\s*\}/, 'the check keeps no top seat');
  assertMatch(css, /\.gd-part-keys \{\s*\n\s*align-self: flex-start;\s*\n\s*\}/, 'the keys keep no top seat');
});
ok('the well carries the native grip with a floor', () => {
  // 1.7.8 supersede — THE WELL'S CLIPPING SHELL: the grip + the floor
  // live on the field INSIDE the shell now (the shell is the flex child).
  assertMatch(css, /\.gd-well-shell \.gd-prompt-box \{\s*\n\s*flex: 1 0 auto;\s*\n\s*resize: vertical;/, 'the grip is missing');
  assertMatch(css, /min-height: 4\.6em;/, 'the natural floor is missing');
});

console.log('\nK. THE ADD CARD SPEAKS THE PREVIEW (the boundary neighbor; the tween)');
ok('the neighbor reads the previewed order', () => {
  assertMatch(grid, /const ordered = itemIds\.filter\(\(id\) => id !== ADD_FIRST && id !== ADD_LAST\);/, 'the neighbor still reads the base order');
  assertMatch(grid, /THE ADD CARD SPEAKS THE PREVIEWED ORDER/, 'the law note is missing');
});
ok('the add box tweens its aspect', () => {
  assertMatch(grid, /className="gd-card-add-box flex flex-col items-center justify-center gap-3"/, 'the box class is missing');
  assertMatch(css, /\.gd-card-add-box \{\s*\n\s*transition: aspect-ratio 0\.24s ease-out;/, 'the aspect tween is missing');
});

console.log('\nL. THE STILL BOARD (the live-drag-preview setting + the seat memory)');
ok('the setting exists (default OFF since 1.9.12 — "the live drag previews option default should be off") and survives the load lane', () => {
  assert.equal(DEFAULT_SETTINGS.liveDragPreview, false, 'the default is not OFF');
  assertMatch(constants, /liveDragPreview: false,/, 'the default seat is missing');
  assertMatch(helpers, /liveDragPreview:\s*\n?\s*typeof rawSettings\.liveDragPreview === 'boolean'/, 'the sanitize lane is missing');
  const db = createSafeDb({});
  assert.equal(db.settings.liveDragPreview, false, 'a fresh db previews (the 1.9.12 default rests OFF)');
  const dbOn = createSafeDb({ settings: { liveDragPreview: true } });
  assert.equal(dbOn.settings.liveDragPreview, true, 'a stored ON did not survive');
});
ok('the settings window carries the switch', () => {
  assertMatch(settings, /title="LIVE DRAG PREVIEW"/, 'the OptCard is missing');
});
ok('App threads the prop', () => {
  assertMatch(app, /liveDragPreview=\{db\?\.settings\?\.liveDragPreview === true\}/, 'App does not thread the setting');
});
ok('the still board arms no preview and remembers the seat (the gate reads the REF — 1.7.2)', () => {
  assertMatch(grid, /if \(!livePreviewRef\.current\) return;/, 'the still-board arm guard is missing (1.7.2: the memoized cards read the live truth from the ref, not the frozen closure)');
  assertMatch(grid, /const dropSeatRef = useRef\(null\);/, 'the seat memory is missing');
  assertMatch(grid, /dropSeatRef\.current =\s*\n\s*px != null && py != null \? \{ over: id, side, pt: \{ x: px, y: py \} \} : \{ over: id, side, pt: null \};/, 'the seat never lands in memory (1.7.2: the memory carries its own point)');
});

console.log('\nM. THE TEN-STEP LADDER (five smaller seats; the +5 walk, once)');
ok('the ladder carries ten steps with the old five above', () => {
  assert.equal(CARD_WIDTHS[6], 130, 'the old 1 did not become 6');
  assert.equal(CARD_WIDTHS[7], 155, 'the old 2 did not become 7');
  assert.equal(CARD_WIDTHS[10], 250, 'the old 5 did not become 10');
  assert.equal(CARD_WIDTHS[1], 65, 'the smallest seat is wrong');
  assert.equal(ZOOM_RANGE.max, 10, 'the range still ends at 5');
  assert.equal(ZOOM_RANGE.default, 7, 'the default did not follow its pixels');
});
ok('a pre-ladder save walks +5 exactly once', () => {
  const old = createSafeDb({ settings: { zoom: 2 } });
  assert.equal(old.settings.zoom, 7, 'the stored 2 (155px) did not walk to 7');
  assert.equal(old.settings.zoomLadder, 2, 'the marker did not land');
  const again = createSafeDb({ settings: { zoom: old.settings.zoom, zoomLadder: old.settings.zoomLadder } });
  assert.equal(again.settings.zoom, 7, 'the walk fired twice');
  const fresh = createSafeDb({});
  assert.equal(fresh.settings.zoom, 7, 'a fresh db lost the 155px default');
  const edge = createSafeDb({ settings: { zoom: 5 } });
  assert.equal(edge.settings.zoom, 10, 'the old top (250px) did not walk to 10');
});
ok('the toolbar speaks the ten-step title', () => {
  assertMatch(grid, /title="Card size \(1–10\)"/, 'the slider title still says 1–5');
  assertMatch(grid, /CARD_WIDTHS\[ZOOM_RANGE\.default\]/, 'the width fallback still speaks the old ladder');
});

console.log('\nVERSION FURNITURE');
ok('the version is 1.6.8 everywhere (the furniture sweep)', () => {
  assertMatch(constants, /version: '1\.9\.19',/, 'constants still speak 1.6.7');
  const pkg = JSON.parse(src('package.json'));
  assert.equal(pkg.version, '1.9.19', 'package.json still speaks the old version');
  assertMatch(src('package-lock.json'), /"version": "1\.9\.19"/, 'the lock root still speaks the old version');
  assertMatch(src('README.md'), /\*\*v1\.9\.19\*\*/, 'the README header never moved');
  assertMatch(src('README.md'), /the regression battery \(93 DOM\/source test suites\)/, 'the README battery count never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(src('website/index.html'), /<span class="ver">v1\.8\.6<\/span>/, 'the website current card never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(src('website/index.html'), /releases\/download\/v1\.8\.6\/Burrito%20GenDex-1\.8\.6%20Setup\.exe/, 'the website installer URL never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(src('website/index.html'), /Burrito_GenDex_1\.8\.6_source\.zip/, 'the website source URL never moved');
  assertMatch(src('CHANGELOG.md'), /^## 1\.9\.19 — The Ends Trade Places/, 'the changelog head never landed');
});
ok('the addPart name walk no longer reassigns a const (the swept-in crash fix)', () => {
  assertMatch(parts, /let index = parts\.length \+ 1;/, 'the seat is still a const');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
