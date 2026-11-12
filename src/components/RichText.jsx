import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Bold, Italic, Strikethrough, Underline } from 'lucide-react';
import {
  activeRichRangeKinds,
  adjustRichRanges,
  parseRichRanges,
  parseRichText,
  serializeRichText,
  stripRichKind,
  toggleRichRange,
} from '../utils/helpers.js';

// Render a name with inline markup. Formats stack, so any mix works
// (<b><g>bold + big</g></b>). Stray tokens never render — they are markup.
// 1.1.0 — the ref forwards to the rendered Tag (React 19 passes it as a
// plain prop): the grid card's title needs a measured handle (the name
// unfold's crop check reads scrollWidth/clientWidth off THIS element).
export function RichText({ text, className, style, as: Tag = 'span', ref }) {
  const segments = parseRichText(text);
  const hasFormat = segments.some((s) =>
    s.bold || s.italic || s.underline || s.strike || s.big || s.small || s.outline
  );
  if (!hasFormat) {
    return (
      <Tag className={className} style={style} ref={ref}>
        {String(text ?? '')}
      </Tag>
    );
  }
  return (
    <Tag className={className} style={style} ref={ref}>
      {segments.map((seg, i) => (
        <span
          key={i}
          className={clsx(
            seg.bold && 'rt-b',
            seg.italic && 'rt-i',
            seg.underline && 'rt-u',
            seg.strike && 'rt-s',
            seg.big && 'rt-big',
            seg.small && 'rt-small',
            seg.outline && 'rt-outline'
          )}
        >
          {seg.text}
        </span>
      ))}
    </Tag>
  );
}

// The formatting toolbar — a rounded pill anchored to the input's own edge.
// 0.11.0 restyle: the four text styles use their own lucide glyphs, the three
// size/outline buttons use self-demonstrating letters (a big A, a small A, a
// stroked A), hairline separators between neighbors, a lift on hover, a glow
// ring + accent fill when the format is live.
// 0.20.0 — the pill is PORTAL-RENDERED at document.body with position: fixed
// and a z-index above the modals. It used to be absolutely positioned inside
// the field's wrap, so whenever the input sat near the top of a MODAL body
// (the rename dialog's NAME field, right under the window header) the
// opening-above pill was clipped away by the body's own overflow box —
// "the formatting bar clips below certain headers". A body-level fixed
// layer can never be cut by any panel, header or scroller again; its left /
// top are recomputed live (selection change, any scroll, any resize) so it
// stays glued to the field while the page moves under it.
// Smart toggle (0.10.0 wording): a button lights up ONLY when the format
// already covers the WHOLE selection — pressing it then removes the format for
// exactly those letters. When the selection is only PARTLY formatted the
// button stays dark: pressing it bolds / italics / sizes the WHOLE selection
// first (apply-all beats remove). Same rule for every format button.
// 0.37.0 — UNDERLINE AND STRIKETHROUGH ARE TWO KEYS AGAIN ("i didnt mean
// underline and strikethrough to be like that, it should still be the two
// options it was before not merged, but i meant that in the text itself it
// should apply both not overwrite each other"): the 0.36.0 combo flyout is
// retired — one key per line format, no extra click to reach either. And
// the formats STACK now: the range model always let U and S overlap (they
// are different kinds), and the RENDER honors both at once (the CSS paints
// underline AND line-through on a doubly-marked run) — one no longer
// overwrites the other.
function RichToolbar({ onApply, active, tip }) {
  const btns = [
    { kind: 'bold', label: <Bold size={13} strokeWidth={2.6} />, title: 'Bold' },
    { kind: 'italic', label: <Italic size={13} strokeWidth={2.6} />, title: 'Italic' },
    { kind: 'underline', label: <Underline size={13} strokeWidth={2.6} />, title: 'Underline' },
    { kind: 'strike', label: <Strikethrough size={13} strokeWidth={2.6} />, title: 'Strikethrough' },
  ];
  const sizeBtns = [
    { kind: 'big', label: <span className="rt-big leading-none">A</span>, title: 'Bigger' },
    { kind: 'small', label: <span className="rt-small leading-none">A</span>, title: 'Smaller' },
    { kind: 'outline', label: <span className="rt-outline leading-none">A</span>, title: 'Outline' },
  ];
  if (!tip) return null;
  return createPortal(
    <div
      className={clsx('gd-rt-toolbar', tip.below ? 'rt-at-bottom' : 'rt-at-top')}
      style={{ left: tip.left, top: tip.top }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {btns.map((b) => (
        <button
          key={b.kind}
          type="button"
          className={clsx('gd-rt-btn', active.formats.includes(b.kind) && 'is-active')}
          title={
            active.formats.includes(b.kind)
              ? `${b.title}: the whole selection has it; press to remove it for these letters`
              : `${b.title}: press to apply it to the whole selection first`
          }
          onClick={() => onApply(b.kind)}
        >
          {b.label}
        </button>
      ))}
      {sizeBtns.map((b) => (
        <button
          key={b.kind}
          type="button"
          className={clsx('gd-rt-btn', active.formats.includes(b.kind) && 'is-active')}
          title={
            active.formats.includes(b.kind)
              ? `${b.title}: the whole selection has it; press to remove it for these letters`
              : `${b.title}: press to apply it to the whole selection first`
          }
          onClick={() => onApply(b.kind)}
        >
          {b.label}
        </button>
      ))}
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// 0.10.0 — WYSIWYG rich input, rebuilt as ONE layer.
//
// The 0.9.0 design painted the formatted text in a mirror BEHIND a
// transparent <input>. That could never stay glued: bold / italic / big /
// small all change glyph ADVANCE WIDTHS, so the moment a formatted run
// appeared, the input's caret, its selection rectangles and its scroll
// drifted off the visible text — the formats "broke", the text looked
// duplicated, and the translucent selection grey clipped into itself.
//
// Now the editor IS the formatted text: a single contentEditable box whose
// DOM is built from the model's segments. The caret and the selection are
// native and sit ON the real glyphs, so they can never desync. The marked
// string stays the storage format (serializeRichText), and edits re-anchor
// the format ranges in plain coordinates exactly as before:
//   · typing/deleting  → adjustRichRanges (common-prefix/suffix diff)
//   · toolbar toggles  → toggleRichRange (apply-all-first / remove-when-full)
//   · composition      → deferred to compositionend (IME never rebuilds early)
// The DOM is only rebuilt when it stops matching the model — plain typing
// leaves it (and the caret, and native undo) untouched.
// ---------------------------------------------------------------------------

const segClasses = (seg) =>
  [
    seg.bold && 'rt-b',
    seg.italic && 'rt-i',
    seg.underline && 'rt-u',
    seg.strike && 'rt-s',
    seg.big && 'rt-big',
    seg.small && 'rt-small',
    seg.outline && 'rt-outline',
  ]
    .filter(Boolean)
    .join(' ');

export default function RichInput({
  value,
  onChange,
  className,
  placeholder,
  autoFocus,
  inputRef: externalRef,
  onEnter,
  onKeyDown: callerKeyDown,
  // 1.0.5 — maxLength (plain characters, markup excluded): the field refuses
  // any edit that would push the PLAIN text past the cap — typing, dropping
  // and pasting alike — exactly like a native input's maxlength. Callers
  // keep their own validation on top.
  maxLength = null,
  // 1.0.5 — wrapClassName lands on the OUTER .gd-rt-wrap (the field's box),
  // so a caller can seat the field inside a flex row without the content
  // pushing its siblings around (flex-1 min-w-0 and friends).
  wrapClassName,
  // 1.0.5 — multiline: the field wraps instead of scrolling sideways, for
  // fields that grow DOWN within a bounded box (the tag manager's NAME).
  multiline = false,
  ...rest
}) {
  const innerRef = useRef(null);
  const ref = externalRef || innerRef;
  const [sel, setSel] = useState(null); // { start, end } (plain coords) while non-empty
  const [focused, setFocused] = useState(false);
  // 0.20.0 — the toolbar's fixed anchor {left, top, below} at body level
  // (recomputed while a selection is live: field geometry, any scroll, any
  // resize). Null while there is nothing to anchor.
  const [tip, setTip] = useState(null);
  // 0.24.0 — QUIET UNTIL THE USER INTERACTS. A programmatic selection (the
  // rename dialog's mount-time select-all) used to pop the formatting pill
  // open the instant the window appeared ("the text format pops
  // automatically"). The gate only opens on a REAL gesture — mouseup /
  // touchend / keyup on the field — so the toolbar shows for selections the
  // user actually made.
  const userTouchedRef = useRef(false);

  const { plain, ranges } = useMemo(() => parseRichRanges(value), [value]);
  const segments = useMemo(() => parseRichText(value), [value]);

  // Latest plain/ranges for the edit handlers (typing can outpace a re-render).
  const plainRef = useRef(plain);
  const rangesRef = useRef(ranges);
  plainRef.current = plain;
  rangesRef.current = ranges;

  // Caret/selection (plain coords) to restore after an imperative DOM rebuild.
  const pendingSelRef = useRef(null);
  // IME composition guard — never serialize mid-composition text.
  const composingRef = useRef(false);

  // ---- DOM <-> plain-offset mapping ----------------------------------------

  const textNodesUnder = (el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
    return nodes;
  };

  const offsetFromDomPoint = (el, node, localOffset) => {
    if (!node) return 0;
    try {
      const r = document.createRange();
      r.selectNodeContents(el);
      const max =
        node.nodeType === Node.TEXT_NODE ? node.textContent.length : node.childNodes.length;
      r.setEnd(node, Math.max(0, Math.min(localOffset, max)));
      return r.toString().replace(/\u00a0/g, ' ').length;
    } catch {
      return 0;
    }
  };

  const domPointFromOffset = (el, offset) => {
    const nodes = textNodesUnder(el);
    if (!nodes.length) return { node: el, offset: 0 };
    let count = 0;
    for (const n of nodes) {
      const len = n.textContent.length;
      if (offset <= count + len) return { node: n, offset: offset - count };
      count += len;
    }
    const last = nodes[nodes.length - 1];
    return { node: last, offset: last.textContent.length };
  };

  const getPlainSelection = (el) => {
    const s = window.getSelection();
    if (!s || s.rangeCount === 0) return null;
    const { anchorNode, anchorOffset, focusNode, focusOffset } = s;
    if (!anchorNode || !focusNode || !el.contains(anchorNode) || !el.contains(focusNode)) return null;
    const a = offsetFromDomPoint(el, anchorNode, anchorOffset);
    const b = offsetFromDomPoint(el, focusNode, focusOffset);
    return { start: Math.min(a, b), end: Math.max(a, b) };
  };

  const setPlainSelection = (el, start, end) => {
    const a = domPointFromOffset(el, Math.max(0, start));
    const b = domPointFromOffset(el, Math.max(0, end));
    const s = window.getSelection();
    if (!s) return;
    try {
      s.setBaseAndExtent(a.node, a.offset, b.node, b.offset);
    } catch {
      /* focus elsewhere — nothing to place */
    }
  };

  // ---- imperative DOM reconciliation ---------------------------------------

  const domMatchesModel = (el) => {
    if ((el.textContent ?? '').replace(/\u00a0/g, ' ') !== plain) return false;
    if (segments.length === 0) return el.childNodes.length === 0;
    if (el.childNodes.length !== segments.length) return false;
    for (let i = 0; i < segments.length; i += 1) {
      const node = el.childNodes[i];
      const seg = segments[i];
      const expected = segClasses(seg);
      if (node.nodeType === Node.TEXT_NODE) {
        if (expected) return false; // a formatted segment needs its span
        if (node.textContent !== seg.text) return false;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName !== 'SPAN') return false;
        if (node.getAttribute('class') !== expected) return false;
        if (node.textContent !== seg.text) return false;
      } else {
        return false;
      }
    }
    return true;
  };

  const rebuildDom = (el) => {
    el.textContent = '';
    for (const seg of segments) {
      const cls = segClasses(seg);
      if (!cls) {
        el.append(document.createTextNode(seg.text));
      } else {
        const span = document.createElement('span');
        span.className = cls;
        span.textContent = seg.text;
        el.append(span);
      }
    }
  };

  // Runs on mount and whenever the VALUE changes (typing, toggles, undo,
  // parent resets). Typing normally leaves the DOM already matching — the
  // native caret is left exactly where the user put it. Only a real mismatch
  // rebuilds, and then the pending selection is put back.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (domMatchesModel(el)) return;
    rebuildDom(el);
    if (document.activeElement === el) {
      const p = pendingSelRef.current || { start: plain.length, end: plain.length };
      setPlainSelection(el, p.start, p.end);
    }
    pendingSelRef.current = null;
    // plain & segments are derived from value on this render.
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus like a fresh input — caret at the end.
  useEffect(() => {
    if (!autoFocus) return;
    const el = ref.current;
    if (!el) return;
    el.focus();
    setPlainSelection(el, plain.length, plain.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  // ---- selection tracking (toolbar) ----------------------------------------

  const syncSelection = useCallback(
    (fromUser = false) => {
      const el = ref.current;
      if (!el || document.activeElement !== el) return;
      // The quiet gate: selections that arrive without a user gesture (the
      // mount-time select-all, focus carets) never open the toolbar.
      if (fromUser) userTouchedRef.current = true;
      if (!userTouchedRef.current) return;
      const next = getPlainSelection(el);
      setSel((prev) => {
        const norm = next && next.start !== next.end ? next : null;
        if (prev?.start === norm?.start && prev?.end === norm?.end) return prev;
        return norm;
      });
    },
    [ref]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const onSelect = () => syncSelection();
    const onUserGesture = () => syncSelection(true);
    // 0.36.0 — THE FIRST-SELECTION FIX ("when i select the text for the first
    // time for some reason it doesnt popup the format window"): the gate
    // used to open ONLY on a mouseup/touchend that landed INSIDE the field —
    // a drag that ended a hair past the text (or past the field's edge)
    // released outside, the gate stayed shut, and the FIRST selection made
    // in a fresh window showed nothing until the user tried again. Two more
    // gestures now open the gate: selectstart (the drag BEGINS inside the
    // field, always) and a document-level pointerup (the release lands
    // anywhere at all). The quiet gate itself stays — programmatic
    // selections (the mount-time select-all) still never open the toolbar.
    el.addEventListener('selectstart', onUserGesture);
    el.addEventListener('keyup', onUserGesture);
    el.addEventListener('mouseup', onUserGesture);
    el.addEventListener('touchend', onUserGesture);
    document.addEventListener('pointerup', onUserGesture);
    document.addEventListener('selectionchange', onSelect);
    return () => {
      el.removeEventListener('selectstart', onUserGesture);
      el.removeEventListener('keyup', onUserGesture);
      el.removeEventListener('mouseup', onUserGesture);
      el.removeEventListener('touchend', onUserGesture);
      document.removeEventListener('pointerup', onUserGesture);
      document.removeEventListener('selectionchange', onSelect);
    };
  }, [ref, syncSelection]);

  // 0.20.0 — anchor math for the PORTALED toolbar: the pill floats at body
  // level, fixed, glued to this field's live rect. While a selection exists
  // it follows every scroll (capture phase — any scroller in the app), every
  // resize, and re-picks its emerge side once per selection: a field near the
  // top of the window flips the pill BELOW the box so it never touches the
  // window chrome; otherwise it opens above, hugging the field's top edge.
  // 0.24.0 — ANIMATION-AWARE MEASURING: the modal's entry animation (scale
  // + slide, ~160ms) used to be mid-flight when the first measurement ran,
  // parking the pill a few pixels too low until the selection changed
  // ("hovered too low, but when i close it and open it again it's in the
  // right position"). The anchor now re-measures on a short rAF streak
  // after the selection starts, so it settles onto the field's FINAL
  // geometry whatever is still animating underneath.
  useEffect(() => {
    if (!sel) {
      setTip(null);
      return undefined;
    }
    const el = ref.current;
    if (!el || typeof el.getBoundingClientRect !== 'function') return undefined;
    let raf = 0;
    let frames = 0;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (!r) return;
      const below = r.top < 150;
      const next = {
        left: Math.round(r.left + r.width / 2),
        top: Math.round(below ? r.bottom + 4 : r.top - 4),
        below,
      };
      setTip((prev) =>
        prev && prev.left === next.left && prev.top === next.top && prev.below === next.below ? prev : next
      );
    };
    const streak = () => {
      measure();
      if (frames < 22) {
        frames += 1;
        raf = requestAnimationFrame(streak);
      }
    };
    streak();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true); // capture: ANY scroller moves the field
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [sel?.start, sel?.end, ref]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeFormats = sel ? activeRichRangeKinds(rangesRef.current, sel.start, sel.end) : [];

  // Toolbar toggle. The selection is kept (and restored after the rebuild)
  // so the toolbar stays open for the next press.
  const applyFormat = (kind) => {
    const el = ref.current;
    if (!el || !sel) return;
    // 0.36.0 — SIZE FORMATS ARE EXCLUSIVE ("if i tap the big while its small
    // it will turn off small and become big, or when its big and i press
    // small it should be small and switch off the big"): applying BIG over
    // a selection that (even partly) wears SMALL lifts SMALL off exactly
    // those letters first — and vice versa. Pressing the format the
    // selection already wears fully stays a plain remove (the smart toggle).
    let baseRanges = rangesRef.current;
    const rival = kind === 'big' ? 'small' : kind === 'small' ? 'big' : null;
    if (rival && !activeRichRangeKinds(baseRanges, sel.start, sel.end).includes(kind)) {
      baseRanges = stripRichKind(baseRanges, sel.start, sel.end, rival);
    }
    const { ranges: nextRanges } = toggleRichRange(baseRanges, sel.start, sel.end, kind);
    pendingSelRef.current = { start: sel.start, end: sel.end };
    onChange(serializeRichText(plainRef.current, nextRanges));
  };

  // ---- editing --------------------------------------------------------------

  // 1.0.5 — THE CAP ("it would have a character limit of 35 characters").
  // beforeinput sees every insertion BEFORE it lands, so the refusal is
  // invisible: nothing is typed, dropped or pasted past the cap, exactly
  // like a native maxlength. Deletions always pass (they only shrink).
  // 1.0.6 — PASTE/DROP PAYLOADS RIDE e.dataTransfer ("clipboard paste should
  // not bypass it"): Chromium leaves `e.data` null for insertFromPaste /
  // insertFromDrop / insertReplacementText — the text rides the event's
  // dataTransfer instead. The old guard read only `e.data`, so those events
  // carried an EMPTY payload through the check and sailed past unprevented;
  // now the transfer is read (and any overflow is refused up front).
  const insertedTextOf = (e) => {
    if (e.data != null) return String(e.data);
    try {
      return e.dataTransfer?.getData('text/plain') ?? '';
    } catch {
      return '';
    }
  };
  const capOf = (inserted) => {
    if (maxLength == null) return true;
    const el = ref.current;
    const sel = el ? getPlainSelection(el) : null;
    const kept = sel ? plainRef.current.length - (sel.end - sel.start) : plainRef.current.length;
    return kept + (inserted || '').length <= maxLength;
  };
  const handleBeforeInput = (e) => {
    if (maxLength == null) return;
    if (!e.preventDefault) return;
    let inserted = '';
    if (e.inputType === 'insertText' || e.inputType === 'insertCompositionText') inserted = e.data || '';
    else if (e.inputType === 'insertFromPaste' || e.inputType === 'insertFromDrop' || e.inputType === 'insertReplacementText')
      inserted = insertedTextOf(e);
    else if (e.inputType === 'insertParagraph' || e.inputType === 'insertLineBreak') inserted = '\n';
    else return; // deletions & formatting commands always pass
    if (!capOf(inserted)) e.preventDefault();
  };

  // 1.0.6 — THE MODEL-LEVEL NET ("clipboard paste should not bypass it"):
  // the LAST line of defense, independent of EVERY entry path — typing,
  // the paste event, the menu's main-process paste, a drop, an IME, an undo,
  // even a caller handing the field an over-long value. Whenever the plain
  // text somehow exceeds the cap, the model itself is trimmed back to it
  // (ranges re-anchored to the truncated text) and the trimmed value is
  // pushed through onChange. It only ever SHRINKS — nothing else moves.
  useEffect(() => {
    if (maxLength == null || plain.length <= maxLength) return;
    const nextPlain = plain.slice(0, maxLength);
    const nextRanges = adjustRichRanges(rangesRef.current, plain, nextPlain);
    onChange(serializeRichText(nextPlain, nextRanges));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plain, maxLength]);

  const handleInput = () => {
    const el = ref.current;
    if (!el) return;
    let newPlain = (el.textContent ?? '').replace(/\u00a0/g, ' ');
    // 1.0.5 — SAFETY NET: an edit that slipped past the cap (a composition,
    // an execCommand path) is trimmed to the limit here, ranges re-anchored
    // to the truncated text.
    if (maxLength != null && newPlain.length > maxLength) newPlain = newPlain.slice(0, maxLength);
    if (newPlain === plainRef.current) {
      // No textual change (e.g. something non-textual was dropped in). If the
      // DOM picked up foreign nodes (an image, stray markup), snap it back to
      // the model so it never lingers in the field.
      if (!domMatchesModel(el)) {
        const keep = getPlainSelection(el);
        rebuildDom(el);
        if (keep && document.activeElement === el) setPlainSelection(el, keep.start, keep.end);
      }
      return;
    }
    const nextRanges = adjustRichRanges(rangesRef.current, plainRef.current, newPlain);
    pendingSelRef.current = getPlainSelection(el);
    onChange(serializeRichText(newPlain, nextRanges));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // A name field is single-line — never let contentEditable break it.
      e.preventDefault();
      if (onEnter) onEnter(e);
    }
    if (typeof callerKeyDown === 'function') callerKeyDown(e);
  };

  const handlePaste = (e) => {
    // Paste is ALWAYS plain text — formatting joins through the toolbar only.
    e.preventDefault();
    let text = (e.clipboardData?.getData('text/plain') ?? '').replace(/\u00a0/g, ' ');
    if (!text) return;
    // 1.0.5 — a paste also respects the cap: only as much as fits rides in
    // (the beforeinput guard usually refuses it whole; this trims when the
    // caller wired execCommand around it).
    if (maxLength != null) {
      const el = ref.current;
      const sel = el ? getPlainSelection(el) : null;
      const kept = sel ? plainRef.current.length - (sel.end - sel.start) : plainRef.current.length;
      text = text.slice(0, Math.max(0, maxLength - kept));
      if (!text) return;
    }
    if (typeof document.execCommand === 'function') document.execCommand('insertText', false, text);
  };
  // 1.0.6 — THE CAP'S OWN VOICE ("show feedback about the character limit,
  // like current / max"): every capped field carries a tiny tabular counter
  // under its right edge — current/max — always on (it advertises the
  // budget the moment the window opens, not only once you start typing),
  // dim mute at rest and accent the moment the field is FULL. The count is
  // PLAIN characters (markup excluded), the same measure the cap enforces.
  const atCap = maxLength != null && plain.length >= maxLength;

  return (
    <div className={clsx('gd-rt-wrap', wrapClassName)}>
      {sel && focused && <RichToolbar onApply={applyFormat} active={{ formats: activeFormats }} tip={tip} />}
      <div
        {...rest}
        ref={ref}
        role="textbox"
        aria-label={placeholder}
        className={clsx('gd-input gd-rt-edit', multiline && 'gd-rt-edit-multiline', className)}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        data-placeholder={placeholder}
        onBeforeInput={handleBeforeInput}
        onInput={() => {
          if (!composingRef.current) handleInput();
        }}
        onCompositionStart={() => {
          composingRef.current = true;
        }}
        onCompositionEnd={() => {
          composingRef.current = false;
          handleInput();
        }}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={() => {
          setFocused(true);
          syncSelection();
        }}
        onBlur={() => {
          setFocused(false);
          setSel(null);
        }}
      />
      {maxLength != null && (
        <div className="gd-rt-count-row" aria-hidden>
          <span className={clsx('gd-rt-count', atCap && 'is-max')} title={`${plain.length} of ${maxLength} characters`}>
            {plain.length}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
}
