import { Children, createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
/* eslint-disable react-hooks/refs --
   THE SEAT MIRROR IS A RENDER-PHASE REF READ, BY DESIGN (the same law
   MasonryGrid's virtual window speaks): the zone's height AS LAST PAINTED
   is the honest prime for the clamp choreography — reading it during
   render is the entire point (the DOM still carries the previous commit,
   the seat the user is actually looking at). The rule cannot see that. */
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useScrollbarBreath from './useScrollbarBreath.js';

// 1.2.2 — THE GHOST SEAT: the measurement twin renders the SAME children
// as the live zone (the honest wrap needs their true boxes), but a ghost
// copy must never OPEN anything on its own — its popovers portal to the
// body and paint BESIDE the live one's ("pressing on +stamps opens two
// wstamp windows, fix that"). Children that mount state-driven portals
// (the stamp picker's ADD key) read this context and stay sealed inside
// the ghost; the geometry stays honest, the windows stay single.
export const SideFlowGhost = createContext(false);

// ---------------------------------------------------------------------------
// 1.1.8 — THE SIDE-FLOW LAW ("when the tags expand beyond 3 rows and stamps
// expand beyond 2 rows, ensure that their container gains a scrollbar which
// allows me to scroll sideways to view the rest, even when expanded it would
// show at most the limits i mentioned, during retracted mode dont allow the
// user to scroll left or right").
//
// 1.1.9 — THE FRONT STAYS THE FRONT: the orientation the user sees never
// changes between seats — the same chips hold the front, the rest rides
// past the right edge. The twin-block track (Block A rows + Block B
// columns) carried that law.
//
// 1.3.2 — THE WALL ("it seems that there is 2 sections … the first
// section is the one first viewed, the one that acts as a front, the
// second one is when it starts to clip out to the right and isnt in front
// anymore, i dont want that, i want both sectors to merge and sort
// towards the left like usual, so it doesnt seperate between the two …
// i dont want pages system" + "same with stamps … its as if each column
// should be its own page (but not, basically just as if its one huge
// entity), each column should be fileld up first before the rest"):
// the PAGES are RETIRED. The paged flow laid the overflow out as full
// row-major wrap slabs side by side, and the front slab never read like
// the rest: its first rows came from the probe's own bands (sparse,
// wide-chipped) while the later pages were greedily packed (dense), so
// scrolling right traded one visual language for another — the exact
// "two sections" separation the user reported, seam gaps included. The
// side seat is ONE CONTINUOUS WALL now — a single grid flowing
// COLUMN-MAJOR: column 1 holds the first `rows` items top to bottom,
// column 2 the next `rows`, and so on, every column filled before the
// next begins, all columns shrink-to-fit and packed from the very left.
// One huge entity: no slabs, no seams, no second section — the wall
// simply continues past the right edge and the pan walks it.
//   · ONE DOM, EVERY SEAT (the 1.2.0 law, kept whole): retracting and
//     expanding NEVER rebuild the wall — the same grid sits in the same
//     scroller in both seats, and the toggle only trades the height
//     clamp plus the sideways scroll lock. NOTHING re-seats between
//     seats ("when the expand/collapse occurs dont do anything to them
//     too just keep it as it is").
//   · HOME TO THE LEFT — every toggle glides the pan back to the wall's
//     left end, in the same breath as the height tween.
//   · THE PROBE STILL MEASURES — the hidden twin answers the item widths
//     and heights (the wall's columns and rows are pure math over them)
//     and the natural wrap's band count still decides when a flow
//     overflows its row cap and takes the wall seat at all.
//
// THE THREE SEATS EVERY ZONE SPEAKS (unchanged law):
//   · RETRACTED — the same wall, clamped to its first `collapsedRows`
//     row(s), NO sideways scroll while folded.
//   · OPEN + FITS — the plain wrapping flow, every row visible (no wall).
//   · OPEN + OVERFLOWS — the column-major wall above, with edge arrows.
// ---------------------------------------------------------------------------

// THE BAND READER — the probe's row bands, relative to its own border box.
// Every band carries `endIdx` (the index, in the flow's item order, of the
// LAST item sitting in that band). The reader also returns:
//   · boxW — the wrap width the items actually use (the descended
//     container's clientWidth — the container's FULL law);
//   · boxContent — the container's CONTENT width (clientWidth minus its
//     own side padding) — the box the plain seat wraps the items at, which
//     is the width every page must carry to reproduce the probe's row
//     breaks (1.2.0: the pages ride at exactly this width);
//   · itemRects — per-item boxes (x/width/height, relative to the flow's
//     own top-left) — 1.2.2's greedy page packer reads the TRUE widths
//     instead of re-deriving them from the bands;
//   · gap — the flow's own column gap, measured off the container the
//     items actually ride (the same gap the pages paint).
function readBands(el) {
  if (!el || typeof el.getBoundingClientRect !== 'function' || typeof window === 'undefined' || !window.getComputedStyle) return null;
  const zoneTop = el.getBoundingClientRect().top;
  const zoneLeft = el.getBoundingClientRect().left;
  const kids = Array.from(el.children || []).filter((n) => n.nodeType === 1);
  if (!kids.length) return null;
  let items = kids;
  let container = el;
  if (kids.length === 1) {
    const only = kids[0];
    const grandKids = Array.from(only.children || []).filter((n) => n.nodeType === 1);
    if (grandKids.length && only.getBoundingClientRect().height >= (el.clientHeight || 0) - 2) {
      items = grandKids;
      container = only;
    }
  }
  const rects = items
    .map((k, idx) => {
      const r = k.getBoundingClientRect();
      return { idx, top: r.top - zoneTop, bottom: r.bottom - zoneTop, left: r.left - zoneLeft, width: r.width, height: r.height };
    })
    .filter((r) => Number.isFinite(r.top) && Number.isFinite(r.bottom));
  if (!rects.length) return null;
  // 1.2.4 — ROWS GROUP BY OVERLAP, NOT BY TOP-THRESHOLD ("the tags leave
  // complete empty rows — the content only sits on the 2nd row, rows 1/3
  // sit empty"): the old band splitter broke rows whenever an item's top sat
  // more than 4px under the row's first top — but the tags zone CENTERS its
  // chips on the cross axis, so a short rider (the trailing + key, a
  // one-line chip beside a two-liner) lands 5px lower than its TALL
  // neighbors IN THE SAME LINE (measured live: "omega" top 289, the + key
  // top 294 — one line, split into two bands). Every phantom band inflated
  // the row count the pages slice on: page cuts landed mid-line, the
  // re-packed pages wrapped TALLER than the cap and the surplus line hid
  // below the clamp — strips whose tail read as an empty row with the
  // content "somewhere else". Items now join a band when their boxes
  // OVERLAP the band's running extent (centered riders overlap their
  // line-mates; successive lines are parted by the flow's own row gap), so
  // a band IS a line, always.
  const sorted = [...rects].sort((a, b) => a.top - b.top || a.idx - b.idx);
  const bands = [];
  for (const r of sorted) {
    const band = bands[bands.length - 1];
    if (band && r.top < band.bottom - 0.5) {
      band.bottom = Math.max(band.bottom, r.bottom);
      band.endIdx = Math.max(band.endIdx, r.idx);
    } else {
      bands.push({ top: r.top, bottom: r.bottom, endIdx: r.idx });
    }
  }
  // 1.2.7 — THE OVERSIZED BAND MERGES ("the tags seem to refuse to fill the
  // gap if the tag is bigger than the container … it should fill the gap and
  // continue off if necessary"): the CSS wrap seats an item WIDER than the
  // box alone on its own line — but the app's own seating law (the retired
  // row packer's oversized seat, kept as the measure's history) puts it at
  // the END of the previous row, its tail continuing off past the edge. The
  // probe's bands must speak the SAME law or the natural wrap's own row
  // count (the overflow test) would disagree with what the user sees. A
  // band that holds EXACTLY ONE item, that item being as wide as the whole
  // content box, folds into the band above it (the band's extent grows to
  // hold its taller rider); the measure now agrees with the wrap on where
  // an oversized chip sits, at every width.
  try {
    const natural2 = Math.max(...rects.map((r) => r.bottom));
    const wByIdx = new Map(rects.map((r) => [r.idx, r.width]));
    const boxW2 = Math.max(0, container.clientWidth || 0);
    let padX2 = 0;
    try {
      const cs2 = window.getComputedStyle(container);
      padX2 = (parseFloat(cs2.paddingLeft) || 0) + (parseFloat(cs2.paddingRight) || 0);
    } catch {
      padX2 = 0;
    }
    const boxContent2 = Math.max(0, boxW2 - padX2);
    let prevEnd = bands.length ? bands[0].endIdx : -1;
    for (let bi = 1; bi < bands.length; ) {
      const band = bands[bi];
      const solo = band.endIdx === prevEnd + 1;
      const w = wByIdx.get(band.endIdx) || 0;
      if (solo && w >= boxContent2 - 1 && Number.isFinite(natural2)) {
        const prev = bands[bi - 1];
        prev.bottom = Math.max(prev.bottom, band.bottom);
        prev.endIdx = band.endIdx;
        prevEnd = band.endIdx;
        bands.splice(bi, 1);
      } else {
        prevEnd = band.endIdx;
        bi += 1;
      }
    }
  } catch {
    /* the merge is a law of agreement, never a crash */
  }
  const natural = Math.max(...rects.map((r) => r.bottom));
  const boxW = Math.max(0, container.clientWidth || 0);
  // 1.2.0 — THE CONTENT WIDTH: the container's clientWidth minus its own
  // side padding. The probe carries the zone's own law (the same padding,
  // the same negative margins), so its content width is the box the PLAIN
  // seat wraps the items at — and the width every page reproduces.
  let boxContent = boxW;
  let gap = 6;
  try {
    const cs = window.getComputedStyle(container);
    const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    boxContent = Math.max(0, boxW - padX);
    const cg = parseFloat(cs.columnGap);
    if (Number.isFinite(cg) && cg > 0) gap = cg;
  } catch {
    boxContent = boxW;
  }
  const itemRects = rects.map((r) => ({ idx: r.idx, w: r.width, h: r.height }));
  // 1.3.2 — the ROOT's own padding-top (the probe element carries the
  // zone's own classes, so this is the ZONE's padding even when the bands
  // descended into a single flow wrapper): the wall's height laws are
  // border-box math on the zone, and the wrapper flavor's inner padding
  // cancels against its own negative margin, so the honest offset is the
  // zone's own, never the descended container's.
  let rootPadTop = 0;
  try {
    rootPadTop = parseFloat(window.getComputedStyle(el).paddingTop) || 0;
  } catch {
    rootPadTop = 0;
  }
  return { bands, natural, boxW, boxContent, itemRects, gap, rootPadTop };
}

// THE PROBE HOOK — every render re-reads (cheap: N getBoundingClientRects),
// the probe's own ResizeObserver catches pure width changes (panel drags),
// and the font-settle re-read catches late webfont metrics. The state only
// moves when the SIGNATURE moves, so the every-render read cannot loop.
// 1.2.7 — THE FLIGHT IS BLIND ("performance on the cpu still declines when
// opening the right panel … i suspect … the top bar / bottom panel and the
// card viewer background texture"): while a panel flight (root .gd-flight)
// or a resize drag (body .gd-resizing) runs, the zone's width moves EVERY
// FRAME — re-measuring (N getBoundingClientRects + a computed style, then a
// re-render of the whole zone) per frame burned CPU through the whole
// tween and painted half-packed lanes mid-drag. The observer now holds its
// seat through the flight and re-measures ONCE when the choreography class
// drops (a MutationObserver watches for exactly that edge); a quiet
// fallback re-read also rides the probe's next honest resize.
// 1.2.8 — THE HOLD IS ONE MIND NOW ("ensure its not multiple minds thinking
// … the stamps would break the 2-rows law while resizing"): the 1.2.7 hold
// only guarded the OBSERVER path — but ANY re-render of the zone (a
// neighboring ResizeObserver-driven state change, a hover, the name fold's
// own probe) ran the every-render layout effect and re-measured MID-FLIGHT
// anyway: the zone re-packed on whatever beat an unrelated render landed,
// between frames of CSS re-wrapping under it (measured live: a plain-seat
// stamps zone exploded to 3 rows at 401px, re-packed to 2 pages at 379px,
// while the tags zone rode the SAME drag uncapped to 5 rows at 300px —
// three different truths visible in one drag). The hold now guards EVERY
// measure path: the observer, the every-render layout effect, and the
// font-settle re-read all defer to `held()` — and a drag is a flight too
// (body .gd-sort-live rides any useThumbSort drag, armed by the engine):
// the pages keep their grab-time arrangement through the whole drag (the
// glide transforms paint the reorder, the snapshot stays valid, the
// identity validation holds), and ONE honest re-measure lands when the
// last hold class drops (the same MutationObserver edge).
function useSideMeasure(probeRef) {
  const [measure, setMeasure] = useState(null);
  const sigRef = useRef('');
  // 1.2.8 — the shared hold state: any measure path that meets a live hold
  // arms `pending` instead; the MutationObserver's class-drop edge spends
  // it exactly once. A ref (not state) — the hold must never re-render.
  const pendingRef = useRef(false);

  // THE HOLD LAW — one predicate, every caller: a resize drag or a live
  // sort drag owns the zone's width; measuring under either reads a moving
  // target and re-paints half-arranged lanes.
  // 1.3.0 — THE PANEL FLIGHT LEFT THE HOLD ("while right pannel is opening
  // the stamps and tags seem to expand to multiple rows then shrinks to 2
  // rows, fix that"): the 1.2.7 hold guarded .gd-flight because the panel's
  // content used to reflow mid-flight — but 1.2.7 ALSO gave the flight a
  // FIXED-WIDTH content wrapper (the aside's clip is the only thing that
  // animates; the full-window cover slides via transform), so a zone
  // inside a flight NEVER sees a moving width anymore. Worse, the hold
  // trapped the zones' FIRST measure: the staged mount (1.2.9) lands the
  // tags zone one frame into the flight and the stamps zone the frame
  // after — both met a LIVE hold, deferred their measure to the class-drop
  // edge 380ms later, and painted their mount frame UNCAPPED (measured
  // live: the tags zone mounted at 181px / 6 rows, the stamps at 212px /
  // 4 rows, then snapped to 90/108 when the flight ended — the exact
  // expand-then-shrink the user watched). The flight is out of the hold
  // now: the staged zones measure the moment they mount (the width is
  // already final), paint their capped side seat from the first frame, and
  // the flight-end re-measure is a signature no-op. The resize drag
  // (.gd-resizing — the panel edge handle drives the content width LIVE)
  // and the sort drag (.gd-sort-live — the pages must keep their grab-time
  // arrangement) keep the hold: those widths genuinely move.
  const held = () => {
    try {
      const body = typeof document !== 'undefined' ? document.body : null;
      return !!(body && (body.classList.contains('gd-resizing') || body.classList.contains('gd-sort-live')));
    } catch {
      return false;
    }
  };

  const remeasure = useCallback(() => {
    const next = readBands(probeRef?.current);
    if (!next) return;
    // 1.3.2 — the heights ride the signature too: the wall's row heights
    // are math over the measured item heights, so a name edit that grows
    // a chip must re-measure even when every width (and the band count)
    // stands still.
    const nextSig = `${next.bands.length}:${Math.round(next.natural)}:${Math.round(next.bands[next.bands.length - 1]?.bottom || 0)}:${Math.round(next.boxW || 0)}:${Math.round(next.boxContent || 0)}:${(next.itemRects || []).map((r) => `${Math.round(r.w)}x${Math.round(r.h)}`).join(',')}`;
    if (sigRef.current === nextSig) return;
    sigRef.current = nextSig;
    setMeasure(next);
  }, [probeRef]);

  useLayoutEffect(() => {
    // 1.2.8 — the render path honors the hold too (see the hook's note): a
    // re-render that lands mid-flight keeps the zone's last honest measure
    // and arms the pending flag for the class-drop edge.
    if (held()) {
      pendingRef.current = true;
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    remeasure();
  });

  useEffect(() => {
    const el = probeRef?.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    let pending = false;
    const ro = new ResizeObserver(() => {
      if (held()) {
        pending = true;
        pendingRef.current = true;
        return;
      }
      remeasure();
    });
    ro.observe(el);
    let mo = null;
    if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
      mo = new MutationObserver(() => {
        const spend = (pending || pendingRef.current) && !held();
        pending = false;
        pendingRef.current = false;
        if (spend) remeasure();
      });
      try {
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        if (document.body) mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      } catch {
        /* attribute observation is a courtesy, never a crash */
      }
    }
    return () => {
      ro.disconnect();
      if (mo) mo.disconnect();
    };
  }, [probeRef, remeasure]);

  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts?.ready?.then) return undefined;
    let alive = true;
    document.fonts.ready.then(() => {
      if (alive && !held()) remeasure();
    }).catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return measure;
}

// THE ZONE — one component, three seats. `rows` is the OPEN cap (3 tags,
// 2 stamps, 5 on the creation board); `collapsedRows` is the RETRACTED clamp
// in rows (1 everywhere except the creation board's 3); `floorPx` is the
// clamp floor — 31 for the tag chips, 55 for the stamp slots (the 0.46.0
// law: the strip's own stack is 7px headroom + the 44px slot = 51px, the
// TOP ring paints 2px past the slot's bottom edge and its glow 4px —
// 52 shaved the ring, 55 lets the whole mark breathe; the floor holds that
// reach in every theme).
// `selfFlow` says the zone's OWN children are the flowing items (tags).
// `flowClass` (the stamps flavor) says the zone wraps its children in that
// class — .gd-stamp-slots — so the strip's own law rides one wrapper in
// every seat; in the paged seat that wrapper becomes the TRACK holding the
// pages. `flowRef` optionally receives the LIVE flow container (the caller's
// sort engine binds to it): the flowClass flavor's wrapper (the stamps) or
// the ZONE ELEMENT ITSELF in the selfFlow flavor (1.3.0 — the tags row's
// own drag engine binds to the zone; its .gd-sort-item query and its paged
// packer read the zone's own pages exactly like the stamps' wrapper).
export function SideFlowZone({
  rows = 3,
  collapsedRows = 1,
  collapsed = false,
  floorPx = 31,
  zoneClassName = '',
  selfFlow = true,
  flowClass = '',
  flowRef = null,
  seatClassName = '',
  // 1.3.3 — THE WALL'S READING ORDER: 'column' keeps the 1.3.2 fill (each
  // column top-to-bottom before the next — the creation board's seat, the
  // user's named exception); 'row' reads across the rows (first row left
  // to right, then the second — the detail panel's stamps + tags seats,
  // "first row first column then first row second column, second row …").
  // 1.3.4 — THE DETAIL PANEL RETURNS TO 'column' ("they act as pages and
  // sort from top to bottom, instead i want them to act as one big
  // scrollable container that sorts from left instead, as they should fit
  // inside the empty areas"): the row-major reading was the 1.3.3
  // misreading — it put the first HALF of the collection on the top row,
  // every visible window carried two non-consecutive runs (each screen
  // its own "page"), and the order only advanced top-row-all-the-way then
  // bottom-row — "sort from top to bottom". The column-major fill is the
  // law everywhere again: column 1 holds the first `rows` items, the
  // columns fill up before the next begins ("fit inside the empty
  // areas"), the front window shows one consecutive block, and the pan
  // walks the order left to right — one huge scrollable entity. The prop
  // keeps both lattices; every live seat passes 'column'.
  wallOrder = 'column',
  // 1.3.5 — THE LANE WALL ("if a tag that is too long exists, it would just
  // consume horizontal real estate until i see any actual other tags on the
  // right side in the full 3 rows, since apparently only the longest
  // decides, fix that so it accounts for each row on its own"): the
  // column lattice sizes every column to its WIDEST member — a long chip
  // widens its whole column and the SHORT chips sharing it ride its left
  // edge with dead space to their right, so the lanes above and below stay
  // empty until the pan passes the wide column (measured live: a 166px tag
  // pushed its column-mates 172px right, both neighbor lanes carrying
  // ~120px of dead air). 'lanes' re-seats the self-flow wall as R
  // independent ROWS: lane r holds the items at order r, r+R, r+2R… (the
  // same reading assignment the column lattice speaks), and each lane
  // packs ITS OWN items left to right, nowrap — a long chip only pushes
  // the chips AFTER it in ITS row, every other lane keeps its density, and
  // the zone stays ONE scroller walking the whole wall (the 1.3.4
  // one-entity law untouched). The stamps wall keeps the column lattice
  // (uniform widths — nothing to re-seat); the creation board keeps its
  // column-major exception.
  wallPack = 'columns',
  // 1.3.6 — THE UNIFORM STAND-IN PROBE ("when i open the right pannel, the
  // right pannel would lag, caused by the stamps, as a card without stamps
  // opens smoother than a card that has stamps"): the probe twin renders
  // the caller's whole children set a SECOND time so its measurements are
  // honest — for the stamps zone that meant every slot (art, marks, hover
  // keys, the ring) mounted twice and every stamp image decoded twice, all
  // inside the panel flight's heaviest frame. When the flow's leading
  // items are UNIFORM (the stamp slots are a fixed 44x44 — a law of
  // .gd-stamp-slot), the probe can measure them with cheap stand-in boxes:
  // `uniformItems = { count, w, h }` renders `count` inert spans at exactly
  // that size in the twin and the REAL children from `count` on (the ADD /
  // PASTE / settings keys — the variable-width tail whose true boxes the
  // measure still needs). The stand-ins pack the probe's flow exactly as
  // the slots do (same widths, same gap, same wrap), so every band, every
  // item rect and every cap the twin ever reports is byte-identical to the
  // old measurement — the zone just never pays the double mount again.
  uniformItems = null,
  // 1.4.4 — THE LIGHT PROBE ("when opening right pannel, the app freezes
  // for a second midway as i see half of the right panel as empty then it
  // snaps to the right panel open with elements, fix that"): a zone may
  // hand its probe a CHEAPER element list than the live one — `probeItems`
  // renders in the hidden twin INSTEAD of the caller's children. The items'
  // LAYOUT boxes must match the live ones byte-for-byte (the measurement
  // reads the twin); the trick is dropping everything that costs DOM or
  // script but contributes NO width: the tags wall's chip carries an
  // absolutely-positioned ribbon (zero layout contribution — see
  // .gd-chip-shape), so its probe chips render the same padding, the same
  // icon, the same label — and no ribbon, no drag bindings, no SVG. The
  // probe's cost drops with it, and the wall's measurement stays honest.
  probeItems = null,
  ariaLabel,
  children,
}) {
  const probeRef = useRef(null);
  const zoneRef = useRef(null);
  const seatRef = useRef(null);
  const measure = useSideMeasure(probeRef);

  // THE SEAT MIRROR: the zone's height AS PAINTED, captured during RENDER
  // (the DOM still carries the PREVIOUS commit — the seat the user is
  // actually looking at). The entering prime reads it so the retract runs
  // from wherever the zone genuinely IS — never from a lie.
  // 1.3.6 — THE MIRROR SLEEPS THROUGH A SORT ("when i move and drag stamps
  //   around … the stamp container seems to lift slightly"): the read is a
  //   forced layout (offsetHeight) and a drag's verdict changes re-render
  //   the whole view per pointermove — the mirror forced a style+layout
  //   flush on EVERY verdict, stacking the drag's own transform writes
  //   into one long layout queue per frame (the drag's jank). Nothing
  //   geometric moves while a sort lives (transforms only — the seat, the
  //   zone and the headroom stand exactly where the grab found them), so
  //   the mirror keeps its last honest value and the drag's renders run
  //   layout-free.
  const seatHRef = useRef(0);
  if (
    zoneRef.current &&
    typeof zoneRef.current.getBoundingClientRect === 'function' &&
    !(typeof document !== 'undefined' && document.body?.classList?.contains?.('gd-sort-live'))
  ) {
    const seatH = zoneRef.current.offsetHeight;
    if (seatH > 0) seatHRef.current = seatH;
  }

  const bands = measure?.bands || [];
  const natural = measure?.natural || 0;
  const boxContent = measure?.boxContent || 0;
  // 1.2.7 — THE OVERSIZED FORCE ("it should fill the gap and continue off if
  // necessary"): a flow holding an item as wide as the box itself OVERFLOWS
  // sideways even when its rows fit — the CSS wrap would strand the chip
  // alone (the 1.2.5-era gap report), so such a flow always speaks the
  // WALL seat (the oversized item takes its own column seat and the pan
  // reaches it). The plain CSS wrap only ever paints flows that genuinely
  // fit.
  const hasOversized =
    boxContent > 0 && (measure?.itemRects || []).some((r) => r.w >= boxContent - 1);
  const needsSide = bands.length > rows || hasOversized;

  // ---- 1.3.2 — THE WALL GEOMETRY (pure math over the probe's measures) ----
  // The wall is a grid flowing column-major: item i sits at ROW (i % rows)
  // of COLUMN floor(i / rows). Its row tracks size to the TALLEST item
  // seated at that row (exactly what `grid-template-rows: repeat(R, auto)`
  // paints), its columns size to the widest item they hold (exactly what
  // `grid-auto-columns: max-content` paints) — the paint and this math are one
  // law, so the clamp heights below are the wall's true painted heights.
  // 1.3.3 — THE ROW-MAJOR WALL (wallOrder="row"): the reading runs ACROSS
  // the rows instead — item i sits at ROW floor(i / C) of COLUMN (i % C),
  // C = ceil(N / R) — exactly what `grid-auto-flow: row` +
  // `grid-template-columns: repeat(C, max-content)` paints. The row bands
  // feed the same clamp heights either way; only the seat assignment
  // differs, and the FRONT row carries the FIRST items ("first row first
  // column then first row second column, second row … and so on" — the
  // front is the first viewed, the reading order the plain wrap speaks).
  const wallItems = measure?.itemRects || [];
  const wallGap = measure?.gap || 6;
  const wallPadTop = measure?.rootPadTop || 0;
  const wallRowOrder = wallOrder === 'row';
  const wallLanes = wallPack === 'lanes' && !wallRowOrder;
  const wallR = Math.max(1, Math.min(rows, Math.max(1, wallItems.length)));
  const wallC = Math.max(1, Math.ceil(Math.max(1, wallItems.length) / wallR));
  const wallRowH = [];
  for (let i = 0; i < wallItems.length; i += 1) {
    const seat = wallRowOrder ? Math.floor(i / wallC) : i % rows;
    wallRowH[seat] = Math.max(wallRowH[seat] || 0, wallItems[i].h || 0);
  }
  const wallRowsUsed = wallRowH.length;
  const wallContentH = wallRowsUsed
    ? wallRowH.reduce((a, b) => a + b, 0) + wallGap * Math.max(0, wallRowsUsed - 1)
    : 0;
  const wallNatural = Math.round(wallPadTop + wallContentH);
  const wallTopAt = (r) => wallPadTop + wallRowH.slice(0, r).reduce((a, b) => a + b, 0) + wallGap * r;

  // the cap: the wall's own height (all its rows) + the 5px mark reach.
  const capH = wallRowsUsed ? Math.round(wallNatural + 5) : null;
  // the RETRACTED clamp. 1.3.2 — the wall speaks its OWN rows: the fold
  // cuts at the first `collapsedRows` wall rows (the cut lands between
  // rows exactly like the old band law — never a sliver of the next row —
  // with the same +5 mark reach vs the next row's top - 1 mercy).
  const cBand = Math.max(1, Math.min(collapsedRows, Math.max(1, wallRowsUsed || bands.length)));
  const retractH = wallRowsUsed
    ? Math.max(
        floorPx,
        Math.round(
          wallRowsUsed > cBand
            ? Math.min(wallTopAt(cBand) - 1, wallTopAt(cBand) - wallGap + 5)
            : wallTopAt(cBand) + 5
        )
      )
    : bands.length
      ? Math.max(
          floorPx,
          Math.round(
            bands.length > cBand ? Math.min(bands[cBand - 1].bottom + 5, bands[cBand].top - 1) : bands[cBand - 1].bottom + 5
          )
        )
      : floorPx;

  const sideActive = !collapsed && needsSide && capH != null;

  // ---- the clamp/open choreography (probe-driven, unchanged 1.1.9 law) ----
  const [flightMax, setFlightMax] = useState(undefined);
  const wasCollapsedRef = useRef(false);
  const releaseRef = useRef(0); // the pending open-release timer
  const flightTargetRef = useRef(null); // the running flight's destination
  // 1.4.0 — THE INTEGER FLIGHT ("when i scroll to the bottom of the right
  // pannel, then press on expand the stamps/tags container, for some
  // reason the right pannel other stuff such as the prompts and image and
  // so on all go 1px up then 1px down constantly until the animation is
  // over"): the height tween used to ride the CSS transition on
  // .gd-collapse-zone, which interpolates FRACTIONAL intermediate
  // heights — the zone's box rounded up and down device-pixel by
  // device-pixel through the flight, and everything the panel stacks
  // below it (the prompts, the image, the body columns) wobbled ±1px for
  // the whole 320ms. The flight drives itself NOW: a rAF tween through
  // the SAME 320ms cubic-bezier(0.22, 0.61, 0.36, 1) curve, writing
  // WHOLE pixels only (transition: none while it runs — the CSS curve is
  // still the release's own), so the layout below the zone never
  // re-rounds mid-flight. The from-seat is captured at the prime (the
  // retract) and at the fold's own effect (the expand); a retarget
  // restarts from wherever the tween has actually painted.
  const flightRafRef = useRef(0);
  const flightFromRef = useRef(null);
  const flightPosRef = useRef(null);
  // 1.2.4 — THE PAN WINDOW: the x axis stays a scroll container (and the
  // PAGES stay mounted) for a beat after the seat folds, so the smooth
  // home pan has a range to glide through — then the zone seals (the
  // 1.1.8 "no sideways scroll while retracted" law holds in the resting
  // seat). Armed by the retract itself; cleared on its own clock.
  const [panOpen, setPanOpen] = useState(false);
  const panTimerRef = useRef(0);
  const armPanWindow = () => {
    setPanOpen(true);
    if (panTimerRef.current) clearTimeout(panTimerRef.current);
    panTimerRef.current = setTimeout(() => {
      panTimerRef.current = 0;
      setPanOpen(false);
    }, 500);
  };
  const openTarget = () => (needsSide && capH != null ? capH : Math.max(floorPx, natural || 0) + 2);

  // 1.2.4 — THE HOME PAN rides the pan window's own effect: the scroll
  // starts only AFTER the commit that opens the x axis (a smooth scroll
  // started against a sealed axis can die at birth). Armed by the
  // retract, flown here.
  const panZoneRef = useRef(null);
  panZoneRef.current = zoneRef.current;

  // 1.2.0 — THE FADE SEAT: the fades (and the arrows' frame) must cover the
  // ZONE's own clip box, and the zone overhangs its seat through the
  // headroom law (the negative margins that carry the chips' marks past the
  // seat's edges). The overhang is MEASURED and written as CSS vars on the
  // seat, so the left fade starts flush at the scroller's clip plane.
  // 1.2.2 — AND THE VEIL'S OWN EDGES ARE THE CONTENT BOX'S: spanning the
  // zone's whole box reached over the separator above (the stamps zone's
  // top overhang crosses the hairline between the rows) and across the
  // scrollbar below. Two more vars seat the veil on the scroller's CONTENT
  // box: --gd-seat-fade-t = the zone's content top (below the separator,
  // inside the tray), --gd-seat-fade-b = the horizontal scrollbar's height
  // plus whatever air sits under the zone. The fades keep the left plane
  // (--gd-seat-ox-l, the clip edge) and trade the vertical span for the
  // content's own territory — no furniture under the veil.
  const writeSeatOverhang = useCallback(() => {
    const seat = seatRef.current;
    const zone = zoneRef.current;
    if (!seat || !zone || typeof zone.getBoundingClientRect !== 'function') return;
    // 1.3.6 — THE SEAT WRITES NOTHING WHILE A SORT LIVES: the overhang vars
    //   are geometry the grab already proved (nothing moves during a drag —
    //   transforms only), and the write's own gBCR pair is a forced layout
    //   on every verdict-change render — the same thrash the seat mirror's
    //   guard above retires. The last written values stand until the drag
    //   ends; the next honest render re-writes them.
    if (typeof document !== 'undefined' && document.body?.classList?.contains?.('gd-sort-live')) return;
    const s = seat.getBoundingClientRect();
    const z = zone.getBoundingClientRect();
    const l = Math.round(z.left - s.left);
    const t = Math.round(z.top - s.top);
    const b = Math.round(s.bottom - z.bottom);
    let padTop = 0;
    let sbH = 0;
    try {
      const zs = window.getComputedStyle(zone);
      padTop = parseFloat(zs.paddingTop) || 0;
      // the horizontal scrollbar's own height (classic bars eat the client
      // box; a bar-less scroller reads 0)
      sbH = Math.max(0, Math.round((zone.offsetHeight || 0) - (zone.clientHeight || 0)));
    } catch {
      padTop = 0;
    }
    const fadeT = Math.round(t + padTop);
    const fadeB = Math.round(b + sbH);
    const vars = ['--gd-seat-ox-l', '--gd-seat-ox-t', '--gd-seat-ox-b', '--gd-seat-fade-t', '--gd-seat-fade-b'];
    const vals = [`${l}px`, `${t}px`, `${b}px`, `${fadeT}px`, `${fadeB}px`];
    const cur = vars.map((v) => seat.style.getPropertyValue(v));
    if (cur[0] === vals[0] && cur[1] === vals[1] && cur[2] === vals[2] && cur[3] === vals[3] && cur[4] === vals[4]) return;
    vars.forEach((v, i) => seat.style.setProperty(v, vals[i]));
  }, []);

  useLayoutEffect(() => {
    writeSeatOverhang();
  });

  useLayoutEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return undefined;
    if (collapsed) {
      const entering = !wasCollapsedRef.current;
      wasCollapsedRef.current = true;
      // a retract cancels any pending open-release: the flight is the
      // clamp now.
      if (releaseRef.current) {
        clearTimeout(releaseRef.current);
        releaseRef.current = 0;
      }
      // 1.2.0 — HOME TO THE LEFT: retracting returns the pan to the very
      // front page in the same breath as the clamp ("it should always move
      // to the most left when doing so"). 1.2.4 — THE HOME IS A FLIGHT, NOT
      // A SNAP ("when retracting the left/right scroll it shouldnt snap,
      // it should have a return animation"): the pan used to land at 0 in
      // one tick — the seat swap unmounted the pages, the scroll range
      // collapsed and the compositor clamped scrollLeft to 0 instantly —
      // the whole strip teleported sideways under the height tween. The
      // pages stay mounted through the fold now (sideMounted below — a
      // lag-free derivation), and the retract ARMS THE PAN WINDOW: its own
      // effect glides the pan home (smooth) once the axis is open, while
      // the rows fold over it; the fades and arrows drain on their own
      // 0.18s clock (the 1.2.2 linger keeps the group mounted through the
      // retract).
      if (entering && needsSide && capH != null && zone.scrollLeft > 0) armPanWindow();
      // a zone whose whole content fits the kept rows has nothing to fold.
      // 1.3.2 — the side seat's truth is the WALL's natural height (the
      // probe's wrap height is a different layout's number).
      const seatNatural = needsSide && capH != null ? wallNatural : natural;
      if (seatNatural <= retractH + 2) {
        flightTargetRef.current = null;
        setFlightMax(undefined);
        return undefined;
      }
      if (entering) {
        // THE PRIME IS THE PAINTED SEAT — pre-paint it, force a reflow,
        // then clamp: the tween runs from where the zone IS. The clip
        // speaks the Y AXIS ONLY (overflowY hidden): the x axis must stay
        // a scroll container for the home pan's flight — the .is-side
        // class keeps it auto while the pages are mounted (sideMounted),
        // and a blanket overflow: hidden in this same tick was measured
        // killing the smooth scroll outright (scrollLeft 150 -> 0 in one
        // frame).
        // 1.4.0 — the prime is also the INTEGER FLIGHT's from-seat (the
        // re-render's own inline write replaces the prime before the
        // driver effect can read it, so the value rides a ref).
        const prime = seatHRef.current || zone.offsetHeight || natural || 0;
        flightFromRef.current = Math.round(Math.max(1, prime));
        zone.style.maxHeight = `${Math.max(1, prime)}px`;
        zone.style.overflowY = 'hidden';
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        zone.offsetHeight;
      }
      setFlightMax(retractH);
      flightTargetRef.current = retractH;
      return undefined;
    }
    if (wasCollapsedRef.current) {
      wasCollapsedRef.current = false;
      // 1.4.0 — the INTEGER FLIGHT's from-seat: the zone still wears its
      // retracted clamp in THIS frame (the re-render that carries the open
      // target has not committed yet) — the honest retracted height rides
      // the ref for the driver below.
      flightFromRef.current = Math.round(zone.offsetHeight || retractH || 0);
      // opening: tween to the open target, then release.
      if (releaseRef.current) {
        clearTimeout(releaseRef.current);
        releaseRef.current = 0;
      }
      // 1.2.0 — HOME TO THE LEFT on the expand too: the front page is what
      // opens, never wherever the pan happened to sit. 1.2.4 — the same
      // smooth flight the retract speaks (a pan mid-strip at expand time —
      // a scroll that never went home — glides back instead of snapping).
      if (zone.scrollLeft > 0) {
        try { zone.scrollTo({ left: 0, behavior: 'smooth' }); } catch { zone.scrollLeft = 0; }
      }
      const target = openTarget();
      setFlightMax(target);
      flightTargetRef.current = target;
      releaseRef.current = setTimeout(() => {
        releaseRef.current = 0;
        flightTargetRef.current = null;
        setFlightMax(undefined);
      }, 320);
      return undefined;
    }
    if (flightTargetRef.current != null) {
      // a measure moved while a flight is running: retarget the running
      // flight to the current truth.
      const target = openTarget();
      if (target !== flightTargetRef.current) {
        flightTargetRef.current = target;
        setFlightMax(target);
      }
    }
    return undefined;
  }, [collapsed, retractH, capH, needsSide, natural, floorPx, rows, collapsedRows]);

  // 1.4.0 — THE INTEGER FLIGHT'S DRIVER (see the refs' own note above):
  // whenever a flight target commits, the tween runs on rAF through the
  // same 320ms cubic-bezier(0.22, 0.61, 0.36, 1) the CSS transition
  // always spoke, writing WHOLE-PIXEL max-heights (transition: none
  // inline while the flight lives — the sheet's own curve stays armed for
  // every other state change, the release included). Retargets restart
  // from the tween's painted seat; the release (flightMax -> undefined)
  // cancels the flight and hands the height back to the sheet. The
  // re-assert on every render keeps React's own inline write from
  // outrunning the tween mid-flight.
  useLayoutEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return undefined;
    if (flightMax == null) {
      if (flightRafRef.current) {
        cancelAnimationFrame(flightRafRef.current);
        flightRafRef.current = 0;
      }
      flightPosRef.current = null;
      flightFromRef.current = null;
      zone.style.transition = '';
      return undefined;
    }
    const to = Math.round(flightMax);
    const from =
      flightPosRef.current != null
        ? Math.round(flightPosRef.current)
        : flightFromRef.current != null
          ? Math.round(flightFromRef.current)
          : Math.round(zone.offsetHeight || 0);
    if (from === to) {
      flightPosRef.current = to;
      zone.style.maxHeight = `${to}px`;
      return undefined;
    }
    cancelAnimationFrame(flightRafRef.current);
    zone.style.transition = 'none';
    const t0 = performance.now();
    const DUR = 320;
    // the sheet's own curve, solved for y at t: cubic-bezier(0.22, 0.61, 0.36, 1)
    const bezY = (t) => {
      const x1 = 0.22;
      const y1 = 0.61;
      const x2 = 0.36;
      const y2 = 1;
      let u = t;
      for (let i = 0; i < 8; i += 1) {
        const x =
          3 * u * (1 - u) * (1 - u) * x1 + 3 * u * u * (1 - u) * x2 + u * u * u - t;
        const dx =
          3 * (1 - u) * (1 - u) * x1 + 6 * u * (1 - u) * (x2 - x1) + 3 * u * u * (1 - x2);
        if (Math.abs(x) < 1e-5 || Math.abs(dx) < 1e-6) break;
        u -= x / dx;
      }
      return 3 * u * (1 - u) * (1 - u) * y1 + 3 * u * u * (1 - u) * y2 + u * u * u;
    };
    const step = (now) => {
      const t = Math.min(1, (now - t0) / DUR);
      const v = Math.round(from + (to - from) * bezY(t));
      flightPosRef.current = v;
      zone.style.maxHeight = `${v}px`;
      if (t < 1) {
        flightRafRef.current = requestAnimationFrame(step);
      } else {
        flightRafRef.current = 0;
        flightPosRef.current = to;
      }
    };
    flightRafRef.current = requestAnimationFrame(step);
    return undefined;
  }, [flightMax]);

  // re-assert the tween's painted seat on every render (React's own inline
  // write of the flight TARGET must never win a frame against the tween)
  useLayoutEffect(() => {
    const zone = zoneRef.current;
    if (zone && flightRafRef.current && flightPosRef.current != null) {
      zone.style.maxHeight = `${Math.round(flightPosRef.current)}px`;
    }
  });

  // the release timer's unmount cleanup (1.4.0: the integer flight's rAF
  // dies with the zone too — a leaked flight would keep writing a dead
  // element's style)
  useEffect(
    () => () => {
      if (releaseRef.current) clearTimeout(releaseRef.current);
      if (panTimerRef.current) clearTimeout(panTimerRef.current);
      if (flightRafRef.current) cancelAnimationFrame(flightRafRef.current);
    },
    []
  );

  // 1.2.4 — THE PAN WINDOW'S OWN FLIGHT: the retract armed the window;
  // this effect runs in the commit that OPENED the x axis (panOpen true —
  // the seal is gone, the pages are mounted, the range is live), so the
  // smooth home scroll starts against a scrollable axis and glides. Fires
  // once per window; re-arming while open just re-runs it harmlessly.
  const panRanRef = useRef(false);
  useEffect(() => {
    if (!panOpen) {
      panRanRef.current = false;
      return undefined;
    }
    if (panRanRef.current) return undefined;
    panRanRef.current = true;
    const zone = panZoneRef.current;
    if (zone && zone.scrollLeft > 0) {
      try { zone.scrollTo({ left: 0, behavior: 'smooth' }); } catch { zone.scrollLeft = 0; }
    }
    return undefined;
  }, [panOpen]);

  // ---- the sideways seat: scroll edges + arrows ----
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);
  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone || !sideActive) {
       
      setCanL(false);
      setCanR(false);
      return undefined;
    }
    const read = () => {
      const max = zone.scrollWidth - zone.clientWidth;
      setCanL(zone.scrollLeft > 1);
      setCanR(max > 1 && zone.scrollLeft < max - 1);
    };
    read();
    zone.addEventListener('scroll', read, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(read) : null;
    if (ro) ro.observe(zone);
    return () => {
      zone.removeEventListener('scroll', read);
      if (ro) ro.disconnect();
    };
  }, [sideActive, measure]);

  const nudge = (dir) => {
    const zone = zoneRef.current;
    if (!zone || typeof zone.scrollBy !== 'function') return;
    zone.scrollBy({ left: dir * Math.max(140, Math.round(zone.clientWidth * 0.75)), behavior: 'smooth' });
  };

  // 1.2.4 — THE SIDE SEAT LINGERS THROUGH THE FOLD: while the zone's flow
  // still overflows, the PAGES stay mounted (and the zone stays the
  // sideways track) through the retract, the collapsed rest and the expand
  // — ONE DOM for the whole cycle (the 1.2.0 law, now complete): the front
  // rows never rebuild, and the smooth home pan has a scroll range to
  // glide through under the height clamp. DERIVED FROM THE MEASURE ALONE
  // (needsSide/capH never move with `collapsed`): the first commit of a
  // retract keeps the pages too — a state-lagged derivation (flightMax /
  // panOpen) unmounted them for one commit and the scroll range died
  // before the pan could fly (measured live: scrollLeft 150 -> 0 in the
  // microtask after the click). The plain seat returns only when the flow
  // truly fits again.
  const sideMounted = needsSide && capH != null;
  // the x axis: open while the side seat is live (or the pan window runs);
  // SEALED by inline style through the collapsed rest (the class order
  // alone cannot seal it — .is-side's overflow-x: auto out-ranks
  // .is-collapsed's shorthand — and the 1.1.8 "no sideways scroll while
  // retracted" law must hold once the pan has landed). panOpen lags the
  // retract by one commit: the axis seals for that single frame (nothing
  // to scroll yet), opens for the pan window, then seals for the rest.
  const xOpen = sideActive || panOpen;

  // 1.2.8 — THE RESTING CAP ("the stamps break the 2-rows law while
  // resizing — for fucks sake"): the open PLAIN seat used to carry no
  // height law at all — it painted the flow's natural height because the
  // measure said the flow FITS. But a resize drag holds the measure
  // (the flight-blind law) while the box narrows underneath and the CSS
  // wrap re-flows LIVE: the "fits" flow grew 3, 4, 5 rows through the
  // drag, UNCAPPED, until the class dropped and one honest re-measure
  // snapped it back (measured live: 108px → 160px → 3+ rows mid-drag; the
  // tags zone rode the same drag to 143px / 5 rows). The zone now writes
  // its own ceiling at every honest render — the `rows`-th band's bottom
  // plus the marks' +5 reach (exactly the side seat's capH law), or the
  // natural height + 5 when the flow fits — and clips under it. When the
  // measure is honest the ceiling never touches the content (it IS the
  // content's height); when the measure goes stale mid-drag, the stale
  // ceiling holds the zone at `rows` rows and the re-wrapping overflow
  // folds under the clip until the class-drop re-measure re-packs ONE
  // honest time. The 2-rows law (and the 3-rows tags law) now holds at
  // every frame of every drag, not just at rest. The SIDE seat needs no
  // cap — its pages are structurally ≤ `rows` lanes tall — and must keep
  // its overflow-x scroller, so the cap rides the PLAIN seat only.
  const restCap = bands.length
    ? Math.round(bands[Math.min(Math.max(1, rows), bands.length) - 1].bottom + 5)
    : null;
  const zoneStyle = {
    // 1.2.4 — THE FLIGHT'S CLIP SPEAKS THE Y AXIS ONLY (see the entering
    // prime above): overflowY hidden folds the rows under the height
    // tween while the x axis lives on the .is-side class (auto) — a
    // blanket overflow: hidden in the same tick as the smooth home scroll
    // was measured killing the flight outright.
    ...(flightMax != null ? { maxHeight: flightMax, overflowY: 'hidden' } : {}),
    // 1.3.6 — THE CAP FLOORS THE FLIGHT TOO ("when i let go of a stamp,
    //   sometimes the stamp container will extend to 3 rows for a split
    //   second"): the 1.2.8 resting cap used to stand down while a height
    //   flight ran (flightMax != null skipped the law), so a plain-seat
    //   render whose measure blinked stale — the release's reorder landing
    //   before the honest re-measure commits — painted the flow at its
    //   NATURAL height for that one commit: a third row of stamps
    //   flashing in and folding back under the wall a frame later. The
    //   floor now speaks through the whole flight: the plain seat's
    //   ceiling is the GREATER of the flight's own tween target and the
    //   resting cap, so an honest expand still tweens to its full target
    //   (the target is never below the cap when the measure is true) while
    //   a stale blink finds the ceiling already standing — the third row
    //   never paints. The retract keeps its own smaller clamp untouched:
    //   the floor is gated on !collapsed, so folding to one row still
    //   folds.
    ...(!collapsed && !sideMounted && restCap != null
      ? { maxHeight: Math.max(flightMax ?? 0, restCap), overflow: 'hidden' }
      : {}),
    ...(sideMounted && !xOpen ? { overflowX: 'hidden' } : {}),
    ...(sideActive ? { ['--gd-side-cap']: `${capH}px` } : {}),
  };
  // debug seat — harmless data attributes (tests + live forensics).
  // 1.3.3 — the flowItems TDZ repair: the old debug block read flowItems
  // BEFORE its declaration below (a latent ReferenceError whenever
  // data-gd-debug armed the block) and spoke the column-major column
  // count only — the count now derives from the measure's own item count
  // (defined above) and names the READING order beside it.
  const dbgCount = measure?.itemRects?.length || 0;
  const dbgCols = sideMounted
    ? Math.max(1, Math.ceil(Math.max(1, dbgCount) / Math.max(1, Math.min(rows, Math.max(1, dbgCount)))))
    : 0;
  const dbg =
    typeof document !== 'undefined' && document.documentElement?.hasAttribute?.('data-gd-debug')
      ? {
          ['data-side-bands']: String(bands.length),
          ['data-side-natural']: String(Math.round(natural)),
          ['data-side-retract']: String(retractH),
          ['data-side-cap']: String(capH ?? 0),
          ['data-side-flight']: String(flightMax ?? ''),
          ['data-side-boxw']: String(Math.round(measure?.boxW || 0)),
          ['data-side-pw']: String(Math.round(boxContent)),
          ['data-side-wall-natural']: String(wallNatural),
          ['data-side-cols']: String(dbgCols),
          ['data-side-order']: wallRowOrder ? 'row' : 'column',
          ['data-side-pack']: wallLanes ? 'lanes' : 'columns',
        }
      : null;

  // the flow payload: the caller's children, normalized to a stable item
  // list (the probe and the plain seats render the ORIGINAL node untouched).
  const flowItems = useMemo(() => Children.toArray(children), [children]);
  // 1.7.0 — THE ZONE'S OWN BAR BREATHES (see useScrollbarBreath +
  // @property --gd-sb in index.css): the wall's horizontal bar appears
  // the moment the tags/stamps overflow their row cap and disappears
  // when the last chip leaves — the whole zone used to jump by the
  // gutter's height in one frame at both ends, the row beneath it
  // riding the jump with it. The class + hook pair tweens the bar's
  // own height through those flips instead: the gutter hands itself
  // over frame by frame.
  useScrollbarBreath(zoneRef, 'x', [flowItems.length, needsSide, collapsed, rows]);
  // 1.4.4 — the probe's own item list: the caller's LIGHT elements when one
  // is spoken (probeItems), else the live children.
  const probeFlowItems = useMemo(() => Children.toArray(probeItems || children), [probeItems, children]);

  // 1.3.6 — the uniform stand-ins (see the uniformItems prop note above):
  // the probe's cheap body for a flow whose leading items are a fixed size
  // — count inert boxes at exactly (w, h), then the caller's real children
  // from count on (the variable tail the measure still needs honest). The
  // keys are stable per index, so a count change (a stamp added/removed)
  // reconciles in place — the probe never remounts more than it must.
  const uniform = uniformItems && Number.isFinite(uniformItems.count) && uniformItems.count > 0 ? uniformItems : null;
  const standInCount = uniform ? Math.max(0, Math.min(uniform.count, probeFlowItems.length)) : 0;
  const probeTail = uniform ? probeFlowItems.slice(standInCount) : probeFlowItems;
  const standIns = useMemo(
    () =>
      uniform
        ? Array.from({ length: standInCount }, (_, i) => (
            <span key={`gd-standin-${i}`} className="gd-flow-standin" style={{ width: uniform.w, height: uniform.h }} />
          ))
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uniform ? uniform.count : 0, uniform ? uniform.w : 0, uniform ? uniform.h : 0, standInCount]
  );

  const renderPlain = (ref) =>
    flowClass ? (
      <div className={flowClass} ref={ref}>
        {children}
      </div>
    ) : (
      children
    );

  // the probe's own body: the plain flow's geometry with the stand-in body
  // when the caller speaks uniformItems — the LIVE zone never renders this
  // (it keeps the caller's real children in every seat), only the hidden
  // twin trades the slots for boxes.
  // 1.4.4 — probeItems: the twin renders the caller's LIGHT list when one
  // is spoken (same layout boxes, less DOM) instead of the real children.
  const probeChildren = probeItems || children;
  const renderProbe = () =>
    flowClass ? (
      <div className={flowClass}>
        {standIns ? [...standIns, ...probeTail] : probeChildren}
      </div>
    ) : standIns ? (
      [...standIns, ...probeTail]
    ) : (
      probeChildren
    );

  // 1.3.2 — THE WALL RENDERER: ONE grid, the caller's children in their
  // exact flow order. No slicing, no packing, no pages: the grid itself
  // is the whole layout, shrink-to-fit columns (grid-auto-columns:
  // max-content) packed from the very left ("sort towards the left like
  // usual"), and the row track count is exactly the rows the content
  // uses — never a trailing empty track. The stamps flavor (flowClass)
  // renders the grid ON the flow wrapper (the drag engine's container
  // keeps its binding); the self-flow flavor renders the children
  // straight into the ZONE, which carries the grid through
  // .is-side.is-self-flow (see index.css) — one law, two carriers,
  // exactly like the paged seat it replaces.
  // 1.3.3 — THE READING ORDER RIDES THE CARRIER: wallOrder="row" turns
  // the flow row-major through data-gd-wall-order (see index.css) and
  // the columns come from an inline repeat(C, max-content) template —
  // C = ceil(N / R), the reading width — so auto-placement seats item i
  // at row floor(i / C), column (i % C): the first row carries the first
  // C items, the second row the next C, the DOM order IS the reading
  // order. The default ("column") keeps the 1.3.2 fill untouched.
  const renderSide = () => {
    const R = Math.max(1, Math.min(rows, flowItems.length));
    const C = Math.max(1, Math.ceil(Math.max(1, flowItems.length) / R));
    const gridStyle = wallRowOrder
      ? { gridTemplateRows: `repeat(${R}, auto)`, gridTemplateColumns: `repeat(${C}, max-content)` }
      : { gridTemplateRows: `repeat(${R}, auto)` };
    if (flowClass) {
      return (
        <div
          className={clsx(flowClass, 'is-wall')}
          ref={flowRef}
          style={gridStyle}
          data-gd-flow="wall"
          data-gd-pack-rows={String(rows)}
          data-gd-pack-gap={String(Math.round(wallGap))}
          data-gd-pack-order={wallRowOrder ? 'row' : 'column'}
          {...(wallRowOrder ? { 'data-gd-wall-order': 'row' } : {})}
        >
          {children}
        </div>
      );
    }
    // 1.3.5 — THE LANE RENDER (selfFlow + wallPack="lanes"): R lane rows,
    // lane r carrying the items at order r, r+R, r+2R… — the SAME reading
    // assignment the column lattice seats, but every lane is its own
    // nowrap horizontal flow (see .gd-wall-lane in index.css), so each row
    // accounts for its own widths: a long chip never widens its
    // neighbors' rows. The chips are the caller's own nodes — keys and
    // drag bindings ride untouched; only their seats change. The engine's
    // snapshot walks the lanes back into linear order (see useThumbSort's
    // 1.3.5 note).
    if (wallLanes) {
      return Array.from({ length: R }, (_, r) => (
        <div className="gd-wall-lane" key={`lane-${r}`}>
          {flowItems.filter((_, i) => i % R === r)}
        </div>
      ));
    }
    return children;
  };

  // 1.3.2 — THE EDGE GROUP STAYS MOUNTED THROUGH THE FOLD ("the right and
  // left fade alongside right and left arrows in stamps and tags collapse
  // animation is missing as they shouldnt dissapear and instead collapse or
  // fade"): the 1.2.2 linger keyed on sideActive, which flips with EVERY
  // collapse — and the linger's own setState landed one commit LATER, so
  // the group UNMOUNTED for that commit and remounted fresh in the next
  // (measured live: UNMOUNT x4 + MOUNT x4 at t+9ms after the toggle) — a
  // brand-new element can never run its opacity transition, so the arrows
  // and fades VANISHED in a single frame instead of fading with the height
  // flight. The group's mount now keys on the OVERFLOW (sideMounted — a
  // measure truth that never moves with `collapsed`): through every
  // collapse and expand the same elements stay alive, their opacity and
  // slide ease out/in on their own 0.18s clock while the height tween runs
  // its 0.32s beside them, and the fades' vertical span rides the seat's
  // own box (the seat wraps the zone, so the veil collapses WITH the row).
  // The linger survives only for the one true unmount case: the flow
  // genuinely stops overflowing (content shrank below the row cap) and the
  // group eases out before leaving for good. A lingering group never
  // answers the pointer — a dying arrow cannot steal a click.
  const [shrinkLinger, setShrinkLinger] = useState(false);
  useEffect(() => {
    if (sideMounted) {
      setShrinkLinger(false);
      return undefined;
    }
    setShrinkLinger(true);
    const t = setTimeout(() => setShrinkLinger(false), 300);
    return () => clearTimeout(t);
  }, [sideMounted]);
  const edgesOn = sideMounted || shrinkLinger;

  // 1.4.9 — THE COVER SEAT IS RETIRED ("the containers are above the left
  // and right fade, expand into each other and doesnt expand correctly into
  // the space, fix its logic, its to the point the collapse button isnt
  // visible"): the 1.4.7/1.4.8 overlay drawer — a seat pinned at its
  // retracted clamp while the open zone lifted onto an absolute z-15 tinted
  // plate — fought the panel it lived in (the rows body's own clip shaved
  // the drawer's bottom, the plate covered the tray's COLLAPSE keyline and
  // the row beneath it, the fades and arrows tracked a box the layout never
  // owned). The rows EXPAND IN THE FLOW again: the zone's height grows
  // through the same measured max-height flight it always spoke, the tray
  // and the panel beneath it give the row the space it asks for, both rows
  // stack without ever touching each other, the fades ride the zone's own
  // edges, and the COLLAPSE key stays visible at the tray's tail — the one
  // logic every surface here was already built to speak.
  return (
    <div ref={seatRef} className={clsx('gd-side-seat relative min-w-0 flex-1', seatClassName)}>
      {/* THE MEASUREMENT TWIN — plain row flow, invisible, inert; its bands
          are the only honest answer to "does this overflow, where does the
          Nth row land, and where does every page break?" no matter which
          seat the live zone is in. 1.2.2 — THE GHOST SEAT: the twin renders
          the same children, but they ride the ghost context — nothing the
          twin mounts may open a portal of its own (the + STAMPS key used to
          open the picker TWICE: once from the live zone, once from the
          invisible twin, both portaled to the body). */}
      <SideFlowGhost.Provider value>
        <div ref={probeRef} className={clsx('gd-collapse-zone', zoneClassName, 'gd-side-probe')} aria-hidden>
          {renderProbe()}
        </div>
      </SideFlowGhost.Provider>
      <div
        ref={(el) => {
          zoneRef.current = el;
          // 1.3.0 — the selfFlow flavor's flow carrier IS the zone element:
          // the caller's sort engine (the tags row's drag) binds to it the
          // same way the stamps flavor binds to its wrapper.
          if (selfFlow && flowRef) flowRef.current = el;
        }}
        className={clsx(
          'gd-collapse-zone',
          'gd-sb-breath',
          zoneClassName,
          collapsed && 'is-collapsed',
          sideMounted && 'is-side',
          sideMounted && selfFlow && 'is-self-flow'
        )}
        style={{
          ...zoneStyle,
          // 1.3.2 — the self-flow wall: the ZONE itself is the grid (see
          // .is-side.is-self-flow in index.css); the row track count is
          // exactly the rows the content uses.
          // 1.3.3 — the row-major wall adds the reading-width template:
          // repeat(C, max-content) columns, C = ceil(N / R) — the inline
          // template auto-flow row fills row by row (see the row note at
          // the renderer).
          // 1.3.5 — the LANE wall speaks no grid template at all: the zone
          // stacks .gd-wall-lane rows (see index.css) and every lane packs
          // itself — the row heights are the lanes' own, not tracks.
          ...(sideMounted && selfFlow && !wallLanes
            ? wallRowOrder
              ? {
                  gridTemplateRows: `repeat(${Math.max(1, Math.min(rows, flowItems.length))}, auto)`,
                  gridTemplateColumns: `repeat(${Math.max(1, Math.ceil(Math.max(1, flowItems.length) / Math.max(1, Math.min(rows, flowItems.length))))}, max-content)`,
                }
              : { gridTemplateRows: `repeat(${Math.max(1, Math.min(rows, flowItems.length))}, auto)` }
            : {}),
        }}
        aria-label={ariaLabel}
        /* 1.3.2 — THE WALL LAW RIDES THE CARRIER (the self-flow flavor's
            carrier is the zone itself; the flowClass flavor carries it on
            its wrapper — see renderSide): the drag packer reads the mode,
            the rows-per-column and the gap from the element it binds.
            1.3.3 — the packer also reads the READING ORDER
            (data-gd-pack-order) and the CSS reads the wall's flow seat
            (data-gd-wall-order).
            1.3.5 — the packer ALSO reads the PACK LATTICE
            (data-gd-wall-pack): 'lanes' tells it the wall seats R
            independent rows (its snapshot walks the lanes back into
            linear order and its packer runs per-lane cursors) — see
            useThumbSort's 1.3.5 notes. */
        {...(sideMounted && selfFlow
          ? {
              'data-gd-flow': 'wall',
              'data-gd-pack-rows': String(rows),
              'data-gd-pack-gap': String(Math.round(wallGap)),
              'data-gd-pack-order': wallRowOrder ? 'row' : 'column',
              ...(wallRowOrder ? { 'data-gd-wall-order': 'row' } : {}),
              ...(wallLanes ? { 'data-gd-wall-pack': 'lanes' } : {}),
            }
          : {})}
        {...dbg}
      >
        {sideMounted ? renderSide() : renderPlain(flowRef)}
      </div>
      {/* THE ARROWS + EDGE FADES: mounted through the whole overflowing
          life of the zone — collapse and expand included (the 1.3.2 edge
          law above) — so their opacity tweens are real flights, never
          mount pops. The fades seat on the content box (the 1.2.2 vars
          above); the arrows toggle their is-live flight class. */}
      {edgesOn && (
        <>
          <span className="gd-flow-fade is-left" style={{ opacity: canL ? 1 : 0 }} aria-hidden />
          <span className="gd-flow-fade is-right" style={{ opacity: canR ? 1 : 0 }} aria-hidden />
          <button
            type="button"
            className={clsx('gd-flow-arrow is-left', canL && 'is-live')}
            tabIndex={canL ? 0 : -1}
            aria-hidden={canL ? undefined : true}
            title={`Scroll the ${ariaLabel || 'row'} left`}
            onClick={() => nudge(-1)}
          >
            <ChevronLeft size={12} />
          </button>
          <button
            type="button"
            className={clsx('gd-flow-arrow is-right', canR && 'is-live')}
            tabIndex={canR ? 0 : -1}
            aria-hidden={canR ? undefined : true}
            title={`Scroll the ${ariaLabel || 'row'} right`}
            onClick={() => nudge(1)}
          >
            <ChevronRight size={12} />
          </button>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// THE STRIP ARROWS (the version strip's own seat): a hook + render pair for
// any single-row horizontal scroller.
// ---------------------------------------------------------------------------
export function useFlowEdges(ref, active, deps = []) {
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);
  // 1.2.2 — THE STRIP'S OWN LINGER (the SideFlowZone law, spoken here for
  // the single-row scrollers — the version strip): when the strip stops
  // overflowing (or the caller's `active` drops), the edges keep painting
  // for a beat while their opacity eases out — no mount/unmount pop.
  const [linger, setLinger] = useState(false);
  useEffect(() => {
    if (active) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the strip's return to life clears the dying group's linger (one render, its unmount)
      setLinger(false);
      return undefined;
    }
    setLinger(true);
    const t = setTimeout(() => setLinger(false), 300);
    return () => clearTimeout(t);
  }, [active]);
  useEffect(() => {
    const el = ref?.current;
    if (!el || !active) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCanL(false);
      setCanR(false);
      return undefined;
    }
    // 1.8.8 — THE LAYOUT CENSUS ("when opening a card that has a lot of
    // versions ... then switching to a version with a small amount of
    // versions, for some reason the arrows remain still even if there is
    // nothing to scroll, fix the logic for that"): the old law read the
    // PAINT — el.scrollWidth — and the paint lies while anything flies.
    // The strip's own switch ceremony flies the trailing NEW VERSION key
    // from the old card's seat to the new one (the 1.6.9 FLIP), and for
    // the whole 0.15s glide the key's transformed box pokes past the
    // content's end — the ENGINE counts that poke as scrollable ground
    // (measured live: a short card with 0px of honest overflow reads
    // 538px of scrollWidth while the flight lives), and every net the
    // old law trusted spoke while the lie was airborne: the door-read
    // at the commit, the MutationObserver's own childList beats, the
    // one-shot rAF — all mid-flight, all lighting the edges over a rim
    // that dies before the paint dries. The census now reads the
    // LAYOUT, not the paint: the chips' own seats (offsetLeft +
    // offsetWidth — transform-blind by construction, the same law the
    // 1.6.9 FLIP itself measured its seats with, and scroll-blind
    // besides) never wear a flight, so the truth no longer depends on
    // WHEN it is read — the first read at the switch's own door already
    // speaks the settled word, and the arrows retire in the same breath
    // the short card arrives, however busy that breath is.
    const WORTH = 24; // a third of a chip — the smallest travel the eye
    // ever reads as a page worth turning. A short card's strip presses
    // within a few pixels of the frame's edge (the chips' gaps, the NEW
    // VERSION key's own width), and a rim's shave under this threshold
    // is not overflow at all: no arrows, no fades, no dead keys
    // borrowing a clamped offset.
    const read = (pin = true) => {
      let max;
      const kids = el.children;
      // THE SAME-ORIGIN GUARD: the arithmetic below speaks wrapper-seat
      // coordinates — it is exact while the chips' offsetParent is the
      // strip's own (the wrapper's relative seat, the only structure
      // this hook serves today). A future caller whose geometry breaks
      // that kinship falls back to the engine's own word (the paint
      // census) rather than speaking a coordinate it cannot name.
      const sameOrigin = kids.length > 0 && kids[0].offsetParent === el.offsetParent;
      if (sameOrigin) {
        let right = 0;
        for (let i = 0; i < kids.length; i++) {
          const c = kids[i];
          const r = (c.offsetLeft || 0) + (c.offsetWidth || 0);
          if (r > right) right = r;
        }
        max = Math.max(0, right - (el.offsetLeft || 0) - (el.clientLeft || 0) - el.clientWidth);
      } else {
        max = Math.max(0, el.scrollWidth - el.clientWidth);
      }
      // THE STALE SEAT RETIRES WITH ITS CONTENT: a shrunk strip's old
      // offset (the long card's scroll, the center-scroll's landing)
      // can outlive the content that earned it — the engine clamps it
      // only at its own leisure, and until it does the offset speaks
      // for a page that no longer exists. The read pins it to the
      // fresh truth itself (an idempotent write: once pinned, the pin
      // is a no-op). TWO guards, both earned: never on a scroll beat
      // (the auto-pan's own writes must not fight the census mid-drag),
      // and never while a sort drag lives (the dragged chip's poke is
      // a flight, not a seat — the body's own gd-sort-live word).
      const dragging =
        typeof document !== 'undefined' &&
        document.body &&
        document.body.classList.contains('gd-sort-live');
      if (pin && !dragging && el.scrollLeft > max) el.scrollLeft = max;
      const live = max > WORTH;
      setCanL(live && el.scrollLeft > 1);
      setCanR(live && el.scrollLeft < max - 1);
    };
    read();
    const onScroll = () => read(false);
    el.addEventListener('scroll', onScroll, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => read(true)) : null;
    if (ro) ro.observe(el);
    // THE CONTENT'S OWN VOICE: the RO above watches the STRIP's box (a
    // panel resize, a column crossing) — that box never moves when the
    // CONTENT does, and the caller's deps carry only the roads it knows
    // to name. The chips' arrival, departure and relabeling now speak
    // for themselves: a childList/characterData observer re-reads the
    // census on every content change, whatever road swapped it.
    // Attributes stay deliberately unwatched — a flight's own transforms
    // never touch the layout census (it cannot see them), and the
    // observer has no business sitting in the drag's pocket.
    const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(() => read(true)) : null;
    if (mo) mo.observe(el, { childList: true, subtree: true, characterData: true });
    const raf = (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : setTimeout)(() => read(true));
    // THE SETTLING RE-READ: one breath after the swap — after the
    // center-scroll's own rAF, after the breath bar hands the gutter
    // back — the census is spoken twice: once at the door, once after
    // the room has settled. With the layout census this is insurance,
    // not load-bearing truth (every read speaks the settled word now);
    // it stays because the engine's own lazy clamps still deserve a
    // second knock on a busy breath.
    const settle = setTimeout(() => read(true), 200);
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (ro) ro.disconnect();
      if (mo) mo.disconnect();
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
      else clearTimeout(raf);
      clearTimeout(settle);
    };
  }, [ref, active, ...deps]);
  const nudge = (dir) => {
    const el = ref?.current;
    if (!el || typeof el.scrollBy !== 'function') return;
    el.scrollBy({ left: dir * Math.max(140, Math.round(el.clientWidth * 0.75)), behavior: 'smooth' });
  };
  // 1.4.0 — THE ARROWS RIDE THE CONTENT'S OWN CENTER ("ensure that
  // versions container right and left arrow are lifted up slightly so
  // they are centered, currently they are too low"): a strip that shows
  // its platform's classic horizontal scrollbar (the app's own 10px webkit
  // law — Windows + LinuxChrome) loses that height from its CONTENT box,
  // so the chips sit higher inside the wrapper while the arrows' 50% seat
  // still spans the scrollbar's zone — the keys read ~5px LOW. The strip's
  // real scrollbar height is measured live and written as the wrapper's
  // --gd-flow-arrow-lift (half of it), which .gd-flow-arrow's centering
  // transform subtracts — the keys sit on the chips' own midline on every
  // platform, scrollbar or none (overlay-scrollbar platforms read 0 and
  // keep the plain center).
  const [arrowLift, setArrowLift] = useState(0);
  useEffect(() => {
    const el = ref?.current;
    if (!el || !active) return undefined;
    const readLift = () => {
      const sb = Math.max(0, (el.offsetHeight || 0) - (el.clientHeight || 0));
      setArrowLift((was) => (Math.abs(was - sb / 2) < 0.5 ? was : sb / 2));
    };
    readLift();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(readLift) : null;
    if (ro) ro.observe(el);
    return () => {
      if (ro) ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, active, ...deps]);
  return { canL, canR, nudge, edgesOn: active || linger, arrowLift };
}

export function FlowEdges({ flow, label }) {
  // 1.2.2 — THE EDGES STAY MOUNTED through the strip's overflowing life
  // (plus the hook's linger): both arrows ride their is-live flight class
  // and the fades their opacity tween, so appearing and disappearing read
  // as motion. A lingering group never answers the pointer.
  // 1.4.0 — the wrapper carries the arrow-lift var (see useFlowEdges): the
  // keys center on the strip's CONTENT box, scrollbar or none.
  // 1.4.1 — THE LIFT REACHES THE ARROWS ("the left and right arrows of
  // the versions container may be centered, but not centered if we
  // discard the scrollwheel, fix that by lifting it up so its relatively
  // centered to the versions instead since they seem too low"): the
  // 1.4.0 law wrote --gd-flow-arrow-lift on the FADES ONLY — the var
  // never reached the arrow buttons (they read the 0px default), so on
  // every platform with a classic scrollbar the keys sat centered on the
  // WRAPPER (chips + the scrollbar zone below them) and read a full
  // half-scrollbar too low against the chips themselves. The var now
  // rides the ARROWS too — centered on the versions' own midline,
  // scrollbar or none.
  if (!flow || (!flow.edgesOn && !flow.canL && !flow.canR)) return null;
  const liftStyle =
    flow.arrowLift != null && flow.arrowLift > 0
      ? { ['--gd-flow-arrow-lift']: `${Math.round(flow.arrowLift)}px` }
      : undefined;
  return (
    <>
      <span className="gd-flow-fade is-left" style={{ opacity: flow.canL ? 1 : 0, ...liftStyle }} aria-hidden />
      <span className="gd-flow-fade is-right" style={{ opacity: flow.canR ? 1 : 0, ...liftStyle }} aria-hidden />
      <button
        type="button"
        className={clsx('gd-flow-arrow is-left', flow.canL && 'is-live')}
        tabIndex={flow.canL ? 0 : -1}
        aria-hidden={flow.canL ? undefined : true}
        title={`Scroll the ${label || 'strip'} left`}
        onClick={() => flow.nudge(-1)}
        style={liftStyle}
      >
        <ChevronLeft size={12} />
      </button>
      <button
        type="button"
        className={clsx('gd-flow-arrow is-right', flow.canR && 'is-live')}
        tabIndex={flow.canR ? 0 : -1}
        aria-hidden={flow.canR ? undefined : true}
        title={`Scroll the ${label || 'strip'} right`}
        onClick={() => flow.nudge(1)}
        style={liftStyle}
      >
        <ChevronRight size={12} />
      </button>
    </>
  );
}
