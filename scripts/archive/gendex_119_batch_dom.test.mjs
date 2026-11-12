// 1.0.9 batch DOM + source checks — the bead finds its circle, and the light
// learns chance. The eight fixes:
//   · THE BEAD'S SWEEP FLAG ("the bead is wrong, the circle is on top and is
//     cut through the middle by a rectangle, and the point tag emojie is
//     slightly offsetted"): the arc read large-arc=1 sweep=1, which picks the
//     circle whose center sits ABOVE the meet-chord — the bead rendered at
//     the ribbon's TOP, the stem punching through its middle, the glyph
//     floating below the mess. sweep=0 picks the center below the chord: the
//     arc travels the long way around the BOTTOM. The bead's glyph keeps a
//     fractional seat (no rounding lean), and the point's glyph centers in
//     its square body.
//   · THE × MOVED LEFT ("move the search x slightly to the left"): 8px off
//     the border (was 5), and the has-x seat grew with it (29px).
//   · THE SELECTED CARD SPEAKS ("add feedback to the card selected, like
//     have some effect or something on it to show that its selected"): the
//     card open in the detail panel wears a 2px accent OUTLINE (composes
//     with every theme's hover shadow) + a tiny OPEN tab on the art.
//   · TOOLTIPS CONTAIN THEIR TEXT ("ensure tooltips contain text properly
//     inside of it"): the name clamp gains its missing companion —
//     overflow: hidden. Without it the clamped-away lines still PAINT below
//     the pill's box.
//   · THE 50/50 SPLIT ("the space below in the output panel to show the name
//     of the card and the version name should be divided, 50% for the card,
//     50% for the tag, if one of them takes the space but some space is left
//     empty, let the other occupy the rest"): name + chip sit in a wrapper
//     owning the row's leftover width; each wears gd-out-split (grow from
//     zero, cap at content) — equal halves when both are long, the unused
//     room of a short one flows to the other.
//   · THE FOLD'S SEAT ("when the name is collapsed in the detail panel, it
//     clips at the bottom"): the fold target now adds the inner element's
//     measured top box (mt-1 = 4px was amputating the second line's
//     descenders).
//   · THE SPLASH IS BORN IN THE THEME ("in splash screen, the color of the
//     glow sometimes would update from a theme to another, ensure that it
//     appears with the right one right away"): setThemeOnDocument persists a
//     snapshot; renderer.js replays it BEFORE the first React paint.
//   · THE ABOUT HOVER WALKS THE RAINBOW ("when hovering over the icon in the
//     about section, it should shift the glow color between colors randomly,
//     like all the rainbow colors including white"): a random hue every
//     1.6s (one pick in five is a white pass), gliding on the registered
//     --gd-rainbow-h transition.
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
  console.log('jsdom unavailable — 1.0.9 batch DOM test skipped (dev-only dependency)');
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
// 1.0.9 — the theme snapshot needs a REAL localStorage to land in (Node has
// none by default; theme.js guards with typeof, so this only lights up for
// the live snapshot checks below).
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
// Part A — source checks for the 1.0.9 wave
// ===========================================================================
{
  const codeCss = stripComments(css);
  const gridSrc = stripComments(src('src/components/GridView.jsx'));
  const appSrc = stripComments(src('src/App.jsx'));
  const viewSrc = stripComments(src('src/components/CharacterView.jsx'));
  const ribbonSrc = stripComments(src('src/components/TagRibbon.jsx'));
  const settingsSrc = stripComments(src('src/components/SettingsModal.jsx'));
  const rendererSrc = src('src/renderer.js');
  // theme.js carries regex literals — read it RAW (the pinned lines appear
  // only as code, never inside comments).
  const themeSrc = src('src/utils/theme.js');

  ok('1.0.9 the version bumped everywhere', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(src('package.json'), /"version": "1\.4\.3"/);
    assert.match(src('README.md'), /v1\.4\.3/);
    assert.match(src('CHANGELOG.md'), /^## 1\.1\.3 /m);
  });

  // ---- fix 1: the bead's sweep flag + the glyph seats ----
  ok('1.0.9 the bead arc sweeps around the BOTTOM circle; both glyph seats tightened', () => {
    assert.match(ribbonSrc, /A \$\{beadR\} \$\{beadR\} 0 1 0/, 'the arc reads large-arc=1 sweep=0 — the center below the meet-chord');
    assert.ok(!/A \$\{beadR\} \$\{beadR\} 0 1 1/.test(ribbonSrc), 'the backwards sweep=1 (circle on TOP, stem punching through) is gone');
    assert.match(ribbonSrc, /trim === 'bead'\s*\?\s*Math\.max\(2, beadCy - glyphSize \/ 2\)/, 'the bead glyph seats on the circle center, fractionally (no Math.round lean)');
    assert.match(ribbonSrc, /trim === 'point'\s*\?\s*Math\.max\(2, \(OUTLINE_W \/ 2 \+ notchY - glyphSize\) \/ 2\)/, 'the point glyph centers in its square body');
  });

  // ---- fix 2: the × moved left ----
  ok('1.0.9 the search × rides at 8px and the seat grew with it', () => {
    const keyRule = /\.gd-search-clear\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(keyRule, /right: 8px;/, 'the key sits 8px off the border (was 5px)');
    const seatRule = /\.gd-input\.gd-input-has-x\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(seatRule, /padding-right: 29px;/, 'the text seat clears 8px + 14px + spare');
  });

  // ---- fix 3: the selected card speaks ----
  ok('1.0.9/1.1.0 the selected card wears the accent ring — and no second voice', () => {
    assert.match(appSrc, /selectedId=\{panelCharacterId\}/, 'App passes the panel character down to the grid');
    assert.match(gridSrc, /selectedId = null,/, 'GridView accepts the selected id');
    assert.match(gridSrc, /selected=\{selectedId === character\.id\}/, 'the card computes its own selection');
    assert.match(gridSrc, /selected && 'gd-card-selected'/, 'the selected card wears the class');
    // 1.5.4 — the ring moved to a ::after pseudo seated UNDER the ribbons
    // ("the outline of the card is marking above the tags"): same 2px accent
    // band, same 1px offset, new seat.
    const ringRule = /\.gd-card-selected::after\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(ringRule, /border: 2px solid var\(--gd-accent\);/, 'an accent ring — composes with every theme hover shadow');
    assert.match(ringRule, /inset: -3px;/, 'one pixel off the border (a -3px inset box with a 2px band)');
    assert.match(ringRule, /z-index: 4;/, 'below the ribbons (z 5) — the tags paint over the ring');
    // 1.1.0 — THE TAB IS RETIRED ("remove the open label at the top right of
    // the card, the outline should be enough"): the ring alone speaks.
    assert.ok(!/gd-card-open-tab/.test(gridSrc), 'the OPEN tab is gone from the card (1.1.0)');
    assert.ok(!/\.gd-card-open-tab\s*\{/.test(codeCss), 'and its CSS went with it');
  });

  // ---- fix 4: tooltips contain their text ----
  ok('1.0.9 the name pill HIDES what it clamps', () => {
    const nameRule = /\.gd-tip\.is-name\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(nameRule, /-webkit-line-clamp: 2;/, 'the two-line clamp stays');
    assert.match(nameRule, /overflow: hidden;/, 'and its missing companion joined — the clamped lines can no longer paint below the pill');
  });

  // ---- fix 5: the 50/50 split ----
  ok('1.0.9 the output bar texts split the space — halves, and the unused room', () => {
    const splitRule = /\.gd-out-split\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(splitRule, /flex: 1 1 0;/, 'grow from zero (equal halves when both are long)');
    assert.match(splitRule, /min-width: 0;/, 'shrink freely');
    assert.match(splitRule, /max-width: max-content;/, 'cap at content (a short one hands its room to the other)');
    const wrappers = appSrc.match(/className="flex-1 min-w-0 flex items-center gap-3"/g) || [];
    assert.equal(wrappers.length, 2, 'BOTH headers carry the wrapper (the bar and the expanded cover)');
    const seats = appSrc.match(/gd-out-split/g) || [];
    assert.equal(seats.length, 4, 'the name + the chip wear the split in both headers');
    assert.ok(!/truncate min-w-0"/.test(appSrc), 'the old bare min-w-0 seat is retired on these spans');
  });

  // ---- fix 6: the fold's seat ----
  ok('1.0.9 the name fold measures the seat under the text', () => {
    assert.match(viewSrc, /const foldTargetFor = \(el, natH = 0\) => \{/, '1.1.9: the fold target has its own measurer (reading the twin\'s natural height)');
    assert.match(viewSrc, /parseFloat\(cs\.marginTop\)/, 'the inner margin counts (mt-1 was amputating the descenders)');
    assert.match(viewSrc, /parseFloat\(cs\.paddingTop\)/, 'padding counts');
    assert.match(viewSrc, /parseFloat\(cs\.borderTopWidth\)/, 'border counts');
    assert.match(viewSrc, /fold: Math\.ceil\(body \+ seat\)/, '1.1.9: the target = the honest line boxes + the seat');
    assert.match(viewSrc, /const \{ lh, fold \} = foldTargetFor\(el, probe\.offsetHeight\)/, 'the layout measure seats through it, reading the twin (1.1.9)');
    /* 1.1.1 — the resize watcher moved to the MEASUREMENT TWIN (a clamped
       name only ever measures two lines; the twin answers honestly). It
       still seats the fold target through foldTargetFor on the REAL
       element, and probes the twin's natural height.
       1.1.2 — the watcher's body became nameSignals() (the two-signal
       arming: twinSays OR the clamp's own cut) — it still seats the fold
       target through foldTargetFor and reads the twin's height inside. */
    assert.match(viewSrc, /const s = nameSignals\(\);\s*\n\s*if \(!s\) return;\s*\n\s*setNameFoldH\(s\.fold\);\s*\n\s*setNameOverflows\(s\.twinSays \|\| s\.clampCuts\)/, 'the resize watcher seats through the signals law');
  });

  // ---- fix 7: the theme arrives before the first paint ----
  ok('1.0.9 the theme snapshot lands before React mounts', () => {
    assert.match(themeSrc, /localStorage\.setItem\(\s*'gdThemeSnapshot',/, 'setThemeOnDocument persists the snapshot');
    assert.match(themeSrc, /localStorage\.getItem\('gdThemeSnapshot'\)/, 'the restore reads it back');
    assert.match(themeSrc, /export function restoreThemeSnapshot\(\) \{/, 'the restore is exported');
    assert.match(rendererSrc, /import \{ restoreThemeSnapshot \} from '\.\/utils\/theme\.js';/, 'renderer.js imports it');
    const callAt = rendererSrc.indexOf('restoreThemeSnapshot();');
    const mountAt = rendererSrc.indexOf('createRoot(');
    assert.ok(callAt >= 0 && mountAt >= 0 && callAt < mountAt, 'the replay runs BEFORE createRoot — the splash is born in the theme');
  });

  // ---- fix 8: the About hover walks the rainbow ----
  ok('1.0.9 the About hover walks a random rainbow (117 pins the CSS law; here the wiring)', () => {
    assert.match(css, /@property --gd-rainbow-h\s*\{[^}]*\}/, 'the hue is a registered property');
    assert.match(settingsSrc, /onMouseEnter=\{startRainbow\}/, 'entering the mark starts the walk');
    assert.match(settingsSrc, /onMouseLeave=\{stopRainbow\}/, 'leaving stops it');
    assert.match(settingsSrc, /Math\.floor\(Math\.random\(\) \* 360\)/, 'the picks are random hues across the wheel');
    assert.match(settingsSrc, /Math\.random\(\) < 0\.2/, 'one pick in five is the white pass');
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
            id: 'c2', name: 'brave bard of the bitter coast', classId: 'cl1', tags: [], previewVersionId: null,
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

  await okAsync('1.0.9 the bead renders its circle at the BOTTOM (live geometry)', async () => {
    const TagRibbon = require(join(appRoot, 'src/components/TagRibbon.jsx')).default;
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(TagRibbon, { tag: { name: 'b', color: '#c8402f', icon: 'letter:B', trim: 'bead' }, scale: 1 }));
    await flush();
    const svg = host.querySelector('svg');
    assert.ok(svg, 'the bead ribbon mounted');
    const d = svg.querySelector('path').getAttribute('d') || '';
    // the arc: A rx ry rot large sweep x y — start from the L right before it
    const arc = /A ([\d.]+) ([\d.]+) (\d+) (\d+) (\d+) ([\d.]+) ([\d.]+)/.exec(d);
    assert.ok(arc, 'the bead carries a true SVG arc');
    assert.equal(arc[4], '1', 'large-arc — the long way round');
    assert.equal(arc[5], '0', 'sweep 0 — the center BELOW the meet-chord (the 1.0.9 flag flip)');
    const lead = /L ([\d.]+) ([\d.]+) A /.exec(d);
    assert.ok(lead, 'the stem runs down to the arc');
    const x1 = +lead[1], y1 = +lead[2], x2 = +arc[6], y2 = +arc[7], r = +arc[1];
    assert.ok(Math.abs(y1 - y2) < 1e-9, 'the meet-chord is horizontal');
    const half = Math.abs(x2 - x1) / 2;
    const dy = Math.sqrt(r * r - half * half);
    const cyBelow = y1 + dy; // the center sweep=0 + large=1 actually selects
    const bottom = cyBelow + r;
    assert.ok(Math.abs(bottom - 33.25) < 0.01, `the arc bottoms at the ribbon's foot (h - stroke/2 = 33.25, got ${bottom.toFixed(2)}) — the circle is at the BOTTOM, not cut through the top`);
    const glyph = host.querySelector('.gd-ribbon-glyph');
    assert.ok(glyph, 'the glyph rides the bead');
    assert.equal(glyph.style.top, '18.5px', 'fractional seat on the circle center (24.5 - 6)');
    // the point's glyph centers in its square body
    root.render(React.createElement(TagRibbon, { tag: { name: 'p', color: '#4a7c59', icon: 'letter:P', trim: 'point' }, scale: 1 }));
    await flush();
    const pg = host.querySelector('.gd-ribbon-glyph');
    assert.ok(pg, 'the point ribbon carries its glyph');
    assert.equal(pg.style.top, '5.375px', 'the point glyph centers in the square body ((0.75 + 22 - 12) / 2)');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.9/1.1.0 the selected card wears the ring — alone (live)', async () => {
    const { host, root } = await boot(makeApi());
    const c1 = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    const c2 = host.ownerDocument.querySelector('[data-gd-char-id="c2"]');
    assert.ok(c1 && c2, 'both cards mounted');
    assert.ok(!c1.classList.contains('gd-card-selected'), 'nothing is selected before a click');
    click(c1);
    await sleep(400);
    // the panel opening re-flows the grid — re-query rather than trust the
    // pre-click node reference
    const c1Now = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    const c2Now = host.ownerDocument.querySelector('[data-gd-char-id="c2"]');
    assert.ok(c1Now, 'the card still rides the grid after opening');
    assert.ok(c1Now.classList.contains('gd-card-selected'), 'the opened card wears the selection class');
    // 1.1.0 — the OPEN tab retired: the outline is the only voice
    assert.ok(!c1Now.querySelector('.gd-card-open-tab'), 'no OPEN tab on the selected card (1.1.0 — the outline is enough)');
    assert.ok(!c2Now.classList.contains('gd-card-selected'), 'the neighbor stays clean');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.9 the output bar splits the name/version space (live classes)', async () => {
    const { host, root } = await boot(makeApi());
    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    click(card);
    await sleep(400);
    const bar = document.querySelector('.gd-output-bar');
    assert.ok(bar, 'the bar mounted under the open card');
    const seats = bar.querySelectorAll('.gd-out-split');
    assert.equal(seats.length, 2, 'the name and the chip both wear the split seat');
    const wrapper = seats[0].parentElement;
    assert.ok(wrapper && /flex-1/.test(wrapper.className || ''), 'they sit inside the leftover-width wrapper');
    const chip = bar.querySelector('.gd-chip');
    assert.ok(chip && /gd-out-split/.test(chip.className || ''), 'the version chip is one of the split seats');
    const expand = [...bar.querySelectorAll('button')].find((b) => /EXPAND/.test(b.textContent || ''));
    assert.ok(expand, 'the EXPAND key found');
    click(expand);
    await sleep(300);
    const cover = document.querySelector('.gd-output-full');
    assert.ok(cover, 'the expanded cover mounted');
    assert.equal(cover.querySelectorAll('.gd-out-split').length, 2, 'the cover\'s header speaks the same split law');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.9 the theme snapshot restores before paint (live)', async () => {
    const { host, root } = await boot(makeApi());
    // the boot's own theme apply persisted the snapshot
    const raw = global.localStorage.getItem('gdThemeSnapshot');
    assert.ok(raw, 'the boot wrote the snapshot');
    const snap = JSON.parse(raw);
    assert.equal(snap.id, 'burrito', 'it carries the boot theme');
    assert.ok(snap.colors && /^#[0-9a-fA-F]{6}$/.test(String(snap.colors.accent)), 'with resolved colors');
    // wipe a token off the root, then replay the snapshot
    document.documentElement.style.removeProperty('--gd-accent-2');
    assert.equal(document.documentElement.style.getPropertyValue('--gd-accent-2'), '', 'the token is gone');
    const { restoreThemeSnapshot } = require(join(appRoot, 'src/utils/theme.js'));
    const restored = restoreThemeSnapshot();
    assert.equal(restored, true, 'the restore reports success');
    const val = document.documentElement.style.getPropertyValue('--gd-accent-2');
    assert.match(val.trim(), /^#[0-9a-fA-F]{6}$/, 'the token is back on the root — the splash would paint it from frame one');
    assert.equal(document.documentElement.dataset.theme, 'burrito', 'the theme attribute restored too');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.9 the About mark walks a random rainbow while hovered (live)', async () => {
    const SettingsModal = require(join(appRoot, 'src/components/SettingsModal.jsx')).default;
    const settings = {
      theme: 'zine', colors: {}, zoom: 2, defaultSortMode: 'custom',
      textures: { workspace: 'none', titlebar: 'none', sidebar: 'none', viewer: 'dots', panel: 'none' },
      detailPanel: true, tagScale: 1.2, cardRatio: { w: 3, h: 4 },
      promptBottom: true, advancedSearch: false, showHelpText: false,
    };
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(SettingsModal, {
      settings, initial: settings, onClose: () => {}, onChange: () => {}, onRevert: () => {}, initialTab: 'About',
    }));
    await sleep(300);
    // the modal renders through a PORTAL onto document.body — query the
    // document, not the host
    const mark = document.querySelector('.about-morph');
    assert.ok(mark, 'the About mark mounted');
    // entering the mark rolls the first random pick
    mark.dispatchEvent(new dom.window.MouseEvent('mouseover', { bubbles: true }));
    await sleep(80);
    const h1 = mark.style.getPropertyValue('--gd-rainbow-h');
    const w1 = mark.style.getPropertyValue('--gd-rainbow-w');
    assert.match(h1.trim(), /^\d+$/, 'a hue landed on the mark');
    assert.ok(Number(h1) < 360, 'within the wheel');
    assert.ok(w1 === '0' || w1 === '1', 'the white-pass flag is armed (0 or 1)');
    // while the pointer rests, the walk continues — consecutive picks differ
    await sleep(1700);
    const h2 = mark.style.getPropertyValue('--gd-rainbow-h');
    assert.ok(h2.trim() !== '' && h2 !== h1, `a fresh pick arrived (${h1} -> ${h2}) — the rainbow walks`);
    // leaving stops the walk: no further picks
    mark.dispatchEvent(new dom.window.MouseEvent('mouseout', { bubbles: true }));
    await sleep(1700);
    const h3 = mark.style.getPropertyValue('--gd-rainbow-h');
    assert.equal(h3, h2, 'the walk stopped on leave — the hue holds');
    root.unmount();
    host.remove();
  });
}

// ---------------------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
