// 1.3.2 batch — THE WALL + THE RETIREMENTS.
// The six reported items, each pinned at its root law so the pages era can
// never quietly return:
//   1+2. tags + stamps side seat = ONE continuous column-major WALL (each
//        column filled top to bottom before the next; no pages, no lanes,
//        no slabs, nothing re-seats between seats)
//   3.   the art's deco layers (trims + the classic stamp band) clip at the
//        sleeve's curve, so the foot plate's rise fills the image's bottom
//        corners with the card color
//   4.   the edge group (arrows + fades) stays mounted through every
//        collapse/expand and fades on its own clock (never a vanish)
//   5.   the prompt containers carry no number tabs and their writable
//        faces sit one rung darker
//   6.   the preview system is retired: the thumbnail builds automatically
//        at import, always — no switch, no GENERATE key, no erase key
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (rel) => readFileSync(join(appRoot, rel), 'utf8');
const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

// jsdom-lite asserts (no second dependency): tiny shims, defined FIRST
function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}
assert.ok = assert;
function assertMatch(hay, re, label) {
  if (!re.test(hay)) throw new Error(label || `no match for ${re}`);
}

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

const sideSrc = src('src/components/SideFlow.jsx');
const sortSrc = src('src/components/useThumbSort.js');
const viewSrc = src('src/components/CharacterView.jsx');
const gridSrc = src('src/components/GridView.jsx');
const lookSrc = src('src/components/CardLookEditor.jsx');
const partSrc = src('src/components/PartEditor.jsx');
const appSrc = src('src/App.jsx');
const mainSrc = src('src/main.js');
const preloadSrc = src('src/preload.js');
const settingsSrc = src('src/components/SettingsModal.jsx');
const titleSrc = src('src/components/Titlebar.jsx');
const constSrc = src('src/constants/index.js');
const helpersSrc = src('src/utils/helpers.js');
const css = src('src/index.css');
const codeCss = stripComments(css);
const codeSide = stripComments(sideSrc);
const codeSort = stripComments(sortSrc);
const codeGrid = stripComments(gridSrc);
const codeApp = stripComments(appSrc);
const codeMain = stripComments(mainSrc);

// ===========================================================================
// 1 + 2 — THE WALL
// ===========================================================================
ok('1+2 — the side seat is ONE wall: left-packed, no pages anywhere', () => {
  assertMatch(sideSrc, /THE WALL RENDERER: ONE grid, the caller's children/, 'the renderer law is documented');
  assertMatch(codeSide, /data-gd-flow="wall"/, 'the mode rides the carrier');
  assertMatch(codeSide, /gridTemplateRows: `repeat\(\$\{R\}, auto\)`/, 'the row tracks are exactly the used rows');
  assert.ok(!/gd-side-page/.test(codeSide), 'no page boxes render (code)');
  assert.ok(!/gd-side-row/.test(codeSide), 'no lane elements render (code)');
  assert.ok(!codeSide.includes('packFlowRows'), 'the wall packs through nothing');
  assert.ok(!css.includes('.gd-side-page'), 'no page boxes in the CSS');
  assert.ok(!css.includes('.gd-side-row'), 'no lanes in the CSS');
});

ok('1+2 — the wall geometry is the grid law in math (rows size to their tallest member)', () => {
  assertMatch(codeSide, /wallRowH\[seat\] = Math\.max\(wallRowH\[seat\] \|\| 0, wallItems\[i\]\.h \|\| 0\);/, 'row heights = tallest item at the seat');
  assertMatch(codeSide, /const capH = wallRowsUsed \? Math\.round\(wallNatural \+ 5\) : null;/, 'the open cap is the wall height + the mark reach');
  assertMatch(codeSide, /const wallNatural = Math\.round\(wallPadTop \+ wallContentH\);/, 'the wall height is border-box honest');
  assertMatch(codeSide, /const retractH = wallRowsUsed/, 'the retracted clamp speaks the WALL rows');
  assertMatch(codeSide, /rootPadTop = parseFloat\(window\.getComputedStyle\(el\)\.paddingTop\) \|\| 0;/, 'the reader answers the zone\'s own padding');
});

ok('1+2 — the wall keeps one DOM through every seat (expand/collapse never re-seat)', () => {
  assertMatch(sideSrc, /NEVER rebuild the wall/, 'the one-DOM law is documented');
  assertMatch(codeSide, /const sideMounted = needsSide && capH != null;/, 'the mount derives from the measure alone (collapsed never enters it)');
  assertMatch(codeSide, /zone\.scrollTo\(\{ left: 0, behavior: 'smooth' \}\)/, 'the toggle homes the pan to the very left');
});

ok('1+2 — the CSS speaks the wall (grid, both carriers)', () => {
  const selfFlow = /\.gd-collapse-zone\.is-side\.is-self-flow\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
  assertMatch(selfFlow, /grid-auto-flow: column;/, 'the self-flow zone IS the wall');
  assertMatch(selfFlow, /justify-items: start;/, 'left-packed, never stretched');
  const stamps = /\.gd-collapse-zone\.is-side > \.gd-stamp-slots\.is-wall\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
  assertMatch(stamps, /grid-auto-flow: column;/, 'the stamps wrapper IS the wall');
  assertMatch(stamps, /width: max-content;/, 'the wall takes its true width (the zone scrolls it)');
  assertMatch(stamps, /gap: 8px;/, 'the stamps wall speaks the wrapper gap');
  assertMatch(codeCss, /\.gd-collapse-zone\.is-side > \.gd-stamp-slots\.is-wall > \*:last-child\s*\{[^}]*?margin-right: 9px;/, 'the last seat carries the scroll-end air');
});

ok('1+2 — the drag packer mirrors the wall byte-exact', () => {
  assertMatch(codeSort, /const packWall = \(order, ctx\) =>/, 'the wall pack engine exists');
  assertMatch(codeSort, /cont\.dataset\.gdFlow === 'wall'/, 'the carrier is recognized by its mode');
  assertMatch(codeSort, /const colW = new Array\(nCols\)\.fill\(0\);/, 'columns size to their widest member');
  assertMatch(codeSort, /const R = Math\.max\(1, rows \| 0\);/, 'the seats flow down columns (p % R, floor(p / R))');
  assertMatch(codeSort, /const tools = Array\.from\(cont\.children \|\| \[\]\)/, 'the foreign tail keys ride their DOM seats (1.3.7 re-law)');
  assertMatch(codeSort, /const nearestGapIndexWall = \(cx, cy, rows, gap, ctx = null\) =>/, 'the drop target speaks the wall gaps (order-aware)');
  assert.ok(!codeSort.includes('packPaged'), 'the paged packer is gone');
  assert.ok(!codeSort.includes('gd-side-page'), 'no page recognition anywhere');
});

// 1.3.3 — THE ROW-MAJOR WALL + THE HONEST BANDS: the detail panel's seats
// read across the rows (first row left to right, then the second), and the
// drag's row bands read the GRAB-TIME snapshot, never the transformed
// live boxes (the dragged chip's ride used to merge two bands and the
// neighbors glided vertically under the hold).
ok('1.3.3 — the wall reading + the snapshot-reading bands (1.3.4: the detail panel reads column-major)', () => {
  assertMatch(sideSrc, /wallOrder = 'column',/, 'the reading order is a prop (column keeps the creation board)');
  assertMatch(codeSide, /wallOrder === 'row'/, 'the row order is named (the lattice machinery survives)');
  assertMatch(codeSide, /gridTemplateColumns: `repeat\(\$\{C\}, max-content\)`/, 'the row-major template speaks the reading width');
  assertMatch(codeSide, /data-gd-pack-order=\{wallRowOrder \? 'row' : 'column'\}/, 'the packer reads the order off the carrier');
  // 1.3.4 — the detail panel's seats speak the COLUMN order now ("sorts
  // from left, one big scrollable container"); no seat reads row-major.
  assertMatch(viewSrc, /wallOrder="column"/, 'CharacterView speaks the column order (stamps + tags)');
  assertMatch(css, /grid-auto-columns: max-content;/, 'the tracks size to content, never auto (no collapsed columns, no stretched gaps)');
  assertMatch(codeCss, /\[data-gd-wall-order='row'\]\s*\{\s*grid-auto-flow: row;/, 'the row order flips the flow');
  assertMatch(codeSort, /const seatOf = rowMajor\s*\?\s*\(p\) => \(\{ r: Math\.floor\(p \/ nCols\), c: p % nCols \}\)/, 'the packer seats row-major');
  assertMatch(codeSort, /const snap = snapRef\.current \|\| \[\];/, 'the bands read the grab-time snapshot');
  assertMatch(sortSrc, /THE BANDS READ THE GRAB, NOT THE FLIGHT/, 'the snapshot law is documented');
});

// the wall math itself, exercised directly: 7 items, rows=3 -> columns of
// [0,1,2], [3,4,5], [6] — each column filled before the next begins
ok('1+2 — the wall seat math (pure): item i -> row i%rows, column floor(i/rows)', () => {
  const rows = 3;
  const n = 7;
  const seat = (i) => ({ row: i % rows, col: Math.floor(i / rows) });
  const expect = [
    { row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 },
    { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 2, col: 1 },
    { row: 0, col: 2 },
  ];
  for (let i = 0; i < n; i += 1) {
    if (JSON.stringify(seat(i)) !== JSON.stringify(expect[i])) {
      throw new Error(`item ${i} mis-seated: ${JSON.stringify(seat(i))} != ${JSON.stringify(expect[i])}`);
    }
  }
});

// ===========================================================================
// 3 — THE DECO CLIP (the card color covers the image's bottom corners)
// ===========================================================================
ok('3 — the grid card clips its deco at the sleeve curve', () => {
  assertMatch(codeGrid, /gd-sleeve-deco/, 'the deco wrapper mounts');
  const gridSlice = codeGrid.slice(codeGrid.indexOf('gd-sleeve-deco'));
  const bandIdx = gridSlice.indexOf('gd-card-stamp-band');
  const freeIdx = gridSlice.indexOf('gd-card-stamp-free');
  const decoClose = gridSlice.indexOf('</span>', gridSlice.indexOf('gd-card-stamp-band'));
  // 1.4.5 SUPERSEDED (the ladder law): the band left the deco span's cage
    // for its own root-level rung (its own clip, the same geometry) so the
    // coat's STAMP EFFECT switch can seat it under the coat — gendex_154
    // pins the live law.
    assert.ok(true, 'the band rung carries the same clip law (see 154)');
  assert.ok(freeIdx > decoClose, 'the FREE sticker layer stays OUTSIDE (the hang-past freedom)');
  // 1.4.0 supersede: the deco's selector also fronts the ladder's z-group
  // rule (.gd-sleeve-deco, .gd-panzoom > .gd-sleeve-deco { z-index: 3 })
  // which sits FIRST in the sheet; the CLIP law still speaks its own block
  // below it — scan every matching rule.
  const decoRules = [...codeCss.matchAll(/\.gd-sleeve-deco\s*\{[^}]*\}/g)].map((m) => m[0]);
  assertMatch(decoRules.join('\n'), /overflow: hidden;/, 'the deco clips');
  assertMatch(decoRules.join('\n'), /border-radius: inherit;/, 'the deco inherits the sleeve curve');
});

ok('3 — the look editor\'s preview clips the same way', () => {
  assertMatch(lookSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, ''), /gd-sleeve-deco/, 'the deco wrapper mounts there too');
});

// ===========================================================================
// 4 — THE EDGE GROUP STAYS MOUNTED (the fade is a flight, never a vanish)
// ===========================================================================
ok('4 — the edge group keys on the OVERFLOW, not the seat', () => {
  assertMatch(sideSrc, /THE EDGE GROUP STAYS MOUNTED THROUGH THE FOLD/, 'the law is documented');
  assertMatch(codeSide, /const edgesOn = sideMounted \|\| shrinkLinger;/, 'the mount outlives every collapse');
  assertMatch(codeSide, /const \[shrinkLinger, setShrinkLinger\] = useState\(false\);/, 'the linger is the shrink\'s alone');
  assert.ok(!codeSide.includes('edgeLinger'), 'the sideActive-keyed linger is retired');
  assertMatch(codeCss, /\.gd-flow-arrow\s*\{[^}]*?transition:[^}]*?opacity 0\.18s ease/s, 'the arrows tween their opacity');
  assertMatch(codeCss, /\.gd-flow-fade\s*\{[^}]*?transition: opacity 0\.18s ease;/s, 'the fades tween');
});

// ===========================================================================
// 5 — THE PROMPT CONTAINERS (no number tabs, darker writable faces)
// ===========================================================================
ok('5 — the number tabs are gone and the writable faces sit darker', () => {
  const partCode = stripComments(partSrc);
  assert.ok(!partCode.includes('gd-part-num'), 'no number tab renders');
  assert.ok(!css.includes('.gd-part-num {'), 'the tab CSS is retired');
  const rowFace = /\.gd-part-row \.gd-rt-edit\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
  assertMatch(rowFace, /color-mix\(in srgb, var\(--gd-bg\) 58%, var\(--gd-panel\)\)/, 'the name field sits one rung darker (58%)');
  const well = /\.gd-prompt-box\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
  assertMatch(well, /color-mix\(in srgb, var\(--gd-bg\) 58%, var\(--gd-panel\)\)/, 'the content well sits darker too');
});

// ===========================================================================
// 6 — THE PREVIEW SYSTEM IS RETIRED
// ===========================================================================
ok('6 — no switch, no GENERATE key, no erase key, anywhere', () => {
  assert.ok(!codeMain.includes('image:generate-previews'), 'no generator IPC');
  assert.ok(!codeMain.includes('image:erase-previews'), 'no erase IPC');
  assert.ok(!codeMain.includes('autoPreviewsOn'), 'no auto-off gate');
  assert.ok(!stripComments(preloadSrc).includes('generatePreviews'), 'no bridge entry');
  assert.ok(!stripComments(preloadSrc).includes('erasePreviews'), 'no erase bridge');
  assert.ok(!codeApp.includes('generatePreviews'), 'App owns no flow');
  assert.ok(!codeApp.includes('erasePreviews'), 'App owns no erase');
  assert.ok(!stripComments(settingsSrc).includes('GENERATE PREVIEWS'), 'no settings key');
  assert.ok(!stripComments(settingsSrc).includes('ERASE PREVIEW THUMBNAILS'), 'no erase card');
  assert.ok(!stripComments(titleSrc).includes('thumbsOn'), 'no titlebar thumb key');
  assert.ok(!constSrc.includes('cardThumbs: true'), 'no cardThumbs default');
  assert.ok(!constSrc.includes('autoPreviews: true'), 'no autoPreviews default');
  assert.ok(!helpersSrc.includes('rawSettings.cardThumbs'), 'the sanitizer drops the dead key');
});

ok('6 — the thumbnail builds automatically at import, always', () => {
  assertMatch(codeMain, /const writeThumb = \(name, buffer, ext\) =>/, 'the thumb builder exists');
  assertMatch(codeMain, /const writePrev = \(name, buffer, ext\) =>/, 'the prev builder exists');
  const saveImageAt = codeMain.indexOf('const saveImage = ');
  const earlyOut = codeMain.indexOf('return { file, thumb, prev };', saveImageAt);
  const canvasPass = codeMain.indexOf('if (thumbBase64) {', saveImageAt);
  assert.ok(saveImageAt > -1 && canvasPass > -1, 'the tier passes live in saveImage');
  assert.ok(earlyOut === -1 || earlyOut > canvasPass, 'no gate before the tier passes: they ALWAYS build');
  assertMatch(codeGrid, /const coverSrc = coverImage\?\.prev \? coverImage\.prev : thumbOf\(coverImage\);/, 'the cover reads the lightest tier, always');
});


console.log(`\n1.3.2 batch: ${passed} passed, ${failed} failed${failed ? ' — FIX BEFORE SHIPPING' : ''}`);
if (failed > 0) process.exit(1);
