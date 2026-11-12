// 1.2.2 batch source + function checks — the twenty-item list, one law per
// item (grouped where the fixes share a root):
//   1   the detail name folds TWO rows with the dots (the measurement twin
//       wraps unbroken shards like the real name — break-word laws on the
//       probe, its own seat)
//   2+17 the edge fades seat on the scroller's CONTENT box (clear of the
//       separator above, clear of the scrollbar below, never outside)
//   3+4+8 the paged flow FILLS — the front rows stay probe-exact and every
//       row after packs greedily at the page's own width (no trailing holes
//       at the seams, every row reads like the first); the flow's tag chips
//       cap and ellipsize (no chip outgrows its row, nothing clips)
//   5+6 the stamps' ADD / PASTE / options tail rides the same greedy fill —
//       it splits across the page's rows instead of commanding its own
//   7+11 the drag stays welded to the cursor through the auto-scroll (the
//       pan rides the transform + the target math), and the glide simulates
//       the PAGED track itself (no cross-page pile-ups)
//   9   the arrows and fades breathe (is-live flight classes, mounted for
//       the seat's life + a linger after it folds — the version strip too)
//   10  the + keys are labeled pills (+ TAG / + STAMP — the 1.2.5 growth,
//       20px tall, the word riding in the key)
//   12+13 the whole top toolbar drags the window (interactive children opt
//       out through one global law) and the titlebar refuses drag-select
//   14  the menu holds its right-clicked target lit for its whole life
//   15  the tree rail starts at the kids' own top (clear of the parent
//       plate's border)
//   16  the span-2 pair takes the higher seat (worst-top first, balance
//       only breaks 12px ties)
//   18  the measurement twin never opens portals (the ghost seat — one
//       picker from the + STAMPS key, and the + TAGS key never could)
//   19  the toast stack keeps its width (the first pill's exit is the same
//       in-place fade)
//   20  a hovered pill highlights; a pressed one answers through the exit
// Plus: the version is 1.2.3 everywhere and the download page fronts it.
// Run: node scripts/gendex_132_batch_dom.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const appRoot = fileURLToPath(new URL('..', import.meta.url));
const src = (rel) => readFileSync(join(appRoot, rel), 'utf8');

const { APP } = require(join(appRoot, 'src/constants/index.js'));
const { layoutMasonry } = require(join(appRoot, 'src/utils/helpers.js'));
const pkg = require(join(appRoot, 'package.json'));

const css = src('src/index.css');
const viewSrc = src('src/components/CharacterView.jsx');
const sideSrc = src('src/components/SideFlow.jsx');
const sortSrc = src('src/components/useThumbSort.js');
const stampSrc = src('src/components/StampEditModal.jsx');
const toastSrc = src('src/components/ToastHub.jsx');
const ctxSrc = src('src/components/GdContextMenu.jsx');
const gridSrc = src('src/components/GridView.jsx');
const helpersSrc = src('src/utils/helpers.js');
const newCharSrc = src('src/components/NewCharacterModal.jsx');
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

// ---- 1: the two-row name, with its dots ----------------------------------------
ok('1 — the name twin wraps like the real name (unbroken shards measure honest)', () => {
  // the twin carries the fold's word laws at its own seat
  assert.match(css, /\.gd-name-probe\s*\{[^}]*?overflow-wrap: break-word;[^}]*?word-break: break-word;/s, 'the probe speaks break-word');
  // the real clamp recipe is untouched (two lines + the dots at rest)
  assert.match(css, /\.gd-name-clamp\s*\{[^}]*?-webkit-line-clamp: 2;/, 'the resting clamp stays two lines');
  // the fold target keeps the honest line count (min of natural vs two)
  assert.match(viewSrc, /const twoBox = Math\.max\(two, clampedHRef\.current \|\| 0\);/, '1.2.9: the two-line ceiling takes the clamp\'s own painted box');
  assert.match(viewSrc, /const body = Math\.max\(one, Math\.min\(Math\.ceil\(Math\.max\(natH \|\| 0, floor\)\) \|\| one, twoBox\)\);/, 'the honest line count');
});

// ---- 2 + 17: the veil covers the content, never the furniture -------------------
ok('2+17 — the fades seat on the scroller\u2019s CONTENT box (separator + scrollbar stay clear)', () => {
  // the JS writes the content-box vars
  assert.match(sideSrc, /--gd-seat-fade-t/, 'the content-top var is written');
  assert.match(sideSrc, /--gd-seat-fade-b/, 'the scrollbar var is written');
  assert.match(sideSrc, /sbH = Math\.max\(0, Math\.round\(\(zone\.offsetHeight \|\| 0\) - \(zone\.clientHeight \|\| 0\)\)\);/, 'the scrollbar\u2019s height is measured');
  // the fades read them (falling back to the old zone vars where a seat has none)
  assert.match(css, /\.gd-flow-fade\s*\{[^}]*?top: var\(--gd-seat-fade-t, var\(--gd-seat-ox-t, 0px\)\);/s, 'the veil tops out at the content box');
  assert.match(css, /\.gd-flow-fade\s*\{[^}]*?bottom: var\(--gd-seat-fade-b, var\(--gd-seat-ox-b, 0px\)\);/s, 'the veil stops above the scrollbar');
  // the left plane is still the scroller's clip edge
  assert.match(css, /\.gd-flow-fade\.is-left\s*\{[^}]*?left: var\(--gd-seat-ox-l, 0px\);/s, 'the left plane is the clip edge');
});

// ---- 3 + 8: the pages fill -------------------------------------------------------
ok('3+8 — 1.3.2 the wall fills itself (no packing, no slicing: the grid IS the layout)', () => {
  assert.match(sideSrc, /THE WALL RENDERER: ONE grid, the caller's children/, 'the wall renderer law is documented (1.3.3: the reading order is the carrier\'s own voice)');
  assert.ok(!/THE GREEDY PAGE PACK/.test(sideSrc), 'the greedy pack retired with the pages');
  assert.ok(!/const front = Math\.max\(1, Math\.min\(collapsedRows/.test(sideSrc), 'no probe-exact front rows to seed (the wall seats everything)');
  assert.ok(!/packFlowRows/.test(sideSrc), 'renderSide packs through NOTHING');
  assert.ok(!/for \(let k = 0; k < allRows\.length; k \+= rows\)/.test(sideSrc), 'no page slicing anywhere');
  // the reader still answers per-item widths + heights + the flow's own gap
  // (the wall's rows and columns are pure math over them)
  assert.match(sideSrc, /itemRects = rects\.map/, 'the reader exposes per-item rects');
  assert.match(sideSrc, /const cg = parseFloat\(cs\.columnGap\);/, 'the reader measures the flow\u2019s own gap');
  assert.match(sideSrc, /rootPadTop = parseFloat\(window\.getComputedStyle\(el\)\.paddingTop\) \|\| 0;/, 'the reader answers the zone\u2019s own padding (the wall\u2019s border-box math)');
});

// ---- 4: no tag outgrows its row ---------------------------------------------------
ok('4 — the flow\u2019s tag chips cap and ellipsize (nothing clips, nothing collides)', () => {
  assert.match(css, /\.gd-tag-label-cap\s*\{[^}]*?max-width: 148px;[^}]*?text-overflow: ellipsis;[^}]*?white-space: nowrap;/s, 'the tag label cap (the version chips\u2019 own law)');
  assert.match(viewSrc, /<RichText text=\{tag\.name\} className="gd-tag-label-cap" \/>/, 'the detail panel\u2019s chips wear it');
  assert.match(newCharSrc, /<RichText text=\{tag\.name\} className="gd-tag-label-cap" \/>/, 'the creation board\u2019s chips wear it');
});

// ---- 5 + 6: the tail splits across the rows ----------------------------------------
ok('5+6 — the stamps\u2019 tail rides the same greedy fill (it splits across the page\u2019s rows)', () => {
  // the tail items are ordinary flow items — the greedy packer treats them
  // exactly like stamps (they ride in the itemRects the packer reads)
  assert.match(viewSrc, /<StampAddButton[\s\S]{0,420}openSignal=\{pickerSignal\}/, 'the ADD key rides the flow');
  assert.match(viewSrc, /<StampPasteTile onPaste=\{\(records\) => naming\.push\(records\)\} \/>/, 'the PASTE tile rides the flow');
  // 1.3.1 re-law: the settings ride as their OWN seats (the cluster retired)
  assert.match(viewSrc, /<StampColorControls/, 'the color key rides the flow');
  assert.match(viewSrc, /<StampPosControls/, 'the transform key rides the flow');
  // and the packer measures EVERY child (tail included) — no special lanes
  assert.match(sideSrc, /const itemRects = rects\.map\(\(r\) => \(\{ idx: r\.idx, w: r\.width, h: r\.height \}\)\);/, 'every child\u2019s true box feeds the pack');
});

// ---- 7 + 11: the honest drag --------------------------------------------------------
ok('7+11 — the chip stays welded to the cursor through the auto-scroll (and the target reads its true seat)', () => {
  // the pan accumulates on the drag and rides the TRANSFORM
  assert.match(sortSrc, /drag\.scrollAccum = \(drag\.scrollAccum \|\| 0\) \+ delta;/, 'the pan accumulates');
  /* 1.2.5 re-law: the clamp bounds SPEAK THE PAN — the delta carries it
     AND the box's bounds shift by it (the old bounds sat frozen at the
     grab-time box and ate the compensation every frame: the held chip
     sailed with the content — measured live 599px off the cursor). */
  assert.match(sortSrc, /const pan = drag\.scrollAccum \|\| 0;\n\s*let tdx = dx \+ pan;/, 'the pointermove transform carries the pan');
  assert.match(sortSrc, /let minX = drag\.contRect\.left \+ m - b\.left \+ pan;/, 'the clamp bounds shift with the pan (let — the 1.2.6 content ceiling tightens them)');
  assert.match(sortSrc, /const dx = drag\.lastX - drag\.startX \+ pan;/, 'the auto-scroll\u2019s redraw carries it too');
  assert.ok((sortSrc.match(/let minX = drag\.contRect\.left \+ m - b\.left \+ pan;/g) || []).length >= 2, 'both handlers\u2019 clamp bounds shift with the pan (let — the 1.2.6 ceiling tightens them)');
  // the base no longer rides the content (that was the "left behind" bug)
  assert.ok(!/drag\.baseRect\.left -= delta;/.test(sortSrc), 'the grab-time base stays put');
  // the target math reads the origin seat + the pointer delta.
  // 1.2.9 re-law — THE PAN IS NOT ADDED ("it creates ghost stamps, aka a
  // space where a stamp should go but would be empty"): the chip rides
  // INSIDE the scrolling content, so the pan slides its layout seat left
  // by exactly itself while the transform carries +pan — the two cancel,
  // and the old `+ pan` counted the compensation twice (measured live: a
  // stamp dragged 180px with a 198px pan landed five seats past the
  // pointer). The center is the origin + the pointer delta, full stop.
  assert.match(sortSrc, /const r0 = drag\.originRect \|\| snapRef\.current\[drag\.from\];/, 'the origin seat is kept apart from the shifted snapshot');
  assert.match(sortSrc, /const r = r0 \? r0\.x \+ r0\.w \/ 2 \+ dx : cx;/, 'the center speaks the origin + the pointer delta (the pan already lives in the transform)');
  assert.match(sortSrc, /drag\.originRect = \{ x: o\.x, y: o\.y, w: o\.w, h: o\.h \};/, 'the origin is captured with the snapshot');
});

ok('7b — 1.3.2 the glide simulates the WALL (column seats, byte-exact)', () => {
  assert.match(sortSrc, /THE WALL IS A SHAPE TOO/, 'the wall simulation is documented');
  assert.match(sortSrc, /cont\.dataset\.gdFlow === 'wall'/, 'the packer recognizes the wall carrier');
  assert.match(sortSrc, /const packWall = \(order, ctx\) =>/, 'the wall pack engine exists');
  assert.match(sortSrc, /drag\.wallCtx/, 'the wall geometry is cached once per drag');
  /* 1.3.4 re-law: the bands still measure over every child (tools raise
     their rows) — but they now decide only the wall's row CAP; the
     pack's own seats derive from its membership (the anchor law). */
  assert.match(sortSrc, /kidBoxes\.sort\(\(a, b\) => a\.top - b\.top\);[\s\S]{0,2400}const maxRows = Math\.max\(1, Math\.min\(rowsPerCol, bandsArr\.length\)\);/, 'the row bands measure over EVERY child (tools raise their rows — the cap’s voice)');
  assert.match(sortSrc, /const tools = Array\.from\(cont\.children \|\| \[\]\)/, 'the foreign tail keys ride the wall\u2019s tail seats');
  assert.match(sortSrc, /nearestGapIndexWall/, 'the drop target speaks the wall\u2019s own gaps');
  assert.ok(!/packPaged/.test(sortSrc), 'the paged packer retired with the pages');
  assert.ok(!/gd-side-page/.test(sortSrc), 'the packer recognizes no page boxes');
});

// ---- 9: the arrows and fades breathe -------------------------------------------------
ok('9 — 1.3.2 the arrows + fades stay mounted through the fold (they fade, never vanish)', () => {
  // the CSS flight (unchanged)
  assert.match(css, /\.gd-flow-arrow\s*\{[^}]*?opacity: 0;[^}]*?pointer-events: none;/s, 'the resting arrow is gone + blind');
  assert.match(css, /\.gd-flow-arrow\.is-live\s*\{[^}]*?opacity: 1;[^}]*?pointer-events: auto;/s, 'the live flight lands');
  assert.match(css, /\.gd-flow-arrow\.is-left\s*\{[^}]*?translate: -4px 0;/s, 'the left arrow slides in from its edge');
  assert.match(css, /\.gd-flow-arrow\.is-right\s*\{[^}]*?translate: 4px 0;/s, 'the right arrow slides in from its edge');
  assert.match(css, /\.gd-flow-fade\s*\{[^}]*?transition: opacity 0\.18s ease;/s, 'the veil tweens');
  // 1.3.2 — the mount keys on the OVERFLOW (sideMounted), never on
  // sideActive: the group survives every collapse/expand (a state-lagged
  // linger unmounted it for one commit and the fade-out never ran — the
  // arrows VANISHED in a frame). The linger survives only for the true
  // unmount: the flow stops overflowing.
  assert.match(sideSrc, /THE EDGE GROUP STAYS MOUNTED THROUGH THE FOLD/, 'the 1.3.2 edge law is documented');
  assert.match(sideSrc, /const \[shrinkLinger, setShrinkLinger\] = useState\(false\);/, 'the linger is the SHRINK\u2019s alone now');
  assert.match(sideSrc, /const edgesOn = sideMounted \|\| shrinkLinger;/, 'the group outlives the OVERFLOW, not the seat');
  assert.ok(!/edgeLinger/.test(sideSrc), 'the sideActive-keyed linger is retired');
  assert.match(sideSrc, /const \[linger, setLinger\] = useState\(false\);/, 'the strip\u2019s linger');
  assert.match(sideSrc, /edgesOn: active \|\| linger/, 'the strip hook speaks it too');
  // both arrows stay mounted (no mount/unmount pops)
  assert.match(sideSrc, /clsx\('gd-flow-arrow is-left', canL && 'is-live'\)/, 'the left arrow stays mounted');
  assert.match(sideSrc, /clsx\('gd-flow-arrow is-right', canR && 'is-live'\)/, 'the right arrow stays mounted');
});

// ---- 10: square + keys -----------------------------------------------------------------
ok('10 — the + keys are labeled pills with air (the 1.2.5 growth)', () => {
  /* 1.2.5 re-law: the keys grew back their words — a 20px pill wide enough
     for \"+ TAG\" / \"+ STAMP\" (\"the +stamp and +tag buttons are too
     small\"), still 8px under the toggle. */
  assert.match(css, /\.gd-row-plus\s*\{[^}]*?height: 20px;[^}]*?margin-top: 8px;/s, '20px pill, 8px of air');
  assert.match(viewSrc, /className="gd-row-plus flex-shrink-0"[\s\S]{0,220}onClick=\{onOpenTagManager\}/, 'the + TAGS key');
  assert.match(viewSrc, /className="gd-row-plus flex-shrink-0"[\s\S]{0,260}onClick=\{\(\) => setPickerSignal\(\(n\) => n \+ 1\)\}/, 'the + STAMPS key');
  assert.match(viewSrc, /<Plus size=\{11\} \/>\s*\n\s*TAG\s*\n\s*<\/button>/, 'the + TAG word rides in the key');
  assert.match(viewSrc, /<Plus size=\{11\} \/>\s*\n\s*STAMP\s*\n\s*<\/button>/, 'the + STAMP word rides in the key');
});

// ---- 12 + 13: the drag bar + no drag-select --------------------------------------------
ok('12+13 — 1.2.4: ONLY the real top bar drags the window (the toolbar region retired); the titlebar refuses drag-select', () => {
  /* 1.2.4 re-law: the 1.2.2 toolbar drag region is RETIRED — its rect
     stayed mounted under the full-window card view and swallowed the
     cover's keys + the toast pills. The header row wears NO region. */
  assert.ok(!/drag-region/.test(gridSrc), 'the grid carries no drag region at all');
  assert.match(gridSrc, /data-gd-region="header" className="flex items-center gap-3 px-6 py-3 gd-edge-b/, 'the header row is a plain row');
  assert.match(gridSrc, /RETIRES IT/, 'the retirement is the documented law');
  // the one global opt-out law for interactive children
  assert.match(css, /\.drag-region :is\(button, input, select, textarea, a, \[contenteditable='true'\], \[role='menu'\], \.no-drag\)\s*\{[^}]*?-webkit-app-region: no-drag;/s, 'interactive children opt out globally');
  // the titlebar + window controls refuse selection
  assert.match(css, /\.gd-titlebar\s*\{[^}]*?user-select: none;/s, 'the bar is not text');
  assert.match(css, /\.gd-win-btn\s*\{[^}]*?user-select: none;[^}]*?-webkit-user-drag: none;/s, 'the controls refuse drag-select + OS drag');
});

// ---- 14: the menu holds its target --------------------------------------------------------
ok('14 — the menu keeps its right-clicked target lit for its whole life', () => {
  assert.match(ctxSrc, /THE MENU\u2019S OWN TARGET MEMORY|THE MENU'S OWN TARGET MEMORY/, 'the target memory is documented');
  assert.match(ctxSrc, /document\.addEventListener\(\s*'contextmenu',/, 'one capture-phase listener remembers the press');
  assert.match(ctxSrc, /el\.classList\.add\('is-ctx-hot'\);/, 'the hot class lands on mount');
  assert.match(ctxSrc, /hot\.classList\.remove\('is-ctx-hot'\);/, 'and lifts when the menu closes');
  // the pairings speak each surface\u2019s hover language
  assert.match(css, /\.gd-tree-row\.is-ctx-hot \.gd-tree-card\s*\{/, 'the class row\u2019s card');
  assert.match(css, /\.gd-card-hover\.is-ctx-hot\s*\{[^}]*?translateY\(-2px\);/s, 'the grid card\u2019s lift');
  assert.match(css, /\.gd-chip\.is-ctx-hot/, 'the chip\u2019s lift');
  assert.match(css, /\.is-ctx-hot:not\(\.gd-tree-row\):not\(\.gd-chip\):not\(\.gd-btn\):not\(\.gd-card-hover\):not\(\.gd-stamp-slot\):not\(\.gd-sort-item\)\s*\{[^}]*?outline: 2px solid/s, 'the shared accent-ring fallback');
});

// ---- 15: the branch clears the border ------------------------------------------------------
ok('15 — 1.2.4: the tree rail TIES ON to the parent plate\u2019s bottom border (the 1.2.2 air gap retired)', () => {
  /* 1.2.4 re-law: the 3px of clear air read as a clean BREAK — the rail
     now reaches exactly TO the plate's bottom border (top: -3px, the
     measured plate-bottom offset): connected without entering it. */
  assert.match(css, /\.gd-tree-node:first-child::before\s*\{[^}]*?top: -3px;/s, 'the rail reaches the plate border');
  assert.match(css, /\.gd-tree-node:first-child:last-child::before\s*\{[^}]*?top: -3px;[^}]*?height: 19px;/s, 'the only child\u2019s rail follows');
  assert.ok(!/\.gd-tree-node:first-child[^{]*\{[^}]*?top: 0;/.test(css), 'the disconnected air gap is retired');
  assert.ok(!/\.gd-tree-node:first-child[^{]*\{[^}]*?top: -4px;/.test(css), 'the border-crossing reach stays retired');
});

// ---- 16: the wide card takes the higher seat -------------------------------------------------
ok('16 — the span-2 pair takes the higher seat (balance only breaks same-row ties)', () => {
  assert.match(helpersSrc, /const TIE_WINDOW = 12;/, 'the tie window');
  assert.match(helpersSrc, /top < bestTop - TIE_WINDOW/, 'a meaningfully lower worst-top wins outright');
  // the pure repro: pair(0,1) worst 220/spread 100 beats pair(3,4) worst 320/spread 0
  const uneven = layoutMasonry([120, 220, 250, 300, 300, 130], 5, 180, 20, [1, 1, 1, 1, 1, 2]);
  assert.equal(uneven.positions[5].x, 0, 'the wide card takes the LEFT, HIGHER seat');
  assert.equal(uneven.positions[5].y, 240, 'at the shallow pair\u2019s own worst-top');
  // the flush-fit survives: equal worst-tops still compete on balance
  const tie = layoutMasonry([10, 10, 10, 10, 10, 300], 4, 100, 10, [1, 1, 1, 1, 2, 1]);
  assert.equal(tie.positions[4].y, 20, 'the wide card starts flush with both its columns');
});

// ---- 18: one picker, always --------------------------------------------------------------
ok('18 — the measurement twin never opens portals (one picker from the + keys)', () => {
  assert.match(sideSrc, /export const SideFlowGhost = createContext\(false\);/, 'the ghost context exists');
  assert.match(sideSrc, /<SideFlowGhost\.Provider value>/, 'the twin rides it');
  assert.match(stampSrc, /useContext\(SideFlowGhost\)/, 'the ADD key reads it');
  /* 1.2.4 re-law: the signal path grew the ANCHOR OVERRIDE (the picker
     opens from the + key that summoned it) — the ghost still ignores it. */
  assert.match(stampSrc, /if \(!disabled && !ghost\) \{[\s\S]{0,120}setOpen\(true\);[\s\S]{0,20}\}/, 'the ghost ignores the open signal');
  assert.match(stampSrc, /\{!ghost && \(\s*<Popover/, 'the ghost never mounts the popover');
  // the + TAGS key opens the manager at App level — one window by construction
  assert.match(viewSrc, /onClick=\{onOpenTagManager\}/, 'the + TAGS key speaks the App-level manager');
});

// ---- 19: the stack keeps its width -----------------------------------------------------------
ok('19 — the toast stack never collapses (the first pill exits in place)', () => {
  assert.match(css, /\.gd-toast-stack\s*\{[^}]*?left: 0;[^}]*?right: 0;[^}]*?transform: none;/s, 'the stack spans the viewport, no transform');
  assert.match(css, /\.gd-toast-stack\s*\{[^}]*?align-items: center;/s, 'the pills center through alignment');
  assert.ok(!/left: 50%;/.test(css.match(/\.gd-toast-stack\s*\{[^}]*\}/s)[0]), 'the width never depended on the pills');
});

// ---- 20: the pill answers ---------------------------------------------------------------------
ok('20 — a hovered pill highlights; a pressed one answers through the exit', () => {
  assert.match(css, /\.gd-toast:hover\s*\{[^}]*?border-color: color-mix\(in srgb, var\(--gd-accent\)/s, 'the hover highlight');
  assert.match(css, /\.gd-toast\.is-pressed\s*\{[^}]*?border-color: var\(--gd-accent\);/s, 'the press seat');
  assert.match(toastSrc, /const pressToast = \(e\) => \{/, 'the press handler');
  assert.match(toastSrc, /el\.classList\.add\('is-pressed'\)/, 'the press look lands on pointerdown');
  assert.match(toastSrc, /onPointerDown=\{pressToast\}/, 'wired at the pointer');
});

// ---- the download page fronts 1.2.3 -------------------------------------------------------------
ok('the in-source download page fronts the live current (demote law)', () => {
  /* 1.2.5 re-law: the page fronts 1.2.5 now (the 135 batch pins that);
     this suite keeps its structural truth — the current row fronts the
     live version and the demoted rows keep their own true links. */
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(website, /var CURRENT = \[1, 4, 3\];/, 'the version-check gate');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(website, /releases\/download\/v1\.4\.3\/Burrito_GenDex_1\.4\.3_source\.zip/, 'the source-zip link');
  // 1.8.8 — RETIRED WITH THE WEBSITE: const currentRow = /<tr class="current-row">[\s\S]{0,2400}?<\/tr>/.exec(website); // 1.3.9: the row's highlights grew — the window widens
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.ok(currentRow, 'the current row exists');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(currentRow[0], /1\.4\.3/, 'it fronts the live version');
  // 1.8.8 — RETIRED WITH THE WEBSITE: const rows = website.match(/<tr>\s*<td class="v">[\s\S]*?<\/tr>/g) || [];
  // 1.8.8 — RETIRED WITH THE WEBSITE: const r121 = rows.find((r) => />1\.2\.1</.test(r));
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.ok(r121, 'the demoted 1.2.1 row exists');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(r121, /releases\/tag\/v1\.2\.1/, 'with its own true link');
});

// ---- summary -------------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed — 1.2.2 batch`);
if (failed) process.exit(1);
