import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence } from 'framer-motion';
import { ChevronRight, Folder, FolderOpen, Inbox, Palette, Plus, Trash2 } from 'lucide-react';
import Modal from './Modal.jsx';
import LucideIconPicker, { ChipGlyph } from './LucideIconPicker.jsx';
import { ColorPickerButton } from './ColorPicker.jsx';
import { RichText, default as RichInput } from './RichText.jsx';
import { CLASS_COLOR_PRESETS, ROOT_CLASS_ID } from '../constants/index.js';
import { classChildren, flattenClasses, isDescendantOfClass, stripRichText, isHexColor, mixHex, contrastAwareIconColor } from '../utils/helpers.js';

// One class row on the BRANCH TREE (0.14.0 rework; 0.37.0 redesign). Rows
// used to be full-width solid plates — the pattern behind them was sealed
// off, the plate stretched all the way to the sidebar's right edge, and
// the hover tools pinned to that invisible border went offscreen on deep
// branches. The 0.37.0 anatomy:
//   · the ROW is a transparent, full-width hover/click/drag lane — the
//     sidebar's PATTERN shows through everywhere nothing is drawn;
//   · the CARD is an inline-flex plate that HUGS its content (never
//     stretching right forever) and caps at the lane's width, so long names
//     truncate instead of running offscreen;
//   · the expander chevron sits in its OWN tiny framed container
//     ("collapse and expand of a class should not clip with the parent and
//     child line and should have its own container too") — the child rail
//     rises INTO the parent row exactly at the chevron, and the opaque
//     little box covers it, so the line never crosses the glyph;
//   · 0.41.0 — THE HOVER TOOLS ARE GONE ("honestly just remove the 3 button
//     feature, keep it so its just the right click is how to access edit
//     the class or deleting it"): no seat ladder, no pop strips, no keys
//     over the art — the row is a pure lane, and the right-click menu (plus
//     the DELETE CLASS key inside the EDIT CLASS window) owns every class
//     action;
//   · a colored class (0.37.0) washes its own card (plate tint + ring +
//     left bar + icon) and the rail dropping to its children — the text
//     stays the theme's chrome because the wash is always a PANEL MIX, so
//     names, counts and icons read on every shade, light or dark.
function TreeRow({
  cls,
  depth,
  childCount,
  count,
  selected,
  collapsed,
  drop,
  onSelect,
  onToggleCollapse,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isRoot,
  // 0.38.0 — the theme's resolved panel hex (for the icon's contrast pick:
  // the wash a colored card paints is a mix of the class color and this).
  panelHex = '#1a1a1f',
}) {
  const open = !collapsed;
  const dropClass = drop === 'inside' ? 'gd-drop-inside' : drop === 'above' ? 'gd-drop-above' : drop === 'below' ? 'gd-drop-below' : '';
  const color = cls.color || null;
  // 0.38.0 — THE ICON'S OWN CONTRAST ("sometimes when coloring like in deep
  // blue, the icon may blend too well… fix that so the icon would be colored
  // lighter or darker depending on which is more obvious"): the glyph wears
  // whichever of {the raw class color, its lighter variant, its darker
  // variant} reads best against the wash its own card paints.
  // 1.0.7 — THE PICK MEASURES THE WORST WASH ("some class colors like blue
  // blend the icon too much into the container of the class, fix that so
  // its brighter or darker depending on which fits more"): the old pick
  // measured against the card's RESTING wash (22% class color) and kept the
  // RAW color on a thin 3.2:1 pass, so a mid blue stayed a mid blue over a
  // blue-tinted plate, obvious on paper, invisible in practice. The
  // measurement now rides the SELECTED wash (32% — the strongest tint the
  // resting card ever paints; hover deepens it only while the plate also
  // lightens), and the keep-raw bar plus the variant ladder live in
  // contrastAwareIconColor (helpers.js) with a much stiffer bar. The icon
  // still speaks the class's HUE, just at the lightness that reads.
  const iconColor = color ? contrastAwareIconColor(color, mixHex(color, panelHex, 0.32)) : null;

  return (
    <div
      data-gd-class-id={cls.id}
      className={clsx('gd-tree-row group relative flex items-center h-8 select-none cursor-pointer', dropClass)}
      style={{
        paddingLeft: 'var(--pad, 6px)',
        // 0.37.0 — the class's own color, for the card wash + the rail that
        // drops from this class to its children (set on the KIDS wrapper in
        // renderNodes below).
        ...(color ? { '--cls': color } : null),
      }}
      data-colored={color || undefined}
      data-selected={selected || undefined}
      onClick={() => onSelect(cls.id)}
      draggable={!isRoot}
      onDragStart={(e) => onDragStart(e, cls)}
      onDragOver={(e) => onDragOver(e, cls)}
      onDragLeave={() => onDragOver(null, cls)}
      onDrop={(e) => onDrop(e, cls)}
      onDragEnd={onDragEnd}
      title={isRoot ? 'Every card lives under this one way or another' : `${stripRichText(cls.name)}: right-click for options`}
      /* 1.0.8 — name-led tooltip (the class NAME leads the pill): the
         label's area clamps at two lines; the hint is the "rest". The
         root's sentence is pure instruction, so it carries no mark. */
      data-gd-tip-name={isRoot ? undefined : '1'}
    >
      {/* junction dot — where this branch ties onto its parent's rail
          (the root has no parent, so no joint). Painted ON the pattern in
          the connector zone; a colored parent tints it via --rail. */}
      {!isRoot && <span className="gd-tree-joint" data-selected={selected || undefined} aria-hidden />}

      {/* THE CARD — hugs its content, caps at the lane's width. Everything
          readable lives on this plate: chevron box, icon, name, count.
          0.41.0 — nothing else: no hover tools ride the card anymore. */}
      <div className="gd-tree-card" data-selected={selected || undefined}>
        {childCount > 0 ? (
          <button
            className="gd-tree-exp"
            title={open ? 'Collapse' : 'Expand'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(cls.id);
            }}
          >
            <ChevronRight size={12} className={clsx('transition-transform', open && 'rotate-90')} />
          </button>
        ) : (
          <span className="gd-tree-exp is-blank" aria-hidden />
        )}

        <span
          className={clsx(
            'gd-tree-ico flex-shrink-0 flex items-center',
            !color && (selected ? 'text-gd-accent' : 'text-gd-mute'),
            color && 'text-gd-chrome'
          )}
          style={color ? { color: iconColor } : undefined}
        >
          {isRoot ? (
            <Inbox size={13} />
          ) : cls.icon ? (
            <ChipGlyph name={cls.icon} size={13} />
          ) : open ? (
            <FolderOpen size={13} />
          ) : (
            <Folder size={13} />
          )}
        </span>

        <RichText
          text={cls.name}
          as="span"
          className={clsx(
            'gd-tree-name min-w-0 truncate text-[12px]',
            selected ? 'font-semibold' : 'font-normal'
          )}
        />

        {/* 0.41.0 — the count is ALWAYS visible again (it used to duck out
            of the way of the hover tools that no longer exist). */}
        <span className="gd-tree-count tabular-nums flex-shrink-0">{count}</span>
      </div>
    </div>
  );
}


export default function ClassSidebar({
  classes,
  characters,
  selectedClassId,
  dragRef,
  onSelectClass,
  onAddClass,
  onRenameClass,
  onDeleteClass,
  onMoveClass,
  onAssignCharacter,
  onNewCharacter,
  confirm,
  onStatus,
  // 0.39.0 — "EDIT CLASS" FROM THE RIGHT-CLICK MENU: App sets this to a
  // class id; the sidebar opens its FULL editor (name + icon + color +
  // preview) on that class, then reports back through onEditClassHandled.
  editClassRequest = null,
  onEditClassHandled = null,
  // 0.40.0 — CENTER THE REVEALED CLASS (Settings → Workspace): on = the
  // glide aims for the middle of the tree on both axes (clamped to what
  // the strip allows); off = the minimal bring-into-view.
  centerOnReveal = true,
}) {
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [drop, setDrop] = useState(null); // { id, zone }
  const [modal, setModal] = useState(null); // {type, parent?, cls?, name, icon, showIcons}
  const scrollRef = useRef(null);

  /* 1.9.8 — THE GHOST'S OWN SEAT (the drag law's retirement lane — see
     startDrag below): the offscreen host that carried the static drag
     card, retired the moment the gesture ends by any road (dragend,
     drop, unmount, or the next gesture's fresh ghost). */
  const ghostRef = useRef(null);
  const retireGhost = useCallback(() => {
    const host = ghostRef.current;
    ghostRef.current = null;
    if (host && host.parentNode) host.parentNode.removeChild(host);
  }, []);
  useEffect(
    () => () => {
      retireGhost();
    },
    [retireGhost]
  );

  // 0.38.0 — THE THEME'S RESOLVED PANEL HEX, read once per render of the
  // sidebar (never per row): the colored cards' icon-contrast pick mixes
  // the class color against the panel the same way the CSS wash does.
  const panelHex = useMemo(() => {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--gd-panel').trim();
      return /^#[0-9a-fA-F]{6}$/.test(v) ? v : '#1a1a1f';
    } catch {
      return '#1a1a1f';
    }
  }, [classes, characters]);

  // 0.38.0 — SCROLL THE PICKED CLASS INTO VIEW; 0.39.0 — THE SCROLL IS A
  // MOVEMENT, NOT A SNAP ("when adjusting the scroll to fit the class,
  // ensure its animated and not a snap, but actual movement"): the tree
  // glides both axes until the row sits fully inside the visible box, with
  // breathing room. Covers horizontal clipping (deep branches on a narrow
  // sidebar) and vertical (rows below the fold).
  // 0.40.0 — CENTER IT WHEN THERE'S ROOM ("when clicking on an offscreen
  // class and it moves to it , if its possible to centralize it , do so ,
  // meaning if it can scroll to it more by verticallyor horizontally , do
  // so"): with the setting on (its default), the glide aims for the MIDDLE
  // of the scroller on BOTH axes, clamped to the scrollable range — a class
  // near the strip's start or end simply goes as far as the tree allows,
  // which is exactly as centered as it can get. With the setting off, the
  // 0.39 minimal bring-into-view is the law again.
  const revealSelected = useCallback(
    (classId) => {
      const scroller = scrollRef.current;
      if (!scroller || typeof requestAnimationFrame !== 'function') return;
      requestAnimationFrame(() => {
        const row = scroller.querySelector(`[data-gd-class-id="${classId}"]`);
        const card = row?.querySelector?.('.gd-tree-card');
        if (!card) return;
        const sr = scroller.getBoundingClientRect();
        const cr = card.getBoundingClientRect();
        let left;
        let top;
        if (centerOnReveal) {
          const maxL = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
          const maxT = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
          left = Math.max(0, Math.min(maxL, scroller.scrollLeft + (cr.left - sr.left) - (sr.width - cr.width) / 2));
          top = Math.max(0, Math.min(maxT, scroller.scrollTop + (cr.top - sr.top) - (sr.height - cr.height) / 2));
        } else {
          const pad = 14;
          left = scroller.scrollLeft;
          top = scroller.scrollTop;
          if (cr.right > sr.right - pad) left += cr.right - (sr.right - pad);
          else if (cr.left < sr.left + pad) left -= sr.left + pad - cr.left;
          if (cr.bottom > sr.bottom - pad) top += cr.bottom - (sr.bottom - pad);
          else if (cr.top < sr.top + pad) top -= sr.top + pad - cr.top;
        }
        if (left !== scroller.scrollLeft || top !== scroller.scrollTop) {
          scroller.scrollTo({ left, top, behavior: 'smooth' });
        }
      });
    },
    [centerOnReveal]
  );

  // 0.39.0 — A NEW CLASS NEVER SPAWNS OFFSCREEN ("when creating a new class
  // and it spawns offscreen it should scroll to fit it in still"): watch the
  // class list — when ids appear that were not there last render (created
  // through THIS modal, the context menu, or the empty-area key — every
  // creation path lands here), the first new one glides into view. Only its
  // ANCESTORS unfold (the rest of the tree keeps its collapse state).
  const prevClassIdsRef = useRef(null);
  useEffect(() => {
    const prev = prevClassIdsRef.current;
    prevClassIdsRef.current = new Set((classes || []).map((c) => c.id));
    if (!prev) return; // first render — nothing is "new"
    const fresh = (classes || []).find((c) => !prev.has(c.id));
    if (!fresh) return;
    const byId = new Map((classes || []).map((c) => [c.id, c]));
    const chain = new Set();
    let cur = byId.get((fresh.parentId || ROOT_CLASS_ID));
    while (cur && !chain.has(cur.id)) {
      chain.add(cur.id);
      cur = byId.get(cur.parentId || ROOT_CLASS_ID);
    }
    setCollapsed((was) => {
      if (!was.size) return was;
      const next = new Set(was);
      let touched = false;
      for (const id of chain) {
        if (next.has(id)) {
          next.delete(id);
          touched = true;
        }
      }
      return touched ? next : was;
    });
    // double rAF: wait for the unfold to paint before hunting the row
    requestAnimationFrame(() => requestAnimationFrame(() => revealSelected(fresh.id)));
  }, [classes, revealSelected]);

  // 0.39.0 — the right-click menu's "Edit class" lands here: open the FULL
  // editor (the same window the tree's pencil opens) on the requested class.
  useEffect(() => {
    if (!editClassRequest) return;
    const cls = (classes || []).find((c) => c.id === editClassRequest);
    if (cls) {
      setModal({ type: 'rename', cls, name: cls.name, icon: cls.icon || null, color: cls.color || null, showIcons: false });
    }
    onEditClassHandled?.();
  }, [editClassRequest, classes, onEditClassHandled]);

  // 1.0.6 — THE EDITOR'S PENDING DRAFT: true while the window's fields differ
  // from what it opened with (a fresh creation with anything typed, or an
  // edit that no longer matches the stored class). Powers the Modal's
  // confirmClose guard — accidental closes ask; confirming discards.
  const classDraftPending = (m) => {
    if (!m) return false;
    if (m.type === 'rename' && m.cls) {
      return (
        m.name !== m.cls.name ||
        m.icon !== (m.cls.icon || null) ||
        m.color !== (m.cls.color || null)
      );
    }
    return stripRichText(m.name || '').trim().length > 0 || m.icon != null || m.color != null;
  };

  const selectClass = useCallback(
    (classId) => {
      onSelectClass(classId);
      revealSelected(classId);
    },
    [onSelectClass, revealSelected]
  );

  // Recursive counts: a class counts itself + everything nested inside it.
  const counts = useMemo(() => {
    const direct = new Map();
    for (const c of characters || []) {
      const key = c.classId || ROOT_CLASS_ID;
      direct.set(key, (direct.get(key) || 0) + 1);
    }
    const totalFor = (id, seen = new Set()) => {
      if (seen.has(id)) return 0; // cycle guard (shouldn't happen post-sanitize)
      seen.add(id);
      let total = direct.get(id) || 0;
      for (const c of classes || []) {
        if ((c.parentId || ROOT_CLASS_ID) === id) total += totalFor(c.id, seen);
      }
      return total;
    };
    const map = new Map();
    map.set(ROOT_CLASS_ID, totalFor(ROOT_CLASS_ID));
    for (const c of classes || []) map.set(c.id, totalFor(c.id));
    return map;
  }, [classes, characters]);

  const toggleCollapse = (id) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startDrag = (e, cls) => {
    dragRef.current = { type: 'class', id: cls.id };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cls.id);
    /* 1.9.7 — THE CLASS'S OWN CONTAINER FOLLOWS THE CURSOR ("when
       dragging a class around, the preview that follows the cursor is
       the class with background and so on as if its a cropped
       screenshot, fix that so its only the class container"): the
       browser's default drag image is a snapshot of the whole ROW —
       full sidebar width, the lane's selected wash edge to edge, the
       junction dot, the indent rail, all of it — a cropped screenshot
       of the sidebar, exactly as the report names it. The ghost is the
       class's OWN CARD now (the compact container: chevron, icon, name,
       count), handed to the cursor through setDragImage — the row
       itself stays whole behind it, and what follows the pointer is
       only the class.
       1.9.8 — THE GHOST IS A STATIC CARD, NOT A LIVE SEAT ("when
       dragging a class it becomes so laggy even when i let go on
       weaker cpus unlike before"): the 1.9.7 pass handed setDragImage
       the LIVE card element — and a live-element drag image makes the
       browser track the seat through the whole gesture: every re-render
       the sidebar spoke mid-drag (the drop highlight's setDrop fired a
       fresh object on EVERY dragover tick, ~100/s) re-rasterized the
       ghost's layer and thrashed the layout reads beside it — the weak
       CPUs the report names lived the whole drag behind the raster, and
       the promoted layers lingered a beat after the release. Two laws
       answer it: the ghost is a DETACHED CLONE seated offscreen (one
       static raster at dragstart, nothing to track, nothing left
       promoted — retired at dragend / drop / unmount), and the drop
       highlight only speaks when its seat actually CHANGES (see
       setDropIfChanged below). The row's own color law rides the clone
       through its wrapper (the gd-tree-row scope + the --cls var), so
       the carried card reads exactly as the sidebar paints it. */
    retireGhost();
    const cardEl =
      e.currentTarget && typeof e.currentTarget.querySelector === 'function'
        ? e.currentTarget.querySelector('.gd-tree-card')
        : null;
    if (cardEl && typeof e.dataTransfer.setDragImage === 'function') {
      const r = cardEl.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && typeof document !== 'undefined' && document.body) {
        const clone = cardEl.cloneNode(true);
        // the clone keeps the card's own classes + inline ink; the width
        // is pinned so the container-query cap (100cqw) never re-speaks
        // against the body's own context
        clone.style.width = `${Math.ceil(r.width)}px`;
        clone.style.maxWidth = 'none';
        const host = document.createElement('div');
        host.className = 'gd-tree-row gd-tree-ghost';
        host.setAttribute('aria-hidden', 'true');
        const rowEl = e.currentTarget;
        const clsColor =
          rowEl && typeof rowEl.style !== 'undefined' && typeof rowEl.style.getPropertyValue === 'function'
            ? rowEl.style.getPropertyValue('--cls')
            : '';
        if (clsColor) host.style.setProperty('--cls', clsColor);
        if (rowEl && typeof rowEl.hasAttribute === 'function' && rowEl.hasAttribute('data-colored')) {
          host.setAttribute('data-colored', '');
        }
        host.style.paddingRight = '0';
        host.appendChild(clone);
        document.body.appendChild(host);
        ghostRef.current = host;
        // the cursor holds the card's leading edge — the ghost reads as
        // CARRIED, not as a pointer-anchored tile
        e.dataTransfer.setDragImage(
          host,
          Math.max(10, Math.min(16, Math.round(r.width * 0.12))),
          Math.round(r.height / 2)
        );
      }
    }
  };

  /* 1.9.8 — THE HIGHLIGHT SPEAKS ITS CHANGES ALONE: dragover fires on
     every tick the cursor breathes over a row (~100/s), and every call
     wrote a fresh { id, zone } object into state — a full sidebar
     re-render per tick even while the seat never moved (the raster
     thrash the ghost law above names). The write now lands ONLY when
     the seat or the zone actually changes; the null clear keeps its own
     identity bailout exactly as React speaks it. */
  const setDropIfChanged = useCallback((next) => {
    setDrop((prev) =>
      prev && next && prev.id === next.id && prev.zone === next.zone ? prev : next
    );
  }, []);

  const overRow = (e, cls) => {
    if (!e) {
      setDrop(null);
      return;
    }
    const drag = dragRef.current;
    if (!drag) return;
    e.preventDefault();
    e.stopPropagation();
    if (drag.type === 'card') {
      setDropIfChanged({ id: cls.id, zone: 'inside' });
      return;
    }
    if (drag.type === 'class') {
      if (cls.id === ROOT_CLASS_ID) {
        setDropIfChanged({ id: cls.id, zone: 'inside' });
        return;
      }
      if (drag.id === cls.id || isDescendantOfClass(classes, drag.id, cls.id)) {
        setDrop(null);
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const rel = (e.clientY - rect.top) / Math.max(1, rect.height);
      const zone = rel < 0.25 ? 'above' : rel > 0.75 ? 'below' : 'inside';
      setDropIfChanged({ id: cls.id, zone });
    }
  };

  const dropOnRow = (e, cls) => {
    const drag = dragRef.current;
    e.preventDefault();
    e.stopPropagation();
    setDrop(null);
    retireGhost();
    if (!drag) return;
    if (drag.type === 'card') {
      onAssignCharacter(drag.id, cls.id);
      dragRef.current = null;
      return;
    }
    if (drag.type === 'class') {
      if (cls.id === ROOT_CLASS_ID) {
        onMoveClass(drag.id, cls.id, 'inside');
      } else if (drag.id !== cls.id && !isDescendantOfClass(classes, drag.id, cls.id)) {
        const rect = e.currentTarget.getBoundingClientRect();
        const rel = (e.clientY - rect.top) / Math.max(1, rect.height);
        const zone = rel < 0.25 ? 'above' : rel > 0.75 ? 'below' : 'inside';
        onMoveClass(drag.id, cls.id, zone);
      }
      dragRef.current = null;
    }
  };

  const endDrag = () => {
    dragRef.current = null;
    setDrop(null);
    /* 1.9.8 — the ghost retires with the gesture (a straggler host must
       never linger in the body). */
    retireGhost();
  };

  const submitModal = () => {
    if (!modal) return;
    const name = modal.name.trim();
    if (!stripRichText(name).trim()) return;
    const color = isHexColor(modal.color) ? modal.color : null;
    if (modal.type === 'new') onAddClass(name, modal.parent || ROOT_CLASS_ID, modal.icon || null, color);
    else if (modal.type === 'rename' && modal.cls) onRenameClass(modal.cls.id, name, modal.icon || null, color);
    setModal(null);
  };

  const askDelete = (cls) => {
    const childTotal = flattenClasses(classes).filter((c) => c.id !== cls.id && isDescendantOfClass(classes, cls.id, c.id)).length;
    confirm({
      title: 'DELETE CLASS',
      message: `Delete class "${stripRichText(cls.name)}"${childTotal ? ` and its ${childTotal} subclass(es)` : ''}? Cards inside move to Unsorted. This cannot be undone.`,
      confirmLabel: 'DELETE',
      danger: true,
      onConfirm: () => onDeleteClass(cls.id),
    });
  };

  // 0.41.0 — DELETE FROM INSIDE THE EDITOR ("add a delete class button in
  // edit class which would delete the class (after confirmation)"): the
  // EDIT CLASS window carries its own DELETE CLASS key — it hands the class
  // to the same confirm-gated delete the right-click menu uses. The root
  // never shows it (Unsorted is forever).
  // 0.42.0 — CANCEL RETURNS TO THE EDITOR ("when the confirmation window for
  // the delete class section occurs, ensure when pressing cancel that it
  // would go back to the edit class window, only if the window was open and
  // the delete button inside was clicked, not when i delete it through right
  // click"): the editor STAYS OPEN under the confirm — CANCEL (or the
  // confirm's own Escape/backdrop) simply uncovers it, exactly as it was;
  // only an actual DELETE closes both. The right-click path never opens the
  // editor, so its cancel changes nothing (the same askDelete, no editor).
  const askDeleteFromModal = () => {
    const victim = modal?.type === 'rename' ? modal.cls : null;
    if (!victim) return;
    confirm({
      title: 'DELETE CLASS',
      message: `Delete class "${stripRichText(victim.name)}"${countSubclasses(victim) ? ` and its ${countSubclasses(victim)} subclass(es)` : ''}? Cards inside move to Unsorted. This cannot be undone.`,
      confirmLabel: 'DELETE',
      danger: true,
      onConfirm: () => {
        setModal(null);
        onDeleteClass(victim.id);
      },
    });
  };

  // The subclass count for the editor-launched confirm message (the same
  // wording askDelete builds for the right-click path).
  const countSubclasses = (cls) =>
    flattenClasses(classes).filter((c) => c.id !== cls.id && isDescendantOfClass(classes, cls.id, c.id)).length;

  // 0.14.0 — BRANCH TREE: each node wrapper draws its own connector
  // (vertical rail + elbow, via CSS pseudo-elements on .gd-tree-node) and
  // nests its children inside a .gd-tree-kids container so the rails chain
  // from parent to child. --pad is the row's left padding; the rail always
  // sits 8px left of it, which lands exactly under the PARENT's chevron.
  // 0.37.0 — the KIDS wrapper carries the parent's CLASS COLOR as --rail:
  // every rail, elbow and joint inside hangs off THIS class, so a colored
  // class colors the branch line dropping from it (the "account for the
  // lines" half of the request).
  const renderNodes = (parentId, depth) =>
    classChildren(classes, parentId).map((cls) => {
      const childCount = classChildren(classes, cls.id).length;
      return (
        <div key={cls.id} className="gd-tree-node" style={{ ['--pad']: `${6 + depth * 16}px` }}>
          <TreeRow
            cls={cls}
            depth={depth}
            childCount={childCount}
            count={counts.get(cls.id) || 0}
            selected={selectedClassId === cls.id}
            collapsed={collapsed.has(cls.id)}
            drop={drop?.id === cls.id ? drop.zone : null}
            onSelect={selectClass}
            onToggleCollapse={toggleCollapse}
            onDragStart={startDrag}
            onDragOver={overRow}
            onDrop={dropOnRow}
            onDragEnd={endDrag}
            panelHex={panelHex}
          />
          {!collapsed.has(cls.id) && childCount > 0 && (
            <div
              className="gd-tree-kids"
              style={
                cls.color
                  ? { ['--rail']: cls.color, ['--rail-line']: `color-mix(in srgb, ${cls.color} 55%, var(--gd-line))` }
                  : undefined
              }
            >
              {renderNodes(cls.id, depth + 1)}
            </div>
          )}
        </div>
      );
    });

  const modalParentOptions = useMemo(() => {
    if (modal?.type !== 'new') return [];
    return [{ id: ROOT_CLASS_ID, name: 'Unsorted (root)' }, ...flattenClasses(classes)];
  }, [modal, classes]);

  return (
    // 0.31.0 — data-gd-region="tree": the app-level right-click menu reads
    // this to know the cursor is over the LEFT TREE's empty area ("on empty
    // area on left tree it will be create a new class, etc.."). Class rows
    // carry their own data-gd-class-id and win the closest() race first.
    // 0.39.0 — THE PATTERN RIDES THE SCROLLER: the texture class moved from
    // this root onto .gd-tree-scroll below — attachment LOCAL only moves a
    // pattern when the element ITSELF scrolls, and the sidebar root never
    // does (the tree scroller does). The root keeps the base color.
    <div data-gd-region="tree" className="w-full flex-shrink-0 flex flex-col gd-hairline-r h-full" style={{ background: 'var(--gd-bg)' }}>
      {/* 0.38.0 — THE HEADER WEARS ITS OWN SOLID PLATE (.gd-tree-head):
          the sidebar's pattern stops at its edge, so the CLASSES rule reads
          as chrome — "make the scrollbars not affected by the texture
          background and so as the header of the class tree (aka the area
          where it says 'classes')". */}
      <div className="gd-tree-head px-3 pt-3 pb-2 flex-shrink-0">
        <div className="gd-rule">CLASSES</div>
      </div>

      <div
        // 0.37.0 — BOTH SCROLLERS, AND THE PATTERN BEHIND EVERYTHING
        // ("in the classtree, add a side scroller and a vertical scroller,
        // and make it so the pattern background is visible on the areas
        // without text or graphics"): the scroller is overflow: AUTO on
        // both axes, and its inner sheet is width: max-content with a
        // min-width of 100% — rows HUG their content (the card is an
        // inline-flex plate), so the sheet is exactly as wide as the widest
        // branch chain: deep trees grow a real HORIZONTAL scrollbar instead
        // of crushing their cards, shallow ones sit flush at the sidebar's
        // width with the pattern showing through every empty lane.
        // 0.39.0 — THE PATTERN SCROLLS WITH THE TREE ("background texture
        // of the class tree isnt still affected by scrolling, fix that"):
        // the texture rides the SCROLLER with background-attachment: LOCAL,
        // so both axes of scrolling slide the pattern along with the rows.
        // The solid header above and the dock below keep their own surfaces.
        className="gd-tree-scroll gd-tex-sidebar flex-1 pt-1"
        ref={scrollRef}
        onDragOver={(e) => {
          if (dragRef.current?.type === 'class') {
            // dropping on empty space below the tree = move to root
            e.preventDefault();
          }
        }}
        onDrop={(e) => {
          const drag = dragRef.current;
          if (drag?.type === 'class') {
            e.preventDefault();
            onMoveClass(drag.id, ROOT_CLASS_ID, 'inside');
            dragRef.current = null;
          }
        }}
      >
        <div className="gd-tree-sheet">
        <TreeRow
          cls={{ id: ROOT_CLASS_ID, name: 'Unsorted' }}
          depth={0}
          childCount={classChildren(classes, ROOT_CLASS_ID).length}
          count={counts.get(ROOT_CLASS_ID) || 0}
          selected={selectedClassId === ROOT_CLASS_ID}
          collapsed={classChildren(classes, ROOT_CLASS_ID).length > 0 && classChildren(classes, ROOT_CLASS_ID).every((c) => collapsed.has(c.id))}
          drop={drop?.id === ROOT_CLASS_ID ? drop.zone : null}
          onSelect={selectClass}
          onToggleCollapse={() => {
            const roots = classChildren(classes, ROOT_CLASS_ID);
            const allCollapsed = roots.length > 0 && roots.every((c) => collapsed.has(c.id));
            setCollapsed((prev) => {
              const next = new Set(prev);
              for (const c of roots) {
                if (allCollapsed) next.delete(c.id);
                else next.add(c.id);
              }
              return next;
            });
          }}
          onDragStart={() => {}}
          onDragOver={overRow}
          onDrop={dropOnRow}
          onDragEnd={endDrag}
          isRoot
        />
        {/* The root's children hang off the root row — the .gd-tree-kids
            wrapper makes them true branches (rail drops from the root's
            chevron, each child ties on with an elbow). */}
        <div className="gd-tree-kids">{renderNodes(ROOT_CLASS_ID, 1)}</div>
        </div>
      </div>

      {/* 0.22.0 — the NEW CLASS / NEW CARD dock wears the RIGHT PANEL's
          texture (gd-tex-panel): it is deliberately its own surface cut off
          from the tree's pattern above — same background texture as the right
          panel, exactly as requested. */}
      <div className="p-2.5 flex flex-col gap-1.5 gd-tex-panel" style={{ borderTop: '1px solid var(--gd-line)' }}>
        <button
          className="gd-btn w-full"
          onClick={() => setModal({ type: 'new', parent: selectedClassId, name: '', icon: null, color: null, showIcons: false })}
          title="Create a new class under the selected one"
        >
          <Plus size={12} />
          NEW CLASS
        </button>
        {/* 1.0.7 — THE DOCK'S KEYS SPEAK TOO (same sweep as the viewer's
            empty-state key): the NEW CARD key in the tree's dock now says
            what it does, instead of riding mute beside a muted NEW CLASS. */}
        <button className="gd-btn gd-btn-solid w-full" onClick={onNewCharacter} title="Create a new card">
          <Plus size={12} />
          NEW CARD
        </button>
      </div>

      <AnimatePresence>
        {modal && (
          <Modal
            title={modal.type === 'new' ? 'NEW CLASS' : 'EDIT CLASS'}
            onClose={() => setModal(null)}
            confirmClose={
              // 1.0.6 — THE UNSAVED-CHANGES GUARD: the editor's draft (name /
              // icon / color) differs from what it opened with — the
              // accidental close gestures ask first, and confirming closes
              // WITHOUT creating or renaming anything. The footer's CANCEL /
              // CREATE / RENAME keys stay direct (labeled intent).
              classDraftPending(modal)
                ? {
                    message:
                      'The class has changes that have not been applied yet. Close the editor and discard them?',
                  }
                : null
            }
            width="w-[660px]"
            footer={
              <div className="flex items-center gap-2">
                {/* 0.41.0 — THE EDITOR'S OWN DELETE KEY: confirm-gated, and
                    only for real classes (never the root). */}
                {modal.type === 'rename' && modal.cls && modal.cls.id !== ROOT_CLASS_ID && (
                  <button
                    className="gd-btn gd-btn-danger"
                    title={`Delete "${stripRichText(modal.cls.name)}": asks first`}
                    onClick={askDeleteFromModal}
                  >
                    <Trash2 size={12} />
                    DELETE CLASS
                  </button>
                )}
                <div className="flex-1" />
                <button className="gd-btn" onClick={() => setModal(null)}>
                  CANCEL
                </button>
                <button className="gd-btn gd-btn-solid" disabled={!stripRichText(modal.name).trim()} onClick={submitModal}>
                  {modal.type === 'new' ? 'CREATE' : 'RENAME'}
                </button>
              </div>
            }
          >
            <div className="grid grid-cols-[1fr_236px] gap-4">
              <div className="space-y-3 min-w-0">
                {/* 1.0.5 — THE CLASS NAME KEEPS ITS WINDOW STILL ("in edit
                    class, ensure when the tag name extends beyond the limit
                    that it wont expand to the right and instead would have a
                    character limit of 35 and it wont push the emojie window
                    to the right"): the name field is capped at 35 plain
                    characters, and the editor column is min-w-0 — the 1fr
                    track can never be pushed wider by the field's content,
                    so the emoji picker column on the right stays exactly
                    where it was, whatever the name. */}
                <RichInput
                  autoFocus
                  value={modal.name}
                  maxLength={35}
                  placeholder="Class name: select text for formatting"
                  onChange={(v) => setModal((m) => (m ? { ...m, name: v } : m))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitModal();
                  }}
                />

                {modal.type === 'new' && (
                  <div>
                    <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">PARENT</div>
                    <select
                      className="gd-input"
                      value={modal.parent || ROOT_CLASS_ID}
                      onChange={(e) => setModal((m) => (m ? { ...m, parent: e.target.value } : m))}
                    >
                      {modalParentOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.id === ROOT_CLASS_ID ? opt.name : `${'· '.repeat(depthOf(classes, opt.id))}${stripRichText(opt.name)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                  <div>
                    <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">ICON & PREVIEW</div>
                    <div className="flex items-center gap-2 min-w-0">
                      {/* 0.34.0 — THE PREVIEW IS THE CLASS BUTTON NOW; 0.37.0
                          — it mirrors the NEW CARD anatomy (chevron box ·
                          icon · name · count on a hugging plate) and wears
                          the picked COLOR, so what you build is what the
                          tree will show — wash, ring, bar and all.
                          0.38.0 — THE WASH SHOWS PROPERLY ("in the preview
                          show it properly since only the icon colors in"):
                          the wash selectors read data-colored on the ROW
                          (the real rows set it there), so the preview row
                          carries it too — and the icon wears the same
                          contrast-aware variant the tree paints. */}
                      <span
                        className="gd-tree-row group relative flex items-center h-8 select-none flex-1 min-w-0"
                        style={{ paddingLeft: 6, ...(isHexColor(modal.color) ? { '--cls': modal.color } : null) }}
                        data-colored={isHexColor(modal.color) ? modal.color : undefined}
                        title="The class row as the tree will show it"
                      >
                        <span className="gd-tree-card">
                          <span className="gd-tree-exp is-blank" aria-hidden />
                          <span
                            className="gd-tree-ico flex-shrink-0 flex items-center"
                            style={
                              isHexColor(modal.color)
                                ? { color: contrastAwareIconColor(modal.color, mixHex(modal.color, panelHex, 0.22)) }
                                : undefined
                            }
                          >
                            {modal.icon ? <ChipGlyph name={modal.icon} size={13} /> : <FolderOpen size={13} />}
                          </span>
                          <RichText
                            text={stripRichText(modal.name).trim() || 'Preview'}
                            as="span"
                            className="gd-tree-name min-w-0 truncate text-[12px]"
                          />
                          <span className="gd-tree-count tabular-nums flex-shrink-0">0</span>
                        </span>
                      </span>
                      <span className="text-[10px] text-gd-mute flex-shrink-0">pick one on the right →</span>
                    </div>
                  </div>

                  {/* 0.37.0 — CLASS COLOR ("add the option to color classes"):
                      the in-app picker + a NONE key that clears back to the
                      theme's own plate. The wash is always a PANEL MIX, so
                      the name, count and icons stay readable on any shade.
                      0.38.0 — PRESET COLORS ("add preset colors for the
                      class colors"): the swatch ladder rides beside the
                      picker — one click lands a curated wash. */}
                  <div>
                    <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">COLOR</div>
                    <div className="gd-cls-presets">
                      {CLASS_COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          className={clsx('gd-cls-preset', isHexColor(modal.color) && modal.color.toLowerCase() === preset && 'is-active')}
                          style={{
                            background: preset,
                            borderColor: isHexColor(modal.color) && modal.color.toLowerCase() === preset ? 'var(--gd-chrome)' : 'var(--gd-ink)',
                          }}
                          title={preset}
                          onClick={() => setModal((m) => (m ? { ...m, color: preset } : m))}
                        />
                      ))}
                      <span className="gd-swatch-divider" aria-hidden />
                      <ColorPickerButton
                        color={isHexColor(modal.color) ? modal.color : null}
                        dashed
                        title="Class color: tints this class's card and its branch line"
                        onColor={(hex) => setModal((m) => (m ? { ...m, color: hex } : m))}
                        // 1.6.3 — the picker's reset speaks the same road
                        // the NO COLOR key below the presets does (the
                        // theme's own plate).
                        onReset={() => setModal((m) => (m ? { ...m, color: null } : m))}
                      />
                      <button
                        type="button"
                        className="gd-btn !py-1 !px-2 text-[10px]"
                        title="No class color: the theme's own plate"
                        onClick={() => setModal((m) => (m ? { ...m, color: null } : m))}
                      >
                        <Palette size={11} />
                        NONE
                      </button>
                    </div>
                    <span className="block mt-1.5 text-[9px] leading-relaxed text-gd-mute">
                      tints the card & its branch line, text stays readable
                    </span>
                  </div>
              </div>

              <div>
                <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">ICON PICKER</div>
                <LucideIconPicker value={modal.icon} onSelect={(icon) => setModal((m) => (m ? { ...m, icon } : m))} />
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function depthOf(classes, id) {
  let depth = 0;
  let cur = (classes || []).find((c) => c.id === id);
  const seen = new Set();
  while (cur && cur.parentId && cur.parentId !== ROOT_CLASS_ID && !seen.has(cur.id)) {
    seen.add(cur.id);
    depth += 1;
    cur = (classes || []).find((c) => c.id === cur.parentId);
  }
  return depth;
}
