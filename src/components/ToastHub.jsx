import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { TOAST_EVENT } from '../utils/toasts.js';

// 0.35.0 — THE GLOBAL FEEDBACK LAYER, part two: the HUB. One instance
// mounts at App's root and listens for gd-toast events (fired by
// gdToast() in utils/toasts.js — setStatusTransient now routes every
// action verdict through it: class created, card created, deleted, saved,
// AUTO-SAVED, pasted, copied…). The pills paint in a fixed stack at the
// TOP CENTER of the screen — the exact seat the 0.34.0 paste verdict
// pill made its own ("the feedback should be on top just so incase the
// window is scrolled down or its too high to see") — but the stack rides
// at z-1100, ABOVE EVERY LAYER the app has: windows (200), dropdowns
// (310), the titlebar (400), the old pill tier (500), even the tooltip
// sheet (1000). So the verdict reads no matter WHAT is open — the whole
// point of "visible even when in other windows": the titlebar's status
// text is dimmed and inert behind the 0.34.0 lockout, but the toast
// floats over the locked bar itself.
//
// House laws this component keeps:
//   · LAZY PORTAL — the portal target mounts only after the FIRST toast
//     (a layout-effect-set flag): a server-render pass (renderToString
//     in the test harness) never touches createPortal, and the body
//     carries no empty layer until a verdict actually needs one. Same
//     pattern the 0.34.0 pill used.
//   · CAPPED STACK — at most 3 pills at once; a fourth drops the OLDEST,
//     so a burst of verdicts (paste + save + reorder) can never build a
//     column that eats the screen.
//   · SELF-DECAYING — each pill fades out on its own after ~2.4s; the
//     layer itself is pointer-events: none (the stack's empty air never
//     blocks a click), while the PILLS take the pointer so a verdict can
//     be held under the cursor (see HOVER HOLD below).
//   · MOTION-SAFE — the enter/exit rides framer-motion, so the app-wide
//     reduce-motion switch (MotionConfig skipAnimations, 0.34.0) makes
//     the pills pop instantly instead of sliding, like everything else.
//
// 1.1.9 — TWO NEW LAWS:
//   · THE STACK NEVER GROWS PAST ITS CAP ("when alot of noticifcations
//     appears, more than 3 specifically, dont keep stepping down, right
//     now it steps down infinitely then it snaps to the top"): the cap
//     always held the ARRAY, but AnimatePresence kept every dropped pill
//     mounted through its exit — in flow, holding layout room — so a
//     burst stacked live pills UNDER a queue of dying ones and the whole
//     column marched down the screen until the exits finished and it
//     snapped back. The exit rides popLayout now (the dying pill pops
//     absolute, fades in place, takes no room) and every pill carries
//     `layout`, so the survivors glide — the stack's footprint is three
//     pills at the top, always, whatever the burst.
//   · THE HOVER HOLD ("the top notifications if a cursor hovers over it
//     should not fade until the cursor hovers away"): a pill under the
//     cursor holds — its decay timer is cleared on enter and restarts
//     (full life, a fresh read) the moment the cursor leaves it.
const TOAST_LIFE_MS = 2400;
const TOAST_STACK_CAP = 3;

export default function ToastHub() {
  const [toasts, setToasts] = useState([]); // [{ id, text, kind }] — newest FIRST
  const [live, setLive] = useState(false); // portal mounts on the first toast
  const timersRef = useRef(new Map()); // id -> pending decay timer, for pause + cleanup

  useEffect(() => {
    const armDecay = (id, ms = TOAST_LIFE_MS) => {
      const t = setTimeout(() => {
        timersRef.current.delete(id);
        setToasts((list) => list.filter((x) => x.id !== id));
      }, ms);
      timersRef.current.set(id, t);
    };
    const onToast = (e) => {
      const { id, text, kind } = e.detail || {};
      if (text == null || text === '') return;
      setLive(true);
      // newest FIRST at the top of the stack (the entry seat never
      // descends); the cap drops the OLDEST from the tail.
      setToasts((list) => [ { id, text, kind: kind || 'ok' }, ...list ].slice(0, TOAST_STACK_CAP));
      armDecay(id);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      for (const t of timersRef.current.values()) clearTimeout(t);
      timersRef.current.clear();
    };
  }, []);

  // THE HOVER HOLD: entering clears the pill's own timer; leaving arms a
  // fresh full life so the verdict only fades once the cursor is done
  // with it.
  const holdToast = (id) => {
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
  };
  const releaseToast = (id) => {
    if (timersRef.current.has(id)) return; // already re-armed or gone
    const t = setTimeout(() => {
      timersRef.current.delete(id);
      setToasts((list) => list.filter((x) => x.id !== id));
    }, TOAST_LIFE_MS);
    timersRef.current.set(id, t);
  };

  // 1.2.0 — THE PRESS DISMISSES ("when hovering over a noticification,
  // pressing on it should not press on whats behind it, instead it should
  // close the noticification that im pressing on with a fadeout like
  // usual, a way to close it right away"): a click on a pill closes THAT
  // pill immediately through the same exit fade it always wears. The press
  // is stopped on the pill itself (pointerdown included), so nothing
  // behind it — a key the document-level listeners might answer, a
  // selection, a menu-outside click — ever receives it.
  const dismissToast = (id) => {
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
    setToasts((list) => list.filter((x) => x.id !== id));
  };
  const swallow = (e) => {
    e.stopPropagation();
    if (typeof e.preventDefault === 'function' && e.type !== 'pointerdown') e.preventDefault();
  };
  // 1.2.2 — THE PRESS SEAT ("when pressing on it as it closes give
  // feedback"): the pressed pill takes its is-pressed look the instant the
  // pointer lands (before the click even dismisses), and the class rides
  // the element through its exit fade — the closing pill visibly answers
  // the press. A decay-driven exit keeps its plain fade.
  const pressToast = (e) => {
    swallow(e);
    const el = e.currentTarget;
    if (el && typeof el.classList !== 'undefined') el.classList.add('is-pressed');
  };

  // Nothing to paint until the first verdict — and never anything on the
  // server-render path (the flag only flips inside the event handler).
  if (!live || typeof document === 'undefined' || !document.body) return null;

  return createPortal(
    <div className="gd-toast-stack" aria-live="polite">
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            className={clsx('gd-toast', t.kind === 'fail' && 'is-fail', t.kind === 'info' && 'is-info')}
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            onMouseEnter={() => holdToast(t.id)}
            onMouseLeave={() => releaseToast(t.id)}
            onPointerDown={pressToast}
            onMouseDown={swallow}
            onClick={(e) => {
              swallow(e);
              dismissToast(t.id);
            }}
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}
