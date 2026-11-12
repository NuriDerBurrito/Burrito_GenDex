// 0.35.0 — THE GLOBAL FEEDBACK LAYER, behavioral DOM tests on the real
// components / the real sources.
//   Part A — THE EMITTER (utils/toasts.js): gdToast fires a gd-toast
//     CustomEvent through window's own constructor, guards the server
//     render, and defaults to the ok tone.
//   Part B — THE HUB (ToastHub.jsx): lazy body portal (nothing paints
//     until the first verdict), ok + fail tones, the capped stack (three
//     pills max), self-decay (~2.4s), and the CSS guards that pin the
//     stack at the screen top ABOVE every layer (z-1100).
//   Part C — THE REAL APP: every action verdict now toasts — creating a
//     class, creating a character, manual saving (Ctrl+S) — and a toast
//     paints while the SETTINGS WINDOW IS OPEN ("visible even when in
//     other windows"), riding above the modal layer.
//   Part D — THE TONE LAWS (sources): autosave toasts "Auto-saved ✓" and
//     never a plain "Saved ✓" (the `=== true` flag guards the titlebar's
//     click-event pass-through), interim chatter stays quiet
//     ("Duplicating…"), and the failure sites carry the fail tone.
// Run: node scripts/gendex_035_batch_dom.test.mjs
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
  console.log('jsdom unavailable — 0.35.0 batch DOM test skipped');
  process.exit(0);
}

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
global.Image = dom.window.Image;
global.IS_REACT_ACT_ENVIRONMENT = false;
for (const k of ['HTMLElement', 'Element', 'SVGElement', 'MutationObserver', 'CustomEvent', 'DragEvent', 'InputEvent', 'KeyboardEvent', 'MouseEvent', 'PointerEvent', 'ClipboardEvent', 'DataTransfer', 'File', 'Blob', 'FileReader', 'getSelection', 'URL', 'DOMParser']) {
  if (dom.window[k] !== undefined && global[k] === undefined) global[k] = dom.window[k];
}
global.matchMedia = dom.window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };

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

let passed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    console.log(`  NOT OK ${name}\n    ${e.message}`);
    process.exitCode = 1;
  }
};
const src = (p) => readFileSync(join(appRoot, p), 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const noop = () => {};
const click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

console.log('0.35.0 batch DOM tests');

// ============================================================================
// Part A — the emitter (utils/toasts.js)
// ============================================================================
{
  const toastsSrc = src('src/utils/toasts.js');
  ok('0.35.0 the emitter lives at utils/toasts.js with a TOAST_EVENT constant', () => {
    assert.ok(toastsSrc.includes("export const TOAST_EVENT = 'gd-toast'"), 'the event name is a shared constant');
    assert.ok(/export function gdToast\(text, kind = 'ok'\)/.test(toastsSrc), 'gdToast(text, kind) with an ok default');
  });
  ok('0.35.0 gdToast rides window\'s OWN CustomEvent and guards the server render', () => {
    assert.ok(toastsSrc.includes('typeof window === \'undefined\' || !window.CustomEvent'), 'no window / no CustomEvent → silent no-op');
    assert.ok(toastsSrc.includes('new window.CustomEvent(TOAST_EVENT'), 'built through window\'s constructor (the 0.34.0 realm law)');
  });
  const { gdToast, TOAST_EVENT } = require(join(appRoot, 'src/utils/toasts.js'));
  const seen = [];
  const heard = (e) => seen.push(e.detail);
  window.addEventListener(TOAST_EVENT, heard);
  gdToast('Class "heroes" created');
  gdToast('Save failed', 'fail');
  window.removeEventListener(TOAST_EVENT, heard);
  ok('0.35.0 gdToast really dispatches — listeners catch { text, kind }', () => {
    assert.equal(seen.length, 2, 'both events arrived');
    assert.equal(seen[0].text, 'Class "heroes" created', 'the text rides the detail');
    assert.equal(seen[0].kind, 'ok', 'the default tone is ok');
    assert.equal(seen[1].kind, 'fail', 'the fail tone rides when asked');
    assert.ok(seen[0].id != null, 'each toast carries a unique id (the stack keys on it)');
  });
}

// ============================================================================
// Part B — the hub (ToastHub.jsx), standalone
// ============================================================================
{
  const ToastHub = require(join(appRoot, 'src/components/ToastHub.jsx')).default;
  const { gdToast } = require(join(appRoot, 'src/utils/toasts.js'));
  const hubSrc = src('src/components/ToastHub.jsx');

  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(ToastHub));
  await sleep(80);

  ok('0.35.0 the hub mounts LAZY — nothing paints until the first verdict', () => {
    assert.ok(!document.querySelector('.gd-toast-stack'), 'no empty layer rides the body before any toast');
    assert.ok(!document.querySelector('.gd-toast'), 'no empty pill');
  });

  gdToast('Class "toastland" created');
  await sleep(80);
  ok('0.35.0 a verdict paints the pill stack at body level', () => {
    const stack = document.querySelector('.gd-toast-stack');
    assert.ok(stack, 'the stack rendered');
    assert.ok(document.body.contains(stack), 'it lives at document.body (portal — no transforming ancestor can trap it)');
    const pill = document.querySelector('.gd-toast');
    assert.ok(pill, 'the pill rendered');
    assert.ok(pill.textContent.includes('Class "toastland" created'), 'it carries the verdict text');
    assert.ok(!pill.classList.contains('is-fail'), 'the default tone is the accent ok');
  });

  gdToast('Save failed', 'fail');
  await sleep(60);
  ok('0.35.0 the fail verdict wears the red tone', () => {
    const pills = [...document.querySelectorAll('.gd-toast')];
    // 1.1.9 speaks newest-first: the stack's HEAD is the newest verdict.
    const head = pills[0];
    assert.ok(head.classList.contains('is-fail'), 'is-fail paints');
    assert.ok(head.textContent.includes('Save failed'), 'the fail text');
  });

  // the capped stack: three pills max, the oldest falls off first (the
  // wait lets the exited pills finish their leave animation in jsdom)
  gdToast('fourth'); gdToast('fifth'); gdToast('sixth');
  await sleep(450);
  ok('0.35.0 the stack CAPS AT THREE — a burst never builds a column', () => {
    const pills = [...document.querySelectorAll('.gd-toast')];
    assert.equal(pills.length, 3, `three pills painted (got ${pills.length})`);
    assert.ok(pills.some((p) => p.textContent.includes('sixth')), 'the newest stays');
    assert.ok(!pills.some((p) => p.textContent.includes('Class "toastland" created')), 'the oldest fell off');
  });

  // self-decay: every pill fades out on its own
  await sleep(2500);
  ok('0.35.0 every pill decays on its own (~2.4s)', () => {
    assert.ok(!document.querySelector('.gd-toast'), 'the stack emptied itself');
  });

  ok('0.35.0 the hub\'s laws are written in the source (cap + life + lazy portal)', () => {
    assert.ok(hubSrc.includes('TOAST_LIFE_MS = 2400'), 'the 2.4s life');
    assert.ok(hubSrc.includes('TOAST_STACK_CAP = 3'), 'the three-pill cap');
    // 1.1.9 re-law: the stack speaks newest-first — the cap drops the
    // OLDEST by slicing the HEAD of the array (the new pill rides the
    // front); popLayout exits + per-pill layout keep the footprint at
    // three pills under any burst.
    assert.ok(hubSrc.includes('slice(0, TOAST_STACK_CAP)'), 'the cap is enforced by slicing the head (newest-first)');
    assert.ok(hubSrc.includes('setLive(true)'), 'the portal flips live on the first toast (server renders stay inline-free)');
    assert.ok(hubSrc.includes('createPortal'), 'the stack portals to document.body');
  });

  const css = src('src/index.css');
  ok('0.35.0 CSS guards — the stack is pinned to the screen top, above EVERY layer', () => {
    const stackRule = /\.gd-toast-stack\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/position: fixed/.test(stackRule), 'fixed to the viewport');
    /* 1.1.4 — the stack seats below the titlebar now (top: 56px). */
    assert.ok(/top: 56px/.test(stackRule), 'seated below the titlebar');
    assert.ok(/z-index: 1100/.test(stackRule), 'z-1100 — above windows (200), dropdowns (310), the titlebar (400), the old pill tier (500), even tooltips (1000)');
    assert.ok(/pointer-events: none/.test(stackRule), 'a toast never blocks the click it reports on');
    const pillRule = /\.gd-toast\s*\{[^}]*\}/.exec(css)?.[0] || '';
    // 1.0.7 — the pill WRAPS now, clamped to two lines ("same includes with
    // feedback at the top so it doesnt become excessive"): a long verdict
    // stays a pill, never a viewport-wide banner.
    assert.ok(/white-space: normal/.test(pillRule), 'the pill wraps');
    assert.ok(/-webkit-line-clamp: 2/.test(pillRule), 'and holds at most two lines');
    assert.ok(/max-width: min\(420px/.test(pillRule), 'capped at a comfortable reading width');
    assert.ok(/var\(--gd-accent\)/.test(pillRule), 'the ok tone is the accent');
    const failRule = /\.gd-toast\.is-fail\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/#c8402f/.test(failRule), 'the fail tone is the red border');
    assert.ok(!/\.gd-stage-note\s*\{/.test(css), 'the retired stage-owned pill is gone from the sheet');
  });

  // server-render safety: renderToString must not touch createPortal
  const serverHtml = renderToString(React.createElement(ToastHub));
  ok('0.35.0 the hub server-renders as nothing (the lazy portal law)', () => {
    assert.ok(!serverHtml.includes('gd-toast-stack'), 'no stack markup on the server path');
  });

  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ============================================================================
// Part C — the real App: creations, saving, and toasts over open windows
// ============================================================================
{
  const { createSafeDb } = require(join(appRoot, 'src/utils/helpers.js'));
  const db = createSafeDb(null);
  db.classes.push({ id: 'cl-hero', name: 'heroes', parentId: 'root', order: 0 });
  const saved = [];
  window.api = {
    loadDB: async () => ({ db, imagesPath: '/mock/images' }),
    saveDB: async (payload) => { saved.push(payload); return { ok: true }; },
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
    copyImageFile: async () => null,
  };

  const App = require(join(appRoot, 'src/App.jsx')).default;
  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(App));
  await sleep(3400); // the splash timeline runs for real

  ok('0.35.0 the app booted clean with the hub mounted', () => {
    assert.ok(document.querySelector('.gd-titlebar'), 'the titlebar painted');
    assert.ok(!document.querySelector('.gd-toast'), 'no toast fired on a quiet boot');
  });

  // --- creating a CLASS toasts ---------------------------------------------
  const newClassKey = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('NEW CLASS'));
  assert.ok(newClassKey, 'the sidebar NEW CLASS key');
  click(newClassKey);
  await sleep(120);
  let edit = document.querySelector('[data-gd-modal] .gd-rt-edit');
  assert.ok(edit, 'the class window opened with its name field');
  edit.textContent = 'toastland';
  edit.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await sleep(80);
  const createBtn = [...document.querySelectorAll('[data-gd-modal] button')].find((b) => b.textContent.trim() === 'CREATE');
  assert.ok(createBtn, 'the CREATE key');
  click(createBtn);
  await sleep(320); // the verdict paints + the window plays its leave animation
  ok('0.35.0 creating a CLASS toasts its verdict (the window closes over the report)', () => {
    const pill = [...document.querySelectorAll('.gd-toast')].pop();
    assert.ok(pill, 'a toast painted');
    assert.ok(pill.textContent.includes('Class "toastland" created'), `it names the class (got: ${pill?.textContent})`);
    assert.ok(!pill.classList.contains('is-fail'), 'the ok tone');
    assert.ok(!document.querySelector('[data-gd-modal]'), 'the class window closed');
  });

  // --- creating a CHARACTER toasts -----------------------------------------
  const newCharKey = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('NEW CARD'));
  assert.ok(newCharKey, 'the sidebar NEW CARD key');
  click(newCharKey);
  await sleep(120);
  edit = document.querySelector('[data-gd-modal] .gd-rt-edit');
  assert.ok(edit, 'the character window opened with its name field');
  edit.textContent = 'rin';
  edit.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await sleep(80);
  const createBtn2 = [...document.querySelectorAll('[data-gd-modal] button')].find((b) => b.textContent.trim() === 'CREATE');
  click(createBtn2);
  // 1.4.0: the character window's leave flight is the heavier one (more
  // content than the class window) — 320ms was a coin flip under load;
  // the patience doubles and the check holds.
  await sleep(700);
  ok('0.35.0 creating a CHARACTER toasts its verdict', () => {
    // the class toast may still be alive — hunt the pill that names the CARD
    const pills = [...document.querySelectorAll('.gd-toast')];
    const pill = pills.find((p) => p.textContent.includes('"rin" created'));
    assert.ok(pill, `it names the card (pills: ${pills.map((p) => p.textContent).join(' | ')})`);
    assert.ok(!pill.classList.contains('is-fail'), 'the ok tone');
    assert.ok(!document.querySelector('[data-gd-modal]'), 'the creation window closed');
  });

  // --- manual saving toasts (Ctrl+S → "Saved ✓", never "Auto-saved ✓") -----
  await sleep(2500); // let the earlier pills decay so the next read is clean
  assert.ok(window.__GENDX_DB, 'the db snapshot mirrored');
  window.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true }));
  await sleep(200);
  ok('0.35.0 MANUAL saving toasts "Saved ✓"', () => {
    assert.equal(saved.length, 1, 'saveDB wrote once');
    const pill = [...document.querySelectorAll('.gd-toast')].pop();
    assert.ok(pill, 'a toast painted');
    assert.ok(pill.textContent.includes('Saved ✓'), `it confirms the save (got: ${pill?.textContent})`);
    assert.ok(!pill.textContent.includes('Auto-saved'), 'a manual press never reads as the autosave cycle');
  });

  // --- the toast paints WHILE ANOTHER WINDOW IS OPEN ------------------------
  await sleep(2500);
  const settingsKey = [...document.querySelectorAll('button')].find((b) => (b.title || '').startsWith('Settings'));
  assert.ok(settingsKey, 'the titlebar settings key');
  click(settingsKey);
  await sleep(140);
  ok('0.35.0 the settings window opened (the lockout bar dims beneath it)', () => {
    assert.ok(document.querySelector('[data-gd-modal]'), 'the settings window is mounted');
    assert.ok(document.querySelector('.gd-titlebar.is-locked'), 'the top bar is locked out');
  });
  // a verdict lands while the window is up — the toast must paint ABOVE it
  const { gdToast } = require(join(appRoot, 'src/utils/toasts.js'));
  gdToast('Auto-saved ✓');
  await sleep(100);
  ok('0.35.0 the toast paints WHILE THE SETTINGS WINDOW IS OPEN — above every layer', () => {
    const stack = document.querySelector('.gd-toast-stack');
    const pill = document.querySelector('.gd-toast');
    assert.ok(stack && pill, 'the verdict painted over the open window');
    assert.ok(pill.textContent.includes('Auto-saved'), 'the autosave wording rides the pill');
    assert.ok(document.body.contains(stack), 'the stack rides the body, above the modal layer');
    assert.ok(!stack.closest('[data-gd-modal]'), 'it is NOT inside the window — it floats over it');
  });
  // the escape closes the settings window (the wait lets the leave animation play)
  document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await sleep(320);
  assert.ok(!document.querySelector('[data-gd-modal]'), 'the settings window closed');

  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ============================================================================
// Part D — the tone laws (sources)
// ============================================================================
{
  const appSrc = src('src/App.jsx');
  ok('0.35.0 setStatusTransient carries the toast tone (ok / fail / quiet)', () => {
    assert.ok(/const setStatusTransient = useCallback\(\(message, kind = 'ok'\) => \{/.test(appSrc), 'the kind parameter defaults to ok');
    assert.ok(appSrc.includes("if (kind !== 'quiet') gdToast(message, kind);"), 'quiet skips the pill; everything else toasts');
  });
  ok('0.35.0 the AUTOSAVE cycle hands its flag to saveDb — "Auto-saved ✓", never "Saved ✓"', () => {
    assert.ok(appSrc.includes('saveDbRef.current?.(true)'), 'the interval passes the auto flag');
    assert.ok(appSrc.includes("setStatusTransient(auto ? 'Auto-saved ✓' : 'Saved ✓')"), 'the verdict names its writer');
    assert.ok(appSrc.includes('const auto = mode === true;'), 'the flag is guarded with === true — the titlebar\'s onClick={onSave} hands the CLICK EVENT through, and a truthy event must not pose as the cycle');
  });
  ok('0.35.0 interim chatter stays quiet — "Duplicating…" toasts nothing', () => {
    assert.ok(appSrc.includes("setStatusTransient('Duplicating…', 'quiet')"), 'the duplicating chatter is titlebar-only (a real verdict follows)');
  });
  ok('0.35.0 the failure sites wear the fail tone', () => {
    assert.ok(appSrc.includes("setStatusTransient('Save failed', 'fail')"), 'save failed');
    assert.ok(appSrc.includes("setStatusTransient('No image on the clipboard', 'fail')"), 'paste with nothing there');
    assert.ok(appSrc.includes("'Copy failed', 'fail'"), 'copy failures');
    const cvSrc = src('src/components/CharacterView.jsx');
    assert.ok(cvSrc.includes("onStatus('Drop failed', 'fail')"), 'drop failed');
    const cpSrc = src('src/components/ComposePanel.jsx');
    assert.ok(cpSrc.includes("onStatus('Copy failed', 'fail')"), 'compose copy failed');
  });
  ok('0.35.0 App mounts the hub once — every verdict in the app flows through it', () => {
    assert.ok(appSrc.includes('<ToastHub />'), 'the hub rides the app root');
    assert.ok(src('src/components/ImageStage.jsx').includes("import { gdToast } from '../utils/toasts.js'"), 'the stage toasts through the same layer');
  });
  ok('0.35.0 the app\'s whole verdict catalogue still reports (sample of the wired sites)', () => {
    for (const phrase of ['created', 'deleted', 'Auto-saved', 'Image deleted', 'Tag deleted', 'Version deleted']) {
      assert.ok(
        appSrc.includes(phrase) || src('src/components/CharacterView.jsx').includes(phrase),
        `the catalogue still carries "${phrase}"`
      );
    }
  });
}

console.log(`\n${passed} passed, ${process.exitCode ? 'FAILED' : '0 failed'}`);
