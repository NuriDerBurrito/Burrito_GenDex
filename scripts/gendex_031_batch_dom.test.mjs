// 0.31.0 — THE REGION CONTEXT MENUS + REASSIGNABLE SHORTCUTS + THE CARD
// COLUMN SEPARATOR + THE PEEK ROW + THE SETTLE GUARD + BARE SPOTLIGHT TILES,
// behavioral DOM tests on the real components / the real App.
//   Part A — combo constants: DEFAULT_SHORTCUTS is total + valid, isComboStr
//     accepts/rejects, comboFromEvent normalizes jsdom keydowns, the card
//     column width clamps.
//   Part B — the shortcuts sanitize pass: fresh db = defaults, duplicates
//     resolve first-come (the loser reverts to a FREE combo), junk entries
//     fall back, cardColWidth sanitizes.
//   Part C — the SHORTCUTS editor (Settings → Keys — its own sector since 0.33.0): click a key -> it
//     listens, a new two-key combo commits through onChange, an OWNED combo
//     is refused with a conflict note, Escape cancels, RESET restores.
//   Part D — the App's PER-REGION right-click menus: class row / tree empty
//     / toolbar header / titlebar / viewer empty / full-view background /
//     the image stage's own menu / editable targets keep the native menu,
//     and Duplicate runs end-to-end through the image-copy IPC.
//   Part E — the CARD-COLUMN SEPARATOR: it renders between preview and
//     details, a drag writes the live width to the column node and commits
//     on release, the clamps hold, compact never shows it.
//   Part F — the SETTLE GUARD: the drag commit lands with gd-settle's
//     transition-kill armed (CSS) and the class is gone after the settle.
//   Part G — BARE SPOTLIGHT TILES: the spotlight popover's tiles drop the
//     outer frame (is-bare) and keep the 44px art box + name.
// Run: node scripts/gendex_031_batch_dom.test.mjs
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
  console.log('jsdom unavailable — 0.31.0 batch DOM test skipped');
  process.exit(0);
}

// 0.32.0 — the app root resolves RELATIVE to this file (the script used to
// hardcode /home/z/my-project/burrito-app/Burrito_GenDex_0.23.0 — a stale
// machine-local path that broke the test anywhere else). scripts/ sits one
// level under the project root.
const appRoot = fileURLToPath(new URL('..', import.meta.url));

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});
// A desktop-sized viewport: the card-column separator's live clamp keeps
// room for the tree + the details column (vw - 680), and jsdom's default
// 1024px would clamp the default 360px column on its first drag.
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
  if (/Warning|act\(|deprecated|HTMLElement is not defined|supportsBrowserAnimation|Not implemented: Window's scrollTo/i.test(s)) return; // 1.0.1: motion-dom's scroll-restore no-op around the output bar's height measurement — jsdom can't run it, browsers no-op it
  errors.push(s);
};
dom.window.addEventListener('error', (e) => errors.push(String(e.error?.stack || e.message)));

const noop = () => {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pointer = (type, x, y, extra = {}) => {
  const E = dom.window.PointerEvent || dom.window.MouseEvent;
  return new E(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, ...extra });
};
const ctx = (el, x = 30, y = 30) =>
  el.dispatchEvent(new dom.window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
const escape = () => document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
const key = (k, opts = {}) => window.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...opts }));
const menuLabels = () => [...document.querySelectorAll('.gd-ctx-item')].map((b) => b.textContent);
const menuHeader = () => document.querySelector('.gd-ctx-header')?.textContent || '';

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
// Part A — combo constants
// ============================================================================
{
  const C = await import(join(appRoot, 'src/constants/index.js'));
  ok('0.31.0 DEFAULT_SHORTCUTS is total over the roster and every combo is valid', () => {
    for (const act of C.SHORTCUT_ACTIONS) {
      assert.ok(C.DEFAULT_SHORTCUTS[act.id], `${act.id} ships a combo`);
      assert.ok(C.isComboStr(C.DEFAULT_SHORTCUTS[act.id]), `${act.id}'s combo is a two-key combo`);
    }
    const values = Object.values(C.DEFAULT_SHORTCUTS);
    assert.equal(new Set(values).size, values.length, 'the shipped combos are unique');
  });
  ok('0.31.0 isComboStr accepts Modifier(+Shift)+Key and rejects the rest', () => {
    assert.ok(C.isComboStr('Ctrl+S'));
    assert.ok(C.isComboStr('Alt+F'));
    assert.ok(C.isComboStr('Ctrl+Shift+Home'));
    assert.ok(C.isComboStr('Ctrl+,'));
    assert.ok(!C.isComboStr('S'));
    assert.ok(!C.isComboStr('Shift+A'));
    assert.ok(!C.isComboStr('Ctrl'));
    assert.ok(!C.isComboStr('ctrl+s'));
    assert.ok(!C.isComboStr('Ctrl+'));
    assert.ok(!C.isComboStr(42));
  });
  ok('0.31.0 comboFromEvent normalizes a keydown into the stored form (or null)', () => {
    const ev = (opts) => new dom.window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...opts });
    assert.equal(C.comboFromEvent(ev({ key: 's', ctrlKey: true })), 'Ctrl+S');
    assert.equal(C.comboFromEvent(ev({ key: 'S', ctrlKey: true, shiftKey: true })), 'Ctrl+Shift+S');
    assert.equal(C.comboFromEvent(ev({ key: 'p', altKey: true })), 'Alt+P');
    assert.equal(C.comboFromEvent(ev({ key: ',', metaKey: true })), 'Ctrl+,');
    assert.equal(C.comboFromEvent(ev({ key: 'a' })), null);
    assert.equal(C.comboFromEvent(ev({ key: 'Control', ctrlKey: true })), null);
    assert.equal(C.comboFromEvent(ev({ key: 'Alt', altKey: true })), null);
  });
  ok('0.31.0 clampCardColWidth clamps and defaults', () => {
    assert.equal(C.clampCardColWidth(400), 400);
    assert.equal(C.clampCardColWidth(10), C.CARD_COL_WIDTH_RANGE.min);
    assert.equal(C.clampCardColWidth(9999), C.CARD_COL_WIDTH_RANGE.max);
    assert.equal(C.clampCardColWidth(NaN), C.CARD_COL_WIDTH_RANGE.default);
    assert.equal(C.clampCardColWidth('junk'), C.CARD_COL_WIDTH_RANGE.default);
  });
}

// ============================================================================
// Part B — the sanitize pass (through createSafeDb)
// ============================================================================
{
  const H = await import(join(appRoot, 'src/utils/helpers.js'));
  const C = await import(join(appRoot, 'src/constants/index.js'));
  const base = {
    classes: [{ id: 'cl1', name: 'heroes', parentId: 'root', order: 1 }],
    tags: [], stamps: [], characters: [],
  };
  ok('0.31.0 a fresh db carries the DEFAULT shortcut map', () => {
    const safe = H.createSafeDb({ ...base, settings: {} });
    assert.deepEqual(safe.settings.shortcuts, C.DEFAULT_SHORTCUTS);
    assert.equal(safe.settings.cardColWidth, C.CARD_COL_WIDTH_RANGE.default);
  });
  ok('0.31.0 DUPLICATE combos resolve first-come — the loser reverts to its default', () => {
    // undo wants save's combo: save claims it (roster order), undo falls
    // back to its own untaken default Ctrl+Z.
    const safe = H.createSafeDb({ ...base, settings: { shortcuts: { save: 'Ctrl+S', undo: 'Ctrl+S' } } });
    assert.equal(safe.settings.shortcuts.save, 'Ctrl+S');
    assert.equal(safe.settings.shortcuts.undo, 'Ctrl+Z');
    // one combo can never wire two actions
    const vals = Object.values(safe.settings.shortcuts).filter(Boolean);
    assert.equal(new Set(vals).size, vals.length, 'the sanitized map is unique');
  });
  ok('0.31.0 junk entries fall back (wrong form / no modifier / not a string)', () => {
    const safe = H.createSafeDb({
      ...base,
      settings: { shortcuts: { save: 'ctrl+s', undo: 'Z', settings: 7, panel: 'Shift+P' } },
    });
    assert.equal(safe.settings.shortcuts.save, 'Ctrl+S');
    assert.equal(safe.settings.shortcuts.undo, 'Ctrl+Z');
    assert.equal(safe.settings.shortcuts.settings, 'Ctrl+,');
    assert.equal(safe.settings.shortcuts.panel, 'Alt+P');
  });
  ok('0.31.0 cardColWidth sanitizes (kept when valid, clamped when wild)', () => {
    const safe = H.createSafeDb({ ...base, settings: { cardColWidth: 420 } });
    assert.equal(safe.settings.cardColWidth, 420);
    const wild = H.createSafeDb({ ...base, settings: { cardColWidth: 5000 } });
    assert.equal(wild.settings.cardColWidth, C.CARD_COL_WIDTH_RANGE.max);
  });
}

// ============================================================================
// Part C — the SHORTCUTS editor (Settings → Keys — its own sector since 0.33.0)
// ============================================================================
{
  const SettingsModal = require(join(appRoot, 'src/components/SettingsModal.jsx')).default;
  const C = await import(join(appRoot, 'src/constants/index.js'));
  const settings = {
    theme: 'zine', colors: {}, zoom: 2, defaultSortMode: 'custom',
    textures: { titlebar: 'none', sidebar: 'none', viewer: 'dots', panel: 'none' },
    detailPanel: true, tagScale: 1.2, cardRatio: { w: 3, h: 4 },
    shortcuts: { ...C.DEFAULT_SHORTCUTS },
    cardColWidth: 360, sidebarWidth: 240, panelWidth: 480,
  };
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  const commits = [];
  // LIVE settings: every commit is applied back and re-rendered, exactly
  // like the real App's live-settings model (the conflict check reads the
  // CURRENT map, so the harness must feed commits back for it to see them).
  const live = { ...settings };
  const rerender = () =>
    root.render(
      React.createElement(SettingsModal, {
        settings: live, initial: live, initialTab: 'Keys',
        onClose: noop, onChange: (k, v) => commits.push([k, v]), onRevert: noop,
      })
    );
  rerender();
  await sleep(60);
  ok('0.31.0 the SHORTCUTS editor renders the roster with live combos', () => {
    const keys = [...document.querySelectorAll('.gd-scut-key')];
    assert.equal(keys.length, C.SHORTCUT_ACTIONS.length, 'one key per action');
    assert.ok(keys.some((k) => k.textContent === 'Ctrl+S'), 'the live combo prints on the key');
    assert.ok(document.body.textContent.includes('REASSIGN KEYS'), 'the card titles');
    assert.ok(document.body.textContent.includes('RESET'), 'the reset key renders');
  });
  // arm the Save row, press Ctrl+F -> commits
  const keyBtn = [...document.querySelectorAll('.gd-scut-key')].find((k) => k.textContent === 'Ctrl+S');
  keyBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  await sleep(30);
  ok('0.31.0 clicking a combo key ARMS the row (listening state)', () => {
    assert.ok(keyBtn.classList.contains('is-listening'), 'the armed key pulses');
    assert.ok(keyBtn.textContent.includes('PRESS KEYS'), 'the key says it is listening');
  });
  key('f', { ctrlKey: true });
  await sleep(40);
  ok('0.31.0 a new two-key combo commits through onChange', () => {
    assert.equal(commits.length, 1, 'exactly one commit');
    const [k, v] = commits[0];
    assert.equal(k, 'shortcuts', 'the shortcuts key');
    assert.equal(v.save, 'Ctrl+F', 'save is rebound');
    assert.equal(v.undo, 'Ctrl+Z', 'the rest of the map rides along');
  });
  // apply the commit like the live app does, so the conflict check sees it
  live.shortcuts = { ...live.shortcuts, ...commits[0][1] };
  rerender();
  await sleep(40);
  // arm Undo, press the now-owned Ctrl+F -> refused with the conflict note
  const undoBtn = [...document.querySelectorAll('.gd-scut-key')].find((k) => k.textContent === 'Ctrl+Z');
  undoBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  await sleep(30);
  key('f', { ctrlKey: true });
  await sleep(40);
  ok('0.31.0 a combo owned by another action is REFUSED with a conflict note', () => {
    assert.equal(commits.length, 1, 'no new commit happened');
    assert.ok(document.body.textContent.includes('already belongs to'), 'the conflict note prints');
    assert.ok(undoBtn.classList.contains('is-conflict'), 'the refused key shakes');
  });
  // Escape disarms
  escape();
  await sleep(30);
  ok('0.31.0 Escape disarms the listening row', () => {
    assert.ok(!undoBtn.classList.contains('is-listening'), 'the row disarmed');
  });
  // RESET asks first (1.7.7 — the confirmation the report asked for),
  // then CONFIRM RESET restores the shipped defaults
  const reset = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('RESET'));
  reset.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  await sleep(40);
  const confirmReset = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('CONFIRM RESET'));
  assert.ok(confirmReset, 'the confirm key never armed');
  confirmReset.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  await sleep(40);
  ok('0.31.0 RESET restores the shipped default combos', () => {
    assert.equal(commits.length, 2, 'the reset committed');
    assert.deepEqual(commits[1][1], C.DEFAULT_SHORTCUTS, 'the defaults ride back in');
  });
  root.unmount();
  document.body.innerHTML = '';
}

// ============================================================================
// Part D — the App's PER-REGION right-click menus
// ============================================================================
{
  const copiedFiles = [];
  window.api = {
    loadDB: async () => ({
      db: {
        settings: {
          theme: 'zine', colors: {}, zoom: 2, defaultSortMode: 'custom',
          textures: { titlebar: 'none', sidebar: 'none', viewer: 'dots', panel: 'none' },
          detailPanel: true, tagScale: 1.2, cardRatio: { w: 3, h: 4 },
        },
        classes: [
          { id: 'cl1', name: 'heroes', parentId: 'root', order: 1 },
          { id: 'cl2', name: 'villains', parentId: 'root', order: 2 },
        ],
        tags: [], stamps: [],
        characters: [
          {
            id: 'c1', name: 'amy', classId: 'cl1', tags: [], previewVersionId: null,
            cardRatio: { w: 3, h: 4 }, cardTrim: 'dash', cardCrop: null,
            stamps: [], stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
            createdAt: Date.now(),
            versions: [{ id: 'v1', label: 'V1', color: null, icon: null, images: [{ file: 'a.png', thumb: 'a_t.jpg' }], parts: [], notes: '', createdAt: 1 }],
          },
        ],
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
    clipboardWriteText: async () => '',
    clipboardReadImage: async () => null,
    importImagesFromFiles: async () => [],
    saveImageBuffer: async () => null,
    // 0.31.0 — the DUPLICATE pipeline: every copied image lands as a fresh record.
    copyImageFile: async (f) => {
      copiedFiles.push(f);
      return { file: `copy_${f}`, thumb: `copy_${f}` };
    },
    deleteImageFile: async () => ({ ok: true }),
    openDataFolder: () => {},
    clearCache: async () => ({ ok: true }),
  };
  document.body.innerHTML = '<div id="root"></div>';
  const App = require(join(appRoot, 'src/App.jsx')).default;
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(App));
  await sleep(3400);

  // --- on a CLASS ROW ---------------------------------------------------
  const row = document.querySelector('[data-gd-class-id="cl1"]');
  ctx(row);
  await sleep(60);
  ok('0.31.0 right-clicking a CLASS ROW speaks class: header + new-under + rename + delete', () => {
    assert.ok(menuHeader().includes('CLASS'), `the header chip names the class (got: ${menuHeader()})`);
    const labels = menuLabels();
    assert.ok(labels.some((l) => l.includes('New class under')), 'new class under the parent');
    // 0.39.0 — "remove the edit name and let it just be edit the class": the
    // bare rename entry is gone; the one key opens the FULL editor.
    assert.ok(labels.some((l) => l.includes('Edit class')), 'edit class (the full editor)');
    assert.ok(!labels.some((l) => l.includes('Rename class')), 'no bare rename entry anymore');
    assert.ok(labels.some((l) => l.includes('New card in')), 'new card scoped to the class');
    assert.ok(labels.some((l) => l.includes('Delete class')), 'delete class (danger)');
    assert.ok(!labels.some((l) => l.includes('Paste image')), 'no generic viewer crew on a class');
  });
  escape();
  await sleep(260);

  // --- TREE EMPTY AREA --------------------------------------------------
  const treeSurface = document.querySelector('[data-gd-region="tree"] .overflow-y-auto') || document.querySelector('[data-gd-region="tree"]');
  ctx(treeSurface, 10, 400);
  await sleep(60);
  ok('0.31.0 right-clicking the TREE EMPTY area offers New class (tree-scoped menu)', () => {
    assert.ok(menuHeader().includes('CLASS TREE'), `the header chip names the tree (got: ${menuHeader()})`);
    const labels = menuLabels();
    assert.ok(labels.some((l) => l.includes('New class')), 'new class offered');
    assert.ok(labels.some((l) => l.includes('Undo')), 'undo offered');
    assert.ok(!labels.some((l) => l.includes('Delete')), 'no delete on empty surface');
    assert.ok(!labels.some((l) => l.includes('Select all')), 'no clipboard crew here');
  });
  escape();
  await sleep(260);

  // --- HEADERS: the toolbar row + the titlebar ---------------------------
  // 0.43.0 — THE BARS STAY QUIET ("to not do anything when right clicking
  // on the toolbars or the headers"): the old TOP BAR menu is retired; the
  // bars themselves open nothing (their KEYS still speak their own options
  // through the button branch).
  const toolbar = document.querySelector('[data-gd-region="header"]');
  ctx(toolbar, 300, 20);
  await sleep(60);
  ok('0.43.0 right-clicking the TOOLBAR header stays QUIET', () => {
    assert.equal(menuHeader(), '', `no menu on the bar (got: ${menuHeader()})`);
    assert.equal(document.querySelectorAll('.gd-ctx-menu').length, 0, 'no menu node at all');
  });
  const titlebar = document.querySelector('.gd-titlebar');
  ctx(titlebar, 200, 10);
  await sleep(60);
  ok('0.43.0 right-clicking the TITLEBAR stays quiet too', () => {
    assert.equal(menuHeader(), '', `no menu on the titlebar (got: ${menuHeader()})`);
  });
  await sleep(60);

  // --- VIEWER EMPTY AREA --------------------------------------------------
  const scroller = document.querySelector('.gd-tex-viewer') || document.querySelector('main');
  ctx(scroller, 400, 300);
  await sleep(60);
  ok('0.31.0 right-clicking the CARD VIEWER empty area: New card + clipboard + settings', () => {
    assert.ok(menuHeader().includes('CARD VIEWER'), `the header chip (got: ${menuHeader()})`);
    const labels = menuLabels();
    assert.ok(labels.some((l) => l.includes('New card')), 'create a new card');
    assert.ok(labels.some((l) => l.includes('New class')), 'new class');
    assert.ok(labels.some((l) => l.includes('Paste image')), 'paste image');
    assert.ok(labels.some((l) => l.includes('Select all')), 'select all');
    assert.ok(labels.some((l) => l.includes('Undo')), 'undo');
    assert.ok(labels.some((l) => l.includes('Redo')), 'redo');
    assert.ok(labels.some((l) => l.includes('Settings')), 'settings');
  });
  escape();
  await sleep(260);

  // --- DUPLICATE, end to end ---------------------------------------------
  const card = document.querySelector('[data-gd-char-id="c1"]');
  ctx(card);
  await sleep(60);
  const dupBtn = [...document.querySelectorAll('.gd-ctx-item')].find((b) => b.textContent.includes('Duplicate'));
  assert.ok(dupBtn, 'the Duplicate entry exists on the card menu');
  dupBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  await sleep(300);
  ok('0.31.0 DUPLICATE runs end-to-end: the images are copied, the clone lands', () => {
    assert.deepEqual(copiedFiles, ['a.png'], 'the version image was copied through the IPC');
    assert.equal(document.querySelectorAll('[data-gd-char-id]').length, 2, 'a second card renders');
    assert.ok(document.body.textContent.includes('amy copy'), 'the copy carries its name');
  });
  escape();
  await sleep(260);

  // --- the FULL VIEW + its regions ----------------------------------------
  key('p', { altKey: true }); // panel off
  await sleep(140);
  document.querySelector('[data-gd-char-id="c1"]').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  await sleep(400);
  const viewSurface = document.querySelector('[data-gd-region="charview"]');
  assert.ok(viewSurface, 'the character view carries its region');
  ctx(viewSurface.querySelector('.py-4') || viewSurface, 300, 260);
  await sleep(60);
  ok('0.31.0 right-clicking the CARD VIEW background speaks card', () => {
    assert.ok(menuHeader().includes('CARD'), `the header chip (got: ${menuHeader()})`);
    const labels = menuLabels();
    assert.ok(labels.some((l) => l.includes('Back to the grid')), 'back to the grid');
    // 0.41.0 — rename is retired; the EDIT CARD window owns the name
    assert.ok(!labels.some((l) => l.includes('Rename')), 'rename is retired (EDIT CARD owns the name)');
    assert.ok(labels.some((l) => l.includes('Copy prompt')), 'copy prompt');
    assert.ok(labels.some((l) => l.includes('Delete')), 'delete (danger)');
    assert.ok(!labels.some((l) => l.includes('New class')), 'no grid crew inside the character view');
  });
  escape();
  await sleep(260);

  // --- the IMAGE STAGE's own menu ------------------------------------------
  const stage = document.querySelector('.gd-stage');
  assert.ok(stage, 'the stage renders');
  ctx(stage, 200, 150);
  await sleep(60);
  ok('0.31.0 right-clicking the IMAGE STAGE gets the image menu (not the surface menu)', () => {
    assert.ok(menuHeader().includes('IMAGE'), `the header chip names the image (got: ${menuHeader()})`);
    const labels = menuLabels();
    assert.ok(labels.some((l) => l.includes('Previous image')), 'previous image');
    assert.ok(labels.some((l) => l.includes('Next image')), 'next image');
    assert.ok(labels.some((l) => l.includes('Set as cover')), 'set as cover');
    assert.ok(labels.some((l) => l.includes('Image manager')), 'the manager key');
    assert.ok(labels.some((l) => l.includes('Delete image')), 'delete image (danger)');
    assert.ok(!labels.some((l) => l.includes('Back to the grid')), 'the parent region menu never painted');
  });
  escape();
  await sleep(260);

  // --- editable targets speak the STYLIZED text menu (0.32.0) ---------------
  // The native menu is retired: right-clicking a field opens the app's own
  // TEXT pill — cut/copy/paste/delete/select-all with selection-aware
  // enablement ("make the selection text context window stylized like the
  // rest").
  const search = document.querySelector('input');
  const searchInput = search || document.querySelector('input[placeholder*="Search"]');
  ctx(searchInput, 60, 12);
  await sleep(60);
  ok('0.32.0 right-clicking an editable field opens the STYLIZED text menu', () => {
    const menu = document.querySelector('.gd-ctx-menu');
    assert.ok(menu, 'the styled menu painted over the input');
    assert.ok(menuHeader().includes('TEXT'), `the header chip names text (got: ${menuHeader()})`);
    const labels = menuLabels();
    assert.ok(labels.some((l) => l === 'Paste'), 'paste (always armed)');
    assert.ok(labels.some((l) => l === 'Select all'), 'select all');
    assert.ok(labels.some((l) => l === 'Copy'), 'copy');
    assert.ok(labels.some((l) => l === 'Delete'), 'delete');
    // a plain <input> keeps its undo on the KEYBOARD only — the menu never
    // offers a key that cannot work (undo/redo ride the rich boxes only)
    assert.ok(!labels.some((l) => l === 'Undo'), 'no lying undo key on a plain input');
    // nothing selected yet: the selection-bound keys arrive disabled
    const disabled = [...document.querySelectorAll('.gd-ctx-item.is-disabled')].map(
      (b) => b.textContent.trim()
    );
    assert.ok(disabled.some((l) => l.includes('Copy')), 'copy disabled with nothing selected');
    assert.ok(disabled.some((l) => l.includes('Delete')), 'delete disabled with nothing selected');
    assert.ok(disabled.some((l) => l.includes('Cut')), 'cut disabled with nothing selected');
  });
  escape();
  await sleep(60);

  // A SELECTION inside the field arms the crew.
  searchInput.focus();
  searchInput.value = 'amy';
  searchInput.select();
  ctx(searchInput, 60, 12);
  await sleep(60);
  ok('0.32.0 a selection in the field ARMS cut / copy / delete', () => {
    const disabled = [...document.querySelectorAll('.gd-ctx-item.is-disabled')].map((b) =>
      b.textContent.trim()
    );
    assert.ok(!disabled.some((l) => l.includes('Copy')), 'copy armed');
    assert.ok(!disabled.some((l) => l.includes('Cut')), 'cut armed');
    assert.ok(!disabled.some((l) => l.includes('Delete')), 'delete armed');
  });
  escape();
  await sleep(260);

  // --- dropdowns never answer the right button (0.32.0) ---------------------
  // A portaled popover (data-gd-popover) is a menu-in-being: right-clicking
  // inside it paints NOTHING.
  const popCard = document.createElement('div');
  popCard.setAttribute('data-gd-popover', '1');
  document.body.append(popCard);
  ctx(popCard, 40, 40);
  await sleep(80);
  ok('0.32.0 right-clicking a DROPDOWN surface paints nothing', () => {
    assert.ok(!document.querySelector('.gd-ctx-menu'), 'no menu over a popover');
  });
  popCard.remove();

  key('p', { altKey: true }); // panel back on (leave clean state)
  await sleep(140);
  root.unmount();
  document.body.innerHTML = '';
}

// ============================================================================
// Part E — the CARD-COLUMN SEPARATOR (drag + commit + clamps)
// ============================================================================
{
  const CharacterView = require(join(appRoot, 'src/components/CharacterView.jsx')).default;
  const character = {
    id: 'c1', name: 'amy', classId: 'root', tags: [], previewVersionId: null,
    cardRatio: null, cardTrim: 'dash', cardCrop: null, stamps: [],
    stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
    createdAt: Date.now(),
    versions: [{ id: 'v1', label: 'V1', color: null, icon: null, images: [{ file: 'a.png', thumb: 'a_t.jpg' }], parts: [], notes: '', createdAt: 1 }],
  };
  const props = {
    character, tags: [], stampLibrary: [], imagesPath: 'C:/img',
    cardDefaultRatio: { w: 3, h: 4 }, outputBarOn: false, showHelp: false,
    onBack: noop, patchCharacter: noop, onRename: noop, onDelete: noop, onToggleTag: noop,
    onOpenTagManager: noop, onAttachStamp: noop, onRemoveStamp: noop, onPromoteStamp: noop,
    onUploadStamp: noop, onRenameStamp: noop, onReorderStamps: noop, onStampColor: noop,
    onStampTransform: noop, confirm: noop, onStatus: noop, onActiveVersion: noop,
  };
  const commits = [];
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(React.createElement(CharacterView, { ...props, cardColWidth: 360, onCardColWidth: (w) => commits.push(w) }));
  await sleep(80);
  const sep = document.querySelector('.gd-cardcol-resize');
  const col = sep?.previousElementSibling?.previousElementSibling || null;
  ok('0.31.0 the SEPARATOR renders between the card column and the merged details', () => {
    assert.ok(sep, 'the separator painted');
    assert.equal(sep.getAttribute('role'), 'separator', 'the separator role');
    assert.ok(col, 'the card column node');
    assert.equal(col.style.width, '360px', 'the column is sized from the setting');
  });
  // drag +40 -> live width 400, commit 400
  sep.dispatchEvent(pointer('pointerdown', 400, 30));
  sep.dispatchEvent(pointer('pointermove', 440, 30));
  await sleep(20);
  ok('0.31.0 a drag writes the LIVE width straight to the column node', () => {
    assert.equal(col.style.width, '400px', 'live width without a re-render');
    assert.equal(commits.length, 0, 'nothing committed mid-drag');
  });
  sep.dispatchEvent(pointer('pointerup', 440, 30));
  await sleep(40);
  ok('0.31.0 release commits ONE width through onCardColWidth', () => {
    assert.deepEqual(commits, [400], 'the final width committed once');
  });
  // wild drag clamps at the max
  sep.dispatchEvent(pointer('pointerdown', 400, 30));
  sep.dispatchEvent(pointer('pointermove', 400 + 5000, 30));
  await sleep(20);
  sep.dispatchEvent(pointer('pointerup', 400 + 5000, 30));
  await sleep(40);
  ok('0.31.0 the clamps hold (a wild drag stops at the max)', () => {
    assert.equal(commits[commits.length - 1], 560, 'clamped to CARD_COL_WIDTH_RANGE.max');
    assert.equal(col.style.width, '560px', 'the node shows the clamped width');
  });
  root.unmount();
  document.body.innerHTML = '';
}

// ============================================================================
// Part F — the SETTLE GUARD (useThumbSort's commit)
// ============================================================================
{
  const { default: useThumbSort } = require(join(appRoot, 'src/components/useThumbSort.js'));
  const commits = [];
  function Strip({ count }) {
    const { bindItem, itemStyle, dragStyle, sorting, sort } = useThumbSort({
      count,
      cols: 1,
      gapX: 8,
      useGeometry: true,
      containerRef: { current: null },
      onCommit: (from, to) => commits.push([from, to]),
      onTap: noop,
    });
    return React.createElement(
      'div',
      { id: 'strip', className: 'gd-sort-list' },
      Array.from({ length: count }, (_, i) =>
        React.createElement(
          'div',
          {
            key: i,
            className: 'gd-sort-item',
            style: { width: 60, height: 60, background: '#333', ...(sorting && sort?.from === i ? dragStyle : itemStyle(i) || {}) },
            ...bindItem(i),
          },
          `item${i}`
        )
      )
    );
  }
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(React.createElement(Strip, { count: 3 }));
  await sleep(40);
  const rows = () => [...document.querySelectorAll('.gd-sort-item')];
  const r0 = rows()[0];
  // stride mode (containerRef null): x movement drives the target slot —
  // 140px right with the 52px fallback stride lands ~2 slots over.
  r0.dispatchEvent(pointer('pointerdown', 30, 30));
  r0.dispatchEvent(pointer('pointermove', 30 + 140, 30));
  await sleep(30);
  r0.dispatchEvent(pointer('pointerup', 30 + 140, 30));
  await sleep(440); // 0.43.0: transitionend-driven commit -> 340ms fallback in jsdom
  const strip = document.querySelector(".gd-sort-list");
  ok('0.31.0 the drag commit settles CLEAN — no leftover gd-settle, order landed', () => {
    assert.deepEqual(commits, [[0, 2]], 'the reorder committed');
    assert.ok(!strip.classList.contains('gd-settle'), 'the settle guard dropped after the settle');
  });
  root.unmount();
  document.body.innerHTML = '';
  ok('0.31.0 the SETTLE GUARD CSS exists (transition-kill for the two frames)', () => {
    const css = readFileSync(join(appRoot, 'src/index.css'), 'utf8');
    assert.ok(/\.gd-settle,/.test(css), 'the gd-settle rule exists');
    assert.ok(/\.gd-settle \*,[^{]*\{\s*transition: none !important/.test(css.replace(/\n/g, ' ')), 'it kills transitions in the whole subtree');
  });
}

// ============================================================================
// Part G — BARE SPOTLIGHT TILES (the spotlight popover)
// ============================================================================
{
  const GridView = require(join(appRoot, 'src/components/GridView.jsx')).default;
  const characters = [
    {
      id: 'c1', name: 'amy', classId: 'root', tags: [], previewVersionId: null,
      cardRatio: null, cardTrim: 'dash', cardCrop: null,
      stamps: [{ id: 's1', image: 'st.png', name: 'seal' }],
      stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
      createdAt: Date.now(),
      versions: [{ id: 'v1', label: 'V1', color: null, icon: null, images: [{ file: 'a.png', thumb: 'a_t.jpg' }], parts: [], notes: '', createdAt: 1 }],
    },
  ];
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(
    React.createElement(GridView, {
      characters, tags: [], stamps: [{ id: 't1', image: 'st.png', name: 'seal', autoColor: null }],
      imagesPath: 'C:/img', zoom: 2, tagScale: 1, tagPosition: 'corner',
      cardRatio: { w: 3, h: 4 }, sortMode: 'custom', search: '', advancedSearch: false,
      classLabel: 'heroes', showHelp: false,
      onSearch: noop, onSort: noop, onNew: noop, onOpen: noop, onRename: noop, onDelete: noop,
      onReorder: noop, onCycleSpotlight: noop, onCycleStampSpotlight: noop, onToggleSpotlightHide: noop,
    })
  );
  await sleep(60);
  const spotBtn = [...document.querySelectorAll('button')].find((b) => (b.getAttribute('title') || '').includes('filter'));
  assert.ok(spotBtn, 'the filter trigger found');
  spotBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  await sleep(60);
  ok('0.31.0 the SPOTLIGHT tiles are BARE — the art box + name only', () => {
    const tile = document.querySelector('.gd-spot-tile.is-bare');
    assert.ok(tile, 'a bare tile rendered');
    assert.ok(tile.querySelector('.gd-spot-tile-box'), 'the 44px art box stays (the container the card wears)');
    assert.ok(tile.textContent.includes('seal'), 'the plain name rides under it');
  });
  ok('0.31.0 the tile CLASSES carry no frame styles (is-bare resets border/background)', () => {
    const css = readFileSync(join(appRoot, 'src/index.css'), 'utf8');
    assert.ok(/\.gd-spot-tile\.is-bare\s*\{/.test(css), 'the is-bare rule exists');
    assert.ok(/\.gd-spot-tile\.is-bare\.is-on \.gd-spot-tile-box/.test(css), 'the selection ring rides the BOX');
  });
  root.unmount();
  document.body.innerHTML = '';
}

assert.equal(errors.length, 0, `no render errors (got: ${errors[0] || 'none'})`);
console.log(`\n${passed} 0.31.0 batch DOM checks passing`);
