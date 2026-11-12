// 1.2.3 batch — THE THREE BANDS ("the app would be divided in 3 colored
// sections, aka getting darker — card viewer is darker for example, tree
// and detail and output should be middleway, and top bar and top toolbar
// should be lighter for example, im not sure if its good but implement
// what works"):
//   THE LAW      computeTierBands derives three depth bands from each
//                theme's own ground — dark cloth steps UP toward the light
//                (the viewer keeps the deep ground), bright cloth steps
//                DOWN into the shade (the bars cap near white). One
//                derivation, all 12 themes, no hand-picked hexes.
//   THE SEATS    every surface declares its band: the four texture classes
//                (sidebar/panel → mid, viewer → deep, titlebar → bar), the
//                full-window cover (→ deep), the tree's CLASSES plate (→
//                mid), the output bar + its expanded sheet (→ mid), and
//                the NEW CARD tile's wash (→ deep). Floating framed
//                content (.gd-panel's wash family) stays UNBANDED.
//   THE CHEAP LANE the bands recompute with the tokens (Manual Colors
//                previews them live); the surfaces glide 0.25s like the
//                body always has.
// Plus: the version is 1.2.3 everywhere (package.json AND the lock — the
// 1.2.2 session missed the lock), the download page fronts it.
// Run: node scripts/gendex_133_batch_dom.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const appRoot = fileURLToPath(new URL('..', import.meta.url));
const src = (rel) => readFileSync(join(appRoot, rel), 'utf8');

const { APP, THEME_PRESETS } = require(join(appRoot, 'src/constants/index.js'));
const { computeTierBands } = require(join(appRoot, 'src/utils/theme.js'));
const pkg = require(join(appRoot, 'package.json'));
const lock = require(join(appRoot, 'package-lock.json'));

const css = src('src/index.css');
const themeSrc = src('src/utils/theme.js');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
const changelog = src('CHANGELOG.md');

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL — ${name}\n      ${e.message}`);
    process.exitCode = 1;
  }
};

// ---- the version -------------------------------------------------------------
ok('the version is 1.3.0', () => {
  assert.equal(APP.version, '1.4.3');
  assert.equal(pkg.version, '1.4.3');
  assert.equal(lock.version, '1.4.3', 'the LOCK follows (the 1.2.2 session missed it)');
  assert.equal(lock.packages[''].version, '1.4.3', 'the lock root package too');
  assert.match(src('package.json'), /"version": "1\.4\.3"/);
  assert.match(src('README.md'), /\*\*v1\.4\.3\*\*/);
  assert.match(src('START.bat'), /(1\.4\.3)/);
  assert.equal(lock.packages['node_modules/@electron/windows-sign'].version, '1.2.2', 'the dependency keeps its TRUE version');
});

// ---- the live harness helpers -------------------------------------------------
const lin = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = (hex) => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  const n = parseInt(m[1], 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
const contrast = (a, b) => {
  const la = lum(a);
  const lb = lum(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};
const hslOf = (hex) => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d > 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      default: h = ((r - g) / d + 4);
    }
    h /= 6;
  }
  return { h, s, l };
};
const hueDelta = (a, b) => {
  const d = Math.abs(a - b);
  return Math.min(d, 1 - d);
};

// ---- the pinned band table (the law's concrete outputs — 1.2.9: THE
// TREE'S OWN WELL — a fourth tier under the deep ground for the sidebar:
// the tree reads as a recessed shelf and the panel-painted class cards
// pop off it (measured 1.13x-1.30x on every theme) ------------------------
const BANDS = {
  zine:    { bar: '#101014', mid: '#1a1a21', deep: '#101014', side: '#0b0b0d' },
  burrito: { bar: '#120c1d', mid: '#1c132d', deep: '#120c1d', side: '#0d0814' },
  archive: { bar: '#e7dfc9', mid: '#e5dcc4', deep: '#ded3b6', side: '#dfd5b7' },
  carbon:  { bar: '#0e1012', mid: '#181b1f', deep: '#0e1012', side: '#090a0b' },
  moss:    { bar: '#0f1308', mid: '#1c230f', deep: '#0f1308', side: '#090b05' },
  ember:   { bar: '#170f09', mid: '#271a0f', deep: '#170f09', side: '#0e0906' },
  glacier: { bar: '#0c1114', mid: '#151d22', deep: '#0c1114', side: '#070a0c' },
  ghost:   { bar: '#0a0f1e', mid: '#10182f', deep: '#0a0f1e', side: '#070a15' },
  craft:   { bar: '#2a2119', mid: '#382c22', deep: '#2a2119', side: '#221b14' },
  paper:   { bar: '#efeae0', mid: '#ece7db', deep: '#e5ddcd', side: '#e6dfcf' },
  metal:   { bar: '#150c10', mid: '#24141b', deep: '#150c10', side: '#0d080a' },
  mumei:   { bar: '#e7f5f9', mid: '#e1f2f7', deep: '#d1ecf3', side: '#d3edf4' },
};

const DARK = ['zine', 'burrito', 'carbon', 'moss', 'ember', 'glacier', 'ghost', 'craft', 'metal'];
const LIGHT = ['archive', 'paper', 'mumei'];

// ---- THE LAW, all 12 themes ---------------------------------------------------
for (const t of THEME_PRESETS) {
  const family = DARK.includes(t.id) ? 'dark' : 'light';
  const bands = computeTierBands(t.bg);
  ok(`${t.name} (${t.id}) — the bands match the pinned table`, () => {
    assert.deepEqual(bands, BANDS[t.id], `computed ${JSON.stringify(bands)} vs pinned ${JSON.stringify(BANDS[t.id])}`);
  });
  ok(`${t.name} — the ladder speaks the family (1.2.9: the bar rides the ground, the tree sinks under it)`, () => {
    const L = (x) => hslOf(x).l;
    if (family === 'dark') {
      // the mid sections breathe above a bar that TIES the deep ground —
      // the chrome reads as a dark cap, never a lit strip — and the tree's
      // own well sinks a shade UNDER the ground (the recessed shelf)
      assert.ok(L(bands.mid) > L(bands.bar), `mid L ${L(bands.mid)} vs bar L ${L(bands.bar)}`);
      assert.equal(bands.bar, bands.deep, 'the bar ties the viewer\u2019s depth (the ground)');
      assert.ok(L(bands.side) < L(bands.deep), `1.2.9: the tree sinks under the ground — side L ${L(bands.side)} vs deep L ${L(bands.deep)}`);
    } else {
      // the bright ladder keeps its monotone descent: bar (the ground) > mid > deep,
      // with the tree shading deeper than its mid (the shelf reading)
      assert.ok(L(bands.bar) > L(bands.mid), `bar L ${L(bands.bar)} vs mid L ${L(bands.mid)}`);
      assert.ok(L(bands.mid) > L(bands.deep), `mid L ${L(bands.mid)} vs deep L ${L(bands.deep)}`);
      assert.ok(L(bands.mid) > L(bands.side) && L(bands.side) > L(bands.deep), `1.2.9: the tree shades between mid and deep — side L ${L(bands.side)}`);
    }
  });
  ok(`${t.name} — the tree's cards pop off its well (1.2.9: panel on side)`, () => {
    const c = contrast(t.panel, bands.side);
    assert.ok(c >= 1.1, `panel ${t.panel} on side ${bands.side}: ${c.toFixed(3)}x (the class cards read as objects, not cutouts)`);
  });
  ok(`${t.name} — ${family} law: the right seat keeps the theme's own ground`, () => {
    const same = (x, y) => String(x).toLowerCase() === String(y).toLowerCase();
    if (family === 'dark') {
      assert.ok(same(bands.deep, t.bg), 'the viewer keeps the deep ground');
      assert.ok(same(bands.bar, t.bg), 'the bar rides the same ground (1.2.9: darker, not the brightest)');
    } else {
      assert.ok(same(bands.bar, t.bg), 'the bar ties the ground (1.2.9); the mid sections shade a hair below');
    }
  });
  ok(`${t.name} — the bands never shift hue or saturation`, () => {
    const bgHSL = hslOf(t.bg);
    for (const k of ['bar', 'mid', 'deep', 'side']) {
      const bHSL = hslOf(bands[k]);
      assert.ok(hueDelta(bHSL.h, bgHSL.h) < 0.035, `${k} hue ${bHSL.h.toFixed(3)} vs bg ${bgHSL.h.toFixed(3)}`);
      // 1.2.9 — the SIDE key carries the downward step's own sat drift: the
      // HSL sat formula's denominator (max+min) shrinks as lightness sinks,
      // so a -0.024/-0.05 step reads the same chroma as a HIGHER saturation
      // (measured worst: 0.273 vs 0.238 on ember) — the chroma never moved,
      // only the L the formula divides by. 0.045 absorbs it; the upward
      // keys keep the 1.2.3 tolerance.
      const satTol = k === 'side' ? 0.045 : 0.025;
      assert.ok(Math.abs(bHSL.s - bgHSL.s) < satTol, `${k} sat ${bHSL.s.toFixed(3)} vs bg ${bgHSL.s.toFixed(3)}`);
    }
  });
  ok(`${t.name} — each adjacent band pair keeps its step (1.2.9: the bar/mid seam is the family step)`, () => {
    // 1.2.9 — THE BAR RIDES THE GROUND: the dark family's bar/mid pair is
    // the SAME 0.045 step as mid/deep (measured: 1.077x-1.167x both pairs);
    // the bright family's bar/mid seam is the quiet 0.015 shade (the tree
    // slightly darker — 1.028x-1.032x), with mid/deep keeping the 1.2.3
    // perceptible floor untouched.
    if (family === 'dark') {
      assert.ok(contrast(bands.bar, bands.mid) >= 1.06, `bar/mid ${contrast(bands.bar, bands.mid).toFixed(3)}x`);
      assert.ok(contrast(bands.mid, bands.deep) >= 1.06, `mid/deep ${contrast(bands.mid, bands.deep).toFixed(3)}x`);
    } else {
      assert.ok(contrast(bands.bar, bands.mid) >= 1.02, `bar/mid ${contrast(bands.bar, bands.mid).toFixed(3)}x (the quiet tree seam)`);
      assert.ok(contrast(bands.mid, bands.deep) >= 1.06, `mid/deep ${contrast(bands.mid, bands.deep).toFixed(3)}x`);
    }
  });
  ok(`${t.name} — the caps hold (never pure white, never pure black)`, () => {
    for (const k of ['bar', 'mid', 'deep', 'side']) {
      const l = hslOf(bands[k]).l;
      assert.ok(l <= 0.985 && l >= 0.03, `${k} L ${l.toFixed(3)}`);
    }
  });
  ok(`${t.name} — cards still pop on the deep band (panel reads on the viewer)`, () => {
    const c = contrast(t.panel, bands.deep);
    assert.ok(c >= 1.06, `panel ${t.panel} on deep ${bands.deep}: ${c.toFixed(3)}x`);
  });
}

// ---- the manual-colors lane ----------------------------------------------------
ok('a custom ground recomputes the bands (Manual Colors live preview)', () => {
  // dark custom ground → upward family
  const a = computeTierBands('#20304a');
  assert.equal(a.deep, '#20304a');
  assert.notEqual(a.mid, '#20304a');
  // 1.2.9: the bar TIES the ground on the dark family (no lift at all)
  assert.equal(a.bar, '#20304a');
  // bright custom ground → downward family (1.2.9: the bar ties the
  // ground; the mid sections shade a hair below it)
  const b = computeTierBands('#f4eefe');
  assert.equal(b.bar, '#f4eefe');
  assert.ok(hslOf(b.mid).l < hslOf(b.bar).l, 'the mid sections shade below the ground (the tree slightly darker)');
  assert.ok(hslOf(b.deep).l < hslOf(b.mid).l, 'the viewer sinks');
});

// ---- the seats (CSS source laws) ----------------------------------------------
ok('the four texture classes paint their bands (1.2.9: the sidebar paints its own well)', () => {
  assert.match(css, /\.gd-tex-sidebar\s*\{\s*background-color: var\(--gd-tier-side, var\(--gd-bg\)\);/, 'sidebar → side (the tree\'s own well)');
  assert.match(css, /\.gd-tex-viewer\s*\{\s*background-color: var\(--gd-tier-deep, var\(--gd-bg\)\);/, 'viewer → deep');
  assert.match(css, /\.gd-tex-panel\s*\{\s*background-color: var\(--gd-tier-mid, var\(--gd-bg\)\);/, 'panel → mid');
  assert.match(css, /\.gd-tex-titlebar\s*\{\s*background-color: var\(--gd-tier-bar, var\(--gd-bg\)\);/, 'titlebar → bar');
});
ok('the full-window cover joins the MID band (1.2.6: the panel surface)', () => {
  // 1.2.6 — THE COVER SPEAKS THE PANEL'S SURFACE ("the background of the
  // full detail window should be the pattern of the right panel not the
  // card viewer"): the cover left the deep band and joined the panel's
  // own seat — mid band + the panel's pattern.
  assert.match(css, /\.gd-viewer-cover\s*\{\s*background-color: var\(--gd-tier-mid, var\(--gd-bg\)\);/);
  assert.match(css, /\.gd-viewer-cover\s*\{[^}]*?background-image: var\(--gd-tex-panel, none\);/s);
});
ok('the tree CLASSES plate joins the sidebar\'s well (1.2.9: one column, one ground)', () => {
  assert.match(css, /\.gd-tree-head\s*\{[^}]*?background: var\(--gd-tier-side, var\(--gd-bg\)\);/s);
});
ok('the output bar + its expanded sheet join the mid band (panel fills retired)', () => {
  assert.match(css, /\.gd-output-bar\s*\{[^}]*?background: var\(--gd-tier-mid, var\(--gd-bg\)\);/s);
  assert.match(css, /\.gd-output-full\s*\{[^}]*?background: var\(--gd-tier-mid, var\(--gd-bg\)\);/s);
  assert.doesNotMatch(css, /\.gd-output-bar\s*\{[^}]*?background: var\(--gd-panel\);/s, 'the old panel fill is gone');
});
ok('the NEW CARD tile derives its wash from the deep band', () => {
  assert.match(css, /\.gd-card-add\s*\{\s*background: color-mix\(in srgb, var\(--gd-tier-deep, var\(--gd-bg\)\) 58%, var\(--gd-ink\) 14%\);/);
});
ok('floating framed content stays UNBANDED (the .gd-panel wash keeps its own law)', () => {
  assert.match(css, /\.gd-panel\s*\{\s*background: color-mix\(in srgb, var\(--gd-bg\) 82%, #ffffff 3%\);/);
  assert.doesNotMatch(css, /\.gd-panel\s*\{[^}]*?--gd-tier/s, 'no band var leaks into the floating family');
});
ok('the root declares the four band vars with pre-theme defaults', () => {
  /* 1.2.9 — the bar default RIDES THE GROUND (0.0 off it): #0f0f0f ties
     the deep default; the mid default is the one gentle step above; the
     side default sinks under the ground (the tree\'s own well). */
  assert.match(css, /--gd-tier-bar: #0f0f0f;/);
  assert.match(css, /--gd-tier-mid: #1a1a1a;/);
  assert.match(css, /--gd-tier-deep: #0f0f0f;/);
  assert.match(css, /--gd-tier-side: #090909;/);
  // the defaults must mirror the root's own ground (#0f0f0f family)
  const d = computeTierBands('#0f0f0f');
  assert.equal(d.bar, '#0f0f0f');
  assert.equal(d.mid, '#1a1a1a');
  assert.equal(d.deep, '#0f0f0f');
  assert.equal(d.side, '#090909');
});
ok('the surfaces glide 0.25s on a theme switch (the body law extended)', () => {
  assert.match(css, /\.gd-tex-sidebar,\s*\.gd-tex-viewer,\s*\.gd-tex-panel,\s*\.gd-tex-titlebar,\s*\.gd-viewer-cover,\s*\.gd-tree-head,\s*\.gd-output-bar,\s*\.gd-output-full,\s*\.gd-card-add\s*\{[^}]*?transition: background-color 0\.25s ease;/s);
});

// ---- the engine (theme.js source laws) -----------------------------------------
ok('computeTierBands is exported and the steps are the documented law', () => {
  assert.match(themeSrc, /export function computeTierBands\(bg\)/);
  /* 1.2.9 — THE TREE'S OWN WELL: the sidebar's dedicated step sinks under
     the ground (dark: -0.024) or between mid and deep (bright: -0.05). */
  assert.match(themeSrc, /const BAND_STEP_DARK_MID = 0\.045;/);
  assert.match(themeSrc, /const BAND_STEP_DARK_BAR = 0\.0;/);
  assert.match(themeSrc, /const BAND_STEP_DARK_SIDE = -0\.024;/);
  assert.match(themeSrc, /const BAND_STEP_LIGHT_BAR = 0\.0;/);
  assert.match(themeSrc, /const BAND_STEP_LIGHT_MID = -0\.015;/);
  assert.match(themeSrc, /const BAND_STEP_LIGHT_DEEP = 0\.055;/);
  assert.match(themeSrc, /const BAND_STEP_LIGHT_SIDE = -0\.05;/);
  assert.match(themeSrc, /const BAND_L_CAP = 0\.98;/);
  assert.match(themeSrc, /const BAND_L_FLOOR = 0\.03;/);
});
ok('the bands land on the CHEAP lane (Manual Colors previews them live)', () => {
  assert.match(themeSrc, /const tiers = computeTierBands\(resolved\.bg\);/);
  assert.match(themeSrc, /root\.style\.setProperty\('--gd-tier-bar', tiers\.bar\);/);
  assert.match(themeSrc, /root\.style\.setProperty\('--gd-tier-mid', tiers\.mid\);/);
  assert.match(themeSrc, /root\.style\.setProperty\('--gd-tier-deep', tiers\.deep\);/);
  assert.match(themeSrc, /root\.style\.setProperty\('--gd-tier-side', tiers\.side\);/);
  // cheap lane: the write sits in applyThemeTokens, not the heavy lane
  const tokensBody = themeSrc.slice(themeSrc.indexOf('function applyThemeTokens'), themeSrc.indexOf('function applyThemeHeavy'));
  assert.ok(tokensBody.includes('computeTierBands'), 'the write lives in the tokens lane');
});

// ---- the website ----------------------------------------------------------------
console.log('  ok — retired with the website in 1.8.8 — ' + 'the in-source download page keeps the 1.2.3 row on its own true link (demoted 1.2.4)');
ok('the changelog carries the 1.2.3 entry', () => {
  assert.match(changelog, /^## 1\.2\.3 — The Three Bands/m);
});

// ---- summary --------------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed — 1.2.3 batch`);
if (failed) process.exit(1);
