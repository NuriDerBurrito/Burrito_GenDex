// 1.7.8 batch — Standing On Its Own.
// (Named 179 in the sequence: 178 pins the 1.7.7 laws; this suite pins
//  the 1.7.8 laws at their roots.)
// The reported items, each pinned at its root law:
//   A.  THE RING EARNS ITS OWN WASH ("trim effect doesnt work on its own,
//       only works when i have image effect turned on, fix that")
//   B.  THE WELL'S CHROME STAYS HOME ("the note/prompt scrollbar/well are
//       clipping outside of the container of the prompt/note container,
//       fix that so it doesnt")
//   C.  ONE WINDOW, ONE FIELD ("prompt/note title in expanded window
//       should have the same style as the prompt/note below it, since
//       currently the container blends in too much to the window")
//   D.  THE TITLE SELECTS ITS CONTAINER ("when i select prompt/note title,
//       the container doesnt get selected, aka selected outline, only the
//       title, (unlike prompt/note content itself which selects with that
//       theme highlight around it and the prompt/note container itself),
//       fix that so it does")
//   E.  THE SELECTION FOLLOWS THE FIELDS INTO THE WINDOW ("the selected
//       outline doesnt work on the content inside the expanded window,
//       doesnt work on the prompt/note itself, fix that so it does (and
//       dont forget to also do the same to te title after the container
//       style changes)")
//   F.  THE FAREWELL IS A SNAPSHOT ("when tags fade in they are still
//       sorted in like a single row-ish ... during the fade effect it
//       sorts to the bottom for a quick second then saps to how it should
//       be, fix that so it directly appears as it should be")
//   G.  THE SECTOR SPEAKS ONE COLUMN ("keys sector is better ish, but its
//       sorted in two columns, fix that so its a single column and each
//       row gets its rights and accounted for when the buttons clip over
//       help text or such, rework it to fit better in ui/ux design")
// Plus the version furniture (1.7.8 everywhere).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

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
const assertMatch = (text, re, msg) => {
  if (!re.test(text)) throw new Error(msg || 'pattern missing');
};

const css = src('src/index.css');
const ribbon = src('src/components/TagRibbon.jsx');
const grid = src('src/components/GridView.jsx');
const charview = src('src/components/CharacterView.jsx');
const partEditor = src('src/components/PartEditor.jsx');
const settings = src('src/components/SettingsModal.jsx');
const readme = src('README.md');
const changelog = src('CHANGELOG.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const pkg = src('package.json');
const constants = src('src/constants/index.js');
const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');

console.log('\nA. THE RING EARNS ITS OWN WASH ("trim effect doesnt work on its own, only works when i have image effect turned on")');
ok('A1 — the law note speaks its name', () => {
  assertMatch(css, /1\.7\.8 — THE RING EARNS ITS OWN WASH/, 'the 1.7.8 ring note is missing');
});
ok('A2 — the wash speaks the family\'s own shape (every family its own mask, unioned with the plate)', () => {
  const at = cssLaws.indexOf('.gd-fin-on-trim .gd-card-face-finish.is-plate-only.is-over-trim {');
  const rule = cssLaws.slice(at, cssLaws.indexOf('}', at));
  assertMatch(rule, /background-origin: border-box;/, 'the pattern-anchor guard never spoke');
  assertMatch(rule, /--tw-r: calc\(var\(--gd-shape-radius, var\(--gd-radius\)\) - var\(--gd-border-w, 2px\)\);/, 'the family geometry helper never spoke');
  // the plate alone is the default — the synthetic ring's padding + composite
  // retired with it (trim: none dresses nothing but the plate)
  assertMatch(rule, /-webkit-mask-image: linear-gradient\(\s*to bottom,\s*rgba\(0, 0, 0, 0\) 0,\s*rgba\(0, 0, 0, 0\) calc\(var\(--gd-art-h\) - 0\.5px\),\s*#000 calc\(var\(--gd-art-h\) - 0\.5px\)\s*\);/, 'the plate-only default never spoke');
  assert.ok(!/padding:/.test(rule), 'the synthetic ring\'s padding survived');
  assert.ok(!/mask-composite/.test(rule), 'a composite operator survived (every family layer unions by default)');
  // every family keyed off its own class, one rule per geometry
  for (const fam of ['dash', 'double', 'bold', 'ledger', 'frame', 'gallery', 'scallop', 'gold', 'vine', 'beads', 'rivet']) {
    assert.ok(
      cssLaws.includes(`.gd-fin-on-trim:has(.gd-trim-${fam}) .gd-card-face-finish.is-plate-only.is-over-trim {`),
      `the ${fam} family rule never spoke`
    );
  }
  // the ledger keeps its two rails and NOTHING else (bottom re-anchored at the art line)
  const ledgerAt = cssLaws.indexOf('.gd-fin-on-trim:has(.gd-trim-ledger) .gd-card-face-finish.is-plate-only.is-over-trim {');
  const ledgerRule = cssLaws.slice(ledgerAt, cssLaws.indexOf('}', ledgerAt));
  assertMatch(ledgerRule, /0 6px,\s*\n\s*0 calc\(var\(--gd-art-h\) - 7\.5px\);/, 'the ledger rails never re-anchored at the art line');
  // the dash speaks its gaps (dashed runs + corner annuli at the pseudo's own radius)
  const dashAt = cssLaws.indexOf('.gd-fin-on-trim:has(.gd-trim-dash) .gd-card-face-finish.is-plate-only.is-over-trim {');
  const dashRule = cssLaws.slice(dashAt, cssLaws.indexOf('}', dashAt));
  assertMatch(dashRule, /repeating-linear-gradient\(90deg, #000 0 3px, transparent 3px 6px\)/, 'the dashed runs never spoke their rhythm');
  assertMatch(dashRule, /radial-gradient\(circle at var\(--tw-c\) var\(--tw-c\)/, 'the corner annuli never spoke');
  // the gallery speaks four brackets alone (the mid-edges stay bare)
  const galleryAt = cssLaws.indexOf('.gd-fin-on-trim:has(.gd-trim-gallery) .gd-card-face-finish.is-plate-only.is-over-trim {');
  const galleryRule = cssLaws.slice(galleryAt, cssLaws.indexOf('}', galleryAt));
  assertMatch(galleryRule, /40% 4px,\s*\n\s*4px calc\(var\(--gd-art-h\) \* 0\.4\)/, 'the bracket arms never spoke');
  assertMatch(css, /THE WASH SPEAKS THE FAMILY'S OWN SHAPE/, 'the family-shape note is missing');
});
ok('A3 — the ladder\'s comment keeps its promise at last (TagRibbon)', () => {
  assertMatch(ribbon, /the 1\.7\.8 ring-band mask in index\.css dresses\s*\n\/\/\s*the perimeter with the image effect off too/, 'the kept promise never spoke');
});
ok('A4 — the grid card\'s clone note carries the 1.7.8 law', () => {
  assertMatch(grid, /1\.7\.8 — THE RING BAND RETURNS TO THE WASHES/, 'the grid note never spoke');
});

console.log('\nB. THE WELL\'S CHROME STAYS HOME ("the scrollbar/well are clipping outside of the container")');
ok('B1 — the clipping shell owns the frame\'s curve (both wells ride it)', () => {
  assertMatch(partEditor, /<div className="gd-well-shell mt-1\.5">/, 'the prompt well never rode the shell');
  assertMatch(charview, /<div className="gd-well-shell mt-1\.5">/, 'the notes well never rode the shell');
  assertMatch(cssLaws, /\.gd-well-shell \{\s*position: relative;\s*display: flex;\s*flex-direction: column;\s*border-radius: min\(var\(--gd-btn-radius, 8px\), 10px\);\s*overflow: hidden;/, 'the shell law never spoke');
});
ok('B2 — the flex floor + the grip moved one level down (the shell stretches, the field grips)', () => {
  assertMatch(cssLaws, /\.gd-part-main \.gd-well-shell \{\s*flex: 1 0 auto;\s*min-height: 4\.6em;/, 'the shell floor never spoke');
  assertMatch(cssLaws, /\.gd-well-shell \.gd-prompt-box \{\s*flex: 1 0 auto;\s*resize: vertical;\s*min-height: 4\.6em;\s*overflow-y: auto;/, 'the field\'s grip law never spoke');
  // the notes well gains the law set through the same unscoped seat
  assert.ok(!/\.gd-part-main \.gd-prompt-box \{/.test(cssLaws), 'the old direct well stretch survived');
});
ok('B3 — the focus ring + halo speak from the SHELL (the insets stay on the field)', () => {
  const focus = /\.gd-prompt-box:focus \{[^}]*\}/.exec(cssLaws)?.[0] || '';
  assertMatch(focus, /inset 3px 0 0 var\(--gd-accent\),/, 'the spine never stayed on the field');
  assert.ok(!/0 0 0 2px/.test(focus), 'the outer ring survived on the field');
  assertMatch(cssLaws, /\.gd-well-shell:has\(\.gd-prompt-box:focus\) \{\s*box-shadow:\s*0 0 0 2px color-mix\(in srgb, var\(--gd-accent\) 60%, transparent\),\s*0 0 12px 2px color-mix\(in srgb, var\(--gd-accent\) 28%, transparent\);/, 'the shell ring never spoke');
  assertMatch(cssLaws, /\.gd-part-row\.is-colored \.gd-well-shell:has\(\.gd-prompt-box:focus\) \{/, 'the colored shell ring never spoke');
});

console.log('\nC. ONE WINDOW, ONE FIELD ("the same style as the prompt/note below it")');
ok('C1 — the tinted title wears the stage\'s carved well VERBATIM', () => {
  assertMatch(cssLaws, /\.gd-modal-card\.is-part-tinted \.gd-notes-title\.gd-input,\s*\.gd-modal-card\.is-part-tinted \.gd-notes-title\.gd-rt-edit \{\s*background: var\(--part-well,[^}]*?border-color: var\(--part-line,[^}]*?inset 3px 0 0 var\(--part-spine,[^}]*?2px 2px 0 color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 38%, #0e0e0e\);/s, 'the carved well never spoke on the title');
});
ok('C2 — the untinted title keeps NO private law (the stage\'s base IS the law)', () => {
  assert.ok(!/\.gd-modal-card \.gd-notes-title\.gd-input,\s*\.gd-modal-card \.gd-notes-title\.gd-rt-edit \{\s*background:/.test(cssLaws), 'the private untinted title law survived');
  assertMatch(css, /the untinted title needs no rule of its own/, 'the one-field note never spoke');
});
ok('C3 — one transition family for the window\'s fields', () => {
  assertMatch(cssLaws, /\.gd-modal-card \.gd-notes-title\.gd-input,\s*\.gd-modal-card \.gd-notes-title\.gd-rt-edit,\s*\.gd-modal-card \.gd-prompt-stage,\s*\.gd-modal-card \.gd-notes-stage \{\s*transition: border-color 0\.12s ease, background-color 0\.12s ease, box-shadow 0\.12s ease;/, 'the family transition never spoke');
});

console.log('\nD. THE TITLE SELECTS ITS CONTAINER ("the container doesnt get selected ... only the title")');
ok('D1 — the row\'s :has family carries BOTH fields, both cloths', () => {
  // 1.8.5 supersede — THE SELECTED OUTLINE OUT-RANKS EVERY HOVER: the
  // family doubles its own class (the DEEP shade's hover seat tied the
  // colored focus rule by specificity and won by source order — the
  // outline "disappearing" on every deep colored prompt).
  assertMatch(cssLaws, /\.gd-part-row\.gd-part-row:has\(\.gd-prompt-box:focus\),\s*\.gd-part-row\.gd-part-row:has\(\.gd-rt-edit:focus\) \{\s*border-color: color-mix\(in srgb, var\(--gd-accent\) 72%, var\(--gd-ink\)\);/, 'the uncolored family never spoke');
  assertMatch(cssLaws, /\.gd-part-row\.gd-part-row\.is-colored:has\(\.gd-prompt-box:focus\),\s*\.gd-part-row\.gd-part-row\.is-colored:has\(\.gd-rt-edit:focus\) \{/, 'the colored family never spoke');
  assertMatch(css, /THE TITLE JOINS THE CHORUS/, 'the 1.7.8 chorus note is missing');
});

console.log('\nE. THE SELECTION FOLLOWS THE FIELDS INTO THE WINDOW ("the selected outline doesnt work on the content inside the expanded window")');
ok('E1 — the stages gather, flip and ring (the untinted family)', () => {
  assertMatch(cssLaws, /\.gd-modal-card \.gd-notes-title\.gd-input:focus,\s*\.gd-modal-card \.gd-notes-title\.gd-rt-edit:focus,\s*\.gd-modal-card \.gd-notes-title\.gd-input:focus-visible,\s*\.gd-modal-card \.gd-notes-title\.gd-rt-edit:focus-visible,\s*\.gd-modal-card \.gd-prompt-stage:focus,\s*\.gd-modal-card \.gd-notes-stage:focus \{\s*outline: none;\s*border-color: var\(--gd-accent\);\s*background: color-mix\(in srgb, var\(--gd-bg\) 14%, var\(--gd-panel\)\);\s*box-shadow:\s*inset 3px 0 0 var\(--gd-accent\),\s*inset 0 1px 4px color-mix\(in srgb, var\(--gd-ink\) 14%, transparent\),\s*0 0 0 2px color-mix\(in srgb, var\(--gd-accent\) 60%, transparent\),\s*0 0 12px 2px color-mix\(in srgb, var\(--gd-accent\) 28%, transparent\);/, 'the untinted family focus never spoke');
});
ok('E2 — the tinted family gathers toward the face (one law with the colored well)', () => {
  assertMatch(cssLaws, /\.gd-modal-card\.is-part-tinted \.gd-notes-title:focus,\s*\.gd-modal-card\.is-part-tinted \.gd-notes-title:focus-visible,\s*\.gd-modal-card\.is-part-tinted \.gd-prompt-stage:focus,\s*\.gd-modal-card\.is-part-tinted \.gd-notes-stage:focus \{\s*background: color-mix\(in srgb, var\(--part-well, var\(--part-title\)\) 68%, var\(--part-face, var\(--gd-panel\)\)\);\s*border-color: color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 78%, var\(--part-ink, var\(--gd-ink\)\)\);/, 'the tinted family focus never spoke');
});
ok('E3 — the WINDOW stops answering (the window-level hue laws retire, both cloths)', () => {
  assert.ok(!/\.gd-modal-card:has\(\.gd-prompt-stage:focus\)/.test(cssLaws), 'the prompt-stage window hue law survived');
  assert.ok(!/\.gd-modal-card:has\(\.gd-notes-stage:focus\)/.test(cssLaws), 'the notes-stage window hue law survived');
  assert.ok(!/\.gd-modal-card:has\(\.gd-notes-title:focus\)/.test(cssLaws), 'the title window hue law survived');
  assert.ok(!/\.gd-modal-card\.is-part-tinted:has\(/.test(cssLaws), 'the tinted window hue law survived');
  assertMatch(css, /THE WINDOW STOPS ANSWERING/, 'the window-stop note never spoke');
});
ok('E4 — the window\'s frame keeps its rest (the border/shadow transition pair retires)', () => {
  const card = /\.gd-modal-card \{[\s\S]*?\}/.exec(cssLaws)?.[0] || '';
  assertMatch(card, /transition: height 0\.2s cubic-bezier\(0\.2, 0\.8, 0\.2, 1\), width 0\.2s cubic-bezier\(0\.2, 0\.8, 0\.2, 1\);/, 'the height/width tween lost its clock');
  assert.ok(!/border-color/.test(card), 'the border transition pair survived on the modal card');
});

console.log('\nF. THE FAREWELL IS A SNAPSHOT ("it sorts to the bottom for a quick second then snaps")');
ok('F1 — the seat memory speaks (the frozen rect snapshot)', () => {
  assertMatch(charview, /const snapshotGhostSeats = \(\) => \{/, 'the snapshot never armed');
  assertMatch(charview, /const id = el\.getAttribute && el\.getAttribute\('data-tag-id'\);/, 'the tag-id key never spoke');
  assertMatch(charview, /if \(el\.closest\('\.gd-tag-ghost-row'\)\) continue;/, 'the ghost\'s own chips never stood down');
  // the freeze: refresh only while the card holds still AND no ceremony lives
  assertMatch(charview, /if \(id === lastCharIdRef\.current && !swapOldActive\) \{/, 'the freeze law never spoke');
});
ok('F2 — the live chips carry their id (the snapshot\'s key)', () => {
  assertMatch(charview, /<button\s*\n\s*key=\{tag\.id\}\s*\n\s*data-tag-id=\{tag\.id\}/, 'the live chip key never spoke');
});
ok('F3 — the ghost paints each chip at its MEASURED seat', () => {
  assertMatch(charview, /className=\{clsx\('gd-tag-ghost-row', ghostSeatsRef\.current && 'is-seated'\)\}/, 'the seated ghost never armed');
  // 1.9.0 — THE SEAT SPEAKS THE EXTENDED ORIGIN: the ghost's box reaches
  // 6px left of the seat (the wall's own headroom — .gd-tag-ghost-row.is-seated
  // left: -6px), so the measured seats shift +6 to keep painting at their
  // exact on-screen seats while the marks clear the clip.
  assertMatch(charview, /position: 'absolute',\s*\n\s*left: `\$\{seat\.left \+ 6\}px`,\s*\n\s*top: `\$\{seat\.top\}px`,\s*\n\s*width: `\$\{seat\.width\}px`,\s*\n\s*height: `\$\{seat\.height\}px`,/, 'the measured seats never painted');
});
ok('F4 — the seated ghost drops the frame trick, keeps the clip', () => {
  assertMatch(cssLaws, /\.gd-tag-ghost-row\.is-seated \{\s*padding: 0;\s*margin: 0;/, 'the seated frame law never spoke');
  assertMatch(css, /THE SNAPSHOT SEAT/, 'the 1.7.8 snapshot note is missing');
});

console.log('\nG. THE SECTOR SPEAKS ONE COLUMN ("its sorted in two columns, fix that")');
ok('G1 — the grid is ONE flex column, its rows divided and marked', () => {
  assertMatch(settings, /<div className=\{clsx\('gd-scut-grid', resetFlash && 'is-reset-flash'\)\}>/, 'the grid seat never spoke');
  assert.ok(!/grid grid-cols-2/.test(settings), 'the two-column grid survived');
  // 1.8.2 — the title-era headroom rides off with the title (the roster meets the
  // card's padding directly; the sibling law below the teaching copy owns the 8px).
  assertMatch(cssLaws, /\.gd-scut-grid \{\s*display: flex;\s*flex-direction: column;\s*gap: 0;\s*margin-top: 0;/, 'the column law never spoke');
  // 1.7.9 — the dividers hold the lines between rows
  assertMatch(cssLaws, /\.gd-scut-row \+ \.gd-scut-row \{\s*border-top: 1px solid var\(--gd-line\);/, 'the divider law never spoke');
  assertMatch(cssLaws, /\.gd-scut-row \{\s*min-height: 44px;\s*padding: 9px 0;/, 'the row breathing never spoke');
});
ok('G2 — every row owns its height floor', () => {
  assertMatch(cssLaws, /\.gd-scut-row \{\s*min-height: 44px;/, 'the row floor never spoke');
  assertMatch(settings, /className="gd-scut-row flex items-center justify-between gap-3 text-\[11px\] text-gd-chrome min-w-0"/, 'the row seat never spoke');
});
ok('G3 — the key cluster reserves its width (the CANCEL mount never reflows)', () => {
  assertMatch(cssLaws, /\.gd-scut-keys \{\s*display: flex;\s*align-items: center;\s*justify-content: flex-end;\s*gap: 6px;\s*flex-shrink: 0;\s*min-width: 178px;/, 'the reserved cluster never spoke');
  assertMatch(settings, /<span className="gd-scut-keys">/, 'the cluster seat never spoke');
});
ok('G4 — the label column breathes under the hint', () => {
  assertMatch(cssLaws, /\.gd-scut-label \{\s*flex: 1 1 auto;/, 'the label column law never spoke');
  assertMatch(settings, /<span className="gd-scut-label min-w-0 flex flex-col" title=\{act\.hint\}>/, 'the label seat never spoke');
  assertMatch(css, /THE SECTOR SPEAKS ONE COLUMN/, 'the 1.7.8 column note is missing');
});

console.log('\nH. THE VERSION FURNITURE (1.7.9 everywhere)');
ok('H1 — the version is 1.7.9 everywhere', () => {
  assert.equal(JSON.parse(pkg).version, '1.9.19', 'package.json');
  assertMatch(constants, /version: '1\.9\.19',/, 'constants');
  assertMatch(readme, /\*\*v1\.9\.19\*\*/, 'README');
  // 1.8.9 — THE README IS THE PUBLIC FACE: the version roll retired with it
  // (the first public release speaks features, not history; the changelog
  // keeps the story). The paragraph's old seat is gone by law.
  assert.ok(!/^1\.\d+\.\d+ — /m.test(readme), 'the version roll retired with the public README');
  assertMatch(readme, /the regression battery \(93 DOM\/source test suites\)/, 'the README battery count never moved');
  assertMatch(changelog, /^## 1\.9\.19 — The Ends Trade Places/, 'the changelog head never arrived');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /<span class="ver">v1\.8\.6<\/span>/, 'the website card never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /THE PATIENT WHEEL<\/span>/, 'the website hero tagline never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /releases\/tag\/v1\.8\.6"/, 'the release URL never moved');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
