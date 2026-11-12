// 1.5.4 probe — does the tag manager over the creation window exit-animate?
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let JSDOM;
try { ({ JSDOM } = require('jsdom')); } catch { console.log('jsdom unavailable'); process.exit(0); }

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>'.replace('</body></body>', '</body>'), {
  pretendToBeVisual: true, url: 'http://localhost/',
});
global.window = dom.window; global.document = dom.window.document;
global.Node = dom.window.Node; global.NodeFilter = dom.window.NodeFilter;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = dom.window.requestAnimationFrame;
global.cancelAnimationFrame = dom.window.cancelAnimationFrame;
for (const k of ['HTMLElement','HTMLDivElement','HTMLImageElement','HTMLInputElement','HTMLTextAreaElement','HTMLButtonElement','HTMLSpanElement','HTMLAnchorElement','Element','SVGElement','Node','File','Blob','FileReader','MutationObserver','CustomEvent','DragEvent','InputEvent','KeyboardEvent','MouseEvent','ClipboardEvent','DataTransfer','Image','ImageBitmap','getSelection','URL','DOMParser']) {
  if (dom.window[k] !== undefined && global[k] === undefined) global[k] = dom.window[k];
}
global.matchMedia = dom.window.matchMedia || (() => ({ matches: false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }));
global.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} };
global.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
global.IS_REACT_ACT_ENVIRONMENT = false;

const React = require('react');
const { createRoot } = require('react-dom/client');
const babel = require('@babel/core');
require.extensions['.jsx'] = (module, filename) => {
  const { code } = babel.transformFileSync(filename, { presets: [['@babel/preset-env', { targets: { node: 'current' } }], ['@babel/preset-react', { runtime: 'automatic' }]] });
  module._compile(code, filename);
};
for (const ext of ['.png','.jpg','.jpeg','.gif','.svg','.ico','.webp','.woff2']) require.extensions[ext] = (module, filename) => { module.exports = filename; };
console.error = () => {};

const { createSafeDb } = require('../src/utils/helpers.js');
const dbPayload = createSafeDb(null);
window.api = {
  loadDB: async () => ({ db: dbPayload, imagesPath: '/mock/images' }),
  saveDB: async () => ({ ok: true }), sendUnsavedState: () => {}, onPromptUnsaved: () => () => {},
  saveAndClose: async () => ({ ok: true }), forceClose: () => {}, windowControl: () => {},
  onWindowMaximized: () => () => {}, onWindowUnmaximized: () => () => {}, openExternal: () => {},
  clipboardReadText: async () => '', clipboardWriteText: async () => {}, importImagesFromFiles: async () => [],
  saveImageBuffer: async () => ({ ok: true, file: 'x.png' }), deleteImageFile: async () => ({ ok: true }),
};

const App = require('../src/App.jsx').default;
const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(3400);

const layers = () => document.querySelectorAll('.gd-modal-layer:not(.gd-modal-parked):not(.gd-modal-flight:not(.is-open))').length;
const clickBtn = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

// open creation window
const newCardBtn = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('NEW CARD'));
clickBtn(newCardBtn);
await sleep(200);
console.log('after creation open: layers =', layers());

// open tag manager via the + key in the creation window (onOpenTagManager)
// NewCharacterModal renders a key whose title/hint mentions the tag manager
const plusKeys = [...document.querySelectorAll('.gd-modal-layer:not(.gd-modal-parked):not(.gd-modal-flight:not(.is-open)) .gd-modal-card button')];
const tagBtn = plusKeys.find((b) => /tag/i.test(b.title || '') || /TAG/i.test(b.textContent || ''));
console.log('tag manager key found:', !!tagBtn, tagBtn ? (tagBtn.title || tagBtn.textContent.slice(0, 40)) : '');
if (tagBtn) {
  clickBtn(tagBtn);
  await sleep(200);
  console.log('after tag manager open: layers =', layers());
  const mgrCards = [...document.querySelectorAll('.gd-modal-layer:not(.gd-modal-parked):not(.gd-modal-flight:not(.is-open)) .gd-modal-card')].filter((c) => /TAG MANAGER/i.test(c.textContent || ''));
  console.log('tag manager card present:', mgrCards.length > 0);
  // close it via its header X
  const x = mgrCards[0]?.querySelector('.gd-icon-btn');
  console.log('close key found:', !!x);
  if (x) {
    clickBtn(x);
    // sample the layer count over time — an exit flight lingers ~120ms
    for (const ms of [0, 30, 60, 100, 150, 250, 400]) {
      await sleep(ms === 0 ? 0 : ms - (ms === 30 ? 30 : ms === 60 ? 30 : ms === 100 ? 40 : ms === 150 ? 50 : ms === 250 ? 100 : 150));
      console.log(`  t+~${ms}ms: layers =`, layers(), '| tagmgr card alive:', [...document.querySelectorAll('.gd-modal-card')].some((c) => /TAG MANAGER/i.test(c.textContent || '')));
    }
  }
}
process.exit(0);
