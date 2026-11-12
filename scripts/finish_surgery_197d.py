#!/usr/bin/env python3
"""finish_surgery_197d.py — 1.9.7 THE LIGHT GROUND SPEAKS NORMAL (index.css).

The last corner cure: multiply was itself the final identity — on a
channel-pure bright plate (the wheel's fully saturated high-luminance
corners: a yellow, a green, a cyan) every channel the plate holds at 0
stays 0 under ANY same-hue ink, so a third of the ink's voice died with
the dead channel (measured: numeix at mag 1.7 on pure green — the whole
family a whisper). NORMAL never multiplies: the ink paints its own
channels through its own alphas, the dead channels LIVE (the cream's
blue reads on a yellow plate), and over a WHITE plate normal and
multiply speak the SAME pixel — every word the 1.9.6 law measured on
white keeps its seat, every other bright plate gains the channels
multiply killed. No blend family below 1.0 in a channel can identity
under normal; nothing loops; the plate's own light survives by every
stop's own alpha (each body carries its translucency in its stops —
verified: no opaque seat in the coat).
The rainbow bodies merge back into the one list (their separate normal
rule retires — the whole light ground speaks the one blend); the bright
subclass's white-ink seats join the same word.
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

    # 1. the light list speaks normal + the rainbow bodies rejoin it
    src = sub_once(
        src,
        """.gd-fin-ground-light .gd-nuri-flare {
  mix-blend-mode: multiply;
}""",
        """.gd-fin-ground-light .gd-nuri-flare,
.gd-fin-ground-light .gd-finish-holographic,
.gd-fin-ground-light .gd-finish-prismatic {
  mix-blend-mode: normal;
}""",
        'the light list speaks normal (rainbow bodies rejoined)',
    )

    # 2. the separate rainbow rule retires (merged above)
    rainbow_re = re.compile(
        r"/\* 1\.9\.7 — THE RAINBOW SPEAKS ITS OWN HUES \([\s\S]*?\.gd-fin-ground-light \.gd-finish-prismatic \{\s*\n  mix-blend-mode: normal;\s*\n\}\n"
    )
    if rainbow_re.search(src):
        src = rainbow_re.sub('', src)
        print('  spoke: the separate rainbow rule retires')
    elif src.count('mix-blend-mode: normal;') >= 1 and 'THE RAINBOW SPEAKS ITS OWN HUES' not in src:
        print('  skip (idempotent): the rainbow rule already retired')
    else:
        print('FAIL: the rainbow rule never matched')
        sys.exit(1)

    # 3. the bright subclass's white-ink seats join the same word
    src = sub_once(
        src,
        """.gd-fin-ground-bright .gd-prism-sweep {
  mix-blend-mode: multiply;
}""",
        """.gd-fin-ground-bright .gd-prism-sweep {
  mix-blend-mode: normal;
}""",
        "the bright white-ink seats speak normal",
    )

    # 4. the 1.9.6 CERTAIN INK comment gains the 1.9.7 word
    src = sub_once(
        src,
        """   · THE BLEND — with the ink carrying its own contrast, EVERY plate
     coat seat speaks multiply on the light ground alike (the bodies
     rejoin the stack they were retired from — their twin-mixed washes
     land as gentle colored tints, never the 1.9.4 coffee, because the
     crushing FILTER is gone: the twin darkens the tint component alone,
     the anchors keep their character, and the low alphas keep their
     breath); the forge's veil alone keeps its overlay seat (its ink is
     the twin itself — overlay with a dark top DEEPENS a bright plate,
     the deepen the veil was always meant to speak, and the white-wash
     "negative" the raw tint printed on white retires with it);""",
        """   · THE BLEND — with the ink carrying its own contrast, EVERY plate
     coat seat speaks multiply on the light ground alike (the bodies
     rejoin the stack they were retired from — their twin-mixed washes
     land as gentle colored tints, never the 1.9.4 coffee, because the
     crushing FILTER is gone: the twin darkens the tint component alone,
     the anchors keep their character, and the low alphas keep their
     breath); the forge's veil alone keeps its overlay seat (its ink is
     the twin itself — overlay with a dark top DEEPENS a bright plate,
     the deepen the veil was always meant to speak, and the white-wash
     "negative" the raw tint printed on white retires with it);
   1.9.7 — THE LIGHT GROUND SPEAKS NORMAL ("if i pull the color wheel to
   the most extreme 4 corners ... they always break, and it varries
   between finishes how they break"): multiply was itself the final
   identity — on a channel-pure bright plate (the wheel's fully
   saturated high-luminance corners: a yellow, a green, a cyan) every
   channel the plate holds at 0 stays 0 under ANY same-hue ink, so a
   third of the ink's voice died with the dead channel (measured:
   numeix at mag 1.7 on pure green — the whole family a whisper), and
   the veil's overlay seat spoke identity on those plates outright.
   NORMAL never multiplies: the ink paints its own channels through its
   own alphas, the dead channels LIVE (a cream's blue reads on a yellow
   plate), and over a WHITE plate normal and multiply speak the SAME
   pixel — every word the 1.9.6 law measured on white keeps its seat
   while every other bright plate gains the channels multiply killed.
   No blend family can identity under normal; nothing loops; the
   plate's own light survives by every stop's own alpha (each body
   carries its translucency in its stops — no opaque seat in the coat).
   The veil joins the stack (its twin ink lands as the soft deepen it
   always meant), and the rainbow bodies speak the same word (their
   fixed hues paint as themselves, never re-hued by a plate's own
   channels). The white-ink seats keep their gray facet on the BRIGHT
   subclass alone — a fixed 0.55 gray owns its contrast only against a
   genuinely bright plate (past the 0.78 rail), while the mid-bright
   half's natives (overlay stars, screen ripples) answer better;""",
        'the CERTAIN INK comment gains the normal word',
    )

    open(CSS, 'w', encoding='utf-8').write(src)
    print('the light ground speaks normal')
    return 0


if __name__ == '__main__':
    sys.exit(main())
