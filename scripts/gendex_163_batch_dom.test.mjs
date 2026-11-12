// 1.5.7 batch — The Ghost Learns Its Manners.
// (Named 163 in the sequence: 159 -> 1.4.9, 160 -> 1.5.4, 161 -> 1.5.5,
//  162 -> 1.5.6 — the historical 157 file belongs to the 1.4.8 era and
//  keeps its own seat.)
// The reported items, each pinned at its root law:
//   A. the parked creation seat is NOT a window (the top bar never locks,
//      the auto-walk never pauses, dropdowns never sweep — the ghost)
//   B. the OPEN retained-flight window takes its clicks (pointer-events
//      restored on .is-open — the click-through root)
//   C. the trim + texture tiles speak the corner language (surface radius
//      capped at a 12px tile budget — never the 999px button pill)
//   D. the legal window breathes (TOS_VERSION 1.0.1, keyed page fades,
//      the scroll-follow reset, the 560 -> 680 width tween on readers)
//   E. the update window stands on its own (never mounted under the gate;
//      decline + reopen still pops the crossing after the terms)
//   F. LIVING FINISHES — the finishes' own switch (default ON, old
//      databases sanitize ON, off pauses the whole coat family)
//   G. every retained-flight open re-arms the settle window (the fresh
//      draft lands at TRUE size — no visible resize through the entrance)
// Plus live jsdom passes for the ghost/window/attribute story, the gate's
// growing reader, the decline -> reopen -> update-window road, and the
// finishes-still root class.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(path.join(root, '..', p), 'utf8');

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL — ${name}\n      ${e.message}`);
  }
};
const okAsync = async (name, fn) => {
  try {
    await fn();
    passed += 1;
    console.log(`  ok — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL — ${name}\n      ${e.message}`);
  }
};
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg || 'assertion failed');
};
assert.equal = (a, b, msg) => {
  if (a !== b) throw new Error(msg || `${a} != ${b}`);
};
assert.notEqual = (a, b, msg) => {
  if (a === b) throw new Error(msg || `${a} == ${b}`);
};
assert.ok = (cond, msg) => {
  if (!cond) throw new Error(msg || 'assertion failed');
};
assert.match = (text, re, msg) => {
  if (!re.test(String(text))) throw new Error(msg || `expected ${re} in the text`);
};

const appSrc = src('src/App.jsx');
const modalSrc = src('src/components/Modal.jsx');
const legalSrc = src('src/components/LegalModal.jsx');
const setSrc = src('src/components/SettingsModal.jsx');
const cssSrc = src('src/index.css');
const legalConstSrc = src('src/constants/legal.js');
const constSrc = src('src/constants/index.js');
const helpersSrc = src('src/utils/helpers.js');

// ---------------------------------------------------------------------------
// A. THE GHOST IS NOT A WINDOW — source laws
// ---------------------------------------------------------------------------
ok('A1 — the layer speaks data-gd-modal only while live', () => {
  assert(/data-gd-modal=\{parked \? undefined : '1'\}/.test(modalSrc), 'the parked-attribute law is missing');
  // the ask layer keeps its own attribute (a live question IS a window)
  assert((modalSrc.match(/data-gd-modal="1"/g) || []).length === 1, 'the ask layer lost its own attribute');
  // the watcher speaks the attribute dialect (a seat that only flips)
  assert(/attributeFilter: \['data-gd-modal'\]/.test(appSrc), 'the any-window watcher is blind to attribute flips');
});

ok('A2 — the open flight takes its clicks (pointer-events on .is-open)', () => {
  const block = cssSrc.match(/\.gd-modal-layer\.gd-modal-flight\.is-open \{[\s\S]*?\n\}/)?.[0] || '';
  assert(/pointer-events:\s*auto;/.test(block), '.is-open never restores the pointer');
  const closed = cssSrc.match(/\.gd-modal-layer\.gd-modal-flight \{[\s\S]*?\n\}/)?.[0] || '';
  assert(/pointer-events:\s*none;/.test(closed), 'the closed farewell lost its click immunity');
});

ok('A3 — the tiles speak the corner language, never the pill', () => {
  const chip = cssSrc.match(/\.gd-trim-chip \{[\s\S]*?\n\}/)?.[0] || '';
  assert(/border-radius:\s*min\(var\(--gd-shape-radius, var\(--gd-radius\)\), 12px\);/.test(chip), 'the trim tile lost its capped surface radius');
  assert(!/var\(--gd-btn-radius/.test(chip), 'the trim tile still speaks the button pill');
  const face = cssSrc.match(/\.gd-trim-chip-face \{[\s\S]*?\n\}/)?.[0] || '';
  assert(/border-radius:\s*max\(calc\(min\(var\(--gd-shape-radius, var\(--gd-radius\)\), 12px\) - 3px\), 1px\);/.test(face), 'the trim face lost its nested budget');
  const tex = cssSrc.match(/\.gd-tex-tile-face \{[\s\S]*?\n\}/)?.[0] || '';
  assert(/border-radius:\s*max\(calc\(min\(var\(--gd-shape-radius, var\(--gd-radius\)\), 12px\) - 2px\), 1px\);/.test(tex), 'the texture face lost its corner budget');
});

ok('A4 — the legal window breathes (version, pages, growth)', () => {
  // 1.9.1 — the terms moved to 1.0.6 (the paper house); the pin follows the live seat.
  assert(/export const TOS_VERSION = '1\.0\.6';/.test(legalConstSrc), 'the terms version never moved to 1.0.6');
  assert(/\.gd-legal-page \{[\s\S]*?animation:\s*gd-legal-page-in 0\.16s ease-out;/.test(cssSrc), 'the page entrance never landed');
  assert(/@keyframes gd-legal-page-in/.test(cssSrc), 'the page keyframes are missing');
  assert(/scrollResetKey=\{page\}/.test(legalSrc), 'the gate never passes the page-follow reset');
  assert(/scrollResetKey = null,/.test(modalSrc), 'Modal lost the scrollResetKey prop');
  assert(/const gateWidth = page === 'cards' \? 'w-\[560px\]' : 'w-\[680px\]';/.test(legalSrc), 'the posture swap is missing');
  assert(/width="w-\[680px\]"/.test(legalSrc), 'the reader posture never widened');
  const cardCss = cssSrc.match(/\.gd-modal-card \{[\s\S]*?\n\}/)?.[0] || '';
  assert(/transition:[\s\S]*?width 0\.2s/.test(cardCss), 'the card never learned to tween its width');
});

ok('A5 — the update window stands on its own (never under the gate)', () => {
  assert(/\{updateNotice && !legalGate && \(/.test(appSrc), 'the mount condition lost the gate');
});

ok('A6 — LIVING FINISHES: the setting, the sanitize, the root law, the switch', () => {
  assert(/livingFinishes: true,/.test(constSrc), 'the default seat is missing');
  assert(/typeof rawSettings\.livingFinishes === 'boolean' \? rawSettings\.livingFinishes : DEFAULT_SETTINGS\.livingFinishes,/.test(helpersSrc), 'the sanitize law is missing');
  assert(/classList\.toggle\('gd-finishes-still', db\?\.settings\?\.livingFinishes === false\)/.test(appSrc), 'the root stamp is missing');
  const still = cssSrc.match(/html\.gd-finishes-still \.gd-card-face-finish,[\s\S]*?display: none !important;/)?.[0] || '';
  assert(still.includes('gd-finishes-still .gd-card-face-artfin') && still.includes('gd-finishes-still .gd-foil-ripple'), 'the retirement law lost family seats');
  assert(!/gd-finishes-still [^\n]*gd-img-motion/.test(cssSrc), 'the still law must not touch the image motion seats');
  assert(/title="EXPERIMENTAL FINISHES"/.test(setSrc), 'the Performance switch is missing');
  assert(/set\('livingFinishes', settings\.livingFinishes === false\)/.test(setSrc), 'the switch is not wired');
});

ok('A7 — every retained-flight open re-arms the settle window', () => {
  assert(/const flightOpened = flight && !parked;/.test(modalSrc), 'the flight-open mirror is missing');
  const block = modalSrc.match(/useLayoutEffect\(\(\) => \{\s*if \(!flightOpened\) return undefined;[\s\S]*?\}, \[flightOpened\]\);/)?.[0] || '';
  assert(/setSettling\(true\);/.test(block), 'the open never re-arms the settle');
});

// ---------------------------------------------------------------------------
// B. PURE — the sanitize road for livingFinishes
// ---------------------------------------------------------------------------
const { createSafeDb } = await import('../src/utils/helpers.js');
const { TOS_VERSION } = await import('../src/constants/legal.js');

ok('B1 — old databases sanitize to LIVING (nothing changes until flipped)', () => {
  const past = createSafeDb({ settings: { theme: 'zine' } });
  assert.equal(past.settings.livingFinishes, true, 'an old database was born still');
  const off = createSafeDb({ settings: { livingFinishes: false } });
  assert.equal(off.settings.livingFinishes, false, 'a stored OFF did not survive');
  const junk = createSafeDb({ settings: { livingFinishes: 'nope' } });
  assert.equal(junk.settings.livingFinishes, true, 'junk read as OFF');
});

ok('B2 — the terms bump re-asks every 1.0.0 library (the mismatch law)', () => {
  assert.equal(TOS_VERSION, '1.0.6'); // 1.9.1 — the paper house moved the seat
  const oldAccepted = createSafeDb({ settings: { tosAcceptance: { version: '1.0.0', at: 12345 } } });
  assert.equal(oldAccepted.settings.tosAcceptance.version, '1.0.0', 'the old record must keep its own version');
  assert.notEqual(oldAccepted.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.0 record must not count as current');
});

// ---------------------------------------------------------------------------
// C. LIVE — the ghost, the clicks, the gate, the crossing, the still
// ---------------------------------------------------------------------------
let JSDOM;
try {
  ({ JSDOM } = await import('jsdom'));
} catch {
  JSDOM = null;
}

if (JSDOM) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    pretendToBeVisual: true,
    url: 'http://localhost/',
  });
  const g = globalThis;
  g.window = dom.window;
  g.document = dom.window.document;
  g.Node = dom.window.Node;
  g.NodeFilter = dom.window.NodeFilter;
  Object.defineProperty(g, 'navigator', { value: dom.window.navigator, configurable: true });
  g.getComputedStyle = dom.window.getComputedStyle;
  g.requestAnimationFrame = dom.window.requestAnimationFrame;
  g.cancelAnimationFrame = dom.window.cancelAnimationFrame;
  for (const k of ['HTMLElement', 'HTMLDivElement', 'HTMLImageElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLButtonElement', 'HTMLSpanElement', 'HTMLAnchorElement', 'Element', 'SVGElement', 'Node', 'File', 'Blob', 'FileReader', 'MutationObserver', 'CustomEvent', 'DragEvent', 'InputEvent', 'KeyboardEvent', 'MouseEvent', 'ClipboardEvent', 'DataTransfer', 'Image', 'ImageBitmap', 'getSelection', 'URL', 'DOMParser']) {
    if (dom.window[k] !== undefined && g[k] === undefined) g[k] = dom.window[k];
  }
  g.matchMedia = dom.window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
  try { g.localStorage = dom.window.localStorage; } catch { /* guarded seats degrade */ }
  g.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  g.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  g.IS_REACT_ACT_ENVIRONMENT = false;

  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const React = require('react');
  const { createRoot } = require('react-dom/client');
  const babel = require('@babel/core');
  require.extensions['.jsx'] = (module, filename) => {
    const { code } = babel.transformFileSync(filename, {
      presets: [['@babel/preset-env', { targets: { node: 'current' } }], ['@babel/preset-react', { runtime: 'automatic' }]],
    });
    module._compile(code, filename);
  };
  for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff2']) {
    require.extensions[ext] = (module, filename) => { module.exports = filename; };
  }

  const errors = [];
  console.error = (...args) => {
    const s = args.map((a) => (a && a.stack ? a.stack : String(a))).join(' ');
    if (/Warning|act\(|deprecated|Not implemented: Window's scrollTo/i.test(s)) return;
    errors.push(s);
  };
  dom.window.addEventListener('error', (e) => errors.push(String(e.error?.stack || e.message)));

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const App = require('../src/App.jsx').default;

  const mkDb = (over = {}) => ({
    settings: {
      theme: 'zine', colors: {}, zoom: 2, defaultSortMode: 'custom',
      textures: { sidebar: 'none', titlebar: 'none', viewer: 'dots', panel: 'none' },
      ...over.settings,
    },
    classes: [{ id: 'cl1', name: 'heroes', parentId: 'root' }],
    tags: [{ id: 't1', name: 'wip', color: '#ffd400', trim: 'straight' }],
    stamps: [],
    characters: [
      { id: 'c1', name: 'amy', classId: 'cl1', tags: ['t1'], versions: [{ id: 'v1', label: 'V1', images: [], parts: [] }], stamps: [] },
    ],
  });

  const boot = async ({ db, savedDbs, closes, lastRun }) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const api = {
      loadDB: async () => ({ db, imagesPath: '/mock/images', status: 'ok', fromAppVersion: '', recoveredFrom: '', corruptSetAside: '' }),
      saveDB: async (d) => { savedDbs.push(d); return { ok: true }; },
      sendUnsavedState: () => {},
      onPromptUnsaved: () => () => {},
      saveAndClose: async () => ({ ok: true }),
      forceClose: () => { closes.push(1); },
      windowControl: () => {},
      onWindowMaximized: () => () => {},
      onWindowUnmaximized: () => () => {},
      openExternal: () => {},
      clipboardReadText: async () => '',
      clipboardWriteText: async () => {},
      importImagesFromFiles: async () => [],
      saveImageBuffer: async () => ({ ok: true, file: 'x.png' }),
      deleteImageFile: async () => ({ ok: true }),
    };
    window.api = api;
    localStorage.clear();
    if (lastRun != null) localStorage.setItem('gd:last-run-version', lastRun);
    const rt = createRoot(host);
    rt.render(React.createElement(App));
    await sleep(3400);
    return { host, root: rt };
  };

  const findCard = (re) => [...document.querySelectorAll('.gd-modal-card')].find((m) => re.test(m.textContent || ''));
  const findBtn = (re, scope) => [...(scope || document).querySelectorAll('button')].find((b) => re.test((b.textContent || '').trim()));

  // --- C1: the parked ghost is not a window --------------------------------
  await okAsync('C1 — the parked seat locks nothing (the bar stays live)', async () => {
    const savedDbs = [];
    const closes = [];
    const db = mkDb({ settings: { tosAcceptance: { version: TOS_VERSION, at: 12345 } } });
    const { host, root } = await boot({ db, savedDbs, closes, lastRun: '1.9.19' });
    const ghost = document.querySelector('.gd-modal-layer.gd-modal-flight');
    assert.ok(ghost, 'the retained seat never parked');
    assert.ok(!ghost.classList.contains('is-open'), 'the parked seat thinks it is open');
    assert.ok(!document.querySelector('[data-gd-modal]'), 'the parked ghost still counts as a window');
    const bar = document.querySelector('.gd-titlebar');
    assert.ok(bar && !bar.classList.contains('is-locked'), 'the top bar locked with nothing on screen');
    root.unmount();
    host.remove();
  });

  // --- C2: the open flight is a window; close parks it again ---------------
  await okAsync('C2 — the open seat takes the attribute, close parks it again', async () => {
    const savedDbs = [];
    const closes = [];
    const db = mkDb({ settings: { tosAcceptance: { version: TOS_VERSION, at: 12345 } } });
    const { host, root } = await boot({ db, savedDbs, closes, lastRun: '1.9.19' });
    const newCard = findBtn(/^NEW CARD$/i);
    assert.ok(newCard, 'the NEW CARD key is missing');
    newCard.click();
    await sleep(200);
    const live = document.querySelector('.gd-modal-layer.gd-modal-flight.is-open');
    assert.ok(live, 'the seat never went live');
    assert.equal(live.getAttribute('data-gd-modal'), '1', 'the live layer lost its window attribute');
    const bar = document.querySelector('.gd-titlebar');
    assert.ok(bar.classList.contains('is-locked'), 'the bar stayed live while a real window is open');
    const cancel = findBtn(/^CANCEL$/i, live);
    assert.ok(cancel, 'the CANCEL key is missing');
    cancel.click();
    await sleep(260);
    const parked = document.querySelector('.gd-modal-layer.gd-modal-flight');
    assert.ok(parked, 'the seat unmounted instead of parking');
    assert.ok(!parked.classList.contains('is-open'), 'the closed seat never parked its posture');
    assert.ok(!document.querySelector('[data-gd-modal]'), 'the closed seat still counts as a window');
    assert.ok(!document.querySelector('.gd-titlebar').classList.contains('is-locked'), 'the bar never woke up');
    root.unmount();
    host.remove();
  });

  // --- C3: the gate breathes; the update window waits below it -------------
  await okAsync('C3 — the gate opens its readers GROWN, and the update window never mounts beneath it', async () => {
    const savedDbs = [];
    const closes = [];
    const { host, root } = await boot({ db: mkDb(), savedDbs, closes, lastRun: '1.5.6' });
    const gate = findCard(/TERMS & PRIVACY/i);
    assert.ok(gate, 'the gate never mounted for an unaccepted library');
    assert.ok(gate.className.includes('w-[560px]'), 'the gate lost its compact posture');
    assert.ok(!findCard(/GENDEX UPDATED/i), 'the update window mounted beneath the gate');
    const tosCard = [...gate.querySelectorAll('.gd-legal-card')][0];
    tosCard.click();
    await sleep(180);
    assert.ok(gate.querySelector('.gd-legal-page'), 'the reader page never rode its keyed wrapper');
    assert.match(gate.textContent || '', /1\. Accepting these terms/, 'the ToS reader never opened');
    assert.ok(gate.className.includes('w-[680px]'), 'the reader posture never grew');
    const back = findBtn(/^BACK$/i, gate);
    back.click();
    await sleep(180);
    assert.ok(gate.className.includes('w-[560px]'), 'BACK never relaxed the window');
    assert.match(gate.textContent || '', /added \/ updated/i, 'the cards never came back');
    root.unmount();
    host.remove();
  });

  // --- C4: decline -> reopen -> the gate asks again, the crossing still pops
  await okAsync('C4 — decline seals nothing; reopen asks again and the update window still pops', async () => {
    const savedDbs = [];
    const closes = [];
    const { host, root } = await boot({ db: mkDb(), savedDbs, closes, lastRun: '1.5.6' });
    let gate = findCard(/TERMS & PRIVACY/i);
    assert.ok(gate, 'the gate never mounted');
    const decline = findBtn(/^DECLINE$/i, gate);
    decline.click();
    await sleep(140);
    const final = findBtn(/^DECLINE & CLOSE$/i, gate);
    assert.ok(final, 'the confirmed close key is missing');
    final.click();
    await sleep(220);
    assert.equal(closes.length, 1, 'the confirmed decline never closed the app');
    assert.equal(savedDbs.length, 0, 'declining SAVED something (it must never)');
    assert.equal(localStorage.getItem('gd:last-run-version'), '1.5.6', 'the decline sealed the crossing (it must never)');
    root.unmount();
    host.remove();

    // the reopen: the gate asks again, and after the terms are answered the
    // update window pops — the separate check, exactly as specified.
    const savedDbs2 = [];
    const closes2 = [];
    const { host: host2, root: root2 } = await boot({ db: mkDb(), savedDbs: savedDbs2, closes: closes2, lastRun: '1.5.6' });
    gate = findCard(/TERMS & PRIVACY/i);
    assert.ok(gate, 'the gate did not ask again after the decline');
    assert.ok(!findCard(/GENDEX UPDATED/i), 'the update window mounted beneath the gate on the reopen');
    const accept = findBtn(/^ACKNOWLEDGE & ACCEPT$/i, gate);
    accept.click();
    await sleep(420);
    assert.ok(savedDbs2.length >= 1, 'the acceptance was never saved');
    const updated = findCard(/GENDEX UPDATED/i);
    assert.ok(updated, 'the update window never popped after the terms were answered');
    assert.match(updated.textContent || '', /v1\.5\.6/, 'the crossing lost its from-version');
    assert.match(updated.textContent || '', /v1\.9\.19/, 'the crossing lost its to-version');
    root2.unmount();
    host2.remove();
  });

  // --- C5: LIVING FINISHES stamps the root ---------------------------------
  await okAsync('C5 — LIVING FINISHES off stills the root; old databases stay living', async () => {
    const savedDbs = [];
    const closes = [];
    const stillDb = mkDb({ settings: { tosAcceptance: { version: TOS_VERSION, at: 1 }, livingFinishes: false } });
    const { host, root } = await boot({ db: stillDb, savedDbs, closes, lastRun: '1.9.19' });
    assert.ok(document.documentElement.classList.contains('gd-finishes-still'), 'the still never stamped the root');
    root.unmount();
    host.remove();

    const savedDbs2 = [];
    const closes2 = [];
    const { host: host2, root: root2 } = await boot({ db: mkDb({ settings: { tosAcceptance: { version: TOS_VERSION, at: 1 } } }), savedDbs: savedDbs2, closes: closes2, lastRun: '1.9.19' });
    assert.ok(!document.documentElement.classList.contains('gd-finishes-still'), 'a living database woke up stilled');
    root2.unmount();
    host2.remove();
  });

  assert.equal(errors.length, 0, `render errors: ${errors.slice(0, 2).join(' | ').slice(0, 400)}`);
} else {
  console.log('  (jsdom unavailable — live passes skipped)');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
