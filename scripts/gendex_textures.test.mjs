// TEXTURE ENGINE TEST (0.13.0) — per-surface background patterns.
// Pure logic — no React, no jsdom (applyTextureVars is exercised through a
// stub root). Run: node scripts/gendex_textures.test.mjs
import assert from 'node:assert/strict';
import { buildTexture, applyTextureVars, SESSION_SEED } from '../src/utils/textures.js';
import { TEXTURES, TEX_SURFACES } from '../src/constants/index.js';

let passed = 0;
const ok = (name, fn) => {
  fn();
  passed += 1;
  console.log(`  ok ${passed} — ${name}`);
};

const COLORS = { chrome: '#f2f2f0', bg: '#101014', panel: '#1a1a1f', accent: '#ffd400', texTint: null, texAlpha: null };

ok('session seed is a sane positive integer (re-rolls every launch)', () => {
  assert.ok(Number.isInteger(SESSION_SEED) && SESSION_SEED > 0 && SESSION_SEED <= 0x7fffffff);
});

ok('every shipped pattern id compiles to a background layer', () => {
  for (const { id } of TEXTURES) {
    const p = buildTexture(id, COLORS, 'workspace');
    assert.ok(typeof p.backgroundImage === 'string' && p.backgroundImage.length > 0, `pattern ${id} produced no layer`);
    if (id !== 'none') {
      assert.ok(
        p.backgroundImage.startsWith('radial-gradient') ||
          p.backgroundImage.startsWith('linear-gradient') ||
          p.backgroundImage.startsWith('repeating-linear-gradient') ||
          p.backgroundImage.startsWith('url("data:image/svg+xml'),
        `pattern ${id} is not a CSS layer or SVG tile`
      );
    }
  }
});

ok("'none' paints nothing", () => {
  assert.equal(buildTexture('none', COLORS, 'workspace').backgroundImage, 'none');
});

ok('unknown ids fall back to none (never a broken background)', () => {
  assert.equal(buildTexture('checkerboard', COLORS, 'workspace').backgroundImage, 'none');
});

ok('gradient patterns carry the theme tint as rgba', () => {
  const p = buildTexture('dots', COLORS, 'workspace');
  assert.ok(p.backgroundImage.includes('rgba(242,242,240,'));
  assert.equal(p.backgroundSize, '7px 7px');
});

ok('SVG tile patterns (plus / confetti / sparkles / xmark) are encoded data URIs', () => {
  for (const id of ['plus', 'confetti', 'sparkles', 'xmark']) {
    const p = buildTexture(id, COLORS, 'workspace');
    assert.ok(p.backgroundImage.startsWith('url("data:image/svg+xml'), `${id} is not an SVG tile`);
    assert.ok(p.backgroundSize && p.backgroundSize !== 'auto', `${id} has no tile size`);
  }
});

ok("0.34.0 'sparkles' tiles carry FOUR-POINT STARS as pure SVG paths (no font, no glyphs)", () => {
  const p = buildTexture('sparkles', COLORS, 'workspace');
  const uri = decodeURIComponent(p.backgroundImage.replace(/^url\("data:image\/svg\+xml,/, '').replace(/"\)$/, ''));
  assert.ok(uri.startsWith('<svg'), 'sparkles is not an SVG tile');
  assert.ok(!uri.includes('<text'), 'the emoji wall is retired — no font glyphs anywhere');
  assert.ok(!uri.includes('<filter'), 'no color-matrix remap needed — the paths take the tint directly');
  assert.ok(uri.includes('<path'), 'the stars are SVG paths');
  assert.ok(uri.includes('rotate('), 'the stars are rotated');
  // a loose 4x4 scaffold minus ~1-in-4 empty cells ≈ 9..16 marks
  const paths = uri.match(/<path[^>]*>/g) || [];
  assert.ok(paths.length >= 8, `the scatter tile should hold ~12 stars, got ${paths.length}`);
});

ok('0.34.0 the sparkles tile is a BIG scattered sheet — 240px tile, no lattice', () => {
  const p = buildTexture('sparkles', COLORS, 'viewer');
  assert.equal(p.backgroundSize, '240px 240px', 'the repeat period is a generous 240px');
  const uri = decodeURIComponent(p.backgroundImage.slice(5, -2));
  // varied sizes: the stars no longer share one radius (the path d varies)
  const ds = new Set(uri.match(/d="M0 -[\d.]+C/g) || []);
  assert.ok(ds.size >= 3, `jittered sizes should vary (saw ${ds.size} distinct star scales)`);
  // jittered positions: the x/y origins should not share a single column of
  // identical translate values (a strict lattice would)
  const xs = new Set((uri.match(/translate\(([\d.]+) /g) || []).map((t) => /[\d.]+/.exec(t)[0]));
  assert.ok(xs.size >= 5, `jitter should spread the columns (saw ${xs.size} distinct x origins)`);
});

ok('0.34.0 sparkles carry their OWN translucent depth (a few stars softer, none invisible)', () => {
  const p = buildTexture('sparkles', COLORS, 'viewer');
  const uri = decodeURIComponent(p.backgroundImage.slice(5, -2));
  const alphas = (uri.match(/opacity="([\d.]+)"/g) || []).map((o) => parseFloat(/[\d.]+/.exec(o)[0]));
  assert.ok(alphas.length >= 8, `every star carries an alpha, saw ${alphas.length}`);
  for (const a of alphas) {
    assert.ok(a >= 0.55 && a <= 1.0, `star alpha ${a} outside the 0.55..1.0 depth band`);
  }
  // a few stars ride the theme's SOFT tone for depth
  assert.ok(/rgba\(242,242,240,[\d.]+\)/.test(uri), 'the tint colors the stars');
});

ok('0.34.0 sparkles are STABLE within a session (the tile cache) and re-roll per LAUNCH / per surface', () => {
  // every value is its own Math.random roll, but the TILE CACHE memoizes
  // the build per (pattern, colors, surface): a settings change that
  // doesn't touch the theme's colors re-sets the SAME data URI, so nothing
  // repaints (the texture-reapply lag fix). A fresh process rolls a fresh sky.
  const a = buildTexture('sparkles', COLORS, 'sidebar');
  const b = buildTexture('sparkles', COLORS, 'sidebar');
  assert.equal(a.backgroundImage, b.backgroundImage, 'the same inputs hand back the cached tile');
  // different colors (a theme swap) = a different key = a fresh sky
  const other = buildTexture('sparkles', { ...COLORS, chrome: '#c0ffee' }, 'sidebar');
  assert.notEqual(a.backgroundImage, other.backgroundImage);
});

ok('0.30.0 different surfaces wear different sparkle arrangements', () => {
  const a = buildTexture('sparkles', COLORS, 'sidebar');
  const b = buildTexture('sparkles', COLORS, 'panel');
  assert.notEqual(a.backgroundImage, b.backgroundImage);
});

ok('0.42.0 confetti is a big RANDOM scatter — no repeating lattice, nothing clipped, no empty pockets', () => {
  // "make it created for the instance randomly and not pre determined, but
  // with rules that prevent it from clipping or leaving too many spaces
  // empty": a 480px field, ~85 marks over a 10x10 cell scaffold, rolled with
  // Math.random per build (per launch, cached in-session).
  const p = buildTexture('confetti', COLORS, 'viewer');
  assert.equal(p.backgroundSize, '480px 480px', 'the big 480px field (the repeat period outlasts any zoomout)');
  const uri = decodeURIComponent(p.backgroundImage.slice(5, -2).replace(/^data:image\/svg\+xml,/, ''));
  assert.ok(/^<svg[^>]+width="480"/.test(uri), 'the svg field is 480px wide');
  const bits = (uri.match(/<(rect|circle|path)/g) || []).length;
  assert.ok(bits >= 70 && bits <= 100, `a generous even scatter (70..100 bits), got ${bits}`);
  assert.ok(uri.includes('<rect') && uri.includes('<circle') && uri.includes('<path'), 'strip / dot / triangle shapes all roll');
  // no mark ever crosses the field's edge (the anti-clipping rule)
  // (\\b keeps the regex from catching the tails of rx= / opacity=)
  const xs = [...uri.matchAll(/\b(?:x|cx)="([\d.]+)"/g)].map((m) => Number(m[1]));
  const ys = [...uri.matchAll(/\b(?:y|cy)="([\d.]+)"/g)].map((m) => Number(m[1]));
  assert.ok(xs.every((v) => v >= 4 && v <= 476), 'every x sits inside the edge margin');
  assert.ok(ys.every((v) => v >= 4 && v <= 476), 'every y sits inside the edge margin');
  // stable within the session (the cache); different surfaces roll their own
  const again = buildTexture('confetti', COLORS, 'viewer');
  assert.equal(p.backgroundImage, again.backgroundImage);
  const other = buildTexture('confetti', COLORS, 'panel');
  assert.notEqual(p.backgroundImage, other.backgroundImage, 'surfaces roll their own sprinkle');
});

ok('texTint themes (Mumei) tint the pattern white and boost alpha', () => {
  const mumei = { ...COLORS, texTint: '#FFFFFF', texAlpha: 0.45 };
  const p = buildTexture('dots', mumei, 'workspace');
  assert.ok(p.backgroundImage.includes('rgba(255,255,255,0.45)'), `expected white dots at 45%, got: ${p.backgroundImage}`);
});

ok('swatch mode boosts the tint so a picker chip reads clearly', () => {
  const quiet = buildTexture('dots', COLORS, 'workspace', false);
  const loud = buildTexture('dots', COLORS, 'workspace', true);
  const q = parseFloat(/rgba\([^)]+,([\d.]+)\)/.exec(quiet.backgroundImage)[1]);
  const l = parseFloat(/rgba\([^)]+,([\d.]+)\)/.exec(loud.backgroundImage)[1]);
  assert.ok(l > q, `swatch alpha ${l} should beat surface alpha ${q}`);
});

ok('applyTextureVars writes the three per-surface CSS vars', () => {
  const map = {};
  const root = { style: { setProperty: (k, v) => (map[k] = v) } };
  applyTextureVars(root, 'sidebar', 'dots', COLORS);
  assert.ok(map['--gd-tex-sidebar'].startsWith('radial-gradient'));
  assert.ok(map['--gd-tex-sidebar-size'].includes('7px'));
  applyTextureVars(root, 'titlebar', 'none', COLORS);
  assert.equal(map['--gd-tex-titlebar'], 'none');
});

ok("0.15.0: 'halftone' is gone — the id renders no pattern (old dbs sanitize it away)", () => {
  assert.ok(!TEXTURES.some((t) => t.id === 'halftone'));
  assert.equal(buildTexture('halftone', COLORS, 'viewer').backgroundImage, 'none');
});

ok('every surface accepts every pattern (matrix is total)', () => {
  for (const { id: surface } of TEX_SURFACES) {
    for (const { id: pattern } of TEXTURES) {
      const p = buildTexture(pattern, COLORS, surface);
      assert.ok(p.backgroundImage, `${surface}/${pattern} produced nothing`);
    }
  }
});

// --- 0.14.0 additions -------------------------------------------------------
ok("0.19.0 'clouds' is REMOVED with the cloud theme — the id renders no pattern (old dbs sanitize it away)", () => {
  const p = buildTexture('clouds', COLORS, 'viewer');
  assert.equal(p.backgroundImage, 'none');
  assert.ok(!TEXTURES.some((t) => t.id === 'clouds'), 'clouds left the picker list');
});

ok("0.14.0 'xmark' is a crossing-stroke SVG tile (two X marks)", () => {
  const p = buildTexture('xmark', COLORS, 'sidebar');
  const uri = decodeURIComponent(p.backgroundImage.replace(/^url\("data:image\/svg\+xml,/, '').replace(/"\)$/, ''));
  assert.ok(uri.startsWith('<svg'), 'xmark is not an SVG tile');
  const crosses = uri.match(/M-[\d.]+ -?[\d.]+L/g) || [];
  assert.ok(uri.includes('stroke-linecap="round"'), 'x strokes should be rounded');
  assert.ok(crosses.length >= 2, `x tile should carry at least two X marks, got ${crosses.length}`);
  assert.equal(p.backgroundSize, '56px 56px');
});

ok('0.14.0 xmark stays deterministic per surface (stable seeds); clouds renders none everywhere', () => {
  const b1 = buildTexture('xmark', COLORS, 'viewer').backgroundImage;
  const b2 = buildTexture('xmark', COLORS, 'panel').backgroundImage;
  assert.notEqual(b1, b2, 'different surfaces seed differently');
  assert.equal(buildTexture('clouds', COLORS, 'viewer').backgroundImage, 'none');
  assert.equal(buildTexture('clouds', COLORS, 'panel').backgroundImage, 'none');
});

// --- 0.26.0 removals -------------------------------------------------------
ok("0.26.0 'waves' and 'bauhaus' are REMOVED by request — the ids render no pattern (old dbs sanitize them away)", () => {
  assert.ok(!TEXTURES.some((t) => t.id === 'waves'), 'waves left the picker list');
  assert.ok(!TEXTURES.some((t) => t.id === 'bauhaus'), 'bauhaus left the picker list');
  assert.equal(buildTexture('waves', COLORS, 'viewer').backgroundImage, 'none');
  assert.equal(buildTexture('bauhaus', COLORS, 'panel').backgroundImage, 'none');
});

ok("0.26.0/0.34.0 'charms', 'shuffle' and 'emojis' are RENAMED onto 'sparkles' (the emoji wall's replacement)", () => {
  assert.ok(!TEXTURES.some((t) => t.id === 'charms'), 'charms left the picker list');
  assert.ok(!TEXTURES.some((t) => t.id === 'shuffle'), 'shuffle left the picker list');
  assert.ok(!TEXTURES.some((t) => t.id === 'emojis'), 'emojis is RETIRED in 0.34.0');
  assert.ok(TEXTURES.some((t) => t.id === 'sparkles' && t.label === 'Sparkles'), 'sparkles is in the picker list');
  // the old ids themselves render none (db sanitize renames them — see the
  // helpers suite); the surviving pattern is the sparkle tile
  assert.equal(buildTexture('charms', COLORS, 'viewer').backgroundImage, 'none');
  assert.equal(buildTexture('shuffle', COLORS, 'viewer').backgroundImage, 'none');
  assert.equal(buildTexture('emojis', COLORS, 'viewer').backgroundImage, 'none');
});

// --- 0.27.0 additions ------------------------------------------------------
ok("0.34.0 sparkles take the TINT DIRECTLY — no feColorMatrix, no font dependence", () => {
  const p = buildTexture('sparkles', COLORS, 'viewer');
  const uri = decodeURIComponent(p.backgroundImage.slice(5, -2));
  // the tint (COLORS.chrome #f2f2f0 -> rgba(242,242,240,…)) fills the paths
  assert.ok(/rgba\(242,242,240,[\d.]+\)/.test(uri), 'the stars wear the theme tint as their fill');
  assert.ok(!uri.includes('<filter'), 'no color remap filter — that was emoji-font plumbing');
});

ok("0.27.0 texTint themes tint the sparkle silhouettes with their own tint", () => {
  const mumei = { ...COLORS, texTint: '#FFFFFF', texAlpha: 0.45 };
  const p = buildTexture('sparkles', mumei, 'viewer');
  const uri = decodeURIComponent(p.backgroundImage.slice(5, -2));
  assert.ok(uri.includes('rgba(255,255,255,'), 'the stars carry the pure white tint');
});

ok("0.27.0 'chevron' joins the family — a zigzag SVG tile, and the picker holds 12 patterns (two full rows)", () => {
  assert.ok(TEXTURES.some((t) => t.id === 'chevron' && t.label === 'Chevrons'), 'chevron is in the picker list');
  assert.equal(TEXTURES.length, 12, 'the picker row ended one short before — 12 fills it');
  const p = buildTexture('chevron', COLORS, 'viewer');
  assert.ok(p.backgroundImage.startsWith('url("data:image/svg+xml'), 'chevron is an SVG tile');
  const uri = decodeURIComponent(p.backgroundImage.slice(5, -2));
  assert.ok(uri.includes('<path'), 'the zigzag is a stroked path');
  assert.ok(uri.includes('stroke-linejoin="round"'), 'the crests are rounded');
  assert.equal(p.backgroundSize, '22px 13px', 'the tile size is set');
});

console.log(`\n${passed} texture engine checks passing`);

