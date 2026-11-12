// 0.44.0 batch DOM + source checks — the fourth fix wave.
//
//   · THE FLYING MARKS — the sort engine fires a pre-commit checkpoint
//     (gd-mark-check) and strips the stale settle transform BEFORE the
//     flushSync; useFlipMark spawns a fixed-position CLONE at body level
//     (z 945 — above every tile) that flies from the last visual seat to
//     the new one, then dies and the welded mark takes over (sticks to the
//     window, never drifts).
//   · THE CREATION PREVIEW'S WHEEL — the whole preview CARD is the zoom
//     surface (listener on the live node, re-bound through the lazy
//     portals) and an echo guard keeps the compounding base from being
//     rewound by late renders.
//   · The card name crops ONLY while hovered (one-track resting grid, the
//     badge seated on hover — the date row untouched).
//   · Bold reads (faux-black stroke past the 700 family ceiling) and keeps
//     its voice under the outline (fatter ring).
//   · The tag / stamp folds survive panel close/reopen (per-character
//     module memory).
//   · Right-click on the card settings does NOTHING (the fixed-in-a-
//     transformed-header menu is gone); button menus carry just the
//     actions (Undo / Redo), never "press that button".
//   · The settings FONT row: three base faces + the IMPORT key that lights
//     as the picked option, with the imported name captioned below.
//   · The filters' enable square (accent ring around the stamp, same as
//     the disable red one).
//   · The version drop pop is gone (chip lift + pencil held off through
//     the drag and the settle).
//   · Every window ~7% wider for the serif face.
//
// Requires jsdom (installed dev-only). Skips gracefully without it.
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch {
  console.log('jsdom unavailable — 0.44.0 batch DOM test skipped (dev-only dependency)');
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
const mount = async (Comp, props) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(React.createElement(Comp, props));
  await flush();
  return { host, root };
};

// ===========================================================================
// Part A — source checks for the eleven fixes
// ===========================================================================
{
  const sortSrc = src('src/components/useThumbSort.js');
  const editorSrc = src('src/components/CardLookEditor.jsx');
  const appSrc = src('src/App.jsx');
  const viewSrc = src('src/components/CharacterView.jsx');
  const settingsSrc = src('src/components/SettingsModal.jsx');
  const modalSrc = src('src/components/Modal.jsx');

  ok('0.44.0 (0.45 amended) the release HOLD replaces the mark checkpoint', () => {
    // 0.45.0 — the gd-mark-check flight machinery is retired with the
    // flight itself; the commit now writes the RELEASE HOLD on the dropped
    // item (hover motions stay quiet until the pointer genuinely leaves).
    assert.ok(!/gd-mark-check/.test(sortSrc), 'the mark checkpoint is gone');
    assert.ok(/classList\.add\('gd-just-dropped'\)/.test(sortSrc) && /const held = \[el\];/.test(sortSrc), 'the dropped item takes the hold (1.0.0: as the head of the held set)');
    assert.ok(/document\.addEventListener\('pointerover', dropClear, true\);/.test(sortSrc), 'cleared by capture-phase pointer listeners');
    assert.ok(/h\.isConnected && h\.contains\(target\)\) return;/.test(sortSrc.replace(/\s+/g, ' ')), 'the hold rides while the pointer stays on any held item (1.0.0)');
    const hold = sortSrc.indexOf("for (const h of held) h.classList.add('gd-just-dropped');");
    const arm = sortSrc.indexOf("document.addEventListener('pointerover', dropClear, true);");
    assert.ok(hold > -1 && arm > -1 && arm > hold, 'the listeners are armed with the hold');
  });

  ok('0.44.0 the stale settle transform dies BEFORE the commit measures', () => {
    const strip = sortSrc.indexOf('// the stale settle transform must not be read as geometry');
    const fs = sortSrc.indexOf('flushSync(() => {');
    assert.ok(strip > -1 && strip < fs, 'the strip precedes the flushSync');
    assert.ok(!/const strip = \(\) => \{/.test(sortSrc), 'the after-the-fact strip helper is retired');
  });

  ok('0.44.0 (0.45 amended) the marks POP — the flight layer is deleted', () => {
    assert.ok(!existsSync('src/utils/useFlipMark.js'), 'useFlipMark.js is deleted from the codebase');
    assert.ok(!/zIndex = '945'/.test(sortSrc), 'no body-level clone layer in the engine');
    // the pop law: every mark is keyed by its OWNER inside an AnimatePresence
    const stampSrc = src('src/components/StampEditModal.jsx');
    const managerSrc = src('src/components/ImageManagerModal.jsx');
    const createSrc = src('src/components/NewCharacterModal.jsx');
    for (const s of [stampSrc, managerSrc, createSrc]) {
      assert.ok(/<AnimatePresence initial=\{false\}>/.test(s), 'rides AnimatePresence');
      assert.ok(!/useFlipMark/.test(s), 'no flight call sites');
    }
    assert.ok(/key=\{stamps\[0\]\.id\}/.test(stampSrc), 'the TOP mark is keyed by the stamp id');
    assert.ok(/key=\{`cover-\$\{img\.file\}`\}/.test(managerSrc), 'the COVER badge is keyed by the file');
    assert.ok(/exit=\{\{ opacity: 0, scale: 0\.6 \}\}/.test(stampSrc), 'pop out = scale + fade (~180ms)');
  });

  ok('0.44.0 the card foot crops the name ONLY while hovered', () => {
    const foot = /\.gd-card-foot-vers\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/grid-template-columns: minmax\(0, 1fr\);/.test(foot), 'the resting foot is a ONE-TRACK grid');
    // 1.1.4 — the gates speak has-vers now (the plate retired; a card
    // with no badge never opens a phantom track), and the seated badge
    // wears the title's own line height — hover moves nothing.
    const hoverFoot = /\.gd-card:hover \.gd-card-foot-vers\.has-vers,[\s\S]{0,160}?\.gd-card-foot-vers\.has-vers:focus-within\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/grid-template-columns: minmax\(0, 1fr\) auto;/.test(hoverFoot), 'hover opens the badge track');
    const badge = /^\.gd-card-vers \{[^}]*\}/ms.exec(css)?.[0] || '';  // 1.3.9: line-anchored — the foot's z-step rule no longer shadows it
    assert.ok(/position: absolute;/.test(badge), 'the resting badge is out of the flow');
    const hoverBadge = /\.gd-card:hover \.gd-card-foot-vers\.has-vers \.gd-card-vers,[\s\S]{0,200}?\.gd-card-foot-vers\.has-vers:focus-within \.gd-card-vers\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/position: static;/.test(hoverBadge), 'hover seats the badge back in flow');
    assert.ok(/height: calc\(18\.75px \* var\(--card-scale, 1\)\);/.test(hoverBadge), '1.1.4: the seat wears the title line height — the rows never move');
    const date = /\.gd-card-meta-line\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/grid-column: 1 \/ -1;/.test(date), 'the date row spans everything in both states');
  });

  ok('0.44.0 bold reads — faux-black past the 700 ceiling, and under the outline', () => {
    const b = /\.rt-b\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/-webkit-text-stroke: 0\.45px currentColor;/.test(b), 'the half-pixel faux-black stroke');
    assert.ok(/font-weight: 800;/.test(b), 'the weight request stays');
    const combo = /\.rt-b\.rt-outline\s*\{[^}]*\}/.exec(css)?.[0] || '';
    // 1.0.7 — the ring became the OPPOSITE of the text ("so it just doesnt
    // look like thicker text since thats the job of the bold format").
    // 1.0.8 — and the opposite retired in turn ("its only visible when
    // selected but when let go its not visible"): the inverse of the ink
    // IS the ground on high-contrast themes, so the resting ring vanished.
    // The ring mixes the accent toward the ink's polarity now — visible at
    // rest in every theme, still a contour, never weight. Bold keeps the
    // fatter 2px ring of the same surface-reading mix.
    /* 1.1.8 — THE INVERSE IS BACK, BY REQUEST ("make the text outline
       color the opposite of the letter, so if the letter is white then the
       outline is black, if black then white"): the 1.0.8 accent-toward-ink
       mix retired; the ring is the letter's channel-by-channel inverse
       through relative color syntax, and the bold-under-outline ring
       thickens the same inverse law. */
    assert.match(combo, /-webkit-text-stroke: 2px rgb\(from currentColor calc\(255 - r\) calc\(255 - g\) calc\(255 - b\)\)/, 'the fatter ring is the letter\'s inverse (1.1.8)');
    assert.ok(!/var\(--gd-accent\) 62%/.test(combo), 'the 1.0.8 accent mix is retired');
  });

  ok('0.44.0 the tag / stamp folds live in a per-character memory', () => {
    assert.ok(/const ROWS_STATE_CACHE = new Map\(\);/.test(viewSrc), 'the module cache exists');
    assert.ok(/ROWS_STATE_CACHE\.get\(character\.id\)/.test(viewSrc), 'the mount reads it');
    assert.ok(/ROWS_STATE_CACHE\.set\(character\.id, \{ \.\.\.rowsCollapsed, auto: autoCollapsed === true \}\);/.test(viewSrc), 'every fold writes through');
  });

  ok('0.44.0 (0.45 amended) the preview has NO wheel — the zoom lives in three keys', () => {
    assert.ok(!/onWheel/.test(editorSrc), 'no wheel handler on the preview');
    assert.ok(!/addEventListener\('wheel'/.test(editorSrc), 'no wheel listener anywhere');
    assert.ok(editorSrc.includes('className="gd-preview-zoom"'), 'the three-key row under the card');
    assert.ok(/stepZoom\(1 \/ 0\.9\)/.test(editorSrc), 'the OUT key');
    assert.ok(/stepZoom\(0\.9\)/.test(editorSrc), 'the IN key');
    assert.ok(/onClick=\{\(\) => applyCrop\(null\)\}/.test(editorSrc), 'the RESET key returns to the auto fit');
  });

  ok('0.44.0 the zoom base can never be rewound by a late render', () => {
    assert.ok(/const appliedEchoRef = useRef\(null\);/.test(editorSrc), 'the echo guard exists');
    assert.ok(/if \(crop !== appliedEchoRef\.current\)/.test(editorSrc), 'only non-echo changes are adopted');
    assert.ok(!/^appliedRef\.current = crop;$/m.test(editorSrc), 'the unconditional render write-back is gone');
    // 0.45: the zoom keys compound through the same guarded base
    assert.ok(/const base = appliedRef\.current !== undefined \? appliedRef\.current : liveRef\.current\.crop;/.test(editorSrc), 'stepZoom builds on the freshest value');
  });

  ok('0.44.0 (0.45 amended) the button menus — per-key actions, never a fake press', () => {
    assert.ok(!/Press \$\{short\}/.test(appSrc), 'no press-the-button entry');
    assert.ok(/const header = \(name \|\| 'KEY'\)\.toUpperCase\(\);/.test(appSrc), 'the header names the key');
    assert.ok(/'undo', label: 'Undo'/.test(appSrc.replace(/\s+/g, ' ')), 'undo rides along');
    assert.ok(/'redo', label: 'Redo'/.test(appSrc.replace(/\s+/g, ' ')), 'redo rides along');
    // 0.45: the filter / order keys carry their own single action
    assert.ok(/optsKey === 'filter' \|\| optsKey === 'order'/.test(appSrc), 'the two toolbar keys branch apart');
    assert.ok(/label: 'Clear selection'/.test(appSrc), 'their action is Clear selection');
  });

  ok('0.44.0 (0.45 amended) the gear right-click opens its own menu (through the body portal)', () => {
    // 0.45.0 — the silence was the wrong cure; the real fix is GdContextMenu
    // portaling to document.body so fixed coords read against the viewport.
    assert.ok(/\{ctx && <GdContextMenu x=\{ctx\.x\} y=\{ctx\.y\} items=\{ctxItems\}/.test(viewSrc), 'the gear opens a ctx menu');
    assert.ok(/label: 'Edit card', icon: IdCard, onPick: onEditCard/.test(viewSrc.replace(/\s+/g, ' ')), 'EDIT CARD rides along');
    assert.ok(/label: 'Delete', icon: Trash2, danger: true, onPick: onDelete/.test(viewSrc.replace(/\s+/g, ' ')), 'DELETE rides along');
    assert.ok(/function CharSettingsMenu\(\{ onEditCard, onDelete, onUndo, onRedo, canUndo, canRedo, scUndo, scRedo \}\)/.test(viewSrc), 'undo/redo wired down from App');
    assert.ok(src('src/components/GdContextMenu.jsx').includes('createPortal'), 'the menu portals to document.body');
  });

  // 1.0.0 — the custom font seat RETIRED ("remove the custom font option"):
  // the import key, its caption and its accent posture are gone with it.
  ok('0.44.0 the font row: the three faces are the whole ladder (import seat retired in 1.0.0)', () => {
    assert.ok(!/BODY_FONT_OPTIONS\.filter\(\(f\) => f\.id !== 'custom'\)/.test(settingsSrc), 'no CUSTOM segment filter left');
    assert.ok(!/\(settings\.uiFont \|\| 'mono'\) === 'custom'/.test(settingsSrc), 'no import-key accent posture left');
    assert.ok(!/Imported: <span className="font-semibold">\{customFontName\}<\/span>/.test(settingsSrc), 'the imported-name caption is gone');
    assert.ok(!/IMPORT FONT/.test(settingsSrc), 'the import key itself is gone');
  });

  ok('0.44.0 the filters\' enable square matches the disable square', () => {
    const rule = /\.gd-spot-tile\.is-bare\.is-include\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/box-shadow: 0 0 0 2px color-mix\(in srgb, var\(--gd-accent\) 26%, transparent\);/.test(rule), 'the accent ring around the stamp');
    const idx = css.indexOf('.gd-spot-tile.is-bare.is-include');
    const bare = css.indexOf('.gd-spot-tile.is-bare.is-on .gd-spot-tile-box');
    assert.ok(idx > bare, 'placed after the bare rules so it outranks the plain picked state');
  });

  ok('0.44.0 the version drop pop is suppressed through drag AND settle', () => {
    assert.ok(/\.gd-sort-item\.is-dragging \.gd-chip,[\s\S]{0,120}?\.gd-settle \.gd-version-item \.gd-chip\s*\{[\s\S]{0,80}?transform: none;/.test(css), 'the chip lift stays down');
    assert.ok(/\.gd-sort-item\.is-dragging \.gd-version-edit,[\s\S]{0,140}?\.gd-settle \.gd-version-item \.gd-version-edit\s*\{[\s\S]{0,90}?opacity: 0 !important;/.test(css), 'the pencil stays hidden');
  });

  ok('0.44.0 every window grew ~7% for the serif face', () => {
    assert.ok(src('src/components/Dialogs.jsx').includes('w-[410px]'), 'confirm dialogs 380→410');
    assert.ok(src('src/components/StampEditModal.jsx').includes('w-[430px]'), 'stamp editor 400→430');
    // 1.4.0 supersede: the edit card window grew WIDE instead of long
    // ("make the edit card not very long ... 2 columns ish") — 470 left
    // for the two-column 700px seat; every other window keeps its law.
    // 1.4.3 supersede: the trims own a fixed left rail — the window is three
    // columns at 860px (the 151 suite holds the whole law).
    assert.ok(viewSrc.includes('w-[860px]'), 'edit card 440→470→700→860 (1.4.3: three columns)');
    assert.ok(modalSrc.includes("w-[470px]"), 'the modal default 440→470');
    assert.ok(src('src/components/ImageManagerModal.jsx').includes('w-[600px]'), 'image manager 560→600');
    assert.ok(src('src/components/VersionSettingsModal.jsx').includes('w-[660px]'), 'version settings 620→660');
    assert.ok(src('src/components/ClassSidebar.jsx').includes('w-[660px]'), 'class editor 620→660');
    assert.ok(settingsSrc.includes('w-[760px]'), 'settings 720→760');
    assert.ok(src('src/components/TagManagerModal.jsx').includes('w-[920px]'), 'tag manager 880→920');
    assert.ok(src('src/components/NewCharacterModal.jsx').includes('w-[940px]'), 'creation 900→940');
    for (const old of ['w-[380px]', 'w-[400px]', 'w-[440px]', 'w-[560px]', 'w-[620px]', 'w-[720px]', 'w-[880px]', 'w-[900px]']) {
      const hits = [
        'src/components/Dialogs.jsx', 'src/components/StampEditModal.jsx', 'src/components/CharacterView.jsx',
        'src/components/ImageManagerModal.jsx', 'src/components/VersionSettingsModal.jsx', 'src/components/ClassSidebar.jsx',
        'src/components/SettingsModal.jsx', 'src/components/TagManagerModal.jsx', 'src/components/NewCharacterModal.jsx',
        'src/components/Modal.jsx',
      ].filter((f) => src(f).includes(old)).length;
      assert.ok(hits === 0, `${old} fully retired (${hits} left)`);
    }
  });
}

// ===========================================================================
// Part B — live DOM (all awaited; the summary only prints once they land)
// ===========================================================================
const partB = async () => {
// --- the creation modal: NO wheel — the zoom keys carry it (portal-safe) ---
{
  // the image must LOAD for useImageAspect to resolve (600x800 => 0.75)
  const RealImage = dom.window.Image;
  global.Image = class {
    constructor() { this.naturalWidth = 600; this.naturalHeight = 800; }
    set src(v) { this._src = v; setTimeout(() => this.onload && this.onload(), 0); }
    get src() { return this._src; }
  };
  const NewCharacterModal = require(join(appRoot, 'src/components/NewCharacterModal.jsx')).default;

  await okAsync('0.44.0 (0.45 amended) the wheel is RETIRED — keys zoom, the gesture falls through', async () => {
    let lastCard = null;
    const { host, root } = await mount(NewCharacterModal, {
      initialImages: [{ file: 'a.png', thumb: 'a.png' }],
      imagesPath: 'C:/img',
      classes: [],
      stampLibrary: [],
      confirm: (o) => o.onConfirm?.(),
      onClose() {},
      onCreate() {},
    });
    await flush();
    await flush();
    const card = document.body.querySelector('.gd-card-collector');
    assert.ok(card, 'the preview card mounted');
    // the gesture is gone: wheels on the card (and its foot) are NOT consumed
    const ev = new dom.window.WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -100 });
    card.dispatchEvent(ev);
    assert.ok(!ev.defaultPrevented, 'the wheel falls through — no listener answers');
    const foot = card.querySelector('.gd-card-foot');
    assert.ok(foot, 'the foot mounted');
    const ev2 = new dom.window.WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -100 });
    foot.dispatchEvent(ev2);
    assert.ok(!ev2.defaultPrevented, 'a wheel on the foot scrolls the window like anywhere else');
    // the three-key zoom row carries the gesture instead
    const zoomRow = document.body.querySelector('.gd-preview-zoom');
    assert.ok(zoomRow, 'the zoom key row mounted under the card');
    const zoomBtns = [...zoomRow.querySelectorAll('button')];
    assert.ok(zoomBtns.length === 3, `three keys — out, in, reset (found ${zoomBtns.length})`);
    const outBtn = zoomBtns.find((b) => (b.getAttribute('title') || '').includes('Zoom out'));
    const inBtn = zoomBtns.find((b) => (b.getAttribute('title') || '').includes('Zoom in'));
    const resetBtn = zoomBtns.find((b) => (b.getAttribute('title') || '').includes('Reset'));
    assert.ok(outBtn && inBtn && resetBtn, 'out / in / reset all present');
    root.unmount();
    global.Image = RealImage;
  });
}

// --- the pop: a TOP change hands pops the mark; a plain reorder pops nothing ---
{
  const { StampSlots } = require(join(appRoot, 'src/components/StampEditModal.jsx'));

  await okAsync('0.44.0 (0.45 amended) the marks POP — no clones, no measurement', async () => {
    // No rect mocking at all — the pop needs no geometry. That's the law.
    const stampsA = [
      { id: 's1', image: 'a.png', name: 'alpha' },
      { id: 's2', image: 'b.png', name: 'beta' },
      { id: 's3', image: 'c.png', name: 'gamma' },
    ];
    let stamps = stampsA;
    const Parent = () => {
      const [list, setList] = React.useState(stamps);
      React.useEffect(() => { setList(stamps); }, [stamps]);
      return React.createElement(StampSlots, {
        stamps: list,
        imagesPath: 'C:/img',
        onRemove() {}, onPromote() {}, onReorder() {}, onRename() {},
      });
    };
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(Parent));
    await flush();

    const mark1 = host.querySelector('.gd-stamp-topmark');
    assert.ok(mark1, 'the TOP mark mounted');

    // a PLAIN reorder (the top keeps its seat): the mark rides its own slot —
    // the same node, never unmounted, nothing pops.
    stamps = [stampsA[0], stampsA[2], stampsA[1]];
    root.render(React.createElement(Parent));
    await flush();
    const markPlain = host.querySelector('.gd-stamp-topmark');
    assert.ok(markPlain === mark1, 'a plain reorder pops NOTHING — the mark is the same node');
    assert.ok(host.querySelectorAll('.gd-stamp-topmark').length === 1, 'exactly one mark lives in the strip');

    // the TOP changes hands: the new mark mounts on the promoted stamp and
    // the old one dies after its exit — no clone ever spawns at body level.
    stamps = [stampsA[2], stampsA[0], stampsA[1]];
    root.render(React.createElement(Parent));
    await flush();
    const bodyClones = [...document.body.children].filter(
      (el) => el !== host && String(el.className || '').includes('gd-stamp-topmark')
    );
    assert.ok(bodyClones.length === 0, 'no flight clone spawns at body level — the layer is retired');
    const markNew = host.querySelector('.gd-stamp-topmark');
    assert.ok(markNew && markNew !== mark1, 'the new mark is a fresh node on the promoted stamp');

    await sleep(400); // the exit (~180ms) finishes
    const marks = host.querySelectorAll('.gd-stamp-topmark');
    assert.ok(marks.length === 1, `the old mark died after its pop-out (found ${marks.length})`);
    assert.ok(marks[0] === markNew, 'the promoted stamp keeps the mark');

    root.unmount();
    host.remove();
  });
}

// --- the rows' memory: folds survive unmount/remount ---
{
  const CharacterView = require(join(appRoot, 'src/components/CharacterView.jsx')).default;
  const mkChar = (id) => ({
    id,
    name: 'amy',
    classId: 'root',
    tags: [],
    previewVersionId: null,
    cardRatio: { w: 3, h: 4 },
    cardTrim: 'dash',
    cardCrop: null,
    stamps: [
      { id: 's1', image: 'guild.png', name: 'guild' },
      { id: 's2', image: 'seal.png', name: 'seal' },
    ],
    stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
    createdAt: Date.now(),
    versions: [
      {
        id: 'v1', label: 'V1', color: null, icon: null,
        images: [{ file: 'a.png', thumb: 'a_t.jpg' }],
        parts: [{ id: 'p1', name: 'body', content: 'soft shading', include: true }],
        notes: '', createdAt: 1,
      },
    ],
  });
  const props = (character) => ({
    compact: true,
    character,
    tags: [],
    stampLibrary: [],
    imagesPath: 'C:/img',
    cardDefaultRatio: { w: 3, h: 4 },
    outputBarOn: false,
    showHelp: false,
    onBack() {}, patchCharacter() {}, onDelete() {},
    onToggleTag() {}, onOpenTagManager() {},
    onAttachStamp() {}, onRemoveStamp() {}, onPromoteStamp() {},
    onUploadStamp() {}, onRenameStamp() {}, onReorderStamps() {},
    onStampColor() {}, onStampTransform() {},
    confirm() {}, onStatus() {}, onActiveVersion() {},
  });

  await okAsync('0.44.0 the tag/stamp folds survive close + reopen', async () => {
    const char = mkChar('fold-c1');
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(CharacterView, props(char)));
    await flush();
    // 1.2.9 — THE VIEW MOUNTS IN BREATHS: the rows tray's zones land one
    // and two frames after the first paint (the mount-cost split — see
    // mountStage in CharacterView); a single 30ms flush catches only the
    // first breath, so the stamps toggle needs the second.
    await flush();

    // collapse the STAMPS row through its own toggle key
    const stampsToggle = [...host.querySelectorAll('.gd-row-toggle')].find((b) => (b.textContent || '').includes('STAMPS'));
    assert.ok(stampsToggle, 'the stamps toggle mounted');
    stampsToggle.click();
    await flush();
    /* 1.1.8 — the strip zone renders TWICE now (the side-flow law's hidden
       measurement twin + the live zone, both wearing .gd-stamp-strip); the
       LIVE one is the last — the probe never folds. */
    const zone = [...host.querySelectorAll('.gd-stamp-strip:not(.gd-side-probe)')].pop();
    assert.ok(zone && zone.className.includes('is-collapsed'), 'the stamps row folded');

    // close the panel (unmount) and reopen it (a FRESH root, like the panel
    // remounting from scratch)
    root.unmount();
    host.remove();
    await flush();
    const host2 = document.createElement('div');
    document.body.appendChild(host2);
    const root2 = createRoot(host2);
    root2.render(React.createElement(CharacterView, props(char)));
    await flush();
    await flush(); // 1.2.9 — the staged breaths land here too
    /* 1.1.8 — the live strip is the LAST .gd-stamp-strip (the side-flow
       law's measurement twin renders first and never folds). */
    const zone2 = [...host2.querySelectorAll('.gd-stamp-strip:not(.gd-side-probe)')].pop();
    assert.ok(zone2 && zone2.className.includes('is-collapsed'), 'still folded after the reopen — as they were');

    // and the TAGS row stayed expanded (only what the user folded persists)
    /* the TAGS zone = the FIRST seat's live zone (the stamps seat follows) */
    const tagsSeat = host2.querySelector('.gd-side-seat');
    const tagsZone = tagsSeat && tagsSeat.querySelector('.gd-collapse-zone:not(.gd-side-probe)');
    assert.ok(tagsZone && !tagsZone.className.includes('is-collapsed'), 'the untouched row stays open');
    root2.unmount();
    host2.remove();
  });
}

// --- the gear's right-click opens its OWN menu (body portal) ---
{
  const CharacterView = require(join(appRoot, 'src/components/CharacterView.jsx')).default;
  await okAsync('0.44.0 (0.45 amended) right-clicking the card settings opens EDIT CARD / DELETE / UNDO / REDO', async () => {
    const char = {
      id: 'gear-c1', name: 'amy', classId: 'root', tags: [], previewVersionId: null,
      cardRatio: { w: 3, h: 4 }, cardTrim: 'dash', cardCrop: null,
      stamps: [], stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
      createdAt: Date.now(),
      versions: [{
        id: 'v1', label: 'V1', color: null, icon: null,
        images: [{ file: 'a.png', thumb: 'a_t.jpg' }], parts: [], notes: '', createdAt: 1,
      }],
    };
    const { host, root } = await mount(CharacterView, {
      compact: true,
      character: char,
      tags: [], stampLibrary: [], imagesPath: 'C:/img',
      cardDefaultRatio: { w: 3, h: 4 }, outputBarOn: false, showHelp: false,
      onBack() {}, patchCharacter() {}, onDelete() {},
      onToggleTag() {}, onOpenTagManager() {},
      onAttachStamp() {}, onRemoveStamp() {}, onPromoteStamp() {},
      onUploadStamp() {}, onRenameStamp() {}, onReorderStamps() {},
      onStampColor() {}, onStampTransform() {},
      confirm() {}, onStatus() {}, onActiveVersion() {},
    });
    const gear = [...host.querySelectorAll('button')].find((b) => (b.getAttribute('title') || '').startsWith('Card settings'));
    assert.ok(gear, 'the gear mounted');
    const ev = new dom.window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 30, clientY: 30 });
    gear.dispatchEvent(ev);
    await flush();
    assert.ok(ev.defaultPrevented, 'the native menu is suppressed');
    // GdContextMenu portals to document.body — read it from there
    const menu = document.body.querySelector('.gd-ctx-menu');
    assert.ok(menu, 'the gear\'s own menu OPENED (through the body portal)');
    const hdr = menu.querySelector('.gd-ctx-header')?.textContent || '';
    const labels = [...menu.querySelectorAll('.gd-ctx-label')].map((el) => (el.textContent || '').trim());
    assert.ok(hdr.includes('CARD OPTIONS'), 'the header names the key');
    assert.ok(labels.includes('Edit card'), 'EDIT CARD rides along');
    assert.ok(labels.includes('Delete'), 'DELETE rides along');
    assert.ok(labels.includes('Undo'), 'UNDO rides along');
    assert.ok(labels.includes('Redo'), 'REDO rides along');
    // the left-click popover still works (that was never the complaint)
    gear.click();
    await flush();
    root.unmount();
  });
}

// --- the settings font card: three faces + the lit import key ---
{
  const SettingsModal = require(join(appRoot, 'src/components/SettingsModal.jsx')).default;
  await okAsync('0.44.0 the font row shows the 3 faces, no import key (retired in 1.0.0)', async () => {
    const settings = { uiFont: 'mono' };
    // the window renders through its LAZY PORTAL at document.body — the
    // assertions read from there, not from the mount host
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(SettingsModal, {
      settings,
      initial: { ...settings },
      onClose() {},
      onChange() {},
    }));
    await flush();
    await flush();
    const importBtn = [...document.body.querySelectorAll('button')].find((b) => (b.textContent || '').includes('IMPORT FONT'));
    assert.ok(!importBtn, 'the import key is gone (1.0.0)');
    // the FONT card's segmented row still carries the three base faces
    const segs = [...document.body.querySelectorAll('.gd-seg-btn')];
    const labels = segs.map((b) => b.textContent.trim());
    assert.ok(labels.includes('MONO') && labels.includes('GROTESK') && labels.includes('SERIF'), 'the three base faces');
    assert.ok(!labels.includes('CUSTOM'), 'no custom segment');
    root.unmount();
    host.remove();
  });
}

// ===========================================================================
}; // end partB — the live tests run to completion before the summary

partB().finally(() => {
  console.log(`\n0.44.0 batch: ${passed} passed, ${failed} failed${failed ? ' — FIX ABOVE' : ' — all green'}`);
  process.exit(failed ? 1 : 0);
});
