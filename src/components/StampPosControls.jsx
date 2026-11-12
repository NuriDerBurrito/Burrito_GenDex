import { useRef, useState } from 'react';
import clsx from 'clsx';
import { Settings2 } from 'lucide-react';
import Popover from './Popover.jsx';
import { bandStampTransform } from '../utils/helpers.js';
import {
  STAMP_ALPHA_RANGE,
  STAMP_POS_RANGE,
  STAMP_ROT_RANGE,
  STAMP_SCALE_RANGE,
  sanitizeStampSettings,
} from '../constants/index.js';

// STAMP SETTINGS (0.20.0 rework · 0.22.0 shared-settings + readable values).
// One tiny button beside the card's stamp slots (creation dialog + right
// panel editor) that opens the settings popover. 0.22.0 — the settings are
// the CARD's (one set for every stamp: only one is visible at a time, so
// hue, position, size, angle, transparency and clipping are shared — swap
// the top stamp and the look stays).
//   · X POSITION / Y POSITION — the stamp's CENTER as a percent of the
//     card's art box. The range deliberately runs OUTSIDE 0..100: a stamp
//     may hang past the card's borders or clip out, exactly as requested.
//   · SCALE — the sticker's size as a multiplier of its base size (0.25x..4x).
//   · ROTATION — degrees, -180..180.
//   · TRANSPARENCY — the stamp ART's own opacity: how solid the logo itself
//     paints (100% = opaque). A LOOK, not a placement — editing it never
//     lifts a band stamp out of the band, and BAND keeps it.
//   · OUTSIDE — the limited-to-the-card switch: OFF by default (the parts
//     hanging past the card's border are HIDDEN, clipped at the sleeve's
//     edge); ON and they show like normal stickers.
//   · BAND — the reset: back to the classic faded bottom band (position,
//     size, angle and clipping all return to their defaults — transparency
//     stays, it is a look).
// 0.22.0 — READABLE VALUES (the "cryptic transformers" complaint): every row
// spells out WHAT it is (full words, no single letters) and WHAT it is set
// to, with units — "X POSITION 50%", "SCALE ×1.00", "ROTATION 0°",
// "TRANSPARENCY 100%" — and the value column is wide enough to never
// truncate or wrap. All values read through the normalized settings object,
// so the switch and the render can never disagree (the old undefined-clip
// state made the FIRST OUTSIDE click a visual no-op).
// 0.22.0 follow-up — THE VALUES OF THE FIRST STATE. While the stamp sits in
// the classic bottom band the sliders no longer preview a fictitious
// "default normal state" (50% / 79% / ×1.00): they show the transform the
// band is ACTUALLY painting right now (bandStampTransform derives it from
// the stamp image's aspect + the card's ratio). The first touch of any
// placement slider then LIFTS the stamp carrying that captured transform —
// position and size stay exactly as they were and only the value you are
// dragging changes, so the stamp never "changes everything" on the first
// edit. (`stampAspect` / `cardAspect` come from the call sites — the top
// stamp's measured image aspect and the card's effective ratio; when either
// is still unknown this default lift spot is the fallback.)
// 0.26.0 — the fallback Y is 79 ("y should be 79%"): the preview spot the
// sliders show before the band capture resolves, and the spot an unknown-
// aspect stamp lifts to.
const PLACE_DEFAULTS = { x: 50, y: 79 };

export default function StampPosControls({ settings, onPatch, stampAspect = null, cardAspect = null, showHelp = false, variant = 'key' }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  // The normalized card settings — every field present and on its rails.
  const s = sanitizeStampSettings(settings || {});
  const pos = s.pos || null;
  const placed = !!(pos && Number.isFinite(pos.x) && Number.isFinite(pos.y));
  // The band-equivalent transform: what a placed sticker would need to
  // reproduce the band render pixel-for-pixel (null while the stamp image's
  // aspect or the card's ratio is still being measured).
  const cap = !placed ? bandStampTransform(stampAspect, cardAspect) : null;
  // While no position exists the sliders show the BAND CAPTURE (the state
  // the stamp is really in); only if that is not knowable yet do they fall
  // back to the old preview spot.
  const x = placed ? Math.round(pos.x) : Math.round(cap ? cap.x : PLACE_DEFAULTS.x);
  const y = placed ? Math.round(pos.y) : Math.round(cap ? cap.y : PLACE_DEFAULTS.y);
  const scale = placed ? s.scale : cap ? cap.scale : 1;

  // While the stamp sits in the band, a patch from any PLACEMENT slider
  // (X / Y / SCALE / ROTATION) first LIFTS it out — carrying the CAPTURED
  // band transform, so the sticker appears exactly where and as big as the
  // band had it, with this edit applied on top. Every control is live from
  // the first click AND the stamp never jumps.
  const lift = (patch) =>
    onPatch(
      placed
        ? patch
        : {
            pos: cap ? { x: cap.x, y: cap.y } : { ...PLACE_DEFAULTS },
            scale: cap ? cap.scale : 1,
            ...patch,
          }
    );

  // One slider row: full label + range + the value WITH its unit, right
  // aligned and tabular so the numbers never dance while dragging.
  const sliderRow = (label, key, val, min, max, step, fmt, title, onCommit) => (
    <div key={key} className="gd-stamp-pos-row" title={title}>
      <span className="gd-stamp-pos-row-label">{label}</span>
      <input
        type="range"
        className="gd-range"
        min={min}
        max={max}
        step={step}
        value={val}
        aria-label={label}
        onChange={(e) => onCommit(Number(e.target.value))}
      />
      <span className="gd-stamp-pos-val">{fmt(val)}</span>
    </div>
  );

  return (
    <span className="gd-stamp-pos">
      {/* 1.4.4 — THE SETTINGS KEY IS A REAL BUTTON ("fix that so its
          actually a new button instead"): the anonymous 20px gear is
          retired — a labeled key (gear + SETTINGS) in the app's own
          button language, wearing the accent ring while a stamp is
          PLACED, one voice with the COLOR key beside it and with every
          window that seats the pair.
          1.4.5 — ...and the 20px gear is BACK, in its own windows (the
          right panel / full detail / creation window speak the CLASSIC
          face; the edit card window keeps the labeled key) — see the
          variant law at StampColorControls. */}
      <button
        ref={btnRef}
        type="button"
        className={clsx(variant === 'classic' ? 'gd-stamp-key-classic' : 'gd-stamp-key', placed && 'is-on')}
        title={
          placed
            ? 'Open the stamp settings: position, scale, rotation, transparency and outside, or return it to the bottom band'
            : 'Open the stamp settings: the values reflect where the band is showing the stamp right now; place, resize and rotate it right from here'
        }
        onClick={() => setOpen((o) => !o)}
      >
        <Settings2 size={variant === 'classic' ? 12 : 11} strokeWidth={2.5} />
        {variant !== 'classic' && 'SETTINGS'}
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={btnRef} width={256} align="start">
        <div className="p-2.5">
          <div className="gd-pop-head">STAMP SETTINGS</div>
          <div className="mt-1.5">
            {sliderRow(
              'X POSITION',
              'x',
              x,
              STAMP_POS_RANGE.min + 10,
              STAMP_POS_RANGE.max - 10,
              1,
              (v) => `${Math.round(v)}%`,
              'X position: how far across the card the stamp\u2019s center sits; below 0 or past 100 it hangs off the edge',
              (n) => lift({ pos: { x: n, y: placed ? pos.y : cap ? cap.y : PLACE_DEFAULTS.y } })
            )}
            {sliderRow(
              'Y POSITION',
              'y',
              y,
              STAMP_POS_RANGE.min + 10,
              STAMP_POS_RANGE.max - 10,
              1,
              (v) => `${Math.round(v)}%`,
              'Y position: how far down the card the stamp\u2019s center sits; below 0 or past 100 it hangs off the edge',
              (n) => lift({ pos: { x: placed ? pos.x : cap ? cap.x : PLACE_DEFAULTS.x, y: n } })
            )}
            {sliderRow(
              'SCALE',
              'scale',
              scale,
              STAMP_SCALE_RANGE.min,
              STAMP_SCALE_RANGE.max,
              0.05,
              (v) => `\u00d7${Number(v).toFixed(2)}`,
              'Scale: the sticker\u2019s size as a multiple of its base size',
              (n) => lift({ scale: n })
            )}
            {sliderRow(
              'ROTATION',
              'rot',
              s.rot,
              STAMP_ROT_RANGE.min,
              STAMP_ROT_RANGE.max,
              1,
              (v) => `${Math.round(v)}\u00b0`,
              'Rotation in degrees: the sticker turns around its own center',
              (n) => lift({ rot: n })
            )}
            {/* The ART's transparency. NOT a placement edit: it goes straight
                through (a band stamp keeps its band — no lift), and the BAND
                reset leaves it alone. */}
            {sliderRow(
              'TRANSPARENCY',
              'alpha',
              s.alpha,
              STAMP_ALPHA_RANGE.min,
              STAMP_ALPHA_RANGE.max,
              0.02,
              (v) => `${Math.round(v * 100)}%`,
              'Transparency: how solid the stamp art itself paints (100% = fully opaque; lower lets the card show through)',
              (n) => onPatch({ alpha: n })
            )}
          </div>
          {/* The limited-to-the-card switch. OFF (default): the parts past
              the card's border are hidden — the stamp is confined. ON: they
              hang outside like normal stickers. */}
          <div className="gd-stamp-pos-switch">
            <span className="gd-stamp-pos-row-label">OUTSIDE</span>
            <span className="gd-stamp-pos-switch-hint">show past the border</span>
            <button
              type="button"
              className={clsx('gd-switch', !s.clip && 'is-on')}
              title={
                s.clip === false
                  ? 'ON: the parts of the stamp hanging past the card border are shown. Click to confine the stamp to the card (they get clipped away).'
                  : 'OFF: the stamp is limited to the card, parts past its border are hidden. Click to let them show again.'
              }
              onClick={() => onPatch({ clip: s.clip === false })}
            />
          </div>
          {/* 0.38.0 — THE HUE LAYER ORDER ("add an option for the stamp
              settings for the stamp to be above or below the color hue"):
              OFF (default, the classic look) = the stamp ART paints above
              the color wash; ON = the hue covers the stamp — the tint rides
              over the logo. Matters most at high hue transparency, where
              the wash can swallow a low-contrast stamp. */}
          <div className="gd-stamp-pos-switch">
            <span className="gd-stamp-pos-row-label">HUE OVER STAMP</span>
            <span className="gd-stamp-pos-switch-hint">the wash covers the logo</span>
            <button
              type="button"
              className={clsx('gd-switch', s.hueOver && 'is-on')}
              title={
                s.hueOver
                  ? 'ON: the color hue paints OVER the stamp art (a tint over the logo). Click to put the stamp back above the wash.'
                  : 'OFF: the stamp art paints over the color hue (the classic look). Click to let the hue cover the stamp.'
              }
              onClick={() => onPatch({ hueOver: !s.hueOver })}
            />
          </div>
          <button
            type="button"
            className="gd-btn !w-full !py-1 mt-2"
            disabled={!placed}
            title="Return this stamp to the classic faded band at the bottom of the card"
            onClick={() => onPatch({ pos: null, scale: 1, rot: 0, clip: true })}
          >
            BAND
          </button>
          {/* 0.23.0 — the long "positions are a percent…" paragraph moved
              under the HELP TEXT setting ("remove the long text below the
              values, keep it in the help text option case"): the popover
              stays just the values. Every row already carries its own
              tooltip, so nothing is lost. */}
          {showHelp && (
            <p className="mt-1.5 text-[8px] leading-relaxed text-gd-mute">
              Positions are a percent of the card&rsquo;s art box: past 100 or under 0 the stamp hangs outside. The X / Y /
              scale / rotation sliders lift the stamp out of the bottom band keeping its current spot and size; BAND puts
              it back
              {s.clip === false ? '' : ', outside off'}; transparency is a look, it stays. One setting for every stamp
              on the card.
            </p>
          )}
        </div>
      </Popover>
    </span>
  );
}
