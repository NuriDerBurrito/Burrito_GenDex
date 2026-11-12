// 1.6.3 batch — The Stack Finds Its Voice.
// (Named 168 in the sequence: 159 -> 1.4.9, 160 -> 1.5.4, 161 -> 1.5.5,
//  162 -> 1.5.6, 163 -> 1.5.7, 164 -> 1.5.8, 165 -> 1.5.9, 166 -> 1.6.0,
//  167 -> 1.6.2.)
// The reported items, each pinned at its root law:
//   A.  THE PARTS GAIN THEIR VOICES (copy / expand / coloring + the notes'
//       own expand; the part's color rides the part through the sanitize
//       ladder; the expand posture is field-sizing, capped)
//   B.  THE BOARD SPEAKS ITS MOVES (the live gap previews the exact splice
//       the drop commits; the class-switch projection rest is retired)
//   C.  THE SWAP FLIGHT IS A PURE FADE (nothing descends; the seats keep
//       their law, the transform is gone)
//   D.  THE DRAFT RETURNS TO THE THEME (trimColor joins the reseed law)
//   E.  THE PICKER'S KEY IS A RESET (RotateCcw, unsets — never red; every
//       seat threads the road home; the hue's default stays white)
//   F.  THE GOODBYE IS A FADE THAT READS (0.22s ease-out, opacity first —
//       the ease-in that hid it retired with the settle)
//   G.  THE CARD'S OWN DIALS (corners through the theme lane; shadow +
//       hover through the :root[data-gd-*] ladders; the settings seats)
//   H.  THE CORNER SEAM DIES (the curve ring hugs the clip's own arc,
//       clipped flush at the seam, collapsing on square styles)
//   I.  THE WINGS MIRROR (the right reel pair swaps directions)
//   J.  THE RING SPEAKS LOUDER (the keyline + halo beyond the accent line)
//   K.  THE NOTE EXPAND + the status verdict rides down to the part rows
// Plus the version furniture and live jsdom passes (the parts' three keys
// through the real detail panel, the live gap through a real dragover, the
// picker's reset through the real panel, the goodbye clock through the real
// Popover).

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

const appSrc = src('src/App.jsx');
const masonrySrc = src('src/components/MasonryGrid.jsx');
const gridSrc = src('src/components/GridView.jsx');
const cvSrc = src('src/components/CharacterView.jsx');
const partSrc = src('src/components/PartEditor.jsx');
const pickerSrc = src('src/components/ColorPicker.jsx');
const stampColorSrc = src('src/components/StampColorControls.jsx');
const lookSrc = src('src/components/CardLookEditor.jsx');
const ncmSrc = src('src/components/NewCharacterModal.jsx');
const splashSrc = src('src/components/Splash.jsx');
const popSrc = src('src/components/Popover.jsx');
const settingsSrc = src('src/components/SettingsModal.jsx');
const themeSrc = src('src/utils/theme.js');
const cssSrc = src('src/index.css');
const constSrc = src('src/constants/index.js');
const helpersSrc = src('src/utils/helpers.js');
const pkgSrc = src('package.json');
const lockSrc = src('package-lock.json');
const readmeSrc = src('README.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const changeSrc = src('CHANGELOG.md');

// ---------------------------------------------------------------------------
// A. THE PARTS GAIN THEIR VOICES
// ---------------------------------------------------------------------------
ok('A1 — every part row owns its COPY key (self-confirming, status verdict)', () => {
  assert.match(partSrc, /copyContent = async \(\) => \{/, 'the copy law never mounted');
  assert.match(partSrc, /clipboardWriteText\(text\)/, 'the clipboard lane is missing');
  assert.match(partSrc, /is-copied/, 'the confirmed face is missing');
  assert.match(partSrc, /Part "\$\{stripRichText\(part\.name \|\| 'part'\)\}" copied/, 'the status verdict never names the part');
});
ok('A2 — the EXPAND key opens the READER\'S WINDOW (fade in / fade out, the big page)', () => {
  /* 1.6.5 supersede: the parts' window is the 1.5.2 big EDITOR now
     (PromptExpandWindow — live edits, the stage field); the notes keep
     the reader (the .gd-reader-doc law stays for THEIR window).
     1.6.7 supersede: the notes' reader grew into the big EDITOR too
     (NotesEditorWindow — see A6), and the stage law speaks BOTH stages
     (.gd-prompt-stage + .gd-notes-stage in one selector list). */
  assert.match(partSrc, /function PromptExpandWindow\(/, 'the big editor never mounted');
  assert.match(partSrc, /import Modal from '\.\/Modal\.jsx';/, 'the window never spoke the Modal family');
  assert.match(partSrc, /onExpand=\{openReader\}/, 'the expand key never threaded the window');
  assert.match(partSrc, /<Maximize2 size=\{12\} \/>/, 'the window glyph never mounted');
  assert.match(partSrc, /title="PROMPT EDITOR"/, 'the editor window never named itself');
  assert.match(partSrc, /'gd-input gd-prompt-stage',/, 'the stage field never seated (1.6.8: clsx + the container color)');
  assert.match(cssSrc, /\.gd-prompt-stage,\s*\n\.gd-notes-stage \{[\s\S]*?height: 58vh;/, 'the stage law is missing (1.6.7: both stages speak it)');
  assert.match(cssSrc, /\.gd-reader-doc \{/, 'the notes reader page law is missing');
  assert.ok(!/field-sizing: content;/.test(cssSrc), 'the 1.6.3 in-place posture survived the window law');
  assert.ok(!/is-open/.test(partSrc), 'the row still speaks the old open class');
});
ok('A3 — the COLOR key opens the house picker with a THEME DEFAULT road home', () => {
  /* 1.6.5 supersede: the color speaks the 1.5.2 law — the corner CHIP
     opens the COLOR WINDOW (the class/card ladder: null + presets + the
     custom picker), every pick landing live. */
  assert.match(partSrc, /function PartColorWindow\(/, 'the color window never mounted');
  assert.match(partSrc, /CLASS_COLOR_PRESETS\.map/, 'the preset ladder is missing');
  assert.match(partSrc, /onColor=\{openColor\}/, 'the chip never threaded the window');
  assert.match(partSrc, /onPatch\(part\.id, \{ color: preset \}\)/, 'the presets never write the part ink');
  assert.match(partSrc, /onPatch\(part\.id, \{ color: hexOrNull \}\)/, 'the custom picker never writes the part ink');
  assert.match(partSrc, /onPatch\(part\.id, \{ color: null \}\)/, 'the road home never unsets the ink');
  assert.match(partSrc, /onColor=\{\(hexOrNull\) => onPatch\(part\.id, \{ color: hexOrNull \}\)\}/, 'the picker lane never speaks null');
});
ok('A4 — the part ink tints the WHOLE row through --gd-part-ink', () => {
  /* 1.6.5 supersede: the paint speaks the 1.5.2 WASH — the is-colored
     scope + --part-color tint the frame, the face and the ground shadow;
     the 1.6.3/1.6.4 whole-row --gd-part-ink consumers are retired. */
  assert.match(partSrc, /part\.color && 'is-colored'/, 'the scope class never rides the row');
  assert.match(partSrc, /\['--part-color'\]: part\.color/, 'the color var never rides the row');
  // 1.7.0 — the frame rings the FACE (the color's own ground) instead of the
  // theme's ink: the same tinted law, spoken without leaning on the theme.
  // 1.7.4 supersede: the frame speaks the OUTLINE INK — the old 72% wash
  // survives as var(--part-line,'s fallback (the ladder's measured line).
  assert.match(cssSrc, /\.gd-part-row\.is-colored \{[\s\S]*?border-color: var\(--part-line, color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 72%, var\(--part-face/, 'the tinted frame law is missing');
  assert.match(cssSrc, /\.gd-part-color-chip \{[\s\S]*?right: -7px;[\s\S]*?bottom: -7px;/, 'the 1.5.2 corner chip law is missing');
  assert.ok(!/var\(--gd-part-ink/.test(cssSrc), 'the old ink consumers survived');
});
ok('A5 — the part color rides the part through the sanitize ladder', () => {
  assert.match(helpersSrc, /color: isHexColor\(part\?\.color\) \? part\.color : null,/, 'sanitizePart never carries the ink');
  assert.match(constSrc, /color: null,\n\}\);/, 'makePart never carries the ink seat');
});
ok('A6 — the NOTES own their reader window (the same law, new icons)', () => {
  assert.match(cvSrc, /const \[notesReaderOpen, setNotesReaderOpen\] = useState\(false\);/, 'the notes window state is missing');
  /* 1.6.7 supersede: the notes' reader grew into the big EDITOR
     ("update the expanded window" — NotesEditorWindow, live edits
     through setNotes, the .gd-notes-stage field, the pinned COPY + DONE
     foot) and the notes box joined the parts' container law (the framed
     .gd-notes-box + the corner color chip + the notes' own COLOR
     window). The pin reads the editor + the color seat. */
  assert.match(cvSrc, /function NotesEditorWindow\(/, 'the notes editor never mounted');
  assert.match(cvSrc, /function NotesColorWindow\(/, 'the notes color window never mounted');
  assert.match(cvSrc, /<NotesEditorWindow/, 'the notes editor window never threaded');
  assert.match(cvSrc, /<NotesColorWindow/, 'the notes color window never threaded');
  assert.match(cvSrc, /gd-notes-box/, 'the notes never joined the parts\' container law');
  assert.match(cvSrc, /'gd-input gd-notes-stage',/, 'the notes stage never seated (1.6.8: clsx + the container color)');
  assert.match(cvSrc, /<Maximize2 size=\{12\} \/>/, 'the notes glyph never changed');
  assert.ok(!/notesOpen && 'is-open'/.test(cvSrc), 'the old posture law survived');
  assert.ok(!/FoldVertical|UnfoldVertical/.test(cvSrc), 'the old unfold glyphs survived the icon change');
  assert.match(cvSrc, /onStatus=\{onStatus\}/, 'the status verdict never rode down to the part rows');
});

// ---------------------------------------------------------------------------
// B. THE BOARD SPEAKS ITS MOVES
// ---------------------------------------------------------------------------
ok('B1 — the LIVE GAP previews the exact splice the drop commits', () => {
  assert.match(gridSrc, /const \[dragPreview, setDragPreview\] = useState\(null\);/, 'the preview state is missing');
  assert.match(gridSrc, /const previewOrder = useCallback\(/, 'the preview splice law is missing');
  assert.match(gridSrc, /if \(drag\.side === 'right'\) ti \+= 1;/, 'the splice never speaks the drop semantics');
  assert.match(gridSrc, /const previewed = previewOrder\(ids, dragPreview\);/, 'the pack order never rides the preview');
});
ok('B2 — the preview arms behind the guards, holds its seat on the leave, retires on every ending', () => {
  assert.match(gridSrc, /dragPreviewRef\.current = next;/, 'the dragover arm is missing');
  assert.match(gridSrc, /if \(side === 'right' && tIdx === curIdx - 1\) return;/, 'the straddle guard (right) is missing');
  assert.match(gridSrc, /if \(side === 'left' && tIdx === curIdx \+ 1\) return;/, 'the straddle guard (left) is missing');
  assert.match(gridSrc, /curOrder\.every\(\(v, i\) => v === nextOrder\[i\]\)/, 'the order-equality gate is missing');
  assert.ok(!/if \(prev && prev\.over === id\) \{/.test(gridSrc), 'the leaveCard walk-home survived the seat-holding law');
  /* 1.6.5 supersede: a self-drop COMMITS THE PREVIEW now (the dragged
     card glides under the cursor — the release lands on itself); the
     drop reads the preview before retiring it.
     1.6.7 supersede: EVERY drop commits the preview (the commit is the
     preview, full stop — the event's target and the hint's side both
     lied after layout shifts; see dropOnCard's 1.6.7 note), and the
     stillness guard rides between the preventDefault and the same-card
     lane (a layout-shift echo never re-arms the preview). */
  assert.match(gridSrc, /const preview = dragPreviewRef\.current;[\s\S]*?dragPreviewRef\.current = null;\s*\n\s*armPtRef\.current = null;\s*\n\s*setDragPreview\(null\);\s*\n\s*dragRef\.current = null;\s*\n\s*dropSeatRef\.current = null;\s*\n\s*if \(seat && seat\.over != null && seat\.over !== drag\.id\) \{/, 'the preview commit is missing (1.6.8: the seat memory; 1.6.9: the fresh-seat drop clears the arm-point with the seat)');
  assert.match(gridSrc, /onReorder\(drag\.id, seat\.over, seat\.side\);/, 'the preview commit never spoke (1.6.8: the seat speaks)');
  assert.match(gridSrc, /e\.preventDefault\(\);\s*\n\s*\/\/ 1\.6\.7 — THE STILL POINTER'S GUARD/, 'the preventDefault no longer speaks first (1.6.7: the guard rides after it)');
  assert.match(gridSrc, /this is the belt for every OTHER ending/, 'the dragend belt is missing');
});
ok('B3 — the class-switch projection rest is RETIRED (survivors glide)', () => {
  assert.match(masonrySrc, /layout=\{flighting \? false : 'position'\}/, 'the projection still rests on a set change');
  assert.ok(!/flighting \|\| setSwapped \? false : 'position'/.test(masonrySrc), 'the 0.37 teleport law survived');
  assert.match(masonrySrc, /void setSwapped;/, 'the retired measure is not marked');
});

// ---------------------------------------------------------------------------
// C. THE SWAP FLIGHT IS A PURE FADE
// ---------------------------------------------------------------------------
ok('C1 — the keyframes speak opacity alone (nothing descends)', () => {
  const kf = cssSrc.match(/@keyframes gd-cv-swap \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(kf.includes('opacity: 0;'), 'the fade never opened');
  assert.ok(!/translateY/.test(kf), 'the settle survived the pure-fade law (the exact report)');
});
ok('C2 — the seats keep their law (the plate never fades, the arm still retires)', () => {
  /* 1.6.7 supersede: the picture alone breathes — the scroller/header
     seats the pin guarded retired with the owner's 1.6.7 list; the
     flight's one seat is the image column's pictures. */
  assert.ok(!/\.gd-cv-swap > \*:not\(\.gd-char-head\)/.test(cssSrc), 'the retired scroller seat survived (1.6.7)');
  assert.ok(!/\.gd-cv-swap \.gd-char-head > \*:not\(\.gd-rows-tray\)/.test(cssSrc), 'the retired header seat survived');
  assert.ok(/\.gd-cv-swap \.gd-cardcol \.gd-stage-pictures,/.test(cssSrc), 'the pictures never found their seat (1.6.8: the content group)');
});

// ---------------------------------------------------------------------------
// D. THE DRAFT RETURNS TO THE THEME
// ---------------------------------------------------------------------------
ok("D1 — trimColor joins the retained seat\'s RESET law", () => {
  assert.match(ncmSrc, /setTrimColor\(null\);/, 'the trim ink never re-seeds');
  const reseed = ncmSrc.match(/useLayoutEffect\(\(\) => \{[\s\S]{0,2000}?setTrim\(DEFAULT_CARD_TRIM\);([\s\S]{0,600}?)setCrop\(null\);/)?.[0] || '';
  assert.ok(reseed.includes('setTrimColor(null);'), 'the reseed law speaks the trim but not its ink');
});

// ---------------------------------------------------------------------------
// E. THE PICKER'S KEY IS A RESET
// ---------------------------------------------------------------------------
ok('E1 — the hex-area key is a RESET (RotateCcw, unsets — never red)', () => {
  assert.match(pickerSrc, /onReset = null,/, 'the reset lane never threaded the panel');
  assert.match(pickerSrc, /onReset \? <RotateCcw size=\{11\} \/> : <Pipette size=\{11\} \/>/, 'the glyph never swapped');
  assert.match(pickerSrc, /onClick=\{\(\) => \(onReset \? onReset\(\) : emitAndCommit\('#c8402f'\)\)\}/, 'the reset never speaks');
  assert.match(pickerSrc, /Remove the custom color — return to the default/, 'the reset title is missing');
});
ok('E2 — the HUE seat unsets to its white default', () => {
  assert.match(stampColorSrc, /onReset=\{\(\) => onColor\?\.\(null\)\}/, 'the hue reset never threaded');
  assert.match(stampColorSrc, /const hue = custom \|\| DEFAULT_STAMP_COLOR;/, 'the white default law drifted');
  assert.match(constSrc, /DEFAULT_STAMP_COLOR = '#ffffff';/, 'the white default itself drifted');
});
ok('E3 — every picker seat threads the road home', () => {
  const seats = [cvSrc, ncmSrc, settingsSrc, src('src/components/ClassSidebar.jsx'), src('src/components/TagManagerModal.jsx'), src('src/components/VersionSettingsModal.jsx'), lookSrc, stampColorSrc];
  const withReset = seats.filter((s) => /onReset=\{/.test(s)).length;
  assert.equal(withReset, seats.length, `only ${withReset}/${seats.length} seats thread the reset`);
});
ok("E4 — the trim picker's own road home survived the rework", () => {
  assert.match(lookSrc, /onReset=\{\(\) => onColor\(null\)\}/, 'the trim seat lost its reset');
});

// ---------------------------------------------------------------------------
// F. THE GOODBYE IS A FADE THAT READS
// ---------------------------------------------------------------------------
ok('F1 — the exit is a 0.22s ease-out pure fade (opacity first)', () => {
  assert.match(cssSrc, /animation: gd-pop-out 0\.22s ease-out forwards;/, 'the readable fade is missing');
  const kf = cssSrc.match(/@keyframes gd-pop-out \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(kf.includes('opacity: 1;') && kf.includes('opacity: 0;'), 'the fade keyframes drifted');
  assert.ok(!/transform/.test(kf), 'the settle/rise whisper survived (it hid the fade)');
});
ok("F2 — Popover's leaving clock walks with the CSS flight (220ms)", () => {
  assert.match(popSrc, /\}, 220\);/, 'the clock never walked with the flight');
  assert.ok(!/\}, 170\);/.test(popSrc), 'the old 170ms clock survived');
});

// ---------------------------------------------------------------------------
// G. THE CARD'S OWN DIALS
// ---------------------------------------------------------------------------
ok('G1 — the three dials ride DEFAULT_SETTINGS at their theme law', () => {
  assert.match(constSrc, /cardCorners: 'theme',/, 'the corners dial never defaulted');
  assert.match(constSrc, /cardShadow: 'theme',/, 'the shadow dial never defaulted');
  assert.match(constSrc, /cardHover: 'theme',/, 'the hover dial never defaulted');
});
ok('G2 — the sanitize ladder carries the five dials (+ the on-to-soft migration)', () => {
  assert.match(helpersSrc, /cardCorners: \['theme', 'round', 'square'\]\.includes\(rawSettings\.cardCorners\)/, 'the corners ladder is missing');
  assert.match(helpersSrc, /cardShadow: rawSettings\.cardShadow === 'on'\s*\n\s*\? 'soft'/, 'the on-to-soft migration is missing');
  assert.match(helpersSrc, /\['theme', 'off', 'soft', 'sharp'\]\.includes\(rawSettings\.cardShadow\)/, 'the shadow style ladder is missing');
  assert.match(helpersSrc, /cardHover: \['theme', 'up', 'corner', 'none'\]\.includes\(rawSettings\.cardHover\)/, 'the hover ladder is missing');
  assert.match(helpersSrc, /trimLines: \['theme', 'solid', 'dashed'\]\.includes\(rawSettings\.trimLines\)/, 'the trim-lines ladder is missing');
  assert.match(helpersSrc, /stampTilt: \['theme', 'flat', 'tilted'\]\.includes\(rawSettings\.stampTilt\)/, 'the stamp-tilt ladder is missing');
});
ok('G3 — the corners dial rewrites --gd-shape-radius in the theme lane', () => {
  assert.match(themeSrc, /const cardShapeId = \['theme', 'round', 'square'\]\.includes\(cardCorners\) \? cardCorners : 'theme';/, 'the dial never resolved');
  assert.match(themeSrc, /root\.style\.setProperty\('--gd-shape-radius', SHAPE_RADIUS\[cardShapeId\] \|\| surfaceShape\);/, 'the radius rewrite is missing');
  assert.match(themeSrc, /snap\.cardCorners \|\| 'theme'/, 'the boot snapshot never replays the dial');
});
ok('G4 — the shadow + hover dials ride the root as data attributes', () => {
  assert.match(appSrc, /document\.documentElement\.dataset\.gdCardShadow = cardShadow;/, 'the shadow attribute never mounted');
  assert.match(appSrc, /document\.documentElement\.dataset\.gdCardHover = cardHover;/, 'the hover attribute never mounted');
  assert.match(appSrc, /setThemeOnDocumentLive\(themeId, themeColors, themeTextures, themeButtonStyle \|\| 'theme', themeUiFont \|\| 'mono', themeCardCorners \|\| 'theme'\)/, 'App never threaded the corners dial');
});
ok('G5 — the CSS ladders outrank every theme (the style + audit seats)', () => {
  assert.match(cssSrc, /:root\[data-gd-card-shadow='off'\] \.gd-card,/, "the off ladder's resting seat is missing");
  assert.match(cssSrc, /:root\[data-gd-card-shadow='soft'\] \.gd-card,/, "the soft ladder's resting seat is missing");
  assert.match(cssSrc, /:root\[data-gd-card-shadow='sharp'\] \.gd-card,/, 'the sharp ladder is missing');
  assert.ok(!/:root\[data-gd-card-shadow='on'\]/.test(cssSrc), "the retired 'on' ladder survived");
  assert.match(cssSrc, /:root\[data-gd-card-hover='up'\] \.gd-card-hover:hover,/, "the up ladder is missing");
  assert.match(cssSrc, /:root\[data-gd-card-hover='corner'\] \.gd-card-hover:hover,/, "the corner ladder is missing");
  assert.match(cssSrc, /:root\[data-gd-card-hover='none'\] \.gd-card-hover:hover,/, "the none ladder is missing");
  assert.match(cssSrc, /:root\[data-gd-trim-lines='dashed'\] \.gd-chip,/, 'the dashed trim ladder is missing');
  assert.match(cssSrc, /:root\[data-gd-trim-lines='solid'\] \.gd-chip,/, 'the solid trim ladder is missing');
  assert.match(cssSrc, /:root\[data-gd-stamp-tilt='flat'\] \.gd-stamp \{/, 'the flat stamp ladder is missing');
  assert.match(cssSrc, /:root\[data-gd-stamp-tilt='tilted'\] \.gd-stamp \{/, 'the tilted stamp ladder is missing');
});
ok('G6 — the Look tab seats the three dials', () => {
  assert.match(settingsSrc, /title="CARD CORNERS"/, 'the corners card never seated');
  assert.match(settingsSrc, /title="CARD SHADOW"/, 'the shadow card never seated');
  assert.match(settingsSrc, /title="CARD HOVER"/, 'the hover card never seated');
  assert.match(settingsSrc, /onPick=\{\(id\) => set\('cardCorners', id\)\}/, 'the corners dial never commits');
});

// ---------------------------------------------------------------------------
// H. THE CORNER SEAM DIES
// ---------------------------------------------------------------------------
ok("H1 — the curve ring is RETIRED (the sleeve + panzoom pair carry no pseudo)", () => {
  assert.ok(!/\.gd-sleeve::before[\s\S]{0,40}\.gd-panzoom::before \{/.test(cssSrc), 'the ring survived the retirement');
  assert.ok(!/box-shadow: 0 0 0 min\(4px/.test(cssSrc), 'the collapsing spread survived');
  assert.ok(!/color-mix\(in srgb, var\(--gd-ink\) 62%, var\(--gd-bg\)\)/.test(cssSrc), 'the ring ink survived');
  assert.match(cssSrc, /1\.6\.4 — THE CURVE RING IS RETIRED/, 'the retirement note never landed');
});
ok("H2 — no seam-side clip-path ring rides the sleeve (the label's face keeps its plate)", () => {
  assert.ok(!/clip-path: inset\(-5px -5px 0 -5px\);/.test(cssSrc), 'the ring clip survived the retirement');
});
ok("H3 — the plate's own laws survived (the rise keeps its square fill + the bloom)", () => {
  assert.match(cssSrc, /background: var\(--gd-foot-plate, transparent\);/, 'the plate fill drifted');
  assert.match(cssSrc, /\.gd-card-foot-vers\.is-colored::before \{[\s\S]{0,240}?rgba\(255, 255, 255, 0\.13\)/, 'the colored bloom drifted');
});

// ---------------------------------------------------------------------------
// I. THE WINGS MIRROR
// ---------------------------------------------------------------------------
ok('I1 — the right reel pair swaps its directions', () => {
  const seats = splashSrc.match(/const REEL_SEATS = \[([\s\S]*?)\];/)?.[1] || '';
  assert.ok(/seat: 'ri', dir: 'down'/.test(seats), 'the inner right reel still climbs');
  assert.ok(/seat: 'ro', dir: 'up'/.test(seats), 'the outer right reel still falls');
  assert.ok(/seat: 'lo', dir: 'up'/.test(seats) && /seat: 'li', dir: 'down'/.test(seats), 'the left wing drifted');
});

// ---------------------------------------------------------------------------
// J. THE RING SPEAKS LOUDER
// ---------------------------------------------------------------------------
ok('J1 — the selected ring gains its keyline + halo', () => {
  /* 1.6.5 supersede: the ring speaks its own ground — the clean lane
     (the viewer's deep band), the ink keyline, and the glow beyond;
     the breath swells the glow alone (10px -> 12px). */
  assert.match(cssSrc, /box-shadow:\s*\n\s*0 0 0 2\.5px color-mix\(in srgb, var\(--gd-tier-deep, var\(--gd-bg\)\) 95%, transparent\),\s*\n\s*0 0 0 4px color-mix\(in srgb, var\(--gd-ink\) 68%, transparent\),\s*\n\s*0 0 0 10px color-mix\(in srgb, var\(--gd-accent\) 30%, transparent\);/, 'the three-voice ring law is missing');
  assert.match(cssSrc, /border: 2px solid var\(--gd-accent\);/, 'the accent line itself drifted');
  const kf = cssSrc.match(/@keyframes gd-selected-breathe \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(kf.includes('0 0 0 10px') && kf.includes('0 0 0 12px'), 'the glow swell never spoke');
});

// ---------------------------------------------------------------------------
// K. THE VERSION FURNITURE
// ---------------------------------------------------------------------------
ok('K1 — the version is 1.6.5 everywhere', () => {
  assert.match(pkgSrc, /"version": "1\.9\.19"/, 'package.json never moved');
  assert.match(lockSrc, /"version": "1\.9\.19"/, 'the lock root never moved');
  assert.match(constSrc, /version: '1\.9\.19',/, 'APP.version never moved');
  assert.match(readmeSrc, /\*\*v1\.9\.19\*\*/, 'the README header never moved');
  // 1.8.9 — THE README IS THE PUBLIC FACE: the version roll retired with it
  // (the first public release speaks features, not history; the changelog
  // keeps the story). The paragraph's old seat is gone by law.
  assert.ok(!/^1\.\d+\.\d+ — /m.test(readmeSrc), 'the version roll retired with the public README');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(webSrc, /v1\.6\.5/, 'the website card never moved');
  assert.match(changeSrc, /## 1\.6\.5 — The Prompt Comes Home/, 'the CHANGELOG entry never landed');
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

  // --- LIVE 1: the parts' three keys through the real detail panel ---------
  await okAsync('LIVE1 — the parts own their copy / expand / color keys in the live panel', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const rt = createRoot(host);
    try {
      const db = createSafeDb(null);
      db.settings.tosAcceptance = { version: TOS_VERSION, at: 1 };
      db.settings.detailPanel = true;
      db.characters.push({
        id: 'char-p', name: 'partsy', classId: 'root', createdAt: 1,
        versions: [{ id: 'vp', label: 'V1', images: [], notes: '', parts: [
          { id: 'pa', name: 'body', content: 'a tall warrior', include: true, color: null },
          { id: 'pb', name: 'face', content: 'scar over the eye', include: true, color: '#15b2cf' },
        ] }],
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
      const card = [...document.querySelectorAll('.gd-card')].find((c) => (c.textContent || '').includes('partsy'));
      assert.ok(card, 'the card never mounted');
      click(card);
      await sleep(400);
      const rows = [...document.querySelectorAll('.gd-part-row')];
      assert.equal(rows.length, 2, 'the part rows never mounted (got ' + rows.length + ')');
      const colored = rows.find((r) => (r.textContent || '').includes('face'));
      assert.ok(colored && (colored.getAttribute('style') || '').includes('--part-color: #15b2cf'), 'the picked color never rode the row');
      assert.ok(colored && colored.className.includes('is-colored'), 'the picked row never spoke its scope class');
      const plain = rows.find((r) => (r.textContent || '').includes('body'));
      assert.ok(plain && !String(plain.getAttribute('style') || '').includes('--part-color'), 'the uncolored row carries a phantom color');
      const copyKey = [...plain.querySelectorAll('button')].find((b) => /copy this part/i.test(b.title || ''));
      assert.ok(copyKey, 'the COPY key never mounted');
      const expandKey = [...plain.querySelectorAll('button')].find((b) => /big editor window/i.test(b.title || ''));
      assert.ok(expandKey, 'the EXPAND key never mounted');
      const colorKey = [...plain.querySelectorAll('.gd-part-color-chip')][0];
      assert.ok(colorKey, 'the color chip never mounted on the row');
      assert.ok(colorKey.closest('.gd-part-row') === plain, 'the chip left the row it colors');
      const coloredChip = [...colored.querySelectorAll('.gd-part-color-chip')][0];
      assert.ok(coloredChip && !coloredChip.className.includes('is-empty'), 'the picked row never filled its chip');
      assert.ok(plain.querySelector('.gd-part-color-chip').className.includes('is-empty'), 'the uncolored chip never spoke its hollow voice');
      const well = plain.querySelector('textarea.gd-prompt-box');
      assert.ok(well && !well.className.includes('is-open'), 'the well mounted open');
      click(expandKey);
      await sleep(220);
      const stage = [...document.querySelectorAll('textarea.gd-prompt-stage')][0];
      assert.ok(stage, 'the big editor window never opened (no stage field)');
      assert.equal(stage.value, 'a tall warrior', 'the stage never carried the content');
      const editorDone = [...document.querySelectorAll('button')].find((b) => /^DONE$/i.test((b.textContent || '').trim()));
      assert.ok(editorDone, 'the editor never carried its DONE foot');
      // live edits land through the patch road
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      setter.call(stage, 'a tall warrior, gold armor');
      stage.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      await sleep(260);
      assert.equal(well.value, 'a tall warrior, gold armor', 'the live edit never landed in the row');
      click(editorDone);
      await sleep(160);
      assert.ok(!document.querySelector('textarea.gd-prompt-stage'), 'the editor window never closed');
      click(colorKey);
      await sleep(220);
      const ladder = document.querySelector('[data-gd-modal] .gd-cls-presets');
      assert.ok(ladder, 'the color window never opened (no ladder)');
      const nullKey = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === '∅');
      assert.ok(nullKey, 'the null road home never mounted');
      const preset = [...(ladder ? ladder.querySelectorAll('.gd-cls-preset') : [])][0];
      assert.ok(preset, 'the preset ladder never mounted');
      if (preset) {
        click(preset);
        await sleep(260);
        const picked = rows.find((r) => (r.textContent || '').includes('body'));
        assert.ok(picked && (picked.getAttribute('style') || '').includes('--part-color: #c8402f'), 'the live pick never landed on the row');
      }
    } finally {
      rt.unmount();
      host.remove();
    }
  });

  // --- LIVE 2: the live gap through a real dragover ------------------------
  await okAsync('LIVE2 — a drag previews the reorder (the gap moves while the card is in hand)', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const rt = createRoot(host);
    try {
      const db = createSafeDb(null);
      db.settings.tosAcceptance = { version: TOS_VERSION, at: 1 };
      // 1.9.12 — the default rests OFF now; the fixture speaks the ON road
      // (these suites pin the live-preview feature, not the default)
      db.settings.liveDragPreview = true;
      for (const n of ['aaa', 'bbb', 'ccc']) {
        db.characters.push({ id: 'char-' + n, name: n, classId: 'root', createdAt: 1, versions: [{ id: 'v' + n, label: 'V1', images: [], parts: [] }], stamps: [] });
      }
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
      const cardOf = (n) => [...document.querySelectorAll('[data-gd-char-id]')].find((d) => d.getAttribute('data-gd-char-id') === 'char-' + n);
      const order = () => [...document.querySelectorAll('[data-gd-char-id]')].map((d) => d.getAttribute('data-gd-char-id').replace('char-', ''));
      const aaa = cardOf('aaa');
      const ccc = cardOf('ccc');
      assert.ok(aaa && ccc, 'the cards never mounted');
      assert.equal(order().join(','), 'aaa,bbb,ccc', 'the base order is wrong (' + order().join(',') + ')');
      const dt = { effectAllowed: '', setData: () => {}, setDragImage: () => {} };
      const startEv = new dom.window.MouseEvent('dragstart', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 });
      Object.defineProperty(startEv, 'dataTransfer', { value: dt });
      Object.defineProperty(aaa, 'getBoundingClientRect', { value: () => ({ width: 236, height: 340, left: 10, top: 10, right: 246, bottom: 350 }) });
      Object.defineProperty(ccc, 'getBoundingClientRect', { value: () => ({ width: 236, height: 340, left: 10, top: 700, right: 246, bottom: 1040 }) });
      aaa.dispatchEvent(startEv);
      await sleep(40);
      const overEv = new dom.window.MouseEvent('dragover', { bubbles: true, cancelable: true, clientX: 200, clientY: 900 });
      Object.defineProperty(overEv, 'dataTransfer', { value: dt });
      ccc.dispatchEvent(overEv);
      await sleep(120);
      assert.equal(order().join(','), 'bbb,ccc,aaa', 'the live gap never moved the pack (' + order().join(',') + ')');
      // 1.6.4 — THE SEAT-HOLDING LAW: a dragleave no longer walks the gap
      // home (the synthetic-leave oscillation the report caught) — the
      // preview HOLDS its seat until a true ending.
      const leaveEv = new dom.window.MouseEvent('dragleave', { bubbles: true, cancelable: true });
      Object.defineProperty(leaveEv, 'relatedTarget', { value: document.body });
      ccc.dispatchEvent(leaveEv);
      await sleep(120);
      assert.equal(order().join(','), 'bbb,ccc,aaa', 'the gap abandoned its seat on a leave (' + order().join(',') + ')');
      aaa.dispatchEvent(new dom.window.Event('dragend', { bubbles: true }));
      await sleep(120);
      assert.equal(order().join(','), 'aaa,bbb,ccc', 'the dragend belt never walked the pack home (' + order().join(',') + ')');
    } finally {
      rt.unmount();
      host.remove();
    }
  });

  // --- LIVE 3: the picker's reset through the real panel -------------------
  await okAsync('LIVE3 — the hex-area key UNSETS (never paints red)', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const rt = createRoot(host);
    try {
      let got = 'unset-marker';
      const Panel = req('../src/components/ColorPicker.jsx').ColorPickerPanel;
      rt.render(React.createElement(Panel, {
        color: '#15b2cf',
        onColor: (hex) => { got = hex; },
        onReset: () => { got = null; },
        compact: true,
      }));
      await sleep(60);
      const reset = [...host.querySelectorAll('button')].find((b) => /remove the custom color/i.test(b.title || ''));
      assert.ok(reset, 'the reset key never mounted');
      assert.ok((reset.innerHTML || '').includes('svg'), 'the glyph never rendered');
      click(reset);
      await sleep(40);
      assert.equal(got, null, 'the reset never unset the color (got ' + String(got) + ')');
    } finally {
      rt.unmount();
      host.remove();
    }
  });

  // --- LIVE 4: the goodbye clock through the real Popover ------------------
  await okAsync('LIVE4 — the dropdown lingers its full 220ms fadeout clock', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const rt = createRoot(host);
    try {
      const Popover = req('../src/components/Popover.jsx').default;
      const anchorRef = React.createRef();
      const renderAt = (open) =>
        rt.render(
          React.createElement(
            'div',
            null,
            React.createElement('button', { ref: anchorRef }, 'ANCHOR'),
            React.createElement(Popover, { open, onClose: () => {}, anchor: anchorRef, width: 200 }, 'CARD')
          )
        );
      renderAt(true);
      await sleep(120);
      const card = document.querySelector('.gd-pop-in[data-gd-popover]');
      assert.ok(card, 'the popover card never mounted');
      renderAt(false);
      await sleep(80);
      const lingering = document.querySelector('.gd-pop-in[data-gd-popover]');
      assert.ok(lingering && lingering.className.includes('gd-pop-out'), 'the goodbye never began (no leaving card at 80ms)');
      await sleep(190);
      const gone = document.querySelector('.gd-pop-in[data-gd-popover]');
      assert.ok(!gone, 'the card outlived its own 220ms clock');
    } finally {
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
