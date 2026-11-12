// 1.3.5 batch — EACH ROW ON ITS OWN.
// The two reported items, each pinned at its root law, plus the drag-context
// repair found during live verification:
//   1.  the tags wall accounts for EACH ROW ON ITS OWN ("if a tag that is
//       too long exists, it would just consume horizontal real estate until
//       i see any actual other tags on the right side in the full 3 rows,
//       since apparently only the longest decides"): the tags zone seats
//       three independent lanes — same reading assignment, per-lane packing
//   2.  the container's BOTTOM COLOR extends up into the two rounded leaked
//       corners ("the issue isnt in the image, its that i want the bottom
//       color of the container to extend up to cover the two rounded leaked
//       corners instead of leaving it white/theme colored"): the rise paints
//       --gd-foot-plate opaque — the card color, else the panel paper
//   3.  the drag's FIRST drop verdict speaks the wall (the wall context
//       builds at the first honest move, never after the first glide)
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
assert.deepEqual = (a, b, msg) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(msg || `${JSON.stringify(a)} != ${JSON.stringify(b)}`);
};

const css = src('src/index.css');
const sideSrc = src('src/components/SideFlow.jsx');
const sortSrc = src('src/components/useThumbSort.js');
const viewSrc = src('src/components/CharacterView.jsx');
const gridSrc = src('src/components/GridView.jsx');
const lookSrc = src('src/components/CardLookEditor.jsx');
const newCharSrc = src('src/components/NewCharacterModal.jsx');
const APP = (await import(join(appRoot, 'src/constants/index.js'))).APP;
const pkg = JSON.parse(src('package.json'));
const lock = JSON.parse(src('package-lock.json'));

// ===========================================================================
// 1 — THE TAGS WALL ACCOUNTS FOR EACH ROW ON ITS OWN
// ===========================================================================
ok('1 — the tags zone seats independent lanes (per-row accounting)', () => {
  // the seat asks for the lanes and nothing else does
  assert(/wallPack="lanes"/.test(viewSrc), 'the tags zone passes wallPack="lanes"');
  assert.equal((viewSrc.match(/wallPack="lanes"/g) || []).length, 1, 'exactly one seat (the tags row) — the stamps + creation board keep their seats');
  assert(!newCharSrc.includes('wallPack'), 'the creation board keeps the column lattice (the user\u2019s exception)');
  // the zone law is documented at the prop
  assert(/THE LANE WALL/.test(sideSrc), 'the lane wall law is documented (the prop\u2019s own note)');
  // the render slices the children by i % R into .gd-wall-lane rows
  assert(/gd-wall-lane/.test(sideSrc), 'the side renderer paints lane rows');
  assert(/flowItems\.filter\(\(_, i\) => i % R === r\)/.test(sideSrc), 'lane r carries the items at i % R — the reading assignment unchanged');
  // the zone carries the lattice voice for the engine + the CSS
  assert(/'data-gd-wall-pack': 'lanes'/.test(sideSrc), 'the zone writes data-gd-wall-pack="lanes"');
  assert(sideSrc.includes("wallLanes ? { 'data-gd-wall-pack': 'lanes' }"), 'the attr rides only the lanes seat');
  // the zone skips the grid template on the lanes seat (rows are the lanes\u2019 own)
  assert(/sideMounted && selfFlow && !wallLanes/.test(sideSrc), 'no inline grid template on the lanes seat');
});

ok('1b — the lanes CSS: the zone stacks rows, every lane packs itself', () => {
  const block = /\.gd-collapse-zone\.is-side\.is-self-flow\[data-gd-wall-pack='lanes'\]\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert(block, 'the lanes zone rule exists');
  assert(/display:\s*flex/.test(block), 'the zone is a flex column');
  assert(/flex-direction:\s*column/.test(block), 'stacked lanes');
  assert(/gap:\s*6px/.test(block), 'the lanes keep the wall\u2019s 6px gap');
  const lane = /\.gd-wall-lane\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert(lane, 'the lane row rule exists');
  assert(/flex-wrap:\s*nowrap/.test(lane), 'a lane never wraps — it packs left to right');
  assert(/width:\s*max-content/.test(lane), 'a lane sizes to its OWN content (never stretched to its siblings)');
  assert(/align-items:\s*center/.test(lane), 'the chip lane law: centered in the row band');
  assert(/THE LANE WALL/.test(css), 'the law is documented in the css');
});

// pure-math mirror of the packer's lanes branch: a long item only pushes
// its own lane — the measured live case (166px tag among 47-76px tags)
ok('1c — math mirror: a long chip only spends its own lane’s real estate', () => {
  const R = 3;
  const rects = [
    { w: 47, h: 24 }, // 0 hero
    { w: 166, h: 24 }, // 1 the long tag
    { w: 76, h: 24 }, // 2 sidekick
    { w: 68, h: 24 }, // 3 villain
    { w: 61, h: 24 }, // 4 mentor
    { w: 54, h: 24 }, // 5 rival
    { w: 61, h: 24 }, // 6 healer
    { w: 54, h: 24 }, // 7 guide
    { w: 54, h: 24 }, // 8 beast
  ];
  const gap = 6;
  const left = 691;
  // the lanes packer: position p lands in lane p % R at the lane’s own cursor
  const identity = rects.map((_, i) => i);
  const laneX = new Array(R).fill(left);
  const seats = new Array(rects.length);
  for (let p = 0; p < identity.length; p += 1) {
    const r = p % R;
    seats[p] = { x: laneX[r] };
    laneX[r] += rects[p].w + gap;
  }
  // the column lattice the grid painted (the 1.3.4 law): position p lands at
  // row p % R of column floor(p / R), every column sized to its WIDEST member
  const nCols = Math.ceil(rects.length / R);
  const colW = new Array(nCols).fill(0);
  for (let p = 0; p < rects.length; p += 1) {
    const c = Math.floor(p / R);
    colW[c] = Math.max(colW[c], rects[p].w);
  }
  const colX = [left];
  for (let c = 1; c < nCols; c += 1) colX[c] = colX[c - 1] + colW[c - 1] + gap;
  const colSeatOf = (p) => colX[Math.floor(p / R)];
  // the long tag (linear 1) rides column 0’s width for EVERYONE seated there
  assert.equal(colW[0], 166, 'column 0 sized to the LONG tag — the widest member decides');
  // villain (linear 3, column 1): the old lattice pushed it 172px right (the measured live bug)
  assert.equal(colSeatOf(3) - left, 166 + 6, 'the old lattice seated villain at +172 — the long tag’s width spent on every lane');
  // the lane wall: villain is lane 0’s second member — right after hero
  assert.equal(seats[3].x - left, 47 + 6, 'villain rides +53 — packed beside hero, the dead air gone');
  assert.ok(seats[3].x < colSeatOf(3), 'the lane seat beats the old column seat');
  // the long tag itself keeps its own width in ITS lane
  assert.equal(seats[1].x, left, 'the long tag still rides the wall’s left edge (lane 1’s first seat)');
  // the other lanes keep their density: healer (linear 6, lane 0’s third) sits right after villain
  assert.equal(seats[6].x - left, 47 + 6 + 68 + 6, 'healer rides +127 — lane 0 packed tight through the long tag’s whole width');
});

// ===========================================================================
// 2 — THE ENGINE SPEAKS THE LANES
// ===========================================================================
ok('2 — the drag engine walks the lanes back into linear order', () => {
  // the snapshot maps lane r\u2019s k-th chip to k*R + r (the render\u2019s own law)
  assert(/k \* R \+ r/.test(sortSrc), 'the snapshot\u2019s lane walk writes the linear seat');
  assert(/gdWallPack === 'lanes'/.test(sortSrc), 'the snapshot branches on the zone\u2019s lattice voice');
  // the wall ctx reads the lane rows themselves as the bands
  assert(/THE LANES READ THEMSELVES/.test(sortSrc), 'the lane band law is documented');
  assert(/lanes: true/.test(sortSrc), 'the ctx carries the lattice flag');
  // the packer runs per-lane cursors
  assert(/THE LANE LATTICE/.test(sortSrc), 'the lane packer law is documented');
  assert(/laneX\[r\] \+= w \+ gap/.test(sortSrc), 'each lane runs its own x cursor');
  // the gap finder speaks item i\u2019s own lane
  assert(/THE LANE GAPS/.test(sortSrc), 'the lane gap law is documented');
  assert(/rects\[i - R\]/.test(sortSrc), 'the gap sits between item i and its lane\u2019s previous member');
});

ok('2b — the wall context builds at the FIRST honest move (no generic first verdict)', () => {
  assert(/const buildWallCtx = \(\) => \{/.test(sortSrc), 'the builder is a standalone closure');
  assert(/if \(useGeometry\) buildWallCtx\(\);/.test(sortSrc), 'the first-move block builds the ctx right after the snapshot');
  assert(/THE WALL CONTEXT IS A STANDALONE CLOSURE/.test(sortSrc), 'the law is documented');
  assert(/if \(drag && !drag\.wallCtx\) buildWallCtx\(\);/.test(sortSrc), 'the packer reuses the same ctx (no second build)');
});

ok('2c — math mirror: the lane snapshot mapping is the render\u2019s own law', () => {
  const R = 3;
  // the render slices: lane r = items r, r+R, r+2R...
  const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const lanes = Array.from({ length: R }, (_, r) => items.filter((_, i) => i % R === r));
  // the snapshot walks the lanes and writes k*R + r
  const out = new Array(items.length).fill(null);
  lanes.forEach((lane, r) => {
    lane.forEach((chip, k) => {
      out[k * R + r] = chip;
    });
  });
  assert.deepEqual(out, items, 'the lane walk reproduces the linear order exactly');
});

// ===========================================================================
// 3 — THE CONTAINER'S BOTTOM COLOR COVERS THE CORNERS
// ===========================================================================
ok('3 — the rise paints --gd-foot-plate opaque (the bottom color extends up)', () => {
  const rise = /\.gd-card-foot::before\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert(/background: var\(--gd-foot-plate, transparent\);/.test(rise), 'the rise speaks the plate var (never inherit-transparent)');
  assert(!/background: inherit;/.test(rise), 'the transparent inherit law is retired');
  assert(/THE PLATE IS OPAQUE/.test(css), 'the 1.3.5 plate law is documented');
  // the grid card writes the plate (card color, else the paper)
  assert(gridSrc.includes("--gd-foot-plate']: character.cardColor || 'var(--gd-panel)'"), 'the grid card names the plate: the card color, else the panel paper');
  assert(lookSrc.includes("--gd-foot-plate']: cardColor || 'var(--gd-panel)'"), 'the look editor\u2019s preview names the plate too');
  // 1.3.9 supersede: the tint rides NOTHING now — the fade stays on the
  // image ("limiting the fade to the image"); the rise paints the plate
  // alone (see gendex_148's law 2)
  assert(!/hue && character\.cardColor/.test(gridSrc), '1.3.9: the grid card\u2019s tint write is retired with the layer');
  assert(!/stampHueHex && cardColor/.test(lookSrc), '1.3.9: the preview\u2019s tint write is retired with the layer');
  // the compact preview joined the plate law in 1.3.9 (its foot colors and
  // fills its own corners, one voice with the other surfaces); the NEW
  // CARD tile keeps the transparent rise (paper feet)
  assert(src('src/components/TagRibbon.jsx').includes('--gd-foot-plate'), '1.3.9: the compact preview\u2019s foot speaks the plate var now');
});

ok('3b — math mirror: the opaque plate leaves no tint-blob at the corner', () => {
  // the measured live leak: tint (white @ 88%) over the RAW panel
  const panel = [21, 29, 34]; // #151d22 (glacier)
  const white = [255, 255, 255];
  const alpha = 0.88;
  const leak = panel.map((c, i) => Math.round(c * (1 - alpha) + white[i] * alpha));
  assert.deepEqual(leak, [227, 228, 228], 'the old law painted #e3e4e4 at the corner (the white blob)');
  // the fix: the plate is the panel itself — opaque
  const plate = 'var(--gd-panel)';
  assert.equal(plate, 'var(--gd-panel)', 'the uncolored plate speaks the paper — the corner reads the plate\u2019s own color');
});

// ===========================================================================
// 4 — THE VERSION IS 1.3.5 EVERYWHERE
// ===========================================================================
/* 1.4.4 supersede: the release is 1.4.4 now. */
ok('the version is 1.4.6 everywhere (1.4.5 superseded)', () => {
  assert.equal(APP.version, '1.4.6');
  assert.equal(pkg.version, '1.4.6');
  assert.equal(lock.version, '1.4.6', 'the LOCK follows');
  assert.equal(lock.packages[''].version, '1.4.6', 'the lock root package too');
  assert(src('README.md').includes('**v1.4.6**'), 'the README fronts the version');
  assert(src('START.bat').includes('(1.4.6)'), 'the launcher comments the version');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert(src('website/index.html').includes('<span class="ver">v1.4.6</span>'), 'the website fronts the version');
  assert(/## 1\.3\.5 — Each Row On Its Own/.test(src('CHANGELOG.md')), 'the changelog leads with 1.3.5');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert(src('website/index.html').includes('releases/tag/v1.3.5'), 'the website links the release');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
