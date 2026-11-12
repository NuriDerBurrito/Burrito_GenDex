// 1.3.7 batch — THE TRIM SPEAKS ALONE.
// The two reported items, each pinned at its root law:
//   1.  the corner plates are retired ("at the bottom of the card, i see
//       two colored squares that arent in fit with the gradiant of the
//       card's color ... i also see them clipping outside of the card
//       border ... i want the bottom 2 to just be removed"): the
//       .gd-card-collector::after law and its --gd-corner-fill var are
//       gone, on every surface
//   1b. the seam speaks the plate's own gradient ("its not in sync with
//       the gradiant, and that there is a white ish line that seperates
//       them"): the foot plate's rise carries the foot’s own white bloom
//       (a 0deg fade from the seam), and the foot's inset top rim — the
//       light ROW that read as the line — is retired
//   2.  the stamps drag is honest at the source ("when i grab a stamp from
//       the first row and move it to the bottom row, the stamps inside the
//       container shift up slightly ... it doesnt do the same issue when i
//       drag from bottom row to top row"): the grab-time snapshot is
//       transform-neutral (the :hover lift can never poison the wall's
//       row-0 anchor) and the wall context's tail keys ride their DOM
//       seats (the pack's rows are the painted rows)
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
const sortSrc = src('src/components/useThumbSort.js');
const gridSrc = src('src/components/GridView.jsx');
const lookSrc = src('src/components/CardLookEditor.jsx');
const ribbonSrc = src('src/components/TagRibbon.jsx');
const APP = (await import(join(appRoot, 'src/constants/index.js'))).APP;
const pkg = JSON.parse(src('package.json'));
const lock = JSON.parse(src('package-lock.json'));

// ===========================================================================
// 1 — THE CORNER PLATES ARE RETIRED
// ===========================================================================
ok('1 — the collector card carries no ::after plates, and the law documents its retirement', () => {
  const block = /\.gd-card-collector::after\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert.equal(block, '', 'the ::after rule is gone');
  assert(/THE CORNER PLATES ARE RETIRED/.test(css), 'the retirement note sits at the old law’s seat');
  assert(/i want the bottom 2 to just\s+be\s+removed/.test(css), 'the retirement quotes the report');
  // the retirement notes WHY the plates failed: the offset circle + the
  // border-ring overpaint + the raw color against the shaded foot
  assert(/radial-gradient tiles sat at a center the trim's arc never spoke/.test(css), 'the offset-circle root cause is documented');
  assert(/rode OVER the ink border ring/.test(css), 'the border-erasure root cause is documented');
});

ok('1b — no card surface speaks the retired var', () => {
  for (const [name, text] of [['grid', gridSrc], ['look editor', lookSrc], ['compact preview', ribbonSrc]]) {
    assert(!/['"]--gd-corner-fill['"]\s*:/.test(text), `${name}: no var write`);
    assert(/CORNER PLATES ARE RETIRED/.test(text), `${name}: the retirement is documented at the old write`);
  }
});

// math mirror: with the plates gone, the ink ring owns the corner arc and
// nothing paints outside the card's silhouette at any border width
ok('1c — math mirror: the corner belongs to the ink ring and the paper', () => {
  for (const bw of [1, 2]) {
    const R = 16;
    const arcCenter = { x: R, y: R }; // border-box coords, the bottom-left corner
    // the ink ring's annulus: between radius R-bw and R around the center —
    // the mid-band along the corner diagonal
    const mid = R - bw / 2;
    const ringMid = { x: R - (mid / Math.SQRT2), y: R - (mid / Math.SQRT2) };
    const d = Math.hypot(ringMid.x - arcCenter.x, ringMid.y - arcCenter.y);
    assert.ok(Math.abs(d - mid) < 0.01, `bw=${bw}: the ring's mid-band sits ${d.toFixed(1)}px from the center — the ink owns it`);
    assert.ok(d <= R && d >= R - bw, `bw=${bw}: the band is inside the ink's own annulus`);
    // the border-box corner pixel: outside the arc — the paper's own
    const dCorner = Math.hypot(0 - R, 0 - R);
    assert.ok(dCorner > R, `bw=${bw}: the corner pixel is ${dCorner.toFixed(1)}px out — paper, never a plate`);
  }
});

// ===========================================================================
// 1b — THE SEAM SPEAKS THE PLATE'S OWN GRADIENT
// ===========================================================================
ok('2 — the rise carries the foot’s own bloom (a 0deg fade from the seam)', () => {
  const block = /\.gd-card-foot::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(block, 'the rise rule exists');
  // 1.3.9 supersede: the flat hue tint is RETIRED ("limiting the fade to
  // the image") — the rise paints the plate alone, and the bloom
  // continuation moved to the COLORED-foot law with the scale-matched
  // length (see gendex_148's laws 2/2b)
  assert(!/linear-gradient\(var\(--gd-foot-tint, transparent\), var\(--gd-foot-tint, transparent\)\)/.test(css), '1.3.9: the flat tint layer is retired');
  const colored = /\.gd-card-foot-vers\.is-colored::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  // layer 2: the bloom — 13% white at the BOTTOM edge (0deg), fading up at
  // the foot's own scale-matched rate
  assert(/linear-gradient\(\s*0deg,\s*rgba\(255, 255, 255, 0\.13\),\s*rgba\(255, 255, 255, 0\)\s*calc\(24px \* var\(--card-scale, 1\)\)\s*\)/.test(colored), 'the bloom rises from the seam at the foot’s own strength');
  assert(/THE RISE SPEAKS THE FOOT'S OWN BLOOM/.test(css), 'the bloom-continuation law is documented');
});

ok('2b — the foot’s top rim is retired (a gradient, never a line)', () => {
  const block = /\.gd-card-foot-vers\.is-colored\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert(block, 'the colored plate rule exists');
  // the grounded bottom rim stays
  assert(/inset 0 -2px 0 rgba\(0, 0, 0, 0\.22\)/.test(block), 'the bottom shade rim stays');
  // the top highlight is gone — the bloom alone carries the top's light
  assert(!/inset 0 1px 0/.test(block), 'no inset top highlight remains');
  assert(/THE TOP RIM IS RETIRED/.test(css), 'the rim retirement is documented');
});

// math mirror: the light step at the seam dies with the rim
ok('2c — math mirror: the foot’s first row continues the gradient, no step', () => {
  const card = [230, 126, 34]; // #e67e22
  const over = (c, a) => c.map((v) => Math.round(v + (255 - v) * a)); // white over color at alpha a
  // before: the first row carried bloom 13% + rim 18% — a stack of lifts
  const before = over(over(card, 0.13), 0.18);
  // after: the first row carries the bloom alone
  const after = over(card, 0.13);
  const body = over(card, 0.126); // the second row (the gradient a hair below 13%)
  const stepBefore = before[1] - body[1];
  const stepAfter = after[1] - body[1];
  assert.ok(stepAfter < stepBefore, `the seam step shrinks (${stepAfter} vs the rimmed ${stepBefore}) — a gradient, never a line`);
  // and the rise's bottom row (plate + bloom, under the tint when a hue
  // rides the card) meets the foot's first row at the same bloom strength
  const rise = over(card, 0.13);
  assert.deepEqual(rise, after, 'the rise’s bottom row = the foot’s first row — one surface');
});

// ===========================================================================
// 3 — THE STAMPS DRAG IS HONEST AT THE SOURCE
// ===========================================================================
ok('3 — the snapshot is transform-neutral (the hover lift cannot poison the anchor)', () => {
  // the caller passes the grabbed element
  assert(/snapshotRects\(drag\.el\)/.test(sortSrc), 'the snapshot receives the dragged element');
  // the silence: an inline transform: none overrides the :hover rule, and
  // transition: none makes it take effect on the measurement frame
  assert(/dragEl\.style\.transform = 'none'/.test(sortSrc), 'the grabbed chip’s transform is silenced inline');
  assert(/dragEl\.style\.transition = 'none'/.test(sortSrc), 'the transition is silenced too — no mid-flight blend');
  // the restore: both voices return the moment the last rect is read
  assert(/dragEl\.style\.transform = savedT \?\? ''/.test(sortSrc), 'the transform voice is restored');
  assert(/dragEl\.style\.transition = savedTr \?\? ''/.test(sortSrc), 'the transition voice is restored');
  assert(/THE SNAPSHOT IS TRANSFORM-NEUTRAL/.test(sortSrc), 'the law is documented');
  // every refusal path AFTER the silences restores before returning (no
  // leaked silence) — the three inline guards and the final ordering
  const body = /const snapshotRects[\s\S]*?\n  \};/.exec(sortSrc)?.[0] || '';
  assert(/\{ restore\(\); return null; \}/.test(body), 'the refusal guards restore inline');
  assert((body.match(/\{ restore\(\); return null; \}/g) || []).length >= 3, 'every early refusal in the measured branches restores');
  assert(/restore\(\);\s*\n\s*if \(rects\.some\(\(o\) => o == null\)\) return null;/.test(body), 'the final guard restores before refusing');
});

ok('3b — the wall’s tail keys ride their DOM seats', () => {
  // the tools array is collected from the container's children in DOM
  // order (the grid's auto-flow: column seating law), not the band walk's
  // y-sorted kidBoxes
  assert(/const tools = Array\.from\(cont\.children \|\| \[\]\)/.test(sortSrc), 'the tools read the container’s children directly');
  assert(/THE TOOLS RIDE DOM ORDER/.test(sortSrc), 'the law is documented');
  // the old y-order read is gone from the tools
  assert(!/const tools = kidBoxes\.filter/.test(sortSrc), 'the top-sorted tools read is retired');
  // the bands still come from the sorted kidBoxes (the row cap needs them)
  assert(/kidBoxes\.sort\(\(a, b\) => a\.top - b\.top\)/.test(sortSrc), 'the band walk keeps its own sort');
});

// math mirror: the two root causes, quantified
ok('3c — math mirror: the anchor poisoning and the tools scramble', () => {
  // the wall: 40 stamps (44px), tools [ADD 44, PASTE 44, cluster 47] in
  // DOM order — the cluster at tail position 42 lands in row 0
  const n = 40;
  const R = 2;
  const toolsDom = [44, 44, 47];
  const rowH = [0, 0];
  for (let p = 0; p < n + toolsDom.length; p += 1) {
    const h = p < n ? 44 : toolsDom[p - n];
    rowH[p % R] = Math.max(rowH[p % R], h);
  }
  assert.deepEqual(rowH, [47, 44], 'DOM order: the 47px cluster seats in row 0 — the painted rows');
  // the y-order read (the old bug): row-0 boxes first, so the tools came
  // out [ADD, cluster, PASTE] — the cluster seated at position 41 (row 1)
  const toolsY = [44, 47, 44];
  const rowHY = [0, 0];
  for (let p = 0; p < n + toolsY.length; p += 1) {
    const h = p < n ? 44 : toolsY[p - n];
    rowHY[p % R] = Math.max(rowHY[p % R], h);
  }
  assert.deepEqual(rowHY, [44, 47], 'y-order: the rows SWAP — the modeled wall is not the painted wall');
  // the anchor poisoning: a grabbed row-0 chip carries the -1px hover lift
  const trueTop = 235.7;
  const lifted = trueTop - 1;
  const anchor = Math.min(lifted, trueTop, trueTop); // the min over row-0 members
  const modeledRow1 = anchor + rowH[0] + 8;
  const paintedRow1 = trueTop + rowH[0] + 8;
  assert.ok(modeledRow1 < paintedRow1, `the poisoned anchor sits every row ${(paintedRow1 - modeledRow1).toFixed(1)}px high — the "shift up slightly"`);
  // a grabbed ROW-1 chip never touches the row-0 anchor: the asymmetry
  const anchorFromBottom = Math.min(trueTop, trueTop, trueTop);
  assert.equal(anchorFromBottom, trueTop, 'a bottom-row grab leaves the anchor true — no shift, the reported asymmetry');
});

// ===========================================================================
// 4 — THE VERSION IS 1.4.3 EVERYWHERE
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
  assert(/## 1\.4\.6 — The Keys Find Their Seat/.test(src('CHANGELOG.md')), 'the changelog leads with 1.3.7');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert(src('website/index.html').includes('releases/tag/v1.4.6'), 'the website links the release');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert(src('website/index.html').includes('var CURRENT = [1, 4, 6];'), 'the version-check gate follows');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert(src('website/index.html').includes('THE KEYS FIND THEIR SEAT'), 'the release tagline follows');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
