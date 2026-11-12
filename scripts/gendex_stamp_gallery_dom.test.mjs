// Behavioral DOM test for the 0.26.0 stamps-gallery batch:
//   · THE GALLERY-ARG REGRESSION — the creation dialog's naming queue must
//     call onAddToGallery with POSITIONAL (image, name) args. It used to
//     pass one { image, name } OBJECT while App.addStampToGallery read
//     positional args, so the library stored "[object Object]" as the image
//     (an INVALID chip) and CREATE re-added the real file as a DUPLICATE.
//   · THE GREY-OUT — in the creation window, stamps already on the card
//     stay VISIBLE in the gallery + the ADD picker, dimmed and inert
//     (is-attached), instead of being hidden.
//
// Requires jsdom (installed dev-only). Skips gracefully without it.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch {
  console.log('jsdom unavailable — stamp gallery DOM test skipped (dev-only dependency)');
  process.exit(0);
}

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></div></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;
global.NodeFilter = dom.window.NodeFilter;
// 0.34.0 — the lazy Modal portal remounts windows into document.body, which
// replays their entrance animations; framer's keyframe measurer touches the
// DOM class globals while doing so (same list the batch tests carry).
for (const k of ['HTMLElement', 'Element', 'SVGElement', 'MutationObserver', 'CustomEvent']) {
  if (dom.window[k] !== undefined && global[k] === undefined) global[k] = dom.window[k];
}
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = dom.window.requestAnimationFrame;
global.cancelAnimationFrame = dom.window.cancelAnimationFrame;
global.Image = dom.window.Image; // useImageAspect / dominantColorOf construct images
global.IS_REACT_ACT_ENVIRONMENT = true;

// Mock window.api BEFORE the components load (mirrors the boot test's
// preload-parity surface — only the pieces these flows touch).
window.api = {
  importImagesFromFiles: async () => [{ file: 'x.png', thumb: 'x_t.jpg' }],
  saveImageBuffer: async () => null,
  deleteImageFile: async () => true,
};

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

const { default: NewCharacterModal } = require('../src/components/NewCharacterModal.jsx');
const { StampAddButton } = require('../src/components/StampEditModal.jsx');

let passed = 0;
const ok = async (name, fn) => {
  await fn();
  passed += 1;
  console.log(`  ok ${passed} — ${name}`);
};
const sleep = () => new Promise((r) => setTimeout(r, 0));

const stampLibrary = [
  { id: 'tpl-a', image: 'guild.png', name: 'guild' },
  { id: 'tpl-b', image: 'seal.png', name: 'seal' },
  { id: 'tpl-x', image: 'x.png', name: 'the new one' },
];

const click = (el) =>
  React.act(async () => {
    el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  });

const typeInto = (input, text) =>
  React.act(async () => {
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, text);
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });

const mount = async (element) => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  await React.act(async () => {
    root.render(element);
  });
  return { root, container };
};

const unmount = async (handle) => {
  await React.act(async () => {
    handle.root.unmount();
  });
  handle.container.remove();
};

// ---------------------------------------------------------------------------
await ok('0.26.0 gallery-arg regression: the naming queue calls onAddToGallery with POSITIONAL (image, name) — never an object', async () => {
  const calls = [];
  const handle = await mount(
    React.createElement(NewCharacterModal, {
      initialImages: [{ file: 'a.png', thumb: 'a_t.jpg' }],
      imagesPath: 'C:/img',
      defaultRatio: { w: 3, h: 4 },
      classes: [],
      defaultClassId: 'root',
      stampLibrary,
      onAddToGallery: (...args) => calls.push(args),
      onClose: () => {},
      onCreate: () => {},
    })
  );
  try {
    // Open the ADD key's picker (the popover portals to document.body).
    const addKey = document.querySelector('.gd-stamp-slot.is-empty');
    assert.ok(addKey, 'the ADD key rendered');
    await click(addKey);
    await sleep();
    // The picker is open — UPLOAD A STAMP hands the mocked record to the
    // naming queue.
    const uploadBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent.includes('UPLOAD A STAMP')
    );
    assert.ok(uploadBtn, 'the picker opened with the UPLOAD key');
    await click(uploadBtn);
    await sleep();
    // The stamp window: name it and SAVE.
    const nameInput = document.querySelector('input[placeholder="e.g. studio logo"]');
    assert.ok(nameInput, 'the stamp window opened with its NAME field');
    await typeInto(nameInput, 'logo');
    const saveBtn = Array.from(document.querySelectorAll('.gd-btn-solid')).find((b) =>
      b.textContent.includes('SAVE')
    );
    assert.ok(saveBtn, 'the stamp window SAVE key exists');
    await click(saveBtn);
    await sleep();

    // THE REGRESSION: exactly one call, positional STRING image + name.
    assert.equal(calls.length, 1, `expected exactly one onAddToGallery call, saw ${calls.length}`);
    const [image, name] = calls[0];
    assert.equal(image, 'x.png', `the image must be the real file string, got: ${JSON.stringify(image)}`);
    assert.equal(name, 'logo');
    assert.equal(typeof image, 'string', 'the image arg must be a string — an object here is the 0.25.0 "[object Object]" bug');
  } finally {
    await unmount(handle);
  }
});

// ---------------------------------------------------------------------------
await ok('0.26.0 creation-window gallery: a stamp that just joined the card GREYS OUT in the strip (is-attached, disabled, no trash) while the rest stay active', async () => {
  const handle = await mount(
    React.createElement(NewCharacterModal, {
      initialImages: [{ file: 'a.png', thumb: 'a_t.jpg' }],
      imagesPath: 'C:/img',
      defaultRatio: { w: 3, h: 4 },
      classes: [],
      defaultClassId: 'root',
      stampLibrary,
      onAddToGallery: () => {},
      onClose: () => {},
      onCreate: () => {},
    })
  );
  try {
    // Run the naming flow once — x.png joins the DRAFT (and the library).
    const addKey = document.querySelector('.gd-stamp-slot.is-empty');
    await click(addKey);
    await sleep();
    const uploadBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent.includes('UPLOAD A STAMP')
    );
    await click(uploadBtn);
    await sleep();
    await typeInto(document.querySelector('input[placeholder="e.g. studio logo"]'), 'logo');
    await click(Array.from(document.querySelectorAll('.gd-btn-solid')).find((b) => b.textContent.includes('SAVE')));
    await sleep();

    // The draft now carries x.png — its gallery chip is greyed out.
    const chips = Array.from(document.querySelectorAll('.gd-stamp-lib-chip'));
    assert.equal(chips.length, 3, `the gallery shows EVERY stamp (3), got ${chips.length}`);
    const chipFor = (file) => chips.find((c) => c.querySelector('img')?.getAttribute('src').includes(file));
    const grey = chipFor('x.png');
    const live = chipFor('guild.png');
    assert.ok(grey, 'the attached stamp still renders in the gallery');
    assert.ok(grey.classList.contains('is-attached'), 'the attached chip wears the grey-out class');
    assert.equal(grey.disabled, true, 'the attached chip is inert');
    assert.ok(!live.classList.contains('is-attached'), 'a free chip stays active');
    assert.equal(live.disabled, false, 'a free chip stays clickable');
    // trash keys: only on the chips NOT on this card.
    const dels = document.querySelectorAll('.gd-stamp-lib-del');
    assert.equal(dels.length, 2, `only the 2 free chips carry the trash key, saw ${dels.length}`);
  } finally {
    await unmount(handle);
  }
});

// ---------------------------------------------------------------------------
await ok('0.26.0 StampAddButton greyAttached (creation window): attached tiles stay VISIBLE, greyed + inert; free tiles pick fine', async () => {
  const picked = [];
  const handle = await mount(
    React.createElement(StampAddButton, {
      stampLibrary,
      imagesPath: 'C:/img',
      attachedImages: ['guild.png'],
      greyAttached: true,
      onPick: (tpl) => picked.push(tpl),
      onUpload: () => {},
    })
  );
  try {
    await click(document.querySelector('.gd-stamp-slot.is-empty'));
    await sleep();
    const tiles = Array.from(document.querySelectorAll('.gd-spot-tile'));
    assert.equal(tiles.length, 3, `every tile stays visible in the creation picker, got ${tiles.length}`);
    const grey = tiles.find((t) => t.querySelector('img')?.getAttribute('src').includes('guild.png'));
    const free = tiles.find((t) => t.querySelector('img')?.getAttribute('src').includes('seal.png'));
    assert.ok(grey.classList.contains('is-attached'), 'the attached tile wears the grey-out class');
    assert.equal(grey.disabled, true, 'the attached tile is inert');
    assert.ok(!free.classList.contains('is-attached') && !free.disabled, 'the free tile is pickable');
    await click(free);
    assert.deepEqual(picked.map((t) => t.image), ['seal.png']);
    await click(grey);
    assert.equal(picked.length, 1, 'clicking the greyed tile does nothing');
  } finally {
    await unmount(handle);
  }
});

// ---------------------------------------------------------------------------
await ok('0.26.0 StampAddButton WITHOUT greyAttached (character panel): attached stamps stay hidden, as before', async () => {
  const handle = await mount(
    React.createElement(StampAddButton, {
      stampLibrary,
      imagesPath: 'C:/img',
      attachedImages: ['guild.png'],
      onPick: () => {},
      onUpload: () => {},
    })
  );
  try {
    await click(document.querySelector('.gd-stamp-slot.is-empty'));
    await sleep();
    const tiles = Array.from(document.querySelectorAll('.gd-spot-tile'));
    assert.equal(tiles.length, 2, `the character panel picker hides the attached stamp, got ${tiles.length}`);
    assert.ok(!tiles.some((t) => t.querySelector('img')?.getAttribute('src').includes('guild.png')));
    assert.ok(tiles.every((t) => !t.classList.contains('is-attached') && !t.disabled));
  } finally {
    await unmount(handle);
  }
});

console.log(`\n${passed} stamp gallery DOM checks passing`);
