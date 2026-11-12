import { useMemo, useRef } from 'react';
import clsx from 'clsx';
import { Tags as TagsIcon } from 'lucide-react';
import Modal from './Modal.jsx';
import TagRibbon from './TagRibbon.jsx';
import { RichText } from './RichText.jsx';
import { ChipGlyph } from './LucideIconPicker.jsx';
import useThumbSort from './useThumbSort.js';
import { readableInk, stripRichText } from '../utils/helpers.js';

// 1.7.5 — THE TAG PICKER WINDOW ("add an option in setting … when its off …
// it will also make it so when pressing + tags to first open a window that
// shows tags and allow the user to add them, then the tag manager button"):
// while the UNSELECTED TAGS switch is off, the detail view's tags row shows
// only the card's own chips — the full vocabulary needs a DOOR, and this is
// it. One window, the row's own chip law: every tag on a wrap, colored when
// the card wears it, panel when it does not, ONE CLICK toggling it onto the
// card exactly the way the always-visible chips always did. The TAG MANAGER
// key rides the footer (the picker is the FIRST door the + TAGS key opens;
// the manager stays one press away inside it — "then the tag manager
// button"), and DONE closes. While the switch is on this window never
// mounts at all: the + TAGS key opens the manager right away, exactly as it
// always did.
//
// 1.7.9 — THE PICKER EARNS THE WALL'S OWN HAND ("when opening tags in
// unselected tags off mode and it opens teh window, allow me to drag and
// sort them, simmilar to how it works normally"): the picker showed the
// full vocabulary as a bare flex-wrap of chips — no drag, no sort, while
// the wall the mode hides is drag-sortable and the manager list is too.
// The picker speaks the SAME ENGINE the wall does now (useThumbSort in
// geometry mode — the wrap-aware rect snapshot, the 5px click/drag
// threshold, the neighbor glide, the settle flight), and the OFF-mode
// partial-view objection that stands the WALL's chips down never applied
// here: the picker shows the FULL vocabulary in the GLOBAL order, so a
// drag's landing is always faithful — the reorder commits through the same
// onReorderTags door the manager rides (App's reorderTags), the click
// still toggles membership (a drag's trailing click dies with it — the
// engine's own swallow), and the grip reads in the chip's own tooltip,
// exactly as the wall speaks it.
export default function TagPickerModal({
  tags = [],
  character,
  onToggleTag,
  onOpenTagManager,
  onReorderTags,
  onClose,
  // 1.8.0 — THE HINT RIDES THE HELP TEXT SWITCH (the footer's own law,
  // threaded from App — see the footer seat below).
  showHelp = false,
}) {
  const activeIds = useMemo(() => new Set(character?.tags || []), [character]);
  const activeCount = useMemo(() => tags.filter((t) => activeIds.has(t.id)).length, [tags, activeIds]);
  const listRef = useRef(null);
  const { sort, bindItem, itemStyle, dragStyle, sorting } = useThumbSort({
    count: tags.length,
    cols: 1,
    gapX: 8,
    gapY: 8,
    useGeometry: true,
    containerRef: listRef,
    // the chips ARE buttons (toggle on click) — the 0.37.0 button-body law
    // (the wall's own); a real drag's trailing click dies with it (the
    // engine's 1.3.0 swallow) so a reorder never toggles the tag.
    dragButtons: true,
    onCommit: (from, to) => onReorderTags?.(from, to),
    onTap: () => {},
  });

  return (
    <Modal
      title="TAG PICKER"
      onClose={onClose}
      width="w-[560px]"
      footer={
        <div className="flex items-center gap-2 justify-end">
          {/* 1.8.0 — THE HINT RIDES THE HELP TEXT SWITCH ("6 OF 13 ON THIS
              CARD · CLICK TO ADD OR REMOVE · DRAG TO REORDER text in the
              tag viewer during unselected tags off mode should be included
              only in help text turned on mode only and not always"): the
              footer's instruction line is a TEACHING seat, not chrome — it
              joins every other hint in the app behind the footer's own
              HELP TEXT switch, and the keys keep their seats at the rail's
              end alone when the lesson is off. */}
          {showHelp && (
            <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-gd-mute flex-1">
              {activeCount} OF {tags.length} ON THIS CARD · CLICK TO ADD OR REMOVE · DRAG TO REORDER
            </span>
          )}
          {/* the manager door inside the picker — the switch's own promise:
              the picker FIRST, the manager a key away ("then the tag manager
              button"). */}
          <button className="gd-btn" onClick={onOpenTagManager} title="Open the tag manager (create and manage tags)">
            <TagsIcon size={12} />
            TAG MANAGER
          </button>
          <button className="gd-btn gd-btn-solid" onClick={onClose}>
            DONE
          </button>
        </div>
      }
    >
      {tags.length === 0 ? (
        <div className="gd-panel p-3 flex items-center gap-2.5">
          <span className="gd-empty-mark" style={{ fontSize: 16 }}>✖</span>
          <span className="text-[10px] tracking-[0.16em] uppercase text-gd-mute flex-1 min-w-0 truncate">
            No tags yet — open the tag manager to create some
          </span>
        </div>
      ) : (
        <div ref={listRef} className="flex flex-wrap gap-2">
          {tags.map((tag, i) => {
            const active = activeIds.has(tag.id);
            const isDragged = sorting && sort?.from === i;
            return (
              <button
                key={tag.id}
                data-tag-id={tag.id}
                className={clsx(
                  'gd-chip gd-tag-chip !py-1 !px-2 text-[10px]',
                  'gd-sort-item',
                  isDragged && 'is-dragging'
                )}
                style={{
                  ...(active ? { background: tag.color, color: readableInk(tag.color) } : null),
                  ...(isDragged ? dragStyle : itemStyle(i) || null),
                }}
                title={
                  active
                    ? `Remove tag "${stripRichText(tag.name)}" · drag to reorder the tag list`
                    : `Add tag "${stripRichText(tag.name)}" · drag to reorder the tag list`
                }
                onClick={() => onToggleTag?.(character?.id, tag.id)}
                {...bindItem(i)}
              >
                <TagRibbon tag={tag} scale={0.55} className="gd-chip-shape" />
                {tag.icon && <ChipGlyph name={tag.icon} size={10} className="flex-shrink-0" />}
                <RichText text={tag.name} className="gd-tag-label-cap" />
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
