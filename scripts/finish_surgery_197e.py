#!/usr/bin/env python3
"""finish_surgery_197e.py — 1.9.7 THE BRIGHT GROUND SPEAKS NORMAL, THE
MID-BRIGHT KEEPS ITS GLOWS (index.css).

The 197d pass spoke normal for the WHOLE light ground — and the mid-
bright half (0.5..0.78) lost the screen glows that were always its
voice (screen(ink, a 0.6 plate) lifts +0.1..0.4; normal paints only
|ink - plate|): the numeix family dropped to mag 1.5-3.3 there. The
law splits where it always belonged — at the bright subclass's own
0.78 rail:
  · the MID-BRIGHT half keeps the 1.9.6 structure: the broad TINT
    washes (numeix's paper, foil's metal + rings, auric's honey, nuri's
    forge + veil) speak multiply (their twin inks darken gently), the
    light-throwing sub-seats keep their NATIVE screen (the glows the
    family was born speaking), the X's stay normal natives, the rainbow
    bodies stay normal (their fixed hues never re-hue);
  · the BRIGHT subclass (>= 0.78, spoken beside light) speaks NORMAL
    for the whole coat at once — over white normal and multiply are the
    same pixel (every 1.9.6 measurement keeps its seat) while the
    channel-pure brights (yellow, green, cyan) gain the channels
    multiply killed (a cream's blue reads on a yellow plate — the dead
    channel LIVES).
"""
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

    # 1. the light list narrows to the broad tint washes (multiply);
    #    the screen glows + X's return to their natives
    src = sub_once(
        src,
        """.gd-fin-ground-light .gd-finish-numeix,
.gd-fin-ground-light .gd-numeix-dapple,
.gd-fin-ground-light .gd-numeix-streams,
.gd-fin-ground-light .gd-numeix-xmarks,
.gd-fin-ground-light .gd-numeix-stars,
.gd-fin-ground-light .gd-numeix-moon,
.gd-fin-ground-light .gd-finish-foil,
.gd-fin-ground-light .gd-finish-foil::before,
.gd-fin-ground-light .gd-finish-auric,
.gd-fin-ground-light .gd-auric-currents,
.gd-fin-ground-light .gd-auric-flakes,
.gd-fin-ground-light .gd-auric-sweep,
.gd-fin-ground-light .gd-auric-summon,
.gd-fin-ground-light .gd-finish-nuri,
.gd-fin-ground-light .gd-finish-nuri::before,
.gd-fin-ground-light .gd-finish-nuri::after,
.gd-fin-ground-light .gd-nuri-licks,
.gd-fin-ground-light .gd-nuri-sparks,
.gd-fin-ground-light .gd-nuri-flare,
.gd-fin-ground-light .gd-finish-holographic,
.gd-fin-ground-light .gd-finish-prismatic {
  mix-blend-mode: normal;
}""",
        """/* 1.9.7 — THE MID-BRIGHT HALF KEEPS ITS GLOWS: the broad tint washes
   (the paper, the metal, the honey, the forge + its veil) speak
   multiply — their twin inks darken a mid-bright plate gently — while
   the light-throwing sub-seats (the blooms, the currents, the embers)
   keep their NATIVE screen (a glow's own word on a 0.5..0.78 plate:
   screen lifts +0.1..0.4 where normal would paint |ink - plate|
   alone) and the X's keep their normal native. The rainbow bodies
   speak normal below (their own rule). The BRIGHT subclass flips the
   whole coat to normal at once — see the bright seat below. */
.gd-fin-ground-light .gd-finish-numeix,
.gd-fin-ground-light .gd-finish-foil,
.gd-fin-ground-light .gd-finish-foil::before,
.gd-fin-ground-light .gd-finish-auric,
.gd-fin-ground-light .gd-finish-nuri,
.gd-fin-ground-light .gd-finish-nuri::before {
  mix-blend-mode: multiply;
}
.gd-fin-ground-light .gd-finish-holographic,
.gd-fin-ground-light .gd-finish-prismatic {
  mix-blend-mode: normal;
}
/* 1.9.7 — THE BRIGHT SUBCLASS SPEAKS NORMAL (the whole coat, one
   word): over a white plate normal and multiply speak the SAME pixel —
   every word the 1.9.6 law measured on white keeps its seat — while
   the channel-pure brights (the wheel's fully saturated high-luminance
   corners: a yellow, a green, a cyan) gain the channels multiply
   killed: every channel the plate holds at 0 stays 0 under ANY
   same-hue multiply ink (measured: numeix at mag 1.7 on pure green),
   and normal never multiplies — the ink paints its own channels
   through its own alphas and the dead channels LIVE (a cream's blue
   reads on a yellow plate). No blend family can identity under
   normal; nothing loops; the plate's own light survives by every
   stop's own alpha (no opaque seat in the coat — verified). */
.gd-fin-ground-bright .gd-finish-numeix,
.gd-fin-ground-bright .gd-numeix-dapple,
.gd-fin-ground-bright .gd-numeix-streams,
.gd-fin-ground-bright .gd-numeix-xmarks,
.gd-fin-ground-bright .gd-numeix-stars,
.gd-fin-ground-bright .gd-numeix-moon,
.gd-fin-ground-bright .gd-finish-foil,
.gd-fin-ground-bright .gd-finish-foil::before,
.gd-fin-ground-bright .gd-finish-foil-ripples,
.gd-fin-ground-bright .gd-foil-ripple,
.gd-fin-ground-bright .gd-finish-auric,
.gd-fin-ground-bright .gd-auric-currents,
.gd-fin-ground-bright .gd-auric-flakes,
.gd-fin-ground-bright .gd-auric-sweep,
.gd-fin-ground-bright .gd-auric-summon,
.gd-fin-ground-bright .gd-finish-nuri,
.gd-fin-ground-bright .gd-finish-nuri::before,
.gd-fin-ground-bright .gd-finish-nuri::after,
.gd-fin-ground-bright .gd-nuri-licks,
.gd-fin-ground-bright .gd-nuri-sparks,
.gd-fin-ground-bright .gd-nuri-flare,
.gd-fin-ground-bright .gd-finish-holographic,
.gd-fin-ground-bright .gd-finish-holographic::before,
.gd-fin-ground-bright .gd-holo-shards,
.gd-fin-ground-bright .gd-holo-dots,
.gd-fin-ground-bright .gd-finish-prismatic,
.gd-fin-ground-bright .gd-prism-stars,
.gd-fin-ground-bright .gd-prism-particles,
.gd-fin-ground-bright .gd-prism-waves,
.gd-fin-ground-bright .gd-prism-sweep {
  mix-blend-mode: normal;
}""",
        'the light law splits at the bright rail',
    )

    # 2. the bright white-ink rule (multiply→normal from 197d) folds
    #    into the one list above — retire the duplicate block
    src = sub_once(
        src,
        """.gd-fin-ground-bright .gd-finish-foil-ripples,
.gd-fin-ground-bright .gd-foil-ripple,
.gd-fin-ground-bright .gd-finish-holographic::before,
.gd-fin-ground-bright .gd-holo-shards,
.gd-fin-ground-bright .gd-holo-dots,
.gd-fin-ground-bright .gd-prism-stars,
.gd-fin-ground-bright .gd-prism-particles,
.gd-fin-ground-bright .gd-prism-waves,
.gd-fin-ground-bright .gd-prism-sweep {
  mix-blend-mode: normal;
}

""",
        '',
        'the duplicate bright white-ink rule folds in',
    )

    # 3. the dapple's breath hand rides the whole light ground (both
    #    halves — the bright normal benefits as much as the old
    #    multiply did)
    # (already scoped .gd-fin-ground-light — bright carries light too)

    open(CSS, 'w', encoding='utf-8').write(src)
    print('the bright ground speaks normal; the mid-bright keeps its glows')
    return 0


if __name__ == '__main__':
    sys.exit(main())
