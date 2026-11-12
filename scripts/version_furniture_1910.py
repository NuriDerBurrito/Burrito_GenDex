#!/usr/bin/env python3
"""1.9.10 version furniture — the app tree's own seats (the suites' pins
are swept separately by version_sweep_1910.py, and the 1910 suite is born
speaking 1.9.10 — the sweep excludes it by law, exactly as the 200 suite
was born excluded at 1.9.9).

1.9.10 — THE CLASSIC COAT RETURNS, one law: the finishes' coloring goes
back to the classic 1.9.1/1.9.2 sheet whole ("the last update where
colors for finishes were stable was version 1.9.2~1.9.1 and older ...
i want you to revert back the finishes and the colors") — every layer
the 1.9.3 card-color law ever touched speaks its classic fixed anchors
VERBATIM (asserted byte-equal against the delivered 1.9.2 sheet), the
numeix X signature and the transparency knobs keep their whole 1.9.9
word (the owner's explicit carve-outs), the ground classes retire to
switching the X's ink alone, and the corners stay accounted for (the
78-plate sweep re-baselined to the classic law: presence + sanity on
every finish × every plate — with fixed colors there is no derivation
left to break).

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def sub(path: str, old: str, new: str, count=1) -> None:
    p = ROOT / path
    raw = p.read_text(encoding="utf8")
    if new in raw and old not in raw:
        print(f"  {path}: already seated")
        return
    assert old in raw, f"{path}: missing seat:\n{old[:120]}"
    raw = raw.replace(old, new, count)
    p.write_text(raw, encoding="utf8")
    print(f"  {path}: seated")


CHANGELOG_ENTRY = """## 1.9.10 — The Classic Coat Returns

One law — the finishes' coloring goes back to the classic 1.9.1/1.9.2 sheet, whole ("the last update where colors for finishes were stable was version 1.9.2~1.9.1 and older, the rest of the features are good and i still want them, but i want you to revert back the finishes and the colors ... since currently the issue is that finishes colors are too pale, and when i mess around with values close to the white or close to complete desaturation or complete white, or halfway, or too bright, or too dark, etc, the finishes look ugly, that didnt happen prior ... colors like ff8c42 were cool but now became too pale for example on finishes, some others became too blended in with the finish or too pale, moving to color values towards the top left or top center or left center is too broken, while values everywhere else is off or broken").

- **The classic coat returns** ("try to revert the coloring and so on to that version, and then fix from it so its stable"): every layer the 1.9.3 "card-color law" ever touched — numeix's tooth, sunlight, current, halo and starfield; foil's metal body, rings, sparkle lattice and arriving ripples; auric's honey veil, treasure, both leaf looms, polish, forge glow and ember lattice; nuri's fire band, veil, hearts, licks, sparks and flare; and all three picture-washes (artfin numeix / auric / nuri) — speaks its CLASSIC 1.9.2 colors again, taken VERBATIM from the delivered 1.9.2 sheet and asserted byte-equal after the swap: nothing derives from the card color anywhere in the coat, so a #ff8c42 card wears the exact coat a mid card always wore, a light orange card wears the coat the owner approved in 1.9.2, and the pale washes, the vanished backgrounds (#bbbbbb, #e7c35b), the inversions near white and the "too blended in" mid-bands all retire with the derivation that wrote them — there is no derivation left. Nuri keeps its 1.5.0 forge law verbatim (the raw card-tint mixes at the veil, hearts, licks, sparks, flare and the picture's fire band — the word the owner called stable), and holographic / prismatic never left the classic sheet at all. The whole 1.9.3-1.9.9 extreme-ground machinery — the blend flips (multiply on light, screen on dark, normal on bright), the silver facet, the opacity lifts, the plate-solved twin — retires with it: every coat speaks its classic blends on every plate again, exactly as the classic physics always spoke them.
- **The X's and the sliders stay** ("except the "x"s in numeix theme, i want them the same still alongside the transparency sliders options"): the numeix X signature keeps its whole 1.9.9 law — the rotated-plus glyph, its lean ink (the card's hue and saturation at the fixed seats: 0.45 base, 0.78 on dark grounds, 0.75 over the picture — the card's brightness never entering), and its light-ground depth filter — and the transparency knobs keep their whole word: the main slider, the checkbox-gated image slider, the split pair (the plate twin and the art twin now speak the SAME classic coat, only their volume differs), the art-zone masks, and the strength calc inside every breath clock. The ground classes stay on the card root (finishGroundTone keeps writing them) but exactly two CSS rules read them now — the X's dark-ground ink seat and its light-ground filter.
- **The corners stay accounted for** ("i want you to account for each of teh finishes values when the color shifts to the absolute corners , values , etc , and ensure they dont exceed the max limit , or that they dont loop around and break"): with fixed colors there is no math left to break — every channel is a constant inside 0-255 (no value can exceed any limit), no hue ever wraps (nothing computes one), and the one live derivation that remains (the X's lean) gates its input to a strict #rrggbb hex, clamps every channel through a 0-255 round, and bounds its 24-step bisection inside [0,1] — NaN and wrap-around are impossible by construction, and the corner audit keeps proving it live: all six finishes × the whole 78-plate field (the gray ladder end to end, the named patients, the light-card ladder, the pastel band, the low-saturation chromatics, and the 12-hue ladders at both brightness extremes) must be PRESENT and SANE on every plate, and the source law itself is pinned — the 25 classic bodies asserted byte-verbatim against the 1.9.2 sheet every run.

"""


def main() -> None:
    # the pkg seats (both files, both places)
    sub("package.json", '"version": "1.9.9",', '"version": "1.9.10",')
    sub("package-lock.json", '"version": "1.9.9",', '"version": "1.9.10",', count=2)
    # the constants seat
    sub("src/constants/index.js", "version: '1.9.9',", "version: '1.9.10',")
    # the changelog head
    changelog = ROOT / "CHANGELOG.md"
    raw = changelog.read_text(encoding="utf8")
    if "## 1.9.10 — The Classic Coat Returns" in raw:
        print("  CHANGELOG.md: already seated")
    else:
        assert raw.startswith("## 1.9.9 — The Faithful Lean"), "changelog head is not the 1.9.9 entry"
        changelog.write_text(CHANGELOG_ENTRY + raw, encoding="utf8")
        print("  CHANGELOG.md: seated")
    # the README seats
    sub("README.md", "**v1.9.9**", "**v1.9.10**")
    sub("README.md", "version-1.9.9-purple", "version-1.9.10-purple")
    sub("README.md", "83 DOM/source test suites", "84 DOM/source test suites")
    print("1.9.10 furniture seated: pkg x3, constants, changelog, readme x3")


if __name__ == "__main__":
    main()
