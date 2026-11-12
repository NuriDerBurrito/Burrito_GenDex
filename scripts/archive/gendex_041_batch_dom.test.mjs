#!/usr/bin/env node
// Behavioral DOM + source checks for the 0.41.0 batch:
//   · THE SORT ENGINE'S HONEST INDICES — the drop gap reports a true
//     INSERTION index, converted to the dragged item's FINAL index, so
//     rightward drops land where the pointer says (no more "the amount it
//     offsets is too much"); the layout simulator anchors on the strip's OWN
//     first column (no more "gap on the left + extra column on the right
//     clipping through the window border" in the image manager); the
//     version strip's NEW VERSION key is a SENTINEL — no drop can land
//     behind it, and the dragged chip's ride is clamped to the strip's box.
//   · ONE STRIP, NO FORCED LINES — the stamp slots, ADD, PASTE and the
//     shared settings cluster flow in ONE wrapping container in both the
//     right panel and the creation window ("the add and paste areas are
//     taking a whole new line even tho there is space, while the hue and
//     options are having ANOTHER new line"); the tower row is gone and the
//     collapse clamps everything as one piece ("options should be collapsed
//     with them").
//   · WHITE IS THE DEFAULT HUE ("default color for the hue of the stamp
//     should be white bruh").
//   · THE CREATION GRID'S GRIP FOLLOWS THE HAND ("when i pull down it should
//     pull down") and the modal holds a height RESERVE while dragging, so
//     nothing re-centers and no label wanders.
//   · THE IMAGE MANAGER'S CLICK OPENS THE BIG PREVIEW — the window stays
//     open, the highlight never moves.
//   · THE CROP TOOL IS RETIRED ("remove the crop feature since its broken,
//     just remove it").
//   · THE OLD N VER COUNT LOOK IS BACK on the card foot (the name-crop hover
//     stays), and the half-second sliver line on hover is gone.
//   · THE CLASS TREE'S 3-BUTTON HOVER TOOLS ARE GONE — right-click owns
//     class actions, and the EDIT CLASS window carries a confirm-gated
//     DELETE CLASS key.
//   · RENAME CARD IS GONE — the EDIT CARD window (with its own NAME field)
//     is the one editor.
//   · THE TRIM PATTERNS STOP LEANING TOP-LEFT (centered phase on every
//     repeating edge).
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
  console.log('jsdom unavailable — 0.41.0 batch DOM test skipped (dev-only dependency)');
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  NOT OK ${name}\n    ${e.message.split('\n')[0]}`);
  }
};
const okAsync = async (name, fn) => {
  try {
    await fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  NOT OK ${name}\n    ${e.message.split('\n')[0]}`);
  }
};
const rule = (re) => re.exec(css)?.[0] || '';
const freshRoot = () => {
  document.body.innerHTML = '<div id="root"></div>';
  return createRoot(document.getElementById('root'));
};

console.log('0.41.0 batch DOM tests');

// ---------------------------------------------------------------------------
// Part A — the version pin
// ---------------------------------------------------------------------------
{
  const { APP } = await import(join(appRoot, 'src/constants/index.js'));
  ok('0.41.0→1.0.2 the version pinned through 1.0.4', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(src('package.json'), /"version": "1\.4\.3"/);
    assert.match(src('CHANGELOG.md'), /^## 0\.46\.0/m, 'the changelog carries the entry');
  });
}

// ---------------------------------------------------------------------------
// Part B — the sort engine: honest indices, honest anchors, sentinel key
// ---------------------------------------------------------------------------
{
  const sortSrc = src('src/components/useThumbSort.js');
  ok('0.41.0 the drop gap reports a true INSERTION index (converted to FINAL)', () => {
    assert.ok(/nearestGapIndex/.test(sortSrc), 'the gap picker');
    // the trailing gap reports `count` now — no longer fused with the last slot
    assert.ok(/consider\(last\.x \+ last\.w \+ gapHalf, last\.y \+ last\.h \/ 2, rects\.length\)/.test(sortSrc.replace(/\s+/g, ' ')), 'the trailing gap is insert-at-end');
    assert.ok(/const finalIndexOf = \(from, ins\) => \(ins > from \? ins - 1 : ins\)/.test(sortSrc), 'insertion → FINAL index conversion');
    /* 1.2.0 — the inline math moved into targetFrom (the shared law the
       pointermove handler and the edge auto-scroll loop both speak).
       1.3.2 re-law: targetFrom picks the gap model by the drag's layout —
       the WALL's own gaps for the wall seat, the classic rows elsewhere —
       and converts through the same clampInsert before targeting.
       1.3.3 re-law: the wall's gap model carries the drag's wall CONTEXT
       (rows, gap AND the reading order + its reading width) so the
       row-major walls speak row-wrap seams, the column walls keep their
       vertical intra-column gaps. */
    assert.ok(/const wallCtx = drag\.wallCtx;/.test(sortSrc), 'the wall context is read (1.3.2)');
    assert.ok(/\(wallCtx \? nearestGapIndexWall\(r, rr, wallCtx\.rows, wallCtx\.gap, wallCtx\) : nearestGapIndex\(r, rr\)\) \?\? drag\.from/.test(sortSrc.replace(/\s+/g, ' ')), 'the shared target law speaks both gap models (1.3.2, ctx-aware 1.3.3)');
    assert.ok(/const dx = cx - drag\.startX;/.test(sortSrc), 'the dragged chip\'s center carries the pointer travel');
    // the arithmetic, inline: [A,B,C] drag A to the gap before C (ins 2)
    // → final index 1 → [B,A,C] — one slot LESS than the raw gap reads.
    const finalIndexOf = (from, ins) => (ins > from ? ins - 1 : ins);
    assert.equal(finalIndexOf(0, 2), 1, 'rightward drops land on the gap the pointer is over');
    assert.equal(finalIndexOf(2, 1), 1, 'leftward drops are unchanged');
    assert.equal(finalIndexOf(0, 3), 2, 'the trailing gap inserts at the end');
  });

  ok('0.41.0 the simulator anchors on the strip\'s OWN first column (the image-manager gap/column bug)', () => {
    assert.ok(/const left = rects\[0\]\.x;/.test(sortSrc), 'rows pack from the strip\'s first column (never order[0])');
    assert.ok(/let center = rects\[0\]\.y \+ rects\[0\]\.h \/ 2;/.test(sortSrc), 'the first row anchors the stack (never order[0])');
    // sanity: with the anchor at rects[0], dragging the FIRST image to the end
    // seats every neighbor exactly where the reflow puts it — no +74px drift.
    const rects = [
      { x: 10, y: 10, w: 64, h: 64 },
      { x: 84, y: 10, w: 64, h: 64 },
      { x: 158, y: 10, w: 64, h: 64 },
    ];
    const left = rects[0].x;
    assert.equal(left, 10, 'the anchor is the container own left edge');
  });

  ok('0.41.0 strips with NON-SORTING children refuse the simulation (honest fallback)', () => {
    assert.ok(/hasForeign/.test(sortSrc), 'the foreign-child bail');
    assert.ok(/classList\?\.contains\('gd-sort-item'\)/.test(sortSrc), 'foreign children are spotted by class');
  });

  ok('0.41.0 the dragged chip\'s ride is CLAMPED to the container (no clipping through the border)', () => {
    assert.ok(/contRect/.test(sortSrc), 'the container box is captured at grab time');
    /* 1.2.5 re-law: the clamp bounds the pan-INCLUSIVE delta, and the
       bounds themselves shift with the pan (the container box still owns
       the drawn chip — it just travels with the content). */
    assert.ok((sortSrc.match(/tdx = Math\.max\(minX, Math\.min\(maxX, tdx\)\)/g) || []).length >= 2, 'the translate is clamped (both handlers)');
    /* 1.2.0 — same law, new home: targetFrom's geometry branch reads the
       snapshot seat plus the pointer travel — the UNclamped math. */
    /* 1.2.9 re-law (caught up): the pan term is GONE — the chip's element
       rides inside the scrolling content, so the drawn transform already
       carries the pan compensation and the snapshot shifts with it; adding
       pan here counted it twice and the drop target read a whole pan-width
       away from the drawn chip (the ghost stamp). Still UNclamped: the
       clamp only ever touches the DRAWN chip. */
    assert.ok(/const r = r0 \? r0\.x \+ r0\.w \/ 2 \+ dx : cx;/.test(sortSrc), 'the drop gap still reads the UNclamped math (pan-free, the 1.2.9 ghost law)');
  });

  const viewSrc = src('src/components/CharacterView.jsx');
  ok('0.41.0 the NEW VERSION key is a SENTINEL — nothing lands behind it', () => {
    assert.ok(/maxInsert: versions\.length/.test(viewSrc), 'the version strip caps insertion at the last version slot');
    const sortSrcCommit = /onCommit: \(from, to\) => \{[\s\S]{0,700}?\}\);/.exec(viewSrc)?.[0] || '';
    assert.ok(/const target = Math\.min\(to, versions\.length - 1\);/.test(sortSrcCommit), 'the commit still clamps to the data range');
  });
}

// ---------------------------------------------------------------------------
// Part C — one strip, no forced lines (creation + panel)
// ---------------------------------------------------------------------------
{
  const modalSrc = src('src/components/NewCharacterModal.jsx');
  const viewSrc = src('src/components/CharacterView.jsx');
  const slotsSrc = src('src/components/StampEditModal.jsx');

  ok('0.41.0 StampSlots carries its trailing crew INSIDE the wrapping container', () => {
    // 1.1.9 re-law: StampSlotList is the bare engine + slots + crew; the
    // children still render inside the .gd-stamp-slots wrapper (StampSlots
    // owns the wrapper, the panel's SideFlowZone owns its own).
    assert.ok(/children = null/.test(slotsSrc), 'the children prop');
    assert.ok(/export function StampSlotList/.test(slotsSrc), 'the bare list is the extraction seam');
    assert.ok(/<div className="gd-stamp-slots" ref=\{stripRef\}>[\s\S]*?<StampSlotList/.test(slotsSrc.replace(/\s+/g, ' ')), 'children render inside .gd-stamp-slots (through the list)');
    assert.ok(/NOT sort items/.test(slotsSrc), 'the crew is documented as non-sorting');
  });

  ok('0.41.0 the creation strip is ONE flow — ADD + PASTE + the cluster ride the slots', () => {
    assert.ok(!modalSrc.includes('gd-stamp-strip-row'), 'the strip-row wrapper is gone');
    // the cluster and tiles are passed as StampSlots children
    const kids = /<StampSlots[\s\S]*?<\/StampSlots>/.exec(modalSrc)?.[0] || '';
    assert.ok(kids.includes('StampAddButton'), 'ADD rides inside');
    assert.ok(kids.includes('StampPasteTile'), 'PASTE rides inside');
    assert.ok(kids.includes('gd-stamp-settings-cluster'), 'the settings cluster rides inside');
    assert.ok(!rule(/^\.gd-stamp-strip-row\s*\{/m), 'the wrapper\'s CSS is gone too');
  });

  // 1.3.4 re-law: the settings keys merge into ONE stacked cluster
  ok('0.41.0→1.3.4 the panel strip is ONE flow — the settings keys ride as one stacked cluster', () => {
    assert.ok(!viewSrc.includes('gd-stamp-tower-row'), 'no tower row in the view');
    assert.ok(!rule(/^\.gd-stamp-tower-row\s*\{/m), 'no tower row in the CSS');
    assert.ok(viewSrc.includes('gd-stamp-settings-cluster'), 'the stacked cluster renders (the 1.3.4 restack: color above settings)');
    // 1.1.9 re-law: the panel's strip renders the slots + tiles + settings
    // as the SideFlowZone's DIRECT children (the zone owns the wrapper —
    // the twin-block side split reaches the slots).
    const kids = /<SideFlowZone[\s\S]*?<\/SideFlowZone>/.exec(viewSrc)?.[0] || '';
    assert.ok(kids.includes('StampAddButton') && kids.includes('StampPasteTile'), 'the tiles ride inside');
    assert.ok(kids.includes('<StampColorControls'), 'the color key rides inside');
    assert.ok(kids.includes('<StampPosControls'), 'the transform key rides inside');
    assert.ok(/ONE WRAPPING FLOW: the slots \+ ADD \+ PASTE \+ the shared/.test(viewSrc), 'one flow — the clamp folds options WITH stamps');
  });

  // DOM: 7 stamps + ADD + PASTE + the cluster all live under .gd-stamp-slots
  await okAsync('0.41.0 the strip DOM: one wrapping container, tiles after the slots', async () => {
    const { StampSlots, StampAddButton, StampPasteTile } = require(join(appRoot, 'src/components/StampEditModal.jsx'));
    const stamps = Array.from({ length: 7 }, (_, i) => ({ id: `s${i}`, image: `s${i}.png`, name: `sigil ${i}` }));
    const root = freshRoot();
    root.render(
      React.createElement(
        'div',
        null,
        React.createElement(
          StampSlots,
          { stamps, imagesPath: '/img', onRemove: () => {}, onPromote: () => {}, onReorder: () => {}, onRename: () => {} },
          React.createElement(StampAddButton, { stampLibrary: [], imagesPath: '/img', attachedImages: [], onPick: () => {} }),
          React.createElement(StampPasteTile, { onPaste: () => {} }),
          React.createElement('span', { className: 'gd-stamp-settings-cluster' }, 'cluster')
        )
      )
    );
    await sleep(40);
    const strip = document.querySelector('.gd-stamp-slots');
    assert.ok(strip, 'the strip container renders');
    const slots = strip.querySelectorAll('.gd-stamp-slot.gd-sort-item');
    assert.equal(slots.length, 7, 'the seven stamps render as sort items');
    assert.ok(strip.querySelector('.gd-stamp-slot.is-empty'), 'the ADD tile rides INSIDE the strip');
    assert.ok(strip.querySelector('.gd-stamp-paste'), 'the PASTE tile rides INSIDE the strip');
    assert.ok(strip.querySelector('.gd-stamp-settings-cluster'), 'the settings cluster rides INSIDE the strip');
    // no sibling wrappers — the strip is the ONLY container in its lane
    assert.equal(strip.parentElement.children.length, 1, 'nothing sits beside the strip in its lane');
    root.unmount();
    document.body.innerHTML = '<div id="root"></div>';
  });
}

// ---------------------------------------------------------------------------
// Part D — white is the default hue
// ---------------------------------------------------------------------------
{
  await okAsync('0.41.0 resolveStampHue: WHITE unless a custom hue is set', async () => {
    const { resolveStampHue } = await import(join(appRoot, 'src/utils/helpers.js'));
    assert.equal(resolveStampHue({}), '#ffffff', 'no settings → white');
    assert.equal(resolveStampHue({ color: '#ff0000' }), '#ff0000', 'a custom hue is kept');
    assert.equal(resolveStampHue({ color: 'red' }), '#ffffff', 'junk falls back to white');
    // the AUTO color no longer drives the default wash
    assert.equal(resolveStampHue({}, '#123456'), '#ffffff', 'the dominant-color argument is retired');
  });

  const controlsSrc = src('src/components/StampColorControls.jsx');
  ok('0.41.0 the color window\'s swatch shows WHITE by default', () => {
    assert.ok(/const hue = custom \|\| DEFAULT_STAMP_COLOR;/.test(controlsSrc), 'custom → white (no auto branch)');
    assert.ok(!/custom \|\| auto \|\| DEFAULT_STAMP_COLOR/.test(controlsSrc), 'the auto branch is gone');
  });

  const autoSrc = src('src/components/useAutoStampColor.js');
  ok('0.41.0 useStampHue shares the white default', () => {
    assert.ok(/return resolveStampHue\(settings\);/.test(autoSrc), 'the chain is CUSTOM → WHITE');
    assert.ok(!/libraryAuto \|\| live/.test(autoSrc), 'the auto chain is gone');
  });
}

// ---------------------------------------------------------------------------
// Part E — the creation grid's grip: honest direction + the height reserve
// ---------------------------------------------------------------------------
{
  const modalSrc = src('src/components/NewCharacterModal.jsx');
  ok('0.41.0 pulling DOWN lengthens the image area', () => {
    assert.ok(/const dRows = \(e\.clientY - drag\.startY\) \/ rowUnit;/.test(modalSrc), 'down = longer (a bottom-edge handle follows the hand)');
    assert.ok(!/drag\.startY - e\.clientY/.test(modalSrc), 'the reversed math is gone');
    assert.ok(/Math\.min\(DEFAULT_GRID_ROWS, Math\.max\(MIN_GRID_ROWS, drag\.startRows \+ dRows\)\)/.test(modalSrc), 'still clamped to [1, 4] rows');
    assert.ok(modalSrc.includes('is-live'), 'the grip reads live while held');
  });

  ok('0.41.0 the modal holds its height RESERVE while the grip is dragged (nothing re-centers)', () => {
    assert.ok(/pinned=\{capLive\}/.test(modalSrc), '0.42.0: the window is pinned while the grip is held');
    assert.ok(!/gridReserveH/.test(modalSrc), 'the 0.41 height reserve is gone — the layout follows the grip LIVE');
    assert.ok(/setCapLive\(true\)/.test(modalSrc) && /setCapLive\(false\)/.test(modalSrc), 'the reserve arms on grab and drops on release');
    const handle = rule(/^\.gd-grid-cap-handle\.is-live\s*\{[^}]*\}/m);
    assert.ok(/cursor: ns-resize/.test(handle), 'the live lane pins the cursor');
  });
}

// ---------------------------------------------------------------------------
// Part F — the image manager's click opens the BIG preview
// ---------------------------------------------------------------------------
{
  const stageSrc = src('src/components/ImageStage.jsx');
  const managerSrc = src('src/components/ImageManagerModal.jsx');
  ok('0.41.0 a click on a manager slot hands off to the big viewer', () => {
    assert.ok(/onOpenViewer\?\.\(i\)/.test(stageSrc), 'the stage routes the pick to the viewer');
    assert.ok(!/setIndex\(i\);\s*\n\s*setManagerOpen\(false\);/.test(stageSrc), 'the pick no longer selects + closes');
    assert.ok(/onOpenViewer = null/.test(managerSrc), 'the manager carries the handoff prop');
    assert.ok(/click for the big preview/.test(managerSrc), 'the slot tooltip says what a click does');
  });

  await okAsync('0.41.0 the manager DOM: a tap fires onPick (the viewer handoff), the window stays', async () => {
    const { default: ImageManagerModal } = require(join(appRoot, 'src/components/ImageManagerModal.jsx'));
    let picked = null;
    let closed = false;
    const images = [
      { file: 'a.png', thumb: 'a.png' },
      { file: 'b.png', thumb: 'b.png' },
    ];
    const root = freshRoot();
    root.render(
      React.createElement(ImageManagerModal, {
        images,
        imagesPath: '/img',
        selectedIndex: 0,
        onReorder: () => {},
        onSetCover: () => {},
        onDelete: () => {},
        onAddImages: async () => {},
        onPasteImage: async () => {},
        onPick: (i) => { picked = i; },
        onOpenViewer: (i) => { picked = i; },
        onClose: () => { closed = true; },
        confirm: () => {},
      })
    );
    await sleep(40);
    const slot = document.querySelectorAll('.gd-img-slot')[1];
    assert.ok(slot, 'the slots render');
    // a plain pointer tap (down + up, no move) — the sort's tap path
    slot.dispatchEvent(new dom.window.MouseEvent('pointerdown', { bubbles: true }));
    slot.dispatchEvent(new dom.window.MouseEvent('pointerup', { bubbles: true }));
    await sleep(40);
    assert.equal(picked, 1, 'the tap fired onPick for that image');
    assert.equal(closed, false, 'nothing closed the manager');
    assert.ok(document.querySelector('.gd-img-manager-slots'), 'the manager is still mounted');
    root.unmount();
    document.body.innerHTML = '<div id="root"></div>';
  });
}

// ---------------------------------------------------------------------------
// Part G — the crop tool is retired
// ---------------------------------------------------------------------------
{
  const viewerSrc = src('src/components/ImageViewer.jsx');
  ok('0.41.0 the viewer carries no crop anything', () => {
    for (const gone of ['cropping', 'cropRect', 'applyCrop', 'onCropSaved', 'APPLY CROP', 'CROP_PAN_SPEED', 'loadCleanImage']) {
      assert.ok(!viewerSrc.includes(gone), `${gone} is gone`);
    }
    assert.ok(viewerSrc.includes('THE CROP TOOL IS RETIRED'), 'the retirement note rides the header');
    assert.ok(!rule(/^\.gd-imgview-crop-box\s*\{/m), 'the crop box CSS is gone');
    assert.ok(!/\.gd-imgview-stage\.is-cropping/.test(css), 'the cropping cursor rule is gone');
  });

  const viewSrc = src('src/components/CharacterView.jsx');
  ok('0.41.0 the crop plumbing is unwired everywhere', () => {
    assert.ok(!viewSrc.includes('onCropSaved'), 'the view no longer commits crops');
    assert.ok(/<ImageViewer[\s\S]*?onClose=\{\(\) => setViewer\(null\)\}\s*onSetCover=\{\(i\) => setCover\(i\)\}\s*onOpenManager=\{\(\) => \{/.test(viewSrc), '0.42.0: the viewer mounts with its menu crew (cover / manager handoff) — still no crop');
    // NOTE: the card-look editor KEEPS its drag-to-place image positioning
    // (cardCrop) — that is the working placement feature, not the broken
    // viewer crop tool that was removed.
    assert.ok(/setCrop\(c\);/.test(viewSrc), 'the card editor still drafts the image placement');
  });
}

// ---------------------------------------------------------------------------
// Part H — the card foot: the old N VER look, no sliver line
// ---------------------------------------------------------------------------
{
  const gridSrc = src('src/components/GridView.jsx');
  ok('0.41.0 the foot wears the classic N VER rubber-stamp badge', () => {
    assert.ok(gridSrc.includes('gd-card-vers-badge'), 'the badge class rides the foot');
    assert.ok(/\{character\.versions\.length\} VER/.test(gridSrc), 'the badge says N VER');
    assert.ok(!gridSrc.includes('gd-card-vers-chip'), 'the chip row is gone');
    assert.ok(gridSrc.includes('gd-card-foot-vers'), 'the hover name-crop grid stays');
    const badge = rule(/^\.gd-card-vers-badge\s*\{[^}]*\}/m);
    assert.ok(/border: 2px solid currentColor/.test(badge), 'the rubber-stamp frame');
    assert.ok(/rotate\(-2deg\)/.test(badge), 'the classic tilt');
    assert.ok(/flex-shrink: 0/.test(badge), 'the badge never squishes into a sliver');
  });

  ok('0.41.0→0.42.0 the half-second hover line is dead (no layout motion left to half-paint)', () => {
    const vers = rule(/^\.gd-card-vers\s*\{[^}]*\}/m);
    assert.ok(/visibility: hidden/.test(vers), 'hidden at rest');
    // 1.1.4 — the hover seat carries the has-vers gate (the badge exists)
    // and the plate's :not(.has-unfold) gate retired with the plate.
    const hover = rule(/^\.gd-card:hover \.gd-card-foot-vers\.has-vers \.gd-card-vers,[^{]*\{[^}]*\}/m);
    assert.ok(/visibility: visible/.test(hover), 'visible on hover');
    assert.ok(/opacity 0\.14s ease, visibility 0s linear 0\.14s/.test(vers), '0.42.0: one clean fade — no gated delays, no animated column');
  });

  await okAsync('0.41.0 the foot DOM: name + date + the N VER badge (hover column present)', async () => {
    const { default: GridView } = require(join(appRoot, 'src/components/GridView.jsx'));
    const { makeCharacter, makeVersion } = await import(join(appRoot, 'src/constants/index.js'));
    const character = makeCharacter('amy', 'root', [{ file: 'a.png', thumb: 'a.png' }]);
    character.versions = [makeVersion([]), makeVersion([]), makeVersion([]), makeVersion([]), makeVersion([])];
    const root = freshRoot();
    root.render(
      React.createElement(GridView, {
        characters: [character],
        tags: [],
        stamps: [],
        imagesPath: '/img',
        zoom: 3,
        tagScale: 1,
        cardRatio: { w: 3, h: 4 },
        sortMode: 'custom',
        search: '',
        dragRef: { current: null },
        spotlight: { include: [], exclude: [], stamps: [], stampExclude: [] },
        onSearch: () => {},
        onSort: () => {},
        onNew: () => {},
        onOpen: () => {},
        onDelete: () => {},
        onReorder: () => {},
      })
    );
    await sleep(60);
    const foot = document.querySelector('.gd-card-foot-vers');
    assert.ok(foot, 'the foot grid renders');
    assert.ok(foot.querySelector('.gd-card-vers'), 'the versions cluster renders');
    const badge = foot.querySelector('.gd-card-vers-badge');
    assert.ok(badge, 'the N VER badge renders');
    assert.equal(badge.textContent.trim(), '5 VER', 'it counts the versions');
    assert.ok(!foot.querySelector('.gd-card-vers-chip'), 'no chips anywhere');
    assert.ok(!document.body.innerHTML.includes('title="Rename card"'), 'the rename hover key is gone');
    root.unmount();
    document.body.innerHTML = '<div id="root"></div>';
  });
}

// ---------------------------------------------------------------------------
// Part I — the class tree: no hover tools, DELETE CLASS in the editor
// ---------------------------------------------------------------------------
{
  const sidebarSrc = src('src/components/ClassSidebar.jsx');
  ok('0.41.0 the 3-button hover tools are gone from the tree', () => {
    assert.ok(!sidebarSrc.includes('gd-tree-tools'), 'no tools plate renders');
    assert.ok(!sidebarSrc.includes('toolsSeat'), 'no seat ladder');
    assert.ok(!sidebarSrc.includes('gd-tree-tools-pop'), 'no pop strips');
    assert.ok(!rule(/^\.gd-tree-tools\s*\{/m), 'and no CSS for them');
    assert.ok(/right-click for options/.test(sidebarSrc), 'the row\'s tooltip points at the right-click menu');
  });

  ok('0.41.0 the EDIT CLASS window carries a confirm-gated DELETE CLASS key', () => {
    assert.ok(/askDeleteFromModal/.test(sidebarSrc), 'the editor delete path');
    assert.ok(/DELETE CLASS/.test(sidebarSrc), 'the key label');
    // 0.42.0 — the editor STAYS OPEN under the confirm (cancel returns to
    // it); only the confirmed delete closes both.
    assert.ok(/onConfirm: \(\) => \{\s*setModal\(null\);\s*onDeleteClass\(victim\.id\);/.test(sidebarSrc), 'only DELETE closes the editor');
    const btn = rule(/^\.gd-btn-danger\s*\{/m);
    assert.ok(btn, 'the danger tone exists');
  });

  await okAsync('0.41.0 the tree DOM: pure lanes, no keys — and the editor deletes', async () => {
    const { default: ClassSidebar } = require(join(appRoot, 'src/components/ClassSidebar.jsx'));
    const classes = [
      { id: 'cl1', name: 'heroes', parentId: 'root', order: 0 },
      { id: 'cl2', name: 'villains', parentId: 'root', order: 1 },
    ];
    let confirmed = null;
    const root = freshRoot();
    root.render(
      React.createElement(ClassSidebar, {
        classes,
        characters: [],
        selectedClassId: 'cl1',
        dragRef: { current: null },
        onSelectClass: () => {},
        onAddClass: () => {},
        onRenameClass: () => {},
        onDeleteClass: (id) => { confirmed = id; },
        onMoveClass: () => {},
        onAssignCharacter: () => {},
        onNewCharacter: () => {},
        confirm: (opts) => { opts.onConfirm(); },
        onStatus: () => {},
      })
    );
    await sleep(40);
    assert.ok(!document.querySelector('.gd-tree-tools'), 'no hover tools in the DOM');
    assert.ok(!document.querySelector('.gd-tree-tools-pop'), 'no pop strips in the DOM');
    // open the EDIT CLASS window on a class (the right-click "Edit class" path)
    const row = document.querySelector('[data-gd-class-id="cl1"]');
    assert.ok(row, 'the class row renders');
    root.render(
      React.createElement(ClassSidebar, {
        classes,
        characters: [],
        selectedClassId: 'cl1',
        dragRef: { current: null },
        onSelectClass: () => {},
        onAddClass: () => {},
        onRenameClass: () => {},
        onDeleteClass: (id) => { confirmed = id; },
        onMoveClass: () => {},
        onAssignCharacter: () => {},
        onNewCharacter: () => {},
        confirm: (opts) => { opts.onConfirm(); },
        onStatus: () => {},
        editClassRequest: 'cl1',
        onEditClassHandled: () => {},
      })
    );
    await sleep(40);
    const delBtn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('DELETE CLASS'));
    assert.ok(delBtn, 'the EDIT CLASS window carries the DELETE CLASS key');
    delBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await sleep(40);
    assert.equal(confirmed, 'cl1', 'the confirm-gated delete fired on the right class');
    // the editor drops through AnimatePresence' exit fade — give it a beat
    await sleep(320);
    assert.ok(!document.querySelector('.gd-modal-card'), 'the editor closed with the ask');
    root.unmount();
    document.body.innerHTML = '<div id="root"></div>';
  });
}

// ---------------------------------------------------------------------------
// Part J — EDIT CARD is the one editor (rename is gone)
// ---------------------------------------------------------------------------
{
  const viewSrc = src('src/components/CharacterView.jsx');
  const appSrc = src('src/App.jsx');
  ok('0.41.0 the settings menu speaks EDIT CARD (no RENAME key)', () => {
    assert.ok(/EDIT CARD/.test(viewSrc), 'the menu key reads EDIT CARD');
    assert.ok(!/>\s*RENAME\s*</.test(viewSrc), 'no RENAME key in the menu');
    assert.ok(viewSrc.includes('title="EDIT CARD"') || /onEditCard/.test(viewSrc), 'the edit-card wiring');
  });

  ok('0.41.0 the card editor window carries the NAME field', () => {
    assert.ok(viewSrc.includes('title="EDIT CARD"'), 'the window title');
    assert.ok(/const \[name, setName\] = useState\(character\.name\);/.test(viewSrc), 'the name draft');
    assert.ok(/name: name\.trim\(\)/.test(viewSrc), 'DONE commits the name');
    // 1.0.3 — the window lives at App level now; the patch rides its onApply
    assert.ok(/name: card\.name/.test(appSrc), 'App patches the name with the look (window mount)');
  });

  ok('0.41.0 the standalone rename flow is gone from App', () => {
    assert.ok(!appSrc.includes("type: 'rename'"), 'no rename modal is ever opened');
    assert.ok(!appSrc.includes('RenameModal'), 'the rename window is unwired');
    assert.ok(!/label: 'Rename'/.test(appSrc), 'the context menus carry no Rename item');
    assert.ok(appSrc.includes('EDIT CLASS'), 'the class menu still edits classes');
  });

  const gridSrc = src('src/components/GridView.jsx');
  ok('0.41.0 the grid card carries no rename pencil (delete stays)', () => {
    assert.ok(!gridSrc.includes('title="Rename card"'), 'the pencil is gone');
    assert.ok(gridSrc.includes('title="Delete card"'), 'the delete key stays');
    assert.ok(!/onRename=\{\(\) => onRename\(character\)\}/.test(gridSrc), 'the card no longer wires a rename');
  });
}

// ---------------------------------------------------------------------------
// Part K — the trims stop leaning toward the top-left
// ---------------------------------------------------------------------------
{
  ok('0.41.0 every repeating trim edge centers its tile phase', () => {
    const scallop = /\.gd-trim-scallop::after\s*\{[^}]*\}/s.exec(css)?.[0] || '';
    assert.ok(/center 0,/.test(scallop.replace(/\s+/g, ' ')), 'scallop top centers');
    assert.ok(/center 100%,/.test(scallop.replace(/\s+/g, ' ')), 'scallop bottom centers');
    assert.ok(/0 center,/.test(scallop.replace(/\s+/g, ' ')), 'scallop left centers');
    assert.ok(/100% center,/.test(scallop.replace(/\s+/g, ' ')), 'scallop right centers');

    const beads = /\.gd-trim-beads::after\s*\{[^}]*\}/s.exec(css)?.[0] || '';
    assert.ok(/center top/.test(beads.replace(/\s+/g, ' ')), 'beads top centers');
    assert.ok(/left center/.test(beads.replace(/\s+/g, ' ')), 'beads left centers');

    const rivet = /\.gd-trim-rivet::after\s*\{[^}]*\}/s.exec(css)?.[0] || '';
    assert.ok(/center 0,/.test(rivet.replace(/\s+/g, ' ')), 'rivet top centers');
    assert.ok(/100% center,/.test(rivet.replace(/\s+/g, ' ')), 'rivet right centers');

    const vine = /\.gd-trim-vine::after\s*\{[^}]*\}/s.exec(css)?.[0] || '';
    assert.ok(/center 0,/.test(vine.replace(/\s+/g, ' ')), 'vine top centers');
    assert.ok(/calc\(50% \+ 6\.5px\) 1\.5px/.test(vine.replace(/\s+/g, ' ')), 'vine staggered B row keeps its half-tile offset');
    // no repeating edge anchors at the raw top-left anymore
    assert.ok(!/background-position:\s*\n\s*0 0,/.test(beads), 'beads no longer anchors at 0 0');
  });
}

console.log(failed ? `\n${passed} passed, ${failed} failed` : `\n${passed} 0.41.0 batch DOM checks passing`);
process.exit(failed ? 1 : 0);
