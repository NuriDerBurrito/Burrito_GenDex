// 1.2.9 batch — THE LAW THAT HOLDS AT EVERY FRAME
// The eleven-item release: the one-mind measure hold, the resting cap, the
// sort-live signal, the completed tail-seat law, the four-reel splash, the
// reels setting's persistence, the ledger's persistence, the name fold's
// honest target + quiet retirement, the tree's own well, and the release
// furniture (version, changelog, website).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const appRoot = process.cwd();
const src = (p) => readFileSync(path.join(appRoot, p), 'utf8');

const helpersSrc = src('src/utils/helpers.js');
const sideflow = src('src/components/SideFlow.jsx');
const sortSrc = src('src/components/useThumbSort.js');
const appSrc = src('src/App.jsx');
const splashSrc = src('src/components/Splash.jsx');
const viewSrc = src('src/components/CharacterView.jsx');
const themeSrc = src('src/utils/theme.js');
const css = src('src/index.css');
const constantsSrc = src('src/constants/index.js');
const changelog = src('CHANGELOG.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const pkg = JSON.parse(src('package.json'));

const helpers = await import(path.join(appRoot, 'src/utils/helpers.js'));
const { packFlowRows, buildSplashReels, createSafeDb } = helpers;
const { computeTierBands } = await import(path.join(appRoot, 'src/utils/theme.js'));
const { DEFAULT_SETTINGS, APP } = await import(path.join(appRoot, 'src/constants/index.js'));

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok ${passed + failed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  NOT OK ${passed + failed} — ${name}\n      ${e.message.split('\n')[0]}`);
  }
};

// ---- 1: the hold is one mind (every measure path defers) -------------------------
ok('the hold guards EVERY measure path (the 1.2.7 bypass is closed)', () => {
  assert.ok(sideflow.includes('THE HOLD IS ONE MIND NOW'), 'the law is documented');
  assert.ok(sideflow.includes('const held = () =>'), 'one predicate, every caller');
  // the render path (the every-render layout effect) honors the hold
  const renderPath = /useLayoutEffect\(\(\) => \{\s*\/\/ 1\.2\.8 — the render path honors the hold too[^}]*?if \(held\(\)\) \{\s*pendingRef\.current = true;\s*return;\s*\}/s;
  assert.ok(renderPath.test(sideflow), 'the layout-effect path arms pending instead of measuring mid-flight');
  // the observer path speaks the same predicate (not its own closure)
  assert.ok(sideflow.includes('if (held()) {\n        pending = true;'), 'the RO path defers through the same law');
  // the font-settle re-read too
  assert.ok(sideflow.includes('if (alive && !held()) remeasure();'), 'the font-settle re-read defers as well');
  // the shared pending ref spends once at the class-drop edge
  assert.ok(sideflow.includes('const spend = (pending || pendingRef.current) && !held();'), 'the MutationObserver edge spends both pendings exactly once');
});

ok('the hold reads the sort-live signal (a drag is a flight too)', () => {
  assert.ok(sideflow.includes("classList.contains('gd-sort-live')"), 'the predicate speaks the drag signal');
  assert.ok(sortSrc.includes('THE SORT-LIVE SIGNAL'), 'the law is documented in the engine');
  assert.ok(sortSrc.includes("document.body.classList.toggle('gd-sort-live'"), 'the engine arms the body class');
  assert.ok(sortSrc.includes('let gdSortLiveCount = 0;'), 'a counting gate (several engines live side by side)');
});

ok('the sort-live signal dies with its drag (every end path speaks it)', () => {
  const commit = sortSrc.indexOf('THE HOLD LIFTS BEFORE THE COMMIT');
  assert.ok(commit > 0, 'the commit lifts the hold BEFORE its own render');
  const cancel = sortSrc.indexOf('the hold lifts with the drag');
  assert.ok(cancel > 0, 'the cancel lifts it');
  assert.ok(sortSrc.includes("the hold's last safety"), 'finishCommit carries the last safety');
  assert.ok(sortSrc.includes('must not strand the sort-live'), 'the unmount cleanup cannot strand the class');
  assert.ok(sortSrc.includes('drag.sortLiveArmed = true;'), 'the arm rides the drag object (spent exactly once)');
});

// ---- 2: the resting cap -----------------------------------------------------------
ok('the resting cap holds the rows law at every frame (source law)', () => {
  assert.ok(sideflow.includes('THE RESTING CAP'), 'the law is documented');
  assert.ok(sideflow.includes('const restCap = bands.length'), 'the cap derives from the probe');
  assert.ok(sideflow.includes('Math.min(Math.max(1, rows), bands.length) - 1].bottom + 5)'), 'the rows-th band + the marks reach (the capH law)');
  // 1.3.6 — THE CAP FLOORS THE FLIGHT: the old flightMax == null gate retired
  // (a stale-measure blink mid-flight could paint the flow uncapped for a
  // commit — the third-row flash); the ceiling is now the GREATER of the
  // flight target and the resting cap, so an honest expand still tweens to
  // its full target while a stale blink finds the ceiling standing.
  assert.ok(sideflow.includes("!collapsed && !sideMounted && restCap != null"), 'the cap rides the open PLAIN seat through flights too (the side seat is structurally capped, and keeps its scroller)');
  assert.ok(sideflow.includes("Math.max(flightMax ?? 0, restCap)"), 'the ceiling floors the flight target (the 1.3.6 third-row-flash kill)');
  assert.ok(sideflow.includes("{ maxHeight: Math.max(flightMax ?? 0, restCap), overflow: 'hidden' }"), 'the stale ceiling clips the re-wrapping overflow');
});

// ---- 3: the completed tail-seat law. 1.3.1 re-law: ORDINARY ITEMS WRAP, ONLY
// THE OVERSIZED POKE (the ghost stamps died with the poke's retirement — see
// the one-width law in helpers.js).
ok('packFlowRows: ordinary items wrap on every row, only the oversized pokes', () => {
  assert.ok(helpersSrc.includes('ORDINARY ITEMS WRAP, ONLY THE OVERSIZED POKE'), 'the 1.3.1 law is documented');
  assert.ok(helpersSrc.includes('THE OVERSIZED TAIL SEAT'), 'the oversized seat keeps its true scope');
  // behavior: an ordinary item that cannot fit STARTS THE NEXT ROW on EVERY row
  // (the CSS wrap's verdict), regardless of firstRowPlain
  const a = packFlowRows(['x', 'y'], (it) => ({ x: 60, y: 60 }[it]), 100, 6, { look: 3, firstRowPlain: true });
  assert.deepEqual(a, [['x'], ['y']], 'row one breaks like the browser wrap (no poke, no pull)');
  const b = packFlowRows(['x', 'y'], (it) => ({ x: 60, y: 60 }[it]), 100, 6, { look: 3, firstRowPlain: false });
  assert.deepEqual(b, [['x'], ['y']], 'rows after the front break the same way (1.3.1: the poke is retired)');
  // an oversized item pokes even on row one (the 1.2.7 band-merge pairing)
  const c = packFlowRows(['big'], (it) => 150, 100, 6, { look: 3, firstRowPlain: true });
  assert.deepEqual(c, [['big']], 'an oversized item rides its own band (the probe merges it)');
  // the row break threshold: the +1 mercy is gone; a row packs exactly what the
  // CSS wrap would seat at the same width (the one-width law)
  const d = packFlowRows(['a', 'b', 'c'], (it) => 44, 96, 8, { firstRowPlain: false });
  assert.deepEqual(d, [['a', 'b'], ['c']], 'a row holds 2 at W=96 (44*2+8=96) and the third wraps (96+8+44 > 96)');
});

// ---- 4: the four-reel splash ---------------------------------------------------------
ok('the splash seats four reels (two per wing, alternating)', () => {
  assert.ok(splashSrc.includes('THE DRAW IS AN ARRAY OF REELS NOW'), 'the law is documented');
  assert.ok(splashSrc.includes('REEL_SEATS.map((slot, i) => <SplashReel'), 'all four render from the draw');
  for (const seat of ['lo', 'li', 'ri', 'ro']) {
    assert.ok(splashSrc.includes(`seat: '${seat}'`), `the ${seat} column renders`);
  }
  assert.ok(css.includes('.gd-reel.is-lo'), 'the outer-left seat');
  assert.ok(css.includes('.gd-reel.is-li'), 'the inner-left seat');
  assert.ok(css.includes('.gd-reel.is-ri'), 'the inner-right seat');
  assert.ok(css.includes('.gd-reel.is-ro'), 'the outer-right seat');
  assert.ok(css.includes('@media (max-width: 1280px)'), 'the inner pair bows out on narrow windows');
  assert.ok(css.includes('opacity: 0.5;'), 'the inner columns sit at a lower voice');
  // the entrance lands every column on its own voice (no end-of-animation pop)
  assert.ok(css.includes('no `to` keyframe'), 'the entrance keyframe omits the to state');
});

ok('the draw deals no card twice (pure, every pool size)', () => {
  for (const n of [0, 1, 3, 7, 12, 20, 31, 32, 40, 90]) {
    const pool = Array.from({ length: n }, (_, i) => `u${i}.png`);
    const draw = buildSplashReels(pool, { slots: 8, seed: 100 + n });
    assert.equal(draw.length, 4, `four reels (pool ${n})`);
    const urls = draw.flat().filter((s) => !s.fake).map((s) => s.url);
    assert.equal(urls.length, Math.min(n, 32), `every seat a real card or a leader (pool ${n})`);
    assert.equal(new Set(urls).size, urls.length, `no card twice, anywhere (pool ${n})`);
    if (n > 0 && n < 32) {
      for (const u of pool) assert.ok(urls.includes(u), `every card seats once (pool ${n})`);
    }
  }
});

// ---- 5: the reels setting persists ------------------------------------------------
ok('SPLASH FILM REELS survives the save/load cycle (the sanitizer carries the key)', () => {
  /* 1.3.3 re-law: the key is splashFilmReels now (ON by default — the
     reels roll with the cards' covers; OFF mounts no reels at all). The
     old inverted splashGeneratedReels key is deliberately NOT carried
     over — no stored inversion survives to fight the honest voice. */
  assert.ok(helpersSrc.includes('THE SPLASH FILM REELS, IN THEIR OWN VOICE'), 'the law is documented');
  assert.equal(DEFAULT_SETTINGS.splashFilmReels, true, 'the default lives in DEFAULT_SETTINGS (ON)');
  assert.equal(DEFAULT_SETTINGS.splashGeneratedReels, undefined, 'the inverted key is gone from the defaults');
  const on = createSafeDb({ settings: { splashFilmReels: true }, characters: [], classes: [], tags: [], stamps: [] });
  assert.equal(on.settings.splashFilmReels, true, 'a stored ON choice loads back ON');
  const off = createSafeDb({ settings: { splashFilmReels: false }, characters: [], classes: [], tags: [], stamps: [] });
  assert.equal(off.settings.splashFilmReels, false, 'a stored OFF choice loads back OFF');
  const fallback = createSafeDb({ settings: {}, characters: [], classes: [], tags: [], stamps: [] });
  assert.equal(fallback.settings.splashFilmReels, true, 'a missing key falls back to the default (ON)');
  const stale = createSafeDb({ settings: { splashGeneratedReels: true }, characters: [], classes: [], tags: [], stamps: [] });
  assert.equal(stale.settings.splashGeneratedReels, undefined, 'a stored legacy key does not survive the load');
});

// ---- 6: the ledger persists ----------------------------------------------------------
ok('the logs survive the restart (hydrate + write-through)', () => {
  assert.ok(appSrc.includes("THE LEDGER PERSISTS"), 'the law is documented');
  assert.ok(appSrc.includes("const STATUS_LOG_KEY = 'gd:status-log';"), 'the ledger owns a localStorage key');
  assert.ok(appSrc.includes('localStorage.getItem(STATUS_LOG_KEY)'), 'the boot hydrates from storage');
  assert.ok(appSrc.includes('localStorage.setItem(STATUS_LOG_KEY, JSON.stringify(capped))'), 'every push writes through');
  assert.ok(appSrc.includes('.slice(-50)'), 'the cap rides the persisted copy too');
  assert.ok(appSrc.includes("kind: e.kind === 'fail' ? 'fail' : 'ok'"), 'the hydrated kinds are sanitized');
});

// ---- 7: the name fold ------------------------------------------------------------------
ok('the fold target measures the clamp\'s own box (descenders survive)', () => {
  assert.ok(viewSrc.includes("THE TARGET MEASURES THE CLAMP'S OWN"), 'the law is documented');
  assert.ok(viewSrc.includes('const clampedHRef = useRef(0);'), 'the last clamped height is remembered');
  assert.ok(viewSrc.includes('if (clampedNow && el.clientHeight > clampedHRef.current)'), 'it learns while the clamp paints');
  assert.ok(viewSrc.includes('const twoBox = Math.max(two, clampedHRef.current || 0);'), 'the two-line ceiling takes the painted box');
});

ok('an expanded name that comes to fit retires its key quietly', () => {
  assert.ok(viewSrc.includes("THE SIGNALS' ONE APPLIER"), 'the law is documented');
  assert.ok(viewSrc.includes('if (!s.twinSays && !s.clampCuts && nameExpandedRef.current)'), 'the retirement condition');
  assert.ok(viewSrc.includes('setNameExpanded(false);'), 'the fold settles back by itself (nothing moves on screen)');
  assert.ok(viewSrc.includes('const applyNameSignals = useCallback'), 'all three consumers speak the one applier');
});

// ---- 8: the tree's own well ------------------------------------------------------------
ok('computeTierBands speaks the fourth tier (the sidebar well)', () => {
  const g = computeTierBands('#0c1114');
  assert.equal(typeof g.side, 'string', 'the side key exists');
  assert.ok(g.side.startsWith('#'), 'it is a hex');
  assert.notEqual(g.side, g.deep, 'it is its own band, not the deep ground');
  assert.notEqual(g.side, g.mid, 'not the mid either');
  // the light family: between mid and deep
  const p = computeTierBands('#efeae0');
  assert.ok(p.side !== p.mid && p.side !== p.deep, 'the bright family speaks it too');
});

// ---- 9: the version furniture ------------------------------------------------------------
ok('the version is 1.3.0 everywhere', () => {
  assert.equal(pkg.version, '1.4.3');
  assert.equal(APP.version, '1.4.3');
  assert.match(src('package-lock.json'), /"version": "1\.4\.3"/);
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(website, /var CURRENT = \[1, 4, 3\]/);
  assert.match(changelog, /^## 1\.3\.0 — The Fill Reads From the Top/m);
  assert.match(changelog, /\*\*The 2-rows law holds through the resize/m);
  assert.match(changelog, /\*\*Four reels, no card twice\.\*\*/m);
  assert.ok(!changelog.startsWith('## 1.2.7'), 'the 1.2.7 entry no longer leads');
});

ok('the constants speak the honest seat (the reels switch documents its voice)', () => {
  assert.ok(constantsSrc.includes('THE SPLASH FILM REELS, IN THEIR OWN VOICE'), 'the 1.3.3 note rides the default');
});

console.log(`\n${passed} passed, ${failed} failed — 1.2.9 batch`);
if (failed) process.exit(1);
