import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, ChevronDown, ChevronsDownUp, ChevronsUpDown, Copy, IdCard, Maximize2, NotebookText, Pencil, Pin, Plus, Redo2, Settings2, Stamp as StampIcon, Star, Tags, Trash2, Undo2 } from 'lucide-react';
import ImageStage from './ImageStage.jsx';
import ImageViewer from './ImageViewer.jsx';
import GdContextMenu from './GdContextMenu.jsx';
import PartEditor from './PartEditor.jsx';
import ComposePanel from './ComposePanel.jsx';
import Popover from './Popover.jsx';
import VersionSettingsModal from './VersionSettingsModal.jsx';
import Modal from './Modal.jsx';
import CardLookEditor, { useImageAspect } from './CardLookEditor.jsx';
import { RichText, default as RichInput } from './RichText.jsx';
import { ChipGlyph } from './LucideIconPicker.jsx';
import TagRibbon from './TagRibbon.jsx';
import { makeVersion, DEFAULT_CARD_TRIM, CARD_COL_WIDTH_RANGE, CLASS_COLOR_PRESETS, CARD_FINISHES, isCardFinish, migrateCardFinish, normalizeFinishTransparency } from '../constants/index.js';
import StampColorControls from './StampColorControls.jsx';
import StampPosControls from './StampPosControls.jsx';
import CardStyleControls from './CardStyleControls.jsx';
import { StampAddButton, StampPasteTile, StampSlotItem, StampSlots, useStampNamingQueue } from './StampEditModal.jsx';
import { ColorPickerButton } from './ColorPicker.jsx';
import useThumbSort from './useThumbSort.js';
import useAutoStampColor, { useStampHue } from './useAutoStampColor.js';
import { SideFlowZone, useFlowEdges, FlowEdges } from './SideFlow.jsx';
import useScrollbarBreath from './useScrollbarBreath.js';
import { markImageDead } from '../utils/imageDeaths.js';
import {
  buildImageUrl,
  customStampHue,
  deferToPaint,
  fmtDate,
  getPreviewVersion,
  imageRecord,
  partContainerFace,
  readableInk,
  saveImageBlobWithThumb,
  stampAlpha,
  stampHueAlpha,
  stripRichText,
} from '../utils/helpers.js';
// 1.4.0 — the stamp-settings sanitizer rides the constants' own export
// (the modal's draft + the App commit lane both speak it).
import { sanitizeStampSettings } from '../constants/index.js';
import StampEditModalWindow from './StampEditModal.jsx';
import { gdToast } from '../utils/toasts.js';
import { ClipboardPaste, FolderUp } from 'lucide-react';

// 0.44.0 — THE ROWS' MEMORY ("when the top header of the right detail panel
// closes and reopens … it wont overwrite the expand and collapse of the tag
// and the stamp area, as it should keep them as they were, so if collapsed
// they would stay collapsed after it opens again"). Closing the panel
// (BACK) unmounts the view — every useState reset to its initializer on the
// way back. The rows' fold state now lives in a module-level cache keyed by
// the CHARACTER: it survives close/reopen, card switches and back, and both
// mounts (the right panel and the full-window view) read the same seat.
const ROWS_STATE_CACHE = new Map(); // characterId -> { tags, stamps, auto }

// 1.2.9 — THE TRAY'S OWN MEMORY is RETIRED (1.3.8): the zone-height cache
// existed to seat the staged breaths' placeholders (the tags zone's 98px
// guess and the stamps' before it) — with every zone mounting on the
// view's OWN first frame (the 1.3.6 stamps law, the 1.3.8 tags law), no
// placeholder reads it anymore and the Map left with the breaths it
// served. The rows' fold state below survives as always.

// 1.3.3 — THE COVER STAR, ONE PULSE PER MOUNT: the entrance animation
// (gd-version-star-in) fires the moment this element enters the document —
// and ALSO re-fires whenever React MOVES its ancestor chip node in a
// reorder (a detached-and-reinserted subtree restarts its CSS animations),
// which read as the star "pulsing in again" after every version drag. The
// component strips the animation as soon as it lands (onAnimationEnd ->
// is-settled), so a chip that merely travels carries a silent star; only a
// fresh mount (the cover version genuinely changing chips) ever pulses.
function VersionStar() {
  const [settled, setSettled] = useState(false);
  return (
    <Star
      size={11}
      className={clsx('gd-version-star fill-current', settled && 'is-settled')}
      onAnimationEnd={() => setSettled(true)}
    />
  );
}

function VersionChip({ version, active, isPreview, onSelect, onEdit }) {
  const style = version.color ? { background: version.color, color: readableInk(version.color) } : undefined;
  return (
    <div className="relative group flex-shrink-0">
      <button
        /* 1.0.7 — THE LABEL STANDS STRAIGHT ("burrito theme versions labels
           are tilted, fix that so it matches the rest, same with zine punk
           and so on"): gd-chip-flat opts this chip out of every theme's
           sticker tilt (see the flat law in index.css). The version strip
           is navigation, and navigation reads level. */
        className={clsx('gd-chip gd-chip-flat', active && 'is-active')}
        style={style}
        onClick={onSelect}
        title={`${stripRichText(version.label)}: ${version.parts?.length || 0} parts · ${version.images?.length || 0} images`}
        /* 1.0.8 — a NAME-LABEL tooltip (the version's name leads the pill):
           the clamp belongs to the name's area, two lines and no more. */
        data-gd-tip-name="1"
      >
        {version.icon && <ChipGlyph name={version.icon} size={12} />}
        {/* 1.0.6 — THE RESTING CHIPS SPEAK IN PARTS ("when version is
            selected it shows full name, if not then it shows only part of
            it"): only the ACTIVE chip carries the whole name; every other
            chip ellipsizes at the cap (the full text already rides the
            chip's own title tooltip). The strip keeps its compact read —
            long labels no longer balloon the resting row — while the
            version you are actually on stays fully legible. */}
        <RichText text={version.label} className={active ? undefined : 'gd-chip-label-cap'} />
        {/* 0.45.0 — THE COVER STAR POPS IN PLACE ("the top label and outline
            would move from the old to the new, it should be animated"): when
            the cover version changes hands the star mounts fresh on its new
            chip — a quick scale+fade mount animation (see .gd-version-star
            in index.css) so it lands instead of blinking in.
            1.3.3 — THE PULSE PLAYS ONCE PER MOUNT ("after i let go, the star
            icon flickers too, it pulses in again"): React reorders the
            strip's chips with stable keys after a drag commit, and MOVING a
            DOM node re-runs every CSS animation on it — the star's entrance
            replayed on every reorder, reading as the star flickering back
            in after the drop. The star strips its own animation once it has
            landed (is-settled), so a moved chip carries a silent star: only
            a GENUINE hand-off (the cover version changes chips — a fresh
            mount) ever pulses. */}
        {isPreview && <VersionStar />}
      </button>
      <button
        data-no-sort
        className="gd-version-edit absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center opacity-0 group-hover:opacity-100"
        style={{ background: 'var(--gd-panel)', borderColor: 'var(--gd-ink)', color: 'var(--gd-panel-text)' }}
        title="Version settings"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        <Pencil size={8} />
      </button>
    </div>
  );
}

// 0.40.0 — THE SMOOTH CLAMP ("ensure when collapsing or expanding tags and
// stamps that it does it well and isnt staggered"): a collapsible chip zone
// folds to its FIRST ROW through a measured max-height tween instead of the
// old nowrap-reflow snap. CSS cannot transition from `max-height: none`, so
// the view measures at toggle time: collapsing primes the zone's CURRENT
// height then clamps to one row; expanding opens to the full measured
// content (the rows below slide back out) and lets go to natural afterwards
// so later growth is never clipped. The tween rides the SAME duration +
// curve the CSS gives .gd-collapse-zone — the tower fold and the rows fold
// wear the same clock, so the whole row breathes as ONE piece.
// 0.42.0 — NO CRUSH ON SINGLE-ROW ZONES ("the animation for collapsing and
// expanding the stamps … over does it that even if the stamps is only one
// row it tries to compress then resets again"): TWO causes died —
//   · the .is-collapsed CSS class painted its own 34px max-height for the
//     frame between the toggle and the effect's measured prime (a stamp row
//     is ~53px — the zone visibly CRUSHED to 34 then popped back); the class
//     carries no height of its own anymore, only the overflow guard.
//   · a zone whose natural height already fits one row has NOTHING to hide —
//     the clamp is skipped outright (no squeeze, no reset, no motion).
function useClampStyle(ref, clamped, rowPx, rows = 1) {
  const [max, setMax] = useState(undefined);
  const wasClampedRef = useRef(false);
  // 1.0.5 — THE MEASURED ONE-ROW CLAMP ("fix the issue when tags collapse it
  // would clip the tag at the bottom"): the old law clamped to a CONSTANT
  // (31px for the tags), but a row's real height is theme-dependent — numeix's
  // taller blobs + the selected chip's 2px/2px outline + the hover shadow
  // paint well past 31, so the fold shaved the bottom of the first row's
  // chips. The clamp is MEASURED now, per theme, per row: the first row's
  // true bottom (children's top + height, relative to the zone) plus a 5px
  // reach for the outline/shadow, floored at the caller's rowPx — and
  // CAPPED just above the second row's top edge, so the row below never
  // peeks a sliver under the cut. The stamps strip rides the same law (its
  // 55 floor keeps the glow's full reach, exactly as 0.46.0 intended).
  // 1.1.4 — THE MEASURE SPEAKS RELATIVE TO THE ZONE ("tags collapse and
  // expand isnt working" / "stamps collapse and expand isnt working
  // either"): the old read used each child's offsetTop — which is relative
  // to the nearest POSITIONED ancestor, and inside the detail panel that is
  // the sticky HEADER (or further up), never the zone. Measured live, a
  // 60px tags zone "computed" a one-row clamp of 148px and a 108px stamp
  // strip one of 292px — the clamp sat ABOVE the natural height, so the
  // fold never folded anything. Every offset is now the child's rect
  // MINUS the zone's rect (viewport-relative differences — correct no
  // matter which ancestor happens to be positioned).
  // 1.1.4 — AND THE STRIP'S WRAPPER IS TRANSPARENT TO THE MEASURE: the
  // stamps zone holds ONE element child (.gd-stamp-slots — the single
  // wrapping flow that carries every tile), so reading the zone's own
  // children measured the whole multi-row wrapper as "one row". When the
  // zone's only element child spans its full content box, the measure
  // descends INTO that wrapper and reads the tiles themselves — the true
  // first row, tile by tile.
  // 1.1.5 — THE CLAMP SPEAKS N ROWS ("add an option to collapse tags inside
  // the card creation window, only shows the first 3 rows lets say"): the
  // hook grew a `rows` seat (default 1 — the detail panel's law unchanged);
  // the creation window passes 3 for its tag board. The measure groups the
  // children into row bands (4px tolerance), keeps the first `rows` bands,
  // and caps the cut just above the (rows+1)-th band's top so the fold
  // never shows a sliver of the hidden rows.
  const measureRows = (el) => {
    const zoneTop = el.getBoundingClientRect().top;
    const kids = Array.from(el.children || []).filter((n) => n.nodeType === 1);
    if (!kids.length) return rowPx;
    // The stamps-strip wrinkle: a single wrapper child that carries the
    // whole flow — descend one level so the "row" is a row of TILES, not
    // the wrapper's full height. Geometric detection, no class names: the
    // wrapper spans the zone's own content box.
    let items = kids;
    if (kids.length === 1) {
      const only = kids[0];
      const grandKids = Array.from(only.children || []).filter((n) => n.nodeType === 1);
      if (grandKids.length && only.getBoundingClientRect().height >= (el.clientHeight || 0) - 2) {
        items = grandKids;
      }
    }
    const rects = items
      .map((k) => {
        const r = k.getBoundingClientRect();
        return { top: r.top - zoneTop, bottom: r.bottom - zoneTop };
      })
      .filter((r) => Number.isFinite(r.top) && Number.isFinite(r.bottom));
    if (!rects.length) return rowPx;
    // Group the rects into row bands by their tops.
    const tops = rects.map((r) => r.top).sort((a, b) => a - b);
    const rowTops = [];
    for (const t of tops) {
      if (!rowTops.length || t > rowTops[rowTops.length - 1] + 4) rowTops.push(t);
    }
    const keptTops = rowTops.slice(0, Math.max(1, rows));
    const lastKept = keptTops[keptTops.length - 1];
    let bottom = Math.max(...rects.filter((r) => r.top <= lastKept + 4).map((r) => r.bottom));
    const nextRowTop = rowTops[Math.max(1, rows)];
    if (nextRowTop != null) {
      bottom = Math.min(bottom + 5, nextRowTop - 1);
    } else {
      bottom = bottom + 5;
    }
    return Math.max(rowPx, Math.round(bottom));
  };
  // 0.43.0 — LAYOUT effect (was passive): the direct-DOM prime below must
  // land BEFORE the browser ever paints the toggle, or the clamp reads as
  // an instant cut ("stamps collapse animation isnt playing").
  useLayoutEffect(() => {
    const el = ref?.current;
    if (!el) return undefined;
    let timer = 0;
    if (clamped) {
      wasClampedRef.current = true;
      // 0.42.0 — the NATURAL height (scrollHeight sees past any clamp still
      // applied): the content already fits the kept rows — nothing to fold,
      // leave the zone natural. (1.1.5: the fit test now rides the MEASURED
      // row bottoms instead of the old rowPx+8 constant, so an N-row keep
      // with a hair of slack skips exactly like the one-row keep did.)
      const natural = el.scrollHeight || el.offsetHeight || 0;
      const fitsKept = natural <= measureRows(el) + 2;
      if (fitsKept) {
        setMax(undefined);
        return undefined;
      }
      // 0.43.0 — DIRECT-DOM PRIME + FORCED REFLOW: the old prime + rAF + clamp
      // raced React's scheduler — when both setMax calls landed inside the
      // same frame the browser never painted the prime, so the computed
      // max-height jumped straight from `none` to the row clamp, and `none`
      // cannot transition: the fold simply never ran. The concrete height is
      // now written STRAIGHT to the element (pre-paint) and the reflow bakes
      // it in as the transition's origin; the state's clamp then tweens FROM
      // that value. (The direct write is the whole point — the lint's
      // immutability law yields to the 0.43.0 fix on this one line.)
      // eslint-disable-next-line react-hooks/immutability
      el.style.maxHeight = `${Math.max(rowPx, natural)}px`;
      el.style.overflow = 'hidden';
      // eslint-disable-next-line no-unused-expressions
      el.offsetHeight;
      setMax(measureRows(el));
    } else if (wasClampedRef.current) {
      // expanding from a clamp: open to the full content (scrollHeight sees
      // past the clamp), then release to natural once the tween has landed.
      // A zone that was never clamped stays natural — no mount-time flash.
      wasClampedRef.current = false;
      setMax(Math.max(rowPx, el.scrollHeight || 0) + 2);
      timer = setTimeout(() => setMax(undefined), 320);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [clamped, rowPx, rows, ref]);
  return max == null ? undefined : { maxHeight: max, overflow: 'hidden' };
}

// 1.1.5 — EXPORTED FOR THE CREATION WINDOW: the tag board in the card
// creation window folds to its first three rows through the SAME measured
// clamp law the detail panel's rows speak (one hook, one clock, one cut).
export { useClampStyle };

// One compact settings menu instead of three header buttons — everything
// character-level lives here (version settings stay on the version chips).
// 0.9.0: the dropdown renders through the portal Popover (aligned to the
// button's right edge) so it floats above every pane — never clipped behind
// the side panels.
// 0.41.0 — RENAME IS GONE FROM HERE ("remove rename card button and option
// and just include it in the card look options, and edit it to be edit card
// instead"): the EDIT CARD key opens the card-look window, which now carries
// the NAME field itself — one editor for the whole card.
// 0.44.0 — RIGHT-CLICK SAYS NOTHING ("when i right click on the card settings
// it does something that causes scrollbars to appear, fix that so it does
// nothing"). The 0.43 right-click menu rendered position:fixed INSIDE the
// sticky header's translateZ(0) compositing layer — the fixed coordinates
// were read against the HEADER's box, the menu landed far off its seat and
// poked past the panel's scroll edge (the scrollbars). The menu was removed
// for 0.44.
// 0.45.0 — THE GEAR'S MENU IS BACK, THROUGH A BODY PORTAL: the real fix for
// the 0.44 bug was never "no menu" — it was painting the fixed-position
// card OUTSIDE the compositing layer. GdContextMenu portals to document.body
// now, so the coordinates land where the pointer is; the menu carries EDIT
// CARD, DELETE, UNDO and REDO (wired down from App through both mounts).
function CharSettingsMenu({ onEditCard, onDelete, onUndo, onRedo, canUndo, canRedo, scUndo, scRedo }) {
  const [open, setOpen] = useState(false);
  const [ctx, setCtx] = useState(null);
  const btnRef = useRef(null);
  // 0.45.0 — THE GEAR SPEAKS AGAIN ("when i right click on card options, it
  // would show me the edit card option and delete option alongside the undo
  // and redo"). The 0.44 menu died because it painted position:fixed INSIDE
  // the sticky header's compositing layer — the fix is upstream of this
  // component: GdContextMenu now renders through a BODY PORTAL, so fixed
  // coordinates read against the viewport no matter which layer the button
  // lives in. The press is still swallowed on the button itself (the press
  // never re-opens the dropdown).
  const ctxItems = [
    { id: 'hdr', header: 'CARD OPTIONS' },
    { id: 'edit', label: 'Edit card', icon: IdCard, onPick: onEditCard },
    { id: 'delete', label: 'Delete', icon: Trash2, danger: true, onPick: onDelete },
    { id: 'sep', separator: true },
    {
      id: 'undo',
      label: 'Undo',
      icon: Undo2,
      shortcut: scUndo || undefined,
      disabled: !canUndo,
      onPick: onUndo,
    },
    {
      id: 'redo',
      label: 'Redo',
      icon: Redo2,
      shortcut: scRedo || undefined,
      disabled: !canRedo,
      onPick: onRedo,
    },
  ];
  return (
    <div className="relative">
      <button
        ref={btnRef}
        className="gd-btn !px-2"
        title="Card settings: edit the card, delete it"
        onClick={() => setOpen((o) => !o)}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setCtx({ x: e.clientX, y: e.clientY });
        }}
      >
        <Settings2 size={13} />
        <ChevronDown size={11} />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={btnRef} width={176} align="end">
        <div className="p-1.5">
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-[11px] font-semibold hover:bg-[color-mix(in_srgb,var(--gd-accent)_14%,transparent)]"
            style={{ color: 'var(--gd-panel-text)' }}
            title="Edit the card: name, aspect ratio, trim and image placement"
            onClick={() => {
              setOpen(false);
              onEditCard();
            }}
          >
            <IdCard size={12} />
            EDIT CARD
          </button>
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-[11px] font-semibold hover:bg-[color-mix(in_srgb,#c8402f_20%,transparent)]"
            style={{ color: '#ff8d7d' }}
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 size={12} />
            DELETE
          </button>
        </div>
      </Popover>
      {ctx && <GdContextMenu x={ctx.x} y={ctx.y} items={ctxItems} onClose={() => setCtx(null)} />}
    </div>
  );
}

// 0.15.0 — the card's STAMP row (the right panel's stamp editor);
// 0.22.0 — the one-world rework; 0.23.0 — the full slot kit; 0.24.0 — the
// hover edit + wrapping strip. 0.39.0 — the settings cluster left the
// strip's right end for its OWN line UNDER it (the tower), folding with
// the row. 0.40.0 — THE STRIP WRAPS AGAIN ("the right panel; stamps area
// is also fucked where its forced into a single row with a sidescroll,
// fix that so it doesnt do that"): the slots + ADD + PASTE flow as a
// wrapping multi-row strip that grows the panel downward — no side
// scroll, ever. Collapsed, the zone clamps to its FIRST ROW through a
// smooth max-height tween (rows below slide under a soft fade) instead
// of the 0.39 no-wrap lane.
// 0.41.0 — ONE STRIP, ONE BREATH: the slots, ADD, PASTE and the shared
// settings cluster ALL ride the same wrapping flow (StampSlots renders its
// children inside the container), so nothing ever takes a forced new line
// ("the add and paste areas are taking a whole new line even tho there is
// space, while the hue and options are having ANOTHER new line") — and the
// collapse clamps the WHOLE thing at once, so the options fold WITH the
// stamps instead of folding after them (the staggered collapse). The
// cluster keeps its vertical tower SHAPE (color above settings) as the
// strip's last inline item.
function StampEditor({
  character,
  stampLibrary,
  imagesPath,
  cardRatio = null,
  onAttach,
  onRemove,
  onPromote,
  onUpload,
  onRename,
  onReorder,
  onColor,
  onTransform,
  showHelp = false,
  collapsed = false,
  onToggleCollapse = null,
}) {
  const charStamps = character?.stamps || [];
  const settings = character?.stampSettings || {};
  const topStamp = charStamps[0] || null;
  // AUTO hue: the library record's cached dominant color, or a live
  // derivation (memoized) while the priming effect catches up.
  const topStampUrl = topStamp && imagesPath ? buildImageUrl(imagesPath, topStamp.image) : null;
  const derivedAuto = useAutoStampColor(topStampUrl);
  const autoColor = topStamp
    ? (stampLibrary || []).find((s) => s.image === topStamp.image)?.autoColor || derivedAuto || null
    : null;
  // 0.22.0 follow-up — the TOP stamp's measured image aspect + the card's
  // effective ratio feed the band capture (StampPosControls shows the band's
  // real values and lifts from them, so the first edit never jumps).
  const topStampAspect = useImageAspect(topStampUrl);
  const effectiveCardAspect =
    cardRatio && Number(cardRatio.w) > 0 && Number(cardRatio.h) > 0 ? Number(cardRatio.w) / Number(cardRatio.h) : null;

  // 0.23.0 — the upload naming queue: every picked file passes through the
  // stamp window and joins the CHARACTER + the library wearing its name.
  const naming = useStampNamingQueue(imagesPath, (record, name) => {
    onUpload?.(character.id, [record], name);
  });

  // 1.0.5 — THE ROW SPEAKS ITS OWN MENU ("make it so when i right click on
  // the tags or stamps it would give me the option to do their things, for
  // stamp its paste a new stamp or browse a new stamp"): the strip's own
  // right-click pill carries the two creation gestures the ADD key's
  // popover hides behind — PASTE reads the clipboard straight into the
  // naming queue, BROWSE opens the file picker. Same reads, same toasts,
  // same queue as the tiles themselves.
  const [stampCtx, setStampCtx] = useState(null);
  const pasteNewStamp = async () => {
    try {
      const img = await window.api?.clipboardReadImage?.();
      if (!img?.base64) {
        gdToast('No image on the clipboard', 'fail');
        return;
      }
      const rec = await window.api.saveImageBuffer(img.base64, img.ext || '.png');
      if (rec) {
        gdToast('Stamp pasted');
        naming.push([rec]);
      } else {
        gdToast('Paste failed', 'fail');
      }
    } catch {
      gdToast('Paste failed', 'fail');
    }
  };
  const browseNewStamp = async () => {
    try {
      const records = await window.api.importImagesFromFiles();
      if (records?.length) naming.push(records);
    } catch {
      gdToast('Browse failed', 'fail');
    }
  };
  const stampCtxItems = [
    { id: 'hdr', header: 'STAMPS' },
    { id: 'paste', label: 'Paste a new stamp', icon: ClipboardPaste, onPick: pasteNewStamp },
    { id: 'browse', label: 'Browse for a new stamp', icon: FolderUp, onPick: browseNewStamp },
  ];

  const stampAt = (i) => charStamps[i] || null;

  // 1.1.9 — THE PANEL'S FLOW REF + ITS OWN ENGINE: the stamps zone owns its
  // .gd-stamp-slots wrapper now (SideFlowZone's flowClass seat, so the
  // twin-block side split can reach the slots), and the slots render as the
  // zone's DIRECT children — the split slices the item list, so the slots
  // must be elements at the call site (StampSlotItem), driven by this
  // engine. The engine object carries the slot actions beside the sort
  // machinery — one handle, the same shape StampSlotList speaks.
  const panelFlowRef = useRef(null);
  const [stampWinIdx, setStampWinIdx] = useState(null);
  const stampEngine = {
    ...useThumbSort({
      count: charStamps.length,
      cols: 1,
      gapX: 8,
      useGeometry: true,
      containerRef: panelFlowRef,
      onCommit: (from, to) => onReorder?.(character.id, from, to),
      // A plain click (no movement) opens the stamp window; the sort
      // engages after 5px of movement, so a hold that MOVES drags.
      onTap: (i) => setStampWinIdx(i),
    }),
    onPromote: (i) => {
      const s = stampAt(i);
      if (s) onPromote?.(character.id, s.id);
    },
    onRemove: (i) => {
      const s = stampAt(i);
      if (s) onRemove?.(character.id, s.id);
    },
  };
  const stampEditing = stampWinIdx != null && charStamps[stampWinIdx] ? stampWinIdx : null;

  // 0.40.0 — the wrapping strip's clamp: one row of slots + the zone's 5px
  // hover headroom; the measured tween rode useClampStyle. 0.41.0 — the
  // clamp covered the WHOLE strip (slots + tiles + cluster — one flow).
  // 0.46.0 — 52 → 55 (the top ring's 4px glow reach; see the old note in
  // git history). 1.0.5 — the clamp went MEASURED per theme.
  // 1.1.8 — THE STRIP IS A SIDE-FLOW ZONE NOW ("…stamps expand beyond 2
  // rows, ensure that their container gains a scrollbar which allows me to
  // scroll sideways … when it demands a third row for stamps, instead
  // start stacking them on the right"): the 55px floor and the measured
  // clamp moved INTO SideFlowZone (the stamps flavor — selfFlow off, the
  // flow classes land on the .gd-stamp-slots wrapper through CSS), with
  // the 2-row open cap + sideways columns + edge arrows measured by the
  // seat's hidden twin. Retracted keeps the exact old 1-row clamp — no
  // sideways scroll while folded, per the report.

  // 1.2.0 — THE + STAMPS KEY UNDER THE TITLE ("add + tags and + stamps
  // below the name of them, so there is another easy way to access it
  // right below their titles in detail window"): a small key under the
  // STAMPS label that opens the SAME picker the strip's ADD tile opens.
  // StampAddButton owns its popover, so the key speaks to it through an
  // openSignal counter — every increment tells the picker to open.
  // 1.2.4 — THE PICKER ANCHORS AT THIS KEY (see StampAddButton's
  // signalAnchorRef): the popover opens from the + the user pressed, not
  // from the strip's tail where the ADD tile rides.
  const [pickerSignal, setPickerSignal] = useState(0);
  const plusKeyRef = useRef(null);

  return (
    <div className="min-w-0 w-full">
      <div
        className="flex items-start gap-2 min-w-0 w-full"
        onContextMenu={(e) => {
          // 1.0.5 — the strip's own menu (PASTE / BROWSE). Swallowed here so
          // the app-level region menu never mixes its items in.
          e.preventDefault();
          e.stopPropagation();
          setStampCtx({ x: e.clientX, y: e.clientY });
        }}
      >
        {/* 1.2.0 — THE ROW'S LEFT COLUMN: the toggle and the + STAMPS key
            ride their own fixed-width column (the toggle's shared
            min-width), so the slots' zone starts at exactly the same x as
            the tags row's zone — one vertical line for both rows.
            1.2.4 — THE + KEY CENTERS UNDER ITS LABEL ("the +stamp and +tag
            should be more centered"): the column centers its children —
            the toggle keeps the column's full width, the little + key
            centers beneath it instead of hugging the left edge.
            1.4.6 — THE TOWER SEATED HERE UNDER THE + KEY (see the 1.4.6
            note in the CHANGELOG — "cant see the other style").
            1.4.7 — THE TOWER RETURNS INTO THE CONTAINER ("hue color and
            stamp options in the detail panel should be inside the
            container not on the side outside"): the owner asked for the
            options to ride INSIDE the strip's own container — the same
            seat the creation window speaks (the cluster rides the flow
            after ADD + PASTE, the 0.41.0 law) — instead of the row's
            left rail beside it. The classic faces, the stacking law
            (color above settings), the locked key and the popover seats
            ride untouched; only the SEAT moved back into the flow. */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <button
            type="button"
            className="gd-row-toggle flex-shrink-0 self-start"
            title={collapsed ? 'Expand the stamp row' : 'Collapse the stamp row to one line'}
            onClick={() => onToggleCollapse?.()}
          >
            <StampIcon size={10} />
            STAMPS
            <ChevronDown size={11} className={clsx('transition-transform', !collapsed && 'rotate-180')} />
          </button>
          <button
            type="button"
            ref={plusKeyRef}
            className="gd-row-plus flex-shrink-0"
            title="Pick a stamp for the card (the library, or browse for a new one)"
            onClick={() => setPickerSignal((n) => n + 1)}
          >
            <Plus size={11} />
            STAMP
          </button>
        </div>
        {/* 1.1.8 — THE SIDE-FLOW SEAT (stamps flavor); 1.1.9 — THE ZONE OWNS
            THE WRAPPER (flowClass): the slot list + ADD + PASTE + the shared
            cluster ride the zone as DIRECT children, the zone wraps them in
            .gd-stamp-slots (both the hidden twin and the live strip), and
            the side seat splits them into the twin-block track — the front
            rows stay row-major, the rest stack right as columns. The sort
            engine binds to the wrapper through panelFlowRef. */}
        <SideFlowZone
          rows={2}
          collapsed={collapsed}
          floorPx={55}
          selfFlow={false}
          zoneClassName="gd-stamp-strip"
          flowClass="gd-stamp-slots"
          flowRef={panelFlowRef}
          /* 1.4.9 — THE COVER SEAT IS RETIRED (see the retirement note in
             SideFlow.jsx): the stamps zone expands IN THE FLOW — the tray
             grows, the panel gives it the space, the COLLAPSE key stays
             visible at the tray's tail. */
          /* 1.3.6 — THE UNIFORM STAND-IN PROBE (see SideFlowZone's
             uniformItems law — the panel-open lag's stamps half): the
             stamp slots are a fixed 44x44 (the .gd-stamp-slot law), so the
             hidden measurement twin renders count inert boxes at exactly
             that size plus the REAL trailing keys (ADD / PASTE / the
             settings cluster — the variable tail) instead of mounting the
             whole slot set a second time. Every band, rect and cap the
             probe reports is byte-identical to the old twin; the double
             mount (and the double image decode) is simply gone. */
          uniformItems={{ count: charStamps.length, w: 44, h: 44 }}
          /* 1.3.4 — THE WALL SORTS FROM THE LEFT AGAIN ("they act as pages
              and sort from top to bottom, instead i want them to act as one
              big scrollable container that sorts from left instead, as they
              should fit inside the empty areas"): the 1.3.3 row-major
              reading put the FIRST HALF of the collection on the top row
              (C = ceil(N / rows) columns wide) and the second half below —
              the front window showed two non-consecutive runs (items 0..V
              and C..C+V), every screen read as its own "page", and the
              order only advanced by reading the whole top row across the
              entire scroll, then the bottom row — "sort from top to
              bottom". The wall fills COLUMN-major again — the 1.3.2 law
              ("each column should be fileld up first before the rest"):
              column 1 holds the first `rows` stamps top to bottom, column
              2 the next, every column filled before the next begins, so
              the front window always shows ONE consecutive block and the
              pan walks the order left to right — one huge entity, the
              empty slots of every visible column filled before the wall
              extends further right. The wallOrder prop keeps the row
              lattice for any future seat; nothing passes it. */
          wallOrder="column"
          ariaLabel="stamps"
        >
        {/* 1.0.5 — NO "none" (same report as the tags row): an empty
            strip keeps its ADD + PASTE keys and nothing else. */}
        {/* 0.41.0 — ONE WRAPPING FLOW: the slots + ADD + PASTE + the shared
            settings cluster ride the SAME container (the zone's wrapper),
            so the tiles fill each row's leftover room and the cluster rides
            the strip's end — no forced new lines, and the collapse clamps
            them all as one piece.
            1.1.9 — the slots are DIRECT children (StampSlotItem elements):
            the side seat splits them into the twin-block track — the front
            rows stay row-major, the rest stack right as columns. */}
        {charStamps.map((s, i) => (
          <StampSlotItem
            key={s.id}
            stamp={s}
            i={i}
            stamps={charStamps}
            imagesPath={imagesPath}
            engine={stampEngine}
            onOpenWindow={setStampWinIdx}
          />
        ))}
          <StampAddButton
            stampLibrary={stampLibrary}
            imagesPath={imagesPath}
            attachedImages={charStamps.map((s) => s.image)}
            onPick={(tpl) => onAttach?.(character.id, tpl)}
            onUpload={(records) => naming.push(records)}
            onPaste={(records) => naming.push(records)}
            openSignal={pickerSignal}
            signalAnchorRef={plusKeyRef}
          />
          {/* 0.38.0 — THE STAMP PASTE TILE beside the ADD key, same as the
              creation window: the clipboard's image rides the naming queue. */}
          <StampPasteTile onPaste={(records) => naming.push(records)} />
          {/* 1.4.7 — THE SETTINGS TOWER RIDES THE FLOW AGAIN ("hue color
              and stamp options in the detail panel should be inside the
              container not on the side outside"): the cluster seats after
              ADD + PASTE exactly like the creation window's own strip (the
              0.41.0 one-flow law) — INSIDE the container, flowing with the
              stamps, part of the strip it commands. The classic faces and
              the stacking law ride untouched (color above settings, the
              hue key live with no stamp, the settings key greyed with its
              own tooltip); the 1.4.6 left-column seat left with the
              request. */}
          {(onColor || onTransform) && (
            <span className="gd-stamp-settings-cluster is-tower">
              {onColor && (
                <StampColorControls
                  variant="classic"
                  color={settings.color}
                  colorAlpha={settings.colorAlpha}
                  autoColor={autoColor}
                  showHelp={showHelp}
                  onColor={(hexOrNull) => onColor(character.id, { color: hexOrNull })}
                  onAlpha={(v) => onColor(character.id, { colorAlpha: v })}
                  /* 1.3.8 — THE HUE'S SECOND LAYER ORDER: the over-trim
                     switch rides the color window in the panel too — the
                     hue's own seat, one voice with the creation window. */
                  hueOverTrim={settings.hueOverTrim === true}
                  onHueOverTrim={(v) => onColor(character.id, { hueOverTrim: v })}
                />
              )}
              {onTransform && (
                <span
                  className={clsx(!charStamps.length && 'gd-locked-key')}
                  title={charStamps.length ? undefined : 'This option requires a stamp'}
                >
                  <StampPosControls
                    variant="classic"
                    settings={settings}
                    stampAspect={topStampAspect}
                    cardAspect={effectiveCardAspect}
                    showHelp={showHelp}
                    onPatch={(patch) => onTransform(character.id, patch)}
                  />
                </span>
              )}
            </span>
          )}
          {/* 1.4.6 — THE SETTINGS TOWER LEFT THE FLOW for the row's own
              left column (under the + STAMP key — see the left-column note
              above): the strip's flow now carries ONLY the slots + ADD +
              PASTE, so the wall's measurement twin and the sideways pan
              speak the stamps alone, and the two option keys are always on
              screen instead of buried past the scroll's edge. 1.4.7 — the
              1.4.7 rework above retires this note's law (the tower rides
              the flow again); kept for the history.
              1.5.0 — THE STRIP'S HELP LINE RETIRES ("remove the 'only the
              top stamp shows: star another to promote it' text"): the
              stamp strip's own law has been the strip's shape since the
              beginning — the star badges say it silently — and the line
              only ever padded the row's tail. */}
        </SideFlowZone>
      </div>
      {/* 1.1.9 — the stamp window lives HERE (outside the zone): the zone's
          children must stay the pure item list the split slices. */}
      {stampEditing != null && charStamps[stampEditing] && (
        <StampEditModalWindow
          stampUrl={buildImageUrl(imagesPath, charStamps[stampEditing].image)}
          initialName={charStamps[stampEditing].name || ''}
          isNew={false}
          onClose={() => setStampWinIdx(null)}
          onSave={(name) => {
            const s = stampAt(stampEditing);
            if (s) onRename?.(character.id, s.id, name);
            setStampWinIdx(null);
          }}
        />
      )}
      {stampCtx && (
        <GdContextMenu x={stampCtx.x} y={stampCtx.y} items={stampCtxItems} onClose={() => setStampCtx(null)} />
      )}
      {/* 0.23.0 — the upload naming queue's window. Escape / CANCEL closes
          IT ONLY — the panel underneath stays. */}
      {naming.modal}
    </div>
  );
}

// 0.7.0: the COPY OUTPUT strip is GONE — exactly one output surface at a
// time: the bottom bar (promptBottom on) or the compose panel on the right.

// 1.3.0 — THE TAGS ROW'S OWN DRAG ENGINE ("yes implement the drag to
// reorder tags but on a condition that it orders them inside the tag
// manager aka for all cards, since stamps dont really require being
// always visible, but tags even when inactive need to"): the row's chips
// are grabbable now, and a drag commits through onReorderTags — the SAME
// reorderTags the tag manager's own list speaks — so the new order lands
// on db.tags itself: THE default order every card's strip reads (active
// and inactive chips alike), the manager's EXISTING TAGS list, and the
// card ribbons' top-tags pick. The row and the manager are two windows
// onto one list; drag in either, both move. The row's engine lives in its
// own component (not the view's body) so a drag's retarget renders never
// re-render the whole view — the same containment the stamp editor's
// engine already enjoys. Stamps keep their per-card reorder (only the top
// stamp ever shows, so a global order would mean nothing there).
// 1.7.5 — THE ROW'S OWN CENSUS (the UNSELECTED TAGS switch — see
// SettingsModal's 1.7.5 note): while the switch is ON the row keeps its
// full vocabulary exactly as it always spoke it (every tag a chip,
// selected or not, drag-sortable, the + key opening the manager right
// away). While it is OFF the row shows ONLY the card's own chips — the
// wall's census is the card's — and the chips stand down from sorting
// (a partial view cannot write the GLOBAL order faithfully: the hidden
// seats between the visible ones would strand a drag's landing), the +
// key opens the TAG PICKER window instead (the full vocabulary with the
// manager inside it), and the card-switch ceremony trades the color pour
// for the TWO-PHASE FLIGHT below.
function TagsFlowRow({
  character,
  tags,
  collapsed,
  onToggleTag,
  onOpenTagManager,
  onOpenTagPicker,
  onReorderTags,
  swapOldActive = null,
  showAllTags = true,
}) {
  const flowRef = useRef(null);
  // 1.7.8 — THE FAREWELL'S OWN SEAT MEMORY (the rect-faithful ghost): the
  // ghost used to RE-WRAP the old chips in its own row-major flex — a
  // different lattice than the wall the eye was just watching (the lane
  // wall reads column-major: the 2nd/3rd tags of reading order drop into
  // the lower lanes), so the crossfade traded the true old seats for a
  // fabricated single row while the arrivals faded into the true new
  // lattice — "it sorts to the bottom for a quick second then snaps to
  // how it should be". The ghost is a SNAPSHOT now: every live chip's
  // on-screen rect (relative to the seat) is captured while the card
  // holds still, FROZEN across a card switch (the switch's own commit
  // re-renders this row with the new census — the effect below refuses
  // to refresh for exactly that commit, and for the ceremony's whole
  // life), and the farewell paints each old chip at its measured seat —
  // whatever lattice it actually wore. The arrivals keep their own truth
  // (the zone's final layout paints from its first frame), so the whole
  // ceremony is seat-continuous: nothing re-wraps, nothing re-sorts.
  const seatRef = useRef(null);
  const ghostSeatsRef = useRef(null);
  const lastCharIdRef = useRef(character?.id ?? null);
  const snapshotGhostSeats = () => {
    const seat = seatRef.current;
    if (!seat || typeof seat.querySelectorAll !== 'function' || typeof seat.getBoundingClientRect !== 'function') return null;
    const seatRect = seat.getBoundingClientRect();
    const byId = new Map();
    for (const el of seat.querySelectorAll('.gd-tag-chip')) {
      // the measurement twin's chips never speak (they carry no
      // data-tag-id), and neither does a live ghost's own farewell.
      if (el.closest('.gd-tag-ghost-row')) continue;
      const id = el.getAttribute && el.getAttribute('data-tag-id');
      if (!id) continue;
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) continue;
      byId.set(id, {
        left: r.left - seatRect.left,
        top: r.top - seatRect.top,
        width: r.width,
        height: r.height,
      });
    }
    return byId.size ? byId : null;
  };
  useLayoutEffect(() => {
    const id = character?.id ?? null;
    // refresh only while the card holds still AND no ceremony lives —
    // the switch commit and the ghost's whole window keep the frozen
    // seats (the arm's setState flush re-commits this row with the ghost
    // mounted; refreshing there would snapshot the NEW census under the
    // farewell's feet).
    if (id === lastCharIdRef.current && !swapOldActive) {
      ghostSeatsRef.current = snapshotGhostSeats();
    }
    lastCharIdRef.current = id;
  });
  const pickerMode = showAllTags === false;
  const activeIds = character?.tags || [];
  // 1.7.5 — the OFF-mode census: only the card's own chips mount (the
  // probe measures the SAME set — the row's twin must never count chips
  // the wall never shows).
  const visibleTags = pickerMode ? tags.filter((t) => activeIds.includes(t.id)) : tags;
  // 1.7.5 — THE GHOST SET (the off mode's farewell): the chips the OLD
  // card wore that the new one does not — they fade OUT through the
  // ghost layer while the new card's own chips fade IN (the two-phase
  // flight's first half; see .gd-tag-ghost-row in index.css).
  // 1.7.6 — THE GHOST IS THE WHOLE OLD ROW ("i just see the tags that
  //   are shared snap to their position while the rest fades in
  //   normally, that shouldnt be the case, fix that where they all fade
  //   properly"): the lost-only ghost left the SHARED chips to the live
  // wall — which re-seats them by INDEX in the same commit (a different
  // lane, a different offset, no transition), so the shared tags SNAPPED
  // while everything else faded. The ghost carries EVERY chip the old
  // card's row showed now (the whole visible census, all fading OUT),
  // and the live row fades EVERY new chip in — a full crossfade: shared
  // tags dissolve with the old row and arrive with the new one like
  // every other chip, nothing ever snaps. The ghost chips wear .is-ghost
  // so the arrival rule below never mistakes them for arrivals (the
  // 1.7.5 ghost held its own children at opacity 0 through the whole
  // farewell — the beat never painted at all). */
  const ghostTags = pickerMode && swapOldActive ? tags.filter((t) => swapOldActive.has(t.id)) : [];
  const { sort, bindItem, itemStyle, dragStyle, sorting } = useThumbSort({
    count: pickerMode ? 0 : tags.length,
    cols: 1,
    gapX: 6,
    useGeometry: true,
    containerRef: flowRef,
    // the chips ARE buttons (toggle on click) — the 0.37.0 button-body law
    // (the version strip's own); the trailing + key opts out through
    // data-no-sort, and a real drag's trailing click dies with it (the
    // engine's 1.3.0 swallow) so a reorder never toggles the tag.
    dragButtons: true,
    onCommit: (from, to) => onReorderTags?.(from, to),
    onTap: () => {},
  });
  return (
    // 1.3.1 — THE RETRACTED TAGS HOLD TWO ROWS ("make it so when collapsed
    // the tags show 2 rows (in details panel), instead of one"): the
    // retracted clamp used collapsedRows=1 (one line of chips, floorPx 31),
    // so a folded tags row hid far more of the collection than the stamps
    // row ever could. The retracted seat keeps TWO probe bands now (the
    // clamp reads the second band's bottom), so a folded row still shows
    // two full lines of chips and the expand flight only ever opens the
    // third row's remainder. The open cap (3) and every other law are
    // untouched.
    // 1.7.5 — THE GHOST SEAT: the zone rides inside a relative wrapper so
    // the off mode's farewell layer (.gd-tag-ghost-row) can overlay the
    // chips' own geometry during the switch ceremony — the wall's layout
    // never changes, only the overlay.
    <div ref={seatRef} className="gd-tag-zone-seat relative min-w-0 flex-1">
      <SideFlowZone
        rows={3}
        collapsedRows={2}
        collapsed={collapsed}
        floorPx={31}
        selfFlow
        flowRef={flowRef}
        /* 1.4.9 — THE COVER SEAT IS RETIRED (see the retirement note in
           SideFlow.jsx): the tags zone expands IN THE FLOW — the tray grows
           under it, the stamps row never wears another row's drawer, and
           the fades ride the zone's own edges again. */
        /* 1.3.4 — THE TAGS WALL SORTS FROM THE LEFT TOO (see the stamps
            zone's column note): column-major — the first `rows` tags fill
            the leftmost column top to bottom, the next tags the next
            column, every visible slot of the front window holds a
            consecutive tag and the pan walks the order left to right as
            ONE big scrollable container — no pages, no top-row-then-
            bottom-row reading, no half-empty front. */
        wallOrder="column"
        /* 1.3.5 — THE TAGS WALL ACCOUNTS FOR EACH ROW ON ITS OWN ("if a tag
            that is too long exists, it would just consume horizontal real
            estate until i see any actual other tags on the right side in
            the full 3 rows, since apparently only the longest decides, fix
            that so it accounts for each row on its own"): the column
            lattice sized every column to its widest member, so the long
            tag's column pushed every later column right and left its
            lane-mates riding dead air. The wall seats THREE INDEPENDENT
            LANES now — same reading assignment (tag i rides lane i % 3),
            but every lane packs its own chips left to right: the long tag
            only spends ITS lane's real estate and the rows above and below
            stay dense to the right of it. One scroller, one order, each
            row on its own. The stamps wall (uniform widths) and the
            creation board (the user's column-major exception) keep their
            own seats. */
        wallPack="lanes"
        ariaLabel="tags"
        /* 1.4.4 — THE LIGHT PROBE ("when opening right pannel, the app freezes
            for a second midway as i see half of the right panel as empty then
            it snaps to the right panel open with elements, fix that"): the
            tags wall's hidden measurement twin used to mount the WHOLE chip
            set a second time — ribbon SVG, gradient, drag bindings and all —
            doubling the panel's heaviest frame. The probe now renders LIGHT
            chips: the same classes (identical padding + typography), the same
            icon, the same label — everything that speaks WIDTH — with the
            ribbon dropped (it hangs ABSOLUTELY off the chip's left edge, so
            it contributes exactly nothing to the layout the twin measures)
            and the sort bindings gone (the twin never takes a pointer). The
            measurement stays byte-identical; the double mount stops costing
            double. 1.7.5 — the probe speaks the row's own census (the
            visible set — see visibleTags above). */
        probeItems={[
          ...visibleTags.map((tag) => {
            const active = activeIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                className="gd-chip gd-tag-chip !py-1 !px-2 text-[10px]"
                style={active ? { background: tag.color, color: readableInk(tag.color) } : null}
                tabIndex={-1}
                aria-hidden
              >
                {tag.icon && <ChipGlyph name={tag.icon} size={10} className="flex-shrink-0" />}
                <RichText text={tag.name} className="gd-tag-label-cap" />
              </button>
            );
          }),
          <button key="__add" className="gd-btn !py-0.5 !px-2 text-[10px]" tabIndex={-1} aria-hidden>
            <span style={{ width: 10, height: 10, flexShrink: 0 }} aria-hidden />
          </button>,
        ]}
      >
        {/* 1.0.5 — NO "none yet": an empty row speaks through its keys alone —
            the + key opens the tag manager (or, in the off mode, the tag
            picker), exactly as it always did. */}
        {visibleTags.map((tag, i) => {
          const active = activeIds.includes(tag.id);
          const isDragged = sorting && sort?.from === i;
          /* 1.6.9 — THE CHANGED CHIPS CROSSFADE THEIR COLORS (see the
             swap state's own note in the view): a chip whose active
             membership differs between the old card and the new one
             animates its FACE AND INK from the old card's colors into its
             own (a keyframe with only a `from` seat — the `to` is the
             chip's natural computed value, whichever state it now wears),
             while the chip's structure (border, ribbon, shape) stays
             solid; a chip both cards agree on does nothing at all. The
             whole chip no longer rides the wholesale opacity fade — the
             colors are the content here, not the chip.
             1.7.4 — THE COLOR FADES ON EVERY CHIP ("revamp the tags
             feedback to have the color inside of all fade, dont fade the
             tags themselves, just fade the color regardless"): the old
             gate armed only the CHANGED chips (wasActive !== active), so
             a tag both cards selected — or both ignored — sat perfectly
             still while its neighbors poured. The window arms EVERY chip
             now, and the OLD face is neutral wherever the chip HOLDS its
             color: a kept or gained seat pours panel -> its color (the
             fill blooms in fresh), a lost seat drains its color -> panel,
             and a chip that never spoke color stays quiet.
             1.7.6 — THE GATE RETURNS, AND THE POUR IS ALL IT SAYS
             ("its also effecting unrelated tags that are already off
             while some that are actually switching in other rows dont
             get the fade effect, fix that"): the blanket arm poured a
             KEPT chip from panel into the very color it already wore —
             a ghost "switch" on every tag both cards agreed on — while
             the tagflight class (armed on every switch, mode-blind)
             outranked the pour's own rule on exactly the genuinely
             switching chips, so their colors snapped inside the opacity
             blink the class painted instead. The tagflight class speaks
             the OFF mode alone now (see the ceremony — the ON mode's
             chips never meet an arrival rule), and the pour arms ONLY the
             chips whose membership actually MOVED: a GAINED chip pours
             panel -> its color, a LOST chip drains its color -> panel,
             and every chip that did not switch — kept or off-on-both —
             holds perfectly still, in every row of the wall. */
          const wasActive = swapOldActive ? swapOldActive.has(tag.id) : null;
          const colorSwap = !pickerMode && swapOldActive !== null && wasActive !== null && wasActive !== active;
          const oldFace = active ? 'var(--gd-panel)' : wasActive ? tag.color : 'var(--gd-panel)';
          const oldInk = active ? 'var(--gd-panel-text)' : wasActive ? readableInk(tag.color) : 'var(--gd-panel-text)';
          return (
            <button
              key={tag.id}
              data-tag-id={tag.id}
              className={clsx(
                'gd-chip gd-tag-chip !py-1 !px-2 text-[10px]',
                !pickerMode && 'gd-sort-item',
                isDragged && 'is-dragging',
                colorSwap && 'is-swap-colorfade'
                /* 1.7.6 — .is-kept RETIRES with the solid-through-both-
                   beats law (see the ghost-set note above): the off mode's
                   flight is a full crossfade now — every chip fades, the
                   shared ones included, so there is no kept seat to exempt
                   and the class no longer speaks anywhere. */
              )}
              style={{
                ...(active ? { background: tag.color, color: readableInk(tag.color) } : null),
                ...(colorSwap
                  ? {
                      ['--gd-swap-old-face']: oldFace,
                      ['--gd-swap-old-ink']: oldInk,
                    }
                  : null),
                ...(isDragged ? dragStyle : itemStyle(i) || null),
              }}
              title={
                active
                  ? `Remove tag "${stripRichText(tag.name)}"`
                  : pickerMode
                    ? `Remove tag "${stripRichText(tag.name)}"`
                    : `Add tag "${stripRichText(tag.name)}" · drag to reorder the tag list`
              }
              onClick={() => onToggleTag(character.id, tag.id)}
              {...(pickerMode ? null : bindItem(i))}
            >
              {/* 1.1.4 — THE TAG'S OWN MARKS: the chip's CONTAINER keeps its
                  law (colored only while selected), but the tag's SHAPE — a
                  miniature of the exact ribbon the card wears, trim and all —
                  hangs off the chip's left edge at ALL times, painted in the
                  tag's own color; the tag's icon rides at the left of the
                  label. See .gd-chip-shape in index.css. */}
              <TagRibbon tag={tag} scale={0.55} className="gd-chip-shape" />
              {tag.icon && <ChipGlyph name={tag.icon} size={10} className="flex-shrink-0" />}
              {/* 1.2.2 — THE LABEL CAP (see .gd-tag-label-cap): a long-named
                  tag can never outgrow its row — the label ellipsizes and the
                  full name rides the chip's tooltip. */}
              <RichText text={tag.name} className="gd-tag-label-cap" />
            </button>
          );
        })}
        <button
          data-no-sort
          className="gd-btn !py-0.5 !px-2 text-[10px]"
          /* 1.7.5 — THE + KEY'S DOOR (the UNSELECTED TAGS switch's own
             half): on (default) it opens the manager right away, exactly
             as it always did; off it opens the TAG PICKER first — the
             window that shows the (now hidden) vocabulary to add, the
             manager riding inside it. */
          onClick={() => {
            if (showAllTags === false) onOpenTagPicker?.(character.id);
            else onOpenTagManager?.();
          }}
          title={showAllTags === false ? 'Add tags to this card (opens the tag picker)' : 'Manage tags'}
        >
          <Plus size={10} />
        </button>
      </SideFlowZone>
      {/* 1.7.5 — THE GHOST LAYER (the off mode's farewell — see ghostTags
          above + .gd-tag-ghost-row in index.css): the old card's chips
          ride an absolutely-positioned twin of the wall for the flight's
          first beat (0.12s), fading OUT while the new card's own chips
          wait at opacity 0.
          1.7.6 — THE FULL CROSSFADE: the ghost carries the WHOLE old row
          (every chip the old card showed, not just the lost ones) and
          its chips wear .is-ghost — the arrival rule's own exemption —
          so the farewell beat actually paints (the 1.7.5 ghost's own
          children were caught by the arrival selector and held at
          opacity 0 through their entire life: the beat never rendered,
          lost chips hard-cut). Every new chip fades in on the second
          beat — the shared ones dissolve and arrive like the rest, no
          chip ever snaps.
          1.7.8 — THE FAREWELL IS A SNAPSHOT ("when tags fade in they
          are still sorted in like a single row-ish ... during the fade
          effect it sorts to the bottom for a quick second then snaps to
          how it should be, fix that so it directly appears as it should
          be"): the ghost re-wrapped the old chips in its own row-major
          flex — never the lattice the eye was watching (the lane wall
          reads column-major), and its box clipped to whatever the NEW
          census measured — so the farewell itself was the "single
          row-ish" wrong layout the report names. Each chip now paints at
          its MEASURED seat (the frozen rect snapshot above — left/top/
          width/height taken while the old card held still), so the
          dissolve is pixel-faithful to what was on screen and the
          arrivals land in their true final seats directly beneath it:
          no fabricated lattice, no snap, the reading order never
          changes (the live wall's left-to-right law untouched). */}
      {ghostTags.length > 0 && (
        <div
          className={clsx('gd-tag-ghost-row', ghostSeatsRef.current && 'is-seated')}
          aria-hidden
        >
          {ghostTags.map((tag) => {
            const seat = ghostSeatsRef.current ? ghostSeatsRef.current.get(tag.id) : null;
            return (
              <span
                key={tag.id}
                className="gd-chip gd-tag-chip is-ghost !py-1 !px-2 text-[10px]"
                style={{
                  /* the measured seat — absolute inside the seat's own box
                     (the .is-seated law below zeroes the ghost's frame so
                     the chip coordinates speak the seat's origin direct).
                     1.9.0 — THE SEAT SPEAKS THE EXTENDED ORIGIN: the
                     ghost's box now reaches 6px left of the seat (the
                     .is-seated left: -6px law — the wall's own headroom,
                     so the chips' hanging marks clear the farewell's clip
                     plane), and the coordinates speak THAT origin: +6
                     keeps every chip painting at its exact measured
                     on-screen seat while its mark keeps its full 6px
                     reach inside the clip. */
                  ...(seat
                    ? {
                        position: 'absolute',
                        left: `${seat.left + 6}px`,
                        top: `${seat.top}px`,
                        width: `${seat.width}px`,
                        height: `${seat.height}px`,
                      }
                    : null),
                  background: tag.color,
                  color: readableInk(tag.color),
                }}
              >
                <TagRibbon tag={tag} scale={0.55} className="gd-chip-shape" />
                {tag.icon && <ChipGlyph name={tag.icon} size={10} className="flex-shrink-0" />}
                <RichText text={tag.name} className="gd-tag-label-cap" />
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}


// 1.6.4 — THE NOTES READER'S WINDOW ("the expand button should open a new
// window with fade in fade out, and that window should contain the big
// version of the prompt … (notes should do the same, also change their
// icons)"): the notes' own reader — the whole note as a big readable page
// in the app's own Modal (the fade + rise flight every window speaks).
// 1.6.7 — THE READER GROWS INTO THE EDITOR ("you didnt update the expand
// button and wxpanded window for notes, fix that, update the expanded
// window, update the expand button, update the color picker to be in
// corner too, etc.."): the read-only page is retired — the notes speak
// the PROMPT'S own 1.5.2 law now. The window is the big EDITOR (the
// PROMPT EDITOR's twin): a stage-sized editing field (.gd-notes-stage,
// its own 58vh scroll, the pinned COPY + DONE foot) whose every keystroke
// lands LIVE through the same patch road the row's textarea speaks (the
// row behind the window updates in real time — DONE is just the door),
// the subheader carrying the version's label + the live character count.
// The parts' editor keeps its own voice (the title field, the part
// follow); this one follows the VERSION, because that is what a note
// belongs to.
function NotesEditorWindow({ version, versionLabel, onSetNotes, onClose, onStatus }) {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef(0);
  const text = String(version?.notes || '');
  const chars = text.length;
  const copyAll = async () => {
    if (!text.trim()) return;
    try {
      if (window.api?.clipboardWriteText) await window.api.clipboardWriteText(text);
      else throw new Error('no clipboard');
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1600);
      onStatus?.('Notes copied');
    } catch {
      onStatus?.('Copy failed', 'fail');
    }
  };
  return (
    <Modal
      title="NOTES EDITOR"
      onClose={onClose}
      width="w-[680px]"
      /* 1.7.2 — THE WINDOW FITS THE COLOR ENTIRELY ("prompt/note editor
         window entirely should fit into the color picked, not just the
         container, that includes the window, the title, and so on"): the
         notes' big editor speaks the prompt editor's own law — the
         whole window wears the notes' picked color (the card's ground =
         the FACE, the header + footer bands follow it, the title speaks
         the face's ink, and the stage inside steps one depth to the
         WELL — the same neumorphic ladder PromptExpandWindow speaks).
         No color, no tint: the theme's own window, unchanged. */
      tint={
        version?.notesColor
          ? {
              ['--part-color']: version.notesColor,
              ...(partContainerFace(version.notesColor, version?.notesColorShade === 'deep') || {}),
            }
          : null
      }
      subheader={
        <div className="flex items-baseline justify-between gap-3">
          {/* 1.7.2 — the subheader's inks follow the face (the fallback
              keeps the theme's chrome when no color speaks). */}
          <span className="text-[12px] font-bold truncate" style={{ color: 'var(--part-ink, var(--gd-chrome))' }}>
            {String(versionLabel || '').toUpperCase()}
          </span>
          <span className="text-[10px] tracking-[0.14em] uppercase whitespace-nowrap" style={{ color: 'var(--part-ink, var(--gd-mute))', opacity: 0.75 }}>
            {chars} character{chars === 1 ? '' : 's'} · edits land live
          </span>
        </div>
      }
      footer={
        <div className="flex justify-end gap-2">
          <button
            className={clsx('gd-btn', copied && 'gd-btn-accent')}
            disabled={!text.trim()}
            onClick={copyAll}
            title="Copy the whole note to the clipboard"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'COPIED' : 'COPY'}
          </button>
          <button className="gd-btn gd-btn-accent" onClick={onClose} title="Close the big editor (edits are already applied)">
            DONE
          </button>
        </div>
      }
    >
      {/* 1.6.8 — THE CONTAINER'S COLOR FOLLOWS THE NOTE ("also container
          color should affect the prompt/note container inside alongside
          the expanded window"): the big editor's stage wears the notes'
          own tint — the tinted frame and wash (the DEEP shade at full
          weight), the same law the box behind it speaks. See
          .gd-notes-stage.is-colored in index.css. */}
      <textarea
        spellCheck={false}
        className={clsx(
          'gd-input gd-notes-stage',
          version?.notesColor && 'is-colored',
          version?.notesColorShade === 'deep' && 'is-shade-deep'
        )}
        style={
          version?.notesColor
            ? {
                ['--part-color']: version.notesColor,
                ...(partContainerFace(version.notesColor, version?.notesColorShade === 'deep') || {}),
              }
            : undefined
        }
        value={text}
        placeholder="Notes for this version: ideas, settings, whatever belongs with it…"
        autoFocus
        onChange={(e) => onSetNotes(e.target.value)}
      />
    </Modal>
  );
}

// 1.6.7 — THE NOTES' OWN COLOR WINDOW ("update the color picker to be in
// corner too"): the parts' PartColorWindow law, spoken for the notes —
// the app's own color ladder (∅ for the theme's frame, the preset
// washes, the custom picker for any hex) in the app's own window language
// (Modal — fade + rise, the pinned DONE key). Every pick lands LIVE
// through patchVersion's own road (the box behind the window takes its
// tint the moment the swatch is pressed); ∅ returns the theme's own
// frame. The paint itself is the .is-colored wash the part rows speak
// (index.css) — a tinted border, a tame wash, a tinted shadow; the field
// and the keys never change.
function NotesColorWindow({ version, versionLabel, onPick, onClose }) {
  const color = version?.notesColor || null;
  // 1.6.8 — THE SHADE DIAL (the parts' own law, joined): LIGHT keeps the
  // pale veil; DEEP speaks the color at full weight.
  const deep = version?.notesColorShade === 'deep';
  const shadeBtn = (id, label, title, isOn) => (
    <button
      type="button"
      className={clsx('gd-btn !py-1 !px-2.5 text-[10px]', isOn && 'gd-btn-accent')}
      title={title}
      onClick={() => onPick(color, id)}
    >
      {label}
    </button>
  );
  return (
    <Modal
      title="NOTES COLOR"
      onClose={onClose}
      width="w-[420px]"
      subheader={
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[12px] font-bold truncate" style={{ color: 'var(--gd-chrome)' }}>
            {String(versionLabel || '').toUpperCase()}
          </span>
          <span className="text-[10px] tracking-[0.14em] uppercase whitespace-nowrap" style={{ color: 'var(--gd-mute)' }}>
            the container&rsquo;s own frame · lands live
          </span>
        </div>
      }
      footer={
        <div className="flex justify-end">
          <button className="gd-btn gd-btn-accent" onClick={onClose} title="Close the color window (the color is already applied)">
            DONE
          </button>
        </div>
      }
    >
      <div className="gd-cls-presets">
        <button
          type="button"
          className={clsx(
            'w-6 h-6 rounded border-2 flex items-center justify-center text-[10px] font-bold',
            !color ? 'gd-btn-accent' : 'text-gd-chrome'
          )}
          style={{ borderColor: 'var(--gd-line)' }}
          title="Theme default: the notes wear the theme's own frame"
          onClick={() => onPick(null, deep ? 'deep' : null)}
        >
          ∅
        </button>
        {CLASS_COLOR_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className={clsx('gd-cls-preset', color === preset && 'is-active')}
            style={{ background: preset, borderColor: color === preset ? 'var(--gd-chrome)' : 'var(--gd-ink)' }}
            title={preset}
            onClick={() => onPick(preset, deep ? 'deep' : null)}
          />
        ))}
        <span className="gd-swatch-divider" aria-hidden />
        <ColorPickerButton
          color={color}
          onColor={(hexOrNull) => onPick(hexOrNull, deep ? 'deep' : null)}
          dashed
          active={!!color && !CLASS_COLOR_PRESETS.includes(color)}
          title="Open the color picker: any color you like"
        />
      </div>
      {/* 1.6.8 — THE SHADE DIAL (the parts' law, joined): the explanatory
          paragraph left with the request; its seat speaks the LIGHT / DEEP
          pair — one press, live, the shade riding the box, the well inside
          and the big editor's stage together. */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[10px] tracking-[0.16em] uppercase" style={{ color: 'var(--gd-mute)' }}>
          Container shade
        </span>
        <div className="flex items-center gap-1">
          {shadeBtn('light', 'LIGHT', 'The pale wash the containers always spoke: a tinted border, a soft veil', !deep)}
          {shadeBtn('deep', 'DARK', 'The color speaks at full weight: a richer face and a full-color border', deep)}
        </div>
      </div>
    </Modal>
  );
}

// 1.6.9 — THE VIEW IS MEMO'D ("i feel like i do understand why some buttons
// get delayed sometimes and it could relate to calculations such as if i
// press on a class and it goes right away or when i press on it and it has
// to calculate if it needs to scroll left or right for example, and that
// also applies to alot like new card window or settings window, if possible
// do fix that long delay issue"): the panel and the full-window view are
// the app's heaviest trees (the 4000-line body, its measurement twins, the
// stage, the parts editor), and before this they re-rendered on EVERY App
// state change — a class press, a grid drag, any settings toggle re-painted
// a detail view nobody was looking at, on top of whatever the press itself
// cost: the "some buttons get delayed" report. The props the mounts pass
// are stable identities now (App's 1.6.9 handle block), so the memo holds
// exactly when it should: a re-render that does not touch THIS character,
// the tags, the stamp library or the view's own settings SKIPS the whole
// tree — and a card switch, a version patch, a tag toggle still renders
// (the character object's identity changes with its record, db.tags moves
// when a tag does). The view reads no context and no window globals at
// render time, so the shallow compare is the whole truth.
function CharacterView({
  character,
  tags,
  stampLibrary = [],
  imagesPath,
  compact = false,
  cardDefaultRatio,
  outputBarOn = false,
  showHelp = false,
  // 1.5.8 — THE EXPERIMENTAL GATE (App passes settings.livingFinishes ===
  // false): forwarded to the EDIT CARD window's finish row — the material
  // coats leave the picker while the master switch is off. 1.5.9 — the
  // saved coats leave the PAINT too (the root's .gd-finishes-still
  // retirement in index.css); the values on the cards are never
  // rewritten, and the coats return the moment the switch does.
  finishesHidden = false,
  // 1.3.0 — STAGED PANEL MOUNT (Settings → Performance): true (default)
  // keeps the 1.2.9 staged breaths (the tags zone one frame after the
  // first paint, the stamps zone the frame after, placeholders holding
  // their seats); false mounts the whole view in one flat commit.
  stagedMount = true,
  // 0.31.0 — the full-window view's CARD column width (the image-preview
  // column of the 3-column spread): the SEPARATOR below hands the live
  // width to the column node during a drag and commits through
  // onCardColWidth on release, exactly the panel-width story.
  cardColWidth = CARD_COL_WIDTH_RANGE.default,
  onCardColWidth,
  // 0.34.0 — AUTO-SWITCH IMAGES (Settings → Performance): forwarded to the
  // image stage's 5s walk.
  autoSwipe = false,
  /* 1.4.6 — THE DORMANT SEAT (the retained panel): true while the aside
     is parked at width 0 — the view keeps its built tree and its db-driven
     freshness, but its SELF-DRIVEN clocks (the image stage's auto-swipe
     walk) sleep until the panel is live again. */
  dormant = false,
  onBack,
  patchCharacter,
  // 0.41.0 — onRename is RETIRED (the card's name is edited inside the
  // EDIT CARD window now); the prop stays accepted-but-unused so App's
  // older call sites keep working through the transition.
  onRename: _onRename,
  onDelete,
  onToggleTag,
  onOpenTagManager,
  // 1.7.5 — THE UNSELECTED TAGS SWITCH'S VIEW SEAT (Settings → Look, see
  // SettingsModal's 1.7.5 note): true (default) keeps the row's full
  // vocabulary + the manager door; false hides the unselected chips and
  // turns the + TAGS keys onto the TAG PICKER window (onOpenTagPicker —
  // App's stable handle, same road as the manager's).
  showAllTags = true,
  onOpenTagPicker = null,
  // 1.3.0 — the tags row's own drag commits here (the GLOBAL order —
  // db.tags — the same road the tag manager's list speaks; see
  // TagsFlowRow below).
  onReorderTags = null,
  onAttachStamp,
  onRemoveStamp,
  onPromoteStamp,
  onUploadStamp,
  onRenameStamp,
  onReorderStamps,
  onStampColor,
  onStampTransform,
  confirm,
  onStatus,
  onActiveVersion,
  // 0.45.0 — UNDO / REDO RETURN TO THE HEADER'S KEYS ("when i right click
  // on card options, it would show me the edit card option and delete
  // option alongside the undo and redo"): App wires its own undo/redo (and
  // the stack flags + shortcut labels) through both mounts, so the gear's
  // right-click menu can carry them beside EDIT CARD and DELETE.
  onUndo = null,
  onRedo = null,
  canUndo = false,
  canRedo = false,
  scUndo = '',
  scRedo = '',
  // 0.45.0 — THE GEAR'S MENU ("wired down from App through both mounts"),
  // plus onRequestCardLook: App-level EDIT CARD (1.0.3).
  onEditCard = null,
}) {
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [editingVersionId, setEditingVersionId] = useState(null);
  // 0.37.0 — COLLAPSIBLE TAGS / STAMPS HEADERS: one toggle per row (the
  // label itself is the key). Collapsed, the row's chips clamp to a single
  // no-wrap line that fades at its cut. The state lives HERE, above the
  // per-card render, so it survives switching cards and applies to BOTH
  // mounts (the right panel and the full-window view).
  // 0.38.0 — SCROLL-TO-COLLAPSE ("make it so when scrolling down on right
  // panel it would collapse the tag and the stamp area, leaving only a
  // collapse and expand button in the middle of the separator…"): when the
  // panel scrolls DOWN and the cursor is not resting on the header zone,
  // both rows fold away entirely — the separator stays, carrying a small
  // centered EXPAND chip; one click brings the rows back. The PIN key in
  // the header ("an option on top next to the others that when turned on
  // would always pin the stamp and the tag area") disables the behavior.
  const [rowsCollapsed, setRowsCollapsed] = useState(() => {
    const kept = ROWS_STATE_CACHE.get(character.id);
    return kept ? { tags: !!kept.tags, stamps: !!kept.stamps } : { tags: false, stamps: false };
  });
  const [autoCollapsed, setAutoCollapsed] = useState(() => ROWS_STATE_CACHE.get(character.id)?.auto === true);
  // 1.8.0 — THE PANEL WAKES OPEN ("by default, tags/stamps area should be
  // open when opening the details tab from closed (aka not when switching
  // cards), but when switching cards it remains as it currently is"): the
  // docked view never unmounts (the 1.4.6 retained seat), so the rows'
  // folds survived the panel's own close/open cycle — the panel woke
  // wearing whatever it fell asleep in. The WAKE edge (dormant true ->
  // false, exactly the closed -> open transition; card switches never
  // touch it) now opens both rows and disarms the auto-fold: the panel
  // greets the card with its tray laid out. The first mount stays silent
  // (the cache initializer above already speaks the card's own remembered
  // folds), and card-to-card switches while the panel lives never enter
  // this law — the 0.44.0 carry-over keeps its word.
  const wasDormantRef = useRef(dormant);
  useEffect(() => {
    if (wasDormantRef.current && !dormant) {
      // 1.8.4 — the wake returns the cover's loan before it opens the tray
      // (see dismissSeatDebt): the panel fell asleep holding a scroll-fold's
      // debt, and waking the tray open with the debt still standing would
      // count the tray's height TWICE — the content below would sit a whole
      // debt too low and the scrollbar's map would lie about the page.
      // 1.8.6 — THE SILENT ASCENT retires the loan whole (see the seat's
      // tombstone at the refs below): no fold ever borrows anymore — every
      // fold rides the flow road, the page shortening with the flight — so
      // the wake opens the tray by the hand's own word alone (see
      // openTrayByHand) and there is nothing to return.
      setRowsCollapsed({ tags: false, stamps: false });
      openTrayByHand();
    }
    wasDormantRef.current = dormant;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dormant]);
  // 1.2.9 — THE VIEW MOUNTS IN BREATHS ("fix the lag that occurs when
  // opening and closing the right panel … it seems to occur related to
  // the amount of cards present"): the detail view's mount cost is the
  // ROWS TRAY almost whole — measured live in the browser: opening the
  // full-window detail carried ONE ~55ms main-thread task (production
  // build); stub the tags SideFlowZone alone and the task disappears,
  // stub the stamp editor alone and it disappears too. Each zone renders
  // its whole children set TWICE (the hidden measurement twin + the live
  // seat) and measures both in the same commit that mounts the view —
  // all inside the CLICK's frame, so the panel/cover flight cannot even
  // START for those 55ms+ (far worse on weaker machines): the "pop-out
  // lags" feel. The tray now lands in its own breaths: the first paint
  // carries everything CHEAP (the header, the name, the image, the
  // prompt), the tags zone mounts one frame later, the stamps zone one
  // frame after that — two small tasks under the already-running entrance
  // flight instead of one big one blocking its first frame. The zones'
  // seats hold placeholders at the heights the tray painted last time
  // (TRAY_ZONE_H_CACHE), so the landings read as the tray settling, never
  // as a jump. Card SWAPS in the docked panel never re-stage (the view
  // instance survives); the full-window cover remounts per character and
  // re-stages with it — its entrance flight covers the landings the same
  // way. Closing needs nothing: unmounting was always the cheap half
  // (measured: no long task on the close path at all).
  // 1.3.6 — THE STAMPS BREATH IS RETIRED ("the stamps area is also blank
  // while the right pannel is opening then all the stamps summon in"):
  // the stamps zone mounts with the view's OWN first frame now — its
  // measurement twin renders stand-in boxes for the fixed 44x44 slots
  // (SideFlowZone's uniformItems law) instead of the full double mount,
  // so its first-commit cost is one cheap live render.
  // 1.3.8 — THE TAGS BREATH IS RETIRED TOO ("when opening right pannel, the
  // container of tags ... do that same small lift up then return to normal
  // for a split second during it"): the last breath (rAF 1) and its 98px
  // placeholder guess left with the tags' own law below — every zone
  // mounts with the view's own first frame, there is no placeholder to
  // mismatch, and the TRAY_ZONE_H_CACHE (whose only reader was that
  // placeholder) retired in the same breath. mountStage itself is now a
  // constant: the staging ladder has no steps left to climb.
  const [mountStage, setMountStage] = useState(() => (stagedMount ? 2 : 2));
  useEffect(() => {
    if (!stagedMount) {
      setMountStage(2);
      return undefined;
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 1.1.2 — THE SCROLL FOLD SNAPS ("the detail panel when i collapse the
  // stamps/tags area when i scroll down it freezes slightly and gets janky
  // when i scroll, as if it pushes forward then back") — RETIRED IN 1.8.5,
  // and the whole 1.8.4/1.8.5 SEAT ECONOMY RETIRED WITH IT IN 1.8.6 — THE
  // SILENT ASCENT ("currently when i scroll up it opens the tags/stamps,
  // fix that so the scroll upwards wont affect so ... instead expanding
  // should just be manual by the user like usual"): the seat (rowsSeatRef,
  // a spacer below the header holding exactly the height a fold removed),
  // the debt it held (seatDebtRef), the payer that wrote it frame by frame
  // (launchSeatPayer's ResizeObserver formula), the flow road's restore
  // memory (flowFoldRef + flowOriginRef), the dead zone that guarded the
  // restore edge (foldDeadRef), the hem that called the loan back and the
  // manual dismissal that paid it (dismissSeatDebt) — all of it served ONE
  // promise: the page's length never changes while the tray moves, so
  // nothing below the header ever moves a pixel. But a debt standing is a
  // geometric obligation the scroll itself must answer: the moment the
  // scroll rises back above the loan, the seat's blank band shows below
  // the stuck header — the tray MUST either expand (the auto-expand the
  // report retires) or the page must shorten (the flow's own word). The
  // owner's law settles it: expanding belongs to the HAND alone, so the
  // debt can never stand at all — every scroll-fold rides the FLOW ROAD
  // now (the page shortens WITH the tray's 0.24s flight, monotonic, the
  // content rising into the vacated space — the road the owner has loved
  // from the top since 1.8.5), the scroll's ascent answers NOTHING (the
  // tray stays folded until the chip, a label toggle, the pin or the wake
  // opens it — each one a flight the page grows back with), and the
  // between-band keeps its own ground (a mid-page journey stands down
  // until the scroll passes the tray's hem, exactly where it always
  // stood). The is-snap law in index.css stays as the era's tombstone,
  // and the .gd-rows-seat selector keeps its seat the same way.
  // 1.8.5 — THE JOURNEY'S START: the road choice needs to know where the
  // CURRENT downward journey began — a journey that starts at the top (the
  // report's own case: "when scrolling down from top of the detail panel")
  // folds wherever its first tick lands; one begun mid-page stands down
  // until the scroll passes the tray's hem. Recorded the tick the
  // direction turns downward.
  const journeyStartRef = useRef(null);
  // 1.8.5 — THE FOLDED REST, CACHED: the between-band gate needs the tray's
  // folded height to know the hem before committing — measured honestly one
  // settled breath after a fold commits (the effect below), and 26 (the
  // padding 5+5, the chipline 14, the tray's own border 2 — the CSS's own
  // numbers) until then.
  const foldRestHRef = useRef(0);
  // 1.8.4 — THE NAME'S SEAT AT FOLD TIME: the scroll-fold retracts an
  // expanded name with the rows (the 1.0.7 law), and the name's own flight
  // rides with the tray's through the fold — so the hand that re-opens the
  // tray is obliged to return the name's height too (the fold swallowed
  // both, the manual road pays both back out, and the page grows one whole
  // flight). Captured the breath the fold commits, consumed by the hand's
  // roads; a manual retract clears it (the name the owner retracted stays
  // retracted).
  const nameOpenAtFoldRef = useRef(false);
  // 1.1.2 — live mirrors for the scroll listener (its effect only rebuilds
  // on rowsPinned — the closure would else read a stale fold state and
  // "compensate" a fold that already happened scrolls ago).
  const autoCollapsedRef = useRef(autoCollapsed);
  useEffect(() => {
    autoCollapsedRef.current = autoCollapsed;
  }, [autoCollapsed]);
  const nameExpandedRef = useRef(false);
  const [rowsPinned, setRowsPinned] = useState(false);
  // 1.0.7 — THE NAME'S OWN FOLD ("remove the detail panel feature where the
  // card name when hovered over will show fully, instead add a button on top
  // to expand or retract the rest of the name, closes automatically when
  // scrolling, stays stuck when pinnned, and when retracted will only show
  // the first 2 lines"): the old hover-unclamp is retired (index.css) and the
  // two-line cut is a STATE now. nameExpanded holds it; nameOverflows arms
  // the header key only when the name actually has more than two lines to
  // give; nameFoldH is the measured height of the name while clamped (the
  // exact two-line box — theme fonts and all), captured while retracted so
  // the fold's animation always lands on the true second line, and kept
  // through an expansion as the retract target. NOT persisted in the rows'
  // memory: a fresh mount starts retracted, exactly like the auto-fold.
  const [nameExpanded, setNameExpanded] = useState(false);
  useEffect(() => {
    nameExpandedRef.current = nameExpanded;
  }, [nameExpanded]);
  const [nameOverflows, setNameOverflows] = useState(false);
  const [nameFoldH, setNameFoldH] = useState(null);
  // 1.8.3 — THE NAME'S FOLD TARGET, MIRRORED (the same live-mirror law
  // autoCollapsedRef speaks) — the 1.8.3 same-breath fold wrote the retract
  // target directly on the name's own wrapper node and the listener's
  // long-lived closure had to read the measured two-line box the render
  // actually holds. 1.8.5 — the listener writes nothing anymore (the fold
  // is a state flip; framer's own flight carries the retract). 1.8.6 — the
  // payer's measure chain left with the payer (THE SILENT ASCENT), and the
  // mirror keeps its seat for any future road that wants the honest
  // two-line box outside a render.
  const nameFoldHRef = useRef(null);
  useEffect(() => {
    nameFoldHRef.current = nameFoldH;
  }, [nameFoldH]);
  const nameFoldRef = useRef(null);
  const nameRef = useRef(null);
  // 1.3.9 — THE FOLD'S FIRST LANDING SNAPS (see the motion.div's transition
  // note): true until the mount measure's target has COMMITTED — the render
  // that first carries a non-null nameFoldH reads it true and speaks a
  // duration-0 transition, so the ceiled target lands in the same pre-paint
  // commit as the measure itself and nothing below the name ever rides the
  // 'auto -> measured' hair. Flipped by the commit effect below (and, belt
  // and braces, by the fold's own onAnimationComplete); every flight after
  // the first keeps its 0.24s slide.
  const foldFirstLandingRef = useRef(true);
  useLayoutEffect(() => {
    if (nameFoldH != null && foldFirstLandingRef.current) {
      foldFirstLandingRef.current = false;
    }
  }, [nameFoldH]);
  // 1.1.1 — THE RESTING ELLIPSIS'S TWO SEATS. `nameClamped` is whether the
  // REAL name currently wears the two-line clamp (the "..." the user asked
  // for: "the last 2 shown letters are cropped and replaced with the 3 dots
  // until it expands then it reveals it"). It is TRUE whenever the fold sits
  // retracted — mount, character swaps, the auto-retract on scroll — and it
  // LIFTS for the whole expand, then re-lands only when the retract TWEEN
  // settles (framer's onAnimationComplete): during the flight the wrapper's
  // own overflow-hidden does the cutting, and the dots arrive with the
  // landing, so the name never snaps mid-animation.
  // `nameMeasureRef` is the MEASUREMENT TWIN (see the fold JSX below): the
  // natural, unclamped copy whose height is the only honest answer to "does
  // this name have more than two lines?" — the clamped real element only
  // ever measures two, so the probe must read a name that never lies.
  const [nameClamped, setNameClamped] = useState(true);
  const nameMeasureRef = useRef(null);
  // 0.44.0 — write-through: every fold lands in the memory the same render
  // it happens, so the NEXT mount (however soon) reads exactly what the
  // user left behind.
  useEffect(() => {
    ROWS_STATE_CACHE.set(character.id, { ...rowsCollapsed, auto: autoCollapsed === true });
  }, [character.id, rowsCollapsed, autoCollapsed]);
  const rowsZoneRef = useRef(null);
  const rootRef = useRef(null);
  const lastScrollRef = useRef(null);
  // 1.6.0 — THE CARD SWAP SPEAKS ("add the transition feedback when i switch
  // card details, the same as it was in an older version, basically like a
  // shift for tags stamps name and image and what not so it gives feedback
  // that the user switched cards"): since the 1.4.6 retained seat the aside
  // never unmounts, so a card swap on the LIVE panel re-rendered every field
  // in place — the name, the tags, the stamps, the image all changed at once
  // with nothing moving, and the switch read as a silent teleport. The view
  // now replays the grid cards' own entrance language whenever the CHARACTER
  // prop changes identity (a fade + a 10px settle, 0.15s — the same breath
  // a fresh card speaks arriving on the board), applied through the
  // press-pulse's own re-arm idiom (strip the class, force a reflow, re-add
  // it) so the SAME mounted tree — the retained seat's whole warm point —
  // carries the animation, nothing remounts, no build is ever paid twice.
  // The FIRST mount stays silent (the panel's own opening flight is that
  // arrival's feedback), and the full-window view never hears it at all —
  // its card changes remount through the cover's keyed enter variant, which
  // is already the feedback there.
  //
  // 1.6.2 — THE FLIGHT FINDS ITS SEATS, NOT THE SCROLLER ("when the fade
  // feedback occurs when i switch between cards, it adds another scrollbar
  // to the right, fix that (also make it so the container for tags/stamps
  // doesnt fade with it exposing the background pattern …)" + "the fade
  // that occurs as a feedback of switching cards isnt happening onto the
  // tags and stamps themselves, fix that" + "i only just wanted the
  // container itself not to fade since it was weird seeing the background
  // texture flicker for a second everytime"): the 1.6.0 cut armed the
  // flight on the ROOT SCROLLER — three diseases in one class:
  //   · the 10px DOWNWARD settle translated the scroller itself, whose
  //     bottom edge grew the PARENT scroller's overflow — the second
  //     scrollbar on the right, every switch;
  //   · the fade rode the whole scroller INCLUDING the rows tray's tinted
  //     plate, so the plate dissolved into the panel's texture behind it
  //     — the background pattern flickering through, every switch;
  //   · and yet the tags and stamps THEMSELVES still faded only as
  //     passengers of the whole-scroller wash — the tray was the one thing
  //     the owner wanted SOLID, and the content was the thing they wanted
  //     MOVED.
  // The flight is a CONTENT law now: the root class arms DESCENDANT seat
  // animations through CSS (see .gd-cv-swap in index.css) — the header's
  // controls and name, the tray's INNER rows (the chips, the stamps, the
  // keyline — everything INSIDE the plate), and the whole body below the
  // header all fade and settle TOGETHER, while the sticky header's own
  // surface and the rows tray's PLATE keep painting solid through the
  // whole flight (no texture ever flickers through, the tray keeps its
  // frame), and the settle speaks UPWARD-DOWN (translateY(-10px) → 0 —
  // content descending into its seat): an upward edge can never extend any
  // scroller's ground, so no scrollbar can ever grow from the flight, on
  // either floor. The tray's own height stays exactly what its content
  // says (the framer fold + the natural flow — no held boxes, no crop, the
  // collapse keyline always where it lives), and the class itself retires
  // on a short clock after the flight so a seat mounted later never
  // inherits a stale arm.
  const swapCharIdRef = useRef(null);
  // 1.6.9 — the PREVIOUS CHARACTER OBJECT rides the same memory (the id
  // alone cannot answer "which tags were active on the card I just left" —
  // the tag color crossfade below needs the old card's own set).
  const swapCharObjRef = useRef(null);
  const swapCleanTimerRef = useRef(0);
  // 1.6.9 — THE TAGS' COLOR CROSSFADE STATE ("card switching feedback works
  // as intended except in one area, the tags, i want the colors themselves
  // to be the faded ones, dont fade the tags themselves, instead fade the
  // tags, the tags that shared would not fade, like both selected or none
  // selected, but the different ones that one of each has will fade, if
  // you know what i mean"): while the swap flight lives, this carries the
  // PREVIOUS card's active-tag set; TagsFlowRow reads it and arms ONLY the
  // chips whose membership CHANGED between the two cards with a color
  // crossfade (their old face fading into the new one through
  // --gd-swap-old-face / --gd-swap-old-ink + .is-swap-colorfade in
  // index.css) — the chips themselves (border, ribbon, structure) stay
  // solid, and every shared-state chip (selected on both, selected on
  // neither) does not move at all. The state arms with the class and
  // clears with the same 190ms clock, so the next swap re-arms cleanly.
  const [tagSwapOldActive, setTagSwapOldActive] = useState(null);
  // 1.7.5 — THE TAGS' OWN FLIGHT CLOCK: the tag state's window is LONGER
  // than the wholesale seats' now (the slowed 0.24s pour + the off mode's
  // two-phase flight both outlive 190ms), so the state clears on its own
  // timer while the gd-cv-swap CLASS keeps its own 190ms law untouched —
  // a seat that mounts at 190ms never inherits the wholesale fade, and a
  // chip mid-pour never gets its class pulled out from under it.
  const swapTagTimerRef = useRef(0);
  useLayoutEffect(() => {
    const el = rootRef.current;
    const id = character?.id || null;
    const prev = swapCharIdRef.current;
    const prevChar = swapCharObjRef.current;
    swapCharIdRef.current = id;
    swapCharObjRef.current = character || null;
    if (prev == null || prev === id) return;
    // 1.8.5 — A LIVE PAYER RE-ANCHORS AT THE SWAP (see launchSeatPayer):
    // its (D0, H0) anchors belong to the card that just left — the folded
    // rest the seat holds is content-blind (the plate paints the same at
    // every card), but a payer still mid-flight must not carry the old
    // card's open heights into the new card's tray. — RETIRED IN 1.8.6
    // (THE SILENT ASCENT retired the payer with the seat it wrote: no fold
    // ever borrows, so there is no anchor to re-seat at a swap).
    if (!el || typeof el.classList?.remove !== 'function') return;
    if (swapCleanTimerRef.current) {
      clearTimeout(swapCleanTimerRef.current);
      swapCleanTimerRef.current = 0;
    }
    if (swapTagTimerRef.current) {
      clearTimeout(swapTagTimerRef.current);
      swapTagTimerRef.current = 0;
    }
    el.classList.remove('gd-cv-swap');
    // 1.7.5 — THE TAGFLIGHT CLASS: the tags' own two-phase window (the
    // ghost + the delayed fade-in — see .gd-cv-tagflight in index.css),
    // armed beside the wholesale seats' class and cleaned on the tags'
    // own longer clock.
    // 1.7.6 — THE FLIGHT SPEAKS THE OFF MODE ALONE ("the tags does the
    //   switching fade feedback animation as if they are switching from
    //   on to off, but its also effecting unrelated tags that are
    //   already off"): the class used to arm on EVERY switch, mode-blind
    // — and its arrival rule (a 0,4,0 selector) outranked the pour's own
    // (0,3,0) on every non-kept chip, so the ON mode's chips vanished
    // into an opacity blink instead of pouring, unrelated already-off
    // chips blinked with them, and the genuinely switching chips had
    // their colors snap while invisible. The class arms ONLY while the
    // row hides unselected chips now (the picker mode — the census
    // actually changes there); the ON mode never meets an arrival rule
    // and the pour speaks alone, exactly what it has to say.
    el.classList.remove('gd-cv-tagflight');
    void el.offsetWidth; // reflow so the class flip animates
    el.classList.add('gd-cv-swap');
    if (showAllTags === false) el.classList.add('gd-cv-tagflight');
    // 1.6.9 — the tags' old active set arms the same breath (null while
    // the previous card is unknown — nothing fades then, the wholesale
    // seats still speak).
    setTagSwapOldActive(prevChar && Array.isArray(prevChar.tags) ? new Set(prevChar.tags) : null);
    // the arm retires with its own clock (the descendant seats' flights
    // are 0.15s; a beat of grace covers the slowest of them). A class
    // that lingers past its flight would arm any seat that mounts inside
    // the window — the re-arm above strips it first anyway, and the timer
    // keeps the seat list honest in between.
    swapCleanTimerRef.current = setTimeout(() => {
      swapCleanTimerRef.current = 0;
      el.classList.remove('gd-cv-swap');
    }, 190);
    // 1.7.5 — the TAG state rides its own longer clock: 320ms holds the
    // slowed 0.24s pour with grace, and covers the off mode's two beats
    // (the 0.12s ghost-out + the 0.16s delayed fade-in) with room to
    // settle. The state's clear also dismounts the ghost layer.
    // 1.7.9 — THE TAGS SPEAK THE FAMILY'S OWN CLOCK ("the unselected tags
    //   feedback (during on and off) is too slow compared to the rest of
    //   the detail window feedbacks such as the stamps and the title
    //   etc.. fix that so they are on the same speed"): the pour dropped
    //   to 0.15s and the flight compresses to the same 0.15s total (a
    //   0.07s ghost-out + a 0.08s arrival at 0.07s — see the tagflight
    //   law in index.css), so the tag window shrinks with them: 170ms
    //   holds both lands with the same beat of grace the wholesale
    //   seats' own 190ms law speaks. The tags answer WITH the title and
    //   the stamps now — never behind them.
    swapTagTimerRef.current = setTimeout(() => {
      swapTagTimerRef.current = 0;
      el.classList.remove('gd-cv-tagflight');
      setTagSwapOldActive(null);
    }, 170);
    // 1.7.6 — showAllTags rides the deps so a settings flip re-reads the
    // mode (the early-return guard above holds: no card change, no arm).
  }, [character?.id, showAllTags]);
  useEffect(
    () => () => {
      if (swapCleanTimerRef.current) clearTimeout(swapCleanTimerRef.current);
      if (swapTagTimerRef.current) clearTimeout(swapTagTimerRef.current);
    },
    []
  );
  // 1.4.7 — THE HOVER HOLD ("when i scroll down while my cursor is on the
  // tags/stamps and name area, it still collapses, fix that so it doesnt
  // do if im hovering on top"): the 1.4.5 pass retired the rows-zone
  // :hover guard because a cursor merely RESTING over the zone's broad
  // slab delayed the fold to "midway" — the owner now asks for exactly
  // that hold back, scoped to the tray + the name's own block: while the
  // pointer rides EITHER ground, the scroll-fold stands down (the user is
  // reading/working the rows — the wheel belongs to the panel, the rows
  // keep their seat). Pointer enter/leave maintain the ref; the listener
  // reads it live (no re-render, no closure staleness).
  const rowsHoverRef = useRef(false);
  // 1.1.8 — THE TAGS ZONE'S CLAMP LEFT ITS HOME (the tags row is a
  // SideFlowZone now — see the rows JSX below). The 1-row retract clamp,
  // the 3-row open cap and the sideways columns are all measured by the
  // zone's own hidden twin inside SideFlow.jsx; the 31px floor and the
  // measured-never-shaves-a-chip law live on there. useClampStyle itself
  // stays exported for the creation window's stamps gallery (its 2-row
  // fold keeps the old measured-clamp law, untouched by the side-flow
  // report — only the TAGS board there joined the sideways world).

  const toggleRow = useCallback((key) => {
    setRowsCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // 1.0.7 — THE NAME'S MEASUREMENT SEAT. The fold target is exactly TWO
  // LINE BOXES of the title's own typography — read from the computed
  // line-height (theme font, body face, panel size — whatever is actually
  // painting), never a hard-coded pixel. The inner element is never
  // clamped: its natural height decides whether there is more to give
  // (nameOverflows), and the WRAPPER's animated height does the cutting.
  // Measured pre-paint on every name/character/size change and kept honest
  // by a ResizeObserver (late font loads, face swaps, resizes all re-flow
  // the lines — the fold target follows).
  // 1.0.9 — AND THE SEAT UNDER THE TEXT ("when the name is collapsed in the
  // detail panel, it clips at the bottom, fix that"): the name div carries
  // mt-1 INSIDE the overflow-hidden fold wrapper, so the text begins 4px
  // below the wrapper's own top edge — a target of exactly two line boxes
  // left the second line's bottom 4px (its descenders) below the cut, and
  // every g / y / p in it arrived amputated. The target now adds the inner
  // element's measured top box (margin + padding + border) to the two line
  // boxes: the fold lands just under the TRUE second line, descenders and
  // all. The overflow probe stays on the element's own height — margins
  // never counted there, and shouldn't.
  // 1.0.9's mt-1 seat law + 1.2.8 — THE TARGET MEASURES THE CLAMP'S OWN
  // BOX ("the name clips at the bottom, again"): the -webkit-line-clamp box
  // paints each line a hair TALLER than the computed line-height math
  // predicts (measured live: two lines at lh 36 paint a 74px client box,
  // not 72 — and the real element's 4px mt-1 seat put its true bottom 2px
  // under the old 76px fold target, shaving the second line's descenders
  // exactly like the 1.0.9 report). While the clamp is actually painting,
  // its OWN client box is the honest two-line cut: the target takes it
  // (floor: one line box, ceiling: the natural height — a name that fits
  // keeps its own height, nothing invented). The last clamped height is
  // remembered so the RETRACT target (measured while the name stands
  // expanded, the clamp off) still knows where the clamp will land.
  const clampedHRef = useRef(0);
  const foldTargetFor = (el, natH = 0) => {
    const cs = window.getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2 || 24;
    const seat =
      (parseFloat(cs.marginTop) || 0) +
      (parseFloat(cs.paddingTop) || 0) +
      (parseFloat(cs.borderTopWidth) || 0);
    const one = Math.ceil(lh);
    const two = Math.ceil(lh * 2);
    const clampedNow = cs.webkitLineClamp && String(cs.webkitLineClamp) !== 'none';
    if (clampedNow && el.clientHeight > clampedHRef.current) {
      clampedHRef.current = el.clientHeight;
    }
    const twoBox = Math.max(two, clampedHRef.current || 0);
    // 1.2.8 — AND THE FLOOR: a name that spans lines never targets less
    // than the clamp's own painted box (the probe measures 72 where the
    // -webkit-box paints 74 — a target below the painted box shaves the
    // second line's bottom exactly as reported). A one-line name takes no
    // floor: a stale learned height must never reserve a phantom line.
    const floor = natH > one + 2 ? clampedHRef.current || 0 : 0;
    // 1.1.9 — THE TARGET NEVER RESERVES A PHANTOM SECOND LINE: the twin's
    // natural height is the honest line count — the target takes the real
    // first line when the name fits one, the full two lines when it needs
    // them, and never less than one line box.
    const body = Math.max(one, Math.min(Math.ceil(Math.max(natH || 0, floor)) || one, twoBox));
    return { lh, fold: Math.ceil(body + seat) };
  };
  // 1.1.2 — THE ARMING IS TWO-SIGNAL NOW ("fix the issue where when the
// detail pannel name gets cropped that i dont get the expand name and
// retact name button and its impossible for me to do so"): the twin's
// natural height answered "does this name have more than two lines?" —
// but it measures through the SAME fonts, the SAME width and the SAME
// RichText as the real name, and any environmental drift between the two
// readings (a late font swap, a theme face change, a width that settles
// after the measure) disarms the key exactly when the dots are painting.
// The REAL element now testifies too: a -webkit-line-clamped box reports
// scrollHeight > clientHeight WHEN (and only when) the clamp is actually
// cutting (proven in Chromium: a truncating 2-line box measures 48/120;
// a fitting one 48/48) — the element painting the "..." cannot lie about
// whether it is painting it. Either signal arms the key; the twin alone
// still decides the FOLD TARGET (it is the only honest natural height
// while the name sits expanded).
  const nameSignals = () => {
    const el = nameRef.current;
    const probe = nameMeasureRef.current;
    if (!el || !probe || typeof window === 'undefined' || !window.getComputedStyle) return null;
    const { lh, fold } = foldTargetFor(el, probe.offsetHeight);
    // 1.2.9 — THE TWIN SPEAKS LINE BOXES, NOT PIXELS ("expanding and
    //   retracting the rest of the name card in the full detail window
    //   activates even though the name does show fully and has no
    //   continuation, fix the issue so that option doesnt appear in that
    //   screen unless the name actually expands beyond the two rows"):
    //   the old verdict compared the twin's pixel height against
    //   two-line-boxes + 2px — but a display face's glyphs overhang their
    //   line boxes by 1-2px per line (measured live: 37 over 36 at 30px),
    //   so a name that wraps to exactly TWO lines with a hair of overhang
    //   read 75-76px against the 74px bar and ARMED the key over a name
    //   with nothing to reveal — most visible in the FULL WINDOW, where
    //   names sit nearest the two-line boundary. A real third line adds a
    //   WHOLE line box (≥ lh); the verdict counts a third line only when
    //   at least half a line of true content sits below the two — the
    //   same tolerance law the clamp's own cut speaks — and a two-line
    //   name with overhang can never arm the key again.
    const twinSays = probe.offsetHeight > Math.ceil(lh * 2.5);
    const cs = window.getComputedStyle(el);
    const clampedNow = cs.webkitLineClamp && String(cs.webkitLineClamp) !== 'none';
    // 1.2.6 — THE CUT TOLERANCE SPEAKS LINE BOXES ("it allows expand and
    // retract of the name when the name didnt bypass the 2 rows in the
    // full screen detail window"): the clamp's own scrollHeight exceeds
    // its clientHeight by the FONT'S glyph overhang — a display face whose
    // ascent+descent beats the 1.2 leading measures 1-2px over per line
    // (measured live: 37 over 36 at 30px), and the old +1px tolerance read
    // that overhang as a THIRD LINE: the expand key armed for names that
    // fit, and the "expand" flight gave the user nothing but air. A real
    // extra line adds a WHOLE line box (~36px); the cut now counts only
    // when at least half a line of true content sits below the clamp.
    const clampCuts = clampedNow && el.scrollHeight > el.clientHeight + Math.ceil(lh * 0.5);
    return { lh, fold, twinSays, clampCuts };
  };
  // 1.2.8 — THE SIGNALS' ONE APPLIER: every consumer (the mount measure,
  // the resize observer, the font-settled re-read) speaks the same
  // three-state landing — the fold target, the key's arming, and the
  // EXPANDED STATE'S QUIET RETIREMENT ("when the name is already fully
  // visible, the expand/collapse key should not show"): a name expanded at
  // a narrow width can COME TO FIT when the window widens (a resize the
  // 1.1.4 key-preservation law never accounted for — the retract key rode
  // on nameExpanded alone and stayed armed over a name with nothing left
  // to hide, forever). When both overflow signals say the name fits, an
  // expanded fold settles back to its retracted truth by itself: the
  // flight targets the same natural height it already paints (nothing
  // moves on screen), the clamp lands on a name it does not cut, and the
  // key retires with it. A name that genuinely still overflows keeps its
  // key through everything — the 1.1.4 "always a way back" law stands.
  const applyNameSignals = useCallback(() => {
    const s = nameSignals();
    if (!s) return;
    setNameFoldH(s.fold);
    setNameOverflows(s.twinSays || s.clampCuts);
    if (!s.twinSays && !s.clampCuts && nameExpandedRef.current) {
      setNameExpanded(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useLayoutEffect(() => {
    applyNameSignals();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.id, character.name, compact]);
  useEffect(() => {
    const probe = nameMeasureRef.current;
    const real = nameRef.current;
    if ((!probe && !real) || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => {
      applyNameSignals();
    });
    // BOTH boxes are watched: the twin's height moves when the wrap count
    // changes; the REAL box's own box moves when its width does (a panel
    // resize the twin happens to absorb without a height change — e.g. a
    // wrap count that stays put while the clamp's cut appears — still
    // re-reads through the real element's observer).
    if (probe) ro.observe(probe);
    if (real) ro.observe(real);
    return () => ro.disconnect();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 1.1.2 — THE FONT-SETTLED RE-READ: the display face is a webfont — the
  // first measure can land in fallback metrics, and if the swap happens to
  // keep the twin's height unchanged (same line count in both faces) the
  // RO never fires. The fonts' own ready promise gets the last word.
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts?.ready?.then) return undefined;
    let alive = true;
    document.fonts.ready.then(() => {
      if (!alive) return;
      applyNameSignals();
    }).catch(() => {});
    return () => {
      alive = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.id, character.name, compact]);

  // 1.8.5 — THE PAYER (one formula, both directions — the seat's own
  // engine, and the heart of that version's tray law) — RETIRED IN 1.8.6
  // WITH THE SEAT IT WROTE (see THE SILENT ASCENT at the refs' tombstone):
  // its whole economy existed to hold the page's length stone-still through
  // a fold's flight, and a debt standing is exactly what the ascent can no
  // longer answer — the tray TWEENS on every road still (framer + the CSS's
  // own 0.24s flights, the 0.39.0 breath untouched), the page now shortens
  // WITH the fold and grows WITH the hand's roads, and the folded rest the
  // payer cached at its retire clock is measured by the settle effect below
  // instead (one honest read a settled breath after the fold lands).

  // 1.8.6 — THE FOLDED REST, MEASURED WHERE THE PAYER LEFT IT: the
  // between-band gate reads foldRestHRef, and the honest measure is the
  // tray zone's own height once the fold's flight has settled — read 420ms
  // after the flip (the same clock the payer's retire spoke), never
  // mid-flight (a mid-flight read would cache a half-open tray and the
  // between-band would stand down too long).
  useEffect(() => {
    if (!autoCollapsed) return undefined;
    const t = setTimeout(() => {
      const zone = rowsZoneRef.current;
      if (zone && zone.offsetHeight > 0) foldRestHRef.current = zone.offsetHeight;
    }, 420);
    return () => clearTimeout(t);
  }, [autoCollapsed]);

  // The scroll parent: in compact mode the scroller is App's wrapper
  // (.gd-tex-panel overflow-y-auto); in the full-window view it is this
  // component's own root. Check the root first, then walk up to the nearest
  // scrollable ancestor.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof document === 'undefined') return undefined;
    const isScroller = (el) => {
      const style = window.getComputedStyle?.(el);
      const oy = style?.overflowY || '';
      return oy === 'auto' || oy === 'scroll';
    };
    let scroller = null;
    if (isScroller(root)) {
      scroller = root;
    } else {
      let el = root.parentElement;
      while (el && el !== document.body) {
        if (isScroller(el)) {
          scroller = el;
          break;
        }
        el = el.parentElement;
      }
    }
    if (!scroller) return undefined;
    // 1.4.5 — THE FIRST DOWN MOTION FOLDS, SEEDED AT ATTACH ("when i scroll
    // down in full window detail or right detail panel, the tags/stamps
    // collapse later than usual, not on the first down motion but instead
    // when its midway, fix that"): TWO guards held the fold back.
    //   · The old `prev == null` arm — the listener's FIRST scroll event
    //     only seeded lastScrollRef and returned, so the fold waited for
    //     the second tick. The ref now seeds at ATTACH (the effect's own
    //     first line): the very first downward delta speaks.
    //   · The rows-zone :hover guard — a wheel scroll keeps the cursor
    //     where it rested, and the rows zone owns a broad slab of the
    //     upper panel; whenever the pointer happened to sit anywhere over
    //     it, the fold stayed armed OFF until the zone scrolled out from
    //     under the cursor — the "midway" delay exactly. The guard is
    //     RETIRED: the 0.38.0 law it claimed ("the cursor resting on the
    //     rows zone means the user is working there") only ever made sense
    //     for a DRAG, and a pointer drag over the sideways scrollers never
    //     fires this VERTICAL listener at all. The PIN keeps its own law
    //     ("an option on top next to the others that when turned on would
    //     always pin the stamp and the tag area").
    lastScrollRef.current = scroller.scrollTop;
    let wasDown = false;
    const onScroll = () => {
      const prev = lastScrollRef.current;
      lastScrollRef.current = scroller.scrollTop;
      const down = scroller.scrollTop - (prev == null ? scroller.scrollTop : prev) > 2;
      // 1.8.5 — THE JOURNEY'S START: recorded the tick the direction
      // turns downward — the road choice below needs to know where the
      // CURRENT downward journey began, not where the scroll sits now
      // (a journey that BEGAN at the top rides the flow road wherever
      // its first tick lands; one begun mid-page owes the hem).
      if (down && !wasDown) journeyStartRef.current = prev == null ? scroller.scrollTop : prev;
      wasDown = down;
      // 1.8.6 — THE SILENT ASCENT ("currently when i scroll up it opens the
      // tags/stamps , fix that so the scroll upwards wont affect so (the
      // tags/stamps collapse when scrolling down , thats correct and i love
      // how it is now , but when scrolling up , i dont want to have it
      // expand , instead expanding should just be manual by the user like
      // usual)"): the scroll speaks ONE direction now — DOWN. The 1.8.4 hem
      // (a debt outstanding was a geometric obligation: the seat's blank
      // band had to be paid back the moment the scroll rose above the loan)
      // and the 1.8.5 flow restore (the scroll rising back to the fold's own
      // origin re-opened the tray, the page growing back with the flight)
      // both RETIRE with the economy that bred them — no fold ever borrows
      // anymore, so no ascent ever owes, and an up-tick answers NOTHING:
      // the tray stays exactly as folded as the last down-tick left it,
      // until the HAND opens it (the chip below the folded plate, a row's
      // own label toggle, the pin, the panel's wake — see openTrayByHand).
      // The down-tick below keeps every word the owner loves: the journey's
      // start decides the gate (from the top it folds wherever the first
      // tick lands), and a mid-page journey stands down until the scroll
      // passes the tray's hem — the between-band's own 1.8.4 ground, kept
      // verbatim.
      if (!down) return; // THE SILENCE — the ascent is not the scroll's to answer
      // 1.4.7 — THE HOVER HOLD (see rowsHoverRef above): a downward scroll
      // with the pointer riding the rows tray or the name block folds
      // nothing — the rows keep their seat while the user is over them.
      if (rowsHoverRef.current) return;
      if (rowsPinned) return;
      const willFold = !(autoCollapsedRef.current === true) || nameExpandedRef.current === true;
      if (!willFold) return;
      // 1.8.5 — THE ROAD CHOICE, AND IN 1.8.6 THERE IS ONLY ONE ROAD ("when
      // scrolling down from top of the detail panel , the stamps/tags
      // doesnt collapse (i suspect you did something last version where it
      // doesnt effect the scroll , i want it to effect it when opeining and
      // closing but do it in a way that it doesnt look buggy when scrolling
      // like before i mean , and at the same time not how it is currently)"):
      //   · THE FLOW ROAD — the ONLY road: the page shortens WITH the
      //     flight and the content rises into the space the tray vacates
      //     ("it effects the scroll when opening and closing"), monotonic,
      //     never a snap-back (nothing is ever paid back late because
      //     nothing is ever paid at all). The 1.8.4 SEAT ROAD retired with
      //     the debt it held — a cover over content that never moves
      //     demands the loan the ascent can no longer return, and the
      //     owner's word settles the tie in the flow's favor.
      //   · THE BETWEEN-BAND (a journey begun mid-page, short of the hem):
      //     the attempt stands down — the 1.8.4 ground kept verbatim, where
      //     a fold would shove the reading content a full tray-height in
      //     one gesture. The next tick past the hem takes the road.
      const zone = rowsZoneRef.current;
      if (!zone) return;
      const dEst = Math.max(0, zone.offsetHeight - (foldRestHRef.current || 26));
      if (dEst < 4) return; // nothing to fold — a tray already at its plate
      const fromTop = (journeyStartRef.current == null ? prev : journeyStartRef.current) <= 32;
      if (!fromTop && scroller.scrollTop < dEst) return; // the between-band
      const nameWasOpen = nameExpandedRef.current === true;
      nameOpenAtFoldRef.current = nameWasOpen;
      // THE FOLD — one road: the state flips, framer + the CSS's own
      // tweens carry the flight, and the page shortens with it
      setAutoCollapsed((was) => (was ? was : true));
      // 1.0.7 — THE NAME FOLDS WITH THEM ("closes automatically when
      // scrolling"): the same downward scroll that folds the tag and stamp
      // rows retracts an expanded name back to its first two lines — one
      // gesture, one law, the whole header settling at once. Pinned is
      // pinned ("stays stuck when pinnned"): the pin holds the rows AND
      // the name open together. 1.8.5 — the name retracts on its own
      // 0.24s flight (the same breath the tray speaks — no direct paint,
      // no snap). 1.8.6 — its flight rides with the tray's through the
      // flow's own shortening (the page loses both heights together,
      // one monotonic give).
      setNameExpanded((was) => (was ? false : was));
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowsPinned]);

  // Any manual interaction with the rows clears the auto-fold — and ONLY
  // the auto-fold. 0.45.0 — THE EXPAND CHIP STOPPED FLATTENING THE ROWS
  // ("expanding the header of the detail panel automatically expands the
  // stamps and the tags, it shouldnt do that"): the old expandRows also
  // wrote { tags: false, stamps: false }, so a user who had collapsed a row
  // on its own label got BOTH rows thrown open the moment they unfolded the
  // header. Unfolding now restores exactly the rows the user left behind —
  // the per-row collapses ride straight through the fold.
  // 1.8.4 — THE COVER PAYS ITSELF BACK. 1.8.5 — THE PAYER PAYS IT DOWN.
  // 1.8.6 — THE HAND OPENS THE TRAY ITSELF (THE SILENT ASCENT's own other
  // half — see the refs' tombstone): with the ascent silent and no debt
  // ever standing, every manual road out of a fold — the chip below the
  // folded plate, a row's own label toggle, the pin, the panel's wake — is
  // just the state flipping open, and the tray TWEENS out on framer + the
  // CSS's own 0.24s flights while the PAGE GROWS BACK WITH IT ("it effects
  // the scroll when opening", the owner's own 1.8.5 word): the rows pour
  // back in, the content below pushing down exactly as it once rose — the
  // standard accordion breath, monotonic, never a snap. (The name the fold
  // swallowed returns with it; a manual retract clears the memory so the
  // name the owner retracted stays retracted.)
  const openTrayByHand = useCallback(() => {
    if (nameOpenAtFoldRef.current) {
      nameOpenAtFoldRef.current = false;
      setNameExpanded(true);
      setNameClamped(false);
    }
    setAutoCollapsed(false);
  }, []);
  const expandRows = useCallback(() => {
    // 1.8.4 — the chip is the first manual road out of a scroll-fold.
    // 1.8.6 — the hand's own road (see openTrayByHand): the page grows
    // back with the tray's own flight, exactly the fold's mirror.
    openTrayByHand();
  }, [openTrayByHand]);
  const toggleRowGuarded = useCallback(
    (key) => {
      // 1.8.4 — a label toggle clears the auto-fold too, so it is a manual
      // road out the same way. 1.8.6 — the hand's own road (see
      // openTrayByHand).
      openTrayByHand();
      toggleRow(key);
    },
    [toggleRow, openTrayByHand]
  );
  // 0.34.0 — NEW VERSION is a two-step now ("when creating a new version, it
  // doesnt first open the version manager with the new one, when i press
  // cancel it should cancel it and not create the new one, and when i press
  // on create it should create it"): pressing NEW VERSION opens the version
  // settings window on a DRAFT (nothing in the db yet) — CANCEL drops the
  // draft, CREATE lands it at the end of the strip and selects it.
  const [creatingVersion, setCreatingVersion] = useState(null);
  const [filesOver, setFilesOver] = useState(false);
  // 1.0.3 — THE EDIT CARD WINDOW LEFT THE VIEW: it now lives at App level
  // (lookRequest there renders <CardLookModal> directly), so this view no
  // longer keeps a lookOpen seat — the gear's EDIT CARD key simply asks App
  // through onEditCard, and the window pops over the panel, the grid or the
  // full-window view alike, without this view knowing anything about it.
  const [tab, setTab] = useState('prompts');
  // 1.6.3 — THE NOTES' OWN EXPAND ("alongside the note expand feature
  // too") — RETIRED in 1.6.4 ("notes should do the same [as the parts'
  // reader's window], also change their icons"): the in-place posture
  // (the well growing to the whole note) left with the parts' own. The
  // expand key opens the NOTES READER'S WINDOW below instead — the same
  // fade-in/fade-out Modal the parts speak, carrying the whole note as a
  // big readable page (read-only, its own COPY foot), its glyph Maximize2
  // like every expand key in the app now. View state only — the saved
  // note is the truth, every open starts windowless.
  // 1.6.7 — THE READER IS THE EDITOR NOW, AND THE COLOR RIDES BESIDE IT
  // ("you didnt update the expand button and wxpanded window for notes,
  // fix that, update the expanded window, update the expand button,
  // update the color picker to be in corner too, etc.."): the window
  // state keeps its seat (the name is the truth it always spoke — the
  // EXPANDED seat); what changed is what it opens (the big EDITOR, live
  // edits — see NotesEditorWindow) and the second seat beside it: the
  // notes' own COLOR window (NotesColorWindow), opened from the box's
  // corner chip — the parts' 1.5.2 law, joined by the notes at last.
  // View state only, both of them — every open starts windowless.
  const [notesReaderOpen, setNotesReaderOpen] = useState(false);
  // 1.8.6 — THE WHEEL THAT OUTLIVES THE FREEZE (the notes' own expand road —
  // the parts' key law joined verbatim, see PartEditor's pendingExpand): the
  // key darkens and its glyph swaps to the wheel while the big NOTES editor
  // window builds, and deferToPaint puts the wheel on screen BEFORE the
  // freeze so it keeps turning through it (the compositor's own seat).
  const [notesPending, setNotesPending] = useState(false);
  const openNotesWindow = () => {
    setNotesPending(true);
    deferToPaint(() => {
      setNotesReaderOpen(true);
      setNotesPending(false);
    });
  };
  const [notesColorOpen, setNotesColorOpen] = useState(false);
  // 1.6.7 — the notes row's COPY key's own confirmation clock (the parts'
  // law: the glyph swaps to the check for a beat, then returns).
  const [notesCopied, setNotesCopied] = useState(false);
  const notesCopiedTimer = useRef(0);
  // 0.38.0 — THE HUGE IMAGE VIEWER's seat. 0.42.0 — IT ANCHORS ON THE FILE,
  // NOT THE INDEX ("when updating the order of the images, dont change the
  // image thats on the right panel viewer … unless deleted then it would pick
  // another one and stick with it"): the state carries the image's FILE; the
  // rendered index is derived from wherever that file currently sits, so a
  // reorder never changes what's on screen. When the anchored file leaves the
  // set (deleted), an effect re-anchors on the first survivor — and sticks.
  const [viewer, setViewer] = useState(null); // { file }
  // 0.42.0 — THE REMOTE OPENER for the stage's IMAGE MANAGER (the huge
  // viewer's own menu asks for it): bumping the signal opens the manager.
  const [managerSignal, setManagerSignal] = useState(0);
  // 0.42.0 — THE VERSION STRIP'S OWN RIGHT-CLICK MENU ("allow right click
  // window to come over it to edit version details"): { x, y, id } while open.
  const [verCtx, setVerCtx] = useState(null);
  // 0.45.0 — THE PIN KEY'S OWN MENU ("on pin it would say pin header"): a
  // single action that mirrors the key's own press — pin/unpin the rows.
  // Painted through the same BODY-PORTALED GdContextMenu as the gear's menu,
  // so the sticky header's compositing layer can't skew its seat.
  const [pinCtx, setPinCtx] = useState(null);
  // 1.0.5 — THE TAGS ROW'S OWN MENU ("when i right click on the tags or
  // stamps it would give me the option to do their things … for tags its
  // opening the tag manager"): one action — the manager — painted through
  // the same body-portaled pill as the pin's.
  const [tagCtx, setTagCtx] = useState(null);
  // 0.42.0 — THE STICKY PREVIEW COLUMN'S OFFSET: the live height of the
  // sticky header (measured through a ResizeObserver — it grows and shrinks
  // with the tags / stamps rows), so the preview column can ride just under
  // it while the details scroll ("ensure that the preview image on the left
  // would scroll down and keep on screen").
  const headRef = useRef(null);
  const [headH, setHeadH] = useState(0);
  useEffect(() => {
    if (compact) return undefined;
    const el = headRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() =>
      // 1.8.4 — THE DEBT RIDES THE MEASURE — RETIRED IN 1.8.6 (THE
      // SILENT ASCENT): the column's pinned seat tracked the header's
      // RENDERED height PLUS whatever the seat held — through a scroll-fold
      // both changed by the same number in opposite directions (the header
      // released, the seat held), so the sum never moved and the preview
      // column never learned the tray left. With the seat retired the sum
      // IS the header alone — and through a flow-road fold the header's own
      // height tweens down while the page shortens beneath it, so the
      // column's pinned seat follows the header's live height frame by
      // frame (the RO's landing rides the same tween, never a snap — the
      // 1.8.3 one-frame-snap disease died with the one-frame fold).
      setHeadH(Math.round(el.offsetHeight))
    );
    ro.observe(el);
    return () => ro.disconnect();
     
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact]);

  // 0.31.0 — THE CARD-COLUMN SEPARATOR ("add a separator between the image
  // preview and the prompt/notes so i can resize the separator between the
  // two"): a 9px ew-resize strip on the boundary between the card column
  // and the merged details column. The drag anchors on the REACT-apPLIED
  // width (the setting), writes the live px STRAIGHT to the column node
  // (zero re-renders per frame — the panel-width trick), and commits ONE
  // onCardColWidth on release so undo replays the resize. Compact (the
  // right panel) never shows it — its column is the panel's own width.
  const cardColRef = useRef(null);
  const cardDragRef = useRef(null);
  const [cardLive, setCardLive] = useState(false);
  const onSepDown = (e) => {
    if (compact) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const col = cardColRef.current;
    if (!col) return;
    const startW = Math.round(Number(cardColWidth) || CARD_COL_WIDTH_RANGE.default);
    cardDragRef.current = { startX: e.clientX, startW, pointerId: e.pointerId, w: startW };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    document.body.classList.add('gd-resizing');
    setCardLive(true);
    e.preventDefault();
  };
  const onSepMove = (e) => {
    const drag = cardDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    // The ceiling keeps the details column alive: the tree (up to 400px) +
    // the details' own 340px minimum always stay satisfiable — below that
    // the merged column would rather WRAP than starve, but a card column
    // eating the whole window reads broken, so clamp anyway.
    const vw = (typeof window !== 'undefined' && window.innerWidth) || 1280;
    const ceiling = Math.max(CARD_COL_WIDTH_RANGE.min, vw - 680);
    const w = Math.round(
      Math.max(CARD_COL_WIDTH_RANGE.min, Math.min(Math.min(CARD_COL_WIDTH_RANGE.max, ceiling), drag.startW + dx))
    );
    drag.w = w;
    if (cardColRef.current) cardColRef.current.style.width = `${w}px`;
  };
  const onSepUp = (e) => {
    const drag = cardDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    cardDragRef.current = null;
    document.body.classList.remove('gd-resizing');
    setCardLive(false);
    if (drag.w != null && Math.round(drag.w) !== Math.round(drag.startW)) {
      onCardColWidth?.(Math.round(drag.w));
    } else if (cardColRef.current) {
      cardColRef.current.style.width = `${Math.round(drag.startW)}px`;
    }
  };

  const versions = character?.versions || [];
  const previewVersion = useMemo(() => getPreviewVersion(character), [character]);

  const version = useMemo(() => {
    const explicit = versions.find((v) => v.id === selectedVersionId);
    if (explicit) return explicit;
    if (previewVersion) return previewVersion;
    return versions[0] || null;
  }, [versions, selectedVersionId, previewVersion]);

  // 0.34.0 — OPEN ON THE TOP VERSION ("when opening a card, ensure it opens
  // on the top version, not on the last selected version"). 1.0.6 — "TOP"
  // NOW MEANS THE CARD'S OWN FACE ("fix the issue where opening a card
  // always opens on the first version instead of the top version"): the
  // grid fronts every card with its CARD-COVER version (the star — or the
  // newest one when no cover is crowned), and opening the card used to land
  // on versions[0] — the OLDEST slot — so the pictures you saw were rarely
  // the picture that led you to click. The switch now seats the selection
  // on getPreviewVersion's answer: the cover if one wears the star, else
  // the newest; the raw first slot is only the last resort when the card
  // has neither. What fronted the card in the grid is what opens.
  useEffect(() => {
    setSelectedVersionId(previewVersion?.id ?? character?.versions?.[0]?.id ?? null);
    setEditingVersionId(null);
    setCreatingVersion(null);
     
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character?.id]);

  // Lift the active version id so the bottom output bar can follow along.
  useEffect(() => {
    onActiveVersion?.(character?.id || null, version?.id || null);
  }, [character?.id, version?.id, onActiveVersion]);

  const patchVersion = useCallback(
    (patch, coalesceKey = null) => {
      if (!version || !character) return;
      patchCharacter(
        character.id,
        (c) => ({
          ...c,
          versions: c.versions.map((v) => (v.id === version.id ? { ...v, ...(typeof patch === 'function' ? patch(v) : patch) } : v)),
        }),
        coalesceKey
      );
    },
    [character, patchCharacter, version?.id]
  );

  const setParts = useCallback((parts, coalesceKey = null) => patchVersion({ parts }, coalesceKey), [patchVersion]);
  const setNotes = useCallback((notes) => patchVersion({ notes }, `notes:${version?.id}`), [patchVersion, version?.id]);
  // 1.6.7 — THE NOTES' OWN CONTAINER COLOR ("update the color picker to be
  // in corner too"): the same live patch road the notes' text speaks,
  // carrying the box's own hex (null = the theme's frame). The
  // NotesColorWindow's every swatch press lands here.
  // 1.6.8 — THE SHADE RIDES WITH IT (the color window's LIGHT/DARK dial,
  // the parts' own law joined): 'deep' asks the wash to speak at full
  // weight; null keeps the classic light veil.
  const setNotesColor = useCallback(
    (color, shade) =>
      patchVersion(
        { notesColor: color || null, notesColorShade: shade === 'deep' ? 'deep' : null },
        `notesColor:${version?.id}`
      ),
    [patchVersion, version?.id]
  );
  // 1.6.7 — the notes row's COPY key (the parts' content pair, joined):
  // the whole note to the clipboard with the self-confirming beat.
  const copyNotes = useCallback(async () => {
    const text = String(version?.notes || '');
    if (!text.trim()) return;
    try {
      if (window.api?.clipboardWriteText) await window.api.clipboardWriteText(text);
      else throw new Error('no clipboard');
      setNotesCopied(true);
      if (notesCopiedTimer.current) clearTimeout(notesCopiedTimer.current);
      notesCopiedTimer.current = setTimeout(() => setNotesCopied(false), 1600);
      onStatus?.('Notes copied');
    } catch {
      onStatus?.('Copy failed', 'fail');
    }
  }, [version?.notes, onStatus]);

  // 0.34.0 — NEW VERSION, the two-step: the draft is only a local object
  // until CREATE commits it. CANCEL (or closing the window) throws it away
  // without touching the database.
  const addVersion = () => {
    setCreatingVersion(makeVersion(versions));
  };

  const createVersionNow = (patch) => {
    const draft = creatingVersion;
    if (!draft) return;
    const next = { ...draft, ...(patch || {}) };
    // 1.1.5 — THE NEW VERSION TAKES THE STAR ("when creating a new version
    // for a card, the new version should become the default cover"): the
    // card used to keep whatever cover it wore (an explicit star never
    // moved, and with no star the newest-by-birth fallback only won ties),
    // so a card pinned to its first look never fronted the version you just
    // built. The fresh version now rides the commit wearing the star
    // (previewVersionId lands on ITS id), so the grid, the panel's header
    // and the open-on-top law all front the new art the moment it exists.
    // Un-starring later (the strip's menu / the settings key) still speaks,
    // and deleting the starred version falls back exactly as before.
    patchCharacter(character.id, (c) => ({ ...c, versions: [...c.versions, next], previewVersionId: next.id }));
    setSelectedVersionId(next.id);
    setCreatingVersion(null);
    onStatus(`${stripRichText(next.label) || 'Version'} added`);
  };

  const moveVersion = (dir) => {
    if (!editingVersionId) return;
    patchCharacter(character.id, (c) => {
      const list = [...c.versions];
      const i = list.findIndex((v) => v.id === editingVersionId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return c;
      const [moved] = list.splice(i, 1);
      list.splice(j, 0, moved);
      return { ...c, versions: list };
    });
  };
  // ---- versions: drag to reorganize ----------------------------------------
  // 0.37.0 — THE VERSION STRIP IS SORTABLE. 0.38.0 — TWO LAWS:
  //   · the drop target is the nearest INSERTION GAP (the useThumbSort
  //     geometry rework) — no more overmove/undermove-then-snap;
  //   · "the add new version can also move if needed": the NEW VERSION key
  //     rides the strip as a TRAILING sort item — and a plain click still
  //     creates the version (the sort's 5px move threshold separates a click
  //     from a grab), while dragging it just settles home.
  // 0.41.0 — THE KEY IS A SENTINEL, NOT A SEAT ("it allows me to rearrange
  //     it AFTER the add new version button, it shouldn't do that"): the
  //     strip passes maxInsert = the LAST VERSION's slot, so no chip can
  //     ever target a gap past the key — the key never glides aside and no
  //     drop can land behind it. The engine's insertion-index fix (see
  //     useThumbSort) also killed the one-slot-past overmove that made every
  //     rightward reorder "offset too much".
  const verStripRef = useRef(null);
  // 1.6.9 — THE NEW VERSION KEY'S OWN SEAT (see the FLIP effect below): the
  // trailing key's element + its last CONTENT-SPACE x (viewport x plus the
  // strip's own scrollLeft, so the strip's centering scroll never reads as
  // a move).
  const verKeyRef = useRef(null);
  const verKeyPrevXRef = useRef(null);
  const verCount = versions.length + 1; // versions + the NEW VERSION key
  const verSort = useThumbSort({
    count: verCount,
    cols: 1,
    gapX: 10,
    // 0.40.0 — the strip's REAL row gap (gap-2.5 both axes): the width-
    // aware glide simulates the wrapped layout with these, and the old 8px
    // default sat the second row 2px off where the reflow lands.
    gapY: 10,
    useGeometry: true,
    containerRef: verStripRef,
    dragButtons: true,
    // 0.41.0 — drops may land at most on the LAST VERSION's slot: the NEW
    // VERSION key stays pinned at the end, never glides, never takes a
    // chip behind it.
    maxInsert: versions.length,
    onTap: (i) => {
      // 0.39.0 — THE TRAILING KEY IS THE NEW-VERSION KEY ("add new version
      // button isnt working"): the sort's pointer capture on the wrapper
      // swallows the BUTTON's own click (a click only fires when the press
      // and the release land on the same element — capture retargets the
      // release), so the trailing slot's tap IS the button press now.
      if (i >= versions.length) {
        addVersion();
        return;
      }
      const v = versions[i];
      if (v) setSelectedVersionId(v.id);
    },
    onCommit: (from, to) => {
      if (from >= versions.length) return; // the NEW VERSION key — not data
      // `to` is the chip's FINAL index (0.41.0) — already clamped to at most
      // the last version's slot by maxInsert, so the strip's own guard is a
      // belt-and-suspenders now.
      const target = Math.min(to, versions.length - 1);
      if (from === target) return;
      patchCharacter(character.id, (c) => {
        const list = [...c.versions];
        const [moved] = list.splice(from, 1);
        list.splice(target, 0, moved);
        return { ...c, versions: list };
      });
      onStatus('Versions reordered');
    },
  });

  // 1.1.8 — THE STRIP'S SIDEWAYS SEAT ("versions will work differently…
  // add a left and right arrow with a fade, pressing on left will scroll
  // left, right will scroll right, allow sideways scrolling but the right
  // and left button will allow for more controlled left and right
  // movement"): the strip is ONE scrolling row now — native sideways
  // scrolling (wheel / drag / bar) plus the edge arrows + fades whenever
  // the row overflows its first row's worth of width. The hook watches the
  // scroller's edges; the arrows nudge by ~three-quarters of the visible
  // width per press.
  const activeVerId = version?.id || null;
  const verEdges = useFlowEdges(verStripRef, true, [versions.length, activeVerId, character.id]);
  // 1.7.0 — THE STRIP'S OWN BAR BREATHES (see useScrollbarBreath +
  // @property --gd-sb in index.css): the versions scrollbar appears the
  // moment a card's versions outgrow the strip's width and vanishes on
  // the switch to a shorter card — the row used to take (or hand back)
  // the 10px gutter in one frame, and the whole panel's content rode the
  // jump. The bar now grows and shrinks through its own 0.18s tween and
  // the content takes its place frame by frame — the flip the report
  // names, spoken as motion.
  useScrollbarBreath(verStripRef, 'x', [versions.length, activeVerId, character.id]);
  /* 1.9.6 — THE PANEL'S OWN BAR BREATHES ("when switching between cards ,
     the scrollbars if transitioning (aka if the card they are switching to
     invalidates them , whether its low amount to alot of amount or high
     amount to low amount) it should not just snap the items in the side
     pannel , it should expand smoothly or retract smoothly simmilar to the
     fade and right and left buttons"): the ROOT scroller — the whole
     side panel's own vertical bar — joins the family the version strip
     already speaks (1.7.0). Switching cards swaps the panel's whole
     content height in one render; the bar used to take (or hand back)
     its 10px gutter in a single frame and every row under the sticky
     header SNAPPED sideways with it. The bar grows and shrinks through
     its own 0.18s tween now and the content takes its place frame by
     frame — the same breath the fades and the strip's own arrows ride.
     The hook's content observer (its own 1.9.6 law) hears every driver
     the deps could forget; the deps below carry the honest swappers. */
  useScrollbarBreath(rootRef, 'y', [character.id, activeVerId, tab, versions.length]);

  // 1.1.8 — AND THE ACTIVE CHIP CENTERS ITSELF ("ensure that when opening
  // the details panel that it will automatically scroll to the active
  // version"): on every mount (the panel opening IS a mount), card swap,
  // and selection change, the strip centers the ACTIVE chip in one frame —
  // the version you are on is always on stage, never lost past the edge.
  useLayoutEffect(() => {
    const strip = verStripRef.current;
    if (!strip) return undefined;
    let raf = 0;
    const center = () => {
      raf = 0;
      const idx = versions.findIndex((v) => v.id === activeVerId);
      if (idx < 0) return;
      const chip = strip.children[idx];
      if (!chip) return;
      const r = chip.getBoundingClientRect();
      const s = strip.getBoundingClientRect();
      const drift = Math.round(r.left + r.width / 2 - (s.left + s.width / 2));
      if (drift) strip.scrollLeft += drift;
    };
    raf = (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : setTimeout)(center);
    return () => {
      if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
      else if (raf) clearTimeout(raf);
    };
  }, [character.id, activeVerId, versions.length]);

  // 1.6.9 — THE NEW VERSION KEY GLIDES BETWEEN ITS SEATS ("in the card fade
  //   feedback, ensure to animate the new version button to go left or
  //   right depending on where its gonna be positioned in the next card"):
  //   the strip's trailing key never faded with the switch feedback (the
  //   1.6.8 law kept every BUTTON solid), but its SEAT moves with every
  //   card — a two-version card seats the key right beside the chips, a
  //   five-version card parks it far right, and on every switch it
  //   TELEPORTED between those seats while everything around it breathed.
  //   The key FLIPs now: after any commit that moves it (a card switch, a
  //   version born or deleted), the key starts painted at its OLD
  //   content-space x and glides to the new one on the same 0.15s ease the
  //   swap flight speaks — left when the new card's strip is shorter,
  //   right when it is longer, exactly the direction the request named. The
  //   measure is scroll-invariant (x + scrollLeft) so the strip's own
  //   centering scroll never masquerades as a move, and a drag's own
  //   transforms are never touched (the FLIP only reads layout, and the
  //   sort never re-seats the trailing key).
  const verKeyFlipRafRef = useRef(0);
  useLayoutEffect(() => {
    const strip = verStripRef.current;
    const key = verKeyRef.current;
    if (!strip || !key) return;
    // 1.6.9 — THE SEAT IS TRANSFORM-BLIND (measured live: the first cut read
    //   getBoundingClientRect, whose box carries any live FLIP transform —
    //   and a switch commits TWICE (the character id, then the active
    //   version id), so the second run measured the key THROUGH the first
    //   run's transform, recorded the wrong seat, and flipped from it; the
    //   next commit flipped from THAT, and the error COMPOUNDED with every
    //   pass (measured live: -67, +67, -134, +201 … a growing oscillation
    //   arriving at +413px on a 67px move). offsetLeft is the LAYOUT seat —
    //   transform-blind by construction (the same law the drag ghost's
    //   offsetWidth box spoke in 1.6.0) and scroll-blind besides (an
    //   in-scroller offset never reads the strip's own pan).
    //   A pending FLIP from an earlier commit in the same breath dies
    //   first — only one glide may own the key.
    if (verKeyFlipRafRef.current) {
      (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : clearTimeout)(verKeyFlipRafRef.current);
      verKeyFlipRafRef.current = 0;
    }
    const x = key.offsetLeft;
    const prev = verKeyPrevXRef.current;
    verKeyPrevXRef.current = x;
    if (prev == null || Math.abs(x - prev) < 0.5) return;
    if (verSort.sorting) return; // a live drag owns the key's transform
    // FLIP: paint at the old seat, then glide home
    key.style.transition = 'none';
    key.style.transform = `translateX(${Math.round(prev - x)}px)`;
    verKeyFlipRafRef.current = (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : setTimeout)(() => {
      verKeyFlipRafRef.current = 0;
      key.style.transition = 'transform 0.15s ease-out';
      key.style.transform = '';
      setTimeout(() => {
        if (key.style.transition === 'transform 0.15s ease-out') {
          key.style.transition = '';
        }
      }, 200);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.id, activeVerId, versions.length, compact]);
  useEffect(
    () => () => {
      if (verKeyFlipRafRef.current && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(verKeyFlipRafRef.current);
      }
    },
    []
  );

  // 0.42.0 — DELETE + COVER ARE ADDRESSABLE BY VERSION now: the strip's own
  // right-click menu deletes / covers ANY version without selecting it
  // first ("i cant set a version to being the cover unless i literally
  // select it then open settings … fix that so i could"), and the settings
  // window's COVER key acts on the version being EDITED, never the one being
  // VIEWED underneath.
  const deleteVersionNow = (vId) => {
    const victim = versions.find((v) => v.id === vId);
    if (!victim) return;
    patchCharacter(character.id, (c) => ({
      ...c,
      versions: c.versions.filter((v) => v.id !== vId),
      previewVersionId: c.previewVersionId === vId ? null : c.previewVersionId,
    }));
    /* 1.7.5 — THE DEATH ROW TAKES THE FILES (see utils/imageDeaths.js —
       the "undo restores a broken image" cure): the unlinks wait until
       no snapshot can resurrect the version, so an undone delete brings
       every picture back WHOLE. */
    (victim.images || []).forEach((img) => markImageDead(img.file));
    if (selectedVersionId === vId) setSelectedVersionId(null);
    if (editingVersionId === vId) setEditingVersionId(null);
    onStatus('Version deleted');
  };

  const deleteVersion = (vId) => {
    const target = vId || editingVersionId;
    const victim = versions.find((v) => v.id === target);
    if (!victim) return;
    confirm({
      title: 'DELETE VERSION',
      message: `Delete "${stripRichText(victim.label)}" with its ${victim.images.length} image(s) and ${victim.parts.length} part(s)? This cannot be undone.`,
      confirmLabel: 'DELETE',
      danger: true,
      onConfirm: () => deleteVersionNow(target),
    });
  };

  // 0.42.0 — the cover toggle for ANY version (the edited one, the
  // right-clicked one) — the old wired-to-the-VIEWED-version toggle is
  // exactly why the cover could only be set on the version you were
  // currently looking at.
  const togglePreviewFor = (v) => {
    if (!v) return;
    patchCharacter(character.id, {
      previewVersionId: character.previewVersionId === v.id ? null : v.id,
    });
  };

  // ---- images: browse -----------------------------------------------------
  const addImagesFromFiles = async () => {
    if (!version) return;
    const records = await window.api.importImagesFromFiles();
    if (records?.length) {
      patchVersion((v) => ({ ...v, images: [...v.images, ...records.map(imageRecord)] }));
      onStatus(`${records.length} image${records.length === 1 ? '' : 's'} added`);
    }
  };

  const setCover = (index) => {
    patchVersion((v) => {
      const imgs = [...v.images];
      const [picked] = imgs.splice(index, 1);
      return { ...v, images: [picked, ...imgs] };
    });
    onStatus('Cover updated');
  };

  const deleteImage = (index) => {
    const img = version?.images?.[index];
    if (!img) return;
    patchVersion((v) => ({ ...v, images: v.images.filter((_, i) => i !== index) }));
    /* 1.7.5 — THE DEATH ROW TAKES THE FILE (see utils/imageDeaths.js — the
       "when undoing when i delete an image, the image comes back broken"
       cure): the unlink waits until no snapshot can resurrect the record,
       so Ctrl+Z restores the picture WHOLE — the file never left the disk
       while the undo stack still spoke its name. */
    markImageDead(img.file);
    onStatus('Image deleted');
  };

  // 1.7.4 — THE VIEWER'S OWN DELETE ("account for arranging and deleting
  // images while in huge preview"): the huge preview's menu can delete the
  // picture on screen — the ask rides the OVER-ALL lane (above this 900
  // veil and any 920 manager that happens to be open over it), and the
  // anchor effect above walks the view to the nearest survivor (an emptied
  // set closes the viewer onto the stage's "No images yet" seat).
  const askDeleteViewerImage = (i) => {
    const img = version?.images?.[i];
    if (!img) return;
    confirm({
      title: 'DELETE IMAGE',
      message: `Delete image ${i + 1} of ${version.images.length} from this version? This cannot be undone.`,
      confirmLabel: 'DELETE',
      danger: true,
      overAll: true,
      onConfirm: () => deleteImage(i),
    });
  };

  // Drag a filmstrip thumb onto another slot — reorder the version's images.
  const reorderImages = useCallback(
    (from, to) => {
      patchVersion((v) => {
        const imgs = [...v.images];
        const [moved] = imgs.splice(from, 1);
        imgs.splice(to, 0, moved);
        return { ...v, images: imgs };
      });
      onStatus('Images reordered');
    },
    [patchVersion, onStatus]
  );

  // ---- images: paste (ALL image items, not just the first) ----------------
  useEffect(() => {
    const onPaste = async (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const items = Array.from(e.clipboardData?.items || []).filter((it) => it.type && it.type.startsWith('image/'));
      if (!items.length) {
        // 0.32.0 — no bitmap items: an image FILE copied in the OS file
        // manager never reaches clipboardData — the main-process reader
        // (multi-strategy: bitmaps, copied files, the raw PNG format) gets
        // the last word, quietly.
        let record = null;
        try {
          const img = await window.api?.clipboardReadImage?.();
          if (img?.base64) record = (await window.api.saveImageBuffer(img.base64, img.ext || '.png')) || null;
        } catch {
          record = null;
        }
        if (record) {
          patchVersion((v) => ({ ...v, images: [...v.images, { file: record.file, thumb: record.thumb }] }));
          onStatus('Image pasted');
        }
        return;
      }
      e.preventDefault();
      let added = 0;
      for (const item of items) {
        const blob = item.getAsFile();
        if (!blob) continue;
        try {
          // 0.33.0 — the renderer's own canvas thumb (all formats).
          const rec = await saveImageBlobWithThumb(blob);
          if (rec) {
            patchVersion((v) => ({ ...v, images: [...v.images, imageRecord(rec)] }));
            added += 1;
          }
        } catch {
          /* skip unreadable item */
        }
      }
      if (added) onStatus(`${added} image${added === 1 ? '' : 's'} pasted`);
    };
    // 0.30.0 — the app-level PASTE (context menu / manual key) hands its
    // record over as a gd-paste-image event (App owns the clipboard read,
    // this view owns the version's images).
    const onPasteEvent = (e) => {
      const rec = e?.detail;
      if (rec?.file) {
        patchVersion((v) => ({ ...v, images: [...v.images, imageRecord(rec)] }));
      }
    };
    window.addEventListener('paste', onPaste);
    window.addEventListener('gd-paste-image', onPasteEvent);
    return () => {
      window.removeEventListener('paste', onPaste);
      window.removeEventListener('gd-paste-image', onPasteEvent);
    };
  }, [patchVersion, onStatus]);

  // ---- images: drag & drop from the OS -------------------------------------
  // 0.33.0 — the extension sniffing moved into saveImageBlobWithThumb
  // (helpers): every dropped file rides the renderer's own 480px canvas
  // thumb, so no format falls back to a full-quality grid decode.

  const handleFilesDrop = async (e) => {
    const files = Array.from(e.dataTransfer?.files || []).filter((f) => f && (f.type?.startsWith('image/') || /\.(png|jpe?g|jfif|webp|gif|bmp|avif|tiff?|svg|ico)$/i.test(f.name || '')));
    if (!files.length) return;
    e.preventDefault();
    setFilesOver(false);
    let added = 0;
    for (const file of files) {
      try {
        // 0.33.0 — the renderer's own canvas thumb (all formats).
        const rec = await saveImageBlobWithThumb(file);
        if (rec) {
          patchVersion((v) => ({ ...v, images: [...v.images, imageRecord(rec)] }));
          added += 1;
        }
      } catch {
        /* skip unreadable file */
      }
    }
    if (added) onStatus(`${added} image${added === 1 ? '' : 's'} dropped in`);
    else onStatus('Drop failed', 'fail');
  };

  const editingVersion = versions.find((v) => v.id === editingVersionId) || null;
  const editingIndex = versions.findIndex((v) => v.id === editingVersionId);

  // 0.42.0 — THE VIEWER'S FILE ANCHOR (see the state note): derive the index
  // from the anchored file, and when the file itself leaves the set (the
  // image was deleted) re-anchor on a survivor — the view keeps showing
  // SOMETHING, then sticks to it through every later reorder. An empty set
  // closes the viewer outright (the stage's own "No images yet" empty state
  // is the terminal truth — the casual seat, exactly as the manager's).
  // 1.7.4 — THE SURVIVOR IS THE NEAREST ONE, NOT THE FIRST ("if no images to
  // be displayed, go to a valid image in the version, if none exists then
  // just show the casual no images yet"): the old law re-anchored on
  // images[0] — the COVER — every time, so deleting the last picture of a
  // twelve-image set threw the view across the room to the first slot. The
  // stage's own stick law (ImageStage) pins the nearest survivor; the
  // viewer speaks the same law now: the image the deleted one WOULD have
  // slid into (clamped to the set's ends) takes the seat, and only an
  // emptied set closes the viewer. The previous list rides a ref the
  // effect refreshes each pass (the liveRef pattern) — the pre-deletion
  // index is the one thing the new list cannot know.
  const viewerPrevImagesRef = useRef([]);
  const viewerFile = viewer?.file || null;
  const viewerIndex = useMemo(() => {
    if (!viewerFile || !version) return 0;
    return Math.max(0, version.images.findIndex((im) => im.file === viewerFile));
  }, [viewerFile, version]);
  useEffect(() => {
    if (!viewer) {
      viewerPrevImagesRef.current = [];
      return;
    }
    const imgs = version ? version.images : [];
    if (!imgs.length) {
      setViewer(null);
      viewerPrevImagesRef.current = [];
      return;
    }
    if (!imgs.some((im) => im.file === viewer.file)) {
      const prevIdx = viewerPrevImagesRef.current.findIndex((im) => im.file === viewer.file);
      const next = Math.max(0, Math.min(prevIdx > -1 ? prevIdx : 0, imgs.length - 1));
      setViewer({ file: imgs[next].file });
    }
    viewerPrevImagesRef.current = imgs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version?.images, viewer]);

  // 0.42.0 — THE VERSION STRIP'S OWN MENU ("allow right click window to come
  // over it to edit version details"): edit, cover and delete speak the
  // RIGHT-CLICKED version, no selection required.
  const verCtxItems = (vId) => {
    const v = versions.find((x) => x.id === vId);
    if (!v) return [];
    const isPrev = previewVersion?.id === v.id;
    return [
      { id: 'hdr', header: `VERSION: ${stripRichText(v.label) || 'EDIT'}` },
      { id: 'edit', label: 'Edit version details', icon: Pencil, onPick: () => setEditingVersionId(v.id) },
      {
        id: 'cover',
        label: isPrev ? 'Cover version (already set)' : 'Set as cover version',
        icon: Star,
        disabled: isPrev,
        onPick: () => togglePreviewFor(v),
      },
      { id: 'sep', separator: true },
      { id: 'delete', label: 'Delete version', icon: Trash2, danger: true, onPick: () => deleteVersion(v.id) },
    ];
  };

  // 1.0.3 — the cover channel left with the EDIT CARD window (it now
  // computes its own cover in App.jsx — see the lookRequest mount there).

  if (!character) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <span className="gd-empty-mark">✖</span>
        <span className="text-[11px] tracking-[0.2em] text-gd-mute uppercase">Card not found</span>
        <button className="gd-btn" onClick={onBack}>
          <ArrowLeft size={13} />
          BACK TO GRID
        </button>
      </div>
    );
  }

  const pad = compact ? 'px-4' : 'px-6';

  // 0.30.0 — the PROMPTS / NOTES card as a variable: compact stacks it under
  // the stage (the old single column); the full-window view parks it in the
  // MERGED details column beside the card ("first column the card, the other
  // two merge to be the prompt details, the notes, and so on").
  const promptCard = version ? (
    <div className="gd-card p-4">
      <div className="flex items-center gap-1.5">
        <button
          className={clsx('gd-btn', tab === 'prompts' && 'gd-btn-accent')}
          title="Prompt parts for this version"
          onClick={() => setTab('prompts')}
        >
          PROMPTS
        </button>
        <button
          className={clsx('gd-btn', tab === 'notes' && 'gd-btn-accent')}
          title="Free-form notes for this version"
          onClick={() => setTab('notes')}
        >
          <NotebookText size={12} />
          NOTES
        </button>
      </div>

      {/* 1.9.11 — THE TAB'S OWN FLIGHT ("when switching between prompt and
          note, it just happens instantly and appears, fix that so it has a
          transition animation, from prompt to note and from note to
          prompt" + "prompts have a fade move animation when they spawn, i
          want the note to also have that animation"): the swap used to be
          a hard cut — the ternary re-rendered the other subtree in one
          frame, no beat at all. Both panels now ride the prompts' OWN
          spawn law (gd-rise-in — the same 0.18s fade-and-rise a fresh
          part row speaks) on a KEYED wrapper: the key forces a real
          remount on every tab flip, so the incoming panel — the
          PartEditor stack on the way to PROMPTS, the notes box on the
          way to NOTES — fades in and rises its 10px exactly like a
          spawning prompt, in BOTH directions. The outgoing panel leaves
          with the same hard cut the app's card-switch ceremony always
          spoke (gd-cv-swap's own law: the fade rides the ARRIVING
          content — one beat, never two), and the first mount rides the
          same entrance so the card opens speaking the flight too. The
          note's OWN spawn is this same law — the notes box appears
          through the prompts' own animation, the exact ask. */}
      {tab === 'prompts' ? (
        <div key="gd-tab-prompts" className="mt-3 gd-rise-in">
          {/* 0.32.0 — confirm rides down to the part rows: the DELETE key
              asks first now, like every other delete in the app.
              1.6.3 — onStatus rides down with it (the part rows' COPY key
              speaks its verdict through the app's own status voice). */}
          <PartEditor parts={version.parts} onSetParts={setParts} showHelp={showHelp} plain confirm={confirm} onStatus={onStatus} />
        </div>
      ) : (
        <div key="gd-tab-notes" className="mt-3 gd-rise-in">
          {/* 1.6.7 — THE NOTES JOIN THE PARTS' CONTAINER LAW ("you didnt
              update the expand button and wxpanded window for notes, fix
              that, update the expanded window, update the expand button,
              update the color picker to be in corner too, etc.."): the
              loose label + bare well become a FRAMED CONTAINER speaking
              the parts' own sticker language (.gd-part-row — the ink
              frame, the shape radius, the grounded shadow), so the notes
              read as a real object on the card instead of loose text —
              and the corner CHIP (.gd-part-color-chip, the 1.5.2 seat)
              pins to the box's bottom-right exactly like every part row:
              filled = the color the frame wears, hollow + dashed = the
              theme's own. The keys pair rides the label line — COPY +
              EXPAND, the parts' content pair (the expand key the full
              gd-icon-btn now, the same framed key every part speaks —
              the old 22px ghost retired), and the chip's press opens the
              notes' own COLOR WINDOW (the ladder, live picks). The
              textarea keeps its well voice and its 8-row stance; the
              is-colored wash tints the frame alone, never the text. */}
          <div
            className={clsx(
              'gd-part-row gd-notes-box',
              version.notesColor && 'is-colored',
              version.notesColorShade === 'deep' && 'is-shade-deep'
            )}
            data-part-color={version.notesColor || undefined}
            /* 1.7.1 — THE NOTES BOX GETS THE FACE LAW TOO ("also you forgot
               the notes container too"): the 1.7.0 pass threaded
               --part-face/--part-ink at the part rows, the part stage and
               the notes STAGE — but this box, the notes' own container on
               the card, kept threading --part-color alone, so its face
               fell to the 1.6.x theme washes (the color mixed into the
               panel, the pale veil the 1.7.0 report retired) and its
               title cap kept the theme's mute while the box spoke the
               color. The box now speaks partContainerFace exactly like
               every part row: the color's own aspective face, the face's
               ink, and the --part-well depth rung its textarea + cap
               read (see .gd-part-row.is-colored .gd-notes-cap in
               index.css) — the notes read as one more colored container
               on the card, the same neumorphic ladder the prompts
               speak. */
            style={
              version.notesColor
                ? {
                    ['--part-color']: version.notesColor,
                    ...(partContainerFace(version.notesColor, version.notesColorShade === 'deep') || {}),
                  }
                : undefined
            }
          >
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center justify-between gap-2">
                <span className="gd-notes-cap text-[9px] font-bold tracking-[0.2em] uppercase">
                  FREE-FORM NOTES
                </span>
                {/* 1.8.3 — THE NOTES' KEYS JOIN THE FRAME ("the buttons for
                    the note (aka copy and expand) arent clear , they dont
                    have a button style , fix that, by making them have the
                    same style as the prompt buttons on the right except
                    the notes one are on top as they are currently"): the
                    pair rode the base ghost alone — a transparent face and
                    no border on the label line, keys the framed container
                    never framed — because the parts' framed key law lives
                    under .gd-part-keys, a seat this pair never had (the
                    1.6.7 note CLAIMED the framed key; the scope never
                    reached it). The wrapper speaks the notes' own key lane
                    now (.gd-notes-keys in index.css — the parts' framed law
                    verbatim, a HORIZONTAL lane seated on the label line
                    where the pair already rides), and the colored twin
                    rides with it: a colored notes box gets keys in its own
                    color's family exactly like the parts' keys at their
                    right rail. */}
                <div className="gd-notes-keys">
                  <button
                    className={clsx('gd-icon-btn', notesCopied && 'is-copied')}
                    title={notesCopied ? 'Copied ✓' : 'Copy the notes to the clipboard'}
                    disabled={!String(version.notes || '').trim()}
                    onClick={copyNotes}
                  >
                    {notesCopied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
                  </button>
                  {/* the EXPAND key — the parts' own law: the framed key,
                      Maximize2 the glyph of the window it opens (the big
                      EDITOR now — NotesEditorWindow below).
                      1.8.6 — THE WHEEL THAT OUTLIVES THE FREEZE (see
                      notesPending above): the wheel replaces the glyph
                      while the window builds, the key darkened as pressed. */}
                  <button
                    className={clsx('gd-icon-btn', notesPending && 'is-loading')}
                    title="Expand: open the notes in the big editor window"
                    onClick={openNotesWindow}
                  >
                    {notesPending ? <span className="gd-wheel" aria-hidden /> : <Maximize2 size={12} />}
                  </button>
                </div>
              </div>
              {/* 1.7.8 — THE WELL EARNS A CLIPPING SHELL (the parts' own
                  law, joined by the notes — see .gd-well-shell in
                  index.css): the scrollbar lane + the corner plate + the
                  resize grip paint as SQUARES past the well's rounded
                  curve, and the notes well never carried the part rows'
                  own flex/scroll law set at all. The shell owns the
                  frame's curve and CLIPS; the field inside keeps every
                  well voice (and GAINS the part rows' own well law). */}
              <div className="gd-well-shell mt-1.5">
                <textarea
                  className="gd-input gd-prompt-box leading-relaxed"
                  rows={8}
                  spellCheck={false}
                  value={version.notes || ''}
                  placeholder="Notes for this version: ideas, settings, whatever belongs with it…"
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            {/* the CONTAINER'S OWN COLOR CHIP — the 1.5.2 corner seat,
                joined by the notes: press opens the notes' own color
                window (the class/card ladder, live picks). */}
            <button
              type="button"
              className={clsx('gd-part-color-chip', !version.notesColor && 'is-empty')}
              style={version.notesColor ? { background: version.notesColor, borderColor: version.notesColor } : undefined}
              title={
                version.notesColor
                  ? `Notes container color: ${version.notesColor} — press to change`
                  : 'Notes container color: theme default — press to set one'
              }
              aria-label="Container color for the notes"
              onClick={() => setNotesColorOpen(true)}
            />
          </div>
          {showHelp && (
            <p className="mt-2 text-[10px] leading-relaxed" style={{ color: 'var(--gd-mute)' }}>
              Notes live on this version and never join the composed prompt.
            </p>
          )}
        </div>
      )}
      {/* 1.6.4 — THE NOTES READER'S WINDOW ("notes should do the same") —
          1.6.7 — THE READER IS THE EDITOR NOW ("update the expanded
          window"): the big stage-sized editing field whose every keystroke
          lands LIVE in the row behind it, the pinned COPY + DONE foot, the
          version's label + live char count in the subheader. It rides the
          promptCard's own seat so it follows the card wherever it renders
          (the panel, the merged column — the Modal portals to the body
          either way). The COLOR WINDOW rides the same law — the parts'
          PartColorWindow ladder, spoken for the notes' container. */}
      {tab === 'notes' && notesReaderOpen && (
        <NotesEditorWindow
          version={version}
          versionLabel={version.label}
          onSetNotes={setNotes}
          onClose={() => setNotesReaderOpen(false)}
          onStatus={onStatus}
        />
      )}
      {tab === 'notes' && notesColorOpen && (
        <NotesColorWindow
          version={version}
          versionLabel={version.label}
          onPick={setNotesColor}
          onClose={() => setNotesColorOpen(false)}
        />
      )}
    </div>
  ) : null;

  return (
    <div
      ref={rootRef}
      // 0.30.0 — the scroller carries the VIEWER pattern in the full-window
      // view (compact keeps it plain — the panel wrapper paints the panel
      // surface): the pattern now MOVES with the scroll while the sticky
      // header's stays put, the same two-phase read the right panel has.
      // 0.31.0 — data-gd-region="charview": the app-level right-click menu
      // reads this to know the cursor is over the CARD VIEW (its menu
      // speaks card — back, rename, delete — not the grid's).
      data-gd-region="charview"
      /* 1.1.8 — OVERFLOW-X HIDDEN, BY LAW (the panel's twin fix — "i still
         can scroll to the right of the right detail panel"): the full-window
         view's own scroller computes overflow-x:auto the moment overflow-y
         is set, so a hanging ribbon or hover halo past the right edge grew
         a sideways scrollbar. The view is vertical, full stop. */
      className={clsx('h-full overflow-y-auto overflow-x-hidden relative gd-tex-scroll gd-sb-breath', !compact && 'gd-tex-viewer')}
      onDragOver={(e) => {
        if (Array.from(e.dataTransfer?.types || []).includes('Files')) {
          e.preventDefault();
          setFilesOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFilesOver(false);
      }}
      onDrop={handleFilesDrop}
    >
      {filesOver && (
        <div className="fixed inset-0 z-[180] pointer-events-none flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="gd-card px-6 py-4 gd-pop-in">
            <div className="gd-rule">DROP IMAGES TO ADD TO {stripRichText(version?.label || '') || 'THIS VERSION'}</div>
          </div>
        </div>
      )}

      {/* header — sticky so the controls stay reachable while scrolling.
          0.19.0: the bar wears its PARENT surface's own class now (the
          right panel's pattern in compact mode, the viewer's full-window) —
          same base color, same pattern, same origin — so the coloring
          flows through it seamlessly instead of the old tinted,
          phase-shifted strip that read offset from the pattern and clipped
          against it.
          0.15.0 — the name keeps a real line-height (leading-none clipped
          its descenders at the bottom), and the TAG + STAMP rows live
          INSIDE the sticky header on their own lines (they can never slide
          under / clip over the name).
          0.21.0 — the header carries the REAL bottom border itself: the old
          spacer div below it painted a FAKE line that scrolled away while
          content slid under the invisible header edge (a border that
          "acted" like one but was never there). The border now rides the
          sticky bar — it stays stuck at the header's true boundary forever. */}
      <div
        // 0.33.0 — THE FULL-WINDOW HEADER FOLLOWS THE TOP TOOLBAR'S PATTERN
        // ("the top header of the full window (aka when right pannel is
        // turned off) doesnt follow the right pattern"): the grid's toolbar
        // row wears the TITLEBAR surface, so this bar — the full-window
        // view's own top header — wears it too (compact keeps the panel
        // surface, its parent). Same base color, so the bar still reads as
        // part of the sheet below; the pattern is the toolbar's own.
        // gd-char-head promotes the sticky bar to its own compositing layer
        // (the scroll no longer repaints the header every frame — the
        // "its laggy" half of the report).
        className={clsx(
          'gd-char-head sticky top-0 z-20 pt-4 pb-3 border-b',
          /* 1.2.6 — ONE HEAD, ONE SURFACE ("the top toolbar of the right
             panel seems different in texture with the top toolbar of the
             full detail screen, where screen is none while right panel is
             pattern, fix that so they both follow the same pattern … while
             full screen takes the pattern, basically to match them
             together"): BOTH seats wear the PANEL's own surface now — the
             panel's pattern on the panel's mid-tier color — so the
             full-window head stops speaking the (pattern-less) titlebar's
             flat language and the two heads read as the SAME bar at any
             width. The body below matches (the cover wears the panel's
             surface too — see .gd-viewer-cover in index.css), so the whole
             full-window view reads as the right panel, expanded. */
          'gd-tex-panel',
          pad
        )}
        ref={headRef}
        style={{ borderColor: 'var(--gd-line)' }}
      >
        {/* 1.0.4 — THE HEADER'S TWO ROWS ("in details pannel, first row will
            have the back button, the date, and the pin and card settings
            button, second row will have the name (it can take up to 2 rows,
            if it exceeds 2 rows it will cut off), tags and stamps will
            remain the same"): the controls used to share ONE flex row with
            the name (the name truncated to a single squeezed line between
            them). Now the controls own the first row — BACK, the date, then
            the pin and card settings keys pinned to the right edge — and
            the name owns its own row below, free to wrap across TWO lines
            (clamped there — anything longer cuts off with the clamp's own
            fade, never pushing the header taller than two name rows). The
            tag and stamp rows below are untouched. */}
        <div className="flex items-center gap-4">
          <button className="gd-btn flex-shrink-0" onClick={onBack} title="Back to the card grid">
            <ArrowLeft size={13} />
            BACK
          </button>
          {/* 0.10.0: the version count is gone from the header — just the date.
              1.6.9 — THE DATE JOINS THE SWAP FLIGHT (card switch feedback:
              "also the date on top should fade"): the date is content the
              new card rewrites (every card carries its own), so it rides
              the switch feedback's seat list now (.gd-cv-date in index.css)
              exactly like the name and the tag colors. */}
          <span className="text-[10px] tracking-[0.2em] text-gd-mute flex-shrink-0 gd-cv-date">
            {fmtDate(character.createdAt)}
          </span>
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {/* 1.0.7 — THE NAME'S OWN KEY ("add a button on top to expand or
                retract the rest of the name"): rides the header's control
                row, and only arms when the name actually overflows its
                two-line cut. Chevrons apart while retracted (there is more
                below), chevrons together while expanded (it folds back).
                Animated, never a hover: the fold below tweens its height.
                1.1.4 — THE KEY CANNOT VANISH MID-FLIGHT ("in detail panel,
                the option to collapse the name dissapears after i expand
                it, fix that so it doesnt"): the key used to arm on the live
                overflow measure alone, so any re-measure that blinked
                false while the name stood EXPANDED (a late font settle, a
                resize pass, a twin/real drift mid-tween) took the RETRACT
                key with it — an expanded name with no way back. The key
                now also arms on nameExpanded itself: an expanded name
                ALWAYS has a way to fold back, by construction — the
                measurements keep their job (arming the key at rest), and
                the state holds it for as long as the fold is open. */}
            {(nameOverflows || nameExpanded) && (
              <button
                type="button"
                className={clsx('gd-btn !px-2', nameExpanded && 'is-on')}
                title={
                  nameExpanded
                    ? 'Retract the card name to its first two lines'
                    : 'Expand the rest of the card name'
                }
                onClick={() => {
                  // 1.8.4 — a MANUAL retract retires the restore's memory (see
                  // nameOpenAtFoldRef): the name the owner retracts by hand
                  // stays retracted when the cover's hem later returns the
                  // tray — only the fold's own swallow earns a give-back.
                  if (nameExpanded) nameOpenAtFoldRef.current = false;
                  setNameExpanded((v) => {
                    const next = !v;
                    // 1.1.1 — the clamp lifts the INSTANT the name starts
                    // expanding (the "..." gives way to the real letters as
                    // the fold grows) and only re-lands when the retract
                    // flight settles (onAnimationComplete below).
                    if (next) setNameClamped(false);
                    return next;
                  });
                }}
              >
                {nameExpanded ? <ChevronsDownUp size={12} /> : <ChevronsUpDown size={12} />}
              </button>
            )}
            {/* 0.38.0 — THE PIN KEY ("add an option on top next to the others
                that when turned on would always pin the stamp and the tag
                area and wont auto collapse them, but when off it would auto
                collapse them when cursor isnt on them and scrolling down"):
                ON = the tags / stamps rows never fold on scroll; OFF = the
                scroll-to-collapse behavior is armed. */}
            <button
              type="button"
              className={clsx('gd-btn gd-pin-btn !px-2', rowsPinned && 'is-on')}
              title={
                rowsPinned
                  ? 'Pinned: the tag and stamp rows stay expanded while scrolling. Click to let them auto-collapse again.'
                  : 'Unpinned: scrolling the panel down folds the tag and stamp rows. Click to pin them open.'
              }
              onClick={() => {
                setRowsPinned((p) => !p);
                // 1.8.4 — pinning is a manual road out of a scroll-fold too:
                // the loan returns before the rows are pinned open (see
                // dismissSeatDebt). — 1.8.6 — THE SILENT ASCENT retired the
                // loan whole (see openTrayByHand): pinning opens the tray
                // by the hand's own word, the page growing with its flight.
                if (!rowsPinned) {
                  openTrayByHand();
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPinCtx({ x: e.clientX, y: e.clientY });
              }}
            >
              <Pin size={12} />
            </button>
            <CharSettingsMenu
              onEditCard={() => onEditCard && onEditCard()}
              onDelete={onDelete}
              onUndo={onUndo}
              onRedo={onRedo}
              canUndo={canUndo}
              canRedo={canRedo}
              scUndo={scUndo}
              scRedo={scRedo}
            />
          </div>
        </div>

        {/* 1.0.4 — THE NAME'S OWN ROW: full width, up to TWO lines, cut off
            past the second (.gd-name-clamp carries the -webkit-line-clamp).
            The old squeeze (truncate + a vw cap between the controls) is
            gone — a long title now reads as a title, and the clamp's fade
            says "there is more" without ever growing the header taller
            than two name lines.
            1.0.7 — THE FOLD IS A STATE, AND IT BREATHES ("remove the detail
            panel feature where the card name when hovered over will show
            fully … add animation to the card name in details panel
            expanding and retracting of course (tho not on hover like the
            older fix…)"): no hover behavior at all anymore. The header's
            own key (above) toggles nameExpanded, and this wrapper tweens
            its height between the captured two-line fold target and the
            full natural height — the rest of the name slides into view
            under the header's own clock, the same measured-height language
            the tag/stamp folds speak. Retracted it shows exactly the first
            two lines; scrolling down retracts it again unless pinned.
            1.4.7 — THE NAME JOINS THE HOVER HOLD ("when i scroll down while
            my cursor is on the tags/stamps and name area, it still
            collapses…"): the pointer over the name's own ground holds the
            rows open exactly like the tray does (see rowsHoverRef). */}
        <div
          className="relative"
          onPointerEnter={() => {
            rowsHoverRef.current = true;
          }}
          onPointerLeave={() => {
            rowsHoverRef.current = false;
          }}
        >
          {/* 1.1.1 — THE MEASUREMENT TWIN: the name's natural, unclamped
              shadow. Absolutely seated at the fold's exact width (left/right
              0 of this relative wrapper), visibility-hidden, inert — it
              never paints and never displaces, but it WRAPS for real, so
              the overflow probe reads the name's true height whether the
              real element is clamped or not (a clamped box only ever
              measures two lines — probing it would lie exactly when the
              dots are showing). Same typography, same RichText, no margin
              of its own: it is a ruler, not a second name. */}
          <div
            ref={nameMeasureRef}
            aria-hidden
            className={clsx(
              'gd-name-probe font-display font-bold text-gd-chrome leading-[1.2]',
              compact ? 'text-2xl' : 'text-3xl'
            )}
          >
            <RichText text={character.name} />
          </div>
          <motion.div
            ref={nameFoldRef}
            className="gd-name-fold"
            initial={false}
            animate={{
              height: nameExpanded || nameFoldH == null ? 'auto' : nameFoldH,
            }}
            /* 1.1.2 — the scroll-retract rode the SNAP seat with the rows —
               RETIRED IN 1.8.5 (and the payer that retired it followed in
               1.8.6 — THE SILENT ASCENT): the retract keeps its slide on
               every road, the same breath the tray speaks, and the page
               carries its height with the flight's own give.
               1.3.9 — THE MOUNT MEASURE STILL SNAPS ("the tag container
               issue isnt fixed where its shifted by 1px up still (or -1 px
               idk), then after the right panel opening animation it shifts
               back"): the fold's target is the CEILED two-line box
               (Math.ceil in foldTargetFor) while the natural 'auto' height
               carries the font's fractional line boxes — a 0.2-1px
               disagreement. The mount used to TWEEN that hair ('auto' at
               the first render, the measured target from the layout
               effect's second) over 0.24s, and everything below the name
               — the version strip, the rows tray, the TAGS CONTAINER —
               rode the drift through the panel's whole opening flight
               (measured live: the name 32.8 -> 33.0 while the tray slid
               129.3 -> 129.5). The FIRST landing still snaps (duration 0):
               the layout-effect measure commits before the browser ever
               paints, the drift never exists, and every genuine toggle
               (the expand key, the retracts, the scroll-fold) keeps its
               0.24s flight — only the never-seen measure hop lost its
               tween. */
            transition={foldFirstLandingRef.current ? { duration: 0 } : { duration: 0.24, ease: [0.25, 0.9, 0.35, 1] }}
            style={{ overflow: 'hidden' }}
            /* 1.1.1 — THE DOTS LAND WITH THE RETRACT: the clamp re-arms only
               when the shrinking flight settles onto its two-line target —
               during the tween the wrapper's own overflow-hidden carries the
               cut (no mid-flight ellipsis snap), and the completed fold ends
               by trading the raw cut for the true "..." exactly where the
               second line ends. A re-expand mid-flight cancels the landing
               (nameExpanded reads true by then — no clamp). */
            onAnimationComplete={() => {
              foldFirstLandingRef.current = false;
              if (!nameExpanded) setNameClamped(true);
            }}
          >
            <div
              ref={nameRef}
              role="heading"
              aria-level={1}
              className={clsx(
                'font-display font-bold text-gd-chrome leading-[1.2] mt-1',
                compact ? 'text-2xl' : 'text-3xl',
                /* 1.1.1 — THE RESTING ELLIPSIS: the two-line clamp rides the
                   real name while the fold sits retracted-and-settled — the
                   browser paints "..." over the last letters of line two,
                   and the expand key lifts it again. The recipe is whole
                   (the 119 law): -webkit-box + orient + clamp + overflow
                   hidden, all four or none. */
                nameClamped && 'gd-name-clamp'
              )}
            >
              <RichText text={character.name} />
            </div>
          </motion.div>
        </div>
        {/* tags row + stamps row + the light separator between them
            (0.38.0 — "add a seperator between the stamps and the tags, a
            light one just so its not all blended in together"). While the
            scroll-to-collapse has folded the rows away, the separator
            becomes the holder for the centered EXPAND chip ("leaving only a
            collapse and expand button in the middle of the separator, when
            clicked on it will expand it automatically").
            0.39.0 — THE FOLD BREATHES ("the tags/stamp collapse animation
            should be smoother slightly"): the rows ride a measured-height
            wrapper that tweens to 0 (content stays mounted while it shrinks,
            so the rows visibly slide away instead of blinking out) and the
            expand chip fades in as the slide finishes. */}
        {/* 1.1.8 — THE ROWS TRAY ("ensure the stamps and tags have a unqiue
            container in details pannel so they dont blend into the
            background, especially considering this new change"): the whole
            tags + stamps block sits on its own tinted, hairline-framed
            plate now — see .gd-rows-tray in index.css. Open or folded, the
            rows read as ONE object instead of melting into the header's
            texture; the side-scroll's fade ink speaks the tray's own face.
            1.4.7 — THE TRAY JOINS THE HOVER HOLD ("when i scroll down while
            my cursor is on the tags/stamps and name area, it still
            collapses, fix that so it doesnt do if im hovering on top"):
            the pointer over the tray holds the rows open (see
            rowsHoverRef) — the fold waits until the cursor leaves. */}
        <div
          ref={rowsZoneRef}
          className={clsx(
            'gd-rows-tray',
            autoCollapsed && 'gd-rows-folded'
            /* 1.8.2 — THE SNAP SEAT COVERS THE WHOLE TRAY — RETIRED IN 1.8.5,
               and the payer that retired it followed in 1.8.6 (THE SILENT
               ASCENT — see the refs' tombstone): the tray's own padding +
               chipline tweens ride WITH the body's on every road — one
               flight, the 0.39.0 breath, and the page shortens with it. */
          )}
          onPointerEnter={() => {
            rowsHoverRef.current = true;
          }}
          onPointerLeave={() => {
            rowsHoverRef.current = false;
          }}
        >
          <motion.div
            className="gd-rows-body"
            initial={false}
            animate={autoCollapsed ? { height: 0, opacity: 0 } : { height: 'auto', opacity: 1 }}
            /* 1.1.2 — the SNAP seat (see foldSnap at the state) — RETIRED IN
               1.8.5, and the payer that retired it followed in 1.8.6 (THE
               SILENT ASCENT): a scroll-triggered fold never needs to land
               in one frame — the page shortens WITH the tweened flight
               (monotonic, never a snap-back), so EVERY road keeps its slide
               (the 0.39.0 breath): the rows visibly slide away under the
               wheel, the content rising into the space they vacate, and
               they pour back in the same way on every hand's road. */
            transition={{ duration: 0.24, ease: [0.25, 0.9, 0.35, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className={clsx(autoCollapsed && 'gd-rows-body-inert')} aria-hidden={autoCollapsed || undefined}>
              {/* tags row — 0.37.0 — COLLAPSIBLE: the TAGS label is the
                  toggle key; collapsed, the chip zone clamps to ONE no-wrap
                  row that fades at its cut.
                  1.1.8 — THE SIDE-FLOW LAW ("when the tags expand beyond 3
                  rows … their container gains a scrollbar which allows me to
                  scroll sideways … when it fills and it demands a fourth row
                  for tags, instead start stacking them on the right"): the
                  zone is a SideFlowZone now — retracted it keeps the exact
                  old 1-row clamp (NO sideways scroll, per the report), open
                  it caps at THREE rows and stacks everything past the cap
                  as columns to the right, panned by the scrollbar + edge
                  arrows. The measurement twin inside the seat is what keeps
                  the fold's measured clamp honest (see SideFlow.jsx). */}
            <div
              className="flex items-start gap-2 min-w-0"
              onContextMenu={(e) => {
                // 1.0.5 — the tags row speaks the manager. Swallowed here so
                // the app-level region menu never mixes its items in; the
                // chips' own clicks are untouched (contextmenu is separate).
                e.preventDefault();
                e.stopPropagation();
                setTagCtx({ x: e.clientX, y: e.clientY });
              }}
            >
              {/* 1.2.0 — THE ROW'S LEFT COLUMN ("ensure that stamps and tags
                  start from the same vertical line" + "add + tags and +
                  stamps below the name of them, so there is another easy
                  way to access it right below their titles in detail
                  window"): the toggle and the new + TAGS key ride their own
                  fixed-width column (the toggle's shared min-width), so the
                  chips' zone starts at exactly the same x as the stamps
                  row's zone, and the tag manager is one tap under the title.
                  1.2.4 — THE + KEY CENTERS UNDER ITS LABEL (the stamps row's
                  column speaks the same law): the toggle keeps the column's
                  full width, the + centers beneath it. */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  className="gd-row-toggle flex-shrink-0 self-start"
                  title={rowsCollapsed.tags ? 'Expand the tag row' : 'Collapse the tag row to one line'}
                  onClick={() => toggleRowGuarded('tags')}
                >
                  <Tags size={10} />
                  TAGS
                  <ChevronDown size={11} className={clsx('transition-transform', !rowsCollapsed.tags && 'rotate-180')} />
                </button>
                {/* 1.2.0 — THE + TAGS KEY under the title: the same manager
                    the trailing + key opens, seated right below the name.
                    1.2.5 — the labeled pill (+ TAG), the key's own word
                    riding in the key.
                    1.7.5 — THE DOOR FOLLOWS THE SWITCH (the UNSELECTED TAGS
                    setting): on it opens the manager right away, exactly as
                    it always did; off it opens the TAG PICKER first — the
                    window that shows the (now hidden) vocabulary to add,
                    the manager riding inside it. */}
                <button
                  type="button"
                  className="gd-row-plus flex-shrink-0"
                  title={
                    showAllTags === false
                      ? 'Add tags to this card (opens the tag picker)'
                      : 'Open the tag manager (create and manage tags)'
                  }
                  onClick={() => {
                    if (showAllTags === false) onOpenTagPicker?.(character.id);
                    else onOpenTagManager?.();
                  }}
                >
                  <Plus size={11} />
                  TAG
                </button>
              </div>
              {/* 1.1.8 — THE SIDE-FLOW SEAT (1.3.2 — THE WALL, see
                  SideFlow.jsx): the probe + live zone + arrows live in
                  SideFlowZone; the chips render in BOTH the hidden probe
                  (the honest row-band measure) and the live zone.
                  1.2.9 — the tags zone used to land ONE FRAME after the
                  view's first paint (the staged breath) behind a 98px
                  placeholder — and the placeholder's guess never matched
                  the zone's real height (measured live on the first open:
                  the placeholder at 98 against the zone's 85 — the whole
                  tray below jumped UP the moment the real zone landed).
                  1.3.8 — THE TAGS ZONE MOUNTS WITH THE FIRST FRAME (the
                  stamps' own 1.3.6 law, extended): the breath is retired
                  and the placeholder left with it — the tags' first paint
                  IS the settled paint, the tray below never jumps, and
                  the panel's opening frame simply carries the chips'
                  double render (a few milliseconds for a whole
                  vocabulary; the entrance flight starts in the same
                  breath it always did). The first-open jump and the
                  "small lift" the placeholder bought with its guess are
                  gone by construction — there is no guess anymore. */}
              <TagsFlowRow
                character={character}
                tags={tags}
                collapsed={rowsCollapsed.tags}
                onToggleTag={onToggleTag}
                onOpenTagManager={onOpenTagManager}
                onOpenTagPicker={onOpenTagPicker}
                onReorderTags={onReorderTags}
                /* 1.6.9 — the swap flight's tag color crossfade (see the
                    swap state's note above). 1.7.5 — the switch rides the
                    same seat: the row's census + the + key's door. */
                swapOldActive={tagSwapOldActive}
                showAllTags={showAllTags}
              />
              </div>

              {/* 0.38.0 — THE LIGHT SEPARATOR (a plain hairline again:
                  1.1.9 moved the COLLAPSE key OFF this line — its 20px
                  pill used to sit absolutely centered ON it, overlapping
                  the chips flowing past under it ("the collapse feature of
                  the tags/stamps is in the middle clipping underneath
                  it, fix that so its instead at the bottom"). The key
                  rides below the stamps row — 1.6.7: ONE chip below the
                  folding body (see .gd-rows-chipline under the motion.div).
                  1.2.6 — THE SEPARATOR SITS BALANCED ("the seperator
                  between the right panel stamps and tags seem to be too
                  low on edge to the stamps, fix that so its balaned"): the
                  old 7px/5px margins hugged the stamps row beneath it —
                  the line read as part of the stamps, not the midway
                  between the two worlds. Equal 6px air above and below. */}
              <div className="gd-rows-sep" aria-hidden />

              {/* stamps row — the right panel's stamp editor (0.15.0),
                  collapsible through the same label-toggle pattern.
                  1.2.9 — THE SECOND BREATH (see mountStage): the stamp
                  editor carried the second side-flow zone (and its own
                  measurement twin); it landed one frame AFTER the tags
                  zone, splitting the view's mount cost across the
                  entrance flight's early frames instead of blocking its
                  first.
                  1.3.6 — THE BREATH IS RETIRED FOR THE STAMPS ("the stamps
                  area is also blank while the right pannel is opening then
                  all the stamps summon in, fix these two issues"): the
                  blank-then-summon the staging bought (the placeholder
                  div riding for two rAFs, then the whole zone popping in)
                  read worse than the frame it saved — and the frame itself
                  got cheap: the zone's measurement twin now renders
                  stand-in boxes for the fixed 44x44 slots (see
                  SideFlowZone's uniformItems law) instead of the full
                  double mount, so the stamp editor's first-commit cost is
                  one live render of the slots and the twin's honest math.
                  The stamps zone mounts with the view's OWN first frame
                  (mountStage >= 0 — always), the tags zone keeps the one
                  rAF breath, and the panel's width flight never meets a
                  heavy landing mid-tween. */}
              <div className="flex min-w-0">
                <StampEditor
                    character={character}
                    stampLibrary={stampLibrary}
                    imagesPath={imagesPath}
                    cardRatio={character.cardRatio || cardDefaultRatio}
                    onAttach={onAttachStamp}
                    onRemove={onRemoveStamp}
                    onPromote={onPromoteStamp}
                    onUpload={onUploadStamp}
                    onRename={onRenameStamp}
                    onReorder={onReorderStamps}
                    onColor={onStampColor}
                    onTransform={onStampTransform}
                    showHelp={showHelp}
                    collapsed={rowsCollapsed.stamps}
                    onToggleCollapse={() => toggleRowGuarded('stamps')}
                />
              </div>

              {/* 1.1.9 — THE COLLAPSE KEY RIDES THE TAIL ("… fix that so
                  its instead at the bottom, ensure it doesnt also clip on
                  the scrollbar") — RETIRED as a second chip in 1.6.7: the
                  keyline's COLLAPSE key and the separator's holder chip
                  were TWO different buttons at two different seats, one
                  unmounting as the other appeared — "it doesnt just
                  dissapear then the other appear". ONE chip rides below
                  the folding body now (see .gd-rows-chipline under the
                  motion.div): the fold's own height tween carries it
                  between the two seats, the glyph rotating as it travels. */}

              {/* 1.6.7 — THE FOLD'S TRAVELING CHIP ("you know the tag/
                  stamp expand and retract buttons? i want it so when its
                  expanding or retracting that it would show it moving
                  between them, so it doesnt just dissapear then the other
                  appear etc.., figure it out"): ONE chip, always mounted,
                  seated in the flow RIGHT BELOW the folding body. Open,
                  it is the tail key the keyline always spoke (COLLAPSE,
                  ChevronsDownUp); folded, it is the separator's holder
                  (TAGS & STAMPS, the glyph rotated half a turn —
                  ChevronsUpDown IS ChevronsDownUp flipped, so the icon
                  VISIBLY TURNS between the two states on its own 0.2s
                  clock while the chip itself GLIDES: the rows body's
                  framer height tween is the carrier — folding, the chip
                  rises from the tail to the separator as the rows close
                  under it; expanding, it rides back down as they open.
                  Nothing unmounts, nothing pops: the button the owner
                  presses is the button that arrives. The hairline speaks
                  only while folded (the holder's old line, fading in on
                  its own clock — see .gd-rows-chipline in index.css). */}
            </div>
          </motion.div>
          <div
            className="gd-rows-chipline"
            role="separator"
            aria-label={autoCollapsed ? 'Tag and stamp rows collapsed' : 'Tag and stamp rows open'}
          >
            <button
              type="button"
              className="gd-rows-expand"
              title={
                autoCollapsed
                  ? 'Expand the tag and stamp rows'
                  : 'Collapse the tag and stamp rows (fold them to the separator)'
              }
              onClick={autoCollapsed ? expandRows : () => setAutoCollapsed(true)}
            >
              <ChevronsDownUp size={11} className={clsx('transition-transform duration-200', autoCollapsed && 'rotate-180')} />
              {autoCollapsed ? 'TAGS & STAMPS' : 'COLLAPSE'}
            </button>
          </div>
        </div>
      </div>

      {/* 1.8.4 — THE SEAT THE COVER BORROWS. 1.8.5 — THE PAYER WRITES IT
          FRAME BY FRAME. 1.8.6 — THE SEAT LEFT WITH THE RESTORES IT SERVED
          (see THE SILENT ASCENT at the refs' tombstone): the spacer held
          exactly the height a fold removed so the page's length never
          changed while the tray moved — but a debt standing is a geometric
          obligation the ascent can no longer pay back, and the owner's law
          ("expanding should just be manual by the user like usual") chose
          the flow's word instead: every fold shortens the page WITH its own
          flight, no loan is ever taken, and no element needs to hold one.
          The .gd-rows-seat law in index.css stays as the era's own
          tombstone, the way the is-snap law does. */}

      {/* version strip — 0.21.0: the old fake separator spacer div that sat
          here (a bare border-b painted on its own scrolling element — a
          visible line that was NOT the header's border, while the header's
          actual edge stayed invisible) is gone; the real line rides the
          sticky header above.
          0.37.0 — DRAG TO REORGANIZE ("allow dragging versions around to
          reorganize…"): each chip rides a gd-sort-item wrapper (geometry-mode
          pointer sort, the same engine as the stamp slots). The card cover
          follows the VERSION, never the slot — previewVersionId and the
          per-version cover image are keyed by id, so the star and the grid
          cover land wherever the version lands. The little settings pencil
          is opted out of the grab; 0.38.0 — the NEW VERSION key rides the
          strip as its own trailing sort item (it glides aside when a chip
          heads for the end — "the add new version can also move if needed").
          And the drop target is the nearest INSERTION GAP, so the glide,
          the settle and the commit all land where the pointer says.
          0.42.0 — RIGHT-CLICK ANY CHIP ("allow right click window to come
          over it to edit version details"): the strip's own menu — edit
          details, set as cover version, delete — speaks the RIGHT-CLICKED
          version; no selecting it first, no opening the settings window
          just to reach the cover key. */}
      {/* 1.1.8 — THE STRIP'S OWN SEAT: one row that scrolls sideways (see
          the version-strip note above the sort hook) — the wrapper is the
          arrows' + fades' frame; the strip itself never wraps.
          1.3.9 — THE FADES SPEAK THE STRIP'S OWN SEAT AND PAPER ("add a
          right and left fade in the versions container simmilar to the
          tags and stamp containers"): the FlowEdges veils used to fall
          back to their --gd-panel ink (the strip's --gd-side-fade never
          reached them — it sat on the STRIP, and the fades render as its
          SIBLINGS), painting a light block over the paper the strip
          actually sits on (measured live: a 245,239,224 veil on the
          229,220,196 tier-mid paper), and they seated at the WRAPPER's
          outer edge — veiling the padding, only kissing the chips'
          clip plane. The wrapper now carries the seat vars the tags and
          stamps zones measure for their own fades: --gd-seat-ox-l seats
          each veil AT the strip's clip edge (the wrapper's left padding,
          16px in the panel / 24px in the window), and --gd-side-fade
          speaks the paper the strip floats on (the panel tier), so the
          chips rolling past the frame dissolve INTO the surface exactly
          the way the tags' and stamps' chips do. */}
      <div
        className={clsx('relative min-w-0', pad)}
        style={{
          ['--gd-seat-ox-l']: compact ? '16px' : '24px',
          ['--gd-side-fade']: 'var(--gd-tier-mid, var(--gd-bg))',
        }}
      >
      <div
        className="gd-version-strip gd-sb-breath py-2 px-2 flex items-center gap-2.5 flex-nowrap overflow-x-auto"
        ref={verStripRef}
      >
        {versions.map((v, i) => {
          const dragged = verSort.sorting && verSort.sort?.from === i;
          return (
            <div
              key={v.id}
              className={clsx('gd-sort-item gd-version-item', dragged && 'is-dragging')}
              style={dragged ? verSort.dragStyle : verSort.itemStyle(i) || {}}
              {...verSort.bindItem(i)}
              title={`${stripRichText(v.label)}: drag to reorganize, click to open it, right-click for the menu`}
              /* 1.0.8 — name-led tooltip: the label's area clamps at two
                  lines; the instructions after it are the "rest". */
              data-gd-tip-name="1"
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setVerCtx({ x: e.clientX, y: e.clientY, id: v.id });
              }}
            >
              <VersionChip
                version={v}
                active={version?.id === v.id}
                isPreview={previewVersion?.id === v.id}
                onSelect={() => setSelectedVersionId(v.id)}
                onEdit={() => setEditingVersionId(v.id)}
              />
            </div>
          );
        })}
        {/* 0.38.0 — the NEW VERSION key as the strip's TRAILING SORT ITEM.
            A plain click still creates the version (the sort's 5px move
            threshold separates a click from a grab); dragging it just
            settles home.
            1.6.9 — THE KEY'S REF (see the FLIP note at the sort hook): the
            trailing key's own element, so the switch feedback can glide
            it between its seats. */}
        <div
          ref={verKeyRef}
          className={clsx(
            'gd-sort-item gd-version-item',
            verSort.sorting && verSort.sort?.from === versions.length && 'is-dragging'
          )}
          style={
            verSort.sorting && verSort.sort?.from === versions.length
              ? verSort.dragStyle
              : verSort.itemStyle(versions.length) || {}
          }
          {...verSort.bindItem(versions.length)}
        >
          <button className="gd-btn" onClick={addVersion} title="Add a new version">
            <Plus size={12} />
            NEW VERSION
          </button>
        </div>
      </div>
      {/* 1.1.8 — THE STRIP'S EDGE ARROWS + FADES: mounted only while the
          row actually overflows; each key nudges ~3/4 of the visible width
          in its direction, and the fades veil the chips running past the
          frame so the row reads as continuing, not colliding. */}
      <FlowEdges flow={verEdges} label="version strip" />
      </div>

      {/* 0.42.0 — THE FRAMING RULES ("extend the preview column separator to
          the top and add a line horizontally to seperate between the versions
          and the details below … add another horizontal line at the end so it
          doesnt look empty and floating"): the full-window view's details
          section is framed — a hairline above (between the version strip and
          the body) and a closing hairline below — and the preview column's
          separator runs the FULL height between them, meeting the top rule in
          a clean T instead of starting mid-air. */}
      {!compact && <div className={clsx('gd-detail-rule', pad)} aria-hidden />}

      {/* body — 0.30.0 — THE FULL-WINDOW VIEW IS THREE COLUMNS ("divide it
          into 3 columns, first column will have the card on the left, then
          the other 2 will merge to be the prompt details, the notes, and so
          on, as the preview was too big"): the clamped CARD column on the
          left (the preview at a sane size), then ONE wide merged column —
          the prompt parts / notes card filling it, with the compose sheet
          riding beside when the bottom bar is off (card · details · compose
          = the three columns). The compact right panel keeps its single
          stacked column exactly as before.
          0.31.0 — the card column is USER-RESIZABLE: the SEPARATOR between
          it and the merged column ("add a separator between the image
          preview and the prompt/notes so i can resize") carries a 9px
          ew-resize strip; the width commits to settings.cardColWidth so the
          Settings sliders, undo and reloads all replay it. */}
      <div
        /* 1.6.5 — THE BODY'S OWN NAME (gd-cv-body — see .gd-cv-swap in
           index.css): the swap flight's wholesale seat fades the whole
           wrapper — every opaque card inside it (the image preview, the
           prompt parts, the notes, the compose sheet) went translucent
           mid-fade and the panel's texture flickered straight through them
           ("i dont want the background flickering everytime"). The wrapper
           keeps its name now; the flight speaks on the CARDS' CONTENT
           alone — each plate stays solid, exactly the law the tags/stamps
           tray already spoke. */
        className={clsx('pb-6 items-start gd-cv-body', compact ? 'flex flex-wrap gap-6' : 'flex', pad)}
        style={compact ? undefined : { gap: 0 }}
      >
        <div
          ref={cardColRef}
          className={clsx('space-y-4 min-w-0 gd-cardcol', compact ? 'flex-1' : 'flex-shrink-0')}
          style={
            compact
              ? { minWidth: 260 }
              : {
                  width: Math.round(cardColWidth),
                  // 0.42.0 — THE PREVIEW RIDES ALONG ("when scrolling down
                  // through the full screen detail screen, ensure that the
                  // preview image on the left would scroll down and keep on
                  // screen as to make it easy to see the prompts and the image
                  // at the same time"): the column sticks just under the
                  // sticky header (its live height measured above) while the
                  // details column scrolls — the picture and the prompts are
                  // on screen together the whole way down.
                  position: 'sticky',
                  top: headH ? headH + 10 : 66,
                  zIndex: 10,
                  alignSelf: 'flex-start',
                }
          }
        >
          {version ? (
            <>
              {/* 0.11.0 — the panel's preview shows the FULL image (never
                  cropped) over a blurred bleed of itself that spans the card
                  edge to edge; scrolling over it scrolls the PANEL normally.
                  0.19.0: the living-background layer that ran in the bleed
                  is gone with the animated backgrounds. 0.28.0: the wheel
                  is left alone EVERYWHERE now — scroll-to-zoom and the
                  double-click reset are retired app-wide. */}
              <ImageStage
                images={version.images}
                imagesPath={imagesPath}
                bleed={compact}
                autoSwipe={autoSwipe}
                dormant={dormant}
                managerSignal={managerSignal}
                onAddImages={addImagesFromFiles}
                onSetCover={setCover}
                onDeleteImage={deleteImage}
                onReorderImages={reorderImages}
                onPasteRecord={(rec) =>
                  patchVersion((v) => ({ ...v, images: [...v.images, imageRecord(rec)] }))
                }
                onStatus={onStatus}
                confirm={confirm}
                onOpenViewer={(i) => setViewer({ file: version.images[i]?.file ?? null })}
              />

              {/* compact (the right panel): the prompts/notes card stays in
                  the same stacked column, right under the stage.
                  1.4.4 — THE PROMPT CARD RIDES THE BELOW-FOLD SEAT (.gd-cv-auto
                  — see its law in index.css): a 20-prompt part list costs
                  most of the panel's first-commit budget, and it sits under
                  the fold on open — the browser now skips its render until
                  the scroll approaches, so the opening curtain never
                  freezes (the 1.4.4 "half of the right panel empty then it
                  snaps" fix) while the content stays present in the DOM
                  from the very first frame. */}
              {compact && promptCard ? <div className="gd-cv-auto">{promptCard}</div> : null}
            </>
          ) : (
            <div className="gd-card p-10 flex flex-col items-center gap-3">
              <span className="gd-empty-mark">✖</span>
              <span className="text-[11px] tracking-[0.18em] uppercase" style={{ color: 'var(--gd-mute)' }}>
                No versions: add one to start
              </span>
              <button className="gd-btn gd-btn-solid" onClick={addVersion}>
                <Plus size={13} />
                NEW VERSION
              </button>
            </div>
          )}
        </div>

        {/* 0.31.0 — THE CARD-COLUMN SEPARATOR: the 9px ew-resize strip on
            the boundary. Full-window view only (compact keeps its stacked
            flow). A 15px spacer + the 9px strip reads as the old 24px
            gutter, with the hairline riding near its center. */}
        {!compact && (
          <>
            <div style={{ flex: '0 0 15px' }} aria-hidden />
            <div
              className={clsx('gd-cardcol-resize', cardLive && 'is-live')}
              role="separator"
              aria-orientation="vertical"
              title="Drag to resize the preview column: the width is saved (and undo-able)"
              onPointerDown={onSepDown}
              onPointerMove={onSepMove}
              onPointerUp={onSepUp}
              onPointerCancel={onSepUp}
            />
          </>
        )}

        {/* The merged details area (non-compact): ONE wide column — the
            prompt parts / notes card, and the compose sheet UNDER it at the
            SAME width ("composed output when its disabled as a bottom panel
            and inside the huge window ... it should have the same width as
            the part above" — the old 340px side column read as a sliver
            next to the wide prompt card; the sheet now spans exactly what
            the card above it spans, mirroring the right panel's stacked
            flow). */}
        {compact ? (
          !outputBarOn && (
            <div className="flex-shrink-0 w-full gd-cv-auto">
              <ComposePanel version={version} onStatus={onStatus} showHelp={showHelp} />
            </div>
          )
        ) : (
          <div className="flex-1 min-w-[340px] space-y-4">
            {version ? promptCard : null}
            {!outputBarOn && (
              <ComposePanel version={version} onStatus={onStatus} showHelp={showHelp} />
            )}
          </div>
        )}
      </div>

      {/* 0.42.0 — THE CLOSING RULE ("add another horizontal line at the end
          so it doesnt look empty and floating"): the framed details section
          ends on a hairline, matching the one above it. */}
      {!compact && <div className={clsx('gd-detail-rule', pad)} aria-hidden />}

      <AnimatePresence>
        {editingVersion && (
          <VersionSettingsModal
            version={editingVersion}
            index={editingIndex}
            total={versions.length}
            isPreview={previewVersion?.id === editingVersion.id}
            onClose={() => setEditingVersionId(null)}
            onPatch={(patch) =>
              patchCharacter(
                character.id,
                (c) => ({
                  ...c,
                  versions: c.versions.map((v) => (v.id === editingVersion.id ? { ...v, ...patch } : v)),
                }),
                `ver:${editingVersion.id}`
              )
            }
            onMove={moveVersion}
            onTogglePreview={() => togglePreviewFor(editingVersion)}
            onDelete={() => deleteVersion()}
          />
        )}
      </AnimatePresence>

      {/* 0.34.0 — THE NEW-VERSION WINDOW: the version settings window in
          CREATE mode, riding a DRAFT that lives nowhere but this state.
          CANCEL throws the draft away; CREATE commits it through
          createVersionNow (label / icon / color edits included) and selects
          the fresh version. */}
      <AnimatePresence>
        {creatingVersion && (
          <VersionSettingsModal
            version={creatingVersion}
            index={versions.length}
            total={versions.length + 1}
            createMode
            onClose={() => setCreatingVersion(null)}
            onCreate={(patch) => createVersionNow(patch)}
          />
        )}
      </AnimatePresence>

      {/* 1.0.3 — THE EDIT CARD WINDOW IS GONE FROM HERE: it renders at App
          level now (driven by App's own lookRequest state), so the panel, the
          grid and the full-window view all share ONE window that pops over
          whatever is on screen — and a plain card open can never inherit a
          stale request and pop the window with it. See App.jsx. */}

      {/* 0.38.0 — THE HUGE IMAGE VIEWER: opened by a click on the stage's
          picture (and, since 0.41.0, by a click on a slot inside the IMAGE
          MANAGER — the manager stays open underneath, its highlight never
          moves). The swipe walks the version's images manually. Nothing
          auto-advances in here. 0.41.0 — the crop tool is RETIRED
          ("remove the crop feature since its broken, just remove it").
          0.42.0 — THE SEAT ANCHORS ON THE FILE (see the state note): a
          reorder never changes the picture on screen, a deleted picture
          re-anchors on a survivor, and the viewer's own menu can set the
          cover, open the manager (through managerSignal), copy or reset —
          with the stage's auto-switch resting the whole time it is open. */}
      <AnimatePresence>
        {viewer && version && version.images.length > 0 && (
          <ImageViewer
            images={version.images}
            imagesPath={imagesPath}
            index={viewerIndex}
            onIndex={(i) => setViewer({ file: version.images[i]?.file ?? null })}
            onClose={() => setViewer(null)}
            onSetCover={(i) => setCover(i)}
            onDeleteImage={askDeleteViewerImage}
            onOpenManager={() => {
              /* 1.7.3 — THE VIEWER KEEPS ITS SEAT ("when right clicking in
                 the big image viewer and pressing on image manager, image
                 manager should open on it, dont close the big image preview
                 then open image manager"): the old hand-off folded the big
                 preview first (setViewer(null)) and THEN bumped the signal —
                 the viewer blinked out only to be rebuilt a beat later. The
                 signal alone crosses now: ImageStage seats the manager on
                 the OVER-VIEWER lane (z 920, above this veil) and the big
                 preview lives on underneath it — closing the manager
                 reveals the picture exactly where it was, the seat anchor
                 never moved. */
              setManagerSignal((s) => s + 1);
            }}
          />
        )}
      </AnimatePresence>

      {/* 0.42.0 — THE VERSION STRIP'S OWN MENU (see verCtxItems above). */}
      <AnimatePresence>
        {verCtx && (
          <GdContextMenu
            key={`${verCtx.x}-${verCtx.y}`}
            x={verCtx.x}
            y={verCtx.y}
            items={verCtxItems(verCtx.id)}
            onClose={() => setVerCtx(null)}
          />
        )}
      </AnimatePresence>

      {/* 0.45.0 — THE PIN KEY'S MENU: one action, speaking the key's own
          language ("on pin it would ay pin header"), nothing else. */}
      <AnimatePresence>
        {pinCtx && (
          <GdContextMenu
            key={`pin-${pinCtx.x}-${pinCtx.y}`}
            x={pinCtx.x}
            y={pinCtx.y}
            items={[
              { id: 'hdr', header: 'PIN' },
              {
                id: 'toggle',
                label: rowsPinned ? 'Unpin header' : 'Pin header',
                icon: Pin,
                onPick: () => {
                  setRowsPinned((p) => !p);
                  // 1.8.4 — the menu's twin of the key's own pin: the loan
                  // returns before the rows are pinned open (see
                  // dismissSeatDebt). — 1.8.6 — THE SILENT ASCENT retired
                  // the loan whole (see openTrayByHand): the menu's twin
                  // opens the tray by the hand's own word.
                  if (!rowsPinned) {
                    openTrayByHand();
                  }
                },
              },
            ]}
            onClose={() => setPinCtx(null)}
          />
        )}
      </AnimatePresence>

      {/* 1.0.5 — THE TAGS ROW'S MENU: the manager, one action, speaking the
          row's own language ("for tags its opening the tag manager"). */}
      <AnimatePresence>
        {tagCtx && (
          <GdContextMenu
            key={`tag-${tagCtx.x}-${tagCtx.y}`}
            x={tagCtx.x}
            y={tagCtx.y}
            items={[
              { id: 'hdr', header: 'TAGS' },
              {
                id: 'manager',
                label: 'Open the tag manager',
                icon: Tags,
                onPick: onOpenTagManager,
              },
            ]}
            onClose={() => setTagCtx(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Card editor for an existing card — draft-based: nothing touches
// the db until DONE. The preview IS the editor: drag the image to place it,
// scroll to zoom. Footer is PINNED — always visible.
// 0.20.0 — the TOP STAMP renders PASSIVELY in the preview (no transformer,
// no dragging: only the image is draggable). 0.22.0 — the stamp wears the
// card's SHARED settings; its placement / size / angle are edited through
// the STAMP SETTINGS popover in the stamp row above, which writes live
// through onStampTransform; CANCEL here only rolls back the LOOK draft
// (ratio / trim / crop / color).
// 0.38.0 — "also add it in card look options": the CARD COLOR section joins
// the window — presets + picker + none, same as creation.
// 0.41.0 — THE WINDOW IS THE CARD'S EDITOR ("remove rename card button and
// option and just include it in the card look options, and edit it to be
// edit card instead"): the title reads EDIT CARD and a NAME field rides the
// top — the rename capability lives here now, nowhere else.
// 1.5.9 — finishesHidden rides the window's own signature now: the 1.5.8
// seat referenced the bare identifier from the parent view's scope (a scope
// this module-level component never sees), so every EDIT CARD open died at
// "ReferenceError: finishesHidden is not defined" the instant the window
// mounted — the crash report's own words. App threads the master switch
// (settings.livingFinishes === false) exactly the way the view seats do.
export function CardLookModal({ character, coverUrl, coverThumbUrl = '', coverAspect, defaultRatio, imagesPath, stampLibrary, finishesHidden = false, onClose, onApply }) {
  // 0.41.0 — the card's NAME, edited in place with the look.
  const [name, setName] = useState(character.name);
  const [ratio, setRatio] = useState(character.cardRatio || defaultRatio || { w: 3, h: 4 });
  const [trim, setTrim] = useState(character.cardTrim || DEFAULT_CARD_TRIM);
  // 1.6.2 — THE TRIM'S OWN INK (the color picker's draft — TrimOverlay's
  // law): null keeps the theme's own trim exactly as the card painted it.
  const [trimColor, setTrimColor] = useState(
    typeof character.cardTrimColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(character.cardTrimColor)
      ? character.cardTrimColor
      : null
  );
  const [crop, setCrop] = useState(character.cardCrop || null);
  // 0.38.0 — the card's own color draft.
  const [cardColor, setCardColor] = useState(character.cardColor || null);
  // 1.3.8 — THE CARD'S OWN LOOKS (the "for fun" pass): the finish (+ its
  // image switch) ride the same draft-commit law the color always spoke
  // (the modal's confirmClose guard + one DONE commit + undo through
  // patchCharacter).
  // 1.3.9 — the secondary color and the pattern left with the feature; the
  // window speaks the finish alone.
  // 1.4.0 — the legacy seat migrates in the draft too (the sanitize law in
  // constants — an old saved coat opens as the shader that took its name's
  // seat; 1.4.3 walks chromatic AND polychrome onto opalescent).
  const [finish, setFinish] = useState(
    isCardFinish(character.cardFinish) ? migrateCardFinish(character.cardFinish) : 'none'
  );
  const [finishOnImage, setFinishOnImage] = useState(character.cardFinishOnImage === true);
  // 1.4.5 — THE COAT'S TRIM REACH DRAFT ("add trim effect ... which will
  // make the finish apply above the trim"): the trim switch rides the
  // same draft-commit law the finish speaks — one DONE, one undo step for
  // the whole family. 1.7.2 — THE STAMP REACH DRAFT IS RETIRED ("delete the
  // stamp effect option"): the saved field stays on the card data (inert),
  // the draft state left with the switch.
  const [finishOnTrim, setFinishOnTrim] = useState(character.cardFinishOnTrim === true);
  // 1.9.5 — THE COAT'S OWN VOLUME (the transparency knob): the draft-
  // commit law the family speaks — one DONE, one undo step. A card saved
  // before the knob was born opens at the softened default.
  const [finishTransparency, setFinishTransparency] = useState(
    normalizeFinishTransparency(character.cardFinishTransparency)
  );
  /* 1.9.6 — THE SPLIT VOLUME (the checkbox + the image knob): the same
     draft-commit law the family speaks — one DONE, one undo step. A card
     saved before the split was born opens at OFF + the shared default. */
  const [finishSplitImage, setFinishSplitImage] = useState(character.cardFinishSplitImage === true);
  const [finishImageTransparency, setFinishImageTransparency] = useState(
    normalizeFinishTransparency(character.cardFinishImageTransparency)
  );
  // 1.4.1 — IMAGE MOTION ("add an option next to the affect the image to
  // have image motion"): the sway's own draft, riding the same
  // draft-commit law the finish speaks.
  const [imageMotion, setImageMotion] = useState(character.cardImageMotion === true);
  // 1.4.7 — STAMP MOTION ("add stamp motion too, which when checked will
  // move the stamp alongside the image with a slight delay"): the band +
  // the placed stickers follow the image's sway a beat behind it — the
  // same draft-commit law, one DONE for the whole family.
  const [stampMotion, setStampMotion] = useState(character.cardStampMotion === true);
  // Untouched ratio keeps following the global default (null override).
  const [ratioTouched, setRatioTouched] = useState(false);
  // 1.0.6 — THE EDIT WINDOW'S OWN DIRT: true the moment any draft field
  // moves off what the card actually wears. Powers the Modal's
  // confirmClose guard — accidental closes ask; confirming closes WITHOUT
  // applying (the card keeps exactly what it had).
  const [lookDirty, setLookDirty] = useState(false);
  const touch = (fn) =>
    (...args) => {
      setLookDirty(true);
      fn(...args);
    };

  const topStamp = character.stamps?.[0] || null;
  const topStampUrl = topStamp && imagesPath ? buildImageUrl(imagesPath, topStamp.image) : null;
  const derivedAuto = useAutoStampColor(topStampUrl);
  const autoColor = topStamp
    ? (stampLibrary || []).find((s) => s.image === topStamp.image)?.autoColor || derivedAuto || null
    : null;
  // 1.4.0 — THE STAMP SETTINGS RIDE THE DRAFT ("include also stamp color
  // and settings option inside that window (dont include tags and stamps
  // though)"): the hue / position / scale / rotation / confinement the
  // card's stamps speak are drafted here exactly like the look fields —
  // the preview below paints the DRAFT (what you set is what you see),
  // DONE commits them with the look in one step, CANCEL rolls everything
  // back together. The settings start sanitized; every write lands
  // sanitized at the commit (the App lane re-merges them onto the card's
  // own sanitized object, the same voice setCharacterStampColor and
  // setCharacterStampTransform have always spoken — one mutate, one undo
  // step for the whole window).
  const [stampSet, setStampSet] = useState(() => sanitizeStampSettings(character.stampSettings));
  const touchStamp = touch(setStampSet);
  // 0.23.0 — the preview paints the SAME hue chain the card paints (custom
  // → library autoColor → live derivation → default), so what you frame
  // here is exactly what the grid shows. 1.4.0 — the chain reads the DRAFT
  // now, so the hue seat in this window is the hue the preview wears.
  const resolvedHue = useStampHue(stampSet, topStampUrl, autoColor);
  // the stamp image's own aspect + the drafted card's effective aspect feed
  // the position controls' honest band (the panel's own convention).
  const topStampAspect = useImageAspect(topStampUrl);
  const effectiveCardAspect =
    ratio && Number(ratio.w) > 0 && Number(ratio.h) > 0 ? Number(ratio.w) / Number(ratio.h) : null;

  return (
    <Modal
      title="EDIT CARD"
      onClose={onClose}
      confirmClose={
        lookDirty
          ? {
              message:
                'The card look has edits that have not been applied yet. Close the window and discard them?',
            }
          : null
      }
      /* 1.4.1 — THE WINDOW WIDENS WITH ITS THIRD COLUMN ("in card edit
         window, make the trims have their own column on the left (aka
         3 columns now) of the preview so there is no need to scroll
         inside the window"): trim chips left, preview + ratio middle,
         identity + materials right — the tall trim tower left the
         stacked flow, so the whole window fits one screen. */
      width="w-[860px]"
      footer={
        <div className="flex justify-end gap-2">
          <button className="gd-btn" onClick={onClose}>
            CANCEL
          </button>
          <button
            className="gd-btn gd-btn-solid"
            disabled={!stripRichText(name).trim()}
            onClick={() =>
              onApply({
                name: name.trim(),
                ratio: ratioTouched ? ratio : character.cardRatio || null,
                trim,
                // 1.6.2 — the trim's own ink rides the same commit (the
                // picker's seat — one DONE, one undo step with the family).
                trimColor,
                crop,
                color: cardColor,
                // 1.3.8 — the card's own looks ride the same commit.
                finish,
                finishOnImage,
                // 1.4.5 — the coat's trim reach rides it too (one
                // family, one commit). 1.7.2 — the stamp reach left
                // with the option.
                finishOnTrim,
                // 1.9.5 — the coat's own volume rides it too (the
                // transparency knob — one family, one commit).
                finishTransparency,
                // 1.9.6 — the split volume rides it too (the checkbox +
                // the image knob — one family, one commit).
                finishSplitImage,
                finishImageTransparency,
                // 1.4.1 — the image's own sway switch rides it too.
                imageMotion,
                // 1.4.7 — the stamp's trailing sway switch rides it too (one
                // family, one commit).
                stampMotion,
                // 1.4.0 — the stamp settings ride it too (one DONE, one
                // undo step for the whole window). 1.4.1 — the hue drafts
                // even without a stamp ("allow me to have a hue setting
                // even when there is no stamp"): the settings sit on the
                // card and speak the moment a stamp arrives.
                stampSettings: stampSet,
              })
            }
          >
            DONE
          </button>
        </div>
      }
    >
      {/* 1.4.1 — THE WINDOW IS THREE COLUMNS ("make the trims have their
          own column on the left (aka 3 columns now) of the preview so
          there is no need to scroll inside the window"): CardLookEditor
          (trimAside) renders the TRIM column + the preview/ratio middle;
          the card's identity + materials ride the right. */}
      <div className="flex gap-x-5 items-start">
        <CardLookEditor
          name={name}
          imageUrl={coverUrl}
          /* 1.6.2 — the progressive ladder's light tier: the preview paints
              the thumb first, the full file cross-fades over it when it
              lands (see PanZoomPreview). */
          imageThumbUrl={coverThumbUrl || coverUrl}
          imgAspect={coverAspect}
          ratio={ratio}
          trim={trim}
          trimColor={trimColor}
          onTrimColor={touch(setTrimColor)}
          crop={crop}
          versions={character.versions.length}
        date={fmtDate(character.createdAt)}
        previewWidth={190}
        stampUrl={topStampUrl}
        stampHueHex={topStamp ? resolvedHue : customStampHue(stampSet)}
        stampHueAlpha={stampHueAlpha(stampSet)}
        stampPos={stampSet.pos || null}
        stampScale={stampSet.scale || 1}
        stampRot={stampSet.rot || 0}
        stampClip={stampSet.clip === true}
        stampAlpha={stampAlpha(stampSet)}
        stampHueOver={stampSet.hueOver === true}
        stampHueOverTrim={stampSet.hueOverTrim === true}
        cardColor={cardColor}
        finish={finish}
        finishOnImage={finishOnImage}
        finishOnTrim={finishOnTrim}
        finishTransparency={finishTransparency}
        /* 1.9.6 — the split volume threads into BOTH preview seats (the
           panzoom and the compact CardPreview inside it). */
        finishSplitImage={finishSplitImage}
        finishImageTransparency={finishImageTransparency}
        imageMotion={imageMotion}
        stampMotion={stampMotion}
        trimAside
        onChange={touch(({ ratio: r, trim: t, crop: c }) => {
          if (r !== ratio) setRatioTouched(true);
          setRatio(r);
          setTrim(t);
          setCrop(c);
        })}
      />
        {/* the RIGHT column: the card's identity + materials. */}
        <div className="space-y-4 flex-1 min-w-0">
          {/* 0.41.0 — THE NAME FIELD (the rename capability lives here
              now). 1.0.7 — THE NAME IS CAPPED AT 60 ("card names should
              have a limit of 60 characters"): the field refuses a 61st
              plain character (markup excluded), carries the current/max
              counter, and every paste path lands capped — the same
              three-layer law the version labels have spoken since 1.0.6,
              now with the name's own room to breathe. */}
          <div>
            <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">NAME</div>
            <RichInput
              value={name}
              maxLength={60}
              placeholder="Card name (select text for formatting)"
              onChange={touch(setName)}
            />
          </div>
          {/* 0.38.0 — THE CARD COLOR SECTION ("also add it in card look
              options"): presets + picker + none, same swatch language as
              creation. */}
          <div>
            <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">CARD COLOR</div>
            <div className="gd-cls-presets">
              <button
                type="button"
                className={clsx(
                  'w-6 h-6 rounded border-2 flex items-center justify-center text-[10px] font-bold',
                  !cardColor ? 'gd-btn-accent' : 'text-gd-chrome'
                )}
                style={{ borderColor: 'var(--gd-line)' }}
                title="Theme default: no card color"
                onClick={() => touch(setCardColor)(null)}
              >
                ∅
              </button>
              {CLASS_COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={clsx('gd-cls-preset', cardColor === color && 'is-active')}
                  style={{
                    background: color,
                    borderColor: cardColor === color ? 'var(--gd-chrome)' : 'var(--gd-ink)',
                  }}
                  title={color}
                  onClick={() => touch(setCardColor)(color)}
                />
              ))}
              <span className="gd-swatch-divider" aria-hidden />
              <ColorPickerButton
                color={cardColor}
                onColor={touch(setCardColor)}
                // 1.6.3 — the picker's reset unsets the plate (null = the
                // theme's own foot, the preset row's "none" seat).
                onReset={() => touch(setCardColor)(null)}
                dashed
                active={!!cardColor && !CLASS_COLOR_PRESETS.includes(cardColor)}
                title="Open the color picker: any color you like"
              />
            </div>
          </div>
          {/* 1.3.8 — THE CARD'S OWN LOOKS: the finish (+ affect-the-image
              + image motion) — the same shared section the creation
              window seats, so the two windows can never disagree. */}
          <div>
            <CardStyleControls
              finish={finish}
              finishOnImage={finishOnImage}
              /* 1.9.5 — THE COAT'S OWN VOLUME: the knob threads from the
                 draft into the shared section (the edit card window's
                 seat of the family's slider). */
              finishTransparency={finishTransparency}
              onFinishTransparency={touch(setFinishTransparency)}
              /* 1.9.6 — the split volume's own threads (the checkbox +
                 the image knob — the EDIT CARD window's seat of the
                 family, one voice with the creation window). */
              finishSplitImage={finishSplitImage}
              onFinishSplitImage={touch(setFinishSplitImage)}
              finishImageTransparency={finishImageTransparency}
              onFinishImageTransparency={touch(setFinishImageTransparency)}
              onFinish={touch(setFinish)}
              onFinishOnImage={touch(setFinishOnImage)}
              finishOnTrim={finishOnTrim}
              onFinishOnTrim={touch(setFinishOnTrim)}
              imageMotion={imageMotion}
              onImageMotion={touch(setImageMotion)}
              /* 1.4.7 — STAMP MOTION rides the family ("add stamp motion
                 too, which when checked will move the stamp alongside the
                 image with a slight delay"). 1.4.8 — THE GATE SPEAKS THE
                 STAMP ALONE ("stamp motion should not depend on image
                 motion, it can be turned on as long as there is a stamp"):
                 any card with a stamp can arm the sway; the flight keeps
                 its +0.42s offset to the image's own clock so the day
                 image motion joins in, the two are already in step. */
              stampMotion={stampMotion}
              onStampMotion={touch(setStampMotion)}
              /* 1.4.6 — THE SUBJECT TRUTH (the grey-out law's second
                 axis): the gates speak the character's own truth — a card
                 with no image or no stamps greys those switches out with
                 their reasons, the same voice the creation window
                 speaks. */
              hasImage={!!coverUrl}
              hasStamp={(character.stamps?.length || 0) > 0}
              /* 1.5.8 — the experimental gate rides the edit window's finish
                 row (see finishesHidden's prop note). */
              finishesHidden={finishesHidden}
            />
          </div>
          {/* 1.4.1 — THE STAMP COLOR AND THE STAMP SETTINGS each speak
              their own option (the hue's transparency + the over-trim
              switch in its window; the placement / position / scale /
              rotation / confinement in its own). The HUE is always
              present and always APPLIES ("allow me to have a hue setting
              even when there is no stamp" — the 1.4.5 law: the picked
              hue paints the card with no stamp at all); the SETTINGS
              option greys out and goes silent without a stamp (its own
              tooltip).
              1.4.3 — the two blocks spoke the .gd-look-block framed
              containers (a header strip + hairline + panel wash).
              1.4.4 — THE CONTAINERS ARE RETIRED, THE KEYS ARE REAL
              BUTTONS: the framed seats left with the request — the STAMP
              row speaks a pair of labeled keys.
              1.4.5 — THE EDIT WINDOW KEEPS THE LABELED KEYS, ON ONE ROW
              ("the card edit window one should be the one we have
              currently, but ensure that the stamp settings isnt sliding
              downwards and on the same row as hue color"): this window
              alone speaks the KEY face — the two labeled keys side by
              side in the ROW cluster, the offset bug dead at its root in
              index.css (the locked wrapper's margins zeroed by the
              descendant law). The retired "hue drafts..." helper line under the
              stamp row left with the 1.4.5 law — the hue no longer waits
              for anything. */}
          <div>
            <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">STAMP</div>
            <span className="gd-stamp-settings-cluster">
              <StampColorControls
                color={stampSet.color}
                colorAlpha={stampSet.colorAlpha}
                autoColor={autoColor}
                hueOverTrim={stampSet.hueOverTrim === true}
                onHueOverTrim={(v) => touchStamp((s) => ({ ...s, hueOverTrim: v === true }))}
                onColor={(hexOrNull) => touchStamp((s) => ({ ...s, color: hexOrNull }))}
                onAlpha={(v) => touchStamp((s) => ({ ...s, colorAlpha: v }))}
              />
              <span
                className={clsx(!topStamp && 'gd-locked-key')}
                title={topStamp ? undefined : 'This option requires a stamp'}
              >
                <StampPosControls
                  settings={stampSet}
                  stampAspect={topStampAspect}
                  cardAspect={effectiveCardAspect}
                  onPatch={(patch) => touchStamp((s) => ({ ...s, ...patch }))}
                />
              </span>
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// 1.6.9 — the memo'd default export (see the function head's own note).
export default memo(CharacterView);
