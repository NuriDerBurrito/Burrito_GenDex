// 1.0.1 batch DOM + source checks — the rim, the curtain & the wall.
//
//   · THE OPPOSITE RIM ("the tags icon should have a thin outline of
//     opposite color so its better viewed"): the ribbon glyph's ink is
//     picked by the tag color's luminance; the rim is the ink's OPPOSITE,
//     passed down as --gd-glyph-rim and painted by a four-direction
//     drop-shadow chain that traces the glyph's own silhouette.
//   · THE CURTAIN ("the bottom panel, when popping in or out, it should act
//     like the right panel when it deals with background textures, as it
//     exposes it slowly as it retracts or covers slowly as it expands"):
//     the output bar's HEIGHT animates now (0 → auto, the 0.38.0 panel law
//     mirrored vertically) with overflow hidden on the node — no more
//     y-slide under an already-shortened viewer.
//   · THE WALL ("add a thin black outline around the icons on the about so
//     they dont blend in with backgrounds"): the About link wall's brand
//     marks carry a thin black drop-shadow rim around their own silhouettes.
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
  console.log('jsdom unavailable — 1.0.1 batch DOM test skipped (dev-only dependency)');
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
// Part A — source checks for the rim, the curtain & the wall
// ===========================================================================
{
  const APP = require(join(appRoot, 'src/constants/index.js')).APP;
  const ribbonSrc = src('src/components/TagRibbon.jsx');
  const appSrc = src('src/App.jsx');
  const settingsSrc = src('src/components/SettingsModal.jsx');

  ok('1.0.1 the version bumped everywhere', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(src('package.json'), /"version": "1\.4\.3"/);
    assert.match(src('CHANGELOG.md'), /^## 1\.0\.2/m, 'the changelog carries the entry at the top');
    assert.match(src('README.md'), /\*\*v1\.4\.3\*\*/, 'the README shows the release');
  });

  ok('1.0.1 the ribbon glyph computes the OPPOSITE rim', () => {
    assert.ok(/const ink = readableInk\(color\);/.test(ribbonSrc), 'the ink is still luminance-picked');
    assert.ok(
      /const rim = ink === '#f7f1e4' \? 'rgba\(23, 19, 12, 0\.62\)' : 'rgba\(247, 241, 228, 0\.66\)';/.test(ribbonSrc),
      'the rim is the ink\'s opposite (dark rim for light ink, light rim for dark ink)'
    );
    assert.ok(/'--gd-glyph-rim': rim,/.test(ribbonSrc), 'the rim rides down as a CSS custom property');
    assert.ok(/color: ink,/.test(ribbonSrc), 'the glyph still paints with the ink itself');
  });

  ok('1.0.1 the CSS paints the rim as a silhouette trace (dilation since 1.0.3)', () => {
    // 1.1.4 — the rule is line-anchored now: the chip-shape's own
    // `.gd-chip-shape .gd-ribbon-glyph` override (the hanging miniature's
    // glyph-hiding seat) sits earlier in the sheet and would otherwise
    // win the loose match.
    const glyphBlockRaw = /^\.gd-ribbon-glyph \{[\s\S]*?\n\}/m.exec(css)?.[0] || '';
    assert.ok(glyphBlockRaw, 'the glyph rule exists');
    // declarations only — the comments narrate, they don't paint
    const glyphBlock = glyphBlockRaw.replace(/\/\*[\s\S]*?\*\//g, '');
    const shadows = glyphBlock.match(/drop-shadow\(/g) || [];
    assert.ok(shadows.length >= 2, `a stack of dilation passes (got ${shadows.length})`);
    assert.ok(/var\(--gd-glyph-rim, rgba\(0, 0, 0, 0\.55\)\)/.test(glyphBlock), 'every pass reads the rim variable (with a dark fallback)');
    // 1.0.3 — directionless passes only: an offset would lean the rim
    for (const m of glyphBlock.matchAll(/drop-shadow\(([^)]+)\)/g)) {
      const [dx, dy] = m[1].trim().split(/\s+/);
      assert.equal(dx, '0', 'the pass carries no x offset');
      assert.equal(dy, '0', 'the pass carries no y offset');
    }
  });

  ok('1.0.1 the output bar animates HEIGHT, not a y-slide', () => {
    // 1.0.9 — the window widened (the bar's header grew the 50/50 split's
    // wrapper + narration since this pin was written).
    const barBlock = /className="gd-output-bar flex-shrink-0"[\s\S]{0,9600}?<\/motion\.div>/.exec(appSrc)?.[0] || '';
    assert.ok(barBlock, 'the bar node exists');
    // 1.0.7 — the entrance is CONDITIONAL now ("when disabling or enabling
    // the bottom output panel or right detail panel, it should update
    // seemlessly and not retract then repull"): a normal open still enters
    // from zero height; a panel HAND-OFF mounts the bar already open
    // (initial={false}) so it never retracts-and-regrows across the toggle.
    assert.ok(/initial=\{instant \? false : \{ height: 0, opacity: 0\.6 \}\}/.test(barBlock), 'it enters from zero height (except during a hand-off)');
    assert.ok(/animate=\{\{ height: 'auto', opacity: 1 \}\}/.test(barBlock), 'it grows to its natural height');
    assert.ok(/exit=\{\{ height: 0, opacity: 0\.6 \}\}/.test(barBlock), 'it leaves by shrinking back down');
    assert.ok(/transition=\{\{ duration: 0\.22, ease: 'easeOut' \}\}/.test(barBlock), 'it takes the right panel\'s own flight');
    // the y-slide is retired app-wide (no surface ever used it elsewhere)
    assert.ok(!/y: '100%'/.test(appSrc), 'the y-slide is retired');
    const barCss = /\.gd-output-bar \{[\s\S]*?\n\}/.exec(css)?.[0] || '';
    assert.ok(/overflow: hidden;/.test(barCss), 'the node clips so the content reveals under the rising edge');
  });

  ok('1.0.1 the About wall\'s marks carry a thin black rim (dilation since 1.0.3)', () => {
    const icoBlockRaw = /\.gd-about-link-ico img \{[\s\S]*?\n\}/.exec(css)?.[0] || '';
    assert.ok(icoBlockRaw, 'the mark rule exists');
    // declarations only — the comments narrate, they don't paint
    const icoBlock = icoBlockRaw.replace(/\/\*[\s\S]*?\*\//g, '');
    const shadows = icoBlock.match(/drop-shadow\(/g) || [];
    assert.ok(shadows.length >= 2, `a stack of dilation passes (got ${shadows.length})`);
    assert.ok(/rgba\(0, 0, 0, 0\.8\)/.test(icoBlock), 'the rim is black');
    assert.ok(!/border/.test(icoBlock) && !/background/.test(icoBlock), 'no container, no chip — the bare-mark language holds');
    // 1.0.3 — directionless passes only: an offset would lean the rim
    for (const m of icoBlock.matchAll(/drop-shadow\(([^)]+)\)/g)) {
      const [dx, dy] = m[1].trim().split(/\s+/);
      assert.equal(dx, '0', 'the pass carries no x offset');
      assert.equal(dy, '0', 'the pass carries no y offset');
    }
    // the wall itself still renders the brand marks bare (0.33.0 law)
    assert.ok(/gd-about-link-ico/.test(settingsSrc) && /<img src=\{icon\}/.test(settingsSrc), 'the marks still ride bare in the JSX');
  });
}

// ===========================================================================
// Part B — live DOM: the ribbon glyph wears the OPPOSITE rim
// ===========================================================================
{
  const { default: TagRibbon } = require(join(appRoot, 'src/components/TagRibbon.jsx'));
  const { readableInk } = require(join(appRoot, 'src/utils/helpers.js'));

  await okAsync('1.0.1 a dark tag paints a light glyph with a DARK rim, a light tag the opposite', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    // A dark tag (cream ink) and a light tag (dark ink), one lucide mark and
    // one letter mark — both glyph kinds must carry the rim.
    const darkTag = { id: 't1', name: 'shadow', color: '#2b2b2b', icon: 'Star', trim: 'straight' };
    const lightTag = { id: 't2', name: 'bloom', color: '#f5e6c8', icon: 'letter:A', trim: 'straight' };
    root.render(React.createElement('div', null,
      React.createElement(TagRibbon, { tag: darkTag, scale: 1 }),
      React.createElement(TagRibbon, { tag: lightTag, scale: 1 }),
    ));
    await flush();

    const glyphs = [...host.querySelectorAll('.gd-ribbon-glyph')];
    assert.equal(glyphs.length, 2, 'both glyphs mounted');

    const [darkGlyph, lightGlyph] = glyphs;
    // jsdom serializes inline colors to rgb() form — the same ink, parsed.
    assert.equal(readableInk('#2b2b2b'), '#f7f1e4', 'the dark tag picks the cream ink');
    assert.equal(darkGlyph.style.color, 'rgb(247, 241, 228)', 'the dark tag\'s glyph paints it');
    assert.equal(darkGlyph.style.getPropertyValue('--gd-glyph-rim'), 'rgba(23, 19, 12, 0.62)', 'and its rim is the OPPOSITE (dark)');

    assert.equal(readableInk('#f5e6c8'), '#17130c', 'the light tag picks the dark ink');
    assert.equal(lightGlyph.style.color, 'rgb(23, 19, 12)', 'the light tag\'s glyph paints it');
    assert.equal(lightGlyph.style.getPropertyValue('--gd-glyph-rim'), 'rgba(247, 241, 228, 0.66)', 'and its rim is the OPPOSITE (light)');

    assert.ok(darkGlyph.querySelector('svg'), 'the lucide mark rendered as an SVG (the rim traces its strokes)');
    assert.ok(/A/.test(lightGlyph.textContent), 'the letter mark rendered (the rim traces its face)');

    root.unmount();
    host.remove();
  });

  await okAsync('1.0.1 a tag with no icon paints no glyph (the rim rides the glyph only)', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(TagRibbon, { tag: { id: 't3', name: 'plain', color: '#888888', icon: null, trim: 'straight' }, scale: 1 }));
    await flush();
    assert.ok(host.querySelector('.gd-ribbon-shape'), 'the ribbon body painted');
    assert.ok(!host.querySelector('.gd-ribbon-glyph'), 'no glyph, no rim');
    root.unmount();
    host.remove();
  });
}

console.log(`\n1.0.1 batch: ${passed} passed, ${failed} failed${failed ? ' — FIX BEFORE SHIPPING' : ''}`);
process.exit(failed ? 1 : 0);
