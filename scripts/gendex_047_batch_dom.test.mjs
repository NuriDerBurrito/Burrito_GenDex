// 0.47.0 batch DOM + source checks — the seventh fix wave.
//
//   · THE RIDE OUT-RANKS THE MARKS ("the selected image when dragged around
//     should always be above all including current and top image"): the
//     dragged tile rides at z 50 — above the marked slots (45) — in the
//     image manager, the creation grid and the stamp strips, while parked
//     marked slots keep their marks above the gliding neighbors (5).
//   · THE STAGE'S TOP LABEL IS A CHIP AND RIDES ABOVE THE PICTURE ("should
//     have an outline so it doesnt blend into images" + the mumei leak
//     "below the top label"): .gd-stage-count gains a hairline frame, a
//     translucent fill and z 5 (the mumei picture layer sits at z 3); the
//     eye climbs to z 4; mumei's controls rank strictly above the picture.
//   · THE RIBBONS ARE STROKED SVG SHAPES ("fully outlined including cut
//     areas like the inward cut and the triangle cut" + "dont make it too
//     flat"): one even outline along every edge (straight / V-cut / notch /
//     the bookmark foot), rounded joins, and a vertical gradient face.
//   · TAG SEPARATION (a slider, clamped so the row never leaves the card)
//     and TOP TAGS (1–8, was hard-coded 3) — settings + a toolbar handle.
//   · THE DUPLICATE KEEPS ITS POSTURE ("including order and top version and
//     image"): the version ids are remapped and the clone pins the remapped
//     id of the original's top version (explicit pin or derived).
//   · THE NEW-CARD TILE darkens its see-through interior over the pattern.
//   · THE GITHUB KEY carries the future repo URL (Burrito_GenDex), still
//     SOON until the release.
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
  console.log('jsdom unavailable — 0.47.0 batch DOM test skipped (dev-only dependency)');
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
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.SVGElement = dom.window.SVGElement;
global.Document = dom.window.Document;
global.Window = dom.window.Window;
global.Event = dom.window.Event;
global.CustomEvent = dom.window.CustomEvent;
global.MouseEvent = dom.window.MouseEvent;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.WheelEvent = dom.window.WheelEvent;
global.PointerEvent = dom.window.PointerEvent || dom.window.MouseEvent;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = dom.window.requestAnimationFrame;
global.cancelAnimationFrame = dom.window.cancelAnimationFrame;
global.Image = dom.window.Image;
global.IS_REACT_ACT_ENVIRONMENT = true;
global.matchMedia = dom.window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
global.ResizeObserver = class {
  constructor(cb) { this.cb = cb; }
  observe() {} unobserve() {} disconnect() {}
};

const React = require('react');
const { createRoot } = require('react-dom/client');
const babel = require('@babel/core');
const appRoot = process.cwd();
for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff2']) {
  require.extensions[ext] = (module, filename) => { module.exports = filename; };
}
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

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL ${failed} — ${name}\n      ${String(e && e.message).split('\n')[0]}`);
  }
};
const okAsync = async (name, fn) => {
  try {
    await fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL ${failed} — ${name}\n      ${String(e && e.message).split('\n')[0]}`);
  }
};
const flush = () => new Promise((r) => setTimeout(r, 30));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ===========================================================================
// Part A — source checks for the seventh wave
// ===========================================================================
{
  const APP = require(join(appRoot, 'src/constants/index.js')).APP;
  const constants = require(join(appRoot, 'src/constants/index.js'));
  const mgrSrc = src('src/components/ImageManagerModal.jsx');
  const ncmSrc = src('src/components/NewCharacterModal.jsx');
  const stampSrc = src('src/components/StampEditModal.jsx');
  const ribbonSrc = src('src/components/TagRibbon.jsx');
  const gridSrc = src('src/components/GridView.jsx');
  const settingsSrc = src('src/components/SettingsModal.jsx');
  const appSrc = src('src/App.jsx');
  const helpersSrc = src('src/utils/helpers.js');

  ok('0.47.0 the version pinned through 1.0.4', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(src('package.json'), /"version": "1\.4\.3"/);
    assert.match(src('CHANGELOG.md'), /^## 0\.47\.0/m, 'the changelog carries the entry');
  });

  ok('0.47.0 the ride out-ranks the marks in the image manager (z 50 over 45)', () => {
    assert.ok(/const markZ = !isDragged && sorting && \(i === 0 \|\| i === selectedIndex\) \? 45 : null;/.test(mgrSrc), 'parked marked slots keep 45');
    assert.ok(/\.\.\.\(isDragged \? \{ zIndex: 50 \} : null\),/.test(mgrSrc), 'the dragged tile rides at 50');
    assert.ok(!/\(\(i === 0 \|\| i === selectedIndex\) && sorting\) \? \{ zIndex: 45 \}/.test(mgrSrc), 'the dragged tile can never be capped at 45');
  });

  ok('0.47.0 the same law rides the creation grid and the stamp strips', () => {
    assert.ok(/\.\.\.\(!isDragged && i === 0 && sorting \? \{ zIndex: 45 \} : null\),/.test(ncmSrc), 'creation grid: parked cover slot keeps 45');
    assert.ok(/\.\.\.\(isDragged \? \{ zIndex: 50 \} : null\),/.test(ncmSrc), 'creation grid: the dragged thumb rides at 50');
    assert.ok(/\.\.\.\(!isDragged && \(isTop \|\| i === 0\) && sorting \? \{ zIndex: 45 \} : null\),/.test(stampSrc), 'stamp strips: the parked TOP slot keeps 45');
    assert.ok(/\.\.\.\(isDragged \? \{ zIndex: 50 \} : null\),/.test(stampSrc), 'stamp strips: the dragged slot rides at 50');
  });

  ok('0.47.0 the stage counter is a framed chip riding above the picture', () => {
    const count = /\.gd-stage-count\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/z-index: 5;/.test(count), 'the counter outranks every picture layer (mumei\'s sits at 3)');
    assert.ok(/border: 1\.5px solid/.test(count), 'the hairline ink frame');
    assert.ok(/background: color-mix\(in srgb, var\(--gd-panel\) 88%, transparent\)/.test(count), 'the translucent panel fill');
    assert.ok(/box-shadow: 0 1px 3px/.test(count), 'the soft floor shadow');
  });

  ok('0.47.0 the mumei ladder is strictly ranked (no DOM-order reliance)', () => {
    const eye = /\.gd-stage-eye\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/z-index: 4;/.test(eye), 'the eye sits above the picture layer');
    const mumeiCtrl = /\[data-theme='mumei'\] \.gd-stage\.is-bleed \.gd-stage-ctrl\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/z-index: 4;/.test(mumeiCtrl), 'the controls rank above the picture (z 3) by value');
    const mumeiImg = /\[data-theme='mumei'\] \.gd-stage\.is-bleed \.gd-stage-img\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/z-index: 3;/.test(mumeiImg), 'the picture layer keeps its 3');
  });

  ok('0.47.0 the ribbons are stroked SVG shapes (outline follows every cut)', () => {
    assert.ok(/className="gd-ribbon-shape"/.test(ribbonSrc), 'the ribbon renders an SVG');
    assert.ok(/stroke=\{OUTLINE_C\}/.test(ribbonSrc), 'the outline rides the stroke');
    assert.ok(/strokeWidth=\{OUTLINE_W\}/.test(ribbonSrc), 'one even width along every edge');
    assert.ok(/strokeLinejoin="round"/.test(ribbonSrc), 'rounded joins soften the cut tips');
    assert.ok(/trim === 'v'/.test(ribbonSrc) && /trim === 'notch'/.test(ribbonSrc), 'the V-cut and the inward notch carry their own paths');
    assert.ok(/linearGradient/.test(ribbonSrc), 'the face fills with a gradient (not flat)');
    // the old clip-path construction is retired
    assert.ok(!/gd-ribbon-face/.test(css), 'the inset face (whose rim pinched at the cuts) is gone');
    assert.ok(!/clip-path: polygon\(0 0, 100% 0, 50% 100%\)/.test(css), 'the triangle clip is gone with it');
  });

  ok('0.47.0 the ribbon CSS seats the SVG + the glyph', () => {
    const shape = /\.gd-ribbon-shape\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/position: absolute;/.test(shape), 'the shape fills the wrapper');
    /* 1.1.4 — line-anchored: the chip-shape glyph override sits earlier in the sheet. */
    const glyph = /^\.gd-ribbon-glyph\s*\{[^}]*\}/m.exec(css)?.[0] || '';
    assert.ok(/justify-content: center;/.test(glyph), 'the icon centers over the shape');
  });

  ok('0.47.0 TAG SEPARATION + TOP TAGS exist as settings, clamped to the card', () => {
    assert.deepEqual(constants.TAG_SEPARATION_RANGE, { min: -12, max: 14, default: -8 });
    assert.deepEqual(constants.TAG_LIMIT_RANGE, { min: 1, max: 8, default: 3 });
    assert.equal(constants.DEFAULT_SETTINGS.tagSeparation, -8);
    assert.equal(constants.DEFAULT_SETTINGS.tagLimit, 3);
    assert.ok(/const clampSeparation = \(desired, count, scale, cardWidth\) => \{/.test(gridSrc), 'the row clamps itself to the card\'s width');
    assert.ok(/Math\.min\(desired, maxSep\)/.test(gridSrc), 'the effective separation never exceeds what fits');
    assert.ok(/ribbons\.slice\(0, Math\.max\(1, tagLimit\)\)/.test(gridSrc), 'the card wears as many ribbons as the setting says');
    // sanitized on load
    assert.ok(/tagSeparation: Number\.isFinite\(tagSepRaw\)/.test(helpersSrc), 'separation survives createSafeDb');
    assert.ok(/tagLimit: Number\.isFinite\(tagLimitRaw\)/.test(helpersSrc), 'the count survives createSafeDb');
  });

  ok('0.47.0 the settings carry both sliders + the toolbar carries the gap handle', () => {
    assert.ok(/title="TOP TAGS"/.test(settingsSrc), 'the Look tab gains TOP TAGS');
    assert.ok(/title="TAG SEPARATION"/.test(settingsSrc), 'the Look tab gains TAG SEPARATION');
    assert.ok(/set\('tagLimit', Number\(e\.target\.value\), 'tagLimit'\)/.test(settingsSrc), 'the count writes its own key');
    assert.ok(/set\('tagSeparation', Number\(e\.target\.value\), 'tagSeparation'\)/.test(settingsSrc), 'the separation writes its own key');
    assert.ok(/onTagSeparation=\{\(v\) => setSetting\('tagSeparation', v, 'tagSeparation'\)\}/.test(appSrc), 'App wires the toolbar handle');
    assert.ok(/tagLimit=\{db\.settings\.tagLimit\}/.test(appSrc) && /tagSeparation=\{db\.settings\.tagSeparation\}/.test(appSrc), 'the grid reads both settings');
  });

  ok('0.47.0 the duplicate keeps its posture (order, top version, image)', () => {
    assert.ok(/const srcPreview = getPreviewVersion\(src\);/.test(appSrc), 'the original\'s top version is resolved');
    assert.ok(/if \(srcPreview && v\.id === srcPreview\.id\) previewVersionId = fresh;/.test(appSrc), 'the clone pins the REMAPPED id');
    assert.ok(/clone\.previewVersionId = previewVersionId;/.test(appSrc), 'the pin lands on the clone');
    assert.ok(!/clone\.previewVersionId = null;/.test(appSrc), 'the old reset-to-newest is gone');
    assert.ok(/const insert = at >= 0 \? at \+ 1 : list\.length;/.test(appSrc), 'the copy still lands right after its source');
  });

  ok('0.47.0 the new-card tile darkens its see-through interior', () => {
    assert.ok(/gd-card-add relative rounded-gd/.test(gridSrc), 'the tile carries its class');
    // 1.1.9 re-law: .gd-card, .gd-card-add also carries the card-scale
    // tween now; scope the wash by its own face, not by the first block.
    const wash = /\.gd-card-add\s*\{[^}]*background: color-mix\(in srgb, var\(--gd-tier-deep, var\(--gd-bg\)\) 58%, var\(--gd-ink\) 14%\)[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/background: color-mix\(in srgb, var\(--gd-tier-deep, var\(--gd-bg\)\) 58%, var\(--gd-ink\) 14%\)/.test(wash), 'the translucent dark wash (1.2.3 re-law: the wash derives from the viewer deep band)');
    const ink = /\.gd-card-add-ink\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/color: color-mix\(in srgb, var\(--gd-chrome\) 70%, var\(--gd-mute\)\)/.test(ink), 'the resting text climbs a rung');
  });

  ok('0.47.0 the GitHub key carries the repo URL (LIVE since 1.0.0)', () => {
    assert.ok(/https:\/\/github\.com\/NuriDerBurrito\/Burrito_GenDex/.test(settingsSrc), 'the URL is baked in');
    // 1.0.0 — the SOON posture retired with the approaching release; the
    // key opens the repo like every other link on the wall.
    const ghBlock = /<AboutLinkButton[\s\S]{0,260}label="GITHUB"[\s\S]{0,260}\/>/.exec(settingsSrc)?.[0] || '';
    assert.ok(/title="Open the GitHub repository/.test(ghBlock), 'the tooltip says it opens');
    assert.ok(!/disabled/.test(ghBlock) && !/soon/.test(ghBlock), 'the key is enabled (1.0.0)');
  });
}

// ===========================================================================
// Part B — live DOM: the ribbons render as stroked SVG shapes
// ===========================================================================
{
  const TagRibbon = require(join(appRoot, 'src/components/TagRibbon.jsx')).default;

  await okAsync('0.47.0 a straight ribbon renders one stroked, gradient-filled SVG', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(TagRibbon, { tag: { id: 't1', name: 'Alpha', color: '#d94f4f', icon: 'Star', trim: 'straight' }, scale: 1 }));
    await flush();
    const svg = host.querySelector('svg.gd-ribbon-shape');
    assert.ok(svg, 'the SVG mounted');
    // 1.4.3 supersede: the ribbon may also carry a clipPath (the tag's own
    // finish coat) whose path rides <defs> FIRST — the SHAPE is the stroked
    // one outside defs.
    const path = svg.querySelector('path[stroke]');
    assert.ok(path, 'the shape is a path');
    assert.equal(path.getAttribute('stroke'), 'rgba(0, 0, 0, 0.78)', 'the outline stroke');
    assert.ok(/url\(#/.test(path.getAttribute('fill')), 'the face fills with the gradient');
    assert.ok(/Q /.test(path.getAttribute('d')), 'the straight trim keeps its curled bookmark foot');
    assert.equal(svg.getAttribute('width'), '19', 'the ribbon keeps its size language');
    const glyph = host.querySelector('.gd-ribbon-glyph');
    assert.ok(glyph, 'the icon rides above the shape');
    root.unmount();
    host.remove();
  });

  await okAsync('0.47.0 the V-cut and the notch carry their own outlined paths', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(React.Fragment, null,
      React.createElement(TagRibbon, { key: 'v', tag: { id: 'tv', name: 'V', color: '#4f9dd9', icon: null, trim: 'v' }, scale: 1.2 }),
      React.createElement(TagRibbon, { key: 'n', tag: { id: 'tn', name: 'N', color: '#59c26a', icon: null, trim: 'notch' }, scale: 1.2 })));
    await flush();
    // 1.4.3 supersede: each ribbon's defs may carry a clip path beside the
    // shape — the STROKED paths are the shapes.
    const paths = [...host.querySelectorAll('path[stroke]')];
    assert.equal(paths.length, 2, 'both ribbons mounted');
    const vPath = paths[0].getAttribute('d');
    assert.ok(/L 11\.5 [\d.]+ Z/.test(vPath), `the V-cut closes at its apex (got ${vPath})`);
    const nPath = paths[1].getAttribute('d');
    assert.ok(/ L 11\.5 27 /.test(nPath), `the notch dips inward at 66% height (got ${nPath})`);
    for (const p of paths) {
      assert.equal(p.getAttribute('stroke'), 'rgba(0, 0, 0, 0.78)', 'every cut edge is outlined');
      assert.equal(p.getAttribute('stroke-linejoin') || p.getAttribute('strokeLinejoin'), 'round', 'the joins round');
    }
    assert.ok(!host.querySelector('.gd-ribbon-glyph'), 'icon-less ribbons stay clean tabs');
    root.unmount();
    host.remove();
  });
}

// ===========================================================================
// Part C — live DOM: the manager drag rides above the marked slots
// ===========================================================================
{
  const ImageStage = require(join(appRoot, 'src/components/ImageStage.jsx')).default;

  await okAsync('0.47.0 the dragged selected tile rides at z 50, above the cover slot\'s 45', async () => {
    const RealImage = dom.window.Image;
    global.Image = class {
      constructor() { this.naturalWidth = 600; this.naturalHeight = 800; }
      set src(v) { this._src = v; setTimeout(() => this.onload && this.onload(), 0); }
      get src() { return this._src; }
    };
    const IMAGES = ['img_00.png', 'img_01.png', 'img_02.png', 'img_03.png'].map((f) => ({ file: f, thumb: f }));
    const { useState: useLocalState } = React;
    const Parent = () => React.createElement(ImageStage, {
      images: IMAGES,
      imagesPath: 'C:/img',
      onAddImages: async () => {},
      onSetCover: () => {},
      onDeleteImage: () => {},
      onReorderImages: () => {},
      onPasteRecord: () => {},
      onStatus: () => {},
      confirm: () => {},
    });
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(Parent));
    await sleep(120);

    const mgrKey = [...document.querySelectorAll('button')].find((b) => (b.getAttribute('title') || '').includes('Image manager'));
    assert.ok(mgrKey, 'the image manager key mounted');
    mgrKey.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
    await sleep(120);
    let slots = [...document.body.querySelectorAll('.gd-img-slot')];
    assert.equal(slots.length, 4, 'the manager mounted its slots');

    // drag slot 2 (a plain, unmarked tile) toward slot 0 (the COVER slot)
    const grab = slots[2];
    const rect = (x, y) => ({ left: x, top: y, right: x + 64, bottom: y + 64, width: 64, height: 64, x, y, toJSON() {} });
    slots.forEach((el, i) => {
      const r = rect(i * 74, 10);
      el.getBoundingClientRect = () => r;
    });
    const pointer = (type, x, y) => new (dom.window.PointerEvent || dom.window.MouseEvent)(
      type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerId: 9, buttons: 1 }
    );
    grab.dispatchEvent(pointer('pointerdown', 32 + 148, 42));
    await flush();
    grab.dispatchEvent(pointer('pointermove', 120, 42));
    await flush();
    await flush();
    slots = [...document.body.querySelectorAll('.gd-img-slot')];
    const dragged = slots[2];
    const cover = slots[0];
    assert.equal(dragged.style.zIndex, '50', `the dragged tile rides at 50 (got ${dragged.style.zIndex})`);
    assert.equal(cover.style.zIndex, '45', `the parked COVER slot keeps its marks at 45 (got ${cover.style.zIndex})`);
    assert.ok(Number(dragged.style.zIndex) > Number(cover.style.zIndex), 'the ride out-ranks the marks');
    grab.dispatchEvent(pointer('pointerup', 120, 42));
    await sleep(430);
    global.Image = RealImage;
    root.unmount();
    host.remove();
    document.body.querySelectorAll('.gd-modal-card').forEach((el) => el.remove());
  });
}

// ===========================================================================
// Part D — live DOM: the duplicate keeps the original's top version
// ===========================================================================
{
  window.api = {
    loadDB: async () => ({
      db: {
        settings: {
          theme: 'zine', colors: {}, zoom: 2, defaultSortMode: 'custom',
          textures: { titlebar: 'none', sidebar: 'none', viewer: 'dots', panel: 'none' },
          detailPanel: true, tagScale: 1.2, tagLimit: 3, tagSeparation: -8, cardRatio: { w: 3, h: 4 },
        },
        classes: [{ id: 'cl1', name: 'heroes', parentId: 'root', order: 1 }],
        tags: [{ id: 'tag1', name: 'Alpha', color: '#d94f4f', icon: null, trim: 'v' }],
        stamps: [],
        characters: [
          {
            id: 'c1', name: 'amy', classId: 'cl1', tags: ['tag1'],
            // the top version is PINNED to the OLDER one — the duplicate must keep it
            previewVersionId: 'v1',
            cardRatio: { w: 3, h: 4 }, cardTrim: 'dash', cardCrop: null,
            stamps: [], stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
            createdAt: Date.now(),
            versions: [
              { id: 'v1', label: 'Old One', color: null, icon: null, images: [{ file: 'a.png', thumb: 'a_t.jpg' }], parts: [], notes: '', createdAt: 100 },
              { id: 'v2', label: 'Newest', color: null, icon: null, images: [{ file: 'b.png', thumb: 'b_t.jpg' }, { file: 'c.png', thumb: 'c_t.jpg' }], parts: [], notes: '', createdAt: 200 },
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
    clipboardReadImage: async () => null,
    importImagesFromFiles: async () => [],
    saveImageBuffer: async () => null,
    copyImageFile: async (file) => ({ file: `copy_${file}`, thumb: `copy_${file}` }),
    deleteImageFile: async () => ({ ok: true }),
    openDataFolder: () => {},
    clearCache: async () => ({ ok: true }),
  };
  document.body.innerHTML = '<div id="root"></div>';
  // the stage's size gate (and its counter) needs images that actually load
  const RealImage = dom.window.Image;
  global.Image = class {
    constructor() { this.naturalWidth = 600; this.naturalHeight = 800; }
    set src(v) { this._src = v; setTimeout(() => this.onload && this.onload(), 0); }
    get src() { return this._src; }
  };
  const App = require(join(appRoot, 'src/App.jsx')).default;
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(App));
  await sleep(3400);

  const card = document.querySelector('[data-gd-char-id]');
  assert.ok(card, 'the card mounted');
  card.dispatchEvent(new dom.window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 60, clientY: 60 }));
  await sleep(140);
  const dupItem = [...document.querySelectorAll('.gd-ctx-item')].find((el) => (el.textContent || '').trim().startsWith('Duplicate'));
  assert.ok(dupItem, 'the Duplicate action is reachable');
  dupItem.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  await sleep(900);

  const cards = [...document.querySelectorAll('[data-gd-char-id]')];
  assert.equal(cards.length, 2, `the copy landed (${cards.length} cards)`);
  const titles = cards.map((c) => c.querySelector('.gd-card-title')?.textContent || '');
  assert.ok(/copy/i.test(titles[1] || ''), `the copy sits right after the original (${JSON.stringify(titles)})`);

  // open the copy and read its top version
  cards[1].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true, clientX: 40, clientY: 40 }));
  await sleep(1000);
  const chips = [...document.querySelectorAll('.gd-version-item .gd-chip')];
  assert.ok(chips.length >= 2, 'the copy\'s version strip mounted');
  const starChip = chips.find((c) => c.querySelector('.gd-version-star'));
  ok('0.47.0 the duplicate keeps the ORIGINAL top version (the pinned older one)', () => {
    assert.ok(starChip, 'a cover star mounted on the strip');
    assert.ok(/Old One/.test(starChip.textContent || ''), `the star marks the pinned version, not the newest (got ${starChip?.textContent})`);
  });
  const counter = document.querySelector('.gd-stage-count');
  ok('0.47.0 the duplicate keeps the top version\'s cover (image count follows)', () => {
    assert.ok(counter, 'the stage counter mounted');
    assert.equal((counter.textContent || '').trim(), '1 / 1', `the pinned version's image count (got ${counter?.textContent?.trim()})`);
  });
  root.unmount();
  document.body.innerHTML = '';
  global.Image = RealImage;
}

// ---------------------------------------------------------------------------
console.log(`\n0.47.0 batch: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
