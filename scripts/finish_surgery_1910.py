#!/usr/bin/env python3
"""1.9.10 — THE CLASSIC COAT RETURNS (CSS surgery).

"the last update where colors for finishes were stable was version
1.9.2~1.9.1 and older, the rest of the features are good and i still
want them, but i want you to revert back the finishes and the colors
(except the "x"s in numeix theme, i want them the same still alongside
the transparency sliders options) ... colors like ff8c42 were cool but
now became too pale ... try to revert the coloring and so on to that
version, and then fix from it so its stable"

THE LAW: every coat layer the 1.9.3-1.9.9 "card-color law" touched
returns to its CLASSIC 1.9.2 colors VERBATIM (the fixed anchors the
owner called stable — nothing derives from the card color anywhere in
the coat). KEPT WHOLE, exactly as 1.9.9 speaks them:
  · the numeix X SIGNATURE (the rotated-plus glyph, its lean ink at the
    three seats, its light-ground depth filter, its dark-ground glow
    hand — the owner's explicit carve-out);
  · the COAT'S OWN VOLUME (the transparency knob, the split pair, the
    art-zone masks, the breath clocks' strength calc);
  · the picker fence (1.9.9's wheel law — untouched by this surgery).
RETIRED with the disease: every ground-class blend flip, lift and
filter (the classes stay on the card root — they now switch the X
signature's ink alone), and every tint-hand mix in the coat bodies.

The classic bodies are taken VERBATIM from burrito_gendex_192 (the
delivered 1.9.2 sheet, byte-identical to the shipped zip) and asserted
equal after the swap.

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS = ROOT / 'src' / 'index.css'
REF = Path('/home/z/my-project/burrito_gendex_192/src/index.css')

cur = CSS.read_text(encoding='utf8')
ref = REF.read_text(encoding='utf8')


# ---------------------------------------------------------------------------
# rule-block extraction: exact top-level selector -> full text incl. braces
# ---------------------------------------------------------------------------

def find_rule(text, selector):
    """Return (start, end) of the TOP-LEVEL rule whose full selector text
    equals `selector` (line-start anchored, so compound ground-class
    selectors never match). Exactly one match is required."""
    pat = re.compile(r'(?m)^' + re.escape(selector) + r' \{')
    spans = []
    for m in pat.finditer(text):
        b = text.find('{', m.start())
        depth, j = 1, b + 1
        while j < len(text) and depth:
            if text[j] == '{':
                depth += 1
            elif text[j] == '}':
                depth -= 1
            j += 1
        spans.append((m.start(), j))
    assert len(spans) == 1, f'{selector}: expected 1 top-level rule, found {len(spans)}'
    return spans[0]


def top_level_rules(text):
    """Yield (selector_text, start, end) for every top-level rule."""
    out = []
    i, n = 0, len(text)
    while i < n:
        b = text.find('{', i)
        if b == -1:
            break
        sel = text[i:b].strip()
        depth, j = 1, b + 1
        while j < n and depth:
            if text[j] == '{':
                depth += 1
            elif text[j] == '}':
                depth -= 1
            j += 1
        if sel and not sel.startswith('@'):
            out.append((sel, i, j))
        i = j
    return out


# ---------------------------------------------------------------------------
# PART 1 — the 25 classic returns (body verbatim from the 1.9.2 sheet)
# ---------------------------------------------------------------------------

REVERTS = [
    ('.gd-finish-numeix', 'THE TOOTH SPEAKS ITS CLASSIC BROWN AGAIN',
     "the grain's fixed brown dots return whole (the whisper of tooth 1.9.2 spoke)."),
    ('.gd-numeix-dapple::before', 'THE SUNLIGHT SPEAKS ITS CLASSIC CREAMS AGAIN',
     "the warm patch tile's fixed creams (#f8e8b4, #f2dfa2, #fff3cf) return whole."),
    ('.gd-numeix-streams::after', 'THE CURRENT SPEAKS ITS CLASSIC PALE GOLD AGAIN',
     "the fine contour lines' fixed pale gold (#e6d7a6) returns whole."),
    ('.gd-numeix-moon::before', 'THE HALO SPEAKS ITS CLASSIC SAGE-GOLD AGAIN',
     "the halo's fixed sage-gold fringe returns whole (every stop, every alpha)."),
    ('.gd-numeix-stars::before', 'THE STARFIELD SPEAKS ITS CLASSIC PALE GOLDS AGAIN',
     "the crosses' fixed pale gold (#efdfae) returns whole."),
    ('.gd-artfin-numeix', "THE PICTURE'S SEPIA BAND SPEAKS ITS CLASSIC WASH AGAIN",
     "the artfin's fixed sepia band (0.56..0.46 alphas) returns whole."),
    ('.gd-finish-foil', 'THE METAL SPEAKS ITS CLASSIC VIOLET CHROME AGAIN',
     'the violet body\'s fixed rgba stops return whole ("foil should normally lean towards card color too" — the 1.9.3 ask — retires with its saga: the metal keeps its own word).'),
    ('.gd-finish-foil::before', 'THE RINGS SPEAK THEIR CLASSIC LILAC AND ROSE AGAIN',
     "the concentric heart's fixed lilac and rose rings return whole."),
    ('.gd-finish-foil-ripples::before', 'THE SPARKLE LATTICE SPEAKS ITS CLASSIC WHITE AGAIN',
     'the white four-point lattice returns whole.'),
    ('.gd-foil-ripple', 'THE ARRIVING RING SPEAKS ITS CLASSIC BRIGHT WATER AGAIN',
     "the ripple's fixed bright water-ring returns whole."),
    ('.gd-finish-auric', 'THE HONEY VEIL SPEAKS ITS CLASSIC AMBER AGAIN',
     'the amber veil\'s fixed rgba stops return whole ("auric currently leans towards yellowish, make it lean towards card color too" — the 1.9.3 ask — retires with its saga).'),
    ('.gd-auric-currents::before', 'THE TREASURE SPEAKS ITS CLASSIC GILT AGAIN',
     'the faceted field\'s fixed gilt anchors (#f6d77e, #ffd98f, #ffdf9c, #ffe9b0) return whole.'),
    ('.gd-auric-flakes::before', 'THE LEAF SPEAKS ITS CLASSIC GOLD AGAIN',
     "the first loom's fixed golds return whole."),
    ('.gd-auric-flakes::after', 'THE LEAF SPEAKS ITS CLASSIC GOLD AGAIN (THE SECOND LOOM)',
     "the second loom's fixed golds return whole."),
    ('.gd-auric-sweep::before', 'THE POLISH SPEAKS ITS CLASSIC WHITE-GOLD AGAIN',
     "the rising band's fixed white-gold core and honey skirts return whole."),
    ('.gd-auric-summon::before', 'THE FORGE GLOW SPEAKS ITS CLASSIC HONEY AGAIN',
     "the summon glow's fixed honey radial returns whole."),
    ('.gd-auric-summon::after', 'THE EMBER LATTICE SPEAKS ITS CLASSIC GOLDS AGAIN',
     "the rising ember lattice's fixed golds return whole."),
    ('.gd-artfin-auric', "THE PICTURE'S HONEY SPEAKS ITS CLASSIC WASH AGAIN",
     "the artfin's fixed honey gradient returns whole."),
    ('.gd-finish-nuri', 'THE FORGE BAND SPEAKS ITS CLASSIC FIRE AGAIN',
     'the fire band\'s fixed crimson / ember / molten-gold stripes return whole — the 1.5.0 forge law (the RAW card-tint mixes at the veil and the licks, below) is the coat the owner called stable, and it returns verbatim.'),
    ('.gd-finish-nuri::before', 'THE VEIL SPEAKS ITS CLASSIC DEPTH AGAIN',
     "the veil reads the card's RAW tint at its classic 0.5 opacity — the 1.9.4 0.4 step retires with the tint-hand."),
    ('.gd-finish-nuri::after', 'THE HEARTS SPEAK THEIR CLASSIC GLOW AGAIN',
     'the twin forge glows read the RAW tint at the 1.5.0 weights, verbatim.'),
    ('.gd-nuri-licks::before', 'THE LICKS SPEAK THEIR CLASSIC FIRE AGAIN',
     'the flame streaks read the RAW tint at the 1.5.0 weights (58/48/40), verbatim.'),
    ('.gd-nuri-sparks::before', 'THE SPARKS SPEAK THEIR CLASSIC GOLD LATTICE AGAIN',
     'the spark lattice reads the RAW tint at the 1.5.0 weights, verbatim.'),
    ('.gd-nuri-flare::before', 'THE FLARE SPEAKS ITS CLASSIC MOLTEN CORE AGAIN',
     'the broad warm band reads the RAW tint at the 1.5.0 weights, verbatim.'),
    ('.gd-artfin-nuri', "THE PICTURE'S FIRE SPEAKS ITS CLASSIC WASH AGAIN",
     "the artfin's fixed warm wash + RAW tint band return whole."),
]

ERA_COMMENT = re.compile(r'^/\* 1\.9\.[3-9] — ')


def scrub_era_comments_above(text, rule_start):
    """Walk the contiguous comment chain directly above the rule; remove
    pure 1.9.3-1.9.9 law comments; return (text, new_rule_start)."""
    spans = [(m.start(), m.end()) for m in re.finditer(r'/\*[\s\S]*?\*/', text)]
    chain = []
    pos = rule_start
    while True:
        i = pos
        while i > 0 and text[i - 1] in ' \t\r\n':
            i -= 1
        if i == 0:
            break
        cand = None
        for (s, e) in spans:
            if e == i:
                cand = (s, e)
                break
        if cand is None:
            break
        chain.append(cand)
        pos = cand[0]
    dels = sorted([c for c in chain if ERA_COMMENT.match(text[c[0]:c[0] + 40])], reverse=True)
    for (s, e) in dels:
        tail = text[e:]
        nl = len(tail) - len(tail.lstrip('\n'))
        text = text[:s] + text[e + nl:]
        rule_start -= (e + nl) - s
    return text, rule_start


changed = 0
for sel, title, words in REVERTS:
    rs, re_ = find_rule(cur, sel)
    rbs, rbe = find_rule(ref, sel)
    classic = ref[rbs:rbe]
    cur, rs = scrub_era_comments_above(cur, rs)
    note = (
        f'/* 1.9.10 — {title} ("the last update where colors for finishes\n'
        f'   were stable was version 1.9.2~1.9.1 and older ... i want you to\n'
        f'   revert back the finishes and the colors"): {words} The 1.9.3\n'
        f'   card-color law retires from this seat whole — the classic\n'
        f'   anchors return VERBATIM from the 1.9.2 sheet (the blend word\n'
        f'   and every clock untouched); the card\'s color never enters the\n'
        f'   coat again. */\n'
    )
    rs, re_ = find_rule(cur, sel)  # re-locate after the scrub
    cur = cur[:rs] + note + classic + cur[re_:]
    changed += 1
    print(f'  reverted {sel}')

# ---------------------------------------------------------------------------
# PART 2 — the ground machinery retires (the classes switch the X alone)
# ---------------------------------------------------------------------------


def cut_between(text, start_anchor, end_anchor):
    """Remove [start_anchor, end_anchor); return (text, pos_of_end_anchor)."""
    s = text.index(start_anchor)
    e = text.index(end_anchor, s)
    return text[:s] + text[e:], s


# (a) the whole blend-flip / lift / filter stack, from the mid-bright
#     comment through the combined dapple/currents/auric lift — the X's
#     own filter block (kept) is the end anchor.
cur, pos = cut_between(
    cur,
    "/* 1.9.7 — THE MID-BRIGHT HALF KEEPS ITS GLOWS:",
    "/* 1.9.7 — THE X'S SIGN IN INK",
)
print('  retired the light/bright blend flips, the silver facet, the lifts')

# (b) the dark-family blend flips + the 1.9.4 ink-law comment — the
#     holographic section header (kept) is the end anchor.
cur, _ = cut_between(
    cur,
    "/* 1.9.7 — THE DARK FAMILY'S OWN YARDSTICK WIDENS:",
    '/* HOLOGRAPHIC — the reworked chaos',
)
print('  retired the dark-ground blend flips and the 1.9.4 ink-law note')

# (c) the two kept rules' comments re-speak the 1.9.10 truth (the rules
#     themselves stay VERBATIM — the X signature's own law).
cur, pos = cut_between(
    cur,
    '/* 1.9.9 — THE UNIVERSAL HAND RETIRES INTO THE BASE',
    '.gd-fin-ground-dark .gd-card-face-finish:not(.is-art-zone),',
)
note_dark = (
    '/* 1.9.10 — THE HAND SPEAKS FOR THE X SIGNATURE ALONE ("except the\n'
    '   "x"s in numeix theme, i want them the same still"): every coat\n'
    '   seat but the X marks returned to its classic fixed colors this\n'
    '   release, so the tint hand\'s readers are the X looms alone — and\n'
    '   their 1.9.9 law keeps its whole word: the DARK ground re-seats the\n'
    '   signature\'s ink to the GLOW register (0.78 — an ink that carries\n'
    '   its own light), exactly as the lean spoke it. The artfins no\n'
    '   longer read the hand (their colors are the classic anchors); the\n'
    '   selector stays for the X seats it still reaches. */\n'
)
cur = cur[:pos] + note_dark + cur[pos:]

cur, pos = cut_between(
    cur,
    '/* 1.9.8 — THE PICTURE KEEPS ITS OWN EYE',
    '.gd-card-face-finish.is-art-zone,\n.gd-card-face-artfin.is-art-zone {',
)
note_art = (
    '/* 1.9.10 — THE ART ZONE HAND (the X signature\'s art seat, kept):\n'
    '   the art twin of the pair keeps rendering for every coat that\n'
    '   covers a real image (the picture\'s protection and the split\n'
    '   volume\'s own law — both twins speak the CLASSIC coat now, only\n'
    '   their volume differs under the split), and the X marks above the\n'
    '   notch keep their 1.9.9 art-seat ink (0.75 — the light register the\n'
    '   classic picture-coat\'s anchors always spoke). */\n'
)
cur = cur[:pos] + note_art + cur[pos:]
print('  re-spoke the kept hand rules\' comments to the 1.9.10 law')

# (d) the base rule's hand comment: the hand is the X's ink seat now.
old_base_note = """  /* 1.9.6 — THE INK'S OWN HAND: every tint-leaning stop in every material
     reads the tint through --gd-tint-hand. The var is declared HERE — on
     the coat's own seat, where every pseudo and child inherits it.
     1.9.9 — THE HAND SPEAKS THE LEAN ("i want it to only be affected by
     the hue and saturation, not by brightness ... if you need to rework
     how the finishes get affected by colors go for it as long as it
     matches previously and works properly"): the hand reads --gd-fin-ink,
     which the card roots now write as finishTintLean(cardColor) — the
     card's own hue and saturation whole, seated at a FIXED 0.45 perceptual
     luma (the classic mid-card register, so the classic look is reproduced
     exactly) with the card's brightness never entering the derivation.
     One law, one declaration, every ground and every zone alike: a light
     orange card speaks the same clear-orange coat a mid orange always
     did ("the finish effects should be orange etc.. like before"), the
     drag from a pure hue toward white moves the PLATE alone while the
     coat keeps its color end to end, and the pale band's plates
     (#bbbbbb, #e7c35b) read a coat with its own contrast by
     construction. A colorless card writes no --gd-fin-ink and falls to
     the raw tint (the theme's mid-toned grounds, exactly as they always
     spoke); the 1.9.6/1.9.7 ground-scoped re-speaks of this var retire
     below (no seam left in the ink to scope). */
  --gd-tint-hand: var(--gd-fin-ink, var(--gd-card-tint, var(--gd-panel)));"""
new_base_note = """  /* 1.9.10 — THE INK'S OWN HAND (THE X SIGNATURE'S SEAT): the var is
     declared HERE — on the coat's own seat, where every pseudo and child
     inherits it — and after THE CLASSIC COAT RETURNS its readers are the
     numeix X looms ALONE (every other coat seat speaks its classic fixed
     colors, verbatim from the 1.9.2 sheet). The hand keeps the X's 1.9.9
     law whole: it reads --gd-fin-ink (finishTintLean — the card's hue
     and saturation at the fixed 0.45 perceptual luma seat, the card's
     brightness never entering), the dark ground re-seats it to the glow
     register and the art zone to the art register below. A colorless
     card writes no --gd-fin-ink and falls to the raw tint. */
  --gd-tint-hand: var(--gd-fin-ink, var(--gd-card-tint, var(--gd-panel)));"""
assert old_base_note in cur, 'the base hand note never spoke'
cur = cur.replace(old_base_note, new_base_note, 1)
print('  re-spoke the base hand note to the X-only law')

# ---------------------------------------------------------------------------
# PART 3 — the law's own assertions
# ---------------------------------------------------------------------------

for sel, _, _ in REVERTS:
    a = cur[find_rule(cur, sel)[0]:find_rule(cur, sel)[1]]
    b = ref[find_rule(ref, sel)[0]:find_rule(ref, sel)[1]]
    assert a == b, f'{sel}: the classic body did not land verbatim'
print(f'  asserted all {len(REVERTS)} classic bodies verbatim')

# the ground classes: only the two kept X rules remain
ground = [r for r in top_level_rules(cur) if 'gd-fin-ground' in r[0]]
assert len(ground) == 2, f'ground rules left: {len(ground)} -> {[g[0][:60] for g in ground]}'
assert any('xmarks' in g[0] for g in ground), 'the X filter rule never survived'
assert any('gd-fin-ground-dark' in g[0] for g in ground), 'the dark hand rule never survived'
print('  asserted the ground classes reach the X signature alone')

# the tint hand's readers: the three declarations + the X looms' stops only
readers = re.findall(r'var\(--gd-tint-hand', cur)
decls = re.findall(r'(?m)^\s*--gd-tint-hand:', cur)
assert len(readers) == 10, f'tint-hand var() readers left: {len(readers)}'
assert len(decls) == 3, f'tint-hand declarations left: {len(decls)}'
print('  asserted the hand feeds the X looms alone (10 stops, 3 declarations)')

# brace balance
assert cur.count('{') == cur.count('}'), 'unbalanced braces'
CSS.write_text(cur, encoding='utf8')
print(f'\nfinish_surgery_1910: {changed} classic returns, ground machinery retired, laws asserted — seated.')
