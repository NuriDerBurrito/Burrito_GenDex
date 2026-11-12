// 0.33.0 — THE RAIL DIVISION + THE PARTY PATTERNS + THE CLIPBOARD PRESENCE +
// THE SELECTION MENU + THE SPAWN FIX + THE LAG LAW, behavioral DOM tests on
// the real components / the real sources.
//   Part A — the new IPC + the renderer's own thumb pipeline:
//     clipboard-has-image (the light boolean probe), saveImageBuffer's
//     third argument (the canvas thumb), saveImageBlobWithThumb.
//   Part B — the SETTINGS RAIL DIVISION: the crowded Behavior tab is now
//     WORKSPACE / PERFORMANCE / KEYS — each its own rail sector.
//   Part C — the ABOUT icons ride BARE (no container, slightly bigger).
//   Part D — SELECTED TEXT ANYWHERE right-clicks into the SELECTION crew
//     (Copy + Select all) from any surface; the viewer's dead Copy item is
//     gone.
//   Part E — the IMAGE STAGE clipboard feedback: the READY chip + the
//     accent-ringed PASTE key while an image waits, the fail pill when
//     nothing does, the ok pill when it lands.
//   Part F — the grid's vocabulary is CARDS (All Cards · N CARDS) and the
//     spotlight key is renamed FILTER.
//   Part G — the SPAWN + silhouette fixes: masonry measures width BEFORE
//     the first paint; the drop-edge overlay hugs the card's own corners;
//     the full-window header wears the toolbar's pattern on its own layer.
//   Part H — THE LAG LAW: the theme effect stopped reading the whole db,
//     the texture builds are cached, and burrito is square everywhere.
// Run: node scripts/gendex_033_batch_dom.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch {
  console.log('jsdom unavailable — 0.33.0 batch DOM test skipped');
  process.exit(0);
}

const appRoot = fileURLToPath(new URL('..', import.meta.url));

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});
try {
  dom.window.innerWidth = 1920;
} catch {
  /* getter-only window */
}
if (dom.window.innerWidth < 1600) {
  Object.defineProperty(dom.window, 'innerWidth', { value: 1920, configurable: true });
}
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;
global.NodeFilter = dom.window.NodeFilter;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = dom.window.requestAnimationFrame;
global.cancelAnimationFrame = dom.window.cancelAnimationFrame;
for (const k of ['HTMLElement', 'HTMLDivElement', 'HTMLImageElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLButtonElement', 'HTMLSpanElement', 'Element', 'SVGElement', 'Node', 'File', 'Blob', 'FileReader', 'MutationObserver', 'CustomEvent', 'DragEvent', 'InputEvent', 'KeyboardEvent', 'MouseEvent', 'PointerEvent', 'ClipboardEvent', 'DataTransfer', 'Image', 'getSelection', 'URL', 'DOMParser']) {
  if (dom.window[k] !== undefined && global[k] === undefined) global[k] = dom.window[k];
}
global.matchMedia = dom.window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
global.IS_REACT_ACT_ENVIRONMENT = false;

const React = require('react');
const { createRoot } = require('react-dom/client');
const { renderToString } = require('react-dom/server');
const babel = require('@babel/core');
require.extensions['.jsx'] = (module, filename) => {
  const { code } = babel.transformFileSync(filename, {
    presets: [
      [require.resolve('@babel/preset-env'), { targets: { node: 'current' } }],
      [require.resolve('@babel/preset-react'), { runtime: 'automatic' }],
    ],
  });
  module._compile(code, filename);
};
for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff2']) {
  require.extensions[ext] = (m, filename) => { m.exports = filename; };
}

const errors = [];
console.error = (...args) => {
  const s = args.map((a) => (a && a.stack ? a.stack : String(a))).join(' ');
  if (/Warning|act\(|deprecated|HTMLElement is not defined|supportsBrowserAnimation/i.test(s)) return;
  errors.push(s);
};
dom.window.addEventListener('error', (e) => errors.push(String(e.error?.stack || e.message)));

const noop = () => {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
const ctx = (el, x = 30, y = 30) =>
  el.dispatchEvent(new dom.window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
const menuLabels = () => [...document.querySelectorAll('.gd-ctx-item')].map((b) => b.textContent);

let passed = 0;
function ok(label, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ok ${passed} — ${label}`);
  } catch (e) {
    console.error(`  FAIL ${label}\n${e.stack}`);
    process.exitCode = 1;
    throw e;
  }
}

// ============================================================================
// Part A — the 0.34.0 clipboard law (check only on press) + the thumb pipeline
// ============================================================================
{
  const mainSrc = readFileSync(join(appRoot, 'src/main.js'), 'utf8');
  const preloadSrc = readFileSync(join(appRoot, 'src/preload.js'), 'utf8');
  ok('0.34.0 the clipboard PRESENCE PROBE IS GONE — nothing polls anything (the read is the check)', () => {
    assert.ok(!mainSrc.includes("'clipboard-has-image'"), 'the IPC channel left main.js');
    assert.ok(!preloadSrc.includes('clipboardHasImage'), 'the preload binding is gone');
    const stageSrc = readFileSync(join(appRoot, 'src/components/ImageStage.jsx'), 'utf8');
    assert.ok(!stageSrc.includes('clipboardHasImage'), 'the stage never polls');
    assert.ok(!stageSrc.includes('setInterval(probe'), 'no probe interval anywhere');
    assert.ok(!stageSrc.includes('gd-stage-clipchip'), 'the READY chip is retired');
    assert.ok(!stageSrc.includes("'is-ready'"), 'the paste key no longer lights a ready ring');
  });
  ok('0.34.0 saveImage takes the renderer thumb FIRST (the no-full-quality-decode fix stays)', () => {
    // 0.35.0 grew a fourth optional param (thumbExt) — the third-parameter
    // law is what this check pins, so the pattern allows the growth.
    assert.ok(/saveImage = \(buffer, ext, thumbBase64 = null(, thumbExt = null)?\)/.test(mainSrc), 'the third parameter');
    assert.ok(mainSrc.includes('thumbBase64'), 'the thumb rides the IPC');
    assert.ok(/image:save-buffer'[\s\S]{0,220}thumbBase64/.test(mainSrc), 'the handler forwards it');
    assert.ok(/saveImageBuffer: \(base64, ext, thumbBase64 = null(, thumbExt = null)?\)/.test(preloadSrc), 'the preload forwards the thumb');
  });
  const helpersSrc = readFileSync(join(appRoot, 'src/utils/helpers.js'), 'utf8');
  ok('0.34.0 saveImageBlobWithThumb paints the canvas thumb (Chromium decodes what nativeImage cannot)', () => {
    assert.ok(helpersSrc.includes('export async function saveImageBlobWithThumb'), 'the helper exists');
    assert.ok(helpersSrc.includes('createImageBitmap'), 'it asks the browser for a bitmap');
    assert.ok(helpersSrc.includes("toDataURL('image/jpeg', 0.9)"), 'it ships a JPEG thumb');
    // every renderer import site rides it (App paste, CharacterView paste/drop,
    // the creation window's drop)
    for (const f of ['src/App.jsx', 'src/components/CharacterView.jsx', 'src/components/NewCharacterModal.jsx']) {
      const src = readFileSync(join(appRoot, f), 'utf8');
      assert.ok(src.includes('saveImageBlobWithThumb'), `${f} uses the thumb pipeline`);
    }
  });
}

// ============================================================================
// Part B — the settings rail division (the real SettingsModal mounted)
// ============================================================================
{
  const SettingsModal = require(join(appRoot, 'src/components/SettingsModal.jsx')).default;
  const settings = {
    theme: 'zine', colors: {}, zoom: 2, defaultSortMode: 'custom',
    textures: { titlebar: 'none', sidebar: 'none', viewer: 'dots', panel: 'none' },
    detailPanel: true, tagScale: 1.2, cardRatio: { w: 3, h: 4 },
    shortcuts: {}, sidebarWidth: 240, panelWidth: 480, cardColWidth: 360,
    stageBlur: true, hoverLifts: true, tooltipFollow: true, advancedSearch: false,
  };
  const render = (tab) =>
    renderToString(
      React.createElement(SettingsModal, {
        settings, initial: settings, initialTab: tab, onClose: noop, onChange: noop, onRevert: noop,
      })
    );

  ok('0.33.0 the rail divides Behavior into WORKSPACE / PERFORMANCE / KEYS', () => {
    const out = render('Workspace');
    for (const rail of ['LOOK', 'WORKSPACE', 'PERFORMANCE', 'KEYS', 'DATA', 'ABOUT']) {
      assert.ok(out.includes(`>${rail}<`), `the ${rail} sector is on the rail`);
    }
    assert.ok(!out.includes('>BEHAVIOR<'), 'the crowded BEHAVIOR sector is gone');
  });
  ok('0.33.0 WORKSPACE keeps the panels, the widths and search — nothing else', () => {
    const out = render('Workspace');
    for (const card of ['CHARACTER PANEL', 'BOTTOM OUTPUT BAR', 'LEFT TREE WIDTH', 'CARD PANEL WIDTH', 'PREVIEW COLUMN WIDTH', 'ADVANCED SEARCH']) {
      assert.ok(out.includes(card), `${card} lives here`);
    }
    assert.ok(!out.includes('IMAGE STAGE BLUR'), 'performance left');
    assert.ok(!out.includes('REASSIGN KEYS'), 'shortcuts left');
  });
  ok('0.33.0 PERFORMANCE carries the switches on its own sector', () => {
    const out = render('Performance');
    for (const card of ['IMAGE STAGE BLUR', 'HOVER LIFTS']) {
      assert.ok(out.includes(card), `${card} lives here`);
    }
    // 1.2.4 — TOOLTIP SCROLL FOLLOW retired (the pill pins at its hover
    // point; the behavior the switch drove no longer exists).
    assert.ok(!out.includes('TOOLTIP SCROLL FOLLOW'), 'the follow switch retired (1.2.4)');
    assert.ok(!out.includes('CARD PANEL WIDTH'), 'the widths left');
  });
  ok('0.33.0 KEYS carries the reassignable shortcuts editor', () => {
    const out = render('Keys');
    assert.ok(out.includes('REASSIGN KEYS'), 'the editor titles the sector');
    assert.ok(out.includes('gd-scut-key'), 'the combo keys render');
  });
}

// ============================================================================
// Part C — the about icons ride bare (no container, slightly bigger)
// ============================================================================
{
  const css = readFileSync(join(appRoot, 'src/index.css'), 'utf8');
  ok('0.33.0 the about brand marks carry NO container and run slightly bigger', () => {
    assert.ok(!css.includes('background: #14161b'), 'the fixed dark chip ground is gone');
    const icoBlock = /\.gd-about-link-ico\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(!/border/.test(icoBlock), 'no frame paints around the mark');
    assert.ok(/\.gd-about-link-ico img\s*\{[^}]*width: 19px/.test(css), 'the mark runs at 19px (was 13px in its chip)');
  });
}

// ============================================================================
// Part D — the SELECTION menu anywhere (the real App mounted)
// ============================================================================
{
  window.api = {
    loadDB: async () => ({
      db: {
        settings: {
          theme: 'zine', colors: {}, zoom: 2, defaultSortMode: 'custom',
          textures: { titlebar: 'none', sidebar: 'none', viewer: 'dots', panel: 'none' },
          detailPanel: true, tagScale: 1.2, cardRatio: { w: 3, h: 4 },
        },
        classes: [], tags: [], stamps: [], characters: [],
      },
      imagesPath: '/mock/images',
    }),
    saveDB: async () => ({ ok: true }),
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
    clipboardReadImage: async () => null,
    clipboardHasImage: async () => false,
    clipboardWriteImageFile: async () => ({ ok: true }),
    pasteToFocused: () => {},
    importImagesFromFiles: async () => [],
    saveImageBuffer: async () => null,
    copyImageFile: async () => null,
    deleteImageFile: async () => ({ ok: true }),
    openDataFolder: () => {},
    clearCache: async () => ({ ok: true }),
  };
  document.body.innerHTML = '<div id="root"></div>';
  const App = require(join(appRoot, 'src/App.jsx')).default;
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(App));
  await sleep(3400);

  // a plain (non-editable) text run somewhere in the window, selected
  const para = document.createElement('p');
  para.textContent = 'a quiet caption run';
  document.body.append(para);
  const sel = window.getSelection();
  const range = document.createRange();
  range.setStart(para.firstChild, 0);
  range.setEnd(para.firstChild, 6); // "a quie"
  sel.removeAllRanges();
  sel.addRange(range);

  // right-click somewhere ELSE entirely — the viewer's empty area
  const viewer = document.querySelector('.gd-tex-viewer') || document.querySelector('main');
  ctx(viewer, 60, 60);
  await sleep(60);
  ok('0.33.0 text selected ANYWHERE + right-click opens the SELECTION crew', () => {
    const header = document.querySelector('.gd-ctx-header')?.textContent || '';
    assert.equal(header, 'SELECTION', 'the menu names itself SELECTION');
    const labels = menuLabels();
    assert.ok(labels.includes('Copy'), 'Copy is offered');
    assert.ok(labels.includes('Select all'), 'Select all is offered');
  });
  ok('0.33.0 the selection Copy captures the run that was live at click time', () => {
    const copyBtn = [...document.querySelectorAll('.gd-ctx-item')].find((b) => b.textContent === 'Copy');
    assert.ok(copyBtn, 'the copy key');
    window.__selCopied = null;
    window.api.clipboardWriteText = async (t) => { window.__selCopied = t; };
    click(copyBtn);
  });
  await sleep(120); // the pick runs its action a tick after the menu closes
  ok('0.33.0 the captured selection text lands on the clipboard', () => {
    assert.equal(window.__selCopied, 'a quie', 'the selection text from click time was copied');
  });

  // no selection → the viewer's own menu, and its Copy is GONE (it could
  // never be enabled now — the selection branch owns that word)
  sel.removeAllRanges();
  await sleep(280); // let the picked menu finish its exit animation
  ctx(viewer, 70, 70);
  await sleep(80);
  ok('0.33.0 with nothing selected the viewer menu is back — and its dead Copy item is retired', () => {
    // scope to the LAST menu on screen (an exiting one may linger a frame)
    const menus = [...document.querySelectorAll('.gd-ctx-menu')];
    assert.ok(menus.length >= 1, 'a menu rendered');
    const labels = [...menus[menus.length - 1].querySelectorAll('.gd-ctx-item')].map((b) => b.textContent);
    assert.ok(!labels.includes('Copy'), 'the always-disabled Copy left the region menu');
    assert.ok(labels.includes('Paste image'), 'paste image stays');
    assert.ok(labels.includes('Select all'), 'select all stays');
  });

  function escapeSim() {
    document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  }
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ============================================================================
// Part E — the image stage's clipboard feedback (the real ImageStage)
// 0.35.0 — the verdict pill is now a GLOBAL TOAST (gdToast → ToastHub), so
// the harness mounts the hub beside the stage exactly like App does; the
// assertions read the .gd-toast pills at body level instead of the old
// stage-owned .gd-stage-note.
// ============================================================================
{
  const ImageStage = require(join(appRoot, 'src/components/ImageStage.jsx')).default;
  const ToastHub = require(join(appRoot, 'src/components/ToastHub.jsx')).default;
  const images = [
    { file: 'img_a.png', thumb: 'img_a_thumb.jpg' },
    { file: 'img_b.png', thumb: 'img_b_thumb.jpg' },
  ];
  const state = { img: null };
  window.api = {
    clipboardReadImage: async () => state.img,
    saveImageBuffer: async () => ({ file: 'img_new.png', thumb: 'img_new_thumb.jpg' }),
  };
  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.getElementById('root'));
  const pasted = [];
  const statuses = [];
  root.render(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(ImageStage, {
        images,
        imagesPath: '/mock/images',
        onAddImages: noop,
        onSetCover: noop,
        onDeleteImage: noop,
        onReorderImages: noop,
        onPasteRecord: (rec) => pasted.push(rec),
        onStatus: (s) => statuses.push(s),
        confirm: noop,
      }),
      React.createElement(ToastHub)
    )
  );
  await sleep(120);

  ok('0.34.0 the stage NEVER polls the clipboard — no READY chip, no lit paste key; the sorter is retired too', () => {
    assert.ok(!document.querySelector('.gd-stage-clipchip'), 'the READY chip is gone');
    const pasteBtn0 = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('PASTE'));
    assert.ok(pasteBtn0, 'the paste key');
    assert.ok(!pasteBtn0.className.includes('is-ready'), 'no accent ring while idle');
    // the retired sorter: no filmstrip key, no DRAG TO SORT row
    assert.ok(![...document.querySelectorAll('button')].some((b) => (b.title || '').includes('sorter')), 'the sorter show/hide key is retired');
    assert.ok(!document.body.innerHTML.includes('DRAG TO SORT'), 'the filmstrip is retired (the manager owns ordering)');
    assert.equal(document.querySelectorAll('.gd-stage-peek').length, 3, 'the peek row stays');
  });

  // press PASTE with nothing on the clipboard — the fail toast answers
  await sleep(20);
  const pasteBtn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('PASTE'));
  click(pasteBtn);
  await sleep(80);
  ok('0.34.0 pressing PASTE with no image answers with the FAIL toast at the top of the screen', () => {
    const pill = document.querySelector('.gd-toast');
    assert.ok(pill, 'the verdict toast rendered (0.35.0: the global feedback layer caught it)');
    assert.ok(pill.classList.contains('is-fail'), 'the fail tone');
    // 0.36.0 — the verdicts speak the app's sentence case now
    assert.ok(pill.textContent.includes('No image on the clipboard'), 'the toast says why');
    // 0.36.0 — ONE verdict per paste: the stage no longer ALSO reports through
    // the status line (that second line doubled every pill through the app's
    // toast junction).
    assert.ok(!statuses.some((s) => s.includes('No image')), 'no doubled report — the toast is the one verdict');
    assert.equal(pasted.length, 0, 'nothing was pasted');
  });

  // an image lands on the clipboard — press PASTE again, the ok pill confirms
  state.img = { base64: 'aGVsbG8=', ext: '.png' };
  await sleep(20);
  const pasteBtn2 = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('PASTE'));
  click(pasteBtn2);
  await sleep(140);
  ok('0.33.0 a successful paste confirms with the OK toast and hands the record over', () => {
    // scope to the FIRST toast — 1.1.9 speaks newest-first (the stack's
    // head is the newest verdict; older ones may still be exiting below)
    const pills = [...document.querySelectorAll('.gd-toast')];
    assert.ok(pills.length >= 1, 'the verdict toast rendered');
    const pill = pills[0];
    assert.ok(!pill.classList.contains('is-fail'), 'the ok tone');
    // 0.36.0 — the verdicts speak the app's sentence case now
    assert.ok(pill.textContent.includes('Image pasted'), 'the toast confirms');
    assert.equal(pasted.length, 1, 'the record reached the version');
    assert.equal(pasted[0].file, 'img_new.png', 'the record is the saved image');
  });

  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ============================================================================
// Part F — the grid's vocabulary: CARDS + FILTER (the real GridView)
// ============================================================================
{
  const GridView = require(join(appRoot, 'src/components/GridView.jsx')).default;
  const characters = [];
  ok('0.33.0 the viewer header speaks CARDS (All Cards · N CARDS) and the filter key says FILTER', () => {
    const out = renderToString(
      React.createElement(GridView, {
        characters, tags: [], stamps: [], imagesPath: '/mock/images', zoom: 3, tagScale: 1,
        tagPosition: 'corner', cardRatio: { w: 3, h: 4 }, sortMode: 'custom', search: '',
        classLabel: 'All Cards', dragRef: { current: null },
        spotlight: { include: [], exclude: [], stamps: [], hideNonMatching: false },
        showHelp: false, onCycleSpotlight: noop, onCycleStampSpotlight: noop, onToggleSpotlightHide: noop,
        onSearch: noop, onSort: noop, onNew: noop, onOpen: noop, onRename: noop, onDelete: noop, onReorder: noop,
      })
    );
    // SSR interleaves comments between expressions — strip them before reading
    const flat = out.replace(/<!--.*?-->/g, '');
    assert.ok(flat.includes('ALL CARDS'), 'the root class reads All Cards');
    assert.ok(/0\s*CARDS/.test(flat), 'the count reads 0 CARDS');
    assert.ok(!flat.includes('CHARACTERS'), 'no CHARACTER vocabulary survives in the header');
    assert.ok(flat.includes('FILTER'), 'the filter key is renamed');
    assert.ok(!out.includes('>SPOTLIGHT<'), 'the old word left the key');
  });
  const appSrc = readFileSync(join(appRoot, 'src/App.jsx'), 'utf8');
  ok('0.33.0 the root class label itself reads ALL CARDS (App-side)', () => {
    assert.ok(appSrc.includes("'All Cards'"), 'the App labels the root class All Cards');
    assert.ok(!appSrc.includes("'All Characters'"), 'the old label is gone');
  });
}

// ============================================================================
// Part G — the spawn fix + the silhouette fixes (sources + CSS)
// ============================================================================
{
  const masonrySrc = readFileSync(join(appRoot, 'src/components/MasonryGrid.jsx'), 'utf8');
  ok('0.33.0 masonry measures the container width BEFORE the first paint', () => {
    assert.ok(masonrySrc.includes('sheetRef'), 'the inner sheet is ref\u2019d');
    assert.ok(/useLayoutEffect\(\(\) => \{[\s\S]{0,240}sheetRef\.current[\s\S]{0,120}clientWidth/.test(masonrySrc), 'a mount layout effect reads clientWidth');
    /* 1.2.0 re-law: the commit is the COLUMN COUNT, not the raw width —
       identical-count widths produce identical seats, so the count crossing
       is the only honest moment to re-lay (the panel morph\'s CPU fix). */
    assert.ok(/setColumns\(\(prev\) => \(prev === count \? prev : count\)\)/.test(masonrySrc), 'the count lands in state pre-paint (1.2.0)');
    assert.ok(masonrySrc.includes("contain: 'layout style'"), 'containment stays layout+style (ribbons may hang past)');
  });
  const css = readFileSync(join(appRoot, 'src/index.css'), 'utf8');
  ok('0.34.0 the drop-edge overlay spans the BORDER box too (radius + border width — the top edge is fully lit)', () => {
    const rule = /\.gd-drop-edge\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/inset: calc\(var\(--gd-border-w, 2px\) \* -1\)/.test(rule), 'the overlay reaches over the card\u2019s own ink frame');
    assert.ok(
      /border-radius: calc\(var\(--gd-shape-radius, var\(--gd-radius\)\) \+ var\(--gd-border-w, 2px\)\) calc\(var\(--gd-shape-radius, var\(--gd-radius\)\) \+ var\(--gd-border-w, 2px\)\) 0 0/.test(rule),
      'the radius grows with the frame — every curved top pixel sits under the highlight'
    );
  });
  ok('0.33.0 the full-window header rides its own layer (the scroll lag fix)', () => {
    const rule = /\.gd-char-head\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/translateZ\(0\)/.test(rule), 'the layer promotion');
    const cvSrc = readFileSync(join(appRoot, 'src/components/CharacterView.jsx'), 'utf8');
    assert.ok(cvSrc.includes("'gd-char-head sticky"), 'the header carries the class');
    /* 1.2.6 — ONE HEAD, ONE SURFACE: both seats wear the PANEL's pattern
       (the full-window head stopped speaking the titlebar's flat
       language — the two heads read as the same bar at any width). */
    assert.ok(cvSrc.includes("'gd-tex-panel',"), 'the head wears the PANEL pattern (both seats)');
  });
}

// ============================================================================
// Part H — the lag law + burrito squared (sources)
// ============================================================================
{
  const appSrc = readFileSync(join(appRoot, 'src/App.jsx'), 'utf8');
  ok('0.33.0 the theme effect stopped reading the whole db (the reapply lag fix)', () => {
    // 0.42.0 grew a sixth dep (themeUiFont — the body font setting); the LAW
    // (list exactly the fields it reads) is what this pins.
    // 1.1.9 re-law: the toolbar-gradient field left with 1.1.8; the deps
    // list exactly what the effect reads.
    assert.ok(/\}, \[themeId, themeColors, themeTextures, themeButtonStyle, themeUiFont\]\);/.test(appSrc), 'the deps list only the fields it reads');
    assert.ok(!/\}, \[db, db\?\.settings\?\.theme/.test(appSrc), 'the bare db dependency is gone');
  });
  const texSrc = readFileSync(join(appRoot, 'src/utils/textures.js'), 'utf8');
  ok('0.33.0 texture builds are CACHED (identical inputs paint nothing)', () => {
    assert.ok(texSrc.includes('TILE_CACHE'), 'the cache exists');
    assert.ok(/TILE_CACHE\.get\(key\)/.test(texSrc), 'builds are memoized per key');
  });
  const constantsSrc = readFileSync(join(appRoot, 'src/constants/index.js'), 'utf8');
  const css = readFileSync(join(appRoot, 'src/index.css'), 'utf8');
  ok('0.33.0 burrito is SQUARE everywhere with a clean toolbar + confetti viewer', () => {
    const burrito = constantsSrc.slice(constantsSrc.indexOf("id: 'burrito'"), constantsSrc.indexOf("id: 'archive'"));
    assert.ok(burrito.includes("radius: '0px'"), 'the theme radius is a hard 0');
    assert.ok(burrito.includes("titlebar: 'none'"), 'the toolbar ships clean');
    assert.ok(burrito.includes("viewer: 'confetti'"), 'the viewer ships confetti');
    assert.ok(/\[data-theme='burrito'\] \.gd-chip\s*\{[^}]*border-radius: 0/.test(css), 'the chips run square');
    assert.ok(/\[data-theme='burrito'\] \.gd-rt-toolbar\s*\{[^}]*border-radius: 0/.test(css), 'the rich toolbar runs square');
  });
}

console.log(`\n${passed} 0.33.0 batch DOM checks passing`);
if (errors.length) {
  console.error(`\n${errors.length} renderer error(s) surfaced during the run:`);
  for (const e of errors) console.error(`  ${e.split('\n')[0]}`);
  process.exitCode = 1;
}
