// 1.5.4 batch — The Window Is Already There.
// The reported items, each pinned at its root law:
//   1.  the selected ring seats BELOW the ribbons (::after at z 4)
//   2.  the creation window rides a retained seat (flight + reset laws)
//   3.  the class switch speaks (a one-shot pulse on [data-selected])
//   4+11. the drag ghost is a centered miniature (setDragImage)
//   5.  the texture options become tiles (face + caption)
//   6.  the trim chips become tiles (tall face, one-line caption)
//   7.  the gliding chips outrank the still (z 8 register, held keeps 40)
//   8.  the window stack's children carry keys (the manager's exit)
//   9.  the CREATE key teaches (no disabled seat, two-tooth gate,
//       derived rims, verdict toasts, the shake)
//   10. the toast pill speaks the ink-ledger face (off the bar band)
// Plus: the version is 1.6.5 everywhere.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(path.join(root, '..', p), 'utf8');

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL — ${name}\n      ${e.message}`);
  }
};
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg || 'assertion failed');
};
assert.equal = (a, b, msg) => {
  if (a !== b) throw new Error(msg || `${a} != ${b}`);
};

const css = src('src/index.css');
const appSrc = src('src/App.jsx');
const modalSrc = src('src/components/Modal.jsx');
const ncmSrc = src('src/components/NewCharacterModal.jsx');
const gridSrc = src('src/components/GridView.jsx');
const sortSrc = src('src/components/useThumbSort.js');
const lookSrc = src('src/components/CardLookEditor.jsx');
const setSrc = src('src/components/SettingsModal.jsx');
const constSrc = src('src/constants/index.js');
const stampSrc = src('src/components/StampEditModal.jsx');

// --- 1. the ring seats below the ribbons -----------------------------------
ok('1a — the outline is retired for a ::after pseudo ring', () => {
  assert(!/\.gd-card-selected \{\n  outline:/.test(css), 'the outline ring survived');
  const rule = css.match(/\.gd-card-selected::after \{[\s\S]*?\n\}/)?.[0] || '';
  assert(/border: 2px solid var\(--gd-accent\);/.test(rule), 'the ring lost its accent band');
  assert(/inset: -3px;/.test(rule), 'the ring lost its 1px offset');
  assert(/z-index: 4;/.test(rule), 'the ring never took its under-ribbon rung');
});
ok('1b — the ring is documented as the ribbon law (the report quoted)', () => {
  assert(/THE RING SEATS BELOW THE RIBBONS \("the outline of the card is/.test(css), 'the law note is missing');
});

// --- 2. the retained seat ----------------------------------------------------
ok('2a — App arms one creation seat that never dies', () => {
  assert(/const \[newCardSeatArmed, setNewCardSeatArmed\] = useState\(false\);/.test(appSrc), 'the armed flag is missing');
  assert(/requestIdleCallback\(arm, \{ timeout: 350 \}\)/.test(appSrc), 'the idle arm breath is missing (1.6.0: the fixed beat became requestIdleCallback with a 350ms ceiling)');
  assert(/if \(modal\?\.type === 'newCharacter'\) setNewCardSeatArmed\(true\);/.test(appSrc), 'the first-open arm is missing');
  assert(!/setNewCardSeatArmed\(false\)/.test(appSrc), 'the seat still dies (it must never unmount)');
});
ok('2b — the open count is a render-time mirror (flip + count in one commit)', () => {
  assert(/if \(creationOpen && !creationOpenRef\.current\) creationSeqRef\.current \+= 1;/.test(appSrc), 'the mirror is missing');
  assert(/openSeq=\{creationSeqRef\.current\}/.test(appSrc), 'the seat never reads the count');
});
ok('2c — the seat is memoized with stable handlers', () => {
  assert(/const NewCardSeat = memo\(/.test(appSrc), 'the memo shell is missing');
  assert(/seatOpenTagManager = useCallback/.test(appSrc) && /seatClose = useCallback/.test(appSrc) && /seatToggleHelp = useCallback/.test(appSrc), 'a stable handler is missing');
});
ok('2d — the seat renders before the window stack (stacking order kept)', () => {
  const seatAt = appSrc.indexOf('<NewCardSeat');
  const stackAt = appSrc.indexOf('<AnimatePresence>', seatAt);
  assert(seatAt !== -1 && stackAt !== -1, 'the seat or the stack went missing');
  const between = appSrc.slice(seatAt, stackAt);
  assert(!/<AnimatePresence>/.test(between), 'the seat must precede the window stack');
});
ok('2e — Modal speaks the flight (plain divs, CSS owns the fade)', () => {
  assert(/const LayerTag = flight \? 'div' : motion\.div;/.test(modalSrc), 'the layer tag never demoted');
  assert(/const CardTag = flight \? 'div' : motion\.div;/.test(modalSrc), 'the card tag never demoted');
  assert(/flight && 'gd-modal-flight'/.test(modalSrc) && /flight && !parked && 'is-open'/.test(modalSrc), 'the flight classes never seat');
  assert(/if \(parked\) return undefined;/.test(modalSrc), 'a parked window still hears keys');
  assert(/if \(parked \|\| typeof document === 'undefined'/.test(modalSrc), 'a parked window still freezes the coats');
});
ok('2f — the CSS flight mirrors the 1.5.9 entrance law (fade + the centered pop, never a rise)', () => {
  const closed = css.match(/\.gd-modal-layer\.gd-modal-flight \{[\s\S]*?\n\}/)?.[0] || '';
  assert(/opacity: 0;/.test(closed) && /visibility: hidden;/.test(closed), 'the closed seat never hides');
  assert(/transition: opacity 0\.1s ease, visibility 0s linear 0\.1s;/.test(closed), 'the farewell fade lost its delayed visibility');
  const card = css.match(/\.gd-modal-layer\.gd-modal-flight \.gd-modal-card \{[\s\S]*?\n\}/)?.[0] || '';
  assert(/transform: scale\(0\.965\);/.test(card), 'the pop never arrived');
  assert(!/translateY\(10px\)/.test(card), 'the rise survived (the 1.5.9 law retires it)');
});
ok('2g — the RESET law reseeds every draft field pre-paint', () => {
  assert(/useLayoutEffect\(\(\) => \{\n    if \(!openSeq\) return;/.test(ncmSrc), 'the reset pass is missing');
  for (const needle of [
    "setName('')",
    'setClassId(defaultClassId || ROOT_CLASS_ID)',
    'setTrim(DEFAULT_CARD_TRIM)',
    "setVLabel('V1')",
    'setStamps([])',
    'setStampSettings(sanitizeStampSettings({}))',
    'setGridRowsCap(DEFAULT_GRID_ROWS)',
    'dragCounterRef.current = 0',
    'naming.close()',
  ]) {
    assert(ncmSrc.includes(needle), `the reset never reseeds ${needle}`);
  }
  assert(/const \[classId, setClassId\] = useState/.test(ncmSrc), 'classId never gained its setter');
});
ok('2h — the naming queue exposes close (the orphaned-window reset)', () => {
  assert(/return \{ push, close, modal, naming: !!current \};/.test(stampSrc), 'close never rode the return');
});

// --- 3. the class switch speaks ----------------------------------------------
ok('3 — the selected class card takes a one-shot pulse + veil', () => {
  assert(/\.gd-tree-card\[data-selected\] \{\n  animation: gd-cls-speak 0\.46s/.test(css), 'the speak flight is missing');
  assert(/\.gd-tree-card\[data-selected\]::after/.test(css), 'the veil pseudo is missing');
  assert(/@keyframes gd-cls-speak \{/.test(css) && /@keyframes gd-cls-speak-veil \{/.test(css), 'a keyframe went missing');
  assert(/THE CLASS SWITCH SPEAKS \("add feedback to the classes switching/.test(css), 'the law note is missing');
});

// --- 4 + 11. the ghost rides under the cursor ---------------------------------
ok('4/11 — the drag ghost is a centered miniature clone', () => {
  const fn = gridSrc.match(/const startCardDrag = \(e, id\) => \{[\s\S]*?\n  \};/)?.[0] || '';
  assert(fn.includes('Math.min(1, 118 / layW)'), 'the miniature scale is missing (1.6.0: the layout box, never the jelly rect)');
  assert(fn.includes('clone.removeAttribute(\'data-pressed\')'), 'the pressed state would freeze into the snapshot');
  assert(/setDragImage\(canvas, 0, 0\)/.test(fn), 'the native drag image is not canvas-suppressed (1.6.2)');
  assert(/dragRef\.current\?\.ghost\?\.remove\?\.\(\)/.test(gridSrc), 'the drag-end belt is missing');
  assert(/THE GHOST RIDES UNDER THE CURSOR/.test(gridSrc), 'the law note is missing');
});

// --- 5. the texture options become tiles ---------------------------------------
ok('5 — the texture picker speaks the tile language', () => {
  assert(/\.gd-tex-tile \{/.test(css) && /\.gd-tex-tile-face \{/.test(css) && /\.gd-tex-tile-name \{/.test(css), 'a tile rule is missing');
  assert(!/^\.gd-tex-swatch \{/m.test(css), 'the old swatch strip survived');
  assert(/gd-tex-tile-grid/.test(setSrc) && /className=\{clsx\('gd-tex-tile'/.test(setSrc), 'the JSX never seated the tiles');
  assert(!/tex\.label\.split\(' '\)\[0\]/.test(setSrc), 'the truncated overlay label survived');
  assert(/height: 52px;/.test(css.match(/\.gd-tex-tile-face \{[\s\S]*?\n\}/)?.[0] || ''), 'the face lost its height');
});

// --- 6. the trim chips become tiles ---------------------------------------------
ok('6 — the trim chips speak the tile language at both seats', () => {
  assert(/className=\{clsx\('gd-trim-chip', active && 'is-active'\)\}/.test(lookSrc), 'TrimChip never took the tile classes');
  assert(/gd-trim-chip-face/.test(lookSrc) && /gd-trim-chip-name/.test(lookSrc), 'the face/name seats never rendered');
  assert(!/w-7 h-5/.test(lookSrc), 'the 28x20 sliver survived');
  assert(/height: 36px;/.test(css.match(/\.gd-trim-chip-face \{[\s\S]*?\n\}/)?.[0] || ''), 'the face lost its height');
  assert(/text-overflow: ellipsis;/.test(css.match(/\.gd-trim-chip-name \{[\s\S]*?\n\}/)?.[0] || ''), 'the caption never learned to ellipsize');
});

// --- 7. the glide outranks the still ---------------------------------------------
ok('7 — a moving chip paints above the stationary (the held keeps its crown)', () => {
  assert(/const glidedRef = useRef\(null\);/.test(sortSrc), 'the glided-run register is missing');
  assert(/glidedRef\.current = new Set\(\);/.test(sortSrc), 'the register never empties at arm');
  const itemFn = sortSrc.match(/const itemStyle = useCallback\([\s\S]*?\n  \);/)?.[0] || '';
  assert(/zIndex: 8/.test(itemFn), 'the raised rung is missing');
  assert(/if \(glidedRef\.current\?\.has\(i\)\) \{\n          return \{ transition: 'transform 0\.15s ease', zIndex: 8 \};/.test(sortSrc), 'a clearing flight lost the raised rung');
  assert(/zIndex: 40/.test(sortSrc), 'the held chip lost its crown');
  assert(/THE GLIDED RUN REGISTER/.test(sortSrc), 'the law note is missing');
});

// --- 8. the keyed window stack -----------------------------------------------------
ok('8 — every direct child of the window stack carries a key', () => {
  for (const key of ['"tag-manager-over"', '"settings-window"', '"import-verdict"', '"tag-manager-window"', '"confirm-ask"', '"close-prompt"']) {
    assert(appSrc.includes(`key=${key}`), `the ${key} child still rides keyless`);
  }
  // the retired creation slot: the window is the seat now, and the seat
  // carries its own key outside the stack.
  assert(appSrc.includes('key="new-card-seat"'), 'the seat lost its key');
  assert(/THE MANAGER LEAVES WITH ITS EXIT \("when opening the tag[\s\S]*?manager/.test(appSrc), 'the exit law note is missing');
});

// --- 9. the create key teaches -----------------------------------------------------
ok('9a — the disabled seat is retired', () => {
  assert(!/disabled=\{!stripRichText\(name\)\.trim\(\)\}/.test(ncmSrc), 'the disabled gate survived');
  assert(/key=\{`create-\$\{needFlash\?\.nonce \?\? 0\}`\}/.test(ncmSrc), 'the shake-replay key is missing');
  assert(/gd-need-shake/.test(ncmSrc) && /\.gd-btn\.gd-need-shake/.test(css), 'the shake never landed');
});
ok('9b — the gate grew its second tooth (the version label)', () => {
  const gate = ncmSrc.match(/const submit = \(\) => \{[\s\S]*?if \(nameMissing \|\| vLabelMissing\) \{[\s\S]*?\n    \}/)?.[0] || '';
  assert(/const vLabelMissing = !stripRichText\(vLabel\)\.trim\(\);/.test(ncmSrc), 'the label tooth is missing');
  assert(gate.includes("gdToast('Card name is empty"), 'the name verdict is missing');
  assert(gate.includes("gdToast('Version label is empty"), 'the label verdict is missing');
});
ok('9c — the rims are derived (they hold exactly until the field is filled)', () => {
  assert(/needFlash\?\.name && !stripRichText\(name\)\.trim\(\) && 'gd-field-need'/.test(ncmSrc), 'the name rim is not derived');
  assert(/needFlash\?\.vLabel && !stripRichText\(vLabel\)\.trim\(\) && 'gd-field-need'/.test(ncmSrc), 'the label rim is not derived');
  assert(/\.gd-field-need \{[\s\S]*?animation: gd-field-need-pulse/.test(css), 'the pulse rim is missing');
});

// --- 10. the toast pill speaks its own ground --------------------------------------
ok('10 — the pill leans into the ink (off the bar band)', () => {
  const pill = css.match(/\.gd-toast \{[\s\S]*?\n\}/)?.[0] || '';
  assert(/background: var\(--gd-accent-2, var\(--gd-accent\)\);/.test(pill), 'the secondary VALUE face is missing (1.6.2)');
  assert(!/background: var\(--gd-panel\);/.test(pill), 'the old panel face survived');
  const info = css.match(/\.gd-toast\.is-info \{[\s\S]*?\n\}/)?.[0] || '';
  assert(info.includes('--gd-accent-2'), 'the info voice left the secondary family (1.6.2)');
});

// --- the version ---------------------------------------------------------------------
ok('the version is 1.6.5 everywhere', () => {
  assert.equal(JSON.parse(src('package.json')).version, '1.9.19', 'package.json');
  assert(constSrc.includes("version: '1.9.19',"), 'constants');
  assert(src('README.md').includes('**v1.9.19**'), 'README');
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert(src('website/index.html').includes('<span class="ver">v1.8.6</span>'), 'website card');
  assert(src('CHANGELOG.md').startsWith('## 1.9.19 — The Ends Trade Places'), 'CHANGELOG');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
