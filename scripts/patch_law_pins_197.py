#!/usr/bin/env python3
"""1.9.6 — the superseded law pins, healed (the release's own convention:
every suite keeps pinning the LAW AT ITS BIRTH SEAT, and the seats whose
laws themselves MOVED this release are re-worded to speak the 1.9.6 truth
— exactly the way the 1.9.5 pass taught with patch_law_pins_196.py).

The healed pins, by law:
· THE CERTAIN INK — every tint-leaning stop now reads the tint through
  --gd-tint-hand (the light ground swaps it for the shadow twin), so the
  exact-shape pins that spoke `var(--gd-card-tint, var(--gd-panel))`
  inside coat rules learn the handed form (159 4a/4b, 193 C3, 194 B2/B4,
  195 A1/A2, 196 A3); the light-ground LIST pins learn the bodies'
  REJOIN (194 C1, 196 A1) and the filter pins learn the silver facet
  (195 C1, 196 A2); the artfin mask pin anchors to the sheet's margin
  (169 H1 — the split scope seats the same selector-suffix earlier).
· THE SPLIT VOLUME — the CREATE commit, both preview threads and the
  grid's import list gained the split's own threads (196 B4/B5/B6, 176
  A4).
· THE FURNITURE — the badge pins track the live release (192 E3, 196 D3).

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HANDED = "var(--gd-tint-hand, var(--gd-card-tint, var(--gd-panel)))"


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
    # ---- 159 — the licks + the veil learn the hand -------------------
    sub("scripts/gendex_159_batch_dom.test.mjs",
        "  assert(/color-mix\\(in srgb, var\\(--gd-card-tint/.test(licks), 'the licks never color-mix the tint');",
        "  /* 1.9.6 — the tongues read the tint through the HAND now (see\n"
        "     --gd-tint-hand in index.css — the light ground swaps it for the\n"
        "     plate's shadow twin, and the mix keeps leaning the tint). */\n"
        "  assert(/color-mix\\(in srgb, var\\(--gd-tint-hand, var\\(--gd-card-tint/.test(licks), 'the licks never color-mix the tint');")
    sub("scripts/gendex_159_batch_dom.test.mjs",
        "  assert(/background: var\\(--gd-card-tint, var\\(--gd-panel\\)\\);/.test(veil), 'the veil never took the card tint');",
        "  /* 1.9.6 — the veil's ink IS the hand now (the twin — overlay with a\n"
        "     dark top deepens a bright plate). */\n"
        f"  assert(/background: var\\(--gd-tint-hand, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\);/.test(veil), 'the veil never took the card tint');")

    # ---- 169 — the artfin mask anchors to the sheet's margin ---------
    sub("scripts/gendex_169_batch_dom.test.mjs",
        "  const mask = cssSrc.match(/\\.gd-card-face-artfin\\.is-art-zone \\{[\\s\\S]*?\\n\\}/)?.[0] || '';",
        "  /* 1.9.6 — anchored to the sheet's margin: the split volume's scope\n"
        "     seats the same selector-suffix (.gd-fin-split\n"
        "     .gd-card-face-artfin.is-art-zone) earlier in the sheet, and the\n"
        "     artfin's OWN mask is the rule that starts at the margin. */\n"
        "  const mask = /^\\.gd-card-face-artfin\\.is-art-zone \\{[\\s\\S]*?\\n\\}/m.exec(cssSrc)?.[0] || '';")

    # ---- 176 — the grid's import gains the twin ----------------------
    sub("scripts/gendex_176_batch_dom.test.mjs",
        "  /* 1.9.3 — the import gained finishGroundTone (the extreme-grounds\n"
        "     reader — see .gd-fin-ground-* in index.css). */\n"
        "  assertMatch(grid, /import TagRibbon, \\{ CardFinishLayer, FINISH_GROUND, TrimCoatLayer, TrimOverlay, cropFrame, finishGroundTone, finishPhase, finishStrength, markRibbonHeadRoom, ribbonSize, ribbonTopOffset, trimCoatInk \\}/, 'the grid never imported the ladder');",
        "  /* 1.9.3 — the import gained finishGroundTone (the extreme-grounds\n"
        "     reader — see .gd-fin-ground-* in index.css). 1.9.6 — it gained\n"
        "     finishInkTwin too (the shadow twin the light ground's seats\n"
        "     read — see --gd-tint-hand in index.css). */\n"
        "  assertMatch(grid, /import TagRibbon, \\{ CardFinishLayer, FINISH_GROUND, TrimCoatLayer, TrimOverlay, cropFrame, finishGroundTone, finishInkTwin, finishPhase, finishStrength, markRibbonHeadRoom, ribbonSize, ribbonTopOffset, trimCoatInk \\}/, 'the grid never imported the ladder');")

    # ---- 192 — the badge tracks the live release ---------------------
    sub("scripts/gendex_192_batch_dom.test.mjs",
        "  /* 1.9.3 — the badge is a LIVE seat (it tracks the current release);\n"
        "     it speaks 1.9.3 now. */\n"
        "  assert.ok(readme.includes('version-1.9.5-purple'));",
        "  /* 1.9.3 — the badge is a LIVE seat (it tracks the current release);\n"
        "     it speaks 1.9.6 now. */\n"
        "  assert.ok(readme.includes('version-1.9.6-purple'));")

    # ---- 193 — the nested-mix law nests through the hand -------------
    sub("scripts/gendex_193_batch_dom.test.mjs",
        "  assertMatch(css, /color-mix\\(in srgb, var\\(--gd-card-tint, var\\(--gd-panel\\)\\) 52%, #ffc454\\)/, 'the nuri lean never read the tint inside a mix');",
        "  /* 1.9.6 — the lean reads the tint through the HAND (the light\n"
        "     ground's twin swap — a nested mix is still a legal color, and the\n"
        "     hand is itself just a var the ground re-speaks). */\n"
        "  assertMatch(css, /color-mix\\(in srgb, var\\(--gd-tint-hand, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\) 52%, #ffc454\\)/, 'the nuri lean never read the tint inside a mix');")

    # ---- 194 — the crown + hearts stops learn the hand; C1 speaks the rejoin
    sub("scripts/gendex_194_batch_dom.test.mjs",
        "  assertMatch(body, /color-mix\\(in srgb, transparent 58%, color-mix\\(in srgb, var\\(--gd-card-tint, var\\(--gd-panel\\)\\) 52%, #9a86d8\\)\\) 0%/, 'the crown stop never spoke the premultiplied lean');",
        "  /* 1.9.6 — the stops read the tint through the HAND (the light\n"
        "     ground's twin swap — the lean keeps its weight, the ink gains its\n"
        "     contrast). */\n"
        "  assertMatch(body, /color-mix\\(in srgb, transparent 58%, color-mix\\(in srgb, var\\(--gd-tint-hand, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\) 52%, #9a86d8\\)\\) 0%/, 'the crown stop never spoke the premultiplied lean');")
    sub("scripts/gendex_194_batch_dom.test.mjs",
        "  assertMatch(css, /color-mix\\(in srgb, var\\(--gd-card-tint, var\\(--gd-panel\\)\\) 52%, #ffc454\\)/, 'the nuri lean never spoke');",
        "  assertMatch(css, /color-mix\\(in srgb, var\\(--gd-tint-hand, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\) 52%, #ffc454\\)/, 'the nuri lean never spoke');")
    sub("scripts/gendex_194_batch_dom.test.mjs",
        "  assertMatch(css, /\\.gd-fin-ground-light \\.gd-numeix-dapple,\\s*\\n\\.gd-fin-ground-light \\.gd-numeix-streams,/, 'the light law never seated the luminous family');",
        "  /* 1.9.6 — THE CERTAIN INK: the light list begins with the BODY now\n"
        "     (the twin carries the contrast — every seat speaks the one blend). */\n"
        "  assertMatch(css, /\\.gd-fin-ground-light \\.gd-finish-numeix,\\s*\\n\\.gd-fin-ground-light \\.gd-numeix-dapple,/, 'the light law never seated the family');")
    sub("scripts/gendex_194_batch_dom.test.mjs",
        "  assertMatch(css, /\\.gd-fin-ground-light \\.gd-finish-foil-ripples \\{\\s*\\n  mix-blend-mode: multiply;/, 'the light law never kept the detail inks');\n"
        "  for (const body of ['.gd-finish-foil', '.gd-finish-auric', '.gd-finish-numeix', '.gd-finish-nuri']) {\n"
        "    assert.ok(!css.includes(`.gd-fin-ground-light ${body},\\n`) && !css.includes(`.gd-fin-ground-light ${body} {\\n  mix-blend-mode: multiply;`), `a broad body rejoined the light multiply stack: ${body}`);\n"
        "  }",
        "  /* 1.9.6 — the bodies REJOIN the light multiply stack (the twin's\n"
        "     derivation carries the contrast; the crushing filter is gone, so\n"
        "     a broad wash lands as a gentle tint, never the 1.9.4 coffee). */\n"
        "  const lightOne = /\\.gd-fin-ground-light \\.gd-finish-numeix,\\n(?:\\.gd-fin-ground-light [^\\n]+,\\n)*\\.gd-fin-ground-light [^\\n]+ \\{\\n  mix-blend-mode: multiply;\\n\\}/.exec(css)?.[0] || '';\n"
        "  assert.ok(lightOne, 'the light law never spoke');\n"
        "  for (const body of ['.gd-finish-foil', '.gd-finish-auric', '.gd-finish-numeix', '.gd-finish-nuri']) {\n"
        "    assert.ok(lightOne.includes(`.gd-fin-ground-light ${body},`) || lightOne.includes(`.gd-fin-ground-light ${body} {`), `a broad body left the light multiply stack: ${body}`);\n"
        "  }")

    # ---- 195 — the forge's stops learn the hand; C1 speaks the facet --
    for name, old, new in [
        ("first vein", "assertMatch(body, /transparent 83%, color-mix\\(in srgb, var\\(--gd-card-tint, var\\(--gd-panel\\)\\) 55%, #ff8c00\\)/, 'the first vein never leaned');",
         "assertMatch(body, /transparent 83%, color-mix\\(in srgb, var\\(--gd-tint-hand, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\) 55%, #ff8c00\\)/, 'the first vein never leaned');"),
        ("crossed vein", "assertMatch(body, /transparent 87%, color-mix\\(in srgb, var\\(--gd-card-tint, var\\(--gd-panel\\)\\) 52%, #ffc43c\\)/, 'the crossed vein never leaned');",
         "assertMatch(body, /transparent 87%, color-mix\\(in srgb, var\\(--gd-tint-hand, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\) 52%, #ffc43c\\)/, 'the crossed vein never leaned');"),
        ("band crown", "assertMatch(body, /transparent 66%, color-mix\\(in srgb, var\\(--gd-card-tint, var\\(--gd-panel\\)\\) 50%, #b22234\\)\\) 0%/, 'the band\\'s crown never leaned');",
         "assertMatch(body, /transparent 66%, color-mix\\(in srgb, var\\(--gd-tint-hand, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\) 50%, #b22234\\)\\) 0%/, 'the band\\'s crown never leaned');"),
        ("obsidian weave", "assertMatch(body, /transparent 66%, color-mix\\(in srgb, var\\(--gd-card-tint, var\\(--gd-panel\\)\\) 22%, #1a110c\\)/, 'the obsidian weave never leaned');",
         "assertMatch(body, /transparent 66%, color-mix\\(in srgb, var\\(--gd-tint-hand, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\) 22%, #1a110c\\)/, 'the obsidian weave never leaned');"),
    ]:
        sub("scripts/gendex_195_batch_dom.test.mjs", old, new)
    sub("scripts/gendex_195_batch_dom.test.mjs",
        "  assertMatch(veil, /background: var\\(--gd-card-tint, var\\(--gd-panel\\)\\);/, 'the veil lost the tint');",
        "  /* 1.9.6 — the veil's ink IS the hand now (the twin — the white-wash\n"
        "     \"negative\" the raw tint printed on bright plates retires). */\n"
        "  assertMatch(veil, /background: var\\(--gd-tint-hand, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\);/, 'the veil lost the tint');")
    sub("scripts/gendex_195_batch_dom.test.mjs",
        "  /* 1.9.5 — the ink law learned the GENTLE hand (\"it would darken the\n"
        "     card color and then make the effects darker ... when its too bright\n"
        "     it becomes black\"): the filter rises from the crushing\n"
        "     brightness(0.55) saturate(1.35) to brightness(0.74) saturate(1.5),\n"
        "     and the broad BODIES left the list (a wash at 0.55 was the black the\n"
        "     light-plate stack printed — see the 1.9.5 rules in index.css). */\n"
        "  const ink = /\\.gd-fin-ground-light \\.gd-numeix-dapple,\\n(?:\\.gd-fin-ground-light [^\\n]+,\\n)*\\.gd-fin-ground-light [^\\n]+ \\{\\n  filter: brightness\\(0\\.74\\) saturate\\(1\\.5\\);\\n\\}/.exec(css)?.[0] || '';\n"
        "  assert.ok(ink, 'the ink law never spoke');\n"
        "  // every DETAIL seat the law promises, present in the one rule — and\n"
        "  // every broad body absent (the 1.9.5 retirement)\n"
        "  for (const seat of [\n"
        "    '.gd-numeix-dapple', '.gd-numeix-streams', '.gd-numeix-moon', '.gd-numeix-stars', '.gd-numeix-xmarks',\n"
        "    '.gd-auric-currents', '.gd-auric-flakes', '.gd-auric-sweep', '.gd-auric-summon',\n"
        "    '.gd-finish-foil-ripples', '.gd-finish-foil::before', '.gd-finish-holographic::before', '.gd-holo-shards',\n"
        "    '.gd-nuri-licks', '.gd-nuri-sparks', '.gd-nuri-flare',\n"
        "    '.gd-holo-dots', '.gd-prism-stars', '.gd-prism-particles', '.gd-prism-waves', '.gd-prism-sweep',\n"
        "  ]) {\n"
        "    assert.ok(ink.includes(`.gd-fin-ground-light ${seat},`) || ink.includes(`.gd-fin-ground-light ${seat} {`), `the ink law never seated ${seat}`);\n"
        "  }\n"
        "  for (const body of ['.gd-finish-numeix', '.gd-finish-auric', '.gd-finish-nuri']) {\n"
        "    assert.ok(!ink.includes(`.gd-fin-ground-light ${body},`) && !ink.includes(`.gd-fin-ground-light ${body} {`), `a broad body rejoined the ink law: ${body}`);\n"
        "  }\n"
        "  // the hue-riding bodies (their filter seats belong to the hue clocks)\n"
        "  // take the BLEND flip alone — never the static filter (their masked\n"
        "  // children and pseudos darken with the family instead)\n"
        "  for (const body of ['.gd-finish-foil', '.gd-finish-holographic', '.gd-finish-prismatic']) {\n"
        "    assert.ok(!ink.includes(`.gd-fin-ground-light ${body},\\n`) && !ink.includes(`.gd-fin-ground-light ${body} {`), `the hue clock's own seat took a static filter: ${body}`);\n"
        "  }",
        "  /* 1.9.6 — THE CERTAIN INK: the ink's contrast moved to its own\n"
        "     derivation (the twin through --gd-tint-hand), the static filter\n"
        "     RETIRED from every tint-leaning seat, and the ONE family that\n"
        "     keeps a filter is the WHITE-INK seats — the silver facet\n"
        "     (brightness(0.55) saturate(1.18)): their ink is white by design,\n"
        "     no tint to twin, and the one honest shadow a white light speaks\n"
        "     on a bright plate is gray. */\n"
        "  const ink = /\\.gd-fin-ground-light \\.gd-finish-foil-ripples,\\n(?:\\.gd-fin-ground-light [^\\n]+,\\n)*\\.gd-fin-ground-light [^\\n]+ \\{\\n  filter: brightness\\(0\\.55\\) saturate\\(1\\.18\\);\\n\\}/.exec(css)?.[0] || '';\n"
        "  assert.ok(ink, 'the ink law never spoke');\n"
        "  // every WHITE-INK seat the facet promises, present in the one rule\n"
        "  for (const seat of [\n"
        "    '.gd-finish-foil-ripples', '.gd-finish-holographic::before', '.gd-holo-shards',\n"
        "    '.gd-holo-dots', '.gd-prism-stars', '.gd-prism-particles', '.gd-prism-waves', '.gd-prism-sweep',\n"
        "  ]) {\n"
        "    assert.ok(ink.includes(`.gd-fin-ground-light ${seat},`) || ink.includes(`.gd-fin-ground-light ${seat} {`), `the silver facet never seated ${seat}`);\n"
        "  }\n"
        "  // and no tint-leaning seat ever joined the facet (the twin does that\n"
        "  // work now — no crushing hand, gentle or otherwise)\n"
        "  for (const leaner of ['.gd-numeix-dapple', '.gd-numeix-xmarks', '.gd-nuri-licks', '.gd-auric-currents',\n"
        "    '.gd-finish-auric', '.gd-finish-foil', '.gd-finish-numeix', '.gd-finish-nuri', '.gd-finish-holographic', '.gd-finish-prismatic']) {\n"
        "    assert.ok(!ink.includes(`.gd-fin-ground-light ${leaner},`) && !ink.includes(`.gd-fin-ground-light ${leaner} {`), `a tint-leaning seat joined the facet: ${leaner}`);\n"
        "  }")

    # ---- 196 — the 1.9.5 suite learns the 1.9.6 truth -----------------
    sub("scripts/gendex_196_batch_dom.test.mjs",
        "  // the four broad bodies are gone from EVERY light blend seat (the\n"
        "  // retirement is the law: a wash was never an ink, and the multiply\n"
        "  // stack compounded toward the report's black)\n"
        "  for (const body of ['.gd-finish-foil', '.gd-finish-auric', '.gd-finish-numeix', '.gd-finish-nuri']) {\n"
        "    assert.ok(!css.includes(`.gd-fin-ground-light ${body},\\n`) && !css.includes(`.gd-fin-ground-light ${body} {\\n  mix-blend-mode: multiply;`), `a broad body rejoined the light multiply stack: ${body}`);\n"
        "  }",
        "  /* 1.9.6 — THE CERTAIN INK: the bodies REJOIN the light multiply\n"
        "     stack (the twin through --gd-tint-hand carries the contrast at the\n"
        "     ink's own derivation — a broad wash lands as a gentle tint, never\n"
        "     the 1.9.4 coffee, because the crushing filter is gone). */\n"
        "  for (const body of ['.gd-finish-foil', '.gd-finish-auric', '.gd-finish-numeix', '.gd-finish-nuri']) {\n"
        "    assert.ok(light.includes(`.gd-fin-ground-light ${body},`) || light.includes(`.gd-fin-ground-light ${body} {`), `a broad body left the light multiply stack: ${body}`);\n"
        "  }")
    sub("scripts/gendex_196_batch_dom.test.mjs",
        "ok('A2 — the ink law learned the gentle hand (0.55/1.35 -> 0.74/1.5)', () => {\n"
        "  const ink = /\\.gd-fin-ground-light \\.gd-numeix-dapple,\\n(?:\\.gd-fin-ground-light [^\\n]+,\\n)*\\.gd-fin-ground-light [^\\n]+ \\{\\n  filter: brightness\\(0\\.74\\) saturate\\(1\\.5\\);\\n\\}/.exec(css)?.[0] || '';\n"
        "  assert.ok(ink, 'the gentle ink law never spoke');\n"
        "  // the details keep the law (the glints stay present on bright plates)\n"
        "  for (const seat of ['.gd-numeix-dapple', '.gd-numeix-xmarks', '.gd-nuri-licks', '.gd-nuri-sparks', '.gd-nuri-flare',\n"
        "    '.gd-auric-flakes', '.gd-finish-foil-ripples', '.gd-holo-dots', '.gd-prism-sweep']) {\n"
        "    assert.ok(ink.includes(`.gd-fin-ground-light ${seat},`) || ink.includes(`.gd-fin-ground-light ${seat} {`), `the gentle hand never seated ${seat}`);\n"
        "  }\n"
        "  // the broad bodies left the ink list (a broad wash at 0.55 was the\n"
        "  // black the stack printed)\n"
        "  for (const body of ['.gd-finish-numeix', '.gd-finish-auric', '.gd-finish-nuri']) {\n"
        "    assert.ok(!ink.includes(`.gd-fin-ground-light ${body},`) && !ink.includes(`.gd-fin-ground-light ${body} {`), `a broad body rejoined the ink law: ${body}`);\n"
        "  }\n"
        "  // the crushing hand itself retired from the sheet's RULES (the\n"
        "  // historical prose keeps its memory — the laws speak in declarations)\n"
        "  const cssLaws = css.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '');\n"
        "  assert.ok(!cssLaws.includes('brightness(0.55) saturate(1.35)'), 'the crushing filter survived somewhere');\n"
        "});",
        "/* 1.9.6 — THE CERTAIN INK supersedes the gentle hand: the ink's\n"
        "   contrast moved to its own derivation (the twin), the static filter\n"
        "   retired from every tint-leaning seat, and the white-ink seats alone\n"
        "   keep the SILVER FACET (brightness(0.55) saturate(1.18)) — their ink\n"
        "   is white by design, no tint to twin, and the one honest shadow a\n"
        "   white light speaks on a bright plate is gray. */\n"
        "ok('A2 — the white-ink seats alone keep the silver facet (0.55/1.18)', () => {\n"
        "  const ink = /\\.gd-fin-ground-light \\.gd-finish-foil-ripples,\\n(?:\\.gd-fin-ground-light [^\\n]+,\\n)*\\.gd-fin-ground-light [^\\n]+ \\{\\n  filter: brightness\\(0\\.55\\) saturate\\(1\\.18\\);\\n\\}/.exec(css)?.[0] || '';\n"
        "  assert.ok(ink, 'the silver facet never spoke');\n"
        "  for (const seat of ['.gd-finish-foil-ripples', '.gd-finish-holographic::before', '.gd-holo-shards', '.gd-holo-dots',\n"
        "    '.gd-prism-stars', '.gd-prism-particles', '.gd-prism-waves', '.gd-prism-sweep']) {\n"
        "    assert.ok(ink.includes(`.gd-fin-ground-light ${seat},`) || ink.includes(`.gd-fin-ground-light ${seat} {`), `the silver facet never seated ${seat}`);\n"
        "  }\n"
        "  // no tint-leaning seat ever joined the facet (the twin does that work)\n"
        "  for (const leaner of ['.gd-numeix-dapple', '.gd-numeix-xmarks', '.gd-nuri-licks', '.gd-nuri-sparks', '.gd-nuri-flare',\n"
        "    '.gd-auric-flakes', '.gd-finish-numeix', '.gd-finish-auric', '.gd-finish-nuri', '.gd-finish-holographic', '.gd-finish-prismatic']) {\n"
        "    assert.ok(!ink.includes(`.gd-fin-ground-light ${leaner},`) && !ink.includes(`.gd-fin-ground-light ${leaner} {`), `a tint-leaning seat joined the facet: ${leaner}`);\n"
        "  }\n"
        "  // the gentle hand itself retired from the sheet's RULES (the\n"
        "  // historical prose keeps its memory — the laws speak in declarations)\n"
        "  const cssLaws = css.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '');\n"
        "  assert.ok(!cssLaws.includes('brightness(0.74) saturate(1.5)'), 'the gentle filter survived somewhere');\n"
        "  assert.ok(!cssLaws.includes('brightness(0.55) saturate(1.35)'), 'the crushing filter survived somewhere');\n"
        "});")
    sub("scripts/gendex_196_batch_dom.test.mjs",
        "  assertMatch(veil, /background: var\\(--gd-card-tint, var\\(--gd-panel\\)\\);/, 'the veil lost the tint');",
        "  /* 1.9.6 — the veil's ink IS the hand now (the twin — overlay with a\n"
        "     dark top deepens a bright plate; the white-wash \"negative\" the raw\n"
        "     tint printed on white retires with it). */\n"
        "  assertMatch(veil, /background: var\\(--gd-tint-hand, var\\(--gd-card-tint, var\\(--gd-panel\\)\\)\\);/, 'the veil lost the tint');")
    sub("scripts/gendex_196_batch_dom.test.mjs",
        "  assertMatch(newchar, /card: \\{ ratio, trim, trimColor, crop, color: cardColor, finish, finishOnImage, finishOnTrim, finishTransparency, imageMotion, stampMotion \\}/, 'the CREATE commit never carried the knob');",
        "  /* 1.9.6 — the split volume rides the same CREATE commit (the\n"
        "     checkbox + the image knob — one family, one birth). */\n"
        "  assertMatch(newchar, /card: \\{ ratio, trim, trimColor, crop, color: cardColor, finish, finishOnImage, finishOnTrim, finishTransparency, finishSplitImage, finishImageTransparency, imageMotion, stampMotion \\}/, 'the CREATE commit never carried the knob');")
    sub("scripts/gendex_196_batch_dom.test.mjs",
        "  assertMatch(newchar, /finishTransparency=\\{finishTransparency\\}\\s*\\n\\s*imageMotion=\\{imageMotion\\}/, 'the window never threaded the knob into the preview');",
        "  assertMatch(newchar, /finishTransparency=\\{finishTransparency\\}\\s*\\n\\s*finishSplitImage=\\{finishSplitImage\\}\\s*\\n\\s*finishImageTransparency=\\{finishImageTransparency\\}\\s*\\n\\s*imageMotion=\\{imageMotion\\}/, 'the window never threaded the knob into the preview');")
    sub("scripts/gendex_196_batch_dom.test.mjs",
        "  assertMatch(charview, /finishTransparency=\\{finishTransparency\\}\\s*\\n\\s*imageMotion=\\{imageMotion\\}/, 'the window never threaded the knob into the preview');",
        "  /* 1.9.6 — the split volume threads into the preview beside the knob. */\n"
        "  assertMatch(charview, /finishTransparency=\\{finishTransparency\\}\\s*\\n\\s*finishSplitImage=\\{finishSplitImage\\}\\s*\\n\\s*finishImageTransparency=\\{finishImageTransparency\\}\\s*\\n\\s*imageMotion=\\{imageMotion\\}/, 'the window never threaded the knob into the preview');")
    sub("scripts/gendex_196_batch_dom.test.mjs",
        "  assertMatch(grid, /finishGroundTone, finishPhase, finishStrength,/, 'the grid never imported the derivation');",
        "  /* 1.9.6 — the import gained finishInkTwin (the shadow twin the light\n"
        "     ground's seats read). */\n"
        "  assertMatch(grid, /finishGroundTone, finishInkTwin, finishPhase, finishStrength,/, 'the grid never imported the derivation');")
    sub("scripts/gendex_196_batch_dom.test.mjs",
        "  assert.ok(readme.includes('version-1.9.5-purple'));",
        "  assert.ok(readme.includes('version-1.9.6-purple'));")

    print("\n1.9.6 law pins healed.")


if __name__ == "__main__":
    main()
