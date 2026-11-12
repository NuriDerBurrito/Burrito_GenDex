// 0.24.0 grey-screen diagnosis: mount the REAL App with createRoot in jsdom,
// mock window.api, let the splash timeline run, and report any crash with a
// stack trace + what's left in #root.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch {
  console.log('jsdom unavailable — app boot test skipped');
  process.exit(0);
}

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></body></html>'.replace('</body></body>', '</body>'), {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;
global.NodeFilter = dom.window.NodeFilter;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = dom.window.requestAnimationFrame;
global.cancelAnimationFrame = dom.window.cancelAnimationFrame;
// DOM classes framer-motion probes for (they exist in any real browser).
for (const k of ['HTMLElement', 'HTMLDivElement', 'HTMLImageElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLButtonElement', 'HTMLSpanElement', 'HTMLAnchorElement', 'Element', 'SVGElement', 'Node', 'File', 'Blob', 'FileReader', 'MutationObserver', 'CustomEvent', 'DragEvent', 'InputEvent', 'KeyboardEvent', 'MouseEvent', 'ClipboardEvent', 'DataTransfer', 'Image', 'ImageBitmap', 'getSelection', 'URL', 'DOMParser']) {
  if (dom.window[k] !== undefined && global[k] === undefined) global[k] = dom.window[k];
}
global.matchMedia = dom.window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
global.IS_REACT_ACT_ENVIRONMENT = false;

const React = require('react');
const { createRoot } = require('react-dom/client');
const babel = require('@babel/core');
require.extensions['.jsx'] = (module, filename) => {
  const { code } = babel.transformFileSync(filename, {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      ['@babel/preset-react', { runtime: 'automatic' }],
    ],
  });
  module._compile(code, filename);
};
for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff2']) {
  require.extensions[ext] = (module, filename) => { module.exports = filename; };
}

const errors = [];
const origError = console.error;
console.error = (...args) => {
  const s = args.map((a) => (a && a.stack ? a.stack : String(a))).join(' ');
  if (/Warning|act\(|deprecated|Not implemented: Window's scrollTo/i.test(s)) return; // noise (1.0.1: the scrollTo line is motion-dom's scroll-restore no-op around the output bar's height measurement — jsdom can't run it, browsers no-op it)
  errors.push(s);
  origError('[RENDER ERROR]', ...args);
};
dom.window.addEventListener('error', (e) => errors.push(String(e.error?.stack || e.message)));
process.on('uncaughtException', (e) => { errors.push('UNCAUGHT ' + (e.stack || e)); });

// ---------------------------------------------------------------------------
// Mock window.api — mirrors preload.js surface.
// SCENARIO picked by argv: fresh (no db) | old (0.23.0-shaped db, missing the
// 0.24.0 settings keys) | current (db as 0.24.0 writes it).
// ---------------------------------------------------------------------------
const scenario = process.argv[2] || 'fresh';
let dbPayload = null;
if (scenario === 'old' || scenario === 'poison') {
  dbPayload = {
    settings: {
      theme: 'zine', colors: {}, zoom: 2, defaultSortMode: 'custom',
      textures: { workspace: 'none', titlebar: 'none', sidebar: 'none', viewer: 'dots', panel: 'none' },
      detailPanel: true, tagScale: 1.2, cardRatio: { w: 3, h: 4 },
      // NOTE: no tagPosition / defaultTagZoom — 0.23.0 db shape
    },
    // realistic 0.23.0 tree: NO stored root node (root is virtual) + one
    // user subclass. The 'poison' variant smuggles a {id:'root'} class in —
    // the exact data that looped ClassSidebar to death before the fix.
    classes: scenario === 'poison'
      ? [{ id: 'root', name: 'All', parentId: null, order: 0 }, { id: 'cl1', name: 'heroes', parentId: 'root', order: 1 }]
      : [{ id: 'cl1', name: 'heroes', parentId: 'root', order: 1 }],
    tags: [{ id: 't1', name: 'wip', color: '#ffd400', icon: 'Flame', trim: 'straight' }],
    stamps: [{ id: 'tpl-a', image: 'guild.png', name: 'guild', createdAt: 1 }],
    characters: [
      {
        id: 'c1', name: 'amy', classId: 'cl1', tags: ['t1'], previewVersionId: null,
        cardRatio: { w: 4, h: 7 }, cardTrim: 'ledger', cardCrop: null,
        stamps: [{ id: 's1', image: 'guild.png', name: 'guild' }],
        stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
        createdAt: Date.now(),
        versions: [
          {
            id: 'v1', label: 'V1', color: '#c8402f', icon: null,
            images: [{ file: 'a.png', thumb: 'a_t.jpg' }],
            parts: [{ id: 'p1', name: 'body', content: 'soft shading', include: true }],
            notes: 'first pass', createdAt: 1,
          },
        ],
      },
    ],
  };
} else if (scenario === 'current') {
  const { createSafeDb } = require('../src/utils/helpers.js');
  dbPayload = createSafeDb(null);
}

window.api = {
  loadDB: async () => ({ db: dbPayload, imagesPath: '/mock/images' }),
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
  importImagesFromFiles: async () => [],
  saveImageBuffer: async () => ({ ok: true, file: 'x.png' }),
  deleteImageFile: async () => ({ ok: true }),
};

const App = require('../src/App.jsx').default;
const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));

// Let the splash timeline (2500ms min + 500ms fade + buffer) run for real.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(3400);

const rootHtml = document.getElementById('root').innerHTML;
origError(`\n--- scenario=${scenario} ---`);
origError(`root length: ${rootHtml.length}`);
origError(`splash still mounted: ${rootHtml.includes('splash-logo-animate')}`);
origError(`grid/card content mounted: ${/gd-grid|gd-card|gd-character/.test(rootHtml)}`);
origError(`titlebar mounted: ${rootHtml.includes('gd-titlebar')}`);
origError(`db snapshot mirrored: ${!!window.__GENDX_DB}`);
origError(`reduced-motion class off by default: ${!document.documentElement.classList.contains('gd-reduced-motion')}`);
if (errors.length) {
  origError(`\n=== ${errors.length} ERROR(S) ===`);
  errors.slice(0, 5).forEach((e, i) => origError(`\n[${i + 1}] ${e.slice(0, 2500)}`));
  process.exitCode = 1;
} else {
  origError('\nno render errors');
}

// ---------------------------------------------------------------------------
// PHASE 2 — ErrorBoundary crash recovery (client mount, the exact structure
// renderer.js ships). A Bomb child throws; the boundary must paint the crash
// panel (NOT a grey void), offer SAVE & RELOAD enabled by the snapshot App
// mirrored in phase 1, and clicking it must route the snapshot into api.saveDB.
// ---------------------------------------------------------------------------
if (!process.exitCode) {
  const savedCalls = [];
  const realSave = window.api.saveDB;
  window.api.saveDB = async (db) => { savedCalls.push(db); return realSave(db); };
  window.addEventListener('error', (e) => e.preventDefault?.());

  const ErrorBoundary = require('../src/components/ErrorBoundary.jsx').default;
  const Bomb = () => { throw new Error('kaboom-tripwire'); };
  const host2 = document.createElement('div');
  document.body.appendChild(host2);
  const root2 = createRoot(host2);
  const boundary = React.createElement(ErrorBoundary, null, React.createElement(Bomb));
  // React logs the caught error via console.error — route it away from the
  // pass/fail report by matching only phase-1 errors above.
  const quiet = console.error;
  console.error = () => {};
  root2.render(boundary);
  await sleep(150);
  console.error = quiet;

  const crashHtml = host2.innerHTML;
  origError('\n--- phase 2: ErrorBoundary ---');
  origError(`crash panel painted: ${crashHtml.includes('gd-crash-panel')}`);
  origError(`error text shown: ${crashHtml.includes('kaboom-tripwire')}`);
  origError(`save+reload key present: ${crashHtml.includes('SAVE &amp; RELOAD') || crashHtml.includes('SAVE & RELOAD')}`);
  const saveBtn = host2.querySelector('.gd-crash-save');
  origError(`save key enabled by snapshot: ${!!saveBtn && !saveBtn.disabled}`);
  if (!crashHtml.includes('gd-crash-panel') || !saveBtn || saveBtn.disabled) process.exitCode = 1;

  if (saveBtn && !saveBtn.disabled) {
    saveBtn.click();
    await sleep(150);
    origError(`snapshot routed to saveDB: ${savedCalls.length === 1 && savedCalls[0] === window.__GENDX_DB}`);
    if (!(savedCalls.length === 1 && savedCalls[0] === window.__GENDX_DB)) process.exitCode = 1;
    // the reload after save: jsdom has no real navigation — reload is a
    // no-op stub, so just assert the state label flipped.
    origError(`saved state label: ${host2.innerHTML.includes('SAVED')}`);
  }
}
process.exit(process.exitCode || 0);
