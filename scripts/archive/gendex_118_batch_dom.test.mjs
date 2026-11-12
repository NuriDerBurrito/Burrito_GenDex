// 1.0.8 batch DOM + source checks — the theme's own light, and the bead at
// the end of the ribbon. The eight fixes:
//   · THE GLOW READS THE TOKEN THE THEME WRITES ("the glow doesnt change
//     color based on theme, fix that so its not always green"): 1.0.7 spelled
//     the second accent token WITHOUT its dash (--gd-accent2) while theme.js
//     writes --gd-accent-2 — every accent2 stop silently fell to the green
//     fallback in every theme. Every stop reads the dashed token now: the
//     resting splash + About halos speak the theme pair, the hover drifts
//     through the theme's colors and its white pass.
//   · THE TEXT CUTS BEFORE THE × ("text clips into the x in search container,
//     fix that so it doesnt and cuts before it"): while the clear key is
//     mounted the field wears gd-input-has-x — 26px of right padding that
//     clear the key's whole seat — so the glyphs END before the key.
//   · TWO LINES BELONG TO THE NAME ("tooltips such as pin and expand on
//     details panel expand beyond the tooltip container, fix that so it
//     doesnt clip, when i said only 2 lines i meant the area dedicated to
//     the name of the card or the versions and so on"): the 1.0.7 clamp sat
//     on .gd-tip itself and cut EVERY tooltip at two lines. The clamp moved
//     to a NAME-ONLY seat (data-gd-tip-name anchors paint .is-name); every
//     other tooltip wraps free, 4+ lines welcome.
//   · THE OUTPUT BAR'S CHIP IS THE VERSION'S OWN CONTAINER ("the version
//     container inside the output panel at the bottom is not accurate to the
//     version, it should mimic the version container including the emojie
//     icon selected and color"): the version's own color faces the chip
//     (readableInk picks the polarity) and its chosen glyph rides the label.
//   · THE LEDGER WAITS FOR THE EXPANSION ("0/0 parts and word count and
//     lines should only be shown when the output container expands not when
//     its collapsed"): the stats print on the expanded cover only, and WORDS
//     joins the count.
//   · THE OUTLINE RING READS ON THE SURFACE ("outline text format isnt shown
//     properly, its only visible when selected but when let go its not
//     visible"): the inverse-of-text ring retired (the inverse of the ink IS
//     the ground on high-contrast themes); the ring mixes the accent toward
//     the ink's polarity — visible at rest, still a contour, never weight.
//   · TWO MORE END TRIMS ("one should be like a square but ends as a
//     triangle at the bottom, and the other should be thin but then be a
//     circle at the bottom with the icon inside of it"): POINT (square body,
//     triangular foot) and BEAD (thin stem, round foot carrying the icon).
//   · THE ICON'S TOOLTIP SPEAKS THE VERSION ("when hovering over the top left
//     on the app icon and tooltip appears, include app version in it too"):
//     the wordmark pill reads "Burrito GenDex (vX.Y.Z)".
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
  console.log('jsdom unavailable — 1.0.8 batch DOM test skipped (dev-only dependency)');
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
// Part A — source checks for the 1.0.8 wave
// ===========================================================================
{
  const codeCss = stripComments(css);
  const gridSrc = stripComments(src('src/components/GridView.jsx'));
  const viewSrc = stripComments(src('src/components/CharacterView.jsx'));
  const appSrc = stripComments(src('src/App.jsx'));
  const classSrc = stripComments(src('src/components/ClassSidebar.jsx'));
  const newSrc = stripComments(src('src/components/NewCharacterModal.jsx'));
  const verSrc = stripComments(src('src/components/VersionSettingsModal.jsx'));
  const tipSrc = stripComments(src('src/components/GdTooltips.jsx'));
  const ribbonSrc = stripComments(src('src/components/TagRibbon.jsx'));
  const tagManagerSrc = stripComments(src('src/components/TagManagerModal.jsx'));
  const titleSrc = stripComments(src('src/components/Titlebar.jsx'));
  // theme.js and constants carry regex literals — read them RAW (the pinned
  // lines below appear only as code, never inside comments).
  const themeSrc = src('src/utils/theme.js');
  const constantsSrc = src('src/constants/index.js');

  ok('1.0.8 the version bumped everywhere', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(src('package.json'), /"version": "1\.4\.3"/);
    assert.match(src("README.md"), /v1\.4\.3/);
    assert.match(src('CHANGELOG.md'), /^## 1\.1\.3 /m);
  });

  // ---- fix 1: the glow reads the token the theme writes ----
  ok('1.0.8 the glow reads --gd-accent-2 — the token theme.js actually writes', () => {
    // the always-green bug: every undashed read fell to the #22c55e fallback
    assert.ok(!/var\(--gd-accent2/.test(codeCss), 'no undashed --gd-accent2 read survives in the CSS');
    /* 1.1.8 — the splash halo retired with the glow; the dashed-token law
       keeps governing the About glow (pinned above). */
    assert.ok(!/\.gd-splash-halo\s*\{/.test(codeCss), '1.1.8: the splash halo rule is gone');
    const aboutGlow = /\.about-morph \.halo-glow\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(aboutGlow, /var\(--gd-accent-2, #22c55e\)/, 'the About resting glow reads it too');
    // 1.0.9 — the hover's shift layer retired the accent-2 ladder for the
    // RAINBOW RIDER (chance drives the hover face now — see 117's pins);
    // the dashed-token law keeps governing the RESTING light.
    const shift2 = /\.about-morph \.halo-shift-2\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.ok(!/var\(--gd-accent-2/.test(shift2), 'the hover face no longer walks the fixed accent2 ladder (1.0.9 rainbow rider)');
    assert.match(shift2, /var\(--gd-rainbow-h/, 'it follows the random rainbow hue instead');
    // the writer: theme.js maps the token WITH its dash
    assert.match(themeSrc, /'--gd-accent-2': 'accent2'/, 'theme.js writes --gd-accent-2 (dashed)');
    /* 1.1.8 — the splash halo retired with the glow; the dashed-token law
       keeps governing the About glow (pinned above), and no splash stop
       survives anywhere. */
    assert.ok(!/\.gd-splash-halo\s*\{/.test(codeCss), 'no splash halo rule survives (the glow is retired)');
  });

  // ---- fix 2: the text cuts before the × (evolved 1.0.9: 8px / 29px) ----
  ok('1.0.8 the search text cuts before the × (a real seat while the key rides)', () => {
    assert.match(gridSrc, /search && 'gd-input-has-x'/, 'the field wears the seat only while it carries text');
    const seatRule = /\.gd-input\.gd-input-has-x\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(seatRule, /padding-right: 29px;/, '29px clears the key\'s whole seat at its 1.0.9 offset');
    const keyRule = /\.gd-search-clear\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(keyRule, /right: 8px;/, 'the key keeps its 8px offset off the border (moved slightly left, 1.0.9)');
    assert.match(keyRule, /width: 14px;/, 'and its 14px width');
    assert.ok(!/gd-input-clearable/.test(gridSrc), 'the retired 1.0.6 clearable NAME stays retired');
  });

  // ---- fix 3: two lines belong to the name (evolved 1.0.9: overflow hidden) ----
  ok('1.0.8 the NAME pill clamps at two lines; every other tooltip wraps free', () => {
    const tipRule = /\.gd-tip\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.ok(!/-webkit-line-clamp/.test(tipRule), 'the base pill carries NO clamp (pin/expand never clip again)');
    assert.match(tipRule, /max-width: 280px;/, 'the width stays generous');
    const nameRule = /\.gd-tip\.is-name\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(nameRule, /-webkit-line-clamp: 2;/, 'the is-name pill folds at two lines');
    assert.match(nameRule, /-webkit-box-orient: vertical;/, 'as a proper box fold');
    // 1.0.9 — THE CLAMP'S MISSING COMPANION: without overflow: hidden the
    // clamped-away lines still PAINT below the pill's box. The recipe is
    // whole now — the name pill CONTAINS its text.
    assert.match(nameRule, /overflow: hidden;/, 'and HIDES what it clamps (1.0.9 — the surplus lines stay inside)');
    assert.match(tipSrc, /el\.closest\('\[data-gd-tip-name\]'\)/, 'the anchor resolver reads the name mark');
    assert.match(tipSrc, /tip\.classList\.toggle\('is-name', current\.isName === true\)/, 'paint wears the mark before the measure');
    // the marks ride the name-bearing anchors
    assert.match(viewSrc, /data-gd-tip-name="1"/, 'the version chips are name-marked');
    assert.match(ribbonSrc, /data-gd-tip-name="1"/, 'the tag ribbons are name-marked');
    assert.match(classSrc, /data-gd-tip-name=\{isRoot \? undefined : '1'\}/, 'the class rows are name-marked (non-root)');
    assert.match(appSrc, /data-gd-tip-name="1"/, 'the output bar texts are name-marked');
    assert.match(newSrc, /data-gd-tip-name="1"/, 'the creation preview chip is name-marked');
    assert.match(verSrc, /data-gd-tip-name="1"/, 'the version window preview is name-marked');
  });

  // ---- fix 4: the chip is the version's own container ----
  ok('1.0.8 the output bar chip wears the version\'s own face and glyph', () => {
    assert.match(appSrc, /style=\{version\.color \? \{ background: version\.color, color: readableInk\(version\.color\) \} : undefined\}/, 'the version\'s color faces the chip (readable ink picks the polarity)');
    assert.match(appSrc, /\{version\.icon && <ChipGlyph name=\{version\.icon\} size=\{12\} \/>/, 'the chosen glyph rides the label');
    assert.match(appSrc, /import \{ ChipGlyph \} from '\.\/components\/LucideIconPicker\.jsx';/, 'ChipGlyph is imported for the bar');
    assert.match(appSrc, /readableInk,/, 'readableInk rides the helpers import');
    const faces = appSrc.match(/style=\{version\.color \? \{ background: version\.color, color: readableInk\(version\.color\) \} : undefined\}/g) || [];
    assert.equal(faces.length, 2, 'BOTH seats wear it — the bar and the expanded cover');
  });

  // ---- fix 5: the ledger waits for the expansion ----
  ok('1.0.8 the parts/words/chars/lines ledger prints on the expansion only', () => {
    const ledgers = appSrc.match(/\{stats\.included\}\/\{stats\.total\} PARTS/g) || [];
    assert.equal(ledgers.length, 1, 'the stats line prints ONCE (the expanded cover; the collapsed bar carries none)');
    assert.match(appSrc, /\{stats\.included\}\/\{stats\.total\} PARTS · \{stats\.words\} WORDS · \{stats\.chars\} CHARS · \{stats\.lines\} LINES/, 'and it counts parts, words, chars and lines');
  });

  // ---- fix 6: the outline ring reads on the surface ----
  ok('1.0.8 the outline ring reads on the SURFACE at rest', () => {
    const outlineRule = /\.rt-outline\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    /* 1.1.8 — the inverse is back by request (see the 128 batch): the
       ring is the letter's channel-by-channel inverse. */
    assert.match(outlineRule, /-webkit-text-stroke: 1\.5px rgb\(from currentColor calc\(255 - r\) calc\(255 - g\) calc\(255 - b\)\)/, 'the ring is the letter\'s inverse (1.1.8)');
    /* 1.1.8 — the inverse is BACK by the user's own request ("make the
       text outline color the opposite of the letter"): what 1.0.8 retired
       on visibility grounds, 1.1.8 restores on the user's word — the ring
       is the letter's opposite, period. */
    assert.ok(/rgb\(from currentColor/.test(outlineRule), 'the inverse ring is BACK by request (1.1.8)');
    assert.ok(!/-webkit-text-stroke: 1\.5px currentColor/.test(outlineRule), 'the same-color ring stays retired too');
    assert.match(outlineRule, /paint-order: stroke fill;/, 'the fill stays crisp on top');
    const comboRule = /\.rt-b\.rt-outline\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(comboRule, /-webkit-text-stroke: 2px rgb\(from currentColor calc\(255 - r\) calc\(255 - g\) calc\(255 - b\)\)/, 'bold-under-outline keeps the fatter ring of the same inverse law (1.1.8)');
  });

  // ---- fix 7: two more end trims ----
  ok('1.0.8 POINT and BEAD join the trim family', () => {
    assert.match(constantsSrc, /\{ id: 'point', label: 'Point' \}/, 'POINT is offered');
    assert.match(constantsSrc, /\{ id: 'bead', label: 'Bead' \}/, 'BEAD is offered');
    assert.match(constantsSrc, /\['straight', 'v', 'notch', 'point', 'bead'\]\.includes\(trim\)/, 'makeTag accepts both');
    assert.match(ribbonSrc, /trim === 'point'/, 'the ribbon draws the point cut');
    assert.match(ribbonSrc, /trim === 'bead'/, 'and the bead');
    assert.match(ribbonSrc, /A \$\{beadR\} \$\{beadR\} 0 1 0/, 'the bead\'s foot is a true SVG arc — sweep 0, around the BOTTOM circle (the 1.0.9 flag flip)');
    assert.match(ribbonSrc, /trim === 'bead'\s*\?\s*Math\.max\(2, beadCy - glyphSize \/ 2\)/, 'the bead\'s glyph rides INSIDE the circle — fractional seat, no rounding lean (1.0.9)');
    assert.match(ribbonSrc, /trim === 'point'\s*\?\s*Math\.max\(2, \(OUTLINE_W \/ 2 \+ notchY - glyphSize\) \/ 2\)/, 'the point\'s glyph centers in its square body (1.0.9)');
    assert.match(tagManagerSrc, /trim === 'bead' \? \(/, 'the picker previews the bead');
    assert.match(tagManagerSrc, /borderRadius: '50%'/, 'with a round bead miniature');
    assert.match(tagManagerSrc, /trim === 'point'[\s\S]{0,400}?polygon\(0 0, 100% 0, 100% 55%, 50% 100%, 0 55%\)/, 'and the point polygon miniature');
  });

  // ---- fix 8: the icon's tooltip speaks the version ----
  ok('1.0.8 the app icon\'s tooltip speaks the version', () => {
    assert.match(titleSrc, /title=\{`Burrito GenDex \(v\$\{APP\.version\}\)`\}/, 'the wordmark pill reads the studio name + the build');
    assert.match(titleSrc, /import \{ APP, DEFAULT_SHORTCUTS \} from '\.\.\/constants\/index\.js';/, 'APP rides the constants import');
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
        characters: over.characters === null ? [] : [
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

  await okAsync('1.0.8 the theme writes the dashed token the glow reads (live boot)', async () => {
    const { host, root } = await boot(makeApi());
    const val = document.documentElement.style.getPropertyValue('--gd-accent-2');
    assert.ok(val, '--gd-accent-2 is written on the root element');
    assert.match(val.trim(), /^#[0-9a-fA-F]{6}$/, 'with a real theme color');
    assert.notEqual(val.trim().toLowerCase(), '#22c55e', 'NOT the green fallback — the theme\'s own accent2');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.8 the wordmark tooltip speaks the version (live)', async () => {
    const { host, root } = await boot(makeApi());
    const tab = host.querySelector('.gd-wordmark-tab');
    assert.ok(tab, 'the wordmark tab mounted');
    const tip = tab.getAttribute('title') || tab.dataset.gdTipSrc || '';
    assert.equal(tip, 'Burrito GenDex (v1.4.3)', 'the pill reads the studio name and the build');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.8 the search text cuts before the × (live seat)', async () => {
    const { host, root } = await boot(makeApi());
    const input = host.querySelector('input[placeholder^="Search cards"]');
    assert.ok(input, 'the search field mounted');
    assert.ok(!input.classList.contains('gd-input-has-x'), 'an empty field wears no seat');
    // React's controlled-input law: drive the PROTOTYPE's value setter, or
    // the change tracker never sees the keystroke (the 116 idiom).
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'amy');
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    await sleep(150);
    assert.ok(input.classList.contains('gd-input-has-x'), 'typing gains the seat');
    const x = host.querySelector('.gd-search-clear');
    assert.ok(x, 'and the × key mounts beside the text');
    click(x);
    await sleep(150);
    assert.equal(input.value, '', 'the × emptied the field');
    assert.ok(!input.classList.contains('gd-input-has-x'), 'the seat leaves with the text');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.8 the output bar chip is the version\'s own container (live)', async () => {
    const { host, root } = await boot(makeApi());
    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    click(card);
    await sleep(400);
    const bar = document.querySelector('.gd-output-bar');
    assert.ok(bar, 'the bar mounted under the open card');
    const chip = bar.querySelector('.gd-chip');
    assert.ok(chip, 'the version chip mounted in the bar');
    const face = `${chip.getAttribute('style') || ''} ${chip.style.background || ''}`;
    assert.match(face, /(#c8402f|rgb\(200,\s*64,\s*47\))/i, 'the chip faces the version\'s own color');
    const letter = chip.querySelector('.gd-letter-icon');
    assert.ok(letter, 'the chosen glyph rides the label');
    assert.equal((letter.textContent || '').trim(), 'A', 'it is the letter the version picked');
    assert.ok(!/PARTS/.test(bar.textContent || ''), 'the collapsed bar carries NO parts ledger');
    const expand = [...bar.querySelectorAll('button')].find((b) => /EXPAND/.test(b.textContent || ''));
    assert.ok(expand, 'the EXPAND key found');
    click(expand);
    await sleep(300);
    const cover = document.querySelector('.gd-output-full');
    assert.ok(cover, 'the expanded cover mounted');
    assert.match(cover.textContent || '', /1\/1 PARTS · \d+ WORDS · \d+ CHARS · 1 LINES/, 'the ledger speaks parts, words, chars and lines');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.8 the name-marked pill clamps; instructional pills wrap free (live)', async () => {
    const GdTooltips = require(join(appRoot, 'src/components/GdTooltips.jsx')).default;
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(GdTooltips));
    await flush();
    // a NAME-LABEL anchor: marked, so its pill clamps
    const anchor = document.createElement('div');
    anchor.textContent = 'name';
    anchor.title = 'a very long card name that goes on and on and on';
    anchor.setAttribute('data-gd-tip-name', '1');
    host.appendChild(anchor);
    await flush();
    anchor.dispatchEvent(new dom.window.MouseEvent('pointerover', { bubbles: true, clientX: 40, clientY: 40 }));
    await sleep(420);
    const pill = document.querySelector('.gd-tip');
    assert.ok(pill, 'the pill painted for the marked anchor');
    assert.ok(pill.classList.contains('is-on'), 'and it is showing');
    assert.ok(pill.classList.contains('is-name'), 'the NAME mark paints the is-name pill');
    assert.match(pill.textContent || '', /very long card name/, 'it carries the name');
    // an INSTRUCTIONAL anchor: unmarked, its pill wraps free
    const plain = document.createElement('div');
    plain.textContent = 'pin';
    plain.title = 'Pinned: the rows stay expanded while scrolling. Click to let them fold again on scroll.';
    host.appendChild(plain);
    await flush();
    plain.dispatchEvent(new dom.window.MouseEvent('pointerover', { bubbles: true, clientX: 80, clientY: 80 }));
    await sleep(420);
    assert.ok(pill.classList.contains('is-on'), 'the pill still shows for the plain anchor');
    assert.ok(!pill.classList.contains('is-name'), 'the instructional pill carries NO is-name');
    assert.match(pill.textContent || '', /stay expanded while scrolling/, 'and carries the whole sentence');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.8 POINT and BEAD render as real shapes (live)', async () => {
    const TagRibbon = require(join(appRoot, 'src/components/TagRibbon.jsx')).default;
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(TagRibbon, { tag: { name: 'b', color: '#c8402f', icon: 'letter:B', trim: 'bead' }, scale: 1 }));
    await flush();
    let svg = host.querySelector('svg');
    assert.ok(svg, 'the bead ribbon mounted');
    let d = svg.querySelector('path').getAttribute('d') || '';
    assert.match(d, / A /, 'the bead\'s foot is a true SVG arc');
    let glyph = host.querySelector('.gd-ribbon-glyph');
    assert.ok(glyph, 'the glyph rides the bead');
    assert.equal(glyph.style.top, '18.5px', 'centered INSIDE the bottom circle — beadCy (24.5) minus half the glyph, fractional (1.0.9)');
    root.render(React.createElement(TagRibbon, { tag: { name: 'p', color: '#4a7c59', icon: null, trim: 'point' }, scale: 1 }));
    await flush();
    svg = host.querySelector('svg');
    assert.ok(svg, 'the point ribbon mounted');
    d = svg.querySelector('path').getAttribute('d') || '';
    assert.ok(!/ A /.test(d), 'the point cuts with straight edges only');
    assert.match(d, /L 9\.5 33\.25/, 'and converges to the bottom-center point');
    root.unmount();
    host.remove();
  });
}

// ---------------------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
