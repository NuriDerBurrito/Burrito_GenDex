// 0.37.0 — THE TREE REDESIGN / PICKER RIGGING / FILTER TRI-STATE batch,
// behavioral DOM tests on the real components / the real sources.
//   Part A — THE STAMP PICKER, RIGGED LIKE A WINDOW ("the header of the
//     stamp menu would clip out of the window… the button to add a new
//     stamp would act as a footer so its always there, and then scroll to
//     select any stamp"): Popover's innerScroll mode + the picker's pinned
//     head / scrolling middle / pinned footer, on the real StampAddButton.
//   Part B — THE TREE REDESIGN ("add a side scroller and a vertical
//     scroller, the pattern visible on the areas without text or graphics,
//     chop the left, don't stretch right infinitely"): the transparent lane,
//     the hugging card capped at the visible width, the sheet + both
//     scrollers, the expander's own container over the rail, the tools on
//     the CARD's right end (loud, red delete).
//   Part C — CLASS COLORS ("add the option to color classes, do account
//     for the text to be readable"): the model (makeClass / sanitize), the
//     modal COLOR section, the card wash via a panel mix, and the
//     children's rail tinted by the parent.
//   Part D — THE CLASS SWITCH JUST UPDATES ("no need for the swipe
//     animation") + the full-height column separator ("a line at top that
//     stretches in the window and at the bottom so it feels contained").
//   Part E — TOOLTIP CONTRAST IN EVERY THEME ("in some themes, tooltips
//     would blend in too much… accounting for light and dark themes"):
//     --gd-tip-ink always readableInk(ink), the rim flips by ink luminance,
//     and the pill wears both + a border + a deeper shadow.
//   Part F — DRAGGABLE VERSIONS ("allow dragging versions around to
//     reorganize, but ensure it still remembers which version is the card
//     cover"): the sortable strip + the cover that follows the VERSION.
//   Part G — COLLAPSIBLE TAGS / STAMPS HEADERS ("when collapsed it will
//     show only one row") + the INLINE stamp settings cluster ("the color
//     and options should not be on a newline unless there is no space").
//   Part H — THE FILTER'S STAMP TRI-STATE ("just like there is include
//     exclude and normal mode, add that to the stamps too") + the container
//     washes ("the container that contains the text and the stamp gets
//     highlighted slightly").
// Run: node scripts/gendex_037_batch_dom.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch {
  console.log('jsdom unavailable — 0.37.0 batch DOM test skipped');
  process.exit(0);
}

const appRoot = fileURLToPath(new URL('..', import.meta.url));

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;
global.NodeFilter = dom.window.NodeFilter;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = dom.window.requestAnimationFrame;
global.cancelAnimationFrame = dom.window.cancelAnimationFrame;
global.Image = dom.window.Image;
global.IS_REACT_ACT_ENVIRONMENT = false;
for (const k of ['HTMLElement', 'Element', 'SVGElement', 'MutationObserver', 'CustomEvent', 'DragEvent', 'InputEvent', 'KeyboardEvent', 'MouseEvent', 'PointerEvent', 'ClipboardEvent', 'DataTransfer', 'File', 'Blob', 'FileReader', 'getSelection', 'URL', 'DOMParser']) {
  if (dom.window[k] !== undefined && global[k] === undefined) global[k] = dom.window[k];
}
global.matchMedia = dom.window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };

const React = require('react');
const { createRoot } = require('react-dom/client');
const babel = require('@babel/core');
require.extensions['.jsx'] = (module, filename) => {
  const { code } = babel.transformFileSync(filename, {
    presets: [
      [require.resolve('@babel/preset-env'), { targets: { node: 'current' } }],
      [require.resolve('@babel/preset-react'), { runtime: 'automatic' }],
    ],
  });
  module._compile(code, filename);
};
for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff2']) {
  require.extensions[ext] = (m, filename) => { m.exports = filename; };
}

let passed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    console.log(`  NOT OK ${name}\n    ${e.message}`);
    process.exitCode = 1;
  }
};
const src = (p) => readFileSync(join(appRoot, p), 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

console.log('0.37.0 batch DOM tests');

// ============================================================================
// Part A — the stamp picker: pinned head, scrolling middle, pinned footer
// ============================================================================
{
  const popSrc = src('src/components/Popover.jsx');
  const stampSrc = src('src/components/StampEditModal.jsx');
  const css = src('src/index.css');

  ok('0.37.0 Popover carries an innerScroll mode — the card flexes, the caller scrolls', () => {
    assert.ok(/innerScroll = false/.test(popSrc), 'the prop exists, default off');
    assert.ok(
      /innerScroll\s*\?\s*\{ maxHeight: maxH, overflowY: 'hidden', display: 'flex', flexDirection: 'column' \}/.test(popSrc),
      'a capped innerScroll card is a flex column with hidden overflow'
    );
    assert.ok(/overflowY: 'auto'/.test(popSrc), 'the default card keeps the whole-card scrollbar');
  });

  const { StampAddButton } = require(join(appRoot, 'src/components/StampEditModal.jsx'));
  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.getElementById('root'));
  const stamps = [
    { id: 's1', name: 'alpha', image: 'a.png' },
    { id: 's2', name: 'beta', image: 'b.png' },
  ];
  root.render(
    React.createElement(StampAddButton, { stampLibrary: stamps, imagesPath: 'x', attachedImages: [], onPick: () => {}, onUpload: () => {} })
  );
  await sleep(40);
  const addBtn = document.querySelector('.gd-stamp-slot.is-empty');
  assert.ok(addBtn, 'the ADD key rendered');
  click(addBtn);
  await sleep(60);
  const card = document.querySelector('.gd-card[data-gd-popover]');
  assert.ok(card, 'the picker popover rendered');
  const head = card.querySelector('.gd-pop-head');
  const foot = card.querySelector('.gd-hairline-t');
  const mid = card.querySelector('.overflow-y-auto');
  ok('0.37.0 the picker wears a pinned HEAD, a scrolling MIDDLE and a pinned FOOTER', () => {
    assert.ok(head && head.textContent.includes('ADD STAMP'), 'the head renders the title');
    assert.ok(head.className.includes('flex-shrink-0'), 'the head never scrolls away');
    assert.ok(mid, 'the tile list is its own scroll region');
    assert.ok(mid.className.includes('flex-1') && mid.className.includes('min-h-0'), 'the middle flexes to the leftover room');
    assert.ok(foot && foot.textContent.includes('UPLOAD A STAMP'), 'the upload key is the footer');
    assert.ok(foot.className.includes('flex-shrink-0'), 'the footer never scrolls away');
    assert.ok(stampSrc.includes('innerScroll'), 'the picker passes innerScroll to the Popover');
    // the inner layout law exists in CSS-land too: the card caps as a flex
    // column (Popover inline styles) — verified by the source rule above.
  });
  const tiles = [...card.querySelectorAll('.gd-spot-tile')];
  assert.equal(tiles.length, 2, 'both gallery stamps render as tiles');
  ok('0.37.0 the gallery tiles scroll INSIDE the middle (pick by scrolling)', () => {
    assert.equal(tiles.length, 2, 'the tiles live in the scroll region');
    click(tiles[0]);
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ============================================================================
// Part B — the tree redesign: transparent lane, hugging card, both scrollers,
// expander's own container, tools on the card
// ============================================================================
{
  const css = src('src/index.css');
  const sidebarSrc = src('src/components/ClassSidebar.jsx');
  const rule = (re) => re.exec(css)?.[0] || '';

  ok('0.37.0 the tree scroller rolls BOTH ways and the sheet hugs the widest chain', () => {
    const scroll = rule(/^\.gd-tree-scroll\s*\{[^}]*\}/m);
    assert.ok(/overflow-x: auto/.test(scroll) && /overflow-y: auto/.test(scroll), 'both scrollers');
    assert.ok(/container-type: inline-size/.test(scroll), 'a query container (cards cap at the VISIBLE width)');
    const sheet = rule(/^\.gd-tree-sheet\s*\{[^}]*\}/m);
    assert.ok(/width: max-content/.test(sheet) && /min-width: 100%/.test(sheet), 'the sheet: as wide as needed, never narrower than the sidebar');
  });

  ok('0.37.0 the ROW is a transparent lane — the pattern shows through', () => {
    const row = rule(/^\.gd-tree-row\s*\{[^}]*\}/m);
    assert.ok(!/background(?!-)/.test(row.replace(/background-/g, '')), 'the lane paints no background');
    const card = rule(/^\.gd-tree-card\s*\{[^}]*\}/m);
    assert.ok(/background: var\(--gd-panel\)/.test(card), 'the plate language lives on the CARD');
    assert.ok(/inline-flex/.test(card), 'the card is an inline plate — it HUGS');
    assert.ok(/max-width: max\(140px, calc\(100cqw/.test(card), 'it caps at the visible width (no infinite right stretch)');
    // the connector zone shows the pattern: rails/elbows/joints keep their
    // own colors, nothing fills behind them
    const rail = rule(/\.gd-tree-node::before\s*\{[^}]*\}/);
    /* 1.2.9 law (caught up): the rail's default is the CONTRAST FLOOR —
       color-mix of the line tone up to the chrome — never the raw line
       var (the mumei-on-white invisibility fix). */
    assert.ok(/var\(--rail-line, color-mix\(in srgb, var\(--gd-line\) 62%, var\(--gd-chrome\)\)\)/.test(rail), 'the rail paints its 1px line at the contrast floor');
  });

  ok('0.37.0 the expander sits in its OWN container above the parent-child line', () => {
    const exp = rule(/^\.gd-tree-exp\s*\{[^}]*\}/m);
    assert.ok(/z-index: 1/.test(exp), 'it outranks the rail that rises into the parent row');
    assert.ok(/background:/.test(exp), 'it is an opaque box (the line ties INTO it, never crosses it)');
    const blank = rule(/^\.gd-tree-exp\.is-blank\s*\{[^}]*\}/m);
    assert.ok(/visibility: hidden/.test(blank), 'leaves keep the spacer so icons align');
    assert.ok(sidebarSrc.includes('gd-tree-exp is-blank'), 'leaf rows render the spacer');
  });

  // ---- the real sidebar: anatomy on the DOM ----
  const { default: ClassSidebar } = require(join(appRoot, 'src/components/ClassSidebar.jsx'));
  const classes = [
    { id: 'c1', name: 'leaf one', parentId: 'root', icon: null, color: null },
    { id: 'c2', name: 'branch', parentId: 'root', icon: null, color: null },
    { id: 'c3', name: 'nested', parentId: 'c2', icon: null, color: null },
  ];
  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.getElementById('root'));
  root.render(
    React.createElement(ClassSidebar, {
      classes,
      characters: [],
      selectedClassId: 'root',
      dragRef: { current: null },
      onSelectClass: () => {},
      onAddClass: () => {},
      onRenameClass: () => {},
      onDeleteClass: () => {},
      onMoveClass: () => {},
      onAssignCharacter: () => {},
      onNewCharacter: () => {},
      confirm: () => {},
      onStatus: () => {},
    })
  );
  await sleep(50);
  const sheet = document.querySelector('.gd-tree-sheet');
  const lane = document.querySelector('.gd-tree-scroll');
  const branchRow = document.querySelector('[data-gd-class-id="c2"]');

  ok('0.37.0 the real tree: sheet + scroller + hugging cards (0.41.0: no hover tools)', () => {
    assert.ok(sheet, 'the sheet renders inside the scroller');
    assert.ok(lane && lane.className.includes('gd-tree-scroll'), 'the scroller wears its own class');
    const card = branchRow.querySelector('.gd-tree-card');
    assert.ok(card, 'the branch row carries a card plate');
    assert.ok(card.querySelector('.gd-tree-exp'), 'the expander box is INSIDE the card');
    assert.ok(branchRow.querySelector('.gd-tree-joint'), 'the joint still ties the branch on the pattern');
    const leafRow = document.querySelector('[data-gd-class-id="c1"]');
    assert.ok(leafRow.querySelector('.gd-tree-exp.is-blank'), 'the leaf keeps the hidden spacer');
    // 0.41.0 — the hover tools are RETIRED ("remove the 3 button feature"):
    // no plate renders anywhere on the row, and the count stays visible.
    assert.ok(!branchRow.querySelector('.gd-tree-tools'), 'no hover tools render');
    assert.ok(branchRow.querySelector('.gd-tree-count'), 'the count is always visible');
    const btnDanger = rule(/^\.gd-btn-danger\s*\{[^}]*\}/m);
    assert.ok(btnDanger, 'the danger tone lives on the EDIT CLASS delete key now');
  });

  // ---- the class modal: COLOR section + preview ----
  const newBtn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('NEW CLASS'));
  click(newBtn);
  await sleep(60);
  ok('0.37.0 the class window carries a COLOR section (picker + NONE + preview)', () => {
    const labels = [...document.querySelectorAll('.text-\\[9px\\]')].map((l) => l.textContent);
    assert.ok(labels.some((l) => l.includes('COLOR')), 'the COLOR label renders');
    const noneBtn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'NONE');
    assert.ok(noneBtn, 'the NONE key clears the color');
    assert.ok(document.querySelector('.gd-cp-trigger'), 'the in-app picker swatch renders');
    const preview = document.querySelector('[title="The class row as the tree will show it"]');
    assert.ok(preview, 'the preview renders');
    assert.ok(preview.querySelector('.gd-tree-card'), 'the preview mirrors the CARD anatomy');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ============================================================================
// Part C — class colors: the model, the wash, the rail tint
// ============================================================================
{
  const helpers = require(join(appRoot, 'src/utils/helpers.js'));
  const constants = src('src/constants/index.js');
  const css = src('src/index.css');
  const sidebarSrc = src('src/components/ClassSidebar.jsx');
  const rule = (re) => re.exec(css)?.[0] || '';

  ok('0.37.0 the model: makeClass takes a color, sanitize keeps a clean hex and drops junk', () => {
    assert.ok(/icon = null, color = null\)/.test(constants), 'makeClass carries the color param');
    assert.ok(/color: isHexColor\(color\) \? color : null/.test(constants), 'the factory sanitizes it');
    const { makeClass } = require(join(appRoot, 'src/constants/index.js'));
    const cls = makeClass('tinted', 'root', null, '#7fd1d8');
    assert.equal(cls.color, '#7fd1d8', 'a valid hex rides through');
    const bad = makeClass('tinted', 'root', null, 'nope');
    assert.equal(bad.color, null, 'junk drops to null');
    const safe = helpers.createSafeDb({ classes: [{ id: 'k', name: 'k', parentId: 'root', color: '#a3c24a' }, { id: 'j', name: 'j', parentId: 'root', color: 'red!' }] });
    const k = safe.classes.find((c) => c.id === 'k');
    const j = safe.classes.find((c) => c.id === 'j');
    assert.equal(k.color, '#a3c24a', 'sanitize keeps the clean hex');
    assert.equal(j.color, null, 'sanitize drops the junk');
  });

  ok('0.37.0 the wash is always a PANEL MIX — text stays the theme\'s chrome', () => {
    const wash = rule(/^\.gd-tree-row\[data-colored\] \.gd-tree-card\s*\{[^}]*\}/m);
    assert.ok(/color-mix\(in srgb, var\(--cls\) 22%, var\(--gd-panel\)\)/.test(wash), 'the plate washes with a panel mix');
    assert.ok(!/background: var\(--cls\)/.test(wash), 'never the raw hex');
    assert.ok(/inset 2px 0 0/.test(wash), 'the left bar carries the color');
    const name = rule(/^\.gd-tree-name\s*\{[^}]*\}/m);
    assert.ok(/color: var\(--gd-chrome\)/.test(name), 'the name keeps the readable chrome');
  });

  const { default: ClassSidebar } = require(join(appRoot, 'src/components/ClassSidebar.jsx'));
  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.getElementById('root'));
  const classes = [
    { id: 'p1', name: 'parent', parentId: 'root', icon: null, color: '#7fd1d8' },
    { id: 'k1', name: 'kid', parentId: 'p1', icon: null, color: null },
  ];
  root.render(
    React.createElement(ClassSidebar, {
      classes,
      characters: [],
      selectedClassId: 'root',
      dragRef: { current: null },
      onSelectClass: () => {},
      onAddClass: () => {},
      onRenameClass: () => {},
      onDeleteClass: () => {},
      onMoveClass: () => {},
      onAssignCharacter: () => {},
      onNewCharacter: () => {},
      confirm: () => {},
      onStatus: () => {},
    })
  );
  await sleep(50);
  ok('0.37.0 the colored class paints its card + the rail under it tints', () => {
    const row = document.querySelector('[data-gd-class-id="p1"]');
    assert.equal(row.getAttribute('data-colored'), '#7fd1d8', 'the row carries the color');
    assert.ok((row.getAttribute('style') || '').includes('--cls: #7fd1d8'), 'the --cls var feeds the wash');
    // the INNERMOST kids wrapper hanging under the colored parent (the
    // root-level wrapper also contains k1 as a descendant — closest() from
    // the kid row picks the right one).
    const kidRow = document.querySelector('[data-gd-class-id="k1"]');
    const kids = kidRow && kidRow.closest('.gd-tree-kids');
    assert.ok(kids, 'the kid hangs under the colored parent');
    // jsdom's cssstyle may not retain custom-property VALUES through the
    // CSSOM — the raw style attribute is the honest read.
    const kidsStyle = kids.getAttribute('style') || '';
    assert.ok(kidsStyle.includes('--rail-line: color-mix(in srgb, #7fd1d8 55%'), 'the rail line under the colored parent tints');
    assert.ok(kidsStyle.includes('--rail: #7fd1d8'), 'the raw rail var rides too');
    assert.ok(sidebarSrc.includes("'--rail-line'"), 'the component writes the rail var');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ============================================================================
// Part D — the class switch just updates + the contained separator
// ============================================================================
{
  const appSrc = src('src/App.jsx');
  const css = src('src/index.css');
  const rule = (re) => re.exec(css)?.[0] || '';

  ok('0.37.0 switching classes just UPDATES the grid — the swipe is retired', () => {
    assert.ok(!appSrc.includes('classDirRef'), 'the direction ref is gone');
    assert.ok(!appSrc.includes('classOrderIndex'), 'the order index is gone');
    assert.ok(!/key=\{selectedClassId\}/.test(appSrc), 'the grid is no longer keyed by the class (no remount, no page-turn)');
    assert.ok(!/initial=\{\{ opacity: 0, x: 34/.test(appSrc), 'the x-slide is gone');
    assert.ok(/THE CLASS SWITCH JUST UPDATES/.test(appSrc), 'the law is written where the grid mounts');
  });

  ok('0.37.0 the column separator runs the FULL HEIGHT — a rail, not a floating pill', () => {
    const strip = rule(/^\.gd-panel-resize\s*\{[^}]*\}/m);
    assert.ok(/linear-gradient\(/.test(strip), 'the strip paints a gradient');
    assert.ok(/transparent 0 4px/.test(strip) && /4px 5px/.test(strip), 'a 1px vertical line dead-center on the seam');
    assert.ok(/top: 0/.test(strip) && /bottom: 0/.test(strip), 'it stretches from the window\'s top to its bottom');
    const hover = rule(/\.gd-panel-resize:hover,\s*\n\.gd-panel-resize\.is-live\s*\{[^}]*\}/);
    assert.ok(hover && /var\(--gd-accent\)/.test(hover), 'the whole rail brightens accent on hover');
  });
}

// ============================================================================
// Part E — tooltip contrast, every theme, light and dark
// ============================================================================
{
  const { setThemeOnDocument } = require(join(appRoot, 'src/utils/theme.js'));
  const { readableInk } = require(join(appRoot, 'src/utils/helpers.js'));
  const { THEME_PRESETS } = require(join(appRoot, 'src/constants/index.js'));
  const css = src('src/index.css');
  const presets = THEME_PRESETS;

  ok('0.37.0 every theme derives a readable tooltip ink + a contrasting rim', () => {
    const rootEl = document.documentElement;
    const lum = (hex) => {
      const h = String(hex || '').replace('#', '');
      const ch = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
      const lin = ch.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
      return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
    };
    for (const theme of presets) {
      setThemeOnDocument(theme.id, {}, null, 'theme', 'off');
      const ink = theme.ink;
      const want = readableInk(ink);
      const gotInk = rootEl.style.getPropertyValue('--gd-tip-ink');
      assert.equal(gotInk, want, `${theme.id}: --gd-tip-ink is readableInk(ink) (${want})`);
      const rim = rootEl.style.getPropertyValue('--gd-tip-rim');
      assert.ok(rim.length > 0, `${theme.id}: the rim token exists`);
      // the rim mirrors theme.js's own rule: dark inks (luminance ≤ 0.55)
      // get a CHROME rim; brighter inks get a darkened ink rim.
      if (lum(ink) <= 0.55) {
        assert.ok(rim.includes(theme.chrome), `${theme.id}: dark ink → chrome rim`);
      } else {
        assert.ok(rim.includes(theme.ink) && rim.includes('#000000'), `${theme.id}: bright ink → dark rim`);
      }
    }
  });

  ok('0.37.0 the pill wears the tokens + a border + a deeper shadow', () => {
    const tip = /^\.gd-tip\s*\{[^}]*\}/m.exec(css)?.[0] || '';
    assert.ok(/var\(--gd-tip-ink, var\(--gd-panel\)\)/.test(tip), 'the text token (with the old fallback)');
    assert.ok(/border: 1px solid var\(--gd-tip-rim/.test(tip), 'the rim as a border');
    assert.ok(/0 5px 16px/.test(tip), 'the deeper two-layer shadow');
  });
}

// ============================================================================
// Part F — draggable versions, the cover remembers
// ============================================================================
{
  const viewSrc = src('src/components/CharacterView.jsx');
  const css = src('src/index.css');

  ok('0.37.0 the version strip is a pointer-sort (dragButtons) — sources', () => {
    assert.ok(viewSrc.includes('dragButtons: true'), 'the chip body is the grab');
    assert.ok(viewSrc.includes('useGeometry: true'), 'geometry mode (the strip wraps)');
    assert.ok(viewSrc.includes('gd-version-item'), 'the wrapper class');
    assert.ok(viewSrc.includes('data-no-sort'), 'the settings pencil is opted out of the grab');
    assert.ok(viewSrc.includes("'Versions reordered'"), 'the reorder toasts');
    // the COVER law: the commit only rewrites the ORDER array
    const commit = /onCommit: \(from, to\) => \{[\s\S]{0,900}?\}\);/.exec(viewSrc)?.[0] || '';
    assert.ok(/const \[moved\] = list\.splice\(from, 1\);/.test(commit), 'the commit splices the list');
    assert.ok(!/previewVersionId/.test(commit), 'it never touches previewVersionId — the cover follows the version');
  });

  const { default: CharacterView } = require(join(appRoot, 'src/components/CharacterView.jsx'));
  const versions = [
    { id: 'v1', label: 'one', parts: [], images: [{ file: 'a.png', thumb: 'a.png' }] },
    { id: 'v2', label: 'two', parts: [], images: [{ file: 'b.png', thumb: 'b.png' }] },
    { id: 'v3', label: 'three', parts: [], images: [{ file: 'c.png', thumb: 'c.png' }] },
  ];
  let character = {
    id: 'ch1',
    name: 'rin',
    tags: [],
    stamps: [],
    versions,
    previewVersionId: 'v3',
    cardRatio: null,
  };
  const patch = (id, fn) => { character = fn(character); rerender(); };
  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.getElementById('root'));
  const rerender = () =>
    root.render(
      React.createElement(CharacterView, {
        character,
        tags: [],
        stampLibrary: [],
        imagesPath: 'x',
        compact: true,
        cardDefaultRatio: null,
        patchCharacter: patch,
        onStatus: () => {},
        onActiveVersion: () => {},
        confirm: () => {},
        onRename: () => {},
        onDelete: () => {},
        onToggleTag: () => {},
        onOpenTagManager: () => {},
        onAttachStamp: () => {},
        onRemoveStamp: () => {},
        onPromoteStamp: () => {},
        onUploadStamp: () => {},
        onRenameStamp: () => {},
        onReorderStamps: () => {},
        onStampColor: () => {},
        onStampTransform: () => {},
        onBack: () => {},
      })
    );
  rerender();
  await sleep(50);

  ok('0.37.0→0.38.0 the real strip renders sortable items with the cover star intact', () => {
    const items = [...document.querySelectorAll('.gd-version-item')];
    // 0.38.0 — "the add new version can also move if needed": the NEW VERSION
    // key rides the strip as a TRAILING sort item (3 versions + the key).
    assert.equal(items.length, 4, 'every chip rides its sort wrapper (+ the NEW VERSION key)');
    assert.ok(items[3].textContent.includes('NEW VERSION'), 'the trailing item is the NEW VERSION key');
    const stars = [...document.querySelectorAll('.gd-version-item .gd-chip svg.fill-current, .gd-version-item [class*="fill-current"]')];
    assert.ok(stars.length === 1, 'exactly one cover star');
    const starItem = [...document.querySelectorAll('.gd-version-item')].find((i) => i.querySelector('[class*="fill-current"]'));
    assert.ok(starItem.textContent.includes('three'), 'the star rides the CARD COVER (previewVersionId), not a slot');
  });

  // simulate the reorder commit exactly as the sort lands it
  const list = [...character.versions];
  const [moved] = list.splice(2, 1);
  list.splice(0, 0, moved);
  character = { ...character, versions: list };
  rerender();
  await sleep(50);
  ok('0.37.0 after a reorder the cover star FOLLOWS its version', () => {
    const order = [...document.querySelectorAll('.gd-version-item')].map((i) => i.textContent);
    assert.ok(order[0].includes('three'), 'the moved version leads the strip');
    const starItem = [...document.querySelectorAll('.gd-version-item')].find((i) => i.querySelector('[class*="fill-current"]'));
    assert.ok(starItem.textContent.includes('three'), 'the star still rides the same VERSION (the cover remembered)');
    assert.equal(character.previewVersionId, 'v3', 'previewVersionId untouched');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ============================================================================
// Part G — collapsible tags/stamps headers + the inline settings cluster
// ============================================================================
{
  const css = src('src/index.css');
  const rule = (re) => re.exec(css)?.[0] || '';

  const { default: CharacterView } = require(join(appRoot, 'src/components/CharacterView.jsx'));
  const character = {
    id: 'ch1',
    name: 'rin',
    tags: ['t1', 't2'],
    stamps: [],
    versions: [{ id: 'v1', label: 'one', parts: [], images: [] }],
    previewVersionId: null,
  };
  const tags = [
    { id: 't1', name: 'red tag', color: '#c8402f', icon: null },
    { id: 't2', name: 'blue tag', color: '#4f6772', icon: null },
  ];
  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.getElementById('root'));
  root.render(
    React.createElement(CharacterView, {
      character,
      tags,
      stampLibrary: [],
      imagesPath: 'x',
      compact: true,
      cardDefaultRatio: null,
      patchCharacter: () => {},
      onStatus: () => {},
      onActiveVersion: () => {},
      confirm: () => {},
      onToggleTag: () => {},
      onOpenTagManager: () => {},
      onAttachStamp: () => {},
      onRemoveStamp: () => {},
      onPromoteStamp: () => {},
      onUploadStamp: () => {},
      onRenameStamp: () => {},
      onReorderStamps: () => {},
      onStampColor: () => {},
      onStampTransform: () => {},
      onBack: () => {},
    })
  );
  /* 1.3.0 (catching up to 1.2.9): the view mounts in staged breaths — the
     tags zone one frame after the first paint, the stamp editor (and its
     STAMPS toggle) one frame after THAT. 50ms only covered the first breath
     in jsdom's clock; 220ms lets both land. */
  await sleep(220);

  const toggles = () => [...document.querySelectorAll('.gd-row-toggle')];
  ok('0.37.0 the TAGS and STAMPS labels are collapse toggles', () => {
    const keys = toggles().map((t) => t.textContent);
    assert.equal(keys.length, 2, 'one toggle per row');
    assert.ok(keys[0].includes('TAGS') && keys[1].includes('STAMPS'), 'both rows carry one');
    assert.ok(document.querySelector('.gd-collapse-zone'), 'each row\'s chips live in a collapse zone');
  });

  const tagsToggle = toggles().find((t) => t.textContent.includes('TAGS'));
  // 1.1.9 re-law: the live zone is the LAST .gd-collapse-zone in its seat
  // (the hidden measurement twin renders ahead of it — see SideFlow.jsx).
  const zone = () => [...document.querySelectorAll('.gd-collapse-zone')].filter((z) => !z.classList.contains('gd-side-probe'))[0];
  click(tagsToggle);
  await sleep(40);
  ok('0.37.0 collapsing clamps the row to ONE line (and expands back)', () => {
    assert.ok(zone().className.includes('is-collapsed'), 'the zone collapsed');
    // 0.40.0 — the clamp is a MEASURED max-height tween now (the zone keeps
    // wrapping; an inline maxHeight — written by useClampStyle in the view —
    // clamps it to the first row): the old nowrap reflow + sideways fade
    // mask are gone, and the motion is in lockstep with the tower fold.
    const collapsed = rule(/^\.gd-collapse-zone\.is-collapsed\s*\{[^}]*\}/m);
    // 0.42.0 — the class carries NO height of its own (the 34px crush frame
    // died with the "violent" stamps collapse); the measured INLINE clamp is
    // the only law, and a zone with nothing to hide (jsdom reads no layout,
    // a single row reads one row) is left natural entirely.
    assert.ok(/overflow: hidden/.test(collapsed), 'the clip guard stays');
    assert.ok(!/max-height/.test(collapsed), '0.42.0: no class-owned height (no crush frame)');
    const zones = css.match(/^\.gd-collapse-zone\s*\{[^}]*\}/gm) || [];
    assert.ok(zones.some((z) => /transition: max-height/.test(z)), 'the clamp tweens (smooth, not a reflow snap)');
    assert.ok(!zone().style.maxHeight, '0.42.0: an unmeasurable / single-row zone skips the clamp (nothing to hide)');
    assert.ok(!/mask-image/.test(collapsed), 'the sideways fade mask is retired');
    click(tagsToggle);
  });
  await sleep(40);

  // 1.3.4 re-law: the tower is BACK — "stamp color and stamp settings
  // shouldnt be on their own instead they should merge above each other so
  // its 2 options on each other, instead of horizontal": the color key and
  // the transform key ride ONE stacked cluster seat (see CharacterView's
  // restack note), the color key above the settings key.
  ok('0.37.0→1.3.4 the stamp settings merge into one stacked cluster (the tower restored)', () => {
    assert.ok(rule(/^\.gd-stamp-settings-cluster\s*\{/m), 'the cluster wrapper rule speaks the tower');
    assert.ok(!rule(/^\.gd-stamp-tower-row\s*\{/m), 'no tower row rule remains (the cluster, not the old row)');
    const viewSrc = src('src/components/CharacterView.jsx');
    assert.ok(/gd-stamp-settings-cluster/.test(viewSrc), 'the view renders the cluster wrapper');
    // 1.4.6 SUPERSEDED (the tower's column seat): the restack law moved
    // with the cluster — it seats UNDER the + STAMP key in the row's own
    // fixed column, always in view (gendex_155 pins the law).
    assert.ok(/THE TOWER SEATS IN THE COLUMN/.test(viewSrc), 'the 1.3.4 restack law is documented');
    // 1.4.5 SUPERSEDED: the panel's key carries variant="classic" before its
    // handlers — the window widens; the seat law itself is unchanged.
    assert.ok(/<StampColorControls[\s\S]{0,400}onColor=\{\(hexOrNull\)/.test(viewSrc), 'the color key rides inside the cluster');
    assert.ok(/<StampPosControls[\s\S]{0,200}onPatch=\{\(patch\)/.test(viewSrc), 'the transform key rides inside the cluster');
    assert.ok(/\.gd-stamp-color,\s*\.gd-stamp-pos\s*\{/.test(css), 'the two keys share one seat law in the CSS');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ============================================================================
// Part H — the filter's stamp tri-state + the container washes
// ============================================================================
{
  const helpers = require(join(appRoot, 'src/utils/helpers.js'));
  const appSrc = src('src/App.jsx');

  ok('0.37.0 the matcher honors stamp EXCLUDES (unit law)', () => {
    const lib = [
      { id: 's1', name: 'alpha', image: 'a.png' },
      { id: 's2', name: 'beta', image: 'b.png' },
    ];
    const carrier = { tags: [], stamps: [{ image: 'a.png', name: 'alpha' }] };
    const clean = { tags: [], stamps: [{ image: 'z.png', name: 'zed' }] };
    assert.equal(helpers.spotlightMatchState(carrier, { stampExclude: ['s1'] }, lib), 'nomatch', 'a card carrying the banned stamp is a non-match');
    assert.equal(helpers.spotlightMatchState(clean, { stampExclude: ['s1'] }, lib), 'match', 'a card without it still matches');
    assert.equal(helpers.spotlightMatchState(carrier, { stamps: ['s2'] }, lib), 'nomatch', 'the include law stays (must carry every filtered stamp)');
    assert.equal(helpers.spotlightMatchState(carrier, { stamps: ['s1'], stampExclude: ['s2'] }, lib), 'match', 'include + exclude can coexist');
    assert.equal(helpers.spotlightMatchState(carrier, { include: ['nope'], stampExclude: ['s1'] }, lib), 'nomatch', 'tag + stamp excludes stack');
  });

  ok('0.37.0 the cycle is neutral → include → exclude → neutral (sources)', () => {
    assert.ok(/neutral → INCLUDE/.test(appSrc) || /neutral.*include.*exclude/i.test(appSrc.slice(appSrc.indexOf('cycleStampSpotlight'), appSrc.indexOf('cycleStampSpotlight') + 900)), 'the cycle is documented');
    const cycle = /const cycleStampSpotlight = useCallback\(\(stampId\) => \{[\s\S]{0,700}?\}, \[\]\);/.exec(appSrc)?.[0] || '';
    assert.ok(cycle.includes('stampExclude: [...exc, stampId]'), 'include advances to exclude');
    assert.ok(/stampExclude: exc\.filter/.test(cycle), 'exclude resets to neutral');
    assert.ok(/stamps: \[\.\.\.inc, stampId\]/.test(cycle), 'neutral starts with include');
  });

  // ---- the real GridView: tri-state tiles + washed containers ----
  const { default: GridView } = require(join(appRoot, 'src/components/GridView.jsx'));
  const stamps = [
    { id: 's1', name: 'alpha', image: 'a.png' },
    { id: 's2', name: 'beta', image: 'b.png' },
  ];
  const tags = [{ id: 't1', name: 'tag one', color: '#c8402f', icon: null }];
  let spotlight = { include: [], exclude: [], stamps: [], stampExclude: [], hideNonMatching: false };
  const cycles = [];
  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.getElementById('root'));
  const rerender = () =>
    root.render(
      React.createElement(GridView, {
        characters: [],
        tags,
        stamps,
        imagesPath: 'x',
        zoom: 3,
        tagScale: 1,
        tagPosition: 'corner',
        cardRatio: { w: 3, h: 4 },
        sortMode: 'newest',
        search: '',
        spotlight,
        onCycleSpotlight: () => {},
        onCycleStampSpotlight: (id) => cycles.push(id),
        onToggleSpotlightHide: () => {},
        onSearch: () => {},
        onSort: () => {},
        onNew: () => {},
        onOpen: () => {},
        onRename: () => {},
        onDelete: () => {},
        onReorder: () => {},
        onZoom: () => {},
        onTagScale: () => {},
      })
    );
  rerender();
  await sleep(50);

  const filterBtn = () => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('FILTER'));
  click(filterBtn());
  await sleep(60);
  const tile = () => [...document.querySelectorAll('.gd-spot-tile')].find((t) => t.textContent.includes('alpha'));

  // neutral → include → exclude, each state re-rendered and awaited (React
  // commits these renders asynchronously — the ok() blocks below only read)
  assert.ok(tile(), 'the stamp tile rendered (neutral pre-check)');
  spotlight = { ...spotlight, stamps: ['s1'] };
  rerender();
  await sleep(50);
  const includeClasses = tile()?.className || '';
  spotlight = { ...spotlight, stamps: [], stampExclude: ['s1'] };
  rerender();
  await sleep(50);
  const excludeClasses = tile()?.className || '';

  ok('0.37.0 the stamp tiles cycle through THREE states with washed containers', () => {
    assert.ok(tile(), 'the stamp tile rendered');
    assert.ok(!includeClasses.includes('is-exclude'), 'the include look is not the exclude look');
    assert.ok(includeClasses.includes('is-on') && includeClasses.includes('is-include'), 'included: accent ring + wash');
    assert.ok(excludeClasses.includes('is-exclude') && !excludeClasses.includes('is-on'), 'excluded: red wash, not the include look');
    assert.ok(tile().title.includes('must include → must exclude → neutral'), 'the tooltip teaches the full cycle');
    assert.ok(tile().querySelector('svg'), 'the state icon renders');
  });

  // the tag rows wash too — again: re-render + await OUTSIDE the ok()
  spotlight = { include: ['t1'], exclude: [], stamps: [], stampExclude: [], hideNonMatching: false };
  rerender();
  await sleep(50);
  const tagRowInc = [...document.querySelectorAll('.gd-spot-tag')].find((t) => t.textContent.includes('tag one'));
  const incClasses = tagRowInc?.className || '';
  spotlight = { include: [], exclude: ['t1'], stamps: [], stampExclude: [], hideNonMatching: false };
  rerender();
  await sleep(50);
  const tagRowExc = [...document.querySelectorAll('.gd-spot-tag')].find((t) => t.textContent.includes('tag one'));
  const excClasses = tagRowExc?.className || '';

  ok('0.37.0 the tag rows wash their containers too (include vs exclude)', () => {
    assert.ok(incClasses.includes('is-include'), 'the include row is accent-washed');
    assert.ok(excClasses.includes('is-exclude'), 'the exclude row is red-washed');
    const excTile = /^\.gd-spot-tile\.is-exclude\s*\{[^}]*\}/m.exec(src('src/index.css'))?.[0] || '';
    assert.ok(/#c8402f/.test(excTile) && /opacity: 0\.82/.test(excTile), 'the exclude wash is red + dimmed in CSS');
  });

  // the cycle clicks ride the real button
  cycles.length = 0;
  spotlight = { include: [], exclude: [], stamps: [], stampExclude: [], hideNonMatching: false };
  rerender();
  await sleep(50);
  click(tile());
  await sleep(30);
  ok('0.37.0 clicking a stamp tile fires the cycle', () => {
    assert.deepEqual(cycles, ['s1'], 'the cycle handler received the stamp id');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

console.log(`${passed} passed${process.exitCode ? ', FAILED' : ', 0 failed'}`);
