// ---------------------------------------------------------------------------
// BACKGROUND TEXTURES (0.14.0) — PER-SURFACE still patterns.
//
// Each surface (top toolbar, left tree, card viewer body, viewer header,
// right panel) picks its OWN pattern id, and this module compiles a pattern
// id + the resolved theme colors into the CSS the surface wears (set as
// per-surface CSS vars by theme.js). The 0.13.0 full-window workspace layer
// is GONE — it sat UNDER every surface, so its pattern shone through the
// others (the "all blended together" bug).
//
// Two families:
//   · CSS gradients — dots, grids, scanlines, hatch.
//   · SVG data-URI tiles — plus grid, confetti, X MARKS, SPARKLES and
//     chevrons.
//
// 0.26.0 — 'waves' and 'bauhaus' are REMOVED by request (their builders and
// picker entries are gone; old databases sanitize them away).
//
// 0.34.0 — THE EMOJI WALL IS RETIRED, ROUND THREE. Two releases tried to
// make a system-emoji-font pattern behave (palette pruning, opacity laws,
// big scattered tiles) and it kept failing the same way: a pattern that
// leans on a FONT it doesn't ship can never be trusted — missing glyphs
// paint as nothing, per-OS metrics mis-size the cells, and COLR color
// fonts shrug at the tint. Its slot goes to SPARKLES — the same IDEA (a
// big, truly random scatter of little marks, re-rolled every launch)
// redrawn as pure SVG four-point stars. No font in the pipeline: every
// mark always paints, every theme tints it, nothing can be invisible.
// The CONFETTI goes back to the classic 0.32.0 tight tile by request
// ("the glitter revert it back to how it was the previous version") —
// the 0.33.0 clustered-shower rework read as a different pattern
// altogether.
//
// 0.33.0 — THE TILE CACHE: every build is memoized per (pattern, colors,
// surface, swatch). The sparkles re-roll per LAUNCH (not per rebuild), and
// a settings change that doesn't touch the theme's colors re-sets the
// SAME data URI — Chromium has nothing to repaint, which kills the
// texture-reapply hitch after every panel toggle.
//
// Pure logic, no React.
// ---------------------------------------------------------------------------

// One random number per app launch — kept exported for the bundle check
// (the per-launch re-roll's old birthmark; the tiles now roll from
// Math.random directly, cached per session by the TILE_CACHE below).
export const SESSION_SEED = Math.floor(Math.random() * 0x7fffffff) + 1;

// Deterministic PRNG (mulberry32) — small, fast, good enough for tiles.
const rng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Stable per-surface seed — two surfaces never show the same arrangement
// (the seeded family: X marks and confetti; sparkles rolls Math.random).
const surfaceSeed = (surface) => {
  let h = 2166136261;
  const s = String(surface || '');
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 1;
};

const hexToRgb = (hex, fallback) => {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, (n & 255)];
};

const rgba = (rgb, a) => `rgba(${Math.round(rgb[0])},${Math.round(rgb[1])},${Math.round(rgb[2])},${a})`;

// 0.34.0 — THE SPARKLE MARK. A four-point star drawn as ONE SVG path —
// no font, no glyph table, no color-font surprises: it paints on every OS,
// at every size, in whatever tint the theme resolved. The path is a
// classic "concave diamond": pinched waist, pointed tips (k = the pinch,
// r = the tip radius from center).
const sparklePath = (r, k) => {
  const w = r * k;
  return `M0 ${-r}C${w} ${-w} ${w} ${-w} ${r} 0C${w} ${w} ${w} ${w} 0 ${r}C${-w} ${w} ${-w} ${w} ${-r} 0C${-w} ${-w} ${-w} ${-w} 0 ${-r}Z`;
};

const svgUri = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

// One SPARKLES tile (0.34.0 — the emoji wall's replacement). A generous
// 240px scatter of four-point stars: a loose 4x4 cell scaffold keeps the
// coverage even, but each star JITTERS far inside its cell, sizes itself
// anywhere between 5px and 13px, tilts its own way, and one cell in four
// stays empty for breathing room — the eye loses the lattice and the
// repeat period outlasts any screen. A few stars ride the theme's SOFT
// tone and a few sit at partial opacity, so the wall reads as depth, not
// wallpaper dots. Every value is its own Math.random roll; the tile is
// cached per session by TILE_CACHE, so the sky re-rolls every LAUNCH,
// never mid-session.
const sparkleTile = ({ tile, color, cSoft }) => {
  const cells = 4;
  const step = tile / cells;
  const marks = [];
  for (let cy = 0; cy < cells; cy += 1) {
    for (let cx = 0; cx < cells; cx += 1) {
      // one cell in four stays empty — no lattice, breathing room
      if (Math.random() < 0.26) continue;
      const r = 2.5 + Math.random() * 4; // 5..13px across
      const rot = Math.round(Math.random() * 360);
      const soft = Math.random() < 0.3;
      const alpha = 0.55 + Math.random() * 0.45;
      const jitter = step * 0.36;
      const ox = ((cx + 0.5) * step + (Math.random() * 2 - 1) * jitter).toFixed(1);
      const oy = ((cy + 0.5) * step + (Math.random() * 2 - 1) * jitter).toFixed(1);
      marks.push(
        `<path d="${sparklePath(r.toFixed(2), 0.18)}" fill="${soft ? cSoft : color}" opacity="${alpha.toFixed(2)}" transform="translate(${ox} ${oy}) rotate(${rot})"/>`
      );
    }
  }
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}" viewBox="0 0 ${tile} ${tile}">${marks.join('')}</svg>`
  );
};

// 0.27.0 — CHEVRON: a zigzag arrow-walk, two rows per tile — a bold crest
// line with a fainter echo a half-step below — reading as stitched chevrons.
// Fills the picker's twelfth slot (the row used to end one short).
const chevronTile = ({ tile, color, cSoft }) => {
  const w = tile;
  const h = Math.round(tile * 0.6);
  const zig = (yBase, amp, col, sw) => {
    const seg = w / 4;
    const pts = [
      `0 ${yBase}`,
      `${seg / 2} ${yBase - amp}`,
      `${seg * 1.5} ${yBase + amp}`,
      `${seg * 2.5} ${yBase - amp}`,
      `${seg * 3.5} ${yBase + amp}`,
      `${w} ${yBase}`,
    ].join(' L ');
    return `<path d="M${pts}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
  };
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      zig(Math.round(h * 0.38), Math.round(h * 0.17), color, 2) +
      zig(Math.round(h * 0.78), Math.round(h * 0.17), cSoft, 1.4) +
      `</svg>`
  );
};

// One CONFETTI build — 0.42.0 — THE SPRINKLE IS NOT A TILE ANYMORE ("i want
// you to make it so that the background pattern of confetti isnt a repeating
// pattern, meaning when its laid back on a zoomout i dont wanna see repeating
// pattern, make it created for the instance randomly and not pre determined,
// but with rules that prevent it from clipping or leaving too many spaces
// empty"): the old 64px seeded tile repeated its 16 little bits every 64
// pixels — zoomed out (or on a wide screen) the lattice was plain to see.
// The new build is a BIG 480px scatter (~85 marks over a 10×10 cell
// scaffold), rolled with Math.random per instance (per app launch, stable
// within the session through the TILE_CACHE — no mid-session re-roll
// flicker), with two hard rules:
//   · NO CLIPPING — every mark is placed fully inside the tile with its own
//     reach as margin, so no bit is ever cut by the tile's edge (a cut bit
//     is what makes a repeat seam visible in the first place).
//   · NO BIG EMPTY POCKETS — the cell scaffold keeps the coverage even
//     (every cell hosts a mark unless its one-in-seven skip fires), while
//     the jitter, the size roll and the rotation keep the eye from finding
//     the lattice. Bits mix strips / dots / triangles, some on the theme's
//     soft tone, some at partial opacity — depth, not wallpaper.
const confettiScatter = ({ tile, color, cSoft }) => {
  const cells = 10; // 10×10 scaffold on a 480px field → ~48px cells
  const step = tile / cells;
  const reach = 4.5; // the largest bit's half-diagonal — the edge margin
  const bits = [];
  for (let cy = 0; cy < cells; cy += 1) {
    for (let cx = 0; cx < cells; cx += 1) {
      // one cell in seven stays empty — breathing room, never a pocket
      if (Math.random() < 0.14) continue;
      const lo = reach;
      const hi = step - reach;
      const x = (cx * step + lo + Math.random() * (hi - lo)).toFixed(1);
      const y = (cy * step + lo + Math.random() * (hi - lo)).toFixed(1);
      const rot = Math.round(Math.random() * 360);
      const soft = Math.random() < 0.28;
      const alpha = (0.6 + Math.random() * 0.4).toFixed(2);
      const col = soft ? cSoft : color;
      const kind = Math.floor(Math.random() * 3);
      if (kind === 0) {
        const w = (4 + Math.random() * 3).toFixed(1);
        bits.push(
          `<rect x="${x}" y="${y}" width="${w}" height="2" rx="1" fill="${col}" opacity="${alpha}" transform="rotate(${rot} ${x} ${y})"/>`
        );
      } else if (kind === 1) {
        bits.push(`<circle cx="${x}" cy="${y}" r="${(1.3 + Math.random() * 0.9).toFixed(1)}" fill="${col}" opacity="${alpha}"/>`);
      } else {
        const s = (3 + Math.random() * 1.6).toFixed(1);
        bits.push(`<path d="M${x} ${y}l${s} ${(s * 1.7).toFixed(1)}h${(-2 * s).toFixed(1)}z" fill="${col}" opacity="${alpha}" transform="rotate(${rot} ${x} ${y})"/>`);
      }
    }
  }
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}" viewBox="0 0 ${tile} ${tile}">${bits.join('')}</svg>`
  );
};

const plusTile = ({ tile, color, strokeW }) =>
  svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}" viewBox="0 0 ${tile} ${tile}">` +
      `<path d="M${tile / 2} ${tile * 0.3}V${tile * 0.7}M${tile * 0.3} ${tile / 2}H${tile * 0.7}" fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linecap="round"/></svg>`
  );

// 0.14.0 — X MARKS: the app's own tilted-X motif as a wallpaper. Two X
// strokes per tile at different sizes/rotations — the wordmark's little
// cousin, quiet enough to sit behind cards.
const xTile = ({ tile, color, cSoft, seed }) => {
  const rand = rng(seed);
  const x = (cx, cy, w, rot, col) => {
    const arm = w / 2;
    return (
      `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})">` +
      `<path d="M${-arm} ${-arm}L${arm} ${arm}M${-arm} ${arm}L${arm} ${-arm}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round"/></g>`
    );
  };
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}" viewBox="0 0 ${tile} ${tile}">` +
      x(tile * 0.5, tile * 0.34, tile * 0.3, Math.round((rand() * 2 - 1) * 16), color) +
      x(tile * (0.5 + (rand() * 0.3 - 0.15)), tile * 0.78, tile * 0.18, Math.round((rand() * 2 - 1) * 24), cSoft) +
      `</svg>`
  );
};

// ---------------------------------------------------------------------------
// 0.33.0 — THE TILE CACHE. buildTexture used to re-roll its SVG tiles every
// call — and the App called it after EVERY db write (the theme effect read
// the whole db), so typing, panel toggles and settings flips all rebuilt
// four data URIs and repainted every surface behind them (the "background
// texture reapplies / lags" report). The cache memoizes each build per
// (pattern, colors, surface, swatch): identical inputs hand back the
// identical URI, the CSS vars land as no-ops, and nothing repaints. The
// emojis/confetti still meet a fresh crowd every LAUNCH (new process, new
// rolls) and whenever the theme's colors actually change (new key).
// ---------------------------------------------------------------------------
const TILE_CACHE = new Map();
const TILE_CACHE_MAX = 96;
const cacheKey = (patternId, colors, surface, swatch) =>
  `${patternId}|${JSON.stringify(colors)}|${surface}|${swatch ? 1 : 0}`;

// ---------------------------------------------------------------------------
// buildTexture — pattern id -> CSS background layer for one surface.
// `colors` = resolved theme colors (hex strings); `texTint`/`texAlpha` are
// optional per-theme overrides (e.g. Mumei's white dots); `surface` feeds
// the stable per-surface seed so two surfaces never show the same emoji
// arrangement; `swatch` boosts alpha so a 52px picker chip reads clearly.
// ---------------------------------------------------------------------------
export function buildTexture(patternId, colors, surface = 'workspace', swatch = false) {
  const key = cacheKey(patternId, colors, surface, swatch);
  const hit = TILE_CACHE.get(key);
  if (hit) return hit;

  const tint = colors.texTint || colors.chrome || '#cccccc';
  const tintRgb = hexToRgb(tint, [200, 200, 200]);
  // Base alpha: a per-theme override (e.g. Mumei's white dots at ~45%), or
  // the quiet default (chrome at 12%). Swatches need to READ at 46px: the
  // quiet default gets a x4.5 boost; tint themes already sit high, so they
  // only get x1.8 (a x4.5 there clamps to 1.0 and the swatch turns into a
  // solid slab that hides its own pattern). cSoft is the calmer sibling.
  const strongBase = colors.texTint ? (colors.texAlpha ?? 0.45) : 0.12;
  const boost = swatch ? (colors.texTint ? 1.8 : 4.5) : 1;
  const c = rgba(tintRgb, Math.min(1, strongBase * boost));
  const cSoft = rgba(tintRgb, Math.min(1, strongBase * 0.7 * boost));
  const seed = surfaceSeed(surface);

  let out;
  switch (patternId) {
    case 'none':
      out = { backgroundImage: 'none' };
      break;
    case 'dots':
      out = {
        backgroundImage: `radial-gradient(circle, ${c} 1px, transparent 1.5px)`,
        backgroundSize: '7px 7px',
      };
      break;
    // 0.15.0: 'halftone' REMOVED by request — it falls through to the
    // default case (no pattern). Old databases sanitize the id away.
    case 'grid':
      out = {
        backgroundImage: `linear-gradient(${cSoft} 1px, transparent 1px), linear-gradient(90deg, ${cSoft} 1px, transparent 1px)`,
        backgroundSize: '46px 46px, 46px 46px',
      };
      break;
    case 'graph':
      out = {
        backgroundImage: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px), linear-gradient(${cSoft} 1px, transparent 1px), linear-gradient(90deg, ${cSoft} 1px, transparent 1px)`,
        backgroundSize: '60px 60px, 60px 60px, 12px 12px, 12px 12px',
      };
      break;
    case 'lines':
      out = {
        backgroundImage: `repeating-linear-gradient(0deg, ${cSoft} 0 1px, transparent 1px 5px)`,
      };
      break;
    case 'hatch':
      out = {
        backgroundImage: `repeating-linear-gradient(45deg, ${cSoft} 0 1px, transparent 1px 8px)`,
      };
      break;
    case 'crosshatch':
      out = {
        backgroundImage: `repeating-linear-gradient(45deg, ${cSoft} 0 1px, transparent 1px 9px), repeating-linear-gradient(-45deg, ${cSoft} 0 1px, transparent 1px 9px)`,
      };
      break;
    // 0.26.0 — 'waves' REMOVED by request: it falls through to the default
    // case (no pattern). Old databases sanitize the id away.
    case 'plus':
      out = {
        backgroundImage: plusTile({ tile: 19, color: c, strokeW: 2 }),
        backgroundSize: '19px 19px',
      };
      break;
    case 'confetti':
      out = {
        backgroundImage: confettiScatter({ tile: 480, color: c, cSoft }),
        backgroundSize: '480px 480px',
      };
      break;
    // 0.34.0 — 'sparkles' (the retired emoji wall's replacement): a big
    // random scatter of four-point stars, re-rolled every app launch.
    // Old 'charms' / 'shuffle' / 'emojis' databases migrate onto it
    // (helpers renames the ids while sanitizing).
    case 'sparkles':
      out = {
        backgroundImage: sparkleTile({ tile: 240, color: c, cSoft }),
        backgroundSize: '240px 240px',
      };
      break;
    // 0.34.0 — 'emojis' is RETIRED with its font dependence: it falls
    // through to the default case (no pattern), and old databases are
    // renamed onto 'sparkles' while sanitizing.
    case 'chevron':
      out = {
        backgroundImage: chevronTile({ tile: 22, color: c, cSoft }),
        backgroundSize: '22px 13px',
      };
      break;
    // 0.19.0 — 'clouds' REMOVED with the cloud theme: it falls through to
    // the default case (no pattern). Old databases sanitize the id away.
    case 'xmark':
      out = {
        backgroundImage: xTile({ tile: 56, color: c, cSoft, seed }),
        backgroundSize: '56px 56px',
      };
      break;
    // 0.26.0 — 'bauhaus' REMOVED by request: it falls through to the
    // default case (no pattern). Old databases sanitize the id away.
    default:
      out = { backgroundImage: 'none' };
      break;
  }

  if (TILE_CACHE.size >= TILE_CACHE_MAX) TILE_CACHE.clear();
  TILE_CACHE.set(key, out);
  return out;
}

// 0.33.0 — THE EMOJI OPACITY LAW retired with the emoji wall itself
// (0.34.0): the sparkle marks carry their own per-star alpha inside the
// tile (0.55–1.0, with a few on the theme's soft tone), so the wall reads
// as depth without any special-cased law.

// Apply a built pattern (or 'none') as the three per-surface CSS variables.
export function applyTextureVars(root, surface, patternId, colors) {
  const p = patternId === 'none' || !patternId ? { backgroundImage: 'none' } : buildTexture(patternId, colors, surface);
  const s = surface.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
  root.style.setProperty(`--gd-tex-${s}`, p.backgroundImage || 'none');
  root.style.setProperty(`--gd-tex-${s}-size`, p.backgroundSize || 'auto');
  root.style.setProperty(`--gd-tex-${s}-pos`, p.backgroundPosition || '0 0');
  root.style.setProperty(`--gd-tex-${s}-repeat`, 'repeat');
}
