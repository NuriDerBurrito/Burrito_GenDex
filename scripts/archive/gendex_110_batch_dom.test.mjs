// 1.0.2 batch DOM + source checks — the mark, the bloom & the edit that edits.
//
//   · THE EDIT THAT EDITS ("when right clicking on a card and selecting edit
//     card nothing happens"): the grid card's right-click Edit key only
//     OPENED the card — an already-open card answered the pick with nothing
//     at all. openCardLook now opens the card AND bumps a lookRequest nonce
//     that the mounted CharacterView answers by popping the EDIT CARD window.
//   · THE WORDMARK ("remove the x in gen 'x' dex … have it as gendex, with
//     Burrito_GenDex_logo.png being the icon next to it clipping out of its
//     container"): GENDEX on the titlebar with the burrito mark riding the
//     tab's left edge, oversized so it clips out — hover plays a springy pop.
//   · THE BLOOM ("the app icon in the about section … replace it with
//     About_Logo.png and let it bloom green on its edges (ensure its not
//     laggy, utilize bloom not glow)"): a breathing bloom layer under the
//     mark — opacity-only keyframes, transform-only morph, drop-shadow chain.
//   · ONE MARK EVERYWHERE ("the rest of the instances like on launch/splash
//     screen and such will utilize Burrito_GenDex_logo.png and will remove
//     the x between gen and dex"): splash + about speak the same language,
//     and the app/installer icons wear the new artwork (full size ladders).
//
// Requires jsdom (installed dev-only). Skips gracefully without it.
import { createRequire } from 'node:module';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch {
  console.log('jsdom unavailable — 1.0.2 batch DOM test skipped (dev-only dependency)');
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
// strip comments — the history notes name retired identifiers; the
// assertions read the CODE only.
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
// Part A — source checks for the 1.0.2 wave
// ===========================================================================
{
  const APP = require(join(appRoot, 'src/constants/index.js')).APP;
  const appSrc = src('src/App.jsx');
  const viewSrc = src('src/components/CharacterView.jsx');
  const barSrc = src('src/components/Titlebar.jsx');
  const splashSrc = src('src/components/Splash.jsx');
  const settingsSrc = src('src/components/SettingsModal.jsx');

  ok('1.0.2 the version bumped everywhere (pinned through 1.0.4)', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(src('package.json'), /"version": "1\.4\.3"/);
    assert.match(src('CHANGELOG.md'), /^## 1\.0\.2/m, 'the changelog carries the entry');
  });

  ok('1.0.2 the wordmark lost its ✖ everywhere', () => {
    assert.equal(APP.wordmark, 'GENDEX');
    for (const [name, text] of [['titlebar', barSrc], ['splash', splashSrc], ['about', settingsSrc]]) {
      assert.ok(!/GEN<span[^>]*>✖<\/span>DEX|GEN✖DEX/.test(text), `${name} carries no ✖ wordmark`);
    }
    assert.match(barSrc, /GENDEX/);
    assert.match(splashSrc, /GENDEX/);
    // 1.0.7 — the About tab reads the FULL studio name ("rename gendex to
    // burrito gendex in teh about section in settings"); the titlebar keeps
    // the short GENDEX wordmark, as does the splash's own line.
    assert.match(settingsSrc, />\s*BURRITO GENDEX\s*</);
  });

  ok('1.0.2 the request signal exists (openCardLook + lookRequest — App-level since 1.0.3)', () => {
    assert.match(appSrc, /const openCardLook = useCallback\(/, 'openCardLook exists');
    assert.match(appSrc, /lookNonceRef\.current \+= 1;/, 'the nonce is a rising counter');
    assert.match(appSrc, /setLookRequest\(\{ id, nonce: lookNonceRef\.current \}\)/, 'the request carries id + nonce');
    assert.match(appSrc, /onPick: \(\) => openCardLook\(character\.id\)/, 'the grid card menu routes through it');
    assert.match(appSrc, /onPick: \(\) => openCardLook\(ch\.id\)/, 'the card-view region menu routes through it');
    // 1.0.3 — the window renders at App level now, keyed by the request's id
    assert.match(appSrc, /\{lookRequest && lookCharacter && \(/, 'the App-level mount is request-gated');
    assert.match(appSrc, /key=\{lookRequest\.id\}/, 'the window is keyed by the request id');
    assert.match(appSrc, /onClose=\{\(\) => setLookRequest\(null\)\}/, 'closing CONSUMES the request');
    assert.match(appSrc, /onEditCard=\{\(\) => openCardLook\(panelCharacterId\)\}/, 'the panel gear key asks App');
    assert.match(appSrc, /onEditCard=\{\(\) => openCardLook\(view\.id\)\}/, 'the full-window gear key asks App');
    // the view no longer knows the request at all — the window left it
    const viewCode = stripComments(viewSrc);
    assert.ok(!/lookRequest/.test(viewCode), 'the view no longer carries a lookRequest prop');
    assert.match(viewSrc, /onEditCard = null,/, 'the view accepts the App-level onEditCard prop');
    assert.match(viewSrc, /export function CardLookModal/, 'the modal is exported for App');
  });

  ok('1.0.2 the clipping mark rides the wordmark tab (css)', () => {
    assert.match(barSrc, /import gendexLogo from '\.\.\/assets\/gendex_logo\.png'/, 'the mark is imported');
    assert.match(barSrc, /className="gd-wordmark-logo no-drag"/, 'the mark sits in the tab');
    const logoRule = /\.gd-wordmark-logo\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.match(logoRule, /position: absolute;/, 'seated absolutely over the tab');
    assert.match(logoRule, /left: -11px;/, 'poking out past the tab\'s left border');
    assert.match(logoRule, /width: 34px;/, 'taller than the 26px tab — it clips top and bottom too');
    assert.match(logoRule, /transition: transform 0\.34s cubic-bezier\(0\.34, 1\.56, 0\.64, 1\);/, 'the springy hover flight');
    const hoverRule = /\.gd-wordmark-tab:hover \.gd-wordmark-logo\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.match(hoverRule, /rotate\(-10deg\) scale\(1\.18\)/, 'hover tilts and grows the mark');
    assert.match(css, /\.gd-reduced-motion \.gd-wordmark-logo\s*\{[^}]*transition: none;/, 'reduced motion retires the bounce');
  });

  ok('1.0.2 the about mark is About_Logo.png and carries light (glow alone since 1.0.5)', () => {
    assert.match(settingsSrc, /import aboutLogo from '\.\.\/assets\/about_logo\.png'/, 'the new mark is imported');
    assert.match(settingsSrc, /className="morph-a"/, 'it is the pre-hover face');
    // 1.0.4 — the bloom wrappers became HALO wrappers (glow + godrays).
    // 1.0.5 — THE GODRAYS RETIRED ("i dont like the godrays, remove them
    // from splash screen and about section, and improve the glow"): the
    // halo is the glow alone now, layered and deeper.
    assert.match(settingsSrc, /className="morph-halo morph-halo-a"/, 'the resting halo wrapper exists');
    assert.match(settingsSrc, /className="morph-halo morph-halo-b"/, 'the second face halo wrapper exists (1.0.3 doubled, 1.0.4 reborn as halo)');
    assert.ok(!/halo-rays/.test(settingsSrc), 'the godrays layer is retired (1.0.5)');
    assert.match(settingsSrc, /className="halo-glow"/, 'the glow/shine layer exists');
    const glowRule = /\.about-morph \.halo-glow\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.match(glowRule, /mix-blend-mode: screen;/, 'the glow reads as light, not paint');
    assert.ok(!/conic-gradient/.test(glowRule), 'no conic fan rides the halo (1.0.5)');
    assert.ok((glowRule.match(/radial-gradient/g) || []).length >= 2, 'the glow is LAYERED (core + field, 1.0.5)');
    assert.match(glowRule, /animation: gd-halo-breathe 3\.8s ease-in-out infinite/, 'the glow breathes forever');
    assert.match(glowRule, /gd-halo-swell 7\.6s ease-in-out infinite/, 'and swells on its own clock (1.0.5)');
    assert.match(glowRule, /radial-gradient/, 'the glow is a radial light');
    assert.ok(!/box-shadow[^;]*green/i.test(css), 'no bounding-box glow anywhere');
    // THE PERFORMANCE LAW: the glow keyframes animate ONLY opacity.
    const keyframes = /@keyframes gd-halo-breathe\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
    assert.ok(!/transform|filter|width|height|left|top/.test(keyframes), 'the breathe touches nothing but opacity');
    // The swell keyframes animate ONLY scale (transform).
    const swell = /@keyframes gd-halo-swell\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
    assert.match(swell, /transform: scale\(1\.05\);/, 'the swell is a pure scale');
    assert.ok(!/opacity|filter|width|height|left|top/.test(swell), 'the swell touches nothing but transform');
    // The morph rides a transform transition on the WRAPPER, not the glow.
    const haloRule = /\.about-morph \.morph-halo\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.match(haloRule, /transition: transform 0\.7s cubic-bezier\(0\.2, 0\.8, 0\.2, 1\), opacity 0\.45s ease;/, 'the wrapper morphs');
    assert.match(css, /\.gd-reduced-motion \.about-morph \.halo-glow\s*\{[^}]*animation: none;/, 'reduced motion stills the glow');
  });

  ok('1.0.2 the splash + every instance speak the burrito mark', () => {
    assert.match(splashSrc, /import gendexLogo from '\.\.\/assets\/gendex_logo\.png'/, 'the splash shows the burrito mark');
    assert.ok(!splashSrc.includes("from '../assets/logo.png'"), 'the old logo is retired from the splash');
    assert.ok(!settingsSrc.includes("import logo from '../assets/logo.png'"), 'the old logo is retired from the about page');
    assert.ok(existsSync(join(appRoot, 'src/assets/gendex_logo.png')), 'the mark asset exists');
    assert.ok(existsSync(join(appRoot, 'src/assets/about_logo.png')), 'the about mark asset exists');
  });

  ok('1.0.2 the app + installer icons wear the new artwork (full ladders)', () => {
    for (const file of ['Icon.ico', 'installer.ico']) {
      const buf = readFileSync(join(appRoot, file));
      assert.equal(buf.readUInt16LE(0), 0, `${file} opens with the ICO null word`);
      const count = buf.readUInt16LE(4);
      assert.ok(count >= 7, `${file} carries the full size ladder (${count} frames)`);
      // the widest frame is a true 256px entry (width byte 0 means 256)
      let has256 = false;
      for (let i = 0; i < count; i += 1) {
        const w = buf.readUInt8(6 + i * 16);
        if (w === 0) has256 = true;
      }
      assert.ok(has256, `${file} carries a 256px frame`);
      assert.ok(statSync(join(appRoot, file)).size > 10000, `${file} is a real multi-frame file`);
    }
    assert.match(src('forge.config.js'), /icon: '\.\/Icon\.ico'/, 'the packager icon is wired');
    assert.match(src('forge.config.js'), /setupIcon: '\.\/installer\.ico'/, 'the installer icon is wired');
  });
}

// ===========================================================================
// Part B — live DOM: the edit that edits (the already-open card answers)
// ===========================================================================
{
  // Mount the REAL App with a mock api — one card in the grid.
  window.api = {
    loadDB: async () => ({
      db: {
        settings: {
          theme: 'zine', colors: {}, zoom: 2, defaultSortMode: 'custom',
          textures: { workspace: 'none', titlebar: 'none', sidebar: 'none', viewer: 'dots', panel: 'none' },
          detailPanel: true, tagScale: 1.2, cardRatio: { w: 3, h: 4 },
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
  };

  const App = require(join(appRoot, 'src/App.jsx')).default;
  const click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  const rclick = (el) => el.dispatchEvent(new dom.window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 40 }));

  await okAsync('1.0.2 right-click → Edit card on an ALREADY-OPEN card pops the EDIT CARD window', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(App));
    await sleep(3400); // splash timeline

    // open the card the normal way — the panel mounts it
    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    assert.ok(card, 'the grid card mounted');
    click(card);
    await flush();
    await sleep(160);
    assert.ok(document.querySelector('[data-gd-region="panel"]'), 'the panel opened the card');

    // THE OLD BUG: right-click the SAME card → Edit → nothing at all.
    rclick(card);
    await flush();
    const items = [...document.querySelectorAll('.gd-ctx-item')];
    const edit = items.find((m) => /Edit card/.test(m.textContent || ''));
    assert.ok(edit, 'the card menu carries the Edit card key');
    click(edit);
    await flush();
    await sleep(200);
    const modal = [...document.querySelectorAll('[data-gd-modal]')].find((m) => /EDIT CARD/.test(m.textContent || ''));
    assert.ok(modal, 'the EDIT CARD window popped for the already-open card');
    // and the NAME field rides it (the window is the card's editor)
    assert.match(modal.textContent, /NAME/, 'the name field is inside');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.2 a FRESH card edit pick pops the window (no panel since 1.0.3)', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(App));
    await sleep(3400);

    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    rclick(card);
    await flush();
    const edit = [...document.querySelectorAll('.gd-ctx-item')].find((m) => /Edit card/.test(m.textContent || ''));
    assert.ok(edit, 'the menu offers Edit card');
    click(edit);
    await flush();
    await sleep(200);
    // 1.0.3 — the pick no longer drags the details panel along
    assert.ok(!document.querySelector('[data-gd-region="panel"]'), 'the panel stayed closed (1.0.3 law)');
    const modal = [...document.querySelectorAll('[data-gd-modal]')].find((m) => /EDIT CARD/.test(m.textContent || ''));
    assert.ok(modal, 'the EDIT CARD window opened anyway — over the grid');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.2 re-editing the same card re-fires the window after it closes', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(App));
    await sleep(3400);

    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    const pickEdit = async () => {
      rclick(card);
      await flush();
      const edit = [...document.querySelectorAll('.gd-ctx-item')].find((m) => /Edit card/.test(m.textContent || ''));
      click(edit);
      await flush();
      await sleep(200);
      return [...document.querySelectorAll('[data-gd-modal]')].find((m) => /EDIT CARD/.test(m.textContent || ''));
    };
    assert.ok(await pickEdit(), 'the first pick opened the window');
    // close it through CANCEL
    const cancel = [...document.querySelectorAll('[data-gd-modal] button')].find((b) => (b.textContent || '').trim() === 'CANCEL');
    assert.ok(cancel, 'the cancel key mounted');
    click(cancel);
    await flush();
    await sleep(200);
    assert.ok(![...document.querySelectorAll('[data-gd-modal]')].some((m) => /EDIT CARD/.test(m.textContent || '')), 'the window closed');
    // the rising nonce re-fires for the SAME card — the old no-op is gone
    assert.ok(await pickEdit(), 'the second pick re-opened the window (the nonce re-fired)');
    root.unmount();
    host.remove();
  });

  // The titlebar wordmark + the about tab (component-level mounts).
  const Titlebar = require(join(appRoot, 'src/components/Titlebar.jsx')).default;
  await okAsync('1.0.2 the titlebar paints GENDEX with the clipping burrito mark', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(Titlebar, { onOpenSettings: () => {}, panelMode: false, onTogglePanel: () => {}, outputBarMode: false, onToggleOutputBar: () => {}, tooltipMode: false, onToggleTooltips: () => {} }));
    await flush();
    const tab = host.querySelector('.gd-wordmark-tab');
    assert.ok(tab, 'the tab mounted');
    assert.equal(tab.textContent.trim(), 'GENDEX', 'the wordmark reads GENDEX');
    const img = tab.querySelector('.gd-wordmark-logo');
    assert.ok(img, 'the burrito mark rides the tab');
    assert.match(img.getAttribute('src') || '', /\.png$/, 'the mark is the png asset');
    root.unmount();
    host.remove();
  });

  const Splash = require(join(appRoot, 'src/components/Splash.jsx')).default;
  await okAsync('1.0.2 the splash paints the burrito mark above the wordmark', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(Splash, { status: 'init', loaded: false }));
    await flush();
    const img = host.querySelector('img.splash-logo-animate');
    assert.ok(img, 'the mark mounted');
    assert.match(img.getAttribute('src') || '', /\.png$/, 'it is the burrito mark asset');
    assert.match(host.textContent, /GENDEX/, 'the wordmark reads GENDEX');
    assert.ok(!host.textContent.includes('✖'), 'no ✖ anywhere on the splash');
    assert.match(host.textContent, /V1\.4\.3/, 'the version rides the splash');
    root.unmount();
    host.remove();
  });
}

console.log(`\n1.0.2 batch: ${passed} passed, ${failed} failed${failed ? ' — FIX BEFORE SHIPPING' : ''}`);
process.exit(failed ? 1 : 0);
