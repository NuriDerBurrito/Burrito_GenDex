#!/usr/bin/env python3
"""1.9.3 finish surgery — THE SPEAKING COAT, spoken on the coat's own sheet.

Three laws, all on src/index.css:

1. THE TRUE X ("the x's in numeix theme should be actual xs , not as in the
   letter but like rotated '+' so its a well fit as an x and doesnt feel
   stretched , it may be bigger or smaller in size thats it, should also be
   semi thick stroked not thin or bolded. aka '✖'"): the 1.6.7 calligraphic
   four-arm curves retire — every mark is a true rotated-plus ✖ now: TWO
   STRAIGHT DIAGONALS crossing at the heart, round caps, semi-thick strokes
   (2.4-3.5 against 12-20px spans — never thin, never bold), the sizes still
   varied mark to mark. The glyph speaks as a MASK; the ink arrives from the
   card's own color (law 2).

2. THE COAT SPEAKS THE CARD'S OWN COLOR ("fix color dependency in finishes
   so they fit the card color ... numeix should color its effects towards
   the card color instead of the creamy effect, it would be creamy in the
   color of the card still / foil should normally lean towards card color
   too npt always towards blue / auric currently leans towards yellowish,
   make it lean towards card color too"): the nuri law (1.4.9's
   gradient-masked tint lean, 1.5.0's premultiplied stops) reaches the
   three named coats. Every SVG tile that spoke fixed inks (numeix's
   dapple / streams / X marks / stars, foil's sparkle lattice, auric's
   gems / flakes / filaments) becomes its own ALPHA MASK over a gradient
   whose every stop is color-mix(in srgb, var(--gd-card-tint,
   var(--gd-panel)) X%, <the material's own anchor>) — the anchors keep
   each material's character (numeix's creams, foil's bright metal
   register, auric's golds) while the tint carries the CARD'S OWN HUE, so
   the effect is creamy IN the color of the card. The gradient stops that
   were already CSS (numeix's moon + artfin, foil's body + rings +
   ripple, auric's honey + sweep + summon glow + artfin) lean the same
   way with the premultiplied law (transparent X% wraps keep each stop's
   alpha exact while the hue leans). Holographic and prismatic keep every
   word they always spoke ("holographic is good as it is", "prismatic is
   also good as it is"); nuri already spoke the law.

3. THE EXTREME GROUNDS ("in some color values especially when i lean
   towards black or white or high saturation, the finishes would dissapear
   or would be covered, fix that so they still are visible"): the seats
   class the picked plate (finishGroundTone in TagRibbon.jsx writes
   gd-fin-ground-light / -dark / -vivid on the card root) and the blend
   families answer: light grounds turn the luminous screen seats (and the
   soft-light bodies) into MULTIPLY tints — light on white finally reads
   as color; dark grounds turn the soft-light bodies into SCREEN — the
   veil glows instead of sinking into black; vivid grounds turn the
   bodies into OVERLAY — the plate's saturation amplifies the wash's
   anchors instead of covering the coat. The X ink needs no law: its
   mid-tone anchors already separate from both extremes.

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS = ROOT / "src/index.css"

css = CSS.read_text(encoding="utf8")

TINT = "var(--gd-card-tint, var(--gd-panel))"


def retint(start_anchor: str, end_anchor: str, pattern: str, decls, note: str) -> None:
    """Inside the slice bounded by [start_anchor, end_anchor): (1) replace the
    `pattern` (matched once) with the new declarations alone, and (2) seat the
    law note ABOVE the rule's own selector line. The anchors are untouched."""
    global css
    i = css.index(start_anchor)
    j = css.index(end_anchor, i)
    slice_ = css[i:j]
    new_slice, cnt = re.subn(pattern, decls, slice_, count=1)
    assert cnt == 1, f"{start_anchor[:44]!r}: the pattern never spoke"
    # the selector line the note rides above (the rule's own opening line)
    m = re.match(r"(\.[\w-]+(?:::[a-z-]+)? \{)", new_slice)
    assert m, f"{start_anchor[:44]!r}: the selector line never spoke"
    new_slice = new_slice.replace(m.group(1), note + m.group(1), 1)
    css = css[:i] + new_slice + css[j:]


# ---------------------------------------------------------------------------
# 1. NUMEIX — the body's paper grain speaks the card's own color
# ---------------------------------------------------------------------------
retint(
    ".gd-finish-numeix {",
    "/* THE DAPPLE",
    r"  background:\n    url\(\"(data:image/svg\+xml,[^\"]+)\"\) calc\(var\(--gd-fin-ph, 0\) \* 64px\) calc\(var\(--gd-fin-ph, 0\) \* 64px\) / 64px 64px;",
    lambda m: (
        f"  background-color: color-mix(in srgb, {TINT} 58%, #4a3422 42%);\n"
        + f'  -webkit-mask-image: url("{m.group(1)}");\n'
        + "  -webkit-mask-position: calc(var(--gd-fin-ph, 0) * 64px) calc(var(--gd-fin-ph, 0) * 64px);\n"
        + "  -webkit-mask-size: 64px 64px;\n"
        + "  -webkit-mask-repeat: repeat;\n"
        + f'  mask-image: url("{m.group(1)}");\n'
        + "  mask-position: calc(var(--gd-fin-ph, 0) * 64px) calc(var(--gd-fin-ph, 0) * 64px);\n"
        + "  mask-size: 64px 64px;\n"
        + "  mask-repeat: repeat;"
    ),
    """/* 1.9.3 — THE TOOTH LEANS TOO (the coat's own card-color law, spoken at
   the body): the grain's fixed brown dots become the tile's own ALPHA MASK
   over a color-mix of --gd-card-tint with the old ink — the whisper of
   tooth now carries the card's hue the way every louder element does
   (soft-light keeps its seat; the phase still bakes the static offset,
   now through mask-position). */
""",
)
print("  numeix body: the tooth leans")

# ---------------------------------------------------------------------------
# 2. NUMEIX — the dapple: mask + card-leaning gradient
# ---------------------------------------------------------------------------
retint(
    ".gd-numeix-dapple::before {",
    "@keyframes gd-numeix-dapple-sw",
    r"  background: url\(\"(data:image/svg\+xml,[^\"]+)\"\) 0 0 / 240px 240px;",
    lambda m: (
        "  background: linear-gradient(\n"
        + "    115deg,\n"
        + f"    color-mix(in srgb, {TINT} 36%, #fff6d8) 0%,\n"
        + f"    color-mix(in srgb, {TINT} 50%, #f6e6b0) 36%,\n"
        + f"    color-mix(in srgb, {TINT} 32%, #fff3cf) 62%,\n"
        + f"    color-mix(in srgb, {TINT} 46%, #f0dca2) 100%\n"
        + "  );\n"
        + f'  -webkit-mask-image: url("{m.group(1)}");\n'
        + "  -webkit-mask-size: 240px 240px;\n"
        + "  -webkit-mask-repeat: repeat;\n"
        + f'  mask-image: url("{m.group(1)}");\n'
        + "  mask-size: 240px 240px;\n"
        + "  mask-repeat: repeat;"
    ),
    """/* 1.9.3 — THE SUNLIGHT CARRIES THE CARD'S OWN COLOR ("numeix should
   color its effects towards the card color instead of the creamy effect,
   it would be creamy in the color of the card still"): the warm patch tile
   becomes its own ALPHA MASK (every ellipse and spark dot keeping its own
   stop-opacity) over a gradient of card-tint-mixed creams — sun through
   leaves, yes, but leaves over the CARD'S own sky. The screen seat and
   both flights keep every word they spoke. */
""",
)
print("  numeix dapple: the sun carries the card's color")

# ---------------------------------------------------------------------------
# 3. NUMEIX — the streams: mask + card-leaning gradient
# ---------------------------------------------------------------------------
retint(
    ".gd-numeix-streams::after {",
    "@keyframes gd-numeix-ink-ne",
    r"  background: url\(\"(data:image/svg\+xml,[^\"]+)\"\) 0 0 / 132px 132px;",
    lambda m: (
        "  background: linear-gradient(\n"
        + "    104deg,\n"
        + f"    color-mix(in srgb, {TINT} 42%, #f2e6bc) 0%,\n"
        + f"    color-mix(in srgb, {TINT} 54%, #e6d7a6) 50%,\n"
        + f"    color-mix(in srgb, {TINT} 38%, #cfc08e) 100%\n"
        + "  );\n"
        + f'  -webkit-mask-image: url("{m.group(1)}");\n'
        + "  -webkit-mask-size: 132px 132px;\n"
        + "  -webkit-mask-repeat: repeat;\n"
        + f'  mask-image: url("{m.group(1)}");\n'
        + "  mask-size: 132px 132px;\n"
        + "  mask-repeat: repeat;"
    ),
    """/* 1.9.3 — THE CURRENT SPEAKS THE CARD'S HUE (the coat's card-color law):
   the fine contour lines keep their own seats and opacities as the tile's
   ALPHA MASK; the ink arrives from a gradient of card-tint-mixed pale
   golds — the quiet current behind everything else, flowing in the card's
   own color. */
""",
)
print("  numeix streams: the current leans")

# ---------------------------------------------------------------------------
# 4. NUMEIX — THE TRUE X: both looms redrawn as rotated-plus crosses
# ---------------------------------------------------------------------------
XMARK_NOTE = """/* 1.9.3 — THE TRUE X ("the x's in numeix theme should be actual xs , not
   as in the letter but like rotated '+' so its a well fit as an x and
   doesnt feel stretched , it may be bigger or smaller in size thats it,
   should also be semi thick stroked not thin or bolded. aka '✖'"): the
   1.6.7 calligraphic curves — four bowed arms pinching short of the
   heart, the glyph the eye read as "stretched" — retire wholesale. Every
   mark is a TRUE ROTATED PLUS now: two straight diagonals crossing AT the
   center, round caps, SEMI-THICK strokes (2.4-3.5 against 12-20px spans
   — the weight between the 1.4.9's thin ruled lines and a bold ✖), the
   sizes still varied mark to mark and the three depth tiers still keeping
   their seats. The glyph speaks as the tile's own ALPHA MASK; the INK is
   the card's own color ("creamy in the color of the card still"): a
   five-stop gradient of card-tint-mixed creams whose two mid-tone anchors
   (#b39a68 / #9c8560) hold the mark's presence on even a white or black
   plate. The fall, the sway, the twinkle: untouched, exactly as they
   flew. */
"""
X_A_MASK = (
    "%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='420'%3E "
    "%3Cg fill='none' stroke='%23fff' stroke-linecap='round'%3E "
    "%3Cg stroke-opacity='0.62'%3E "
    "%3Cpath d='M20 36 L38 54 M20 54 L38 36' stroke-width='3.2'/%3E "
    "%3Cpath d='M102 120 L116 134 M102 134 L116 120' stroke-width='2.8'/%3E "
    "%3Cpath d='M54 226 L74 246 M54 246 L74 226' stroke-width='3.5'/%3E "
    "%3Cpath d='M9 316 L21 328 M9 328 L21 316' stroke-width='2.6'/%3E "
    "%3C/g%3E "
    "%3Cg stroke-opacity='0.5'%3E "
    "%3Cpath d='M82 64 L98 80 M82 80 L98 64' stroke-width='3'/%3E "
    "%3Cpath d='M42 178 L54 190 M42 190 L54 178' stroke-width='2.6'/%3E "
    "%3Cpath d='M114 260 L128 274 M114 274 L128 260' stroke-width='2.9'/%3E "
    "%3Cpath d='M68 346 L80 358 M68 358 L80 346' stroke-width='2.5'/%3E "
    "%3C/g%3E "
    "%3Cg stroke-opacity='0.4'%3E "
    "%3Cpath d='M123 29 L135 41 M123 41 L135 29' stroke-width='2.5'/%3E "
    "%3Cpath d='M7 141 L23 157 M7 157 L23 141' stroke-width='3'/%3E "
    "%3Cpath d='M96 302 L108 314 M96 314 L108 302' stroke-width='2.6'/%3E "
    "%3Cpath d='M29 389 L41 401 M29 401 L41 389' stroke-width='2.4'/%3E "
    "%3C/g%3E "
    "%3C/g%3E "
    "%3C/svg%3E"
)
X_B_MASK = (
    "%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='420'%3E "
    "%3Cg fill='none' stroke='%23fff' stroke-linecap='round'%3E "
    "%3Cg stroke-opacity='0.4'%3E "
    "%3Cpath d='M44 60 L62 78 M44 78 L62 60' stroke-width='3.2'/%3E "
    "%3Cpath d='M26 216 L42 232 M26 232 L42 216' stroke-width='3'/%3E "
    "%3Cpath d='M15 372 L29 386 M15 386 L29 372' stroke-width='2.7'/%3E "
    "%3C/g%3E "
    "%3Cg stroke-opacity='0.34'%3E "
    "%3Cpath d='M106 140 L124 158 M106 158 L124 140' stroke-width='3.2'/%3E "
    "%3Cpath d='M83 293 L97 307 M83 307 L97 293' stroke-width='2.8'/%3E "
    "%3C/g%3E "
    "%3Cg stroke-opacity='0.3'%3E "
    "%3Cpath d='M60 12 L76 28 M60 28 L76 12' stroke-width='3'/%3E "
    "%3Cpath d='M121 348 L135 362 M121 362 L135 348' stroke-width='2.7'/%3E "
    "%3C/g%3E "
    "%3C/g%3E "
    "%3C/svg%3E"
)


def xmark_decls(mask_uri: str, dim: bool) -> str:
    w = 6 if dim else 0  # the far loom leans a touch deeper on the tint
    stops = [
        (44 + w, "#fff6da", 0),
        (60 + w, "#f0e6cc", 28),
        (44 + w, "#b39a68", 52),
        (38 + w, "#9c8560", 70),
        (46 + w, "#fff2cf", 100),
    ]
    lines = ",\n".join(f"    color-mix(in srgb, {TINT} {w_}%, {c}) {p}%" for w_, c, p in stops)
    return (
        "  background: linear-gradient(\n    104deg,\n" + lines + "\n  );\n"
        + f'  -webkit-mask-image: url("data:image/svg+xml,{mask_uri}");\n'
        + "  -webkit-mask-size: 140px 420px;\n"
        + "  -webkit-mask-repeat: repeat;\n"
        + f'  mask-image: url("data:image/svg+xml,{mask_uri}");\n'
        + "  mask-size: 140px 420px;\n"
        + "  mask-repeat: repeat;"
    )


retint(
    ".gd-numeix-xmarks::before {",
    ".gd-numeix-xmarks::after {",
    r"  background: url\(\"data:image/svg\+xml,[^\"]+\"\) 0 0 / 140px 420px;",
    lambda m: xmark_decls(X_A_MASK, dim=False),
    XMARK_NOTE,
)
retint(
    ".gd-numeix-xmarks::after {",
    "/* 1.5.0 — THE FALL, DEFINED AT LAST",
    r"  background: url\(\"data:image/svg\+xml,[^\"]+\"\) 0 0 / 140px 420px;",
    lambda m: xmark_decls(X_B_MASK, dim=True),
    XMARK_NOTE,
)
print("  numeix x marks: the true X, inked in the card's own color")

# ---------------------------------------------------------------------------
# 5. NUMEIX — the moon + the stars + the artfin lean
# ---------------------------------------------------------------------------
retint(
    ".gd-numeix-moon::before {",
    "@keyframes gd-numeix-moon",
    r"  background: radial-gradient\(\n    closest-side,\n    rgba\(238, 226, 186, 0\.62\) 0%,\n    rgba\(202, 212, 158, 0\.5\) 42%,\n    rgba\(170, 181, 138, 0\.34\) 68%,\n    rgba\(0, 0, 0, 0\) 100%\n  \);",
    lambda m: (
        "  background: radial-gradient(\n"
        + "    closest-side,\n"
        + f"    color-mix(in srgb, transparent 38%, color-mix(in srgb, {TINT} 54%, #fff0c6)) 0%,\n"
        + f"    color-mix(in srgb, transparent 50%, color-mix(in srgb, {TINT} 44%, #e2dec0)) 42%,\n"
        + f"    color-mix(in srgb, transparent 66%, color-mix(in srgb, {TINT} 36%, #b8bf9a)) 68%,\n"
        + "    rgba(0, 0, 0, 0) 100%\n  );"
    ),
    """/* 1.9.3 — THE HALO CARRIES THE CARD'S OWN COLOR (the coat's card-color
   law, premultiplied: every stop keeps its exact alpha while the hue
   leans — the sage-gold fringe becomes the card's own hue at the same
   breath). */
""",
)
print("  numeix moon: the halo leans")

retint(
    ".gd-numeix-stars::before {",
    "@keyframes gd-numeix-stars-ne",
    r"  background: url\(\"(data:image/svg\+xml,[^\"]+)\"\) calc\(var\(--gd-fin-ph, 0\) \* 180px\) 0 / 180px 180px;",
    lambda m: (
        "  background: linear-gradient(\n"
        + "    120deg,\n"
        + f"    color-mix(in srgb, {TINT} 40%, #fff4c8) 0%,\n"
        + f"    color-mix(in srgb, {TINT} 54%, #efdfae) 100%\n"
        + "  );\n"
        + f'  -webkit-mask-image: url("{m.group(1)}");\n'
        + "  -webkit-mask-position: calc(var(--gd-fin-ph, 0) * 180px) 0;\n"
        + "  -webkit-mask-size: 180px 180px;\n"
        + "  -webkit-mask-repeat: repeat;\n"
        + f'  mask-image: url("{m.group(1)}");\n'
        + "  mask-position: calc(var(--gd-fin-ph, 0) * 180px) 0;\n"
        + "  mask-size: 180px 180px;\n"
        + "  mask-repeat: repeat;"
    ),
    """/* 1.9.3 — THE STARFIELD CARRIES THE CARD'S OWN COLOR (the coat's
   card-color law): the four-point crosses and spark dots keep their seats
   and opacities as the tile's own ALPHA MASK (the phase still bakes the
   static offset — through mask-position now); the light arrives from a
   gradient of card-tint-mixed pale golds. */
""",
)
print("  numeix stars: the field leans")

retint(
    ".gd-artfin-numeix {",
    "@keyframes gd-numeix-inkbreath",
    r"  background: linear-gradient\(\n    176deg,\n    rgba\(238, 226, 186, 0\.56\) 0%,\n    rgba\(210, 196, 158, 0\.46\) 34%,\n    rgba\(160, 132, 92, 0\.5\) 66%,\n    rgba\(120, 94, 62, 0\.56\) 100%\n  \);",
    lambda m: (
        "  background: linear-gradient(\n"
        + "    176deg,\n"
        + f"    color-mix(in srgb, transparent 44%, color-mix(in srgb, {TINT} 52%, #fff0c8)) 0%,\n"
        + f"    color-mix(in srgb, transparent 54%, color-mix(in srgb, {TINT} 46%, #f2e4b6)) 34%,\n"
        + f"    color-mix(in srgb, transparent 50%, color-mix(in srgb, {TINT} 42%, #a8845c)) 66%,\n"
        + f"    color-mix(in srgb, transparent 44%, color-mix(in srgb, {TINT} 36%, #705034)) 100%\n"
        + "  );"
    ),
    """/* 1.9.3 — THE INK'S LIGHT OVER THE PICTURE LEANS TOO (the coat's
   card-color law, premultiplied — every alpha exact, the sepia band
   becoming the card's own hue at the same breath). */
""",
)
print("  numeix artfin: the ink's light leans")

# ---------------------------------------------------------------------------
# 6. FOIL — the metal leans toward the card's own color
# ---------------------------------------------------------------------------
retint(
    ".gd-finish-foil {",
    ".gd-finish-foil::before {",
    r"  background: linear-gradient\(\n    163deg,\n    rgba\(122, 108, 220, 0\.42\) 0%,\n    rgba\(148, 128, 232, 0\.36\) 26%,\n    rgba\(178, 112, 228, 0\.36\) 47%,\n    rgba\(212, 98, 204, 0\.38\) 66%,\n    rgba\(238, 112, 168, 0\.4\) 84%,\n    rgba\(150, 92, 158, 0\.42\) 100%\n  \);",
    lambda m: (
        "  background: linear-gradient(\n"
        + "    163deg,\n"
        + f"    color-mix(in srgb, transparent 58%, color-mix(in srgb, {TINT} 52%, #9a86d8)) 0%,\n"
        + f"    color-mix(in srgb, transparent 64%, color-mix(in srgb, {TINT} 46%, #b49ee8)) 26%,\n"
        + f"    color-mix(in srgb, transparent 64%, color-mix(in srgb, {TINT} 44%, #c89aec)) 47%,\n"
        + f"    color-mix(in srgb, transparent 62%, color-mix(in srgb, {TINT} 46%, #e0a4d6)) 66%,\n"
        + f"    color-mix(in srgb, transparent 60%, color-mix(in srgb, {TINT} 42%, #f0b8ce)) 84%,\n"
        + f"    color-mix(in srgb, transparent 58%, color-mix(in srgb, {TINT} 54%, #a87898)) 100%\n"
        + "  );"
    ),
    """/* 1.9.3 — THE METAL SPEAKS THE CARD'S OWN COLOR ("foil should normally
   lean towards card color too npt always towards blue"): the violet body
   was a fixed cool wash — every card's foil read blue no matter what the
   plate said. Every stop now premultiplied-leans the card's tint at
   ~42-54% while the anchors keep the BRIGHT metal register (the pale
   lilac crown, the rose-pink skirt) — a blue card's foil stays the cold
   chrome it always was; a red card's foil burns rose-gold; a green
   card's reads verdigris. The hue-ride keeps oscillating AROUND the
   card's own hue now (the metal's living temperament, never a fixed
   blue word). */
""",
)
print("  foil body: the metal leans")

retint(
    ".gd-finish-foil::before {",
    "@keyframes gd-foil-gleam",
    r"  background: repeating-radial-gradient\(\n    ellipse 150% 110% at 50% 46%,\n    rgba\(216, 196, 255, 0\.46\) 0 1\.5px,\n    rgba\(0, 0, 0, 0\) 1\.5px 7\.5px,\n    rgba\(255, 170, 226, 0\.36\) 7\.5px 9px,\n    rgba\(0, 0, 0, 0\) 9px 15px\n  \);",
    lambda m: (
        "  background: repeating-radial-gradient(\n"
        + "    ellipse 150% 110% at 50% 46%,\n"
        + f"    color-mix(in srgb, transparent 54%, color-mix(in srgb, {TINT} 50%, #d8c4ff)) 0 1.5px,\n"
        + "    rgba(0, 0, 0, 0) 1.5px 7.5px,\n"
        + f"    color-mix(in srgb, transparent 64%, color-mix(in srgb, {TINT} 44%, #ffaae2)) 7.5px 9px,\n"
        + "    rgba(0, 0, 0, 0) 9px 15px\n  );"
    ),
    """/* 1.9.3 — THE RINGS LEAN TOO (the coat's card-color law, premultiplied):
   the concentric heart keeps its geometry and its soft-light seat; the
   two ring inks lean the card's tint at half their voice. */
""",
)
print("  foil rings: the heart leans")

retint(
    ".gd-finish-foil-ripples::before {",
    "@keyframes gd-foil-sparkle",
    r"  background: url\(\"(data:image/svg\+xml,[^\"]+)\"\) calc\(var\(--gd-fin-ph, 0\) \* 84px\) 0 / 84px 84px;",
    lambda m: (
        "  background: linear-gradient(\n"
        + "    100deg,\n"
        + f"    color-mix(in srgb, {TINT} 30%, #ffffff) 0%,\n"
        + f"    color-mix(in srgb, {TINT} 46%, #ffeef8) 100%\n"
        + "  );\n"
        + f'  -webkit-mask-image: url("{m.group(1)}");\n'
        + "  -webkit-mask-position: calc(var(--gd-fin-ph, 0) * 84px) 0;\n"
        + "  -webkit-mask-size: 84px 84px;\n"
        + "  -webkit-mask-repeat: repeat;\n"
        + f'  mask-image: url("{m.group(1)}");\n'
        + "  mask-position: calc(var(--gd-fin-ph, 0) * 84px) 0;\n"
        + "  mask-size: 84px 84px;\n"
        + "  mask-repeat: repeat;"
    ),
    """/* 1.9.3 — THE SPARKLE LATTICE LEANS TOO (the coat's card-color law):
   the four-point sparks keep their seats and opacities as the tile's own
   ALPHA MASK (the phase still bakes the static offset — through
   mask-position now); the light arrives mostly-bright with the card's
   own hue whispering through it. */
""",
)
print("  foil sparkle: the lattice leans")

retint(
    ".gd-foil-ripple {",
    "@keyframes gd-foil-ripple",
    r"  background: radial-gradient\(\n    ellipse 62% 46% at 50% 46%,\n    rgba\(0, 0, 0, 0\) calc\(100% - 2\.5px\),\n    rgba\(255, 244, 255, 0\.44\) calc\(100% - 2\.5px\),\n    rgba\(255, 244, 255, 0\.44\) calc\(100% - 1px\),\n    rgba\(0, 0, 0, 0\) calc\(100% - 1px\)\n  \);",
    lambda m: (
        "  background: radial-gradient(\n"
        + "    ellipse 62% 46% at 50% 46%,\n"
        + "    rgba(0, 0, 0, 0) calc(100% - 2.5px),\n"
        + f"    color-mix(in srgb, transparent 56%, color-mix(in srgb, {TINT} 38%, #fff4ff)) calc(100% - 2.5px),\n"
        + f"    color-mix(in srgb, transparent 56%, color-mix(in srgb, {TINT} 38%, #fff4ff)) calc(100% - 1px),\n"
        + "    rgba(0, 0, 0, 0) calc(100% - 1px)\n  );"
    ),
    """/* 1.9.3 — THE ARRIVING RING LEANS TOO (the coat's card-color law,
   premultiplied — the bright water-ring keeps its alpha and its arrive-
   soft flight; the highlight reads the card's own hue at a whisper). */
""",
)
print("  foil ripple: the ring leans")

# ---------------------------------------------------------------------------
# 7. AURIC — the gold leans toward the card's own color
# ---------------------------------------------------------------------------
retint(
    ".gd-finish-auric {",
    "/* THE GEMS",
    r"  background: linear-gradient\(\n    168deg,\n    rgba\(64, 44, 16, 0\.24\) 0%,\n    rgba\(84, 60, 22, 0\.18\) 34%,\n    rgba\(56, 38, 12, 0\.22\) 66%,\n    rgba\(74, 52, 18, 0\.2\) 100%\n  \);",
    lambda m: (
        "  background: linear-gradient(\n"
        + "    168deg,\n"
        + f"    color-mix(in srgb, transparent 76%, color-mix(in srgb, {TINT} 48%, #402c10)) 0%,\n"
        + f"    color-mix(in srgb, transparent 82%, color-mix(in srgb, {TINT} 44%, #543c16)) 34%,\n"
        + f"    color-mix(in srgb, transparent 78%, color-mix(in srgb, {TINT} 50%, #38260c)) 66%,\n"
        + f"    color-mix(in srgb, transparent 80%, color-mix(in srgb, {TINT} 46%, #4a3412)) 100%\n"
        + "  );"
    ),
    """/* 1.9.3 — THE HONEY SPEAKS THE CARD'S OWN COLOR ("auric currently leans
   towards yellowish , make it lean towards card color too"): the amber
   veil's every stop premultiplied-leans the card's tint at ~44-50% while
   the dark anchors keep the leaf's weight — a yellow card's auric stays
   the honey it always was; a blue card's reads as cold gilt; a purple
   card's as royal amethyst leaf. The soft-light seat keeps its word. */
""",
)
print("  auric honey: the veil leans")

retint(
    ".gd-auric-currents::before {",
    "@keyframes gd-auric-run",
    r"  background: url\(\"(data:image/svg\+xml,[^\"]+)\"\) 0 0 / 120px 120px;",
    lambda m: (
        "  background: linear-gradient(\n"
        + "    118deg,\n"
        + f"    color-mix(in srgb, {TINT} 42%, #fff0bc) 0%,\n"
        + f"    color-mix(in srgb, {TINT} 52%, #ffd98f) 34%,\n"
        + f"    color-mix(in srgb, {TINT} 58%, #f6d77e) 62%,\n"
        + f"    color-mix(in srgb, {TINT} 46%, #ffe9b0) 100%\n"
        + "  );\n"
        + f'  -webkit-mask-image: url("{m.group(1)}");\n'
        + "  -webkit-mask-size: 120px 120px;\n"
        + "  -webkit-mask-repeat: repeat;\n"
        + f'  mask-image: url("{m.group(1)}");\n'
        + "  mask-size: 120px 120px;\n"
        + "  mask-repeat: repeat;"
    ),
    """/* 1.9.3 — THE TREASURE SPEAKS THE CARD'S OWN COLOR (the coat's
   card-color law): the whole faceted field — the big cut gem, the tilted
   diamonds, the four-point sparkles, the beads — keeps its geometry and
   its opacities as the tile's own ALPHA MASK; the gold arrives from a
   gradient of card-tint-mixed gilt anchors. The drift and the breath
   keep their clocks. */
""",
)
print("  auric gems: the treasure leans")

FLAKES_NOTE = """/* 1.9.3 — THE LEAF SPEAKS THE CARD'S OWN COLOR (the coat's card-color
   law): both looms keep their tilted diamonds, bright cores, sizes and
   opacities as their tiles' own ALPHA MASKS; the gold arrives from
   card-tint-mixed gradients — the leaf glints in the card's own color as
   it climbs. */
"""


def flakes_decls(uri: str, dim: bool) -> str:
    if dim:
        inner = (
            f"    color-mix(in srgb, {TINT} 48%, #ffdf9c) 0%,\n"
            f"    color-mix(in srgb, {TINT} 56%, #f6d77e) 100%\n"
        )
    else:
        inner = (
            f"    color-mix(in srgb, {TINT} 44%, #ffe9b0) 0%,\n"
            f"    color-mix(in srgb, {TINT} 54%, #ffd98f) 42%,\n"
            f"    color-mix(in srgb, {TINT} 60%, #f6d77e) 100%\n"
        )
    return (
        "  background: linear-gradient(\n    108deg,\n" + inner + "  );\n"
        + f'  -webkit-mask-image: url("{uri}");\n'
        + "  -webkit-mask-size: 120px 360px;\n"
        + "  -webkit-mask-repeat: repeat;\n"
        + f'  mask-image: url("{uri}");\n'
        + "  mask-size: 120px 360px;\n"
        + "  mask-repeat: repeat;"
    )


retint(
    ".gd-auric-flakes::before {",
    "@keyframes gd-auric-rise-a",
    r"  background: url\(\"(data:image/svg\+xml,[^\"]+)\"\) 0 0 / 120px 360px;",
    lambda m: flakes_decls(m.group(1), dim=False),
    FLAKES_NOTE,
)
retint(
    ".gd-auric-flakes::after {",
    "@keyframes gd-auric-rise-b",
    r"  background: url\(\"(data:image/svg\+xml,[^\"]+)\"\) 0 0 / 120px 360px;",
    lambda m: flakes_decls(m.group(1), dim=True),
    FLAKES_NOTE,
)
print("  auric flakes: the leaf leans")

retint(
    ".gd-auric-sweep::before {",
    "/* 1.6.8 — THE SUMMONING",
    r"  background: linear-gradient\(\n    178deg,\n    rgba\(255, 226, 150, 0\) 0%,\n    rgba\(255, 226, 150, 0\) 38%,\n    rgba\(255, 236, 180, 0\.16\) 44%,\n    rgba\(255, 248, 220, 0\.4\) 50%,\n    rgba\(255, 236, 180, 0\.16\) 56%,\n    rgba\(255, 226, 150, 0\) 62%,\n    rgba\(255, 226, 150, 0\) 100%\n  \);",
    lambda m: (
        "  background: linear-gradient(\n"
        + "    178deg,\n"
        + "    rgba(0, 0, 0, 0) 0%,\n"
        + "    rgba(0, 0, 0, 0) 38%,\n"
        + f"    color-mix(in srgb, transparent 84%, color-mix(in srgb, {TINT} 46%, #ffecb4)) 44%,\n"
        + f"    color-mix(in srgb, transparent 60%, color-mix(in srgb, {TINT} 40%, #fff8dc)) 50%,\n"
        + f"    color-mix(in srgb, transparent 84%, color-mix(in srgb, {TINT} 46%, #ffecb4)) 56%,\n"
        + "    rgba(0, 0, 0, 0) 62%,\n"
        + "    rgba(0, 0, 0, 0) 100%\n  );"
    ),
    """/* 1.9.3 — THE POLISH LEANS TOO (the coat's card-color law,
   premultiplied — the gloss band keeps its rise and its alpha; the
   white-gold core becomes the card's own bright hue). */
""",
)
print("  auric sweep: the polish leans")

retint(
    ".gd-auric-summon::before {",
    "@keyframes gd-auric-forge-breath",
    r"  background: radial-gradient\(\n    60% 88% at 50% 100%,\n    rgba\(255, 216, 128, 0\.42\) 0%,\n    rgba\(255, 198, 94, 0\.22\) 40%,\n    rgba\(255, 190, 84, 0\.07\) 68%,\n    rgba\(0, 0, 0, 0\) 100%\n  \);",
    lambda m: (
        "  background: radial-gradient(\n"
        + "    60% 88% at 50% 100%,\n"
        + f"    color-mix(in srgb, transparent 58%, color-mix(in srgb, {TINT} 48%, #ffd880)) 0%,\n"
        + f"    color-mix(in srgb, transparent 78%, color-mix(in srgb, {TINT} 44%, #ffc65e)) 40%,\n"
        + f"    color-mix(in srgb, transparent 93%, color-mix(in srgb, {TINT} 42%, #ffbe54)) 68%,\n"
        + "    rgba(0, 0, 0, 0) 100%\n  );"
    ),
    """/* 1.9.3 — THE FORGE GLOWS IN THE CARD'S OWN COLOR (the coat's
   card-color law, premultiplied — the pool keeps its breath and its
   alpha; the warm gold becomes the card's own hue rising). */
""",
)
print("  auric summon glow: the forge leans")

retint(
    ".gd-auric-summon::after {",
    "@keyframes gd-auric-filaments",
    r"  background: url\(\"(data:image/svg\+xml,[^\"]+)\"\) 0 0 / 120px 300px;",
    lambda m: (
        "  background: linear-gradient(\n"
        + "    112deg,\n"
        + f"    color-mix(in srgb, {TINT} 46%, #ffe9b0) 0%,\n"
        + f"    color-mix(in srgb, {TINT} 56%, #ffd98f) 100%\n"
        + "  );\n"
        + f'  -webkit-mask-image: url("{m.group(1)}"),'
        + " linear-gradient(to top, #000 0%, rgba(0, 0, 0, 0.78) 24%, rgba(0, 0, 0, 0.34) 52%, rgba(0, 0, 0, 0) 76%);\n"
        + "  -webkit-mask-size: 120px 300px, 100% 100%;\n"
        + "  -webkit-mask-repeat: repeat, no-repeat;\n"
        + "  -webkit-mask-composite: source-in;\n"
        + f'  mask-image: url("{m.group(1)}"),'
        + " linear-gradient(to top, #000 0%, rgba(0, 0, 0, 0.78) 24%, rgba(0, 0, 0, 0.34) 52%, rgba(0, 0, 0, 0) 76%);\n"
        + "  mask-size: 120px 300px, 100% 100%;\n"
        + "  mask-repeat: repeat, no-repeat;\n"
        + "  mask-composite: intersect;"
    ),
    """/* 1.9.3 — THE FILAMENTS RISE IN THE CARD'S OWN COLOR (the coat's
   card-color law): the thin rising lines and their bright diamond tips
   keep their seats and opacities as the tile's own ALPHA MASK — and the
   tile now INTERSECTS with the vertical dissolve (two mask layers, one
   law: the lines rise out of the glow exactly as they always did). The
   ink arrives from a card-tint-mixed gilt gradient. */
""",
)
print("  auric filaments: the lines lean (two-layer intersect mask)")

retint(
    ".gd-artfin-auric {",
    "@keyframes gd-auric-honeybreath",
    r"  background: linear-gradient\(\n    176deg,\n    rgba\(255, 224, 140, 0\.36\) 0%,\n    rgba\(238, 194, 92, 0\.3\) 40%,\n    rgba\(196, 150, 56, 0\.34\) 100%\n  \);",
    lambda m: (
        "  background: linear-gradient(\n"
        + "    176deg,\n"
        + f"    color-mix(in srgb, transparent 64%, color-mix(in srgb, {TINT} 48%, #ffe08c)) 0%,\n"
        + f"    color-mix(in srgb, transparent 70%, color-mix(in srgb, {TINT} 44%, #eec25c)) 40%,\n"
        + f"    color-mix(in srgb, transparent 66%, color-mix(in srgb, {TINT} 40%, #c49638)) 100%\n"
        + "  );"
    ),
    """/* 1.9.3 — THE HONEY OVER THE PICTURE LEANS TOO (the coat's card-color
   law, premultiplied — leaf laid over a photograph, in the card's own
   hue). */
""",
)
print("  auric artfin: the honey leans")

# ---------------------------------------------------------------------------
# 8. THE EXTREME GROUNDS — the blend families answer the plate's own tone
# ---------------------------------------------------------------------------
EXTREME = """/* 1.9.3 — THE EXTREME GROUNDS ("in some color values especially when i
   lean towards black or white or high saturation, the finishes would
   dissapear or would be covered, fix that so they still are visible"):
   the coat's washes are BLEND-MODE shaders, and every blend family has a
   ground it cannot speak on — screen light vanishes into a near-white
   plate (screen(anything, white) is white), a soft-light veil sinks into
   a near-black one (soft-light never lifts a black backdrop), and a
   highly saturated plate's own voice swallows a soft-light wash whole
   ("covered by the card color"). The seats class the picked plate
   (finishGroundTone in TagRibbon.jsx writes the class on the card root,
   the same element that speaks --gd-card-tint), and the blend families
   answer: light grounds turn the luminous screen seats — and the
   soft-light bodies — into MULTIPLY tints (light ON white finally reads
   as color); dark grounds turn the soft-light bodies into SCREEN light
   (the veil GLOWS instead of sinking); vivid grounds turn the bodies
   into OVERLAY (the plate's saturation amplifies the wash's bright and
   deep anchors instead of covering the coat — material over the color,
   never under it). The ink X's need no law here: their card-leaning
   gradient already carries mid-tone anchors that separate from both
   extremes. Holographic, prismatic and nuri keep their own laws ("good
   as it is"); a colorless card carries no class at all — the theme's
   grounds are mid-toned by design, and the 1.9.2 cloth law already
   answers for them. */
.gd-fin-ground-light .gd-numeix-dapple,
.gd-fin-ground-light .gd-numeix-streams,
.gd-fin-ground-light .gd-numeix-moon,
.gd-fin-ground-light .gd-numeix-stars,
.gd-fin-ground-light .gd-auric-currents,
.gd-fin-ground-light .gd-auric-flakes,
.gd-fin-ground-light .gd-auric-sweep,
.gd-fin-ground-light .gd-auric-summon,
.gd-fin-ground-light .gd-finish-foil-ripples,
.gd-fin-ground-light .gd-finish-foil,
.gd-fin-ground-light .gd-finish-auric,
.gd-fin-ground-light .gd-finish-numeix {
  mix-blend-mode: multiply;
}
.gd-fin-ground-dark .gd-finish-foil,
.gd-fin-ground-dark .gd-finish-auric {
  mix-blend-mode: screen;
}
.gd-fin-ground-vivid .gd-finish-foil,
.gd-fin-ground-vivid .gd-finish-auric,
.gd-fin-ground-vivid .gd-finish-numeix {
  mix-blend-mode: overlay;
}

"""
anchor = "/* HOLOGRAPHIC — the reworked chaos"
assert anchor in css
css = css.replace(anchor, EXTREME + anchor, 1)
print("  the extreme grounds: the blend families answer")

CSS.write_text(css, encoding="utf8")
print("\n1.9.3 finish surgery seated.")
