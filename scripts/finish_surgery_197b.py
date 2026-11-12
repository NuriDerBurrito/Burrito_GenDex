#!/usr/bin/env python3
"""finish_surgery_197b.py — 1.9.7 THE CORNER LAW (index.css).

Four seats of surgery, one law: no corner of the color wheel can swallow
a coat again.
  1. THE HAND SPEAKS EVERYWHERE — the tint-hand swap retires its light-
     ground scope: every coat seat (plate, art twin, artfin) reads the
     twin (the luma-railed derivation) on every ground alike. The light
     ground's rainbow bodies (fixed hues, no tint to twin) speak NORMAL
     in the same breath (multiply re-hued them against the plate — a
     yellow plate turned their blue bands BLACK; over white normal and
     multiply speak the same pixel, so nothing measured on white moves).
  2. THE VEIL JOINS THE LIGHT MULTIPLY STACK — overlay spoke identity on
     channel-pure brights (exactly 1.0 in a channel is 1.0 out of it):
     the nuri veil vanished on yellow and pure white alike.
  3. THE VIVID GROUND SPEAKS SCREEN — overlay is identity wherever a
     channel sits at 0 or 1, and the wheel's fully-saturated corners
     live there: every body (foil + its rings, auric, numeix, nuri + the
     veil, holographic, prismatic, the prism's stars) turns to screen,
     the blend that cannot identity (it only ever adds light).
  4. THE DARK GROUND'S RINGS SPEAK — foil's ::before (the concentric
     heart) was never in the dark flip list; soft-light never lifts a
     black plate, so the metal's heart vanished there. It joins the
     dark screen family.
Also: the tag emblem's 1.9.6 polish (the under-shadow + the ::before
halo) retires — the mark and its rim alone (the 1.9.7 report: "i want
the emojie and the emojie outline and thats it, no shadows").
"""
import re
import sys

CSS = 'src/index.css'


def sub_once(src, old, new, name):
    if old not in src:
        if new in src:
            print(f'  skip (idempotent): {name}')
            return src
        print(f'FAIL: anchor missing: {name}')
        sys.exit(1)
    if src.count(old) != 1:
        print(f'FAIL: anchor not unique ({src.count(old)}x): {name}')
        sys.exit(1)
    print(f'  spoke: {name}')
    return src.replace(old, new)


def main():
    src = open(CSS, encoding='utf-8').read()

    # ------------------------------------------------------------------
    # 1. THE HAND SPEAKS EVERYWHERE + the rainbow bodies speak normal
    # ------------------------------------------------------------------
    src = sub_once(
        src,
        """.gd-fin-ground-light .gd-card-face-finish,
.gd-fin-ground-light .gd-card-face-artfin {
  --gd-tint-hand: var(--gd-fin-ink, var(--gd-card-tint, var(--gd-panel)));
}""",
        """/* 1.9.7 — THE HAND SPEAKS EVERYWHERE ("the effects vanishing ...
   when the color is going to high saturation or high brightness or low
   brightness or low saturation ... they always break"): the 1.9.6 swap
   armed ONLY under the light ground — so the classless middle (every
   plate between the 0.19 and 0.78 luminance rails, the widest band the
   wheel owns) kept blending RAW tints, and its pale half (a mist, an
   apple, a slate — luminance 0.6..0.78) watched the light anchors wash
   into the plate (measured: whole families at mag 2.4-5.6, whispers).
   The twin is a derivation of the plate, not a property of the light
   ground: EVERY coat seat reads it now, on every ground alike (the
   card root always writes --gd-fin-ink when a color is picked; a
   colorless card falls back to the theme's tint and never classes an
   extreme). The artfin sprite washes read it too — their blend stays
   soft-light against the PICTURE, but their tint leans the same
   guaranteed distance from the plate the rest of the coat speaks. */
.gd-card-face-finish,
.gd-card-face-artfin {
  --gd-tint-hand: var(--gd-fin-ink, var(--gd-card-tint, var(--gd-panel)));
}

/* 1.9.7 — THE RAINBOW SPEAKS ITS OWN HUES ("some just shift in hue
   weirdly ... some turn from bright white to dark black"): the hue-
   riding bodies (holographic's riot, prismatic's faceted conic) carry
   FIXED hues — no tint to twin — and the 1.9.6 multiply seat re-hued
   them against the plate (a yellow plate multiplied their blue bands
   to BLACK, their magentas to red — the corner report's own words).
   Their inks are translucent by design, and over a white plate normal
   and multiply speak the SAME pixel — so normal keeps every word the
   light ground ever measured on white while the rainbow's own hues
   survive on every other bright plate (a gold card wears the riot as
   the riot, never as black bands). */
.gd-fin-ground-light .gd-finish-holographic,
.gd-fin-ground-light .gd-finish-prismatic {
  mix-blend-mode: normal;
}""",
        'the universal hand + the rainbow normal seat',
    )

    # ------------------------------------------------------------------
    # 2. THE VEIL JOINS THE LIGHT MULTIPLY STACK
    # ------------------------------------------------------------------
    src = sub_once(
        src,
        """.gd-fin-ground-light .gd-finish-nuri,
.gd-fin-ground-light .gd-finish-nuri::after,
.gd-fin-ground-light .gd-nuri-licks,""",
        """.gd-fin-ground-light .gd-finish-nuri,
.gd-fin-ground-light .gd-finish-nuri::before,
.gd-fin-ground-light .gd-finish-nuri::after,
.gd-fin-ground-light .gd-nuri-licks,""",
        'the veil joins the light multiply stack',
    )

    # ------------------------------------------------------------------
    # 3. THE RAINBOW BODIES LEAVE the light multiply list (they speak
    #    normal above)
    # ------------------------------------------------------------------
    src = sub_once(
        src,
        """.gd-fin-ground-light .gd-finish-holographic,
.gd-fin-ground-light .gd-finish-holographic::before,
.gd-fin-ground-light .gd-holo-shards,
.gd-fin-ground-light .gd-holo-dots,
.gd-fin-ground-light .gd-finish-prismatic,
.gd-fin-ground-light .gd-prism-stars,""",
        """.gd-fin-ground-light .gd-finish-holographic::before,
.gd-fin-ground-light .gd-holo-shards,
.gd-fin-ground-light .gd-holo-dots,
.gd-fin-ground-light .gd-prism-stars,""",
        'the rainbow bodies leave the light multiply list',
    )

    # ------------------------------------------------------------------
    # 4. THE VIVID GROUND SPEAKS SCREEN
    # ------------------------------------------------------------------
    src = sub_once(
        src,
        """.gd-fin-ground-vivid .gd-finish-foil,
.gd-fin-ground-vivid .gd-finish-auric,
.gd-fin-ground-vivid .gd-finish-numeix {
  mix-blend-mode: overlay;
}""",
        """/* 1.9.7 — THE VIVID GROUND SPEAKS SCREEN ("if i pull the color wheel
   to the most extreme 4 corners ... top right ... they always break,
   and it varries between finishes how they break"): the vivid ground's
   1.9.2 overlay flip answered a mid-saturated plate (the anchors
   amplified through the plate's own saturation) — but the wheel's
   fully-saturated corners live where OVERLAY IS IDENTITY (a channel at
   1.0 stays 1.0, a channel at 0 stays 0: pure red, green and magenta
   wore NO forge, NO metal, NO paper, NO riot at all — measured ratio
   0.0% on exactly those plates). Every body turns to SCREEN now — the
   blend that cannot identity, because it only ever ADDS light: the
   twin's lifted inks (the dark half's luma + 0.16) arrive carrying
   their own channels and the screen speaks them. The prism's stars
   (overlay natives) join the same family — the "left half of the color
   wheel" the 1.9.6 report named was exactly the green band, where the
   stars' overlay seat read identity. */
.gd-fin-ground-vivid .gd-finish-foil,
.gd-fin-ground-vivid .gd-finish-foil::before,
.gd-fin-ground-vivid .gd-finish-auric,
.gd-fin-ground-vivid .gd-finish-numeix,
.gd-fin-ground-vivid .gd-finish-nuri,
.gd-fin-ground-vivid .gd-finish-nuri::before,
.gd-fin-ground-vivid .gd-finish-holographic,
.gd-fin-ground-vivid .gd-finish-prismatic,
.gd-fin-ground-vivid .gd-prism-stars {
  mix-blend-mode: screen;
}""",
        'the vivid screen family',
    )

    # ------------------------------------------------------------------
    # 5. THE DARK GROUND'S RINGS SPEAK (foil's ::before joins screen)
    # ------------------------------------------------------------------
    src = sub_once(
        src,
        """.gd-fin-ground-dark .gd-finish-numeix,
.gd-fin-ground-dark .gd-finish-nuri,
.gd-fin-ground-dark .gd-finish-holographic,
.gd-fin-ground-dark .gd-finish-prismatic,
.gd-fin-ground-dark .gd-prism-stars {
  mix-blend-mode: screen;
}""",
        """.gd-fin-ground-dark .gd-finish-numeix,
.gd-fin-ground-dark .gd-finish-nuri,
.gd-fin-ground-dark .gd-finish-holographic,
.gd-fin-ground-dark .gd-finish-prismatic,
.gd-fin-ground-dark .gd-prism-stars,
.gd-fin-ground-dark .gd-finish-foil::before {
  mix-blend-mode: screen;
}""",
        "the dark ground's rings speak",
    )

    # ------------------------------------------------------------------
    # 6. THE TAG EMBLEM'S PLAIN TRUTH (1.9.7 report item 1: "the tags
    #    are semi worse below the emoji, as if there is a pale spot or a
    #    stain or shadow that is too large fix that so there isnt that,
    #    i want the emojie and the emojie outline and thats it, no
    #    shadows (on the tag ofc)")
    # ------------------------------------------------------------------
    src = sub_once(
        src,
        """  filter:
    drop-shadow(0 1px 1px rgba(0, 0, 0, 0.42))
    drop-shadow(0 0 0.75px var(--gd-glyph-rim, rgba(0, 0, 0, 0.55)))
    drop-shadow(0 0 0.75px var(--gd-glyph-rim, rgba(0, 0, 0, 0.55)))
    drop-shadow(0 0 1px var(--gd-glyph-rim, rgba(0, 0, 0, 0.55)));
}""",
        """  filter:
    drop-shadow(0 0 0.75px var(--gd-glyph-rim, rgba(0, 0, 0, 0.55)))
    drop-shadow(0 0 0.75px var(--gd-glyph-rim, rgba(0, 0, 0, 0.55)))
    drop-shadow(0 0 1px var(--gd-glyph-rim, rgba(0, 0, 0, 0.55)));
}""",
        "the emblem's under-shadow retires",
    )
    # the halo rule leaves the sheet entirely
    halo_re = re.compile(
        r"/\* 1\.9\.6 — THE EMBLEM'S OWN LIGHT \(the polish's other half\):[\s\S]*?\.gd-ribbon-glyph::before \{[\s\S]*?\n\}\n"
    )
    if halo_re.search(src):
        src = halo_re.sub(
            """/* 1.9.7 — THE EMBLEM'S PLAIN TRUTH ("the tags are semi worse below
   the emoji, as if there is a pale spot or a stain or shadow that is
   too large fix that so there isnt that, i want the emojie and the
   emojie outline and thats it, no shadows (on the tag ofc)"): the
   1.9.6 polish seated a luminous ::before halo behind the mark (sized
   1.9x its own measure — the pale stain the report caught below the
   emoji) and an under-shadow beneath it. Both retire: the mark and its
   rim alone speak, exactly as asked. The ::before rule itself left the
   sheet with the halo — no seat, no light, no stain. */
""",
            src,
        )
        print('  spoke: the halo leaves the sheet')
    elif '.gd-ribbon-glyph::before' not in src:
        print('  skip (idempotent): the halo already left')
    else:
        print('FAIL: the halo rule never matched')
        sys.exit(1)

    open(CSS, 'w', encoding='utf-8').write(src)
    print('index.css re-speaked: the corner law, the emblem')
    return 0


if __name__ == '__main__':
    sys.exit(main())
