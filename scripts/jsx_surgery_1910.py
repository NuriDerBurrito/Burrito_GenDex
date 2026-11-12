#!/usr/bin/env python3
"""1.9.10 — THE CLASSIC COAT RETURNS (JSX law notes).

The CODE is unchanged by this release's JSX pass — every surface keeps
writing exactly what it wrote in 1.9.9 (the lean + its glow + art seats
now feed the numeix X SIGNATURE's ink alone; the strength vars keep
feeding the transparency knobs; the ground classes keep switching the
X's ink seat). Only the law NOTES re-speak the 1.9.10 truth, so no
comment claims a coat law the sheet no longer carries.

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def sub(path, old, new, count=1):
    p = ROOT / path
    raw = p.read_text(encoding='utf8')
    if new in raw and old not in raw:
        print(f'  {path}: already seated')
        return
    assert old in raw, f'{path}: missing anchor:\n{old[:100]}'
    raw = raw.replace(old, new, count)
    p.write_text(raw, encoding='utf8')
    print(f'  {path}: seated')


# --- TagRibbon.jsx -------------------------------------------------------

sub('src/components/TagRibbon.jsx',
    'export function finishTintLean(cardColor, seat) {',
    '''/* 1.9.10 — THE LEAN SPEAKS FOR THE X SIGNATURE ALONE ("except the
   "x"s in numeix theme, i want them the same still alongside the
   transparency sliders options"): THE CLASSIC COAT RETURNS this release
   — every coat layer but the numeix X marks went back to its classic
   1.9.2 fixed colors verbatim (see index.css), so this derivation's
   only reader is the X looms' tint hand. The function itself keeps its
   1.9.9 law whole and unchanged: hue + saturation in, the fixed luma
   seats out, the card's brightness never entering — the X's carve-out,
   byte for byte. */
export function finishTintLean(cardColor, seat) {''')

sub('src/components/TagRibbon.jsx',
    'export function finishGroundTone(cardColor) {',
    '''/* 1.9.10 — THE GROUNDS CLASS THE X ALONE ("try to revert the coloring
   and so on to that version, and then fix from it so its stable"): the
   classes this returns no longer flip any BLEND anywhere — the whole
   1.9.3-1.9.9 flip/lift/facet stack retired with the classic coat (the
   card root keeps carrying the class, and exactly two CSS rules read
   it: the X signature's dark-ground GLOW ink seat and its light-ground
   depth filter — the owner's carve-out kept as 1.9.9 spoke it). The
   rails below keep their measured seats for that one reader. */
export function finishGroundTone(cardColor) {''')

sub('src/components/TagRibbon.jsx',
    '  const pair = onImage && hasImage;',
    '''  /* 1.9.10 — THE PAIR SPEAKS THE CLASSIC COAT ON BOTH HALVES ("i want
     you to revert back the finishes and the colors"): the pair itself
     STAYS (the picture's protection and the split volume's own law —
     both features the owner kept), but the art twin no longer carries
     any color word of its own: both twins speak the same CLASSIC fixed
     colors now, and the ONLY thing that differs between them is the
     VOLUME each half reads (the main knob for the plate twin, the image
     knob for the art twin while the split checkbox holds). */
  const pair = onImage && hasImage;''')

sub('src/components/TagRibbon.jsx',
    '''        /* 1.9.9 — THE LEAN (--gd-fin-ink carries finishTintLean now: the
           coat's color word, brightness-blind — hue + saturation whole at
           the fixed 0.45 luma seat; see finishTintLean above) + THE GLOW
           SEAT (--gd-fin-glow, the same hue and saturation at 0.62 — the
           carrying light the dark ground's screen family reads; still
           brightness-blind, never solved against the plate). */''',
    '''        /* 1.9.9 — THE LEAN + ITS SEATS, kept for the X SIGNATURE alone
           after 1.9.10's CLASSIC COAT RETURNS: --gd-fin-ink feeds the X
           looms' base tint hand (hue + saturation whole at the fixed
           0.45 luma seat), --gd-fin-glow the X's dark-ground ink seat
           (0.78), --gd-fin-art the X's art-zone seat (0.75) — every other
           coat seat reads none of them (the classic fixed colors). The
           strength vars beside them keep feeding the transparency knobs. */''')

# --- GridView.jsx --------------------------------------------------------

sub('src/components/GridView.jsx',
    '''          : null), /* 1.9.9 — the lean + its glow + art seats (finishTintLean) */''',
    '''          : null), /* 1.9.9 — the lean + its glow + art seats (finishTintLean);
             1.9.10 — THE CLASSIC COAT RETURNS: these feed the numeix X
             signature's ink alone now (every other coat seat speaks its
             classic 1.9.2 fixed colors — see index.css). */''')

# --- CardLookEditor.jsx --------------------------------------------------

sub('src/components/CardLookEditor.jsx',
    '''          : null), /* 1.9.9 — the lean + its glow + art seats (finishTintLean) */''',
    '''          : null), /* 1.9.9 — the lean + its glow + art seats (finishTintLean);
             1.9.10 — THE CLASSIC COAT RETURNS: these feed the numeix X
             signature's ink alone now (every other coat seat speaks its
             classic 1.9.2 fixed colors — see index.css). */''')

print('\\njsx_surgery_1910: the law notes speak the classic truth — seated.')
