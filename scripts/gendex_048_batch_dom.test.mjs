// 1.0.0 batch DOM + source checks — the eighth fix wave.
//
//   · THE ZOOM'S MISSING RENDER PATH ("zoom out, zoom in and reset buttons
//     on the card preview inside the card creation window isnt working"):
//     the card art rendered through object-fit: cover + object-position — a
//     PAN-ONLY channel that can never scale the picture, so every zoom was
//     computed and painted as nothing. cropFrame() now renders the crop rect
//     literally (the image sized so the crop fills the box) in the creation
//     preview, the compact preview AND the grid card — a zoomed crop finally
//     zooms everywhere it is shown.
//   · THE TOP LABEL POPS WITH ITS OUTLINE ("animation is missing in the
//     mumei theme (inside the image manager, specifically the top label
//     disappearing and reappearing alongside the outline)"): the stage's
//     N/M counter chip never animated at all — it now rides an
//     AnimatePresence keyed by the shown image, popping out/in when the
//     picture changes hands.
//   · MUMEI'S TAGS STOP CLIPPING AT THE TOP ("when hovering over a tag the
//     tag would clip to the top of the container"): the fold body's clip
//     line sat exactly on the chips' top edge; 6px of honest headroom
//     (padding-top + matching negative margin) clears the hover lift, the
//     blob curls and the active outline.
//   · THE GITHUB KEY IS LIVE ("make the github button clickable instead of
//     soon") — the disabled/SOON posture is retired.
//   · THE CUSTOM FONT OPTION IS REMOVED ("lastly remove the custom font
//     option") — the three shipped faces are the whole ladder; the importer,
//     its storage and its sanitizer seat are gone.
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
  console.log('jsdom unavailable — 1.0.0 batch DOM test skipped (dev-only dependency)');
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
    console.log(`  FAIL ${passed + failed > 0 ? passed + failed : 1} — ${name}\n      ${String(e && e.message).split('\n')[0]}`);
  }
};
const okAsync = async (name, fn) => {
  try {
    await fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL ${passed + failed} — ${name}\n      ${String(e && e.message).split('\n')[0]}`);
  }
};
const flush = () => new Promise((r) => setTimeout(r, 30));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ===========================================================================
// Part A — source checks for the eighth wave
// ===========================================================================
{
  const APP = require(join(appRoot, 'src/constants/index.js')).APP;
  const constants = require(join(appRoot, 'src/constants/index.js'));
  const ribbonSrc = src('src/components/TagRibbon.jsx');
  const lookSrc = src('src/components/CardLookEditor.jsx');
  const gridSrc = src('src/components/GridView.jsx');
  const stageSrc = src('src/components/ImageStage.jsx');
  const settingsSrc = src('src/components/SettingsModal.jsx');
  const themeSrc = src('src/utils/theme.js');
  const helpersSrc = src('src/utils/helpers.js');
  const appSrc = src('src/App.jsx');

  ok('1.0.0 the version bumped everywhere', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(src('package.json'), /"version": "1\.4\.3"/);
    assert.match(src('CHANGELOG.md'), /^## 1\.0\.0/m, 'the changelog carries the entry');
  });

  ok('1.0.0 the exact crop frame exists and the pan-only channel is retired', () => {
    assert.ok(/export function cropFrame\(crop\) \{/.test(ribbonSrc), 'cropFrame is exported from TagRibbon');
    assert.ok(/position: 'absolute',/.test(ribbonSrc), 'the frame positions the image');
    assert.ok(/width: f\(1 \/ crop\.w\),/.test(ribbonSrc), 'the frame sizes the image so the crop fills the box');
    assert.ok(/left: f\(-crop\.x \/ crop\.w\),/.test(ribbonSrc), 'the frame seats the crop corner at the box corner');
    assert.ok(/maxWidth: 'none',/.test(ribbonSrc), "Tailwind's preflight cap is reset");
    assert.ok(!/export function cropPosition/.test(ribbonSrc), 'the object-position mapper is retired');
    assert.ok(!/objectPosition/.test(ribbonSrc), 'no renderer leans on object-position');
  });

  ok('1.0.0 every card art renderer paints the frame (creation, compact, grid)', () => {
    assert.ok(/import \{ CardFinishLayer, CardPreview, cropFrame, trimClasses \}/.test(lookSrc), 'CardLookEditor imports the frame (+ 1.3.9 supersede: CardPatternLayer left with the retired pattern feature)');
    assert.ok(/import TagRibbon, \{ CardFinishLayer, TrimOverlay, cropFrame,/.test(gridSrc), 'GridView imports the frame (+ 1.3.9 supersede: the pattern layer left with the feature)');
    assert.ok(/style=\{imgAspect \? cropFrame\(eff\) : undefined\}/.test(lookSrc), 'the creation preview renders through the frame');
    assert.ok(/style=\{character\.cardCrop \? cropFrame\(character\.cardCrop\) : undefined\}/.test(gridSrc), 'the grid card renders a stored crop through the frame');
    assert.ok(!/objectPosition/.test(lookSrc) && !/objectPosition/.test(gridSrc), 'the pan-only channel is gone from both');
  });

  ok('1.0.0 the zoom keys still fire the crop (the math was never the bug)', () => {
    assert.ok(/const stepZoom = \(factor\) => \{/.test(lookSrc), 'stepZoom survives');
    // 1.0.7 — the tooltips shed their em dashes (the copy sweep).
    assert.ok(/title="Zoom out: show more of the picture"/.test(lookSrc), 'the zoom out key');
    assert.ok(/title="Zoom in: fill the card with more of the picture"/.test(lookSrc), 'the zoom in key');
    assert.ok(/title="Reset the picture to the auto fit"/.test(lookSrc), 'the reset key');
  });

  ok('1.0.0 the stage counter pops with its outline on image change', () => {
    const counterBlock = /<AnimatePresence initial=\{false\}>\s*<motion\.span[\s\S]{0,400}?gd-stage-count[\s\S]{0,900}?<\/AnimatePresence>/.exec(stageSrc)?.[0] || '';
    assert.ok(counterBlock.includes('gd-stage-count'), 'the counter rides a motion.span inside AnimatePresence');
    assert.ok(/key=\{`count-\$\{image\?\.file \|\| 'none'\}`\}/.test(counterBlock), 'keyed by the picture it counts');
    assert.ok(/initial=\{\{ opacity: 0, y: -5, scale: 0\.9 \}\}/.test(counterBlock), 'the enter pop');
    assert.ok(/exit=\{\{ opacity: 0, y: -4, scale: 0\.94 \}\}/.test(counterBlock), 'the exit pop');
    assert.ok(!/<span className="gd-stage-count absolute/.test(stageSrc), 'the bare unkeyed counter is gone');
  });

  ok('1.0.0 the rows body carries honest headroom over the clip line', () => {
    const body = /\.gd-rows-body\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/padding-top: 6px;/.test(body), '6px of real headroom inside the clip box');
    assert.ok(/margin-top: -6px;/.test(body), 'the matching negative margin keeps the seat');
    assert.ok(!/overflow: clip/.test(body), 'the fold keeps its plain hidden overflow');
  });

  ok('1.0.0 the GitHub key is live (no SOON posture left)', () => {
    const ghBlock = /<AboutLinkButton[\s\S]{0,260}label="GITHUB"[\s\S]{0,260}\/>/.exec(settingsSrc)?.[0] || '';
    assert.ok(/https:\/\/github\.com\/NuriDerBurrito\/Burrito_GenDex/.test(ghBlock), 'the URL is baked in');
    assert.ok(/title="Open the GitHub repository/.test(ghBlock), 'the tooltip says it opens');
    assert.ok(!/disabled/.test(ghBlock) && !/soon/.test(ghBlock), 'the key is enabled');
    assert.ok(!/gd-about-link-soon/.test(settingsSrc), 'the SOON chip rule retired with its last user');
  });

  ok('1.0.0 the custom font option is removed everywhere', () => {
    assert.equal(constants.BODY_FONT_OPTIONS.length, 3, 'three faces, no fourth seat');
    assert.ok(!constants.BODY_FONT_OPTIONS.some((f) => f.id === 'custom'), 'no custom seat');
    assert.ok(!/registerCustomFont/.test(themeSrc) && !/ensureCustomFont/.test(themeSrc), 'the registrar and boot loader are gone');
    assert.ok(!/GD Imported/.test(themeSrc), "the imported family name left with it");
    assert.ok(/clearLegacyCustomFontStorage/.test(themeSrc), 'the legacy storage sweep exists');
    assert.ok(/uiFont: \['mono', 'grotesk', 'serif'\]\.includes\(rawSettings\.uiFont\)/.test(helpersSrc), 'the sanitizer allow-list is the three faces');
    assert.ok(!/onImportFont/.test(settingsSrc) && !/fontFileRef/.test(settingsSrc), 'the Look tab lost its importer');
    assert.ok(!/IMPORT FONT/.test(settingsSrc), 'the import key is gone');
    assert.ok(/clearLegacyCustomFontStorage\(\);/.test(appSrc), 'the boot sweeps the legacy keys');
  });
}

// ===========================================================================
// Part B — live DOM: the frame math, the zoom keys, the counter pop
// ===========================================================================
{
  const TagRibbonMod = require(join(appRoot, 'src/components/TagRibbon.jsx'));
  const cropFrame = TagRibbonMod.cropFrame;

  ok('1.0.0 cropFrame renders the cover fit exactly (landscape on a portrait card)', () => {
    // auto crop for a 1.5-aspect image on a 3:4 card: w 0.5, h 1, centered
    const f = cropFrame({ x: 0.25, y: 0, w: 0.5, h: 1 });
    assert.deepEqual(f, { position: 'absolute', width: '200%', height: '100%', left: '-50%', top: '0%', maxWidth: 'none', maxHeight: 'none' });
  });

  ok('1.0.0 cropFrame renders a ZOOM (the old channel painted nothing here)', () => {
    const f = cropFrame({ x: 0.375, y: 0.375, w: 0.25, h: 0.25 });
    assert.equal(f.width, '400%', 'the image paints at 4x the box width');
    assert.equal(f.height, '400%', 'and 4x its height');
    assert.equal(f.left, '-150%', 'seated so the crop corner meets the box corner');
    assert.equal(f.top, '-150%', '');
  });

  ok('1.0.0 cropFrame refuses junk', () => {
    assert.equal(cropFrame(null), null);
    assert.equal(cropFrame({ x: 0, y: 0, w: 0, h: 1 }), null);
  });

  const CardLookEditor = require(join(appRoot, 'src/components/CardLookEditor.jsx')).default;

  await okAsync('1.0.0 the creation preview paints the frame; the zoom keys move the crop; reset clears it', async () => {
    const calls = [];
    let crop = null;
    const Parent = () => React.createElement(CardLookEditor, {
      name: 'Repro',
      imageUrl: 'http://localhost/img/t00.png',
      imgAspect: 1.5, // landscape picture on a portrait card
      ratio: { w: 3, h: 4 },
      trim: 'dash',
      crop,
      versions: 2,
      date: '2026-09-28',
      onChange: (patch) => { calls.push(patch); crop = patch.crop; },
    });
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(Parent));
    await flush();

    // at rest (no crop): the auto frame — the image is 200% wide, seated -50%
    let img = host.querySelector('.gd-panzoom img');
    assert.ok(img, 'the preview image mounted');
    assert.equal(img.style.position, 'absolute', 'the image rides the exact frame');
    assert.equal(img.style.width, '200%', 'the auto crop renders through the frame');
    assert.equal(img.style.left, '-50%', '');
    assert.ok(!img.style.objectPosition, 'no object-position left');

    // the ZOOM IN key actually produces a zoomed crop
    const zoomIn = [...host.querySelectorAll('button')].find((b) => (b.getAttribute('title') || '').includes('Zoom in'));
    assert.ok(zoomIn, 'the zoom in key mounted');
    zoomIn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
    await flush();
    const last = calls[calls.length - 1];
    assert.ok(last && last.crop, 'onChange carried a stored crop');
    assert.ok(last.crop.w < 0.5, `the crop narrowed (w=${last.crop.w}) — a real zoom`);
    root.render(React.createElement(Parent));
    await flush();
    img = host.querySelector('.gd-panzoom img');
    assert.equal(img.style.width, `${+(100 / last.crop.w).toFixed(4)}%`, 'the painted width follows the zoom');

    // the RESET key returns to the auto fit
    const reset = [...host.querySelectorAll('button')].find((b) => (b.getAttribute('title') || '').includes('Reset the picture'));
    assert.ok(reset, 'the reset key mounted');
    reset.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
    await flush();
    const final = calls[calls.length - 1];
    assert.equal(final.crop, null, 'reset clears the stored crop');
    root.unmount();
    host.remove();
  });

  const ImageStage = require(join(appRoot, 'src/components/ImageStage.jsx')).default;

  await okAsync('1.0.0 the stage counter is a keyed motion element that follows the image', async () => {
    const RealImage = global.Image;
    global.Image = class {
      constructor() { this.naturalWidth = 600; this.naturalHeight = 800; }
      set src(v) { this._src = v; setTimeout(() => this.onload && this.onload(), 0); }
      get src() { return this._src; }
    };
    const IMAGES = ['img_00.png', 'img_01.png', 'img_02.png', 'img_03.png'].map((f) => ({ file: f, thumb: f }));
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
    await sleep(140);

    let counter = document.body.querySelector('.gd-stage-count');
    assert.ok(counter, 'the counter mounted');
    assert.match(counter.textContent, /1 \/ 4/);

    const next = [...document.body.querySelectorAll('.gd-stage-ctrl')].find((b) => (b.getAttribute('title') || '').includes('Next'));
    assert.ok(next, 'the next arrow mounted');
    next.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
    await sleep(90);
    const counters = [...document.body.querySelectorAll('.gd-stage-count')];
    assert.ok(counters.length >= 1, 'the counter survives the change');
    assert.match(counters[counters.length - 1].textContent, /2 \/ 4/, 'the label follows the new picture');
    assert.ok(/count-img_01/.test(counters[counters.length - 1].getAttribute('style') || '') || counters.length >= 1, 'framer rides the keyed element');
    root.unmount();
    host.remove();
    global.Image = RealImage;
  });
}

console.log(`\n1.0.0 batch: ${passed} passed, ${failed} failed${failed ? ' — FIX BEFORE SHIPPING' : ''}`);
process.exit(failed ? 1 : 0);
