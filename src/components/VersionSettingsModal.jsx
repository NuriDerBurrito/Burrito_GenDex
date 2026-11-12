import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Check, ChevronLeft, ChevronRight, Star, Trash2 } from 'lucide-react';
import Modal from './Modal.jsx';
import LucideIconPicker, { ChipGlyph } from './LucideIconPicker.jsx';
import { ColorPickerButton } from './ColorPicker.jsx';
import { RichText, default as RichInput } from './RichText.jsx';
import { CHIP_COLORS } from '../constants/index.js';
import { readableInk, stripRichText } from '../utils/helpers.js';

// Version settings — draft-based: label / icon / color are edited locally and
// only touch the db when DONE is pressed. CANCEL throws them away. Position,
// card-cover and delete remain immediate (structural actions).
// 0.34.0 — CREATE MODE ("when creating a new version, it doesnt first open
// the version manager with the new one, when i press cancel it should cancel
// it and not create the new one, and when i press on create it should create
// it"): with `createMode` the window rides a DRAFT version that is not in
// the db yet — the footer is CANCEL / CREATE, the structural rows (delete /
// position / card cover) hide (there is nothing to move, delete or preview
// yet), and CREATE hands the edited {label, icon, color} to the parent to
// land. CANCEL just closes — the draft dies in local state.
export default function VersionSettingsModal({
  version,
  index,
  total,
  isPreview,
  createMode = false,
  onClose,
  onPatch,
  onMove,
  onTogglePreview,
  onDelete,
  onCreate,
}) {
  const [label, setLabel] = useState(version.label || '');
  const [icon, setIcon] = useState(version.icon || null);
  const [color, setColor] = useState(version.color || null);

  // Keep the draft honest if the version changes underneath (undo etc.).
  useEffect(() => {
    setLabel(version.label || '');
    setIcon(version.icon || null);
    setColor(version.color || null);
  }, [version.id]);

  const dirty =
    label !== (version.label || '') || icon !== (version.icon || null) || color !== (version.color || null);

  // 1.0.6 — THE UNSAVED-CHANGES GUARD ("closing a window with unsaved changes
  // should warn about it and when its confirmed to close it shouldnt apply
  // said changes"): while the draft differs from the stored version, the
  // accidental close gestures (✕ / Escape / backdrop) ask first — confirming
  // closes WITHOUT patching (the draft dies in local state). The footer's
  // own CANCEL (explicit discard) and DONE / CREATE (explicit intent) stay
  // direct. Structural rows (position / cover / delete) are immediate
  // actions — they were never draft state, so they carry no ask.
  const guardClose = dirty
    ? {
        message:
          'The version has edits that have not been applied yet. Close the window and discard them?',
      }
    : null;

  const chipStyle = useMemo(
    () => (color ? { background: color, color: readableInk(color) } : undefined),
    [color]
  );

  const commit = () => {
    if (createMode) {
      onCreate?.({ label: stripRichText(label).trim() ? label : version.label, icon, color });
      return;
    }
    if (dirty) onPatch({ label: stripRichText(label).trim() ? label : version.label, icon, color });
    onClose();
  };

  return (
    <Modal
      title={createMode ? 'NEW VERSION' : `VERSION: ${stripRichText(version.label) || 'EDIT'}`}
      onClose={onClose}
      confirmClose={guardClose}
      width="w-[660px]"
      footer={
        createMode ? (
          <div className="flex items-center justify-end">
            <div className="gd-foot-bar">
              <button className="gd-btn" onClick={onClose} title="Discard the new version: nothing is created">
                CANCEL
              </button>
              {/* 0.34.0 — CREATE commits the draft; the accent solid read is
                  the app's "this lands something new" key. */}
              <button className="gd-btn gd-btn-solid" onClick={commit} title="Create the version with these looks">
                CREATE
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button className="gd-btn gd-btn-danger" onClick={onDelete}>
              <Trash2 size={12} />
              DELETE VERSION
            </button>
            <div className="flex items-center gap-2">
              <button className="gd-btn" onClick={onClose}>
                CANCEL
              </button>
              <button className={clsx('gd-btn', dirty ? 'gd-btn-solid' : 'gd-btn-accent')} onClick={commit}>
                {dirty ? 'DONE: APPLY' : 'DONE'}
              </button>
            </div>
          </div>
        )
      }
    >
      {/* 0.36.0 — CONTENT LEFT · ICON PICKER RIGHT ("new version box should
          have the emotes on the right simmilar to the character creation
          area and the class creation window, apply that also to the edit
          version window"): the picker is a permanent column now, not a
          CHANGE ICON toggle hiding an inline strip — the same anatomy as
          the class creation window's grid. */}
      <div className="grid grid-cols-[1fr_236px] gap-4">
        <div className="space-y-4 min-w-0">
        <div>
          <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">LABEL</div>
          {/* 1.0.5 — THE LABEL IS CAPPED AT 35 ("35 character limit for the
              version name too and dont let it push the windows to the
              right"): the field refuses a 36th plain character, and the
              editor column is min-w-0 — a long label scrolls inside its
              own box instead of pushing the 1fr track wider (the icon
              picker column on the right never moves). */}
          <RichInput value={label} maxLength={35} placeholder="V1, alt outfit, anything…" onChange={setLabel} />
        </div>

        <div>
          <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">ICON &amp; PREVIEW</div>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {/* 1.0.6 — THE PREVIEW KEEPS ITS SEAT ("fix the issue where the
                preview clips out of the window, fix that so it stops"): the
                chip is min-w-0 + capped and its label ellipsizes at the cap —
                a 35-character label can never push the chip (or the cover
                key beside it) past the window's edge again; the full name
                rides the chip's title tooltip. */}
            <span
              /* 1.0.7 — FLAT (the version-label law): the preview chip
                  stands straight like the strip it previews. What you
                  frame here is exactly what ships there. */
              className="gd-chip gd-chip-flat min-w-0"
              style={chipStyle}
              title={stripRichText(label) || 'Version label'}
              /* 1.0.8 — a NAME-LABEL tooltip: two lines and no more. */
              data-gd-tip-name="1"
            >
              {icon && <ChipGlyph name={icon} size={13} />}
              <RichText text={label} className="gd-chip-label-cap" />
            </span>
            {/* 0.34.0 — SET AS CARD COVER hides in CREATE mode: a draft has
                no images to preview yet.
                0.43.0 — THE COVER KEY RESTS WHILE IT HOLDS THE TITLE ("make
                it so when a version is selected as the card cover, the button
                wont be clickable to disable that, as the way to disable it
                would be to just make another version the card cover"): the
                key is DISABLED on the version that already IS the cover —
                the only way forward is crowning another version (whose own
                key is live). */}
            {!createMode && (
              <button
                className={clsx('gd-btn', isPreview && 'gd-btn-accent')}
                disabled={isPreview}
                onClick={onTogglePreview}
                title={
                  isPreview
                    ? 'This version is the card cover: make another version the cover to change it'
                    : "Use this version's first image as the card cover"
                }
              >
                <Star size={12} className={isPreview ? 'fill-current' : undefined} />
                {isPreview ? 'CARD COVER ✓' : 'SET AS CARD COVER'}
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">CHIP COLOR</div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              className={clsx(
                'w-6 h-6 rounded border-2 flex items-center justify-center text-[10px] font-bold',
                !color ? 'gd-btn-accent' : 'text-gd-chrome'
              )}
              style={{ borderColor: 'var(--gd-line)' }}
              title="Theme default"
              onClick={() => setColor(null)}
            >
              {color ? '∅' : <Check size={12} strokeWidth={3} />}
            </button>
            {CHIP_COLORS.map((c) => (
              <button
                key={c}
                className="w-6 h-6 rounded border-2 flex items-center justify-center"
                style={{
                  background: c,
                  borderColor: color === c ? 'var(--gd-chrome)' : 'var(--gd-ink)',
                  outline: color === c ? '2px solid var(--gd-accent)' : 'none',
                  outlineOffset: 1,
                }}
                title={c}
                onClick={() => setColor(c)}
              >
                {color === c && <Check size={12} strokeWidth={3} style={{ color: readableInk(c) }} />}
              </button>
            ))}
            {/* Custom color — the in-app PICKER (0.24.0: the native wheel is
                gone — no lag, and the popover carries its own hex area). */}
            <span className="gd-swatch-divider" aria-hidden />
            <ColorPickerButton
              color={color}
              onColor={setColor}
              // 1.6.3 — the picker's reset unsets the version color (the
              // chip keeps the strip's own default tint).
              onReset={() => setColor(null)}
              dashed
              active={!!color && !CHIP_COLORS.includes(color)}
              title="Open the color picker: any color you like"
            />
          </div>
        </div>

        {/* 0.34.0 — POSITION IN STRIP hides in CREATE mode (a new version
            lands at the end by design; move it after it exists). */}
        {!createMode && (
          <div>
            <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">POSITION IN STRIP</div>
            <div className="flex items-center gap-2">
              <button className="gd-btn" disabled={index === 0} onClick={() => onMove(-1)}>
                <ChevronLeft size={13} />
              </button>
              <span className="text-[11px] text-gd-chrome">
                {index + 1} of {total}
              </span>
              <button className="gd-btn" disabled={index === total - 1} onClick={() => onMove(1)}>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
        </div>

        <div>
          <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute mb-1.5">ICON PICKER</div>
          <LucideIconPicker value={icon} onSelect={setIcon} />
        </div>
      </div>
    </Modal>
  );
}
