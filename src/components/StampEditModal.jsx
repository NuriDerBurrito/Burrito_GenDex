import { useCallback, useEffect, useRef, useState, useContext } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardPaste, Pencil, Save, Stamp as StampIcon, Star, Upload, X } from 'lucide-react';
import Modal from './Modal.jsx';
import Popover from './Popover.jsx';
import useThumbSort from './useThumbSort.js';
import { SideFlowGhost } from './SideFlow.jsx';
import { buildImageUrl } from '../utils/helpers.js';
import { gdToast } from '../utils/toasts.js';

// 0.45.0 — THE MARKS POP, THEY DON'T FLY. The 0.43/0.44 FLIP-and-flight
// machinery (measure, checkpoint, clone at body level, glide, weld) is
// retired app-wide: it measured rects mid-commit and the clone could leave
// from a stale seat — the "outline snaps to the old index then the new
// one" glitch no amount of checkpointing fully killed. The user's own bar
// settles it: "it should be animated, even if its a pop in pop out, if
// sliding is too much". A scale+opacity POP has no coordinates to misread:
// when the TOP changes hands the old mark pops OUT over the demoted stamp
// and the new mark pops IN over the promoted one (~180ms, the app's house
// curve) — the marks stay WELDED plain spans the rest of the time, exactly
// as the 0.42 law demands.

// 0.23.0 — THE STAMP WINDOW + THE STAMP SLOT ROW + THE ADD-STAMP PICKER.
// One shared kit for both stamp surfaces (the creation dialog and the right
// panel's stamp editor), so every behavior reads the same everywhere.
//
//   · StampEditModal — the window itself: a live preview of the stamp on a
//     transparent-checker board, a NAME field and a pinned CANCEL / SAVE
//     footer built like the creation dialog's action bar. It is the one
//     place a stamp gets named — every upload passes through it before it
//     joins a card, and the slot pencil reopens it to rename an existing
//     stamp.
//
//   · StampSlots — the card's ordered stamp slots (0.24.0 rework):
//       - DRAGGABLE (geometry mode: the strip WRAPS now — no scrollbox, no
//         clipping, no scrollbars — and the drop target is the nearest
//         slot by position, so wrapping never breaks the reorder).
//       - HOVER is the edit state: the art darkens and the pencil BADGE
//         shows. 0.29.0 — the pencil is a VISUAL-ONLY span (the old
//         inset-0 button covered the whole slot and swallowed every drag:
//         "the edit mode covers the grab mode"). A plain CLICK opens the
//         stamp window; HOLD + 5px of movement grabs the stamp for
//         dragging — from anywhere on the slot, even mid-hover. One
//         tooltip says it all: "drag to rearrange, click to edit".
//       - hover shows the X (remove) and the STAR (make-this-the-top,
//         filled yellow while it already IS the top). 0.26.0 — both keys
//         sit ON the slot's corners, OUTSIDE the stamp container: X at the
//         TOP-RIGHT corner, star at the TOP-LEFT corner — the art stays
//         clean and the keys read as tags pinned to the slot.
//
//   · StampAddButton — the ADD key: opens the picker popover with every
//     stamp in the gallery as a generous TILE (the old 30px rows were hard
//     to tell apart); stamps already on this card are GREYED OUT (creation
//     window, 0.26.0) or not shown (character panel). UPLOAD A STAMP picks
//     the files and hands them to the parent for the naming queue.
//
//   · useStampNamingQueue — the upload flow: one window per picked file
//     ("2 of 5"), SAVE commits that stamp and advances, CANCEL drops the
//     rest. Parents decide what "commit" means (draft slot vs character).

// ---------------------------------------------------------------------------
// The stamp window — preview + name + SAVE.
// ---------------------------------------------------------------------------
export default function StampEditModal({ stampUrl, initialName = '', isNew = true, counter = null, onClose, onSave }) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select?.();
  }, []);

  // ESCAPE ISOLATION — this window often sits ON TOP of the creation dialog
  // or the character panel. The Modal's own Escape listener lives on window
  // (bubble), so a CAPTURE-phase stop here swallows the key before it can
  // reach the parent: pressing Escape closes THIS window only, never the
  // dialog underneath (whose Escape would discard the whole draft).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const save = () => onSave?.(String(name || '').trim() || 'stamp');

  return (
    <Modal
      title={isNew ? 'SAVE STAMP' : 'EDIT STAMP'}
      onClose={onClose}
      width="w-[430px]"
      footer={
        <div className="flex justify-end">
          <div className="gd-foot-bar">
            <button className="gd-btn" onClick={onClose}>
              CANCEL
            </button>
            <button className="gd-btn gd-btn-solid" onClick={save} title="Save the stamp with this name">
              <Save size={13} />
              SAVE
            </button>
          </div>
        </div>
      }
    >
      <div className="flex items-center gap-4">
        {/* The stamp itself, live on a transparent checker — exactly the
            art the card will paint. */}
        <div className="gd-stamp-edit-preview flex-shrink-0" title="The stamp as the card will show it">
          {stampUrl ? <img src={stampUrl} alt="" draggable={false} /> : null}
        </div>
        <div className="flex-1 min-w-0">
          {counter && <div className="gd-rule mb-2">STAMP {counter}</div>}
          <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">NAME</div>
          <input
            ref={inputRef}
            className="gd-input"
            spellCheck={false}
            value={name}
            placeholder="e.g. studio logo"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
            }}
            title="The stamp's name: it shows in the stamp pickers and the filter list"
          />
          <p className="mt-2 text-[9px] leading-relaxed text-gd-mute">
            {isNew
              ? 'Give the stamp a name and save it: it joins this card and your stamp library.'
              : 'Rename the stamp: every picker and the filter list read the update.'}
          </p>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// 0.38.0 — THE STAMP PASTE TILE ("add a paste area for the stamp too when
// creating a new character just like the image one"): a dashed 44px square
// beside the ADD key — the same footprint as an empty slot, the same gesture
// as the image grid's PASTE tile. Pressing it grabs the clipboard's image
// through the main process and hands the record to the parent's naming
// queue, exactly like an upload pick.
// 0.39.0 — THE VERDICT SPEAKS ("the tag paste area is missing the
// noticification feedback that the others do, same with the image,
// implement them"): the stamp paste surfaces answer with the SAME toasts the
// stage's PASTE key fires — a green "stamp pasted" while the naming window
// opens, the red "no image on the clipboard" when there is nothing there.
// ---------------------------------------------------------------------------
export function StampPasteTile({ onPaste, disabled = false }) {
  const [busy, setBusy] = useState(false);
  const grab = async () => {
    if (busy || disabled) return;
    setBusy(true);
    try {
      const img = await window.api?.clipboardReadImage?.();
      if (!img?.base64) {
        gdToast('No image on the clipboard', 'fail');
        return;
      }
      const rec = await window.api.saveImageBuffer(img.base64, img.ext || '.png');
      if (rec) {
        gdToast('Stamp pasted');
        onPaste?.([rec]);
      } else {
        gdToast('Paste failed', 'fail');
      }
    } catch {
      gdToast('Paste failed', 'fail');
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      className="gd-stamp-paste"
      disabled={busy || disabled}
      title="Paste the clipboard image as a stamp"
      onClick={grab}
    >
      <ClipboardPaste size={14} />
      <span className="gd-stamp-paste-label">PASTE</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// The slot row — hover to edit (darken + pencil), click to open the window,
// hold + move to drag. Star promotes, cross removes.
// 0.41.0 — THE STRIP IS ONE FLOW: `children` (the ADD key, the PASTE tile,
// the settings cluster…) render INSIDE the same wrapping container as the
// slots, so everything shares one flex-wrap line law — the tiles fill the
// leftover room on each row like any stamp would, instead of the slots'
// container being one opaque block that shoves them onto a forced new line
// ("the add and paste areas for some reason are taking a whole new line
// even tho there is space"). The children are NOT sort items (no
// gd-sort-item class) — the sort's snapshot filters them out, and the
// layout simulation declines strips that carry them (it can only pack what
// it can measure), so the reorder rides the honest rect-swap glide.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 1.1.9 — THE SLOT LIST, BARE: the panel's strip hands the zone its slot
// list as DIRECT children (the zone owns the .gd-stamp-slots flow wrapper
// now — SideFlowZone's flowClass seat, so the twin-block side split can
// reach the slots). StampSlotList is the whole engine + slots + window
// WITHOUT a wrapper of its own; StampSlots (below) keeps the classic
// .gd-stamp-slots wrapper for every other consumer (the creation window),
// unchanged, and feeds it its own stripRef.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 1.1.9 — ONE SLOT, AS AN ELEMENT: the panel's stamps strip needs the
// slots as DIRECT children of its SideFlowZone (the zone's twin-block side
// split slices the ITEM list — a component's output is opaque to React's
// children, so the slots must be elements at the call site). StampSlotItem
// is the whole slot markup (marks, star, X, edit badge) driven by the
// caller's engine; StampSlotList's map and the panel's strip both render
// through it — one source of truth.
// ---------------------------------------------------------------------------
export function StampSlotItem({ stamp, i, stamps, imagesPath, engine, onOpenWindow }) {
  const { sort, bindItem, itemStyle, dragStyle, sorting } = engine;
  const isDragged = sorting && sort?.from === i;
  // 0.34.0 — `is-top` no longer paints the outline itself: the ring
  // is a span (below), a hook for tests.
  const isTop = i === 0 && stamps.length > 1;
  return (
            <div
              className={clsx('gd-stamp-slot gd-sort-item', isTop && 'is-top', isDragged && 'is-dragging')}
              style={{
                ...(isDragged ? dragStyle : itemStyle(i) || {}),
                // 0.42.0 — THE TOP SLOT OUT-RANKS THE RIDE ("the top
                // label/outline around stamps moves … it should be above
                // their layer"): while a sort runs, the slot carrying the TOP
                // ring + tab sits ABOVE every other slot — including the one
                // being dragged (z 40) — so the marks never dip under a
                // passing stamp again.
                // 0.47.0 — THE RIDE OUT-RANKS THE MARKS (the manager's new
                // law, applied here too): the slot IN THE HAND rides at
                // z 50, above the TOP slot's 45; a parked TOP slot keeps its
                // marks above the gliding neighbors.
                ...(!isDragged && (isTop || i === 0) && sorting ? { zIndex: 45 } : null),
                ...(isDragged ? { zIndex: 50 } : null),
              }}
      {...bindItem(i)}
      role="button"
              tabIndex={0}
              title={`${stamp.name || 'stamp'}: drag to rearrange, click to edit`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenWindow?.(i);
                }
              }}
            >
              {/* 0.42.0 — THE MARKS ARE WELDED, NOT FLOWN: plain absolute
                  spans ride the slot's own box — CSS welds them; no
                  measurement, no drift, ever.
                  0.45.0 — THE HAND-OFF POPS: keyed by the TOP STAMP'S OWN
                  ID, the wrapper mounts fresh whenever the top changes hands
                  (promote, reorder landing a new stamp in front) — the old
                  mark pops out over the demoted stamp, the new one pops in
                  over the promoted one. No rects, no clones, no stale seats. */}
              <AnimatePresence initial={false}>
                {isTop && (
                  <motion.span
                    key={stamps[0].id}
                    className="gd-stamp-topmark"
                    aria-hidden
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.18, ease: [0.25, 0.9, 0.35, 1] }}
                  >
                    <span className="gd-stamp-topring" />
                    <span className="gd-stamp-slot-top">TOP</span>
                  </motion.span>
                )}
              </AnimatePresence>
              {/* 1.3.6 — THE ART DECODES OFF THE CRITICAL PATH ("the stamps
                  area is also blank while the right pannel is opening then
                  all the stamps summon in"): the slots' fixed 44x44 boxes
                  paint with the zone's first frame, but the art itself
                  popped in as each image finished decoding on the main
                  thread. decoding="async" tells Chromium to decode the
                  stamp art on its own schedule (the compositor's raster
                  pool, off the panel flight's frames) — the frames are
                  there the moment the zone mounts, the art arrives as it
                  decodes, and neither waits on the other. The probe's
                  stand-ins (SideFlowZone's uniformItems) already halved
                  the decode count — this is the live half. */}
              <img src={buildImageUrl(imagesPath, stamp.image)} alt="" draggable={false} decoding="async" />
              {/* The STAR — make this the top stamp (hover, bottom-left).
                  Filled yellow while it already is the top one. */}
              <button
                type="button"
                className={clsx('gd-stamp-slot-star', i === 0 && 'is-on')}
                title={i === 0 ? 'Top stamp: the one the card shows' : 'Make this the top stamp'}
                onClick={(e) => {
                  e.stopPropagation();
                  if (i > 0) engine.onPromote?.(i);
                }}
              >
                <Star size={9} strokeWidth={2.5} fill={i === 0 ? '#f6c945' : 'none'} style={i === 0 ? { color: '#f6c945' } : undefined} />
              </button>
              {/* The X — remove (hover, top-right). */}
              <button
                type="button"
                className="gd-stamp-slot-x"
                title="Remove this stamp"
                onClick={(e) => {
                  e.stopPropagation();
                  engine.onRemove?.(i);
                }}
              >
                <X size={8} strokeWidth={3} />
              </button>
              {/* 0.29.0 — the EDIT AFFORDANCE is a visual-only BADGE: the old
                  inset-0 button covered the slot and ate every drag ("the
                  edit mode covers the grab mode"). Clicking the slot opens
                  the stamp window; holding + moving drags — the pencil just
                  POINTS at the edit state. */}
              <span className="gd-stamp-slot-edit" aria-hidden="true">
                <Pencil size={13} />
              </span>
            </div>
);
}

export function StampSlotList({ stamps, imagesPath, onRemove, onPromote, onReorder, onRename, containerRef = null, children = null }) {
  const [windowIdx, setWindowIdx] = useState(null);

  // The smooth pointer sort — GEOMETRY mode, because the strip wraps. The
  // container is the caller's flow element (the zone's wrapper in the
  // panel, .gd-stamp-slots in the creation window) — the same seat the
  // wrapper used to carry before the extraction. The engine object carries
  // the slot actions beside the sort machinery (StampSlotItem reads them
  // off one handle).
  const sortEngine = useThumbSort({
    count: stamps.length,
    cols: 1,
    gapX: 8,
    useGeometry: true,
    containerRef,
    onCommit: (from, to) => onReorder?.(from, to),
    // A plain click (no movement) opens the stamp window; the hover state
    // (darkened art + pencil badge) is the edit affordance. The sort engages
    // after 5px of movement, so a hold that MOVES drags — the pencil badge
    // never blocks the grab (it is pointer-events: none).
    onTap: (i) => setWindowIdx(i),
  });
  const engine = {
    ...sortEngine,
    onPromote: (i) => onPromote?.(i),
    onRemove: (i) => onRemove?.(i),
  };

  const editing = windowIdx != null && stamps[windowIdx] ? windowIdx : null;

  const openWindow = (i) => setWindowIdx(i);

  return (
    <>
                {stamps.map((s, i) => (
          <StampSlotItem
            key={s.id}
            stamp={s}
            i={i}
            stamps={stamps}
            imagesPath={imagesPath}
            engine={engine}
            onOpenWindow={openWindow}
          />
        ))}
        {/* 0.41.0 — the strip's own trailing crew rides INLINE (see the
            header note): ADD, PASTE, the settings cluster — one wrapping
            flow, one law. */}
        {children}

      {editing != null && stamps[editing] && (
        <StampEditModal
          stampUrl={buildImageUrl(imagesPath, stamps[editing].image)}
          initialName={stamps[editing].name || ''}
          isNew={false}
          onClose={() => setWindowIdx(null)}
          onSave={(name) => {
            onRename?.(editing, name);
            setWindowIdx(null);
          }}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// THE CLASSIC WRAPPER (every consumer but the panel's strip): the same
// .gd-stamp-slots law and the same public shape StampSlots has always had —
// a thin shell around StampSlotList that owns the wrapper element and hands
// the engine its own stripRef.
// ---------------------------------------------------------------------------
export function StampSlots({ stamps, imagesPath, onRemove, onPromote, onReorder, onRename, children = null }) {
  const stripRef = useRef(null);
  return (
    <div className="gd-stamp-slots" ref={stripRef}>
      <StampSlotList
        stamps={stamps}
        imagesPath={imagesPath}
        onRemove={onRemove}
        onPromote={onPromote}
        onReorder={onReorder}
        onRename={onRename}
        containerRef={stripRef}
      >
        {children}
      </StampSlotList>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The ADD key + picker popover — the gallery as generous tiles, plus the
// upload. 0.26.0 — `greyAttached`: stamps already on the card render as
// GREYED-OUT tiles instead of being hidden (the creation window wants the
// whole gallery visible; the character panel's editor keeps hiding them).
// 0.38.0 — the footer grows a PASTE key beside UPLOAD ("add a paste area
// for the stamp too… just like the image one"): the clipboard's image joins
// the same naming queue an upload pick rides.
// ---------------------------------------------------------------------------
export function StampAddButton({
  stampLibrary = [],
  imagesPath,
  attachedImages,
  onPick,
  onUpload,
  onPaste = null,
  disabled = false,
  greyAttached = false,
  // 1.2.0 — THE + STAMPS KEY UNDER THE TITLE ("add + tags and + stamps
  // below the name of them, so there is another easy way to access it
  // right below their titles"): a counter a caller increments to open the
  // picker from OUTSIDE this tile (the detail panel's + STAMPS key under
  // the STAMPS label). Every change opens the popover; 0/undefined never
  // fires, so every other call site stays exactly as it was.
  openSignal = 0,
  // 1.2.4 — THE POPOVER OPENS FROM THE + KEY ITSELF ("the +stamp popup
  // should open at the + button's own position, it currently opens at the
  // settings' position"): the openSignal used to open the picker anchored
  // at THIS tile — the ADD key riding the strip's tail beside PASTE and
  // the settings cluster, so the window popped way off at the strip's end
  // while the key the user pressed sat far left under the label. A ref to
  // the caller's own + key: when the signal opens the picker, the popover
  // anchors THERE (the key the user actually pressed); the tile's own
  // click still anchors at the tile.
  signalAnchorRef = null,
}) {
  // 1.2.2 — THE GHOST SEAT ("pressing on +stamps opens two wstamp windows,
  // fix that"): this tile renders TWICE inside a side-flow zone — once in
  // the live strip, once in the invisible measurement twin. The twin's copy
  // never receives a click (its seat is pointer-events: none), but the
  // openSignal arrives at BOTH copies, and the twin's popover PORTALS to
  // the body — a second ADD STAMP window painted beside the real one. In
  // the ghost seat the picker simply does not exist: the signal is ignored
  // and the popover never mounts. The tile's box (what the twin measures)
  // is exactly the same either way.
  const ghost = useContext(SideFlowGhost);
  const [open, setOpen] = useState(false);
  // 1.2.4 — WHICH KEY OPENED IT decides the anchor: the tile's own btnRef
  // (a click on the ADD tile) or the caller's + key (the openSignal path —
  // signalAnchorRef). The state holds the ref OBJECT; Popover re-places
  // when the identity moves. Null means the tile's own key.
  const [anchorOverride, setAnchorOverride] = useState(null);
  const lastSignalRef = useRef(openSignal);
  useEffect(() => {
    if (openSignal && openSignal !== lastSignalRef.current) {
      lastSignalRef.current = openSignal;
      if (!disabled && !ghost) {
        setAnchorOverride(signalAnchorRef || null);
        setOpen(true);
      }
    }
  }, [openSignal, disabled, ghost, signalAnchorRef]);
  const [busy, setBusy] = useState(false);
  const [pasting, setPasting] = useState(false);
  const btnRef = useRef(null);
  const attached = attachedImages instanceof Set ? attachedImages : new Set(attachedImages || []);
  // 0.24.0 — stamps already on the card are NOT SHOWN ("dont just greyout
  // and on the stamps already added, instead dont show them") — 0.26.0
  // walks that back FOR THE CREATION WINDOW ONLY (greyAttached): every
  // tile stays visible, the attached ones dimmed and inert.
  const tiles = greyAttached
    ? (stampLibrary || []).map((tpl) => ({ tpl, onCard: attached.has(tpl.image) }))
    : (stampLibrary || []).filter((tpl) => !attached.has(tpl.image)).map((tpl) => ({ tpl, onCard: false }));

  const upload = async () => {
    if (busy || disabled) return;
    setBusy(true);
    setOpen(false);
    try {
      const records = await window.api.importImagesFromFiles();
      if (records?.length) onUpload?.(records);
    } finally {
      setBusy(false);
    }
  };

  // 0.38.0 — the picker's own PASTE key: same read as the tile, kept in the
  // pinned footer so it is always reachable no matter how deep the gallery.
  // 0.39.0 — same toast verdicts as the tile.
  const pasteFromClipboard = async () => {
    if (pasting || disabled || !onPaste) return;
    setPasting(true);
    try {
      const img = await window.api?.clipboardReadImage?.();
      if (!img?.base64) {
        gdToast('No image on the clipboard', 'fail');
        return;
      }
      const rec = await window.api.saveImageBuffer(img.base64, img.ext || '.png');
      if (rec) {
        gdToast('Stamp pasted');
        setOpen(false);
        onPaste([rec]);
      } else {
        gdToast('Paste failed', 'fail');
      }
    } catch {
      gdToast('Paste failed', 'fail');
    } finally {
      setPasting(false);
    }
  };

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={btnRef}
        type="button"
        className="gd-stamp-slot is-empty"
        disabled={busy || disabled}
        title="Add a stamp"
        onClick={() => {
          setAnchorOverride(null); // the tile's own key — the tile's own anchor
          setOpen((o) => !o);
        }}
      >
        <span className="flex flex-col items-center gap-1">
          <StampIcon size={14} />
          <span className="text-[7px] font-bold tracking-[0.12em]">ADD</span>
        </span>
      </button>
      {/* 0.37.0 — PINNED HEADER + FOOTER, SCROLLING MIDDLE ("the header of
          the stamp menu would clip out of the window… ensure that the
          button to add a new stamp would act as a footer so its always
          there, and then scroll to select any stamp"): the popover renders
          in innerScroll mode — its card is a flex column when capped, so
          the ADD STAMP head stays pinned at the top, the UPLOAD key rides
          as a pinned footer above the bottom edge, and only the tile list
          between them scrolls. No matter how deep the gallery runs (or how
          low on the screen the picker opens), the title and the upload are
          always on screen. 1.2.2 — the ghost seat never mounts it (see the
          ghost note above). */}
      {!ghost && (
      <Popover open={open} onClose={() => setOpen(false)} anchor={anchorOverride || btnRef} width={268} align="start" innerScroll>
        <div className="p-2 flex flex-col min-h-0 flex-1">
          <div className="gd-pop-head flex-shrink-0">ADD STAMP</div>
          {/* 0.36.0 — NO INNER CAP ("the add stamp window should not be
              scrollable"): the picker's old 240px inner scrollbox made the
              gallery window tiny no matter how much screen there was. The
              popover's own extend/flip ladder owns the sizing now — the
              tiles flow at natural height and the window only scrolls when
              the whole screen can't fit it (0.37.0: and then only THIS
              middle section does). */}
          <div className="mt-1.5 flex-1 min-h-0 overflow-y-auto">
            {tiles.length === 0 && (
              <p className="px-1 py-1.5 text-[10px] leading-relaxed" style={{ color: 'var(--gd-mute)' }}>
                {stampLibrary.length > 0
                  ? 'Every stamp in the gallery is already on this card: upload a new one below.'
                  : 'No stamps yet: upload one below; every stamp you save joins the gallery.'}
              </p>
            )}
            <div className="gd-spot-tiles">
              {/* 0.30.0 — the picker's tiles wear the same SLOT-STYLE art box
                  as the spotlight section ("mimic the containers of the
                  stamps, plus the name") — one container language for every
                  stamp surface.
                  1.1.2 — THE FILTERS' CONTAINER ("when pressing on add stamp
                  in details pannel, mimic the container of the stamps in the
                  filters section, since its utilizing an old one"): the
                  0.31.0 BARE language is the current one — no outer frame
                  around the [box + name] pair, the 44px art box IS the
                  container (its own border, its own hover ring), the name a
                  bare label beneath. The old framed tile survives only in
                  this picker — it speaks the filters section's grammar now,
                  greyed attached art and all. */}
              {tiles.map(({ tpl, onCard }) => (
                <button
                  key={tpl.id}
                  type="button"
                  className={clsx('gd-spot-tile is-bare', onCard && 'is-attached')}
                  disabled={onCard}
                  title={onCard ? `${tpl.name}: already on this card` : `${tpl.name}: add to this card`}
                  onClick={() => {
                    onPick?.(tpl);
                    setOpen(false);
                  }}
                >
                  <span className="gd-spot-tile-box">
                    {/* 1.1.4 — THE TILE READS THE PREVIEW when one exists
                        (the generator builds prevs for the stamp library
                        too — "include the stamps images too in the generate
                        thumbnail feature"): a whole library tiles at once
                        here, and the 340px prev decodes far cheaper than
                        the full-res art. No prev yet (old libraries,
                        undecodable sources) keeps the original exactly as
                        before. */}
                    <img src={buildImageUrl(imagesPath, tpl.prev || tpl.image)} alt="" loading="lazy" decoding="async" />
                  </span>
                  <span className="gd-spot-tile-name">{tpl.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 pt-2 gd-hairline-t flex-shrink-0">
            <div className="gd-stamp-picker-actions">
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-2 py-1.5 rounded text-left text-[11px] font-semibold hover:bg-[color-mix(in_srgb,var(--gd-accent)_14%,transparent)]"
                style={{ color: 'var(--gd-panel-text)' }}
                onClick={upload}
              >
                <Upload size={12} />
                UPLOAD A STAMP
              </button>
              {onPaste && (
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 px-2 py-1.5 rounded text-left text-[11px] font-semibold hover:bg-[color-mix(in_srgb,var(--gd-accent)_14%,transparent)]"
                  style={{ color: 'var(--gd-panel-text)' }}
                  disabled={pasting}
                  onClick={pasteFromClipboard}
                >
                  <ClipboardPaste size={12} />
                  PASTE
                </button>
              )}
            </div>
          </div>
        </div>
      </Popover>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The upload naming queue — one stamp window per picked file.
// SAVE commits that stamp (onSaveOne(record, name)) and advances; CANCEL
// drops the rest. Renders the current window (or nothing).
// ---------------------------------------------------------------------------
export function useStampNamingQueue(imagesPath, onSaveOne) {
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const saveRef = useRef(onSaveOne);
  // (the naming queue's LIVE MIRROR — the same idiom App's expandedCardsRef
  // and every once-bound listener in this app speaks; the assignment is the
  // hook's whole point, not a render-time read)
  // eslint-disable-next-line react-hooks/refs
  saveRef.current = onSaveOne;

  const current = queue[idx] || null;

  const push = useCallback((records) => {
    if (records?.length) {
      setQueue(records);
      setIdx(0);
    }
  }, []);

  const close = useCallback(() => {
    setQueue([]);
    setIdx(0);
  }, []);

  // Advancing past the end closes the queue on its own.
  useEffect(() => {
    if (queue.length && idx >= queue.length) close();
  }, [idx, queue.length, close]);

  const saveOne = (name) => {
    if (current) saveRef.current?.(current, String(name || '').trim() || 'stamp');
    setIdx((i) => i + 1);
  };

  const modal = current ? (
    <StampEditModal
      stampUrl={buildImageUrl(imagesPath, current.file)}
      initialName=""
      isNew
      counter={queue.length > 1 ? `${idx + 1} OF ${queue.length}` : null}
      onClose={close}
      onSave={saveOne}
    />
  ) : null;

  // 1.5.4 — close rides the return now too: the creation window's retained
  // seat clears any orphaned naming windows when a fresh open resets the
  // draft (a queue caught mid-flight at close would otherwise reappear on
  // the next open, naming stamps into a draft that never asked for them).
  return { push, close, modal, naming: !!current };
}
