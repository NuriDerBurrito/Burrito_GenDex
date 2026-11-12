import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Maximize2, Pipette, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { CardFinishLayer, CardPreview, FINISH_GROUND, TrimCoatLayer, cropFrame, finishGroundTone, finishTintLean, trimClasses, trimCoatInk } from './TagRibbon.jsx';
import { ColorPickerPanel } from './ColorPicker.jsx';
import Popover from './Popover.jsx';
import { RichText } from './RichText.jsx';
import { CARD_TRIMS, DEFAULT_CARD_TRIM, RATIO_PRESETS } from '../constants/index.js';
import { finishStrength } from './TagRibbon.jsx';
import { autoCropFor, clampCrop, counterRimFor, effectiveCrop, isExtremePlateHex, readableInk } from '../utils/helpers.js';

// Measure an image's natural aspect once (naturalWidth / naturalHeight).
export function useImageAspect(url) {
  const [aspect, setAspect] = useState(null);
  useEffect(() => {
    if (!url) {
      setAspect(null);
      return;
    }
    let alive = true;
    const img = new Image();
    img.onload = () => {
      if (alive) setAspect(img.naturalWidth > 0 && img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1);
    };
    img.onerror = () => {
      if (alive) setAspect(null);
    };
    img.src = url;
    return () => {
      alive = false;
    };
  }, [url]);
  return aspect;
}

// 1.6.2 — THE TRIM COLOR KEY ("add color options to the trims (overwrites
// the gold trim color too), but unlike the others, its just a button to
// press that opens the colorpicker for the trims, it should also have a
// default option which is the theme's color like currently"): ONE key under
// the trim tiles — not the card color's preset row, just the door. It opens
// the same picker the app's every color speaks, with ONE extra chip above
// it: THEME DEFAULT, the road back to the theme's own trim ink (the exact
// look every card painted before the picker existed). A picked hex wears
// the swatch face; the default wears the pipette. Every trim family
// answers the ink through its own is-user CSS law (see TrimOverlay).
function TrimColorKey({ color, onColor }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const valid = typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color) ? color : null;
  return (
    <span className="gd-trimcolor-key">
      <button
        ref={btnRef}
        type="button"
        className={clsx('gd-btn !px-2 !py-1 w-full justify-center', valid && 'gd-btn-accent')}
        title={
          valid
            ? `Trim color: ${valid} — open the picker to change it, or return to the theme's own trim ink`
            : "The trims follow the theme's own ink — open the picker to give every trim a color of its own (the gold engraving included)"
        }
        onClick={() => setOpen((o) => !o)}
      >
        {valid ? (
          <>
            <span className="gd-trimcolor-swatch" style={{ background: valid }} aria-hidden />
            <span className="flex-1 text-center">TRIM COLOR</span>
            {/* the quick road home — one key, no picker round trip */}
            <span
              role="button"
              tabIndex={0}
              className="gd-trimcolor-reset"
              title="Return to the theme's default trim color"
              onClick={(e) => {
                e.stopPropagation();
                onColor(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onColor(null);
                }
              }}
            >
              <RotateCcw size={11} />
            </span>
          </>
        ) : (
          <>
            <Pipette size={12} />
            <span className="flex-1 text-center">TRIM COLOR</span>
          </>
        )}
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={btnRef} width={232} align="start">
        <div className="p-2">
          <button
            type="button"
            className={clsx('gd-btn !px-2 !py-1 w-full justify-center mb-2', !valid && 'gd-btn-accent')}
            title="Every trim paints in the theme's own ink — the default look"
            onClick={() => {
              onColor(null);
              setOpen(false);
            }}
          >
            <RotateCcw size={11} />
            THEME DEFAULT
          </button>
          <ColorPickerPanel
            color={valid || '#c8402f'}
            onColor={(hex) => onColor(hex)}
            // 1.6.3 — the picker's reset speaks the same road home the
            // quick key beside the label does (the theme's own trim ink).
            onReset={() => onColor(null)}
            compact
          />
        </div>
      </Popover>
    </span>
  );
}

// Miniature live rendering of one trim — the real CSS, so what you pick is
// exactly what lands on the card.
// 1.5.4 — THE CHIP BECOMES A TILE ("rework the trim buttons, both in edit
// card and create card"): the old chip boxed a 28x20 sliver of trim behind
// a wrapped 8px caption and a hairline border that read as clutter at both
// seats (the edit window's two-column rail and the create window's
// three-column row). The tile language the texture options just learned:
// a full-width TALL face carrying the trim at a size the material can
// actually speak (the dashes read as dashes, the scallops curve, the
// gallery brackets bracket), a single-line caption underneath that
// ellipsizes (the tooltip holds the whole name), and the hover/active
// ring every picker in the app wears.
function TrimChip({ trim, active, onClick }) {
  const { overlay } = trimClasses(trim);
  const label = CARD_TRIMS.find((t) => t.id === trim)?.label || trim;
  return (
    <button
      type="button"
      className={clsx('gd-trim-chip', active && 'is-active')}
      title={label}
      onClick={() => onClick(trim)}
    >
      <span className="gd-trim-chip-face">
        {overlay && <span className={clsx('gd-trim', overlay)} aria-hidden />}
      </span>
      <span className="gd-trim-chip-name">{label}</span>
    </button>
  );
}

// 1.6.2 — THE PREVIEW'S OWN LADDER RUNG (the "low quality placeholder
// (aka the thumbnail) when it loads at the start then the full later" half
// of the edit-window report): tracks whether the FULL file has decoded —
// until it does, the thumb tier underneath IS the picture; the moment it
// lands it cross-fades over its own low-res self. A decoded thumb (or no
// separate tier at all — the creation window's preview already speaks the
// thumb) reads instantly, so the window never opens on a blank frame.
function useFullImgLoaded(url) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!url) {
      setLoaded(false);
      return undefined;
    }
    let alive = true;
    const el = new Image();
    el.onload = () => {
      if (alive) setLoaded(true);
    };
    el.onerror = () => {
      if (alive) setLoaded(false);
    };
    el.src = url;
    return () => {
      alive = false;
    };
  }, [url]);
  return loaded;
}

// The interactive card preview itself: DRAG the image to place it (the crop
// follows the pointer 1:1), SCROLL to zoom in/out. No frame, no handles —
// what you see is the actual card.
// 0.17.0 — STAMPS render here too (the card's top stamp). 0.20.0 — the
// stamp is PASSIVE art: no transformer, no dragging (only the IMAGE is
// draggable). Its placement / size / angle are edited through the STAMP
// SETTINGS popover beside its slot — X / Y / SCALE / ROTATION sliders +
// the OUTSIDE switch — and the preview just mirrors the committed values.
// The 0.20.0 root-cause fix: --stamp-rot carries its DEGREES unit inline
// ("45deg") — a unitless number made rotate(45) invalid at computed-value
// time, which collapsed the WHOLE transform (translate + rotate + scale)
// and sent the sticker jumping to its top-left corner — the "sliders break
// / the stamp never rotates / nothing aligns" bug.
function PanZoomPreview({
  name,
  imageUrl,
  // 1.6.2 — the light tier (the thumb): painted first, the full file
  // cross-fades over it when it decodes (the progressive ladder).
  imageThumbUrl = null,
  imgAspect,
  ratio,
  trim,
  // 1.6.2 — the trim's own ink (the picker's seat — TrimOverlay's law):
  // null keeps the theme's own trim.
  trimColor = null,
  crop,
  onChange,
  versions = 1,
  date = '',
  width = 148,
  stampUrl = null,
  stampHueHex = null,
  stampHueAlpha = 0.88,
  stampPos = null,
  stampScale = 1,
  stampRot = 0,
  stampClip = false,
  stampAlpha = 1,
  stampHueOver = false,
  stampHueOverTrim = false,
  cardColor = null,
  // 1.3.8 — the card's own looks, one voice with the grid card (see
  // CardLookEditor's own props below). 1.3.9 — the finish alone rides
  // the preview (the secondary color and the pattern left with the
  // feature).
  finish = 'none',
  finishOnImage = false,
  // 1.4.5 — the coat's reach switch (trim), one voice with the grid card
  // (see CardFinishLayer + the ladder law in index.css). 1.7.2 — the stamp
  // reach is retired with the option ("delete the stamp effect option").
  finishOnTrim = false,
  // 1.4.1 — IMAGE MOTION, the sway switch (one voice with the grid card).
  imageMotion = false,
  // 1.4.7 — STAMP MOTION ("add stamp motion too, which when checked will
  // move the stamp alongside the image with a slight delay"): the band +
  // any placed sticker in the preview follow the art's sway a beat behind
  // it — what you frame is what you get.
  stampMotion = false,
  // 1.9.5 — THE COAT'S OWN VOLUME: the transparency knob, painted by the
  // panzoom at the coat's true strength (the knob's own preview law —
  // what you slide in the window beside is what the card ships).
  finishTransparency = null,
  // 1.9.6 — THE SPLIT VOLUME: the checkbox + the image knob, painted by
  // the panzoom with the same law (the art twin reads the second knob,
  // the plate twins the main one — what you slide is what you ship).
  finishSplitImage = false,
  finishImageTransparency = null,
}) {
  // 1.4.5 — THE FINISH'S OWN TEXT RIM (the grid card's law, verbatim): the
  // plate-colored seat computes its rim from the ink it actually paints;
  // the themed seat falls to the theme's own counter token.
  // 1.7.4 — the finish's own ground earns its rim the same way (the grid
  // card's finishGround law, verbatim — see FINISH_GROUND in TagRibbon).
  // 1.9.2 — THE GROUND LISTENS TO THE CLOTH (see FINISH_GROUND in
  // TagRibbon): the ground is a color-mix over the theme's own panel now,
  // not a hex readableInk could read — the ink/rim seats fall to the
  // theme's own tokens, the same voice the uncoated themed card always
  // spoke.
  const finishGround = finish !== 'none' && !cardColor ? FINISH_GROUND[finish] || null : null;
  const plateInk = cardColor ? readableInk(cardColor) : null;
  const finRim = plateInk ? counterRimFor(plateInk) || 'var(--gd-text-counter)' : 'var(--gd-text-counter)';
  // 0.44.0 — THE BOX LIVES IN STATE, NOT A SILENT REF ("the scroll issue
  // still persists in the card creation menu, specifically in the card
  // preview — when i scroll up it would scroll up and down rapidly").
  // Every window re-seats through the Modal's LAZY PORTAL (the card is
  // rendered once inline, then re-rendered into document.body by a layout-
  // effect state flip): the re-seat builds FRESH DOM nodes, and a wheel
  // listener attached in a []-effect can land on the DEAD pre-portal node
  // — the live preview then never consumes the wheel, the window's body
  // scrolls instead, and the page fights the pointer (the 0.39 lesson the
  // cap grip already learned). A callback ref hands the wheel effect the
  // LIVE node on every re-seat, so the listener always sits where the
  // pointer actually is.
  const [boxEl, setBoxEl] = useState(null);
  // 1.6.2 — the ladder's top rung: has the FULL file decoded yet? (See
  // useFullImgLoaded above — the thumb below is the picture until it has.)
  const fullLoaded = useFullImgLoaded(imageUrl);
  // 0.45.0 — THE WHEEL IS RETIRED ("i want the scroll bug to be gone for
  // good, even if it means removing the whole scroll functionality"). Four
  // straight versions chased the scroll-to-zoom stutter (0.42 direction,
  // 0.43 compounding base, 0.44 live node + echo guard) and the wheel kept
  // oscillating on some devices — one zoom-in tick answered by one zoom-out
  // tick. The gesture is GONE from the card preview: zoom lives in three
  // plain keys under the card (− / reset / +), the drag still pans, and a
  // wheel over the card now simply scrolls the window like anywhere else.
  const dragRef = useRef(null); // { startX, startY, crop }
  const [dragging, setDragging] = useState(false);

  const r = ratio && ratio.w > 0 && ratio.h > 0 ? ratio : { w: 3, h: 4 };
  const eff = effectiveCrop(crop, r, imgAspect);
  const { overlay } = trimClasses(trim || DEFAULT_CARD_TRIM);
  // 1.6.2 — the picker's ink, validated once (TrimOverlay's own law).
  // 1.7.6 — THE INK NEVER MOVES (trimCoatInk in TagRibbon): the REAL trim
  // speaks the trim's own ladder at rest too — one voice with the coat's
  // clone below, so arming the trim effect can never re-ink the panzoom's
  // ring.
  // 1.7.7 — THE TRIM'S OWN VOICE (trimCoatInk in TagRibbon): the
  // card-color rung is retired — the panzoom's ring speaks the picker's
  // word or the theme's own default, never the card's borrowed color.
  const trimUserInk = trimCoatInk(trim || DEFAULT_CARD_TRIM, trimColor);
  const placed = !!(stampPos && Number.isFinite(stampPos.x) && Number.isFinite(stampPos.y));
  // 1.6.2 — the hue's own seat while the coat rides over the trim (the
  // grid card's law — see GridView's coatOverTrim note): while TRIM EFFECT
  // lifts the band/free layer to z 5, their inner washes stand down and a
  // single z-2 wash (gd-hue-band-own) seats the tint under the trims.
  const coatOverTrim = finish !== 'none' && finishOnTrim;
  const scale = Number.isFinite(Number(stampScale)) && Number(stampScale) > 0 ? Number(stampScale) : 1;
  const rot = Number.isFinite(Number(stampRot)) ? Number(stampRot) : 0;
  // 0.21.0 — the stamp ART's own transparency (default fully solid).
  const artAlpha = Number.isFinite(Number(stampAlpha)) ? Math.min(1, Math.max(0.1, Number(stampAlpha))) : 1;

  // Latest values for the native (non-passive) wheel listener.
  const liveRef = useRef({});
  liveRef.current = { imageUrl, imgAspect, r, crop, trim, onChange };
  // 0.43.0 — THE LAST APPLIED CROP ("that same issue also happens in the
  // card creation window when i scroll on the card preview"): liveRef is
  // refreshed during RENDER, so wheel ticks that arrive between the crop's
  // state commit and the parent's re-render all recompute from the SAME
  // stale rect — consecutive ticks never accumulate (and a stale-er rect
  // can even knock the zoom backward). applyCrop now records the value it
  // just computed SYNCHRONOUSLY, and the wheel builds every tick on THAT.
  // 0.44.0 — THE ECHO GUARD: the old render-time write-back
  // (`appliedRef.current = crop`) ran on EVERY render, so any render that
  // committed a crop from before the last apply (a slow scheduler flush, a
  // transition re-play) rewound the base and the next tick knocked the zoom
  // backward — the "zoom in and out rapidly" stutter. The write-back now
  // adopts the prop ONLY when it is not our own echo — external changes
  // (undo, a ratio re-lock, a parent reset) still land, our own values
  // never rewind us.
  const appliedRef = useRef(undefined);
  const appliedEchoRef = useRef(null);
  if (crop !== appliedEchoRef.current) {
    appliedRef.current = crop;
    appliedEchoRef.current = null;
  }
  // Store the crop only when it differs from the auto-centered default.
  const applyCrop = (next) => {
    const { r: lr, imgAspect: la, trim: lt, onChange: loc } = liveRef.current;
    if (!next) {
      appliedRef.current = null;
      appliedEchoRef.current = null;
      loc({ ratio: lr, trim: lt, crop: null });
      return;
    }
    const auto = autoCropFor(lr, la);
    const isAuto =
      Math.abs(next.x - auto.x) < 0.001 && Math.abs(next.y - auto.y) < 0.001 && Math.abs(next.w - auto.w) < 0.001;
    const stored = isAuto ? null : next;
    appliedRef.current = stored;
    appliedEchoRef.current = stored;
    loc({ ratio: lr, trim: lt, crop: stored });
  };

  const onPointerDown = (e) => {
    if (!imageUrl || !imgAspect) return;
    e.preventDefault();
    e.target.setPointerCapture?.(e.pointerId);
    // Snapshot the CURRENT crop plus the BASE (zoom-1) crop: the base drives
    // the pan speed (scroll-independent), the snapshot is the anchor.
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      crop: { ...eff },
      base: autoCropFor(r, imgAspect),
    };
    setDragging(true);
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    const box = boxEl;
    if (!drag || !box) return;
    const rect = box.getBoundingClientRect();
    const W = Math.max(1, rect.width);
    const H = Math.max(1, rect.height);
    // 0.8.0: drag speed is FULLY DECOUPLED from the scroll wheel. The pan
    // delta is scaled by the BASE (zoom-1) crop, never by the current crop —
    // so scrolling changes ONLY the zoom, and the drag moves a constant
    // slice of the source image per pixel at any zoom level (visually the
    // movement scales WITH the zoom, exactly as requested).
    const dx = (e.clientX - drag.startX) / W;
    const dy = (e.clientY - drag.startY) / H;
    const next = clampCrop(
      {
        ...drag.crop,
        x: drag.crop.x - dx * drag.base.w,
        y: drag.crop.y - dy * drag.base.h,
      },
      r,
      imgAspect
    );
    applyCrop(next);
  };

  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  // 0.45.0 — ZOOM AS PLAIN KEYS (the wheel's replacement — same math the
  // wheel used, fired by three buttons under the card): a fixed ±11% step
  // on the crop's width, anchored on the visible center, always clamped.
  // Reads through appliedRef so rapid clicking compounds even when it
  // outruns the parent's re-render.
  const stepZoom = (factor) => {
    if (!imageUrl || !imgAspect) return;
    const { r: lr } = liveRef.current;
    const base = appliedRef.current !== undefined ? appliedRef.current : liveRef.current.crop;
    const cur = effectiveCrop(base, lr, imgAspect);
    const w = Math.min(1, Math.max(0.05, cur.w * factor));
    const clamped = clampCrop({ ...cur, w }, lr, imgAspect);
    const cx = cur.x + cur.w / 2;
    const cy = cur.y + cur.h / 2;
    applyCrop(clampCrop({ ...clamped, x: cx - clamped.w / 2, y: cy - clamped.h / 2 }, lr, imgAspect));
  };

  // 0.20.0 — the sticker's geometry. --stamp-rot carries its UNIT (deg):
  // a bare number collapses the whole transform at computed-value time
  // (the alignment/breakage bug). The hue is no longer a plate on the
  // sticker — it is the classic bottom-half-of-the-card wash with its own
  // alpha, rendered in the free layer BESIDE the sticker.
  const stickerStyle = {
    left: `${stampPos?.x ?? 50}%`,
    top: `${stampPos?.y ?? 50}%`,
    ['--stamp-scale']: scale,
    ['--stamp-rot']: `${rot}deg`,
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
      className={clsx(
        'gd-card gd-card-collector relative select-none',
        // 1.4.3 — POLYCHROME'S TEXT + BORDER SCOPE IS RETIRED WITH THE
        // COAT ("remove polychrome, replace it with Opalescent" — the
        // pearl is a translucent veil; see the retirement note in
        // index.css).
        // 1.4.1 — IMAGE MOTION (the sway's own scope, one voice with the
        // grid card: what you frame is what you get).
        imageMotion && 'gd-img-motion',
        // 1.4.7 — STAMP MOTION (the stamp's trailing sway's own scope —
        // see .gd-stamp-motion in index.css). 1.4.8 — THE SCOPE ARMS ON THE
        // STAMP ALONE (the "should not depend on image motion" law): the
        // sway runs with or without the image's own, its clock keeping the
        // +0.42s offset so both stay in step if the image ever joins in.
        stampMotion && 'gd-stamp-motion',
        // 1.4.5 — the coat's own scope classes (the RIM LAW's seat + the
        // reach switch — see the ladder law in index.css). 1.7.2 — the stamp
        // reach is retired with the option; the full-face coat's own scope
        // (.gd-fin-on-image — the stamps covered alongside the image) joins
        // the root's laws, one voice with the grid card.
        finish !== 'none' && 'gd-has-finish',
        finish !== 'none' && finishOnTrim && 'gd-fin-on-trim',
        finish !== 'none' && finishOnImage && 'gd-fin-on-image',
        /* 1.4.8 — THE UNDER-ART SCOPE (the "image covers it" law — see
           .gd-fin-under-art in index.css): armed exactly while a coat is
           worn veiled (a finish + IMAGE EFFECT off + an image to
           protect), the masked coat drops to the art's own rung and the
           picture covers its seam-side overdraw — one voice with the
           grid card and the compact preview. */
        finish !== 'none' && !finishOnImage && !!imageUrl && 'gd-fin-under-art',
        /* 1.9.3 — THE EXTREME GROUNDS (finishGroundTone in TagRibbon): the
           picked card color's own tone classes the coat's blend seats — a
           near-white / near-black / vivid plate never swallows the coat
           again. One voice with the grid card and the compact preview. */
        finishGroundTone(cardColor),
        /* 1.9.6 — THE SPLIT VOLUME'S OWN SCOPE (the compact preview's law,
           verbatim — see .gd-fin-split in index.css). */
        finishSplitImage && 'gd-fin-split'
      )}
      style={{
        width,
        /* 1.3.7 — THE PREVIEW'S CORNER PLATES ARE RETIRED (see the
           retirement note at .gd-card-collector in index.css): the
           1.3.6 --gd-corner-fill write left with the law — the preview's
           outer corners belong to the ink trim again, one voice with the
           shipped card on every surface. */
        /* 1.4.5 — the rim var the outline law reads (light ink → dark rim,
           dark ink → light rim; the themed seat speaks the theme's own
           counter token). */
        ...(finish !== 'none' ? { ['--gd-fin-ink-outline']: finRim } : null),
        /* 1.4.7 — the motion family's root vars (the grid card's own law):
           the sway's phase (the editor's fixed 0.37 seat, the same voice
           the coat seats read) + the stamp's absolute sway reach, computed
           from the art's height over the effective crop's vertical
           fraction (a zoomed crop sways farther — the stamp tracks the
           image's TRUE travel; see .gd-stamp-motion in index.css). */
        ['--gd-fin-ph']: 0.37,
        ['--gd-sway']: `${(
          Math.max(0, width - 4) * (r.h / r.w) * 0.015 / (eff && eff.h > 0 ? eff.h : 1)
        ).toFixed(2)}px`,
        /* 1.4.8 — THE CARD'S OWN COLOR as a var the finishes read (the
           nuri lean law — see .gd-finish-nuri::before in index.css): the
           plate's hex when the card speaks one, the theme's panel when
           it does not.
           1.7.4 — THE FINISH'S OWN GROUND (the grid card's law, verbatim):
           a colorless preview wearing a finish leans on the finish's
           ground, and the preview's own paper paints it — what you frame
           is what you get. */
        ['--gd-card-tint']: cardColor || finishGround || 'var(--gd-panel)',
        /* 1.9.5 — THE COAT'S OWN VOLUME: the panzoom writes the strength
           var with the grid card's own law (finishStrength in TagRibbon)
           — the knob's draft paints here the moment it moves.
           1.9.6 — the split volume rides beside it (the image knob's own
           var + the ink twin the light ground reads). */
        ['--gd-fin-strength']: finishStrength(finishTransparency),
        ['--gd-fin-strength-art']: finishStrength(finishImageTransparency),
        ...(cardColor
          ? {
              ['--gd-fin-ink']: finishTintLean(cardColor),
              ['--gd-fin-glow']: finishTintLean(cardColor, 0.78),
              ['--gd-fin-art']: finishTintLean(cardColor, 0.75),
            }
          : null), /* 1.9.9 — the lean + its glow + art seats (finishTintLean);
             1.9.10 — THE CLASSIC COAT RETURNS: these feed the numeix X
             signature's ink alone now (every other coat seat speaks its
             classic 1.9.2 fixed colors — see index.css). */
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
        splitArt={finishSplitImage}
      />
      <div
        ref={setBoxEl}
        className={clsx('relative gd-panzoom', dragging && 'is-dragging')}
        style={{
          aspectRatio: `${r.w} / ${r.h}`,
          /* 1.4.0 — the panzoom's own paper moved into its clip, exactly as
             the grid sleeve did (see the z-ladder note at .gd-sleeve in
             index.css — the panzoom no longer owns a context; the clip
             carries the paper at z 1, above the rise, under the coat). */
          // 0.20.0 — collector cards round their TOP only: the foot's
          // bottom details sit flush in a square base.
          // 1.3.1 — THE ART'S OWN BOTTOM CURVE (see the grid card's sleeve
          // and .gd-card-foot::before in index.css): the preview's art
          // rounds its bottom corners with the theme's radius and the
          // foot plate's rise fills the carve, so the preview speaks the
          // same divider law the wall cards do.
          borderRadius:
            'calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px)',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* 0.17.0 — the art alone clips; trims + stamps live beside it so a
            dragged stamp can escape the art box (and the card's border).
            0.48.0 — THE ART PAINTS THE CROP EXACTLY (cropFrame): the old
            object-fit: cover + object-position could only PAN, so the zoom
            keys' w/h changes never reached the pixels — the buttons read as
            dead from the day the wheel retired. The frame sizes the image so
            the crop rect fills the box: zoom in/out/reset now actually zoom. */}
        <div
          className="gd-sleeve-clip"
          /* 1.4.5 — THE ART SEAT SPEAKS THE DEEP GROUND (the grid card's
             own law — the white-line report): the old 10%-ink-over-PANEL
             wash read as a near-white paper under dark themes, and any
             fractional raster edge bled it as a hairline ring while the
             art moved. The shadow-toned mix can never read as a white
             line under any theme. */
          style={{ background: 'color-mix(in srgb, var(--gd-ink) 30%, var(--gd-bg))' }}
        >
          {imageUrl ? (
            <>
              {/* 1.6.2 — THE PLACEHOLDER RUNG (the progressive ladder): the
                  light tier paints the crop EXACTLY as the full file will
                  (same frame, same cover), and the full picture cross-fades
                  over it the moment its decode lands — the preview is never
                  blank, never waiting, and the keys under the card never
                  had a reason to arrive late. */}
              {imageThumbUrl && imageThumbUrl !== imageUrl && (
                <img
                  src={imageThumbUrl}
                  alt=""
                  draggable={false}
                  className={clsx('object-cover pointer-events-none absolute inset-0', !imgAspect && 'w-full h-full')}
                  style={imgAspect ? cropFrame(eff) : undefined}
                />
              )}
              <img
                src={imageUrl}
                alt=""
                draggable={false}
                // 1.4.7 — THE GAP LAW ("it only does [the zoom] if it detects
                // that there is no gab for motion vertically"): an effective
                // crop whose h ≤ 0.97 already overdraws the box by the sway's
                // whole reach — data-motion-slack stands the safety zoom down
                // (see .gd-img-motion in index.css); an exact-fit frame (or
                // an unknown aspect, the plain cover fill) keeps the 1.06.
                {...(eff && eff.h <= 0.97 ? { 'data-motion-slack': 'crop' } : null)}
                className={clsx(
                  'object-cover pointer-events-none transition-opacity duration-200',
                  !imgAspect && 'w-full h-full',
                  fullLoaded ? 'opacity-100' : 'opacity-0'
                )}
                style={imgAspect ? cropFrame(eff) : undefined}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <span className="font-bold" style={{ color: 'color-mix(in srgb, var(--gd-ink) 30%, transparent)', fontSize: 22 }}>
                ✖
              </span>
              <span
                className="tracking-[0.25em] uppercase"
                style={{ color: 'color-mix(in srgb, var(--gd-ink) 45%, transparent)', fontSize: 8 }}
              >
                No image
              </span>
            </div>
          )}
        </div>
        {/* 1.4.5 — THE BAND SPEAKS AT ITS OWN ROOT-LEVEL RUNG (the grid
            card's own law — see GridView's note): a sibling of the deco
            span now, same geometry (the panzoom's own box — which clips it
            at the art's rounded curve), carrying its own z rung, so the
            STAMP EFFECT switch can reach it under the coat and the TRIM
            EFFECT can ride it over the coated face (see the ladder law in
            index.css). */}
        {/* 1.6.2 — THE HUE'S OWN SEAT UNDER THE RIDING COAT (the grid card's
            law — see .gd-hue-band-own in index.css): while the trim effect
            lifts the band over the trim ring, ONE wash keeps the tint at
            the band's classic ground, under the trims.
            1.7.3 — AND THE SEAT HONORS THE LAYER ORDER (the grid card's own
            note): stampHueOver threads the is-over-stamp modifier — the
            wash lifts one rung over the band + its logo exactly when the
            switch asks the tint to cover the art.
            1.7.4 — THE UNDER-STAMP HALF RENDERS BEFORE THE BAND (the grid
            card's law, verbatim — the "shouldnt automatically make the hue
            hover over the stamp" fix): OFF seats the wash DOM-earlier at
            the band's own rung so the logos paint over it, ON renders it
            after with the lift — one switch, one promise, both halves. */}
        {stampHueHex && !stampHueOver && !stampHueOverTrim && coatOverTrim && stampUrl && (
          <span
            className="gd-card-stamp-hue gd-hue-band-own"
            style={{ background: stampHueHex, ['--stamp-hue']: stampHueHex, ['--stamp-hue-alpha']: stampHueAlpha }}
            aria-hidden
          />
        )}
        {stampUrl && !stampPos && (
          <span
            className="gd-card-stamp-band"
            style={stampHueHex ? { ['--stamp-hue']: stampHueHex, ['--stamp-hue-alpha']: stampHueAlpha } : undefined}
            aria-hidden
          >
            {/* 1.6.2 — the washes stand down while the coat rides over the
                trim (the hue's own seat — the grid card's law, verbatim):
                the sibling wash below seats the tint under the trims.
                1.7.3 — THE FLIP SPEAKS ITS TRUE SEAT (the grid card's own
                note): the seats are swapped — OFF (classic) paints the
                wash FIRST (under the logo), ON paints it LAST (the tint
                over the stamp art), the switch's promise at last. */}
            {stampHueHex && !stampHueOver && !stampHueOverTrim && !coatOverTrim && (
              <span className="gd-card-stamp-hue" style={{ background: stampHueHex }} aria-hidden />
            )}
            <span className="gd-card-stamp-slicebox">
              <img src={stampUrl} alt="" draggable={false} className="gd-card-stamp-img" style={{ opacity: artAlpha }} />
            </span>
            {stampHueHex && stampHueOver && !stampHueOverTrim && !coatOverTrim && (
              <span className="gd-card-stamp-hue" style={{ background: stampHueHex }} aria-hidden />
            )}
          </span>
        )}
        {/* 1.7.4 — the OVER-STAMP half rides after the band with the lift
            (the under-seat's own note above — the grid card's twin law). */}
        {stampHueHex && stampHueOver && !stampHueOverTrim && coatOverTrim && stampUrl && (
          <span
            className="gd-card-stamp-hue gd-hue-band-own is-over-stamp"
            style={{ background: stampHueHex, ['--stamp-hue']: stampHueHex, ['--stamp-hue-alpha']: stampHueAlpha }}
            aria-hidden
          />
        )}
        {/* 1.4.5 — THE STAMPLESS HUE'S OWN SEAT (the grid card's law): the
            picked hue drafts on the preview exactly as it will on the card
            — the classic bottom-half wash, faded upward, under the trims.
            Renders only while no stamp carries a wash of its own. */}
        {stampHueHex && !stampHueOverTrim && !stampUrl && (
          <span
            className="gd-card-stamp-hue gd-hue-halfcard"
            style={{ background: stampHueHex, opacity: stampHueAlpha }}
            aria-hidden
          />
        )}
        <span className="gd-sleeve-deco" aria-hidden>
          {overlay && (
            <span
              className={clsx('gd-trim', overlay, !!cardColor && isExtremePlateHex(cardColor) && 'is-seamless', trimUserInk && 'is-user')}
              style={trimUserInk ? { ['--trim-user']: trimUserInk } : undefined}
              aria-hidden
            />
          )}
          {/* 1.7.4 — THE COAT'S TRIM VOICE (the grid card's law, verbatim —
            TrimCoatLayer in TagRibbon): while the trim effect rides, the
            trim's own clone re-inks every shape, gaps kept as gaps.
            1.7.5 — the clone's ink walks the TRIM'S OWN ladder
            (trimCoatInk; FINISH_TRIM_INK retired with the "always yellow"
            report).
            1.7.7 — the card-color rung is retired with it: the clone
            speaks the picker's word alone, and with no pick the ring
            wears only the finish's washes. */}
        <TrimCoatLayer
          trim={trim || DEFAULT_CARD_TRIM}
          seamless={!!cardColor && isExtremePlateHex(cardColor)}
          ink={coatOverTrim ? trimCoatInk(trim || DEFAULT_CARD_TRIM, trimColor) : null}
        />
        {/* 1.4.3 — POLYCHROME'S GRADIENT RING IS RETIRED WITH THE COAT
              ("remove polychrome, replace it with Opalescent" — the flowing
              band left with the pour's text + border law; see the retirement
              note in index.css). */}
          {/* 1.3.8 — the hue's single voice above the trim (the grid card's
              own law — see GridView's notes). 1.3.9 — the print on the image
              left with the retired pattern feature. */}
          {stampHueHex && stampHueOverTrim && (
            <span
              className="gd-card-stamp-hue gd-hue-over-trim"
              style={{ background: stampHueHex, opacity: stampHueAlpha }}
              aria-hidden
            />
          )}
        </span>
      </div>
      {/* 0.27.0 — THE FREE STAMP LAYER LIVES OUTSIDE THE PANZOOM. The
          interactive crop box carries `overflow: hidden`, so the old
          in-box free layer could never actually leave the card — the
          OUTSIDE switch only ever raised the sticker above the trims
          ("the show past border option doesn't work, it only makes the
          stamp above the border"). The layer now renders as a sibling
          overlay pinned to the panzoom's exact box (top edge, full width,
          same aspect ratio, same corner radius): confined stamps clip at
          the card's edge exactly as before, OUT-OF-BOUNDS stickers hang
          past the border like real stickers — parity with the grid. */}
      {stampUrl && stampPos && (
        <span
          className={clsx('gd-card-stamp-free gd-card-stamp-overlay', stampClip && 'is-clipped')}
          style={{
            aspectRatio: `${r.w} / ${r.h}`,
            // 1.3.4 — ALL FOUR CORNERS, THE PANZOOM'S OWN LAW (see the
            // compact preview's note in TagRibbon — the same report): the
            // overlay still carried the pre-1.3.1 top-only radius, so a
            // CONFINED stamp layer clipped SQUARE at its bottom corners —
            // the sticker and the halfcard hue wash painted straight past
            // the panzoom's rounded bottom trim into the seam's corners,
            // over the foot plate's card-color fill (the "image leaking
            // beyond the trim" on the look editor's preview). The overlay
            // rounds all four corners with the theme's radius now: the
            // confined layer carves exactly where the art does, and only
            // an OUT-OF-BOUNDS sticker (clip off) keeps its hang-past-
            // the-border freedom.
            borderRadius:
              'calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px) calc(var(--gd-shape-radius, var(--gd-radius)) - 2px)',
            ...(stampHueHex ? { ['--stamp-hue']: stampHueHex } : undefined),
          }}
          aria-hidden
        >
          {/* 0.20.0/0.22.0 — the hue is the BOTTOM-HALF wash (faded like
              the classic band, at the card's hue transparency), painted
              under the sticker instead of around it.
              0.38.0 — the layer order flips with the setting, same as the
              band above. 1.6.2 — and the wash stands down while the coat
              rides over the trim (the hue's own seat — the sibling wash
              inside the panzoom carries the tint under the trims).
              1.7.3 — THE FLIP SPEAKS HERE TOO (the grid card's own note):
              the seats are swapped — OFF (classic) paints the wash FIRST
              (under the sticker, the in-layer z law scoped to its
              stampless home so the DOM order is the truth again), ON
              paints it LAST (the tint over the sticker). */}
          {stampHueHex && !stampHueOver && !stampHueOverTrim && !coatOverTrim && (
            <span
              className="gd-card-stamp-hue gd-hue-halfcard"
              style={{ background: stampHueHex, opacity: stampHueAlpha }}
              aria-hidden
            />
          )}
          {/* 0.21.0 — a SOLID sticker: no directional fade anymore (the
              old mask dissolved half the logo mid-card — "too
              see-through"); the art's opacity is the stamp's own ALPHA. */}
          <span
            className="gd-card-stamp-placed"
            style={stickerStyle}
            title="The sticker: edit its position, size and angle in the stamp settings"
          >
            <img src={stampUrl} alt="" draggable={false} className="gd-card-stamp-img" style={{ opacity: artAlpha }} />
          </span>
          {stampHueHex && stampHueOver && !stampHueOverTrim && !coatOverTrim && (
            <span
              className="gd-card-stamp-hue gd-hue-halfcard"
              style={{ background: stampHueHex, opacity: stampHueAlpha }}
              aria-hidden
            />
          )}
        </span>
      )}
      {/* 0.40.0 — NO SEPARATOR between the art and the label (the grid card
          dropped it; the preview mirrors the card) — the plate sits flush.
          0.42.0 — THE FOOT IS THE GRID CARD'S OWN GRID NOW (title + badge on
          row one, the DATE on a full-width row below): the creation preview
          and the shipped card can never disagree, and the date rides its own
          line — never squeezed or cropped by whatever shares the right side. */}
      {/* 0.45.0 — THE FOOT KEEPS ITS BADGE ON THE LINE: the grid card's
          resting foot is a ONE-TRACK grid (the badge hides until hover — see
          .gd-card-foot-vers in index.css), and the preview's badge rode the
          same grid WITHOUT the hide/show machinery — an unplaced third grid
          child that auto-placed onto a WHOLE NEW ROW below the date
          ("the version count would take a whole new line"). The preview's
          foot is STATIC now (is-static): always two tracks, the badge
          always seated beside the name, the name cropping to make room. */}
      <div
        className={clsx('gd-card-foot gd-card-foot-vers is-static', cardColor && 'is-colored')}
        style={{
          /* 1.7.4 — THE FINISH'S OWN GROUND paints the plate (the grid card's
             law, verbatim — see finishGround's note): what you frame is
             what you get. 1.9.2 — THE GROUND LISTENS TO THE CLOTH: the
             ground is the theme's own cloth mixed with the material's hue
             now (see FINISH_GROUND in TagRibbon), so the plate's printing
             speaks the theme's own text token — the same voice the
             uncoated themed card always spoke. */
          ...(cardColor
            ? { backgroundColor: cardColor, color: readableInk(cardColor) }
            : finishGround
              ? { backgroundColor: finishGround, color: 'var(--gd-panel-text)' }
              : undefined),
          /* 1.3.5 — THE PLATE SPEAKS ITS OWN COLOR (see the grid card's own
             note in GridView + .gd-card-foot::before in index.css): the
             corner fill above the seam paints --gd-foot-plate opaque —
             the card color, or the theme's paper for the uncolored card —
             so the preview's carved corners speak the container's bottom
             color, never a bare tint wash over the raw panel (the
             "white/theme colored" leak). */
          ['--gd-foot-plate']: cardColor || finishGround || 'var(--gd-panel)',
          /* 1.3.8 — THE TINT IS RETIRED (the fade stays on the image — see
             the grid card's own note + the .gd-card-foot::before law in
             index.css): the notch speaks the plate + the bloom, and the
             --gd-foot-tint write left with the law. */
        }}
      >
        {/* 1.3.9 — the plate's own coat (the grid card's law, verbatim —
            the preview is what the card will wear; the print left with the
            retired pattern feature). */}
        <div className="gd-card-foot-name min-w-0">
          <RichText
            text={name || 'Unnamed'}
            as="div"
            className="gd-card-title font-display font-bold leading-tight truncate"
            /* 1.7.4 — the finish's own ground earns the printing ink (the
               grid card's law, verbatim). 1.9.2 — the ground is the theme's
               own cloth now; the printing speaks the theme's text token
               (see FINISH_GROUND in TagRibbon). */
            style={{ color: cardColor ? readableInk(cardColor) : 'var(--gd-panel-text)' }}
          />
        </div>
        {date && (
          <div
            className="gd-card-meta gd-card-meta-line tracking-[0.14em]"
            style={{ color: cardColor ? readableInk(cardColor) : 'var(--gd-mute)' }}
          >
            {date}
          </div>
        )}
        <span
          className="gd-card-stamp gd-stamp flex-shrink-0"
          style={{ color: cardColor ? readableInk(cardColor) : 'var(--gd-accent)' }}
        >
          {versions} VER
        </span>
      </div>
      {/* 1.4.5 — THE COAT'S OLD TRAILING SEAT IS RETIRED: the layer moved
          to the card root's DOM FIRST (see the top of this render) — the
          ladder law's equal-rung ordering depends on it. */}
      </div>
      {/* 0.45.0 — THE ZOOM KEYS (the wheel's whole replacement): three plain
          buttons under the card — out, in, and the auto-fit reset.
          1.6.2 — THE KEYS SEAT ON THE FIRST FRAME ("the zoom in and out and
          fit option appears late when i open the card edit window, it should
          appear right away and not wait for the image"): the old gate also
          demanded imgAspect — a value that only lands after an image DECODES
          — so the keys materialized a beat (or a scroll) after the window
          itself. The aspect feeds the CROP MATH, not the keys' right to
          exist: a picture is a picture, and the keys ride with it from the
          very first paint (the thumb tier's aspect answers in
          near-instantly now — see App's lookCoverThumbUrl — so the gap the
          gate used to cover is gone at the root as well).
          1.6.2 — AND THE KEYS NEVER LEAVE ("zoom in, zoom out and fit
          buttons should exist in the card creation window even if there is
          no card present but should be greyed out"): the keys now render
          UNCONDITIONALLY — a window with no picture yet keeps its three
          keys seated in their place, GREYED and inert (the house disabled
          face), so the row never pops into existence the moment a picture
          lands: the creation window is born with its controls already in
          place, and the keys wake with the first image exactly where the
          eye already expected them. */}
      <div className={clsx('gd-preview-zoom', !imageUrl && 'is-empty')} role="group" aria-label="Picture zoom">
        <button
          type="button"
          className="gd-btn !px-2"
          disabled={!imageUrl}
          title={imageUrl ? 'Zoom out: show more of the picture' : 'Add a picture first — the zoom keys wake with the first image'}
          onClick={() => stepZoom(1 / 0.9)}
        >
          <ZoomOut size={12} />
        </button>
        <button
          type="button"
          className="gd-btn !px-2"
          disabled={!imageUrl}
          title={imageUrl ? 'Zoom in: fill the card with more of the picture' : 'Add a picture first — the zoom keys wake with the first image'}
          onClick={() => stepZoom(0.9)}
        >
          <ZoomIn size={12} />
        </button>
        <button
          type="button"
          className="gd-btn !px-2"
          disabled={!imageUrl}
          title={imageUrl ? 'Reset the picture to the auto fit' : 'Add a picture first — the fit key wakes with the first image'}
          onClick={() => applyCrop(null)}
        >
          <Maximize2 size={12} />
        </button>
      </div>
    </div>
  );
}

// The full card-look editor: interactive preview + aspect ratio + trim.
// Shared by the new-character dialog (left column) and the card-look dialog.
// 0.17.0 — optional stamp pass-through: the card's TOP stamp renders in the
// preview. 0.20.0 — the stamp renders PASSIVELY (its settings popover in
// the stamp row does the editing: X / Y / SCALE / ROTATION / TRANSPARENCY /
// OUTSIDE); only the IMAGE is draggable here (the crop editor).
export default function CardLookEditor({
  name,
  imageUrl,
  // 1.6.2 — the light tier for the progressive ladder (the EDIT CARD
  // window threads the thumb; the creation window's own cover already IS
  // the thumb, so it passes nothing and the preview renders one layer).
  imageThumbUrl = null,
  imgAspect,
  ratio,
  trim,
  // 1.6.2 — THE TRIM'S OWN INK + ITS COMMIT LANE (the color picker's
  // seat — TrimOverlay's law): null keeps the theme's own trim.
  trimColor = null,
  onTrimColor = null,
  crop,
  onChange,
  versions = 1,
  date = '',
  previewWidth = 148,
  compact = false,
  showHelp = false,
  stampUrl = null,
  stampHueHex = null,
  stampHueAlpha = 0.88,
  stampPos = null,
  stampScale = 1,
  stampRot = 0,
  stampClip = false,
  stampAlpha = 1,
  stampHueOver = false,
  // 1.3.8 — the hue's second layer order + the card's own looks (the
  // callers — the creation window and the EDIT CARD window — thread them
  // from their drafts so the preview is what the card will wear).
  stampHueOverTrim = false,
  cardColor = null,
  // 1.3.9 — the finish alone (the secondary color and the pattern left
  // with the feature — "remove secondary color and pattern option").
  finish = 'none',
  finishOnImage = false,
  // 1.4.6 — THE COAT'S REACH SWITCHES ARRIVE AT THE EDITOR'S OWN SIGNATURE
  // ("stamp effect and trim effect options arent working"): the 1.4.5
  // wires passed finishOnTrim / finishOnStamp into this component, but the
  // signature never declared them and the renders below never forwarded
  // them — the switches flipped their checkboxes, the DRAFT state moved,
  // DONE even committed it, yet the PREVIEW never wore the reach (the coat
  // stayed under the trims, the stamps stayed above it): in both the EDIT
  // CARD window and the creation window's CARD LOOK column the two
  // switches read as dead. They ride the signature now and flow into BOTH
  // seats — the panzoom preview and the compact CardPreview — one voice
  // with the grid card's ladder law. 1.7.2 — finishOnStamp left with the
  // option; trim keeps its wire.
  finishOnTrim = false,
  // 1.4.1 — the sway switch (one voice with the grid card).
  imageMotion = false,
  // 1.4.7 — STAMP MOTION ("add stamp motion too, which when checked will
  // move the stamp alongside the image with a slight delay"): forwarded
  // into the panzoom preview so the editor speaks the shipped card's own
  // trailing sway.
  stampMotion = false,
  // 1.9.5 — THE COAT'S OWN VOLUME: the transparency knob, forwarded into
  // BOTH preview seats (the panzoom and the compact CardPreview) so the
  // coat's clarity in the window is the clarity the card ships.
  finishTransparency = null,
  // 1.9.6 — THE SPLIT VOLUME: forwarded into BOTH preview seats the same
  // way (the checkbox + the image knob — one voice, both windows).
  finishSplitImage = false,
  finishImageTransparency = null,
  // 1.4.1 — TRIM ASIDE ("in card edit window, make the trims have their
  // own column on the left (aka 3 columns now) of the preview so there
  // is no need to scroll inside the window"): when true the editor
  // renders TWO columns of its own — the TRIM tower on a fixed left
  // rail, the preview + ratio beside it — so the EDIT CARD window's
  // whole body fits one screen with no scrolling.
  trimAside = false,
}) {
  const [customW, setCustomW] = useState('');
  const [customH, setCustomH] = useState('');
  const r = ratio && ratio.w > 0 && ratio.h > 0 ? ratio : { w: 3, h: 4 };
  const ratioMatches = (p) => Math.abs(r.w / r.h - p.w / p.h) < 0.001;
  const isPreset = useMemo(() => RATIO_PRESETS.some(ratioMatches), [r.w, r.h]);

  // Custom inputs follow the ratio while it's a preset; once the user types,
  // they own the fields until a preset is picked again.
  useEffect(() => {
    if (isPreset) {
      setCustomW(String(r.w));
      setCustomH(String(r.h));
    }
  }, [isPreset, r.w, r.h]);

  const setCustom = (key, raw) => {
    const n = Number(raw);
    const nextW = key === 'w' ? n : Number(customW) || r.w;
    const nextH = key === 'h' ? n : Number(customH) || r.h;
    if (key === 'w') setCustomW(raw);
    else setCustomH(raw);
    if (Number.isFinite(n) && n > 0 && nextW > 0 && nextH > 0) {
      setRatio({ w: Math.min(20, nextW), h: Math.min(20, nextH) });
    }
  };

  // Switching ratio re-locks the stored crop to the new shape so the grid's
  // object-position math stays exact.
  const setRatio = (next) => {
    const relocked = crop && imgAspect ? clampCrop(crop, next, imgAspect) : crop;
    onChange({ ratio: next, trim, crop: relocked });
  };

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <CardPreview
            name={name}
            imageUrl={imageUrl}
            ratio={r}
            trim={trim || DEFAULT_CARD_TRIM}
            trimColor={trimColor}
            crop={crop}
            imgAspect={imgAspect}
            width={previewWidth}
            versions={versions}
            date={date}
            cardColor={cardColor}
            finish={finish}
            finishOnImage={finishOnImage}
            finishOnTrim={finishOnTrim}
            finishTransparency={finishTransparency}
            finishSplitImage={finishSplitImage}
            finishImageTransparency={finishImageTransparency}
            imageMotion={imageMotion}
            stampMotion={stampMotion}
          />
        </div>
        <div>
          <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">ASPECT RATIO</div>
          <div className="flex flex-wrap gap-1.5">
            {RATIO_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className={clsx('gd-btn !px-2 !py-1', ratioMatches(p) && 'gd-btn-accent')}
                title={`Cards at ${p.label}`}
                onClick={() => setRatio({ w: p.w, h: p.h })}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-4', trimAside && 'flex gap-x-4 items-start')}>
      {/* 1.4.1 — THE TRIM'S OWN COLUMN ("in card edit window, make the
          trims have their own column on the left (aka 3 columns now) of
          the preview so there is no need to scroll inside the window"):
          the trim tower rides its own fixed rail to the LEFT of the
          preview — the two-column stack the window used to scroll
          through is a side-by-side pair now, and the window's whole
          body fits one screen. The chips speak the same mini-previews,
          two to a row on the rail. */}
      {trimAside && (
        <div className="w-[132px] flex-shrink-0">
          <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">TRIM</div>
          <div className="grid grid-cols-2 gap-1">
            {CARD_TRIMS.map((t) => (
              <TrimChip
                key={t.id}
                trim={t.id}
                active={trim === t.id}
                onClick={(next) => onChange({ ratio: r, trim: next, crop })}
              />
            ))}
          </div>
          {/* 1.6.2 — THE TRIM COLOR KEY rides under the tiles (see its own
              note at the top of this file): one door to the picker, one
              road back to the theme's own ink. */}
          {onTrimColor && (
            <div className="mt-1.5">
              <TrimColorKey color={trimColor} onColor={onTrimColor} />
            </div>
          )}
        </div>
      )}
      {/* the preview + ratio column (the trimAside seat's partner; the
          plain stacked flow keeps its own trim section below when the
          caller doesn't ask for the rail).
          1.5.0 — THE COLUMN SPEAKS THE STACK'S OWN RHYTHM ("add a bit of
          spacing between the card preview and the aspect ratio text below
          it in the card creation window"): this inner column never carried
          a space-y of its own — the preview and the ASPECT RATIO block sat
          flush against each other (the outer space-y-4 only reaches the
          column itself, not its children). space-y-4 joins the column so
          the gap below the preview is the SAME 16px the editor's every
          other section speaks. */}
      <div className={clsx('min-w-0 space-y-4', trimAside && 'flex-1')}>
      {/* The preview IS the crop editor — drag the IMAGE, scroll to zoom.
          0.20.0 — the stamp is passive art: its placement / size / angle are
          edited in the STAMP SETTINGS popover beside its slot. */}
      <div className="flex justify-center">
        <PanZoomPreview
          name={name}
          imageUrl={imageUrl}
          imageThumbUrl={imageThumbUrl}
          imgAspect={imgAspect}
          ratio={r}
          trim={trim || DEFAULT_CARD_TRIM}
          trimColor={trimColor}
          crop={crop}
          versions={versions}
          date={date}
          width={previewWidth}
          onChange={onChange}
          stampUrl={stampUrl}
          stampHueHex={stampHueHex}
          stampHueAlpha={stampHueAlpha}
          stampPos={stampPos}
          stampScale={stampScale}
          stampRot={stampRot}
          stampClip={stampClip}
          stampAlpha={stampAlpha}
          stampHueOver={stampHueOver}
          stampHueOverTrim={stampHueOverTrim}
          cardColor={cardColor}
          finish={finish}
          finishOnImage={finishOnImage}
          finishOnTrim={finishOnTrim}
          finishTransparency={finishTransparency}
          finishSplitImage={finishSplitImage}
          finishImageTransparency={finishImageTransparency}
          imageMotion={imageMotion}
          stampMotion={stampMotion}
        />
      </div>

      <div>
        <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">ASPECT RATIO</div>
        <div className="flex flex-wrap gap-1.5">
          {RATIO_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className={clsx('gd-btn !px-2 !py-1', ratioMatches(p) && 'gd-btn-accent')}
              title={`Cards at ${p.label}`}
              onClick={() => setRatio({ w: p.w, h: p.h })}
            >
              {p.label}
            </button>
          ))}
        </div>
        {/* Custom ratio — a visible little panel, not two anonymous squares.
            No "CUSTOM" caption (0.9.0 alignment pass): the W : H inputs and
            the readout speak for themselves, and the numbers get the full
            box (spinner arrows are gone app-wide via CSS). 0.11.0: the
            readout sits INLINE at the END of the same row (ml-auto), never
            wrapped onto a new bottom-right row. */}
        <div className="mt-2 gd-panel px-2.5 py-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <input
            className="gd-input !w-14 !py-0.5 text-center min-w-0"
            type="number"
            min="0.5"
            max="20"
            step="0.1"
            value={customW}
            title="Ratio width"
            onChange={(e) => setCustom('w', e.target.value)}
          />
          <span className="text-gd-mute font-bold flex-shrink-0">:</span>
          <input
            className="gd-input !w-14 !py-0.5 text-center min-w-0"
            type="number"
            min="0.5"
            max="20"
            step="0.1"
            value={customH}
            title="Ratio height"
            onChange={(e) => setCustom('h', e.target.value)}
          />
          <span className="ml-auto text-right text-[9px] tracking-[0.12em] text-gd-mute flex-shrink-0 whitespace-nowrap">
            {(r.w / r.h).toFixed(2)} WIDE
          </span>
        </div>
      </div>
      </div>

      {/* the plain stacked flow's own TRIM section — the trimAside rail
          above replaces it when the caller asks for the column seat. */}
      {!trimAside && (
      <div>
        <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">TRIM</div>
        <div className="grid grid-cols-3 gap-1">
          {CARD_TRIMS.map((t) => (
            <TrimChip
              key={t.id}
              trim={t.id}
              active={trim === t.id}
              onClick={(next) => onChange({ ratio: r, trim: next, crop })}
            />
          ))}
        </div>
        {/* 1.6.2 — THE TRIM COLOR KEY joins the stacked flow's section too
            (the creation window's seat — the same door, the same road). */}
        {onTrimColor && (
          <div className="mt-1.5">
            <TrimColorKey color={trimColor} onColor={onTrimColor} />
          </div>
        )}
      </div>
      )}

      {showHelp && (
        <p className={clsx('text-[9px] leading-relaxed text-gd-mute', trimAside && 'w-full')}>
          The original image is kept: the card only shows the placed part. Drag the preview to move the picture, zoom
          with the keys under it{stampUrl
            ? '. The stamp is placed, sized and turned from its SETTINGS button in the stamp row , not by dragging it here'
            : ''}.
        </p>
      )}
    </div>
  );
}
