import { useId } from 'react';
import clsx from 'clsx';
import { RichText } from './RichText.jsx';
import { ChipGlyph } from './LucideIconPicker.jsx';
// 1.4.4 — isCardFinish / migrateCardFinish left this import list with the
// ribbon's own finish coat (the tag manager's ladder retired below); the
// card coats sanitize at their own seats.
import { effectiveCrop, isExtremePlateHex, readableInk, stripRichText, counterRimFor } from '../utils/helpers.js';
// 1.9.5 — THE COAT'S OWN VOLUME: the default knob the slider speaks (see
// DEFAULT_FINISH_TRANSPARENCY in constants — the 1.9.4 coat read "a bit
// too clear", so the default carries 15% transparency).
import { DEFAULT_FINISH_TRANSPARENCY } from '../constants/index.js';

// Base ribbon dimensions; the tag slider scales all three together.
// 0.28.0 — SLIGHTLY THICKER ("tags container should be slightly thicker
// vertically so it doesnt thin out too fast not containing the text"): the
// base height rises 30 -> 34 and the glyph 11 -> 12, so ribbons at small
// tag sizes still comfortably carry their icon / letter instead of
// thinning into a sliver the mark spills out of.
const BASE = { w: 19, h: 34, icon: 12 };

// 0.47.0 — THE RIBBON IS AN SVG SHAPE NOW. The old construction (an ink body
// clipped by clip-path + a color face inset 1px with the SAME clip) could
// never outline the CUT trims honestly: a box inset is not a parallel offset
// of the polygon, so the outline pinched to ~0 at the V-cut's tip and around
// the notch's inner vertex ("ensure its fully outlined including cut areas
// like the inward cut and the triangle cut"). A stroked SVG shape outlines
// EVERY edge — straight sides, the V-cut's diagonals, the notch's inward
// vertex — at one even width, with rounded joins softening the points.
// The face also stopped being FLAT ("dont make it too flat"): the fill is a
// vertical gradient — a light kiss at the top, the tag's own color through
// the middle, a darker fold at the bottom — so the ribbon reads as a folded
// strip of material instead of a painted rectangle.
const OUTLINE_W = 1.5; // the stroke's width (px, pre-scale)
const OUTLINE_C = 'rgba(0, 0, 0, 0.78)'; // the ink rim, readable under any face

// channel math for the gradient stops (hex in, hex out).
const mixHex = (hex, target, amt) => {
  let h = String(hex || '#888888').replace('#', '');
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split('').map((c) => c + c).join(''); // #f0f -> #ff00ff
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return hex;
  const t = target === 'white' ? 255 : 0;
  const ch = (i) => Math.round(parseInt(h.slice(i, i + 2), 16) * (1 - amt) + t * amt);
  const part = (n) => String(n.toString(16).padStart(2, '0'));
  return `#${part(ch(0))}${part(ch(2))}${part(ch(4))}`;
};

// Ribbons sit ON TOP of the card's image (0.8.0 'corner' mode) — pinned like
// bookmark tabs overlapping the card's top-left corner, never on a row of
// their own above the card. The inset grows just slightly with the ribbon
// scale so bigger ribbons stay comfortably inside the art.
export const RIBBON_INSET = 5;

// The ribbon's painted size at a scale — shared with GridView so the
// separation clamp can measure the row it is about to lay out.
export const ribbonSize = (scale) => {
  const s = Math.max(0.4, Number(scale) || 1);
  return { w: Math.round(BASE.w * s), h: Math.round(BASE.h * s) };
};

// 0.11.0 MIRROR — how far a MARK-mode ribbon's head pokes ABOVE the card's
// top edge. Fixed regardless of tag size: the top side is the LEAST poking
// side, exactly as requested — resizing a mark grows it DOWN the card art,
// never higher.
const MARK_POKE = 5;

// Top offset (px) of the ribbon row, relative to the card's top edge.
//   'corner' (positive) — inside the card art, a little past the edge
//   'mark'    (negative) — the mark hangs INTO the card from the top edge
//                          like a bookmark slipped in: a small head pokes
//                          above (MARK_POKE), the body extends down the art.
//                          The grip is pinned AT the top — raising the tag
//                          zoom grows the mark downward only.
export const ribbonTopOffset = (scale, position = 'corner') => {
  if (position === 'mark') return -MARK_POKE;
  const s = Math.max(0.4, Number(scale) || 1);
  return Math.round(RIBBON_INSET + 2 * (s - 1));
};

// How much head room a MARK-mode grid needs above its top padding: the small
// head above the edge plus a hair. Independent of the tag size and the card
// height — the growth is all downward now.
export const markRibbonHeadRoom = () => MARK_POKE + 4;

// A single tag ribbon as it hangs off a card top (or previewed in the tag
// manager). One SVG: the stroked+gradient shape (outline follows every cut),
// with the icon glyph riding above it. Icon can be a lucide glyph or a plain
// letter.
// 1.4.3 — the ribbon carried its own FINISH coat (the tag manager's FINISH
// ladder under the icon picker), clipped to the shape, glyph untouched.
// 1.4.4 — THE RIBBON'S FINISH IS RETIRED WITH THE MANAGER'S LADDER ("remove
// finishes from the tag manager, remove the finishes feature entirely from
// tag manager only"): a tag is color + trim + icon + name again — no coat,
// no clip, no phase. The CARDS' finishes are untouched.
export default function TagRibbon({ tag, scale = 1, className, style }) {
  const gradId = useId();
  if (!tag) return null;
  const s = Math.max(0.4, Number(scale) || 1);
  const w = Math.round(BASE.w * s);
  const h = Math.round(BASE.h * s);
  // 1.0.8 — THE FAMILY GROWS ("end trims for the tags, add 2 more"): point
  // (square body ending in a triangle at the bottom) and bead (thin stem
  // ending in a circle that carries the icon) join straight / v / notch.
  // Unknown values still resolve to straight, exactly as before.
  const KNOWN_TRIMS = ['straight', 'v', 'notch', 'point', 'bead'];
  const trim = KNOWN_TRIMS.includes(tag.trim) ? tag.trim : 'straight';
  const color = tag.color || '#888888';

  // 1.0.1 — THE OPPOSITE RIM ("the tags icon should have a thin outline of
  // opposite color so its better viewed"): the glyph's ink is picked by the
  // tag color's luminance, but the FACE it rides is a gradient — a light
  // kiss at the top, the color through the middle, a darker fold at the
  // bottom — so a light glyph can wash out against the lightened top and a
  // dark one against the fold. The rim is the ink's OPPOSITE: wherever the
  // face agrees with the ink (and the glyph would blend), the rim disagrees
  // and holds the silhouette; wherever the face already contrasts, the rim
  // is the same family as the face and reads as a soft kiss. The filter
  // chain that paints it lives in .gd-ribbon-glyph (index.css).
  const ink = readableInk(color);
  const rim = ink === '#f7f1e4' ? 'rgba(23, 19, 12, 0.62)' : 'rgba(247, 241, 228, 0.66)';

  // The shape's outline path, in the ribbon's own pixel space. The stroke is
  // drawn ON the path (half in, half out) so the paint stays inside the box.
  const r = Math.max(2, Math.round(3 * s)); // straight trim's bottom curl
  const notchY = Math.round(h * 0.66);
  // 1.0.8 — THE BEAD'S GEOMETRY: a thin centered stem flowing into a
  // full-width circle at the bottom. beadR fits the circle inside the
  // ribbon's width (stroke-safe), beadCy seats it on the foot, stripHW is
  // the stem's half-width (thin enough to read as a stem, wide enough to
  // stroke at small scales), and meetY is where the stem's edge meets the
  // circle — the silhouette runs down the stem, arcs the long way around
  // the circle, and back up the other side.
  // 1.0.9 — THE SWEEP FLAG WAS BACKWARDS ("the bead is wrong, the circle is
  // on top and is cut through the middle by a rectangle"): the arc read
  // `A r r 0 1 1` — large-arc + sweep=1 — which picks the circle whose
  // center sits ABOVE the meet-chord, so the bead rendered at the ribbon's
  // TOP with the stem punching straight through its middle (and the glyph,
  // seated for a bottom circle, floated in the empty space under the
  // mess). The same endpoints with sweep=0 pick the center BELOW the
  // chord: the arc travels the long way around the BOTTOM (through the
  // foot at h - OUTLINE_W/2), the stem flows into the circle's shoulders,
  // and the silhouette reads as one shape. The flag flip is the entire
  // fix — the geometry numbers were always right.
  const cx = w / 2;
  const beadR = Math.max(2.5, (w - OUTLINE_W) / 2);
  const beadCy = h - beadR - OUTLINE_W / 2;
  const stripHW = Math.max(1.5, Math.round(w * 0.27 * 100) / 100);
  const meetY = beadCy - Math.sqrt(Math.max(0, beadR * beadR - stripHW * stripHW));
  const shape =
    trim === 'v'
      ? `M ${OUTLINE_W / 2} ${OUTLINE_W / 2} L ${w - OUTLINE_W / 2} ${OUTLINE_W / 2} L ${w / 2} ${h - OUTLINE_W / 2} Z`
      : trim === 'notch'
        ? `M ${OUTLINE_W / 2} ${OUTLINE_W / 2} L ${w - OUTLINE_W / 2} ${OUTLINE_W / 2} L ${w - OUTLINE_W / 2} ${h - OUTLINE_W / 2} L ${w / 2} ${notchY} L ${OUTLINE_W / 2} ${h - OUTLINE_W / 2} Z`
        : trim === 'point'
          ? // 1.0.8 — square body, pointed foot: full width down to the
            // notch line, then both sides converge to the bottom-center
            // point (the same 0.66 cut the notch family speaks).
            `M ${OUTLINE_W / 2} ${OUTLINE_W / 2} L ${w - OUTLINE_W / 2} ${OUTLINE_W / 2} L ${w - OUTLINE_W / 2} ${notchY} L ${w / 2} ${h - OUTLINE_W / 2} L ${OUTLINE_W / 2} ${notchY} Z`
          : trim === 'bead'
            ? // 1.0.9 — sweep 0 (see the geometry note above): the long
              // arc around the BOTTOM circle, not the top one.
              `M ${cx - stripHW} ${OUTLINE_W / 2} L ${cx - stripHW} ${meetY} A ${beadR} ${beadR} 0 1 0 ${cx + stripHW} ${meetY} L ${cx + stripHW} ${OUTLINE_W / 2} Z`
            : // straight: square top, curled bottom corners (the bookmark foot)
              `M ${OUTLINE_W / 2} ${OUTLINE_W / 2} L ${w - OUTLINE_W / 2} ${OUTLINE_W / 2} L ${w - OUTLINE_W / 2} ${h - r} Q ${w - OUTLINE_W / 2} ${h - OUTLINE_W / 2} ${w - r} ${h - OUTLINE_W / 2} L ${r} ${h - OUTLINE_W / 2} Q ${OUTLINE_W / 2} ${h - OUTLINE_W / 2} ${OUTLINE_W / 2} ${h - r} Z`;

  // 1.0.8 — THE GLYPH'S SEAT: the default rides near the ribbon's top; the
  // BEAD's glyph rides INSIDE the circle at the foot ("the other should be
  // thin but then be a circle at the bottom with the icon inside of it") —
  // vertically centered on the bead's own center, so the icon IS the bead.
  // 1.0.9 — TWO SEATS TIGHTENED ("the point tag emojie is slightly
  // offsetted"): the bead's glyph keeps its FRACTIONAL seat (no Math.round
  // — the rounding leaned the icon half a pixel off the circle's center at
  // every odd scale), and the POINT's glyph now sits at the vertical CENTER
  // of the trim's square body (top edge to the notch line) instead of
  // hugging the very top — the converging foot pulls the shape's visual
  // mass upward, and a top-hugging icon read a touch high against it.
  // Every other trim keeps its established top seat.
  /* 1.9.6 — THE EMBLEM'S OWN FIT ("emotes clip outside of the tag
     containers on the card, fix that so they dont (especially on special
     shaped ones like bead and v)"): the glyph used to paint at ONE fixed
     size (12 × scale) no matter which shape carried it — full-width
     bodies swallowed it fine, but the V's converging sides and the bead's
     round heart are NARROWER than the glyph's own box at almost every
     scale, so the emblem's corners rode past the outline (measured at
     scale 1: a 12px glyph's bottom corners sat ~1.5px past the V's sides;
     the bead's corners poked past its circle at every scale below 1.1,
     rim and all). Every trim now derives the LARGEST emblem its own
     geometry honestly holds — the V's inscribed box against its sloped
     sides (solved exactly at the glyph's own bottom edge, stroke + rim
     margin paid), the bead's inscribed square inside the circle, the
     full-width bodies their straight inner width — and the seat centers
     the fitted mark the way each family always spoke it (the V's mark
     rides its wide shoulders, the bead's IS the bead, the point stays
     centered in its square body). No emblem escapes its container at any
     scale; the rim that traces it stays inside the stroke's own reach. */
  const glyphFit = (() => {
    const m = OUTLINE_W / 2 + 0.9; // the stroke's half + the rim's reach
    const base = Math.round(BASE.icon * s);
    if (trim === 'v') {
      const a = OUTLINE_W / 2;
      const slope = (cx - a) / Math.max(1, h - OUTLINE_W); // the side's x per y
      const t = Math.max(2, Math.round((OUTLINE_W / 2 + 1) * s));
      const g = Math.floor((2 * (cx - a - m) - 2 * slope * (t - a)) / (1 + 2 * slope));
      return { size: Math.max(4, Math.min(base, g)), top: t };
    }
    if (trim === 'bead') {
      /* 1.9.6 — the bead's honest square pays the RIM'S OWN REACH too: the
         strict inscribed square (x √2) seats the emblem's corners exactly
         on the circle's stroke, and the opposite rim that traces the mark
         poked its last hair past the bead at the bigger scales (measured
         live in the render probe — the report's clipping, one hair
         shallower). × 1.3 keeps the star's points and their fence a full
         breath inside the circle at every scale. */
      const g = Math.floor((beadR - m) * 1.3); // the circle's honest square, rim paid
      const size = Math.max(4, Math.min(base, g));
      return { size, top: Math.max(2, beadCy - size / 2) }; // the 1.0.9 fractional seat
    }
    const g = Math.floor(w - 2 * (OUTLINE_W / 2 + m)); // straight / notch / point bodies
    const size = Math.max(4, Math.min(base, g));
    const top =
      trim === 'point'
        ? Math.max(2, (OUTLINE_W / 2 + notchY - size) / 2)
        : Math.max(2, Math.round(4 * s));
    return { size, top };
  })();
  const glyphSize = glyphFit.size;
  const glyphTop = glyphFit.top;

  return (
    <span
      className={clsx('gd-ribbon-shadow', className)}
      style={{ width: w, height: h, ...style }}
      title={stripRichText(tag.name)}
      /* 1.0.8 — a NAME-LABEL tooltip: the pill clamps at two lines. */
      data-gd-tip-name="1"
    >
      <svg
        className="gd-ribbon-shape"
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        aria-hidden
        focusable="false"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mixHex(color, 'white', 0.22)} />
            <stop offset="0.42" stopColor={color} />
            <stop offset="1" stopColor={mixHex(color, 'black', 0.24)} />
          </linearGradient>
        </defs>
        <path
          d={shape}
          fill={`url(#${gradId})`}
          stroke={OUTLINE_C}
          strokeWidth={OUTLINE_W}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      {tag.icon ? (
        <span
          className="gd-ribbon-glyph"
          style={{
            top: glyphTop,
            color: ink,
            // 1.0.1 — the opposite rim the filter chain paints with.
            '--gd-glyph-rim': rim,
            /* 1.9.6 — THE POLISHED EMBLEM ("improve their apperance so they
               dont look too plain"): the mark's own size rides as a var so
               the halo seat below (.gd-ribbon-glyph::before in index.css)
               can speak its soft luminous plate at the emblem's exact
               measure — the emblem reads as raised, lit enamel on the
               folded ribbon, never a flat stencil. */
            '--gd-glyph-size': `${glyphSize}px`,
            lineHeight: 0,
          }}
        >
          <ChipGlyph name={tag.icon} size={glyphSize} />
        </span>
      ) : null}
    </span>
  );
}

// 0.48.0 — cropPosition RETIRED with the cover-channel itself: the card
// renderers now paint the crop through cropFrame()'s exact geometry (see
// below) because object-position could only PAN the cover-scaled picture —
// never scale it — so a zoomed crop (any w/h different from the cover fit)
// painted as nothing: a centered zoom left the position at 50% 50% (cancelled
// exactly), an off-center one nudged the pan a hair. That was the whole
// "zoom buttons do nothing" bug: the math was right, the channel was wrong.

// 0.48.0 — THE EXACT CROP FRAME ("zoom out, zoom in and reset buttons on the
// card preview inside the card creation window isnt working"): the card art
// rendered through object-fit: cover + object-position — a PAN-ONLY channel.
// object-position slides the cover-scaled picture; it can never SCALE it, so
// every zoom (a crop w/h different from the cover fit) was computed, clamped,
// saved... and painted as NOTHING: a centered zoom left object-position at
// 50% 50% (cancelled exactly), an off-center one nudged the pan a hair — the
// buttons looked dead because their math never reached the pixels. The frame
// renders the crop rect LITERALLY: the image is sized so the crop fills the
// box (width 100/w % of the box's width, height 100/h % of its height) and
// seated so the crop's top-left corner sits at the box's corner
// (left -x/w · 100 %, top -y/h · 100 %). The crop is aspect-locked to the
// card's ratio, so the rendered box always carries the image's natural
// aspect — pan AND zoom, exact, at any scale. Percentages resolve against the
// CLIP parent (position: relative / absolute + overflow hidden), which every
// card art box already is. maxWidth/maxHeight are reset because Tailwind's
// preflight caps images at 100%.
export function cropFrame(crop) {
  if (!crop || !(crop.w > 0) || !(crop.h > 0)) return null;
  const f = (v) => `${+(v * 100).toFixed(4)}%`;
  return {
    position: 'absolute',
    /* 1.4.5 — THE HAIR OVERDRAW (the white-line report: "the white
       line/border around the image thumbnail seems to only appear when the
       squish/stretch animation of card clicking"): percentage geometry at
       fractional card widths ROUNDS — a 185.6px box against a
       185.33% art width can leave a half-pixel column of the seat's paper
       at an edge, and the squish's non-uniform re-raster made exactly
       those hairlines read as a white border around the thumbnail. The
       frame now overdraws its own box by 1px on each axis (and seats
       itself 0.5px into the negative) — a sub-pixel crop shift no eye can
       catch, and the art's edge owns every pixel the rounding can expose.
       The seat's own paper went to the ink-over-BG shadow mix in the same
       breath (see the callers), so even a surviving sliver reads as the
       card's shadow, never as a white line. */
    width: `calc(${f(1 / crop.w)} + 1px)`,
    height: `calc(${f(1 / crop.h)} + 1px)`,
    left: `calc(${f(-crop.x / crop.w)} - 0.5px)`,
    top: `calc(${f(-crop.y / crop.h)} - 0.5px)`,
    maxWidth: 'none',
    maxHeight: 'none',
  };
}

// Trim -> CSS. Overlay trims render as a span inside the image box.
// 1.1.6 — THE WRAP CHANNEL IS RETIRED ("remove deprecated code"): the old
// wrapper-clip trims (the 'cuts' clip-path) left with the crop rework —
// TRIM_WRAP has been an empty map returning null to every caller for
// years. trimClasses now speaks the overlay class alone, and every caller
// drops its dead `wrap` destructure.
export function trimClasses(trim) {
  const t = String(trim || 'dash');
  return {
    overlay: t === 'none' ? null : `gd-trim-${t}`,
  };
}

// The trim overlay itself.
// 1.3.8 — THE SEAMLESS SEAT ("keep it but i want it hidden so it doesnt
// affect the card color when its dark or light colores"): `seamless`
// arms the .is-seamless class — the LINE-family trims' seam-side rule
// goes transparent on extreme plates (see .gd-trim-*.is-seamless in
// index.css). The overlay itself is untouched: one class flip restores
// the rule, mid-tone plates keep the full frame.
// 1.6.2 — THE TRIM'S OWN COLOR ("add color options to the trims (overwrites
//   the gold trim color too)"): `color` carries the card's saved trim ink
//   (cardTrimColor — null means the theme's own, exactly as it always
//   painted). A real hex writes --trim-user + arms .is-user, and the whole
//   trim family re-inks itself through the CSS laws (each family's own
//   is-user seat in index.css): the line trims and the vine through the
//   --trim-c ladder, the gold through its --gld-* palette, the scallop,
//   the beads and the rivet through their private ladders. Every surface
//   that renders a trim threads the same prop — the grid card, both look
//   windows' previews — so what you frame is exactly what ships.
export function TrimOverlay({ trim, seamless = false, color = null }) {
  const { overlay } = trimClasses(trim);
  if (!overlay) return null;
  const userInk = typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color) ? color : null;
  return (
    <span
      className={clsx('gd-trim', overlay, seamless && 'is-seamless', userInk && 'is-user')}
      style={userInk ? { ['--trim-user']: userInk } : undefined}
      aria-hidden
    />
  );
}

// 1.7.4 — THE FINISH'S OWN VOICES (two maps, one law on every card surface):
// · FINISH_TRIM_INK — RETIRED IN 1.7.5 (see trimCoatInk + TrimCoatLayer
//   below): the per-material signature inks (auric's honey gold, foil's
//   violet metal, …) re-inked the trim's clone with the FINISH'S voice,
//   and the trim color the user actually PICKED went mute under it — the
//   map left with the coat's own ink law; the coat walks the TRIM'S
//   ladder now (picked ink -> gold's own default -> the card's color ->
//   the theme's ink), and no material speaks for the trim's line again.
// · FINISH_GROUND — the plate the finish paints when the card speaks NO
//   color of its own ("finishes should affect cards even if the cards are
//   on default theme color"): the washes are blend-mode shaders, and a
//   soft-light veil over the theme's mid-gray panel is a near no-op — the
//   coat only ever visibly transformed custom-colored cards. An uncolored
//   card wearing a finish now speaks the finish's OWN ground exactly as it
//   would a picked cardColor (the foot plate, the card's paper, the tint
//   the nuri lean reads), and the materials have a receptive plate under
//   them on every card, themed or not.
//   1.9.2 — THE GROUND LISTENS TO THE CLOTH ("when applying finishes to
//   colorless cards (aka cards defaulted to theme color) it should react
//   to the theme color itself, since for some reason in finishes such as
//   numeix finish would make it inverted or not react to the color
//   correctly"): the 1.7.4 grounds were FIXED HEXES — numeix's parchment
//   #e9dec4 among them — so an uncolored card wearing a coat spoke the
//   COAT's own plate no matter what cloth the app wore: a bright paper
//   card planted in a dark theme read as INVERTED, and a manual panel
//   color never moved it ("not react to the color correctly"). The fixed
//   plates retire: every ground is now a COLOR-MIX over var(--gd-panel)
//   itself — the theme's own cloth carrying the material's hue lean
//   (numeix's warm parchment, foil's violet metal, …), mixed at a light
//   hand for the pale materials and a heavier one for the deep ones. The
//   ground follows the theme's own LIGHTNESS direction (a dark theme
//   paints a dark warm paper, a light theme a light one — never an
//   inversion again), and because the mix reads the live CSS var it
//   answers a theme switch AND a Manual Colors drag in the same frame,
//   with no re-render owed. The ink seats that used to derive their text
//   from the ground's hex (readableInk on a mix speaks nothing) now fall
//   to the theme's own tokens — the plate text speaks var(--gd-panel-text),
//   the rim var(--gd-text-counter) — the same voice an uncolored card
//   without a coat always spoke, and honest on any cloth because the
//   ground IS 60-70% that cloth. The nuri lean and the foot plate's corner
//   rise read the mix as their var values exactly as they read a hex:
//   --gd-card-tint and --gd-foot-plate are consumed inside color-mix
//   expressions in index.css, and a nested mix is a legal color (Electron
//   42's Chromium has spoken it for years). A picked cardColor keeps every
//   word it always spoke — the ground only ever arrives when the card
//   itself is colorless.
export const FINISH_GROUND = {
  numeix: 'color-mix(in srgb, var(--gd-panel) 72%, #a5814f 28%)',
  foil: 'color-mix(in srgb, var(--gd-panel) 74%, #8d7fb8 26%)',
  auric: 'color-mix(in srgb, var(--gd-panel) 70%, #c08a3a 30%)',
  holographic: 'color-mix(in srgb, var(--gd-panel) 64%, #4a3d75 36%)',
  prismatic: 'color-mix(in srgb, var(--gd-panel) 64%, #5e3a5c 36%)',
  nuri: 'color-mix(in srgb, var(--gd-panel) 64%, #6e3220 36%)',
};

// 1.9.3 — THE EXTREME GROUNDS ("in some color values especially when i
// lean towards black or white or high saturation, the finishes would
// dissapear or would be covered, fix that so they still are visible"):
// the coat's washes are BLEND-MODE shaders, and every blend family has a
// ground it cannot speak on — screen light vanishes into a near-white
// plate (screen(anything, white) is white), soft-light veils sink into a
// near-black one (soft-light never lifts a black backdrop), and a highly
// saturated plate's own voice swallows a soft-light wash whole ("covered
// by the card color"). The picked cardColor is a HEX in the hand's own
// language, so the seats can CLASS the ground before the coat ever
// paints: near-white speaks gd-fin-ground-light (the luminous screen
// seats turn to multiply tints — light ON white reads as color), a
// near-black ground speaks gd-fin-ground-dark (the soft-light bodies
// turn to screen — the veil GLOWS instead of sinking), and a vivid
// ground speaks gd-fin-ground-vivid (the bodies turn to overlay — the
// plate's saturation amplifies the wash's anchors instead of covering
// them). See the blend laws at .gd-fin-ground-* in index.css: the class
// rides the card root (the same element that writes --gd-card-tint), a
// colorless card carries none (the theme's grounds are mid-toned by
// design — the 1.9.2 cloth law already answers for them), and a picked
// color in the honest middle speaks no class at all: the classic seats,
// exactly as they always spoke.
// 1.9.5 — THE COAT'S OWN VOLUME: the transparency the windows pick (0 =
// the full coat, 1 = clear glass) becomes the CSS strength the coat
// seats read (--gd-fin-strength — 1 paints the full material). One
// subtraction, rounded to three decimals so a slider's floating steps
// (0.30000000000000004) never reach the sheet. Every card surface writes
// it beside --gd-card-tint: the grid card, the look editor's panzoom,
// the compact preview — one voice, what you slide is what you get.
export function finishStrength(transparency) {
  const t = Number.isFinite(+transparency)
    ? Math.min(1, Math.max(0, +transparency))
    : DEFAULT_FINISH_TRANSPARENCY;
  return Number((1 - t).toFixed(3));
}

/* 1.9.9 — THE LEAN ("when i have the card color a very light value it
   makes the finish effects bright as it is, fix that so it doesnt
   normally, im not sure how but when the card is light orange the finish
   effects should be orange etc.. like before, the color influinces the
   hue is all and not brightness or shit, since i feel like the finish
   effects became too pale compared to before, fix that ... i want it to
   only be affected by the hue and saturation, not by brightness, if you
   need to rework how the finishes get affected by colors go for it as
   long as it matches previously and works properly"): three releases of
   twin-and-seam surgery (1.9.6's ink twin, 1.9.7's luminance rail,
   1.9.8's quiet seam) all shared one disease the note finally names —
   every one of them DERIVED THE COAT'S COLOR FROM THE PLATE'S OWN
   BRIGHTNESS. The twin solved its lightness against the plate's luma
   (0.35 + 0.3·lum on bright plates, lum + 0.16 on dark ones), so a very
   light card spoke a ~0.6-luma ink: the washes mixed toward it arrived
   PALE ("the finish effects became too pale compared to before"), and
   the pale band's plates (#bbbbbb, #e7c35b — both luma 0.73-0.77) sat
   exactly where the twin's floor thinned the coat to a whisper while
   the 0.78 rail still withheld the bright subclass's louder voices —
   "the finish background etc vanishes in some finishes such as foil".
   THE REWORK the note authorizes: the coat's color word is BRIGHTNESS-
   BLIND, whole and simple —
   · THE CARD'S HUE and HSL SATURATION pass into the lean bit for bit
     and whole ("only be affected by the hue and saturation");
   · THE BRIGHTNESS NEVER ENTERS: the lean's own lightness is a FIXED
     property of the derivation, not an input — every card of the same
     hue and saturation speaks the SAME lean, from the pure hue through
     the pastel band to the bright edge (dragging the value axis moves
     the PLATE alone; the coat keeps its color end to end, the character
     continuity the seam surgery kept chasing, had by construction);
   · THE FIXED SEAT IS PERCEPTUAL LUMA 0.45 — the register the classic
     coat always spoke ("matches previously": a mid-card's own raw tint
     sits there already, so the classic mid-card look is reproduced
     exactly), solved by the same 24-step bisection the twin owned
     (luma is strictly monotone in lightness for a fixed hue and
     saturation — unique by construction). The high-luminance hues the
     corner audit kept having to cure land there automatically: a
     #ffd400 card leans a deep gold (the 1.9.7 yellow cure's own seat,
     now by law instead of by patch), a light orange card leans a clear
     orange ("the finish effects should be orange"), a gray card leans
     the honest #737373 (saturation 0: the bisection answers a gray
     with no hue to speak, and the anchors' own character keeps every
     family visible through it).
   One law, one derivation, no seam anywhere in the ink — the ground
   classes below keep their own word (they class the PLATE for the
   blend families alone: multiply voices on bright plates, screen
   voices on dark ones), and the twin's rail-and-seam machinery
   retires with the disease it carried. Returns '' for a colorless
   card (the theme's mid-toned grounds never class an extreme). */
/* 1.9.10 — THE LEAN SPEAKS FOR THE X SIGNATURE ALONE ("except the
   "x"s in numeix theme, i want them the same still alongside the
   transparency sliders options"): THE CLASSIC COAT RETURNS this release
   — every coat layer but the numeix X marks went back to its classic
   1.9.2 fixed colors verbatim (see index.css), so this derivation's
   only reader is the X looms' tint hand. The function itself keeps its
   1.9.9 law whole and unchanged: hue + saturation in, the fixed luma
   seats out, the card's brightness never entering — the X's carve-out,
   byte for byte. */
export function finishTintLean(cardColor, seat) {
  if (typeof cardColor !== 'string') return '';
  const m = /^#([0-9a-fA-F]{6})$/.test(cardColor.trim()) ? cardColor.trim() : null;
  if (!m) return '';
  const n = parseInt(m.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  // HSL hue + saturation — the card's own hue bit for bit and its
  // saturation whole; the brightness (mx, mn's midpoint) is read here
  // only to SPEAK the saturation, never to seat the lean's own light.
  const d = mx - mn;
  let h = 0;
  if (d !== 0) {
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (mx === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  const l = (mx + mn) / 2;
  const satHsl = d === 0 ? 0 : l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  /* the fixed seats: perceptual LUMA 0.45 by default — the classic
     coat's own register over the plate (see the law note above). The
     dark ground's screen family asks for the GLOW seat instead (0.78:
     an ink that carries its own light — the seat the lift twin always
     spoke, now fixed and brightness-blind like the base lean, never
     solved against the plate). The ART half asks for the ART seat
     (0.75: the light register the classic picture-coat's own anchors
     always spoke — the creams, the honeys, the whites the artfin seats
     blend through soft-light and screen; a 0.45-seat lean over the
     picture measured a VEIL, the 1.9.8 disease returned — the picture
     keeps its eye at the art seat while the hue and saturation still
     pass whole). Achromatic inputs need no special case — saturation 0
     makes the bisection's answer the honest gray for every seat
     (#737373 base, #c7c7c7 glow, #bfbfbf art), with no threshold to
     loop past. */
  const LEAN_LUMA = Number.isFinite(+seat) ? Math.min(0.9, Math.max(0.1, +seat)) : 0.45;
  const hslToRgb = (hh, ss, ll) => {
    if (ss === 0) return [ll, ll, ll];
    const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
    const p = 2 * ll - q;
    const hue = (tt) => {
      let t = tt;
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    return [hue(hh + 1 / 3), hue(hh), hue(hh - 1 / 3)];
  };
  // the lightness that lands the lean's own luma on the fixed seat —
  // for a fixed hue and saturation the luma is strictly monotone in
  // lightness, so a bisection solves it uniquely (24 steps: finer than
  // any color step the wheel can speak)
  const lumaAt = (ll) => {
    const [rr, gg, bb] = hslToRgb(h, satHsl, ll);
    return 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
  };
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    if (lumaAt(mid) < LEAN_LUMA) lo = mid;
    else hi = mid;
  }
  const leanL = (lo + hi) / 2;
  const [lr, lg, lb] = hslToRgb(h, satHsl, leanL);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  const hx = (v) => ch(v).toString(16).padStart(2, '0');
  return `#${hx(lr)}${hx(lg)}${hx(lb)}`;
}

/* 1.9.10 — THE GROUNDS CLASS THE X ALONE ("try to revert the coloring
   and so on to that version, and then fix from it so its stable"): the
   classes this returns no longer flip any BLEND anywhere — the whole
   1.9.3-1.9.9 flip/lift/facet stack retired with the classic coat (the
   card root keeps carrying the class, and exactly two CSS rules read
   it: the X signature's dark-ground GLOW ink seat and its light-ground
   depth filter — the owner's carve-out kept as 1.9.9 spoke it). The
   rails below keep their measured seats for that one reader. */
export function finishGroundTone(cardColor) {
  if (typeof cardColor !== 'string') return '';
  const m = /^#([0-9a-fA-F]{6})$/.test(cardColor.trim()) ? cardColor.trim() : null;
  if (!m) return '';
  const n = parseInt(m.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  // the simple relative-luminance rail (the readableInk family's own
  // yardstick) + the HSV-style saturation the vivid law reads
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  /* 1.9.7 — THE GROUNDS FOLLOW THE TWIN'S OWN SEAM + 1.9.8 — THE QUIET
     SEAM ("the finishes have the same issue but now its in middle way,
     aka the center top of the color picker it would get inverted, it
     relates to the background of the finish dissapearing then i
     assume"). 1.9.9 — THE LEAN KEEPS THE SEAT ("i want it to only be
     affected by the hue and saturation, not by brightness"): the seam
     no longer flips any ink — the lean is brightness-blind and lands
     the same 0.45-luma color on both sides — so the classes speak for
     the BLEND FAMILIES alone (multiply voices on bright plates, screen
     voices on dark ones), and the 0.70/0.78 rails keep their measured
     seats: the 1.9.6 classes left the widest band the wheel owns
     CLASSLESS (every plate between the 0.19 and 0.78 rails) — and in
     that band the soft-light bodies whispered no matter what ink they
     carried (soft-light on a mid plate speaks a fraction of a percent),
     while the suggestion palette's own mid-bright patients (a mist, an
     apple, a slate, a tangerine) measured whole families at mag 2.4-5.6.
     The 1.9.7 answer flipped the whole coat at luminance 0.5 — and the
     wheel seated that line EXACTLY at the center-top pastel band for
     the blue and purple hues the owner drags (a #8080ff plate measures
     0.536): the coat's polarity inverted mid-drag (foil +0.15 glow one
     step, -0.10 ink the next; the report's "it would get inverted"),
     and the broad washes the flip retired read as "the background of
     the finish dissapearing". The classes now flip at the TWIN'S OWN
     QUIET SEAM — luminance 0.70, the exact line the ink's derivation
     flips at (one law, one line, no band the coat's words can disagree
     in), chosen where the glow's own reach has already whispered under
     5% so the hand-off never inverts a voice that was still singing:
     · lum >= 0.70 speaks gd-fin-ground-light (the multiply coats — the
       lean's mid-luma inks × multiply read on every bright plate), and
       the plates past the old 0.78 rail additionally carry
       gd-fin-ground-bright, where the white-ink seats' FIXED GRAY
       facet owns its contrast (a 0.55 gray only reads against a
       genuinely bright plate — on a 0.7 plate the natives answer
       better: the overlay stars whiten, the screen ripples lift);
     · lum < 0.70 speaks gd-fin-ground-dark (the screen family — the
       lean's inks already carry their own light, and screen is
       the one blend that cannot identity on the wheel's fully
       saturated lower corners: pure red, green and magenta lived
       where overlay spoke nothing at all) — the whole pastel band
       INCLUDED: the glow the pure hue wore survives the drag toward
       white until the bright edge takes the hand.
     The classless middle keeps its seat for the THEME's colorless cards
     alone — their grounds are mid-toned by design and their natives
     were always measured good. The pure hues keep their 1.9.7 measured
     seats (pure green 0.7152 classes light exactly as it did; cyan
     0.7874 keeps the bright subclass; the yellow cure's #ffd400 at
     0.807 never moves). */
  if (lum >= 0.7) return lum >= 0.78 ? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';
  return 'gd-fin-ground-dark';
}

// 1.7.4 — THE TRIM'S OWN SHAPE ("the trim effect isnt perfect on the trims,
// it just does an area, i want it to fit the trim perfectly so if it has
// gabs it wont effect the gabs"): the trim effect used to speak a
// SYNTHETIC ring — a 9px mask band around the sleeve plus a fat approximation
// of the corner arcs — a rectangle that owed nothing to the trim's actual
// geometry, painting the finish across the dash's gaps, the scallop's
// cutouts and every breath of daylight the family deliberately leaves. The
// coat's TRIM voice is the trim ITSELF now: a CLONE of the card's own trim
// overlay rides one rung above the real trim's ink, re-inked through the
// picker's own is-user laws (--trim-user carries the finish's signature
// ink, so every private family ladder — the gold's three inks, the
// scallop's, the beads', the rivet's — re-derives its shading from the
// finish exactly the way it re-derives from a picked trim color). Where
// the trim paints ink the finish speaks; where the trim leaves a gap the
// finish leaves the gap — pixel-for-pixel, family-for-family, because the
// geometry IS the trim's own CSS. The washes keep their plate + seam-rail
// seats below (the 1.7.2 law's plate half); only the synthetic ring is
// retired. Every surface that renders a trim renders its clone — the grid
// card, the look editor's panzoom, the compact preview: what you frame is
// what ships.
// 1.7.5 — THE TRIM'S OWN INK LADDER ("you broke the trim color, its always
//   yellow now, fix that (only the gold trim has a default color, the rest
//   follow the card's color, if card has no color then it follows the theme
//   color)"): one derivation, spoken by the coat on every card surface —
//   1. the PICKED ink first (cardTrimColor — the picker's word always wins,
//      the gold engraving's own palette included, exactly as 1.6.2 promised);
//   2. the GOLD ENGRAVING keeps its own default (the one family with a
//      voice of its own — 1.6.2's own law, "only gold engraving should have
//      it": no is-user, the --gld-* palette speaks untouched);
//   3. every OTHER family follows the CARD'S OWN COLOR (the coat re-inks
//      the trim in the color the card itself wears);
//   4. a card with no color of its own speaks the THEME'S ink ladder (no
//      is-user at all — nothing to re-ink, the real trim already speaks it).
// 1.7.6 — THE INK NEVER MOVES ("when activating trim effect, the trim
//   changes color, fix that so it doesnt change color"): the 1.7.5 ladder
//   lived on the COAT alone, so the real trim underneath kept speaking the
//   theme's ink at rest — and the moment the effect armed, rung 3 re-inked
//   the ring in the card's color and the trim visibly CHANGED on the toggle.
//   The ladder speaks BOTH seats now: the REAL trim threads this same
//   derivation at rest (GridView's TrimOverlay, the look editor's panzoom,
//   the compact preview — every seat that ever spoke cardTrimColor), so the
//   trim wears its picked ink, the gold's default, or the card's own color
//   whether the effect rides or not, and the clone paints exactly what the
//   real trim already speaks — arming the trim effect can never re-ink the
//   ring again; the only thing the arm adds is the finish's own washes.
// 1.7.7 — THE TRIM'S OWN VOICE ("the trim changes colors based on card
//   colors now and the finishes arent effecting it anymore ... the prior
//   bug was related that the trim would change colors to the card color and
//   discard its own color, fix that so it doesnt, trim has its own default
//   color related to the THEME, and has its own color setting that it should
//   abide by"): the CARD-COLOR RUNG IS RETIRED — the card's color never
//   re-inks another family's trim (the 1.7.5 report's third rung was a
//   misreading of its own words: "the rest follow the card's color" was the
//   BUG the user described, not the cure). The ladder is TWO rungs now:
//   1. the trim's OWN SETTING (cardTrimColor — the picker's word, gold's
//      palette included);
//   2. the trim's OWN DEFAULT, related to the THEME (null — every family's
//      CSS ladder speaks: --trim-c over --gd-ink/--gd-panel for the line
//      family, the gold engraving's --gld-* untouched, the scallop's
//      --s-c, the beads' --bd-rail, the rivet's --rv-rail — one voice per
//      cloth, no card ever overrides it).
//   The cardColor parameter left with the rung; a finish riding the trim
//   adds its washes alone (the 1.7.8 ring-band mask in index.css dresses
//   the perimeter with the image effect off too — the promise this law
//   always made, kept at last), so the trim effect READS as material —
//   never as a re-ink in the card's borrowed color.
export function trimCoatInk(trim, trimColor = null) {
  const hex6 = (v) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : null);
  // The gold check keeps the API's shape honest (the family still owns its
  // default), but both roads now speak the same word: no pick, no is-user.
  if (String(trim || 'dash') === 'gold') return hex6(trimColor);
  return hex6(trimColor);
}

export function TrimCoatLayer({ trim, seamless = false, ink = null }) {
  const { overlay } = trimClasses(trim);
  const userInk = typeof ink === 'string' && /^#[0-9a-fA-F]{6}$/.test(ink) ? ink : null;
  if (!overlay || !userInk) return null;
  return (
    <span
      className={clsx('gd-trim', overlay, 'gd-trim-coat', seamless && 'is-seamless', 'is-user')}
      style={{ ['--trim-user']: userInk }}
      aria-hidden
    />
  );
}

// 1.3.8 — THE CARD'S OWN LOOKS, shared by every card surface (the grid
// card, the look editor's panzoom, the compact preview — one law, one
// voice). See the "CARD'S OWN LOOKS" section in index.css for the seats
// and the materials.
// 1.3.9 — THE PATTERN LAYER IS RETIRED ("remove secondary color and
// pattern option"): the print and its ink left with the feature — the
// FINISH coat alone keeps the card's own looks.
// 1.4.0 — THE COAT IS ONE CONTINUOUS SURFACE ("ensure that when i turn on
// the apply to image that it doesnt just lazily stretch it to the top,
// ensure the pattern can continue / extend"): the old model swapped
// BETWEEN two seats — the foot's plate coat (image untouched) and the
// card-root face coat (whole face) — so flipping AFFECTS IMAGE re-anchored
// the whole material to a new box: the pattern visibly re-stretched from
// the plate to the art. The coat now lives in ONE seat (the card root,
// covering the whole face) and the switch only lifts a MASK: plate-only
// mode veils the art zone (the mask's cut sits exactly at the old plate
// coat's top edge — the notch line above the seam), image mode reveals
// the same undisturbed pattern. The material NEVER re-anchors — the
// pattern continues by construction.
// The phase: every card speaks its own --gd-fin-ph (a 0..1 hash of the
// card's id) — the shaders' clocks and tiles all read it (negative
// animation delays + background-position offsets), so no two cards ever
// animate in lockstep or tile in phase ("ensure its not repeatable
// between different cards"). The hash speaks a murmur-style avalanche
// (the plain polynomial-31 form let SHORT sequential ids cluster inside a
// 1% band — the web harness's c1..c4 all landed at 0.127..0.130, three
// coats in lockstep; the avalanche scatters even those).
export function finishPhase(id) {
  const s = String(id || '');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519);
  h ^= h >>> 13;
  return ((h >>> 0) % 997) / 997;
}

// The FINISH coat. ONE element at the card root (z 2 — above the art's
// z 1, below the ink work's z 3: THE COAT NEVER TOUCHES THE TRIM, with an
// image or without). `onImage` reveals the art zone; otherwise the mask
// veils it (the plate + notch alone wear the coat). `artH` is the art
// zone's height in px (the surfaces know their own width + ratio — no
// measuring, no stretch). Numeix, auric and nuri seat a SECOND layer
// over the art zone while onImage is on (the sprite's own treatment:
// numeix's ink-light wash, auric's honey, nuri's fire-light).
// Prismatic seats no artfin at all (the 1.4.7 law: its one rainbow speaks
// over plate and art alike). `none` paints nothing.
// 1.4.1 — POLYCHROME'S OPAQUE-FLOOD LAW IS RETIRED with the rework —
// it seats exactly like every other coat: the switch OFF veils the art
// zone, ON reveals the same undisturbed pattern. The name never wore a
// white block again: the gradient text reads through the translucent
// pour.
// 1.4.3 — POLYCHROME LEAVES FOR OPALESCENT (the pearl takes the seat:
// milky pastels + refraction streaks — retired with the coat in 1.4.8),
// and every coat now CLIPS ITS OWN CHILDREN at the card's
// face (the 1.4.3 "never beyond the edges" law): the prismatic star
// field's oversize and the foil's ripple rings stay inside the die-cut.
// 1.4.4 — THE COATS BECOME PIPELINES ("opalescent isnt animated or unique
// and has elements in it like the rest, fix that by giving it elements" +
// "prismatic should be wavy, shimmer, etc ... complicated like
// holographic" + "nuri ... add more elements and make it more unique"):
// opalescent, prismatic and nuri each speak SEVERAL sibling seats now —
// every flight compositor-owned (the 1.4.4 perf law: the prismatic's
// background-position + custom-property animations re-rastered the whole
// coat every frame; every motion is transform / opacity / filter now).
// The pearl: body + TIDE + GLINTS (three pulsing nacre glows). The
// prism: body + WAVES + SWEEP (the star field still rides the body's
// ::after). The forge: body + LICKS + SPARKS + FLARE (the twin hearts
// still ride the body's ::after). Foil and holographic keep their 1.4.x
// single-seat pipelines untouched.
// 1.4.5 — THE COAT'S OWN REACH GROWS A SECOND SWITCH ("add trim effect
// next to image effect and image motion, which will make the finish apply
// above the trim" + "add option to effect stamp too, where finishes would
// effect the stamp if checked"): `onTrim` lifts the coat's whole family
// onto the OVER-TRIM rung (z 4 — above the ink work's z 3, below the
// text's z 5; see the ladder law in index.css). 1.7.2 — THE STAMP REACH
// IS RETIRED ("delete the stamp effect option"): `onStamp` left with
// the switch — the stamps' seat is spoken by the card root's image
// effect scope alone, and the layer itself never moves.
export function CardFinishLayer({ finish, onImage = false, onTrim = false, artH = null, hasImage = true, phase = 0, splitArt = false }) {
  if (!finish || finish === 'none') return null;
  // The plate-only veil arms exactly while there is an image to protect:
  // a card with no art is all plate — the coat covers the whole face
  // either way ("sometimes i may have a card with no image").
  const plateOnly = !onImage && hasImage;
  /* 1.9.6 — THE SPLIT VOLUME'S OWN PAIR ("add a checkbox that adds
     another transparency slider, but this slider affects the transparency
     of teh finishes on the image itself, so main one would affect both
     normally, but when checked the main one will only affect the finishes
     over the trim and the card, but the second one will affect the
     finishes over images etc.."): while the split arms and a real art
     zone exists, every full-face seat renders as TWO complementary
     twins — the plate twin wearing the plate-only mask (the main knob's
     ink over the trim and the card) and the art twin wearing the art
     zone's own mask (the second knob's ink over the picture, switched by
     the .gd-fin-split scope's local --gd-fin-strength override in
     index.css). Both twins share the SAME geometry and phase, so the
     pattern continues across the notch seam exactly as the 1.4.0
     one-seat law promised — the pair is the same continuous coat, split
     only in the volume each half speaks.
     1.9.8 — THE PAIR SPEAKS FOR EVERY PROTECTED PICTURE ("finishes such
     as prismatic and holographic are too visible on images that it
     becomes too hard to see the actual image, as if the background of
     the finishes actually apply over the image, same goes for alot of
     the finishes, and that started happening a few updates ago"): the
     pair used to arm only under the split checkbox — but the ground
     classes' blend flips (the 1.9.7 seam law) ride the CARD ROOT and
     reached the ONE full-face seat the unsplit coat wore, so the same
     flips that cure the plate's extremes also flipped the coat's whole
     voice over the PICTURE (a normal-blended riot, a multiply veil, the
     twin's shadow ink — the veil the report names). The pair now arms
     whenever a coat covers a real image: the plate twin speaks the
     ground law below the notch, the art twin speaks the coat's CLASSIC
     voice above it (its native blends, its raw tint — the artfin's own
     law, extended to the whole art half; see .is-art-zone in
     index.css). The split checkbox keeps its own word unchanged: with
     it off, both twins read the main knob (the .gd-fin-split scope
     simply never fires); with it on, the art twin reads the second
     knob exactly as it always did. */
  /* 1.9.10 — THE PAIR SPEAKS THE CLASSIC COAT ON BOTH HALVES ("i want
     you to revert back the finishes and the colors"): the pair itself
     STAYS (the picture's protection and the split volume's own law —
     both features the owner kept), but the art twin no longer carries
     any color word of its own: both twins speak the same CLASSIC fixed
     colors now, and the ONLY thing that differs between them is the
     VOLUME each half reads (the main knob for the plate twin, the image
     knob for the art twin while the split checkbox holds). */
  const pair = onImage && hasImage;
  const ph = Number.isFinite(phase) ? phase : 0;
  const vars = {
    ['--gd-fin-ph']: ph,
    ...(artH != null ? { ['--gd-art-h']: `${Math.round(artH)}px` } : null),
  };
  // The seat factory: every layer is an absolutely seated span inside the
  // card's face, clipped by its own frame, veiled to the plate while
  // IMAGE EFFECT is off (the plate-only mask below).
  const seat = (cls, children = null, plateVeil = true) => {
    const one = (extra) => (
      <span
        className={clsx('gd-card-face-finish', cls, extra, onTrim && 'is-over-trim')}
        style={vars}
        aria-hidden
      >
        {children}
      </span>
    );
    if (pair) {
      return (
        <>
          {one('is-plate-only')}
          {one('is-art-zone')}
        </>
      );
    }
    return one(plateVeil && plateOnly && 'is-plate-only');
  };
  return (
    <>
      {/* THE INK IN THE SUN — NUMEIX (1.6.4 rename of the 1.5.0 mumeix; 1.5.0 — "remove the big wavy lines
          in the front, keep the thin ones in the back" + "stylize the x's
          and add an animation to them, they're currently stationary" +
          "remove the white card mask, replace it with a dappled sunlight
          effect"): the BODY (the paper grain alone now — a whisper of
          tooth, static and phase-baked, soft-light; the cream wash that
          read as a white card mask is gone), the DAPPLE (the coat's own
          light — a 240px field of soft warm sun-through-leaves patches,
          screen-blended, drifting SW on a 34s clock while its brightness
          breathes on an 11s), the STREAMS (one octave — the fine contour
          lines drifting NE on a 17s; the broad front rivers retired), the
          X MARKS (the restyled falling crosses — bolder tapered strokes
          + center dots, falling on 20s / 26s clocks with the sway baked
          in, twinkling on offset 9s / 13s clocks; the 1.4.9 looms never
          moved at all — their keyframes were never defined), the STARS
          (the quiet gold field drifting on its own slow 36s), and the
          MOON (the sage-gold halo breathing at the top of the face on a
          13s clock). See .gd-finish-numeix in index.css. */}
      {finish === 'numeix' && (
        <>
          {seat('gd-finish-numeix')}
          {seat('gd-numeix-dapple')}
          {seat('gd-numeix-streams')}
          {seat('gd-numeix-xmarks')}
          {seat('gd-numeix-stars')}
          {seat('gd-numeix-moon')}
        </>
      )}
      {/* AURIC — the living gold, the seventh coat (1.5.0 — "kintsugi had
          no animation and the name is too long, remove it and make a new
          one with a shorter name and normal animations"): the BODY (the
          honey wash — a warm amber veil, soft-light, static and
          phase-baked), THE GEMS (1.6.0 — the thunder retired: a faceted
          gold-diamond field, cut gems + tilted diamonds + sparkles +
          beads, drifting NE on a 13s clock while the field breathes on an
          8s; the 1.5.0 zigzag streak bolts are gone), the FLAKES (two
          looms of tilted gold diamonds RISING on 14s / 19s clocks with
          the sway baked in, twinkling on offset 7s / 10s clocks — 1.6.7:
          the coat's vertical voice turned bottom-to-top), and the
          SWEEP (a bright gloss band RISING through the whole face —
          bottom to top, the coat's unique direction — every 8s and
          resting between passes). See .gd-finish-auric in
          index.css. */}
      {finish === 'auric' && (
        <>
          {seat('gd-finish-auric')}
          {seat('gd-auric-currents')}
          {seat('gd-auric-flakes')}
          {seat('gd-auric-sweep')}
          {/* 1.6.8 — THE SUMMONING ("make something at the bottom like a
              light effect with thin lines going from down to up as if its
              summoning the diamonds"): the coat's ground voice — a warm
              glow breathing at the card's bottom edge with thin gold
              filaments (bright diamond tips at their heads) rising out of
              it on an 11s clock, dissolving as they climb. See
              .gd-auric-summon in index.css. */}
          {seat('gd-auric-summon')}
        </>
      )}
      {/* THE PRISM — the faceted ground (the saturated rainbow conic,
          overlay), the STARS (1.6.7 — the big four-point crystal lattice
          on its OWN DRIFTING seat at last: "the big 4 pointed stars are
          not animated its stuck in place and feels wrong, fix that too
          somehow" — the tile that rode the body's static background now
          glides one period SE on a 26s clock with a 9s twinkle, the same
          geometry it always spoke), the PARTICLES (1.6.7 — "add 4 pointed
          star particles to prismatic effect": a 72px lattice of small
          four-pointed sparkle glyphs drifting E on a brisk 8.5s with a 5s
          twinkle, screen-blended — the glitter the facets throw), the
          WAVES (the see-through woven spectral ribbons drifting NE with
          their 16s hue-ride + the spark lattice drifting SW), and the
          SWEEP (the pearlescent gloss band crossing the face every 7s). */}
      {finish === 'prismatic' && (
        <>
          {seat('gd-finish-prismatic')}
          {seat('gd-prism-stars')}
          {seat('gd-prism-particles')}
          {seat('gd-prism-waves')}
          {seat('gd-prism-sweep')}
        </>
      )}
      {/* THE FORGE — the fire-band body (static wash + heat veins,
          overlay; the twin breathing hearts ride its ::after), the LICKS
          (rising flame tongues at their own varied lengths), the SPARKS
          (the climbing ember lattice) and the FLARE (the forge's periodic
          exhale rising through the face). */}
      {finish === 'nuri' && (
        <>
          {seat('gd-finish-nuri')}
          {seat('gd-nuri-licks')}
          {seat('gd-nuri-sparks')}
          {seat('gd-nuri-flare')}
        </>
      )}
      {/* FOIL and HOLOGRAPHIC keep their 1.4.x single-seat materials
          (plus foil's ripple sibling below). 1.4.8 — holographic's two
          shard lattices ride CHILD SEATS now (the CPU pass: the old
          chaos loop animated background-position on the main thread —
          see .gd-holo-shards / .gd-holo-dots in index.css); the seat
          keeps its streaks + tint + hue-ride, the children carry the
          translating tiles. 1.5.0 — numeix and auric speak their own
          multi-seat families above, so this catch-all carries only the
          truly single-seat coats. */}
      {finish !== 'numeix' && finish !== 'auric' && finish !== 'prismatic' && finish !== 'nuri' && finish !== 'holographic' && seat(`gd-finish-${finish}`)}
      {finish === 'holographic' &&
        seat(
          'gd-finish-holographic',
          <>
            <span className="gd-holo-shards" aria-hidden />
            <span className="gd-holo-dots" aria-hidden />
          </>
        )}
      {/* FOIL's ripples ride their own SIBLING (the old sheen's seat,
          speaking a whole new material — see .gd-finish-foil-ripples in
          index.css): the body TINTS the metal into the card (the 1.4.7
          soft-light law — never a shade), the ripple layer SCREENS three
          slow water-rings + a sparkle lattice over it — light that could
          never stay bright trapped inside the body's blend group. The
          1.4.0 sheen (the middle white line + the travelling streak) left
          with the rework. */}
      {finish === 'foil' &&
        seat(
          'gd-finish-foil-ripples',
          <>
            <span className="gd-foil-ripple" style={{ ['--gd-ripple-seat']: '0s' }} aria-hidden />
            <span className="gd-foil-ripple" style={{ ['--gd-ripple-seat']: '3s' }} aria-hidden />
            <span className="gd-foil-ripple" style={{ ['--gd-ripple-seat']: '6s' }} aria-hidden />
          </>
        )}
      {/* 1.4.7 — PRISMATIC SEATS NO ARTFIN ("currently when image effect
          option is ticked on it applies another rainbow overlay, fix that
          so it doesnt"): the heat-map seat is retired — with IMAGE EFFECT
          on, the one coat simply reveals across the whole face and the
          single rainbow (conic + lattice + waves + sweep) speaks over
          plate and art alike. The forge keeps its own sprite treatment
          (the artfin seats below); numeix speaks its ink-light wash over
          the sprite the same way; auric lays its honey over the sprite
          (the artfin below).
          1.6.4 — THE ARTFIN SPEAKS THE ART ZONE ALONE ("some finishes
          have some parts that dont cover the image and cover below it,
          or would have inconsistant covering where its covering both but
          the animation doesnt align"): the sprite's own wash used to
          paint the WHOLE face — the plate below the image included —
          stacking a second breathing layer over the coat's own material
          there (its breath on its own clock, never aligned with the
          coat's parts) while barely reading over the photo it was born
          for. The seat carries is-art-zone now: the mask below cuts it
          at the notch line exactly (the plate-only veil's own mirror),
          so the wash covers the IMAGE and only the image, the plate
          below wears the coat's one voice, and the two modes agree on
          the notch strip (the coat alone, both sides of the switch). */}
      {onImage && (finish === 'numeix' || finish === 'nuri' || finish === 'auric') && (
        <span
          className={clsx(
            'gd-card-face-artfin',
            `gd-artfin-${finish}`,
            hasImage && 'is-art-zone',
            onTrim && 'is-over-trim'
          )}
          style={{ ['--gd-fin-ph']: ph, ...(artH != null ? { ['--gd-art-h']: `${Math.round(artH)}px` } : null) }}
          aria-hidden
        />
      )}
    </>
  );
}

// A live miniature of a grid card — used by the card-look editor and the
// new-character dialog so what you build is what you get.
export function CardPreview({
  name,
  imageUrl,
  ratio,
  trim,
  crop,
  imgAspect,
  width = 150,
  versions = 1,
  date = '',
  // 1.3.8 — the card's own looks, one voice with the grid card and the
  // panzoom: the plate color (0.38.0 surfaces always spoke it inline; the
  // compact seat joins them) + the finish pass. 1.3.9 — the secondary
  // color and the pattern left with the feature.
  cardColor = null,
  // 1.6.2 — the trim's own ink (the color picker's seat — see TrimOverlay):
  // null keeps the theme's own trim exactly as it always painted.
  trimColor = null,
  finish = 'none',
  finishOnImage = false,
  // 1.4.5 — the coat's reach switch (trim), one voice with the
  // grid card (see CardFinishLayer). 1.7.2 — the stamp reach is retired
  // with the option ("delete the stamp effect option").
  finishOnTrim = false,
  // 1.9.5 — THE COAT'S OWN VOLUME: the transparency knob the windows
  // slide, painted by the preview at the coat's true strength (what you
  // frame is what you get).
  finishTransparency = null,
  /* 1.9.6 — THE SPLIT VOLUME ("add a checkbox that adds another
     transparency slider, but this slider affects the transparency of
     teh finishes on the image itself"): the checkbox's own draft (the
     split arms the .gd-fin-split scope + the pair rendering in
     CardFinishLayer) and the second knob's draft (the art seats read it
     as --gd-fin-strength-art). Unchecked, one knob paints both halves
     exactly as it always did. */
  finishSplitImage = false,
  finishImageTransparency = null,
  // 1.4.1 — IMAGE MOTION, one voice with the grid card: the preview's
  // art sways too (what you frame is what you get).
  imageMotion = false,
}) {
  const r = ratio && ratio.w > 0 && ratio.h > 0 ? ratio : { w: 3, h: 4 };
  const { overlay } = trimClasses(trim);
  const eff = imgAspect ? effectiveCrop(crop, r, imgAspect) : null;
  const seamless = !!cardColor && isExtremePlateHex(cardColor);
  // 1.6.2 — the picker's ink, validated once (TrimOverlay's own law).
  // 1.7.6 — THE INK NEVER MOVES (trimCoatInk above): the REAL trim speaks
  // the ladder at rest too — so arming the trim effect can never re-ink
  // this seat; the clone below paints exactly what this seat already
  // speaks.
  // 1.7.7 — THE TRIM'S OWN VOICE (trimCoatInk above): the card-color rung
  // is retired — this seat speaks the picker's word or the theme's own
  // default, never the card's borrowed color.
  const trimUserInk = trimCoatInk(trim, trimColor);
  // 1.4.0 — the per-card shader phase (the compact seat hashes the card's
  // own NAME — the preview has no id of its own); 1.4.7 — the ROOT now
  // carries it too (--gd-fin-ph), so the image's sway clock and the
  // stamp's trailing sway read the card's own phase instead of the
  // silent default (the documented "no two cards animate in lockstep"
  // law finally reaches the motion family), and --gd-sway seats the
  // stamp's absolute reach (the art's height over the crop's own
  // overdraw — see .gd-stamp-motion in index.css).
  const finPhase = finishPhase(name);
  // 1.4.7 — THE GAP LAW'S OWN MARK ("it only does [the zoom] if it detects
  // that there is no gab for motion vertically"): a crop whose height
  // fraction sits at 0.97 or below already overdraws the art box by the
  // sway's whole reach — the img carries data-motion-slack and the
  // motion law's safety zoom stands down (see .gd-img-motion in
  // index.css). An exact-fit crop (or an unknown aspect, the plain cover
  // fill) keeps the classic 1.06.
  const motionSlack = eff && eff.h <= 0.97 ? { 'data-motion-slack': 'crop' } : null;
  // 1.4.5 — THE FINISH'S OWN TEXT RIM (the grid card's law, verbatim): the
  // plate-colored seat computes its rim from the ink it actually paints;
  // the themed seat falls to the theme's own counter token. The var rides
  // the card root and .gd-has-finish paints it (see index.css).
  // 1.7.4 — the finish's own ground earns its rim (the grid card's law).
  // 1.9.2 — THE GROUND LISTENS TO THE CLOTH: the ground is a color-mix
  // over the theme's own panel now, not a hex readableInk could read — the
  // ink/rim seats fall to the theme's own tokens exactly as the uncoated
  // themed card always spoke (see FINISH_GROUND in TagRibbon).
  const finishGround = finish !== 'none' && !cardColor ? FINISH_GROUND[finish] || null : null;
  const plateInk = cardColor ? readableInk(cardColor) : null;
  const finRim = plateInk ? counterRimFor(plateInk) || 'var(--gd-text-counter)' : 'var(--gd-text-counter)';
  // 1.4.8 — THE UNDER-ART SCOPE (the "image covers it" law — see
  // .gd-fin-under-art in index.css): armed exactly while a coat is worn
  // veiled (a finish + IMAGE EFFECT off + an image to protect), it drops
  // the masked coat to the art's own rung so the image covers the coat's
  // seam-side overdraw — the corner notch law keeps its voice, the
  // picture keeps its raw bottom.
  const finUnderArt = finish !== 'none' && !finishOnImage && !!imageUrl;
  // 1.4.0 — the art zone's height, known from the preview's own geometry
  // (width + ratio — no measuring): the finish coat's plate-only mask cuts
  // exactly at the notch line above the seam.
  // 1.4.3 — THE INK BORDER LEAVES THE MATH ("the finishes seem to be
  // missing at the top of the card's name area, as if they end before it
  // unless i specifically turn on affect image"): the card root wears a
  // 2px ink border, and its absolutely-positioned art box lives INSIDE
  // it — the art zone's true width is the card's width minus both
  // borders. The old artH (plain width × ratio) OVERSTATED the art's
  // height by 4×ratio.h/ratio.w (~5px at 3:4), pushing the plate-only
  // mask's cut that same distance INTO the name area: the top sliver of
  // the plate wore no coat while the switch was off. Every surface now
  // subtracts the border before speaking --gd-art-h — the coat reaches
  // the notch line exactly, the name plate's top wears its material.
  const artH = Math.max(0, width - 4) * (r.h / r.w);
  return (
    <div
      className={clsx(
        'gd-card gd-card-collector relative select-none',
        // 1.4.3 — POLYCHROME'S TEXT + BORDER SCOPE IS RETIRED WITH THE
        // COAT (the pearl is a translucent veil — the card's own printing
        // keeps its voice; see the retirement note in index.css).
        // 1.4.1 — the sway's own scope (see .gd-img-motion in index.css).
        imageMotion && 'gd-img-motion',
        // 1.4.5 — the finish's own scope classes: the RIM LAW's seat
        // (.gd-has-finish paints the outline) + the coat's reach switch
        // (.gd-fin-on-trim lifts the coat over the trim ring — see the
        // ladder law in index.css). 1.7.2 — the stamp reach is retired
        // with the option, and the full-face coat's own scope
        // (.gd-fin-on-image — the stamps covered alongside the image)
        // joins the root's laws, one voice with the grid card.
        finish !== 'none' && 'gd-has-finish',
        finish !== 'none' && finishOnTrim && 'gd-fin-on-trim',
        finish !== 'none' && finishOnImage && 'gd-fin-on-image',
        finUnderArt && 'gd-fin-under-art',
        /* 1.9.3 — THE EXTREME GROUNDS (finishGroundTone above): the picked
           card color's own tone classes the coat's blend seats — a
           near-white / near-black / vivid plate never swallows the coat
           again. One voice with the grid card and the look editor. */
        finishGroundTone(cardColor),
        /* 1.9.6 — THE SPLIT VOLUME'S OWN SCOPE: armed exactly while the
           checkbox holds, it switches the ART seats' volume var to the
           second knob (see .gd-fin-split in index.css) and the pair
           rendering below splits the full-face coat into its plate and
           art twins. */
        finishSplitImage && 'gd-fin-split'
      )}
      style={{
        width,
        /* 1.3.7 — THE COMPACT PREVIEW'S CORNER PLATES ARE RETIRED (see the
           retirement note at .gd-card-collector in index.css): the
           1.3.6 --gd-corner-fill write left with the law — the preview's
           outer corners belong to the ink trim again, one voice with every
           other card surface. */
        /* 1.4.5 — the rim var the outline law reads (light ink → dark rim,
           dark ink → light rim; the themed seat speaks the theme's own
           counter token). */
        ...(finish !== 'none' ? { ['--gd-fin-ink-outline']: finRim } : null),
        /* 1.4.7 — the motion family's own root vars: the sway's per-card
           phase (the same hash the coat seats read) + the stamp's
           absolute sway reach, computed from the art's height over the
           crop's own vertical fraction (a zoomed crop sways farther —
           the stamp tracks the image's TRUE travel; see .gd-stamp-motion
           in index.css). */
        ['--gd-fin-ph']: finPhase,
        ['--gd-sway']: `${(artH * 0.015 / (eff ? Math.max(eff.h, 0.1) : 1)).toFixed(2)}px`,
        /* 1.4.8 — THE CARD'S OWN COLOR as a var the finishes read (the
           nuri lean law — see .gd-finish-nuri::before in index.css): the
           plate's hex when the card speaks one, the theme's panel when it
           does not — the forge leans toward whatever ground it burns on.
           1.7.4 — THE FINISH'S OWN GROUND (the grid card's law, verbatim). */
        ['--gd-card-tint']: cardColor || finishGround || 'var(--gd-panel)',
        /* 1.9.5 — THE COAT'S OWN VOLUME: the card root writes the
           strength var the coat seats read (the transparency knob's own
           seat — see finishStrength above).
           1.9.6 — THE SPLIT VOLUME rides beside it: the second knob's
           own var (the art seats read it through the .gd-fin-split
           scope's local override — one root, two volumes), and the coat's
           own color word (--gd-fin-ink — see finishTintLean above; a
           colorless card writes nothing and the scope never fires). */
        ['--gd-fin-strength']: finishStrength(finishTransparency),
        ['--gd-fin-strength-art']: finishStrength(finishImageTransparency),
        /* 1.9.9 — THE LEAN + ITS SEATS, kept for the X SIGNATURE alone
           after 1.9.10's CLASSIC COAT RETURNS: --gd-fin-ink feeds the X
           looms' base tint hand (hue + saturation whole at the fixed
           0.45 luma seat), --gd-fin-glow the X's dark-ground ink seat
           (0.78), --gd-fin-art the X's art-zone seat (0.75) — every other
           coat seat reads none of them (the classic fixed colors). The
           strength vars beside them keep feeding the transparency knobs. */
        ...(cardColor
          ? {
              ['--gd-fin-ink']: finishTintLean(cardColor),
              ['--gd-fin-glow']: finishTintLean(cardColor, 0.78),
              ['--gd-fin-art']: finishTintLean(cardColor, 0.75),
            }
          : null),
        ...(finishGround ? { backgroundColor: finishGround } : null),
      }}
    >
      {/* 1.4.5 — THE COAT SPEAKS FIRST IN THE DOM (the grid card's own
          law): at its equal rung (z 2) the later stamp seats win by DOM
          order, so the coat can never cover what its switches say it
          must not. */}
      <CardFinishLayer
        finish={finish}
        onImage={finishOnImage}
        onTrim={finishOnTrim}
        artH={artH}
        hasImage={!!imageUrl}
        phase={finPhase}
        splitArt={finishSplitImage}
      />
      {/* 1.4.0 — THE PREVIEW'S OWN Z LADDER (one law with the grid card:
          art z 1 above the foot's rise, coat z 2, INK WORK z 3 above the
          coat — the trim never wears the finish). The art box owns its
          context (z 1: the image can never escape its clip), so the TRIM
          — which used to sit inside it — now rides at the card root with
          the art box's exact geometry (same width, same aspect ratio,
          same top-left seat): its z 3 escapes the box's context and the
          coat can never touch it, exactly as the grid card's deco does. */}
      <div
        className="relative overflow-hidden gd-preview-art"
        style={{
          aspectRatio: `${r.w} / ${r.h}`,
          zIndex: 1,
          /* 1.4.5 — THE ART SEAT SPEAKS THE DEEP GROUND (the white-line
              report: "the white line/border around the image thumbnail
              seems to only appear when the squish/stretch animation of card
              clicking"): the old seat washed the ink at 10% into the PANEL —
              a near-white paper on every dark theme, and any fractional
              raster edge of the art (a crop frame's percentage rounding, a
              non-integer clip width under the squish's re-raster) let that
              paper bleed a hairline ring around the image exactly while the
              card breathed. The seat speaks the ink-over-BG mix now — a
              shadow-toned paper that can never read as a white line under
              any theme, and the crop frame overdraws its own box by a hair
              (cropFrame) so the art's edge owns every pixel it can. */
          background: 'color-mix(in srgb, var(--gd-ink) 30%, var(--gd-bg))',
          // 0.20.0 — collector cards round their TOP only (the foot's
          // details sit flush in a square base).
          // 1.3.4 — ALL FOUR CORNERS, THE GRID CARD'S OWN LAW ("the image
          // leaking beyond the trim which gets turned into rounded mode,
          // but the card color from below doesnt stretch to it"): the
          // preview's art still carried the pre-1.3.1 top-only radius —
          // in rounded mode its SQUARE bottom corners painted straight
          // into the seam's corners, past the rounded trim, and the foot
          // plate's rise had nothing to fill (the leak the user caught
          // on the preview surfaces). The preview speaks the grid card's
          // divider law now: the art's bottom corners round with the
          // theme's radius and .gd-card-foot::before fills the carved
          // notch — one law on every card surface.
          borderRadius:
            'calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px)',
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            draggable={false}
            // 0.48.0 — THE EXACT CROP FRAME (see cropFrame): object-position
            // could only pan, so zoomed crops never rendered. The compact
            // preview must show the crop the editor built, at the same zoom.
            // While the aspect is still unknown the plain cover fill holds.
            // 1.4.7 — data-motion-slack: the gap law's mark (see the note
            // at motionSlack above) — the motion law's safety zoom stands
            // down for a frame that already carries its own vertical slack.
            className={clsx('object-cover', !eff && 'w-full h-full')}
            style={eff ? cropFrame(eff) : undefined}
            {...motionSlack}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className="font-bold" style={{ color: 'color-mix(in srgb, var(--gd-ink) 30%, transparent)', fontSize: 22 }}>
              ✖
            </span>
            <span
              className="tracking-[0.25em] uppercase"
              style={{ color: 'color-mix(in srgb, var(--gd-ink) 45%, transparent)', fontSize: 8 }}
            >
              No image
            </span>
          </div>
        )}
      </div>
      {/* 1.4.0 — the trim at the card root (see the ladder note above):
          the art box's own geometry — same width, same aspect ratio, same
          top-left seat — one seat above the finish coat. The trim family's
          own border-radius speaks the art box's radius, so the corners
          carve exactly where they always did. */}
      {overlay && (
        <span
          className={clsx('gd-trim', overlay, seamless && 'is-seamless', trimUserInk && 'is-user')}
          style={{
            top: 0,
            left: 0,
            right: 'auto',
            bottom: 'auto',
            width: '100%',
            aspectRatio: `${r.w} / ${r.h}`,
            borderRadius:
              'calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px)',
            ...(trimUserInk ? { ['--trim-user']: trimUserInk } : null),
          }}
          aria-hidden
        />
      )}
      {/* 1.7.4 — THE COAT'S TRIM VOICE (the grid card's law, verbatim —
          TrimCoatLayer in this file): the trim's own clone re-inks every
          shape while the trim effect rides, same geometry seat the
          preview's trim speaks above, one rung higher — gaps kept as
          gaps, what you frame is what you get.
          1.7.5 — THE COAT SPEAKS THE TRIM'S OWN INK (trimCoatInk above):
          the finish's signature voice retired; a clone with no ink to
          speak rests unrendered.
          1.7.7 — THE TRIM'S OWN VOICE (trimCoatInk above): the card-color
          rung is retired — the clone speaks the picker's word alone, and
          with no pick the ring wears only the finish's washes. */}
      {overlay && finish !== 'none' && finishOnTrim && (() => {
        // 1.7.5 — the clone's ink walks the trim's own ladder (see
        // trimCoatInk above — the "always yellow" cure).
        const coatInk = trimCoatInk(trim, trimColor);
        if (!coatInk) return null;
        return (
          <span
            className={clsx('gd-trim', overlay, 'gd-trim-coat', seamless && 'is-seamless', 'is-user')}
            style={{
              top: 0,
              left: 0,
              right: 'auto',
              bottom: 'auto',
              width: '100%',
              aspectRatio: `${r.w} / ${r.h}`,
              borderRadius:
                'calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px)',
              ['--trim-user']: coatInk,
            }}
            aria-hidden
          />
        );
      })()}
      {/* 1.4.0 — NO SEPARATOR between the art and the label (matches the
          grid card's flush foot). */}
      <div
        className={clsx('gd-card-foot gd-card-foot-vers is-static', cardColor && 'is-colored')}
        style={{
          /* 1.7.4 — THE FINISH'S OWN GROUND paints the plate (the grid
             card's law, verbatim). 1.9.2 — the ground is the theme's own
             cloth now, so the plate's printing speaks the theme's own
             text token, exactly the voice the uncoated themed card
             always spoke (see FINISH_GROUND in TagRibbon). */
          ...(cardColor
            ? { backgroundColor: cardColor, color: readableInk(cardColor) }
            : finishGround
              ? { backgroundColor: finishGround, color: 'var(--gd-panel-text)' }
              : undefined),
          ['--gd-foot-plate']: cardColor || finishGround || 'var(--gd-panel)',
        }}
      >
        {/* 1.3.9 — the plate's own coat (over the text) — the grid card's
            law, verbatim; the print left with the retired pattern
            feature. */}
        <div className="gd-card-foot-name min-w-0">
          <RichText
            text={name || 'Unnamed'}
            as="div"
            className="gd-card-title font-display font-bold leading-tight truncate"
            style={{ color: cardColor ? readableInk(cardColor) : 'var(--gd-panel-text)' }}
          />
          {date && (
            <div className="gd-card-meta gd-card-meta-line tracking-[0.14em]" style={{ color: cardColor ? readableInk(cardColor) : 'var(--gd-mute)' }}>
              {date}
            </div>
          )}
        </div>
        <span className="gd-card-stamp gd-stamp flex-shrink-0" style={{ color: cardColor ? readableInk(cardColor) : 'var(--gd-accent)' }}>
          {versions} VER
        </span>
      </div>
    </div>
  );
}
