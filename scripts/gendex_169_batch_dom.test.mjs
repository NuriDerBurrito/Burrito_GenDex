// 1.6.4 batch — The Ink Signs Its Name.
// (Named 169 in the sequence: 159 -> 1.4.9, 160 -> 1.5.4, 161 -> 1.5.5,
//  162 -> 1.5.6, 163 -> 1.5.7, 164 -> 1.5.8, 165 -> 1.5.9, 166 -> 1.6.0,
//  167 -> 1.6.2, 168 -> 1.6.3.)
// The reported items, each pinned at its root law:
//   A.  THE AUDIT BECOMES DIALS (the shadow's soft/sharp STYLE seats + the
//       on-to-soft migration; TRIM LINES; STAMP TILT; the settings seats)
//   B.  THE THUMBNAIL'S CORNER BORDER DIES (the 1.6.3 curve ring retired)
//   C.  THE LANES SPEAK THEIR OWN ENDS (the per-lane end gaps)
//   D.  THE READER'S WINDOW (expand opens a fade window with the big page;
//       the color pins to the prompt container's corner; the notes the
//       same; the icons changed)
//   E.  THE DRAG'S SEAT-HOLDING LAW (the straddle no-ops + the equality
//       gate + the leave holds; the endings still retire)
//   F.  THE RING BREATHES (the idle halo flight + both reduced-motion
//       stills)
//   G.  THE OFF FACE WENT QUIET (the coats switch says nothing when off)
//   H.  THE ARTFIN'S OWN ZONE (the sprite washes mask to the art zone)
//   I.  THE NAME WALKS (mumeix -> numeix, the finish + the theme + every
//       migration lane)
//   J.  THE DAPPLE'S SEAMS + THE THINNER CANOPY
//   K.  THE CLEAN GEM (the stretched crown fill retired)
//   L.  THE PRISM'S PACE
// Plus the version furniture and live passes (the migrations through the
// real sanitizer, the notes reader through the real panel, the dials'
// root attributes through a real boot).

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
assert.deepEqual = (a, b, msg) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(msg || `${JSON.stringify(a)} != ${JSON.stringify(b)}`);
};

const partSrc = src('src/components/PartEditor.jsx');
const cvSrc = src('src/components/CharacterView.jsx');
const gridSrc = src('src/components/GridView.jsx');
const cssSrc = src('src/index.css');
const constSrc = src('src/constants/index.js');
const helpersSrc = src('src/utils/helpers.js');
const themeSrc = src('src/utils/theme.js');
const appSrc = src('src/App.jsx');
const settingsSrc = src('src/components/SettingsModal.jsx');
const ribbonSrc = src('src/components/TagRibbon.jsx');
const thumbSrc = src('src/components/useThumbSort.js');
const mainSrc = src('src/main.js');
const pkgSrc = src('package.json');
const lockSrc = src('package-lock.json');
const readmeSrc = src('README.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const changeSrc = src('CHANGELOG.md');

// ---------------------------------------------------------------------------
// A. THE AUDIT BECOMES DIALS
// ---------------------------------------------------------------------------
ok('A1 — the shadow dial grows its STYLE seats (soft + sharp)', () => {
  assert.match(cssSrc, /:root\[data-gd-card-shadow='soft'\] \.gd-card,/, 'the soft ladder never seated');
  assert.match(cssSrc, /box-shadow: 0 6px 18px rgba\(0, 0, 0, 0\.32\);/, 'the soft resting shadow drifted');
  assert.match(cssSrc, /:root\[data-gd-card-shadow='sharp'\] \.gd-card,/, 'the sharp ladder never seated');
  assert.match(cssSrc, /box-shadow: 4px 4px 0 rgba\(0, 0, 0, 0\.5\);/, 'the sharp resting shadow drifted');
  assert.match(cssSrc, /box-shadow: 6px 6px 0 rgba\(0, 0, 0, 0\.55\);/, 'the sharp hover shadow drifted');
  assert.ok(!/:root\[data-gd-card-shadow='on'\]/.test(cssSrc), "the retired 'on' ladder survived");
  assert.match(helpersSrc, /cardShadow: rawSettings\.cardShadow === 'on'\s*\n\s*\? 'soft'/, 'the on-to-soft migration is missing');
  assert.match(appSrc, /shadowRaw === 'on' \? 'soft'/, "App's belt for a live 'on' db is missing");
});
ok('A2 — TRIM LINES speaks the cut-line family', () => {
  assert.match(cssSrc, /:root\[data-gd-trim-lines='dashed'\] \.gd-chip,/, 'the dashed chip ladder is missing');
  assert.match(cssSrc, /:root\[data-gd-trim-lines='dashed'\] \.gd-rule::after,/, 'the dashed rule ladder is missing');
  assert.match(cssSrc, /:root\[data-gd-trim-lines='dashed'\] \.gd-hairline-t,/, 'the dashed hairline ladder is missing');
  assert.match(cssSrc, /:root\[data-gd-trim-lines='solid'\] \.gd-chip,/, 'the solid ladder is missing');
  assert.match(helpersSrc, /trimLines: \['theme', 'solid', 'dashed'\]\.includes\(rawSettings\.trimLines\)/, 'the trim sanitize lane is missing');
  assert.match(appSrc, /dataset\.gdTrimLines = trimLines;/, 'the root attribute never mounted');
  assert.match(constSrc, /trimLines: 'theme',/, 'the default never seated');
});
ok('A3 — STAMP TILT speaks the stance axis', () => {
  assert.match(cssSrc, /:root\[data-gd-stamp-tilt='flat'\] \.gd-stamp \{\s*\n\s*transform: none;/, 'the flat ladder is missing');
  assert.match(cssSrc, /:root\[data-gd-stamp-tilt='tilted'\] \.gd-stamp \{\s*\n\s*transform: rotate\(-3deg\);/, 'the tilted ladder is missing');
  assert.match(helpersSrc, /stampTilt: \['theme', 'flat', 'tilted'\]\.includes\(rawSettings\.stampTilt\)/, 'the tilt sanitize lane is missing');
  assert.match(appSrc, /dataset\.gdStampTilt = stampTilt;/, 'the root attribute never mounted');
  assert.match(constSrc, /stampTilt: 'theme',/, 'the default never seated');
});
ok('A4 — the Look tab seats the audit (Soft / Sharp in the shadow dial + the two new cards)', () => {
  assert.match(settingsSrc, /title="CARD SHADOW"/, 'the shadow card lost its seat');
  assert.match(settingsSrc, /\{ id: 'soft', label: 'Soft', title:/, 'the Soft seat is missing');
  assert.match(settingsSrc, /\{ id: 'sharp', label: 'Sharp', title:/, 'the Sharp seat is missing');
  assert.ok(!/\{ id: 'on', label: 'On', title:/.test(settingsSrc), "the retired 'On' seat survived");
  assert.match(settingsSrc, /title="TRIM LINES"/, 'the trim-lines card never seated');
  assert.match(settingsSrc, /\{ id: 'dashed', label: 'Dashed', title:/, 'the Dashed seat is missing');
  assert.match(settingsSrc, /onPick=\{\(id\) => set\('trimLines', id\)\}/, 'the trim dial never commits');
  assert.match(settingsSrc, /title="STAMP TILT"/, 'the stamp-tilt card never seated');
  assert.match(settingsSrc, /onPick=\{\(id\) => set\('stampTilt', id\)\}/, 'the tilt dial never commits');
});

// ---------------------------------------------------------------------------
// B. THE THUMBNAIL'S CORNER BORDER DIES
// ---------------------------------------------------------------------------
ok('B1 — the 1.6.3 curve ring is retired (no pseudo, no arc, no clip)', () => {
  assert.ok(!/\.gd-sleeve::before[\s\S]{0,40}\.gd-panzoom::before \{/.test(cssSrc), 'the ring survived the retirement');
  assert.ok(!/color-mix\(in srgb, var\(--gd-ink\) 62%, var\(--gd-bg\)\)/.test(cssSrc), 'the ring ink survived');
  assert.ok(!/clip-path: inset\(-5px -5px 0 -5px\);/.test(cssSrc), 'the ring clip survived');
  assert.match(cssSrc, /1\.6\.4 — THE CURVE RING IS RETIRED/, 'the retirement note never landed');
});

// ---------------------------------------------------------------------------
// C. THE LANES SPEAK THEIR OWN ENDS
// ---------------------------------------------------------------------------
ok('C1 — every lane carries its OWN end gap (the per-lane trailing set)', () => {
  /* 1.6.5 supersede: the verdict READS THE ROW FIRST — the lane bands
     pick the row, then only that row's own gaps race. The per-lane end
     gaps + the 1.6.4 slot mapping live inside the row-first block. */
  const lanesBlock = thumbSrc.match(/if \(lanes\) \{[\s\S]*?\n    \}\n    consider\(rects\[0\]\.x/)?.[0] || '';
  assert.ok(lanesBlock.includes('const rrLane = count % R;'), 'the round-robin lane never resolved');
  assert.ok(lanesBlock.includes('const slot = lane === rrLane ? rects.length : q;'), 'the honest slot law is missing');
  assert.ok(/for \(let i = lane; i < rects\.length; i \+= R\) q = i;/.test(thumbSrc), 'the lane-last-member walk is missing');
  assert.ok(lanesBlock.includes('bands.push({ lane, top, bottom })'), 'the lane bands never built');
  assert.ok(/cy >= b\.top && cy <= b\.bottom/.test(thumbSrc), 'the row containment never spoke');
  assert.ok(/consider\(rects\[0\]\.x - gapHalf, midY, rects\.length\);/.test(thumbSrc), 'the empty-lane left voice is missing');
  // the single global trailing gap only speaks for NON-lanes walls now
  const tail = thumbSrc.match(/  const last = rects\[rects\.length - 1\];\s*\n\s*consider\(last\.x \+ last\.w \+ gapHalf, last\.y \+ last\.h \/ 2, rects\.length\);\s*\n\s*return best;/)?.[0] || '';
  assert.ok(tail.includes('consider(last'), 'the non-lanes trailing gap lost its seat');
});

// ---------------------------------------------------------------------------
// D. THE READER'S WINDOW + THE COLOR'S HONEST SEAT
// ---------------------------------------------------------------------------
ok('D1 — EXPAND opens the reader\'s window (the Modal family, the big page)', () => {
  /* 1.6.5 supersede: the 1.5.2 big EDITOR window (live edits, the stage). */
  assert.match(partSrc, /function PromptExpandWindow\(/, 'the big editor never mounted');
  assert.match(partSrc, /title="PROMPT EDITOR"/, 'the window never named itself');
  assert.match(partSrc, /'gd-input gd-prompt-stage',/, 'the stage field never seated (1.6.8: clsx + the container color)');
  assert.ok(!/<span[^>]*>[^<]*edits land live<\/span>/.test(partSrc), 'the live-edit note survived the 1.6.8 retirement');
  assert.match(partSrc, /expandedId, setExpandedId\] = useState\(null\)/, 'the expanded seat never threaded');
});
ok('D2 — the COLOR key pins to the prompt container\'s corner', () => {
  /* 1.6.5 supersede: the 1.5.2 corner CHIP on the row + the COLOR WINDOW. */
  assert.match(partSrc, /function PartColorWindow\(/, 'the color window never mounted');
  assert.match(partSrc, /className=\{clsx\('gd-part-color-chip', !part\.color && 'is-empty'\)\}/, 'the corner chip never mounted');
  assert.match(partSrc, /style=\{part\.color \? \{ background: part\.color, borderColor: part\.color \} : undefined\}/, 'the chip fill never threaded');
  assert.match(cssSrc, /\.gd-part-color-chip \{[\s\S]*?right: -7px;/, 'the 1.5.2 chip seat law is missing');
  assert.match(cssSrc, /\.gd-part-color-chip\.is-empty \{[\s\S]*?border-style: dashed;/, 'the hollow voice law is missing');
  assert.match(cssSrc, /\.gd-part-row\.is-colored \{/, 'the colored wash law is missing');
  assert.ok(!/\.gd-part-color-key \{/.test(cssSrc) && !/\.gd-part-well-keys \{/.test(cssSrc), 'the old well-corner key law survived');
  assert.ok(!/className="gd-part-well/.test(partSrc), 'the old pocket wrapper survived');
});
ok('D3 — the NOTES speak the same window (new icons)', () => {
  /* 1.6.7 supersede: the notes' reader grew into the big EDITOR
     ("update the expanded window" — NotesEditorWindow: the stage field,
     live edits through setNotes, the pinned COPY + DONE foot) and the
     notes box joined the parts' container law (the corner color chip
     + the notes' own color window). */
  assert.match(cvSrc, /function NotesEditorWindow\(/, 'the notes editor never mounted');
  assert.match(cvSrc, /<NotesEditorWindow/, 'the notes editor window never threaded');
  assert.match(cvSrc, /title="NOTES EDITOR"/, 'the notes window never named itself');
  assert.match(cvSrc, /'gd-input gd-notes-stage',/, 'the notes stage never seated (1.6.8: clsx + the container color)');
  assert.match(cvSrc, /function NotesColorWindow\(/, 'the notes color window never mounted');
  assert.match(cvSrc, /gd-notes-box/, "the notes never joined the parts' container law");
  assert.match(cvSrc, /<Maximize2 size=\{12\} \/>/, 'the notes glyph never changed');
  assert.ok(!/FoldVertical|UnfoldVertical/.test(cvSrc), 'the old unfold glyphs survived');
});
ok('D4 — the reader windows carry their own COPY feet', () => {
  /* 1.6.5 supersede: the parts' window is the big EDITOR (DONE foot,
     live edits — the row's COPY key speaks the copy); the notes keep
     their reader with its COPY foot. */
  assert.match(cvSrc, /COPIED' : 'COPY'/, "the notes window's copy foot is missing");
  assert.match(cssSrc, /\.gd-reader-doc \{[\s\S]*?white-space: pre-wrap;/, 'the big page never wrapped as written');
  assert.match(partSrc, /DONE/, 'the editor never carried its DONE foot');
});

// ---------------------------------------------------------------------------
// E. THE DRAG'S SEAT-HOLDING LAW
// ---------------------------------------------------------------------------
ok('E1 — the straddle no-ops + the equality gate guard the arm', () => {
  assert.match(gridSrc, /if \(side === 'right' && tIdx === curIdx - 1\) return;/, 'the right straddle guard is missing');
  assert.match(gridSrc, /if \(side === 'left' && tIdx === curIdx \+ 1\) return;/, 'the left straddle guard is missing');
  assert.match(gridSrc, /curOrder\.every\(\(v, i\) => v === nextOrder\[i\]\)/, 'the order-equality gate is missing');
  /* 1.6.5 supersede: the same-card lane ALLOWS the drop (the preventDefault
     speaks first, the self-drop commits the preview).
     1.6.7 supersede: the STILLNESS GUARD rides between the preventDefault
     and the same-card lane (a layout-shift echo never re-arms the preview
     — "if i hold still i see it change in front of my eyes once"). */
  assert.match(gridSrc, /e\.preventDefault\(\);\s*\n\s*\/\/ 1\.6\.7 — THE STILL POINTER'S GUARD/, 'the same-card drop lane never allowed the drop first');
  assert.match(gridSrc, /dragPtRef\.current = \{ x: px, y: py \};/, 'the stillness memory never wrote');
});
ok('E2 — the leave HOLDS its seat; the endings still retire', () => {
  // 1.6.7 — the leave carries the EVENT (the stillness guard reads its
  // coordinates: a layout-shift echo keeps the hint, a true exit retires
  // it — the law the pin guards survives the rework).
  const leave = gridSrc.match(/const leaveCard = \(e, id\) => \{[\s\S]*?\n  \};/)?.[0] || '';
  assert.ok(leave.includes('setDropHint'), 'the hint lost its own exit');
  assert.ok(!/setDragPreview\(null\)/.test(leave), 'the leave still walks the gap home');
  /* 1.6.5 supersede: the drop reads the preview (the self-drop commits
     it), then retires it.
     1.6.7 supersede: EVERY drop commits the preview — the commit is the
     preview, full stop (the event's target and the hint's side both lied
     after layout shifts). */
  assert.match(gridSrc, /const preview = dragPreviewRef\.current;[\s\S]*?dragPreviewRef\.current = null;\s*\n\s*armPtRef\.current = null;\s*\n\s*setDragPreview\(null\);\s*\n\s*dragRef\.current = null;\s*\n\s*dropSeatRef\.current = null;\s*\n\s*if \(seat && seat\.over != null && seat\.over !== drag\.id\) \{/, 'the preview commit is missing (1.6.8: the seat memory; 1.6.9: the fresh-seat drop clears the arm-point with the seat)');
  assert.match(gridSrc, /this is the belt for every OTHER ending/, 'the dragend belt drifted');
});

// ---------------------------------------------------------------------------
// F. THE RING BREATHES
// ---------------------------------------------------------------------------
ok('F1 — the selected ring idles on a slow halo flight', () => {
  assert.match(cssSrc, /animation: gd-selected-breathe 3\.2s ease-in-out infinite;/, 'the breathe clock is missing');
  const kf = cssSrc.match(/@keyframes gd-selected-breathe \{[\s\S]*?\n\}/)?.[0] || '';
  /* 1.6.5 supersede: the glow swells 10px -> 12px / 30% -> 40% (the lane
     + keyline hold their seats). */
  assert.ok(kf.includes('0 0 0 10px') && kf.includes('0 0 0 12px'), 'the glow swell never spoke');
  assert.ok(kf.includes('30%, transparent)') && kf.includes('40%, transparent)'), 'the alpha swell never spoke');
  assert.match(cssSrc, /@media \(prefers-reduced-motion: reduce\) \{\s*\n\s*\.gd-card-selected::after \{\s*\n\s*animation: none;/, 'the OS still is missing');
  assert.match(cssSrc, /html\.gd-reduced-motion \.gd-card-selected::after \{\s*\n\s*animation: none;/, 'the manual still is missing');
});

// ---------------------------------------------------------------------------
// G. THE OFF FACE WENT QUIET
// ---------------------------------------------------------------------------
ok('G1 — the coats switch says nothing when off', () => {
  // pin the desc ternary itself (the 1.6.4 comment above the card QUOTES
  // the retired text by design — the narration lives only there now).
  const desc = settingsSrc.match(/title="EXPERIMENTAL FINISHES"[\s\S]{0,2000}?desc=\{([\s\S]*?)\n\s*\}/)?.[1] || '';
  assert.ok(desc.includes('settings.livingFinishes !== false'), 'the ON line drifted');
  assert.match(desc, /\? 'The material coats are enabled and animated app-wide\.'/, 'the ON line drifted');
  assert.match(desc, /: null\s*$/, 'the OFF branch still narrates');
  assert.ok(!desc.includes(': \'The material coats are switched off'), 'the OFF narration survived the request');
});

// ---------------------------------------------------------------------------
// H. THE ARTFIN'S OWN ZONE
// ---------------------------------------------------------------------------
ok('H1 — the sprite washes mask to the art zone while a card wears an image', () => {
  assert.match(ribbonSrc, /hasImage && 'is-art-zone'/, 'the zone class never threaded');
  assert.match(ribbonSrc, /style=\{\{ \['--gd-fin-ph'\]: ph, \.\.\.\(artH != null \? \{ \['--gd-art-h'\]: `\$\{Math\.round\(artH\)\}px` \} : null\) \}\}/, 'the artH var never threaded the artfin');
  assert.match(cssSrc, /\.gd-card-face-artfin\.is-art-zone \{[\s\S]*?mask-image: linear-gradient\(/, 'the zone mask is missing');
  /* 1.9.6 — anchored to the sheet's margin: the split volume's scope
     seats the same selector-suffix (.gd-fin-split
     .gd-card-face-artfin.is-art-zone) earlier in the sheet, and the
     artfin's OWN mask is the rule that starts at the margin. */
  const mask = /^\.gd-card-face-artfin\.is-art-zone \{[\s\S]*?\n\}/m.exec(cssSrc)?.[0] || '';
  assert.ok(mask.includes('#000 var(--gd-fin-cut)') && mask.includes('rgba(0, 0, 0, 0) calc(var(--gd-fin-cut) + 1px)'), 'the mask never cut at the notch line');
});
ok('H2 — the washes step up to speak whole over the picture', () => {
  /* 1.9.3 — the numeix + auric artfin washes lean the card's own color
     now ("it would be creamy in the color of the card still"): the fixed
     rgba stops became premultiplied color-mix leans, every alpha exact.
     The nuri stop below keeps its 1.6.4 seat — the forge already spoke
     the card-color law this release generalized. */
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the picture-washes speak their
     classic fixed anchors again, verbatim from the 1.9.2 sheet (the
     sepia band, the honey gradient); the hand-leans retired with the
     derivation. */
  assert.match(cssSrc, /rgba\(238, 226, 186, 0\.56\) 0%/, 'the numeix wash stops drifted');
  assert.match(cssSrc, /rgba\(255, 224, 140, 0\.36\) 0%/, 'the auric wash stops drifted');
  assert.match(cssSrc, /rgba\(255, 196, 120, 0\.48\) 0%/, 'the nuri wash stops drifted');
});

// ---------------------------------------------------------------------------
// I. THE NAME WALKS (mumeix -> numeix)
// ---------------------------------------------------------------------------
ok('I1 — the finish seat + the theme seat speak numeix', () => {
  assert.match(constSrc, /\{ id: 'numeix', label: 'Numeix' \}/, 'the finish seat never moved');
  assert.match(constSrc, /id: 'numeix',\s*\n\s*name: 'Numeix',/, 'the theme seat never moved');
  assert.ok(!/\{ id: 'mumeix'/.test(constSrc), 'a bare mumeix id survived');
  assert.ok(!/name: 'Mumeix'/.test(constSrc), 'the Mumeix name survived');
  const ids = constSrc.match(/CARD_FINISHES = \[([\s\S]*?)\];/)?.[1] || '';
  const order = [...ids.matchAll(/\{ id: '(\w+)', label: '[^']+' \}/g)].map((m) => m[1]);
  assert.deepEqual(order, ['none', 'numeix', 'foil', 'auric', 'holographic', 'prismatic', 'nuri'], 'the ladder order broke: ' + order.join(','));
});
ok('I2 — every migration lane walks the old names home', () => {
  assert.match(constSrc, /v === 'chromatic' \|\| v === 'polychrome' \|\| v === 'opalescent' \|\| v === 'mumei' \|\| v === 'mumeix'\s*\n\s*\? 'numeix'/, 'the finish migration is missing');
  assert.match(helpersSrc, /const rawThemeId = rawSettings\.theme === 'mumei' \? 'numeix' : rawSettings\.theme;/, 'the theme sanitize migration is missing');
  assert.match(themeSrc, /const themeId = themeIdRaw === 'mumei' \? 'numeix' : themeIdRaw;/, 'the snapshot migration is missing');
  assert.match(mainSrc, /numeix: '#E7F5F9',/, 'the splash peek map never gained numeix');
  assert.match(mainSrc, /mumei: '#E7F5F9',/, 'the raw-disk peek lost its mumei key');
});
ok('I3 — the JSX + CSS speak the new name everywhere', () => {
  assert.match(ribbonSrc, /finish === 'numeix' && \(/, 'the seat family gate never moved');
  assert.match(ribbonSrc, /seat\('gd-finish-numeix'\)/, 'the body seat never moved');
  assert.match(ribbonSrc, /seat\('gd-numeix-dapple'\)/, 'the dapple seat never moved');
  assert.match(ribbonSrc, /finish !== 'numeix' && finish !== 'auric'/, 'the catch-all gate never moved');
  assert.match(ribbonSrc, /finish === 'numeix' \|\| finish === 'nuri' \|\| finish === 'auric'/, 'the artfin gate never moved');
  // CODE references only — the historical comments (the 1.4.9 rename
  // story, the 1.6.4 note) keep their voice.
  assert.ok(!/finish === 'mumeix'/.test(ribbonSrc), 'a bare mumeix finish gate survived');
  assert.ok(!/gd-finish-mumeix|gd-mumeix-|gd-artfin-mumeix/.test(ribbonSrc), 'a mumeix class survived the ribbon');
  assert.ok(cssSrc.includes('.gd-finish-numeix {') && cssSrc.includes('.gd-numeix-dapple::before') && cssSrc.includes('.gd-artfin-numeix {'), 'the numeix CSS families are missing');
  assert.ok(cssSrc.includes("[data-theme='numeix'] .gd-chip {"), 'the theme selector never moved');
  assert.ok(!/\.gd-finish-mumeix|\.gd-mumei-|gd-artfin-mumeix/.test(cssSrc), 'a mumeix class survived the CSS');
  assert.ok(!/\[data-theme='mumei'\]/.test(cssSrc), 'a mumei theme selector survived the CSS');
});

// ---------------------------------------------------------------------------
// J. THE DAPPLE'S SEAMS + THE THINNER CANOPY
// ---------------------------------------------------------------------------
ok('J1 — every edge-crossing bloom speaks its wrap twin', () => {
  const dapple = cssSrc.match(/\.gd-numeix-dapple::before \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(/cx='0' cy='80'/.test(dapple) && /cx='240' cy='80'/.test(dapple), 'the left-edge pair never closed');
  assert.ok(/cx='240' cy='220'/.test(dapple) && /cx='0' cy='220'/.test(dapple), 'the right-edge pair never closed');
  assert.ok(/cx='88' cy='10'/.test(dapple) && /cx='88' cy='250'/.test(dapple), 'the top-edge pair never closed');
  assert.ok(/gd-numeix-dapple-sw 34s/.test(dapple), 'the drift clock drifted');
});
ok('J2 — the canopy thins (fewer blooms, softer stops)', () => {
  const dapple = cssSrc.match(/\.gd-numeix-dapple::before \{[\s\S]*?\n\}/)?.[0] || '';
  assert.match(dapple, /stop-opacity='0\.24'/, 'the d1 stop never stepped down');
  assert.match(dapple, /stop-opacity='0\.2'/, 'the d2 stop never stepped down');
  assert.match(dapple, /stop-opacity='0\.16'/, 'the d3 stop never stepped down');
  // the SVG rides percent-encoded in the data URI (%3Cellipse / %3Ccircle)
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the tile is the seat's own
     BACKGROUND again (the 1.9.3 alpha-mask doubling retired with the
     derivation) — every bloom and spark dot speaks once, at the classic
     budget the 1.9.2 sheet drew. */
  const blooms = (dapple.match(/%3Cellipse/g) || []).length;
  assert.equal(blooms, 10, 'the bloom budget drifted (got ' + blooms + ')');
  const dots = (dapple.match(/%3Ccircle/g) || []).length;
  assert.equal(dots, 2, 'the spark dot budget drifted (got ' + dots + ')');
  const breath = cssSrc.match(/@keyframes gd-numeix-dapple-breath \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(breath.includes('opacity: 0.78;'), 'the breath floor drifted');
});

// ---------------------------------------------------------------------------
// K. THE CLEAN GEM
// ---------------------------------------------------------------------------
ok("K1 — the auric gem's stretched crown fill is retired", () => {
  const gems = cssSrc.match(/\.gd-auric-currents::before \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(!/M56 35 L63 45 L70 35 L63 31 Z/.test(gems), 'the crown fill survived the retirement');
  assert.ok(/M63 24 L80 45 L63 66 L46 45 Z/.test(gems), 'the big gem outline drifted');
  assert.ok(/M63 24 L63 66/.test(gems) && /M46 45 L80 45/.test(gems), 'the cross facets drifted');
});

// ---------------------------------------------------------------------------
// L. THE PRISM'S PACE
// ---------------------------------------------------------------------------
ok('L1 — every prism clock steps up ~30%', () => {
  assert.match(cssSrc, /gd-prism-drift-ne 11s linear infinite/, 'the drift clock never moved');
  assert.match(cssSrc, /gd-prism-hue 16s linear infinite/, 'the hue clock never moved');
  assert.match(cssSrc, /gd-prism-drift-sw 15s linear infinite/, 'the lattice clock never moved');
  assert.match(cssSrc, /gd-prism-sweep 7s ease-in-out infinite/, 'the sweep clock never moved');
  assert.ok(!/gd-prism-drift-ne 16s/.test(cssSrc) && !/gd-prism-sweep 9s/.test(cssSrc), 'an old slow clock survived');
});

// ---------------------------------------------------------------------------
// P. THE VERSION FURNITURE
// ---------------------------------------------------------------------------
ok('P1 — the version is 1.6.5 everywhere', () => {
  assert.match(pkgSrc, /"version": "1\.9\.19"/, 'package.json never moved');
  assert.match(lockSrc, /"version": "1\.9\.19"/, 'the lock root never moved');
  assert.match(constSrc, /version: '1\.9\.19',/, 'APP.version never moved');
  assert.match(readmeSrc, /\*\*v1\.9\.19\*\*/, 'the README header never moved');
  // 1.8.9 — THE README IS THE PUBLIC FACE: the version roll retired with it
  // (the first public release speaks features, not history; the changelog
  // keeps the story). The paragraph's old seat is gone by law.
  assert.ok(!/^1\.\d+\.\d+ — /m.test(readmeSrc), 'the version roll retired with the public README');
  assert.match(readmeSrc, /the regression battery \(93 DOM\/source test suites\)/, 'the README battery count never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(webSrc, /<span class="ver">v1\.8\.6<\/span>/, 'the website card never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(webSrc, /releases\/download\/v1\.8\.6\/Burrito%20GenDex-1\.8\.6%20Setup\.exe/, 'the installer URL never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(webSrc, /Burrito_GenDex_1\.8\.6_source\.zip/, 'the source URL never moved');
  assert.match(changeSrc, /^## 1\.9\.19 — The Ends Trade Places/, 'the changelog head never landed');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.ok(webSrc.includes('<tr class="current-row">\n          <td class="v">1.7.8</td>'), 'the website current-row never moved');
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

  // --- LIVE 1: the rename's migrations through the real sanitizer -----------
  await okAsync('LIVE1 — saved mumeix / mumei seats wake up as numeix', async () => {
    const db = createSafeDb({
      settings: { theme: 'mumei' },
      characters: [{
        id: 'c1', name: 'coatsy', classId: 'root', createdAt: 1,
        cardFinish: 'mumeix',
        versions: [{ id: 'v1', label: 'V1', images: [], parts: [] }],
        stamps: [],
      }, {
        id: 'c2', name: 'older', classId: 'root', createdAt: 2,
        cardFinish: 'mumei',
        versions: [{ id: 'v2', label: 'V1', images: [], parts: [] }],
        stamps: [],
      }],
    });
    assert.equal(db.settings.theme, 'numeix', 'the theme never walked home (got ' + db.settings.theme + ')');
    assert.equal(db.characters[0].cardFinish, 'numeix', 'the mumeix coat never walked home');
    assert.equal(db.characters[1].cardFinish, 'numeix', 'the mumei coat never walked home');
    const { THEME_PRESETS, CARD_FINISHES } = await import('../src/constants/index.js');
    assert.ok(THEME_PRESETS.some((t) => t.id === 'numeix' && t.name === 'Numeix'), 'the theme seat never spoke its new name');
    assert.ok(!THEME_PRESETS.some((t) => t.id === 'mumei'), 'the old theme id survived the preset ladder');
    assert.ok(CARD_FINISHES.some((f) => f.id === 'numeix' && f.label === 'Numeix'), 'the finish seat never spoke its new name');
    // the 1.6.3 shadow 'on' seat walks onto 'soft'
    const db2 = createSafeDb({ settings: { cardShadow: 'on' } });
    assert.equal(db2.settings.cardShadow, 'soft', "the 'on' seat never migrated onto soft (got " + db2.settings.cardShadow + ')');
    const db3 = createSafeDb({ settings: { cardShadow: 'junk' } });
    assert.equal(db3.settings.cardShadow, 'theme', 'junk never fell home');
  });

  // --- LIVE 2: the notes reader window through the real detail panel --------
  await okAsync('LIVE2 — the notes tab opens its big editor window (the stage + the COPY / DONE feet, live edits)', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const rt = createRoot(host);
    try {
      const db = createSafeDb(null);
      db.settings.tosAcceptance = { version: TOS_VERSION, at: 1 };
      db.settings.detailPanel = true;
      db.characters.push({
        id: 'char-n', name: 'notey', classId: 'root', createdAt: 1,
        versions: [{ id: 'vn', label: 'V1', images: [], notes: 'the harvest plan\nspans several lines\nof quiet thought', parts: [] }],
        stamps: [],
      });
      g.window.api = {
        loadDB: async () => ({ db, imagesPath: '/mock/images' }),
        saveDB: async () => ({ ok: true }), sendUnsavedState: () => {}, onPromptUnsaved: () => () => {},
        saveAndClose: async () => ({ ok: true }), forceClose: () => {}, windowControl: () => {},
        clipboardReadText: async () => '', clipboardWriteText: async () => {}, importImagesFromFiles: async () => [],
        saveImageBuffer: async () => ({ ok: true, file: 'x.png' }), deleteImageFile: async () => ({ ok: true }),
        onWindowMaximized: () => () => {}, onWindowUnmaximized: () => () => {}, openExternal: () => {},
      };
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
      /* 1.6.7 — the window is the big EDITOR now ("update the expanded
         window"): the expand key (the framed gd-icon-btn, Maximize2) opens
         NotesEditorWindow — the stage field carrying the note, the pinned
         COPY + DONE feet, and every keystroke landing LIVE in the row
         behind it. */
      const expandKey = [...document.querySelectorAll('button')].find((b) => /big editor window/i.test(b.title || ''));
      assert.ok(expandKey, "the notes' expand key never mounted");
      click(expandKey);
      await sleep(200);
      const stage = [...document.querySelectorAll('.gd-notes-stage')][0];
      assert.ok(stage, 'the notes editor window never opened');
      assert.ok((stage.value || '').includes('the harvest plan'), 'the big stage never carried the note');
      const copyFoot = [...document.querySelectorAll('button')].find((b) => /^COPY$/i.test((b.textContent || '').trim()));
      assert.ok(copyFoot, "the window's COPY foot never mounted");
      const done = [...document.querySelectorAll('button')].find((b) => /^DONE$/i.test((b.textContent || '').trim()));
      assert.ok(done, "the window's DONE foot never mounted");
      // LIVE EDIT: a keystroke in the stage lands in the row's own well.
      const rowWell = [...document.querySelectorAll('.gd-notes-box textarea')][0];
      assert.ok(rowWell, "the notes box's own well never mounted (1.6.7: the parts' container law)");
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(stage, 'the harvest plan\nspans several lines\nof quiet thought — edited live');
      stage.dispatchEvent(new window.Event('input', { bubbles: true }));
      await sleep(300);
      assert.ok((rowWell.value || '').includes('edited live'), 'the live edit never landed in the row behind the window');
      click(done);
      await sleep(200);
      assert.ok(!document.querySelector('.gd-notes-stage'), 'the notes window never closed');
    } finally {
      rt.unmount();
      host.remove();
    }
  });

  // --- LIVE 3: the dials' root attributes through a real boot ---------------
  await okAsync('LIVE3 — the audit dials ride the root as data attributes', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const rt = createRoot(host);
    try {
      const db = createSafeDb({ settings: { cardShadow: 'sharp', trimLines: 'dashed', stampTilt: 'tilted' } });
      db.settings.tosAcceptance = { version: TOS_VERSION, at: 1 };
      db.settings.detailPanel = true;
      g.window.api = {
        loadDB: async () => ({ db, imagesPath: '/mock/images' }),
        saveDB: async () => ({ ok: true }), sendUnsavedState: () => {}, onPromptUnsaved: () => () => {},
        saveAndClose: async () => ({ ok: true }), forceClose: () => {}, windowControl: () => {},
        clipboardReadText: async () => '', clipboardWriteText: async () => {}, importImagesFromFiles: async () => [],
        saveImageBuffer: async () => ({ ok: true, file: 'x.png' }), deleteImageFile: async () => ({ ok: true }),
        onWindowMaximized: () => () => {}, onWindowUnmaximized: () => () => {}, openExternal: () => {},
      };
      localStorage.setItem('gd:last-run-version', '1.9.19');
      rt.render(React.createElement(App));
      await sleep(3400);
      const root = document.documentElement;
      assert.equal(root.dataset.gdCardShadow, 'sharp', 'the shadow style attribute never mounted');
      assert.equal(root.dataset.gdTrimLines, 'dashed', 'the trim-lines attribute never mounted');
      assert.equal(root.dataset.gdStampTilt, 'tilted', 'the stamp-tilt attribute never mounted');
      assert.equal(root.dataset.theme, 'zine', 'the boot theme drifted');
    } finally {
      delete document.documentElement.dataset.gdCardShadow;
      delete document.documentElement.dataset.gdTrimLines;
      delete document.documentElement.dataset.gdStampTilt;
      rt.unmount();
      host.remove();
    }
  });

  console.log(errors.length ? `\n  render errors: ${errors.slice(0, 3).join('\n    ')}\n` : '');
  if (errors.length) failed += 1;
} else {
  console.log('  (jsdom unavailable — LIVE passes skipped)');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
