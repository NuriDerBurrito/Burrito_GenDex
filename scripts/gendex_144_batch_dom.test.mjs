// 1.3.4 batch — THE LEFT-READING WALL.
// The five reported items, each pinned at its root law:
//   1.  the tags + stamps walls SORT FROM THE LEFT — one big scrollable
//       container filling column-major ("they act as pages and sort from
//       top to bottom, instead i want them to act as one big scrollable
//       container that sorts from left instead, as they should fit
//       inside the empty areas"): the leftmost column holds the first
//       `rows` items top to bottom, each column filled before the next,
//       the front window one consecutive block
//   2.  the stamps drag holds its rows ("sometimes a single row gets low
//       or high then returns when i let go"): the packer's row geometry
//       is ORDER-AWARE (row heights derive from the pack's own member-
//       ship, stacked from one order-independent anchor — the grid's own
//       auto-track law), and the wall REFUSES the rect-swap fallback
//       whose cross-row vertical hops read as rows riding low and high
//   3.  the stamp settings STACK ("stamp color and stamp settings shouldnt
//       be on their own instead they should merge above each other so its
//       2 options on each other, instead of horizontal"): one cluster
//       seat, the color key above the settings key
//   4.  EVERY card surface carves the divider's corners in rounded mode
//       ("the image leaking beyond the trim which gets turned into
//       rounded mode, but the card color from below doesnt stretch to
//       it"): the look editor's compact preview and its stamp overlay
//       round ALL FOUR corners with the theme's radius — the grid card's
//       own 1.3.1 divider law, unified
//   5.  the delete key's ring SURVIVES the hover ("add an outline around
//       the delete card option when hovered over, and if there is, change
//       its color"): the fill turns the danger red while the ring stays
//       the app's ink — present on hover, never blended away
// Plus: the version is 1.4.3 everywhere.
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
const ribbonSrc = src('src/components/TagRibbon.jsx');
const newCharSrc = src('src/components/NewCharacterModal.jsx');
const APP = (await import(join(appRoot, 'src/constants/index.js'))).APP;
const pkg = JSON.parse(src('package.json'));
const lock = JSON.parse(src('package-lock.json'));

// ===========================================================================
// 1 — THE LEFT-READING WALL
// ===========================================================================
ok('1 — the detail panel\u2019s walls sort from the left (column-major, one big container)', () => {
  const colSeats = [...viewSrc.matchAll(/wallOrder="column"/g)];
  assert.equal(colSeats.length, 2, 'both seats (stamps + tags) speak the column order');
  assert(!/wallOrder="row"/.test(viewSrc), 'no seat reads row-major (the 1.3.3 misread is retired)');
  assert(/THE WALL SORTS FROM THE LEFT AGAIN/.test(viewSrc), 'the 1.3.4 wall law is documented (stamps seat)');
  assert(/THE TAGS WALL SORTS FROM THE LEFT TOO/.test(viewSrc), 'the tags seat carries the same law');
  assert(/wallOrder = 'column',/.test(sideSrc), 'the prop keeps the column default');
  // the reading math (pure): 12 items, 2 rows — the leftmost column holds
  // items 0..1, the next 2..3, every column filled before the next begins
  const n = 12;
  const R = 2;
  const seat = (i) => ({ row: i % R, col: Math.floor(i / R) });
  assert.deepEqual([seat(0), seat(1), seat(2), seat(3), seat(11)], [
    { row: 0, col: 0 }, { row: 1, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 5 },
  ], 'first column top to bottom, then the next column to its right');
  // the front window shows ONE consecutive block: the first 2*V items
  // occupy the first V columns' every slot (fit inside the empty areas)
  const V = 4;
  const front = [];
  for (let c = 0; c < V; c += 1) for (let r = 0; r < R; r += 1) front.push(r + c * R);
  assert.deepEqual(front, [0, 1, 2, 3, 4, 5, 6, 7], 'the visible window carries items 0..7 consecutively — no interleaved runs, no pages');
});

// ===========================================================================
// 2 — THE DRAG HOLDS ITS ROWS
// ===========================================================================
ok('2 — the wall pack\u2019s rows are ORDER-AWARE (the anchor, not the frozen bands)', () => {
  assert(/THE ROW-0 ANCHOR, NOT THE FROZEN BANDS/.test(sortSrc), 'the anchor law is documented');
  assert(/drag\.wallCtx = \{ rows: maxRows, gap: wallGap, anchorY, tools, align: wallAlign, rowMajor: wallRowMajor, cols: wallCols \};/.test(sortSrc), 'the ctx carries the anchor — never the frozen rowTop/rowH');
  assert(!/rowTop, rowH, tools/.test(sortSrc), 'no frozen band rows ride the ctx');
  assert(/const rowH = new Array\(R\)\.fill\(0\);/.test(sortSrc), 'the pack computes its own row heights');
  assert(/rowTop\[r\] = rowTop\[r - 1\] \+ rowH\[r - 1\] \+ gap;/.test(sortSrc), 'the rows stack from the anchor exactly as the grid stacks its auto tracks');
  // the math itself (pure): 6 stamps, rows=2, gap=8, heights — the
  // identity reproduces the paint; a REORDER that moves the tall chip
  // between rows shifts the second row's top by exactly the height delta
  const R = 2;
  const gap = 8;
  const anchorY = 100;
  const heights = [44, 44, 44, 60, 44, 44]; // the 60px chip rides row 1
  const packRows = (order) => {
    const rowH = new Array(R).fill(0);
    order.forEach((k, p) => { const r = p % R; rowH[r] = Math.max(rowH[r], heights[k]); });
    const rowTop = [anchorY];
    for (let r = 1; r < R; r += 1) rowTop[r] = rowTop[r - 1] + rowH[r - 1] + gap;
    return { rowH, rowTop };
  };
  const identity = packRows([0, 1, 2, 3, 4, 5]);
  assert.deepEqual(identity.rowH, [44, 60], 'the identity rows size to their tallest members');
  assert.equal(identity.rowTop[1], 152, 'the grab\u2019s second row sits at 100 + 44 + 8');
  // move the tall chip (index 3) to the FRONT: row 0 now sizes to 60
  const reordered = packRows([3, 0, 1, 2, 4, 5]);
  assert.deepEqual(reordered.rowH, [60, 44], 'the reordered rows re-size to their NEW members');
  assert.equal(reordered.rowTop[1], 168, 'row 1 shifts by exactly the height delta (16) — the glide predicts the commit\u2019s true paint');
});

ok('2b — the wall REFUSES the rect-swap fallback (no vertical hops under a hold)', () => {
  assert(/THE WALL REFUSES THE RECT-SWAP/.test(sortSrc), 'the refusal law is documented');
  assert(/dataset\.gdFlow === 'wall'/.test(sortSrc), 'the carrier is spotted by its wall attribute');
  const refusal = /isWallCarrier[\s\S]{0,320}delta: \(\) => null,/.test(sortSrc);
  assert(refusal, 'an unvalidatable wall keeps its neighbors seated (delta null — no cross-row hops)');
  // the plain strips keep the fallback (where it tells the truth)
  assert(/const delta = \(i\) => \{[\s\S]{0,120}finalIndexFor/.test(sortSrc), 'the plain flex-wrap strips keep the rect-swap glide');
});

// ===========================================================================
// 3 — THE SETTINGS STACK
// ===========================================================================
ok('3 — stamp color + stamp settings merge into ONE stacked cluster', () => {
  // 1.4.6 SUPERSEDED (the tower's column seat): the restack law moved
  // with the cluster — it seats UNDER the + STAMP key in the row's own
  // fixed column now, always in view, never buried behind the wall's
  // sideways scroll (gendex_155 pins the seat).
  assert(/THE TOWER SEATS IN THE COLUMN/.test(viewSrc), 'the restack law is documented (detail panel)');
  /* 1.4.3 supersede: the cluster renders WITHOUT a stamp now ("let the hue
     color and stamp options appear ... even if there is no stamp present") —
     the color key rides above a WRAPPER span that carries the locked-seat
     law around the settings key while the strip is empty. The tower's
     order + the cluster law are unchanged. */
  const cluster = /<span className="gd-stamp-settings-cluster[^"]*">[\s\S]{0,1200}?<StampColorControls[\s\S]{0,1200}?<StampPosControls/.exec(viewSrc)?.[0] || '';
  assert(cluster.length > 0, 'the color key rides ABOVE the settings key inside one cluster');
  assert(/stays-without-a-\s*stamp law/.test(viewSrc), '1.4.3: the cluster stays without a stamp (the settings key locks)');
  assert(newCharSrc.includes('gd-stamp-settings-cluster'), 'the creation board speaks the same cluster');
  assert(/THE CLUSTER STAYS WITHOUT A STAMP/.test(newCharSrc), '1.4.3: the creation window renders the cluster without a stamp too');
  const rule = /\.gd-stamp-settings-cluster\s*\{[^}]*\}/.exec(css)?.[0] || '';
  /* 1.4.4 supersede: THE TOWER FALLS ("the normal stamp color and stamp
     settings seem to be drafted apart as one is too high and the other is
     stranded bottom right" + "its also causing the second stamp row to have
     space above and below it") — the cluster is a side-by-side ROW now,
     shorter than a slot; no row ever stretches for it. */
  assert(/flex-direction: row;/.test(rule), '1.4.4: the cluster rides side by side (the tower fell)');
  assert(/gap: 6px;/.test(rule), '1.4.4: a compact row');
  const childRule = /\.gd-stamp-settings-cluster > \.gd-stamp-color,\s*\.gd-stamp-settings-cluster > \.gd-stamp-pos,\s*\.gd-stamp-settings-cluster > \.gd-locked-key\s*\{[^}]*\}/.exec(css)?.[0] || '';
  // 1.4.5 SUPERSEDED (the offset bug's root): the zeroing speaks DESCENDANTS
  // now (the locked-key wrapper broke the direct-child form — the settings
  // key slid 9px down / 2px right); gendex_154 pins the live law.
  assert(/margin-top: 0;/.test(childRule) || /\.gd-stamp-settings-cluster \.gd-stamp-color,/.test(css), 'the headroom dies at the descendant law (see 154)');
  const lockKey = /\.gd-locked-key > \*\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert(lockKey.length > 0 && /grayscale/.test(lockKey), '1.4.3: the locked-key law (greyed, blind) exists for the settings seat');
});

// ===========================================================================
// 4 — EVERY CARD SURFACE CARVES THE DIVIDER'S CORNERS
// ===========================================================================
ok('4 — the preview surfaces round ALL FOUR corners (the grid card\u2019s divider law)', () => {
  const R4 = 'calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px)';
  // the grid card keeps its verified law
  assert(gridSrc.includes(R4), 'the grid card\u2019s sleeve rounds all four corners (unchanged — verified honest)');
  // the compact preview (the creation window\u2019s miniature) joins the law
  assert(ribbonSrc.includes(R4), 'the compact preview\u2019s art rounds all four corners (the pre-1.3.1 top-only law is dead)');
  assert(!/- 2px\) 0 0'/.test(ribbonSrc), 'no top-only radius survives in the preview');
  // the look editor\u2019s stamp overlay joins the law
  assert(lookSrc.includes(R4), 'the look editor\u2019s stamp overlay rounds all four corners');
  const overlayCount = (lookSrc.match(new RegExp(R4.replace(/[()$.]/g, (m) => '\\' + m), 'g')) || []).length;
  assert.equal(overlayCount, 2, 'the panzoom + the stamp overlay both speak the four-corner calc');
  // the foot plate\u2019s rise still fills the carved notch with the color below
  const rise = /\.gd-card-foot::before\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert(/height: calc\(max\(var\(--gd-shape-radius, var\(--gd-radius\)\) - 2px, 0px\) \+ 1px\);/.test(rise), 'the rise covers the carve\u2019s full depth');
  // 1.3.5 \u2014 the rise speaks --gd-foot-plate (the views write it: the card
  // color, else the panel paper) instead of the old \u2018background: inherit\u2019
  // \u2014 inherit painted TRANSPARENT on uncolored feet and left the carved
  // corners to the bare tint wash (the \u2018white/theme colored\u2019 leak).
  assert(/background: var\(--gd-foot-plate, transparent\);/.test(rise), 'the rise speaks the plate\u2019s own color through --gd-foot-plate (1.3.5: opaque, never inherit-transparent)');
  assert(gridSrc.includes('--gd-foot-plate'), 'the grid card writes the plate var');
  assert(lookSrc.includes('--gd-foot-plate'), 'the look editor\u2019s preview writes the plate var');
});

// ===========================================================================
// 5 — THE DELETE KEY'S RING SURVIVES THE HOVER
// ===========================================================================
ok('5 — the delete key\u2019s hover keeps a visible ring around the red', () => {
  const rule = /\.gd-del-hover:hover\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert(/outline: 2px solid var\(--gd-ink\);/.test(rule), 'the outline speaks the INK (contrast against the fill — never blends away)');
  assert(/outline-offset: -2px;/.test(rule), 'drawn INSIDE the border box (the 1.3.3 seat — never a surrounding ring)');
  assert(/background: #c8402f !important;/.test(rule), 'the FILL turns the danger red (the color change)');
  assert(/border-color: var\(--gd-ink\) !important;/.test(rule), 'the border stays the ink — present from rest through hover');
  assert(!/border-color: #c8402f/.test(rule), 'no same-color border to blend into the fill');
});

// ===========================================================================
// the release furniture
// ===========================================================================
/* 1.4.4 supersede: the release is 1.4.4 now. */
ok('the version is 1.4.6 everywhere (1.4.5 superseded)', () => {
  assert.equal(APP.version, '1.4.6');
  assert.equal(pkg.version, '1.4.6');
  assert.equal(lock.version, '1.4.6', 'the LOCK follows');
  assert.equal(lock.packages[''].version, '1.4.6', 'the lock root package too');
  const changelog = src('CHANGELOG.md');
  assert(changelog.startsWith('## 1.4.6 — The Keys Find Their Seat'), 'the changelog leads with the current release');
  assert(/^## 1\.3\.3 — The Honest Wall/m.test(changelog), 'the 1.3.3 entry survives below it');
  assert(src('README.md').includes('**v1.4.6**'), 'the README fronts the version');
  assert(src('START.bat').includes('(1.4.6)'), 'the launcher comments the version');
  // 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
  // release ships without it"): the one-file page left the repo
  // with the final release; this suite's page-pins retired with it.
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert(website.includes('<span class="ver">v1.4.6</span>'), 'the website fronts 1.3.4');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert(website.includes('Burrito_GenDex_1.4.6_source.zip'), 'the zip link follows');
});

console.log(`\n1.3.4 batch: ${passed} passed, ${failed} failed${failed ? ' — FIX BEFORE SHIPPING' : ''}`);
if (failed) process.exit(1);
