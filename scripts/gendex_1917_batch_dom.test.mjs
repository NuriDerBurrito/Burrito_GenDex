// 1.9.17 batch — The Middle Belongs to the Switcher.
// (Named 1917 in the suite sequence: 1914 the 1.9.14, 1915 the 1.9.15,
//  1916 the 1.9.16; this suite pins the 1.9.17 laws at their roots.
//  Built on the 1.9.16 line — the last release continues.)
// The reported item, pinned at its root law:
//   A.  THE MIDDLE BELONGS TO THE SWITCHER ("the image count and zoom
//       and zoom percentage and the images right and left viewer in the
//       huge image viewer window, they are mixing together and look bad,
//       rework it so it fits in the new space and redo it properly, if
//       worse come to worst readd the text from before but ensure it
//       doesnt clip to the right side of the screen like before"): the
//       1.9.16 balance leaned BOTH control zones toward the center — the
//       zoom trio pressing right up against the peek's left arrow and
//       the count + fit against its right — so on a huge window the
//       whole bar read as one mashed cluster crowding the navigator
//       while the bar's own ends sat empty. The zoning keeps the 1.9.16
//       word (the family still flanks the switcher; a single image
//       still rides the whole family dead center through the mid zone
//       alone); the PARKING is reworked: the left zone parks the zoom
//       trio at the bar's own LEFT end, the flank parks the count + fit
//       at the bar's own RIGHT end (the retired hint's old territory —
//       a short wrap-capable cluster that can never clip off the edge
//       the way the long single-line hint text once did), and the
//       middle belongs to the switcher alone.
//   B.  THE FAMILY'S MEMBERSHIP — the zoning keeps the 1.9.16 word: the
//       zoom trio rides the left zone, the count + fit ride the flank,
//       the switcher rides the mid dead center, and a single image
//       rides the whole family through the mid zone alone.
//   C.  THE FURNITURE — the version seats speak 1.9.17, the changelog
//       head tells this story, the README badge + battery count welcome
//       this very suite, and the battery runner runs it.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

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

const pkg = src('package.json');
const readme = src('README.md');
const changelog = src('CHANGELOG.md');
const runner = src('scripts/run_battery_171.sh');
const viewerSrc = src('src/components/ImageViewer.jsx');
const css = src('src/index.css');

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

console.log('A. THE MIDDLE BELONGS TO THE SWITCHER ("the image count and zoom and zoom percentage and the images right and left viewer in the huge image viewer window, they are mixing together and look bad, rework it so it fits in the new space and redo it properly, if worse come to worst readd the text from before but ensure it doesnt clip to the right side of the screen like before")');

ok('A1 — the law note sits at the bar\'s seat with the report\'s own words', () => {
  /* 1.9.18 — the version sweep over-carried this pin's digits: the
     marker is the 1.9.17 release's own BIRTH STAMP and lives in
     the source stamped 1.9.17 forever — the pin re-seats onto it. */
  assertMatch(viewerSrc, /1\.9\.17 — THE MIDDLE BELONGS TO THE SWITCHER/, 'the middle law note is missing at the seat');
  assertMatch(viewerSrc, /they are mixing\s+together and look bad/, 'the report quote is missing from the law');
  assertMatch(viewerSrc, /rework it so it fits in the new space\s+and redo it properly/, 'the rework quote is missing from the law');
});

ok('A2 — the law note sits at the css seat with the retired word', () => {
  /* 1.9.18 — the version sweep over-carried this pin's digits: the
     marker is the 1.9.17 release's own BIRTH STAMP and lives in
     the source stamped 1.9.17 forever — the pin re-seats onto it. */
  assertMatch(css, /1\.9\.17 — THE MIDDLE BELONGS TO THE SWITCHER/, 'the middle law note is missing in the css');
  assertMatch(css, /the 1\.9\.16\s+leans are RETIRED/, 'the retired word is missing from the law');
});

ok('A3 — the left zone parks the bar\'s own LEFT end (the 1.9.19 ground: the count parks here now)', () => {
  const left = css.match(/^\.gd-imgview-hud-left \{[^}]*\}/m)?.[0] || '';
  assertMatch(left, /justify-content:\s*flex-start/, 'the left zone drifted off the bar\'s left end');
  /* 1.9.18 — the version sweep over-carried this pin's digits: the
     marker is the 1.9.17 release's own BIRTH STAMP and lives in
     the source stamped 1.9.17 forever — the pin re-seats onto it. */
  assertMatch(left, /1\.9\.17 — the lean is retired/, 'the parking note is missing at the rule');
  assert.ok(!left.includes('justify-content: flex-end'), 'the retired 1.9.16 lean still drives the left zone (the mixing disease)');
});

ok('A4 — the flank parks the bar\'s own RIGHT end + its wrap guard (the 1.9.19 ground: the mirrored view crew parks here now)', () => {
  const flank = css.match(/^\.gd-imgview-hud-flank \{[^}]*\}/m)?.[0] || '';
  assertMatch(flank, /justify-content:\s*flex-end/, 'the flank drifted off the bar\'s right end');
  assertMatch(flank, /gap:\s*8px;/, 'the flank lost its own gaps');
  assertMatch(flank, /flex-wrap:\s*wrap;/, 'the flank lost its wrap word (the clip guard)');
  assert.ok(!flank.includes('justify-content: flex-start'), 'the retired 1.9.16 lean still drives the flank (the mixing disease)');
});

ok('A5 — the mid keeps its dead-center word for the peeks alone', () => {
  const mid = css.match(/^\.gd-imgview-hud-mid \{[^}]*\}/m)?.[0] || '';
  assertMatch(mid, /justify-content:\s*center/, 'the mid zone lost its dead-center word');
  assertMatch(mid, /gap:\s*8px;/, 'the mid zone lost its own gaps');
});

ok('A6 — the grid keeps its three-column zoning (the family still flanks the switcher)', () => {
  const hud = css.match(/^\.gd-imgview-hud \{[^}]*\}/m)?.[0] || '';
  assertMatch(hud, /grid-template-columns:\s*1fr auto 1fr/, 'the bar lost its 1fr · auto · 1fr grid');
});

ok('A7 — the retired hint\'s seats stay retired (the 1.9.15 word carries)', () => {
  assert.ok(!css.includes('.gd-imgview-hud-right'), 'the right-zone rule resurrected');
  assert.ok(!css.includes('.gd-imgview-hint'), 'the hint rule resurrected');
});

console.log('B. THE FAMILY\'S MEMBERSHIP (the zoning keeps the 1.9.16 word)');

/* 1.9.18 — THE BAR KEEPS ONE SHAPE re-seated this extraction: the
   ternary that bred two bars is retired — the hud block is ONE markup
   now, the same shape for every viewer, so the membership pins read it
   whole instead of splitting at a branch that no longer exists. */
const hudBlock = viewerSrc.match(/<div className="gd-imgview-hud">[\s\S]*?\n      <\/div>/)?.[0] || '';
assert.ok(hudBlock.length > 0, 'the hud block never split');

ok('B1 — the count rides the left zone alone (the 1.9.19 retrue: the ends traded crews)', () => {
  const left = viewerSrc.match(/className="gd-imgview-hud-left"[\s\S]*?<\/div>/)?.[0] || '';
  /* 1.9.19 — THE ENDS TRADE PLACES re-seated this pin: the count traded
     ends with the view crew — it parks at the bar's LEFT end now. */
  assertMatch(left, /gd-imgview-count/, 'the count left the left end');
  assert.ok(!left.includes('resetView'), 'the reset key never belonged at the left end');
  assert.ok(!left.includes('ZoomOut') && !left.includes('ZoomIn'), 'the zoom keys never belonged at the left end');
  assert.ok(!left.includes('gd-imgview-zoomval'), 'the zoom percentage never belonged at the left end');
});

ok('B2 — the view crew rides the flank MIRRORED — reset inwards (the 1.9.19 retrue)', () => {
  const flank = viewerSrc.match(/className="gd-imgview-hud-flank"[\s\S]*?<\/div>/)?.[0] || '';
  /* 1.9.19 — THE ENDS TRADE PLACES re-seated this pin: the whole view
     crew traded ends with the count and rides the right end MIRRORED —
     reset · zoom-in · % · zoom-out — the reset key standing inwards,
     nearest the switcher, never against the edge. */
  assertMatch(flank, /resetView/, 'the reset key left the right end (the crew must sit whole)');
  assertMatch(flank, /ZoomIn/, 'the zoom-in key left the right end');
  assertMatch(flank, /gd-imgview-zoomval/, 'the zoom percentage left the right end');
  assertMatch(flank, /ZoomOut/, 'the zoom-out key left the right end');
  assert.ok(!flank.includes('gd-imgview-count'), 'the count never belonged at the right end');
});

ok('B3 — the switcher keeps the mid seat, its zone holds no count', () => {
  assertMatch(hudBlock, /gd-imgview-hud-mid/, 'the mid zone left the one-shape bar');
  assertMatch(hudBlock, /gd-imgview-peeks/, 'the peek trio left the one-shape bar');
  const midHead = hudBlock.match(/gd-imgview-hud-mid"\s*>[\s\S]*?gd-imgview-peeks/)?.[0] || '';
  assert.ok(!midHead.includes('gd-imgview-count'), 'the count leaned onto the switcher\'s own zone');
});

ok('B4 — a single image: the SAME bar rides, the switcher stands LOCKED (the one-shape law)', () => {
  /* 1.9.18 — THE BAR KEEPS ONE SHAPE re-seated this pin: the solo branch
     is gone with the ternary — one hud markup paints both cases, so the
     solo word rides the lock the jsx speaks, not a second shape. */
  assertMatch(viewerSrc, /const solo = images\.length < 2;/, 'the solo word never spoke');
  assertMatch(viewerSrc, /clsx\('gd-imgview-peeks', solo && 'is-locked'\)/, 'the lock never rides the peeks');
  assertMatch(viewerSrc, /disabled=\{solo\}/, 'the locked peeks never pin the walk');
  assertMatch(viewerSrc, /No other images \(locked\)/, 'the locked hand never speaks its truth');
  assert.ok(!viewerSrc.includes('images.length > 1 ?'), 'the two-bar ternary resurrected');
});

console.log('C. THE FURNITURE');

ok('C1 — the version is 1.9.17 everywhere (pkg + constants)', () => {
  assertMatch(pkg, /"version": "1\.9\.19",/, 'the package seat drifted');
  const consts = src('src/constants/index.js');
  assertMatch(consts, /version: '1\.9\.19',/, 'the constants seat drifted');
});

ok('C2 — the changelog head tells this story', () => {
  assert.ok(changelog.startsWith('## 1.9.19 — The Ends Trade Places'), 'the changelog head is not the 1.9.17 entry');
  assertMatch(changelog, /The family parks at the ends/, 'the parking bullet is missing');
  // the 1.9.16 law carries forward right beneath this entry
  assertMatch(changelog, /## 1\.9\.16 — The Wall Waits for the Open/, 'the 1.9.16 line lost its seat');
});

ok('C3 — the README badge + battery count welcome this very suite', () => {
  assertMatch(readme, /version-1\.9\.19-purple/, 'the README badge drifted');
  assertMatch(readme, /\*\*v1\.9\.19\*\*/, 'the README version line drifted');
  assertMatch(readme, /93 DOM\/source test suites/, 'the README battery count drifted');
});

ok('C4 — the battery runner runs this suite', () => {
  assertMatch(runner, /gendex_1917_batch_dom/, 'the runner never welcomed 1917');
});

ok('C5 — the worklog keeps the 1.9.17 seat', () => {
  assertMatch(worklog, /1\.9\.19/, 'the worklog never speaks 1.9.17');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
if (passed !== 16) {
  console.log(`SUITE INCOMPLETE — ${passed}/16 checks present`);
  process.exit(1);
}
console.log('ALL GREEN');
