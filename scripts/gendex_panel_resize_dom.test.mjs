// 0.29.0 — THE PANEL EDGE RESIZERS + THE STAMP SLOT HANDS, behavioral DOM
// tests on the real components.
//   Part A — PanelResizer through the real App: both edge handles render,
//     a drag writes the live width straight to the column node, the release
//     commits the SETTING (one undo step), clamps hold, and undo reverts.
//   Part B — StampSlots: the pencil is a visual-only badge (span, never a
//     button), the slot's one tooltip reads "drag to rearrange, click to
//     edit", a press that MOVES drags (even when it starts on the pencil
//     badge — pointer-events: none), and a plain click opens the window.
// Run: node --test scripts/gendex_panel_resize_dom.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch {
  console.log('jsdom unavailable — panel resize / stamp hands test skipped');
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
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;
global.NodeFilter = dom.window.NodeFilter;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = dom.window.requestAnimationFrame;
global.cancelAnimationFrame = dom.window.cancelAnimationFrame;
for (const k of ['HTMLElement', 'HTMLDivElement', 'HTMLImageElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLButtonElement', 'HTMLSpanElement', 'Element', 'SVGElement', 'Node', 'File', 'Blob', 'FileReader', 'MutationObserver', 'DragEvent', 'InputEvent', 'KeyboardEvent', 'MouseEvent', 'ClipboardEvent', 'DataTransfer', 'Image', 'getSelection', 'URL', 'DOMParser']) {
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
          cardRatio: { w: 3, h: 4 }, cardTrim: 'dash', cardCrop: null, stamps: [],
          stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
          createdAt: Date.now(),
          versions: [ { id: 'v1', label: 'V1', color: null, icon: null, images: [], parts: [], notes: '', createdAt: 1 } ],
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let passed = 0;
const ok = (name, fn) => {
  const result = fn();
  const done = () => {
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  };
  if (result && typeof result.then === 'function') return result.then(done);
  done();
  return Promise.resolve();
};

// A pointer event jsdom accepts (PointerEvent may be missing entirely).
const pointer = (type, x) => {
  const E = dom.window.PointerEvent || dom.window.MouseEvent;
  return new E(type, { bubbles: true, cancelable: true, clientX: x, clientY: 40, button: 0 });
};

// ---------------------------------------------------------------------------
// Part A — the resizers through the real App.
// ---------------------------------------------------------------------------
const App = require(join(appRoot, 'src/App.jsx')).default;
// 1.1.5 — the panel's rendered width is ROOM-AWARE (it yields when the
// window cannot fit the tree + the panel + a livable viewer column); jsdom's
// default 1024px viewport would seat it at 464 instead of the 480 setting,
// so this suite rides a wide window — the default width renders whole.
Object.defineProperty(window, 'innerWidth', { value: 1600, configurable: true });
const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));
await sleep(3400); // the full splash timeline

const card = document.querySelector('.gd-card-collector');
assert.ok(card, 'the grid mounted');
card.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
await sleep(260);

const leftCol = () => document.querySelector('.gd-leftcol') || document.querySelector('[data-side="left"]')?.parentElement;
const aside = () => document.querySelector('aside');

ok('both edge handles render — the left tree\'s right edge and the panel\'s left edge', () => {
  const leftHandle = document.querySelector('.gd-panel-resize[data-side="left"]');
  const rightHandle = document.querySelector('.gd-panel-resize[data-side="right"]');
  assert.ok(leftHandle, 'the LEFT handle is there');
  assert.ok(rightHandle, 'the RIGHT handle is there');
  assert.equal(leftHandle.getAttribute('role'), 'separator');
  assert.equal(leftHandle.getAttribute('title'), 'Drag to resize the class tree: the width is saved (and undo-able)');
  assert.ok(aside(), 'the panel is open (its handle only exists while it is)');
});

await ok('dragging the LEFT handle writes the live width to the column node (no re-render needed)', async () => {
  const handle = document.querySelector('.gd-panel-resize[data-side="left"]');
  const col = leftCol();
  assert.match(col.getAttribute('style') || '', /width:\s*240px/, 'starts at the 240 default');
  handle.dispatchEvent(pointer('pointerdown', 240));
  assert.ok(document.body.classList.contains('gd-resizing'), 'the body pins the ew-resize cursor during the drag');
  handle.dispatchEvent(pointer('pointermove', 292));
  await sleep(20);
  assert.match(col.getAttribute('style') || '', /width:\s*292px/, 'the live width follows the pointer (240 + 52)');
  handle.dispatchEvent(pointer('pointerup', 292));
  await sleep(40);
  assert.ok(!document.body.classList.contains('gd-resizing'), 'the body class clears on release');
});

ok('the released width COMMITTED as the sidebarWidth setting (one undo step)', () => {
  const col = leftCol();
  assert.match(col.getAttribute('style') || '', /width:\s*292px/, 'the column now wears the committed width');
});

await ok('dragging the RIGHT handle (leftward = wider) commits panelWidth', async () => {
  const handle = document.querySelector('.gd-panel-resize[data-side="right"]');
  const panel = aside();
  // 0.38.0 — the aside's width ANIMATES (fractional mid-flight); the exact
  // React-applied px ride the inner .gd-tex-panel wrapper.
  const inner = panel.querySelector('.gd-tex-panel');
  assert.match(inner.getAttribute('style') || '', /width:\s*480px/, 'starts at the 480 default');
  /* 1.2.0: the aside's OPEN animation (0.22s) and the resizer's live writes
     fight for the width node until the flight ends — a drag that lands in
     the flight's last frame gets stomped back (observed: 475.59 at opacity
     0.996). Let the mount flight finish before grabbing the handle. */
  await sleep(320);
  handle.dispatchEvent(pointer('pointerdown', 800));
  handle.dispatchEvent(pointer('pointermove', 730)); // 70px leftward
  await sleep(20);
  assert.match(panel.getAttribute('style') || '', /width:\s*550px/, 'the live width grows (480 + 70)');
  handle.dispatchEvent(pointer('pointerup', 730));
  await sleep(40);
  const innerAfter = aside().querySelector('.gd-tex-panel');
  assert.match(innerAfter.getAttribute('style') || '', /width:\s*550px/, 'committed');
});

await ok('the clamp holds: a wild drag stops at the max', async () => {
  const handle = document.querySelector('.gd-panel-resize[data-side="left"]');
  const col = leftCol();
  handle.dispatchEvent(pointer('pointerdown', 292));
  handle.dispatchEvent(pointer('pointermove', 4000)); // absurd
  await sleep(20);
  assert.match(col.getAttribute('style') || '', /width:\s*400px/, 'clamped to the 400 max');
  handle.dispatchEvent(pointer('pointerup', 4000));
  await sleep(40);
});

await ok('UNDO reverts committed resizes (the widths are real history entries)', async () => {
  // undo thrice: the 400 commit, the 550 panel commit, the 292 commit —
  // back to the pristine 240.
  const undoBtn = document.querySelector('[title^="Undo"]');
  assert.ok(undoBtn && !undoBtn.disabled, 'there is undo history');
  for (let i = 0; i < 3; i++) {
    undoBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
    await sleep(60);
  }
  const col = leftCol();
  assert.match(col.getAttribute('style') || '', /width:\s*240px/, 'undo rolled the width back to the default');
});

// ---------------------------------------------------------------------------
// Part B — the stamp slot hands (badge never blocks the grab).
// ---------------------------------------------------------------------------
root.unmount();
await sleep(30);
const { StampSlots } = require(join(appRoot, 'src/components/StampEditModal.jsx'));

const commits = [];
let renames = [];
const root2 = createRoot(document.getElementById('root'));
root2.render(
  React.createElement(StampSlots, {
    stamps: [
      { id: 's1', image: 'guild.png', name: 'guild' },
      { id: 's2', image: 'seal.png', name: 'seal' },
      { id: 's3', image: 'mark.png', name: 'mark' },
    ],
    imagesPath: 'C:/img',
    onRemove: () => {},
    onPromote: () => {},
    onReorder: (from, to) => commits.push([from, to]),
    onRename: (i, name) => renames.push([i, name]),
  })
);
await sleep(60);

ok('the pencil is a visual-only BADGE — a span, never a button', () => {
  const badge = document.querySelector('.gd-stamp-slot-edit');
  assert.ok(badge, 'the badge renders');
  assert.equal(badge.tagName, 'SPAN', 'it is a span (no button semantics, no own tooltip)');
  assert.equal(badge.getAttribute('aria-hidden'), 'true');
});

ok('the slot\'s ONE tooltip reads "drag to rearrange, click to edit"', () => {
  const slots = document.querySelectorAll('.gd-stamp-slot');
  assert.equal(slots.length, 3);
  const title = slots[0].dataset.gdTipSrc || slots[0].getAttribute('title') || '';
  assert.match(title, /guild: drag to rearrange, click to edit/, 'short, single, exactly the ask');
});

await ok('a press that MOVES drags — even when it starts ON the pencil badge', async () => {
  // 0.38.0 — the drop target is the nearest INSERTION GAP now, so the test
  // needs REAL geometry (jsdom's getBoundingClientRect is all zeros, which
  // the old center-match quietly degenerated on). Lay the three slots out
  // at 44px + 8px gap and drag the middle one LEFTWARD past the first gap.
  const realRect = dom.window.Element.prototype.getBoundingClientRect;
  dom.window.Element.prototype.getBoundingClientRect = function () {
    const parent = this.parentElement;
    if (parent && (this.classList?.contains('gd-sort-item') || this.classList?.contains('gd-stamp-slot'))) {
      const idx = Array.from(parent.children).indexOf(this);
      if (idx >= 0) return { left: idx * 52, top: 0, right: idx * 52 + 44, bottom: 44, width: 44, height: 44, x: idx * 52, y: 0 };
    }
    // 0.41.0 — the strip container gets a real wide box too, so the drag's
    // CONTAINER CLAMP is genuinely in play (the 60px ride stays well inside).
    if (this.classList?.contains('gd-stamp-slots')) {
      return { left: 0, top: 0, right: 800, bottom: 44, width: 800, height: 44, x: 0, y: 0 };
    }
    return realRect.call(this);
  };
  const slot = document.querySelectorAll('.gd-stamp-slot')[1];
  const badge = slot.querySelector('.gd-stamp-slot-edit');
  // dispatching ON the badge mimics the pointer sitting over its art (the
  // CSS pointer-events:none makes the browser retarget to the slot; jsdom
  // just bubbles — same outcome: the SLOT owns the press).
  badge.dispatchEvent(pointer('pointerdown', 160));
  badge.dispatchEvent(pointer('pointermove', 100)); // 60px leftward — past the 5px threshold, past slot 0's gap
  await sleep(20);
  assert.ok(slot.classList.contains('is-dragging'), 'the drag engaged from the badge press');
  // 0.41.0 — the ride is CLAMPED to the strip's own box: slot 1 sits at
  // x=52 inside the (mocked) 800px container, so a 60px leftward pull pins
  // its left edge 2px inside the container's start — translate(-50px).
  // The DROP GAP still reads the unclamped pointer, so the reorder below
  // targets slot 0 exactly as before.
  assert.match(slot.style.transform || '', /translate\(-50px/, 'the grabbed slot follows the pointer (clamped to the strip)');
  badge.dispatchEvent(pointer('pointerup', 100));
  await sleep(440); // 0.43.0: the settle animation + transitionend-driven commit (jsdom: 340ms fallback)
  dom.window.Element.prototype.getBoundingClientRect = realRect;
  assert.ok(commits.length >= 1, 'the reorder committed');
  assert.deepEqual(commits[commits.length - 1], [1, 0], 'slot 1 moved to the front');
});

await ok('a plain CLICK (no movement) opens the stamp window', async () => {
  const slot = document.querySelectorAll('.gd-stamp-slot')[2];
  slot.dispatchEvent(pointer('pointerdown', 300));
  slot.dispatchEvent(pointer('pointerup', 300));
  await sleep(40);
  assert.ok(document.body.innerHTML.includes('EDIT STAMP'), 'the stamp window opened');
  assert.ok(document.body.innerHTML.includes('value="mark"'), 'carrying the clicked slot\'s name');
});

assert.equal(errors.length, 0, `no render errors (got: ${errors[0] || 'none'})`);
root2.unmount();
console.log(`\n${passed} panel-resize + stamp-hands DOM checks passing`);
