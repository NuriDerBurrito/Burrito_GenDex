#!/usr/bin/env python3
"""1.9.5 coat volume surgery — THE COAT'S OWN VOLUME, threaded end to end.

The slider law ("finish effects are a bit too clear now on the cards like
prismatic effects and such, you may add also a transparency slider for the
finishes in order to control it, add that slider in the card creation
window and card edit window"):

  · the CARD carries the knob (cardFinishTransparency, 0..1 — 0 paints the
    full coat, 1 retires it to clear glass; the default is 0.15, the
    report's "a bit too clear" answered at the default seat);
  · the SHARED finish section (CardStyleControls — the one component both
    windows seat) grows the slider row under the picker, speaking the
    family's grey-out law while no finish is picked;
  · the COAT SEATS read it as --gd-fin-strength (1 - transparency) on the
    card root: every .gd-card-face-finish / .gd-card-face-artfin seat and
    the trim coat fade as one family (per-layer premultiplied fade — each
    seat's own blend keeps its word, the whole ink simply softens), and
    the three artfin breath clocks carry the var inside their keyframes
    (an animated opacity would otherwise shout over the base seat);
  · every card surface writes the var beside --gd-card-tint — the grid
    card, the look editor's panzoom, the compact preview — and both
    windows' previews paint the DRAFT (what you slide is what you ship).

Run from the app root."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def sub(path: str, old: str, new: str, count=1) -> None:
    p = ROOT / path
    raw = p.read_text(encoding="utf8")
    if new in raw and old not in raw:
        print(f"  {path}: already seated — {old[:48]!r}")
        return
    found = raw.count(old)
    assert found == count, f"{path}: expected {count} seat(s) of {old[:80]!r}, found {found}"
    raw = raw.replace(old, new, count)
    p.write_text(raw, encoding="utf8")
    print(f"  {path}: seated — {old[:48]!r}")


# ---------------------------------------------------------------------------
# the LAW'S OWN SEATS — constants + the load sanitizer
# ---------------------------------------------------------------------------
sub(
    "src/constants/index.js",
    "export const DEFAULT_CARD_FINISH = 'none';",
    """export const DEFAULT_CARD_FINISH = 'none';
// 1.9.5 — THE COAT'S OWN VOLUME ("finish effects are a bit too clear now
// on the cards like prismatic effects and such, you may add also a
// transparency slider for the finishes in order to control it, add that
// slider in the card creation window and card edit window"): the coat's
// clarity is a knob on the card itself — 0 paints the full coat (every
// word the material ever spoke), 1 retires it to clear glass. The default
// answers the report's own complaint: 15% transparency — the coat a bit
// softer than the 1.9.4 voice, one slider-move from either extreme.
export const DEFAULT_FINISH_TRANSPARENCY = 0.15;
export const normalizeFinishTransparency = (v) =>
  Number.isFinite(+v) ? Math.min(1, Math.max(0, +v)) : DEFAULT_FINISH_TRANSPARENCY;""",
)

sub(
    "src/constants/index.js",
    """export const sanitizeCardLook = (card = {}) => ({
  finish: isCardFinish(card.finish) ? migrateCardFinish(card.finish) : DEFAULT_CARD_FINISH,
  finishOnImage: card.finishOnImage === true,""",
    """export const sanitizeCardLook = (card = {}) => ({
  finish: isCardFinish(card.finish) ? migrateCardFinish(card.finish) : DEFAULT_CARD_FINISH,
  finishOnImage: card.finishOnImage === true,
  // 1.9.5 — the coat's own volume joins the rails (the slider's law —
  // see DEFAULT_FINISH_TRANSPARENCY): junk falls to the softened default,
  // a saved card keeps its own knob.
  finishTransparency: normalizeFinishTransparency(card.finishTransparency),""",
)

sub(
    "src/constants/index.js",
    """  cardFinish: sanitizeCardLook(card).finish,
  cardFinishOnImage: sanitizeCardLook(card).finishOnImage,""",
    """  cardFinish: sanitizeCardLook(card).finish,
  cardFinishOnImage: sanitizeCardLook(card).finishOnImage,
  // 1.9.5 — THE COAT'S OWN VOLUME rides the card object with the finish
  // family (the transparency knob — what the creation window slides is
  // what the card is born wearing).
  cardFinishTransparency: sanitizeCardLook(card).finishTransparency,""",
)

sub(
    "src/utils/helpers.js",
    """  sanitizeStampAlpha,
  sanitizeStampHueAlpha,
  sanitizeStampSettings,
} from '../constants/index.js';""",
    """  sanitizeStampAlpha,
  sanitizeStampHueAlpha,
  sanitizeStampSettings,
  normalizeFinishTransparency,
} from '../constants/index.js';""",
)

sub(
    "src/utils/helpers.js",
    """    cardFinish: isCardFinish(character?.cardFinish)
      ? migrateCardFinish(character.cardFinish)
      : DEFAULT_CARD_FINISH,
    cardFinishOnImage: character?.cardFinishOnImage === true,""",
    """    cardFinish: isCardFinish(character?.cardFinish)
      ? migrateCardFinish(character.cardFinish)
      : DEFAULT_CARD_FINISH,
    cardFinishOnImage: character?.cardFinishOnImage === true,
    // 1.9.5 — THE COAT'S OWN VOLUME (the transparency slider's rail — see
    // sanitizeCardLook in constants): junk falls to the softened default,
    // a saved card keeps its own knob.
    cardFinishTransparency: normalizeFinishTransparency(character?.cardFinishTransparency),""",
)

# ---------------------------------------------------------------------------
# the COAT SEATS — the CSS var the seats read
# ---------------------------------------------------------------------------
sub(
    "src/index.css",
    """  overflow: hidden;
  pointer-events: none;
  z-index: 2;
  --gd-fin-ph: 0;
  --gd-art-h: 200px;
  --gd-fin-cut: calc(var(--gd-art-h) - (max(var(--gd-shape-radius, var(--gd-radius)) - 2px, 0px) + 1px));
}
/* the plate-only veil: the mask cuts exactly at the old plate coat's own""",
    """  overflow: hidden;
  pointer-events: none;
  z-index: 2;
  --gd-fin-ph: 0;
  --gd-art-h: 200px;
  --gd-fin-cut: calc(var(--gd-art-h) - (max(var(--gd-shape-radius, var(--gd-radius)) - 2px, 0px) + 1px));
  /* 1.9.5 — THE COAT'S OWN VOLUME ("finish effects are a bit too clear
     now on the cards like prismatic effects and such, you may add also a
     transparency slider for the finishes in order to control it"): every
     coat seat reads --gd-fin-strength (the card roots write it beside
     --gd-card-tint — 1 paints the full coat, 0 retires it to clear
     glass). The fade is the PREMULTIPLIED kind: the seat keeps its own
     blend word against the plate, its whole ink simply softens by the
     knob (an opacity seat on the layer itself — never a wrapper, whose
     isolation would break every blend law the coat speaks). The default
     0.15 transparency leaves the coat at 85% — the report's "a bit too
     clear" answered at the source. */
  opacity: var(--gd-fin-strength, 1);
}
/* the plate-only veil: the mask cuts exactly at the old plate coat's own""",
)

sub(
    "src/index.css",
    """.gd-card-face-artfin {
  position: absolute;
  inset: 0;
  border-radius: calc(var(--gd-shape-radius, var(--gd-radius)) - var(--gd-border-w, 2px));
  overflow: hidden;
  pointer-events: none;
  z-index: 2;
  --gd-fin-ph: 0;
  --gd-art-h: 200px;
  --gd-fin-cut: calc(var(--gd-art-h) - (max(var(--gd-shape-radius, var(--gd-radius)) - 2px, 0px) + 1px));
}""",
    """.gd-card-face-artfin {
  position: absolute;
  inset: 0;
  border-radius: calc(var(--gd-shape-radius, var(--gd-radius)) - var(--gd-border-w, 2px));
  overflow: hidden;
  pointer-events: none;
  z-index: 2;
  --gd-fin-ph: 0;
  --gd-art-h: 200px;
  --gd-fin-cut: calc(var(--gd-art-h) - (max(var(--gd-shape-radius, var(--gd-radius)) - 2px, 0px) + 1px));
  /* 1.9.5 — the artfin twin reads the same volume var (the sprite's wash
     is the coat's own voice; see .gd-card-face-finish above — the breath
     clocks below carry the var inside their keyframes, the one place an
     animated opacity would otherwise shout over the base seat). */
  opacity: var(--gd-fin-strength, 1);
}""",
)

# the three artfin breath clocks — the var rides inside the keyframes
sub(
    "src/index.css",
    """@keyframes gd-numeix-inkbreath {
  0%,
  100% {
    opacity: 0.72;
  }
  50% {
    opacity: 1;
  }
}""",
    """@keyframes gd-numeix-inkbreath {
  0%,
  100% {
    opacity: calc(var(--gd-fin-strength, 1) * 0.72);
  }
  50% {
    opacity: calc(var(--gd-fin-strength, 1) * 1);
  }
}""",
)

sub(
    "src/index.css",
    """@keyframes gd-auric-honeybreath {
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}""",
    """@keyframes gd-auric-honeybreath {
  0%,
  100% {
    opacity: calc(var(--gd-fin-strength, 1) * 0.7);
  }
  50% {
    opacity: calc(var(--gd-fin-strength, 1) * 1);
  }
}""",
)

sub(
    "src/index.css",
    """@keyframes gd-nuri-emberbreath {
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}""",
    """@keyframes gd-nuri-emberbreath {
  0%,
  100% {
    opacity: calc(var(--gd-fin-strength, 1) * 0.7);
  }
  50% {
    opacity: calc(var(--gd-fin-strength, 1) * 1);
  }
}""",
)

# the trim coat — the finish's voice on the trim reads the same knob
sub(
    "src/index.css",
    """.gd-trim.gd-trim-coat {
  z-index: 4;
}""",
    """.gd-trim.gd-trim-coat {
  z-index: 4;
}
/* 1.9.5 — THE COAT'S OWN VOLUME (the trim coat's seat): the clone is the
   finish's own voice on the trim, so it reads the coat's volume var with
   the family — a transparent finish paints a transparent trim coat (one
   knob, one coat, every seat it reaches). Its own rule beside the rung,
   so the rung law above keeps the exact shape it always spoke. */
.gd-trim.gd-trim-coat {
  opacity: var(--gd-fin-strength, 1);
}""",
)

# ---------------------------------------------------------------------------
# the STRENGTH DERIVER + the COMPACT PREVIEW (TagRibbon)
# ---------------------------------------------------------------------------
sub(
    "src/components/TagRibbon.jsx",
    """import { effectiveCrop, isExtremePlateHex, readableInk, stripRichText, counterRimFor } from '../utils/helpers.js';""",
    """import { effectiveCrop, isExtremePlateHex, readableInk, stripRichText, counterRimFor } from '../utils/helpers.js';
// 1.9.5 — THE COAT'S OWN VOLUME: the default knob the slider speaks (see
// DEFAULT_FINISH_TRANSPARENCY in constants — the 1.9.4 coat read "a bit
// too clear", so the default carries 15% transparency).
import { DEFAULT_FINISH_TRANSPARENCY } from '../constants/index.js';""",
)

sub(
    "src/components/TagRibbon.jsx",
    """export function finishGroundTone(cardColor) {""",
    """// 1.9.5 — THE COAT'S OWN VOLUME: the transparency the windows pick (0 =
// the full coat, 1 = clear glass) becomes the CSS strength the coat
// seats read (--gd-fin-strength — 1 paints the full material). One
// subtraction, rounded to three decimals so a slider's floating steps
// (0.30000000000000004) never reach the sheet. Every card surface writes
// it beside --gd-card-tint: the grid card, the look editor's panzoom,
// the compact preview — one voice, what you slide is what you get.
export function finishStrength(transparency) {
  const t = Number.isFinite(+transparency)
    ? Math.min(1, Math.max(0, +transparency))
    : DEFAULT_FINISH_TRANSPARENCY;
  return Number((1 - t).toFixed(3));
}

export function finishGroundTone(cardColor) {""",
)

sub(
    "src/components/TagRibbon.jsx",
    """  finishOnTrim = false,
  // 1.4.1 — IMAGE MOTION, one voice with the grid card: the preview's
  // art sways too (what you frame is what you get).
  imageMotion = false,
}) {
  const r = ratio && ratio.w > 0 && ratio.h > 0 ? ratio : { w: 3, h: 4 };""",
    """  finishOnTrim = false,
  // 1.9.5 — THE COAT'S OWN VOLUME: the transparency knob the windows
  // slide, painted by the preview at the coat's true strength (what you
  // frame is what you get).
  finishTransparency = null,
  // 1.4.1 — IMAGE MOTION, one voice with the grid card: the preview's
  // art sways too (what you frame is what you get).
  imageMotion = false,
}) {
  const r = ratio && ratio.w > 0 && ratio.h > 0 ? ratio : { w: 3, h: 4 };""",
)

sub(
    "src/components/TagRibbon.jsx",
    """        ['--gd-card-tint']: cardColor || finishGround || 'var(--gd-panel)',
        ...(finishGround ? { backgroundColor: finishGround } : null),
      }}
    >
      {/* 1.4.5 — THE COAT SPEAKS FIRST IN THE DOM (the grid card's own
          law): at its equal rung (z 2) the later stamp seats win by DOM
          order, so the coat can never cover what its switches say it
          must not. */}
      <CardFinishLayer
        finish={finish}
        onImage={finishOnImage}
        onTrim={finishOnTrim}
        artH={artH}
        hasImage={!!imageUrl}
        phase={finPhase}
      />""",
    """        ['--gd-card-tint']: cardColor || finishGround || 'var(--gd-panel)',
        /* 1.9.5 — THE COAT'S OWN VOLUME: the card root writes the
           strength var the coat seats read (the transparency knob's own
           seat — see finishStrength above). */
        ['--gd-fin-strength']: finishStrength(finishTransparency),
        ...(finishGround ? { backgroundColor: finishGround } : null),
      }}
    >
      {/* 1.4.5 — THE COAT SPEAKS FIRST IN THE DOM (the grid card's own
          law): at its equal rung (z 2) the later stamp seats win by DOM
          order, so the coat can never cover what its switches say it
          must not. */}
      <CardFinishLayer
        finish={finish}
        onImage={finishOnImage}
        onTrim={finishOnTrim}
        artH={artH}
        hasImage={!!imageUrl}
        phase={finPhase}
      />""",
)

# ---------------------------------------------------------------------------
# the GRID CARD (GridView) — the shipped card's own seat
# ---------------------------------------------------------------------------
sub(
    "src/components/GridView.jsx",
    "import TagRibbon, { CardFinishLayer, FINISH_GROUND, TrimCoatLayer, TrimOverlay, cropFrame, finishGroundTone, finishPhase, markRibbonHeadRoom, ribbonSize, ribbonTopOffset, trimCoatInk } from './TagRibbon.jsx';",
    "import TagRibbon, { CardFinishLayer, FINISH_GROUND, TrimCoatLayer, TrimOverlay, cropFrame, finishGroundTone, finishPhase, finishStrength, markRibbonHeadRoom, ribbonSize, ribbonTopOffset, trimCoatInk } from './TagRibbon.jsx';",
)

sub(
    "src/components/GridView.jsx",
    """          ['--gd-card-tint']: character.cardColor || finishGround || 'var(--gd-panel)',
          ...(finishGround ? { backgroundColor: finishGround } : null),
        }}""",
    """          ['--gd-card-tint']: character.cardColor || finishGround || 'var(--gd-panel)',
          /* 1.9.5 — THE COAT'S OWN VOLUME: the shipped card paints the
             coat at the knob's own strength (the transparency the card
             carries — see finishStrength in TagRibbon; a card saved
             before the knob keeps the softened default). */
          ['--gd-fin-strength']: finishStrength(character.cardFinishTransparency),
          ...(finishGround ? { backgroundColor: finishGround } : null),
        }}""",
)

# ---------------------------------------------------------------------------
# the LOOK EDITOR (CardLookEditor) — the panzoom + the compact twin
# ---------------------------------------------------------------------------
sub(
    "src/components/CardLookEditor.jsx",
    "import { CARD_TRIMS, DEFAULT_CARD_TRIM, RATIO_PRESETS } from '../constants/index.js';",
    "import { CARD_TRIMS, DEFAULT_CARD_TRIM, RATIO_PRESETS } from '../constants/index.js';\nimport { finishStrength } from './TagRibbon.jsx';",
)

sub(
    "src/components/CardLookEditor.jsx",
    """  // 1.4.7 — STAMP MOTION ("add stamp motion too, which when checked will
  // move the stamp alongside the image with a slight delay"): the band +
  // any placed sticker in the preview follow the art's sway a beat behind
  // it — what you frame is what you get.
  stampMotion = false,
}) {
  // 1.4.5 — THE FINISH'S OWN TEXT RIM (the grid card's law, verbatim): the""",
    """  // 1.4.7 — STAMP MOTION ("add stamp motion too, which when checked will
  // move the stamp alongside the image with a slight delay"): the band +
  // any placed sticker in the preview follow the art's sway a beat behind
  // it — what you frame is what you get.
  stampMotion = false,
  // 1.9.5 — THE COAT'S OWN VOLUME: the transparency knob, painted by the
  // panzoom at the coat's true strength (the knob's own preview law —
  // what you slide in the window beside is what the card ships).
  finishTransparency = null,
}) {
  // 1.4.5 — THE FINISH'S OWN TEXT RIM (the grid card's law, verbatim): the""",
)

sub(
    "src/components/CardLookEditor.jsx",
    """        ['--gd-card-tint']: cardColor || finishGround || 'var(--gd-panel)',
        ...(finishGround ? { backgroundColor: finishGround } : null),
      }}
    >
      {/* 1.4.5 — THE COAT SPEAKS FIRST IN THE DOM (the grid card's own
          ladder law): at its equal rung (z 2) the later stamp seats win by
          DOM order, and the .gd-fin-on-trim scope lifts the whole family
          onto the over-trim rung (z 4) when the switch is on. */}
      <CardFinishLayer
        finish={finish}
        onImage={finishOnImage}
        onTrim={finishOnTrim}
        artH={Math.max(0, width - 4) * (r.h / r.w)}
        hasImage={!!imageUrl}
        phase={0.37}
      />""",
    """        ['--gd-card-tint']: cardColor || finishGround || 'var(--gd-panel)',
        /* 1.9.5 — THE COAT'S OWN VOLUME: the panzoom writes the strength
           var with the grid card's own law (finishStrength in TagRibbon)
           — the knob's draft paints here the moment it moves. */
        ['--gd-fin-strength']: finishStrength(finishTransparency),
        ...(finishGround ? { backgroundColor: finishGround } : null),
      }}
    >
      {/* 1.4.5 — THE COAT SPEAKS FIRST IN THE DOM (the grid card's own
          ladder law): at its equal rung (z 2) the later stamp seats win by
          DOM order, and the .gd-fin-on-trim scope lifts the whole family
          onto the over-trim rung (z 4) when the switch is on. */}
      <CardFinishLayer
        finish={finish}
        onImage={finishOnImage}
        onTrim={finishOnTrim}
        artH={Math.max(0, width - 4) * (r.h / r.w)}
        hasImage={!!imageUrl}
        phase={0.37}
      />""",
)

# the wrapper's signature + both preview seats
sub(
    "src/components/CardLookEditor.jsx",
    """  // 1.4.7 — STAMP MOTION ("add stamp motion too, which when checked will
  // move the stamp alongside the image with a slight delay"): forwarded
  // into the panzoom preview so the editor speaks the shipped card's own
  // trailing sway.
  stampMotion = false,
  // 1.4.1 — TRIM ASIDE ("in card edit window, make the trims have their
  // own column on the left (aka 3 columns now) of the preview so there
  // is no need to scroll inside the window"): when true the editor
  // renders TWO columns of its own — the TRIM tower on a fixed left
  // rail, the preview + ratio beside it — so the EDIT CARD window's
  // whole body fits one screen with no scrolling.
  trimAside = false,
}) {""",
    """  // 1.4.7 — STAMP MOTION ("add stamp motion too, which when checked will
  // move the stamp alongside the image with a slight delay"): forwarded
  // into the panzoom preview so the editor speaks the shipped card's own
  // trailing sway.
  stampMotion = false,
  // 1.9.5 — THE COAT'S OWN VOLUME: the transparency knob, forwarded into
  // BOTH preview seats (the panzoom and the compact CardPreview) so the
  // coat's clarity in the window is the clarity the card ships.
  finishTransparency = null,
  // 1.4.1 — TRIM ASIDE ("in card edit window, make the trims have their
  // own column on the left (aka 3 columns now) of the preview so there
  // is no need to scroll inside the window"): when true the editor
  // renders TWO columns of its own — the TRIM tower on a fixed left
  // rail, the preview + ratio beside it — so the EDIT CARD window's
  // whole body fits one screen with no scrolling.
  trimAside = false,
}) {""",
)

sub(
    "src/components/CardLookEditor.jsx",
    """            finish={finish}
            finishOnImage={finishOnImage}
            finishOnTrim={finishOnTrim}
            imageMotion={imageMotion}
            stampMotion={stampMotion}
          />""",
    """            finish={finish}
            finishOnImage={finishOnImage}
            finishOnTrim={finishOnTrim}
            finishTransparency={finishTransparency}
            imageMotion={imageMotion}
            stampMotion={stampMotion}
          />""",
)

sub(
    "src/components/CardLookEditor.jsx",
    """          finish={finish}
          finishOnImage={finishOnImage}
          finishOnTrim={finishOnTrim}
          imageMotion={imageMotion}
          stampMotion={stampMotion}
        />""",
    """          finish={finish}
          finishOnImage={finishOnImage}
          finishOnTrim={finishOnTrim}
          finishTransparency={finishTransparency}
          imageMotion={imageMotion}
          stampMotion={stampMotion}
        />""",
)

# ---------------------------------------------------------------------------
# the SHARED FINISH SECTION (CardStyleControls) — the slider itself
# ---------------------------------------------------------------------------
sub(
    "src/components/CardStyleControls.jsx",
    "import { CARD_FINISHES } from '../constants/index.js';",
    "import { CARD_FINISHES, normalizeFinishTransparency } from '../constants/index.js';",
)

sub(
    "src/components/CardStyleControls.jsx",
    """  // 1.4.6 — THE SUBJECT TRUTH: does this card actually carry an image /
  // stamps right now? The callers thread their live drafts (the creation
  // window speaks its own image + stamps states; the edit window speaks
  // the character's own), so the gates flip the moment the subject
  // arrives or leaves — no stale seat, no dead switch.
  hasImage = true,
  hasStamp = true,""",
    """  // 1.4.6 — THE SUBJECT TRUTH: does this card actually carry an image /
  // stamps right now? The callers thread their live drafts (the creation
  // window speaks its own image + stamps states; the edit window speaks
  // the character's own), so the gates flip the moment the subject
  // arrives or leaves — no stale seat, no dead switch.
  hasImage = true,
  hasStamp = true,
  /* 1.9.5 — THE COAT'S OWN VOLUME ("finish effects are a bit too clear
     now on the cards like prismatic effects and such, you may add also
     a transparency slider for the finishes in order to control it, add
     that slider in the card creation window and card edit window"): the
     knob the whole family rides — 0 paints the full coat, 1 retires it
     to clear glass, the default 15% answering the report's "a bit too
     clear" at the source. Threaded from the callers' drafts exactly
     like the reach switches (this one section is the voice both windows
     share — the creation window AND the edit card window gain the knob
     in the same breath). */
  finishTransparency = null,
  onFinishTransparency = null,""",
)

sub(
    "src/components/CardStyleControls.jsx",
    """        {/* 1.4.5 — THE SWITCH FAMILY STAYS SEATED (the grey-out law): the""",
    """        {/* 1.9.5 — THE COAT'S OWN VOLUME — the family's own knob, seated
            under the picker in BOTH windows (this shared section is the
            one voice the creation window and the edit card window
            speak). 0% paints the full coat every material word it ever
            spoke; 100% retires it to clear glass; the default is 15%.
            The grey-out law holds with the family: no finish picked (or
            the gate down), the knob takes the dimmed blind seat with its
            own reason on hover — never hidden, exactly the 1.4.5 law. */}
        {(onFinishTransparency || Number.isFinite(+finishTransparency)) && (
          <div
            className={clsx('mt-1.5 flex items-center gap-x-3', coatSilent && 'opacity-45 pointer-events-none')}
            title={
              finishesHidden
                ? 'Experimental finishes are off: the coat (and everything it reaches) is stilled until the master switch returns (Settings, Performance tab)'
                : noFinish
                  ? 'Needs a finish: pick a material above and this knob will set how clear the coat paints'
                  : 'How transparent the finish effects are — 0% paints the full coat, 100% retires it to clear glass (the default, 15%, is a touch softer than the coats have always spoken)'
            }
          >
            <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-gd-mute shrink-0">Transparency</span>
            <input
              type="range"
              className="gd-range flex-1 min-w-[110px]"
              min={0}
              max={1}
              step={0.05}
              value={normalizeFinishTransparency(finishTransparency)}
              disabled={coatSilent || !onFinishTransparency}
              aria-label="Finish transparency"
              onChange={(e) => onFinishTransparency(Number(e.target.value))}
            />
            <span className="text-[11px] text-gd-chrome w-8 text-right shrink-0 tabular-nums">
              {Math.round(normalizeFinishTransparency(finishTransparency) * 100)}%
            </span>
          </div>
        )}
        {/* 1.4.5 — THE SWITCH FAMILY STAYS SEATED (the grey-out law): the""",
)

# ---------------------------------------------------------------------------
# the CREATION WINDOW (NewCharacterModal)
# ---------------------------------------------------------------------------
sub(
    "src/components/NewCharacterModal.jsx",
    "import { CHIP_COLORS, CLASS_COLOR_PRESETS, DEFAULT_CARD_TRIM, ROOT_CLASS_ID, sanitizeStampSettings } from '../constants/index.js';",
    "import { CHIP_COLORS, CLASS_COLOR_PRESETS, DEFAULT_CARD_TRIM, DEFAULT_FINISH_TRANSPARENCY, ROOT_CLASS_ID, sanitizeStampSettings } from '../constants/index.js';",
)

sub(
    "src/components/NewCharacterModal.jsx",
    """  // 1.4.5 — the coat's trim reach, riding the same create-time draft
  // law the finish speaks. 1.7.2 — THE STAMP REACH IS RETIRED ("delete
  // the stamp effect option"): a new card is never born with it.
  const [finishOnTrim, setFinishOnTrim] = useState(false);""",
    """  // 1.4.5 — the coat's trim reach, riding the same create-time draft
  // law the finish speaks. 1.7.2 — THE STAMP REACH IS RETIRED ("delete
  // the stamp effect option"): a new card is never born with it.
  const [finishOnTrim, setFinishOnTrim] = useState(false);
  // 1.9.5 — THE COAT'S OWN VOLUME (the transparency knob): riding the
  // same create-time draft law the finish speaks — what you slide here
  // is exactly what the card is born wearing (the default, 15%, is the
  // softened voice the report asked for).
  const [finishTransparency, setFinishTransparency] = useState(DEFAULT_FINISH_TRANSPARENCY);""",
)

sub(
    "src/components/NewCharacterModal.jsx",
    """    setFinish('none');
    setFinishOnImage(false);
    setFinishOnTrim(false);""",
    """    setFinish('none');
    setFinishOnImage(false);
    setFinishOnTrim(false);
    // 1.9.5 — the knob re-seeds with the family (a CANCEL never leaks the
    // last draft's clarity into the next CREATE).
    setFinishTransparency(DEFAULT_FINISH_TRANSPARENCY);""",
)

sub(
    "src/components/NewCharacterModal.jsx",
    "      card: { ratio, trim, trimColor, crop, color: cardColor, finish, finishOnImage, finishOnTrim, imageMotion, stampMotion },",
    "      card: { ratio, trim, trimColor, crop, color: cardColor, finish, finishOnImage, finishOnTrim, finishTransparency, imageMotion, stampMotion },",
)

sub(
    "src/components/NewCharacterModal.jsx",
    """            finishOnImage={finishOnImage}
            onFinish={setFinish}
            onFinishOnImage={setFinishOnImage}""",
    """            finishOnImage={finishOnImage}
            /* 1.9.5 — THE COAT'S OWN VOLUME: the knob threads from the
               draft into the shared section (the creation window's seat
               of the family's slider). */
            finishTransparency={finishTransparency}
            onFinishTransparency={setFinishTransparency}
            onFinish={setFinish}
            onFinishOnImage={setFinishOnImage}""",
)

sub(
    "src/components/NewCharacterModal.jsx",
    """            cardColor={cardColor}
            finish={finish}
            finishOnImage={finishOnImage}
            finishOnTrim={finishOnTrim}
            imageMotion={imageMotion}""",
    """            cardColor={cardColor}
            finish={finish}
            finishOnImage={finishOnImage}
            finishOnTrim={finishOnTrim}
            finishTransparency={finishTransparency}
            imageMotion={imageMotion}""",
)

# ---------------------------------------------------------------------------
# the EDIT CARD WINDOW (CharacterView's CardLookModal)
# ---------------------------------------------------------------------------
sub(
    "src/components/CharacterView.jsx",
    "import { makeVersion, DEFAULT_CARD_TRIM, CARD_COL_WIDTH_RANGE, CLASS_COLOR_PRESETS, CARD_FINISHES, isCardFinish, migrateCardFinish } from '../constants/index.js';",
    "import { makeVersion, DEFAULT_CARD_TRIM, CARD_COL_WIDTH_RANGE, CLASS_COLOR_PRESETS, CARD_FINISHES, isCardFinish, migrateCardFinish, normalizeFinishTransparency } from '../constants/index.js';",
)

sub(
    "src/components/CharacterView.jsx",
    """  const [finishOnTrim, setFinishOnTrim] = useState(character.cardFinishOnTrim === true);""",
    """  const [finishOnTrim, setFinishOnTrim] = useState(character.cardFinishOnTrim === true);
  // 1.9.5 — THE COAT'S OWN VOLUME (the transparency knob): the draft-
  // commit law the family speaks — one DONE, one undo step. A card saved
  // before the knob was born opens at the softened default.
  const [finishTransparency, setFinishTransparency] = useState(
    normalizeFinishTransparency(character.cardFinishTransparency)
  );""",
)

sub(
    "src/components/CharacterView.jsx",
    """                finish,
                finishOnImage,
                // 1.4.5 — the coat's trim reach rides it too (one
                // family, one commit). 1.7.2 — the stamp reach left
                // with the option.
                finishOnTrim,""",
    """                finish,
                finishOnImage,
                // 1.4.5 — the coat's trim reach rides it too (one
                // family, one commit). 1.7.2 — the stamp reach left
                // with the option.
                finishOnTrim,
                // 1.9.5 — the coat's own volume rides it too (the
                // transparency knob — one family, one commit).
                finishTransparency,""",
)

sub(
    "src/components/CharacterView.jsx",
    """        cardColor={cardColor}
        finish={finish}
        finishOnImage={finishOnImage}
        finishOnTrim={finishOnTrim}
        imageMotion={imageMotion}
        stampMotion={stampMotion}
        trimAside""",
    """        cardColor={cardColor}
        finish={finish}
        finishOnImage={finishOnImage}
        finishOnTrim={finishOnTrim}
        finishTransparency={finishTransparency}
        imageMotion={imageMotion}
        stampMotion={stampMotion}
        trimAside""",
)

sub(
    "src/components/CharacterView.jsx",
    """              finish={finish}
              finishOnImage={finishOnImage}
              onFinish={touch(setFinish)}
              onFinishOnImage={touch(setFinishOnImage)}
              finishOnTrim={finishOnTrim}
              onFinishOnTrim={touch(setFinishOnTrim)}""",
    """              finish={finish}
              finishOnImage={finishOnImage}
              /* 1.9.5 — THE COAT'S OWN VOLUME: the knob threads from the
                 draft into the shared section (the edit card window's
                 seat of the family's slider). */
              finishTransparency={finishTransparency}
              onFinishTransparency={touch(setFinishTransparency)}
              onFinish={touch(setFinish)}
              onFinishOnImage={touch(setFinishOnImage)}
              finishOnTrim={finishOnTrim}
              onFinishOnTrim={touch(setFinishOnTrim)}""",
)

# ---------------------------------------------------------------------------
# the COMMIT LANE (App.jsx — the edit window's DONE)
# ---------------------------------------------------------------------------
sub(
    "src/App.jsx",
    "import { APP, makeCharacter, makeClass, makeStamp, makeTag, ROOT_CLASS_ID, PANEL_WIDTH_RANGE, SIDEBAR_WIDTH_RANGE, CARD_COL_WIDTH_RANGE, clampPanelWidth, clampSidebarWidth, clampCardColWidth, DEFAULT_SHORTCUTS, comboFromEvent, sanitizeStampAlpha, sanitizeStampHueAlpha, sanitizeStampRot, sanitizeStampScale, sanitizeStampPos, sanitizeStampSettings } from './constants/index.js';",
    "import { APP, makeCharacter, makeClass, makeStamp, makeTag, ROOT_CLASS_ID, PANEL_WIDTH_RANGE, SIDEBAR_WIDTH_RANGE, CARD_COL_WIDTH_RANGE, clampPanelWidth, clampSidebarWidth, clampCardColWidth, DEFAULT_SHORTCUTS, comboFromEvent, sanitizeStampAlpha, sanitizeStampHueAlpha, sanitizeStampRot, sanitizeStampScale, sanitizeStampPos, sanitizeStampSettings, normalizeFinishTransparency } from './constants/index.js';",
)

sub(
    "src/App.jsx",
    """                    cardFinish: card.finish,
                    cardFinishOnImage: card.finishOnImage,""",
    """                    cardFinish: card.finish,
                    cardFinishOnImage: card.finishOnImage,
                    // 1.9.5 — the coat's own volume rides the same commit
                    // (the transparency knob — one family, one undo step).
                    cardFinishTransparency: normalizeFinishTransparency(card.finishTransparency),""",
)

print("\n1.9.5 coat volume threaded (the slider law, end to end).")
