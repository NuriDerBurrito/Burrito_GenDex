import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ClipboardPaste, Eye, Images, ImagePlus, Star, Trash2 } from 'lucide-react';
import { buildImageUrl, revealImgWhenPainted } from '../utils/helpers.js';
import { gdToast } from '../utils/toasts.js';
import ImageManagerModal from './ImageManagerModal.jsx';
import GdContextMenu from './GdContextMenu.jsx';

// 0.30.0 — MODULE-LEVEL cache, shared by every stage instance: the natural
// image sizes survive the panel closing/reopening and view swaps, so a
// RE-mounted stage knows its geometry instantly — no fallback-16:10 flash,
// no grow/shrink "glitch" while the thumbs re-measure ("on the right panel
// opening it would have animation glitches where the image preview
// container would shrink or grow").
const NATURAL_SIZES = new Map(); // file -> {w, h}
// 1.9.0 — STAGE_LOADED (the loaded-once Set) RETIRES with the per-mount
// readiness law below: a file that decoded once said nothing about the
// img element mounted RIGHT NOW, and the veil trusted the old memory
// instead of the picture's own paint (the whole disease, told at the
// readyFile seat).

// Measure the natural size of every image once (cached by filename) so the
// stage can be sized to the tallest + widest image of the set. It measures
// the LIGHTEST tier the record owns (the preview copy, else the thumb —
// 1.6.2's progressive ladder), not the full files — aspect is identical,
// decode is a fraction of the cost, and the same decode warms the very
// file the stage's placeholder paints, so the panel opens without the old
// hitch.
function useImageSizes(imagesPath, images) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    for (const img of images || []) {
      if (!img?.file || NATURAL_SIZES.has(img.file)) continue;
      const el = new Image();
      el.onload = () => {
        if (!alive) return;
        NATURAL_SIZES.set(img.file, {
          w: el.naturalWidth || 0,
          h: el.naturalHeight || 0,
        });
        setTick((t) => t + 1);
      };
      el.onerror = () => {
        if (!alive) return;
        NATURAL_SIZES.set(img.file, { w: 0, h: 0 });
        setTick((t) => t + 1);
      };
      el.src = buildImageUrl(imagesPath, img.prev || img.thumb || img.file);
    }
    return () => {
      alive = false;
    };
  }, [imagesPath, images]);

  return useMemo(() => {
    let maxW = 0;
    let maxH = 0;
    let known = 0;
    for (const img of images || []) {
      const size = NATURAL_SIZES.get(img?.file);
      if (!size) continue;
      known += 1;
      maxW = Math.max(maxW, size.w);
      maxH = Math.max(maxH, size.h);
    }
    return { maxW, maxH, known, tick };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, tick]);
}

// 1.5.8 — THE PREWARM DOOR ("when opening a card for the first time, the
// image seems to start small and the container is small then it snaps big
// in the detail panel, fix that so it just starts big right away, i dont
// want inconsistant shifting container sizes"): the cache above only ever
// filled when a stage MOUNTED — a card's first open sized its container on
// the 16:10 fallback and then SNAPPED to the true aspect the moment the
// thumb's measurement landed (the remount case was solved in 0.30.0; the
// FIRST open of every card still paid the glitch). This door fills the same
// cache from OUTSIDE any stage: App walks the whole library's thumbs in
// idle chunks after the database lands, so the first open of every card
// already finds its aspect in the cache and mounts at its TRUE size — no
// fallback, no snap, the container born the size it stays. Known files are
// skipped (the walk only ever pays for images it has never measured), and
// a decode failure caches the honest zero exactly the way the stage's own
// probe does — the two doors can never disagree.
export function prewarmStageSizes(imagesPath, images) {
  if (typeof Image === 'undefined') return 0;
  let queued = 0;
  for (const img of images || []) {
    if (!img?.file || NATURAL_SIZES.has(img.file)) continue;
    const el = new Image();
    el.onload = () => {
      NATURAL_SIZES.set(img.file, { w: el.naturalWidth || 0, h: el.naturalHeight || 0 });
    };
    el.onerror = () => {
      NATURAL_SIZES.set(img.file, { w: 0, h: 0 });
    };
    el.src = buildImageUrl(imagesPath, img.prev || img.thumb || img.file);
    queued += 1;
  }
  return queued;
}

// Image stage for a version. The container is sized once to fit the tallest +
// widest image of the set; every image contain-fits inside over a blurred
// backdrop that fills the WHOLE container. Arrows / counter / cover / delete /
// manager are anchored to the CONTAINER edges. 0.30.0's IMAGE MANAGER window
// owns ordering now — 0.34.0 RETIRES the old sortable filmstrip and its
// show/hide key entirely ("remove the sorter and the option to show or hide
// the sorter since its useless, since image manager is what does this now").
// 0.28.0 — THE WHEEL AND THE DOUBLE-CLICK ARE GONE ("remove the feature to
//   scroll the image to zoom or double click to reset"): the stage is a
//   VIEWER, not a zoomer — scrolling over the image always scrolls the
//   panel/list like any other part of the page, and a double-click is a
//   plain double-click. The whole zoom/pan view state was deleted with the
//   gesture (nothing could ever set it again).
//   · bleed (right panel): the stage fills its card edge to edge and the FULL
//     image is shown (contain — never cropped) over a blurred bleed of
//     itself. 0.19.0: the living background layer that ran over that bleed
//     is gone with the animated backgrounds.
// 0.12.0 — CONTROLS NEVER CLIP: `.gd-stage-ctrl` no longer forces
//   `position: absolute` (the old class rule pulled the cover/delete/edit
//   buttons out of their top-right flex row — the row collapsed to 0x0 and
//   the buttons stacked past the stage's clipped right edge). The counter +
//   arrows keep their own explicit absolute utilities; the row's buttons are
//   plain flex items now.
// GenStack law: a new image must never flash empty/black — visibility is
// gated on the load event, and loaded files are remembered across switches.

// 0.34.0 — the AUTO-SWITCH cadence (Settings → Performance → AUTO-SWITCH
// IMAGES, "every 4 or 5 seconds, up to u to decide the period"): one calm
// forward step every 5 seconds — paused while the pointer rests on the
// stage or any window is open, so the walk never fights the reader. A
// manual step resets the beat (the effect re-runs on the current index).
const AUTO_SWIPE_MS = 5000;

export default function ImageStage({
  images,
  imagesPath,
  bleed = false,
  onAddImages,
  onSetCover,
  onDeleteImage,
  onReorderImages,
  onPasteRecord,
  onStatus,
  confirm,
  autoSwipe = false,
  /* 1.4.6 — THE DORMANT SEAT (the retained panel): while true the
     stage's self-driven walk sleeps — the panel is parked at width 0,
     nobody can see the stage, and the interval stops spending its beats
     on frames that will never paint (see App's retained-seat note). */
  dormant = false,
  // 0.42.0 — THE REMOTE OPENER: increments when the huge viewer's own menu
  // (or any other surface) asks for the IMAGE MANAGER — the stage opens its
  // manager window in answer, exactly as if its own key had been pressed.
  managerSignal = 0,
  // 0.38.0 — THE HUGE VIEWER HANDOFF: clicking the picture opens the
  // full image viewer (zoom / pan / manual swipe). The stage keeps
  // its own arrows and manager — the viewer is a second, bigger seat.
  onOpenViewer = null,
}) {
  const [index, setIndex] = useState(0);
  // 0.42.0 — THE VIEW STICKS TO THE IMAGE, NOT THE SLOT ("when updating the
  // order of the images, dont change the image thats on the right panel
  // viewer, ensure that it remains the same regardless of the index, unless
  // deleted then it would pick another one and stick with it"): the stage
  // remembers WHICH FILE it is showing. A reorder (the manager, the filmless
  // commit) just moves that file to another slot — the view follows the
  // FILE and the picture on screen never changes; only when the pinned file
  // itself leaves the set (deleted) does the stage pick a neighbor, pin IT,
  // and stay there through everything that follows.
  const [pinnedFile, setPinnedFile] = useState(null);
  // 0.31.0 — the IMAGE STAGE's own right-click menu (one of the per-region
  // menus: over a picture the menu speaks IMAGE — next/previous, cover,
  // manager, paste, delete — instead of the generic surface crew).
  const [ctx, setCtx] = useState(null); // { x, y }
  // 0.33.0 shipped a slow always-on clipboard PRESENCE probe (the READY
  // chip + the lit PASTE key). 0.34.0 removed it by request ("remove the
  // clipboard image ready button, i dont want you to always check it, check
  // it only when pressing on paste"): nothing polls anything anymore — the
  // READ itself is the check, and its verdict is the pill. 0.35.0 — the
  // verdict pill GRADUATED: it is no longer the stage's own fixed element
  // but a GLOBAL TOAST (gdToast → the ToastHub stack at the top of the
  // screen, above every window — "make the feedback noticifications like
  // the clipboard paste one visible even when in other windows"). The
  // stage keeps only the CALL: paste lands → the ok toast; the clipboard
  // holds nothing → the fail toast. Same verdict, same seat, but now it
  // paints over ANY window that is open — the image manager, settings,
  // anything — and the manager's own PASTE key answers through the very
  // same toasts.
  // 0.30.0 — the IMAGE MANAGER window (the ONE ordering surface — the
  // filmstrip sorter is retired in 0.34.0).
  const [managerOpen, setManagerOpen] = useState(false);
  // 1.7.3 — THE MANAGER'S OWN LANE ("image manager should open on it, dont
  // close the big image preview then open image manager"): the manager can
  // ride ABOVE the still-open huge viewer (the is-over-viewer z-920 lane —
  // Modal's overViewer prop) or UNDER it (the classic 200 lane, the 0.41.0
  // slot-click flow where the viewer covers the manager). Which lane it
  // takes is spoken by WHO asks for it: the REMOTE OPENER below (the
  // viewer's own menu, through managerSignal) seats it ABOVE the viewer;
  // the stage's own keys (the IMAGES key, the region menu — only reachable
  // while no viewer covers the stage) seat it on the classic lane; and the
  // close resets the seat so the next open asks fresh.
  const [managerOverViewer, setManagerOverViewer] = useState(false);
  // 1.9.0 — THE PICTURE'S OWN WORD ("when images are loading in the right
  // panel, for some reason after it finishes loading sometimes they stay
  // blurred for longer then become clear, fix that so once its loaded it
  // becomes clear, it also occurs when i switch cards to cards already
  // loaded it becomes blurry without the loading circle then becomes clear
  // later, my issue is mostly that the loading circle isnt on it too"): the
  // old `loaded` read a module-level Set of files that had EVER decoded —
  // a memory of loads past, not a report of the picture on screen. Two
  // diseases grew out of that seat: (1) a load whose event ran late (or
  // finished between the sweep's single 0ms ask and the listener's arm —
  // exactly the 1.7.0 race, one victim later) left the low-res placeholder
  // painting under a veil already darkened "done", so the stage read as
  // blurred long after the decode; (2) switching to a card whose file sat
  // in the Set flipped `loaded` true on the FIRST paint — while the
  // freshly-mounted img element was still decoding from cache, the cheap
  // thumb painted alone beneath a veil that said "is-done": blur with NO
  // wheel, the exact report. The truth moves to the element itself now:
  // `readyFile` is PER-MOUNT state — it resets on every image change and
  // lands only when THIS mounted img speaks (its own onLoad, or the
  // completion sweep reading img.complete below). While the element has
  // not spoken, the veil is live: the wheel rides whenever the picture is
  // not clear yet, a cached decode included — a fast cache answers in
  // one or two frames and the wheel's own 0.24s out flight swallows the
  // flash, and a slow one finally says what it always was: loading. The
  // big viewer already spoke this law (fullLoaded, its own per-src state);
  // the stage joins it.
  // 1.9.1 — THE WORD ITSELF MOVES ONE STEP DEEPER ("when images are loading
  // with the circle, when the circle vanishes the image is still blurry for
  // another second or so, something funky seems to be going on fix that"):
  // a LOAD is not a PAINT. The full img mounts with decoding="async", and
  // the load event can fire (img.complete flag and all) while the raster is
  // still decoding on another thread — the element says "loaded", the veil
  // retires the wheel, the sharp layer takes its opacity, and paints
  // nothing yet: the blurred placeholder alone stays on screen, wheel
  // already gone, for the breath the decode still owes. The mark now rides
  // revealImgWhenPainted (helpers.js): the element's own decode() promise,
  // two committed frames, and rails for the hidden-window family — the
  // wheel's farewell and the picture's own clearing speak in the same
  // breath, or the wheel keeps turning until they can. See the helper's
  // own seat for the whole story.
  const [readyFile, setReadyFile] = useState(null);
  // the ref twin: the ladder's timers read the CURRENT word without
  // re-arming on every mark (a state dep would resurrect the timers the
  // moment they speak — the stand-down needs a silent mirror).
  const readyFileRef = useRef(null);
  useEffect(() => {
    readyFileRef.current = readyFile;
  }, [readyFile]);

  // 0.14.0 — SLIDE DIRECTION for image switches (arrow keys / arrow
  // buttons): +1 = the next image slides in from the right, -1 = the
  // previous one comes back from the left.
  const [dir, setDir] = useState(1);

  // 0.46.0 — THE VIEW INDEX IS DERIVED, NEVER RECONCILED ("when i let go [in
  // the image manager] it snaps to older index then new index"): the old law
  // kept a raw `index` NUMBER and healed it to the pinned file's new slot in
  // a PASSIVE effect — one render late. At the reorder commit the flushSync
  // rendered with the STALE number, so `selectedIndex` (the manager's ring)
  // and the stage picture pointed at the OLD SLOT for one paint — the ring
  // mounted on whatever file now sat at the old index, popped back out
  // (~180ms of visible wrong seat), then landed on the moved file's new
  // slot: the reported old-index-then-new-index snap, amplified by the 0.45
  // mark pops. The index is now a pure DERIVATION from the pinned file, in
  // the SAME render as the reorder: the ring rides its owner through the
  // commit in one continuous paint, the stage picture never flickers, and a
  // plain reorder fires no mark mount or exit at all. `index` remains only
  // as the fallback seat for the never-pinned / deleted-anchor case.
  const safeIndex = useMemo(() => {
    if (!images.length) return 0;
    if (pinnedFile) {
      const i = images.findIndex((im) => im.file === pinnedFile);
      if (i >= 0) return i;
    }
    return Math.min(index, images.length - 1);
  }, [images, pinnedFile, index]);
  const image = images[safeIndex];

  const { maxW, maxH, known } = useImageSizes(imagesPath, images);
  // Stage aspect = widest / tallest across the set (fallback 16/10).
  const stageAspect = maxW > 0 && maxH > 0 ? maxW / maxH : 16 / 10;

  // 0.42.0 — THE STICK-BY-FILE EFFECT (see the pinnedFile note above): on
  // every images change, follow the pinned file wherever it landed; when it
  // is gone, clamp to the nearest surviving slot, pin THAT file, and stick.
  // 0.46.0 — with safeIndex DERIVED above, this effect no longer drives the
  // view; it only firms up the PIN: re-pin on the deleted-anchor case and
  // keep the fallback `index` state in sync with the derived seat so a later
  // unpin never jumps.
  useEffect(() => {
    if (!images.length) {
      setPinnedFile(null);
      return;
    }
    let i = pinnedFile ? images.findIndex((im) => im.file === pinnedFile) : -1;
    if (i < 0) {
      i = Math.max(0, Math.min(index, images.length - 1));
      setPinnedFile(images[i].file);
      setIndex(i);
    } else if (i !== index) {
      setIndex(i);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  // 0.42.0 — the remote opener answers: the viewer's own menu (or any other
  // caller) asks for the manager by bumping the signal.
  // 1.7.3 — and the remote opener speaks FROM ABOVE: the signal's caller is
  // the viewer's own menu, so the manager seats on the OVER-VIEWER lane —
  // the big preview stays open beneath it, exactly the report's ask.
  useEffect(() => {
    if (managerSignal) {
      setManagerOpen(true);
      setManagerOverViewer(true);
    }
  }, [managerSignal]);

  const markLoaded = (id) => {
    // 1.9.0 — the functional form: the sweep's timers and the onLoad can
    // both speak for the same file (a late event after the ladder caught
    // it), and a stale closure must never answer for a file that already
    // left the stage — cur === id keeps the second word a no-op.
    // 1.9.1 — the CALLERS hand the element to revealImgWhenPainted first
    // (the paint's own word, not the load's — see the readyFile seat), so
    // every road into this mark has already waited for the raster.
    setReadyFile((cur) => (cur === id ? cur : id));
  };

  const flashClipNote = useCallback((kind, text) => {
    // 0.35.0 — same signature, new pipes: the verdict rides the GLOBAL
    // toast layer instead of the stage's own pill portal.
    gdToast(text, kind);
  }, []);

  // 0.30.0 — MANUAL PASTE ("add a section on the right to paste, which when
  // pressed will automatically grab the clipboard image"): reads the
  // clipboard through the main process; no image there = a quiet no-op (a
  // soft status note, nothing more).
  // 0.33.0 — the quiet no-op SPEAKS: a fail pill ("no image on the
  // clipboard") when there is nothing to paste, an ok pill ("image pasted")
  // when it lands — the feedback the PASTE key owes its presser.
  // 0.34.0 — the READ is the check (the presence probe is gone, per
  // "check it only when pressing on paste") and the verdict rides the TOP
  // of the screen, portal-rendered above every window.
  // 0.36.0 — ONE VERDICT, ONE TOAST ("there is two feedbacks to the no image
  // in clipboard, fix it so its only the red one ... two image pasted
  // feedbacks, fix that so its only one"): the toast IS the verdict now —
  // the extra onStatus line each branch used to fire doubled every pill
  // through the app's toast junction. The texts match the app's sentence
  // case everywhere else.
  const pasteFromClipboard = async () => {
    try {
      const img = await window.api?.clipboardReadImage?.();
      if (!img?.base64) {
        flashClipNote('fail', 'No image on the clipboard');
        return;
      }
      const record = await window.api.saveImageBuffer(img.base64, img.ext || '.png');
      if (record) {
        onPasteRecord?.(record);
        flashClipNote('ok', 'Image pasted');
      } else {
        flashClipNote('fail', 'Paste failed');
      }
    } catch {
      flashClipNote('fail', 'Paste failed');
    }
  };

  const src = useMemo(() => (image ? buildImageUrl(imagesPath, image.file) : ''), [image, imagesPath]);
  // Blur backdrop + placeholder come from the LIGHTEST tier the record owns
  // — the 1.6.1 progressive ladder ("when cards have images inside, i do
  // notice that they open after a delay, fix that; if you wanna implement
  // lower quality then thumbnail then full, you are free to"): the PREVIEW
  // copy (the lightest cover tier the importer builds) paints first, the
  // thumb answers when no prev was written, and the FULL file cross-fades
  // over the placeholder exactly as it always did. The stage is never blank
  // while anything decodes — and the cheaper the first tier, the sooner the
  // eye has a picture.
  const thumbSrc = useMemo(
    () => (image ? buildImageUrl(imagesPath, image.prev || image.thumb || image.file) : ''),
    [image, imagesPath]
  );
  // 1.9.0 — the readiness is the MOUNT's own word (see the readyFile
  // seat above): the file that painted, or nothing yet.
  const loaded = image ? readyFile === image.file : false;

  // 1.7.0 — THE COMPLETION SWEEP ("sometimes the image preview in the
  // details panel just shows as blurred and nothing else, no clear version
  // (not sure how to replicate it i was alt tabbed away)"): the full
  // image's reveal gates on its OWN onLoad — and a load that FINISHES
  // before React's listener is attached never says a word: the classic
  // missed-event race (a file:// decode that completes in the same task as
  // the mount, an image whose cache answered before the commit, a window
  // hidden mid-decode that swallowed the event) leaves the reveal armed
  // forever. The sweep asks the DOM one honest question: does a mounted
  // FULL img for THIS file already read `complete` with real pixel dims?
  // Then the decode is done, the event is gone, and the mark lands from
  // the truth instead of the promise.
  // 1.9.0 — THE SWEEP BECOMES A LADDER ("after it finishes loading
  // sometimes they stay blurred for longer then become clear"): one 0ms
  // ask only caught loads that finished BEFORE the first tick — a decode
  // that landed a breath later, with its event swallowed (the 1.7.0
  // family: a hidden window, a cache answering between the arm and the
  // ask), left the placeholder painting under a veil that believed
  // nothing yet, blurred "for longer" until some later re-render happened
  // to speak. The ask now repeats on a short ladder (0 / 60 / 180 / 420 /
  // 900ms — five cheap querySelectorAll reads, each matching the img's
  // own currentSrc against THIS image's src so the AnimatePresence twin
  // from the slide's exit can never answer for the incoming file), and
  // the ladder stands down the moment any rung or the onLoad itself marks
  // the file. The effect ALSO re-arms the veil per mount: readyFile resets
  // with every image change (the per-mount law above), so a file coming
  // back from the Set era re-introduces itself through its own element —
  // the memory never again outranks the paint. The effect lives BELOW the
  // src/thumbSrc/loaded declarations on purpose — the deps read them, and
  // the sweep order reads the stage's own truth (img.complete) rather than
  // the derived flags.
  useEffect(() => {
    if (!image) return undefined;
    const node = stageRootRef.current;
    const file = image.file;
    // the per-mount reset: every file change re-arms the veil until THIS
    // mount's element speaks (a no-op when the state already moved on).
    setReadyFile((cur) => (cur === file ? cur : null));
    if (!node || typeof node.querySelectorAll !== 'function' || !src) return undefined;
    const ask = () => {
      let found = null;
      try {
        const want = new URL(src, window.location.href).href;
        node.querySelectorAll('img.gd-stage-full').forEach((im) => {
          if (found || !im) return;
          if (!im.complete || !im.naturalWidth) return;
          const have = im.currentSrc || im.src || '';
          if (have === want || have === src) found = im;
        });
      } catch {
        /* best-effort — a broken URL keeps the old onLoad law */
      }
      // 1.9.1 — the rung hands the ELEMENT to the reveal law (the mark
      // waits for the paint now, not the flag — see revealImgWhenPainted
      // in helpers.js): a complete flag caught mid-decode can no longer
      // retire the wheel before the picture it promises exists.
      if (found) revealImgWhenPainted(found, () => markLoaded(file));
      return !!found;
    };
    // the ladder: 0ms catches the before-the-arm race (the 1.7.0 word),
    // the later rungs catch the swallowed-event family the single ask
    // could never see (the 1.9.0 word) — each rung stands down the moment
    // one of them or the onLoad itself has spoken.
    const rungs = [0, 60, 180, 420, 900];
    const timers = rungs.map((ms) =>
      setTimeout(() => {
        if (readyFileRef.current === file) return; // already spoken — stand down
        ask();
      }, ms)
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image?.file, src]);
  // Stage geometry is final once every image's size is known — controls never
  // re-anchored (no arrows jumping around after a click).
  const sized = !images.length || known >= images.length;
  // 0.30.0 — the NEIGHBORS: what the ← → keys will bring ("do also show the
  // image that would appear when pressing right or left") — flanking peek
  // thumbs at the stage's bottom, clickable like the arrows.
  const prevImage = images.length > 1 ? images[(safeIndex - 1 + images.length) % images.length] : null;
  const nextImage = images.length > 1 ? images[(safeIndex + 1) % images.length] : null;

  const go = (d) => {
    if (images.length < 2) return;
    setDir(d);
    const n = (safeIndex + d + images.length) % images.length;
    setIndex(n);
    // 0.42.0 — every deliberate walk re-pins the file it lands on.
    setPinnedFile(images[n]?.file ?? null);
  };

  // 0.34.0 — AUTO-SWITCH IMAGES: with the setting on, the stage walks
  // forward one image every beat. Pauses while the pointer rests on the
  // stage (the reader is looking) and while any window is open; the effect
  // re-runs on the current index, so every MANUAL step (arrows, peeks,
  // keys) restarts the beat instead of stacking a surprise.
  // 1.0.4 — THE WALK THAT ALWAYS COMES BACK ("entering image manager (or
  // full image preview) mode and closing it would not continue the auto
  // image scroll, when closing it it should continue scrolling
  // automatically"): the old hover pause trusted pointerenter/pointerleave
  // alone — and a stationary pointer NEVER gets either when a fullscreen
  // overlay (the huge viewer, a modal backdrop) appears above it or
  // vanishes from above it. Click the picture, browse the viewer with the
  // keyboard, close it with Escape — the pointer never moved, so the
  // enter recorded before the flight was still armed and the walk rested
  // FOREVER. Two heals now keep the pause honest:
  //   · a window open at tick time means the pointer is on a WINDOW, not
  //     reading the stage — the hover session is cleared right there, so
  //     the very next beat after the window closes steps the walk again;
  //   · a surviving hover is VERIFIED against reality (elementFromPoint at
  //     the last known pointer seat must land inside the stage) — any
  //     stale enter is healed on the spot instead of resting the walk.
  // The reading pause survives: a pointer genuinely resting on the stage
  // (no window over it) still holds the walk, exactly as designed — but
  // only once the user has MOVED the pointer again. While a window is
  // open the hover pause is SUPPRESSED: the browser re-fires pointerenter
  // on the stage the moment the overlay above a stationary pointer
  // unmounts, so a freshly-closed window would otherwise re-arm the pause
  // with a pointer the user never moved. The suppression lifts on the
  // first real pointermove/pointerdown anywhere — from that point the
  // normal reading pause rules again.
  const hoverRef = useRef(false);
  const hoverSuppressedRef = useRef(false);
  const stageRootRef = useRef(null);
  const pointerSeatRef = useRef(null); // { x, y } — last known pointer seat
  useEffect(() => {
    const seat = (e) => {
      pointerSeatRef.current = { x: e.clientX, y: e.clientY };
      // A REAL pointer event — the user is driving again; the reading
      // pause may re-engage from here on.
      hoverSuppressedRef.current = false;
    };
    window.addEventListener('pointermove', seat, { passive: true });
    window.addEventListener('pointerdown', seat, { passive: true });
    return () => {
      window.removeEventListener('pointermove', seat);
      window.removeEventListener('pointerdown', seat);
    };
  }, []);
  const hoverIsReal = () => {
    if (!hoverRef.current) return false;
    const el = stageRootRef.current;
    const p = pointerSeatRef.current;
    if (!el || typeof document === 'undefined') return false;
    if (!p) return hoverRef.current; // no pointer yet — trust the enter
    const hit = document.elementFromPoint(p.x, p.y);
    if (hit && el.contains(hit)) return true;
    hoverRef.current = false; // stale enter — heal it
    return false;
  };
  useEffect(() => {
    if (!autoSwipe || dormant || images.length < 2) return undefined;
    const id = setInterval(() => {
      // 1.7.6 — THE WALK SLEEPS IN THE DARK (App's "the dark works
      // nothing" law): a hidden window produces no frames and no hover —
      // a tick there only churns state + decodes images nobody sees (and
      // each slide mounts fresh animation clocks the hide-snapshot never
      // held). The walk picks up on the next tick after the window shows.
      if (typeof document !== 'undefined' && document.hidden) return;
      if (typeof document !== 'undefined' && document.querySelector('[data-gd-modal], .gd-ctx-menu')) {
        // A window is open — the pointer is on the window, not the stage.
        // The hover session cannot survive a window, and the pause stays
        // SUPPRESSED after it closes (until the user moves the pointer
        // again), so the walk resumes at the very next beat (1.0.4).
        hoverRef.current = false;
        hoverSuppressedRef.current = true;
        return;
      }
      if (!hoverSuppressedRef.current && hoverIsReal()) return;
      setDir(1);
      setIndex((i) => (i + 1) % images.length);
      setPinnedFile(images[(safeIndex + 1) % images.length]?.file ?? null);
    }, AUTO_SWIPE_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSwipe, dormant, images.length, safeIndex]);

  // 0.34.0 — COVER FOLLOWS THE VIEW ("when starring an image to be the top
  // image, dont keep viewing the same position instead move to the top image
  // so it doesnt seem like the view was cut off"): promoting an image to the
  // cover now also walks the view to slot 0 — the new top image is what you
  // see, not whatever landed in the old slot's place.
  const makeCover = (i) => {
    if (i === 0) return;
    onSetCover?.(i);
    // 0.42.0 — pin the PROMOTED file: after the reorder it lands on slot 0
    // and the stick-by-file effect walks the view to it (the 0.34 law,
    // kept).
    setPinnedFile(images[i]?.file ?? null);
    setIndex(0);
    setDir(-1);
  };

  // 0.14.0 — LEFT / RIGHT ARROW KEYS walk the images (the right panel's
  // viewer, and the full-window view). Ignored while typing and while any
  // modal is open (a confirm dialog must not shift the image its action
  // refers to).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (typeof document !== 'undefined' && document.querySelector('[data-gd-modal]')) return;
      if (images.length < 2) return;
      e.preventDefault();
      go(e.key === 'ArrowRight' ? 1 : -1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  const askDelete = () => {
    if (!image) return;
    confirm({
      title: 'DELETE IMAGE',
      message: `Delete image ${safeIndex + 1} of ${images.length} from this version? This cannot be undone.`,
      confirmLabel: 'DELETE',
      danger: true,
      onConfirm: () => onDeleteImage(safeIndex),
    });
  };

  // 0.31.0 — THE STAGE'S OWN REGION MENU ("on a card it will show the option
  // to edit, delete etc.. while on the card viewer empty area…"). Right-
  // clicking a PICTURE speaks image: browse, cover, the manager, paste,
  // delete. stopPropagation keeps the app-level surface menu off it, and
  // an empty stage falls back to the parent region's menu (0.32.0: the
  // modal-open carve-out left with the native menu — a window over the
  // stage gets the app's own window menus now).
  const onStageContext = (e) => {
    if (!image) return; // empty stage — the parent region's menu serves it
    e.preventDefault();
    e.stopPropagation();
    setCtx({ x: e.clientX, y: e.clientY });
  };

  const stageCtxItems = [
    { id: 'hdr', header: `IMAGE · ${safeIndex + 1} / ${images.length}` },
    { id: 'prev', label: 'Previous image', icon: ChevronLeft, disabled: images.length < 2, onPick: () => go(-1) },
    { id: 'next', label: 'Next image', icon: ChevronRight, disabled: images.length < 2, onPick: () => go(1) },
    // 0.42.0 — VIEW IMAGE joins the stage's own menu ("right click … to get
    // options to select as cover image or image manager or view image").
    { id: 'view', label: 'View image', icon: Eye, onPick: () => onOpenViewer?.(safeIndex) },
    { id: 'sep1', separator: true },
    {
      id: 'cover',
      label: safeIndex === 0 ? 'Set as cover (already first)' : 'Set as cover',
      icon: Star,
      disabled: safeIndex === 0,
      onPick: () => makeCover(safeIndex),
    },
    { id: 'manager', label: 'Image manager', icon: Images, onPick: () => { setManagerOpen(true); setManagerOverViewer(false); } },
    { id: 'paste', label: 'Paste image', icon: ClipboardPaste, onPick: pasteFromClipboard },
    { id: 'sep2', separator: true },
    { id: 'delete', label: 'Delete image', icon: Trash2, danger: true, onPick: askDelete },
  ];

  return (
    // 0.12.0 — BLEED CARD KEEPS A BOTTOM EDGE: the drop slot below the stage
    // is the card's last row, and a flush `p-0` left its dashed border
    // welded onto the card's own bottom border (the "clipping at the
    // bottom" report). The stage stays full-bleed at the top + sides; only
    // the bottom gets breathing room.
    // 0.15.0 — gd-stage-card + is-empty: with NO image, the card + stage turn
    // transparent so the surface's own texture shows through the frame (the
    // pattern lives in the EMPTY state only — a shown image gets the clean
    // blurred bleed).
    <div className={clsx('gd-card gd-stage-card', !image && 'is-empty', bleed ? 'p-0 pb-2.5 overflow-hidden' : 'p-2.5')}>
      <div
        className={clsx('gd-stage select-none', !bleed && 'mx-auto', bleed && 'is-bleed', !image && 'is-empty')}
        style={{
          aspectRatio: `${stageAspect}`,
          maxHeight: '68vh',
          // Full-window look: keep the aspect TRUE even when the height clamps —
          // the stage hugs its own shape, centered in the column. In BLEED
          // mode the stage spans the full container width instead; the FULL
          // image contains inside it over the blurred bleed, and the card
          // clips the corners.
          ...(bleed
            ? {}
            : {
                maxWidth: `calc(68vh * ${stageAspect})`,
                width: '100%',
              }),
          width: '100%',
          minHeight: 240,
        }}
        // 0.32.0 — the preview carries NO tooltip anymore ("remove the
        // tooltip on the image preview entirely") — the stage is a view,
        // not a control; the arrows already say which way they go.
        // 0.34.0 — hover feeds the AUTO-SWITCH pause (a resting pointer
        // means the reader is looking — the walk waits).
        // 1.0.4 — stageRootRef feeds the tick-time hover VERIFICATION (see
        // the auto-switch note): the last known pointer seat must land on
        // a descendant of THIS node for the reading pause to hold.
        ref={stageRootRef}
        onContextMenu={onStageContext}
        onPointerEnter={() => {
          hoverRef.current = true;
        }}
        onPointerLeave={() => {
          hoverRef.current = false;
        }}
      >
        {/* 1.6.7 — THE PICTURES' OWN SEAT (gd-stage-pictures — see
            .gd-cv-swap in index.css): every layer that IS the picture —
            the blurred backdrop, the eye affordance, the bleed slide /
            the click-picture pair, and the empty state — rides one named
            wrapper so the card-swap fade can reach THE PICTURE ALONE.
            The owner's law (1.6.7): during the detail panel's swap
            feedback NOTHING else fades — not the arrows, not the counter,
            not the corner keys, not the peek row, not the ADD / PASTE row
            below the stage: "i dont want the buttons to fade … the left
            and right buttons … add or drop area", all of them chrome
            that stays SOLID while the picture alone breathes in. The
            wrapper is a plain absolute box the stage's own geometry
            already speaks (every child keeps its own seat, its own
            clicks, its own clipping — only the NAME is new). */}
        <span className="gd-stage-pictures">
        {image ? (
          <>
            {/* Blurred backdrop — the cheap thumb, filling the entire container
                edge to edge, live from the first frame (the blur-up placeholder).
                In BLEED mode this is the bleed BEHIND the full image. */}
            <img src={thumbSrc} alt="" className="gd-stage-blur" draggable={false} />
            {/* 0.39.0 — THE EYE AFFORDANCE ("add an eye icon when the cursor
                hovers over the image in the middle with slightly darkened
                around (not all the image)"): a soft radial spotlight under a
                centered eye, fading in with the stage's hover — it sits on the
                PICTURE's wrapper only (the stage's empty sides stay clean),
                points at nothing, and never intercepts the pointer. */}
            {image && (
              <span className="gd-stage-eye" aria-hidden>
                <Eye size={22} strokeWidth={2.2} />
              </span>
            )}

            {bleed ? (
              /* 0.14.0 — the panel viewer SLIDES between images (arrow keys
                 or arrow buttons): the incoming picture drifts in from the
                 direction of travel while the old one fades beneath it.
                 0.22.0 — THE PLACEHOLDER RIDES THE SLIDE: the low-res thumb
                 is the visible image while the full file decodes — the
                 wrapper (thumb + full image) animates as ONE unit, so the
                 slide always performs, loaded or not; the full picture
                 simply cross-fades over its own low-res self when it lands
                 (the no-flash gate still applies to the FULL image only).
                 0.39.0 — THE SLIDE OPENS THE VIEWER ("ensure the full image
                 viewer doesnt popup if its not clicked on the image
                 explicitly, so pressing on buttons wont trigger it and
                 pressing on the sides wont trigger it, only on the image"):
                 the click rides the PICTURE's own wrapper — the stage's
                 sides, its arrows, its corner keys never open anything. */
              <AnimatePresence initial={false}>
                <motion.div
                  key={image.file}
                  className="gd-stage-slide"
                  initial={{ opacity: 0, x: 34 * dir }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.19, ease: 'easeOut' }}
                  onClick={() => onOpenViewer?.(safeIndex)}
                >
                  <img src={thumbSrc} alt="" draggable={false} className="gd-stage-img gd-stage-ph" />
                  <motion.img
                    src={src}
                    alt=""
                    loading="eager"
                    decoding="async"
                    draggable={false}
                    onLoad={(ev) => revealImgWhenPainted(ev.currentTarget, () => markLoaded(image.file))}
                    className="gd-stage-img gd-stage-full"
                    initial={false}
                    animate={{ opacity: loaded ? 1 : 0 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                  />
                </motion.div>
              </AnimatePresence>
            ) : (
              <>
                {/* 0.22.0 — the low-res placeholder behind the full image
                    here too: while the full file decodes the thumb shows at
                    full strength (the blur backdrop is cover-cropped; this
                    one contain-fits exactly like the real image).
                    0.39.0 — the click rides the PICTURE's wrapper here too
                    (only an explicit click on the image opens the viewer). */}
                <span className="gd-stage-clickpic" onClick={() => onOpenViewer?.(safeIndex)}>
                  <img src={thumbSrc} alt="" draggable={false} className="gd-stage-img gd-stage-ph" />
                  <img
                    key={image.file}
                    src={src}
                    alt=""
                    loading="eager"
                    decoding="async"
                    draggable={false}
                    onLoad={(ev) => revealImgWhenPainted(ev.currentTarget, () => markLoaded(image.file))}
                    className={clsx(
                      'gd-stage-img gd-stage-full transition-opacity duration-200',
                      loaded ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </span>
              </>
            )}
            {/* 1.8.6 — THE WHEEL THAT OUTLIVES THE FREEZE ("... or the image
                previews loading etc.. ... in some situations like on preview
                image it would just be visible with the darken ... ensure it
                has an out animation for the image preview one instead of the
                rest where it would be an appear and dissapear etc.."): the
                old law was a small ring tucked in the corner, mounted only
                while unloaded — it vanished the FRAME the decode landed, no
                darkening, no farewell. The preview's loading seat is a VEIL
                now (see .gd-load-veil in index.css): a slight darkening over
                the PICTURE's own wrapper with the compositor wheel dead
                center — visible with the darken, exactly as the report words
                it — and the veil STAYS MOUNTED through the flip so the OUT
                FLIGHT can speak: the leaving edge alone carries the opacity
                transition (the arrival stays an appear), the wheel fading
                out over the picture it just finished painting. The veil
                rides the pictures' own wrapper (the swap fade never reaches
                it — the wheel belongs to the LOAD, not to the card). */}
            <div className={clsx('gd-load-veil has-out', loaded && 'is-done')} aria-hidden="true">
              <span className="gd-wheel" style={{ ['--gd-wheel-s']: '18px' }} />
            </div>

            {/* 0.30.0 — THE NEIGHBOR PEEKS were here, INSIDE the stage's
                bottom; 0.31.0 moved them to their OWN ROW BELOW the stage
                ("make them below the image and have their own row so they
                don't interfere with the image, also add the current image
                in the middle") — see the gd-stage-peeks row under the
                stage, with the current picture between the neighbors. */}

            {/* Counter — container's top-left corner (once geometry is final).
                0.31.0 — the counter is NOT a gd-stage-ctrl anymore: the
                stage's floating controls now rest hidden and fade in with
                the cursor ("only appear when the cursor is above the image
                as they fade in"), but the counter is a passive label, not a
                control — it stays visible always. 0.32.0 — its tooltip is
                gone with the stage's own ("remove the tooltip on the image
                preview entirely"): a position label explains itself.
                0.48.0 — THE LABEL POPS WITH ITS OUTLINE ("animation is
                missing in the numeix theme, inside the image manager,
                specifically the top label disappearing and reappearing
                alongside the outline"): the chip used to swap its text in
                one paint — no animation at all, on any theme — while the
                picture slid and the manager's marks popped around it. The
                counter now pops like every other mark in the app: keyed by
                the picture it counts, the old chip fades out and the new
                one drops in (~160ms crossfade at the same seat) whenever
                the shown image changes hands — arrows, manager star /
                reorder / delete, swipe. A plain reorder pops nothing (same
                law as the manager's marks); the chip is a label + outline
                riding as ONE unit, so they disappear and reappear together. */}
            {sized && (
              <AnimatePresence initial={false}>
                <motion.span
                  key={`count-${image?.file || 'none'}`}
                  className="gd-stage-count absolute top-2 left-2 !cursor-default px-2 py-0.5 text-[10px] font-bold tracking-[0.14em]"
                  initial={{ opacity: 0, y: -5, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.94 }}
                  transition={{ duration: 0.16, ease: [0.25, 0.9, 0.35, 1] }}
                >
                  {safeIndex + 1} / {images.length}
                </motion.span>
              </AnimatePresence>
            )}

            {/* Arrows — the container's full edges, vertically centered. */}
            {sized && images.length > 1 && (
              <>
                <button
                  className="gd-stage-ctrl absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full"
                  title="Previous (←)"
                  onClick={() => go(-1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="gd-stage-ctrl absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full"
                  title="Next (→)"
                  onClick={() => go(1)}
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}

            {/* Cover / delete / manager — the container's top-right corner.
                The row is a plain flex box (0.12.0): its .gd-stage-ctrl buttons
                are IN FLOW, so the row sizes to its content and sits 8px inside
                the stage's top-right — nothing can stack or clip past the
                edge anymore.
                0.22.0 — the STAR is always visible: when the image is already
                the cover (first) it shows FILLED IN YELLOW and does nothing on
                click (no more hiding the button once the image is on top).
                0.34.0 — the old EDIT key (the filmstrip sorter's show/hide)
                is gone with the sorter itself — the IMAGE MANAGER key is
                the one ordering surface now. */}
            <div className={clsx('absolute top-2 right-2 z-[7] flex items-center gap-1.5', !sized && 'opacity-0 pointer-events-none')}>
              <button
                className={clsx('gd-stage-ctrl w-8 h-8 rounded-full', safeIndex === 0 && 'is-cover')}
                title={safeIndex === 0 ? 'Cover: already first' : 'Set as cover'}
                onClick={() => makeCover(safeIndex)}
              >
                {safeIndex === 0 ? (
                  <Star size={14} fill="#f6c945" style={{ color: '#f6c945' }} />
                ) : (
                  <Star size={14} />
                )}
              </button>
              <button
                className="gd-stage-ctrl is-danger w-8 h-8 rounded-full"
                title="Delete this image"
                onClick={askDelete}
              >
                <Trash2 size={14} />
              </button>
              {/* 0.30.0 — THE IMAGE MANAGER key: opens the window with every
                  image in slot containers — order, delete, add, paste. */}
              <button
                className={clsx('gd-stage-ctrl w-8 h-8 rounded-full', managerOpen && 'is-on')}
                title="Image manager: order, delete, add"
                onClick={() => { setManagerOpen(true); setManagerOverViewer(false); }}
              >
                <Images size={14} />
              </button>
            </div>
          </>
        ) : (
          /* 1.7.6 — THE MARKS WEAR A PLATE ("the image preview container in
              the detail window still has the dotted pattern clip into the
              no image text and the x, change that so the x and no image
              text has an outline of some sort around it that prevents
              them from clipping into it"): the 1.7.5 cure cleared the
              stage's OWN paper, but the numeix bleed veil (the dots the
              theme paints over the empty bleed at z 2) still rastered
              ABOVE these marks — they sat at z-auto, under the lattice,
              so the dots cut straight through the glyph pixels. The empty
              block climbs to the picture's own rung (z 3, the loaded
              image's lane — above the veil by rank, not DOM luck) and the
              marks sit on an OPAQUE GROUNDED PLATE of the card's own
              panel, framed by the stage's own hairline law: a badge no
              overlay can bleed through — veil or no veil, every theme. */
          <div className="gd-empty-marks absolute inset-0 flex flex-col items-center justify-center">
            <div className="gd-empty-plate flex flex-col items-center gap-2 px-6 py-4">
              <span className="gd-empty-mark" style={{ fontSize: 40 }}>
                ✖
              </span>
              <span className="text-[10px] tracking-[0.2em] text-gd-mute uppercase">No images yet</span>
            </div>
          </div>
        )}
        </span>
      </div>

      {/* 0.31.0 — THE PEEK ROW, BELOW THE STAGE ("make them below the image
          and have their own row so they don't interfere with the image, also
          add the current image in the middle"): [previous · CURRENT · next]
          centered under the stage — the neighbors are quiet, clickable
          chevron thumbs; the current picture sits ringed between them, a
          position marker, not a control. NO tooltips anywhere in the row
          ("remove the tooltips from the bottom preview images of next and
          previous") — the chevrons already say which way each one goes. The
          row only exists for a set of 2+ images. */}
      {images.length > 1 && image && (
        <div className={clsx('gd-stage-peeks', bleed && 'px-2.5')}>
          <button type="button" className="gd-stage-peek is-neighbor" onClick={() => go(-1)}>
            <img src={buildImageUrl(imagesPath, prevImage.thumb || prevImage.file)} alt="" draggable={false} />
            <ChevronLeft size={10} strokeWidth={2.6} />
          </button>
          <span className="gd-stage-peek is-current" aria-current="true">
            <img src={buildImageUrl(imagesPath, image.thumb || image.file)} alt="" draggable={false} />
          </span>
          <button type="button" className="gd-stage-peek is-neighbor" onClick={() => go(1)}>
            <img src={buildImageUrl(imagesPath, nextImage.thumb || nextImage.file)} alt="" draggable={false} />
            <ChevronRight size={10} strokeWidth={2.6} />
          </button>
        </div>
      )}

      {/* Drop / browse slot — OUTSIDE the stage, so the blur never touches it.
          In bleed mode the stage is flush with the card edges, so everything
          below it keeps its own side padding (the card's pb-2.5 keeps the
          slot's bottom off the card border).
          0.30.0 — a PASTE section on the right ("add a section on the right
          too to paste, which when pressed will automatically grab the
          clipboard image"): same width language as the browse key, grabs
          the clipboard image straight from the main process — no image
          there = a quiet no-op.
          0.32.0 — the browse key reads "ADD IMAGES: CLICK OR DROP"
          ("add images - click, paste or drop should be add images - click
          or drop, since paste has its own way"): paste has its OWN key
          right beside, it doesn't need billing inside the label.
          1.6.7 — THE SLOT SPEAKS ITS OWN HOVER ("add images: click or drop
          area, the container when i hover over just highlights the text,
          it should give hover feedback when i hover while still keeping
          the look that it can drop an image into, like maybe maybe
          highlighting the interior and making the outline slightly
          thicken"): the colors leave the inline style for the named class
          (.gd-stage-dropslot in index.css) so a :hover law can own them —
          the interior takes a soft tinted highlight, the dashed outline
          thickens a hair (an inset ring, never a border-width change —
          no layout shift, the slot never breathes), the border and the
          icon lean toward the panel's own ink, and the label keeps its
          own brighten. The dashed cut-line look stays exactly what it
          always said: an open slot you can drop an image into. */}
      <div className={clsx('flex items-center gap-3 mt-2.5', bleed && 'px-2.5')}>
        <button
          className="gd-stage-dropslot flex-1 h-12 rounded-gd border-2 border-dashed flex items-center justify-center gap-2 group/slot"
          onClick={onAddImages}
          title="Browse for images: drop works too"
        >
          <ImagePlus size={14} />
          <span className="text-[10px] font-bold tracking-[0.18em] group-hover/slot:text-[color-mix(in_srgb,var(--gd-panel-text)_80%,transparent)]">
            ADD IMAGES: CLICK OR DROP
          </span>
        </button>
        <button
          className="gd-btn h-12 !px-4 flex flex-col items-center justify-center gap-0.5 flex-shrink-0"
          onClick={pasteFromClipboard}
          title="Paste the clipboard image"
        >
          <ClipboardPaste size={14} />
          <span className="text-[8px] font-bold tracking-[0.16em]">PASTE</span>
        </button>
      </div>

      {/* 0.30.0 — THE IMAGE MANAGER WINDOW (the Images key on the stage):
          every image in a slot container, drag to order, star to cover, X to
          delete (confirm), ADD + PASTE in the footer. Clicking a slot jumps
          the stage to it. 0.34.0 — the filmstrip sorter that used to live
          here is RETIRED ("remove the sorter and the option to show or hide
          the sorter since its useless, since image manager is what does
          this now") — this window is the one ordering surface. */}
      <AnimatePresence>
        {managerOpen && (
          <ImageManagerModal
            images={images}
            imagesPath={imagesPath}
            selectedIndex={safeIndex}
            overViewer={managerOverViewer}
            onReorder={(from, to) => {
              onReorderImages?.(from, to);
              // 0.42.0 — NO index jump: the view follows the PINNED FILE
              // through the reorder instead of jumping to the slot the
              // dragged tile landed on.
            }}
            onSetCover={(i) => {
              onSetCover?.(i);
              // 0.42.0 — pin the promoted file; the stick effect lands the
              // view on slot 0 where it now lives.
              setPinnedFile(images[i]?.file ?? null);
            }}
            onDelete={(i) => {
              onDeleteImage?.(i);
              // 0.42.0 — NO manual clamp: the pinned file is gone, the stick
              // effect picks the nearest survivor, pins it, and stays.
            }}
            onAddImages={onAddImages}
            onPasteImage={pasteFromClipboard}
            onPick={(i) => {
              // 0.41.0 — CLICK = THE BIG PREVIEW ("clicking on one of the
              // images should just open the big image preview, and not close
              // the image manager; also dont change the highlighted image"):
              // the manager stays open underneath the viewer, the stage's
              // selection (and the manager's ring) never move.
              onOpenViewer?.(i);
            }}
            onClose={() => { setManagerOpen(false); setManagerOverViewer(false); }}
            confirm={confirm}
          />
        )}
      </AnimatePresence>

      {/* 0.31.0 — the stage's own REGION menu (built above from live state). */}
      <AnimatePresence>
        {ctx && <GdContextMenu x={ctx.x} y={ctx.y} items={stageCtxItems} onClose={() => setCtx(null)} />}
      </AnimatePresence>
    </div>
  );
}
