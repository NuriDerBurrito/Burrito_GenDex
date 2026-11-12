// 1.4.8 live verification: render the changed pieces in jsdom.
import { readFileSync } from 'node:fs';
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
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.matchMedia = global.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
global.CSS = { supports: () => true, escape: (v) => v };

const Module = require('module');

// Transpile every .jsx on the fly (nested requires included — the smoke
// harness's own law), so a component's imports load as cleanly as it does.
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
const { migrateCardFinish, CARD_FINISHES } = loadJsx('constants/index.js');

const root = createRoot(document.getElementById('root'));

let failures = 0;
const check = (name, cond) => {
  console.log(`${cond ? '  ok —' : '  FAIL —'} ${name}`);
  if (!cond) failures += 1;
};
const settle = () => new Promise((r) => setTimeout(r, 12));

// --- 1. CardFinishLayer: every finish × image effect -----------------------
for (const finish of ['mumei', 'foil', 'holographic', 'prismatic', 'nuri', 'none']) {
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
    // the veil law: every seat veils while the switch is off (incl. the stars)
    check(`${finish} onImage=${onImage}: seats ${onImage ? 'revealed' : 'veiled'}`,
      veiled.length === (onImage ? 0 : seats.length));
    if (finish === 'prismatic') {
      const stars = document.querySelector('.gd-prism-stars');
      check(`prismatic onImage=${onImage}: stars veil with the family`, !!stars && (onImage || stars.classList.contains('is-plate-only')));
    }
    if (finish === 'mumei') {
      check(`mumei onImage=${onImage}: four materials speak`,
        !!document.querySelector('.gd-finish-mumei') &&
        !!document.querySelector('.gd-mumei-streams') &&
        !!document.querySelector('.gd-mumei-feathers') &&
        !!document.querySelector('.gd-mumei-moon'));
      check(`mumei onImage=${onImage}: artfin ${onImage ? 'present' : 'absent'}`,
        document.querySelectorAll('.gd-artfin-mumei').length === (onImage ? 1 : 0));
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

// --- 2. the migration map ---------------------------------------------------
check('migration: opalescent -> mumei', migrateCardFinish('opalescent') === 'mumei');
check('migration: chromatic -> mumei', migrateCardFinish('chromatic') === 'mumei');
check('migration: polychrome -> mumei', migrateCardFinish('polychrome') === 'mumei');
check('migration: nuri keeps its seat', migrateCardFinish('nuri') === 'nuri');
check('the ladder seats mumei, not the pearl', CARD_FINISHES.some((f) => f.id === 'mumei') && !CARD_FINISHES.some((f) => f.id === 'opalescent'));

// --- 3. CardStyleControls: stamp motion stands alone ------------------------
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
    hasImage: false,
    hasStamp: true,
  })
);
await settle();
{
  const labels = [...document.querySelectorAll('.gd-check-row span')].map((s) => s.textContent);
  check('stamp motion seated with a stamp, image motion off', labels.includes('stamp motion'));
  const rows = [...document.querySelectorAll('.gd-check-row')];
  const smRow = rows.find((r) => r.querySelector('span')?.textContent === 'stamp motion');
  check('stamp motion LIVE (no grey) with a stamp alone', smRow && !smRow.classList.contains('is-off'));
  const input = smRow?.querySelector('input');
  check('stamp motion input enabled with a stamp alone', input && !input.disabled);
}
root.render(
  React.createElement(CardStyleControls, {
    finish: 'none', finishOnImage: false, onFinish: () => {}, onFinishOnImage: () => {},
    imageMotion: false, onImageMotion: () => {},
    stampMotion: false, onStampMotion: () => {},
    hasImage: true, hasStamp: false,
  })
);
await settle();
{
  const rows = [...document.querySelectorAll('.gd-check-row')];
  const smRow = rows.find((r) => r.querySelector('span')?.textContent === 'stamp motion');
  check('stamp motion GREYED with no stamp', smRow && smRow.classList.contains('is-off'));
  const input = smRow?.querySelector('input');
  check('stamp motion input blind with no stamp', input && input.disabled);
}

// --- 4. GridView: the under-art scope + tint var + add tile -----------------
const mkChar = (over) => ({
  id: 'c1', name: 'Verify', classId: 'root', tags: [], previewVersionId: null,
  cardRatio: { w: 3, h: 4 }, cardTrim: 'dash',
  cardFinish: 'nuri', cardFinishOnImage: false,
  cardColor: '#3355aa',
  stamps: [],
  versions: [{ id: 'v1', label: 'v1', parts: [], images: [{ id: 'i1', file: 'cover.png', addedAt: 1 }], createdAt: 1 }],
  stampSettings: { color: null },
});
const noop = () => {};
const dragRef = { current: null };
root.render(
  React.createElement(GridView, {
    characters: [mkChar(false)], tags: [], stamps: [], imagesPath: 'C:/img', zoom: 2, tagScale: 1,
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
  const coat = card?.querySelector('.gd-finish-nuri');
  check('grid: the nuri body seats (tint veil rides its ::before in CSS)', !!coat);
  const add = document.querySelector('.gd-card-add');
  check('grid: the add tile carries the pulse class', !!add && add.classList.contains('gd-card-pulse'));
}

// --- 5. the squish survives re-renders (the attribute law, re-proven) -------
{
  const card = document.querySelector('.gd-card');
  card.setAttribute('data-pressed', '1');
  // simulate the selection commit rewriting the className underneath
  card.className = `${card.className} gd-card-selected`;
  check('grid: [data-pressed] survives a className rewrite', card.hasAttribute('data-pressed'));
}

console.log(failures ? `\n${failures} FAILURES` : '\nALL LIVE CHECKS PASSED');
process.exit(failures ? 1 : 0);
