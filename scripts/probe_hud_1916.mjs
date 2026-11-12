// probe_hud_1916.mjs — THE BAR FINDS ITS BALANCE, live render proof:
// with MULTIPLE images the zoom trio rides the left flank and the
// count + fit ride the right (the peeks dead center); with a SINGLE
// image the whole family rides the mid zone alone, dead center.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { register } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';

register(pathToFileURL(path.join(path.resolve('.'), 'scripts/loader_jsx_1916.mjs')));

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
  const out = {
    zones,
    leftHas: {
      zoomOut: !!left?.querySelector('button[title="Zoom out (−)"]'),
      zoomVal: !!left?.querySelector('.gd-imgview-zoomval'),
      zoomIn: !!left?.querySelector('button[title="Zoom in (+)"]'),
      count: !!left?.querySelector('.gd-imgview-count'),
      fit: !!left?.querySelector('button[title="Reset the view (0 / double-click)"]'),
    },
    midHasPeeks: !!mid?.querySelector('.gd-imgview-peeks'),
    flankHas: {
      count: !!flank?.querySelector('.gd-imgview-count'),
      fit: !!flank?.querySelector('button[title="Reset the view (0 / double-click)"]'),
      zoomOut: !!flank?.querySelector('button[title="Zoom out (−)"]'),
    },
    midHas: {
      count: !!mid?.querySelector('.gd-imgview-count'),
      zoomOut: !!mid?.querySelector('button[title="Zoom out (−)"]'),
      zoomVal: !!mid?.querySelector('.gd-imgview-zoomval'),
      zoomIn: !!mid?.querySelector('button[title="Zoom in (+)"]'),
      fit: !!mid?.querySelector('button[title="Reset the view (0 / double-click)"]'),
    },
    countText: (flank?.querySelector('.gd-imgview-count') || mid?.querySelector('.gd-imgview-count'))?.textContent,
  };
  r.unmount();
  return out;
}

const multi = await renderCase([
  { file: 'one.png', thumb: 'one.png' },
  { file: 'two.png', thumb: 'two.png' },
]);
console.log('MULTIPLE — zones:', JSON.stringify(multi.zones));
console.log('  left flank (zoom trio):', JSON.stringify(multi.leftHas));
console.log('  mid peeks:', multi.midHasPeeks);
console.log('  right flank (count+fit):', JSON.stringify(multi.flankHas));
console.log('  count text:', JSON.stringify(multi.countText));

const single = await renderCase([{ file: 'one.png', thumb: 'one.png' }]);
console.log('SINGLE — zones:', JSON.stringify(single.zones));
console.log('  mid family:', JSON.stringify(single.midHas));

const laws = [
  ['multiple: three zones render', multi.zones.length === 3],
  ['multiple: left zone carries ONLY the zoom trio', multi.leftHas.zoomOut && multi.leftHas.zoomVal && multi.leftHas.zoomIn && !multi.leftHas.count && !multi.leftHas.fit],
  ['multiple: peeks dead center', multi.midHasPeeks],
  ['multiple: right flank carries the count + fit', multi.flankHas.count && multi.flankHas.fit && !multi.flankHas.zoomOut],
  ['multiple: the mid zone holds no count', !multi.midHas.count],
  ['single: the MID zone alone renders', single.zones.length === 1 && single.zones[0].includes('gd-imgview-hud-mid')],
  ['single: the whole family rides the mid', single.midHas.count && single.midHas.zoomOut && single.midHas.zoomVal && single.midHas.zoomIn && single.midHas.fit],
  ['single: no peeks painted', !single.midHasPeaks],
  ['single: count reads 1 / 1', single.countText === '1 / 1'],
];
let bad = 0;
for (const [name, val] of laws) {
  if (!val) bad += 1;
  console.log(`${val ? 'ok' : 'FAIL'} — ${name}`);
}
console.log(bad === 0 ? 'PROBE: 9/9 LAWS HOLD' : `PROBE: ${9 - bad}/9`);
process.exit(bad ? 1 : 0);
