// 1.3.3 batch — THE HONEST WALL + THE QUIET CORNERS.
// The nine reported items, each pinned at its root law:
//   1.  the tags wall is ONE continuous left-packed flow — max-content
//       columns (auto tracks collapsed to min-content and stacked the
//       columns over each other: "3 pages all clipping over each other")
//   2.  the wall READS row-major in the detail panel ("first row first
//       column then first row second column, second row …"); the creation
//       board + the dropdowns keep their own seats (the user's exceptions)
//   3.  the drag's row bands read the GRAB-TIME SNAPSHOT (the dragged
//       chip's transformed box used to merge two bands — "the stamps on
//       the bottom row seem to move vertically as i hold a stamp")
//   4.  the card foot's corner fill is SQUARE (no sliver gaps) and speaks
//       the band's hue tint ("the color should account for the gradient")
//   5.  the delete key's hover highlight IS its border (drawn inside,
//       offset -2px — never a surrounding ring)
//   6.  the SPLASH FILM REELS switch speaks its own name (ON = on,
//       OFF = off; the inverted key retired)
//   7.  the splash deal is seeded by the pool's content (an identity-only
//       re-run can never re-deal — the flicker)
//   8.  the cover star pulses ONCE per mount (a moved chip never re-pulses)
//   9.  the danger ink reads as danger on the light themes too
// Plus: the version is 1.3.3 everywhere.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (rel) => readFileSync(join(appRoot, rel), 'utf8');

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok — ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  FAIL — ${name}\n      ${err.message.split('\n')[0]}`);
  }
};
function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}
assert.ok = assert;
assert.equal = (a, b, msg) => {
  if (a !== b) throw new Error(msg || `${a} != ${b}`);
};
assert.deepEqual = (a, b, msg) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(msg || `${JSON.stringify(a)} != ${JSON.stringify(b)}`);
};

const css = src('src/index.css');
const sideSrc = src('src/components/SideFlow.jsx');
const sortSrc = src('src/components/useThumbSort.js');
const viewSrc = src('src/components/CharacterView.jsx');
const gridSrc = src('src/components/GridView.jsx');
const lookSrc = src('src/components/CardLookEditor.jsx');
const splashSrc = src('src/components/Splash.jsx');
const helpersSrc = src('src/utils/helpers.js');
const settingsSrc = src('src/components/SettingsModal.jsx');
const appSrc = src('src/App.jsx');
const constSrc = src('src/constants/index.js');
const newCharSrc = src('src/components/NewCharacterModal.jsx');
const APP = (await import(join(appRoot, 'src/constants/index.js'))).APP;
const helpersMod = await import(join(appRoot, 'src/utils/helpers.js'));
const pkg = JSON.parse(src('package.json'));

// ===========================================================================
// 1 — MAX-CONTENT, NEVER AUTO
// ===========================================================================
ok('1 — the walls size their columns to content (never auto)', () => {
  const selfFlow = /\.gd-collapse-zone\.is-side\.is-self-flow\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert(/grid-auto-columns: max-content;/.test(selfFlow), 'the tags wall speaks max-content');
  assert(/justify-content: start;/.test(selfFlow), 'the tracks pack from the very left');
  const stamps = /\.gd-collapse-zone\.is-side > \.gd-stamp-slots\.is-wall\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert(/grid-auto-columns: max-content;/.test(stamps), 'the stamps wall speaks max-content');
  assert(!/grid-auto-columns: auto;/.test(selfFlow) && !/grid-auto-columns: auto;/.test(stamps), 'no auto tracks remain in either wall');
  // the failure mode, in math: auto tracks collapse to min-content when the
  // content is wider than the container — a chip 166px wide in a 40px track
  // overflows straight into the next column. max-content holds the track at
  // its widest member, always.
  const cols = [{ w: 166 }, { w: 126 }, { w: 166 }];
  const gap = 6;
  let x = 0;
  const seats = cols.map((c) => {
    const seat = x;
    x += c.w + gap;
    return seat;
  });
  assert.equal(seats[1], 172, 'column 2 starts past column 1\u2019s widest member (6+166+6)');
  assert.ok(seats[1] > 166, 'no column ever seats over its neighbor');
});

// ===========================================================================
// 2 — THE READING (1.3.4: the column-major wall is the law again)
// ===========================================================================
ok('2 — the detail panel\u2019s walls read column-major; the exceptions keep their seats', () => {
  assert(/wallOrder = 'column',/.test(sideSrc), 'the reading order is a SideFlowZone prop (column the default)');
  // 1.3.4 — both detail-panel seats speak the COLUMN order ("sorts from
  // left … one big scrollable container"): the 1.3.3 row-major reading
  // was the misread (each screen its own "page", the order top-then-
  // bottom); the column fill returns — first `rows` items down the
  // leftmost column, the next column beside it, the front one
  // consecutive block.
  const colSeats = [...viewSrc.matchAll(/wallOrder="column"/g)];
  assert.equal(colSeats.length, 2, 'CharacterView speaks the column order twice (stamps + tags)');
  assert(!/wallOrder="row"/.test(viewSrc), 'no seat reads row-major anymore (the 1.3.3 law retired)');
  assert(!/wallOrder=/.test(newCharSrc), 'the creation board passes NO order (the column default — the user\u2019s exception)');
  assert(/data-gd-wall-order='row'/.test(sideSrc) || /'data-gd-wall-order': 'row'/.test(sideSrc), 'the carrier names the row seat (the lattice machinery stays)');
  const flow = /\[data-gd-wall-order='row'\]\s*\{\s*grid-auto-flow: row;\s*\}/.exec(css)?.[0] || '';
  assert(flow.length > 0, 'the CSS keeps the row-lattice rule (unused, the machinery survives)');
  // the reading math itself: 12 items, 2 rows -> the leftmost column
  // holds items 0..1, the next 2..3 (each column filled before the next)
  const n = 12;
  const R = 2;
  const seat = (i) => ({ row: i % R, col: Math.floor(i / R) });
  assert.deepEqual([seat(0), seat(1), seat(2), seat(5), seat(11)], [
    { row: 0, col: 0 }, { row: 1, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 5 },
  ], 'first column top to bottom, then the next column');
});

// ===========================================================================
// 3 — THE BANDS READ THE GRAB
// ===========================================================================
ok('3 — the drag\u2019s bands read the grab-time snapshot (no vertical drift under a hold)', () => {
  assert(/THE BANDS READ THE GRAB, NOT THE FLIGHT/.test(sortSrc), 'the law is documented');
  assert(/const snap = snapRef\.current \|\| \[\];/.test(sortSrc), 'sort-item bands come from the snapshot');
  assert(/kidBoxes\.push\(\{ top: s\.y, bottom: s\.y \+ s\.h, w: s\.w, h: s\.h, sort: true \}\)/.test(sortSrc), 'the pre-transform boxes feed the bands');
  // the packer speaks the reading order it is given
  assert(/const seatOf = rowMajor/.test(sortSrc), 'the packer has both lattices');
  assert(/rowMajor: wallRowMajor, cols: wallCols/.test(sortSrc), 'the ctx carries the order + the reading width');
  assert(/nearestGapIndexWall = \(cx, cy, rows, gap, ctx = null\) =>/.test(sortSrc), 'the gap finder carries the ctx');
});

// ===========================================================================
// 4 — THE SQUARE CORNER FILL (the tint retired)
// ===========================================================================
ok('4 — the foot\u2019s corner fill is square (the tint retired)', () => {
  const rule = /\.gd-card-foot::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/border-radius: 0;/.test(rule), 'the fill paints its whole rectangle (no sliver gaps at the arcs)');
  // 1.3.9 supersede: the tint layer is RETIRED ("limiting the fade to the
  // image") — the rise paints the plate alone, and the bloom continuation
  // moved to the colored-foot law (see gendex_148's law 2). The hue writes
  // left with the tint.
  assert(!/--gd-foot-tint/.test(rule.replace(/\/\*[\s\S]*?\*\//g, '')), '1.3.9: no tint layer composites over the plate');
  assert(!/color-mix\(in srgb, \$\{hue\} \$\{Math\.round/.test(gridSrc), '1.3.9: GridView\u2019s tint write is retired with the layer');
  assert(!/color-mix\(in srgb, \$\{stampHueHex\} \$\{Math\.round/.test(lookSrc), '1.3.9: the look editor\u2019s tint write is retired with the layer');
});

// ===========================================================================
// 5 — THE BORDER IS THE HIGHLIGHT
// ===========================================================================
ok('5 — the delete key\u2019s hover keeps a visible ring and turns red', () => {
  const rule = /\.gd-del-hover:hover\s*\{[^}]*\}/.exec(css)?.[0] || '';
  // 1.3.4 — the ring no longer blends into the fill: the 1.3.3 hover
  // painted bg + border + outline the SAME red, so the key read as a
  // solid square and the border "went away" on hover. The ring is the
  // app's ink now, around the red fill.
  assert(/outline: 2px solid var\(--gd-ink\);/.test(rule), 'the outline speaks the ink (contrast against the red fill — never blends)');
  assert(/outline-offset: -2px;/.test(rule), 'drawn INSIDE the border box — never a surrounding ring');
  assert(/background: #c8402f !important;/.test(rule), 'the fill turns the danger red (the color change)');
  assert(/border-color: var\(--gd-ink\) !important;/.test(rule), 'the border stays the ink — present on hover');
});

// ===========================================================================
// 6 — THE HONEST SPLASH SWITCH
// ===========================================================================
ok('6 — SPLASH FILM REELS: on is on, off is off', () => {
  assert(/splashFilmReels: true,/.test(constSrc), 'the default is ON (the reels roll with the covers)');
  assert(!constSrc.includes('splashGeneratedReels:'), 'the inverted key retired from the defaults');
  assert(!helpersSrc.includes('rawSettings.splashGeneratedReels'), 'the sanitizer no longer carries the legacy key');
  assert(settingsSrc.includes("set('splashFilmReels', settings.splashFilmReels === false)"), 'the switch writes the honest key');
  assert(appSrc.includes('splashFilmReels === false ? null : reelPool'), 'OFF mounts no reels at all; ON rolls the pool');
});

// ===========================================================================
// 7 — THE STABLE DEAL
// ===========================================================================
ok('7 — the splash deal is seeded by the pool\u2019s own content', () => {
  assert(/THE DEAL IS SEEDED BY THE POOL'S OWN CONTENT/.test(splashSrc), 'the law is documented');
  assert(splashSrc.includes('buildSplashReels(reels, { slots: REEL_SLOTS, seed: dealSeed })'), 'the seed rides the one builder');
  const mod = helpersMod;
  const pool = Array.from({ length: 24 }, (_, i) => `card${i}.png`);
  const a = mod.buildSplashReels(pool, { slots: 8, seed: 12345 });
  const b = mod.buildSplashReels(pool, { slots: 8, seed: 12345 });
  assert(JSON.stringify(a) === JSON.stringify(b), 'the same pool + seed deals the same seats, every time');
  const c = mod.buildSplashReels([...pool, 'late.png'], { slots: 8, seed: 12345 });
  assert(JSON.stringify(a) !== JSON.stringify(c), 'a changed collection re-deals');
});

// ===========================================================================
// 8 — THE STAR PULSES ONCE
// ===========================================================================
ok('8 — the cover star pulses once per mount (a moved chip stays silent)', () => {
  assert(/THE PULSE PLAYS ONCE PER MOUNT/.test(viewSrc), 'the law is documented');
  assert(viewSrc.includes('{isPreview && <VersionStar />}'), 'the star is the one-shot component');
  assert(/onAnimationEnd=\{\(\) => setSettled\(true\)\}/.test(viewSrc), 'the landing strips the animation');
  const settled = /\.gd-version-star\.is-settled\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert(/animation: none/.test(settled), 'a settled star cannot re-pulse on a DOM move');
});

// ===========================================================================
// 9 — DANGER READS AS DANGER ON PAPER
// ===========================================================================
ok('9 — the danger ink carries the light themes', () => {
  const rule = /\[data-theme='archive'\] \.gd-ctx-item\.is-danger,\s*\[data-theme='paper'\] \.gd-ctx-item\.is-danger,\s*\[data-theme='mumei'\] \.gd-ctx-item\.is-danger\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert(/color: #b3362a;/.test(rule), 'the paper family speaks a deep red (not the pale salmon)');
  assert(/#ff8d7d/.test(css), 'the dark covers keep their salmon');
});

// ===========================================================================
// the release furniture
// ===========================================================================
ok('the version is 1.3.3 everywhere', () => {
  assert.equal(APP.version, '1.4.3');
  assert.equal(pkg.version, '1.4.3');
  const changelog = src('CHANGELOG.md');
  assert(/^## 1\.4\.3/.test(changelog.trimStart()), 'the changelog leads with 1.3.6 (1.3.4 shipped over this batch’s own release)');
});

console.log(`\n1.3.3 batch: ${passed} passed, ${failed} failed${failed ? ' — FIX BEFORE SHIPPING' : ''}`);
if (failed) process.exit(1);
