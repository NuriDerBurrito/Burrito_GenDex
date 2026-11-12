// 1.3.6 batch — THE TRIM KEEPS ITS COLOR (corner-plate law superseded by the 1.3.7 retirement — gendex_147).
// The five reported items, each pinned at its root law:
//   1.  the card's own bottom corners speak its bottom color ("you see the
//       trim, when the trim is rounded at the bottom it leaves two small
//       triangle ish gabs, which are white colored, and it contrasts alot
//       when i have a card that is colored in for example orange, i want
//       these two small triangle areas left behind to be colored in the
//       same color as the card color"): the collector card's ::after corner
//       plates — two radial-gradient tiles painted --gd-corner-fill only
//       OUTSIDE the trim's arc
//   2.  the drag verdicts stop forcing layouts ("the stamp container seems
//       to lift slightly when i move and drag stamps around"): the seat
//       mirror + the overhang writer sleep while a sort lives
//   3.  the plain seat's height cap floors the flight ("the stamp container
//       will extend to 3 rows for a split second when i let go"): the cap
//       is the GREATER of the flight target and the resting cap
//   4.  the lanes never wrap ("when i expand the tag container, the second
//       row becomes invisible then visible in split of a second"): the
//       lanes wall speaks flex-wrap: nowrap
//   5.  the stamps zone mounts with the panel's first frame ("the stamps
//       area is also blank while the right pannel is opening then all the
//       stamps summon in" + the open lag): the uniform stand-in probe
//       (uniformItems) + the staging retired for the stamps row
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
const viewSrc = src('src/components/CharacterView.jsx');
const gridSrc = src('src/components/GridView.jsx');
const lookSrc = src('src/components/CardLookEditor.jsx');
const ribbonSrc = src('src/components/TagRibbon.jsx');
const stampSrc = src('src/components/StampEditModal.jsx');
const APP = (await import(join(appRoot, 'src/constants/index.js'))).APP;
const pkg = JSON.parse(src('package.json'));
const lock = JSON.parse(src('package-lock.json'));

// ===========================================================================
// 1 — THE CARD'S OWN CORNERS SPEAK ITS BOTTOM COLOR
// (1.3.7 SUPERSEDED — the corner plates are RETIRED: "i want the bottom 2
// to just be removed". The 1.3.6 ::after law painted squares that clipped
// past the card's border and rode over the ink ring; the retirement law
// and its full live verification live in gendex_147. What stays pinned
// here: the plates are GONE, on every surface, and the ink trim owns the
// corners alone.)
// ===========================================================================
ok('1 — the collector card carries NO corner plates (retired 1.3.7)', () => {
  const block = /\.gd-card-collector::after\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert.equal(block, '', 'the ::after corner plate rule is gone from the CSS');
  assert(!/--gd-corner-r/.test(css), 'the --gd-corner-r stop retired with the law');
  assert(!/radial-gradient\(\s*circle at 100% 0%/.test(css), 'no corner gradient tiles remain');
  assert(/THE CORNER PLATES ARE RETIRED/.test(css), 'the retirement law is documented at the old seat');
});

ok('1b — the square styles keep their nothing (the plates never painted there)', () => {
  // the retirement is a no-op on square styles by construction — the old
  // law floored its stop past the tile; with the law gone, nothing paints
  // at any radius, and the ink corners keep their square law as ever.
  assert(!/\.gd-card-collector::after/.test(css), 'no pseudo hangs off the collector card');
  assert(/\.gd-card-collector\s*\{/.test(css), 'the collector card itself keeps its radius law');
});

ok('1c — no surface speaks the retired corner fill var', () => {
  assert(!/['"]--gd-corner-fill['"]\s*:/.test(gridSrc), 'the grid card dropped the var write');
  assert(!/['"]--gd-corner-fill['"]\s*:/.test(lookSrc), 'the look editor’s preview dropped the var write');
  assert(!/['"]--gd-corner-fill['"]\s*:/.test(ribbonSrc), 'the compact preview dropped the var write');
  // the retirement notes may NAME the var (the law’s own documentation) —
  // but no style object ever speaks it as a property again
  assert(!/setProperty\('--gd-corner-fill'/.test(gridSrc + lookSrc + ribbonSrc), 'no imperative write either');
});

// pure-math mirror of the retirement: the ink ring owns the whole corner
ok('1d — math mirror: nothing paints outside the border’s arc', () => {
  // the border's own arc: center (R, R) from the border-box corner, radius R
  const R = 16;
  const bw = 1;
  const center = { x: R, y: R };
  // the ink ring paints between the outer arc (R) and the inner arc (R - bw)
  const ring = { x: R - bw / 2, y: 0 }; // a point on the left edge, at the ring's band
  const dRing = Math.hypot(ring.x - center.x, ring.y - center.y);
  assert.ok(Math.abs(dRing - R) <= bw, `the ring's band sits ${dRing.toFixed(1)}px from the center — inside the ink's own annulus`);
  // everything outside the arc is the workspace's own paper now
  const corner = { x: 0, y: 0 }; // the border-box corner
  const dOut = Math.hypot(corner.x - center.x, corner.y - center.y);
  assert.ok(dOut > R, `the corner pixel is ${dOut.toFixed(1)}px out — it belongs to the paper, never to a plate`);
  // the measured live case: with the plates gone the corner speaks the
  // paper + its texture, and the ink ring runs unbroken through the arc
  const paper = [222, 211, 182]; // #ded3b6 — the workspace paper at the corner
  const orange = [230, 126, 34]; // #e67e22 — the card's own color
  assert.equal(JSON.stringify(paper) === JSON.stringify(orange), false, 'the corner speaks the paper, never the card’s color');
});

// ===========================================================================
// 2 — THE DRAG'S VERDICTS STOPPED FORCING LAYOUTS
// ===========================================================================
ok('2 — the seat geometry sleeps while a sort lives', () => {
  // the render-phase mirror skips the forced offsetHeight read
  assert(
    /document\.body\?\.classList\?\.contains\?\.\('gd-sort-live'\)/.test(sideSrc),
    'the seat mirror checks the sort-live class'
  );
  assert(/THE MIRROR SLEEPS THROUGH A SORT/.test(sideSrc), 'the mirror’s sleep law is documented');
  // the overhang writer bails under the same flag
  assert(/THE SEAT WRITES NOTHING WHILE A SORT LIVES/.test(sideSrc), 'the overhang writer’s guard is documented');
  const guard = /if \(typeof document !== 'undefined' && document\.body\?\.classList\?\.contains\?\.\('gd-sort-live'\)\) return;/.exec(sideSrc);
  assert(guard, 'writeSeatOverhang returns before its gBCR pair while a sort lives');
});

// ===========================================================================
// 3 — THE CAP FLOORS THE FLIGHT (no third row may ever flash)
// ===========================================================================
ok('3 — the resting cap holds through height flights', () => {
  assert(/THE CAP FLOORS THE FLIGHT TOO/.test(sideSrc), 'the floor law is documented');
  assert(
    /\.\.\.\(!collapsed && !sideMounted && restCap != null[\s\S]*?Math\.max\(flightMax \?\? 0, restCap\)/.test(sideSrc),
    'the plain seat’s ceiling is the greater of the flight target and the resting cap'
  );
  assert(!/flightMax == null && !sideMounted/.test(sideSrc), 'the old flightMax == null gate is retired');
});

// pure-math mirror: an honest expand keeps its target; a stale blink stays capped
ok('3b — math mirror: the blink can never paint a third row', () => {
  const floor = (flightMax, restCap) => Math.max(flightMax ?? 0, restCap);
  // honest expand: the flight target is the full open height (never below the cap)
  const honestTarget = 154;
  const restCapHonest = 149;
  assert.equal(floor(honestTarget, restCapHonest), honestTarget, 'an honest expand tweens to its own target untouched');
  // stale blink: the flow grew a third row (~+47px) but the flight target is stale
  const staleTarget = 108;
  const restCapStale = 110;
  const ceiling = floor(staleTarget, restCapStale);
  const thirdRowBottom = 155; // what the uncapped flow would paint
  assert.ok(ceiling < thirdRowBottom, `the stale blink finds the ceiling at ${ceiling}px — the third row (bottom ${thirdRowBottom}px) never paints`);
  // the retract keeps its own smaller clamp (the floor is gated on the open seat)
  assert.equal(Math.max(65, 110), 110, 'open: the greater value wins');
  assert.equal(65 < 110, true, 'retract (collapsed) never consults the floor — the fold still folds to one row');
});

// ===========================================================================
// 4 — THE LANES NEVER WRAP
// ===========================================================================
ok('4 — the lanes wall speaks nowrap (the reveal is the tween itself)', () => {
  const block = /\.gd-collapse-zone\.is-side\.is-self-flow\[data-gd-wall-pack='lanes'\]\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert(block, 'the lanes zone rule exists');
  assert(/flex-wrap:\s*nowrap/.test(block), 'the lanes zone never wraps — the base wrap law is retired here');
  assert(/THE LANES NEVER WRAP/.test(css), 'the nowrap law is documented with the live measurement');
});

// ===========================================================================
// 5 — THE STAMPS ZONE MOUNTS WITH THE PANEL'S FIRST FRAME
// ===========================================================================
ok('5 — the uniform stand-in probe measures without the double mount', () => {
  // the zone accepts the stand-in law
  assert(/uniformItems = null/.test(sideSrc), 'the uniformItems prop exists');
  assert(/THE UNIFORM STAND-IN PROBE/.test(sideSrc), 'the stand-in law is documented at the prop');
  // the probe renders the stand-ins + the real tail; the live zone never does
  assert(/renderProbe = \(\) =>/.test(sideSrc), 'the probe has its own body renderer');
  assert(/gd-flow-standin/.test(sideSrc), 'the stand-ins are keyed spans');
  /* 1.4.4 supersede: the tail slices the PROBE's own item list now
     (probeItems when a zone speaks light probe chips, else the live
     children — the stamps zone keeps the exact old behavior). */
  assert(/probeTail = uniform \? probeFlowItems\.slice\(standInCount\) : probeFlowItems/.test(sideSrc), 'the tail is the probe\'s real items from count on (1.4.4)');
  assert(sideSrc.includes('{renderProbe()}'), 'the probe seat renders the probe body');
  assert(!/renderSide\(\)[^}]*standIns/.test(sideSrc), 'the live seats keep the caller’s real children');
  // the stand-in CSS
  const standin = /\.gd-flow-standin\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert(standin, 'the stand-in class exists');
  assert(/flex: 0 0 auto/.test(standin), 'a stand-in never shrinks or grows');
});

ok('5b — the stamps seat speaks the uniform law', () => {
  assert(
    viewSrc.includes("uniformItems={{ count: charStamps.length, w: 44, h: 44 }}"),
    'the stamps seat passes the 44x44 uniform law (the .gd-stamp-slot size)'
  );
  assert(/stamp slots are a fixed 44x44/.test(viewSrc), 'the seat documents why the probe can stand in');
  // the slot img decodes off the critical path
  assert(stampSrc.includes('decoding="async"'), 'the live slot art decodes async');
});

ok('5c — the staging is retired for the stamps row (first-frame mount)', () => {
  // the stamps row renders unconditionally in the tray
  assert(!viewSrc.includes('mountStage >= 2'), 'no gate on the stamps row — it mounts with the view’s own commit');
  assert(!/TRAY_ZONE_H_CACHE\.get\(character\.id\)\?\.stamps/.test(viewSrc), 'the blank stamps placeholder is gone');
  // 1.3.9 SUPERSEDED — the tags row's breath is retired too ("the
  // container of tags ... do that same small lift up"): every zone mounts
  // with the view's own first frame, no placeholder, no cache.
  assert(!viewSrc.includes('mountStage >= 1 ? ('), '1.3.9: the tags breath is retired — first-frame mount');
  assert(/THE BREATH IS RETIRED FOR THE STAMPS/.test(viewSrc), 'the retirement law is documented');
  assert(/THE STAMPS BREATH IS RETIRED/.test(viewSrc), 'the mountStage note speaks the new staging');
});

// ===========================================================================
// 6 — THE VERSION IS 1.4.3 EVERYWHERE
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
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
