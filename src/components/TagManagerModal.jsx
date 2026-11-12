import { memo, useCallback, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Check, GripVertical, Pencil, Plus, Tag as TagIcon, Trash2, X } from 'lucide-react';
import Modal from './Modal.jsx';
import LucideIconPicker from './LucideIconPicker.jsx';
import TagRibbon from './TagRibbon.jsx';
import useThumbSort from './useThumbSort.js';
import useScrollbarBreath from './useScrollbarBreath.js';
import { ColorPickerButton } from './ColorPicker.jsx';
import { RichText, default as RichInput } from './RichText.jsx';
import { CHIP_COLORS, TAG_TRIMS } from '../constants/index.js';
import { stripRichText } from '../utils/helpers.js';

// Trim option button — draws the actual shape it selects.
function TrimPreview({ trim, active, onClick }) {
  const label = TAG_TRIMS.find((t) => t.id === trim)?.label;
  const ink = active ? 'var(--gd-accent)' : 'var(--gd-mute)';
  return (
    <button
      className={clsx('gd-btn !px-2.5 !py-1.5', active && 'gd-btn-accent')}
      title={label}
      onClick={onClick}
    >
      {/* 1.0.8 — POINT joins the polygon family (square body, triangular
          foot). BEAD cannot be a polygon (a stem ending in a circle), so its
          miniature draws the two parts directly: a thin stem over a round
          bead — the shape whose full-size twin carries the icon inside. */}
      {trim === 'bead' ? (
        <span className="flex flex-col items-center w-3.5" aria-hidden>
          <span style={{ width: 4, height: 8, background: ink }} />
          <span style={{ width: 13, height: 13, borderRadius: '50%', background: ink, marginTop: -1 }} />
        </span>
      ) : (
        <span
          className="block w-3.5"
          style={{
            height: 18,
            background: ink,
            clipPath:
              trim === 'v'
                ? 'polygon(0 0, 100% 0, 50% 100%)'
                : trim === 'notch'
                  ? 'polygon(0 0, 100% 0, 100% 100%, 50% 66%, 0 100%)'
                  : trim === 'point'
                    ? 'polygon(0 0, 100% 0, 100% 55%, 50% 100%, 0 55%)'
                    : undefined,
            borderRadius: trim === 'straight' ? '0 0 3px 3px' : undefined,
          }}
        />
      )}
      {label?.toUpperCase()}
    </button>
  );
}

// Memoized existing-tag row — dragging the color wheel or typing in the name
// field never re-renders the whole list. 0.30.0: the row is a DRAG SORT item
// (bindItem from useThumbSort reorders db.tags — the default order — while
// the pencil / trash keys stay plain clicks (stopPropagation keeps them out
// of the drag's way).
const TagRow = memo(
  function TagRow({ tag, used, isEditing, isDragged, dragStyle, itemStyle, bindItem, onEdit, onDelete }) {
    return (
      <div
        data-gd-tag-id={tag.id}
        className={clsx(
          'gd-panel px-2.5 py-1.5 flex items-center gap-2.5 cursor-pointer gd-sort-item',
          isEditing && 'gd-drop-inside',
          isDragged && 'is-dragging'
        )}
        style={isDragged ? dragStyle : itemStyle || undefined}
        {...bindItem}
        onClick={() => onEdit(tag)}
        title="Drag to reorder · click to edit"
      >
        <GripVertical size={11} className="flex-shrink-0 text-gd-mute" style={{ opacity: 0.55 }} />
        <TagRibbon tag={tag} scale={0.8} />
        <span className="flex-1 text-[12px] text-gd-chrome truncate">
          <RichText text={tag.name} />
        </span>
        <span className="text-[9px] text-gd-mute uppercase tracking-[0.14em] flex-shrink-0">
          {`${used} USE${used === 1 ? '' : 'S'}`}
        </span>
        <span className="text-[9px] text-gd-mute uppercase tracking-[0.14em] flex-shrink-0">
          {TAG_TRIMS.find((t) => t.id === tag.trim)?.label || 'Straight'}
        </span>
        <button
          className="gd-icon-btn flex-shrink-0"
          title="Edit this tag"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(tag);
          }}
        >
          <Pencil size={12} />
        </button>
        <button
          className="gd-icon-btn gd-icon-btn-danger flex-shrink-0"
          title="Delete tag"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(tag);
          }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    );
  },
  (prev, next) =>
    prev.tag === next.tag &&
    prev.used === next.used &&
    prev.isEditing === next.isEditing &&
    prev.isDragged === next.isDragged &&
    prev.dragStyle === next.dragStyle &&
    prev.itemStyle === next.itemStyle &&
    prev.bindItem === next.bindItem
);

// Tag manager — create, EDIT, recolor, re-icon, re-trim and delete. The editor
// leads with COLOR, the NAME field sits below it (roomy), then the end trim.
// DONE commits any pending editor draft first, so muscle-memory "done" taps
// never lose a badge you just built; CANCEL throws everything away.
// 1.4.3 — THE FINISH ROW JOINED under the icon picker (the six seats the
// cards speak, rendered as miniature ribbons).
// 1.4.4 — THE FINISH ROW IS RETIRED, ROOT AND BRANCH ("remove finishes
// from the tag manager, remove the finishes feature entirely from tag
// manager only"): the ladder, the editor's finish state, the tag's own
// finish field and the ribbon's material coat all left with the request —
// a tag is color + trim + icon + name, nothing more. The CARDS' finishes
// (their own materials) are untouched; only the tag manager's feature
// dies. A tag saved with a 1.4.3 finish simply forgets it on load (the
// sanitizer writes 'none'), and no ribbon ever paints a coat again.
export default function TagManagerModal({ tags, characters = [], onClose, onAddTag, onUpdateTag, onReorderTags, onDeleteTag, confirm }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(CHIP_COLORS[0]);
  const [hexDraft, setHexDraft] = useState('');
  const [icon, setIcon] = useState(null);
  const [trim, setTrim] = useState('straight');
  const [editingId, setEditingId] = useState(null);
  const listRef = useRef(null);

  // 0.30.0 — DRAG TO REORDER ("allow me to drag tags around in the tag
  // manager which changes the order for the default"): the same smooth
  // pointer sort the stamps and images use, geometry mode (nearest-row drop
  // targets). The commit writes db.tags — THE default order everywhere
  // (the character strips and the card ribbons read it straight).
  const { sort, bindItem, itemStyle, dragStyle, sorting } = useThumbSort({
    count: tags.length,
    cols: 1,
    gapX: 6,
    gapY: 6,
    useGeometry: true,
    containerRef: listRef,
    onCommit: (from, to) => onReorderTags?.(from, to),
    onTap: () => {},
  });

  const editing = editingId ? tags.find((t) => t.id === editingId) || null : null;
  const valid = stripRichText(name).trim().length > 0;

  // 1.7.0 — THE LIST'S OWN BAR BREATHES (see useScrollbarBreath +
  // @property --gd-sb in index.css): the EXISTING list's scrollbar
  // appears the moment the library outgrows the bounded window and
  // leaves again with a deletion — the 10px gutter now tweens in and
  // out instead of jumping the list's width by a frame.
  useScrollbarBreath(listRef, 'y', [tags.length]);

  // 1.0.6 — THE PENDING DRAFT ("when closing the tag manager tab while a
  // creation isnt saved, ask for confirmation"): a NEW tag whose name has
  // been typed, or an EDITED tag whose draft no longer matches what is
  // stored. Window-closing gestures ask while this is true; confirming
  // closes WITHOUT applying ("when its confirmed to close it shouldnt apply
  // said changes") — the draft simply dies. Immediate actions (ADD TAG /
  // UPDATE TAG commits, deletions, drag reorders, gallery stamps) were never
  // draft state — they keep landing the moment you press them.
  const pendingDraft = editing
    ? name !== editing.name || color !== editing.color || icon !== (editing.icon || null) || trim !== (editing.trim || 'straight')
    : valid;
  const closeManager = () => {
    onClose();
  };

  const usage = useMemo(() => {
    const map = {};
    for (const c of characters || []) for (const tid of c.tags || []) map[tid] = (map[tid] || 0) + 1;
    return map;
  }, [characters]);

  const resetForm = useCallback(() => {
    setName('');
    setColor(CHIP_COLORS[0]);
    setIcon(null);
    setTrim('straight');
    setEditingId(null);
  }, []);

  const loadTag = useCallback((tag) => {
    setName(tag.name);
    setColor(tag.color);
    setIcon(tag.icon || null);
    setTrim(tag.trim || 'straight');
    setEditingId(tag.id);
  }, []);

  const askDelete = useCallback(
    (tag) => {
      confirm({
        title: 'DELETE TAG',
        message: `Delete tag "${stripRichText(tag.name)}"? It is removed from every card using it. This cannot be undone.`,
        confirmLabel: 'DELETE',
        danger: true,
        onConfirm: () => {
          if (editingId === tag.id) resetForm();
          onDeleteTag(tag.id);
        },
      });
    },
    [confirm, editingId, onDeleteTag, resetForm]
  );

  // Apply the editor now and keep the dialog open.
  // 1.4.4 — the finish left the payload with the manager's FINISH ladder
  // (the tag's own record forgets the field entirely).
  const apply = () => {
    if (!valid) return;
    if (editing) onUpdateTag(editing.id, { name: name.trim(), color, icon, trim });
    else onAddTag(name.trim(), color, icon, trim);
    resetForm();
  };

  // DONE: commit any pending draft, then close. This is the muscle-memory
  // guard — "done" can never silently drop a badge you were building.
  const done = () => {
    if (valid) {
      if (editing) onUpdateTag(editing.id, { name: name.trim(), color, icon, trim });
      else onAddTag(name.trim(), color, icon, trim);
    }
    onClose();
  };

  const preview = { id: 'preview', name: stripRichText(name) || 'preview', color, icon, trim };

  return (
    <Modal
      title="TAG MANAGER"
      onClose={closeManager}
      confirmClose={
        pendingDraft
          ? {
              message:
                'The editor holds a tag that has not been applied yet. Close the manager and discard it?',
            }
          : null
      }
      width="w-[920px]"
      bodyClassName="!p-3"
      footer={
        <div className="flex justify-end gap-2">
          <button className="gd-btn" onClick={onClose}>
            CANCEL
          </button>
          <button className="gd-btn gd-btn-solid" onClick={done} title="Applies any pending tag and closes">
            DONE{valid ? ': SAVES PENDING TAG' : ''}
          </button>
        </div>
      }
    >
      {/* 1.7.0 — THE WINDOW FITS THE VIEWPORT ("in tag manager, make it so
          the existing tags section fit into the container, meaning if it
          extends too long it will just utilize the scrollbar, instead of
          actually expanding the tag manager's window and causing that
          window to have a scrollbar on the right"): the grid used to grow
          with the tag list until the modal's own body scrolled — the
          WINDOW's right scrollbar the report names. The grid now carries
          a viewport-derived ceiling (the modal's own chrome — the
          layer's p-6, the header, the footer — measured once into the
          calc): past the ceiling the EXISTING list flexes into its own
          scroller and the window never asks its body for a bar. Small
          libraries keep the window exactly as tall as the content
          always made it (minHeight 400, untouched).
          1.7.1 — THE CLAMP REACHES THE ROW ("in tag manager, the existing
          tags area keeps extending the window downwards, fix that so when
          its about to, it should just crop and make the container special
          to the existing tags have a scrollbar and scrollable"): the 1.7.0
          ceiling capped the grid's BOX, but the grid's implicit row is
          AUTO-sized and both columns spoke min-height:auto — the track
          re-asserted the CONTENT's height and the list painted on past
          the clamped box, reading as the window still extending. The row
          is minmax(0,1fr) now and both columns carry min-h-0: at the
          ceiling the track takes the grid's own clamped height, the
          columns may shrink into it, and the flex-1 list at the bottom
          of the left column finally receives a REAL bound — it crops and
          scrolls inside its own container, its own bar breathing on the
          1.7.0 scrollbar law, and the window's body never grows a bar. */}
      <div
        className="grid grid-cols-[1fr_280px] grid-rows-[minmax(0,1fr)] gap-3"
        style={{ minHeight: 400, maxHeight: 'calc(100vh - 220px)' }}
      >
        {/* LEFT — editor + existing tags */}
        <div className="flex flex-col min-h-0 min-w-0 gap-3">
          <div className="gd-panel p-3 space-y-3">
            <div className="gd-rule">{editing ? `EDITING: ${stripRichText(editing.name).toUpperCase()}` : 'NEW TAG'}</div>

            {/* Color leads — swatches, then the custom wheel + hex. */}
            <div>
              <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">COLOR</div>
              <div className="flex flex-wrap items-center gap-1.5">
                {CHIP_COLORS.map((c) => (
                  <button
                    key={c}
                    className="w-6 h-6 rounded border-2 flex items-center justify-center"
                    style={{
                      background: c,
                      borderColor: color === c ? 'var(--gd-chrome)' : 'rgba(0,0,0,0.55)',
                      outline: color === c ? '2px solid var(--gd-accent)' : 'none',
                      outlineOffset: 1,
                    }}
                    title={c}
                    onClick={() => setColor(c)}
                  />
                ))}
                {/* Custom color — the in-app PICKER (0.24.0: the native
                   wheel is gone — no lag, and the popover carries its own hex
                   area). Same 24px square as the presets so the row stays
                   aligned, walled off from the presets by a hairline. */}
                <span className="gd-swatch-divider" aria-hidden />
                <ColorPickerButton
                  color={color}
                  onColor={(hex) => {
                    setColor(hex);
                    setHexDraft(hex ? hex.toUpperCase() : '');
                  }}
                  // 1.6.3 — the picker's reset unsets the tag's color (the
                  // chip family falls back to its neutral gray).
                  onReset={() => {
                    setColor(null);
                    setHexDraft('');
                  }}
                  dashed
                  active={!!color && !CHIP_COLORS.includes(color)}
                  title="Open the color picker: any color you like"
                />
                <input
                  className="gd-input !w-20 !py-0.5 text-[10px] uppercase"
                  value={hexDraft}
                  spellCheck={false}
                  title="Custom hex color"
                  placeholder="#HEX"
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    setHexDraft(v);
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) setColor(v);
                  }}
                  onBlur={() => setHexDraft('')}
                />
              </div>
            </div>

            {/* Name — BELOW the colors, and roomy.
                1.0.5 — THE NAME STAYS IN ITS BOX ("tag manager name should
                not expand beyond the container its in, when it reaches the
                limits it moves to a new line it would have a character
                limit of 35 characters"): the field is multiline now — it
                WRAPS to a new line at the container's edge instead of
                stretching it sideways — and it carries a hard 35-character
                cap (markup-free), so no name can ever balloon the window.
                The old FRESH-TAG X key that rode here moved DOWN, next to
                UPDATE TAG ("should be next to the update tag button"). */}
            <div>
              <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">NAME</div>
              <div className="flex gap-2">
                <RichInput
                  autoFocus
                  wrapClassName="flex-1 min-w-0"
                  className="!py-2.5 !text-[13px]"
                  multiline
                  maxLength={35}
                  value={name}
                  placeholder="Tag name (select text for formatting)"
                  onChange={setName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') apply();
                  }}
                />
              </div>
            </div>

            <div>
              <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">END TRIM</div>
              <div className="flex flex-wrap gap-2">
                {TAG_TRIMS.map((t) => (
                  <TrimPreview key={t.id} trim={t.id} active={trim === t.id} onClick={() => setTrim(t.id)} />
                ))}
              </div>
            </div>

            {/* 1.0.5 — THE COMMIT ROW WRAPS ("also ensure that the new tag
                button wnt clip to the right if the tag expands beyond the
                screen (which also prevent that from happening)"): the
                preview plate is capped and shrinkable (it clips its own
                ribbon before it can ever push the keys), the row wraps as
                the last resort, and the commit keys stay flex-shrink-0 —
                UPDATE TAG can never be pushed off the right edge by a long
                name. The FRESH TAG key rides right beside it ("start with
                a fresh tag instead button should be next to the update tag
                button") — same row, same reach. */}
            <div className="flex flex-wrap items-end gap-3">
              <div
                className="gd-panel p-2.5 flex items-end min-w-0 overflow-hidden"
                style={{ minHeight: 58, maxWidth: '52%' }}
                title="The ribbon as the card will carry it"
              >
                <TagRibbon tag={preview} scale={1.4} />
              </div>
              <span className="text-[9px] leading-relaxed text-gd-mute flex-1 min-w-[140px]">
                Ribbons hang above the card's top edge, stacked up to three. Icons can be any glyph on the right,
                or a plain letter.
              </span>
              {editing && (
                <button
                  className="gd-btn flex-shrink-0"
                  title="Start a fresh tag instead: clears the editor back to a new tag"
                  onClick={resetForm}
                >
                  <X size={13} />
                  FRESH TAG
                </button>
              )}
              <button className="gd-btn gd-btn-solid flex-shrink-0" disabled={!valid} onClick={apply}>
                {editing ? <Check size={13} /> : <Plus size={13} />}
                {editing ? 'UPDATE TAG' : 'ADD TAG'}
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <div className="gd-rule mb-1.5">EXISTING TAGS ({tags.length})</div>
            {tags.length === 0 ? (
              <div className="gd-panel p-3 flex items-center justify-center gap-2 text-gd-mute">
                <TagIcon size={12} />
                <span className="text-[10px] tracking-[0.16em] uppercase">No tags yet</span>
              </div>
            ) : (
              // 1.7.0 — the cap retired with the window's own ceiling (see
              // the grid note above): the list now FLEXES into whatever space
              // the bounded window leaves it — a long library scrolls
              // INSIDE this box (its own bar, breathing on the 1.7.0 law),
              // and the window itself never grows past the screen.
              <div className="flex-1 min-h-0 space-y-1.5 overflow-y-auto pr-1 gd-sort-list gd-sb-breath" ref={listRef}>
                {tags.map((tag, i) => (
                  <TagRow
                    key={tag.id}
                    tag={tag}
                    used={usage[tag.id] || 0}
                    isEditing={editingId === tag.id}
                    isDragged={sorting && sort?.from === i}
                    dragStyle={dragStyle}
                    itemStyle={itemStyle(i)}
                    bindItem={bindItem(i)}
                    onEdit={loadTag}
                    onDelete={askDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — the icon picker. 0.30.0 — the column shrank from the
            bottom ("the icon list container is too long that it causes the
            window to have a scrollbar even if its not necessary, shrink it
            from the bottom slightly"): the picker caps at a height that
            keeps the whole window under the modal's viewport budget, and
            it scrolls internally.
            1.4.3 — a FINISH ladder rode below the icon picker.
            1.4.4 — THE LADDER IS RETIRED ("remove finishes from the tag
            manager, remove the finishes feature entirely from tag manager
            only"): the column ends with the picker — no finish seats, no
            miniature ribbons, nothing but the icon the tag actually
            carries. */}
        <div className="flex flex-col min-h-0 min-w-0">
          <div className="gd-rule mb-1.5">ICON</div>
          {/* 1.7.0 — THE PICKER RUNS TO THE FLOOR ("while you are at it
              also extend the icon picker on the right to the bottom too
              so it doesnt leave an empty area"): the wrapper's old 330px
              cap is retired — the picker's fullHeight law (h-full) now
              fills the column the grid stretches to the left column's
              own height, and its grid scrolls inside its own shell. The
              right edge runs flush with the EXISTING list's bottom, no
              dead band under it. */}
          <div className="flex-1 min-h-0">
            <LucideIconPicker value={icon} onSelect={setIcon} fullHeight />
          </div>
        </div>
      </div>
    </Modal>
  );
}
