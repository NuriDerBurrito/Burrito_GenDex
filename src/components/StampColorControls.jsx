import { useRef, useState } from 'react';
import clsx from 'clsx';
import Popover from './Popover.jsx';
import { ColorPickerPanel } from './ColorPicker.jsx';
import { DEFAULT_STAMP_COLOR, STAMP_HUE_ALPHA_RANGE, sanitizeStampHueAlpha } from '../constants/index.js';

// 0.24.0 — THE COLOR WINDOW, REBUILT ON THE IN-APP PICKER. The native
// <input type="color"> is gone (it read foreign to the app and its laggy
// onChange made dragging feel broken); the window now opens the hue
// selection RIGHT AWAY — the saturation/brightness field, the hue rail, the
// HEX area (the tag manager's, now here too), and the hue's OWN
// TRANSPARENCY slider — all drawn from the app's design system, all driven
// by pointer capture, painting on every move with zero lag.
// One settings object per CARD ("all stamps share the same settings"): the
// props are the card's stampSettings fields, not any single stamp's.
const HEX_RE = /^#[0-9a-f]{6}$/i;

export default function StampColorControls({
  color,
  colorAlpha,
  autoColor = null,
  onColor,
  onAlpha,
  // 1.3.8 — THE HUE'S SECOND LAYER ORDER ("implement an option in the hue
  // settings to be above the trim too if need be"): hueOverTrim seats ONE
  // wash above the trims (the hue's single voice — see the gd-hue-over-trim
  // law in index.css). The switch lives HERE, in the hue's own window,
  // beside the transparency that shapes it.
  hueOverTrim = false,
  onHueOverTrim = null,
  showHelp = false,
  // 1.4.5 — TWO STYLES, TWO WINDOWS ("i want their buttons to be 2
  // different style ... the rest should be the old one"): 'key' speaks
  // the 1.4.4 labeled key (the CARD EDIT WINDOW's own); 'classic' speaks
  // the anonymous 20px swatch square the right panel / full detail /
  // creation window were born with. Same window, same laws — only the
  // trigger's own face changes.
  variant = 'key',
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const custom = HEX_RE.test(String(color || '')) ? String(color).toLowerCase() : null;
  // 0.41.0 — WHITE BY DEFAULT ("default color for the hue of the stamp
  // should be white bruh"): the swatch shows the card's CUSTOM hue when one
  // is picked, else the clean WHITE constant — never the stamp's derived
  // dominant color (the autoColor derivation keeps running for the library
  // cache, but it no longer paints anything). The window and the card agree
  // on white from the very first frame.
  const hue = custom || DEFAULT_STAMP_COLOR;
  const alpha = sanitizeStampHueAlpha(colorAlpha);

  return (
    <span className="gd-stamp-color">
      {/* 1.4.4 — THE COLOR KEY IS A REAL BUTTON ("hue color and stamp
          settings seem to still contain the same old button but inside a
          new container, fix that so its actually a new button instead"):
          the anonymous 20px swatch square is retired — a labeled key
          (a live swatch chip of the hue the card is painting + its name)
          in the app's own button language, one voice with the SETTINGS
          key beside it and with every window that seats the pair.
          1.4.5 — ...and the 20px square is BACK, in its own windows: the
          right panel, the full-window detail and the creation window
          speak the CLASSIC face ('variant="classic"'), the edit card
          window keeps the labeled key. */}
      <button
        ref={btnRef}
        type="button"
        className={clsx(variant === 'classic' ? 'gd-stamp-key-classic gd-stamp-key-color' : 'gd-stamp-key')}
        title="Stamp color: opens the hue selection right away, with its transparency"
        onClick={() => setOpen((o) => !o)}
      >
        {variant === 'classic' ? (
          <span className="gd-stamp-key-fill" style={{ background: hue }} aria-hidden />
        ) : (
          <>
            <span className="gd-stamp-key-swatch" style={{ background: hue }} aria-hidden />
            COLOR
          </>
        )}
      </button>

      <Popover open={open} onClose={() => setOpen(false)} anchor={btnRef} width={236} align="start">
        <div className="p-2.5">
          <div className="gd-pop-head">STAMP COLOR</div>

          {/* The full picker — hue + shade + hex + transparency, live.
              1.6.3 — THE HUE'S OWN RESET ("the default color for hue
              should be the white ... make it so when its pressed it would
              remove hue color as if not set"): the hex area's key unsets
              the hue — the card returns to the clean WHITE default the
              window was born speaking, exactly the road home the report
              asked for. */}
          <ColorPickerPanel
            color={hue}
            onColor={(hexOrNull) => onColor?.(hexOrNull)}
            onReset={() => onColor?.(null)}
            alpha={alpha}
            onAlpha={(v) => onAlpha?.(v)}
            alphaLabel="TRANSPARENCY"
            alphaRange={STAMP_HUE_ALPHA_RANGE}
          />

          {/* 1.3.8 — THE HUE ABOVE THE TRIM: the same switch language the
              stamp settings popover speaks (the HUE OVER STAMP row's twin),
              seated in the hue's own window where the order belongs. */}
          {onHueOverTrim && (
            <div className="gd-stamp-pos-switch !mt-2.5">
              <span className="gd-stamp-pos-row-label">HUE OVER TRIM</span>
              <span className="gd-stamp-pos-switch-hint">the wash covers the frame</span>
              <button
                type="button"
                className={clsx('gd-switch', hueOverTrim && 'is-on')}
                title={
                  hueOverTrim
                    ? 'ON: the hue paints OVER the trims — the ink ring reads as washed material. Click to put the frame back above the wash.'
                    : 'OFF: the trims paint over the hue wash (the classic look — the card\'s borders always win). Click to let the hue cover the frame.'
                }
                onClick={() => onHueOverTrim(!hueOverTrim)}
              />
            </div>
          )}

          {showHelp && (
            <p className="mt-1.5 text-[8px] leading-relaxed text-gd-mute">
              The hue tints the bottom half of the card, fading upward like the stamp band. Pick any color and change
              its transparency anytime.
            </p>
          )}
        </div>
      </Popover>
    </span>
  );
}
