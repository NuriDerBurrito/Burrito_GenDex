import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { ArrowUpDown, Ban, Check, ChevronDown, Eye, Maximize2, Minus, Plus, ScanSearch, Search, Tags, Trash2, X } from 'lucide-react';
import { CARD_WIDTHS, SORT_MODES, TAG_LIMIT_RANGE, TAG_SCALE_RANGE, TAG_SEPARATION_RANGE, ZOOM_RANGE } from '../constants/index.js';
import {
  buildImageUrl,
  counterRimFor,
  customStampHue,
  fmtDate,
  getPreviewVersion,
  isExtremePlateHex,
  readableInk,
  searchCharacters,
  sortCharacters,
  spotlightMatchState,
  stampAlpha,
  stampHueAlpha,
  stampImageIndex,
  stripRichText,
  thumbOf,
  visibleStampsFor,
} from '../utils/helpers.js';
import { CARD_FINISHES, DEFAULT_CARD_FINISH, isCardFinish, migrateCardFinish } from '../constants/index.js';
import MasonryGrid from './MasonryGrid.jsx';
import Popover from './Popover.jsx';
import { RichText } from './RichText.jsx';
import TagRibbon, { CardFinishLayer, FINISH_GROUND, TrimCoatLayer, TrimOverlay, cropFrame, finishGroundTone, finishTintLean, finishPhase, finishStrength, markRibbonHeadRoom, ribbonSize, ribbonTopOffset, trimCoatInk } from './TagRibbon.jsx';
import { useStampHue } from './useAutoStampColor.js';

// 0.47.0 — THE RIBBON ROW CLAMPS ITSELF TO THE CARD ("add a slider that
// will increase separation between the tags (will not extend from the
// card"): the separation setting raises the ceiling, but the row can never
// grow past the card's own width — when the tags + gaps would overflow, the
// effective separation drops (down into overlap) until the row fits. The
// ribbons keep their left-2 seat and always clear the card's right edge.
const clampSeparation = (desired, count, scale, cardWidth) => {
  if (!(count > 1)) return 0;
  const w = ribbonSize(scale).w;
  const inner = Math.max(w * 2, (Number(cardWidth) || 185) - 12); // left-2 seat + a right hair
  const maxSep = Math.floor((inner - count * w) / (count - 1));
  return Math.min(desired, maxSep);
};

const MAX_RIBBONS = 3;
const ADD_FIRST = 'add-first';
const ADD_LAST = 'add-last';

// 0.46.0 — THE SWEEP ARMS ON ENTRY AND RETIRES ITSELF ("when i let go of
// hover, still allow the shine animation to play fully from corner to
// corner on the card, dont interrupt it"): the sweep animation rides
// .gd-card-shine.is-live (see index.css) instead of :hover, so leaving the
// card mid-sweep can't kill it. These two DELEGATED handlers (one pair for
// the whole grid, immune to the cards' memoization) arm the class on the
// hovered card and strip it when the sweep's animationend actually fires —
// a pseudo-element's animationend lands on its HOST element (.gd-card-shine).
// Re-entering while a sweep is live lets it run on (no machine-gunning); a
// fresh entry after it finished starts a new sweep exactly as before.
// 1.2.4 — THE SWEEP RE-ARMS UNDER A RESTING CURSOR ("the shine animation
// when i hover over a card has a long delay between reactivatability, fix
// that so when its done over the card it can be reactivated if hovered
// over again"): the retire used to leave the card dark once its sweep
// ended — re-lighting demanded a full exit + re-entry (and a re-entry
// DURING a sweep did nothing, so a quick re-hover read as a long dead
// window). When the sweep ends the card checks itself: still under the
// cursor (:hover) — the sweep starts AGAIN on the very next beat, so a
// resting hover keeps glinting and any re-entry after an ended sweep is
// instant, exactly as before.
// 1.7.1 — THE PULSE'S OWN COOLDOWN ("the pulse should not be so loopable,
// there should be a cooldown simmilar to the other shine animation (aka
// cooldown where it does it again on same card while continuous hovering
// and when hover and unhover constantly)"): the sweep's rhythm IS its
// clock — a 2.2s flight, an instant re-arm under a resting cursor, and a
// 700ms in-flight guard against boundary flutters — one sweep every
// 2.2s, never a machine gun. The 1.7.0 pulse compressed the flight to
// 0.5s and kept BOTH of those laws untouched: under a resting cursor it
// re-armed the instant each flight ended — a strobe, 4 pulses for every
// one sweep — and every hover-unhover flutter that landed outside a
// flight lit a fresh one. The pulse now carries its OWN cycle, the
// sweep's own 2.2s rhythm: each arm stamps the card (gdPulseAt), the
// retire never re-lights on the spot — it SCHEDULES the re-arm for the
// cycle's remainder (2.2s from the arm, ~1.7s of rest after the 0.5s
// flight) and only fires while the cursor never left; an entry inside
// the window finds the card dark and leaves it dark, so the
// hover-unhover spam machine-guns nothing. The sweep keeps every law it
// ever spoke.
// 1.7.3 — THE RE-ENTRY ANSWERS THE FLIGHT, NOT THE WINDOW ("when i
// unhover then hover again, the cooldown is so long, it should be that
// if i hovered, then pulse played, unhovered then hovered again that it
// will play the animation again (ONLY IF THE PULSE ANIMATION IS DONE)
// like simmilar to the left top to bottom right shine"): the 1.7.1
// window gated every FRESH ENTRY against the ARM timestamp — 2.2s from
// the arm, ~1.7s of dead time AFTER the 0.5s flight had already
// finished, nothing the sweep ever asked of a re-hover (its own flight
// IS its cooldown). The entry window is RETIRED: a fresh entry arms the
// pulse the moment the previous flight is done — the is-live branch
// above still refuses any re-entry while the animation itself is in
// flight (the 700ms young-flight guard, a pulse is 500ms — a re-hover
// inside the glow can never machine-gun it), and the retire's heartbeat
// keeps the continuous-hover rest exactly as 1.7.1 spoke it. Hover →
// pulse → unhover → hover again: the pulse plays again the instant its
// animation finished, the sweep's own answer.
const SHINE_PULSE_CYCLE = 2200;
const shineModeIsPulse = () =>
  typeof document === 'undefined'
    ? false
    : document.documentElement.getAttribute('data-gd-shine-mode') === 'pulse';
const shineArm = (e) => {
  const card = e.target?.closest?.('.gd-card');
  // the hovered card must live INSIDE this grid (the scroller), never a
  // portaled overlay that merely shares the event tree
  if (!card || !e.currentTarget?.contains?.(card)) return;
  const shine = card.querySelector(':scope .gd-card-shine');
  if (!shine) return;
  if (shine.classList.contains('is-live')) {
    // 1.2.5 — RE-ENTRY RELIGHTS A SPENT SWEEP ("the shine animation has a
    // ~2s cooldown after it completes — remove it"): a sweep that is still
    // in flight plays out by the 0.46 law, and re-entering during it used
    // to do NOTHING — the card sat dark for the whole residual flight
    // (up to 2.2s of "cooldown" that read as the shine refusing to come
    // back). A sweep PAST ITS EARLY FLIGHT (>700ms in — the band has
    // crossed most of the art already) restarts on re-entry through the
    // same remove-reflow-readd handoff the retire path speaks; a young
    // sweep keeps the no-machine-gunning law (a boundary flutter can't
    // reset the light).
    const startedAt = Number(shine.dataset.gdShineAt) || 0;
    if (!startedAt || Date.now() - startedAt <= 700) return;
    shine.classList.remove('is-live');
    // eslint-disable-next-line no-unused-expressions
    shine.offsetWidth; // reflow: the removal commits before the re-add
    shine.dataset.gdShineAt = String(Date.now());
    if (shineModeIsPulse()) shine.dataset.gdPulseAt = String(Date.now());
    shine.classList.add('is-live');
    return;
  }
  // 1.7.3 — THE ENTRY WINDOW RETIRES (see the cycle note above): a fresh
  // entry no longer reads gdPulseAt — the gate against machine-gunning
  // lives in the is-live branch alone (a pulse still IN FLIGHT refuses
  // every re-entry; a finished one arms instantly, the sweep's own
  // answer). The stamp below still lands for the retire's heartbeat so a
  // RESTING cursor keeps its 2.2s rhythm exactly as 1.7.1 spoke it.
  if (shineModeIsPulse()) {
    shine.dataset.gdPulseAt = String(Date.now());
  }
  shine.dataset.gdShineAt = String(Date.now());
  shine.classList.add('is-live');
};
const shineRetire = (e) => {
  // 1.6.7 — THE LISTENER KNOWS EVERY STYLE'S NAME: the retire gate used
  // to answer 'gd-shine-sweep' alone; the style dial (Settings → Cards &
  // Tags) added PULSE and GLINT, and an animationend their gate refused
  // would leave is-live lingering on every pulse/glint card — a stale
  // arm the next hover would trip over. All three names retire the class
  // now, whichever style the wall wears.
  // 1.6.8 — THE GLINT LEAVES THE LADDER ("remove glint from shine
  // style"): the third name is retired with its flight (index.css + the
  // settings seat + the sanitize lane); the gate answers the two voices
  // the wall still speaks — sweep and pulse.
  if (e.animationName !== 'gd-shine-sweep' && e.animationName !== 'gd-shine-pulse') {
    return;
  }
  const host = e.target;
  if (!host?.classList?.contains('gd-card-shine')) return;
  host.classList.remove('is-live');
  host.dataset.gdShineAt = '';
  const card = host.closest?.('.gd-card');
  // 1.7.1 — THE PULSE RESTS BETWEEN GLOWS (its own cycle note above):
  // the retired pulse does NOT re-light on the spot under a resting
  // cursor the way the sweep does — that instant re-arm was the strobe.
  // The cycle's remaining time (2.2s from the arm, minus the 0.5s
  // flight just finished) is scheduled instead, and the timer fires
  // only if the cursor never left the card (checked LIVE, at fire time —
  // a stale timer over an abandoned card lights nothing) and the wall
  // still speaks the pulse voice. A fresh entry arms its own cycle the
  // moment the window passes (shineArm); this timer is the continuous
  // hover's own heartbeat.
  if (e.animationName === 'gd-shine-pulse') {
    if (!card || typeof card.matches !== 'function' || !card.matches(':hover')) return;
    const pulseAt = Number(host.dataset.gdPulseAt) || 0;
    const rest = pulseAt ? Math.max(0, SHINE_PULSE_CYCLE - (Date.now() - pulseAt)) : SHINE_PULSE_CYCLE - 500;
    if (host._gdPulseRest) clearTimeout(host._gdPulseRest);
    host._gdPulseRest = setTimeout(() => {
      host._gdPulseRest = 0;
      // 1.7.6 — THE HEARTBEAT SLEEPS IN THE DARK ("when the app is working
      // in the background, it still processes the finishes … fix the
      // issue where it processes unnecessarily in the background"): this
      // timer fired through the dark on a STALE :hover (no frames — no
      // hit-test updates — so a card the cursor left hours ago still
      // matched), then forced a reflow and armed a NEW, UNPAUSED pulse
      // flight the hide-snapshot never held — the exact clock that kept
      // burning style/layout behind a window nobody watched. The timer
      // now stands down while the document is hidden; the chain re-arms
      // on the next real hover after the window shows (the 1.7.3
      // "fresh re-hover arms" law, already the sweep's own word).
      if (typeof document !== 'undefined' && document.hidden) return;
      if (!host.isConnected || !shineModeIsPulse()) return;
      const liveCard = host.closest?.('.gd-card');
      if (!liveCard || typeof liveCard.matches !== 'function' || !liveCard.matches(':hover')) return;
      // eslint-disable-next-line no-unused-expressions
      host.offsetWidth; // reflow: the class flip re-instantiates the glow
      host.dataset.gdShineAt = String(Date.now());
      host.dataset.gdPulseAt = String(Date.now());
      host.classList.add('is-live');
    }, rest);
    return;
  }
  // 1.2.4 — the card the sweep just finished on may still be hovered: read
  // :hover off the CARD (the shine itself is pointer-events: none, so its
  // own :hover never lights). Restart through a forced reflow so the
  // class flip truly re-instantiates the animation (a same-frame re-add
  // can coalesce into a no-op). A card that lost the cursor stays dark —
  // the next entry arms it through shineArm as always.
  // 1.7.6 — the re-arm sleeps in the dark too (the heartbeat's own law
  // above): an animationend that reaches us while the document is hidden
  // belongs to a clock the dark born — re-arming it would only mint
  // another. The retire above (the bookkeeping) already spoke; the
  // RE-LIGHT is what waits for a visible window.
  if (
    typeof document !== 'undefined' &&
    document.hidden
  ) {
    return;
  }
  if (card && typeof card.matches === 'function' && card.matches(':hover')) {
    // eslint-disable-next-line no-unused-expressions
    host.offsetWidth; // reflow: the removal commits before the re-add
    host.dataset.gdShineAt = String(Date.now());
    host.classList.add('is-live');
  }
};

// Memoized: re-renders only when its own data actually changes — scrolling,
// panel open/close and unrelated edits never touch the other 200 cards.
const CharacterCard = memo(
  function CharacterCard({
    character,
    tagsById,
    imagesPath,
    tagScale,
    tagPosition,
    tagLimit = MAX_RIBBONS,
    tagSeparation = TAG_SEPARATION_RANGE.default,
    defaultRatio,
    cardWidth,
    spotDim,
    spotStamps,
    stampLibrary,
    // 1.0.9 — THE SELECTED STATE ("add feedback to the card selected, like
    // have some effect or something on it to show that its selected"):
    // true while this card's character is the one open in the detail panel.
    // The card wears the accent ring (index.css); a plain boolean, so the
    // memo only re-renders the two cards a selection swap actually touches.
    // 1.1.0 — THE OPEN TAB IS RETIRED ("remove the open label at the top right
    // of the card, the outline should be enough"): the ring alone speaks the
    // state now — the little accent tag on the art is gone (it covered the
    // sleeve's top-right corner and read as a second voice saying the same
    // thing the outline already says).
    selected = false,
    onOpen,
    onDelete,
    dropSide, // 'left' | 'right' | null
    onCardDragStart,
    onCardDragOver,
    /* 1.6.2 — the pointer's true exit from this card retires the card's
       own drop hint (see the drop-edge flight note in index.css). */
    onCardDragLeave,
    onCardDrop,
    onCardDragEnd,
  }) {
    const previewVersion = getPreviewVersion(character);
    const coverImage = previewVersion?.images?.[0] || null;
    // 1.3.2 — the cover's seat: the record's LIGHTEST tier, always (the
    // CARD PREVIEW THUMBNAILS switch is retired with the preview system):
    // the PREV when the record owns one (every import builds it now), else
    // the classic thumb-or-file. The record's own fields carry the truth
    // (no IO, no guessing); the image viewer and the detail panel never
    // see prevs — full quality there, always.
    const coverSrc = coverImage?.prev ? coverImage.prev : thumbOf(coverImage);
    const coverUrl = coverImage ? buildImageUrl(imagesPath, coverSrc) : '';
    const ribbons = (character.tags || []).map((tid) => tagsById[tid]).filter(Boolean);
    const scale = Math.min(1.3, Math.max(0.7, cardWidth / 185));
    const ratio = character.cardRatio || defaultRatio;
    // 0.15.0 — the stamp band: the TOP stamp by default; with a stamp
    // spotlight on, the spotlighted stamps (matched by IMAGE — see
    // visibleStampsFor). Always the ORIGINAL file — JPEG thumbs would
    // blacken a transparent logo.
    // 0.22.0 — ONE SET OF SETTINGS PER CARD: hue, position, scale, rotation,
    // transparency and clipping come from character.stampSettings, shared
    // by every stamp (only one is visible at a time anyway).
    // 0.23.0 — THE HUE IS REAL NOW: the card resolves it through the SAME
    // chain the color window shows (custom → library autoColor → live
    // derivation → default) via useStampHue, so the swatch, the slider and
    // the paint can never disagree (the 0.22.0 card read only the library
    // cache and painted NOTHING while the window showed a hue — fake
    // defaults).
    // 0.27.0 — THE SPOTLIGHT SPLIT CUTS THE STAMP, NOT THE CARD. The 0.26.0
    // slicebox clipped fixed fractions of the LAYER (band box / whole art
    // box) — which silently assumed the stamp sits in the middle of the
    // card: move or resize the stamp and the slices missed it entirely
    // ("when i move the stamps around the spotlight feature breaks"). The
    // clip-path now rides the stamp's OWN element — the shrink-wrapped band
    // img (its box hugs the painted glyph) and the placed-sticker wrapper
    // (clip-path applies in the element's local, pre-transform box, so the
    // cut rides along with position / scale / rotation). Two stamps = the
    // LEFT half of the first stamp's art + the RIGHT half of the second's,
    // wherever the stamp sits, at whatever size it wears. The order comes
    // from visibleStampsFor: the card's TOP stamp takes the leftmost share,
    // the rest follow in stack order. The hue wash rides under the whole
    // layer, untouched by the slicing.
    const settings = character.stampSettings || {};
    const placed = !!(settings.pos && Number.isFinite(settings.pos.x) && Number.isFinite(settings.pos.y));
    const cardStamps = visibleStampsFor(character, spotStamps, stampLibrary);
    const splitView = spotStamps.length > 1;
    // 0.38.0 — THE HUE LAYER ORDER: hueOver flips the wash OVER the stamp
    // art (a tint over the logo); the classic order keeps the art on top.
    const hueOver = settings.hueOver === true;
    // 1.3.8 — THE HUE ABOVE THE TRIM: one wash seats above the trims (and
    // the band + confined stickers with them) — the hue's single voice
    // while it is on; the band's and the free layer's own washes stand
    // down (see the gd-hue-over-trim law in index.css).
    const hueOverTrim = settings.hueOverTrim === true;
    // 1.3.8 — THE CARD'S OWN LOOKS (the for-fun pass): the finish + its
    // AFFECTS IMAGE switch paint through the shared layer. Junk falls to
    // the default so a legacy card reads exactly as it always did.
    // 1.3.9 — the secondary color and the pattern left with the feature
    // ("remove secondary color and pattern option"); the card speaks the
    // finish alone.
    // 1.4.0 — the legacy seats migrate here too (the sanitize law in
    // constants — a saved chromatic/polychrome card keeps a living coat on
    // every surface, even before a save re-writes it; 1.4.3 walks both onto
    // opalescent).
    const cardFinish = isCardFinish(character.cardFinish)
      ? migrateCardFinish(character.cardFinish)
      : DEFAULT_CARD_FINISH;
    const cardFinishOnImage = character.cardFinishOnImage === true;
    /* 1.9.6 — THE SPLIT VOLUME ("add a checkbox that adds another
       transparency slider, but this slider affects the transparency of teh
       finishes on the image itself"): the card's own split flag, one
       voice with the windows' checkbox (the scope class + the pair
       rendering below speak it; the image effect must hold too — the
       split only ever has something to split while the coat covers the
       art). */
    const cardFinishSplitImage = character.cardFinishSplitImage === true && cardFinishOnImage;
    // 1.4.5 — THE COAT'S REACH ("add trim effect ... which will make the
    // finish apply above the trim"): the switch rides the card object with
    // the family; the root's scope classes + the ladder law in index.css
    // speak it. 1.7.2 — THE STAMP REACH IS RETIRED ("delete the stamp effect
    // option"): cardFinishOnStamp no longer arms anything — the saved field
    // stays on the card data (inert), and the stamps' seat is spoken by the
    // image effect scope alone.
    const cardFinishOnTrim = character.cardFinishOnTrim === true;
    // 1.6.2 — THE HUE'S OWN SEAT WHILE THE COAT RIDES OVER THE TRIM ("trim
    // effect options should only affect the finish above the trim, not
    // make the trim itself get affected by the hue"): while the trim effect
    // lifts the coat to the over-trim rung, the ladder ALSO raises the
    // stamp band (and the confined free layer) to z 5 so the uncoated
    // stamps stay visible over the lifted coat — and the hue wash riding
    // INSIDE those containers went up with them, smearing the trim ring
    // with tint the moment trim effect came on, though the hue's own
    // over-trim switch never moved. While the coat rides (and the hue's
    // over-trim voice is off), the band's + free layer's washes STAND DOWN
    // and ONE wash seats at the band's own classic ground — z 2, under the
    // trims, exactly where it always sat — so the trim effect moves ONE
    // thing and one thing only: the finish.
    const coatOverTrim = cardFinish !== 'none' && cardFinishOnTrim;
    // 1.7.4 — THE FINISH'S OWN GROUND ("finishes should affect cards even if
    // the cards are on default theme color"): the coat's materials are
    // blend-mode shaders — over the theme's mid-gray panel a soft-light or
    // overlay veil is a near no-op, so an uncolored card wearing even the
    // loudest finish read as the plain theme with a shimmer of dust on it.
    // A card that speaks no color of its own now borrows the FINISH'S ground
    // (FINISH_GROUND in TagRibbon — one receptive plate per material) and
    // every colored-card law follows it: the foot plate paints it, the
    // printing reads the ink it earns, the rim derives from that ink, and
    // --gd-card-tint feeds the nuri lean the ground it actually burns on.
    // The coat keeps its own switches untouched — the ground only ever
    // arrives when the card itself is colorless; a picked cardColor keeps
    // every word it always spoke.
    const finishGround =
      cardFinish !== 'none' && !character.cardColor ? FINISH_GROUND[cardFinish] || null : null;
    // 1.4.5 — THE FINISH'S OWN TEXT RIM ("when a finish is applied, ensure
    // that the text (alongside the version counter and date and name)
    // should have an outline that is opposite to the text's current
    // color"): the plate-colored seat computes its rim from the ink it
    // actually paints; the themed seat falls to the theme's own counter
    // token (theme.js writes it from the theme's panel text). The var
    // rides the card root; .gd-has-finish paints it (see index.css).
    // 1.7.4 — the finish's own ground earns its rim the same way a picked
    // color always has (the ground IS the plate the coat now paints).
    // 1.9.2 — THE GROUND LISTENS TO THE CLOTH (see FINISH_GROUND in
    // TagRibbon): the ground is a color-mix over the theme's own panel
    // now, not a hex readableInk could read — the ink/rim seats fall to
    // the theme's own tokens, the same voice the uncoated themed card
    // always spoke.
    const plateInk = character.cardColor ? readableInk(character.cardColor) : null;
    const finRim = plateInk
      ? counterRimFor(plateInk) || 'var(--gd-text-counter)'
      : 'var(--gd-text-counter)';
    // 1.4.1 — IMAGE MOTION ("add an option next to the affect the image to
    // have image motion which will make the image sway up and down (if the
    // image is barley fit in the card, zoom slightly in enough to fit the
    // sway motion) the sway should be slow too"): the card's own switch —
    // the scope class on the root arms the sway + the safety zoom (see
    // .gd-img-motion in index.css).
    const cardImageMotion = character.cardImageMotion === true;
    // 1.4.7 — STAMP MOTION ("add stamp motion too, which when checked will
    // move the stamp alongside the image with a slight delay"): the card's
    // own switch — the scope class on the root arms the band + sticker
    // sway (see .gd-stamp-motion in index.css), and it only speaks while
    // the image itself is moving (the stamp follows the picture, never a
    // solo).
    const cardStampMotion = character.cardImageMotion === true && character.cardStampMotion === true;
    // 1.4.7 — THE GAP LAW'S STATIC MARK ("it only does [the zoom] if it
    // detects that there is no gab for motion vertically"): a stored crop
    // whose height fraction sits at 0.97 or below already overdraws the
    // clip by the sway's whole reach — the img carries data-motion-slack
    // and the motion law's safety zoom stands down (see .gd-img-motion in
    // index.css). The plain cover seat (no crop) measures its natural
    // aspect on load instead — onLoad writes the same mark for a source
    // ≥3% taller than the card's own ratio.
    const cropSlack =
      character.cardCrop && Number(character.cardCrop.h) > 0 && Number(character.cardCrop.h) <= 0.97
        ? { 'data-motion-slack': 'crop' }
        : null;
    // 1.4.0 — the per-card shader phase (see finishPhase in TagRibbon): no
    // two cards animate in lockstep or tile in phase.
    const finPhase = finishPhase(character.id);
    // 1.4.0 — the art zone's height, known from the card's own geometry
    // (the sleeve's aspect box at the card's width — no measuring): the
    // coat's plate-only mask cuts exactly at the notch line above the seam.
    // 1.4.3 — THE INK BORDER LEAVES THE MATH ("the finishes seem to be
    // missing at the top of the card's name area, as if they end before it
    // unless i specifically turn on affect image, fix that so anything
    // below the image/trims is affected by the effect"): the sleeve is an
    // absolutely-positioned aspect box INSIDE the root's 2px ink border,
    // so its true width is the card's width MINUS both borders. The old
    // finArtH (cardWidth × ratio) overstated the art's height by
    // 4×ratio.h/ratio.w (~5px at 3:4), seating the plate-only mask's cut
    // that far INTO the name area — the plate's top sliver wore no coat
    // while IMAGE EFFECT was off. The border leaves the math: the cut
    // lands on the notch line exactly, and everything below the image/
    // trims wears the material.
    const finArtH = Math.max(0, cardWidth - 4) * (ratio.h / ratio.w);
    // 1.3.8 — THE SEAMLESS GATE: on an extreme plate (near-black /
    // near-white) the LINE-family trims' seam-side rule goes silent (see
    // isExtremePlateHex + the .is-seamless law in index.css).
    const seamless = !!character.cardColor && isExtremePlateHex(character.cardColor);
    // 0.27.0 — the split no longer parks the personal layout: band stamps
    // stay band stamps (sliced), placed stamps stay placed stickers
    // (sliced the same way).
    const bandStamps = placed ? [] : cardStamps;
    const freeStamps = placed ? cardStamps : [];
    // The vertical cut for spotlight stamp i of n: keep [i/n, (i+1)/n] of
    // the STAMP'S OWN BOX and hide the rest (applied to the shrink-wrapped
    // band img / the placed wrapper — see the 0.27.0 note above). (2dp
    // rounding keeps the CSS readable — inset(0 50% 0 0%) for the left
    // half of a two-stamp split.)
    const sliceStyle = splitView
      ? (i, n) => {
          const l = Math.round((i / n) * 10000) / 100;
          const r = Math.round(((n - 1 - i) / n) * 10000) / 100;
          return { clipPath: `inset(0 ${r}% 0 ${l}%)` };
        }
      : () => undefined;
    const topStampUrl = cardStamps.length ? buildImageUrl(imagesPath, cardStamps[0].image) : null;
    const topLibAuto = cardStamps.length
      ? stampImageIndex(stampLibrary).get(cardStamps[0].image)?.autoColor || null
      : null;
    const resolvedHue = useStampHue(settings, topStampUrl, topLibAuto);
    // 1.4.5 — THE HUE SPEAKS WITHOUT A STAMP ("make it so hue can be applied
    // even without a stamp, thats the main reason we even made it so the
    // stamp options is greyed out, since hue shouldnt rely on it"): with a
    // stamp the wash speaks the shared resolution (custom, else the silent
    // white default — the hue of the stamp); with NO stamp it speaks only
    // what the user actually picked — an untouched card stays clean, a
    // drafted hue paints the moment it is chosen.
    const hue = cardStamps.length ? resolvedHue : customStampHue(settings);
    const artAlpha = stampAlpha(settings);
    const hueAlpha = stampHueAlpha(settings);

    // 0.46.0 — THE BADGE FADES WHERE IT SAT ("when i let go of hover over the
    // card, the version count snaps to the bottom, fix that so you let it
    // fade as the rest of the name appears gradually like before"): the
    // resting badge is absolute (top/right seat) and hovering seats it in
    // flow beside the name — releasing used to flip `position` back
    // instantly, teleporting the badge to the resting seat mid-fade. The
    // mini-FLIP below pins it ABSOLUTELY at its in-flow seat for the
    // length of the fade: the name re-expands underneath it and shows
    // through as the badge dissolves — the crossfade the old foot had.
    // The seat is CACHED AT ENTRY (and refreshed whenever the pointer
    // moves while the badge is still in flow): by the time mouseleave's
    // handler runs, the browser has already re-run its hover hit-test, so
    // a live measurement there reads the ALREADY-FLIPPED resting seat.
    const footRef = useRef(null);
    const versRef = useRef(null);
    const versHoldRef = useRef(0);
    const versSeatRef = useRef(null);
    // 1.4.0 — THE PRESS PULSE'S OWN ELEMENT (see the pointerdown note at the
    // root): one squash-and-settle transform flight per press, restarted by
    // an attribute flip + forced reflow, retired by its own animationend —
    // no state, no re-render, nothing for the memo to notice.
    // 1.4.1 — THE FLIGHT RIDES THE CARD ROOT ITSELF (see .gd-card-pulse in
    // index.css): the whole card — border, paper, art and name plate —
    // breathes as one object, so no paper ever shows through around the
    // squished content. The 1.4.0 wrapper is retired.
    // 1.4.7 — THE ARMED SEAT IS A DATA ATTRIBUTE (see the 1.4.7 note at
    // .gd-card-pulse in index.css): the press that opens the panel is the
    // same press that SELECTS the card, and the selection commit re-renders
    // the card with a new className string — React's className write used
    // to wipe the hand-added .is-pressed class and kill the flight exactly
    // as the panel opened. [data-pressed] is an attribute React never
    // owns: the flight rides straight through every re-render, and the
    // squish plays in full beside the opening panel.
    // 1.4.7 — THE PRESS SPEAKS ITS BUTTONS: only the LEFT and RIGHT buttons
    // arm the flight (the middle button never speaks it).
    // 1.4.8 — THE JELLY NEVER DIES MID-FLIGHT ("when i click drag, hold
    // drag etc, the squish/stretch of the card gets interrupted midway,
    // fix that so it doesnt get interrupted"): the 1.4.7 gates also RETIRED
    // the flight mid-run — a held press traveling past 5px, or the native
    // drag engaging, stripped [data-pressed] on the spot and the card
    // snapped home exactly at the squish's loudest beat (the interruption
    // the report caught). The mid-flight kills are GONE: once armed, the
    // 620ms flight always plays to its own animationend — click, hold,
    // drag or carry, the jelly finishes its breath. (The arm itself still
    // speaks only the two true press buttons — a middle-click never starts
    // one.)
    // 1.4.8 — the mid-flight kills are gone; the arm helper stays for the
    // button gate (left + right only — the middle button never speaks
    // the jelly).
    const pulseRef = useRef(null);
    // 1.5.0 — THE FLIGHT'S OWN CLOCK (the "sometimes the card i edited
    // last session doesn't play its squish when i click it" report): the
    // arm is a remove-reflow-readd handoff, and a re-press that lands a
    // hair after a prior flight's own end can arrive BEFORE that flight's
    // queued animationend is delivered — the stale event then strips the
    // FRESH [data-pressed] attribute through the handler below and the
    // new flight dies on its first frame (no squish at all, exactly the
    // intermittent "double-hover-feeling" miss the report caught — the
    // second click on the card the panel already showed). The clock the
    // handler reads closes the door: an animationend arriving within the
    // flight's own 620ms window CANNOT belong to the flight that is
    // still running — it is stale by construction, and it is ignored.
    const pulseAtRef = useRef(0);
    // 1.9.12 — THE PRESS DIAL'S OWN GATE (see the press dial rule in
    // index.css): the flight speaks only the two true voices — App arms
    // html[data-gd-press-mode] for 'squish' / 'pulse' and retires it for
    // 'none' — so the arm itself reads the same dial and stands down when
    // no flight will ever play. Without this gate the attribute would arm
    // under 'none' with no animation to retire it: [data-pressed] would
    // linger forever, holding the ribbons' flight-only shadow seat (the
    // 1.4.9 held-shadow law) on a card that never flew. The read is one
    // attribute lookup on the press's own road — the same lane the CSS
    // reads, one law, both seats.
    const pressMode = () => {
      const mode =
        typeof document !== 'undefined' && document.documentElement
          ? document.documentElement.getAttribute('data-gd-press-mode')
          : null;
      return mode === 'squish' || mode === 'pulse' ? mode : 'none';
    };
    const firePulse = (e) => {
      // the keyboard path calls with no event — the arm speaks there too.
      if (e && typeof e.button === 'number' && e.button !== 0 && e.button !== 2) return;
      if (pressMode() === 'none') return; // the dial's silence is the arm's own
      const el = pulseRef.current;
      if (!el || typeof el.setAttribute !== 'function') return;
      el.removeAttribute('data-pressed');
      // restart the flight even mid-press
      void el.offsetWidth;
      el.setAttribute('data-pressed', '1');
      pulseAtRef.current = Date.now();
    };
    // 1.1.4 — THE HOVER LAW IS STONE-STILL ("when hovering over a card, the
    // date gets pushed down and the name gets pushed up, fix that so they
    // dont move" + "do show the 3 dots before clipping the text"): the
    // 1.1.0 unfold plate — and the 1.1.2 crop measure that mounted it for
    // EVERY versioned card (scrollWidth is clamped to clientWidth, so the
    // badge-seat subtraction always read "cropped") — is RETIRED. The
    // hover no longer expands the name over the foot: the title stays ONE
    // cropped line, the truncate's "..." shows wherever the clip lands
    // (mid-word or right after a space — "it doesnt clip the text after a
    // space" was the plate WRAPPING at spaces instead of clipping), and
    // the badge fades in beside the name in a cell whose height is PINNED
    // to the title's own line box (CSS below) — so row one never grows,
    // the name never moves and the date never moves. The full name still
    // speaks through the card's tooltip and the detail panel.
    const clearVersHold = () => {
      if (versHoldRef.current) {
        clearTimeout(versHoldRef.current);
        versHoldRef.current = 0;
      }
      const vers = versRef.current;
      if (vers) {
        vers.classList.remove('gd-vers-hold');
        vers.style.left = '';
        vers.style.top = '';
      }
    };
    const cacheVersSeat = () => {
      const foot = footRef.current;
      const vers = versRef.current;
      if (!foot || !vers) return;
      // only a seated (in-flow) badge has a seat worth caching
      if (getComputedStyle(vers).position !== 'static') return;
      const fr = foot.getBoundingClientRect();
      const vr = vers.getBoundingClientRect();
      if (!fr.width || !vr.width) return;
      versSeatRef.current = {
        left: Math.round((vr.left - fr.left) * 10) / 10,
        top: Math.round((vr.top - fr.top) * 10) / 10,
      };
    };
    const holdVersOnRelease = () => {
      const foot = footRef.current;
      const vers = versRef.current;
      if (!foot || !vers || vers.classList.contains('gd-vers-hold')) return;
      // prefer a LIVE reading while the badge is still in flow; fall back
      // to the entry-cached seat (mouseleave can land after the style flip)
      let seat = null;
      if (getComputedStyle(vers).position === 'static') {
        const fr = foot.getBoundingClientRect();
        const vr = vers.getBoundingClientRect();
        if (fr.width && vr.width) {
          seat = { left: Math.round((vr.left - fr.left) * 10) / 10, top: Math.round((vr.top - fr.top) * 10) / 10 };
        }
      }
      if (!seat) seat = versSeatRef.current;
      if (!seat) return;
      vers.style.left = `${seat.left}px`;
      vers.style.top = `${seat.top}px`;
      vers.classList.add('gd-vers-hold');
      if (versHoldRef.current) clearTimeout(versHoldRef.current);
      // the hold lasts exactly the fade (+ a hair); returning to the card
      // clears it and the badge re-seats in flow at the SAME spot, so the
      // fade simply reverses.
      versHoldRef.current = setTimeout(clearVersHold, 200);
    };
    useEffect(
      () => () => {
        if (versHoldRef.current) clearTimeout(versHoldRef.current);
      },
      []
    );

    return (
      <div
        data-gd-char-id={character.id}
        ref={pulseRef}
        className={clsx(
          'gd-card gd-card-collector gd-card-hover gd-card-pulse relative group cursor-pointer select-none',
          spotDim && 'gd-card-dim',
          selected && 'gd-card-selected',
          // 1.4.3 — POLYCHROME'S TEXT + BORDER SCOPE IS RETIRED WITH THE
          // COAT ("remove polychrome, replace it with Opalescent"): the
          // pearl is a milky translucent veil — the card's own printing
          // keeps its voice (see the retirement note in index.css).
          // 1.4.1 — IMAGE MOTION ("add an option next to the affect the
          // image to have image motion which will make the image sway up
          // and down"): the scope class the sway law reads (see
          // .gd-img-motion in index.css) — the art sways on its own slow
          // clock, zoomed just enough that the sway never exposes the
          // clip's edges.
          cardImageMotion && 'gd-img-motion',
          // 1.4.7 — STAMP MOTION ("add stamp motion too, which when checked
          // will move the stamp alongside the image with a slight
          // delay"): the band + the placed stickers follow the image's
          // sway a beat behind it (see .gd-stamp-motion in index.css) —
          // armed only while the image itself is swaying.
          cardStampMotion && 'gd-stamp-motion',
          // 1.4.5 — THE COAT'S OWN SCOPE CLASSES: the RIM LAW's seat
          // (.gd-has-finish paints the opposite-ink outline on the name /
          // date / badge) + the reach switches (.gd-fin-on-trim lifts the
          // coat over the trim ring; see the ladder law in index.css).
          // 1.7.2 — THE STAMP EFFECT IS RETIRED ("delete the stamp effect
          // option"): .gd-fin-on-stamp is never armed again — the stamps
          // keep the seat they speak at rest under every switch state, and
          // the only law that ever covers them is the image effect's own
          // full-face promise (.gd-fin-on-image below).
          cardFinish !== 'none' && 'gd-has-finish',
          cardFinish !== 'none' && cardFinishOnTrim && 'gd-fin-on-trim',
          /* 1.7.2 — THE FULL-FACE COAT'S OWN SCOPE ("stamp will not react
             differently to it, just that it will be covered alongside
             the image in image effect option"): armed exactly while the
             coat covers the whole face, and the CSS ladder seats the
             stamp band + the confined stickers UNDER it (z 1, the art's
             own rung — the picture's law, now the stamps' too). With
             IMAGE EFFECT off the scope is gone and the stamps keep every
             ground they hold — above the veiled coat, above the lifted
             trim ring. */
          cardFinish !== 'none' && cardFinishOnImage && 'gd-fin-on-image',
          /* 1.4.8 — THE UNDER-ART SCOPE (the "image covers it" law — see
             .gd-fin-under-art in index.css): armed exactly while a coat is
             worn veiled (a finish + IMAGE EFFECT off + an image to
             protect), it drops the masked coat to the art's own rung so
             the image covers the coat's seam-side overdraw — the corner
             notch law keeps its voice, the picture keeps its raw bottom. */
          cardFinish !== 'none' && !cardFinishOnImage && !!coverUrl && 'gd-fin-under-art',
          /* 1.9.3 — THE EXTREME GROUNDS (finishGroundTone in TagRibbon): the
             picked card color's own tone classes the coat's blend seats — a
             near-white / near-black / vivid plate never swallows the coat
             again ("the finishes would dissapear or would be covered"). One
             voice with the look editor and the compact preview. */
          finishGroundTone(character.cardColor),
          /* 1.9.6 — THE SPLIT VOLUME'S OWN SCOPE: armed exactly while the
             card's checkbox holds — the art seats read the image knob
             (see .gd-fin-split in index.css), the plate + trim keep the
             main one. */
          character.cardFinishSplitImage && character.cardFinishOnImage && 'gd-fin-split'
        )}
        style={{
          width: '100%',
          ['--card-scale']: scale,
          /* 1.3.7 — THE CARD'S OWN CORNER PLATES ARE RETIRED (see the
             retirement note at .gd-card-collector in index.css): the
             1.3.6 --gd-corner-fill write left with the law — the card's
             outer corners belong to the ink trim and the paper again, and
             the seam's own fill (the foot's --gd-foot-plate below) is the
             one law that stays. */
          /* 1.4.5 — the rim var the outline law reads (light ink → dark rim,
             dark ink → light rim; the themed seat speaks the theme's own
             counter token). */
          ...(cardFinish !== 'none' ? { ['--gd-fin-ink-outline']: finRim } : null),
          /* 1.4.7 — THE MOTION FAMILY'S ROOT VARS: --gd-fin-ph seats the
             sway's per-card phase (the same hash the coat seats read —
             the documented "no two cards animate in lockstep" law reaches
             the motion family at last), and --gd-sway seats the STAMP
             motion's absolute reach: the art's height over the crop's
             own vertical fraction (a zoomed crop's taller frame sways
             farther — the stamp tracks the image's true travel, not a
             guess; see .gd-stamp-motion in index.css). */
          ['--gd-fin-ph']: finPhase,
          ['--gd-sway']: `${(finArtH * 0.015 / (character.cardCrop && character.cardCrop.h > 0 ? character.cardCrop.h : 1)).toFixed(2)}px`,
          /* 1.4.8 — THE CARD'S OWN COLOR as a var the finishes read (the
             nuri lean law — see .gd-finish-nuri::before in index.css): the
             plate's hex when the card speaks one, the theme's panel when
             it does not — the forge leans toward whatever ground it
             burns on.
             1.7.4 — THE FINISH'S OWN GROUND completes the sentence: a
             colorless card wearing a finish leans on the finish's ground
             (see finishGround's note above), so the lean, the washes and
             the plate all speak one family — and the card's own paper
             paints the same ground (an empty card reads as the material,
             never as the theme peeking through the coat). */
          ['--gd-card-tint']: character.cardColor || finishGround || 'var(--gd-panel)',
          /* 1.9.5 — THE COAT'S OWN VOLUME: the shipped card paints the
             coat at the knob's own strength (the transparency the card
             carries — see finishStrength in TagRibbon; a card saved
             before the knob keeps the softened default).
             1.9.6 — the split volume rides beside it (the image knob's
             own var, written always — the scope alone decides who reads
             it). 1.9.9 — the coat's color word rides with it (see
             finishTintLean in TagRibbon: every coat seat reads the lean
             through --gd-tint-hand — hue + saturation alone, the fixed
             0.45 luma seat). */
          ['--gd-fin-strength']: finishStrength(character.cardFinishTransparency),
          ['--gd-fin-strength-art']: finishStrength(character.cardFinishImageTransparency),
          ...(character.cardColor
          ? {
              ['--gd-fin-ink']: finishTintLean(character.cardColor),
              ['--gd-fin-glow']: finishTintLean(character.cardColor, 0.78),
              ['--gd-fin-art']: finishTintLean(character.cardColor, 0.75),
            }
          : null), /* 1.9.9 — the lean + its glow + art seats (finishTintLean);
             1.9.10 — THE CLASSIC COAT RETURNS: these feed the numeix X
             signature's ink alone now (every other coat seat speaks its
             classic 1.9.2 fixed colors — see index.css). */
          ...(finishGround ? { backgroundColor: finishGround } : null),
        }}
        role="button"
        tabIndex={0}
        onClick={() => onOpen()}
        /* 1.4.0 — THE PRESS PULSE ("make the card pulse/stretch slightly
           when pressed, both when opening or closing"): the wrapper below
           plays one squash-and-settle flight on every press — the SAME
           press that opens a resting card and the one that closes an
           expanded one (the toggle rides one handler). It is a pure
           transform on a visual wrapper: no size ever changes, no
           neighbor ever reflows.
           1.4.7 — LEFT + RIGHT ONLY ("squish/stretch animation should only
           play when left click or right click, but not when i hold and
           drag"): the arm is gated to the two true press buttons at the
           pointer's own down event.
           1.4.8 — AND NEVER INTERRUPTED ("when i click drag, hold drag
           etc, the squish/stretch of the card gets interrupted midway,
           fix that"): once armed the flight plays to its own end — the
           drag gates that used to kill it mid-run are retired (see the
           note at firePulse above). */
        onPointerDown={(e) => {
          firePulse(e);
        }}
        /* 1.4.1 — the flight's own retirement: the root retires its
           data-pressed attribute on the pulse animation's own end (the
           1.4.0 wrapper's law, carried to its new seat — and to the
           1.4.7 attribute that survives every re-render). */
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget && (e.animationName === 'gd-press-pulse' || e.animationName === 'gd-press-bloom')) {
            // 1.5.0 — the stale-flight guard (see firePulse's clock note):
            // an end arriving inside the flight's own window belongs
            // to a PRIOR flight whose event was queued before the re-press —
            // it must not retire the fresh one. (1.9.12 — the window speaks
            // the LONGEST flight: the jelly's 620ms; the bloom retires at
            // 380ms and a bloom end arriving 400ms after a re-pressed jelly
            // is stale by the same clock.)
            if (Date.now() - pulseAtRef.current < 600) return;
            e.currentTarget.removeAttribute('data-pressed');
          }
        }}
        onMouseEnter={() => {
          clearVersHold();
          cacheVersSeat();
        }}
        onMouseMove={cacheVersSeat}
        onMouseLeave={holdVersOnRelease}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            firePulse();
            onOpen();
          }
        }}
        title={`Open ${stripRichText(character.name)}`}
        draggable
        onDragStart={(e) => {
          // 1.4.8 — the carry no longer retires the jelly (the 1.4.8
          // never-interrupted law at firePulse): the flight plays its
          // full 620ms beside the drag ghost — a press is a press.
          onCardDragStart(e, character.id);
        }}
        onDragOver={(e) => onCardDragOver(e, character.id)}
        /* 1.6.2 — THE HINT LEAVES WITH THE POINTER (the disappear half of
           the drop-edge's own flight): leaving a card mid-drag used to
           strand its hint lit — the indicator kept painting on the last
           hovered card while the pointer wandered the empty grid, and only
           the drop (or the drag's end) ever retired it. The card now clears
           its OWN hint as the pointer crosses out (children don't count —
           only a true exit), so the highlight fades out under the 0.15s
           flight exactly where it arrived. */
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget)) return;
          /* 1.6.7 — the event rides along: leaveCard's stillness guard
             reads its coordinates (a layout-shift echo leaves at the same
             seat the last dragover spoke — the hint keeps its glow; see
             the leaveCard note in the board's own seat). */
          onCardDragLeave(e, character.id);
        }}
        onDrop={(e) => onCardDrop(e, character.id)}
        onDragEnd={onCardDragEnd}
      >
        {/* 1.4.5 — THE COAT SPEAKS FIRST IN THE DOM (the ladder law in
            index.css): at its equal rung (z 2) the later stamp seats win
            by DOM order, so the coat can never cover what its switches
            say it must not — and the .gd-fin-on-trim scope lifts the whole
            family onto the over-trim rung (z 4) when the switch is on.
            The phase keeps every card's shader out of lockstep, and the
            plate-only mask cuts at the notch line exactly (the 1.4.3
            border-aware artH below). */}
        <CardFinishLayer
          finish={cardFinish}
          onImage={cardFinishOnImage}
          onTrim={cardFinishOnTrim}
          artH={finArtH}
          hasImage={!!coverUrl}
          phase={finPhase}
          splitArt={cardFinishSplitImage}
        />
        {/* 1.4.1 — THE PULSE WRAPPER IS RETIRED (see the root's own note
            above): the flight rides the card root itself — the whole card
            is the pulsing object, border and all. */}
        {/* Tag ribbons — pinned ON TOP of the card's image ('corner' mode,
            0.8.0) or hanging INTO the card from its top edge like bookmarks
            slipped in ('mark' mode, 0.11.0 mirror: small head above, body
            grows down the art as the tag size rises); as many as the TOP TAGS
            setting says (0.47.0: 1–8, was hard-coded 3), seated with the
            SEPARATION setting — clamped so the row never leaves the card. */}
        {ribbons.length > 0 && (
          <div
            className="gd-card-ribbons absolute left-2 flex pointer-events-none"
            data-tag-pos={tagPosition}
            style={{ top: ribbonTopOffset(tagScale, tagPosition), zIndex: 5 }}
          >
            {ribbons.slice(0, Math.max(1, tagLimit)).map((tag, i) => (
              <TagRibbon
                key={tag.id}
                tag={tag}
                scale={tagScale}
                style={{
                  zIndex: Math.max(1, tagLimit) - i,
                  marginLeft: i === 0 ? 0 : clampSeparation(tagSeparation, Math.min(ribbons.length, Math.max(1, tagLimit)), tagScale, cardWidth),
                }}
              />
            ))}
          </div>
        )}

        {/* 0.10.0 — drag-over feedback covers the WHOLE card (image + label),
            painted as an overlay instead of the old root box-shadow that hid
            behind the sleeve and only lit the bottom label.
            1.6.2 — THE HINT STAYS MOUNTED AND SPEAKS ITS OWN FLIGHT (the
            appear/disappear law — see .gd-drop-edge in index.css): the span
            renders UNCONDITIONALLY now, seated at rest (opacity 0) until its
            side arrives; the classes carry it in from the drop side and walk
            it back out on departure, so the hint never blinks with the
            drag's steps — and the leaving card below can retire it under the
            same breath. */}
        <span
          className={clsx(
            'gd-drop-edge',
            dropSide === 'left' && 'is-left',
            dropSide === 'right' && 'is-right',
            dropSide && 'is-on'
          )}
          aria-hidden
        />

        <div
          className="relative gd-sleeve"
          style={{
            aspectRatio: `${ratio.w} / ${ratio.h}`,
            /* 1.4.0 — THE SLEEVE'S OWN PAPER MOVED INTO THE CLIP (see the
               z-ladder note at .gd-sleeve in index.css): the sleeve no
               longer owns a stacking context (z auto), so a background
               painted here would land UNDER the foot's rise at z 0; the
               clip carries it at z 1 — above the rise, under the coat,
               exactly where the art's paper always sat. */
            // 0.20.0 — collector cards round their TOP only: the bottom
            // details (foot) sit flush in a square base instead of the odd
            // rounded-under structure.
            // 1.3.1 — THE ART'S OWN BOTTOM CURVE ("the bottom corners of the
            // IMAGE container, NOT the card itself, should fill in with the
            // card color"): the art's bottom corners now round with the
            // theme's own radius too — the notch the curve carves is filled
            // by the foot plate's rise (see .gd-card-foot::before in
            // index.css), so the seam between the art and the name plate
            // speaks the theme's curve language instead of the one straight
            // hard cut. Square styles clamp to ~0px: nothing changes there.
            borderRadius:
              'calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px)',
          }}
        >
          {/* 0.17.0 — the art (and ONLY the art) lives inside the clip
              wrapper: the trims + stamp layers sit beside it so a
              POSITIONED stamp can hang past the sleeve and the card's
              border like a sticker. */}
          <div
            className="gd-sleeve-clip"
            /* 1.4.5 — THE ART SEAT SPEAKS THE DEEP GROUND (the white-line
               report: "the white line/border around the image thumbnail
               seems to only appear when the squish/stretch animation of
               card clicking"): the old seat washed the ink at 10% into the
               PANEL — a near-white paper on every dark theme, and any
               fractional raster edge of the art (a crop frame's percentage
               rounding, a non-integer clip width under the squish's
               re-raster) let that paper bleed a hairline ring around the
               image exactly while the card breathed. The seat speaks the
               ink-over-BG mix now — a shadow-toned paper that can never
               read as a white line under any theme. */
            style={{ background: 'color-mix(in srgb, var(--gd-ink) 30%, var(--gd-bg))' }}
          >
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={stripRichText(character.name)}
                loading="lazy"
                decoding="async"
                draggable={false}
                // 0.48.0 — THE EXACT CROP FRAME (cropFrame in TagRibbon):
                // object-position could only pan the cover-scaled picture,
                // so a zoomed crop saved from the creation window rendered
                // as a bare pan here. The frame paints the stored crop
                // literally — the grid card finally zooms with its crop. The
                // stored crop is aspect-locked to the card's ratio at save
                // time, so the frame needs no aspect of its own; a card with
                // no crop keeps the plain cover fill.
                // 1.4.7 — THE GAP LAW ("it only does [the zoom] if it
                // detects that there is no gab for motion vertically"): a
                // cropped frame whose h ≤ 0.97 already overdraws the clip by
                // the sway's whole reach — data-motion-slack stands the
                // safety zoom down (see .gd-img-motion in index.css); the
                // plain cover fill measures its natural aspect on load and
                // writes the same mark for a source ≥3% taller than the
                // card's own ratio (the CSS seats that source into an
                // oversized centered frame, so the sway stays inside the
                // source's own overflow — no zoom, no exposed edge).
                className={clsx('object-cover', !character.cardCrop && 'w-full h-full')}
                style={character.cardCrop ? cropFrame(character.cardCrop) : undefined}
                {...cropSlack}
                onLoad={(e) => {
                  if (character.cardCrop) return;
                  const img = e.currentTarget;
                  const nw = img.naturalWidth;
                  const nh = img.naturalHeight;
                  if (!nw || !nh) return;
                  const cardA = ratio.w > 0 && ratio.h > 0 ? ratio.w / ratio.h : 1;
                  if (nw / nh <= cardA * 0.97) img.setAttribute('data-motion-slack', 'tall');
                }}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <span className="font-bold" style={{ color: 'color-mix(in srgb, var(--gd-ink) 30%, transparent)', fontSize: `${28 * scale}px` }}>
                  ✖
                </span>
                <span className="tracking-[0.25em] uppercase" style={{ color: 'color-mix(in srgb, var(--gd-ink) 45%, transparent)', fontSize: `${9 * scale}px` }}>
                  No image
                </span>
              </div>
            )}
          </div>
          {/* 1.3.2 — THE DECO CLIP ("extend that color to cover the bottom two
              corners of the image when its in rounded theme, so it doesnt
              look weird when the trims are rounded but the image isnt"): the
              trims and the classic stamp band paint INSIDE the art's
              territory, but they used to ride BESIDE the clip wrapper —
              past the sleeve's rounded bottom corners and straight over
              the foot plate's card-color fill (measured live: the hue
              wash and the trim's frame lines painted the whole corner
              notch light, reading as square un-rounded art on an
              otherwise curved card). They ride INSIDE a second clip
              wrapper now — same inset, same inherited radius, same
              overflow law as the art's own — so everything the image area
              paints carves at the sleeve's curve and the plate's rise
              fills the carved corners with the card's color, clean. The
              FREE stamp layer stays outside it: a placed sticker keeps
              its 0.17.0 freedom to hang past the sleeve and the border. */}
          {/* 1.4.5 — THE BAND SPEAKS AT ITS OWN ROOT-LEVEL RUNG ("add option
              to effect stamp too, where finishes would effect the stamp if
              checked"): the classic band rode INSIDE the deco span (the
              trims' own context, z 3) — a stacking cage the coat's STAMP
              EFFECT switch could never reach into, since no child of the
              deco can drop below the coat at z 2. The band is a sibling of
              the deco now (same geometry — the sleeve's own box), carrying
              its own clip (the sleeve's inherited radius + overflow, the
              law the deco always spoke for it) and its own z rung: 2 by
              default (above the DOM-first coat, under the trims — exactly
              the seat it always read as), 2 while the trim effect rides
              too (1.7.3: the trim-effect stamp lift retired — the band
              never paints over the trim's ink, whatever the switches say),
              and 1 under the image effect's full-face
              coat (1.7.2: covered alongside the image). See the ladder
              law in index.css. */}
          {/* 1.7.4 — THE UNDER-STAMP SEAT OF THE COAT-PERIOD WASH ("when
              trim effect is turned on, it shouldnt automatically make the
              hue hover over the stamp"): the wash below used to render as
              ONE span AFTER the band — at the band's own z-2 rung the
              DOM-later sibling painted over the band and its logos in BOTH
              switch states, so the moment the trim effect armed (and the
              band's internal washes stood down for the coat period) the hue
              READ as hovering over the stamp no matter which way HUE OVER
              STAMP pointed — the 1.7.3 modifier only re-spoke the ON half.
              The OFF half now renders BEFORE the band: DOM-earlier at the
              same rung, the wash sits UNDER the logos exactly as the
              classic in-band wash always did, and the trim effect moves the
              finish alone — the hue answers only to its own switch, on or
              off, coat or no coat. */}
          {hue && !hueOver && !hueOverTrim && coatOverTrim && (bandStamps.length > 0 || freeStamps.length > 0) && (
            <span
              className="gd-card-stamp-hue gd-hue-band-own"
              style={{ background: hue, ['--stamp-hue']: hue, ['--stamp-hue-alpha']: hueAlpha }}
              aria-hidden
            />
          )}
          {bandStamps.length > 0 && (
            <span
              className="gd-card-stamp-band"
              style={hue ? { ['--stamp-hue']: hue, ['--stamp-hue-alpha']: hueAlpha } : undefined}
              aria-hidden
            >
              {/* The shared hue layer: ONE wash under the whole band —
                  seamless across the spotlight split; the sliceboxes (and
                  their logos) paint above it. 0.38.0 — HUE OVER STAMP flips
                  the order: the wash paints AFTER the logos and covers them.
                  1.3.8 — the wash STANDS DOWN while hueOverTrim is on (the
                  z-4 wash above the trim is the hue's single voice).
                  1.6.2 — and while the coat rides over the trim
                  (coatOverTrim — the hue's own seat note above): the wash
                  leaves the band for its own z-2 ground so the trim effect
                  can never smear the trim ring with tint.
                  1.7.3 — THE FLIP SPEAKS ITS TRUE SEAT ("the hue over stamp
                  option isnt working in stamp settings"): the two
                  conditional washes below used to ride INVERTED seats —
                  the hueOver wash rendered BEFORE the logos (UNDER them)
                  and the classic wash AFTER them (OVER them), the exact
                  opposite of the switch's promise. The seats are swapped:
                  OFF (classic) paints the wash FIRST — under the logos,
                  the look the app was born with; ON paints it LAST — the
                  tint rides OVER the stamp art, the tooltip's own word. */}
              {hue && !hueOver && !hueOverTrim && !coatOverTrim && (
                <span className="gd-card-stamp-hue" style={{ background: hue }} aria-hidden />
              )}
              {bandStamps.map((s, i) => (
                <span key={s.id} className="gd-card-stamp-slicebox">
                  {/* 0.22.0 — the logo's own opacity is the card's ALPHA
                      setting (0.26.0: the default is 50%). 0.27.0 — in the
                      split view the clip-path rides the IMG itself: the cut
                      is a share of the STAMP'S OWN box (the box hugs the
                      glyph), so the split tracks position/scale instead of
                      assuming the middle of the card. */}
                  <img
                    src={buildImageUrl(imagesPath, s.image)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="gd-card-stamp-img"
                    style={{ opacity: artAlpha, ...sliceStyle(i, bandStamps.length) }}
                  />
                </span>
              ))}
              {hue && hueOver && !hueOverTrim && !coatOverTrim && (
                <span className="gd-card-stamp-hue" style={{ background: hue }} aria-hidden />
              )}
            </span>
          )}
          {/* 1.6.2 — THE HUE'S OWN SEAT (see coatOverTrim's note): while the
              trim effect rides and the hue's over-trim switch is off, ONE
              wash paints at the band's classic ground — the band's own
              geometry, z 2, UNDER the trims — so the stamps may ride over
              the lifted coat without dragging the tint up with them, and
              the trim ring stays exactly as un-washed as it was before the
              switch ever moved.
              1.7.3 — AND THE SEAT HONORS THE LAYER ORDER (the hue over
              stamp report's other half): hueOver threads the
              is-over-stamp modifier — the wash lifts one rung (z 3, over
              the band + its logos, still under the trims) exactly when
              the switch asks the tint to cover the logo.
              1.7.4 — THE OVER-STAMP HALF ALONE rides here (the under-seat
              note above): OFF renders the wash BEFORE the band, ON renders
              it AFTER with the lift — the switch's whole promise, spoken
              in DOM order at last. */}
          {hue && hueOver && !hueOverTrim && coatOverTrim && (bandStamps.length > 0 || freeStamps.length > 0) && (
            <span
              className={clsx('gd-card-stamp-hue gd-hue-band-own', 'is-over-stamp')}
              style={{ background: hue, ['--stamp-hue']: hue, ['--stamp-hue-alpha']: hueAlpha }}
              aria-hidden
            />
          )}
          {/* 1.4.5 — THE STAMPLESS HUE'S OWN SEAT (the band's twin for the
              no-stamp card): the picked hue drafts on the card exactly as
              the color window promised — the classic bottom-half wash,
              faded upward, under the trims. It renders ONLY while there is
              no stamp to carry a wash of its own (band or sticker), and
              only while a hue actually speaks (a picked custom color — see
              the customStampHue law at the hue derivation). */}
          {hue && !hueOverTrim && bandStamps.length === 0 && freeStamps.length === 0 && (
            <span
              className="gd-card-stamp-hue gd-hue-halfcard"
              style={{ background: hue, opacity: hueAlpha }}
              aria-hidden
            />
          )}
          <span className="gd-sleeve-deco" aria-hidden>
            {/* 1.7.6 — THE INK NEVER MOVES ("when activating trim effect,
                the trim changes color, fix that so it doesnt change color"):
                the REAL trim speaks the trim's own ladder at rest now
                (trimCoatInk), one voice with the coat's clone below, so
                arming the trim effect can never re-ink the ring — the arm
                adds the finish's washes alone, never a new color.
                1.7.7 — THE TRIM'S OWN VOICE ("the trim changes colors
                based on card colors now ... trim has its own default color
                related to the THEME, and has its own color setting that it
                should abide by"): the card-color rung is retired — the ring
                speaks the picker's word or the theme's own default, never
                the card's borrowed color. */}
            <TrimOverlay
              trim={character.cardTrim}
              seamless={seamless}
              color={trimCoatInk(character.cardTrim, character.cardTrimColor)}
            />
            {/* 1.7.4 — THE COAT'S TRIM VOICE IS THE TRIM ITSELF (see
                TrimCoatLayer in TagRibbon — the "fit the trim perfectly"
                law): while the trim effect rides, a clone of the card's own
                trim re-inks every shape the family paints, one rung above
                the trim's own work — the gaps stay gaps, the seals stay
                seals, the corner motifs stay motifs. It renders BEFORE the
                over-trim hue wash so a hue-over-trim card still reads the
                ring as washed material over the re-inked shapes. The
                synthetic 9px ring mask on the coat's washes is retired
                with it (index.css) — only the plate keeps its masked seat.
                1.7.5 — THE COAT'S INK IS THE TRIM'S OWN (trimCoatInk):
                FINISH_TRIM_INK retired — the "always yellow" cure; a
                clone with no ink to speak stays unrendered, and the
                washes' seam rail left with it (the plate alone below the
                art line — the image keeps its raw bottom edge).
                1.7.8 — THE RING BAND RETURNS TO THE WASHES ("trim effect
                doesnt work on its own, only works when i have image
                effect turned on, fix that"): with the clone a no-op under
                the 1.7.6/1.7.7 ink laws, the 1.7.5 plain cut left the
                ring wearing NOTHING of the finish — the trim effect did
                nothing without the image effect's full-face reveal. The
                washes' own mask grows the radius-following ring band back
                (the 1.7.8 law in index.css) while the clone keeps its
                seat as the picker's echo: the effect reads as material
                on the trim itself, image effect or no image effect. */}
            <TrimCoatLayer
              trim={character.cardTrim}
              seamless={seamless}
              ink={coatOverTrim ? trimCoatInk(character.cardTrim, character.cardTrimColor) : null}
            />
            {/* 1.4.3 — POLYCHROME'S GRADIENT RING IS RETIRED WITH THE COAT
                ("remove polychrome, replace it with Opalescent"): the
                flowing band on the LINE family's frame geometry belonged
                to the pour's text + border law, and the whole law left
                with the name — the pearl lets the trim's own ink speak
                (see the retirement note in index.css). */}
          {/* 1.3.8 — THE HUE'S SINGLE VOICE ABOVE THE TRIM: while
              hueOverTrim is on, ONE wash seats at z 4 (above the trims,
              the band and the confined stickers) and the band's + free
              layer's own washes below stand down — the ink ring reads as
              washed material, the card's borders stop "always winning".
              1.3.9 — the print on the image left with the retired
              pattern feature. */}
          {hue && hueOverTrim && (
            <span
              className="gd-card-stamp-hue gd-hue-over-trim"
              style={{ background: hue, opacity: hueAlpha }}
              aria-hidden
            />
          )}
          </span>
          {freeStamps.length > 0 && (
            <span className={clsx('gd-card-stamp-free', settings.clip !== false && 'is-clipped')} aria-hidden>
              {/* 0.20.0/0.22.0 — the hue is the classic
                  BOTTOM-HALF-OF-THE-CARD wash (faded upward, at the card's
                  hue transparency), painted UNDER the stickers. 0.26.0 — a
                  CONFINED stamp (OUTSIDE off) sits UNDER the trims like the
                  band: the frame reads as drawn over the stamp; only an
                  OUT-OF-BOUNDS stamp (OUTSIDE on) floats above them.
                  0.38.0 — HUE OVER STAMP flips the order, same as the band.
                  1.3.8 — the wash STANDS DOWN while hueOverTrim is on (the
                  z-4 wash above the trim is the hue's single voice).
                  1.6.2 — and while the coat rides over the trim
                  (coatOverTrim): the confined layer rides its own rung,
                  and its wash would smear the trim from up there — the
                  single z-2 wash above (gd-hue-band-own) carries the
                  hue instead.
                  1.7.3 — THE FLIP SPEAKS HERE TOO (the band's own note):
                  the seats are swapped — OFF (classic) paints the wash
                  FIRST (under the stickers, the gd-hue-halfcard z law
                  scoped to its stampless home so the DOM order is the
                  truth again), ON paints it LAST (the tint over the
                  logos). */}
              {hue && !hueOver && !hueOverTrim && !coatOverTrim && (
                <span
                  className="gd-card-stamp-hue gd-hue-halfcard"
                  style={{ background: hue, opacity: hueAlpha }}
                  aria-hidden
                />
              )}
              {freeStamps.map((s, i) => (
                <span
                  key={s.id}
                  className="gd-card-stamp-placed"
                  style={{
                    left: `${settings.pos.x}%`,
                    top: `${settings.pos.y}%`,
                    // 0.20.0 — the rot var carries its DEG unit: a bare
                    // number made rotate() invalid at computed-value time,
                    // collapsing the whole transform (the "stamp never
                    // rotates / sliders break" root cause).
                    ['--stamp-scale']: Number.isFinite(Number(settings.scale)) && Number(settings.scale) > 0 ? Number(settings.scale) : 1,
                    ['--stamp-rot']: `${Number.isFinite(Number(settings.rot)) ? Number(settings.rot) : 0}deg`,
                    // 0.27.0 — the spotlight clip rides the WRAPPER: cut in
                    // its local (pre-transform) box, then translated /
                    // rotated / scaled with the sticker — the split tracks
                    // the stamp's live position, scale and angle instead of
                    // assuming it sits mid-card.
                    ...sliceStyle(i, freeStamps.length),
                  }}
                >
                  {/* 0.21.0 — a placed stamp is a SOLID sticker: the old
                      directional fade dissolved half the logo when it sat
                      mid-card — the "too see-through" report. Its opacity
                      is the card's own ALPHA slider now. 0.27.0 — in the
                      split view every sticker sits at the SAME values
                      (same position/scale/rot) and the wrapper's clip-path
                      cuts the STAMP into shares: left half = stamp one,
                      right half = stamp two — wherever it sits. */}
                  <img
                    src={buildImageUrl(imagesPath, s.image)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="gd-card-stamp-img"
                    style={{ opacity: artAlpha }}
                  />
                </span>
              ))}
              {hue && hueOver && !hueOverTrim && !coatOverTrim && (
                <span
                  className="gd-card-stamp-hue gd-hue-halfcard"
                  style={{ background: hue, opacity: hueAlpha }}
                  aria-hidden
                />
              )}
            </span>
          )}

          {/* 0.18.0 — the SHINE: on hover a bright white line sweeps
              diagonally across the art, from the top corner to the
              opposite bottom corner (CSS-only, see .gd-card-shine). */}
          <span className="gd-card-shine" aria-hidden />

          <div className="gd-card-hovercol absolute top-2 right-2 z-[7] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* 0.24.0 — z-index 7: ABOVE the trims (z 3) and even the placed
                stickers (z 6) — the decorative corner plates can never cover
                the card's delete key anymore.
                0.41.0 — THE RENAME PENCIL IS GONE ("remove rename card button
                and option and just include it in the card look options, and
                edit it to be edit card instead"): the card's name is edited
                through the EDIT CARD window (the settings menu / the card's
                context menu), never from a hover key on the art. The DELETE
                key stays. */}
            <button
              className="gd-del-hover w-6 h-6 flex items-center justify-center rounded border-2"
              style={{ background: 'var(--gd-panel)', borderColor: 'var(--gd-ink)', color: '#c8402f' }}
              title="Delete card"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        {/* 0.40.0 — THE FOOT: NAME FIRST, VERSIONS ON HOVER — and NO
            SEPARATOR: the plate sits flush against the art. The name crops
            by exactly the room the badge needs.
            0.41.0 — the old count look is back: the hover column carries the
            classic N VER rubber-stamp badge.
            0.42.0 — NO ANIMATED COLUMN, NO HALF-OPEN PAINT ("each card is
            consistant of 3 parts — image, card body and the bottom area; when
            i hover i see a grey line that appears between the image area and
            the bottom area, third time asking"): the 0fr→1fr track tween put
            the badge through half-clipped, half-faded intermediate states
            every hover-in — that transient was the line. The foot is a plain
            TWO-ROW grid now: title + badge (at its OWN width — auto, never a
            50/50 split) on row one, the DATE on a full-width row below. The
            badge appears as ONE fully-formed fade (no layout motion at all),
            the title crops instantly, and the date can never be squeezed or
            cropped by whatever shows up on the right ("ensure that the date
            of card creation isnt affected by the crop on the right side").
            1.1.4 — THE STONE-STILL HOVER (see the 1.1.4 note above the
            handlers): the foot carries has-vers exactly when a badge
            exists — the hover template flip (and its 8px column gap) only
            ever arms for a card that HAS a badge to seat, so a
            zero-version card's name never narrows by a phantom empty
            track. The badge's seated cell wears the title's own line-box
            height (index.css), so even the seating moves nothing. */}
        <div
          ref={footRef}
          className={clsx(
            'gd-card-foot gd-card-foot-vers',
            character.cardColor && 'is-colored',
            character.versions.length > 0 && 'has-vers'
          )}
          style={{
            /* 1.7.4 — THE FINISH'S OWN GROUND paints the plate exactly as a
               picked color does (see finishGround's note): the washes gain
               their receptive ground, the printing earns its ink, the
               corner rise speaks the material — an uncolored card wearing
               a finish is no longer "the theme with dust on it".
               1.9.2 — THE GROUND LISTENS TO THE CLOTH: the ground is the
               theme's own cloth mixed with the material's hue now (see
               FINISH_GROUND in TagRibbon), so the plate's printing speaks
               the theme's own text token — the same voice the uncoated
               themed card always spoke. */
            ...(character.cardColor
              ? { backgroundColor: character.cardColor, color: readableInk(character.cardColor) }
              : finishGround
                ? { backgroundColor: finishGround, color: 'var(--gd-panel-text)' }
                : undefined),
            /* 1.3.5 — THE PLATE SPEAKS ITS OWN COLOR ("the bottom color of
               the container should extend up to cover the two rounded
               leaked corners instead of leaving it white/theme colored"):
               the corner fill used to inherit THIS element's background —
               honest while the card is colored, transparent when it is
               not, so an uncolored card with a stamp band's hue riding it
               filled the carved corners with the bare tint wash over the
               raw panel (a near-white blob at both corners — measured
               live: #e3e4e4 against the #151d22 plate). --gd-foot-plate
               now names the plate's honest color — the card color, or the
               theme's own paper for the uncolored card — and
               .gd-card-foot::before paints it opaque: the container's
               bottom color extends up into the corners on every card. */
            ['--gd-foot-plate']: character.cardColor || finishGround || 'var(--gd-panel)',
            /* 1.3.8 — THE TINT IS RETIRED (see the fade-stays-on-the-image
               law at .gd-card-foot::before in index.css): the notch speaks
               the plate's own color + the bloom continuation — nothing
               else. The --gd-foot-tint write left with the law. */
          }}
        >
          {/* 1.3.9 — the plate's own print left with the retired pattern
              feature ("remove secondary color and pattern option") — the
              finish's coat alone rides the plate below. */}
          <div className="gd-card-foot-name min-w-0">
            <RichText
              text={character.name}
              as="div"
              className="gd-card-title font-display font-bold leading-tight truncate"
              /* 1.7.4 — the finish's own ground earns the printing ink the
                 picked color always earned (see finishGround's note).
                 1.9.2 — the ground is the theme's own cloth now; the
                 printing speaks the theme's text token (see FINISH_GROUND
                 in TagRibbon). */
              style={{ color: character.cardColor ? readableInk(character.cardColor) : 'var(--gd-panel-text)' }}
            />
          </div>
          <div className="gd-card-meta gd-card-meta-line tracking-[0.14em]" style={{ color: character.cardColor ? readableInk(character.cardColor) : 'var(--gd-mute)' }}>
            {fmtDate(character.createdAt)}
          </div>
          {character.versions.length > 0 && (
            <span ref={versRef} className="gd-card-vers" aria-label={`${character.versions.length} versions`}>
              <span
                className="gd-card-vers-badge"
                style={{ color: character.cardColor ? readableInk(character.cardColor) : 'var(--gd-accent)' }}
                title={`${character.versions.length} version${character.versions.length === 1 ? '' : 's'}`}
              >
                {character.versions.length} VER
              </span>
            </span>
          )}
          {/* 1.3.8 — THE PLATE'S OWN COAT left with the 1.4.0 one-seat
              model (see CardFinishLayer in TagRibbon): the coat at the
              card root below masks itself to the plate zone when the image
              stays raw — the pattern never re-anchors between the two
              states. */}
        </div>
        {/* 1.4.5 — THE COAT'S OLD TRAILING SEAT IS RETIRED: the layer moved
            to the card root's DOM FIRST (see the top of this render) — the
            ladder law's equal-rung ordering depends on it, and one coat
            must never render twice. */}
      </div>
    );
  },
  (prev, next) =>
    prev.character === next.character &&
    prev.tagsById === next.tagsById &&
    prev.imagesPath === next.imagesPath &&
    prev.tagScale === next.tagScale &&
    prev.tagPosition === next.tagPosition &&
    prev.tagLimit === next.tagLimit &&
    prev.tagSeparation === next.tagSeparation &&
    prev.defaultRatio === next.defaultRatio &&
    prev.cardWidth === next.cardWidth &&
    prev.spotDim === next.spotDim &&
    prev.spotStamps === next.spotStamps &&
    prev.stampLibrary === next.stampLibrary &&
    prev.dropSide === next.dropSide &&
    // 1.1.1 — the preview-thumbs switch re-renders every card (the cover's
    // seat flips between the prev file and the classic thumb).
    // 1.0.9 — selection is part of the card's own state now (the accent
    // ring): a swap must re-render exactly the two cards it touches — the
    // one that lost the ring and the one that gained it.
    prev.selected === next.selected
);

// 0.27.0 — THE SIZE SLIDERS ARE BACK IN THE TOOLBAR ("readd the tag scale
// and the card scale back to the toolbar where it was while also keeping it
// in settings"): one compact framed cluster for the CARD size (zoom 1–5) and
// one for the TAG size (0.6–2), right after the spotlight key. They write
// the same settings keys the Look tab's sliders write — one source of
// truth, two handles.
function SizeSlider({ icon: Icon, label, title, min, max, step, value, fmt, onChange }) {
  return (
    <div className="gd-tool-slider" title={title}>
      <Icon size={12} className="gd-tool-slider-ico" />
      <input
        type="range"
        className="gd-range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="gd-tool-slider-val tabular-nums">{fmt(value)}</span>
    </div>
  );
}

// Sort dropdown — sorting only. Tag spotlight has its own toolbar button.
// 0.9.0: rendered through the portal Popover so it never clips behind the
// card panel.
function SortMenu({ sortMode, onSort }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const sortLabel = SORT_MODES.find((s) => s.id === sortMode)?.label || 'Custom Order';

  return (
    <div className="relative">
      {/* 0.45.0 — data-gd-opts="order": the app-level right-click reads it
          and speaks the key's own action ("on filters or order it would just
          say clear selection and thats it") — one item, clearing the picked
          sort back to the custom order. */}
      <button
        ref={btnRef}
        className="gd-btn"
        data-gd-opts="order"
        onClick={() => setOpen((o) => !o)}
        title="Sort order"
      >
        <ArrowUpDown size={13} />
        {sortLabel.toUpperCase()}
        <ChevronDown size={12} />
      </button>

      <Popover open={open} onClose={() => setOpen(false)} anchor={btnRef} width={256}>
        <div className="p-2">
          <div className="gd-rule">SORT ORDER</div>
          <div className="mt-1.5">
            {SORT_MODES.map((mode) => (
              <button
                key={mode.id}
                className={clsx(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-[11px]',
                  'hover:bg-[color-mix(in_srgb,var(--gd-accent)_14%,transparent)]',
                  sortMode === mode.id ? 'font-bold' : ''
                )}
                style={{ color: 'var(--gd-panel-text)' }}
                onClick={() => {
                  onSort(mode.id);
                  setOpen(false);
                }}
              >
                <span className="w-3.5 flex-shrink-0" style={{ color: 'var(--gd-accent)' }}>
                  {sortMode === mode.id && <Check size={12} strokeWidth={3} />}
                </span>
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </Popover>
    </div>
  );
}

// Tag spotlight — its own thing in the toolbar. Compact chips (ribbon color +
// glyph + part of the name). 0.9.0, exactly as requested: every tag cycles
//   neutral → MUST INCLUDE → MUST EXCLUDE → neutral
// A card matches only when it carries EVERY include tag and NONE of the
// exclude tags. The HIDE NON-MATCHING switch is a separate, independent
// option — the tag states never touch it: off = non-matching cards grey
// out, on = they leave the grid. Sorting is never touched either. The
// popover itself renders through the portal so it floats ABOVE the right
// card panel instead of clipping behind it.
// 0.15.0 — a STAMP SPOTLIGHT section joins the tags: every GLOBAL stamp
// template cycles neutral → include → neutral. A matching card carries
// every spotlighted stamp; and while the filter is on, those stamps are
// PROMOTED to the visible top of their cards (the band splits into equal
// horizontal COLUMNS when two are picked, thirds for three… — first pick
// left, next middle, last right).
function SpotlightMenu({
  tags,
  stamps,
  imagesPath,
  spotlight,
  onCycleSpotlight,
  onCycleStampSpotlight,
  onToggleSpotlightHide,
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  // 1.1.5 — THE SECTION FOLDS ("allow me to also collapse and expand the
  // tags and stamps inside the filter container (they do reset after
  // closing the container so by default they are expanded)"): both folds
  // live here (not in a db setting — the filter card is a glance, not a
  // seat), and every OPEN of the card resets them to EXPANDED — the reset
  // effect below rides the open toggle itself, so closing the container
  // (or clicking away) always brings the next open back unfolded.
  const [tagsOpen, setTagsOpen] = useState(true);
  const [stampsOpen, setStampsOpen] = useState(true);
  useEffect(() => {
    if (open) {
      // (a deliberate reset-on-open — the card's rows always arrive
      // unfolded; there is no cascade: the effect only fires on the open
      // toggle itself)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTagsOpen(true);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStampsOpen(true);
    }
  }, [open]);
  const include = spotlight?.include || [];
  const exclude = spotlight?.exclude || [];
  const stampInclude = spotlight?.stamps || [];
  // 0.37.0 — stamp EXCLUDES ("just like there is include exclude and normal
  // mode, add that to the stamps too"): the third state of the stamp cycle,
  // independent of the includes.
  const stampExclude = spotlight?.stampExclude || [];
  const hideNon = spotlight?.hideNonMatching === true;
  const activeCount = include.length + exclude.length + stampInclude.length + stampExclude.length;

  const stateOf = (id) => (include.includes(id) ? 'include' : exclude.includes(id) ? 'exclude' : 'neutral');
  const stateMeta = {
    include: { icon: Eye, color: 'var(--gd-accent)', label: 'must include: cards need this tag' },
    exclude: { icon: Ban, color: '#ff8d7d', label: 'must exclude: cards with this tag are filtered out' },
    neutral: { icon: Minus, color: 'var(--gd-mute)', label: 'neutral' },
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        className={clsx('gd-btn', activeCount > 0 && 'gd-btn-accent')}
        data-gd-opts="filter"
        onClick={() => setOpen((o) => !o)}
        title="Tag & stamp filter"
      >
        <ScanSearch size={13} />
        {/* 0.33.0 — SPOTLIGHT IS FILTER now ("also rename spotlight to
            filter"): same engine, same popover, same crew — the word on
            the key finally says what it does. */}
        FILTER
        {activeCount > 0 && (
          <span
            className="ml-0.5 w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--gd-accent)' }}
            title={`${activeCount} filter(s) active`}
          />
        )}
        <ChevronDown size={12} />
      </button>

      <Popover open={open} onClose={() => setOpen(false)} anchor={btnRef} width={310}>
        <div className="p-2">
          {/* 1.1.5 — THE RULE LINE DOUBLES AS THE FOLD SEAT: the chevron
              rides the rule's trailing edge, past the growing hairline
              (the .gd-spot-fold chip); the list below folds away whole.
              1.1.6 — THE FOLD KEY SAYS ITS NAME ("make it so the button to
              collapse the tags&stamps is visible, so the user can close it
              normally instead of relying on just scrolling down"): the old
              key was a bare 18px mute chevron — easy to miss, so long tag
              lists felt like something you could only scroll through. The
              key is a real bordered pill now, carrying the chevron AND the
              word — COLLAPSE while the list is open, EXPAND while folded —
              in the panel-text voice with an accent hover. */}
          <div className="gd-rule">
            TAG FILTER
            {tags.length > 0 && (
              <button
                type="button"
                className="gd-spot-fold"
                title={tagsOpen ? 'Collapse the tag list' : 'Expand the tag list'}
                onClick={() => setTagsOpen((o) => !o)}
              >
                <ChevronDown size={11} className={clsx('transition-transform', tagsOpen && 'rotate-180')} />
                <span className="gd-spot-fold-word">{tagsOpen ? 'COLLAPSE' : 'EXPAND'}</span>
              </button>
            )}
          </div>
          {tags.length === 0 && stamps.length === 0 ? (
            <p className="mt-1.5 px-2 text-[10px] leading-relaxed" style={{ color: 'var(--gd-mute)' }}>
              No tags or stamps yet. Create tags from a card&rsquo;s tag row, and stamps while creating a card or from the
              right panel&rsquo;s stamp row.
            </p>
          ) : (
            /* 0.24.0 — the tag rows render the RIBBONS at near-full size (the
               old 0.55-scale glyphs were too small to read the design) in a
               two-column grid, so each tag reads at a glance. 1.1.5 — the
               grid itself folds away under the rule's chevron.
               1.2.6 — THE FOLD BREATHES ("add collapse and expand animation
               for the filters collapse and expand sections"): the fold used
               to be a hard mount/unmount — the whole list blinked out and
               back. The content now stays MOUNTED inside a measured 0fr→1fr
               grid track (see .gd-fold in index.css): the rows slide away
               under their own height and the popover shrinks WITH them —
               one motion, no pop, and the stamp section below rides the
               same flight. */
            <div className={clsx('gd-fold mt-1.5', !tagsOpen && 'is-folded')}>
              <div className="gd-fold-inner">
                <div className="gd-spot-tags">
                {tags.map((tag) => {
                const state = stateOf(tag.id);
                const meta = stateMeta[state];
                const Icon = meta.icon;
                return (
                  <button
                    key={tag.id}
                    /* 0.37.0 — the container itself is the state signal
                       ("ensure that the container that contains the text and
                       the stamp gets highlighted slightly so its easier to
                       distinguish which is selected and which is disabled
                       etc"): include washes the whole row accent-tinted with
                       an accent frame; exclude washes it red-tinted, framed
                       and slightly dimmed — selected vs disabled read at a
                       glance, the icon is only the confirmation. */
                    className={clsx('gd-spot-tag', state !== 'neutral' && 'is-on', state === 'include' && 'is-include', state === 'exclude' && 'is-exclude')}
                    style={{ color: 'var(--gd-panel-text)' }}
                    title={`${stripRichText(tag.name)} cycles: must include → must exclude → neutral`}
                    onClick={() => onCycleSpotlight(tag.id)}
                  >
                    <TagRibbon tag={tag} scale={0.9} />
                    <span className="gd-spot-tag-name">
                      <RichText text={tag.name} />
                    </span>
                    <span className="flex-shrink-0" style={{ color: meta.color }} title={meta.label}>
                      <Icon size={12} strokeWidth={2.6} />
                    </span>
                  </button>
                );
              })}
                </div>
              </div>
            </div>
          )}

          {/* 0.15.0 — the global stamp templates, below the tags — their own
              fold now (1.1.5), same chevron, same reset-on-open. */}
          <StampSpotlightSection
            stamps={stamps}
            imagesPath={imagesPath}
            stampInclude={stampInclude}
            stampExclude={stampExclude}
            onCycle={onCycleStampSpotlight}
            open={stampsOpen}
            onToggleOpen={() => setStampsOpen((o) => !o)}
          />

          {/* Independent switch: grey out (default) or remove the
              non-matching cards. No tag state ever overwrites it. */}
          <div className="mt-2 pt-2 gd-hairline-t flex items-center gap-2 px-2 pb-1">
            <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-gd-mute flex-1">HIDE NON-MATCHING</span>
            <button
              className={clsx('gd-switch', hideNon && 'is-on')}
              title="Non-matching cards: greyed out / hidden"
              onClick={onToggleSpotlightHide}
            />
          </div>
          {/* 1.1.5 — THE LONG HELPER PARAGRAPHS ARE GONE ("the help text
              inside the filters area, remove it since its too long and
              blocks the area"): the card now holds the lists (each with its
              own fold) and the switch — nothing else. The cycle states stay
              on every row's own tooltip. */}
        </div>
      </Popover>
    </div>
  );
}

// The STAMP section of the spotlight popover: one generous TILE per stamp in
// the GALLERY (its image + name + state icon) — the 0.24.0 answer to "the
// vertical list with rows of each stamp is hard to distinguish". 0.37.0 —
// THE FULL THREE-STATE CYCLE, like the tags ("just like there is include
// exclude and normal mode, add that to the stamps too"): click cycles
// neutral → INCLUDE (promoted on the band; every card must carry it) →
// EXCLUDE (any card carrying it is a non-match) → neutral. While included,
// every card that carries the stamp (matched by IMAGE — the stamp you SEE
// is the stamp that matches) renders IT as the visible top one; two or
// more included stamps switch the cards to the SPLIT VIEW. The tile's own
// container carries the state wash (accent for include, red for exclude)
// so selected vs disabled reads without hunting for the little icon.
// 1.1.5 — THE SECTION FOLDS ("allow me to also collapse and expand the tags
// and stamps inside the filter container"): the rule line carries the same
// chevron the TAG FILTER rule wears, the tiles fold away under it, and the
// long helper paragraph that used to sit under the tiles is retired with
// the card's own one ("the help text inside the filters area, remove it
// since its too long and blocks the area").
function StampSpotlightSection({ stamps, imagesPath, stampInclude, stampExclude, onCycle, open = true, onToggleOpen = null }) {
  if (!stamps.length) return null;
  return (
    <>
      <div className="gd-rule mt-2">
        STAMP FILTER
        <button
          type="button"
          className="gd-spot-fold"
          title={open ? 'Collapse the stamp list' : 'Expand the stamp list'}
          onClick={onToggleOpen}
        >
          <ChevronDown size={11} className={clsx('transition-transform', open && 'rotate-180')} />
          <span className="gd-spot-fold-word">{open ? 'COLLAPSE' : 'EXPAND'}</span>
        </button>
      </div>
      {/* 1.2.6 — THE STAMP FOLD BREATHES TOO (the tags fold's own law —
          see the TAG FILTER fold above): mounted content under a 0fr→1fr
          grid track, so the stamp tiles slide away and back instead of
          blinking out. */}
      <div className={clsx('gd-fold mt-1.5', !open && 'is-folded')}>
        <div className="gd-fold-inner">
          <div className="gd-spot-tiles">
        {stamps.map((st) => {
          const on = stampInclude.includes(st.id);
          const off = !on && (stampExclude || []).includes(st.id);
          const state = on ? 'include' : off ? 'exclude' : 'neutral';
          return (
            <button
              key={st.id}
              // 0.31.0 — is-bare ("remove the container surrounding the
              // text of the stamp inside of the spotlight, only keep the
              // stamp container and the text"): no outer frame around the
              // [box + name] pair — the 44px art box IS the container, the
              // selection ring rides the BOX, and the name is a bare label
              // that takes the accent while picked. 0.37.0 — the ring
              // doubles as the STATE carrier: accent ring + wash for
              // include, red ring + dim for exclude.
              className={clsx('gd-spot-tile is-bare', on && 'is-on', state === 'include' && 'is-include', state === 'exclude' && 'is-exclude')}
              title={`${st.name} cycles: must include → must exclude → neutral`}
              onClick={() => onCycle(st.id)}
            >
              {/* 0.30.0 — THE TILE MIMICS THE STAMP SLOT CONTAINER: the art
                  sits in the same 44px framed box the slot row uses, so the
                  tile shows exactly what the card will wear, and the name
                  rides under it like the slot's TOP tab. */}
              <span className="gd-spot-tile-box">
                {/* 1.1.4 — THE TILE READS THE PREVIEW when one exists (the
                    generator builds prevs for the stamp library too —
                    "include the stamps images too in the generate thumbnail
                    feature"): the spotlight tiles the WHOLE library at once,
                    so the lightweight prev carries the wall. No prev yet
                    keeps the original exactly as before. */}
                <img src={buildImageUrl(imagesPath, st.prev || st.image)} alt="" loading="lazy" decoding="async" />
                <span className="gd-spot-tile-state">
                  {on ? <Eye size={9} strokeWidth={2.6} /> : off ? <Ban size={9} strokeWidth={2.6} /> : <Minus size={9} strokeWidth={2.6} />}
                </span>
              </span>
              <span className="gd-spot-tile-name">{st.name}</span>
            </button>
          );
        })}
          </div>
        </div>
      </div>
    </>
  );
}

export default function GridView({
  characters,
  tags,
  stamps,
  imagesPath,
  zoom,
  tagScale,
  tagPosition = 'corner',
  // 0.47.0 — ribbon count + separation (Settings → Look → CARDS & TAGS).
  tagLimit = TAG_LIMIT_RANGE.default,
  tagSeparation = TAG_SEPARATION_RANGE.default,
  cardRatio,
  sortMode,
  search,
  advancedSearch = false,
  classLabel,
  // 1.0.9 — the character currently open in the detail panel: its grid
  // card wears the selection ring (see CharacterCard).
  selectedId = null,
  // 1.1.8 — THE EXPANDED SEATS ("when right clicking on a card, add an
  // option to expand it, which will allow the card to take 2 rows instead
  // of one, while still remaining in the same aspect ratio … when right
  // clicking on it again there is the option to shrink it instead back to
  // default"): the Set of card ids the user expanded from the card's
  // right-click menu (App owns it — the menu lives at App level). An
  // expanded card renders at DOUBLE width (its aspect-ratio art doubles
  // its height with it — the ratio preserved by geometry) and the masonry
  // packs it across two adjacent columns; the card's own typography scales
  // with the doubled width, exactly like a zoomed card.
  expandedIds = null,
  // 1.3.0 — THE PANEL FLIGHT (App's panelFlight state): while the right
  // panel's width flight runs, the masonry cards' framer layout projection
  // rests (cards snap through the flight's column crossings instead of
  // springing) — the flight's heaviest frame sheds ~176 projection reads.
  // At rest the springs keep their seat exactly as before.
  flighting = false,
  // 1.6.8 — THE LIVE DRAG PREVIEW (Settings → Performance): ON keeps the
  // 1.6.3 live gap — the board previews the reorder while the card flies,
  // gliding the displaced cards aside in real time. OFF holds the board
  // STILL through the whole drag: the hovered card's drop-edge glow alone
  // speaks (the shine at the card's left or right), and the reorder lands
  // ON RELEASE — one animated commit, the same springs, nothing moving
  // under the pointer until the finger lets go.
  // 1.9.12 — THE DEFAULT FLIPS OFF ("the live drag previews option default
  // should be off"): the prop's fallback rests at the still-wall lane and
  // App passes the === true polarity — a fresh database never previews.
  liveDragPreview = false,
  dragRef,
  spotlight,
  onCycleSpotlight,
  onCycleStampSpotlight,
  onToggleSpotlightHide,
  onSearch,
  onSort,
  onNew,
  onOpen,
  onDelete,
  onReorder,
  onZoom,
  onTagScale,
  // 0.47.0 — the toolbar's separation handle (same key as the Look tab's).
  onTagSeparation,
}) {
  const [dropHint, setDropHint] = useState(null); // { id, side }
  // 1.5.9 — the OWNED drag flight's dispose handle (see startCardDrag):
  // the ghost + its window listeners live here, independent of dragRef —
  // the drop handler clears dragRef before dragend ever answers, and the
  // ghost's cleanup must never depend on a ref a sibling already cleared.
  const dragGhostDisposeRef = useRef(null);

  // 1.4.9 — THE OFF-SCREEN WALL SLEEPS ("when i open task manager i see 2
  // instances of burrito gendex, both taking alot of cpu, that especially
  // occurs when i dont have the card details open, just normally it would
  // lag alot, fix that"): the wall of cards is the one surface that scales
  // with the library — a 200-card wall wearing animated finishes keeps a
  // dozen composited, blend-mode flights turning for EVERY card, scrolled
  // out of sight included, and the GPU + renderer processes both chew on
  // raster nobody can see (the "2 instances" of the report). A single
  // IntersectionObserver (viewport root — clipped by the scroller exactly
  // like the eye) marks every card that leaves the window with
  // [data-off-view]; the CSS pauses that card's whole finish family +
  // motion clocks on the mark (see index.css), and the moment it scrolls
  // back it RESUMES at the exact phase it froze at (the animation-delay
  // never moved — no pop, no restart, just the breath held while off
  // stage). A MutationObserver keeps the watch armed as cards mount and
  // unmount (zoom swaps, filters, reorder); the data-gd-io mark keeps the
  // scan itself a no-op after the first pass.
  const viewerRef = useRef(null);
  useEffect(() => {
    const root = viewerRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          const el = en.target;
          if (!el || typeof el.setAttribute !== 'function') continue;
          if (en.isIntersecting) el.removeAttribute('data-off-view');
          else el.setAttribute('data-off-view', '1');
        }
      },
      // 120px of pre-wake margin: a card entering the window is already
      // breathing before its edge crosses the sill.
      { rootMargin: '120px 0px' }
    );
    const scan = () => {
      for (const el of root.querySelectorAll('.gd-card[data-gd-char-id], .gd-card-add')) {
        if (el.hasAttribute('data-gd-io')) continue;
        el.setAttribute('data-gd-io', '1');
        io.observe(el);
      }
    };
    scan();
    const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(scan) : null;
    if (mo) mo.observe(root, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo?.disconnect();
    };
  }, [characters, zoom, expandedIds, search, sortMode]);

  const tagsById = useMemo(() => {
    const map = {};
    for (const t of tags || []) map[t.id] = t;
    return map;
  }, [tags]);

  // 0.9.0 spotlight: include/exclude per tag + the independent
  // hide-non-matching switch. 0.15.0: stamp includes ride the SAME
  // filter — a card must carry every spotlighted stamp (matched by IMAGE
  // 0.22.0 — what you see is what matches), and the spotlighted stamps get
  // promoted onto the visible stamp band while it lasts. 0.37.0: stamp
  // EXCLUDES ride too — a card carrying any excluded stamp is a non-match.
  const include = spotlight?.include || [];
  const exclude = spotlight?.exclude || [];
  const spotStamps = spotlight?.stamps || [];
  const spotStampExcl = spotlight?.stampExclude || [];
  const hideNon = spotlight?.hideNonMatching === true;
  const spotActive = include.length > 0 || exclude.length > 0 || spotStamps.length > 0 || spotStampExcl.length > 0;
  const spotFilter = { include, exclude, stamps: spotStamps, stampExclude: spotStampExcl };

  const visible = useMemo(() => {
    const searched = searchCharacters(characters, search, { advanced: advancedSearch });
    const sorted = sortCharacters(searched, sortMode);
    if (!spotActive) return sorted;
    if (hideNon) {
      // HIDE NON-MATCHING: only fully-matching cards stay on the board.
      return sorted.filter((c) => spotlightMatchState(c, spotFilter, stamps) === 'match');
    }
    // Grey-out mode: everything stays; the non-matching cards get dimmed
    // per-card below (spotDim).
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters, search, advancedSearch, sortMode, spotlight, spotActive, hideNon, stamps]);

  const cardWidth = CARD_WIDTHS[zoom] || CARD_WIDTHS[ZOOM_RANGE.default];

  // GenStack law 8: add-card renders FIRST except in Oldest First, where it
  // renders LAST.
  const addFirst = sortMode !== 'oldest';

  // The add-card's boundary NEIGHBOR is computed below the preview law
  // (1.6.8 — it reads the PREVIEWED order now, the same splice the board is
  // painting; see addRatio after itemIds).

  // The masonry pack order: add-card slot + every visible character.
  // 1.6.3 — THE LIVE GAP ("card movement animations is missing when i drag
  // around"): while a card drag lives, the board PREVIEWS the reorder the
  // drop would commit — the dragged card's own seat rides the preview
  // order, the displaced cards GLIDE aside to open the gap (framer's
  // position projection, the same spring the class switch learned this
  // release), and the drop lands the commit the preview already painted so
  // nothing snaps on arrival. The preview rides `dragPreview` — a view-only
  // splice of the base order with EXACTLY the semantics reorderCharacters
  // speaks (remove the dragged id, seat it before/after the hovered card),
  // so the previewed order IS the order a drop commits. A drag that ends
  // nowhere (cancel, escape, drop on the sheet) simply clears the preview
  // and the cards glide home — the same movement, answering the same law.
  const dragPreviewRef = useRef(null); // { id, over, side } — the live gap's truth
  const [dragPreview, setDragPreview] = useState(null);
  // 1.6.8 — THE SEAT MEMORY (the no-preview drag's commit truth): while
  // LIVE DRAG PREVIEW is off, the board holds still through the drag and
  // the pointer's last honest (over, side) lives here — the drop commits
  // THIS seat, the classic DnD law, so the release still lands exactly
  // where the edge glow said it would.
  const dropSeatRef = useRef(null); // { over, side } — last hovered card + side
  // 1.6.7 — THE STILL POINTER'S OWN MEMORY: the last dragover's true
  // client seat, read against every later event. A dragover that arrives
  // at the SAME coordinates is not the pointer speaking — it is the
  // browser re-ansouncing the hit-test after the preview's own glide moved
  // the cards under a resting cursor (the synthetic leave + re-over pair a
  // layout shift fires). Those echoes re-armed the preview to whatever card
  // the shift happened to park under the pointer: "sometimes i even drag,
  // see an orientation, and if i hold still i see it change in front of my
  // eyes once" — the exact disease. The guard only ever SKIPS: a pointer
  // that truly moves (even a crawl — the ref advances only on processed
  // events, so sub-pixel steps accumulate) always gets through, and the
  // drop stays allowed either way (the preventDefault speaks first).
  const dragPtRef = useRef(null); // { x, y } — last processed dragover seat
  // 1.6.9 — THE ARM-POINT HYSTERESIS ("the same issue where the cards
  // viewer cards would shuffle on multiple turns when i drag a card around
  // or let go still, fix that"): the echo guard above filters the
  // same-coordinate re-announcements, but a REAL mouse jitters 1-2px
  // between frames — and after the preview's own glide parks a new card
  // under the pointer, that jitter is a "real" dragover to the guard, and
  // the preview re-armed to the glided-in card: the board shuffled AGAIN
  // beneath a pointer that only breathed (the "multiple turns" half of
  // the report, and the residual of "if i hold still i see it change in
  // front of my eyes once"). The arm now speaks a TRAVEL THRESHOLD of its
  // own: once a preview seat is armed at point P, a NEW seat may only arm
  // after the pointer has travelled at least 12px from P — a distance no
  // honest card-crossing ever fails (the cards are 155px wide at the
  // default zoom), and one no jitter or layout echo ever reaches. The
  // edge glow, the seat memory and the drop stay untouched by the
  // threshold — only the PREVIEW's re-arm is throttled, so the live gap
  // follows the pointer's honest crossings and never the noise.
  const armPtRef = useRef(null); // { x, y } — the seat where the current preview armed
  // 1.7.0 — the arm HISTORY (the toggle-band guard below): the last two
  // armed seat keys, so a flip that RETURNS to the seat the board painted
  // two arms ago is recognizable as the oscillation it is — plus the PIN a
  // blocked flip leaves on the contested seat (see the guard's own note).
  const armHistRef = useRef([]);
  const togglePinRef = useRef(null);
  // 1.7.0 — the click-after-the-carry window (see startCardDrag): opens
  // through the card root wait out this timestamp.
  const suppressOpenUntilRef = useRef(0);
  /* 1.7.2 — THE FLIGHT TRUTHS LIVE IN REFS ("live drag preview is turned
     off but still works, it should not do the live immidiate preview, it
     should just do after i let go" + "sometimes when i drag a card, it
     would not move the card even if it has a valid placement, would even
     show the feedback on the side of the card but would not move
     (sometimes)"): CharacterCard is memo'd and its comparator ignores
     function props BY DESIGN (the 1.6.9 note — "the comparator ignores
     function props — the fresh closure never costs the card's memo a
     re-render"), so every card keeps the drag closures from the LAST
     render it accepted — and a card that never re-renders (its own props
     untouched by the settings flip, the class switch, a filter) drags
     with the truths frozen at its MOUNT render. The live probe caught the
     whole disease in one run: LIVE DRAG PREVIEW toggled off, every card
     still standing from the boot kept liveDragPreview=true in its stale
     startCardDrag — THE GHOST WAS STILL BORN — and the stale dropOnCard
     took the preview branch with a preview that never armed (the hovered
     card's fresher closure gated it) and committed NOTHING while the edge
     glow promised the seat. The refs below are refreshed on EVERY
     GridView render and the handlers read .current — the memo can freeze
     the closures forever, the truths they read are always the live ones:
     the setting flips speak on the very next drag, whichever card was
     holding them. */
  const livePreviewRef = useRef(liveDragPreview);
  livePreviewRef.current = liveDragPreview;
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const expandedIdsRef = useRef(expandedIds);
  expandedIdsRef.current = expandedIds;
  const previewOrder = useCallback(
    (ids, drag) => {
      if (!drag || !Array.isArray(ids)) return ids;
      const di = ids.indexOf(drag.id);
      if (di < 0) return ids;
      const rest = [...ids];
      rest.splice(di, 1);
      let ti = rest.indexOf(drag.over);
      if (ti < 0) return ids;
      if (drag.side === 'right') ti += 1;
      rest.splice(ti, 0, drag.id);
      return rest;
    },
    []
  );
  const itemIds = useMemo(() => {
    const ids = visible.map((c) => c.id);
    const base = addFirst ? [ADD_FIRST, ...ids] : [...ids, ADD_LAST];
    // the add-card slot never moves for a preview — the splice speaks only
    // among character ids, and the slot stays at its end.
    if (!dragPreview) return base;
    const previewed = previewOrder(ids, dragPreview);
    return addFirst ? [ADD_FIRST, ...previewed] : [...previewed, ADD_LAST];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, addFirst, dragPreview, previewOrder]);

  // 1.6.8 — THE ADD CARD SPEAKS THE PREVIEWED ORDER ("same drag sorting
  // issue where if i drag a card onto an area (might be worth noting its
  // an expanded card), it shows the orientation that would fit and its all
  // good, but for some reason after i let go i see things shift around
  // again, fix that" + "when the top left new card container resizes,
  // animate it, dont snap it"): the add tile mirrors its NEIGHBOR's ratio,
  // and the neighbor used to read the BASE visible order — so while a drag
  // previewed a new card into the boundary seat, the tile kept the OLD
  // neighbor's ratio through the whole flight and the COMMIT alone flipped
  // it: a different-height box at the board's very edge a beat after the
  // release, the pack re-flowing beneath the pointer — the "things shift
  // around again" the owner kept catching at exactly the top-left corner
  // (and the add container's own SNAP in the same breath). The neighbor
  // reads the SAME previewed order the board is painting now (itemIds' own
  // splice, minus the add slots), so the tile's ratio changes WITH the
  // preview — the board, its pack and its add card commit ONE picture, and
  // the drop's render finds every box exactly where the preview left it.
  // The tile's own aspect change breathes on a 0.24s tween (see
  // .gd-card-add-box in index.css), so even the preview's own flip GLIDES
  // instead of snapping — the top-left container animates, never snaps.
  const neighbor = useMemo(() => {
    const ordered = itemIds.filter((id) => id !== ADD_FIRST && id !== ADD_LAST);
    if (!ordered.length) return null;
    const nid = addFirst ? ordered[0] : ordered[ordered.length - 1];
    return visible.find((c) => c.id === nid) || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIds, addFirst, visible]);
  const addRatio = neighbor?.cardRatio || cardRatio;

  const startCardDrag = (e, id) => {
    dragRef.current = { type: 'card', id };
    // 1.7.0 — THE CLICK-AFTER-THE-CARRY DIES ("when im holding a card,
    // sometimes i click and open the card which causes it to be dropped
    // where i left it, which causes the illusion that the live drag
    // preview on even if its off, fix that"): the drag's own ending can
    // still speak a CLICK — a short carry, a drop back on the source,
    // the second button's press — and that click OPENED the card from
    // under the finger mid-flight: the view mounted over the board, the
    // drag died wherever it happened to sit, and the interrupted seat
    // read as the still-board's preview moving on its own. The open now
    // waits out a short window after EVERY drag event (armed at the
    // start, re-armed at every ending — 280ms, an order past the click
    // the same gesture could ever fire) and refuses while a card drag
    // LIVES at all. A deliberate click lands exactly as it always did —
    // the suppression only ever covers the drag's own breath.
    suppressOpenUntilRef.current = Date.now() + 280;
    dragPtRef.current = null;
    // 1.6.8 — a fresh drag seats nothing yet (the memory arms with the
    // first honest hover, whichever preview law is speaking).
    dropSeatRef.current = null;
    // 1.6.9 — the arm-point memory leaves with the drag too (see the
    // hysteresis law in overCard).
    armPtRef.current = null;
    // 1.7.0 — and the toggle history + its pin leave with it (the band
    // guard reads them fresh on every drag).
    armHistRef.current = [];
    togglePinRef.current = null;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    // 1.6.2 — THE DRAG'S OWN STILL IS RETIRED ("when i hover over multiple
    // cards and play that shine animation … if i drag a card, it
    // interrupts, then when i let go and hover over a card they all play
    // at the same time, fix that so it doesnt interrupt and its seperate,
    // it shouldnt interrupt even the card being dragged"): the 1.4.4 law
    // armed a root-wide gd-card-drag class that set EVERY card's shine
    // sweep to animation:none for the drag's whole life — but a canceled
    // animation never fires its animationend, so the is-live class LINGERED
    // on every card whose sweep the still killed, and the moment the drag
    // ended the rule lifted and ALL of those sweeps RESTARTED AT ONCE (the
    // "they all play at the same time" half of the report — the restart
    // fired the instant the class left, hovering merely drew the eye to
    // it). The shine's lifecycle belongs to hover alone now: nothing stills
    // it mid-sweep — not the drag, not the pressed card carrying it (the
    // native snapshot the still was born to guard was retired by the 1.5.9
    // owned flight anyway, and the sweep plays UNDER the carried miniature
    // exactly as it plays under the cursor's hover).
    // 1.5.4 — THE GHOST RIDES UNDER THE CURSOR ("dragging a card shows its
    // preview at the bottom right, way too stranded fix that" / "when i
    // drag a card around, the preview of it is at the bottom right corner,
    // way too far stranded, fix that so its close to the cursor always"):
    // the native ghost is a full-size snapshot of the card anchored at the
    // exact pixel the press grabbed — grab a card by its top-left corner
    // and the whole 300px card hangs off the cursor's bottom-right.
    // 1.5.8 — THE SNAPSHOT CRAFT ("the vague preview of it at the bottom
    // right corner fucking still"): the ghost box was rebuilt as the exact
    // miniature, offscreen, attached — and the OS STILL fell back to its
    // own snapshot on the real machine (an offscreen element's raster can
    // arrive empty, and an empty bitmap means Chromium quietly re-uses the
    // source element's snapshot: full-size, anchored at the grab pixel,
    // drawn at the OS's washed drag opacity — the stranded faded preview
    // one more time).
    // 1.5.9 — THE FLIGHT IS OURS NOW ("dragging a card around is till too
    // bottom right and is very faded, fix it or rework it because its been
    // a very long constistant issue"): the snapshot road is retired, not
    // repaired. TWO moves, both owned outright:
    //   · the NATIVE drag image is suppressed with a TRANSPARENT 1x1
    //     CANVAS — the one setDragImage form every Chromium honors (a
    //     canvas bitmap needs no layout, no paint, no race to win), so the
    //     OS snapshot (the faded bottom-right strander) is simply never
    //     born;
    //   · and the carried miniature is a LIVE element of our own — the
    //     same clone the snapshot road built, but VISIBLE, following the
    //     pointer through the drag's own events (drag + dragover, both
    //     captured at the window: they carry the true clientX/Y at the
    //     OS's own cadence, no pointermove needed — the pointer is owned
    //     by the drag loop while a drag lives). pointer-events: none keeps
    //     every dragover landing on the real cards beneath it, a soft
    //     shadow reads it as carried, and the seat is CENTERED on the
    //     cursor at full opacity: never faded, never stranded, at every
    //     scroll seat and every DPR the machine speaks.
    // The dispose lives in its OWN ref (dragGhostDisposeRef) — the drop
    // handler nulls dragRef before dragend answers, and the ghost's
    // cleanup must never depend on a ref a sibling already cleared.
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext && canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, 1, 1);
      e.dataTransfer.setDragImage(canvas, 0, 0);
    } catch {
      /* best-effort suppression — the owned flight below carries the look
         even if the canvas road ever refuses */
    }
    dragGhostDisposeRef.current?.();
    dragGhostDisposeRef.current = null;
    try {
      const card = e.currentTarget;
      // 1.6.0 — THE BOX IS THE LAYOUT, NOT THE FLIGHT ("when dragging a card,
      // the preview gets cropped depending on when i pull it during the
      // squish/stretch animation"): getBoundingClientRect carries the LIVE
      // transform of the press jelly — grab the card mid-squish and the rect
      // is a shrunken box, mid-stretch and it is a grown one — and the ghost
      // was BUILT at that box (miniW/miniH from the rect, the clone's width
      // pinned to it) while the clone itself renders at its natural,
      // un-transformed size (the data-pressed strip below retires the jelly
      // on the copy): the full-size content overflowed the smaller ghost box
      // and the wrapper's overflow: hidden cropped it — a preview whose crop
      // depended on the exact frame the drag engaged. The ghost now measures
      // the card's LAYOUT box (offsetWidth/offsetHeight — transform-blind,
      // the same at every frame of the flight), so the miniature is the same
      // no matter when the pull happens, and the jelly keeps breathing on the
      // real card beside it exactly as the 1.4.8 law demands.
      const layW = Math.round(card.offsetWidth || 0);
      const layH = Math.round(card.offsetHeight || 0);
      // 1.6.9 — THE GHOST RETIRES WITH THE PREVIEW ("i turn off live drag
      //   preview but it still works, fix that") — RETIRED by 1.8.2
      //   ("during live drag preview option when its turned off i want the
      //   card preview that is faded and follows the cursor to still
      //   appear, fix that (since the option just turns off the dynamic
      //   cards switching thing if you know what i mean)"): the 1.6.9
      //   reading took the switch's NAME for the whole drag's preview —
      //   the miniature died with the live board, and a still drag showed
      //   nothing following the cursor at all. The switch is the DYNAMIC
      //   SWITCHING alone (the overCard arm below and the drop's live
      //   seat keep their own gates): the faded pull — the 1.8.1 55%
      //   miniature, a paused snapshot since 1.8.2 — rides EVERY drag,
      //   live board or still. The native OS snapshot stays suppressed by
      //   the transparent canvas above, so the pull is the one voice that
      //   follows the finger; the still board keeps the real card pressed
      //   under the pointer, the hovered card's edge glow, and its one
      //   animated commit on release — the exact cheap lane the switch
      //   was born to speak.
      if (layW > 4 && layH > 4 && typeof card.cloneNode === 'function') {
        const scale = Math.min(1, 118 / layW);
        const miniW = Math.max(8, Math.round(layW * scale));
        const miniH = Math.max(8, Math.round(layH * scale));
        const ghost = document.createElement('div');
        ghost.className = 'gd-drag-ghost';
        ghost.style.width = miniW + 'px';
        ghost.style.height = miniH + 'px';
        const clone = card.cloneNode(true);
        clone.removeAttribute('data-pressed');
        clone.style.margin = '0';
        clone.style.width = layW + 'px';
        clone.style.transform = 'scale(' + scale.toFixed(4) + ')';
        clone.style.transformOrigin = '0 0';
        ghost.appendChild(clone);
        document.body.appendChild(ghost);
        const seat = (x, y) => {
          ghost.style.transform =
            'translate3d(' + Math.round(x - miniW / 2) + 'px, ' + Math.round(y - miniH / 2) + 'px, 0)';
        };
        // the birth seat rides the press's own pointer (a real dragstart
        // always carries it; a synthetic one without coordinates seats the
        // ghost at the origin until the first flight event speaks)
        //
        // 1.6.2 — AND A BIRTH WITHOUT COORDINATES NEVER PAINTS ("the dragging
        // cards preview starts at the top or top left corner then snap to
        // the cursor, fix that so they appear right away on the cursor"):
        // whenever the birth seat cannot speak a true pointer (a dragstart
        // whose clientX/Y read 0 or non-number — the exact failure that
        // seated the miniature at the window's top-left corner for the
        // whole gap before the first drag/dragover answered), the ghost
        // rides INVISIBLE until its first flight event seats it: the
        // miniature only ever becomes visible already centered on the
        // cursor, never stranded at a corner it never owned. A birth WITH
        // true coordinates paints immediately, exactly as it always did.
        const birthHasPointer =
          typeof e.clientX === 'number' && Number.isFinite(e.clientX) && (e.clientX !== 0 || e.clientY !== 0);
        // 1.8.1 — THE PULL FADES ("when dragging cards around, have a
        //   faded effect on the preview pull (the one following the
        //   cursor), so it doesnt block or get confusing"): the miniature
        //   rode at full opacity — a solid card-shaped plate over the very
        //   cards it flew past, the loudest object on the wall for the
        //   whole flight. The flight speaks at 55% now (the .gd-drag-ghost
        //   rule carries the same number, with a 0.12s ease for the lit
        //   birth): the pull stays legible where it sits yet the grid
        //   reads THROUGH it — the drop seats and the hovered card's edge
        //   glow keep their own voice under the flight.
        const DRAG_GHOST_FADE = '0.55';
        ghost.style.opacity = birthHasPointer ? DRAG_GHOST_FADE : '0';
        seat(typeof e.clientX === 'number' ? e.clientX : 0, typeof e.clientY === 'number' ? e.clientY : 0);
        // 1.7.0 — THE FLIGHT'S OWN ZERO-GUARD ("when dragging cards around,
        // i can see for a split second the preview appearing at top left
        // then into my cursor, fix that"): the 1.6.2 birth guard already
        // keeps a coordinate-less birth dark, but the FLIGHT listeners
        // trusted every number — and a `drag` echo whose clientX/Y read
        // 0/0 (the exact failure the birth guard was born for) SEATED the
        // lit miniature at the window's top-left corner for the whole
        // gap before the next honest dragover answered: the split-second
        // corner flash the report names. The same zero-guard now rides
        // every flight event — a (0,0) echo moves nothing, lights
        // nothing, and the miniature only ever appears already centered
        // on a true pointer.
        //
        // 1.7.0 — DRAGENTER JOINS THE FLIGHT + THE FOCUS RE-SEAT ("when i
        // was alt tabbed too so im not sure how to replicate, the drag
        // card didnt show a preview and instead showed my cursor, fix
        // that"): a ghost born dark (a dragstart while the window was
        // unfocused speaks no true pointer) had NO recovery while the
        // pointer wandered away from our window — drag + dragover only
        // fire inside it, so a dark birth stayed dark through the whole
        // flight and the drag read as the bare cursor. Two more voices:
        // dragenter carries true coordinates the instant the drag
        // re-crosses our window's boundary (before any dragover of a
        // child), and the window's own FOCUS re-seats a dark ghost from
        // the last honest card-hover seat the drag spoke (dragPtRef — the
        // pointer's own last word). A focus with no known seat keeps the
        // ghost dark — the next true flight event still lights it the
        // moment the pointer moves.
        const hasTruePointer = (ev) =>
          typeof ev?.clientX === 'number' &&
          Number.isFinite(ev.clientX) &&
          typeof ev?.clientY === 'number' &&
          Number.isFinite(ev.clientY) &&
          (ev.clientX !== 0 || ev.clientY !== 0);
        const onFlight = (ev) => {
          if (!hasTruePointer(ev)) return;
          seat(ev.clientX, ev.clientY);
          // the first true seat also lights the ghost (the birth guard's
          // other half: an invisible birth only stays invisible until the
          // pointer speaks) — at the 1.8.1 faded weight, never full ink.
          ghost.style.opacity = DRAG_GHOST_FADE;
        };
        const onFocus = () => {
          if (ghost.style.opacity !== '0') return; // already lit — nothing to recover
          const last = dragPtRef.current;
          if (last && Number.isFinite(last.x) && Number.isFinite(last.y)) {
            seat(last.x, last.y);
            ghost.style.opacity = DRAG_GHOST_FADE;
          }
        };
        window.addEventListener('drag', onFlight, true);
        window.addEventListener('dragover', onFlight, true);
        window.addEventListener('dragenter', onFlight, true);
        window.addEventListener('focus', onFocus);
        const dispose = () => {
          window.removeEventListener('drag', onFlight, true);
          window.removeEventListener('dragover', onFlight, true);
          window.removeEventListener('dragenter', onFlight, true);
          window.removeEventListener('focus', onFocus);
          ghost.remove();
        };
        dragGhostDisposeRef.current = dispose;
      }
    } catch {
      /* the ghost is best-effort — the drag itself must never die for it */
    }
  };

  const overCard = (e, id) => {
    const drag = dragRef.current;
    if (!drag || drag.type !== 'card') return;
    // 1.6.5 — THE DROP IS ALLOWED ON THE DRAGGED CARD ITSELF (the fix's
    // own half of "when i drag a card, it works right, but when i let go,
    // it goes back"): the live gap GLIDES the dragged card under the
    // cursor — the whole point of the preview — so by the time the user
    // releases, the element under the pointer is very often the dragged
    // card ITSELF. The old same-card guard returned BEFORE the
    // preventDefault, the browser read the target as a non-drop zone, the
    // drop NEVER fired, and dragend walked the preview home: the card
    // "went back". The preventDefault now speaks FIRST — a drop on the
    // dragged card is allowed and lands the preview (see dropOnCard).
    e.preventDefault();
    // 1.6.7 — THE STILL POINTER'S GUARD: an event at the SAME seat as the
    // last processed dragover is a layout-shift ECHO, never intent — the
    // preview holds its seat (what the board is painting is what the user
    // is looking at; the echo would repaint it around a card the pointer
    // never chose). A first event (no memory yet) always speaks; so does
    // any real movement, however slow.
    const px = typeof e.clientX === 'number' ? e.clientX : null;
    const py = typeof e.clientY === 'number' ? e.clientY : null;
    if (px != null && py != null) {
      const last = dragPtRef.current;
      if (last && Math.abs(last.x - px) < 0.5 && Math.abs(last.y - py) < 0.5) {
        return;
      }
      dragPtRef.current = { x: px, y: py };
    }
    if (drag.id === id) {
      // no hint on the dragged card itself (the gap is the hint), and the
      // preview keeps whatever honest seat it already holds.
      setDropHint((h) => (h && h.id === id ? null : h));
      dropSeatRef.current = null; // a self-hover seats nothing
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - rect.left) / Math.max(1, rect.width);
    // 0.36.0 — THE MIDLINE IS THE MIDLINE ("the offset of when i hold a card
    // that decides if its left or right is off to the right, fix that so its
    // centered properly"): the old 0.34/0.66 bands pushed the left/right
    // boundary two thirds of the way across the card, so a drop had to
    // travel well past the middle before it read RIGHT. One boundary, dead
    // center: the left half says LEFT, the right half says RIGHT.
    const side = rel < 0.5 ? 'left' : 'right';
    // 1.6.5 — THE HINT ONLY SPEAKS WHEN IT CHANGES ("when i drag a card
    // around its laggy"): dragover fires at the pointer's own cadence
    // (every ~animation frame), and the old unguarded setDropHint({ id,
    // side }) built a NEW state object on every single event — a full
    // GridView re-render (the whole MasonryGrid diff included) at 60-120Hz
    // for as long as the pointer moved, on boards whose re-render costs
    // tens of milliseconds: THE drag lag. The updater now returns the SAME
    // object when (id, side) has not changed — React bails out, the
    // re-render never happens, and the drag's renders belong to the honest
    // preview changes alone (the 1.6.4 guards already keep those rare).
    setDropHint((h) => (h && h.id === id && h.side === side ? h : { id, side }));
    // 1.6.8 — THE SEAT MEMORY: the pointer's honest seat lands here on
    // EVERY mode — the no-preview drag commits this seat on release, and
    // the preview drag's drop belt reads it only if the preview somehow
    // never armed (a mid-flight settings flip, a fresh mount): the seat
    // is always the last thing the pointer truly chose.
    // 1.7.2 — THE MEMORY CARRIES ITS OWN POINT ("sometimes when i drag a
    //   card, it would not move the card even if it has a valid
    //   placement, would even show the feedback on the side of the card
    //   but would not move (sometimes)"): the guards that hold the
    //   PREVIEW honest (the hysteresis, the straddle, the toggle band +
    //   its pin) can hold it STALE through an honest crossing — the
    //   pointer truly moved to a new card, the edge glow lit that
    //   card's side, and the release committed the held preview's old
    //   seat instead: the card stayed home while the wall showed it a
    //   seat. The memory now records WHERE it armed (its own pt), so
    //   the drop can tell a memory the pointer honestly crossed to
    //   (>=12px from the preview's arm point — the same threshold the
    //   hysteresis law trusts) from a glide-echo the board's own
    //   repaint provoked (<12px — jitter never crosses it): the honest
    //   memory outranks the stale preview at a resting release, the
    //   echo never does, and what the glow promised is what lands.
    dropSeatRef.current =
      px != null && py != null ? { over: id, side, pt: { x: px, y: py } } : { over: id, side, pt: null };
    // 1.6.8 — THE STILL BOARD ("add an option for settings in performance
    // to allow for live drags preview, when enabled it would be like
    // currently, but when off it will instead just show the shine on left
    // or right of the card and THEN update when i let go"): with the live
    // preview OFF the board holds its seats through the whole flight — no
    // gap opens, no neighbor glides, nothing repaints under the resting
    // cursor; the hovered card's drop-edge glow (the hint above) is the
    // only voice, and the reorder lands with the release as one animated
    // commit. The still-pointer guard above already kept the echoes out;
    // here the arm simply never happens.
    // 1.7.2 — the gate reads the REF (see the flight-truths note above the
    // handlers): the memo'd card's closure may be a mount-era fossil, the
    // ref always speaks the setting's live truth.
    if (!livePreviewRef.current) return;
    // 1.6.9 — THE HYSTERESIS ARM (see armPtRef's own note): with a preview
    // already armed, a new seat only arms after real travel — the jitter
    // dragovers the glide provokes (1-2px) can never re-deal the board, and
    // every honest crossing (tens of px) always can. The FIRST arm of a
    // drag speaks freely (no seat held yet).
    const armPt = armPtRef.current;
    if (
      dragPreviewRef.current &&
      armPt &&
      Number.isFinite(e.clientX) &&
      Number.isFinite(e.clientY) &&
      Math.abs(e.clientX - armPt.x) < 12 &&
      Math.abs(e.clientY - armPt.y) < 12
    ) {
      return;
    }
    // 1.6.4 — THE SEAT-HOLDING LAW ("when dragging a card around, it keeps
    // doing it back and forth as if its instantly reacting to the new card
    // in place"): the 1.6.3 live gap re-seated its preview on every
    // (over, side) CHANGE — but the preview's own glide MOVES the cards
    // under the pointer, and each layout-shift dragover / synthetic
    // dragleave re-armed a different seat: a pointer resting near the
    // dragged card's boundary toggled the board between two orders
    // forever (arm → glide → leave → walk home → over → arm…). Two guards
    // kill the loop at its source, both read against the CURRENT preview
    // order (the state the board is actually painting):
    //   · THE STRADDLE NO-OPS — hovering the card immediately BEFORE the
    //     dragged card's seat with 'right', or immediately AFTER it with
    //     'left', describes the gap that ALREADY lives between them: the
    //     splice would return the same seat, so the preview refuses to
    //     move. This is the exact band the pointer falls into when the
    //     glide slides a neighbor under it — the side flips mid-flight and
    //     the flip lands in the no-op zone instead of a re-arm.
    //   · THE ORDER-EQUALITY GATE — even past the straddle band, a new
    //     (over, side) whose splice returns the SAME order as the current
    //     preview (hovering a farther card whose gap the dragged card
    //     already occupies) never re-renders the board.
    // The dragged card itself was always guarded (the early return above —
    // "a check if the card im hovering over is the same card"); these two
    // are the missing checks for the cards AROUND its new seat.
    // 1.7.2 — the splice math reads the REF (the flight-truths law): the
    // stale closure's `visible` froze at the card's last accepted render —
    // a filter, a class switch or a reorder after that would have had the
    // guards splicing a dead order.
    const baseIds = visibleRef.current.map((c) => c.id);
    const cur = dragPreviewRef.current;
    const curOrder = cur ? previewOrder(baseIds, cur) : baseIds;
    const curIdx = curOrder.indexOf(drag.id);
    const tIdx = curOrder.indexOf(id);
    if (curIdx >= 0 && tIdx >= 0) {
      if (side === 'right' && tIdx === curIdx - 1) return;
      if (side === 'left' && tIdx === curIdx + 1) return;
    }
    const next = { id: drag.id, over: id, side };
    const nextOrder = previewOrder(baseIds, next);
    if (
      curOrder === nextOrder ||
      (curOrder.length === nextOrder.length && curOrder.every((v, i) => v === nextOrder[i]))
    ) {
      return;
    }
    // 1.7.0 — THE TOGGLE-BAND GUARD ("when dragging cards that are enlarged
    // (through right click then enlarge), it would sometimes mess with
    // sorting where some cards would move but then detect there is no room
    // because of the enlarged card then move again, fix that so it doesnt
    // need to move again and would detect it right away on first time"):
    // an ENLARGED card owns a huge hover box, and the two seats on either
    // side of it can paint WILDLY different packs — with a span-2 in the
    // order, "insert before the big card" leaves the early columns open and
    // the packer promotes the enlarged card a whole row up, while "insert
    // after its left neighbor" re-fills the seat the big card was promoted
    // out of and demotes it right back (live-measured: the board flipped
    // between the two arrangements on EVERY dragover while the pointer
    // crossed the enlarged card's contested corner — cards gliding to a
    // seat, the pack's flip relocating the hovered card under the pointer,
    // the next dragover arming the other order, forever: the "move, detect
    // there is no room, move again" the report names). The 12px hysteresis
    // cannot see it — a real pointer crosses the band faster than 12px per
    // flip. The arm history can: a new seat that RETURNS TO THE SEAT THE
    // BOARD PAINTED TWO ARMS AGO, while the pointer has travelled <40px
    // from the last arm, IS the oscillation itself, and the preview holds
    // its current seat instead — one arrangement, painted once, held until
    // the pointer either travels 40px honest px (the band is a few cards
    // wide; a real crossing speaks up) or the drag ends. The first arm of
    // any seat always speaks; the guard only ever refuses the SECOND
    // coming of the SAME flip.
    //
    // 1.7.2 — THE GUARD SPEAKS ONLY WHEN THE DISEASE CAN ("sometimes when
    //   i drag a card, it would not move the card even if it has a valid
    //   placement, would even show the feedback on the side of the card
    //   but would not move (sometimes)"): the pack flip the guard was
    //   born for can ONLY exist while a span-2 card rides the board —
    //   on an all-single wall the packer's seats are monotonic and the
    //   1.6.4 straddle + order-equality gates already kill every
    //   oscillation there is — yet the guard kept arming on EVERY board,
    //   and its pair window (<40px) + its 120px PIN swallowed honest
    //   small crossings on exactly those boards: the pointer crossed a
    //   boundary 20-30px wide (a card's edge band at the default zoom),
    //   the guard named the flip an oscillation, the preview held the
    //   OLD seat, the release committed it — the card refused a valid
    //   placement while the edge glow promised it. The guard (and its
    //   pin) now arm ONLY while the flight actually carries an EXPANDED
    //   card — the one board whose pack can flip — and every all-single
    //   drag speaks the honest crossings the 1.6.9 hysteresis already
    //   guards.
    const hasSpan2 = !!(expandedIdsRef.current && expandedIdsRef.current.size > 0);
    const hist = armHistRef.current;
    const nextKey = `${id}:${side}`;
    // (nx/ny — `px` already speaks the still-pointer guard at the top.)
    const nx = Number.isFinite(e.clientX) ? e.clientX : null;
    const ny = Number.isFinite(e.clientY) ? e.clientY : null;
    // 1.7.0 (the pin half): the FIRST blocked flip also PINS the contested
    // seat — the pair window above would re-admit the same flip every
    // 40px of travel, and a real crossing walks the band in 2-3 such hops
    // (live-measured: base -> A -> B -> A on the way across the enlarged
    // card's corner). While the pin lives, the PINNED key needs 120px of
    // honest travel from the pin's own seat — by which point the pointer
    // has cleared the contested band and the arm it then speaks is the
    // honest one at the pointer's true resting card. A DIFFERENT seat key
    // frees the pin on sight (the pointer genuinely moved to new ground);
    // the drop still reads the armed preview exactly as before.
    // (1.7.2: the pin rides the same span-2 gate as the guard above.)
    const pin = togglePinRef.current;
    if (hasSpan2 && pin) {
      if (pin.key === nextKey) {
        if (nx != null && ny != null && Math.abs(nx - pin.x) < 120 && Math.abs(ny - pin.y) < 120) {
          return;
        }
        togglePinRef.current = null; // the honest crossing clears the band
      } else {
        togglePinRef.current = null; // new ground — the pin retires
      }
    } else if (pin) {
      togglePinRef.current = null; // no span-2 rides the board — the pin retires
    }
    if (hasSpan2 && hist.length >= 2 && hist[hist.length - 2].key === nextKey) {
      const armPt = armPtRef.current;
      if (
        armPt &&
        nx != null &&
        ny != null &&
        Math.abs(nx - armPt.x) < 40 &&
        Math.abs(ny - armPt.y) < 40
      ) {
        togglePinRef.current = { key: nextKey, x: nx, y: ny };
        return;
      }
    }
    armHistRef.current = [...hist.slice(-1), { key: nextKey }];
    dragPreviewRef.current = next;
    // 1.6.9 — the arm-point rides with the seat (the hysteresis law above
    // reads it on every later dragover).
    armPtRef.current = { x: Number.isFinite(e.clientX) ? e.clientX : 0, y: Number.isFinite(e.clientY) ? e.clientY : 0 };
    setDragPreview(next);
  };

  // 1.6.2 — THE HINT'S OWN EXIT (the drop-edge disappear law): the pointer
  // truly left this card (its dragleave crossed the boundary — children
  // never count), so the card's own hint retires and the highlight fades
  // out under its 0.15s flight. Another card's hint is never touched (the
  // next card's dragover arms its own), and a stray leave after the drop
  // lands finds no hint to clear — nothing to do, nothing broken.
  // 1.6.4 — THE PREVIEW HOLDS ITS SEAT on the leave: the 1.6.3 walk-home
  // (leaving a card cleared the gap back to the base order) was the
  // oscillation's other half — the synthetic dragleave a LAYOUT SHIFT
  // fires when the glide moves cards under a resting pointer cleared the
  // preview, the board glided home, the pointer landed back over the
  // card, the preview re-armed, the glide fired another leave… forever
  // ("it keeps doing it back and forth"). The gap now stays seated where
  // the pointer last chose it — the standard sortable read — and only the
  // three true endings retire it: the drop (dropOnCard commits the
  // previewed order), a canceled / sheet-dropped drag (endCardDrag walks
  // everything home), or the pointer's own next honest (over, side) past
  // the guards above. The hint still retires here — its own law, its own
  // clock: the edge glow follows the pointer, the gap follows the intent.
  const leaveCard = (e, id) => {
    // 1.6.7 — THE STILL POINTER'S LEAVE IS AN ECHO, NOT AN EXIT: the
    // synthetic dragleave a layout shift fires (the glide moving cards
    // under a resting cursor) carries the SAME coordinates as the last
    // processed dragover — the pointer never went anywhere, the CARD did.
    // Clearing the hint on that echo killed the edge glow under a resting
    // cursor mid-drag (and the paired echo-dragover, skipped by its own
    // guard, never re-armed it). A leave at a moved seat is the pointer
    // truly crossing out: the hint retires exactly as the 1.6.2 law
    // always spoke.
    const last = dragPtRef.current;
    if (
      last &&
      typeof e?.clientX === 'number' &&
      Math.abs(last.x - e.clientX) < 0.5 &&
      Math.abs(last.y - e.clientY) < 0.5
    ) {
      return;
    }
    setDropHint((h) => (h && h.id === id ? null : h));
  };

  const dropOnCard = (e, id) => {
    const drag = dragRef.current;
    e.preventDefault();
    setDropHint(null);
    if (!drag || drag.type !== 'card') return;
    // 1.6.7 — THE COMMIT IS THE PREVIEW, FULL STOP ("when i drag cards
    // around, it does settle but its as if there is another orientation
    // calculated after, sometimes its not even related to the card itself
    // and its just some other cards, like i drag, it shows me an
    // orientation, i let go and suddenly other cards change"): the drop
    // used to re-derive its seat from the DROP EVENT's target and the
    // HINT's side — two sources the flight itself had already lied about
    // (the glide parks whichever card under the release, and a synthetic
    // dragleave had often already cleared the hint, defaulting the side
    // to 'left'): the commit spliced a DIFFERENT order than the one the
    // board was painting, and unrelated cards walked to new seats the
    // instant the finger let go. The commit now speaks ONE source — the
    // CURRENT preview (dragPreviewRef), the exact (over, side) whose
    // splice the wall has been painting all along — for a self-drop, a
    // neighbor drop, every drop: what you saw is what lands. A drop with
    // NO preview is a true no-op (the pointer never chose a new seat —
    // nothing commits, nothing snaps).
    //
    // 1.6.8 — THE STILL BOARD'S OWN COMMIT ("when off it will instead just
    // show the shine on left or right of the card and THEN update when i
    // let go"): with LIVE DRAG PREVIEW off no preview ever armed, so the
    // commit speaks the SEAT MEMORY instead — the pointer's last honest
    // (over, side), the exact card whose edge glow was lit under the
    // release. One law, two voices: the live drag commits the picture the
    // board was painting; the still drag commits the seat the glow was
    // naming — and neither ever re-derives from the drop event's own
    // target.
    const preview = dragPreviewRef.current;
    const mem = dropSeatRef.current;
    // 1.7.2 — the branch reads the REF (the flight-truths law above the
    // handlers): a stale closure frozen at liveDragPreview=true took the
    // preview branch with a preview that never armed and committed
    // NOTHING — the "would not move even if it has a valid placement"
    // report, live-verified.
    const live = livePreviewRef.current;
    let seat =
      live || preview
        ? preview && preview.id === drag.id && preview.over != null
          ? { over: preview.over, side: preview.side }
          : null
        : mem && mem.over !== drag.id
          ? { over: mem.over, side: mem.side }
          : null;
    // 1.7.2 — THE GLOW'S PROMISE OUTRANKS A HELD PREVIEW ("sometimes when i
    //   drag a card, it would not move the card even if it has a valid
    //   placement, would even show the feedback on the side of the card
    //   but would not move (sometimes)"): the preview the 1.6.7 law
    //   commits is the truth the board PAINTS — but the guards that keep
    //   it honest (the 1.6.9 hysteresis, the straddle, the 1.7.0 toggle
    //   band + pin) can also hold it STALE while the pointer honestly
    //   crosses onto new ground: the edge glow — armed on EVERY
    //   processed dragover, never throttled by a guard — promised the
    //   new seat, the release committed the held one, and the card
    //   refused a valid placement the wall had just shown it. At a
    //   RESTING release the seat memory now outranks the preview when
    //   the two disagree AND the memory armed at least 12px from the
    //   preview's own arm point — the same threshold the hysteresis
    //   law uses to name an honest crossing (a glide-echo arms within
    //   a couple px of the resting pointer and can never pass it, so
    //   the 1.6.7 "the board repaint cannot lie" law keeps its whole
    //   voice there). The 1.6.9 traveling re-derivation below keeps
    //   the fast release exactly as it always spoke.
    if (
      live &&
      seat &&
      preview &&
      preview.id === drag.id &&
      mem &&
      mem.pt &&
      mem.over !== drag.id &&
      (mem.over !== preview.over || mem.side !== preview.side)
    ) {
      const armPt = armPtRef.current;
      if (
        armPt &&
        (Math.abs(mem.pt.x - armPt.x) >= 12 || Math.abs(mem.pt.y - armPt.y) >= 12)
      ) {
        seat = { over: mem.over, side: mem.side };
      }
    }
    // 1.6.9 — THE FRESH-SEAT DROP ("the same issue where the cards viewer
    //   cards would shuffle on multiple turns when i drag a card around or
    //   let go still, fix that"): the commit sources above are the last
    //   ARMED state — and on a fast release they are STALE: the drop can
    //   land tens of pixels ahead of the last processed dragover (the OS
    //   fires drop without a final dragover at the release point), so the
    //   board painted a seat behind the one the eye actually rests on, and
    //   the commit's re-pack moved OTHER cards the instant the finger let
    //   go — the "after i let go i see things shift around again" half of
    //   the report. The drop now compares its own coordinates against the
    //   last processed dragover seat (dragPtRef): a resting release (< 4px
    //   of travel) keeps the armed truth exactly as the 1.6.7 law spoke
    //   it — the echoes and glided-in cards can never lie here — while a
    //   TRAVELING release re-derives the seat from the card the drop
    //   actually landed on and the drop's own midline side (the 0.36 law,
    //   computed fresh from the event's coordinates, never the
    //   possibly-cleared hint): what the eye saw under the finger at the
    //   instant of release is what lands. A drop on the dragged card
    //   itself keeps the armed truth in every case (the 1.6.5 self-drop
    //   law — the flown card is not a seat).
    const lastPt = dragPtRef.current;
    const traveled =
      lastPt &&
      Number.isFinite(e.clientX) &&
      Number.isFinite(e.clientY) &&
      (Math.abs(e.clientX - lastPt.x) > 4 || Math.abs(e.clientY - lastPt.y) > 4);
    if (traveled && id !== drag.id) {
      try {
        const rect = e.currentTarget.getBoundingClientRect();
        const rel = (e.clientX - rect.left) / Math.max(1, rect.width);
        seat = { over: id, side: rel < 0.5 ? 'left' : 'right' };
      } catch {
        /* a targetless drop (the sheet) keeps the armed truth */
      }
    }
    dragPreviewRef.current = null;
    armPtRef.current = null;
    setDragPreview(null);
    dragRef.current = null;
    dropSeatRef.current = null;
    if (seat && seat.over != null && seat.over !== drag.id) {
      onReorder(drag.id, seat.over, seat.side);
    }
  };

  const endCardDrag = () => {
    // 1.7.0 — the suppression window re-arms at every ending (see
    // suppressOpenUntilRef): the click a dying drag can still speak lands
    // inside this tail, never on the view.
    suppressOpenUntilRef.current = Date.now() + 280;
    // 1.5.9 — the OWNED flight's belt first (see startCardDrag): whatever
    // became of the drag — drop, cancel, Escape — the ghost element and
    // its two window listeners leave with it, from a ref no sibling
    // handler can have cleared on the way here.
    dragGhostDisposeRef.current?.();
    dragGhostDisposeRef.current = null;
    // 1.5.4 — the ghost's belt: whatever became of the drag, the snapshot
    // node never outlives it (see startCardDrag's ghost note).
    dragRef.current?.ghost?.remove?.();
    dragRef.current = null;
    dragPtRef.current = null;
    setDropHint(null);
    // 1.6.8 — the seat memory leaves with the drag too (a canceled flight
    // seats nothing, whichever preview law was speaking).
    dropSeatRef.current = null;
    // 1.6.9 — the arm-point too (see overCard's hysteresis law).
    armPtRef.current = null;
    // 1.6.3 — the live gap walks home too: a canceled or sheet-dropped
    // drag leaves no preview behind (dropOnCard already cleared its own —
    // this is the belt for every OTHER ending).
    dragPreviewRef.current = null;
    setDragPreview(null);
    // 1.6.2 — the root's gd-card-drag still left with the 1.4.4 law above
    // (retired wholesale — the shine never interrupts, drag included).
  };

  const renderItem = (id) => {
    if (id === ADD_FIRST || id === ADD_LAST) {
      return <AddCard onNew={onNew} cardRatio={addRatio} cardWidth={cardWidth} />;
    }
    const character = visible.find((c) => c.id === id);
    if (!character) return null;
    // 1.1.8 — an EXPANDED card speaks the doubled width: the art box keeps
    // its aspect ratio and the foot's type rides the same --card-scale law
    // a zoomed card follows (the +gap is the seam the two columns swallow).
    const expanded = !!(expandedIds && expandedIds.has?.(character.id));
    return (
      <CharacterCard
        character={character}
        tagsById={tagsById}
        imagesPath={imagesPath}
        tagScale={tagScale}
        tagPosition={tagPosition}
        tagLimit={tagLimit}
        tagSeparation={tagSeparation}
        defaultRatio={cardRatio}
        cardWidth={expanded ? cardWidth * 2 + 20 : cardWidth}
        spotStamps={spotStamps}
        stampLibrary={stamps}
        spotDim={
          spotActive &&
          !hideNon &&
          spotlightMatchState(character, spotFilter, stamps) === 'nomatch'
        }
        selected={selectedId === character.id}
        onOpen={() => {
          // 1.7.0 — the drag's own click never opens (see
          // suppressOpenUntilRef at startCardDrag): a click inside a live
          // drag's breath or its 280ms tail is the carry speaking, never
          // the reader's. The comparator ignores function props — the
          // fresh closure never costs the card's memo a re-render.
          if (dragRef.current?.type === 'card') return;
          if (Date.now() < suppressOpenUntilRef.current) return;
          onOpen(character.id);
        }}
        onDelete={() => onDelete(character)}
        dropSide={dropHint?.id === character.id ? dropHint.side : null}
        onCardDragStart={startCardDrag}
        onCardDragOver={overCard}
        onCardDragLeave={leaveCard}
        onCardDrop={dropOnCard}
        onCardDragEnd={endCardDrag}
      />
    );
  };

  const empty = visible.length === 0;

  // CORNER ribbons overlap the card itself — no extra head room. MARK
  // ribbons keep a small head above the card's top edge (the rest hangs
  // down INTO the art), so the grid's top padding makes room for that head.
  const gridPadTop = tagPosition === 'mark' ? 20 + markRibbonHeadRoom(tagScale) : 20;

  return (
    // 0.31.0 — data-gd-region: the app-level right-click menu reads this to
    // pick the region's own item set. The ROOT is the CARD VIEWER surface
    // ("on the card viewer empty area it will show create a new card,
    // undo, redo, settings"); the toolbar row below overrides with the
    // HEADER region. Cards carry their own data-gd-char-id and win first.
    <div ref={viewerRef} data-gd-region="viewer" className="h-full flex flex-col min-w-0">
      {/* 0.14.0 — the viewer's TOP HEADER. 0.19.0: it wears the VIEWER's
          own surface class now (same base color, same pattern, same origin)
          so the pattern flows through the bar seamlessly — the old tinted,
          phase-shifted strip read as offset from the coloring and clipped
          against it. The structural gd-edge-b hairline separates it from
          the card body below.
          0.30.0 — THE TWO PATTERNS ("the card viewer area and the header
          should not share the same pattern"): the header row wears the TOP
          TOOLBAR's own surface (gd-tex-titlebar) while the card area below
          carries the VIEWER's pattern ON ITS SCROLLER (see MasonryGrid) —
          scrolling the cards moves the viewer pattern under a header whose
          pattern stays put, like the right panel's header vs its body.
          1.2.2 made this row a drag bar (the titlebar's lower half); 1.2.4
          RETIRES IT ("fix that so its ONLY the most top toolbar that does
          that"): Electron's drag regions are registered from the DOM no
          matter what paints above them — this row stays MOUNTED under the
          full-window card view (the 0.30.0 law), so its drag rect swallowed
          the cover's own header keys (card settings / expand-name / pin sat
          exactly on top of it: clicks dead, a hold-and-drag MOVED THE
          WINDOW) and the toast pills floating over the bar never answered
          the pointer. The window now drags from the real top bar ALONE —
          the 40px titlebar strip — and every interactive child law below
          stays for that bar only. */}
      {/* 1.2.6 — THE PRESS CLEARS THE PILL (the toolbar-row drag stays
          RETIRED, per the 1.2.4 law below — restoring it would swallow the
          full-window cover's keys again): the user's "when i hover over the
          top toolbar, then the tooltip shows, when i hold and drag it
          doesnt drag the screen" dies in GdTooltips now — ANY pointerdown
          ends the visible pill and mutes focusin for a beat, so the press
          lands on a clean bar exactly as if the tooltip never appeared, and
          the window drag (the 40px titlebar strip, the one true handle)
          answers normally. */}
      <div data-gd-region="header" className="flex items-center gap-3 px-6 py-3 gd-edge-b flex-shrink-0 flex-wrap gd-tex-titlebar">
        <div className="relative flex-shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gd-mute pointer-events-none" />
          {/* 0.22.0 — SEARCH CARDS (not "characters") and a SOLID field: the
              input is opaque now, so the viewer header's background pattern
              never shines through the box — no more see-through search area.
              1.0.5 — THE × KEY: while the field carries text, a small × rides
              its right edge; pressing it empties the field in one tap.
              1.0.6/1.0.7 — the key moved into the field's own seat and then
              stepped off the border (5px).
              1.0.8 — AND THE TEXT ENDS BEFORE IT ("text clips into the x in
              search container, fix that so it doesnt and cuts before it"):
              while the × is mounted the field wears gd-input-has-x — 26px
              of right padding that clear the key's whole seat — so the
              glyphs now cut BEFORE the key instead of scrolling under it.
              The seat exists only while there is text to clear. */}
          <input
            className={clsx('gd-input gd-input-icon gd-input-solid w-60', search && 'gd-input-has-x')}
            placeholder={advancedSearch ? 'Search names, prompts, versions…' : 'Search cards…'}
            spellCheck={false}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            title={advancedSearch ? 'Search names, prompts, versions' : 'Search cards by name'}
          />
          {search && (
            <button
              type="button"
              className="gd-search-clear"
              title="Clear the search"
              aria-label="Clear the search"
              onClick={() => onSearch('')}
            >
              <X size={11} />
            </button>
          )}
        </div>

        <SortMenu sortMode={sortMode} onSort={onSort} />

        <SpotlightMenu
          tags={tags || []}
          stamps={stamps || []}
          imagesPath={imagesPath}
          spotlight={spotlight || { include: [], exclude: [], stamps: [], stampExclude: [], hideNonMatching: false }}
          onCycleSpotlight={onCycleSpotlight}
          onCycleStampSpotlight={onCycleStampSpotlight}
          onToggleSpotlightHide={onToggleSpotlightHide}
        />

        {/* 0.27.0 — THE SIZE SLIDERS ARE BACK (they lived here before the
            0.24.0 move to settings — "readd the tag scale and the card scale
            back to the toolbar where it was while also keeping it in
            settings"). Both stay in SETTINGS → LOOK too: same keys, two
            handles. 0.30.0 — tooltips trimmed to the short form ("some
            tooltips seem to be too long, like the top buttons or the size
            sliders"). */}
        {onZoom && (
          <SizeSlider
            icon={Maximize2}
            label="Card size"
            title="Card size (1–10)"
            min={ZOOM_RANGE.min}
            max={ZOOM_RANGE.max}
            step={1}
            value={zoom}
            fmt={(v) => `${v}`}
            onChange={onZoom}
          />
        )}
        {onTagScale && (
          <SizeSlider
            icon={Tags}
            label="Tag size"
            title="Tag size (×0.6–×2)"
            min={TAG_SCALE_RANGE.min}
            max={TAG_SCALE_RANGE.max}
            step={0.1}
            value={tagScale ?? TAG_SCALE_RANGE.default}
            fmt={(v) => `\u00d7${Number(v).toFixed(1)}`}
            onChange={onTagScale}
          />
        )}
        {/* 0.47.0 — TAG SEPARATION in the toolbar beside the tag size (same
            key as the Look tab's slider — one setting, two handles). The
            ribbon row clamps itself to the card, so this only raises the
            ceiling; negative values stack the ribbons deeper. */}
        {onTagSeparation && (
          <SizeSlider
            icon={ArrowUpDown}
            label="Tag gap"
            title="Tag separation: negative overlaps the ribbons, positive spreads them (the row never leaves the card)"
            min={TAG_SEPARATION_RANGE.min}
            max={TAG_SEPARATION_RANGE.max}
            step={1}
            value={tagSeparation ?? TAG_SEPARATION_RANGE.default}
            fmt={(v) => `${Number(v) > 0 ? '+' : ''}${Number(v)}px`}
            onChange={onTagSeparation}
          />
        )}

        {/* 0.33.0 — CARDS, not characters ("it should instead be cards"). */}
        <div className="ml-auto text-[10px] tracking-[0.22em] text-gd-mute truncate max-w-[30vw]">
          {classLabel ? `${classLabel.toUpperCase()} · ` : ''}
          {visible.length} CARD{visible.length === 1 ? '' : 'S'}
        </div>
      </div>

      {/* 1.0.5 — THE SEARCH SURVIVES THE WALK ("when i have an ongoing search
          then i switch to another class, it shouldnt cancel it, it should
          still remain still, if there is no results, add a button below the
          no matches explanations to cancel the search, which will clear the
          search"): the search text lives in App, above the class tree —
          switching classes keeps it (a new class is just a new crowd for the
          same question). When the new crowd has no answer, the NO MATCHES
          card carries a CANCEL SEARCH key under the explanation: one press,
          the field empties, the crowd returns. */}
      {empty ? (
        <div className="flex-1 min-h-0 overflow-y-auto gd-tex-viewer">
          <div className="h-full min-h-[420px] flex flex-col items-center justify-center gap-4">
            <span className="gd-empty-mark">✖</span>
            <div className="text-center">
              <div className="font-display text-xl font-bold text-gd-chrome">
                {search || spotActive ? 'NO MATCHES' : 'EMPTY CLASS'}
              </div>
              <div className="mt-2 text-[11px] text-gd-mute max-w-sm text-center leading-relaxed">
                {search || spotActive
                  ? 'Nothing matches the current search / tag filter.'
                  : 'Nothing cataloged here yet. Create a card, or drag one in from another class.'}
              </div>
            </div>
            {search ? (
              <button className="gd-btn gd-btn-solid" onClick={() => onSearch('')} title="Clear the search text: every card returns">
                <X size={14} />
                CANCEL SEARCH
              </button>
            ) : !spotActive ? (
              /* 1.0.7 — THE EMPTY STATE'S KEY SPEAKS TOO ("new card button
                  when teh class is empty has the wrong tooltip"): the
                  empty-class NEW CARD key used to carry no tooltip at all,
                  so the only verdict the viewer ever offered here was
                  silence. It now says exactly what pressing it does, in the
                  same voice as the grid's own add-card tile. */
              <button
                className="gd-btn gd-btn-solid"
                onClick={onNew}
                title="Create a new card in this class"
              >
                <Plus size={14} />
                NEW CARD
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <MasonryGrid
          /* 1.1.5 — overflow-x-hidden, EXPLICIT ("for some reason i can
             scroll to the right when i open the detail pannel, fix that"):
             a scroller that says overflow-y:auto and nothing else computes
             its overflow-x to AUTO, so the moment the viewer column got
             squeezed (a wide panel + a wide tree on a narrow window) the
             card area grew a real sideways scrollbar. The card wall is a
             vertical animal — it never scrolls sideways, now by law.
             1.2.9 — THE RIGHT MARGIN YIELDS TO THE SCROLLBAR ("fix the
             issue where the cards would organize while making the right
             pannel smaller when there is still some space left for them
             (usually maybe the hitbox is too big especially for the
             scrollbar on the side"): the wall's usable width loses the
             LEFT padding (24), the RIGHT padding (24) AND the scrollbar's
             own 10px gutter — 58px of dead margin on the right before a
             new column can ever land, so every column crossing looked
             premature (measured live: at the 2-to-3 column crossing the
             wall held ~230px of visible air beside a 250px card). The
             right padding drops to 14px: the scrollbar's gutter reads as
             the rest of the margin (10 + 14 ≈ the left's 24), the wall
             gains 10px of usable width, and the next column arrives a
             drag-step earlier — the crossings finally match what the eye
             says the room allows. */
          className="h-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden pl-6 pr-3.5 pb-10 gd-tex-viewer"
          style={{ paddingTop: gridPadTop }}
          cardWidth={cardWidth}
          gap={20}
          itemIds={itemIds}
          /* 1.1.8 — the expanded seats ride the wall (see the expandedIds
             prop): span-2 wrappers, doubled widths, the layout's pair law. */
          expandedIds={expandedIds}
          flighting={flighting}
          /* 1.9.6 — THE WALL FOLLOWS THE OPEN CARD (see MasonryGrid's own
             law): the selected card stays fully in view through the
             panel's width flight, every re-pack, and its own selection —
             the "chaotic" resize jump the report names, answered at the
             wall's own seat. */
          keepInViewId={selectedId}
          renderItem={renderItem}
          onMouseOver={shineArm}
          onAnimationEnd={shineRetire}
        />
      )}
    </div>
  );
}

// The "new card" slot — mirrors the card next to it: same aspect ratio,
// same footer structure (title line + meta line), so heights always match.
// 0.47.0 — A SEE-THROUGH DARK INTERIOR ("darken the inside of the new card
// creation area so its easier to read on the background pattern, but at the
// same time it should be see through and text more readable"): the tile used
// to be fully transparent, so the viewer's pattern ran straight under the
// NEW CARD text. It now carries a translucent workspace-tinted wash (see
// .gd-card-add in index.css) — the pattern still shows through, the text
// reads over it.
// 1.4.8 — THE TILE ANSWERS THE PRESS ("add feedback to pressing on new card
// button in the grid"): every real card answers a press with the jelly
// breath; the NEW CARD tile used to sit dead under the finger — no motion,
// no acknowledgment, the one key in the grid that felt unpressed. The tile
// carries the SAME flight now (the [data-pressed] attribute law — see
// .gd-card-pulse in index.css): one squash-and-settle on every left/right
// press, retired by its own animationend, riding straight through any
// re-render (the window it opens never interrupts it — the 1.4.7 attribute
// law, the 1.4.8 never-interrupted gate).
const AddCard = memo(function AddCard({ onNew, cardRatio, cardWidth }) {
  const scale = Math.min(1.3, Math.max(0.7, cardWidth / 185));
  const pulseRef = useRef(null);
  // 1.5.0 — the same stale-flight clock the grid card speaks (see the
  // firePulse note above): a re-press landing after a prior flight's end
  // must not have its fresh attribute stripped by the old flight's late
  // animationend.
  const pulseAtRef = useRef(0);
  // 1.9.12 — THE PRESS DIAL'S OWN GATE (the CardRow law, verbatim — see
  // the gate note at the grid card's firePulse): 'none' never arms, so
  // no [data-pressed] seat lingers on the tile either.
  const pressMode = () => {
    const mode =
      typeof document !== 'undefined' && document.documentElement
        ? document.documentElement.getAttribute('data-gd-press-mode')
        : null;
    return mode === 'squish' || mode === 'pulse' ? mode : 'none';
  };
  const firePulse = (e) => {
    if (e && typeof e.button === 'number' && e.button !== 0 && e.button !== 2) return;
    if (pressMode() === 'none') return; // the dial's silence is the arm's own
    const el = pulseRef.current;
    if (!el || typeof el.setAttribute !== 'function') return;
    el.removeAttribute('data-pressed');
    void el.offsetWidth;
    el.setAttribute('data-pressed', '1');
    pulseAtRef.current = Date.now();
  };
  return (
    <div
      ref={pulseRef}
      className="gd-card-add gd-card-pulse relative rounded-gd border-2 border-dashed border-gd-line hover:border-gd-chrome cursor-pointer transition-colors group select-none"
      style={{ ['--card-scale']: scale }}
      role="button"
      tabIndex={0}
      onClick={onNew}
      onPointerDown={firePulse}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && (e.animationName === 'gd-press-pulse' || e.animationName === 'gd-press-bloom')) {
          // 1.5.0 — the stale-flight guard (see firePulse's clock note).
          if (Date.now() - pulseAtRef.current < 600) return;
          e.currentTarget.removeAttribute('data-pressed');
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          firePulse();
          onNew();
        }
      }}
      title="Create a new card"
    >
      {/* 1.6.8 — THE BOX BREATHES (see .gd-card-add-box in index.css): the
          tile mirrors its neighbor's ratio, and a ratio change (a drag
          landing a new card at the boundary, a look edit on the first
          card) tweens its aspect on a 0.24s ease instead of snapping —
          the top-left container animates, and the board's pack tracks it
          frame by frame through the masonry's own measure. */}
      <div
        className="gd-card-add-box flex flex-col items-center justify-center gap-3"
        style={{ aspectRatio: `${cardRatio.w} / ${cardRatio.h}` }}
      >
        <Plus size={26} className="gd-card-add-ink text-gd-mute group-hover:text-gd-chrome transition-colors" />
        <span className="gd-card-add-ink tracking-[0.28em] text-gd-mute group-hover:text-gd-chrome transition-colors" style={{ fontSize: `${9 * scale}px` }}>
          NEW CARD
        </span>
      </div>
      {/* Same two-line footer as a real card (invisible title line) so the
          name area height matches the card it sits next to. */}
      <div className="gd-card-foot gd-hairline-t flex items-center justify-between gap-2" style={{ borderTop: '1px dashed var(--gd-line)' }}>
        <div className="min-w-0 flex-1">
          <div className="gd-card-title font-display font-bold leading-tight truncate invisible" aria-hidden>
            NEW
          </div>
          <div className="gd-card-add-ink gd-card-meta tracking-[0.22em] text-gd-mute group-hover:text-gd-chrome transition-colors">ADD NEW</div>
        </div>
      </div>
    </div>
  );
});
