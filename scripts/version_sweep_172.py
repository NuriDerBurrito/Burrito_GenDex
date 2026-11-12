#!/usr/bin/env python3
"""1.7.1 -> 1.7.2 version sweep for the TEST SUITES (the app tree's own
furniture already speaks 1.7.2). Moves every live version pin in the
gendex_*.test.mjs fixtures: the APP/pkg/README/website equal-pins, the
escaped regex pins, the changelog HEAD pins (the 1.7.2 entry is "The
Trim's Own Ring"), the boot fixtures' lastRun seeds, and the "version is
X everywhere" titles. Historical notes are LEFT ALONE.

Special 1.7.2 law pins (the laws this version legitimately superseded —
patched separately after this sweep runs):

  gendex_172 (the 1.6.8 still-board + the band's rung):
    - the trim-effect band pin moves from its resting z 2 to the 1.7.2
      ladder (z 5 while trim rides — the stamps cover the thin ring
      coat; z 1 under the image effect's full-face scope)
    - the still-board gate reads the REF now (livePreviewRef.current) —
      the memoized cards' mount-era closures could not see the flip

  gendex_173 (D1/N1/Q1/Q2/Q3 — the 1.7.1 laws the 1.7.2 reports retired):
    - D1: the ghost gate reads the REF (the same staleness fix)
    - N1: the band-ground carve retired WHOLESALE ("ignore stamp") — the
      mask is now the TRIM'S OWN RING (content-box clip + the subtract
      composite pair + the seam rail + the plate), no stamp scope
    - Q1: the cover's goodbye seats on the BODY (the dying bar's framer
      snapshot never saw the retractRequest nonce)
    - Q2: the cross departs on the first frame (the expo-out curve)
    - Q3: the chip's squared ::before seat retired (the dashed circle is
      back) + the stage's rail sits INSIDE the frame

Run from the app root."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OLD = "1.7.1"
NEW = "1.7.2"
OLD_TAG = "The One Breath"
NEW_TAG = "The Trim's Own Ring"  # (escaped per-suite: the apostrophe breaks single-quoted pins)


def sweep_line(line: str) -> str:
    stripped = line.lstrip()
    if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
        if f"the version is {OLD} everywhere" in line:
            line = line.replace(f"the version is {OLD} everywhere", f"the version is {NEW} everywhere")
        return line
    line = line.replace(f"'the version is {OLD} everywhere'", f"'the version is {NEW} everywhere'")
    line = line.replace(f"## {OLD} — {OLD_TAG}", f"## {NEW} — {NEW_TAG}")
    line = line.replace(f"## {OLD} — {OLD_TAG}".replace(".", "\\."), f"## {NEW} — {NEW_TAG}".replace(".", "\\."))
    line = line.replace(f"'{OLD_TAG}'", f"'{NEW_TAG}'")
    line = line.replace(f"/{OLD_TAG}/", f"/{NEW_TAG}/")
    line = line.replace(f"'{OLD}'", f"'{NEW}'")
    line = line.replace(OLD.replace(".", "\\."), NEW.replace(".", "\\."))
    if "assert" in line or "includes(" in line or "startsWith(" in line or "endsWith(" in line:
        line = re.sub(r"(?<=[vV(])" + re.escape(OLD) + r"(?=[_s<)' /*])", NEW, line)
        line = line.replace(f"**v{OLD}**", f"**v{NEW}**")
    return line


def move(old: str, new: str, text: str, where: str) -> str:
    if old in text:
        return text.replace(old, new)
    print(f"  !! pin not found in {where}: {old[:70]!r}")
    return text


def sweep_file(path: Path) -> bool:
    try:
        raw = path.read_text(encoding="utf8")
    except Exception:
        return False
    out = "\n".join(sweep_line(l) for l in raw.split("\n"))
    name = path.name

    if name in ("gendex_166_batch_dom.test.mjs", "gendex_167_batch_dom.test.mjs", "gendex_169_batch_dom.test.mjs"):
        # the website current-row includes-pin: preceded by ">", unreachable
        # by the generic line sweep (the 1.7.0/1.7.1 sweeps' own follow-up)
        out = move(
            'class="v">' + OLD + '</td>\'), \'the website current-row never moved\'',
            'class="v">' + NEW + '</td>\'), \'the website current-row never moved\'',
            out, name,
        )

    path.write_text(out, encoding="utf8")
    return True


def main() -> None:
    files = sorted(ROOT.glob("scripts/gendex_*.test.mjs"))
    files += sorted(ROOT.glob("scripts/gendex_*_dom.test.mjs"))
    seen: set[Path] = set()
    for p in files:
        if p in seen:
            continue
        seen.add(p)
        sweep_file(p)
    print(f"swept {len(seen)} suites: {OLD} -> {NEW} ('{NEW_TAG}')")


if __name__ == "__main__":
    main()
