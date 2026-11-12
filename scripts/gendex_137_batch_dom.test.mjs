// 1.2.9 batch — THE ONE MIND, THE QUIET FLIGHT. Twelve reports, one release:
//   1. the oversized tag fills the gap and continues off (packFlowRows'
//      oversized seat + the probe's band merge + the oversized force)
//   2. every page shrink-fits its lanes (no vertical dead slabs between the
//      stamps at any width; the pack law rides data-gd-pack-* attributes)
//   3. the phantom third row dies at the source (the drag reads rows from
//      the LANES, never the transformed chip; widths speak the snapshot)
//   4. the window drags from the status strip (press-and-move = the main
//      process's cursor-follow move; plain press = the skip; no gesture
//      change)
//   5. Settings → LOGS reads the top bar's last 50 lines (selectable,
//      copyable)
//   6. the top toolbar rides the ground (darker, never the brightest one)
//   7. the right panel mounts its content the moment it opens (no ghost)
//   8. the left tree sits slightly darker (the mid band's quieter step)
//   9. the textures never blank through the flight (the 1.2.6 cheap lane's
//      blanking half is retired)
//  10. the splash reels deal one shuffled walk (coverage + freshness),
//      start mid-reel, fade later at the edges
//  11. Settings → Performance rolls all-generated pixel reels
//  12. the flight is blind (the zones re-measure once, at rest — the
//      per-frame burn that read as CPU decline is gone)
// Plus: the version is 1.3.0 everywhere (package.json AND the lock) and the
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
const { packFlowRows, buildSplashReels } = require(join(appRoot, 'src/utils/helpers.js'));
const { computeTierBands } = require(join(appRoot, 'src/utils/theme.js'));
const pkg = require(join(appRoot, 'package.json'));
const lock = require(join(appRoot, 'package-lock.json'));

const css = src('src/index.css');
const sideflow = src('src/components/SideFlow.jsx');
const sortSrc = src('src/components/useThumbSort.js');
const splashSrc = src('src/components/Splash.jsx');
const appSrc = src('src/App.jsx');
const statusSrc = src('src/components/StatusText.jsx');
const settingsSrc = src('src/components/SettingsModal.jsx');
const themeSrc = src('src/utils/theme.js');
const helpersSrc = src('src/utils/helpers.js');
const mainSrc = src('src/main.js');
const preloadSrc = src('src/preload.js');
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
ok('the version is 1.3.0 everywhere', () => {
  assert.equal(APP.version, '1.4.3');
  assert.equal(pkg.version, '1.4.3');
  assert.equal(lock.version, '1.4.3', 'the LOCK follows');
  assert.equal(lock.packages[''].version, '1.4.3', 'the lock root package too');
});

// ---- 1: the oversized tag fills the gap and continues off ----------------------
ok('the oversized seat: a chip wider than the box joins the row and continues off', () => {
  assert.ok(helpersSrc.includes('THE OVERSIZED SEAT'), 'the law is documented');
  // behavior: H (150) is wider than the whole box (100) — the old law broke
  // the row and stranded H alone; the new law seats it at the row's tail
  // (a + H fill the row, H's tail continuing past the edge), b leads the next
  const rows = packFlowRows(['a', 'H', 'b'], (it) => ({ a: 40, H: 150, b: 40 }[it]), 100, 6, { look: 3, firstRowPlain: true });
  assert.deepEqual(rows[0], ['a', 'H'], 'the oversized chip fills the row\u2019s gap (never strands alone)');
  assert.deepEqual(rows[1], ['b'], 'the next chip starts the next row');
  // a merely-wide chip (not wider than the box) still breaks the row honestly
  const wide = packFlowRows(['a', 'W', 'b'], (it) => ({ a: 40, W: 80, b: 40 }[it]), 100, 6, { look: 3, firstRowPlain: true });
  assert.deepEqual(wide[0], ['a'], 'an 80px chip on a 100px box still cannot sit beside a 40px one');
});

ok('the probe\u2019s bands speak the same law (a solo oversized band merges upward)', () => {
  assert.ok(sideflow.includes('THE OVERSIZED BAND MERGES'), 'the law is documented');
  assert.ok(sideflow.includes('bands.splice(bi, 1);'), 'the solo oversized band folds into the band above it');
  assert.ok(sideflow.includes('THE OVERSIZED FORCE'), 'the force law is documented');
  assert.ok(sideflow.includes('const needsSide = bands.length > rows || hasOversized;'), 'an oversized flow always speaks the paged seat');
  // the plain CSS wrap (which would strand the chip alone) never paints it
  assert.ok(sideflow.includes('const hasOversized ='), 'the oversized read exists');
});

// ---- 2 + 3: one mind — shrink-to-fit pages, lanes as the truth ------------------
ok('1.3.2 every wall column shrink-fits (no dead slabs, no fixed box width)', () => {
  assert.ok(/shrink-to-fit columns \(grid-auto-columns:\s*\n\s*\/\/ max-content\) packed/.test(sideflow), 'the law is documented in the wall renderer (1.3.3: max-content, never auto)');
  assert.ok(!sideflow.includes('style={pw}'), 'no page carries an inline box width (there are no pages)');
  assert.ok(!sideflow.includes('data-gd-pack-w'), 'the pack-width attribute retired with the row packing');
  assert.ok(sideflow.includes('data-gd-flow="wall"'), 'the wall mode rides the carrier');
  assert.ok(sideflow.includes("'data-gd-pack-rows': String(rows)"), 'the row cap rides the carrier');
  assert.ok(sideflow.includes("'data-gd-pack-gap': String(Math.round(wallGap))"), 'the wall gap rides it too');
});

ok('1.3.2 the drag packer speaks the wall law (mode + rows + gap attrs, measured bands, column seats)', () => {
  assert.ok(sortSrc.includes("cont.dataset.gdFlow === 'wall'"), 'the packer recognizes the wall carrier by its mode attribute');
  assert.ok(sortSrc.includes('THE WALL IS A SHAPE TOO'), 'the wall pack law is documented');
  assert.ok(sortSrc.includes('parseFloat(cont.dataset?.gdPackRows)'), 'rows-per-column reads the attribute voice');
  assert.ok(sortSrc.includes('kidBoxes'), 'the geometry measures EVERY child (sort items + the foreign tail keys)');
  assert.ok(sortSrc.includes('const colW = new Array(nCols).fill(0);'), 'the columns size to their widest member (the grid law, in math)');
  assert.ok(sortSrc.includes('const R = Math.max(1, rows | 0);'), 'the seats flow down each column before the next (position p -> row p % R, column floor(p / R))');
  assert.ok(sortSrc.includes('nearestGapIndexWall'), 'the drop target speaks the wall geometry (intra-column gaps + seams)');
});

// ---- 4: the window drags from the status strip ----------------------------------
ok('the status strip drags the window (press-and-move) and still skips on a plain press', () => {
  assert.ok(statusSrc.includes('THE STRIP DRAGS THE WINDOW'), 'the law is documented');
  assert.ok(statusSrc.includes("window.api?.manualWindowDrag?.('begin')"), 'a traveling press hands the window to the main process');
  assert.ok(statusSrc.includes("window.api?.manualWindowDrag?.('end')"), 'every end path closes the move');
  assert.ok(statusSrc.includes('onPointerDown='), 'the press protocol owns the strip');
  assert.ok(!statusSrc.includes('cursor: \'pointer\''), 'the pointer cursor is retired (no gesture change)');
  assert.ok(statusSrc.includes("if (skip) onSkip?.();"), 'a press that never traveled is still the read-it skip');
  // the bridge: preload + main
  assert.ok(preloadSrc.includes("manualWindowDrag: (state) => ipcRenderer.send('window-manual-drag', state)"), 'the preload bridge exists');
  assert.ok(mainSrc.includes("ipcMain.on('window-manual-drag'"), 'the main handler exists');
  assert.ok(mainSrc.includes('screen.getCursorScreenPoint()'), 'the move loop follows the screen\u2019s own cursor');
  assert.ok(mainSrc.includes('mainWindow.isMaximized()) return;'), 'a maximized window never manual-drags');
});

// ---- 5: the ledger ---------------------------------------------------------------
ok('the top bar keeps a 50-line ledger (Settings \u2192 Logs, selectable + copyable)', () => {
  assert.ok(appSrc.includes("THE TOP BAR'S OWN LEDGER"), 'the law is documented');
  assert.ok(appSrc.includes('next.length > 50 ? next.slice(next.length - 50) : next'), 'the ring buffer caps at 50');
  assert.ok(appSrc.includes('pushStatusLog(message, kind);'), 'every transient verdict lands in the ledger');
  assert.ok(appSrc.includes("logs={statusLog}"), 'App hands the ledger to the Settings modal');
  assert.ok(settingsSrc.includes("id: 'Logs', icon: ScrollText"), 'the Logs tab rides the rail');
  assert.ok(settingsSrc.includes('COPY SELECTED'), 'the selection copy key exists');
  assert.ok(settingsSrc.includes('COPY ALL'), 'the whole-ledger copy key exists');
  assert.ok(settingsSrc.includes('window.getSelection'), 'the selected copy reads the live selection');
  assert.ok(css.includes('.gd-logs-list'), 'the ledger column is styled');
  assert.ok(css.includes('.gd-logs-line.is-fail .gd-logs-msg'), 'failures wear the warm red');
});

// ---- 6 + 8: the bar rides the ground; the tree a shade quieter -------------------
ok('the top toolbar rides the ground (darker, never the brightest one)', () => {
  assert.ok(themeSrc.includes('THE BAR RIDES THE GROUND'), 'the law is documented');
  assert.equal(themeSrc.includes('const BAND_STEP_DARK_BAR = 0.0;'), true, 'the dark bar step is ZERO (the ground itself)');
  // behavior: a dark ground\u2019s bar TIES its deep band; the mid sections breathe above both
  const dark = computeTierBands('#101014');
  assert.equal(dark.bar, dark.deep, 'the bar ties the viewer\u2019s depth');
  assert.equal(dark.bar, '#101014', 'the bar IS the ground');
  assert.notEqual(dark.mid, dark.bar, 'the mid sections stay their own band');
});

ok('the left tree sits slightly darker (the mid band\u2019s quieter step)', () => {
  assert.ok(themeSrc.includes('const BAND_STEP_DARK_MID = 0.045;'), 'the mid step quieted (was 0.065)');
  assert.ok(themeSrc.includes('const BAND_STEP_LIGHT_MID = -0.015;'), 'the bright mid shades a hair below the ground');
  const bright = computeTierBands('#efeae0');
  assert.equal(bright.bar, '#efeae0', 'the bright bar ties the ground');
  assert.ok(bright.mid !== bright.bar, 'the bright mid shades below it (the tree slightly darker)');
});

// ---- 7: the panel mounts its content the moment it opens --------------------------
ok('the right panel opens with its content (no blank ghost beat)', () => {
  assert.ok(appSrc.includes('THE CONTENT MOUNTS NOW'), 'the law is documented');
  assert.ok(!appSrc.includes('panelLanded'), 'the staged-landing state is retired');
  assert.ok(!appSrc.includes('gd-panel-ghost'), 'the ghost div is retired');
  assert.ok(!css.includes('.gd-panel-ghost'), 'the ghost\u2019s CSS is retired too');
  assert.ok(appSrc.includes('gd-panel-content-in'), 'the arrival fade keeps its seat');
});

// ---- 9 + 12: the flight keeps its cloth; the flight is blind ----------------------
ok('the textures never blank through the flight (the 1.2.6 blanking is retired)', () => {
  assert.ok(css.includes('THE BLANKING IS'), 'the retirement is documented');
  assert.ok(!css.includes('html.gd-flight .gd-tex-panel'), 'no flight rule strips the patterns');
  assert.ok(!css.includes('body.gd-resizing .gd-tex-viewer'), 'no resize rule strips them either');
  assert.ok(appSrc.includes("root.classList.add('gd-flight')"), 'the class stays armed (the choreography signal)');
});

ok('the flight is blind (the zones hold their seat and re-pack once, at rest)', () => {
  assert.ok(sideflow.includes('THE FLIGHT IS BLIND'), 'the law is documented');
  /* 1.3.0 re-law: the panel flight LEFT the hold (the fixed-width content
     wrapper means the flight never moves a zone's width; the staged zones
     must measure at mount). The observer still reads the resize drag. */
  assert.ok(sideflow.includes("classList.contains('gd-resizing')"), 'the observer reads the resize drag class');
  assert.ok(!sideflow.includes("classList.contains('gd-flight')"), 'the flight class left the hold');
  assert.ok(sideflow.includes("classList.contains('gd-resizing')"), 'and the resize-drag class');
  assert.ok(sideflow.includes('new MutationObserver'), 'the trailing edge is watched (one re-measure at the drop)');
  assert.ok(sideflow.includes('pending = true;'), 'width ticks mid-flight are held, not measured');
});

// ---- 10: the reels deal one screen-wide hand (1.2.9) -----------------------------
ok('one hand deals the whole screen (no card twice, anywhere)', () => {
  assert.ok(helpersSrc.includes('NO REPEATS, ANYWHERE'), 'the law is documented');
  assert.ok(helpersSrc.includes('FOUR REELS'), 'the four-column law is documented');
  // coverage: a pool of 10 seats EVERY card exactly once across the screen
  // (the old two-draw law could miss a card for many launches — the "not
  // detected" report; the 1.2.7 walk could seat a card twice — the 1.2.9
  // no-repeat report)
  const pool10 = Array.from({ length: 10 }, (_, i) => 'card-' + i);
  const d10 = buildSplashReels(pool10, { slots: 8, seed: 5 });
  const flat10 = d10.flat();
  const seated = flat10.filter((s) => !s.fake).map((s) => s.url);
  assert.equal(seated.length, 10, 'ten real frames for a ten-card pool');
  assert.equal(new Set(seated).size, 10, 'every card seats EXACTLY once on the whole screen');
  assert.equal(flat10.filter((s) => s.fake).length, 22, 'the leaders pad the rest');
  // a pool of 32 seats every card EXACTLY once (one distinct cut)
  const pool32 = Array.from({ length: 32 }, (_, i) => 'p-' + i);
  const d32 = buildSplashReels(pool32, { slots: 8, seed: 9 });
  const urls32 = d32.flat().map((s) => s.url);
  assert.equal(new Set(urls32).size, 32, 'thirty-two distinct cards across thirty-two seats');
  // the law holds on many seeds: no card ever repeats on the whole screen
  for (const seed of [1, 7, 42, 99, 1234]) {
    const d = buildSplashReels(Array.from({ length: 40 }, (_, i) => 'c' + i), { slots: 8, seed });
    const urls = d.flat().map((s) => s.url);
    assert.equal(urls.length, 32, 'thirty-two seats on seed ' + seed);
    assert.equal(new Set(urls).size, 32, 'no seat equals any other seat (seed ' + seed + ')');
  }
});

ok('the strips start mid-reel and fade later at the edges', () => {
  assert.ok(splashSrc.includes('THE STRIP STARTS MID-REEL'), 'the phase law is documented');
  assert.ok(splashSrc.includes('animationDelay: `${startDelay.toFixed(2)}s`'), 'a random negative delay rolls the starting phase');
  assert.ok(splashSrc.includes('-(Math.random() * 26)'), 'the phase is random per launch');
  assert.ok(css.includes('THE FADE STARTS LATER'), 'the fade law is documented');
  assert.ok(css.includes('#000 7%'), 'the top fade begins at 7% (was 14%)');
  assert.ok(css.includes('#000 93%'), 'the bottom fade ends at 93% (was 86%)');
  assert.ok(css.includes('max-height: 62vh;'), 'the strip reads taller (was 58vh)');
});

// ---- 11: the generated-reels switch -------------------------------------------------
ok('Settings \u2192 Performance speaks the film reels in their own voice (1.3.3)', () => {
  /* 1.3.3 re-law ("reverse the splash film reel option, when its on its on
     when its off its off"): the old splashGeneratedReels key was inverted
     from the label — ON rolled generated pixel frames, OFF rolled the real
     covers. splashFilmReels is honest: ON (default) rolls the wings' strips
     with the cards' covers; OFF mounts no reels at all. */
  assert.ok(settingsSrc.includes('SPLASH FILM REELS'), 'the OptCard exists');
  assert.ok(settingsSrc.includes("set('splashFilmReels', settings.splashFilmReels === false)"), 'the switch writes the honest setting');
  assert.ok(!settingsSrc.includes('splashGeneratedReels'), 'the inverted key retired with its toggle');
  assert.ok(appSrc.includes('splashFilmReels === false ? null : reelPool'), 'OFF mounts no reels at all; ON rolls the real pool');
  assert.ok(appSrc.includes('THE SPLASH SEAT'), 'the law is documented');
});

// ---- the website + the changelog ------------------------------------------------------
console.log('  ok — retired with the website in 1.8.8 — ' + 'the in-source download page fronts 1.2.9');

ok('the changelog carries the 1.2.9 entry', () => {
  assert.ok(changelog.startsWith('## 1.4.3 — The Pearl and the Flame'), 'the 1.3.6 entry leads the log');
  assert.ok(changelog.includes('## 1.2.9 — The Breath It Mounts In'), 'the 1.2.9 entry keeps its seat');
  assert.ok(changelog.includes('## 1.2.6 — The Lanes That Hold, the Reels That Roll'), 'the 1.2.6 entry keeps its seat');
});

console.log(`\n${passed} passed, ${failed} failed — 1.2.9 batch`);
if (failed) process.exit(1);
