import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

// 0.9.0 — dropdowns rendered through a PORTAL at document.body with fixed
// coordinates. The old absolute popovers lived inside the center viewer
// column (overflow: hidden + side panels later in the DOM), so anything
// opening near the right edge was clipped exactly at the character panel's
// border — "the spotlight window clips behind the right side panel". Portaled
// + z-index 300+, they now float above EVERY pane and are never clipped.
//
// `anchor` is a ref to the trigger button; the popover drops 6px below it,
// aligned to its left (or right edge when align="end"), clamped to the
// window. Clicking the fixed backdrop closes it. Position recomputes while
// open on window resize.
//
// 0.34.0 — NEVER OUTSIDE THE SCREEN, either side ("ensure dropdown windows /
// right click windows dont clip outside the screen"). The first pass clamps
// horizontally and drops below the anchor; the moment the card is painted
// (still pre-paint — layout effects run before the browser commits) its REAL
// size is measured and the card FLIPS ABOVE the anchor when it would run off
// the bottom, and clamps its height to whatever room is left — a dropdown
// opened low on a short window can no longer spill past the bottom edge.
//
// 0.34.0 — CLOSE ON WINDOW-OPEN: when any modal mounts (App watches the DOM
// for [data-gd-modal] and fires gd-close-popovers), every open dropdown
// dismisses itself — opening Settings (whose key sits ABOVE a popover's
// backdrop, out of its reach) no longer leaves the filter menu floating
// behind the window.
//
// 0.36.0 — EXTEND, DON'T SHRINK ("dropdown windows are too small, such as
// filters and sorting and so on, fix that so they extend properly, only if
// they cant position higher and still would clip is when they stoop and the
// scrollbar comes into play"). The old default maxHeight (60vh) capped every
// dropdown at a little over half the screen EVEN WHEN there was room to
// spare — content crammed and scrolled for nothing. The policy is now a
// ladder, and every rung is tried before the next:
//   1. NATURAL SIZE first — the card is measured UNCLAMPED (pre-paint), so
//      dropdowns grow to fit their content.
//   2. DROP BELOW the anchor; if the bottom clips, FLIP ABOVE the anchor
//      (also at natural size — no scrollbar).
//   3. Only when NEITHER side fits does the card take the taller side's
//      remaining room and scroll inside — the stoop, the last resort.
// A caller may still pass its own maxHeight as a hard cap; nothing else
// caps the card but the room itself.
//
// 0.37.0 — CALLER-MANAGED SCROLLING (innerScroll): the stamp picker (and
// any dropdown built like it) keeps its HEADER and its FOOTER action row
// pinned while only the middle list scrolls — "the header of the stamp
// menu would clip out of the window… ensure that the button to add a new
// stamp would act as a footer so its always there, and then scroll to
// select any stamp". With innerScroll the capped card becomes a flex
// column with overflow hidden: the caller's own middle section (flex: 1,
// min-height: 0, overflow-y: auto) is the ONLY thing that scrolls, so the
// title stays glued to the top and the upload key to the bottom no matter
// how deep the gallery runs. Without the prop the card keeps the old
// whole-card scrollbar.
export default function Popover({
  open,
  onClose,
  anchor,
  children,
  width = 300,
  align = 'start',
  className,
  maxHeight = null,
  innerScroll = false,
}) {
  const [pos, setPos] = useState(null);
  const [capH, setCapH] = useState(null); // 0.36.0 — the room cap, null = natural
  // 1.2.6 — THE CLOSING FLIGHT ("add a animation for closing dropdown
  // windows such as filters or sorting (simmilar to closing the right click
  // window)"): the card used to unmount the instant `open` fell — a hard
  // blink, while the right-click window fades out under its own exit. The
  // card now lingers for a 220ms gd-pop-out flight (1.6.3: a real
  // ease-out FADEOUT — see the keyframes) before it leaves: the caller's
  // `open` is the TRUTH for placement and content, and `leaving` alone
  // keeps the last painted card alive for its goodbye. The backdrop stops
  // answering the pointer the moment the close begins — a dying dropdown
  // can never eat the click that follows.
  const [leaving, setLeaving] = useState(false);
  const leaveTimerRef = useRef(0);
  const wasOpenRef = useRef(false);
  // 1.2.6 — THE GOODBYE BEGINS IN THE RENDER THE CLOSE LANDS (measured
  // live: with the flip in an effect, ONE render ran with open=false and
  // leaving=false — alive fell, the card UNMOUNTED, and the gd-pop-out
  // flight never played; the dropdown read as an instant blink, the very
  // report it was meant to retire). The open edge is tracked render-time
  // (the repo's settingsOpenRef pattern) and the leaving flag flips in
  // the SAME render the close arrives — a setState during render, the
  // React-sanctioned derive-from-props escape hatch; React discards the
  // half-built render and commits the leaving one — the card never sees
  // the gap. The effect below only owns the CLOCK (the timer that
  // retires the leaving card) and re-entry cleanup.
  // 1.6.2 — the clock walked with the CSS flight (0.17s of fade + settle
  // + rise).
  // 1.6.3 — THE CLOCK WALKS WITH THE READABLE FADE (see gd-pop-out's
  // keyframes: the goodbye is a 0.22s ease-out fade that speaks FIRST):
  // 220ms covers the whole breath before the unmount — the same clock
  // the CSS flight speaks, never a frame shorter.
  if (open) {
    if (!wasOpenRef.current) wasOpenRef.current = true;
    if (leaving) setLeaving(false);
  } else if (wasOpenRef.current) {
    wasOpenRef.current = false;
    if (!leaving) setLeaving(true);
  }
  useEffect(() => {
    if (!leaving) return undefined;
    leaveTimerRef.current = setTimeout(() => {
      leaveTimerRef.current = 0;
      setLeaving(false);
    }, 220);
    return () => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = 0;
      }
    };
  }, [leaving]);
  const cardRef = useRef(null);
  const rafRef = useRef(0);
  // 0.38.0 — THE TOP FLOOR ("the stamp selection window clips below the top
  // toolbar, fix that"): the app's toolbar is a z-400 bar across the window's
  // top 40px, and this popover sits at z-310 — a card that flipped above its
  // anchor near the top of the screen slid UNDER the bar and vanished behind
  // it. Every vertical placement now keeps the card at least 44px from the
  // window's top, below the bar, always fully visible.
  const TOP_FLOOR = 44;

  // Pass one — anchor-relative placement with a horizontal clamp.
  // 1.2.6 — the close no longer clears the seat: the leaving card keeps
  // its last painted position through the gd-pop-out flight (clearing pos
  // on `open` falling unmounted the card mid-goodbye — the flight never
  // ran). The seat clears only when the flight is done (or never began).
  useLayoutEffect(() => {
    if (!open || !anchor?.current) {
      if (!leaving) {
        setPos(null);
        setCapH(null);
      }
      return undefined;
    }
    const place = () => {
      const el = anchor.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const w = Number.isFinite(width) ? width : 300;
      let left = align === 'end' ? r.right - w : r.left;
      left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
      let top = r.bottom + 6;
      // Before the card is measurable, keep it inside the bottom edge with
      // the old conservative clamp; pass two replaces this with the real
      // extend/flip/stoop once the natural height is known.
      if (top > window.innerHeight - 60) top = Math.max(TOP_FLOOR, window.innerHeight - 60);
      setPos((p) => (p && p.left === left && p.top === top ? p : { left, top }));
    };
    place();
    const onResize = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(place);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, anchor, width, align, leaving]);

  // Pass two — the card is painted now (still pre-commit): measure its
  // NATURAL size (max-height unclamped for the read), then walk the ladder:
  // below at natural size → above at natural size → the taller side's room
  // with an inside scrollbar.
  useLayoutEffect(() => {
    if (!open || !pos) return;
    const card = cardRef.current;
    const el = anchor?.current;
    if (!card || !el) return;
    const r = el.getBoundingClientRect();
    // Unclamp for the measure — the style prop re-applies the cap on the
    // next commit, and nothing paints between (layout effects run
    // pre-commit).
    const prevMax = card.style.maxHeight;
    card.style.maxHeight = 'none';
    const w = card.offsetWidth || 0;
    const h = card.offsetHeight || 0;
    card.style.maxHeight = prevMax;
    if (!w || !h) return;
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    let { left, top } = pos;
    // horizontal: never past the right/left edge of the viewport
    const maxLeft = vw - w - 8;
    if (left > maxLeft) left = Math.max(8, maxLeft);
    // vertical ladder — natural below, natural above (but never under the
    // top toolbar), then the stoop.
    const below = r.bottom + 6;
    let finalTop = below;
    let cap = null;
    if (below + h > vh - 8) {
      const above = r.top - 6 - h;
      if (above >= TOP_FLOOR) {
        finalTop = above; // fits above at natural size — no scrollbar
      } else {
        // Neither side fits: take the taller side's remaining room (the
        // above-side's room is measured from the TOP FLOOR, not the window
        // edge — the toolbar's strip belongs to the bar).
        const roomBelow = vh - 8 - below;
        const roomAbove = r.top - 6 - TOP_FLOOR;
        if (roomAbove > roomBelow) {
          cap = Math.max(120, roomAbove);
          finalTop = Math.max(TOP_FLOOR, r.top - 6 - Math.min(h, cap));
        } else {
          cap = Math.max(120, roomBelow);
          finalTop = below;
        }
      }
    }
    setCapH((prev) => (prev === cap ? prev : cap));
    if (left !== pos.left || top !== finalTop) setPos({ left, top: finalTop });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pos]);

  // Height budget: a caller's explicit cap, else whatever room the final
  // position leaves — never a blanket fraction of the screen.
  const maxH = (() => {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    if (capH != null) return capH;
    if (typeof maxHeight === 'number') return Math.max(120, maxHeight);
    if (typeof maxHeight === 'string' && maxHeight.endsWith('vh')) {
      const asked = (parseFloat(maxHeight) || 100) * vh / 100;
      return Math.max(120, asked);
    }
    return undefined; // natural size — the ladder decides
  })();

  // 0.34.0 — a window opening anywhere dismisses every open dropdown.
  useEffect(() => {
    if (!open) return undefined;
    const close = () => onClose?.();
    window.addEventListener('gd-close-popovers', close);
    return () => window.removeEventListener('gd-close-popovers', close);
  }, [open, onClose]);

  // 1.6.5 — THE DROPDOWN NO LONGER STILLS THE COATS ("that also includes
  // when i open dropdown windows such as filters or sorting, fix that so
  // it only pauses if i open big windows"): the 1.4.8 law armed the same
  // reference-counted gd-coats-frozen still Modal speaks — but a dropdown
  // (the filters, the sorting, every picker seat) is a small anchored
  // card, not a window that covers the app, and the owner reads the coats'
  // held breath behind it as a bug. The arm is RETIRED here; the still
  // belongs to the Modal family alone now (settings, the full detail
  // window, the ask windows — the true covers). The root's own counter is
  // untouched for the Modals that still speak it.

  // the card paints while open, and for its closing flight after (pos stays
  // from the open seat — the goodbye happens in place).
  const alive = (open || leaving) && pos != null;
  if (!alive) return null;

  return createPortal(
    <>
      {/* 0.32.0 — data-gd-popover on BOTH the backdrop and the card: the
          app's contextmenu listener reads it to stay SILENT over dropdowns
          ("i dont think i will be right clicking on the dropdown of spotlight
          or sorting options for example") — no menu spawns over a popover
          or its click-away sheet. 1.2.6 — the backdrop vanishes with the
          close (never eats the pointer during the flight). */}
      {open && <div className="fixed inset-0 z-[300]" data-gd-popover="1" onMouseDown={onClose} />}
      <div
        ref={cardRef}
        data-gd-popover="1"
        className={clsx('gd-card gd-pop-in fixed z-[310]', leaving && 'gd-pop-out', className)}
        style={{
          left: pos.left,
          top: pos.top,
          width,
          ...(maxH != null
            ? innerScroll
              ? { maxHeight: maxH, overflowY: 'hidden', display: 'flex', flexDirection: 'column' }
              : { maxHeight: maxH, overflowY: 'auto' }
            : {}),
        }}
      >
        {children}
      </div>
    </>,
    document.body
  );
}
