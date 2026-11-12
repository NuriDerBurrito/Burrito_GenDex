// 1.5.9 batch — The Field Pass, Swept Again.
// (Named 165 in the sequence: 159 -> 1.4.9, 160 -> 1.5.4, 161 -> 1.5.5,
//  162 -> 1.5.6, 163 -> 1.5.7, 164 -> 1.5.8.)
// The reported items, each pinned at its root law:
//   A.  the EDIT CARD crash is dead (finishesHidden rides CardLookModal's
//       own signature; App threads the gate at the 4th seat)
//   B.  EXPERIMENTAL FINISHES OFF retires the coats from paint (display:
//       none family + the rim law following it off the stage)
//   C.  the SPECIAL THANKS row split: the DUSKFALLCREW key is a pure
//       redirect with a dead-level centered name; the BETA TESTER badge
//       is its own right-space key whose whole job is the confetti
//   D.  the notification pills speak the secondary accent's OWN VALUE
//       with the theme's text-on-accent ink (a solid plate)
//   E.  the windows pop in (a pure fade + a tiny centered scale pulse,
//       both the fresh-mount entrance and the retained CSS flight)
//   F.  switching classes replays the cards' entrance (the seen-cache
//       clears on a wholesale board turnover)
//   G.  the boot-time prewarm walks the card's VERSIONS (the images' true
//       home) so the first open mounts at the true size
//   H.  the mute edits speak (the tag toggle's verdict, the edit-card
//       commit naming its card)
//   I.  the finish pickers dropped their long tooltips
//   J.  the card-drag flight is owned outright (transparent 1x1 canvas
//       suppression + a live miniature following the drag's own events)
// Plus the version furniture and live jsdom passes (the bare CardLookModal
// render that used to die at the ReferenceError, the owned drag flight
// driven end-to-end, and the tag toggle's toast verdict).

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
assert.notEqual = (a, b, msg) => {
  if (a === b) throw new Error(msg || a + ' == ' + b);
};
assert.equal = (a, b, msg) => {
  if (a !== b) throw new Error(msg || `${a} != ${b}`);
};
assert.ok = (cond, msg) => {
  if (!cond) throw new Error(msg || 'assertion failed');
};
assert.match = (text, re, msg) => {
  if (!re.test(String(text))) throw new Error(msg || `expected ${re} in the text`);
};

const appSrc = src('src/App.jsx');
const modalSrc = src('src/components/Modal.jsx');
const setSrc = src('src/components/SettingsModal.jsx');
const cssSrc = src('src/index.css');
const cvSrc = src('src/components/CharacterView.jsx');
const styleSrc = src('src/components/CardStyleControls.jsx');
const gridSrc = src('src/components/GridView.jsx');
const masonrySrc = src('src/components/MasonryGrid.jsx');

// ---------------------------------------------------------------------------
// A. THE CRASH IS DEAD
// ---------------------------------------------------------------------------
ok('A1 — the EDIT CARD window carries the gate in its own signature', () => {
  // the 1.5.8 code referenced the bare identifier from the parent view's
  // scope: every open died at "ReferenceError: finishesHidden is not defined".
  assert.match(
    cvSrc,
    /export function CardLookModal\(\{[^}]*finishesHidden = false,/,
    'CardLookModal destructures without finishesHidden (the crash lives)'
  );
  // the window passes its own gate down to the finish row
  assert.match(cvSrc, /finishesHidden=\{finishesHidden\}/, 'the window never passes its gate to the row');
  // App threads the master switch at the 4th seat (the optional-chained form)
  assert.match(
    appSrc,
    /finishesHidden=\{db\?\.settings\?\.livingFinishes === false\}/,
    'App never threads the gate into the App-level window mount'
  );
});

// ---------------------------------------------------------------------------
// B. THE COATS LEAVE THE STAGE
// ---------------------------------------------------------------------------
ok('B1 — EXPERIMENTAL FINISHES OFF retires the coats from paint', () => {
  const block = cssSrc.match(/html\.gd-finishes-still \.gd-card-face-finish,[\s\S]*?display: none !important;/)?.[0] || '';
  assert.ok(block.length > 0, 'the retirement law (display: none) is missing');
  assert.ok(
    block.includes('gd-finishes-still .gd-card-face-artfin') && block.includes('gd-finishes-still .gd-foil-ripple'),
    'the retirement law lost family seats'
  );
  assert.ok(
    block.includes('gd-finishes-still .gd-card-face-finish *::before') || block.includes('.gd-card-face-finish \\*'),
    'the retirement law lost the children seats'
  );
  assert.ok(!/gd-finishes-still [^\n]*gd-img-motion/.test(cssSrc), 'the retirement must not touch the image motion seats');
  // the pause road is retired for the still family
  const stillZone = cssSrc.match(/html\.gd-finishes-still[\s\S]{0,2200}?\/\* 1\.4\.8/)?.[0] || cssSrc.match(/html\.gd-finishes-still[\s\S]{0,2200}/)?.[0] || '';
  assert.ok(!/animation-play-state: paused !important;/.test(stillZone), 'the pause law survived inside the still family (the coats must be gone, not stilled)');
  // the rim law follows the coat off the stage
  const rim = cssSrc.match(/html\.gd-finishes-still \.gd-has-finish \.gd-card-title,[\s\S]*?-webkit-text-stroke: 0;/)?.[0] || '';
  assert.ok(rim.length > 0, 'the counter-ink rim did not follow the coat off the stage');
});

// ---------------------------------------------------------------------------
// C. THE KEY AND THE BADGE PART WAYS
// ---------------------------------------------------------------------------
ok('C1 — the SPECIAL THANKS row is a street: key + right-space badge', () => {
  assert.match(setSrc, /className="gd-about-credit-row"/, 'the row street is missing');
  // the KEY redirects only — no confetti call inside its handler
  const keyBlock = setSrc.match(/className="gd-about-link gd-about-credit"[\s\S]{0,700}?<\/button>/)?.[0] || '';
  assert.ok(keyBlock.length > 0, 'the credit key is missing');
  assert.ok(!/confettiBurst/.test(keyBlock), 'the key still fires confetti (the badge owns the celebration now)');
  assert.match(keyBlock, /openExternal\?\.\('https:\/\/github\.com\/Ktiseos-Nyx\/'\)/, 'the key lost its redirect');
  assert.ok(!/BETA TESTER/.test(keyBlock), 'the badge label still rides the key itself');
  assert.ok(!/gd-about-credit-role/.test(keyBlock), 'the old role chip survived inside the key');
  // the BADGE celebrates only
  // 1.8.9 — the badge rides the link family beside its own class
  const badgeBlock = setSrc.match(/className="gd-about-link gd-about-credit-badge"[\s\S]{0,500}?<\/button>/)?.[0] || '';
  assert.ok(badgeBlock.length > 0, 'the badge key is missing');
  assert.match(badgeBlock, /confettiBurst\(e\.currentTarget\)/, 'the badge never fires its burst');
  assert.ok(!/openExternal/.test(badgeBlock), 'the badge must celebrate only, never redirect');
  assert.match(badgeBlock, /BETA TESTER/, 'the badge lost its label');
});

ok('C2 — the row CSS: the street, the centered dead-level name, the badge', () => {
  const street = cssSrc.match(/\.gd-about-credit-row \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(street.includes('display: flex'), 'the street is not a flex row');
  const label = cssSrc.match(/\.gd-about-credit-row \.gd-about-credit \.gd-about-link-label \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(/text-align: center;/.test(label), 'the name does not center in the key');
  assert.ok(/transform: none;/.test(label), 'the 0.5px optical lean survived on the all-caps name');
  const badge = cssSrc.match(/\.gd-about-credit-badge \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(badge.includes('cursor: pointer'), 'the badge is not a key');
  assert.ok(!/\.gd-about-credit-role/.test(cssSrc), 'the retired role class survived in the CSS');
});

// ---------------------------------------------------------------------------
// D. THE PILLS SPEAK THE SECONDARY'S OWN VALUE
// ---------------------------------------------------------------------------
ok('D1 — the toast face is the accent-2 VALUE with the text-on-accent ink', () => {
  const pill = cssSrc.match(/\.gd-toast \{[\s\S]*?\n\}/)?.[0] || '';
  assert.match(pill, /background: var\(--gd-accent-2, var\(--gd-accent\)\);/, 'the face is not the secondary VALUE itself');
  assert.match(pill, /color: var\(--gd-accent-ink, #131313\);/, 'the text is not the text-on-accent token');
  assert.ok(!/color-mix\(in srgb, var\(--gd-accent-2\) 26%/.test(pill), 'the 1.5.8 tinted wash survived');
  const fail = cssSrc.match(/\.gd-toast\.is-fail \{[\s\S]*?\n\}/)?.[0] || '';
  assert.match(fail, /background: #c8402f;/, 'the fail arm is not a solid plate of its own');
});

// ---------------------------------------------------------------------------
// E. THE WINDOWS POP IN
// ---------------------------------------------------------------------------
ok('E1 — the entrance is a pop (fade + centered scale pulse, never a rise)', () => {
  assert.match(
    modalSrc,
    /initial=\{flight \|\| parked \? undefined : \{ opacity: 0, scale: 0\.965 \}\}/,
    'the fresh-mount entrance lost its pulse'
  );
  assert.match(modalSrc, /animate=\{flight \? undefined : \{ opacity: 1, scale: 1 \}\}/, 'the entrance never lands at true scale');
  assert.match(modalSrc, /exit=\{flight \? undefined : \{ opacity: 0, y: 6 \}\}/, 'the exit lost its small settle');
  // the CSS flight twin (the retained creation window)
  const flight = cssSrc.match(/\.gd-modal-layer\.gd-modal-flight \.gd-modal-card \{[\s\S]*?\n\}/)?.[0] || '';
  assert.match(flight, /transform: scale\(0\.965\);/, 'the retained flight still speaks the rise');
  assert.ok(!/translateY\(10px\)/.test(flight), 'the translateY rise survived in the CSS flight');
  const open = cssSrc.match(/\.gd-modal-layer\.gd-modal-flight\.is-open \.gd-modal-card \{[\s\S]*?\n\}/)?.[0] || '';
  assert.match(open, /transform: scale\(1\);/, 'the open flight never lands');
});

// ---------------------------------------------------------------------------
// F. THE BOARD REPLAYS ITS ENTRANCE
// ---------------------------------------------------------------------------
ok('F1 — a wholesale board turnover clears the seen cache (the class switch replays)', () => {
  const block = masonrySrc.match(/const freshBoard = \(\(\) => \{[\s\S]*?\}\)\(\);/)?.[0] || '';
  assert.ok(block.length > 0, 'the freshBoard question is missing');
  assert.match(block, /for \(const id of nextIds\) if \(!prev\.has\(id\)\) arrivals \+= 1;/, 'the arrivals census is missing');
  assert.match(block, /arrivals > Math\.max\(3, Math\.round\(nextIds\.size \* 0\.5\)\)/, 'the wholesale threshold is missing');
  assert.match(masonrySrc, /if \(freshBoard\) seenRef\.current\.clear\(\);/, 'the seen cache never clears for the turnover');
  // the entrance values themselves are untouched (the first-visit law)
  assert.match(masonrySrc, /initial=\{seenRef\.current\.has\(id\) \? false : \{ opacity: 0, y: 10 \}\}/, 'the entrance flight itself changed');
});

// ---------------------------------------------------------------------------
// G. THE PREWARM WALKS THE VERSIONS
// ---------------------------------------------------------------------------
ok('G1 — the boot-time walk speaks the images\u2019 true home (the card\u2019s versions)', () => {
  const walk = appSrc.match(/const list = \[\];[\s\S]{0,700}?if \(list\.length === 0\) return undefined;/)?.[0] || '';
  assert.ok(walk.length > 0, 'the walk is missing');
  assert.match(walk, /for \(const v of c\?\.versions \|\| \[\]\)/, 'the walk never visits the versions');
  assert.match(walk, /for \(const img of v\?\.images \|\| \[\]\) list\.push\(img\);/, 'the walk never collects the version images');
  assert.match(walk, /for \(const img of c\?\.images \|\| \[\]\) list\.push\(img\);/, 'the legacy top-level seat left the walk');
  assert.match(appSrc, /prewarmStageSizes\(imagesPathRef\.current, list\.slice\(i, i \+ CHUNK\)\);/, 'the idle walk lost its door');
});

// ---------------------------------------------------------------------------
// H. THE MUTE EDITS SPEAK
// ---------------------------------------------------------------------------
ok('H1 — the tag toggle and the edit-card commit speak their verdicts', () => {
  const toggle = appSrc.match(/const toggleTag = useCallback\([\s\S]*?\n  \);/)?.[0] || '';
  assert.ok(toggle.length > 0, 'toggleTag is missing');
  assert.match(toggle, /setStatusTransient\(`Tag "\$\{tagLabel\}" \$\{before \? 'removed from card' : 'added to card'\}`\);/, 'the toggle verdict is missing');
  assert.match(appSrc, /setStatusTransient\(`Card "\$\{stripRichText\(card\.name\)\.trim\(\)\}" updated`\);/, 'the edit-card commit never names its card');
});

// ---------------------------------------------------------------------------
// I. THE MATERIALS STOP LECTURING
// ---------------------------------------------------------------------------
ok('I1 — the finish pickers carry no tooltips', () => {
  assert.ok(!styleSrc.includes('The ${f.label} finish'), 'the long coat descriptions survived');
  assert.ok(!/\bf\.id === 'none'\s*\?\s*'No finish:/.test(styleSrc), 'the none tooltip survived');
  // the buttons render bare (no title attribute in the picker row)
  const row = styleSrc.match(/\{finishOptions\.map\(\(f\) => \([\s\S]*?\)\)\}/)?.[0] || '';
  assert.ok(row.length > 0, 'the picker row is missing');
  assert.ok(!/\btitle=/.test(row), 'a tooltip survived on a finish key');
  // the gate note keeps its own voice (it is the gate's reason, not a coat lecture)
  assert.match(styleSrc, /FINISHES OFF · SETTINGS → PERFORMANCE/, 'the gate note lost its reason');
});

// ---------------------------------------------------------------------------
// J. THE FLIGHT IS OURS
// ---------------------------------------------------------------------------
ok('J1 — the native image is canvas-suppressed and the miniature is a live owned element', () => {
  const fn = gridSrc.match(/const startCardDrag = \(e, id\) => \{[\s\S]*?\n  \};/)?.[0] || '';
  assert.ok(fn.length > 0, 'startCardDrag is missing');
  assert.match(fn, /setDragImage\(canvas, 0, 0\)/, 'the native image is not canvas-suppressed');
  assert.match(fn, /canvas\.width = 1;/, 'the canvas is not the 1x1 transparent form');
  assert.ok(!/setDragImage\(ghost,/.test(fn), 'the element-snapshot road survived');
  assert.ok(!/'left: -10000px',/.test(fn), 'the offscreen snapshot wager survived');
  assert.match(fn, /window\.addEventListener\('drag', onFlight, true\);/, 'the drag listener never armed');
  assert.match(fn, /window\.addEventListener\('dragover', onFlight, true\);/, 'the dragover listener never armed');
  assert.match(fn, /dragGhostDisposeRef\.current = dispose;/, 'the dispose handle never seated');
  assert.match(fn, /translate3d\(' \+ Math\.round\(x - miniW \/ 2\) \+ 'px, ' \+ Math\.round\(y - miniH \/ 2\) \+ 'px, 0\)/, 'the seat is not centered on the cursor');
  assert.match(gridSrc, /dragGhostDisposeRef\.current\?\.\(\);/, 'endCardDrag never disposes the owned flight');
  // the ghost's own CSS law
  const ghostCss = cssSrc.match(/\.gd-drag-ghost \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(ghostCss.includes('pointer-events: none'), 'the ghost could block the dragover targets');
  assert.ok(ghostCss.includes('z-index: 900'), 'the ghost lost its layer');
  assert.ok(ghostCss.includes('opacity: 0.55'), 'the pull never faded (the 1.8.1 law)');
});

// ---------------------------------------------------------------------------
// PURE — the version furniture
// ---------------------------------------------------------------------------
ok('P1 — the version is 1.6.3 everywhere', () => {
  assert.equal(JSON.parse(src('package.json')).version, '1.9.19', 'package.json');
  assert(src('src/constants/index.js').includes("version: '1.9.19',"), 'constants');
  assert(src('README.md').includes('**v1.9.19**'), 'README');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert(src('website/index.html').includes('<span class="ver">v1.8.6</span>'), 'website card');
  assert(src('CHANGELOG.md').startsWith('## 1.9.19 — The Ends Trade Places'), 'CHANGELOG');
});

// ---------------------------------------------------------------------------
// LIVE — the crash-proof window, the owned drag flight, the tag verdict
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
  g.requestIdleCallback = undefined;
  g.cancelIdleCallback = undefined;
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
    if (/Warning|act\(|deprecated|Not implemented/i.test(s)) return;
    errors.push(s);
  };
  dom.window.addEventListener('error', (e) => errors.push(String(e.error?.stack || e.message)));

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const CV = require('../src/components/CharacterView.jsx');
  const App = require('../src/App.jsx').default;

  window.api = {
    loadDB: async () => { throw new Error('boot not used for the direct mounts'); },
    openExternal: () => {},
    clipboardReadText: async () => '',
    clipboardWriteText: async () => {},
  };

  // --- LIVE 1: the bare CardLookModal render that used to die at the crash
  await okAsync('LIVE1 — the EDIT CARD window renders bare (the ReferenceError is dead)', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const rt = createRoot(host);
    const character = {
      id: 'c1',
      name: 'amy',
      versions: [{ id: 'v1', label: 'V1', images: [], parts: [] }],
      stamps: [],
      createdAt: 12345,
    };
    // the 1.5.8 code threw "finishesHidden is not defined" right here — the
    // bare mount, no prop, the default path.
    let crashed = null;
    try {
      rt.render(
        React.createElement(CV.CardLookModal, {
          character,
          coverUrl: null,
          coverAspect: null,
          defaultRatio: null,
          imagesPath: '/mock/images',
          stampLibrary: [],
          onClose: () => {},
          onApply: () => {},
        })
      );
      await sleep(300);
    } catch (e) {
      crashed = e;
    }
    assert.ok(!crashed, 'the window still crashes: ' + (crashed && String(crashed.message).slice(0, 160)));
    const card = [...document.querySelectorAll('.gd-modal-card')].find((m) => /EDIT CARD/i.test(m.textContent || ''));
    assert.ok(card, 'the EDIT CARD window never rendered');
    // and with the gate ON the row speaks its reason (the gate reached the window)
    rt.render(
      React.createElement(CV.CardLookModal, {
        character,
        coverUrl: null,
        coverAspect: null,
        defaultRatio: null,
        imagesPath: '/mock/images',
        stampLibrary: [],
        finishesHidden: true,
        onClose: () => {},
        onApply: () => {},
      })
    );
    await sleep(300);
    const gated = [...document.querySelectorAll('.gd-modal-card')].find((m) => /EDIT CARD/i.test(m.textContent || ''));
    assert.ok(gated, 'the gated window never rendered');
    assert.ok((gated.textContent || '').includes('FINISHES OFF'), 'the gate never reached the window\u2019s finish row');
    assert.ok(!(gated.textContent || '').includes('Mumeix'), 'the gated row still offers a living coat');
    rt.unmount();
    host.remove();
  });

  // --- LIVE 2: the owned drag flight, end to end
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

  const boot = async ({ db }) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const api = {
      loadDB: async () => ({ db, imagesPath: '/mock/images', status: 'ok', fromAppVersion: '', recoveredFrom: '', corruptSetAside: '' }),
      saveDB: async () => ({ ok: true }),
      sendUnsavedState: () => {},
      onPromptUnsaved: () => () => {},
      saveAndClose: async () => ({ ok: true }),
      forceClose: () => {},
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
    localStorage.setItem('gd:last-run-version', '1.9.19');
    const rt = createRoot(host);
    rt.render(React.createElement(App));
    await sleep(3400);
    return { host, root: rt };
  };

  await okAsync('LIVE2 — the owned flight: canvas suppression, the live ghost, the moving seat, the clean end', async () => {
    const { host, root } = await boot({ db: mkDb() });
    // the CARD root is the draggable div wearing .gd-card (the first plain
    // [draggable] on screen is the titlebar's wordmark logo — never it)
    const card = [...document.querySelectorAll('[draggable="true"]')].find((d) =>
      String(d.className || '').includes('gd-card')
    );
    assert.ok(card, 'no draggable card on the board');
    // jsdom measures nothing — lend the card a real box so the miniature builds
    Object.defineProperty(card, 'getBoundingClientRect', {
      value: () => ({ width: 236, height: 340, left: 10, top: 10, right: 246, bottom: 350 }),
    });
    // 1.6.0 — the ghost reads the card's LAYOUT box (transform-blind), so the
    // loan extends to the offset seats jsdom never measures.
    Object.defineProperty(card, 'offsetWidth', { value: 236 });
    Object.defineProperty(card, 'offsetHeight', { value: 340 });
    let dragImage = null;
    const dt = {
      effectAllowed: '',
      setData: () => {},
      setDragImage: (img, x, y) => { dragImage = { img, x, y }; },
    };
    // a real dragstart is a mouse-backed event: the pointer's own seat rides it
    const ev = new dom.window.MouseEvent('dragstart', { bubbles: true, cancelable: true, clientX: 60, clientY: 80 });
    Object.defineProperty(ev, 'dataTransfer', { value: dt });
    card.dispatchEvent(ev);
    await sleep(60);
    // the native image was suppressed with a canvas at (0,0)
    assert.ok(dragImage, 'setDragImage was never called');
    assert.equal(dragImage.img && dragImage.img.nodeName, 'CANVAS', 'the drag image is not the transparent canvas');
    assert.equal(dragImage.x, 0, 'the canvas anchor is not the corner');
    assert.equal(dragImage.y, 0, 'the canvas anchor is not the corner');
    // the owned ghost is a live, visible element following the flight
    const ghost = document.querySelector('.gd-drag-ghost');
    assert.ok(ghost, 'the owned ghost never mounted');
    assert.equal(ghost.style.width, '118px', 'the miniature box is wrong (got ' + ghost.style.width + ')');
    assert.ok(/translate3d\(/.test(ghost.style.transform), 'the ghost has no seat');
    // the flight's own events move it
    const before = ghost.style.transform;
    window.dispatchEvent(new dom.window.MouseEvent('dragover', { clientX: 400, clientY: 300, bubbles: true }));
    await sleep(40);
    assert.notEqual(ghost.style.transform, before, 'the dragover never moved the ghost');
    assert.ok(ghost.style.transform.includes('341px'), 'the seat is not centered on the cursor (got ' + ghost.style.transform + ')');
    // the end retires it
    card.dispatchEvent(new dom.window.Event('dragend', { bubbles: true }));
    await sleep(60);
    assert.ok(!document.querySelector('.gd-drag-ghost'), 'the ghost survived its own dragend');
    assert.ok(!document.documentElement.classList.contains('gd-card-drag'), 'the drag still class survived');
    root.unmount();
    host.remove();
  });

  // --- LIVE 3: the mute edit speaks (the tag toggle's toast)
  await okAsync('LIVE3 — toggling a tag on a card speaks its verdict', async () => {
    const { host, root } = await boot({ db: mkDb() });
    // the card root is a div that carries the open title (not a <button>)
    const openEl = [...document.querySelectorAll('[title]')].find((el) => /Open amy/i.test(el.title || ''));
    assert.ok(openEl, 'the card\u2019s open key is missing');
    openEl.click();
    await sleep(900);
    const chip = [...document.querySelectorAll('.gd-tag-chip')].find((b) => /remove tag "wip"/i.test(b.title || ''));
    assert.ok(chip, 'the tag chip never rendered in the panel');
    chip.click();
    await sleep(300);
    const toasts = [...document.querySelectorAll('.gd-toast')].map((t) => t.textContent || '');
    assert.ok(
      toasts.some((t) => t.includes('Tag "wip" removed from card')),
      'the toggle verdict never spoke (got ' + JSON.stringify(toasts.slice(0, 3)) + ')'
    );
    root.unmount();
    host.remove();
  });

  assert.equal(errors.length, 0, `render errors: ${errors.slice(0, 2).join(' | ').slice(0, 400)}`);
} else {
  console.log('  (jsdom unavailable — live passes skipped)');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
