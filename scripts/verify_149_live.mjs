// 1.4.9 live verification: render the changed pieces in jsdom.
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';

const require = createRequire(import.meta.url);
const babel = require('@babel/core');

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});
global.window = dom.window;
global.document = dom.window.document;
try {
  global.navigator = dom.window.navigator;
} catch {
  // Node 24+: navigator is a readonly global — jsdom's window.navigator
  // only matters for the DOM context, which JSDOM provides itself.
}
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.SVGElement = dom.window.SVGElement;
global.Image = dom.window.Image;
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.matchMedia = global.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
global.CSS = { supports: () => true, escape: (v) => v };

const Module = require('module');

require.extensions['.jsx'] = (module, filename) => {
  const { code } = babel.transformFileSync(filename, {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      ['@babel/preset-react', { runtime: 'automatic' }],
    ],
  });
  module._compile(code, filename);
};
for (const ext of ['.png', '.jpg', '.svg', '.ico', '.webp', '.woff2']) {
  require.extensions[ext] = (m, f) => { m.exports = f; };
}

function loadJsx(rel) {
  const abs = `/home/z/my-project/burrito_gendex/src/${rel}`;
  return require(abs);
}

const React = require('react');
const { createRoot } = require('react-dom/client');

const TagRibbon = loadJsx('components/TagRibbon.jsx');
const CardStyleControls = loadJsx('components/CardStyleControls.jsx').default;
const GridView = loadJsx('components/GridView.jsx').default;
const { SideFlowZone } = loadJsx('components/SideFlow.jsx');
const CharacterView = loadJsx('components/CharacterView.jsx').default;
const GdContextMenu = loadJsx('components/GdContextMenu.jsx').default;
const Modal = loadJsx('components/Modal.jsx').default;
const { migrateCardFinish, CARD_FINISHES } = loadJsx('constants/index.js');

const root = createRoot(document.getElementById('root'));

let failures = 0;
const check = (name, cond) => {
  console.log(`${cond ? '  ok —' : '  FAIL —'} ${name}`);
  if (!cond) failures += 1;
};
const settle = () => new Promise((r) => setTimeout(r, 12));

// --- 1. CardFinishLayer: every finish × image effect -----------------------
for (const finish of ['mumeix', 'foil', 'kintsugi', 'holographic', 'prismatic', 'nuri', 'none']) {
  for (const onImage of [true, false]) {
    root.render(
      React.createElement(TagRibbon.CardFinishLayer, {
        finish, onImage, onTrim: false, artH: 250, hasImage: true, phase: 0.42,
      })
    );
    await settle();
    const seats = [...document.querySelectorAll('.gd-card-face-finish')];
    const artfins = [...document.querySelectorAll('.gd-card-face-artfin')];
    const veiled = [...document.querySelectorAll('.gd-card-face-finish.is-plate-only')];
    if (finish === 'none') {
      check(`none: no seats (onImage=${onImage})`, seats.length === 0 && artfins.length === 0);
      continue;
    }
    check(`${finish} onImage=${onImage}: seats present`, seats.length >= 1);
    check(`${finish} onImage=${onImage}: seats ${onImage ? 'revealed' : 'veiled'}`,
      veiled.length === (onImage ? 0 : seats.length));
    if (finish === 'prismatic') {
      const stars = document.querySelector('.gd-prism-stars');
      check(`prismatic onImage=${onImage}: stars veil with the family`, !!stars && (onImage || stars.classList.contains('is-plate-only')));
    }
    if (finish === 'mumeix') {
      check(`mumeix onImage=${onImage}: five materials speak (body, streams, x-marks, stars, moon)`,
        !!document.querySelector('.gd-finish-mumeix') &&
        !!document.querySelector('.gd-mumeix-streams') &&
        !!document.querySelector('.gd-mumeix-xmarks') &&
        !!document.querySelector('.gd-mumeix-stars') &&
        !!document.querySelector('.gd-mumeix-moon'));
      check(`mumeix onImage=${onImage}: artfin ${onImage ? 'present' : 'absent'}`,
        document.querySelectorAll('.gd-artfin-mumeix').length === (onImage ? 1 : 0));
    }
    if (finish === 'kintsugi') {
      check(`kintsugi onImage=${onImage}: four materials speak (body, veins, mica, gleam)`,
        !!document.querySelector('.gd-finish-kintsugi') &&
        !!document.querySelector('.gd-kintsugi-veins') &&
        !!document.querySelector('.gd-kintsugi-mica') &&
        !!document.querySelector('.gd-kintsugi-gleam'));
      check(`kintsugi onImage=${onImage}: artfin ${onImage ? 'present' : 'absent'}`,
        document.querySelectorAll('.gd-artfin-kintsugi').length === (onImage ? 1 : 0));
    }
    if (finish === 'holographic') {
      check(`holographic onImage=${onImage}: shard + dot children speak`,
        !!document.querySelector('.gd-holo-shards') && !!document.querySelector('.gd-holo-dots'));
    }
    if (finish === 'nuri') {
      check(`nuri onImage=${onImage}: artfin ${onImage ? 'present' : 'absent'}`,
        document.querySelectorAll('.gd-artfin-nuri').length === (onImage ? 1 : 0));
    }
  }
}

// --- 2. the migration map + the ladder -------------------------------------
check('migration: mumei -> mumeix (the rename walks its own road)', migrateCardFinish('mumei') === 'mumeix');
check('migration: opalescent -> mumeix', migrateCardFinish('opalescent') === 'mumeix');
check('migration: chromatic -> mumeix', migrateCardFinish('chromatic') === 'mumeix');
check('migration: polychrome -> mumeix', migrateCardFinish('polychrome') === 'mumeix');
check('migration: kintsugi keeps its seat', migrateCardFinish('kintsugi') === 'kintsugi');
const ladder = CARD_FINISHES.map((f) => f.id);
check('the ladder: none, mumeix, foil, KINTSUGI (after foil), holographic, prismatic, nuri',
  ladder.join(',') === 'none,mumeix,foil,kintsugi,holographic,prismatic,nuri');

// --- 3. CardStyleControls: the tooltips speak the new coats ----------------
root.render(
  React.createElement(CardStyleControls, {
    finish: 'none',
    finishOnImage: false,
    onFinish: () => {},
    onFinishOnImage: () => {},
    imageMotion: false,
    onImageMotion: () => {},
    stampMotion: false,
    onStampMotion: () => {},
    hasImage: true,
    hasStamp: true,
  })
);
await settle();
{
  const titles = [...document.querySelectorAll('button[title]')].map((b) => b.title);
  check('tooltips: mumeix speaks its X', titles.some((t) => t.includes('Mumeix') && t.includes('X')));
  check('tooltips: kintsugi speaks its seams', titles.some((t) => t.includes('Kintsugi') && t.includes('gold seams')));
  const labels = [...document.querySelectorAll('button')].map((b) => b.textContent);
  check('the ladder renders all seven keys', ['None', 'Mumeix', 'Foil', 'Kintsugi', 'Holographic', 'Prismatic', 'Nuri'].every((l) => labels.includes(l)));
}

// --- 4. GridView: scope + tint + add tile + hover column -------------------
const mkChar = (over) => ({
  id: 'c1', name: 'Verify', classId: 'root', tags: [], previewVersionId: null,
  cardRatio: { w: 3, h: 4 }, cardTrim: 'dash',
  cardFinish: 'nuri', cardFinishOnImage: false,
  cardColor: '#3355aa',
  stamps: [],
  versions: [{ id: 'v1', label: 'v1', parts: [], images: [{ id: 'i1', file: 'cover.png', addedAt: 1 }], createdAt: 1 }],
  stampSettings: { color: null },
  ...over,
});
const noop = () => {};
const dragRef = { current: null };
root.render(
  React.createElement(GridView, {
    characters: [mkChar()], tags: [], stamps: [], imagesPath: 'C:/img', zoom: 2, tagScale: 1,
    cardRatio: { w: 3, h: 4 }, sortMode: 'custom', search: '', advancedSearch: false,
    classLabel: 'All Cards', dragRef,
    spotlight: { include: [], exclude: [], stamps: [], hideNonMatching: false },
    showHelp: false,
    onCycleSpotlight: noop, onCycleStampSpotlight: noop, onToggleSpotlightHide: noop,
    onSearch: noop, onSort: noop, onZoom: noop, onTagScale: noop, onNew: noop,
    onOpen: noop, onRename: noop, onDelete: noop, onReorder: noop,
  })
);
await settle();
{
  const card = document.querySelector('.gd-card');
  check('grid: the under-art scope arms on a veiled coat', card?.classList.contains('gd-fin-under-art'));
  check('grid: the tint var carries the card color', card?.style.getPropertyValue('--gd-card-tint') === '#3355aa');
  check('grid: the hover column carries its own class', !!card?.querySelector('.gd-card-hovercol'));
  const add = document.querySelector('.gd-card-add');
  check('grid: the add tile carries the pulse class', !!add && add.classList.contains('gd-card-pulse'));
}

// --- 5. the squish survives re-renders (the attribute law, re-proven) -----
{
  const card = document.querySelector('.gd-card');
  card?.setAttribute('data-pressed', '1');
  root.render(
    React.createElement(GridView, {
      characters: [mkChar()], tags: [], stamps: [], imagesPath: 'C:/img', zoom: 2, tagScale: 1,
      cardRatio: { w: 3, h: 4 }, sortMode: 'custom', search: '', advancedSearch: false,
      classLabel: 'All Cards', dragRef,
      spotlight: { include: [], exclude: [], stamps: [], hideNonMatching: false },
      showHelp: false,
      onCycleSpotlight: noop, onCycleSpotlight: noop, onToggleSpotlightHide: noop,
      onSearch: noop, onSort: noop, onZoom: noop, onTagScale: noop, onNew: noop,
      onOpen: noop, onRename: noop, onDelete: noop, onReorder: noop,
    })
  );
  await settle();
  check('grid: [data-pressed] survives the re-render', document.querySelector('.gd-card')?.hasAttribute('data-pressed'));
  document.querySelector('.gd-card')?.removeAttribute('data-pressed');
}

// --- 6. SideFlowZone: the cover seat is gone, the flow remains -------------
root.render(
  React.createElement(
    'div',
    { style: { width: '320px' } },
    React.createElement(
      SideFlowZone,
      { rows: 3, collapsedRows: 2, collapsed: false, floorPx: 31, selfFlow: true, flowRef: { current: null }, ariaLabel: 'tags' },
      React.createElement('button', { key: 'a', className: 'gd-chip gd-tag-chip gd-sort-item' }, 'alpha'),
      React.createElement('button', { key: 'b', className: 'gd-chip gd-tag-chip gd-sort-item' }, 'beta'),
      React.createElement('button', { key: 'c', className: 'gd-chip gd-tag-chip gd-sort-item' }, 'gamma')
    )
  )
);
await settle();
{
  const seat = document.querySelector('.gd-side-seat');
  check('sideflow: the seat renders (no is-cover-seat, no pinned height)', !!seat && !seat.classList.contains('is-cover-seat') && !seat.style.height);
  const zone = document.querySelector('.gd-collapse-zone');
  check('sideflow: the zone is a flow citizen (no is-cover-open tint plate)', !!zone && !zone.classList.contains('is-cover-open'));
  check('sideflow: the probe twin still measures', !!document.querySelector('.gd-side-probe'));
}

// --- 7. GdContextMenu: the card under a held child key stays hot -----------
{
  // Build a card-shaped DOM and fire the capture-phase memory listener.
  const stage = document.createElement('div');
  stage.innerHTML = '<div class="gd-card gd-card-hover"><button class="gd-chip">chip</button></div>';
  document.body.appendChild(stage);
  const chip = stage.querySelector('.gd-chip');
  const ctxEvent = new dom.window.MouseEvent('contextmenu', { bubbles: true });
  Object.defineProperty(ctxEvent, 'target', { value: chip });
  document.dispatchEvent(ctxEvent);
  root.render(
    React.createElement(GdContextMenu, { x: 10, y: 10, items: [{ id: 'hdr', header: 'CARD: T' }], onClose: noop })
  );
  await settle();
  const card = stage.querySelector('.gd-card');
  const chipEl = stage.querySelector('.gd-chip');
  check('menu: the chip key AND its card both hold .is-ctx-hot',
    chipEl?.classList.contains('is-ctx-hot') && card?.classList.contains('is-ctx-hot'));
  root.render(React.createElement('div', null, null));
  await settle();
  check('menu: the hold lifts when the menu closes', !chipEl?.classList.contains('is-ctx-hot') && !card?.classList.contains('is-ctx-hot'));
  stage.remove();
}

// --- 8. Modal: the entrance carries no scale --------------------------------
{
  const props = [];
  const origCreate = React.createElement;
  // Capture the motion.div initial props by rendering the Modal and reading
  // what framer received (jsdom + framer render inline styles after mount;
  // the honest read is the initial/animate values the component passes).
  root.render(
    React.createElement(Modal, { title: 'T', onClose: noop }, React.createElement('p', null, 'body'))
  );
  await settle();
  const card = document.querySelector('.gd-modal-card');
  check('modal: the card renders at the body level', !!card);
  // framer writes its initial values into style at first paint in jsdom:
  // a scaled entrance would carry transform: scale(...) — the 1.4.9 law is
  // opacity + y only.
  const inline = card?.getAttribute('style') || '';
  check('modal: the entrance speaks no scale (fade + rise only)', !/scale\(/.test(inline));
  root.render(React.createElement('div', null, null));
}

// --- 9. CharacterView: the rows tray + the COLLAPSE key stay in flow -------
{
  const char = mkChar({
    id: 'c9', name: 'Rows', tags: ['t1'], stamps: [],
    versions: [{ id: 'v1', label: 'v1', parts: [], images: [{ id: 'i1', file: 'cover.png', addedAt: 1 }], createdAt: 1 }],
  });
  root.render(
    React.createElement(CharacterView, {
      compact: true, character: char, tags: [{ id: 't1', name: 'Alpha', color: '#ffaa00' }],
      stampLibrary: [], imagesPath: 'C:/img', cardDefaultRatio: { w: 3, h: 4 },
      onBack: noop, patchCharacter: noop, onDelete: noop, onToggleTag: noop,
      onOpenTagManager: noop, onReorderTags: noop, onAttachStamp: noop, onRemoveStamp: noop,
      onPromoteStamp: noop, onUploadStamp: noop, onRenameStamp: noop, onReorderStamps: noop,
      onStampColor: noop, onStampTransform: noop, confirm: noop, onStatus: noop,
      onActiveVersion: noop, stagedMount: true,
    })
  );
  await settle();
  await settle();
  const tray = document.querySelector('.gd-rows-tray');
  check('rows: the tray renders', !!tray);
  const expandKey = document.querySelector('.gd-rows-expand');
  check('rows: the COLLAPSE key renders in the tray (always visible)', !!expandKey && tray?.contains(expandKey));
  const seats = [...document.querySelectorAll('.gd-side-seat')];
  check('rows: both rows seat in the flow (no cover rungs)', seats.every((s) => !s.classList.contains('is-cover-seat') && !s.classList.contains('gd-cover-row-tags') && !s.classList.contains('gd-cover-row-stamps')));
}

console.log(failures === 0 ? '\n1.4.9 LIVE VERIFY: ALL PASSED' : `\n1.4.9 LIVE VERIFY: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
