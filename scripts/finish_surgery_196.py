#!/usr/bin/env python3
"""1.9.6 — THE INK'S OWN HAND (the tint-hand swap, the surgical half).

Every tint-leaning color-mix stop in the PLATE COAT materials now reads the
tint through --gd-tint-hand (declared on .gd-card-face-finish, re-spoken as
the shadow twin by .gd-fin-ground-light — see the 1.9.6 ground law in
index.css and finishInkTwin in TagRibbon.jsx), so the light ground swaps the
whole family's ink in one seat instead of blend-flipping family by family.

The swap walks RULE BLOCKS whose selector speaks a plate-coat seat
(gd-finish-* / gd-numeix-* / gd-foil-* / gd-auric-* / gd-holo-* /
gd-prism-* / gd-nuri-*) and REPLACES the standard tint shape
  var(--gd-card-tint, var(--gd-panel))
with
  var(--gd-tint-hand, var(--gd-card-tint, var(--gd-panel)))

The ARTFIN seats (.gd-artfin-*) are EXCLUDED BY LAW: the sprite's wash
blends against the PICTURE below it, not the plate, so it keeps reading the
raw tint (a white-plated card can carry a dark photo — the artfin's
soft-light law answers whatever ground the image speaks).

IDEMPOTENT: the swap first collapses any already-handed shape back to the
plain one, then hands it once (a re-run changes nothing — the 1.9.5
worklog's own lesson, spoken as law here).

Run from the app root: python3 scripts/finish_surgery_196.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS = ROOT / 'src' / 'index.css'

PLAIN = 'var(--gd-card-tint, var(--gd-panel))'
HANDED = 'var(--gd-tint-hand, var(--gd-card-tint, var(--gd-panel)))'

# rule blocks whose SELECTOR speaks a plate-coat seat (the materials family).
# The artfin twins are excluded; every other --gd-card-tint seat in the sheet
# (the foot plates, the grounds, the trim derivations) never matches.
COAT_SEL = re.compile(
    r'(?<![\w-])gd-(?:'
    r'finish-(?:numeix|foil-ripples|foil|auric|holographic|prismatic|nuri)'
    r'|numeix-[a-z]+|foil-ripple'
    r'|auric-(?:currents|flakes|sweep|summon)'
    r'|holo-(?:shards|dots)'
    r'|prism-(?:stars|particles|waves|sweep)'
    r'|nuri-(?:licks|sparks|flare)'
    r')(?![\w-])'
)

def main() -> None:
    raw = CSS.read_text(encoding='utf8')
    # 1. idempotence: collapse any handed shape back to plain before handing.
    raw = raw.replace(HANDED, PLAIN)

    # 2. walk top-level rule blocks (selector { ... }) — no nested braces in
    #    this sheet's declaration blocks except inside functions, and the
    #    walker below only splits on a `}` that ENDS a line, which no
    #    color-mix/mask function ever does in this file.
    out = []
    pos = 0
    swapped = 0
    for m in re.finditer(r'(^|\n)([^\n@{}][^{}\n]*?)\s*\{([^{}]*?)\n\}', raw):
        sel = m.group(2)
        body = m.group(3)
        out.append(raw[pos:m.start()])
        if COAT_SEL.search(sel) and 'gd-artfin' not in sel and PLAIN in body:
            body = body.replace(PLAIN, HANDED)
            swapped += 1
        out.append(m.group(1) + sel + ' {' + body + '\n}')
        pos = m.end()
    out.append(raw[pos:])
    text = ''.join(out)
    CSS.write_text(text, encoding='utf8')
    print(f'handed {swapped} plate-coat rule blocks')
    # sanity: the artfin seats stay raw
    art = re.search(r'\.gd-artfin-numeix\s*\{[^{}]*\}', text)
    if art and HANDED in art.group(0):
        raise SystemExit('ARTFIN WAS HANDED — the law is broken, inspect!')
    print('artfin keeps the raw tint — OK')

if __name__ == '__main__':
    main()
