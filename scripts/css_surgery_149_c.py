#!/usr/bin/env python3
"""1.4.9 CSS surgery C — THE STILL'S SCOPE, THE OFF-STAGE WALL, THE CORNER WELD.
#6  — off-view cards + the hidden app pause their whole finish family.
#11 — the manual reduced-motion kill switch retires for three scoped stills.
#12 — the decorative trim seals weld their corners (radius tightened).
"""
import io, sys

CSS = 'src/index.css'
src = io.open(CSS, encoding='utf-8').read()
orig = src
fails = []

def sub_once(old, new, label, count=1):
    global src
    n = src.count(old)
    if n != count:
        fails.append(label + ': expected ' + str(count) + ', found ' + str(n))
        return
    src = src.replace(old, new)

# --------------------------------------------------------------------------
# 1. THE OFF-STAGE WALL + THE HIDDEN APP HOLD THEIR BREATH — inserted
# right after the freeze law's closing brace (the gd-flight block end).
freeze_tail = (":root.gd-flight [data-gd-region] .gd-img-motion :is(.gd-sleeve-clip, .gd-preview-art) img,\n"
               ":root.gd-flight [data-gd-region] .gd-stamp-motion :is(.gd-card-stamp-band, .gd-card-stamp-placed) {\n"
               "  animation-play-state: paused !important;\n}\n")
sub_once(
    freeze_tail,
    freeze_tail + """/* 1.4.9 — THE OFF-STAGE CARD HOLDS ITS BREATH ("when i open task manager
   i see 2 instances of burrito gendex, both taking alot of cpu, that
   especially occurs when i dont have the card details open"): the wall
   scales with the library, and a card scrolled out of the window kept
   every composited, blend-mode flight turning for an audience of nobody
   (the GPU + renderer processes both chewing — the two hot instances of
   the report). GridView's IntersectionObserver marks every off-window
   card with [data-off-view] (see the 1.4.9 note there); the mark pauses
   that card's WHOLE finish family + its motion clocks — and the moment
   the card scrolls back it RESUMES at the exact phase it froze at (the
   animation-delay never moved: no pop, no restart, a held breath, not a
   death). The 120px pre-wake margin means a card entering the window is
   already breathing before its edge crosses the sill. */
.gd-card[data-off-view] .gd-card-face-finish,
.gd-card[data-off-view] .gd-card-face-finish::before,
.gd-card[data-off-view] .gd-card-face-finish::after,
.gd-card[data-off-view] .gd-card-face-finish *,
.gd-card[data-off-view] .gd-card-face-finish *::before,
.gd-card[data-off-view] .gd-card-face-finish *::after,
.gd-card[data-off-view] .gd-card-face-artfin,
.gd-card[data-off-view] .gd-card-face-artfin::before,
.gd-card[data-off-view] .gd-card-face-artfin::after,
.gd-card[data-off-view] .gd-foil-ripple,
.gd-card[data-off-view] .gd-foil-ripple::before,
.gd-card[data-off-view] .gd-foil-ripple::after,
.gd-card[data-off-view] .gd-img-motion :is(.gd-sleeve-clip, .gd-preview-art) img,
.gd-card[data-off-view] .gd-stamp-motion :is(.gd-card-stamp-band, .gd-card-stamp-placed),
.gd-card[data-off-view] .gd-card-shine::before {
  animation-play-state: paused !important;
}
/* 1.4.9 — THE HIDDEN APP HOLDS ITS BREATH (the same report's other half):
   a minimized or fully covered window still composites every animated
   coat on the wall. The moment the document goes hidden App arms
   .gd-app-hidden on the root (visibilitychange — see App.jsx) and every
   finish + motion clock in the WHOLE app pauses; showing again resumes
   every one at its frozen phase. The two processes go quiet the moment
   the window does. */
html.gd-app-hidden .gd-card-face-finish,
html.gd-app-hidden .gd-card-face-finish::before,
html.gd-app-hidden .gd-card-face-finish::after,
html.gd-app-hidden .gd-card-face-finish *,
html.gd-app-hidden .gd-card-face-finish *::before,
html.gd-app-hidden .gd-card-face-finish *::after,
html.gd-app-hidden .gd-card-face-artfin,
html.gd-app-hidden .gd-card-face-artfin::before,
html.gd-app-hidden .gd-card-face-artfin::after,
html.gd-app-hidden .gd-foil-ripple,
html.gd-app-hidden .gd-foil-ripple::before,
html.gd-app-hidden .gd-foil-ripple::after,
html.gd-app-hidden .gd-img-motion :is(.gd-sleeve-clip, .gd-preview-art) img,
html.gd-app-hidden .gd-stamp-motion :is(.gd-card-stamp-band, .gd-card-stamp-placed) {
  animation-play-state: paused !important;
}
""",
    'off-view + hidden pause laws',
)

# --------------------------------------------------------------------------
# 2. THE STILL'S SCOPE — the manual switch's global kill retires; the
# targeted stills take its place.
kill_block = """html.gd-reduced-motion *,
html.gd-reduced-motion *::before,
html.gd-reduced-motion *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}
html.gd-reduced-motion .loading-spinner {
  animation: gd-spin 0.9s linear infinite !important;
}
"""
sub_once(
    kill_block,
    """/* 1.4.9 — THE STILL LEARNS ITS SCOPE ("reduced motion mode should only
   effect the finishes animation and the right panel opening and card
   moving animation"): the 0.25.0 kill switch was TOTAL — every animation
   AND every transition in the app snapped to 0.01ms the moment the
   switch went on: the jelly squish died under the finger, the hover
   lifts jumped, the folds snapped, the windows popped (skipAnimations
   did the same to framer's flights — retired with it, see App.jsx). The
   still is a family of TARGETED laws now, speaking exactly the three
   things the scope names:
   · THE FINISHES — the whole coat family freezes on its first frame
     (the mirror of the OS media query's own list above);
   · THE PANEL'S CURTAIN + THE CARDS' MOVES — framer's reducedMotion
     carries those (the width flight and every layout spring land
     instant), and the glide-home + sort seats below freeze their CSS
     transitions to match;
   · EVERYTHING ELSE KEEPS ITS VOICE — the press jelly, the hover glare
     and zoom, the folds, the windows' fades, the toasts: all of them
     speak full motion under the switch, exactly as asked. */
html.gd-reduced-motion .gd-finish-foil::before,
html.gd-reduced-motion .gd-finish-holographic::before,
html.gd-reduced-motion .gd-holo-shards,
html.gd-reduced-motion .gd-holo-dots,
html.gd-reduced-motion .gd-finish-mumeix,
html.gd-reduced-motion .gd-kintsugi-veins,
html.gd-reduced-motion .gd-kintsugi-mica,
html.gd-reduced-motion .gd-kintsugi-gleam,
html.gd-reduced-motion .gd-finish-foil,
html.gd-reduced-motion .gd-finish-holographic,
html.gd-reduced-motion .gd-finish-prismatic,
html.gd-reduced-motion .gd-finish-nuri,
html.gd-reduced-motion .gd-mumeix-streams,
html.gd-reduced-motion .gd-mumeix-xmarks,
html.gd-reduced-motion .gd-mumeix-stars,
html.gd-reduced-motion .gd-mumeix-moon,
html.gd-reduced-motion .gd-prism-stars,
html.gd-reduced-motion .gd-prism-waves,
html.gd-reduced-motion .gd-prism-sweep,
html.gd-reduced-motion .gd-nuri-licks,
html.gd-reduced-motion .gd-nuri-sparks,
html.gd-reduced-motion .gd-nuri-flare,
html.gd-reduced-motion .gd-artfin-mumeix,
html.gd-reduced-motion .gd-artfin-kintsugi,
html.gd-reduced-motion .gd-artfin-nuri,
html.gd-reduced-motion .gd-foil-ripple,
html.gd-reduced-motion .gd-finish-foil-ripples,
html.gd-reduced-motion .gd-stamp-motion .gd-card-stamp-band,
html.gd-reduced-motion .gd-stamp-motion .gd-card-stamp-placed,
html.gd-reduced-motion .gd-img-motion .gd-sleeve-clip img,
html.gd-reduced-motion .gd-img-motion .gd-preview-art img {
  animation: none;
}
html.gd-reduced-motion .gd-img-motion .gd-sleeve-clip img,
html.gd-reduced-motion .gd-img-motion .gd-preview-art img {
  translate: none;
}
html.gd-reduced-motion .gd-stamp-motion .gd-card-stamp-band,
html.gd-reduced-motion .gd-stamp-motion .gd-card-stamp-placed {
  translate: none;
}
/* the cards' own moves — the glide-home return and the sort seats — land
   in one frame (the masonry springs are framer's, already instant through
   MotionConfig). */
html.gd-reduced-motion .gd-glide-home .gd-sort-item,
html.gd-reduced-motion .gd-sort-item {
  transition: none !important;
}
""",
    'reduced-motion scoped stills',
)

# --------------------------------------------------------------------------
# 3. THE CORNER WELD — every decorative seal tightens its radius so the
# corner band reaches the border's inner arc (the straight edges never
# move: an inset ring hugs the box edge regardless of radius).
for label, old, new in [
    ('frame seal weld', '.gd-trim-frame {\n  border-radius: max(var(--trim-radius), 0px);', '.gd-trim-frame {\n  border-radius: max(calc(var(--trim-radius) - 2px), 0px);'),
    ('gallery seal weld', '.gd-trim-gallery {\n  border-radius: max(var(--trim-radius), 0px);', '.gd-trim-gallery {\n  border-radius: max(calc(var(--trim-radius) - 2px), 0px);'),
    ('scallop seal weld', '.gd-trim-scallop {\n  border-radius: max(var(--trim-radius), 0px);', '.gd-trim-scallop {\n  border-radius: max(calc(var(--trim-radius) - 2px), 0px);'),
    ('gold seal weld', '.gd-trim-gold {\n  border-radius: max(var(--trim-radius), 0px);', '.gd-trim-gold {\n  border-radius: max(calc(var(--trim-radius) - 2px), 0px);'),
    ('vine seal weld', '.gd-trim-vine {\n  border-radius: max(var(--trim-radius), 0px);', '.gd-trim-vine {\n  border-radius: max(calc(var(--trim-radius) - 2px), 0px);'),
    ('beads seal weld', '.gd-trim-beads {\n  border-radius: max(var(--trim-radius), 0px);', '.gd-trim-beads {\n  border-radius: max(calc(var(--trim-radius) - 2px), 0px);'),
    ('rivet seal weld', '.gd-trim-rivet {\n  border-radius: max(var(--trim-radius), 0px);', '.gd-trim-rivet {\n  border-radius: max(calc(var(--trim-radius) - 2px), 0px);'),
]:
    sub_once(old, new, label)

# The seal note gains its 1.4.9 line.
sub_once(
    "   THE LINE FAMILY STAYS EXEMPT BY DESIGN (dash, double, bold float at\n   their 3px inset on purpose; the ledger's rails are horizontal rules\n   on a page, never a sealed frame). */",
    "   THE LINE FAMILY STAYS EXEMPT BY DESIGN (dash, double, bold float at\n"
    "   their 3px inset on purpose; the ledger's rails are horizontal rules\n"
    "   on a page, never a sealed frame).\n"
    "   1.4.9 — THE CORNERS WELD SHUT (\"there is still a slight gab on the\n"
    "   top right and left of the card where the trims could still go , its\n"
    "   like in the corners\"): the double ring followed the trim's own\n"
    "   radius, and at the TOP corners (the foot plate already fills the\n"
    "   bottom pair) the ring's arc fell a hair short of the border's inner\n"
    "   curve — a crescent of raw image the 1.4.8 lip could not reach. The\n"
    "   seal rings now speak a radius two pixels TIGHTER than the trim's\n"
    "   own: the straight edges never move (an inset ring hugs the box\n"
    "   edge at any radius), and the corner arcs stretch that much closer\n"
    "   to the border's inner curve — the crescent closes, material meets\n"
    "   ink all the way around the arc. */",
    'seal note 1.4.9',
)

if fails:
    print('SURGERY C REFUSED:')
    for f in fails:
        print('  - ' + f)
    sys.exit(1)
if src == orig:
    print('SURGERY C: nothing changed?!')
    sys.exit(1)

io.open(CSS, 'w', encoding='utf-8').write(src)
print('SURGERY C OK')
print('  bytes: ' + str(len(orig)) + ' -> ' + str(len(src)))
