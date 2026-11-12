// 0.32.0 — THE STYLIZED TEXT MENU + THE PASTE THAT ACTUALLY PASTES + THE
// ABOUT LINK WALL + THE CORNER-FLIGHT FIX + THE COMPOSE WIDTH + THE
// EMPHASIZED PART KEYS + THE GLIDING TOP TAB, behavioral DOM tests on the
// real components / the real sources.
//   Part A — the clipboard pipeline: main.js hunts through every shape an
//     image can wear (native bitmap, copied FILES, the raw PNG format) with
//     signature typing, the native context-menu popup is retired, and the
//     preload carries the new paste / copy-image channels.
//   Part B — the stylized TEXT menu: a contentEditable (the rich-box shape)
//     right-clicked under the real App gets the app's OWN pill — Undo /
//     Redo ride it (execCommand can drive them there), Cut / Copy armed by
//     the live selection, Paste + Select all always on offer.
//   Part C — the ABOUT LINK WALL: LINKS (HuggingFace, GitHub-soon, Genesis
//     Iterations, the Discord COPY key) + SUPPORT (Ko-fi, PayPal) render
//     with their brand marks; the Discord key COPIES the username and
//     confirms itself; link keys route through openExternal; GitHub stays
//     inert until the repository goes public.
//   Part D — the full-window compose sheet spans the SAME width as the
//     prompt card (no more 340px side sliver).
//   Part E — the part rows' UP / DOWN / DELETE keys are framed buttons and
//     DELETE asks first.
//   Part F — the stamp TOP tab is a shared-layout element (it glides from
//     the old top stamp to the new one).
//   Part G — the masonry corner-flight fix: estimated heights + the settle
//     gate exist, and the grid still renders its absolute cards.
//   Part H — CSS guards: the context menu's CAPPED radius (the rounded-
//     theme text containment fix), the part-keys cluster, the about-link
//     styles, and the popover suppression attribute.
//   Part I — the preview's tooltip is gone and the ADD keys stopped
//     billing paste (it has its own way).
// Run: node scripts/gendex_032_batch_dom.test.mjs
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
  console.log('jsdom unavailable — 0.32.0 batch DOM test skipped');
  process.exit(0);
}

// The app root resolves RELATIVE to this file (scripts/ sits one level
// under the project root — no machine-local paths).
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
global.IntersectionObserver = class { observe() {} unwatch() {} disconnect() {} };
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
const ctx = (el, x = 30, y = 30) =>
  el.dispatchEvent(new dom.window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
const escape = () => document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
const click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
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
// Part A — the clipboard pipeline (main.js + preload.js sources)
// ============================================================================
{
  const mainSrc = readFileSync(join(appRoot, 'src/main.js'), 'utf8');
  ok('0.32.0 the NATIVE context-menu popup is RETIRED (nothing OS-styled can pop)', () => {
    assert.ok(!mainSrc.includes("webContents.on('context-menu'"), 'the webContents context-menu handler is gone');
    assert.ok(!mainSrc.includes('Menu.buildFromTemplate'), 'no native menu template is built');
  });
  ok('0.32.0 the clipboard read is MULTI-STRATEGY: bitmap -> copied FILES -> raw PNG', () => {
    assert.ok(mainSrc.includes('clipboard.readImage()'), 'the native bitmap read stays first');
    assert.ok(mainSrc.includes("'FileNameW'"), 'Windows copied-file list (UTF-16)');
    assert.ok(mainSrc.includes("'FileName'"), 'the legacy ANSI twin');
    assert.ok(mainSrc.includes("readBuffer('PNG')"), 'the raw Windows PNG format');
    assert.ok(mainSrc.includes('public.file-url'), 'macOS Finder file copies');
    assert.ok(mainSrc.includes("readBuffer('image/png')"), 'the Linux image/png buffer');
  });
  ok('0.32.0 raw buffers are typed by MAGIC BYTES (sniffImageExt), not by trusting names', () => {
    assert.ok(mainSrc.includes('sniffImageExt'), 'the sniffer exists');
    for (const sig of ['0x89', '0xd8', "'GIF'", "'RIFF'", "'ftyp'"]) {
      assert.ok(mainSrc.includes(sig), `the ${sig} signature is read`);
    }
    assert.ok(/IMAGE_FILE_RE/.test(mainSrc), 'copied files are filtered by image extension');
  });
  ok('0.32.0 PASTE-INTO-FIELD + COPY-IMAGE IPC channels exist', () => {
    assert.ok(mainSrc.includes("'clipboard-paste'"), 'the paste channel');
    assert.ok(mainSrc.includes('webContents.paste()'), 'it runs the browser\u2019s own paste');
    assert.ok(mainSrc.includes("'clipboard-write-image-file'"), 'the copy-image channel');
    assert.ok(mainSrc.includes('clipboard.writeImage'), 'it writes a real image to the clipboard');
  });
  const preloadSrc = readFileSync(join(appRoot, 'src/preload.js'), 'utf8');
  ok('0.32.0 the preload carries pasteToFocused + clipboardWriteImageFile', () => {
    assert.ok(preloadSrc.includes('pasteToFocused'), 'pasteToFocused is exposed');
    assert.ok(preloadSrc.includes('clipboardWriteImageFile'), 'clipboardWriteImageFile is exposed');
  });
  const appSrc = readFileSync(join(appRoot, 'src/App.jsx'), 'utf8');
  ok('0.32.0 Ctrl+V falls back to the multi-strategy reader (copied FILES paste too)', () => {
    assert.ok(/no bitmap items/.test(appSrc), 'the fallback branch exists');
    assert.ok(appSrc.includes('readClipboardImageRecord'), 'the quiet record reader is shared');
  });
}

// ============================================================================
// Part B — the stylized TEXT menu on a rich box (the real App mounted)
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
        classes: [],
        tags: [], stamps: [],
        characters: [],
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

  // A rich box (contentEditable) with a live selection — the shape the name
  // fields wear. The app-level listener serves it wherever it lives.
  const box = document.createElement('div');
  box.setAttribute('contenteditable', 'true');
  box.textContent = 'bright amy';
  document.body.append(box);
  box.focus();
  const sel = window.getSelection();
  const range = document.createRange();
  range.setStart(box.firstChild, 0);
  range.setEnd(box.firstChild, 6); // "bright"
  sel.removeAllRanges();
  sel.addRange(range);
  ctx(box, 40, 12);
  await sleep(60);
  ok('0.32.0 right-clicking a RICH BOX opens the stylized TEXT menu (Undo/Redo ride it)', () => {
    const menu = document.querySelector('.gd-ctx-menu');
    assert.ok(menu, 'the app\u2019s own pill painted');
    assert.ok(menuHeader().includes('TEXT'), `the header chip names text (got: ${menuHeader()})`);
    const labels = menuLabels();
    assert.ok(labels.some((l) => l === 'Undo'), 'undo (contentEditable — the command truly works)');
    assert.ok(labels.some((l) => l === 'Redo'), 'redo');
    assert.ok(labels.some((l) => l === 'Cut'), 'cut');
    assert.ok(labels.some((l) => l === 'Copy'), 'copy');
    assert.ok(labels.some((l) => l === 'Paste'), 'paste');
    assert.ok(labels.some((l) => l === 'Delete'), 'delete');
    assert.ok(labels.some((l) => l === 'Select all'), 'select all');
    // the live selection arms the selection-bound keys
    const disabled = [...document.querySelectorAll('.gd-ctx-item.is-disabled')].map((b) => b.textContent.trim());
    assert.ok(!disabled.some((l) => l.includes('Cut')), 'cut armed by the selection');
    assert.ok(!disabled.some((l) => l.includes('Copy')), 'copy armed');
    assert.ok(!disabled.some((l) => l.includes('Delete')), 'delete armed');
  });
  escape();
  await sleep(60);

  // Paste runs through the main process — the IPC is called, not execCommand.
  let pasted = 0;
  window.api.pasteToFocused = () => { pasted += 1; };
  ctx(box, 40, 12);
  await sleep(60);
  const pasteBtn = [...document.querySelectorAll('.gd-ctx-item')].find((b) => b.textContent.includes('Paste'));
  assert.ok(pasteBtn, 'the paste key rendered');
  click(pasteBtn);
  await sleep(60);
  ok('0.32.0 the menu\u2019s PASTE routes through the main process', () => {
    assert.equal(pasted, 1, 'pasteToFocused was invoked exactly once');
  });
  box.remove();
  root.unmount();
  document.body.innerHTML = '';
}

// ============================================================================
// Part C — the ABOUT LINK WALL
// ============================================================================
{
  const SettingsModal = require(join(appRoot, 'src/components/SettingsModal.jsx')).default;
  const settings = {
    theme: 'zine', colors: {}, textures: { titlebar: 'none', sidebar: 'none', viewer: 'dots', panel: 'none' },
    buttonStyle: 'theme', toolbarGradient: 'off', zoom: 3, tagScale: 1.2, tagPosition: 'corner',
    cardRatio: { w: 3, h: 4 }, defaultSortMode: 'custom', detailPanel: true, promptBottom: true,
    tooltips: true, tooltipFollow: true, showHelpText: false, advancedSearch: false,
  };
  const out = renderToString(
    React.createElement(SettingsModal, {
      settings, initial: settings, onClose: noop, onChange: noop, onRevert: noop, initialTab: 'About',
    })
  );
  ok('0.32.0 the ABOUT tab renders the LINK WALL (LINKS + SUPPORT sections)', () => {
    assert.ok(out.includes('LINKS'), 'the LINKS section label');
    assert.ok(out.includes('SUPPORT'), 'the SUPPORT section label');
    assert.ok(out.includes('gd-about-links'), 'the link grid');
    assert.ok(out.includes('gd-about-link-ico'), 'the brand chips');
  });
  ok('0.32.0 every maker link renders with its label', () => {
    assert.ok(out.includes('HUGGINGFACE'), 'huggingface');
    assert.ok(out.includes('GITHUB'), 'github');
    assert.ok(out.includes('GENESIS ITERATIONS'), 'genesis iterations');
    assert.ok(out.includes('nuriderburrito'), 'the discord username IS the key\u2019s label');
    assert.ok(out.includes('KO-FI'), 'ko-fi');
    assert.ok(out.includes('PAYPAL'), 'paypal');
  });
  ok('0.32.0 GITHUB is a live link key (LIVE since 1.0.0 — was the SOON placeholder)', () => {
    // 1.0.0 — the repository went live with the approaching release; the
    // SOON chip and the disabled posture retired.
    assert.ok(!out.includes('SOON'), 'no SOON chip anymore');
    const githubBtn = /<button[^>]*disabled[^>]*>/;
    assert.ok(!githubBtn.test(out), 'no disabled key on the wall');
  });

  // Interactive: the Discord key COPIES; link keys route through openExternal.
  const opened = [];
  const copiedText = [];
  window.api = {
    ...window.api,
    openExternal: (u) => opened.push(u),
    clipboardWriteText: async (t) => { copiedText.push(t); },
  };
  document.body.innerHTML = '<div id="root2"></div>';
  const root = createRoot(document.getElementById('root2'));
  root.render(
    React.createElement(SettingsModal, {
      settings, initial: settings, onClose: noop, onChange: noop, onRevert: noop, initialTab: 'About',
    })
  );
  await sleep(120);
  const btns = [...document.querySelectorAll('.gd-about-link')];
  assert.ok(btns.length >= 6, `the wall rendered its keys (got ${btns.length})`);
  const byText = (t) => btns.find((b) => b.textContent.includes(t));
  ok('0.32.0 pressing HUGGINGFACE opens the page through the OS browser', () => {
    click(byText('HUGGINGFACE'));
    assert.deepEqual(opened, ['https://huggingface.co/NuriDerBurrito']);
  });
  ok('0.32.0 pressing GENESIS ITERATIONS opens the website', () => {
    click(byText('GENESIS ITERATIONS'));
    assert.ok(opened.includes('https://nuriderburrito.github.io/Genesis-Website/index.html'));
  });
  ok('0.32.0 the SUPPORT keys open (Ko-fi + PayPal)', () => {
    click(byText('KO-FI'));
    click(byText('PAYPAL'));
    assert.ok(opened.includes('https://ko-fi.com/genesisiterations'));
  });
  const discord = byText('nuriderburrito');
  click(discord);
  await sleep(80);
  ok('0.32.0 the DISCORD key COPIES the username and confirms itself', () => {
    assert.deepEqual(copiedText, ['nuriderburrito'], 'the username went to the clipboard');
    assert.ok(discord.textContent.includes('COPIED'), 'the key flips to COPIED');
  });
  await sleep(1700);
  ok('0.32.0 the COPIED beat settles back to the username', () => {
    assert.ok(discord.textContent.includes('nuriderburrito'), 'the label is the username again');
  });
  ok('0.32.0 the GITHUB key OPENS the repository (live since 1.0.0)', () => {
    const github = [...document.querySelectorAll('.gd-about-link')].find((b) => b.textContent.includes('GITHUB'));
    assert.ok(!github.disabled, 'the key is enabled');
    click(github);
    assert.ok(opened.some((u) => u.includes('github.com/NuriDerBurrito/Burrito_GenDex')), 'the repository opened');
  });
  root.unmount();
  document.body.innerHTML = '';
}

// ============================================================================
// Part D — the full-window compose sheet spans the prompt card's width
// ============================================================================
{
  const CharacterView = require(join(appRoot, 'src/components/CharacterView.jsx')).default;
  const character = {
    id: 'c1', name: 'amy', classId: 'root', tags: [], previewVersionId: null,
    cardRatio: { w: 3, h: 4 }, cardTrim: 'dash', cardCrop: null,
    stamps: [], stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
    createdAt: Date.now(),
    versions: [{
      id: 'v1', label: 'V1', color: null, icon: null,
      images: [{ file: 'a.png', thumb: 'a_t.jpg' }],
      parts: [{ id: 'p1', name: 'body', content: 'test', include: true }],
      notes: '', createdAt: 1,
    }],
  };
  const props = {
    character, tags: [], stampLibrary: [], imagesPath: 'C:/img',
    cardDefaultRatio: { w: 3, h: 4 }, outputBarOn: false, showHelp: false,
    onBack: noop, patchCharacter: noop, onRename: noop, onDelete: noop, onToggleTag: noop,
    onOpenTagManager: noop, onAttachStamp: noop, onRemoveStamp: noop, onPromoteStamp: noop,
    onUploadStamp: noop, onRenameStamp: noop, onReorderStamps: noop, onStampColor: noop,
    onStampTransform: noop, confirm: noop, onStatus: noop, onActiveVersion: noop,
  };
  const full = renderToString(React.createElement(CharacterView, props));
  ok('0.32.0 the full-window compose sheet rides UNDER the prompt card at the SAME width', () => {
    assert.ok(!full.includes('xl:w-[340px]'), 'the old 340px side sliver is gone');
    assert.ok(full.includes('flex-1 min-w-[340px] space-y-4'), 'one merged details column');
    assert.ok(full.includes('gd-compose'), 'the compose sheet renders in it');
    // the sheet is INSIDE the details column — the prompt card also is
    const order = full.indexOf('PROMPTS') < full.indexOf('PROMPT SHEET');
    assert.ok(order, 'the card sits above the sheet');
  });
  const src = readFileSync(join(appRoot, 'src/components/CharacterView.jsx'), 'utf8');
  ok('0.32.0 the compose panel mounts directly in the details column (no wrapper column)', () => {
    assert.ok(/flex-1 min-w-\[340px\] space-y-4[\s\S]{0,400}ComposePanel/.test(src), 'the sheet is a child of the column');
  });
}

// ============================================================================
// Part E — the part rows' framed keys + the confirm-gated delete
// ============================================================================
{
  const out = renderToString(
    React.createElement(require(join(appRoot, 'src/components/PartEditor.jsx')).default, {
      parts: [
        { id: 'p1', name: 'body', content: 'a', include: true },
        { id: 'p2', name: 'face', content: 'b', include: false },
      ],
      onSetParts: noop,
      plain: true,
      confirm: noop,
    })
  );
  ok('0.32.0 the part rows wear the EMPHASIZED key cluster', () => {
    assert.ok(out.includes('gd-part-keys'), 'the framed cluster renders');
    assert.ok(out.includes('is-part-del'), 'the delete key reads danger');
    // the first row's up key and the last row's down key arrive disabled
    assert.ok(out.includes('disabled'), 'edge keys disable honestly');
  });

  // Interactive: DELETE asks first; only CONFIRM removes the part.
  document.body.innerHTML = '<div id="root3"></div>';
  const root = createRoot(document.getElementById('root3'));
  let confirmCalls = 0;
  let confirmOpts = null;
  const sets = [];
  const parts = [
    { id: 'p1', name: 'body', content: 'a', include: true },
    { id: 'p2', name: 'face', content: 'b', include: true },
  ];
  root.render(
    React.createElement(require(join(appRoot, 'src/components/PartEditor.jsx')).default, {
      parts,
      onSetParts: (next) => sets.push(next),
      plain: true,
      confirm: (opts) => { confirmCalls += 1; confirmOpts = opts; },
    })
  );
  await sleep(80);
  const del = document.querySelector('.gd-part-keys .is-part-del');
  assert.ok(del, 'the delete key mounted');
  click(del);
  await sleep(40);
  ok('0.32.0 pressing DELETE asks first (the confirm window)', () => {
    assert.equal(confirmCalls, 1, 'the confirm was requested');
    assert.ok(confirmOpts.title.includes('DELETE PART'), `the title (got: ${confirmOpts.title})`);
    assert.ok(confirmOpts.message.includes('body'), 'the message names the part');
    assert.ok(confirmOpts.danger, 'danger tone');
    assert.equal(sets.length, 0, 'nothing was deleted yet');
  });
  confirmOpts.onConfirm();
  await sleep(40);
  ok('0.32.0 CONFIRM removes the part (and only the part)', () => {
    assert.equal(sets.length, 1, 'the deletion committed after the confirm');
    assert.ok(!sets[0].some((p) => p.id === 'p1'), 'the part is gone');
    assert.ok(sets[0].some((p) => p.id === 'p2'), 'its sibling stays');
  });
  root.unmount();
  document.body.innerHTML = '';
}

// ============================================================================
// Part F — the stamp TOP tab glides (shared layout, per-row id)
// ============================================================================
{
  const { StampSlots } = require(join(appRoot, 'src/components/StampEditModal.jsx'));
  const src = readFileSync(join(appRoot, 'src/components/StampEditModal.jsx'), 'utf8');
  ok('0.32.0 the TOP tab rides its slot (0.42.0: WELDED, no shared-layout flight)', () => {
    assert.ok(src.includes('<span className="gd-stamp-slot-top">TOP</span>'), 'the tab is a plain welded span');
    assert.ok(!src.includes('layoutId'), 'no shared-layout measurement left to drift on scroll/resize');
    assert.ok(!src.includes('useId()'), 'no per-row glide ids');
  });
  const out = renderToString(
    React.createElement(StampSlots, {
      stamps: [
        { id: 's1', image: 'a.png', name: 'seal' },
        { id: 's2', image: 'b.png', name: 'mark' },
      ],
      imagesPath: 'C:/img',
      onRemove: noop, onPromote: noop, onReorder: noop, onRename: noop,
    })
  );
  ok('0.32.0 exactly ONE top tab renders, on the first slot', () => {
    assert.equal((out.match(/gd-stamp-slot-top/g) || []).length, 1, 'one tab only');
    assert.ok(out.includes('>TOP</span>'), 'the tab says TOP');
  });
}

// ============================================================================
// Part G — the masonry corner-flight fix
// ============================================================================
{
  const src = readFileSync(join(appRoot, 'src/components/MasonryGrid.jsx'), 'utf8');
  ok('0.32.0 UNMEASURED cards lay out at an ESTIMATE (never zero-height ghosts)', () => {
    assert.ok(/heights\[id\] \?\? estHeight/.test(src), 'unknown heights borrow the estimate');
    assert.ok(/measured\.reduce/.test(src), 'the estimate is the measured average');
    assert.ok(!/heights\[id\] \|\| 0/.test(src), 'the old zero-height fallback is gone');
  });
  ok('0.32.0 the SETTLE GATE keeps layout animation instant until geometry stills', () => {
    assert.ok(/setSettled\(true\)/.test(src), 'the gate arms after the settle window');
    assert.ok(/layout: settled/.test(src), 'the layout transition follows the gate');
    assert.ok(/duration: 0/.test(src), 'unsettled layout snaps instantly');
  });
  const MasonryGrid = require(join(appRoot, 'src/components/MasonryGrid.jsx')).default;
  const out = renderToString(
    React.createElement(MasonryGrid, {
      cardWidth: 185,
      gap: 20,
      itemIds: ['a', 'b', 'c'],
      renderItem: (id) => React.createElement('div', { key: id, className: 'cell' }, id),
    })
  );
  ok('0.32.0 the grid still renders its absolutely-positioned cards', () => {
    assert.ok(out.includes('position:absolute'), 'the masonry positioning lives');
    for (const id of ['a', 'b', 'c']) assert.ok(out.includes(`>${id}<`), `card ${id} rendered`);
  });
}

// ============================================================================
// Part H — CSS guards: the capped menu radius + the new clusters
// ============================================================================
{
  const css = readFileSync(join(appRoot, 'src/index.css'), 'utf8');
  ok('0.32.0 the right-click menu CAPS its radius (rounded themes finally contain the text)', () => {
    assert.ok(
      /\.gd-ctx-menu[\s\S]{0,900}border-radius: min\(var\(--gd-btn-radius, 8px\), 12px\)/.test(css),
      'the container radius is capped'
    );
    assert.ok(
      /\.gd-ctx-item[\s\S]{0,300}border-radius: calc\(min\(var\(--gd-btn-radius, 8px\), 12px\) - 2px\)/.test(css),
      'the rows are capped with it'
    );
    // a pill theme's 999px can no longer curl the menu's rows
    assert.ok(!/\.gd-ctx-menu[\s\S]{0,200}border-radius: var\(--gd-btn-radius, 8px\);/.test(css), 'no uncapped container radius remains');
  });
  ok('0.32.0 the part-keys cluster + the about-link wall carry their styles', () => {
    assert.ok(css.includes('.gd-part-keys'), 'the part keys cluster');
    assert.ok(css.includes('.gd-part-keys .gd-icon-btn.is-part-del'), 'the danger delete key');
    assert.ok(css.includes('.gd-about-link'), 'the about link key');
    // 0.33.0 — the brand chip is GONE ("should not have a container and
    // should be slightly bigger"): the mark rides BARE at 19px. The old
    // dark chip ground left with it.
    assert.ok(!css.includes('background: #14161b'), 'the fixed dark brand chip is retired');
    assert.ok(/\.gd-about-link-ico img[\s\S]{0,160}width: 19px/.test(css), 'the bare mark is slightly bigger (19px)');
    assert.ok(!/\.gd-about-link-ico\s*\{[^}]*border/.test(css), 'the mark carries no container frame');
    assert.ok(css.includes('.gd-about-link-soon'), 'the SOON chip');
    assert.ok(css.includes('.gd-about-sec'), 'the section labels');
  });
  const popSrc = readFileSync(join(appRoot, 'src/components/Popover.jsx'), 'utf8');
  const appSrc = readFileSync(join(appRoot, 'src/App.jsx'), 'utf8');
  ok('0.32.0 dropdown surfaces are MARKED and SUPPRESSED (no menus over popovers)', () => {
    assert.ok(popSrc.includes('data-gd-popover'), 'popovers carry the attribute');
    assert.ok(appSrc.includes("[data-gd-popover]"), 'the contextmenu listener respects it');
  });
}

// ============================================================================
// Part I — the preview's tooltip is gone; ADD stopped billing paste
// ============================================================================
{
  const stageSrc = readFileSync(join(appRoot, 'src/components/ImageStage.jsx'), 'utf8');
  ok('0.32.0 the image preview carries NO tooltip', () => {
    assert.ok(!stageSrc.includes('Preview —'), 'the stage title is gone');
    assert.ok(!stageSrc.includes('Image position'), 'the counter title is gone');
  });
  ok('0.32.0 the browse keys read CLICK OR DROP (paste has its own key)', () => {
    /* 1.3.0 re-law: the label lost its em dash with the text sweep. */
    assert.ok(stageSrc.includes('ADD IMAGES: CLICK OR DROP'), 'the stage label');
    assert.ok(!stageSrc.includes('CLICK, PASTE OR DROP'), 'the old label is gone');
    assert.ok(!stageSrc.includes('paste and drop work too'), 'no paste billing in the tooltip');
    const createSrc = readFileSync(join(appRoot, 'src/components/NewCharacterModal.jsx'), 'utf8');
    assert.ok(!createSrc.includes('paste or drop work too'), 'the creation window tooltip too');
    const managerSrc = readFileSync(join(appRoot, 'src/components/ImageManagerModal.jsx'), 'utf8');
    assert.ok(!managerSrc.includes('pastes too'), 'the manager tooltip too');
  });
}

console.log(`\n${passed} 0.32.0 batch DOM checks passing`);
if (errors.length) {
  console.error(`\n${errors.length} renderer error(s) surfaced during the run:`);
  for (const e of errors) console.error(`  ${e.split('\n')[0]}`);
  process.exitCode = 1;
}
