// 1.0.4 batch DOM + source checks — light, rows, and the walk that comes back.
//
//   · THE ABOUT MARKS WEAR GODRAYS ("remove the bloom on the two logos ...
//     and instead just add glow/shien and godrays behind them, ensure its
//     not laggy"): bloom retired; halo (rays + glow) per face, behind the
//     marks, compositor-only.
//   · THE DETAILS HEADER FOUND ITS ROWS ("first row will have the back
//     button, the date, and the pin and card settings button, second row
//     will have the name (it can take up to 2 rows, if it exceeds 2 rows
//     it will cut off)").
//   · THE WALK ALWAYS COMES BACK ("entering image manager (or full image
//     preview) mode and closing it would not continue the auto image
//     scroll"): the hover pause heals at tick time — a window clears the
//     session and suppresses the pause until the pointer MOVES again.
//   · THE PANELS RESIZE IN YOUR HAND ("ensure that the panel updates,
//     since currently it only updates after i let go and it would replay
//     the opening animation again"): live content wrapper + a zero-duration
//     beat on the resize commit.
//   · THE SPLASH BECAME A PLACE ("make the splash screen a bit better by
//     including effects maybe and loading feedback"): godrays + halo +
//     drift + sheen + a real progress bar speaking real boot phases.
//
// Requires jsdom (installed dev-only). Skips gracefully without it.
// The stale-hover bug itself is reproduced and verified against REAL
// Chromium pointer semantics by devtools/gendex_114_visual.test.cjs.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch {
  console.log('jsdom unavailable — 1.0.4 batch DOM test skipped (dev-only dependency)');
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
// Part A — source checks for the 1.0.4 wave
// ===========================================================================
{
  const settingsSrc = stripComments(src('src/components/SettingsModal.jsx'));
  const viewSrc = stripComments(src('src/components/CharacterView.jsx'));
  const stageSrc = stripComments(src('src/components/ImageStage.jsx'));
  const resizerSrc = stripComments(src('src/components/PanelResizer.jsx'));
  const appSrc = stripComments(src('src/App.jsx'));
  const splashSrc = stripComments(src('src/components/Splash.jsx'));

  ok('1.0.4 the version bumped everywhere', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(src('package.json'), /"version": "1\.4\.3"/);
    assert.match(src("README.md"), /v1\.4\.3/);
    assert.match(src('CHANGELOG.md'), /^## 1\.0\.6 /m);
  });

  // ---- fix 1: godrays + glow behind BOTH About marks ----
  // 1.0.5 — THE RAYS RETIRED ("i dont like the godrays, remove them from
  // splash screen and about section, and improve the glow"): the assertions
  // now pin the RETIRED state — no rays layer anywhere (JSX or CSS), the
  // glow alone behind both faces, layered deeper, breathing + swelling on
  // compositor properties only.
  ok('1.0.4→1.0.5 the godrays retired; the deepened glow alone sits BEHIND both faces', () => {
    assert.ok(!/bloom-breath|morph-bloom/.test(css), 'no bloom layer survives in the css');
    assert.ok(!/halo-rays/.test(settingsSrc), 'no rays layer in the About JSX');
    assert.ok(!/halo-rays/.test(css), 'no rays rule survives in the css');
    // no conic fan rides the HALO surfaces (theme TEXTURES keep their own)
    const aboutGlowRule = /\.about-morph \.halo-glow\s*\{[^}]*\}/.exec(css)?.[0] || '';
    /* 1.1.8 — the SPLASH halo left with the glow retirement ("remove glow
       from the splash screen"); the About glow keeps its radial law. */
    assert.ok(!/\.gd-splash-halo\s*\{/.test(css), '1.1.8: no splash halo rule survives (the glow is retired)');
    assert.ok(!/conic-gradient/.test(aboutGlowRule), 'no conic fan survives on the About halo');
    assert.match(settingsSrc, /className="morph-halo morph-halo-a"/, 'the resting face halo');
    assert.match(settingsSrc, /className="morph-halo morph-halo-b"/, 'the hover face halo');
    const bBlock = /<div className="morph-halo morph-halo-b" aria-hidden>\s*<div className="halo-glow" \/>/.exec(settingsSrc);
    assert.ok(bBlock, 'the second halo = the glow alone behind the company mark');
    const aBlock = /<div className="morph-halo morph-halo-a" aria-hidden>\s*<div className="halo-glow" \/>/.exec(settingsSrc);
    assert.ok(aBlock, 'the first halo = the glow alone behind the resting mark');
    const glowRule = /\.about-morph \.halo-glow\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.match(glowRule, /radial-gradient/, 'the glow is radial light');
    const glowCount = (glowRule.match(/radial-gradient/g) || []).length;
    assert.ok(glowCount >= 2, 'the glow is LAYERED (core + wide field) since 1.0.5');
    assert.match(glowRule, /mix-blend-mode: screen;/, 'light, not paint');
    /* 1.1.1 — the halo grew slightly ("make the about glow slightly bigger"):
       -62% -> -72%. The 1.0.4 law still holds — wider than its -42%. */
    assert.match(glowRule, /inset: -72%;/, 'it spreads wider than the 1.0.4 glow (-42%)');
    assert.match(glowRule, /gd-halo-breathe 3\.8s ease-in-out infinite/, 'it breathes on the old calm');
    assert.match(glowRule, /gd-halo-swell 7\.6s ease-in-out infinite/, 'it swells on its own slower clock');
    // both faces keep their opposite morph flights
    const bHover = /\.about-morph:hover \.morph-halo-b\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.match(bHover, /transform: rotate\(0deg\) scale\(1\);/, 'B lands on hover');
    assert.match(bHover, /opacity: 1;/, 'B shines on hover');
    const aHover = /\.about-morph:hover \.morph-halo-a\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.match(aHover, /opacity: 0;/, 'A fades out on hover');
  });

  ok('1.0.4→1.0.5 the halo obeys the performance law (opacity breathe, transform swell)', () => {
    const swell = /@keyframes gd-halo-swell\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
    assert.match(swell, /transform: scale\(1\.05\);/, 'the swell is a pure scale');
    assert.ok(!/opacity|filter|width|height|left|top/.test(swell), 'the swell touches nothing but transform');
    const breathe = /@keyframes gd-halo-breathe\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
    assert.ok(!/transform|filter|width|height|left|top/.test(breathe), 'the breathe touches nothing but opacity');
    assert.match(breathe, /opacity: 1;/, 'the breath runs deeper than 1.0.4 (0.9)');
    const haloRule = /\.about-morph \.morph-halo\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.match(haloRule, /transition: transform 0\.7s[^;]*opacity 0\.45s ease;/, 'the wrapper morphs on transform/opacity only');
    assert.match(css, /\.gd-reduced-motion \.about-morph \.halo-glow\s*\{[^}]*animation: none;/, 'reduced motion stills the glow');
  });

  // ---- fix 2: the details header's two rows ----
  ok('1.0.4 the header speaks two rows — controls first, the name below', () => {
    // the controls row: BACK + date + (ml-auto) pin + settings, no wrap
    const controlsRow = /<div className="flex items-center gap-4">\s*<button className="gd-btn flex-shrink-0" onClick=\{onBack\}/.exec(viewSrc);
    assert.ok(controlsRow, 'row 1 = the controls row (BACK first)');
    const dateInRow = /fmtDate\(character\.createdAt\)/.exec(viewSrc);
    assert.ok(dateInRow, 'the date rides row 1');
    assert.match(viewSrc, /ml-auto flex items-center gap-2 flex-shrink-0/, 'pin + card settings ride row 1\'s right edge');
    // 1.0.7 — THE FOLD REPLACED THE CLAMP ("remove the detail panel feature
    // where the card name when hovered over will show fully, instead add a
    // button on top to expand or retract the rest of the name"): row 2 is
    // the measured-height fold wrapper now — two line boxes when retracted,
    // the full name when expanded, tweened (never a hover).
    /* 1.1.1 — the fold gained the twin's relative wrapper above it and the
       clamp companions inside it (the resting dots); the window widens. */
    const nameRow = /<motion\.div\s+className="gd-name-fold"[\s\S]{0,1000}?<RichText text=\{character\.name\}\s*\/>/.exec(viewSrc);
    assert.ok(nameRow, 'row 2 = the name, full width, its own element inside the fold');
    const controlsIdx = viewSrc.indexOf('flex items-center gap-4">');
    const nameIdx = viewSrc.indexOf('gd-name-fold');
    assert.ok(controlsIdx >= 0 && nameIdx > controlsIdx, 'the name row sits BELOW the controls row');
    assert.ok(!/truncate/.test(/<RichText[\s\S]{0,400}?\/>/.exec(viewSrc)?.[0] || ''), 'the old single-line truncate is gone');
    // the fold: a measured two-line target + the wrapper's cut
    // 1.0.9 — the fold target gained its SEAT (the inner element's measured
    // top box — mt-1 was amputating the second line's descenders): two line
    // boxes PLUS the seat now, measured by foldTargetFor.
    // 1.1.9 re-law: the target never reserves a phantom second line — the
    // twin's natural height picks the honest line count (one line when the
    // name fits one, two when it needs them), still PLUS the inner seat.
    // 1.2.9 — the target speaks the clamp's OWN box: the -webkit-line-clamp
    // paints each line a hair taller than the line-height math, so the
    // two-line ceiling takes the clamp's measured client box (remembered in
    // clampedHRef) with the line-box math as its floor — descenders survive.
    assert.match(viewSrc, /const twoBox = Math\.max\(two, clampedHRef\.current \|\| 0\);/, '1.2.9: the two-line ceiling takes the clamp\'s own painted box');
    assert.match(viewSrc, /const body = Math\.max\(one, Math\.min\(Math\.ceil\(Math\.max\(natH \|\| 0, floor\)\) \|\| one, twoBox\)\);/, 'the target takes the twin natural height (the honest line count)');
    assert.match(viewSrc, /fold: Math\.ceil\(body \+ seat\)/, 'the target is the honest lines PLUS the inner seat');
    assert.match(viewSrc, /height: nameExpanded \|\| nameFoldH == null \? 'auto' : nameFoldH/, 'the wrapper animates between the fold and the natural height');
    const foldRule = /\.gd-name-fold\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.match(foldRule, /overflow-wrap: break-word;/, 'the fold keeps long shards wrapping');
    /* 1.1.1 — THE CLAMP IS BACK, WITH A NEW JOB ("the name in details
       pannel still doesnt show the 3 dots when its cropped"): the 1.0.7
       retirement killed the old HOVER-lift clamp; the resting ellipsis is a
       different law entirely — the clamp rides the name only while the fold
       sits retracted-and-settled, lifted by the expand key, re-landed by the
       retract flight (see the 121 suite for the full wiring). */
    const clampRule = /\.gd-name-clamp\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.match(clampRule, /-webkit-line-clamp: 2;/, 'the RESTING clamp paints the dots at two lines (1.1.1)');
    assert.match(clampRule, /overflow: hidden;/, 'with its overflow companion (the 119 law)');
    assert.ok(!/\.gd-name-clamp:hover/.test(css), 'no hover behavior anywhere on the name');
    // tags + stamps rows untouched — still inside the header's fold zone
    assert.match(viewSrc, /ref=\{rowsZoneRef\}/, 'the tag/stamp rows keep their seat');
  });

  // ---- fix 3: the walk that comes back ----
  ok('1.0.4 the auto-swipe pause heals at tick time (no stale hover survives)', () => {
    // the seat listeners
    assert.match(stageSrc, /window\.addEventListener\('pointermove', seat, \{ passive: true \}\)/, 'the pointer seat is tracked (move)');
    assert.match(stageSrc, /window\.addEventListener\('pointerdown', seat, \{ passive: true \}\)/, 'the pointer seat is tracked (down)');
    assert.match(stageSrc, /hoverSuppressedRef\.current = false;/, 'a real pointer event lifts the suppression');
    // the window-open branch clears the session + arms suppression
    const modalBranch = /document\.querySelector\('\[data-gd-modal\], \.gd-ctx-menu'\)\)\s*\{[\s\S]*?hoverRef\.current = false;\s*hoverSuppressedRef\.current = true;\s*return;/.exec(stageSrc);
    assert.ok(modalBranch, 'a window open at tick time clears the hover AND suppresses the pause');
    // the verification
    assert.match(stageSrc, /const hoverIsReal = \(\) => \{/, 'the hover is verified, not trusted');
    assert.match(stageSrc, /document\.elementFromPoint\(p\.x, p\.y\)/, 'verified against the real hit target');
    assert.match(stageSrc, /el\.contains\(hit\)/, 'the hit must land inside the stage');
    // the tick consults both
    assert.match(stageSrc, /if \(!hoverSuppressedRef\.current && hoverIsReal\(\)\) return;/, 'the pause holds only for a REAL hover');
    // the stage root feeds the verification
    assert.match(stageSrc, /ref=\{stageRootRef\}/, 'the stage root is the verification anchor');
  });

  // ---- fix 4: the panels resize in your hand ----
  ok('1.0.4 the resizer drives the CONTENT live and the commit never re-flies', () => {
    assert.match(resizerSrc, /contentRef = null/, 'the resizer takes a contentRef');
    assert.match(resizerSrc, /if \(contentRef\?\.current\) contentRef\.current\.style\.width = `\$\{w\}px`;/, 'the drag writes the content wrapper live');
    const restore = /if \(contentRef\?\.current\) contentRef\.current\.style\.width = `\$\{Math\.round\(drag\.startW\)\}px`;/.exec(resizerSrc);
    assert.ok(restore, 'a no-commit release restores the content wrapper too');
    // App wires it
    assert.match(appSrc, /const panelContentRef = useRef\(null\);/, 'App holds the content ref');
    /* 1.1.8 — the wrapper class grew overflow-x-hidden (the panel stops
       leaking sideways); the ref, the live width and the law it serves are
       untouched. */
    assert.match(appSrc, /ref=\{panelContentRef\}[\s\S]{0,260}?className="h-full overflow-y-auto overflow-x-hidden gd-tex-panel"/, 'the scroll wrapper wears it (plus the 1.1.8 x-seal)');
    assert.match(appSrc, /contentRef=\{panelContentRef\}/, 'the resizer receives it');
    // the snap
    assert.match(appSrc, /const \[panelSnap, setPanelSnap\] = useState\(false\);/, 'the snap flag exists');
    assert.match(appSrc, /setPanelSnap\(true\);\s*setSetting\('panelWidth', w\);/, 'the commit arms the snap');
    const snapTransition = /panelSnap\s*\?\s*\{ width: \{ duration: 0 \}, opacity: \{ duration: 0\.22, ease: 'easeOut' \} \}/.exec(appSrc);
    assert.ok(snapTransition, 'the snap beat lands the width instantly');
    assert.match(appSrc, /if \(panelSnap\) setPanelSnap\(false\);/, 'the flag resets one render later');
  });

  // ---- fix 5: the splash became a place ----
  ok('1.0.4→1.0.5 the splash has weather + real loading feedback', () => {
    assert.match(splashSrc, /className="gd-splash-fx"/, 'the ambient layer exists');
    assert.ok(!/gd-splash-rays/.test(splashSrc), 'the godrays are gone from the launch (1.0.5)');
    assert.ok(!/gd-splash-rays/.test(css), 'no rays rule survives in the css');
    assert.ok(!/gd-splash-halo/.test(splashSrc), '1.1.8: the halo layer is retired (the glow left the launch)');
    assert.match(splashSrc, /gd-splash-tick is-t/, 'the edge ticks frame the cover instead');
    assert.match(splashSrc, /gd-splash-speck/, 'the drifting specks');
    assert.match(splashSrc, /className="gd-splash-stack"/, 'the entrance stack');
    /* 1.1.8 — the wordmark rides a flanked row now (mt-6 moved to the row,
       the sheen class itself is unchanged). */
    assert.match(splashSrc, /className="gd-splash-word-row mt-6"/, 'the wordmark row (1.1.8: flanking rules)');
    assert.match(splashSrc, /className="gd-splash-word font-display/, 'the sheen wordmark itself');
    assert.match(splashSrc, /BURRITO GENDEX/, 'the full name survives');
    assert.match(splashSrc, /className="gd-splash-progress mt-9"/, 'the progress bar');
    assert.match(splashSrc, /className="gd-splash-progress-bar"/, 'the sweeping bar');
    // the real phases
    assert.match(appSrc, /useState\('Loading database'\)/, 'the boot starts honest');
    assert.match(appSrc, /setStatus\('Preparing workspace'\)/, 'the second phase is spoken');
    assert.match(appSrc, /setStatus\('Ready'\)/, 'the last phase lands');
    // the css: each layer moves ONE compositor property
    const sweep = /@keyframes gd-splash-sweep\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
    assert.match(sweep, /transform: translateX/, 'the sweep is a translate');
    const drift = /@keyframes gd-splash-drift\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
    assert.ok(!/filter|box-shadow|width|height|left|top/.test(drift), 'the drift is transform/opacity only');
    const breathe = /@keyframes gd-splash-breathe\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
    assert.ok(!/transform|filter|width|height|left|top/.test(breathe), 'the halo breathes opacity only');
    /* 1.1.8 — the swell keyframes and the halo rule retired with the glow;
       the breathe keyframes SURVIVE (the reduced-motion progress bar rides
       them), still opacity-only. */
    assert.ok(!/@keyframes gd-splash-swell/.test(css), '1.1.8: the swell keyframes retired with the halo');
    assert.ok(!/\.gd-splash-halo\s*\{/.test(css), 'no splash halo rule survives');
    assert.ok(!/transform|filter|width|height|left|top/.test(breathe), 'the surviving breathe touches nothing but opacity');
  });
}

// ===========================================================================
// Part B — live DOM: light, rows, and the walk
// ===========================================================================
{
  const makeApi = (over = {}) => ({
    loadDB: async () => ({
      db: {
        settings: {
          theme: 'zine', colors: {}, zoom: 2, defaultSortMode: 'custom',
          textures: { workspace: 'none', titlebar: 'none', sidebar: 'none', viewer: 'dots', panel: 'none' },
          detailPanel: true, tagScale: 1.2, cardRatio: { w: 3, h: 4 },
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
                id: 'v1', label: 'V1', color: '#c8402f', icon: null,
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
  const pointer = (type, x) => {
    const E = dom.window.PointerEvent || dom.window.MouseEvent;
    return new E(type, { bubbles: true, cancelable: true, clientX: x, clientY: 40, button: 0 });
  };
  const key = (k) => window.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: k, bubbles: true }));
  const currentFile = () => {
    const el = document.querySelector('.gd-stage-peek.is-current img');
    if (!el) return null;
    const m = (el.getAttribute('src') || '').match(/([abc])\.png/);
    return m ? m[1] : null;
  };

  const boot = async (api, { quickSplash = false } = {}) => {
    window.api = api;
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(App));
    if (!quickSplash) {
      const splashAt = () => document.querySelector('.gd-splash-fx');
      return { host, root, splashAt };
    }
    await sleep(3400);
    return { host, root };
  };

  await okAsync('1.0.5 the splash paints its weather and speaks its phases', async () => {
    const { host, root, splashAt } = await boot(makeApi());
    // 800ms in: the splash is up with all its layers
    await sleep(800);
    assert.ok(splashAt(), 'the ambient layer mounted');
    assert.ok(!document.querySelector('.gd-splash-rays'), 'the godrays are gone (1.0.5)');
    assert.ok(!document.querySelector('.gd-splash-halo'), '1.1.8: no halo on the cover (the glow is retired)');
    assert.ok(document.querySelectorAll('.gd-splash-tick').length === 4, 'the four edge ticks frame it instead');
    assert.ok(document.querySelectorAll('.gd-splash-speck').length >= 5, 'the specks drift');
    assert.ok(document.querySelector('.gd-splash-progress-bar'), 'the progress sweeps');
    assert.ok(document.querySelector('.gd-splash-word'), 'the sheen wordmark');
    const splashText = document.querySelector('.gd-splash-fx')?.closest('div')?.parentElement?.textContent || document.body.textContent || '';
    assert.match(splashText, /BURRITO GENDEX/, 'the full name still leads');
    assert.match(splashText, /LOADING DATABASE|PREPARING WORKSPACE/, 'a REAL boot phase is spoken');
    await sleep(3000);
    assert.ok(!document.querySelector('.gd-splash-fx'), 'the splash leaves when the app is ready');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.4 the details header speaks two rows (controls, then the name)', async () => {
    const { host, root } = await boot(makeApi(), { quickSplash: true });
    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    click(card);
    await flush();
    await sleep(300);
    const head = document.querySelector('.gd-char-head');
    assert.ok(head, 'the sticky header mounted');
    const rows = [...head.children].filter((c) => c.tagName === 'DIV' || c.tagName === 'H1');
    // row 1: the controls
    const row1 = head.querySelector('.flex.items-center.gap-4');
    assert.ok(row1, 'the controls row exists');
    const backBtn = [...row1.querySelectorAll('button')].find((b) => /BACK/.test(b.textContent || ''));
    assert.ok(backBtn, 'BACK rides row 1');
    assert.match(row1.textContent || '', /2026/, 'the date rides row 1');
    const pin = row1.querySelector('.gd-pin-btn');
    assert.ok(pin, 'the pin rides row 1');
    assert.ok(row1.querySelector('[data-gd-tip-src], [title]'), 'card settings rides row 1');
    // 1.0.7 — row 2: the name inside its FOLD wrapper (a measured-height
    // motion div), heading role on the title node itself.
    const fold = head.querySelector('.gd-name-fold');
    assert.ok(fold, 'the fold wrapper exists');
    const name = fold.querySelector('[role="heading"]');
    assert.ok(name, 'the name row exists');
    assert.match(name.textContent || '', /amy the amber archer/, 'it carries the full name');
    assert.ok(!row1.contains(fold), 'the name is NOT inside the controls row');
    /* 1.1.1 — the fold rides inside a relative wrapper now (the measurement
       twin's anchor: the name's invisible ruler seats beside it at the
       fold's exact width). The LAW is the seat: whatever child of the header
       carries the fold sits below the controls row. */
    const foldHost = fold.parentElement && fold.parentElement !== head ? fold.parentElement : fold;
    const nameIdx = [...head.children].indexOf(foldHost);
    const row1Idx = [...head.children].indexOf(row1);
    assert.ok(nameIdx > row1Idx, 'the name sits below the controls row');
    // tags + stamps still in the header's fold zone
    assert.ok(head.parentElement?.querySelector('.gd-row-toggle'), 'the tag row keeps its seat');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.4 closing the full image viewer resumes the auto image scroll', async () => {
    const { host, root } = await boot(makeApi(), { quickSplash: true });
    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    click(card);
    await flush();
    await sleep(300);
    assert.ok(document.querySelector('.gd-stage-peek.is-current'), 'the stage rides with its peeks');

    // one honest beat first — the walk walks
    const before = currentFile();
    await sleep(5300);
    const stepped = currentFile();
    assert.notEqual(stepped, before, 'the walk stepped on its own beat');

    // open the huge viewer over the stage — the walk rests
    const pic = document.querySelector('.gd-stage-clickpic') || document.querySelector('.gd-stage-slide');
    click(pic.firstChild || pic);
    await flush();
    await sleep(300);
    assert.ok(document.querySelector('.gd-imgview'), 'the viewer opened');
    const duringOpen = currentFile();
    await sleep(5300); // > one full beat with the window open
    assert.equal(currentFile(), duringOpen, 'the walk rests while the viewer is open');

    // close it — the very next beat steps again (the 1.0.4 heal)
    key('Escape');
    await flush();
    await sleep(300);
    assert.ok(!document.querySelector('.gd-imgview'), 'the viewer closed');
    const afterClose = currentFile();
    await sleep(5300);
    assert.notEqual(currentFile(), afterClose, 'the walk RESUMED after the close');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.4 dragging the panel handle drives the CONTENT live and commits without a re-flight', async () => {
    // 1.1.5 — the panel's drag ceiling is ROOM-AWARE now (it never commits a
    // width the window cannot fit beside the tree); jsdom's default 1024px
    // viewport leaves no room to widen, so this check rides a wide window.
    Object.defineProperty(window, 'innerWidth', { value: 1600, configurable: true });
    const { host, root } = await boot(makeApi(), { quickSplash: true });
    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    click(card);
    await flush();
    await sleep(300);
    const handle = document.querySelector('.gd-panel-resize[data-side="right"]');
    assert.ok(handle, 'the right handle mounted');
    const content = document.querySelector('[data-gd-region="panel"] > div');
    assert.ok(content, 'the panel content wrapper mounted');
    const startW = parseFloat(content.style.width) || 0;
    assert.ok(startW > 0, 'the wrapper starts at the React width');

    // drag left 60px (side=right: widening)
    handle.dispatchEvent(pointer('pointerdown', 1100));
    handle.dispatchEvent(pointer('pointermove', 1070));
    await sleep(20);
    const midW = parseFloat(content.style.width) || 0;
    assert.ok(midW > startW, `the CONTENT width follows the drag LIVE (${startW} -> ${midW})`);
    handle.dispatchEvent(pointer('pointermove', 1040));
    await sleep(20);
    const endW = parseFloat(content.style.width) || 0;
    assert.ok(endW > midW, 'and keeps following');
    handle.dispatchEvent(pointer('pointerup', 1040));
    await sleep(200);
    // the commit landed and the wrapper stayed at the dragged width (no snap-back, no flight)
    const committed = parseFloat(content.style.width) || 0;
    assert.equal(committed, endW, 'the committed width is exactly the dragged one');
    root.unmount();
    host.remove();
  });
}

process.exit(failed ? 1 : 0);
