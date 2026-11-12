#!/usr/bin/env python3
"""1.4.9 CSS surgery A — THE FINISH FAMILY.
#2/#3 — mumei -> mumeix: rename every class/keyframe, make the streams and
        the falling marks see-through, replace the feather looms with
        X-mark looms, add the star field.
#4  — nuri: the licks' stripes lean toward the card's own color (mask +
        tinted background instead of the fixed gold/ember SVG fills).
#5  — kintsugi: the seventh coat (lacquer body + breathing gold veins +
        drifting mica dust + the slow amber gleam + the sprite's gold).
#6  — the directional insets: every oversized pseudo trims its texture to
        the sides its flight actually travels (roughly halving the raster
        every animated coat owns).
Every edit is anchored on exact source lines; the script verifies each
anchor before writing and refuses to run twice.
"""
import re, sys, io

CSS = 'src/index.css'
src = io.open(CSS, encoding='utf-8').read()
orig = src
fails = []

def sub_once(old, new, label, count=1):
    global src
    n = src.count(old)
    if n != count:
        fails.append(f'{label}: expected {count} match(es), found {n}')
        return
    src = src.replace(old, new)

# --------------------------------------------------------------------------
# 1. MUMEI -> MUMEIX class + keyframe rename (whole-file, mechanical).
# The theme id 'mumei' and .gd-pan-mumei-style names are NOT finish seats —
# they stay untouched; only the gd-finish/gd-mumei-*/gd-artfin-mumei family
# and the gd-mumei-* keyframes rename.
for old, new in [
    ('.gd-finish-mumei', '.gd-finish-mumeix'),
    ('.gd-mumei-streams', '.gd-mumeix-streams'),
    ('.gd-mumei-feathers', '.gd-mumeix-xmarks'),
    ('.gd-mumei-moon', '.gd-mumeix-moon'),
    ('.gd-artfin-mumei', '.gd-artfin-mumeix'),
    ('gd-mumei-ink-sw', 'gd-mumeix-ink-sw'),
    ('gd-mumei-ink-ne', 'gd-mumeix-ink-ne'),
    ('gd-mumei-fall-a', 'gd-mumeix-fall-a'),
    ('gd-mumei-fall-b', 'gd-mumeix-fall-b'),
    ('gd-mumei-moon ', 'gd-mumeix-moon '),
    ('gd-mumei-inkbreath', 'gd-mumeix-inkbreath'),
]:
    n = src.count(old)
    if n == 0:
        fails.append(f'rename {old}: found 0')
    src = src.replace(old, new)

# --------------------------------------------------------------------------
# 2. THE MUMEIX HEADER — rewrite the material notes + the reworked layers.
# 2a. header note (the block from '/* MUMEI — THE NAMELESS INK' to the
# body rule) gets a 1.4.9 preface.
m = re.search(r'/\* MUMEI — THE NAMELESS INK, opalescent\'s successor \(1\.4\.8', src)
if not m:
    fails.append('mumei header: not found')
else:
    sub_once(
        "/* MUMEI — THE NAMELESS INK, opalescent's successor (1.4.8",
        "/* MUMEIX — THE NAMELESS INK, SIGNED WITH ITS X (1.4.9 — \"change\n"
        "   mumei to instead have the wavy lines and feathers more see\n"
        "   through, alongside replacing the feathers with 'x', and add\n"
        "   stars\" + \"chnage instances of mumei to 'mumeix'\"): the sixth coat\n"
        "   keeps its seat under a new name — the same living ink-wash, one\n"
        "   breath lighter and signed with a cross. The STREAMS and the\n"
        "   falling marks step down to veils (a third of their old voice —\n"
        "   see-through water, not painted bands), the quills retire and X\n"
        "   MARKS drift in their place (the anonymous signature: no name,\n"
        "   just the cross it signs with, on two looms at two depths), a\n"
        "   quiet gold STAR FIELD joins the wash on its own seat, and the\n"
        "   moon keeps its halo. Every flight stays compositor-owned (the\n"
        "   1.4.8 CPU law holds — see the directional-inset note below).\n"
        "   The 1.4.8 origin (1.4.8",
        'mumei header preface',
    )

# 2b. THE STREAMS — see-through: cut the stroke alphas down ~2/3 and trim
# the oversized insets to the sides the flights actually travel
# (ink-sw translates (-220, +220): extra TOP + RIGHT only; ink-ne
# translates (+132, -132): extra BOTTOM + LEFT only).
sub_once(
    "  inset: -220px;\n  background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E %3Cg fill='none' stroke-linecap='round'%3E %3Cg stroke='%23ecdfb4'%3E %3Cpath d='M0 36 Q55 22 110 36 T220 36' stroke-width='16' stroke-opacity='0.5'/%3E %3Cpath d='M0 36 Q55 22 110 36 T220 36' stroke-width='7' stroke-opacity='0.4'/%3E %3Cpath d='M0 36 Q55 22 110 36 T220 36' stroke-width='2.4' stroke-opacity='0.5'/%3E %3C/g%3E %3Cg stroke='%23e6d7a6'%3E %3Cpath d='M0 108 Q55 122 110 108 T220 108' stroke-width='15' stroke-opacity='0.42'/%3E %3Cpath d='M0 108 Q55 122 110 108 T220 108' stroke-width='5' stroke-opacity='0.36'/%3E %3Cpath d='M0 108 Q55 122 110 108 T220 108' stroke-width='2' stroke-opacity='0.42'/%3E %3C/g%3E %3Cg stroke='%23f0e0b8'%3E %3Cpath d='M0 176 Q55 162 110 176 T220 176' stroke-width='13' stroke-opacity='0.44'/%3E %3Cpath d='M0 176 Q55 162 110 176 T220 176' stroke-width='6' stroke-opacity='0.38'/%3E %3Cpath d='M0 176 Q55 162 110 176 T220 176' stroke-width='2.2' stroke-opacity='0.44'/%3E %3C/g%3E %3Cg stroke='%23dccfa0' stroke-opacity='0.44' stroke-width='3'%3E",
    "  inset: -220px -220px 0 0;\n  background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E %3Cg fill='none' stroke-linecap='round'%3E %3Cg stroke='%23ecdfb4'%3E %3Cpath d='M0 36 Q55 22 110 36 T220 36' stroke-width='16' stroke-opacity='0.17'/%3E %3Cpath d='M0 36 Q55 22 110 36 T220 36' stroke-width='7' stroke-opacity='0.13'/%3E %3Cpath d='M0 36 Q55 22 110 36 T220 36' stroke-width='2.4' stroke-opacity='0.17'/%3E %3C/g%3E %3Cg stroke='%23e6d7a6'%3E %3Cpath d='M0 108 Q55 122 110 108 T220 108' stroke-width='15' stroke-opacity='0.14'/%3E %3Cpath d='M0 108 Q55 122 110 108 T220 108' stroke-width='5' stroke-opacity='0.12'/%3E %3Cpath d='M0 108 Q55 122 110 108 T220 108' stroke-width='2' stroke-opacity='0.14'/%3E %3C/g%3E %3Cg stroke='%23f0e0b8'%3E %3Cpath d='M0 176 Q55 162 110 176 T220 176' stroke-width='13' stroke-opacity='0.15'/%3E %3Cpath d='M0 176 Q55 162 110 176 T220 176' stroke-width='6' stroke-opacity='0.13'/%3E %3Cpath d='M0 176 Q55 162 110 176 T220 176' stroke-width='2.2' stroke-opacity='0.15'/%3E %3C/g%3E %3Cg stroke='%23dccfa0' stroke-opacity='0.15' stroke-width='3'%3E",
    'mumeix broad streams see-through + directional inset',
)
sub_once(
    "  inset: -132px;\n  background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='132' height='132'%3E %3Cg fill='none' stroke='%23e6d7a6' stroke-linecap='round'%3E %3Cpath d='M0 22 Q33 16 66 22 T132 22' stroke-width='1.4' stroke-opacity='0.5'/%3E %3Cpath d='M0 54 Q33 60 66 54 T132 54' stroke-width='1.1' stroke-opacity='0.42'/%3E %3Cpath d='M0 86 Q33 80 66 86 T132 86' stroke-width='1.4' stroke-opacity='0.48'/%3E %3Cpath d='M0 112 Q33 118 66 112 T132 112' stroke-width='1' stroke-opacity='0.36'/%3E %3C/g%3E %3C/svg%3E\") 0 0 / 132px 132px;",
    "  inset: 0 0 -132px -132px;\n  background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='132' height='132'%3E %3Cg fill='none' stroke='%23e6d7a6' stroke-linecap='round'%3E %3Cpath d='M0 22 Q33 16 66 22 T132 22' stroke-width='1.4' stroke-opacity='0.18'/%3E %3Cpath d='M0 54 Q33 60 66 54 T132 54' stroke-width='1.1' stroke-opacity='0.15'/%3E %3Cpath d='M0 86 Q33 80 66 86 T132 86' stroke-width='1.4' stroke-opacity='0.17'/%3E %3Cpath d='M0 112 Q33 118 66 112 T132 112' stroke-width='1' stroke-opacity='0.13'/%3E %3C/g%3E %3C/svg%3E\") 0 0 / 132px 132px;",
    'mumeix contour lines see-through + directional inset',
)

# 2c. THE X MARKS — replace both feather looms (comment + rules + SVGs)
# with X-mark looms at the same clocks. The whole feathers block (from its
# comment through the gd-mumeix-fall-b keyframes) is replaced wholesale.
feather_block = re.search(
    r'/\* THE FEATHERS — the falling quills.*?@keyframes gd-mumeix-fall-b \{.*?\n\}\n',
    src, re.S)
if not feather_block:
    fails.append('feathers block: not found')
else:
    x_block = """/* THE X MARKS — the falling crosses (1.4.9 — "replacing the feathers
   with 'x'"): two looms of small ink crosses at scattered seats, sizes and
   tilts — the anonymous signature the nameless ink signs with, SEE-
   THROUGH (the 1.4.9 veil law: the marks read as water, not paint). The
   ::before loom carries the broader crosses (a 140x420 tile, each cross a
   two-stroke X whose arms fade at the tile's seam), falling one full 420px
   period on the 29s clock with the sway baked into the keyframes (the
   crosses drift left-right-left as they fall, rotating a hair with the
   drift); ::after carries the fainter second depth on its own slower 41s.
   Both flights transform-only, and the oversized pseudo keeps only the
   side the fall travels (extra TOP — the 1.4.9 directional-inset law). */
.gd-mumeix-xmarks {
  mix-blend-mode: normal;
}
.gd-mumeix-xmarks::before {
  content: '';
  position: absolute;
  inset: -420px -8px 0 -8px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='420'%3E %3Cg fill='none' stroke-linecap='round'%3E %3Cg stroke='%23f0e6cc' stroke-opacity='0.34'%3E %3Cpath d='M22 44 L34 56 M34 44 L22 56' stroke-width='3'/%3E %3Cpath d='M104 128 L112 136 M112 128 L104 136' stroke-width='2.2'/%3E %3Cpath d='M58 236 L68 246 M68 236 L58 246' stroke-width='2.6'/%3E %3Cpath d='M18 322 L26 330 M26 322 L18 330' stroke-width='2'/%3E %3C/g%3E %3Cg stroke='%23aab58a' stroke-opacity='0.3'%3E %3Cpath d='M84 74 L96 86 M96 74 L84 86' stroke-width='2.6'/%3E %3Cpath d='M44 186 L52 194 M52 186 L44 194' stroke-width='2'/%3E %3Cpath d='M116 268 L124 276 M124 268 L116 276' stroke-width='2.2'/%3E %3Cpath d='M70 364 L78 372 M78 364 L70 372' stroke-width='1.8'/%3E %3C/g%3E %3Cg stroke='%23c9b48e' stroke-opacity='0.26'%3E %3Cpath d='M126 40 L132 46 M132 40 L126 46' stroke-width='1.8'/%3E %3Cpath d='M10 148 L18 156 M18 148 L10 156' stroke-width='2.2'/%3E %3Cpath d='M96 310 L106 320 M106 310 L96 320' stroke-width='2'/%3E %3Cpath d='M34 396 L40 402 M40 396 L34 402' stroke-width='1.6'/%3E %3C/g%3E %3C/g%3E %3C/svg%3E") 0 0 / 140px 420px;
  animation: gd-mumeix-fall-a 29s linear infinite;
  animation-delay: calc(var(--gd-fin-ph, 0) * -29s);
}
.gd-mumeix-xmarks::after {
  content: '';
  position: absolute;
  inset: -420px -8px 0 -8px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='420'%3E %3Cg fill='none' stroke-linecap='round'%3E %3Cg stroke='%23f0e6cc' stroke-opacity='0.2'%3E %3Cpath d='M48 70 L60 82 M60 70 L48 82' stroke-width='2.2'/%3E %3Cpath d='M30 226 L38 234 M38 226 L30 234' stroke-width='1.8'/%3E %3Cpath d='M18 380 L26 388 M26 380 L18 388' stroke-width='1.6'/%3E %3C/g%3E %3Cg stroke='%23aab58a' stroke-opacity='0.18'%3E %3Cpath d='M112 148 L124 160 M124 148 L112 160' stroke-width='2'/%3E %3Cpath d='M86 300 L94 308 M94 300 L86 308' stroke-width='1.8'/%3E %3C/g%3E %3Cg stroke='%23c9b48e' stroke-opacity='0.16'%3E %3Cpath d='M64 18 L74 28 M74 18 L64 28' stroke-width='1.6'/%3E %3Cpath d='M126 356 L134 364 M134 356 L126 364' stroke-width='1.4'/%3E %3C/g%3E %3C/g%3E %3C/svg%3E") 0 0 / 140px 420px;
  animation: gd-mumeix-fall-b 41s linear infinite;
  animation-delay: calc(var(--gd-fin-ph, 0) * -41s);
}
"""
    src = src[:feather_block.start()] + x_block + src[feather_block.end():]

# 2d. THE STARS — insert the new star-field seat right after the moon
# keyframes (before the artfin note). Anchored on the inkbreath comment.
sub_once(
    "/* the sprite's ink-light while IMAGE EFFECT is on: a breathing sepia\n   wash (soft-light — the sprite's own shading survives; this is the\n   ink's light over the picture, not a recolor), gold at the crown and\n   sepia at the foot, opacity 0.72 -> 1 on a 10s clock. */",
    "/* THE STARS — the quiet gold field (1.4.9 — \"and add stars\"): small\n"
    "   four-point crosses of light at scattered seats and sizes on a\n"
    "   180px tile, screen-blended (the light the ink reads by), drifting\n"
    "   one period NE on a slow 36s clock — quiet beside the moon's breath,\n"
    "   see-through like everything else this coat speaks. Transform-only,\n"
    "   phase-read, clipped by the seat's own die-cut; the oversized pseudo\n"
    "   keeps only the sides the drift travels (extra BOTTOM + LEFT — the\n"
    "   1.4.9 directional-inset law). */\n"
    ".gd-mumeix-stars {\n"
    "  mix-blend-mode: screen;\n"
    "}\n"
    ".gd-mumeix-stars::before {\n"
    "  content: '';\n"
    "  position: absolute;\n"
    "  inset: 0 0 -180px -180px;\n"
    "  background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E %3Cg fill='%23efdfae'%3E %3Cpath d='M44 36 L47 42.5 L53.5 46 L47 49.5 L44 56 L41 49.5 L34.5 46 L41 42.5 Z' fill-opacity='0.4'/%3E %3Cpath d='M138 84 L140.5 89 L145.5 90.5 L140.5 92 L138 97 L135.5 92 L130.5 90.5 L135.5 89 Z' fill-opacity='0.3'/%3E %3Cpath d='M84 128 L87 134 L93 137 L87 140 L84 146 L81 140 L75 137 L81 134 Z' fill-opacity='0.34'/%3E %3Cpath d='M150 20 L152 24 L156 25 L152 26 L150 30 L148 26 L144 25 L148 24 Z' fill-opacity='0.26'/%3E %3Cpath d='M20 116 L22 120 L26 121 L22 122 L20 126 L18 122 L14 121 L18 120 Z' fill-opacity='0.28'/%3E %3Ccircle cx='96' cy='58' r='1.2' fill-opacity='0.32'/%3E %3Ccircle cx='30' cy='30' r='1' fill-opacity='0.24'/%3E %3Ccircle cx='160' cy='140' r='1.1' fill-opacity='0.26'/%3E %3Ccircle cx='0' cy='90' r='1' fill-opacity='0.22'/%3E %3Ccircle cx='180' cy='90' r='1' fill-opacity='0.22'/%3E %3C/g%3E %3C/svg%3E\") calc(var(--gd-fin-ph, 0) * 180px) 0 / 180px 180px;\n"
    "  animation: gd-mumeix-stars-ne 36s linear infinite;\n"
    "  animation-delay: calc(var(--gd-fin-ph, 0) * -36s);\n"
    "}\n"
    "@keyframes gd-mumeix-stars-ne {\n"
    "  from {\n"
    "    transform: translate(0, 0);\n"
    "  }\n"
    "  to {\n"
    "    transform: translate(180px, -180px);\n"
    "  }\n"
    "}\n"
    "/* the sprite's ink-light while IMAGE EFFECT is on: a breathing sepia\n   wash (soft-light — the sprite's own shading survives; this is the\n   ink's light over the picture, not a recolor), gold at the crown and\n   sepia at the foot, opacity 0.72 -> 1 on a 10s clock. */",
    'mumeix star field seat',
)

# --------------------------------------------------------------------------
# 3. KINTSUGI — insert the whole seventh coat after the foil ripple
# keyframes (before the HOLOGRAPHIC header).
holo_header = "/* HOLOGRAPHIC — the reworked chaos (\"just rework the current one and"
if src.count(holo_header) != 1:
    fails.append('kintsugi anchor: holographic header not found')
else:
    kintsugi = """/* KINTSUGI — THE MENDED LACQUER, the seventh coat (1.4.9 — "after foil
   finish, add a surprise finish for me, up to u to call it and make it
   whatever"): broken pottery repaired in gold, worn like a card. Four
   materials, every flight compositor-owned (the 1.4.8 CPU law holds —
   and the 1.4.9 directional-inset law trims every oversized pseudo to
   the sides its flight actually travels):
   · the BODY (.gd-finish-kintsugi): the LACQUER — a deep urushi wash
     (near-black through the theme's own ink, soft-light so the card's
     printing reads through it the way lacquer holds a picture) with a
     static fine hairline grain baked in, phase-read;
   · the VEINS (.gd-kintsugi-veins): the repair itself — a 160px tile of
     branching GOLD SEAMS (each seam a chain of short strokes forking at
     its joints, like a crack filled with kin no gold), screen-blended,
     breathing their brightness and a hair of scale on a 14s clock. The
     seams arrive soft and hold their glow — mended light, never a
     flash;
   · the MICA (.gd-kintsugi-mica): the fine gold-dust lattice beneath the
     seams — tiny crosses and motes on a 72px tile, drifting one period
     on its own 31s (two depths of gold, the way real kin-tsugi dust
     catches light at different focus);
   · the GLEAM (.gd-kintsugi-gleam): a broad soft AMBER band that rises
     through the whole face every 11s and rests between passes — the
     lacquer's own polish catching a window's light, the one element no
     other coat speaks.
   While IMAGE EFFECT is on the sprite wears the DUST (the artfin below):
   a soft gold wash breathing on a 12s clock — the picture seen through
   gilded lacquer. Nothing this coat paints ever leaves the card (the
   1.4.3 clip law holds). */
.gd-finish-kintsugi {
  background:
    repeating-linear-gradient(
      91deg,
      rgba(0, 0, 0, 0) 0 7px,
      rgba(24, 18, 10, 0.1) 7px 7.5px,
      rgba(0, 0, 0, 0) 7.5px 26px,
      rgba(24, 18, 10, 0.08) 26px 26.5px
    ),
    linear-gradient(
      168deg,
      rgba(21, 16, 10, 0.5) 0%,
      rgba(30, 23, 14, 0.42) 34%,
      rgba(17, 13, 8, 0.48) 66%,
      rgba(26, 20, 12, 0.44) 100%
    );
  mix-blend-mode: soft-light;
}
/* THE VEINS — the gold repair: a 160px tile of branching seams, each seam
   three strokes at falling widths so its edges feather like filled gold,
   forking at its joints. Screen-blended (light, never paint), breathing
   opacity + a hair of scale around the tile's own heart on a 14s clock.
   The oversized pseudo keeps only the sides the breath travels — a scale
   swell needs room on every side, but only a hair of it: the 1.4.9
   directional law keeps 24px, not a full period. */
.gd-kintsugi-veins {
  mix-blend-mode: screen;
}
.gd-kintsugi-veins::before {
  content: '';
  position: absolute;
  inset: -24px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E %3Cg fill='none' stroke-linecap='round'%3E %3Cg stroke='%23f4d67a'%3E %3Cpath d='M6 132 L34 118 L52 124 L78 104' stroke-width='3' stroke-opacity='0.5'/%3E %3Cpath d='M6 132 L34 118 L52 124 L78 104' stroke-width='1.2' stroke-opacity='0.6'/%3E %3Cpath d='M52 124 L66 138 L96 142' stroke-width='2.2' stroke-opacity='0.42'/%3E %3C/g%3E %3Cg stroke='%23ecc76a'%3E %3Cpath d='M118 22 L136 40 L152 38' stroke-width='2.6' stroke-opacity='0.46'/%3E %3Cpath d='M118 22 L108 44 L118 62 L104 84' stroke-width='2' stroke-opacity='0.4'/%3E %3Cpath d='M108 44 L88 52 L74 44' stroke-width='1.6' stroke-opacity='0.34'/%3E %3C/g%3E %3Cg stroke='%23f9e59a'%3E %3Cpath d='M20 46 L44 40 L58 52 L86 48' stroke-width='2.4' stroke-opacity='0.44'/%3E %3Cpath d='M44 40 L52 22 L72 14' stroke-width='1.6' stroke-opacity='0.36'/%3E %3Cpath d='M138 96 L146 118 L134 138' stroke-width='2.2' stroke-opacity='0.42'/%3E %3Cpath d='M146 118 L120 124 L112 142' stroke-width='1.6' stroke-opacity='0.32'/%3E %3C/g%3E %3Cg stroke='%23e0b954' stroke-opacity='0.3'%3E %3Cpath d='M0 82 L18 76 L30 86' stroke-width='1.4'/%3E %3Cpath d='M86 148 L104 140 L118 148' stroke-width='1.4'/%3E %3C/g%3E %3C/g%3E %3C/svg%3E") calc(var(--gd-fin-ph, 0) * 160px) calc(var(--gd-fin-ph, 0) * 160px) / 160px 160px;
  transform-origin: 50% 50%;
  animation: gd-kintsugi-breath 14s ease-in-out infinite;
  animation-delay: calc(var(--gd-fin-ph, 0) * -14s);
}
@keyframes gd-kintsugi-breath {
  0%,
  100% {
    opacity: 0.62;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.035);
  }
}
/* THE MICA — the gold dust: tiny crosses and motes on a 72px tile
   drifting one period on a 31s clock, screen-blended beneath the seams.
   The oversized pseudo keeps only the LEFT side (the drift is +x — the
   1.4.9 directional-inset law). */
.gd-kintsugi-mica {
  mix-blend-mode: screen;
}
.gd-kintsugi-mica::before {
  content: '';
  position: absolute;
  inset: 0 0 0 -72px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72'%3E %3Cg fill='%23f2d382'%3E %3Cpath d='M14 18 L16 22.5 L20.5 24 L16 25.5 L14 30 L12 25.5 L7.5 24 L12 22.5 Z' fill-opacity='0.4'/%3E %3Cpath d='M48 40 L49.6 44 L53.6 45.2 L49.6 46.4 L48 50.4 L46.4 46.4 L42.4 45.2 L46.4 44 Z' fill-opacity='0.3'/%3E %3Cpath d='M30 58 L31.4 62 L35.4 63 L31.4 64.4 L30 68.4 L28.6 64.4 L24.6 63 L28.6 62 Z' fill-opacity='0.34'/%3E %3Ccircle cx='60' cy='12' r='1' fill-opacity='0.3'/%3E %3Ccircle cx='6' cy='44' r='1.1' fill-opacity='0.32'/%3E %3Ccircle cx='38' cy='6' r='0.9' fill-opacity='0.26'/%3E %3Ccircle cx='68' cy='64' r='1' fill-opacity='0.28'/%3E %3Ccircle cx='0' cy='0' r='1' fill-opacity='0.26'/%3E %3Ccircle cx='72' cy='0' r='1' fill-opacity='0.26'/%3E %3C/g%3E %3C/svg%3E") calc(var(--gd-fin-ph, 0) * 72px) 0 / 72px 72px;
  animation: gd-kintsugi-dust 31s linear infinite;
  animation-delay: calc(var(--gd-fin-ph, 0) * -31s);
}
@keyframes gd-kintsugi-dust {
  from {
    transform: translate(0, 0);
  }
  to {
    transform: translate(72px, 0);
  }
}
/* THE GLEAM — the lacquer's polish: a broad soft amber band (a warm core
   with dark-gold skirts, softly arced) that RISES through the whole face
   every 11s and rests between passes. translateY + opacity flight,
   screen-blended, phase-read — nuri's flare law, spoken in gold. */
.gd-kintsugi-gleam {
  mix-blend-mode: screen;
}
.gd-kintsugi-gleam::before {
  content: '';
  position: absolute;
  left: -6%;
  right: -6%;
  top: 52%;
  height: 46%;
  border-radius: 40% 40% 0 0 / 60% 60% 0 0;
  background: linear-gradient(
    to bottom,
    rgba(244, 214, 122, 0) 0%,
    rgba(236, 199, 106, 0.16) 30%,
    rgba(250, 232, 170, 0.3) 50%,
    rgba(228, 178, 84, 0.2) 70%,
    rgba(206, 150, 62, 0) 100%
  );
  animation: gd-kintsugi-gleam 11s ease-in infinite;
  animation-delay: calc(var(--gd-fin-ph, 0) * -11s);
}
@keyframes gd-kintsugi-gleam {
  0%,
  4% {
    transform: translateY(150%);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  26% {
    opacity: 0.9;
  }
  32%,
  100% {
    transform: translateY(-320%);
    opacity: 0;
  }
}
/* the sprite's gilded dust while IMAGE EFFECT is on: a soft gold wash
   breathing on a 12s clock (soft-light — the picture's own shading
   survives; this is lacquer over a photograph, not a recolor). */
.gd-artfin-kintsugi {
  background: linear-gradient(
    176deg,
    rgba(244, 214, 122, 0.3) 0%,
    rgba(224, 185, 84, 0.24) 40%,
    rgba(178, 138, 58, 0.28) 100%
  );
  mix-blend-mode: soft-light;
  animation: gd-kintsugi-dustbreath 12s ease-in-out infinite;
  animation-delay: calc(var(--gd-fin-ph, 0) * -12s);
}
@keyframes gd-kintsugi-dustbreath {
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

"""
    src = src.replace(holo_header, kintsugi + holo_header, 1)

# --------------------------------------------------------------------------
# 4. NURI — the licks lean toward the card's own color (1.4.9 #4). The
# tile's fixed gold/ember gradient fills retire; the pseudo now paints a
# TINT-LEANING gradient masked by the tongues' own alpha (the same SVG
# with WHITE gradient-filled rects — mask alpha = the tongue fade). The
# body veil softens a touch (0.46 -> 0.38) so the plate's own hue reads
# through the fire without a heavy wash.
sub_once(
    "  background: var(--gd-card-tint, var(--gd-panel));\n  opacity: 0.46;\n  mix-blend-mode: overlay;",
    "  background: var(--gd-card-tint, var(--gd-panel));\n  opacity: 0.38;\n  mix-blend-mode: overlay;",
    'nuri body veil softened',
)
licks_rule = re.search(
    r"\.gd-nuri-licks::before \{\n  content: '';\n  position: absolute;\n  inset: -288px 0;\n  background: url\(\"data:image/svg\+xml,[^\"]+\"\) 0 0 / 96px 288px;",
    src)
if not licks_rule:
    fails.append('nuri licks rule: not found')
else:
    new_licks = """.gd-nuri-licks::before {
  content: '';
  position: absolute;
  inset: -288px 0 0 0;
  /* 1.4.9 — THE TONGUES LEAN TOWARD THE CARD'S OWN COLOR ("the finishes
     should have better support to colors , for example nuri's effects
     like the stripes down fit well in orange but not in purple , the
     stripes should sliiightly lean towards color card"): the fixed
     gold/ember/crimson gradient FILLS retired — the pseudo paints a
     WARM-BASED gradient whose every stop color-mixes a whisper of the
     card's own --gd-card-tint (24% at the foot, 16% at the crown), and
     the tongues' own alpha MASK shapes it (the same 96x288 loom, each
     rect speaking WHITE with the tongue's own end-fade — mask alpha is
     the shape). An orange card burns pure gold as it always did; a
     purple card's stripes carry the violet in their ink — SLIGHTLY
     leaning, exactly as asked, the fire never abandoning its warmth. */
  background: linear-gradient(
    to top,
    color-mix(in srgb, var(--gd-card-tint, var(--gd-panel)) 24%, #ff7a26) 0%,
    color-mix(in srgb, var(--gd-card-tint, var(--gd-panel)) 20%, #ffc864) 34%,
    color-mix(in srgb, var(--gd-card-tint, var(--gd-panel)) 16%, #ffe3a0) 52%,
    color-mix(in srgb, var(--gd-card-tint, var(--gd-panel)) 20%, #ffc864) 70%,
    color-mix(in srgb, var(--gd-card-tint, var(--gd-panel)) 24%, #ff7a26) 100%
  );
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='288'%3E %3Cdefs%3E %3ClinearGradient id='m1' x1='0' y1='0' x2='0' y2='1'%3E %3Cstop offset='0' stop-color='%23fff' stop-opacity='0'/%3E %3Cstop offset='0.5' stop-color='%23fff' stop-opacity='1'/%3E %3Cstop offset='1' stop-color='%23fff' stop-opacity='0'/%3E %3C/linearGradient%3E %3C/defs%3E %3Crect x='12' y='6' width='14' height='118' rx='7' fill='url(%23m1)'/%3E %3Crect x='44' y='0' width='9' height='64' rx='4.5' fill='url(%23m1)'/%3E %3Crect x='68' y='132' width='13' height='150' rx='6.5' fill='url(%23m1)'/%3E %3Crect x='86' y='60' width='7' height='96' rx='3.5' fill='url(%23m1)'/%3E %3Crect x='2' y='44' width='8' height='46' rx='4' fill='url(%23m1)'/%3E %3Crect x='30' y='182' width='10' height='84' rx='5' fill='url(%23m1)'/%3E %3Crect x='58' y='220' width='9' height='60' rx='4.5' fill='url(%23m1)'/%3E %3Crect x='76' y='204' width='6' height='40' rx='3' fill='url(%23m1)'/%3E %3Crect x='20' y='104' width='7' height='54' rx='3.5' fill='url(%23m1)'/%3E %3Crect x='50' y='110' width='12' height='128' rx='6' fill='url(%23m1)'/%3E %3Crect x='90' y='156' width='5' height='70' rx='2.5' fill='url(%23m1)'/%3E %3C/svg%3E");
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='288'%3E %3Cdefs%3E %3ClinearGradient id='m1' x1='0' y1='0' x2='0' y2='1'%3E %3Cstop offset='0' stop-color='%23fff' stop-opacity='0'/%3E %3Cstop offset='0.5' stop-color='%23fff' stop-opacity='1'/%3E %3Cstop offset='1' stop-color='%23fff' stop-opacity='0'/%3E %3C/linearGradient%3E %3C/defs%3E %3Crect x='12' y='6' width='14' height='118' rx='7' fill='url(%23m1)'/%3E %3Crect x='44' y='0' width='9' height='64' rx='4.5' fill='url(%23m1)'/%3E %3Crect x='68' y='132' width='13' height='150' rx='6.5' fill='url(%23m1)'/%3E %3Crect x='86' y='60' width='7' height='96' rx='3.5' fill='url(%23m1)'/%3E %3Crect x='2' y='44' width='8' height='46' rx='4' fill='url(%23m1)'/%3E %3Crect x='30' y='182' width='10' height='84' rx='5' fill='url(%23m1)'/%3E %3Crect x='58' y='220' width='9' height='60' rx='4.5' fill='url(%23m1)'/%3E %3Crect x='76' y='204' width='6' height='40' rx='3' fill='url(%23m1)'/%3E %3Crect x='20' y='104' width='7' height='54' rx='3.5' fill='url(%23m1)'/%3E %3Crect x='50' y='110' width='12' height='128' rx='6' fill='url(%23m1)'/%3E %3Crect x='90' y='156' width='5' height='70' rx='2.5' fill='url(%23m1)'/%3E %3C/svg%3E");
  -webkit-mask-size: 96px 288px;
  mask-size: 96px 288px;
  -webkit-mask-repeat: repeat;
  mask-repeat: repeat;"""
    src = src[:licks_rule.start()] + new_licks + src[licks_rule.end():]

# --------------------------------------------------------------------------
# 5. THE DIRECTIONAL INSETS — the 1.4.9 CPU half of every remaining
# oversized pseudo (the mumeix edits above already spoke their own).
sub_once("  inset: -96px 0;\n  background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E %3Cg fill='%23ffb347'",
         "  inset: -96px 0 0 0;\n  background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E %3Cg fill='%23ffb347'",
         'nuri sparks directional inset (rise is +y: extra TOP only)')
# foil sparkle: translate(84px, 0) — extra LEFT only (and the old two-value
# inset left the LEFT edge bare mid-flight, a real 84px dead column).
sub_once("  inset: -84px 0;\n  background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='84'%3E %3Cg fill='%23ffffff'",
         "  inset: 0 -1px 0 -84px;\n  background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='84'%3E %3Cg fill='%23ffffff'",
         'foil sparkle directional inset (drift is +x: extra LEFT only)')
# holo chaos ::before: translate(128,128) — extra BOTTOM + LEFT.
sub_once("  inset: -128px;\n  background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E %3Cg%3E %3Cpath d='M18 12",
         "  inset: 0 0 -128px -128px;\n  background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E %3Cg%3E %3Cpath d='M18 12",
         'holo chaos lattice directional inset (NE drift: extra BOTTOM + LEFT)')
# holo shards: translate(-64, 0) — extra RIGHT only.
sub_once("  inset: -64px;\n  background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E %3Cg%3E %3Cpath d='M10 10",
         "  inset: 0 -64px 0 0;\n  background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E %3Cg%3E %3Cpath d='M10 10",
         'holo shards directional inset (SW drift: extra RIGHT only)')
# holo dots: translate(72, 0) — extra LEFT only.
sub_once(".gd-holo-dots {\n  position: absolute;\n  inset: 0;",
         ".gd-holo-dots {\n  position: absolute;\n  inset: 0 0 0 -72px;",
         'holo dots directional inset (+x drift: extra LEFT only)')
# prism waves ::before: translate(96,-96) — extra BOTTOM + LEFT.
sub_once("  inset: -96px;\n  background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E %3Cpath d='M0 12",
         "  inset: 0 0 -96px -96px;\n  background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E %3Cpath d='M0 12",
         'prism waves directional inset (NE drift: extra BOTTOM + LEFT)')
# prism waves ::after: translate(-48,48) — extra TOP + RIGHT.
sub_once("  inset: -48px;\n  background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E %3Cg fill='%23ffffff'%3E %3Cpath d='M12 8",
         "  inset: -48px -48px 0 0;\n  background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E %3Cg fill='%23ffffff'%3E %3Cpath d='M12 8",
         'prism sparks directional inset (SW drift: extra TOP + RIGHT)')

# --------------------------------------------------------------------------
# 6. THE STILL + FREEZE LISTS gain the mumeix star seat and the kintsugi
# family (every list that already names the mumei family).
for old, new, label in [
    (
        "  .gd-finish-mumeix,\n  .gd-finish-foil,",
        "  .gd-finish-mumeix,\n  .gd-kintsugi-veins,\n  .gd-kintsugi-mica,\n  .gd-kintsugi-gleam,\n  .gd-finish-foil,",
        'reduced-motion media list',
    ),
    (
        "  .gd-mumeix-streams,\n  .gd-mumeix-xmarks,\n  .gd-mumeix-moon,",
        "  .gd-mumeix-streams,\n  .gd-mumeix-xmarks,\n  .gd-mumeix-stars,\n  .gd-mumeix-moon,",
        'reduced-motion media list (stars)',
    ),
    (
        "  .gd-artfin-mumeix,\n  .gd-artfin-nuri,",
        "  .gd-artfin-mumeix,\n  .gd-artfin-kintsugi,\n  .gd-artfin-nuri,",
        'reduced-motion artfin list',
    ),
]:
    sub_once(old, new, label)

# The gd-coats-frozen freeze family: extend the same way. The freeze law's
# own seat list lives under ':root.gd-coats-frozen' — its member rows are
# prefixed ':root.gd-coats-frozen ' / ':root.gd-flight '.
freeze_pairs = [
    (":root.gd-coats-frozen [data-gd-region] .gd-card-face-finish *,\n:root.gd-coats-frozen [data-gd-region] .gd-card-face-finish *::before,\n:root.gd-coats-frozen [data-gd-region] .gd-card-face-finish *::after,\n:root.gd-coats-frozen [data-gd-region] .gd-card-face-artfin,",
     ":root.gd-coats-frozen [data-gd-region] .gd-card-face-finish *,\n:root.gd-coats-frozen [data-gd-region] .gd-card-face-finish *::before,\n:root.gd-coats-frozen [data-gd-region] .gd-card-face-finish *::after,\n:root.gd-coats-frozen [data-gd-region] .gd-card-face-artfin,"),
]
# The freeze block's children catch-all (`.gd-card-face-finish *`) already
# reaches the new child seats (veins/mica/gleam/stars are CHILD SPANS of
# the finish seat? No — they are their own .gd-card-face-finish seats with
# pseudos). The catch-all list covers .gd-card-face-finish::before/::after
# and children — every new seat is itself a .gd-card-face-finish span, so
# the FIRST three rows of the freeze list already cover them. Verify the
# freeze list contains .gd-card-face-finish rows (it does) — no edit needed.

# --------------------------------------------------------------------------
if fails:
    print('SURGERY A REFUSED — anchors not found:')
    for f in fails:
        print('  · ' + f)
    sys.exit(1)

if src == orig:
    print('SURGERY A: nothing changed?!')
    sys.exit(1)

io.open(CSS, 'w', encoding='utf-8').write(src)
print('SURGERY A OK — mumeix rework + kintsugi + nuri lean + directional insets')
print(f'  bytes: {len(orig)} -> {len(src)}')
