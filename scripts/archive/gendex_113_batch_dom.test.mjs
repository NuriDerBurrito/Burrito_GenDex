// 1.0.3 batch DOM + source checks — the window that minds its own business.
//
//   · THE WINDOW STANDS ALONE ("fix the issue where right click and editing
//     the card it would pop the details panel right away" + "when i open a
//     card it would pop the edit card window right away"): the EDIT CARD
//     window renders at App level, the request no longer opens the card,
//     and closing CONSUMES the request — a plain card open can never
//     inherit a stale one.
//   · THE SPLASH SPEAKS THE FULL NAME ("in the splash screen, it should be
//     'Burrito GenDex' not just gendex").
//   · THE BLOOM LEARNED MODESTY ("the bloom is too much and its scaled too
//     big, scale it down slightly, and also add bloom for the second logo
//     after the hover"): tighter spread, softer radii, lower breathing —
//     and a second bloom wrapper under the hover-morphed mark.
//   · THE RIMS CONTAIN THEIR MARKS ("the black outline is offsetted... fix
//     that so its containing it properly instead of leaning more to the
//     top left"): the sub-pixel cardinal rims (which Chromium snaps
//     asymmetrically — the lean) are replaced by zero-offset dilations.
//   · THE BOTTOM BAR DROPS ITS FLOOR SHADOW ("remove the shadow of the
//     bottom output panel when it pops in and out").
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
  console.log('jsdom unavailable — 1.0.3 batch DOM test skipped (dev-only dependency)');
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
global.MutationObserver = dom.window.MutationObserver;
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
// strip comments — the codebase's history notes name retired identifiers
// (the very bugs these tests pin); the assertions read the CODE only.
const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

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
    console.log(`  FAIL ${passed + failed > 0 ? passed + failed : 1} — ${name}\n      ${String(e && e.message).split('\n')[0]}`);
  }
};
const flush = () => new Promise((r) => setTimeout(r, 30));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ===========================================================================
// Part A — source checks for the 1.0.3 wave
// ===========================================================================
{
  const APP = require(join(appRoot, 'src/constants/index.js')).APP;
  const appSrc = src('src/App.jsx');
  const viewSrc = src('src/components/CharacterView.jsx');
  const splashSrc = src('src/components/Splash.jsx');
  const settingsSrc = src('src/components/SettingsModal.jsx');

  ok('1.0.3 the version bumped everywhere', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(src('package.json'), /"version": "1\.4\.3"/);
    assert.match(src('CHANGELOG.md'), /^## 1\.0\.3/m, 'the changelog carries the entry');
  });

  ok('1.0.3 the splash speaks the full name — Burrito GenDex', () => {
    const splashCode = stripComments(splashSrc);
    assert.match(splashCode, /BURRITO GENDEX/, 'the wordmark reads the whole studio name');
    assert.ok(!/GENDDEX/.test(splashCode), 'no doubled-D typo anywhere');
    assert.ok(!splashCode.includes('✖'), 'no ✖ on the splash');
  });

  ok('1.0.3 the edit pick never drags the panel along (openCardLook is pure)', () => {
    // THE LAW: the request-only opener — no openCharacter call inside it.
    const body = /const openCardLook = useCallback\(([\s\S]*?)\n  \}, \[/.exec(appSrc)?.[1] || '';
    assert.ok(body.includes('setLookRequest'), 'the opener parks the request');
    assert.ok(!body.includes('openCharacter'), 'the opener never opens the card');
    // and the request is consumed on close AND on apply
    assert.match(appSrc, /onClose=\{\(\) => setLookRequest\(null\)\}/, 'closing consumes');
    assert.match(appSrc, /setLookRequest\(null\);\n              setStatusTransient\('Card updated'\);/, 'applying consumes');
    // the window mounts at App level, keyed by the request id
    assert.match(appSrc, /key=\{lookRequest\.id\}/, 'keyed by request id — a re-pick keeps its draft');
  });

  ok('1.0.3 the view cannot pop the window (no lookOpen seat left)', () => {
    const viewCode = stripComments(viewSrc);
    assert.ok(!/lookOpen/.test(viewCode), 'no lookOpen state in the view');
    assert.ok(!/lookRequest/.test(viewCode), 'no lookRequest prop in the view');
    assert.match(viewSrc, /onEditCard = null,/, 'the gear key delegates to App');
  });

  ok('1.0.3 the bloom was tamed — 1.0.4 haloed it, 1.0.5 retired the rays and deepened the glow', () => {
    // 1.0.4 — the bloom layers were GONE (retired by request); the halo that
    // replaced them kept the same calm. 1.0.5 — THE GODRAYS RETIRED TOO
    // ("i dont like the godrays… improve the glow"): the glow alone remains,
    // LAYERED (a bright core over a wide field), bigger, breathing deeper
    // (0.5 → 1) and swelling on transform (1 → 1.05, its own 7.6s calm).
    assert.ok(!/bloom-breath/.test(css), 'the bloom breathing layer is retired (1.0.4)');
    assert.ok(!/morph-bloom/.test(css), 'the bloom wrappers are retired (1.0.4)');
    assert.ok(!/halo-rays/.test(css), 'the godrays layer is retired (1.0.5)');
    const glowRule = /\.about-morph \.halo-glow\s*\{[^}]*\}/.exec(css)?.[0] || '';
    /* 1.1.1 — the halo grew slightly ("make the about glow slightly
       bigger"): -62% -> -72% (a ~219px halo on the 80px mark). The 1.0.5
       law still holds — wider than the retired 1.0.4 halo's -42%. */
    assert.match(glowRule, /inset: -72%;/, 'the glow spreads wider than the 1.0.4 halo (-42%), slightly bigger since 1.1.1 (-72%)');
    // 1.0.7 — THE LIGHT SPEAKS THE THEME ("the glow in about and splash
    // should be related to the theme color"): the stops mix the theme's own
    // accent pair now (color-mix on --gd-accent / --gd-accent2, with the
    // house green as fallback) instead of hard-coded rgba greens.
    assert.match(glowRule, /color-mix\(in srgb, var\(--gd-accent, #4ade80\) 30%, transparent\) 0%/, 'a bright theme-accent core');
    assert.ok((glowRule.match(/radial-gradient/g) || []).length >= 2, 'the glow is layered (core + field, 1.0.5)');
    // 1.0.6 — THE EDGE DISSOLVES: three eased fields, every one reaching
    // EXACT ZERO by 42-64% of the gradient radius — well inside the circle's
    // 70.7% border, so the halo's own boundary can never read as a ring.
    assert.ok((glowRule.match(/radial-gradient/g) || []).length >= 3, '1.0.6: three eased fields stack');
    // 1.0.7 — the zero-stops are `transparent` now (same exact-zero law,
    // whatever the hue): every field still dies fully inside its circle.
    assert.match(glowRule, /transparent 42%/, 'the core field reaches exact zero by 42%');
    assert.match(glowRule, /transparent 56%/, 'the wide field reaches exact zero by 56%');
    assert.match(glowRule, /transparent 64%/, 'the far-base field reaches exact zero by 64%');
    const keyframes = /@keyframes gd-halo-breathe\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
    assert.match(keyframes, /opacity: 0\.5;/, 'the breathing floor stays calm');
    assert.match(keyframes, /opacity: 1;/, 'the breathing ceiling deepened (1.0.5)');
    // THE PERFORMANCE LAW still holds — opacity only.
    assert.ok(!/transform|filter|width|height|left|top/.test(keyframes), 'the breathe touches nothing but opacity');
    const swell = /@keyframes gd-halo-swell\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
    assert.ok(!/opacity|filter|width|height|left|top/.test(swell), 'the swell touches nothing but transform');
  });

  ok('1.0.3 the second logo gets its own light after the hover (halo wrappers, opposite flights)', () => {
    assert.match(settingsSrc, /className="morph-halo morph-halo-a"/, 'the resting face wrapper');
    assert.match(settingsSrc, /className="morph-halo morph-halo-b"/, 'the hover face wrapper');
    assert.match(settingsSrc, /<div className="morph-halo morph-halo-b" aria-hidden>\s*<div className="halo-glow" \/>/, 'the second halo shines behind the company mark (glow alone since 1.0.5)');
    const bRest = /\.about-morph \.morph-halo-b\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.match(bRest, /transform: rotate\(-180deg\) scale\(0\.35\);/, 'hidden at rest (mirrors .morph-b)');
    assert.match(bRest, /opacity: 0;/, 'invisible at rest');
    const bHover = /\.about-morph:hover \.morph-halo-b\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.match(bHover, /transform: rotate\(0deg\) scale\(1\);/, 'lands with the mark on hover');
    assert.match(bHover, /opacity: 1;/, 'shines once the morph lands');
    const aHover = /\.about-morph:hover \.morph-halo-a\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.match(aHover, /opacity: 0;/, 'the resting halo still fades out on hover');
  });

  ok('1.0.3 the rims are zero-offset dilations (no top-left lean)', () => {
    /* 1.1.4 — line-anchored: the chip-shape glyph override sits earlier in the sheet. */
    const glyphRule = /^\.gd-ribbon-glyph\s*\{[^}]*\}/m.exec(css)?.[0] || '';
    assert.ok(/drop-shadow\(0 0 [0-9.]+px var\(--gd-glyph-rim/.test(glyphRule), 'the ribbon rim dilates with the rim color');
    assert.ok(!/drop-shadow\((?:-?0\.6|[0-9.]+)px (?:0|-?[0-9.]+px) 0/.test(glyphRule), 'no directional offsets remain on the ribbon rim');
    const aboutRule = /\.gd-about-link-ico img\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/drop-shadow\(0 0 1px rgba\(0, 0, 0, 0\.8\)/.test(aboutRule), 'the about rim dilates');
    assert.ok(!/drop-shadow\((?:0\.75|-0\.75)px/.test(aboutRule), 'no ±0.75px cardinals remain');
  });

  ok('1.0.3 the bottom output panel carries no floor shadow', () => {
    const barRule = /\.gd-output-bar\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(!/box-shadow/.test(barRule), 'the curtain flight paints no shadow');
  });
}

// ===========================================================================
// Part B — live DOM: the window that minds its own business
// ===========================================================================
{
  const makeApi = (detailPanel) => ({
    loadDB: async () => ({
      db: {
        settings: {
          theme: 'zine', colors: {}, zoom: 2, defaultSortMode: 'custom',
          textures: { workspace: 'none', titlebar: 'none', sidebar: 'none', viewer: 'dots', panel: 'none' },
          detailPanel, tagScale: 1.2, cardRatio: { w: 3, h: 4 },
        },
        classes: [{ id: 'cl1', name: 'heroes', parentId: 'root', order: 1 }],
        tags: [], stamps: [],
        characters: [
          {
            id: 'c1', name: 'amy', classId: 'cl1', tags: [], previewVersionId: null,
            cardRatio: { w: 4, h: 7 }, cardTrim: 'ledger', cardCrop: null, stamps: [],
            stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
            createdAt: Date.now(),
            versions: [
              {
                id: 'v1', label: 'V1', color: '#c8402f', icon: null,
                images: [{ file: 'a.png', thumb: 'a_t.jpg' }],
                parts: [{ id: 'p1', name: 'body', content: 'soft shading', include: true }],
                notes: 'first pass', createdAt: 1,
              },
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
  });

  const App = require(join(appRoot, 'src/App.jsx')).default;
  const click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  const rclick = (el) => el.dispatchEvent(new dom.window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 40 }));
  const editModal = () => [...document.querySelectorAll('[data-gd-modal]')].find((m) => /EDIT CARD/.test(m.textContent || ''));

  const boot = async (api) => {
    window.api = api;
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(App));
    await sleep(3400); // splash timeline
    return { host, root };
  };

  await okAsync('1.0.3 opening a card pops NO edit window (the stale request is gone)', async () => {
    const { host, root } = await boot(makeApi(true));
    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    assert.ok(card, 'the grid card mounted');

    // 1) one edit pick (request latched), then close the window
    rclick(card);
    await flush();
    const edit = [...document.querySelectorAll('.gd-ctx-item')].find((m) => /Edit card/.test(m.textContent || ''));
    click(edit);
    await flush();
    await sleep(200);
    assert.ok(editModal(), 'the window popped for the pick');
    const cancel = [...document.querySelectorAll('[data-gd-modal] button')].find((b) => (b.textContent || '').trim() === 'CANCEL');
    click(cancel);
    await flush();
    await sleep(200);
    assert.ok(!editModal(), 'the window closed (request consumed)');

    // 2) THE 1.0.3 BUG: opening THE SAME card later must NOT pop the window
    click(card);
    await flush();
    await sleep(160);
    assert.ok(document.querySelector('[data-gd-region="panel"]'), 'the panel opened the card');
    assert.ok(!editModal(), 'NO edit window on a plain open — the stale request never fired');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.3 right-click → Edit card pops the window WITHOUT the details panel', async () => {
    const { host, root } = await boot(makeApi(true));
    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    assert.ok(!document.querySelector('[data-gd-region="panel"]'), 'the panel starts closed');

    rclick(card);
    await flush();
    const edit = [...document.querySelectorAll('.gd-ctx-item')].find((m) => /Edit card/.test(m.textContent || ''));
    assert.ok(edit, 'the menu offers Edit card');
    click(edit);
    await flush();
    await sleep(200);
    assert.ok(editModal(), 'the EDIT CARD window popped');
    assert.ok(!document.querySelector('[data-gd-region="panel"]'), 'the details panel NEVER opened — the window minds its own business');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.3 with the panel already open, an edit pick pops the window and disturbs nothing', async () => {
    const { host, root } = await boot(makeApi(true));
    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    click(card);
    await flush();
    await sleep(160);
    assert.ok(document.querySelector('[data-gd-region="panel"]'), 'the panel opened the card');

    rclick(card);
    await flush();
    const edit = [...document.querySelectorAll('.gd-ctx-item')].find((m) => /Edit card/.test(m.textContent || ''));
    click(edit);
    await flush();
    await sleep(200);
    assert.ok(editModal(), 'the window popped over the open panel');
    assert.ok(document.querySelector('[data-gd-region="panel"]'), 'the panel is still the same open card — no view change');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.3 in full-window mode (panel off), an edit pick neither opens the full view nor changes it', async () => {
    const { host, root } = await boot(makeApi(false));
    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    assert.ok(!document.querySelector('[data-gd-region="panel"]'), 'no panel in this mode');

    rclick(card);
    await flush();
    const edit = [...document.querySelectorAll('.gd-ctx-item')].find((m) => /Edit card/.test(m.textContent || ''));
    click(edit);
    await flush();
    await sleep(200);
    assert.ok(editModal(), 'the window popped over the grid');
    assert.ok(!host.ownerDocument.querySelector('.gd-viewer-cover'), 'the full-window view never engaged');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.3 applying an edit consumes the request AND commits the name', async () => {
    const { host, root } = await boot(makeApi(true));
    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    rclick(card);
    await flush();
    const edit = [...document.querySelectorAll('.gd-ctx-item')].find((m) => /Edit card/.test(m.textContent || ''));
    click(edit);
    await flush();
    await sleep(200);
    assert.ok(editModal(), 'the window opened');

    // type a new name into the rich field (contenteditable) and DONE
    const field = editModal().querySelector('.gd-rt-edit');
    assert.ok(field, 'the name field mounted');
    field.textContent = 'amy rewritten';
    field.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await flush();
    await sleep(60);
    const done = [...document.querySelectorAll('[data-gd-modal] button')].find((b) => (b.textContent || '').trim() === 'DONE');
    click(done);
    await flush();
    await sleep(260);
    assert.ok(!editModal(), 'the window closed on apply');
    assert.ok(host.textContent.includes('amy rewritten'), 'the committed name shows in the grid');
    // and a plain open right after still pops nothing
    click(host.ownerDocument.querySelector('[data-gd-char-id="c1"]'));
    await flush();
    await sleep(160);
    assert.ok(!editModal(), 'the consumed request stays consumed');
    root.unmount();
    host.remove();
  });

  const Splash = require(join(appRoot, 'src/components/Splash.jsx')).default;
  await okAsync('1.0.3 the splash paints BURRITO GENDEX', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(Splash, { status: 'init', loaded: false }));
    await flush();
    assert.match(host.textContent, /BURRITO GENDEX/, 'the full name rides the splash');
    assert.ok(!host.textContent.includes('GENDDEX'), 'no doubled-D typo');
    assert.match(host.textContent, /V1\.4\.3/, 'the version rides the splash');
    assert.ok(host.querySelector('img.splash-logo-animate'), 'the burrito mark still rides above it');
    root.unmount();
    host.remove();
  });
}

console.log(`\n1.0.3 batch: ${passed} passed, ${failed} failed${failed ? ' — FIX BEFORE SHIPPING' : ''}`);
process.exit(failed ? 1 : 0);
