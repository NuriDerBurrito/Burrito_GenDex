#!/usr/bin/env python3
"""1.9.5 finish surgery — THE YIELDING COAT, spoken on the coat's own sheet.

Three laws on the CSS (the volume knob's plumbing lives in
coat_volume_195.py):

1+4. THE PLATE'S OWN LIGHT IS SACRED ("for some reason in some finishes
   such as nuri finish, when applying a card color so high to the top, aka
   bright and high saturation, it would darken the card color and then make
   teh effects darker for some reason, fix that" + "effects still vanish
   vin bright deep playes, aka issue one, when its too bright it becomes
   black, fix that"): the 1.9.4 ink law answered the VANISHING glints by
   turning every masked seat into the plate's own shadow — but the law
   classed the BROAD BODIES with the details, and the bodies carry the
   coat's whole wash: on a plate the rail catches as light (a white, a
   gold, a bright saturated yellow) the multiply stack COMPOUNDS — body,
   licks, sparks and flare each printing their brightness(0.55) shadow
   over the last — until the plate's own light is crushed (a white numeix
   card read as dark coffee; a gold nuri card as deep umber; the report's
   own words: "it would darken the card color and then make the effects
   darker", "when its too bright it becomes black"). The bodies retire
   from the light multiply stack now — numeix's paper, auric's honey,
   foil's metal and nuri's forge wash keep their NATIVE seats (soft-light
   / soft-light / normal / overlay: a wash over a bright plate is a
   whisper by design, the plate keeps its own light), the detail inks
   keep the multiply flip but their filter steps up from the crushing
   brightness(0.55) saturate(1.35) to brightness(0.74) saturate(1.5) (the
   glints return as gentle colored ink, never as the stacked black), and
   the forge's veil loses its light-ground multiply flip (it only ever
   darkened the fire it was meant to tint). The hue-riding bodies
   (holographic, prismatic) keep the light multiply — their streaks ride
   at low alpha, so they tint a white plate into a pastel riot without
   ever crushing it.

3. THE X'S CUT FLAT ("xs in numeix theme should not be round edged and
   should also be slightly more thicker again"): the 1.9.4 round caps
   left the glyph with soft pebble tips; every stroke now cuts FLAT
   (stroke-linecap butt — the ✖'s own square ends) and the whole band
   steps up once more (~×1.14, 3.3-5.2 on the same 12-20px spans — the
   flat cut retires the cap's half-stroke extension, so the thicker
   stroke keeps the mark's full presence).

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS = ROOT / "src/index.css"

css = CSS.read_text(encoding="utf8")


def must(old: str, new: str, count: int = 1, why: str = "") -> None:
    global css
    found = css.count(old)
    assert found == count, f"{why or 'seat'}: expected {count} seat(s), found {found}:\n{old[:160]}"
    css = css.replace(old, new)
    print(f"  seated — {why or old[:60]}")


# ---------------------------------------------------------------------------
# LAW 1+4 — the plate's own light is sacred (the light-ground stack thins)
# ---------------------------------------------------------------------------
# 1a. the 1.9.3 light rule loses its three broad bodies (they keep their
#     native seats; the detail inks below them keep the multiply flip)
OLD_LIGHT_193 = """.gd-fin-ground-light .gd-numeix-dapple,
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
}"""
NEW_LIGHT_193 = """/* 1.9.5 — THE PLATE'S OWN LIGHT IS SACRED ("when applying a card color
   so high to the top, aka bright and high saturation, it would darken
   the card color and then make the effects darker"): the 1.9.4 ink law
   classed the broad BODIES with the details, and on a light plate the
   multiply stack compounds — body over licks over sparks over flare,
   each at brightness(0.55) — until the plate's own light is crushed (a
   white numeix card read as dark coffee; "when its too bright it becomes
   black"). The bodies retire from the light multiply stack: numeix's
   paper, auric's honey and foil's metal keep their NATIVE seats below,
   where a wash over a bright plate is the whisper it always was — the
   card keeps its own color, and the detail inks alone carry the ink law.
   The native seats: numeix's paper, auric's honey and foil's metal all
   speak soft-light (their 1.4.x birth seats — foil's own 1.4.7 tint law,
   never a shade), and the forge's wash keeps its overlay. */
.gd-fin-ground-light .gd-numeix-dapple,
.gd-fin-ground-light .gd-numeix-streams,
.gd-fin-ground-light .gd-numeix-moon,
.gd-fin-ground-light .gd-numeix-stars,
.gd-fin-ground-light .gd-auric-currents,
.gd-fin-ground-light .gd-auric-flakes,
.gd-fin-ground-light .gd-auric-sweep,
.gd-fin-ground-light .gd-auric-summon,
.gd-fin-ground-light .gd-finish-foil-ripples {
  mix-blend-mode: multiply;
}"""
must(OLD_LIGHT_193, NEW_LIGHT_193, 1, "the 1.9.3 light rule sheds its bodies")

# 1b. the 1.9.4 overlay-flip rule loses the forge body (nuri keeps its
#     native overlay — the fire wash whispers, the details speak)
OLD_LIGHT_194 = """.gd-fin-ground-light .gd-finish-nuri,
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
}"""
NEW_LIGHT_194 = """.gd-fin-ground-light .gd-nuri-licks,
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
}"""
must(OLD_LIGHT_194, NEW_LIGHT_194, 1, "the 1.9.4 flip rule sheds the forge body")

# 1c. the ink law's filter: the three bodies leave the list and the value
#     steps up from the crushing 0.55 to the gentle 0.74
OLD_INK_LIST = """.gd-fin-ground-light .gd-numeix-dapple,
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
}"""
NEW_INK_LIST = """/* 1.9.5 — the ink law learns the GENTLE hand: the bodies left the list
   (a broad wash at brightness(0.55) was the black the stack printed),
   and the details' filter steps up to brightness(0.74) saturate(1.5) —
   the glints read as the plate's own colored ink, present and gentle,
   never again the report's "it becomes black". */
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
.gd-fin-ground-light .gd-nuri-licks,
.gd-fin-ground-light .gd-nuri-sparks,
.gd-fin-ground-light .gd-nuri-flare,
.gd-fin-ground-light .gd-holo-dots,
.gd-fin-ground-light .gd-prism-stars,
.gd-fin-ground-light .gd-prism-particles,
.gd-fin-ground-light .gd-prism-waves,
.gd-fin-ground-light .gd-prism-sweep {
  filter: brightness(0.74) saturate(1.5);
}"""
must(OLD_INK_LIST, NEW_INK_LIST, 1, "the ink law's gentle hand")

# 1d. the forge's veil loses its light-ground multiply flip (it only ever
#     darkened the re-inked fire it was meant to tint)
OLD_VEIL_FLIP = """/* the forge's veil steps aside on the extremes (it was only ever meant
   to TINT a fire that now carries the card's color at the source):
   multiply over a light plate is near-identity, screen over a dark one
   the same — the re-inked fire speaks for itself on both. */
.gd-fin-ground-light .gd-finish-nuri::before {
  mix-blend-mode: multiply;
}
.gd-fin-ground-dark .gd-finish-numeix,"""
NEW_VEIL_FLIP = """/* 1.9.5 — the forge's veil keeps its overlay seat on the light plate
   too (the 1.9.4 multiply flip only darkened the re-inked fire it was
   meant to tint — "make the effects darker", the report's own words);
   the dark screen flip below keeps its seat (a veil over black must
   glow, never sink). */
.gd-fin-ground-dark .gd-finish-numeix,"""
must(OLD_VEIL_FLIP, NEW_VEIL_FLIP, 1, "the veil's light flip retires")

# 1e. the 1.9.4 ink comment's own words gain the 1.9.5 sentence (history
#     keeps its voice; the correction speaks after it)
OLD_INK_NOTE = """   washing the very fire it was only ever meant to tint. The numeix
   grain joins the dark screen law so the paper's tooth no longer sinks
   into black. Every coat in the wall answers: numeix, foil, auric,
   holographic, prismatic, nuri. */"""
NEW_INK_NOTE = """   washing the very fire it was only ever meant to tint. The numeix
   grain joins the dark screen law so the paper's tooth no longer sinks
   into black. Every coat in the wall answers: numeix, foil, auric,
   holographic, prismatic, nuri.
   1.9.5 — THE CRUSHING HAND RETIRES ("it would darken the card color and
   then make the effects darker"): the 0.55 shadow classed the broad
   bodies with the details, and the light-plate stack compounded toward
   black — the bodies return to their native seats (see the 1.9.5 rules
   above), the details' filter rises to brightness(0.74) saturate(1.5),
   and the veil's light flip leaves. The plate's own light is sacred;
   the ink speaks, never shouts. */"""
must(OLD_INK_NOTE, NEW_INK_NOTE, 1, "the 1.9.4 ink note gains the correction")

# ---------------------------------------------------------------------------
# LAW 3 — the X's cut flat and take one more step of weight
# ---------------------------------------------------------------------------
# (span -> the ✖'s own proportion, one more step past 1.9.4's full weight)
X_WIDTHS = [
    ("M20 36 L38 54 M20 54 L38 36", "4.2", "4.8"),
    ("M102 120 L116 134 M102 134 L116 120", "3.6", "4.1"),
    ("M54 226 L74 246 M54 246 L74 226", "4.6", "5.2"),
    ("M9 316 L21 328 M9 328 L21 316", "3.1", "3.5"),
    ("M82 64 L98 80 M82 80 L98 64", "3.8", "4.3"),
    ("M42 178 L54 190 M42 190 L54 178", "3.1", "3.5"),
    ("M114 260 L128 274 M114 274 L128 260", "3.6", "4.1"),
    ("M68 346 L80 358 M68 358 L80 346", "3.0", "3.4"),
    ("M123 29 L135 41 M123 41 L135 29", "3.0", "3.4"),
    ("M7 141 L23 157 M7 157 L23 141", "3.8", "4.3"),
    ("M96 302 L108 314 M96 314 L108 302", "3.1", "3.5"),
    ("M29 389 L41 401 M29 401 L41 389", "2.9", "3.3"),
    ("M44 60 L62 78 M44 78 L62 60", "4.2", "4.8"),
    ("M26 216 L42 232 M26 232 L42 216", "3.8", "4.3"),
    ("M15 372 L29 386 M15 386 L29 372", "3.4", "3.9"),
    ("M106 140 L124 158 M106 158 L124 140", "4.2", "4.8"),
    ("M83 293 L97 307 M83 307 L97 293", "3.5", "4.0"),
    ("M60 12 L76 28 M60 28 L76 12", "3.8", "4.3"),
    ("M121 348 L135 362 M121 362 L135 348", "3.4", "3.9"),
]
for d, old_w, new_w in X_WIDTHS:
    must(f"d='{d}' stroke-width='{old_w}'", f"d='{d}' stroke-width='{new_w}'", 2, f"the X at {d}")

# the caps cut flat (both looms, both engines' seats)
must("stroke='%23fff' stroke-linecap='round'", "stroke='%23fff' stroke-linecap='butt'", 4, "the flat-cut caps")

# the two law notes tell the old story — re-word them to the flat cut
OLD_X_NOTE = """mark is a TRUE ROTATED PLUS now: two straight diagonals crossing AT the
   center, round caps, SEMI-THICK strokes — 1.9.4 takes them to their
   full weight ("the x's arent thick enough sometimes"): every stroke
   steps up to the ✖'s own proportion, ~23-26% of its span (2.9-4.6
   against the same 12-20px spans — never thin, never bold), the"""
NEW_X_NOTE = """mark is a TRUE ROTATED PLUS now: two straight diagonals crossing AT the
   center, SEMI-THICK strokes — 1.9.4 took them to their full weight
   ("the x's arent thick enough sometimes"), and 1.9.5 cuts them FLAT and
   one step heavier ("xs in numeix theme should not be round edged and
   should also be slightly more thicker again"): every stroke speaks the
   ✖'s own proportion at BUTT caps (the flat square ends the glyph itself
   wears — the round pebble tips retired), 3.3-5.2 on the same 12-20px
   spans — the flat cut retires the cap's half-stroke extension, so the
   thicker stroke keeps the mark's full presence, the"""
must(OLD_X_NOTE, NEW_X_NOTE, 2, "the true-X law notes")

CSS.write_text(css, encoding="utf8")
print("\n1.9.5 finish surgery seated (3 laws).")
