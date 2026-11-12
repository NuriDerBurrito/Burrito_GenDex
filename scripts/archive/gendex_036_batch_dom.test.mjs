// 0.36.0 — THE RISE-DON'T-SCROLL / FEEDBACK-DEDUPE / GLYPH-WALL batch,
// behavioral DOM tests on the real components / the real sources.
//   Part A — WINDOWS RISE, DON'T SCROLL ("if its gonna clip at the bottom to
//     move the window up until it wont actually clip"): Modal's two budgets
//     (centered when it fits, top-aligned + growing when it doesn't, the
//     body scrollbar only past the top budget), the right-click menu's
//     taller-than-screen pin + inside scroll, and the Popover ladder
//     (extend at natural size → flip above → stoop with a scrollbar).
//   Part B — ONE VERDICT PER PASTE: the stage's PASTE key fires exactly ONE
//     toast for the no-image fail and ONE for the ok paste (the doubled
//     onStatus line is retired) — proven on the real ImageStage + ToastHub.
//   Part C — THE GLYPH WALL ON THE RIGHT: the NEW VERSION and the edit
//     version windows carry a permanent ICON PICKER column on the right,
//     the class creation window's own anatomy.
//   Part D — THE EDITOR BATCH: the U+S combo key (one home for underline +
//     strikethrough), the big/small exclusivity switch, the
//     first-selection popup fix (selectstart + document pointerup open the
//     gate), and the outline that stays visible under selection (the
//     backdrop-colored text-shadow ring).
//   Part E — THE TREE / GRID / SETTINGS / RESIZER / STAMP-LAYER batch:
//     the hover tools as an overlay plate (no sideways push, no h-scrollbar),
//     the class tree's graph-paper default, the drop-side midline at 50%,
//     auto-swipe ON by default, the PERFORMANCE rail label that finally
//     fits, the divider-style panel resizer, the PayPal tooltip, and the
//     TOP ring that glides ABOVE the stamp layer.
// Run: node scripts/gendex_036_batch_dom.test.mjs
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
  console.log('jsdom unavailable — 0.36.0 batch DOM test skipped');
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
const { renderToString } = require('react-dom/server');
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
const noop = () => {};
const click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

console.log('0.36.0 batch DOM tests');

// ============================================================================
// Part A — windows rise, don't scroll (Modal + GdContextMenu + Popover)
// ============================================================================
{
  const modalSrc = src('src/components/Modal.jsx');
  const css = src('src/index.css');

  ok('0.36.0 Modal carries TWO budgets — centered when it fits, top-aligned when it doesn\'t', () => {
    assert.ok(/centeredBudget/.test(modalSrc) && /topBudget/.test(modalSrc), 'both budgets computed');
    assert.ok(/fitsCentered/.test(modalSrc), 'the centered verdict');
    assert.ok(/fitsCentered \? 'items-center' : 'items-start'/.test(modalSrc), 'the alignment flips when the content outgrows the centered room');
    assert.ok(/Math\.min\(naturalH, topBudget\)/.test(modalSrc), 'the card grows to natural height up to the top budget');
    assert.ok(!/innerHeight - 108\)\s*\}/.test(modalSrc), 'the old single-cap chop is gone');
  });

  const { default: Modal } = require(join(appRoot, 'src/components/Modal.jsx'));
  document.body.innerHTML = '<div id="root"></div>';
  let root = createRoot(document.getElementById('root'));
  root.render(
    React.createElement(Modal, { title: 'SHORT WINDOW', onClose: noop }, React.createElement('p', null, 'tiny'))
  );
  await sleep(60);
  ok('0.36.0 a window that fits stays CENTERED (the default look survives)', () => {
    const layer = document.querySelector('[data-gd-modal]');
    assert.ok(layer, 'the modal painted');
    assert.ok(layer.className.includes('items-center'), 'centered alignment');
    assert.ok(!layer.className.includes('items-start'), 'not top-aligned');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';

  const ctxSrc = src('src/components/GdContextMenu.jsx');
  ok('0.36.0 the right-click menu pins + scrolls inside only when taller than the screen', () => {
    assert.ok(/setMaxH\(Math\.max\(120, vh - 16\)\)/.test(ctxSrc), 'the taller-than-screen pin math');
    assert.ok(/maxH \? \{ maxHeight: maxH, overflowY: 'auto' \}/.test(ctxSrc), 'the inside scroll only rides the cap');
    assert.ok(/Math\.max\(8, Math\.min\(vh - h - 8, y\)\)/.test(ctxSrc), 'the walk-up clamp stays (rise first)');
  });

  const popSrc = src('src/components/Popover.jsx');
  ok('0.36.0 the Popover ladder — EXTEND natural, FLIP above, STOOP last', () => {
    assert.ok(/maxHeight = null/.test(popSrc), 'the 60vh blanket cap is retired (no default cap)');
    assert.ok(/card\.style\.maxHeight = 'none'/.test(popSrc), 'the card is measured UNCLAMPED (natural size)');
    assert.ok(/r\.top - 6 - h/.test(popSrc), 'the flip-above math at natural size');
    assert.ok(/roomAbove > roomBelow/.test(popSrc), 'the neither-fits branch picks the taller side');
    assert.ok(!/maxHeight = '60vh'/.test(popSrc), 'no 60vh anywhere');
  });

  const { default: Popover } = require(join(appRoot, 'src/components/Popover.jsx'));
  document.body.innerHTML = '<div id="root"></div>';
  root = createRoot(document.getElementById('root'));
  const anchorRef = React.createRef();
  const PopHost = () => {
    const [open, setOpen] = React.useState(true);
    return React.createElement(
      'div', null,
      React.createElement('button', { ref: anchorRef, onClick: () => setOpen(true) }, 'OPEN'),
      React.createElement(Popover, { open, onClose: () => setOpen(false), anchor: anchorRef, width: 256 },
        React.createElement('div', { className: 'p-2' }, 'THE LIST'))
    );
  };
  root.render(React.createElement(PopHost));
  await sleep(60);
  ok('0.36.0 a dropdown that fits wears NO height cap at all (natural size)', () => {
    const card = document.querySelector('.gd-pop-in');
    assert.ok(card, 'the popover painted');
    assert.equal(card.style.maxHeight, '', 'no maxHeight in the style — it extends');
    assert.equal(card.style.overflowY, '', 'no inside scrollbar either');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';

  const stampSrc = src('src/components/StampEditModal.jsx');
  ok('0.36.0 the ADD STAMP picker dropped its inner 240px scrollbox (the ladder owns sizing)', () => {
    assert.ok(!stampSrc.includes('max-h-[240px]'), 'the inner cap is gone');
  });
}

// ============================================================================
// Part B — ONE VERDICT PER PASTE (the real ImageStage + ToastHub)
// ============================================================================
{
  const ImageStage = require(join(appRoot, 'src/components/ImageStage.jsx')).default;
  const ToastHub = require(join(appRoot, 'src/components/ToastHub.jsx')).default;
  const images = [
    { file: 'img_a.png', thumb: 'img_a_thumb.jpg' },
    { file: 'img_b.png', thumb: 'img_b_thumb.jpg' },
  ];
  const state = { img: null };
  window.api = {
    clipboardReadImage: async () => state.img,
    saveImageBuffer: async () => ({ file: 'img_new.png', thumb: 'img_new_thumb.jpg' }),
  };
  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.getElementById('root'));
  const pasted = [];
  const statuses = [];
  root.render(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(ImageStage, {
        images,
        imagesPath: '/mock/images',
        onAddImages: noop,
        onSetCover: noop,
        onDeleteImage: noop,
        onReorderImages: noop,
        onPasteRecord: (rec) => pasted.push(rec),
        onStatus: (s) => statuses.push(s),
        confirm: noop,
      }),
      React.createElement(ToastHub)
    )
  );
  await sleep(120);

  const toastTexts = () => [...document.querySelectorAll('.gd-toast')].map((t) => t.textContent);

  // press PASTE with nothing on the clipboard — exactly ONE red toast
  const pasteBtn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('PASTE'));
  click(pasteBtn);
  await sleep(90);
  ok('0.36.0 no image on the clipboard → EXACTLY ONE toast, and it is the red one', () => {
    const texts = toastTexts();
    const matches = texts.filter((t) => t.includes('No image on the clipboard'));
    assert.equal(matches.length, 1, `one verdict, not two (saw ${JSON.stringify(texts)})`);
    const pill = [...document.querySelectorAll('.gd-toast')].find((t) => t.textContent.includes('No image on the clipboard'));
    assert.ok(pill.classList.contains('is-fail'), 'the red tone');
    assert.ok(!statuses.some((s) => s.includes('No image')), 'the doubled status line is retired');
  });

  // wait for the stack to clear, then land an image — exactly ONE ok toast
  await sleep(2600);
  state.img = { base64: 'aGVsbG8=', ext: '.png' };
  await sleep(20);
  const pasteBtn2 = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('PASTE'));
  click(pasteBtn2);
  await sleep(150);
  ok('0.36.0 a landed paste → EXACTLY ONE ok toast', () => {
    const texts = toastTexts();
    const matches = texts.filter((t) => t.includes('Image pasted'));
    assert.equal(matches.length, 1, `one verdict, not two (saw ${JSON.stringify(texts)})`);
    const pill = [...document.querySelectorAll('.gd-toast')].find((t) => t.textContent.includes('Image pasted'));
    assert.ok(!pill.classList.contains('is-fail'), 'the ok tone');
    assert.equal(pasted.length, 1, 'the record reached the version');
    assert.ok(!statuses.some((s) => s === 'Image pasted'), 'no doubled report through the status line');
  });

  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ============================================================================
// Part C — the glyph wall on the right (VersionSettingsModal, both modes)
// ============================================================================
{
  const { default: VersionSettingsModal } = require(join(appRoot, 'src/components/VersionSettingsModal.jsx'));
  const vSrc = src('src/components/VersionSettingsModal.jsx');

  ok('0.36.0 the version windows carry the picker COLUMN on the right (sources)', () => {
    assert.ok(vSrc.includes('grid-cols-[1fr_236px]'), 'the class-window anatomy: content left · picker right');
    assert.ok(vSrc.includes('ICON PICKER'), 'the labeled picker column');
    assert.ok(vSrc.includes("width=\"w-[660px]\""), 'the wider window that fits the wall (0.44.0: 620→660 for the serif face)');
    assert.ok(!vSrc.includes("'CHANGE ICON'") && !vSrc.includes("'HIDE ICONS'"), 'the hide/show toggle is retired (the wall is permanent)');
  });

  document.body.innerHTML = '<div id="root"></div>';
  let root = createRoot(document.getElementById('root'));
  root.render(
    React.createElement(VersionSettingsModal, {
      version: { id: 'v-draft', label: '', icon: null, color: null },
      index: 0, total: 1, isPreview: false, createMode: true,
      onClose: noop, onPatch: noop, onMove: noop, onTogglePreview: noop, onDelete: noop,
      onCreate: noop,
    })
  );
  await sleep(60);
  ok('0.36.0 NEW VERSION: the draft flow keeps its CANCEL/CREATE footer and paints the picker wall', () => {
    const out = document.body.innerHTML;
    assert.ok(out.includes('NEW VERSION'), 'the create title');
    assert.ok(out.includes('CANCEL') && out.includes('CREATE'), 'the draft footer');
    assert.ok(out.includes('ICON PICKER'), 'the picker column is visible');
    assert.ok(!out.includes('POSITION IN STRIP'), 'structural rows stay hidden for a draft');
    assert.ok(!out.includes('SET AS CARD COVER'), 'no cover for a draft either');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';

  root = createRoot(document.getElementById('root'));
  root.render(
    React.createElement(VersionSettingsModal, {
      version: { id: 'v1', label: 'V1', icon: 'star', color: '#ffdd00' },
      index: 1, total: 3, isPreview: false, createMode: false,
      onClose: noop, onPatch: noop, onMove: noop, onTogglePreview: noop, onDelete: noop,
      onCreate: noop,
    })
  );
  await sleep(60);
  ok('0.36.0 the EDIT window wears the same wall — picker right, structural rows back', () => {
    const out = document.body.innerHTML;
    assert.ok(out.includes('ICON PICKER'), 'the picker column');
    assert.ok(out.includes('POSITION IN STRIP'), 'the position row returns for a real version');
    assert.ok(out.includes('SET AS CARD COVER'), 'the cover key returns');
    assert.ok(out.includes('DELETE VERSION'), 'the danger footer');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ============================================================================
// Part D — the editor batch: combo key, exclusive sizes, first-selection fix,
// outline under selection
// ============================================================================
{
  const richSrc = src('src/components/RichText.jsx');
  const css = src('src/index.css');

  ok('0.36.0→0.37.0 underline + strikethrough are TWO keys again (the combo retired)', () => {
    // 0.37.0 superseded the 0.36.0 combo ("it should still be the two
    // options it was before not merged"): both line formats are standalone
    // toolbar keys again, and no combo/flyout markup remains.
    assert.ok(!richSrc.includes('gd-rt-combo-wrap') && !richSrc.includes('gd-rt-combo-btn'), 'the combo markup is gone');
    assert.ok(richSrc.includes("kind: 'underline'") && richSrc.includes("kind: 'strike'"), 'both are standalone toolbar keys again');
    assert.ok(!/\.gd-rt-combo\s*\{/.test(css), 'the flyout CSS is gone');
    // and the RENDER stacks them: the combined rule paints both lines at once
    assert.ok(/\.rt-u\.rt-s\s*\{[^}]*underline line-through/.test(css), 'a run wearing both classes paints BOTH lines');
  });

  ok('0.36.0 BIG and SMALL switch each other off (the exclusivity law)', () => {
    assert.ok(richSrc.includes('stripRichKind'), 'the strip helper is wired');
    assert.ok(/rival = kind === 'big' \? 'small' : kind === 'small' \? 'big' : null/.test(richSrc), 'the rivalry pair');
    const helpers = require(join(appRoot, 'src/utils/helpers.js'));
    // unit law: stripping small off [2,4) from a small range [1,5) splits it
    const stripped = helpers.stripRichKind([{ kind: 'small', start: 1, end: 5 }], 2, 4, 'small');
    assert.deepEqual(
      stripped.map((r) => [r.kind, r.start, r.end]),
      [['small', 1, 2], ['small', 4, 5]],
      'the span loses the format; the surrounding letters keep it'
    );
  });

  ok('0.36.0 the first-selection fix — the gate opens on selectstart + document pointerup', () => {
    assert.ok(richSrc.includes("el.addEventListener('selectstart', onUserGesture)"), 'selectstart (the drag begins inside the field)');
    assert.ok(richSrc.includes("document.addEventListener('pointerup', onUserGesture)"), 'document pointerup (the release lands anywhere)');
    assert.ok(richSrc.includes('QUIET UNTIL THE USER INTERACTS') || richSrc.includes('quiet gate'), 'the quiet gate itself stays (programmatic selections stay silent)');
  });

  ok('0.36.0→0.37.0 the outline reads on real text — fat stroke + the selection-scoped ring', () => {
    // 0.37.0 ("fix outline because it only works on formats and not on the
    // actual text"): the stroke is fat and the resting halo is GONE; the
    // backdrop ring moved INTO ::selection (text-shadow is one of the
    // properties ::selection honors), so the contour survives the
    // selection paint without softening the resting outline.
    const rule = /\.rt-outline\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/-webkit-text-stroke: 1\.5px/.test(rule), 'the fat stroke');
    assert.ok(!/text-shadow/.test(rule), 'no resting halo softening the ring');
    const sel = /\.rt-outline::selection\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/text-shadow/.test(sel) && /var\(--gd-bg\)/.test(sel), 'the backdrop ring rides inside ::selection');
    assert.ok(/-webkit-text-fill-color/.test(sel), 'the selected fill keeps its own color so the stroke stays distinct');
  });

  // ---- the real editor: combo flow + exclusivity + the new gate paths ----
  const { default: RichInput } = require(join(appRoot, 'src/components/RichText.jsx'));
  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.getElementById('root'));
  let value = 'gumdrop';
  // the harness re-renders after every change — the component's value prop
  // must follow its own onChange or the editor model never advances.
  const render = () =>
    root.render(React.createElement(RichInput, { value, onChange: (v) => { value = v; }, placeholder: 'name' }));
  render();
  await sleep(40);
  const el = document.querySelector('.gd-rt-edit');
  // the field must OWN the focus for the toolbar to ever open (the quiet
  // gate reads document.activeElement) — same law as the real app.
  el.focus();
  const select = (a, b, via) => {
    // resolve the innermost FIRST text node — after a format lands, the
    // field's first child is a styled SPAN, and offsets on the span mean
    // child indexes (IndexSizeError for a>beyond 1), not letter offsets.
    let node = el.firstChild || el;
    while (node && node.nodeType !== Node.TEXT_NODE && node.firstChild) node = node.firstChild;
    dom.window.getSelection().setBaseAndExtent(node, a, node, b);
    if (via === 'pointer') document.dispatchEvent(new dom.window.Event('pointerup'));
    else el.dispatchEvent(new dom.window.Event('keyup', { bubbles: true }));
  };
  const btns = () => [...document.querySelectorAll('.gd-rt-btn')];
  const underlineBtn = () => btns().find((b) => (b.getAttribute('title') || '').startsWith('Underline'));
  const strikeBtn = () => btns().find((b) => (b.getAttribute('title') || '').startsWith('Strikethrough'));

  // the gate via the NEW document-pointerup path (the first-selection fix)
  select(0, 7, 'pointer');
  await sleep(40);
  ok('0.36.0 a selection whose release never touched the field still opens the toolbar', () => {
    assert.ok(document.querySelector('.gd-rt-toolbar'), 'the toolbar rendered via the document pointerup path');
  });

  ok('0.37.0 the toolbar is SEVEN keys: bold · italic · underline · strike · big · small · outline', () => {
    const all = btns();
    assert.equal(all.length, 7, `seven keys (saw ${all.length})`);
    assert.ok(underlineBtn(), 'the underline key is among them');
    assert.ok(strikeBtn(), 'the strikethrough key is among them');
  });

  // apply UNDERLINE from its own key
  click(underlineBtn());
  await sleep(40);
  render();
  await sleep(40);
  select(0, 7);
  await sleep(30);
  ok('0.37.0 applying UNDERLINE from its own key formats the selection', () => {
    assert.ok(value.includes('<u>'), `the markup landed (got ${value})`);
    assert.ok(underlineBtn().className.includes('is-active'), 'the underline key lights while the format covers the selection');
  });

  // STRIKE over the SAME underlined letters — both formats stack (0.37.0 law)
  click(strikeBtn());
  await sleep(40);
  render();
  await sleep(40);
  ok('0.37.0 STRIKE over UNDERLINE stacks — neither overwrites the other', () => {
    assert.ok(value.includes('<u>') && value.includes('<s>'), `both formats live in the markup (got ${value})`);
    // and the rendered DOM wears both classes on one run
    const both = [...document.querySelectorAll('.rt-u.rt-s')];
    assert.ok(both.length > 0, 'the run wears both classes at once');
  });

  // SMALL then BIG over the same letters — big replaces small
  const smallBtn = () => btns().find((b) => b.querySelector('.rt-small'));
  click(smallBtn());
  await sleep(40);
  render();
  await sleep(40);
  select(0, 7);
  await sleep(30);
  const withSmall = value;
  const bigBtn = () => btns().find((b) => b.querySelector('.rt-big'));
  click(bigBtn());
  await sleep(40);
  render();
  await sleep(40);
  ok('0.36.0 pressing BIG over SMALL switches: small off, big on', () => {
    // RICH_TOKENS: big = <g>, small = <m>
    assert.ok(withSmall.includes('<m>'), `small landed first (got ${withSmall})`);
    assert.ok(value.includes('<g>'), `big is on (got ${value})`);
    assert.ok(!value.includes('<m>'), `small is off (got ${value})`);
  });

  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ============================================================================
// Part E — the tree / grid / settings / resizer / stamp-layer batch
// ============================================================================
{
  const css = src('src/index.css');
  const constants = src('src/constants/index.js');
  const gridSrc = src('src/components/GridView.jsx');
  const sidebarSrc = src('src/components/ClassSidebar.jsx');
  const settingsSrc = src('src/components/SettingsModal.jsx');

  ok('0.36.0→0.41.0 the tree tools are RETIRED — the right-click menu owns class actions', () => {
    // 0.41.0 — the 3-button hover cluster is gone entirely
    assert.ok(!sidebarSrc.includes('gd-tree-tools'), 'no hover tools render at all');
    assert.ok(!sidebarSrc.includes('hidden group-hover:flex'), 'the old inline flex cluster is gone');
    // 0.37.0 — the tree scroller deliberately GROWS a side scroller now
    // ("in the classtree, add a side scroller and a vertical scroller"):
    // the seal moved onto the CARD — the hugging plate caps at the visible
    // width, so nothing can push past the edge even with both scrollers.
    assert.ok(sidebarSrc.includes('gd-tree-scroll'), 'the scroller wears its own class');
    assert.ok(sidebarSrc.includes('gd-tree-card'), 'the hugging card plate');
    const scroll = /\.gd-tree-scroll\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/overflow-x: auto/.test(scroll) && /overflow-y: auto/.test(scroll), 'BOTH scrollers roll');
    const card = /^\.gd-tree-card\s*\{[^}]*\}/m.exec(css)?.[0] || '';
    assert.ok(/max-width: max\(140px, calc\(100cqw/.test(card), 'the card caps at the VISIBLE width (container query)');
    // 0.38.0 — "ensure that the 3 buttons on the right of the class also
    // have their own space after the text": the plate is IN FLOW (a flex
    // item after the count, width-collapsed at rest, revealed on hover) —
    // never floating over the name.
    // 0.41.0 — the tools CSS is retired with the tools themselves
    assert.ok(!/\.gd-tree-tools\s*\{/.test(css), 'no tools plate rule remains');
    assert.ok(!/\.gd-tree-row:hover \.gd-tree-tools/.test(css), 'no hover reveal remains');
    assert.ok(/gd-btn-danger/.test(css), 'the danger tone lives on the EDIT CLASS delete key');
  });

  ok('0.36.0 the class tree wears GRAPH PAPER by default (the pattern is for the background)', () => {
    assert.ok(/sidebar: 'graph'/.test(constants), 'the default set paints the tree surface');
    assert.ok(/viewer: 'grid'/.test(constants), 'the viewer keeps its blueprint');
    assert.ok(!/gd-tree-row[^{]*background-image/.test(css), 'no pattern on the row containers themselves (solid plates)');
  });

  ok('0.36.0 the drop-side midline sits dead center (rel < 0.5)', () => {
    assert.ok(gridSrc.includes("rel < 0.5 ? 'left' : 'right'"), 'one boundary, at the middle');
    assert.ok(!/rel > 0\.66/.test(gridSrc), 'the old two-thirds band is gone');
  });

  ok('0.36.0 auto-switch images is ON by default', () => {
    assert.ok(/autoSwipeImages: true/.test(constants), 'fresh databases start walking');
  });

  ok('0.36.0 the PERFORMANCE rail label finally fits (and can never clip again)', () => {
    assert.ok(settingsSrc.includes('gd-rail-label'), 'the label rides in its own span');
    const rail = /\.gd-settings-rail\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/width: 150px/.test(rail), 'the rail widened 128 → 150');
    assert.ok(/overflow-x: hidden/.test(rail), 'sealed on x');
    const label = /\.gd-rail-label\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/min-width: 0/.test(label) && /text-overflow: ellipsis/.test(label), 'the shrink + ellipsis fallback');
    const btn = /\.gd-rail-btn\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/letter-spacing: 0\.08em/.test(btn), 'the tracking eased from 0.14em');
  });

  ok('0.36.0→0.37.0 the PayPal key opens the REAL PayPalMe page', () => {
    // 0.37.0 ("fix the paypal tooltips again, and thats the correct link:
    // paypal.com/paypalme/genesisiterations"): the Ko-fi detour is gone —
    // the key opens PayPalMe directly and the tooltip says so.
    assert.ok(settingsSrc.includes('href="https://www.paypal.com/paypalme/genesisiterations"'), 'the real PayPalMe link');
    // 1.0.7 — the em dash retired from tooltips ("remove em dashes from
    // … tooltips"): the same verdict, parenthesized.
    assert.ok(settingsSrc.includes('title="Support via PayPal (paypal.me/genesisiterations)"'), 'the tooltip says exactly where it goes');
    assert.ok(!settingsSrc.includes('opens Ko-fi'), 'the Ko-fi detour wording is gone');
  });

  ok('0.36.0 the panel resizer reads as a DIVIDER — centered pill + top/bottom caps', () => {
    const before = /\.gd-panel-resize::before\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/left: 50%/.test(before) && /translate\(-50%, -50%\)/.test(before), 'the pill is dead-center on the seam');
    assert.ok(/height: 30px/.test(before) && /border-radius: 999px/.test(before), 'the vertical grab pill');
    const after = /\.gd-panel-resize::after\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/linear-gradient/.test(after) && /calc\(100% - 2px\)/.test(after), 'two horizontal cap lines at the very top and bottom');
    const hoverPill = /\.gd-panel-resize:hover::before[\s\S]{0,220}?height: 38px/.exec(css)?.[0] || '';
    assert.ok(hoverPill, 'the pill grows + glows on hover');
  });

  ok('0.36.0 the TOP ring glides ABOVE the stamp layer (the z-lift)', () => {
    const isTop = /\.gd-stamp-slot\.is-top\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/z-index: 5/.test(isTop), 'the top slot outranks its siblings (the ring escapes the trapped context)');
    const dragging = /\.gd-stamp-slots \.gd-stamp-slot\.is-dragging\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/z-index: 6/.test(dragging), 'the held stamp still outranks the top slot');
  });
}

console.log(`\n${passed} passed, ${process.exitCode ? 'FAILED' : '0 failed'}`);
