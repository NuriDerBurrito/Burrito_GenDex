// 1.9.16 batch — The Wall Waits for the Open.
// (Named 1916 in the suite sequence: 1910 the 1.9.10, 1911 the 1.9.11,
//  1912 the 1.9.12, 1913 the 1.9.13, 1914 the 1.9.14 (the shadow's own
//  ink law — its release was never published to GitHub, but its build
//  carries forward into this tree), 1915 the 1.9.15; this suite pins the
//  1.9.16 laws at their roots. Built on the 1.9.15 line — the last
//  release continues.)
// The reported items, pinned at their root laws:
//   A.  THE WALL WAITS FOR THE OPEN ("when dragging or reordering cards
//       around, for some reason it will always snap the viewer to the
//       currently open card, fix that so its only when i open a card"):
//       the 1.9.6 follow effect re-ran on EVERY re-pack trigger (the
//       order key, the columns, the card width, the heights, the spans),
//       so the drag's commit re-fired the smooth settle and teleported
//       the wall back to the open card. The effect re-runs on the
//       SELECTION alone now; the packed-seat fallback reads the LIVE
//       pack through a ref (the closure would freeze the wall at open
//       time); the resize beats ride only the open's own FLIGHT WINDOW
//       (~0.7s) and then the observer retires — a reorder, a zoom step,
//       a late height, a resize an hour later never move the wall again.
//   B.  THE BAR FINDS ITS BALANCE ("have the image count, zoom and zoom
//       percetage and fit buttons and such be in the middle when its a
//       single image, but when its multiple, have them on the left and
//       right of the image switcher at the bottom, since currently the
//       right side feels so empty, basically balance it"): with multiple
//       images the zoom trio hugs the switcher's LEFT flank and the
//       count + fit hug its RIGHT (each zone leaning toward the center),
//       and with a single image the whole family rides the MID zone
//       alone — dead center, the seat the switcher owns when it exists.
//   C.  THE FURNITURE — the version seats speak 1.9.16, the changelog
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
// strip both comment dialects before text bans — the law comments quote
// the report on purpose, the rendering itself must not speak it.
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const pkg = src('package.json');
const readme = src('README.md');
const changelog = src('CHANGELOG.md');
const runner = src('scripts/run_battery_171.sh');
const masonrySrc = src('src/components/MasonryGrid.jsx');
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

console.log('A. THE WALL WAITS FOR THE OPEN ("when dragging or reordering cards around, for some reason it will always snap the viewer to the currently open card, fix that so its only when i open a card")');

ok('A1 — the law note sits at the 1.9.6 seat with the report\'s own words', () => {
  /* 1.9.17 — the version sweep over-carried this pin's digits: the
     marker is the 1.9.16 release's own BIRTH STAMP and lives in
     the source stamped 1.9.16 forever — the pin re-seats onto it. */
  assertMatch(masonrySrc, /1\.9\.16 — THE WALL WAITS FOR THE OPEN/, 'the wall law note is missing at the seat');
  assertMatch(masonrySrc, /fix that so its only when i open a card/, 'the report quote is missing from the law');
  assertMatch(masonrySrc, /the "always\s+snaps" the report names/, 'the diagnosis word is missing');
});

ok('A2 — the effect re-runs on the SELECTION alone (no re-pack trigger moves the wall)', () => {
  // the effect's own dependency list — the selection and nothing else
  assertMatch(
    masonrySrc,
    /\/\/ eslint-disable-next-line react-hooks\/exhaustive-deps\n\s*\}, \[keepInViewId\]\);/,
    'the follow effect lost its selection-only dependency list'
  );
  // the 1.9.6 deps array — the disease's own seat — is gone
  assert.ok(
    !masonrySrc.includes('[keepInViewId, idKey, columns, cardWidth, gap, heights, expandedIds]'),
    'the old re-pack dependency array still drives the effect'
  );
});

ok('A3 — the packed-seat fallback reads the LIVE pack through the ref', () => {
  assertMatch(masonrySrc, /const posByIdRef = useRef\(posById\);/, 'the ref never took its seat');
  assertMatch(masonrySrc, /posByIdRef\.current = posById;/, 'the ref never refreshes the pack');
  assertMatch(masonrySrc, /const p = posByIdRef\.current\.get\(keepInViewId\);/, 'the fallback reads the frozen closure pack');
});

ok('A4 — the resize beats ride only the open event\'s own flight window', () => {
  assertMatch(masonrySrc, /ride ONLY the open event's own flight/, 'the flight-window law note is missing');
  assertMatch(masonrySrc, /const disarm = ro \? setTimeout\(\(\) => ro\.disconnect\(\), 700\) : 0;/, 'the disarm timer never took its seat');
  assertMatch(masonrySrc, /if \(disarm\) clearTimeout\(disarm\);/, 'the cleanup never clears the disarm');
  assertMatch(masonrySrc, /when the window\s+retires the observer disconnects with it/, 'the retirement word is missing');
});

console.log('B. THE BAR FINDS ITS BALANCE ("have the image count, zoom and zoom percetage and fit buttons and such be in the middle when its a single image, but when its multiple, have them on the left and right of the image switcher at the bottom, since currently the right side feels so empty, basically balance it")');

/* 1.9.18 — THE BAR KEEPS ONE SHAPE re-seated this extraction: the
   ternary that bred two bars is retired — the hud block is ONE markup
   now, the same shape for every viewer, so the membership pins read it
   whole instead of splitting at a branch that no longer exists. */
const hudBlock = viewerSrc.match(/<div className="gd-imgview-hud">[\s\S]*?\n      <\/div>/)?.[0] || '';
assert.ok(hudBlock.length > 0, 'the hud block never split');

ok('B1 — the law note sits at the bar\'s seat with the report\'s own words', () => {
  /* 1.9.17 — the version sweep over-carried this pin's digits: the
     marker is the 1.9.16 release's own BIRTH STAMP and lives in
     the source stamped 1.9.16 forever — the pin re-seats onto it. */
  assertMatch(viewerSrc, /1\.9\.16 — THE BAR FINDS ITS BALANCE/, 'the balance law note is missing at the seat');
  assertMatch(viewerSrc, /basically balance it/, 'the report quote is missing from the law');
});

ok('B2 — the count rides the LEFT zone alone (the 1.9.19 retrue)', () => {
  const left = viewerSrc.match(/className="gd-imgview-hud-left"[\s\S]*?<\/div>/)?.[0] || '';
  /* 1.9.19 — THE ENDS TRADE PLACES re-seated this pin: the count traded
     ends with the view crew — it parks at the bar's LEFT end now. */
  assertMatch(left, /gd-imgview-count/, 'the count left the left flank');
  assert.ok(!left.includes('resetView'), 'the reset key never belonged at the left flank');
  assert.ok(!left.includes('ZoomOut') && !left.includes('ZoomIn'), 'the zoom keys never belonged at the left flank');
  assert.ok(!left.includes('gd-imgview-zoomval'), 'the zoom percentage never belonged at the left flank');
});

ok('B3 — the view crew hugs the RIGHT flank MIRRORED — reset inwards (the 1.9.19 retrue)', () => {
  const flank = viewerSrc.match(/className="gd-imgview-hud-flank"[\s\S]*?<\/div>/)?.[0] || '';
  /* 1.9.19 — THE ENDS TRADE PLACES re-seated this pin: the whole view
     crew traded ends with the count and rides the right end MIRRORED —
     reset · zoom-in · % · zoom-out — the reset key standing inwards,
     nearest the switcher, never against the edge. */
  assertMatch(flank, /resetView/, 'the reset key left the right flank');
  assertMatch(flank, /ZoomIn/, 'the zoom-in key left the right flank');
  assertMatch(flank, /gd-imgview-zoomval/, 'the zoom percentage left the right flank');
  assertMatch(flank, /ZoomOut/, 'the zoom-out key left the right flank');
  assert.ok(!flank.includes('gd-imgview-count'), 'the count never belonged at the right flank');
});

ok('B4 — the switcher keeps its dead-center seat (the mid zone of the one-shape bar)', () => {
  assertMatch(hudBlock, /gd-imgview-hud-mid/, 'the mid zone left the one-shape bar');
  assertMatch(hudBlock, /gd-imgview-peeks/, 'the peek trio left the one-shape bar');
  // the mid zone's own head (between its seat and the peeks cluster)
  // holds no count — the count rides the flank, never the switcher's bar
  const midHead = hudBlock.match(/gd-imgview-hud-mid"\s*>[\s\S]*?gd-imgview-peeks/)?.[0] || '';
  assert.ok(!midHead.includes('gd-imgview-count'), 'the count leaned onto the switcher\'s own zone');
});

ok('B5 — a single image: the SAME bar rides, the switcher stands LOCKED (the one-shape law)', () => {
  /* 1.9.18 — THE BAR KEEPS ONE SHAPE re-seated this pin: the solo branch
     is gone with the ternary — one hud markup paints both cases, so the
     solo word rides the lock the jsx speaks, not a second shape. */
  assertMatch(viewerSrc, /const solo = images\.length < 2;/, 'the solo word never spoke');
  assertMatch(viewerSrc, /clsx\('gd-imgview-peeks', solo && 'is-locked'\)/, 'the lock never rides the peeks');
  assertMatch(viewerSrc, /disabled=\{solo\}/, 'the locked peeks never pin the walk');
  assertMatch(viewerSrc, /No other images \(locked\)/, 'the locked hand never speaks its truth');
  assert.ok(!viewerSrc.includes('images.length > 1 ?'), 'the two-bar ternary resurrected');
});

ok('B6 — the parking law (the 1.9.17 retrue): the family parks at the bar\'s ends', () => {
  const hud = css.match(/^\.gd-imgview-hud \{[^}]*\}/m)?.[0] || '';
  assertMatch(hud, /grid-template-columns:\s*1fr auto 1fr/, 'the bar lost its 1fr · auto · 1fr grid');
  const left = css.match(/^\.gd-imgview-hud-left \{[^}]*\}/m)?.[0] || '';
  /* 1.9.17 — THE MIDDLE BELONGS TO THE SWITCHER re-seated this pin: the
     1.9.16 lean (flex-end, toward the switcher) was the mixing the
     report retired — the zone parks at the bar's LEFT end now. */
  assertMatch(left, /justify-content:\s*flex-start/, 'the left zone drifted off the bar\'s left end');
  assert.ok(!left.includes('justify-content: flex-end'), 'the 1.9.16 lean still drives the left zone (the mixing disease)');
  const mid = css.match(/^\.gd-imgview-hud-mid \{[^}]*\}/m)?.[0] || '';
  assertMatch(mid, /justify-content:\s*center/, 'the mid zone lost its dead-center word');
  assertMatch(mid, /gap:\s*8px;/, 'the mid zone lost its own gaps');
  /* the balance law's own birth stamp — the sweep over-carried the
     digits; the css keeps its 1.9.16 stanza as comment history. */
  assertMatch(css, /1\.9\.16 — THE BAR FINDS ITS BALANCE/, 'the balance law note is missing in the css');
  // the retired seats stay retired (the 1.9.15 word carries forward)
  assert.ok(!css.includes('.gd-imgview-hud-right'), 'the right-zone rule resurrected');
  assert.ok(!css.includes('.gd-imgview-hint'), 'the hint rule resurrected');
});

ok('B7 — the flank keeps its own seat, parked at the bar\'s right end (the 1.9.17 retrue)', () => {
  assertMatch(css, /\.gd-imgview-hud-flank \{/, 'the flank rule never took its seat');
  const flank = css.match(/^\.gd-imgview-hud-flank \{[^}]*\}/m)?.[0] || '';
  /* 1.9.17 — THE MIDDLE BELONGS TO THE SWITCHER re-seated this pin: the
     1.9.16 lean (flex-start, toward the switcher) was the mixing the
     report retired — the flank parks at the bar's RIGHT end now. */
  assertMatch(flank, /justify-content:\s*flex-end/, 'the flank drifted off the bar\'s right end');
  assert.ok(!flank.includes('justify-content: flex-start'), 'the 1.9.16 lean still drives the flank (the mixing disease)');
  assertMatch(flank, /gap:\s*8px;/, 'the flank lost its own gaps');
  assertMatch(flank, /flex-wrap:\s*wrap;/, 'the flank lost its wrap word');
});

ok('B8 — the family\'s own seats carried (the count + the zoomval rules still paint)', () => {
  const count = css.match(/^\.gd-imgview-count \{[^}]*\}/m)?.[0] || '';
  assertMatch(count, /min-width:\s*64px;/, 'the count lost its own width');
  const zoomval = css.match(/^\.gd-imgview-zoomval \{[^}]*\}/m)?.[0] || '';
  assertMatch(zoomval, /font-variant-numeric:\s*tabular-nums;/, 'the zoom percentage lost its tabular digits');
});

console.log('C. THE FURNITURE');

ok('C1 — the version is 1.9.16 everywhere (pkg + constants)', () => {
  assertMatch(pkg, /"version": "1\.9\.19",/, 'the package seat drifted');
  const consts = src('src/constants/index.js');
  assertMatch(consts, /version: '1\.9\.19',/, 'the constants seat drifted');
});

ok('C2 — the changelog head tells this story', () => {
  assert.ok(changelog.startsWith('## 1.9.19 — The Ends Trade Places'), 'the changelog head is not the 1.9.16 entry');
  assertMatch(changelog, /The wall follows the open card — and nothing else/, 'the wall bullet is missing');
  assertMatch(changelog, /The viewer's bar finds its balance/, 'the balance bullet is missing');
  // the 1.9.15 law carries forward right beneath this entry
  assertMatch(changelog, /## 1\.9\.15 — The Wide Card Wraps the Row/, 'the 1.9.15 line lost its seat');
});

ok('C3 — the README badge + battery count welcome this very suite', () => {
  assertMatch(readme, /version-1\.9\.19-purple/, 'the README badge drifted');
  assertMatch(readme, /\*\*v1\.9\.19\*\*/, 'the README version line drifted');
  assertMatch(readme, /93 DOM\/source test suites/, 'the README battery count drifted');
});

ok('C4 — the battery runner runs this suite', () => {
  assertMatch(runner, /gendex_1916_batch_dom/, 'the runner never welcomed 1916');
});

ok('C5 — the worklog keeps the 1.9.16 seat', () => {
  assertMatch(worklog, /1\.9\.19/, 'the worklog never speaks 1.9.16');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
if (passed !== 17) {
  console.log(`SUITE INCOMPLETE — ${passed}/17 checks present`);
  process.exit(1);
}
console.log('ALL GREEN');
