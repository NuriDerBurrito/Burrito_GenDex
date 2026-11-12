// 1.5.8 batch — The Field Pass of Small Comforts.
// (Named 164 in the sequence: 159 -> 1.4.9, 160 -> 1.5.4, 161 -> 1.5.5,
//  162 -> 1.5.6, 163 -> 1.5.7.)
// The reported items, each pinned at its root law:
//   A.  the terms window grows VERTICALLY into its documents (TOS 1.0.2,
//       no em dashes, the ACCEPT key steps aside while reading)
//   B.  the About wall: SPECIAL THANKS below LEGAL, the confetti key, the
//       blurb retired, the chip beside the name
//   C.  the top-aligned modal seat starts BELOW the bar (no more shaving)
//   D.  the vine engraving's corners: the cross mask + the 28px sprays
//   E.  the notification pills speak the secondary color family
//   F.  the app font reaches the cards' own titles
//   G.  the first open is born true-sized (the boot-time prewarm door)
//   H.  EXPERIMENTAL FINISHES grew teeth (the rename, the always-spoken
//       lag warning, the picker gate in both editors)
//   I.  the creation seat arms 3x earlier + the settle re-arm pre-paint
//   J.  the stage blur rides its own compositor layer
//   K.  the auric hairline grain retired (the jaggy lines)
//   L.  the card-drag ghost learned its snapshot craft
// Plus pure passes (the 1.0.2 re-ask, the em-dash-free texts, the
// livingFinishes regression guard) and live jsdom passes (the gate's tall
// reader + the absent ACCEPT while reading, the About celebration, and
// the finish picker's gate both ways).

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
const legalSrc = src('src/components/LegalModal.jsx');
const setSrc = src('src/components/SettingsModal.jsx');
const cssSrc = src('src/index.css');
const legalConstSrc = src('src/constants/legal.js');
const helpersSrc = src('src/utils/helpers.js');
const styleSrc = src('src/components/CardStyleControls.jsx');
const ncmSrc = src('src/components/NewCharacterModal.jsx');
const cvSrc = src('src/components/CharacterView.jsx');
const gridSrc = src('src/components/GridView.jsx');
const stageSrc = src('src/components/ImageStage.jsx');

// ---------------------------------------------------------------------------
// A. THE TERMS WINDOW GROWS IN BOTH AXES
// ---------------------------------------------------------------------------
ok('A1 — the terms moved to 1.0.3 and the texts lost their em dashes', () => {
  // 1.9.1 — the terms moved to 1.0.6 (the paper house); the pin follows the live seat.
  assert(/export const TOS_VERSION = '1\.0\.6';/.test(legalConstSrc), 'the terms version never moved to 1.0.6');
  // the gate/reader's own strings are dash-free too
  const codeOnly = legalSrc
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n');
  assert(!codeOnly.includes('\u2014'), 'an em dash survived in LegalModal.jsx code');
});

ok('A2 — the gate reader speaks the tall posture and the ACCEPT steps aside', () => {
  assert(/tallPosture = null,/.test(modalSrc), 'Modal lost the tallPosture prop');
  assert(/const readerTall = page === 'cards' \? null : Math\.round\(/.test(legalSrc), 'the reader never computes its tall seat');
  assert(/tallPosture=\{readerTall\}/.test(legalSrc), 'the gate never passes the tall posture');
  // ACCEPT only on the cards face (the reading-foot law)
  const acceptAt = legalSrc.indexOf('ACKNOWLEDGE &amp; ACCEPT');
  const gateAt = legalSrc.indexOf("{page === 'cards' && (");
  assert(acceptAt > gateAt, 'the ACCEPT key is not gated to the cards face');
  assert(/\{page === 'cards' && \(/.test(legalSrc), 'the page gate is missing');
});

ok('A3 — the tall window seat starts BELOW the bar', () => {
  assert(/'items-start pt-12'/.test(modalSrc), 'the top-aligned seat still rides pt-6');
  assert(/const topBudget = Math\.max\(240, vh - 72\);/.test(modalSrc), 'the budget never paid for the new seat');
});

// ---------------------------------------------------------------------------
// B. THE ABOUT WALL — special thanks below legal, the confetti key
// ---------------------------------------------------------------------------
ok('B1 — SPECIAL THANKS rides below LEGAL, celebrates, and the blurb left', () => {
  const legalAt = setSrc.indexOf('<div className="gd-about-sec">LEGAL</div>');
  const thanksAt = setSrc.indexOf('<div className="gd-about-sec">SPECIAL THANKS</div>');
  assert(legalAt !== -1 && thanksAt !== -1 && thanksAt > legalAt, 'SPECIAL THANKS is not below LEGAL');
  assert(!/A local card/.test(setSrc), 'the tracker blurb survived');
  assert(/function confettiBurst\(el\)/.test(setSrc), 'the confetti burst is missing');
  assert(/Ktiseos-Nyx/.test(setSrc), 'the Ktiseos Nyx door is missing');
  // 1.5.9 — the badge owns the celebration now; the key owns the door
  // 1.8.9 — the badge rides the link family beside its own class
  const badgeBlock = setSrc.match(/className="gd-about-link gd-about-credit-badge"[\s\S]{0,500}?<\/button>/)?.[0] || '';
  assert(badgeBlock.length > 0 && /confettiBurst\(e\.currentTarget\)/.test(badgeBlock), 'the badge never fires its burst');
  const keyBlock = setSrc.match(/className="gd-about-link gd-about-credit"[\s\S]{0,700}?<\/button>/)?.[0] || '';
  assert(keyBlock.length > 0 && !/confettiBurst/.test(keyBlock), 'the key still fires confetti (the badge owns it now)');
  // the badge rides the row's own right space: the street + the dead-level name
  assert(/\.gd-about-credit-row \{[\s\S]*?display: flex;/.test(cssSrc), 'the row street is missing');
  assert(/\.gd-about-credit-row \.gd-about-credit \.gd-about-link-label \{[\s\S]*?transform: none;/.test(cssSrc), 'the name still leans down');
  assert(/\.gd-confetti-piece \{/.test(cssSrc) && /@keyframes gd-confetti-fly/.test(cssSrc), 'the confetti flight law is missing');
});

// ---------------------------------------------------------------------------
// C+D. THE CORNER LAWS — the vine's cross mask, the bar's own seat
// ---------------------------------------------------------------------------
ok('C1 — the vine rows speak the cross mask; the sprays own the corners', () => {
  const afterBlock = cssSrc.match(/\.gd-trim-vine::after \{[\s\S]*?\n\}/)?.[0] || '';
  assert(/linear-gradient\(#000, #000\) 50% 50% \/ 100% calc\(100% - 48px\) no-repeat/.test(afterBlock), 'the rows never learned the cross mask');
  assert(afterBlock.includes('-webkit-mask') && afterBlock.includes('mask:'), 'the mask needs both dialects');
  const beforeBlock = cssSrc.match(/\.gd-trim-vine::before \{[\s\S]*?\n\}/)?.[0] || '';
  assert(beforeBlock.includes('28px 28px no-repeat'), 'the sprays never grew to 28px');
  assert(!beforeBlock.includes('18px 18px'), 'the 18px sprays survived');
});

// ---------------------------------------------------------------------------
// E. THE PILLS SPEAK THE SECONDARY
// ---------------------------------------------------------------------------
ok('E1 — the notification family speaks the secondary OWN VALUE (1.5.9: face + text-on-accent ink)', () => {
  const toast = cssSrc.match(/\.gd-toast \{[\s\S]*?\n\}/)?.[0] || '';
  assert(/color: var\(--gd-accent-ink, #131313\);/.test(toast), 'the text never spoke the text-on-accent token');
  assert(/background: var\(--gd-accent-2, var\(--gd-accent\)\);/.test(toast), 'the face never became the secondary VALUE');
  assert(/border: 1\.5px solid color-mix\(in srgb, var\(--gd-ink\) 55%, var\(--gd-accent-2\)\);/.test(toast), 'the rim left the secondary family');
  const hover = cssSrc.match(/\.gd-toast:hover \{[\s\S]*?\n\}/)?.[0] || '';
  assert(hover.includes('--gd-accent-2'), 'the hover arm left the family');
  const pressed = cssSrc.match(/\.gd-toast\.is-pressed \{[\s\S]*?\n\}/)?.[0] || '';
  assert(pressed.includes('--gd-accent-2'), 'the press arm left the family');
});

// ---------------------------------------------------------------------------
// F. THE FONT REACHES THE CARDS
// ---------------------------------------------------------------------------
ok('F1 — the card title reads the body font seat', () => {
  const title = cssSrc.match(/\.gd-card-title \{[\s\S]*?\n\}/)?.[0] || '';
  assert(/font-family: var\(--gd-body-font, 'Space Grotesk', ui-sans-serif, system-ui, sans-serif\);/.test(title), 'the title still hardcodes the display face');
});

// ---------------------------------------------------------------------------
// G. THE FIRST OPEN IS BORN TRUE-SIZED
// ---------------------------------------------------------------------------
ok('G1 — the prewarm door ships and the app walks the library at boot', () => {
  assert(/export function prewarmStageSizes\(imagesPath, images\)/.test(stageSrc), 'the prewarm door is missing');
  assert(/import \{ prewarmStageSizes \} from '\.\/components\/ImageStage\.jsx';/.test(appSrc), 'App never imported the door');
  assert(/prewarmStageSizes\(imagesPathRef\.current, list\.slice\(i, i \+ CHUNK\)\);/.test(appSrc), 'the idle walk is missing');
  assert(/const CHUNK = 24;/.test(appSrc), 'the idle chunk law is missing');
});

// ---------------------------------------------------------------------------
// H. THE EXPERIMENTAL GATE GREW TEETH
// ---------------------------------------------------------------------------
ok('H1 — the switch speaks its true name and its lag warning', () => {
  assert(/title="EXPERIMENTAL FINISHES"/.test(setSrc), 'the rename never landed');
  assert(/gd-fin-lag-warn/.test(setSrc) && /MAY LAG/.test(setSrc), 'the lag warning is missing');
  assert(!/title="LIVING FINISHES"/.test(setSrc), 'the old title survived');
  assert(/\.gd-fin-lag-warn \{/.test(cssSrc) && /@keyframes gd-fin-lag-pulse/.test(cssSrc), 'the warn chip CSS is missing');
});

ok('H2 — the picker gate: finishesHidden rides every editor seat', () => {
  assert(/finishesHidden = false,/.test(styleSrc), 'CardStyleControls lost the gate prop');
  assert(/CARD_FINISHES\.filter\(\(f\) => f\.id === 'none'\)/.test(styleSrc), 'the picker never filters to None');
  assert(/gd-fin-gate-note/.test(styleSrc), 'the gate note is missing');
  assert(/finishesHidden=\{finishesHidden\}/.test(ncmSrc), 'the creation window never passes the gate');
  assert(/finishesHidden=\{finishesHidden\}/.test(cvSrc), 'the edit window never passes the gate');
  assert(/export function CardLookModal\(\{[^}]*finishesHidden = false,/.test(cvSrc), 'the App-level edit-card window lost the gate in its own signature (the 1.5.9 crash)');
  const gates = (appSrc.match(/finishesHidden=\{db\??\.settings\??\.livingFinishes === false\}/g) || []).length;
  assert.equal(gates, 4, 'App passes the gate at ' + gates + ' seats (needs 4: panel view, full view, creation seat, the App-level edit-card window)');
});

// ---------------------------------------------------------------------------
// I. THE SEAT ARMS EARLIER, THE SETTLE RE-ARMS PRE-PAINT
// ---------------------------------------------------------------------------
ok('I1 — the retained seat arms on the idle breath; the settle re-arm is a layout effect', () => {
  assert(/requestIdleCallback\(arm, \{ timeout: 350 \}\)/.test(appSrc), 'the arm breath never arrived (1.6.0: the idle call)');
  const block = modalSrc.match(/useLayoutEffect\(\(\) => \{\s*if \(!flightOpened\) return undefined;[\s\S]*?\}, \[flightOpened\]\);/)?.[0] || '';
  assert(/setSettling\(true\);/.test(block), 'the pre-paint re-arm is missing');
});

// ---------------------------------------------------------------------------
// J+K. THE BLUR'S OWN LAYER + THE AURIC GRAIN
// ---------------------------------------------------------------------------
ok('J1 — the stage blur rides its own compositor layer', () => {
  const blur = cssSrc.match(/\.gd-stage-blur \{[\s\S]*?\n\}/)?.[0] || '';
  assert(/will-change: transform;/.test(blur), 'the blur still repaints per scroll frame');
});

ok('K1 — the auric body lost its hairline grain', () => {
  const auric = cssSrc.match(/\.gd-finish-auric \{[\s\S]*?\n\}/)?.[0] || '';
  assert(!/repeating-linear-gradient/.test(auric), 'the jaggy stripes survived');
  assert(/linear-gradient\(/.test(auric), 'the honey wash must stay');
});

// ---------------------------------------------------------------------------
// L. THE GHOST LEARNS ITS SNAPSHOT CRAFT
// ---------------------------------------------------------------------------
ok('L1 — the owned flight: canvas suppression + the live miniature under the cursor (1.5.9)', () => {
  assert(/setDragImage\(canvas, 0, 0\)/.test(gridSrc), 'the native drag image is not canvas-suppressed');
  assert(/gd-drag-ghost/.test(gridSrc), 'the owned ghost class is missing');
  assert(/window\.addEventListener\('drag', onFlight, true\);/.test(gridSrc), 'the drag listener never armed');
  assert(/window\.addEventListener\('dragover', onFlight, true\);/.test(gridSrc), 'the dragover listener never armed');
  assert(/dragGhostDisposeRef/.test(gridSrc), 'the dispose ref is missing (the drop clears dragRef first)');
  assert(!/'left: -10000px',/.test(gridSrc), 'the offscreen snapshot wager survived');
  assert(!/setDragImage\(ghost,/.test(gridSrc), 'the element-snapshot road survived');
});

// ---------------------------------------------------------------------------
// PURE — the re-ask, the dash-free documents, the living guard
// ---------------------------------------------------------------------------
const { createSafeDb } = await import('../src/utils/helpers.js');
const { TOS_VERSION, TOS_DOC, PRIVACY_DOC } = await import('../src/constants/legal.js');

ok('P1 — 1.0.3 re-asks every 1.0.2 library; the texts carry no em dash', () => {
  assert.equal(TOS_VERSION, '1.0.6'); // 1.9.1 — the paper house moved the seat
  const past = createSafeDb({ settings: { tosAcceptance: { version: '1.0.2', at: 12345 } } });
  assert.notEqual(past.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.2 record must not count as current');
  const strings = [TOS_DOC.intro, PRIVACY_DOC.intro, CONTACT_LINE_SAFE()];
  for (const doc of [TOS_DOC, PRIVACY_DOC]) {
    for (const sec of doc.sections) {
      for (const p of sec.body || []) strings.push(p);
      for (const b of sec.bullets || []) strings.push(b);
    }
  }
  for (const s of strings) {
    assert(!String(s).includes('\u2014'), `an em dash survived in the texts: ${String(s).slice(0, 60)}`);
  }
});
function CONTACT_LINE_SAFE() {
  const m = legalConstSrc.match(/const CONTACT_LINE =\s*\n?\s*'([^']+)';/);
  return m ? m[1] : '';
}

ok('P2 — livingFinishes keeps its 1.5.7 semantics (the regression guard)', () => {
  const past = createSafeDb({ settings: { theme: 'zine' } });
  assert.equal(past.settings.livingFinishes, true, 'an old database was born still');
  const off = createSafeDb({ settings: { livingFinishes: false } });
  assert.equal(off.settings.livingFinishes, false, 'a stored OFF did not survive');
  assert(/typeof rawSettings\.livingFinishes === 'boolean' \? rawSettings\.livingFinishes : DEFAULT_SETTINGS\.livingFinishes,/.test(helpersSrc), 'the sanitize law changed');
});

// ---------------------------------------------------------------------------
// LIVE — the tall reader, the absent ACCEPT, the About celebration, the gate
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

  const boot = async ({ db, savedDbs, closes, lastRun, externals }) => {
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
      openExternal: (url) => { (externals || []).push(url); },
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

  // --- LIVE 1: the gate's reader grows tall; ACCEPT waits on the front face
  await okAsync('LIVE1 — the reader opens tall (72vh posture) and the ACCEPT key steps aside', async () => {
    const savedDbs = [];
    const closes = [];
    const { host, root } = await boot({ db: mkDb(), savedDbs, closes, lastRun: '1.9.19' });
    const gate = findCard(/TERMS & PRIVACY/i);
    assert.ok(gate, 'the gate never mounted for an unaccepted library');
    const vh = dom.window.innerHeight;
    const expectedTall = Math.max(240, Math.min(Math.round(vh * 0.72), Math.max(240, vh - 72)));
    // the cards face keeps its compact natural posture (tall posture null)
    assert.ok(!gate.style.height || gate.style.height !== expectedTall + 'px', 'the cards face is already tall (it must stay compact)');
    const tosCard = [...gate.querySelectorAll('.gd-legal-card')][0];
    tosCard.click();
    await sleep(220);
    assert.equal(gate.style.height, expectedTall + 'px', `the reader never grew tall (got ${gate.style.height}, wanted ${expectedTall}px)`);
    assert.ok(gate.className.includes('w-[680px]'), 'the reader posture never widened');
    // ACCEPT is absent while reading; BACK carries the foot with DECLINE
    assert.ok(!findBtn(/^ACKNOWLEDGE & ACCEPT$/i, gate), 'the ACCEPT key shows while reading (it must step aside)');
    assert.ok(findBtn(/^BACK$/i, gate), 'the BACK key is missing while reading');
    assert.ok(findBtn(/^DECLINE$/i, gate), 'the DECLINE key is missing while reading');
    const back = findBtn(/^BACK$/i, gate);
    back.click();
    await sleep(220);
    assert.ok(findBtn(/^ACKNOWLEDGE & ACCEPT$/i, gate), 'the ACCEPT key never came home');
    assert.notEqual(gate.style.height, expectedTall + 'px', 'BACK never relaxed the tall posture');
    root.unmount();
    host.remove();
  });

  // --- LIVE 2: the About celebration (confetti + the Ktiseos door)
  await okAsync('LIVE2 — the badge celebrates, the key redirects (the 1.5.9 split)', async () => {
    const savedDbs = [];
    const closes = [];
    const externals = [];
    const db = mkDb({ settings: { tosAcceptance: { version: TOS_VERSION, at: 12345 } } });
    const { host, root } = await boot({ db, savedDbs, closes, lastRun: '1.9.19', externals });
    // open settings (the gear key in the top bar)
    const gear = [...document.querySelectorAll('.gd-titlebar button')].find((b) => /settings/i.test(b.title || ''));
    assert.ok(gear, 'the settings gear is missing');
    gear.click();
    await sleep(420);
    const settings = findCard(/^\s*SETTINGS/i);
    assert.ok(settings, 'the settings window never opened');
    const aboutTab = [...settings.querySelectorAll('.gd-rail-btn')].find((b) => /about/i.test(b.textContent || ''));
    assert.ok(aboutTab, 'the About rail key is missing');
    aboutTab.click();
    await sleep(300);
    // order: LEGAL section above SPECIAL THANKS
    const body = settings.textContent || '';
    assert.ok(body.includes('LEGAL') && body.includes('SPECIAL THANKS'), 'the About wall lost a section');
    assert.ok(body.indexOf('LEGAL') < body.indexOf('SPECIAL THANKS'), 'SPECIAL THANKS is not below LEGAL');
    assert.ok(!body.includes('A local card'), 'the tracker blurb survived');
    const credit = [...settings.querySelectorAll('.gd-about-credit')][0];
    assert.ok(credit, 'the SPECIAL THANKS key is missing');
    assert.ok(!/BETA TESTER/.test(credit.textContent || ''), 'the badge must not ride the key itself (1.6.2)');
    const badge = [...settings.querySelectorAll('.gd-about-credit-badge')][0];
    assert.ok(badge, 'the BETA TESTER badge is missing from the row (1.6.2)');
    assert.match(badge.textContent || '', /BETA TESTER/, 'the badge lost its label');
    assert.ok(document.querySelectorAll('.gd-confetti-piece').length === 0, 'confetti pieces lingered from a prior pass');
    badge.click();
    await sleep(120);
    const pieces = document.querySelectorAll('.gd-confetti-piece');
    assert.ok(pieces.length >= 24, 'the badge never fired its burst (got ' + pieces.length + ' pieces)');
    assert.ok(externals.length === 0, 'the badge must celebrate only, never redirect (got ' + JSON.stringify(externals) + ')');
    credit.click();
    await sleep(120);
    assert.ok(externals.includes('https://github.com/Ktiseos-Nyx/'), 'the Ktiseos Nyx home never opened (got ' + JSON.stringify(externals) + ')');
    await sleep(1900);
    assert.ok(document.querySelectorAll('.gd-confetti-piece').length === 0, 'the confetti never cleaned up after itself');
    root.unmount();
    host.remove();
  });

  // --- LIVE 3: the finish picker gate, both ways
  await okAsync('LIVE3 — the picker gate: OFF hides every coat; ON lists them again', async () => {
    // OFF
    {
      const savedDbs = [];
      const closes = [];
      const db = mkDb({ settings: { tosAcceptance: { version: TOS_VERSION, at: 1 }, livingFinishes: false } });
      const { host, root } = await boot({ db, savedDbs, closes, lastRun: '1.9.19' });
      const newCard = findBtn(/^NEW CARD$/i);
      assert.ok(newCard, 'the NEW CARD key is missing');
      newCard.click();
      await sleep(300);
      const win = document.querySelector('.gd-modal-layer.gd-modal-flight.is-open');
      assert.ok(win, 'the creation window never opened');
      const finishRow = [...win.querySelectorAll('.gd-btn')].filter((b) => b.closest('.space-y-4') && /FINISH/i.test((b.closest('.space-y-4')?.querySelector('.text-\\[9px\\]')?.textContent) || '') || /^(None|Foil|Mumeix|Auric|Holographic|Prismatic|Nuri)$/i.test(b.textContent || ''));
      const labels = finishRow.map((b) => (b.textContent || '').trim()).filter((t) => /^(None|Foil|Mumeix|Auric|Holographic|Prismatic|Nuri)$/i.test(t));
      assert.ok(labels.includes('None'), 'the None key is missing');
      assert.ok(!labels.includes('Nuri'), 'Nuri still exists while the gate is shut');
      assert.ok(!labels.includes('Auric'), 'Auric still exists while the gate is shut');
      assert.ok(win.textContent.includes('FINISHES OFF'), 'the gate note is missing');
      root.unmount();
      host.remove();
    }
    // ON (default)
    {
      const savedDbs = [];
      const closes = [];
      const db = mkDb({ settings: { tosAcceptance: { version: TOS_VERSION, at: 1 } } });
      const { host, root } = await boot({ db, savedDbs, closes, lastRun: '1.9.19' });
      const newCard = findBtn(/^NEW CARD$/i);
      newCard.click();
      await sleep(300);
      const win = document.querySelector('.gd-modal-layer.gd-modal-flight.is-open');
      assert.ok(win, 'the creation window never opened');
      const labels = [...win.querySelectorAll('.gd-btn')].map((b) => (b.textContent || '').trim()).filter((t) => /^(None|Foil|Mumeix|Auric|Holographic|Prismatic|Nuri)$/i.test(t));
      assert.ok(labels.includes('Nuri'), 'Nuri left while the gate is open');
      assert.ok(labels.includes('Auric'), 'Auric left while the gate is open');
      assert.ok(!win.textContent.includes('FINISHES OFF'), 'the gate note shows while the gate is open');
      root.unmount();
      host.remove();
    }
  });

  assert.equal(errors.length, 0, `render errors: ${errors.slice(0, 2).join(' | ').slice(0, 400)}`);
} else {
  console.log('  (jsdom unavailable — live passes skipped)');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
