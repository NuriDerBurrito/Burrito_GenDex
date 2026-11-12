import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowUp, Check, Copy, Maximize2, Plus, X } from 'lucide-react';
import clsx from 'clsx';
import { CLASS_COLOR_PRESETS, makePart } from '../constants/index.js';
import { partContainerFace, stripRichText, deferToPaint } from '../utils/helpers.js';
import RichInput from './RichText.jsx';
import Modal from './Modal.jsx';
import { ColorPickerButton } from './ColorPicker.jsx';

// 1.6.5 — THE EXPANDED PROMPT WINDOW, HOME FROM 1.5.2 ("i dug back and
// found which version had the prompt window color that i mentioned, its
// version 1.5.2, that version includes the prompt expand correctly"): the
// 1.6.4 read-only READER is retired — the owner's remembered law is the
// big EDITOR: the app's own window language (Modal — the fade + rise
// entrance, the pinned footer, the portal to body) carrying ONE
// stage-sized editing field (.gd-prompt-stage — its own 58vh scroll, so
// the window never outgrows the screen and the pinned DONE key never
// moves). Edits land LIVE in the part (every keystroke writes through the
// same patch road the row's own well speaks — the row behind the window
// updates in real time, and DONE is just the door: nothing to apply,
// nothing to lose). The window follows the part, not the seat — reorder
// the stack with it open and the editor keeps its part; delete the part
// and it closes itself (the lookup misses, AnimatePresence speaks the
// leave).
// 1.6.7 — THE TITLE IS EDITABLE HERE TOO ("allow me to edit the title of
// the prompt in the expanded prompt window"): the subheader's name was a
// static span — a label the window showed but refused to touch. It is
// the row's own RichInput now (same field, same live patch road): rename
// the part inside the big editor and the row behind it re-titles in real
// time, exactly like the content below it always has. The char count
// keeps its seat on the right; the count of the CONTENT, never of the
// name.
function PromptExpandWindow({ part, onPatch, onClose }) {
  /* 1.7.2 — THE WINDOW FITS THE COLOR ENTIRELY ("prompt/note editor window
     entirely should fit into the color picked, not just the container,
     that includes the window, the title, and so on"): the big editor
     used to tint its STAGE alone — a colored island floating in the
     theme's window — while the window chrome (the card's ground, the
     title band, the footer) kept the theme's panel. The whole WINDOW
     wears the part's color now: Modal's `tint` seats the face vars on
     the card itself, the CSS laws (.gd-modal-card.is-part-tinted in
     index.css) paint the card's ground as the FACE and the title as the
     face's ink, and the stage INSIDE steps one depth deeper (the WELL,
     the same neumorphic ladder the row speaks: face -> well, window ->
     field). A part with no color keeps the theme's own window exactly
     as it always painted. */
  const deep = part.colorShade === 'deep';
  return (
    <Modal
      title="PROMPT EDITOR"
      onClose={onClose}
      width="w-[720px]"
      tint={
        part.color
          ? {
              ['--part-color']: part.color,
              ...(partContainerFace(part.color, deep) || {}),
            }
          : null
      }
      subheader={
        /* 1.6.8 — THE TITLE SPANS THE CONTAINER ("dont show 'x CHARACTERS ·
           EDITS LAND LIVE' in the expanded prompt window, and extend the
           title to match the container horizontally"): the char count and
           its live-edits note left with the request — the subheader's whole
           row belongs to the part's name now, the editable title reaching
           the window's full width exactly as the stage below it does (the
           count always spoke the CONTENT, and the content has its own
           stage to speak on). 1.7.2 — the title's INK follows the face
           (the fallback keeps the theme's chrome for an uncolored part). */
        <RichInput
          className="gd-notes-title font-bold text-[13px] w-full min-w-0"
          value={part.name}
          placeholder="Part name (body, facial, outfit…)"
          onChange={(v) => onPatch(part.id, { name: v })}
        />
      }
      footer={
        <div className="flex justify-end">
          <button className="gd-btn gd-btn-accent" onClick={onClose} title="Close the big editor (edits are already applied)">
            DONE
          </button>
        </div>
      }
    >
      {/* 1.6.8 — THE CONTAINER'S COLOR FOLLOWS THE PART ("also container
          color should affect the prompt/note container inside alongside
          the expanded window"): the big editor's stage wears the part's
          own tint exactly the row behind it does — the tinted frame and
          the soft wash (the DEEP shade speaking at full weight), so the
          window reads as the part's container EXPANDED, never as a
          neutral stage the part merely edits. See .gd-prompt-stage rules
          in index.css. */}
      <textarea
        className={clsx('gd-input gd-prompt-stage', part.color && 'is-colored', part.colorShade === 'deep' && 'is-shade-deep')}
        style={part.color ? { ['--part-color']: part.color, ...(partContainerFace(part.color, part.colorShade === 'deep') || {}) } : undefined}
        value={part.content}
        placeholder="Prompt content for this part…"
        autoFocus
        spellCheck={false}
        onChange={(e) => onPatch(part.id, { content: e.target.value })}
      />
    </Modal>
  );
}

// 1.6.5 — THE PART'S COLOR WINDOW, HOME FROM 1.5.2 ("and the prompt
// container color properly"): the app's own color language (the
// class/card ladder — ∅ for the theme's frame, the preset washes, the
// custom picker for any hex) carried by the app's own window language
// (Modal — fade + rise, the pinned DONE key). What you pick is what the
// row wears the moment you pick it (every choice lands LIVE through the
// same patch road the row's fields speak); DONE is just the door. The
// 1.6.4 popover pocket is retired — the owner's remembered law was
// always the WINDOW.
function PartColorWindow({ part, onPatch, onClose }) {
  const name = stripRichText(part.name || 'Part');
  const color = part.color || null;
  // 1.6.8 — THE SHADE DIAL: LIGHT keeps the classic pale wash; DEEP asks
  // the container to speak at full weight (a richer face, a full-color
  // border) — the answer to "an option to make the color lighter or
  // darker on the container so its not always so light/pale".
  const deep = part.colorShade === 'deep';
  const shadeBtn = (id, label, title, isOn) => (
    <button
      type="button"
      className={clsx('gd-btn !py-1 !px-2.5 text-[10px]', isOn && 'gd-btn-accent')}
      title={title}
      onClick={() => onPatch(part.id, { colorShade: id === 'deep' ? 'deep' : null })}
    >
      {label}
    </button>
  );
  return (
    <Modal
      title="PART COLOR"
      onClose={onClose}
      width="w-[420px]"
      subheader={
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[12px] font-bold truncate" style={{ color: 'var(--gd-chrome)' }}>
            {name}
          </span>
          <span className="text-[10px] tracking-[0.14em] uppercase whitespace-nowrap" style={{ color: 'var(--gd-mute)' }}>
            the container&rsquo;s own frame · lands live
          </span>
        </div>
      }
      footer={
        <div className="flex justify-end">
          <button className="gd-btn gd-btn-accent" onClick={onClose} title="Close the color window (the color is already applied)">
            DONE
          </button>
        </div>
      }
    >
      <div className="gd-cls-presets">
        <button
          type="button"
          className={clsx(
            'w-6 h-6 rounded border-2 flex items-center justify-center text-[10px] font-bold',
            !color ? 'gd-btn-accent' : 'text-gd-chrome'
          )}
          style={{ borderColor: 'var(--gd-line)' }}
          title="Theme default: the row wears the theme's own sticker frame"
          onClick={() => onPatch(part.id, { color: null })}
        >
          ∅
        </button>
        {CLASS_COLOR_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className={clsx('gd-cls-preset', color === preset && 'is-active')}
            style={{ background: preset, borderColor: color === preset ? 'var(--gd-chrome)' : 'var(--gd-ink)' }}
            title={preset}
            onClick={() => onPatch(part.id, { color: preset })}
          />
        ))}
        <span className="gd-swatch-divider" aria-hidden />
        <ColorPickerButton
          color={color}
          onColor={(hexOrNull) => onPatch(part.id, { color: hexOrNull })}
          dashed
          active={!!color && !CLASS_COLOR_PRESETS.includes(color)}
          title="Open the color picker: any color you like"
        />
      </div>
      {/* 1.6.8 — THE SHADE DIAL ("remove 'The color paints this part's
          container frame — a tinted border and a soft wash, never the
          text. ∅ returns the theme's own frame.' , instead add a new
          option, an option to make the color lighter or darker on the
          container so its not always so light/pale"): the explanatory
          paragraph left with the request; its seat speaks the LIGHT /
          DEEP pair now — one press, live, exactly the ladder's own
          language. The shade rides with the color wherever the container
          speaks it: the row's wash, the well inside, and the big editor
          window's stage. */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[10px] tracking-[0.16em] uppercase" style={{ color: 'var(--gd-mute)' }}>
          Container shade
        </span>
        <div className="flex items-center gap-1">
          {shadeBtn('light', 'LIGHT', 'The pale wash the containers always spoke: a tinted border, a soft veil', !deep)}
          {shadeBtn('deep', 'DARK', 'The color speaks at full weight: a richer face and a full-color border', deep)}
        </div>
      </div>
    </Modal>
  );
}

// Prompt parts editor. Each part: include checkbox, name, content, order.
// 0.32.0 — the row's ORDER KEYS are real framed buttons now ("make sure to
// emphasise the up and down and delete buttons on the prompts"): the three
// quiet borderless ghosts wore no border until hover, so they read as
// decoration instead of controls. They borrow the history group's key
// language — a panel-solid face, an ink-weight border, a grounded shadow, a
// hover lift — with the DELETE key reading danger-red. The delete key also
// asks first now (the confirm window), like every other delete in the app.
// 1.3.1 — THE ROW IS ITS OWN OBJECT ("rework the appearance of the prompt
// containers since it blends in too much in the detail panel"): the rows
// wore the generic .gd-panel surface — the SAME tier the detail panel
// itself and every card around it wear — so the parts melted into the
// panel behind them and the stack read as loose text, not containers. Each
// part now carries its OWN object language (see .gd-part-row in index.css):
// a sticker-weight frame in the theme's ink, the theme's own corner radius,
// a grounded shadow, a NUMBER TAB carrying the part's index, and the
// content field keeps its recessed well — the parts read as a numbered
// stack of distinct containers no matter the theme.
//
// 1.6.3 — THE PARTS GAIN THEIR VOICES ("the prompt copy , expand and
// coloring is missing, alongside the note expand feature too"): COPY
// (clipboard + a self-confirming beat), EXPAND, and COLOR.
// 1.6.4 — the voices found honest seats (the reader's window, the
// well-corner swatch pocket).
// 1.6.5 — THE 1.5.2 LAW, HOME ("overhaul and revamp the current prompt to
// fit the 1.5.2 version and then iterate it"): EXPAND opens the big
// EDITOR window (PromptExpandWindow above — live edits, the stage-sized
// field, Maximize2 the glyph of what it does); COLOR rides the row's own
// corner as the 1.5.2 CHIP (.gd-part-color-chip — filled with the picked
// hex, hollow + dashed while the theme's own) and its press opens the
// COLOR WINDOW (PartColorWindow above — the ladder, live picks). The
// 1.6.4 whole-row ink consumers are retired with the pocket: the paint
// speaks the 1.5.2 wash alone (.gd-part-row.is-colored in index.css — a
// tinted border, a tame wash, a tinted shadow; the fields and keys never
// change). The keys cluster is ONE COLUMN — the 1.5.2 two-row 3/2 sort
// ("do make it into one column instead of what it is in 1.5.2 tho") read
// vertically: the order keys (up / down / delete) stacked first, the
// content pair (copy / expand) beneath — five framed keys, one lane,
// every width the panel ever speaks.
function PartRow({ part, index, total, onPatch, onMove, onDelete, rowRef, fresh, flash, onExpand, expandPending = false, onColor, onStatus }) {
  // 1.6.3 — the copy key's own confirmation clock (the compose sheet's
  // law: the glyph swaps to the check for a beat, then returns).
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef(0);
  const copyContent = async () => {
    const text = stripRichText(part.content || '');
    if (!text) return;
    try {
      if (window.api?.clipboardWriteText) await window.api.clipboardWriteText(text);
      else throw new Error('no clipboard');
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1600);
      onStatus?.(`Part "${stripRichText(part.name || 'part')}" copied`);
    } catch {
      onStatus?.('Copy failed', 'fail');
    }
  };
  return (
    <div
      ref={rowRef}
      className={clsx(
        'gd-part-row',
        // 1.4.5 — the ENTRANCE rise plays only for FRESH parts (a new row
        // joining the stack): a reorder re-seats rows without re-running
        // their entrance — the FLIP glide owns the swap instead, so the
        // pressed row never "re-mounts" mid-list.
        fresh && 'gd-rise-in',
        flash === 'move' && 'is-move-flash',
        flash === 'peer' && 'is-move-peer',
        // 1.6.5 — THE CONTAINER SPEAKS ITS COLOR (the 1.5.2 law): the scope
        // class carries the paint through the CSS law in index.css (the
        // tinted border + the tame wash + the tinted shadow); the data
        // attribute keeps the color itself readable for the tests.
        // 1.6.8 — THE SHADE RIDES WITH IT: is-shade-deep asks the same
        // wash to speak at full weight (the color window's LIGHT/DARK
        // dial), and the well inside takes its own whisper of the color.
        clsx(part.color && 'is-colored', part.colorShade === 'deep' && 'is-shade-deep')
      )}
      data-part-color={part.color || undefined}
      style={part.color ? { ['--part-color']: part.color, ...(partContainerFace(part.color, part.colorShade === 'deep') || {}) } : undefined}
    >
      {/* 1.3.2 — THE NUMBER TAB IS RETIRED ("remove 'q1' and 'q2' etc from
          the prompt containers"): the 1.3.1 index tab (01 / 02 / …) is
          gone — the row keeps its sticker frame, and its writable fields
          (the name + the content well) both speak the darker recessed
          face (see .gd-part-row .gd-rt-edit + .gd-prompt-box in
          index.css). */}
      <button
        className={clsx('gd-check mt-0.5', part.include && 'is-on')}
        role="checkbox"
        aria-checked={part.include}
        aria-label={part.include ? `Include ${part.name} in output` : `Exclude ${part.name} from output`}
        title={part.include ? 'Included in output' : 'Excluded from output'}
        onClick={() => onPatch(part.id, { include: !part.include })}
      >
        {part.include && <Check size={13} strokeWidth={3.5} />}
      </button>

      <div className="gd-part-main flex-1 min-w-0">
        <RichInput
          className="font-semibold"
          value={part.name}
          placeholder="Part name (body, facial, outfit…)"
          onChange={(v) => onPatch(part.id, { name: v })}
        />
        {/* 0.43.0 — THE PROMPT CONTENT BOX SPEAKS ("make the prompt boxes
            better and less blended in"): the content field wears its own
            well — a recessed face, an accent shoulder and a focus ring —
            so the part's body reads as a real input, not a label ghost.
            1.3.1 keeps the well; the frame around it is what changed.
            1.6.5 — THE WELL KEEPS ITS PLAIN 1.5.2 SEAT: the 1.6.4 corner
            wrapper (.gd-part-well + its pocket key) left with the pocket
            it served — the well is the bare recessed field again, and
            reading the WHOLE part belongs to the big editor window (the
            expand key). */}
        {/* 0.43.0 — THE PROMPT CONTENT BOX SPEAKS ("make the prompt boxes
            better and less blended in"): the content field wears its own
            well — a recessed face, an accent shoulder and a focus ring —
            so the part's body reads as a real input, not a label ghost.
            1.3.1 keeps the well; the frame around it is what changed.
            1.6.5 — THE WELL KEEPS ITS PLAIN 1.5.2 SEAT: the 1.6.4 corner
            wrapper (.gd-part-well + its pocket key) left with the pocket
            it served — the well is the bare recessed field again, and
            reading the WHOLE part belongs to the big editor window (the
            expand key).
            1.7.8 — THE WELL EARNS A CLIPPING SHELL (the name returns with
            a new job — see .gd-well-shell in index.css): Chromium paints
            the scrollbar lane, the corner plate and the resize grip as
            SQUARES that outrun the well's own rounded curve, and the
            focus halo outruns the row's own padding — the chrome read as
            clipping OUTSIDE the prompt/note container. The shell owns the
            frame's curve and CLIPS (the logs list's own law), the field
            inside keeps every well voice it ever spoke. */}
        <div className="gd-well-shell mt-1.5">
          <textarea
            className="gd-input gd-prompt-box leading-relaxed"
            rows={3}
            spellCheck={false}
            value={part.content}
            placeholder="Prompt content for this part…"
            onChange={(e) => onPatch(part.id, { content: e.target.value })}
          />
        </div>
      </div>

      {/* 0.32.0 — THE ORDER KEYS, emphasized: framed like the app's other
          key clusters (see .gd-part-keys in index.css), the delete one in
          its danger tone. Disabled ends still dim, but the keys always READ
          as buttons now.
          1.6.5 — THE CLUSTER IS ONE COLUMN ("do make it into one column
          instead of what it is in 1.5.2 tho"): the 1.5.2 two-row 3/2 sort
          reads vertically — up / down / delete stacked first (the order
          keys), the copy / expand pair beneath (the content keys) — five
          framed keys in ONE lane at every width the panel ever speaks, the
          column's own gap doing every separating breath. The COLOR key
          rides the ROW's corner below (the 1.5.2 chip — the seat that
          belongs to the CONTAINER, never to a key cluster). */}
      <div className="gd-part-keys">
        <button
          className="gd-icon-btn"
          title="Move part up"
          disabled={index === 0}
          onClick={() => onMove(part.id, -1)}
        >
          <ArrowUp size={12} />
        </button>
        <button
          className="gd-icon-btn"
          title="Move part down"
          disabled={index === total - 1}
          onClick={() => onMove(part.id, 1)}
        >
          <ArrowDown size={12} />
        </button>
        <button className="gd-icon-btn is-part-del" title="Delete part (asks first)" onClick={() => onDelete(part.id)}>
          <X size={12} strokeWidth={3} />
        </button>
        <button
          className={clsx('gd-icon-btn', copied && 'is-copied')}
          title={copied ? 'Copied ✓' : "Copy this part's content to the clipboard"}
          disabled={!stripRichText(part.content || '')}
          onClick={copyContent}
        >
          {copied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
        </button>
        <button
          className={clsx('gd-icon-btn', expandPending && 'is-loading')}
          title="Expand: open this part's prompt in the big editor window"
          onClick={() => onExpand(part.id)}
        >
          {expandPending ? <span className="gd-wheel" aria-hidden /> : <Maximize2 size={12} />}
        </button>
      </div>
      {/* 1.6.5 — THE CONTAINER'S OWN COLOR CHIP (the 1.5.2 seat, home):
          a small round badge pinned to the row's bottom-right corner —
          the one seat that belongs to the CONTAINER rather than to any
          key cluster. Filled, it shows the color the row wears; hollow +
          dashed, it says "theme default". The press opens the color
          window (the class/card ladder — ∅, presets, any custom hex), and
          the paint itself lives in index.css (.gd-part-row.is-colored —
          a tinted border, a tame wash, a tinted shadow). */}
      <button
        type="button"
        className={clsx('gd-part-color-chip', !part.color && 'is-empty')}
        style={part.color ? { background: part.color, borderColor: part.color } : undefined}
        title={part.color ? `Container color: ${part.color} — press to change` : 'Container color: theme default — press to set one'}
        aria-label={`Container color for ${stripRichText(part.name || 'this part')}`}
        onClick={() => onColor(part.id)}
      />
      {/* 1.4.5 — the swap flight's own lane: the FLIP transform is written
          STRAIGHT to this element (see the editor's useLayoutEffect) — the
          row keeps its own transition law in index.css. `flash` carries the
          reorder's own story: every row whose seat moved GLIDES (both
          swapped rows, not just the pressed one), and the pressed row
          flashes the accent ring so it is clear WHICH of the pair moved. */}
    </div>
  );
}

export default function PartEditor({ parts, onSetParts, showHelp = false, plain = false, confirm = null, onStatus = null }) {
  // 1.4.5 — THE SWAP FLIGHT ("when pressing on up or down buttons in prompts
  // to reorder them, only the affected swapped plays the swap animation, not
  // the one i swapped, fix that and also make the animation better so its
  // clearer which swapped"): the old law animated NOTHING by intent — React
  // re-seats keyed rows with one insertBefore, and the ONE moved node
  // replayed its gd-rise-in entrance (a fade, not a swap) while the partner
  // snapped instantly: "only the affected swapped plays the swap animation".
  // The flight is a measured FLIP now: every row whose seat moved glides
  // from its old position to its new one (BOTH swapped rows, whatever the
  // distance), the pressed row flashes the accent ring while the partner
  // takes the softer peer flash, and fresh parts keep their entrance rise.
  const rowRefs = useRef(new Map()); // partId -> the row element
  const seenIdsRef = useRef(new Set()); // ids that have rendered at least once
  const flipTargetsRef = useRef(null); // the swap pair the FLIP may animate
  // 1.8.5 — THE PRESS-TIME ORIGINS (the FLIP's own memory, measured in the
  // press breath itself — see movePart): partId -> the pair's pre-commit
  // tops, scroll-relative. RETIRES the 1.4.5 mount-memory map (the tops
  // recorded at the last parts-commit): on the FIRST move that map was
  // the MOUNT breath's layout, and everything the panel settled between
  // mount and press — the opening flight, the tray's fold state, the
  // name's measure, a late font, the content-visibility estimates — had
  // left it stale; where that drift was not uniform (a row above the
  // pressed one changing height, the estimate pile-up) the FLIP painted
  // the pressed row at a seat that never was: it teleported by the whole
  // drift toward the top of the stack and glided back ("when moving
  // prompts up or down for the first time they snap to the very top and
  // then snap back"). The origins are read PRE-COMMIT now, from the
  // layout the eye is actually looking at — nothing settled anywhere can
  // leak into the flight. The mount-memory map itself is retired with the
  // breath it served: the pair is deterministic, its origins are fresh, and
  // no other road ever reads the map.
  const flipOriginsRef = useRef(null); // partId -> press-time top
  const [moveFlash, setMoveFlash] = useState(null); // { move: id, peer: id }
  const flashTimerRef = useRef(0);
  // 1.6.5 — THE 1.5.2 WINDOW SEATS (home): the EXPANDED part (the big
  // editor window's own seat — null = closed; the part id it follows;
  // deleting the part closes the window on its own, the lookup misses,
  // AnimatePresence speaks the leave) and the COLOR window's own seat (the
  // same law). View state, not data — re-opening the card starts windowless.
  const [expandedId, setExpandedId] = useState(null);
  const expandedPart = expandedId ? parts.find((p) => p.id === expandedId) || null : null;
  const [colorId, setColorId] = useState(null);
  const colorPart = colorId ? parts.find((p) => p.id === colorId) || null : null;
  // 1.8.6 — THE WHEEL THAT OUTLIVES THE FREEZE ("when pressing on buttons
  // that load things (such as expand prompt/note ...) , i want you to
  // darken it slightly as if pressed and add a loading wheel ... ensure
  // the wheel works even when app is frozen since it does freeze when
  // these actions occur"): the expand key's press marks the key ITSELF
  // pending (the darken + the wheel replacing the glyph, the settings
  // key's own law) and hands the window's mount through deferToPaint —
  // the wheel paints its compositor layer FIRST, then the heavy editor
  // window builds (the freeze), and the wheel keeps turning through it;
  // the pending mark clears in the SAME commit that mounts the window,
  // so the key answers again exactly when the window has popped up (an
  // appear and a disappear, no out flight — the report reserves that for
  // the image previews).
  const [pendingExpand, setPendingExpand] = useState(null);
  const openReader = useCallback((partId) => {
    setPendingExpand(partId);
    deferToPaint(() => {
      setExpandedId(partId);
      setPendingExpand(null);
    });
  }, []);
  const openColor = useCallback((partId) => setColorId(partId), []);

  const setRowRef = useCallback((id) => (el) => {
    if (el) rowRefs.current.set(id, el);
    else rowRefs.current.delete(id);
  }, []);

  useLayoutEffect(() => {
    // 1.4.5 — the FLIP speaks ONLY the known swap pair (the pressed row +
    // its partner): a measured-everything flight would also animate rows
    // whose tops shifted between renders for reasons that are not swaps —
    // the content-visibility estimates settling after a version switch,
    // a late layout above the list — a whole stack gliding for nothing.
    // The pair is deterministic (movePart names it), the deltas still come
    // from measured tops read SCROLL-RELATIVE so the scroller's own motion
    // never masquerades as a swap.
    // 1.8.5 — the ORIGINS are the press breath's own measure (see
    // flipOriginsRef): the flight starts where the row WAS when the key
    // was pressed — never where the last commit happened to leave it —
    // and the scroller lookup covers BOTH mounts (.gd-tex-panel for the
    // right panel, .gd-tex-viewer for the full-window view the old lookup
    // never found, leaving its tops viewport-relative).
    const targets = flipTargetsRef.current;
    const origins = flipOriginsRef.current;
    const tops = new Map();
    rowRefs.current.forEach((el, id) => {
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      const scroller = el.closest('.gd-tex-panel') || el.closest('.gd-tex-viewer') || null;
      tops.set(id, r.top - (scroller ? scroller.scrollTop : 0));
    });
    if (origins && targets) {
      targets.forEach((id) => {
        const old = origins.get(id);
        const top = tops.get(id);
        if (old == null || top == null || Math.abs(old - top) < 1) return;
        const el = rowRefs.current.get(id);
        if (!el) return;
        // FLIP: start the row where it WAS, then glide it home — one eased
        // beat, straight on the element (no state, no re-render).
        el.style.transition = 'none';
        el.style.transform = `translateY(${old - top}px)`;
        requestAnimationFrame(() => {
          el.style.transition = 'transform 0.28s cubic-bezier(0.22, 1.2, 0.36, 1)';
          el.style.transform = '';
        });
      });
    }
    flipTargetsRef.current = null;
    flipOriginsRef.current = null;
  }, [parts]);

  // The pressed row's own flash pair: the pressed part wears the strong
  // accent ring, the partner it swapped with wears the softer peer tint —
  // both fade on the same clock (the class leaves with the state).
  const flashPair = (moveId, peerId) => {
    setMoveFlash({ move: moveId, peer: peerId });
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setMoveFlash(null), 650);
  };

  const patchPart = (partId, patch) => {
    onSetParts(
      parts.map((p) => (p.id === partId ? { ...p, ...patch } : p)),
      `part:${partId}`
    );
  };

  const movePart = (partId, dir) => {
    const i = parts.findIndex((p) => p.id === partId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= parts.length) return;
    const peer = parts[j] || null; // the row being swapped WITH (pre-move)
    const next = [...parts];
    const [moved] = next.splice(i, 1);
    next.splice(j, 0, moved);
    // 1.8.5 — THE ORIGINS ARE MEASURED IN THE PRESS BREATH (see
    // flipOriginsRef): the pair's seats are read HERE, pre-commit — before
    // the new order ever reaches onSetParts and the DOM re-seats — so the
    // flight's origin is the layout the eye is looking at, not the last
    // commit's memory. The FLIP pair + the flash pair ride the same commit
    // (the layout effect of THIS render animates exactly these two rows).
    const pair = [partId, ...(peer ? [peer.id] : [])];
    const origins = new Map();
    pair.forEach((id) => {
      const el = rowRefs.current.get(id);
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      const scroller = el.closest('.gd-tex-panel') || el.closest('.gd-tex-viewer') || null;
      origins.set(id, r.top - (scroller ? scroller.scrollTop : 0));
    });
    flipOriginsRef.current = origins.size ? origins : null;
    flipTargetsRef.current = new Set(pair);
    flashPair(partId, peer ? peer.id : null);
    onSetParts(next);
  };

  // 0.32.0 — DELETE ASKS FIRST ("adding a confirmation to the delete"): a
  // misfire on the old key erased a part (and its prompt content) on the
  // spot. The part is undoable through the app's own history, so the window
  // says what it is without the "cannot be undone" scare line — DELETE
  // removes it, CANCEL keeps it. Without a confirm hand-down (tests,
  // standalone use) the key deletes directly, exactly as before.
  const deletePart = (partId) => {
    const victim = parts.find((p) => p.id === partId);
    const run = () => onSetParts(parts.filter((p) => p.id !== partId));
    if (!confirm) {
      run();
      return;
    }
    confirm({
      title: 'DELETE PART',
      message: `Delete "${stripRichText(victim?.name || 'part')}" and its prompt content from this version?`,
      confirmLabel: 'DELETE',
      danger: true,
      onConfirm: run,
    });
  };

  const addPart = () => {
    // 1.6.8 — a quiet crash fix swept in with the syntax pass: the seat
    // was a `const` the while-loop reassigned — adding a part whose
    // default name already existed ("Part 2") threw on the first bump.
    let index = parts.length + 1;
    let name = `Part ${index}`;
    while (parts.some((p) => p.name === name)) {
      index += 1;
      name = `Part ${index}`;
    }
    onSetParts([...parts, makePart(name)]);
  };

  const body = (
    <>
      <div className={plain ? '' : 'mt-3'} />
      <div className="space-y-2.5">
        {parts.length === 0 ? (
          /* 1.6.9 — THE EMPTY SEAT JOINS THE SWAP FLIGHT ("in the card
             switch feedback, just like the 'no images yet' gets faded,
             fade also the no parts yet area, aka the 'NO PARTS YET: SPLIT
             THIS VERSION'S PROMPT INTO NAMED PIECES' (on the way also
             shorten it to 'no parts yet')"): the empty prompt card sat
             OUTSIDE the switch feedback's seat list — every content seat
             around it breathed in on a card switch while the big empty box
             stayed solid, a hole in the flight. It carries a name now
             (.gd-parts-empty) and joins .gd-cv-swap's selector list in
             index.css, exactly the law the image stage's own empty mark
             already speaks (the 'no images yet' rides .gd-stage-pictures
             and fades with the pictures). The label speaks its short
             voice too — "no parts yet", the sentence the request named. */
          <div className="gd-panel p-4 flex flex-col items-center gap-2 gd-parts-empty">
            <span className="text-[20px] font-bold" style={{ color: 'color-mix(in srgb, var(--gd-ink) 25%, transparent)' }}>
              ✖
            </span>
            <span className="text-[10px] tracking-[0.18em] uppercase" style={{ color: 'var(--gd-mute)' }}>
              No parts yet
            </span>
          </div>
        ) : (
          parts.map((part, i) => {
            // 1.4.5 — the entrance rise belongs to FRESH parts alone; the
            // flash classes read the swap pair state.
            const fresh = !seenIdsRef.current.has(part.id);
            seenIdsRef.current.add(part.id);
            const flash =
              moveFlash && moveFlash.move === part.id
                ? 'move'
                : moveFlash && moveFlash.peer === part.id
                  ? 'peer'
                  : null;
            return (
              <PartRow
                key={part.id}
                part={part}
                index={i}
                total={parts.length}
                onPatch={patchPart}
                onMove={movePart}
                onDelete={deletePart}
                rowRef={setRowRef(part.id)}
                fresh={fresh}
                flash={flash}
                onExpand={openReader}
                expandPending={pendingExpand === part.id}
                onColor={openColor}
                onStatus={onStatus}
              />
            );
          })
        )}

        <button className="gd-btn w-full" style={{ color: 'var(--gd-panel-text)', borderColor: 'var(--gd-ink)' }} onClick={addPart}>
          <Plus size={13} />
          ADD PART
        </button>
      </div>

      {showHelp && (
        <p className="text-[10px] leading-relaxed mt-3" style={{ color: 'var(--gd-mute)' }}>
          Checked parts are joined into the composed output, one per line, in this order. Line breaks you type inside
          a part are kept as real line breaks.
        </p>
      )}
    </>
  );

  // 1.6.5 — the big editor window + the color window ride OUTSIDE the row
  // stack (Modal portals to the body): one window of each voice at a time,
  // keyed by the part they speak — portaled past every ancestor the right
  // panel could pinch them with (the 1.5.2 law).
  const readerWindow = expandedPart ? (
    <PromptExpandWindow key={expandedPart.id} part={expandedPart} onPatch={patchPart} onClose={() => setExpandedId(null)} />
  ) : null;
  const colorWindow = colorPart ? (
    <PartColorWindow key={colorPart.id} part={colorPart} onPatch={patchPart} onClose={() => setColorId(null)} />
  ) : null;

  if (plain) {
    return (
      <>
        {body}
        <AnimatePresence>{readerWindow}</AnimatePresence>
        <AnimatePresence>{colorWindow}</AnimatePresence>
      </>
    );
  }

  return (
    <div className="gd-card p-4">
      <div className="gd-rule">PROMPT PARTS</div>
      {body}
      <AnimatePresence>{readerWindow}</AnimatePresence>
      <AnimatePresence>{colorWindow}</AnimatePresence>
    </div>
  );
}
