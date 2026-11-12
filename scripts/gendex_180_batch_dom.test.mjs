// 1.7.9 batch — The Shape Of The Trim.
// (Named 180 in the sequence: 179 pins the 1.7.8 laws; this suite pins
//  the 1.7.9 laws at their roots.)
// The reported items, each pinned at its root law:
//   A.  THE WASH SPEAKS THE FAMILY'S OWN SHAPE ("the trim works alone
//       thats correct but its not accounting for the trim's shape and the
//       gabs that it has, fix that so it accounts for them")
//   B.  THE WELL'S CHROME GOES QUIET ("the well is good but its too
//       distracting and feels off, give it a design to fit even without
//       the scrollbar for the prompt/note container")
//   C.  THE RING SPEAKS AT EVERY EDGE ("its not visible at the bottom and
//       on the right of the container, its covered by the container
//       style, fix that")
//   D.  THE WINDOW STOPS ANSWERING ("dont highlight the entire expanded
//       whindow when i select the title or prompt/note inside (ONLY FIX
//       THAT IN EXPANDED WINDOW MODE)")
//   E.  THE KEYS EARN THEIR RHYTHM ("add dividors between each of the
//       keys and an icon associated")
//   F.  THE TAGS SPEAK THE FAMILY'S CLOCK ("the unselected tags feedback
//       (during on and off) is too slow compared to the rest of the detail
//       window feedbacks such as the stamps and the title etc.. fix that
//       so they are on the same speed")
//   G.  THE PICKER EARNS THE WALL'S OWN HAND ("when opening tags in
//       unselected tags off mode and it opens teh window, allow me to
//       drag and sort them, simmilar to how it works normally")
// Plus the version furniture (1.7.9 everywhere).

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

console.log('\nA. THE WASH SPEAKS THE FAMILY\'S OWN SHAPE ("not accounting for the trim\'s shape and the gabs")');
ok('A1 — the law note speaks its name', () => {
  assertMatch(css, /1\.7\.9 — THE WASH SPEAKS THE FAMILY'S OWN SHAPE/, 'the family-shape note is missing');
});
ok('A2 — the base rule is the plate alone (the synthetic ring retires)', () => {
  const at = cssLaws.indexOf('.gd-fin-on-trim .gd-card-face-finish.is-plate-only.is-over-trim {');
  const rule = cssLaws.slice(at, cssLaws.indexOf('}', at));
  assertMatch(rule, /background-origin: border-box;/, 'the pattern-anchor guard never spoke');
  assertMatch(rule, /--tw-r: calc\(var\(--gd-shape-radius, var\(--gd-radius\)\) - var\(--gd-border-w, 2px\)\);/, 'the family geometry helper never spoke');
  assertMatch(rule, /mask-image: linear-gradient\(\s*to bottom,\s*rgba\(0, 0, 0, 0\) 0,\s*rgba\(0, 0, 0, 0\) calc\(var\(--gd-art-h\) - 0\.5px\),\s*#000 calc\(var\(--gd-art-h\) - 0\.5px\)\s*\);/, 'the plate-only default never spoke');
  assert.ok(!/padding:/.test(rule), 'the synthetic ring\'s padding survived');
  assert.ok(!/mask-composite/.test(rule), 'a composite operator survived (every family layer unions by default)');
});
ok('A3 — all eleven families carry their own mask rule', () => {
  for (const fam of ['dash', 'double', 'bold', 'ledger', 'frame', 'gallery', 'scallop', 'gold', 'vine', 'beads', 'rivet']) {
    const marker = `.gd-fin-on-trim:has(.gd-trim-${fam}) .gd-card-face-finish.is-plate-only.is-over-trim {`;
    assert.ok(cssLaws.includes(marker), `the ${fam} family rule never spoke`);
  }
});
ok('A4 — every family\'s layer lists agree (image / position / size / repeat counts)', () => {
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
ok('A5 — the gaps stay gaps (per-family gap geometry)', () => {
  // the dash: dashed runs, never a continuous band
  const dash = familyRule('dash');
  assertMatch(dash, /repeating-linear-gradient\(90deg, #000 0 3px, transparent 3px 6px\)/, 'the dash rhythm never spoke');
  // the ledger: two horizontal rails and NOTHING else
  const ledger = familyRule('ledger');
  assertMatch(ledger, /0 6px,\s*0 calc\(var\(--gd-art-h\) - 7\.5px\);/, 'the ledger rails never re-anchored at the art line');
  assert.ok(!/100% 100%/.test(ledger.replace(/mask-size:[^;]*;/, '')), 'a full-height layer crept into the ledger');
  // the gallery: four brackets alone (8 strips, no full-width bands)
  const gallery = familyRule('gallery');
  assertMatch(gallery, /40% 4px,\s*4px calc\(var\(--gd-art-h\) \* 0\.4\)/, 'the bracket arms never spoke');
  // the beads: the pearls hang as discs with the cord + rails, no solid band
  const beads = familyRule('beads');
  assertMatch(beads, /radial-gradient\(circle 3\.5px at 3\.5px 5px, #000 0 3\.5px, transparent 3\.6px\)/, 'the pearl discs never spoke');
  // the rivet: the dome footprint on the 12px period, the seam dashes
  const rivet = familyRule('rivet');
  assertMatch(rivet, /radial-gradient\(circle at 6px 3\.2px, #000 0 3\.8px, transparent 3\.9px\)/, 'the dome footprint never spoke');
  assertMatch(rivet, /repeating-linear-gradient\(90deg, #000 0 2px, transparent 2px 5px\)/, 'the seam dashes never spoke');
  // the scallop: the family's own arc tiles, air kept between them
  const scallop = familyRule('scallop');
  assertMatch(scallop, /radial-gradient\(circle 6px at 50% 0%, transparent 0 4\.7px, #000 4\.7px 6\.1px, transparent 6\.2px\)/, 'the scallop arcs never spoke');
  // the vine: the staggered leaf ellipses
  const vine = familyRule('vine');
  assertMatch(vine, /radial-gradient\(ellipse 5px 3\.6px at 50% 34%, #000 0 80%, transparent 81%\)/, 'the leaf tiles never spoke');
});
ok('A6 — the plate leads every family list (the 1.7.5 plain cut, unioned in)', () => {
  for (const fam of ['dash', 'ledger', 'gallery', 'beads', 'rivet']) {
    const rule = familyRule(fam);
    assertMatch(rule, /mask-image: linear-gradient\(\s*to bottom,\s*rgba\(0, 0, 0, 0\) 0,\s*rgba\(0, 0, 0, 0\) calc\(var\(--gd-art-h\) - 0\.5px\),\s*#000 calc\(var\(--gd-art-h\) - 0\.5px\)\s*\),/, `the plate never led the ${fam} list`);
  }
});
ok('A7 — the clone keeps its seat (the picker\'s echo, untouched)', () => {
  assertMatch(ribbon, /export function TrimCoatLayer/, 'the clone layer left');
  assertMatch(css, /\.gd-trim\.gd-trim-coat \{\s*z-index: 4;/, 'the clone\'s rung left');
});

console.log('\nB. THE WELL\'S CHROME GOES QUIET ("too distracting and feels off, a design that fits without the scrollbar")');
ok('B1 — the lane, the corner and the plate speak transparency', () => {
  assertMatch(
    cssLaws,
    /\.gd-prompt-box::-webkit-scrollbar-track,\s*\.gd-prompt-box::-webkit-scrollbar-corner,\s*\.gd-prompt-box::-webkit-resizer \{[\s\S]*?background: transparent;/,
    'the quiet chrome never spoke'
  );
});
ok('B2 — the thumb floats as a soft translucent capsule (no ground border)', () => {
  const thumb = /\.gd-prompt-box::-webkit-scrollbar-thumb \{[\s\S]*?\}/.exec(cssLaws)?.[0] || '';
  assertMatch(thumb, /background: color-mix\(in srgb, var\(--gd-ink\) 38%, transparent\);/, 'the capsule ink never spoke');
  assert.ok(!/border:/.test(thumb), 'the ground border survived on the thumb');
  const hover = /\.gd-prompt-box::-webkit-scrollbar-thumb:hover \{[\s\S]*?\}/.exec(cssLaws)?.[0] || '';
  assertMatch(hover, /60%, transparent\)/, 'the capsule hover never spoke');
  const focus = /\.gd-prompt-box:focus::-webkit-scrollbar-thumb \{[\s\S]*?\}/.exec(cssLaws)?.[0] || '';
  assertMatch(focus, /46%, transparent\)/, 'the focus firm-up never spoke');
});
ok('B3 — the resizer speaks the 1.8.1 capsule (32% strokes over the 14% fill)', () => {
  const res = /\.gd-prompt-box::-webkit-resizer \{[^}]*repeating-linear-gradient\([^}]*\}/.exec(cssLaws)?.[0] || '';
  assertMatch(res, /135deg,[\s\S]*?color-mix\(in srgb, var\(--gd-ink\) 32%, transparent\) 0 1px,[\s\S]*?transparent 1px 5px[\s\S]*?color-mix\(in srgb, var\(--gd-ink\) 14%, transparent\);/, 'the 1.8.1 capsule seat never spoke');
});
ok('B4 — the colored seats + the tinted stages speak the same quiet law', () => {
  const colored = /\.gd-part-row\.is-colored \.gd-prompt-box::-webkit-scrollbar-thumb,[\s\S]*?\}/.exec(cssLaws)?.[0] || '';
  assertMatch(colored, /color-mix\(in srgb, var\(--part-ink, var\(--gd-ink\)\) 42%, transparent\)/, 'the colored capsule never spoke');
  const coloredTrack = /\.gd-part-row\.is-colored \.gd-prompt-box::-webkit-scrollbar-track,[\s\S]*?background: transparent;/.exec(cssLaws)?.[0] || '';
  assert.ok(coloredTrack.length > 0, 'the colored lane never went quiet');
  const archive = /\[data-theme='archive'\] \.gd-prompt-box::-webkit-scrollbar-corner \{[\s\S]*?background: transparent;/.exec(cssLaws)?.[0] || '';
  assert.ok(archive.length > 0, 'the archive corner never went quiet');
});
ok('B5 — the law note speaks its name', () => {
  assertMatch(css, /THE CHROME GOES QUIET/, 'the quiet-chrome note is missing');
});

console.log('\nC. THE RING SPEAKS AT EVERY EDGE ("covered by the container style at the bottom and right")');
ok('C1 — the tinted focus law drops its grounded shadow (the field lifts out of its carve)', () => {
  const at = cssLaws.indexOf('.gd-modal-card.is-part-tinted .gd-notes-title:focus,');
  const rule = cssLaws.slice(at, cssLaws.indexOf('}', at));
  assertMatch(rule, /0 0 0 2px color-mix\(in srgb, var\(--gd-accent\) 60%, transparent\),/, 'the ring never spoke on the tinted focus');
  assertMatch(rule, /0 0 12px 2px color-mix\(in srgb, var\(--gd-accent\) 28%, transparent\);/, 'the halo never spoke on the tinted focus');
  assert.ok(!/2px 2px 0/.test(rule), 'the grounded L-band survived on focus');
  // the carve keeps its rest (the grounded shadow lives at REST, never on focus)
  const rest = cssLaws.indexOf('.gd-modal-card.is-part-tinted .gd-notes-title.gd-input,');
  const restRule = cssLaws.slice(rest, cssLaws.indexOf('}', rest));
  assertMatch(restRule, /2px 2px 0 color-mix\(in srgb, var\(--part-color, var\(--gd-accent\)\) 38%, #0e0e0e\);/, 'the resting carve lost its grounded shadow');
  assertMatch(css, /THE RING SPEAKS AT EVERY EDGE/, 'the every-edge note is missing');
});

console.log('\nD. THE WINDOW STOPS ANSWERING ("dont highlight the entire expanded window")');
ok('D1 — the window-level :has hue laws are gone (both cloths)', () => {
  assert.ok(!/\.gd-modal-card:has\(/.test(cssLaws), 'an untinted window hue law survived');
  assert.ok(!/\.gd-modal-card\.is-part-tinted:has\(/.test(cssLaws), 'a tinted window hue law survived');
  assertMatch(css, /THE WINDOW STOPS ANSWERING/, 'the window-stop note never spoke');
});
ok('D2 — the modal card\'s transition keeps only the height/width tween', () => {
  const card = /\.gd-modal-card \{[\s\S]*?\}/.exec(cssLaws)?.[0] || '';
  assertMatch(card, /transition: height 0\.2s cubic-bezier\(0\.2, 0\.8, 0\.2, 1\), width 0\.2s cubic-bezier\(0\.2, 0\.8, 0\.2, 1\);/, 'the height/width tween lost its clock');
  assert.ok(!/border-color/.test(card), 'the border transition pair survived on the modal card');
});
ok('D3 — the FIELDS keep their own selection families (the fields never stopped speaking)', () => {
  assertMatch(cssLaws, /\.gd-modal-card \.gd-notes-title\.gd-input:focus,[\s\S]*?0 0 0 2px color-mix\(in srgb, var\(--gd-accent\) 60%, transparent\)/, 'the untinted field ring left');
  assertMatch(cssLaws, /\.gd-modal-card\.is-part-tinted \.gd-notes-title:focus,[\s\S]*?0 0 0 2px color-mix\(in srgb, var\(--gd-accent\) 60%, transparent\)/, 'the tinted field ring left');
});
ok('D4 — the MAIN VIEW keeps its row answer (the row :has family survives untouched)', () => {
  // 1.8.5 supersede — THE SELECTED OUTLINE OUT-RANKS EVERY HOVER: the
  // family doubles its own class (the DEEP shade's hover seat tied it
  // and won by order — the outline "disappearing" on the deep rows).
  assertMatch(cssLaws, /\.gd-part-row\.gd-part-row:has\(\.gd-prompt-box:focus\),\s*\.gd-part-row\.gd-part-row:has\(\.gd-rt-edit:focus\) \{/, 'the row family never spoke');
  assertMatch(cssLaws, /\.gd-part-row\.gd-part-row\.is-colored:has\(\.gd-prompt-box:focus\),\s*\.gd-part-row\.gd-part-row\.is-colored:has\(\.gd-rt-edit:focus\) \{/, 'the colored row family never spoke');
});

console.log('\nE. THE KEYS EARN THEIR RHYTHM ("dividors between each of the keys and an icon associated")');
ok('E1 — the divider holds the line between rows', () => {
  // 1.8.2 — the title-era headroom rides off with the title (the roster meets the
  // card's padding directly; the sibling law below the teaching copy owns the 8px).
  assertMatch(cssLaws, /\.gd-scut-grid \{\s*display: flex;\s*flex-direction: column;\s*gap: 0;\s*margin-top: 0;/, 'the column law never spoke');
  assertMatch(cssLaws, /\.gd-scut-row \+ \.gd-scut-row \{\s*border-top: 1px solid var\(--gd-line\);/, 'the divider law never spoke');
  assertMatch(cssLaws, /\.gd-scut-row \{\s*min-height: 44px;\s*padding: 9px 0;/, 'the row breathing never spoke');
});
ok('E2 — the icon seat speaks the key pill\'s own family', () => {
  assertMatch(cssLaws, /\.gd-scut-ico \{\s*display: inline-flex;\s*align-items: center;\s*justify-content: center;\s*width: 30px;\s*height: 30px;/, 'the icon seat never spoke');
  assertMatch(cssLaws, /\.gd-scut-ico \{[\s\S]*?border: 1px solid var\(--gd-line\);/, 'the icon seat frame never spoke');
});
ok('E3 — the roster map carries a glyph for every action', () => {
  assertMatch(settings, /const SCUT_ICONS = \{[\s\S]*save: Save,[\s\S]*undo: Undo2,[\s\S]*redo: Redo2,[\s\S]*newCharacter: UserPlus,[\s\S]*settings: SlidersHorizontal,[\s\S]*panel: PanelRight,[\s\S]*outputBar: PanelTop,[\s\S]*tooltips: Speech,/, 'the glyph roster never spoke');
  assertMatch(settings, /<span className="gd-scut-ico" aria-hidden>\s*<RowIcon size=\{15\} \/>/, 'the icon mount never spoke');
  assertMatch(settings, /Redo2,/, 'the lucide imports never grew');
  assertMatch(settings, /UserPlus,/, 'the lucide imports never grew for the new-card glyph');
});

console.log('\nF. THE TAGS SPEAK THE FAMILY\'S CLOCK ("too slow compared to the stamps and the title")');
ok('F1 — the pour returns to the 0.15s family clock', () => {
  assertMatch(cssLaws, /\.gd-rows-tray \.gd-tag-chip\.is-swap-colorfade \{\s*animation: gd-tag-color-swap 0\.15s cubic-bezier\(0\.16, 1, 0\.3, 1\);/, 'the pour clock never returned');
  assertMatch(css, /THE POUR RETURNS TO THE FAMILY'S OWN CLOCK/, 'the family-clock note is missing');
});
ok('F2 — the off-mode flight compresses to the same 0.15s total', () => {
  assertMatch(cssLaws, /\.gd-tag-ghost-row \{[\s\S]*?animation: gd-tag-ghost-out 0\.07s ease-out forwards;/, 'the ghost clock never compressed');
  assertMatch(cssLaws, /\.gd-cv-tagflight \.gd-rows-tray \.gd-tag-chip:not\(\.is-ghost\),\s*\.gd-cv-tagflight \.gd-tag-zone-seat \.gd-btn\[data-no-sort\] \{\s*animation: gd-tag-chip-in 0\.08s ease-out 0\.07s both;/, 'the arrival clock never compressed');
});
ok('F3 — the tag state\'s window shrinks with them (320ms -> 170ms)', () => {
  assertMatch(charview, /setTagSwapOldActive\(null\);\s*\n\s*\}, 170\);/, 'the tag window never shrank');
  assert.ok(!/\}, 320\);/.test(charview), 'the old 320ms window survived');
});

console.log('\nG. THE PICKER EARNS THE WALL\'S OWN HAND ("allow me to drag and sort them")');
ok('G1 — the picker speaks the sort engine (geometry mode, button bodies)', () => {
  assertMatch(picker, /import useThumbSort from '\.\/useThumbSort\.js';/, 'the engine never arrived');
  assertMatch(picker, /const \{ sort, bindItem, itemStyle, dragStyle, sorting \} = useThumbSort\(\{/, 'the engine never armed');
  assertMatch(picker, /useGeometry: true,/, 'the geometry mode never spoke');
  assertMatch(picker, /dragButtons: true,/, 'the button-body law never spoke');
  assertMatch(picker, /onCommit: \(from, to\) => onReorderTags\?\.\(from, to\),/, 'the commit door never spoke');
});
ok('G2 — the chips carry the sort seats (gd-sort-item + the drag styles)', () => {
  assertMatch(picker, /'gd-chip gd-tag-chip !py-1 !px-2 text-\[10px\]',\s*'gd-sort-item',\s*isDragged && 'is-dragging'/, 'the chip sort seats never spoke');
  assertMatch(picker, /\.\.\.\(isDragged \? dragStyle : itemStyle\(i\) \|\| null\),/, 'the drag styles never threaded');
  assertMatch(picker, /\{\.\.\.bindItem\(i\)\}/, 'the bindings never threaded');
  assertMatch(picker, /data-tag-id=\{tag\.id\}/, 'the chip key never spoke');
});
ok('G3 — App passes the reorder door (the manager\'s own callback)', () => {
  assertMatch(app, /onReorderTags=\{reorderTags\}/, 'the reorder door never opened');
  assertMatch(app, /const reorderTags = useCallback\(/, 'the callback itself left');
});
ok('G4 — the toggle still speaks (a click never became a drag)', () => {
  assertMatch(picker, /onClick=\{\(\) => onToggleTag\?\.\(character\?\.id, tag\.id\)\}/, 'the toggle left');
  assertMatch(picker, /DRAG TO REORDER/, 'the footer hint never spoke');
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
  assertMatch(changelog, /^## 1\.7\.8 — Standing On Its Own/m, 'the 1.7.8 entry lost its seat');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /<span class="ver">v1\.8\.6<\/span>/, 'the website card never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /THE PATIENT WHEEL<\/span>/, 'the website hero tagline never moved');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assertMatch(website, /releases\/tag\/v1\.8\.6"/, 'the release URL never moved');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
