// 1.5.4 probe — measure the NEW CARD window's mount cost in jsdom
// (pure React + jsdom DOM work — the closest harness approximation of the
// click-to-paint gap the user reports as "still quite delayed").
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch {
  console.log('jsdom unavailable — probe skipped');
  process.exit(0);
}

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>'.replace('</body></body>', '</body>'), {
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
require.Extensions = null;
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

console.error = console.log; // keep react warnings visible as plain logs
const errors = [];
dom.window.addEventListener('error', (e) => errors.push(String(e.error?.stack || e.message)));

const { createSafeDb } = require('../src/utils/helpers.js');
const dbPayload = createSafeDb(null);
// give the db some content so the app isn't in an empty state
dbPayload.classes = [{ id: 'cl1', name: 'heroes', parentId: 'root', order: 1 }];
dbPayload.tags = [{ id: 't1', name: 'wip', color: '#ffd400', icon: 'Flame', trim: 'straight' }];
dbPayload.stamps = [{ id: 'tpl-a', image: 'guild.png', name: 'guild', createdAt: 1 }];

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(3400);
console.log('prewarm armed at click time:', document.querySelectorAll('.gd-modal-flight:not(.is-open)').length > 0);
// if not armed yet, wait for it (db may land late in the splash)
for (let i = 0; i < 20 && document.querySelectorAll('.gd-modal-flight:not(.is-open)').length === 0; i++) await sleep(250);
console.log('prewarm armed after wait:', document.querySelectorAll('.gd-modal-flight:not(.is-open)').length > 0);

const countNodes = (el) => el.querySelectorAll('*').length;
const modalNodes = () => document.querySelectorAll('.gd-modal-layer:not(.gd-modal-parked):not(.gd-modal-flight:not(.is-open)), [data-gd-modal="1"]').length;

// find the NEW CARD key in the sidebar dock
const btns = [...document.querySelectorAll('button')];
const newCardBtn = btns.find((b) => (b.textContent || '').includes('NEW CARD'));
console.log('new card button found:', !!newCardBtn);
if (!newCardBtn) process.exit(1);

const t0 = performance.now();
newCardBtn.click();
// wait for the sync commit + passive effects to land
await sleep(0);
const t1 = performance.now();
await sleep(60);
const t2 = performance.now();

const layer = document.querySelector('.gd-modal-layer:not(.gd-modal-parked):not(.gd-modal-flight:not(.is-open))');
const card = document.querySelector('.gd-modal-layer:not(.gd-modal-parked):not(.gd-modal-flight:not(.is-open)) .gd-modal-card');
console.log('--- creation window open probe ---');
console.log('click -> commit+effects(ms):', (t1 - t0).toFixed(1));
console.log('total incl settle(ms):', (t2 - t0).toFixed(1));
console.log('modal layer mounted:', !!layer);
console.log('modal card mounted:', !!card);
if (card) {
  console.log('modal tree node count:', card.querySelectorAll('*').length);
  console.log('card height style:', card.getAttribute('style'));
}
console.log('title of card:', card?.textContent?.slice(0, 80));

// second open (close then reopen) for comparison
const closeX = card?.querySelector('.gd-icon-btn');
closeX?.click();
await sleep(400);  // 1.5.4: past the exit flight — a true cold remount
const t3 = performance.now();
newCardBtn.click();
await sleep(0);
const t4 = performance.now();
await sleep(60);
console.log('--- reopen probe ---');
console.log('click -> commit+effects(ms):', (t4 - t3).toFixed(1));
const card2 = document.querySelector('.gd-modal-layer:not(.gd-modal-parked):not(.gd-modal-flight:not(.is-open)) .gd-modal-card');
console.log('remounted card nodes:', card2 ? card2.querySelectorAll('*').length : 0);

if (errors.length) {
  console.log('\nERRORS:', errors.length);
  errors.slice(0, 3).forEach((e) => console.log(e.slice(0, 1200)));
}

process.exit(errors.length ? 1 : 0);
