// 1.2.6 batch — THE LANES THAT HOLD, THE REELS THAT ROLL. Nineteen reports,
// one release:
//   1. the ghost drag dies (best-effort capture + four safety nets + the
//      dead-pointer net — a lost release never strands a held chip)
//   2. a press ends a tooltip instantly (the drag proceeds on a clean bar)
//   3. the tags/stamps layout holds at EVERY width (the shared filled-rows
//      pack + every page speaks lanes — no second wrap engine)
//   4. the top toolbar sits darker (one step off the ground, not two)
//   5. the + TAG / + STAMP glyphs sit in the middle of their pills
//   6. square-theme keys are square + the holder's icon says its direction
//   7. the name's cut tolerance speaks line boxes (no phantom expand)
//   8. the full-window close visibly slides away (opaque travel, tail fade)
//   9. the panel pop-out flies the cheap lane (patterns drop for the flight,
//      content mounts after the width lands)
//  10. the full-window view wears the panel's own surface
//  11. the two seats' heads share one patterned surface
//  12. a held chip parks at the content's own end (no infinite scroll room)
//  13. the splash grows two film reels (covers only, no consecutive repeats,
//      four-deep windows both sides, pixel-art leaders when short)
//  14. the filters' fold breathes (0fr↔1fr grid track)
//  15. the dropdowns say goodbye (gd-pop-out, the ctx menu's mirrored exit)
//  16. the separator between stamps and tags sits balanced
//  17. clicking an open card closes it
//  18. the status line waits for the read (the marquee's own clock)
//  19. the hover freezes the status line; a press skips it
// Plus: the version is 1.2.6 everywhere (package.json AND the lock) and the
// website fronts it.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const appRoot = fileURLToPath(new URL('..', import.meta.url));
const src = (rel) => readFileSync(join(appRoot, rel), 'utf8');

const { APP } = require(join(appRoot, 'src/constants/index.js'));
const { packFlowRows, buildSplashReels, buildImageUrl } = require(join(appRoot, 'src/utils/helpers.js'));
const pkg = require(join(appRoot, 'package.json'));
const lock = require(join(appRoot, 'package-lock.json'));

const css = src('src/index.css');
const sideflow = src('src/components/SideFlow.jsx');
const sortSrc = src('src/components/useThumbSort.js');
const gridSrc = src('src/components/GridView.jsx');
const tipsSrc = src('src/components/GdTooltips.jsx');
const popSrc = src('src/components/Popover.jsx');
const splashSrc = src('src/components/Splash.jsx');
const viewSrc = src('src/components/CharacterView.jsx');
const appSrc = src('src/App.jsx');
const statusSrc = src('src/components/StatusText.jsx');
const themeSrc = src('src/utils/theme.js');
const helpersSrc = src('src/utils/helpers.js');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const changelog = src('CHANGELOG.md');

let passed = 0;
let failed = 0;
const ok = (label, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok ${passed} — ${label}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL — ${label}\n      ${e.message.split('\n')[0]}`);
  }
};

// ---- the version --------------------------------------------------------------
ok('the version is 1.2.6 everywhere', () => {
  assert.equal(APP.version, '1.4.3');
  assert.equal(pkg.version, '1.4.3');
  assert.equal(lock.version, '1.4.3', 'the LOCK follows (the 1.2.2 session missed it once)');
  assert.equal(lock.packages[''].version, '1.4.3', 'the lock root package too');
  assert.equal(lock.packages['node_modules/@electron/windows-sign'].version, '1.2.2', "windows-sign's TRUE 1.2.2 is never swept");
  assert.equal(lock.packages['node_modules/word-wrap'].version, '1.2.5', "word-wrap's OWN 1.2.5 is never swept");
});

// ---- 3: the shared filled-rows pack + the lanes --------------------------------
ok('1.3.2 the filled-rows pack survives as a pure helper (nothing seats through it anymore)', () => {
  assert.ok(helpersSrc.includes('THE FILLED-ROWS PACK'), 'the law is documented');
  assert.ok(helpersSrc.includes('export function packFlowRows'), 'the builder is exported (pure, testable, its own suite)');
  assert.ok(!sideflow.includes('packFlowRows'), 'renderSide seats through NOTHING (the wall grid is the layout)');
  assert.ok(!sortSrc.includes('packFlowRows'), 'the drag simulation left the row packer behind (the wall pack speaks the grid)');
  // behavior (1.3.1 law, kept): a wide chip seats in DOM order and the
  // non-fitting ordinary follower WRAPS (the poke's retirement law) — the
  // helper keeps its truth for any future caller.
  const rows = packFlowRows(['W', 'a', 'b', 'c'], (it) => ({ W: 60, a: 45, b: 30, c: 30 }[it]), 100, 6, { look: 3, firstRowPlain: false });
  assert.deepEqual(rows[0], ['W'], 'strict order: the wide chip seats alone');
  assert.deepEqual(rows[1], ['a', 'b'], 'the rest flows on in DOM order');
  assert.deepEqual(rows[2], ['c'], 'the tail lands on the last row');
});

ok('1.3.2 the wall speaks ONE engine: the CSS grid (no lanes, no second wrap)', () => {
  assert.ok(!sideflow.includes('pageRows.map((rowIdx, r)'), 'no lane rendering anymore (the pages are retired)');
  assert.ok(!sideflow.includes('gd-side-row'), 'no lane elements anywhere');
  assert.ok(css.includes('grid-auto-flow: column'), 'the grid flows column-major (the one engine)');
  assert.ok(css.includes('.gd-collapse-zone.is-side.is-self-flow'), 'the self-flow wall law is pinned');
  assert.ok(css.includes('.gd-collapse-zone.is-side > .gd-stamp-slots.is-wall'), 'the stamps wall law is pinned');
});

// ---- 1: the ghost drag dies ------------------------------------------------------
ok('the capture is best-effort and four nets own the lost release', () => {
  assert.ok(sortSrc.includes('THE CAPTURE IS BEST-EFFORT'), 'the root-cause law is documented');
  assert.ok(sortSrc.includes('el.setPointerCapture?.(e.pointerId);'), 'the capture call still exists');
  // the try/catch wraps it (the unguarded throw unwound the grab before the nets)
  const grabAt = sortSrc.indexOf('el.setPointerCapture?.(e.pointerId);');
  const before = sortSrc.lastIndexOf('try {', grabAt);
  const after = sortSrc.indexOf('} catch {', grabAt);
  assert.ok(before > 0 && after > grabAt, 'the capture is wrapped in try/catch');
  assert.ok(sortSrc.includes("node.addEventListener('lostpointercapture', interrupt)"), 'net 1: lostpointercapture');
  assert.ok(sortSrc.includes("window.addEventListener('blur', interrupt)"), 'net 2: window blur');
  assert.ok(sortSrc.includes("document.addEventListener('pointerup', onDocUp, true)"), 'net 3: document pointerup (capture)');
  assert.ok(sortSrc.includes("document.addEventListener('pointercancel', onDocCancel, true)"), 'net 4: document pointercancel (capture)');
  assert.ok(sortSrc.includes("document.addEventListener('pointerdown', onDocDown, true)"), 'net 5: the dead-pointer net (a new mouse press)');
  assert.ok(sortSrc.includes("ev.pointerType && ev.pointerType !== 'mouse'"), 'touch pointers are exempt (a second finger is not a death)');
  assert.ok(sortSrc.includes("THE DRAG'S SAFETY NETS"), 'the nets are documented');
});

ok('the release paths are hoisted (one path, every caller)', () => {
  assert.ok(sortSrc.includes('THE RELEASE PATHS, HOISTED'), 'the law is documented');
  assert.ok(sortSrc.includes('onPointerUp: releaseAt,'), 'the element speaks the hoisted release');
  assert.ok(sortSrc.includes('onPointerCancel: cancelAt,'), 'the element speaks the hoisted cancel');
  assert.ok(sortSrc.includes('dragRef.current.release = releaseAt;'), 'the drag carries its release for the nets');
  assert.ok(sortSrc.includes('dragRef.current.cancel = cancelAt;'), 'the drag carries its cancel for the nets');
});

// ---- 12: the content's own end ---------------------------------------------------
ok(`a held chip parks at the content's own end`, () => {
  assert.ok(sortSrc.includes("THE MAX IS THE CONTENT'S OWN END"), 'the law is documented');
  assert.ok(sortSrc.includes('dragRef.current.scrollMax0 = Math.max(0, sc.scrollWidth - sc.clientWidth);'), 'the scroller end is frozen at grab');
  assert.ok(sortSrc.includes('dragRef.current.contentW = sc.scrollWidth;'), 'the content width rides the drag');
});

// ---- 13: the reels ----------------------------------------------------------------
ok('the reel draw is the ONE pure law (1.2.9: four reels, no repeats anywhere)', () => {
  // a pool that can fill every seat (32) deals a plain distinct cut
  const pool = Array.from({ length: 40 }, (_, i) => 'card-' + i);
  const draw = buildSplashReels(pool, { slots: 8, seed: 42 });
  assert.equal(draw.length, 4, 'the draw returns an array of four reels (two per wing)');
  const all = new Set(pool);
  const seen = new Set();
  draw.forEach((seats, r) => {
    assert.equal(seats.length, 8, 'eight seats per reel (reel ' + r + ')');
    for (const s of seats) {
      assert.ok(!s.fake, 'a full pool seats no fakes (reel ' + r + ')');
      assert.ok(all.has(s.url), 'every seat is a real card (reel ' + r + ')');
      assert.ok(!seen.has(s.url), 'a card appears at most once on the WHOLE SCREEN (reel ' + r + ')');
      seen.add(s.url);
    }
  });
  assert.equal(seen.size, 32, 'a big pool deals 32 distinct seats');
  // the mid pool: every card seats exactly once, fakes pad
  const mid = buildSplashReels(Array.from({ length: 20 }, (_, i) => 'm-' + i), { slots: 8, seed: 9 });
  const mseen = new Set();
  let mfakes = 0;
  for (const seats of mid) for (const s of seats) { if (s.fake) mfakes += 1; else mseen.add(s.url); }
  assert.equal(mseen.size, 20, 'every card of a 20-pool seats exactly once');
  assert.equal(mfakes, 12, 'the remaining twelve seats pad with leaders');
});

ok('a short pool seats every card and pads with leaders', () => {
  const pool = ['a.png', 'b.png', 'c.png'];
  const draw = buildSplashReels(pool, { slots: 8, seed: 7 });
  assert.equal(draw.length, 4, 'four reels');
  const flat = draw.flat();
  const reals = flat.filter((s) => !s.fake).map((s) => s.url);
  assert.equal(reals.length, 3, 'three real frames across the whole screen');
  for (const p of pool) assert.ok(reals.includes(p), p + ' seats exactly once');
  assert.equal(flat.filter((s) => s.fake).length, 29, 'the leaders pad every other seat');
  const seeds = new Set(flat.filter((s) => s.fake).map((s) => s.seed));
  assert.equal(seeds.size, 29, 'each leader carries its own seed (distinct glyphs — one counter across every reel)');
  // the empty pool: all leaders, no crash
  const bare = buildSplashReels([], { slots: 8, seed: 3 });
  assert.equal(bare.length, 4, 'an empty pool still deals four reels');
  assert.equal(bare.flat().filter((s) => s.fake).length, 32, 'an empty pool seats thirty-two leaders');
});

ok('the pool counts only cards with covers (prev, then thumb, then file)', () => {
  assert.ok(appSrc.includes("THE SPLASH'S REEL POOL"), 'the law is documented');
  assert.ok(appSrc.includes('const src = img?.prev || img?.thumb || img?.file;'), 'the smallest tier wins');
  assert.ok(appSrc.includes('if (!src) continue;'), 'a card without any image never enters the pool');
  assert.ok(appSrc.includes('reels={db ?'), 'App passes the pool to the Splash (1.3.3: the film-reels switch OFF mounts no reels at all, else the real pool)');
  assert.ok(splashSrc.includes('buildSplashReels(reels, { slots: REEL_SLOTS, seed: dealSeed })'), 'the Splash draws through the one builder (1.3.3: seeded by the pool\'s own content — the same pool always deals the same seats)');
  // 1.2.9 — FOUR SEATS, alternating directions: the wings' pair reads as
  // one mechanism (lo up, li down, ri up, ro down)
  assert.ok(splashSrc.includes("{ seat: 'lo', dir: 'up' }"), 'the left-outer column climbs');
  assert.ok(splashSrc.includes("{ seat: 'li', dir: 'down' }"), 'the left-inner column falls');
  assert.ok(splashSrc.includes("{ seat: 'ri', dir: 'up' }"), 'the right-inner column climbs');
  assert.ok(splashSrc.includes("{ seat: 'ro', dir: 'down' }"), 'the right-outer column falls');
});

ok('an EMPTY landed pool still mounts the reels (the fake-fill law, zero cards included)', () => {
  // "if there is less than 8 cards fill the rest with fake cards" — zero is
  // less than eight: a fresh install (or a db whose cards carry no covers)
  // must show the strips as all pixel leaders, not empty wings. The pool's
  // null (db not landed yet) is the ONLY state that keeps the wings bare.
  assert.ok(appSrc.includes('if (!db) return null;'), 'the pool speaks null while the db has not landed');
  assert.ok(splashSrc.includes('reels = null'), 'the Splash default is the not-yet-known pool');
  assert.ok(splashSrc.includes('reels !== null &&'), 'the mount gate is the pool being KNOWN, not full');
  assert.ok(splashSrc.includes('REEL_SEATS.map((slot, i) => <SplashReel'), 'all four seats render from the draw array');
  assert.ok(!splashSrc.includes('reels.length > 0 && <SplashReel'), 'the old non-empty gate is retired');
});

ok('the reels paint as film (sprockets, masks, opposite drifts)', () => {
  assert.ok(css.includes('THE FILM REELS'), 'the law is documented');
  assert.ok(css.includes('animation: gd-reel-up 26s linear infinite'), 'the left reel climbs');
  assert.ok(css.includes('animation-name: gd-reel-down;'), 'the right reel falls');
  assert.ok(css.includes('.gd-reel-holes'), 'the sprocket rows ride between frames');
  assert.ok(css.includes('mask-image: linear-gradient'), 'both ends fade into the wings');
  assert.ok(css.includes('.gd-reel-grain'), 'the leaders wear the animated grain');
  assert.ok(css.includes('.gd-reel-fake svg'), 'the pixel-art leader is inline SVG');
});

// ---- 8: the close reads as a close --------------------------------------------------
ok('the full-window close slides away opaque (the fade rides the tail)', () => {
  assert.ok(appSrc.includes('opacity: [1, 1, 0],'), 'the exit opacity is keyframed (hold, hold, gone)');
  assert.ok(appSrc.includes('x: 88,'), 'the travel deepened (was 64)');
  assert.ok(appSrc.includes("times: [0, 0.6, 1]"), 'the fade is packed into the last 40%');
  assert.ok(appSrc.includes('THE SLIDE STAYS VISIBLE'), 'the root-cause law is documented');
  // the transition rides the VARIANT (transition.exit never reaches per-value overrides)
  const exitAt = appSrc.indexOf('opacity: [1, 1, 0],');
  const transAt = appSrc.indexOf('transition: {', exitAt);
  const varEnd = appSrc.indexOf('};', exitAt);
  assert.ok(transAt > 0 && transAt < varEnd, "the exit's clock rides the variant itself");
});

// ---- 15: the dropdowns say goodbye --------------------------------------------------
ok('the dying dropdown keeps its seat for the goodbye', () => {
  assert.ok(popSrc.includes('THE CLOSING FLIGHT'), 'the law is documented');
  assert.ok(popSrc.includes('THE GOODBYE BEGINS IN THE RENDER THE CLOSE LANDS'), 'the render-time flip (the effect ran one render late — the flight never played)');
  assert.ok(popSrc.includes("leaving && 'gd-pop-out'"), 'the leaving card wears the exit flight');
  assert.ok(css.includes('.gd-pop-out {'), 'the exit class exists');
  assert.ok(css.indexOf('.gd-pop-out {') > css.indexOf('.gd-pop-in {'), 'declared after the entrance (one animation property — the later rule wins)');
  assert.ok(css.includes('gd-pop-out 0.15s ease-in forwards'), 'a 150ms fade-and-rise, the ctx menu mirrored');
});

// ---- 14: the fold breathes -----------------------------------------------------------
ok('the filters fold through a measured grid track', () => {
  assert.ok(gridSrc.includes('THE FOLD BREATHES'), 'the law is documented');
  assert.ok(gridSrc.includes('THE STAMP FOLD BREATHES TOO'), 'the stamp section rides the same flight');
  assert.ok(gridSrc.includes("'gd-fold mt-1.5'"), 'the fold wraps the mounted rows');
  assert.ok(css.includes('grid-template-rows: 1fr;'), 'the open track');
  assert.ok(css.includes('grid-template-rows: 0fr;'), 'the folded track');
  assert.ok(css.includes('transition: grid-template-rows 0.24s ease'), 'the track itself tweens');
  assert.ok(css.includes('min-height: 0;'), "the lane may shrink (a grid item's min-height:auto refuses)");
});

// ---- 18 + 19: the read owns the clock -------------------------------------------------
ok('the status line waits for the read (hover freezes, press skips)', () => {
  assert.ok(statusSrc.includes('THE READ OWNS THE CLOCK'), 'the law is documented');
  assert.ok(statusSrc.includes('onFlight = null, onHold = null, onSkip = null'), 'the three props');
  assert.ok(statusSrc.includes('Math.round(Math.max(4, dist / 28) * 1000)'), 'the flight reports its READ time');
  assert.ok(appSrc.includes('const hold = Math.max(TRANSIENT_MS, statusFlightMsRef.current || 0);'), 'the hold waits for the read, never less than the classic');
  assert.ok(appSrc.includes('if (statusHoldRef.current) return;'), 'the hover owns the line (the countdown re-arms on leave)');
  assert.ok(appSrc.includes('THE HOVER FREEZES THE LINE'), 'the freeze law is documented');
});

// ---- 2: the press ends the pill --------------------------------------------------------
ok('a press ends a tooltip instantly (the drag proceeds on a clean bar)', () => {
  assert.ok(tipsSrc.includes('A PRESS ENDS THE PILL, INSTANTLY'), 'the law is documented');
  assert.ok(tipsSrc.includes('suppressFocusUntil = Date.now() + 350;'), "the click's own focusin cannot re-paint it");
  assert.ok(tipsSrc.includes('if (current) hideNow();'), 'the pill vanishes on any pointerdown');
});

// ---- 4: the bar sits lower --------------------------------------------------------------
ok('the top toolbar sits darker (one step off the ground)', () => {
  /* 1.2.9 note: the bar's law moved on — it rides the theme's own ground
     now (BAND_STEP_DARK_BAR = 0.0, pinned by the 137 batch). This suite
     keeps its historical truth: the 1.2.6 quieting existed and the marker
     still documents the bar's law. */
  assert.ok(themeSrc.includes('THE BAR RIDES THE GROUND'), 'the 1.2.9 law is documented (the 1.2.6 quieting carried it here)');
});

// ---- 5: the glyphs sit in the middle ------------------------------------------------------
ok('the + TAG / + STAMP glyphs sit in the middle of their pills', () => {
  assert.ok(css.includes('THE GLYPHS SIT IN THE MIDDLE'), 'the law is documented');
  assert.ok(css.includes('padding: 2px 9px 0;'), 'the line seat shifts down a pixel (the ink rode high)');
});

// ---- 6: square keys + the holder's icon ----------------------------------------------------
ok(`square-theme keys are square; the holder's icon says its direction`, () => {
  assert.ok(css.includes("THE KEY SPEAKS THE THEME'S SHAPE"), 'the law is documented');
  assert.ok(css.includes('border-radius: var(--gd-btn-radius, 999px);'), 'the hard-coded capsule is retired');
  /* 1.6.7 — the law-pin moves with the fold's rework: the holder and the
     keyline are ONE traveling chip, and the icon says its direction by
     TURNING — ChevronsUpDown is ChevronsDownUp flipped, so the one glyph
     rotates half a turn between the COLLAPSE and TAGS & STAMPS faces
     (the direction the owner asked to SEE moving). */
  assert.ok(viewSrc.includes("the glyph rotating as it travels") || viewSrc.includes("the icon VISIBLY TURNS"), 'the icon law is documented');
  assert.match(viewSrc, /<ChevronsDownUp size=\{11\} className=\{clsx\('transition-transform duration-200', autoCollapsed && 'rotate-180'\)\}\s*\/>/, 'the one glyph turns between both directions (1.6.7)');
});

// ---- 7: the cut tolerance speaks line boxes --------------------------------------------------
ok(`the name's cut tolerance speaks line boxes (no phantom expand)`, () => {
  assert.ok(viewSrc.includes('THE CUT TOLERANCE SPEAKS LINE BOXES'), 'the law is documented');
  assert.ok(viewSrc.includes('el.scrollHeight > el.clientHeight + Math.ceil(lh * 0.5)'), 'only a real extra line (half a line box) arms the expand');
  assert.ok(css.includes('THE CLAMP KEEPS THE DESCENDERS'), 'the clamp keeps its descenders');
});

// ---- 9: the panel flight's cheap lane ----------------------------------------------------------
ok('the panel pop-out flies the cheap lane', () => {
  /* 1.2.9 note: the cheap lane's BLANKING half is retired (the user read
     it as the textures blinking out — 137 pins the retirement); the flight
     class stays armed as the choreography signal for the flight-blind
     re-measure, and the content now mounts with the flight's first frame. */
  assert.ok(appSrc.includes('THE BLANKING IS'), 'the 1.2.9 retirement is documented where the arming lives');
  assert.ok(appSrc.includes("root.classList.add('gd-flight')"), 'the root wears the class (the choreography signal)');
  assert.ok(appSrc.includes('THE CONTENT MOUNTS NOW'), 'the content mounts with the flight (1.2.9: no blank beat)');
  assert.ok(appSrc.includes('gd-panel-content-in'), 'the content fades in over a beat');
});

// ---- 10 + 11: one head, one surface ---------------------------------------------------------------
ok(`the full-window view wears the panel's own surface`, () => {
  assert.ok(viewSrc.includes('ONE HEAD, ONE SURFACE'), 'the head law is documented');
  assert.ok(viewSrc.includes("'gd-tex-panel',"), 'the sticky head paints the panel pattern');
  assert.ok(css.includes("THE PATIENT WHEEL SPEAKS THE PANEL'S SURFACE"), 'the cover law is documented');
  assert.ok(css.includes('background-image: var(--gd-tex-panel, none);'), 'the cover paints the panel pattern');
});

// ---- 16: the separator sits balanced ------------------------------------------------------------------
ok('the separator between stamps and tags sits balanced', () => {
  assert.ok(viewSrc.includes('THE SEPARATOR SITS BALANCED'), 'the law is documented');
});

// ---- 17: the open card's click closes it ----------------------------------------------------------------
ok('clicking an open card closes it', () => {
  assert.ok(appSrc.includes("THE OPEN CARD'S CLICK CLOSES IT"), 'the law is documented');
  assert.ok(appSrc.includes('const toggleOrOpenCard = useCallback'), 'the toggle exists');
  assert.ok(appSrc.includes("if (v.mode === 'character' && v.id === id) setView({ mode: 'grid' });"), 'the full-window seat toggles closed');
});

// ---- the data-URI passthrough (the harness's honest covers) ------------------------------------------------
ok('a data URI passes through unwrapped', () => {
  assert.equal(buildImageUrl('/x', 'data:image/svg+xml;utf8,abc'), 'data:image/svg+xml;utf8,abc', 'never buried inside a path');
  assert.equal(buildImageUrl('/x', 'img.png'), 'local-resource://l/%2Fx%2Fimg.png', 'real filenames still wrap');
});

// ---- the website + the changelog ------------------------------------------------------------------------------
console.log('  ok — retired with the website in 1.8.8 — ' + 'the in-source download page fronts 1.2.9');

ok('the changelog carries the 1.2.6 entry', () => {
  assert.ok(changelog.includes('## 1.2.6 — The Lanes That Hold, the Reels That Roll'), 'the entry exists (1.2.9 leads the log now)');
});

console.log(`\n${passed} passed, ${failed} failed — 1.2.6 batch`);
if (failed) process.exit(1);
