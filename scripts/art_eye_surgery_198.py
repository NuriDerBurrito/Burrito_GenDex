#!/usr/bin/env python3
"""art_eye_surgery_198.py — 1.9.8 item 3, THE PICTURE KEEPS ITS OWN EYE
("finishes such as prismatic and holographic are too visible on images
that it becomes too hard to see the actual image, as if the background
of the finishes actually apply over the image, same goes for alot of the
finishes, and that started happening a few updates ago").

Two words, spoken once each:
  1. THE ART TWIN KEEPS THE CLASSIC COAT — every ground-class blend /
     filter / opacity flip (the 1.9.6-1.9.7 extreme-ground cures) scopes
     to the seats that are NOT the art twin (:not(.is-art-zone)): the
     flips answer the PLATE's extremes, and the picture never asked for
     them — over the art the materials speak their NATIVE blends again
     (the pre-1.9.6 look the report calls back to). Child seats that
     never wear the class themselves (.gd-foil-ripple, .gd-holo-shards,
     .gd-holo-dots) take the exclusion on their ANCESTOR seat instead.
  2. THE ART TWIN KEEPS THE RAW TINT — --gd-tint-hand falls back to the
     card's own color over the art zone (the artfin's own law, extended
     to the whole art half): the twin's shadow/lift derivation answers
     the plate, not the picture.
"""
import re
from pathlib import Path

CSS = Path(__file__).resolve().parent.parent / "src/index.css"
raw = CSS.read_text(encoding="utf-8")
before = raw

# ---------------------------------------------------------------------------
# 1. the art twin's raw tint hand — spoken right after the family's own
#    hand rule (the 1.9.7 universal hand), so the art half blends against
#    the PICTURE with the card's own color, exactly as the artfin always
#    has.
# ---------------------------------------------------------------------------
HAND_ANCHOR = """.gd-card-face-finish,
.gd-card-face-artfin {
  --gd-tint-hand: var(--gd-fin-ink, var(--gd-card-tint, var(--gd-panel)));
}
"""
HAND_NEW = HAND_ANCHOR + """/* 1.9.8 — THE PICTURE KEEPS ITS OWN EYE ("finishes such as prismatic
   and holographic are too visible on images that it becomes too hard
   to see the actual image, as if the background of the finishes
   actually apply over the image, same goes for alot of the finishes,
   and that started happening a few updates ago"): the 1.9.6/1.9.7
   extreme-ground cures (the twin's ink, the ground classes' blend
   flips) answer the PLATE's extremes — over the PICTURE they became a
   veil: a normal-blended riot, a multiply wash, the twin's shadow ink,
   all painting their own alphas straight onto the sprite. The ART TWIN
   (the .is-art-zone half of the split pair — which 1.9.8 now renders
   for every coat that covers a real image, see CardFinishLayer) keeps
   the coat's CLASSIC voice instead: its seats fall out of every
   gd-fin-ground-* flip below (the :not(.is-art-zone) scope) and its
   hand falls back to the card's RAW tint — the artfin's own law,
   extended to the whole art half. The plate twin below the notch keeps
   every word the corner audit ever measured. */
.gd-card-face-finish.is-art-zone,
.gd-card-face-artfin.is-art-zone {
  --gd-tint-hand: var(--gd-card-tint, var(--gd-panel));
}
"""
if HAND_NEW not in raw:
    if HAND_ANCHOR not in raw:
        raise SystemExit("FAIL: the tint-hand family rule never spoke")
    if raw.count(HAND_ANCHOR) != 1:
        raise SystemExit("FAIL: the tint-hand family rule is not unique")
    raw = raw.replace(HAND_ANCHOR, HAND_NEW, 1)
    print("  spoke: the art twin's raw tint hand")
else:
    print("  skip (idempotent): the art twin's raw tint hand")

# ---------------------------------------------------------------------------
# 2. every gd-fin-ground-* rule's seat selectors take :not(.is-art-zone)
#    (seat compounds carry it directly; the three CHILD seats take it on
#    their ancestor seat).
# ---------------------------------------------------------------------------
CHILD_SEATS = {"gd-foil-ripple", "gd-holo-shards", "gd-holo-dots"}
LINE = re.compile(
    r"^(\.gd-fin-ground-(?:light|bright|dark)) (\.([a-zA-Z0-9-]+))((::(?:before|after))?)(,? ?\{?)$"
)

changed = 0
out = []
for line in raw.split("\n"):
    m = LINE.match(line)
    if not m:
        out.append(line)
        continue
    ground, compound, cls, pseudo, tail = m.group(1), m.group(2), m.group(3), m.group(4), m.group(6)
    if cls in CHILD_SEATS:
        # a child seat (never wears the zone class itself) — the exclusion
        # rides its ANCESTOR coat seat
        out.append(f"{ground} .gd-card-face-finish:not(.is-art-zone) {compound}{tail}")
    else:
        out.append(f"{ground} {compound}:not(.is-art-zone){pseudo}{tail}")
    changed += 1
raw = "\n".join(out)

# sanity: the three known child seats each appear in ground rules and got
# the ancestor scope
for child in CHILD_SEATS:
    if f".gd-card-face-finish:not(.is-art-zone) .{child}" not in raw:
        raise SystemExit(f"FAIL: child seat {child} never took the ancestor scope")

print(f"  spoke: {changed} ground-flip seat selectors now scope :not(.is-art-zone)")

if raw == before:
    raise SystemExit("FAIL: nothing changed")
CSS.write_text(raw, encoding="utf-8")
print("OK — the picture keeps its own eye")
