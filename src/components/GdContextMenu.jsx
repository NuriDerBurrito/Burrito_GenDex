import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { motion } from 'framer-motion';

// 1.2.2 — THE MENU'S OWN TARGET MEMORY ("keep the item/button/anything
// highlighted when i right click on it (such as classes or cards and such)
// as if hovered on as long as the right click window exists"): a single
// capture-phase listener (installed once, per document) remembers the
// element the LAST contextmenu event was fired on. Every menu mounts with
// the pointer's true seat known — no call site changes, no new props: the
// menu walks up from the remembered target to the nearest hot item (the
// tree row, the card, the chip, the key…), paints it .is-ctx-hot for the
// menu's whole life, and lifts the hold the moment the menu closes. The
// CSS pairs the class with each surface's own hover language.
// 1.4.9 — THE CARD UNDER THE HOT KEY STAYS HOVERED TOO ("there is a clash
// between card backshadow with the hover/not hover, where sometimes if i
// have right click open it would act as if im not hovering on it, fix that
// so if i have right click on a card it would act as if im hovering on
// it"): right-clicking a card's own CHILD keys (a tag chip, a stamp slot,
// the vers badge — anything the nearest-hot walk lands on FIRST) used to
// hold ONLY that child hot while the CARD around it dropped its whole
// hover language (the backshadow collapsing was the loudest part). The
// hold now carries EVERY .gd-card-hover between the hot item and the
// surface: the card keeps its lifted shadow, its brightened art, its
// seated version badge and its hover column for the menu's whole life,
// exactly as if the cursor had never left it.
let lastCtxTarget = null;
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener(
    'contextmenu',
    (e) => {
      lastCtxTarget = e.target instanceof Element ? e.target : null;
    },
    true
  );
}
const CTX_HOT_SELECTOR = [
  '.gd-tree-row',
  '.gd-card-hover',
  '.gd-chip',
  '.gd-btn',
  '.gd-icon-btn',
  '.gd-stamp-slot',
  '.gd-sort-item',
  '.gd-img-slot',
  '.gd-spot-tile',
  '[data-gd-hot]',
].join(',');
function ctxHotFor(target) {
  if (!target || typeof target.closest !== 'function') return null;
  try {
    return target.closest(CTX_HOT_SELECTOR);
  } catch {
    return null;
  }
}
// 1.4.9 — the full hold list: the nearest hot item PLUS every card that
// wraps it (the card's own hover language speaks through .is-ctx-hot on
// its own seat — see the pairings in index.css).
function ctxHoldList(target) {
  const hot = ctxHotFor(target);
  const held = [];
  if (hot) held.push(hot);
  let walk = hot || target;
  while (walk && typeof walk.closest === 'function') {
    const card = walk === hot ? walk.parentElement?.closest?.('.gd-card-hover') : walk.closest('.gd-card-hover');
    if (!card) break;
    if (!held.includes(card)) held.push(card);
    walk = card.parentElement;
  }
  return held;
}

// 0.30.0 — THE APP-LEVEL RIGHT-CLICK MENU ("right clicking opens windows,
// such as select all or paste or copy, some special ones like new class or
// edit whats selected or delete (with confirm ofc)").
//
// App builds the item list from whatever is under the cursor (see the
// contextmenu listener in App.jsx) and hands it here; this component only
// PAINTS it: a fixed-position pill-card at the pointer, clamped to the
// viewport (measured once after mount — no listeners while open), entries
// with icon + label + optional shortcut hint, separators, disabled and
// danger states. Picking an entry runs its action and closes; Escape,
// focus loss, a click outside, or any scroll closes it without acting.
// A modal being open never suppresses the listener anymore (0.32.0): the
// windows' own fields + selections + pictures speak this menu too.
//
// 0.32.0 — the TEXT menu joined the family ("make the selection text
// context window stylized like the rest"): editable fields, selections
// and pictures render through this same pill — the NATIVE menu is retired
// app-wide, and this component's radius is capped in the CSS so a
// pill-round theme still CONTAINS its rows (its first and last rows would
// otherwise curl so hard the TEXT clipped into the curve).
//
// 0.36.0 — RISE, DON'T SCROLL ("same with right click windows"): the clamp
// already walks the menu UP until it fits; a menu taller than the viewport
// itself now pins to the top edge and scrolls INSIDE (max-height +
// overflow-y auto) — the scrollbar is the last resort, never the first.
//
// 0.45.0 — THE MENU LIVES AT BODY LEVEL NOW. The 0.44 bug ("right click on
// the card settings does something that causes scrollbars to appear") had
// the wrong cure: the menu is position:fixed, but it RENDERED inside the
// detail view's sticky header — a translateZ(0) compositing layer whose
// box fixed coordinates are measured against, so the menu landed far off
// its seat and dragged the panel's scrollbars with it. Removing the menu
// treated the symptom; PORTALING it to document.body treats the cause —
// the card paints in the top layer, its fixed position reads against the
// viewport, and any button (the header's gear, the pin, a chip in any
// transformed wrapper) can own a menu again.

export default function GdContextMenu({ x, y, items, onClose }) {
  const cardRef = useRef(null);
  const hotRef = useRef([]);
  const [pos, setPos] = useState({ left: x, top: y });
  const [maxH, setMaxH] = useState(null);
  // 1.2.2 — THE HOT HOLD: the item the menu was opened from stays lit for
  // the menu's whole life (see the target memory note above). The class
  // lands on mount (before the menu paints) and lifts on unmount — the
  // elements may already be gone, which is harmless.
  // 1.4.9 — the hold is a LIST now (the card under a held child key keeps
  // its own hover language — see ctxHoldList above).
  useLayoutEffect(() => {
    const held = ctxHoldList(lastCtxTarget);
    lastCtxTarget = null; // one menu consumes one press — a fresh right-click re-arms
    const live = held.filter((el) => el && typeof el.classList !== 'undefined');
    for (const el of live) el.classList.add('is-ctx-hot');
    hotRef.current = live;
    return () => {
      const hot = hotRef.current;
      hotRef.current = [];
      for (const el of hot || []) {
        if (el?.isConnected && typeof el.classList !== 'undefined') el.classList.remove('is-ctx-hot');
      }
    };
  }, []);
  // 0.45.0 — the body-level portal target (same lazy law as Modal and the
  // huge viewer: jsdom never sees a portal it can't mount, and the menu
  // only exists at body level once there IS a body).
  const [portalTo, setPortalTo] = useState(null);
  useLayoutEffect(() => {
    setPortalTo((prev) => prev || (typeof document !== 'undefined' && document.body ? document.body : prev));
  }, []);

  // 0.43.0 — A MENU OPENING DISMISSES THE HOVER PILL ("tooltips sometimes
  // hover over the context windows, fix that so it doesnt cover right click
  // windows even if it pops up after"): the pill's z-index now sits UNDER
  // the menu (see .gd-tip in index.css), and this extra step drops anything
  // already visible the moment a menu opens — a tooltip floating BESIDE the
  // menu while you read it is noise.
  useLayoutEffect(() => {
    if (typeof document === 'undefined' || !document.querySelector) return;
    const tip = document.querySelector('[data-gd-tooltip]');
    if (tip) {
      tip.classList.remove('is-on');
      tip.style.display = 'none';
    }
  }, []);

  // 1.6.5 — THE MENU NO LONGER STILLS THE COATS ("when i right click on a
  // card, it pauses the animation of the finishes for some reason … fix
  // that so it only pauses if i open big windows, like settings or full
  // detail window"): the 1.4.8 law armed the SAME reference-counted
  // gd-coats-frozen still Modal speaks — but a menu is a small floating
  // card, not a window that covers the app, and the owner reads the coats'
  // held breath behind it as a bug. The arm is RETIRED here; the still
  // belongs to the Modal family alone now (settings, the full detail
  // window, the ask windows — the true covers). The root's own counter is
  // untouched for the Modals that still speak it.

  // Clamp to the viewport once, after the natural size is known (before
  // paint — no flash of an offscreen menu).
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const w = el.offsetWidth || 200;
    const h = el.offsetHeight || 120;
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;
    // 0.36.0 — taller than the screen itself: pin to the top edge and let
    // the menu scroll inside; everything shorter keeps its natural height.
    if (h > vh - 16) setMaxH(Math.max(120, vh - 16));
    else setMaxH(null);
    setPos({
      left: Math.max(8, Math.min(vw - w - 8, x)),
      top: Math.max(8, Math.min(vh - h - 8, y)),
    });
  }, [x, y, items]);

  // Dismiss paths: Escape, a click outside, the window losing focus, or any
  // scroll (a menu that floats over content sliding under it reads wrong —
  // better gone).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
    };
    const onPointerDown = (e) => {
      if (cardRef.current && e.target instanceof Node && !cardRef.current.contains(e.target)) onClose?.();
    };
    const onScroll = () => onClose?.();
    const onBlur = () => onClose?.();
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('blur', onBlur);
    };
  }, [onClose]);

  const menu = (
    <motion.div
      ref={cardRef}
      className="gd-ctx-menu"
      role="menu"
      style={{ left: pos.left, top: pos.top, ...(maxH ? { maxHeight: maxH, overflowY: 'auto' } : {}) }}
      initial={{ opacity: 0, y: -3 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -3 }}
      transition={{ duration: 0.1 }}
    >
      {(items || []).map((item) => {
        if (item.separator) return <span key={item.id || Math.random()} className="gd-ctx-sep" aria-hidden />;
        // 0.31.0 — REGION HEADERS: every region's menu opens with a small
        // muted chip naming WHERE it came from (CARD VIEWER, CLASS TREE,
        // IMAGE STAGE…) — the menus are per-region now ("each region would
        // have different right click context windows"), and the chip makes
        // the difference readable at a glance instead of only by content.
        if (item.header) {
          return (
            <span key={item.id || item.header} className="gd-ctx-header">
              {item.header}
            </span>
          );
        }
        const Icon = item.icon || null;
        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            className={clsx('gd-ctx-item', item.danger && 'is-danger', item.disabled && 'is-disabled')}
            disabled={item.disabled}
            title={item.hint || undefined}
            onClick={() => {
              if (item.disabled) return;
              onClose?.();
              // run after the state update so the menu is gone before any
              // confirm window it opens paints on top of it
              setTimeout(() => item.onPick?.(), 0);
            }}
          >
            {Icon && <Icon size={12} strokeWidth={2.4} className="flex-shrink-0" />}
            <span className="gd-ctx-label">{item.label}</span>
            {item.shortcut && <span className="gd-ctx-kbd">{item.shortcut}</span>}
          </button>
        );
      })}
    </motion.div>
  );
  return portalTo ? createPortal(menu, portalTo) : menu;
}
