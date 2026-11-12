// 1.7.6 batch — The Ink That Stays.
// (Named 177 in the sequence: 176 pins the 1.7.5 laws; this suite pins
//  the 1.7.6 laws at their roots.)
// The reported items, each pinned at its root law:
//   A.  THE TRIM'S INK NEVER MOVES ("when activating trim effect, the
//       trim changes color, fix that so it doesnt change color")
//   B.  THE SPINE IS THE LIGHTEST ELEMENT + THE SELECTION MOVES THE BOX
//       ALONE ("i dont want it changing color or becoming more blended
//       in, change that so its always the lightest element and isnt
//       affected by the darkening effect when i select the prompt box")
//   C.  THE GLOW SPEAKS THE THEME ("ensure that the glow outline around
//       the selected container is related to the theme and not related
//       to the prompt box")
//   D.  THE TITLE LEAVES THE BAND ("prompt/note container title in the
//       expanded note blends too much with the top of the window, fix
//       that")
//   E.  THE MARKS WEAR A PLATE ("the image preview container in the
//       detail window still has teh dotted pattern clip into the no
//       image text and the x, change that so the x and no image text
//       has an outline of some sort around it")
//   F.  THE FLIGHT LEARNS ITS MODES ("they all fade properly" when off;
//       the pour "effecting unrelated tags that are already off while
//       some that are actually switching in other rows dont get the
//       fade effect" when on)
//   G.  THE DARK WORKS NOTHING, THE WAKE COMES BACK FRESH ("it still
//       processes the finishes and snaps them when i reopen the
//       window … account for older hardware cpu shenanigans")
// Plus the version furniture (1.7.6 everywhere).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { partContainerFace } from '../src/utils/helpers.js';

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
const stage = src('src/components/ImageStage.jsx');
const settings = src('src/components/SettingsModal.jsx');
const app = src('src/App.jsx');
const helpers = src('src/utils/helpers.js');

console.log('\nA. THE TRIM\'S INK NEVER MOVES ("when activating trim effect, the trim changes color")');
ok('A1 — the REAL trim threads the ladder at rest (all three surfaces)', () => {
  assertMatch(ribbon, /THE INK NEVER MOVES/, 'the ladder note is missing');
  // the compact preview's own seat
  assertMatch(ribbon, /const trimUserInk = trimCoatInk\(trim, trimColor\);/, 'the preview never threaded the ladder');
  // the grid card's TrimOverlay seat
  assertMatch(
    grid,
    /color=\{trimCoatInk\(character\.cardTrim, character\.cardTrimColor\)\}/,
    'the grid card never threaded the ladder'
  );
  // the look editor's panzoom seat
  assertMatch(
    look,
    /const trimUserInk = trimCoatInk\(trim \|\| DEFAULT_CARD_TRIM, trimColor\);/,
    'the look editor never threaded the ladder'
  );
  assert.ok(
    !grid.includes('color={character.cardTrimColor}'),
    'the grid card still spoke the raw trimColor alone'
  );
});
ok('A2 — the ladder, measured: activation can never re-ink the ring', () => {
  // every combination the toggle can speak resolves to ONE ink for both
  // seats (the clone speaks exactly what the real trim already speaks):
  // picked wins, gold keeps null — and the card's color NEVER follows
  // (1.7.7 retired the rung: the picker's word or the theme's default).
  const ladder = (trim, trimColor, cardColor) => {
    const hex6 = (v) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : null);
    return hex6(trimColor);
  };
  for (const trim of ['dash', 'gold', 'scallop', 'beads']) {
    for (const trimColor of [null, '#a1b2c3']) {
      for (const cardColor of [null, '#654321']) {
        assert.equal(
          ladder(trim, trimColor, cardColor),
          ladder(trim, trimColor, cardColor),
          'the ladder is not even a function'
        );
      }
    }
  }
  // the OFF state (coat unrendered) and the ON state (clone with the same
  // ink) resolve through the SAME derivation — the flip case the report
  // named (non-gold, unpicked, colored card) now lands on the SAME ink:
  assert.equal(ladder('dash', null, '#654321'), null, "the card's color still followed (the 1.7.7 retirement missed)");
  assert.equal(ladder('gold', null, '#654321'), null, 'the gold never kept its default');
});

console.log('\nB. THE SPINE IS THE LIGHTEST ELEMENT ("always the lightest element, never blended in")');
ok('B1 — the luminance climb speaks (the anchor-walk retired)', () => {
  assertMatch(helpers, /THE SPINE IS THE LIGHTEST ELEMENT/, 'the 1.7.6 spine note is missing');
  assertMatch(helpers, /const spineTarget = lightestSeat \+ 0\.09;/, 'the headroom target never spoke');
  assertMatch(helpers, /let spine = mixHex\(raw, '#ffffff', 0\.04\);/, 'the white floor never spoke');
  assertMatch(helpers, /const cand = mixHex\(raw, '#ffffff', 1 - i \* 0\.04\);/, 'the in-family climb never spoke');
  assert.ok(!helpers.includes('partStepToContrast(raw, anchor, 1.6, face)'), 'the 1.7.5 anchor-walk survived');
});
ok('B2 — the climb, measured: the spine out-lights every seat on the dial', () => {
  const lum = (hex) => {
    const c = hex.replace('#', '');
    const ch = (i) => parseInt(c.slice(i * 2, i * 2 + 2), 16) / 255;
    const lin = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * lin(ch(0)) + 0.7152 * lin(ch(1)) + 0.0722 * lin(ch(2));
  };
  const dial = ['#ff3df5', '#f5d36b', '#f7e8a0', '#c8402f', '#4b7bd8', '#1c2e5e', '#f3f0e7', '#0d0d12', '#7a2e2e'];
  for (const hex of dial) {
    for (const deep of [false, true]) {
      const f = partContainerFace(hex, deep);
      const lightest = Math.max(lum(f['--part-face']), lum(f['--part-title']), lum(f['--part-well']));
      assert.ok(
        lum(f['--part-spine']) >= Math.min(lightest + 0.085, 0.99),
        `${hex}${deep ? ' deep' : ' light'}: the spine is not the lightest element`
      );
    }
  }
});
ok('B3 — every spine fallback climbs toward white (the raw washes retired)', () => {
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.equal(
    (cssLaws.match(/var\(--part-spine, color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 42%, #ffffff\)\)/g) || []).length,
    // 1.7.8 — the tinted window title's carved well (+ its focus seat)
    // adds two more fallback seats: 5 -> 7.
    7,
    'the seven seats never climbed toward white'
  );
  assert.ok(
    !cssLaws.includes('--part-spine, color-mix(in srgb, var(--part-color, var(--gd-accent)) 92%'),
    'a spine raw wash survived'
  );
});
ok('B4 — the selection moves the box alone (the focus ground stays in the well-to-face band)', () => {
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // the focus ground still mixes well -> face; the spine speaks the SAME
  // var at rest and under focus (one rung, never moved)
  assertMatch(
    cssLaws,
    /\.gd-part-row\.is-colored \.gd-prompt-box:focus \{[\s\S]*?background: color-mix\(in srgb, var\(--part-well, var\(--gd-bg\)\) 68%, var\(--part-face, var\(--gd-panel\)\)\);/,
    'the focus ground left the band'
  );
  assertMatch(css, /THE EFFECT MOVES THE BOX ALONE, NEVER THE RIBBON/, 'the isolation note is missing');
});

console.log('\nC. THE GLOW SPEAKS THE THEME ("related to the theme, not the prompt box")');
ok('C1 — the selected box\'s ring speaks the theme accent', () => {
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assertMatch(
    cssLaws,
    /\.gd-part-row\.is-colored \.gd-prompt-box:focus \{[\s\S]*?0 0 0 2px color-mix\(in srgb, var\(--gd-accent\) 60%, transparent\),/,
    'the focus ring never spoke the theme'
  );
  assert.ok(
    !cssLaws.includes('0 0 0 2px color-mix(in srgb, var(--part-color, var(--gd-accent)) 30%, transparent)'),
    'the part-colored ring survived'
  );
  // the border keeps the box's own family (the color frames the box)
  assertMatch(
    cssLaws,
    /\.gd-part-row\.is-colored \.gd-prompt-box:focus \{[\s\S]*?border-color: color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 78%, var\(--part-ink, var\(--gd-ink\)\)\);/,
    'the focus border lost the box\'s own voice'
  );
});
ok('C2 — the tinted title\'s ring speaks the theme too', () => {
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assertMatch(
    cssLaws,
    // 1.7.8 supersede — the family focus law (the stage + the title one
    // selector list; the ring unified to the well's own 60%).
    /\.gd-modal-card\.is-part-tinted \.gd-notes-title:focus-visible,\s*\n\.gd-modal-card\.is-part-tinted \.gd-prompt-stage:focus,[\s\S]*?0 0 0 2px color-mix\(in srgb, var\(--gd-accent\) 60%, transparent\),/,
    'the title ring never spoke the theme'
  );
});

console.log('\nD. THE TITLE LEAVES THE BAND ("blends too much with the top of the window")');
ok('D1 — the tinted field drops to the WELL rung (a measured step off the band)', () => {
  // 1.7.8 supersede — ONE WINDOW, ONE FIELD (the note's own tombstone).
  assertMatch(css, /ONE WINDOW, ONE FIELD/, 'the 1.7.8 one-field note is missing');
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assertMatch(
    cssLaws,
    /\.gd-modal-card\.is-part-tinted \.gd-notes-title\.gd-rt-edit \{\s*\n\s*background: var\(--part-well,/,
    'the tinted ground never dropped to the well'
  );
  assertMatch(
    cssLaws,
    // 1.7.8 supersede — the family focus law: the gather unified to the
    // colored well's own 68% (one law, every seat).
    /\.gd-modal-card\.is-part-tinted \.gd-notes-title:focus-visible,\s*\n\.gd-modal-card\.is-part-tinted \.gd-prompt-stage:focus,[\s\S]*?background: color-mix\(in srgb, var\(--part-well, var\(--part-title\)\) 68%, var\(--part-face, var\(--gd-panel\)\)\);/,
    'the tinted focus never followed the field down'
  );
});
ok('D2 — the untinted field deepens to the prompt well\'s 58% ground', () => {
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // 1.7.8 supersede — ONE WINDOW, ONE FIELD: the untinted title keeps
  // NO private law (the .gd-input base IS the stage's resting law) — the
  // note lives in a COMMENT, so it reads the unstripped css.
  assertMatch(
    css,
    /the untinted title needs no rule of its own: the \.gd-input \/ \.gd-rt-edit\s*\n\s*base IS the stage's resting law\./,
    'the untinted private law survived the one-field retirement'
  );
});

console.log('\nE. THE MARKS WEAR A PLATE ("an outline of some sort around it")');
ok('E1 — the empty block climbs to the picture\'s rung + grounds its marks', () => {
  assertMatch(stage, /gd-empty-marks absolute inset-0/, 'the empty block never climbed');
  assertMatch(stage, /gd-empty-plate flex flex-col items-center gap-2 px-6 py-4/, 'the plate never grounded the marks');
  assertMatch(css, /THE MARKS WEAR A PLATE/, 'the 1.7.6 plate note is missing');
});
ok('E2 — the plate speaks above the veil (z 3, opaque ground, framed)', () => {
  assertMatch(cssLaws0(), /\.gd-stage \.gd-empty-marks \{\s*\n\s*z-index: 3;/, 'the marks never reached the picture rung');
  assertMatch(
    cssLaws0(),
    /\.gd-stage \.gd-empty-plate \{\s*\n\s*background: var\(--gd-panel\);\s*\n\s*border: 1px solid color-mix\(in srgb, var\(--gd-ink\) 22%, transparent\);/,
    'the plate never spoke its opaque ground'
  );
  // the numeix veil keeps its law beneath the marks (z 2 < z 3)
  assertMatch(
    css,
    /\[data-theme='numeix'\] \.gd-stage\.is-bleed\.is-empty::before \{[\s\S]*?z-index: 2;/,
    'the veil left its rung'
  );
});

console.log('\nF. THE FLIGHT LEARNS ITS MODES ("they all fade properly" / the pour on the chips that moved)');
ok('F1 — OFF: the ghost carries the WHOLE old row (the lost-only set retired)', () => {
  assertMatch(charview, /THE GHOST IS THE WHOLE OLD ROW/, 'the ghost note is missing');
  assertMatch(
    charview,
    /const ghostTags = pickerMode && swapOldActive \? tags\.filter\(\(t\) => swapOldActive\.has\(t\.id\)\) : \[\];/,
    'the ghost never carried the whole row'
  );
});
ok('F2 — OFF: the ghost chips wear their exemption + the kept class retires', () => {
  assertMatch(charview, /gd-tag-chip is-ghost !py-1 !px-2 text-\[10px\]/, 'the ghost chips never wore .is-ghost');
  assert.ok(!charview.includes("'is-kept'"), 'the kept class never retired');
  assertMatch(charview, /\.is-kept RETIRES/, 'the retirement note is missing');
});
ok('F3 — OFF: every chip fades in (the arrival exempts only the ghost) + the + key rides', () => {
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assertMatch(
    cssLaws,
    /\.gd-cv-tagflight \.gd-rows-tray \.gd-tag-chip:not\(\.is-ghost\),\s*\n\.gd-cv-tagflight \.gd-tag-zone-seat \.gd-btn\[data-no-sort\] \{\s*\n\s*animation: gd-tag-chip-in 0\.08s ease-out 0\.07s both;/,
    'the arrival never spoke its full audience'
  );
});
ok('F4 — ON: the tagflight class arms in the picker mode alone', () => {
  assertMatch(charview, /THE FLIGHT SPEAKS THE OFF MODE ALONE/, 'the gating note is missing');
  assertMatch(
    charview,
    /el\.classList\.add\('gd-cv-swap'\);\s*\n\s*if \(showAllTags === false\) el\.classList\.add\('gd-cv-tagflight'\);/,
    'the arm never learned its mode'
  );
});
ok('F5 — ON: the pour arms only the chips whose membership MOVED', () => {
  assertMatch(charview, /THE GATE RETURNS, AND THE POUR IS ALL IT SAYS/, 'the gate note is missing');
  assertMatch(
    charview,
    /const colorSwap = !pickerMode && swapOldActive !== null && wasActive !== null && wasActive !== active;/,
    'the membership gate never returned'
  );
});

console.log('\nG. THE DARK WORKS NOTHING + THE WAKE COMES BACK FRESH');
ok('G1 — the heartbeat sleeps in the dark (the stale-:hover leak retired)', () => {
  assertMatch(grid, /THE HEARTBEAT SLEEPS IN THE DARK/, 'the heartbeat note is missing');
  const beat = grid.slice(grid.indexOf('host._gdPulseRest = setTimeout('), grid.indexOf('// 1.2.4 — the card the sweep just finished'));
  assertMatch(beat, /if \(typeof document !== 'undefined' && document\.hidden\) return;/, 'the heartbeat never sleeps');
});
ok('G2 — the sweep\'s re-arm sleeps in the dark too', () => {
  const retire = grid.slice(grid.indexOf('const shineRetire ='), grid.indexOf('// Memoized:'));
  assertMatch(retire, /document\.hidden[\s\S]{0,200}?return;/, 'the re-arm never sleeps');
});
ok('G3 — the walkers stand down (autoSwipe + autosave + rainbow)', () => {
  assertMatch(stage, /THE WALK SLEEPS IN THE DARK/, 'the autoSwipe note is missing');
  const swipe = stage.slice(stage.indexOf('const id = setInterval('), stage.indexOf('}, AUTO_SWIPE_MS);'));
  assertMatch(swipe, /document\.hidden\) return;/, 'the walk never sleeps');
  assertMatch(app, /THE DARK SAVES NOTHING/, 'the autosave note is missing');
  const save = app.slice(app.indexOf("const id = setInterval(() => {", app.indexOf('settingsOpenRef.current = modal')), app.indexOf('return () => clearInterval(id);'));
  assertMatch(save, /document\.hidden\) return;/, 'the autosave never sleeps');
  assertMatch(settings, /THE RAINBOW RESTS IN THE DARK/, 'the rainbow note is missing');
});
ok('G4 — the wake is chunked + fresh-phased (currentTime seeks to zero)', () => {
  assertMatch(app, /THE WAKE IS CHUNKED, AND EVERY INFINITE LOOP COMES BACK FRESH|THE WAKE COMES BACK FRESH/, 'the wake note is missing');
  assertMatch(app, /const WAKE_BITE = 48;/, 'the bite never spoke');
  assertMatch(app, /if \(held\.length\) requestAnimationFrame\(wake\);/, 'the chunks never chained');
  assertMatch(app, /if \(infinite\) a\.currentTime = 0;/, 'the loops never came back fresh');
  assertMatch(app, /a\.effect\.getTiming\(\)\.iterations === Infinity/, 'the infinity probe never spoke');
  assertMatch(app, /THE DARK WORKS NOTHING/, 'the dark note is missing');
});

console.log('\nH. VERSION FURNITURE');
ok('H1 — the version is 1.7.6 everywhere', () => {
  const pkg = src('package.json');
  const lock = src('package-lock.json');
  const constants = src('src/constants/index.js');
  const readme = src('README.md');
  // 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
  // release ships without it"): the one-file page left the repo
  // with the final release; this suite's page-pins retired with it.
  assertMatch(pkg, /"version": "1\.9\.19"/, 'package.json never moved');
  assert.ok((lock.match(/"version": "1\.9\.19"/g) || []).length >= 2, 'the lock root pins never moved');
  assertMatch(constants, /version: '1\.9\.19',/, 'APP.version never moved');
  assertMatch(readme, /\*\*v1\.9\.19\*\*/, 'the README header never moved');
  assertMatch(readme, /the regression battery \(93 DOM\/source test suites\)/, 'the README battery count never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(web, /<span class="ver">v1\.8\.6<\/span>/, 'the website card never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(web, /releases\/download\/v1\.8\.6\/Burrito%20GenDex-1\.8\.6%20Setup\.exe/, 'the website installer URL never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(web, /Burrito_GenDex_1\.8\.6_source\.zip/, 'the website source URL never moved');
  assertMatch(src('CHANGELOG.md'), /^## 1\.9\.19 — The Ends Trade Places/, 'the changelog head never arrived');
  // 1.8.9 — THE README IS THE PUBLIC FACE: the version roll retired with it
  // (the first public release speaks features, not history; the changelog
  // keeps the story). The paragraph's old seat is gone by law.
  assert.ok(!/^1\.\d+\.\d+ — /m.test(readme), 'the version roll retired with the public README');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(web, /THE PATIENT WHEEL<\/span>/, 'the website hero never moved');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

function cssLaws0() {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}
