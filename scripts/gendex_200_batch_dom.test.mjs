// 1.9.9 batch — The Faithful Lean.
// (Named 200 in the sequence: 190 pins the 1.8.9 laws, 191 the 1.8.10,
//  192 the 1.9.1, 193 the 1.9.2, 194 the 1.9.3, 195 the 1.9.4, 196 the
//  1.9.5, 197 the 1.9.6, 198 the 1.9.7, 199 the 1.9.8; this suite pins
//  the 1.9.9 laws at their roots. Built on the 1.9.8 tree — the release
//  line continues.)
// The reported items, pinned at their root laws:
//   A.  THE GESTURE OWNS THE WHEEL ("when moving the color picker left
//       and right sometimes it would change the color slightly as the
//       bottom bar that shows all colors vibrates left and right and
//       starts shifting, aka instead of being on green it shifts to
//       yellow even if im changing the saturation etc"): the panel keeps
//       an hsvRef MIRROR beside its state (no emission ever rides inside
//       a state updater), and a gesture FENCE — while a pointer holds
//       either field the re-sync effect stays silent, so the governor's
//       stale echo can never re-seed the panel mid-drag; the re-sync
//       compares NORMALIZED hexes so a dressed echo never re-seeds at
//       all. The hue rail cannot vibrate and the hue cannot drift.
//   B.  THE FAITHFUL LEAN ("when i have the card color a very light
//       value it makes the finish effects bright as it is ... when the
//       card is light orange the finish effects should be orange etc..
//       like before, the color influinces the hue is all and not
//       brightness or shit ... i want it to only be affected by the hue
//       and saturation, not by brightness"): finishTintLean carries the
//       card's hue and HSL saturation whole at FIXED luma seats (base
//       0.45 over the plate, glow 0.78 for the dark ground's screen
//       family, art 0.75 over the picture) — the card's brightness never
//       enters the derivation anywhere, the plate-solved twin rail
//       retired with it.
//   C.  THE SWEEP ACCOUNTS FOR ALL VALUES ("the finish background etc
//       vanishes in some finishes such as foil in #bbbbbb and #e7c35b,
//       please account for all and test possible values to see if they
//       break for fucks sake"): the corner audit's plate field grew to
//       78 seats (the gray ladder, the named patients, the light-card
//       ladder, the pastel band, the low-saturation chromatics, the
//       12-hue ladders at both brightness extremes) and mirrors the
//       lean + its glow; the art-eye audit pins the brightness-blind
//       law (same hue + saturation at three lightness seats must speak
//       the same veil over the same picture).
//   D.  THE FURNITURE — the version seats speak 1.9.9, the changelog
//       head tells this story, the README badge + battery count welcome
//       this very suite, and the battery runner runs it.
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
const block = (css, selector) => {
  const re = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' \\{[\\s\\S]*?\\n\\}');
  const m = re.exec(css);
  return m ? m[0] : '';
};

const css = src('src/index.css');
const ribbon = src('src/components/TagRibbon.jsx');
const picker = src('src/components/ColorPicker.jsx');
const grid = src('src/components/GridView.jsx');
const look = src('src/components/CardLookEditor.jsx');
const pkg = src('package.json');
const readme = src('README.md');
const changelog = src('CHANGELOG.md');
const runner = src('scripts/run_battery_171.sh');
const cornerAudit = src('scripts/pixel_corner_law_197.mjs');
const artEye = src('scripts/pixel_art_eye_198.mjs');

console.log('A. THE GESTURE OWNS THE WHEEL ("the bottom bar vibrates left and right and starts shifting")');

ok('A1 — the mirror rides beside the state (no emission inside an updater)', () => {
  assertMatch(picker, /const hsvRef = useRef\(null\);/, 'the hsv mirror never spoke');
  assertMatch(picker, /if \(hsvRef\.current == null\) hsvRef\.current = seedHsv\(incoming\);/, 'the mirror never seeded');
  assertMatch(picker, /const applyHsv = useCallback\(\(next\) => \{[\s\S]*?hsvRef\.current = next;/, 'the apply voice never wrote the mirror');
  // the field handlers read the MIRROR, and the emission rides OUTSIDE
  // the state write — the old setHsv(prev => { ...emit... }) antipattern
  // (React may re-run updaters; the gesture's word must land exactly once)
  const sv = /const svField = useFieldDrag\(\(x, y\) => \{[\s\S]*?\n  \}\);/.exec(picker)?.[0] || '';
  assertMatch(sv, /\.\.\.hsvRef\.current,/, 'the SV handler never read the mirror');
  assertMatch(sv, /applyHsv\(next\);\s*\n\s*emitGoverned\(hsvToHex\(next\.h, next\.s, next\.v\)\);/, 'the SV emission never rode outside the write');
  assert.ok(!/setHsv\(\(prev\) => \{[\s\S]*?emitGoverned/.test(picker), 'an emission survived inside a state updater');
});

ok('A2 — the fence holds while a pointer owns either field', () => {
  assertMatch(picker, /const gestureRef = useRef\(false\);/, 'the gesture fence never spoke');
  assertMatch(picker, /const fenced = \(handlers\) => \(\{[\s\S]*?onPointerDown: \(e\) => \{[\s\S]*?gestureRef\.current = true;/, 'the fence never armed on pointerdown');
  assertMatch(picker, /onPointerUp: \(e\) => \{[\s\S]*?gestureRef\.current = false;/, 'the fence never retired on pointerup');
  assertMatch(picker, /onLostPointerCapture: \(\) => \{[\s\S]*?gestureRef\.current = false;/, 'the lost-capture safety never spoke');
  // both fields ride the fence before the flush wrapper
  assertMatch(picker, /const svFieldFlushed = flushed\(fenced\(svField\)\);/, 'the SV field never rode the fence');
  assertMatch(picker, /const hueRailFlushed = flushed\(fenced\(hueRail\)\);/, 'the hue rail never rode the fence');
});

ok('A3 — the re-sync stays silent through the gesture and compares the normalized dress', () => {
  const resync = /useEffect\(\(\) => \{[\s\S]*?gestureRef\.current[\s\S]*?\n  \}, \[incoming\]\);/.exec(picker)?.[0] || '';
  assert.ok(resync, 'the re-sync effect itself never spoke');
  assertMatch(resync, /if \(gestureRef\.current\) return;/, 'the re-sync never yielded to the gesture');
  assertMatch(resync, /const mine = normalizeHexInput\(lastEmitted\.current\) \|\| lastEmitted\.current;/, 'the re-sync never normalized the echo');
  // and the mirror follows a genuine re-seed
  assertMatch(resync, /hsvRef\.current = seeded;/, 'a genuine re-seed never wrote the mirror');
});

console.log('\nB. THE FAITHFUL LEAN ("only the hue and saturation, not the brightness")');

ok('B1 — finishTintLean speaks the law (evaluated live: the seats, the blindness)', () => {
  const fnSrc = /export function finishTintLean[\s\S]*?\n\}/.exec(ribbon)?.[0] || '';
  assert.ok(fnSrc, 'finishTintLean never left TagRibbon');
  const lean = new Function('return ' + fnSrc.replace('export function', 'function'))();
  const lumOf = (h) => {
    const n = parseInt(h.slice(1), 16);
    return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  };
  const hueOf = (h) => {
    const n = parseInt(h.slice(1), 16);
    const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const d = mx - mn;
    if (d === 0) return 0;
    let hh = 0;
    if (mx === r) hh = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (mx === g) hh = ((b - r) / d + 2) / 6;
    else hh = ((r - g) / d + 4) / 6;
    return hh * 360;
  };
  // the named patients: the light orange speaks ORANGE (hue kept whole,
  // saturation whole, the seat's own contrast); the gold and the gray
  // lean visible colors at the fixed seat
  const orange = lean('#ffcf9e');
  assert.ok(Math.abs(hueOf(orange) - 30) < 4, `the light orange lost its hue (spoke ${hueOf(orange).toFixed(1)})`);
  assert.ok(Math.abs(lumOf(orange) - 0.45) < 0.02, `the light orange lean left its seat (${lumOf(orange).toFixed(3)})`);
  const gold = lean('#e7c35b');
  assert.ok(Math.abs(hueOf(gold) - 43) < 4, `the gold patient lost its hue (spoke ${hueOf(gold).toFixed(1)})`);
  assert.ok(Math.abs(lumOf(gold) - 0.45) < 0.02, `the gold lean left its seat (${lumOf(gold).toFixed(3)})`);
  assert.equal(lean('#bbbbbb'), '#737373', 'the gray patient lost its honest gray');
  // the yellow cure lands BY LAW (the 1.9.7 patch's own seat, derived)
  const sunburst = lean('#ffd400');
  assert.ok(Math.abs(lumOf(sunburst) - 0.45) < 0.02, `the sunburst lean left its seat (${lumOf(sunburst).toFixed(3)})`);
  assert.ok(lumOf(sunburst) < 0.6, 'the yellow cure regressed to a pale ink');
  // the seats: the glow (0.78) and the art (0.75) variants speak their
  // own registers, same hue, same saturation
  for (const [seat, want] of [[0.78, 0.78], [0.75, 0.75]]) {
    const v = lean('#ffcf9e', seat);
    assert.ok(Math.abs(lumOf(v) - want) < 0.02, `the ${seat} seat spoke ${lumOf(v).toFixed(3)}`);
    assert.ok(Math.abs(hueOf(v) - 30) < 4, `the ${seat} seat lost the hue`);
  }
  // BRIGHTNESS-BLIND, evaluated live: the same hue + saturation at three
  // lightness seats speaks ONE lean (within a hex-unit of quantization) —
  // the families are BUILT at fixed hue+sat so the law is exact
  const hsl = (hdeg, s, l) => {
    const h = hdeg / 360;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue = (t) => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };
    const ch = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
    return `#${ch(hue(h + 1 / 3))}${ch(hue(h))}${ch(hue(h - 1 / 3))}`;
  };
  for (const [h, s] of [[30, 1], [240, 1], [43, 0.75], [187, 0.53]]) {
    const fam = [0.75, 0.5, 0.25].map((l) => hsl(h, s, l));
    const leans = fam.map((c) => lean(c).slice(1).match(/../g).map((x) => parseInt(x, 16)));
    for (let i = 1; i < leans.length; i += 1) {
      const drift = leans[0].map((v, k) => Math.abs(v - leans[i][k])).reduce((a, b) => a + b, 0);
      assert.ok(drift <= 6, `the family h${h} s${s} drifted ${drift} units — brightness leaked in`);
    }
  }
  // the honest edges
  assert.equal(lean('#ffffff'), '#737373', 'white lost its honest gray');
  assert.equal(lean('#000000'), '#737373', 'black lost its honest gray');
  assert.equal(lean(null), '', 'a colorless card spoke a color');
  assert.equal(lean('var(--gd-panel)'), '', 'a theme var spoke a color');
});

ok('B2 — the derivation never reads the plate (the twin rail retired whole)', () => {
  const fnSrc = /export function finishTintLean[\s\S]*?\n\}/.exec(ribbon)?.[0] || '';
  // the twin's plate-solved rail (the brightness-dependence the report
  // retired) is GONE from the derivation — no lum measure, no 0.70 seam,
  // no 0.35+0.3 compression, nothing that knows how bright the card is
  assert.ok(!/const lum = 0\.2126/.test(fnSrc), 'the lean still measured the plate');
  assert.ok(!/lum >= 0\.7/.test(fnSrc), 'a ground seam leaked into the lean');
  assert.ok(!/0\.35 \+ 0\.3/.test(fnSrc), 'the twin compression survived in the lean');
  assert.ok(!/lum \+ 0\.16/.test(fnSrc), 'the lift twin survived in the lean');
  assertMatch(fnSrc, /const LEAN_LUMA = Number\.isFinite\(\+seat\)/, 'the fixed seat never spoke its param');
  assertMatch(fnSrc, /for \(let i = 0; i < 24; i \+= 1\) \{/, 'the bisection lost its steps');
  assert.ok(!/finishInkTwin/.test(ribbon), 'the twin survived its retirement');
});

ok('B3 — every card surface writes the lean and its seats', () => {
  for (const surface of [grid, look, ribbon]) {
    assertMatch(surface, /\['--gd-fin-ink'\]: finishTintLean\(/, 'a surface lost the lean write');
    assertMatch(surface, /\['--gd-fin-glow'\]: finishTintLean\((?:character\.)?cardColor, 0\.78\)/, 'a surface lost the glow seat');
    assertMatch(surface, /\['--gd-fin-art'\]: finishTintLean\((?:character\.)?cardColor, 0\.75\)/, 'a surface lost the art seat');
  }
});

ok('B4 — the hand speaks the lean at its seats (base, dark glow, art)', () => {
  const seat = block(css, '.gd-card-face-finish');
  assertMatch(seat, /--gd-tint-hand: var\(--gd-fin-ink, var\(--gd-card-tint, var\(--gd-panel\)\)\);/, 'the base hand never spoke the lean');
  // the universal 1.9.7 override retired into the base — no duplicate law
  assert.ok(!/\.gd-card-face-finish,\s*\n\.gd-card-face-artfin \{\s*\n  --gd-tint-hand: var\(--gd-fin-ink/.test(css), 'the retired universal hand survived as a duplicate');
  // the dark ground's screen family reads the GLOW seat
  assertMatch(css, /\.gd-fin-ground-dark \.gd-card-face-finish:not\(\.is-art-zone\),\s*\n\.gd-fin-ground-dark \.gd-card-face-artfin:not\(\.is-art-zone\) \{\s*\n  --gd-tint-hand: var\(--gd-fin-glow, var\(--gd-fin-ink, var\(--gd-card-tint, var\(--gd-panel\)\)\)\);\s*\n\}/, 'the dark glow hand never spoke');
  // the art zone reads the ART seat (the raw-tint override retired)
  assertMatch(css, /\.gd-card-face-finish\.is-art-zone,\s*\n\.gd-card-face-artfin\.is-art-zone \{\s*\n  --gd-tint-hand: var\(--gd-fin-art, var\(--gd-fin-ink, var\(--gd-card-tint, var\(--gd-panel\)\)\)\);\s*\n\}/, 'the art seat hand never spoke');
  assert.ok(!/--gd-tint-hand: var\(--gd-card-tint, var\(--gd-panel\)\);\s*\n\}\s*\n\/\* 1\.9\.6 — THE ART TWIN/.test(css), 'a raw-tint art override survived');
});

ok('B5 — the artfins speak their classic anchors (the picture-wash law returns)', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the picture-washes are their
     classic 1.9.2 anchors again, verbatim — the hand-lean retired with
     the derivation (nuri's fire band keeps its RAW tint mix, the 1.5.0
     forge law the owner called stable). */
  assertMatch(block(css, '.gd-artfin-numeix'), /rgba\(238, 226, 186, 0\.56\) 0%/, 'the artfin-numeix lost its classic band');
  assertMatch(block(css, '.gd-artfin-auric'), /rgba\(255, 224, 140, 0\.36\) 0%/, 'the artfin-auric lost its classic honey');
  assertMatch(block(css, '.gd-artfin-nuri'), /rgba\(255, 196, 120, 0\.48\) 0%/, 'the artfin-nuri lost its classic fire');
  for (const fin of ['numeix', 'auric']) {
    const art = block(css, `.gd-artfin-${fin}`);
    assert.ok(!art.includes('var(--gd-tint-hand'), `the artfin-${fin} kept a hand read`);
  }
  assertMatch(block(css, '.gd-artfin-nuri'), /color-mix\(in srgb, var\(--gd-card-tint, var\(--gd-panel\)\) 58%, transparent\)/, 'the artfin-nuri lost its RAW tint band');
});

ok('B6 — the thin screen lifts retired with the stack', () => {
  /* 1.9.10 — THE CLASSIC COAT RETURNS: the 1.6 hand (the scoped
     opacity lifts the channel-pegged band gained) retired with the
     flip stack — the dapple, the currents and the honey body speak
     their classic voices on every plate. */
  const cssLaws = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!cssLaws.includes('opacity: min(1, calc(var(--gd-fin-strength, 1) * 1.6))'), 'the 1.6 lift survived somewhere');
  assert.ok(!/gd-fin-ground(?:-light|-dark)? \.gd-numeix-dapple/.test(cssLaws), 'the dapple lift selector survived');
});

console.log('\nC. THE SWEEP ACCOUNTS FOR ALL VALUES ("test possible values to see if they break")');

ok('C1 — the corner audit sweeps the whole wheel (78 plates, the lean mirrored)', () => {
  // the lean mirror + the glow mirror
  assertMatch(cornerAudit, /const target = Number\.isFinite\(\+seat\) \? \+seat : 0\.45;/, 'the audit mirror lost the lean seat');
  assertMatch(cornerAudit, /--gd-fin-glow:\$\{twin\(tint, 0\.78\)\}/, 'the audit never mirrored the glow');
  assertMatch(cornerAudit, /--gd-fin-art:\$\{twin\(tint, 0\.75\)\}/, 'the audit never mirrored the art seat');
  // the named patients
  assertMatch(cornerAudit, /\['gbb', '#bbbbbb'\]/, 'the gray patient never joined the sweep');
  assertMatch(cornerAudit, /\['e7c35b', '#e7c35b'\]/, 'the gold patient never joined the sweep');
  // the systematic ladders
  assertMatch(cornerAudit, /THE GRAY LADDER/, 'the gray ladder never spoke');
  assertMatch(cornerAudit, /THE LIGHT-CARD LADDER/, 'the light-card ladder never spoke');
  assertMatch(cornerAudit, /HUE_NAMES\.map\(\(n, i\) => \[`light\$\{n\}`, hsl\(i \* 30 \/ 360, 1, 0\.75\)\]\)/, 'the light hue ladder never spoke');
  assertMatch(cornerAudit, /HUE_NAMES\.map\(\(n, i\) => \[`dark\$\{n\}`, hsl\(i \* 30 \/ 360, 1, 0\.25\)\]\)/, 'the dark hue ladder never spoke');
  // the pastel band + the low-saturation chromatics
  assertMatch(cornerAudit, /THE PASTEL BAND/, 'the pastel band never joined');
  assertMatch(cornerAudit, /LOW-SATURATION CHROMATICS/, 'the low-sat chromatics never joined');
});

ok('C2 — the art-eye audit pins the brightness-blind law', () => {
  assertMatch(artEye, /THE ART VOICE IS BRIGHTNESS-BLIND/, 'the brightness-blind law never spoke');
  assertMatch(artEye, /bblind-a1/, 'the warm brightness-blind family never joined');
  assertMatch(artEye, /bblind-b3/, 'the cool brightness-blind family never joined');
  assertMatch(artEye, /--gd-fin-art:\$\{twin\(tint, 0\.75\)\}/, 'the art-eye never mirrored the art seat');
  // the auric floor's recalibration + its teeth
  assertMatch(artEye, /const speaksFloor = finish === 'auric' \? 0\.05 : 0\.25;/, 'the soft-light floor never spoke its physics');
  assertMatch(artEye, /auric's art voice speaks on neutral plates/, 'the recalibrated floor lost its teeth');
});

console.log('\nD. THE FURNITURE');

ok('D1 — the version is 1.9.9 everywhere', () => {
  assertMatch(pkg, /"version": "1\.9\.19"/, 'pkg never spoke 1.9.9');
  assertMatch(src('src/constants/index.js'), /version: '1\.9\.19',/, 'constants never spoke 1.9.9');
});

ok('D2 — the changelog head tells this story', () => {
  assertMatch(changelog, /^## 1\.9\.19 — The Ends Trade Places/, 'the changelog head is not the lean');
  assertMatch(changelog, /The gesture owns the wheel/, 'the changelog never named the wheel law');
  assertMatch(changelog, /The faithful lean/, 'the changelog never named the lean law');
});

ok('D3 — the README badge + battery count welcome this very suite', () => {
  assertMatch(readme, /version-1\.9\.19-purple/, 'the README badge never spoke 1.9.9');
  assertMatch(readme, /93 DOM\/source test suites/, 'the README count never welcomed the suite');
});

ok('D4 — the battery runner welcomes this very suite', () => {
  assertMatch(runner, /gendex_200_batch_dom/, 'the battery runner never welcomed this suite');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
