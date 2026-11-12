#!/usr/bin/env python3
"""1.9.10 follow-up: the retired ground machinery's own law-comment stack
(1.9.3 THE EXTREME GROUNDS / 1.9.6 THE CERTAIN INK / 1.9.7 THE HAND
SPEAKS EVERYWHERE) leaves the sheet with one truthful region header —
the kept rules below it (the X signature's ink seats) keep their own
1.9.10 notes. Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS = ROOT / 'src' / 'index.css'
cur = CSS.read_text(encoding='utf8')

START = '/* 1.9.3 — THE EXTREME GROUNDS ("in some color values especially when i'
END = '/* 1.9.10 — THE HAND SPEAKS FOR THE X SIGNATURE ALONE'
s = cur.index(START)
e = cur.index(END)
assert s < e

HEADER = '''/* 1.9.10 — THE GROUNDS RETIRE ("try to revert the coloring and so on
   to that version, and then fix from it so its stable"): the whole
   1.9.3-1.9.9 extreme-ground machinery — the blend flips (multiply on
   light, screen on dark, normal on bright), the silver facet, the
   opacity lifts, the twin's plate-solved derivation — retired with the
   card-color law it served. Every coat speaks its CLASSIC 1.9.2 blends
   on every plate again: the fixed inks the owner called stable, the
   physics the classic sheet always spoke, no blend flip anywhere in the
   coat (a screen voice rests toward white and a soft-light veil rests
   toward black exactly as the classic coat always did — the look the
   owner asked to return to). The ground CLASSES stay on the card root
   (finishGroundTone keeps writing them) for ONE reader alone: the numeix
   X signature — its ink seat and its light-ground depth filter below,
   the owner's explicit carve-out, kept exactly as 1.9.9 spoke them. */

'''

cur = cur[:s] + HEADER + cur[e:]
CSS.write_text(cur, encoding='utf8')
print('clean_ground_comments_1910: the retired stack leaves one truthful header — seated.')
