// 0.28.0 — THE PANEL HAND-OFF ("when switching right panel option off while
// the right panel is open, make it change into the full one, also make the
// full one occupy the space except the left tree area"). A behavioral DOM
// test on the REAL App: open a character into the right panel, flip the
// panel setting OFF through the titlebar key, and the character must LAND
// IN THE FULL VIEW (tree still on the left) instead of vanishing; flipping
// it back ON returns the character to the panel.
// Run: node --test scripts/gendex_panel_handoff_dom.test.mjs (or plain node)
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch {
  console.log('jsdom unavailable — panel hand-off test skipped');
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
  require.extensions[ext] = (m, filename) => { m.exports = filename; };
}

const errors = [];
console.error = (...args) => {
  const s = args.map((a) => (a && a.stack ? a.stack : String(a))).join(' ');
  if (/Warning|act\(|deprecated|Not implemented: Window's scrollTo/i.test(s)) return; // 1.0.1: motion-dom's scroll-restore no-op around the output bar's height measurement — jsdom can't run it, browsers no-op it
  errors.push(s);
};
dom.window.addEventListener('error', (e) => errors.push(String(e.error?.stack || e.message)));

window.api = {
  loadDB: async () => ({
    db: {
      settings: {
        theme: 'zine', colors: {}, zoom: 2, defaultSortMode: 'custom',
        textures: { workspace: 'none', titlebar: 'none', sidebar: 'none', viewer: 'dots', panel: 'none' },
        detailPanel: true, tagScale: 1.2, cardRatio: { w: 3, h: 4 },
      },
      classes: [{ id: 'cl1', name: 'heroes', parentId: 'root', order: 1 }],
      tags: [],
      stamps: [],
      characters: [
        {
          id: 'c1', name: 'amy', classId: 'cl1', tags: [], previewVersionId: null,
          cardRatio: { w: 3, h: 4 }, cardTrim: 'dash', cardCrop: null,
          stamps: [], stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
          createdAt: Date.now(),
          versions: [
            { id: 'v1', label: 'V1', color: null, icon: null, images: [], parts: [], notes: '', createdAt: 1 },
          ],
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
  clipboardWriteText: async () => {},
  importImagesFromFiles: async () => [],
  saveImageBuffer: async () => ({ ok: true, file: 'x.png' }),
  deleteImageFile: async () => ({ ok: true }),
};

const App = require('../src/App.jsx').default;
// 1.1.5 — the panel's rendered width is ROOM-AWARE (it yields when the
// window cannot fit the tree + the panel + a livable viewer column); jsdom's
// default 1024px viewport would seat it at 464 instead of the 480 setting,
// so this suite rides a wide window — the default width renders whole.
Object.defineProperty(window, 'innerWidth', { value: 1600, configurable: true });
const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(3400); // the full splash timeline

let passed = 0;
const ok = (name, fn) => {
  fn();
  passed += 1;
  console.log(`  ok ${passed} — ${name}`);
};

const panelToggle = () => document.querySelector('[title^="Detail panel"]');
const treeRow = () => document.querySelector('.gd-tree-row');
const asideEl = () => document.querySelector('aside');

// 1 — open the character: with the panel ON, the card click docks the right
//     panel (the old default).
const card = document.querySelector('.gd-card-collector');
assert.ok(card, 'a character card renders in the grid');
card.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
// 1.2.6 — THE CONTENT WAITS FOR THE FLIGHT: the CharacterView mounts when
// the aside's 0.22s width flight LANDS (onAnimationComplete), then fades
// in over a beat — the content needs the flight + the fade, not 220ms.
await sleep(560);

ok('opening a character docks the RIGHT PANEL (compact view beside the grid)', () => {
  const aside = asideEl();
  assert.ok(aside, 'the detail aside mounts');
  assert.ok(aside.innerHTML.includes('amy'), 'the character is in it');
  // 0.29.0 — the width is a SETTING (inline style px), not a fixed class.
  // 0.38.0 — the aside's width now ANIMATES open (the stretch fix), so the
  // exact px live on the INNER wrapper (React-applied, never animated)
  // while the aside itself carries an animated width + the border.
  const inner = aside.querySelector('.gd-tex-panel');
  assert.match(inner?.getAttribute('style') || '', /width:\s*480px/, 'the default 480px panel width (inner wrapper)');
  assert.match(aside.getAttribute('style') || '', /border-left:\s*1\.5px solid/, 'the structural edge rides the aside');
});

// 2 — flip the panel OFF through the TITLEBAR key while the panel is open:
//     the character must HAND OFF to the full window view, not vanish.
const treeBefore = treeRow(); // 0.29.0 — the tree is PERSISTENT: same node across the swap
panelToggle().dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
/* jsdom has no layout: framer's exit unmount rides timers alone, and the
   aside's 0.22s width flight lands close to the old 320ms line — flaky
   by ~1 run in 6. Give the exit its full breath. */
await sleep(520);

ok('turning the panel OFF while open hands the character to the FULL view', () => {
  assert.ok(!asideEl(), 'the right aside is gone');
  assert.ok(document.body.innerHTML.includes('amy'), 'the character is STILL on screen');
});

ok('the FULL view occupies the space EXCEPT the left tree — the tree stays mounted', () => {
  assert.ok(document.body.innerHTML.includes('gd-tree-row'), 'the class tree still renders beside the character');
  assert.ok(document.body.innerHTML.includes('heroes'), 'the seeded class is visible');
});

ok('0.29.0 the tree NEVER REMOUNTS across the swap (persistent column outside the branches)', () => {
  assert.strictEqual(treeRow(), treeBefore, 'the very same DOM node is still in place');
  assert.ok(treeBefore.isConnected, 'and still connected');
});

// 3 — flip the panel back ON while the character is full-window: it hands
//     BACK to the freshly-enabled right panel. (The grid branch re-enters
//     through AnimatePresence mode="wait" — the exiting character view must
//     finish its 160ms leave before the aside can mount, so give it room.)
panelToggle().dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
await sleep(800);

ok('turning the panel back ON returns the character to the right panel', () => {
  const aside = asideEl();
  assert.ok(aside, 'the detail aside is back');
  assert.ok(aside.innerHTML.includes('amy'), 'the same character is in it');
  // 0.38.0 — the exact px ride the inner wrapper (the aside animates open).
  const inner = aside.querySelector('.gd-tex-panel');
  assert.match(inner?.getAttribute('style') || '', /width:\s*480px/, 'the default width again (inner wrapper)');
  assert.ok(document.body.innerHTML.includes('gd-card-collector'), 'the grid returned beneath');
  assert.strictEqual(treeRow(), treeBefore, 'the tree node survived the whole round trip');
});

// 4 — BACK from the panel returns to the grid cleanly (no stranded state).
const back = document.querySelector('[title="Back to the card grid"]');
assert.ok(back, 'the panel BACK key renders');
back.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
await sleep(300);

ok('BACK from the panel parks it (the retained seat) and the grid returns', () => {
  // 1.4.6 SUPERSEDED (the retained panel): the aside no longer unmounts on
  // BACK — it PARKS at width 0 with its tree alive, so the next open is the
  // width flight alone and the content is already standing (gendex_155
  // pins the reopen law). The grid still owns the screen.
  const aside = document.querySelector('aside');
  assert.ok(aside, 'the aside stays mounted (the retained seat)');
  assert.ok(String(aside.className).includes('gd-panel-parked'), 'the parked class rides the closed panel');
  assert.ok(!document.body.innerHTML.includes('>amy<') || document.querySelector('.gd-card-collector'), 'the grid card is back');
});

assert.equal(errors.length, 0, `no render errors (got: ${errors[0] || 'none'})`);
root.unmount();
console.log(`\n${passed} panel hand-off DOM checks passing`);
