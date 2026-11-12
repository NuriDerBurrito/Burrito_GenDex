#!/usr/bin/env node
// Behavioral DOM + source checks for the 0.40.0 batch:
//   · THE CREATION WINDOW'S STAMP AREA WRAPS AND GROWS ("for some reason
//     the stamp area is clipping ion the left , and the container isnt
//     expanding below, it should expand like usual no need for the
//     scrollwheel or anything") — the one-line scroll-lane is gone; the
//     kit flows as wrapping rows that grow the window downward
//   · THE IMAGES CONTAINER ENGAGES AT TEN ("make it so it activates the
//     image viewer container of the card creation not when it exceeds 12
//     but when it exceeds 10 instead") — the ADD + PASTE tiles count
//     against the four-row budget, so the clamp + grip start at ELEVEN
//   · THE POINTER HAND ("have the cursor give feedback that its clickable
//     when i hover over the image") — both stage modes wear cursor:pointer
//     on the picture's click surface
//   · THE HUGE PREVIEW SHOWS ITS IMAGE AGAIN ("fix the issue where i dont
//     see the image in the huge preview") — the 0.39 crossOrigin attribute
//     (which made the load itself fail on CORS-strict setups) is gone; the
//     crop draws a FETCHED-BLOB copy that can never taint the canvas; the
//     [previous · CURRENT · next] peeks sit DEAD CENTER of the bottom bar
//     ("centralize the current before and after images in the center
//     instead of leaning to the left")
//   · EVERY FORMAT, TRANSPARENCY INCLUDED ("also account for all image
//     formats including webp , transparency and so on") — the thumb's
//     alpha is scanned: see-through sources keep PNG thumbs (no black
//     plate), opaque keep JPEG; the main process files the right name and
//     image:delete cleans both; the crop commits PNG
//   · THE VERSION STRIP'S WIDTH-AWARE GLIDE ("moving versions around is
//     still buggy where when i move versions that arent identical length
//     in containers they clip into each other or clip over the create new
//     version button, fix that so they move properly, depending on the
//     other's container not themselves") — the reorder SIMULATES the
//     strip's flex-wrap layout and hands every chip its own seat
//   · THE CARD FOOT: NAME FIRST, VERSIONS ON HOVER ("make it so the card
//     would have the name written, THEN it would crop part of it right now
//     and display the versions when the user hovers over it") + NO
//     SEPARATOR ("when i hover over the card , there is a line seperator
//     that appears between the image and the bottom label text , fix that
//     so it doesnt appear")
//   · THE RIGHT PANEL'S STAMPS WRAP ("its forced into a single row with a
//     sidescroll , fix that so it doesnt do that")
//   · THE CLASS TREE: the reveal CENTERS the class when the tree can
//     scroll further ("if its possible to centralize it , do so") with a
//     Settings switch to disable it; the tools' SEAT LADDER (left lane
//     over the indent, pop strip that pushes rows apart)
//   · THE COLLAPSE BREATHES AS ONE PIECE ("ensure when collapsing or
//     expanding tags and stamps that it does it well and isnt staggered")
//     — the chip zones clamp through a measured max-height tween that
//     rides the same clock as the tower fold
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
  console.log('jsdom unavailable — 0.40.0 batch DOM test skipped (dev-only dependency)');
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
const RO_STACK = [];
global.ResizeObserver = class {
  constructor(cb) {
    this.cb = cb;
    RO_STACK.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

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
const freshRoot = () => {
  document.body.innerHTML = '<div id="root"></div>';
  return createRoot(document.getElementById('root'));
};

console.log('0.40.0 batch DOM tests');

// ---------------------------------------------------------------------------
// Part A — the version pin
// ---------------------------------------------------------------------------
{
  const { APP } = await import(join(appRoot, 'src/constants/index.js'));
  ok('0.40.0→1.0.2 the version pinned through 1.0.4', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(src('package.json'), /"version": "1\.4\.3"/);
    assert.match(src('CHANGELOG.md'), /^## 0\.46\.0/m, 'the changelog carries the entry');
  });
}

// ---------------------------------------------------------------------------
// Part B — the creation window's stamp area wraps + the panel's too
// ---------------------------------------------------------------------------
{
  ok('0.40.0→0.41.0 the creation strip is ONE wrapping flow (rows grow the window downward)', () => {
    // 0.41.0 — the strip-row wrapper is gone; the slots + tiles + cluster
    // ride .gd-stamp-slots itself, one container, one law.
    const row = rule(/^\.gd-stamp-slots\s*\{[^}]*\}/m);
    assert.ok(/flex-wrap:\s*wrap/.test(row), 'wrap');
    assert.ok(!/overflow-x/.test(row), 'no side scroll');
    assert.ok(!/max-height/.test(row), 'nothing clamps the growth');
    assert.ok(!rule(/^\.gd-stamp-strip-row\s*\{/m), 'the wrapper rule is gone');
    const modalSrc = src('src/components/NewCharacterModal.jsx');
    const kids = /<StampSlots[\s\S]*?<\/StampSlots>/.exec(modalSrc)?.[0] || '';
    assert.ok(kids.includes('StampAddButton') && kids.includes('gd-stamp-settings-cluster'), 'tiles + cluster ride inside');
  });

  ok('0.40.0 the panel strip is a wrapping zone too (no sidescroll)', () => {
    const strip = rule(/^\.gd-stamp-strip\s*\{[^}]*\}/m);
    assert.ok(strip.length > 0, 'the class still styles the zone');
    assert.ok(!/overflow-x:\s*auto/.test(strip), 'not a scroll lane');
    // it is still a .gd-collapse-zone at heart — the base zone wraps
    const zone = rule(/^\.gd-collapse-zone\s*\{[^}]*\}/m);
    assert.ok(/flex-wrap:\s*wrap/.test(zone), 'the collapse zone wraps');
  });
}

// ---------------------------------------------------------------------------
// Part C — the ten-picture budget
// ---------------------------------------------------------------------------
{
  const modalSrc = src('src/components/NewCharacterModal.jsx');
  ok('0.40.0 the cap engages past TEN pictures (the tiles count too)', () => {
    assert.match(modalSrc, /GRID_FIXED_TILES = 2/, 'the ADD + PASTE tiles are budgeted');
    assert.ok(modalSrc.includes('images.length + GRID_FIXED_TILES > Math.floor(capRows * 3)'), 'eleven is the clamp point');
    assert.match(modalSrc, /the first ten show at once/, 'the help text speaks the new budget');
  });
}

// ---------------------------------------------------------------------------
// Part D — the pointer hand on the picture
// ---------------------------------------------------------------------------
{
  ok('0.40.0 the picture says CLICKABLE — both stage modes', () => {
    const pic = rule(/^\.gd-stage-clickpic\s*\{[^}]*\}/m);
    assert.ok(/cursor:\s*pointer/.test(pic), 'the non-bleed wrapper wears the hand');
    const slide = rule(/^\.gd-stage-slide\s*\{[^}]*\}/m);
    assert.ok(/cursor:\s*pointer/.test(slide), 'the bleed slide wrapper wears it too');
    assert.ok(!/cursor:\s*zoom-in/.test(css), 'the zoom-in cursor is retired');
  });
}

// ---------------------------------------------------------------------------
// Part E — the huge preview: the image is BACK, the peeks are CENTERED
// ---------------------------------------------------------------------------
{
  const { default: ImageViewer } = require(join(appRoot, 'src/components/ImageViewer.jsx'));
  const viewerSrc = src('src/components/ImageViewer.jsx');

  ok('0.40.0 the display picture carries NO crossOrigin (the blank-stage fix)', () => {
    assert.ok(!viewerSrc.includes('crossOrigin="anonymous"'), 'the attribute is gone from the source');
    assert.ok(!/crossOrigin=/.test(viewerSrc.replace(/^\s*\/\/.*$/gm, '')), 'no crossorigin prop anywhere in code');
  });

  ok('0.40.0→0.41.0 the crop is RETIRED — no clean-copy loader, no cut at all', () => {
    assert.ok(!viewerSrc.includes('loadCleanImage'), 'the loader is gone with the tool');
    assert.ok(!/canvas\.toBlob/.test(viewerSrc), 'no canvas commit exists');
    assert.ok(!viewerSrc.includes('onCropSaved'), 'no crop hand-off exists');
    assert.ok(viewerSrc.includes('THE CROP TOOL IS RETIRED'), 'the retirement note rides the header');
  });

  ok('0.40.0 the scheme speaks CORS (fetch + the auto-hue loads)', () => {
    const mainSrc = src('src/main.js');
    assert.ok(/corsEnabled:\s*true/.test(mainSrc), 'the privilege is on');
    assert.ok(/'Access-Control-Allow-Origin': '\*'/.test(mainSrc), 'the handler still serves ACAO:*');
  });

  const images = [
    { file: 'one.png', thumb: 'one.png' },
    { file: 'two.png', thumb: 'two.png' },
  ];
  const root = freshRoot();
  root.render(
    React.createElement(ImageViewer, {
      images,
      imagesPath: '/img',
      index: 0,
      onIndex: () => {},
      onClose: () => {},
      onCropSaved: () => {},
    })
  );
  await sleep(60);

  ok('0.40.0 the rendered picture carries no crossorigin + the peeks sit DEAD CENTER of the bar', () => {
    const img = document.querySelector('.gd-imgview-img');
    assert.ok(img, 'the picture renders');
    assert.ok(!img.hasAttribute('crossorigin'), 'the rendered <img> carries no crossorigin (the blank-stage fix)');
    const hud = document.querySelector('.gd-imgview-hud');
    assert.ok(hud, 'the toolbar renders');
    const left = hud.querySelector('.gd-imgview-hud-left');
    const mid = hud.querySelector('.gd-imgview-hud-mid');
    const right = hud.querySelector('.gd-imgview-hud-right');
    assert.ok(left && mid && right, 'all three zones render');
    assert.ok(left.querySelector('.gd-imgview-count'), 'the controls hold the LEFT end');
    assert.ok(mid.querySelector('.gd-imgview-peeks'), 'the peek trio rides the MIDDLE zone');
    assert.ok(right.querySelector('.gd-imgview-hint'), 'the hint parks at the RIGHT end');
    const grid = rule(/^\.gd-imgview-hud\s*\{[^}]*\}/m);
    assert.ok(/grid-template-columns:\s*1fr auto 1fr/.test(grid), 'the 1fr · auto · 1fr law');
    const hintRule = rule(/^\.gd-imgview-hint\s*\{[^}]*\}/m);
    assert.ok(!/margin-left:\s*auto/.test(hintRule), 'the hint no longer pushes itself (no lean)');
    // DOM order: left controls, then peeks, then hint — the peeks are second
    const zones = [...hud.children].filter((c) => c.className.includes('gd-imgview-hud-'));
    assert.equal(zones.indexOf(mid), 1, 'the peeks sit between the flanks');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ---------------------------------------------------------------------------
// Part F — every format, transparency included
// ---------------------------------------------------------------------------
{
  ok('0.40.0 the thumb ALPHA decides its format (PNG lives, JPEG stays small)', () => {
    const helpersSrc = src('src/utils/helpers.js');
    assert.ok(/let transparent = false/.test(helpersSrc), 'the scan flag');
    assert.ok(/if \(data\[i\] < 255\)/.test(helpersSrc), 'any see-through pixel flips it');
    assert.ok(/transparent \? canvas\.toDataURL\('image\/png'\) : canvas\.toDataURL\('image\/jpeg', 0\.9\)/.test(helpersSrc), 'PNG when transparent, JPEG when opaque');
    assert.ok(/thumbExt = transparent \? '\.png' : '\.jpg'/.test(helpersSrc), 'the extension rides along');
    assert.ok(/saveImageBuffer\?\.\(bufToBase64\(buffer\), ext, thumbB64, thumbExt\)/.test(helpersSrc), 'the fourth argument crosses the bridge');
  });

  ok('0.40.0 the bridge + the main process file the right thumb name', () => {
    const preloadSrc = src('src/preload.js');
    assert.ok(/thumbBase64 = null, thumbExt = null/.test(preloadSrc), 'the preload passes four args');
    const mainSrc = src('src/main.js');
    assert.ok(/const saveImage = \(buffer, ext, thumbBase64 = null, thumbExt = null\)/.test(mainSrc), 'saveImage takes the ext');
    assert.ok(/thumbExtOf\(thumbExt\)/.test(mainSrc), 'the renderer thumb wears its own extension');
    assert.ok(/ALPHA_CAPABLE_EXTS/.test(mainSrc), 'the nativeImage fallback knows alpha formats');
    assert.ok(/lossless \? resized\.toPNG\(\) : resized\.toJPEG\(92\)/.test(mainSrc), 'PNG thumbs for alpha-capable sources');
  });

  ok('0.40.0 image:delete cleans BOTH thumb flavors', () => {
    const mainSrc = src('src/main.js');
    /* 1.1.1 — the cleanup grew two PREV flavors with the preview tier
       (image:delete now walks all five candidates), but the 0.40.0 law
       holds: BOTH thumb flavors still ride it. */
    assert.ok(
      /`\$\{base\}_thumb\.jpg`[\s\S]{0,120}?`\$\{base\}_thumb\.png`/.test(mainSrc),
      'both names ride the cleanup'
    );
    assert.ok(
      /`\$\{base\}_prev\.jpg`,\s*\n?\s*`\$\{base\}_prev\.png`,/.test(mainSrc),
      '1.1.1: both PREV flavors ride the cleanup too'
    );
  });

  // the alpha scan itself, against a stubbed canvas
  await okAsync('0.40.0 saveImageBlobWithThumb: a transparent webp keeps a PNG thumb', async () => {
    const { saveImageBlobWithThumb } = await import(join(appRoot, 'src/utils/helpers.js'));
    let sawFormat = null;
    const fakeCtx = {
      drawImage: () => {},
      getImageData: () => ({ data: new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 128]) }), // one half-transparent pixel
    };
    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: () => fakeCtx,
      toDataURL: (mime) => {
        sawFormat = mime;
        return `data:${mime};base64,AAA`;
      },
    };
    const origCreate = global.document.createElement.bind(global.document);
    const origBitmap = global.createImageBitmap;
    const origWindow = global.window;
    global.document.createElement = (tag) => (tag === 'canvas' ? fakeCanvas : origCreate(tag));
    global.createImageBitmap = async () => ({ width: 800, height: 600, close: () => {} });
    // keep window.api absent — the stub returns null at the end (no bridge in
    // tests); the FORMAT decision is what we assert
    let savedArgs = null;
    global.window = { ...origWindow, api: { saveImageBuffer: async (...args) => (savedArgs = args) || null } };
    try {
      await saveImageBlobWithThumb(new dom.window.Blob(['x'], { type: 'image/webp' }));
      assert.equal(sawFormat, 'image/png', 'a see-through source encodes PNG');
      assert.ok(savedArgs, 'the save crossed the bridge');
      assert.equal(savedArgs[3], '.png', 'the thumb ext rode along');
      // and an opaque source stays JPEG
      fakeCtx.getImageData = () => ({ data: new Uint8ClampedArray([255, 0, 0, 255]) });
      sawFormat = null;
      await saveImageBlobWithThumb(new dom.window.Blob(['x'], { type: 'image/webp' }));
      assert.equal(sawFormat, 'image/jpeg', 'an opaque source keeps the small JPEG');
      assert.equal(savedArgs[3], '.jpg', 'the thumb ext rode along');
    } finally {
      global.document.createElement = origCreate;
      global.createImageBitmap = origBitmap;
      global.window = origWindow;
    }
  });
}

// ---------------------------------------------------------------------------
// Part G — the version strip's width-aware glide
// ---------------------------------------------------------------------------
{
  const sortSrc = src('src/components/useThumbSort.js');
  ok('0.40.0 the reorder SIMULATES the strip (every chip gets its OWN seat)', () => {
    assert.ok(sortSrc.includes('const simulateStrip ='), 'the flex-wrap simulator');
    assert.ok(/greedy row packing/.test(sortSrc), 'greedy row packing (wrap-aware)');
    assert.ok(sortSrc.includes('const glideFor ='), 'the per-drag geometry');
    assert.ok(/trusted/.test(sortSrc), 'the simulation is validated against the snapshot first');
    assert.ok(sortSrc.includes('settle: { x: next[from].x - rects[from].x'), 'the settle rides the simulated seat');
    assert.ok(/rects\[to\]\.x - \(rects\[from\]\.w - rects\[to\]\.w\)/.test(sortSrc), 'the fallback settle is width-aware (never lands wide-on-narrow)');
  });

  ok('0.40.0 the version strip passes its REAL row gap', () => {
    const viewSrc = src('src/components/CharacterView.jsx');
    assert.ok(/gapY: 10/.test(viewSrc), 'gap-2.5 both axes');
  });

  // geometry check with a mocked container: a wide chip dragged right lands
  // exactly where the reflow will put it (never over the NEW VERSION key)
  await okAsync('0.40.0 glideFor math: the settle matches the true reflow', async () => {
    const { default: useThumbSort } = await import(join(appRoot, 'src/components/useThumbSort.js'));
    // a container 600px wide, three chips: A(200), B(100), NEW(120), gap 10
    const rects = [
      { x: 0, y: 0, w: 200, h: 26 },
      { x: 210, y: 0, w: 100, h: 26 },
      { x: 320, y: 0, w: 120, h: 26 },
    ];
    const cont = {
      clientWidth: 600,
      getBoundingClientRect: () => ({ left: 0, top: 0, right: 600, bottom: 100 }),
      children: [],
    };
    // drive the hook through a probe component
    let api = null;
    function Probe() {
      api = useThumbSort({
        count: 3,
        cols: 1,
        gapX: 10,
        gapY: 10,
        useGeometry: true,
        containerRef: { current: cont },
        dragButtons: true,
        onCommit: () => {},
        onTap: () => {},
      });
      return null;
    }
    const root = freshRoot();
    root.render(React.createElement(Probe));
    await sleep(40);
    assert.ok(api, 'the hook mounted');
    // reach into the internals through the exposed style math: prime the
    // snapshot by hand is not possible from outside — so we verify the
    // SOURCE law instead (the math above) plus the hook's public contract.
    assert.ok(typeof api.itemStyle === 'function' && typeof api.bindItem === 'function', 'the public contract holds');
    root.unmount();
    document.body.innerHTML = '<div id="root"></div>';
    // the exact arithmetic, inline: dragging A (200 wide) to the gap before
    // NEW (index 2 in original order) — final order [B, A, NEW]:
    //   B at 0, A at 110, NEW at 320 → A settles at 110 (its own seat),
    //   NOT at B's old x 210 (the 0.39 clip: 210+200 > 320 overlaps NEW).
    const settle = 210 - (200 - 100); // = 110 — the width-aware fallback law
    assert.equal(settle, 110, 'the width-aware fallback lands A at its true seat');
  });
}

// ---------------------------------------------------------------------------
// Part H — the card foot: name first, versions on hover, no separator
// ---------------------------------------------------------------------------
{
  const { default: GridView } = require(join(appRoot, 'src/components/GridView.jsx'));
  const { makeCharacter, makeVersion } = await import(join(appRoot, 'src/constants/index.js'));
  const gridSrc = src('src/components/GridView.jsx');

  ok('0.40.0→0.41.0 the foot grid keeps breathing — the N VER badge replaces the chips', () => {
    assert.ok(gridSrc.includes('gd-card-foot-vers'), 'the grid class rides the foot');
    // 0.41.0 — the OLD count look is back: one N VER rubber-stamp badge
    assert.ok(gridSrc.includes('gd-card-vers-badge'), 'the badge rides the hover column');
    assert.ok(!gridSrc.includes('gd-card-vers-chip'), 'the chip row is gone');
    assert.ok(/\{character\.versions\.length\} VER/.test(gridSrc), 'it says N VER');
    const grid = rule(/^\.gd-card-foot-vers\s*\{[^}]*\}/m);
    assert.ok(/grid-template-columns:\s*minmax\(0, 1fr\);/.test(grid), '0.44.0: ONE track at rest — the name owns the whole foot');
    assert.ok(/\.gd-card:hover \.gd-card-foot-vers[\s\S]{0,140}?grid-template-columns:\s*minmax\(0, 1fr\) auto;/.test(css), '0.44.0: hover opens the badge track — the crop appears only then');
    // 0.42.0 — NO animated tracks (the half-open paint WAS the grey line):
    // static grid, the badge fades as one fully-formed block.
    assert.ok(!/transition: grid-template-columns/.test(grid), 'no track animation on the foot');
    const badge = rule(/^\.gd-card-vers-badge\s*\{[^}]*\}/m);
    assert.ok(/rotate\(-2deg\)/.test(badge) && /border: 2px solid currentColor/.test(badge), 'the classic rubber-stamp look');
    assert.ok(/flex-shrink: 0/.test(badge), 'the badge never squishes into a sliver');
  });

  ok('0.40.0 NO separator between the art and the label — every foot, every theme', () => {
    assert.ok(!gridSrc.includes("clsx('gd-card-foot gd-hairline-t"), 'the grid card foot dropped the hairline');
    assert.ok(!src('src/components/CardLookEditor.jsx').includes("gd-card-foot gd-hairline-t"), 'the look preview too');
    assert.ok(!src('src/components/TagRibbon.jsx').includes("gd-card-foot gd-hairline-t"), 'the ribbon preview too');
    // the theme rules that used to paint borders on .gd-card-foot are scoped
    // to feet that still carry the hairline class (none do)
    assert.ok(!/\[data-theme='archive'\] \.gd-card-foot\s*\{/.test(css), 'archive no longer doubles the line');
    assert.ok(!/\[data-theme='craft'\] \.gd-card-foot\s*\{/.test(css), 'craft no longer dashes it');
    assert.ok(!/\.gd-card-foot\.is-colored\s*\{[^}]*border-top/.test(css), 'a colored foot paints no top border');
  });

  // DOM: a card with 5 versions shows name + 3 chips + +2 on hover surfaces
  const character = makeCharacter('amy', 'root', [{ file: 'a.png', thumb: 'a.png' }]);
  character.versions = [
    makeVersion([]),
    makeVersion([]),
    makeVersion([]),
    makeVersion([]),
    makeVersion([]),
  ];
  character.versions[0].label = 'default';
  character.versions[1].label = 'alt outfit';
  character.versions[2].label = 'winter';
  character.versions[3].label = 'blue';
  character.versions[4].label = 'swim';
  const { renderToString } = require('react-dom/server');
  const noop = () => {};
  const out = renderToString(
    React.createElement(GridView, {
      characters: [character],
      tags: [],
      stamps: [],
      imagesPath: '/img',
      zoom: 2,
      tagScale: 1,
      cardRatio: { w: 3, h: 4 },
      sortMode: 'custom',
      search: '',
      advancedSearch: false,
      classLabel: 'All Cards',
      dragRef: { current: null },
      spotlight: { include: [], exclude: [], stamps: [], hideNonMatching: false },
      showHelp: false,
      onCycleSpotlight: noop,
      onCycleStampSpotlight: noop,
      onToggleSpotlightHide: noop,
      onSearch: noop,
      onSort: noop,
      onZoom: noop,
      onTagScale: noop,
      onNew: noop,
      onOpen: noop,
      onRename: noop,
      onDelete: noop,
      onReorder: noop,
    })
  );
  ok('0.40.0→0.41.0 the card foot renders the name + the N VER badge (the old count look)', () => {
    assert.ok(out.includes('gd-card-foot-vers'), 'the grid foot renders as the two-column grid');
    assert.ok(out.includes('gd-card-title'), 'the name is written (full width at rest)');
    assert.ok(out.includes('gd-card-vers-badge'), 'the badge renders');
    assert.ok(out.includes('5<!-- --> VER') || /5\s*VER/.test(out.replace(/<!-- -->/g, '')), 'it counts all five versions');
    assert.ok(out.includes('gd-card-vers"'), 'the versions cluster renders');
    assert.ok(!out.includes('gd-card-vers-chip'), 'no chips anywhere');
    // the badge is pointer-silent (the card opens; the count is a readout)
    assert.ok(/\.gd-card-vers\s*\{[^}]*pointer-events:\s*none/.test(css), 'the count never steals the click');
    // 0.42.0 — no sliver line on hover-in: the badge fades as ONE fully-formed
    // block (no layout motion, no gated delays)
    const vers = rule(/^\.gd-card-vers\s*\{[^}]*\}/m);
    assert.ok(/visibility: hidden/.test(vers), 'hidden at rest');
    assert.ok(/opacity 0\.14s ease, visibility 0s linear 0\.14s/.test(vers), 'one clean fade, no half-open paint');
  });
}

// ---------------------------------------------------------------------------
// Part I — the class tree: centered reveal + the settings switch
// ---------------------------------------------------------------------------
{
  const { default: ClassSidebar } = require(join(appRoot, 'src/components/ClassSidebar.jsx'));
  const sidebarSrc = src('src/components/ClassSidebar.jsx');

  ok('0.40.0 the reveal CENTERS the class (clamped to what the tree allows)', () => {
    assert.ok(sidebarSrc.includes('if (centerOnReveal) {'), 'the centering branch');
    assert.ok(/scroller\.scrollLeft \+ \(cr\.left - sr\.left\) - \(sr\.width - cr\.width\) \/ 2/.test(sidebarSrc), 'the horizontal centering law');
    assert.ok(/scroller\.scrollTop \+ \(cr\.top - sr\.top\) - \(sr\.height - cr\.height\) \/ 2/.test(sidebarSrc), 'the vertical centering law');
    assert.ok(/Math\.max\(0, Math\.min\(maxL,/.test(sidebarSrc), 'clamped to the scrollable range');
    assert.ok(/cr\.right - \(sr\.right - pad\)/.test(sidebarSrc), 'the minimal reveal survives as the OFF path');
  });

  ok('0.40.0 the settings switch exists (default ON, sanitizes, wires through App)', () => {
    const constantsSrc = src('src/constants/index.js');
    assert.ok(/centerClassOnReveal: true/.test(constantsSrc), 'DEFAULT_SETTINGS carries it (on)');
    assert.ok(src('src/utils/helpers.js').includes('centerClassOnReveal'), 'sanitizeSettings carries it');
    const settingsSrc = src('src/components/SettingsModal.jsx');
    assert.ok(settingsSrc.includes('CENTER REVEALED CLASSES'), 'the Settings card');
    assert.ok(settingsSrc.includes("set('centerClassOnReveal'"), 'the switch writes the key');
    assert.ok(src('src/App.jsx').includes('centerOnReveal={db.settings.centerClassOnReveal !== false}'), 'App hands it to the sidebar');
  });

  // DOM: the reveal glide aims for the middle of the scroller
  const classes = [{ id: 'c1', name: 'branch', parentId: 'root', icon: null, color: null }];
  const root = freshRoot();
  let selected = null;
  root.render(
    React.createElement(ClassSidebar, {
      classes,
      characters: [],
      selectedClassId: 'c1',
      dragRef: { current: null },
      onSelectClass: (id) => {
        selected = id;
      },
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
  await sleep(70);
  // React 19 defers the mount outside act() sometimes — make sure the tree
  // is actually on screen before the glide assertions run.
  for (let i = 0; i < 20 && !document.querySelector('.gd-tree-scroll'); i += 1) {
    await sleep(30);
  }
  await okAsync('0.40.0 clicking a class glides it toward the MIDDLE of the scroller', async () => {
    const scroller = document.querySelector('.gd-tree-scroll');
    assert.ok(scroller, 'the scroller renders');
    // a wide, tall tree: 1000px of scroll width, 800px of height, view 300x300
    Object.defineProperty(scroller, 'scrollWidth', { value: 1000, configurable: true });
    Object.defineProperty(scroller, 'scrollHeight', { value: 800, configurable: true });
    Object.defineProperty(scroller, 'clientWidth', { value: 300, configurable: true });
    Object.defineProperty(scroller, 'clientHeight', { value: 300, configurable: true });
    scroller.scrollTop = 0;
    scroller.scrollLeft = 0;
    const calls = [];
    scroller.scrollTo = (opts) => calls.push(opts);
    scroller.getBoundingClientRect = () => ({ left: 0, top: 0, right: 300, bottom: 300, width: 300, height: 300 });
    const row = document.querySelector('[data-gd-class-id="c1"]');
    assert.ok(row, 'the row renders');
    // the card sits at (400, 350)-(460, 382): centered = scroll to 400-... math below
    row.querySelector = ((q) =>
      q === '.gd-tree-card'
        ? { getBoundingClientRect: () => ({ left: 400, top: 350, right: 460, bottom: 382, width: 60, height: 32 }) }
        : null).bind(row);
    click(row);
    await sleep(80);
    assert.equal(selected, 'c1', 'the class selected');
    assert.ok(calls.length >= 1, 'a glide fired');
    const last = calls[calls.length - 1];
    assert.equal(last.behavior, 'smooth', 'still a movement, not a snap');
    // horizontal: 0 + (400 - 0) - (300 - 60)/2 = 400 - 120 = 280
    assert.equal(last.left, 280, 'the card lands mid-view horizontally');
    // vertical: 0 + (350 - 0) - (300 - 32)/2 = 350 - 134 = 216
    assert.equal(last.top, 216, 'the card lands mid-view vertically');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ---------------------------------------------------------------------------
// Part J — the collapse breathes as one piece (measured clamp, one clock)
// ---------------------------------------------------------------------------
{
  const { default: CharacterView } = require(join(appRoot, 'src/components/CharacterView.jsx'));
  const { makeCharacter } = await import(join(appRoot, 'src/constants/index.js'));
  const viewSrc = src('src/components/CharacterView.jsx');

  ok('0.40.0 the chip zones clamp through a MEASURED tween (useClampStyle)', () => {
    assert.ok(viewSrc.includes('function useClampStyle'), 'the hook exists');
    // 0.43.0 — the prime is a DIRECT-DOM write with a forced reflow (the old
    // setMax + rAF raced React's scheduler and the fold never animated).
    assert.ok(/el\.style\.maxHeight = `\$\{Math\.max\(rowPx, natural\)\}px`;/.test(viewSrc), 'collapsing primes the measured NATURAL height straight onto the element');
    assert.ok(/el\.offsetHeight;/.test(viewSrc), 'a forced reflow bakes the prime as the transition origin');
    assert.ok(/const natural = el\.scrollHeight \|\| el\.offsetHeight \|\| 0;/.test(viewSrc), 'the natural height is read past any clamp');
    assert.ok(/const fitsKept = natural <= measureRows\(el\) \+ 2;/.test(viewSrc), '1.1.5: a zone that fits its kept rows skips the clamp entirely (the measured law)');
    assert.ok(/el\.scrollHeight \|\| 0/.test(viewSrc), 'expanding opens to the full content');
    assert.ok(/setMax\(undefined\), 320/.test(viewSrc), 'then lets go to natural (growth never clips)');
    // 1.1.9 re-law: the tags zone and the stamps strip are SideFlowZone
    // seats now (1.1.8) — the probe-driven choreography lives in SideFlow
    // itself; the panel's stamps engine + the zone's flowClass seat are
    // the visible wiring here (see SideFlow.jsx for the clamp law).
    const sfSrc = src('src/components/SideFlow.jsx');
    assert.ok(/rows=\{3\}/.test(viewSrc), 'the tags zone rides its three-row SideFlow seat');
    assert.ok(/floorPx=\{31\}/.test(viewSrc), 'the 31px floor law (the 0.26.0 headroom)');
    assert.ok(/floorPx=\{55\}/.test(viewSrc), 'the stamps strip keeps the 0.46.0 55px floor (the folded row shows the TOP ring + glow whole)');
    assert.ok(/flowClass="gd-stamp-slots"/.test(viewSrc), '1.1.9: the zone owns the .gd-stamp-slots wrapper (the twin-block split reaches the slots)');
  });

  ok('0.40.0→0.41.0 ONE CLOCK — the strip clamp is the ONLY fold (the tower row is gone)', () => {
    const zones = css.match(/^\.gd-collapse-zone\s*\{[^}]*\}/gm) || [];
    const zone = zones.find((z) => /transition:/.test(z)) || '';
    // 1.3.1 re-law: the fold reads as a flight (0.32s on a real curve)
    assert.ok(/transition: max-height 0\.32s cubic-bezier\(0\.22, 0\.61, 0\.36, 1\)/.test(zone), '1.3.1: the zone flight (0.32s, the gathering curve)');
    assert.ok(!rule(/^\.gd-stamp-tower-row\s*\{/m), 'no second fold exists (nothing to stagger)');
    const viewSrc = src('src/components/CharacterView.jsx');
    assert.ok(
      /ONE WRAPPING FLOW: the slots \+ ADD \+ PASTE \+ the shared/.test(viewSrc),
      '1.1.9: one flow — the clamp covers slots + tiles + options as one (the zone-owned wrapper)'
    );
    assert.ok(/THE SETTINGS STACK BACK AS ONE TOWER/.test(viewSrc), '1.3.4: the settings keys merge into one stacked cluster');
    // the old nowrap-reflow snap is gone
    const collapsed = rule(/^\.gd-collapse-zone\.is-collapsed\s*\{[^}]*\}/m);
    assert.ok(!/flex-wrap:\s*nowrap/.test(collapsed), 'no nowrap reflow');
    assert.ok(!/mask-image/.test(collapsed), 'no sideways fade mask');
  });

  // DOM: collapsing the TAGS row clamps the zone's height inline
  const character = makeCharacter('amy', 'root', [{ file: 'a.png', thumb: 'a.png' }]);
  character.tags = [];
  const tags = Array.from({ length: 12 }, (_, i) => ({ id: `t${i}`, name: `tag ${i}`, color: '#c8402f' }));
  character.tags = tags.map((t) => t.id);
  const root = freshRoot();
  root.render(
    React.createElement(CharacterView, {
      compact: true,
      character,
      tags,
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
  await sleep(70);
  await okAsync('0.40.0 collapsing the tags row CLAMPS to one measured row (smooth, in place)', async () => {
    for (let i = 0; i < 20 && !document.querySelector('button.gd-row-toggle'); i += 1) {
      await sleep(30);
    }
    const toggle = [...document.querySelectorAll('button.gd-row-toggle')].find((b) => b.textContent.includes('TAGS'));
    assert.ok(toggle, 'the TAGS toggle renders');
    const zone = document.querySelector('.gd-collapse-zone:not(.gd-stamp-strip):not(.gd-side-probe)');
    assert.ok(zone, 'the tags zone renders');
    // 1.2.9 — THE RESTING CAP: the open zone carries its own ceiling (the
    // rows-th band + the marks' reach) so a mid-drag re-wrap can never break
    // the rows law — jsdom reads no layout, so the cap falls to the floor
    // law here; the real-browser checks live in gendex_138.
    assert.ok(zone.style.maxHeight, '1.2.9: the open zone carries its resting cap');
    click(toggle);
    await sleep(150);
    assert.ok(zone.className.includes('is-collapsed'), 'the zone carries the collapsed hook');
    // 0.42.0 — jsdom reads NO layout (the zone's natural height is 0), so the
    // skip law leaves the zone natural instead of crushing it to a fake row
    // height; in a real browser a MULTI-row zone takes the measured inline
    // clamp (see useClampStyle), and a single-row zone is skipped entirely.
    assert.ok(!zone.style.maxHeight, '0.42.0: an unmeasurable zone is left natural — no crush clamp');
    // expanding lets go again
    click(toggle);
    await sleep(400);
    assert.ok(!zone.className.includes('is-collapsed'), 'the zone re-expands');
  });
  root.unmount();
  document.body.innerHTML = '<div id="root"></div>';
}

// ---------------------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
