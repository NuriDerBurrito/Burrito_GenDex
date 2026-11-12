// 1.7.7 batch — The Trim's Own Voice.
// (Named 178 in the sequence: 177 pins the 1.7.6 laws; this suite pins
//  the 1.7.7 laws at their roots.)
// The reported items, each pinned at its root law:
//   A.  THE TRIM'S OWN VOICE ("the trim changes colors based on card
//       colors now and the finishes arent effecting it anymore ...
//       trim has its own default color related to the THEME, and has its
//       own color setting that it should abide by")
//   B.  THE WELL'S OWN CORNER ("when a scrollbar is present, the bottom
//       of it gets a weird white outline (where i can resize the
//       container itself) fix that so its fit properly to the theme")
//   C.  THE SELECTED OUTLINE SPEAKS UP ("the selected outline around the
//       prompt/note container highlight is too vague, fix that so its
//       better")
//   D.  THE RED UNDERLINE IS GONE ("remove the red underline under words
//       that are misspelled")
//   E.  THE SHIFT DEEPENS + THE REST ANSWERS IN HUE ("the light/dark
//       shift between selected and not selected container in prompt/note
//       is vague, its not strong enough, fix that so its more shifty
//       (you may also add a different effect to the rest of the
//       container, but it must not be the same darkening/light effect)")
//   F.  THE FAREWELL STAYS HOME ("when unselected tag is off, the tags
//       feedback fade clip outside the container, basically the tags
//       would clip into the stamps container instead or below the ui")
//   G.  THE LOOK TAB BREATHES ("at most look should have theme,
//       background textures and manual colors for example, rest should
//       have their own sectors")
//   H.  THE KEYS SECTOR EARNS ITS MANNERS ("explanatory text should be
//       behind the help text option, reset should have a confirmation,
//       theme's related color glow when confirming a new keybind, red
//       when discarding/canceling/resetting the keybinds ...")
// Plus the version furniture (1.7.7 everywhere).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';
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
const look = src('src/components/CardLookEditor.jsx');
const charview = src('src/components/CharacterView.jsx');
const partEditor = src('src/components/PartEditor.jsx');
const settings = src('src/components/SettingsModal.jsx');
const mainjs = src('src/main.js');
const readme = src('README.md');
const changelog = src('CHANGELOG.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const pkg = src('package.json');
const constants = src('src/constants/index.js');

console.log('\nA. THE TRIM\'S OWN VOICE ("never the card\'s borrowed color")');
ok('A1 — the card-color rung is retired from the derivation', () => {
  assertMatch(ribbon, /1\.7\.7 — THE TRIM'S OWN VOICE/, 'the 1.7.7 ladder note is missing');
  assertMatch(ribbon, /export function trimCoatInk\(trim, trimColor = null\) \{/, 'the cardColor parameter survived');
  assert.ok(!/return hex6\(cardColor\);/.test(ribbon), 'the card-color rung survived in TagRibbon');
});
ok('A2 — the ladder, measured (babel-loaded, the REAL function)', () => {
  // the 176 suite's own loader — trimCoatInk transpiled on the fly
  const require = createRequire(import.meta.url);
  const babel = require('@babel/core');
  require.extensions['.jsx'] = (module, filename) => {
    const { code } = babel.transformFileSync(filename, {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
    });
    module._compile(code, filename);
  };
  const { trimCoatInk } = require('../src/components/TagRibbon.jsx');
  // the trim's OWN SETTING wins, gold's palette included
  assert.equal(trimCoatInk('dash', '#123456'), '#123456', 'the picked ink never won');
  assert.equal(trimCoatInk('gold', '#123456'), '#123456', 'a pick never overrode the gold');
  // the card's color NEVER re-inks another family's trim — with the third
  // argument gone, a colored card without a pick keeps the THEME's ink
  assert.equal(trimCoatInk('dash', null), null, "a pickless trim never fell to the theme's default");
  assert.equal(trimCoatInk('gold', null), null, 'the gold engraving never kept its own default');
  assert.equal(trimCoatInk('dash', null, '#654321'), null, "the card's color still followed (the retirement missed)");
  assert.equal(trimCoatInk('gold', null, '#654321'), null, 'the gold never kept its default');
});
ok('A3 — every seat that ever spoke cardTrimColor threads the two-rung ladder', () => {
  // the REAL trim seats (grid, look editor, compact preview)
  assertMatch(grid, /color=\{trimCoatInk\(character\.cardTrim, character\.cardTrimColor\)\}/, 'the grid card still passed cardColor');
  assertMatch(look, /const trimUserInk = trimCoatInk\(trim \|\| DEFAULT_CARD_TRIM, trimColor\);/, 'the look editor still passed cardColor');
  assertMatch(ribbon, /const trimUserInk = trimCoatInk\(trim, trimColor\);/, 'the compact preview still passed cardColor');
  // the trim-effect clone seats
  assertMatch(grid, /ink=\{coatOverTrim \? trimCoatInk\(character\.cardTrim, character\.cardTrimColor\) : null\}/, 'the grid clone still passed cardColor');
  assertMatch(look, /ink=\{coatOverTrim \? trimCoatInk\(trim \|\| DEFAULT_CARD_TRIM, trimColor\) : null\}/, 'the look editor clone still passed cardColor');
  assertMatch(ribbon, /const coatInk = trimCoatInk\(trim, trimColor\);/, 'the preview clone still passed cardColor');
});

console.log('\nB. THE WELL\'S OWN CORNER ("fit properly to the theme")');
ok('B1 — the chrome goes quiet: the lane, the corner and the plate speak transparency', () => {
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assertMatch(cssLaws, /\.gd-prompt-box::-webkit-scrollbar-corner,/, 'the corner law never spoke');
  assertMatch(cssLaws, /\.gd-prompt-box::-webkit-resizer \{[\s\S]*?repeating-linear-gradient\(/, 'the resizer hatch never spoke');
  // 1.7.9 supersede — the lane/corner/plate turn TRANSPARENT (the field's own
  // face speaks through at every state; the 1.7.7 opaque grounds retire)
  assertMatch(
    cssLaws,
    /\.gd-prompt-box::-webkit-scrollbar-track,\s*\n\.gd-prompt-box::-webkit-scrollbar-corner,\s*\n\.gd-prompt-box::-webkit-resizer \{[\s\S]*?background: transparent;/,
    'the quiet chrome never spoke'
  );
  // the thumb floats as a soft translucent capsule (no ground border)
  assertMatch(
    cssLaws,
    /\.gd-prompt-box::-webkit-scrollbar-thumb \{[\s\S]*?background: color-mix\(in srgb, var\(--gd-ink\) 38%, transparent\);\s*\n\s*border-radius: 6px;/,
    'the capsule thumb never spoke'
  );
  // the colored wells join the family (the resizer's hatch in the color's own ink)
  assertMatch(cssLaws, /\.gd-part-row\.is-colored \.gd-prompt-box::-webkit-resizer \{/, 'the colored resizer never spoke');
  // the archive cloth rides the same quiet corner
  assertMatch(cssLaws, /\[data-theme='archive'\] \.gd-prompt-box::-webkit-scrollbar-corner \{[\s\S]*?background: transparent;/, 'the archive corner never went quiet');
  assertMatch(css, /THE WELL'S OWN CORNER/, 'the 1.7.7 corner note is missing');
});

console.log('\nC. THE SELECTED OUTLINE SPEAKS UP ("too vague ... make it better")');
ok('C1 — the rings climb to real words with halos behind them', () => {
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // the uncolored well: 60% ring + a 12px halo
  assertMatch(
    cssLaws,
    /\.gd-prompt-box:focus \{[\s\S]*?0 0 0 2px color-mix\(in srgb, var\(--gd-accent\) 60%, transparent\),\s*\n\s*0 0 12px 2px color-mix\(in srgb, var\(--gd-accent\) 28%, transparent\);/,
    'the well\'s ring never spoke up'
  );
  // the colored well: the same 60% + halo
  assertMatch(
    cssLaws,
    /\.gd-part-row\.is-colored \.gd-prompt-box:focus \{[\s\S]*?0 0 0 2px color-mix\(in srgb, var\(--gd-accent\) 60%, transparent\),\s*\n\s*0 0 12px 2px color-mix\(in srgb, var\(--gd-accent\) 28%, transparent\);/,
    'the colored well\'s ring never spoke up'
  );
  // the untinted window title: 60% + halo
  assertMatch(
    cssLaws,
    // 1.7.8 supersede — the family focus law (the stage + the title one
    // list; the halo unified to the panel well's own 12px/28%).
    /\.gd-modal-card \.gd-notes-title\.gd-rt-edit:focus-visible,\s*\n\.gd-modal-card \.gd-prompt-stage:focus,\s*\n\.gd-modal-card \.gd-notes-stage:focus \{[\s\S]*?0 0 0 2px color-mix\(in srgb, var\(--gd-accent\) 60%, transparent\),\s*\n\s*0 0 12px 2px color-mix\(in srgb, var\(--gd-accent\) 28%, transparent\);/,
    'the untinted title ring never spoke up'
  );
  // the tinted window title: 55% + halo
  assertMatch(
    cssLaws,
    /\.gd-modal-card\.is-part-tinted \.gd-notes-title:focus-visible,\s*\n\.gd-modal-card\.is-part-tinted \.gd-prompt-stage:focus,[\s\S]*?0 0 0 2px color-mix\(in srgb, var\(--gd-accent\) 60%, transparent\),\s*\n\s*0 0 12px 2px color-mix\(in srgb, var\(--gd-accent\) 28%, transparent\);/,
    'the tinted title ring never spoke up'
  );
  // the row's name field: 55% + halo
  assertMatch(
    cssLaws,
    /\.gd-part-row \.gd-rt-edit:focus \{[\s\S]*?0 0 0 2px color-mix\(in srgb, var\(--gd-accent\) 55%, transparent\),\s*\n\s*0 0 10px 2px color-mix\(in srgb, var\(--gd-accent\) 24%, transparent\);/,
    'the name field\'s ring never spoke up'
  );
});

console.log('\nD. THE RED UNDERLINE IS GONE ("remove the red underline under words that are misspelled")');
ok('D1 — the engine dies at the window\'s door', () => {
  assertMatch(mainjs, /spellcheck: false,/, 'the webPreferences spellcheck kill never spoke');
  assertMatch(mainjs, /THE SPELLCHECK ENGINE IS OFF AT THE DOOR/, 'the 1.7.7 spellcheck note is missing');
});
ok('D2 — every writable surface carries spellCheck={false}', () => {
  // the prompt wells + stages
  assertMatch(partEditor, /spellCheck=\{false\}/, 'the prompt editor never killed the squiggle');
  assert.equal((partEditor.match(/spellCheck=\{false\}/g) || []).length, 2, 'the prompt editor missed a seat (stage + well)');
  // the notes well + stage
  assert.equal((charview.match(/spellCheck=\{false\}/g) || []).length, 2, 'the notes editor missed a seat (stage + well)');
  // the grid search box
  assertMatch(grid, /spellCheck=\{false\}/, 'the grid search box never killed the squiggle');
  // the two hex fields
  assertMatch(settings, /spellCheck=\{false\}/, 'the settings hex field never killed the squiggle');
  assertMatch(src('src/components/TagManagerModal.jsx'), /spellCheck=\{false\}/, 'the tag manager hex field never killed the squiggle');
  // the stamp name + the glyph letter
  assertMatch(src('src/components/StampEditModal.jsx'), /spellCheck=\{false\}/, 'the stamp name never killed the squiggle');
  assertMatch(src('src/components/LucideIconPicker.jsx'), /spellCheck=\{false\}/, 'the glyph letter never killed the squiggle');
  // the rich fields keep their own (already spoke it before 1.7.7)
  assertMatch(src('src/components/RichText.jsx'), /spellCheck=\{false\}/, 'the rich fields lost their own kill');
});

console.log('\nE. THE SHIFT DEEPENS + THE REST ANSWERS IN HUE ("more shifty, but never the same darkening/light effect")');
ok('E1 — the well\'s gather widens to a full 28-32-point lift', () => {
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // the uncolored well: 58% -> 30%
  assertMatch(
    cssLaws,
    /\.gd-prompt-box:focus \{[\s\S]*?background: color-mix\(in srgb, var\(--gd-bg\) 30%, var\(--gd-panel\)\);/,
    'the uncolored gather never deepened'
  );
  // the colored well: 32% toward the face
  assertMatch(
    cssLaws,
    /\.gd-part-row\.is-colored \.gd-prompt-box:focus \{[\s\S]*?background: color-mix\(in srgb, var\(--part-well, var\(--gd-bg\)\) 68%, var\(--part-face, var\(--gd-panel\)\)\);/,
    'the colored gather never deepened'
  );
  // the tinted title follows the family (28 points)
  assertMatch(
    cssLaws,
    /\.gd-modal-card\.is-part-tinted \.gd-notes-title:focus-visible,\s*\n\.gd-modal-card\.is-part-tinted \.gd-prompt-stage:focus,[\s\S]*?background: color-mix\(in srgb, var\(--part-well, var\(--part-title\)\) 68%, var\(--part-face, var\(--gd-panel\)\)\);/,
    'the tinted title gather never deepened'
  );
  // the name field moves with the family
  assertMatch(
    cssLaws,
    /\.gd-part-row \.gd-rt-edit:focus \{[\s\S]*?background: color-mix\(in srgb, var\(--gd-bg\) 30%, var\(--gd-panel\)\);/,
    'the name field gather never deepened'
  );
});
ok('E2 — the REST of the container answers in HUE (never another darken step)', () => {
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // 1.7.8 supersede — THE TITLE JOINS THE CHORUS: the :has family
  // speaks both fields now (the well + the title's .gd-rt-edit).
  // 1.8.5 supersede — THE SELECTED OUTLINE OUT-RANKS EVERY HOVER: the
  // family doubles its own class (the honest weight lift, no
  // !important) because the DEEP shade's hover seat tied the colored
  // focus rule and won by source order — the outline "disappearing"
  // into the color-on-color edge exactly as the report told it.
  assertMatch(cssLaws, /\.gd-part-row\.gd-part-row:has\(\.gd-prompt-box:focus\),\s*\n\.gd-part-row\.gd-part-row:has\(\.gd-rt-edit:focus\) \{[\s\S]*?border-color: color-mix\(in srgb, var\(--gd-accent\) 72%, var\(--gd-ink\)\);/, 'the frame hue law never spoke');
  assertMatch(cssLaws, /\.gd-part-row\.gd-part-row\.is-colored:has\(\.gd-prompt-box:focus\),\s*\n\.gd-part-row\.gd-part-row\.is-colored:has\(\.gd-rt-edit:focus\) \{/, 'the colored frame hue law never spoke');
  assertMatch(css, /THE REST OF THE CONTAINER ANSWERS IN HUE/, 'the 1.7.7 hue note is missing');
});

console.log('\nF. THE FAREWELL STAYS HOME ("never into the stamps container, never below the ui")');
ok('F1 — the ghost carries the wall\'s headroom and clips its own overflow', () => {
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assertMatch(
    cssLaws,
    /\.gd-tag-ghost-row \{[\s\S]*?padding: 5px 6px 0;\s*\n\s*margin: -5px -6px 0;\s*\n\s*overflow: hidden;/,
    'the ghost never learned to clip itself inside the seat'
  );
  // the ghost keeps its flight + the pointer law
  // 1.7.9 — the family's own clock: the ghost out at 0.07s
  assertMatch(cssLaws, /\.gd-tag-ghost-row \{[\s\S]*?animation: gd-tag-ghost-out 0\.07s ease-out forwards;/, 'the ghost flight lost its clock');
  assertMatch(css, /THE FAREWELL STAYS HOME/, 'the 1.7.7 farewell note is missing');
});

console.log('\nG. THE LOOK TAB BREATHES ("at most theme, background textures and manual colors")');
ok('G1 — the rail earns SHAPE + CARDS keys beside Look', () => {
  assertMatch(settings, /\{ id: 'Shape', icon: Shapes, label: 'Shape' \}/, 'the Shape rail key never spoke');
  assertMatch(settings, /\{ id: 'Cards', icon: Layers, label: 'Cards' \}/, 'the Cards rail key never spoke');
  assertMatch(settings, /1\.7\.7 — THE LOOK TAB IS DIVIDED/, 'the 1.7.7 divide note is missing');
  assertMatch(settings, /import \{[\s\S]*?Shapes,[\s\S]*?\} from 'lucide-react'/, 'the Shapes icon never joined the roster');
});
ok('G2 — the Look tab keeps its three cloths alone', () => {
  // slice the Appearance panel block
  const a = settings.indexOf("{tab === 'Appearance' && (");
  const b = settings.indexOf("{tab === 'Shape' && (", a);
  const lookTab = settings.slice(a, b);
  for (const stays of ['THEMES', 'BACKGROUND TEXTURE', 'MANUAL COLORS']) {
    assert.ok(lookTab.includes(stays), `the Look tab lost ${stays}`);
  }
  for (const moved of ['APP FONT', 'CORNER STYLE', 'CARD CORNERS', 'CARD SHADOW', 'TRIM LINES', 'STAMP TILT', 'CARD HOVER', 'TOOLTIPS', 'TAG POSITION', 'DEFAULT GRID ZOOM', 'UNSELECTED TAGS', 'CARD SHINE']) {
    assert.ok(!lookTab.includes(moved), `the Look tab still carries ${moved}`);
  }
});
ok('G3 — the Shape sector carries the typeface, the dials and the tooltips', () => {
  const a = settings.indexOf("{tab === 'Shape' && (");
  const b = settings.indexOf("{tab === 'Cards' && (", a);
  const shapeTab = settings.slice(a, b);
  for (const seat of ['APP FONT', 'CORNER STYLE', 'CARD CORNERS', 'CARD SHADOW', 'TRIM LINES', 'STAMP TILT', 'CARD HOVER', 'TOOLTIPS', 'SHAPE STYLE']) {
    assert.ok(shapeTab.includes(seat), `the Shape tab lost ${seat}`);
  }
  assert.ok(!shapeTab.includes('TAG POSITION'), 'the Shape tab caught a tag card');
});
ok('G4 — the Cards sector carries the tag family and the shine family', () => {
  const a = settings.indexOf("{tab === 'Cards' && (");
  const b = settings.indexOf("{tab === 'Workspace' && (", a);
  const cardsTab = settings.slice(a, b);
  for (const seat of ['TAG POSITION', 'DEFAULT GRID ZOOM', 'DEFAULT TAG ZOOM', 'TOP TAGS', 'TAG SEPARATION', 'UNSELECTED TAGS', 'CARD SHINE', 'SHINE OVER TRIMS', 'SHINE STYLE', 'CARD SHINE']) {
    assert.ok(cardsTab.includes(seat), `the Cards tab lost ${seat}`);
  }
  assert.ok(cardsTab.includes('gd-set-section">CARD SHINE</div>'), 'the shine family never earned its own section header');
  assert.ok(!cardsTab.includes('APP FONT'), 'the Cards tab caught a font card');
});

console.log('\nH. THE KEYS SECTOR EARNS ITS MANNERS ("rework how it looks/functions")');
ok('H1 — the explanatory copy + per-row hints ride the HELP TEXT switch', () => {
  assertMatch(settings, /function ShortcutsCard\(\{ shortcuts, onChange, showHelp = false \}\)/, 'the card never took showHelp');
  assertMatch(settings, /\{showHelp && \(\s*\n\s*<div className="gd-opt-desc">\s*\n\s*Click a key, then press a two-key combo/, 'the explanatory copy never rode the switch');
  assertMatch(settings, /\{showHelp && <span className="gd-scut-hint truncate">\{act\.hint\}<\/span>\}/, 'the per-row hint never rode the switch');
  assertMatch(settings, /\{showHelp && \(\s*\n\s*<span className="gd-scut-note">Fixed:/, 'the fixed-keys note never rode the switch');
  // the call site threads it
  assertMatch(settings, /<ShortcutsCard shortcuts=\{settings\.shortcuts\} onChange=\{\(map\) => set\('shortcuts', map\)\} showHelp=\{showHelp\} \/>/, 'the call site never threaded showHelp');
  // the sector earns its furniture
  assertMatch(settings, /<div className="gd-set-section">REASSIGN KEYS<\/div>/, 'the section header never spoke');
});
ok('H2 — the armed row carries its own CANCEL key', () => {
  assertMatch(settings, /className="gd-scut-cancel"/, 'the cancel key class never spoke');
  assertMatch(settings, /\{isListen && \(\s*\n\s*<button\s*\n\s*type="button"\s*\n\s*className="gd-scut-cancel"/, 'the cancel key never rode the armed row');
  // clicking the armed key again also discards (with the red beat)
  assertMatch(settings, /onClick=\{\(\) => \(isListen \? disarm\(act\.id\) : setListeningId\(act\.id\)\)\}/, 'the armed key toggle never discarded');
});
ok('H3 — RESET confirms before it wipes', () => {
  assertMatch(settings, /const \[confirmReset, setConfirmReset\] = useState\(false\);/, 'the confirm state never spoke');
  assertMatch(settings, /CONFIRM RESET/, 'the confirm key never spoke');
  assertMatch(settings, /title="Keep the current combos"/, 'the keep key never spoke');
  assertMatch(settings, /Reset every key to the shipped defaults\?/, 'the confirm question never spoke');
  assertMatch(settings, /className="gd-btn gd-btn-danger !py-1 !px-2\.5 !text-\[10px\]"/, 'the confirm key never wore the red family');
});
ok('H4 — the verdict glows: the theme\'s accent on a commit, red on a discard/reset', () => {
  assertMatch(settings, /glow\(listeningId, 'confirmed'\); \/\/ the theme's own color answers the commit/, 'the commit glow never spoke');
  assertMatch(settings, /const disarm = \(id\) => \{[\s\S]*?glow\(id, 'discarded'\);/, 'the discard glow never spoke');
  assertMatch(settings, /isConfirm && 'is-confirmed',\s*\n\s*isDiscard && 'is-discarded'/, 'the flash classes never rode the key');
  assertMatch(settings, /resetFlash && 'is-reset-flash'/, 'the reset sweep never armed');
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assertMatch(cssLaws, /\.gd-scut-key\.is-confirmed \{[\s\S]*?animation: gd-scut-confirm 0\.62s ease-out;/, 'the confirm glow CSS never spoke');
  assertMatch(cssLaws, /\.gd-scut-key\.is-discarded \{[\s\S]*?animation: gd-scut-discard 0\.55s ease-out;/, 'the discard glow CSS never spoke');
  assertMatch(cssLaws, /\.gd-scut-grid\.is-reset-flash \.gd-scut-key \{[\s\S]*?animation: gd-scut-discard 0\.55s ease-out;/, 'the reset sweep CSS never spoke');
  // the accent glow speaks the THEME's accent (the theme-related color)
  assertMatch(cssLaws, /@keyframes gd-scut-confirm \{[\s\S]*?color-mix\(in srgb, var\(--gd-accent\) 60%, transparent\)/, 'the confirm glow never spoke the theme');
  assertMatch(cssLaws, /\.gd-scut-cancel \{[\s\S]*?#ff8d7d;/, 'the cancel key never wore the red family');
  assertMatch(cssLaws, /\.gd-scut-hint \{/, 'the hint seat CSS never spoke');
  // reduced motion stills every new beat
  assertMatch(cssLaws, /\.gd-reduced-motion \.gd-scut-key\.is-confirmed,/, 'reduced motion never stilled the confirm glow');
});
ok('H5 — an invalid press is forgotten until a valid combo lands', () => {
  assertMatch(settings, /const combo = comboFromEvent\(e\);\s*\n\s*if \(!combo\) return; \/\/ not a valid two-key combo — keep listening/, 'the forgetting law never spoke');
  // Escape still discards through the capture listener
  assertMatch(settings, /window\.addEventListener\('keydown', onKey, true\);/, 'the capture listener never spoke');
});

console.log('\nV. THE VERSION FURNITURE (1.7.7 everywhere)');
ok('V1 — the version is 1.7.7 everywhere', () => {
  assertMatch(pkg, /"version": "1\.9\.19",/, 'package.json never moved');
  assertMatch(constants, /version: '1\.9\.19',/, 'APP.version never moved');
  assertMatch(readme, /\*\*v1\.9\.19\*\* · a local card & prompt-version tracker/, 'the README header never moved');
  assertMatch(readme, /the regression battery \(93 DOM\/source test suites\)/, 'the README battery count never moved');
  // 1.8.9 — THE README IS THE PUBLIC FACE: the version roll retired with it
  // (the first public release speaks features, not history; the changelog
  // keeps the story). The paragraph's old seat is gone by law.
  assert.ok(!/^1\.\d+\.\d+ — /m.test(readme), 'the version roll retired with the public README');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /<span class="ver">v1\.8\.6<\/span>/, 'the website hero version never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /THE PATIENT WHEEL/, 'the website hero tagline never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /releases\/download\/v1\.8\.6\//, 'the website download URLs never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /class="v">1\.8\.6<\/td>/, 'the website current-row never moved');
  assertMatch(changelog, /^## 1\.9\.19 — The Ends Trade Places$/m, 'the CHANGELOG entry never spoke');
  assertMatch(changelog, /^Eight answers — the trim stops borrowing the card's color, the settings window breathes again, and the keys sector learns its manners\.$/m, 'the CHANGELOG subtitle never spoke');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
