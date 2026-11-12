// THEME LADDER TEST (0.12.0) — the machine half of "themes designed on
// principles". Every shipped preset must satisfy the documented ladder:
//
//   1. LADDER      panel is a step up from bg; INK (outer frames) reads
//                  clearly stronger than LINE (inner hairlines) on the panel;
//                  body text is AAA on panels; muted text stays readable.
//   2. HARMONY     the accent pops from the workspace; text on the accent
//                  is readable (>= 4.5:1).
//   3. SHAPE       every preset carries valid radius / border weight / shadow
//                  / typeface tokens.
//
// Pure logic — no React, no jsdom. Run: node scripts/gendex_theme_contrast.test.mjs
import assert from 'node:assert/strict';
import { THEME_PRESETS, TEXTURES, TEX_SURFACES } from '../src/constants/index.js';

// --- WCAG relative luminance + contrast ratio --------------------------------
const lin = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = (hex) => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  assert.ok(m, `bad hex: ${hex}`);
  const n = parseInt(m[1], 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
const contrast = (a, b) => {
  const la = lum(a);
  const lb = lum(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

let passed = 0;
const check = (name, ok, extra = '') => {
  assert.ok(ok, `${name}${extra ? ` — ${extra}` : ''}`);
  passed += 1;
  console.log(`  ok ${passed} — ${name}`);
};

// The thresholds encode the PRINCIPLES themselves.
const LADDER = {
  panelStep: 1.06, // panel sits at least one perceptible step above bg
  inkMin: 2.0, // outer frames must read on panels
  inkLineGap: 0.3, // ink must beat line by a CLEAR margin (hierarchy)
  lineMin: 1.15, // hairlines still visible
  textMin: 7.0, // body text on panels (WCAG AAA)
  muteMin: 3.0, // muted text readable on panel AND workspace
  accentBgMin: 2.5, // the accent pops from the workspace
  accentInkMin: 4.5, // text on accent chips (WCAG AA, large-ish text)
};

const FONTS = ['display', 'serif', 'mono'];

for (const t of THEME_PRESETS) {
  console.log(`\n${t.name} (${t.id})`);
  check('all color tokens are 6-digit hex', ['bg', 'chrome', 'panel', 'panelText', 'ink', 'line', 'mute', 'accent', 'accent2', 'accentInk'].every((k) => /^#[0-9a-fA-F]{6}$/.test(t[k])));
  if (t.userPalette) {
    // 0.13.0 — USER-SPECIFIED PALETTE (Mumei): the hexes are pinned to the
    // table, EXACT, and the generic ladder rules that the spec intentionally
    // overrides are checked against the sheet's own logic instead.
    // 0.19.0 — REDONE from the reference: white dominant, cyan accents,
    // black the least (text + tiny marks only). The old all-cyan ladder
    // (sky bg + cyan ink + cyan line + cyan accent) is what blended into
    // itself; the roles are now split across three separate inks.
    const MUMEI_SPEC = {
      bg: '#E7F5F9', chrome: '#101519', panel: '#FFFFFF', panelText: '#15191E', ink: '#0E5E75',
      line: '#BCE3ED', mute: '#52707E', accent: '#15B2CF', accent2: '#101820', accentInk: '#FFFFFF',
    };
    check('user palette hexes match the spec sheet EXACTLY', Object.entries(MUMEI_SPEC).every(([k, v]) => t[k] === v));
    check('0.19.0 redo: WHITE dominant — panels pure white on a near-white paper workspace', contrast(t.panel, t.bg) >= 1.06 && contrast(t.bg, t.panel) >= 1.0, `${contrast(t.panel, t.bg).toFixed(2)}x`);
    check('0.19.0 redo: the deep-cyan INK ladder reads on white panels AND on the paper sky', contrast(t.ink, t.panel) >= 4.5 && contrast(t.ink, t.bg) >= 4.0, `panel ${contrast(t.ink, t.panel).toFixed(2)}x / bg ${contrast(t.ink, t.bg).toFixed(2)}x`);
    check('0.19.0 redo: ink beats line by a clear margin (hierarchy kept)', contrast(t.ink, t.panel) > contrast(t.line, t.panel) + 0.3, `ink ${contrast(t.ink, t.panel).toFixed(2)}x vs line ${contrast(t.line, t.panel).toFixed(2)}x`);
    check('0.19.0 redo: pale-cyan dividers still a step off the paper', contrast(t.line, t.bg) >= 1.15, `${contrast(t.line, t.bg).toFixed(2)}x`);
    check('body text (near-black — the LEAST black, only text) readable on white panels', contrast(t.panelText, t.panel) >= 3.0, `${contrast(t.panelText, t.panel).toFixed(2)}x`);
    check('0.19.0/0.20.0 redo: no living background, no cloud pattern — white paper, cyan polka viewer + the X pattern on the right panel', t.defaultLiving === undefined && t.livingSpeed === undefined && t.texDefaults && t.texDefaults.viewer === 'dots' && t.texDefaults.panel === 'xmark' && t.texTint === '#2FB9D6');
    check('rounded button language (Mumei is a round-corner theme)', t.btnShape === 'round');
    check('shape tokens valid (radius / borderW / shadow / font)', /^\d+(\.\d+)?px$/.test(t.radius) && /^\d+(\.\d+)?px$/.test(t.borderW) && /px/.test(t.shadow) && FONTS.includes(t.font));
    continue;
  }
  check('panel is a step above bg', contrast(t.panel, t.bg) >= LADDER.panelStep, `${contrast(t.panel, t.bg).toFixed(2)}x`);
  check('ink (frames) reads on the panel', contrast(t.ink, t.panel) >= LADDER.inkMin, `${contrast(t.ink, t.panel).toFixed(2)}x`);
  check('ink beats line by a clear margin (hierarchy)', contrast(t.ink, t.panel) > contrast(t.line, t.panel) + LADDER.inkLineGap, `ink ${contrast(t.ink, t.panel).toFixed(2)}x vs line ${contrast(t.line, t.panel).toFixed(2)}x`);
  check('line (hairlines) visible on the panel', contrast(t.line, t.panel) >= LADDER.lineMin, `${contrast(t.line, t.panel).toFixed(2)}x`);
  check('body text AAA on panels', contrast(t.panelText, t.panel) >= LADDER.textMin, `${contrast(t.panelText, t.panel).toFixed(2)}x`);
  check('muted text readable on panels', contrast(t.mute, t.panel) >= LADDER.muteMin, `${contrast(t.mute, t.panel).toFixed(2)}x`);
  check('muted text readable on the workspace', contrast(t.mute, t.bg) >= LADDER.muteMin, `${contrast(t.mute, t.bg).toFixed(2)}x`);
  check('accent pops from the workspace', contrast(t.accent, t.bg) >= LADDER.accentBgMin, `${contrast(t.accent, t.bg).toFixed(2)}x`);
  check('text on accent readable', contrast(t.accentInk, t.accent) >= LADDER.accentInkMin, `${contrast(t.accentInk, t.accent).toFixed(2)}x`);
  check('shape tokens valid (radius / borderW / shadow / font)', /^\d+(\.\d+)?px$/.test(t.radius) && /^\d+(\.\d+)?px$/.test(t.borderW) && /px/.test(t.shadow) && FONTS.includes(t.font));
  // 0.14.0 — every theme carries a button corner language (square or round)
  // and its own full per-surface pattern set.
  check('button shape token valid (square | round)', t.btnShape === 'square' || t.btnShape === 'round', t.id);
  check('theme ships its own per-surface pattern set', t.texDefaults && ['titlebar', 'sidebar', 'viewer', 'panel'].every((s) => t.texDefaults[s] !== undefined), t.id);
  // 0.13.0 — a theme that ships a background look must name VALID patterns
  // for VALID surfaces (and a valid living mode if it names one).
  if (t.texDefaults) {
    const patternIds = new Set(TEXTURES.map((x) => x.id));
    const surfaceIds = new Set(TEX_SURFACES.map((x) => x.id));
    check(
      'texDefaults name valid patterns on valid surfaces',
      Object.entries(t.texDefaults).every(([surface, pattern]) => surfaceIds.has(surface) && patternIds.has(pattern))
    );
  }
  check('0.19.0: no theme ships a living background (feature removed)', t.defaultLiving === undefined && t.livingSpeed === undefined);
}

// Living-background modes: REMOVED (0.19.0). No mode list exists anymore.
console.log('\nLIVING BACKGROUND');
check('modes gone with the feature — every theme is still, nothing drifts', THEME_PRESETS.every((t) => t.defaultLiving === undefined));

// Texture patterns + surfaces (0.13.0): ids unique, surfaces unique, and
// the sparkles pattern exists (the 0.34.0 replacement for the retired
// emoji wall — a big random scatter of four-point stars).
console.log('\nTEXTURE PATTERNS & SURFACES');
check('base pattern is none', TEXTURES[0]?.id === 'none');
check('texture ids unique + labeled', new Set(TEXTURES.map((x) => x.id)).size === TEXTURES.length && TEXTURES.every((x) => x.id && x.label));
check('four pattern surfaces (toolbar / tree / viewer / panel — workspace removed 0.14.0)', TEX_SURFACES.length === 4 && ['titlebar', 'sidebar', 'viewer', 'panel'].every((id) => TEX_SURFACES.some((s) => s.id === id)));
check('every surface carries a lucide AREA ICON for the settings picker (0.26.0)', TEX_SURFACES.every((s) => typeof s.icon === 'string' && s.icon.length > 0));
check('0.19.0: clouds pattern REMOVED, x marks present', !TEXTURES.some((x) => x.id === 'clouds') && TEXTURES.some((x) => x.id === 'xmark'));
check('0.26.0/0.34.0: waves + bauhaus + charms + shuffle REMOVED; emojis RETIRED; sparkles present', !TEXTURES.some((x) => ['waves', 'bauhaus', 'charms', 'shuffle', 'emojis'].includes(x.id)) && TEXTURES.some((x) => x.id === 'sparkles'));
check('no theme still references a removed pattern id', THEME_PRESETS.every((t) => Object.values(t.texDefaults || {}).every((id) => TEXTURES.some((x) => x.id === id))));
check('Burrito ships its sticker look (square buttons + hard 0 radius — square everywhere 0.33.0 — clean toolbar + confetti viewer)', (() => {
  const b = THEME_PRESETS.find((t) => t.id === 'burrito');
  return b && b.btnShape === 'square' && b.radius === '0px' &&
    b.texDefaults && b.texDefaults.titlebar === 'none' && b.texDefaults.sidebar === 'graph' &&
    b.texDefaults.viewer === 'confetti' && b.texDefaults.panel === 'grid';
})());
check('0.34.0 sparkles pattern present (the emoji wall\u2019s replacement — re-rolled per launch)', TEXTURES.some((x) => x.id === 'sparkles' && x.label === 'Sparkles'));
check('0.34.0 GLACIER is the main theme (the app\u2019s own default set)', (() => {
  const g = THEME_PRESETS.find((t) => t.id === 'glacier');
  return g && g.texDefaults && g.texDefaults.titlebar === 'none' && g.texDefaults.sidebar === 'graph' &&
    g.texDefaults.viewer === 'grid' && g.texDefaults.panel === 'none';
})());
check('twelve themes (8 classic + Bastel / Paper / Metallic / Numei)', (() => {
  // 1.6.4 — the rename walked the theme id: mumei -> numeix (the migration
  // lane in createSafeDb carries every saved seat home).
  return THEME_PRESETS.length === 12 && ['craft', 'paper', 'metal', 'numeix'].every((id) => THEME_PRESETS.some((t) => t.id === id)) &&
    !THEME_PRESETS.some((t) => t.id === 'mumei');
})());

console.log(`\n${passed} theme ladder checks passing`);
