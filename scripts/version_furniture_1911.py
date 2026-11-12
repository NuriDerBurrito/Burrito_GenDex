#!/usr/bin/env python3
"""1.9.11 version furniture — the app tree's own seats (the suites' pins
are swept separately by version_sweep_1911.py, and the 1911 suite is born
speaking 1.9.11 — the sweep excludes it by law, exactly as the 1910 suite
was born excluded at 1.9.10).

1.9.11 — THE QUIET ANSWERS, five laws: the PROMPTS/NOTES tab earns its
own flight (the prompts' own gd-rise-in spawn law on a keyed wrapper,
both directions — "when switching between prompt and note, it just
happens instantly and appears, fix that so it has a transition
animation"), the note spawns through the prompts' own fade-and-rise
("prompts have a fade move animation when they spawn, i want the note to
also have that animation"), the outlined text's ring keeps its own ink
under any selection ("cards in the card viewer with the text
bolded/outlined would have their outline reverse in color, from black to
white or from white to black, it shouldnt do so" — the engine never
paints a text stroke inside a selection, so the ring's seat flooded with
the selection background and read as reversed; the letters keep their
own ink now and the backdrop contour carries the edge), the ledger earns
its own dial ("add an option to control how much logs are saved (default
is 50 like usual) in the logs section in settings window, right below
the logs container, the cell takes a numeric value"), and the download
page key opens the repository itself ("the download page link should be
'https://github.com/NuriDerBurrito/Burrito_GenDex' in the data section
in settings window").

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


CHANGELOG_ENTRY = """## 1.9.11 — The Quiet Answers

Five small paper cuts, each answered at its root — the wind-down release.

- **The tab's own flight** ("when switching between prompt and note, it just happens instantly and appears, fix that so it has a transition animation, from prompt to note and from note to prompt"): the PROMPTS/NOTES card's content swap was a hard cut — the ternary re-rendered the other subtree in a single frame with no beat at all. Both panels now ride the prompts' OWN spawn law (gd-rise-in — the same 0.18s fade-and-rise a fresh part row speaks) on a KEYED wrapper: the key forces a real remount on every tab flip, so the incoming panel — the PartEditor stack on the way to PROMPTS, the notes box on the way to NOTES — fades in and rises its 10px exactly like a spawning prompt, in BOTH directions. The outgoing panel leaves with the same hard cut the app's card-switch ceremony always spoke (gd-cv-swap's own law: the fade rides the ARRIVING content — one beat, never two), and the first mount rides the same entrance so the card opens speaking the flight too. Both seats answer with one law (the panel, the merged column — the promptCard JSX both render).
- **The note spawns like a prompt** ("same also to the note, prompts have a fade move animation when they spawn, i want the note to also have that animation"): the notes box appears through the tab flight's gd-rise-in — the prompts' own animation, verbatim, the exact ask. Every time the NOTES tab takes its seat the box fades in and rises; there is no separate "note entrance" to keep honest because the note now speaks the one law the prompts always spoke.
- **The ring keeps its own ink** ("when i select the text 'ALL cards , X cards' on the top bar, for some reason cards in the card viewer with the text bolded/outlined would have their outline reverse in color, from black to white or from white to black, it shouldnt do so"): the whole disease lived in the ::selection override's `color` seat. Probed live in the app's own Electron: the engine paints a selection's text with the ::selection color and NEVER paints the text stroke at all — so mid-highlight the fat inverse ring simply stopped existing, its seat flooded with the selection's accent background, and on a light accent that empty seat read as "the black outline turned white" (on a dark accent, the white outline turned black) — both directions the report spoke, one empty seat. The letters flipped to the accent-ink too, so even the glyph's own ink reversed. THE CURE, one word: `color: currentcolor` — a ::selection style resolves currentcolor against the ORIGINATING element's own color, so the outlined letters keep their exact resting ink through the whole highlight (probed: the fill never moves), the stroke's width stands down (`-webkit-text-stroke-width: 0` — belt and braces: an older engine that tried to paint it would paint it in the letter's OWN ink, never a stranger's), and the 0.37.0 backdrop contour keeps carrying the cut-out edge exactly as it always spoke it. The truncation MIRROR seats (`.gd-card-title:has(.rt-outline)` — the lent ring on the whole title line) speak the same cure at both floors: the title box's own ::selection AND every descendant's (a ::selection style only answers for the element it matches, so the title-level rule alone never reached the letters — probed live). Nothing about an outlined run's colors changes while it is selected — the accent floods behind it, the text itself holds still, and the ring returns the moment the highlight leaves.
- **The ledger's own dial** ("add an option to control how much logs are saved (default is 50 like usual) in the logs section in settings window, right below the logs container, the cell takes a numeric value"): the cap used to be a flat 50 hard-coded at three seats (the boot restore, every push, the Settings footer's word). It is ONE law now — settings.logLimit, clamped 1–999 through LOG_LIMIT_RANGE (50 the eternal default), sanitized at load (junk and every pre-1.9.11 database fall to the 50 the ledger always kept), read LIVE by every push, and trimmed the very frame the dial lands. The numeric cell sits exactly where the report drew it — right below the logs container, on the footer line — typing commits live (the settings' own law), junk beyond the ladder clamps on the way in, and the boot window bounds itself at the ladder's safe max so an owner whose dial reads 200 never loses a line to a restart (the trim waits for the database to speak the dial, then cuts honestly).
- **The repository is the download page** ("the download page link should be 'https://github.com/NuriDerBurrito/Burrito_GenDex' in the data section in settings window"): the DOWNLOAD PAGE key in Settings → Data opens the repository itself now — its Releases page carries every version's installer and source assets, and the one URL can never 404 behind a website that no longer exists (the one-file page left with the website folder in 1.8.7; the key had been pointing at the empty Pages address ever since).

"""


def main() -> None:
    # the pkg seats (both files, both places)
    sub("package.json", '"version": "1.9.10",', '"version": "1.9.11",')
    sub("package-lock.json", '"version": "1.9.10",', '"version": "1.9.11",', count=2)
    # the constants seat
    sub("src/constants/index.js", "version: '1.9.10',", "version: '1.9.11',")
    # the changelog head
    changelog = ROOT / "CHANGELOG.md"
    raw = changelog.read_text(encoding="utf8")
    if "## 1.9.11 — The Quiet Answers" in raw:
        print("  CHANGELOG.md: already seated")
    else:
        assert raw.startswith("## 1.9.10 — The Classic Coat Returns"), "changelog head is not the 1.9.10 entry"
        changelog.write_text(CHANGELOG_ENTRY + raw, encoding="utf8")
        print("  CHANGELOG.md: seated")
    # the README seats
    sub("README.md", "**v1.9.10**", "**v1.9.11**")
    sub("README.md", "version-1.9.10-purple", "version-1.9.11-purple")
    sub("README.md", "84 DOM/source test suites", "85 DOM/source test suites")
    # the battery runner welcomes the 1911 suite
    runner = ROOT / "scripts/run_battery_171.sh"
    raw = runner.read_text(encoding="utf8")
    if "gendex_1911_batch_dom" in raw:
        print("  run_battery_171.sh: already seated")
    else:
        assert "gendex_1910_batch_dom" in raw, "runner missing the 1910 seat"
        raw = raw.replace("gendex_1910_batch_dom", "gendex_1910_batch_dom gendex_1911_batch_dom", 1)
        runner.write_text(raw, encoding="utf8")
        print("  run_battery_171.sh: seated")
    print("1.9.11 furniture seated: pkg x3, constants, changelog, readme x3, runner")


if __name__ == "__main__":
    main()
