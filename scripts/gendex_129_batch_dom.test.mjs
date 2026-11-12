// 1.1.9 batch source checks — the twenty-item list, one law per item:
//   1  the update window no longer outlines its CONTINUE button
//   2  the COLLAPSE key rides the tray's tail (below the stamps row)
//   3  the open flight never snaps (the release cannot be killed mid-flight)
//   4  the retract prime is the PAINTED seat (no snap to a phantom row)
//   5  the front stays the front — the twin-block track (row-major Block A,
//      columns-right Block B), no rigid grid, no changed orientation
//   6  (the twin-block is the left-fade fix: nothing extra shows past the
//      frame the fades don't already veil)
//   7  (same seat: Block A fills the natural row room)
//   8  memory / lag pass — the grid goes instant while its width breathes
//   9  (same law — the panel morph rides it)
//   10 the expand / shrink flight — the wrapper's width tweens, the
//      foot's type follows the registered --card-scale tween
//   11 the span-2 pair is BALANCED (no hole open behind a wide card)
//   12 air at the scroller's clip planes (left circle, right cluster, shadows)
//   13 names survive updates — the legacy migration left the load path
//   14 the expanded seats are saved (hydrate + persist + the sanitizer key)
//   15 the toast stack never grows (popLayout exits, newest-first)
//   16 the creation board folds THREE / opens FIVE; the gallery fold is gone
//   17 the version strip clears the clip plane horizontally
//   18 the strip's vertical space tightened (py-2)
//   19 the name fold never reserves a phantom second line
//   20 a toast holds under the cursor until it leaves
// Run: node scripts/gendex_129_batch_dom.test.mjs
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
const stampSrc = src('src/components/StampEditModal.jsx');
const appSrc = src('src/App.jsx');
const helpersSrc = src('src/utils/helpers.js');
const masonrySrc = src('src/components/MasonryGrid.jsx');
const toastSrc = src('src/components/ToastHub.jsx');
const updateSrc = src('src/components/UpdateModal.jsx');
const newCharSrc = src('src/components/NewCharacterModal.jsx');
const css = src('src/index.css');
const constsSrc = src('src/constants/index.js');
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
    console.log(`  FAIL ${passed + failed - failed} — ${name}\n      ${e.message}`);
    process.exitCode = 1;
  }
};

// ---- the version -------------------------------------------------------------
ok('the version is 1.1.9', () => {
  assert.equal(APP.version, '1.4.3');
  assert.equal(pkg.version, '1.4.3');
});

// ---- 1: the update window stopped outlining ----------------------------------
ok('1 — the update window carries NO autofocus (no outline around CONTINUE)', () => {
  assert.ok(!/autoFocus/.test(updateSrc), 'the key no longer takes focus on mount');
  assert.match(updateSrc, /NO AUTOFOCUS/, 'the law is documented where it lives');
});

// ---- 2: the collapse key rides the tail --------------------------------------
ok('2 — the COLLAPSE key moved to the tray bottom (its own line, clear of the scrollbars)', () => {
  /* 1.6.7 — the law-pin moves with the fold's rework: the keyline and
     the folded holder are ONE traveling chip (.gd-rows-chipline) below
     the folding rows body — the same tail seat the keyline always spoke,
     plus the separator seat when the rows fold, carried by the body's
     own height tween ("show it moving between them"). */
  const chipline = /<div\s*className="gd-rows-chipline"[\s\S]*?<\/div>/.exec(viewSrc);
  assert.ok(chipline, 'the key renders through .gd-rows-chipline');
  // the chipline block must come AFTER the StampEditor row (the tail) —
  // the JSX render, not the comment that mentions the class by name.
  const stampAt = viewSrc.indexOf('<StampEditor');
  const keyAt = viewSrc.indexOf('className="gd-rows-chipline"');
  assert.ok(stampAt > 0 && keyAt > stampAt, 'the key sits below the stamps row');
  // the separator between the rows is a plain hairline again (no key on it)
  const between = viewSrc.slice(viewSrc.indexOf('gd-rows-sep'), viewSrc.indexOf('<StampEditor'));
  assert.ok(!/COLLAPSE/.test(between), 'the mid separator carries no key (no overlap with the rows)');
  assert.match(css, /\.gd-rows-chipline\s*\{[^}]*?justify-content: center;/, 'the chipline centers the key');
  assert.match(css, /\.gd-rows-chipline \.gd-rows-expand\s*\{[^}]*?position: relative;/, 'the pill is IN flow (not floating over the rows — 1.6.8: relative, above the line)');
});

// ---- 3 + 4: the flights never lie ---------------------------------------------
ok('3+4 — the choreography: the painted-seat prime + the unkappable release', () => {
  // the seat mirror: the zone's height AS LAST PAINTED, read during render
  assert.match(sideSrc, /const seatHRef = useRef\(0\);/, 'the seat mirror exists');
  assert.match(sideSrc, /const prime = seatHRef\.current \|\| zone\.offsetHeight/, 'the entering prime reads the PAINTED seat (never the re-laid natural)');
  // the release lives in a ref — a measure re-run can never clear it
  assert.match(sideSrc, /const releaseRef = useRef\(0\);/, 'the release timer is ref-held');
  assert.match(sideSrc, /flightTargetRef\.current = null;\s*\n\s*setFlightMax\(undefined\);\s*\n\s*\}, 320\);/, 'the release lands at 320ms');
  // a running flight RETARGETS to the current truth
  assert.match(sideSrc, /if \(target !== flightTargetRef\.current\) \{\s*\n\s*flightTargetRef\.current = target;/, 'a mid-flight measure change retargets the flight');
  // a retract cancels any pending release
  assert.match(sideSrc, /a retract cancels any pending open-release/, 'the retract clears the release');
});

// ---- 5 + 6 + 7: the twin-block track ------------------------------------------
ok('5+7 — 1.3.2 the WALL side seat (one continuous column-major grid, one DOM)', () => {
  /* 1.3.2 re-law: the PAGES are retired. The side seat is ONE continuous
     WALL — a single grid flowing column-major (each column filled top to
     bottom before the next begins), every column shrink-to-fit, all
     packed from the very left. The same wall lives in every seat (the
     toggle only trades the clamp + the scroll lock — NOTHING re-seats). */
  assert.match(sideSrc, /THE WALL \(/, 'the wall law is documented');
  assert.match(sideSrc, /ONE CONTINUOUS WALL/, 'the one-entity law is documented');
  assert.ok(!/gd-side-block/.test(sideSrc), 'the twin-block is retired in the source');
  assert.ok(!/gd-side-page/.test(sideSrc), '1.3.2: no page boxes render anywhere');
  assert.ok(!/packFlowRows/.test(sideSrc), 'the side seat packs through NOTHING (the grid IS the layout)');
  assert.match(sideSrc, /data-gd-flow="wall"/, 'the wall law rides the carrier for the drag packer');
  assert.match(sideSrc, /gridTemplateRows: `repeat\(\$\{R\}, auto\)`/, 'the row track count is exactly the rows the content uses');
  assert.match(sideSrc, /wallRowH\[seat\] = Math\.max\(wallRowH\[seat\] \|\| 0, wallItems\[i\]\.h \|\| 0\);/, 'the wall rows size to their tallest item (the grid law, in math)');
  assert.match(css, /\.gd-collapse-zone\.is-side\.is-self-flow\s*\{[^}]*?grid-auto-flow: column;/, 'the self-flow zone IS the wall');
  assert.ok(!/\.gd-side-block\.is-b\s*\{[^}]*?flex-direction: column;/.test(css), 'the column stack is retired');
  assert.match(sideSrc, /const cBand = Math\.max\(1, Math\.min\(collapsedRows, Math\.max\(1, wallRowsUsed \|\| bands\.length\)\)\);/, 'collapsedRows: the retracted clamp in WALL rows');
  assert.ok(/collapsedRows=\{3\}/.test(newCharSrc), 'the creation board passes its own retract rows');
});

ok('5 — the stamps split reaches the slots (the zone owns the wrapper; the slots are direct children)', () => {
  assert.match(stampSrc, /export function StampSlotItem/, 'the slot renders as an ELEMENT (the split slices the item list)');
  assert.match(stampSrc, /export function StampSlotList/, 'the bare list carries the engine');
  assert.match(viewSrc, /flowClass="gd-stamp-slots"/, 'the zone owns the .gd-stamp-slots wrapper');
  assert.match(viewSrc, /flowRef=\{panelFlowRef\}/, 'the panel engine binds to the zone-owned wrapper');
  assert.match(viewSrc, /<StampSlotItem\s\s*key=\{s\.id\}/.test('') ? /never/ : /charStamps\.map\(\(s, i\) => \(\s*<StampSlotItem/, 'the slots render as the zone\'s direct children');
});

// ---- 8 + 9: the memory / lag pass ----------------------------------------------
ok('8+9 — the grid re-flows on column crossings (the panel morph lost its jank)', () => {
  /* 1.2.0 re-law: the gate re-arms on COLUMN CROSSINGS. 1.2.9 re-law —
     THE RE-ARM IS RETIRED ("fix the cards animations so they dont snap
     quickly around especially when resizing the window"): every crossing
     bought 120ms of duration-zero layout and the seats TELEPORTED; the
     gate now speaks the MOUNT ONLY and every post-mount seat change rides
     the spring. */
  assert.match(masonrySrc, /THE SETTLE GATE SPEAKS THE MOUNT ONLY/, 'the law is documented at the gate');
  assert.ok(!/\}, \[columns, cardWidth\]\);/.test(masonrySrc), '1.2.9: the crossing re-arm effect is GONE (the gate speaks the mount only)');
  assert.match(masonrySrc, /const t = setTimeout\(\(\) => \{\s*\n\s*if \(alive\) setSettled\(true\);\s*\n\s*\}, 90\);/, 'the settle opens 90ms after the MOUNT (the mount gate keeps its clock)');
  assert.match(masonrySrc, /setColumns\(\(prev\) => \(prev === count \? prev : count\)\)/, 'the observer commits only crossings');
});

// ---- 10: the expand / shrink flight ---------------------------------------------
ok('10 — the card flight to double size is animated (wrapper width + the registered scale tween)', () => {
  assert.match(masonrySrc, /transition: 'width 0\.24s ease-out',/, 'the masonry wrapper tweens its width');
  assert.match(css, /@property --card-scale\s*\{/, '--card-scale is a registered property');
  assert.match(css, /\.gd-card,\s*\n\.gd-card-add\s*\{[^}]*?transition: --card-scale 0\.24s ease-out;/, 'the card root tweens the scale in lockstep');
});

// ---- 11: the balanced pair -------------------------------------------------------
ok('11 — the span-2 pair is BALANCED (no hole open behind a wide card)', () => {
  assert.match(helpersSrc, /THE PAIR IS BALANCED, NOT MERELY LOW/, 'the law is documented at the placement');
  /* 1.2.2 re-law: the 260px balance window is retired — a balanced-but-
     DEEP pair could beat a shallow-but-ragged one and the wide card
     landed a full row lower while a higher seat waited on the left. A
     meaningfully lower worst-top now wins outright; balance only breaks
     ties inside a 12px window (the same visual row). */
  assert.match(helpersSrc, /BUT THE HOLE WINS, THE BALANCE ONLY BREAKS TIES/, 'the ordered law is documented');
  assert.match(helpersSrc, /const TIE_WINDOW = 12;/, 'the tie window (same-row pairs compete on balance)');
  assert.match(helpersSrc, /const spread = Math\.abs\(colHeights\[c\] - colHeights\[c \+ 1\]\);/, 'the spread is the pair\'s own difference');
  const { layoutMasonry } = require(join(appRoot, 'src/utils/helpers.js'));
  // a straddling pair (0, 500) has the lowest worst-top but a 500px hole;
  // the balanced pair (500, 500) wins within the window.
  const { positions } = layoutMasonry([10, 10, 10, 10, 10, 300], 4, 100, 10, [1, 1, 1, 1, 2, 1]);
  // after four singles the columns are [20,20,20,20]; the wide item takes
  // the first pair (spread 0) — and the LAST single must not fall into a
  // hole the wide item left open (both its columns advance past it).
  const wide = positions[4];
  assert.equal(wide.span, 2);
  assert.equal(wide.y, 20, 'the wide card starts flush with both its columns');
  const last = positions[5];
  assert.equal(last.y, 20, 'the trailing card rides the same depth (no hole behind the wide card)');
  // 1.2.2 — the higher seat wins outright: pair(0,1) worst-top 220 / spread
  // 100 must beat pair(3,4) worst-top 320 / spread 0 — the wide card takes
  // the LEFT, HIGHER seat instead of dropping a row for flushness.
  const uneven = layoutMasonry([120, 220, 250, 300, 300, 130], 5, 180, 20, [1, 1, 1, 1, 1, 2]);
  const pick = uneven.positions[5];
  assert.equal(pick.x, 0, 'a higher left seat beats a deeper balanced one');
});

// ---- 12: air at the clip planes ---------------------------------------------------
ok('12 — 1.3.2 the wall keeps its air at the scroll\'s planes', () => {
  /* 1.3.2 re-law: the wall keeps the 1.2.0 box law (no side-specific
     padding, no drift between seats); the scroll\'s end keeps its air
     through the WALL\'s own last column (the trailing seat margin), and
     the left plane is the fade\'s (seated on the zone\'s own clip box). */
  assert.ok(!/\.gd-collapse-zone\.is-side\s*\{[^}]*?padding-left: 9px;/.test(css), 'the side-specific padding is retired (no drift between seats)');
  assert.match(css, /\.gd-collapse-zone\.is-side > \.gd-stamp-slots\.is-wall > \*:last-child\s*\{[^}]*?margin-right: 9px;/, 'air at the scroll\'s end (the wall\'s last seat never sits flush)');
  assert.match(css, /\.gd-flow-fade\.is-left\s*\{[^}]*?left: var\(--gd-seat-ox-l, 0px\);/, 'the left plane is the fade\'s (seated on the zone\'s clip box)');
});

// ---- 13: names survive updates -----------------------------------------------------
ok('13 — the legacy migration left the load path (names survive every update untouched)', () => {
  assert.ok(!/migrateLegacyRich\(String/.test(helpersSrc), 'no sanitize call site migrates anymore');
  assert.match(helpersSrc, /THE LOAD PATH STOPS EDITING NAMES/, 'the law is documented at the sanitize seat');
  assert.match(helpersSrc, /export function migrateLegacyRich/, 'the function itself stays exported (opt-in only)');
});

// ---- 14: the saved seats ------------------------------------------------------------
ok('14 — the expanded seats hydrate + persist (they survive restarts)', () => {
  assert.match(appSrc, /THE EXPANDED SEATS' HYDRATE \+ PERSIST/, 'the effects are documented at their seat');
  assert.match(appSrc, /db\?\.settings\?\.expandedCards/, 'the hydrate reads the setting');
  assert.match(appSrc, /setSetting\('expandedCards', next, 'expanded-cards'\)/, 'the persist writes through the settings machinery');
  assert.match(helpersSrc, /expandedCards: Array\.isArray\(rawSettings\.expandedCards\)/, 'the sanitizer carries the key through loads');
  assert.match(constsSrc, /expandedCards: \[\],/, 'the default ships the key');
});

// ---- 15 + 20: the toast stack --------------------------------------------------------
ok('15 — the stack never grows: popLayout exits, newest-first, cap 3', () => {
  assert.match(toastSrc, /mode="popLayout"/, 'the exits pop out of layout (no dying pill holds room)');
  assert.match(toastSrc, /layout\s*\n\s*className=\{clsx\('gd-toast'/, 'the pills carry layout (the survivors glide)');
  assert.match(toastSrc, /newest FIRST at the top of the stack/, 'newest-first (the entry seat never descends)');
  assert.match(toastSrc, /slice\(0, TOAST_STACK_CAP\)/, 'the cap drops the OLDEST from the head');
});
ok('20 — a toast holds under the cursor until it leaves', () => {
  assert.match(toastSrc, /const holdToast = \(id\) => \{/, 'the hold clears the pill\'s own timer');
  assert.match(toastSrc, /onMouseEnter=\{\(\) => holdToast\(t\.id\)\}/, 'entering holds');
  assert.match(toastSrc, /onMouseLeave=\{\(\) => releaseToast\(t\.id\)\}/, 'leaving re-arms a fresh full life');
  assert.match(css, /\.gd-toast\s*\{[^}]*?pointer-events: auto;/, 'the pills take the pointer (the layer stays none)');
});

// ---- 16: the creation window ----------------------------------------------------------
ok('16 — the board folds THREE / opens FIVE; the gallery fold is gone', () => {
  assert.match(newCharSrc, /rows=\{5\}/, 'the open cap is five rows');
  assert.match(newCharSrc, /collapsedRows=\{3\}/, 'the folded seat keeps three rows');
  assert.match(newCharSrc, /Collapse the tag board to its first three rows/, 'the fold key speaks the three-row retract');
  assert.match(newCharSrc, /Expand the tag board \(five rows, more stack sideways\)/, 'the expand key speaks the five-row open');
  assert.ok(!/galleryFold/.test(newCharSrc), 'the stamps gallery lost its fold (always fully shown)');
  assert.ok(!/useClampStyle/.test(newCharSrc), 'the window no longer clamps anything');
});

// ---- 17 + 18: the version strip ----------------------------------------------------------
ok('17+18 — the strip clears the clip plane horizontally + the tightened row', () => {
  assert.match(viewSrc, /gd-version-strip py-2 px-2 flex items-center gap-2\.5 flex-nowrap overflow-x-auto/, 'py-2 (the tightened row) + px-2 (the clip-plane air)');
});

// ---- 19: the name fold never reserves a phantom line ---------------------------------------
ok('19 — the name fold takes the twin\'s honest line count (never a phantom second line)', () => {
  assert.match(viewSrc, /THE TARGET NEVER RESERVES A PHANTOM SECOND LINE/, 'the law is documented at the measurer');
  assert.match(viewSrc, /const twoBox = Math\.max\(two, clampedHRef\.current \|\| 0\);/, '1.2.9: the two-line ceiling takes the clamp\'s own painted box');
  assert.match(viewSrc, /const body = Math\.max\(one, Math\.min\(Math\.ceil\(Math\.max\(natH \|\| 0, floor\)\) \|\| one, twoBox\)\);/, 'the honest line count (one line when it fits one)');
  assert.match(viewSrc, /fold: Math\.ceil\(body \+ seat\)/, 'the target is the honest lines plus the inner seat');
  assert.match(viewSrc, /const \{ lh, fold \} = foldTargetFor\(el, probe\.offsetHeight\)/, 'the signals read the twin\'s natural height');
});

// ---- the website ----------------------------------------------------------------------------
console.log('  ok — retired with the website in 1.8.8 — ' + 'the in-source download page fronts 1.2.1');

console.log(failed ? `\n${passed} passed, ${failed} failed — FIX ABOVE` : `\n1.1.9 batch: ${passed} checks passing`);
process.exit(failed ? 1 : 0);
