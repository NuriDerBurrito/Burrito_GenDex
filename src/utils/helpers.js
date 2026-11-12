// Pure logic helpers — no DOM, no Electron, no React. Safe to unit-test in node.
import {
  CARD_FINISHES,
  CARD_TRIMS,
  CHIP_COLORS,
  DEFAULT_CARD_FINISH,
  isCardFinish,
  migrateCardFinish,
  DEFAULT_CARD_TRIM,
  DEFAULT_SETTINGS,
  DEFAULT_STAMP_COLOR,
  ICON_GROUPS,
  LEGACY_RICH_TOKENS,
  RICH_TOKENS,
  ROOT_CLASS_ID,
  SORT_MODES,
  LOG_LIMIT_RANGE,
  clampLogLimit,
  STAMP_SCALE_RANGE,
  TAG_LIMIT_RANGE,
  TAG_SCALE_RANGE,
  TAG_SEPARATION_RANGE,
  TEXTURES,
  TEX_SURFACES,
  THEME_PRESETS,
  ZOOM_RANGE,
  clampCardColWidth,
  clampPanelWidth,
  clampSidebarWidth,
  DEFAULT_SHORTCUTS,
  SHORTCUT_ACTIONS,
  isComboStr,
  isLetterIcon,
  sanitizeStampAlpha,
  sanitizeStampHueAlpha,
  sanitizeStampSettings,
  normalizeFinishTransparency,
} from '../constants/index.js';

const ICON_NAMES = new Set(ICON_GROUPS.flatMap((g) => g.list));
const TRIM_IDS = new Set(CARD_TRIMS.map((t) => t.id));
const isValidIconName = (icon) =>
  (typeof icon === 'string' && ICON_NAMES.has(icon)) || isLetterIcon(icon);

// ---------------------------------------------------------------------------
// Rich text — inline markup for names. 0.7.0 uses TAG tokens: <b>…</b>, <i>…</i>
// etc. (codes from RICH_TOKENS). Tags stack, so formats MIX. An unbalanced
// tag is treated as literal text ONLY when it can't pair; the parser drops
// unpaired OPEN/CLOSE tokens at the ends so they never leak into rendered
// text. Plain names containing / + = _ ^ ~ * are untouched content now.
// ---------------------------------------------------------------------------

const KIND_ORDER = Object.keys(RICH_TOKENS);
const KIND_BY_CODE = {};
for (const kind of KIND_ORDER) KIND_BY_CODE[RICH_TOKENS[kind]] = kind;
// <b> </b> <i> </i> … one-letter codes only — cheap, unambiguous prefix check.
const TAG_RE = /^<(\/?)([biusgmo])>/;

// 1.8.6 — THE WHEEL'S OWN DOOR (see the .gd-wheel law in index.css — THE
// WHEEL THAT OUTLIVES THE FREEZE): every loading road sets its pending
// state, THEN hands its heavy work through this door. The door waits for
// TWO animation frames and one macrotask: the state's render commits
// before the first frame, the browser PAINTS the wheel (and promotes its
// will-change layer, starting the compositor's rotation) between the two
// frames, and only then does the heavy work run — so when the work
// freezes the main thread (the big editor's mount, the settings window,
// the new card's build), the wheel is already on screen and the
// compositor keeps it turning through the whole freeze, exactly as the
// report demands ("ensure the wheel works even when app is frozen since
// it does freeze when these actions occur"). Without the door the work
// would land in the SAME task as the press — React never renders, nothing
// paints, and the freeze owns the first frame the user ever sees. The
// rAF guards (jsdom and other window-less harnesses fall back to a plain
// timeout) keep the helper honest everywhere the app can run.
export function deferToPaint(commit) {
  if (typeof commit !== 'function') return;
  const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn) => setTimeout(fn, 0);
  raf(() => {
    raf(() => {
      setTimeout(commit, 0);
    });
  });
}

// 1.9.1 — THE REVEAL WAITS FOR THE PAINT ("when images are loading with
// the circle, when the circle vanishes the image is still blurry for
// another second or so, something funky seems to be going on fix that"):
// the 1.9.0 law made the wheel ride the picture's own word — but the
// word it listened for was the LOAD, and a load is not a paint. The
// full-res <img> mounts with decoding="async", and Chromium is free to
// fire the load event (and to flag img.complete) while the raster is
// still decoding on another thread: the element answers "loaded", the
// veil retires its wheel, the sharp layer takes its opacity — and paints
// NOTHING yet, its texture not resident. What stays on screen is the
// blurred placeholder alone, wheel already gone: exactly the reported
// second of ghost blur. The cure moves the word one step deeper: the
// mark lands only after the element's own decode() promise resolves
// (it answers when the raster is truly ready, instantly when it already
// was) AND two frames have committed — the frame that paints the decoded
// picture exists by then, so the wheel's 0.24s farewell and the picture's
// own clearing speak in the same breath. Two rails keep the law honest
// everywhere: rAF never fires behind an alt-tabbed window (the 1.7.0
// family), so a short timeout says the word anyway once decode has
// answered; and a decode that never answers at all (a stalled raster, a
// hidden window's frozen pipeline) is capped by an absolute rail, so the
// wheel can never spin into forever — the old law returns for exactly
// that one dark case, and only it.
export function revealImgWhenPainted(el, mark) {
  if (!el || typeof mark !== 'function') return;
  let spoken = false;
  const say = () => {
    if (spoken) return;
    spoken = true;
    mark();
  };
  let decoded = Promise.resolve();
  try {
    if (typeof el.decode === 'function') decoded = el.decode();
  } catch {
    /* an engine without decode() keeps the old onLoad law — say it now */
  }
  Promise.resolve(decoded)
    .catch(() => {}) // a broken image still deserves its farewell wheel
    .then(() => {
      const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn) => setTimeout(fn, 0);
      raf(() => {
        raf(() => {
          say();
        });
      });
      // the hidden-window rail: rAF is frozen behind an alt-tab, but the
      // decode has answered — the paint is one focus away.
      setTimeout(say, 300);
    });
  // the absolute rail: a decode that never answers must not arm the
  // veil forever — better the old disease for one dark case than a
  // wheel that outlives the picture.
  setTimeout(say, 1500);
}

// Tokenize a marked string into { plain, ranges, markedToPlainIdx }.
// ranges = [{ kind, start, end }] on PLAIN coordinates (end exclusive);
// markedToPlainIdx[i] maps a marked-string index to its plain boundary.
export function parseRichRanges(input) {
  const str = String(input ?? '');
  const plainParts = [];
  const markedToPlainIdx = new Array(str.length + 1);
  const ranges = [];
  const stack = []; // [{ kind, start }] — open kinds, innermost last
  let p = 0;
  for (let i = 0; i < str.length; ) {
    markedToPlainIdx[i] = p;
    const m = str[i] === '<' ? TAG_RE.exec(str.slice(i, i + 4)) : null;
    if (m) {
      const kind = KIND_BY_CODE[m[2]];
      if (kind) {
        const tokenLen = m[1] ? 4 : 3; // "</b>" vs "<b>"
        if (m[1]) {
          // Closing: everything opened after it auto-closes here too.
          const si = stack.findIndex((s) => s.kind === kind);
          if (si >= 0) {
            for (let k = stack.length - 1; k >= si; k -= 1) {
              const entry = stack[k];
              if (entry.start < p) ranges.push({ kind: entry.kind, start: entry.start, end: p });
            }
            stack.length = si;
          }
          // A stray close with no matching open is markup noise — dropped.
        } else {
          stack.push({ kind, start: p });
        }
        i += tokenLen;
        continue;
      }
    }
    plainParts.push(str[i]);
    p += 1;
    i += 1;
  }
  markedToPlainIdx[str.length] = p;
  for (const entry of stack) {
    if (entry.start < p) ranges.push({ kind: entry.kind, start: entry.start, end: p });
  }
  // 0.11.0: merged at the source — "<b>ab</b><b>cd</b>" parses to ONE bold
  // run [0,4) so every consumer (highlight, toggle, re-serialize) sees the
  // same thing the reader sees: it is all just bold.
  return { plain: plainParts.join(''), ranges: mergeRichRanges(ranges), markedToPlainIdx };
}

// Serialize plain + ranges back to a marked string, emitting tokens around
// each constant-style run (nested per segment, canonical open order). Returns
// { marked, startMap, endMap } — startMap[i] is the marked index where plain
// char i's content starts (after the open tokens), endMap[i] the marked index
// where the content ending at plain boundary i stops (before the close
// tokens). Selections mapped through them wrap ONLY the content.
function serializeRich(plain, ranges) {
  const list = mergeRichRanges(ranges);
  ranges = list;
  const points = new Set([0, plain.length]);
  for (const r of ranges) {
    points.add(r.start);
    points.add(r.end);
  }
  const sorted = [...points].sort((a, b) => a - b);
  const startMap = new Array(plain.length + 1).fill(0);
  const endMap = new Array(plain.length + 1).fill(0);
  let marked = '';
  for (let si = 0; si < sorted.length; si += 1) {
    const from = sorted[si];
    const to = si + 1 < sorted.length ? sorted[si + 1] : plain.length;
    if (to <= from) continue;
    const kinds = KIND_ORDER.filter((k) => ranges.some((r) => r.kind === k && r.start <= from && r.end >= to));
    for (const k of kinds) marked += `<${RICH_TOKENS[k]}>`;
    const contentStart = marked.length;
    for (let i = from; i < to; i += 1) {
      startMap[i] = contentStart + (i - from);
      marked += plain[i];
    }
    endMap[to] = marked.length; // before the close tokens
    for (let k = kinds.length - 1; k >= 0; k -= 1) marked += `</${RICH_TOKENS[kinds[k]]}>`;
  }
  startMap[plain.length] = endMap[plain.length];
  return { marked, startMap, endMap };
}

// Parse markup into rendering segments [{ text, bold?, italic?, ... }].
// Adjacent characters sharing the same format set merge into one segment.
export function parseRichText(input) {
  const { plain, ranges } = parseRichRanges(input);
  if (!plain) return [];
  if (!ranges.length) return [{ text: plain }];
  const segs = [];
  let run = null;
  let runKey = null;
  for (let i = 0; i < plain.length; i += 1) {
    const kinds = {};
    for (const r of ranges) {
      if (r.start <= i && r.end > i) kinds[r.kind] = true;
    }
    const key = Object.keys(kinds).sort().join(',');
    if (!run || key !== runKey) {
      run = { text: plain[i], ...kinds };
      runKey = key;
      segs.push(run);
    } else {
      run.text += plain[i];
    }
  }
  return segs;
}

// Plain text with ALL markup removed (search, sorting, selects, confirms).
// Stray unpaired tokens are dropped too — they never render as content.
export function stripRichText(input) {
  return parseRichRanges(input).plain;
}

// One-time migration for 0.5.0–0.6.0 data: the old single-char tokens
// (* / + = ^ _ ~) are re-read with the OLD rules — but ONLY when a token can
// PAIR with another of the same kind. Anything unpaired stays literal content
// (older builds ate it; here the user's letters win). Detected pairs are
// re-serialized as 0.7.0 inline tags. Strings without paired legacy markup
// return unchanged.
export function migrateLegacyRich(input) {
  const str = String(input ?? '');
  if (!str) return str;
  const legacyByChar = {};
  for (const kind of Object.keys(LEGACY_RICH_TOKENS)) legacyByChar[LEGACY_RICH_TOKENS[kind]] = kind;
  const hasLegacy = Object.values(LEGACY_RICH_TOKENS).some((c) => str.includes(c));
  if (!hasLegacy) return str;

  // Pass 1 — classify: a legacy char is markup ONLY when it closes a pair
  // (the close char + every still-open token it flushes). Unclosed opens are
  // orphans and keep their char as literal content.
  const matched = new Array(str.length).fill(false);
  const probe = [];
  for (let i = 0; i < str.length; i += 1) {
    const kind = legacyByChar[str[i]];
    if (!kind) continue;
    const si = probe.findIndex((s) => s.kind === kind);
    if (si >= 0) {
      matched[i] = true;
      for (let k = probe.length - 1; k >= si; k -= 1) matched[probe[k].idx] = true;
      probe.length = si;
    } else {
      probe.push({ kind, idx: i });
    }
  }
  if (!matched.some(Boolean)) return str; // no paired legacy markup at all

  // Pass 2 — rebuild the plain string (orphans included as content) and the
  // ranges on the FINAL plain coordinates, then serialize as inline tags.
  let plain = '';
  const ranges = [];
  const open = [];
  for (let i = 0; i < str.length; i += 1) {
    if (matched[i]) {
      const kind = legacyByChar[str[i]];
      const si = open.findIndex((s) => s.kind === kind);
      if (si >= 0) {
        for (let k = open.length - 1; k >= si; k -= 1) {
          if (open[k].start < plain.length) ranges.push({ kind: open[k].kind, start: open[k].start, end: plain.length });
        }
        open.length = si;
      } else {
        open.push({ kind, start: plain.length });
      }
    } else {
      plain += str[i];
    }
  }
  if (!ranges.length) return str;
  const { marked } = serializeRich(plain, ranges);
  return marked;
}

// Canonicalize a range list: same-kind runs that OVERLAP or simply TOUCH
// (…[0,2)+[2,5)…) are one run to every consumer — the toolbar highlight, the
// toggle, the serializer. Without this, bolding "ab" and "cd" separately
// leaves two touching ranges: the selection [0,4) is fully bold yet NO single
// range covers it, so the B button refuses to light up (the 0.11.0 bug) and
// the first press merely re-merges instead of removing. Merged here, parsed
// ranges round-trip "<b>ab</b><b>cd</b>" back as "<b>abcd</b>".
export function mergeRichRanges(ranges) {
  const list = (Array.isArray(ranges) ? ranges : [])
    .filter((r) => r && KIND_ORDER.includes(r.kind) && Number.isFinite(r.start) && Number.isFinite(r.end) && r.end > r.start)
    .map((r) => ({ kind: r.kind, start: r.start, end: r.end }));
  list.sort((a, b) => (a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : a.start - b.start));
  const out = [];
  for (const r of list) {
    const prev = out[out.length - 1];
    if (prev && prev.kind === r.kind && r.start <= prev.end) {
      if (r.end > prev.end) prev.end = r.end;
      continue;
    }
    out.push(r);
  }
  return out;
}

// Does one kind's runs fully cover [ps, pe) with NO gaps (union coverage)?
// A single run covering the span qualifies; several touching runs qualify
// too; a one-letter gap disqualifies (the user's rule: "at least one letter
// or space that lacks it -> not highlighted").
const kindCovers = (list, kind, ps, pe) => {
  const runs = list
    .filter((r) => r.kind === kind && r.end > ps && r.start < pe)
    .sort((a, b) => a.start - b.start);
  let coveredTo = ps;
  for (const r of runs) {
    if (r.start > coveredTo) return false; // gap before this run
    if (r.end > coveredTo) coveredTo = r.end;
    if (coveredTo >= pe) return true;
  }
  return coveredTo >= pe;
};

// Serialize plain + ranges to a marked string. Public wrapper — the editable
// fields keep a marked string in storage but EDIT in plain coordinates.
export function serializeRichText(plain, ranges) {
  return serializeRich(String(plain ?? ''), Array.isArray(ranges) ? ranges : []).marked;
}

// 0.9.0 — the editors are WYSIWYG: the input holds PLAIN text and a mirror
// behind it renders the formats, so the syntax never shows while writing.
// These three work on plain coordinates directly.

// Which formats fully cover [ps, pe) (plain coords) — toolbar highlighting.
// 0.11.0: COVERAGE-based — every selected letter must carry the format, no
// matter how many runs it takes (one bold run or several touching ones). A
// single uncovered letter or space and the kind is NOT active.
export function activeRichRangeKinds(ranges, ps, pe) {
  const list = Array.isArray(ranges) ? ranges : [];
  if (!Number.isFinite(ps) || !Number.isFinite(pe) || ps >= pe) return [];
  return KIND_ORDER.filter((k) => kindCovers(list, k, ps, pe));
}

// Toggle a format for exactly [ps, pe) (plain coords). If the format already
// covers the whole selection it is removed from those letters (the range is
// split around them); otherwise applied, merging with neighbours. Returns
// { ranges, selStart, selEnd } — the selection is untouched (plain length
// never changes on a toggle).
export function toggleRichRange(ranges, ps, pe, kind) {
  const list = mergeRichRanges(ranges);
  if (!KIND_ORDER.includes(kind) || !Number.isFinite(ps) || !Number.isFinite(pe) || ps >= pe) {
    return { ranges: list, selStart: ps, selEnd: pe };
  }

  // 0.11.0: the remove-vs-apply decision uses the SAME coverage rule as the
  // toolbar highlight — a fully-covered selection removes, anything else
  // applies to the whole selection first.
  const active = kindCovers(list, kind, ps, pe);
  let nextRanges;
  if (active) {
    nextRanges = [];
    for (const r of list) {
      if (r.kind !== kind || r.end <= ps || r.start >= pe) {
        nextRanges.push(r);
        continue;
      }
      if (r.start < ps) nextRanges.push({ kind, start: r.start, end: ps });
      if (r.end > pe) nextRanges.push({ kind, start: pe, end: r.end });
    }
  } else {
    const others = [];
    let s = ps;
    let e = pe;
    for (const r of list) {
      if (r.kind !== kind) {
        others.push(r);
      } else if (r.start <= e && r.end >= s) {
        s = Math.min(s, r.start);
        e = Math.max(e, r.end);
      } else {
        others.push(r);
      }
    }
    nextRanges = [...others, { kind, start: s, end: e }];
  }

  return { ranges: mergeRichRanges(nextRanges), selStart: ps, selEnd: pe };
}

// 0.36.0 — SIZE FORMATS ARE EXCLUSIVE ("the small letter and big letter
// should switch, so if i tap the big while its small it will turn off small
// and become big"): lifts a format OFF exactly the letters that intersect
// [ps, pe) — the surrounding coverage outside the span keeps the format.
// Used by the editor before applying BIG over SMALL (and vice versa), so a
// letter is never both at once.
export function stripRichKind(ranges, ps, pe, kind) {
  const list = mergeRichRanges(ranges);
  if (!KIND_ORDER.includes(kind) || !Number.isFinite(ps) || !Number.isFinite(pe) || ps >= pe) {
    return list;
  }
  const next = [];
  for (const r of list) {
    if (r.kind !== kind || r.end <= ps || r.start >= pe) {
      next.push(r);
      continue;
    }
    if (r.start < ps) next.push({ kind, start: r.start, end: ps });
    if (r.end > pe) next.push({ kind, start: pe, end: r.end });
  }
  return mergeRichRanges(next);
}

// Re-anchor ranges after a plain-text edit. The edit is located with a
// common-prefix / common-suffix diff, so it works for typing, deletion,
// paste, cut, drag-and-drop and native undo alike:
//   · ranges after the edit shift by the length delta
//   · ranges spanning the edit extend over inserted text (typing inside a
//     bold run stays bold)
//   · ranges starting exactly at the edit point do NOT swallow the inserted
//     text (typing just before a bold run stays plain)
//   · ranges whose text was fully deleted vanish
export function adjustRichRanges(ranges, oldPlain, newPlain) {
  const list = mergeRichRanges(ranges);
  const a = String(oldPlain ?? '');
  const b = String(newPlain ?? '');
  if (a === b) return list;

  let p = 0;
  while (p < a.length && p < b.length && a[p] === b[p]) p += 1;
  let ea = a.length;
  let eb = b.length;
  while (ea > p && eb > p && a[ea - 1] === b[eb - 1]) {
    ea -= 1;
    eb -= 1;
  }
  if (p === ea && eb === p) return list; // no textual change

  const delta = eb - ea;
  const mapStart = (x) => (x < p ? x : x >= ea ? x + delta : eb);
  const mapEnd = (x) => (x <= p ? x : x >= ea ? x + delta : p);
  const out = [];
  for (const r of list) {
    const start = mapStart(r.start);
    const end = mapEnd(r.end);
    if (end > start) out.push({ kind: r.kind, start, end });
  }
  return mergeRichRanges(out);
}

// ---------------------------------------------------------------------------
// Compose engine
// ---------------------------------------------------------------------------

// Normalize a part's text for composing: CRLF -> LF, trailing spaces per
// line trimmed, and runs of 3+ line breaks collapse to ONE blank line. The
// line breaks the user typed (Enter) are KEPT — the composed output renders
// them as real line breaks, never as spaces (0.8.0).
export function normalizePartText(input) {
  return String(input ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// The compose rule: included parts, normalized, joined with exactly ONE
// newline. Included-but-empty parts are skipped so no blank lines can ever
// appear between parts. Line breaks INSIDE a part survive.
export function composeVersionOutput(version) {
  const parts = Array.isArray(version?.parts) ? version.parts : [];
  return parts
    .filter((p) => p && p.include)
    .map((p) => normalizePartText(p.content))
    .filter(Boolean)
    .join('\n');
}

export function countOutputStats(version) {
  const parts = Array.isArray(version?.parts) ? version.parts : [];
  const included = parts.filter((p) => p && p.include);
  const skipped = included.filter((p) => !normalizePartText(p.content)).length;
  const output = composeVersionOutput(version);
  // 0.28.0 — WORDS joins the ledger (the compose sheet's stat strip).
  const words = output ? (output.match(/\S+/g) || []).length : 0;
  return {
    total: parts.length,
    included: included.length,
    skipped,
    chars: output.length,
    words,
    lines: output ? output.split('\n').length : 0,
    output,
  };
}

// ---------------------------------------------------------------------------
// Versions & characters
// ---------------------------------------------------------------------------

export function nextVersionLabel(versions = []) {
  let max = 0;
  for (const v of versions || []) {
    const m = /^v(\d+)$/i.exec(String(v?.label || '').trim());
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `V${max + 1}`;
}

// The card cover source: explicit preview version, else newest by createdAt.
export function getPreviewVersion(character) {
  const versions = Array.isArray(character?.versions) ? character.versions : [];
  if (!versions.length) return null;
  const explicit = versions.find((v) => v?.id === character.previewVersionId);
  if (explicit) return explicit;
  return [...versions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
}

export function sortCharacters(characters, mode) {
  const list = Array.isArray(characters) ? [...characters] : [];
  const nameOf = (c) => stripRichText(c?.name || '');
  if (mode === 'custom') {
    return list; // array order is the source of truth for manual arrangement
  }
  if (mode === 'oldest') {
    return list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }
  if (mode === 'az') {
    return list.sort((a, b) => nameOf(a).localeCompare(nameOf(b), undefined, { sensitivity: 'base', numeric: true }));
  }
  if (mode === 'za') {
    return list.sort((a, b) => nameOf(b).localeCompare(nameOf(a), undefined, { sensitivity: 'base', numeric: true }));
  }
  return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // newest
}

// Search. Default: CHARACTER NAMES ONLY. With advanced: also prompt part
// names/contents and version names/notes. Tags are NEVER searched.
export function searchCharacters(characters, query, opts = {}) {
  const q = String(query || '').trim().toLowerCase();
  const list = Array.isArray(characters) ? characters : [];
  if (!q) return list;
  const advanced = !!opts.advanced;
  return list.filter((c) => {
    if (stripRichText(c?.name || '').toLowerCase().includes(q)) return true;
    if (!advanced) return false;
    return (c?.versions || []).some(
      (v) =>
        stripRichText(v?.label || '').toLowerCase().includes(q) ||
        String(v?.notes || '').toLowerCase().includes(q) ||
        (v?.parts || []).some(
          (p) =>
            stripRichText(p?.name || '').toLowerCase().includes(q) ||
            String(p?.content || '').toLowerCase().includes(q)
        )
    );
  });
}

// ---------------------------------------------------------------------------
// Class tree
// ---------------------------------------------------------------------------

const parentOf = (cls) => cls.parentId || ROOT_CLASS_ID;

// Direct children of a parent (ROOT_CLASS_ID = top level).
export function classChildren(classes, parentId = ROOT_CLASS_ID) {
  return (classes || []).filter((c) => parentOf(c) === parentId);
}

// Flat listing with depth for dropdowns: [{id, name, depth, ...}].
export function flattenClasses(classes, parentId = ROOT_CLASS_ID, depth = 0, out = []) {
  for (const c of classChildren(classes, parentId)) {
    out.push({ ...c, depth });
    flattenClasses(classes, c.id, depth + 1, out);
  }
  return out;
}

// Is `id` inside the subtree of `ancestorId`? (exclusive of the ancestor)
// NOTE on naming: call sites pass (classes, ancestorId, id) — the answer is
// "id is a descendant of ancestorId".
export function isDescendantOfClass(classes, ancestorId, id) {
  if (!ancestorId || !id || ancestorId === id) return false;
  const byId = new Map((classes || []).map((c) => [c.id, c]));
  const seen = new Set();
  let current = byId.get(id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    const parent = parentOf(current);
    if (parent === ancestorId) return true;
    current = byId.get(parent);
  }
  return false;
}

// Every class id inside the subtree of rootId, inclusive.
export function descendantClassIds(classes, rootId) {
  const out = [rootId];
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of classes || []) {
      if (!out.includes(c.id) && out.includes(parentOf(c))) {
        out.push(c.id);
        changed = true;
      }
    }
  }
  return out;
}

// Characters inside a class SUBTREE (the class + every descendant).
// ROOT is the parent of all classes, so it counts every character.
export function countCharactersInClassTree(characters, classes, classId = ROOT_CLASS_ID) {
  const list = Array.isArray(characters) ? characters : [];
  if (classId === ROOT_CLASS_ID) return list.length;
  const ids = new Set(descendantClassIds(classes, classId));
  return list.filter((c) => ids.has(c.classId || ROOT_CLASS_ID)).length;
}

// "Parent > Child > Grandchild" label for a class id (markup stripped —
// this string feeds status messages and the toolbar label).
export function classLabelPath(classes, classId) {
  if (!classId || classId === ROOT_CLASS_ID) return 'Unsorted';
  const byId = new Map((classes || []).map((c) => [c.id, c]));
  const names = [];
  const seen = new Set();
  let current = byId.get(classId);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    names.unshift(stripRichText(current.name));
    current = byId.get(parentOf(current));
  }
  return names.join(' > ') || 'Unsorted';
}

// Move a class. zone: 'above' | 'below' | 'inside'.
// targetId ROOT_CLASS_ID + 'inside' => append at the top level.
// Returns a NEW array; illegal moves (onto itself / into its own subtree)
// return the input unchanged.
export function moveClass(classes, dragId, targetId, zone = 'inside') {
  const list = Array.isArray(classes) ? classes : [];
  const dragged = list.find((c) => c.id === dragId);
  if (!dragged) return list;
  if (dragId === targetId) return list;
  // Dropping an ancestor into its own subtree would create a cycle.
  if (targetId && targetId !== ROOT_CLASS_ID && isDescendantOfClass(list, dragId, targetId)) return list;

  const rest = list.filter((c) => c.id !== dragId);
  let parentId = ROOT_CLASS_ID;
  let insertIndex = rest.length;

  if (targetId && targetId !== ROOT_CLASS_ID) {
    if (zone === 'inside') {
      parentId = targetId;
      let lastChildIdx = -1;
      rest.forEach((c, i) => {
        if (parentOf(c) === targetId) lastChildIdx = i;
      });
      insertIndex = lastChildIdx + 1;
    } else {
      const target = rest.find((c) => c.id === targetId);
      parentId = target ? parentOf(target) : ROOT_CLASS_ID;
      const tIdx = rest.findIndex((c) => c.id === targetId);
      insertIndex = zone === 'above' ? tIdx : tIdx + 1;
    }
  }

  const next = [...rest];
  next.splice(insertIndex, 0, { ...dragged, parentId });
  return next;
}

// 1.1.6 — filterByTags is RETIRED ("remove deprecated code"): the
// spotlight's tri-state engine (spotlightState below) superseded the old
// two-set filter years ago — this wrapper had no callers left.

// ---------------------------------------------------------------------------
// Spotlight filter — v3 (0.9.0): per-tag tri-state, exactly as requested.
//   'include'  cards MUST have this tag (all include tags are required)
//   'exclude'  cards must NOT have this tag (any exclude tag disqualifies)
//   'neutral'  the tag does not participate
// Returns 'match' | 'nomatch'. Whether non-matching cards are hidden or
// greyed out is decided by the SEPARATE hideNonMatching switch — the tag
// states never touch it. Sorting is never touched either.
// ---------------------------------------------------------------------------
export function spotlightState(tags, filter = {}) {
  const list = Array.isArray(tags) ? tags : [];
  const inc = filter.include?.length ? new Set(filter.include) : null;
  const exc = filter.exclude?.length ? new Set(filter.exclude) : null;
  if (!inc && !exc) return 'match'; // nothing active — everything matches
  if (inc) {
    // every include-tag must be present on the card
    for (const need of inc) {
      if (!list.includes(need)) return 'nomatch';
    }
  }
  if (exc && list.some((t) => exc.has(t))) return 'nomatch';
  return 'match';
}

// ---------------------------------------------------------------------------
// STAMPS (0.15.0 · 0.22.0 rework).
// ---------------------------------------------------------------------------
const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;
// 0.22.0 — a stamp's identity is its IMAGE FILE. The old srcId bookkeeping
// (library template -> character copy links) was invisible state that broke
// silently: locally uploaded stamps never linked, removing a template
// stripped the links, and the spotlight then "didn't detect" stamps that
// were sitting right there on the card (marking one even dimmed the very
// cards that carried it). Matching now compares the image the spotlight
// points at with the images the card carries — what you SEE is what
// matches. (createSafeDb also auto-joins every character stamp image into
// the library, so the spotlight can always find them.)
export const stampImageMatches = (stampImage, spotlightImage) =>
  !!stampImage && !!spotlightImage && String(stampImage) === String(spotlightImage);

// Map image file -> library stamp record (the cheap index every consumer
// builds once per render batch).
export const stampImageIndex = (libraryStamps = []) => {
  const map = new Map();
  for (const s of Array.isArray(libraryStamps) ? libraryStamps : []) {
    if (s?.image && !map.has(s.image)) map.set(s.image, s);
  }
  return map;
};

// 0.22.0 — the hue a card paints under its visible stamp. 0.41.0 — WHITE
// BY DEFAULT ("default color for the hue of the stamp should be white
// bruh"): the chain is the card's CUSTOM color when one is set, else
// DEFAULT_STAMP_COLOR — the stamp image's dominant AUTO color no longer
// drives the default wash (it used to tint the card whatever the logo's
// average happened to be; the silent default is the clean WHITE constant
// now, exactly what the color window's swatch shows). null never escapes —
// callers fall back to the same constant.
export const resolveStampHue = (settings) => {
  const custom = settings?.color;
  if (typeof custom === 'string' && HEX_COLOR_RE.test(custom)) return custom.toLowerCase();
  return DEFAULT_STAMP_COLOR;
};

// 1.4.5 — THE HUE SPEAKS WITHOUT A STAMP ("make it so hue can be applied
// even without a stamp, thats the main reason we even made it so the stamp
// options is greyed out, since hue shouldnt rely on it"): the card's CUSTOM
// hue alone — null when none is picked. The paint law this serves: with a
// stamp on the card the wash speaks resolveStampHue (custom, else the
// silent white default — the hue of the stamp); with NO stamp the wash
// speaks only what the user actually picked — an untouched card stays
// clean, a drafted hue paints the moment it is chosen.
export const customStampHue = (settings) => {
  const custom = settings?.color;
  return typeof custom === 'string' && HEX_COLOR_RE.test(custom) ? custom.toLowerCase() : null;
};

// 1.4.5 — THE FINISH'S OWN TEXT RIM ("when a finish is applied, ensure
// that the text (alongside the version counter and date and name) should
// have an outline that is opposite to the text's current color, so if the
// text is white, add a black outline, if its black then add a white
// outline"): luminance-based, one line — a LIGHT ink wears the DARK rim,
// a DARK ink the LIGHT one, so the printing can never melt into the coat
// under it. Seats whose text speaks a THEME var (no card color) pass null
// and resolve --gd-text-counter instead (theme.js writes it from the
// theme's own panel text at apply time — one token, every theme honest).
export const counterRimFor = (hex) => {
  if (typeof hex !== 'string' || !HEX_COLOR_RE.test(hex)) return null;
  return luminanceOfHex(hex) > 0.5 ? 'rgba(13, 10, 7, 0.66)' : 'rgba(250, 246, 238, 0.72)';
};

// 0.20.0 — the hue's OWN TRANSPARENCY (card-level 0.22.0; always a clamped
// 0..1 number, junk and absent values fall to the classic 0.88).
export const stampHueAlpha = (settings) => sanitizeStampHueAlpha(settings?.colorAlpha);

// 0.21.0 — the stamp art's OWN transparency (card-level 0.22.0; clamped
// 0.1..1; absent/junk = 1, fully solid).
export const stampAlpha = (settings) => sanitizeStampAlpha(settings?.alpha);

// 0.22.0 follow-up — THE BAND CAPTURE. While a stamp sits in the classic
// bottom band (pos === null) its on-card geometry is NOT the settings'
// defaults: the band render contain-fits the logo into the full card width
// x 52%-of-card-height box, bottom-anchored (.gd-card-stamp-band /
// .gd-card-stamp-slicebox / .gd-card-stamp-img in index.css). A PLACED sticker
// instead starts from a 44%-of-card-width base (.gd-card-stamp-placed) and
// wears the scale multiplier on top of that. This helper computes the
// {x, y, scale} a placed sticker needs to reproduce EXACTLY what the band
// is showing right now, so the settings popover can display the values of
// the stamp's FIRST state (not a fictitious default) and the first slider
// touch can lift the stamp out of the band WITHOUT it jumping, shrinking
// or "changing everything".
//   stampAspect — the stamp image's naturalWidth / naturalHeight (> 0)
//   cardAspect  — the card sleeve's ratio w / h (> 0)
// Geometry (fractions of the card): drawnW = min(1, 0.52·a / R) of the
// width; drawnH = min(R / a, 0.52) of the height; the logo is centered
// horizontally (x = 50%) and its bottom sits on the card's bottom edge, so
// its center rides at y = 100 − 50·drawnH percent. The equivalent placed
// scale is drawnW / 0.44 (the placed base width), clamped to the rails.
// Returns null when either aspect is unknown (caller falls back to the
// old default lift spot).
const BAND_HEIGHT_FRAC = 0.52; // .gd-card-stamp-band height (52% of the card)
const PLACED_BASE_FRAC = 0.44; // .gd-card-stamp-placed width (44% of the card)
export function bandStampTransform(stampAspect, cardAspect) {
  const a = Number(stampAspect);
  const R = Number(cardAspect);
  if (!Number.isFinite(a) || a <= 0 || !Number.isFinite(R) || R <= 0) return null;
  const drawnW = Math.min(1, (BAND_HEIGHT_FRAC * a) / R); // fraction of card width
  const drawnH = Math.min(R / a, BAND_HEIGHT_FRAC); // fraction of card height
  const scale = drawnW / PLACED_BASE_FRAC;
  return {
    x: 50,
    y: Math.round((100 - 50 * drawnH) * 100) / 100,
    scale: Math.min(STAMP_SCALE_RANGE.max, Math.max(STAMP_SCALE_RANGE.min, Math.round(scale * 100) / 100)),
  };
}

// The ordered stamps a card should RENDER right now:
//   · no stamp spotlight  → just the TOP one (character.stamps[0]) — the
//     others sit behind it, invisible.
//   · stamp spotlight on → every SPOTLIGHTED stamp the card carries (matched
//     by IMAGE), promoted above the default top for as long as the filter is
//     on. 0.27.0 — the order is the CARD'S OWN STACK, not the spotlight
//     click order ("it should prioritize the top stamp on the left, then the
//     rest of the stamps"): stamps[0] — the top stamp — takes the LEFTMOST
//     slice of the split, and the rest follow in stacking order.
//     With TWO OR MORE spotlighted stamps the callers switch to the SPLIT
//     VIEW: every stamp wears the SAME settings (one object per card) and
//     is CUT to an equal vertical share OF THE STAMP'S OWN BOX (two stamps
//     = halves: the left half of the art shows the first, the right half
//     the second; three = thirds…), so one card carries them all without
//     any of them moving or resizing. `library` (db.stamps) resolves the
//     spotlighted ids to images; without it nothing can match.
export function visibleStampsFor(character, spotlightStamps = [], libraryStamps = []) {
  const stamps = Array.isArray(character?.stamps) ? character.stamps : [];
  const spot = Array.isArray(spotlightStamps) ? spotlightStamps.filter(Boolean) : [];
  if (!spot.length) return stamps.slice(0, 1);
  const byId = new Map();
  for (const s of Array.isArray(libraryStamps) ? libraryStamps : []) {
    if (s?.id && !byId.has(s.id)) byId.set(s.id, s);
  }
  const spotImages = new Set();
  for (const id of spot) {
    const tpl = byId.get(id);
    if (tpl?.image) spotImages.add(tpl.image);
  }
  // 0.27.0 — walk the character's OWN stack (top first): the top stamp
  // always renders on the LEFT of the split, the rest follow under it.
  const out = [];
  for (const s of stamps) {
    if (!s?.image) continue;
    if (spotImages.has(s.image)) out.push(s);
  }
  return out;
}

// Full spotlight verdict for a card: tags (include-AND / exclude) AND
// stamps (every spotlighted stamp must be carried — matched by IMAGE).
// 0.37.0 — stamp EXCLUDES join the cycle ("just like there is include
// exclude and normal mode, add that to the stamps too"): a card carrying
// ANY excluded stamp (matched by image, exactly like the includes) is a
// non-match — the same law the tag side has always lived by.
// Returns 'match' | 'nomatch' — the hideNonMatching switch decides what
// happens to the non-matches, exactly like the tag side.
export function spotlightMatchState(character, filter = {}, libraryStamps = []) {
  const tagState = spotlightState(character?.tags || [], filter);
  if (tagState === 'nomatch') return 'nomatch';
  const stampLib = new Map();
  for (const s of Array.isArray(libraryStamps) ? libraryStamps : []) {
    if (s?.id && !stampLib.has(s.id)) stampLib.set(s.id, s);
  }
  const stamps = character?.stamps || [];
  const excluded = Array.isArray(filter.stampExclude) ? filter.stampExclude : [];
  if (excluded.length) {
    for (const ban of excluded) {
      const tpl = stampLib.get(ban);
      if (tpl?.image && stamps.some((s) => stampImageMatches(s.image, tpl.image))) return 'nomatch';
    }
  }
  const spot = filter.stamps?.length ? filter.stamps : null;
  if (spot) {
    for (const need of spot) {
      const tpl = stampLib.get(need);
      if (!tpl?.image) return 'nomatch';
      if (!stamps.some((s) => stampImageMatches(s.image, tpl.image))) return 'nomatch';
    }
  }
  return 'match';
}

// 0.22.0 — the DOMINANT COLOR of a stamp image (the AUTO hue). Runs in the
// renderer: draws the image small on a canvas (cross-origin-clean — the
// local-resource protocol answers with CORS headers), buckets the opaque
// pixels into a coarse 4x4x4 rgb histogram weighted by alpha, and averages
// the winning bucket. Returns '#rrggbb' or null (unreadable/tainted — the
// caller falls back to no hue). Results are memoized per url. Pure-module
// safe: in node (tests) there is no Image/canvas, so it resolves null.
const dominantCache = new Map();
export function dominantColorOf(url) {
  if (!url || typeof window === 'undefined' || typeof document === 'undefined') return Promise.resolve(null);
  if (dominantCache.has(url)) return Promise.resolve(dominantCache.get(url));
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let settled = false;
    const done = (hex) => {
      if (settled) return;
      settled = true;
      dominantCache.set(url, hex);
      resolve(hex);
    };
    img.onload = () => {
      try {
        const size = 24;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return done(null);
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        const buckets = new Array(64).fill(0);
        const sums = new Array(64).fill(0).map(() => [0, 0, 0, 0]); // r,g,b,weight
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 48) continue; // transparent/background pixels don't vote
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const bucket = ((r >> 6) << 4) | ((g >> 6) << 2) | (b >> 6);
          const w = a / 255;
          buckets[bucket] += w;
          sums[bucket][0] += r * w;
          sums[bucket][1] += g * w;
          sums[bucket][2] += b * w;
          sums[bucket][3] += 1;
        }
        let best = -1;
        for (let i = 0; i < 64; i += 1) {
          if (buckets[i] > (best >= 0 ? buckets[best] : -1)) best = i;
        }
        if (best < 0 || sums[best][3] < 4) return done(null);
        const avg = (ch) => Math.round(sums[best][ch] / sums[best][3]);
        const hex = `#${[avg(0), avg(1), avg(2)].map((v) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0')).join('')}`;
        done(HEX_COLOR_RE.test(hex) ? hex : null);
      } catch {
        done(null); // tainted canvas / decode hiccup — caller falls back
      }
    };
    img.onerror = () => done(null);
    img.src = url;
  });
}

// ---------------------------------------------------------------------------
// Masonry packing — fixed column width, shortest-column-first placement.
// Pure: heights in, absolute positions out. Order is preserved (custom order
// = array order = reading order).
// ---------------------------------------------------------------------------
export function masonryColumns(containerWidth, cardWidth, gap) {
  const w = Math.max(0, Number(containerWidth) || 0);
  const cw = Math.max(40, Number(cardWidth) || 185);
  const g = Math.max(0, Number(gap) || 0);
  if (w < cw) return 1;
  return Math.max(1, Math.floor((w + g) / (cw + g)));
}

// 1.1.8 — THE SPAN SEAT ("when right clicking on a card, add an option to
// expand it, which will allow the card to take 2 rows instead of one, while
// still remaining in the same aspect ratio"): an optional `spans` array
// (one entry per height, 1 or 2) lets an item occupy TWO ADJACENT COLUMNS.
// A span-2 card renders at double width, so its measured height doubles
// with it — the aspect ratio is preserved BY GEOMETRY (double the width,
// double the height: the same picture, four cells, "2 rows" of the grid's
// own measure). Placement for wide items: the ADJACENT PAIR whose worse
// (highest) top is lowest wins; both columns advance past the item. With a
// single column available the span folds back to 1 (nothing to pair with).
// The default (spans null / all 1) is byte-for-byte the old packing —
// every pre-1.1.8 consumer and test keeps its truth.
//
// 1.1.9 — THE PAIR IS BALANCED, NOT MERELY LOW ("fix the issue where some
// cards would leave too many gabs behind when aligned, double size should
// not leave too many gabs behind, this issue occurs specifically when
// right pannel pops out and the card grid realigns"): the old criterion
// only minimized the pair's WORST top — a pair straddling a shallow and a
// deep column won whenever its deep side chanced to be the lowest, and
// the wide card then sat at the deep column's floor with a HOLE the size
// of the difference open above its shallow half — the "gaps behind" that
// piled up whenever the panel popped out and the columns re-packed
// narrower.
//
// 1.2.2 — BUT THE HOLE WINS, THE BALANCE ONLY BREAKS TIES ("the tiling of
// the cards somewhat is inconsistent still as when there is space to fit
// between some cards, it still puts the oversized landscape card on the
// right even though it can placed on the left on higher row"): the 1.1.9
// balance pass compared pairs inside a WHOLE CARD-HEIGHT window (260px) —
// a balanced-but-DEEP pair could beat a shallow-but-ragged one, and the
// wide card landed a full row lower on the right while a higher, emptier
// seat waited on the left (reproduced pure: pair(0,1) worst-top 220 /
// spread 100 lost to pair(3,4) worst-top 320 / spread 0 — the card sat at
// 320). The law is ordered now: a meaningfully LOWER worst-top always
// wins (the higher, emptier seat); only pairs whose worst tops sit within
// a 12px tie (the same visual row) compete on balance, so the flush-fit
// still happens when two seats are equally high. Leftmost wins the rest
// of the ties, exactly as before.
//
// 1.8.2 — A WIDE CARD NEVER INDENTS PAST AN OPEN LANE ("in how the cards
// organization behaves in teh cards viewer, lets say i have two normal
// cards and one wide card aspect ratio wise ... for some reason the wide
// card would leave an empty space on the right of the two normal cards,
// then leave one more space on its left, even tho its not necessary to
// leave the second empty space, fix that issue"): the balance branch
// (and, worse, the meaningful-depth reading it fed) seated the wide card
// on a RIGHT-hand pair whenever that pair sat a little lower — stranding
// an open lane on the wide card's LEFT while the wall read indented for
// no reason the eye could name. The guard is geometric now, not numeric:
// a pair may seat the wide card rightward ONLY when every lane it would
// skip is still stacked PAST the wide card's own floor (its column top at
// or below the pair's top plus the card's height) — the skipped lanes
// face the wide card's flank with CONTENT, never with open air, so no
// fresh empty space is ever born beside it. Any pair that would strand
// an open lane is simply not a seat: the leftmost pair keeps the reading
// order (the second row begins at the margin the way a line of text
// does), its shallow side's gap still opening as a REGISTERED hole the
// later single-span cards fill. The balance branch rides off with it —
// leftmost wins every tie outright, and only a meaningfully lower — and
// flank-covered — rightward pair may ever speak.
//
// 1.9.15 — THE COVERAGE DEMAND CAPS AT ONE ROW ("lets say in a class
// there is 4 normal cards (3:4 small size) , then after them there is a
// card (16:10 enlarged) and a card (3:4 enlarged card) , enlarged as in
// right click then enlarged, for some reason the cards wont stay next to
// the 4 normal cards , instead leaving exactly a 1 card gab inbetween"):
// the 1.8.2 demand — every skipped lane stacked past the wide card's
// FULL floor — is a demand a card taller than its neighbors can never
// meet: an enlarged card is taller than the singles around it by
// construction, so EVERY enlarged card was banished to the leftmost pair
// and the wall read as a tower of wide cards (the second one dropping a
// full row below the first) with a card-wide gap held open beside the
// normals — the estimate phase even packed the pair side by side first,
// then the ResizeObserver told the truth and the re-flow collapsed the
// row into the tower. The demand is capped at ONE CARD-ROW now (cw × 1.33
// + g, the wall's own visual row): a lane stacked a full row past the
// seat's top already faces the card with CONTENT down to the row line,
// and the room below that line is the wall's ordinary next-flow space —
// the same air the leftmost seat would leave on the other side, never a
// NEW pocket beside the card. An INDENT (a lane ending inside the card's
// first row — the 1.8.2 report's tucked seat) stays banned exactly as
// before: for a card no taller than a row the cap IS the card's own
// height and the guard speaks the 1.8.2 verdict byte-for-byte. A tall
// wide card wraps the row instead of towering past it — the second
// enlarged card sits BESIDE the first, dead under the normals, and the
// gap closes.
export function layoutMasonry(heights, columns, cardWidth, gap, spans = null) {
  const cols = Math.max(1, Math.floor(columns) || 1);
  const cw = Math.max(40, Number(cardWidth) || 185);
  const g = Math.max(0, Number(gap) || 0);
  const colHeights = new Array(cols).fill(0);
  const positions = [];
  // 1.2.2 — the tie window: worst-tops within this many pixels read as
  // the SAME ROW and compete on balance; anything lower is simply lower.
  const TIE_WINDOW = 12;
  // 1.9.15 — the coverage cap: one card-row (cw × 1.33 + g). A skipped
  // lane must be stacked past the seat's top by at least this much (or
  // past the card's whole floor when the card is shorter than a row)
  // before the pair may seat the wide card rightward — see the law above
  // the function.
  const ROW_MIN = cw * 1.33 + g;
  // 1.2.5 — THE OPEN HOLES ("when the right detail panel is open the card
  // layout should be tighter — cards leave empty areas depending on
  // ordering"): a span-2 card seated on a ragged pair advances BOTH
  // columns past its bottom, so the shallow side's gap above the wide
  // card became a PERMANENT hole — single-span cards only ever appended
  // at a column's floor, so nothing ever came back for that space (the
  // "empty areas depending on ordering" that piled up whenever the panel
  // opened and the board re-packed narrower). Each column now carries its
  // open holes; a later single-span card slots into the tightest hole it
  // fits (the least leftover, leftmost on ties) and the hole shrinks by
  // the card + gap — the areas behind the wide cards fill as the order
  // flows on, the same way the user reads the grid "fitting into the
  // gaps". A hole stays open only while its remainder is at least a
  // card-and-gap tall — smaller slivers are not a seat. With no span-2
  // cards in the order (spans null / all 1) no hole ever opens and the
  // packing stays byte-for-byte the old law.
  const holes = [];
  const HOLE_FLOOR = cw * 0.4 + g;
  for (let i = 0; i < heights.length; i += 1) {
    const h = Number(heights[i]) || 0;
    const span = spans && cols >= 2 ? Math.min(2, Math.max(1, Number(spans[i]) || 1)) : 1;
    if (span === 2) {
      let best = 0;
      let bestTop = Infinity;
      for (let c = 0; c + 1 < cols; c += 1) {
        const top = Math.max(colHeights[c], colHeights[c + 1]);
        // 1.8.2 — THE STRAND GUARD (see the law above the function): a pair
        // may seat the wide card rightward only when every lane it skips is
        // still stacked past the wide card's own floor — no open lane may
        // face the card's flank. Otherwise the pair is not a seat at all.
        // 1.9.15 — the floor demand caps at ONE CARD-ROW (min(h, ROW_MIN),
        // the law above): a lane a full row deep past the seat's top
        // already faces the card with content, and demanding more than a
        // row built the left tower of tall enlarged cards — the reported
        // 1-card gap beside the normals.
        let strandsOpenLane = false;
        for (let j = 0; j < c; j += 1) {
          if (colHeights[j] < top + Math.min(h, ROW_MIN)) {
            strandsOpenLane = true;
            break;
          }
        }
        if (strandsOpenLane) continue;
        if (top < bestTop - TIE_WINDOW) {
          // meaningfully lower — the higher seat wins outright; ties and
          // near-ties keep the leftmost pair (reading order, 1.8.2)
          best = c;
          bestTop = top;
        }
      }
      const floorL = colHeights[best];
      const floorR = colHeights[best + 1];
      const y = Math.max(floorL, floorR);
      positions.push({ x: best * (cw + g), y, span: 2 });
      colHeights[best] = y + h + g;
      colHeights[best + 1] = y + h + g;
      // the shallow side's gap above the wide card opens as a hole
      if (y - floorL > HOLE_FLOOR) holes.push({ col: best, y: floorL, h: y - floorL });
      if (y - floorR > HOLE_FLOOR) holes.push({ col: best + 1, y: floorR, h: y - floorR });
    } else {
      // the tightest open hole this card fits — a real seat beats the floor
      let pick = -1;
      let pickLeft = Infinity;
      for (let k = 0; k < holes.length; k += 1) {
        const left = holes[k].h - h;
        if (left >= -0.001 && left < pickLeft - 0.001) {
          pick = k;
          pickLeft = left;
        }
      }
      if (pick >= 0) {
        const ho = holes[pick];
        positions.push({ x: ho.col * (cw + g), y: ho.y, span: 1 });
        ho.y += h + g;
        ho.h -= h + g;
        if (ho.h < HOLE_FLOOR) holes.splice(pick, 1);
      } else {
        let best = 0;
        for (let c = 1; c < cols; c += 1) {
          if (colHeights[c] < colHeights[best] - 0.001) best = c;
        }
        positions.push({ x: best * (cw + g), y: colHeights[best], span: 1 });
        colHeights[best] += h + g;
      }
    }
  }
  const height = colHeights.length ? Math.max(...colHeights) - g : 0;
  return { positions, height: Math.max(0, height), columns: cols };
}

// ---------------------------------------------------------------------------
// 1.2.6 — THE FILLED-ROWS PACK (the side-flow's shared row builder).
// "the tags container still is at fault … the second column still has only
// one in the middle, before and after it are small tags … when i make [the
// right panel] smaller both stamps and tags break, so fix that so it
// happens regardless of the container": the old greedy wrap broke a row the
// moment the NEXT item could not sit in it, so at narrow widths a wide item
// (a long tag name, the stamps' settings cluster) STRANDED ALONE on a
// mostly-empty row while every small tag after it slid to the next line —
// honest geometry, but it reads as a broken layout (a lone chip in the
// middle of the zone with "gaps" around it, at every container width a
// different row strands).
//
// THE LAW: rows still fill left to right in flow order, but when the next
// item does not fit, the packer looks ahead up to `look` items for the
// FIRST one that fits the row's remaining room and pulls it forward. A wide
// item strands alone only when nothing in the window can sit beside it —
// and the small tags that used to slide past now keep their wide neighbor
// company. The pull is bounded (three items deep), so the flow order stays
// readable; only the seating changes.
//
// THE PAIRING LAW (critical): SideFlow's renderSide and useThumbSort's
// packPaged MUST speak this same builder — packPaged's identity validation
// reproduces the live layout through it, and any drift drops the drag back
// to the rect-swap glide (the 1.2.2 cross-page mess). Both callers seed
// their FIRST row plain (renderSide from the probe's own band, packPaged
// from the same greedy law the probe wraps through) — the pull only ever
// rides rows after the first, so the front row stays byte-identical to the
// retracted seat and the mirrors never diverge.
//
// Returns an array of rows, each an array of the caller's OWN item tokens
// (whatever the caller fed `items` — indices, nodes, ids).
//
// 1.2.7 — THE OVERSIZED SEAT ("the tags seem to refuse to fill the gap if
// the tag is bigger than the container … it should fill the gap and
// continue off if necessary"): an item WIDER than the whole usable box can
// never sit cleanly in ANY row — such an item seats into the CURRENT row's
// remaining room and its body simply continues past the box edge.
//
// 1.2.8 — THE SEAT GENERALIZES TO EVERY TAG ("if there is a long tag on
// the right it would create a gap between it and the tag on the left …
// tags should stick to each other on the right and left"): the 1.2.7 law
// only spoke for items wider than the WHOLE box. A long tag that fits the
// box alone but not the row's remaining room still broke the row and
// stranded itself on the next one — leaving the exact gap at the previous
// row's tail the user keeps reporting (the long tag on the right, the
// dead air between it and the tag on its left). THE ONE LAW now: when the
// head cannot fit the remaining room AND the lookahead pull finds no
// companion, the head seats at the row's TAIL anyway and its body
// continues off past the box edge — the row fills, the neighbors stick
// left and right, and the next item starts the next row (rowW already
// past W, so nothing else can follow it). No width condition, no second
// mind: EVERY break is a poke break, and the pages (shrink-to-fit lanes
// since 1.2.7) carry the clipped tail inside their own scrollable page.
// The law rides the shared builder, so SideFlow's renderSide and
// useThumbSort's packPaged keep speaking the same seating byte-for-byte
// (the pairing law below).
export function packFlowRows(itemList, widthOf, usable, gap, { look = 3, firstRowPlain = true } = {}) {
  const items = Array.from(itemList || []);
  const wOf = (it) => {
    const w = Number(widthOf(it));
    return Number.isFinite(w) && w >= 0 ? w : 0;
  };
  const rows = [];
  let row = [];
  let rowW = 0;
  const g = Number.isFinite(gap) && gap > 0 ? gap : 6;
  const W = Number.isFinite(usable) ? usable : 0;
  // 1.3.1 — THE ROW BREAKS AT THE CSS WRAP'S OWN EDGE (the one-width law):
  // the old `fits` carried a +1px mercy so a row could pack ONE item more
  // than the browser's own wrap seats at the same box (measured live: the
  // probe's plain seat wrapped 6 stamps in band 1 while the packer's very
  // next row seated 7 at the identical width — the paint's rows disagreed
  // with each other, the last chip of the packed row rode the page's clip
  // edge as a half-slot "ghost", and the drag's identity pack (which reads
  // the SAME builder) mis-seated drops by a whole stride: long tags could
  // never take a first-row seat no matter where the drag released them).
  // The mercy is RETIRED: an item joins the row iff `rowW + gap + itemW`
  // fits within W in exact float math, with only a 0.01 noise guard for
  // subpixel arithmetic — the same verdict the CSS wrap speaks at the same
  // box, so the probe's bands, the painted pages and the drag's identity
  // pack now read ONE width. The stamp settings' split seats (1.3.1) and
  // every paged flow inherit the law through this one builder.
  const fits = (nextW) => !row.length || rowW + g + nextW <= W + 0.01;
  // 1.2.9 — THE PULL IS DEAD ("its not sorting the tags correctly, i want
  // it to prioritize filling most of the left as possible, then leave the
  // + on the right … the + is currently on the left amongst the tags"):
  // the 1.2.6 lookahead pull looked ahead up to three items for the first
  // that fit the row's remaining room and yanked it forward — measured
  // live: "one" pulled before "quantum", and the trailing + key (a small
  // item, exactly what the pull loves) hauled into the middle of an early
  // row. The pull was a patch for wide-item stranding; the 1.2.8 poke law
  // already fills every row's tail, so the pull now only ever REORDERS.
  // Strict order: DOM order is painted order, the + stays the very last
  // item of the very last row, and both callers (SideFlow's renderSide and
  // useThumbSort's packPaged) keep speaking this one builder — the drag's
  // identity validation still reproduces the live layout byte-exact.
  void look; // the pull window is retired (strict order, see the law above)
  while (items.length) {
    const it = items[0];
    const w = wOf(it);
    if (fits(w)) {
      row.push(it);
      rowW = row.length > 1 ? rowW + g + w : w;
    } else if (w < W - 1) {
      // 1.3.1 — ORDINARY ITEMS WRAP, ONLY THE OVERSIZED POKE (the ghost
      // stamps die): the 1.2.8 law poked EVERY item that could not fit the
      // row's remaining room to the row's tail and let its body ride on
      // past the box edge — a row painted WIDER than the box it wraps in
      // (measured live: 7 stamps seated at a 324px box, row 356px wide),
      // and the poked chip half-hid under the scroll's clip plane at the
      // page's edge: the "ghost stamps" (two of them on a 2-page strip),
      // rows that disagreed with the probe's own first band, and a drag
      // whose identity pack (this same builder) reproduced the overhang
      // the paint wore. An item NARROWER than the whole box now starts the
      // NEXT row — exactly the CSS wrap's verdict at the same width, so
      // every row fits the box, the pages never clip a chip at their seam,
      // and the probe's bands, the painted pages and the drag's identity
      // pack all speak one law. The 1.2.8 "rows stick left and right"
      // purpose survives through the greedy fits(): a row still fills
      // front-to-back with every item that fits; only the overhang is
      // gone. firstRowPlain stays accepted for the callers' signatures;
      // ordinary items wrap identically on every row now, so the flag no
      // longer changes any seat.
      if (row.length) rows.push(row);
      row = [it];
      rowW = w;
    } else {
      // 1.2.8 — THE OVERSIZED TAIL SEAT (the 1.2.7 law, its true scope): an
      // item as wide as the whole box CANNOT wrap (it would strand alone on
      // its own row, the 1.2.5-era gap report) — it keeps the tail seat:
      // seated at the row's end, its body continuing off past the box edge,
      // reachable inside the shrink-to-fit page by the pan. The next item
      // cannot follow it (rowW is already past W), so the row breaks right
      // after. No gap ever opens between neighbors: the row only ever ends
      // by this seat or by an honest wrap.
      row.push(it);
      rowW = rowW + g + w;
      rows.push(row);
      row = [];
      rowW = 0;
    }
    items.shift();
  }
  if (row.length) rows.push(row);
  return rows;
}

// ---------------------------------------------------------------------------
// Card crop — normalized rect {x, y, w, h} (0..1) on the ORIGINAL image.
// The rect is kept aspect-locked to the card ratio so the preview fills the
// image box without distortion. imgAspect = naturalWidth / naturalHeight.
// ---------------------------------------------------------------------------
export function autoCropFor(ratio, imgAspect) {
  const r = Number(ratio?.w) > 0 && Number(ratio?.h) > 0 ? Number(ratio.w) / Number(ratio.h) : 0.75;
  const a = Number(imgAspect) > 0 ? Number(imgAspect) : 1;
  // crop.w / crop.h * a = r  ->  largest centered rect that fits both axes
  let w = 1;
  let h = (w * a) / r;
  if (h > 1) {
    h = 1;
    w = (h * r) / a;
  }
  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
}

export function clampCrop(crop, ratio, imgAspect) {
  if (!crop || !Number.isFinite(+crop.x) || !Number.isFinite(+crop.y)) return null;
  const r = Number(ratio?.w) > 0 && Number(ratio?.h) > 0 ? Number(ratio.w) / Number(ratio.h) : 0.75;
  const a = Number(imgAspect) > 0 ? Number(imgAspect) : 1;
  let w = Math.min(1, Math.max(0.05, +crop.w || 1));
  let h = (w * a) / r; // keep the region aspect-locked to the card ratio
  if (h > 1) {
    h = 1;
    w = (h * r) / a;
  }
  const x = Math.min(1 - w, Math.max(0, +crop.x));
  const y = Math.min(1 - h, Math.max(0, +crop.y));
  return { x, y, w, h };
}

// The effective card crop, defaulting to the centered max rect.
export function effectiveCrop(crop, ratio, imgAspect) {
  if (crop && +crop.w > 0 && +crop.h > 0) return clampCrop(crop, ratio, imgAspect);
  return autoCropFor(ratio, imgAspect);
}

// ---------------------------------------------------------------------------
// DB sanitation
// ---------------------------------------------------------------------------

const fallbackId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const isHexColor = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);

const sanitizeImage = (img) => ({
  file: String(img?.file || ''),
  thumb: img?.thumb ? String(img.thumb) : null,
  // 1.1.1 — the PREVIEW tier's record: the small cover copy's own filename
  // (null until the generator or a fresh import writes one). Cards read it
  // only while the preview-thumbs switch is on; everything else ignores it.
  prev: img?.prev ? String(img.prev) : null,
});

const sanitizePart = (part) => ({
  id: String(part?.id || fallbackId('part')),
  // 1.1.9 — THE LOAD PATH STOPS EDITING NAMES ("between versions, there
  // is edits to the name such as <o> <g> and what not, dont edit the card
  // between updates"): every db load used to migrate names/labels whose
  // text carried PAIRED legacy rich tokens (~ ^ _ + = *) into the new
  // inline-tag syntax — ordinary punctuation a user never meant as markup
  // became literal <o>/<g>/<u> edits baked into the stored card, and the
  // next save persisted them. The migration no longer runs anywhere on
  // the load/save path (migrateLegacyRich stays exported for its own
  // tests); stored names survive every future update byte-for-byte.
  name: String(part?.name || 'Part'),
  content: String(part?.content || ''),
  include: part?.include !== false,
  // 1.6.3 — THE PART'S OWN INK (the prompt coloring): an optional hex on
  // each part; anything that is not a clean #rrggbb sanitizes to null (the
  // theme's own ink) — old databases simply keep the default look.
  color: isHexColor(part?.color) ? part.color : null,
  // 1.6.8 — THE CONTAINER'S SHADE (the light/dark dial the color window
  // speaks): 'deep' asks the wash to speak at full weight; anything else
  // (null included) keeps the classic light/pale law every version before
  // this painted. Old parts simply keep the light look.
  colorShade: part?.colorShade === 'deep' ? 'deep' : null,
});

const sanitizeVersion = (version) => ({
  id: String(version?.id || fallbackId('ver')),
  label: String(version?.label || 'V1'),
  color: isHexColor(version?.color) ? version.color : null,
  icon: isValidIconName(version?.icon) ? version.icon : null,
  images: (Array.isArray(version?.images) ? version.images : []).map(sanitizeImage).filter((i) => i.file),
  parts: (Array.isArray(version?.parts) ? version.parts : []).map(sanitizePart),
  notes: String(version?.notes || ''),
  // 1.6.7 — THE NOTES' OWN CONTAINER COLOR (the parts' 1.5.2 law, joined):
  // anything that is not a clean #rrggbb sanitizes to null (the theme's
  // own frame) — old versions simply keep the default look.
  notesColor: isHexColor(version?.notesColor) ? version.notesColor : null,
  // 1.6.8 — THE NOTES' SHADE (the light/dark dial, joined): 'deep' speaks
  // the full-weight wash; anything else keeps the classic light law.
  notesColorShade: version?.notesColorShade === 'deep' ? 'deep' : null,
  createdAt: Number.isFinite(+version?.createdAt) ? +version.createdAt : Date.now(),
});

const clampRatioNum = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(20, Math.round(n * 100) / 100);
};

const sanitizeCrop = (crop) => {
  if (!crop || typeof crop !== 'object') return null;
  const nums = ['x', 'y', 'w', 'h'].map((k) => Number(crop[k]));
  if (nums.some((n) => !Number.isFinite(n))) return null;
  if (nums[2] <= 0 || nums[3] <= 0) return null;
  const [x, y, w, h] = nums.map((n) => Math.min(1, Math.max(0, n)));
  if (x + w > 1.001 || y + h > 1.001) return null;
  return { x, y, w, h };
};

const sanitizeCharacter = (character) => {
  // 0.22.0 — the stamps become plain image carriers, and the card gains ONE
  // shared settings object. Migration: a character written before 0.22.0
  // kept its look on the stamps themselves — the TOP stamp's values (the
  // one the card actually showed) become the card's settings, so what you
  // saw is exactly what you keep. Legacy fields are read BEFORE the records
  // are stripped, then never seen again.
  const legacyStamps = Array.isArray(character?.stamps) ? character.stamps : [];
  const legacyTop = legacyStamps[0] || null;
  const legacyColor =
    legacyTop?.colorOn === true && legacyTop?.color && HEX_COLOR_RE.test(String(legacyTop.color))
      ? String(legacyTop.color).toLowerCase()
      : null;
  const stampSettings = character?.stampSettings
    ? sanitizeStampSettings(character.stampSettings)
    : sanitizeStampSettings({
        color: legacyColor,
        colorAlpha: legacyTop?.colorAlpha,
        alpha: legacyTop?.alpha,
        pos: legacyTop?.pos,
        scale: legacyTop?.scale,
        rot: legacyTop?.rot,
        clip: legacyTop?.clip,
      });
  return {
    id: String(character?.id || fallbackId('char')),
    name: String(character?.name || 'Unnamed'),
    classId: character?.classId ? String(character.classId) : ROOT_CLASS_ID,
    tags: Array.isArray(character?.tags) ? character.tags.map(String) : [],
    previewVersionId: character?.previewVersionId ? String(character.previewVersionId) : null,
    // 0.22.0 — ordered stamp images; stamps[0] is the TOP one (the only one
    // visible by default). Plain {id, image, name} records — no per-stamp
    // look knobs, no srcId links.
    stamps: legacyStamps.map(sanitizeCharacterStamp).filter((s) => s.image),
    stampSettings,
    cardRatio:
      clampRatioNum(character?.cardRatio?.w) && clampRatioNum(character?.cardRatio?.h)
        ? { w: clampRatioNum(character.cardRatio.w), h: clampRatioNum(character.cardRatio.h) }
        : null,
    cardTrim: TRIM_IDS.has(character?.cardTrim)
      ? character.cardTrim
      : // 0.28.0 — scale mail AND the rope braid are retired; old databases
        // migrate onto the beaded chain that took the slot (anything else
        // unknown → default).
        character?.cardTrim === 'scales' || character?.cardTrim === 'rope'
        ? 'beads'
        : DEFAULT_CARD_TRIM,
    // 1.6.2 — THE TRIM'S OWN COLOR (the trim color picker): an optional
    // #rrggbb ink for the trim ring. Junk drops to null = the theme's own
    // trim, exactly as every card before the picker painted.
    cardTrimColor: isHexColor(character?.cardTrimColor) ? character.cardTrimColor : null,
    cardCrop: sanitizeCrop(character?.cardCrop),
    // 0.38.0 — CARD COLOR: an optional #rrggbb for the card's foot plate.
    // Junk drops to null = the theme's own foot.
    cardColor: isHexColor(character?.cardColor) ? character.cardColor : null,
    // 1.3.8 — THE CARD'S OWN LOOKS survive the load, field by field (the
    // finish + its AFFECTS IMAGE switch). Junk falls to the defaults so a
    // legacy card reads exactly as it always did.
    // 1.3.9 — the secondary color and the pattern left with the feature;
    // a saved 1.3.8 card drops them here (the print simply stops
    // rendering — the retire law at CARD_FINISHES in constants).
    // 1.4.0 — the legacy chromatic seat migrates at load (the sanitize law
    // in constants) — and 1.4.3 walks every legacy coat forward: chromatic
    // AND polychrome both land on OPALESCENT, so a saved card keeps a
    // living material whatever seat it was born in.
    cardFinish: isCardFinish(character?.cardFinish)
      ? migrateCardFinish(character.cardFinish)
      : DEFAULT_CARD_FINISH,
    cardFinishOnImage: character?.cardFinishOnImage === true,
    // 1.9.5 — THE COAT'S OWN VOLUME (the transparency slider's rail — see
    // sanitizeCardLook in constants): junk falls to the softened default,
    // a saved card keeps its own knob.
    cardFinishTransparency: normalizeFinishTransparency(character?.cardFinishTransparency),
    // 1.9.6 — THE SPLIT VOLUME joins the rails (the checkbox + the image
    // knob — see sanitizeCardLook in constants): the split falls OFF, the
    // image knob falls to the shared default, a saved card keeps its own.
    cardFinishSplitImage: character?.cardFinishSplitImage === true,
    cardFinishImageTransparency: normalizeFinishTransparency(character?.cardFinishImageTransparency),
    // 1.4.5 — the coat's reach over the trim ring + over the stamps: junk
    // falls OFF, a saved card keeps its own law (the finish family's own
    // rails — see sanitizeCardLook in constants).
    cardFinishOnTrim: character?.cardFinishOnTrim === true,
    cardFinishOnStamp: character?.cardFinishOnStamp === true,
    // 1.4.1 — IMAGE MOTION (the sway switch beside affect-the-image):
    // junk falls OFF, a saved card keeps its own law.
    cardImageMotion: character?.cardImageMotion === true,
    // 1.4.7 — STAMP MOTION (the stamp's trailing sway — "add stamp motion
    // too, which when checked will move the stamp alongside the image
    // with a slight delay"): junk falls OFF, a saved card keeps its own
    // law.
    cardStampMotion: character?.cardStampMotion === true,
    versions: (Array.isArray(character?.versions) ? character.versions : []).map(sanitizeVersion),
    createdAt: Number.isFinite(+character?.createdAt) ? +character.createdAt : Date.now(),
  };
};

// 0.22.0 — a character stamp record is a plain image carrier. Legacy
// per-stamp fields (colorOn/color/colorAlpha/alpha/pos/scale/rot/clip/srcId)
// are dropped here — the TOP stamp's values already migrated into the card's
// stampSettings in sanitizeCharacter above.
const sanitizeCharacterStamp = (stamp) => ({
  id: String(stamp?.id || fallbackId('cstamp')),
  image: String(stamp?.image || ''),
  name: String(stamp?.name || 'stamp').slice(0, 80),
});

// Library stamp (db.stamps). 0.22.0 — autoColor is the derived DOMINANT
// COLOR of the image (the AUTO hue default); it is filled in by the app's
// prime effect on first sight of the image and is pure cache — junk or
// absence just means "not derived yet".
// 1.1.4 — `prev` is the stamp's own lightweight preview file (the thumbnail
// generator builds it for the stamp library too — "include the stamps images
// too in the generate thumbnail feature"): a bare filename string or null,
// and anything else simply means "not generated yet" (the pickers fall back
// to the original).
const sanitizeLibraryStamp = (stamp) => ({
  id: String(stamp?.id || fallbackId('lstamp')),
  image: String(stamp?.image || ''),
  name: String(stamp?.name || 'stamp').slice(0, 80),
  autoColor: stamp?.autoColor && HEX_COLOR_RE.test(String(stamp.autoColor)) ? String(stamp.autoColor).toLowerCase() : null,
  // 1.1.4 — the preview seat survives the load (a generated prev must not
  // evaporate on the next boot — the generator's idempotent skip counts on
  // the record remembering what it owns).
  prev: stamp?.prev && /^[^\\/:*?"<>|]+$/.test(String(stamp.prev)) ? String(stamp.prev) : null,
  createdAt: Number.isFinite(+stamp?.createdAt) ? +stamp.createdAt : Date.now(),
});

const sanitizeClass = (cls) => ({
  id: String(cls?.id || fallbackId('cls')),
  name: String(cls?.name || 'New Class'),
  parentId: cls?.parentId ? String(cls.parentId) : ROOT_CLASS_ID,
  icon: isValidIconName(cls?.icon) ? cls.icon : null,
  // 0.37.0 — CLASS COLORS: an optional #rrggbb tint for the class's tree
  // card (+ the rail under it). Anything not a clean 6-digit hex drops to
  // null = the theme's own plate.
  color: isHexColor(cls?.color) ? cls.color : null,
  createdAt: Number.isFinite(+cls?.createdAt) ? +cls.createdAt : Date.now(),
});

// 0.31.0 — the shortcut map: valid two-key combos only, ONE combo per
// action. Stored values win first-come (roster order); every loser falls
// back to its default, and if that default is taken too, a free Ctrl+<letter>
// slot is synthesized so the map is always total and unique — a hand-edited
// db can never wire one combo to two actions.
function sanitizeShortcuts(raw) {
  const out = {};
  const taken = new Set(); // combos already claimed this pass
  const claim = (id, combo) => {
    if (combo && !taken.has(combo)) {
      taken.add(combo);
      out[id] = combo;
      return true;
    }
    return false;
  };
  for (const act of SHORTCUT_ACTIONS) {
    const want = raw && typeof raw === 'object' ? raw[act.id] : null;
    const combo = isComboStr(want) ? want.trim() : null;
    if (!claim(act.id, combo)) out[act.id] = null; // resolved below
  }
  const used = () => new Set(Object.values(out).filter(Boolean));
  for (const act of SHORTCUT_ACTIONS) {
    if (out[act.id]) continue;
    let pick = DEFAULT_SHORTCUTS[act.id];
    if (used().has(pick)) {
      pick = null;
      for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        const c = `Ctrl+${ch}`;
        if (!used().has(c)) {
          pick = c;
          break;
        }
      }
    }
    out[act.id] = pick;
    if (pick) taken.add(pick);
  }
  return out;
}

export function createSafeDb(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const rawSettings = source.settings && typeof source.settings === 'object' ? source.settings : {};
  const sortIds = SORT_MODES.map((s) => s.id);
  const themeIds = THEME_PRESETS.map((t) => t.id);

  // 0.25.0 — the tree's ROOT is VIRTUAL: it is drawn by ClassSidebar, never
  // stored. A db that somehow carries a {id:'root'} class (hand-edit, legacy
  // export) would normalize its parent to 'root' — making the root its own
  // child — and ClassSidebar's renderNodes would recurse until the stack
  // dies (grey screen #2). Drop it; characters keep classId 'root' = Unsorted.
  const classes = (Array.isArray(source.classes) ? source.classes : [])
    .map(sanitizeClass)
    .filter((c) => c.id !== ROOT_CLASS_ID);
  const classIds = new Set(classes.map((c) => c.id));

  // Normalize parents: unknown -> ROOT; then break any remaining cycles.
  for (const c of classes) {
    if (c.parentId !== ROOT_CLASS_ID && !classIds.has(c.parentId)) c.parentId = ROOT_CLASS_ID;
  }
  for (const c of classes) {
    const chain = new Set();
    let cur = c;
    while (cur && cur.parentId !== ROOT_CLASS_ID && classIds.has(cur.parentId)) {
      if (chain.has(cur.id)) {
        c.parentId = ROOT_CLASS_ID; // cycle participant -> top level
        break;
      }
      chain.add(cur.id);
      cur = classes.find((x) => x.id === cur.parentId);
      if (!cur) {
        c.parentId = ROOT_CLASS_ID;
        break;
      }
    }
  }

  const tags = (Array.isArray(source.tags) ? source.tags : []).map((t, i) => ({
    id: String(t?.id || fallbackId('tag')),
    name: String(t?.name || 'tag'),
    color: isHexColor(t?.color) ? t.color : CHIP_COLORS[i % CHIP_COLORS.length],
    icon: isValidIconName(t?.icon) ? t.icon : null,
    // 1.1.4 — THE WHOLE TRIM FAMILY SURVIVES THE LOAD (the save report's
    // quiet half): the whitelist still named only the original three
    // (straight / v / notch), so a tag saved with the 1.0.8 POINT or BEAD
    // trim sanitized back to STRAIGHT on every boot — saved, loaded,
    // forgotten, saved again. All five seats ride now, exactly as the
    // manager offers them.
    trim: ['straight', 'v', 'notch', 'point', 'bead'].includes(t?.trim) ? t.trim : 'straight',
    // 1.4.4 — THE TAG'S FINISH FIELD IS RETIRED WITH THE MANAGER'S LADDER
    // ("remove finishes from the tag manager ... entirely from tag manager
    // only"): a tag saved with a 1.4.3 finish simply FORGETS it on load —
    // the field no longer exists in the sanitized record, and no ribbon
    // paints a coat. The CARDS' finishes are untouched.
  }));
  const tagIds = new Set(tags.map((t) => t.id));

  // 0.22.0 — the stamp LIBRARY is everyone: valid records only (image
  // required), then every CHARACTER stamp image joins too if it is not</think>
  // required), then every CHARACTER stamp image joins too if it is not
  // there yet (auto-join). The spotlight lists the library — with every
  // image present, it finally detects the stamps a card is actually
  // SHOWING, even for cards made before 0.22.0 or with once-local uploads.
  const stamps = (Array.isArray(source.stamps) ? source.stamps : []).map(sanitizeLibraryStamp).filter((s) => s.image);
  const stampImages = new Set(stamps.map((s) => s.image));

  const characters = (Array.isArray(source.characters) ? source.characters : []).map(sanitizeCharacter);
  for (const c of characters) {
    if (c.classId !== ROOT_CLASS_ID && !classIds.has(c.classId)) c.classId = ROOT_CLASS_ID; // orphaned -> Unsorted
    c.tags = c.tags.filter((id) => tagIds.has(id));
    for (const s of c.stamps) {
      if (s.image && !stampImages.has(s.image)) {
        stamps.push(sanitizeLibraryStamp({ image: s.image, name: s.name }));
        stampImages.add(s.image);
      }
    }
  }

  const zoomRaw = Number(rawSettings.zoom);
  // 1.6.8 — THE TEN-STEP ZOOM LADDER ("card size should not be 1-5, should
  // allow smaller cards too ... so the current 1 will be the new 6 and so
  // on"): a database saved before this release spoke the FIVE-step ladder,
  // and its stored zoom (1..5) meant 130..250px — the same pixels are
  // 6..10 now. Walking the seat +5 exactly once keeps every user's wall
  // at the pixel width they chose; the zoomLadder marker (2 = this
  // release's ladder) makes the walk self-limiting — a database that has
  // already been through it (or was born on the new ladder) never walks
  // again. A hand-edited seat already above 5 reads as new-ladder and
  // keeps its number.
  const zoomLadder = rawSettings.zoomLadder === 2 ? 2 : 1;
  let zoomSafe;
  if (Number.isFinite(zoomRaw)) {
    const clamped = Math.min(ZOOM_RANGE.max, Math.max(ZOOM_RANGE.min, Math.round(zoomRaw)));
    zoomSafe = zoomLadder === 2 || clamped > 5 ? clamped : clamped + 5;
  } else {
    zoomSafe = ZOOM_RANGE.default;
  }
  const textureIds = TEXTURES.map((t) => t.id);
  const tagScaleRaw = Number(rawSettings.tagScale);
  // 0.47.0 — ribbon separation + how many ribbons a card wears.
  const tagSepRaw = Number(rawSettings.tagSeparation);
  const tagLimitRaw = Number(rawSettings.tagLimit);
  const clampRatio = (v) => clampRatioNum(v);
  const ratioW = clampRatio(rawSettings.cardRatio?.w);
  const ratioH = clampRatio(rawSettings.cardRatio?.h);
  const colors = rawSettings.colors && typeof rawSettings.colors === 'object' ? { ...rawSettings.colors } : {};
  for (const k of Object.keys(colors)) {
    if (!isHexColor(colors[k])) delete colors[k];
  }

  // 1.2.1 — THE TOOLBAR STARTS CLEAN IN EVERY THEME ("the top toolbar in
  // all themes should start as none"): Carbon and Crimson were the only
  // two themes that ever landed their cloth on the top toolbar (blueprint
  // and hatch), so a database that switched to either seat before 1.2.1
  // still carries that landing in its saved textures. The PAIR is the
  // tell — a theme wearing exactly the pattern it used to ship is the
  // theme's own landing, never a hand-picked seat (every other theme
  // always landed 'none' on the bar, so any OTHER stored pattern was
  // chosen by hand and keeps its seat). Those two pairs wake up clean;
  // everything else round-trips exactly as saved. Sanitize-time by
  // design — the cleaned seat lands as part of the LOADED db, so no
  // unsaved flag is raised and no undo step is spent (the same law the
  // texture renames speak).
  // 1.6.4 — THE THEME'S OWN RENAME MIGRATION (mumei → numeix): the id
  // walked with the name for the first time this release, so a database
  // saved on any earlier body still says 'mumei' — it wakes up on the same
  // white-cyan paper under its new name, exactly the road every retired
  // finish id has always spoken.
  const rawThemeId = rawSettings.theme === 'mumei' ? 'numeix' : rawSettings.theme;
  const safeTheme = themeIds.includes(rawThemeId) ? rawThemeId : DEFAULT_SETTINGS.theme;
  const safeTextures = sanitizeTextures(rawSettings.textures, rawSettings.texture, textureIds);
  if (
    (safeTheme === 'carbon' && safeTextures.titlebar === 'grid') ||
    (safeTheme === 'metal' && safeTextures.titlebar === 'hatch')
  ) {
    safeTextures.titlebar = 'none';
  }

  return {
    characters,
    classes,
    tags,
    stamps,
    settings: {
      ...DEFAULT_SETTINGS,
      theme: safeTheme,
      colors,
      zoom: zoomSafe,
      // 1.6.8 — the ladder marker rides with the sanitized seat (see the
      // zoom walk above): the NEXT load reads 2 and never walks again.
      zoomLadder: 2,
      defaultSortMode: sortIds.includes(rawSettings.defaultSortMode) ? rawSettings.defaultSortMode : DEFAULT_SETTINGS.defaultSortMode,
      detailPanel: typeof rawSettings.detailPanel === 'boolean' ? rawSettings.detailPanel : DEFAULT_SETTINGS.detailPanel,
      textures: safeTextures,
      tagScale: Number.isFinite(tagScaleRaw)
        ? Math.min(TAG_SCALE_RANGE.max, Math.max(TAG_SCALE_RANGE.min, Math.round(tagScaleRaw * 100) / 100))
        : TAG_SCALE_RANGE.default,
      // 0.47.0 — the separation rides whole pixels (negative = overlap); the
      // count is an integer within TAG_LIMIT_RANGE. Anything else = default.
      tagSeparation: Number.isFinite(tagSepRaw)
        ? Math.min(TAG_SEPARATION_RANGE.max, Math.max(TAG_SEPARATION_RANGE.min, Math.round(tagSepRaw)))
        : TAG_SEPARATION_RANGE.default,
      tagLimit: Number.isFinite(tagLimitRaw)
        ? Math.min(TAG_LIMIT_RANGE.max, Math.max(TAG_LIMIT_RANGE.min, Math.round(tagLimitRaw)))
        : TAG_LIMIT_RANGE.default,
      // 1.7.5 — the unselected-tags switch (see DEFAULT_SETTINGS): a stored
      // boolean survives; every pre-1.7.5 database falls to ON — the wall
      // keeps its full vocabulary until the user flips it.
      showAllTags: typeof rawSettings.showAllTags === 'boolean' ? rawSettings.showAllTags : DEFAULT_SETTINGS.showAllTags,
      // 1.9.11 — THE LEDGER'S OWN DIAL (see LOG_LIMIT_RANGE in constants): a
      // stored count survives clamped to the ladder's own range; junk and
      // every pre-1.9.11 database (the key never existed) fall to the 50
      // the ledger always kept — exactly the default the report named.
      logLimit: clampLogLimit(rawSettings.logLimit ?? LOG_LIMIT_RANGE.default),
      cardRatio: ratioW && ratioH ? { w: ratioW, h: ratioH } : { ...DEFAULT_SETTINGS.cardRatio },
      promptBottom: typeof rawSettings.promptBottom === 'boolean' ? rawSettings.promptBottom : DEFAULT_SETTINGS.promptBottom,
      advancedSearch: typeof rawSettings.advancedSearch === 'boolean' ? rawSettings.advancedSearch : DEFAULT_SETTINGS.advancedSearch,
      showHelpText: typeof rawSettings.showHelpText === 'boolean' ? rawSettings.showHelpText : DEFAULT_SETTINGS.showHelpText,
      tagPosition: ['corner', 'mark'].includes(rawSettings.tagPosition) ? rawSettings.tagPosition : DEFAULT_SETTINGS.tagPosition,
      // 0.25.0 — DATA & RECOVERY + UI MOTION (see DEFAULT_SETTINGS).
      autosaveMinutes: [0, 1, 5, 15].includes(rawSettings.autosaveMinutes)
        ? rawSettings.autosaveMinutes
        : DEFAULT_SETTINGS.autosaveMinutes,
      reduceMotion: typeof rawSettings.reduceMotion === 'boolean' ? rawSettings.reduceMotion : DEFAULT_SETTINGS.reduceMotion,
      // 1.5.7 — LIVING FINISHES (see DEFAULT_SETTINGS): the finish coats'
      // own master switch. A stored boolean survives; anything else (every
      // pre-1.5.7 database — the key never existed) falls to ON, the coats'
      // eternal default: nothing changes for anyone until they flip it.
      livingFinishes:
        typeof rawSettings.livingFinishes === 'boolean' ? rawSettings.livingFinishes : DEFAULT_SETTINGS.livingFinishes,
      // 0.29.0 — tooltip layer switch + resizable panel widths (see
      // DEFAULT_SETTINGS — clampXxxWidth carries the hard ranges).
      tooltips: typeof rawSettings.tooltips === 'boolean' ? rawSettings.tooltips : DEFAULT_SETTINGS.tooltips,
      sidebarWidth: clampSidebarWidth(Number(rawSettings.sidebarWidth ?? NaN)),
      panelWidth: clampPanelWidth(Number(rawSettings.panelWidth ?? NaN)),
      // 0.31.0 — the full-window view's CARD column width (the separator
      // between the image preview and the prompt/notes details).
      cardColWidth: clampCardColWidth(Number(rawSettings.cardColWidth ?? NaN)),
      // 0.31.0 — REASSIGNABLE SHORTCUTS: per-action combos. Invalid entries
      // fall back to their default; DUPLICATES resolve first-come (in the
      // SHORTCUT_ACTIONS roster order) so the stored map can never contain
      // one combo wired to two actions — the loser reverts to its default
      // (which itself is re-checked, so a hand-edited db that maps undo to
      // 'Ctrl+S' cannot shadow save).
      shortcuts: sanitizeShortcuts(rawSettings.shortcuts),
      // 1.1.8 — TOOLBAR FINISH IS RETIRED ("remove top bar gradient
      // option"): the toolbarGradient key is simply never copied anymore,
      // so an old database carrying 'satin' or 'steel' drops it on load —
      // the bars wear their plain surface + pattern, and theme.js sweeps
      // any stale attribute a previous session left on the root.
      // 0.30.0 — the performance switches (see DEFAULT_SETTINGS). Booleans
      // default ON.
      stageBlur: typeof rawSettings.stageBlur === 'boolean' ? rawSettings.stageBlur : DEFAULT_SETTINGS.stageBlur,
      hoverLifts: typeof rawSettings.hoverLifts === 'boolean' ? rawSettings.hoverLifts : DEFAULT_SETTINGS.hoverLifts,
      // 1.6.7 — THE CARD SHINE FAMILY (see DEFAULT_SETTINGS): the master
      // switch + the trims rung + the style dial. Booleans default ON
      // (the 1.6.2 law); the mode falls to 'sweep' unless it is one of
      // the true seats — old databases simply keep the classic
      // glare, nothing changes for anyone until they turn a dial.
      // 1.6.8 — THE GLINT LEAVES THE LADDER ("remove glint from shine
      // style"): a stored 'glint' walks onto 'sweep' at load — the
      // ladder speaks two voices now (sweep / pulse).
      shineOn: typeof rawSettings.shineOn === 'boolean' ? rawSettings.shineOn : DEFAULT_SETTINGS.shineOn,
      shineOverTrims:
        typeof rawSettings.shineOverTrims === 'boolean' ? rawSettings.shineOverTrims : DEFAULT_SETTINGS.shineOverTrims,
      shineMode: rawSettings.shineMode === 'pulse' ? 'pulse' : DEFAULT_SETTINGS.shineMode,
      // 1.9.12 — THE PRESS DIAL (see DEFAULT_SETTINGS): a stored 'squish' /
      // 'pulse' / 'none' survives; junk and every pre-1.9.12 database (the
      // key never existed) fall to 'none' — the report's own default, the
      // press resting silent until the dial is turned.
      cardPressAnim: ['squish', 'pulse', 'none'].includes(rawSettings.cardPressAnim)
        ? rawSettings.cardPressAnim
        : DEFAULT_SETTINGS.cardPressAnim,
      // 1.6.8 — THE LIVE DRAG PREVIEW (see DEFAULT_SETTINGS): a stored
      // boolean survives; anything else (every pre-1.6.8 database — the
      // key never existed) falls to the default. 1.9.12 — the default is
      // OFF now (the report's ask): fresh databases hold the wall still
      // through a drag, and a stored choice keeps its own either way.
      liveDragPreview:
        typeof rawSettings.liveDragPreview === 'boolean'
          ? rawSettings.liveDragPreview
          : DEFAULT_SETTINGS.liveDragPreview,
      tooltipFollow: typeof rawSettings.tooltipFollow === 'boolean' ? rawSettings.tooltipFollow : DEFAULT_SETTINGS.tooltipFollow,
      // 1.1.9 — THE EXPANDED SEATS SURVIVE THE LOAD ("expanding a card or
      // retracting it should be a savable thing and retain"): the ids of
      // cards sitting in their double-size seats, as a de-duplicated string
      // array. Ids of since-deleted cards ride along harmlessly (the grid
      // only consults the set for cards that render).
      expandedCards: Array.isArray(rawSettings.expandedCards)
        ? [...new Set(rawSettings.expandedCards.map((x) => String(x || '')).filter(Boolean))]
        : [...DEFAULT_SETTINGS.expandedCards],
      // 0.34.0 — AUTO-SWITCH IMAGES (see DEFAULT_SETTINGS): the stage's 5s
      // auto-walk switch, default off.
      autoSwipeImages:
        typeof rawSettings.autoSwipeImages === 'boolean' ? rawSettings.autoSwipeImages : DEFAULT_SETTINGS.autoSwipeImages,
      // 1.3.2 — CARD PREVIEW THUMBNAILS + AUTO PREVIEW GENERATION are
      // retired with the preview system (see DEFAULT_SETTINGS): the dead
      // keys from old databases simply fall away here — every import
      // builds its lightweight copies automatically now.
      // 1.3.0 — STAGED PANEL MOUNT survives the load (see
      // DEFAULT_SETTINGS): a stored OFF mounts the detail view whole.
      stagedPanelMount:
        typeof rawSettings.stagedPanelMount === 'boolean' ? rawSettings.stagedPanelMount : DEFAULT_SETTINGS.stagedPanelMount,
      // 1.1.3 — the UPDATE CHANNEL seat (see DEFAULT_SETTINGS / UPDATE_CHANNELS):
      // 'stable' (the default, one quiet ask on launch + the CHECK key) or
      // 'off' (fully offline). A stored choice survives; junk falls to stable.
      updateChannel: ['off', 'stable'].includes(rawSettings.updateChannel)
        ? rawSettings.updateChannel
        : DEFAULT_SETTINGS.updateChannel,
      // 1.3.3 — THE SPLASH FILM REELS, IN THEIR OWN VOICE (see
      // DEFAULT_SETTINGS): ON (the default) rolls the wings' strips with
      // the cards' covers; OFF mounts no reels at all. The retired
      // splashGeneratedReels key (the inverted 1.2.7 performance toggle)
      // is deliberately NOT carried over — no stored inversion survives
      // to fight the new law.
      splashFilmReels:
        typeof rawSettings.splashFilmReels === 'boolean'
          ? rawSettings.splashFilmReels
          : DEFAULT_SETTINGS.splashFilmReels,
      // 0.40.0 — CENTER THE REVEALED CLASS (see DEFAULT_SETTINGS): the
      // tree's reveal glide aims for the middle when on.
      centerClassOnReveal:
        typeof rawSettings.centerClassOnReveal === 'boolean'
          ? rawSettings.centerClassOnReveal
          : DEFAULT_SETTINGS.centerClassOnReveal,
      // 0.19.0 — LIVING BACKGROUND REMOVED: every stored mode key and color
      // override is deliberately NOT carried over — every database loads to
      // a still workspace, whatever it used to drift.
      // 0.14.0: button corner style ('theme' | 'square' | 'round').
      buttonStyle: ['theme', 'square', 'round'].includes(rawSettings.buttonStyle)
        ? rawSettings.buttonStyle
        : DEFAULT_SETTINGS.buttonStyle,
      // 1.6.3 — THE CARD'S OWN DIALS (see DEFAULT_SETTINGS): each falls back
      // to 'theme' (the active theme's own law) for every pre-1.6.3 database
      // — the key never existed, nothing changes for anyone until they turn
      // a dial.
      cardCorners: ['theme', 'round', 'square'].includes(rawSettings.cardCorners)
        ? rawSettings.cardCorners
        : DEFAULT_SETTINGS.cardCorners,
      // 1.6.4 — the shadow dial grew its STYLE seats ('soft' / 'sharp');
      // the 1.6.3 'on' value migrates onto 'soft' at load (the same look
      // it always painted, under its honest name).
      cardShadow: rawSettings.cardShadow === 'on'
        ? 'soft'
        : ['theme', 'off', 'soft', 'sharp'].includes(rawSettings.cardShadow)
          ? rawSettings.cardShadow
          : DEFAULT_SETTINGS.cardShadow,
      cardHover: ['theme', 'up', 'corner', 'none'].includes(rawSettings.cardHover)
        ? rawSettings.cardHover
        : DEFAULT_SETTINGS.cardHover,
      // 1.6.4 — the audit's two new dials: the cut-line family and the
      // stamp's stance, each born at 'theme' (junk falls home).
      trimLines: ['theme', 'solid', 'dashed'].includes(rawSettings.trimLines)
        ? rawSettings.trimLines
        : DEFAULT_SETTINGS.trimLines,
      stampTilt: ['theme', 'flat', 'tilted'].includes(rawSettings.stampTilt)
        ? rawSettings.stampTilt
        : DEFAULT_SETTINGS.stampTilt,
      // 0.42.0 — the BODY typeface ('mono' | 'grotesk' | 'serif'); anything
      // else falls back to the classic mono. 0.48.0 — 'custom' left the
      // allow-list with the imported-face feature itself ("remove the custom
      // font option"): an old database holding it sanitizes back to mono.
      uiFont: ['mono', 'grotesk', 'serif'].includes(rawSettings.uiFont)
        ? rawSettings.uiFont
        : DEFAULT_SETTINGS.uiFont,
      // 1.5.5 — THE LEGAL SEAT (see constants/legal.js): the terms
      // acknowledgment record, or null. Deliberately UN-migrated: an old
      // database (or a hand-edited one) that never accepted sanitizes to
      // null so the gate asks — the ONLY record that counts is one whose
      // version matches the running TOS_VERSION, and junk never does.
      tosAcceptance:
        rawSettings.tosAcceptance && typeof rawSettings.tosAcceptance === 'object' &&
        typeof rawSettings.tosAcceptance.version === 'string' &&
        rawSettings.tosAcceptance.version.trim() &&
        Number.isFinite(+rawSettings.tosAcceptance.at)
          ? {
              version: rawSettings.tosAcceptance.version.trim().slice(0, 24),
              at: +rawSettings.tosAcceptance.at,
              ...(typeof rawSettings.tosAcceptance.appVersion === 'string'
                ? { appVersion: rawSettings.tosAcceptance.appVersion.slice(0, 24) }
                : {}),
            }
          : null,
    },
  };
}

// 0.19.0 — the living background is gone; nothing sanitizes its modes
// anymore (createSafeDb simply drops the stored keys above).

// 0.14.0 — per-surface textures. A valid `textures` object wins surface by
// surface; a 0.12.0 single `texture` string migrates by spreading over the
// surfaces it used to cover (the top toolbar starts clean — it never wore
// patterns well). The 0.13.0 `workspace` key is DROPPED: the workspace
// surface is gone (it painted one pattern under every other surface, which
// read as everything blending together); anything invalid falls back to the
// shipped defaults.
// 0.34.0 — RENAME CONTINUITY, second round: the emoji wall is retired, so
// 'charms' / 'shuffle' / 'emojis' all migrate onto 'sparkles' (the scatter
// that carries the same idea without the font dependence); 'waves' and
// 'bauhaus' stay deleted outright, exactly like the older 'halftone' /
// 'clouds' removals.
const TEXTURE_RENAMES = { charms: 'sparkles', shuffle: 'sparkles', emojis: 'sparkles' };
function sanitizeTextures(raw, legacyString, textureIds) {
  const out = { ...DEFAULT_SETTINGS.textures };
  const surfaces = TEX_SURFACES.map((s) => s.id);
  const resolve = (id) => {
    const renamed = TEXTURE_RENAMES[id] || id;
    return textureIds.includes(renamed) ? renamed : null;
  };
  if (raw && typeof raw === 'object') {
    for (const id of surfaces) {
      const hit = resolve(raw[id]);
      if (hit) out[id] = hit;
    }
    return out;
  }
  if (typeof legacyString === 'string') {
    const hit = resolve(legacyString);
    if (hit) {
      out.sidebar = hit;
      out.viewer = hit;
      out.panel = hit;
      out.titlebar = 'none';
    }
  }
  return out;
}

// 1.1.6 — emptyDb is RETIRED ("remove deprecated code"): createSafeDb(null)
// has been the fresh-boot path since the sanitizer landed — this duplicate
// had no callers left.

// ---------------------------------------------------------------------------
// URLs, colors, misc
// ---------------------------------------------------------------------------

// Image URL for the local-resource protocol. We use a fixed single-char host
// ('l') and put the whole path, percent-encoded, in the URL path. Host
// parsing in Chromium mangles absolute paths that contain spaces or drive
// colons (e.g. "Burrito GenDex" under AppData); the path portion is never
// touched, so this form round-trips exactly.
export function buildImageUrl(imagesPath, filename) {
  const file = String(filename || '');
  if (!file) return '';
  // 1.2.6 — a data URI is already a URL: it passes through unwrapped (the
  // local-resource wrap would bury it inside a path and the image would
  // die). Real libraries only ever carry filenames — the harness seeds
  // carry data URIs, and the passthrough keeps both honest.
  if (file.startsWith('data:')) return file;
  const base = String(imagesPath || '').replace(/[\\/]+$/, '');
  const p = base ? `${base}/${file}` : file;
  return `local-resource://l/${encodeURIComponent(p)}`;
}

// Mirror of the main-process protocol handler, for tests.
export function decodeResourceUrl(url) {
  let rawPath = String(url || '').replace(/^local-resource:\/\/[^/]*\//, '');
  if (!rawPath) rawPath = String(url || '').replace(/^local-resource:\/*/i, '');
  return decodeURIComponent(rawPath);
}

export const thumbOf = (image) => (image?.thumb ? image.thumb : image?.file);

// ---------------------------------------------------------------------------
// 1.2.6 — THE SPLASH'S REEL DRAW (see Splash.jsx): the film strips
// flanking the boot lockup draw their frames through this ONE law, so the
// seating rules are pure and testable. The draw is seeded (mulberry32) —
// pass `seed` for deterministic tests; the default seeds from the clock so
// every launch deals a fresh reel.
//   · 1.2.6/1.2.7 evolved the law toward coverage (the walk);
//   · 1.2.8 — NO REPEATS, ANYWHERE ("the cards in the splash screen should
//     not repeat, even amongst the two"): the walk could seat the same
//     card several times across the strips (a 10-card pool on 16 seats
//     repeated 6 of them; a mid-size pool mirrored its lucky few onto
//     both sides). A card now appears AT MOST ONCE ON THE WHOLE SCREEN:
//     a pool that can fill every seat (≥ reelCount×slots) deals a plain
//     distinct cut of one shuffled walk; a shorter pool seats EVERY card
//     it owns exactly once, spread evenly through the screen, and pads
//     the remaining seats with fake seats ({ fake: true, seed }), which
//     Splash paints as pixel-art leader frames. The marquee seam laws are
//     subsumed (no seat equals any other seat, seam included).
//   · 1.2.8 — FOUR REELS ("add 2 other film reels into the splash screen"):
//     the draw returns an ARRAY of `reelCount` seat arrays (4 by default —
//     two per wing, the outer pair at the wing edges and the inner pair
//     closer to the lockup; Splash hides the inner pair on narrow windows).
// ---------------------------------------------------------------------------
const mulberry32 = (a) => () => {
  const t = (a += 0x6d2b79f5);
  let x = t;
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
};

export function buildSplashReels(pool, { slots = 8, reelCount = 4, seed = null } = {}) {
  const rand = mulberry32(Number.isFinite(seed) ? (seed | 0) : (Date.now() & 0x7fffffff) | 0);
  const cards = Array.from(pool || []).filter((u) => typeof u === 'string' && u);
  const reels = Math.max(1, Math.round(reelCount));
  const total = Math.max(1, Math.round(slots)) * reels;
  const shuffled = () => {
    const arr = cards.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  const seatsOf = (list) => list.map((url) => ({ url, fake: false }));
  if (cards.length >= total) {
    // THE DISTINCT CUT: one shuffled walk's first `total` seats — every
    // card on screen appears exactly once, nowhere twice (1.2.8's law).
    // The walk is already fully distinct by construction (a shuffle of the
    // whole pool, sliced across the reels in order).
    const walk = shuffled().slice(0, total);
    const out = [];
    for (let r = 0; r < reels; r += 1) out.push(seatsOf(walk.slice(r * slots, (r + 1) * slots)));
    return out;
  }
  // THE SHORT POOL. 1.3.1 — EVERY COLUMN CARRIES A REAL CARD FIRST ("ensure
  // when the splash screen picks the images from cards it doesnt pick
  // cards that have no images … sometimes i dont see the cards with images
  // i just see all pixels"): the old even spread dealt the pool's few real
  // covers at whole-number intervals across ONE flat seat list — with a
  // handful of image-cards among 32 seats, several of the four columns
  // could open with NO real card at all (every frame a pixel leader), and
  // the mid-reel starting phase could hide the few real ones for a whole
  // boot: the splash read "all pixels" while cards with images existed.
  // The deal is ROUND-ROBIN now: the shuffled pool is dealt one card per
  // COLUMN in order (column 1, 2, 3, 4, then 1, 2, ...) before any column
  // takes a second, so a pool of N >= reels puts a real cover in every
  // column's FIRST frame row, fakes pad the rest, and every card still
  // seats exactly once (the 1.2.8 no-repeat law holds: the round-robin is
  // a permutation of the same shuffled order). A lone card keeps the
  // mid-screen seat (the total/2 law).
  const order = shuffled();
  const seats = new Array(total).fill(null);
  if (order.length === 1) {
    seats[Math.floor(total / 2)] = order[0];
  } else {
    // pass 1 — round-robin the real cards: card j takes column (j % reels),
    // seating at the column's next free slot; every column earns a real
    // card before any column earns a second one. By construction this seats
    // the WHOLE short pool: the branch runs only when order.length < total,
    // so no column ever needs more than `slots` seats (ceil(< total /
    // reels) <= slots) and nothing overflows — no second pass exists.
    const colCursor = new Array(reels).fill(0);
    for (let j = 0; j < order.length; j += 1) {
      const col = j % reels;
      const slot = colCursor[col];
      if (slot < slots) {
        seats[col * slots + slot] = order[j];
        colCursor[col] += 1;
      }
    }
  }
  let fk = 0;
  const out = [];
  for (let r = 0; r < reels; r += 1) {
    out.push(
      seats.slice(r * slots, (r + 1) * slots).map((url) =>
        url !== null ? { url, fake: false } : { url: null, fake: true, seed: fk++ }
      )
    );
  }
  return out;
}

// 1.1.1 — the image record's one true shape: { file, thumb, prev }. Every
// construction site (creation, import, paste, drop, duplicate) builds its
// records through here so the preview tier's field can never be dropped by
// a forgotten destructure — the main process returns it on every save, and
// the card grid is the only reader.
export const imageRecord = (rec) => ({
  file: String(rec?.file || ''),
  thumb: rec?.thumb ? String(rec.thumb) : null,
  prev: rec?.prev ? String(rec.prev) : null,
});

export function readableInk(hex) {
  const h = String(hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return '#f7f1e4';
  const chan = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = chan.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  const lum = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  return lum > 0.45 ? '#17130c' : '#f7f1e4';
}

// 1.3.8 — IS THE PLATE EXTREME? ("keep it but i want it hidden so it doesnt
// affect the card color when its dark or light colores like black and white
// etc"): the seam-side trim rule goes silent when the card's own color sits
// at either end of the luminance rail (<= 0.2 or >= 0.8) — a near-black or
// near-white plate is exactly where a fixed gray separator line reads as a
// foreign stripe between the image and the card's color. Mid-tone plates
// keep the trim's full voice (the classic look, untouched).
export function isExtremePlateHex(hex) {
  const h = String(hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return false;
  const chan = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = chan.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  const lum = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  return lum <= 0.2 || lum >= 0.8;
}

// 0.38.0 — RELATIVE LUMINANCE of a #rrggbb (the icon-contrast pick below;
// the same math readableInk uses). 1.1.6 — no longer exported: module
// internal ("remove deprecated code" — theme.js carries its own copy).
function luminanceOfHex(hex) {
  const h = String(hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return 0;
  const chan = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = chan.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

const contrastRatio = (a, b) => {
  const la = luminanceOfHex(a);
  const lb = luminanceOfHex(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
};

// 0.38.0 — SHIFT A HEX toward white (amount > 0) or black (amount < 0).
// Used by the class-icon contrast pick: a deep blue icon on a deep blue wash
// blends into nothing; the lighter OR darker variant — whichever reads better
// against the wash — takes the glyph instead ("the icon would be colored
// lighter or darker depending on which is more obvious").
export function shiftHex(hex, amount) {
  const h = String(hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return '#cccccc';
  const mix = (ch) => {
    const v = parseInt(h.slice(ch, ch + 2), 16);
    const target = amount >= 0 ? 255 : 0;
    const next = Math.round(v + (target - v) * Math.abs(amount));
    return Math.min(255, Math.max(0, next)).toString(16).padStart(2, '0');
  };
  return `#${mix(0)}${mix(2)}${mix(4)}`;
}

// 0.38.0 — THE CLASS ICON'S OWN CONTRAST ("sometimes when coloring like in
// deep blue, the icon may blend too well when its colored like this, fix
// that so the icon would be colored lighter or darker depending on which is
// more obvious"): the raw class color is tested against the WASH the card
// actually paints (a panel mix of the same color). When the raw hex reads
// weakly on its own wash, the LIGHTER and DARKER variants are both measured
// and whichever has more contrast wins; the raw color is returned unchanged
// whenever it already reads clearly.
// 1.0.7 — THE LADDER ("some class colors like blue blend the icon too much
// into the container of the class, fix that so its brighter or darker
// depending on which fits more"): the old pick had two soft spots — a thin
// 3.2:1 keep-raw bar (a mid blue passes it while still melting into a
// blue-tinted plate; 13px glyphs need real separation, not the large-type
// floor) and a single ±0.42 shift that could itself land soft on stubborn
// hues. The pick now walks a LADDER of increasingly strong variants, both
// directions, gentlest first: the first variant that clears a stiff 4.6:1
// wins, so the icon keeps as much of the class's own color as it can while
// actually reading; if nothing clears the bar, the strongest measured
// variant takes it. The icon always stays the class's HUE, only its
// LIGHTNESS moves.
const asHex6 = (v) => {
  const h = String(v ?? '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(h) ? h.toLowerCase() : null;
};
export function contrastAwareIconColor(clsColor, panelHex) {
  const raw = asHex6(clsColor);
  if (!raw) return clsColor; // not a clean hex — the caller's fallback rules
  const base = asHex6(panelHex) || '#1a1a1f';
  if (contrastRatio(raw, base) >= 4.6) return raw; // already obvious at a read
  const ladder = [];
  for (const amt of [0.22, 0.38, 0.54, 0.7, 0.85]) {
    ladder.push(shiftHex(raw, amt), shiftHex(raw, -amt));
  }
  for (const candidate of ladder) {
    if (contrastRatio(candidate, base) >= 4.6) return candidate; // gentlest pass
  }
  let best = raw;
  let bestRatio = contrastRatio(raw, base);
  for (const candidate of ladder) {
    const ratio = contrastRatio(candidate, base);
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = candidate;
    }
  }
  return best;
}

// 0.38.0 — THE WASH A CLASS CARD PAINTS for a given class color + theme
// panel (mirrors the CSS color-mix(in srgb, cls 22%, panel)): used by the
// icon-contrast pick so the measurement sees the surface the icon actually
// sits on.
export function mixHex(a, b, weightOfA) {
  const ha = String(a || '').replace('#', '');
  const hb = String(b || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(ha) || !/^[0-9a-fA-F]{6}$/.test(hb)) return '#1a1a1f';
  const mix = (i) => {
    const va = parseInt(ha.slice(i, i + 2), 16);
    const vb = parseInt(hb.slice(i, i + 2), 16);
    return Math.round(va * weightOfA + vb * (1 - weightOfA))
      .toString(16)
      .padStart(2, '0');
  };
  return `#${mix(0)}${mix(2)}${mix(4)}`;
}

// 1.7.0 — THE CONTAINER'S OWN FACE + INK ("prompt and notes colors
// (alongside dark and light aspects) should ignore theme colors and color
// its own (including text if its black), so the dark doesnt look pale
// still in light themes while light looks dark in dark scenes, basically
// improve the coloring application"): the 1.6.x colored-container law
// mixed the picked hex INTO THE THEME'S panel — 9% of the color over
// whatever the theme's ground happened to be — so a dark navy container
// on a light theme read as a pale blue veil, and a pale yellow on a dark
// theme read as murk: the color's OWN aspect drowned in the theme's.
// 1.7.1 — THE FACE KEEPS ITS ASPECT, LOSES ITS SLAB ("the container
// styles for the prompts is currently fucked, follow the principles of
// neumorphism into it (aka colors should differenciate in darkness in
// depth) … light theme is darker for some reason, fix it"): the 1.7.0
// answer snapped every hex at a 0.45-luminance cliff toward an ABSOLUTE
// extreme — 45% of the color over #101010 for most saturated picks — so
// a vivid red or navy painted a near-black slab under every theme and
// the light theme's containers read darker than the dial's own LIGHT
// voice promised. The neumorphic law speaks in TWO rungs now, both
// inside the color's own family: the LIGHT shade is the color LIFTED
// toward white by its own luminance (light hexes lift far — a pastel
// whisper; dark hexes lift only a fifth — genuinely dark, never mud),
// and the DEEP shade is the color ITSELF at full weight — so the dial
// differentiates in darkness the way a depth ladder should (LIGHT is
// always the lighter rung, under every theme). The INK follows the
// face's polarity (readableInk's bar) exactly as 1.7.0 had it. The
// other two outputs are the ladder's own steps:
//   · --part-title — the TITLE band's rung: the row's name field + the
//     expanded window's title box speak it, one measurable shade inside
//     the face;
//   · --part-well — the content well's FULL step — the field reads
//     clearly CARVED into the container, never the flat same-ground
//     plate.
// 1.7.3 — THE LADDER SPEAKS ITS OWN STEPS ("the colors seem to blend in
// too much between each different component such as the title container,
// the prompt container, the entire container, left stripe, etc"): the
// 1.7.1 ladder spoke ONE depth — the steps widened to 8% and 24%.
// 1.7.4 — THE LADDER EARNS ITS RUNGS BY CONTRAST, NOT BY PERCENT ("colors
// such as pink and such blend in too much, add outlines and improve the
// coloring pallet, things such as contrast, or how colors shift from the
// title to the container to everything, and text colors should also be
// fixed since sometimes it blends in too much"): a fixed mix percent is
// blind to the hex it mixes — on a saturated pink (a face whose
// luminance barely moves as you mix) 8% and 24% measured 1.06:1 and
// 1.20:1 against the face, rungs the eye cannot see, and the 0.45 ink
// cliff handed that same bright pink the PAPER-WHITE ink (2.01:1) while
// near-black would have measured 9.3:1. Every rung is now computed to a
// TARGET CONTRAST (contrastRatio-walked, the same measurement WCAG
// speaks), the anchor direction is whichever side of the family actually
// separates (a 50% probe of each extreme, measured), and the ink is the
// direction — dark or light — that reads best against EVERY rung the
// text sits on (face, title, well), pushed to pure black/white when a
// stubborn mid still falls under 3:1. One new voice joins the ladder:
//   · --part-line — the OUTLINE ink: the picked color itself walked
//     toward the anchor until it clears 1.45:1 against the face, so the
//     row's frame, the title field's border and the content well's rim
//     finally speak a drawn line instead of the 34-72% washes that read
//     as nothing on saturated families.
// 1.7.5 — THE SPINE JOINS THE LADDER ("the prompt/note pallet is better,
//   just the left ribbon color should be fixed so it doesnt clip to the
//   rest, it shouldnt match the inner container of the prompt nor the
//   overall container"): the left ribbon spoke raw --part-color washes
//   (82% / 92% over its neighbor, and on the DEEP stage the raw color
//   itself — LITERALLY the outer container's face), so on half the dial
//   the spine melted into the very surfaces it was meant to divide. The
//   spine is a rung of its own now, earned like every other:
//   · --part-spine — the picked color itself walked toward the anchor
//     until it clears 1.6:1 against the face — one step the title (1.35)
//     never touches and the well (1.8) never reaches: a drawn edge that
//     belongs to the ribbon alone, never the face, never the well.
// 1.7.6 — THE SPINE IS THE LIGHTEST ELEMENT ("i dont want it changing
//   color or becoming more blended in, change that so its always the
//   lightest element and isnt affected by the darkening effect when i
//   select the prompt box, the effect should only effect the box but not
//   the ribbon on the left"): the 1.7.5 rung walked toward the ANCHOR —
//   on every light-anchored face that dove DARK (the second-darkest seat
//   of the whole row), and the focus ground's 12% step (well -> face)
//   landed exactly on the rung it measured: selecting the box swallowed
//   the ribbon whole (1.00-1.06:1 on the measured dial). The spine walks
//   toward the LIGHT EXTREME unconditionally now, and its law is
//   LUMINANCE, not a contrast ratio: it must out-light the face, the
//   title AND the well by a step the eye can file (0.09 of headroom,
//   clamped at the family's own white when the dial starts near it) —
//   in-family on every hex, deep or not. No ground the box can ever mix
//   (the focus law only moves between the well and the face) can reach
//   the ribbon's rung again, and the ribbon never reads blended into
//   anything it divides — the effect moves the box alone, never the
//   ribbon.
// Returns null for anything that is not a clean hex; the CSS keeps its
// classic fallbacks when the vars never arrive.
const partInkDark = '#17130c';
const partInkLight = '#f7f1e4';
// Walk `base` toward `toward` in 4% steps until the mix clears `target`
// contrast against `against`; the first pass wins, the extreme is the
// floor (some saturated families can only whisper — they still get the
// strongest rung available).
function partStepToContrast(base, toward, target, against) {
  for (let w = 0.96; w >= 0.08; w -= 0.04) {
    const cand = mixHex(base, toward, w);
    if (contrastRatio(cand, against) >= target) return cand;
  }
  return mixHex(base, toward, 0.04);
}
export function partContainerFace(hex, deep = false) {
  const raw = asHex6(hex);
  if (!raw) return null;
  const lum = Math.min(1, Math.max(0, luminanceOfHex(raw)));
  const face = deep
    ? raw
    : mixHex(raw, '#ffffff', 1 - (0.2 + 0.34 * lum));
  // the ladder's own anchor: the direction whose 50% probe SEPARATES
  // harder (a saturated pink's dark cousin outruns its pastel one, a deep
  // navy's lift outruns its mud) — the rungs climb the side of the family
  // that actually reads, not the side a 0.45 cliff guessed.
  const darkProbe = mixHex(face, '#101010', 0.5);
  const lightProbe = mixHex(face, '#ffffff', 0.5);
  const anchor = contrastRatio(face, darkProbe) >= contrastRatio(face, lightProbe) ? '#101010' : '#ffffff';
  // the rungs, each EARNED (1.35:1 / 1.8:1 — the title a visible band,
  // the well an unmistakable carve, on every hex the dial can speak).
  const title = partStepToContrast(face, anchor, 1.35, face);
  const well = partStepToContrast(face, anchor, 1.8, face);
  // the outline ink: the picked color itself, walked toward the anchor
  // until the frame clears 1.45:1 against the face — saturated, in-family.
  const line = partStepToContrast(raw, anchor, 1.45, face);
  // 1.7.5 — the spine's own rung (SUPERSEDED by the 1.7.6 lightest-element
  // law below — kept here as the rung's own history): the raw color walked
  // to 1.6:1 against the face — between the title and the well, a step no
  // other seat speaks.
  // 1.7.6 — THE LIGHTEST SEAT: the spine climbs from the raw color toward
  // the light extreme (mixHex's weight is the RAW's own share — the climb
  // hands the raw over to white 4% at a time) until its LUMINANCE clears
  // every seat the row can paint (face, title, well) by a visible step —
  // the first mix that clears wins, so the ribbon stays maximally
  // in-family; the 96%-white extreme is the floor no hex can fail to
  // reach. The ribbon is the row's lightest element on every hex, and the
  // focus ground (which only ever mixes between the well and the face)
  // can never reach its rung.
  const seatLum = (c) => luminanceOfHex(c);
  const lightestSeat = Math.max(seatLum(face), seatLum(title), seatLum(well));
  const spineTarget = lightestSeat + 0.09;
  let spine = mixHex(raw, '#ffffff', 0.04);
  for (let i = 0; i <= 24; i += 1) {
    const cand = mixHex(raw, '#ffffff', 1 - i * 0.04);
    if (seatLum(cand) >= spineTarget) {
      spine = cand;
      break;
    }
  }
  // the ink: whichever direction reads best against EVERY rung the text
  // sits on (the row's face, the title field, the content well) — never a
  // cliff's guess; pushed to the pure extreme when a mid still blurs.
  const seats = [face, title, well];
  const worst = (ink) => Math.min(...seats.map((s) => contrastRatio(s, ink)));
  let ink = worst(partInkDark) >= worst(partInkLight) ? partInkDark : partInkLight;
  if (worst(ink) < 3) ink = ink === partInkDark ? '#000000' : '#ffffff';
  // 1.8.0 — THE WELL'S OWN INK ("text color in note/prompt containers
  // should rely on the color of the container inside of it, not the color
  // of the container generally (since the text container usually is
  // darker)"): --part-ink above is the whole row's compromise — ONE ink
  // held readable against the face AND both fields, so the well's text
  // wore a pick made lighter or darker for the face it never sits on.
  // The content well speaks its own pick now: whichever direction reads
  // best against the WELL rung alone — the darker inner container the
  // note/prompt text actually lives in — measured across its resting
  // ground AND the focus gather (the 32-point lift toward the face the
  // 1.7.7 law paints while the text is being typed), pushed to the pure
  // extreme when a mid still blurs. The face keeps --part-ink for the
  // seats that truly ride it (the title field, the row's own labels).
  const wellGather = mixHex(well, face, 0.68);
  const wellSeats = [well, wellGather];
  const wellWorst = (inkCand) => Math.min(...wellSeats.map((s) => contrastRatio(s, inkCand)));
  let wellInk = wellWorst(partInkDark) >= wellWorst(partInkLight) ? partInkDark : partInkLight;
  if (wellWorst(wellInk) < 3) wellInk = wellInk === partInkDark ? '#000000' : '#ffffff';
  // the var-keyed spread: seats merge this straight into a style object.
  return {
    ['--part-face']: face,
    ['--part-ink']: ink,
    ['--part-well-ink']: wellInk,
    ['--part-title']: title,
    ['--part-well']: well,
    ['--part-line']: line,
    ['--part-spine']: spine,
  };
}

// ---------------------------------------------------------------------------
// 0.24.0 — HSV <-> HEX for the in-app color picker (the SV field + hue rail).
// Kept tiny and dependency-free; both directions round-trip exactly for any
// #rrggbb (hexToHsv -> hsvToHex reproduces the input to the hex digit).
// ---------------------------------------------------------------------------
export function hsvToHex(h, s, v) {
  const hh = ((Number(h) % 360) + 360) % 360;
  const ss = Math.min(1, Math.max(0, Number(s) || 0));
  const vv = Math.min(1, Math.max(0, Number(v) || 0));
  const c = vv * ss;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = vv - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hh < 60) [r, g, b] = [c, x, 0];
  else if (hh < 120) [r, g, b] = [x, c, 0];
  else if (hh < 180) [r, g, b] = [0, c, x];
  else if (hh < 240) [r, g, b] = [0, x, c];
  else if (hh < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to2 = (n) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

export function hexToHsv(hex) {
  const h = String(hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let hue = 0;
  if (d > 0) {
    if (max === r) hue = 60 * (((g - b) / d) % 6);
    else if (max === g) hue = 60 * ((b - r) / d + 2);
    else hue = 60 * ((r - g) / d + 4);
  }
  if (hue < 0) hue += 360;
  return { h: Math.round(hue * 10) / 10, s: max > 0 ? d / max : 0, v: max };
}

// A hex string typed by hand -> a valid #rrggbb, or null (for the hex fields).
export function normalizeHexInput(raw) {
  const v = String(raw || '')
    .trim()
    .replace(/^#*/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(v)) return null;
  return `#${v.toLowerCase()}`;
}

export function bufToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

// Explicit map first (svg+xml, x-icon...), generic fallback second.
export function extFromMime(mime) {
  const m = String(mime || '').toLowerCase();
  const explicit = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/bmp': '.bmp',
    'image/avif': '.avif',
    'image/tiff': '.tiff',
    'image/svg+xml': '.svg',
    'image/x-icon': '.ico',
    'image/vnd.microsoft.icon': '.ico',
    'image/jfif': '.jfif',
  };
  if (explicit[m]) return explicit[m];
  const sub = m.split('/')[1] || 'png';
  const clean = sub.replace(/[^a-z0-9]/gi, '').toLowerCase();
  return `.${clean || 'png'}`;
}

export function fmtDate(ts) {
  const t = Number.isFinite(+ts) ? new Date(+ts) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

// 0.33.0 — SAVE A DOM BLOB WITH ITS OWN LIGHTWEIGHT THUMB ("make it so
// that the outer thumbnail of the card is not the high quality of the
// image, so it doesnt lag out when processing"). Electron's nativeImage
// only decodes PNG/JPEG — WEBP / AVIF / exotic imports fell through the
// old thumb pass and the grid decoded the FULL file for every card. The
// renderer's own canvas paints the 480px thumb instead (Chromium's
// decoder reads every format the browser does), and the record's thumb
// rides along to the main process as base64. Falls back to the plain
// save when there is no DOM (tests) or the bitmap refuses to decode —
// the main process then tries its nativeImage pass as before.
// 0.40.0 — TRANSPARENCY LIVES ("also account for all image formats
// including webp , transparency and so on"): the thumb's alpha is SCANNED
// before encoding — a single see-through pixel and the thumb is PNG (a
// JPEG would pour black behind every transparent pixel, blackening
// logos, webp cutouts and ghost stamps in the grid); fully opaque
// sources keep the tiny JPEG they always were. The thumb's extension
// rides along so the main process files it under the right name (and
// image:delete cleans both).
export async function saveImageBlobWithThumb(blob) {
  const buffer = await blob.arrayBuffer();
  let ext = extFromMime(blob.type);
  if (!blob.type) {
    const fromName = `.${String(blob.name || '').split('.').pop().toLowerCase() || 'png'}`;
    ext = /^\.[a-z0-9]{2,5}$/.test(fromName) ? fromName : '.png';
  }
  let thumbB64 = null;
  let thumbExt = '.jpg';
  try {
    if (typeof createImageBitmap === 'function' && typeof document !== 'undefined' && document.createElement) {
      const bmp = await createImageBitmap(blob);
      // only shrink: a source already ≤480px wide is its own thumb
      if (bmp.width > 480) {
        const w = 480;
        const h = Math.max(1, Math.round((bmp.height / bmp.width) * w));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(bmp, 0, 0, w, h);
        // 0.40.0 — the alpha scan: any pixel below full opacity flips the
        // thumb to PNG. (The thumb is already painted, so the scan is a
        // cheap pass over ~300k bytes — nothing re-decodes.)
        let transparent = false;
        try {
          const data = ctx.getImageData(0, 0, w, h).data;
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 255) {
              transparent = true;
              break;
            }
          }
        } catch {
          transparent = false; // unreadable pixels — the safe old JPEG path
        }
        const dataUrl = transparent ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.9);
        thumbB64 = String(dataUrl || '').split(',')[1] || null;
        thumbExt = transparent ? '.png' : '.jpg';
      }
      bmp.close?.();
    }
  } catch {
    thumbB64 = null; // the main process's nativeImage pass takes over
  }
  const api = (typeof window !== 'undefined' && window.api) || null;
  return (await api?.saveImageBuffer?.(bufToBase64(buffer), ext, thumbB64, thumbExt)) || null;
}
