// 1.4.7 batch — THE PEARL FINDS ITS LEVELS.
// The reported items, each pinned at its root law:
//   1.  the classic COLOR key answers the hover (its own hover law — the
//       settings twin's feedback in swatch language)
//   2.  image motion greys without an image (the subject-truth law's
//       second axis reaches the sway switch)
//   3.  STAMP MOTION joins the family (the band + placed stickers follow
//       the image's sway a beat behind — the fifth switch, the whole rail)
//   4.  the switch row packs (content-sized labels, no flex-1 stretch)
//   5.  the tower rides inside the strip's container again
//   6.  the squish survives the panel opening ([data-pressed] — an
//       attribute React never rewrites)
//   7.  prismatic reworked (no artfin rainbow, see-through ribbons, the
//       stars on their own unmasked seat)
//   8.  opalescent rebuilt on the leveled noise map (discrete-level
//       turbulence masks, luminance mode)
//   9.  foil stops darkening (soft-light, never multiply)
//   10. the text rim thickens (1.7px)
//   11. the decorative trims carry edge seals (the line family exempt)
//   12. the motion zoom rides the gap law (data-motion-slack)
//   13. the edit-card window grows its "slightly" (pt-6 + vh-56)
//   14. the press speaks its buttons (left/right only, drags stand down)
//   15. the hover hold over the rows + the name
//   16. the covering open (coverOpen zones, nothing below moves)
//   17. the panel's opening lane examined and left alone (documented
//       discard — no blind rework over five versions of tuning)
//   18. nuri's tongues alternate their lengths (96x288 loom)
// Plus: the version is 1.4.7 everywhere.

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
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg || 'assertion failed');
};
assert.equal = (a, b, msg) => {
  if (a !== b) throw new Error(msg || `${a} != ${b}`);
};

const css = src('src/index.css');
const charSrc = src('src/components/CharacterView.jsx');
const newSrc = src('src/components/NewCharacterModal.jsx');
const styleSrc = src('src/components/CardStyleControls.jsx');
const lookSrc = src('src/components/CardLookEditor.jsx');
const gridSrc = src('src/components/GridView.jsx');
const appSrc = src('src/App.jsx');
const constSrc = src('src/constants/index.js');
const helpSrc = src('src/utils/helpers.js');
const sideSrc = src('src/components/SideFlow.jsx');
const modalSrc = src('src/components/Modal.jsx');
const ribbonSrc = src('src/components/TagRibbon.jsx');
const pkgSrc = src('package.json');
const changelogSrc = src('CHANGELOG.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const readmeSrc = src('README.md');

// ===========================================================================
// 1 — THE CLASSIC COLOR KEY ANSWERS THE HOVER
// ===========================================================================
ok('1a — the color key carries its own hover law (border, checker, ring)', () => {
  const rule = /\.gd-stamp-key-classic\.gd-stamp-key-color:hover\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(rule.includes('THE COLOR KEY SPEAKS ON HOVER') === false, 'comment lives above the rule');
  const hover = /\.gd-stamp-key-classic\.gd-stamp-key-color:hover\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/border-color:\s*var\(--gd-ink\)/.test(hover), 'the border firms to ink');
  assert(/repeating-conic-gradient/.test(hover), 'the checkerboard speaks on hover');
  assert(/color-mix\(in srgb, var\(--gd-ink\) 18%, transparent\)/.test(hover), 'the checker firms a step');
  assert(/0 0 0 2px color-mix\(in srgb, var\(--gd-ink\) 24%, transparent\)/.test(hover), 'the ink ring lifts the swatch');
  assert(/THE COLOR KEY SPEAKS ON HOVE[R]/.test(css), 'the law is documented at the seat');
});
ok('1b — the rule out-ranks the checkerboard base (later in the file)', () => {
  const baseAt = css.indexOf('.gd-stamp-key-classic.gd-stamp-key-color {');
  const hoverAt = css.indexOf('.gd-stamp-key-classic.gd-stamp-key-color:hover {');
  assert(baseAt > -1 && hoverAt > baseAt, 'the hover law is declared after the base it overrules');
});

// ===========================================================================
// 2 + 3 + 4 — THE SWITCH FAMILY (grey laws, stamp motion, the packing row)
// ===========================================================================
ok('2 — image motion greys without an image (the subject-truth law)', () => {
  const m = /className=\{clsx\('gd-check-row', noImage && 'is-off'\)\}[\s\S]{0,600}?<span>image motion<\/span>/.exec(styleSrc)?.[0] || '';
  assert(m.includes("disabled={noImage}"), 'the input is blind without an image');
  assert(m.includes('Needs an image'), 'the tooltip speaks its reason');
});
ok('3a — stamp motion speaks its own switch', () => {
  assert(/stampMotion = false,\s*\n\s*onStampMotion = null/.test(styleSrc), 'the props ride the signature');
  const m = /<span>stamp motion<\/span>/.exec(styleSrc)?.[0];
  assert(m, 'the switch says its own name');
  assert(/\(noStamp \|\| !imageMotion\) && 'is-off'/.test(styleSrc), 'the grey law gates on both subjects');
  assert(/disabled=\{noStamp \|\| !imageMotion\}/.test(styleSrc), 'the input is blind while gated');
  assert(/Needs image motion/.test(styleSrc), 'the engine reason speaks on hover');
});
ok('3b — the whole data rail carries cardStampMotion', () => {
  assert(/stampMotion: card\.stampMotion === true,/.test(constSrc), 'sanitizeCardLook speaks the rail');
  assert(/cardStampMotion: sanitizeCardLook\(card\)\.stampMotion,/.test(constSrc), 'makeCharacter writes the field');
  assert(/cardStampMotion: character\?\.cardStampMotion === true,/.test(helpSrc), 'the load sanitizer keeps the law');
  assert(/cardStampMotion: card\.stampMotion === true,/.test(appSrc), 'the edit window commits it');
  assert(/stampMotion,/.test(newSrc), 'the creation window drafts it');
  assert(/onStampMotion=\{touch\(setStampMotion\)\}/.test(charSrc), 'the edit window wires the switch');
  assert(/onStampMotion=\{setStampMotion\}/.test(newSrc), 'the creation window wires the switch');
  assert(/const \[stampMotion, setStampMotion\] = useState\(character\.cardStampMotion === true\);/.test(charSrc), 'the draft reads the card');
});
ok('3c — the sway law + scope class seat the motion', () => {
  assert(/\.gd-stamp-motion \.gd-card-stamp-band,/.test(css) && /\.gd-stamp-motion \.gd-card-stamp-placed \{/.test(css), 'the band + stickers sway');
  assert(/gd-stamp-sway 7\.5s ease-in-out infinite/.test(css), 'the image clock carries them');
  assert(/\* -7\.5s \+ 0\.42s\)/.test(css), 'the delay trails the art');
  assert(/@keyframes gd-stamp-sway/.test(css), 'the keyframes speak');
  assert(/--gd-sway/.test(css), 'the absolute reach var reads');
  assert(/cardStampMotion && 'gd-stamp-motion'/.test(gridSrc), 'the grid card arms the scope');
  assert(/imageMotion && stampMotion && 'gd-stamp-motion'/.test(lookSrc), 'the editor preview arms the scope');
  assert(/\['--gd-sway'\]/.test(gridSrc) && /\['--gd-sway'\]/.test(lookSrc), 'the surfaces write the reach');
  assert(/\['--gd-fin-ph'\]: finPhase,/.test(gridSrc), 'the root carries the sway phase');
  // freeze laws + stills
  assert(/\.gd-stamp-motion :is\(\.gd-card-stamp-band, \.gd-card-stamp-placed\)/.test(css), 'the freeze reaches the family');
  assert(/\.gd-stamp-motion \.gd-card-stamp-band,[\s\S]*?translate: none;/.test(css), 'the still reaches them too');
});
ok('4 — the switch labels keep their own width (the row packs)', () => {
  assert(!/gd-check-row flex-1 min-w-\[128px\]/.test(styleSrc), 'the flex-1 stretch is gone');
  const row = /mt-1\.5 flex flex-wrap[^"]*"/.exec(styleSrc)?.[0] || '';
  assert(row.includes('items-center'), 'the row aligns its labels');
  assert(/className=\{clsx\('gd-check-row'[,)]/.test(styleSrc), 'the labels are content-sized');
});

// ===========================================================================
// 5 — THE TOWER RIDES INSIDE THE CONTAINER
// ===========================================================================
ok('5 — the settings tower rides the strip flow again', () => {
  const inZone = /<StampPasteTile onPaste=\{\(records\) => naming\.push\(records\)\} \/>\s*\n\s*\{\/\* 1\.4\.7 — THE SETTINGS TOWER RIDES THE FLOW AGAIN/.exec(charSrc)?.[0];
  assert(inZone, 'the cluster seats after the paste tile (inside the zone)');
  assert(/<span className="gd-stamp-settings-cluster is-tower">/.test(charSrc), 'the tower speaks its cluster');
  assert(!/gd-row-tower/.test(charSrc), 'the 1.4.6 left-rail seat is retired');
});

// ===========================================================================
// 6 + 14 — THE PRESS (survives re-renders; speaks its buttons; drags retire)
// ===========================================================================
ok('6 — the armed seat is a data attribute React never rewrites', () => {
  assert(/\.gd-card\.gd-card-pulse\[data-pressed\]/.test(css), 'the CSS keys the attribute');
  assert(!/\.gd-card\.gd-card-pulse\.is-pressed/.test(css), 'the class law is retired');
  assert(/el\.setAttribute\('data-pressed', '1'\)/.test(gridSrc), 'the arm writes the attribute');
  assert(/removeAttribute\('data-pressed'\)/.test(gridSrc), 'the retirement clears it');
  assert(/THE FLIGHT OUTLIVES RE-RENDERS/.test(css), 'the root cause is documented');
});
ok('14 — left/right only, drags retire the jelly', () => {
  assert(/e\.button !== 0 && e\.button !== 2\) return/.test(gridSrc), 'the arm gates the buttons');
  assert(/pressAtRef/.test(gridSrc), 'the press is tracked');
  assert(/> 5\)/.test(gridSrc) && /killPulse\(\);/.test(gridSrc), 'the 5px travel retires the flight');
  assert(/onDragStart=\{\(e\) => \{[\s\S]*?killPulse\(\);[\s\S]*?onCardDragStart/.test(gridSrc), 'the native drag retires it too');
});

// ===========================================================================
// 7 — PRISMATIC, REWORKED
// ===========================================================================
ok('7a — the artfin rainbow is retired', () => {
  assert(!/\.gd-artfin-prismatic\s*\{/.test(css), 'the heat-map rule is gone');
  assert(!/gd-prism-heat-hue/.test(css), 'its hue clock is gone');
  assert(/onImage && \(finish === 'opalescent' \|\| finish === 'nuri'\)/.test(ribbonSrc), 'prismatic seats no artfin');
  assert(/THE PRISMATIC HEAT-MAP IS RETIRED/.test(css), 'the retirement is documented');
});
ok('7b — the waves go see-through', () => {
  const tile = /\.gd-prism-waves::before[\s\S]{0,2000}?96px 96px;/.exec(css)?.[0] || '';
  assert(/fill-opacity='0\.16'/.test(tile) && /fill-opacity='0\.14'/.test(tile), 'the ribbon alphas step down');
  assert(!/fill-opacity='0\.3'/.test(tile), 'the old solid bands are gone');
});
ok('7c — the stars ride their own unmasked seat', () => {
  assert(/\.gd-prism-stars::before\s*\{/.test(css), 'the field speaks its own rule');
  assert(!/\.gd-finish-prismatic::after\s*\{/.test(css), 'the body seat no longer carries the field');
  assert(/seat\('gd-prism-stars', null, false\)/.test(ribbonSrc), 'the seat never wears the plate-only veil');
  assert(/THE STARS LEAVE THE VEILED SEAT/.test(css), 'the law is documented');
});

// ===========================================================================
// 8 — OPALESCENT, REBUILT ON THE LEVELED NOISE MAP
// ===========================================================================
ok('8a — the noise fields quantize into discrete levels', () => {
  assert(/feTurbulence/.test(css) && /stitchTiles='stitch'/.test(css), 'the turbulence stitches');
  assert(/type='discrete' tableValues='0 0\.25 0\.5 0\.75 1'/.test(css), 'the fine field speaks five levels');
  assert(/type='discrete' tableValues='0 0\.34 0\.67 1'/.test(css), 'the coarse field speaks four');
  assert(/feColorMatrix in='t' type='matrix' values='0\.33 0\.33 0\.33/.test(css), 'the map reads luminance');
});
ok('8b — the fields mask in luminance mode and drift one period', () => {
  const tide = /\.gd-opal-tide::before[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/mask-mode: luminance/.test(tide), 'luminance is the mask law');
  assert(/inset: -160px/.test(tide), 'the field is oversized by its period');
  assert(/gd-opal-field-ne 19s linear infinite/.test(tide), 'the NE clock keeps its seat');
  const tideAfter = /\.gd-opal-tide::after[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/inset: -240px/.test(tideAfter) && /gd-opal-field-sw 31s linear infinite/.test(tideAfter), 'the coarse field drifts SW');
  assert(/translate\(160px, 160px\)/.test(css) && /translate\(-240px, 240px\)/.test(css), 'the travels are exactly one period');
});
ok('8c — the old pour + streaks are retired; the artfin speaks the map too', () => {
  assert(!/@keyframes gd-opal-tide\b/.test(css), 'the blob-tile clock is gone');
  assert(!/@keyframes gd-opal-streak/.test(css), 'the ruled streaks are gone');
  assert(!/gd-opal-tide 19s/.test(css), 'no rule speaks the retired flight');
  const artfin = /\.gd-artfin-opalescent::before[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/mask-mode: luminance/.test(artfin) && /gd-opal-artfin-drift 21s/.test(artfin), 'the sprite wears the map');
  assert(/overflow: hidden;/.test(/\.gd-card-face-artfin\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || ''), 'the artfin seat clips its field');
});

// ===========================================================================
// 9 — FOIL STOPS DARKENING
// ===========================================================================
ok('9 — the metal tints, never shades', () => {
  const foil = /\.gd-finish-foil\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/mix-blend-mode: soft-light;/.test(foil), 'the body speaks soft-light');
  assert(!/mix-blend-mode: multiply/.test(foil), 'the multiply shade is dead');
  assert(/rgba\(122, 108, 220, 0\.42\)/.test(foil), 'the stops live in the bright register');
  assert(/THE METAL STOPS DARKENING/.test(css), 'the law is documented');
});

// ===========================================================================
// 10 — THE TEXT RIM SPEAKS AT FULL VOICE
// ===========================================================================
ok('10 — the rim steps up to a real 1.7px', () => {
  const rim = /-webkit-text-stroke: calc\(([\d.]+)px \* var\(--card-scale, 1\)\)/.exec(css)?.[1];
  assert.equal(rim, '1.7', `the rim width reads ${rim}`);
});

// ===========================================================================
// 11 — THE TRIMS' EDGE SEAL
// ===========================================================================
ok('11 — every decorative trim seals; the line family is exempt', () => {
  for (const t of ['frame', 'gallery', 'scallop', 'gold', 'vine', 'beads', 'rivet']) {
    const rule = new RegExp(`\\.gd-trim-${t}\\s*\\{[\\s\\S]*?\\n\\}`).exec(css)?.[0] || '';
    assert(/box-shadow: inset 0 0 0/.test(rule), `the ${t} seal speaks`);
    assert(/border-radius: max\(var\(--trim-radius\), 0px\)/.test(rule), `the ${t} seal follows the curve`);
  }
  for (const t of ['dash', 'double', 'bold', 'ledger']) {
    const rule = new RegExp(`\\.gd-trim-${t}\\s*\\{[\\s\\S]*?\\n\\}`).exec(css)?.[0];
    assert.equal(rule, undefined, `the ${t} line keeps its intentional gap (no base rule)`);
  }
  assert(/THE EDGE SEAL/.test(css), 'the law is documented');
});

// ===========================================================================
// 12 — THE ZOOM RIDES THE GAP LAW
// ===========================================================================
ok('12a — the zoom is gated on the slack mark', () => {
  assert(/img:not\(\[data-motion-slack\]\)/.test(css), 'the zoom arms only unmarked frames');
  const law = /\.gd-img-motion \.gd-sleeve-clip img,\s*\n\.gd-img-motion \.gd-preview-art img\s*\{/.exec(css)?.[0];
  assert(law && !/scale: 1\.06;/.test(law), 'the base sway law carries no zoom');
  assert(/\[data-motion-slack='tall'\]/.test(css), 'the tall frame keeps its own geometry');
});
ok('12b — the surfaces compute + write the mark', () => {
  assert(/eff && eff\.h <= 0\.97 \? \{ 'data-motion-slack': 'crop' \}/.test(ribbonSrc), 'the compact preview marks the crop');
  assert(/Number\(character\.cardCrop\.h\) > 0 && Number\(character\.cardCrop\.h\) <= 0\.97/.test(gridSrc), 'the grid marks the stored crop');
  assert(/setAttribute\('data-motion-slack', 'tall'\)/.test(gridSrc), 'the grid measures the tall source on load');
  assert(/nw \/ nh <= cardA \* 0\.97/.test(gridSrc), 'the tall test speaks the 3% law');
});

// ===========================================================================
// 13 — THE EDIT-CARD WINDOW GROWS ITS "SLIGHTLY"
// ===========================================================================
ok('13 — the top-aligned seat rides higher and caps taller', () => {
  assert(/items-start pt-6/.test(modalSrc), 'the tall seat speaks pt-6');
  assert(/items-center pt-10/.test(modalSrc), 'the centered look keeps its air');
  assert(/topBudget = Math\.max\(240, vh - 56\);/.test(modalSrc), 'the budget gains its slightly');
});

// ===========================================================================
// 15 — THE HOVER HOLD
// ===========================================================================
ok('15 — the rows + the name hold the fold while hovered', () => {
  assert(/const rowsHoverRef = useRef\(false\);/.test(charSrc), 'the hold speaks its ref');
  assert(/if \(rowsHoverRef\.current\) return;/.test(charSrc), 'the scroll listener bows to the hold');
  assert(/onPointerEnter=\{\(\) => \{\s*\n\s*rowsHoverRef\.current = true;/.test(charSrc), 'the tray + name arm the hold');
});

// ===========================================================================
// 16 — THE COVERING OPEN
// ===========================================================================
ok('16 — the zones open as a covering overlay', () => {
  assert(/coverOpen = false,/.test(sideSrc), 'the prop rides the zone');
  assert(/coverOpen && 'is-cover-seat'/.test(sideSrc), 'the seat speaks its class');
  assert(/coverOpen \? \{ height: `\$\{retractH\}px` \} : undefined/.test(sideSrc), 'the seat pins at the retracted clamp');
  assert(/coverOpen && !collapsed && 'is-cover-open'/.test(sideSrc), 'the open zone lifts');
  assert(/\.gd-side-seat\.is-cover-seat > \.gd-collapse-zone:not\(\.gd-side-probe\)/.test(css), 'the zone becomes the overlay');
  assert(/\.is-cover-open/.test(css) && /box-shadow: 0 14px 30px/.test(css), 'the cover carries its face');
  const stampsZone = /zoneClassName="gd-stamp-strip"[\s\S]{0,700}?coverOpen/.exec(charSrc)?.[0];
  assert(stampsZone, 'the stamps zone speaks coverOpen');
  assert(/rows=\{3\}[\s\S]{0,500}?coverOpen/.test(charSrc), 'the tags zone speaks coverOpen');
});

// ===========================================================================
// 17 — THE PANEL'S OPENING LANE (documented discard)
// ===========================================================================
ok('17 — the discard is documented, the tuned lane untouched', () => {
  assert(/DISCARDED, deliberately/.test(changelogSrc), 'the decision speaks in the changelog');
  assert(/setTimeout\(\s*\(\) => \{\s*\n\s*startTransition\(\(\) => setReady\(true\)\);\s*\n\s*\}, 150\);/.test(appSrc), 'the 150ms gate keeps its seat');
  assert(/panelRetained/.test(appSrc), 'the retained seat still stands');
});

// ===========================================================================
// 18 — THE TONGUES LEARN THEIR OWN LENGTHS
// ===========================================================================
ok('18 — the loom speaks varied lengths at the same tempo', () => {
  const licks = /\.gd-nuri-licks::before[\s\S]*?96px 288px;[\s\S]*?animation-delay: calc\(var\(--gd-fin-ph, 0\) \* -33s\);/.exec(css)?.[0] || '';
  assert(licks.includes("width='96' height='288'"), 'the tile is three periods tall');
  assert(/inset: -288px 0;/.test(licks), 'the pseudo oversizes by the period');
  assert(/gd-nuri-rise-long 33s linear infinite/.test(licks), 'the rise keeps the old tempo');
  assert(/translate\(0, 288px\)/.test(css), 'the travel is exactly one period');
  const rects = (licks.match(/%3Crect /g) || []).length;
  assert(rects >= 10, `the loom carries varied tongues (${rects})`);
  assert(/TONGUES LEARN THEIR OWN LENGTHS/.test(css), 'the law is documented');
});

// ===========================================================================
// THE VERSION
// ===========================================================================
ok('the version is 1.4.7 everywhere', () => {
  assert(/"version": "1\.4\.7"/.test(pkgSrc), 'package.json');
  assert(/version: '1\.4\.7'/.test(constSrc), 'the About page');
  assert(/\*\*v1\.4\.7\*\*/.test(readmeSrc), 'README');
  assert(/v1\.4\.7/.test(websiteSrc) && /Burrito%20GenDex-1\.4\.7%20Setup\.exe/.test(websiteSrc), 'the website + its links');
  assert(/^## 1\.4\.7 — The Pearl Finds Its Levels/m.test(changelogSrc), 'the changelog');
});

console.log(`\n  ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
