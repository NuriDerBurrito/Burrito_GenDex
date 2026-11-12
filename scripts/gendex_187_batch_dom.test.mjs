// 1.8.6 batch — The Patient Wheel.
// (Named 187 in the sequence: 186 pins the 1.8.5 laws; this suite pins
//  the 1.8.6 laws at their roots.)
// The reported items, each pinned at its root law:
//   A.  THE SILENT ASCENT ("currently when i scroll up it opens the
//       tags/stamps , fix that so the scroll upwards wont affect so (the
//       tags/stamps collapse when scrolling down , thats correct and i
//       love how it is now , but when scrolling up , i dont want to have
//       it expand , instead expanding should just be manual by the user
//       like usual)") — the scroll speaks DOWN only: the whole seat
//       economy (the spacer, the debt, the payer, the restores, the dead
//       zone, the dismissal) retires with the loans it served, every fold
//       rides the flow road, an up-tick answers NOTHING, and expanding is
//       the hand's work alone.
//   B.  THE OUTLINE ANSWERS THE HAND ("prompt/note container have an
//       outline , that outline dissapears when i hover over them
//       (unselected ones , not selected ones) fix that so its visible and
//       maybe reacts to it too") — the hover gathers toward the face's
//       own ink rung, stepping AWAY from the face on every shade, the
//       plain row's accent hue riding a deeper ink floor.
//   C.  THE WHEEL THAT OUTLIVES THE FREEZE ("when pressing on buttons
//       that load things (such as expand prompt/note , opening settings,
//       new card button etc.. , or the image previews loading etc..) , i
//       want you to darken it slightly as if pressed and add a loading
//       wheel , in some situations like on preview image it would just be
//       visible with the darken , or in settings button it would replace
//       the icon until the window pops up , or in new card in the card
//       viewer the card will have the loading wheel animation as it
//       loads , ensure the wheel works even when app is frozen since it
//       does freeze when these actions occur , and ensure it has an out
//       animation for the image preview one instead of the rest where it
//       would be an appear and dissapear etc..") — one compositor-driven
//       wheel + the pressed darken on every loading road, THE DOOR
//       (deferToPaint) putting each wheel on screen before the freeze
//       begins, the image previews alone carrying the out flight.
// Plus the version furniture (1.8.6 everywhere).

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
    console.log(`  FAIL — ${name}\n      ${e.message.split('\n')[0]}`);
  }
};
const assertMatch = (hay, re, msg) => {
  if (!re.test(hay)) throw new Error(msg || `pattern never spoke: ${re}`);
};

const cv = src('src/components/CharacterView.jsx');
const pe = src('src/components/PartEditor.jsx');
const app = src('src/App.jsx');
const tb = src('src/components/Titlebar.jsx');
const ncm = src('src/components/NewCharacterModal.jsx');
const stage = src('src/components/ImageStage.jsx');
const viewer = src('src/components/ImageViewer.jsx');
const helpers = src('src/utils/helpers.js');
const css = src('src/index.css');
const pkg = src('package.json');
const constants = src('src/constants/index.js');
const readme = src('README.md');
const changelog = src('CHANGELOG.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.

console.log('\nA. THE SILENT ASCENT ("when scrolling up, i dont want to have it expand")');

ok('A1 — the law note speaks its name (with the report own words)', () => {
  assertMatch(cv, /1\.8\.6 — THE SILENT ASCENT \("currently when i scroll up it opens the/, 'the ascent note never spoke');
  assertMatch(cv, /instead expanding should just be manual by the user like/, 'the hand-only word never spoke');
});
ok('A2 — an up-tick answers NOTHING (no restore road survives)', () => {
  assertMatch(cv, /if \(!down\) return; \/\/ THE SILENCE — the ascent is not the scroll's to answer/, 'the silence never spoke');
  assert.ok(!cv.includes('if (debt > 0 && scroller.scrollTop < debt)'), 'the hem-unfold gate survived the silence');
  assert.ok(!cv.includes('flowOriginRef.current + 8'), 'the flow-restore gate survived the silence');
  assert.ok(!cv.includes('scroller.scrollTop < foldDeadRef.current'), 'the dead-zone gate survived the silence');
});
ok('A3 — the seat economy retires whole (no debt-bearer survives)', () => {
  assert.ok(!cv.includes('const rowsSeatRef'), 'the seat ref survived');
  assert.ok(!cv.includes('const seatDebtRef'), 'the debt ref survived');
  assert.ok(!cv.includes('const launchSeatPayer'), 'the payer survived');
  assert.ok(!cv.includes('const dismissSeatDebt'), 'the dismissal survived');
  assert.ok(!cv.includes('ref={rowsSeatRef}'), 'the seat element survived');
});
ok('A4 — every fold rides the ONE road (the page shortens with the flight)', () => {
  assertMatch(cv, /THE ROAD CHOICE, AND IN 1\.8\.6 THERE IS ONLY ONE ROAD/, 'the one-road note never spoke');
  assertMatch(cv, /THE FLOW ROAD — the ONLY road: the page shortens WITH the/, 'the flow road never told its give');
  assertMatch(cv, /The 1\.8\.4 SEAT ROAD retired with/, 'the seat road never told its retirement');
  assertMatch(cv, /\/\/ THE FOLD — one road: the state flips, framer \+ the CSS's own\s*\n\s*\/\/ tweens carry the flight, and the page shortens with it/, 'the one-road commit never spoke');
});
ok('A5 — the between-band keeps its 1.8.4 ground (the gate the owner loves)', () => {
  assertMatch(cv, /const fromTop = \(journeyStartRef\.current == null \? prev : journeyStartRef\.current\) <= 32;/, 'the from-top gate never spoke');
  assertMatch(cv, /if \(!fromTop && scroller\.scrollTop < dEst\) return; \/\/ the between-band/, 'the between-band never stood down');
  assertMatch(cv, /const dEst = Math\.max\(0, zone\.offsetHeight - \(foldRestHRef\.current \|\| 26\)\);/, 'the give estimate never spoke');
});
ok('A6 — the hand opens the tray itself (every manual road speaks one word)', () => {
  assertMatch(cv, /1\.8\.6 — THE HAND OPENS THE TRAY ITSELF/, "the hand's-road note never spoke");
  const hand = cv.slice(cv.indexOf('const openTrayByHand = useCallback('));
  const handBody = hand.slice(0, hand.indexOf('}, []);'));
  assertMatch(handBody, /if \(nameOpenAtFoldRef\.current\) \{/, "the hand's road never asked for the name back");
  assertMatch(handBody, /setNameExpanded\(true\);/, "the name's state never returned");
  assertMatch(handBody, /setAutoCollapsed\(false\);/, "the hand's road never opened the tray");
  const exp = cv.slice(cv.indexOf('const expandRows = useCallback('));
  assertMatch(exp.slice(0, 400), /openTrayByHand\(\);/, "the chip's road never joined the hand");
  const tog = cv.slice(cv.indexOf('const toggleRowGuarded = useCallback('));
  assertMatch(tog.slice(0, 500), /openTrayByHand\(\);/, "a label toggle's road never joined the hand");
  const wake = cv.slice(cv.indexOf('if (wasDormantRef.current && !dormant) {'));
  assertMatch(wake.slice(0, 900), /openTrayByHand\(\);/, "the panel's wake never joined the hand");
  const pinSegs = cv.split('setRowsPinned((p) => !p);').slice(1);
  const pinReturns = pinSegs.filter((seg) => {
    const near = seg.slice(0, 620);
    return near.includes('if (!rowsPinned) {') && near.includes('openTrayByHand();');
  }).length;
  assert.ok(pinSegs.length === 2 && pinReturns === 2, `the pin roads never joined the hand (found ${pinReturns} of ${pinSegs.length})`);
});
ok('A7 — the folded rest keeps its honest seat (the settle clock)', () => {
  assertMatch(cv, /1\.8\.6 — THE FOLDED REST, MEASURED WHERE THE PAYER LEFT IT/, 'the settle-measure note never spoke');
  assertMatch(cv, /const t = setTimeout\(\(\) => \{[\s\S]*?if \(zone && zone\.offsetHeight > 0\) foldRestHRef\.current = zone\.offsetHeight;[\s\S]*?\}, 420\);/, 'the settle clock never armed');
});
ok('A8 — the column reads the header alone (the sum retired with the seat)', () => {
  assertMatch(cv, /setHeadH\(Math\.round\(el\.offsetHeight\)\)/, 'the column never read the header alone');
});
ok('A9 — the tombstones keep their seats (the JSX + the CSS laws)', () => {
  assertMatch(cv, /THE SEAT LEFT WITH THE RESTORES IT SERVED/, "the seat's retirement never spoke");
  assertMatch(css, /THE SEAT LEFT WITH THE RESTORES IT SERVED/, "the CSS seat's retirement never spoke");
  const seatLaw = /\.gd-rows-seat \{[^}]*\}/.exec(css)?.[0] || '';
  assert.ok(seatLaw.length > 0, 'the seat law never spoke in css');
  assertMatch(seatLaw, /height: 0;/, 'the seat never rests at zero');
});

console.log("\nB. THE OUTLINE ANSWERS THE HAND (\"that outline dissapears when i hover over them (unselected ones)\")");

ok('B1 — the law note speaks its name (with the report own words)', () => {
  assertMatch(css, /1\.8\.6 — THE OUTLINE ANSWERS THE HAND \("prompt\/note container have an/, 'the outline note never spoke');
});
ok("B2 — the colored hover gathers toward the face's own INK rung", () => {
  const hover = /\.gd-part-row\.is-colored:hover \{[^}]*\}/.exec(css)?.[0] || '';
  assert.ok(hover.length > 0, 'the colored hover law never spoke');
  assertMatch(hover, /border-color: color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 50%, var\(--part-ink, var\(--gd-ink\)\)\);/, 'the colored hover never gathered toward the ink rung');
  assertMatch(hover, /box-shadow: 2\.5px 2\.5px 0 color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 55%, #0e0e0e\);/, 'the colored hover never firmed its shadow');
  assert.ok(!/border-color: var\(--part-color, var\(--gd-accent\)\);/.test(hover), 'the raw-color hover survived (the outline vanishing on the face)');
});
ok('B3 — the deep twin brightens away from the face (the report own worst case)', () => {
  const deep = /\.gd-part-row\.is-colored\.is-shade-deep:hover \{[^}]*\}/.exec(css)?.[0] || '';
  assert.ok(deep.length > 0, 'the deep hover law never spoke');
  assertMatch(deep, /border-color: color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 50%, var\(--part-ink, var\(--gd-ink\)\)\);/, 'the deep hover never gathered toward the ink rung');
  assertMatch(deep, /box-shadow: 2\.5px 2\.5px 0 color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 62%, #0e0e0e\);/, 'the deep hover never firmed its shadow');
});
ok('B4 — the plain row keeps its accent hue over a deeper ink floor', () => {
  const hover = /\.gd-part-row:hover \{[^}]*\}/.exec(css)?.[0] || '';
  assert.ok(hover.length > 0, 'the plain hover law never spoke');
  assertMatch(hover, /border-color: color-mix\(in srgb, var\(--gd-accent\) 50%, var\(--gd-ink\)\);/, 'the plain hover never deepened its ink floor');
});
ok('B5 — the selected family keeps its 1.8.5 crown (the doubled :has seats)', () => {
  assertMatch(css, /\.gd-part-row\.gd-part-row:has\(\.gd-prompt-box:focus\),\s*\n\.gd-part-row\.gd-part-row:has\(\.gd-rt-edit:focus\) \{/, 'the doubled plain family never spoke');
  assertMatch(css, /\.gd-part-row\.gd-part-row\.is-colored:has\(\.gd-prompt-box:focus\),\s*\n\.gd-part-row\.gd-part-row\.is-colored:has\(\.gd-rt-edit:focus\) \{/, 'the doubled colored family never spoke');
});

console.log('\nC. THE WHEEL THAT OUTLIVES THE FREEZE ("ensure the wheel works even when app is frozen")');

ok('C1 — the wheel runs on the compositor (transform + will-change)', () => {
  const wheel = /\.gd-wheel \{[^}]*\}/.exec(css)?.[0] || '';
  assert.ok(wheel.length > 0, 'the wheel law never spoke');
  assertMatch(wheel, /animation: gd-wheel-turn 0\.7s linear infinite;/, 'the wheel never turned');
  assertMatch(wheel, /will-change: transform;/, 'the wheel never took its compositor seat');
  assertMatch(css, /@keyframes gd-wheel-turn \{\s*\n\s*to \{\s*\n\s*transform: rotate\(360deg\);\s*\n\s*\}\s*\n\s*\}/, 'the turn never spoke a transform-only keyframe');
});
ok('C2 — the darken holds the pressed look and stands the pointer down', () => {
  const dark = /\.gd-icon-btn\.is-loading,\s*\n\.gd-btn\.is-loading \{[^}]*\}/.exec(css)?.[0] || '';
  assert.ok(dark.length > 0, 'the darken law never spoke');
  assertMatch(dark, /transform: translateY\(0\.5px\) scale\(0\.94\);/, 'the darken never held the pressed travel');
  assertMatch(dark, /filter: brightness\(0\.82\);/, 'the darken never spoke its brightness');
  assertMatch(dark, /pointer-events: none;/, 'the darken never stood the pointer down');
});
ok('C3 — THE DOOR (deferToPaint) waits for the paint before the freeze', () => {
  assertMatch(helpers, /1\.8\.6 — THE WHEEL'S OWN DOOR/, "the door's note never spoke");
  assertMatch(helpers, /export function deferToPaint\(commit\) \{/, 'the door never declared its seat');
  const fn = helpers.slice(helpers.indexOf('export function deferToPaint'), helpers.indexOf('export function parseRichRanges'));
  assertMatch(fn, /const raf = typeof requestAnimationFrame === 'function' \? requestAnimationFrame : \(fn\) => setTimeout\(fn, 0\);/, 'the rAF guard never spoke');
  assertMatch(fn, /raf\(\(\) => \{\s*\n\s*raf\(\(\) => \{\s*\n\s*setTimeout\(commit, 0\);/, 'the door never waited its two frames');
});
ok('C4 — the expand key swaps its glyph for the wheel (the parts + the notes)', () => {
  assertMatch(pe, /const \[pendingExpand, setPendingExpand\] = useState\(null\);/, 'the parts pending seat never spoke');
  assertMatch(pe, /deferToPaint\(\(\) => \{\s*\n\s*setExpandedId\(partId\);\s*\n\s*setPendingExpand\(null\);/, 'the parts road never walked the door');
  assertMatch(pe, /expandPending \? <span className="gd-wheel" aria-hidden \/> : <Maximize2 size=\{12\} \/>/, 'the parts glyph never swapped');
  assertMatch(pe, /expandPending && 'is-loading'/, 'the parts key never darkened');
  assertMatch(cv, /const \[notesPending, setNotesPending\] = useState\(false\);/, 'the notes pending seat never spoke');
  assertMatch(cv, /deferToPaint\(\(\) => \{\s*\n\s*setNotesReaderOpen\(true\);\s*\n\s*setNotesPending\(false\);/, 'the notes road never walked the door');
  assertMatch(cv, /notesPending \? <span className="gd-wheel" aria-hidden \/> : <Maximize2 size=\{12\} \/>/, 'the notes glyph never swapped');
});
ok('C5 — the settings gear replaces its icon until the window pops up', () => {
  assertMatch(app, /const \[settingsLoading, setSettingsLoading\] = useState\(false\);/, 'the settings pending seat never spoke');
  assertMatch(app, /const openSettingsWindow = useCallback\(\(\) => \{[\s\S]*?deferToPaint\(\(\) => \{[\s\S]*?setModal\(\{ type: 'settings'[\s\S]*?setSettingsLoading\(false\);/, 'the settings road never walked the door');
  assertMatch(tb, /settingsLoading \? <span className="gd-wheel" aria-hidden \/> : <Settings size=\{14\} \/>/, 'the gear glyph never swapped');
  assertMatch(tb, /settingsLoading && 'is-loading'/, 'the gear never darkened');
  assertMatch(app, /onOpenSettings=\{openSettingsWindow\}/, 'the Titlebar road never spoke the deferred word');
});
ok('C6 — the CREATE road darkens its key and gives the wheel to the card viewer', () => {
  assertMatch(ncm, /const \[creating, setCreating\] = useState\(false\);/, 'the creating seat never spoke');
  assertMatch(ncm, /if \(creating\) return;/, 'the double-press guard never spoke');
  assertMatch(ncm, /creating && 'is-loading'/, 'the CREATE key never darkened');
  assertMatch(app, /const \[newCardPending, setNewCardPending\] = useState\(false\);/, 'the card-viewer veil seat never spoke');
  assertMatch(app, /setModal\(null\);\s*\n\s*setNewCardPending\(true\);\s*\n\s*deferToPaint\(\(\) => \{/, 'the creation road never walked the door');
  assertMatch(app, /deferToPaint\(\(\) => setNewCardPending\(false\)\);/, 'the veil never cleared a painted breath after the landing');
});
ok('C7 — the card viewer carries the veil (both mounts)', () => {
  const veils = (app.match(/gd-load-veil/g) || []).length;
  assert.ok(veils >= 2, `the veil spoke ${veils} times — the panel and the cover are the whole word`);
  assertMatch(app, /<div className="gd-panel-content-in relative h-full">/, 'the panel seat never took its relative');
  assertMatch(app, /<div className="flex-1 min-h-0 relative">/, 'the cover seat never took its relative');
  assertMatch(app, /style=\{\{ \['--gd-wheel-s'\]: '20px' \}\}/, 'the viewer wheel never spoke its size');
});
ok('C8 — the image previews alone carry the OUT flight', () => {
  assertMatch(stage, /gd-load-veil has-out/, "the stage veil never spoke its out flight");
  assertMatch(stage, /loaded && 'is-done'/, 'the stage veil never landed its done state');
  assertMatch(viewer, /const \[fullLoaded, setFullLoaded\] = useState\(false\);/, 'the viewer pending seat never spoke');
  // 1.9.1 — THE REVEAL WAITS FOR THE PAINT: both roads hand the element to
  // revealImgWhenPainted (decode + two frames + the rails) — the load's own
  // word no longer retires the wheel before the raster paints.
  assertMatch(viewer, /onLoad=\{\(ev\) => revealImgWhenPainted\(ev\.currentTarget, \(\) => setFullLoaded\(true\)\)\}/, 'the viewer never spoke its onLoad');
  assertMatch(viewer, /im && im\.complete && im\.naturalWidth\) revealImgWhenPainted\(im, \(\) => setFullLoaded\(true\)\);/, "the viewer's completion sweep never spoke");
  assertMatch(viewer, /clsx\('gd-load-veil has-out', fullLoaded && 'is-done'\)/, 'the viewer veil never landed its done state');
  const outFlight = /\.gd-load-veil\.has-out\.is-done \{[^}]*\}/.exec(css)?.[0] || '';
  assert.ok(outFlight.length > 0, 'the out-flight law never spoke');
  assertMatch(outFlight, /opacity: 0;/, 'the out flight never faded');
  assertMatch(outFlight, /transition: opacity 0\.24s ease;/, 'the out flight never spoke its clock');
  // the out flight is declared on the LEAVING state alone — the arrival stays an appear
  const veilBase = /\.gd-load-veil \{[^}]*\}/.exec(css)?.[0] || '';
  assert.ok(!/transition/.test(veilBase), 'the base veil carries a transition — the arrival would fade too');
});

console.log('\nD. THE VERSION FURNITURE');
ok('D1 — the version is 1.8.6 everywhere', () => {
  assert.equal(JSON.parse(pkg).version, '1.9.19', 'package.json');
  assertMatch(constants, /version: '1\.9\.19',/, 'constants');
  assertMatch(readme, /\*\*v1\.9\.19\*\*/, 'README');
  // 1.8.9 — THE README IS THE PUBLIC FACE: the version roll retired with it
  // (the first public release speaks features, not history; the changelog
  // keeps the story). The paragraph's old seat is gone by law.
  assert.ok(!/^1\.\d+\.\d+ — /m.test(readme), 'the version roll retired with the public README');
  assertMatch(readme, /the regression battery \(93 DOM\/source test suites\)/, 'the README battery count never moved');
  assertMatch(changelog, /^## 1\.9\.19 — The Ends Trade Places/, 'the changelog head never arrived');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /<span class="ver">v1\.8\.6<\/span>/, 'the website card never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /THE PATIENT WHEEL<\/span>/, 'the website hero tagline never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /releases\/tag\/v1\.8\.6"/, 'the release URL never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /Burrito_GenDex_1\.8\.6_source\.zip/, 'the source URL never moved');
});
ok('D2 — the previous entry keeps its own seat (each version keeps its release)', () => {
  assertMatch(changelog, /^## 1\.8\.5 — The Cover Breathes/m, 'the 1.8.5 entry lost its seat');
  // 1.8.9 — THE README IS THE PUBLIC FACE: the version roll retired with it
  // (the first public release speaks features, not history; the changelog
  // keeps the story). The paragraph's old seat is gone by law.
  assert.ok(!/^1\.\d+\.\d+ — /m.test(readme), 'the version roll retired with the public README');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /releases\/tag\/v1\.8\.5">release page<\/a>/, 'the 1.8.5 row lost its own release link');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
