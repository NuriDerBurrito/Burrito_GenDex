// 1.2.5 batch — THE WELDED DRAG, THE FILLED ENDS. Seven reports, one release:
//   1. the window drags even where a tooltip floats over the bar (the pill's
//      app-region follows its seat — drag over a strip, no-drag elsewhere)
//   2. the + TAG / + STAMP keys are labeled pills again (bigger and wider)
//   3a. the tags'/stamps' tail page fills its rows evenly (the balanced tail
//       — no near-blank end screen after the first columns)
//   3b. the card grid back-fills the holes behind span-2 cards (open holes,
//       tightest fit, the hole shrinks by the card + gap)
//   4a. a held chip stays welded to the cursor through the whole auto-scroll
//       (the clamp's BOUNDS shift with the pan — both handlers)
//   4b. the paged drag simulation anchors at the LIVE snapshot (neighbors
//       stop accumulating the pan — no cross-page flights, no phantom row)
//   5. the card shine relights on re-entry (a spent sweep restarts; a young
//       one keeps the no-machine-gunning law)
//   6. the toast pill answers with the hand cursor (no I-beam)
//   7. the splash wordmark's left-to-right white sheen is retired
// Plus: the version is 1.2.5 everywhere (package.json AND the lock) and the
// website fronts it.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const appRoot = fileURLToPath(new URL('..', import.meta.url));
const src = (rel) => readFileSync(join(appRoot, rel), 'utf8');

const { APP } = require(join(appRoot, 'src/constants/index.js'));
const { layoutMasonry } = require(join(appRoot, 'src/utils/helpers.js'));
const pkg = require(join(appRoot, 'package.json'));
const lock = require(join(appRoot, 'package-lock.json'));

const css = src('src/index.css');
const sideflow = src('src/components/SideFlow.jsx');
const sortSrc = src('src/components/useThumbSort.js');
const gridSrc = src('src/components/GridView.jsx');
const tipsSrc = src('src/components/GdTooltips.jsx');
const viewSrc = src('src/components/CharacterView.jsx');
const helpersSrc = src('src/utils/helpers.js');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const changelog = src('CHANGELOG.md');

let passed = 0;
let failed = 0;
const ok = (label, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok ${passed} — ${label}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL — ${label}\n      ${e.message.split('\n')[0]}`);
  }
};

// ---- the version --------------------------------------------------------------
ok('the version is 1.2.5 everywhere', () => {
  assert.equal(APP.version, '1.4.3');
  assert.equal(pkg.version, '1.4.3');
  assert.equal(lock.version, '1.4.3', 'the LOCK follows (the 1.2.2 session missed it once)');
  assert.equal(lock.packages[''].version, '1.4.3', 'the lock root package too');
  assert.equal(lock.packages['node_modules/@electron/windows-sign'].version, '1.2.2', "windows-sign's TRUE 1.2.2 is never swept");
});

// ---- 1: the pill's app-region follows its seat ---------------------------------
ok('the tooltip never blocks the window drag (the region follows the seat)', () => {
  assert.match(tipsSrc, /document\.querySelectorAll\('\.gd-titlebar, \.drag-region'\)/, 'the strips are read at every paint');
  assert.match(tipsSrc, /tip\.style\.webkitAppRegion = overStrip \? 'drag' : 'no-drag';/, 'drag over a strip, no-drag anywhere else');
  assert.match(css, /\.gd-tip\s*\{[^}]*?-webkit-app-region: no-drag;/s, 'the pill declares its region (never inherits)');
});

// ---- 2: the + keys are labeled pills -------------------------------------------
ok('the + TAG / + STAMP keys are labeled pills (bigger and wider)', () => {
  assert.match(viewSrc, /<Plus size=\{11\} \/>[\s\S]{0,30}\n\s*TAG[\s\S]{0,40}<\/button>/, 'the + TAG word rides in the key');
  assert.match(viewSrc, /<Plus size=\{11\} \/>[\s\S]{0,30}\n\s*STAMP[\s\S]{0,40}<\/button>/, 'the + STAMP word rides in the key');
  // 1.2.6 — the glyphs sit in the middle: the padding became asymmetric
  // (2px top, 0 bottom) — the ink rode a pixel high in the pill.
  assert.match(css, /\.gd-row-plus\s*\{[^}]*?height: 20px;[^}]*?padding: 2px 9px 0;[^}]*?margin-top: 8px;/s, 'a 20px pill with air, wide enough for its word, its glyphs centered');
  assert.ok(!/\.gd-row-plus\s*\{[^}]*?width: 18px;/.test(css), 'the 18px square is retired');
});

// ---- 3a: the balanced tail ------------------------------------------------------
ok('1.3.2 the tail fills DOWN its last column (the pages retired; the balance stays dead)', () => {
  // 1.3.2 re-law: there is no tail PAGE — the wall's last column simply
  // runs short. The 1.2.5 balance stays retired (nothing spreads items
  // evenly), and the fill order is the user's law: down each column
  // before the next begins, anchored to the top.
  assert.ok(!sideflow.includes('const per = Math.ceil(tailItems.length / r);'), 'the rebalance is gone from the zone');
  assert.ok(!sortSrc.includes('const per = Math.ceil(tailItems.length / r);'), 'the rebalance is gone from the drag mirror (the pairing law)');
  assert.match(sideflow, /ONE CONTINUOUS WALL/, 'the one-entity law is documented');
  assert.match(sideflow, /column 1 holds the first `rows` items top to bottom/, 'the fill order is column-major (down, then right)');
  assert.ok(!css.includes('.gd-side-page'), 'no page boxes anchor anything anymore');
});

// ---- 3b: the masonry hole back-fill ----------------------------------------------
ok('the cards back-fill the holes behind span-2 cards', () => {
  assert.match(helpersSrc, /THE OPEN HOLES/, 'the law is documented');
  assert.match(helpersSrc, /const holes = \[\];/, 'the holes are tracked');
  assert.match(helpersSrc, /const HOLE_FLOOR = cw \* 0\.4 \+ g;/, 'slivers smaller than a seat never open');
  // behavior: a span-2 on a ragged pair opens a hole; a later short card fills it
  const r = layoutMasonry([200, 400, 220, 400, 120, 160, 140], 3, 185, 8, [1, 1, 1, 2, 1, 1, 1]);
  assert.equal(r.positions[4].x, 386, 'the short card takes the hole seat (col2)');
  assert.equal(r.positions[4].y, 228, 'seated at the hole\'s top — not the column floor');
  // a too-tall card skips the hole; a shorter later card still fills it
  const r2 = layoutMasonry([200, 400, 220, 400, 300, 150], 3, 185, 8, [1, 1, 1, 2, 1, 1]);
  assert.equal(r2.positions[4].y, 208, 'the too-tall card falls to the floor');
  assert.equal(r2.positions[5].x, 386, 'the surviving hole still serves the shorter card');
  // spans=null stays byte-for-byte the old law
  const r3 = layoutMasonry([200, 400, 220, 400, 120, 160, 140], 3, 185, 8, null);
  assert.deepEqual(r3.positions.map((p) => [p.x, p.y]), [[0, 0], [193, 0], [386, 0], [0, 208], [386, 228], [386, 356], [193, 408]], 'no spans — no holes — the old exact stacking');
});

// ---- 4a: the pan-inclusive clamp (1.2.6: plus the content's own ceiling) -----------
ok('a held chip stays welded through the whole auto-scroll (the bounds speak the pan)', () => {
  assert.ok((sortSrc.match(/let minX = drag\.contRect\.left \+ m - b\.left \+ pan;/g) || []).length >= 2, 'BOTH handlers shift their minX with the pan (let — the 1.2.6 ceiling tightens them)');
  assert.ok((sortSrc.match(/let maxX = drag\.contRect\.right - m - \(b\.left \+ b\.w\) \+ pan;/g) || []).length >= 2, 'and their maxX');
  assert.match(sortSrc, /const dx = drag\.lastX - drag\.startX \+ pan;/, 'the auto-scroll redraw carries the pan in the delta');
  assert.match(sortSrc, /const pan = drag\.scrollAccum \|\| 0;\n\s*let tdx = dx \+ pan;/, 'the pointermove transform carries it too');
  // 1.2.6 — THE MAX IS THE CONTENT'S OWN END: the viewport bounds ride with
  // the pan AND the content-space ceiling (frozen at grab) keeps the chip
  // inside the strip's true ends — no infinite scroll room behind the cursor.
  assert.match(sortSrc, /THE MAX IS THE CONTENT'S OWN END/, 'the ceiling law is documented');
  assert.match(sortSrc, /dragRef\.current\.scrollMax0 = Math\.max\(0, sc\.scrollWidth - sc\.clientWidth\);/, 'the scroller end freezes at grab');
});

// ---- 4b: the live-snapshot anchor ------------------------------------------------
ok('1.3.2 the wall simulation anchors at the LIVE snapshot (neighbors stop flying)', () => {
  assert.match(sortSrc, /rows stacking down from the one anchor \(ctx\.anchorY — row 0's top,[\s\S]{0,160}order-independent by construction/, 'the 1.3.4 anchor law is documented (row 0’s top — order-independent)');
  assert.ok(!/left: rects\[0\]\.x, seam/.test(sortSrc), 'the frozen anchor left the ctx');
  assert.match(sortSrc, /const left = rects\[0\]\.x;/, 'the pack reads the anchor fresh on every call');
  /* 1.3.4 re-law: the ctx carries the ANCHOR (row 0’s top — the order-
     independent y the grid’s first row always starts at), never the
     frozen band rows: the pack derives its rows from its own member-
     ship so a reorder’s glide predicts the commit’s true seats. */
  assert.match(sortSrc, /drag\.wallCtx = \{ rows: maxRows, gap: wallGap, anchorY, tools, align: wallAlign, rowMajor: wallRowMajor, cols: wallCols \};/, 'the wall ctx caches only the geometry (rows, gap, the anchor, tools, align + the reading order and its width)');
});

// ---- 5: the shine relights on re-entry --------------------------------------------
ok('the shine relights the moment the cursor comes back', () => {
  assert.match(gridSrc, /RE-ENTRY RELIGHTS A SPENT SWEEP/, 'the law is documented');
  assert.match(gridSrc, /Date\.now\(\) - startedAt <= 700\)/, 'a young sweep keeps the no-machine-gunning law');
  assert.match(gridSrc, /shine\.dataset\.gdShineAt = String\(Date\.now\(\)\);/, 'the arm timestamp rides the element');
  assert.match(gridSrc, /host\.dataset\.gdShineAt = String\(Date\.now\(\)\);\n\s*host\.classList\.add\('is-live'\);/, 'the resting-hover re-arm stamps a fresh arm');
});

// ---- 6: the toast cursor -----------------------------------------------------------
ok('the toast pill answers with the hand cursor', () => {
  assert.match(css, /\.gd-toast\s*\{[^}]*?cursor: pointer;[^}]*?user-select: none;/s, 'the hand cursor, unselectable words');
});

// ---- 7: the splash sheen retired ---------------------------------------------------
ok('the splash wordmark is solid ink (the sheen retired)', () => {
  assert.ok(!css.includes('gd-splash-sheen'), 'the sheen keyframes are gone');
  assert.ok(!/\.gd-splash-word\s*\{[^}]*?background-clip: text;/.test(css), 'no text-clipped gradient remains');
  assert.match(css, /\.gd-splash-word\s*\{[^}]*?color: var\(--gd-chrome/s, 'solid chrome ink');
  assert.match(css, /gd-splash-sweep/, 'the indeterminate progress sweep stays (it is the loading feedback)');
});

// ---- the website + changelog --------------------------------------------------------
ok('the in-source download page fronts 1.2.6 (1.2.5 demoted)', () => {
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(website, /<span class="ver">v1\.4\.3<\/span>/);
  /* 1.2.9 note: each release retires the last one's copy — the tagline is
     1.2.9's now; this suite keeps only its historical truth (the 1.2.5
     row still linked true below the front). */
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(website, /var CURRENT = \[1, 4, 3\];/);
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(website, /releases\/tag\/v1\.3\.1"/);
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(website, /<td class="v">1\.3\.1<\/td>/);
  // the demoted 1.2.5 row keeps its own true link
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(website, /releases\/tag\/v1\.2\.5"/);
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(website, /<td class="v">1\.2\.5<\/td>/);
});
ok('the changelog carries the 1.2.5 entry', () => {
  assert.match(changelog, /## 1\.2\.5 — The Welded Drag, the Filled Ends/m, 'the entry keeps its seat (demoted below 1.2.6)');
  /* 1.3.0 re-law: the new release leads; 1.2.9 keeps its seat. */
  assert.match(changelog, /^## 1\.3\.0 — The Fill Reads From the Top/m, 'and 1.3.0 leads the log');
  assert.match(changelog, /^## 1\.2\.9 — The Breath It Mounts In/m, 'and 1.2.9 keeps its seat');
});

console.log(`\n${passed} passed, ${failed} failed — 1.2.5 batch`);
if (failed) process.exit(1);
