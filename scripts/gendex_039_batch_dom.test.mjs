#!/usr/bin/env node
// Behavioral DOM + source checks for the 0.39.0 batch:
//   · THE PASTE VERDICTS EVERYWHERE ("the tag paste area is missing the
//     noticification feedback that the others do, same with the image,
//     implement them") — the stamp paste tile, the picker's footer PASTE,
//     and the creation window's image PASTE tile all answer with the same
//     toasts the stage's key fires (green landed / red nothing-to-grab)
//   · THE ONE-LINE STAMP STRIPS ("after i reach 7 stamps, the stamp adding
//     moves into a new line, i dont want it to move onto a new line at
//     all") — the panel strip and the creation strip never wrap; overflow
//     scrolls inside; the shared settings tower rides its OWN line under
//     the panel strip, left-aligned, folding away while collapsed
//   · THE IMAGES CONTAINER'S TWELVE-IMAGE BUDGET ("when i reach 10 images,
//     the container collapses and becomes so small, fix that so it at
//     least displays enough area to fit the first 12, with the ability to
//     make the container shorter or longer (not longer than the default
//     tho)") — four rows of three squares by default, drag-resizable
//     between one row and the default
//   · THE CLASS TREE: a new class never spawns offscreen (auto reveal,
//     ancestors unfold), the reveal scroll is ANIMATED both axes, tools
//     pop LEFT when the card clips right, the texture rides the scroller
//   · THE HUGE IMAGE VIEWER REWORK: body-level portal, strict 1:1 drag,
//     clamped pan, the crop that actually cuts (CORS + clear selection +
//     true thirds + edge auto-pan), peeks inside the ONE bottom toolbar,
//     empty-area close
//   · THE STAGE: the eye affordance on hover, only an explicit click on
//     the picture opens the viewer
//   · MISC: the NEW VERSION key presses through the sort, card color below
//     the emoji picker, EDIT CLASS from the context menu, the readable
//     full-view out-animation, the breathing rows fold
//
// Requires jsdom (installed dev-only). Skips gracefully without it.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch {
  console.log('jsdom unavailable — 0.39.0 batch DOM test skipped (dev-only dependency)');
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
global.Image = dom.window.Image;
global.IS_REACT_ACT_ENVIRONMENT = true;
global.matchMedia = dom.window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
// a CAPTURING ResizeObserver mock — the 0.39.0 grid-cap math needs the
// observer to actually fire with a real clientWidth (see Part D).
const RO_STACK = [];
global.ResizeObserver = class {
  constructor(cb) {
    this.cb = cb;
    RO_STACK.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

const React = require('react');
const { createRoot } = require('react-dom/client');
const babel = require('@babel/core');
const appRoot = process.cwd();
require.extensions['.jsx'] = (module, filename) => {
  const { code } = babel.transformFileSync(filename, {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      ['@babel/preset-react', { runtime: 'automatic' }],
    ],
  });
  module._compile(code, filename);
};

const src = (rel) => readFileSync(join(appRoot, rel), 'utf8');
const css = src('src/index.css');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  NOT OK ${name}\n    ${e.message.split('\n')[0]}`);
  }
};
const okAsync = async (name, fn) => {
  try {
    await fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  NOT OK ${name}\n    ${e.message.split('\n')[0]}`);
  }
};
const rule = (re) => re.exec(css)?.[0] || '';
const click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
const freshRoot = () => {
  document.body.innerHTML = '<div id="root"></div>';
  return createRoot(document.getElementById('root'));
};

console.log('0.39.0 batch DOM tests');

// ---------------------------------------------------------------------------
// Part A — the version pin
// ---------------------------------------------------------------------------
{
  const { APP } = await import(join(appRoot, 'src/constants/index.js'));
  ok('0.39.0 the version bumped everywhere', () => {
    // 0.40.0 — the pin moved on: the version advances every batch, so the
    // law is "constants and package.json agree, and we are at least the
    // 0.39.0 era" (the exact pin lives in the newest batch's own test).
    assert.ok(/^0\.(39|4\d)|^[1-9]\d*\./.test(APP.version), `a modern version (got ${APP.version})`);
    assert.ok(src('package.json').includes(`"version": "${APP.version}"`), 'package.json and constants agree');
    assert.match(src('CHANGELOG.md'), /^## 0\.39\.0/m, 'the changelog still carries the 0.39.0 entry');
  });
}

// ---------------------------------------------------------------------------
// Part B — the paste verdicts everywhere
// ---------------------------------------------------------------------------
{
  const { TOAST_EVENT } = require(join(appRoot, 'src/utils/toasts.js'));
  const heard = [];
  const onToast = (e) => heard.push(e.detail);
  window.addEventListener(TOAST_EVENT, onToast);
  const lastToast = () => heard[heard.length - 1];

  // -- the stamp paste tile -------------------------------------------------
  const { StampPasteTile } = require(join(appRoot, 'src/components/StampEditModal.jsx'));
  let pastedRecords = null;
  let root = freshRoot();
  root.render(
    React.createElement(StampPasteTile, {
      onPaste: (records) => {
        pastedRecords = records;
      },
    })
  );
  await sleep(40);
  const tile = document.querySelector('.gd-stamp-paste');

  window.api = { clipboardReadImage: async () => null, saveImageBuffer: async () => null };
  click(tile);
  await sleep(30);
  ok('0.39.0 stamp paste: an EMPTY clipboard answers with the red verdict', () => {
    assert.ok(lastToast(), 'a toast fired');
    assert.equal(lastToast().text, 'No image on the clipboard');
    assert.equal(lastToast().kind, 'fail');
    assert.equal(pastedRecords, null, 'nothing was handed on');
  });

  window.api = {
    clipboardReadImage: async () => ({ base64: 'QUJD', ext: '.png' }),
    saveImageBuffer: async () => null, // the save itself fails
  };
  click(tile);
  await sleep(30);
  ok('0.39.0 stamp paste: a FAILED save answers with the red verdict', () => {
    assert.equal(lastToast().text, 'Paste failed');
    assert.equal(lastToast().kind, 'fail');
  });

  window.api = {
    clipboardReadImage: async () => ({ base64: 'QUJD', ext: '.png' }),
    saveImageBuffer: async () => ({ file: 'p.png', thumb: 'p.png' }),
  };
  click(tile);
  await sleep(30);
  ok('0.39.0 stamp paste: a landed image answers with the green verdict + the record', () => {
    assert.equal(lastToast().text, 'Stamp pasted');
    assert.equal(lastToast().kind, 'ok');
    assert.deepEqual(pastedRecords, [{ file: 'p.png', thumb: 'p.png' }]);
  });
  root.unmount();

  // -- the picker's pinned footer PASTE --------------------------------------
  const pickerSrc = src('src/components/StampEditModal.jsx');
  ok('0.39.0 the picker footer PASTE carries the same verdicts (source law)', () => {
    const footerPaste = pickerSrc.slice(pickerSrc.indexOf('const pasteFromClipboard'));
    assert.ok(footerPaste.includes("gdToast('No image on the clipboard', 'fail')"), 'the empty-clipboard red pill');
    assert.ok(footerPaste.includes("gdToast('Stamp pasted')"), 'the landed green pill');
    assert.ok(footerPaste.includes("gdToast('Paste failed', 'fail')"), 'the failed-save red pill');
  });

  // -- the creation window's image PASTE tile --------------------------------
  const { default: NewCardModal } = require(join(appRoot, 'src/components/NewCharacterModal.jsx'));
  heard.length = 0;
  root = freshRoot();
  root.render(
    React.createElement(NewCardModal, {
      imagesPath: '/img',
      defaultRatio: { w: 3, h: 4 },
      classes: [],
      stampLibrary: [],
      showHelp: true,
      confirm: () => {},
      onDeleteFromGallery: () => {},
      onAddToGallery: () => {},
      onClose: () => {},
      onCreate: () => {},
    })
  );
  await sleep(60);
  const pasteTile = [...document.querySelectorAll('button')].find((b) => b.title === 'Paste the clipboard image');
  assert.ok(pasteTile, 'the image paste tile renders');

  window.api = { clipboardReadImage: async () => null, saveImageBuffer: async () => null };
  click(pasteTile);
  await sleep(30);
  ok('0.39.0 image paste: an EMPTY clipboard answers with the red verdict', () => {
    assert.ok(lastToast(), 'a toast fired');
    assert.equal(lastToast().text, 'No image on the clipboard');
    assert.equal(lastToast().kind, 'fail');
  });

  window.api = {
    clipboardReadImage: async () => ({ base64: 'QUJD', ext: '.png' }),
    saveImageBuffer: async () => ({ file: 'q.png', thumb: 'q.png' }),
  };
  const beforeCount = document.querySelectorAll('.gd-sort-item').length;
  click(pasteTile);
  await sleep(40);
  ok('0.39.0 image paste: a landed image answers green + joins the grid', () => {
    assert.equal(lastToast().text, 'Image pasted');
    assert.equal(lastToast().kind, 'ok');
    const afterCount = document.querySelectorAll('.gd-sort-item').length;
    assert.equal(afterCount, beforeCount + 1, 'the record rode into the grid');
  });

  window.removeEventListener(TOAST_EVENT, onToast);
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ---------------------------------------------------------------------------
// Part C — the stamp strips (0.40.0: they WRAP again and grow downward)
// ---------------------------------------------------------------------------
{
  ok('0.40.0→0.41.0 the strips WRAP — one flow, no wrappers, no side scroll', () => {
    // 0.41.0 — the strip-row wrapper is GONE: the slots, ADD, PASTE and the
    // settings cluster ride .gd-stamp-slots itself (StampSlots children), so
    // the tiles fill each row's leftover room — nothing takes a forced line.
    const row = rule(/^\.gd-stamp-slots\s*\{[^}]*\}/m);
    assert.ok(/flex-wrap: wrap/.test(row), 'the one strip wraps');
    assert.ok(!/overflow-x:\s*auto/.test(row), 'no side scroll on it');
    assert.ok(!rule(/^\.gd-stamp-strip-row\s*\{/m), 'the strip-row wrapper rule is gone');
    const strip = rule(/^\.gd-stamp-strip\s*\{[^}]*\}/m);
    assert.ok(!/overflow-x:\s*auto/.test(strip), 'the panel strip is not a scroll lane');
    const nowrapRule = css.match(/\.gd-stamp-strip(?:-row)? \.gd-stamp-slots\s*\{[^}]*\}/);
    assert.ok(!nowrapRule || !/flex-wrap: nowrap/.test(nowrapRule[0]), 'no rule forces the slots onto one line');
  });

  const modalSrc = src('src/components/NewCharacterModal.jsx');
  ok('0.39.0→0.41.0 the creation window wraps its stamp kit in ONE flow', () => {
    assert.ok(!modalSrc.includes('gd-stamp-strip-row'), 'the strip-row wrapper is gone');
    const kids = /<StampSlots[\s\S]*?<\/StampSlots>/.exec(modalSrc)?.[0] || '';
    assert.ok(kids.includes('StampAddButton') && kids.includes('StampPasteTile'), 'the tiles ride INSIDE the strip');
    assert.ok(kids.includes('gd-stamp-settings-cluster'), 'the settings cluster rides INSIDE the strip');
  });

  // StampSlots renders 7 stamps + the ADD key, all in one lane
  const { StampSlots, StampAddButton } = require(join(appRoot, 'src/components/StampEditModal.jsx'));
  const stamps = Array.from({ length: 7 }, (_, i) => ({ id: `s${i}`, image: `s${i}.png`, name: `sigil ${i}` }));
  const root = freshRoot();
  root.render(
    React.createElement(
      'div',
      { className: 'gd-stamp-strip-row' },
      React.createElement(StampSlots, { stamps, imagesPath: '/img', onRemove: () => {}, onPromote: () => {}, onReorder: () => {}, onRename: () => {} }),
      React.createElement(StampAddButton, {
        stampLibrary: [],
        imagesPath: '/img',
        attachedImages: [],
        onPick: () => {},
        onUpload: () => {},
        onPaste: () => {},
      })
    )
  );
  await sleep(50);
  ok('0.39.0 seven stamps + the ADD key all ride the strip (the kit renders whole)', () => {
    assert.equal(document.querySelectorAll('.gd-stamp-slot:not(.is-empty)').length, 7, 'seven slots');
    assert.ok(document.querySelector('.gd-stamp-slot.is-empty'), 'the ADD key rides the same lane');
    assert.ok(document.querySelector('.gd-stamp-slots'), 'the slots container rides inside the strip row');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ---------------------------------------------------------------------------
// Part D — the images container: the twelve-image budget + the resize grip
// ---------------------------------------------------------------------------
{
  ok('0.40.0 the budget is FOUR ROWS — TEN pictures + the two tiles', () => {
    const modalSrc = src('src/components/NewCharacterModal.jsx');
    assert.match(modalSrc, /DEFAULT_GRID_ROWS = 4/, 'four rows by default');
    assert.match(modalSrc, /MIN_GRID_ROWS = 1/, 'one row is the floor');
    assert.match(modalSrc, /GRID_FIXED_TILES = 2/, 'the ADD + PASTE tiles count against the budget');
    assert.ok(modalSrc.includes('images.length + GRID_FIXED_TILES > Math.floor(capRows * 3)'), 'the cap engages past TEN pictures');
    assert.ok(!modalSrc.includes('MAX_VISIBLE_IMAGES'), 'the old 9-image cap is gone');
  });

  const { default: NewCardModal } = require(join(appRoot, 'src/components/NewCharacterModal.jsx'));
  const mkImages = (n) => Array.from({ length: n }, (_, i) => ({ file: `i${i}.png`, thumb: `i${i}.png` }));
  const renderModal = (root, images) =>
    root.render(
      React.createElement(NewCardModal, {
        initialImages: images,
        imagesPath: '/img',
        defaultRatio: { w: 3, h: 4 },
        classes: [],
        stampLibrary: [],
        confirm: () => {},
        onDeleteFromGallery: () => {},
        onAddToGallery: () => {},
        onClose: () => {},
        onCreate: () => {},
      })
    );

  let root = freshRoot();
  renderModal(root, mkImages(10));
  await sleep(70);
  ok('0.40.0 TEN images: no cap, no scroll, no grip — full natural height', () => {
    // the window renders more than one grid-cols-3 (the pickers ride the
    // same columns) — the IMAGES grid is the one carrying sort items
    const grid = [...document.querySelectorAll('.grid.grid-cols-3')].find((g) => g.querySelector('.gd-sort-item'));
    assert.ok(grid, 'the images grid renders');
    assert.ok(!grid.style.maxHeight, `no maxHeight clamp (got: ${grid.style.maxHeight})`);
    assert.ok(!document.querySelector('.gd-grid-cap-handle'), 'no resize grip at or under the cap');
    assert.equal(grid.querySelectorAll('.gd-sort-item').length, 10, 'all ten squares ride');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
  root = freshRoot();
  renderModal(root, mkImages(11));
  await sleep(70);
  // the cap math needs a measured row: give the wrap a width and fire the
  // observer (the ResizeObserver mock records every instance; the modal's
  // observer rides the LIVE node — the callback ref survives the portal seat)
  const grid13 = [...document.querySelectorAll('.grid.grid-cols-3')].find((g) => g.querySelector('.gd-sort-item'));
  const wrap13 = grid13?.parentElement;
  if (wrap13) Object.defineProperty(wrap13, 'clientWidth', { value: 320, configurable: true });
  RO_STACK.forEach((ro) => ro.cb && ro.cb());
  await sleep(50);
  ok('0.40.0 ELEVEN images: the four-row budget clamps + the resize grip rides under the grid', () => {
    const grid = [...document.querySelectorAll('.grid.grid-cols-3')].find((g) => g.querySelector('.gd-sort-item'));
    assert.ok(grid.style.maxHeight, 'the maxHeight clamp is applied');
    const handle = document.querySelector('.gd-grid-cap-handle');
    assert.ok(handle, 'the grip renders');
    assert.equal(handle.getAttribute('role'), 'separator', 'it announces as a separator');
    assert.ok(handle.title.includes('four rows'), 'the tooltip speaks the range');
  });
  ok('0.39.0→0.41.0 the grip drags in ROWS (DOWN = longer), clamped to [1, 4]', () => {
    const modalSrc = src('src/components/NewCharacterModal.jsx');
    assert.ok(modalSrc.includes('Math.min(DEFAULT_GRID_ROWS, Math.max(MIN_GRID_ROWS,'), 'the clamp law');
    // 0.41.0 — "when i pull down it should pull down": a bottom-edge handle
    // follows the hand — down lengthens, up shortens.
    assert.ok(/e\.clientY - drag\.startY/.test(modalSrc), 'down = longer, in row fractions');
    assert.ok(!/drag\.startY - e\.clientY/.test(modalSrc), 'the reversed math is gone');
    const capHandle = rule(/^\.gd-grid-cap-handle\s*\{[^}]*\}/m);
    assert.ok(/cursor: ns-resize/.test(capHandle), 'the ns-resize cursor');
    const grip = rule(/^\.gd-grid-cap-grip\s*\{[^}]*\}/m);
    assert.ok(/border-radius: 9999px/.test(grip), 'the pill grip');
    assert.ok(/\.gd-grid-cap-handle:hover \.gd-grid-cap-grip/.test(css), 'the grip answers hover');
    assert.ok(/pinned=\{capLive\}/.test(modalSrc), '0.42.0: the modal is POSITION-PINNED mid-drag (nothing re-centers, the layout flows live)');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ---------------------------------------------------------------------------
// Part E — the right panel's stamp row: the tower UNDER the strip
// ---------------------------------------------------------------------------
{
  const { default: CharacterView } = require(join(appRoot, 'src/components/CharacterView.jsx'));
  const { makeCharacter } = await import(join(appRoot, 'src/constants/index.js'));
  const character = makeCharacter('amy', 'root', [{ file: 'a.png', thumb: 'a.png' }]);
  character.stamps = [
    { id: 's1', image: 'a.png', name: 'sigil one' },
    { id: 's2', image: 'b.png', name: 'sigil two' },
  ];
  character.stampSettings = { color: '#c8402f', colorAlpha: 0.8 };
  const root = freshRoot();
  root.render(
    React.createElement(CharacterView, {
      compact: true,
      character,
      tags: [],
      stampLibrary: [],
      imagesPath: '/img',
      outputBarOn: true,
      onBack: () => {},
      patchCharacter: () => {},
      onRename: () => {},
      onDelete: () => {},
      onToggleTag: () => {},
      onOpenTagManager: () => {},
      onAttachStamp: () => {},
      onRemoveStamp: () => {},
      onPromoteStamp: () => {},
      onUploadStamp: () => {},
      onRenameStamp: () => {},
      onReorderStamps: () => {},
      onStampColor: () => {},
      onStampTransform: () => {},
      confirm: () => {},
      onStatus: () => {},
      onActiveVersion: () => {},
    })
  );
  await sleep(70);
  // 1.3.2 — the staged mount lands the rows tray on its own breaths; wait
  // for the STRIP itself before any check reads it (the 1.3.1 flake's root).
  for (let wait = 0; wait < 40 && !document.querySelector('.gd-stamp-strip'); wait += 1) {
    await sleep(50);
  }

  // 1.3.4 re-law: the settings merge into ONE stacked cluster ("2 options
  // on each other, instead of horizontal") — the color key above the
  // settings key inside .gd-stamp-settings-cluster, one flow seat.
  ok('0.39.0→1.3.4 the settings keys ride the strip as one stacked cluster', () => {
    const strip = document.querySelector('.gd-stamp-strip');
    assert.ok(strip, 'the strip zone renders');
    const tower = document.querySelector('.gd-stamp-tower-row');
    assert.ok(!tower, 'the tower row is gone');
    const cluster = document.querySelector('.gd-stamp-settings-cluster');
    assert.ok(cluster, 'the stacked cluster renders (1.3.4: color above settings)');
    const color = document.querySelector('.gd-stamp-color');
    const pos = document.querySelector('.gd-stamp-pos');
    assert.ok(color && pos, 'the color key and the transform key render');
    assert.ok(cluster.contains(color) && cluster.contains(pos), 'both keys ride INSIDE the cluster');
    // 1.4.6 SUPERSEDED (the tower's column seat): the cluster rides the
    // ROW's own left column now — beside the strip, under the + STAMP key,
    // always in view — and still folds with the rows as one (the rows-body
    // carries both; gendex_155 pins the seat).
    assert.ok(!strip.contains(cluster), 'the cluster rides the row\'s own left column (beside the strip)');
    assert.ok(!rule(/^\.gd-stamp-tower-row\s*\{/m), 'no tower row rule remains');
  });

  // 1.3.2 — the staged mount lands the rows tray on its own rAF breaths;
  // under battery load jsdom's clock can outrun the 70ms seed (the 1.3.1
  // flake). Wait for the toggle honestly instead of racing it.
  let stampsToggle = null;
  for (let wait = 0; wait < 40 && !stampsToggle; wait += 1) {
    stampsToggle = [...document.querySelectorAll('.gd-row-toggle')].find((t) => t.textContent.includes('STAMPS'));
    if (!stampsToggle) await sleep(50);
  }
  click(stampsToggle);
  await sleep(50);
  ok('0.39.0→0.41.0 collapsing the stamps row folds EVERYTHING (options included) as one', () => {
    // 0.41.0 — the tower row is gone: the cluster rides inside the strip, so
    // the ONE measured clamp folds slots + tiles + options together.
    const zone = document.querySelector('.gd-collapse-zone.gd-stamp-strip:not(.gd-side-probe)');
    assert.ok(zone, 'the strip zone renders');
    assert.ok(zone.className.includes('is-collapsed'), 'the strip clamps to its first line');
    assert.ok(!document.querySelector('.gd-stamp-tower-row'), 'no second fold exists to stagger');
    const clamped = rule(/^\.gd-collapse-zone\.is-collapsed\s*\{[^}]*\}/m);
    assert.ok(/overflow: hidden/.test(clamped), 'the clamp hides, never display:none');
  });
  click(stampsToggle);
  await sleep(50);
  ok('0.39.0→1.3.1 expanding brings the whole strip back (options included)', () => {
    const zone = document.querySelector('.gd-collapse-zone.gd-stamp-strip:not(.gd-side-probe)');
    assert.ok(zone && !zone.className.includes('is-collapsed'), 'the strip un-clamps');
    assert.ok(document.querySelector('.gd-stamp-color') && document.querySelector('.gd-stamp-pos'), 'both settings keys are back with the stamps');
  });

  ok('0.39.0 the rows fold BREATHES (measured height tween, content stays mounted)', () => {
    const viewSrc = src('src/components/CharacterView.jsx');
    assert.ok(viewSrc.includes('gd-rows-body'), 'the measured wrapper exists');
    assert.ok(/animate=\{autoCollapsed \? \{ height: 0, opacity: 0 \}/.test(viewSrc), 'the fold tweens height + opacity');
    assert.ok(viewSrc.includes('gd-rows-body-inert'), 'the folded body is inert to the pointer');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ---------------------------------------------------------------------------
// Part F — the class tree: offscreen spawns, left-flipped tools, texture,
//          the animated reveal
// ---------------------------------------------------------------------------
{
  const { default: ClassSidebar } = require(join(appRoot, 'src/components/ClassSidebar.jsx'));
  const sidebarSrc = src('src/components/ClassSidebar.jsx');

  ok('0.39.0 a NEW class auto-reveals (never spawns offscreen)', () => {
    assert.ok(sidebarSrc.includes('prevClassIdsRef'), 'the class-list watcher exists');
    assert.ok(/revealSelected\(fresh\.id\)/.test(sidebarSrc), 'the first fresh id glides into view');
    assert.ok(sidebarSrc.includes("requestAnimationFrame(() => requestAnimationFrame("), 'double rAF: the unfold paints first');
    assert.ok(/setCollapsed\(\(was\)/.test(sidebarSrc), 'only the ANCESTORS unfold (the rest keeps its state)');
  });

  ok('0.39.0 the reveal scroll is a MOVEMENT, not a snap — both axes', () => {
    assert.ok(sidebarSrc.includes("scroller.scrollTo({ left, top, behavior: 'smooth' })"), 'the smooth glide');
    assert.ok(sidebarSrc.includes('cr.bottom - (sr.bottom - pad)'), 'vertical clipping covered too');
    assert.ok(sidebarSrc.includes('cr.right - (sr.right - pad)'), 'horizontal right-clip');
    assert.ok(sidebarSrc.includes('cr.left < sr.left + pad'), 'horizontal left-clip');
  });

  ok('0.40.0→0.41.0 the tools are RETIRED — no seat ladder, no lanes, no pop strips', () => {
    assert.ok(!sidebarSrc.includes('toolsSeat'), 'no seat state exists');
    assert.ok(!sidebarSrc.includes('gd-tree-tools'), 'no tools plate renders');
    assert.ok(!sidebarSrc.includes('gd-tree-tools-pop'), 'no pop strips');
    assert.ok(!rule(/^\.gd-tree-tools\.is-left\s*\{/m), 'no left-lane rule remains');
    assert.ok(!rule(/^\.gd-tree-tools-pop\s*\{/m), 'no pop-strip rule remains');
  });

  ok('0.39.0 the texture rides the SCROLLER (both axes slide the pattern)', () => {
    assert.ok(/gd-tree-scroll gd-tex-sidebar/.test(sidebarSrc), 'the scroller wears the texture class');
    const tex = rule(/^\.gd-tex-sidebar\s*\{[^}]*\}/m);
    assert.ok(/background-attachment: local/.test(tex), 'LOCAL: the pattern moves with the content');
    assert.ok(/background: 'var\(--gd-bg\)'/, !sidebarSrc.includes("className=\"w-full flex-shrink-0 flex flex-col gd-hairline-r h-full gd-tex-sidebar\"") ? 'sanity' : 'the root dropped the class');
  });

  ok('0.39.0 the expander seats fully inside the card (no left poke)', () => {
    const card = rule(/^\.gd-tree-card\s*\{[^}]*\}/m);
    assert.ok(/padding-left: 3px/.test(card), '3px of seat inside the rounded left corners');
  });

  // DOM: the hover probe flips the tools cluster
  const classes = [
    { id: 'c1', name: 'branch', parentId: 'root', icon: null, color: null },
    { id: 'c1a', name: 'deep leaf', parentId: 'c1', icon: null, color: null },
  ];
  const root = freshRoot();
  root.render(
    React.createElement(ClassSidebar, {
      classes,
      characters: [],
      selectedClassId: 'c1a',
      dragRef: { current: null },
      onSelectClass: () => {},
      onAddClass: () => {},
      onRenameClass: () => {},
      onDeleteClass: () => {},
      onMoveClass: () => {},
      onAssignCharacter: () => {},
      onNewCharacter: () => {},
      confirm: () => {},
      onStatus: () => {},
    })
  );
  await sleep(70);

  ok('0.39.0 the tree scroller carries the texture (0.41.0: no tools anywhere)', () => {
    const scroller = document.querySelector('.gd-tree-scroll');
    assert.ok(scroller, 'the scroller renders');
    assert.ok(scroller.className.includes('gd-tex-sidebar'), 'the texture rides it');
    assert.ok(!document.querySelector('.gd-tree-tools'), 'no hover tools render');
    assert.ok(!document.querySelector('.gd-tree-tools-pop'), 'no pop strips render');
  });

  // 0.41.0 — the seat-ladder choreography is retired with the tools
  // themselves: hovering a row (or anything else) never materializes keys.
  const leafRow = document.querySelector('[data-gd-class-id="c1a"]');
  assert.ok(leafRow, 'the leaf row renders');
  leafRow.dispatchEvent(new dom.window.MouseEvent('pointerover', { bubbles: true, relatedTarget: document.body }));
  await sleep(50);
  ok('0.40.0→0.41.0 hovering never seats any tools (the right-click menu owns the actions)', () => {
    assert.ok(!document.querySelector('.gd-tree-tools'), 'no in-card cluster appears');
    assert.ok(!document.querySelector('.gd-tree-tools-pop'), 'no pop strip appears');
    assert.ok(!leafRow.querySelector('.gd-tree-tools'), 'nothing on the leaf itself');
    const count = leafRow.querySelector('.gd-tree-count');
    assert.ok(count, 'the count stays put (nothing ducks away for keys anymore)');
  });
  ok('0.40.0→0.41.0 the EDIT CLASS window carries the confirm-gated DELETE CLASS key', () => {
    const sidebarSrcNow = src('src/components/ClassSidebar.jsx');
    assert.ok(/DELETE CLASS/.test(sidebarSrcNow), 'the key renders in the editor');
    assert.ok(/askDeleteFromModal/.test(sidebarSrcNow), 'it routes through the confirm ask');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ---------------------------------------------------------------------------
// Part G — the huge image viewer rework
// ---------------------------------------------------------------------------
{
  const { default: ImageViewer } = require(join(appRoot, 'src/components/ImageViewer.jsx'));
  const viewerSrc = src('src/components/ImageViewer.jsx');
  const images = [
    { file: 'one.png', thumb: 'one.png' },
    { file: 'two.png', thumb: 'two.png' },
  ];

  ok('0.39.0 the viewer portals to BODY level (nothing crops under the toolbar)', () => {
    assert.ok(viewerSrc.includes('createPortal'), 'the portal exists');
    assert.ok(viewerSrc.includes('setPortalTo'), 'the lazy body target');
  });

  ok('0.39.0 the drag is STRICT 1:1 (anchored at grab, no accelerator)', () => {
    assert.ok(/pan\.baseTx \+ \(e\.clientX - pan\.startX\)/.test(viewerSrc), 'exactly the pointer delta from the base');
    assert.ok(viewerSrc.includes('baseTx: tx'), 'the base is captured at grab time');
    assert.ok(!/pan\.tx = nx/.test(viewerSrc), 'the accumulator is gone');
  });

  ok('0.39.0 the pan is CLAMPED — no gap at an edge, no move while it fits', () => {
    assert.ok(viewerSrc.includes('const clampPan = ('), 'the clamp exists');
    assert.ok(/Math\.max\(0, \(dispW - stage\.clientWidth\) \/ 2\)/.test(viewerSrc), 'x caps at the overflow half-width');
    assert.ok(viewerSrc.includes('const canPan ='), 'grabs only while an axis overflows');
    assert.ok(viewerSrc.includes('is-grabbable'), 'the grab cursor is earned');
    const stageRule = rule(/^\.gd-imgview-stage\s*\{[^}]*\}/m);
    assert.ok(/cursor: default/.test(stageRule), 'the bare stage is not a grab target');
    const grab = rule(/^\.gd-imgview-stage\.is-grabbable\s*\{[^}]*\}/m);
    assert.ok(/cursor: grab/.test(grab), 'grab only once it overflows');
  });

  ok('0.40.0→0.41.0 the CROP tool is RETIRED ("remove the crop feature since its broken")', () => {
    assert.ok(!viewerSrc.includes('crossOrigin="anonymous"'), 'no crossOrigin on the displayed image (that law stays)');
    assert.ok(!viewerSrc.includes('loadCleanImage'), 'the clean-copy loader is gone with the crop');
    assert.ok(!viewerSrc.includes('CROP_EDGE_BAND'), 'no edge auto-pan exists');
    assert.ok(!viewerSrc.includes('CROP_PAN_SPEED'), 'no band speed exists');
    assert.ok(!viewerSrc.includes('gd-imgview-crop-box'), 'no selection rect renders');
    assert.ok(!rule(/^\.gd-imgview-crop-box\s*\{/m), 'and no CSS for it');
    assert.ok(viewerSrc.includes('THE CROP TOOL IS RETIRED'), 'the retirement note rides the header');
  });

  let closed = 0;
  const root = freshRoot();
  // render the viewer DEEP inside a nested container — the portal must lift it to body
  root.render(
    React.createElement(
      'div',
      { id: 'deep' },
      React.createElement(
        'div',
        { id: 'deeper' },
        React.createElement(ImageViewer, {
          images,
          imagesPath: '/img',
          index: 0,
          onIndex: () => {},
          onClose: () => {
            closed += 1;
          },
          onCropSaved: () => {},
        })
      )
    )
  );
  await sleep(60);

  ok('0.39.0 the overlay lands at BODY level, peeks inside the ONE bottom toolbar', () => {
    const overlay = document.querySelector('.gd-imgview');
    assert.ok(overlay, 'the overlay renders');
    assert.ok(overlay.parentElement === document.body, `it rides at body level (parent: ${overlay.parentElement?.id || overlay.parentElement?.tagName})`);
    const hud = document.querySelector('.gd-imgview-hud');
    assert.ok(hud, 'the toolbar renders');
    assert.ok(hud.querySelector('.gd-imgview-peeks'), 'the [prev · CURRENT · next] cluster rides INSIDE the toolbar');
    assert.ok(!document.querySelector('.gd-imgview-peeks')?.parentElement?.classList?.contains('gd-imgview'), 'no floating peek row above the bar');
  });

  ok('0.39.0 a press on the EMPTY area closes the viewer', () => {
    const stage = document.querySelector('.gd-imgview-stage');
    assert.ok(stage, 'the stage renders');
    stage.dispatchEvent(new dom.window.MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    stage.dispatchEvent(new dom.window.MouseEvent('pointerup', { bubbles: true, button: 0 }));
    assert.equal(closed, 1, 'the bare-stage press closed it');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ---------------------------------------------------------------------------
// Part H — the stage eye + the click-only-on-the-picture + misc
// ---------------------------------------------------------------------------
{
  const { default: ImageStage } = require(join(appRoot, 'src/components/ImageStage.jsx'));
  const stageSrc = src('src/components/ImageStage.jsx');
  let openedWith = null;
  const images = [{ file: 'one.png', thumb: 'one.png' }];
  const root = freshRoot();
  root.render(
    React.createElement(ImageStage, {
      images,
      imagesPath: '/img',
      index: 0,
      onIndex: () => {},
      onOpenViewer: (i) => {
        openedWith = i;
      },
      patchVersion: () => {},
      onPasteRecord: () => {},
      onStatus: () => {},
      onDeleteImage: () => {},
      confirm: () => {},
    })
  );
  await sleep(60);

  ok('0.39.0 the EYE rides over the picture (radial darkening, hover only)', () => {
    const eye = document.querySelector('.gd-stage-eye');
    assert.ok(eye, 'the eye span renders');
    const eyeRule = rule(/^\.gd-stage-eye\s*\{[^}]*\}/m);
    assert.ok(/radial-gradient/.test(eyeRule), 'a soft radial spotlight (not the whole image)');
    assert.ok(/pointer-events: none/.test(eyeRule), 'it never intercepts the pointer');
    assert.ok(/opacity: 0/.test(eyeRule), 'hidden at rest');
    assert.ok(/\.gd-stage:hover \.gd-stage-eye\s*\{[^}]*opacity: 1/.test(css), 'hover breathes it in');
  });

  ok('0.39.0 ONLY an explicit click on the picture opens the viewer', () => {
    const pic = document.querySelector('.gd-stage-clickpic');
    assert.ok(pic, 'the picture wrapper renders');
    // the click rides the picture's wrapper
    click(pic);
    assert.equal(openedWith, 0, 'the picture click opened the viewer');
    // the stage's own body (the sides) never opens it
    openedWith = null;
    const stage = document.querySelector('.gd-stage');
    click(stage); // a click landing on the bare stage itself
    assert.equal(openedWith, null, 'the bare stage click did NOT open the viewer');
    const picRule = rule(/^\.gd-stage-clickpic\s*\{[^}]*\}/m);
    assert.ok(/cursor: pointer/.test(picRule), 'the picture wears the pointer hand (clickable feedback)');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';

  ok('0.39.0 the NEW VERSION key presses THROUGH the sort (the trailing tap creates)', () => {
    const viewSrc = src('src/components/CharacterView.jsx');
    assert.ok(/if \(i >= versions\.length\) \{\s*\n\s*addVersion\(\);/.test(viewSrc), 'the trailing tap IS the button press');
  });

  ok('0.39.0 CARD COLOR sits in the RIGHT column, below the emoji picker', () => {
    const modalSrc = src('src/components/NewCharacterModal.jsx');
    const iconAt = modalSrc.indexOf('<LucideIconPicker value={vIcon} onSelect={setVIcon} />');
    const colorAt = modalSrc.indexOf('CARD COLOR</div>');
    assert.ok(iconAt > 0 && colorAt > iconAt, 'the section follows the icon picker in the right column');
    assert.equal(modalSrc.indexOf('CARD COLOR</div>'), modalSrc.lastIndexOf('CARD COLOR</div>'), 'exactly one CARD COLOR label (the left column copy is gone)');
  });

  ok('0.39.0 EDIT CLASS: the context menu opens the FULL editor through the sidebar', () => {
    const appSrc = src('src/App.jsx');
    assert.ok(appSrc.includes("setEditClassId(cls.id)"), 'the menu names a class id');
    assert.ok(appSrc.includes('editClassRequest={editClassId}'), 'App hands it to the sidebar');
    assert.ok(appSrc.includes('onEditClassHandled'), 'the sidebar reports back');
    assert.ok(!appSrc.includes("type: 'renameClass'"), "App's own bare rename modal is gone");
    const sidebarSrc = src('src/components/ClassSidebar.jsx');
    assert.ok(sidebarSrc.includes('EDIT CLASS'), 'the window title says EDIT CLASS');
  });

  ok('0.39.0 the full view leaves with a READABLE out-animation', () => {
    const appSrc = src('src/App.jsx');
    /* 1.0.7 — the flights moved into CHAR_COVER_VARIANTS; 1.2.0 — the
       close DEEPENED (x 44 -> 64, its own 0.26s clock) so it reads as a
       close instead of an instant vanish. A hand-off still fades in place. */
    /* 1.2.6 — THE SLIDE STAYS VISIBLE: the exit's opacity is KEYFRAMED
       ([1, 1, 0], the fade packed into the last 40% of a 0.3s clock that
       rides the variant itself) — the 1.2.0 linear fade buried
       three-quarters of the 64px flight and the close still read as a
       blink. x deepened to 88. */
    assert.ok(/opacity: \[1, 1, 0\],/.test(appSrc), 'the exit opacity holds while it travels (1.2.6: keyframed)');
    assert.ok(/x: 88,/.test(appSrc), 'travels further on the way out (1.2.6: 88px)');
    assert.ok(/times: \[0, 0\.6, 1\]/.test(appSrc), 'the fade rides the tail (the last 40%)');
    assert.ok(/duration: 0\.3,/.test(appSrc), 'and breathes on its own longer clock (0.3s, riding the variant)');
  });
}

// ---------------------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
