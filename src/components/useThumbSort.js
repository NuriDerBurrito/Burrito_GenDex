import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

// 1.2.8 — THE SORT-LIVE SIGNAL (the drag is a flight too): a body-level
// class riding any live thumb-sort drag. SideFlow's measure hold reads it
// (useSideMeasure's `held()` — the same law as .gd-flight/.gd-resizing):
// while a drag owns the strip, the zone's pages keep their GRAB-TIME
// arrangement — no re-measure, no re-pack mid-drag. The probe reads the
// same children the live zone renders, and the gliding neighbors wear
// their simulated reorder transforms in BOTH copies — an unguarded
// re-measure mid-drag read the GLIDED layout as the new truth, rebuilt
// the pages under the drag (the grab-time snapshot went stale, the
// identity validation collapsed to the rect-swap, the drawn chip's own
// element could unmount under the pointer) — the "fake release" and the
// phantom-row family, dead at the source. A counting gate (not a boolean)
// because several engines exist side by side (versions, stamps, tags, the
// image manager, the creation board); the class rides while ANY drag
// lives, and every end-path (commit, cancel, finish, unmount) decrements
// exactly once for the drag that armed it.
let gdSortLiveCount = 0;
const armSortLive = (on) => {
  if (typeof document === 'undefined') return;
  const next = Math.max(0, gdSortLiveCount + (on ? 1 : -1));
  if (next === gdSortLiveCount) return;
  gdSortLiveCount = next;
  try {
    document.body.classList.toggle('gd-sort-live', gdSortLiveCount > 0);
  } catch {
    /* a body-less host (tests) — the counter still tracks */
  }
};

// Smooth pointer-driven thumbnail sorting (0.8.0) — replaces the old laggy
// HTML5 drag & drop reorder. Behavior:
//   · The grabbed thumb follows the pointer DIRECTLY (transform written to
//     the element, no React re-render per frame — zero lag).
//   · While it travels, the neighbors glide aside with a CSS transform
//     transition — that moving gap IS the drop placeholder.
//   · On release the grabbed thumb ANIMATES into the gap (scale settles back
//     to 1), and only then does the reorder commit — so nothing ever snaps.
//   · A plain click (no movement) falls through to onTap (select the image).
// Works for a single-row strip (cols = 1) and for a wrapping grid (cols = N).
//
// 0.24.0 — GEOMETRY MODE (useGeometry: true + containerRef): for layouts
// that WRAP (the stamp slot strip now wraps instead of scrolling), the
// stride math can't know where rows break. Instead, the drag snapshots
// every item's rect at grab time and picks the drop target by NEAREST
// CENTER — works for one row, wrapped rows, and grids alike. The neighbors'
// glide and the settle animation use the same snapshot deltas.
export default function useThumbSort({
  count,
  cols = 1,
  gapX = 8,
  gapY = 8,
  onCommit,
  onTap,
  useGeometry = false,
  containerRef = null,
  // 0.41.0 — THE INSERTION CEILING: the highest slot a drop may land on.
  // The version strip rides the NEW VERSION key as a trailing sentinel —
  // "it allows me to rearrange it AFTER the add new version button, it
  // shouldnt do that" — so it passes maxInsert = the LAST DATA index and
  // the key never glides, never accepts a chip behind it. Every other
  // strip keeps the default (drops may land at the very end).
  maxInsert = null,
  // 0.37.0 — BUTTON-BODY DRAGS (the version strip: "allow dragging
  // versions around to reorganize"): the hook used to bail on ANY
  // pointerdown that started on a button/input — right for the filmstrip
  // (its body is plain) but it made a strip of CHIP-BUTTONS undraggable:
  // the whole version chip is a <button>, so the bail swallowed every
  // grab. With dragButtons the interactive-child bail keeps firing only
  // for real text fields and for elements opted out with [data-no-sort]
  // (the version chip's little settings pencil, the ADD key, …), and the
  // chip body itself becomes grabbable — a plain click still falls
  // through to onTap (select), the 5px move threshold still separates a
  // click from a drag, and pointer capture keeps the ride smooth.
  dragButtons = false,
}) {
  const [sort, setSort] = useState(null); // { from, to, dragging }
  const sortRef = useRef(null); // mirrors `sort` for the commit timer
  sortRef.current = sort;
  const dragRef = useRef(null); // live geometry, not state (60fps, no renders)
  const snapRef = useRef(null); // geometry mode: [{x,y,w,h}] per item at grab
  const commitTimerRef = useRef(null);
  // 0.31.0 — the container that wore `gd-settle` for the last commit (so an
  // unmount mid-settle can still take the class off).
  const settleContRef = useRef(null);
  // 1.4.8 — THE GLIDE-HOME GUARD'S OWN SEAT (see .gd-glide-home in
  // index.css): the container currently wearing it, plus the timer that
  // lifts it once the return flight has landed — same voice as the settle
  // guard, opposite law (transitions ON, never off).
  const glideHomeContRef = useRef(null);
  const glideHomeTimerRef = useRef(0);
  const liftGlideHome = () => {
    if (glideHomeTimerRef.current) {
      clearTimeout(glideHomeTimerRef.current);
      glideHomeTimerRef.current = 0;
    }
    const cont = glideHomeContRef.current;
    glideHomeContRef.current = null;
    if (cont && cont.isConnected && typeof cont.classList?.remove === 'function') {
      cont.classList.remove('gd-glide-home');
    }
  };
  const armGlideHome = (cont) => {
    if (!cont || typeof cont.classList?.add !== 'function') return;
    glideHomeContRef.current = cont;
    cont.classList.add('gd-glide-home');
    if (glideHomeTimerRef.current) clearTimeout(glideHomeTimerRef.current);
    // the class outlives the 0.15s return flight by a breath, then leaves.
    glideHomeTimerRef.current = setTimeout(() => {
      glideHomeTimerRef.current = 0;
      const c = glideHomeContRef.current;
      glideHomeContRef.current = null;
      if (c && c.isConnected && typeof c.classList?.remove === 'function') c.classList.remove('gd-glide-home');
    }, 200);
  };
  const onTapRef = useRef(onTap);
  const onCommitRef = useRef(onCommit);
  onTapRef.current = onTap;
  onCommitRef.current = onCommit;

  const clampIndex = (i) => Math.max(0, Math.min(count - 1, i));
  // 0.41.0 — clamp a raw INSERTION index (0..count) to the strip's own
  // ceiling: maxInsert when a caller set one (the version strip's sentinel
  // key), else the natural end of the list. The trailing gap can always ask
  // for "insert at the very end" — the ceiling decides whether that means
  // before the sentinel or truly past everything.
  const insertCeil = Number.isFinite(maxInsert) ? Math.max(0, Math.min(count, maxInsert)) : count;
  const clampInsert = (i) => Math.max(0, Math.min(insertCeil, i));
  // 0.41.0 — an insertion index ("before original item `to`") → the FINAL
  // index of the dragged item in the reordered array. Removing `from`
  // shifts every later item down one, so an insertion past the grab point
  // lands one slot earlier than it reads: [A,B,C] drag A to the gap before
  // C (ins 2) → [B,A,C] — A's final index is 1, not 2. The old code fed the
  // raw slot number to the commit, so every RIGHTWARD move landed one slot
  // too far ("the amount it offsets is too much") and the glide agreed with
  // the wrong answer, which made it look right until the snap.
  const finalIndexOf = (from, ins) => (ins > from ? ins - 1 : ins);

  // ---- slot math -------------------------------------------------------------
  // Final index of item i (≠ from) once the dragged item is re-inserted at
  // `to`: remove `from`, then insert before position `to`.
  const finalIndexFor = (i, from, to) => {
    const pos = i > from ? i - 1 : i;
    return pos >= to ? pos + 1 : pos;
  };

  // Pixel delta (col/row) between two FINAL indexes (stride mode only).
  const deltaSlots = (a, b) => ({
    x: ((b % cols) - (a % cols)) * (dragRef.current?.strideX || 0),
    y: (Math.floor(b / cols) - Math.floor(a / cols)) * (dragRef.current?.strideY || 0),
  });

  // React-managed style for NON-dragged items: neighbors glide to make room.
  // In geometry mode the delta comes from the grab-time rect snapshot (row
  // breaks included); in stride mode from the col/row stride math. `to` is
  // the dragged item's FINAL index everywhere (0.41.0).
  // 1.4.8 — THE GLIDE HOME ("when dragging around an element such as a
  //   version, it seems to have an animation when the other versions switch
  //   places which is cool, but when i move it back it seems to lack the
  //   animation to move back, fix that"): a neighbor whose delta falls
  //   away — the verdict carried the chip back OVER ITS OWN SLOT — used to
  //   return null here, and React cleared the transform AND the transition
  //   in one commit: the browser had nothing to animate the return with,
  //   and the chips SNAPPED home exactly as the report caught (the geometry
  //   path returns no delta for from === to, so every homecoming verdict
  //   hit that null). The neighbor keeps its TRANSITION (and its rung)
  //   whenever the drag is live: the transform's own REMOVAL animates, and
  //   the chips RETURN the same way they parted — the same flight, both
  //   directions.
  // 1.5.4 — THE GLIDED RUN REGISTER ("when dragging tags/stamps around,
  // sometimes the tags and stamps when they shift around get below another
  // tag/stamp that didnt move, fix that so when its moving its always on
  // top and wont be covered by another (EXCEPT THE CURRENTLY HELD ONE)"):
  // every neighbor that ever wore a translate during THIS drag keeps its
  // name — while it glides AND while its transform clears home (the return
  // flight), it speaks the raised rung below; a neighbor that never moved
  // keeps the plain rung. The register empties when the next drag arms.
  const glidedRef = useRef(null);

  const itemStyle = useCallback(
    (i) => {
      if (!sort || !sort.dragging || sort.from === i) return null;
      let d;
      if (useGeometry && snapRef.current) {
        // 0.40.0 — the width-aware glide (see glideFor): every neighbor
        // translates to its own seat in the SIMULATED reordered layout, so
        // the hole that opens is sized for the dragged chip and nothing
        // clips while it travels. Falls back to the rect-swap deltas when
        // the simulation can't be validated.
        d = glideFor(sort.from, sort.to)?.delta(i);
      } else {
        d = deltaSlots(i, finalIndexFor(i, sort.from, sort.to));
      }
      if (!d) {
        // 1.4.8 — transition-only seat: nothing to translate, everything
        // to animate (a clearing transform glides home instead of
        // snapping — see the note above).
        // 1.5.4 — a chip that HAS flown this drag keeps the raised rung
        // while its transform clears: the return glide is a flight too, and
        // a stationary chip (later in the DOM, the tie's winner) must
        // never cover it.
        if (glidedRef.current?.has(i)) {
          return { transition: 'transform 0.15s ease', zIndex: 8 };
        }
        return { transition: 'transform 0.15s ease', zIndex: 5 };
      }
      glidedRef.current?.add(i);
      return {
        transform: d.x || d.y ? `translate(${d.x}px, ${d.y}px)` : undefined,
        transition: 'transform 0.15s ease',
        zIndex: 8,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sort, count, cols]
  );

  // Style for the DRAGGED item: zIndex + no transform transition (its
  // transform is written straight to the element so it tracks the pointer
  // with zero lag).
  // 1.7.0 — BUT THE SHADOW FLIES (see .gd-sort-release in index.css): the
  // old `transition: 'none'` killed EVERY clock on the carried tile, so the
  // .is-dragging shadow arrived in one frame and left in one frame with
  // the class. The inline clock now names box-shadow alone — the transform
  // still follows the pointer with zero lag (unnamed = untransitioned),
  // while the carried glow RISES on grab and (with the release class)
  // EASES OUT through the settle glide instead of popping off at the
  // commit.
  const dragStyle = sort?.dragging ? { zIndex: 40, transition: 'box-shadow 0.18s ease', cursor: 'grabbing' } : null;

  const finishCommit = () => {
    stopAutoscroll();
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    // 1.2.8 — the hold's last safety: whatever ended the drag, the sort-live
    // signal dies with it (runCommit/cancelAt normally spent it already —
    // this catches the no-move release and any path that skipped them).
    const drag0 = dragRef.current;
    if (drag0 && drag0.sortLiveArmed) {
      drag0.sortLiveArmed = false;
      armSortLive(false);
    }
    // 1.2.6 — the drag's safety nets come off with the drag itself (see
    // onPointerDown): no listener outlives its drag, whatever ended it.
    const safety = dragRef.current?.releaseSafety;
    if (typeof safety === 'function') safety();
    const el = dragRef.current?.el;
    // 1.4.8 — THE INTERRUPTED DRAG GLIDES HOME TOO (the 1.4.8 glide-home
    // law's cancel half): a drag that dies without a commit (cancelAt's
    // interrupted flight, any safety path that lands here with the sort
    // still live) leaves its neighbors glided aside — the sort's clear
    // below would snap them home in one paint. The guard lets the
    // transforms clear WITH their transitions: the same return flight the
    // mid-drag homecoming speaks (a drag that already committed has no
    // transforms left to move — the class arms and lifts, painting
    // nothing).
    if (drag0?.el) armGlideHome(containerRef?.current || el?.parentElement || null);
    dragRef.current = null;
    setSort(null);
    if (el) {
      el.style.transform = '';
      el.style.transition = '';
    }
  };

  // ---- geometry mode ---------------------------------------------------------
  // Snapshot every item's rect at drag start; the drop target is whichever
  // slot's center the dragged item's center is nearest to.
  const snapshotRects = (dragEl) => {
    const cont = containerRef?.current;
    if (!cont || typeof cont.getBoundingClientRect !== 'function') return null;
    // 1.2.0 — DESCENDANT QUERY: the sort items may ride one level deeper
    // than the container's own children (the side-flow's paged track nests
    // the slots inside its page wrappers). The direct-children filter used
    // to return null there, and the whole geometry engine silently fell
    // back to stride math — wrong seats for every neighbor. The query now
    // collects the items in DOM order wherever they sit under the
    // container; a wrapping flow keeps its children as its items (the
    // query returns exactly the same list there), so every existing strip
    // keeps its truth.
    const kids = Array.from(cont.querySelectorAll('.gd-sort-item'));
    if (kids.length !== count) return null;
    // 1.3.7 — THE SNAPSHOT IS TRANSFORM-NEUTRAL ("when i grab a stamp from
    //   the first row and move it to the bottom row, the stamps inside the
    //   container shift up slightly"): at the first honest move the grabbed
    //   chip already wears its CSS :hover lift (the stamps' -1px ride, mid
    //   0.09s transition), and the snapshot's rects carried that lifted
    //   box. The wall's anchor reads the MIN y among row-0 members, so a
    //   grabbed ROW-0 chip poisoned the anchor with its -1px — every
    //   modeled row sat 1px high, every gliding neighbor landed 1px above
    //   its honest seat, and the whole wall read as shifting UP for the
    //   hold, then settling home on release (measured live: the modeled
    //   row-1 top 286.7 against the painted 290.7 on a validation that
    //   still passed — the 1px within the 2px trust gate; a grabbed ROW-1
    //   chip never touched the row-0 anchor, which is why the bug only
    //   spoke on top-to-bottom drags). The snapshot now silences the
    //   grabbed chip's transform — an inline `transform: none` overrides
    //   the :hover rule, and `transition: none` makes it take effect on
    //   this frame, no mid-flight blend — for the duration of the
    //   measurement, restoring both voices the moment the last rect is
    //   read. The drag's own transform write happens after the snapshot in
    //   the same handler, so the ride never flickers.
    let savedT = null;
    let savedTr = null;
    if (dragEl && dragEl.style) {
      savedT = dragEl.style.transform;
      savedTr = dragEl.style.transition;
      dragEl.style.transform = 'none';
      dragEl.style.transition = 'none';
    }
    const restore = () => {
      if (dragEl && dragEl.style) {
        dragEl.style.transform = savedT ?? '';
        dragEl.style.transition = savedTr ?? '';
      }
    };
    // 1.3.5 — THE LANE WALL READS DOM LANE-MAJOR, SNAPS LINEAR ("fix that
    // so it accounts for each row on its own"): a wallPack="lanes" carrier
    // seats its items inside R .gd-wall-lane rows (lane r holding the
    // items at flow order r, r+R, r+2R…), so plain DOM order reads
    // LANE-MAJOR — but every index the engine speaks (bindItem's i, the
    // gap finder's slots, the commit's from/to) is the FLOW order the
    // caller owns. The snapshot walks the lanes and writes each chip at
    // its LINEAR seat: lane r's k-th sort item = index k*R + r. The map is
    // the render's own law (SideFlow slices the children by i % R), so
    // the two orders can never disagree; a lane structure that doesn't
    // add up refuses the snapshot (and the drag) rather than guess.
    if (cont.dataset && cont.dataset.gdWallPack === 'lanes') {
      const laneEls = Array.from(cont.children || []).filter((n) => n.nodeType === 1);
      const R = Math.max(1, laneEls.length);
      const out = new Array(kids.length).fill(null);
      for (let r = 0; r < laneEls.length; r += 1) {
        let k = 0;
        for (const el of Array.from(laneEls[r].children || [])) {
          if (!el.classList || !el.classList.contains('gd-sort-item')) continue;
          const idx = k * R + r;
          if (idx >= kids.length) { restore(); return null; }
          const rr = el.getBoundingClientRect();
          if (!Number.isFinite(rr.left) || !Number.isFinite(rr.top)) { restore(); return null; }
          out[idx] = { x: rr.left, y: rr.top, w: rr.width, h: rr.height };
          k += 1;
        }
      }
      if (out.some((o) => o == null)) { restore(); return null; }
      restore();
      return out;
    }
    const rects = kids.map((el) => {
      const r = el.getBoundingClientRect();
      if (!Number.isFinite(r.left) || !Number.isFinite(r.top)) return null;
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    });
    restore();
    if (rects.some((o) => o == null)) return null;
    return rects;
  };

  // 0.40.0 — THE EXACT GLIDE: simulate the strip's flex-wrap layout for the
  // REORDERED sequence (greedy row packing with the snapshot's real widths
  // and the container's real gaps, vertically centered rows — exactly what
  // the browser paints after the commit) and hand every chip — the neighbors
  // AND the dragged one — its OWN simulated seat. Kills the 0.39 clipping:
  // the dragged chip used to settle onto ANOTHER chip's old rect, and with
  // variable-width labels a wide chip landing on a narrow slot's x overlapped
  // whatever sat past it until the commit reflowed.
  // 0.41.0 — TWO ANCHOR BUGS DIED:
  //   · the packer anchored its rows at rects[order[0]] — the REORDERED
  //     sequence's first item — so dragging the FIRST chip made every
  //     simulated seat slide one stride right: the neighbors visibly took "an
  //     extra column" past the container's right edge (clipping through the
  //     window border) while the hole the chip left on the left stayed open
  //     ("leave a gap on the left and take an extra column on the right",
  //     prominent in the image manager). The anchor is the strip's OWN first
  //     column / first row — rects[0] — now, which validation already proves
  //     matches the real packing.
  //   · strips that carry NON-SORTING children (the stamp strips' ADD /
  //     PASTE tiles + settings cluster ride inline since 0.41.0) cannot be
  //     modeled by packing the sort items alone — the tiles eat real row
  //     width. The simulation bails there and the rect-swap fallback (whose
  //     seats are real grab-time rects) keeps the glide honest.
  // The move now depends on the OTHERS' containers, not the dragged chip's
  // own footprint. The simulation is VALIDATED first: packing the CURRENT
  // order must reproduce the grab-time snapshot within 2px, else the strip
  // is something the math doesn't model (odd justify, margins, jsdom) and
  // the caller keeps the old rect-swap behavior.
  // 1.3.5 — THE WALL CONTEXT IS A STANDALONE CLOSURE (buildWallCtx below):
  // the packer and the FIRST target computation share it — the context used
  // to build lazily inside this simulation, so the drag's first (or only)
  // drop-target verdict ran BEFORE any wall context existed and fell to the
  // GENERIC row-wrap gap finder over the wall's rects (measured live: a
  // single-move drag on the tags wall committed a slot a whole lane off
  // from the gap the pointer rested on). The pointermove's first honest
  // move builds the context right after the snapshot, so every verdict —
  // first to last — speaks the wall's own lattice.
  // 1.3.5 — THE WALL CONTEXT, ONE STANDALONE CLOSURE: built at the drag's
  // FIRST HONEST MOVE (see the pointermove handler) and reused by the packer
  // and every gap verdict — the drop target never again runs ahead of the
  // wall's own lattice. Reads the container's own laws (data-gd-flow="wall",
  // the pack attrs, the computed gap/align), the grab-time snapshot, and the
  // DOM's honest rows: the grid's measured bands (column wall) or the lane
  // rows themselves (lanes wall).
  const buildWallCtx = () => {
    const cont = containerRef?.current;
    const drag = dragRef.current;
    if (!cont || !drag || drag.wallCtx) return;
    if (!(cont.dataset && cont.dataset.gdFlow === 'wall')) return;
    if (typeof getComputedStyle !== 'function') return;
        const st = getComputedStyle(cont);
        let wallGap = Number.isFinite(gapX) && gapX > 0 ? gapX : 8;
        const cg = parseFloat(st.columnGap);
        const rg = parseFloat(st.rowGap);
        // the grid's uniform gap: column-gap and row-gap agree in the wall
        // (one law, both axes); either computed voice beats the guess.
        if (Number.isFinite(cg) && cg > 0) wallGap = cg;
        else if (Number.isFinite(rg) && rg > 0) wallGap = rg;
        let attrRows = parseFloat(cont.dataset?.gdPackRows);
        if (!Number.isFinite(attrRows) || attrRows < 1) attrRows = 0;
        let attrGap = parseFloat(cont.dataset?.gdPackGap);
        if (Number.isFinite(attrGap) && attrGap > 0) wallGap = attrGap;
        const wallAlign = st.alignItems || 'start';
        // 1.3.3 — THE READING ORDER: the carrier names it through
        // data-gd-pack-order — 'row' fills across the rows (the detail
        // panel's stamps + tags seats), 'column' fills each column first
        // (the creation board's seat, the user's named exception). The
        // packer and the gap finder below both speak it.
        const wallRowMajor = cont.dataset?.gdPackOrder === 'row';
        // 1.3.5 — THE PACK LATTICE: 'lanes' seats R independent rows (the
        // tags wall's per-row accounting). The ctx speaks it below and the
        // packer + the gap finder run their lane laws; everything else
        // (rows, gap, anchor, tools) is one voice with the column wall.
        const wallLanes = cont.dataset?.gdWallPack === 'lanes';
        // 1.3.3 — THE BANDS READ THE GRAB, NOT THE FLIGHT ("the stamps on
        // the bottom row seem to move vertically as i hold a stamp, then
        // when i let go they go back to correct position"): the row bands
        // used to be measured over the grid's LIVE children — but this
        // context builds at the FIRST target change, by which time the
        // dragged chip already wears its translate+scale(1.07) ride: its
        // transformed box inflated its row band (and a chip dragged
        // across the middle MERGED two bands into one), every simulated
        // seat then sat on a lie — the neighbors glided vertically to
        // wrong bands mid-hold and snapped home on release — and the
        // identity validation collapsed to the rect-swap fallback, whose
        // index-to-rect hops read as rows shifting under the hold. The
        // bands now read the GRAB-TIME SNAPSHOT for every sort item
        // (pre-transform by construction, and Y is pan-immune) while only
        // the never-transforming tool keys keep their live boxes: the
        // wall's true rows, at every moment of every drag.
        // 1.3.5 — THE LANES READ THEMSELVES: a lanes wall's rows ARE the
        // .gd-wall-lane rows (their own boxes the honest bands), and the
        // foreign tail (the + key) rides inside a lane — the walk reads
        // the lanes' own children, in lane order, exactly as the snapshot
        // does. The anchor is lane 0's own top.
        const snap = snapRef.current || [];
        if (wallLanes) {
          const laneEls = Array.from(cont.children || []).filter((n) => n.nodeType === 1);
          const bandsArr = [];
          const tools = [];
          for (const lane of laneEls) {
            const lr = lane.getBoundingClientRect();
            if (Number.isFinite(lr.top) && Number.isFinite(lr.bottom)) {
              bandsArr.push({ top: lr.top, bottom: lr.bottom });
            }
            for (const el of Array.from(lane.children || [])) {
              if (el.classList && el.classList.contains('gd-sort-item')) continue;
              const r = el.getBoundingClientRect();
              if (Number.isFinite(r.top) && Number.isFinite(r.bottom)) {
                tools.push({ w: r.width, h: r.height });
              }
            }
          }
          const maxRows = Math.max(1, Math.min(attrRows || bandsArr.length, bandsArr.length, laneEls.length));
          let anchorY = snap.length ? snap[0].y : 0;
          for (let i = 0; i < snap.length; i += 1) {
            if (i % maxRows === 0 && Number.isFinite(snap[i].y)) anchorY = Math.min(anchorY, snap[i].y);
          }
          const wallTotalL = snap.length + tools.length;
          drag.wallCtx = {
            rows: maxRows,
            gap: wallGap,
            anchorY,
            tools,
            align: wallAlign,
            rowMajor: false,
            cols: Math.max(1, Math.ceil(Math.max(1, wallTotalL) / maxRows)),
            lanes: true,
          };
        } else {
        const kidBoxes = [];
        let snapCursor = 0;
        for (const el of Array.from(cont.children || [])) {
          const isSort = !!(el.classList && el.classList.contains('gd-sort-item'));
          if (isSort) {
            const s = snap[snapCursor];
            snapCursor += 1;
            if (s && Number.isFinite(s.y)) {
              kidBoxes.push({ top: s.y, bottom: s.y + s.h, w: s.w, h: s.h, sort: true });
            } else {
              const r = el.getBoundingClientRect();
              if (Number.isFinite(r.top)) kidBoxes.push({ top: r.top, bottom: r.bottom, w: r.width, h: r.height, sort: true });
            }
          } else {
            const r = el.getBoundingClientRect();
            if (Number.isFinite(r.top) && Number.isFinite(r.bottom)) {
              kidBoxes.push({ top: r.top, bottom: r.bottom, w: r.width, h: r.height, sort: false });
            }
          }
        }
        kidBoxes.sort((a, b) => a.top - b.top);
        const bandsArr = [];
        for (const b of kidBoxes) {
          const band = bandsArr[bandsArr.length - 1];
          if (band && b.top < band.bottom - 0.5) {
            band.bottom = Math.max(band.bottom, b.bottom);
          } else {
            bandsArr.push({ top: b.top, bottom: b.bottom });
          }
        }
        // rows per column: the attribute voice first (the zone knows its
        // own cap), else the honest fallback — the most items any single
        // horizontal x-line of sort items stacks (a column's own count)
        let rowsPerCol = attrRows;
        if (!rowsPerCol) {
          rowsPerCol = 1;
          const sortBoxes = kidBoxes.filter((x) => x.sort);
          if (sortBoxes.length) {
            // the honest count: the distinct row tops the FIRST column
            // stacks (its items share the wall's left edge)
            const tops = [];
            for (const b of sortBoxes) {
              if (!tops.some((t) => Math.abs(t - b.top) <= 4)) tops.push(b.top);
            }
            rowsPerCol = Math.max(1, tops.length);
          }
        }
        // 1.3.4 — the rowTop/rowH band snapshots are RETIRED as the pack's
        // row geometry (see the anchor note below): the bands still decide
        // the wall's row cap (maxRows) — the grid never paints more rows
        // than the content stacks — but the seats themselves derive from
        // the pack's own membership, exactly like the grid's auto tracks.
        const maxRows = Math.max(1, Math.min(rowsPerCol, bandsArr.length));
        // the foreign tail (the ADD / PASTE / settings keys, the trailing +
        // key): they ride the wall's seats AFTER the sort items and never
        // move on a reorder — their grab-time widths feed the shared
        // columns; their heights already live in the measured row bands.
        // 1.3.7 — THE TOOLS RIDE DOM ORDER ("when i grab a stamp from the
        //   first row ... the stamps shift up slightly"): the tools used to
        //   be read out of the TOP-SORTED kidBoxes — the band walk's y-order
        //   — but a column wall's grid (auto-flow: column) seats its
        //   children by DOM order, so the pack was handing tool j the TAIL
        //   SEAT of a DIFFERENT tool: the stamps' 3-key tail (ADD 44 / PASTE
        //   44 / the 47px settings cluster) came out [ADD, cluster, PASTE]
        //   in y-order while the wall truly paints [ADD, PASTE, cluster] —
        //   the cluster's 47px landed in ROW 1, the pack's row heights
        //   swapped to [44, 47] against the painted [47, 44], the identity
        //   validation failed by 4px and the glide was refused outright
        //   (measured live: modeled row-1 top 286.7 vs the painted 290.7,
        //   39/40 seats off). The tools now keep their DOM order — the
        //   wall's own seating law — so the pack's rows are the grid's rows
        //   before, during and after every drag.
        const tools = Array.from(cont.children || [])
          .filter((el) => el.nodeType === 1 && !(el.classList && el.classList.contains('gd-sort-item')))
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { w: r.width, h: r.height };
          })
          .filter((t) => Number.isFinite(t.w) && Number.isFinite(t.h));
        // 1.3.3 — the ROW-MAJOR reading width: C = ceil(total / R), the
        // same C the paint's repeat(C, max-content) template speaks (total
        // counts the tools — the wall's own carrier computes it over ALL
        // its children). The gap finder reads it for the row breaks.
        const wallTotal = snap.length + tools.length;
        const wallCols = Math.max(1, Math.ceil(Math.max(1, wallTotal) / maxRows));
        // 1.3.4 — THE ROW-0 ANCHOR, NOT THE FROZEN BANDS ("sometimes a
        // single row gets low or high then returns when i let go"): the
        // wall's grid rows are AUTO tracks — each row sizes to the TALLEST
        // MEMBER SEATED AT IT, and a reorder re-seats the members, so the
        // post-commit rows can be TALLER or SHORTER than the grab-time
        // bands. The old packer froze the measured rowTop/rowH and painted
        // every simulated seat on the GRAB's rows: whenever the reorder
        // moved a tall chip between rows, the neighbors glided to y-seats
        // the grid would never paint (the row riding "low" or "high"
        // under the hold), and the release's honest reflow sent every row
        // back home — the exact report. The pack now DERIVES its rows
        // order-aware inside packWall (row r's height = the max of the
        // heights the pack itself seats at r, stacked from one anchor);
        // the ctx carries only the anchor — the y of row 0's TOP edge,
        // which never moves with the order (the grid's first row always
        // starts at the content top). For a centered wall the anchor is
        // the identity's TALLEST row-0 member's top (the min y among
        // row-0's members — every shorter rider centers below it); for a
        // start-aligned wall all members share the top, and the min is
        // the same voice.
        const anchorRows = Math.max(1, maxRows);
        const anchorCols = Math.max(1, Math.ceil(Math.max(1, wallTotal) / anchorRows));
        let anchorY = snap.length ? snap[0].y : 0;
        for (let i = 0; i < snap.length; i += 1) {
          const r = wallRowMajor ? Math.floor(i / anchorCols) : i % anchorRows;
          if (r === 0 && Number.isFinite(snap[i].y)) anchorY = Math.min(anchorY, snap[i].y);
        }
        drag.wallCtx = { rows: maxRows, gap: wallGap, anchorY, tools, align: wallAlign, rowMajor: wallRowMajor, cols: wallCols };
        }
  };

  const simulateStrip = (order) => {
    const rects = snapRef.current;
    const cont = containerRef?.current;
    if (!rects || !cont || typeof getComputedStyle !== 'function') return null;
    const n = rects.length;
    if (!n || !order || order.length !== n) return null;
    // 1.3.2 — THE WALL IS A SHAPE TOO (the pages it replaces were one):
    // the side seat is ONE column-major grid now (see SideFlow's wall law),
    // and the drag container IS that grid — the self-flow flavor binds the
    // zone, the stamps flavor binds the flow wrapper, and both carry
    // data-gd-flow="wall" with the pack's rows-per-column and gap. The
    // simulation builds the wall's truth ONCE per drag (measured row bands
    // over ALL the grid's children — sort items AND the foreign tail keys,
    // because grid rows size to the tallest item seated at them, tools
    // included) and hands every chip its true simulated seat: same law as
    // the paint, byte-exact.
    const isWall = !!(cont.dataset && cont.dataset.gdFlow === 'wall');
    if (isWall) {
      // the honest layout) and cached on the drag — later calls reuse it.
      const drag = dragRef.current;
      if (drag && !drag.wallCtx) buildWallCtx();
      const ctx = drag?.wallCtx;
      if (ctx) return packWall(order, ctx);
      return null;
    }
    // 0.41.0 — non-sorting element children (tiles, clusters) ride the strip:
    // the packer cannot know their widths, so it refuses to guess.
    // 1.3.9 — THE TRAILING TOOLS RIDE THE PLAIN PACK ("in full detail
    //   screen mode (aka when right panel is turned off), when
    //   realigning/reordering tags, the tags shift above each other and
    //   break"): the refusal above meant that EVERY plain-seat tags drag
    //   fell to the rect-swap fallback — the tags zone always carries the
    //   trailing + key, and in the WIDE full-window seat the zone stays
    //   plain (the flow fits without the wall), so the exact glide the
    //   panel's wall seat always spoke never reached it. The fallback's
    //   law — every neighbor glides onto ANOTHER chip's old rect — is a
    //   clean shuffle for UNIFORM widths, but the tags are variable-width:
    //   chips landed on each other's old seats mid-drag (the visible
    //   pile-up) and the release snapped the layout straight ("the tags
    //   shift above each other and break"). The tools now ride the pack
    //   as the TAIL — exactly the wall context's own law for its foreign
    //   keys: a TRAILING foreign run (every foreign child after the last
    //   sort item — the + key's seat) is measured grab-time (hover
    //   transforms silenced per the 1.3.7 law; the drag itself never
    //   writes a tool's transform) and packed after the last chip, its
    //   widths consuming the last row exactly as the real flow paints
    //   them. The identity validation finally trusts the plain tags flow,
    //   the exact glide covers the full window, and any carrier whose
    //   foreign children INTERLEAVE the sort items keeps the refusal —
    //   that layout the packer still refuses to guess.
    const kidsArr = Array.from(cont.children || []);
    let lastSortIdx = -1;
    for (let i = 0; i < kidsArr.length; i += 1) {
      if (kidsArr[i].classList?.contains('gd-sort-item')) lastSortIdx = i;
    }
    const tools = [];
    if (lastSortIdx >= 0) {
      for (let i = lastSortIdx + 1; i < kidsArr.length; i += 1) {
        const el = kidsArr[i];
        if (el.classList?.contains('gd-sort-item')) continue; // (a sort item can never trail the last one — paranoia)
        const sT = el.style?.transform;
        const sTr = el.style?.transition;
        if (el.style) {
          el.style.transform = 'none';
          el.style.transition = 'none';
        }
        const r = el.getBoundingClientRect();
        if (el.style) {
          el.style.transform = sT ?? '';
          el.style.transition = sTr ?? '';
        }
        if (Number.isFinite(r.left) && Number.isFinite(r.width) && r.width > 0 && Number.isFinite(r.height)) {
          tools.push({ x: r.left, y: r.top, w: r.width, h: r.height });
        }
      }
      // a foreign child BEFORE the last sort item (interleaved) — still the
      // 0.41.0 refusal: the packer will not guess a mixed layout.
      const hasForeign = kidsArr.some(
        (el, i) => i < lastSortIdx && !el.classList?.contains('gd-sort-item')
      );
      if (hasForeign) return null;
    } else {
      const hasForeign = kidsArr.some((el) => !el.classList?.contains('gd-sort-item'));
      if (hasForeign) return null;
    }
    let gx = Number.isFinite(gapX) && gapX > 0 ? gapX : 8;
    let gy = Number.isFinite(gapY) && gapY > 0 ? gapY : 8;
    let W = 0;
    // 1.2.0 — NOWRAP IS A SHAPE TOO ("fix the versions logic, where
    // dragging a version around to position in place of another, the first
    // version moves correctly but the rest often either clips into another
    // version or leaves alot of gabs"): the version strip is a single-row
    // SCROLLER — its content runs past the visible width, so the packer
    // (which breaks rows at the container's width) never validated against
    // it and the drag fell back to the rect-swap glide. Measured live: a
    // neighbor glided to another chip's OLD x (118px off), and the settle
    // put the dragged chip 93px from where the commit then snapped it.
    // A nowrap container packs ALL its items in ONE row — the packer
    // models that now, validation passes, and every chip (the neighbors
    // AND the settle) takes its own simulated seat in the true reordered
    // layout: no clipping, no gaps, no snap after the drop.
    let nowrap = false;
    try {
      const st = getComputedStyle(cont);
      const cg = parseFloat(st.columnGap);
      const rg = parseFloat(st.rowGap);
      if (Number.isFinite(cg) && cg > 0) gx = cg;
      if (Number.isFinite(rg) && rg > 0) gy = rg;
      nowrap = st.flexWrap === 'nowrap';
      const pad = (parseFloat(st.paddingLeft) || 0) + (parseFloat(st.paddingRight) || 0);
      W = (cont.clientWidth || 0) - pad;
    } catch {
      return null;
    }
    if (!Number.isFinite(W) || W <= 0) return null;
    // a nowrap strip never breaks: the row cap is the content's own width
    // (the strip's scroll width), never the visible box.
    if (nowrap) W = Math.max(W, (cont.scrollWidth || 0) - (cont.clientWidth || 0) + W);
    // greedy row packing (flex-wrap: wrap, justify-content: start) — anchored
    // on the strip's OWN first column (0.41.0: rects[0], never order[0]).
    // 1.3.9 — the TRAILING TOOLS ride the pack after the last chip (see the
    // tools note above): their widths consume the row exactly as the real
    // flow paints them, so the identity validation finally speaks the
    // plain tags flow's truth. A row member is the chip index k (>= 0) or
    // the tool marker -(t + 1).
    const rectOf = (k) => (k >= 0 ? rects[k] : tools[-k - 1]);
    const rows = [];
    const left = rects[0].x;
    const total = n + tools.length;
    let i = 0;
    while (i < total) {
      const row = [];
      let cursor = left;
      while (i < total) {
        const r = i < n ? rects[order[i]] : tools[i - n];
        if (!nowrap && row.length && cursor + r.w - left > W + 1) break;
        row.push(i < n ? order[i] : -(i - n + 1));
        cursor += r.w + gx;
        i += 1;
      }
      rows.push(row);
    }
    // seats: every row's items center on the row's cross axis (align-items:
    // center); the FIRST row (0.41.0: rects[0] again, not order[0]) anchors
    // the stack, the rest stack with the row gap. The row's height carries
    // the tallest member SEATED at it, tools included — the same law the
    // real flex row speaks. Only the chips take seats (the tools never
    // glide; the commit's reflow seats them wherever the order leaves).
    const out = new Array(n).fill(null);
    let center = rects[0].y + rects[0].h / 2;
    let prevH = 0;
    for (let r = 0; r < rows.length; r += 1) {
      const row = rows[r];
      const rowH = row.reduce((m, k) => Math.max(m, rectOf(k).h), 0);
      if (r > 0) center += prevH / 2 + gy + rowH / 2;
      let xx = left;
      for (const k of row) {
        const rr = rectOf(k);
        if (k >= 0) out[k] = { x: xx, y: center - rr.h / 2 };
        xx += rr.w + gx;
      }
      prevH = rowH;
    }
    return out;
  };

  // 1.3.2 — THE WALL PACK (the simulateStrip wall path's engine): seat the
  // order's items into the wall — position p (0..n-1 = the sort items in
  // `order`, then the tools in their grab-time tail seats) lands at ROW
  // (p % rows) of COLUMN floor(p / rows), columns shrink-to-fit their
  // widest member (exactly what grid-auto-columns: max-content paints).
  // 1.3.3 — THE ROW-MAJOR LATTICE (ctx.rowMajor): position p lands at ROW
  // floor(p / C) of COLUMN (p % C), C = ceil(total / rows) — exactly what
  // grid-auto-flow: row over the repeat(C, max-content) template paints.
  // One packer, two lattices; the widths and the anchor are one law.
  // 1.3.4 — THE ROWS ARE THE PACK'S OWN ("sometimes a single row gets low
  // or high then returns when i let go"): the grid's rows are AUTO tracks
  // that size to the TALLEST MEMBER SEATED AT THEM — and the reorder
  // re-seats the members, so the honest post-commit row heights are a
  // function of the ORDER, not of the grab. The pack computes them itself
  // now: row r's height = the max of the heights THIS pack seats at r
  // (stamps from the grab snapshot, tools at their fixed tail seats), the
  // rows stacking down from the one anchor (ctx.anchorY — row 0's top,
  // order-independent by construction). The identity pack therefore
  // reproduces the painted wall exactly (validation trusts it), and a
  // REORDERED pack predicts the commit's true seats — the glide, the hole
  // and the settle all land where the release will actually paint them,
  // so no row can ride low or high under the hold and "return" when the
  // pointer lets go.
  // 1.3.5 — THE LANE LATTICE (ctx.lanes): position p lands in LANE (p % R)
  // at the lane's own k-th seat (k = floor(p / R)), and each lane runs its
  // OWN x cursor — the width of a member only pushes the members AFTER it
  // in ITS lane, never a shared column (exactly what the .gd-wall-lane flex
  // rows paint). The row heights stay the pack's own (lane r's height = the
  // tallest member THIS pack seats there), stacked from the one anchor —
  // the same 1.3.4 order-aware law, one voice for both lattices.
  const packWall = (order, ctx) => {
    const rects = snapRef.current;
    const n = rects.length;
    if (!n || !order || order.length !== n) return null;
    const { rows, gap, anchorY, tools, align, rowMajor } = ctx;
    const R = Math.max(1, rows | 0);
    if (!Number.isFinite(anchorY)) return null;
    if (!rects[0] || !Number.isFinite(rects[0].x)) return null;
    const left = rects[0].x;
    const center = align === 'center';
    const total = n + tools.length;
    const posW = (p) => (p < n ? (rects[order[p]]?.w || 0) : tools[p - n]?.w || 0);
    const posH = (p) => (p < n ? (rects[order[p]]?.h || 0) : tools[p - n]?.h || 0);
    if (ctx.lanes) {
      const rowHL = new Array(R).fill(0);
      for (let p = 0; p < total; p += 1) {
        const r = p % R;
        rowHL[r] = Math.max(rowHL[r], posH(p));
      }
      const rowTop = [anchorY];
      for (let r = 1; r < R; r += 1) rowTop[r] = rowTop[r - 1] + rowHL[r - 1] + gap;
      const laneX = new Array(R).fill(left);
      const out = new Array(n).fill(null);
      for (let p = 0; p < total; p += 1) {
        const r = p % R;
        const x = laneX[r];
        const w = posW(p);
        laneX[r] += w + gap;
        if (p >= n) continue; // the tools ride their tail seats and never move
        const k = order[p];
        const h = rects[k]?.h || 0;
        if (!Number.isFinite(rowTop[r])) return null;
        out[k] = {
          x,
          y: center ? rowTop[r] + Math.max(0, (rowHL[r] - h) / 2) : rowTop[r],
          w,
          h,
        };
      }
      if (out.some((o) => o == null)) return null;
      return out;
    }
    const nCols = Math.max(1, Math.ceil(total / R));
    const seatOf = rowMajor
      ? (p) => ({ r: Math.floor(p / nCols), c: p % nCols })
      : (p) => ({ r: p % R, c: Math.floor(p / R) });
    const colW = new Array(nCols).fill(0);
    const rowH = new Array(R).fill(0);
    for (let p = 0; p < total; p += 1) {
      const s = seatOf(p);
      if (s.r >= R) continue; // a tail beyond the cap: the wall never seats it
      colW[s.c] = Math.max(colW[s.c], posW(p));
      rowH[s.r] = Math.max(rowH[s.r], posH(p));
    }
    const colX = [left];
    for (let c = 1; c < nCols; c += 1) colX[c] = colX[c - 1] + colW[c - 1] + gap;
    // the rows stack from the anchor — exactly how the grid stacks its
    // auto tracks (row r+1's top = row r's top + row r's height + the gap).
    const rowTop = [anchorY];
    for (let r = 1; r < R; r += 1) rowTop[r] = rowTop[r - 1] + rowH[r - 1] + gap;
    const out = new Array(n).fill(null);
    for (let p = 0; p < n; p += 1) {
      const k = order[p];
      const h = rects[k]?.h || 0;
      const s = seatOf(p);
      if (!Number.isFinite(rowTop[s.r])) return null;
      out[k] = {
        x: colX[s.c],
        y: center ? rowTop[s.r] + Math.max(0, (rowH[s.r] - h) / 2) : rowTop[s.r],
        w: rects[k]?.w || 0,
        h,
      };
    }
    if (out.some((o) => o == null)) return null;
    return out;
  };

  // The per-drag geometry: { settle: {x,y}, delta: (i) => {x,y}|null } for a
  // (from, to=FINAL index) pair — the dragged chip's landing spot and every
  // neighbor's glide. Simulated first; the rect-swap fallback keeps the old
  // math for PLAIN strips the simulation can't validate (plus a width-aware
  // single-row settle, so even the fallback never lands a wide chip on a
  // narrow slot) — and the wall carriers REFUSE the fallback outright
  // (1.3.4, the note at the refusal): their vertical rect hops were the
  // "row rides low, returns on release" glitch.
  const glideFor = (from, to) => {
    const rects = snapRef.current;
    if (!rects || from == null || to == null || from === to) return null;
    const n = rects.length;
    // the reordered sequence — EXACTLY the commit's splice pair, with `to`
    // as the dragged item's final index (0.41.0): remove `from`, insert at
    // `to` in the reduced array.
    const order = [];
    for (let i = 0; i < n; i += 1) if (i !== from) order.push(i);
    order.splice(Math.max(0, Math.min(order.length, to)), 0, from);
    // validate the packer against the CURRENT layout first
    const identity = [];
    for (let i = 0; i < n; i += 1) identity.push(i);
    const current = simulateStrip(identity);
    if (current) {
      let trusted = true;
      for (let i = 0; i < n; i += 1) {
        if (Math.abs(current[i].x - rects[i].x) > 2 || Math.abs(current[i].y - rects[i].y) > 2) {
          trusted = false;
          break;
        }
      }
      if (trusted) {
        const next = simulateStrip(order);
        if (next) {
          return {
            settle: { x: next[from].x - rects[from].x, y: next[from].y - rects[from].y },
            delta: (i) =>
              i === from
                ? null
                : {
                    x: next[i].x - rects[i].x,
                    y: next[i].y - rects[i].y,
                  },
          };
        }
      }
    }
    // 1.3.4 — THE WALL REFUSES THE RECT-SWAP ("sometimes a single row gets
    // low or high then returns when i let go"): the fallback's law — every
    // neighbor glides onto ANOTHER ITEM'S OLD RECT — reads as a clean
    // horizontal shuffle on a single-row strip, but inside a wall the
    // rects stack VERTICALLY: a neighbor handed the rect of a seat on the
    // other row glides a full row-height down (or up) for the whole hold,
    // and the release's honest reflow walks it back — the exact "a single
    // row gets low or high then returns" glitch, armed whenever the
    // simulation failed its identity check on some sub-pixel quirk. A
    // wall that can't be validated now keeps its neighbors SEATED (no
    // transforms at all — the dragged chip alone travels, its settle
    // speaking the honest rect-to-rect seat below) — a quiet drag beats a
    // lying one; the plain flex-wrap strips keep the fallback, where it
    // has always told the truth.
    const isWallCarrier = !!(containerRef?.current?.dataset && containerRef?.current.dataset.gdFlow === 'wall');
    if (isWallCarrier) {
      const a = rects[from];
      const b = rects[to];
      return {
        settle: a && b ? { x: b.x - a.x, y: b.y - a.y } : { x: 0, y: 0 },
        delta: () => null,
      };
    }
    // fallback: neighbors glide onto another item's old rect (the 0.38/0.39
    // law — disjoint rects, so nothing overlaps while it travels)…
    const delta = (i) => {
      const final = finalIndexFor(i, from, to);
      const a = rects[i];
      const b = rects[final];
      if (!a || !b) return null;
      return { x: b.x - a.x, y: b.y - a.y };
    };
    // …but the SETTLE is width-aware on a single row: the dragged chip lands
    // exactly where the reflow will put it — at the old x of the chip it
    // displaces, adjusted by the two chips' width difference — so it never
    // clips over the chip (or the NEW VERSION key) that follows.
    let settle;
    const sameRow =
      Math.abs((rects[to]?.y || 0) - (rects[from]?.y || 0)) < Math.max(rects[to]?.h || 0, rects[from]?.h || 0) * 0.6;
    if (sameRow && to > from) {
      settle = { x: rects[to].x - (rects[from].w - rects[to].w) - rects[from].x, y: 0 };
    } else if (sameRow && to < from) {
      settle = { x: rects[to].x - rects[from].x, y: 0 };
    } else {
      const a = rects[from];
      const b = rects[to];
      settle = a && b ? { x: b.x - a.x, y: b.y - a.y } : { x: 0, y: 0 };
    }
    return { settle, delta };
  };

  const nearestIndex = (cx, cy) => {
    const rects = snapRef.current;
    if (!rects) return null;
    let best = null;
    let bestD = Infinity;
    rects.forEach((r, i) => {
      const dx = r.x + r.w / 2 - cx;
      const dy = r.y + r.h / 2 - cy;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };

  // 0.38.0 — GAP-BASED DROP TARGETS ("when reorganizing the versions, the
  // versions for some reason sometimes would overmove or undermove, then
  // would snap after its let go, fix that so it doesnt overmove or
  // undermove"): the target is the nearest INSERTION GAP — slot p's gap sits
  // between item p-1 and item p (row-aware for wrapping strips), and the
  // dragged chip's center picks the closest gap.
  // 0.41.0 — THE INDEX IS THE INSERTION INDEX NOW: the gap before item p
  // reports p (insert BEFORE p), and the TRAILING gap after the last item
  // reports count (insert at the very end) instead of being clamped onto
  // the last index. The old clamping fused "before the last item" and
  // "after everything" into one slot, and the commit then treated that slot
  // as a reduced insertion point — so rightward drops landed one slot past
  // the gap the pointer was actually over (the overmove/undermove that
  // survived 0.38). The caller's clampInsert + finalIndexOf translate this
  // into the dragged item's FINAL index, which the glide, the settle and
  // the commit all agree on.
  // 1.3.2 — THE WALL'S OWN GAPS: in a column-major wall the insertion
  // point before item i sits at the TRUE geometry between item i-1 and i —
  // the vertical space INSIDE a column when they stack (i % rows !== 0),
  // or the SEAM left of item i's column when i starts a new column. The
  // generic row-wrap heuristic (same-row horizontal midpoints, end-of-row
  // seams) reads vertical neighbors as row-wraps and parks every seam at
  // the previous item's height, so the nearest-gap verdicts drift a whole
  // row off in the wall. This model speaks the wall exactly: intra-column
  // gaps at the column's own x-center, seam gaps at BOTH the new column's
  // top height and the previous column's bottom height (a 2-3 row wall's
  // seam is reachable at every row it spans), the leading gap left of the
  // first column's top, and the trailing gap after the last item.
  // 1.3.3 — THE ROW-MAJOR GAPS (ctx.rowMajor): the reading runs across the
  // rows, so the insertion point before item i is the HORIZONTAL space
  // between seats i-1 and i when they share a row (i % C !== 0), or the
  // WRAP SEAM when i starts a row (i % C === 0) — reachable from BOTH
  // sides: the new row's left start (the reading's own head) and the
  // previous row's right end (where the reading left off), the same
  // two-voice law the column seam speaks.
  // 1.3.5 — THE LANE GAPS (ctx.lanes): every lane packs on its own, so the
  // insertion point before item i sits in ITEM I'S OWN LANE — the true
  // horizontal space between item i and its lane's previous member
  // (linear i - R) when one exists, or the lane's own left start when i
  // is its lane's first member.
  // 1.6.4 — EVERY LANE SPEAKS ITS OWN END ("when i drag a tag to the
  // bottom tags row, im unable to move a tag to the bottom row"): the
  // old model ended with ONE global trailing gap, drawn after the LAST
  // READING item — in that item's lane's row, landing the chip in the
  // round-robin's NEXT lane. Dropping past the last member of any OTHER
  // lane raced between a mid-lane gap (one seat early) and that foreign
  // trailing gap (the wrong row wins on wide lanes) — the bottom row was
  // literally unreachable at its end. Every lane carries its OWN end gap,
  // drawn at its last member's right edge in its own row, with the honest
  // slot: the reading's very end (count) for the round-robin's next lane
  // (the true append, zero cascade), or the last member's own slot
  // otherwise (the chip takes the lane's final seat; the tail cascades
  // one lane down, the reading's own law). An empty round-robin lane
  // (count < R) speaks its end gap one row under the last seated chip, at
  // the lane pitch the first two lanes measure.
  // 1.6.5 — THE ROW SPEAKS FIRST (the verdict's own half of the 1.6.4/1.6.5
  // law — see the 1.6.5 note inside the function): the 1.6.4 end gaps
  // still lost to FOREIGN-ROW gaps on raw euclidean distance whenever a
  // gap sat nearly directly beneath the pointer in another row, so
  // hovering the top row read as the bottom row. The verdict picks the
  // ROW first (the lane bands), then races only that row's own gaps.
  const nearestGapIndexWall = (cx, cy, rows, gap, ctx = null) => {
    const rects = snapRef.current;
    if (!rects || !rects.length) return null;
    const R = Math.max(1, rows | 0);
    const gapHalf = (Number.isFinite(gap) && gap > 0 ? gap : 8) / 2;
    const rowMajor = !!(ctx && ctx.rowMajor);
    const lanes = !!(ctx && ctx.lanes);
    const C = Math.max(1, (ctx && ctx.cols) || 0);
    let best = null;
    let bestD = Infinity;
    const consider = (x, y, slot) => {
      const dx = x - cx;
      const dy = y - cy;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = slot;
      }
    };
    // 1.6.5 — THE LANES VERDICT READS THE ROW FIRST ("you didnt fix the
    // issue of the bottom tags row, it should detect when im dragging onto
    // the same row, since right now you made it so when im on top row it
    // would react to bottom row instead"): the old model raced EVERY gap
    // point in the wall by raw euclidean distance — and a gap sitting
    // directly beneath the pointer in ANOTHER row (dy = one lane pitch,
    // dx ~= 0) beat the pointer's OWN row's gaps half a chip away
    // (dx = 40-70px): hovering the top row read as the bottom row. The
    // verdict speaks TWO questions now: WHICH row the chip's center sits
    // over — the lane bands from the grab-time snapshot (containment
    // first, the nearest band when it sits between rows), plus the empty
    // round-robin lane's phantom band one row under the last seated chip
    // (the 1.6.4 append law's own seat, so dragging below the last row
    // still lands the append honestly) — and only then WHICH gap in THAT
    // row is nearest: the lane's own left start, its intra-lane mid gaps,
    // and its own end gap (the 1.6.4 slot mapping — the round-robin's next
    // lane speaks the true append, every other lane its final seat). A
    // lane's verdict can never cross rows again: same row, same voice.
    if (lanes) {
      const rrLane = count % R;
      const bands = []; // { lane, top, bottom }
      for (let lane = 0; lane < R; lane += 1) {
        let top = Infinity;
        let bottom = -Infinity;
        for (let i = lane; i < rects.length; i += R) {
          const r = rects[i];
          if (r.y < top) top = r.y;
          if (r.y + r.h > bottom) bottom = r.y + r.h;
        }
        if (bottom > top) bands.push({ lane, top, bottom });
      }
      let phantomPitch = null; // the empty rr lane's row seat, when it speaks
      if (!bands.some((b) => b.lane === rrLane)) {
        const last = rects[rects.length - 1];
        const pitch = rects.length > 1 ? rects[1].y - rects[0].y : rects[0].h + gap;
        if (Number.isFinite(pitch)) {
          const h = rects[0].h || 24;
          const midY = last.y + last.h / 2 + pitch;
          bands.push({ lane: rrLane, top: midY - h / 2, bottom: midY + h / 2 });
          phantomPitch = pitch;
        }
      }
      if (!bands.length) return null;
      // the row the chip's center sits over (contained, else the nearest)
      let pick = bands[0];
      let pickD = Infinity;
      for (const b of bands) {
        if (cy >= b.top && cy <= b.bottom) {
          pick = b;
          break;
        }
        const d = cy < b.top ? b.top - cy : cy - b.bottom;
        if (d < pickD) {
          pickD = d;
          pick = b;
        }
      }
      const lane = pick.lane;
      let q = -1; // the lane's last member's reading index
      for (let i = lane; i < rects.length; i += R) q = i;
      if (q < 0) {
        // the empty round-robin lane: its two phantom voices (the 1.6.4
        // law — the row's left start AND past the last chip's right end)
        const last = rects[rects.length - 1];
        const midY = last.y + last.h / 2 + phantomPitch;
        consider(rects[0].x - gapHalf, midY, rects.length);
        consider(last.x + last.w + gapHalf, midY, rects.length);
        return best;
      }
      // the lane's own gaps, every one in its own row: the left start,
      // the true mid gaps between consecutive members, the lane's end.
      for (let i = lane; i < rects.length; i += R) {
        if (i < R) {
          // the lane's first member: its own left start
          consider(rects[i].x - gapHalf, rects[i].y + rects[i].h / 2, i);
        } else {
          // inside the lane: the true gap between it and its previous member
          const prev = rects[i - R];
          consider((prev.x + prev.w + rects[i].x) / 2, rects[i].y + rects[i].h / 2, i);
        }
      }
      const m = rects[q];
      const slot = lane === rrLane ? rects.length : q;
      consider(m.x + m.w + gapHalf, m.y + m.h / 2, slot);
      return best;
    }
    // 1.6.9 — THE COLUMN WALL READS THE ROW FIRST ("the tag issue has also
    //   moved to stamps where if im hovering on the top row its effecting
    //   bottom row on left, if im hovering on the bottom row then it
    //   effects the element above it, etc, fix that"): the old model raced
    //   EVERY gap point in the wall by raw euclidean distance — the
    //   intra-column vertical gaps sat at the column's center BETWEEN the
    //   rows, so a pointer resting on the top row over a column's middle
    //   found the vertical gap beneath it (dy = half a row pitch) closer
    //   than its own row's horizontal gap (dx = half a stamp), and the
    //   verdict seated the chip one row off — the bottom row answering a
    //   top-row hover, "the element above it" answering a bottom-row
    //   hover. The verdict speaks TWO questions now, the exact law the
    //   lanes wall learned in 1.6.5: WHICH row the chip's center sits
    //   over — the row bands from the grab-time snapshot (containment
    //   first, the nearest band when it sits between rows) — and only
    //   then WHICH gap in THAT row is nearest: the row's own left start,
    //   the true horizontal gaps between its consecutive members, and its
    //   own end gap (the round-robin's next row speaks the true append,
    //   every other row its last member's slot). The row's verdict can
    //   never cross rows again — same row, same voice.
    if (!rowMajor) {
      const rrRow = count % R;
      const bands = [];
      for (let row = 0; row < R; row += 1) {
        let top = Infinity;
        let bottom = -Infinity;
        for (let i = row; i < rects.length; i += R) {
          const r = rects[i];
          if (r.y < top) top = r.y;
          if (r.y + r.h > bottom) bottom = r.y + r.h;
        }
        if (bottom > top) bands.push({ row, top, bottom });
      }
      if (!bands.length) return null;
      // the row the chip's center sits over (contained, else the nearest)
      let pick = bands[0];
      let pickD = Infinity;
      for (const b of bands) {
        if (cy >= b.top && cy <= b.bottom) {
          pick = b;
          break;
        }
        const d = cy < b.top ? b.top - cy : cy - b.bottom;
        if (d < pickD) {
          pickD = d;
          pick = b;
        }
      }
      const row = pick.row;
      let q = -1; // the row's last member's reading index
      for (let i = row; i < rects.length; i += R) q = i;
      if (q < 0) {
        // an empty round-robin row: its two phantom voices (the 1.6.4
        // append law — the row's left start AND past the last chip's
        // right end), one row under the last seated chip
        const last = rects[rects.length - 1];
        const pitch = rects.length > 1 ? rects[1].y - rects[0].y : rects[0].h + gap;
        if (Number.isFinite(pitch)) {
          const h = rects[0].h || 24;
          const midY = last.y + last.h / 2 + pitch;
          consider(rects[0].x - gapHalf, midY, rects.length);
          consider(last.x + last.w + gapHalf, midY, rects.length);
        }
        return best;
      }
      // the row's own gaps, every one in its own band: the left start,
      // the true mid gaps between consecutive row members, the row's end
      for (let i = row; i < rects.length; i += R) {
        if (i < R) {
          // the row's first member: its own left start
          consider(rects[i].x - gapHalf, rects[i].y + rects[i].h / 2, i);
        } else {
          // inside the row: the true gap between it and the previous column's member
          const prev = rects[i - R];
          consider((prev.x + prev.w + rects[i].x) / 2, rects[i].y + rects[i].h / 2, i);
        }
      }
      const m = rects[q];
      const slot = row === rrRow ? rects.length : q;
      consider(m.x + m.w + gapHalf, m.y + m.h / 2, slot);
      return best;
    }
    consider(rects[0].x - gapHalf, rects[0].y + rects[0].h / 2, 0);
    for (let i = 1; i < rects.length; i += 1) {
      const r = rects[i];
      const prev = rects[i - 1];
      if (C > 1 && i % C === 0) {
        // the seam before this row's first item: reachable at the row's
        // own left start AND the previous row's right end
        consider(r.x - gapHalf, r.y + r.h / 2, i);
        consider(prev.x + prev.w + gapHalf, prev.y + prev.h / 2, i);
      } else {
        // same row: the true horizontal gap between the two seats
        consider((prev.x + prev.w + r.x) / 2, r.y + r.h / 2, i);
      }
    }
    const last = rects[rects.length - 1];
    consider(last.x + last.w + gapHalf, last.y + last.h / 2, rects.length);
    return best;
  };

  const nearestGapIndex = (cx, cy, gap = gapX) => {
    const rects = snapRef.current;
    if (!rects || !rects.length) return null;
    const gapHalf = (Number.isFinite(gap) && gap > 0 ? gap : 8) / 2;
    let best = null;
    let bestD = Infinity;
    const consider = (x, y, slot) => {
      const dx = x - cx;
      const dy = y - cy;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = slot;
      }
    };
    rects.forEach((r, i) => {
      if (i === 0) {
        consider(r.x - gapHalf, r.y + r.h / 2, 0);
        return;
      }
      const prev = rects[i - 1];
      const sameRow = Math.abs(prev.y - r.y) < Math.max(prev.h, r.h) * 0.6;
      if (sameRow) {
        consider((prev.x + prev.w + r.x) / 2, r.y + r.h / 2, i);
      } else {
        // the gap wraps rows: it sits at the END of the previous row
        consider(prev.x + prev.w + gapHalf, prev.y + prev.h / 2, i);
      }
    });
    // the trailing gap AFTER the last item — a true insertion at the end
    // (0.41.0: reported as `count`, no longer fused with the last slot)
    const last = rects[rects.length - 1];
    consider(last.x + last.w + gapHalf, last.y + last.h / 2, rects.length);
    return best;
  };

  // ---- pointer handlers ------------------------------------------------------
  // 1.2.0 — THE DRAG'S SCROLLER ("when holding a stamp or a version around
  // on right or left of the container, auto scroll through it as
  // accessability"): the element that actually scrolls during a drag. The
  // version strip scrolls itself; the stamp slots ride a wrapper whose
  // PARENT zone scrolls (the side-flow seat). The finder walks up from the
  // container to the nearest horizontally-scrollable ancestor — the same
  // walk either way, so both flavors speak one law.
  const scrollerFor = (el) => {
    let n = el;
    while (n && n !== document.body && n !== document.documentElement) {
      if (
        n.scrollWidth > (n.clientWidth || 0) + 2 &&
        typeof window !== 'undefined' &&
        window.getComputedStyle
      ) {
        let ox = '';
        try {
          ox = window.getComputedStyle(n).overflowX;
        } catch {
          ox = '';
        }
        if (ox === 'auto' || ox === 'scroll') return n;
      }
      n = n.parentElement;
    }
    return null;
  };

  // 1.2.0 — THE SHARED TARGET MATH: the pointermove handler and the
  // auto-scroll loop both recompute the drop target from a live pointer
  // position; one law, two callers.
  // 1.2.2 — THE CHIP RIDES WITH THE CURSOR THROUGH THE PAN ("when moving
  // versions around and the auto scroll occurs, make the tag follow the
  // cursor still and not get left behind"): the auto-scroll used to shift
  // the grab-time snapshot AND the dragged chip's base with the content —
  // a chip held at the edge STAYED at the content's edge while the pointer
  // camped (measured live: the pointer 250px right of the drawn chip), and
  // the drop target read the left-behind chip's seat, so commits landed
  // where the chip WAS, not where the pointer IS. The chip keeps its
  // GRAB-TIME base now and the accumulated pan rides the TRANSFORM
  // (scrollAccum): the drawn chip stays welded to the cursor through the
  // whole pan, and the target reads its true seat — the origin snapshot +
  // the pointer delta + the pan, all in one law.
  const targetFrom = (drag, cx, cy) => {
    let to;
    if (useGeometry && snapRef.current) {
      const r0 = drag.originRect || snapRef.current[drag.from];
      // the dragged chip's LIVE center: its grab-time origin + the pointer's
      // travel, all in viewport space. 1.2.9 — THE PAN IS NOT ADDED ("it
      // creates ghost stamps, aka a space where a stamp should go but would
      // be empty, occurs when i hold and drag a stamp around"): the chip's
      // element rides INSIDE the scrolling content, so a pan slides its
      // LAYOUT seat left by exactly the pan — and the drawn transform
      // already carries `+ pan` to compensate (the 1.2.2 weld). The two
      // cancel: the chip's true viewport center is origin + pointer delta,
      // with NO pan term. The old `+ pan` counted the compensation twice
      // (once here, once through the snapshot's own pan-shift in
      // autoscrollTick), so the target read the chip up to a whole pan-width
      // right of where it paints — measured live: a stamp dragged 180px
      // right with a 198px auto-pan committed to index 13 instead of ~8,
      // and mid-drag the placeholder hole opened far from the chip: the
      // "ghost stamp", an empty slot where no stamp will ever land.
      const dx = cx - drag.startX;
      const dy = cy - drag.startY;
      const r = r0 ? r0.x + r0.w / 2 + dx : cx;
      const rr = r0 ? r0.y + r0.h / 2 + dy : cy;
      const wallCtx = drag.wallCtx;
      const ins = clampInsert(
        (wallCtx ? nearestGapIndexWall(r, rr, wallCtx.rows, wallCtx.gap, wallCtx) : nearestGapIndex(r, rr)) ?? drag.from
      );
      // 1.6.9 — THE WALL'S SLOT IS ITS OWN FINAL INDEX ("when i hover over
      //   the top row while holding a tag it effects bottom row, when i
      //   hover over middle row it effects top row, when i hover over bottom
      //   it affects middle, fix that so it corresponds to its own row" +
      //   the same disease in the stamps wall): every wall lattice seats
      //   its members by MODULELO — the lanes wall rides lane i % R, the
      //   column wall rides row i % R, the row wall rides row i / C — so a
      //   chip inserted "before linear item i" TAKES I'S OWN READING SEAT
      //   (i cascades one position down the flow, exactly the way every
      //   auto-flow grid re-seats its members). The old conversion spoke
      //   the PLAIN LIST's law (remove-then-insert: final = ins - 1 for a
      //   rightward move) — and on a modulo lattice ins - 1 lands the chip
      //   ONE ROW UP-CYCLICALLY (insert before a lane-0 member → final
      //   index i-1 → lane 2; before a lane-1 member → lane 0; before a
      //   lane-2 member → lane 1): hovering the top row committed the chip
      //   to the bottom row, the middle row to the top, the bottom row to
      //   the middle — the exact off-by-one the report describes, and the
      //   stamps wall's column lattice spoke the same law with the same
      //   wrong voice ("hovering the top row affects the bottom row on
      //   the left"). The gap finder's slot is the seat the pointer
      //   chose; the wall commit splices at it directly (ins < from and
      //   ins === from keep the list's classic voice — the -1 only ever
      //   spoke for rightward moves). The plain strips (the version
      //   row, the image manager, the wrapping tags flow) keep the
      //   classic conversion untouched — their reading IS the array, and
      //   the 0.41.0 overmove fix was measured against it.
      to = clampIndex(wallCtx ? ins : finalIndexOf(drag.from, ins));
    } else if (cols <= 1) {
      to = clampIndex(drag.from + Math.round((cx - drag.startX) / drag.strideX));
    } else {
      const col = Math.max(0, Math.min(cols - 1, (drag.from % cols) + Math.round((cx - drag.startX) / drag.strideX)));
      const rowsN = Math.ceil(count / cols);
      const row = Math.max(0, Math.min(rowsN - 1, Math.floor(drag.from / cols) + Math.round((cy - drag.startY) / drag.strideY)));
      to = clampIndex(row * cols + col);
    }
    return to;
  };

  // 1.2.0 — THE EDGE AUTO-SCROLL: while the pointer camps near the
  // scroller's left or right edge, a rAF loop pans the strip ~9px a frame.
  // Every step shifts the grab-time snapshot (the content moved under the
  // viewport) and retargets the glide from the CURRENT pointer — new chips
  // roll in, the hole follows the pointer, and the drag keeps working all
  // the way to the strip's ends. The loop dies the moment the pointer
  // leaves the zone, the scroll hits an end, or the drag ends.
  const AUTO_EDGE = 56;
  const AUTO_STEP = 9;
  const autoscrollRef = useRef(0); // the running rAF id (0 = idle)

  const stopAutoscroll = () => {
    if (autoscrollRef.current) {
      (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : clearTimeout)(autoscrollRef.current);
      autoscrollRef.current = 0;
    }
  };

  const autoscrollTick = () => {
    autoscrollRef.current = 0;
    const drag = dragRef.current;
    if (!drag || drag.settled || !drag.scroller) return;
    const sc = drag.scroller;
    const rect = sc.getBoundingClientRect();
    const px = drag.lastX;
    const inLeft = px < rect.left + AUTO_EDGE;
    const inRight = px > rect.right - AUTO_EDGE;
    // 1.2.6 — THE MAX IS THE CONTENT'S OWN END ("dont create more space as
    // i keep holding to the right … since right now i can scroll
    // infinitely"): the dragged chip's transform POKES past the content's
    // end while it rides the cursor at the edge, and a transformed box
    // EXTENDS the scroller's scrollable overflow — the live scrollWidth
    // grew with every frame of the ride (measured live: holding at the
    // right edge grew max 217 -> 3196 in under two seconds — the strip
    // scrolled into space that does not exist). The max is FROZEN at grab
    // time now: the honest end of the content before any chip pokes out.
    const max = Number.isFinite(drag.scrollMax0) ? drag.scrollMax0 : sc.scrollWidth - sc.clientWidth;
    let dir = 0;
    if (inLeft && sc.scrollLeft > 0) dir = -1;
    else if (inRight && sc.scrollLeft < max - 1) dir = 1;
    if (!dir) return;
    const before = sc.scrollLeft;
    try {
      sc.scrollBy({ left: dir * AUTO_STEP });
    } catch {
      sc.scrollLeft = before + dir * AUTO_STEP;
    }
    const delta = sc.scrollLeft - before;
    if (!delta) return;
    // the content moved under the viewport: shift the snapshot (the gap
    // math reads viewport seats) and accumulate the pan on the drag — the
    // drawn chip's transform takes the accumulation, so it stays welded to
    // the cursor instead of riding the content out from under it (1.2.2).
    if (snapRef.current) {
      for (const r of snapRef.current) {
        if (r) {
          r.x -= delta;
        }
      }
    }
    drag.scrollAccum = (drag.scrollAccum || 0) + delta;
    const to = targetFrom(drag, drag.lastX, drag.lastY);
    if (to !== drag.to) {
      drag.to = to;
      setSort({ from: drag.from, to, dragging: true });
    }
    // the drawn chip rides the cursor's own seat: the pointer camps (no
    // moves fire), so the transform is refreshed from the pointer delta
    // PLUS the accumulated pan — the chip holds its place under the cursor
    // while the world slides by (1.2.2 — "make the tag follow the cursor
    // still and not get left behind").
    if (drag.el && drag.baseRect) {
      const b = drag.baseRect;
      const pan = drag.scrollAccum || 0;
      const dx = drag.lastX - drag.startX + pan;
      const dy = drag.lastY - drag.startY;
      let tdx = dx;
      let tdy = dy;
      if (drag.contRect) {
        const m = 2;
        // 1.2.5 — THE CLAMP'S BOUNDS SPEAK THE PAN: the chip's natural seat
        // rides the content (it slides left as the strip pans right), so
        // the transform that holds it under the cursor must be allowed to
        // grow by exactly the pan — the bounds shift with it. The old
        // bounds sat at the grab-time box while the delta grew: the clamp
        // ate the pan compensation every frame and the held chip sailed
        // with the content (measured live: the pointer welded at gap 5px,
        // then the pan ran and the gap grew to 599px — the chip riding the
        // strip out from under the mouse, the exact "the version moves
        // with the container scroll" report).
        let minX = drag.contRect.left + m - b.left + pan;
        let maxX = drag.contRect.right - m - (b.left + b.w) + pan;
        // 1.2.6 — AND THE CONTENT'S OWN ENDS (see the pointermove clamp):
        // the pan-free constants keep the chip inside the content's true
        // bounds however far the auto-scroll runs — the infinite-scroll
        // kill's other half (the scroll stops at the frozen max, the chip
        // parks at the content's end, nothing invents new space).
        if (Number.isFinite(drag.srLeft) && Number.isFinite(drag.scroll0)) {
          const cMin = drag.srLeft - drag.scroll0 - b.left + m;
          const cMax = drag.srLeft - drag.scroll0 + (drag.contentW || 0) - m - (b.left + b.w);
          if (Number.isFinite(cMin)) minX = Math.max(minX, cMin);
          if (Number.isFinite(cMax) && (drag.contentW || 0) > 0) maxX = Math.min(maxX, cMax);
        }
        const minY = drag.contRect.top + m - b.top;
        const maxY = drag.contRect.bottom - m - (b.top + b.h);
        tdx = Math.max(minX, Math.min(maxX, tdx));
        tdy = Math.max(minY, Math.min(maxY, tdy));
      }
      drag.el.style.transform = `translate(${tdx}px, ${tdy}px) scale(1.07)`;
    }
    autoscrollRef.current = (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : setTimeout)(autoscrollTick);
  };

  const maybeAutoscroll = (drag) => {
    if (!drag || drag.settled || !drag.scroller) return;
    const rect = drag.scroller.getBoundingClientRect();
    const inLeft = drag.lastX < rect.left + AUTO_EDGE;
    const inRight = drag.lastX > rect.right - AUTO_EDGE;
    // 1.2.6 — the frozen max (see autoscrollTick): the pan never chases
    // space the chip's own overhang invented.
    const max = Number.isFinite(drag.scrollMax0) ? drag.scrollMax0 : drag.scroller.scrollWidth - drag.scroller.clientWidth;
    const active = (inLeft && drag.scroller.scrollLeft > 0) || (inRight && drag.scroller.scrollLeft < max - 1);
    if (active && !autoscrollRef.current) {
      autoscrollRef.current = (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : setTimeout)(autoscrollTick);
    }
  };

  const bindItem = useCallback(
    (i) => {
    // 1.2.6 — THE RELEASE PATHS, HOISTED: the pointerup / pointercancel
    // bodies live as named closures of the factory so the DRAG'S SAFETY
    // NETS (onPointerDown below) can speak the exact same path — a release
    // the element never saw (a stolen pointer, a lost capture, a blurred
    // window) runs the same logic the element's own handler would, and the
    // settled flag makes every later visitor a no-op.
    const releaseAt = (e) => {
        const drag = dragRef.current;
        if (!drag || drag.settled) return;
        if (e && e.pointerId != null && drag.pointerId != null && e.pointerId !== drag.pointerId) return;
        stopAutoscroll();
        if (!drag.moved) {
          if (typeof drag.releaseSafety === 'function') drag.releaseSafety();
          dragRef.current = null;
          onTapRef.current?.(drag.from); // plain click — select the image
          return;
        }
        const { from, to, el } = drag;
        // 1.3.0 — THE DRAG'S OWN CLICK DIES WITH IT (the tags row's drag
        // rides CHIP-BUTTONS whose onClick toggles the tag): a pointer
        // capture that ends on the grabbed element still fires a CLICK
        // right after this pointerup — the browser counts the drag's
        // down+up pair as a click no matter how far the chip traveled.
        // The stamp slots never noticed (they act through the engine's
        // own onTap), but a chip with a real onClick would act on its
        // drop: a dragged TAG would toggle itself off the card, a dragged
        // version chip would select it. One capture-phase swallow on the
        // element eats exactly that trailing click (it lands in the same
        // task as the pointerup), and a short timer takes the listener
        // back off if no click ever came (a release the OS turned into
        // something else).
        if (drag.moved && typeof el?.addEventListener === 'function') {
          const swallow = (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
          };
          el.addEventListener('click', swallow, { capture: true, once: true });
          setTimeout(() => {
            try {
              el.removeEventListener('click', swallow, { capture: true });
            } catch {
              /* already gone */
            }
          }, 250);
        }
        // 1.0.0 — the release point, for the hold below ("sometimes the
        // image left behind would move slightly up in its own container"):
        // the moment pointer capture lets go, Chromium recomputes :hover at
        // the point of release — the tile UNDER THE POINTER wakes with every
        // hover motion at once (the manager tile's star / X keys fading in
        // above its frame, the version chip's -1px lift, the stamp slot's
        // rise) without the pointer ever moving. The 0.45 hold only covered
        // the DRAGGED item; the tile that "stayed behind" under the cursor
        // still popped. runCommit now holds EVERY tile the release woke.
        const releaseX = Number.isFinite(e.clientX) ? e.clientX : null;
        const releaseY = Number.isFinite(e.clientY) ? e.clientY : null;
        // Animate the grabbed thumb INTO the placeholder gap, then commit.
        // dragRef stays alive (settled) through the animation so the
        // neighbors keep their glided transforms — nothing snaps mid-flight.
        drag.settled = true;
        // 0.40.0 — the settle target is the chip's OWN seat in the simulated
        // reordered layout (width-aware — a wide chip never lands on a narrow
        // slot's x and clips over the NEW VERSION key); the rect-swap only
        // rides along for strips the simulation can't model.
        const glide = useGeometry ? glideFor(from, to) : null;
        let d;
        if (glide) {
          d = glide.settle;
        } else if (useGeometry && snapRef.current) {
          const a = snapRef.current[from];
          const b = snapRef.current[to];
          d = a && b ? { x: b.x - a.x, y: b.y - a.y } : { x: 0, y: 0 };
        } else {
          d = deltaSlots(from, to);
        }
        // 1.7.0 — the shadow rides the SAME 0.17s clock as the seat (see
        // .gd-sort-release in index.css): the commit fires on the transform's
        // own transitionend, so the carry's fade must land in the same breath
        // — a slower shadow would still hold a residue at the commit and pop.
        el.style.transition = 'transform 0.17s ease-out, box-shadow 0.17s ease-out';
        // 1.7.0 — THE RELEASE FADES THE CARRY (see .gd-sort-release in
        // index.css): the settle write is also the moment the finger left —
        // the class hands the shadow its ZERO target so the carried glow
        // eases out through this very glide, already gone when the commit
        // strips .is-dragging. runCommit (and the next grab, below) are the
        // only places the class ever leaves.
        el.classList.add('gd-sort-release');
        el.style.transform = `translate(${d.x}px, ${d.y}px)`;
        // 0.43.0 — THE COMMIT RIDES THE SETTLE'S OWN END ("after i let go it
        // would snap as all the images would flash or get updated"): the old
        // timer fired at a FIXED 185ms while the settle transition can start
        // a frame or two late (rAF scheduling, heavy paint) — the commit then
        // re-ordered the DOM while the tile was still ~10% short of its seat,
        // and stripping the transform at that moment read as a SNAP (plus the
        // marks and borders blinking to their new tiles in the same paint).
        // The commit now runs when the settle transition ACTUALLY ends
        // (transitionend, transform only), with a generous timeout as the
        // no-event fallback — the DOM hand-off never lands mid-flight again.
        let committed = false;
        const runCommit = () => {
          if (committed) return;
          committed = true;
          // 1.7.0 — the release fade's own retirement: the class rides the
          // settle glide only; the commit strips it with the rest of the
          // carried state (the shadow it faded is already zero — nothing
          // visual can ever move here).
          el.classList.remove('gd-sort-release');
          // 1.2.8 — THE HOLD LIFTS BEFORE THE COMMIT'S OWN RENDER: the
          // flushSync below re-renders the zone with the NEW order — its
          // layout effect must be allowed to measure honestly (the class
          // off), or the pages would keep the pre-commit arrangement for
          // another beat and the post-drop layout would land one render
          // late. The drag that armed it spends it exactly once.
          if (drag.sortLiveArmed) {
            drag.sortLiveArmed = false;
            armSortLive(false);
          }
          el.removeEventListener('transitionend', onSettleEnd);
          if (commitTimerRef.current) {
            clearTimeout(commitTimerRef.current);
            commitTimerRef.current = null;
          }
          // 0.30.0 — THE SNAP-BACK FIX ("after the swap animation is done
          // it resets then back to the new position, like a weird snap").
          // The old order was: setSort(null) + CLEAR THE TRANSFORM, then
          // onCommit — but React 18 schedules default-priority updates
          // through the scheduler (a MessageChannel task AFTER a paint),
          // so the browser painted one frame with the transform gone and
          // the DOM still in the OLD order — the stamp visibly jumped back
          // to its old slot, then snapped forward again when the commit
          // re-ordered the DOM. The hand-off is now ATOMIC: the reorder
          // commit + the sort clear run inside ONE flushSync (the DOM
          // re-orders synchronously in this task), and only THEN is the
          // settle transform stripped — both land in the same paint, so
          // nothing ever paints at the old position.
          //
          // 0.44.0 — THE STALE TRANSFORM DIES FIRST: the dragged element's
          // settle transform used to be stripped AFTER the flushSync, so
          // the layout effects that ran INSIDE it measured the element at
          // final-seat + settle-delta (a DOUBLE offset). Stripping BEFORE
          // the flushSync (under gd-settle, so the clear can never animate)
          // leaves every rect at its final seat when the marks measure —
          // same-task, same paint.
          //
          // 0.45.0 — THE MARK CHECKPOINT IS RETIRED with the flight itself
          // (the marks pop on a change of OWNERS now — no rects to
          // snapshot): the commit is just the atomic hand-off + the release
          // hold below.
          const cont = containerRef?.current || el.parentElement;
          settleContRef.current = cont || null;
          const hadSort = !!sortRef.current;
          if (hadSort || from !== to) {
            try {
              // 1.4.8 — THE DROP-BACK KEEPS ITS FLIGHT (the glide-home law's
              // release half): a chip released on its OWN seat (from === to)
              // reorders nothing — the settle guard's frozen transitions
              // would snap any neighbor still carrying a glide straight
              // home in the clear's paint. The GLIDE-HOME guard rides that
              // branch instead: the sort's clear animates every remaining
              // transform home, the same flight the mid-drag homecoming
              // speaks (a real reorder keeps gd-settle — the DOM splice must
              // land in the same paint as the transform clear, exactly the
              // 0.30.0 atomic law, untouched).
              if (from === to) {
                armGlideHome(cont);
              } else {
                cont?.classList.add('gd-settle');
              }
              // the stale settle transform must not be read as geometry
              el.style.transform = '';
              el.style.transition = '';
              flushSync(() => {
                setSort(null);
                // `to` is the dragged item's FINAL index (0.41.0) — the
                // commit splice is exactly remove(from) + insert at it.
                if (from !== to) onCommitRef.current?.(from, to);
              });
            } catch {
              setSort(null);
              if (from !== to) onCommitRef.current?.(from, to);
            }
          }
          if (cont?.classList.contains('gd-settle')) {
            requestAnimationFrame(() =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => {
                  cont.classList.remove('gd-settle');
                })
              )
            );
          }
          // 0.45.0 — THE RELEASE HOLD ("the same icon still moves up slightly
          // when switching versions [as i let go and they update]"). The
          // pointer usually still rests on the dropped item, and the moment
          // the short gd-settle guard drops, every hover-driven motion
          // re-arms AT ONCE — the chip's :hover lift, the settings pencil
          // fading in above the frame — reading as the icon hopping upward
          // right after the update. The hold keeps those quiet on the JUST
          // DROPPED item (see .gd-just-dropped in index.css) until the
          // pointer genuinely LEAVES it: document-level capture listeners
          // clear the class the first time the pointer is over (or presses)
          // anything outside the item. No pointer move, no hover — quiet.
          //
          // 1.0.0 — THE HOLD COVERS THE WOKEN, NOT JUST THE DROPPED: the
          // hover recompute at capture-release also arms the tile UNDER THE
          // POINTER — usually a gliding NEIGHBOR that closed onto the resting
          // cursor as the dragged image left ("the image LEFT BEHIND moves
          // slightly up in its own container"). One shared hold set: the
          // dragged tile AND any sort tile the release point sits on; the
          // clear listener waits for the pointer to genuinely leave THEM
          // ALL. The settle transform is still riding the dragged tile at
          // this moment, so the hit-test sees the pre-commit glide layout —
          // exactly the arrangement the commit is about to paint.
          if (typeof document !== 'undefined' && el.isConnected) {
            const held = [el];
            if (
              releaseX != null &&
              releaseY != null &&
              typeof document.elementFromPoint === 'function'
            ) {
              try {
                const hit = document.elementFromPoint(releaseX, releaseY);
                const tile =
                  hit && typeof hit.closest === 'function' ? hit.closest('.gd-sort-item') : null;
                if (
                  tile &&
                  tile !== el &&
                  tile.isConnected &&
                  !tile.contains(el) &&
                  !el.contains(tile) &&
                  typeof tile.classList?.add === 'function'
                ) {
                  tile.classList.add('gd-just-dropped');
                  held.push(tile);
                }
              } catch {
                /* detached mid-flight — the dragged tile's own hold stands */
              }
            }
            for (const h of held) h.classList.add('gd-just-dropped');
            const dropClear = (ev) => {
              const target = ev && ev.target;
              if (target && typeof target === 'object') {
                for (const h of held) {
                  if (h.isConnected && h.contains(target)) return; // still inside a held tile
                }
              }
              for (const h of held) h.classList.remove('gd-just-dropped');
              document.removeEventListener('pointerover', dropClear, true);
              document.removeEventListener('pointerdown', dropClear, true);
            };
            document.addEventListener('pointerover', dropClear, true);
            document.addEventListener('pointerdown', dropClear, true);
          }
          // 1.2.6 — the drag's safety nets come off with the drag itself
          // (see onPointerDown): no listener outlives its drag, whatever
          // ended it.
          if (typeof drag.releaseSafety === 'function') drag.releaseSafety();
          dragRef.current = null;
          snapRef.current = null;
        };
        const onSettleEnd = (ev) => {
          if (ev && ev.target !== el) return;
          if (ev && ev.propertyName && ev.propertyName !== 'transform') return;
          runCommit();
        };
        el.addEventListener('transitionend', onSettleEnd);
        // the fallback: jsdom and interrupted transitions never fire
        // transitionend — the generous window still beats the old fixed tick.
        commitTimerRef.current = setTimeout(runCommit, from !== to ? 340 : 175);
      };
    // 1.2.6 — THE CANCEL: an interrupted drag (a lost pointer, a stolen
    // window drag, a blur) snaps HOME — no commit. The release seat was
    // never witnessed, so the reorder would be a guess. Same flight and
    // same cleanup as the old element-only handler.
    const cancelAt = (e) => {
        const drag = dragRef.current;
        if (!drag || drag.settled) return;
        // Snap back home, then clear. 1.2.8 — the hold lifts with the drag
        // (the measure may return; the layout never changed).
        if (drag.sortLiveArmed) {
          drag.sortLiveArmed = false;
          armSortLive(false);
        }
        drag.settled = true;
        drag.el.style.transition = 'transform 0.15s ease-out';
        drag.el.style.transform = '';
        // 1.0.0 — the cancel wakes the same hover as a drop: hold the tile
        // under the release point too (see the release-hold note above).
        if (
          typeof document !== 'undefined' &&
          drag.el.isConnected &&
          Number.isFinite(e?.clientX) &&
          Number.isFinite(e?.clientY) &&
          typeof document.elementFromPoint === 'function'
        ) {
          try {
            const hit = document.elementFromPoint(e.clientX, e.clientY);
            const tile =
              hit && typeof hit.closest === 'function' ? hit.closest('.gd-sort-item') : null;
            if (tile && tile !== drag.el && tile.isConnected && !tile.contains(drag.el)) {
              tile.classList.add('gd-just-dropped');
              const clear = (ev) => {
                const target = ev && ev.target;
                if (target && typeof target === 'object' && tile.contains(target)) return;
                tile.classList.remove('gd-just-dropped');
                document.removeEventListener('pointerover', clear, true);
                document.removeEventListener('pointerdown', clear, true);
              };
              document.addEventListener('pointerover', clear, true);
              document.addEventListener('pointerdown', clear, true);
            }
          } catch {
            /* detached — nothing to hold */
          }
        }
        commitTimerRef.current = setTimeout(finishCommit, 160);
      };
    return {
      onPointerDown: (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        const hit = e.target?.closest?.(
          dragButtons ? '[data-no-sort], input, textarea, select' : '[data-no-sort], button, a, input, textarea, select'
        );
        if (hit && hit !== e.currentTarget) return; // interactive child (or opted-out) — not a grab
        if (dragRef.current || commitTimerRef.current) return; // a commit is still settling
        const el = e.currentTarget;
        // 0.45.0 — a fresh grab clears any RELEASE HOLD still riding this
        // item (see runCommit): the hold suppresses hover motions on the
        // just-dropped item, and a re-grab is exactly the pointer leaving.
        el.classList.remove('gd-just-dropped');
        const rect = el.getBoundingClientRect();
        const cellW = el.offsetWidth || rect.width || 52;
        const cellH = el.offsetHeight || rect.height || 52;
        dragRef.current = {
          from: i,
          to: i,
          startX: e.clientX,
          startY: e.clientY,
          lastX: e.clientX,
          lastY: e.clientY,
          el,
          baseRect: { left: rect.left, top: rect.top, w: rect.width, h: rect.height },
          strideX: cellW + gapX,
          strideY: cellH + gapY,
          moved: false,
          pointerId: e.pointerId,
        };
        // 0.41.0 — the container's grab-time box: the dragged item's ride is
        // CLAMPED inside it (plus a hair), so a chip dragged toward the
        // window's edge never pokes past the strip's border and gets sliced
        // by the modal's clip ("taking an extra column on the right clipping
        // through the window border"). Viewport-relative at grab time — if
        // the strip scrolls during the drag, both rects shift equally, so
        // the clamp stays honest. A DEGENERATE box (zero width/height — a
        // hidden container, or a DOM without layout like the test harness)
        // declines the clamp rather than pinning the chip at the origin.
        if (useGeometry && containerRef?.current && typeof containerRef.current.getBoundingClientRect === 'function') {
          const cr = containerRef.current.getBoundingClientRect();
          if (cr.width > 1 && cr.height > 1) dragRef.current.contRect = cr;
        }
        // 1.2.0 — the drag's scroller (see scrollerFor): discovered at grab
        // time so the edge auto-scroll knows what to pan.
        const sc = scrollerFor(containerRef?.current || el);
        dragRef.current.scroller = sc;
        // 1.2.6 — THE DRAG'S HONEST GEOMETRY, FROZEN AT GRAB: the scroller's
        // own end (scrollMax0 — before any chip overhang can inflate it, see
        // autoscrollTick) and the content-space clamp bounds for the drawn
        // chip (see the transform sites): the chip's box may never poke past
        // the content's own left/right ends in CONTENT space, however far
        // the pan runs — the constants below are pan-free by construction
        // (b.left was measured at scroll0), so the clamp keeps biting as
        // the 1.2.5 viewport bounds ride with the pan. A chip held past the
        // content's end now parks AT the end (the "limit it to the current
        // max container like usual" law) instead of towing infinite scroll
        // room behind the cursor.
        if (sc) {
          try {
            const sr = sc.getBoundingClientRect();
            dragRef.current.scrollMax0 = Math.max(0, sc.scrollWidth - sc.clientWidth);
            dragRef.current.scroll0 = sc.scrollLeft;
            dragRef.current.contentW = sc.scrollWidth;
            dragRef.current.srLeft = sr.left;
          } catch {
            /* a scroller without geometry (jsdom) keeps the old law */
          }
        }
        // 1.2.6 — THE CAPTURE IS BEST-EFFORT (the live ghost root-cause):
        // a grab whose pointer already died (a fast tap through a janky
        // frame, a press the OS turned into a window drag) THROWS here —
        // NotFoundError, no active pointer — and the unguarded call let
        // the exception unwind the WHOLE grab: the drag object lived in
        // the ref but the SAFETY NETS below never armed, so no release
        // the element missed ever landed, and EVERY later grab bounced
        // off the settling guard forever ("acts as if im holding a stamp
        // even if i let go" — measured live: the chip frozen at its
        // dragged transform through every later press). A failed capture
        // only means the OS owns the release now — exactly what the nets
        // exist for. The grab completes; the nets arm.
        try {
          el.setPointerCapture?.(e.pointerId);
        } catch {
          /* the pointer died before the grab — the safety nets own it */
        }
        // 1.2.6 — THE DRAG'S SAFETY NETS ("if i drag them outside of the
        // container sometimes it bugs out … and acts as if im holding a
        // stamp even if i let go"): a release the element never sees left
        // the drag ALIVE forever — the chip frozen mid-flight, the
        // neighbors held in their glided seats (the "third row" phantom:
        // the clamped chip parked below the zone's last row), and every
        // later grab bounced by the "a commit is still settling" guard.
        // THREE nets now catch the lost release:
        //   · lostpointercapture — Electron fires it when the native window
        //     drag (an app-region press) swallows the pointer; no pointerup
        //     ever follows.
        //   · window blur — the app lost focus mid-drag (alt-tab, a modal
        //     dialog): the button may come up outside our window entirely.
        //   · document-level pointerup/pointercancel (capture) — releases
        //     the element itself never saw (a detached node, capture that
        //     silently failed). The normal path is unchanged: the doc
        //     listener runs the SAME release the element handler would, and
        //     the settled flag makes every later visitor a no-op.
        // An interrupted drag snaps HOME (no commit) — the release seat was
        // never witnessed, so the reorder would be a guess.
        const pid = e.pointerId;
        const node = el;
        // the release/cancel closures of THIS grab — the safety nets below
        // and the element's own handlers speak the one path.
        dragRef.current.release = releaseAt;
        dragRef.current.cancel = cancelAt;
        const interrupt = () => {
          const d = dragRef.current;
          if (!d || d.pointerId !== pid || d.settled) return;
          d.cancel?.();
        };
        const onDocUp = (ev) => {
          const d = dragRef.current;
          if (!d || d.settled) return;
          if (ev.pointerId != null && d.pointerId != null && ev.pointerId !== d.pointerId) return;
          d.release?.(ev);
        };
        const onDocCancel = (ev) => {
          const d = dragRef.current;
          if (!d || d.settled) return;
          if (ev.pointerId != null && d.pointerId != null && ev.pointerId !== d.pointerId) return;
          d.cancel?.();
        };
        // 1.2.6 — THE DEAD-POINTER NET: a NEW mouse press while our drag
        // lives means our pointer ENDED without our ever seeing the
        // release (the capture died with it — see the best-effort law
        // above). The mouse law is one button: a second press can only be
        // the next press. The lost drag cancels HOME (no commit — the
        // release seat was never witnessed) and the stuck chip flies back
        // instead of ghosting through every later grab. Touch pointers
        // are exempt (a second finger is a second pointer, not our
        // pointer's death).
        const onDocDown = (ev) => {
          const d = dragRef.current;
          if (!d || d.settled) return;
          if (ev.pointerId != null && d.pointerId != null && ev.pointerId === d.pointerId) return;
          if (ev.pointerType && ev.pointerType !== 'mouse') return;
          d.cancel?.();
        };
        node.addEventListener('lostpointercapture', interrupt);
        window.addEventListener('blur', interrupt);
        document.addEventListener('pointerup', onDocUp, true);
        document.addEventListener('pointercancel', onDocCancel, true);
        document.addEventListener('pointerdown', onDocDown, true);
        dragRef.current.releaseSafety = () => {
          node.removeEventListener('lostpointercapture', interrupt);
          window.removeEventListener('blur', interrupt);
          document.removeEventListener('pointerup', onDocUp, true);
          document.removeEventListener('pointercancel', onDocCancel, true);
          document.removeEventListener('pointerdown', onDocDown, true);
        };
      },
      onPointerMove: (e) => {
        const drag = dragRef.current;
        if (!drag || drag.settled || drag.pointerId !== e.pointerId) return;
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        if (!drag.moved) {
          if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
          drag.moved = true;
          // 1.7.0 — a stale release class dies at the grab (a canceled drag
          // whose commit never ran must never mute the next carry's rise —
          // see .gd-sort-release in index.css).
          try { drag.el?.classList?.remove('gd-sort-release'); } catch { /* best-effort */ }
          // 1.2.8 — THE DRAG IS A FLIGHT (see armSortLive): from the first
          // honest move to the drag's end, the zones hold their measure.
          drag.sortLiveArmed = true;
          armSortLive(true);
          if (useGeometry) snapRef.current = snapshotRects(drag.el);
          // 1.3.5 — THE WALL CONTEXT RIDES THE FIRST MOVE (see
          // buildWallCtx's own note): the drag's very first target
          // computation — this same pointermove's later half — must already
          // speak the wall's lattice, or a single-move drag commits a
          // generic row-wrap verdict over the wall's rects.
          if (useGeometry) buildWallCtx();
          // 1.2.2 — the drag's ORIGIN seat: the grabbed chip's grab-time box,
          // kept apart from the snapshot (which the auto-scroll shifts as
          // the pan runs). The target math and the drawn transform both
          // read this seat plus the pointer delta plus the pan — the chip
          // and its drop target stay welded to the cursor.
          if (useGeometry && snapRef.current) {
            const o = snapRef.current[i];
            if (o) drag.originRect = { x: o.x, y: o.y, w: o.w, h: o.h };
          }
          // 1.5.4 — a fresh drag empties the glided-run register (see
          // itemStyle's note): the raised rungs belong to THIS drag's
          // flights alone.
          glidedRef.current = new Set();
          setSort({ from: drag.from, to: drag.from, dragging: true });
        }
        drag.lastX = e.clientX;
        drag.lastY = e.clientY;
        // The grabbed thumb follows the pointer directly — transform only,
        // GPU-composited, no React render in the loop. 0.41.0 — the ride is
        // clamped to the strip's own box (see onPointerDown): the pointer
        // can still travel anywhere (the drop gap reads the UNclamped math
        // below); only the drawn chip hugs the container's edge.
        // 1.2.2 — the accumulated auto-scroll pan rides the transform too:
        // a pan that ran while the pointer camped keeps the chip under the
        // cursor (without it, the next pointermove would snap the chip back
        // to the content's frame and "leave it behind" mid-drag).
        // 1.2.5 — THE CLAMP SPEAKS THE PAN-INCLUSIVE SEAT ("when i still
        // do the right or left auto scroll while holding a version … the
        // version would stay still and move back with the versions"): the
        // delta is pointer travel PLUS the accumulated pan, and the clamp
        // bounds shift by the SAME pan — the chip's natural seat rides the
        // content, so holding it under the cursor costs exactly the pan
        // (the old bounds sat frozen at the grab-time box and ate the
        // compensation every frame: one 4px wiggle mid-pan snapped the
        // chip back to its content seat, measured live painting 1190px
        // left of the cursor). Both callers — this handler and the
        // auto-scroll's own refresh — speak the one law.
        const pan = drag.scrollAccum || 0;
        let tdx = dx + pan;
        let tdy = dy;
        if (drag.contRect) {
          const b = drag.baseRect;
          const m = 2; // a hair of overhang — the scale(1.07) bloom eats it
          let minX = drag.contRect.left + m - b.left + pan;
          let maxX = drag.contRect.right - m - (b.left + b.w) + pan;
          // 1.2.6 — AND THE CONTENT'S OWN ENDS (the infinite-scroll kill,
          // see onPointerDown's frozen geometry): the 1.2.5 viewport bounds
          // ride with the pan, so a chip held at the edge could ride PAST
          // the content's true end — its transformed box extending the
          // scroller's overflow every frame (the measured 217 -> 3196 max).
          // The content bounds are pan-free constants; the chip parks at
          // the content's end and the pan dies at the frozen max.
          if (Number.isFinite(drag.srLeft) && Number.isFinite(drag.scroll0)) {
            const cMin = drag.srLeft - drag.scroll0 - b.left + m;
            const cMax = drag.srLeft - drag.scroll0 + (drag.contentW || 0) - m - (b.left + b.w);
            if (Number.isFinite(cMin)) minX = Math.max(minX, cMin);
            if (Number.isFinite(cMax) && (drag.contentW || 0) > 0) maxX = Math.min(maxX, cMax);
          }
          const minY = drag.contRect.top + m - b.top;
          const maxY = drag.contRect.bottom - m - (b.top + b.h);
          tdx = Math.max(minX, Math.min(maxX, tdx));
          tdy = Math.max(minY, Math.min(maxY, tdy));
        }
        drag.el.style.transform = `translate(${tdx}px, ${tdy}px) scale(1.07)`;
        // Target: the shared law (geometry picks the nearest INSERTION GAP
        // and converts it to the dragged item's FINAL index; stride mode
        // uses the strides). 1.2.0 — the same function the auto-scroll loop
        // retargets through, so the two callers can never disagree.
        const to = targetFrom(drag, e.clientX, e.clientY);
        if (to !== drag.to) {
          drag.to = to;
          setSort({ from: drag.from, to, dragging: true }); // neighbors re-glide
        }
        // 1.2.0 — THE EDGE AUTO-SCROLL: camping near the scroller's edge
        // pans the strip and retargets the glide as new chips roll in.
        maybeAutoscroll(drag);
      },
      onPointerUp: releaseAt,
      onPointerCancel: cancelAt,
    };
    },

    [count, cols, gapX, gapY, clampIndex, finalIndexFor, deltaSlots]
  );

  // Safety: never leave a half-settled drag behind on unmount.
  useEffect(
    () => () => {
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
      settleContRef.current?.classList?.remove?.('gd-settle');
      // 1.4.8 — the glide-home guard leaves with its engine too.
      if (glideHomeTimerRef.current) clearTimeout(glideHomeTimerRef.current);
      glideHomeContRef.current?.classList?.remove?.('gd-glide-home');
      // 1.2.8 — a drag alive at unmount must not strand the sort-live
      // signal (the class would hold every zone's measure hostage).
      const drag = dragRef.current;
      if (drag && drag.sortLiveArmed) {
        drag.sortLiveArmed = false;
        armSortLive(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return { sort, bindItem, itemStyle, dragStyle, sorting: !!sort?.dragging };
}
