// 1.8.0 batch — One Band, One Seat.
// (Named 181 in the sequence: 180 pins the 1.7.9 laws; this suite pins
//  the 1.8.0 laws at their roots.)
// The reported items, each pinned at its root law:
//   A.  ONE BAND AT THE EDGE ("the trim does follow it now , except one
//       issue , the trim on the right side seems to have the trim effect
//       overlay duplicated once more inwards , hovering mid image , fix
//       that")
//   B.  THE WELL'S OWN CURSOR + ITS CONSTANT LANE ("first make it so the
//       typeable cursor icon doesnt appear when i hover over it , instead
//       its the normal cursor (or select one idc) , secondly teh well
//       seems to resize whether i have a scrollbar or not , fix that so
//       the size is consistant")
//   C.  THE GRIP EARNS ITS FRAME ("lastly the bottom right corner part of
//       the well (aka the one i use to resize the container) should have
//       an outline that fits with the scrollbar (even if hidden)")
//   D.  THE KEYS SHED THEIR BADGE AND EARN THEIR AREAS ("make the areas
//       for each of the keys bigger since they are too small in the
//       window , also remove the keyboard icon on the left side")
//   E.  THE PANEL WAKES OPEN ("by default, tags/stamps area should be open
//       when opening the details tap from closed (aka not when switching
//       cards) , but when switching cards it remains as it currently is")
//   F.  THE WELL'S TEXT SPEAKS THE WELL'S OWN INK ("text color in
//       note/prompt containers should rely on the color of the container
//       inside of it , not the color of the container generally (since
//       the text container usually is darker)")
//   G.  THE PICKER'S HINT RIDES THE HELP TEXT SWITCH ("6 OF 13 ON THIS
//       CARD · CLICK TO ADD OR REMOVE · DRAG TO REORDER text in the tag
//       viewer during unselected tags off mode should be included only in
//       help text turned on mode only and not always")
// Plus the version furniture (1.8.0 everywhere).

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
const charview = src('src/components/CharacterView.jsx');
const settings = src('src/components/SettingsModal.jsx');
const picker = src('src/components/TagPickerModal.jsx');
const app = src('src/App.jsx');
const helpers = src('src/utils/helpers.js');
const readme = src('README.md');
const changelog = src('CHANGELOG.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const pkg = src('package.json');
const constants = src('src/constants/index.js');
const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');

const familyRule = (fam) => {
  const marker = `.gd-fin-on-trim:has(.gd-trim-${fam}) .gd-card-face-finish.is-plate-only.is-over-trim {`;
  const at = cssLaws.indexOf(marker);
  assert.ok(at >= 0, `the ${fam} family rule never spoke`);
  return cssLaws.slice(at, cssLaws.indexOf('}', at));
};

console.log('\nA. ONE BAND AT THE EDGE ("duplicated once more inwards, hovering mid image")');
ok('A1 — the law note speaks its name', () => {
  assertMatch(css, /1\.8\.0 — ONE BAND AT THE EDGE/, 'the right-edge law note is missing');
});
ok('A2 — the tw-c percentage seats are gone (every corner at plain 100%)', () => {
  assert.ok(!cssLaws.includes('calc(100% - var(--tw-c))'), 'a calc(100% - var(--tw-c)) seat survived — the corner annuli still float');
});
ok('A3 — the line family re-seats its right runs (3px / 5px insets, not 4 / 6)', () => {
  for (const fam of ['dash', 'double', 'bold']) {
    const rule = familyRule(fam);
    assertMatch(rule, /calc\(100% - 3px\) calc\(var\(--tw-r\) \+ 3px\),/, `the ${fam} outer right run never re-seated`);
  }
  assertMatch(familyRule('double'), /calc\(100% - 5px\) calc\(var\(--tw-r\) \+ 3px\),/, 'the double inner right run never re-seated');
});
ok('A4 — the seal-band families seat their right seals flush (plain 100%)', () => {
  for (const fam of ['frame', 'gallery', 'scallop', 'gold', 'vine', 'beads', 'rivet']) {
    const rule = familyRule(fam);
    assertMatch(rule, /100% 0,/, `the ${fam} right seal never seated flush`);
  }
});
ok('A5 — the frame studs ride their 1px inset (not 10px)', () => {
  const rule = familyRule('frame');
  assertMatch(rule, /calc\(100% - 1px\) 1px,/, 'the TR stud never re-seated');
  assertMatch(rule, /calc\(100% - 1px\) calc\(var\(--gd-art-h\) - 10px\);/, 'the BR stud never re-seated');
});
ok('A6 — the scallop stitch + arc columns speak the documented law', () => {
  const rule = familyRule('scallop');
  assertMatch(rule, /calc\(100% - 9px\) 17px,/, 'the right stitch never re-seated (10.5 - 1.5)');
  assertMatch(rule, /100% calc\(var\(--gd-art-h\) \/ 2 - 6px\),\s*100% calc\(var\(--gd-art-h\) \/ 2 - 6px\),/, 'the right arc columns never seated flush');
});
ok('A7 — the vine leaves + sprays speak the documented law', () => {
  const rule = familyRule('vine');
  assertMatch(rule, /100% calc\(var\(--gd-art-h\) \/ 2 - 6\.5px\),/, 'the right leaf A never seated flush');
  assertMatch(rule, /calc\(100% - 1\.5px\) calc\(var\(--gd-art-h\) \/ 2\),/, 'the right leaf B never re-seated');
  assertMatch(rule, /calc\(100% - 2px\) 2px,/, 'the TR spray never re-seated');
  assertMatch(rule, /calc\(100% - 2px\) calc\(var\(--gd-art-h\) - 30px\);/, 'the BR spray never re-seated');
});
ok('A8 — the documented seats stand untouched (the beads\' cords, the rivet\'s stitch)', () => {
  const beads = familyRule('beads');
  assertMatch(beads, /calc\(100% - 4\.5px\) 0,/, 'the beads outer cord lost its documented seat');
  assertMatch(beads, /calc\(100% - 9px\) 0,/, 'the beads inner cord lost its documented seat');
  assertMatch(familyRule('rivet'), /calc\(100% - 5px\) 18px,/, 'the rivet right stitch lost its documented seat');
  // the beads' middle cord moves to plain 100% (the real trim's own anchor)
  assertMatch(beads, /calc\(100% - 4\.5px\) 0,\s*100% 0,\s*calc\(100% - 9px\) 0,/, 'the middle cord never seated flush');
});
ok('A9 — every family\'s layer lists still agree (image / position / size / repeat counts)', () => {
  const splitTop = (s) => {
    const out = [];
    let depth = 0;
    let cur = '';
    for (const ch of s.replace(/\n/g, ' ')) {
      if (ch === '(') depth += 1;
      if (ch === ')') depth -= 1;
      if (ch === ',' && depth === 0) {
        out.push(cur);
        cur = '';
      } else cur += ch;
    }
    if (cur.trim()) out.push(cur);
    return out.length;
  };
  for (const fam of ['dash', 'double', 'bold', 'ledger', 'frame', 'gallery', 'scallop', 'gold', 'vine', 'beads', 'rivet']) {
    const rule = familyRule(fam);
    const grab = (prop) => {
      const m = new RegExp(`${prop}:\\s*(.*)$`, 'm').exec(rule);
      if (!m) return '';
      const lines = [m[1]];
      for (const line of rule.slice(m.index + m[0].length).split('\n')) {
        const st = line.trim();
        if (/^[a-z-]+:/.test(st) || st.startsWith('--') || st === '') {
          if (st === '') { lines.push(st); continue; }
          break;
        }
        lines.push(st);
      }
      return lines.join(' ');
    };
    const nImg = splitTop(grab('mask-image'));
    const nPos = splitTop(grab('mask-position'));
    const nSize = splitTop(grab('mask-size'));
    const nRep = splitTop(grab('mask-repeat'));
    assert.ok(nImg === nPos && nPos === nSize, `the ${fam} lists disagree (${nImg}/${nPos}/${nSize})`);
    assert.ok(nRep === 1 || nRep === nImg, `the ${fam} repeat list disagrees (${nRep} vs ${nImg})`);
    assert.ok(nImg >= 3, `the ${fam} rule lost its layers (${nImg})`);
  }
});
ok('A10 — the pixel probe exists (the right-edge mirror, measured)', () => {
  const probe = src('scripts/probe_trim_edge_180.mjs');
  assertMatch(probe, /ONE BAND AT THE EDGE/, 'the probe lost its law');
  assertMatch(probe, /the right edge mirrors the left/, 'the mirror check never spoke');
});

console.log('\nB. THE WELL\'S OWN CURSOR + ITS CONSTANT LANE ("typeable cursor" + "size is consistant")');
ok('B1 — the law note speaks its name', () => {
  assertMatch(css, /1\.8\.0 — THE WELL'S CONSTANT LANE/, 'the well lane note is missing');
});
ok('B2 — the well speaks the default cursor + reserves its lane', () => {
  const at = cssLaws.indexOf('.gd-well-shell .gd-prompt-box {');
  const rule = cssLaws.slice(at, cssLaws.indexOf('}', at));
  assert.ok(!rule.includes('cursor:'), 'the 1.8.0 default cursor survived — the I-beam cannot return to the text');
  assertMatch(rule, /scrollbar-gutter: stable;/, 'the stable gutter never spoke');
  assertMatch(rule, /overflow-y: auto;/, 'the scroll seat lost its word');
});

console.log('\nC. THE GRIP EARNS ITS FRAME ("an outline that fits with the scrollbar (even if hidden)")');
ok('C1 — the law note speaks its name', () => {
  assertMatch(css, /1\.8\.1 — THE GRIP SPEAKS THE CAPSULE'S OWN TONGUE/, 'the grip capsule note is missing');
});
ok('C2 — all four resizer seats speak the capsule (no border, radius + translucent fill)', () => {
  assertMatch(cssLaws, /\.gd-prompt-box::-webkit-resizer \{[^}]*border-radius: 4px;[^}]*color-mix\(in srgb, var\(--gd-ink\) 32%, transparent\) 0 1px,[^}]*color-mix\(in srgb, var\(--gd-ink\) 14%, transparent\);/, 'the resting grip capsule never spoke');
  assertMatch(cssLaws, /\.gd-prompt-box:focus::-webkit-resizer \{[^}]*color-mix\(in srgb, var\(--gd-ink\) 38%, transparent\) 0 1px,[^}]*color-mix\(in srgb, var\(--gd-ink\) 20%, transparent\);/, 'the focused grip capsule never spoke');
  assertMatch(cssLaws, /\.gd-part-row\.is-colored \.gd-prompt-box::-webkit-resizer \{[^}]*border-radius: 4px;[^}]*color-mix\(in srgb, var\(--part-ink, var\(--gd-ink\)\) 34%, transparent\) 0 1px,[^}]*color-mix\(in srgb, var\(--part-ink, var\(--gd-ink\)\) 16%, transparent\);/, 'the colored grip capsule never spoke');
  assertMatch(cssLaws, /\[data-theme='archive'\] \.gd-prompt-box::-webkit-resizer \{[^}]*border-radius: 4px;[^}]*color-mix\(in srgb, var\(--gd-ink\) 32%, transparent\) 0 1px,[^}]*color-mix\(in srgb, var\(--gd-ink\) 14%, transparent\);/, 'the archive grip capsule never spoke');
});

console.log('\nD. THE KEYS SHED THEIR BADGE AND EARN THEIR AREAS ("too small in the window" + "remove the keyboard icon")');
ok('D1 — the card-header\'s keyboard badge rides off', () => {
  assert.ok(!/gd-opt-icon">\s*<Keyboard size=\{14\} \//.test(settings), 'the header keyboard badge survived');
  assertMatch(settings, /THE SECTOR SHEDS ITS BADGE/, 'the badge-retirement note is missing');
  assertMatch(settings, /\{ id: 'Keys', icon: Keyboard, label: 'Keys' \}/, 'the left rail\'s own tab mark lost its seat (it is navigation, not content)');
});
ok('D2 — the row climbs to its stature (44px floor, 9px breathing)', () => {
  assertMatch(css, /THE ROWS EARN THEIR STATURE/, 'the row stature note is missing');
  assertMatch(cssLaws, /\.gd-scut-row \{\s*min-height: 44px;\s*padding: 9px 0;\s*\}/, 'the row floor never climbed');
  assertMatch(settings, /gd-scut-row flex items-center justify-between gap-3 text-\[11px\]/, 'the row text never grew');
});
ok('D3 — the icon squares climb to 30px (glyphs at 15px)', () => {
  assertMatch(cssLaws, /\.gd-scut-ico \{[\s\S]*?width: 30px;\s*height: 30px;/, 'the icon seat never climbed');
  assertMatch(settings, /<RowIcon size=\{15\} \/>/, 'the glyph never grew');
});
ok('D4 — the combo pills earn their area (96px floor, 6px/14px, 11px)', () => {
  assertMatch(css, /THE PILL EARNS ITS AREA/, 'the pill area note is missing');
  assertMatch(cssLaws, /\.gd-scut-key \{[\s\S]*?min-width: 96px;\s*padding: 6px 14px;[\s\S]*?font-size: 11px;/, 'the pill never earned its area');
});
ok('D5 — the CANCEL key + the hints grow with their pairs', () => {
  assertMatch(cssLaws, /\.gd-scut-cancel \{[\s\S]*?padding: 6px 10px;[\s\S]*?font-size: 10px;/, 'the CANCEL key never grew');
  assertMatch(cssLaws, /\.gd-scut-hint \{\s*font-size: 10px;/, 'the hint never grew');
  assertMatch(settings, /<X size=\{11\} \/>/, 'the CANCEL glyph never grew');
});
ok('D6 — the key cluster\'s reservation widens for the grown pair', () => {
  assertMatch(cssLaws, /\.gd-scut-keys \{[\s\S]*?min-width: 178px;/, 'the cluster reservation never widened');
});

console.log('\nE. THE PANEL WAKES OPEN ("open when opening the details tap from closed (aka not when switching cards)")');
ok('E1 — the law note speaks its name', () => {
  assertMatch(charview, /1\.8\.0 — THE PANEL WAKES OPEN/, 'the wake note is missing');
});
ok('E2 — the dormant wake edge opens the rows + disarms the auto-fold', () => {
  // 1.8.4 — the wake opens a tray that may hold a scroll-fold's loan: the
  // cover's dismissal rode the edge (dismissSeatDebt, before the rows
  // opened). 1.8.6 — THE SILENT ASCENT retired the loan whole: no fold
  // ever borrows, so the wake opens the tray by the hand's own word
  // (openTrayByHand — the page growing back with the tray's flight).
  assertMatch(charview, /const wasDormantRef = useRef\(dormant\);\s*useEffect\(\(\) => \{\s*if \(wasDormantRef\.current && !dormant\) \{\s*(?:\/\/[^\n]*\n\s*)*setRowsCollapsed\(\{ tags: false, stamps: false \}\);\s*openTrayByHand\(\);\s*\}\s*wasDormantRef\.current = dormant;\s*(?:\/\/[^\n]*\n\s*)*\}, \[dormant\]\);/, 'the wake effect never spoke');
});
ok('E3 — the first mount stays silent + the carry-over keeps its word', () => {
  // the wake only fires on the true -> false edge; the initializer + the write-through survive untouched
  assertMatch(charview, /const \[rowsCollapsed, setRowsCollapsed\] = useState\(\(\) => \{\s*const kept = ROWS_STATE_CACHE\.get\(character\.id\);/, 'the cache initializer lost its word');
  assertMatch(charview, /ROWS_STATE_CACHE\.set\(character\.id, \{ \.\.\.rowsCollapsed, auto: autoCollapsed === true \}\);/, 'the write-through lost its word');
});

console.log('\nF. THE WELL\'S TEXT SPEAKS THE WELL\'S OWN INK ("the color of the container inside of it")');
ok('F1 — the law note + the well-ink derivation speak in helpers', () => {
  assertMatch(helpers, /1\.8\.0 — THE WELL'S OWN INK/, 'the well-ink note is missing');
  assertMatch(helpers, /const wellGather = mixHex\(well, face, 0\.68\);/, 'the focus gather seat never spoke');
  assertMatch(helpers, /let wellInk = wellWorst\(partInkDark\) >= wellWorst\(partInkLight\) \? partInkDark : partInkLight;/, 'the well ink ladder never spoke');
  assertMatch(helpers, /\['--part-well-ink'\]: wellInk,/, 'the well ink var never threaded');
});
ok('F2 — the row\'s face-ink law releases the content well', () => {
  assertMatch(cssLaws, /\.gd-part-row\.is-colored \.gd-input,\s*\.gd-part-row\.is-colored \.gd-rt-edit \{\s*color: var\(--part-ink, var\(--gd-panel-text\)\);\s*\}/, 'the title family law never re-seated');
  const at = cssLaws.indexOf('.gd-part-row.is-colored .gd-input,');
  const block = cssLaws.slice(at, cssLaws.indexOf('}', at));
  assert.ok(!block.includes('.gd-prompt-box'), 'the content well still rides the face ink law');
});
ok('F3 — the well\'s own seat speaks the well-ink (text + placeholder)', () => {
  assertMatch(css, /THE WELL'S TEXT SPEAKS THE WELL'S OWN INK/, 'the well-text note is missing');
  assertMatch(cssLaws, /\.gd-part-row\.is-colored \.gd-prompt-box \{\s*color: var\(--part-well-ink, var\(--part-ink, var\(--gd-panel-text\)\)\);\s*\}/, 'the well text seat never spoke');
  assertMatch(cssLaws, /\.gd-part-row\.is-colored \.gd-prompt-box::placeholder \{\s*color: color-mix\(in srgb, var\(--part-well-ink, var\(--part-ink, var\(--gd-mute\)\)\) 62%, transparent\);/, 'the well placeholder never spoke');
});
ok('F4 — the tinted stage + the tinted title follow the same ground', () => {
  assertMatch(cssLaws, /\.gd-modal-card\.is-part-tinted \.gd-prompt-stage\.is-colored,\s*\.gd-modal-card\.is-part-tinted \.gd-notes-stage\.is-colored \{[\s\S]*?color: var\(--part-well-ink, var\(--part-ink, var\(--gd-panel-text\)\)\);/, 'the tinted stage never spoke the well ink');
  assertMatch(cssLaws, /\.gd-modal-card\.is-part-tinted \.gd-notes-title\.gd-input,\s*\.gd-modal-card\.is-part-tinted \.gd-notes-title\.gd-rt-edit \{[\s\S]*?color: var\(--part-well-ink, var\(--part-ink, var\(--gd-panel-text\)\)\);/, 'the tinted title never spoke the well ink');
});

console.log('\nG. THE PICKER\'S HINT RIDES THE HELP TEXT SWITCH ("included only in help text turned on mode")');
ok('G1 — the picker accepts the switch + gates the hint behind it', () => {
  assertMatch(picker, /1\.8\.0 — THE HINT RIDES THE HELP TEXT SWITCH/, 'the hint-gate note is missing');
  assertMatch(picker, /showHelp = false,\s*\}\) \{/, 'the showHelp prop never arrived');
  assertMatch(picker, /\{showHelp && \(\s*<span className="text-\[9px\] font-bold tracking-\[0\.18em\] uppercase text-gd-mute flex-1">\s*\{activeCount\} OF \{tags\.length\} ON THIS CARD · CLICK TO ADD OR REMOVE · DRAG TO REORDER\s*<\/span>\s*\)\}/, 'the hint never gated');
});
ok('G2 — App threads the switch into the picker\'s mount', () => {
  assertMatch(app, /1\.8\.0 — the footer's hint joins the HELP TEXT law/, 'the App threading note is missing');
  assertMatch(app, /<TagPickerModal[\s\S]{0,700}showHelp=\{showHelp\}/, 'the switch never threaded');
});
ok('G3 — the footer keeps its keys at the rail\'s end (justify-end)', () => {
  assertMatch(picker, /<div className="flex items-center gap-2 justify-end">/, 'the footer layout never re-seated');
  assertMatch(picker, /TAG MANAGER/, 'the manager door left');
  assertMatch(picker, /DONE/, 'the done key left');
});

console.log('\nH. THE VERSION FURNITURE (1.8.0 everywhere)');
ok('H1 — the version is 1.8.0 everywhere', () => {
  assert.equal(JSON.parse(pkg).version, '1.9.19', 'package.json');
  assertMatch(constants, /version: '1\.9\.19',/, 'constants');
  assertMatch(readme, /\*\*v1\.9\.19\*\*/, 'README');
  // 1.8.9 — THE README IS THE PUBLIC FACE: the version roll retired with it
  // (the first public release speaks features, not history; the changelog
  // keeps the story). The paragraph's old seat is gone by law.
  assert.ok(!/^1\.\d+\.\d+ — /m.test(readme), 'the version roll retired with the public README');
  assertMatch(readme, /the regression battery \(93 DOM\/source test suites\)/, 'the README battery count never moved');
  assertMatch(changelog, /^## 1\.9\.19 — The Ends Trade Places/, 'the changelog head never arrived');
  assertMatch(changelog, /^## 1\.7\.9 — The Shape Of The Trim/m, 'the 1.7.9 entry lost its seat');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /<span class="ver">v1\.8\.6<\/span>/, 'the website card never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /THE PATIENT WHEEL<\/span>/, 'the website hero tagline never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /releases\/tag\/v1\.8\.6"/, 'the release URL never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /Burrito_GenDex_1\.8\.6_source\.zip/, 'the source URL never moved');
});
console.log('  ok — retired with the website in 1.8.8 — ' + 'H2 — the 1.7.8 row\'s link keeps its own release (the sweep disease cured)');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
