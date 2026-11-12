import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { layoutMasonry, masonryColumns } from '../utils/helpers.js';

// Measured masonry: fixed card width, shortest-column packing, absolutely
// positioned items. Because every item is out of flow, add/remove/exit never
// fights the layout — and framer's `layout="position"` animates position
// changes only (panel open/close, zoom, ratio, reorder) without ever scaling
// the card contents. Heights are measured live with ResizeObserver so the
// footer text (which scales with --card-scale) is always accounted for.
//
// 0.32.0 — THE CORNER FLIGHT IS DEAD, ROUND TWO ("also fix the issue where
// when the cards spawn they still appear from the bottom left corner, it
// should just appear where it is and not cause lag"). The 0.32.0 settle
// gate made the correction INSTANT — but the one frame it snapped FROM was
// still the wrong picture: containerW started at 0, the first commit packed
// every card into a single ghost column at the far left (deepest cards far
// below the fold), and only the ResizeObserver's async callback brought the
// real width. Instant or not, that frame IS the "spawn from the bottom-left
// corner". THE REAL FIX measures the container BEFORE the first paint:
//   · WIDTH BEFORE PAINT — a mount-time useLayoutEffect reads the inner
//     sheet's clientWidth synchronously (layout effects run before
//     Chromium commits the frame), so the very first commit lays cards out
//     in their true columns. No ghost column, no snap, nothing to animate.
//   · ESTIMATED heights stay — an unmeasured card lays out at the average
//     of its measured siblings (a typical card box), near enough that the
//     measured pass a frame later only nudges things while the settle gate
//     still holds (~90ms of instant layout).
//   · THE SETTLE GATE stays — layout animation runs at duration 0 until
//     the mount geometry stills, then the snappy spring takes over for
//     real moves (drag reorder, resize, zoom, filter).
//
// 1.1.2 — THE VIRTUALIZED SHEET ("add grid virtualization"): only the cards
// whose [top, top+height] intersect the scroller's viewport (plus a generous
// overscan both ways) are MOUNTED — a 600-card class keeps the DOM, the
// ResizeObservers and the framer nodes of ~the visible page, not the whole
// archive. The sheet's own height stays the FULL packed height (the
// scrollbar tells the truth), far cards keep their LAST MEASURED height in
// the map (never-measured ones ride the estimate), and a card that re-enters
// the window after being unmounted appears IN PLACE — its first mount is
// remembered, so the entrance animation runs exactly once per card per grid
// life, never again on scroll. Real removals (filter, delete) still animate
// out through AnimatePresence exactly as before.
/* 1.1.8 — `expandedIds`: the Set of card ids sitting in their EXPANDED
   (double-size, two-column) seat — see the span note at the layout below.
   Null / undefined = every card single-width, the historical grid.
   (eslint: react-hooks/refs is disabled for this component — the virtual
   window IS a ref machine: the scroller, the sheet and every mounted item
   live in refs by design (1.1.2's measured window), and passing a ref
   object to a node is the sanctioned pattern the rule's render-phase model
   cannot see. The 1.1.8 span seat deepened the analysis enough for the
   rule to notice; the patterns themselves are as old as the grid.) */
/* eslint-disable react-hooks/refs */
export default function MasonryGrid({ cardWidth, gap = 20, itemIds, renderItem, className, style, onMouseOver, onAnimationEnd, expandedIds = null, flighting = false, keepInViewId = null }) {
  const scrollRef = useRef(null);
  const sheetRef = useRef(null); // the inner positions sheet — width = content width
  const itemEls = useRef(new Map()); // id -> element
  // 1.4.3 — THE WIDTH FLIGHT ARMS ONLY FOR THE CARD'S OWN SPAN CHANGE
  // ("when i switch to a class that has enlarged cards, for some reason
  // they start as normal then grow, fix that so they are already big"):
  // the wrapper's `transition: width .24s` exists for ONE flight — the
  // user-triggered expand/retract of a LIVE card. On every other path it
  // could only ever read as a defect (a wrapper whose width style changes
  // for any other reason grows on screen — "starts as normal then
  // grows"). The transition now arms per item ONLY when that item's OWN
  // span changes while it stays mounted; mounts and set changes render
  // their width instantly, by construction.
  const spansRef = useRef(new Map());
  // 1.4.3 — THE VIEW SWAP RESTS THE PROJECTION: while the item set changes
  // wholesale (a class switch — the set shrinks/grows by more than a few
  // seats), surviving cards SNAP to their new seats instead of springing
  // across the board (the 0.37.0 "the card viewer should just update" law
  // — a card that was 600px below the fold in the last class does not fly
  // up through the view; it is simply THERE, big, in place). Small deltas
  // (a delete, an add, a drag reorder — same set, new order) keep the
  // spring glide exactly as before.
  // 1.6.3 — THE REST IS RETIRED ("card movement animations is missing when
  // i drag around or when i do class changing , fix that"): the snap was
  // the 0.37.0 era's answer, but the entrance replay the 1.5.9/1.6.0 line
  // taught the board made the SURVIVORS' snap read as a defect — fresh
  // cards rise in while the cards that stayed simply teleport, and the
  // class switch felt like two different boards. The projection now
  // speaks on EVERY set change (layout="position" below — only the panel
  // flight still rests it): a survivor GLIDES to its new seat on the
  // snappy spring (stiffness 700 — a quick beat, never a float), and the
  // 600px-below-the-fold concern is answered by the spring's own speed
  // rather than by silence. The variable stays computed for the debug
  // readers and the comment's history; the layout gate reads `flighting`
  // alone now.
  const prevIdsRef = useRef(null);
  // 1.1.2 — the seen cache: ids that have mounted once — a card the window
  // re-mounts on scroll re-entry appears exactly where it is (initial
  // false), the entrance fade belongs to a card's FIRST arrival only.
  // 1.6.0 — DECLARED ABOVE THE FRESH-BOARD BLOCK (the crash report: "Cannot
  // access 'N' before initialization" while switching repeatedly in
  // classes): the 1.5.9 turnover law read seenRef at the top of the render
  // while the const still sat ~24 lines further down — every WHOLESALE
  // board turnover (a class switch where most incoming cards are fresh)
  // walked straight into the temporal dead zone and the whole view died
  // at the boundary. The declaration now lives BEFORE its first reader,
  // where a ref the render's own head needs always belonged.
  const seenRef = useRef(new Set());
  const nextIds = useMemo(() => new Set(itemIds), [itemIds]);
  const setSwapped = (() => {
    const prev = prevIdsRef.current;
    if (prev == null) return false;
    if (prev.size === nextIds.size && itemIds.every((id) => prev.has(id))) return false;
    const delta = Math.abs(nextIds.size - prev.size);
    return delta > Math.max(3, Math.round(prev.size * 0.5));
  })();
  // 1.5.9 — THE ENTRANCE REPLAYS ON A CLASS SWITCH ("when switching between
  // classes, it seems that on first time it does the cards moving
  // animation, but when i do it multiple times the cards just appear or
  // snap and thats it, fix that"): the entrance fade-and-rise belongs to a
  // card's FIRST arrival on the board — but the seenRef that enforces it
  // never forgets, so the second visit of any class found every card
  // already "seen" and they just appeared (initial false, plus the
  // setSwapped projection rest above snapping the survivors). The board
  // now asks ONE honest question at every set change: are MOST of the
  // incoming cards fresh to the previous set (more than half, or more
  // than three on small boards)? That is a class switch — the whole
  // board turned over — and the seen cache CLEARS for it, so the
  // incoming cards mount through the same entrance flight the class's
  // first visit ever spoke. Small deltas keep the old law exactly (a
  // delete, an add, a drag reorder: never a replay), and scroll
  // re-entry stays instant always — the cache refills at mount, and only
  // the NEXT wholesale turnover clears it again.
  const freshBoard = (() => {
    const prev = prevIdsRef.current;
    if (prev == null) return false;
    let arrivals = 0;
    for (const id of nextIds) if (!prev.has(id)) arrivals += 1;
    if (arrivals === 0) return false;
    return arrivals > Math.max(3, Math.round(nextIds.size * 0.5));
  })();
  if (freshBoard) seenRef.current.clear();
  prevIdsRef.current = nextIds;
  // 1.6.3 — the projection rest's retirement leaves the swap measure
  // computed but unread (the layout gate below answers `flighting` alone);
  // the void keeps the intent explicit for the next reader.
  void setSwapped;
  // 1.2.0 — THE LAYOUT KEY IS THE COLUMN COUNT, NOT THE RAW WIDTH ("fix the
  // issue where cards moving when closing or opening the right panel lags
  // the entire app, fix it so when the cards move its not laggy, as it seems
  // to be cpu related"): the panel's width flight re-flowed this grid every
  // frame — and since a card's SEAT depends only on the COLUMN COUNT (x =
  // column * stride, y from the packed heights), every intermediate width
  // with the same count produced IDENTICAL positions: the re-layout, the
  // framer re-measures and the React reconciliation ran per frame for
  // nothing. The state holds the COUNT now: the ResizeObserver still reads
  // every width, but it only commits when the count actually crosses a
  // boundary — a panel morph re-lays the grid two or three times total
  // instead of ~fourteen, and the settle gate re-arms only on those
  // crossings. A zoom change still lands in the same pass (it changes the
  // count too).
  const [columns, setColumns] = useState(1);
  const [heights, setHeights] = useState({}); // id -> px
  // 0.32.0 — layout animations stay INSTANT until the first paint's
  // geometry has settled; then the spring takes over.
  const [settled, setSettled] = useState(false);
  // 1.1.2 — the virtual window's live edge: the scroller's offset + height.
  const [scrollTop, setScrollTop] = useState(0);
  const [viewH, setViewH] = useState(0);

  const idKey = itemIds.join('\u0000');

  useEffect(() => {
    let alive = true;
    setSettled(false);
    const t = setTimeout(() => {
      if (alive) setSettled(true);
    }, 90);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, []);

  // 1.2.9 — THE SETTLE GATE SPEAKS THE MOUNT ONLY ("fix the cards
  // animations so they dont snap quickly around especially when resizing
  // the window"): the 1.1.9/1.2.0 gate re-armed on every column crossing
  // — each crossing bought 120ms of INSTANT (duration-0) layout, so the
  // panel's flight snapped the card seats to their new columns instead of
  // gliding them. The re-arm is RETIRED: after the mount geometry stills
  // (the 90ms gate above), every seat change — a panel flight's
  // crossings, a zoom change, a drag reorder — rides the spring
  // (stiffness 700, a ~0.15s settle: smooth, never floaty). The
  // crossings during a resize are few per flight and the spring
  // retargets mid-flight cleanly, so the wall breathes with the panel
  // instead of snapping behind it.

  // 0.33.0 — WIDTH BEFORE PAINT: read the inner sheet's width in a LAYOUT
  // effect at mount — layout effects run before the browser commits the
  // first frame, so the first paint already carries the true column count.
  // 1.2.0 — commits the COUNT, not the width (the layout key note above).
  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (el && el.clientWidth > 0) {
      const count = masonryColumns(el.clientWidth, cardWidth, gap);
      setColumns((prev) => (prev === count ? prev : count));
    }
     
  }, []);

  // Track the available width (content box — excludes padding + scrollbar).
  // 1.2.0 — the observer commits only COUNT crossings: identical-count
  // widths produce identical seats, so the per-frame re-layout the panel's
  // morph carried is gone (the CPU jank it caused with it).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 0;
      const h = entries[0]?.contentRect?.height ?? 0;
      if (w > 0) {
        const count = masonryColumns(w, cardWidth, gap);
        setColumns((prev) => (prev === count ? prev : count));
      }
      setViewH((prev) => (Math.abs(prev - h) > 0.5 ? h : prev));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [cardWidth, gap]);

  // 1.1.2 — THE VIRTUAL EDGE: the scroller's own offset, throttled to one
  // read per frame (a state per scroll event would re-render the grid per
  // wheel tick; rAF keeps it to the paint cadence — and the cards are
  // memoized, so each window commit costs only the map over ids).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    let raf = 0;
    const read = () => {
      raf = 0;
      setScrollTop(el.scrollTop || 0);
      const h = el.clientHeight || 0;
      setViewH((prev) => (h && Math.abs(prev - h) > 0.5 ? h : prev));
    };
    const onScroll = () => {
      if (raf) return;
      raf = (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : setTimeout)(read);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
      else if (raf) clearTimeout(raf);
      el.removeEventListener('scroll', onScroll);
    };
  }, []);

  const measureAll = useCallback(() => {
    const next = {};
    for (const [id, el] of itemEls.current) {
      if (el) next[id] = el.offsetHeight;
    }
    setHeights((prev) => {
      const keys = new Set(Object.keys(next));
      for (const id of Object.keys(prev)) {
        if (!keys.has(id)) return next; // an item left
      }
      for (const id of keys) {
        if (Math.abs((prev[id] || 0) - next[id]) > 0.5) return next; // an item resized
      }
      return prev;
    });
  }, []);

  // Re-measure whenever the item set, card width, or column count changes.
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measureAll());
    for (const el of itemEls.current.values()) if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [idKey, cardWidth, columns, measureAll]);

  useLayoutEffect(() => {
    measureAll();
  }, [idKey, cardWidth, columns, measureAll]);

  const columnsNow = Math.max(1, columns); // (kept for the dev attrs/debug readers below)
  void columnsNow;
  /* 1.1.8 — THE EXPANDED CARDS ("when right clicking on a card, add an
     option to expand it … 2 rows instead of one, while still remaining in
     the same aspect ratio"): a Set of ids riding the grid; an expanded
     card's wrapper renders at DOUBLE WIDTH (+ the gap it swallows), so the
     card's art box — an aspect-ratio element — doubles its height with it
     and the whole card keeps its exact proportions at twice the size. The
     layout packs it across TWO ADJACENT COLUMNS (layoutMasonry's span
     seat); the height ESTIMATE doubles for unmeasured wide cards, and the
     RO measures the truth the moment it mounts. */
  const spanOf = (id) => (expandedIds && expandedIds.has?.(id) ? 2 : 1);
  // 1.4.3 — the width-flight arming (see spansRef above): an item whose
  // span CHANGES while mounted carries the transition (the expand/
  // retract flight); every other render carries none.
  const widthArmed = (id) => {
    const prev = spansRef.current.get(id);
    const now = spanOf(id);
    return prev != null && prev !== now;
  };
  const syncSpans = useCallback(() => {
    const next = new Map();
    for (const id of itemIds) next.set(id, spanOf(id));
    spansRef.current = next;
  }, [itemIds, expandedIds]);
  useLayoutEffect(() => {
    syncSpans();
  }, [syncSpans]);
  // 0.32.0 — ESTIMATE, never zero: unmeasured cards borrow the average of
  // the measured ones (a typical collector box — art at the default ratio
  // plus the two-line foot — when nothing is measured yet), so the mount
  // commit spreads them near their final homes instead of stacking ghosts
  // at the top of column one.
  const measured = Object.values(heights).filter((h) => h > 0);
  const estHeight = measured.length
    ? measured.reduce((a, b) => a + b, 0) / measured.length
    : cardWidth * 1.33 + 46;
  /* 1.2.0 — THE MEASURED TRUTH IS THE LAYOUT'S TRUTH ("the image grid does
     snap well but sometimes (especially with landscape cards) it would
     leave after it an entire empty row after it" + "when expanding or
     shrinking a card, some cards when moving would position so low" +
     "when a card expands or shrinks, it seems to take a position midway
     then move to the new position"): the old law multiplied EVERY height
     by 1.9 for a span-2 card — including the MEASURED one. But the RO
     measures the wrapper at its LIVE width: once the card is expanded,
     heights[id] already IS the wide box (measured live: a 257px expanded
     landscape card was fed to the packer as 257*1.9 = 488px — a 231px
     PHANTOM row reserved under it, the "entire empty row"; the followers
     seated "so low"; and the re-pack when the RO corrected it was the
     midway stop). The 1.9 estimate now rides ONLY the UNMEASURED seat
     (the estimate phase before the wide box exists); a measured height
     passes through AS-IS, so the packer always sees the card's true box
     and the expand/shrink flight tracks the width tween frame by frame —
     one continuous motion, never a stop-then-correct. */
  /* 1.2.9 — THE PACK IS MEMOIZED ("fix the lag that occurs when opening
     and closing the right panel … it seems to occur related to the amount
     of cards present"): layoutMasonry ran on EVERY render over the whole
     item list — and the grid re-renders on every App state change (a
     panel open, a view swap, a status ping), so a 400-card wall re-packed
     400 items per render for nothing whenever the inputs had not moved.
     The pack (and the id -> position map) is memoized on its true inputs
     now: the item set, the column count, the card width, the measured
     heights and the expanded seats. Renders that change nothing re-use
     the last pack; the panel's column crossings re-pack exactly once
     each, as before. */
  const laid = useMemo(
    () =>
      layoutMasonry(
        itemIds.map((id) => {
          if (spanOf(id) === 2) {
            const h = heights[id];
            return h != null ? h : estHeight * 1.9;
          }
          return heights[id] ?? estHeight;
        }),
        Math.max(1, columns),
        cardWidth,
        gap,
        itemIds.map((id) => spanOf(id))
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idKey, columns, cardWidth, gap, heights, expandedIds]
  );
  const posById = useMemo(() => new Map(itemIds.map((id, i) => [id, laid.positions[i]])), [idKey, laid]);
  /* 1.9.16 — THE PACKED-SEAT MAP RIDES A REF (see the follow's own law
     below): the effect re-runs on the SELECTION alone now, so its closure
     would freeze the pack at open time — the unmounted fallback reads the
     LIVE seat through this ref, fresh on every beat, whatever the wall
     re-packed since. */
  const posByIdRef = useRef(posById);
  posByIdRef.current = posById;

  // 1.1.2 — THE WINDOW: an item rides the DOM only while its packed span
  // intersects [scrollTop - OVERSCAN, scrollTop + viewH + OVERSCAN]. The
  // overscan is generous (a fast fling's landing zone pre-mounts, so cards
  // are there when the scroll stops) and jsdom-safe: no measured viewport
  // (viewH 0 — the test DOM) renders EVERYTHING, exactly the old behavior,
  // so every existing suite keeps its truth.
  // 1.6.2 — THE WINDOW HAS HYSTERESIS ("sometimes when clicking on cards,
  // they might dissapear for a split second, fix that"): a card's seat can
  // move a whole screen when the pack changes (a panel flight's column
  // crossing, a zoom step, a reorder), and the old ONE-margin window could
  // leave the card's NEW seat just past the far edge — the card played its
  // 0.14s exit flight, then the heights landed, the re-pack brought it back
  // inside, and it remounted: the exact "disappeared for a split second"
  // the eye caught. Mounting and unmounting now speak DIFFERENT margins: a
  // card ENTERS at the generous OVERSCAN it always had, and once mounted it
  // only leaves at TRIPLE that — a re-pack's jump can never escort a live
  // card out of its own window, while a true scroll-away still unmounts
  // exactly as frugally as before (the unmount margin is measured from the
  // card's live seat, and scrolling past TRIPLE the overscan is a long
  // way).
  const OVERSCAN = 700;
  const UNMOUNT_OVERSCAN = OVERSCAN * 3;
  const virtualized = viewH > 0;
  const inWindow = (id) => {
    if (!virtualized) return true;
    const p = posById.get(id);
    if (!p) return true; // not laid yet — mount it; the sheet will seat it
    // 1.1.8 — an expanded card's unmeasured estimate rides the same 1.9x
    // the layout used, so a wide card near the viewport's bottom mounts.
    const h = heights[id] ?? (spanOf(id) === 2 ? estHeight * 1.9 : estHeight);
    const mounted = itemEls.current.has(id);
    const margin = mounted ? UNMOUNT_OVERSCAN : OVERSCAN;
    return p.y + h > scrollTop - margin && p.y < scrollTop + viewH + margin;
  };

  /* 1.9.6 — THE WALL FOLLOWS THE OPEN CARD ("when opening a card and the
     cards viewer would resize to fit the cards in as the right panel comes
     into view , it should still scroll to follow the selected card so its
     fully in view, currently its chaotic, should also apply when opening a
     card thats half out or such"): the panel's width flight re-packs the
     wall (a column crossing springs every card to a new seat), and the
     opened card could land anywhere — half under the fold, fully past it,
     the "chaotic" jump the report names. The wall KEEPS THE OPEN CARD IN
     VIEW through the open event's own consequences: the selection's own
     change settles SMOOTH (one eased 0.2s call; a card already fully
     visible never moves a pixel), and the scroller's resize beats through
     the flight that follows re-assert DIRECTLY (no easing: the beats ride
     the flight frame by frame, so the card reads as PINNED while the wall
     breathes under it — smooth by construction, never a fight between two
     clocks). A selected card that is not yet mounted (the virtual window
     keeps it out) is scrolled to by its packed seat — the window mounts
     it on arrival. No selection, no law: the wall keeps its own scroll.
     1.9.16 — THE WALL WAITS FOR THE OPEN ("when dragging or reordering
     cards around, for some reason it will always snap the viewer to the
     currently open card, fix that so its only when i open a card"): the
     1.9.6 seat re-ran this whole effect on EVERY re-pack trigger — the
     order key, the columns, the heights, the spans — and each re-run
     re-fired the smooth settle, so the drag's commit (and every live
     preview flip under the old default) teleported the view back to the
     open card the moment you rearranged anything, exactly the "always
     snaps" the report names. The effect now re-runs on the SELECTION
     ALONE: a reorder, a zoom step, a late height landing, an expand —
     none of them move the wall anymore. The resize beats ride only the
     open event's own FLIGHT WINDOW (~0.7s — the panel flight the open
     itself summoned, a window resize in the same breath); when the window
     retires the observer disconnects with it, and a resize an hour later
     finds the wall keeping its own scroll exactly as the pack always
     has. The follow speaks when — and only when — you open a card. */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !keepInViewId) return undefined;
    let raf = 0;
    const clampTop = (t) => Math.max(0, Math.min(t, Math.max(0, el.scrollHeight - el.clientHeight)));
    const ensure = (smooth) => {
      raf = 0;
      const card = itemEls.current.get(keepInViewId);
      if (card) {
        const cr = card.getBoundingClientRect();
        const vr = el.getBoundingClientRect();
        let top = el.scrollTop;
        if (cr.top < vr.top + 6) top = el.scrollTop - (vr.top + 6 - cr.top);
        else if (cr.bottom > vr.bottom - 6) top = el.scrollTop + (cr.bottom - (vr.bottom - 6));
        if (Math.abs(top - el.scrollTop) < 0.5) return;
        if (smooth && typeof el.scrollTo === 'function') {
          el.scrollTo({ top: clampTop(top), behavior: 'smooth' });
        } else {
          el.scrollTop = clampTop(top);
        }
        return;
      }
      // not mounted (the virtual window holds it out): settle by its
      // packed seat so the window mounts it on arrival.
      const p = posByIdRef.current.get(keepInViewId);
      if (p) {
        const top = clampTop(Math.max(0, p.y - 24));
        if (Math.abs(top - el.scrollTop) < 0.5) return;
        if (typeof el.scrollTo === 'function') el.scrollTo({ top, behavior: 'smooth' });
        else el.scrollTop = top;
      }
    };
    const schedule = (smooth) => {
      if (raf) return;
      const rider = smooth;
      raf = (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : setTimeout)(() => ensure(rider));
    };
    // the selection's own change settles SMOOTH (one eased call).
    schedule(true);
    // 1.9.16 — the resize beats ride ONLY the open event's own flight
    // window: while it is armed the scroller's resizes re-assert DIRECTLY
    // (the pinned card through the panel flight — the 1.9.6 word), and
    // when it retires the observer disconnects and the wall keeps its own
    // scroll until the next open.
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => schedule(false));
    const disarm = ro ? setTimeout(() => ro.disconnect(), 700) : 0;
    if (ro) ro.observe(el);
    return () => {
      if (disarm) clearTimeout(disarm);
      if (ro) ro.disconnect();
      if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
      else if (raf) clearTimeout(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keepInViewId]);


  return (
    <div ref={scrollRef} className={className} style={style} onMouseOver={onMouseOver} onAnimationEnd={onAnimationEnd}>
      <div ref={sheetRef} className="relative" style={{ height: Math.max(1, laid.height) }}>
        <AnimatePresence initial={false}>
          {itemIds.map((id) =>
            inWindow(id) ? (
              <motion.div
                key={id}
                /* 1.3.0 — THE PROJECTION RESTS WHILE THE PANEL FLIES (the
                   panel-open lag's heaviest frame was the mid-flight column
                   crossing: the re-pack AND framer's projection measuring
                   every visible card in the same frame — ~176 extra
                   getBoundingClientRect reads, measured live). With the
                   flighting prop true the cards carry NO layout projection:
                   a crossing lands as one honest snap inside the 0.22s
                   stretch (barely readable — the whole grid is stretching
                   anyway), and the flight's frames carry only the real
                   layout work. At rest the springs return untouched.
                   1.4.3 — THE VIEW SWAP JOINED THE REST (the class switch:
                   the 0.37.0 "just update" law — see setSwapped above).
                   1.6.3 — THE SWAP LEAVES THE REST (see setSwapped's own
                   note): a class switch now GLIDES its survivors — the
                   movement the owner asked for — and only the panel flight
                   still rests the projection. */
                layout={flighting ? false : 'position'}
                /* 1.1.2 — RE-ENTRY IS STILL: a card the window has mounted
                   before appears exactly where it is (initial false) — the
                   entrance fade belongs to a card's FIRST arrival on the
                   board, never to a scroll. */
                initial={seenRef.current.has(id) ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.14 } }}
                transition={{
                  opacity: { duration: 0.14 },
                  y: { duration: 0.14 },
                  // Snappy spring: cards settle fast and never linger on top of
                  // the add-card slot while reflowing. While the mount geometry
                  // is still settling, layout changes are INSTANT (duration 0)
                  // — the corner-flight fix's second half.
                  layout: settled
                    ? { type: 'spring', stiffness: 700, damping: 46, mass: 0.9 }
                    : { duration: 0 },
                }}
                style={{
                  position: 'absolute',
                  /* 1.1.8 — an EXPANDED card's wrapper spans two columns:
                     double width + the gap between them.
                     1.1.9 — THE EXPAND FLIGHT ("add expand and retract
                     animation to when a card expands to double its size or
                     when it goes back to normal"): the width rides a CSS
                     tween now — the box grows and shrinks on its own clock
                     while framer's layout spring carries the SEAT (the
                     card's art box is aspect-locked, so its height follows
                     the width frame by frame, and the foot's type follows
                     --card-scale's own registered-property tween in
                     lockstep — see index.css).
                     1.4.3 — THE TWEEN IS ARMED, NOT CONSTANT (see
                     spansRef above): only the render that changes THIS
                     card's own span carries the transition — the
                     expand/retract flight keeps its animation, and every
                     mount / set change renders the width instantly (a
                     class switch's enlarged cards are ALREADY big, frame
                     one). */
                  width: posById.get(id)?.span === 2 ? cardWidth * 2 + gap : cardWidth,
                  left: posById.get(id)?.x ?? 0,
                  top: posById.get(id)?.y ?? 0,
                  transition: widthArmed(id) ? 'width 0.24s ease-out' : 'none',
                  // NOTE: deliberately NOT contain:paint — mark ribbons and
                  // out-of-bounds stamps are allowed to hang past this box.
                  contain: 'layout style',
                }}
                ref={(el) => {
                  if (el) {
                    itemEls.current.set(id, el);
                    seenRef.current.add(id);
                  } else itemEls.current.delete(id);
                }}
              >
                {renderItem(id)}
              </motion.div>
            ) : null
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
