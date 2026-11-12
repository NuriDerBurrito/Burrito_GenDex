import { THEME_PRESETS, TEXTURES, TEX_SURFACES, BUTTON_STYLES, BODY_FONT_OPTIONS } from '../constants/index.js';
import { buildTexture, applyTextureVars } from './textures.js';
import { readableInk } from './helpers.js';

const VAR_MAP = {
  '--gd-bg': 'bg',
  '--gd-chrome': 'chrome',
  '--gd-panel': 'panel',
  '--gd-panel-text': 'panelText',
  '--gd-ink': 'ink',
  '--gd-line': 'line',
  '--gd-mute': 'mute',
  '--gd-accent': 'accent',
  '--gd-accent-2': 'accent2',
  '--gd-accent-ink': 'accentInk',
};

// 0.42.0 — THE BODY FONT STACKS (Settings → Look → FONT): the three faces
// the app ships, as full font-family stacks. Display text keeps following
// the theme's own font token (root.dataset.font); the BODY follows the
// stored uiFont through --gd-body-font (index.css reads it with the classic
// mono stack as its fallback).
// 0.48.0 — THE IMPORTED SEAT IS GONE ("remove the custom font option"):
// the custom stack and the face it named left with the Look tab's IMPORT
// key — the stacks are the three shipped faces again, and any uiFont value
// outside them resolves to the classic mono in setThemeOnDocument.
const BODY_FONT_STACKS = {
  mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace",
  grotesk: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  serif: "'Spectral', Georgia, serif",
};

// 0.48.0 — ONE-TIME STORAGE CLEANUP for the retired imported font: the file
// bytes used to live in localStorage (gdCustomFont / gdCustomFontName) from
// the Look tab's IMPORT key. Nothing reads them anymore — this sweeps both
// keys on boot so a previously installed face doesn't linger in storage
// forever. Cheap, idempotent, silent when the keys never existed.
export function clearLegacyCustomFontStorage() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem('gdCustomFont');
    localStorage.removeItem('gdCustomFontName');
  } catch {
    /* storage unavailable — nothing to sweep */
  }
}

// SHAPE STYLE (0.15.0 — renamed from "button shape"). Two radii come out:
//   --gd-btn-radius   — buttons, chips, inputs: 'round' = full pills;
//                       'square' = near-hard corners (1px keeps a whisper
//                       of softness so 1px borders don't alias).
//   --gd-shape-radius — CARDS, the version container (the image-view card)
//                       and the other big framed surfaces: 'round' = a
//                       comfortable 16px; 'square' = hard 1px.
// 'theme' resolves each to the active theme's own tokens (btnShape for
// controls, radius for surfaces). Theme-owned HAND-DRAWN outlines (Mumei's
// painted chip rims) keep winning over these — the setting only rewrites
// the geometric radii.
const BTN_RADIUS = { round: '999px', square: '1px' };
const SHAPE_RADIUS = { round: '16px', square: '1px' };

// setThemeOnDocument — writes the active theme's tokens + the PER-SURFACE
// texture layers + the SHAPE STYLE corner language onto the root element.
// `textures` (0.14.0) is a { titlebar, sidebar, viewer, panel } map of
// pattern ids — the WORKSPACE surface is gone (it sat under every other
// surface and blended through). 0.19.0: the LIVING BACKGROUND mode and the
// derived viewer-head surface are gone with the animated backgrounds — the
// viewer's toolbar row and the character view's sticky header now wear their
// PARENT surface's own class (gd-tex-viewer / gd-tex-panel), so the pattern
// flows through them seamlessly instead of reading as an offset strip.
// `buttonStyle` (0.15.0: SHAPE STYLE, 'theme' | 'square' | 'round') drives
// BOTH corner vars — controls (--gd-btn-radius) and surfaces
// (--gd-shape-radius: cards, the version container, framed panels).
export function setThemeOnDocument(themeId, colors = {}, textures = null, buttonStyle = 'theme', uiFont = 'mono', cardCorners = 'theme') {
  const applied = applyThemeTokens(themeId, colors, buttonStyle, uiFont, cardCorners);
  applyThemeHeavy(applied, textures);
}

// 1.1.1 — THE TWO LANES ("fix the lag coming from the color picker when i
// change color values in the settings"). setThemeOnDocument used to do the
// WHOLE job in one synchronous pass — fine at boot, brutal mid-drag: every
// pointermove of a theme color rebuilt all four texture tiles (the tile
// cache keys on the resolved colors, so each intermediate hue was a MISS:
// fresh SVG scatters, fresh data-URI decodes, four surface repaints) and
// rewrote the boot snapshot, stacked on top of React's own pass. The lanes:
//
//   · applyThemeTokens — the CHEAP lane: the CSS color vars, radii, fonts,
//     dataset and finish. Microseconds; lands THIS frame so a drag previews
//     honestly.
//   · applyThemeHeavy — the EXPENSIVE lane: per-surface texture tiles + the
//     localStorage snapshot. Behind a short trailing debounce when driven
//     through setThemeOnDocumentLive — one rebuild per pause in the gesture,
//     never per pixel.
//
// Boot (renderer.js) and restoreThemeSnapshot keep calling the synchronous
// setThemeOnDocument — the first paint must arrive complete, debounce or
// not. The App's live theme effect drives the LIVE form.
function applyThemeTokens(themeIdRaw, colors = {}, buttonStyle = 'theme', uiFont = 'mono', cardCorners = 'theme') {
  // 1.6.4 — THE SNAPSHOT'S OWN MIGRATION LANE (mumei → numeix): the boot
  // snapshot in localStorage still speaks the old id on the first launch
  // after the rename — the find would miss and fall to the first preset,
  // flipping the splash's cloth. The id walks home here, the same road
  // createSafeDb speaks for the database itself.
  const themeId = themeIdRaw === 'mumei' ? 'numeix' : themeIdRaw;
  const theme = THEME_PRESETS.find((t) => t.id === themeId) || THEME_PRESETS[0];
  const root = document.documentElement;

  // 0.42.0 — THE BODY TYPEFACE: one CSS var, the whole app's body text
  // follows it live (display faces keep riding the theme's own token).
  const fontId = BODY_FONT_OPTIONS.some((f) => f.id === uiFont) ? uiFont : 'mono';
  root.style.setProperty('--gd-body-font', BODY_FONT_STACKS[fontId] || BODY_FONT_STACKS.mono);

  const resolved = {};
  for (const [cssVar, key] of Object.entries(VAR_MAP)) {
    resolved[key] = colors[key] || theme[key];
    root.style.setProperty(cssVar, resolved[key]);
  }
  root.style.setProperty('--gd-radius', theme.radius);
  root.style.setProperty('--gd-border-w', theme.borderW);
  root.style.setProperty('--gd-shadow', theme.shadow);
  // 0.37.0 — TOOLTIP TOKENS, READABILITY-GUARANTEED ("in some themes,
  // tooltips would blend in too much, fix that in all themes, while
  // accounting for light and dark themes"): the pill paints in the theme's
  // INK, which is a mid-tone in several themes — near-invisible against
  // same-hue surfaces, and its old text (the PANEL color) had no contrast
  // law at all. Two derived tokens now ride on the root:
  //   --gd-tip-ink — black/white (readableInk, by measured luminance) so the
  //                  TEXT always reads on the ink pill, light or dark theme;
  //   --gd-tip-rim — a hairline frame that ALWAYS differs from the pill: a
  //                  chrome-tinted rim on dark inks, an ink-tinted one on
  //                  bright inks, so the pill can never melt into any
  //                  surface it floats over.
  const tipInk = readableInk(resolved.ink);
  root.style.setProperty('--gd-tip-ink', tipInk);
  const inkLum = luminanceOf(resolved.ink);
  const rim = inkLum <= 0.55
    ? `color-mix(in srgb, ${resolved.chrome} 55%, transparent)`
    : `color-mix(in srgb, ${resolved.ink} 45%, #000000)`;
  root.style.setProperty('--gd-tip-rim', rim);
  // 1.4.5 — THE COUNTER RIM ("when a finish is applied ... the text should
  // have an outline that is opposite to the text's current color"): the
  // themed seats' answer, derived from the theme's own panel text — a
  // light theme text wears the dark rim, a dark theme text the light one.
  // Cards with a plate color compute their own rim at the seat
  // (counterRimFor in helpers); every themed surface falls back here, so
  // the finish's outline law is honest under all 12 themes + manual colors.
  const panelTextLum = luminanceOf(resolved.panelText);
  root.style.setProperty(
    '--gd-text-counter',
    panelTextLum > 0.5 ? 'rgba(13, 10, 7, 0.66)' : 'rgba(250, 246, 238, 0.72)'
  );

  // 1.2.3 — THE THREE BANDS ("the app would be divided in 3 colored
  // sections, aka getting darker"): the workspace stops being one flat
  // sheet. Every surface now declares which DEPTH BAND it sits in:
  //   tier-bar  (lightest) — the window top bar + the toolbars
  //   tier-mid  (middle)   — the tree, the detail panels, the output
  //   tier-deep (darkest)  — the card viewer
  // The bands derive from the theme's own ground (bg) in whichever
  // direction the cloth has perceptual room: dark ladders step UP
  // toward the light (the top lifts, the viewer keeps the deep ground),
  // bright ladders step DOWN into the shade (the top caps near white,
  // the viewer sinks). One law, all 12 themes — and because the bands
  // recompute on this CHEAP lane, a Manual Colors drag previews the
  // bands live exactly like the tokens do.
  const tiers = computeTierBands(resolved.bg);
  root.style.setProperty('--gd-tier-bar', tiers.bar);
  root.style.setProperty('--gd-tier-mid', tiers.mid);
  root.style.setProperty('--gd-tier-deep', tiers.deep);
  // 1.2.8 — THE TREE'S OWN WELL: the sidebar's dedicated band (see
  // computeTierBands) — the tree ground sinks under the mid panels so the
  // class cards (panel-painted) read as objects on a shelf, never as
  // cutouts of the same cloth.
  root.style.setProperty('--gd-tier-side', tiers.side);

  root.dataset.theme = theme.id;
  root.dataset.font = theme.font || 'display';

  // SHAPE STYLE (0.15.0): the setting wins, else the theme's own shape
  // tokens (rounded for Numei & the soft family, squared for Burrito).
  // Controls take the pill language; cards / the version container / framed
  // surfaces take the softer 16px language when 'round' is forced.
  const styleId = BUTTON_STYLES.some((b) => b.id === buttonStyle) ? buttonStyle : 'theme';
  const shape = styleId === 'theme' ? theme.btnShape || 'square' : styleId;
  root.style.setProperty('--gd-btn-radius', BTN_RADIUS[shape] || '1px');
  const surfaceShape = styleId === 'theme' ? theme.radius || '6px' : SHAPE_RADIUS[styleId] || '6px';
  root.style.setProperty('--gd-shape-radius', surfaceShape);
  // 1.6.3 — THE CARD'S OWN CORNERS ("like the other rounded theme for numeix
  // as an option"): the cards' half of the shape language is its OWN dial
  // now — 'round' or 'square' rewrites --gd-shape-radius (the CARD radius,
  // the version container, the framed surfaces) while the buttons keep the
  // shape style's own voice, and 'theme' keeps the pair walking together
  // exactly as they always did. A fresh boot without the key (every
  // database before this release) reads 'theme' — nothing changes for
  // anyone until they turn the dial.
  const cardShapeId = ['theme', 'round', 'square'].includes(cardCorners) ? cardCorners : 'theme';
  if (cardShapeId !== 'theme') {
    root.style.setProperty('--gd-shape-radius', SHAPE_RADIUS[cardShapeId] || surfaceShape);
  }

  // 1.1.8 — THE TOP BAR GRADIENT IS RETIRED ("remove top bar gradient
  // option"): the TOOLBAR FINISH setting and its satin/steel sheen left
  // the app with 1.1.8 — the bars wear their plain surface + pattern on
  // every theme now. A session that last ran 1.1.7 (or an old boot
  // snapshot replayed by renderer.js) can still carry the attribute on
  // the root, so every apply sweeps it off: no stale sheen can survive a
  // theme pass, whatever stored it.
  delete root.dataset.toolbarGrad;

  return { theme, resolved, styleId, fontId, cardShapeId };
}

// The expensive lane: the per-surface texture layers + the boot snapshot.
// `tokens` is what applyThemeTokens returned (theme + resolved + ids).
function applyThemeHeavy(tokens, textures) {
  const { theme, resolved, styleId, fontId, cardShapeId } = tokens;
  const patternIds = TEXTURES.map((t) => t.id);
  const root = document.documentElement;

  // Per-surface texture layers — each surface compiles its OWN pattern in
  // the resolved theme colors (texTint/texAlpha are per-theme overrides).
  // 1.0.9 — the loop also records what it applied: the boot snapshot below
  // replays the exact per-surface patterns (not the raw settings) so a
  // restore can never diverge from what the user last saw.
  // 1.1.6 — THE LEGACY STRING LANE IS RETIRED ("remove deprecated code"):
  // settings.textures is ALWAYS the per-surface map by the time it reaches
  // here (createSafeDb migrated the last single-string databases years
  // ago), so the old "a bare string spreads over three surfaces" branch
  // was dead weight.
  const texColors = { ...resolved, texTint: theme.texTint, texAlpha: theme.texAlpha };
  const appliedTex = {};
  for (const { id } of TEX_SURFACES) {
    const raw = textures && typeof textures === 'object' ? textures[id] : undefined;
    const pattern = patternIds.includes(raw) ? raw : DEFAULT_TEX(id);
    appliedTex[id] = pattern;
    applyTextureVars(root, id, pattern, texColors);
  }

  // 1.0.9 — THE BOOT SNAPSHOT ("in splash screen, the color of the glow
  // sometimes would update from a theme to another, ensure that it appears
  // with the right one right away"): the theme used to land only when the
  // database finished loading — every launch painted its first frames in
  // the CSS default tokens (the house green), and the splash's halo visibly
  // FLIPPED to the user's theme mid-flight. setThemeOnDocument now records
  // everything it just applied — resolved colors, per-surface patterns,
  // shape, finish, face — and renderer.js replays the snapshot BEFORE the
  // first React paint, so the splash (and every surface behind it) is born
  // in the theme the user actually runs. The database's own apply later
  // re-runs the identical values: the texture tile cache makes the second
  // pass a no-op repaint, and the flip the user saw is gone. A snapshot can
  // only go stale if the database itself changed on disk from elsewhere —
  // and then one clean correction beats a wrong first paint on every boot.
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        'gdThemeSnapshot',
        JSON.stringify({
          id: theme.id,
          colors: resolved,
          textures: appliedTex,
          buttonStyle: styleId,
          uiFont: fontId,
          cardCorners: cardShapeId,
        })
      );
    }
  } catch {
    /* storage unavailable — the boot falls back to the CSS defaults, as before */
  }
}

// 1.1.1 — THE LIVE FORM: cheap tokens THIS frame, heavy lane on a short
// trailing debounce (one texture/snapshot pass per pause in a color drag —
// the picker's gesture stays at frame rate, the surfaces catch up the
// instant the pointer rests). The debounce is module-level: every caller
// shares one timer, so a burst of patches collapses into a single rebuild,
// and the LAST arguments always win.
let heavyTimer = 0;
export function setThemeOnDocumentLive(themeId, colors = {}, textures = null, buttonStyle = 'theme', uiFont = 'mono', cardCorners = 'theme') {
  const tokens = applyThemeTokens(themeId, colors, buttonStyle, uiFont, cardCorners);
  if (heavyTimer) clearTimeout(heavyTimer);
  const run = () => {
    heavyTimer = 0;
    applyThemeHeavy(tokens, textures);
  };
  if (typeof window === 'undefined' || typeof setTimeout !== 'function') {
    run();
    return;
  }
  heavyTimer = setTimeout(run, 130);
}

// 1.0.9 — Replays the last applied theme onto the document BEFORE React
// mounts (see the snapshot note above). Returns true when a snapshot was
// found and applied; false leaves the document on the CSS default tokens —
// exactly the old behavior for a first-ever launch.
export function restoreThemeSnapshot() {
  if (typeof document === 'undefined' || typeof localStorage === 'undefined') return false;
  try {
    const raw = localStorage.getItem('gdThemeSnapshot');
    if (!raw) return false;
    const snap = JSON.parse(raw);
    if (!snap || typeof snap.id !== 'string') return false;
    setThemeOnDocument(
      snap.id,
      snap.colors || {},
      snap.textures || null,
      snap.buttonStyle || 'theme',
      snap.uiFont || 'mono',
      snap.cardCorners || 'theme'
    );
    return true;
  } catch {
    return false;
  }
}

const DEFAULT_TEX = (surface) =>
  surface === 'viewer' ? 'dots' : 'none';

// Relative luminance of a #rrggbb (the readableInk math, exposed for the
// tooltip rim decision in setThemeOnDocument).
function luminanceOf(hex) {
  const h = String(hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return 0;
  const chan = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = chan.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

// ---------------------------------------------------------------------------
// 1.2.3 — THE THREE BANDS. The depth ladder every surface hangs from:
//   tier-bar  (lightest) — the window top bar + the toolbars
//   tier-mid  (middle)   — the tree, the detail panels, the output
//   tier-deep (darkest)  — the card viewer
//
// THE LAW — one derivation, every theme, no hand-picked hexes:
//   · DARK cloth (9 themes): the ground sits near black, so the perceptual
//     room is UPWARD. The viewer keeps the theme's own ground (the deepest
//     tone the ladder already guarantees — machine-checked bg < panel),
//     the mid sections lift one HSL-L step, the bars lift two. Getting
//     darker downward reads as the chrome rising around a deep canvas.
//   · BRIGHT cloth (Archive, Paper, Numei): the ground sits near white, so
//     the room is DOWNWARD. The bars cap toward the light (never past
//     L 0.97 — pure white is the chip color's job, not a band's), the mid
//     sections keep the theme's own ground, the viewer sinks a step into
//     the shade. The paper apps get the same top-lit read, mirrored.
//
// The steps live in HSL lightness so they land perceptually even-sized
// across hues (an srgb channel mix would give near-invisible steps on the
// bright family and oversized ones on the dark family — measured: +1..3
// channels on #efeae0 vs +21 on #101014 for the same 10% white mix).
// Saturation rides along untouched — a band never shifts hue, only depth.
// ---------------------------------------------------------------------------
const BAND_STEP_DARK_MID = 0.045;
// 1.2.6 lowered the bar's lift once (0.13 → 0.08) and the user read it
// still as the brightest strip in the app. 1.2.7 — THE BAR RIDES THE GROUND ("top toolbar should be darker, not the brightest one"): the top
// bar sits at the theme's own ground now (tier-bar == tier-deep on the
// dark family) — the chrome reads as a dark cap over the slightly lifted
// tree/panels and the deep canvas, never as a lit strip. The mid sections
// follow it a shade lower (0.065 → 0.045 — "left tree should be slightly
// darker"), so the ladder stays perceptual: bar = ground, mid a breath
// above, viewer the ground again.
const BAND_STEP_DARK_BAR = 0.0;
// 1.2.8 — THE TREE'S OWN WELL ("the left tree's background should be darker
// so it doesn't blend with the things inside it"): the tree's class cards
// paint the theme's PANEL color, and the sidebar's tier-mid sits so close
// to panel on most dark themes (glacier: panel #151d22 vs mid #162028) that
// the cards melted into their own ground — no edge, no depth, one cloth.
// The sidebar gets its OWN band a shade UNDER the deep ground: the tree
// reads as a recessed shelf, and the panel-painted cards, the rails and
// the hover washes all pop off it. The floor clamp (0.03) keeps very dark
// grounds from crushing to pure black.
const BAND_STEP_DARK_SIDE = -0.024;
// ...and the bright family follows the same laws (the bar ties the ground
// instead of capping above it; the mid sections shade a hair below it).
const BAND_STEP_LIGHT_BAR = 0.0;
const BAND_STEP_LIGHT_MID = -0.015;
const BAND_STEP_LIGHT_DEEP = 0.055; // into the shade (bright family)
// 1.2.8 — the bright family's tree shades deeper than its mid (a clear
// step under the panels' wash, above the viewer's full shade) so the
// paper themes get the same shelf reading the dark ones do.
const BAND_STEP_LIGHT_SIDE = -0.05;
// The cap keeps a clear margin off pure white (a chip's job, not a band's)
// while leaving very pale grounds (Numei's L 0.94 family) enough step to
// stay a perceptible band off the mid — measured: at 0.97 Mumei's bar
// read only 1.057x off its mid; 0.98 lands ~1.08x.
const BAND_L_CAP = 0.98;
const BAND_L_FLOOR = 0.03; // never pure black — the ground keeps its grain

function hexToHsl(hex) {
  const h = String(hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return { h: 0, s: 0, l: 0.5 };
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let hue = 0;
  let sat = 0;
  const d = max - min;
  if (d > 0) {
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: hue = ((b - r) / d + 2); break;
      default: hue = ((r - g) / d + 4);
    }
    hue /= 6;
  }
  return { h: hue, s: sat, l };
}

function hueToRgbChannel(p, q, t) {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

function hslToHex(h, s, l) {
  const chan = s === 0
    ? [l, l, l]
    : (() => {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      return [
        hueToRgbChannel(p, q, h + 1 / 3),
        hueToRgbChannel(p, q, h),
        hueToRgbChannel(p, q, h - 1 / 3),
      ];
    })();
  const to2 = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0');
  return `#${to2(chan[0])}${to2(chan[1])}${to2(chan[2])}`;
}

// Steps a hex's HSL lightness by dL, clamped to the band cap/floor.
// Saturation and hue ride untouched — depth only, never a hue shift.
function stepLightness(hex, dL) {
  const { h, s, l } = hexToHsl(hex);
  const nl = Math.min(BAND_L_CAP, Math.max(BAND_L_FLOOR, l + dL));
  return hslToHex(h, s, nl);
}

export function computeTierBands(bg) {
  if (luminanceOf(bg) < 0.5) {
    // Dark cloth — the room is upward: the viewer keeps the ground, the
    // bar RIDES it (1.2.7), and the mid sections breathe just above both.
    // 1.2.8 — the tree sinks a shade UNDER the ground (its own well, see
    // BAND_STEP_DARK_SIDE).
    return {
      bar: stepLightness(bg, BAND_STEP_DARK_BAR),
      mid: stepLightness(bg, BAND_STEP_DARK_MID),
      deep: bg,
      side: stepLightness(bg, BAND_STEP_DARK_SIDE),
    };
  }
  // Bright cloth — the room is downward: the bar ties the ground, the mid
  // sections shade a hair below it (1.2.7 — the tree slightly darker), and
  // the viewer sinks a full step into the shade. 1.2.8 — the tree shades
  // deeper still (its own well under the panels' wash).
  return {
    bar: stepLightness(bg, BAND_STEP_LIGHT_BAR),
    mid: stepLightness(bg, BAND_STEP_LIGHT_MID),
    deep: stepLightness(bg, -BAND_STEP_LIGHT_DEEP),
    side: stepLightness(bg, BAND_STEP_LIGHT_SIDE),
  };
}

// Pattern CSS for one surface (used by the settings swatches so the picker
// shows the REAL pattern in the live theme colors).
export function surfaceTextureStyle(patternId, themeId, colors = {}, surface = 'titlebar', swatch = true) {
  const theme = THEME_PRESETS.find((t) => t.id === themeId) || THEME_PRESETS[0];
  const resolved = {};
  for (const key of Object.values(VAR_MAP)) {
    resolved[key] = colors[key] || theme[key];
  }
  const texColors = { ...resolved, texTint: theme.texTint, texAlpha: theme.texAlpha };
  return buildTexture(patternId, texColors, surface, swatch);
}
