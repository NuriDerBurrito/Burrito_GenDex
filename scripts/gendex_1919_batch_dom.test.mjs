// 1.9.19 batch — The Ends Trade Places.
// (Named 1919 in the suite sequence: 1916 the 1.9.16, 1917 the 1.9.17,
//  1918 the 1.9.18; this suite pins the 1.9.19 laws at their roots.
//  Built on the 1.9.18 line — the last release continues.)
// The reported item, pinned at its root law:
//   A.  THE ENDS TRADE PLACES ("just make the zoom options on the right
//       with the reset the view button, (reset the view button should
//       be the one inwards towards the center of course not towards the
//       edge , basically just mirror it) , and the count of the images
//       should be on the left instead, thats all"): the two end crews
//       trade seats. The view crew rides the FLANK — the bar's own
//       right end — MIRRORED (reset · zoom-in · % · zoom-out, the
//       1.9.18 cluster's literal mirror: the reset key stands INWARDS,
//       nearest the switcher, never against the edge; the zoom-out key
//       parks at the bar's own right end) and the count rides the LEFT
//       zone at the bar's own left end. The one-shape law carries
//       whole — one markup, the same three zones whatever the viewer
//       holds, the switcher locked when solo; the parking laws are
//       untouched, only the ends traded their crews.
//   B.  THE FAMILY'S MEMBERSHIP — the one shape both cases ride: the
//       count alone at the left zone, the mirrored view crew at the
//       flank (the ORDER pinned: reset inwards first, zoom-out at the
//       edge last), the locked switcher at the mid, and no ternary
//       breeding shapes.
//   C.  THE FURNITURE — the version seats speak 1.9.19, the changelog
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

console.log('A. THE ENDS TRADE PLACES ("just make the zoom options on the right with the reset the view button, (reset the view button should be the one inwards towards the center of course not towards the edge , basically just mirror it) , and the count of the images should be on the left instead, thats all")');

ok('A1 — the law note sits at the bar\'s seat with the report\'s own words', () => {
  assertMatch(viewerSrc, /1\.9\.19 — THE ENDS TRADE PLACES/, 'the mirror law note is missing at the seat');
  assertMatch(viewerSrc, /make the zoom options on\s+the right with the reset the view button/, 'the zoom-right quote is missing from the law');
  assertMatch(viewerSrc, /the one inwards towards the center of course\s+not towards the edge/, 'the inwards quote is missing from the law');
  assertMatch(viewerSrc, /basically just mirror it/, 'the mirror quote is missing from the law');
  assertMatch(viewerSrc, /count of the images should be on\s+the left instead/, 'the count-left quote is missing from the law');
});

ok('A2 — the law note sits at the css seat, and the seats\' own notes speak the trade', () => {
  assertMatch(css, /1\.9\.19 — THE ENDS TRADE PLACES/, 'the mirror law note is missing in the css');
  assertMatch(css, /1\.9\.19 — THE ENDS TRADE PLACES: the LEFT-end/, 'the left zone\'s own trade note is missing at the rule');
  assertMatch(css, /1\.9\.19 — THE ENDS TRADE PLACES: the RIGHT-end/, 'the flank\'s own trade note is missing at the rule');
});

ok('A3 — the left zone keeps its LEFT-end parking (the count\'s new home)', () => {
  const left = css.match(/^\.gd-imgview-hud-left \{[^}]*\}/m)?.[0] || '';
  assertMatch(left, /justify-content:\s*flex-start/, 'the left zone drifted off the bar\'s left end');
  assert.ok(!left.includes('justify-content: flex-end'), 'the retired 1.9.16 lean still drives the left zone (the mixing disease)');
});

ok('A4 — the flank keeps its RIGHT-end parking + its wrap guard (the mirrored crew\'s home)', () => {
  const flank = css.match(/^\.gd-imgview-hud-flank \{[^}]*\}/m)?.[0] || '';
  assertMatch(flank, /justify-content:\s*flex-end/, 'the flank drifted off the bar\'s right end');
  assertMatch(flank, /gap:\s*8px;/, 'the flank lost its own gaps');
  assertMatch(flank, /flex-wrap:\s*wrap;/, 'the flank lost its wrap word (the clip guard)');
});

ok('A5 — the mid keeps its dead-center word for the peeks alone', () => {
  const mid = css.match(/^\.gd-imgview-hud-mid \{[^}]*\}/m)?.[0] || '';
  assertMatch(mid, /justify-content:\s*center/, 'the mid zone lost its dead-center word');
  assertMatch(mid, /gap:\s*8px;/, 'the mid zone lost its own gaps');
});

ok('A6 — the grid keeps its three-column zoning (one shape, three zones)', () => {
  const hud = css.match(/^\.gd-imgview-hud \{[^}]*\}/m)?.[0] || '';
  assertMatch(hud, /grid-template-columns:\s*1fr auto 1fr/, 'the bar lost its 1fr · auto · 1fr grid');
});

ok('A7 — the retired hint\'s seats stay retired (the 1.9.15 word carries)', () => {
  assert.ok(!css.includes('.gd-imgview-hud-right'), 'the right-zone rule resurrected');
  assert.ok(!css.includes('.gd-imgview-hint'), 'the hint rule resurrected');
});

ok('A8 — the LOCK paints its own seat: a resting cast, an honest hand, no promised walk', () => {
  const lockRule = css.match(/^\.gd-imgview-peeks\.is-locked \.gd-imgview-peek \{[^}]*\}/m)?.[0] || '';
  assertMatch(lockRule, /opacity:\s*0\.45;/, 'the locked peeks lost their resting cast');
  assertMatch(lockRule, /cursor:\s*not-allowed;/, 'the locked hand lost its honest word');
  const lockHover = css.match(/^\.gd-imgview-peeks\.is-locked \.gd-imgview-peek:hover \{[^}]*\}/m)?.[0] || '';
  assertMatch(lockHover, /transform:\s*none;/, 'the locked hover still promises a walk');
  const lockCurrent = css.match(/^\.gd-imgview-peeks\.is-locked \.gd-imgview-peek\.is-current \{[^}]*\}/m)?.[0] || '';
  assertMatch(lockCurrent, /opacity:\s*0\.9;/, 'the locked current lost its honesty');
  assertMatch(lockCurrent, /cursor:\s*default;/, 'the locked current points anywhere');
});

ok('A9 — THE MIRROR ORDER, pinned in the jsx: reset INWARDS first, zoom-out at the edge last', () => {
  const flank = viewerSrc.match(/className="gd-imgview-hud-flank"[\s\S]*?<\/div>/)?.[0] || '';
  assert.ok(flank.length > 0, 'the flank block never split');
  const iReset = flank.indexOf('Reset the view');
  const iIn = flank.indexOf('Zoom in (+)');
  const iVal = flank.indexOf('gd-imgview-zoomval');
  const iOut = flank.indexOf('Zoom out (−)');
  assert.ok(iReset > -1 && iIn > iReset, 'the reset key is not the inwards (first) key of the crew');
  assert.ok(iVal > iIn, 'the zoom percentage is not the crew\'s middle seat');
  assert.ok(iOut > iVal, 'the zoom-out key is not the edge (last) key of the crew');
  assert.ok(iOut < flank.length, 'the crew\'s order never spoke');
});

console.log('B. THE FAMILY\'S MEMBERSHIP (the one shape both cases ride)');

// the hud block is ONE markup — the one shape every viewer rides (the
// 1.9.18 word, carried whole through the trade).
const hudBlock = viewerSrc.match(/<div className="gd-imgview-hud">[\s\S]*?\n      <\/div>/)?.[0] || '';
assert.ok(hudBlock.length > 0, 'the hud block never split');

ok('B1 — the count rides the left zone ALONE (the traded seat)', () => {
  const left = viewerSrc.match(/className="gd-imgview-hud-left"[\s\S]*?<\/div>/)?.[0] || '';
  assertMatch(left, /gd-imgview-count/, 'the count left the bar\'s left end');
  assert.ok(!left.includes('resetView'), 'the reset key never belonged at the left end');
  assert.ok(!left.includes('ZoomOut') && !left.includes('ZoomIn'), 'the zoom keys never belonged at the left end');
  assert.ok(!left.includes('gd-imgview-zoomval'), 'the zoom percentage never belonged at the left end');
});

ok('B2 — the view crew rides the flank: the whole mirrored cluster', () => {
  const flank = viewerSrc.match(/className="gd-imgview-hud-flank"[\s\S]*?<\/div>/)?.[0] || '';
  assertMatch(flank, /resetView/, 'the reset key left the right end (the crew must sit whole)');
  assertMatch(flank, /ZoomIn/, 'the zoom-in key left the right end');
  assertMatch(flank, /gd-imgview-zoomval/, 'the zoom percentage left the right end');
  assertMatch(flank, /ZoomOut/, 'the zoom-out key left the right end');
  assert.ok(!flank.includes('gd-imgview-count'), 'the count never belonged at the right end');
});

ok('B3 — the switcher keeps the mid seat and the lock rides the jsx', () => {
  assertMatch(hudBlock, /gd-imgview-hud-mid/, 'the mid zone left the one-shape bar');
  assertMatch(hudBlock, /gd-imgview-peeks/, 'the peek trio left the one-shape bar');
  assertMatch(viewerSrc, /clsx\('gd-imgview-peeks', solo && 'is-locked'\)/, 'the lock never rides the peeks');
  assertMatch(viewerSrc, /disabled=\{solo\}/, 'the locked peeks never pin the walk');
});

ok('B4 — the ternary that bred two bars stays retired (one markup, both cases)', () => {
  assertMatch(viewerSrc, /const solo = images\.length < 2;/, 'the solo word never spoke');
  assert.ok(!viewerSrc.includes('images.length > 1 ?'), 'the two-bar ternary resurrected');
});

ok('B5 — the solo neighborhood paints: the neighbors are the picture itself, the hands speak the lock', () => {
  assertMatch(viewerSrc, /const prevImage = images\[\(safeIndex - 1 \+ images\.length\) % images\.length\];/, 'the previous neighbor lost its one-shape word');
  assertMatch(viewerSrc, /const nextImage = images\[\(safeIndex \+ 1\) % images\.length\];/, 'the next neighbor lost its one-shape word');
  assertMatch(viewerSrc, /title=\{solo \? 'No other images \(locked\)' : 'Previous \(←\)'\}/, 'the locked previous hand never spoke');
  assertMatch(viewerSrc, /title=\{solo \? 'No other images \(locked\)' : 'Next \(→\)'\}/, 'the locked next hand never spoke');
});

console.log('C. THE FURNITURE');

ok('C1 — the version is 1.9.19 everywhere (pkg + constants)', () => {
  assertMatch(pkg, /"version": "1\.9\.19",/, 'the package seat drifted');
  const consts = src('src/constants/index.js');
  assertMatch(consts, /version: '1\.9\.19',/, 'the constants seat drifted');
});

ok('C2 — the changelog head tells this story', () => {
  assert.ok(changelog.startsWith('## 1.9.19 — The Ends Trade Places'), 'the changelog head is not the 1.9.19 entry');
  assertMatch(changelog, /The view crew rides the right end, mirrored — the reset stands inwards/, 'the mirror bullet is missing');
  assertMatch(changelog, /The count rides the left end/, 'the count bullet is missing');
  // the 1.9.18 law carries forward right beneath this entry
  assertMatch(changelog, /## 1\.9\.18 — The Bar Keeps One Shape/, 'the 1.9.18 line lost its seat');
});

ok('C3 — the README badge + battery count welcome this very suite', () => {
  assertMatch(readme, /version-1\.9\.19-purple/, 'the README badge drifted');
  assertMatch(readme, /\*\*v1\.9\.19\*\*/, 'the README version line drifted');
  assertMatch(readme, /93 DOM\/source test suites/, 'the README battery count drifted');
});

ok('C4 — the battery runner runs this suite', () => {
  assertMatch(runner, /gendex_1919_batch_dom/, 'the runner never welcomed 1919');
});

ok('C5 — the worklog keeps the 1.9.19 seat', () => {
  assertMatch(worklog, /1\.9\.19/, 'the worklog never speaks 1.9.19');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
if (passed !== 19) {
  console.log(`SUITE INCOMPLETE — ${passed}/19 checks present`);
  process.exit(1);
}
console.log('ALL GREEN');
