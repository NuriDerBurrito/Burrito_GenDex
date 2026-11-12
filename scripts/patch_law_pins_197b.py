#!/usr/bin/env python3
"""1.9.6 — the second healing pass (the _b convention): the pins the first
pass's re-words exposed — the badge sweep reaches 193/194/195, the
ground-tone seats learn the split scope's comment-shaped thread, 195's C5
retirement pin speaks the rejoin, 196's A1 extraction starts at the list's
new head, and the two preview-thread pins tolerate the 1.9.6 comments that
ride between the knob and the split's own threads.

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def sub(path: str, old: str, new: str) -> None:
    p = ROOT / path
    raw = p.read_text(encoding="utf8")
    if new in raw and old not in raw:
        print(f"  {path}: already healed")
        return
    assert old in raw, f"{path}: missing seat:\n{old[:160]}"
    raw = raw.replace(old, new, 1)
    p.write_text(raw, encoding="utf8")
    print(f"  {path}: healed")


def main() -> None:
    # ---- the badge sweep reaches every suite that pins it -------------
    for suite in ("gendex_193_batch_dom.test.mjs", "gendex_194_batch_dom.test.mjs", "gendex_195_batch_dom.test.mjs"):
        sub(f"scripts/{suite}",
            "  assert.ok(readme.includes('version-1.9.5-purple'));",
            "  /* 1.9.6 — the badge is a LIVE seat: it speaks 1.9.6 now. */\n"
            "  assert.ok(readme.includes('version-1.9.6-purple'));")

    # ---- 194 C2 — the ground-tone seats learn the split scope's thread -
    sub("scripts/gendex_194_batch_dom.test.mjs",
        "  assertMatch(ribbon, /finishGroundTone\\(cardColor\\)\\s*\\n\\s*\\)\\}/, 'the compact preview never seated the tone');",
        "  /* 1.9.6 — the split scope rides beside the tone (a comment-shaped\n"
        "     thread — the class list's own law keeps its words). */\n"
        "  assertMatch(ribbon, /finishGroundTone\\(cardColor\\),\\s*\\n\\s*\\/\\*[\\s\\S]*?\\*\\/\\s*\\n\\s*finishSplitImage && 'gd-fin-split'\\s*\\n\\s*\\)\\}/, 'the compact preview never seated the tone');")
    sub("scripts/gendex_194_batch_dom.test.mjs",
        "  assertMatch(grid, /finishGroundTone\\(character\\.cardColor\\)\\s*\\n\\s*\\)\\}/, 'the grid card never seated the tone');",
        "  assertMatch(grid, /finishGroundTone\\(character\\.cardColor\\),\\s*\\n\\s*\\/\\*[\\s\\S]*?\\*\\/\\s*\\n\\s*character\\.cardFinishSplitImage && character\\.cardFinishOnImage && 'gd-fin-split'\\s*\\n\\s*\\)\\}/, 'the grid card never seated the tone');")
    sub("scripts/gendex_194_batch_dom.test.mjs",
        "  assertMatch(look, /finishGroundTone\\(cardColor\\)\\s*\\n\\s*\\)\\}/, 'the look editor never seated the tone');",
        "  assertMatch(look, /finishGroundTone\\(cardColor\\),\\s*\\n\\s*\\/\\*[\\s\\S]*?\\*\\/\\s*\\n\\s*finishSplitImage && 'gd-fin-split'\\s*\\n\\s*\\)\\}/, 'the look editor never seated the tone');")

    # ---- 195 C5 — the retirement pin speaks the 1.9.6 rejoin -----------
    sub("scripts/gendex_195_batch_dom.test.mjs",
        "  /* 1.9.5 — the light law's BODIES retired (\"it would darken the card\n"
        "     color\"): the detail inks keep the multiply tint, the broad bodies\n"
        "     keep their native seats — the retirement is the pin now. */\n"
        "  assertMatch(css, /\\.gd-fin-ground-light \\.gd-finish-foil-ripples \\{\\s*\\n  mix-blend-mode: multiply;/, 'the 1.9.3 light law left the detail inks');\n"
        "  for (const body of ['.gd-finish-foil', '.gd-finish-auric', '.gd-finish-numeix', '.gd-finish-nuri']) {\n"
        "    assert.ok(!css.includes(`.gd-fin-ground-light ${body},\\n`) && !css.includes(`.gd-fin-ground-light ${body} {\\n  mix-blend-mode: multiply;`), `a broad body rejoined the light multiply stack: ${body}`);\n"
        "  }",
        "  /* 1.9.6 — THE CERTAIN INK: the bodies REJOIN the light multiply\n"
        "     stack (the twin through --gd-tint-hand carries the contrast — the\n"
        "     1.9.5 retirement traded the report's vanished families for\n"
        "     identity-on-white bodies; the twin returns them without the\n"
        "     1.9.4 coffee). */\n"
        "  const lightOne = /\\.gd-fin-ground-light \\.gd-finish-numeix,\\n(?:\\.gd-fin-ground-light [^\\n]+,\\n)*\\.gd-fin-ground-light [^\\n]+ \\{\\n  mix-blend-mode: multiply;\\n\\}/.exec(css)?.[0] || '';\n"
        "  assert.ok(lightOne, 'the 1.9.3 light law left');\n"
        "  for (const body of ['.gd-finish-foil', '.gd-finish-auric', '.gd-finish-numeix', '.gd-finish-nuri']) {\n"
        "    assert.ok(lightOne.includes(`.gd-fin-ground-light ${body},`) || lightOne.includes(`.gd-fin-ground-light ${body} {`), `a broad body left the light multiply stack: ${body}`);\n"
        "  }")

    # ---- 196 A1 — the extraction starts at the list's new head ---------
    sub("scripts/gendex_196_batch_dom.test.mjs",
        "  const light = /\\.gd-fin-ground-light \\.gd-numeix-dapple,\\n(?:\\.gd-fin-ground-light [^\\n]+,\\n)*\\.gd-fin-ground-light [^\\n]+ \\{\\n  mix-blend-mode: multiply;\\n\\}/.exec(css)?.[0] || '';",
        "  /* 1.9.6 — the list begins with the BODY now (the twin carries the\n"
        "     contrast — every seat speaks the one blend). */\n"
        "  const light = /\\.gd-fin-ground-light \\.gd-finish-numeix,\\n(?:\\.gd-fin-ground-light [^\\n]+,\\n)*\\.gd-fin-ground-light [^\\n]+ \\{\\n  mix-blend-mode: multiply;\\n\\}/.exec(css)?.[0] || '';")
    sub("scripts/gendex_196_batch_dom.test.mjs",
        "  // the bodies keep their NATIVE seats: numeix + auric + foil all speak\n"
        "  // soft-light (foil's own 1.4.7 tint law — never a shade), the forge\n"
        "  // speaks overlay",
        "  // the bodies keep their NATIVE BASE seats (the 1.9.6 light override\n"
        "  // speaks above them; at rest numeix + auric + foil all speak\n"
        "  // soft-light — foil's own 1.4.7 tint law — and the forge overlay)")

    # ---- 196 B4/B5 — the preview threads tolerate the 1.9.6 comments ----
    sub("scripts/gendex_196_batch_dom.test.mjs",
        "  assertMatch(newchar, /finishTransparency=\\{finishTransparency\\}\\s*\\n\\s*finishSplitImage=\\{finishSplitImage\\}\\s*\\n\\s*finishImageTransparency=\\{finishImageTransparency\\}\\s*\\n\\s*imageMotion=\\{imageMotion\\}/, 'the window never threaded the knob into the preview');",
        "  assertMatch(newchar, /finishTransparency=\\{finishTransparency\\}\\s*\\n\\s*\\/\\*[\\s\\S]*?\\*\\/\\s*\\n\\s*finishSplitImage=\\{finishSplitImage\\}\\s*\\n\\s*finishImageTransparency=\\{finishImageTransparency\\}\\s*\\n\\s*imageMotion=\\{imageMotion\\}/, 'the window never threaded the knob into the preview');")
    sub("scripts/gendex_196_batch_dom.test.mjs",
        "  /* 1.9.6 — the split volume threads into the preview beside the knob. */\n"
        "  assertMatch(charview, /finishTransparency=\\{finishTransparency\\}\\s*\\n\\s*finishSplitImage=\\{finishSplitImage\\}\\s*\\n\\s*finishImageTransparency=\\{finishImageTransparency\\}\\s*\\n\\s*imageMotion=\\{imageMotion\\}/, 'the window never threaded the knob into the preview');",
        "  /* 1.9.6 — the split volume threads into the preview beside the knob\n"
        "     (a comment-shaped thread — the law keeps its words). */\n"
        "  assertMatch(charview, /finishTransparency=\\{finishTransparency\\}\\s*\\n\\s*\\/\\*[\\s\\S]*?\\*\\/\\s*\\n\\s*finishSplitImage=\\{finishSplitImage\\}\\s*\\n\\s*finishImageTransparency=\\{finishImageTransparency\\}\\s*\\n\\s*imageMotion=\\{imageMotion\\}/, 'the window never threaded the knob into the preview');")

    print("\n1.9.6 law pins healed (the second pass).")


if __name__ == "__main__":
    main()
