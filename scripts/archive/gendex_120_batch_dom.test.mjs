// 1.1.0 batch DOM + source checks — the rest of the name, and a light under
// the mark. The five fixes:
//   · THE OPEN TAB RETIRED ("remove the open label at the top right of the
//     card, the outline should be enough"): the 1.0.9 selected state spoke
//     twice — ring + tag. The tag is gone; the ring alone carries it.
//   · THE NAME UNFOLDS ("when the name gets cropped, add '...' at the end of
//     it that expands to reveal the rest"): the ellipsis was already painted
//     by truncate; the REST of the name now rides an ink-framed plate that
//     seats over the foot on hover — mounted only when the title MEASURES
//     cropped (scrollWidth vs clientWidth, re-checked by a ResizeObserver),
//     revealed by pure CSS (:hover / focus-within), capped at five lines
//     with its own ellipsis, date kept beneath.
//   · THE OUTPUT CHIPS ARE TWINS ("the output panel version emojie is
//     smaller than the normal version emojie"): the bar's (and the expanded
//     cover's) version chip wore a slimming seat that made it 4px shorter
//     than the strip's — the slimming classes are retired; both chips wear
//     the strip chip's exact geometry.
//   · THE LIGHT SITS UNDER THE MARK ("the glow in splash screen should be
//     below the app icon, not in the center, also improve the splash screen
//     since it does seem empty still"): the halo moved from the screen's
//     middle INTO the mark's own wrapper (top 104px — a pool under the 96px
//     icon), and the cover gained a dot field, an edge veil, four corner
//     brackets, a mirrored reflection, a wider theme-tinted drift, and a
//     footer colophon.
//   · ONE GRAMMAR FOR THE TREE ("swap the new class under class and new card
//     in class..."): the class-row menu leads with NEW CLASS UNDER, then NEW
//     CARD IN — matching the root row and the tree's empty area.
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
  console.log('jsdom unavailable — 1.1.0 batch DOM test skipped (dev-only dependency)');
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
global.localStorage = dom.window.localStorage;

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
const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const { APP } = require(join(appRoot, 'src/constants/index.js'));

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL ${passed + failed} — ${name}\n      ${String(e && e.message).split('\n')[0]}`);
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
// Part A — source checks for the 1.1.0 wave
// ===========================================================================
{
  const codeCss = stripComments(css);
  const gridSrc = stripComments(src('src/components/GridView.jsx'));
  const appSrc = stripComments(src('src/App.jsx'));
  const splashSrc = stripComments(src('src/components/Splash.jsx'));
  const richSrc = stripComments(src('src/components/RichText.jsx'));

  ok('1.1.0 the version bumped everywhere', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(src('package.json'), /"version": "1\.4\.3"/);
    assert.match(src("README.md"), /v1\.4\.3/);
    assert.match(src('CHANGELOG.md'), /^## 1\.1\.3 /m);
  });

  // ---- fix 1: the OPEN tab retires ----
  ok('1.1.0 the OPEN tab is retired — the outline is enough', () => {
    assert.ok(!/gd-card-open-tab/.test(gridSrc), 'no tab node in the card');
    assert.ok(!/\.gd-card-open-tab\s*\{/.test(codeCss), 'no tab rule in the CSS');
    // 1.5.4 — the ring speaks a ::after pseudo under the ribbons now
    // ("the outline of the card is marking above the tags").
    const ringRule = /\.gd-card-selected::after\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(ringRule, /border: 2px solid var\(--gd-accent\);/, 'the ring stays — 2px of accent');
    assert.match(ringRule, /inset: -3px;/, 'one pixel off the border');
    assert.match(ringRule, /z-index: 4;/, 'seated under the ribbons');
  });

  // ---- fix 2: the name unfolds ---- RETIRED in 1.1.4 ----
  // ("when hovering over a card, the date gets pushed down and the name
  // gets pushed up, fix that so they dont move" + "do show the 3 dots
  // before clipping the text" + "it doesnt clip the text after a space"):
  // the 1.1.2 crop measure was structurally broken (scrollWidth is clamped
  // to clientWidth, so `scrollWidth > clientWidth - seat` is TRUE for every
  // versioned card) — the plate mounted everywhere, the hover expanded the
  // name instead of clipping it, and the date rode the wrapped lines down.
  // The plate, its measure and its machinery are gone; the hover keeps ONE
  // law: the cropped title (dots and all) stays seated, the badge fades in
  // at the title's own line height, nothing moves. These checks pin the
  // retirement itself.
  ok('1.1.0 the cropped name unfolds — RETIRED in 1.1.4 (stone-still hover)', () => {
    assert.ok(!/gd-name-unfold/.test(gridSrc), 'the plate no longer mounts anywhere in the grid card');
    assert.ok(!/measureName/.test(gridSrc), 'the broken scrollWidth-seat measure is gone with it');
    assert.ok(!/nameCropped/.test(gridSrc), 'no crop state rides the card anymore');
    assert.match(gridSrc, /character\.versions\.length > 0 && 'has-vers'/, 'the foot carries has-vers exactly when a badge exists');
    assert.match(gridSrc, /gd-card-title font-display font-bold leading-tight truncate/, 'the title keeps the one-line crop with its dots');
    assert.match(richSrc, /as: Tag = 'span', ref \}/, 'RichText accepts a ref (React 19 plain prop — still forwarded for the version chips)');
    const refSeats = richSrc.match(/style=\{style\} ref=\{ref\}/g) || [];
    assert.equal(refSeats.length, 2, 'and forwards it on both of its render paths');
  });

  ok('1.1.0 the unfold plate is RETIRED — the hover is one clean fade (CSS)', () => {
    assert.ok(!/\.gd-name-unfold\s*\{/.test(codeCss), 'the plate rule is gone');
    assert.ok(!/gd-name-unfold-text/.test(codeCss), 'the clamp seat is gone with it');
    // the 1.1.4 hover law: two tracks only when a badge exists, seated at
    // the title's own line height — nothing moves, dots always paint.
    const hoverFoot = /\.gd-card:hover \.gd-card-foot-vers\.has-vers,[\s\S]{0,160}?\.gd-card-foot-vers\.has-vers:focus-within\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(hoverFoot, /grid-template-columns: minmax\(0, 1fr\) auto;/, 'hover opens the badge track (has-vers only)');
    const hoverBadge = /\.gd-card:hover \.gd-card-foot-vers\.has-vers \.gd-card-vers,[\s\S]{0,200}?\.gd-card-foot-vers\.has-vers:focus-within \.gd-card-vers\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(hoverBadge, /height: calc\(18\.75px \* var\(--card-scale, 1\)\);/, 'the seat wears the title line height — the rows never move');
    assert.match(hoverBadge, /opacity: 1;/, 'and the badge fades in as one block');
  });

  // ---- fix 3: the twin chips ----
  ok('1.1.0 the output chips are the strip chip\'s exact twins', () => {
    const twins = appSrc.match(/className="gd-out-split gd-chip gd-chip-flat"/g) || [];
    assert.equal(twins.length, 2, 'the bar\'s chip AND the expanded cover\'s chip wear the plain chip geometry');
    assert.ok(!/gd-chip-flat !py-0\.5/.test(appSrc), 'no slimming seat survives anywhere');
    assert.ok(!/gd-chip-flat !py-0\.5 !px-2 text-\[10px\]/.test(appSrc), 'the 1.0.9 slim triple is gone');
    const chipRule = /\.gd-chip\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(chipRule, /padding: 4px 10px;/, 'the base chip law they now share with the strip');
    assert.match(chipRule, /font-size: 12px;/, 'same type size as the strip');
  });

  // ---- fix 4: the splash — the light under the mark, and a place ----
  ok('1.1.0 the halo seated UNDER the mark — 1.1.8 retired it whole', () => {
    /* 1.1.8 — the glow left the launch ("remove glow from the splash
       screen, instead just decoreate it more so its not empty"): the halo,
       its under-the-mark seat and the reflection are ALL retired; the mark
       wrapper survives as the icon's own frame. */
    assert.ok(!/\.gd-splash-halo\s*\{/.test(codeCss), '1.1.8: no splash halo rule survives');
    assert.ok(!/gd-splash-halo/.test(splashSrc), 'and no halo node in the launch JSX');
    assert.match(codeCss, /\.gd-splash-mark\s*\{[^}]*?position: relative;[^}]*?\}/, 'the mark wrapper keeps its stage');
    assert.ok(!/gd-splash-reflect/.test(splashSrc), '1.1.1: the mirrored mark stays retired (the grey shape)');
  });

  ok('1.1.0 the cover stopped being empty — field, veil, corners, reflection, footer', () => {
    assert.match(splashSrc, /gd-splash-field/, 'the dot field mounts');
    assert.match(splashSrc, /gd-splash-veil/, 'the edge veil mounts');
    const corners = splashSrc.match(/gd-splash-corner is-/g) || [];
    assert.equal(corners.length, 4, 'four corner brackets mount');
    assert.match(splashSrc, /RUNS OFFLINE · YOUR ARCHIVE STAYS YOURS/, 'the footer colophon mounts');
    const specks = splashSrc.match(/gd-splash-speck"/g) || [];
    assert.ok(specks.length >= 7, `the drift widened (${specks.length} specks, was 5)`);
    const fieldRule = /\.gd-splash-field\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(fieldRule, /background-size: 26px 26px;/, 'the ledger-paper dot grid');
    assert.match(fieldRule, /mask-image: radial-gradient\(/, 'masked away from the lockup\'s clean center');
    const veilRule = /\.gd-splash-veil\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(veilRule, /radial-gradient\(/, 'the veil darkens the borders');
    /* 1.1.1 — the reflect's rule is retired with the node (the grey shape
       on the glow); the mask law survives in the CSS record for any future
       reflection. */
    assert.ok(!/\.gd-splash-reflect\s*\{/.test(codeCss), '1.1.1: the reflect rule is retired with the node');
    const footRule = /\.gd-splash-foot\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(footRule, /bottom: 30px;/, 'pinned above the bottom edge');
    // the drift + the sweep speak the theme now (the halo's 1.0.7 law)
    const speckRule = /\.gd-splash-speck\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(speckRule, /var\(--gd-accent, #4ade80\)/, 'the specks ride the theme\'s accent');
    const sweepRule = /\.gd-splash-progress-bar\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(sweepRule, /var\(--gd-accent, #4ade80\)/, 'and the progress sweep rides it too');
  });

  // ---- fix 5: one grammar for the tree ----
  ok('1.1.0 the class-row menu speaks class under class, THEN card under class', () => {
    // the branch's header lives in a comment — read the RAW source so it survives
    const rawApp = src('src/App.jsx');
    const clsBranch = /ON A CLASS ROW[\s\S]{0,2400}?askDeleteClassById\(cls\.id\)/.exec(rawApp)?.[0] || '';
    assert.ok(clsBranch, 'the class-row branch found');
    const under = clsBranch.indexOf("label: `New class under");
    const inCls = clsBranch.indexOf("label: `New card in");
    assert.ok(under >= 0 && inCls >= 0, 'both creation keys live in the branch');
    assert.ok(under < inCls, 'NEW CLASS UNDER leads (1.1.0 — the swap)');
    assert.match(clsBranch, /New class under "\$\{name\}"/, 'the class key still targets the clicked class');
    assert.match(clsBranch, /New card in "\$\{name\}"/, 'and the card key still creates inside it');
    // the root row + the tree's empty area keep their class-first order —
    // the whole tree speaks one grammar now
    const treeBranch = /LEFT TREE, EMPTY AREA[\s\S]{0,900}?Redo/.exec(rawApp)?.[0] || '';
    assert.ok(treeBranch.indexOf("label: 'New class'") < treeBranch.indexOf("label: 'New card'"), 'the empty area still leads with New class');
  });
}

// ===========================================================================
// Part B — live DOM checks
// ===========================================================================
{
  const makeApi = (over = {}) => ({
    loadDB: async () => ({
      db: {
        settings: {
          theme: 'burrito', colors: {}, zoom: 2, defaultSortMode: 'custom',
          textures: { workspace: 'none', titlebar: 'none', sidebar: 'none', viewer: 'confetti', panel: 'grid' },
          detailPanel: true, promptBottom: true, tagScale: 1.2, cardRatio: { w: 3, h: 4 },
          autoSwipeImages: true, ...over.settings,
        },
        classes: [{ id: 'cl1', name: 'heroes', parentId: 'root', order: 1 }],
        tags: [], stamps: [],
        characters: [
          {
            id: 'c1', name: 'amy the amber archer of the long autumn woods', classId: 'cl1', tags: [], previewVersionId: null,
            cardRatio: { w: 4, h: 7 }, cardTrim: 'ledger', cardCrop: null, stamps: [],
            stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
            createdAt: Date.now(),
            versions: [
              {
                id: 'v1', label: 'V1', color: '#c8402f', icon: 'letter:A',
                images: [{ file: 'a.png' }, { file: 'b.png' }, { file: 'c.png' }],
                parts: [{ id: 'p1', name: 'body', content: 'soft shading', include: true }],
                notes: 'first pass', createdAt: 1,
              },
            ],
          },
          {
            id: 'c2', name: 'bard', classId: 'cl1', tags: [], previewVersionId: null,
            cardRatio: { w: 3, h: 4 }, cardTrim: 'dash', cardCrop: null, stamps: [],
            stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
            createdAt: Date.now() - 1,
            versions: [
              {
                id: 'v9', label: 'V2', color: '#2563eb', icon: 'letter:B',
                images: [{ file: 'd.png' }], parts: [], notes: '', createdAt: 1,
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
  const boot = async (api) => {
    window.api = api;
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(App));
    await sleep(3400);
    return { host, root };
  };

  await okAsync('1.1.0 the unfold is retired — no plate mounts, cropped or not (live)', async () => {
    // jsdom lays nothing out — make the TITLE (and only the title) lie about
    // its box: scrollWidth 500 against clientWidth 131 = cropped. Under the
    // old law that mounted the plate; under 1.1.4 it must mount NOTHING —
    // the title simply keeps its truncate (the dots) and the hover seats
    // the badge beside it.
    const proto = dom.window.HTMLElement.prototype;
    const elemProto = dom.window.Element.prototype;
    const wasOwnSW = Object.prototype.hasOwnProperty.call(proto, 'scrollWidth');
    const wasOwnCW = Object.prototype.hasOwnProperty.call(proto, 'clientWidth');
    const swDesc = wasOwnSW ? Object.getOwnPropertyDescriptor(proto, 'scrollWidth') : Object.getOwnPropertyDescriptor(elemProto, 'scrollWidth');
    const cwDesc = wasOwnCW ? Object.getOwnPropertyDescriptor(proto, 'clientWidth') : Object.getOwnPropertyDescriptor(elemProto, 'clientWidth');
    Object.defineProperty(proto, 'scrollWidth', {
      configurable: true,
      get() { return this.classList && this.classList.contains('gd-card-title') ? 500 : swDesc.get.call(this); },
    });
    Object.defineProperty(proto, 'clientWidth', {
      configurable: true,
      get() { return this.classList && this.classList.contains('gd-card-title') ? 131 : cwDesc.get.call(this); },
    });
    const restoreProps = () => {
      if (wasOwnSW) Object.defineProperty(proto, 'scrollWidth', swDesc);
      else delete proto.scrollWidth;
      if (wasOwnCW) Object.defineProperty(proto, 'clientWidth', cwDesc);
      else delete proto.clientWidth;
    };
    let host;
    let root;
    try {
      ({ host, root } = await boot(makeApi()));
      const c1 = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
      assert.ok(c1, 'the long-name card mounted');
      assert.ok(!c1.querySelector('.gd-name-unfold'), '1.1.4: a title that measures cropped mounts NO plate — the cropped line keeps its dots');
      const foot = c1.querySelector('.gd-card-foot-vers');
      assert.ok(foot, 'the foot mounted');
      assert.match(foot.className, /has-vers/, 'and carries has-vers (the badge exists)');
      const title = c1.querySelector('.gd-card-title');
      assert.ok(title && /truncate/.test(title.className || ''), 'the resting title still ellipsizes on its own');
      const meta = foot.querySelector(':scope > .gd-card-meta-line');
      assert.ok(meta && (meta.textContent || '').trim(), 'the date keeps its own row under the name');
    } finally {
      restoreProps();
      if (root) root.unmount();
      if (host) host.remove();
    }
    // clean getters -> still no plate anywhere (the law holds both ways)
    const { host: h2, root: r2 } = await boot(makeApi());
    assert.ok(!h2.ownerDocument.querySelector('.gd-name-unfold'), 'no plate ever mounts — the hover is the cropped title + the badge fade');
    r2.unmount();
    h2.remove();
  });

  await okAsync('1.1.0 the output bar\'s chip is the strip chip\'s twin (live)', async () => {
    const { host, root } = await boot(makeApi());
    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    click(card);
    await sleep(400);
    const bar = document.querySelector('.gd-output-bar');
    assert.ok(bar, 'the bar mounted under the open card');
    const chip = bar.querySelector('.gd-chip');
    assert.ok(chip, 'the version chip mounted');
    const cls = chip.className || '';
    assert.ok(/gd-chip-flat/.test(cls), 'still flat (the 1.0.7 law)');
    assert.ok(/gd-out-split/.test(cls), 'still split-seated (the 1.0.9 law)');
    assert.ok(!/!py-0\.5/.test(cls), 'no slimming seat (1.1.0 — the twin law)');
    assert.ok(!/text-\[10px\]/.test(cls), 'no outranked font utility either');
    const face = `${chip.getAttribute('style') || ''} ${chip.style.background || ''}`;
    assert.match(face, /(#c8402f|rgb\(200,\s*64,\s*47\))/i, 'the version\'s own color still faces it');
    const expand = [...bar.querySelectorAll('button')].find((b) => /EXPAND/.test(b.textContent || ''));
    assert.ok(expand, 'the EXPAND key found');
    click(expand);
    await sleep(300);
    const cover = document.querySelector('.gd-output-full');
    assert.ok(cover, 'the expanded cover mounted');
    const coverChip = cover.querySelector('.gd-chip');
    assert.ok(coverChip, 'the cover\'s chip mounted');
    assert.ok(!/!py-0\.5/.test(coverChip.className || ''), 'the cover\'s chip is a twin too');
    root.unmount();
    host.remove();
  });

  await okAsync('1.1.0 the class-row menu orders class under class, then card (live)', async () => {
    const { host, root } = await boot(makeApi());
    const row = host.ownerDocument.querySelector('[data-gd-class-id="cl1"]');
    assert.ok(row, 'the class row mounted');
    row.dispatchEvent(new dom.window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 60, clientY: 60 }));
    await sleep(200);
    const menu = document.querySelector('.gd-ctx-menu');
    assert.ok(menu, 'the context menu painted');
    const labels = [...menu.querySelectorAll('.gd-ctx-item .gd-ctx-label')].map((l) => (l.textContent || '').trim());
    const under = labels.findIndex((l) => /New class under "heroes"/.test(l));
    const inCls = labels.findIndex((l) => /New card in "heroes"/.test(l));
    assert.ok(under >= 0, 'the New class under key rides the menu');
    assert.ok(inCls >= 0, 'the New card in key rides the menu');
    assert.ok(under < inCls, 'class under class comes FIRST (1.1.0 — the swap)');
    const edit = labels.findIndex((l) => /Edit class/.test(l));
    assert.ok(edit > inCls, 'edit still follows the creation keys');
    root.unmount();
    host.remove();
  });

  await okAsync('1.1.0 the splash is born with the light under the mark (live)', async () => {
    window.api = makeApi();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(App));
    await sleep(300); // while the splash still owns the screen
    try {
      const mark = document.querySelector('.gd-splash-mark');
      assert.ok(mark, 'the mark\'s own stage mounted');
      assert.ok(!mark.querySelector('.gd-splash-halo'), '1.1.8: no halo rides the mark (the glow is retired)');
      assert.ok(!mark.querySelector('.gd-splash-reflect'), '1.1.1: the mirrored reflection no longer rides (the grey shape is gone)');
      assert.ok(mark.querySelector('img.splash-logo-animate'), 'and the logo itself');
      assert.equal(document.querySelectorAll('.gd-splash-corner').length, 4, 'four corner brackets frame the cover');
      assert.ok(document.querySelector('.gd-splash-field'), 'the dot field paints');
      assert.ok(document.querySelector('.gd-splash-veil'), 'the edge veil paints');
      const foot = document.querySelector('.gd-splash-foot');
      assert.ok(foot, 'the footer colophon mounted');
      assert.match(foot.textContent || '', /RUNS OFFLINE · YOUR ARCHIVE STAYS YOURS/, 'it speaks the app\'s promise');
      assert.equal(document.querySelectorAll('.gd-splash-speck').length, 7, 'the drift carries its seven specks');
      const tagline = [...document.querySelectorAll('.gd-splash-stack div')].map((d) => d.textContent || '').join(' ');
      assert.match(tagline, /V1\.4\.3/, "the splash speaks the release");
    } finally {
      root.unmount();
      host.remove();
    }
  });
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
