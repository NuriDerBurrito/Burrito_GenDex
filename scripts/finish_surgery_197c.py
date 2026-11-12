#!/usr/bin/env python3
"""finish_surgery_197c.py — 1.9.7 THE GROUNDS FOLLOW THE TWIN'S OWN SEAM
(TagRibbon.jsx + index.css).

The 1.9.6 ground classes left the widest band the wheel owns classless
(every plate between the 0.19 and 0.78 luminance rails): the soft-light
bodies whispered there no matter what ink they carried, and the 1.9.6
light-ground cures never reached the band. The classes now flip at the
TWIN'S OWN SEAM — one law, one line: luminance 0.5.
  · lum >= 0.5 → gd-fin-ground-light (the multiply coats speak; plates
    past the old 0.78 rail additionally carry gd-fin-ground-bright,
    where the white-ink seats' fixed gray facet owns its contrast).
  · lum < 0.5 → gd-fin-ground-dark (the screen family — the same seats
    the vivid class flipped, now for the whole lower half).
The vivid class retires (its screen family IS the dark family's list);
the honest middle keeps its seat for the THEME's colorless cards alone.
"""
import re
import sys

RIBBON = 'src/components/TagRibbon.jsx'
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
    # ------------------------------------------------------------------
    # TagRibbon.jsx — the ground classes follow the twin's seam
    # ------------------------------------------------------------------
    rib = open(RIBBON, encoding='utf-8').read()
    rib = sub_once(
        rib,
        """  /* 1.9.4 — THE RAIL WIDENS ("when going with the card color too bright
     or such sometimes it makes some of its effect dissapear"): the 1.9.3
     thresholds answered only the outermost extremes (0.84 / 0.16), and
     the bright-but-not-white plates (a gold, a cream, a bright lilac)
     landed in the classless middle where the 1.9.3 card-color inks
     washed toward the plate and the glints thinned to nothing. The
     light rail steps down to 0.78 and the dark rail up to 0.19 — the
     honest middle keeps its seat, but every plate the eye reads as
     BRIGHT now meets the ink law (index.css's 1.9.4 seats) that keeps
     its coat speaking. */
  if (lum >= 0.78) return 'gd-fin-ground-light';
  if (lum <= 0.19) return 'gd-fin-ground-dark';
  if (sat >= 0.85 && lum >= 0.2) return 'gd-fin-ground-vivid';
  return '';
}""",
        """  /* 1.9.7 — THE GROUNDS FOLLOW THE TWIN'S OWN SEAM ("the effects
     vanishing or becoming inverted or turn from white to black when the
     color is going to high saturation or high brightness or low
     brightness or low saturation (aka if i pull the color wheel to the
     most extreme 4 corners ...) they always break"): the 1.9.6 classes
     left the widest band the wheel owns CLASSLESS (every plate between
     the 0.19 and 0.78 rails) — and in that band the soft-light bodies
     whispered no matter what ink they carried (soft-light on a mid
     plate speaks a fraction of a percent), while the suggestion
     palette's own mid-bright patients (a mist, an apple, a slate, a
     tangerine) measured whole families at mag 2.4-5.6. The classes now
     flip at the TWIN'S OWN SEAM — luminance 0.5, the exact line the
     ink's derivation already flips at (one law, one line, no band the
     coat's words can disagree in):
     · lum >= 0.5 speaks gd-fin-ground-light (the multiply coats — the
       twin's shadow inks × multiply read on every bright plate), and
       the plates past the old 0.78 rail additionally carry
       gd-fin-ground-bright, where the white-ink seats' FIXED GRAY
       facet owns its contrast (a 0.55 gray only reads against a
       genuinely bright plate — on a 0.6 plate the natives answer
       better: the overlay stars whiten, the screen ripples lift);
     · lum < 0.5 speaks gd-fin-ground-dark (the screen family — the
       twin's lift inks already carry their own light, and screen is
       the one blend that cannot identity on the wheel's fully
       saturated lower corners: pure red, green and magenta lived
       where overlay spoke nothing at all).
     The VIVID class retires with the band it served (its overlay flip
     answered a mid-saturated plate the twin now answers better; its
     screen family was already the dark family's own list). The
     classless middle keeps its seat for the THEME's colorless cards
     alone — their grounds are mid-toned by design and their natives
     were always measured good. */
  if (lum >= 0.5) return lum >= 0.78 ? 'gd-fin-ground-light gd-fin-ground-bright' : 'gd-fin-ground-light';
  return 'gd-fin-ground-dark';
}""",
        'the grounds follow the twin\'s seam',
    )
    # the sat variable retires with the vivid class (unused would lint)
    rib = sub_once(
        rib,
        """  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const sat = mx > 0 ? (mx - mn) / mx : 0;
""",
        """  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
""",
        'the vivid yardstick retires',
    )
    open(RIBBON, 'w', encoding='utf-8').write(rib)

    # ------------------------------------------------------------------
    # index.css — the light list splits: tint seats (light) + white-ink
    # seats (bright); the facet rescopes to bright; the vivid block
    # retires (the dark family speaks its whole list)
    # ------------------------------------------------------------------
    css = open(CSS, encoding='utf-8').read()

    # 1. the white-ink seats leave the light multiply list
    css = sub_once(
        css,
        """.gd-fin-ground-light .gd-finish-foil-ripples,
.gd-fin-ground-light .gd-foil-ripple,
.gd-fin-ground-light .gd-finish-auric,""",
        """.gd-fin-ground-light .gd-finish-auric,""",
        'the foil ripples leave the light list',
    )
    css = sub_once(
        css,
        """.gd-fin-ground-light .gd-nuri-flare,
.gd-fin-ground-light .gd-finish-holographic::before,
.gd-fin-ground-light .gd-holo-shards,
.gd-fin-ground-light .gd-holo-dots,
.gd-fin-ground-light .gd-prism-stars,
.gd-fin-ground-light .gd-prism-particles,
.gd-fin-ground-light .gd-prism-waves,
.gd-fin-ground-light .gd-prism-sweep {
  mix-blend-mode: multiply;
}""",
        """.gd-fin-ground-light .gd-nuri-flare {
  mix-blend-mode: multiply;
}
/* 1.9.7 — THE WHITE-INK SEATS KEEP THEIR NATIVES ON THE MID-BRIGHT
   HALF: a FIXED GRAY facet (or a multiplied white) only owns its
   contrast against a genuinely bright plate — on a 0.5..0.78 plate
   the natives answer better (the overlay stars whiten, the screen
   ripples and dots lift, the lattice's own colored fills read at
   their own alphas). The BRIGHT subclass (plates past the old 0.78
   rail — .gd-fin-ground-bright, spoken beside .gd-fin-ground-light
   by finishGroundTone) seats the 1.9.6 law exactly where it was
   measured: the white-ink seats join the multiply stack there. */
.gd-fin-ground-bright .gd-finish-foil-ripples,
.gd-fin-ground-bright .gd-foil-ripple,
.gd-fin-ground-bright .gd-finish-holographic::before,
.gd-fin-ground-bright .gd-holo-shards,
.gd-fin-ground-bright .gd-holo-dots,
.gd-fin-ground-bright .gd-prism-stars,
.gd-fin-ground-bright .gd-prism-particles,
.gd-fin-ground-bright .gd-prism-waves,
.gd-fin-ground-bright .gd-prism-sweep {
  mix-blend-mode: multiply;
}""",
        'the white-ink seats move to the bright subclass',
    )

    # 2. the facet rescopes: light → bright
    css = sub_once(
        css,
        """.gd-fin-ground-light .gd-finish-foil-ripples,
.gd-fin-ground-light .gd-finish-holographic::before,
.gd-fin-ground-light .gd-holo-shards,
.gd-fin-ground-light .gd-holo-dots,
.gd-fin-ground-light .gd-prism-stars,
.gd-fin-ground-light .gd-prism-particles,
.gd-fin-ground-light .gd-prism-waves,
.gd-fin-ground-light .gd-prism-sweep {
  filter: brightness(0.55) saturate(1.18);
}""",
        """.gd-fin-ground-bright .gd-finish-foil-ripples,
.gd-fin-ground-bright .gd-finish-holographic::before,
.gd-fin-ground-bright .gd-holo-shards,
.gd-fin-ground-bright .gd-holo-dots,
.gd-fin-ground-bright .gd-prism-stars,
.gd-fin-ground-bright .gd-prism-particles,
.gd-fin-ground-bright .gd-prism-waves,
.gd-fin-ground-bright .gd-prism-sweep {
  filter: brightness(0.55) saturate(1.18);
}""",
        'the facet rescopes to the bright subclass',
    )

    # 3. the vivid block retires (the dark family speaks its list)
    vivid_re = re.compile(
        r"/\* 1\.9\.7 — THE VIVID GROUND SPEAKS SCREEN \([\s\S]*?\n\}\n"
    )
    m = vivid_re.search(css)
    if m:
        css = vivid_re.sub(
            """/* 1.9.7 — THE VIVID CLASS RETIRES: its 1.9.2 overlay flip answered a
   mid-saturated plate the twin now answers better, and its screen
   family (spoken below for the whole lower half) was already the dark
   family's own list. finishGroundTone speaks light (>= 0.5, with the
   bright subclass past 0.78) or dark (< 0.5) — the twin's own seam,
   one law, one line; see TagRibbon.jsx. */
""",
            css,
        )
        print('  spoke: the vivid block retires')
    elif 'gd-fin-ground-vivid .gd-finish-foil,' not in css:
        print('  skip (idempotent): the vivid block already retired')
    else:
        print('FAIL: the vivid block never matched')
        sys.exit(1)

    # 4. the dark family's own two rules merge into the full screen list
    #    (they spoke the same seats in two breaths; one breath now)
    css = sub_once(
        css,
        """.gd-fin-ground-dark .gd-finish-foil,
.gd-fin-ground-dark .gd-finish-auric {
  mix-blend-mode: screen;
}""",
        """/* 1.9.7 — THE DARK FAMILY'S OWN YARDSTICK WIDENS: the class speaks
   for the plate's whole lower half now (the twin's own seam — see
   finishGroundTone), and the same screen list answers the wheel's
   fully saturated lower corners (pure red, green, magenta — where
   overlay and soft-light both speak identity). */
.gd-fin-ground-dark .gd-finish-foil,
.gd-fin-ground-dark .gd-finish-auric {
  mix-blend-mode: screen;
}""",
        "the dark family's comment joins the seam law",
    )

    open(CSS, 'w', encoding='utf-8').write(css)
    print('the grounds follow the twin\'s seam: TagRibbon + index.css')
    return 0


if __name__ == '__main__':
    sys.exit(main())
