#!/usr/bin/env python3
"""ui_surgery_197.py — 1.9.7 THE SELECTED LANE SPEAKS LOUDER (index.css).

"when a class is selected and the accent color affects the background,
make it a bit more visible since right now it somewhat blends in":
the 0.38.0 lane wash spoke the accent at 9% and the card at 14% — a
whisper against the theme's own panel. Both step up a register (16%
lane / 20% card, hover 24%), the lane's inset bar and the card's ring
deepen with them, and the colored classes' selected wash steps the
same register so the two ladders keep one voice.
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

    # the lane's own wash + inset bar
    src = sub_once(
        src,
        """.gd-tree-row[data-selected] {
  background: color-mix(in srgb, var(--gd-accent) 9%, transparent);
  box-shadow: inset 2px 0 0 color-mix(in srgb, var(--gd-accent) 55%, transparent);
}""",
        """.gd-tree-row[data-selected] {
  /* 1.9.7 — THE SELECTED LANE SPEAKS LOUDER ("make it a bit more
     visible since right now it somewhat blends in"): the 0.38.0 wash
     spoke 9% — a whisper against the panel. 16%, and the bar 72%. */
  background: color-mix(in srgb, var(--gd-accent) 16%, transparent);
  box-shadow: inset 2px 0 0 color-mix(in srgb, var(--gd-accent) 72%, transparent);
}""",
        'the lane wash deepens',
    )

    # the card's selected wash + ring
    src = sub_once(
        src,
        """.gd-tree-card[data-selected] {
  background: color-mix(in srgb, var(--gd-accent) 14%, var(--gd-panel));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--gd-accent) 55%, transparent),
    inset 2px 0 0 var(--gd-accent);
}""",
        """.gd-tree-card[data-selected] {
  background: color-mix(in srgb, var(--gd-accent) 20%, var(--gd-panel));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--gd-accent) 68%, transparent),
    inset 2px 0 0 var(--gd-accent);
}""",
        'the card wash deepens',
    )

    # the hover-selected seat
    src = sub_once(
        src,
        """.gd-tree-row:hover .gd-tree-card[data-selected] {
  background: color-mix(in srgb, var(--gd-accent) 18%, var(--gd-panel));
}""",
        """.gd-tree-row:hover .gd-tree-card[data-selected] {
  background: color-mix(in srgb, var(--gd-accent) 24%, var(--gd-panel));
}""",
        'the hover wash deepens',
    )

    # the colored classes' selected ladder steps the same register
    src = sub_once(
        src,
        """.gd-tree-row[data-colored] .gd-tree-card[data-selected] {
  background: color-mix(in srgb, var(--cls) 32%, var(--gd-panel));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--cls) 88%, transparent),
    inset 2px 0 0 var(--cls);
}""",
        """.gd-tree-row[data-colored] .gd-tree-card[data-selected] {
  background: color-mix(in srgb, var(--cls) 38%, var(--gd-panel));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--cls) 92%, transparent),
    inset 2px 0 0 var(--cls);
}""",
        'the colored selected ladder steps with it',
    )
    src = sub_once(
        src,
        """.gd-tree-row[data-colored]:hover .gd-tree-card[data-selected] {
  background: color-mix(in srgb, var(--cls) 38%, var(--gd-panel));
}""",
        """.gd-tree-row[data-colored]:hover .gd-tree-card[data-selected] {
  background: color-mix(in srgb, var(--cls) 44%, var(--gd-panel));
}""",
        'the colored hover-selected steps with it',
    )

    open(CSS, 'w', encoding='utf-8').write(src)
    print('the selected lane speaks louder')
    return 0


if __name__ == '__main__':
    sys.exit(main())
