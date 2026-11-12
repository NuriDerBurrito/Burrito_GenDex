import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';

// GenStack law: the status text scrolls only when it actually overflows its
// box, with duration derived from the overflow distance.
// 1.1.1 — TWO LAWS WIDENED ("by the offchance if it gets too long, allow it
// to scroll left and right, ONLY IF THE TEXT IS BEING COVERED"):
//
//   · THE SEAT: the outer box is no longer a fixed 280px cap — it rides the
//     titlebar row's LEFTOVER SPACE (flex-1, min-w-0, still bounded by a
//     sane max). A long status that FITS between the history group and the
//     right cluster now simply reads, unclipped and unmoving; the text is
//     only "covered" when the row genuinely has no room for it — and only
//     then does anything scroll.
//   · THE FLIGHT: the marquee alternates direction (see gd-marquee in
//     index.css — a left run, a dwell, a right run home, a dwell) so BOTH
//     ends of a covered status become readable instead of the tail only
//     ever passing by on its way out.
//
// The measurement re-runs on text change AND on the box's own resize (the
// row's leftover space moves with the window and the cluster), through the
// same ResizeObserver law the card name's fold uses.
//
// 1.2.6 — THE READ OWNS THE CLOCK (App's status block): the marquee's
// keyframes travel from 0% to -dist between the 12% and 88% marks of its
// duration — reaching the END of the message costs ~0.88 of one `dur`, and
// the transient hold that used to cut a long read at a flat 2500ms now
// waits for it. onFlight reports the READ time (the travel + a dwell) for
// every armed marquee; onHold freezes the countdown while the pointer
// rests on the line; onSkip ends the verdict at once on a press.
//
// 1.2.7 — THE STRIP DRAGS THE WINDOW ("when i hover over the top toolbar
// (where text status is) and i drag around i cant drag the window, it also
// changes the cursor gesture, fix that"): the strip is a no-drag hole in
// the titlebar's drag region — a press there never reached the OS, and the
// pointer cursor read as a gesture change. The press now speaks TWO
// languages through ONE threshold: a press that MOVES past 4px hands the
// window to the main process (a cursor-follow move loop — the same drag
// the OS titlebar speaks, driven from our own strip), and a press that
// stays put is still the "read it" skip. The cursor never changes gesture
// (the pointer cursor is retired — the strip is a handle, not a key), and
// the pill tooltip still fades the moment anything is pressed (the 1.2.6
// press law), so the drag starts on a clean bar.
export default function StatusText({ text, onFlight = null, onHold = null, onSkip = null }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [anim, setAnim] = useState(null);
  const lastFlightRef = useRef(0);
  // 1.2.7 — the manual-drag press: { x, y, moved, pid } while a press lives.
  const pressRef = useRef(null);

  const measure = () => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (outer && inner) {
      const overflow = inner.scrollWidth - outer.clientWidth;
      if (overflow > 8) {
        const dist = overflow + 28;
        setAnim((prev) =>
          prev && prev.dist === dist ? prev : { dist, dur: Math.max(4, dist / 28) }
        );
        // 1.2.6 — the READ time: the travel to the message's end (88% of
        // the one-way run) plus the end dwell (12%) — the whole first leg.
        const flightMs = Math.round(Math.max(4, dist / 28) * 1000);
        if (flightMs !== lastFlightRef.current) {
          lastFlightRef.current = flightMs;
          onFlight?.(flightMs);
        }
        return;
      }
    }
    setAnim(null);
    if (lastFlightRef.current !== 0) {
      lastFlightRef.current = 0;
      onFlight?.(0);
    }
  };

  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => measure());
    ro.observe(outer);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1.2.6 — the hover freeze + the press skip (see App's status block).
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer || !onHold) return undefined;
    const enter = () => onHold(true);
    const leave = () => onHold(false);
    outer.addEventListener('mouseenter', enter);
    outer.addEventListener('mouseleave', leave);
    return () => {
      outer.removeEventListener('mouseenter', enter);
      outer.removeEventListener('mouseleave', leave);
    };
  }, [onHold]);

  // 1.2.7 — the manual window drag (see the file's head note): a press that
  // travels past the threshold asks the main process to move the window
  // with the screen cursor; any end (release, cancel, a lost pointer, a
  // blurred window) closes the move. A press that never traveled is the
  // classic skip.
  const endPress = (skip) => {
    const p = pressRef.current;
    pressRef.current = null;
    if (!p) return;
    if (p.moved) {
      try {
        window.api?.manualWindowDrag?.('end');
      } catch {
        /* the window owns itself again either way */
      }
      return;
    }
    if (skip) onSkip?.();
  };

  useEffect(() => {
    const onBlur = () => endPress(false);
    if (typeof window !== 'undefined') window.addEventListener('blur', onBlur);
    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('blur', onBlur);
      // an unmount mid-press must never leave the move loop running
      if (pressRef.current?.moved) {
        try {
          window.api?.manualWindowDrag?.('end');
        } catch {
          /* gone is gone */
        }
      }
      pressRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={outerRef}
      className="flex-1 min-w-0 max-w-[560px] overflow-hidden ml-3 no-drag"
      title={text}
      style={{ userSelect: 'none', touchAction: 'none' }}
      onPointerDown={(e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        pressRef.current = { x: e.clientX, y: e.clientY, moved: false, pid: e.pointerId };
        try {
          e.currentTarget.setPointerCapture?.(e.pointerId);
        } catch {
          /* the press still speaks through the document's own events */
        }
      }}
      onPointerMove={(e) => {
        const p = pressRef.current;
        if (!p || p.pid !== e.pointerId) return;
        if (!p.moved) {
          const dx = e.clientX - p.x;
          const dy = e.clientY - p.y;
          if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
          p.moved = true;
          try {
            window.api?.manualWindowDrag?.('begin');
          } catch {
            /* no bridge (tests) — the press stays a plain press */
          }
        }
      }}
      onPointerUp={(e) => {
        if (pressRef.current && pressRef.current.pid !== e.pointerId) return;
        endPress(true);
      }}
      onPointerCancel={() => endPress(false)}
      onLostPointerCapture={() => endPress(false)}
    >
      <span
        ref={innerRef}
        className={clsx(
          'block whitespace-nowrap text-[11px] tracking-[0.08em] text-gd-mute',
          anim && 'gd-marquee'
        )}
        style={
          anim
            ? { '--marquee-dist': `-${anim.dist}px`, '--marquee-dur': `${anim.dur}s` }
            : undefined
        }
      >
        {text}
      </span>
    </div>
  );
}
