#!/usr/bin/env python3
"""finish_surgery_197.py — 1.9.7 THE TWIN MEASURES IN LIGHT (TagRibbon.jsx).

Replaces finishInkTwin's HSL-lightness rail (whose L<=0.5 passthrough let
the wheel's fully-saturated high-luminance corners — the suggestion
palette's own #ffd400 — arrive raw at a light plate) with the luma-railed
twin: one rail, both sides, a guaranteed 0.16-of-light distance from the
plate, the lightness solved exactly by bisection against the twin's own
luma curve.
"""
import re
import sys

RIBBON = 'src/components/TagRibbon.jsx'

NEW_FN = '''export function finishInkTwin(cardColor) {
  if (typeof cardColor !== 'string') return '';
  const m = /^#([0-9a-fA-F]{6})$/.test(cardColor.trim()) ? cardColor.trim() : null;
  if (!m) return '';
  const n = parseInt(m.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  // the twin's own yardstick — perceptual LUMINANCE, the ground classes'
  // own measure (the 1.9.6 HSL-lightness rail let the wheel's fully
  // saturated high-luminance corners pass through raw: a #ffd400 plate
  // classes light yet speaks HSL L = 0.5, the exact passthrough seat)
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  // HSL hue + saturation — the twin keeps the card's own hue bit for bit
  // and its saturation whole; only the lightness ever moves.
  const d = mx - mn;
  let h = 0;
  if (d !== 0) {
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (mx === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  const l = (mx + mn) / 2;
  const satHsl = d === 0 ? 0 : l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  /* the ONE rail, both sides of the wheel (the 1.9.7 corner law):
     · the bright half (luma >= 0.5) speaks the SHADOW twin — the 1.9.6
       compression where it still carries (0.35 + 0.3*l at the top: white
       keeps its measured 65% gray shadow, the 0.78 rail its 58% one),
       floored so the mid-bright band never thins (the min with l - 0.16:
       a 0.6 plate reads a 0.44 ink, a 0.5 plate a 0.34 one — every
       bright plate a full 16% of light away from its ink);
     · the dark half (luma < 0.5) speaks the LIFT twin (l + 0.16: black
       reads a 16% gray lift, a deep red a pink one) — the screen seats
       that own the dark grounds receive an ink that already carries its
       own light.
     One seam at luma 0.5 (the lift hands the shadow its seat — BOTH
     sides carry the full 0.16 distance, no side ever whispers, and no
     blend flips there); no thresholds to loop past, no passthrough for
     any plate the wheel can name. */
  const target = lum >= 0.5 ? Math.min(0.35 + 0.3 * lum, lum - 0.16) : lum + 0.16;
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
  // the lightness that lands the twin's own luma on the target — for a
  // fixed hue and saturation the luma is strictly monotone in lightness,
  // so a bisection solves it uniquely (24 steps: finer than any color
  // step the wheel can speak)
  const lumaAt = (ll) => {
    const [rr, gg, bb] = hslToRgb(h, satHsl, ll);
    return 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
  };
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    if (lumaAt(mid) < target) lo = mid;
    else hi = mid;
  }
  const twinL = (lo + hi) / 2;
  const [tr, tg, tb] = hslToRgb(h, satHsl, twinL);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  const hx = (v) => ch(v).toString(16).padStart(2, '0');
  return `#${hx(tr)}${hx(tg)}${hx(tb)}`;
}'''

NEW_COMMENT = '''/* 1.9.6 — THE INK TWIN ("the same issue still occurs, but its specific
   to when i make the card color to the white ... the bloom effects in
   numeix theme dissapear, nuri's effect becomes invisible/negative, foil
   effects are invisible unless i make the card color darker, auric
   becomes invisible when i do bright white, prismatic stars becomes
   invisible ... holographic becomes invisibel, fix that ... i suspect
   its related to a change u did to the finishes where they would be
   visible regardless of color or would be affected by the card color
   better to the point they broke, i want you to account for that
   especially so values dont loop or these mistakes occur"): four passes
   of blend-flip whack-a-mole taught the lesson the report names — the
   ground classes kept RE-BLENDING inks whose COLOR had already drifted
   into the plate (a cream mixed 44% toward a white card IS white;
   multiply, screen and overlay all speak identity on it), and the pale
   anchors carried the plate's own lightness under every flip. The cure
   moved to the INK'S OWN DERIVATION: the coat's every tint-leaning stop
   reads the card's TWIN — the same hue, the same saturation, a lightness
   chosen to carry contrast against the plate.
   1.9.7 — THE TWIN MEASURES IN LIGHT ("the effects vanishing or
   becoming inverted or turn from white to black when the color is going
   to high saturation or high brightness or low brightness or low
   saturation (aka if i pull the color wheel to the most extreme 4
   corners, top left or top right bottom left bottom right) they always
   break, and it varries between finishes how they break, some effects
   become invisible, some turn from bright white to dark black, some just
   shift in hue weirdly, please test each finish with different colors
   (especially yellow in the color suggestions) and fix this, i dont
   wanna see this issue anymore because this project has become too
   long"): the 1.9.6 twin spoke its rail in HSL LIGHTNESS — and the rail
   had a blind corner the wheel's own geometry writes: every FULLY
   SATURATED color sits at HSL L = 0.5 exactly, so the pure hues with
   high LUMINANCE (the suggestion palette's own #ffd400 sunburst, the
   #ffff00 yellow, the greens and cyans) classed LIGHT (their luminance
   clears the 0.78 rail) yet PASSED THROUGH the twin untouched (L <= 0.5
   returned the raw hex) — the inks arrived at the yellow plate carrying
   the plate's own yellow and every multiply seat whispered. The twin now
   measures in PERCEPTUAL LUMINANCE (the same yardstick the ground
   classes read), and its one rail guarantees a MINIMUM DISTANCE from the
   plate on BOTH sides of the wheel: the bright half speaks the shadow
   twin (the 1.9.6 compression where it carries — white keeps its
   measured 65% gray — floored so the mid-bright band never thins: every
   bright plate a full 16% of light away from its ink), the dark half
   speaks the lift twin (luma + 0.16 — the screen seats that own the dark
   grounds receive an ink that already carries its own light). One seam
   at luma 0.5 — both sides carry the full distance, no side ever
   whispers, and no blend flips there; no thresholds to loop past, no
   passthrough for any plate the wheel can name. The lightness itself is
   SOLVED exactly (24 bisection steps against the twin's own luma curve —
   luma is strictly monotone in lightness for every fixed hue and
   saturation, so the solve is unique by construction). Returns '' for a
   colorless card (the theme's mid-toned grounds never class an extreme,
   so the twin is never asked for there). */'''


def main():
    src = open(RIBBON, encoding='utf-8').read()
    # locate the function + its leading comment block
    fn_re = re.compile(r'export function finishInkTwin\(cardColor\) \{[\s\S]*?\n\}')
    m = fn_re.search(src)
    if not m:
        print('FAIL: finishInkTwin not found')
        return 1
    old_fn = m.group(0)
    if 'lumaAt' in old_fn:
        print('already spoken (idempotent)')
        return 0
    # the comment block immediately above the function (the /* ... */
    # that ends on the line before `export function finishInkTwin`)
    before = src[: m.start()]
    cend = before.rstrip().rfind('*/')
    cstart = before.rstrip().rfind('/*')
    if cstart == -1 or cend == -1 or cend < cstart:
        print('FAIL: leading comment block not found')
        return 1
    replaced = src[:cstart] + NEW_COMMENT + '\n' + NEW_FN + src[m.end():]
    open(RIBBON, 'w', encoding='utf-8').write(replaced)
    # sanity: the passthrough retired, the solver seated
    new = open(RIBBON, encoding='utf-8').read()
    assert 'if (l <= 0.5) return' not in new, 'the passthrough survived'
    assert 'lumaAt' in new and 'lum - 0.16' in new and 'lum + 0.16' in new
    print('finishInkTwin re-speaked: the luma rail, both sides, the solver seated')
    return 0


if __name__ == '__main__':
    sys.exit(main())
