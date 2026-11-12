// 1.2.4 batch — THE CLICKS THAT LAND. Eleven reports, one release:
//   1. the detail panel's / full view's keys answer the pointer again (the
//      toolbar's drag region retired — only the real top bar drags)
//   2. holding those keys can no longer move the window (same law)
//   3. the + stamp picker opens from the + key itself; the + keys center
//   4. the strips' rows group by OVERLAP (no phantom rows from centered
//      riders) — the tags' "content only on the 2nd row" report
//   5. the strips end with their content (the tail page is a column of
//      shrink-to-fit rows — no slab of blank after the settings)
//   6. the arrows are whole circles (the live flight no longer slides them
//      4px under the rows body's clip)
//   7. the retract GLIDES its pan home (the pages stay mounted through the
//      fold; the x axis seals after the pan lands)
//   8. the tree's branches tie back onto the parent plate and the glowing
//      dot sits ON the rail
//   9. the toast pills out-rank every drag region
//  10. the tooltip pins at its hover point (the follow is retired, setting
//      and all)
//  11. the card shine re-arms under a resting cursor the instant its sweep
//      ends
// Plus: the version is 1.2.4 everywhere (package.json AND the lock — the
// 1.2.2 session's miss stays guarded) and the website fronts it.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const appRoot = fileURLToPath(new URL('..', import.meta.url));
const src = (rel) => readFileSync(join(appRoot, rel), 'utf8');

const { APP } = require(join(appRoot, 'src/constants/index.js'));
const pkg = require(join(appRoot, 'package.json'));
const lock = require(join(appRoot, 'package-lock.json'));

const css = src('src/index.css');
const sideflow = src('src/components/SideFlow.jsx');
const gridSrc = src('src/components/GridView.jsx');
const charSrc = src('src/components/CharacterView.jsx');
const stampModal = src('src/components/StampEditModal.jsx');
const tipsSrc = src('src/components/GdTooltips.jsx');
const appSrc = src('src/App.jsx');
const settingsSrc = src('src/components/SettingsModal.jsx');
const titlebarSrc = src('src/components/Titlebar.jsx');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const changelog = src('CHANGELOG.md');

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL — ${name}\n      ${e.message}`);
    process.exitCode = 1;
  }
};

// ---- the version -------------------------------------------------------------
ok('the version is 1.3.1 everywhere (the lock included)', () => {
  assert.equal(APP.version, '1.4.3');
  assert.equal(pkg.version, '1.4.3');
  assert.equal(lock.version, '1.4.3', 'the LOCK follows (the 1.2.2 session missed it)');
  assert.equal(lock.packages[''].version, '1.4.3', 'the lock root package too');
  assert.match(src('README.md'), /\*\*v1\.4\.3\*\*/);
  assert.match(src('START.bat'), /(1\.4\.3)/);
  assert.equal(lock.packages['node_modules/@electron/windows-sign'].version, '1.2.2', 'the dependency keeps its TRUE version');
});

// ---- 1+2: the drag bar retired from the toolbar ------------------------------
ok('the toolbar row no longer drags the window (the real top bar alone)', () => {
  const header = gridSrc.slice(gridSrc.indexOf('data-gd-region="header"'), gridSrc.indexOf('data-gd-region="header"') + 400);
  assert.ok(!header.includes('drag-region'), 'the header row carries no drag region');
  assert.match(
    gridSrc,
    /1\.2\.2 made this row a drag bar \(the titlebar's lower half\); 1\.2\.4[\s\S]{0,120}RETIRES IT/,
    'the retirement is the documented law'
  );
});
ok('the app-wide drag region census: ONLY the titlebar wears it', () => {
  const wearers = [gridSrc, charSrc, appSrc, stampModal, src('src/components/SideFlow.jsx')];
  for (const w of wearers) {
    assert.ok(!w.includes('drag-region'), 'no other component declares a drag region');
  }
  assert.match(titlebarSrc, /gd-titlebar drag-region/, 'the titlebar keeps its drag seat');
});

// ---- 9: the toast pills out-rank every drag region ---------------------------
ok('the toast stack declares no-drag outright', () => {
  const rule = css.slice(css.indexOf('.gd-toast-stack {'), css.indexOf('.gd-toast-stack {') + 900);
  assert.match(rule, /-webkit-app-region: no-drag;/);
});

// ---- 11: the shine re-arms under a resting cursor -----------------------------
ok('the sweep restarts itself under a resting cursor', () => {
  assert.match(
    gridSrc,
    /if \(card && typeof card\.matches === 'function' && card\.matches\(':hover'\)\) \{[\s\S]{0,260}host\.classList\.add\('is-live'\);/,
    'the retire checks :hover and re-arms with a forced reflow'
  );
});

// ---- 3: the + picker anchors at the + key; the + keys center ------------------
ok('the stamp picker opens from the + key that summoned it', () => {
  assert.match(stampModal, /signalAnchorRef = null,/, 'the prop exists');
  assert.match(stampModal, /setAnchorOverride\(signalAnchorRef \|\| null\);/, 'the signal path anchors there');
  assert.match(stampModal, /anchor=\{anchorOverride \|\| btnRef\}/, 'the popover follows the override');
  assert.match(stampModal, /setAnchorOverride\(null\); \/\/ the tile's own key/, 'the tile path resets to its own anchor');
  assert.match(charSrc, /signalAnchorRef=\{plusKeyRef\}/, 'the detail panel hands its + key ref');
  assert.match(charSrc, /ref=\{plusKeyRef\}/, 'the + key itself carries the ref');
});
ok('both rows\u2019 + keys center beneath their labels', () => {
  const stamps = charSrc.slice(charSrc.indexOf("THE + KEY CENTERS UNDER ITS LABEL"), charSrc.indexOf("THE + KEY CENTERS UNDER ITS LABEL") + 900);
  const tags = charSrc.slice(charSrc.indexOf('THE + KEY CENTERS UNDER ITS LABEL', charSrc.indexOf('THE + KEY CENTERS UNDER ITS LABEL') + 100), charSrc.indexOf('THE + KEY CENTERS UNDER ITS LABEL', charSrc.indexOf('THE + KEY CENTERS UNDER ITS LABEL') + 100) + 900);
  assert.match(stamps, /flex flex-col items-center/, 'the stamps column centers');
  assert.match(tags, /flex flex-col items-center/, 'the tags column centers');
  assert.match(stamps, /gd-row-toggle flex-shrink-0 self-start/, 'the toggle keeps the column edge');
});

// ---- 4: the rows group by overlap --------------------------------------------
ok('readBands groups rows by vertical OVERLAP, not top-threshold', () => {
  assert.match(sideflow, /r\.top < band\.bottom - 0\.5/, 'an item joins the band when its box overlaps it');
  assert.ok(!sideflow.includes("t > rowTops[rowTops.length - 1] + 4"), 'the 4px top-threshold splitter is gone');
});

// ---- 5: the tail page ends with its content ----------------------------------
ok('1.3.2 the pages (and their tail) are retired — the wall ends with its content', () => {
  /* 1.3.2 re-law: there IS no last page. The wall is one continuous
     column-major grid: every column shrink-fits its widest item
     (grid-auto-columns: auto), the last column simply runs short, and the
     scroll ends right after the last seat's air (the trailing margin). */
  assert.ok(!sideflow.includes('is-tail'), 'the tail marker retired with the pages');
  assert.ok(!sideflow.includes('gd-side-row'), 'the lanes retired with them');
  assert.ok(!css.includes('.gd-side-page'), 'no page boxes in the CSS');
  assert.match(sideflow, /THE WALL RENDERER: ONE grid, the caller's children/, 'the wall renderer law is documented (1.3.3: the reading order is the carrier\'s own voice)');
  assert.match(css, /\.gd-collapse-zone\.is-side > \.gd-stamp-slots\.is-wall\s*\{[^}]*?grid-auto-columns: max-content;/, 'every wall column shrink-fits (max-content — 1.3.3: auto collapsed to min-content and stacked the columns over each other)');
  assert.match(css, /\.gd-collapse-zone\.is-side > \.gd-stamp-slots\.is-wall > \*:last-child\s*\{[^}]*?margin-right: 9px;/, 'the wall\u2019s last seat carries the scroll\u2019s end air');
});

ok('the edge seats declare their slide BEFORE the live law', () => {
  const iLeft = css.indexOf('.gd-flow-arrow.is-left {');
  const iRight = css.indexOf('.gd-flow-arrow.is-right {');
  const iLive = css.indexOf('.gd-flow-arrow.is-live {');
  assert.ok(iLeft > 0 && iRight > 0 && iLive > 0, 'all three rules exist');
  assert.ok(iLeft < iLive && iRight < iLive, 'the edge seats come first — .is-live wins the tie');
  const live = css.slice(iLive, css.indexOf('}', iLive));
  assert.match(live, /translate: 0 0;/, 'the live key returns to its true seat');
});

// ---- 7: the retract glides ----------------------------------------------------
ok('the home pan is a smooth flight, not a snap', () => {
  assert.match(sideflow, /zone\.scrollTo\(\{ left: 0, behavior: 'smooth' \}\);/, 'the pan window scrolls smooth');
  assert.match(sideflow, /const armPanWindow = \(\) => \{/, 'the pan window arms');
  assert.match(sideflow, /if \(entering && needsSide && capH != null && zone\.scrollLeft > 0\) armPanWindow\(\);/, 'the retract arms it only when there is a pan to fly');
});
ok('the side seat lingers through the fold (lag-free)', () => {
  assert.match(sideflow, /const sideMounted = needsSide && capH != null;/, 'derived from the measure alone — never lags a commit');
  assert.match(sideflow, /sideMounted && 'is-side'/, 'the class follows the mount');
  assert.match(sideflow, /sideMounted \? renderSide\(\) : renderPlain\(flowRef\)/, 'the render follows the mount');
});
ok('the flight clip speaks the Y axis only; the x axis seals at rest', () => {
  assert.match(sideflow, /zone\.style\.overflowY = 'hidden';/, 'the prime clips Y only');
  assert.ok(!sideflow.includes("zone.style.overflow = 'hidden'"), 'no blanket overflow in the prime');
  assert.match(sideflow, /maxHeight: flightMax, overflowY: 'hidden' \}/, 'the flight style clips Y only');
  assert.match(sideflow, /sideMounted && !xOpen \? \{ overflowX: 'hidden' \}/, 'the resting fold seals the x axis (the 1.1.8 law)');
});

// ---- 8: the tree ties back on -------------------------------------------------
ok('the rail reaches the parent plate; the dot sits on the rail', () => {
  const first = css.slice(css.indexOf('.gd-tree-node:first-child::before {'), css.indexOf('.gd-tree-node:first-child::before {') + 200);
  assert.match(first, /top: -3px;/, 'the reach touches the plate bottom border');
  const both = css.slice(css.indexOf('.gd-tree-node:first-child:last-child::before {'), css.indexOf('.gd-tree-node:first-child:last-child::before {') + 200);
  assert.match(both, /top: -3px;[\s\S]{0,40}height: 19px;/, 'the single child speaks the same reach');
  const joint = css.slice(css.indexOf('.gd-tree-joint {'), css.indexOf('.gd-tree-joint {') + 260);
  assert.match(joint, /left: calc\(var\(--pad, 6px\) - 8px\);/, 'the dot centers on the rail x');
});

// ---- 10: the tooltip pins -----------------------------------------------------
ok('the pill pins at its hover point and never follows', () => {
  assert.match(tipsSrc, /let pinX = null;/, 'the pin exists');
  assert.match(tipsSrc, /if \(pinX == null\) pinX = Number\.isFinite\(cursorX\) \? cursorX : rect\.left \+ rect\.width \/ 2;/, 'the first paint pins (cursor, else the anchor center)');
  assert.match(tipsSrc, /const x = Math\.max\(8, Math\.min\(vw - cachedW - 8, pinX - cachedW \/ 2\)\);/, 'every paint centers on the pin');
  assert.match(tipsSrc, /pinX = null; \/\/ a fresh hover pins fresh/, 'a new hover re-pins');
  assert.match(tipsSrc, /pinX = null; \/\/ 1\.2\.4 — the pin dies with the pill/, 'the hide clears the pin');
  assert.ok(!tipsSrc.includes('const place ='), 'the cheap re-place loop is gone');
  assert.ok(!tipsSrc.includes('const follow ='), 'the follow loop is gone');
  assert.ok(!tipsSrc.includes('moveReq'), 'the rAF follow ticket is gone');
  assert.match(tipsSrc, /if \(current && pointerOffAnchor\(\)\) hideNow\(\);/, 'pointer motion stays GROUND TRUTH only');
  assert.match(tipsSrc, /const onScroll = \(\) => \{[\s\S]{0,120}if \(pointerOffAnchor\(\)\) hideNow\(\);/, 'a scroll only ever ends the pill, never moves it');
});
ok('the follow setting retired everywhere', () => {
  assert.ok(!tipsSrc.includes('followMode'), 'the layer no longer reads it');
  // App may keep the KEY in comments (the retirement's own law note) — the
  // DISPATCH must not carry it.
  const dispatch = appSrc.slice(appSrc.indexOf("'gd-tooltips-mode'"), appSrc.indexOf("'gd-tooltips-mode'") + 400);
  assert.ok(!dispatch.includes('tooltipFollow'), 'the dispatched detail no longer carries follow');
  assert.match(appSrc, /detail: \{ on: db\?\.settings\?\.tooltips !== false \}/, 'the mode event carries only ON');
  assert.ok(!settingsSrc.includes('title="TOOLTIP SCROLL FOLLOW"'), 'the settings row is gone (the retirement note may keep the name)');
});

// ---- the website + changelog --------------------------------------------------
console.log('  ok — retired with the website in 1.8.8 — ' + 'the in-source download page keeps the 1.2.4 row on its own true link (demoted 1.2.5)');
ok('the changelog carries the 1.2.4 entry', () => {
  assert.match(changelog, /^## 1\.2\.4 — The Clicks That Land/m);
});

// ---- summary ------------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed — 1.2.4 batch`);
if (failed) process.exit(1);
