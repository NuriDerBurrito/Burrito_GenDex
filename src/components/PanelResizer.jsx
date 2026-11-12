import { useRef, useState } from 'react';
import clsx from 'clsx';

// 0.29.0 — THE PANEL EDGE RESIZER ("allow me to resize the left and right
// panels by dragging on their edge, cursor should be the left and right
// arrow line when im hovering over the edge"). One component, two mounts:
// the LEFT tree's right edge and the RIGHT panel's left edge.
//
//   · The handle is a 9px strip centered ON the column's inner border —
//     `cursor: ew-resize` is exactly the left-right arrow line, and it
//     brightens on hover so the edge reads as grabbable.
//   · The drag writes the width STRAIGHT to the column element (no React
//     re-render per frame — same zero-lag trick as the thumb sort). The
//     pointer is captured, so the drag survives leaving the handle; a
//     body-level class pins the ew-resize cursor and kills text selection
//     for the whole ride.
//   · On release the FINAL width commits through setSetting — the widths
//     live in db.settings (sidebarWidth / panelWidth), so the Settings
//     sliders and undo/redo replay the exact same keys.
//
// side 'left'  — the handle sits on the column's RIGHT border; dragging
//                right widens (width + dx).
// side 'right' — the handle sits on the column's LEFT border; dragging
//                left widens (width − dx).
export default function PanelResizer({ side, targetRef, contentRef = null, width, min, max, onCommit, title }) {
  const dragRef = useRef(null);
  const [live, setLive] = useState(false);

  const onPointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const col = targetRef?.current;
    if (!col) return;
    // The drag anchors on the REACT-APPLIED width (the setting's clamped
    // value) rather than a live measurement — mid-transition widths never
    // poison the math, and no layout engine is required.
    const startW = Math.round(Number(width) || min);
    dragRef.current = { startX: e.clientX, startW, pointerId: e.pointerId, w: startW };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    document.body.classList.add('gd-resizing');
    setLive(true);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const raw = side === 'left' ? drag.startW + dx : drag.startW - dx;
    // The live window clamp keeps a panel from eating the whole app: the
    // OTHER panels' minimums always stay satisfiable.
    const vw = (typeof window !== 'undefined' && window.innerWidth) || 1280;
    const ceiling = side === 'left' ? vw - 520 : vw - 300;
    const w = Math.round(Math.max(min, Math.min(max, Math.min(ceiling, raw))));
    drag.w = w;
    // Zero-lag: the width goes straight to the column node.
    targetRef.current.style.width = `${w}px`;
    // 1.0.4 — LIVE CONTENT ("when resizing the side panels, ensure that the
    // panel updates, since currently it only updates after i let go"): the
    // right panel's scroll wrapper keeps its own fixed width (the curtain
    // law — content must not reflow mid-flight while the panel's OPEN
    // animation runs), so a drag would resize the column while the content
    // sat frozen at the old width until release. The resizer now drives
    // BOTH nodes live: the column AND the fixed-width content wrapper —
    // during a drag the reflow is user-driven (every frame is the user's
    // own hand), which is exactly what "updates as I drag" asks for.
    if (contentRef?.current) contentRef.current.style.width = `${w}px`;
  };

  const endDrag = (e) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    document.body.classList.remove('gd-resizing');
    setLive(false);
    if (drag.w != null && Math.round(drag.w) !== Math.round(drag.startW)) {
      onCommit?.(Math.round(drag.w));
    } else {
      // Nothing to commit — put the column back to its React-applied width.
      targetRef.current.style.width = `${Math.round(drag.startW)}px`;
      if (contentRef?.current) contentRef.current.style.width = `${Math.round(drag.startW)}px`;
    }
  };

  return (
    <div
      className={clsx('gd-panel-resize', live && 'is-live')}
      data-side={side}
      role="separator"
      aria-orientation="vertical"
      title={title}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    />
  );
}
