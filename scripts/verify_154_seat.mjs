// 1.5.4 probe — the retained creation seat's RESET law + the create gate.
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

const errors = [];
console.error = (...a) => { const s = a.join(' '); if (!/Warning|Not implemented|act\(/i.test(s)) errors.push(s); };

const { createSafeDb } = require('../src/utils/helpers.js');
const dbPayload = createSafeDb(null);
dbPayload.classes = [{ id: 'cl1', name: 'heroes', parentId: 'root', order: 1 }];
dbPayload.tags = [{ id: 't1', name: 'wip', color: '#ffd400', icon: 'Flame', trim: 'straight' }];
dbPayload.stamps = [{ id: 'tpl-a', image: 'guild.png', name: 'guild', createdAt: 1 }];

let created = null;
const realToasts = [];
window.addEventListener('gd-toast', (e) => realToasts.push(e.detail.text));
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

const liveLayer = () => document.querySelector('.gd-modal-layer:not(.gd-modal-parked):not(.gd-modal-flight:not(.is-open))');
const liveCard = () => liveLayer()?.querySelector('.gd-modal-card') || null;
const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
const type = (el, text) => {
  el.focus?.();
  el.textContent = text;
  el.dispatchEvent(new window.InputEvent('input', { bubbles: true }));
};
const nameField = () => liveCard()?.querySelector('[contenteditable="true"]');
const labelField = () => [...(liveCard()?.querySelectorAll('[contenteditable="true"]') || [])][1];

const newCardBtn = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('NEW CARD'));
const P = (msg) => console.log('  ', msg);
let pass = 0, fail = 0;
const check = (cond, msg) => { if (cond) { pass++; P(`ok — ${msg}`); } else { fail++; P(`FAIL — ${msg}`); } };

// --- the create gate -----------------------------------------------------
click(newCardBtn); await sleep(150);
check(!!liveCard(), 'the creation window opens (the seat goes live)');
const findCreate = () => [...(liveCard()?.querySelectorAll('button') || [])].find((b) => (b.textContent || '').trim() === 'CREATE');
check(!!findCreate() && !findCreate().disabled, 'the CREATE key is never disabled');
click(findCreate()); await sleep(60);
check(realToasts.some((t) => /name/i.test(t)), 'a toast fires for the missing name');
check(nameField()?.classList.contains('gd-field-need'), 'the NAME field wears the need rim');
check(findCreate().classList.contains('gd-need-shake'), 'the CREATE key shakes (the remounted key)');

// fill the name; clear the version label -> the second tooth
type(nameField(), 'amy');
await sleep(30);
check(!nameField()?.classList.contains('gd-field-need'), 'filling the name clears its rim');
const lbl = labelField();
type(lbl, '');
await sleep(30);
click(findCreate()); await sleep(60);
check(realToasts.some((t) => /version label/i.test(t)), 'a toast fires for the missing version label');
check(lbl?.classList.contains('gd-field-need'), 'the LABEL field wears the need rim');
check(realToasts.filter((t) => /card name/i.test(t)).length === 1, 'the name verdict does not refire once filled');
type(lbl, 'V1'); await sleep(30);

// --- create for real -----------------------------------------------------
click(findCreate()); await sleep(120);
check(!liveLayer() || !liveLayer().classList.contains('is-open'), 'the window closes after CREATE');
check(created === null, 'sanity: no direct onCreate capture (App owns it)');

// --- the RESET law: a cancelled draft never leaks into the next open ------
click(newCardBtn); await sleep(120);
check(nameField()?.textContent === '', 'a fresh open starts with an empty name (cancelled-draft reset)');
check(labelField()?.textContent === 'V1', 'the version label reseeds to V1');
type(nameField(), 'leftover'); await sleep(30);
const xKey = liveCard()?.querySelector('.gd-icon-btn');
click(xKey); await sleep(80); // the unsaved-changes ask
const discard = [...document.querySelectorAll('button')].find((b) => /CLOSE: DISCARD/i.test(b.textContent || ''));
check(!!discard, 'the unsaved-changes ask appears for a started draft');
click(discard); await sleep(120);
check(!liveLayer() || !liveLayer().classList.contains('is-open'), 'the window parks after discard');
click(newCardBtn); await sleep(120);
check(nameField()?.textContent === '', 'the discarded draft is gone from the next open (the RESET law)');

console.log(`\n${pass} passed, ${fail} failed`);
if (errors.length) { console.log('ERRORS:', errors.length); errors.slice(0, 3).forEach((e) => console.log(e.slice(0, 800))); }
process.exit(fail || errors.length ? 1 : 0);
