#!/usr/bin/env python3
"""1.9.15 — the sweep's misses healed (the same shapes every release
heals): the 192-196 badge pins ride the plain readme.includes('version-
1.9.14-purple') form, which the version sweep's regex shapes never
touch — the 1.9.14 release healed the same five seats with
patch_law_pins_1914.py, and this is that script's own next seat.

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUITES = [
    "gendex_192_batch_dom.test.mjs",
    "gendex_193_batch_dom.test.mjs",
    "gendex_194_batch_dom.test.mjs",
    "gendex_195_batch_dom.test.mjs",
    "gendex_196_batch_dom.test.mjs",
]


def main() -> None:
    for name in SUITES:
        p = ROOT / "scripts" / name
        raw = p.read_text(encoding="utf8")
        if "version-1.9.15-purple" in raw and "version-1.9.14-purple" not in raw:
            print(f"  {name}: already healed")
            continue
        assert "version-1.9.14-purple" in raw, f"{name}: the badge pin never spoke"
        raw = raw.replace("version-1.9.14-purple", "version-1.9.15-purple")
        p.write_text(raw, encoding="utf8")
        print(f"  {name}: healed")


if __name__ == "__main__":
    main()
