import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Pipette, RotateCcw } from 'lucide-react';
import Popover from './Popover.jsx';
import { hexToHsv, hsvToHex, normalizeHexInput } from '../utils/helpers.js';

// ---------------------------------------------------------------------------
// 0.24.0 — THE IN-APP COLOR PICKER. Replaces every native <input type="color">
// in the app (the stamp color window, the tag manager, the chip colors, the
// settings manual colors): the native wheel reads foreign to the app's design
// and its laggy onChange made dragging feel broken. This one is drawn from the
// app's own design system and driven by POINTER EVENTS with setPointerCapture
// — every pointermove paints immediately, zero lag.
//
//   · ColorPickerPanel — the panel itself: a saturation/value field, a hue
//     rail, a HEX field (the tag manager's hex area, everywhere now), and an
//     optional TRANSPARENCY slider row (the stamp hue's window uses it).
//   · ColorPickerButton — a small swatch that opens the panel in the portal
//     Popover (never clipped, closes on outside click). Two looks: the dashed
//     pipette box (the old "custom swatch" slot among the presets) and a
//     plain filled swatch (settings rows).
//
// The panel keeps its own HSV state while you drag, so the parent's data
// writes never fight the gesture; it re-syncs whenever the incoming color
// changes to something other than what the panel last emitted.
// ---------------------------------------------------------------------------

const HUE_RAIL = 'linear-gradient(to right, #f00, #ff0, #0f0, #0df, #00f, #f0f, #f00)';

/* 1.9.8 — THE WHEEL KEEPS ITS HUE ("when pulling the color wheel from
   black to white it resets the color to red hue even if i was on some
   other color like blue or purple etc"): the hex the picker stores is
   the whole truth a gray can speak — #808080 carries no hue, and
   hexToHsv answers h: 0 (RED) for every achromatic value. The panel
   kept its own hue through a gesture, but every MOUNT (a popover
   reopened, a window re-seeded) re-derived the state from the stored
   hex — so a drag that passed through black or white landed the rail
   at red, and the next step right out of the achromatic column spoke
   red tints instead of the blue or purple the owner was on. The wheel
   now carries a hue MEMORY: one module-level seat every panel in the
   app shares (the OS pickers' own law — the hue you last spoke is the
   hue you still speak, even over a gray), written by every chromatic
   color the panels see (incoming or emitted) and by every turn of the
   hue rail itself; a colorless incoming (saturation under 2% — the
   black↔white column, the grays, the pure whites) keeps the remembered
   hue instead of resetting to red. The SV field's own tint (hueBase)
   and the rail's dot read the same remembered hue, so dragging out of
   white returns to exactly the hue the owner left. */
const wheelHueMemory = { h: null };
const HUE_KEEP_SAT = 0.02; // under 2% saturation the plate speaks no hue
const seedHsv = (hex) => {
  const parsed = hexToHsv(hex);
  if (!parsed) return { h: wheelHueMemory.h ?? 0, s: 1, v: 1 };
  if (parsed.s >= HUE_KEEP_SAT) {
    wheelHueMemory.h = parsed.h;
    return parsed;
  }
  // achromatic — the hue is not in the hex; the wheel remembers it
  return { ...parsed, h: wheelHueMemory.h ?? parsed.h };
};

function useFieldDrag(onPick) {
  // One shared pointer gesture for the SV field and the hue rail: press,
  // capture, and every move reports its fraction position (0..1, 0..1).
  const ref = useRef(null);
  const draggingRef = useRef(false);
  const emit = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (!r || r.width <= 0 || r.height <= 0) return;
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      onPick?.(x, y);
    },
    [onPick]
  );
  return {
    ref,
    onPointerDown: (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      draggingRef.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      emit(e);
    },
    onPointerMove: (e) => {
      if (!draggingRef.current) return;
      emit(e);
    },
    onPointerUp: (e) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    },
    onPointerCancel: () => {
      draggingRef.current = false;
    },
  };
}

// The panel — inline; the host decides where it lives (a popover or a window).
export function ColorPickerPanel({
  color,
  onColor,
  // 1.1.2 — THE COMMIT LANE ("its still laggy when i use a colorpicker on
  // the manual colors in the settings look section"): hosts that can
  // preview a color CHEAPLY (write CSS vars directly, no state, no render)
  // pass onColor as the PREVIEW lane and onCommit as the DB lane — the
  // gesture rides the preview at the governor's cadence and the pointer's
  // release lands ONE commit (the gesture's last word, flushed first).
  // Hosts without a cheap lane leave onCommit unset and nothing changes:
  // onColor stays the whole story, exactly as before.
  onCommit = null,
  // 1.6.3 — THE RESET LANE ("make it so when its pressed it would remove
  // hue color as if not set , and change the icon from eyedropper to reset
  // or something ofc"): the hex area's old side key was a PIPETTE that
  // painted the CLASSIC ACCENT RED on every press ("reset to red") — in
  // the hue's own window that read as "the eyedrop makes it red" and
  // walked the hue AWAY from its white default instead of back to it.
  // Hosts that can UNSET their color pass `onReset` (null = "not set",
  // whatever that seat's default is) and the key becomes a RESET: the
  // RotateCcw glyph, a title that says what leaving actually does, and a
  // press that removes the custom color outright. Hosts without a
  // meaningful "unset" (none today — every seat below threads it) would
  // simply not render the key.
  onReset = null,
  alpha = null,
  onAlpha = null,
  alphaLabel = 'TRANSPARENCY',
  alphaRange = { min: 0, max: 1 },
  alphaStep = 0.02,
  compact = false,
}) {
  const incoming = normalizeHexInput(color) || '#c8402f';
  /* 1.9.9 — THE GESTURE OWNS THE WHEEL ("when moving the color picker
     left and right sometimes it would change the color slightly as the
     bottom bar that shows all colors vibrates left and right and starts
     shifting, aka instead of being on green it shifts to yellow even if
     im changing the saturation etc"): the panel's hsv state lived in
     React alone, and the re-sync effect below re-derived it from the
     INCOMING hex whenever `incoming !== lastEmitted` — a race the drag
     governor itself could write: the governor sets lastEmitted the
     instant a move lands, but the parent's echo (the re-render that
     carries the emitted hex back as the `color` prop) follows at React's
     own cadence, and on a heavy window (a live card preview re-rendering
     under the picker) the echo of an OLDER emission could arrive after
     the panel had already emitted a newer one — `incoming` (stale) ≠
     lastEmitted (fresh) → the effect re-seeded the whole hsv from the
     STALE hex → the dot snapped back, the next move snapped it forward,
     and the rail's thumb visibly VIBRATED. Worse: every re-seed
     recomputed the HUE from the hex's quantized RGB — at low saturation
     a one-unit channel rounding moves the hue by whole degrees, so each
     stale re-seed DRIFTED the hue (green → yellow) and the next emission
     carried the drift away, permanently. Two laws retire the race:
     · THE MIRROR — hsvRef rides beside the state as the gesture's own
       book (the field handlers read it instead of the closure's `prev`,
       and no side effect ever lives inside a state updater);
     · THE FENCE — while a pointer holds either field the re-sync effect
       does NOTHING: the panel is the wheel's only truth through the
       gesture, exactly like the OS pickers. After the release the guard
       below still re-seeds on any GENUINE external change (a preset, a
       typed hex, another window's pick) — and it compares the normalized
       forms, so a parent that echoes the same color in a different
       dress (case, shorthand) never re-seeds at all. */
  const hsvRef = useRef(null);
  if (hsvRef.current == null) hsvRef.current = seedHsv(incoming);
  const [hsv, setHsv] = useState(hsvRef.current);
  const gestureRef = useRef(false);
  const [hexDraft, setHexDraft] = useState(null); // while the hex field is focused
  const lastEmitted = useRef(incoming);

  // Re-sync only when the incoming color is NOT what we last emitted — a
  // parent re-render passing our own value back must never reset the
  // gesture. 1.9.8 — and the re-seed speaks the hue memory: an achromatic
  // incoming (the black↔white column's own hex) keeps the wheel's
  // remembered hue instead of resetting the rail to red.
  // 1.9.9 — and NEVER while a gesture holds the wheel (see the note
  // above): a stale echo mid-drag is the governor's own timing, not a
  // real external change, and re-seeding to it was the vibration's
  // whole disease.
  useEffect(() => {
    if (gestureRef.current) return;
    const mine = normalizeHexInput(lastEmitted.current) || lastEmitted.current;
    if (incoming !== mine) {
      lastEmitted.current = incoming;
      const seeded = seedHsv(incoming);
      hsvRef.current = seeded;
      setHsv(seeded);
    }
  }, [incoming]);

  // 1.9.8 — every chromatic state the panel holds writes the wheel's hue
  // memory (the drag through the pastels, a preset swatch, a typed hex —
  // the hue the owner last spoke is the hue the wheel keeps).
  useEffect(() => {
    if (hsv.s >= HUE_KEEP_SAT) wheelHueMemory.h = hsv.h;
  }, [hsv.h, hsv.s]);

  const emit = useCallback(
    (next) => {
      lastEmitted.current = next;
      onColor?.(next);
    },
    [onColor]
  );

  // 1.1.1 — THE DRAG GOVERNOR ("fix the lag coming from the color picker
  // when i change color values in the settings"): the SV field and the hue
  // rail emitted EVERY pointermove — and each emission ran the full
  // downstream pipeline (a settings write, a React pass over the app, a
  // theme apply) for a color the eye would never see as its own frame. The
  // gesture now reports at most once per ~40ms, and always the LATEST color
  // (a scheduled report supersedes the one it delays) — the panel's own dot
  // still tracks the pointer at full frame rate (that's local state), while
  // the world beyond the panel catches up on the pause. Typing in the hex
  // field and pressing the reset key stay immediate: discrete commits,
  // never gestures.
  const emitAtMostEveryMs = 40;
  const lastEmitTsRef = useRef(0);
  const emitRafRef = useRef(0);
  const emitRafIsTimerRef = useRef(false);
  const pendingEmitRef = useRef(null);
  // the gesture's LAST word always lands: pointer-up (or cancel) flushes
  // whatever report the governor still holds — the parent can never end a
  // drag holding the second-to-last color while the panel shows the final
  // one. (A frame handle and a timer handle are both cleared by the lane
  // that made them.)
  const clearScheduled = () => {
    if (!emitRafRef.current) return;
    if (emitRafIsTimerRef.current) clearTimeout(emitRafRef.current);
    else if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(emitRafRef.current);
    emitRafRef.current = 0;
    emitRafIsTimerRef.current = false;
  };
  const flushPending = () => {
    clearScheduled();
    const pending = pendingEmitRef.current;
    pendingEmitRef.current = null;
    if (pending == null) return;
    lastEmitTsRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
    onColor?.(pending);
  };
  useEffect(
    () => () => {
      clearScheduled();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const emitGoverned = useCallback(
    (next) => {
      lastEmitted.current = next;
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (now - lastEmitTsRef.current >= emitAtMostEveryMs) {
        lastEmitTsRef.current = now;
        pendingEmitRef.current = null;
        onColor?.(next);
        return;
      }
      pendingEmitRef.current = next;
      if (emitRafRef.current) return;
      // jsdom (the test DOM) has no frame clock — fall back to the timer
      // lane there, so the governor's law still holds in tests.
      if (typeof requestAnimationFrame !== 'function') {
        emitRafIsTimerRef.current = true;
        emitRafRef.current = setTimeout(() => {
          emitRafRef.current = 0;
          emitRafIsTimerRef.current = false;
          const pending = pendingEmitRef.current;
          pendingEmitRef.current = null;
          if (pending == null) return;
          lastEmitTsRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
          onColor?.(pending);
        }, emitAtMostEveryMs);
        return;
      }
      emitRafIsTimerRef.current = false;
      emitRafRef.current = requestAnimationFrame(() => {
        emitRafRef.current = 0;
        const pending = pendingEmitRef.current;
        pendingEmitRef.current = null;
        if (pending == null) return;
        lastEmitTsRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
        onColor?.(pending);
      });
    },
    [onColor]
  );

  // 1.9.9 — THE MIRROR'S OWN APPLY: one voice writes the ref and the
  // state together, so the field handlers below never read a stale
  // closure and no emission ever rides inside a state updater (React
  // may re-run updaters; the gesture's word must land exactly once).
  const applyHsv = useCallback((next) => {
    hsvRef.current = next;
    setHsv(next);
  }, []);

  const svField = useFieldDrag((x, y) => {
    const next = {
      ...hsvRef.current,
      s: Math.round(x * 1000) / 1000,
      v: Math.round((1 - y) * 1000) / 1000,
    };
    applyHsv(next);
    emitGoverned(hsvToHex(next.h, next.s, next.v));
  });
  const hueRail = useFieldDrag((x) => {
    const next = { ...hsvRef.current, h: Math.round(x * 3600) / 10 };
    // 1.9.8 — a turn of the rail is a chromatic statement even while the
    // dot sits in the achromatic column: the memory takes the hue now,
    // so the drag out of white speaks the hue the rail names.
    wheelHueMemory.h = next.h;
    applyHsv(next);
    emitGoverned(hsvToHex(next.h, next.s, next.v));
  });
  /* 1.9.9 — THE FENCE ITSELF: pointerdown arms it on either field,
  pointerup / pointercancel / a lost capture retire it. While it holds,
  the re-sync effect above stays silent — see its own note. */
  const fenced = (handlers) => ({
    ...handlers,
    onPointerDown: (e) => {
      gestureRef.current = true;
      handlers.onPointerDown?.(e);
    },
    onPointerUp: (e) => {
      gestureRef.current = false;
      handlers.onPointerUp?.(e);
    },
    onPointerCancel: (e) => {
      gestureRef.current = false;
      handlers.onPointerCancel?.(e);
    },
    onLostPointerCapture: () => {
      gestureRef.current = false;
    },
  });
  // the flush rides the gesture's own end — the panel's handlers stay the
  // source of truth, the wrapper only adds the last word.
  // 1.1.2 — and the COMMIT follows the flush: the preview lane paints the
  // whole drag; the release is the one moment the db should hear about it.
  const flushed = (handlers) => ({
    ...handlers,
    onPointerUp: (e) => {
      handlers.onPointerUp?.(e);
      flushPending();
      onCommit?.(lastEmitted.current);
    },
    onPointerCancel: (e) => {
      handlers.onPointerCancel?.(e);
      flushPending();
      onCommit?.(lastEmitted.current);
    },
  });
  const svFieldFlushed = flushed(fenced(svField));
  const hueRailFlushed = flushed(fenced(hueRail));

  const hexValue = hexDraft != null ? hexDraft : incoming;
  const hueBase = useMemo(() => hsvToHex(hsv.h, 1, 1), [hsv.h]);
  // a DISCRETE commit (hex typed, reset key, preset swatch) is its own
  // last word: the value emits for the preview AND commits in one beat.
  const emitAndCommit = (hex) => {
    emit(hex);
    onCommit?.(hex);
  };
  const commitHex = () => {
    const clean = normalizeHexInput(hexDraft);
    if (clean) emitAndCommit(clean);
    setHexDraft(null);
  };

  return (
    <div className={clsx('gd-cp', compact && 'gd-cp-compact')}>
      {/* The saturation / value field — hue at full strength underneath,
          white washing in from the left, black rising from the bottom. */}
      <div
        className="gd-cp-sv"
        {...svFieldFlushed}
        title="Saturation and brightness: drag to pick the shade"
        style={{
          background: `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0)), ${hueBase}`,
        }}
      >
        <span
          className="gd-cp-dot"
          aria-hidden
          style={{ left: `${Math.round(hsv.s * 100)}%`, top: `${Math.round((1 - hsv.v) * 100)}%` }}
        />
      </div>

      {/* The hue rail — one full turn of the wheel, always the same gradient. */}
      <div className="gd-cp-hue" {...hueRailFlushed} title="Hue: drag to turn the color wheel" style={{ background: HUE_RAIL }}>
        <span
          className="gd-cp-hue-dot"
          aria-hidden
          style={{ left: `${Math.round(((hsv.h % 360) + 360) % 360 / 3.6)}%` }}
        />
      </div>

      {/* The hex area — the tag manager's, now in every picker. */}
      <div className="gd-cp-hex">
        <span className="gd-cp-hex-swatch" style={{ background: incoming }} aria-hidden />
        <input
          className="gd-input gd-cp-hex-input"
          value={hexValue}
          title="Hex color: type #rrggbb and press Enter"
          placeholder="#rrggbb"
          spellCheck={false}
          onChange={(e) => setHexDraft(e.target.value)}
          onBlur={commitHex}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitHex();
              e.currentTarget.blur();
            }
          }}
        />
        <button
          type="button"
          className="gd-btn !px-2 !py-0.5"
          title={
            onReset
              ? 'Remove the custom color — return to the default'
              : 'Reset to the classic accent red'
          }
          onClick={() => (onReset ? onReset() : emitAndCommit('#c8402f'))}
        >
          {/* 1.6.3 — the eyedropper is RETIRED from the hex area (it never
              picked anything): the reset speaks its own glyph wherever a
              reset exists. */}
          {onReset ? <RotateCcw size={11} /> : <Pipette size={11} />}
        </button>
      </div>

      {/* The optional transparency row (the stamp hue's own strength). */}
      {onAlpha && alpha != null && (
        <div className="gd-cp-alpha">
          <span className="gd-cp-alpha-label">{alphaLabel}</span>
          <input
            type="range"
            className="gd-range"
            min={alphaRange.min}
            max={alphaRange.max}
            step={alphaStep}
            value={alpha}
            title={`${alphaLabel.toLowerCase()}: ${Math.round(alpha * 100)}%`}
            onChange={(e) => onAlpha(Number(e.target.value))}
          />
          <span className="gd-cp-alpha-val">{Math.round(alpha * 100)}%</span>
        </div>
      )}
    </div>
  );
}

// The swatch trigger — opens the panel in the portal popover.
export function ColorPickerButton({
  color,
  onColor,
  // 1.1.2 — the commit lane rides through to the panel (see
  // ColorPickerPanel's prop note): preview during the gesture, commit on
  // the release.
  onCommit = null,
  // 1.6.3 — THE RESET LANE rides through to the panel (see the panel's
  // own prop note): seats whose "no color" is a real state (card colors,
  // class colors, tag colors, version colors, manual theme colors) hand
  // the picker the road home — the hex area's key unsets instead of
  // painting the classic red.
  onReset = null,
  title = 'Open the color picker: any color you like',
  dashed = false,
  active: activeProp = null,
  width = 216,
  buttonRef: externalBtnRef = null,
}) {
  const [open, setOpen] = useState(false);
  const innerRef = useRef(null);
  const btnRef = externalBtnRef || innerRef;
  const valid = normalizeHexInput(color);
  // `active` may be derived by the caller (a custom color outside the
  // presets); default: the button reads active whenever it holds a color.
  const active = activeProp != null ? activeProp : !!valid;

  return (
    <span className="gd-cp-trigger">
      <button
        ref={btnRef}
        type="button"
        className={clsx('gd-cp-btn', dashed && 'is-dashed', active && 'is-active')}
        title={title}
        onClick={() => setOpen((o) => !o)}
      >
        {dashed ? (
          <>
            {valid ? <span className="gd-cp-btn-fill" style={{ background: valid }} /> : <Pipette size={12} />}
          </>
        ) : (
          <span className="gd-cp-btn-fill" style={{ background: valid || 'transparent' }} />
        )}
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={btnRef} width={width} align="start">
        <div className="p-2.5">
          <ColorPickerPanel color={valid || '#c8402f'} onColor={onColor} onCommit={onCommit} onReset={onReset} compact />
        </div>
      </Popover>
    </span>
  );
}
