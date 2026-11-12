// 1.6.7 batch — The Picture Alone Breathes.
// (Named 171 in the sequence: 159 -> 1.4.9, 160 -> 1.5.4, 161 -> 1.5.5,
//  162 -> 1.5.6, 163 -> 1.5.7, 164 -> 1.5.8, 165 -> 1.5.9, 166 -> 1.6.0,
//  167 -> 1.6.2, 168 -> 1.6.3, 169 -> 1.6.4, 170 -> 1.6.5.)
// The reported items, each pinned at its root law:
//   A.  THE DRAG'S HONEST COMMIT (the stillness guard + the preview commit)
//   B.  THE PICTURE ALONE BREATHES (the stage's named seat; every other
//       seat retired)
//   C.  THE NOTES JOIN THE PARTS' LAW (the big editor + the corner chip +
//       the color window + the notesColor record)
//   D.  THE TITLE EDITS + THE WELL STRETCHES (the window's RichInput; the
//       part column's flex law)
//   E.  THE FOLD'S TRAVELING CHIP (one chip, two seats, the turning glyph)
//   F.  THE COATS (auric rises; the numeix X's; the holo entry side; the
//       prism's stars + particles)
//   G.  THE SLOT'S HOVER + THE SHINE DIALS (the dropslot law; the settings
//       family's every lane)
// Plus the version furniture and live passes (the notes' windows through
// the real panel; the shine dials through a real boot; the stillness guard
// through a real drag).

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
assert.ok = (cond, msg) => {
  if (!cond) throw new Error(msg || 'assertion failed');
};
assert.match = (text, re, msg) => {
  if (!re.test(String(text))) throw new Error(msg || `expected ${re} in the text`);
};

const gridSrc = src('src/components/GridView.jsx');
const cvSrc = src('src/components/CharacterView.jsx');
const stageSrc = src('src/components/ImageStage.jsx');
const partSrc = src('src/components/PartEditor.jsx');
const cssSrc = src('src/index.css');
const constSrc = src('src/constants/index.js');
const helpersSrc = src('src/utils/helpers.js');
const appSrc = src('src/App.jsx');
const setSrc = src('src/components/SettingsModal.jsx');
const ribbonSrc = src('src/components/TagRibbon.jsx');
const pkgSrc = src('package.json');
const lockSrc = src('package-lock.json');
const readmeSrc = src('README.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const changeSrc = src('CHANGELOG.md');

// ---------------------------------------------------------------------------
// A. THE DRAG'S HONEST COMMIT
// ---------------------------------------------------------------------------
ok('A1 — the still pointer has a memory (the layout-shift echoes never re-arm)', () => {
  assert.match(gridSrc, /const dragPtRef = useRef\(null\); \/\/ \{ x, y \} — last processed dragover seat/, 'the memory seat is missing');
  assert.match(gridSrc, /if \(last && Math\.abs\(last\.x - px\) < 0\.5 && Math\.abs\(last\.y - py\) < 0\.5\) \{\s*\n\s*return;\s*\n\s*\}/, 'the echo skip is missing');
  assert.match(gridSrc, /dragPtRef\.current = \{ x: px, y: py \};/, 'the memory never wrote');
  assert.match(gridSrc, /THE STILL POINTER'S GUARD/, 'the law never spoke its name');
  // the drag's own ends reset the memory
  assert.match(gridSrc, /const startCardDrag = \(e, id\) => \{\s*\n\s*dragRef\.current = \{ type: 'card', id \};[\s\S]*?dragPtRef\.current = null;/, 'the dragstart never reset the memory');
  assert.match(gridSrc, /dragRef\.current = null;\s*\n\s*dragPtRef\.current = null;\s*\n\s*setDropHint\(null\);/, 'the dragend belt never reset the memory');
});
ok('A2 — the commit is the preview, full stop', () => {
  assert.match(gridSrc, /THE COMMIT IS THE PREVIEW, FULL STOP/, 'the law never spoke its name');
  // 1.6.8 — the commit grew the SEAT MEMORY (the no-preview drag's own
  // lane); the preview law itself is unchanged.
  // 1.6.9 — the fresh-seat drop: the arm-point clears with the seat and a
  // traveling release re-derives the seat from the card it landed on.
  assert.match(
    gridSrc,
    /const preview = dragPreviewRef\.current;[\s\S]*?dragPreviewRef\.current = null;\s*\n\s*armPtRef\.current = null;\s*\n\s*setDragPreview\(null\);\s*\n\s*dragRef\.current = null;\s*\n\s*dropSeatRef\.current = null;\s*\n\s*if \(seat && seat\.over != null && seat\.over !== drag\.id\) \{\s*\n\s*onReorder\(drag\.id, seat\.over, seat\.side\);/,
    'the preview commit is missing'
  );
  // the hint-derived neighbor commit is GONE (the side never defaults to left)
  assert.ok(!/onReorder\(drag\.id, id, hint\?\.side === 'right' \? 'right' : 'left'\);/.test(gridSrc), 'the hint-derived commit survived');
  assert.ok(!/const hint = dropHint\?\.id === id \? dropHint : null;/.test(gridSrc), 'the hint read survived the commit');
});
ok('A3 — the leave reads the event (an echo keeps the hint, a true exit retires it)', () => {
  assert.match(gridSrc, /const leaveCard = \(e, id\) => \{/, 'the leave never took the event');
  assert.match(gridSrc, /THE STILL POINTER'S LEAVE IS AN ECHO, NOT AN EXIT/, 'the law never spoke its name');
  assert.match(gridSrc, /onCardDragLeave\(e, character\.id\);/, 'the event never threaded');
});

// ---------------------------------------------------------------------------
// B. THE PICTURE ALONE BREATHES
// ---------------------------------------------------------------------------
ok('B1 — the stage carries the pictures\' own named seat', () => {
  assert.match(stageSrc, /className="gd-stage-pictures"/, 'the named wrapper never mounted');
  assert.match(cssSrc, /\.gd-stage-pictures \{\s*\n\s*position: absolute;\s*\n\s*inset: 0;/, 'the wrapper law is missing');
  // 1.6.8 — the seat list grew from the picture alone to the content
  // family (see the 172 battery); the picture keeps its seat in the group.
  assert.match(cssSrc, /\.gd-cv-swap \.gd-cardcol \.gd-stage-pictures,/, 'the fade seat is missing');
  assert.match(cssSrc, /THE CONTENT SPEAKS, THE FURNITURE HOLDS/, 'the law never spoke its name');
});
ok('B2 — every other seat is retired (buttons, labels, tags, stamps, text, versions all stay solid)', () => {
  assert.ok(!/\.gd-cv-swap > \*:not\(\.gd-char-head\)/.test(cssSrc), 'the scroller seat survived');
  assert.ok(!/\.gd-cv-swap \.gd-char-head > \*:not\(\.gd-rows-tray\)/.test(cssSrc), 'the header seat survived');
  assert.ok(!/\.gd-cv-swap \.gd-rows-body > \*/.test(cssSrc), 'the rows seat survived');
  assert.ok(!/\.gd-cv-swap \.gd-rows-tray > \.gd-rows-sep\.is-holder/.test(cssSrc), 'the holder seat survived');
  assert.ok(!/\.gd-cv-swap \.gd-cv-body \.gd-card > \*/.test(cssSrc), 'the body-cards seat survived');
  const stills = cssSrc.match(/\.gd-reduced-motion \.gd-cv-swap \.gd-cardcol \.gd-stage-pictures[^;]*;/)?.[0] || '';
  assert.ok(stills.includes('animation: none'), 'the reduced-motion still lost the seat');
});

// ---------------------------------------------------------------------------
// C. THE NOTES JOIN THE PARTS' LAW
// ---------------------------------------------------------------------------
ok('C1 — the notes\' window is the big EDITOR (live edits, the stage, the feet)', () => {
  assert.match(cvSrc, /function NotesEditorWindow\(/, 'the editor never mounted');
  assert.match(cvSrc, /title="NOTES EDITOR"/, 'the window never named itself');
  // 1.6.8 — the stage wears the container's color now (clsx).
  assert.match(cvSrc, /'gd-input gd-notes-stage',/, 'the stage never seated');
  assert.match(cvSrc, /onChange=\{\(e\) => onSetNotes\(e\.target\.value\)\}/, 'the live-edit lane is missing');
  assert.match(cvSrc, /edits land live/, 'the live-edit law never spoke');
  assert.match(cssSrc, /\.gd-prompt-stage,\s*\n\.gd-notes-stage \{/, 'the shared stage law is missing');
  assert.ok(!/function NotesReaderWindow\(/.test(cvSrc), 'the read-only reader survived');
});
ok('C2 — the notes\' container speaks the parts\' law (the box + the chip + the color window + the record)', () => {
  assert.match(cvSrc, /'gd-part-row gd-notes-box',\s*\n\s*version\.notesColor && 'is-colored',/, 'the box never joined the container law');
  assert.match(cvSrc, /function NotesColorWindow\(/, 'the color window never mounted');
  assert.match(cvSrc, /title="NOTES COLOR"/, 'the color window never named itself');
  assert.match(cvSrc, /const setNotesColor = useCallback\(/, 'the color patch road is missing');
  assert.match(constSrc, /notesColor: isHexColor\(overrides\.notesColor\) \? overrides\.notesColor : null,/, 'makeVersion never carried the seat');
  assert.match(helpersSrc, /notesColor: isHexColor\(version\?\.notesColor\) \? version\.notesColor : null,/, 'sanitizeVersion never carried the seat');
});

// ---------------------------------------------------------------------------
// D. THE TITLE EDITS + THE WELL STRETCHES
// ---------------------------------------------------------------------------
ok('D1 — the prompt\'s title is editable in the expanded window', () => {
  assert.match(partSrc, /THE TITLE IS EDITABLE HERE TOO/, 'the law never spoke its name');
  assert.match(partSrc, /className="gd-notes-title font-bold text-\[13px\] w-full min-w-0"\s*\n\s*value=\{part\.name\}/, 'the editable title never seated');
  assert.match(partSrc, /onPatch\(part\.id, \{ name: v \}\)/, 'the title live-edit lane is missing');
  assert.ok(!/\{\/\* 1\.6\.5 \*\/ const name = stripRichText\(part\.name \|\| 'Part'\);/.test(partSrc), 'a static name survived');
});
ok('D2 — the well stretches to the row\'s bottom (and never gets any smaller)', () => {
  assert.match(partSrc, /<div className="gd-part-main flex-1 min-w-0">/, 'the named column never mounted');
  assert.match(cssSrc, /\.gd-part-main \{\s*\n\s*display: flex;\s*\n\s*flex-direction: column;/, 'the column law is missing');
  // 1.7.8 supersede — THE WELL'S CLIPPING SHELL ("the note/prompt
  // scrollbar/well are clipping outside of the container"): the stretch
  // law moved one level down — the SHELL is the flex child of the row's
  // main column now, and the field inside it carries the grip + floor.
  assert.match(cssSrc, /\.gd-part-main \.gd-well-shell \{\s*\n\s*flex: 1 0 auto;\s*\n\s*min-height: 4\.6em;/, 'the shell stretch is missing');
  assert.match(cssSrc, /\.gd-well-shell \.gd-prompt-box \{\s*\n\s*flex: 1 0 auto;\s*\n\s*resize: vertical;/, 'the well stretch is missing');
  assert.match(cssSrc, /THE WELL STRETCHES TO THE ROW'S BOTTOM/, 'the law never spoke its name');
});

// ---------------------------------------------------------------------------
// E. THE FOLD'S TRAVELING CHIP
// ---------------------------------------------------------------------------
ok('E1 — one chip travels between the two seats (the fold carries it)', () => {
  assert.match(cvSrc, /className="gd-rows-chipline"/, 'the chipline never mounted');
  assert.match(cvSrc, /autoCollapsed \? 'TAGS & STAMPS' : 'COLLAPSE'/, 'the one chip never spoke both states');
  assert.match(cvSrc, /autoCollapsed && 'rotate-180'/, 'the glyph never turns');
  assert.match(cvSrc, /autoCollapsed \? expandRows : \(\) => setAutoCollapsed\(true\)/, 'the one chip never answered both directions');
  assert.match(cssSrc, /\.gd-rows-chipline \{[\s\S]*?min-height: 20px;/, 'the chipline law is missing');
  assert.match(cssSrc, /\.gd-rows-tray\.gd-rows-folded \.gd-rows-chipline::before \{\s*\n\s*opacity: 1;/, 'the folded hairline never spoke');
  assert.ok(!/gd-rows-keyline/.test(cvSrc), 'the retired keyline survived in the view');
  assert.ok(!/gd-rows-sep is-holder/.test(cvSrc), 'the retired holder survived in the view');
  assert.ok(!/\.gd-rows-keyline \{/.test(cssSrc), 'the retired keyline law survived');
  assert.match(cssSrc, /THE FOLD'S TRAVELING CHIP/, 'the law never spoke its name');
});

// ---------------------------------------------------------------------------
// F. THE COATS
// ---------------------------------------------------------------------------
ok('F1 — the auric coat rises (leaf + polish, bottom to top)', () => {
  assert.match(cssSrc, /@keyframes gd-auric-rise-a \{[\s\S]*?translate\(0, -360px\)/, 'the first loom never rose');
  assert.match(cssSrc, /@keyframes gd-auric-rise-b \{[\s\S]*?translate\(0, -360px\)/, 'the second loom never rose');
  assert.match(cssSrc, /\.gd-auric-flakes::before \{\s*\n\s*content: '';\s*\n\s*position: absolute;\s*\n\s*inset: 0 -8px -360px -8px;/, 'the rise never fed from below');
  assert.ok(!/gd-auric-fall-a/.test(cssSrc), 'the falling keyframes survived');
  assert.match(cssSrc, /@keyframes gd-auric-sweep \{[\s\S]*?translateY\(75%\)[\s\S]*?translateY\(-75%\)/, 'the polish never traveled bottom-to-top');
  assert.match(cssSrc, /\.gd-auric-sweep::before \{\s*\n\s*content: '';\s*\n\s*position: absolute;\s*\n\s*left: -18%;\s*\n\s*right: -18%;\s*\n\s*top: -45%;\s*\n\s*bottom: -45%;/, 'the sweep seat never fed the vertical road');
});
ok('F2 — the numeix X\'s are TRUE rotated-plus marks (1.9.3)', () => {
  // 1.9.3 — the glyph moved on BY THE REPORT'S OWN WORDS ("the x's ...
  // should be actual xs ... like rotated '+' ... semi thick stroked"):
  // the 1.6.7 calligraphy retired; the true X speaks. (The 1.6.8 CENTER
  // BREATHES prose keeps its historical seat below.)
  assert.match(cssSrc, /THE CENTER BREATHES/, 'the law never spoke its name');
  const before = cssSrc.match(/\.gd-numeix-xmarks::before \{[\s\S]*?\n\}/)?.[0] || '';
  // straight crossing diagonals, FLAT butt caps (1.9.5 — the round
  // pebble tips retired with "xs ... should not be round edged"), not one
  // Q curve anywhere
  assert.ok(/M20 36 L38 54 M20 54 L38 36/.test(before), 'the true X never arrived');
  assert.ok(!/Q\d+\.\d+ \d+\.\d/.test(before), 'a calligraphic curve survived the retirement');
  assert.ok(before.includes("stroke-linecap='butt'"), 'the flat caps never spoke (1.9.13)');
  // the fall clocks keep their seats (the glyph alone was redesigned)
  assert.match(cssSrc, /gd-numeix-fall-a 20s linear infinite/, 'the fall clock drifted');
  assert.match(cssSrc, /gd-numeix-fall-b 26s linear infinite/, 'the second fall clock drifted');
});
ok('F3 — the holographic lattice feeds its ENTRY side', () => {
  assert.match(cssSrc, /\.gd-finish-holographic::before \{\s*\n\s*content: '';\s*\n\s*position: absolute;\s*\n\s*inset: -128px 0 0 -128px;/, 'the entry-side overhang is missing');
  assert.match(cssSrc, /THE LATTICE'S ENTRY SIDE IS FED/, 'the law never spoke its name');
  assert.ok(!/inset: 0 0 -128px -128px;/.test(cssSrc), 'the exit-side overhang survived');
});
ok('F4 — the prismatic stars drift and the particles arrive', () => {
  assert.match(ribbonSrc, /\{seat\('gd-prism-stars'\)\}/, 'the star seat never mounted');
  assert.match(ribbonSrc, /\{seat\('gd-prism-particles'\)\}/, 'the particle seat never mounted');
  assert.match(cssSrc, /\.gd-prism-stars::before \{[\s\S]*?inset: -96px 0 0 -96px;/, 'the star lattice seat is missing');
  assert.match(cssSrc, /gd-prism-stars-se 26s linear infinite/, 'the star drift clock is missing');
  assert.match(cssSrc, /\.gd-prism-particles::before \{[\s\S]*?inset: 0 0 0 -72px;/, 'the particle seat is missing');
  assert.match(cssSrc, /gd-prism-particles-e 8\.5s linear infinite/, 'the particle drift clock is missing');
  // the body's static star tile is gone (the ground moves now)
  const body = cssSrc.match(/\.gd-finish-prismatic \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(!body.includes("width='96' height='96'"), 'the frozen star tile survived on the body');
  assert.match(cssSrc, /THE CRYSTAL RETURNS, MOVING/, 'the star law never spoke its name');
  assert.match(cssSrc, /THE PARTICLES \(/, 'the particle law never spoke its name');
});

// ---------------------------------------------------------------------------
// G. THE SLOT'S HOVER + THE SHINE DIALS
// ---------------------------------------------------------------------------
ok('G1 — the drop slot speaks its own hover (interior + outline, no layout shift)', () => {
  assert.match(stageSrc, /className="gd-stage-dropslot/, 'the named slot never mounted');
  assert.match(cssSrc, /\.gd-stage-dropslot \{[\s\S]*?border-color: var\(--gd-line\);/, 'the resting law is missing');
  assert.match(cssSrc, /\.gd-stage-dropslot:hover \{[\s\S]*?background: color-mix\(in srgb, var\(--gd-panel-text\) 7%, transparent\);/, 'the interior highlight is missing');
  assert.match(cssSrc, /\.gd-stage-dropslot:hover \{[\s\S]*?box-shadow: inset 0 0 0 1px color-mix\(in srgb, var\(--gd-panel-text\) 26%, transparent\);/, 'the thickened outline is missing');
  assert.ok(!/border-width: 3px/.test(cssSrc.match(/\.gd-stage-dropslot[^{]*\{[\s\S]*?\n\}/g)?.join('') || ''), 'a border-width change survived (the slot must never reflow)');
  assert.match(cssSrc, /THE DROP \/ BROWSE SLOT'S OWN HOVER/, 'the law never spoke its name');
});
ok("G2 — the shine family's settings land in every lane", () => {
  assert.match(constSrc, /shineOn: true,/, 'the master default is missing');
  assert.match(constSrc, /shineOverTrims: true,/, 'the trims default is missing');
  assert.match(constSrc, /shineMode: 'sweep',/, 'the style default is missing');
  assert.match(helpersSrc, /rawSettings\.shineMode === 'pulse' \? 'pulse' : DEFAULT_SETTINGS\.shineMode/, 'the sanitize lane is missing');
  assert.match(appSrc, /classList\.toggle\('gd-no-shine', db\.settings\.shineOn === false\)/, 'the master lane is missing');
  assert.match(appSrc, /classList\.toggle\('gd-shine-under-trims', db\.settings\.shineOverTrims === false\)/, 'the trims lane is missing');
  assert.match(appSrc, /document\.documentElement\.dataset\.gdShineMode = db\.settings\.shineMode;/, 'the style lane is missing');
  assert.match(setSrc, /title="CARD SHINE"/, 'the settings row is missing');
  assert.match(setSrc, /title="SHINE OVER TRIMS"/, 'the trims row is missing');
  assert.match(setSrc, /title="SHINE STYLE"/, 'the style row is missing');
  assert.match(setSrc, /\{ id: 'pulse', label: 'Pulse'/, 'the PULSE seat is missing');
  // 1.6.8 — the GLINT seat left the ladder ("remove glint from shine style").
});
ok("G3 — the shine's CSS speaks the two voices + the retire listener knows them (1.6.8: glint left)", () => {
  assert.match(cssSrc, /:root\.gd-no-shine \.gd-card-shine \{\s*\n\s*display: none;/, 'the master still is missing');
  assert.match(cssSrc, /:root\.gd-shine-under-trims \.gd-card-shine \{\s*\n\s*z-index: 2;/, 'the trims rung is missing');
  assert.match(cssSrc, /:root\[data-gd-shine-mode='pulse'\] \.gd-card-shine\.is-live::before,[\s\S]*?animation: gd-shine-pulse 0\.5s ease-in-out 1 forwards;/, 'the pulse voice is missing');
  assert.ok(!/:root\[data-gd-shine-mode='glint'\]/.test(cssSrc), 'the glint voice survived');
  assert.match(cssSrc, /@keyframes gd-shine-pulse \{/, 'the pulse keyframes are missing');
  assert.ok(!/@keyframes gd-shine-glint \{/.test(cssSrc), 'the glint keyframes survived');
  assert.match(gridSrc, /e\.animationName !== 'gd-shine-sweep' && e\.animationName !== 'gd-shine-pulse'[^\n]*\{/, 'the retire listener lost its gate');
  assert.ok(!/gd-shine-glint/.test(gridSrc), 'the listener still knows the retired name');
});

// ---------------------------------------------------------------------------
// P1. THE VERSION FURNITURE
// ---------------------------------------------------------------------------
ok('P1 — the version is 1.6.8 everywhere', () => {
  assert.match(pkgSrc, /"version": "1\.9\.19"/, 'package.json never moved');
  assert.match(lockSrc, /"version": "1\.9\.19"/, 'the lock root never moved');
  assert.match(constSrc, /version: '1\.9\.19',/, 'APP.version never moved');
  assert.match(readmeSrc, /\*\*v1\.9\.19\*\*/, 'the README header never moved');
  assert.match(readmeSrc, /the regression battery \(93 DOM\/source test suites\)/, 'the README battery count never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(webSrc, /<span class="ver">v1\.8\.6<\/span>/, 'the website current card never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(webSrc, /releases\/download\/v1\.8\.6\/Burrito%20GenDex-1\.8\.6%20Setup\.exe/, 'the website installer URL never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(webSrc, /Burrito_GenDex_1\.8\.6_source\.zip/, 'the website source URL never moved');
  assert.match(changeSrc, /^## 1\.9\.19 — The Ends Trade Places/, 'the changelog head never landed');
});

// ---------------------------------------------------------------------------
let dom = null;
try {
  const { JSDOM } = await import('jsdom');
  dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
  });
} catch {
  dom = null;
}

if (dom) {
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

  const req = (await import('node:module')).createRequire(import.meta.url);
  const reactReq = req('react');
  const React = reactReq.default || reactReq;
  const { createRoot } = req('react-dom/client');
  const babel = req('@babel/core');
  req.extensions['.jsx'] = (module, filename) => {
    const { code } = babel.transformFileSync(filename, {
      presets: [['@babel/preset-env', { targets: { node: 'current' } }], ['@babel/preset-react', { runtime: 'automatic' }]],
    });
    module._compile(code, filename);
  };
  for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff2']) {
    req.extensions[ext] = (module, filename) => { module.exports = filename; };
  }
  const { createSafeDb } = req('../src/utils/helpers.js');
  const { TOS_VERSION } = await import('../src/constants/legal.js');

  const errors = [];
  console.error = (...args) => {
    const t = args.map((a) => (a && a.stack ? a.stack : String(a))).join(' ');
    if (/Warning|act\(|deprecated|Not implemented/i.test(t)) return;
    errors.push(t);
  };
  dom.window.addEventListener('error', (e) => errors.push(String(e.error?.stack || e.message)));

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  const App = req('../src/App.jsx').default;
  const mockApi = () => {
    g.window.api = {
      loadDB: async () => ({ db, imagesPath: '/mock/images' }),
      saveDB: async () => ({ ok: true }), sendUnsavedState: () => {}, onPromptUnsaved: () => () => {},
      saveAndClose: async () => ({ ok: true }), forceClose: () => {}, windowControl: () => {},
      clipboardReadText: async () => '', clipboardWriteText: async () => {}, importImagesFromFiles: async () => [],
      saveImageBuffer: async () => ({ ok: true, file: 'x.png' }), deleteImageFile: async () => ({ ok: true }),
      onWindowMaximized: () => () => {}, onWindowUnmaximized: () => () => {}, openExternal: () => {},
    };
  };
  let db = null;

  // --- LIVE 1: the notes' editor + color window through the real panel -----
  await okAsync('LIVE1 — the notes expand opens the big editor; the chip opens the color window (live picks)', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const rt = createRoot(host);
    try {
      db = createSafeDb(null);
      db.settings.tosAcceptance = { version: TOS_VERSION, at: 1 };
      db.settings.detailPanel = true;
      db.characters.push({
        id: 'char-n', name: 'notey', classId: 'root', createdAt: 1,
        versions: [{ id: 'vn', label: 'V1', images: [], notes: 'a quiet note', parts: [] }],
        stamps: [],
      });
      mockApi();
      localStorage.setItem('gd:last-run-version', '1.9.19');
      rt.render(React.createElement(App));
      await sleep(3400);
      const card = [...document.querySelectorAll('.gd-card')].find((c) => (c.textContent || '').includes('notey'));
      assert.ok(card, 'the card never mounted');
      click(card);
      await sleep(400);
      const notesTab = [...document.querySelectorAll('button')].find((b) => /^NOTES$/i.test((b.textContent || '').trim()));
      assert.ok(notesTab, 'the NOTES tab never mounted');
      click(notesTab);
      await sleep(160);
      // the box speaks the parts' container law
      const box = document.querySelector('.gd-notes-box');
      assert.ok(box, "the notes box never joined the parts' container law");
      assert.ok(box.querySelector('.gd-part-color-chip'), 'the corner chip never mounted');
      // the expand key opens the big EDITOR
      const expandKey = [...document.querySelectorAll('button')].find((b) => /big editor window/i.test(b.title || ''));
      assert.ok(expandKey, 'the expand key never mounted');
      click(expandKey);
      await sleep(220);
      const stage = document.querySelector('.gd-notes-stage');
      assert.ok(stage, 'the big editor never opened');
      assert.equal(stage.value, 'a quiet note', 'the stage never carried the note');
      // a LIVE EDIT lands in the row's own well
      const rowWell = box.querySelector('textarea');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(stage, 'a quiet note — edited live');
      stage.dispatchEvent(new window.Event('input', { bubbles: true }));
      await sleep(300);
      assert.ok((rowWell.value || '').includes('edited live'), 'the live edit never landed in the row');
      const done = [...document.querySelectorAll('button')].find((b) => /^DONE$/i.test((b.textContent || '').trim()));
      assert.ok(done, "the window's DONE foot never mounted");
      click(done);
      await sleep(200);
      assert.ok(!document.querySelector('.gd-notes-stage'), 'the editor never closed');
      // the chip opens the COLOR WINDOW; a preset pick colors the box live
      const chip = box.querySelector('.gd-part-color-chip');
      click(chip);
      await sleep(220);
      const colorWin = [...document.querySelectorAll('.gd-modal-card')].find((m) => /NOTES COLOR/i.test(m.textContent || ''));
      assert.ok(colorWin, 'the notes color window never opened');
      const preset = colorWin.querySelector('.gd-cls-preset');
      assert.ok(preset, 'the preset ladder never mounted');
      click(preset);
      await sleep(260);
      assert.ok(box.classList.contains('is-colored'), 'the live pick never colored the box');
      assert.ok(box.hasAttribute('data-part-color'), 'the box never spoke its hex');
      const done2 = [...document.querySelectorAll('.gd-modal-card')].flatMap((m) => [...m.querySelectorAll('button')]).find((b) => /^DONE$/i.test((b.textContent || '').trim()));
      click(done2);
      await sleep(200);
      assert.ok(![...document.querySelectorAll('.gd-modal-card')].some((m) => /NOTES COLOR/i.test(m.textContent || '')), 'the color window never closed');
    } finally {
      rt.unmount();
      host.remove();
    }
  });

  // --- LIVE 2: the shine dials through a real boot -------------------------
  await okAsync('LIVE2 — the shine dials ride the root (the master, the trims, the style)', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const rt = createRoot(host);
    try {
      db = createSafeDb({ settings: { shineOn: false, shineOverTrims: false, shineMode: 'pulse' } });
      db.settings.tosAcceptance = { version: TOS_VERSION, at: 1 };
      db.characters.push({ id: 'char-s', name: 'shiny', classId: 'root', createdAt: 1, versions: [{ id: 'vs', label: 'V1', images: [], parts: [] }], stamps: [] });
      mockApi();
      localStorage.setItem('gd:last-run-version', '1.9.19');
      rt.render(React.createElement(App));
      await sleep(3400);
      const rootEl = document.documentElement;
      assert.ok(rootEl.classList.contains('gd-no-shine'), 'the master switch never stilled the layer');
      assert.ok(rootEl.classList.contains('gd-shine-under-trims'), 'the trims toggle never demoted the rung');
      assert.equal(rootEl.dataset.gdShineMode, 'pulse', 'the style dial never spoke');
      rt.unmount();
      host.remove();

      // the second boot: a stored GLINT walks onto SWEEP at load (1.6.8 —
      // "remove glint from shine style": the retired seat reads as nothing,
      // the classic band speaking instead), and the defaults arm no classes
      const host2 = document.createElement('div');
      document.body.appendChild(host2);
      const rt2 = createRoot(host2);
      try {
        db = createSafeDb({ settings: { shineMode: 'glint' } });
        db.settings.tosAcceptance = { version: TOS_VERSION, at: 1 };
        db.characters.push({ id: 'char-g', name: 'glinty', classId: 'root', createdAt: 1, versions: [{ id: 'vg', label: 'V1', images: [], parts: [] }], stamps: [] });
        mockApi();
        localStorage.setItem('gd:last-run-version', '1.9.19');
        rt2.render(React.createElement(App));
        await sleep(3400);
        const rootEl2 = document.documentElement;
        assert.ok(!rootEl2.classList.contains('gd-no-shine'), 'the default master still wrongly armed');
        assert.ok(!rootEl2.classList.contains('gd-shine-under-trims'), 'the default trims wrongly demoted');
        assert.ok(!rootEl2.dataset.gdShineMode, 'the retired glint seat still spoke from the root');
      } finally {
        rt2.unmount();
        host2.remove();
      }
    } finally {
      rt.unmount();
      host.remove();
    }
  });

  // --- LIVE 3: the stillness guard through a real drag ---------------------
  await okAsync('LIVE3 — a layout-shift echo never re-arms the preview; a true move does; the drop commits it', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const rt = createRoot(host);
    try {
      db = createSafeDb(null);
      db.settings.tosAcceptance = { version: TOS_VERSION, at: 1 };
      // 1.9.12 — the default rests OFF now; the fixture speaks the ON road
      // (these suites pin the live-preview feature, not the default)
      db.settings.liveDragPreview = true;
      for (const n of ['aaa', 'bbb', 'ccc']) {
        db.characters.push({ id: 'char-' + n, name: n, classId: 'root', createdAt: 1, versions: [{ id: 'v' + n, label: 'V1', images: [], parts: [] }], stamps: [] });
      }
      mockApi();
      localStorage.setItem('gd:last-run-version', '1.9.19');
      rt.render(React.createElement(App));
      await sleep(3400);
      const cardOf = (n) => [...document.querySelectorAll('[data-gd-char-id]')].find((d) => d.getAttribute('data-gd-char-id') === 'char-' + n);
      const order = () => [...document.querySelectorAll('[data-gd-char-id]')].map((d) => d.getAttribute('data-gd-char-id').replace('char-', ''));
      const aaa = cardOf('aaa');
      const bbb = cardOf('bbb');
      const ccc = cardOf('ccc');
      assert.ok(aaa && bbb && ccc, 'the cards never mounted');
      assert.equal(order().join(','), 'aaa,bbb,ccc', 'the base order is wrong');
      const dt = { effectAllowed: '', setData: () => {}, setDragImage: () => {} };
      const startEv = new dom.window.MouseEvent('dragstart', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 });
      Object.defineProperty(startEv, 'dataTransfer', { value: dt });
      Object.defineProperty(aaa, 'getBoundingClientRect', { value: () => ({ width: 236, height: 340, left: 10, top: 10, right: 246, bottom: 350 }) });
      Object.defineProperty(bbb, 'getBoundingClientRect', { value: () => ({ width: 236, height: 340, left: 10, top: 400, right: 246, bottom: 740 }) });
      Object.defineProperty(ccc, 'getBoundingClientRect', { value: () => ({ width: 236, height: 340, left: 10, top: 700, right: 246, bottom: 1040 }) });
      aaa.dispatchEvent(startEv);
      await sleep(40);
      // arm the preview over ccc (right half)
      const overEv = new dom.window.MouseEvent('dragover', { bubbles: true, cancelable: true, clientX: 200, clientY: 900 });
      Object.defineProperty(overEv, 'dataTransfer', { value: dt });
      ccc.dispatchEvent(overEv);
      await sleep(140);
      assert.equal(order().join(','), 'bbb,ccc,aaa', 'the live gap never moved the pack');
      // THE ECHO: the glide moved bbb under the resting pointer — the browser
      // re-announces the hit-test AT THE SAME COORDINATES. The guard must skip
      // it: the preview holds its seat (the "change in front of my eyes").
      const echoEv = new dom.window.MouseEvent('dragover', { bubbles: true, cancelable: true, clientX: 200, clientY: 900 });
      Object.defineProperty(echoEv, 'dataTransfer', { value: dt });
      bbb.dispatchEvent(echoEv);
      await sleep(140);
      assert.equal(order().join(','), 'bbb,ccc,aaa', 'the layout-shift echo re-armed the preview (the hold-still change)');
      // A TRUE MOVE: the pointer travels to bbb's right half — the preview
      // honestly re-arms.
      const moveEv = new dom.window.MouseEvent('dragover', { bubbles: true, cancelable: true, clientX: 210, clientY: 640 });
      Object.defineProperty(moveEv, 'dataTransfer', { value: dt });
      bbb.dispatchEvent(moveEv);
      await sleep(140);
      assert.equal(order().join(','), 'bbb,aaa,ccc', 'the true move never re-armed the preview');
      // THE DROP (on the dragged card itself — it glides under the cursor):
      // the commit is the CURRENT preview, exactly what the board paints.
      const dropEv = new dom.window.MouseEvent('drop', { bubbles: true, cancelable: true, clientX: 210, clientY: 640 });
      Object.defineProperty(dropEv, 'dataTransfer', { value: dt });
      aaa.dispatchEvent(dropEv);
      await sleep(220);
      assert.equal(order().join(','), 'bbb,aaa,ccc', 'the drop never committed the preview (' + order().join(',') + ')');
      aaa.dispatchEvent(new dom.window.Event('dragend', { bubbles: true }));
      await sleep(200);
      assert.equal(order().join(','), 'bbb,aaa,ccc', 'the dragend belt walked the commit home (' + order().join(',') + ')');
    } finally {
      rt.unmount();
      host.remove();
    }
  });

  if (errors.length) {
    failed += 1;
    console.log(`  FAIL — live console stayed dirty (${errors.length})\n      ${errors[0].slice(0, 300)}`);
  } else {
    passed += 1;
    console.log('  ok — live console stayed clean');
  }
} else {
  console.log('  (jsdom absent — LIVE passes skipped)');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
