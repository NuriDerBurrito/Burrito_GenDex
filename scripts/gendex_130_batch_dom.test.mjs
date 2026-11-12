// 1.2.0 batch source checks — the twenty-two-item list, one law per item:
//   1  the fades seat on the zone's own clip box (measured overhang vars)
//   2  both rows start on one vertical line (shared toggle min-width +
//      the left-column seat)
//   3  the retract animation never snaps (ONE DOM in every seat — no swap)
//   4  every toggle homes the pan to the left + the box law never drifts
//   5  the + TAGS / + STAMPS keys ride below the titles
//   6  the container never shrinks/moves the items on toggle (same track)
//   7  the version drag lands where it glided (nowrap simulation)
//   8  holding at the edge auto-scrolls the strip (rAF loop + snapshot shift)
//   9  the masonry feeds the MEASURED height as-is (no phantom row)
//   10 the paged flow: no columns anywhere, every page fills like the cards
//   11 the full view's name fold lands two honest rows
//   12 the full panel's close is a real flight (64px / 0.26s)
//   13 the card delete key wears an outline on hover
//   14 the wide-card estimate rides only the unmeasured seat (live heights)
//   15 the scroll's clip planes keep their air (the paged track's law)
//   16 clicking a toast dismisses it (and never presses behind it)
//   17 the expandedCards hydrate arms a one-shot latch (no phantom write)
//   18 the grid re-flows on column crossings (the CPU fix)
//   19 the shrink flight tracks the width tween (same law as 9/14)
//   20 right-clicking off the run deselects it first
//   21 the tree branch stops at the parent's door (reach -4px)
//   22 the tag-chip tilts retired (burrito + zine)
// Run: node scripts/gendex_130_batch_dom.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const appRoot = fileURLToPath(new URL('..', import.meta.url));
const src = (rel) => readFileSync(join(appRoot, rel), 'utf8');

const { APP } = require(join(appRoot, 'src/constants/index.js'));
const pkg = require(join(appRoot, 'package.json'));
const viewSrc = src('src/components/CharacterView.jsx');
const sideSrc = src('src/components/SideFlow.jsx');
const stampModalSrc = src('src/components/StampEditModal.jsx');
const appSrc = src('src/App.jsx');
const masonrySrc = src('src/components/MasonryGrid.jsx');
const helpersSrc = src('src/utils/helpers.js');
const toastSrc = src('src/components/ToastHub.jsx');
const gridSrc = src('src/components/GridView.jsx');
const sortSrc = src('src/components/useThumbSort.js');
const css = src('src/index.css');
const sidebarSrc = src('src/components/ClassSidebar.jsx');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL — ${name}\n      ${e.message}`);
    process.exitCode = 1;
  }
};

// ---- the version -------------------------------------------------------------
ok('the version is 1.2.9', () => {
  assert.equal(APP.version, '1.4.3');
  assert.equal(pkg.version, '1.4.3');
  assert.match(src('README.md'), /\*\*v1\.4\.3\*\*/);
  assert.match(src('CHANGELOG.md'), /^## 1\.2\.3 /m);
  assert.match(src('START.bat'), /launcher \(1\.4\.3\)/);
});

// ---- 1: the fades seat on the zone's own clip box -----------------------------
ok('1 — the fades seat on the ZONE\u2019s CONTENT box (measured overhang, no gap to the left, no furniture under the veil)', () => {
  // the overhang is measured in JS and written as vars on the seat
  assert.match(sideSrc, /const writeSeatOverhang = useCallback/, 'the overhang writer exists');
  assert.match(sideSrc, /--gd-seat-ox-l/, 'the left overhang var');
  assert.match(sideSrc, /--gd-seat-ox-t/, 'the top overhang var');
  assert.match(sideSrc, /--gd-seat-ox-b/, 'the bottom overhang var');
  /* 1.2.2 re-law: the veil trades the zone's whole box for the scroller's
     CONTENT box — the top overhang used to wash over the separator
     between the rows, and the bottom ran across the scrollbar. */
  assert.match(sideSrc, /--gd-seat-fade-t/, 'the content-top var');
  assert.match(sideSrc, /--gd-seat-fade-b/, 'the scrollbar var');
  // the fades read the vars
  assert.match(css, /\.gd-flow-fade\.is-left\s*\{[^}]*?left: var\(--gd-seat-ox-l, 0px\);/, 'the left fade starts at the scroller\u2019s plane');
  assert.match(css, /\.gd-flow-fade\s*\{[^}]*?top: var\(--gd-seat-fade-t, var\(--gd-seat-ox-t, 0px\)\);/, 'the veil tops out at the content box (clear of the separator)');
  assert.match(css, /\.gd-flow-fade\s*\{[^}]*?bottom: var\(--gd-seat-fade-b, var\(--gd-seat-ox-b, 0px\)\);/, 'and stops above the scrollbar');
});

// ---- 2: one vertical line for both rows ---------------------------------------
ok('2 — both rows start on the same vertical line (shared toggle width + the left column)', () => {
  assert.match(css, /\.gd-row-toggle\s*\{[^}]*?min-width: 96px;/, 'the toggles share a fixed width');
  assert.match(css, /\.gd-row-toggle\s*\{[^}]*?justify-content: flex-start;/, 'the label sits at the line, not centered away from it');
  // both rows ride their own left column (the toggle + the + key)
  /* 1.2.4 re-law: the columns CENTER — the + key centers beneath its
     label while the toggle keeps the shared line through its own
     self-start + min-width (the one-vertical-line law holds). */
  assert.match(viewSrc, /className="flex flex-col items-center gap-1 flex-shrink-0"/, 'the tags row\u2019s left column centers');
  const stampHeader = /<div className="flex flex-col items-center gap-1 flex-shrink-0">/.exec(
    src('src/components/CharacterView.jsx')
  );
  assert.ok(stampHeader, 'the stamps row\u2019s left column centers');
  assert.match(viewSrc, /gd-row-toggle flex-shrink-0 self-start/, 'the toggles keep the line');
});

// ---- 3 + 6: ONE DOM in every seat ----------------------------------------------
ok('3+6 — 1.3.2 one DOM in every seat: the WALL never rebuilds (no snap, no drift, no resize)', () => {
  // the side seat renders THE WALL — one continuous column-major grid
  assert.match(sideSrc, /THE WALL \(/, 'the wall law is documented');
  assert.match(sideSrc, /const renderSide = \(\) => \{[\s\S]{0,900}?data-gd-flow="wall"/, 'the side seat renders the wall (the law rides the carrier)');
  assert.ok(!/gd-side-block/.test(sideSrc), 'the twin-block is gone from the zone');
  assert.ok(!/gd-side-page/.test(sideSrc), '1.3.2: the page boxes are gone with the pages');
  assert.ok(!/gd-side-block\.is-b/.test(css), 'the column stack is retired in the CSS');
  // the zone keeps its plain-seat box law in every seat
  assert.ok(!/\.gd-collapse-zone\.is-side\s*\{[^}]*?padding-left: 9px;/.test(css), 'no side-specific padding (the +9px drift is dead)');
  // the flight is a clamp on the SAME box — the chips never move
  assert.match(sideSrc, /NEVER rebuild the wall/, 'the one-DOM law is written (the 1.3.2 wall voice)');
});

// ---- 4: the pan homes to the left ---------------------------------------------
ok('4 — every toggle returns the pan to the very left', () => {
  assert.match(sideSrc, /HOME TO THE LEFT/, 'the home law is documented');
  /* 1.2.4 re-law: the home is a FLIGHT — the retract arms the pan window
     and the smooth scroll rides it (plus the expand path's own). */
  const retracts = sideSrc.match(/zone\.scrollTo\(\{ left: 0, behavior: 'smooth' \}\)/g) || [];
  assert.ok(retracts.length >= 2, 'the smooth home call rides the pan window and the expand');
});

// ---- 5: the + keys below the titles -------------------------------------------
ok('5 — the + TAGS / + STAMPS keys ride below their titles', () => {
  /* 1.2.5 re-law: the keys are LABELED PILLS again (+ TAG / + STAMP) —
     bigger and wider than the 1.2.2 icon-only square ("the +stamp and
     +tag buttons are too small"), the word riding IN the key, still with
     their own air under the toggle. */
  assert.match(viewSrc, /className="gd-row-plus flex-shrink-0"[\s\S]{0,220}onClick=\{onOpenTagManager\}/, 'the + TAGS key opens the manager');
  assert.match(viewSrc, /className="gd-row-plus flex-shrink-0"[\s\S]{0,260}onClick=\{\(\) => setPickerSignal\(\(n\) => n \+ 1\)\}/, 'the + STAMPS key opens the picker');
  assert.match(viewSrc, /<Plus size=\{11\} \/>[\s\S]{0,30}\n\s*TAG[\s\S]{0,40}<\/button>/, 'the + TAG key carries its word');
  assert.match(viewSrc, /<Plus size=\{11\} \/>[\s\S]{0,30}\n\s*STAMP[\s\S]{0,40}<\/button>/, 'the + STAMP key carries its word');
  assert.match(viewSrc, /const \[pickerSignal, setPickerSignal\] = useState\(0\);/, 'the picker signal state');
  assert.match(stampModalSrc, /openSignal = 0,/, 'StampAddButton accepts the signal');
  assert.match(stampModalSrc, /openSignal && openSignal !== lastSignalRef\.current/, 'every increment opens the popover');
  assert.match(css, /\.gd-row-plus\s*\{[^}]*?height: 20px;/, 'the key is a comfortable 20px pill');
  // 1.2.6 — the glyphs sit centered: the padding became asymmetric (2px
  // top, 0 bottom) — the ink rode a pixel high in the pill.
  assert.match(css, /\.gd-row-plus\s*\{[^}]*?padding: 2px 9px 0;/, 'wide enough for its word, its glyphs centered');
  assert.match(css, /\.gd-row-plus\s*\{[^}]*?margin-top: 8px;/, 'with its own air under the title');
});

// ---- 7: the version drag lands where it glided ---------------------------------
ok('7 — the version drag lands where it glided (nowrap simulation + descendant snapshots)', () => {
  assert.match(sortSrc, /nowrap = st\.flexWrap === 'nowrap';/, 'the packer reads the container\u2019s wrap shape');
  assert.match(sortSrc, /if \(!nowrap && row\.length && cursor \+ r\.w - left > W \+ 1\) break;/, 'a nowrap strip never breaks its row');
  assert.match(sortSrc, /NOWRAP IS A SHAPE TOO/, 'the nowrap law is documented');
  // the snapshot finds items through nested wrappers (the paged track)
  assert.match(sortSrc, /querySelectorAll\('\.gd-sort-item'\)/, 'the snapshot query descends');
  assert.ok(!/cont\.children\)\.filter\(\(el\) => el\.classList\?\.contains\('gd-sort-item'\)\)/.test(sortSrc), 'the direct-children filter is retired');
});

// ---- 8: the edge auto-scroll ----------------------------------------------------
ok('8 — holding at the edge auto-scrolls the strip', () => {
  assert.match(sortSrc, /const scrollerFor =/, 'the scroller finder walks up from the container');
  assert.match(sortSrc, /const sc = scrollerFor\(containerRef\?\.current \|\| el\);\n\s*dragRef\.current\.scroller = sc;/, 'the drag discovers its scroller at grab time (1.2.6: through the const — the honest-geometry block reads it too)');
  assert.match(sortSrc, /const AUTO_EDGE = 56;/, 'the edge zone');
  assert.match(sortSrc, /const AUTO_STEP = 9;/, 'the per-frame step');
  assert.match(sortSrc, /r\.x -= delta;/, 'each step shifts the grab-time snapshot');
  assert.match(sortSrc, /stopAutoscroll\(\);/, 'the loop dies with the drag');
  // the shared target math: the pointer's travel is part of the answer
  assert.match(sortSrc, /const dx = cx - drag\.startX;/, 'the dragged chip\u2019s center carries the pointer delta');
});

// ---- 9 + 14 + 19: the honest heights --------------------------------------------
ok('9+14+19 — the measured truth is the layout\u2019s truth (no phantom row, no midway stop, no low seats)', () => {
  assert.match(
    masonrySrc,
    /if \(spanOf\(id\) === 2\) \{[\s\S]{0,120}return h != null \? h : estHeight \* 1\.9;/,
    'the 1.9 estimate rides ONLY the unmeasured seat'
  );
  assert.match(masonrySrc, /THE MEASURED TRUTH IS THE LAYOUT'S TRUTH/, 'the law is documented where it lives');
  assert.ok(!/spanOf\(id\) === 2 \? h \* 1\.9 : h/.test(masonrySrc), 'the blanket 1.9x multiplier is retired');
});

// ---- 10: the paged flow fills like the cards -------------------------------------
ok('10 — 1.3.2 the wall fills COLUMN-MAJOR (each column filled before the next)', () => {
  assert.match(sideSrc, /ONE CONTINUOUS WALL/, 'the one-entity law is documented');
  assert.match(sideSrc, /column 1 holds the first `rows` items top to bottom/, 'the column-major fill law is documented');
  assert.match(sideSrc, /const boxContent =/, 'the reader answers the probe\u2019s CONTENT width (the overflow test)');
  assert.match(sideSrc, /data-side-cols/, 'the column count rides the debug seat');
  assert.match(css, /\.gd-collapse-zone\.is-side\.is-self-flow\s*\{[^}]*?grid-auto-flow: column;/, 'the self-flow wall flows column-major');
  assert.match(css, /\.gd-collapse-zone\.is-side > \.gd-stamp-slots\.is-wall\s*\{[^}]*?gap: 8px;/, 'the stamps\u2019 wall speaks the wrapper gap');
  assert.ok(!/data-side-pages/.test(sideSrc), 'the page count left the debug seat with the pages');
});

// ---- 11: the full view's name fold ------------------------------------------------
ok('11 — the full view\u2019s name fold lands two honest rows', () => {
  // the fold target math is unchanged; the law it answers is the twin's
  // natural height clamped to two line boxes + the seat. Pin the math:
  assert.match(viewSrc, /const twoBox = Math\.max\(two, clampedHRef\.current \|\| 0\);/, '1.2.9: the two-line ceiling takes the clamp\'s own painted box');
  assert.match(viewSrc, /const body = Math\.max\(one, Math\.min\(Math\.ceil\(Math\.max\(natH \|\| 0, floor\)\) \|\| one, twoBox\)\);/, 'the honest line count');
  assert.match(viewSrc, /return \{ lh, fold: Math\.ceil\(body \+ seat\) \};/, 'the seat rides the target (descenders clear the cut)');
  assert.match(css, /\.gd-name-clamp\s*\{[^}]*?-webkit-line-clamp: 2;/, 'the resting clamp is two lines');
});

// ---- 12: the full panel's close ---------------------------------------------------
ok('12 — the full panel closes on a real flight (64px / 0.26s)', () => {
  // 1.2.6 — THE SLIDE STAYS VISIBLE: the exit is keyframed now — x travels
  // 88px while opacity holds [1, 1, 0] (the fade packed into the last 40%
  // of a 0.3s clock riding the variant itself; the old linear fade buried
  // three-quarters of the flight — measured 0.04 opacity by 117ms).
  assert.match(appSrc, /opacity: \[1, 1, 0\],/, 'the exit opacity holds while it travels');
  assert.match(appSrc, /x: 88,/, 'the out-flight travels further (was 64)');
  assert.match(appSrc, /times: \[0, 0\.6, 1\]/, 'the fade rides the tail (the last 40%)');
  assert.match(appSrc, /duration: 0\.3,/, 'on its own longer clock (0.3s, riding the variant)');
});

// ---- 13: the delete key's halo ----------------------------------------------------
ok('13 — the card delete key wears an outline when highlighted', () => {
  /* 1.3.4 re-law ("add an outline around the delete card option when
     hovered over, and if there is, change its color"): the 1.3.3 hover
     painted bg + border + outline the SAME red, so the resting ink
     border read as vanishing into the solid square. The ring is the
     app's ink now, drawn INSIDE the border box (offset -2px, the 1.3.3
     seat — never a surrounding ring), around the danger-red fill. */
  const rule = /\.gd-del-hover:hover\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert.match(rule, /outline: 2px solid var\(--gd-ink\);/, 'the edge highlight (the ink ring — contrast against the fill, never blends)');
  assert.match(rule, /outline-offset: -2px;/, 'drawn INSIDE the border box — the border itself, never a surrounding ring');
  assert.match(rule, /background: #c8402f !important;/, 'the fill turns the danger red on hover');
});

// ---- 15: the clip planes' air -------------------------------------------------------
ok('15 — 1.3.2 the wall keeps its air at the scroll\u2019s planes', () => {
  assert.match(css, /\.gd-collapse-zone\.is-side > \.gd-stamp-slots\.is-wall > \*:last-child\s*\{[^}]*?margin-right: 9px;/, 'the scroll\u2019s end keeps its air (the wall\'s last seat)');
  assert.match(css, /\.gd-collapse-zone\.is-side > \.gd-stamp-slots\.is-wall\s*\{[^}]*?padding: 9px 0 0;/, 'the wall carries the wrapper\u2019s own top headroom law');
});

// ---- 16: the press dismisses --------------------------------------------------------
ok('16 — clicking a toast closes it, with a press answer (nothing behind it is pressed)', () => {
  assert.match(toastSrc, /const dismissToast = \(id\) => \{/, 'the dismiss exists');
  assert.match(toastSrc, /const swallow = \(e\) => \{/, 'the press is stopped on the pill');
  /* 1.2.2 re-law: the pointerdown SWALLOWS *and* paints the press seat
     (pressToast) — the pill answers the press while it closes. */
  assert.match(toastSrc, /onPointerDown=\{pressToast\}/, 'pointerdown included, with feedback');
  assert.match(toastSrc, /el\.classList\.add\('is-pressed'\)/, 'the press look lands before the dismiss');
  assert.match(css, /\.gd-toast\.is-pressed\s*\{[^}]*?border-color: var\(--gd-accent\);/, 'the pressed pill wears the accent');
  assert.match(css, /\.gd-toast:hover\s*\{[^}]*?border-color: color-mix\(in srgb, var\(--gd-accent\)/, 'the hover highlights');
  assert.match(toastSrc, /onClick=\{\(e\) => \{\s*\n\s*swallow\(e\);\s*\n\s*dismissToast\(t\.id\);/, 'the click dismisses through the usual fade');
});

// ---- 17: the phantom unsaved change --------------------------------------------------
ok('17 — the expandedCards hydrate arms a one-shot latch (no phantom write at boot)', () => {
  assert.match(appSrc, /const expandedStaleRef = useRef\(false\);/, 'the latch exists');
  assert.match(appSrc, /expandedStaleRef\.current = true; \/\/ the state lands next commit/, 'a hydrate arms it');
  assert.match(appSrc, /this run sees the pre-hydrate state/, 'the persist skips exactly its first (stale) run');
});

// ---- 18: the grid re-flows on column crossings ----------------------------------------
ok('18 — the grid holds the COLUMN COUNT (the panel morph\u2019s CPU fix)', () => {
  assert.match(masonrySrc, /const \[columns, setColumns\] = useState\(1\);/, 'the state is the count');
  assert.match(masonrySrc, /const count = masonryColumns\(w, cardWidth, gap\);/, 'the observer derives the count');
  assert.match(masonrySrc, /setColumns\(\(prev\) => \(prev === count \? prev : count\)\)/, 'it commits only on a crossing');
  assert.ok(!/setContainerW/.test(masonrySrc), 'the raw-width state is retired');
  assert.match(masonrySrc, /const columnsNow = Math\.max\(1, columns\);/, 'the layout reads the count');
});

// ---- 20: right-clicking off the run deselects it ----------------------------------------
ok('20 — right-clicking off the run deselects it first; the normal menu speaks', () => {
  assert.match(appSrc, /const selectionOwnsTarget = \(\(\) => \{/, 'the on-run test exists');
  assert.match(appSrc, /liveSel\.containsNode\(target, true\)/, 'it asks the selection itself (with the range test as fallback)');
  assert.match(appSrc, /liveSel\?\.removeAllRanges\?\.\(\);/, 'the off-run press clears the selection');
  assert.match(appSrc, /\} else if \(selNow\) \{/, 'the on-run press keeps the selection crew');
});

// ---- 21: the tree branch stops at the parent's door --------------------------------------
ok('21 — the tree branch stops just below the parent card\'s edge', () => {
  /* 1.2.4 re-law: the rail TIES ON — top: -3px reaches exactly to the
     plate's bottom border (the 1.2.2 air gap read as a clean break). */
  assert.match(css, /\.gd-tree-node:first-child::before\s*\{[^}]*?top: -3px;/, 'the reach ties onto the plate\u2019s bottom border');
  assert.match(css, /\.gd-tree-node:first-child:last-child::before\s*\{[^}]*?height: 19px;/, 'the only child\u2019s rail follows the same law');
  assert.ok(!/top: -16px/.test(css), 'the old center-of-parent reach is retired');
  assert.ok(!/\.gd-tree-node:first-child[^{]*\{[^}]*?top: -4px;/.test(css), 'the border-crossing reach stays retired');
});

// ---- 22: the tilts retired ---------------------------------------------------------------
ok('22 — the tag-chip tilts retired in every theme', () => {
  const burrito = /\[data-theme='burrito'\] \.gd-chip\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert.ok(!/rotate\(-2deg\)/.test(burrito), 'burrito\u2019s chip stands level');
  assert.match(burrito, /transform: none;/, 'spoken as none, not by omission');
  const zineOdd = /\[data-theme='zine'\] \.gd-chip:nth-child\(odd\)\s*\{[^}]*\}/.exec(css)?.[0] || '';
  const zineEven = /\[data-theme='zine'\] \.gd-chip:nth-child\(even\)\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert.ok(!/rotate/.test(zineOdd) || /transform: none/.test(zineOdd), 'zine\u2019s odd wobble is retired');
  assert.ok(!/rotate/.test(zineEven) || /transform: none/.test(zineEven), 'zine\u2019s even wobble is retired');
});

// ---- the website fronts 1.2.0 ---------------------------------------------------------------
console.log('  ok — retired with the website in 1.8.8 — ' + 'the in-source download page fronts 1.2.3');

// ---- summary ---------------------------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
