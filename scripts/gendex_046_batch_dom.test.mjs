// 0.46.0 batch DOM + source checks — the sixth fix wave.
//
//   · THE MANAGER'S HONEST LET-GO ("when i let go and it snaps to older
//     index then new index"): the tiles never snapped — the VIEW did. The
//     stage kept its current-image index as a raw NUMBER healed to the
//     pinned file's new slot one render late, so at the commit the
//     manager's ring (and the stage picture) rendered against the STALE
//     slot: the ring mounted on the wrong tile, popped back out, then
//     landed on the moved file — old index, then new index. safeIndex is
//     now DERIVED from the pinned file in the same render as the reorder.
//   · THE BADGE FADES WHERE IT SAT — the N VER badge is pinned at its
//     measured in-flow seat through the release fade (a cached mini-FLIP:
//     mouseleave can land after the browser already flipped the styles).
//     The hold neutralizes the badge's grid placement so left/top read
//     against the FOOT, not the implicit second track.
//   · THE SHINE FINISHES ITS SWEEP — the animation rides .is-live (armed
//     by the grid's delegated hover, retired by its own animationend),
//     never :hover, so leaving the card mid-sweep can't interrupt it.
//   · THE STAMPS' FOLD shows the TOP ring + glow whole (clamp 52 → 55).
//   · MU MEI'S VERSION ROWS breathe 14px apart so the row-below container
//     never slices the row-above shadow's fading tail (10px packed them).
//   · THE TITLEBAR'S KEYS say nothing on right-click (panel/output/tooltip
//     switches, undo/redo/save, settings, window controls) while the keys
//     that own real actions (gear crew, pin, filter/order) keep theirs.
//
// Requires jsdom (installed dev-only). Skips gracefully without it.
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch {
  console.log('jsdom unavailable — 0.46.0 batch DOM test skipped (dev-only dependency)');
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
// Part A — source checks for the sixth wave
// ===========================================================================
{
  const APP = require(join(appRoot, 'src/constants/index.js')).APP;
  const stageSrc = src('src/components/ImageStage.jsx');
  const viewSrc = src('src/components/CharacterView.jsx');
  const sideSrcRaw = src('src/components/SideFlow.jsx');
  const gridSrc = src('src/components/GridView.jsx');
  const masonrySrc = src('src/components/MasonryGrid.jsx');
  const appSrc = src('src/App.jsx');
  const mgrSrc = src('src/components/ImageManagerModal.jsx');

  ok('0.46.0→1.0.2 the version pinned through 1.0.4', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(src('package.json'), /"version": "1\.4\.3"/);
    assert.match(src('CHANGELOG.md'), /^## 0\.46\.0/m, 'the changelog carries the entry');
  });

  ok('0.46.0 the view index is DERIVED, never reconciled (the manager\'s honest let-go)', () => {
    // the derivation: pinned file -> index, in-render, with the numeric fallback
    assert.ok(/const safeIndex = useMemo\(\(\) => \{/.test(stageSrc), 'safeIndex is a memoized derivation');
    assert.ok(/if \(pinnedFile\) \{\s*const i = images\.findIndex\(\(im\) => im\.file === pinnedFile\);\s*if \(i >= 0\) return i;/.test(stageSrc.replace(/\r/g, '')), 'the pinned file\'s slot is read during the render');
    assert.ok(/return Math\.min\(index, images\.length - 1\);/.test(stageSrc), 'the raw index remains only as the fallback seat');
    // the effect no longer DRIVES the view — it only firms up the pin
    assert.ok(/} else if \(i !== index\) \{\s*setIndex\(i\);/.test(stageSrc.replace(/\r/g, '')), 'the effect keeps the fallback in sync without leading');
    assert.ok(!/if \(i !== index\) setIndex\(i\);\s*\/\/ eslint-disable/.test(stageSrc), 'the old leading reconcile is gone');
    // the manager's ring is still keyed by its OWNER (nothing else moved)
    assert.ok(/key=\{`ring-\$\{img\.file\}`\}/.test(mgrSrc), 'the selection ring is keyed by the file it marks');
  });

  ok('0.46.0 the stamps\' fold shows the TOP ring + glow whole (clamp 52 → 55)', () => {
    /* 1.1.8 — the strip's clamp moved INTO SideFlowZone (the stamps
       flavor, floorPx=55): the 55px floor survives the migration, spoken
       by the zone's own seat instead of the old useClampStyle call. */
    assert.ok(/<SideFlowZone\s+rows=\{2\}\s+collapsed=\{collapsed\}\s+floorPx=\{55\}/.test(viewSrc), 'the clamp floor (55) lives on the side-flow zone');
    assert.ok(/52 shaved the ring, 55/.test(sideSrcRaw), 'the 52→55 law is written where the clamp lives now (SideFlow)');
  });

  ok('0.46.0 the badge fades where it sat — the hold + the cached seat', () => {
    assert.ok(/const holdVersOnRelease = \(\) => \{/.test(gridSrc), 'the release hold exists');
    assert.ok(/const cacheVersSeat = \(\) => \{/.test(gridSrc), 'the seat is cached while the badge is in flow');
    assert.ok(/versSeatRef\.current/.test(gridSrc), 'the cache rides a ref (mouseleave lands after the style flip)');
    assert.ok(/onMouseLeave=\{holdVersOnRelease\}/.test(gridSrc), 'leaving the card arms the hold');
    assert.ok(/onMouseMove=\{cacheVersSeat\}/.test(gridSrc), 'moving over the card refreshes the cached seat');
    assert.ok(/ref=\{versRef\} className="gd-card-vers"/.test(gridSrc), 'the badge carries the ref');
    assert.ok(/ref=\{footRef\}/.test(gridSrc), 'the foot carries the measuring ref');
  });

  ok('0.46.0 the hold CSS — the grid placement dies so the seat reads true', () => {
    const hold = /\.gd-card-vers\.gd-vers-hold\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/grid-column: auto;/.test(hold), 'auto placement drops the containing block back to the foot');
    assert.ok(/grid-row: auto;/.test(hold), 'the row placement follows');
    assert.ok(/right: auto;/.test(hold), 'the resting right anchor steps aside for left/top');
    assert.ok(/opacity: 0;/.test(hold), 'the fade target');
    assert.ok(/z-index: 2;/.test(hold), 'the fading badge rides above the re-expanding name');
  });

  ok('0.46.0 the titlebar\'s keys say nothing on right-click', () => {
    assert.ok(/if \(btn\.closest\('\[data-gd-region="titlebar"\]'\)\) return;/.test(appSrc), 'the button branch swallows titlebar keys before any menu');
    const titleSrc = src('src/components/Titlebar.jsx');
    assert.ok(/data-gd-region="titlebar"/.test(titleSrc), 'every top bar key lives inside the titlebar region');
    // the keys that own real actions keep their menus
    assert.ok(/optsKey === 'filter' \|\| optsKey === 'order'/.test(appSrc), 'the filter/order keys still speak Clear selection');
    assert.ok(/'Pin header'/.test(viewSrc), 'the pin still speaks its own action');
  });

  ok('0.46.0 the shine rides is-live, never :hover', () => {
    assert.ok(/\.gd-card-shine\.is-live::before,/.test(css), 'the is-live rule carries the sweep');
    assert.ok(!/\.gd-card:hover \.gd-card-shine::before/.test(css), 'no :hover rule can interrupt a started sweep');
    assert.ok(/\.gd-card:focus-visible \.gd-card-shine::before/.test(css), 'keyboard focus keeps its own rule');
    const sweep = /@keyframes gd-shine-sweep[\s\S]{0,400}/.exec(css)?.[0] || '';
    assert.ok(/translate\(70%, 70%\)/.test(sweep), 'the sweep still ends at the far corner');
  });

  ok('0.46.0 the sweep arms on entry and retires on its own animationend', () => {
    assert.ok(/const shineArm = \(e\) => \{/.test(gridSrc), 'the delegated armer exists');
    assert.ok(/classList\.add\('is-live'\)/.test(gridSrc), 'it arms the one-shot class');
    assert.ok(/e\.currentTarget\?\.contains\?\.\(card\)/.test(gridSrc), 'the hovered card must live inside the grid');
    assert.ok(/e\.animationName !== 'gd-shine-sweep'/.test(gridSrc), 'the retires listen for the sweep itself');
    assert.ok(/classList\.remove\('is-live'\)/.test(gridSrc), 'the class retires when the sweep finishes');
    assert.ok(/onMouseOver=\{shineArm\}/.test(gridSrc), 'the grid hands the armer to the scroller');
    assert.ok(/onAnimationEnd=\{shineRetire\}/.test(gridSrc), 'and the retires ride the same scroller');
    /* 1.3.0 — the signature also carries `flighting` (the panel flight's
       projection rest). */
    assert.ok(/onMouseOver, onAnimationEnd, expandedIds = null, flighting = false\s*\}/.test(masonrySrc), 'MasonryGrid accepts the delegated pair (plus the 1.1.8 expanded seat and the 1.3.0 flighting flag)');
  });

  ok('0.46.0 mumei\'s version rows breathe under the shadows', () => {
    /* 1.1.8 — the strip is ONE row now ("versions will work differently…"):
       flex-nowrap + overflow-x-auto, never wrapping again. */
    assert.ok(/gd-version-strip py-2 px-2 flex items-center gap-2\.5 flex-nowrap overflow-x-auto/.test(viewSrc), '1.1.9: the strip mounts as a single scrolling row (py-2 px-2 — the tightened row + clip-plane air)');
    const strip = /\.gd-version-strip\s*\{[^}]*\}/.exec(css)?.[0] || '';
    /* 1.1.8 — the strip never wraps ("versions will work differently…"),
       so the 14px ROW-gap law retired with the second row itself; the
       chips' own column gap (10px) keeps the shadow breathing room IN the
       one row that remains. */
    assert.ok(!/row-gap: 14px;/.test(strip), 'the wrapping row-gap law retired with the wrap');
    assert.ok(!/column-gap/.test(strip), 'the columns keep their 10px');
  });
}

// ===========================================================================
// Part B — live DOM: the manager drag keeps the ring on its file
// ===========================================================================
{
  const ImageStage = require(join(appRoot, 'src/components/ImageStage.jsx')).default;

  await okAsync('0.46.0 a manager drag rides the ring through the commit — same node, same file, same stage picture', async () => {
    const RealImage = dom.window.Image;
    global.Image = class {
      constructor() { this.naturalWidth = 600; this.naturalHeight = 800; }
      set src(v) { this._src = v; setTimeout(() => this.onload && this.onload(), 0); }
      get src() { return this._src; }
    };
    const IMAGES = ['img_00.png', 'img_01.png', 'img_02.png', 'img_03.png'].map((f) => ({ file: f, thumb: f }));
    const commits = [];
    const { useState: useLocalState } = React;
    const Parent = () => {
      const [imgs, setImgs] = useLocalState(IMAGES);
      return React.createElement(ImageStage, {
        images: imgs,
        imagesPath: 'C:/img',
        onAddImages: async () => {},
        onSetCover: () => {},
        onDeleteImage: () => {},
        onReorderImages: (from, to) => {
          const next = [...imgs];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          commits.push([from, to]);
          setImgs(next);
        },
        onPasteRecord: () => {},
        onStatus: () => {},
        confirm: () => {},
      });
    };
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(Parent));
    await sleep(120);

    // open the manager through its key
    const mgrKey = [...document.querySelectorAll('button')].find((b) => (b.getAttribute('title') || '').includes('Image manager'));
    assert.ok(mgrKey, 'the image manager key mounted');
    mgrKey.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
    await sleep(120);
    const slots = [...document.body.querySelectorAll('.gd-img-slot')];
    assert.ok(slots.length === 4, `the manager mounted its slots (found ${slots.length})`);

    // the ring (the stage's current image) + the stage picture, before
    const ringBefore = document.body.querySelector('.gd-img-slot-ring');
    assert.ok(ringBefore, 'the selection ring mounted');
    const ringTileBefore = ringBefore.closest('.gd-img-slot');
    const ringFileBefore = decodeURIComponent(ringTileBefore.querySelector('img').src.split('/').pop());
    const stageSrcBefore = decodeURIComponent(document.querySelector('.gd-stage-img')?.src.split('/').pop() || '');
    assert.ok(ringFileBefore.includes('img_00'), `the ring starts on the pinned first image (got ${ringFileBefore})`);

    // drag slot 0 (the ring's own file) toward slot 2 — the exact drag that
    // used to snap the ring to the OLD index for a paint
    const grab = slots[0];
    const rect = (x, y) => ({ left: x, top: y, right: x + 64, bottom: y + 64, width: 64, height: 64, x, y, toJSON() {} });
    const origGBCR = dom.window.Element.prototype.getBoundingClientRect;
    slots.forEach((el, i) => {
      const r = rect(i * 74, 10);
      el.getBoundingClientRect = () => r;
    });
    const pointer = (type, x, y) => new (dom.window.PointerEvent || dom.window.MouseEvent)(
      type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerId: 7, buttons: 1 }
    );
    grab.dispatchEvent(pointer('pointerdown', 32, 42));
    await flush();
    grab.dispatchEvent(pointer('pointermove', 160, 42));
    await flush();
    await flush();
    grab.dispatchEvent(pointer('pointerup', 160, 42));
    await sleep(430); // the settle's transitionend fallback commits
    assert.ok(commits.length >= 1, `the reorder committed (${JSON.stringify(commits)})`);

    // THE LAW: the ring is the SAME DOM NODE — no wrong-tile mount, no exit
    // + re-enter — and it still marks the same FILE, on its new tile
    const ringAfter = document.body.querySelector('.gd-img-slot-ring');
    assert.ok(ringAfter === ringBefore, 'the ring node survived the whole drag (identity kept — nothing ever snapped)');
    const ringTileAfter = ringAfter.closest('.gd-img-slot');
    const ringFileAfter = decodeURIComponent(ringTileAfter.querySelector('img').src.split('/').pop());
    assert.equal(ringFileAfter, ringFileBefore, 'the ring still marks the pinned file');
    const tiles = [...document.body.querySelectorAll('.gd-img-slot')];
    assert.equal(tiles.indexOf(ringTileAfter), commits[0][1], 'the ring rode its file to the new slot');
    const stageSrcAfter = decodeURIComponent(document.querySelector('.gd-stage-img')?.src.split('/').pop() || '');
    assert.equal(stageSrcAfter, stageSrcBefore, 'the stage picture never flickered off its file');

    dom.window.Element.prototype.getBoundingClientRect = origGBCR;
    global.Image = RealImage;
    root.unmount();
    host.remove();
    document.body.querySelectorAll('.gd-modal-card').forEach((el) => el.remove());
  });
}

// ===========================================================================
// Part C — live DOM: the titlebar's keys stay silent + the shine arms/retires
// ===========================================================================
{
  window.api = {
    loadDB: async () => ({
      db: {
        settings: {
          theme: 'zine', colors: {}, zoom: 2, defaultSortMode: 'custom',
          textures: { titlebar: 'none', sidebar: 'none', viewer: 'dots', panel: 'none' },
          detailPanel: true, tagScale: 1.2, cardRatio: { w: 3, h: 4 },
        },
        classes: [{ id: 'cl1', name: 'heroes', parentId: 'root', order: 1 }],
        tags: [], stamps: [],
        characters: [
          {
            id: 'c1', name: 'amy', classId: 'cl1', tags: [], previewVersionId: null,
            cardRatio: { w: 3, h: 4 }, cardTrim: 'dash', cardCrop: null,
            stamps: [], stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
            createdAt: Date.now(),
            versions: [{ id: 'v1', label: 'V1', color: null, icon: null, images: [{ file: 'a.png', thumb: 'a_t.jpg' }], parts: [], notes: '', createdAt: 1 }],
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
    clipboardReadImage: async () => null,
    importImagesFromFiles: async () => [],
    saveImageBuffer: async () => null,
    copyImageFile: async () => null,
    deleteImageFile: async () => ({ ok: true }),
    openDataFolder: () => {},
    clearCache: async () => ({ ok: true }),
  };
  document.body.innerHTML = '<div id="root"></div>';
  const App = require(join(appRoot, 'src/App.jsx')).default;
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(App));
  await sleep(3400);

  const ctx = (el, x = 30, y = 30) =>
    el.dispatchEvent(new dom.window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
  const menuHeader = () => document.querySelector('.gd-ctx-header')?.textContent || '';
  const escape = () => document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

  // every key in the titlebar swallows the press silently
  const bar = document.querySelector('[data-gd-region="titlebar"]');
  assert.ok(bar, 'the titlebar mounted');
  const barKeys = [...bar.querySelectorAll('button')];
  assert.ok(barKeys.length >= 8, `the bar carries its keys (found ${barKeys.length})`);
  let allSilent = true;
  for (const k of barKeys) {
    ctx(k, 40, 12);
    // eslint-disable-next-line no-await-in-loop
    await sleep(50);
    if (document.querySelectorAll('.gd-ctx-menu').length > 0) {
      allSilent = false;
      escape();
      // eslint-disable-next-line no-await-in-loop
      await sleep(120);
    }
  }
  ok('0.46.0 right-clicking EVERY titlebar key opens nothing', () => {
    assert.ok(allSilent, 'not one of the bar\'s keys opened a menu');
  });

  // the chain stays alive: the viewer's empty surface still speaks
  const scroller = document.querySelector('.gd-tex-viewer') || document.querySelector('main');
  ctx(scroller, 400, 300);
  await sleep(80);
  ok('0.46.0 the viewer\'s own menu still speaks (the silence is scoped to the bar)', () => {
    assert.ok(menuHeader().includes('CARD VIEWER'), `the viewer crew answers (got: ${menuHeader()})`);
  });
  escape();
  await sleep(200);

  // the shine arms on entry (delegated) and retires on its own animationend
  const card = document.querySelector('.gd-card');
  assert.ok(card, 'a card mounted');
  const shine = card.querySelector('.gd-card-shine');
  assert.ok(shine, 'the shine layer mounted');
  card.querySelector('.gd-sleeve-clip')?.dispatchEvent(
    new dom.window.MouseEvent('mouseover', { bubbles: true, cancelable: true, clientX: 50, clientY: 50 })
  );
  await flush();
  ok('0.46.0 hovering a card arms the sweep (is-live)', () => {
    assert.ok(shine.classList.contains('is-live'), 'the one-shot class landed');
  });
  // leaving does NOT retire it — only the sweep's own end does
  document.body.dispatchEvent(
    new dom.window.MouseEvent('mouseover', { bubbles: true, cancelable: true, clientX: 900, clientY: 400 })
  );
  await flush();
  ok('0.46.0 leaving the card mid-sweep keeps it live (nothing interrupts)', () => {
    assert.ok(shine.classList.contains('is-live'), 'the sweep is still armed after the pointer left');
  });
  // NOTE — the RETIRE (the sweep's own animationend stripping is-live) is
  // pinned by the source checks above and was verified frame-by-frame in a
  // real Chromium (the class retires exactly at ~2.2s, sweep complete):
  // React's onAnimationEnd delegation does not fire under this jsdom
  // harness at all (a minimal probe: dispatching a bubbling animationend
  // with animationName defined reaches the raw listeners but never React's
  // root delegation), so a live retire check here would only test the
  // harness, not the app.

  root.unmount();
  document.body.innerHTML = '';
}

// ---------------------------------------------------------------------------
console.log(`\n0.46.0 batch: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
