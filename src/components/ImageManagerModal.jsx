import { useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardPaste, ImagePlus, Star, Trash2 } from 'lucide-react';
import Modal from './Modal.jsx';
import useThumbSort from './useThumbSort.js';
import { buildImageUrl } from '../utils/helpers.js';

// 0.30.0 — THE IMAGE MANAGER ("add also a button for image manager which
// will open a window and show all the images in containers (similar to the
// stamp containers) and would give the option to order them around, to
// delete or add more of course").
//
// One window over a version's image list: the images lay out as wrapping
// CONTAINERS in the stamp-slot language (framed squares, cover-fit art,
// COVER badge on the first), dragged to reorder with the same smooth
// pointer sort the stamps use (nearest-container drop targets, so wrapping
// never breaks the sort). Hover shows the STAR (make cover) and the X
// (delete — confirm-gated). The footer carries ADD (the file dialog) and
// PASTE (the clipboard image — its verdict arrives through the stage's
// top-of-screen pill, which paints above this window). The list re-renders
// live — the stage above follows along as the order changes.
//
// 0.42.0 — THE MOVING MARKS ARE WELDED NOW (same law as the stamp slots'
// TOP tab): the old framer-motion shared-layout spans measured in viewport
// coordinates, so a re-render landing after a scroll or a resize ANIMATED
// the ring and badge from a stale rect — they drifted off their slot. Plain
// absolute spans ride the slot's own box; and while a sort runs, the slots
// carrying the COVER badge and the SELECTION ring sit ABOVE the ride (z 45
// over the dragged tile's 40), so the marks never dip under a passing
// image ("the top label/outline around top image … should be above their
// layer").
export default function ImageManagerModal({
  images,
  imagesPath,
  selectedIndex,
  overViewer = false,
  onReorder,
  onSetCover,
  onDelete,
  onAddImages,
  onPasteImage,
  onPick,
  // 0.41.0 — THE BIG PREVIEW HANDOFF: a plain click on a slot opens the huge
  // image viewer on THAT picture — the manager itself stays open underneath
  // (its selection ring never moves, the stage behind keeps its highlight).
  onOpenViewer = null,
  onClose,
  confirm,
}) {
  const stripRef = useRef(null);
  const [busy, setBusy] = useState(false);
  // 0.45.0 — THE MARKS POP BETWEEN TILES (see the StampSlots note — the
  // flight is retired): the COVER badge and the SELECTION ring are keyed by
  // their OWNERS (the image file they mark), so a change of hands pops the
  // old mark out and the new one in (~180ms). A plain REORDER doesn't pop
  // anything — the ring rides its own tile through the glide, the settle
  // and the atomic commit, so the let-go reads as one continuous motion
  // with nothing left to snap ("it bugs the current image outline to snap
  // to the old index to the new index").

  const { sort, bindItem, itemStyle, dragStyle, sorting } = useThumbSort({
    count: images.length,
    cols: 1,
    gapX: 10,
    gapY: 10,
    useGeometry: true,
    containerRef: stripRef,
    onCommit: (from, to) => onReorder?.(from, to),
    // 0.41.0 — a plain click OPENS THE BIG PREVIEW on that image (the call
    // routes through onPick — see the prop note above); it no longer selects
    // the stage's image and no longer closes the manager.
    onTap: (i) => onPick?.(i),
  });

  const pickLabel = useMemo(
    () => (images.length === 0 ? 'No images yet' : `${images.length} image${images.length === 1 ? '' : 's'}`),
    [images.length]
  );

  const add = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onAddImages?.();
    } finally {
      setBusy(false);
    }
  };

  const askDelete = (index) => {
    const img = images[index];
    if (!img) return;
    confirm({
      title: 'DELETE IMAGE',
      message: `Delete image ${index + 1} of ${images.length} from this version? This cannot be undone.`,
      confirmLabel: 'DELETE',
      danger: true,
      /* 1.7.4 — THE ASK RIDES ABOVE EVERY WINDOW (\"when deleting an image
         through the image manager window (and while also inside the huge
         image preview), the confirmation window should be above the windows
         not below it\"): while this manager rides the over-viewer lane the
         ask MUST clear BOTH the viewer's 900 veil and this window's own 920
         lane — App threads the flag into ConfirmModal's overAll seat (z
         960). On the classic lane the ask keeps the classic seat exactly
         as it always spoke it (it already mounts above this window by DOM
         order). */
      overAll: overViewer === true,
      onConfirm: () => onDelete?.(index),
    });
  };

  return (
    <Modal
      title="IMAGE MANAGER"
      onClose={onClose}
      width="w-[600px]"
      /* 1.7.3 — THE OVER-VIEWER LANE ("image manager should open on it,
         dont close the big image preview then open image manager"): while
         the viewer's own menu asked for this window the flag seats the
         layer at z 920 — ABOVE the still-open big preview (Modal's
         overViewer prop + .gd-modal-layer.is-over-viewer in index.css).
         Opened from the stage's own keys the flag is false and the
         window keeps the classic 200 lane — the 0.41.0 slot-click flow
         still seats the viewer ABOVE this manager exactly as before. */
      overViewer={overViewer}
      footer={
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-gd-mute flex-1">
            {pickLabel.toUpperCase()} · DRAG TO ORDER · FIRST = COVER
          </span>
          {/* 0.32.0 — the ADD key's tooltip stopped advertising paste
              ("since paste has its own way") — the PASTE key right beside
              it is that way. */}
          <button className="gd-btn" onClick={add} disabled={busy} title="Browse for images">
            <ImagePlus size={12} />
            ADD
          </button>
          <button className="gd-btn" onClick={onPasteImage} title="Paste the clipboard image (no-op if none)">
            <ClipboardPaste size={12} />
            PASTE
          </button>
          <button className="gd-btn gd-btn-solid" onClick={onClose}>
            DONE
          </button>
        </div>
      }
    >
      {/* 1.7.5 — THE EMPTY SEAT FITS THE ROW ("when i delete all images while
          image manager is open, image manager gets the nop images yet label
          but the label is too big, it should fit into the row and have the
          bottons on same row too, aka just fit it in and make it fit"): the
          old empty state stacked a 72px ✖, the label and a SECOND button
          row into a tall centered block — the window grew a storey the
          moment the last picture left. The empty seat is ONE COMPACT ROW
          now: a small mark, the label, and the ADD / PASTE keys riding the
          same line — the footer's own row keeps its seats underneath, and
          the window never grows for an empty version. */}
      {images.length === 0 ? (
        <div className="gd-panel p-3 flex items-center gap-2.5">
          <span className="gd-empty-mark" style={{ fontSize: 16 }}>✖</span>
          <span className="text-[10px] tracking-[0.16em] uppercase text-gd-mute flex-1 min-w-0 truncate">
            No images in this version
          </span>
          <button className="gd-btn" onClick={add} disabled={busy}>
            <ImagePlus size={12} />
            ADD
          </button>
          <button className="gd-btn" onClick={onPasteImage}>
            <ClipboardPaste size={12} />
            PASTE
          </button>
        </div>
      ) : (
        <div className="gd-img-manager-slots" ref={stripRef}>
          {images.map((img, i) => {
            const isDragged = sorting && sort?.from === i;
            // 0.47.0 — THE RIDE OUT-RANKS THE MARKS ("the selected image
            // when dragged around should always be above all including
            // current and top image"): the dragged tile now sits at z 50 —
            // ABOVE the marked slots (45), which stay above the gliding
            // neighbors (5). The 0.42 law (marks never sink under traffic)
            // is refined, not repealed: a tile parked on its slot keeps its
            // marks on top of passers-by, but the tile IN THE HAND always
            // wins — including over the current-image ring and the cover
            // badge.
            const markZ = !isDragged && sorting && (i === 0 || i === selectedIndex) ? 45 : null;
            return (
              <div
                key={img.file}
                className={clsx('gd-img-slot gd-sort-item', i === 0 && 'is-cover', isDragged && 'is-dragging')}
                style={{
                  ...(isDragged ? dragStyle : itemStyle(i) || {}),
                  ...(markZ != null ? { zIndex: markZ } : null),
                  ...(isDragged ? { zIndex: 50 } : null),
                }}
                {...bindItem(i)}
                title={i === 0 ? 'Cover: drag to order, click for the big preview' : 'Drag to order, click for the big preview'}
              >
                <img src={buildImageUrl(imagesPath, img.thumb || img.file)} alt="" draggable={false} />
                {/* 0.42.0 — welded marks: plain spans riding the slot's own
                    box. 0.45.0 — keyed by their OWNERS and wrapped in
                    AnimatePresence, so a change of hands POPS (out on the
                    old tile, in on the new one) instead of blinking or
                    snapping. */}
                <AnimatePresence initial={false}>
                  {i === 0 && (
                    <motion.span
                      key={`cover-${img.file}`}
                      className="gd-img-slot-cover"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.18, ease: [0.25, 0.9, 0.35, 1] }}
                    >
                      COVER
                    </motion.span>
                  )}
                </AnimatePresence>
                <AnimatePresence initial={false}>
                  {i === selectedIndex && (
                    <motion.span
                      key={`ring-${img.file}`}
                      className="gd-img-slot-ring"
                      aria-hidden
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ duration: 0.18, ease: [0.25, 0.9, 0.35, 1] }}
                    />
                  )}
                </AnimatePresence>
                <button
                  type="button"
                  className={clsx('gd-img-slot-star', i === 0 && 'is-on')}
                  title={i === 0 ? 'Cover: already first' : 'Make this the cover'}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (i > 0) onSetCover?.(i);
                  }}
                >
                  <Star size={9} strokeWidth={2.5} fill={i === 0 ? '#f6c945' : 'none'} style={i === 0 ? { color: '#f6c945' } : undefined} />
                </button>
                <button
                  type="button"
                  className="gd-img-slot-x"
                  title="Delete this image"
                  onClick={(e) => {
                    e.stopPropagation();
                    askDelete(i);
                  }}
                >
                  <Trash2 size={8} strokeWidth={2.6} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
