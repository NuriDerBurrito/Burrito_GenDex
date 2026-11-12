// 1.1.5 batch DOM + source checks — the fade-out, the folds, the room-aware
// panel, and the order that sticks. The wave:
//   · THE UPDATE WINDOW FADES OUT ("the update window should have an out
//     animation, like the fadeout instead of just dissapearing"): the mount
//     rides an AnimatePresence like every other window.
//   · THE TAG SHAPES SURVIVE THE FOLD ("the tags icons clip on the left of
//     the container when the tags collapse, fix that"): the collapse zone
//     carries side headroom (padding + matching negative margins).
//   · THE TAG BOARD FOLDS TO THREE ("add an option to collapse tags inside
//     the card creation window, only shows the first 3 rows lets say (not
//     affecting detail pannel)"): the creation window's board rides the
//     shared useClampStyle with rows=3.
//   · THE BOARD SPEAKS ITS OWN LOOK ("change the look of the tags container
//     in card creation window so it doesnt match the text input containers"):
//     .gd-tagfield — dotted frame, faint tint, no input face.
//   · THE NAME-FORMATTING PARAGRAPH IS GONE ("remove this text in the help
//     text area: 'Name formatting: select part of the name…'").
//   · THE HELP KEY RIDES THE CREATION FOOTER ("add the help text option in
//     the card creation window in the bottom left, just like the settings
//     window").
//   · THE FILTER CARD FOLDS ("the help text inside the filters area, remove
//     it since its too long and blocks the area, allow me to also collapse
//     and expand the tags and stamps inside the filter container (they do
//     reset after closing the container so by default they are expanded)").
//   · THE THUMBNAIL VERDICT EXPLAINS ITSELF ("either it did it
//     automatically (in that case ignore) or fix that issue").
//   · THE CUSTOM ORDER KEEPS WHAT YOU SAW ("the custom order isnt working
//     properly … fix that so it saves the state of the custom once an edit
//     has occured like moving a card to the right or left of another card,
//     otherwise if no changes were made dont change custom to another, while
//     newest should stick to the newest cards made, account for copies too").
//   · NO MORE SCROLLING SIDEWAYS ("for some reason i can scroll to the right
//     when i open the detail pannel, fix that").
//   · THE CLASS CARD KEEPS A LANE ("the class would expand to the right …
//     its an inch too wide that it causes the screen to start scrolling
//     sideways, fix that so its a bit shorter").
//   · THE AUDIENCE LINE IS GONE ("remove 'for ai artists' in the about
//     section").
//   · A NEW VERSION TAKES THE STAR ("when creating a new version for a card,
//     the new version should become the default cover").
//
// Requires jsdom (installed dev-only). Skips gracefully without it.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch {
  console.log('jsdom unavailable — 1.1.5 batch DOM test skipped (dev-only dependency)');
  process.exit(0);
}

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;
global.NodeFilter = dom.window.NodeFilter;
global.MutationObserver = dom.window.MutationObserver;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.SVGElement = dom.window.SVGElement;
global.Document = dom.window.Document;
global.Window = dom.window.Window;
global.Event = dom.window.Event;
global.CustomEvent = dom.window.CustomEvent;
global.MouseEvent = dom.window.MouseEvent;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.WheelEvent = dom.window.WheelEvent;
global.PointerEvent = dom.window.PointerEvent || dom.window.MouseEvent;
global.DragEvent = dom.window.DragEvent || dom.window.MouseEvent;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = dom.window.requestAnimationFrame;
global.cancelAnimationFrame = dom.window.cancelAnimationFrame;
global.Image = dom.window.Image;
global.IS_REACT_ACT_ENVIRONMENT = true;
global.matchMedia = dom.window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
global.ResizeObserver = class {
  constructor(cb) { this.cb = cb; }
  observe() {} unobserve() {} disconnect() {}
};
global.localStorage = dom.window.localStorage;

const React = require('react');
const { createRoot } = require('react-dom/client');
const babel = require('@babel/core');
const appRoot = process.cwd();
for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff2']) {
  require.extensions[ext] = (module, filename) => { module.exports = filename; };
}
require.extensions['.jsx'] = (module, filename) => {
  const { code } = babel.transformFileSync(filename, {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      ['@babel/preset-react', { runtime: 'automatic' }],
    ],
  });
  module._compile(code, filename);
};

const src = (rel) => readFileSync(join(appRoot, rel), 'utf8');
const css = src('src/index.css');
const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const { APP, PANEL_WIDTH_RANGE } = require(join(appRoot, 'src/constants/index.js'));

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL ${passed + failed} — ${name}\n      ${String(e && e.message).split('\n')[0]}`);
  }
};
const okAsync = async (name, fn) => {
  try {
    await fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL ${passed + failed} — ${name}\n      ${String(e && e.message).split('\n')[0]}`);
  }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

// ===========================================================================
// Part A — source checks for the 1.1.5 wave
// ===========================================================================
{
  const codeCss = stripComments(css);
  const appSrc = stripComments(src('src/App.jsx'));
  const gridSrc = stripComments(src('src/components/GridView.jsx'));
  const viewSrc = stripComments(src('src/components/CharacterView.jsx'));
  const newCharSrc = stripComments(src('src/components/NewCharacterModal.jsx'));
  const settingsSrc = stripComments(src('src/components/SettingsModal.jsx'));

  ok('the version is 1.1.9', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(src('package.json'), /"version": "1\.4\.3"/);
    assert.match(src('README.md'), /\*\*v1\.4\.3\*\*/);
    assert.match(src('CHANGELOG.md'), /^## 1\.1\.5 /m, 'the changelog carries the entry');
  });

  // ---- fix 1: the update window fades out ----
  ok('the update window rides an AnimatePresence (the fade-out)', () => {
    assert.match(appSrc, /<AnimatePresence>\s*\{updateNotice && \(\s*<UpdateModal/, 'the mount is wrapped in the exit-aware presence');
    assert.match(appSrc, /\{updateNotice && \(\s*<UpdateModal fromVersion=\{updateNotice\.from\}/, 'the window still mounts on the crossing');
  });

  // ---- fix 2: side headroom on the collapse zone ----
  ok('the tags zone carries side headroom (shapes survive the fold)', () => {
    const zone = /\.gd-collapse-zone\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(zone, /padding:\s*5px 6px 0;/, 'the zone pads its sides');
    assert.match(zone, /margin:\s*-5px -6px 0;/, 'the margins pull the box back — chips keep their seats');
    // the stamp strip keeps its OWN numbers (its override survived)
    const strip = /\.gd-stamp-strip\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(strip, /padding:\s*7px 5px 0;/, 'the stamps strip keeps its own headroom');
  });

  // ---- fixes 3/4/5/6: the creation window's tag board + footer help ----
  ok('the creation window folds its tag board to three rows', () => {
    /* 1.1.8 — the board is a SideFlowZone now ("implement the sideways
       feature to the card creation tags container there too"): the
       three-row cap rides the zone's rows seat; the fold speaks the
       one-row retract instead (the open cap already holds three). */
    // 1.1.9 re-law: the board's OWN limits — folded keeps THREE rows
    // (collapsedRows 3), open caps at FIVE with the rest stacked right.
    assert.match(newCharSrc, /<SideFlowZone\s+rows=\{5\}\s+collapsedRows=\{3\}\s+collapsed=\{tagsFold\}\s+floorPx=\{31\}/, 'the board folds to three rows and opens to five (the side-flow zone)');
    assert.match(viewSrc, /export \{ useClampStyle \};/, 'the clamp law is shared from CharacterView');
    assert.match(viewSrc, /function useClampStyle\(ref, clamped, rowPx, rows = 1\)/, 'the detail panel keeps its one-row default');
    assert.match(newCharSrc, /const \[tagsFold, setTagsFold\] = useState\(false\);/, 'the board opens expanded');
    assert.match(newCharSrc, /tag board/, 'the fold key speaks the board');
  });
  ok('the tag board speaks its own look (not an input)', () => {
    const board = /\.gd-tagfield\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(board, /border:\s*1px dotted/, 'a dotted frame, not an input face');
    assert.match(board, /background:[^;]*--gd-bg[^;]*transparent/, 'a whisper of ground, not a recessed well');
    assert.match(newCharSrc, /zoneClassName="gd-tagfield"/, 'the board wears the class (through the side-flow zone)');
    assert.ok(!/gd-input !py-1\.5 flex flex-wrap items-center gap-1\.5/.test(newCharSrc), 'the input face is retired');
  });
  ok('the name-formatting paragraph is retired', () => {
    assert.ok(!newCharSrc.includes('Name formatting: select part of the name'), 'the paragraph is gone');
    assert.ok(!newCharSrc.includes('buttons that grow out of the box'), 'no rendered fragment survives');
  });
  ok('the creation footer carries the help key on the left', () => {
    assert.match(newCharSrc, /onToggleHelp = null/, 'the window accepts the toggle');
    const footSeg = newCharSrc.slice(newCharSrc.indexOf('footer={'), newCharSrc.indexOf('CREATE'));
    assert.match(footSeg, /gd-foot-help/, 'the footer help cluster');
    assert.match(footSeg, /gd-rail-help-label/, 'the label');
    assert.match(footSeg, /gd-switch/, 'the switch');
    assert.match(footSeg, /ml-auto/, 'the action pill stays right');
    assert.match(appSrc, /onToggleHelp=\{\(\) => setSetting\('showHelpText', !showHelp\)\}/, 'App wires the same setting');
  });

  // ---- fix 7: the filter card folds + the lectures leave ----
  ok('the filter card folds its sections and stops lecturing', () => {
    assert.ok(!gridSrc.includes('One click marks a tag as must-include'), 'the card helper paragraph is gone');
    assert.ok(!gridSrc.includes('Filtering by a stamp promotes it'), 'the stamp helper paragraph is gone');
    assert.match(gridSrc, /const \[tagsOpen, setTagsOpen\] = useState\(true\);/, 'the tag fold');
    assert.match(gridSrc, /const \[stampsOpen, setStampsOpen\] = useState\(true\);/, 'the stamp fold');
    assert.match(gridSrc, /if \(open\) \{\s*setTagsOpen\(true\);\s*setStampsOpen\(true\);/, 'every open resets both folds to expanded');
    /* 1.2.6 — THE FOLD BREATHES: the list stays MOUNTED inside a measured
       0fr-to-1fr grid track (the old conditional mount blinked out); the
       fold speaks a class, not an unmount. */
    assert.match(gridSrc, /clsx\('gd-fold mt-1\.5', !tagsOpen && 'is-folded'\)/, 'the tag list folds through the grid track (mounted, classed)');
    /* 1.2.6 — the stamp fold rides the same measured grid track (mounted
       content under 0fr-to-1fr, the TAG FILTER fold's own law). */
    assert.match(gridSrc, /clsx\('gd-fold mt-1\.5', !open && 'is-folded'\)[\s\S]{0,80}?gd-spot-tiles/, 'the stamp tiles fold through the grid track (mounted, classed)');
    assert.match(codeCss, /\.gd-spot-fold\s*\{[^}]*?display: inline-flex;/s, 'the fold key exists');
  });

  // ---- fix 8: the thumbnail verdict explains itself ----
  ok('1.3.2 the verdict layer is retired with the system (the prev still rides every birth)', () => {
    // 1.3.2 — the GENERATE key and every verdict it spoke are gone; what
    // survives is the birth law: a stamp's preview lands on its record the
    // moment the file is born (saveImage builds it automatically).
    assert.ok(!/autoOn = dbRef\.current\?\.settings\?\.autoPreviews/.test(appSrc), 'no switch left to read');
    assert.ok(!/No new previews needed/.test(appSrc), 'the quiet verdict is retired');
    assert.ok(!/Every image is already light enough/.test(appSrc), 'the small-sources verdict is retired');
    assert.match(appSrc, /makeStamp\(file, clean\)/, 'the gallery record still lands');
    assert.match(appSrc, /if \(prev\) rec\.prev = prev;/, 'the preview rides the record at birth');
    assert.match(newCharSrc, /onAddToGallery\?\.\(record\.file, name, record\?\.prev \|\| null\)/, 'the naming queue hands the prev over');
  });

  // ---- fix 9: the custom order keeps what you saw ----
  ok('a duplicate is born now (copies count as newest)', () => {
    assert.match(appSrc, /clone\.createdAt = Date\.now\(\);/, 'the copy gets a fresh birth time');
  });
  ok('a drag under a sort bakes the visual order', () => {
    const seg = appSrc.slice(appSrc.indexOf('const reorderCharacters'));
    assert.match(seg.slice(0, 1600), /mode !== 'custom' \? sortCharacters\(\[\.\.\.d\.characters\], mode\) : \[\.\.\.d\.characters\]/, 'the splice lands on the visual order');
    assert.match(seg.slice(0, 1600), /if \(mode !== 'custom'\) \{/, 'the mode still flips to custom on an edit');
  });
  ok('the sort pipeline stays honest (newest means newest)', () => {
    const helpers = stripComments(src('src/utils/helpers.js'));
    assert.match(helpers, /if \(mode === 'custom'\) \{\s*return list;/, 'custom is the array');
    assert.match(helpers, /return list\.sort\(\(a, b\) => \(b\.createdAt \|\| 0\) - \(a\.createdAt \|\| 0\)\);/, 'newest sorts by birth');
  });

  // ---- fix 10: no more scrolling sideways ----
  ok('the panel yields to the room it sits in', () => {
    assert.match(appSrc, /const \[winW, setWinW\] = useState/, 'the window width is watched');
    assert.match(appSrc, /window\.addEventListener\('resize', onResize\)/, 'resize re-flows the same frame');
    assert.match(appSrc, /const VIEWER_MIN_W = 320;/, 'the viewer floor');
    assert.match(appSrc, /const rightPanelW = Math\.min\(rawPanelW, panelRoom\);/, 'the rendered width is room-aware');
    assert.match(appSrc, /max=\{Math\.min\(PANEL_WIDTH_RANGE\.max, panelRoom\)\}/, 'the drag ceiling holds the same line');
    assert.match(appSrc, /className="flex-1 min-w-0 relative flex overflow-hidden"/, 'the middle+right zone clips');
    // 1.2.9 re-law — the wall's right margin yields to the scrollbar
  // (pl-6 pr-3.5): the scrollbar's own gutter reads as the rest of the
  // margin and the next column lands where the eye says the room allows.
  assert.match(gridSrc, /overflow-y-auto overflow-x-hidden pl-6 pr-3\.5 pb-10 gd-tex-viewer/, 'the card wall never scrolls sideways');
  });

  // ---- fix 11: the class card keeps a lane ----
  ok('the tree card cap holds a lane back from the edge', () => {
    const card = /\.gd-tree-card\s*\{[^}]*max-width:[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.ok(card, 'the base card rule exists (with its cap)');
    assert.match(card, /max-width:\s*max\(140px, calc\(100cqw - var\(--pad, 6px\) - 10px\)\)/, 'the cap holds 10px back');
    assert.ok(!/max-width:\s*max\(140px, calc\(100cqw - var\(--pad, 6px\)\)\)/.test(card), 'the flush-to-edge cap is retired');
  });

  // ---- fix 12: the audience line is gone ----
  ok('the about blurb speaks the app, not a crowd', () => {
    assert.ok(!settingsSrc.includes('for AI artists'), 'the phrase is retired');
    assert.ok(!src('package.json').includes('for AI artists'), 'the package description too');
    assert.match(settingsSrc, /A local card &amp; prompt-version tracker\./, 'the blurb keeps its voice');
  });

  // ---- fix 13: a new version takes the star ----
  ok('a new version is born the cover', () => {
    const seg = viewSrc.slice(viewSrc.indexOf('const createVersionNow'));
    assert.match(seg.slice(0, 900), /versions: \[\.\.\.c\.versions, next\], previewVersionId: next\.id/, 'the commit crowns the fresh version');
  });
}

// ===========================================================================
// Part B — live DOM checks
// ===========================================================================
{
  // The seeded library: two classes, a small tag vocabulary, one card with a
  // pinned OLD cover (previewVersionId = v1) so fix 13 can prove the crown
  // moves, and a createdAt ladder so fix 9's newest sort reads at a glance.
  const makeApi = () => ({
    loadDB: async () => ({
      db: {
        classes: [
          { id: 'cls-a', name: 'Class A', parentId: 'root', icon: null, color: null, createdAt: 1 },
          { id: 'cls-long', name: 'A Very Long Class Name That Should Truncate In The Tree', parentId: 'root', icon: null, color: null, createdAt: 2 },
        ],
        tags: [
          { id: 't1', name: 'wip', color: '#ffd400', icon: null, trim: 'straight' },
          { id: 't2', name: 'main', color: '#7ecb8f', icon: null, trim: 'v' },
        ],
        stamps: [],
        characters: [
          {
            id: 'c1', name: 'Pinned Card', classId: 'cls-a', tags: [],
            previewVersionId: 'v1', cardRatio: null, cardTrim: 'dash', cardCrop: null, cardColor: null,
            stamps: [], stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
            createdAt: 1000,
            versions: [
              { id: 'v1', label: 'V1', color: null, icon: null, images: [], parts: [], notes: '', createdAt: 1 },
              { id: 'v2', label: 'V2', color: null, icon: null, images: [], parts: [], notes: '', createdAt: 2 },
            ],
          },
          {
            id: 'c2', name: 'Older Card', classId: 'cls-a', tags: [],
            previewVersionId: null, cardRatio: null, cardTrim: 'dash', cardCrop: null, cardColor: null,
            stamps: [], stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
            createdAt: 500,
            versions: [
              { id: 'v1', label: 'V1', color: null, icon: null, images: [], parts: [], notes: '', createdAt: 1 },
            ],
          },
        ],
        settings: {},
      },
      imagesPath: '/mock/images',
    }),
    saveDB: async (next) => { makeApi.db = next; return { ok: true }; },
    sendUnsavedState: () => {},
    onPromptUnsaved: () => () => {},
    saveAndClose: async () => ({ ok: true }),
    forceClose: () => {},
    windowControl: () => {},
    onWindowMaximized: () => () => {},
    onWindowUnmaximized: () => () => {},
    openExternal: () => {},
    clipboardReadText: async () => '',
    clipboardWriteText: async () => {},
    importImagesFromFiles: async () => [],
    saveImageBuffer: async () => ({ ok: true }),
    deleteImageFile: async () => {},
    copyImageFile: async (f) => ({ file: f, thumb: null, prev: null }),
    generatePreviews: async () => ({ prevs: {}, generated: 0, skipped: 0, failed: 0 }),
    onPreviewProgress: () => () => {},
    erasePreviews: async () => ({ ok: true, erased: 0 }),
    exportLibrary: async () => ({ ok: true }),
    importLibraryPick: async () => null,
    importLibraryCommit: async () => null,
    updatesCheck: async () => ({ ok: true, none: true }),
    factoryReset: async () => ({ ok: true }),
  });
  window.api = makeApi();

  const boot = async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const App = require(join(appRoot, 'src/App.jsx')).default;
    const root = createRoot(host);
    await new Promise((resolve) => {
      root.render(React.createElement(App));
      setTimeout(resolve, 3400);
    });
    return { host, root };
  };

  await okAsync('the update window fades out through its exit (live)', async () => {
    localStorage.setItem('gd:last-run-version', '1.1.4');
    const { host, root } = await boot();
    const doc = host.ownerDocument || document;
    const modal = doc.querySelector('.gd-modal-card');
    assert.ok(modal, 'the window opened on the crossing');
    const cont = [...modal.querySelectorAll('button')].find((b) => /continue/i.test(b.textContent || ''));
    assert.ok(cont, 'the CONTINUE key');
    // The AnimatePresence exit keeps the card mounted while framer tweens it
    // away: sample the tree after the click — at least one early sample must
    // still see the card (the exit flight is running), and by 450ms it must
    // be gone. (jsdom has no layout, so the flight is observed by PRESENCE,
    // not opacity — the source check above pins the wrapping itself.)
    click(cont);
    let sawLiveExit = false;
    for (const t of [40, 90, 150, 220, 300, 450]) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(t === 40 ? 40 : (t === 90 ? 50 : t === 150 ? 60 : t === 220 ? 70 : t === 300 ? 80 : 150));
      if (doc.contains(modal)) sawLiveExit = true;
    }
    assert.ok(sawLiveExit, 'the card was still mounted right after the click (the exit flight runs instead of a blink)');
    assert.ok(!doc.contains(modal), 'the card unmounts after the fade');
    assert.equal(localStorage.getItem('gd:last-run-version'), '1.4.3', 'the seat sealed');
    root.unmount();
    host.remove();
    localStorage.removeItem('gd:last-run-version');
  });

  await okAsync('a new version takes the star (live)', async () => {
    const { host, root } = await boot();
    const doc = host.ownerDocument || document;
    const card = doc.querySelector('[data-gd-char-id="c1"]');
    assert.ok(card, 'the pinned card mounted');
    click(card);
    await sleep(500);
    // the strip: v1 wears the star (explicit pin) — create a new version via
    // the trailing key and commit, then the star must move.
    const strip = doc.querySelector('.gd-version-strip');
    const starred = () => [...strip.querySelectorAll('.gd-version-item')].filter((i) => i.querySelector('.gd-version-star')).map((i) => i.textContent.trim());
    assert.equal(starred().length, 1, 'one star before');
    const items = [...strip.querySelectorAll('.gd-version-item')];
    const newKey = items[items.length - 1]; // the trailing NEW VERSION key
    // the strip rides the pointer sort — the key's tap needs the press pair,
    // not just the click
    newKey.dispatchEvent(new dom.window.MouseEvent('pointerdown', { bubbles: true }));
    newKey.dispatchEvent(new dom.window.MouseEvent('pointerup', { bubbles: true }));
    click(newKey);
    await sleep(300);
    const vm = [...doc.querySelectorAll('[data-gd-modal]')].find((m) => /NEW VERSION/i.test(m.textContent || ''));
    assert.ok(vm, 'the new-version window opened');
    const create = [...vm.querySelectorAll('button')].find((b) => b.textContent.trim() === 'CREATE');
    assert.ok(create, 'the CREATE key');
    click(create);
    await sleep(400);
    const chips = [...strip.querySelectorAll('.gd-version-item')].filter((i) => !/NEW VERSION/i.test(i.textContent || ''));
    assert.equal(chips.length, 3, 'three versions now');
    const nowStarred = starred();
    assert.equal(nowStarred.length, 1, 'exactly one star');
    assert.match(nowStarred[0], /V3/, 'the star moved to the NEW version');
    root.unmount();
    host.remove();
  });

  await okAsync('the room-aware panel never overflows the window (live)', async () => {
    const { host, root } = await boot();
    const doc = host.ownerDocument || document;
    // wide panel setting + a narrow window: the rendered width must yield.
    // (jsdom has no layout — the width is read from framer's inline style,
    // which animates the very value App computed.)
    Object.defineProperty(window, 'innerWidth', { value: 1100, configurable: true });
    window.dispatchEvent(new window.Event('resize'));
    await sleep(200);
    const card = doc.querySelector('[data-gd-char-id="c1"]');
    click(card);
    await sleep(600);
    const aside = doc.querySelector('[data-gd-region="panel"]');
    assert.ok(aside, 'the panel opened');
    const styleW = parseFloat(aside.style.width) || 0;
    assert.ok(styleW > 0, `the panel carries an inline width (${aside.style.width || 'none'})`);
    const ceiling = 1100 - 240 - 320;
    assert.ok(styleW <= ceiling + 2, `the panel yields to the room (rendered ${styleW}px, ceiling ${ceiling}px)`);
    assert.ok(styleW >= PANEL_WIDTH_RANGE.min - 1, `never below the panel minimum (${styleW}px)`);
    root.unmount();
    host.remove();
    Object.defineProperty(window, 'innerWidth', { value: 1600, configurable: true });
  });
}

console.log(`\n1.1.5 batch: ${passed} passed, ${failed} failed${failed ? ' — FIX BEFORE SHIPPING' : ''}`);
process.exit(failed ? 1 : 0);
