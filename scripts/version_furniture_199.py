#!/usr/bin/env python3
"""1.9.9 version furniture — the app tree's own seats (the suites' pins
are swept separately by version_sweep_200.py, and the 200 suite is born
speaking 1.9.9 — the sweep excludes it by law, exactly as the 199 suite
was born excluded at 1.9.8).

1.9.9 — THE FAITHFUL LEAN, built on the 1.9.8 quiet seam: three laws.
The gesture owns the wheel (the drag governor's stale echo can never
re-seed the panel mid-drag, so the hue rail never vibrates and the hue
never drifts green-to-yellow again); the coat's color word is the LEAN
(hue + saturation whole at fixed luma seats — base 0.45 over the plate,
glow 0.78 for the dark ground's screen family, art 0.75 over the
picture — the card's BRIGHTNESS never enters the derivation anywhere,
the light-card pales and the #bbbbbb/#e7c35b vanishings retire with the
twin's plate-solved rail); and the corner audit grows into a systematic
sweep (78 plates: the gray ladder end to end, the named patients, the
light-card ladder, the pastel band, low-saturation chromatics, and the
12-hue ladders at both brightness extremes — 1008 checks, every family
present on every plate).

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


CHANGELOG_ENTRY = """## 1.9.9 — The Faithful Lean

Three laws — the gesture owns the wheel (no hue drift, no rail vibration while you drag), the coat's color word is a brightness-blind LEAN (hue + saturation whole at fixed luma seats — a light orange card speaks the clear-orange coat a mid orange always did), and the corner audit grows into a systematic sweep that tests every value class the wheel can name.

- **The gesture owns the wheel** ("when moving the color picker left and right sometimes it would change the color slightly as the bottom bar that shows all colors vibrates left and right and starts shifting, aka instead of being on green it shifts to yellow even if im changing the saturation etc"): the panel's hsv state lived in React alone, and its re-sync effect re-derived the whole state from the INCOMING hex whenever the incoming color differed from the last one emitted — a race the drag governor itself could write: the governor marks the emission the instant a move lands, but the parent's echo (the re-render carrying the emitted hex back as the color prop) follows at React's own cadence, and on a heavy window (a live card preview re-rendering under the picker) the echo of an OLDER emission could arrive after the panel had already emitted a newer one — stale incoming ≠ fresh last-emitted → the effect re-seeded the state from the STALE hex → the dot snapped back, the next move snapped it forward, and the hue rail visibly VIBRATED. Worse: every re-seed recomputed the hue from the hex's quantized RGB — at low saturation a one-unit channel rounding moves the hue by whole degrees, so each stale re-seed DRIFTED the hue (green to yellow) and the next emission carried the drift away permanently. Two laws retire the race: THE MIRROR (an hsvRef rides beside the state as the gesture's own book — the field handlers read it, and no emission ever lives inside a state updater React may re-run) and THE FENCE (while a pointer holds either field the re-sync effect does NOTHING — the panel is the wheel's only truth through the gesture, exactly like the OS pickers; after the release the guard still re-seeds on any GENUINE external change, and it compares the normalized forms so an echo in a different dress never re-seeds at all).
- **The faithful lean** ("when i have the card color a very light value it makes the finish effects bright as it is, fix that so it doesnt normally ... when the card is light orange the finish effects should be orange etc.. like before, the color influinces the hue is all and not brightness or shit ... i want it to only be affected by the hue and saturation, not by brightness, if you need to rework how the finishes get affected by colors go for it as long as it matches previously and works properly"): three releases of twin-and-seam surgery all shared one disease the note finally names — every one of them derived the coat's color from the PLATE'S OWN BRIGHTNESS (the twin solved its lightness against the plate's luma, so a very light card spoke a ~0.6-luma ink and the washes arrived pale; the pale band's plates #bbbbbb and #e7c35b sat exactly where the twin's floor thinned the coat to a whisper while the 0.78 rail still withheld the bright subclass's louder voices — "the finish background etc vanishes in some finishes such as foil"). The rework the note authorizes: the coat's color word is finishTintLean — the card's HUE and HSL SATURATION pass whole, the BRIGHTNESS NEVER ENTERS, and the lean's own lightness is a FIXED property of the derivation: the BASE seat (perceptual luma 0.45, the classic mid-card register — a mid card reproduces the classic look exactly, the light orange card speaks the clear-orange coat, and the high-luminance hues land their corner-audit cures by law: #ffd400 leans the deep gold the 1.9.7 patch mixed by hand), the GLOW seat (0.78, the carrying light the dark ground's screen family reads — the register the lift twin always spoke, now fixed and brightness-blind), and the ART seat (0.75, the light register the classic picture-coat's own anchors always spoke — a base-seat lean over the picture measured a 105-delta veil, the 1.9.8 disease returned; the art seat lands the same hue in the art register with the image knob's own volume law unchanged). One derivation, three fixed seats, no seam anywhere in the ink: dragging the value axis moves the PLATE alone while the coat keeps its color end to end — the character continuity the seam surgery kept chasing, had by construction. The ground classes keep their own word (they class the PLATE for the blend families alone), the artfins join the hand (the picture's coat is colored by hue and saturation too), and the twin retires with the disease it carried.
- **The sweep accounts for all values** ("the finish background etc vanishes in some finishes such as foil in #bbbbbb and #e7c35b, please account for all and test possible values to see if they break for fucks sake"): the corner audit's plate field grew from 34 seats to 78 — the black-to-white GRAY LADDER end to end (twelve steps, both named patients' home column), the report's own #e7c35b, a LIGHT-CARD ladder (the item's very light values for warm and cool hues), the pastel band the 1.9.8 seam owned, the low-saturation chromatics, and a full 12-hue ladder at HSL L=0.75 AND L=0.25 — every hue the wheel names at both brightness extremes, where the old audit measured nothing at all. Every family must speak on every plate: 1008 of 1008 checks green (presence, sane ink, no crush, no wash, no sink), with the thin screen voices on the channel-pegged mid-dark band (#ff80ff, #ff8c42 — plates no earlier audit ever measured) answered by the glow seat and the 1.6 opacity hand the dapple already owned. The art-eye audit re-baselines with the brightness-blind law's own checks (the same hue and saturation at three lightness seats must speak the SAME veil over the same picture — measured identical within a breath for every family) — 145 of 145.

"""


def main() -> None:
    # the pkg seats (both files, both places)
    sub("package.json", '"version": "1.9.8",', '"version": "1.9.9",')
    sub("package-lock.json", '"version": "1.9.8",', '"version": "1.9.9",', count=2)
    # the constants seat
    sub("src/constants/index.js", "version: '1.9.8',", "version: '1.9.9',")
    # the changelog head
    changelog = ROOT / "CHANGELOG.md"
    raw = changelog.read_text(encoding="utf8")
    if "## 1.9.9 — The Faithful Lean" in raw:
        print("  CHANGELOG.md: already seated")
    else:
        assert raw.startswith("## 1.9.8 — The Quiet Seam"), "changelog head is not the 1.9.8 entry"
        changelog.write_text(CHANGELOG_ENTRY + raw, encoding="utf8")
        print("  CHANGELOG.md: seated")
    # the README seats
    sub("README.md", "**v1.9.8**", "**v1.9.9**")
    sub("README.md", "version-1.9.8-purple", "version-1.9.9-purple")
    sub("README.md", "82 DOM/source test suites", "83 DOM/source test suites")
    print("1.9.9 furniture seated: pkg x3, constants, changelog, readme x3")


if __name__ == "__main__":
    main()
