// 1.8.2 batch — The Still Wall.
// (Named 183 in the sequence: 182 pins the 1.8.1 laws; this suite pins
//  the 1.8.2 laws at their roots.)
// The reported items, each pinned at its root law:
//   A.  THE BORDER'S OWN ARROW ("when i hover over the scrollbar its the
//       correct cursor , but there is a sliver on the right of the
//       scrollbar where i can switch to the select cursor (I-beam)
//       instead , fix that")
//   B.  THE ROSTER RISES TO THE CARD'S OWN PADDING ("there is a gab
//       where u removed the reassign keys, an empty space , fix that")
//   C.  HELP TEXT EARNS ITS COMBO ("add a shortcut to the help text ,
//       also its tooltip should include the shortcut instead of the
//       'explanatory paragraph' text")
//   D.  THE PULL IS A SNAPSHOT ("when dragging cards around the finishes
//       over it keep playing , fix that so the preview one is pausedas
//       if its just a snapshot")
//   E.  REDUCED MOTION LANDS IN ONE FRAME ("in reduced ui motion, the
//       feedback of switching sections in settings is very choppy ,
//       while the feedback of things like the card switching and
//       tags/stamps is buggy ... its making the two cards tags appear
//       above each other then removes one later , fix that")
//   F.  THE PULL OUTLIVES THE PREVIEW ("during live drag preview option
//       when its turned off i want the card preview that is faded and
//       follows the cursor to still appear , fix that")
//   G.  THE SNAP SEAT + THE GIVE-BACK ("when closing the tags/stamps
//       area by scrolling downwards , it bugs when im moving to the
//       bottom of the prompts/note, where the tags/prompts seem to snap
//       up then snap back down mid closing motion of the tags/stamp ,
//       fix that")
//   H.  A WIDE CARD NEVER INDENTS PAST AN OPEN LANE ("the wide card
//       would leave an empty space on the right of the two normal
//       cards , then leave one more space on its left, even tho its not
//       necessary to leave the second empty space , fix that issue")
// Plus the version furniture (1.8.2 everywhere).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { layoutMasonry } from '../src/utils/helpers.js';
import { DEFAULT_SHORTCUTS, SHORTCUT_ACTIONS } from '../src/constants/index.js';

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
const settings = src('src/components/SettingsModal.jsx');
const titlebar = src('src/components/Titlebar.jsx');
const app = src('src/App.jsx');
const cv = src('src/components/CharacterView.jsx');
const helpersSrc = src('src/utils/helpers.js');
const readme = src('README.md');
const changelog = src('CHANGELOG.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const pkg = src('package.json');
const constants = src('src/constants/index.js');
const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');

console.log("\nA. THE BORDER'S OWN ARROW (\"a sliver on the right of the scrollbar\")");
ok('A1 — the law note speaks its name', () => {
  assertMatch(css, /1\.8\.2 — THE BORDER'S OWN ARROW/, 'the border-arrow note is missing');
});
ok('A2 — the shell seats the strip with the chrome arrow (::after hit-strip)', () => {
  const m = /\.gd-well-shell::after \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the shell ::after strip rule never spoke');
  assertMatch(m, /position: absolute;/, 'the strip is not absolutely seated');
  assertMatch(m, /right: 0;/, 'the strip lost the right edge');
  assertMatch(m, /width: 2px;/, 'the strip lost its width');
  assertMatch(m, /height: 100%;/, 'the strip lost its reach');
  assertMatch(m, /pointer-events: auto;/, 'the strip is not hit-testable');
  assertMatch(m, /cursor: default;/, 'the strip never spoke the chrome arrow');
});
ok('A3 — the field keeps its UA cursor + constant lane (the 1.8.1 word stands)', () => {
  const at = cssLaws.indexOf('.gd-well-shell .gd-prompt-box {');
  const rule = cssLaws.slice(at, cssLaws.indexOf('}', at));
  assert.ok(!rule.includes('cursor:'), 'a cursor declaration returned to the field — the I-beam cannot speak');
  assertMatch(rule, /scrollbar-gutter: stable;/, 'the stable gutter lost its word');
});
ok('A4 — the chrome arrows group + the diagonal keep their seats', () => {
  const m = /\.gd-prompt-box::-webkit-scrollbar,\s*\.gd-prompt-box::-webkit-scrollbar-thumb,\s*\.gd-prompt-box::-webkit-scrollbar-track,\s*\.gd-prompt-box::-webkit-scrollbar-corner,\s*\.gd-prompt-box::-webkit-resizer \{\s*cursor: default;\s*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the 1.8.1 chrome arrows group rule lost its word');
  const grip = /\.gd-prompt-box::-webkit-resizer \{[^}]*repeating-linear-gradient\([^}]*\}/.exec(cssLaws)?.[0] || '';
  assertMatch(grip, /cursor: nwse-resize;/, 'the grip diagonal lost its word');
});

console.log('\nB. THE ROSTER RISES TO THE CARD\'S OWN PADDING ("an empty space, fix that")');
ok('B1 — the law note speaks its name', () => {
  assertMatch(css, /1\.8\.2 — THE ROSTER RISES TO THE CARD'S OWN PADDING/, 'the roster note is missing');
});
ok('B2 — the title-era headroom rides off (margin-top 0)', () => {
  const m = /\.gd-scut-grid \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the scut grid rule never spoke');
  assertMatch(m, /margin-top: 0;/, 'the 8px headroom survived — the gap lives on');
});
ok('B3 — the teaching copy owns the breathing below it (the sibling law)', () => {
  const m = /\.gd-opt-desc \+ \.gd-scut-grid \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the sibling rule never spoke');
  assertMatch(m, /margin-top: 8px;/, 'the paragraph lost its breathing');
});

console.log('\nC. HELP TEXT EARNS ITS COMBO ("include the shortcut instead of the paragraph")');
ok('C1 — the default map carries Alt+H (the bar-toggle family\'s row)', () => {
  assert.equal(DEFAULT_SHORTCUTS.helpText, 'Alt+H', 'the default combo never spoke');
  assertMatch(constants, /helpText: 'Alt\+H',/, 'the constants seat never spoke');
});
ok('C2 — the roster carries the row (reassignable like every neighbor)', () => {
  const row = SHORTCUT_ACTIONS.find((a) => a.id === 'helpText');
  assert.ok(row, 'the roster row never arrived');
  assert.equal(row.label, 'Help text', 'the row label never spoke');
  assertMatch(constants, /\{ id: 'helpText', label: 'Help text', hint: 'Teaching paragraphs on \/ off' \},/, 'the roster entry never spoke in source');
});
ok('C3 — the keydown map answers the action through the ref family', () => {
  assertMatch(app, /case 'helpText':\s*\n\s*toggleHelpRef\.current\?\.\(\);\s*\n\s*return;/, 'the keydown case never spoke');
  assertMatch(app, /const toggleHelpRef = useRef\(null\);/, 'the ref never declared its seat');
  assertMatch(app, /toggleHelpRef\.current = seatToggleHelp;/, 'the ref never wired the stable handler');
});
ok('C4 — the tooltip speaks the sibling form (combo in parens, paragraph gone)', () => {
  assertMatch(titlebar, /title=\{helpMode \? `Help text on \(\$\{combo\('helpText'\)\}\)` : `Help text off \(\$\{combo\('helpText'\)\}\)`\}/, 'the sibling-form tooltip never spoke');
  const titlebarCode = titlebar.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.ok(!titlebarCode.includes('the explanatory paragraphs'), 'the explanatory paragraph survived in the toolbar key');
});
ok('C5 — the roster row carries the CircleHelp glyph (the toolbar key\'s own mark)', () => {
  assertMatch(settings, /helpText: CircleHelp,/, 'the SCUT_ICONS entry never spoke');
});

console.log('\nD. THE PULL IS A SNAPSHOT ("paused as if its just a snapshot")');
ok('D1 — the law note speaks its name', () => {
  assertMatch(css, /1\.8\.2 — THE PULL IS A SNAPSHOT/, 'the snapshot note is missing');
});
ok('D2 — every animation in the ghost subtree freezes (with pseudos)', () => {
  const m = /\.gd-drag-ghost \*,\s*\.gd-drag-ghost \*::before,\s*\.gd-drag-ghost \*::after \{\s*animation-play-state: paused !important;\s*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the freeze rule never spoke');
});
ok('D3 — the fade + the wrapper keep their own voice (transition, not animation)', () => {
  const ghostCss = cssLaws.match(/\.gd-drag-ghost \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(ghostCss.includes('opacity: 0.55'), 'the 1.8.1 fade lost its number');
  assert.ok(ghostCss.includes('transition: opacity 0.12s ease'), 'the soft arrival lost its word');
});

console.log('\nE. REDUCED MOTION LANDS IN ONE FRAME ("very choppy / above each other then removes one later")');
ok('E1 — the settings swap reads the switch (duration 0 under reduced)', () => {
  assertMatch(settings, /1\.8\.2 — THE SWAP LANDS IN ONE FRAME UNDER REDUCED MOTION/, 'the one-frame note is missing');
  assertMatch(settings, /transition=\{settings\.reduceMotion \? \{ duration: 0 \} : \{ duration: 0\.14, ease: 'easeOut' \}\}/, 'the branch never spoke');
});
ok('E2 — the tags ghost rests at its own silence (base opacity 0)', () => {
  assertMatch(css, /1\.8\.2 — THE GHOST'S OWN RESTING SILENCE/, 'the resting-silence note is missing');
  const at = cssLaws.indexOf('.gd-tag-ghost-row {');
  const rule = cssLaws.slice(at, cssLaws.indexOf('\n}', at));
  assertMatch(rule, /opacity: 0;/, 'the base silence never spoke');
  assertMatch(rule, /animation: gd-tag-ghost-out 0\.07s ease-out forwards;/, 'the farewell flight lost its word');
});

console.log('\nF. THE PULL OUTLIVES THE PREVIEW ("i want the card preview that is faded and follows the cursor to still appear")');
ok('F1 — the 1.6.9 retirement is retired (the law tells the new story)', () => {
  assertMatch(grid, /1\.6\.9 — THE GHOST RETIRES WITH THE PREVIEW[\s\S]*?RETIRED by 1\.8\.2/, 'the retired-retirement note is missing');
});
ok('F2 — the ghost gate no longer reads the preview switch', () => {
  assertMatch(grid, /if \(layW > 4 && layH > 4 && typeof card\.cloneNode === 'function'\) \{/, 'the creation gate still carries the livePreviewRef term');
  const gateArea = grid.slice(grid.indexOf('RETIRED by 1.8.2'), grid.indexOf('RETIRED by 1.8.2') + 1200);
  assert.ok(!gateArea.includes('livePreviewRef.current &&'), 'the ghost gate still consults the switch');
});
ok('F3 — the dynamic switching keeps its own gates (the switch keeps its meaning)', () => {
  assertMatch(grid, /if \(!livePreviewRef\.current\) return;/, 'the overCard gate lost its word');
  assertMatch(grid, /const live = livePreviewRef\.current;/, 'the drop\'s live seat lost its word');
});

console.log('\nG. THE SNAP SEAT + THE GIVE-BACK ("snap up then snap back down mid closing motion")');
ok('G1 — the give-back meets the sticky header (the guard rides off)', () => {
  // 1.8.4 — the give-back's whole lineage is retired: THE FOLD PAYS THE
  // SEAT, NOT THE SCROLL (the 1.8.2 tombstone that named this law here was
  // replaced by the cover's own note — the debt is paid into a borrowed
  // flow seat below the sticky header, never out of the scroll offset).
  // 1.8.5 — the cover's one-frame economy became THE PAYER (one
  // formula, both directions — the seat mirrors the header's live loss
  // frame by frame), and the fold's note became THE ROAD CHOICE (the
  // seat road past the hem, the flow road from the top, the
  // between-band standing down — the cover law kept, spoken per frame).
  // 1.8.6 — THE SILENT ASCENT: the payer retired WITH the seat it
  // wrote, and the road choice speaks its one road now.
  assertMatch(cv, /THE PAYER \(one formula, both directions[\s\S]*?RETIRED IN 1\.8\.6/, 'the payer retirement note is missing');
  assertMatch(cv, /THE ROAD CHOICE, AND IN 1\.8\.6 THERE IS ONLY ONE ROAD/, 'the one-road note is missing');
  assert.ok(!cv.includes('body.top <= view.top + 1'), 'the old flow-era guard survived');
  // 1.8.3 — the fold and its give-back landed in the SAME BREATH (the
  // listener painted the fold on the DOM itself and read what ACTUALLY
  // left from the scroller's own scrollHeight — the body-rect guess rode
  // off: it under-paid by the tray's own 13px and paid a breath ahead of
  // the height it bought).
  // 1.8.4 — the give became a DEBT (the seat held exactly what the fold
  // removed, so the flow's total never changed).
  // 1.8.5 — the debt is DISCOVERED LIVE: the payer's formula holds the
  // seat at whatever the header has LOST at each observed frame, and the
  // road choice estimates the give up front (dEst — the tray's own height
  // against the cached folded rest) to pick the road before any paint.
  assertMatch(cv, /const dEst = Math\.max\(0, zone\.offsetHeight - \(foldRestHRef\.current \|\| 26\)\);/, 'the road choice never estimated the give');
  // 1.8.5 — the debt is DISCOVERED LIVE now: the payer's formula writes
  // the seat per observed frame (whatever the header has lost at this
  // breath), and the road choice only estimates the give up front. The
  // 1.8.3/1.8.4 commit-time arithmetic pins moved to the formula.
  // 1.8.6 — THE SILENT ASCENT: the formula left with the payer; the
  // folded rest is measured by the settle effect where the retire clock sat.
  assertMatch(cv, /if \(zone && zone\.offsetHeight > 0\) foldRestHRef\.current = zone\.offsetHeight;/, 'the folded rest never took its honest measure');
  assertMatch(cv, /1\.8\.6 — THE FOLDED REST, MEASURED WHERE THE PAYER LEFT IT/, 'the settle-measure note never spoke');
});
ok('G2 — the tray snap retires with the fight it fled (the tombstone keeps its seat)', () => {
  // 1.8.5 — THE SNAP SEAT RETIRES: the payer holds the flow's total
  // still THROUGH every flight, so there is no layout fight to still
  // and no snap to land — the tray tweens on every road (the 0.39.0
  // breath, restored) and the is-snap class never arms again; its CSS
  // block stays as the tombstone.
  assert.ok(!cv.includes("foldSnap && 'is-snap'"), 'the snap class survived the payer law');
  assertMatch(css, /1\.8\.2 — THE SNAP SEAT COVERS THE WHOLE TRAY — RETIRED IN 1\.8\.5/, 'the tray-snap tombstone never spoke');
  const m = /\.gd-rows-tray\.is-snap,\s*\.gd-rows-tray\.is-snap \.gd-rows-chipline,\s*\.gd-rows-tray\.is-snap \.gd-rows-chipline::before \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assert.ok(m.length > 0, 'the tray snap rule never spoke');
  assertMatch(m, /transition: none !important;/, 'the snap never stills the tray');
});

console.log('\nH. A WIDE CARD NEVER INDENTS PAST AN OPEN LANE ("even tho its not necessary to leave the second empty space")');
ok('H1 — the law note speaks its name', () => {
  assertMatch(helpersSrc, /1\.8\.2 — A WIDE CARD NEVER INDENTS PAST AN OPEN LANE/, 'the lane note is missing');
});
ok('H2 — the strand guard is geometric (the balance branch rides off; 1.9.15 retrued the flank test)', () => {
  assertMatch(helpersSrc, /let strandsOpenLane = false;/, 'the strand guard never spoke');
  // 1.9.15 — THE COVERAGE DEMAND CAPS AT ONE ROW: the 1.8.2 flank test
  // demanded the lane clear the wide card's FULL floor (top + h), which a
  // doubled card can never meet against singles — the left tower and the
  // reported 1-card gap. The demand caps at min(h, ROW_MIN) now: the
  // indent (a lane inside the card's first row) stays banned byte-for-
  // byte, the row-wrap speaks. See the B-block pins in the 1915 suite
  // for the functional pins of the retrue.
  assertMatch(helpersSrc, /if \(colHeights\[j\] < top \+ Math\.min\(h, ROW_MIN\)\) \{/, 'the flank test never spoke');
  const fn = helpersSrc.slice(helpersSrc.indexOf('export function layoutMasonry'), helpersSrc.indexOf('export function layoutMasonry') + 4000);
  assert.ok(!fn.includes('bestSpread'), 'the 1.2.2 balance branch survived inside the packer');
});
ok('H3 — the reported wall: two normals + the wide, leftmost seat (functional)', () => {
  // two normals of different heights (aspect-locked art), then the wide:
  const laid = layoutMasonry([380, 300, 140], 3, 185, 20, [1, 1, 2]);
  const wide = laid.positions[2];
  assert.equal(wide.span, 2, 'the wide card lost its span');
  assert.equal(wide.x, 0, 'the wide card indented — an open lane faces its left flank');
  assert.equal(wide.y, 400, 'the wide card lost its leftmost seat\'s floor (380+gap)');
});
ok('H4 — equal normals keep the leftmost seat too', () => {
  const laid = layoutMasonry([300, 300, 140], 3, 185, 20, [1, 1, 2]);
  assert.equal(laid.positions[2].x, 0, 'the equal-top tie indented the wide card');
});
ok('H5 — a flank-covered indent still speaks (the tall stack faces the wide card)', () => {
  // the skipped lane is stacked PAST the wide card's floor: indenting
  // strands nothing — the wall stays short, exactly as the masonry owes.
  const laid = layoutMasonry([1000, 10, 10, 150], 3, 185, 20, [1, 1, 1, 2]);
  const wide = laid.positions[3];
  assert.equal(wide.span, 2, 'the wide card lost its span');
  assert.equal(wide.x, 205, 'the flank-covered rightward seat lost its word');
  assert.equal(wide.y, 30, 'the shallower rightward seat lost its depth');
});
ok('H6 — the single-span law keeps its word (no spans, the old packing)', () => {
  const laid = layoutMasonry([100, 50, 70], 3, 185, 20, null);
  assert.deepEqual(
    laid.positions.map((p) => [p.x, p.y, p.span]),
    [
      [0, 0, 1],
      [205, 0, 1],
      [410, 0, 1],
    ],
    'the single-span packing drifted'
  );
});
ok('H7 — the registered holes keep filling behind a wide card', () => {
  const laid = layoutMasonry([400, 100, 150, 80], 3, 185, 20, [1, 1, 2, 1]);
  const fourth = laid.positions[3];
  assert.equal(fourth.x, 410, 'the hole-fill lost its lane');
  assert.equal(fourth.y, 0, 'the hole-fill lost its seat');
});

console.log('\nI. THE VERSION FURNITURE (1.8.2 everywhere)');
ok('I1 — the version is 1.8.2 everywhere', () => {
  assert.equal(JSON.parse(pkg).version, '1.9.19', 'package.json');
  assertMatch(constants, /version: '1\.9\.19',/, 'constants');
  assertMatch(readme, /\*\*v1\.9\.19\*\*/, 'README');
  // 1.8.9 — THE README IS THE PUBLIC FACE: the version roll retired with it
  // (the first public release speaks features, not history; the changelog
  // keeps the story). The paragraph's old seat is gone by law.
  assert.ok(!/^1\.\d+\.\d+ — /m.test(readme), 'the version roll retired with the public README');
  assertMatch(readme, /the regression battery \(93 DOM\/source test suites\)/, 'the README battery count never moved');
  assertMatch(changelog, /^## 1\.9\.19 — The Ends Trade Places/, 'the changelog head never arrived');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /<span class="ver">v1\.8\.6<\/span>/, 'the website card never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /THE PATIENT WHEEL<\/span>/, 'the website hero tagline never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /releases\/tag\/v1\.8\.6"/, 'the release URL never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /Burrito_GenDex_1\.8\.6_source\.zip/, 'the source URL never moved');
});
ok('I2 — the 1.8.1 entry keeps its own seat (the sweep disease cured)', () => {
  assertMatch(changelog, /^## 1\.8\.1 — The Soft Chrome/m, 'the 1.8.1 entry lost its seat');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /releases\/tag\/v1\.8\.1"/, 'the 1.8.1 row\'s link lost its release');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
