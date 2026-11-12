#!/usr/bin/env node
// Behavioral DOM + source checks for the 0.43.0 batch:
//   · THE ZOOM ENGINE IS A SINGLE-WRITER PIPELINE — the viewer's wheel
//     listener attaches ONCE and reads the LIVE view from a ref (the old
//     re-attach-on-every-zoom + stale-closure math was the 20-version
//     oscillation); every input path writes through applyView, and the
//     creation preview's crop wheel compounds through the LAST APPLIED
//     crop instead of a render-stale rect.
//   · THE MARKS TRAVEL — the welded TOP/COVER marks ride one wrapper and
//     useFlipMark FLIPs them from the old image/stamp to the new one.
//   · THE STAMPS COLLAPSE PLAYS + DOESN'T CROP THE LEFT — the prime is a
//     direct-DOM write with a forced reflow in a LAYOUT effect, and the
//     strip carries horizontal headroom past the ring's glow.
//   · THE REORDER COMMIT RIDES THE SETTLE'S OWN END — transitionend with a
//     generous fallback, never a fixed tick that lands mid-flight.
//   · RIGHT-CLICK, RETHOUGHT — buttons open their own options + undo/redo;
//     toolbars/headers stay silent; the detail view's gear carries its own
//     menu.
//   · TOOLTIPS UNDER MENUS — z 940 (under the ctx 950) and menus dismiss a
//     visible pill on open.
//   · IMPORT YOUR OWN FONT — BODY_FONT_OPTIONS carries 'custom', sanitize
//     allows it, theme.js registers/stores it, and the Look tab has the
//     IMPORT FONT / REMOVE keys.
//   · THE COVER KEY RESTS WHILE IT HOLDS THE TITLE; the edit pencil answers
//     the press; the theme name row is balanced; the prompt boxes wear the
//     well; the scallop trim is symmetric by construction (edge-anchored
//     rails, thicker arcs, cusp beads).
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
  console.log('jsdom unavailable — 0.43.0 batch DOM test skipped (dev-only dependency)');
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
const mount = async (Comp, props) => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(React.createElement(Comp, props));
  await flush();
  return { host, root };
};

// ===========================================================================
// Part A — the zoom engine: one listener, live values, single writer
// ===========================================================================
{
  const viewerSrc = src('src/components/ImageViewer.jsx');
  const editorSrc = src('src/components/CardLookEditor.jsx');

  ok('0.43.0 (0.45 amended) the viewer keeps the single-writer pipeline — the WHEEL is retired', () => {
    assert.ok(/const viewRef = useRef\(\{ zoom: 1, tx: 0, ty: 0 \}\);/.test(viewerSrc), 'the live view ref exists');
    assert.ok(/const applyView = \(z, x, y\) => \{/.test(viewerSrc), 'the single writer is defined');
    // 0.45.0 — the wheel listener itself is DELETED (the gesture is retired
    // on both named surfaces); every other path still funnels through applyView.
    assert.ok(!/addEventListener\('wheel'/.test(viewerSrc), 'no wheel listener left in the viewer');
    assert.ok(!/deltaY/.test(viewerSrc), 'no wheel math anywhere');
    assert.ok(/e\.key === '\+' \|\| e\.key === '='/.test(viewerSrc), 'the + key still zooms in through the ref');
    assert.ok(/e\.key === '-'/.test(viewerSrc), 'the - key still zooms out');
    assert.ok(/e\.key === '0'/.test(viewerSrc), '0 resets the view');
  });

  ok('0.43.0 every zoom input path funnels through applyView', () => {
    const applyCalls = (viewerSrc.match(/applyView\(/g) || []).length;
    assert.ok(applyCalls >= 4, `applyView covers wheel, keys, reset, dblclick — found ${applyCalls} calls`);
    assert.ok(/const applyView = \(z, x, y\) => \{/.test(viewerSrc), 'the single writer is defined');
    assert.ok(/viewRef\.current = \{ zoom: next, tx: clamped\.x, ty: clamped\.y \};/.test(viewerSrc), 'applyView keeps the ref in lockstep');
  });

  ok('0.43.0 the zoom floor rose — a stray path can no longer shrink to a speck', () => {
    const m = /const MIN_ZOOM = ([\d.]+);/.exec(viewerSrc);
    assert.ok(m, 'MIN_ZOOM exists');
    assert.ok(parseFloat(m[1]) >= 0.2, `floor is at least 0.2 — got ${m[1]}`);
  });

  ok('0.43.0 the creation wheel compounds through the LAST APPLIED crop', () => {
    assert.ok(/const appliedRef = useRef\(undefined\);/.test(editorSrc), 'the applied-crop ref exists');
    assert.ok(/appliedRef\.current = stored;/.test(editorSrc), 'applyCrop records what it just computed');
    assert.ok(/appliedRef\.current !== undefined \? appliedRef\.current : liveRef\.current\.crop/.test(editorSrc), 'the wheel builds on the freshest value');
  });
}

// ===========================================================================
// Part B — the marks (0.45.0: they POP, they don't fly)
// ===========================================================================
{
  const stampSrc = src('src/components/StampEditModal.jsx');
  const managerSrc = src('src/components/ImageManagerModal.jsx');
  const createSrc = src('src/components/NewCharacterModal.jsx');

  // 0.44.0 — the FLIP became the FLIGHT; 0.45.0 — the flight is retired
  // app-wide (measured mid-commit, it could still leave from a stale seat).
  // Every mark is keyed by its OWNER inside an AnimatePresence: a change of
  // hands pops the old mark out and the new one in (~180ms, scale + fade).
  // useFlipMark itself is deleted from the codebase.
  ok('0.43.0 (0.45 amended) the mark hand-off POPS — no flight machinery left', () => {
    assert.ok(!existsSync('src/utils/useFlipMark.js'), 'useFlipMark.js is deleted');
    for (const s of [stampSrc, managerSrc, createSrc]) {
      assert.ok(!/useFlipMark/.test(s), 'no call sites remain');
    }
    assert.ok(/<AnimatePresence initial=\{false\}>/.test(stampSrc), 'the stamps ride AnimatePresence');
    assert.ok(/duration: 0\.18/.test(stampSrc), 'the pop plays ~180ms');
    assert.ok(/exit=\{\{ opacity: 0, scale: 0\.6 \}\}/.test(stampSrc), 'pop out = scale + fade');
  });

  ok('0.43.0 the stamp TOP ring + tab ride ONE wrapper (0.45: keyed by the top stamp)', () => {
    assert.ok(stampSrc.includes('className="gd-stamp-topmark"'), 'the topmark wrapper');
    assert.ok(/key=\{stamps\[0\]\.id\}/.test(stampSrc), 'keyed by the TOP STAMP\'S OWN ID');
    assert.ok(stampSrc.includes('<span className="gd-stamp-topring" />'), 'the ring rides inside');
    assert.ok(stampSrc.includes('<span className="gd-stamp-slot-top">TOP</span>'), 'the tab rides inside');
  });

  ok('0.43.0 the manager COVER badge + SELECTION ring pop between tiles', () => {
    assert.ok(/key=\{`cover-\$\{img\.file\}`\}/.test(managerSrc), 'the badge is keyed by the cover file');
    assert.ok(/key=\{`ring-\$\{img\.file\}`\}/.test(managerSrc), 'the ring is keyed by the selected file');
    assert.ok(managerSrc.includes('className="gd-img-slot-cover"'), 'the badge rides its slot');
    assert.ok(managerSrc.includes('className="gd-img-slot-ring"'), 'the ring rides its slot');
    assert.ok(/<AnimatePresence initial=\{false\}>/.test(managerSrc), 'both ride AnimatePresence');
  });

  ok('0.43.0 the creation grid COVER marks pop', () => {
    assert.ok(createSrc.includes('className="gd-thumb-topmark"'), 'the topmark wrapper');
    assert.ok(/key=\{`cover-\$\{img\.file\}`\}/.test(createSrc), 'keyed by the cover image\'s own file');
    assert.ok(createSrc.includes('<span className="gd-thumb-ring" />'), 'the ring rides inside');
    assert.ok(createSrc.includes('<span className="gd-thumb-badge">COVER</span>'), 'the badge rides inside');
    assert.ok(/<AnimatePresence initial=\{false\}>/.test(createSrc), 'rides AnimatePresence');
  });
}

// ===========================================================================
// Part C — the stamps collapse plays + the headroom kills the left crop
// ===========================================================================
{
  const viewSrc = src('src/components/CharacterView.jsx');

  ok('0.43.0 the clamp primes DIRECT-DOM with a forced reflow, in a layout effect', () => {
    // 1.0.5 — the window widened: useClampStyle grew a measureOneRow helper
    // (the measured one-row clamp); the four laws below are unchanged.
    // 1.1.4 — the window widened again: measureOneRow now reads rects
    // relative to the zone (the 1.1.4 collapse fix), so the body grew.
    // 1.1.5 — and again: the helper speaks N rows now (measureRows, the rows
    // param), so the body grew once more.
    const clampMatch = viewSrc.match(/function useClampStyle\(ref, clamped, rowPx, rows = 1\) \{[\s\S]{0,12000}?\n\}/);
    assert.ok(clampMatch, 'useClampStyle found');
    const body = clampMatch[0];
    assert.ok(/useLayoutEffect\(\(\) => \{/.test(body), 'runs as a layout effect — before paint');
    assert.ok(/el\.style\.maxHeight = `/.test(body), 'the prime is written straight to the element');
    assert.ok(/el\.offsetHeight;/.test(body), 'a forced reflow bakes the prime as the transition origin');
    assert.ok(!/requestAnimationFrame\(\(\) => setMax\(rowPx\)\)/.test(body), 'the racing rAF prime is gone');
  });

  ok('0.43.0 the stamp strip carries horizontal headroom past the ring glow', () => {
    const strip = /\.gd-stamp-strip\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/padding: 7px 5px 0;/.test(strip), 'side + top headroom: ' + strip.replace(/\s+/g, ' '));
    assert.ok(/margin: -7px -5px 0;/.test(strip), 'matching negative margins keep the slots in place');
  });

  ok('0.43.0 the topmark wrapper sits exactly where the ring always sat', () => {
    const wrap = /\.gd-stamp-topmark\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/inset: -2px;/.test(wrap), 'the wrapper is the ring\'s old box');
    const ring = /\.gd-stamp-topring\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/inset: 0;/.test(ring), 'the ring fills the wrapper');
    const tab = /\.gd-stamp-slot-top\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/bottom: 2px;/.test(tab) && /left: 2px;/.test(tab), 'the tab lands back on the slot rim');
  });
}

// ===========================================================================
// Part D — the reorder commit rides the settle's own end
// ===========================================================================
{
  const sortSrc = src('src/components/useThumbSort.js');

  ok('0.43.0 the commit listens for the settle transitionend (transform only)', () => {
    assert.ok(/el\.addEventListener\('transitionend', onSettleEnd\);/.test(sortSrc), 'the end event is watched');
    assert.ok(/ev\.propertyName && ev\.propertyName !== 'transform'/.test(sortSrc), 'other properties are ignored');
    assert.ok(/let committed = false;/.test(sortSrc), 'one-shot latch — no double commit');
  });

  ok('0.43.0 the fallback window is generous (no more fixed mid-flight tick)', () => {
    const m = /setTimeout\(runCommit, from !== to \? (\d+) : (\d+)\);/.exec(sortSrc);
    assert.ok(m, 'the fallback timer arms');
    assert.ok(parseInt(m[1], 10) >= 300, `reorder fallback ≥ 300ms — got ${m[1]}`);
    assert.ok(!/185 : 175/.test(sortSrc), 'the old 185ms fixed tick is gone');
  });

  ok('0.43.0 the settle guard holds an extra frame', () => {
    const guards = (sortSrc.match(/requestAnimationFrame\(\(\) =>/g) || []).length;
    assert.ok(/requestAnimationFrame\(\(\) =>\s*\n?\s*requestAnimationFrame\(\(\) =>\s*\n?\s*requestAnimationFrame\(\(\) =>/.test(sortSrc), 'three nested frames before the guard drops');
  });
}

// ===========================================================================
// Part E — right-click rethought + tooltips under menus
// ===========================================================================
{
  const appSrc = src('src/App.jsx');
  const menuSrc = src('src/components/GdContextMenu.jsx');
  // 0.44.0 — the "Press <label>" row retired; 0.45.0 — THE FILTER / ORDER
  // KEYS SPEAK FOR THEMSELVES: two toolbar keys carry data-gd-opts and their
  // whole menu is the ONE action that makes sense (Clear selection); every
  // other button still gets the header + undo/redo crew.
  ok('0.43.0 (0.45 amended) BUTTONS speak — per-key actions, never a fake press', () => {
    assert.ok(/const btn = target\.closest\('button'\);/.test(appSrc), 'the button branch exists');
    assert.ok(!/Press \$\{short\}/.test(appSrc), 'the generic press entry is gone');
    assert.ok(/const header = \(name \|\| 'KEY'\)\.toUpperCase\(\);/.test(appSrc), 'the menu header names the key');
    assert.ok(/optsKey === 'filter' \|\| optsKey === 'order'/.test(appSrc), 'the filter / order keys carry their own branch');
    assert.ok(/label: 'Clear selection'/.test(appSrc), 'their one action is Clear selection');
    assert.ok(/setSortAndPersist\('custom'\)/.test(appSrc), 'the order key returns the grid to its custom order');
  });

  ok('0.43.0 toolbars and headers stay quiet', () => {
    assert.ok(/barRegion === 'titlebar' \|\| barRegion === 'header'/.test(appSrc), 'titlebar + viewer toolbar silent');
    assert.ok(/target\.closest\('\.gd-char-head'\)/.test(appSrc), "the detail view's sticky header is silent");
    assert.ok(!/header: 'TOP BAR'/.test(appSrc), 'the old TOP BAR menu is gone');
  });

  // 0.45.0 — THE GEAR SPEAKS AGAIN: the 0.44 silence was the wrong cure —
  // the real bug was painting position:fixed INSIDE the sticky header's
  // compositing layer. GdContextMenu now PORTALS TO document.body, and the
  // gear's right-click carries EDIT CARD / DELETE / UNDO / REDO wired from
  // App through both CharacterView mounts.
  ok('0.43.0 (0.45 amended) the gear right-click opens its OWN menu through the body portal', () => {
    const viewSrc = src('src/components/CharacterView.jsx');
    assert.ok(/function CharSettingsMenu\(\{ onEditCard, onDelete, onUndo, onRedo, canUndo, canRedo, scUndo, scRedo \}\)/.test(viewSrc), 'the gear takes the full crew from App');
    assert.ok(/\{ctx && <GdContextMenu x=\{ctx\.x\} y=\{ctx\.y\} items=\{ctxItems\}/.test(viewSrc), 'the menu opens on the press');
    assert.ok(/label: 'Edit card', icon: IdCard, onPick: onEditCard/.test(viewSrc.replace(/\s+/g, ' ')), 'EDIT CARD rides along');
    assert.ok(/label: 'Delete', icon: Trash2, danger: true, onPick: onDelete/.test(viewSrc.replace(/\s+/g, ' ')), 'DELETE rides along');
    assert.ok(/label: 'Undo', icon: Undo2,/.test(viewSrc.replace(/\s+/g, ' ')), 'UNDO rides along');
    assert.ok(/label: 'Redo', icon: Redo2,/.test(viewSrc.replace(/\s+/g, ' ')), 'REDO rides along');
    // and the portal law that made it all land correctly
    assert.ok(src('src/components/GdContextMenu.jsx').includes('createPortal'), 'the menu portals out of any compositing layer');
    assert.ok(viewSrc.includes('EDIT CARD'), 'the left-click popover keeps its EDIT CARD key');
  });

  ok('0.43.0 the tooltip pill sits UNDER the context menus', () => {
    const tip = /\.gd-tip\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/z-index: 940;/.test(tip), 'the pill is at 940');
    const ctx = /\.gd-ctx-menu\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/z-index: 950;/.test(ctx), 'the menus stay at 950 — above the pill');
    assert.ok(!/z-index: 1000;/.test(tip), 'the old 1000 is gone');
  });

  ok('0.43.0 a menu opening dismisses the visible pill', () => {
    assert.ok(menuSrc.includes("document.querySelector('[data-gd-tooltip]')"), 'the menu reaches for the pill');
    assert.ok(menuSrc.includes("tip.style.display = 'none';"), 'and hides it');
  });
}

// ===========================================================================
// Part F — font import + UI polish
// ===========================================================================
{
  const constSrc = src('src/constants/index.js');
  const helpSrc = src('src/utils/helpers.js');
  const themeSrc = src('src/utils/theme.js');
  const settingsSrc = src('src/components/SettingsModal.jsx');
  const verSrc = src('src/components/VersionSettingsModal.jsx');

  // 1.0.0 — the custom font seat RETIRED ("remove the custom font option"):
  // these three checks now pin the retirement instead of the feature.
  ok('0.43.0 the font family grew a CUSTOM seat (retired in 1.0.0)', () => {
    assert.ok(!/\{ id: 'custom', label: 'Custom' \},/.test(constSrc), 'BODY_FONT_OPTIONS lost the custom seat');
    assert.ok(!/'mono', 'grotesk', 'serif', 'custom'/.test(helpSrc), 'sanitize drops it');
    assert.ok(!/custom: "'/.test(themeSrc), 'no custom stack remains');
  });

  ok('0.43.0 theme.js owns the imported font\'s life (retired in 1.0.0)', () => {
    assert.ok(!/registerCustomFont\(dataUrl\)/.test(themeSrc), 'the registrar is gone');
    assert.ok(!/new FontFace\(/.test(themeSrc), 'no FontFace is registered');
    assert.ok(!/ensureCustomFont\(\)/.test(themeSrc), 'the boot loader is gone');
    assert.ok(/clearLegacyCustomFontStorage\(\)/.test(themeSrc), 'a one-time sweep clears the stored bytes');
  });

  ok('0.43.0 the Look tab imports + removes fonts (retired in 1.0.0)', () => {
    assert.ok(!/IMPORT FONT/.test(settingsSrc), 'the import key is gone');
    assert.ok(!/accept="\.ttf,\.otf,\.woff,\.woff2/.test(settingsSrc), 'the font file input is gone');
    assert.ok(!/onRemoveFont/.test(settingsSrc), 'the remove path is gone');
  });

  ok('0.43.0 the cover key rests while it holds the title', () => {
    assert.ok(/disabled=\{isPreview\}/.test(verSrc), 'disabled on the current cover');
    assert.ok(/make another version the cover to change it/.test(verSrc), 'the tooltip explains the only way forward');
  });

  ok('0.43.0 the edit pencil answers the press', () => {
    assert.ok(/\.gd-version-edit:active\s*\{/.test(css), 'the active state exists');
    assert.ok(/transform: scale\(0\.94\);/.test(css), 'the press seats deeper');
  });

  ok('0.43.0 the theme name row is balanced (not hugging the floor)', () => {
    const row = /\.gd-theme-name-row\s*\{[^}]*\}/.exec(css)?.[0] || '';
    assert.ok(/padding: 5px 8px;/.test(row), 'balanced padding');
    assert.ok(!/6px 8px 1px/.test(row), 'the bottom-heavy old padding is gone');
  });

  ok('0.43.0 the prompt boxes wear the well', () => {
    assert.ok(/\.gd-prompt-box\s*\{/.test(css), 'the well class exists');
    assert.ok(/border-left: 3px solid/.test(css), 'the accent shoulder');
    assert.ok(src('src/components/PartEditor.jsx').includes('gd-prompt-box'), 'part content boxes wear it');
    assert.ok(src('src/components/CharacterView.jsx').includes('gd-prompt-box'), 'the notes box wears it');
  });
}

// ===========================================================================
// Part G — the scallop trim is symmetric by construction
// ===========================================================================
{
  ok('0.43.0 every scallop edge carries the same anatomy', () => {
    const after = /\.gd-trim-scallop::after\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
    assert.ok(/at 50% 7\.5px/.test(after), 'top picot at the mirrored half');
    assert.ok(/at 50% 2\.5px/.test(after), 'bottom picot at the mirrored half');
    assert.ok(/at 7\.5px 50%/.test(after), 'left picot');
    assert.ok(/at 2\.5px 50%/.test(after), 'right picot');
    assert.ok((after.match(/circle 1\.7px/g) || []).length === 4, 'cusp beads on all four edges');
  });

  ok('0.43.0 the stitch rails anchor from their OWN edge (no more lean)', () => {
    const before = /\.gd-trim-scallop::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
    assert.ok(/left 17px top 9px,/.test(before), 'top rail anchored from top');
    assert.ok(/left 17px bottom 9px,/.test(before), 'bottom rail anchored from bottom');
    assert.ok(/left 9px top 17px,/.test(before), 'left rail anchored from left');
    assert.ok(/right 9px top 17px,/.test(before), 'right rail anchored from right');
    assert.ok(!/calc\(100% - 10\.5px\)/.test(before), 'the mixed-anchor era is over');
  });

  ok('0.43.0 the arcs are thick enough to survive subpixel snapping', () => {
    const after = /\.gd-trim-scallop::after\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
    assert.ok(/transparent 0 4\.7px, var\(--s-c\) 4\.7px 6\.1px, transparent 6\.2px/.test(after), '1.4px main stroke');
  });
}

// ===========================================================================
// Part H — live DOM: the viewer's wheel accumulates across rapid ticks
// (0.44.0 — awaited before the summary; these used to die silently at the
// process.exit before they could finish)
// ===========================================================================
const partH = async () => {
{
  const viewerPath = join(appRoot, 'src/components/ImageViewer.jsx');
  const ImageViewer = require(viewerPath).default;

  await okAsync('0.43.0 (0.45 amended) the wheel is GONE — the keys zoom, the gesture falls through', async () => {
    const images = [{ file: 'a.png', thumb: 'a.png' }, { file: 'b.png', thumb: 'b.png' }];
    let idx = 0;
    const onIndex = (i) => { idx = typeof i === 'function' ? i(idx) : i; };
    const { host, root } = await mount(ImageViewer, { images, imagesPath: 'C:/img', index: 0, onIndex, onClose() {}, onSetCover() {}, onOpenManager() {} });
    const stage = document.body.querySelector('.gd-imgview-stage');
    assert.ok(stage, 'the stage mounted');
    assert.ok(stage.querySelector('.gd-imgview-img'), 'the picture mounted');

    // the gesture is RETIRED: wheels on the stage are not consumed anymore
    const ev = new dom.window.WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -100 });
    stage.dispatchEvent(ev);
    await flush();
    assert.ok(!ev.defaultPrevented, 'the wheel falls through — no listener answers');

    // but the + KEY still compounds through the live ref (6 rapid presses)
    const key = (k) => window.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: k, bubbles: true }));
    for (let i = 0; i < 6; i += 1) key('+');
    await flush();
    const zoomVal = document.body.querySelector('.gd-imgview-zoomval')?.textContent || '';
    assert.ok(zoomVal.endsWith('%'), 'the zoom readout paints');
    const pct = parseInt(zoomVal, 10);
    assert.ok(pct > 100, `six + presses compound ABOVE 100% — got ${pct}%`);
    for (let i = 0; i < 12; i += 1) key('-');
    await flush();
    const pct2 = parseInt(document.body.querySelector('.gd-imgview-zoomval')?.textContent || '0', 10);
    assert.ok(pct2 < pct, `the - key actually descends (${pct}% -> ${pct2}%)`);
    assert.ok(pct2 >= 20, `never collapses below the floor (${pct2}%)`);
    // and 0 resets
    key('0');
    await flush();
    const pct3 = parseInt(document.body.querySelector('.gd-imgview-zoomval')?.textContent || '0', 10);
    assert.ok(pct3 === 100, `0 returns to 100% — got ${pct3}%`);
    root.unmount();
  });

  await okAsync('0.43.0 the KEY menu dismisses a parked tooltip pill', async () => {
    // a fake parked tooltip pill in the document
    const tip = document.createElement('div');
    tip.className = 'gd-tip is-on';
    tip.setAttribute('data-gd-tooltip', '1');
    tip.style.display = '';
    document.body.appendChild(tip);
    const GdContextMenu = require(join(appRoot, 'src/components/GdContextMenu.jsx')).default;
    const { host, root } = await mount(GdContextMenu, {
      x: 40, y: 40,
      items: [{ id: 'a', label: 'One', onPick() {} }, { id: 'b', label: 'Two', onPick() {} }],
      onClose() {},
    });
    await flush();
    assert.ok(tip.style.display === 'none', 'the pill was dismissed the moment the menu mounted');
    assert.ok(!tip.classList.contains('is-on'), 'and its visible state cleared');
    root.unmount();
    tip.remove();
  });
}

// ===========================================================================
}; // end partH

partH().finally(() => {
  console.log(`\n0.43.0 batch: ${passed} passed, ${failed} failed${failed ? ' — FIX ABOVE' : ' — all green'}`);
  process.exit(failed ? 1 : 0);
});
