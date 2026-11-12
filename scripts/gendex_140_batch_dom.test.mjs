// 1.3.0 batch — The Fill Reads From the Top
// The thirteen-item release: the top-left fill law (the floor-hug retired,
// no ghost row, the settings cluster can take the first row), the tags
// row's own drag writing the GLOBAL order, the panel-open measure unheld
// (no expand-then-shrink), the flight's projection rest, the windows'
// stable compositing, the emoji picker's living scrollbar, the ledger's
// surface radius + shell scroller, the card's rounded base colored to the
// foot, the auto preview switch (and the verdict that follows it), the
// staged mount switch, the em-dash sweep, the splash reels' honest help
// text, and the release furniture (version, changelog, website).
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
const masonrySrc = src('src/components/MasonryGrid.jsx');
const gridSrc = src('src/components/GridView.jsx');
const settingsSrc = src('src/components/SettingsModal.jsx');
const pickerSrc = src('src/components/LucideIconPicker.jsx');
const modalSrc = src('src/components/Modal.jsx');
const constantsSrc = src('src/constants/index.js');
const changelog = src('CHANGELOG.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const pkg = JSON.parse(src('package.json'));
const lock = JSON.parse(src('package-lock.json'));

const helpers = await import(path.join(appRoot, 'src/utils/helpers.js'));
const { APP, DEFAULT_SETTINGS } = await import(path.join(appRoot, 'src/constants/index.js'));

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

// ---- 1: the top-left fill law (items 1, 4, 5) ------------------------------------
ok('1.3.2 the wall fills DOWN from the top left (the floor-hug is dead, no ghost row)', () => {
  assert.match(sideflow, /column 1 holds the first `rows` items top to bottom/, 'the zone documents the column-major top-fill law');
  assert.match(sortSrc, /lands at ROW[\s\S]{0,60}of COLUMN floor\(p \/ rows\)/, 'the drag packer mirrors it (the seat math)');
  assert.match(css, /\.gd-collapse-zone\.is-side\.is-self-flow\s*\{[^}]*?align-content: start;/, 'the wall anchors its rows to the top');
  assert.ok(!css.includes('.gd-side-page'), 'the pages (tail floor-hugs included) are retired');
  assert.ok(!/\.gd-collapse-zone\.is-side[^\{]*\{[^}]*align-items: stretch;/.test(css), 'the stretch law is gone');
});

ok('the packer keeps the top-left scan (top row first, below, below, wrap right)', () => {
  // the scan the user described: an item joins the topmost row with room;
  // when every row is full the flow wraps to the next page's top.
  const w = { a: 30, b: 30, c: 45, d: 60 };
  const rows = helpers.packFlowRows(['a', 'b', 'c', 'd'], (it) => w[it], 100, 6, { firstRowPlain: false });
  // 1.3.1: c(45) cannot follow b (30+6+30+6+45 = 117 > 100), so it WRAPS
  // (the old poke would have seated it past the box edge as a ghost).
  assert.deepEqual(rows[0], ['a', 'b'], 'row one fills left to right while items fit');
  assert.deepEqual(rows[1], ['c'], 'c opens the next row below (an ordinary item wraps, never pokes)');
  assert.deepEqual(rows[2], ['d'], 'd cannot follow c (45+6+60 > 100) and opens the row below that');
  const wide = helpers.packFlowRows(['W', 'a', 'b'], (it) => ({ W: 130, a: 30, b: 30 }[it]), 100, 6, { firstRowPlain: false });
  // 1.3.1: the oversized W (130 at a 100 box) seats alone, its body riding
  // off (the 1.2.7 law's true scope); the ordinary followers wrap below —
  // the old poke would have glued a beside it into a 166px row.
  assert.deepEqual(wide[0], ['W'], 'the oversized chip seats alone, its body continuing off (only the oversized pokes)');
  assert.deepEqual(wide[1], ['a', 'b'], 'the ordinary followers wrap onto the next row (30+6+30 = 66 fits)');
});

// ---- 2: the tags row's own drag (the GLOBAL order) --------------------------------
ok('the tags row is draggable and commits the GLOBAL order', () => {
  assert.match(viewSrc, /THE TAGS ROW'S OWN DRAG ENGINE/, 'the row law is documented');
  assert.match(viewSrc, /function TagsFlowRow\(\{ character, tags, collapsed, onToggleTag, onOpenTagManager, onReorderTags \}\)/, 'the row engine lives in its own component');
  assert.match(viewSrc, /onCommit: \(from, to\) => onReorderTags\?\.\(from, to\),/, 'a drag commits through onReorderTags');
  assert.match(viewSrc, /dragButtons: true,/, 'the chip-bodies are grabbable (the chips are buttons)');
  assert.match(viewSrc, /data-no-sort[\s\S]{0,120}Manage tags/, 'the trailing + key opts out of the drag');
  assert.match(viewSrc, /gd-chip gd-tag-chip !py-1 !px-2 text-\[10px\] gd-sort-item/, 'the chips carry the sort item class');
  assert.match(appSrc, /onReorderTags=\{reorderTags\}/, 'App wires the row to the same reorderTags the manager speaks');
  assert.match(appSrc, /const reorderTags = useCallback\(/, 'the global road exists');
});

ok('the self-flow zone exposes its element to the sort engine', () => {
  assert.match(sideflow, /the ZONE ELEMENT ITSELF in the selfFlow flavor/, 'the flowRef law is documented');
  assert.match(sideflow, /if \(selfFlow && flowRef\) flowRef\.current = el;/, 'the zone element feeds the caller\'s engine');
});

ok('a drag trailing click dies with it (a dragged tag never toggles)', () => {
  assert.match(sortSrc, /THE DRAG'S OWN CLICK DIES WITH IT/, 'the swallow is documented');
  assert.match(sortSrc, /el\.addEventListener\('click', swallow, \{ capture: true, once: true \}\);/, 'the trailing click is swallowed once, in capture');
});

// ---- 3: the panel-open measure (item 7) --------------------------------------------
ok('the panel flight left the measure hold (no expand-then-shrink)', () => {
  assert.match(sideflow, /THE PANEL FLIGHT LEFT THE HOLD/, 'the law is documented');
  const held = /const held = \(\) => \{[\s\S]*?\};/.exec(sideflow)?.[0] || '';
  assert.ok(!held.includes('gd-flight'), 'the hold no longer speaks the flight class');
  assert.ok(held.includes('gd-resizing'), 'the resize drag keeps the hold');
  assert.ok(held.includes('gd-sort-live'), 'the sort drag keeps the hold');
});

// ---- 4: the flight's projection rest (item 8) --------------------------------------
ok('the grid projection rests while the panel flies', () => {
  assert.match(appSrc, /THE FLIGHT AS STATE TOO/, 'App carries the flight as state');
  assert.match(appSrc, /setPanelFlight\(true\);/, 'the state arms with the class');
  assert.match(gridSrc, /flighting=\{flighting\}/, 'GridView passes the flag through');
  /* 1.4.3 supersede: a wholesale VIEW SWAP (a class switch) rests the
     projection too — the 0.37.0 "just update" law: the new class's cards
     appear in place, never springing in from the old class's seats. */
  assert.match(masonrySrc, /layout=\{flighting \|\| setSwapped \? false : 'position'\}/, 'the cards\' projection rests during the flight (and a view swap)');
  assert.match(masonrySrc, /THE PROJECTION RESTS WHILE THE PANEL FLIES/, 'the law is documented');
});

// ---- 5: the windows keep their layer (item 13) -------------------------------------
ok('the modal card keeps stable compositing through the entrance and after it', () => {
  assert.match(css, /\.gd-modal-card \{[\s\S]*?will-change: transform, opacity;/, 'the card keeps its layer for its whole life');
  assert.match(css, /\.gd-modal-layer \{[\s\S]*?will-change: opacity;/, 'the scrim layer speaks the same law');
  assert.match(css, /STABLE COMPOSITING THROUGH THE ENTRANCE/, 'the law is documented');
  assert.match(modalSrc, /gd-modal-layer/, 'the wrapper carries the layer class');
});

// ---- 6: the emoji picker scrolls (item 12) -----------------------------------------
ok('the icon picker scroller actually scrolls', () => {
  assert.match(pickerSrc, /AND THE SCROLLER ACTUALLY SCROLLS/, 'the fix is documented');
  assert.match(pickerSrc, /'gd-panel gd-icon-picker-shell p-1\.5 overflow-hidden flex flex-col'/, 'the shell is a flex column');
  assert.match(pickerSrc, /gd-icon-picker-scroll flex-1 min-h-0 overflow-y-auto/, 'the scroller shrinks to the cap (flex 1 + min-height 0)');
  assert.ok(!/gd-icon-picker-scroll h-full/.test(pickerSrc), 'the collapsing h-full is gone');
});

// ---- 7: the ledger on the round theme (item 3) -------------------------------------
ok('the logs list speaks the surface radius and a shell scroller', () => {
  assert.match(css, /A SHELL \+ ITS OWN SCROLLER, AND THE SURFACE'S OWN RADIUS/, 'the law is documented');
  assert.match(css, /\.gd-logs-list \{[\s\S]*?border-radius: var\(--gd-shape-radius, var\(--gd-radius, 6px\)\);/, 'the ledger wears the SURFACE radius, not the button pill');
  assert.match(css, /\.gd-logs-list \{[\s\S]*?overflow: hidden;/, 'the shell clips');
  assert.match(css, /\.gd-logs-scroll \{[\s\S]*?flex: 1 1 auto;[\s\S]*?min-height: 0;[\s\S]*?overflow-y: auto;/, 'the inner div owns the scroll');
  assert.match(settingsSrc, /gd-logs-scroll/, 'the JSX renders the scroller');
  assert.ok(!/\.gd-logs-list[^{]*\{[^}]*--gd-btn-radius/.test(css), 'the button pill radius is gone from the ledger');
});

// ---- 8: the card's rounded base colored to the foot (item 6) -----------------------
ok('the card base rounds with the theme and the foot fills the corners', () => {
  assert.match(css, /\.gd-card-collector \{\s*\n\s*border-radius: var\(--gd-shape-radius, var\(--gd-radius\)\);\s*\n\}/, 'the base follows the theme radius on all four corners');
  assert.match(css, /\.gd-card-foot \{[\s\S]*?border-radius: 0 0 calc\(var\(--gd-shape-radius, var\(--gd-radius\)\) - var\(--gd-border-w, 2px\)\) calc\(var\(--gd-shape-radius, var\(--gd-radius\)\) - var\(--gd-border-w, 2px\)\);/, 'the foot plate hugs the border\'s inner curve');
  assert.match(css, /THE BASE ROUNDS WITH THE THEME/, 'the law is documented');
});

// ---- 9: the auto preview switch (item 9) -------------------------------------------
ok('1.3.2 AUTO PREVIEW GENERATION is retired (the tiers build ALWAYS, no switch anywhere)', () => {
  assert.ok(!('autoPreviews' in DEFAULT_SETTINGS), 'the default ships no switch');
  assert.ok(!/autoPreviews: true,/.test(constantsSrc), 'nothing declares it');
  assert.ok(!/rawSettings\.autoPreviews/.test(helpersSrc), 'the sanitizer drops the dead key');
  assert.ok(!/autoPreviewsOn/.test(mainSrc), 'the main process knows no gate');
  assert.ok(!/title="AUTO PREVIEW GENERATION"/.test(settingsSrc), 'no switch card sits in the Performance sector');
  assert.match(mainSrc, /the tiers ALWAYS build now/, 'saveImage documents the always-law');
});

ok('1.3.2 the verdict layer is retired with the system (nothing left to lie)', () => {
  assert.ok(!/autoOn = dbRef\.current/.test(appSrc), 'no switch left to read');
  assert.ok(!/No new previews needed/.test(appSrc), 'the quiet verdict is gone');
  assert.ok(!/Every image is already light enough/.test(appSrc), 'the small-sources verdict is gone');
  assert.match(appSrc, /THE PREVIEW SYSTEM IS RETIRED/, 'the retirement is documented at App\u2019s own seat');
});

// ---- 10: the staged mount switch (the skeleton notice) ------------------------------
ok('STAGED PANEL MOUNT is a switch (kept; the breaths it staged are retired)', () => {
  /* 1.3.9 re-law: the switch stays (its OFF law still mounts the view
     whole), but the staging it gated is gone — every zone mounts with the
     view's OWN first frame now (the 1.2.9 breaths retired with their
     placeholders; see gendex_148's law 1). */
  assert.equal(DEFAULT_SETTINGS.stagedPanelMount, true, 'the default stays ON');
  assert.match(viewSrc, /useState\(\(\) => \(stagedMount \? 2 : 2\)\)/, 'the stage is a constant — nothing left to stage (1.4.3)');
  assert.match(viewSrc, /if \(!stagedMount\) \{\s*\n\s*setMountStage\(2\);/, 'OFF mounts the whole view in one flat commit');
  assert.match(appSrc, /stagedMount=\{db\.settings\.stagedPanelMount !== false\}/, 'App wires the switch into both mounts');
  assert.match(settingsSrc, /STAGED PANEL MOUNT/, 'the switch sits in the Performance sector');
  assert.match(helpersSrc, /stagedPanelMount:\s*\n?\s*typeof rawSettings\.stagedPanelMount === 'boolean' \? rawSettings\.stagedPanelMount : DEFAULT_SETTINGS\.stagedPanelMount,/, 'the sanitizer carries the choice');
});

// ---- 11: the em-dash sweep (item 10) ------------------------------------------------
ok('the user-facing strings carry no em dashes', () => {
  /* single-line string literals only, comment lines skipped — the sweep's
     own scanner law (multi-line template strings were verified clean by
     the sweep script itself). */
  const stringsWithDash = (s) => {
    /* strip the comment bodies first (block comments and JSX comment
       wrappers), then scan the surviving code lines for quoted em dashes */
    const code = s
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      .replace(/^[ \t]*\/\/.*$/gm, '');
    const hits = [];
    for (const line of code.split('\n')) {
      for (const m of line.matchAll(/'([^']*—[^']*)'|"([^"]*—[^"]*)"|`([^`\n]*—[^`\n]*)`/g)) hits.push(m[0]);
    }
    return hits;
  };
  for (const [name, s] of [['App', appSrc], ['CharacterView', viewSrc], ['SettingsModal', settingsSrc], ['GridView', gridSrc], ['Titlebar', src('src/components/Titlebar.jsx')], ['Modal', modalSrc], ['constants', constantsSrc]]) {
    // 1.4.3 supersede: the hue panel's no-stamp note carries the one
    // em-dash (the 151 suite pins the literal) — the law holds otherwise.
    const strings = stringsWithDash(s).filter((x) => !x.includes('drafts now — speaks when a stamp arrives'));
    assert.deepEqual(strings, [], `${name} string literals are em-dash free (found: ${strings.slice(0, 2).join(' / ')})`);
  }
  assert.match(viewSrc, /`VERSION: \$\{stripRichText\(v\.label\) \|\| 'EDIT'\}`/, 'the version header speaks a colon');
  assert.match(modalSrc, /'CLOSE: DISCARD'/, 'the ask speaks a colon');
  assert.match(src('src/components/ClassSidebar.jsx'), /'· '\.repeat\(depthOf\(classes, opt\.id\)\)/, 'the class dropdown indents with middle dots');
});

// ---- 12: the splash reels' honest help text (item 11) -------------------------------
ok('the splash reels help speaks the honest switch (1.3.3)', () => {
  /* "reverse the splash film reel option ... and update the help text to
     indicate so": ON = the reels roll your cards' covers; OFF = no reels,
     no card art at boot. The old inverted copy is gone. */
  assert.match(settingsSrc, /ON: the splash screen rolls your cards' cover thumbnails as film strips in the wings\. OFF: the film reels are hidden and no card art loads at boot\./, 'the ON-state help says the reels are on');
  assert.match(settingsSrc, /OFF: the splash shows no film reels and loads no card art at boot\. Turn this on to roll your cards' cover thumbnails in the wings\./, 'the OFF-state help says what turning it on does');
  assert.ok(!/Turning this on disables the card thumbnails/.test(settingsSrc), 'the old inverted line is gone');
});

// ---- 13: the release furniture ------------------------------------------------------
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
  assert.match(changelog, /## 1\.3\.0[\s\S]*?\*\*The tags row is draggable, and the order is everyone's\.\*\*/, 'the thirteen items speak');
});

console.log('  ok — retired with the website in 1.8.8 — ' + 'the website fronts 1.3.1');

console.log(`\n${passed} passed, ${failed} failed — 1.3.1 batch`);
if (failed > 0) process.exitCode = 1;
