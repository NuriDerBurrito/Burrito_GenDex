// 1.1.4 batch DOM + source checks — the update window, the stone-still
// hover, the honest clamps, and the saves that save. The wave:
//   · THE UPDATE WINDOW ("create an update window when the app updates which
//     says that the app got updated from version x to x, pops up after an
//     update"): the boot compares the last-run seat with the running build.
//   · THE SPLASH PULSES IN ONCE ("make the icon start as grey as it pulses
//     in and gets colored, but dont pulse it back out or grey it or darken
//     it again"): the loop is retired; one forwards flight holds the color.
//   · THE CLASS LINE IS GONE ("remove field under class in the card
//     creation, as i said it auto creates in the class opened").
//   · THE STONE-STILL HOVER ("the date gets pushed down and the name gets
//     pushed up, fix that so they dont move" + "it doesnt clip the text
//     after a space" + "do show the 3 dots before clipping the text"): the
//     unfold plate and its broken scrollWidth-seat measure retired; the
//     hover is the cropped title (dots and all) + a badge seated at the
//     title's own line height.
//   · THE RETRACT KEY NEVER LEAVES ("in detail panel, the option to
//     collapse the name dissapears after i expand it, fix that so it
//     doesnt"): nameExpanded arms the key by itself.
//   · THE TAG CHIPS SPEAK THEIR MARKS ("in tags, do add the icon on the
//     left, if possible also do add its shape hanging on the edge of its
//     container, the shape of it should be colored regardless if is
//     selected or not, unlike container which will be colored once
//     selected").
//   · THE COLLAPSES WORK AGAIN ("tags collapse and expand isnt working" /
//     "stamps collapse and expand isnt working either"): the clamp measures
//     relative to the zone and sees through the stamps' wrapper.
//   · THE PILLS RIDE BELOW THE BAR ("the noticfications coming from top to
//     show feedback os cpvering the top pannel, move them lower").
//   · THE STAMPS JOIN THE THUMBNAIL WALK ("lastly, include the stamps
//     images too in the generate thumbnail feature").
//   · THE SAVES SAVE ("fix the save issue where auto save doesnt save and
//     when saving it doesnt save shit actually, it should save settings
//     and everything"): the factory-reset dead-man switch re-arms on the
//     fresh boot; the point/bead trims survive the load.
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
  console.log('jsdom unavailable — 1.1.4 batch DOM test skipped (dev-only dependency)');
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
const tip = (b) => b.getAttribute('title') || '';

// ===========================================================================
// Part A — source checks for the 1.1.4 wave
// ===========================================================================
{
  const codeCss = stripComments(css);
  const appSrc = stripComments(src('src/App.jsx'));
  const mainSrc = stripComments(src('src/main.js'));
  const gridSrc = stripComments(src('src/components/GridView.jsx'));
  const viewSrc = stripComments(src('src/components/CharacterView.jsx'));
  const newCharSrc = stripComments(src('src/components/NewCharacterModal.jsx'));
  const helpersSrc = stripComments(src('src/utils/helpers.js'));

  ok('the version is 1.1.9', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(src('package.json'), /"version": "1\.4\.3"/);
    assert.match(src('README.md'), /\*\*v1\.4\.3\*\*/);
    assert.match(src('CHANGELOG.md'), /^## 1\.1\.5 /m, 'the changelog carries the entry');
  });

  // ---- fix 1: the update window ----
  ok('the update window exists and the boot speaks the crossing', () => {
    const modalSrc = src('src/components/UpdateModal.jsx');
    assert.match(modalSrc, /GENDEX UPDATED/, 'the window\'s title');
    assert.match(modalSrc, /fromVersion/, 'it speaks the FROM version');
    assert.match(modalSrc, /toVersion/, 'it speaks the TO version');
    assert.match(modalSrc, /CONTINUE/, 'the CONTINUE key');
    assert.match(appSrc, /const LAST_RUN_KEY = 'gd:last-run-version';/, 'the last-run seat');
    assert.match(appSrc, /localStorage\.getItem\(LAST_RUN_KEY\)/, 'the boot reads the seat');
    assert.match(appSrc, /last && last !== APP\.version/, 'a remembered DIFFERENT version opens the window');
    assert.match(appSrc, /setUpdateNotice\(\{ from: last, to: APP\.version \}\)/, 'with both versions in hand');
    assert.match(appSrc, /sealUpdateNotice/, 'closing seals the seat');
    assert.match(appSrc, /<UpdateModal fromVersion=\{updateNotice\.from\} toVersion=\{updateNotice\.to\}/, 'the window mounts');
  });

  // ---- fix 2: the splash pulse-in ----
  ok('the splash pulses in once — grey to color, then holds (CSS)', () => {
    const wake = /@keyframes gd-splash-wake\s*\{[^@]*\}/.exec(codeCss)?.[0] || '';
    assert.match(wake, /grayscale\(1\)/, 'born grey');
    assert.match(wake, /grayscale\(0\)/, 'lands colored');
    assert.match(wake, /opacity: 0\.5;/, 'born dim');
    assert.match(wake, /scale\(0\.95\)/, 'born small');
    assert.ok(!/@keyframes gd-splash-pulse/.test(codeCss), 'the looping pulse is retired');
    assert.match(codeCss, /animation: gd-splash-wake 2\.5s ease-out forwards;/, 'one flight, forwards — it holds');
  });

  // ---- fix 3: the class line ----
  ok('the creation window says nothing about classes (the auto-file law)', () => {
    assert.ok(!/FILED UNDER/.test(newCharSrc), 'the read-only line is gone');
    assert.ok(!/filedUnder/.test(newCharSrc), 'its memo is gone');
    assert.match(newCharSrc, /const \[classId\] = useState\(defaultClassId \|\| ROOT_CLASS_ID\)/, 'the card still files into the opened class');
  });

  // ---- fixes 4/5/6: the stone-still hover ----
  ok('the hover is stone-still: cropped title, dots, a badge that moves nothing', () => {
    assert.ok(!/gd-name-unfold/.test(gridSrc), 'the unfold plate is retired');
    assert.ok(!/measureName/.test(gridSrc), 'the broken scrollWidth-seat measure is gone');
    assert.match(gridSrc, /character\.versions\.length > 0 && 'has-vers'/, 'the flip gates on has-vers');
    assert.match(gridSrc, /gd-card-title font-display font-bold leading-tight truncate/, 'the title keeps the one-line crop + dots');
    const hoverFoot = /\.gd-card:hover \.gd-card-foot-vers\.has-vers,\s*\.gd-card-foot-vers\.has-vers:focus-within\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(hoverFoot, /grid-template-columns: minmax\(0, 1fr\) auto;/, 'hover opens the badge track');
    const hoverBadge = /\.gd-card:hover \.gd-card-foot-vers\.has-vers \.gd-card-vers,\s*\.gd-card-foot-vers\.has-vers:focus-within \.gd-card-vers\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(hoverBadge, /position: static;/, 'the badge seats in flow');
    assert.match(hoverBadge, /height: calc\(18\.75px \* var\(--card-scale, 1\)\);/, 'at the title line height — nothing moves');
  });

  // ---- fix 7: the retract key never leaves ----
  ok('the name\'s retract key cannot vanish while the name is expanded', () => {
    assert.match(viewSrc, /\(nameOverflows \|\| nameExpanded\) && \(/, 'the key arms on overflow OR expansion');
  });

  // ---- fix 8: the tag chips' own marks ----
  ok('tag chips carry the icon + the hanging colored shape', () => {
    assert.match(viewSrc, /gd-tag-chip/, 'the details panel chips wear the class');
    assert.match(newCharSrc, /gd-tag-chip/, 'the creation window chips wear it too');
    assert.match(viewSrc, /<TagRibbon tag=\{tag\} scale=\{0\.55\} className="gd-chip-shape" \/>/, 'the miniature ribbon hangs on the chip');
    assert.match(viewSrc, /\{tag\.icon && <ChipGlyph name=\{tag\.icon\} size=\{10\}/, 'the icon rides at the left of the label');
    const shapeRule = /\.gd-chip-shape\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(shapeRule, /position: absolute;/, 'the shape is out of the flow');
    assert.match(shapeRule, /left: -6px;/, 'hanging off the chip\'s left edge');
    assert.match(shapeRule, /pointer-events: none;/, 'it never eats the chip\'s click');
    // the ribbon paints tag.color unconditionally — the chip's container
    // keeps its own selected-only law
    const ribbonSrc = src('src/components/TagRibbon.jsx');
    assert.match(ribbonSrc, /const color = tag\.color \|\| '#888888';/, 'the shape feeds on the tag\'s own color');
    /* 1.3.0 re-law: the chips live in TagsFlowRow now — the selected color
     rides the drag style's spread (the container still colors only when
     selected; the drag transforms layer on top). */
  assert.match(viewSrc, /\.\.\.\(active \? \{ background: tag\.color, color: readableInk\(tag\.color\) \} : null\),/, 'the container colors only when selected');
  });

  // ---- fixes 9/10: the honest clamps ----
  ok('the collapse clamp measures relative to the zone (and through the stamps wrapper)', () => {
    assert.match(viewSrc, /const zoneTop = el\.getBoundingClientRect\(\)\.top;/, 'the zone\'s own rect anchors the measure');
    assert.match(viewSrc, /r\.top - zoneTop/, 'children read relative to the zone — not the sticky header');
    assert.ok(!/k\.offsetTop/.test(viewSrc), 'offsetTop (which answered the positioned ancestor) is gone');
    assert.match(viewSrc, /grandKids/, 'a single wrapper child (.gd-stamp-slots) is descended into');
  });

  // ---- fix 11: the pills ride below the bar ----
  ok('the toast stack seats below the titlebar', () => {
    const stack = /\.gd-toast-stack\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(stack, /top: 56px;/, 'below the 40px bar (+ border + the same 14px breath)');
    assert.match(stack, /z-index: 1100;/, 'still above every window');
  });

  // ---- fix 12: the stamps join the thumbnail walk ----
  ok('1.3.2 the stamps keep their prev seats (the generate WALK is retired with the system)', () => {
    // 1.3.2 — the walk itself is gone (there is no GENERATE key anymore);
    // what survives is the DATA law: the stamp records carry their own prev
    // seats, every reader speaks them, and the library export packs them.
    assert.ok(!/for \(const st of dbRef\.current\.stamps \|\| \[\]\)/.test(appSrc), 'the generate walk is retired');
    assert.match(helpersSrc, /prev: stamp\?\.prev &&/, 'sanitizeLibraryStamp carries the prev seat');
    assert.match(helpersSrc, /\.test\(String\(stamp\.prev\)\) \? String\(stamp\.prev\) : null/, 'a bare filename or null');
    const stampModalSrc = stripComments(src('src/components/StampEditModal.jsx'));
    assert.match(stampModalSrc, /tpl\.prev \|\| tpl\.image/, 'the picker tiles read the preview');
    assert.match(gridSrc, /st\.prev \|\| st\.image/, 'the spotlight tiles read it too');
    assert.match(mainSrc, /for \(const key of \['image', 'prev'\]\)/, 'the library export packs stamp prev files');
  });

  // ---- fix 13: the saves save ----
  ok('the dead-man switch re-arms on the fresh boot', () => {
    assert.match(mainSrc, /ipcMain\.handle\('db:load', \(\) => \{[\s\S]{0,1400}?factoryResetting = false;/, 'db:load clears the switch');
    assert.match(mainSrc, /if \(factoryResetting\) return;/, 'the guard itself stays (the wipe window is real)');
  });
  ok('the point and bead trims survive the load', () => {
    assert.match(helpersSrc, /\['straight', 'v', 'notch', 'point', 'bead'\]\.includes\(t\?\.trim\)/, 'all five seats ride the whitelist');
  });
}

// ===========================================================================
// Part B — live DOM checks
// ===========================================================================
{
  const makeApi = () => ({
    __generate: [],
    loadDB: async () => ({
      db: {
        characters: [
          {
            id: 'c1', name: 'amy the amber archer of the long autumn woods', classId: 'root', tags: ['t1'],
            previewVersionId: null, cardRatio: null, cardTrim: 'dash', cardCrop: null, stamps: [], stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
            createdAt: 1,
            versions: [{ id: 'v1', label: 'V1', color: null, icon: null, images: [], parts: [], notes: '', createdAt: 1 }],
          },
        ],
        classes: [],
        tags: [
          { id: 't1', name: 'blue hair', color: '#4a7dd8', icon: 'Star', trim: 'point' },
          { id: 't2', name: 'cape', color: '#c8402f', icon: null, trim: 'bead' },
        ],
        stamps: [],
        settings: { theme: 'zine' },
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
    saveImageBuffer: async () => ({ ok: true }),
    deleteImageFile: async () => ({ ok: true }),
    generatePreviews: async (list) => {
      const api2 = window.api;
      api2.__generate.push(list);
      return { prevs: {}, generated: 0, skipped: 0, failed: 0 };
    },
    onPreviewProgress: () => () => {},
    erasePreviews: async () => ({ ok: true, erased: 0 }),
    exportLibrary: async () => ({ ok: true }),
    importLibraryPick: async () => null,
    importLibraryCommit: async () => null,
    updatesCheck: async () => ({ ok: true, none: true }),
    factoryReset: async () => ({ ok: true }),
  });
  window.api = makeApi();

  const boot = async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const App = require(join(appRoot, 'src/App.jsx')).default;
    const root = createRoot(host);
    await new Promise((resolve) => {
      root.render(React.createElement(App));
      setTimeout(resolve, 3400);
    });
    return { host, root };
  };

  await okAsync('the update window pops after a crossing (live)', async () => {
    localStorage.setItem('gd:last-run-version', '1.1.3');
    const { host, root } = await boot();
    const doc = host.ownerDocument || document;
    const modal = doc.querySelector('.gd-modal-card');
    assert.ok(modal, 'the window opened');
    assert.match(modal.textContent || '', /GENDEX UPDATED/i, 'it speaks the crossing');
    assert.match(modal.textContent || '', /1\.1\.3/, 'the from version');
    assert.match(modal.textContent || '', /1\.4\.3/, 'the to version');
    const cont = [...modal.querySelectorAll('button')].find((b) => /continue/i.test(b.textContent || ''));
    assert.ok(cont, 'the CONTINUE key');
    click(cont);
    await sleep(300);
    assert.ok(!doc.querySelector('.gd-modal-card'), 'it closed');
    assert.equal(localStorage.getItem('gd:last-run-version'), '1.4.3', 'the seat sealed to the running version');
    root.unmount();
    host.remove();
  });

  await okAsync('a same-version boot stays quiet (live)', async () => {
    localStorage.setItem('gd:last-run-version', '1.4.3');
    const { host, root } = await boot();
    const doc = host.ownerDocument || document;
    assert.ok(!doc.querySelector('.gd-modal-card'), 'no window on a plain relaunch');
    root.unmount();
    host.remove();
    localStorage.removeItem('gd:last-run-version');
  });

  await okAsync('the tag chips carry the icon + the hanging shape (live)', async () => {
    const { host, root } = await boot();
    const doc = host.ownerDocument || document;
    const card = doc.querySelector('[data-gd-char-id="c1"]');
    assert.ok(card, 'the card mounted');
    click(card);
    await sleep(500);
    const chips = [...doc.querySelectorAll('.gd-tag-chip')];
    assert.ok(chips.length >= 2, 'the details panel renders the tag chips');
    const first = chips[0];
    assert.ok(first.querySelector('.gd-chip-shape'), 'the hanging shape rides the chip');
    assert.ok(first.querySelector('.gd-chip-shape svg path'), 'the shape is the ribbon SVG');
    const iconChip = chips.find((c) => c.querySelector('.lucide-star, .gd-letter-icon'));
    assert.ok(iconChip, 'a chip with an icon carries the glyph at the left');
    // the tag manager keeps its own full ribbons — untouched
    root.unmount();
    host.remove();
  });

  await okAsync('the foot carries has-vers and no plate (live)', async () => {
    const { host, root } = await boot();
    const doc = host.ownerDocument || document;
    const card = doc.querySelector('[data-gd-char-id="c1"]');
    const foot = card?.querySelector('.gd-card-foot-vers');
    assert.ok(foot, 'the foot mounted');
    assert.match(foot.className, /has-vers/, 'the badge exists — the flip may arm');
    assert.ok(!foot.classList.contains('has-unfold'), 'no plate gate');
    assert.ok(!foot.querySelector('.gd-name-unfold'), 'no plate mounted');
    const title = foot.querySelector('.gd-card-title');
    assert.ok(title && /truncate/.test(title.className || ''), 'the title ellipsizes on its own');
    root.unmount();
    host.remove();
  });

  await okAsync('1.3.2 nothing walks the library on demand (live)', async () => {
    // 1.3.2 — the GENERATE key is retired with the preview system: the
    // stamps' prev seats build at import through the same automatic pass,
    // and no key ever walks the library again.
    const api = window.api;
    const { host, root } = await boot();
    const doc = host.ownerDocument || document;
    const thumbsKey = [...doc.querySelectorAll('button')].find((b) => /thumbnails/i.test(tip(b) + (b.textContent || '')));
    assert.ok(!thumbsKey, '1.3.2: no thumbnails key exists');
    const calls = api.__generate || [];
    assert.equal(calls.length, 0, 'the generator never runs');
    root.unmount();
    host.remove();
  });
}

console.log(`\n1.1.4 batch: ${passed} passed, ${failed} failed${failed ? ' — FIX BEFORE SHIPPING' : ''}`);
if (failed > 0) process.exit(1);
