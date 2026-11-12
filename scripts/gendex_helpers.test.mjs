// Pure-logic assertions for Burrito GenDex helpers (node, no DOM/React).
import assert from 'node:assert/strict';
import {
  ROOT_CLASS_ID,
  CARD_TRIMS,
  makeCharacter,
  makeClass,
  makeTag,
  makeVersion,
  RICH_TOKENS,
  DEFAULT_CARD_TRIM,
  DEFAULT_STAMP_SETTINGS,
  ZOOM_RANGE,
  DEFAULT_STAMP_HUE_ALPHA,
  DEFAULT_STAMP_ALPHA,
  sanitizeStampPos,
  sanitizeStampScale,
  sanitizeStampRot,
  sanitizeStampHueAlpha,
  sanitizeStampAlpha,
  sanitizeStampSettings,
} from '../src/constants/index.js';
import {
  normalizePartText,
  composeVersionOutput,
  countOutputStats,
  nextVersionLabel,
  getPreviewVersion,
  sortCharacters,
  searchCharacters,
  classChildren,
  flattenClasses,
  isDescendantOfClass,
  descendantClassIds,
  countCharactersInClassTree,
  classLabelPath,
  moveClass,
  spotlightState,
  spotlightMatchState,
  visibleStampsFor,
  bandStampTransform,
  stampImageMatches,
  stampImageIndex,
  resolveStampHue,
  dominantColorOf,
  stampHueAlpha,
  stampAlpha,
  parseRichRanges,
  parseRichText,
  stripRichText,
  activeRichRangeKinds,
  toggleRichRange,
  adjustRichRanges,
  mergeRichRanges,
  serializeRichText,
  migrateLegacyRich,
  masonryColumns,
  layoutMasonry,
  autoCropFor,
  clampCrop,
  effectiveCrop,
  createSafeDb,
  buildImageUrl,
  decodeResourceUrl,
  readableInk,
  hsvToHex,
  hexToHsv,
  normalizeHexInput,
  extFromMime,
  fmtDate,
} from '../src/utils/helpers.js';

let passed = 0;
const ok = (name, fn) => {
  fn();
  passed += 1;
  console.log(`  ok ${passed} — ${name}`);
};

// --- compose engine ----------------------------------------------------------
ok('typed line breaks survive composing (never collapse to spaces)', () => {
  assert.equal(normalizePartText('body\nline two\nline three'), 'body\nline two\nline three');
  assert.equal(composeVersionOutput({ parts: [{ include: true, content: 'a\nb' }] }), 'a\nb');
});
ok('normalization: CRLF -> LF, trailing spaces trimmed, max one blank line', () => {
  assert.equal(normalizePartText('a\r\nb'), 'a\nb');
  assert.equal(normalizePartText('a  \n\t b  '), 'a\n\t b');
  assert.equal(normalizePartText('a\n\n\n\nb'), 'a\n\nb');
});
ok('joins included parts with exactly one newline', () => {
  const out = composeVersionOutput({
    parts: [
      { include: true, content: 'body' },
      { include: false, content: 'feet' },
      { include: true, content: 'face' },
    ],
  });
  assert.equal(out, 'body\nface');
});
ok('skips included-but-empty parts (no blank lines)', () => {
  const out = composeVersionOutput({
    parts: [
      { include: true, content: 'body' },
      { include: true, content: '   ' },
      { include: true, content: 'face' },
    ],
  });
  assert.equal(out, 'body\nface');
});
ok('stats report parts, chars, lines, skipped', () => {
  const s = countOutputStats({
    parts: [
      { include: true, content: 'alpha' },
      { include: false, content: 'beta' },
      { include: true, content: '' },
      { include: true, content: 'gamma\nsecond line' },
    ],
  });
  assert.equal(s.total, 4);
  assert.equal(s.included, 3);
  assert.equal(s.skipped, 1);
  assert.equal(s.lines, 3); // 'gamma', 'second line' + 'alpha' = 3 lines
  // 0.28.0 — WORDS joins the ledger (the compose sheet's stat strip)
  assert.equal(s.words, 4); // alpha + gamma + second + line
});

// --- versions -------------------------------------------------------------------
ok('version labels auto-increment (V1,V10 -> V11)', () => {
  assert.equal(nextVersionLabel([]), 'V1');
  assert.equal(nextVersionLabel([{ label: 'V1' }]), 'V2');
  assert.equal(nextVersionLabel([{ label: 'V1' }, { label: 'V10' }]), 'V11');
  assert.equal(nextVersionLabel([{ label: 'alt outfit' }]), 'V1');
});
ok('preview version: explicit wins, else newest', () => {
  const c = { previewVersionId: 'b', versions: [{ id: 'a', createdAt: 10 }, { id: 'b', createdAt: 5 }] };
  assert.equal(getPreviewVersion(c).id, 'b');
  const c2 = { previewVersionId: null, versions: [{ id: 'a', createdAt: 10 }, { id: 'b', createdAt: 50 }] };
  assert.equal(getPreviewVersion(c2).id, 'b');
});
ok('makeVersion accepts label/color/icon/notes overrides with fallbacks', () => {
  const v = makeVersion([{ label: 'V1' }], [{ file: 'a.png' }], {
    label: ' alt outfit ',
    color: '#ffd400',
    icon: 'Flame',
    notes: 'soft shading',
  });
  assert.equal(v.label, 'alt outfit');
  assert.equal(v.color, '#ffd400');
  assert.equal(v.icon, 'Flame');
  assert.equal(v.notes, 'soft shading');
  assert.equal(v.images.length, 1);
  assert.equal(v.loras, undefined); // lora section removed
  const auto = makeVersion([{ label: 'V1' }], [], { color: 'nope', icon: 'Ghost2' });
  assert.equal(auto.label, 'V2');
  assert.equal(auto.color, null);
  assert.equal(auto.icon, null);
});
ok('makeVersion accepts letter icons', () => {
  const v = makeVersion([], [], { icon: 'letter:a' });
  assert.equal(v.icon, 'letter:a');
});
ok('makeCharacter takes card look + first-version details', () => {
  const c = makeCharacter(
    'amy',
    ROOT_CLASS_ID,
    [{ file: 'x.png', thumb: 't.jpg' }],
    { ratio: { w: 4, h: 7 }, trim: 'ledger', crop: { x: 0.1, y: 0, w: 0.6, h: 0.6 } },
    { label: 'V9', color: '#7ecb8f', icon: 'letter:A' }
  );
  assert.deepEqual(c.cardRatio, { w: 4, h: 7 });
  assert.equal(c.cardTrim, 'ledger');
  assert.deepEqual(c.cardCrop, { x: 0.1, y: 0, w: 0.6, h: 0.6 });
  assert.equal(c.versions.length, 1);
  assert.equal(c.versions[0].label, 'V9');
  assert.equal(c.versions[0].color, '#7ecb8f');
  assert.equal(c.versions[0].icon, 'letter:A');
  assert.equal(c.versions[0].images.length, 1);
  const plain = makeCharacter('x');
  assert.equal(plain.cardRatio, null);
  assert.equal(plain.cardTrim, DEFAULT_CARD_TRIM);
  assert.equal(plain.cardCrop, null);
  assert.equal(plain.versions[0].label, 'V1');
});

// --- trims -------------------------------------------------------------------------
ok('buggy trims are gone from the palette', () => {
  const ids = CARD_TRIMS.map((t) => t.id);
  for (const gone of [
    'stitch', 'photo', 'cuts', 'ticket', 'hazard', 'reg', 'brackets', 'mat',
    // 0.15.0 — the flat rules removed by request:
    'solid', 'dots', 'ring', 'ring2',
  ]) {
    assert.ok(!ids.includes(gone), `${gone} should be removed`);
  }
  for (const keep of ['none', 'dash', 'double', 'bold', 'ledger', 'frame', 'gallery', 'scallop']) {
    assert.ok(ids.includes(keep), `${keep} should remain`);
  }
});

ok('0.18.0 engraved trims + the 0.19.0 rivet join the palette (labels + ids)', () => {
  const byId = Object.fromEntries(CARD_TRIMS.map((t) => [t.id, t]));
  assert.equal(byId.gold.label, 'Gold Engraving');
  assert.equal(byId.vine.label, 'Vine Engraving');
  // 0.28.0 — scale mail AND the rope braid are retired; the beaded chain
  // takes the slot (axis-aligned pearls — nothing left to drift)
  assert.equal(byId.beads.label, 'Beaded Chain');
  assert.ok(!byId.scales, 'scale mail left the palette');
  assert.ok(!byId.rope, 'the rope braid left the palette too');
  assert.equal(byId.rivet.label, 'Riveted Band');
  // the flat line rules stay untouched alongside the new detailed set
  assert.ok(byId.dash && byId.double && byId.bold && byId.ledger);
  assert.equal(CARD_TRIMS.length, 12);
});

// --- rich text (name formatting — 0.7.0 TAG tokens) ------------------------------
ok('rich tokens are defined and distinct (7 formats)', () => {
  const codes = Object.values(RICH_TOKENS);
  assert.equal(new Set(codes).size, 7);
  assert.deepEqual(codes.sort(), ['b', 'g', 'i', 'm', 'o', 's', 'u']);
});
ok('plain punctuation is CONTENT — no more phantom markup', () => {
  // These were all eaten or misfired as markup in 0.5–0.6; now they're text.
  assert.equal(stripRichText('a/b'), 'a/b');
  assert.equal(stripRichText('x+y'), 'x+y');
  assert.equal(stripRichText('kira_mare'), 'kira_mare');
  assert.equal(stripRichText('e=f'), 'e=f');
  assert.equal(stripRichText('100^2'), '100^2');
  assert.equal(stripRichText('a * b'), 'a * b');
  assert.equal(stripRichText('~~x'), '~~x');
  assert.deepEqual(parseRichText('a/b + c=d_e'), [{ text: 'a/b + c=d_e' }]);
});
ok('parseRichText splits every format', () => {
  const segs = parseRichText('<b>bold</b> <i>ital</i> <u>und</u> <s>str</s> <g>big</g> <m>small</m> <o>outline</o> plain');
  const byText = Object.fromEntries(segs.map((s) => [s.text, s]));
  assert.equal(byText.bold.bold, true);
  assert.equal(byText.ital.italic, true);
  assert.equal(byText.und.underline, true);
  assert.equal(byText.str.strike, true);
  assert.equal(byText.big.big, true);
  assert.equal(byText.small.small, true);
  assert.equal(byText.outline.outline, true);
  assert.ok(!byText[' plain'].bold);
});
ok('formats MIX — <b><g>both</g></b> renders bold+big on the same letters', () => {
  const segs = parseRichText('<b><g>both</g></b>');
  assert.deepEqual(segs, [{ text: 'both', bold: true, big: true }]);
});
ok('unpaired tags never leak into rendered text', () => {
  // A stray close with no open is markup noise — dropped everywhere.
  assert.equal(stripRichText('a </b> b'), 'a  b');
  // An unclosed open extends to the end; its tag chars never render.
  assert.equal(stripRichText('a <b>bc'), 'a bc');
  assert.equal(parseRichText('a </b> b').map((s) => s.text).join(''), 'a  b');
  // A non-format tag like <x> stays literal content.
  assert.equal(stripRichText('a <x> b'), 'a <x> b');
});
ok('stripRichText removes all markup (search/sort/messages)', () => {
  assert.equal(stripRichText('<b>A</b><g>my</g><m>ok</m><o>!</o>'), 'Amyok!');
  assert.equal(stripRichText('plain'), 'plain');
});
ok('toggleRichRange applies a format to the selected letters (plain coords)', () => {
  const r = toggleRichRange([], 1, 4, 'bold'); // "ell" of "hello"
  assert.equal(serializeRichText('hello', r.ranges), 'h<b>ell</b>o');
  assert.equal(r.selStart, 1);
  assert.equal(r.selEnd, 4);
});
ok('toggleRichRange removes an active format for exactly those letters', () => {
  const { plain, ranges } = parseRichRanges('<b>hello</b>');
  const r = toggleRichRange(ranges, 1, 4, 'bold'); // "ell" inside bold
  assert.equal(serializeRichText(plain, r.ranges), '<b>h</b>ell<b>o</b>');
});
ok('toggleRichRange merges with adjacent same-format ranges', () => {
  const step1 = toggleRichRange([], 0, 2, 'bold'); // <b>ab</b>cd
  const step2 = toggleRichRange(step1.ranges, 2, 4, 'bold'); // then "cd"
  assert.equal(serializeRichText('abcd', step2.ranges), '<b>abcd</b>');
});
ok('0.11.0 mergeRichRanges: touching same-kind runs become ONE run', () => {
  const merged = mergeRichRanges([
    { kind: 'bold', start: 0, end: 2 },
    { kind: 'bold', start: 2, end: 5 },
    { kind: 'italic', start: 1, end: 3 },
  ]);
  assert.deepEqual(merged, [
    { kind: 'bold', start: 0, end: 5 },
    { kind: 'italic', start: 1, end: 3 },
  ]);
  // overlapping runs merge too; garbage drops out
  assert.deepEqual(
    mergeRichRanges([{ kind: 'bold', start: 3, end: 1 }, { kind: 'nope', start: 0, end: 2 }]),
    []
  );
});
ok('0.11.0 parse merges adjacent tags at the source (round-trip canonical)', () => {
  const { plain, ranges } = parseRichRanges('<b>ab</b><b>cd</b>');
  assert.equal(plain, 'abcd');
  assert.deepEqual(ranges, [{ kind: 'bold', start: 0, end: 4 }]);
  assert.equal(serializeRichText(plain, ranges), '<b>abcd</b>');
});
ok('toggleRichRange stacks formats (mixing)', () => {
  const step1 = toggleRichRange([], 0, 3, 'bold'); // <b>amy</b>
  const step2 = toggleRichRange(step1.ranges, 0, 3, 'italic');
  assert.equal(serializeRichText('amy', step2.ranges), '<b><i>amy</i></b>');
  const segs = parseRichText('<b><i>amy</i></b>');
  assert.deepEqual(segs, [{ text: 'amy', bold: true, italic: true }]);
});
ok('activeRichRangeKinds reports the formats covering the selection', () => {
  const { plain, ranges } = parseRichRanges('<b><i>amy</i></b>');
  const all = activeRichRangeKinds(ranges, 0, plain.length);
  assert.ok(all.includes('bold') && all.includes('italic'));
  const inner = activeRichRangeKinds(ranges, 0, 3); // just "amy"
  assert.ok(inner.includes('bold') && inner.includes('italic'));
  // plain text selection -> nothing active
  assert.deepEqual(activeRichRangeKinds([], 1, 3), []);
  // collapsed selection -> nothing active
  assert.deepEqual(activeRichRangeKinds(ranges, 2, 2), []);
});
ok('0.11.0 active detection is COVERAGE-based (touching runs count, gaps do not)', () => {
  // two bold runs touching: [0,2)+[2,5) — the whole selection IS bold
  const touching = [
    { kind: 'bold', start: 0, end: 2 },
    { kind: 'bold', start: 2, end: 5 },
  ];
  assert.deepEqual(activeRichRangeKinds(touching, 0, 5), ['bold']);
  assert.deepEqual(activeRichRangeKinds(touching, 1, 4), ['bold']);
  // one-letter gap: not fully covered -> NOT active
  const gapped = [
    { kind: 'bold', start: 0, end: 2 },
    { kind: 'bold', start: 3, end: 5 },
  ];
  assert.deepEqual(activeRichRangeKinds(gapped, 0, 5), []);
  // a run INSIDE the selection only -> not active either
  const inner = [{ kind: 'bold', start: 1, end: 2 }];
  assert.deepEqual(activeRichRangeKinds(inner, 0, 5), []);
});
ok('0.11.0 toggle: fully-bold touching runs REMOVE on first press (the reported bug)', () => {
  // bold "ab", bold "cd" separately -> two touching runs; select all + B
  // must unbold, not silently re-merge
  const step1 = toggleRichRange([], 0, 2, 'bold');
  const step2 = toggleRichRange(step1.ranges, 2, 4, 'bold');
  assert.equal(serializeRichText('abcd', step2.ranges), '<b>abcd</b>');
  const unbold = toggleRichRange(step2.ranges, 0, 4, 'bold');
  assert.deepEqual(unbold.ranges, []);
  // partial remove keeps the untouched letters bold
  const partial = toggleRichRange(step2.ranges, 1, 3, 'bold');
  assert.equal(serializeRichText('abcd', partial.ranges), '<b>a</b>bc<b>d</b>');
});
ok('adjustRichRanges: typing inside a formatted run keeps it formatted', () => {
  const { plain, ranges } = parseRichRanges('h<b>ell</b>o'); // bold on "ell"
  const next = adjustRichRanges(ranges, plain, 'hexllo'); // typed x inside ell
  assert.equal(serializeRichText('hexllo', next), 'h<b>exll</b>o');
});
ok('adjustRichRanges: typing at a range START stays unformatted', () => {
  const { plain, ranges } = parseRichRanges('<b>ell</b>o');
  const next = adjustRichRanges(ranges, plain, 'Xello'); // X before the bold run
  assert.equal(serializeRichText('Xello', next), 'X<b>ell</b>o');
});
ok('adjustRichRanges: ranges shift after later edits', () => {
  const { plain, ranges } = parseRichRanges('<b>ell</b>o');
  const next = adjustRichRanges(ranges, plain, 'ello!'); // appended!
  assert.equal(serializeRichText('ello!', next), '<b>ell</b>o!');
});
ok('adjustRichRanges: deleting the formatted text drops the range', () => {
  const { plain, ranges } = parseRichRanges('h<b>ell</b>o');
  const next = adjustRichRanges(ranges, plain, 'ho'); // "ell" deleted
  assert.equal(serializeRichText('ho', next), 'ho');
});
ok('adjustRichRanges: backspace at the end shrinks the range', () => {
  const { plain, ranges } = parseRichRanges('<b>ell</b>o');
  const next = adjustRichRanges(ranges, plain, 'elo'); // lost one l
  assert.equal(serializeRichText('elo', next), '<b>el</b>o');
});
ok('0.11.0 adjust: deleting the gap between two same-kind runs merges them', () => {
  const { plain, ranges } = parseRichRanges('<b>ab</b>X<b>cd</b>');
  const next = adjustRichRanges(ranges, plain, 'abcd'); // X deleted
  assert.deepEqual(next, [{ kind: 'bold', start: 0, end: 4 }]);
  assert.equal(serializeRichText('abcd', next), '<b>abcd</b>');
});
ok('serializeRichText round-trips through parseRichRanges', () => {
  const marked = '<b><i>amy</i></b> ok <g>!</g>';
  const { plain, ranges } = parseRichRanges(marked);
  assert.equal(serializeRichText(plain, ranges), marked);
});
ok('selection indices map through tokens (marked -> plain)', () => {
  const { plain, markedToPlainIdx } = parseRichRanges('<b><i>amy</i></b>');
  assert.equal(plain, 'amy');
  assert.equal(markedToPlainIdx[6], 0); // 'a' starts at marked 6
  assert.equal(markedToPlainIdx[9], 3); // after 'y' = plain 3
});
ok('legacy single-char markup migrates to tags on load', () => {
  assert.equal(migrateLegacyRich('*Amy*'), '<b>Amy</b>');
  assert.equal(migrateLegacyRich('*^both^*'), '<b><g>both</g></b>');
  assert.equal(migrateLegacyRich('a/b'), 'a/b'); // no pair — was always content
  assert.equal(migrateLegacyRich('kira_mare'), 'kira_mare'); // unpaired _ survives as text
  assert.equal(migrateLegacyRich('plain'), 'plain');
});
ok('createSafeDb NEVER migrates names (1.1.9: names survive updates untouched)', () => {
  const db = createSafeDb({
    characters: [{ name: '*legacy*', versions: [{ label: '^V1^' }] }],
    classes: [{ name: 'a_b', parentId: 'root' }],
    tags: [{ name: '~wip~' }],
  });
  // 1.1.9 — the load path stopped editing names ("dont edit the card
  // between updates"): paired legacy tokens stay AS STORED through every
  // load and save; the migration lives on only in migrateLegacyRich
  // itself (still exported, still tested above) for anyone who asks.
  assert.equal(db.characters[0].name, '*legacy*');
  assert.equal(db.characters[0].versions[0].label, '^V1^');
  assert.equal(db.classes[0].name, 'a_b');
  assert.equal(db.tags[0].name, '~wip~');
});
ok('0.28.0 createSafeDb migrates retired trims: scale mail + rope braid -> beaded chain', () => {
  const db = createSafeDb({
    characters: [
      { name: 'knight', cardTrim: 'scales' },
      { name: 'sailor', cardTrim: 'rope' },
      { name: 'smith', cardTrim: 'rivet' },
      { name: 'ghost', cardTrim: 'definitely-not-a-trim' },
    ],
  });
  assert.equal(db.characters[0].cardTrim, 'beads', 'old scale-mail cards land on the beaded chain');
  assert.equal(db.characters[1].cardTrim, 'beads', 'old rope-braid cards land on the beaded chain too');
  assert.equal(db.characters[2].cardTrim, 'rivet', 'surviving trims pass through untouched');
  assert.equal(db.characters[3].cardTrim, DEFAULT_CARD_TRIM, 'unknown ids still fall back to the default');
});
ok('search and sort see through markup', () => {
  const list = [{ name: '<b>amy</b>', createdAt: 1 }, { name: 'zeta', createdAt: 2 }];
  assert.equal(searchCharacters(list, 'amy').length, 1);
  assert.deepEqual(sortCharacters(list, 'az').map((c) => c.name), ['<b>amy</b>', 'zeta']);
});

// --- masonry packing (per-card sizes, no gaps) ----------------------------------
ok('masonryColumns computes column count with gaps', () => {
  assert.equal(masonryColumns(1000, 185, 20), 4); // 4*185 + 3*20 = 800 <= 1000; 5 -> 1005 > 1000
  assert.equal(masonryColumns(800, 185, 20), 4); // exactly 4*185+3*20 = 800
  assert.equal(masonryColumns(150, 185, 20), 1);
  assert.equal(masonryColumns(0, 185, 20), 1);
});
ok('layoutMasonry packs shortest-column-first, order preserved', () => {
  const { positions, height, columns } = layoutMasonry([100, 300, 100, 100], 3, 100, 10);
  assert.equal(columns, 3);
  // 1.1.9 re-law: every position carries its span (the 1.1.8 span seat
  // made span:1 part of the truth; the pin catches up to it here).
  assert.deepEqual(positions, [
    { x: 0, y: 0, span: 1 },
    { x: 110, y: 0, span: 1 },
    { x: 220, y: 0, span: 1 },
    { x: 0, y: 110, span: 1 }, // col 0 shortest after item 0
  ]);
  assert.equal(height, 300); // tallest column 300+10, minus the trailing gap
});
ok('layoutMasonry with equal heights fills row by row', () => {
  const { positions } = layoutMasonry([50, 50, 50, 50, 50], 2, 100, 10);
  assert.deepEqual(positions.map((p) => [p.x, p.y, p.span]), [
    [0, 0, 1],
    [110, 0, 1],
    [0, 60, 1],
    [110, 60, 1],
    [0, 120, 1],
  ]);
});

// --- card crop -------------------------------------------------------------------
ok('autoCropFor returns the largest centered ratio-locked rect', () => {
  const c = autoCropFor({ w: 3, h: 4 }, 2);
  assert.equal(c.h, 1);
  assert.ok(Math.abs(c.w - 0.375) < 1e-9);
  assert.equal(c.y, 0);
  assert.ok(Math.abs(c.x - 0.3125) < 1e-9);
  const c2 = autoCropFor({ w: 16, h: 10 }, 0.5);
  assert.equal(c2.w, 1);
  assert.ok(Math.abs(c2.h - 0.3125) < 1e-9);
  assert.equal(c2.x, 0);
  assert.ok(Math.abs(c2.y - 0.34375) < 1e-9);
  const c3 = autoCropFor({ w: 1, h: 1 }, 1);
  assert.deepEqual(c3, { x: 0, y: 0, w: 1, h: 1 });
});
ok('clampCrop keeps the rect ratio-locked and inside the image', () => {
  const clamped = clampCrop({ x: -0.2, y: 0.5, w: 2, h: 0.1 }, { w: 3, h: 4 }, 2);
  assert.equal(clamped.w, 0.375);
  assert.equal(clamped.h, 1);
  assert.equal(clamped.x, 0);
  assert.equal(clamped.y, 0);
  assert.equal(clampCrop(null, { w: 3, h: 4 }, 1), null);
  assert.equal(clampCrop({ x: 'x' }, { w: 3, h: 4 }, 1), null);
});
ok('effectiveCrop falls back to the auto-centered rect', () => {
  const auto = effectiveCrop(null, { w: 3, h: 4 }, 2);
  assert.equal(auto.h, 1);
  const manual = effectiveCrop({ x: 0.1, y: 0.1, w: 0.5, h: 0.1 }, { w: 3, h: 4 }, 2);
  assert.equal(manual.w, 0.375);
  assert.equal(manual.h, 1);
  assert.equal(manual.x, 0.1);
  assert.equal(manual.y, 0);
});

// --- tag spotlight -----------------------------------------------------------------
ok('spotlightState v3: include tags are required on the card', () => {
  assert.equal(spotlightState(['t1'], { include: ['t1'] }), 'match');
  assert.equal(spotlightState(['t2'], { include: ['t1'] }), 'nomatch');
  assert.equal(spotlightState([], { include: ['t1'] }), 'nomatch');
  assert.equal(spotlightState(['t9'], {}), 'match'); // nothing active
});
ok('spotlightState v3: ALL include tags must be present (AND)', () => {
  assert.equal(spotlightState(['t1', 't2'], { include: ['t1', 't2'] }), 'match');
  assert.equal(spotlightState(['t1', 't3'], { include: ['t1', 't2'] }), 'nomatch');
});
ok('spotlightState v3: exclude tags disqualify the card', () => {
  assert.equal(spotlightState(['t1'], { exclude: ['t1'] }), 'nomatch');
  assert.equal(spotlightState(['t2'], { exclude: ['t1'] }), 'match');
  assert.equal(spotlightState([], { exclude: ['t1'] }), 'match');
});
ok('spotlightState v3: exclude beats include on the same card', () => {
  assert.equal(spotlightState(['t1', 't2'], { include: ['t1'], exclude: ['t2'] }), 'nomatch');
  assert.equal(spotlightState(['t1', 't2'], { include: ['t1'], exclude: ['t9'] }), 'match');
});
ok('spotlightState v3: neutral (empty filter) — everything matches', () => {
  assert.equal(spotlightState(['t1'], { include: [], exclude: [] }), 'match');
  assert.equal(spotlightState([], {}), 'match');
});

// --- sorting & search ---------------------------------------------------------------
ok('custom sort = array order; newest/oldest by createdAt; no mutation', () => {
  const chars = [
    { name: 'beta', createdAt: 100 },
    { name: 'alpha', createdAt: 200 },
    { name: 'gamma', createdAt: 50 },
  ];
  assert.deepEqual(sortCharacters(chars, 'custom').map((c) => c.name), ['beta', 'alpha', 'gamma']);
  assert.deepEqual(sortCharacters(chars, 'newest').map((c) => c.name), ['alpha', 'beta', 'gamma']);
  assert.deepEqual(sortCharacters(chars, 'oldest').map((c) => c.name), ['gamma', 'beta', 'alpha']);
  assert.equal(chars[0].name, 'beta'); // input untouched
});
ok('search: names only by default — tags are NEVER searched', () => {
  const list = [
    { name: 'amy', tags: ['t1'], versions: [{ label: 'V1', parts: [{ name: 'body', content: 'gold hair' }] }] },
    { name: 'rinn', tags: ['t2'], versions: [] },
  ];
  assert.equal(searchCharacters(list, 'amy').length, 1);
  // tag name, part name, part content, version label: all ignored by default
  assert.equal(searchCharacters(list, 'wip').length, 0);
  assert.equal(searchCharacters(list, 'body').length, 0);
  assert.equal(searchCharacters(list, 'gold').length, 0);
  assert.equal(searchCharacters(list, 'V1').length, 0);
  assert.equal(searchCharacters(list, '').length, 2);
});
ok('search: advanced mode adds prompts, version names and notes — still never tags', () => {
  const list = [
    {
      name: 'amy',
      tags: ['t1'],
      versions: [
        { label: 'alt outfit', notes: 'gold hair', parts: [{ name: 'body', content: 'silver armor' }] },
      ],
    },
    { name: 'rinn', tags: [{ name: 'wip' }], versions: [] },
  ];
  assert.equal(searchCharacters(list, 'outfit', { advanced: true }).length, 1); // version label
  assert.equal(searchCharacters(list, 'silver', { advanced: true }).length, 1); // part content
  assert.equal(searchCharacters(list, 'armor', { advanced: true }).length, 1); // part content
  assert.equal(searchCharacters(list, 'body', { advanced: true }).length, 1); // part name
  assert.equal(searchCharacters(list, 'gold', { advanced: true }).length, 1); // notes
  assert.equal(searchCharacters(list, 'wip', { advanced: true }).length, 0); // tags never
});

// --- class tree -----------------------------------------------------------------------
const CLASSES = [
  { id: 'root-x', name: 'X', parentId: ROOT_CLASS_ID },
  { id: 'root-y', name: 'Y', parentId: ROOT_CLASS_ID },
  { id: 'x-sub', name: 'Sub', parentId: 'root-x' },
  { id: 'x-sub-deep', name: 'Deep', parentId: 'x-sub' },
];

ok('classChildren returns direct children of a level', () => {
  assert.deepEqual(classChildren(CLASSES, ROOT_CLASS_ID).map((c) => c.id), ['root-x', 'root-y']);
  assert.deepEqual(classChildren(CLASSES, 'root-x').map((c) => c.id), ['x-sub']);
});
ok('flattenClasses emits depth-tagged pre-order', () => {
  const flat = flattenClasses(CLASSES);
  assert.deepEqual(flat.map((c) => `${c.id}:${c.depth}`), ['root-x:0', 'x-sub:1', 'x-sub-deep:2', 'root-y:0']);
});
ok('isDescendantOfClass(ancestor, id) detects subtree membership', () => {
  assert.equal(isDescendantOfClass(CLASSES, 'root-x', 'x-sub'), true);
  assert.equal(isDescendantOfClass(CLASSES, 'root-x', 'x-sub-deep'), true);
  assert.equal(isDescendantOfClass(CLASSES, 'x-sub', 'root-x'), false);
  assert.equal(isDescendantOfClass(CLASSES, 'root-x', 'root-x'), false);
});
ok('descendantClassIds includes the root id', () => {
  assert.deepEqual(descendantClassIds(CLASSES, 'x-sub'), ['x-sub', 'x-sub-deep']);
});
ok('countCharactersInClassTree: recursive; root counts everything', () => {
  const chars = [
    { classId: 'root-x' },
    { classId: null },
    { classId: ROOT_CLASS_ID },
    { classId: 'x-sub' },
  ];
  assert.equal(countCharactersInClassTree(chars, CLASSES, ROOT_CLASS_ID), 4);
  assert.equal(countCharactersInClassTree(chars, CLASSES, 'root-x'), 2); // root-x + x-sub
  assert.equal(countCharactersInClassTree(chars, CLASSES, 'root-y'), 0);
});
ok('classLabelPath builds "Parent > Child" with markup stripped', () => {
  const classes = [
    { id: 'root-x', name: '<b>X</b>', parentId: ROOT_CLASS_ID },
    { id: 'x-sub', name: '<g>Sub</g>', parentId: 'root-x' },
  ];
  assert.equal(classLabelPath(classes, 'x-sub'), 'X > Sub');
  assert.equal(classLabelPath(CLASSES, ROOT_CLASS_ID), 'Unsorted');
});

// --- moveClass ----------------------------------------------------------------------------
ok('moveClass inside: re-parents under target after its last child', () => {
  const next = moveClass(CLASSES, 'root-y', 'root-x', 'inside');
  assert.equal(next.find((c) => c.id === 'root-y').parentId, 'root-x');
  assert.deepEqual(classChildren(next, 'root-x').map((c) => c.id), ['x-sub', 'root-y']);
});
ok('moveClass above/below: becomes sibling at the right slot', () => {
  const above = moveClass(CLASSES, 'x-sub', 'root-y', 'above');
  assert.equal(above.find((c) => c.id === 'x-sub').parentId, ROOT_CLASS_ID);
  assert.deepEqual(classChildren(above, ROOT_CLASS_ID).map((c) => c.id), ['root-x', 'x-sub', 'root-y']);
  const below = moveClass(CLASSES, 'x-sub', 'root-y', 'below');
  assert.deepEqual(classChildren(below, ROOT_CLASS_ID).map((c) => c.id), ['root-x', 'root-y', 'x-sub']);
});
ok('moveClass onto ROOT inside: moves to top level', () => {
  const next = moveClass(CLASSES, 'x-sub-deep', ROOT_CLASS_ID, 'inside');
  assert.equal(next.find((c) => c.id === 'x-sub-deep').parentId, ROOT_CLASS_ID);
});
ok('moveClass blocks self and own-subtree targets (cycle guard)', () => {
  const self = moveClass(CLASSES, 'root-x', 'root-x', 'inside');
  assert.equal(self, CLASSES);
  const cycle = moveClass(CLASSES, 'root-x', 'x-sub-deep', 'inside');
  assert.equal(cycle, CLASSES);
});
ok('moveClass preserves siblings of other branches', () => {
  const next = moveClass(CLASSES, 'root-y', 'root-x', 'inside');
  assert.deepEqual(classChildren(next, ROOT_CLASS_ID).map((c) => c.id), ['root-x']);
  assert.deepEqual(classChildren(next, 'x-sub-deep').map((c) => c.id), []);
});

// --- createSafeDb ----------------------------------------------------------------------------
ok('null input -> default db (ZINE theme — 1.6.0 the main theme, zoom 2, custom sort, per-surface textures, panel on)', () => {
  const db = createSafeDb(null);
  assert.deepEqual(db.characters, []);
  assert.deepEqual(db.classes, []);
  assert.deepEqual(db.stamps, []); // 0.15.0 — the global stamp library starts empty
  assert.equal(db.settings.theme, 'zine'); // 1.6.0 — zine punk is the main theme
  assert.equal(db.settings.defaultSortMode, 'custom');
  assert.deepEqual(db.settings.textures, { titlebar: 'none', sidebar: 'none', viewer: 'dots', panel: 'dots' }); // zine's own set (1.6.0: the sticker-sheet grit)
  assert.equal(db.settings.detailPanel, true);
  assert.equal(db.settings.zoom, ZOOM_RANGE.default);
  assert.equal(ZOOM_RANGE.default, 7); // 1.6.8 — the ten-step ladder kept the old default's PIXELS (155px was step 2, is step 7)
  assert.equal(db.settings.zoomLadder, 2); // 1.6.8 — fresh databases carry the new-ladder marker
  assert.deepEqual(db.settings.cardRatio, { w: 3, h: 4 });
  assert.equal(db.settings.tagScale, 1);
  assert.equal(db.settings.promptBottom, true);
  assert.equal(db.settings.advancedSearch, false);
  assert.equal(db.settings.showHelpText, false);
  assert.equal(db.settings.buttonStyle, 'theme');
  // 0.36.0 — AUTO-SWITCH IMAGES: a fresh db starts WALKING ("auto switch
  // image slides is on by default"); a stored choice keeps its own.
  assert.equal(db.settings.autoSwipeImages, true);
});
ok('0.13.0 per-surface textures validate surface by surface with fallbacks', () => {
  const db = createSafeDb({ settings: { textures: { viewer: 'sparkles', panel: 'checkerboard', sidebar: 'halftone' }, detailPanel: 'yes', tagScale: 9, cardRatio: { w: '4', h: '7' } } });
  assert.equal(db.settings.textures.viewer, 'sparkles');
  assert.equal(db.settings.textures.sidebar, 'none'); // 0.15.0: halftone was removed — falls back (1.6.0: the sidebar default is zine's clean none)
  assert.equal(db.settings.textures.panel, 'dots'); // junk id falls back (zine default)
  assert.equal(db.settings.textures.titlebar, 'none');
  assert.equal('workspace' in db.settings.textures, false); // 0.14.0: surface removed
  assert.equal(db.settings.detailPanel, true);
  assert.equal(db.settings.tagScale, 2); // clamped to range max
  assert.deepEqual(db.settings.cardRatio, { w: 4, h: 7 }); // numeric strings coerce
  const db2 = createSafeDb({ settings: { tagScale: 0.1, cardRatio: { w: -3, h: 4 } } });
  assert.equal(db2.settings.tagScale, 0.6);
  assert.deepEqual(db2.settings.cardRatio, { w: 3, h: 4 }); // invalid falls back
});

// --- 0.26.0/0.34.0: texture renames / removals ---------------------------------------
ok('0.34.0 texture sanitize: charms + shuffle + emojis RENAME onto sparkles; waves + bauhaus fall back', () => {
  const db = createSafeDb({
    settings: { textures: { viewer: 'charms', panel: 'shuffle', sidebar: 'waves', titlebar: 'bauhaus' } },
  });
  assert.equal(db.settings.textures.viewer, 'sparkles'); // renamed, not dropped
  assert.equal(db.settings.textures.panel, 'sparkles'); // renamed, not dropped
  assert.equal(db.settings.textures.sidebar, 'none'); // removed — default (1.6.0: zine's clean none)
  assert.equal(db.settings.textures.titlebar, 'none'); // removed — default
  // the retired emoji id itself migrates too
  const db1b = createSafeDb({ settings: { textures: { viewer: 'emojis' } } });
  assert.equal(db1b.settings.textures.viewer, 'sparkles');
  // the legacy single-string texture migrates through the rename too
  const db2 = createSafeDb({ settings: { texture: 'shuffle' } });
  assert.equal(db2.settings.textures.viewer, 'sparkles');
  assert.equal(db2.settings.textures.sidebar, 'sparkles');
  assert.equal(db2.settings.textures.panel, 'sparkles');
  // the current id survives untouched
  const db3 = createSafeDb({ settings: { textures: { viewer: 'xmark' } } });
  assert.equal(db3.settings.textures.viewer, 'xmark');
});
ok('0.14.0 migration: a 0.12.0 single texture string spreads (toolbar clean, workspace key dropped)', () => {
  const db = createSafeDb({ settings: { texture: 'grid' } });
  assert.equal(db.settings.textures.sidebar, 'grid');
  assert.equal(db.settings.textures.viewer, 'grid');
  assert.equal(db.settings.textures.panel, 'grid');
  assert.equal(db.settings.textures.titlebar, 'none'); // the toolbar starts clean
  assert.equal('workspace' in db.settings.textures, false); // surface is gone
  assert.equal('texture' in db.settings, false); // stale key never leaks
  const db2 = createSafeDb({ settings: { texture: 'checkerboard' } });
  assert.equal(db2.settings.textures.viewer, 'dots'); // junk falls to zine defaults (1.6.0: the polka viewer)
  // a 0.13.0 db that stored a workspace pattern: the key is dropped silently
  const db3 = createSafeDb({ settings: { textures: { workspace: 'graph', viewer: 'graph' } } });
  assert.equal('workspace' in db3.settings.textures, false);
  assert.equal(db3.settings.textures.viewer, 'graph');
});
ok('0.14.0 buttonStyle: valid ids pass, junk falls back to theme', () => {
  assert.equal(createSafeDb({ settings: { buttonStyle: 'square' } }).settings.buttonStyle, 'square');
  assert.equal(createSafeDb({ settings: { buttonStyle: 'round' } }).settings.buttonStyle, 'round');
  assert.equal(createSafeDb({ settings: { buttonStyle: 'wavy' } }).settings.buttonStyle, 'theme');
  assert.equal(createSafeDb({}).settings.buttonStyle, 'theme');
});
ok('promptBottom / advancedSearch / showHelpText validate as booleans', () => {
  assert.equal(createSafeDb({ settings: { promptBottom: false } }).settings.promptBottom, false);
  assert.equal(createSafeDb({ settings: { promptBottom: 'nope' } }).settings.promptBottom, true);
  assert.equal(createSafeDb({ settings: { advancedSearch: true } }).settings.advancedSearch, true);
  assert.equal(createSafeDb({ settings: { showHelpText: true } }).settings.showHelpText, true);
  assert.equal(createSafeDb({ settings: { showHelpText: 1 } }).settings.showHelpText, false);
});
ok('legacy hideTooltips key is dropped', () => {
  const db = createSafeDb({ settings: { hideTooltips: true } });
  assert.equal('hideTooltips' in db.settings, false);
});
ok('0.24.0 hsvToHex / hexToHsv round-trip every hex digit (the in-app picker math)', () => {
  const samples = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#7ec8e3', '#c8402f', '#f6c945', '#123456', '#aabbcc'];
  for (const hex of samples) {
    const hsv = hexToHsv(hex);
    assert.ok(hsv && Number.isFinite(hsv.h) && hsv.h >= 0 && hsv.h < 360, `${hex} -> bad hue`);
    assert.equal(hsvToHex(hsv.h, hsv.s, hsv.v), hex, `${hex} must round-trip`);
  }
  // the pure corners of the cylinder
  assert.equal(hsvToHex(0, 0, 0), '#000000');
  assert.equal(hsvToHex(0, 0, 1), '#ffffff');
  assert.equal(hsvToHex(0, 1, 1), '#ff0000');
  assert.equal(hsvToHex(120, 1, 1), '#00ff00');
  assert.equal(hsvToHex(240, 1, 1), '#0000ff');
  // hue wraps, saturation/value clamp
  assert.equal(hsvToHex(360, 1, 1), '#ff0000');
  assert.equal(hsvToHex(-360, 1, 1), '#ff0000');
  assert.equal(hsvToHex(30, 2, 2), hsvToHex(30, 1, 1));
  // junk hex -> null (the hex fields gate on this)
  assert.equal(hexToHsv('nope'), null);
  assert.equal(hexToHsv(null), null);
});

ok('0.24.0 normalizeHexInput: hand-typed hex -> #rrggbb or null', () => {
  assert.equal(normalizeHexInput('#FF0044'), '#ff0044');
  assert.equal(normalizeHexInput('ff0044'), '#ff0044');
  assert.equal(normalizeHexInput('  #ABC123  '), '#abc123');
  assert.equal(normalizeHexInput('##ff0044'), '#ff0044'); // double hash tolerated
  assert.equal(normalizeHexInput('#ff0'), null);
  assert.equal(normalizeHexInput('orange'), null);
  assert.equal(normalizeHexInput(''), null);
});

ok('tagPosition setting: corner passes, junk falls back to mark (the 0.24.0 default)', () => {
  assert.equal(createSafeDb({ settings: { tagPosition: 'mark' } }).settings.tagPosition, 'mark');
  assert.equal(createSafeDb({ settings: { tagPosition: 'corner' } }).settings.tagPosition, 'corner');
  assert.equal(createSafeDb({ settings: { tagPosition: 'diagonal' } }).settings.tagPosition, 'mark');
  assert.equal(createSafeDb({}).settings.tagPosition, 'mark');
});
ok('0.19.0 living background REMOVED: every stored mode key drops — the workspace is always still', () => {
  for (const gone of ['none', 'clouds', 'fluid', 'slice', 'riptide', 'velvet', 'pixel', 'aurora', 'swirl']) {
    const settings = createSafeDb({ settings: { animatedBgMode: gone, animatedBgSky: '#112233', animatedBgPuffs: '#445566' } }).settings;
    assert.equal('animatedBgMode' in settings, false, `${gone} should be dropped`);
    assert.equal('animatedBgSky' in settings, false);
    assert.equal('animatedBgPuffs' in settings, false);
  }
});
ok('0.19.0 the 0.11.0 boolean animatedBg also drops (nothing migrates — the feature is gone)', () => {
  const settings = createSafeDb({ settings: { animatedBg: true } }).settings;
  assert.equal('animatedBg' in settings, false);
  assert.equal('animatedBgMode' in settings, false);
});
ok('removed paperdex theme falls back to zine (the 1.6.0 main theme)', () => {
  const db = createSafeDb({ settings: { theme: 'paperdex' } });
  assert.equal(db.settings.theme, 'zine');
});
ok('orphaned classIds fall to ROOT; unknown parents fall to ROOT', () => {
  const db = createSafeDb({
    characters: [{ id: 'c1', classId: 'ghost' }],
    classes: [{ id: 'k1', parentId: 'ghost' }],
  });
  assert.equal(db.characters[0].classId, ROOT_CLASS_ID);
  assert.equal(db.classes[0].parentId, ROOT_CLASS_ID);
});
ok('tag ids are validated on characters; tag colors get fallbacks', () => {
  const db = createSafeDb({
    tags: [{ id: 't1', name: 'wip' }],
    characters: [{ id: 'c1', tags: ['t1', 't2'] }],
  });
  assert.deepEqual(db.characters[0].tags, ['t1']);
  assert.ok(/^#[0-9a-fA-F]{6}$/.test(db.tags[0].color));
});
ok('class cycles are broken to top level', () => {
  const db = createSafeDb({
    classes: [
      { id: 'a', parentId: 'b' },
      { id: 'b', parentId: 'a' },
    ],
  });
  const a = db.classes.find((c) => c.id === 'a');
  const b = db.classes.find((c) => c.id === 'b');
  assert.ok(a.parentId === ROOT_CLASS_ID || b.parentId === ROOT_CLASS_ID);
});
ok('tags get icon + trim validation with fallbacks; letter icons pass', () => {
  const db = createSafeDb({
    tags: [
      { id: 't1', name: 'wip', color: '#c8402f', icon: 'Flame', trim: 'v' },
      { id: 't2', name: 'bad', color: 'nope', icon: 'NotAnIcon', trim: 'swirl' },
      { id: 't3', name: 'letter', color: '#a3c24a', icon: 'letter:Q', trim: 'notch' },
    ],
  });
  assert.equal(db.tags[0].icon, 'Flame');
  assert.equal(db.tags[0].trim, 'v');
  assert.equal(db.tags[1].icon, null);
  assert.equal(db.tags[1].trim, 'straight');
  assert.ok(/^#[0-9a-fA-F]{6}$/.test(db.tags[1].color)); // color fallback
  assert.equal(db.tags[2].icon, 'letter:Q');
  assert.equal(db.tags[2].trim, 'notch');
});
ok('class icons validated; invalid dropped; letters allowed', () => {
  const db = createSafeDb({
    classes: [
      { id: 'k1', name: 'ok', icon: 'Flame' },
      { id: 'k2', name: 'bad', icon: 'NotAnIcon' },
      { id: 'k3', name: 'lettered', icon: 'letter:m' },
    ],
  });
  assert.equal(db.classes[0].icon, 'Flame');
  assert.equal(db.classes[1].icon, null);
  assert.equal(db.classes[2].icon, 'letter:m');
});
ok('version icons validated against lucide palette; invalid dropped; letters pass', () => {
  const db = createSafeDb({
    characters: [
      { id: 'c1', versions: [{ id: 'v1', icon: 'Flame' }, { id: 'v2', icon: 'NotAnIcon' }, { id: 'v3', icon: 'letter:Z' }] },
    ],
  });
  assert.equal(db.characters[0].versions[0].icon, 'Flame');
  assert.equal(db.characters[0].versions[1].icon, null);
  assert.equal(db.characters[0].versions[2].icon, 'letter:Z');
});
ok('version notes survive; loras are dropped (section removed)', () => {
  const db = createSafeDb({
    characters: [
      {
        id: 'c1',
        versions: [{ id: 'v1', notes: 'keep me', loras: [{ id: 'l1', name: 'gone' }] }],
      },
    ],
  });
  assert.equal(db.characters[0].versions[0].notes, 'keep me');
  assert.equal('loras' in db.characters[0].versions[0], false);
});
ok('per-character cardRatio/cardTrim/cardCrop are sanitized', () => {
  const db = createSafeDb({
    characters: [
      {
        id: 'c1',
        name: 'ok',
        cardRatio: { w: 4, h: 7 },
        cardTrim: 'ledger',
        cardCrop: { x: 0.2, y: 0.1, w: 0.5, h: 0.5 },
      },
      {
        id: 'c2',
        name: 'bad-ratio',
        cardRatio: { w: 'x', h: 7 },
        cardTrim: 'zigzag',
        cardCrop: { x: 0.9, y: 0, w: 0.5, h: 0.5 }, // outside the image
      },
      {
        id: 'c3',
        name: 'removed-trim',
        cardTrim: 'ticket', // removed trim -> falls back to default
      },
    ],
  });
  assert.deepEqual(db.characters[0].cardRatio, { w: 4, h: 7 });
  assert.equal(db.characters[0].cardTrim, 'ledger');
  assert.deepEqual(db.characters[0].cardCrop, { x: 0.2, y: 0.1, w: 0.5, h: 0.5 });
  assert.equal(db.characters[1].cardRatio, null);
  assert.equal(db.characters[1].cardTrim, DEFAULT_CARD_TRIM);
  assert.equal(db.characters[1].cardCrop, null); // x+w > 1 rejected
  assert.equal(db.characters[2].cardTrim, DEFAULT_CARD_TRIM); // removed trim id rejected
});
ok('invalid color overrides are stripped', () => {
  const db = createSafeDb({ settings: { colors: { accent: 'red', bg: '#112233' } } });
  assert.deepEqual(db.settings.colors, { bg: '#112233' });
});
ok('makeClass accepts letter icons; invalid stays null', () => {
  assert.equal(makeClass('K', ROOT_CLASS_ID, 'letter:k').icon, 'letter:k');
  assert.equal(makeClass('K', ROOT_CLASS_ID, 'Nope').icon, null);
});
ok('makeTag accepts letter icons and validates trim', () => {
  const t = makeTag('wip', '#ffd400', 'letter:W', 'notch');
  assert.equal(t.icon, 'letter:W');
  assert.equal(t.trim, 'notch');
  assert.equal(makeTag('x', '#ffd400', 'x', 'swirl').trim, 'straight');
});

// --- image URLs ---------------------------------------------------------------------------------
ok('buildImageUrl uses the safe host+path form and round-trips', () => {
  const url = buildImageUrl('C:\\Users\\NuriDerBurrito\\AppData\\Roaming\\Burrito GenDex\\gendex_images', 'img 1.png');
  assert.ok(url.startsWith('local-resource://l/'));
  assert.equal(decodeResourceUrl(url), 'C:\\Users\\NuriDerBurrito\\AppData\\Roaming\\Burrito GenDex\\gendex_images/img 1.png');
});
ok('empty filename yields empty url', () => {
  assert.equal(buildImageUrl('C:\\path', ''), '');
});

// --- misc ----------------------------------------------------------------------------------------
ok('readableInk picks dark/light ink by luminance', () => {
  assert.equal(readableInk('#ffd400'), '#17130c');
  assert.equal(readableInk('#9d4edd'), '#f7f1e4');
});
ok('extFromMime maps tricky mimes explicitly', () => {
  assert.equal(extFromMime('image/svg+xml'), '.svg');
  assert.equal(extFromMime('image/x-icon'), '.ico');
  assert.equal(extFromMime('image/tiff'), '.tiff');
  assert.equal(extFromMime('image/gif'), '.gif');
  assert.equal(extFromMime('image/avif'), '.avif');
  assert.equal(extFromMime('image/webp'), '.webp');
});
ok('dates format as YYYY-MM-DD', () => {
  assert.equal(fmtDate(new Date(2026, 7, 5).getTime()), '2026-08-05');
});

// --- stamps (0.15.0 · 0.22.0 one world, one setting) ---------------------------------------------
ok('makeCharacter accepts stamps (plain image carriers) + ONE shared settings object', () => {
  const c = makeCharacter(
    'amy',
    ROOT_CLASS_ID,
    [],
    {},
    {},
    [
      { image: 'logo_a.png', name: 'guild' },
      { image: 'logo_b.png', name: 'seal' },
      { image: '', name: 'broken' }, // no image -> dropped
    ],
    { color: '#ff0044', colorAlpha: 0.5, alpha: 0.8, pos: { x: 60, y: 30 }, scale: 1.5, rot: -45, clip: false }
  );
  assert.equal(c.stamps.length, 2);
  assert.equal(c.stamps[0].image, 'logo_a.png');
  assert.ok(c.stamps[0].id);
  assert.ok(c.stamps[1].id !== c.stamps[0].id);
  // plain records — no look knobs, no srcId links on the stamps themselves
  assert.deepEqual(Object.keys(c.stamps[0]).sort(), ['id', 'image', 'name']);
  // the shared settings ride the CARD, fully normalized
  assert.equal(c.stampSettings.color, '#ff0044');
  assert.equal(c.stampSettings.colorAlpha, 0.5);
  assert.equal(c.stampSettings.alpha, 0.8);
  assert.deepEqual(c.stampSettings.pos, { x: 60, y: 30 });
  assert.equal(c.stampSettings.scale, 1.5);
  assert.equal(c.stampSettings.rot, -45);
  assert.equal(c.stampSettings.clip, false);
  const bare = makeCharacter('bee');
  assert.deepEqual(bare.stamps, []);
  // no settings passed -> the complete default object (every field present)
  assert.deepEqual(bare.stampSettings, DEFAULT_STAMP_SETTINGS);
  assert.equal(bare.stampSettings.clip, true); // OUTSIDE off by default
});
ok('0.22.0 sanitizeStampSettings: every field present, on its rails — an undefined clip can never disagree with the switch again', () => {
  const s = sanitizeStampSettings({ color: '#7EC8E3', colorAlpha: 9, alpha: 0.04, pos: { x: 500, y: 2 }, scale: 0.1, rot: 999, clip: undefined });
  assert.equal(s.color, '#7ec8e3'); // normalized lowercase
  assert.equal(s.colorAlpha, 1);
  assert.equal(s.alpha, 0.1);
  assert.deepEqual(s.pos, { x: 140, y: 2 }); // guard rails
  assert.equal(s.scale, 0.25);
  assert.equal(s.rot, 180);
  assert.equal(s.clip, true); // absent -> confined (OUTSIDE off)
  const junk = sanitizeStampSettings({ color: 'blue', colorAlpha: 'strong', alpha: 'thin', pos: 'left', scale: 'huge', rot: 'tilt', clip: 'yes' });
  assert.equal(junk.color, null); // bad hex -> AUTO
  assert.deepEqual(junk, DEFAULT_STAMP_SETTINGS); // everything falls to the defaults
});
ok('0.27.0 visibleStampsFor: top stamp only by default; spotlight promotes BY IMAGE + splits in CARD-STACK order (the top stamp on the LEFT)', () => {
  const library = [
    { id: 'tpl-a', image: 'a.png', name: 'a' },
    { id: 'tpl-b', image: 'b.png', name: 'b' },
    { id: 'tpl-c', image: 'c.png', name: 'c' },
  ];
  const c = {
    stamps: [
      { id: 's1', image: 'a.png', name: 'a' },
      { id: 's2', image: 'b.png', name: 'b' },
      { id: 's3', image: 'c.png', name: 'c' },
    ],
  };
  // no spotlight -> just the top one
  assert.deepEqual(visibleStampsFor(c).map((s) => s.id), ['s1']);
  assert.deepEqual(visibleStampsFor(c, [], library).map((s) => s.id), ['s1']);
  // spotlight tpl-b -> only that stamp, promoted (matched by IMAGE)
  assert.deepEqual(visibleStampsFor(c, ['tpl-b'], library).map((s) => s.id), ['s2']);
  // two spotlighted, picked b-then-a — the split order is the CARD'S OWN
  // STACK: s1 (the TOP stamp, a.png) takes the LEFTMOST slice, s2 follows
  assert.deepEqual(visibleStampsFor(c, ['tpl-b', 'tpl-a'], library).map((s) => s.id), ['s1', 's2']);
  // a card stamp that IS a library member by image matches through its own record
  assert.deepEqual(visibleStampsFor(c, ['tpl-c'], library).map((s) => s.id), ['s3']);
  // spotlighted stamp the card does NOT carry -> empty band (card is a non-match anyway)
  assert.deepEqual(visibleStampsFor(c, ['tpl-zzz'], library), []);
  // NO library -> ids cannot resolve to images -> empty band (never a false promote)
  assert.deepEqual(visibleStampsFor(c, ['tpl-b']), []);
  // reordered stack proves the order follows the CARD, not the pick: s3 is
  // on top -> s3 leads the split even when a was picked first
  const c2 = {
    stamps: [
      { id: 's3', image: 'c.png', name: 'c' },
      { id: 's1', image: 'a.png', name: 'a' },
      { id: 's2', image: 'b.png', name: 'b' },
    ],
  };
  assert.deepEqual(visibleStampsFor(c2, ['tpl-a', 'tpl-c'], library).map((s) => s.id), ['s3', 's1']);
});
ok('0.22.0 follow-up bandStampTransform: the band capture — the placed transform that reproduces the band render (the first state, not a default)', () => {
  // unknown aspects -> null (the caller falls back to the old default lift)
  assert.equal(bandStampTransform(null, 0.75), null);
  assert.equal(bandStampTransform(1, null), null);
  assert.equal(bandStampTransform(0, 0.75), null);
  assert.equal(bandStampTransform(1, -3), null);
  // SQUARE stamp on a 3:4 card: contain-fit into the 52%-tall band is
  // height-limited -> drawn 0.6933 of the card width, center at y=74 —
  // the classic lift spot — and the equivalent placed scale is
  // 0.6933/0.44 = 1.58 (the band stamp is BIGGER than a scale-1 sticker,
  // which is why the old default lift visibly shrank it).
  const square = bandStampTransform(1, 0.75);
  assert.equal(square.x, 50);
  assert.equal(square.y, 74);
  assert.equal(square.scale, 1.58);
  // WIDE 4:1 banner on a 3:4 card: width-limited -> drawn the FULL card
  // width, its center riding low (y = 100 - 50*(0.75/4) = 90.63), scale
  // capped by the full width / 0.44 base = 2.27.
  const wide = bandStampTransform(4, 0.75);
  assert.equal(wide.x, 50);
  assert.equal(wide.y, 90.63);
  assert.equal(wide.scale, 2.27);
  // TALL 1:2 stamp on a 3:4 card: height-limited at the full band height
  // -> drawn 0.52*0.5/0.75 = 0.3467 of the width, scale 0.79, y = 74.
  const tall = bandStampTransform(0.5, 0.75);
  assert.equal(tall.y, 74);
  assert.equal(tall.scale, 0.79);
  // a 1:1 card: the band box is square too, a square stamp fills it exactly
  // -> scale 0.52/0.44 = 1.18, y = 74.
  const iso = bandStampTransform(1, 1);
  assert.equal(iso.y, 74);
  assert.equal(iso.scale, 1.18);
  // extremely tall stamp: the true equivalent (0.17) clamps to the slider
  // rails' floor (0.25) so the settings never leave their legal range.
  const rail = bandStampTransform(0.12, 0.75);
  assert.equal(rail.scale, 0.25);
  assert.equal(rail.y, 74);
});
ok('0.22.0 stampImageMatches + stampImageIndex: a stamp is its IMAGE — the spotlight detects what the card shows', () => {
  assert.equal(stampImageMatches('a.png', 'a.png'), true);
  assert.equal(stampImageMatches('a.png', 'b.png'), false);
  assert.equal(stampImageMatches('', 'a.png'), false);
  assert.equal(stampImageMatches('a.png', ''), false);
  const idx = stampImageIndex([
    { id: 'x', image: 'a.png', autoColor: '#ff0000' },
    { id: 'y', image: 'a.png', autoColor: '#00ff00' }, // duplicate image: FIRST wins
    { id: 'z', image: 'b.png' },
  ]);
  assert.equal(idx.get('a.png').id, 'x');
  assert.equal(idx.get('a.png').autoColor, '#ff0000');
  assert.equal(idx.get('b.png').id, 'z');
  assert.equal(idx.get('missing.png'), undefined);
});
ok('0.22.0 custom hex wins; 0.41.0 WHITE is the default hue (the derived dominant color no longer paints)', () => {
  assert.equal(resolveStampHue({ color: '#7ec8e3' }), '#7ec8e3'); // custom wins
  assert.equal(resolveStampHue({ color: '#7EC8E3' }), '#7ec8e3'); // normalized
  assert.equal(resolveStampHue({ color: null }), '#ffffff'); // the silent default is WHITE now
  assert.equal(resolveStampHue({}), '#ffffff');
  assert.equal(resolveStampHue({ color: 'blue' }), '#ffffff'); // bad custom -> white
  assert.equal(resolveStampHue(null), '#ffffff');
  // 0.41.0: the AUTO argument is retired — it no longer drives the wash
  assert.equal(resolveStampHue({}, '#ff0000'), '#ffffff');
});
ok('0.22.0 dominantColorOf: pure-module safe — in node (no DOM) it resolves null instead of throwing (awaited at top level)', () => {
  // the sync guard: no window/document -> Promise.resolve(null) up front,
  // which the awaited block below verifies for real
  assert.equal(typeof dominantColorOf, 'function');
});
{
  // top-level await (.mjs): the REAL promise resolutions
  const h1 = await dominantColorOf('local-resource://l/whatever.png');
  const h2 = await dominantColorOf(null);
  const h3 = await dominantColorOf('');
  assert.equal(h1, null);
  assert.equal(h2, null);
  assert.equal(h3, null);
  passed += 1;
  console.log(`  ok ${passed} — 0.22.0 dominantColorOf resolves null in node (no DOM, no crash)`);
}
ok('spotlightMatchState: stamps AND into the tag filter — matched by IMAGE through the library', () => {
  const library = [
    { id: 'tpl-a', image: 'a.png', name: 'a' },
    { id: 'tpl-b', image: 'b.png', name: 'b' },
  ];
  const card = { tags: ['t1'], stamps: [{ id: 's1', image: 'a.png', name: 'a' }] };
  assert.equal(spotlightMatchState(card, {}, library), 'match');
  assert.equal(spotlightMatchState(card, { include: ['t1'] }, library), 'match');
  assert.equal(spotlightMatchState(card, { include: ['t2'] }, library), 'nomatch');
  assert.equal(spotlightMatchState(card, { stamps: ['tpl-a'] }, library), 'match');
  assert.equal(spotlightMatchState(card, { stamps: ['tpl-a', 'tpl-b'] }, library), 'nomatch'); // must carry EVERY picked stamp
  assert.equal(spotlightMatchState(card, { include: ['t1'], stamps: ['tpl-a'] }, library), 'match');
  assert.equal(spotlightMatchState(card, { exclude: ['t1'], stamps: ['tpl-a'] }, library), 'nomatch');
  // 0.22.0: the card SHOWS a.png but there is no library record to resolve
  // the id — a nomatch, never a false match.
  assert.equal(spotlightMatchState(card, { stamps: ['tpl-a'] }, []), 'nomatch');
});
ok('0.22.0 createSafeDb: the library is EVERYONE — character stamp images auto-join; matching works for old dbs', () => {
  const db = createSafeDb({
    stamps: [
      { id: 'tpl-a', image: 'a.png', name: 'guild' },
      { id: 'tpl-b', image: '', name: 'broken' }, // dropped: no image
      { image: 'c.png' }, // id assigned
    ],
    characters: [
      {
        name: 'amy',
        stamps: [
          { id: 's1', image: 'a.png', name: 'guild', srcId: 'tpl-a' },
          { id: 's2', image: 'b.png', srcId: 'tpl-dead' }, // a once-LOCAL stamp (dead link, never a template)
          { id: 's3' }, // no image -> dropped
        ],
        versions: [],
      },
    ],
  });
  // a.png, c.png + auto-joined b.png = 3 library members
  assert.equal(db.stamps.length, 3);
  assert.ok(db.stamps.some((t) => t.id === 'tpl-a'));
  assert.ok(db.stamps.every((t) => t.image));
  assert.ok(db.stamps.some((t) => t.image === 'b.png')); // the local stamp joined
  const amy = db.characters[0];
  assert.equal(amy.stamps.length, 2);
  // character stamps are PLAIN carriers — srcId and every look knob are gone
  assert.deepEqual(Object.keys(amy.stamps[0]).sort(), ['id', 'image', 'name']);
  // the auto-joined record resolves the spotlight for the old card
  const bId = db.stamps.find((t) => t.image === 'b.png').id;
  assert.equal(spotlightMatchState(amy, { stamps: [bId] }, db.stamps), 'match');
});
ok('0.22.0 createSafeDb migration: a pre-0.22.0 card keeps exactly what it SHOWED — the TOP stamp\u2019s look becomes the card settings', () => {
  const db = createSafeDb({
    characters: [
      {
        name: 'amy',
        stamps: [
          // the top stamp: hue on #ff0044 at 0.5, placed, scaled, rotated, outside, art 0.7
          { id: 's1', image: 'a.png', colorOn: true, color: '#ff0044', colorAlpha: 0.5, alpha: 0.7, pos: { x: 60, y: 30 }, scale: 1.5, rot: -45, clip: false },
          // a second stamp with DIFFERENT settings — parked behind, never visible
          { id: 's2', image: 'b.png', colorOn: false, color: '#00ff88', pos: { x: 10, y: 10 }, scale: 3, rot: 90, clip: true },
        ],
        versions: [],
      },
    ],
  });
  const amy = db.characters[0];
  assert.equal(amy.stampSettings.color, '#ff0044');
  assert.equal(amy.stampSettings.colorAlpha, 0.5);
  assert.equal(amy.stampSettings.alpha, 0.7);
  assert.deepEqual(amy.stampSettings.pos, { x: 60, y: 30 });
  assert.equal(amy.stampSettings.scale, 1.5);
  assert.equal(amy.stampSettings.rot, -45);
  assert.equal(amy.stampSettings.clip, false);
});
ok('0.22.0 createSafeDb migration: a hue that was OFF becomes AUTO (the hue is always on now)', () => {
  const db = createSafeDb({
    characters: [
      {
        name: 'amy',
        stamps: [{ id: 's1', image: 'a.png', colorOn: false, color: '#ff0044', colorAlpha: 0.4 }],
        versions: [],
      },
    ],
  });
  const amy = db.characters[0];
  assert.equal(amy.stampSettings.color, null); // AUTO — follows the stamp image's dominant color
  assert.equal(amy.stampSettings.colorAlpha, 0.4); // the transparency still rides along
});
ok('0.22.0 createSafeDb: a card with an explicit stampSettings object keeps it (normalized), and stampless cards get the default', () => {
  const db = createSafeDb({
    characters: [
      { name: 'amy', stamps: [{ id: 's1', image: 'a.png' }], stampSettings: { color: '#00ff88', colorAlpha: 9, clip: false }, versions: [] },
      { name: 'bee', stamps: [], versions: [] },
    ],
  });
  assert.equal(db.characters[0].stampSettings.color, '#00ff88');
  assert.equal(db.characters[0].stampSettings.colorAlpha, 1); // clamped on load
  assert.equal(db.characters[0].stampSettings.clip, false);
  assert.deepEqual(db.characters[1].stampSettings, DEFAULT_STAMP_SETTINGS);
});
ok('0.22.0 createSafeDb sanitizes the library autoColor cache (the AUTO hue derivation)', () => {
  const db = createSafeDb({
    stamps: [
      { id: 't1', image: 'a.png', autoColor: '#FF0000' }, // normalized lowercase
      { id: 't2', image: 'b.png', autoColor: 'nope' }, // junk -> null (not derived yet)
      { id: 't3', image: 'c.png' }, // absent -> null
    ],
  });
  assert.equal(db.stamps[0].autoColor, '#ff0000');
  assert.equal(db.stamps[1].autoColor, null);
  assert.equal(db.stamps[2].autoColor, null);
});

// --- stamp settings (0.22.0 card-level) -----------------------------------------------------------
ok('0.22.0 makeCharacter carries the card settings color (a valid custom hex; junk = AUTO)', () => {
  const c = makeCharacter('amy', ROOT_CLASS_ID, [], {}, {}, [{ image: 'a.png' }], { color: '#7EC8E3' });
  assert.equal(c.stampSettings.color, '#7ec8e3'); // normalized lowercase
  const junk = makeCharacter('amy', ROOT_CLASS_ID, [], {}, {}, [{ image: 'a.png' }], { color: 'not-a-hex' });
  assert.equal(junk.stampSettings.color, null); // bad hex -> AUTO (the hue is always on)
  const bare = makeCharacter('amy', ROOT_CLASS_ID, [], {}, {}, [{ image: 'a.png' }]);
  assert.equal(bare.stampSettings.color, null); // untouched -> AUTO
});
ok('0.22.0 stampHueAlpha / stampAlpha read the CARD settings (clamped, default-anchored)', () => {
  assert.equal(stampHueAlpha({ colorAlpha: 0.1 }), 0.1);
  assert.equal(stampHueAlpha({}), DEFAULT_STAMP_HUE_ALPHA);
  assert.equal(stampHueAlpha(null), DEFAULT_STAMP_HUE_ALPHA);
  assert.equal(stampAlpha({ alpha: 0.1 }), 0.1);
  assert.equal(stampAlpha({}), DEFAULT_STAMP_ALPHA);
  assert.equal(stampAlpha(null), DEFAULT_STAMP_ALPHA);
});
ok('createSafeDb sanitizes stamp settings: valid hex kept, junk falls to AUTO (hand-edited db)', () => {
  const db = createSafeDb({
    characters: [
      { name: 'amy', stamps: [{ id: 's1', image: 'a.png' }], stampSettings: { color: '#ff0044', colorAlpha: 0.3 }, versions: [] },
      { name: 'bee', stamps: [{ id: 's2', image: 'b.png' }], stampSettings: { color: '#12345', colorAlpha: 'strong' }, versions: [] },
    ],
  });
  assert.equal(db.characters[0].stampSettings.color, '#ff0044');
  assert.equal(db.characters[0].stampSettings.colorAlpha, 0.3);
  assert.equal(db.characters[1].stampSettings.color, null); // bad hex -> AUTO
  assert.equal(db.characters[1].stampSettings.colorAlpha, DEFAULT_STAMP_HUE_ALPHA);
});

ok('0.17.0 sanitizeStampPos: two finite numbers survive (clamped to the rails); anything else is the band', () => {
  assert.deepEqual(sanitizeStampPos({ x: 112, y: 24 }), { x: 112, y: 24 }); // past the border is legal
  assert.deepEqual(sanitizeStampPos({ x: -18, y: 90.25 }), { x: -18, y: 90.25 });
  assert.deepEqual(sanitizeStampPos({ x: 500, y: -300 }), { x: 140, y: -40 }); // guard rails clamp
  assert.deepEqual(sanitizeStampPos({ x: 33.333333, y: 10 }), { x: 33.33, y: 10 }); // 2dp rounding
  assert.equal(sanitizeStampPos(null), null);
  assert.equal(sanitizeStampPos(undefined), null);
  assert.equal(sanitizeStampPos('50,50'), null);
  assert.equal(sanitizeStampPos({ x: 'abc', y: 50 }), null);
  assert.equal(sanitizeStampPos({ x: 50 }), null); // missing y
  assert.equal(sanitizeStampPos({ x: NaN, y: 20 }), null);
  assert.equal(sanitizeStampPos({ x: Infinity, y: 20 }), null);
});

ok('0.17.0/0.22.0 makeCharacter carries the card settings pos (validated); junk placements fall back to the band', () => {
  const good = makeCharacter('amy', ROOT_CLASS_ID, [], {}, {}, [{ image: 'a.png' }], { pos: { x: 75, y: 25 } });
  assert.deepEqual(good.stampSettings.pos, { x: 75, y: 25 }); // placed sticker
  const junk = makeCharacter('amy', ROOT_CLASS_ID, [], {}, {}, [{ image: 'b.png' }], { pos: { x: 'left', y: 20 } });
  assert.equal(junk.stampSettings.pos, null); // junk -> band
  const bare = makeCharacter('amy', ROOT_CLASS_ID, [], {}, {}, [{ image: 'c.png' }]);
  assert.equal(bare.stampSettings.pos, null); // no pos at all -> band
});

ok('0.19.0 sanitizeStampScale: clamps to 0.25..4, rounds to 2dp; junk is the identity 1', () => {
  assert.equal(sanitizeStampScale(2), 2);
  assert.equal(sanitizeStampScale(0.1), 0.25); // floor rail
  assert.equal(sanitizeStampScale(9), 4); // ceiling rail
  assert.equal(sanitizeStampScale(1.23456), 1.23); // 2dp
  assert.equal(sanitizeStampScale('2'), 2); // numeric strings pass Number()
  assert.equal(sanitizeStampScale('huge'), 1);
  assert.equal(sanitizeStampScale(null), 1);
  assert.equal(sanitizeStampScale(undefined), 1);
  assert.equal(sanitizeStampScale(NaN), 1);
});

ok('0.19.0 sanitizeStampRot: clamps to -180..180 (integers); junk is the identity 0', () => {
  assert.equal(sanitizeStampRot(90), 90);
  assert.equal(sanitizeStampRot(-270), -180); // floor rail
  assert.equal(sanitizeStampRot(540), 180); // ceiling rail
  assert.equal(sanitizeStampRot(12.7), 13); // rounded to whole degrees
  assert.equal(sanitizeStampRot('45'), 45);
  assert.equal(sanitizeStampRot('tilted'), 0);
  assert.equal(sanitizeStampRot(null), 0);
  assert.equal(sanitizeStampRot(undefined), 0);
  assert.equal(sanitizeStampRot(NaN), 0);
});

ok('0.19.0/0.22.0 makeCharacter carries the card transform settings (scale/rot/clip — validated; clip defaults ON = outside off)', () => {
  const good = makeCharacter('amy', ROOT_CLASS_ID, [], {}, {}, [{ image: 'a.png' }], { pos: { x: 50, y: 50 }, scale: 1.5, rot: -45, clip: true });
  assert.equal(good.stampSettings.scale, 1.5);
  assert.equal(good.stampSettings.rot, -45);
  assert.equal(good.stampSettings.clip, true);
  const clamped = makeCharacter('amy', ROOT_CLASS_ID, [], {}, {}, [{ image: 'b.png' }], { scale: 99, rot: 'tilt' });
  assert.equal(clamped.stampSettings.scale, 4); // clamped to the ceiling
  assert.equal(clamped.stampSettings.rot, 0);
  assert.equal(clamped.stampSettings.clip, true); // absent -> confined (outside off)
  const bare = makeCharacter('amy', ROOT_CLASS_ID, [], {}, {}, [{ image: 'c.png' }]);
  assert.equal(bare.stampSettings.scale, 1);
  assert.equal(bare.stampSettings.rot, 0);
  assert.equal(bare.stampSettings.clip, true); // OUTSIDE defaults OFF
  const outside = makeCharacter('amy', ROOT_CLASS_ID, [], {}, {}, [{ image: 'd.png' }], { clip: false });
  assert.equal(outside.stampSettings.clip, false); // an explicit false keeps the parts past the border showing
});

ok('0.19.0/0.22.0 createSafeDb sanitizes the card transform settings (hand-edited values clamped, junk identity; clip absent = outside off)', () => {
  const db = createSafeDb({
    characters: [
      {
        name: 'amy',
        stamps: [{ id: 's1', image: 'a.png' }],
        stampSettings: { pos: { x: 40, y: 60 }, scale: 0.01, rot: 999, clip: 'yes' },
        versions: [],
      },
    ],
  });
  const s = db.characters[0].stampSettings;
  assert.deepEqual(s.pos, { x: 40, y: 60 });
  assert.equal(s.scale, 0.25); // clamped to the floor
  assert.equal(s.rot, 180); // clamped to the ceiling
  assert.equal(s.clip, true); // junk/absent -> confined (0.20.0 default: outside OFF)
});

ok('0.17.0 createSafeDb migration sanitizes legacy stamp pos: valid kept, junk dropped to the band, extremes clamped', () => {
  const db = createSafeDb({
    characters: [
      {
        name: 'amy',
        stamps: [
          { id: 's1', image: 'a.png', pos: { x: 120, y: -12 } }, // kept (past the border) -> card settings
          { id: 's2', image: 'b.png', pos: { x: 'nope', y: 10 } }, // top stamp's junk -> null (band)
        ],
        versions: [],
      },
    ],
  });
  const s = db.characters[0].stampSettings;
  assert.deepEqual(s.pos, { x: 120, y: -12 });
  // a SECOND stamp's junk never reaches the card settings (the top stamp's look wins)
  const db2 = createSafeDb({
    characters: [
      { name: 'bee', stamps: [{ id: 's1', image: 'x.png' }, { id: 's2', image: 'y.png', pos: { x: 'nope', y: 10 } }], versions: [] },
    ],
  });
  assert.equal(db2.characters[0].stampSettings.pos, null);
});

ok('0.19.0 living background color settings are gone with the feature (hex overrides dropped, never resurrected)', () => {
  const db = createSafeDb({
    settings: {
      animatedBgMode: 'clouds',
      animatedBgSky: '#12ABef',
      animatedBgPuffs: 'white',
    },
  });
  assert.equal('animatedBgSky' in db.settings, false);
  assert.equal('animatedBgPuffs' in db.settings, false);
  const fresh = createSafeDb({});
  assert.equal('animatedBgSky' in fresh.settings, false);
  assert.equal('animatedBgPuffs' in fresh.settings, false);
});

ok('0.20.0 sanitizeStampHueAlpha: the hue transparency clamps to 0..1 (2dp); absent/junk = the classic 0.88', () => {
  assert.equal(sanitizeStampHueAlpha(0.5), 0.5);
  assert.equal(sanitizeStampHueAlpha(0.317), 0.32); // 2dp rounding
  assert.equal(sanitizeStampHueAlpha(3), 1); // clamped to the ceiling
  assert.equal(sanitizeStampHueAlpha(-2), 0); // clamped to the floor
  assert.equal(sanitizeStampHueAlpha(null), DEFAULT_STAMP_HUE_ALPHA);
  assert.equal(sanitizeStampHueAlpha(undefined), DEFAULT_STAMP_HUE_ALPHA);
  assert.equal(sanitizeStampHueAlpha(''), DEFAULT_STAMP_HUE_ALPHA);
  assert.equal(sanitizeStampHueAlpha('half'), DEFAULT_STAMP_HUE_ALPHA);
  assert.equal(sanitizeStampHueAlpha(NaN), DEFAULT_STAMP_HUE_ALPHA);
});

ok('0.20.0 makeCharacter carries the card hue alpha (colorAlpha — the bottom-half wash strength)', () => {
  const a = makeCharacter('amy', ROOT_CLASS_ID, [], {}, {}, [{ image: 'a.png' }], { colorAlpha: 0.4 });
  assert.equal(a.stampSettings.colorAlpha, 0.4);
  const b = makeCharacter('amy', ROOT_CLASS_ID, [], {}, {}, [{ image: 'b.png' }], { colorAlpha: 9 });
  assert.equal(b.stampSettings.colorAlpha, 1); // clamped
  const c = makeCharacter('amy', ROOT_CLASS_ID, [], {}, {}, [{ image: 'c.png' }]);
  assert.equal(c.stampSettings.colorAlpha, DEFAULT_STAMP_HUE_ALPHA); // absent -> the classic 0.88
});

ok('0.21.0 makeCharacter carries the card art alpha (alpha — the logo\u2019s own opacity)', () => {
  const a = makeCharacter('amy', ROOT_CLASS_ID, [], {}, {}, [{ image: 'a.png' }], { alpha: 0.4 });
  assert.equal(a.stampSettings.alpha, 0.4);
  const b = makeCharacter('amy', ROOT_CLASS_ID, [], {}, {}, [{ image: 'b.png' }], { alpha: 9 });
  assert.equal(b.stampSettings.alpha, 1); // clamped to solid
  const c = makeCharacter('amy', ROOT_CLASS_ID, [], {}, {}, [{ image: 'c.png' }]);
  assert.equal(c.stampSettings.alpha, DEFAULT_STAMP_ALPHA); // absent -> the 0.26.0 default
});
ok('0.21.0 sanitizeStampAlpha: the stamp art\u2019s own transparency clamps to 0.1..1 (2dp); absent/junk = the default', () => {
  assert.equal(sanitizeStampAlpha(0.5), 0.5);
  assert.equal(sanitizeStampAlpha(0.317), 0.32); // 2dp rounding
  assert.equal(sanitizeStampAlpha(3), 1); // clamped to the ceiling (solid)
  assert.equal(sanitizeStampAlpha(0), 0.1); // clamped to the floor (never invisible)
  assert.equal(sanitizeStampAlpha(-2), 0.1);
  assert.equal(sanitizeStampAlpha(null), DEFAULT_STAMP_ALPHA);
  assert.equal(sanitizeStampAlpha(undefined), DEFAULT_STAMP_ALPHA);
  assert.equal(sanitizeStampAlpha(''), DEFAULT_STAMP_ALPHA);
  assert.equal(sanitizeStampAlpha('half'), DEFAULT_STAMP_ALPHA);
  assert.equal(sanitizeStampAlpha(NaN), DEFAULT_STAMP_ALPHA);
  assert.equal(DEFAULT_STAMP_ALPHA, 0.5); // 0.26.0: the default transparency is 50%
});

// --- 0.25.0: data & recovery settings + grey-screen hardening ---------------------------------
ok('0.25.0 settings sanitize: autosave cadence + reduced motion (fresh defaults, valid kept, junk dropped)', () => {
  const fresh = createSafeDb(null);
  // 1.1.2 — five is the default now ("auto save make it occur every 5 mins
  // now (keep the none option still ofc)"): fresh dbs keep themselves; the
  // OFF seat stays a stored choice away.
  assert.equal(fresh.settings.autosaveMinutes, 5); // 5m by default (1.1.2)
  assert.equal(fresh.settings.reduceMotion, false);
  const kept = createSafeDb({ settings: { autosaveMinutes: 5, reduceMotion: true } });
  assert.equal(kept.settings.autosaveMinutes, 5);
  assert.equal(kept.settings.reduceMotion, true);
  const junk = createSafeDb({ settings: { autosaveMinutes: 7, reduceMotion: 'yes' } });
  assert.equal(junk.settings.autosaveMinutes, 5); // not a real cadence -> the default
  assert.equal(junk.settings.reduceMotion, false); // non-boolean -> off
});

ok('0.25.0 grey-screen hardening: a stored {id:"root"} class is DROPPED (the tree root is virtual)', () => {
  const db = createSafeDb({
    classes: [
      { id: 'root', name: 'All', parentId: null }, // poisoned node: parentOf -> 'root' -> itself
      { id: 'cl1', name: 'heroes', parentId: 'root' },
      { id: 'cl2', name: 'villains', parentId: 'cl1' },
    ],
    characters: [{ name: 'amy', classId: 'root', versions: [] }],
  });
  assert.deepEqual(db.classes.map((c) => c.id), ['cl1', 'cl2']); // the root node is gone
  assert.equal(db.classes[0].parentId, 'root'); // real subclasses stay top-level
  assert.equal(db.classes[1].parentId, 'cl1'); // deeper nesting untouched
  assert.equal(db.characters[0].classId, 'root'); // root membership (Unsorted) unaffected
  // and the tree this produces has no self-parent, so renderNodes terminates:
  assert.equal(classChildren(db.classes, 'root').length, 1);
});

// --- 0.29.0: the tooltip switch + the resizable panel widths ------------------
ok('0.29.0 settings sanitize: tooltips + panel widths (fresh defaults, valid kept, junk/clamped to range)', () => {
  const fresh = createSafeDb(null);
  assert.equal(fresh.settings.tooltips, true); // on by default
  assert.equal(fresh.settings.sidebarWidth, 240); // the old fixed w-60
  assert.equal(fresh.settings.panelWidth, 480); // the old fixed w-[480px]
  const kept = createSafeDb({ settings: { tooltips: false, sidebarWidth: 312, panelWidth: 560 } });
  assert.equal(kept.settings.tooltips, false);
  assert.equal(kept.settings.sidebarWidth, 312);
  assert.equal(kept.settings.panelWidth, 560);
  const junk = createSafeDb({ settings: { tooltips: 'no', sidebarWidth: 40, panelWidth: 40000 } });
  assert.equal(junk.settings.tooltips, true); // non-boolean -> on
  assert.equal(junk.settings.sidebarWidth, 200); // clamped to the floor
  assert.equal(junk.settings.panelWidth, 760); // clamped to the ceiling
  const nan = createSafeDb({ settings: { sidebarWidth: 'wide', panelWidth: null } });
  assert.equal(nan.settings.sidebarWidth, 240); // unparseable -> default
  assert.equal(nan.settings.panelWidth, 480);
});

// --- 0.37.0: class colors + the stamp exclude filter --------------------------
ok('0.37.0 sanitize keeps a clean class color and drops junk (colors are optional)', () => {
  const db = createSafeDb({
    classes: [
      { id: 'a', name: 'tinted', parentId: 'root', color: '#7fd1d8' },
      { id: 'b', name: 'junky', parentId: 'root', color: 'rgb(1, 2, 3)' },
      { id: 'c', name: 'plain', parentId: 'root' },
    ],
  });
  assert.equal(db.classes.find((c) => c.id === 'a').color, '#7fd1d8'); // clean hex kept
  assert.equal(db.classes.find((c) => c.id === 'b').color, null); // junk dropped
  assert.equal(db.classes.find((c) => c.id === 'c').color, null); // absent = no color
});

ok('0.37.0 spotlightMatchState honors stampExclude (matched by image, like the includes)', () => {
  const lib = [
    { id: 's1', name: 'alpha', image: 'a.png' },
    { id: 's2', name: 'beta', image: 'b.png' },
  ];
  const carrier = { tags: [], stamps: [{ image: 'a.png', name: 'alpha' }] };
  const clean = { tags: [], stamps: [{ image: 'z.png', name: 'zed' }] };
  assert.equal(spotlightMatchState(carrier, { stampExclude: ['s1'] }, lib), 'nomatch'); // banned stamp aboard
  assert.equal(spotlightMatchState(clean, { stampExclude: ['s1'] }, lib), 'match'); // clean passes
  assert.equal(spotlightMatchState(carrier, { stampExclude: ['s2'] }, lib), 'match'); // other bans don't matter
  assert.equal(spotlightMatchState(carrier, { stamps: ['s1'], stampExclude: ['s2'] }, lib), 'match'); // include + exclude coexist
  assert.equal(spotlightMatchState(carrier, { stampExclude: ['gone'] }, lib), 'match'); // unknown id: no library record, no ban
});

console.log(`\n${passed} passing`);
