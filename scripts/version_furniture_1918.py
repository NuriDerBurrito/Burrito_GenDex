#!/usr/bin/env python3
"""1.9.18 version furniture — the app tree's own seats (the suites' pins
are swept separately by version_sweep_1918.py, and the 1918 suite is born
speaking 1.9.18 — the sweep excludes it by law, exactly as every release
before it).

1.9.18 — THE BAR KEEPS ONE SHAPE, one law, quoted from the report:
"when the image viewer has more than one image , it should have the
reset the view button on the left with the zoom buttons, keep the count
on the right still; but when its only one image , do have the same ui
(aka as if it has multiple) and just have the center bottom where it
shows the next and previous images locked" — the reset key joins the
zoom family at the bar's LEFT end (the view crew − · % · + · reset, one
cluster of view-controls at one end), the count keeps the RIGHT end
alone, and a single image rides the very SAME three zones with the
switcher standing LOCKED in the middle (.is-locked + disabled — the
peeks paint the set, but the walk is pinned). The ternary that bred
two bars is retired: one markup paints every viewer.

The README base is the owner's own manual seat — fetched live from
GitHub during the 1.9.16 session (the repo's raw seat answered 404
during the 1.9.17 session, so the 1.9.16-fetched text rides forward);
only the version numbers and the battery count move on it, per the
owner's word.

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


CHANGELOG_ENTRY = """## 1.9.18 — The Bar Keeps One Shape

The bar learns one shape — whatever it holds.

- **The reset joins the view crew at the left end** ("when the image viewer has more than one image , it should have the reset the view button on the left with the zoom buttons, keep the count on the right still"): the reset key moves home — out of the right flank and into the LEFT zone with the zoom-out / percentage / zoom-in keys, so the whole view-control crew (− · % · + · ⟲) rides ONE cluster at the bar's own left end, and the right end carries the count alone, exactly where it stood. The zoom family and the reset are one crew — the keys that move the view all sit together, nothing view-flavored parks at the count's end.

- **A single image keeps the same bar — the switcher stands locked** ("but when its only one image , do have the same ui (aka as if it has multiple) and just have the center bottom where it shows the next and previous images locked"): the ternary that bred two bars is retired — one markup paints every viewer. With a single image the bar renders the very same three zones — view crew at the left end, count at the right end, and the [previous · CURRENT · next] trio dead center — with both neighbors resolving to the picture itself (the peeks still show the next and previous images, the arrows still paint) and the switcher riding LOCKED (.is-locked + disabled): the walk is pinned, the hand says not-allowed, the trio dims to a resting cast, and no hover ever promises a walk the set cannot pay. The same ui, whatever the viewer holds.

"""


def main() -> None:
    # the pkg seats (both files, both places)
    sub("package.json", '"version": "1.9.17",', '"version": "1.9.18",')
    sub("package-lock.json", '"version": "1.9.17",', '"version": "1.9.18",', count=2)
    # the constants seat
    sub("src/constants/index.js", "version: '1.9.17',", "version: '1.9.18',")
    # the changelog head
    changelog = ROOT / "CHANGELOG.md"
    raw = changelog.read_text(encoding="utf8")
    if "## 1.9.18 — The Bar Keeps One Shape" in raw:
        print("  CHANGELOG.md: already seated")
    else:
        assert raw.startswith("## 1.9.17 — The Middle Belongs to the Switcher"), "changelog head is not the 1.9.17 entry"
        changelog.write_text(CHANGELOG_ENTRY + raw, encoding="utf8")
        print("  CHANGELOG.md: seated")
    # the README seats — the owner's own manual GitHub text (fetched live in
    # the 1.9.16 session): only the version numbers and the battery count
    # move on it, everything else preserved verbatim per the owner's word.
    sub("README.md", "**v1.9.17**", "**v1.9.18**")
    sub("README.md", "version-1.9.17-purple", "version-1.9.18-purple")
    sub("README.md", "91 DOM/source test suites", "92 DOM/source test suites")
    # the battery runner welcomes the 1918 suite
    runner = ROOT / "scripts/run_battery_171.sh"
    raw = runner.read_text(encoding="utf8")
    if "gendex_1918_batch_dom" in raw:
        print("  run_battery_171.sh: already seated")
    else:
        assert "gendex_1917_batch_dom" in raw, "runner missing the 1917 seat"
        raw = raw.replace("gendex_1917_batch_dom", "gendex_1917_batch_dom gendex_1918_batch_dom", 1)
        runner.write_text(raw, encoding="utf8")
        print("  run_battery_171.sh: seated")
    print("1.9.18 furniture seated: pkg x3, constants, changelog, readme x3, runner")


if __name__ == "__main__":
    main()
