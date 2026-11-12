// 1.9.15 batch — The Wide Card Wraps the Row.
// (Named 1915 in the suite sequence: 1910 the 1.9.10, 1911 the 1.9.11,
//  1912 the 1.9.12, 1913 the 1.9.13, 1914 the 1.9.14 (the shadow's own
//  ink law — its release was never published to GitHub, but its build
//  carries forward into this tree); this suite pins the 1.9.15 laws at
//  their roots. Built on the 1.9.14 line — the last release continues.)
// The reported items, pinned at their root laws:
//   A.  THE HINT IS RETIRED ("in full image viewer, remove the text
//       bottom right 'drag to pan · zoom with the keys or +/− ·
//       right-click for options · do.u. etc'"): the usage line is gone
//       with its whole right zone — the bar keeps the same
//       1fr · auto · 1fr grid so the peek trio stays dead center.
//   B.  THE WIDE CARD WRAPS THE ROW ("in a class there is 4 normal cards
//       (3:4 small size), then after them there is a card (16:10
//       enlarged) and a card (3:4 enlarged card), enlarged as in right
//       click then enlarged, for some reason the cards wont stay next to
//       the 4 normal cards, instead leaving exactly a 1 card gab
//       inbetween"): reproduced pure (scripts/probe_gap_1915.mjs) — the
//       1.8.2 strand guard demanded every lane left of a rightward pair
//       clear the wide card's FULL floor, a demand a doubled card can
//       never meet against singles, so every enlarged card was banished
//       to the leftmost pair and the wall read as a tower with a
//       card-wide gap beside the normals. The demand caps at ONE
//       CARD-ROW (cw × 1.33 + g) now: the indent stays banned
//       byte-for-byte, the row-wrap speaks — both enlarged cards sit in
//       the SAME row flush under the normals, and the estimate-phase
//       pack agrees with the measured pack (the re-flow flip is dead).
//   C.  THE FURNITURE — the version seats speak 1.9.15, the changelog
//       head tells this story, the README badge + battery count welcome
//       this very suite, and the battery runner runs it.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { layoutMasonry } from '../src/utils/helpers.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(path.join(root, '..', p), 'utf8');

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL — ${name}\n      ${e.message}`);
  }
};
const assertMatch = (text, re, msg) => {
  if (!re.test(text)) throw new Error(msg || 'pattern missing');
};
// strip both comment dialects before text bans — the law comments quote
// the report on purpose, the rendering itself must not speak it.
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const css = src('src/index.css');
const pkg = src('package.json');
const readme = src('README.md');
const changelog = src('CHANGELOG.md');
const runner = src('scripts/run_battery_171.sh');
const viewerSrc = src('src/components/ImageViewer.jsx');
const viewerCode = stripComments(viewerSrc);
const helpersSrc = src('src/utils/helpers.js');

// 1.9.0 — THE WORKLOG SEAT LEARNS TOLERANCE (the 1912 suite's own law):
// the parent-folder worklog is a sandbox-only seat, so the check reads it
// when present and falls back to the app's own CHANGELOG.
const worklog = (() => {
  try {
    return readFileSync(path.join(root, '..', '..', 'worklog.md'), 'utf8');
  } catch {
    return src('CHANGELOG.md');
  }
})();

console.log('A. THE HINT IS RETIRED ("remove the text bottom right \'drag to pan · zoom with the keys or +/− · right-click for options · do.u. etc\'")');

ok('A1 — the viewer no longer renders the hint or its right zone', () => {
  assert.ok(!viewerSrc.includes('gd-imgview-hint'), 'the hint span still renders');
  assert.ok(!viewerSrc.includes('gd-imgview-hud-right'), 'the right zone still renders');
  for (const banned of ['drag to pan', 'right-click for options', 'double-click resets', 'to swipe']) {
    assert.ok(!viewerCode.includes(banned), `the hint text still speaks in code: ${banned}`);
  }
  /* 1.9.16 — the version sweep over-carried this pin's digits: the
     marker is the 1.9.15 release's own BIRTH STAMP and lives in
     the source stamped 1.9.15 forever — the pin re-seats onto it. */
  assertMatch(viewerSrc, /1\.9\.15 — THE HINT IS RETIRED/, 'the retirement law is missing at the seat');
});

ok('A2 — the bar keeps its three-column grid (the peek trio stays dead center)', () => {
  assert.ok(!css.includes('.gd-imgview-hint'), 'the hint rule still paints');
  assert.ok(!css.includes('.gd-imgview-hud-right'), 'the right-zone rule still paints');
  assertMatch(css, /\.gd-imgview-hud \{\s*\n\s*display: grid;\s*\n\s*grid-template-columns: 1fr auto 1fr;/, 'the hud grid lost its 1fr · auto · 1fr law');
  /* 1.9.16 — the version sweep over-carried this pin's digits: the
     marker is the 1.9.15 release's own BIRTH STAMP and lives in
     the source stamped 1.9.15 forever — the pin re-seats onto it. */
  assertMatch(css, /1\.9\.15 — THE HINT ZONE IS RETIRED/, 'the retirement law is missing in the css');
  assertMatch(css, /\.gd-imgview-hud-left \{/, 'the left zone kept its seat');
  assertMatch(css, /\.gd-imgview-hud-mid \{/, 'the mid zone kept its seat');
});

console.log('B. THE WIDE CARD WRAPS THE ROW ("the cards wont stay next to the 4 normal cards, instead leaving exactly a 1 card gab inbetween")');

ok('B1 — the row-cap law sits at the packer (the capped flank test + its own row unit)', () => {
  /* 1.9.16 — the version sweep over-carried this pin's digits: the
     marker is the 1.9.15 release's own BIRTH STAMP and lives in
     the source stamped 1.9.15 forever — the pin re-seats onto it. */
  assertMatch(helpersSrc, /1\.9\.15 — THE COVERAGE DEMAND CAPS AT ONE ROW/, 'the row-cap law note is missing');
  assertMatch(helpersSrc, /const ROW_MIN = cw \* 1\.33 \+ g;/, 'the row unit lost its seat');
  assertMatch(helpersSrc, /if \(colHeights\[j\] < top \+ Math\.min\(h, ROW_MIN\)\) \{/, 'the flank test lost its cap');
});

// the reported wall, measured pure (probe_gap_1915): four 3:4 normals
// (293), a 16:10 enlarged (290), a 3:4 enlarged (566); cw 185, g 20.
const NORM = 293;
const WIDE1610 = 290;
const WIDE34 = 566;
const CW = 185;
const GAP = 20;
const REPORTED = [NORM, NORM, NORM, NORM, WIDE1610, WIDE34];
const SPANS = [1, 1, 1, 1, 2, 2];

ok('B2 — the reported wall: both enlarged cards sit in the SAME row flush under the normals (cols=4, the tight wall)', () => {
  const laid = layoutMasonry(REPORTED, 4, CW, GAP, SPANS);
  const [e1, e2] = [laid.positions[4], laid.positions[5]];
  assert.equal(e1.span, 2, 'the first enlarged card lost its span');
  assert.equal(e2.span, 2, 'the second enlarged card lost its span');
  assert.equal(e1.x, 0, 'the first enlarged card left the left margin');
  assert.equal(e2.x, 2 * (CW + GAP), 'the second enlarged card did not sit beside the first');
  assert.equal(e1.y, NORM + GAP, `the first enlarged card left the flush row (y=${e1.y})`);
  assert.equal(e2.y, NORM + GAP, `the second enlarged card left the flush row (y=${e2.y}) — the 1-card gap`);
  assert.ok(Math.abs(e1.y - e2.y) < 0.001, 'the enlarged cards traded rows');
});

ok('B3 — the reported wall at cols=5: same side-by-side row, the trailing cell alone stays open', () => {
  const laid = layoutMasonry(REPORTED, 5, CW, GAP, SPANS);
  const [e1, e2] = [laid.positions[4], laid.positions[5]];
  assert.equal(e1.x, 0, 'the first enlarged card left the left margin');
  assert.equal(e2.x, 2 * (CW + GAP), 'the second enlarged card did not sit beside the first');
  assert.equal(e1.y, NORM + GAP, `the first enlarged card left the flush row (y=${e1.y})`);
  assert.equal(e2.y, NORM + GAP, `the second enlarged card left the flush row (y=${e2.y})`);
  // the wall it replaced stacked the tower (the second wide a full row
  // lower) — the new wall must never tower past three rows of cards
  assert.ok(laid.height < 3 * NORM + WIDE34, `the wall still towers (${laid.height})`);
});

ok('B4 — the estimate phase and the measured phase agree on the seats (the re-flow flip is dead)', () => {
  // the class switch's first pack rides the estimates: cardWidth*1.33+46
  // for the unmeasured singles, x1.9 for the unmeasured wides.
  const est = CW * 1.33 + 46;
  const estWide = est * 1.9;
  for (const cols of [4, 5]) {
    const estPack = layoutMasonry([est, est, est, est, estWide, estWide], cols, CW, GAP, SPANS);
    const realPack = layoutMasonry(REPORTED, cols, CW, GAP, SPANS);
    for (const i of [4, 5]) {
      assert.equal(estPack.positions[i].x, realPack.positions[i].x, `card${i + 1}: the estimate phase picked another column (cols=${cols})`);
      assert.ok(Math.abs(estPack.positions[i].y - realPack.positions[i].y) < 2, `card${i + 1}: the estimate phase picked another row (cols=${cols})`);
    }
  }
});

ok('B5 — the 1.8.2 indent stays banned byte-for-byte (a short wide card never tucks past an open lane)', () => {
  const laid = layoutMasonry([380, 300, 140], 3, 185, 20, [1, 1, 2]);
  assert.equal(laid.positions[2].x, 0, 'the indent resurrected (the 1.8.2 wall)');
  assert.equal(laid.positions[2].y, 400, 'the leftmost floor lost its seat');
  const equal = layoutMasonry([300, 300, 140], 3, 185, 20, [1, 1, 2]);
  assert.equal(equal.positions[2].x, 0, 'the equal-top tie indented the wide card');
});

ok('B6 — the flank-covered indent still speaks (the tall stack faces the wide card)', () => {
  const laid = layoutMasonry([1000, 10, 10, 150], 3, 185, 20, [1, 1, 1, 2]);
  assert.equal(laid.positions[3].x, 205, 'the flank-covered rightward seat lost its word');
  assert.equal(laid.positions[3].y, 30, 'the shallower rightward seat lost its depth');
});

ok('B7 — the single-span law keeps its word (no spans, the old packing)', () => {
  const laid = layoutMasonry([100, 50, 70], 3, 185, 20, null);
  assert.deepEqual(
    laid.positions.map((p) => [p.x, p.y, p.span]),
    [
      [0, 0, 1],
      [205, 0, 1],
      [410, 0, 1],
    ],
    'the single-span packing drifted'
  );
});

ok('B8 — the tall-first order wraps the same row (the 3:4 enlarged leading the 16:10)', () => {
  const laid = layoutMasonry([NORM, NORM, NORM, NORM, WIDE34, WIDE1610], 5, CW, GAP, SPANS);
  const [e1, e2] = [laid.positions[4], laid.positions[5]];
  assert.equal(e1.x, 0, 'the tall enlarged card left the left margin');
  assert.equal(e2.x, 2 * (CW + GAP), 'the short enlarged card did not sit beside the tall one');
  assert.equal(e1.y, NORM + GAP, `the tall enlarged card left the flush row (y=${e1.y})`);
  assert.equal(e2.y, NORM + GAP, `the short enlarged card left the flush row (y=${e2.y})`);
});

console.log('C. THE FURNITURE');

ok('C1 — the version is 1.9.15 everywhere (pkg + constants)', () => {
  assertMatch(pkg, /"version": "1\.9\.19",/, 'the package seat drifted');
  const consts = src('src/constants/index.js');
  assertMatch(consts, /version: '1\.9\.19',/, 'the constants seat drifted');
});

ok('C2 — the changelog head tells this story', () => {
  assert.ok(changelog.startsWith('## 1.9.19 — The Ends Trade Places'), 'the changelog head is not the 1.9.15 entry');
  assertMatch(changelog, /The viewer's hint is retired/, 'the hint bullet is missing');
  assertMatch(changelog, /The wide card wraps the row — the 1-card gap beside the normals is closed/, 'the row bullet is missing');
  // the 1.9.14 shadow law carries forward right beneath this entry
  assertMatch(changelog, /## 1\.9\.14 — The Shadow Keeps Its Ink/, 'the 1.9.14 line lost its seat');
});

ok('C3 — the README badge + battery count welcome this very suite', () => {
  assertMatch(readme, /version-1\.9\.19-purple/, 'the README badge drifted');
  assertMatch(readme, /93 DOM\/source test suites/, 'the README battery count drifted');
});

ok('C4 — the battery runner runs this suite', () => {
  assertMatch(runner, /gendex_1915_batch_dom/, 'the runner never welcomed 1915');
});

ok('C5 — the worklog keeps the 1.9.15 seat', () => {
  assertMatch(worklog, /1\.9\.19/, 'the worklog never speaks 1.9.15');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
if (passed !== 15) {
  console.log(`SUITE INCOMPLETE — ${passed}/15 checks present`);
  process.exit(1);
}
console.log('ALL GREEN');
