// 0.34.0 — THE WINDOW KIT + THE PATTERN ROTATION + THE STAGE'S NEW LAWS +
// THE VERSION FLOW + THE LOCKOUT, behavioral DOM tests on the real
// components / the real sources.
//   Part A — THE PORTALED WINDOW KIT: Modal renders through a body portal
//     (the stamp rename window's top-right-corner bug), the card never
//     outgrows the viewport, the settings window is wider + its rail can
//     never clip.
//   Part B — THE PATTERN ROTATION: the emoji wall is retired for SPARKLES
//     (pure SVG stars — no font), confetti reverts to the classic 0.32.0
//     sprinkle, and old databases migrate onto sparkles.
//   Part C — THE STAGE'S NEW LAWS: AUTO-SWITCH IMAGES walks the set every
//     5s (paused under windows / on hover), and starring a cover moves the
//     VIEW to the new top image.
//   Part D — THE IMAGE MANAGER's moving marks: the selection ring and the
//     COVER badge are shared-layout spans that glide between slots; the
//     manager's PASTE answers through the top-of-screen pill.
//   Part E — THE VERSION FLOW: a card opens on its TOP version; NEW
//     VERSION opens the window on a draft — CANCEL creates nothing, CREATE
//     lands it.
//   Part F — THE TOP BAR LOCKOUT + THE DROPDOWN SWEEP: any window mounts →
//     the titlebar's app keys dim and go inert; every open dropdown
//     dismisses itself.
//   Part G — THE STAMP ROW's gliding ring; the class modal's preview wears
//     the CLASS BUTTON look, not the tag look.
//   Part H — CSS guards: the verdict pill pinned to the screen top, the
//     scroll guard freezing transitions (not transforms), rounded chips
//     containing their text, reduced-motion skipping every fade.
// Run: node scripts/gendex_034_batch_dom.test.mjs
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
  console.log('jsdom unavailable — 0.34.0 batch DOM test skipped');
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
    console.error(`  FAIL ${name}\n${e.stack}`);
    process.exitCode = 1;
    throw e;
  }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const noop = () => {};
const src = (p) => readFileSync(join(appRoot, p), 'utf8');

// ============================================================================
// Part A — the portaled window kit
// ============================================================================
{
  const modalSrc = src('src/components/Modal.jsx');
  ok('0.34.0 Modal renders through a BODY PORTAL (ancestor-proof centering)', () => {
    assert.ok(modalSrc.includes('createPortal'), 'the portal is used');
    assert.ok(/portalTo \? createPortal\(card, portalTo\) : card/.test(modalSrc), 'the lazy target pattern');
    assert.ok(/useLayoutEffect\(\(\) => \{[\s\S]{0,200}document\.body/.test(modalSrc), 'the target lands on document.body in a layout effect');
    // the bug that made the stamp rename window hang off the top-right
    // corner: fixed-position children anchor to TRANSFORMED ancestors —
    // the portaled window escapes every ancestor.
    assert.ok(modalSrc.includes('gd-char-head'), 'the comment names the culprit (the composited sticky header)');
  });
  const css = src('src/index.css');
  ok('0.34.0 the modal card never outgrows the viewport (max-width cap)', () => {
    const rule = /\.gd-modal-card\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/max-width: calc\(100vw - 48px\)/.test(rule), 'the card caps at the window minus its padding');
  });
  const settingsSrc = src('src/components/SettingsModal.jsx');
  ok('0.34.0 the settings window is WIDER so the Performance text never clips', () => {
    assert.ok(settingsSrc.includes("width=\"w-[760px]\""), 'the wider card (0.44.0: 720→760 for the serif face)');
    const shell = /\.gd-settings-shell\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/min-height: 372px/.test(shell), 'the shell carries a floor — the rail never collapses');
    const rail = /\.gd-settings-rail\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/overflow-y: auto/.test(rail) && /min-height: 0/.test(rail), 'the rail scrolls instead of clipping');
  });
  ok('0.34.0 every dropdown CLAMPS + FLIPS (never outside the screen) and closes when a window opens', () => {
    const popSrc = src('src/components/Popover.jsx');
    assert.ok(popSrc.includes('r.top - 6 - h'), 'the flip-above-the-anchor math');
    // 0.36.0 — the blanket clamp became the EXTEND/FLIP/STOOP ladder: the
    // natural-size measure + the neither-side-fits branch carry the clamp now.
    assert.ok(/card\.style\.maxHeight = 'none'/.test(popSrc), 'the natural (unclamped) size is what gets measured');
    assert.ok(/roomBelow/.test(popSrc) && /roomAbove/.test(popSrc), 'the taller side wins the stoop (inside scroll, last resort)');
    assert.ok(popSrc.includes('gd-close-popovers'), 'the dropdown sweep listener');
    const appSrc = src('src/App.jsx');
    assert.ok(appSrc.includes("'gd-close-popovers'"), 'App fires the sweep when a window appears');
  });
}

// ============================================================================
// Part B — the pattern rotation (constants + engine sources)
// ============================================================================
{
  const { TEXTURES, THEME_PRESETS } = require(join(appRoot, 'src/constants/index.js'));
  const texSrc = src('src/utils/textures.js');
  ok('0.34.0 the emoji wall is RETIRED; SPARKLES takes its slot (pure SVG, no font)', () => {
    assert.ok(!TEXTURES.some((t) => t.id === 'emojis'), 'emojis left the picker');
    assert.ok(TEXTURES.some((t) => t.id === 'sparkles' && t.label === 'Sparkles'), 'sparkles is in');
    assert.ok(!texSrc.includes('EMOJI_PALETTE'), 'the emoji palette is deleted');
    assert.ok(!texSrc.includes('<text'), 'no SVG text glyphs anywhere');
    assert.ok(texSrc.includes('sparklePath'), 'the four-point star path builder');
  });
  ok('0.34.0 confetti — 0.42.0 reworked: a big RANDOM 480px scatter, not a repeating tile', () => {
    assert.ok(/confettiScatter\(\{ tile: 480, color: c, cSoft \}\)/.test(texSrc), 'the 480px scatter build');
    assert.ok(texSrc.includes('Math.random'), 'rolled per instance, not pre-determined');
    assert.ok(!texSrc.includes('confettiTile('), 'the old 64px seeded tile is gone');
  });
  ok('0.34.0 the craft table wears sparkles; old emoji databases migrate onto it', () => {
    const craft = THEME_PRESETS.find((t) => t.id === 'craft');
    assert.equal(craft.texDefaults.viewer, 'sparkles', "craft's viewer default");
    const helpersSrc = src('src/utils/helpers.js');
    assert.ok(/TEXTURE_RENAMES = \{ charms: 'sparkles', shuffle: 'sparkles', emojis: 'sparkles' \}/.test(helpersSrc), 'the rename continuity map');
  });
}

// ============================================================================
// Part C — the stage's new laws (the real ImageStage)
// ============================================================================
{
  const ImageStage = require(join(appRoot, 'src/components/ImageStage.jsx')).default;
  const stageSrc = src('src/components/ImageStage.jsx');
  ok('0.34.0 AUTO-SWITCH IMAGES: a calm 5s walk, paused on hover and under windows', () => {
    assert.ok(stageSrc.includes('AUTO_SWIPE_MS = 5000'), 'the cadence is 5 seconds');
    // 1.4.6 SUPERSEDED (the retained panel's dormant seat): the walk also
    // sleeps while the stage is dormant — the aside parks at width 0 after
    // BACK, and a hidden stage stops spending its beats on frames that
    // will never paint (gendex_155 pins the law).
    assert.ok(/!autoSwipe \|\| dormant \|\| images\.length < 2/.test(stageSrc.replace(/\s+/g, ' ')), 'the walk needs the setting + a set to walk (and wakes only while live)');
    assert.ok(/hoverRef\.current\)\s*return/.test(stageSrc.replace(/\s+/g, ' ')), 'a resting pointer pauses the walk');
    assert.ok(/\[data-gd-modal\]/.test(stageSrc), 'an open window pauses the walk');
    assert.ok(stageSrc.includes('onPointerEnter'), 'the stage tracks its own hover');
  });
  // the behavioral walk: two images, the setting ON — after ~5.5s the
  // counter shows the second picture.
  window.api = {
    clipboardReadImage: async () => null,
    saveImageBuffer: async () => null,
  };
  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.getElementById('root'));
  const images = [
    { file: 'w1.png', thumb: 'w1_t.jpg' },
    { file: 'w2.png', thumb: 'w2_t.jpg' },
  ];
  root.render(
    React.createElement(ImageStage, {
      images,
      imagesPath: '/mock/images',
      autoSwipe: true,
      onAddImages: noop, onSetCover: noop, onDeleteImage: noop, onReorderImages: noop,
      onPasteRecord: noop, onStatus: noop, confirm: noop,
    })
  );
  await sleep(150);
  const fullSrc = () => [...document.querySelectorAll('img')].map((i) => i.getAttribute('src')).join(' ');
  ok('0.34.0 the walk sits still until the beat (no early hop)', () => {
    assert.ok(fullSrc().includes('w1.png'), 'the first picture is showing');
  });
  await sleep(5500);
  ok('0.34.0 the AUTO-SWITCH walk advances the stage every 5 seconds', () => {
    assert.ok(fullSrc().includes('w2.png'), 'the second picture arrived on the beat');
  });
  root.unmount();
  document.body.innerHTML = '';

  // COVER FOLLOWS THE VIEW — star the second image: the view moves to the top
  // 0.46.0 amendment: the images now ride a PARENT with real state, the way
  // the app holds them — setCover REORDERS the version's images (the
  // promoted file lands on slot 0). The old harness kept a STATIC array,
  // which only ever tested the slot math; the stage's view index is now
  // DERIVED from the pinned file (the 0.46 honest let-go), so the honest
  // parent is the only environment that exercises the real law.
  document.body.innerHTML = '<div id="root2"></div>';
  const root2 = createRoot(document.getElementById('root2'));
  const covers = [];
  const CoverParent = () => {
    const [imgs, setImgs] = React.useState([
      { file: 'c1.png', thumb: 'c1_t.jpg' },
      { file: 'c2.png', thumb: 'c2_t.jpg' },
      { file: 'c3.png', thumb: 'c3_t.jpg' },
    ]);
    return React.createElement(ImageStage, {
      images: imgs,
      imagesPath: '/mock/images',
      onAddImages: noop,
      onSetCover: (i) => {
        covers.push(i);
        const next = [...imgs];
        const [picked] = next.splice(i, 1);
        next.unshift(picked);
        setImgs(next);
      },
      onDeleteImage: noop, onReorderImages: noop,
      onPasteRecord: noop, onStatus: noop, confirm: noop,
    });
  };
  root2.render(React.createElement(CoverParent));
  await sleep(120);
  // step to image 2 via the ARROW KEY (the arrows' buttons wait for the
  // geometry to settle — jsdom images never load — but the key walk is
  // always live), then star it
  window.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await sleep(60);
  const star = [...document.querySelectorAll('button')].find((b) => b.title === 'Set as cover');
  star.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await sleep(80);
  ok('0.34.0 starring a cover moves the VIEW to the new top image', () => {
    assert.deepEqual(covers, [1], 'the cover reorder fired for the starred image');
    // the view moved to slot 0: the star key now reads "already first" and
    // wears its filled state — the OLD slot's view would still offer starring.
    const starNow = [...document.querySelectorAll('button')].find((b) => (b.title || '').includes('already first'));
    assert.ok(starNow, 'the star key reports the viewed image as the cover');
    assert.ok(starNow.className.includes('is-cover'), 'the filled cover state');
  });
  root2.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ============================================================================
// Part D — the image manager's moving marks + the manager's paste pill
// ============================================================================
{
  const managerSrc = src('src/components/ImageManagerModal.jsx');
  ok('0.34.0 the manager ring + COVER badge ride their slots (0.45.0: WELDED + keyed POPS)', () => {
    // 0.45.0 — the marks are keyed by their OWNERS inside an AnimatePresence:
    // a change of hands pops the old mark out and the new one in; a plain
    // reorder rides the tile (no flight, no measurement).
    assert.ok(/key=\{`ring-\$\{img\.file\}`\}/.test(managerSrc), 'the selection ring is keyed by its image');
    assert.ok(/key=\{`cover-\$\{img\.file\}`\}/.test(managerSrc), 'the cover badge is keyed by its image');
    assert.ok(managerSrc.includes('className="gd-img-slot-ring"'), 'the ring keeps its welded class');
    assert.ok(!managerSrc.includes('layoutId'), 'no shared-layout flight left');
    assert.ok(!managerSrc.includes('useFlipMark'), 'no FLIP hook left (0.45: the marks pop)');
  });
  const ImageStage = require(join(appRoot, 'src/components/ImageStage.jsx')).default;
  const ToastHub = require(join(appRoot, 'src/components/ToastHub.jsx')).default; // 0.35.0 — the verdict rides the global toast layer
  window.api = {
    clipboardReadImage: async () => null,
    saveImageBuffer: async () => ({ file: 'm_new.png', thumb: 'm_new_t.jpg' }),
  };
  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.getElementById('root'));
  const pasted = [];
  root.render(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(ImageStage, {
        images: [
          { file: 'm1.png', thumb: 'm1_t.jpg' },
          { file: 'm2.png', thumb: 'm2_t.jpg' },
        ],
        imagesPath: '/mock/images',
        onAddImages: noop, onSetCover: noop, onDeleteImage: noop, onReorderImages: noop,
        onPasteRecord: (rec) => pasted.push(rec), onStatus: noop, confirm: noop,
      }),
      React.createElement(ToastHub)
    )
  );
  await sleep(120);
  const mgrBtn = [...document.querySelectorAll('button')].find((b) => (b.title || '').includes('Image manager'));
  mgrBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await sleep(120);
  ok('0.34.0 the manager opens over the stage with its slots + gliding marks', () => {
    assert.ok(document.querySelector('[data-gd-modal]'), 'the manager window mounted (portaled at body level)');
    assert.ok(document.querySelectorAll('.gd-img-slot').length >= 2, 'every image is a slot');
    assert.ok(document.querySelector('.gd-img-slot-ring'), 'the selection ring paints');
    assert.ok(document.body.innerHTML.includes('COVER'), 'the cover badge paints');
  });
  // the manager's own PASTE answers through the GLOBAL TOAST at the top
  const pasteKey = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('PASTE') && b.closest('[data-gd-modal]'));
  assert.ok(pasteKey, 'the manager footer PASTE key');
  // nothing on the clipboard (the read is the check) → the fail toast,
  // painted at body level ABOVE the manager (fixed, z-1100 — 0.35.0)
  pasteKey.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await sleep(100);
  ok('0.35.0 the manager PASTE answers through the global toast pinned to the screen top', () => {
    const pill = document.querySelector('.gd-toast');
    assert.ok(pill, 'the verdict toast rendered (the global feedback layer caught it)');
    assert.ok(pill.classList.contains('is-fail'), 'nothing on the clipboard — the fail tone');
    assert.ok(pill.textContent.includes('No image on the clipboard'), 'the toast says why'); // 0.36.0 sentence case
    // the toast rides ABOVE the manager window (body-level fixed layer)
    const css = src('src/index.css');
    const rule = /\.gd-toast-stack\s*\{[^}]*\}/.exec(css)?.[0] || '';
    /* 1.1.4 — the stack seats BELOW the titlebar (top: 56px), still fixed and above every window. */
    assert.ok(/position: fixed/.test(rule) && /z-index: 1100/.test(rule) && /top: 56px/.test(rule), 'fixed below the titlebar, above every window');
    assert.ok(!document.querySelector('.gd-stage-note'), 'the stage-owned pill is retired — one feedback layer now');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ============================================================================
// Part E — the version flow (the real CharacterView)
// ============================================================================
{
  const CharacterView = require(join(appRoot, 'src/components/CharacterView.jsx')).default;
  const mkCharacter = () => ({
    id: 'cv1', name: 'rin', classId: 'root', tags: [], previewVersionId: null,
    cardRatio: null, cardTrim: 'dash', cardCrop: null, stamps: [],
    stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
    createdAt: Date.now(),
    versions: [
      { id: 'v1', label: 'Alpha', color: null, icon: null, images: [{ file: 'a.png', thumb: 'a_t.jpg' }], parts: [], notes: '', createdAt: 1 },
      { id: 'v2', label: 'Beta', color: null, icon: null, images: [{ file: 'b.png', thumb: 'b_t.jpg' }], parts: [], notes: '', createdAt: 2 },
    ],
  });
  const patches = [];
  const props = {
    tags: [], stampLibrary: [], imagesPath: '/mock/images',
    cardDefaultRatio: { w: 3, h: 4 }, outputBarOn: false, showHelp: false,
    onBack: noop, onRename: noop, onDelete: noop, onToggleTag: noop, onOpenTagManager: noop,
    onAttachStamp: noop, onRemoveStamp: noop, onPromoteStamp: noop, onUploadStamp: noop,
    onRenameStamp: noop, onReorderStamps: noop, onStampColor: noop, onStampTransform: noop,
    confirm: noop, onStatus: noop, onActiveVersion: noop,
    patchCharacter: (id, fn) => patches.push(fn),
  };

  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(CharacterView, { ...props, character: mkCharacter() }));
  // 0.42.0: the wait widened — React 19's passive effects (the mount-time
  // selection of the FIRST version) can land well past 150ms on a loaded
  // machine; the app behavior is unchanged (it settles on the top version).
  await sleep(600);
  ok('0.34.0/1.0.6 opening a card lands on the TOP version — the card\'s own face (getPreviewVersion)', () => {
    // 1.0.6 evolution ("fix the issue where opening a card always opens on
    // the first version instead of the top version"): "top" now means what
    // fronts the card in the grid — the CARD COVER version, else the NEWEST
    // one. This fixture crowns no cover, so the newest (Beta) is the face.
    const chips = [...document.querySelectorAll('.gd-chip')];
    assert.ok(chips.length >= 2, 'both version chips render');
    assert.ok(chips[1].className.includes('is-active'), 'the card\'s face version (the newest, Beta) is the active one');
    assert.ok(!chips[0].className.includes('is-active'), 'the raw first slot (Alpha) is not auto-selected anymore');
    assert.ok(document.body.innerHTML.includes('Beta'), 'the face version\'s content shows');
  });

  // NEW VERSION → the window opens on a DRAFT; nothing touched the db yet
  const newBtn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('NEW VERSION'));
  newBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await sleep(120);
  ok('0.34.0 NEW VERSION opens the version window FIRST (create mode, on a draft)', () => {
    assert.ok(document.body.innerHTML.includes('NEW VERSION'), 'the window\'s title says NEW VERSION');
    assert.ok(document.body.innerHTML.includes('CREATE'), 'the footer carries CREATE');
    assert.equal(patches.length, 0, 'nothing was written to the db yet');
  });
  // CANCEL → the draft dies, still nothing written
  const cancelBtn = [...document.querySelectorAll('[data-gd-modal] button')].find((b) => b.textContent.trim() === 'CANCEL');
  cancelBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await sleep(450);
  ok('0.34.0 CANCEL throws the draft away — no version is created', () => {
    assert.equal(patches.length, 0, 'still nothing written');
    assert.ok(!document.querySelector('[data-gd-modal]'), 'the window closed');
  });

  // CREATE → the version lands with the edits
  const newBtn2 = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('NEW VERSION'));
  newBtn2.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await sleep(120);
  const createBtn = [...document.querySelectorAll('[data-gd-modal] button')].find((b) => b.textContent.trim() === 'CREATE');
  createBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await sleep(450);
  ok('0.34.0 CREATE lands the version (the draft commits with its edits)', () => {
    assert.equal(patches.length, 1, 'one patch committed');
    root.unmount();
    document.body.innerHTML = '';
  });

  // server render: create mode hides the structural rows
  const VSM = require(join(appRoot, 'src/components/VersionSettingsModal.jsx')).default;
  const draftOut = renderToString(
    React.createElement(VSM, {
      version: { id: 'd1', label: 'V3', color: null, icon: null, images: [], parts: [], notes: '', createdAt: 1 },
      index: 2, total: 3, createMode: true,
      onClose: noop, onCreate: noop, onPatch: noop, onMove: noop, onTogglePreview: noop, onDelete: noop,
    })
  );
  ok('0.34.0 the create-mode window hides DELETE / POSITION / CARD COVER (a draft has none of that)', () => {
    assert.ok(draftOut.includes('NEW VERSION'), 'the create title');
    assert.ok(draftOut.includes('CREATE'), 'the create key');
    assert.ok(!draftOut.includes('DELETE VERSION'), 'no delete on a draft');
    assert.ok(!draftOut.includes('POSITION IN STRIP'), 'no position on a draft');
    assert.ok(!draftOut.includes('SET AS CARD COVER'), 'no card cover on a draft');
  });
}

// ============================================================================
// Part F — the top bar lockout + the dropdown sweep (real Popover unit)
// ============================================================================
{
  const appSrc = src('src/App.jsx');
  ok('0.34.0 the top bar LOCKS while any window is open (watcher + dimmed inert keys)', () => {
    assert.ok(appSrc.includes('MutationObserver'), 'the any-window watcher');
    assert.ok(appSrc.includes('locked={anyWindowOpen}'), 'the titlebar receives the lockout');
    assert.ok(appSrc.includes("skipAnimations={db?.settings?.reduceMotion ? true : undefined}"), 'reduced motion skips EVERY animation (no fade-outs)');
    const css = src('src/index.css');
    assert.ok(/\.gd-titlebar\.is-locked .gd-wordmark-tab,/.test(css), 'the lockout dims the wordmark');
    assert.ok(/\.gd-titlebar-locked-bit\s*\{[^}]*pointer-events: none/.test(css), 'the locked bits go inert');
    const barSrc = src('src/components/Titlebar.jsx');
    assert.ok(barSrc.includes("locked && 'gd-titlebar-locked-bit'"), 'the app keys cluster locks');
    assert.ok(barSrc.includes('gd-win-btn'), 'the window controls stay outside the lock');
  });
  // the sweep, behavioral: an open Popover dismisses itself on the event
  const { default: Popover } = require(join(appRoot, 'src/components/Popover.jsx'));
  const anchorRef = { current: null };
  let closed = false;
  const Probe = () => {
    const ref = React.useRef(null);
    React.useLayoutEffect(() => { anchorRef.current = ref.current; }, []);
    return React.createElement(
      'div',
      null,
      React.createElement('button', { ref }, 'ANCHOR'),
      React.createElement(Popover, { open: true, onClose: () => { closed = true; }, anchor: anchorRef, width: 200 }, 'POPPED')
    );
  };
  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(Probe));
  await sleep(80);
  ok('0.34.0 a window opening sweeps every open dropdown away', () => {
    assert.ok(!closed, 'the popover starts open');
    window.dispatchEvent(new dom.window.CustomEvent('gd-close-popovers'));
    assert.ok(closed, 'the gd-close-popovers event dismissed it');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ============================================================================
// Part G — the stamp ring glides; the class preview wears the class button look
// ============================================================================
{
  const stampSrc = src('src/components/StampEditModal.jsx');
  ok('0.34.0 the stamp TOP outline rides its slot (0.42.0: WELDED ring)', () => {
    assert.ok(stampSrc.includes('gd-stamp-topring'), 'the ring element');
    assert.ok(!stampSrc.includes('layoutId'), 'no shared-layout flight left');
    const css = src('src/index.css');
    const ring = /\.gd-stamp-topring\s*\{[^}]*\}/.exec(css)?.[0] || '';
    // 0.43.0 — the -2px box belongs to the topmark WRAPPER now; the ring
    // fills it (inset 0) with the same accent outline language.
    const wrap = /\.gd-stamp-topmark\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/inset: -2px/.test(wrap), 'the wrapper carries the old -2px ring box');
    assert.ok(/inset: 0/.test(ring) && /border: 2px solid var\(--gd-accent\)/.test(ring), 'the ring paints the old outline language inside it');
    const isTop = /\.gd-stamp-slot\.is-top\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(!/border-color/.test(isTop), 'the class no longer paints (the ring owns the look)');
  });
  // the class modal preview — the CLASS BUTTON look, not the tag chip
  const { default: ClassSidebar } = require(join(appRoot, 'src/components/ClassSidebar.jsx'));
  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.getElementById('root'));
  root.render(
    React.createElement(ClassSidebar, {
      classes: [], characters: [], selectedClassId: 'root', dragRef: { current: null },
      onSelectClass: noop, onAddClass: noop, onRenameClass: noop, onDeleteClass: noop,
      onMoveClass: noop, onAssignCharacter: noop, onNewCharacter: noop, confirm: noop, onStatus: noop,
    })
  );
  await sleep(100);
  const newClass = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('NEW CLASS'));
  newClass.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await sleep(120);
  ok('0.34.0 the new-class preview wears the CLASS BUTTON look (the tree row, not the tag chip)', () => {
    const modal = document.querySelector('[data-gd-modal]');
    assert.ok(modal, 'the class window opened');
    assert.ok(modal.innerHTML.includes('gd-tree-row'), 'the preview carries the tree row\'s own class');
    assert.ok(modal.innerHTML.includes('Preview'), 'the preview name shows');
    const iconBlock = modal.querySelector('.gd-tree-row');
    assert.ok(iconBlock && iconBlock.querySelector('.truncate'), 'the tree-row anatomy: icon + truncating name');
    // the old look: a gd-chip inside the ICON section — it must be gone
    const iconSection = [...modal.querySelectorAll('div')].find((d) => d.textContent.trim().startsWith('ICON') && d.textContent.includes('Preview'));
    assert.ok(iconSection && !iconSection.querySelector('.gd-chip'), 'no tag chip anywhere in the preview');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ============================================================================
// Part H — the CSS guards (scroll freeze, chip containment, sorter retirement)
// ============================================================================
{
  const css = src('src/index.css');
  ok('0.34.0 the scroll guard FREEZES transitions instead of un-lifting (no dragged-back cards)', () => {
    const m = /:root\.gd-scrolling[^{]*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/transition: none !important/.test(m), 'transitions freeze mid-scroll');
    assert.ok(!/transform: none/.test(m), 'transforms are LEFT ALONE (a hovered card keeps its lift)');
  });
  ok('0.34.0 rounded themes CONTAIN their chip text (mumei blobs + moss pills)', () => {
    const mumei = /\[data-theme='mumei'\] \.gd-chip\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/padding: 5px 13px/.test(mumei) && /line-height: 1\.35/.test(mumei), 'mumei chips keep the type clear of the blob curve');
    const moss = /\[data-theme='moss'\] \.gd-chip\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/padding: 5px 13px/.test(moss), 'moss pills get the same room');
  });
  ok('0.34.0 the SORTER is retired everywhere (the manager owns ordering)', () => {
    const stageSrc = src('src/components/ImageStage.jsx');
    assert.ok(!stageSrc.includes('DRAG TO SORT'), 'the filmstrip is gone');
    assert.ok(!stageSrc.includes('useThumbSort'), 'the stage sorts nothing anymore');
    assert.ok(!stageSrc.includes("title={editing ? 'Hide the sorter' : 'Show the sorter'}"), 'the show/hide key is gone');
    assert.ok(stageSrc.includes('ImageManagerModal'), 'the manager remains the one ordering surface');
    assert.ok(!css.includes('.gd-stage-clipchip'), 'the READY chip style is deleted too');
  });
  ok('0.34.0 the drop-edge covers the card\'s own border (top edge fully lit)', () => {
    const rule = /\.gd-drop-edge\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/inset: calc\(var\(--gd-border-w, 2px\) \* -1\)/.test(rule), 'the overlay spans the border box');
    assert.ok(/\+ var\(--gd-border-w, 2px\)\) calc\(var\(--gd-shape-radius/.test(rule), 'the radius grows to hug the rim');
  });
  ok('0.34.0 GLACIER is the main theme (fresh databases wake up frosted)', () => {
    const { DEFAULT_SETTINGS } = require(join(appRoot, 'src/constants/index.js'));
    assert.equal(DEFAULT_SETTINGS.theme, 'glacier');
    assert.deepEqual(DEFAULT_SETTINGS.textures, { titlebar: 'none', sidebar: 'graph', viewer: 'grid', panel: 'none' }); // 0.36.0: the tree wears graph paper
    assert.equal(DEFAULT_SETTINGS.autoSwipeImages, true, 'auto-switch ships ON by default (0.36.0)');
  });
}

console.log(`\n${passed} 0.34.0 batch DOM checks passing`);
