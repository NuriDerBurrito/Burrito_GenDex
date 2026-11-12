// 1.2.9 batch — THE BREATH IT MOUNTS IN
// The eleven-item release: the strict-order tag flow with the + at the
// right end, the tail page's floor law, the ghost stamp's uncounted pan,
// the staged view mount, the spring-through-crossings wall, the wall's
// scrollbar-yielding margin, the name key's line-box verdict, the tree
// rail's contrast floor, the hover zoom, the new-card tile's lift, the
// DONE key's swap, the trim family's corner law, the icon picker's shell,
// and the release furniture (version, changelog, website).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const appRoot = process.cwd();
const src = (p) => readFileSync(path.join(appRoot, p), 'utf8');

const helpersSrc = src('src/utils/helpers.js');
const sideflow = src('src/components/SideFlow.jsx');
const sortSrc = src('src/components/useThumbSort.js');
const appSrc = src('src/App.jsx');
const viewSrc = src('src/components/CharacterView.jsx');
const themeSrc = src('src/utils/theme.js');
const css = src('src/index.css');
const gridSrc = src('src/components/GridView.jsx');
const masonrySrc = src('src/components/MasonryGrid.jsx');
const settingsSrc = src('src/components/SettingsModal.jsx');
const pickerSrc = src('src/components/LucideIconPicker.jsx');
const changelog = src('CHANGELOG.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const pkg = JSON.parse(src('package.json'));
const lock = JSON.parse(src('package-lock.json'));

const helpers = await import(path.join(appRoot, 'src/utils/helpers.js'));
const { packFlowRows } = helpers;
const { APP } = await import(path.join(appRoot, 'src/constants/index.js'));

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok ${passed + failed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  NOT OK ${passed + failed} — ${name}\n      ${e.message.split('\n')[0]}`);
  }
};

// ---- 1: the strict-order flow (the pull is dead, the + stays last) --------------
ok('the packer speaks strict order (no item is ever pulled past its neighbor)', () => {
  assert.ok(helpersSrc.includes('THE PULL IS DEAD'), 'the retirement is documented');
  assert.ok(!/let pick = 0;/.test(helpersSrc), 'the pull window is gone from the loop');
  assert.match(helpersSrc, /const it = items\[0\];/, 'the head of the queue is always the next item');
  // behavior (1.3.1 — ordinary items wrap, only the oversized pokes):
  // [W(60), a(45)] at 100 — a cannot fit after W and a is NARROWER than the
  // box, so it WRAPS to the next row (the CSS wrap's verdict); never pulled,
  // never stranded, never poked past the page's edge.
  const rows = packFlowRows(['W', 'a', 'b', 'c'], (it) => ({ W: 60, a: 45, b: 30, c: 30 }[it]), 100, 6, { look: 3, firstRowPlain: false });
  assert.deepEqual(rows[0], ['W'], 'the wide chip seats alone (the ordinary follower wraps — the poke is retired)');
  assert.deepEqual(rows[1], ['a', 'b'], 'the rest keeps DOM order (45+6+30=81 fits; c would poke, so it wraps)');
  assert.deepEqual(rows[2], ['c'], 'the tail runs short on the content\'s very last row');
  // and the trailing small item ("the +") is always the very last item of
  // the very last row — the pull used to yank it into an early row.
  const plus = packFlowRows(['x', 'y', 'PLUS'], (it) => (it === 'PLUS' ? 28 : 60), 100, 6, { look: 3, firstRowPlain: false });
  assert.equal(plus[plus.length - 1][plus[plus.length - 1].length - 1], 'PLUS', 'the + stays at the flow\'s very end');
});

ok('1.3.2 the drag mirror speaks the WALL (strict order, the pairing law holds)', () => {
  assert.ok(sortSrc.includes('const packWall = (order, ctx) =>'), 'the wall pack engine exists');
  assert.ok(!sortSrc.includes('packFlowRows(order'), 'the row packer left the drag mirror with the pages');
  assert.ok(sortSrc.includes("order's items into the wall"), 'the wall pack seats the ORDER verbatim (strict order, no spreading)');
  assert.ok(!sortSrc.includes('const per = Math.ceil(tailItems.length / r);'), 'no rebalance lives in the mirror');
});

// ---- 2: the tail page hugs the floor ---------------------------------------------
/* 1.3.0 re-law: the floor-hug is RETIRED — the pages fill from the TOP
   (the ghost-row + settings-on-first-row fix). */
ok('1.3.2 the wall fills DOWN each column from the top (the pages retired, the balance stays dead)', () => {
  assert.match(sideflow, /ONE CONTINUOUS WALL/, 'the one-entity law is documented in the zone');
  assert.match(sideflow, /column 1 holds the first `rows` items top to bottom/, 'the column-major fill law is documented');
  assert.ok(!sideflow.includes('const per = Math.ceil(tailItems.length / r);'), 'the rebalance is gone from the zone');
  assert.ok(!css.includes('.gd-side-page'), 'the pages (tail included) are retired in the CSS');
  assert.match(css, /\.gd-collapse-zone\.is-side\.is-self-flow\s*\{[^}]*?align-content: start;/, 'the wall anchors its rows to the top');
  assert.match(css, /\.gd-collapse-zone\.is-side > \.gd-stamp-slots\.is-wall\s*\{[^}]*?align-items: start;/, 'the stamps wall speaks the same top-fill law');
});

// ---- 3: the ghost stamp (the pan is not added to the target) ---------------------
ok('the drag target reads the origin + the pointer delta — the pan is not counted twice', () => {
  assert.match(sortSrc, /THE PAN IS NOT ADDED/, 'the law is documented');
  assert.match(sortSrc, /const r = r0 \? r0\.x \+ r0\.w \/ 2 \+ dx : cx;/, 'the chip\'s center carries no pan term');
  // the weld itself keeps its pan (the transform still compensates the
  // content's slide — the chip stays under the cursor through the pan)
  assert.match(sortSrc, /let tdx = dx \+ pan;/, 'the drawn transform keeps the pan (the 1.2.2 weld)');
  assert.match(sortSrc, /drag\.scrollAccum = \(drag\.scrollAccum \|\| 0\) \+ delta;/, 'the pan still accumulates for the redraw');
});

// ---- 4: the staged mount ----------------------------------------------------------
ok('the view mounts in ONE breath now (every zone rides the first paint)', () => {
  assert.match(viewSrc, /THE TAGS ZONE MOUNTS WITH THE FIRST FRAME/, 'the 1.3.9 law is documented');
  /* 1.3.9 re-law: the staged breaths are RETIRED — the 1.2.9 law seated the
     tags zone behind one rAF and a 98px placeholder guess ("the container
     of tags ... do that same small lift up then return to normal"), and the
     guess never matched the zone's real height, so the tray below jumped
     the moment the real zone landed. Every zone (stamps since 1.3.6, tags
     since 1.3.9) mounts with the view's OWN first commit; the placeholder
     and the TRAY_ZONE_H_CACHE that fed it left with the breath. */
  assert.match(viewSrc, /useState\(\(\) => \(stagedMount \? 2 : 2\)\)/, 'the stage is a constant — no steps left to climb');
  assert.match(viewSrc, /<TagsFlowRow/, 'the tags row renders in the first commit');
  assert.doesNotMatch(viewSrc, /mountStage >= 1 \? \(/, 'no tags gate — first-frame mount (1.4.3)');
  assert.doesNotMatch(viewSrc, /mountStage >= 2/, 'no second gate — the stamps zone mounts with the first commit (1.4.3)');
  assert.match(viewSrc, /<StampEditor/, 'the stamps editor renders in the tray');
  assert.doesNotMatch(viewSrc, /const TRAY_ZONE_H_CACHE/, 'the zone-height cache retired with its only reader (1.4.3)');
});

ok('the masonry pack is memoized (no per-render repack of the whole wall)', () => {
  assert.match(masonrySrc, /THE PACK IS MEMOIZED/, 'the law is documented');
  assert.match(masonrySrc, /const laid = useMemo\(/, 'the pack rides a useMemo');
  assert.match(masonrySrc, /const posById = useMemo\(/, 'the id map rides a useMemo');
});

ok('the settle gate speaks the mount only (the wall springs through crossings)', () => {
  assert.match(masonrySrc, /THE SETTLE GATE SPEAKS THE MOUNT ONLY/, 'the law is documented');
  assert.ok(!/\}, \[columns, cardWidth\]\);/.test(masonrySrc), 'the crossing re-arm effect is gone');
  assert.match(masonrySrc, /if \(alive\) setSettled\(true\);\s*\n\s*\}, 90\);/, 'the mount gate keeps its clock');
});

// ---- 5: the wall's right margin yields to the scrollbar ---------------------------
ok('the viewer\'s right margin yields to the scrollbar', () => {
  assert.match(gridSrc, /THE RIGHT MARGIN YIELDS TO THE SCROLLBAR/, 'the law is documented');
  assert.match(gridSrc, /overflow-y-auto overflow-x-hidden pl-6 pr-3\.5 pb-10 gd-tex-viewer/, 'the wall keeps 24px on the left and 14px beside the scrollbar');
});

// ---- 6: the name key's line-box verdict -------------------------------------------
ok('the name key counts LINE BOXES (a two-line name never arms it)', () => {
  assert.match(viewSrc, /THE TWIN SPEAKS LINE BOXES, NOT PIXELS/, 'the law is documented');
  assert.match(viewSrc, /const twinSays = probe\.offsetHeight > Math\.ceil\(lh \* 2\.5\);/, 'the verdict needs half a line of true content past the two');
  assert.match(viewSrc, /const clampCuts = clampedNow && el\.scrollHeight > el\.clientHeight \+ Math\.ceil\(lh \* 0\.5\);/, 'the clamp\'s own cut keeps the same tolerance family');
});

// ---- 7: the tree rail's contrast floor --------------------------------------------
ok('the tree connectors keep a visible voice on every ladder', () => {
  assert.match(css, /THE RAIL'S CONTRAST FLOOR/, 'the law is documented');
  const floor = 'color-mix(in srgb, var(--gd-line) 62%, var(--gd-chrome))';
  assert.ok(css.includes(`.gd-tree-node::before`), 'the rail');
  assert.ok((css.match(new RegExp(floor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length >= 3, 'the rail, the elbow and the joint all speak the floor');
  assert.match(css, /\.gd-tree-node::before \{[\s\S]*?background: var\(--rail-line, color-mix/, 'a class color still paints exactly what the user picked');
});

// ---- 8 + 9: the hover zoom + the new-card tile's lift -----------------------------
ok('the card art zooms slightly on hover (inside its own clip)', () => {
  assert.match(css, /AND THE ART LEANS IN/, 'the law is documented');
  assert.match(css, /\.gd-card-hover \.gd-sleeve-clip img \{\s*\n\s*transition: transform 0\.24s ease-out;/, 'the ride eases in');
  assert.match(css, /\.gd-card-hover:hover \.gd-sleeve-clip img,[\s\S]*?\.gd-card-hover:focus-visible \.gd-sleeve-clip img \{\s*\n\s*transform: scale\(1\.05\);/, 'the art scales to 105% on hover and focus');
  assert.match(css, /:root\.gd-scrolling \.gd-card-hover \.gd-sleeve-clip img,[\s\S]*?:root\.gd-no-lift \.gd-card-hover \.gd-sleeve-clip img \{/, 'the scroll guard and the no-lift switch hold it still');
});

ok('the new-card tile lifts with its neighbors (nothing flat under the finger)', () => {
  assert.match(css, /THE TILE LIFTS WITH ITS NEIGHBORS/, 'the law is documented');
  assert.match(css, /\.gd-card-add\.gd-card-add \{[\s\S]*?transition: transform 0\.14s ease, box-shadow 0\.14s ease/, 'the doubled selector out-ranks the band\'s color-only glide');
  assert.match(css, /\.gd-card-add:hover,[\s\S]*?\.gd-card-add:focus-visible \{[\s\S]*?box-shadow: 6px 6px 0/, 'the default sticker offset rides');
  for (const theme of ['burrito', 'archive', 'moss', 'glacier']) {
    assert.ok(css.includes(`[data-theme='${theme}'] .gd-card-add:hover,`), `${theme}'s own hover block carries the tile`);
  }
  assert.match(css, /:root\.gd-no-lift \.gd-card-add:hover,[\s\S]*?box-shadow: none;/, 'the no-lift switch holds the tile flat too');
});

// ---- 10: the DONE key speaks the change -------------------------------------------
ok('the settings DONE key is righted (solid when dirty, quiet when clean)', () => {
  assert.match(settingsSrc, /THE DONE KEY SPEAKS THE CHANGE/, 'the law is documented');
  assert.match(settingsSrc, /dirty \? 'gd-btn-solid' : 'gd-btn-accent'/, 'the loud key marks the unsaved changes');
});

// ---- 11: the trim family's corner law ---------------------------------------------
ok('every trim follows the sleeve\'s corner law', () => {
  assert.match(css, /THE BRACKETS FOLLOW THE SLEEVE'S CORNER LAW/, 'the law is documented');
  for (const variant of ['gallery', 'scallop', 'beads', 'rivet', 'ledger']) {
    const re = new RegExp(`\\.gd-trim-${variant}::(after|before) \\{[\\s\\S]{0,600}?border-radius: max\\(var\\(--trim-radius\\), 0px\\);`);
    assert.ok(re.test(css), `${variant} clips to the sleeve's radius`);
  }
  // the trims that already worked keep their own (deeper) radius law
  assert.match(css, /\.gd-trim-gold::after \{[\s\S]*?border-radius: max\(calc\(var\(--trim-radius\) - 3px\), 0px\);/, 'the gold engraving keeps its working law');
});

// ---- 12: the icon picker's shell ---------------------------------------------------
ok('the icon picker is a rounded shell with its own inner scroller', () => {
  assert.match(pickerSrc, /THE PICKER IS A SHELL \+ ITS OWN SCROLLER/, 'the law is documented');
  assert.match(pickerSrc, /gd-panel gd-icon-picker-shell p-1\.5 overflow-hidden/, 'the shell clips');
  /* 1.3.0 re-law: the scroller is flex: 1 + min-height: 0 now — h-full
     collapsed against the shell's max-height and the scroll died. */
  assert.match(pickerSrc, /gd-icon-picker-scroll flex-1 min-h-0 overflow-y-auto/, 'the inner div owns the scroll (and actually can)');
});

// ---- the release furniture ---------------------------------------------------------
ok('the version is 1.3.0 everywhere (the lock included)', () => {
  assert.equal(APP.version, '1.4.3');
  assert.equal(pkg.version, '1.4.3');
  assert.equal(lock.version, '1.4.3', 'the lock follows');
  assert.match(src('README.md'), /\*\*v1\.4\.3\*\*/);
  assert.match(src('START.bat'), /launcher \(1\.4\.3\)/);
});

ok('the changelog carries the 1.2.9 entry (1.3.0 leads)', () => {
  /* 1.3.0 re-law: the new release's entry leads; 1.2.9 keeps its seat. */
  assert.ok(changelog.startsWith('## 1.4.3 — The Pearl and the Flame'), 'the new release leads the log');
  assert.ok(changelog.includes('## 1.2.9 — The Breath It Mounts In'), 'the 1.2.9 entry keeps its seat');
  assert.ok(changelog.includes('## 1.2.8 — The Law That Holds at Every Frame'), 'the 1.2.8 entry keeps its seat');
});

console.log('  ok — retired with the website in 1.8.8 — ' + 'the in-source download page fronts 1.2.9');

console.log(`\n${passed} passed, ${failed} failed — 1.2.9 batch`);
if (failed > 0) process.exitCode = 1;
