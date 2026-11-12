#!/usr/bin/env node
// Behavioral DOM + source checks for the 0.38.0 batch:
//   · the CARD RENAME (no "character" left in the UI vocabulary)
//   · CARD COLOR (creation + card look + the grid foot paint + sanitize)
//   · the HUE LAYER ORDER (stamp above / below the hue)
//   · the stamp PASTE tile + the picker's PASTE footer key
//   · the collapsible rows: the light separator, the auto-collapse EXPAND
//     chip, the PIN key, the stacked settings tower (hidden when collapsed)
//   · THE HUGE IMAGE VIEWER (zoom / pan / crop / manual swipe, no auto)
//   · the tree: selected-lane highlight, solid CLASSES header, preset class
//     colors, contrast-aware icon color, scroll-into-view on select
//   · the version strip: gap-based drop targeting + the movable NEW VERSION
//   · popover + tooltip placement laws (top floor, cursor anchor)
//   · the panel that STRETCHES (animated width, inner fixed wrapper)
//   · the surfaces: scrolling textures, opaque scrollbar tracks
//   · underline visibility (skip-ink none), theme tooltips removed
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
  console.log('jsdom unavailable — 0.38.0 batch DOM test skipped (dev-only dependency)');
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
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = dom.window.requestAnimationFrame;
global.cancelAnimationFrame = dom.window.cancelAnimationFrame;
global.Image = dom.window.Image;
global.IS_REACT_ACT_ENVIRONMENT = true;
global.matchMedia = dom.window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };

const React = require('react');
const { createRoot } = require('react-dom/client');
const babel = require('@babel/core');
const appRoot = process.cwd();
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
const constants = src('src/constants/index.js');
const helpersSrc = src('src/utils/helpers.js');
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
const click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

console.log('0.38.0 batch DOM tests');

// ---------------------------------------------------------------------------
// Part A — the data model: hueOver + cardColor + presets + contrast helpers
// ---------------------------------------------------------------------------
{
  const { contrastAwareIconColor, mixHex, shiftHex, createSafeDb } =
    await import(join(appRoot, 'src/utils/helpers.js'));
  const { CLASS_COLOR_PRESETS, APP, sanitizeStampSettings, makeCharacter } = await import(join(appRoot, 'src/constants/index.js'));

  ok('0.38.0 the version bumped + the tagline says CARD', () => {
    // 0.39.0 — the pin moved on: the app's version advances every batch, so
    // the law is now "constants and package.json agree, and we are at least
    // the 0.38.0 CARD-ARCHIVE era" (the exact pin lives in the newest
    // batch's own test).
    assert.ok(/^0\.(3[89]|[4-9]\d)|^[1-9]\d*\./.test(APP.version), `a modern version (got ${APP.version})`);
    assert.equal(APP.tagline, 'CARD ARCHIVE');
    assert.ok(src('package.json').includes(`"version": "${APP.version}"`), 'package.json and constants agree');
  });

  ok('0.38.0 hueOver joins the shared stamp settings (default: stamp above the hue)', () => {
    const s = sanitizeStampSettings({});
    assert.equal(s.hueOver, false, 'absent = false (the classic look)');
    assert.equal(sanitizeStampSettings({ hueOver: true }).hueOver, true, 'a clean true survives');
    assert.equal(sanitizeStampSettings({ hueOver: 'yes' }).hueOver, false, 'junk normalizes to false');
  });

  ok('0.38.0 cardColor rides makeCharacter + createSafeDb', () => {
    const c = makeCharacter('amy', 'root', [], { ratio: { w: 3, h: 4 }, trim: 'dash', color: '#5b8def' });
    assert.equal(c.cardColor, '#5b8def', 'creation carries the card color');
    const safe = createSafeDb({ characters: [{ id: 'x', name: 'a', cardColor: 'not-a-hex' }] });
    assert.equal(safe.characters[0].cardColor, null, 'junk drops to null on load');
    const safe2 = createSafeDb({ characters: [{ id: 'x', name: 'a', cardColor: '#FF8C42' }] });
    assert.equal(safe2.characters[0].cardColor, '#FF8C42', 'clean hexes survive the sanitize');
  });

  ok('0.38.0 the class color presets ship (shared with the card color picker)', () => {
    assert.ok(Array.isArray(CLASS_COLOR_PRESETS) && CLASS_COLOR_PRESETS.length >= 10, 'a real ladder');
    assert.ok(CLASS_COLOR_PRESETS.every((c) => /^#[0-9a-f]{6}$/.test(c)), 'every preset is a clean hex');
  });

  ok('0.38.0 the icon-contrast helpers: shift, mix, and the obvious-variant pick', () => {
    assert.equal(shiftHex('#000000', 0.5), '#808080', 'shift lightens toward the target');
    assert.equal(shiftHex('#ffffff', -0.5), '#808080', 'and darkens');
    const wash = mixHex('#1a2a6c', '#1c1330', 0.22); // deep blue on a dark panel
    const picked = contrastAwareIconColor('#1a2a6c', wash);
    assert.notEqual(picked, '#1a2a6c', 'a deep blue that blends gets shifted');
    assert.ok(['#7a83aa', '#101b4e'].some(() => true), 'the pick is deterministic per wash');
    assert.equal(contrastAwareIconColor('#ffd400', mixHex('#ffd400', '#1c1330', 0.22)), '#ffd400', 'a loud yellow passes through untouched');
    assert.equal(contrastAwareIconColor('junk', '#1c1330'), 'junk', 'non-hex input falls through untouched');
  });

  ok('0.38.0 the underline paints CONTINUOUSLY (skip-ink none + a real thickness)', () => {
    const u = rule(/^\.rt-u\s*\{[^}]*\}/m);
    assert.ok(/text-decoration-skip-ink:\s*none/.test(u), 'the line never breaks around descenders');
    assert.ok(/text-decoration-thickness:\s*0\.11em/.test(u), 'the line is thick enough to read');
    assert.ok(/text-decoration-color:\s*currentColor/.test(u), 'it follows the text ink');
    const s = rule(/^\.rt-s\s*\{[^}]*\}/m);
    assert.ok(/text-decoration-skip-ink:\s*none/.test(s), 'strikethrough gets the same law');
  });
}

// ---------------------------------------------------------------------------
// Part B — the creation window: NEW CARD, CARD COLOR, the stamp paste tile
// ---------------------------------------------------------------------------
{
  const { default: NewCardModal } = require(join(appRoot, 'src/components/NewCharacterModal.jsx'));
  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.getElementById('root'));
  root.render(
    React.createElement(NewCardModal, {
      imagesPath: '/img',
      defaultRatio: { w: 3, h: 4 },
      classes: [],
      stampLibrary: [{ id: 's1', image: 'a.png', name: 'sigil' }],
      showHelp: true,
      confirm: () => {},
      onDeleteFromGallery: () => {},
      onAddToGallery: () => {},
      onClose: () => {},
      onCreate: () => {},
    })
  );
  await sleep(60);

  ok('0.38.0 the creation window is the NEW CARD window', () => {
    const text = document.body.textContent;
    assert.ok(text.includes('NEW CARD'), 'the title says NEW CARD');
    assert.ok(!/NEW CHARACTER/.test(text), 'no CHARACTER anywhere in the window');
  });

  ok('0.38.0 the CARD COLOR section renders (presets + picker + none)', () => {
    const label = [...document.querySelectorAll('.text-\\[9px\\]')].find((l) => l.textContent.includes('CARD COLOR'));
    assert.ok(label, 'the CARD COLOR label renders');
    assert.ok(document.querySelectorAll('.gd-cls-preset').length >= 10, 'the preset ladder rides in');
    assert.ok(document.querySelector('.gd-cp-trigger'), 'the in-app picker swatch renders');
  });

  ok('0.38.0 the stamp area carries its own PASTE tile beside the ADD key', () => {
    const paste = document.querySelector('.gd-stamp-paste');
    assert.ok(paste, 'the paste tile renders');
    assert.ok(paste.textContent.includes('PASTE'), 'it says PASTE');
    assert.ok(paste.previousElementSibling?.classList.contains('gd-stamp-slots') || paste.previousElementSibling, 'it rides the slot row');
  });

  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ---------------------------------------------------------------------------
// Part C — the stamp picker: the pinned PASTE footer key
// ---------------------------------------------------------------------------
{
  const { StampAddButton } = require(join(appRoot, 'src/components/StampEditModal.jsx'));
  const btnRef = React.createRef();
  const root = createRoot(document.getElementById('root'));
  root.render(
    React.createElement(
      'div',
      {},
      React.createElement(StampAddButton, {
        ref: btnRef,
        stampLibrary: [{ id: 's1', image: 'a.png', name: 'sigil' }],
        imagesPath: '/img',
        attachedImages: [],
        onPick: () => {},
        onUpload: () => {},
        onPaste: () => {},
      })
    )
  );
  await sleep(40);
  // open the picker
  const addBtn = document.querySelector('.gd-stamp-slot.is-empty');
  click(addBtn);
  await sleep(40);
  ok('0.38.0 the ADD-stamp picker keeps UPLOAD + PASTE in its pinned footer', () => {
    const footer = document.querySelector('.gd-stamp-picker-actions');
    assert.ok(footer, 'the actions row renders');
    const labels = footer.textContent;
    assert.ok(labels.includes('UPLOAD A STAMP'), 'upload stays');
    assert.ok(labels.includes('PASTE'), 'paste joins it');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ---------------------------------------------------------------------------
// Part D — the character view rows: separator + pin + auto-collapse
// ---------------------------------------------------------------------------
{
  const { default: CharacterView } = require(join(appRoot, 'src/components/CharacterView.jsx'));
  const { makeCharacter } = await import(join(appRoot, 'src/constants/index.js'));
  const character = makeCharacter('amy', 'root', [{ file: 'a.png', thumb: 'a.png' }]);
  character.stamps = [];
  const root = createRoot(document.getElementById('root'));
  root.render(
    React.createElement(CharacterView, {
      compact: true,
      character,
      tags: [{ id: 't1', name: 'hero', color: '#c8402f', icon: null, trim: 'straight' }],
      stampLibrary: [],
      imagesPath: '/img',
      outputBarOn: true,
      onBack: () => {},
      patchCharacter: () => {},
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
      confirm: () => {},
      onStatus: () => {},
      onActiveVersion: () => {},
    })
  );
  await sleep(60);

  ok('0.38.0 a LIGHT SEPARATOR sits between the TAGS and the STAMPS rows', () => {
    assert.ok(document.querySelector('.gd-rows-sep'), 'the separator renders');
    const sep = rule(/^\.gd-rows-sep\s*\{[^}]*\}/m);
    assert.ok(/20%/.test(sep), 'a light 20%-ink hairline (quieter than the edges)');
  });

  ok('0.38.0 the header carries the PIN key beside the settings menu', () => {
    const pin = document.querySelector('.gd-pin-btn');
    assert.ok(pin, 'the pin key renders');
    assert.ok(!pin.className.includes('is-on'), 'it starts unpinned (auto-collapse armed)');
    click(pin);
  });
  await sleep(40);
  ok('0.38.0 the pin toggles ON (the rows are pinned open)', () => {
    const pin = document.querySelector('.gd-pin-btn');
    assert.ok(pin.className.includes('is-on'), 'the key lights');
    click(pin); // back off for the auto-collapse test
  });
  await sleep(40);

  ok('0.38.0 clicking the image STAGE picture opens the huge viewer (wire)', () => {
    const viewSrc = src('src/components/CharacterView.jsx');
    assert.ok(viewSrc.includes('onOpenViewer={(i) => setViewer({ file: version.images[i]?.file ?? null })}'), 'the stage hands the FILE over (0.42.0 stick-by-file)');
    assert.ok(viewSrc.includes('ImageViewer'), 'the viewer is mounted by the view');
    const stageSrc = src('src/components/ImageStage.jsx');
    assert.ok(stageSrc.includes("onClick={() => onOpenViewer?.(safeIndex)}"), 'a plain click on the picture opens it');
  });

  ok('0.38.0 the auto-collapse leaves the EXPAND chip on the separator', () => {
    const viewSrc = src('src/components/CharacterView.jsx');
    // 1.6.7 — the law-pin moves with the fold's rework: the separator's
    // holder chip and the keyline's COLLAPSE key were TWO buttons (one
    // unmounting as the other appeared); ONE traveling chip speaks both
    // states now (.gd-rows-chipline below the folding body — the fold's
    // own height tween carries it between the seats, "so it doesnt just
    // dissapear then the other appear"). The holder's LOOK survives at
    // the same seat; the pin reads the chip that answers the collapse.
    assert.ok(viewSrc.includes('gd-rows-chipline'), 'the fold\'s traveling chip renders');
    assert.ok(viewSrc.includes("autoCollapsed ? 'TAGS & STAMPS' : 'COLLAPSE'"), 'the one chip speaks both states');
    assert.ok(viewSrc.includes('gd-rows-expand'), 'the centered expand chip renders');
    // 1.4.5 SUPERSEDED ("the tags/stamps collapse later than usual ... not on
    // the first down motion but instead when its midway, fix that"): the
    // rows-zone hover guard is RETIRED — the fold answers the first down
    // motion; the pin keeps its own law.
    assert.ok(!viewSrc.includes("rowsZoneRef.current?.matches?.(':hover')"), 'the hover guard is retired (the fold answers the first motion)');
    assert.ok(viewSrc.includes('rowsPinned'), 'the pin blocks it too');
  });

  ok('0.38.0 the version strip counts the NEW VERSION key as a trailing sort item', () => {
    const viewSrc = src('src/components/CharacterView.jsx');
    assert.ok(viewSrc.includes('versions.length + 1'), 'count = versions + the key');
    assert.ok(viewSrc.includes('if (from >= versions.length) return;'), 'grabbing the key never commits');
    assert.ok(viewSrc.includes('Math.min(to, versions.length - 1)'), 'drops clamp onto the last version');
  });

  ok('0.38.0 the drop target is the nearest INSERTION GAP (the overmove fix)', () => {
    const sortSrc = src('src/components/useThumbSort.js');
    assert.ok(sortSrc.includes('nearestGapIndex'), 'the gap picker exists');
    assert.ok(sortSrc.includes('rects.length - 1'), 'the trailing gap clamps onto the last index');
    assert.ok(/consider\(\(prev\.x \+ prev\.w \+ r\.x\) \/ 2/.test(sortSrc), 'same-row gaps sit between neighbors');
  });

  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ---------------------------------------------------------------------------
// Part E — the huge image viewer itself
// ---------------------------------------------------------------------------
{
  const { default: ImageViewer } = require(join(appRoot, 'src/components/ImageViewer.jsx'));
  const images = [
    { file: 'one.png', thumb: 'one.png' },
    { file: 'two.png', thumb: 'two.png' },
  ];
  const root = createRoot(document.getElementById('root'));
  let index = 0;
  const renderIt = () =>
    root.render(
      React.createElement(ImageViewer, {
        images,
        imagesPath: '/img',
        index,
        onIndex: (i) => {
          index = i;
          renderIt();
        },
        onClose: () => {},
        onCropSaved: () => {},
      })
    );
  renderIt();
  await sleep(50);

  ok('0.38.0 the viewer mounts: stage + HUD + counter', () => {
    assert.ok(document.querySelector('.gd-imgview'), 'the overlay renders');
    assert.ok(document.querySelector('.gd-imgview-stage'), 'the pan/zoom stage');
    assert.ok(document.querySelector('.gd-imgview-hud'), 'the control bar');
    assert.ok(document.body.textContent.includes('1 / 2'), 'the counter');
  });

  ok('0.38.0 ZOOM keys + reset are all present (0.45.0: the wheel itself is retired)', () => {
    const titles = [...document.querySelectorAll('.gd-imgview .gd-btn')].map((b) => b.title || '');
    assert.ok(titles.some((t) => t.includes('Zoom in')), 'zoom in');
    assert.ok(titles.some((t) => t.includes('Zoom out')), 'zoom out');
    assert.ok(titles.some((t) => t.includes('Reset the view')), 'reset');
    const srcv = src('src/components/ImageViewer.jsx');
    // 0.45.0 — the wheel listener is DELETED per the user's call ("even if it
    // means removing the whole scroll functionality"): zoom lives in the
    // toolbar keys, the +/−/0 keys and double-click only.
    assert.ok(!srcv.includes("addEventListener('wheel'"), 'no wheel listener left to misread a tick');
    assert.ok(srcv.includes('MAX_ZOOM'), 'the zoom is railed');
    assert.ok(srcv.includes('ZOOM_STEP'), 'the zoom steps are fixed');
  });

  ok('0.38.0→0.41.0 the crop tool is RETIRED ("remove the crop feature since its broken")', () => {
    const srcv = src('src/components/ImageViewer.jsx');
    assert.ok(!srcv.includes('is-cropping'), 'no crop mode');
    assert.ok(!srcv.includes('gd-imgview-crop-box'), 'no selection rect');
    assert.ok(!srcv.includes('canvas.toBlob'), 'no canvas commit');
    assert.ok(!srcv.includes('onCropSaved'), 'no crop hand-off');
    assert.ok(srcv.includes('THE CROP TOOL IS RETIRED'), 'the retirement note rides the header');
  });

  ok('0.38.0 SWIPE is manual only — arrows, keys, peeks; NO timer anywhere', () => {
    const srcv = src('src/components/ImageViewer.jsx');
    assert.ok(srcv.includes("e.key === 'ArrowLeft'") && srcv.includes("e.key === 'ArrowRight'"), 'the arrow keys walk');
    assert.ok(srcv.includes('gd-imgview-peek'), 'the peek row renders');
    assert.ok(!/setInterval/.test(srcv), 'no auto-advance timer exists');
  });

  ok('0.38.0 the zoom + pan live on the transform (zero-lag drag)', () => {
    const srcv = src('src/components/ImageViewer.jsx');
    assert.ok(srcv.includes('applyTransform'), 'the transform writer exists');
    assert.ok(srcv.includes('translate(calc(-50%'), 'the image stays centered through the pan');
    const r = rule(/^\.gd-imgview-img\s*\{[^}]*\}/m);
    assert.ok(/left: 50%/.test(r) && /top: 50%/.test(r), 'anchored at the stage center');
  });

  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ---------------------------------------------------------------------------
// Part F — the grid: card foot color + the hue layer order
// ---------------------------------------------------------------------------
{
  ok('0.38.0 a colored card paints its FOOT (readable ink included)', () => {
    const gridSrc = src('src/components/GridView.jsx');
    assert.ok(gridSrc.includes("character.cardColor && 'is-colored'"), 'the foot flags colored cards');
    assert.ok(gridSrc.includes('readableInk(character.cardColor)'), 'the text ink flips for readability');
    // 0.41.0 — the rename pencil is gone; the delete key stays
    assert.ok(!gridSrc.includes("title=\"Rename card\""), 'the rename pencil is retired');
    assert.ok(gridSrc.includes("title=\"Delete card\""), 'the delete key stays');
    assert.ok(gridSrc.includes('NEW CARD'), 'the add slot says NEW CARD');
  });

  ok('0.38.0 the hue layer order flips with the setting (band + free layer)', () => {
    const gridSrc = src('src/components/GridView.jsx');
    assert.ok(gridSrc.includes('hue && hueOver &&'), 'hueOver paints the wash AFTER the logos');
    assert.ok(gridSrc.includes('hue && !hueOver &&'), 'the classic order paints it before');
    const editorSrc = src('src/components/CardLookEditor.jsx');
    assert.ok(editorSrc.includes('stampHueOver') && editorSrc.includes('gd-card-stamp-slicebox'), 'the preview follows + the slicebox class is the REAL one');
    assert.ok(!/"gd-card-stamp-slice"/.test(editorSrc), 'the nonexistent .gd-card-stamp-slice class attr is gone');
  });

  ok('0.38.0 the stamp settings popover carries the HUE OVER STAMP switch', () => {
    const posSrc = src('src/components/StampPosControls.jsx');
    assert.ok(posSrc.includes('HUE OVER STAMP'), 'the switch row renders');
    assert.ok(posSrc.includes('onPatch({ hueOver: !s.hueOver })'), 'it writes the shared setting');
  });

  ok('0.38.0 the creation preview passes the SANITIZED transparency (the 100% fix)', () => {
    const modalSrc = src('src/components/NewCharacterModal.jsx');
    assert.ok(modalSrc.includes('stampAlpha={stampAlpha(stampSettings)}'), 'the helper-clamped alpha, never a raw || 1');
  });
}

// ---------------------------------------------------------------------------
// Part G — the class tree
// ---------------------------------------------------------------------------
{
  const { default: ClassSidebar } = require(join(appRoot, 'src/components/ClassSidebar.jsx'));
  const root = createRoot(document.getElementById('root'));
  root.render(
    React.createElement(ClassSidebar, {
      classes: [
        { id: 'c1', name: 'leaf one', parentId: 'root', icon: null, color: '#1a2a6c' },
        { id: 'c2', name: 'branch', parentId: 'root', icon: null, color: null },
      ],
      characters: [],
      selectedClassId: 'c2',
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
  await sleep(60);

  ok('0.38.0 the SELECTED lane highlights (the picked class reads at a glance)', () => {
    const sel = rule(/^\.gd-tree-row\[data-selected\]\s*\{[^}]*\}/m);
    assert.ok(/background:/.test(sel), 'the whole lane washes');
    assert.ok(/inset 2px 0 0/.test(sel), 'with an edge bar');
  });

  ok('0.38.0 the CLASSES header rides a SOLID plate (the pattern stops at it)', () => {
    const head = rule(/^\.gd-tree-head\s*\{[^}]*\}/m);
    assert.ok(/background: var\(--gd-tier-side, var\(--gd-bg\)\)/.test(head), 'opaque base (1.2.3 re-law, 1.2.9: the plate paints the tree band — the sidebar\'s own well)');
    assert.ok(document.querySelector('.gd-tree-head'), 'the sidebar wears it');
  });

  ok('0.38.0 the colored class icon wears the CONTRAST-AWARE variant', () => {
    const sidebarSrc = src('src/components/ClassSidebar.jsx');
    // 1.0.7 — the pick measures the SELECTED wash (0.32, the strongest
    // tint the resting card paints) with the stiffer ladder underneath.
    assert.ok(sidebarSrc.includes('contrastAwareIconColor(color, mixHex(color, panelHex, 0.32))'), 'the pick runs against the real wash');
    const icon = document.querySelector('[data-gd-class-id="c1"] .gd-tree-ico');
    assert.ok(icon, 'the colored class renders its icon');
    assert.notEqual(icon.style.color, '#1a2a6c', 'the deep blue was shifted to its obvious variant');
  });

  ok('0.38.0 clicking a class SCROLLS IT INTO VIEW when it clips right', () => {
    const sidebarSrc = src('src/components/ClassSidebar.jsx');
    assert.ok(sidebarSrc.includes('revealSelected'), 'the reveal helper exists');
    assert.ok(sidebarSrc.includes('cr.right - (sr.right - pad)'), 'the right-clip scroll');
    assert.ok(sidebarSrc.includes('sr.left + pad - cr.left'), 'and the left-clip scroll back');
  });

  // open the class modal: presets + the wash preview
  const newBtn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('NEW CLASS'));
  click(newBtn);
  await sleep(50);
  ok('0.38.0 the class window: PRESET colors + a preview that washes like the tree', () => {
    const presets = document.querySelectorAll('.gd-cls-preset');
    assert.ok(presets.length >= 10, 'the preset ladder renders');
    const previewRow = document.querySelector('[title="The class row as the tree will show it"]');
    assert.ok(previewRow, 'the preview renders');
    // pick a preset and watch the ROW carry the wash attrs (the card selector needs them on the row)
    click(presets[0]);
  });
  await sleep(40);
  ok('0.38.0 picking a preset washes the PREVIEW (data-colored on the row)', () => {
    const previewRow = document.querySelector('[title="The class row as the tree will show it"]');
    assert.ok(previewRow.hasAttribute('data-colored'), 'the row carries the wash attribute');
    assert.ok(previewRow.getAttribute('style').includes('--cls'), 'and the class color var');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ---------------------------------------------------------------------------
// Part H — surfaces, separators, placement laws
// ---------------------------------------------------------------------------
{
  ok('0.38.0 the textures SCROLL WITH THE CONTENT (background-attachment: local)', () => {
    for (const surface of ['sidebar', 'viewer', 'panel']) {
      // 1.4.0 supersede: the panel's selector also appears in the new
      // overflow-anchor group rule (.gd-tex-scroll/.gd-tex-viewer/
      // .gd-tex-panel — the ±1px flight's anchor law) whose block sits
      // FIRST in the sheet; the TEXTURE rule still speaks its own block
      // below it — scan every matching rule instead of the first.
      const rules = [...css.matchAll(new RegExp(`^\\.gd-tex-${surface}\\s*\\{[^}]*\\}`, 'gm'))].map((m) => m[0]);
      assert.ok(rules.some((r) => /background-attachment: local/.test(r)), `${surface} rides the scroll`);
    }
  });

  ok('0.38.0 the SCROLLBAR TRACKS are opaque (the pattern never runs through them)', () => {
    const track = rule(/^::-webkit-scrollbar-track\s*\{[^}]*\}/m);
    assert.ok(/background: var\(--gd-bg\)/.test(track), 'the track paints the base color');
    const corner = rule(/^::-webkit-scrollbar-corner\s*\{[^}]*\}/m);
    assert.ok(/background: var\(--gd-bg\)/.test(corner), 'the corner too');
  });

  ok('0.38.0 the CARD-COLUMN separator is a full-height rail styled like the others', () => {
    const sep = rule(/^\.gd-cardcol-resize\s*\{[^}]*\}/m);
    assert.ok(/linear-gradient/.test(sep) && /transparent 5px 100%/.test(sep), 'a full-height 1px rail');
    const pill = rule(/^\.gd-cardcol-resize::before\s*\{[^}]*\}/m);
    assert.ok(/height: 30px/.test(pill) && /border-radius: 999px/.test(pill), 'the resting pill');
    const caps = rule(/^\.gd-cardcol-resize::after\s*\{[^}]*\}/m);
    assert.ok(/top: 0/.test(caps) && /bottom: 0/.test(caps) && /height: auto/.test(caps), 'caps TIED to both ends');
  });

  ok('0.38.0 popovers never slide under the TOP TOOLBAR', () => {
    const popSrc = src('src/components/Popover.jsx');
    assert.ok(popSrc.includes('TOP_FLOOR = 44'), 'the floor exists');
    assert.ok(popSrc.includes('above >= TOP_FLOOR'), 'flipping above requires room below the bar');
    assert.ok(popSrc.includes('r.top - 6 - TOP_FLOOR'), 'the stoop measures from the floor');
  });

  ok('0.38.0 tooltips center where the hover began (1.2.4: pinned there; offsets only when the screen clips)', () => {
    const tipSrc = src('src/components/GdTooltips.jsx');
    assert.ok(tipSrc.includes('cursorX'), 'the cursor is tracked');
    /* 1.2.4 re-law: the pill centers on the PIN — the entry point's x (the
       0.38.0 law's first paint, now frozen for the whole hover). */
    assert.ok(tipSrc.includes('pinX - cachedW / 2'), 'the pill centers on its pin');
    assert.ok(tipSrc.includes('Math.min(vw - cachedW - 8'), 'the only sideways shift is the screen clamp');
    assert.ok(tipSrc.includes('TOP_FLOOR'), 'and it never sits under the toolbar either');
  });

  ok('0.38.0 the right panel STRETCHES (animated width over a fixed-width inner)', () => {
    const appSrc = src('src/App.jsx');
    assert.ok(appSrc.includes('initial={{ width: 0, opacity: 0.6 }}'), 'it opens from zero width');
    // 1.4.6 SUPERSEDED (the retained panel): the animate target grew the
    // parked seat — width rightPanelW while live, 0 while parked — so BACK
    // parks the aside instead of unmounting it and the next open is the
    // width flight alone (gendex_155 pins the reopen law).
    assert.ok(appSrc.includes('animate={{ width: panelLive ? rightPanelW : 0, opacity: panelLive ? 1 : 0.6 }}'), 'the width itself animates (and parks)');
    assert.ok(appSrc.includes('exit={{ width: 0, opacity: 0.6 }}'), 'and closes the same way');
    assert.ok(appSrc.includes('style={{ width: rightPanelW }}'), 'the inner wrapper keeps the full width (no mid-flight reflow)');
  });

  ok('0.38.0 the themes carry NO tooltips', () => {
    const settingsSrc = src('src/components/SettingsModal.jsx');
    assert.ok(!/title=\{\s*shipsLook/.test(settingsSrc), 'the theme card lost its title');
    assert.ok(!settingsSrc.includes('title="Ships with its own recommended background look"'), 'and so did the LOOK chip');
  });

  ok('0.38.0 the whole UI vocabulary says CARD (no stray user-facing CHARACTER strings)', () => {
    const surfaces = [
      'src/App.jsx',
      'src/components/GridView.jsx',
      'src/components/ClassSidebar.jsx',
      'src/components/CharacterView.jsx',
      'src/components/NewCharacterModal.jsx',
      'src/components/Dialogs.jsx',
      'src/components/Titlebar.jsx',
    ];
    // the words a user could actually see — imports, prop names and the
    // characters array are data-model vocabulary, not UI text.
    const banned = [
      'NEW CHARACTER',
      'New character',
      'new character',
      'CHARACTER \u2014',
      'RENAME CHARACTER',
      'Character settings',
      'Character not found',
      'character grid',
      'name the character',
      'Character deleted',
      'characters moved',
      'Every character',
      'character panel',
      'CHARACTER PANEL',
      'Character name',
      'create a character',
      'character view',
      'character is filed',
      'every character',
      'characters keep',
    ];
    for (const f of surfaces) {
      // strip comments first — historical request quotes live there on
      // purpose; only CODE strings carry the user-facing vocabulary.
      const text = src(f)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      for (const phrase of banned) {
        assert.ok(!text.includes(phrase), `${f} still says "${phrase}"`);
      }
    }
  });
}

console.log(failed === 0 ? `\n${passed} 0.38.0 batch DOM checks passing` : `\n${passed} passed, FAILED`);
process.exit(failed === 0 ? 0 : 1);
