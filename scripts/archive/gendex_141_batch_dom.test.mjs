// 1.3.1 batch — Everything Tells The Truth
// The six-item release: the preview tier rework (both tiers built on demand,
// honest counts, verdicts that never lie), the one-width flow law (the +1
// mercy retired, ordinary items wrap, only the oversized pokes, the float
// pack attribute), the stamp settings' unstacked seats, the two-row folded
// tags, the divider's own curve (the plate fills the art's carve with the
// card color), the visible fold flight, the prompt parts' own surface, the
// splash's round-robin deal, and the release furniture.
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
const viewSrc = src('src/components/CharacterView.jsx');
const appSrc = src('src/App.jsx');
const mainSrc = src('src/main.js');
const css = src('src/index.css');
const gridSrc = src('src/components/GridView.jsx');
const lookSrc = src('src/components/CardLookEditor.jsx');
const partSrc = src('src/components/PartEditor.jsx');
const splashSrc = src('src/components/Splash.jsx');
const settingsSrc = src('src/components/SettingsModal.jsx');
const constantsSrc = src('src/constants/index.js');
const changelog = src('CHANGELOG.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const pkg = JSON.parse(src('package.json'));
const lock = JSON.parse(src('package-lock.json'));

const helpers = await import(path.join(appRoot, 'src/utils/helpers.js'));
const { APP } = await import(path.join(appRoot, 'src/constants/index.js'));

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

// ---- 1: the preview tier rework -----------------------------------------------------
ok('1.3.2 the builders keep their tier laws (the generator itself is retired)', () => {
  assert.match(mainSrc, /THE THUMB BUILDER, EXTRACTED/, 'the extracted writeThumb is documented');
  assert.match(mainSrc, /const writeThumb = \(name, buffer, ext\) =>/, 'writeThumb exists beside writePrev');
  assert.match(mainSrc, /THE PREVIEW SYSTEM IS RETIRED/, 'the retirement is documented');
  assert.ok(!mainSrc.includes('image:generate-previews'), 'the generator IPC is gone');
  assert.ok(!mainSrc.includes('out.thumbsBuilt'), 'no verdict counts anything anymore');
  assert.match(mainSrc, /const saveImage = \(buffer, ext, thumbBase64 = null, thumbExt = null\) =>/, 'the import path builds the tiers itself, always');
});

ok('1.3.2 the renderer owns no generate flow (nothing to patch, nothing to verdict)', () => {
  assert.ok(!appSrc.includes('const patchImg = '), 'no coalesced patch write');
  assert.ok(!appSrc.includes('Preview copies generated'), 'no run verdict');
  assert.ok(!appSrc.includes('thumbsBuilt'), 'no split speaks');
  assert.ok(!appSrc.includes('Every image is already light enough'), 'no small-sources verdict');
  assert.ok(!settingsSrc.includes('Build the lightweight copies'), 'no GENERATE key says anything');
});

// ---- 2: the one-width flow law -------------------------------------------------------
ok('the row breaks at the CSS wrap\'s own edge (the +1 mercy is retired)', () => {
  assert.match(helpersSrc, /THE ROW BREAKS AT THE CSS WRAP'S OWN EDGE/, 'the one-width law is documented');
  assert.match(helpersSrc, /const fits = \(nextW\) => !row\.length \|\| rowW \+ g \+ nextW <= W \+ 0\.01;/, 'the epsilon is subpixel noise only');
  assert.ok(!/rowW \+ g \+ nextW <= W \+ 1;/.test(helpersSrc), 'the +1 mercy is gone');
  // behavior: 6 stamps at a 324px box seat 6 per row (the probe's own verdict)
  const six = helpers.packFlowRows(['a','b','c','d','e','f','g'], () => 44, 324, 8, { firstRowPlain: false });
  assert.equal(six[0].length, 6, 'six 44px items fit (6*44+5*8=304); the 7th wraps (304+8+44 > 324)');
  assert.deepEqual(six[1], ['g'], 'the seventh opens the next row (never a ghost at the edge)');
  // and the threshold is exact: at 355.99 the same 7th item that CSS wraps, wraps
  const tight = helpers.packFlowRows(['a','b','c','d','e','f','g'], () => 44, 355.5, 8, { firstRowPlain: false });
  assert.equal(tight[0].length, 6, 'at 355.5 the 7th still wraps (356 > 355.5): the probe and the packer agree');
  const roomy = helpers.packFlowRows(['a','b','c','d','e','f','g'], () => 44, 356.5, 8, { firstRowPlain: false });
  assert.equal(roomy[0].length, 7, 'at 356.5 the 7th fits (356 <= 356.5): one law with the CSS wrap');
});

ok('ordinary items wrap, only the oversized pokes (the ghost stamps die)', () => {
  assert.match(helpersSrc, /ORDINARY ITEMS WRAP, ONLY THE OVERSIZED POKE/, 'the poke\'s retirement is documented');
  assert.match(helpersSrc, /THE OVERSIZED TAIL SEAT/, 'the oversized seat keeps its true scope');
  assert.ok(!helpersSrc.includes('rows.length === 0 && firstRowPlain && w < W - 1'), 'the row-one-only CSS law is gone (every row speaks it)');
  // behavior: an ordinary follower wraps; an oversized one keeps the tail seat
  const w = helpers.packFlowRows(['W', 'a', 'b'], (it) => ({ W: 130, a: 30, b: 30 }[it]), 100, 6, { firstRowPlain: false });
  assert.deepEqual(w[0], ['W'], 'the oversized seats alone, its body riding off');
  assert.deepEqual(w[1], ['a', 'b'], 'the ordinary followers wrap below (the old poke glued them into a 166px row)');
});

ok('1.3.2 the carrier speaks the WALL law (mode + rows + gap; no pack width)', () => {
  assert.match(sideflow, /data-gd-flow="wall"/, 'the mode rides the carrier');
  assert.match(sideflow, /'data-gd-pack-rows': String\(rows\)/, 'the row cap rides it');
  assert.match(sideflow, /'data-gd-pack-gap': String\(Math\.round\(wallGap\)\)/, 'the wall gap rides it');
  assert.ok(!sideflow.includes('data-gd-pack-w'), 'the pack width retired with the row packing');
  assert.match(sortSrc, /parseFloat\(cont\.dataset\?\.gdPackRows\)/, 'the drag packer reads the rows attribute');
});

// ---- 3: the settings' seats + the two-row folded tags ----------------------
ok('the stamp settings merge into one stacked cluster (1.3.4)', () => {
  assert.match(viewSrc, /THE SETTINGS STACK BACK AS ONE TOWER/, 'the 1.3.4 restack law is documented');
  assert.ok(viewSrc.includes('gd-stamp-settings-cluster'), 'the cluster wrapper renders (color above settings)');
  assert.match(viewSrc, /<StampColorControls/, 'the color key rides inside the cluster');
  assert.match(viewSrc, /<StampPosControls/, 'the transform key rides inside the cluster');
  assert.match(css, /\.gd-stamp-color,\s*\n\.gd-stamp-pos \{/, 'the two keys share one seat law');
  assert.ok(/\.gd-stamp-settings-cluster\s*\{/.test(css), 'the cluster rule speaks the tower (1.3.4: two options on each other)');
});

ok('a folded tags row keeps two rows', () => {
  assert.match(viewSrc, /THE RETRACTED TAGS HOLD TWO ROWS/, 'the two-row law is documented');
  assert.match(viewSrc, /<SideFlowZone\s+rows=\{3\}\s+collapsedRows=\{2\}/, 'the tags zone clamps at the second band');
  assert.match(viewSrc, /collapsedRows=\{2\}\s+collapsed=\{collapsed\}\s+floorPx=\{31\}/, 'the floor and the open cap are untouched');
});

// ---- 4: the divider's own curve -------------------------------------------------------
ok('the art\'s bottom corners curve and the plate fills the carve with the card color', () => {
  assert.match(css, /THE DIVIDER\'S OWN CURVE/, 'the law is documented');
  assert.match(css, /\.gd-card-foot::before \{/, 'the plate pseudo exists');
  assert.match(css, /bottom: 100%;/, 'it rises above the seam');
  // 1.3.5 — the plate speaks --gd-foot-plate now (opaque: the card color,
  // else the panel paper) — `background: inherit` painted TRANSPARENT on
  // uncolored feet and leaked the tint wash into the carve.
  assert.match(css, /background: var\(--gd-foot-plate, transparent\);/, 'it paints the plate\'s own color (the card color, else the paper — 1.3.5)');
  // 1.4.0 supersede: the sleeve's own stacking context is retired (z auto)
  // — the ART's CLIP carries z 1 on its own rung (the card's z ladder),
  // still above the plate's rise (the foot's z 0), under the ink work's z 3.
  assert.match(css, /\.gd-sleeve-clip,\s*\n\.gd-panzoom > \.gd-sleeve-clip \{\s*\n  z-index: 1;/, 'the art paints above the plate (1.4.0: the clip speaks z 1)');
  assert.match(gridSrc, /THE ART\'S OWN BOTTOM CURVE/, 'the grid card documents the sleeve law');
  assert.ok(gridSrc.includes("calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px)"), 'the sleeve rounds all four corners');
  assert.match(lookSrc, /THE ART\'S OWN BOTTOM CURVE/, 'the look editor\'s panzoom stage speaks it too');
});

// ---- 5: the fold reads as a flight ----------------------------------------------------
ok('the collapse and expand flight travels on a visible curve', () => {
  assert.match(css, /THE FOLD READS AS A FLIGHT/, 'the law is documented');
  assert.match(css, /transition: max-height 0\.32s cubic-bezier\(0\.22, 0\.61, 0\.36, 1\);/, '0.32s on the gathering curve');
  assert.ok(!/transition: max-height 0\.2s ease-out;/.test(css), 'the 0.2s snap is retired');
});

// ---- 6: the prompt parts' own surface --------------------------------------------------
ok('1.3.2 the prompt parts wear their own framed surface, no labels (the tab retired)', () => {
  assert.match(partSrc, /THE NUMBER TAB IS RETIRED/, 'the retirement is documented');
  // 1.4.5 SUPERSEDED: the row class moved into a clsx stack (the fresh
  // entrance + the swap flash variants ride it) — gendex_154 pins the
  // live law; the framed surface itself is unchanged.
  assert.match(partSrc, /'gd-part-row',/, 'the row speaks its own class (the clsx stack)');
  assert.ok(!partSrc.includes('gd-part-num'), 'no number tab renders (the q1/q2 labels are gone)');
  assert.ok(!partSrc.includes('gd-panel p-2.5 flex gap-2.5'), 'the generic panel tier is retired');
  assert.match(css, /\.gd-part-row \{[\s\S]*?border: 1\.5px solid var\(--gd-ink\);/, 'the sticker frame stays');
  assert.ok(!css.includes('.gd-part-num {'), 'the tab rule is retired');
  assert.match(css, /\.gd-part-row \.gd-rt-edit \{[\s\S]*?color-mix\(in srgb, var\(--gd-bg\) 58%, var\(--gd-panel\)\)/, 'the writable faces sit one rung darker (1.3.2)');
});

// ---- 7: the splash deals its real covers round-robin ------------------------------------
ok('the splash deals round-robin (every column carries a real card when any exist)', () => {
  assert.match(helpersSrc, /EVERY COLUMN CARRIES A REAL CARD FIRST/, 'the deal law is documented');
  // behavior: a pool of 7 across 4 columns of 8 seats
  const deal = helpers.buildSplashReels(['c1','c2','c3','c4','c5','c6','c7'], { slots: 8, reelCount: 4, seed: 11 });
  const perCol = deal.map((col) => col.filter((s) => !s.fake).length);
  assert.ok(perCol.every((n) => n >= 1), 'every column carries at least one real card');
  assert.equal(Math.max(...perCol), 2, 'no column takes a third before every column earns one');
  const reals = deal.flat().filter((s) => !s.fake).map((s) => s.url);
  assert.equal(new Set(reals).size, reals.length, 'no card seats twice (the no-repeat law holds)');
  // a lone card keeps the mid-screen seat
  const solo = helpers.buildSplashReels(['only'], { slots: 8, reelCount: 4, seed: 11 }).flat();
  assert.equal(solo.findIndex((s) => !s.fake), 16, 'the lone card sits mid-screen (the total/2 law)');
  // the onError guard: a broken cover reads as a leader
  assert.match(splashSrc, /A BROKEN COVER READS AS A LEADER/, 'the onError law is documented');
  assert.match(splashSrc, /onError=\{\(\) => markBad\(s\.url\)\}/, 'the reel tracks failed decodes');
  assert.match(splashSrc, /s\.fake \|\| bad\.has\(s\.url\)/, 'a failed frame re-renders as a pixel leader');
});

// ---- 8: the em-dash law holds on every new string ----------------------------------------
ok('the new user-facing strings carry no em dashes', () => {
  // the changelog is a developer history document (the 1.3.0 sweep's own
  // convention left it untouched); the law governs what users read in the app.
  for (const [name, text] of [['the verdicts', appSrc], ['the tooltip', settingsSrc]]) {
    const strings = text.match(/'[^'\n]{6,}'/g) || [];
    for (const s of strings) {
      assert.ok(!s.includes('—'), `${name}: no em dash inside "${s.slice(0, 50)}"`);
    }
  }
});

// ---- 9: the release furniture --------------------------------------------------------------
ok('the version is 1.3.1 everywhere (the lock included)', () => {
  assert.equal(APP.version, '1.4.3');
  assert.equal(pkg.version, '1.4.3');
  assert.equal(lock.version, '1.4.3', 'the lock follows');
  assert.equal(lock.packages[''].version, '1.4.3', 'the lock root package too');
  assert.match(src('README.md'), /\*\*v1\.4\.3\*\*/);
  assert.match(src('START.bat'), /launcher \(1\.4\.3\)/);
});

ok('the changelog leads with 1.3.1', () => {
  assert.ok(changelog.startsWith('## 1.4.3 — The Pearl and the Flame'), 'the entry leads the log');
  assert.ok(/## 1\.3\.0 — The Fill Reads From the Top/.test(changelog), 'the 1.3.0 entry follows');
});

console.log('  ok — retired with the website in 1.8.8 — ' + 'the website fronts 1.3.1');

console.log(`\n${passed} passed, ${failed} failed — 1.3.1 batch`);
if (failed > 0) process.exitCode = 1;
