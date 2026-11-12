#!/usr/bin/env python3
"""1.9.4 finish surgery — THE FAITHFUL COAT, spoken on the coat's own sheet.

Three laws:

1. THE FORGE'S OWN STRIPES LEAN TOO ("i forgot about nuri's finish, nuri's
   finish background stripes still remain orange etc.. fix that to match
   color"): the 1.5.0 pass re-inked the licks, the sparks, the flare and
   the hearts, but the BODY'S OWN washes — the two crossed heat-vein
   lattices, the fire band and the obsidian weave — still spoke their
   fixed crimson / ember / gold rgba stops on every card, and the 0.5
   overlay veil could only tint their LIGHT, never re-ink them (the
   stripes the eye reads first stayed orange on a blue card). Every stop
   now speaks the premultiplied card-color law at the licks' own weight
   (the veins ~52-55%, the band ~48-50%, the obsidian ground ~22-24% —
   deep plates stay deep), and the veil steps down to a 0.4 wash so the
   freshly re-inked fire reads through it.

2. THE X'S TAKE THEIR FULL WEIGHT ("the x's arent thick enough sometimes,
   fix that"): the 1.9.3 true-X band (2.4-3.5 on 12-20px spans) read thin
   at its floor — the smaller marks (2.4-2.6) all but vanished beside
   their partners. Every stroke in both looms steps up to the ✖'s own
   proportion — ~23-26% of its span (2.9-4.6 on the same spans): still
   semi-thick, never bold, the round caps and the varied sizes keeping
   every word they spoke.

3. THE INK ITSELF SPEAKS ON THE EXTREME PLATES ("when going with the
   card color too bright or such sometimes it makes some of its effect
   dissapear, such as white and numeix theme would make the glint/shine
   glow spots dissapear for example, check for all themes and fix that"):
   the 1.9.3 extreme-ground laws moved the BLEND — light grounds turned
   the luminous seats into multiply tints — but a blend family alone
   cannot rescue an ink that CARRIES the plate's own lightness: the
   1.9.3 card-color law mixed every masked ink toward the card's tint, so
   on a white card the cream glows became white-on-white and multiply
   printed nothing (the glints, the shine, the bloom spots vanished
   exactly as reported), and the coats the pass never classed (the
   overlay bodies — nuri, holographic, prismatic, the prism's crystal —
   are IDENTITY over white and black alike) never spoke a word on the
   extremes at all. The ink learns to speak now: on LIGHT grounds every
   masked-ink seat carries brightness(0.55) saturate(1.35) — the glints
   return as the plate's own colored SHADOWS — while the hue-riding
   bodies (foil, holographic, prismatic: their filter seats belong to
   the hue clocks) lean on their saturated anchors, which multiply alone
   lands. On DARK grounds the overlay bodies turn to screen (the plate's
   black answers their ink at full voice) and the forge's veil turns
   identity (multiply on light, screen on dark — it stops washing the
   fire it was only ever meant to tint). The tone rail widens to meet
   the plates the eye reads as bright or deep before they reach the
   outermost extremes (TagRibbon.jsx: 0.84/0.16 -> 0.78/0.19). Every
   coat in the wall answers: numeix, foil, auric, holographic,
   prismatic, nuri.

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS = ROOT / "src/index.css"
RIBBON = ROOT / "src/components/TagRibbon.jsx"

css = CSS.read_text(encoding="utf8")
TINT = "var(--gd-card-tint, var(--gd-panel))"


def must(old: str, new: str, count: int = 1, why: str = "") -> None:
    global css
    found = css.count(old)
    assert found == count, f"{why or 'seat'}: expected {count} seat(s), found {found}:\n{old[:160]}"
    css = css.replace(old, new)
    print(f"  seated — {why or old[:60]}")


# ---------------------------------------------------------------------------
# LAW 1 — the forge's own stripes lean the card's color
# ---------------------------------------------------------------------------
OLD_VEIL = """.gd-finish-nuri::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--gd-card-tint, var(--gd-panel));
  opacity: 0.5;
  mix-blend-mode: overlay;
}"""
NEW_VEIL = """.gd-finish-nuri::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--gd-card-tint, var(--gd-panel));
  /* 1.9.4 — the veil steps down to a 0.4 wash: the body's own stripes and
     band now carry the card's color at the source (see the body below),
     and the veil's job returns to DEEPENING the lean — at 0.5 it washed
     the freshly re-inked fire back toward a flat plate tint. */
  opacity: 0.4;
  mix-blend-mode: overlay;
}"""
must(OLD_VEIL, NEW_VEIL, 1, "the veil's weight")

OLD_BODY = """.gd-finish-nuri {
  background:
    repeating-linear-gradient(
      58deg,
      rgba(255, 140, 0, 0.17) 0 22px,
      rgba(0, 0, 0, 0) 22px 68px,
      rgba(255, 62, 20, 0.14) 68px 90px,
      rgba(0, 0, 0, 0) 90px 138px
    ),
    repeating-linear-gradient(
      122deg,
      rgba(255, 196, 60, 0.13) 0 30px,
      rgba(0, 0, 0, 0) 30px 84px,
      rgba(255, 110, 30, 0.12) 84px 108px,
      rgba(0, 0, 0, 0) 108px 160px
    ),
    linear-gradient(
      108deg,
      rgba(178, 34, 52, 0.34) 0%,
      rgba(255, 122, 30, 0.30) 22%,
      rgba(255, 196, 60, 0.28) 42%,
      rgba(255, 92, 92, 0.26) 62%,
      rgba(255, 158, 46, 0.30) 82%,
      rgba(178, 34, 52, 0.34) 100%
    ),
    linear-gradient(165deg, rgba(26, 17, 12, 0.34), rgba(44, 26, 16, 0.26) 58%, rgba(22, 13, 9, 0.36));
  mix-blend-mode: overlay;
}"""
NEW_BODY = """.gd-finish-nuri {
  /* 1.9.4 — THE FORGE'S OWN STRIPES LEAN TOO ("i forgot about nuri's
     finish, nuri's finish background stripes still remain orange etc..
     fix that to match color"): the 1.5.0 pass re-inked the licks, the
     sparks, the flare and the hearts but left the BODY'S OWN washes
     speaking their fixed crimson / ember / gold — the two crossed
     heat-vein lattices, the fire band and the obsidian weave painted
     orange on every card no matter what the plate said, and the 0.5
     overlay veil could only tint their light, never re-ink them. Every
     stop now speaks the premultiplied card-color law at the licks' own
     weight — the veins lean the tint at ~52-55%, the fire band at
     ~48-50%, the obsidian ground at ~22-24% (deep plates stay deep) —
     and the veil steps down to a 0.4 wash so the re-inked fire reads
     through it: a blue card's forge burns blue-hearted from the stripes
     out, an orange card burns the pure gold it always did, the warmth
     surviving only as the light's edge. */
  background:
    repeating-linear-gradient(
      58deg,
      color-mix(in srgb, transparent 83%, color-mix(in srgb, @@TINT@@ 55%, #ff8c00)) 0 22px,
      rgba(0, 0, 0, 0) 22px 68px,
      color-mix(in srgb, transparent 86%, color-mix(in srgb, @@TINT@@ 55%, #ff3e14)) 68px 90px,
      rgba(0, 0, 0, 0) 90px 138px
    ),
    repeating-linear-gradient(
      122deg,
      color-mix(in srgb, transparent 87%, color-mix(in srgb, @@TINT@@ 52%, #ffc43c)) 0 30px,
      rgba(0, 0, 0, 0) 30px 84px,
      color-mix(in srgb, transparent 88%, color-mix(in srgb, @@TINT@@ 52%, #ff6e1e)) 84px 108px,
      rgba(0, 0, 0, 0) 108px 160px
    ),
    linear-gradient(
      108deg,
      color-mix(in srgb, transparent 66%, color-mix(in srgb, @@TINT@@ 50%, #b22234)) 0%,
      color-mix(in srgb, transparent 70%, color-mix(in srgb, @@TINT@@ 50%, #ff7a1e)) 22%,
      color-mix(in srgb, transparent 72%, color-mix(in srgb, @@TINT@@ 48%, #ffc43c)) 42%,
      color-mix(in srgb, transparent 74%, color-mix(in srgb, @@TINT@@ 48%, #ff5c5c)) 62%,
      color-mix(in srgb, transparent 70%, color-mix(in srgb, @@TINT@@ 50%, #ff9e2e)) 82%,
      color-mix(in srgb, transparent 66%, color-mix(in srgb, @@TINT@@ 50%, #b22234)) 100%
    ),
    linear-gradient(
      165deg,
      color-mix(in srgb, transparent 66%, color-mix(in srgb, @@TINT@@ 22%, #1a110c)),
      color-mix(in srgb, transparent 74%, color-mix(in srgb, @@TINT@@ 24%, #2c1a10)) 58%,
      color-mix(in srgb, transparent 64%, color-mix(in srgb, @@TINT@@ 22%, #160d09))
    );
  mix-blend-mode: overlay;
}""".replace("@@TINT@@", TINT)
must(OLD_BODY, NEW_BODY, 1, "the forge body's card-color law")

# ---------------------------------------------------------------------------
# LAW 2 — the X's take their full weight (both looms, both engines' seats)
# ---------------------------------------------------------------------------
# (span -> the ✖'s own proportion, ~23-26% of the diagonal span)
X_WIDTHS = [
    ("M20 36 L38 54 M20 54 L38 36", "3.2", "4.2"),
    ("M102 120 L116 134 M102 134 L116 120", "2.8", "3.6"),
    ("M54 226 L74 246 M54 246 L74 226", "3.5", "4.6"),
    ("M9 316 L21 328 M9 328 L21 316", "2.6", "3.1"),
    ("M82 64 L98 80 M82 80 L98 64", "3", "3.8"),
    ("M42 178 L54 190 M42 190 L54 178", "2.6", "3.1"),
    ("M114 260 L128 274 M114 274 L128 260", "2.9", "3.6"),
    ("M68 346 L80 358 M68 358 L80 346", "2.5", "3.0"),
    ("M123 29 L135 41 M123 41 L135 29", "2.5", "3.0"),
    ("M7 141 L23 157 M7 157 L23 141", "3", "3.8"),
    ("M96 302 L108 314 M96 314 L108 302", "2.6", "3.1"),
    ("M29 389 L41 401 M29 401 L41 389", "2.4", "2.9"),
    ("M44 60 L62 78 M44 78 L62 60", "3.2", "4.2"),
    ("M26 216 L42 232 M26 232 L42 216", "3", "3.8"),
    ("M15 372 L29 386 M15 386 L29 372", "2.7", "3.4"),
    ("M106 140 L124 158 M106 158 L124 140", "3.2", "4.2"),
    ("M83 293 L97 307 M83 307 L97 293", "2.8", "3.5"),
    ("M60 12 L76 28 M60 28 L76 12", "3", "3.8"),
    ("M121 348 L135 362 M121 362 L135 348", "2.7", "3.4"),
]
for d, old_w, new_w in X_WIDTHS:
    must(f"d='{d}' stroke-width='{old_w}'", f"d='{d}' stroke-width='{new_w}'", 2, f"the X at {d}")

# the two 1.9.3 comment blocks tell the old band — re-word them to the law
OLD_X_NOTE = """mark is a TRUE ROTATED PLUS now: two straight diagonals crossing AT the
   center, round caps, SEMI-THICK strokes (2.4-3.5 against 12-20px spans
   — the weight between the 1.4.9's thin ruled lines and a bold ✖), the"""
NEW_X_NOTE = """mark is a TRUE ROTATED PLUS now: two straight diagonals crossing AT the
   center, round caps, SEMI-THICK strokes — 1.9.4 takes them to their
   full weight ("the x's arent thick enough sometimes"): every stroke
   steps up to the ✖'s own proportion, ~23-26% of its span (2.9-4.6
   against the same 12-20px spans — never thin, never bold), the"""
must(OLD_X_NOTE, NEW_X_NOTE, 2, "the true-X law notes")

# ---------------------------------------------------------------------------
# LAW 3 — the ink itself speaks on the extreme plates (every coat answers)
# ---------------------------------------------------------------------------
OLD_GROUND_TAIL = """.gd-fin-ground-vivid .gd-finish-foil,
.gd-fin-ground-vivid .gd-finish-auric,
.gd-fin-ground-vivid .gd-finish-numeix {
  mix-blend-mode: overlay;
}"""
NEW_GROUND_TAIL = OLD_GROUND_TAIL + """

/* 1.9.4 — THE INK ITSELF SPEAKS ("when going with the card color too
   bright or such sometimes it makes some of its effect dissapear, such
   as white and numeix theme would make the glint/shine glow spots
   dissapear for example, check for all themes and fix that"): the 1.9.3
   laws above moved the BLEND, and the blend alone was half a cure. Two
   diseases remained:
   · the 1.9.3 card-color law mixed every masked ink TOWARD the card's
     tint — so on a bright plate the creams and gilts arrived carrying
     the plate's own LIGHTNESS, and multiply(tint-on-tint) printed
     nothing: the glints, the shine, the bloom spots vanished on white
     exactly as reported (numeix's dapple / moon / stars / X's, auric's
     gems / flakes / sweep / summon, foil's rings / ripples / sparkles);
   · the coats the pass never classed spoke blend families that answer
     extremes with IDENTITY — the overlay bodies (nuri, holographic,
     prismatic) and the prism's crystal are the plate itself over white
     and black alike, so a white or black card wore NO forge, NO riot
     and NO rainbow at all.
   The ink learns to speak now. On LIGHT grounds every masked-ink seat
   carries brightness(0.55) saturate(1.35) — the pale glows return as
   the plate's own colored SHADOWS, unmistakably present — and the
   overlay coats flip to multiply, where their saturated anchors land on
   their own (a pastel rainbow, a tinted riot, a shaded forge). The
   hue-riding bodies (foil's metal, holographic's riot, prismatic's
   conic) take NO static filter — their filter seats belong to the hue
   clocks, and their saturated stops read under multiply unaided — but
   their masked children (foil's rings and ripples) darken with the
   family. On DARK grounds the overlay bodies turn to screen — the
   plate's black answers their ink at full voice — and the forge's veil
   turns identity (multiply on light, screen on dark) so it stops
   washing the very fire it was only ever meant to tint. The numeix
   grain joins the dark screen law so the paper's tooth no longer sinks
   into black. Every coat in the wall answers: numeix, foil, auric,
   holographic, prismatic, nuri. */
.gd-fin-ground-light .gd-finish-nuri,
.gd-fin-ground-light .gd-nuri-licks,
.gd-fin-ground-light .gd-nuri-sparks,
.gd-fin-ground-light .gd-nuri-flare,
.gd-fin-ground-light .gd-finish-holographic,
.gd-fin-ground-light .gd-holo-dots,
.gd-fin-ground-light .gd-finish-prismatic,
.gd-fin-ground-light .gd-prism-stars,
.gd-fin-ground-light .gd-prism-particles,
.gd-fin-ground-light .gd-prism-waves,
.gd-fin-ground-light .gd-prism-sweep {
  mix-blend-mode: multiply;
}
.gd-fin-ground-light .gd-numeix-dapple,
.gd-fin-ground-light .gd-numeix-streams,
.gd-fin-ground-light .gd-numeix-moon,
.gd-fin-ground-light .gd-numeix-stars,
.gd-fin-ground-light .gd-numeix-xmarks,
.gd-fin-ground-light .gd-auric-currents,
.gd-fin-ground-light .gd-auric-flakes,
.gd-fin-ground-light .gd-auric-sweep,
.gd-fin-ground-light .gd-auric-summon,
.gd-fin-ground-light .gd-finish-foil-ripples,
.gd-fin-ground-light .gd-finish-foil::before,
.gd-fin-ground-light .gd-finish-holographic::before,
.gd-fin-ground-light .gd-holo-shards,
.gd-fin-ground-light .gd-finish-numeix,
.gd-fin-ground-light .gd-finish-auric,
.gd-fin-ground-light .gd-finish-nuri,
.gd-fin-ground-light .gd-nuri-licks,
.gd-fin-ground-light .gd-nuri-sparks,
.gd-fin-ground-light .gd-nuri-flare,
.gd-fin-ground-light .gd-holo-dots,
.gd-fin-ground-light .gd-prism-stars,
.gd-fin-ground-light .gd-prism-particles,
.gd-fin-ground-light .gd-prism-waves,
.gd-fin-ground-light .gd-prism-sweep {
  filter: brightness(0.55) saturate(1.35);
}
/* the forge's veil steps aside on the extremes (it was only ever meant
   to TINT a fire that now carries the card's color at the source):
   multiply over a light plate is near-identity, screen over a dark one
   the same — the re-inked fire speaks for itself on both. */
.gd-fin-ground-light .gd-finish-nuri::before {
  mix-blend-mode: multiply;
}
.gd-fin-ground-dark .gd-finish-numeix,
.gd-fin-ground-dark .gd-finish-nuri,
.gd-fin-ground-dark .gd-finish-holographic,
.gd-fin-ground-dark .gd-finish-prismatic,
.gd-fin-ground-dark .gd-prism-stars {
  mix-blend-mode: screen;
}
.gd-fin-ground-dark .gd-finish-nuri::before {
  mix-blend-mode: screen;
}"""
must(OLD_GROUND_TAIL, NEW_GROUND_TAIL, 1, "the extreme-ground ink laws")

# ---------------------------------------------------------------------------
# LAW 3 (the rail) — TagRibbon.jsx's thresholds widen
# ---------------------------------------------------------------------------
ribbon = RIBBON.read_text(encoding="utf8")
OLD_RAIL = """  if (lum >= 0.84) return 'gd-fin-ground-light';
  if (lum <= 0.16) return 'gd-fin-ground-dark';
  if (sat >= 0.85 && lum >= 0.2) return 'gd-fin-ground-vivid';"""
NEW_RAIL = """  /* 1.9.4 — THE RAIL WIDENS ("when going with the card color too bright
     or such sometimes it makes some of its effect dissapear"): the 1.9.3
     thresholds answered only the outermost extremes (0.84 / 0.16), and
     the bright-but-not-white plates (a gold, a cream, a bright lilac)
     landed in the classless middle where the 1.9.3 card-color inks
     washed toward the plate and the glints thinned to nothing. The
     light rail steps down to 0.78 and the dark rail up to 0.19 — the
     honest middle keeps its seat, but every plate the eye reads as
     BRIGHT now meets the ink law (index.css's 1.9.4 seats) that keeps
     its coat speaking. */
  if (lum >= 0.78) return 'gd-fin-ground-light';
  if (lum <= 0.19) return 'gd-fin-ground-dark';
  if (sat >= 0.85 && lum >= 0.2) return 'gd-fin-ground-vivid';"""
assert ribbon.count(OLD_RAIL) == 1, "the tone rail never spoke its old thresholds"
ribbon = ribbon.replace(OLD_RAIL, NEW_RAIL)
RIBBON.write_text(ribbon, encoding="utf8")
print("  seated — TagRibbon's widened tone rail")

CSS.write_text(css, encoding="utf8")
print("\n1.9.4 finish surgery seated (3 laws).")
