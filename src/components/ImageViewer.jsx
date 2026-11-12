import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Copy, Images, Maximize2, Star, Trash2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { buildImageUrl, revealImgWhenPainted } from '../utils/helpers.js';
import { gdToast } from '../utils/toasts.js';
import GdContextMenu from './GdContextMenu.jsx';

// ---------------------------------------------------------------------------
// 0.38.0 — THE HUGE IMAGE VIEWER. 0.39.0 — THE FEEL REWORK:
//   · BODY-LEVEL SEAT — the overlay portals to document.body, so its z-900
//     card finally outranks the app's top toolbar (z-400, which sat in a
//     sibling stacking context and used to cover the viewer's top strip):
//     nothing crops under the bar anymore — the close key and the picture's
//     top edge are always on screen.
//   · STRICT 1:1 DRAG ("dragging around feels soo strong, too strong not
//     following the cursor strictly"): the old move handler ADDED the whole
//     pointer delta to an accumulator every frame, so the picture accelerated
//     away from the cursor. The drag now anchors on the pan captured at grab
//     time and moves exactly clientX/Y - start — pixel for pixel.
//   · CLAMPED PAN ("ensure it still remains inside the viewable area …
//     dragging around only works when its zoomed in and wont extend the
//     edges"): the picture can never be dragged so far that a gap opens
//     between its edge and the stage's edge while it overflows; when it does
//     NOT overflow an axis (not zoomed in enough), that axis simply does not
//     move. Grabbing is only offered while some axis actually overflows.
//   · ONE BOTTOM TOOLBAR ("make the next current and previous image viewer
//     at the bottom on the bottom toolbar … and move the toolbar to the
//     bottom"): controls + [previous · CURRENT · next] thumbnails ride ONE
//     bar flush with the viewer's bottom edge.
//   · EMPTY-AREA CLOSE ("also allow pressing on the empty area to close
//     it"): a click on the bare stage (not the picture, not a drag) closes
//     the viewer; the close key stays top-right.
//   · SWIPE — arrows / keyboard / the toolbar thumbnails walk the set
//     manually; nothing auto-advances.
// 0.41.0 — THE CROP TOOL IS RETIRED ("remove the crop feature since its
//     broken, just remove it"): the selection rectangle, its thirds guides,
//     the edge auto-pan and the canvas commit are gone — zoom, pan and the
//     manual swipe are the viewer's whole vocabulary now.
// 0.42.0 — TWO MORE LAWS:
//   · THE VIEWER IS A MODAL CITIZEN ("fix the issue where i can interact
//     with the app still through it by right clicking and so on"): the
//     overlay carries data-gd-modal, so the app-level right-click handler
//     treats it like any window — no region menus of the surfaces
//     underneath ever bleed through — and the stage's auto-switch walk
//     rests while the viewer is open ("keeps the image paused as long as
//     its open").
//   · ITS OWN RIGHT-CLICK MENU ("right click on the image viewer to get
//     options to select as cover image or image manager or view image
//     etc"): set as cover, open the manager (the stage answers through its
//     managerSignal), copy the image, reset the view, close — the same
//     crew the stage's own menu speaks.
// 0.43.0 — THE ZOOM ENGINE IS A SINGLE-WRITER PIPELINE ("ill describe the
//     zoom bug in detail because its been there for like 20 versions now …
//     i zoomed in using the buttons, then the scrollwheel suddenly zooms
//     out too far until the image is so tiny … when i scroll up it would
//     just zoom in and out repeatedly"). The old wheel listener was torn
//     down and re-attached on EVERY zoom/pan change (deps [zoom, tx, ty])
//     and computed the next zoom from the RENDER'S closure — a listener
//     that is one render stale multiplies the OLD zoom while the state
//     already holds a new one, and events racing the re-render kept
//     re-writing the same absolute value (never accumulating) or knocking
//     it backward: the oscillation and the sudden collapse to the floor.
//     Now ONE listener, attached ONCE, reads the LIVE view from a ref that
//     every input path (wheel, keys, buttons, double-click, pan release)
//     writes through the same applyView() — there is no second source of
//     truth to drift from, so consecutive ticks always accumulate from the
//     freshest value. The floor also rises 0.1 → 0.2 so even a stray path
//     can never shrink the picture to a speck.
// 0.45.0 — THE WHEEL ITSELF IS RETIRED ("i want the scroll bug to be gone
//     for good, even if it means removing the whole scroll functionality
//     … specifically on the card preview and on the huge image preview").
//     Even the single-writer pipeline still oscillated on some devices —
//     a single wheel gesture answered one zoom-in tick with one zoom-out
//     tick (trackpad drivers emit zero-delta and momentum events the
//     sign-test happily reads as "scroll down"). The gesture is gone:
//     zoom lives in the toolbar keys (+ / − / reset), the +/−/0 keys and
//     double-click; the wheel over the stage now scrolls nothing and
//     changes nothing — there is no listener left to misread a tick.
// ---------------------------------------------------------------------------

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 8;
const ZOOM_STEP = 1.2;

export default function ImageViewer({ images, imagesPath, index, onIndex, onClose, onSetCover = null, onOpenManager = null, onDeleteImage = null }) {
  const [zoom, setZoom] = useState(1);
  const [panning, setPanning] = useState(false);
  // 0.42.0 — the viewer's OWN right-click menu ({ x, y } while open).
  const [ctx, setCtx] = useState(null);
  const stageRef = useRef(null);
  // 0.44.0 — THE STAGE NODE LIVES IN STATE TOO (same law as the creation
  // preview's card): the viewer re-seats through its own LAZY PORTAL, and a
  // wheel listener attached in an effect keyed on anything but the node
  // itself can land on the DEAD pre-portal stage — the live stage then never
  // consumes the wheel. The callback ref hands the effect the LIVE node on
  // every re-seat.
  const [stageEl, setStageEl] = useState(null);
  const stageRefCb = (el) => {
    stageRef.current = el;
    setStageEl(el);
  };
  const imgRef = useRef(null);
  // The drag anchor: { startX, startY, baseTx, baseTy } — FIXED at grab time.
  // The old handler kept adding the running delta onto itself (the "too
  // strong" accelerator); the base never mutates during a drag.
  const panRef = useRef(null);
  // 0.39.0 — an EMPTY-AREA press (nothing to pan, cursor on the bare stage):
  // { x, y } while held; a release without movement closes the viewer.
  const emptyPressRef = useRef(null);
  // 0.39.0 — the lazy body-level portal target (same law as Modal: jsdom's
  // server-ish render path never sees a portal it can't mount).
  const [portalTo, setPortalTo] = useState(null);
  useLayoutEffect(() => {
    setPortalTo((prev) => prev || (typeof document !== 'undefined' && document.body ? document.body : prev));
  }, []);

  const safeIndex = Math.min(Math.max(0, index), Math.max(0, images.length - 1));
  const image = images[safeIndex];
  const src = image ? buildImageUrl(imagesPath, image.file) : '';
  const thumbSrc = image ? buildImageUrl(imagesPath, image.thumb || image.file) : '';
  // 1.8.6 — THE WHEEL THAT OUTLIVES THE FREEZE ("... or the image previews
  // loading etc.."): the huge viewer's own road — the img re-mounts per src
  // (the key below), and while the full file streams in the STAGE carries
  // the veil: a slight darkening with the compositor wheel dead center,
  // fading OUT (the image previews' own out flight — .gd-load-veil.has-out)
  // the moment the decode lands. The completion sweep speaks the 1.7.0
  // truth the stage below learned (a load that FINISHES before the
  // listener attaches never fires onLoad): one honest img.complete read on
  // the next tick, and a pending load still answers through onLoad.
  const [fullLoaded, setFullLoaded] = useState(false);
  // 1.9.1 — THE VIEWER JOINS THE PAINT'S OWN LAW (the stage's 1.9.1 word:
  // "when the circle vanishes the image is still blurry for another
  // second or so"): the viewer's img rides decoding="async" too, and its
  // onLoad / img.complete word is a LOAD's word — the raster can still be
  // decoding when the wheel retires, leaving the backdrop alone on screen
  // for the breath the decode owes. Every road into fullLoaded now hands
  // the element to revealImgWhenPainted (helpers.js): the mark waits for
  // the decode's own promise and two committed frames, with rails for the
  // hidden-window family — the wheel's farewell and the picture's
  // clearing speak in the same breath here too.
  useEffect(() => {
    setFullLoaded(false);
    if (!src) return undefined;
    const t = setTimeout(() => {
      const im = imgRef.current;
      if (im && im.complete && im.naturalWidth) revealImgWhenPainted(im, () => setFullLoaded(true));
    }, 0);
    return () => clearTimeout(t);
  }, [src]);

  // The rendered geometry: the <img> keeps its natural fit size (max 92vw/vh)
  // and a transform: translate(tx, ty) scale(zoom). tx/ty live on the DOM
  // node during a drag (zero-lag), committed to state on release.
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  // 0.43.0 — THE LIVE VIEW (see the header note): the one source of truth
  // every gesture reads. Kept in lockstep with the state both during
  // render AND inside applyView, so a wheel event arriving between the
  // state commit and the re-render still multiplies the value that is on
  // screen — no stale closure, no lost ticks, no backward writes.
  const viewRef = useRef({ zoom: 1, tx: 0, ty: 0 });
  viewRef.current = { zoom, tx, ty };

  const applyTransform = (x, y, z) => {
    if (imgRef.current) {
      imgRef.current.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${z})`;
    }
  };

  // Image switch: reset the view (zoom + pan) — through applyView so the
  // ref and the DOM never disagree with the state.
  useEffect(() => {
    viewRef.current = { zoom: 1, tx: 0, ty: 0 };
    setZoom(1);
    setTx(0);
    setTy(0);
    applyTransform(0, 0, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const clampZoom = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 1000) / 1000));

  // 0.39.0 — THE PAN CLAMP. The picture may never show a gap at an edge it
  // already covers: while it overflows the stage horizontally, |tx| is
  // capped at (displayedW - stageW) / 2; while it does NOT overflow, tx
  // pins to 0 (the centered picture has nowhere to go). Same for y. The
  // image's fit size is read from the untransformed layout box
  // (offsetWidth/Height), multiplied by the zoom.
  const clampPan = (x, y, z) => {
    const img = imgRef.current;
    const stage = stageRef.current;
    if (!img || !stage) return { x: 0, y: 0 };
    const dispW = (img.offsetWidth || 0) * z;
    const dispH = (img.offsetHeight || 0) * z;
    const maxX = Math.max(0, (dispW - stage.clientWidth) / 2);
    const maxY = Math.max(0, (dispH - stage.clientHeight) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  };

  // Does the picture overflow the stage at this zoom? (Drags only make sense
  // while it does — "dragging around only works when its zoomed in".)
  const canPan = useCallback(
    (z) => {
      const img = imgRef.current;
      const stage = stageRef.current;
      if (!img || !stage) return false;
      const dispW = (img.offsetWidth || 0) * z;
      const dispH = (img.offsetHeight || 0) * z;
      return dispW - stage.clientWidth > 2 || dispH - stage.clientHeight > 2;
    },
    []
  );

  // 0.43.0 — THE SINGLE WRITER (see the header note): one function, every
  // input path. Clamps the zoom, re-clamps the pan for the new size, then
  // pushes ref + state + DOM in the same breath.
  const applyView = (z, x, y) => {
    const next = clampZoom(z);
    const clamped = clampPan(x, y, next);
    viewRef.current = { zoom: next, tx: clamped.x, ty: clamped.y };
    setZoom(next);
    setTx(clamped.x);
    setTy(clamped.y);
    applyTransform(clamped.x, clamped.y, next);
  };

  // Kept for the pan path (reads the base captured at grab time + live
  // clamps) and for older call sites that already hold fresh values.
  const setZoomChecked = (z) => {
    const v = viewRef.current;
    applyView(z, v.tx, v.ty);
  };

  const go = useCallback(
    (d) => {
      if (images.length < 2) return;
      onIndex?.((safeIndex + d + images.length) % images.length);
    },
    [images.length, safeIndex, onIndex]
  );

  // 0.42.0 — THE VIEWER'S OWN MENU (see the header note). stopPropagation
  // keeps the app-level handler out of it entirely; the items are built from
  // the LIVE state below so they always speak the truth about the current
  // picture.
  const onViewerContext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCtx({ x: e.clientX, y: e.clientY });
  };

  const resetView = () => {
    applyView(1, 0, 0);
  };

  const copyImage = async () => {
    const name = image?.file || '';
    if (!name) return;
    try {
      const res = await window.api?.clipboardWriteImageFile?.(name);
      gdToast(res?.ok ? 'Image copied' : 'Copy failed', res?.ok ? undefined : 'fail');
    } catch {
      gdToast('Copy failed', 'fail');
    }
  };

  const ctxItems = [
    { id: 'hdr', header: `IMAGE · ${safeIndex + 1} / ${images.length}` },
    {
      id: 'cover',
      label: safeIndex === 0 ? 'Set as cover (already first)' : 'Set as cover image',
      icon: Star,
      disabled: safeIndex === 0 || !onSetCover,
      onPick: () => onSetCover?.(safeIndex),
    },
    { id: 'manager', label: 'Image manager', icon: Images, disabled: !onOpenManager, onPick: () => onOpenManager?.() },
    { id: 'copy', label: 'Copy image', icon: Copy, onPick: copyImage },
    { id: 'sep', separator: true },
    /* 1.7.4 — THE VIEWER'S OWN DELETE ("account for arranging and deleting
       images while in huge preview"): the menu speaks the picture on
       screen — the ask (confirm-gated, born above this veil through
       CharacterView's overAll flag) deletes THIS image, and the anchor
       effect walks the view to the nearest survivor exactly the stage's
       own law does. */
    { id: 'delete', label: 'Delete image', icon: Trash2, danger: true, disabled: !onDeleteImage, onPick: () => onDeleteImage?.(safeIndex) },
    { id: 'reset', label: 'Reset view', icon: Maximize2, onPick: resetView },
    { id: 'close', label: 'Close viewer', icon: X, onPick: () => onClose?.() },
  ];

  // 0.45.0 — THE WHEEL LISTENER IS DELETED (see the header note): the
  // pipeline stays — every remaining input path (keys, buttons, double-
  // click, pan release) funnels through applyView exactly as before.
  const hasImage = !!image;

  useEffect(() => {
    const onKey = (e) => {
      // 1.7.3 — A LAYER RIDING ABOVE THE VIEWER OWNS THE KEYS ("image
      // manager should open on it, dont close the big image preview then
      // open image manager"): while a modal rides the over-viewer lane
      // (.gd-modal-layer.is-over-viewer — the manager opened from this
      // viewer's own menu) the viewer yields the whole keydown: Escape
      // closes the manager alone (Modal's own listener answers — its
      // overViewer flag keeps its voice), and the arrows/zoom keys never
      // reach around the window above to flip the picture beneath it.
      // With no such layer mounted the viewer answers exactly as it
      // always did — including when a classic-lane manager sits UNDER it
      // (the 0.41.0 flow: Esc closes the viewer, the manager stays).
      if (
        typeof document !== 'undefined' &&
        document.querySelector('.gd-modal-layer.is-over-viewer')
      ) {
        return;
      }
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === '+' || e.key === '=') setZoomChecked(viewRef.current.zoom * ZOOM_STEP);
      if (e.key === '-') setZoomChecked(viewRef.current.zoom / ZOOM_STEP);
      if (e.key === '0') resetView();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [go]);

  // ---- pan ----------------------------------------------------------------
  const onPointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    // Not zoomed in (nothing overflows): a press on the BARE stage is the
    // empty-area click candidate ("allow pressing on the empty area to close
    // it") — a press ON the picture does nothing at all.
    const onEmpty = e.target === e.currentTarget;
    if (!canPan(zoom)) {
      if (!onEmpty) return;
      emptyPressRef.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture?.(e.pointerId);
      return;
    }
    panRef.current = { startX: e.clientX, startY: e.clientY, baseTx: tx, baseTy: ty, moved: false, onEmpty };
    setPanning(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    const pan = panRef.current;
    if (!pan) return;
    // STRICT 1:1 — exactly the pointer's delta from the grab, anchored on
    // the pan captured at grab time, then clamped to the stage's edges.
    if (Math.abs(e.clientX - pan.startX) > 3 || Math.abs(e.clientY - pan.startY) > 3) pan.moved = true;
    const nx = pan.baseTx + (e.clientX - pan.startX);
    const ny = pan.baseTy + (e.clientY - pan.startY);
    const clamped = clampPan(nx, ny, zoom);
    applyTransform(clamped.x, clamped.y, zoom);
    pan.liveX = clamped.x;
    pan.liveY = clamped.y;
  };

  const onPointerUp = (e) => {
    // The empty-area press: no movement means it was a click on the bare
    // stage — the viewer folds ("also allow pressing on the empty area to
    // close it").
    const press = emptyPressRef.current;
    if (press) {
      emptyPressRef.current = null;
      if (Math.abs(e.clientX - press.x) < 4 && Math.abs(e.clientY - press.y) < 4) onClose?.();
      return;
    }
    const pan = panRef.current;
    if (pan) {
      setTx(pan.liveX ?? pan.baseTx);
      setTy(pan.liveY ?? pan.baseTy);
      setPanning(false);
      if (!pan.moved && pan.onEmpty) {
        panRef.current = null;
        onClose?.();
        return;
      }
    }
    panRef.current = null;
    // keep the ref honest after the pan's release commit
    viewRef.current = { zoom: viewRef.current.zoom, tx: pan ? (pan.liveX ?? pan.baseTx) : viewRef.current.tx, ty: pan ? (pan.liveY ?? pan.baseTy) : viewRef.current.ty };
  };

  if (!image) return null;

  // 1.9.18 — THE BAR KEEPS ONE SHAPE (the solo peeks speak the set AROUND
  // the current picture even when the set is the picture alone): with a
  // single image both neighbors resolve to the picture itself, so the solo
  // bar paints the very same trio a gallery paints — locked.
  const solo = images.length < 2;
  const prevImage = images[(safeIndex - 1 + images.length) % images.length];
  const nextImage = images[(safeIndex + 1) % images.length];

  const viewer = (
    <motion.div
      /* 1.7.2 — THE BACKDROP IS OPAQUE FROM FRAME ONE ("when opening huge
         image preview … i can see the edges of the ui as it fades in, where
         normally i would want it to just fade in but not see the exposed
         corners" + "the cards in the card grid view would mark or like
         become visible over the image for a second as the huge image
         viewer is fading in"): the layer used to ride TWO entrance
         fades at once — framer's opacity 0->1 on the whole overlay AND
         the gd-pop-in scale (0.96 + a rise), so for its first ~150ms the
         dark backdrop itself was translucent and 4% SMALLER than the
         window: the grid's cards showed THROUGH the half-born scrim and
         read as floating over the picture, and the app's own edges
         (the titlebar, the panels — “the exposed corners”) peeked out
         around the scaled-down layer on every side. The layer now
         mounts AT FULL SIZE, FULL OPACITY — the 82% dark + blur covers
         the whole window on the first frame — and only the CONTENT
         fades in on top of it (the picture, the hud, the close key —
         .gd-imgview-in in index.css, the same 0.14s beat): the fade
         the owner wants stays, nothing behind the veil ever shows
         through it. The EXIT keeps framer's fade (closing reveals the
         app — the one direction where that is the point). */
      className="gd-imgview"
      // 0.42.0 — the viewer declares itself a modal citizen (see the header
      // note): the app's right-click regions stay quiet underneath, and the
      // stage's auto-switch rests while it is open.
      data-gd-modal="1"
      onContextMenu={onViewerContext}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14 }}
    >
      <button
        className="gd-btn gd-imgview-close !w-8 !h-8 !px-0"
        title="Close the viewer (Escape / click the empty area)"
        onClick={onClose}
      >
        <X size={15} />
      </button>

      <div
        ref={stageRefCb}
        className={clsx('gd-imgview-stage', panning && 'is-panning', canPan(zoom) && 'is-grabbable')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => {
          applyView(1, 0, 0);
        }}
      >
        {/* the low-res thumb paints instantly; the full file fades in over it.
            0.40.0 — NO crossOrigin ON THE DISPLAY (the 0.39 attribute made
            the load itself fail on CORS-strict setups — "i dont see the
            image in the huge preview"). */}
        <img
          ref={imgRef}
          key={src}
          src={src}
          alt=""
          draggable={false}
          className="gd-imgview-img"
          style={{ transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${zoom})` }}
          decoding="async"
          onLoad={(ev) => revealImgWhenPainted(ev.currentTarget, () => setFullLoaded(true))}
        />
        {/* 1.8.6 — the veil (see fullLoaded above): the darken + the wheel
            over the stage while the full file streams, the out flight when
            it lands. Pointer-events none — the pan gestures keep their
            hands. */}
        <div className={clsx('gd-load-veil has-out', fullLoaded && 'is-done')} aria-hidden="true">
          <span className="gd-wheel" style={{ ['--gd-wheel-s']: '20px' }} />
        </div>
        {/* 1.7.2 — the content's own entrance fade rides the CSS class
            (.gd-imgview-in in index.css): the img re-mounts per src (the
            key), so every image switch speaks the same soft arrival on top
            of the already-opaque backdrop. */}
      </div>

      {/* 0.39.0 — ONE BOTTOM TOOLBAR: the controls and the
          [previous · CURRENT · next] thumbnails share a single bar flush
          with the viewer's bottom edge ("make the next current and previous
          image viewer at the bottom on the bottom toolbar … and move the
          toolbar to the bottom").
          0.40.0 — THREE ZONES ("centralize the current before and after
          images in the center instead of leaning to the left"): the
          controls hold the LEFT end, and the peek trio sits DEAD CENTER
          of the bar (1fr · auto · 1fr).
          0.41.0 — the crop key is gone with the crop tool itself.
          1.9.15 — THE HINT IS RETIRED ("remove the text bottom right 'drag
          to pan · zoom with the keys or +/− · right-click for options ·
          do.u. etc'"): the right zone's usage text is gone with its whole
          seat — the bar keeps the same 1fr · auto · 1fr grid, so the
          controls hold the left end and the peek trio stays dead center
          with an empty right column balancing it.
          1.9.16 — THE BAR FINDS ITS BALANCE ("have the image count, zoom
          and zoom percentage and fit buttons and such be in the middle
          when its a single image, but when its multiple, have them on the
          left and right of the image switcher at the bottom, since
          currently the right side feels so empty, basically balance it"):
          the controls no longer all pile onto the left end. With MULTIPLE
          images the family splits around the switcher — the zoom trio
          (− · % · +) hugs the switcher's LEFT flank and the count + fit
          hug its RIGHT (each zone leaning toward the center, so the whole
          cluster reads as one balanced crown around the picture's
          navigator — the empty right side is gone without leaning the
          bar back the other way). With a SINGLE image the whole family —
          count, zoom, fit — rides the MID zone alone: the only grid child
          centers dead in the bar, exactly the seat the switcher owns when
          it exists.
          1.9.17 — THE MIDDLE BELONGS TO THE SWITCHER ("the image count
          and zoom and zoom percentage and the images right and left
          viewer in the huge image viewer window, they are mixing
          together and look bad, rework it so it fits in the new space
          and redo it properly"): the 1.9.16 lean parked BOTH control
          groups pressed against the switcher's arrows — the zoom trio
          up against the peek's left hand, the count + fit up against
          its right — so on a huge window the whole bar read as one
          mashed cluster crowding the navigator while the bar's own ends
          sat empty: the "mixing together" the report names. The ZONING
          keeps the 1.9.16 word (the control family still flanks the
          switcher; a single image still rides the whole family dead
          center through the mid zone alone); the PARKING is what was
          wrong, and it is reworked to fit the freed space: the left
          zone parks the zoom trio at the bar's own LEFT end and the
          flank parks the count + fit at the bar's own RIGHT end (the
          retired hint's old territory — a short, wrap-capable cluster
          that can never clip off the right edge the way the long
          single-line hint text once did), so the middle belongs to the
          switcher alone and the bar's full breathing width is the
          separation: nothing touches, nothing mixes, weight at both
          ends — the freed space finally reads as used.
          1.9.18 — THE BAR KEEPS ONE SHAPE ("when the image viewer has
          more than one image , it should have the reset the view button
          on the left with the zoom buttons, keep the count on the right
          still; but when its only one image , do have the same ui (aka
          as if it has multiple) and just have the center bottom where it
          shows the next and previous images locked"): the ternary that
          bred two bars is retired — whatever the viewer holds, the bar
          paints ONE shape. The reset key joins its own family at the
          LEFT end (the view crew − · % · + · reset, one cluster of
          view-controls at one end), the count keeps the RIGHT end
          alone, and the switcher keeps the middle. A single image
          rides the very same bar: both its neighbors are the picture
          itself, so the trio paints the same ui as if it had
          multiples — and it stands LOCKED (is-locked + disabled): the
          center bottom still shows the next and previous images, but
          the walk is pinned.
          1.9.19 — THE ENDS TRADE PLACES ("just make the zoom options on
          the right with the reset the view button, (reset the view
          button should be the one inwards towards the center of course
          not towards the edge , basically just mirror it) , and the
          count of the images should be on the left instead, thats
          all"): the two end crews trade seats. The view crew rides the
          FLANK now — the bar's own right end — MIRRORED, so the order
          reads reset · zoom-in · % · zoom-out and the reset key stands
          INWARDS, nearest the switcher (never parked against the edge,
          the literal mirror of the 1.9.18 crew whose reset was the
          inwards key at the left end), with the zoom-out key at the
          bar's own right edge. The count rides the LEFT zone at the
          bar's own left end. The one-shape law carries whole — one
          markup, the same three zones whatever the viewer holds, the
          switcher locked when solo, the middle still the switcher's
          alone; the parking laws are untouched, only the ends traded
          their crews. */}
      <div className="gd-imgview-hud">
        <div className="gd-imgview-hud-left">
          <span className="gd-imgview-count">
            {safeIndex + 1} / {images.length}
          </span>
        </div>
        <div className="gd-imgview-hud-mid">
          <div className={clsx('gd-imgview-peeks', solo && 'is-locked')}>
            <button
              type="button"
              className="gd-imgview-peek"
              title={solo ? 'No other images (locked)' : 'Previous (←)'}
              disabled={solo}
              onClick={() => go(-1)}
            >
              <img src={buildImageUrl(imagesPath, prevImage.thumb || prevImage.file)} alt="" draggable={false} />
              <ChevronLeft size={16} strokeWidth={2.6} className="gd-imgview-peek-arrow" />
            </button>
            <span className="gd-imgview-peek is-current" aria-current="true">
              <img src={thumbSrc} alt="" draggable={false} />
            </span>
            <button
              type="button"
              className="gd-imgview-peek"
              title={solo ? 'No other images (locked)' : 'Next (→)'}
              disabled={solo}
              onClick={() => go(1)}
            >
              <img src={buildImageUrl(imagesPath, nextImage.thumb || nextImage.file)} alt="" draggable={false} />
              <ChevronRight size={16} strokeWidth={2.6} className="gd-imgview-peek-arrow" />
            </button>
          </div>
        </div>
        <div className="gd-imgview-hud-flank">
          <button
            className="gd-btn !px-2"
            title="Reset the view (0 / double-click)"
            onClick={resetView}
          >
            <Maximize2 size={13} />
          </button>
          <button
            className="gd-btn !px-2"
            title="Zoom in (+)"
            onClick={() => setZoomChecked(zoom * ZOOM_STEP)}
          >
            <ZoomIn size={13} />
          </button>
          <span className="gd-imgview-zoomval">{`${Math.round(zoom * 100)}%`}</span>
          <button
            className="gd-btn !px-2"
            title="Zoom out (−)"
            onClick={() => setZoomChecked(zoom / ZOOM_STEP)}
          >
            <ZoomOut size={13} />
          </button>
        </div>
      </div>

      {/* 0.42.0 — THE VIEWER'S OWN MENU (set as cover · manager · copy ·
          reset · close). It rides the same body-level portal as the viewer
          itself; .gd-ctx-menu sits at z 950, above the viewer's 900. */}
      {ctx && <GdContextMenu x={ctx.x} y={ctx.y} items={ctxItems} onClose={() => setCtx(null)} />}
    </motion.div>
  );

  return portalTo ? createPortal(viewer, portalTo) : viewer;
}
