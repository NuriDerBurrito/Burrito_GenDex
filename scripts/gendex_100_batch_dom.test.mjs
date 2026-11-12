// 1.0.0 batch DOM + source checks — the graduation wave.
//
//   · THE RELEASE HOLD COVERS THE WOKEN, NOT JUST THE DROPPED ("when i
//     switch images around in the image manager, sometimes the image left
//     behind would move slightly up in its own container"): the hover
//     recompute at capture-release arms the tile UNDER THE POINTER — a
//     gliding neighbor, not the dragged item the 0.45 hold covered. The
//     commit now holds EVERY tile the release woke (dragged + the sort tile
//     under the release point) as ONE set, cleared together when the pointer
//     genuinely leaves; a cancelled drag gets the same hold.
//   · THE REACTIVATION CLEANSLATE ("tooltips sometimes when i minimize or
//     switch between apps and return back would always be stuck on screen"):
//     leave clean (blur + visibilitychange-hidden + the stale cursor track
//     dropped), return clean (window focus ends the pill and mutes the OS's
//     refocus-focusin for a short guard window), ground truth (a pointer
//     event provably off the current anchor ends the pill).
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
  console.log('jsdom unavailable — 1.0.0 batch DOM test skipped (dev-only dependency)');
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
global.MutationObserver = dom.window.MutationObserver;
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
    console.log(`  FAIL ${passed + failed > 0 ? passed + failed : 1} — ${name}\n      ${String(e && e.message).split('\n')[0]}`);
  }
};
const okAsync = async (name, fn) => {
  try {
    await fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL ${passed + failed > 0 ? passed + failed : 1} — ${name}\n      ${String(e && e.message).split('\n')[0]}`);
  }
};
const flush = () => new Promise((r) => setTimeout(r, 30));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ===========================================================================
// Part A — source checks for the graduation wave
// ===========================================================================
{
  const APP = require(join(appRoot, 'src/constants/index.js')).APP;
  const sortSrc = src('src/components/useThumbSort.js');
  const tipSrc = src('src/components/GdTooltips.jsx');

  ok('1.0.0 the version bumped everywhere', () => {
    assert.equal(APP.version, '1.4.3');
    assert.match(src('package.json'), /"version": "1\.4\.3"/);
    assert.match(src('CHANGELOG.md'), /^## 1\.0\.0/m, 'the changelog carries the entry');
  });

  ok('1.0.0 the release hold captures the release point', () => {
    assert.ok(/const releaseX = Number\.isFinite\(e\.clientX\) \? e\.clientX : null;/.test(sortSrc), 'the release coords are captured');
    assert.ok(/document\.elementFromPoint\(releaseX, releaseY\)/.test(sortSrc), 'the commit hit-tests the release point');
    assert.ok(/hit\.closest\('\.gd-sort-item'\)/.test(sortSrc), 'the hit climbs to a sort tile');
  });

  ok('1.0.0 the hold is a SET: the dragged tile AND the tile under the release point', () => {
    assert.ok(/const held = \[el\];/.test(sortSrc), 'the held set starts with the dragged tile');
    assert.ok(/held\.push\(tile\);/.test(sortSrc), 'the woken neighbor joins the set');
    assert.ok(/for \(const h of held\) h\.classList\.add\('gd-just-dropped'\);/.test(sortSrc), 'every held tile wears the hold');
    assert.ok(/for \(const h of held\) h\.classList\.remove\('gd-just-dropped'\);/.test(sortSrc), 'and they all clear together');
    assert.ok(/h\.contains\(target\)\) return; \/\/ still inside a held tile/.test(sortSrc), 'the clear waits for the pointer to leave them ALL');
  });

  ok('1.0.0 a cancelled drag holds the tile it was released over too', () => {
    /* 1.2.6 — THE RELEASE PATHS, HOISTED: the cancel body lives in the
       named cancelAt closure now (the element's onPointerCancel and the
       drag's safety nets speak the one path). */
    const cancelBlock = /const cancelAt = \(e\) => \{[\s\S]{0,2600}?commitTimerRef\.current = setTimeout\(finishCommit, 160\);/.exec(sortSrc)?.[0] || '';
    assert.ok(/elementFromPoint\(e\.clientX, e\.clientY\)/.test(cancelBlock), 'the cancel hit-tests its release point');
    assert.ok(/gd-just-dropped/.test(cancelBlock), 'the cancel writes the hold');
  });

  ok('1.0.0 the tooltip layer leaves clean and returns clean', () => {
    assert.ok(/const REACTIVATION_GUARD = 400;/.test(tipSrc), 'the reactivation guard window exists');
    assert.ok(/const EDGE_SLACK = 3;/.test(tipSrc), 'the ground-truth slack exists');
    assert.ok(/const onVisibility = \(\) => \{/.test(tipSrc), 'the visibility handler exists');
    assert.ok(/document\.addEventListener\('visibilitychange', onVisibility\);/.test(tipSrc), 'hidden pages end the pill');
    assert.ok(/window\.addEventListener\('focus', onWinFocus\);/.test(tipSrc), 'the return ends whatever is showing');
    assert.ok(/window\.removeEventListener\('focus', onWinFocus\);/.test(tipSrc), 'and cleans up after itself');
    assert.ok(/if \(reactivatedAt && Date\.now\(\) - reactivatedAt < REACTIVATION_GUARD\) return;/.test(tipSrc), 'the OS refocus may not paint during the guard');
    assert.ok(/const pointerOffAnchor = \(\) => \{/.test(tipSrc), 'the ground-truth check exists');
    // 1.2.4 re-law: the follow is retired — the move handler is ground
    // truth ONLY (no return-form, no re-place): a provably-off move ends
    // the pill, everything else leaves it pinned.
    assert.ok(/if \(current && pointerOffAnchor\(\)\) hideNow\(\);/.test(tipSrc), 'a provably-off pointermove ends the pill');
    assert.ok(/cursorX = null;\s*\n\s*cursorY = null;/.test(tipSrc), 'the stale cursor track is dropped on leave');
  });
}

// ===========================================================================
// Part B — live DOM: the woken neighbor wears the hold
// ===========================================================================
{
  const { StampSlots } = require(join(appRoot, 'src/components/StampEditModal.jsx'));
  await okAsync('1.0.0 a drop holds the DRAGGED tile AND the neighbor under the release point', async () => {
    const stamps = [
      { id: 's1', image: 'a.png', name: 'alpha' },
      { id: 's2', image: 'b.png', name: 'beta' },
      { id: 's3', image: 'c.png', name: 'gamma' },
    ];
    let commits = 0;
    const Parent = () => React.createElement(StampSlots, {
      stamps,
      imagesPath: 'C:/img',
      onRemove() {}, onPromote() {}, onRename() {},
      onReorder: () => { commits += 1; },
    });
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(Parent));
    await flush();

    const slots = [...host.querySelectorAll('.gd-stamp-slot')];
    assert.ok(slots.length === 3, 'the strip mounted');
    const grab = slots[2];
    const rect = (x, y) => ({ left: x, top: y, right: x + 48, bottom: y + 48, width: 48, height: 48, x, y, toJSON() {} });
    const origGBCR = dom.window.Element.prototype.getBoundingClientRect;
    dom.window.Element.prototype.getBoundingClientRect = function gbcr() {
      if (this === grab) return rect(200, 10);
      if (this === slots[0]) return rect(0, 10);
      if (this === slots[1]) return rect(60, 10);
      if (this === slots[2]) return rect(120, 10);
      return origGBCR.call(this);
    };
    // The release lands on the FIRST slot's body — a NEIGHBOR, not the
    // dragged chip (which settles into the gap before it).
    const origEFP = dom.window.document.elementFromPoint;
    dom.window.document.elementFromPoint = function efp(x, y) {
      if (Number.isFinite(x) && x < 48 && y >= 0 && y < 58) return slots[0];
      return origEFP ? origEFP.call(this, x, y) : null;
    };
    const pointer = (type, x, y) => new (dom.window.PointerEvent || dom.window.MouseEvent)(
      type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerId: 7, buttons: 1 }
    );
    grab.dispatchEvent(pointer('pointerdown', 224, 34));
    await flush();
    grab.dispatchEvent(pointer('pointermove', 30, 34));
    await flush();
    await flush();
    grab.dispatchEvent(pointer('pointerup', 30, 34));
    await sleep(420); // the settle's transitionend (or the 340ms fallback) commits
    assert.ok(commits >= 1, `the reorder committed (${commits})`);
    const heldNow = [...host.querySelectorAll('.gd-stamp-slot.gd-just-dropped')];
    assert.ok(heldNow.includes(slots[2]), 'the DRAGGED tile wears the hold');
    assert.ok(heldNow.includes(slots[0]), 'and the NEIGHBOR under the release point wears it too');

    // a pointerover ON the neighbor keeps the whole hold set
    slots[0].dispatchEvent(new dom.window.MouseEvent('pointerover', { bubbles: true, clientX: 30, clientY: 34 }));
    await flush();
    assert.ok(host.querySelectorAll('.gd-stamp-slot.gd-just-dropped').length === 2, 'the hold set rides while the pointer rests on either');

    // a pointerover ELSEWHERE clears them all
    document.body.dispatchEvent(new dom.window.MouseEvent('pointerover', { bubbles: true, clientX: 400, clientY: 400 }));
    await flush();
    assert.ok(!host.querySelector('.gd-just-dropped'), 'the whole hold set cleared once the pointer genuinely left');

    dom.window.document.elementFromPoint = origEFP;
    dom.window.Element.prototype.getBoundingClientRect = origGBCR;
    root.unmount();
    host.remove();
  });
}

// ===========================================================================
// Part C — live DOM: the tooltip reactivation cleanslate
// ===========================================================================
{
  const { default: GdTooltips } = require(join(appRoot, 'src/components/GdTooltips.jsx'));
  const tip = () => document.querySelector('.gd-tip');

  await okAsync('1.0.0 the pill leaves clean and returns clean across a blur/focus cycle', async () => {
    const root = createRoot(document.getElementById('root'));
    root.render(React.createElement(GdTooltips));
    await flush();
    assert.ok(tip(), 'the pill mounted');

    const a = document.createElement('button');
    a.title = 'Alpha key';
    const b = document.createElement('button');
    b.title = 'Beta key';
    document.body.append(a, b);
    await flush();
    assert.equal(a.dataset.gdTipSrc, 'Alpha key', 'titles are stashed');

    // hover A → the pill shows
    a.dispatchEvent(new dom.window.MouseEvent('pointerover', { bubbles: true, clientX: 10, clientY: 10 }));
    await sleep(360);
    assert.ok(tip().classList.contains('is-on'), 'the pill painted for A');

    // LEAVE CLEAN: blur ends it
    window.dispatchEvent(new Event('blur'));
    await flush();
    assert.ok(!tip().classList.contains('is-on') && tip().style.display === 'none', 'blur ended the pill');

    // LEAVE CLEAN: the page going hidden ends it too
    a.dispatchEvent(new dom.window.MouseEvent('pointerover', { bubbles: true, clientX: 10, clientY: 10 }));
    await sleep(360);
    assert.ok(tip().classList.contains('is-on'), 'the pill returned for a fresh hover');
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
    assert.ok(!tip().classList.contains('is-on'), 'visibilitychange-hidden ended the pill');
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });

    // RETURN CLEAN: focus + the OS refocus-focusin may NOT paint during the guard
    window.dispatchEvent(new Event('focus'));
    b.dispatchEvent(new dom.window.FocusEvent('focusin', { bubbles: true }));
    await sleep(360); // past the SHOW delay — still nothing
    assert.ok(!tip().classList.contains('is-on'), 'the reactivation refocus did not paint the pill');

    // after the guard, focusin paints again (keyboard parity intact)
    await sleep(120); // 400ms guard fully expired
    b.dispatchEvent(new dom.window.FocusEvent('focusin', { bubbles: true }));
    await flush();
    assert.ok(tip().classList.contains('is-on'), 'focusin paints once the guard has passed');

    // GROUND TRUTH: a pointermove that proves the pointer is off B ends it —
    // jsdom rects are zero-sized, so feed B a real rect first.
    const origGBCR = dom.window.Element.prototype.getBoundingClientRect;
    b.getBoundingClientRect = () => ({ left: 0, top: 0, right: 40, bottom: 20, width: 40, height: 20, x: 0, y: 0, toJSON() {} });
    document.dispatchEvent(new dom.window.MouseEvent('pointermove', { bubbles: true, clientX: 500, clientY: 500 }));
    await flush();
    assert.ok(!tip().classList.contains('is-on') && tip().style.display === 'none', 'the provably-off pointermove killed the pill');
    b.getBoundingClientRect = origGBCR;

    // and a pointermove INSIDE the anchor keeps it alive (slack honored)
    b.dispatchEvent(new dom.window.FocusEvent('focusin', { bubbles: true }));
    await flush();
    assert.ok(tip().classList.contains('is-on'), 'the pill is back for B');
    b.getBoundingClientRect = () => ({ left: 0, top: 0, right: 40, bottom: 20, width: 40, height: 20, x: 0, y: 0, toJSON() {} });
    document.dispatchEvent(new dom.window.MouseEvent('pointermove', { bubbles: true, clientX: 20, clientY: 10 }));
    await sleep(80);
    assert.ok(tip().classList.contains('is-on'), 'a pointermove inside the anchor keeps the pill alive');
    b.getBoundingClientRect = origGBCR;

    root.unmount();
    a.remove();
    b.remove();
  });
}

console.log(`\n1.0.0 batch: ${passed} passed, ${failed} failed${failed ? ' — FIX BEFORE SHIPPING' : ''}`);
process.exit(failed ? 1 : 0);
