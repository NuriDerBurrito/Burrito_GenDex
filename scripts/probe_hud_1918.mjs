// probe_hud_1918.mjs — THE BAR KEEPS ONE SHAPE, live render proof:
// with MULTIPLE images the view crew (− · % · + · reset) rides the left
// zone, the peeks ride the mid alive, and the count rides the flank
// alone; with a SINGLE image the very SAME three zones render — the
// peeks stand LOCKED (is-locked + disabled, the neighbors painting the
// picture itself) and the count reads '1 / 1'. The DOM proves the one
// shape + the lock; the shipped rules prove the parking and the lock's
// own css seat.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import fs from 'node:fs';

register(pathToFileURL(path.join(path.resolve('.'), 'scripts/loader_jsx_1918.mjs')));

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});
global.window = dom.window;
global.document = dom.window.document;
for (const k of ['Node', 'NodeFilter', 'Element', 'HTMLElement', 'SVGElement', 'Document', 'Window', 'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'ResizeObserver', 'requestAnimationFrame', 'cancelAnimationFrame']) {
  try { global[k] = dom.window[k]; } catch {}
}
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = clearTimeout;

const { createElement } = require('react');
const createRoot = require('react-dom/client').createRoot;

// the viewer imports as-is (its .jsx dependency chain rides the loader
// hook); no transform-copy needed
const root = path.resolve('.');

// stub the css import the webpack build normally handles
const Module = require('node:module');
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (/\.css$/.test(request)) return path.join(root, 'src/index.css');
  return origResolve.call(this, request, ...rest);
};
Module._extensions['.css'] = (m, f) => { m.exports = {}; };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function renderCase(images) {
  document.body.innerHTML = '<div id="root"></div>';
  const { default: ImageViewer } = await import(pathToFileURL(path.join(root, 'src/components/ImageViewer.jsx')).href);
  const r = createRoot(document.getElementById('root'));
  r.render(createElement(ImageViewer, {
    images, imagesPath: '/img', index: 0,
    onIndex: () => {}, onClose: () => {}, onCropSaved: () => {},
  }));
  await sleep(80);
  const hud = document.querySelector('.gd-imgview-hud');
  const zones = [...(hud?.children || [])].map((c) => c.className);
  const left = hud?.querySelector('.gd-imgview-hud-left');
  const mid = hud?.querySelector('.gd-imgview-hud-mid');
  const flank = hud?.querySelector('.gd-imgview-hud-flank');
  const peeks = hud?.querySelector('.gd-imgview-peeks');
  const peekButtons = [...(peeks?.querySelectorAll('button.gd-imgview-peek') || [])];
  const out = {
    zones,
    leftHas: {
      zoomOut: !!left?.querySelector('button[title="Zoom out (−)"]'),
      zoomVal: !!left?.querySelector('.gd-imgview-zoomval'),
      zoomIn: !!left?.querySelector('button[title="Zoom in (+)"]'),
      fit: !!left?.querySelector('button[title="Reset the view (0 / double-click)"]'),
      count: !!left?.querySelector('.gd-imgview-count'),
    },
    midHasPeeks: !!peeks,
    peeksLocked: !!peeks?.classList.contains('is-locked'),
    peekButtonsDisabled: peekButtons.map((b) => b.disabled),
    peekTitles: peekButtons.map((b) => b.getAttribute('title')),
    currentPeek: !!peeks?.querySelector('.gd-imgview-peek.is-current'),
    peekImgs: [...(peeks?.querySelectorAll('img') || [])].map((im) => im.getAttribute('src')),
    flankHas: {
      count: !!flank?.querySelector('.gd-imgview-count'),
      fit: !!flank?.querySelector('button[title="Reset the view (0 / double-click)"]'),
      zoomOut: !!flank?.querySelector('button[title="Zoom out (−)"]'),
    },
    countText: flank?.querySelector('.gd-imgview-count')?.textContent,
  };
  r.unmount();
  return out;
}

const multi = await renderCase([
  { file: 'one.png', thumb: 'one.png' },
  { file: 'two.png', thumb: 'two.png' },
]);
console.log('MULTIPLE — zones:', JSON.stringify(multi.zones));
console.log('  left zone (view crew − · % · + · reset, parked LEFT):', JSON.stringify(multi.leftHas));
console.log('  mid peeks (alive in the middle):', multi.midHasPeeks, 'locked:', multi.peeksLocked, 'disabled:', JSON.stringify(multi.peekButtonsDisabled));
console.log('  flank (count alone, parked RIGHT):', JSON.stringify(multi.flankHas));
console.log('  count text:', JSON.stringify(multi.countText));

const single = await renderCase([{ file: 'one.png', thumb: 'one.png' }]);
console.log('SINGLE — zones:', JSON.stringify(single.zones));
console.log('  left zone (the very same view crew):', JSON.stringify(single.leftHas));
console.log('  mid peeks (LOCKED):', single.midHasPeeks, 'locked:', single.peeksLocked, 'disabled:', JSON.stringify(single.peekButtonsDisabled));
console.log('  peek titles:', JSON.stringify(single.peekTitles));
console.log('  peek imgs (the neighbors are the picture itself):', JSON.stringify(single.peekImgs));
console.log('  current peek paints:', single.currentPeek);
console.log('  flank (the very same count):', JSON.stringify(single.flankHas));
console.log('  count text:', JSON.stringify(single.countText));

// the parking + the lock themselves, read from the shipped rules
const css = readFileSync(path.join(root, 'src/index.css'), 'utf8');
const leftRule = css.match(/^\.gd-imgview-hud-left \{[^}]*\}/m)?.[0] || '';
const flankRule = css.match(/^\.gd-imgview-hud-flank \{[^}]*\}/m)?.[0] || '';
const midRule = css.match(/^\.gd-imgview-hud-mid \{[^}]*\}/m)?.[0] || '';
const hudRule = css.match(/^\.gd-imgview-hud \{[^}]*\}/m)?.[0] || '';
const lockRule = css.match(/^\.gd-imgview-peeks\.is-locked \.gd-imgview-peek \{[^}]*\}/m)?.[0] || '';
const lockHoverRule = css.match(/^\.gd-imgview-peeks\.is-locked \.gd-imgview-peek:hover \{[^}]*\}/m)?.[0] || '';
const parked = {
  left: /justify-content:\s*flex-start/.test(leftRule) && !leftRule.includes('justify-content: flex-end'),
  flank: /justify-content:\s*flex-end/.test(flankRule) && !flankRule.includes('justify-content: flex-start'),
  mid: /justify-content:\s*center/.test(midRule) && /gap:\s*8px;/.test(midRule),
  grid: /grid-template-columns:\s*1fr auto 1fr/.test(hudRule),
  lock: /opacity:\s*0\.45;/.test(lockRule) && /cursor:\s*not-allowed;/.test(lockRule),
  lockHover: /transform:\s*none;/.test(lockHoverRule),
};

const laws = [
  ['multiple: three zones render (the one shape)', multi.zones.length === 3],
  ['multiple: the left zone carries the view crew (reset home)', multi.leftHas.zoomOut && multi.leftHas.zoomVal && multi.leftHas.zoomIn && multi.leftHas.fit && !multi.leftHas.count],
  ['multiple: the peeks ride the mid ALIVE', multi.midHasPeeks && !multi.peeksLocked && multi.peekButtonsDisabled.every((d) => d === false)],
  ['multiple: the flank carries the count ALONE', multi.flankHas.count && !multi.flankHas.fit && !multi.flankHas.zoomOut],
  ['multiple: count reads 1 / 2', multi.countText === '1 / 2'],
  ['single: the SAME three zones render (no second shape)', single.zones.length === 3 && single.zones[0].includes('gd-imgview-hud-left') && single.zones[2].includes('gd-imgview-hud-flank')],
  ['single: the very same view crew rides the left', single.leftHas.zoomOut && single.leftHas.zoomVal && single.leftHas.zoomIn && single.leftHas.fit],
  ['single: the switcher stands LOCKED (is-locked + disabled)', single.midHasPeeks && single.peeksLocked && single.peekButtonsDisabled.every((d) => d === true)],
  ['single: the locked hands speak their truth', single.peekTitles.every((t) => t === 'No other images (locked)')],
  ['single: the neighbors paint the picture itself', single.peekImgs.every((s) => s.includes('one.png')) && single.peekImgs.length === 3],
  ['single: the current peek keeps its accent', single.currentPeek],
  ['single: the count rides the flank alone, reading 1 / 1', single.flankHas.count && !single.flankHas.fit && single.countText === '1 / 1'],
  ['css: the parking holds (left LEFT, flank RIGHT, mid center, grid)', parked.left && parked.flank && parked.mid && parked.grid],
  ['css: the lock has its own seat (resting cast + honest hand + no promised hover)', parked.lock && parked.lockHover],
];
let bad = 0;
for (const [name, val] of laws) {
  if (!val) bad += 1;
  console.log(`${val ? 'ok' : 'FAIL'} — ${name}`);
}
console.log(bad === 0 ? 'PROBE: 14/14 LAWS HOLD' : `PROBE: ${14 - bad}/14`);
process.exit(bad ? 1 : 0);
