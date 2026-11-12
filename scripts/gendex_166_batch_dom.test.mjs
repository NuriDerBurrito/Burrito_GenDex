// 1.6.0 batch — The Thunder Leaves the Gold.
// (Named 166 in the sequence: 159 -> 1.4.9, 160 -> 1.5.4, 161 -> 1.5.5,
//  162 -> 1.5.6, 163 -> 1.5.7, 164 -> 1.5.8, 165 -> 1.5.9.)
// The reported items, each pinned at its root law:
//   A.  the class-switch crash is dead (the seen cache is declared ABOVE the
//       fresh-board block that clears it — the temporal dead zone closed)
//   B.  the detail panel SPEAKS a card switch (the whole scroller replays
//       the cards' arrival breath on a character change, warm tree intact)
//   C.  the auric thunder retired for faceted gold GEMS (the zigzag bolt
//       tile left wholesale; the drifting clocks untouched)
//   D.  the tooltip keeps its corners in rounded mode (a 10px corner budget)
//   E.  the unsaved-changes ask speaks the house language + the settle snaps
//       its SIZE only, never the fade clocks (the guarded close animates)
//   F.  a duplicated ENLARGED card stays enlarged (the seat follows the
//       bloodline)
//   G.  the drag ghost measures the card's LAYOUT box (transform-blind,
//       never cropped mid-squish)
//   H.  ZINE PUNK is the default theme (fresh databases + the main-side
//       first-paint fallback speak the fanzine cloth)
//   I.  the terms ask once more at 1.0.3 (texts byte-identical, visibility
//       bump in the 1.0.1 tradition)
//   J.  the creation seat arms on the machine's own idle breath
//       (requestIdleCallback with a 350ms ceiling)
// Plus the version furniture and live jsdom passes (the wholesale switch
// rendered crash-free, the panel swap class through the real App, and the
// ask's own exit flight).

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
const masonrySrc = src('src/components/MasonryGrid.jsx');
const gridSrc = src('src/components/GridView.jsx');
const cvSrc = src('src/components/CharacterView.jsx');
const ribbonSrc = src('src/components/TagRibbon.jsx');
const cssSrc = src('src/index.css');
const legalSrc = src('src/constants/legal.js');
const constSrc = src('src/constants/index.js');
const mainSrc = src('src/main.js');
const pkgSrc = src('package.json');
const lockSrc = src('package-lock.json');
const readmeSrc = src('README.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const changeSrc = src('CHANGELOG.md');

// ---------------------------------------------------------------------------
// A. THE CRASH IS DEAD (the temporal dead zone closed)
// ---------------------------------------------------------------------------
ok('A1 — the seen cache is declared ABOVE the fresh-board block that clears it', () => {
  // the 1.5.9 law read seenRef at the top of the render while the const sat
  // ~24 lines further down — every wholesale class switch died at
  // "Cannot access 'N' before initialization".
  const clearSeat = masonrySrc.indexOf('if (freshBoard) seenRef.current.clear();');
  const declSeat = masonrySrc.indexOf('const seenRef = useRef(new Set());');
  assert.ok(clearSeat > 0, 'the fresh-board clear law is missing');
  assert.ok(declSeat > 0, 'the seen cache declaration is missing');
  assert.ok(declSeat < clearSeat, 'the declaration still sits below its first reader (the dead zone lives)');
  // and the cache still feeds the entrance law at the render's seat
  assert.match(masonrySrc, /initial=\{seenRef\.current\.has\(id\) \? false : \{ opacity: 0, y: 10 \}\}/, 'the entrance law lost its seen cache');
});

// ---------------------------------------------------------------------------
// B. THE PANEL SPEAKS THE SWITCH (the card swap's shift)
// ---------------------------------------------------------------------------
ok('B1 — the view replays the cards\u2019 arrival breath on a character change', () => {
  assert.match(cvSrc, /const swapCharIdRef = useRef\(null\);/, 'the swap tracker is missing');
  // 1.7.5 — the ceremony dances the tags' own tagflight class too (the
  // split-clocks law — see CharacterView's 1.7.5 note)
  assert.match(cvSrc, /el\.classList\.remove\('gd-cv-swap'\);[\s\S]*?el\.classList\.remove\('gd-cv-tagflight'\);\s*\n\s*void el\.offsetWidth; \/\/ reflow so the class flip animates\s*\n\s*el\.classList\.add\('gd-cv-swap'\);\s*\n\s*if \(showAllTags === false\) el\.classList\.add\('gd-cv-tagflight'\);/, 'the strip/reflow/re-add re-arm is missing');
  assert.match(cvSrc, /if \(prev == null \|\| prev === id\) return;/, 'the first mount must stay silent');
  // 1.6.2 — the arm retires on its own clock (the flight speaks on
  // descendant seats now; the root's animationend handler left with
  // the root's own animation)
  assert.match(cvSrc, /swapCleanTimerRef\.current = setTimeout\(/, 'the swap arm never retires on its own clock');
  // the CSS law speaks the same language the grid cards speak
  // 1.6.2 — the flight speaks on the CONTENT seats, never the scroller
  // 1.6.7 — THE PICTURE ALONE BREATHES ("i dont want the buttons to fade,
  // such as + stamp and + tag … the left and right buttons, notes and
  // prompt buttons … and even the tags, stamps fade, text fades,
  // versions fade, etc.."): the owner's list is the whole panel — the
  // 1.6.2/1.6.5 seats (the scroller children, the header children, the
  // tray content, the cards' children) all retired; the flight's ONE
  // seat is the image column's pictures (.gd-stage-pictures — the media
  // crossfading alone, everything else SOLID through the flight).
  assert.ok(!/\.gd-cv-swap > \*:not\(\.gd-char-head\)/.test(cssSrc), 'the retired scroller seat survived (1.6.7: the picture alone breathes)');
  assert.ok(!/\.gd-cv-swap \.gd-char-head > \*:not\(\.gd-rows-tray\)/.test(cssSrc), 'the retired header seat survived');
  assert.ok(!/\.gd-cv-swap \.gd-rows-body > \*/.test(cssSrc), 'the retired tray seat survived');
  assert.ok(/\.gd-cv-swap \.gd-cardcol \.gd-stage-pictures,/.test(cssSrc), 'the pictures never found their seat (1.6.8: the content group)');
  assert.ok(/animation: gd-cv-swap 0\.15s ease-out;/.test(cssSrc), 'the swap clock is missing');
  const kf = cssSrc.match(/@keyframes gd-cv-swap \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(kf.includes('opacity: 0') && !kf.includes('translateY'), 'the swap flight lost its breath (1.6.3: the flight is a PURE FADE — the seats speak opacity alone, the exact report)');
  assert.ok(/\.gd-reduced-motion \.gd-cv-swap \.gd-cardcol \.gd-stage-pictures/.test(cssSrc) && /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.gd-cv-swap \.gd-cardcol \.gd-stage-pictures/.test(cssSrc), 'the reduced-motion seats still move (1.6.2: the seat dialect)');
});

// ---------------------------------------------------------------------------
// C. THE THUNDER RETIRES, THE GOLD STAYS (the gems field)
// ---------------------------------------------------------------------------
ok('C1 — the zigzag bolt tile left; the faceted gems took the seat', () => {
  const block = cssSrc.match(/\.gd-auric-currents::before \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(block.length > 0, 'the auric gems seat is missing');
  // the bolts are gone (the 1.5.0 zigzag streak paths + their round caps)
  assert.ok(!block.includes('M-4 96 L36 72 L64 84 L124 48'), 'the thunder bolts survived');
  assert.ok(!block.includes('stroke-linecap'), 'the streak craft survived');
  // the gems speak: cut-gem outline + facets, tilted diamonds, sparkles, beads
  assert.ok(/d='M63 24 L80 45 L63 66 L46 45 Z'/.test(block), 'the cut-gem outline is missing');
  assert.ok(/d='M63 24 L63 66'/.test(block), 'the crown facets are missing');
  assert.ok(block.includes("transform='rotate(18 38 18)'") && block.includes("transform='rotate(-14 84 104)'"), 'the tilted diamonds are missing');
  assert.ok(/d='M14 48 L15\.5 54\.5 L22 56 L15\.5 57\.5 L14 64 L12\.5 57\.5 L6 56 L12\.5 54\.5 Z'/.test(block), 'the four-point sparkles are missing');
  assert.ok(/circle cx='30' cy='110'/.test(block), 'the beads are missing');
  // the drifting clocks are the coat's own, untouched
  assert.ok(block.includes('gd-auric-run 13s linear infinite'), 'the 13s drift clock left');
  assert.ok(block.includes('gd-auric-breath 8s ease-in-out infinite'), 'the 8s breath clock left');
  assert.ok(block.includes('inset: 0 0 -120px -120px'), 'the directional inset (BOTTOM + LEFT) left');
  // the seat's own comment speaks the retirement
  assert.ok(cssSrc.includes('THE THUNDER IS RETIRED FOR REAL'), 'the retirement note is missing');
  assert.ok(ribbonSrc.includes('THE GEMS (1.6.0'), 'the seat comment never heard the rework');
});

// ---------------------------------------------------------------------------
// D. THE PILL KEEPS ITS CORNERS (the tooltip's corner budget)
// ---------------------------------------------------------------------------
ok('D1 — the tooltip corner rides a 10px budget, never the raw stadium', () => {
  const block = cssSrc.match(/\.gd-tip \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(block.length > 0, 'the tooltip rule is missing');
  assert.match(block, /border-radius: min\(calc\(var\(--gd-btn-radius, 6px\) - 1px\), 10px\);/, 'the corner budget is missing');
  assert.ok(!/border-radius: calc\(var\(--gd-btn-radius, 6px\) - 1px\);/.test(block), 'the raw radius survived (rounded mode carves wrapping sentences)');
});

// ---------------------------------------------------------------------------
// E. THE ASK SPEAKS THE HOUSE LANGUAGE + THE SETTLE SNAPS ITS SIZE ONLY
// ---------------------------------------------------------------------------
ok('E1 — the unsaved-changes ask pops and settles like every window', () => {
  // the ask rides AnimatePresence now (its exit flight exists)
  assert.match(modalSrc, /const askLayer = \(\s*\/\* 1\.6\.0[\s\S]*?\*\/\s*<AnimatePresence>/, 'the ask never joined the presence family');
  const askCard = modalSrc.match(/className="gd-card gd-modal-ask relative flex flex-col w-\[410px\]"[\s\S]{0,400}?transition=\{\{ duration: 0\.13, ease: 'easeOut' \}\}/)?.[0] || '';
  assert.ok(askCard.includes("initial={{ opacity: 0, scale: 0.965 }}"), 'the ask lost the pop-in pulse');
  assert.ok(askCard.includes("exit={{ opacity: 0, y: 6 }}"), 'the ask lost its farewell settle');
});
ok('E2 — the settle snaps its SIZE, never the fade clocks', () => {
  // the blanket transition:none is retired; the override speaks height/width only
  assert.match(modalSrc, /const settleSnap = pinned \|\| settling \? \{ transition: 'height 0s ease, width 0s ease' \} : null;/, 'the size-only snap is missing');
  assert.ok(!/pinned \|\| settling \? \{ transition: 'none' \}/.test(modalSrc), 'the blanket transition:none survived (it killed the flight card\u2019s fade clocks)');
  assert.match(modalSrc, /\.\.\.settleSnap,/, 'the card style never speaks the snap');
});

// ---------------------------------------------------------------------------
// F. THE COPY KEEPS ITS SIZE (the duplicated enlarged card)
// ---------------------------------------------------------------------------
ok('F1 — the duplicate inherits its source\u2019s expanded seat', () => {
  const fn = appSrc.match(/const duplicateCharacter = useCallback\([\s\S]*?\n  \);/)?.[0] || '';
  assert.ok(fn.length > 0, 'the duplicate road is missing');
  assert.match(fn, /if \(expandedCardsRef\.current\.has\(id\)\) \{/, 'the bloodline check is missing');
  assert.match(fn, /next\.add\(clone\.id\);/, 'the copy never takes its seat');
});

// ---------------------------------------------------------------------------
// G. THE BOX IS THE LAYOUT, NOT THE FLIGHT (the drag ghost)
// ---------------------------------------------------------------------------
ok('G1 — the ghost measures the card\u2019s transform-blind layout box', () => {
  const fn = gridSrc.match(/const startCardDrag = \(e, id\) => \{[\s\S]*?\n  \};/)?.[0] || '';
  assert.ok(fn.length > 0, 'the drag road is missing');
  assert.match(fn, /const layW = Math\.round\(card\.offsetWidth \|\| 0\);/, 'the layout width is missing');
  assert.match(fn, /const layH = Math\.round\(card\.offsetHeight \|\| 0\);/, 'the layout height is missing');
  assert.match(fn, /Math\.min\(1, 118 \/ layW\)/, 'the miniature scale still reads the jelly rect');
  assert.ok(!/118 \/ rect\.width/.test(fn), 'the live-transform rect survived (the mid-squish crop lives)');
  assert.match(fn, /clone\.style\.width = layW \+ 'px';/, 'the clone still pins a transformed width');
});

// ---------------------------------------------------------------------------
// H. ZINE PUNK TAKES THE HOUSE (the default theme)
// ---------------------------------------------------------------------------
ok('H1 — fresh databases wake up on the fanzine cloth', () => {
  assert.match(constSrc, /theme: 'zine',/, 'the default theme never moved');
  const tex = constSrc.match(/textures: \{\s*titlebar: 'none',\s*sidebar: 'none',\s*viewer: 'dots',\s*panel: 'dots',\s*\},/)?.[0] || '';
  assert.ok(tex.length > 0, 'the fresh-database texture set never followed the theme');
  // the main-side first paint speaks the same ground
  assert.match(mainSrc, /backgroundColor: peekThemeBg\(\) \|\| '#101014',/, 'the no-database fallback still paints a stranger\u2019s ground');
});

// ---------------------------------------------------------------------------
// I. THE TERMS ASK ONCE MORE (TOS 1.0.3)
// ---------------------------------------------------------------------------
ok('I1 — the terms version moved; the visibility bump keeps its tradition', () => {
  // 1.9.1 — the terms moved to 1.0.6 (the paper house); the pin follows the live seat.
  assert.match(legalSrc, /export const TOS_VERSION = '1\.0\.6';/, 'the terms version never moved to 1.0.6');
  assert.ok(legalSrc.includes("texts stay byte-identical"), 'the bump forgot its own tradition note');
});

// ---------------------------------------------------------------------------
// J. THE BEAT BECOMES A BREATHE (the idle arm)
// ---------------------------------------------------------------------------
ok('J1 — the retained seat arms on the machine\u2019s own idle breath', () => {
  assert.match(appSrc, /requestIdleCallback\(arm, \{ timeout: 350 \}\)/, 'the idle call is missing');
  assert.match(appSrc, /const t = setTimeout\(arm, 200\);/, 'the setTimeout fallback is missing');
  assert.ok(!/setTimeout\(\(\) => setNewCardSeatArmed\(true\), 350\)/.test(appSrc), 'the fixed-guess beat survived');
});

// ---------------------------------------------------------------------------
// P. THE VERSION FURNITURE
// ---------------------------------------------------------------------------
ok('P1 — the version is 1.6.5 everywhere', () => {
  assert.match(pkgSrc, /"version": "1\.9\.19"/, 'package.json never moved');
  assert.ok((lockSrc.match(/"version": "1\.9\.19"/g) || []).length >= 2, 'the lock root pins never moved');
  assert.match(constSrc, /version: '1\.9\.19',/, 'APP.version never moved');
  assert.match(readmeSrc, /\*\*v1\.9\.19\*\*/, 'the README header never moved');
  // 1.8.9 — THE README IS THE PUBLIC FACE: the version roll retired with it
  // (the first public release speaks features, not history; the changelog
  // keeps the story). The paragraph's old seat is gone by law.
  assert.ok(!/^1\.\d+\.\d+ — /m.test(readmeSrc), 'the version roll retired with the public README');
  assert.match(readmeSrc, /the regression battery \(93 DOM\/source test suites\)/, 'the README battery count never moved (1.6.3: the 168 battery)');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(webSrc, /<span class="ver">v1\.8\.6<\/span>/, 'the website card never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(webSrc, /releases\/download\/v1\.8\.6\/Burrito%20GenDex-1\.8\.6%20Setup\.exe/, 'the website installer URL never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(webSrc, /Burrito_GenDex_1\.8\.6_source\.zip/, 'the website source URL never moved');
  assert.match(changeSrc, /^## 1\.9\.19 — The Ends Trade Places/, 'the changelog head never arrived');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.ok(webSrc.includes('<tr class="current-row">\n          <td class="v">1.7.8</td>'), 'the website current-row never moved');
});

// ---------------------------------------------------------------------------
// PURE — the terms machinery under the bump
// ---------------------------------------------------------------------------
const { createRequire } = await import('node:module');
const req = createRequire(import.meta.url);
const { createSafeDb } = req('../src/utils/helpers.js');
const { TOS_VERSION, TOS_DOC, PRIVACY_DOC } = await import('../src/constants/legal.js');
ok('P2 — a 1.0.2 record re-asks; a 1.0.3 record rests', () => {
  // 1.9.1 — the terms moved to 1.0.6 (the paper house): the 1.0.4 AND 1.0.5
  // records re-ask too, and the resting seat belongs to 1.0.6.
  assert.equal(TOS_VERSION, '1.0.6');
  const past = createSafeDb({ settings: { tosAcceptance: { version: '1.0.2', at: 12345 } } });
  assert.notEqual(past.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.2 record must not count as current');
  const prior = createSafeDb({ settings: { tosAcceptance: { version: '1.0.4', at: 12345 } } });
  assert.notEqual(prior.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.4 record must not count as current either (the 1.8.9 bump)');
  const paper = createSafeDb({ settings: { tosAcceptance: { version: '1.0.5', at: 12345 } } });
  assert.notEqual(paper.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.5 record must not count as current either (the 1.9.1 bump)');
  const now = createSafeDb({ settings: { tosAcceptance: { version: '1.0.6', at: 12345 } } });
  assert.equal(now.settings.tosAcceptance.version, TOS_VERSION, 'a 1.0.6 record must count as current');
  // the documents carry the new version stamp
  assert.equal(TOS_DOC.version, '1.0.6');
  assert.equal(PRIVACY_DOC.version, '1.0.6');
});

// ---------------------------------------------------------------------------
// LIVE — the wholesale switch, the panel swap, the ask's own farewell
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
  const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  const MasonryGrid = require('../src/components/MasonryGrid.jsx').default;
  const App = require('../src/App.jsx').default;
  const Modal = require('../src/components/Modal.jsx').default;

  // --- LIVE 1: the wholesale board switch renders crash-free ---------------
  await okAsync('LIVE1 — a wholesale switch (and a second one) renders clean', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const rt = createRoot(host);
    const mk = (n, tag) => Array.from({ length: n }, (_, i) => `${tag}-${i}`);
    const render = (ids) => rt.render(
      React.createElement(MasonryGrid, {
        cardWidth: 200, gap: 20, itemIds: ids,
        renderItem: (id) => React.createElement('div', { key: id }, id),
      })
    );
    render(mk(6, 'alpha'));
    await sleep(120);
    render(mk(6, 'beta')); // arrivals 6 > max(3, 3) — the turnover that used to die
    await sleep(120);
    render(mk(6, 'gamma')); // the "switching repeatedly" of the report
    await sleep(120);
    render(mk(7, 'gamma')); // a small delta never crashes either
    await sleep(80);
    assert.equal(errors.length, 0, 'the board still dies at the turnover: ' + (errors[0] || '').slice(0, 160));
    rt.unmount();
    host.remove();
  });

  // --- LIVE 2: the panel speaks the card swap -------------------------------
  const dbPayload = createSafeDb(null);
  dbPayload.settings.tosAcceptance = { version: TOS_VERSION, at: 1 };
  dbPayload.characters.push(
    { id: 'char-a', name: 'alpha', classId: 'root', createdAt: 1, versions: [{ id: 'va', label: 'V1', images: [], parts: [] }], stamps: [] },
    { id: 'char-b', name: 'beta', classId: 'root', createdAt: 2, versions: [{ id: 'vb', label: 'V1', images: [], parts: [] }], stamps: [] }
  );
  window.api = {
    loadDB: async () => ({ db: dbPayload, imagesPath: '/mock/images' }),
    saveDB: async () => ({ ok: true }), sendUnsavedState: () => {}, onPromptUnsaved: () => () => {},
    saveAndClose: async () => ({ ok: true }), forceClose: () => {}, windowControl: () => {},
    onWindowMaximized: () => () => {}, onWindowUnmaximized: () => () => {}, openExternal: () => {},
    clipboardReadText: async () => '', clipboardWriteText: async () => {}, importImagesFromFiles: async () => [],
    saveImageBuffer: async () => ({ ok: true, file: 'x.png' }), deleteImageFile: async () => ({ ok: true }),
  };
  localStorage.setItem('gd:last-run-version', '1.9.19');
  await okAsync('LIVE2 — switching cards on the live panel lands the swap class, warm tree intact', async () => {
    const rt = createRoot(document.getElementById('root'));
    rt.render(React.createElement(App));
    await sleep(3400);
    const cardByName = (n) => [...document.querySelectorAll('.gd-card')].find((c) => (c.textContent || '').includes(n));
    const charview = () => document.querySelector('[data-gd-region="charview"]');
    click(cardByName('alpha'));
    await sleep(400);
    const panelNode = charview();
    assert.ok(panelNode, 'the panel never opened');
    assert.ok(!panelNode.classList.contains('gd-cv-swap'), 'the first mount must stay silent');
    click(cardByName('beta'));
    await sleep(60);
    const after = charview();
    assert.ok(after === panelNode, 'the panel remounted to speak (the retained seat must stay warm)');
    assert.ok((after.textContent || '').includes('beta'), 'the panel never switched to the new card');
    assert.ok(after.classList.contains('gd-cv-swap'), 'the swap class never landed (the switch is still a silent teleport)');
    rt.unmount();
  });

  // --- LIVE 3: the ask's own farewell ---------------------------------------
  await okAsync('LIVE3 — the ask exits with a flight (KEEP EDITING keeps the window)', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const rt = createRoot(host);
    let closed = false;
    rt.render(
      React.createElement(Modal, {
        title: 'DRAFT WINDOW',
        confirmClose: { message: 'A draft rides this window.' },
        onClose: () => { closed = true; },
        footer: React.createElement('button', { className: 'gd-btn', onClick: () => { closed = true; } }, 'CANCEL'),
      }, React.createElement('p', null, 'the body'))
    );
    await sleep(250);
    const x = [...document.querySelectorAll('.gd-icon-btn')].pop();
    assert.ok(x, 'the close key is missing');
    click(x);
    await sleep(120);
    const ask = [...document.querySelectorAll('.gd-modal-ask')].pop();
    assert.ok(ask, 'the ask never appeared');
    const keep = [...ask.querySelectorAll('button')].find((b) => /KEEP EDITING/i.test(b.textContent || ''));
    click(keep);
    const askAlive = () => [...document.querySelectorAll('.gd-modal-ask')].some((m) => /UNSAVED CHANGES/i.test(m.textContent || ''));
    assert.ok(askAlive(), 'the ask left in a single frame (no exit flight)');
    await sleep(40);
    assert.ok(askAlive(), 'the ask\u2019s exit flight died inside its first frames');
    await sleep(300);
    assert.ok(!askAlive(), 'the ask\u2019s exit flight never finished');
    assert.ok(!closed, 'KEEP EDITING closed the window (it must keep it)');
    assert.ok([...document.querySelectorAll('.gd-modal-card')].some((c) => /DRAFT WINDOW/.test(c.textContent || '')), 'the window beneath did not survive the ask');
    rt.unmount();
    host.remove();
  });

  console.log(errors.length ? `\n  render errors: ${errors.slice(0, 2).join(' | ').slice(0, 300)}` : '');
  if (errors.length) failed += 1;
} else {
  console.log('  (jsdom unavailable — live passes skipped)');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
