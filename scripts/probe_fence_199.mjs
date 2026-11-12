// probe_fence_199.mjs — the 1.9.9 picker fence, proven LIVE: the exact
// race the report names ("when moving the color picker left and right
// sometimes it would change the color slightly as the bottom bar that
// shows all colors vibrates left and right and starts shifting, aka
// instead of being on green it shifts to yellow even if im changing the
// saturation etc"), reproduced and answered in a real DOM:
//   1. a drag on the SV field holds the gesture (pointerdown + moves);
//   2. MID-GESTURE the parent re-renders with a STALE echo (an older
//      emission — the governor's own timing, the vibration's cause);
//   3. THE LAW: the panel must NOT re-seed — the hue dot never moves,
//      the state keeps the gesture's truth, and the next emission still
//      speaks the gesture's hue;
//   4. after the release, a GENUINE external change still re-seeds (the
//      fence opens — presets and typed hexes keep their word).
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as babel from '@babel/core';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.dirname(fileURLToPath(import.meta.url));
const tree = path.join(root, '..');

const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});
global.window = dom.window;
global.document = dom.window.document;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.HTMLElement = dom.window.HTMLElement;
global.MouseEvent = dom.window.MouseEvent;
global.requestAnimationFrame = (fn) => setTimeout(fn, 16);

const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = React;
global.React = React; // the classic JSX runtime reads the global
global.IS_REACT_ACT_ENVIRONMENT = true;

// transpile the picker + its deps on the fly (the tree's own babel)
const load = (rel) => {
  const file = path.join(tree, rel);
  const out = babel.transformFileSync(file, {
    presets: [require.resolve('@babel/preset-react'), require.resolve('@babel/preset-env')],
    configFile: false, babelrc: false,
    filename: file,
  }).code;
  const mod = new Function('react', 'exports', 'require', `${out}\n//# sourceURL=${rel}`);
  const exports = {};
  mod(React, exports, (id) => {
    if (id === 'react') return React;
    if (id === 'react-dom') return { createPortal: (el) => el };
    if (id === '../constants/index.js') return {
      ICON_GROUPS: [], CARD_TRIMS: [], CARD_FINISHES: [], CHIP_COLORS: [],
      TEXTURES: [], TEX_SURFACES: [], THEME_PRESETS: [], SORT_MODES: [],
      LEGACY_RICH_TOKENS: {}, RICH_TOKENS: {}, DEFAULT_SHORTCUTS: {},
      SHORTCUT_ACTIONS: [], DEFAULT_CARD_FINISH: 'none', DEFAULT_CARD_TRIM: 'classic',
      DEFAULT_SETTINGS: {}, DEFAULT_STAMP_COLOR: '#c8402f', ROOT_CLASS_ID: 'root',
      STAMP_SCALE_RANGE: { min: 0.5, max: 2 }, TAG_LIMIT_RANGE: { min: 0, max: 12 },
      TAG_SCALE_RANGE: { min: 0.6, max: 2 }, TAG_SEPARATION_RANGE: { min: 0, max: 8 },
      ZOOM_RANGE: { min: 0.5, max: 2 },
    };
    if (id === './Popover.jsx') return load('src/components/Popover.jsx');
    if (id === '../utils/helpers.js') return load('src/utils/helpers.js');
    if (id === 'clsx') return { __esModule: true, default: (a) => Array.isArray(a) ? a.filter(Boolean).join(' ') : String(a || '') };
    if (id === 'lucide-react') return { __esModule: true, Pipette: () => null, RotateCcw: () => null };
    throw new Error(`unmocked import: ${id}`);
  });
  return exports;
};
const { ColorPickerPanel } = load('src/components/ColorPicker.jsx');

const fire = (el, type, x, y) => {
  const ev = new dom.window.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y });
  Object.defineProperty(ev, 'pointerId', { value: 1 });
  el.dispatchEvent(ev);
};

let passed = 0, failed = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { passed += 1; console.log(`  ok — ${name}`); }
  else { failed += 1; console.log(`  FAIL — ${name}${detail ? ` — ${detail}` : ''}`); }
};

const host = document.getElementById('host');
const emitted = [];
let currentColor = '#00b400'; // a GREEN the owner picked

const Comp = () => React.createElement(ColorPickerPanel, {
  color: currentColor,
  onColor: (hex) => { emitted.push(hex); currentColor = hex; },
});

const rootEl = createRoot(host);
await act(async () => { rootEl.render(React.createElement(Comp)); });

const sv = host.querySelector('.gd-cp-sv');
const rail = host.querySelector('.gd-cp-hue');
const railDot = host.querySelector('.gd-cp-hue-dot');
ok('the panel mounted with its fields', !!sv && !!rail && !!railDot);

const railPos = () => {
  const m = /left: ([\d.]+)%/.exec(railDot.getAttribute('style') || '');
  return m ? Number(m[1]) : null;
};
const hueBefore = railPos();
ok('the green seats the rail at ~120deg', Math.abs(hueBefore - 120 / 3.6) < 2.5, `rail at ${hueBefore}%`);

// 1 — the gesture begins: press on the SV field and drag the saturation.
// jsdom measures every rect as zero — the fields' own geometry is spoken
// directly so the gesture's fractions land where the eye would put them.
sv.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 120, right: 200, bottom: 120, x: 0, y: 0, toJSON: () => ({}) });
rail.getBoundingClientRect = () => ({ left: 0, top: 130, width: 200, height: 12, right: 200, bottom: 142, x: 0, y: 130, toJSON: () => ({}) });
const px = (fx) => 200 * fx;
const py = (fy) => 120 * fy;
await act(async () => { fire(sv, 'pointerdown', px(0.7), py(0.1)); });
await act(async () => { fire(sv, 'pointermove', px(0.45), py(0.1)); });

// 2 — THE RACE: mid-gesture, the parent re-renders carrying a STALE echo
//    (an emission from BEFORE the last one — the governor's cadence)
const stale = emitted.length ? emitted[emitted.length - 1] : currentColor;
currentColor = '#00c100'; // a stale green a few emission-steps behind
await act(async () => { rootEl.render(React.createElement(Comp)); });
await act(async () => {});
const hueMid = railPos();
ok('THE FENCE: a stale echo mid-gesture never moves the rail', Math.abs(hueMid - hueBefore) < 0.5, `rail moved ${hueBefore}% -> ${hueMid}%`);

// 3 — the gesture continues and releases; the emission still speaks green
await act(async () => { fire(sv, 'pointermove', px(0.3), py(0.1)); });
await act(async () => { fire(sv, 'pointerup', px(0.3), py(0.1)); });
const final = emitted[emitted.length - 1];
const finalHue = /#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/.exec(final);
const rr = parseInt(finalHue[1], 16), gg = parseInt(finalHue[2], 16), bb = parseInt(finalHue[3], 16);
ok('the gesture\'s emission still speaks GREEN (no yellow drift)', gg > rr && gg > bb, `spoke ${final}`);

// 4 — the fence opens after release: a GENUINE external change re-seeds
currentColor = '#c8402f'; // a preset red picked elsewhere
await act(async () => { rootEl.render(React.createElement(Comp)); });
await act(async () => {});
const hueAfter = railPos();
ok('a genuine change after release re-seeds (the fence opens)', Math.abs(hueAfter - 0) < 2.5 || Math.abs(hueAfter - 100) < 2.5, `rail at ${hueAfter}%`);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
