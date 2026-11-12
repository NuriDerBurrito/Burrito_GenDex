// 1.6.5 batch — The Prompt Comes Home.
// (Named 170 in the sequence: 159 -> 1.4.9, 160 -> 1.5.4, 161 -> 1.5.5,
//  162 -> 1.5.6, 163 -> 1.5.7, 164 -> 1.5.8, 165 -> 1.5.9, 166 -> 1.6.0,
//  167 -> 1.6.2, 168 -> 1.6.3, 169 -> 1.6.4.)
// The reported items, each pinned at its root law:
//   A.  THE PROMPT'S 1.5.2 VOICE, HOME (the big EDITOR window; the corner
//       chip + the COLOR WINDOW; the ONE-COLUMN keys; the 1.5.2 wash)
//   B.  THE RING SPEAKS ITS OWN GROUND (the clean lane + the ink keyline +
//       the glow; the breath swells the glow alone)
//   C.  THE HOLO GLOSS RETIRES (the late "new layer" never appears)
//   D.  THE AURIC DIAMONDS BALANCE (the flakes' centered cores + the
//       currents' equal diagonals)
//   E.  THE STILL BELONGS TO THE BIG WINDOWS (the ctx menu + the popover +
//       the panel flight retire; Modal keeps the counter)
//   F.  THE LANE VERDICT READS THE ROW FIRST (the bands, the containment,
//       the per-row gap race)
//   G.  THE DROP LANDS THE PREVIEW + THE LAG DIES (the preventDefault-first
//       same-card lane; the self-drop commit; the hint bailout)
//   H.  THE CARDS KEEP THEIR PLATES (the gd-cv-body name; the content seats)
// Plus the version furniture and live passes (the prompt's windows through
// the real panel; the self-drop commit through a real drag; the still
// through a real boot).

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

const partSrc = src('src/components/PartEditor.jsx');
const cvSrc = src('src/components/CharacterView.jsx');
const gridSrc = src('src/components/GridView.jsx');
const cssSrc = src('src/index.css');
const constSrc = src('src/constants/index.js');
const appSrc = src('src/App.jsx');
const ctxSrc = src('src/components/GdContextMenu.jsx');
const popSrc = src('src/components/Popover.jsx');
const modalSrc = src('src/components/Modal.jsx');
const thumbSrc = src('src/components/useThumbSort.js');
const pkgSrc = src('package.json');
const lockSrc = src('package-lock.json');
const readmeSrc = src('README.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const changeSrc = src('CHANGELOG.md');

// ---------------------------------------------------------------------------
// A. THE PROMPT'S 1.5.2 VOICE, HOME
// ---------------------------------------------------------------------------
ok('A1 — EXPAND opens the 1.5.2 big EDITOR window (live edits, the stage)', () => {
  assert.match(partSrc, /function PromptExpandWindow\(/, 'the big editor never mounted');
  assert.match(partSrc, /title="PROMPT EDITOR"/, 'the window never named itself');
  assert.match(partSrc, /width="w-\[720px\]"/, 'the stage window never sized itself');
  assert.match(partSrc, /'gd-input gd-prompt-stage',/, 'the stage field never seated (1.6.8: clsx + the container color)');
  assert.match(partSrc, /autoFocus/, 'the stage never took the focus');
  assert.match(partSrc, /onChange=\{\(e\) => onPatch\(part\.id, \{ content: e\.target\.value \}\)\}/, 'the live-edit lane is missing');
  assert.ok(!/<span[^>]*>[^<]*edits land live<\/span>/.test(partSrc), 'the live-edit note survived the 1.6.8 retirement');
  /* 1.6.7 — THE TITLE IS EDITABLE IN THE WINDOW TOO ("allow me to edit the
     title of the prompt in the expanded prompt window"): the subheader's
     static name span became the row's own RichInput — live renames. */
  assert.match(partSrc, /value=\{part\.name\}\s*\n\s*placeholder="Part name \(body, facial, outfit…\)"/, 'the editable title never seated (1.6.7)');
  assert.match(partSrc, /onPatch\(part\.id, \{ name: v \}\)/, 'the title live-edit lane is missing (1.6.7)');
  assert.match(cssSrc, /\.gd-prompt-stage,\s*\n\.gd-notes-stage \{\s*\n\s*height: 58vh;\s*\n\s*min-height: 320px;/, 'the stage law is missing (1.6.7: both stages speak it)');
  assert.ok(!/function PartReaderWindow\(/.test(partSrc), 'the 1.6.4 read-only reader survived');
  assert.ok(!/gd-reader-doc/.test(partSrc), "the parts' reader page survived");
});
ok('A2 — COLOR rides the row corner as the 1.5.2 chip + the COLOR WINDOW', () => {
  assert.match(partSrc, /function PartColorWindow\(/, 'the color window never mounted');
  assert.match(partSrc, /title="PART COLOR"/, 'the color window never named itself');
  assert.match(partSrc, /CLASS_COLOR_PRESETS\.map\(\(preset\) =>/, 'the preset ladder is missing');
  assert.match(partSrc, /onPatch\(part\.id, \{ color: preset \}\)/, 'the presets never land live');
  assert.match(partSrc, /onColor=\{\(hexOrNull\) => onPatch\(part\.id, \{ color: hexOrNull \}\)\}/, 'the custom lane never speaks null');
  assert.match(partSrc, /className=\{clsx\('gd-part-color-chip', !part\.color && 'is-empty'\)\}/, 'the corner chip never mounted');
  assert.match(partSrc, /style=\{part\.color \? \{ background: part\.color, borderColor: part\.color \} : undefined\}/, 'the chip fill never threaded');
  assert.match(partSrc, /aria-label=\{`Container color for \$\{stripRichText\(part\.name \|\| 'this part'\)\}`\}/, 'the chip label never spoke');
  assert.ok(!/ColorPickerPanel/.test(partSrc), 'the 1.6.4 popover pocket survived');
  assert.ok(!/Popover/.test(partSrc.replace(/import Modal from '\.\/Modal\.jsx';/, '')), 'the popover import survived');
});
ok('A3 — the keys cluster is ONE COLUMN (the 1.5.2 sort read vertically)', () => {
  // the column keeps its own gap; the five keys stack in the one lane with
  // the order trio first and the content pair beneath
  assert.match(cssSrc, /\.gd-part-keys \{\s*\n\s*display: flex;\s*\n\s*flex-direction: column;/, 'the cluster lost its column');
  const cluster = partSrc.match(/<div className="gd-part-keys">([\s\S]*?)<\/div>/)?.[0] || '';
  const titles = [...cluster.matchAll(/title="([^"]+)"/g)].map((m) => m[1]);
  const buttons = [...cluster.matchAll(/<button/g)].length;
  assert.equal(buttons, 5, 'the cluster lost a key (' + buttons + ' buttons)');
  assert.equal(titles.length, 4, 'the literal titles drifted (' + titles.length + ')');
  assert.match(titles[0] || '', /Move part up/, 'the order trio does not lead the column');
  assert.match(titles[1] || '', /Move part down/, 'the order trio does not lead the column');
  assert.match(titles[2] || '', /Delete part/, 'the order trio does not lead the column');
  assert.match(titles[3] || '', /big editor window/, 'the content pair does not ride beneath');
  assert.match(cluster, /copyContent/, 'the content pair lost its copy key');
  assert.ok(!/gd-part-key-row/.test(cssSrc + partSrc), 'the 1.5.2 two-row sort survived');
  assert.ok(!/gd-part-key-pair/.test(cssSrc + partSrc), 'the 1.5.2 pair wrapper survived');
});
ok('A4 — the row speaks the 1.5.2 WASH (the scope class + the tame tint)', () => {
  assert.match(partSrc, /part\.color && 'is-colored'/, 'the scope class never rides the row');
  assert.match(partSrc, /data-part-color=\{part\.color \|\| undefined\}/, 'the color attribute never spoke');
  assert.match(partSrc, /style=\{part\.color \? \{ \['--part-color'\]: part\.color, \.\.\.\(partContainerFace\(part\.color, part\.colorShade === 'deep'\) \|\| \{\}\) \} : undefined\}/, 'the color var never rides the row');
  // 1.7.4 supersede: the frame speaks the OUTLINE INK — the old 72% wash
  // survives as var(--part-line,'s fallback (the ladder's measured line).
  assert.match(cssSrc, /\.gd-part-row\.is-colored \{\s*\n\s*\/\* 1\.7\.4 — THE OUTLINE INK[\s\S]*?border-color: var\(--part-line, color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 72%, var\(--part-face, color-mix\(in srgb, var\(--gd-ink\) 18%, var\(--gd-panel\)\)\)\)\);/, 'the tinted frame law is missing');
  assert.match(cssSrc, /\.gd-part-row\.is-colored:hover \{/, 'the tinted hover law is missing');
  assert.match(cssSrc, /\.gd-part-row\.is-colored\.is-move-flash \{/, 'the tinted flash law is missing');
  assert.ok(!/var\(--gd-part-ink/.test(cssSrc), 'the 1.6.3/1.6.4 whole-row ink consumers survived');
});
ok('A5 — the windows ride AnimatePresence outside the row stack (the 1.5.2 law)', () => {
  assert.match(partSrc, /import \{ AnimatePresence \} from 'framer-motion';/, 'the presence import is missing');
  assert.match(partSrc, /const readerWindow = expandedPart \? \(/, 'the editor window never threaded');
  assert.match(partSrc, /const colorWindow = colorPart \? \(/, 'the color window never threaded');
  assert.match(partSrc, /<AnimatePresence>\{readerWindow\}<\/AnimatePresence>/, 'the editor never rode the presence');
  assert.match(partSrc, /<AnimatePresence>\{colorWindow\}<\/AnimatePresence>/, 'the color window never rode the presence');
  assert.match(partSrc, /expandedId, setExpandedId\] = useState\(null\);/, 'the expanded seat never threaded');
  assert.match(partSrc, /colorId, setColorId\] = useState\(null\);/, 'the color seat never threaded');
});

// ---------------------------------------------------------------------------
// B. THE RING SPEAKS ITS OWN GROUND
// ---------------------------------------------------------------------------
ok('B1 — the ring carries the clean lane + the ink keyline + the glow', () => {
  assert.match(cssSrc, /0 0 0 2\.5px color-mix\(in srgb, var\(--gd-tier-deep, var\(--gd-bg\)\) 95%, transparent\),\s*\n\s*0 0 0 4px color-mix\(in srgb, var\(--gd-ink\) 68%, transparent\),\s*\n\s*0 0 0 10px color-mix\(in srgb, var\(--gd-accent\) 30%, transparent\);/, 'the three-voice stack is missing');
  assert.match(cssSrc, /border: 2px solid var\(--gd-accent\);/, 'the accent line drifted');
  assert.match(cssSrc, /THE RING SPEAKS ITS OWN GROUND/, 'the law never spoke its name');
});
ok('B2 — the breath swells the GLOW alone (the lane + keyline hold their seats)', () => {
  assert.match(cssSrc, /animation: gd-selected-breathe 3\.2s ease-in-out infinite;/, 'the breathe clock is missing');
  const kf = cssSrc.match(/@keyframes gd-selected-breathe \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(kf.includes('0 0 0 10px') && kf.includes('0 0 0 12px'), 'the glow swell never spoke');
  assert.ok(kf.includes('30%, transparent)') && kf.includes('40%, transparent)'), 'the alpha swell never spoke');
  const kfHalves = kf.split('50%');
  assert.ok((kfHalves[0] || '').includes('2.5px') && (kfHalves[1] || '').includes('2.5px'), 'the lane moved with the breath');
  assert.match(cssSrc, /@media \(prefers-reduced-motion: reduce\) \{\s*\n\s*\.gd-card-selected::after \{\s*\n\s*animation: none;/, 'the OS still is missing');
  assert.match(cssSrc, /html\.gd-reduced-motion \.gd-card-selected::after \{\s*\n\s*animation: none;/, 'the manual still is missing');
});

// ---------------------------------------------------------------------------
// C. THE HOLO GLOSS RETIRES
// ---------------------------------------------------------------------------
ok('C1 — the late "new layer" never appears (the gloss ::after is a tombstone)', () => {
  const after = cssSrc.match(/\.gd-finish-holographic::after \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(after.includes('content: none;'), 'the gloss band still paints');
  assert.match(cssSrc, /1\.6\.5 — THE GLOSS BAND IS RETIRED/, 'the retirement note never landed');
  // the rest of the riot keeps its seats
  assert.match(cssSrc, /\.gd-finish-holographic \{[\s\S]*?animation: gd-finish-hue 12s linear infinite;/, 'the hue ride retired');
  assert.match(cssSrc, /gd-holo-chaos-ne 15s linear infinite/, 'the shape lattice retired');
  assert.match(cssSrc, /gd-holo-shards-sw 11s linear infinite/, 'the shard lattice retired');
  assert.match(cssSrc, /gd-holo-dots 6\.5s linear infinite/, 'the sparkle dots retired');
});

// ---------------------------------------------------------------------------
// D. THE AURIC DIAMONDS BALANCE
// ---------------------------------------------------------------------------
ok('D1 — the flakes' + "' cores are balanced hearts, centered", () => {
  // flake 1 (28,54): the core sits centered, 6x6
  assert.match(cssSrc, /%3Cpath d='M28 51 L31 54 L28 57 L25 54 Z' fill='%23ffe9b0' fill-opacity='0\.6'\/%3E/, 'the first core never centered');
  // flake 2 (88,139): 7x7 centered
  assert.match(cssSrc, /%3Cpath d='M88 135\.5 L91\.5 139 L88 142\.5 L84\.5 139 Z'/, 'the second core never centered');
  // flake 3 (46,241): 6x6 centered
  assert.match(cssSrc, /%3Cpath d='M46 238 L49 241 L46 244 L43 241 Z'/, 'the third core never centered');
  // the stretched slivers are gone
  assert.ok(!/M36 54 L34\.4 60 L36 66 L37\.6 60/.test(cssSrc), 'the first stretched sliver survived');
  assert.ok(!/M97 139 L95\.6 145/.test(cssSrc), 'the second stretched sliver survived');
  assert.ok(!/M53 241 L51\.8 246/.test(cssSrc), 'the third stretched sliver survived');
  assert.match(cssSrc, /THE STRETCHED DIAMONDS ARE GONE/, 'the law never spoke its name');
});
ok('D2 — the currents' + "' small diamonds take the equal-diagonal law", () => {
  assert.match(cssSrc, /%3Cpath d='M22 83 L29\.5 90\.5 L22 98 L14\.5 90\.5 Z'/, 'the lower-left diamond never balanced');
  assert.match(cssSrc, /%3Cpath d='M98 59\.5 L104\.5 66 L98 72\.5 L91\.5 66 Z'/, 'the right diamond never balanced');
  assert.match(cssSrc, /%3Cpath d='M38 13 L43 18 L38 23 L33 18 Z'/, 'the first rotated diamond never balanced');
  assert.match(cssSrc, /%3Cpath d='M84 99 L89 104 L84 109 L79 104 Z'/, 'the second rotated diamond never balanced');
  // the tall pre-1.6.5 seats are gone
  assert.ok(!/M22 82 L29\.5 90\.5 L22 99/.test(cssSrc), 'the 15x17 diamond survived');
  assert.ok(!/M98 58 L104\.5 66 L98 74/.test(cssSrc), 'the 13x16 diamond survived');
});

// ---------------------------------------------------------------------------
// E. THE STILL BELONGS TO THE BIG WINDOWS
// ---------------------------------------------------------------------------
ok('E1 — the ctx menu + the popover never arm the still', () => {
  assert.ok(!/dataset\.gdModals/.test(ctxSrc), 'the ctx menu still arms the counter');
  assert.ok(!/classList\.add\('gd-coats-frozen'\)/.test(ctxSrc), 'the ctx menu still arms the still');
  assert.match(ctxSrc, /THE MENU NO LONGER STILLS THE COATS/, 'the menu retirement never spoke');
  assert.ok(!/dataset\.gdModals/.test(popSrc), 'the popover still arms the counter');
  assert.ok(!/classList\.add\('gd-coats-frozen'\)/.test(popSrc), 'the popover still arms the still');
  assert.match(popSrc, /THE DROPDOWN NO LONGER STILLS THE COATS/, 'the popover retirement never spoke');
});
ok('E2 — Modal keeps the counter; the panel flight no longer stills the coats', () => {
  assert.match(modalSrc, /dataset\.gdModals/, 'Modal lost the counter');
  assert.match(modalSrc, /classList\.add\('gd-coats-frozen'\)/, 'Modal lost the still');
  const freezeBlock = cssSrc.match(/\/\* 1\.4\.1 — THE COATS HOLD THEIR BREATH[\s\S]*?animation-play-state: paused !important;\s*\n\}/)?.[0] || '';
  assert.ok(freezeBlock.includes(':root.gd-coats-frozen'), 'the still law is missing');
  assert.ok(!/:root\.gd-flight \[data-gd-region\]/.test(cssSrc), 'the panel flight still stills the coats');
  assert.match(cssSrc, /THE STILL BELONGS TO THE BIG WINDOWS ALONE/, 'the law never spoke its name');
});

// ---------------------------------------------------------------------------
// F. THE LANE VERDICT READS THE ROW FIRST
// ---------------------------------------------------------------------------
ok('F1 — the verdict picks the row (the lane bands), then races that row alone', () => {
  const lanesBlock = thumbSrc.match(/if \(lanes\) \{[\s\S]*?\n    \}\n    consider\(rects\[0\]\.x/)?.[0] || '';
  assert.ok(lanesBlock.includes('bands.push({ lane, top, bottom })'), 'the lane bands never built');
  assert.ok(/cy >= b\.top && cy <= b\.bottom/.test(lanesBlock), 'the row containment never spoke');
  assert.ok(/const d = cy < b\.top \? b\.top - cy : cy - b\.bottom;/.test(lanesBlock), 'the nearest-band law is missing');
  assert.ok(lanesBlock.includes('const rrLane = count % R;'), 'the round-robin lane never resolved');
  assert.ok(lanesBlock.includes('const slot = lane === rrLane ? rects.length : q;'), 'the honest slot law is missing');
  assert.ok(lanesBlock.includes('const midY = last.y + last.h / 2 + phantomPitch;'), 'the empty-lane voices lost their seat');
  assert.match(thumbSrc, /THE LANES VERDICT READS THE ROW FIRST/, 'the law never spoke its name');
});

// ---------------------------------------------------------------------------
// G. THE DROP LANDS THE PREVIEW + THE LAG DIES
// ---------------------------------------------------------------------------
ok('G1 — the same-card lane allows the drop (preventDefault first)', () => {
  // 1.6.7 — the stillness guard rides between the preventDefault and the
  // same-card check now; the LAW the pin guards (the drop is allowed
  // BEFORE any guard can refuse it) is unchanged — the pin reads the new
  // order: preventDefault, then the guard, then the same-card lane.
  assert.match(gridSrc, /e\.preventDefault\(\);\s*\n\s*\/\/ 1\.6\.7 — THE STILL POINTER'S GUARD/, 'the preventDefault no longer speaks first');
  assert.match(gridSrc, /const px = typeof e\.clientX === 'number' \? e\.clientX : null;/, 'the stillness read is missing');
  assert.match(gridSrc, /setDropHint\(\(h\) => \(h && h\.id === id \? null : h\)\);\s*\n\s*dropSeatRef\.current = null;[^\n]*\n\s*return;/, 'the same-card hint retire drifted (1.6.8: a self-hover seats nothing)');
  assert.ok(!/if \(!drag \|\| drag\.type !== 'card' \|\| drag\.id === id\) return;/.test(gridSrc), 'the old refusing guard survived');
});
ok('G2 — the self-drop commits the preview', () => {
  // 1.6.7 — the law-pin moves with the commit's rework: EVERY drop speaks
  // the preview now (the self-drop lane and the neighbor lane are one —
  // the old `if (drag.id === id) {` wrapper left with the hint-derived
  // neighbor commit; see the 1.6.7 note in dropOnCard and battery 171).
  // 1.6.9 — the fresh-seat drop: the arm-point clears with the seat and a
  // traveling release re-derives the seat from the card it landed on.
  assert.match(gridSrc, /const preview = dragPreviewRef\.current;[\s\S]*?dragPreviewRef\.current = null;\s*\n\s*armPtRef\.current = null;\s*\n\s*setDragPreview\(null\);\s*\n\s*dragRef\.current = null;\s*\n\s*dropSeatRef\.current = null;\s*\n\s*if \(seat && seat\.over != null && seat\.over !== drag\.id\) \{/, 'the preview commit is missing (1.6.9: the fresh-seat drop)');
  assert.match(gridSrc, /if \(seat && seat\.over != null && seat\.over !== drag\.id\) \{/, 'the preview guard is missing (1.6.8: the seat speaks)');
  assert.match(gridSrc, /onReorder\(drag\.id, seat\.over, seat\.side\);/, 'the preview commit never spoke (1.6.8: the seat speaks)');
});
ok('G3 — the hint only speaks when it changes (the re-render storm dies)', () => {
  assert.match(gridSrc, /setDropHint\(\(h\) => \(h && h\.id === id && h\.side === side \? h : \{ id, side \}\)\);/, 'the hint bailout is missing');
  assert.ok(!/setDropHint\(\{ id, side \}\);/.test(gridSrc), 'the unguarded hint write survived');
  assert.match(gridSrc, /THE HINT ONLY SPEAKS WHEN IT CHANGES/, 'the law never spoke its name');
});

// ---------------------------------------------------------------------------
// H. THE CARDS KEEP THEIR PLATES
// ---------------------------------------------------------------------------
ok('H1 — the body wrapper carries its name and leaves the wholesale fade', () => {
  // 1.6.7 — the law-pin moves with the seat narrowing: the swap flight
  // reaches the PICTURE alone now (.gd-stage-pictures — the owner's 1.6.7
  // list retired every other seat; see the 1.6.7 note at .gd-cv-swap and
  // battery 171). The 1.6.5 seats it pinned (the wholesale exclusion list,
  // the .gd-cv-body .gd-card content seat) left with them; the wrapper's
  // own NAME keeps its 1.6.5 law (it still never fades as a unit).
  assert.match(cvSrc, /'pb-6 items-start gd-cv-body'/, 'the body never took its name');
  assert.match(cssSrc, /\.gd-cv-swap \.gd-cardcol \.gd-stage-pictures,/, 'the picture seat is missing (1.6.8: the content group)');
  assert.ok(!/\.gd-cv-swap \.gd-cv-body \.gd-card > \*/.test(cssSrc), 'the retired content seat survived');
  const stills = cssSrc.match(/\.gd-reduced-motion \.gd-cv-swap \.gd-cardcol \.gd-stage-pictures[^;]*;/)?.[0] || '';
  assert.ok(stills.includes('animation: none'), 'the reduced-motion still lost the new seat');
  assert.match(cssSrc, /THE CONTENT SPEAKS, THE FURNITURE HOLDS/, 'the law never spoke its name (1.6.8: the content family)');
});

// ---------------------------------------------------------------------------
// P1. THE VERSION FURNITURE
// ---------------------------------------------------------------------------
ok('P1 — the version is 1.6.7 everywhere (1.6.7 furniture)', () => {
  assert.match(pkgSrc, /"version": "1\.9\.19"/, 'package.json never moved');
  assert.match(lockSrc, /"version": "1\.9\.19"/, 'the lock root never moved');
  assert.match(constSrc, /version: '1\.9\.19',/, 'APP.version never moved');
  assert.match(readmeSrc, /\*\*v1\.9\.19\*\*/, 'the README header never moved');
  assert.match(readmeSrc, /the regression battery \(93 DOM\/source test suites\)/, 'the battery count never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(webSrc, /<span class="ver">v1\.8\.6<\/span>/, 'the website current card never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(webSrc, /releases\/tag\/v1\.8\.6"/, 'the website release link never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(webSrc, /<td class="v">1\.6\.7<\/td>/, 'the website current-row never moved');
  assert.match(changeSrc, /## 1\.6\.7 — The Picture Alone Breathes/, 'the changelog head never landed');
});

// ---------------------------------------------------------------------------
// LIVE — the real tree in jsdom
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

  // --- LIVE 1: the prompt's 1.5.2 windows through the real panel ------------
  await okAsync('LIVE1 — the chip opens the color window; the expand opens the big editor (live edits)', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const rt = createRoot(host);
    try {
      db = createSafeDb(null);
      db.settings.tosAcceptance = { version: TOS_VERSION, at: 1 };
      db.settings.detailPanel = true;
      db.characters.push({
        id: 'char-p', name: 'partsy', classId: 'root', createdAt: 1,
        versions: [{ id: 'vp', label: 'V1', images: [], notes: '', parts: [
          { id: 'pa', name: 'body', content: 'a tall warrior', include: true, color: null },
        ] }],
        stamps: [],
      });
      mockApi();
      localStorage.setItem('gd:last-run-version', '1.9.19');
      rt.render(React.createElement(App));
      await sleep(3400);
      const card = [...document.querySelectorAll('.gd-card')].find((c) => (c.textContent || '').includes('partsy'));
      assert.ok(card, 'the card never mounted');
      click(card);
      await sleep(400);
      const row = [...document.querySelectorAll('.gd-part-row')][0];
      assert.ok(row, 'the part row never mounted');
      // the chip: hollow while unset
      const chip = row.querySelector('.gd-part-color-chip');
      assert.ok(chip && chip.className.includes('is-empty'), 'the chip never spoke its hollow voice');
      click(chip);
      await sleep(260);
      const ladder = document.querySelector('[data-gd-modal] .gd-cls-presets');
      assert.ok(ladder, 'the color window never opened (no ladder in a modal)');
      const preset = ladder ? [...ladder.querySelectorAll('.gd-cls-preset')][0] : null;
      assert.ok(preset, 'the preset ladder never mounted');
      click(preset);
      await sleep(320);
      const row2 = [...document.querySelectorAll('.gd-part-row')][0];
      assert.ok((row2.getAttribute('style') || '').includes('--part-color: #c8402f'), 'the live pick never landed on the row');
      assert.ok(row2.className.includes('is-colored'), 'the scope class never spoke');
      assert.equal(row2.getAttribute('data-part-color'), '#c8402f', 'the color attribute never spoke');
      const doneBtn = [...document.querySelectorAll('button')].filter((b) => /^DONE$/i.test((b.textContent || '').trim()))[0];
      assert.ok(doneBtn, 'the color window never carried its DONE foot');
      click(doneBtn);
      await sleep(220);
      // the big editor: live edits
      const expandKey = [...row2.querySelectorAll('button')].find((b) => /big editor window/i.test(b.title || ''));
      assert.ok(expandKey, 'the EXPAND key never mounted');
      click(expandKey);
      await sleep(260);
      const stage = [...document.querySelectorAll('textarea.gd-prompt-stage')][0];
      assert.ok(stage, 'the big editor never opened (no stage)');
      const well = row2.querySelector('textarea.gd-prompt-box');
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      setter.call(stage, 'a tall warrior, gold trim');
      stage.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      await sleep(320);
      assert.equal(well.value, 'a tall warrior, gold trim', 'the live edit never landed in the row behind the window');
    } finally {
      rt.unmount();
      host.remove();
    }
  });

  // --- LIVE 2: the self-drop commits the preview ------------------------------
  await okAsync('LIVE2 — a drop on the dragged card itself lands the preview', async () => {
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
      const ccc = cardOf('ccc');
      assert.ok(aaa && ccc, 'the cards never mounted');
      assert.equal(order().join(','), 'aaa,bbb,ccc', 'the base order is wrong');
      const dt = { effectAllowed: '', setData: () => {}, setDragImage: () => {} };
      const startEv = new dom.window.MouseEvent('dragstart', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 });
      Object.defineProperty(startEv, 'dataTransfer', { value: dt });
      Object.defineProperty(aaa, 'getBoundingClientRect', { value: () => ({ width: 236, height: 340, left: 10, top: 10, right: 246, bottom: 350 }) });
      Object.defineProperty(ccc, 'getBoundingClientRect', { value: () => ({ width: 236, height: 340, left: 10, top: 700, right: 246, bottom: 1040 }) });
      aaa.dispatchEvent(startEv);
      await sleep(40);
      // arm the preview over ccc (right half)
      const overEv = new dom.window.MouseEvent('dragover', { bubbles: true, cancelable: true, clientX: 200, clientY: 900 });
      Object.defineProperty(overEv, 'dataTransfer', { value: dt });
      ccc.dispatchEvent(overEv);
      await sleep(140);
      assert.equal(order().join(','), 'bbb,ccc,aaa', 'the live gap never moved the pack');
      // 1.6.5 — the pointer glides over the DRAGGED CARD ITSELF (it moved
      // under the cursor with the preview) — the dragover is ALLOWED and
      // changes nothing; the DROP on it commits the preview.
      const selfOver = new dom.window.MouseEvent('dragover', { bubbles: true, cancelable: true, clientX: 100, clientY: 100 });
      Object.defineProperty(selfOver, 'dataTransfer', { value: dt });
      aaa.dispatchEvent(selfOver);
      await sleep(140);
      assert.equal(order().join(','), 'bbb,ccc,aaa', 'the self-hover disturbed the preview');
      const dropEv = new dom.window.MouseEvent('drop', { bubbles: true, cancelable: true, clientX: 100, clientY: 100 });
      Object.defineProperty(dropEv, 'dataTransfer', { value: dt });
      aaa.dispatchEvent(dropEv);
      await sleep(220);
      assert.equal(order().join(','), 'bbb,ccc,aaa', 'the self-drop never landed the preview (' + order().join(',') + ')');
      aaa.dispatchEvent(new dom.window.Event('dragend', { bubbles: true }));
      await sleep(200);
      assert.equal(order().join(','), 'bbb,ccc,aaa', 'the pack walked home after the dragend belt — the drop never committed (' + order().join(',') + ')');
    } finally {
      rt.unmount();
      host.remove();
    }
  });

  // --- LIVE 3: the still belongs to the big windows ---------------------------
  await okAsync('LIVE3 — the coats freeze only under a Modal, never a right-click', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const rt = createRoot(host);
    try {
      db = createSafeDb(null);
      db.settings.tosAcceptance = { version: TOS_VERSION, at: 1 };
      db.characters.push({ id: 'char-s', name: 'still', classId: 'root', createdAt: 1, cardFinish: 'holographic', versions: [{ id: 'vs', label: 'V1', images: [], parts: [] }], stamps: [] });
      mockApi();
      localStorage.setItem('gd:last-run-version', '1.9.19');
      rt.render(React.createElement(App));
      await sleep(3400);
      const rootEl = document.documentElement;
      assert.ok(!rootEl.classList.contains('gd-coats-frozen'), 'the still rode the boot');
      assert.equal(rootEl.dataset.gdModals || undefined, undefined, 'a phantom counter rode the boot');
      // a right-click on the card arms the CONTEXT MENU — never the still
      const card = [...document.querySelectorAll('.gd-card')].find((c) => (c.textContent || '').includes('still'));
      assert.ok(card, 'the card never mounted');
      const ctxEv = new dom.window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 40 });
      card.dispatchEvent(ctxEv);
      await sleep(400);
      assert.ok(!rootEl.classList.contains('gd-coats-frozen'), 'the right-click stilled the coats');
      assert.equal(rootEl.dataset.gdModals || undefined, undefined, 'the right-click armed the counter');
      document.body.dispatchEvent(new dom.window.MouseEvent('mousedown', { bubbles: true }));
      await sleep(300);
      // the settings window (a Modal) DOES arm the still
      const settingsKey = [...document.querySelectorAll('button')].find((b) => /settings/i.test(b.title || '') || /^SETTINGS$/i.test((b.textContent || '').trim()));
      assert.ok(settingsKey, 'the settings key never mounted');
      click(settingsKey);
      await sleep(500);
      assert.ok(rootEl.classList.contains('gd-coats-frozen'), 'the big window never stilled the coats');
      assert.equal(rootEl.dataset.gdModals, '1', 'the counter never spoke');
    } finally {
      rt.unmount();
      host.remove();
    }
  });

  if (errors.length) {
    console.log('  page errors during LIVE:');
    for (const e of errors.slice(0, 4)) console.log('    ' + e.slice(0, 200));
  }
  assert.equal(errors.length, 0, 'the live passes threw ' + errors.length + ' page errors');
} else {
  console.log('  (jsdom absent — LIVE passes skipped)');
}

console.log(`\n${passed} passed, ${failed} failed${failed ? ' — FIX ABOVE' : ''}`);
process.exit(failed ? 1 : 0);
