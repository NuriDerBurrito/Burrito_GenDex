// 1.0.7 batch DOM + source checks — theme light, straight labels, folds that breathe.
// The fifteen fixes:
//   · THE GLOW SPEAKS THE THEME ("the glow in about and splash should be
//     related to the theme color (except on hover it would be shifting in
//     colors including white)"): every halo stop mixes the theme's accent
//     pair; the About hover face drifts through accent2 and WHITE on
//     staggered opacity cycles.
//   · THE × STEPS OFF THE BORDER ("move it to the left slightly so it
//     doesnt hug the right border"): 5px, still inside the field's own
//     padding zone.
//   · THE EMPTY STATE'S KEY SPEAKS ("new card button when teh class is
//     empty has the wrong tooltip"): the empty-class NEW CARD key (and the
//     tree dock's keys) carry real tooltips.
//   · THE NAME FOLDS LIKE A STATE ("remove the detail panel feature where
//     the card name when hovered over will show fully, instead add a button
//     on top to expand or retract the rest of the name, closes automatically
//     when scrolling, stays stuck when pinnned, and when retracted will only
//     show the first 2 lines" + "add animation to the card name in details
//     panel expanding and retracting of course (tho not on hover…)"): no
//     hover behavior at all; a measured two-line fold tweened by its key,
//     auto-closing on scroll, pinned when pinned.
//   · NAMES CAP AT 60 ("card names should have a limit of 60 characters").
//   · THE OUTPUT BAR SPEAKS THE REAL TEXTS ("ensure that in bottom output
//     panel that the version would be accurate in name, with text formats
//     and emojies included").
//   · THE VERSION LABELS STAND STRAIGHT ("burrito theme versions labels are
//     tilted, fix that so it matches the rest, same with zine punk and so
//     on"): gd-chip-flat on every version-label chip.
//   · THE HAND-OFF IS ONE MOTION ("when disabling or enabling the bottom
//     output panel or right detail panel, it should update seemlessly and
//     not retract then repull"): crossfade variants + an instant bar.
//   · TOOLTIPS + FEEDBACK HOLD TWO LINES ("ensure that tooltips would at
//     most show only 2 lines … same includes with feedback at the top so it
//     doesnt become excessive").
//   · THE SETTINGS WINDOW POPS IN ONCE ("when opening settings, sometimes
//     the window would vanish and reappear or would bug/glitch as it pops
//     in"): the height transition holds off through the entrance settle.
//   · THE ABOUT PAGE SAYS THE WHOLE NAME ("rename gendex to burrito gendex
//     in teh about section in settings").
//   · THE OUTLINE OUTLINES ("ensure that the outline text format's outline
//     is the opposite color of the text itself, so it just doesnt look like
//     thicker text since thats he job of the bold format").
//   · THE CLASS ICON PICKS ITS LIGHTNESS ("some class colors like blue blend
//     the icon too much into the container of the class, fix that so its
//     brighter or darker depending on which fits more").
//   · THE COPY SHED ITS EM DASHES ("remove em dashes from feedbacks and from
//     tooltips and from the about settings, ensure its also formatted
//     better").
//
// Requires jsdom (installed dev-only). Skips gracefully without it.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch {
  console.log('jsdom unavailable — 1.0.7 batch DOM test skipped (dev-only dependency)');
  process.exit(0);
}

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;
global.NodeFilter = dom.window.NodeFilter;
global.MutationObserver = dom.window.MutationObserver;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.SVGElement = dom.window.SVGElement;
global.Document = dom.window.Document;
global.Window = dom.window.Window;
global.Event = dom.window.Event;
global.CustomEvent = dom.window.CustomEvent;
global.MouseEvent = dom.window.MouseEvent;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.WheelEvent = dom.window.WheelEvent;
global.PointerEvent = dom.window.PointerEvent || dom.window.MouseEvent;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.getComputedStyle = dom.window.getComputedStyle;
global.requestAnimationFrame = dom.window.requestAnimationFrame;
global.cancelAnimationFrame = dom.window.cancelAnimationFrame;
global.Image = dom.window.Image;
global.IS_REACT_ACT_ENVIRONMENT = true;
global.matchMedia = dom.window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
global.ResizeObserver = class {
  constructor(cb) { this.cb = cb; }
  observe() {} unobserve() {} disconnect() {}
};

const React = require('react');
const { createRoot } = require('react-dom/client');
const babel = require('@babel/core');
const appRoot = process.cwd();
for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff2']) {
  require.extensions[ext] = (module, filename) => { module.exports = filename; };
}
require.extensions['.jsx'] = (module, filename) => {
  const { code } = babel.transformFileSync(filename, {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      ['@babel/preset-react', { runtime: 'automatic' }],
    ],
  });
  module._compile(code, filename);
};

const src = (rel) => readFileSync(join(appRoot, rel), 'utf8');
const css = src('src/index.css');
const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const { APP } = require(join(appRoot, 'src/constants/index.js'));

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL ${passed + failed} — ${name}\n      ${String(e && e.message).split('\n')[0]}`);
  }
};
const okAsync = async (name, fn) => {
  try {
    await fn();
    passed += 1;
    console.log(`  ok ${passed} — ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL ${passed + failed} — ${name}\n      ${String(e && e.message).split('\n')[0]}`);
  }
};
const flush = () => new Promise((r) => setTimeout(r, 30));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ===========================================================================
// Part A — source checks for the 1.0.7 wave
// ===========================================================================
{
  const gridSrc = stripComments(src('src/components/GridView.jsx'));
  const viewSrc = stripComments(src('src/components/CharacterView.jsx'));
  const appSrc = stripComments(src('src/App.jsx'));
  const modalSrc = stripComments(src('src/components/Modal.jsx'));
  const settingsSrc = stripComments(src('src/components/SettingsModal.jsx'));
  const classSrc = stripComments(src('src/components/ClassSidebar.jsx'));
  const newSrc = stripComments(src('src/components/NewCharacterModal.jsx'));
  const verSrc = stripComments(src('src/components/VersionSettingsModal.jsx'));
  // helpers.js carries regex literals containing '/*' — the comment stripper
  // would eat real code with them, so this one reads the RAW source (the
  // pinned lines below appear only as code, never inside comments).
  const helpersSrc = src('src/utils/helpers.js');
  const codeCss = stripComments(css);

  ok('1.0.7 the version bumped everywhere', () => {
    assert.equal(APP.version, '1.4.6');
    assert.match(src('package.json'), /"version": "1\.4\.6"/);
    assert.match(src('README.md'), /v1\.4\.6/);
    assert.match(src('CHANGELOG.md'), /^## 1\.1\.3 /m);
  });

  // ---- fix 1: the glow speaks the theme (and the hover face shifts) ----
  ok('1.0.7 the glow speaks the theme color — splash + About, hover shifts through white', () => {
    /* 1.1.8 — the splash halo retired ("remove glow from the splash
       screen"); the 1.0.7 theme law survives on the About glow alone. */
    assert.ok(!/\.gd-splash-halo\s*\{/.test(codeCss), '1.1.8: the splash halo rule is gone');
    const aboutGlow = /\.about-morph \.halo-glow\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(aboutGlow, /color-mix\(in srgb, var\(--gd-accent, #4ade80\) 30%, transparent\) 0%/, 'the About core mixes the theme accent');
    // 1.0.9 — THE RAINBOW RIDER ("when hovering over the icon in the about
    // section, it should shift the glow color between colors randomly, like
    // all the rainbow colors including white"): the hover face's shift
    // layers follow a RANDOM hue now, not the fixed accent2 ladder — a
    // registered --gd-rainbow-h glides on .about-morph itself, shift-2
    // paints it (hsl fields), shift-3 is the WHITE pass lit by the w flag,
    // and SettingsModal rolls the picks while the pointer rests.
    const shift2 = /\.about-morph \.halo-shift-2\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(shift2, /--rs-hi: hsl\(calc\(var\(--gd-rainbow-h, 130\) \* 1deg\) 85% 64%\)/, 'shift layer 2 paints the rainbow hue (two hsl fields)');
    assert.match(shift2, /opacity: calc\(1 - \(var\(--gd-rainbow-w, 0\) \* 0\.8\)\);/, 'it steps back during the white pass');
    assert.ok(!/animation: gd-halo-cycle/.test(shift2), 'no fixed cycle animates it — chance drives the color');
    const shift3 = /\.about-morph \.halo-shift-3\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(shift3, /rgba\(255, 255, 255, 0\.24\) 0%/, 'shift layer 3 is the WHITE pass');
    assert.match(shift3, /opacity: calc\(var\(--gd-rainbow-w, 0\) \* 0\.9\);/, 'lit only while the white flag is up');
    assert.ok(!/gd-halo-cycle/.test(codeCss), 'the 6s fixed-ladder keyframes are retired entirely');
    const rainbowProp = /@property --gd-rainbow-h\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(rainbowProp, /syntax: '<number>';/, 'the hue is a registered number');
    assert.match(rainbowProp, /inherits: true;/, 'that inherits down to the layers');
    const morphRule = /\.about-morph\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(morphRule, /transition: --gd-rainbow-h 1\.6s ease;/, 'the hue GLIDES on the mark itself');
    // the JSX mounts the shift layers on the hover face only — and 1.0.9
    // wires the random picks to the mark's own hover handlers
    assert.match(settingsSrc, /morph-halo-b[^]*halo-glow halo-shift-2/, 'halo B carries the rainbow layer');
    assert.match(settingsSrc, /morph-halo-b[^]*halo-glow halo-shift-3/, 'halo B carries the white layer');
    assert.match(settingsSrc, /onMouseEnter=\{startRainbow\}/, 'entering the mark starts the random walk');
    assert.match(settingsSrc, /onMouseLeave=\{stopRainbow\}/, 'leaving it stops the walk');
    assert.match(settingsSrc, /Math\.floor\(Math\.random\(\) \* 360\)/, 'the picks are truly random hues');
    assert.match(settingsSrc, /Math\.random\(\) < 0\.2/, 'roughly one pick in five is a white pass');
    assert.match(settingsSrc, /className="morph-halo morph-halo-a" aria-hidden>\s*<div className="halo-glow" \/>\s*<\/div>/, 'the resting face stays single-glow');
  });

  // ---- fix 2 (evolved 1.0.9): the × off the border, and the text before it ----
  ok('1.0.9 the search × steps off the border AND the text cuts before it', () => {
    const keyRule = /\.gd-search-clear\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(keyRule, /right: 8px;/, '8px — a fuller breath of field between key and border (1.0.9)');
    assert.ok(!/right: 2px/.test(keyRule), 'the hugging seat is gone');
    // 1.0.8 — THE GLYPHS CUT BEFORE THE × ("text clips into the x in search
    // container, fix that so it doesnt and cuts before it"): while the × is
    // mounted the field wears gd-input-has-x — a real right-padding seat
    // clearing the key's whole offset and width — so the text ENDS
    // before the key. The 1.0.6 "text scrolls under it" trade is retired.
    // 1.0.9 — the seat grew with the key's new 8px offset.
    assert.match(gridSrc, /search && 'gd-input-has-x'/, 'the field gains the × seat only while it carries text');
    const seatRule = /\.gd-input\.gd-input-has-x\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(seatRule, /padding-right: 29px;/, 'the seat clears the key whole (8px offset + 14px width + spare)');
    assert.ok(!/gd-input-clearable/.test(gridSrc), 'the 1.0.6 clearable NAME stays retired (the new seat has its own name)');
  });

  // ---- fix 3: the empty state's key speaks ----
  ok('1.0.7 the empty-class NEW CARD key (and the dock keys) carry real tooltips', () => {
    assert.match(gridSrc, /title="Create a new card in this class"/, 'the empty-state key says what it does');
    assert.match(classSrc, /title="Create a new card"\s*>\s*<Plus size=\{12\} \/>\s*NEW CARD/, 'the tree dock NEW CARD speaks');
    assert.match(classSrc, /title="Create a new class under the selected one"\s*>\s*<Plus size=\{12\} \/>\s*NEW CLASS/, 'the tree dock NEW CLASS speaks');
  });

  // ---- fixes 4 + 13: the name folds like a state ----
  ok('1.0.7 the name fold is a state — measured, animated, scroll-closing, pinned', () => {
    /* 1.1.1 — the clamp is REBORN as the RESTING ellipsis (the 1.0.7
       HOVER-lift retirement stands): it rides the name only while the fold
       sits retracted-and-settled, lifted by the expand key, re-landed by
       the retract flight. */
    assert.ok(!/\.gd-name-clamp:hover/.test(codeCss), 'the clamp still never rides a hover');
    assert.match(/\.gd-name-clamp\s*\{[^}]*\}/.exec(codeCss)?.[0] || '', /-webkit-line-clamp: 2;/, 'the resting clamp paints the dots (1.1.1)');
    assert.ok(!/\.gd-name-clamp:hover/.test(codeCss), 'no hover behavior exists on the name');
    /* 1.1.4 — the key also arms on nameExpanded itself ("the option to
       collapse the name dissapears after i expand it"): an expanded
       name always keeps its way back. */
    assert.match(viewSrc, /\(nameOverflows \|\| nameExpanded\) && \(/, 'the header key arms when the name overflows — and never leaves while expanded (1.1.4)');
    /* 1.1.1 — the toggle gained a wrapper (the clamp lifts through the
       setState updater while it flips the fold). */
    assert.match(viewSrc, /setNameExpanded\(\(v\) => \{/, 'the key toggles the fold');
    assert.match(viewSrc, /ChevronsUpDown size=\{12\}/, 'chevrons apart while retracted');
    assert.match(viewSrc, /ChevronsDownUp size=\{12\}/, 'chevrons together while expanded');
    assert.match(viewSrc, /height: nameExpanded \|\| nameFoldH == null \? 'auto' : nameFoldH/, 'the wrapper tweens between the fold and the full height');
    // 1.0.9 — the fold target gained its SEAT (the inner element's measured
    // top box — mt-1 was amputating the second line's descenders): two line
    // boxes PLUS the seat now, measured by foldTargetFor.
    // 1.1.9 re-law: the twin's natural height picks the honest line count
    // (never a phantom second line), still PLUS the inner seat.
    assert.match(viewSrc, /const twoBox = Math\.max\(two, clampedHRef\.current \|\| 0\);/, '1.2.9: the two-line ceiling takes the clamp\'s own painted box');
    assert.match(viewSrc, /const body = Math\.max\(one, Math\.min\(Math\.ceil\(Math\.max\(natH \|\| 0, floor\)\) \|\| one, twoBox\)\);/, 'the fold target takes the twin\'s honest line count (1.0.9)');
    assert.match(viewSrc, /fold: Math\.ceil\(body \+ seat\)/, 'the target is the honest lines PLUS the inner seat');
    assert.match(viewSrc, /parseFloat\(cs\.lineHeight\) \|\| parseFloat\(cs\.fontSize\) \* 1\.2/, 'read from the live computed line-height');
    // closes automatically when scrolling — unless pinned. 1.1.2 — the
    // handler grew the SNAP+COMPENSATE preamble (the fold lands in one
    // frame and the scroller gives the height back), so the window widened.
    const scrollBlock = /const onScroll = \(\) => \{[\s\S]{0,1400}?setNameExpanded\(\(was\) => \(was \? false : was\)\);/.exec(viewSrc)?.[0] || '';
    assert.ok(scrollBlock, 'the scroll handler retracts an expanded name');
    // 1.4.5 SUPERSEDED: the hover half retired (the "midway" collapse delay).
    assert.match(scrollBlock, /if \(rowsPinned\) return;/, 'the pin guards it (the rows hover law retired)');
  });

  // ---- fix 5: names cap at 60 ----
  ok('1.0.7 card names carry the 60-character cap — creation and edit alike', () => {
    assert.match(newSrc, /maxLength=\{60\}/, 'the creation NAME field is capped');
    assert.match(viewSrc, /maxLength=\{60\}/, 'the EDIT CARD name field is capped');
    assert.ok(!/maxLength=\{35\}/.test(newSrc) || /V1, alt outfit/.test(newSrc), 'the version label keeps its own 35');
  });

  // ---- fix 6: the output bar speaks the real texts ----
  ok('1.0.8 the output bar renders the REAL texts — and wears the version\'s own face', () => {
    // 1.0.8 — the name/label spans grew the data-gd-tip-name mark between
    // their title and their seat (the name-only clamp law), so the pin
    // follows the mark instead of the old title-then-child adjacency.
    assert.match(appSrc, /title=\{stripRichText\(character\.name\)\}[\s\S]{0,220}?<RichText text=\{character\.name\}\s*\/>/, 'the name renders rich inside the truncating span (name-marked)');
    assert.match(appSrc, /<RichText text=\{version\.label\} className="gd-chip-label-cap" \/>/, 'the version label renders rich at the cap');
    assert.match(appSrc, /title=\{stripRichText\(version\.label\)\}/, 'the plain text rides the hover');
    // 1.0.8 — THE CHIP IS THE VERSION'S OWN CONTAINER ("it should mimic the
    // version container including the emojie icon selected and color"):
    // the version's own color as the face (readableInk picks the polarity)
    // and its chosen icon glyph riding the label.
    assert.match(appSrc, /style=\{version\.color \? \{ background: version\.color, color: readableInk\(version\.color\) \} : undefined\}/, 'the chip wears the version\'s own color with readable ink');
    assert.match(appSrc, /\{version\.icon && <ChipGlyph name=\{version\.icon\} size=\{12\} \/>\}/, 'the version\'s icon glyph rides the label');
    // 1.0.8 — THE LEDGER WAITS FOR THE EXPANSION ("0/0 parts and word count
    // and lines should only be shown when the output container expands"):
    // the stats line prints ONCE (the expanded cover) and speaks WORDS.
    const ledgers = appSrc.match(/\{stats\.included\}\/\{stats\.total\} PARTS/g) || [];
    assert.equal(ledgers.length, 1, 'the ledger prints once — the expanded cover only');
    assert.match(appSrc, /\{stats\.included\}\/\{stats\.total\} PARTS · \{stats\.words\} WORDS · \{stats\.chars\} CHARS · \{stats\.lines\} LINES/, 'and it counts parts, words, chars and lines');
  });

  // ---- fix 7: the version labels stand straight ----
  ok('1.0.7 every version-label chip stands straight in every theme', () => {
    assert.match(viewSrc, /'gd-chip gd-chip-flat', active && 'is-active'/, 'the strip chips opt out of the tilt');
    assert.match(verSrc, /gd-chip gd-chip-flat min-w-0/, 'the version window preview is flat');
    assert.match(newSrc, /gd-chip gd-chip-flat min-w-0/, 'the creation preview is flat');
    // 1.1.0 — the seat re-pinned: the slimming (!py-0.5) prefix retired with
    // the twin law; the flat + split classes carry the pin now.
    assert.match(appSrc, /gd-out-split gd-chip gd-chip-flat"/, 'the output bar chip is flat (and the strip chip\'s exact twin — 1.1.0)');
    // the CSS law: after the theme block, beating every resting tilt
    const flatRule = /\[data-theme\] \.gd-chip-flat,\s*\[data-theme\] \.gd-chip-flat:nth-child\(odd\),\s*\[data-theme\] \.gd-chip-flat:nth-child\(even\)\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(flatRule, /transform: none;/, 'the flat law beats zine\'s odd/even weight');
    const flatHover = /\[data-theme\] \.gd-chip-flat:not\(\.gd-just-dropped \*\):hover\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(flatHover, /translate\(-1px, -1px\)/, 'hover keeps the shared lift — no rotation');
    // the theme tilts themselves survive for TAG chips
    /* 1.2.0 — the tilts retired ("remove the tilting of tags/versions all
       together, since some themes such as burrito theme still include it"):
       burrito's sticker keeps its shadow; the rotation is gone. */
    assert.match(codeCss, /\[data-theme='burrito'\] \.gd-chip\s*\{[^}]*\}/, 'the burrito sticker law stays');
    const burritoChip = /\[data-theme='burrito'\] \.gd-chip\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.ok(!/rotate\(-2deg\)/.test(burritoChip), 'the burrito chip tilt is retired (1.2.0)');
    assert.ok(!/rotate\(-1\.2deg\)/.test(codeCss) || !/nth-child\(odd\)/.test(/\[data-theme='zine'\][^\{]*\{[^}]*\}/.exec(codeCss)?.[0] || ''), 'no odd/even wobble survives (1.2.0)');
  });

  // ---- fix 8: the hand-off is one motion ----
  ok('1.0.7 the panel hand-off crossfades in place — cover, bar and all', () => {
    assert.match(appSrc, /const CHAR_COVER_VARIANTS = \{/, 'the cover flights are variants');
    assert.match(appSrc, /enter: \(handoff\) => \(handoff \? \{ opacity: 0, x: 0 \} : \{ opacity: 0, x: 20 \}\)/, 'a hand-off enters in place');
    /* 1.2.0 — the close deepened (64px, 0.26s): the out-flight reads as a
       close instead of an instant vanish. */
    /* 1.2.6 — the exit is KEYFRAMED now: opacity [1, 1, 0] holds the whole
       first 60% of a 0.3s slide (x 88) — the fade rides the tail. The
       hand-off crossfade stays in place (a transfer, not a close). */
    assert.match(appSrc, /opacity: \[1, 1, 0\],/, 'the close holds opaque while it travels (1.2.6)');
    assert.match(appSrc, /x: 88,/, 'and travels further on the way out (88px)');
    assert.match(appSrc, /exit: \(handoff\) =>\s*\n?\s*handoff\s*\?\s*\{ opacity: 0, x: 0 \}/, 'the hand-off still leaves in place');
    assert.match(appSrc, /<AnimatePresence custom=\{handoff\}>/, 'AnimatePresence resolves the exit through the flag');
    assert.match(appSrc, /initial=\{instant \? false : \{ height: 0, opacity: 0\.6 \}\}/, 'the bar mounts already open during a hand-off');
    assert.match(appSrc, /instant=\{handoff\}/, 'both bar mounts carry the flag');
    assert.match(appSrc, /setTimeout\(\(\) => setHandoff\(false\), 350\)/, 'the flag retires after the flight');
  });

  // ---- fix 9 (evolved 1.0.8): two lines belong to the NAME, not the pill ----
  ok('1.0.8 the NAME pill clamps at two lines; every other tooltip wraps free', () => {
    const tipRule = /\.gd-tip\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    // 1.0.8 — THE CLAMP MOVED ("when i said only 2 lines i meant the area
    // dedicated to the name of the card or the versions and so on"): the
    // base pill carries NO clamp — pin/expand/instructional tooltips wrap
    // to whatever they need (4+ lines welcome) and never clip again.
    assert.ok(!/-webkit-line-clamp/.test(tipRule), 'the base pill carries NO clamp — instructional tooltips never clip');
    assert.match(tipRule, /max-width: 280px;/, 'the width stays generous');
    // the NAME-ONLY seat: anchors marked data-gd-tip-name get .is-name,
    // and only that pill folds at two lines.
    const nameRule = /\.gd-tip\.is-name\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(nameRule, /-webkit-line-clamp: 2;/, 'the NAME-ONLY pill clamps at two lines');
    assert.match(nameRule, /-webkit-box-orient: vertical;/, 'as a proper box fold');
    // GdTooltips reads the mark and paints the pill with it
    const tipSrc = stripComments(src('src/components/GdTooltips.jsx'));
    assert.match(tipSrc, /el\.closest\('\[data-gd-tip-name\]'\)/, 'the anchor resolver reads the name mark');
    assert.match(tipSrc, /tip\.classList\.toggle\('is-name', current\.isName === true\)/, 'and paints the pill with it before the measure');
    // the name marks ride the name-bearing anchors
    assert.match(appSrc, /data-gd-tip-name="1"/, 'the output bar\'s texts carry it');
    assert.match(viewSrc, /data-gd-tip-name="1"/, 'the version chips carry it');
    assert.match(classSrc, /data-gd-tip-name=\{isRoot \? undefined : '1'\}/, 'the class rows carry it (non-root)');
    const toastRule = /\.gd-toast\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(toastRule, /white-space: normal;/, 'the feedback pill wraps');
    assert.match(toastRule, /-webkit-line-clamp: 2;/, 'and holds at most two lines');
    assert.match(toastRule, /max-width: min\(420px, calc\(100vw - 48px\)\);/, 'capped at a comfortable reading width');
    assert.ok(!/white-space: nowrap/.test(toastRule), 'the endless single line is gone');
  });

  // ---- fix 10: the settings window pops in once ----
  ok('1.0.7 the modal settles through its entrance — no tween fighting the pop-in', () => {
    assert.match(modalSrc, /const \[settling, setSettling\] = useState\(true\);/, 'the settle window opens armed');
    assert.match(modalSrc, /setTimeout\(\(\) => setSettling\(false\), 300\)/, 'and retires after 300ms');
    assert.match(modalSrc, /pinned \|\| settling \? \{ transition: 'none' \}/, 'height corrections land instantly while settling');
    // the portal law is untouched (SSR-safe lazy promotion)
    assert.match(modalSrc, /useLayoutEffect\(\(\) => \{\s*setPortalTo\(\(prev\) => prev \|\| \(typeof document !== 'undefined' && document\.body \? document\.body : prev\)\);/, 'the lazy portal target survives');
  });

  // ---- fix 11: the About page says the whole name ----
  ok('1.0.7 the About section reads BURRITO GENDEX', () => {
    assert.match(settingsSrc, />\s*BURRITO GENDEX\s*</, 'the wordmark under the mark');
  });

  // ---- fix 12 (evolved 1.0.8): the outline ring reads on the surface ----
  ok('1.0.8 the outline ring reads on the SURFACE — visible at rest in every theme', () => {
    const outlineRule = /\.rt-outline\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    // 1.0.8 — THE INVERSE RING RETIRED ("its only visible when selected but
    // when let go its not visible"): the inverse of the text's color IS the
    // ground on high-contrast themes, so the 1.0.7 ring vanished at rest.
    // The ring mixes the accent (a hue the text never wears) toward the
    // ink's polarity (a luminance that reads on the surface).
    /* 1.1.8 — the user asked for the inverse back ("make the text outline
       color the opposite of the letter"): the ring is the letter's own
       channel-by-channel inverse now, not the 1.0.8 accent mix. */
    assert.match(outlineRule, /-webkit-text-stroke: 1\.5px rgb\(from currentColor calc\(255 - r\) calc\(255 - g\) calc\(255 - b\)\)/, 'the ring is the letter\'s inverse (1.1.8)');
    /* 1.1.8 — the inverse is BACK by the user's own request ("make the
       text outline color the opposite of the letter"): what 1.0.8 retired
       on visibility grounds, 1.1.8 restores on the user's word — the ring
       is the letter's opposite, period. */
    assert.ok(/rgb\(from currentColor/.test(outlineRule), 'the inverse ring is BACK by request (1.1.8)');
    assert.ok(!/-webkit-text-stroke: 1\.5px currentColor/.test(outlineRule), 'the same-color ring is gone');
    assert.match(outlineRule, /paint-order: stroke fill;/, 'the fill stays crisp on top');
    const comboRule = /\.rt-b\.rt-outline\s*\{[^}]*\}/.exec(codeCss)?.[0] || '';
    assert.match(comboRule, /-webkit-text-stroke: 2px rgb\(from currentColor calc\(255 - r\) calc\(255 - g\) calc\(255 - b\)\)/, 'bold-under-outline keeps the fatter ring of the same inverse law (1.1.8)');
  });

  // ---- fix 14: the class icon picks its lightness ----
  ok('1.0.7 the class icon walks the contrast ladder against the selected wash', () => {
    assert.match(helpersSrc, /contrastRatio\(raw, base\) >= 4\.6/, 'the keep-raw bar is stiff');
    assert.match(helpersSrc, /for \(const amt of \[0\.22, 0\.38, 0\.54, 0\.7, 0\.85\]\)/, 'the ladder walks both directions, gentlest first');
    assert.match(classSrc, /mixHex\(color, panelHex, 0\.32\)/, 'the measurement rides the selected wash');
  });

  // ---- fix 15: the copy shed its em dashes ----
  ok('1.0.7 no em dash survives in tooltips, feedback, or the About copy', () => {
    for (const [name, text] of [['GridView', gridSrc], ['CharacterView', viewSrc], ['App', appSrc], ['SettingsModal', settingsSrc], ['ClassSidebar', classSrc], ['NewCharacterModal', newSrc], ['VersionSettingsModal', verSrc], ['Modal', modalSrc]]) {
      const titles = [...text.matchAll(/title=\{?[`"']([^`"'}]+)[`"']\}?/g)].map((m) => m[1]);
      const dashed = titles.filter((t) => t.includes('\u2014'));
      assert.equal(dashed.length, 0, `${name} tooltips carry no em dash`);
    }
    const statuses = [...appSrc.matchAll(/setStatusTransient\(\s*[`'"]([^`'"]+)[`'"]/g)].map((m) => m[1]);
    assert.equal(statuses.filter((s) => s.includes('\u2014')).length, 0, 'no feedback string carries an em dash');
    assert.match(settingsSrc, /Everything stays on your machine: no accounts, no/, 'the About blurb speaks with a colon');
    assert.match(settingsSrc, /<br \/>/, 'and breathes in shaped lines');
  });
}

// ===========================================================================
// Part B — live DOM checks
// ===========================================================================
{
  const makeApi = (over = {}) => ({
    loadDB: async () => ({
      db: {
        settings: {
          theme: 'burrito', colors: {}, zoom: 2, defaultSortMode: 'custom',
          textures: { workspace: 'none', titlebar: 'none', sidebar: 'none', viewer: 'confetti', panel: 'grid' },
          detailPanel: true, promptBottom: true, tagScale: 1.2, cardRatio: { w: 3, h: 4 },
          autoSwipeImages: true, ...over.settings,
        },
        classes: [{ id: 'cl1', name: 'heroes', parentId: 'root', order: 1 }],
        tags: [], stamps: [],
        characters: over.characters === null ? [] : [
          {
            id: 'c1', name: 'amy the amber archer of the long autumn woods', classId: 'cl1', tags: [], previewVersionId: null,
            cardRatio: { w: 4, h: 7 }, cardTrim: 'ledger', cardCrop: null, stamps: [],
            stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
            createdAt: Date.now(),
            versions: [
              {
                id: 'v1', label: 'V1', color: '#c8402f', icon: null,
                images: [{ file: 'a.png' }, { file: 'b.png' }, { file: 'c.png' }],
                parts: [{ id: 'p1', name: 'body', content: 'soft shading', include: true }],
                notes: 'first pass', createdAt: 1,
              },
            ],
          },
        ],
      },
      imagesPath: '/mock/images',
    }),
    saveDB: async () => ({ ok: true }),
    sendUnsavedState: () => {},
    onPromptUnsaved: () => () => {},
    saveAndClose: async () => ({ ok: true }),
    forceClose: () => {},
    windowControl: () => {},
    onWindowMaximized: () => () => {},
    onWindowUnmaximized: () => () => {},
    openExternal: () => {},
    clipboardReadText: async () => '',
    clipboardWriteText: async () => {},
    importImagesFromFiles: async () => [],
    saveImageBuffer: async () => ({ ok: true, file: 'x.png' }),
    deleteImageFile: async () => ({ ok: true }),
  });

  const App = require(join(appRoot, 'src/App.jsx')).default;
  const RichTextMod = require(join(appRoot, 'src/components/RichText.jsx'));
  const click = (el) => el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  const boot = async (api) => {
    window.api = api;
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(App));
    await sleep(3400);
    return { host, root };
  };

  await okAsync('1.0.7 the version chips stand straight (burrito theme, live strip)', async () => {
    const { host, root } = await boot(makeApi());
    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    click(card);
    await sleep(400);
    const chips = [...document.querySelectorAll('.gd-version-strip .gd-chip')];
    assert.ok(chips.length >= 1, 'the version strip mounted');
    for (const chip of chips) {
      assert.ok(chip.classList.contains('gd-chip-flat'), 'every version chip carries the flat opt-out');
    }
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.7 the name renders inside its fold — full text, heading role, no clamp class', async () => {
    const { host, root } = await boot(makeApi());
    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    click(card);
    await sleep(400);
    const fold = document.querySelector('.gd-name-fold');
    assert.ok(fold, 'the fold wrapper mounted');
    const heading = fold.querySelector('[role="heading"]');
    assert.ok(heading, 'the title node carries the heading role');
    assert.match(heading.textContent || '', /amy the amber archer/, 'it carries the full name');
    /* 1.1.1 — the clamp class IS the resting dots now (the fold sits
       retracted at mount); expanding lifts it (the 121 suite pins the
       full flight). */
    assert.ok(heading.className.includes('gd-name-clamp'), 'the resting name wears its dots (1.1.1)');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.7 the empty class NEW CARD key carries its tooltip (live)', async () => {
    const { host, root } = await boot(makeApi({ characters: null }));
    await sleep(200);
    const btn = [...host.querySelectorAll('button')].find((b) => (b.getAttribute('title') || '') === 'Create a new card in this class');
    assert.ok(btn, 'the empty-state NEW CARD key rendered (found by its own tooltip)');
    assert.match(btn.textContent || '', /NEW CARD/, 'and it is the NEW CARD key');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.7 the About tab reads BURRITO GENDEX (live)', async () => {
    const { host, root } = await boot(makeApi());
    const gear = [...host.querySelectorAll('button')].find((b) => /Settings \(/.test(b.getAttribute('title') || ''));
    assert.ok(gear, 'the settings key found');
    click(gear);
    await sleep(500);
    const aboutKey = [...document.querySelectorAll('.gd-rail-btn')].find((b) => /ABOUT/.test(b.textContent || ''));
    assert.ok(aboutKey, 'the About rail key found');
    click(aboutKey);
    await sleep(400);
    const modal = document.querySelector('[data-gd-modal]');
    assert.ok(modal, 'the settings window is open');
    assert.match(modal.textContent || '', /BURRITO GENDEX/, 'the About wordmark reads the whole name');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.7 no em dash rides any live tooltip (full sweep of the booted app)', async () => {
    const { host, root } = await boot(makeApi());
    const dashed = [...host.querySelectorAll('[title]')].filter((el) => (el.getAttribute('title') || '').includes('\u2014'));
    assert.equal(dashed.length, 0, 'every live tooltip speaks without em dashes');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.7 the hand-off still lands both ways (cover in place, panel back)', async () => {
    const { host, root } = await boot(makeApi());
    const card = host.ownerDocument.querySelector('[data-gd-char-id="c1"]');
    click(card);
    await sleep(400);
    assert.ok(document.querySelector('[data-gd-region="panel"]'), 'the right panel opened with the card');
    // toggle the detail panel OFF — the card hands off to the full window
    const panelKey = [...host.querySelectorAll('button')].find((b) => /Detail panel/.test(b.getAttribute('title') || ''));
    assert.ok(panelKey, 'the titlebar panel key found');
    click(panelKey);
    await sleep(500);
    assert.ok(document.querySelector('.gd-viewer-cover'), 'the full-window cover took the card');
    assert.match(document.querySelector('.gd-viewer-cover').textContent || '', /amy the amber archer/, 'the cover carries the card');
    // and BACK — the panel returns
    click(panelKey);
    await sleep(500);
    assert.ok(document.querySelector('[data-gd-region="panel"]'), 'the panel returned with the card');
    assert.ok(!document.querySelector('.gd-viewer-cover'), 'the cover is gone');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.7 the NAME field counts against 60 (live creation window)', async () => {
    const { host, root } = await boot(makeApi());
    const newBtn = [...host.querySelectorAll('button')].find((b) => /NEW CARD/.test((b.textContent || '').trim()));
    click(newBtn);
    await sleep(400);
    const modal = [...document.querySelectorAll('[data-gd-modal]')].find((m) => /NEW CARD/.test(m.textContent || ''));
    assert.ok(modal, 'the creation window opened');
    const nameField = modal.querySelector('.gd-rt-edit[data-placeholder^="e.g. amy"]');
    assert.ok(nameField, 'the NAME field mounted');
    const nameCount = nameField.closest('.gd-rt-wrap').querySelector('.gd-rt-count');
    assert.ok(nameCount, 'the name counter mounted');
    assert.match((nameCount.textContent || '').trim(), /^0\/60$/, 'the NAME field counts against 60');
    const labelField = modal.querySelector('.gd-rt-edit[data-placeholder^="V1, alt outfit"]');
    const labelCount = labelField.closest('.gd-rt-wrap').querySelector('.gd-rt-count');
    assert.match((labelCount.textContent || '').trim(), /^2\/35$/, 'the version label keeps its own 35');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.7 RichText renders the outline ring class (the format lives for real)', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    root.render(React.createElement(RichTextMod.RichText, { text: 'plain <b>bold</b> and <o>outlined</o> and <i>italic</i>' }));
    await flush();
    const bold = host.querySelector('.rt-b');
    const outline = host.querySelector('.rt-outline');
    const italic = host.querySelector('.rt-i');
    assert.ok(bold, 'bold renders');
    assert.ok(outline, 'outline renders');
    assert.ok(italic, 'italic renders');
    assert.equal(bold.textContent, 'bold', 'segments carry their own text');
    assert.equal(outline.textContent, 'outlined', 'the outlined run reads whole');
    root.unmount();
    host.remove();
  });

  await okAsync('1.0.7 the toast pill paints and wraps (two-line law, live)', async () => {
    const { host, root } = await boot(makeApi());
    window.dispatchEvent(new window.CustomEvent('gd-toast', { detail: { text: 'A verdict that runs long enough to wrap: created, saved, and kept', kind: 'ok' } }));
    await sleep(120);
    const pill = document.querySelector('.gd-toast');
    assert.ok(pill, 'the pill painted');
    assert.match(pill.textContent || '', /created, saved, and kept/, 'it carries the whole verdict');
    root.unmount();
    host.remove();
  });
}

// ---------------------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
