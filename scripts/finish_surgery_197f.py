#!/usr/bin/env python3
"""finish_surgery_197f.py — 1.9.7 THE X'S SIGN IN INK (index.css).

The numeix family's residue on bright plates: its signature — the
calligraphic X looms — draws inks mixed 38-66% toward the twin with
CREAM anchors, and on a cream-bright plate (the suggestion palette's
own honey #f5d36b) the anchors ride the plate's own channels: the
mixed ink lands within 0.03 of the plate and the family's voice
thins to a whisper (measured: honey at mag 2.8, the coat's one soft
plate). The X's are DRAWN ink (normal blend, no filter clock of their
own — the loomes animate transform and opacity only), so the light
ground gives the signature its pen: a scoped brightness hand deepens
the drawn ink on every plate the light ground classes, the anchors
keep their hue (a touch of saturate holds the golds warm), and the
glow seats (the dapple, the streams, the stars, the moon) keep their
own glow nature untouched — the family's voice deepens where it draws
and stays light where it glows.
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

    src = sub_once(
        src,
        """.gd-fin-ground-light .gd-numeix-dapple {
  opacity: min(1, calc(var(--gd-fin-strength, 1) * 1.6));
}""",
        """.gd-fin-ground-light .gd-numeix-dapple {
  opacity: min(1, calc(var(--gd-fin-strength, 1) * 1.6));
}
/* 1.9.7 — THE X'S SIGN IN INK: the signature's cream anchors ride a
   cream-bright plate's own channels (the suggestion palette's honey
   measured the family at mag 2.8 — the anchors and the plate one
   wash). The X's are drawn ink with no filter clock of their own (the
   looms animate transform and opacity alone), so the light ground
   hands the pen its depth: a scoped brightness step deepens the drawn
   marks on every plate the ground classes (the anchors keep their
   hue — the saturate hand holds the golds warm), while the glow seats
   keep their glow nature untouched. The theme's colorless cards never
   class the ground — their paper keeps every word it always spoke. */
.gd-fin-ground-light .gd-numeix-xmarks {
  filter: brightness(0.78) saturate(1.05);
}""",
        "the X's sign in ink",
    )

    open(CSS, 'w', encoding='utf-8').write(src)
    print('the X signature deepens on the light ground')
    return 0


if __name__ == '__main__':
    sys.exit(main())
