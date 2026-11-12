#!/usr/bin/env python3
"""1.4.9 CSS surgery B — THE INTERACTION LAWS (rewritten clean)."""
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

# 1. THE COVER SEAT RETIRES ------------------------------------------------
cover_block_start = "/* 1.4.7 \u2014 THE COVER SEAT (\"when tags/stamps open, dont push the contents"
cover_block_end = ".gd-side-seat.is-cover-seat:has(> .gd-collapse-zone.is-cover-open) .gd-flow-arrow {\n  top: calc(var(--gd-cover-h, 100%) / 2);\n}\n"
i = src.find(cover_block_start)
j = src.find(cover_block_end)
if i < 0 or j < 0 or j < i:
    fails.append('cover block: anchors not found')
else:
    tombstone = (
        "/* 1.4.9 \u2014 THE COVER SEAT IS RETIRED (\"tags and stamp containers on the\n"
        "   right , the containers are above the left and right fade , expand into\n"
        "   each other and doesnt expand correctly into the space , fix its logic,\n"
        "   its to the point the collapse button isnt visible\"): the 1.4.7/1.4.8\n"
        "   overlay drawer \u2014 a seat pinned at its retracted clamp while the open\n"
        "   zone lifted onto an absolute z-15 tinted plate \u2014 fought the panel it\n"
        "   lived in on every side at once: the tinted plate painted OVER the rows'\n"
        "   own edge fades (the \"above the left and right fade\"), both drawers\n"
        "   could be open over the same ground (the \"expand into each other\"),\n"
        "   the rows body's own overflow clip shaved the drawer's bottom so it\n"
        "   never reached the room it claimed (the \"doesnt expand correctly into\n"
        "   the space\"), and the plate covered the tray's own COLLAPSE keyline\n"
        "   outright (the \"collapse button isnt visible\"). The rows EXPAND IN THE\n"
        "   FLOW again \u2014 the one logic every surface here was already built to\n"
        "   speak (SideFlow.jsx retired the prop in the same breath): the zone's\n"
        "   measured max-height flight grows the row, the tray and the panel\n"
        "   beneath it give it the space it asks for, both rows stack without\n"
        "   ever touching each other, the fades and arrows ride the zone's own\n"
        "   edges, and the COLLAPSE key stays visible at the tray's tail. */\n"
    )
    src = src[:i] + tombstone + src[j + len(cover_block_end):]

# 2. THE JELLY'S SEAT WIDENS ------------------------------------------------
sub_once(
    ".gd-card.gd-card-pulse {\n  transform-origin: 50% 50%;\n}\n.gd-card.gd-card-pulse[data-pressed] {\n  animation: gd-press-pulse 620ms ease-in-out both;\n}",
    "/* 1.4.9 \u2014 THE FLIGHT'S SEAT IS THE CLASS ALONE (\"the container on top\n"
    "   left where it shows new card , that takes the size of the card next\n"
    "   to it? its missing clicking feedback on it, fix it\"): the animation\n"
    "   rule used to demand BOTH .gd-card and .gd-card-pulse \u2014 and the NEW\n"
    "   CARD tile (a .gd-card-add, never a .gd-card) carried the pulse class\n"
    "   to a rule that never matched it: the 1.4.8 fix lit up every real\n"
    "   card while the tile sat dead under the finger. The flight speaks\n"
    "   .gd-card-pulse alone now \u2014 every seat that carries the class\n"
    "   breathes, the tile beside the cards included. */\n"
    ".gd-card-pulse {\n  transform-origin: 50% 50%;\n}\n.gd-card-pulse[data-pressed] {\n  animation: gd-press-pulse 620ms ease-in-out both;\n}",
    'pulse seat widened',
)

# 3. THE CARD'S FOCUS RING LEAVES -------------------------------------------
sub_once(
    ".gd-card-pulse[data-pressed]:focus-visible {\n  outline: none;\n}",
    "/* 1.4.9 \u2014 THE RING LEAVES THE CARD FOR GOOD (\"the white outline that\n"
    "   appears above and below the card bottom label is still visible when\n"
    "   i click or click drag on card/ when the animation plays , fix that\"):\n"
    "   the 1.4.8 window ([data-pressed] suppressing :focus-visible) only\n"
    "   covered the flight's own 620ms \u2014 the press ALSO focuses the card\n"
    "   (role button, tabIndex 0), and every beat outside that window (the\n"
    "   hold after the jelly, the click-drag carry, the resting focus after\n"
    "   release) still painted the browser ring's top and bottom bars\n"
    "   through the foot's plain plate, reading exactly as a white outline\n"
    "   above and below the bottom label. The card NEVER paints a focus\n"
    "   ring now: its keyboard affordances already speak through the shine\n"
    "   sweep (:focus-visible glints the art \u2014 see .gd-card-shine below)\n"
    "   and the hover language, and the selection ring owns the open state.\n"
    "   The add tile joins the law (its dashed border never carried a ring\n"
    "   well anyway). */\n"
    ".gd-card:focus,\n"
    ".gd-card:focus-visible,\n"
    ".gd-card-add:focus,\n"
    ".gd-card-add:focus-visible {\n"
    "  outline: none;\n"
    "}",
    'card focus ring retired',
)

# 4. THE RIBBONS' SHADOW HOLDS THROUGH THE JELLY ---------------------------
sub_once(
    "/* The one shared shadow (GridView renders the group wrapper). */\n.gd-card-ribbons {\n  filter: drop-shadow(1px 2px 1px rgba(0, 0, 0, 0.4));\n}",
    "/* The one shared shadow (GridView renders the group wrapper).\n"
    "   1.4.9 \u2014 THE SHADOW HOLDS THROUGH THE JELLY (\"when squish/stretch\n"
    "   animation plays , the shadow below some text such as tags seem to\n"
    "   be bigger during the animation , fix that so it doesnt\"): the\n"
    "   flight's scale breathes the whole card layer, and the ribbons'\n"
    "   drop-shadow \u2014 painted INTO that layer \u2014 scaled with it: the blur\n"
    "   and the offset grew through every beat, and the shadow below the\n"
    "   tags read as swelling with the press. While the flight runs the\n"
    "   shadow swaps to a HELD seat \u2014 the blur retired, the offset trimmed\n"
    "   to the widest beat's reach \u2014 so the scaled result paints at the\n"
    "   resting shadow's own size all flight long. */\n"
    ".gd-card-ribbons {\n  filter: drop-shadow(1px 2px 1px rgba(0, 0, 0, 0.4));\n}\n"
    ".gd-card.gd-card-pulse[data-pressed] .gd-card-ribbons {\n"
    "  filter: drop-shadow(1px 1.9px 0 rgba(0, 0, 0, 0.42));\n"
    "}",
    'ribbon shadow hold',
)

# 5. THE GLARE REPLACES THE FILTER ------------------------------------------
sub_once(
    ".gd-card-hover:hover .gd-sleeve-clip,\n.gd-card-hover:focus-visible .gd-sleeve-clip {\n  filter: brightness(1.05) saturate(1.04);\n}",
    "/* 1.4.9 \u2014 THE LIFT IS A GLARE, NOT A FILTER (\"when i move my cursor in\n"
    "   a fast loop between two cards , the cpu skyrockets , fix that\"):\n"
    "   the hover used to flip brightness+saturate onto the clip \u2014 a FILTER\n"
    "   re-rasters the whole picture on every hover-in AND hover-out, and a\n"
    "   fast cursor loop machine-gunned that raster at the main thread (the\n"
    "   CPU spike the report caught). The same soft lift now rides an\n"
    "   OPACITY pseudo over the art \u2014 the glare fades in and out on the\n"
    "   compositor, the picture's raster never moves, and the img's own\n"
    "   scale zoom (already compositor-owned) keeps its seat beside it. */\n"
    ".gd-card-hover .gd-sleeve-clip::after {\n"
    "  content: '';\n"
    "  position: absolute;\n"
    "  inset: 0;\n"
    "  z-index: 2;\n"
    "  pointer-events: none;\n"
    "  border-radius: inherit;\n"
    "  background: linear-gradient(\n"
    "    160deg,\n"
    "    rgba(255, 255, 255, 0.1) 0%,\n"
    "    rgba(255, 255, 255, 0.035) 42%,\n"
    "    rgba(255, 255, 255, 0.02) 58%,\n"
    "    rgba(255, 255, 255, 0.08) 100%\n"
    "  );\n"
    "  opacity: 0;\n"
    "  transition: opacity 0.24s ease-out;\n"
    "}\n"
    ".gd-card-hover:hover .gd-sleeve-clip::after,\n"
    ".gd-card-hover:focus-visible .gd-sleeve-clip::after {\n"
    "  opacity: 1;\n"
    "}",
    'glare replaces filter',
)

sub_once(
    ":root.gd-scrolling .gd-card-hover .gd-sleeve-clip img,\n:root.gd-no-lift .gd-card-hover .gd-sleeve-clip img {\n  transition: none !important;\n  transform: none !important;\n}",
    ":root.gd-scrolling .gd-card-hover .gd-sleeve-clip img,\n:root.gd-no-lift .gd-card-hover .gd-sleeve-clip img {\n  transition: none !important;\n  transform: none !important;\n}\n:root.gd-scrolling .gd-card-hover .gd-sleeve-clip::after,\n:root.gd-no-lift .gd-card-hover .gd-sleeve-clip::after {\n  transition: none !important;\n  opacity: 0 !important;\n}",
    'glare guards',
)

# 6. THE CTX-HOT CARD SPEAKS THE FULL HOVER LANGUAGE ------------------------
sub_once(
    ".gd-card-hover.is-ctx-hot {\n  transform: translateY(-2px);\n  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.45);\n}",
    "/* 1.4.9 \u2014 THE HOT CARD SPEAKS THE WHOLE HOVER LANGUAGE (\"there is a\n"
    "   clash between card backshadow with the hover/not hover , where\n"
    "   sometimes if i have right click open it would act as if im not\n"
    "   hovering on it, fix that so if i have right click on a card it\n"
    "   would act as if im hovering on it\"): the old pairing answered with\n"
    "   ONE soft shadow that matched no theme's hover \u2014 with the menu open\n"
    "   the card's backshadow CHANGED shape (the \"clash\"), and a press that\n"
    "   landed on a card's own child key never marked the card at all\n"
    "   (GdContextMenu now holds every wrapping card \u2014 see ctxHoldList).\n"
    "   The hot card now speaks the BASE hover geometry exactly (the -2px\n"
    "   lift + the hard 6px backshadow), each theme's own hover arm below\n"
    "   carries its .is-ctx-hot twin, the version badge SEATS (the foot's\n"
    "   hover flip), the hover column shows, and the art wears its glare +\n"
    "   zoom \u2014 the card under an open menu is hovered in full, menu-long. */\n"
    ".gd-card-hover.is-ctx-hot {\n"
    "  transform: translate(-2px, -2px);\n"
    "  box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.45);\n"
    "}\n"
    ".gd-card-hover.is-ctx-hot .gd-sleeve-clip::after {\n"
    "  opacity: 1;\n"
    "}\n"
    ".gd-card-hover.is-ctx-hot .gd-sleeve-clip img {\n"
    "  transform: scale(1.05);\n"
    "}\n"
    ".gd-card.is-ctx-hot .gd-card-hovercol {\n"
    "  opacity: 1;\n"
    "}",
    'ctx-hot base pairing',
)

for theme in ['burrito', 'archive', 'moss', 'glacier']:
    old = (
        "[data-theme='" + theme + "'] .gd-card-hover:hover,\n"
        "[data-theme='" + theme + "'] .gd-card-hover:focus-visible,\n"
        "[data-theme='" + theme + "'] .gd-card-add:hover,\n"
        "[data-theme='" + theme + "'] .gd-card-add:focus-visible {"
    )
    new = (
        "[data-theme='" + theme + "'] .gd-card-hover:hover,\n"
        "[data-theme='" + theme + "'] .gd-card-hover:focus-visible,\n"
        "[data-theme='" + theme + "'] .gd-card-hover.is-ctx-hot,\n"
        "[data-theme='" + theme + "'] .gd-card-add:hover,\n"
        "[data-theme='" + theme + "'] .gd-card-add:focus-visible {"
    )
    sub_once(old, new, theme + ' ctx-hot arm')

sub_once(
    ".gd-card:hover .gd-card-foot-vers.has-vers,\n.gd-card-foot-vers.has-vers:focus-within {\n  grid-template-columns: minmax(0, 1fr) auto;\n  column-gap: 8px;\n}",
    ".gd-card:hover .gd-card-foot-vers.has-vers,\n.gd-card.gd-card-hover.is-ctx-hot .gd-card-foot-vers.has-vers,\n.gd-card-foot-vers.has-vers:focus-within {\n  grid-template-columns: minmax(0, 1fr) auto;\n  column-gap: 8px;\n}",
    'vers seat hot arm (template)',
)
sub_once(
    ".gd-card:hover .gd-card-foot-vers.has-vers .gd-card-vers,\n.gd-card-foot-vers.has-vers:focus-within .gd-card-vers {",
    ".gd-card:hover .gd-card-foot-vers.has-vers .gd-card-vers,\n.gd-card.gd-card-hover.is-ctx-hot .gd-card-foot-vers.has-vers .gd-card-vers,\n.gd-card-foot-vers.has-vers:focus-within .gd-card-vers {",
    'vers seat hot arm (badge)',
)

# 7. THE OS REDUCED-MOTION HOVER GUARDS RETIRE ------------------------------
sub_once(
    "@media (prefers-reduced-motion: reduce) {\n  .gd-card-shine::before {\n    display: none;\n  }\n  .gd-card-hover .gd-sleeve-clip img {\n    transition: none;\n    transform: none;\n  }\n}",
    "/* 1.4.9 \u2014 THE HOVER GUARDS RETIRE (the still's scope \u2014 see the 1.4.9\n"
    "   note at the manual switch below): the shine sweep and the hover\n"
    "   zoom are HOVER interactions, not finish coats \u2014 the reduced motion\n"
    "   mode stills the finishes, the panel's curtain and the cards' own\n"
    "   moves, and lets every hover keep its voice. */",
    'hover media guards retired',
)

if fails:
    print('SURGERY B REFUSED:')
    for f in fails:
        print('  - ' + f)
    sys.exit(1)
if src == orig:
    print('SURGERY B: nothing changed?!')
    sys.exit(1)

io.open(CSS, 'w', encoding='utf-8').write(src)
print('SURGERY B OK')
print('  bytes: ' + str(len(orig)) + ' -> ' + str(len(src)))
