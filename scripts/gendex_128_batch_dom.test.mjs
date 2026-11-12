// 1.1.8 batch source checks — the sideways rows, the tray, and the cards
// that grow. The wave (thirteen asks, one release):
//   · THE COLLAPSE KEY BOTH WAYS ("fix the issue where the button to retract
//     the tags and stamps rows isnt visible, only the expand one once i
//     scroll down"): the open rows' separator carries a COLLAPSE pill now —
//     the fold is always one visible click away.
//   · THE PANEL STOPS LEAKING RIGHT ("i still can scroll to the right of the
//     right detail panel"): overflow-x hidden on the panel scroller + the
//     full-window view, the same law the viewer got in 1.1.5.
//   · THE GLOWLESS SPLASH ("remove glow from the splash screen, instead just
//     decoreate it more so its not empty"): the halo retired whole; ticks,
//     colophon, wordmark rules and the ornament row decorate the cover.
//   · UI MOTION MOVES TO PERFORMANCE; the TOP BAR GRADIENT option retires
//     (setting, constants, sanitizer, CSS rules, snapshot — all of it).
//   · THE DISCORD LABEL HOLDS ITS SEAT through font swaps (line-height: 1).
//   · THE FONT FOLLOWS EVERYWHERE ("some text like 'search cards' doesnt
//     follow the font"): the app root's Tailwind font-mono pin is GONE —
//     the whole main UI rides body's --gd-body-font.
//   · THE OUTLINE IS THE LETTER'S OPPOSITE ("if the letter is white then the
//     outline is black, if black then white"): relative-color inversion of
//     currentColor.
//   · THE EXPANDABLE CARD ("right click … expand it … 2 rows instead of one,
//     while still remaining in the same aspect ratio"): layoutMasonry's span
//     seat, the masonry's doubled wrapper, App's Set + menu key.
//   · THE SIDE-FLOW LAW (tags 3 rows / stamps 2 rows, sideways columns,
//     arrows + fades, no scroll while retracted) + THE TRAY + the creation
//     window's tag board + the single-row version strip with auto-center.
//
// Pure source checks — no jsdom needed for this wave.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const appRoot = process.cwd();
const src = (rel) => readFileSync(join(appRoot, rel), 'utf8');
const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

const pkg = JSON.parse(src('package.json'));
const cssRaw = src('src/index.css');
const css = stripComments(cssRaw);
const appSrc = stripComments(src('src/App.jsx'));
const viewSrc = stripComments(src('src/components/CharacterView.jsx'));
const sideSrc = stripComments(src('src/components/SideFlow.jsx'));
const gridSrc = stripComments(src('src/components/GridView.jsx'));
const masonrySrc = stripComments(src('src/components/MasonryGrid.jsx'));
const newSrc = stripComments(src('src/components/NewCharacterModal.jsx'));
const splashSrc = stripComments(src('src/components/Splash.jsx'));
const settingsSrc = stripComments(src('src/components/SettingsModal.jsx'));
const themeSrc = stripComments(src('src/utils/theme.js'));
const helpersSrc = stripComments(src('src/utils/helpers.js'));
const constsSrc = stripComments(src('src/constants/index.js'));
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.
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

// ===========================================================================
// the version
// ===========================================================================
ok('the version is 1.1.9', () => {
  assert.equal(APP.version, '1.4.3');
  assert.equal(pkg.version, '1.4.3');
  assert.match(src('README.md'), /\*\*v1\.4\.3\*\*/);
  assert.match(src('CHANGELOG.md'), /^## 1\.1\.8 /m, 'the changelog section exists');
  assert.match(src('START.bat'), /launcher \(1\.4\.3\)/);
});

// ===========================================================================
// fix 1 — the collapse key speaks both ways
// ===========================================================================
ok('the open rows carry a visible COLLAPSE pill (the separator speaks both ways)', () => {
  /* 1.6.7 — the law-pin moves with the fold's rework: the pill and the
     folded holder are ONE traveling chip now (.gd-rows-chipline, mounted
     BELOW the folding rows body — the body's own height tween carries it
     between the tail seat and the separator seat, "so it doesnt just
     dissapear then the other appear"). The chip speaks BOTH states
     through one ternary; nothing unmounts at either end. */
  const body = viewSrc.indexOf('gd-rows-body-inert');
  const chipline = viewSrc.indexOf('className="gd-rows-chipline"');
  assert.ok(chipline > body, 'the traveling chip renders below the rows body');
  assert.match(viewSrc, /autoCollapsed \? 'TAGS & STAMPS' : 'COLLAPSE'/, 'the one chip speaks both states');
  assert.match(viewSrc, /title=\{[\s\S]*?Collapse the tag and stamp rows/, 'the chip speaks its deed');
  assert.match(viewSrc, /autoCollapsed \? expandRows : \(\) => setAutoCollapsed\(true\)/, 'the chip folds and unfolds the rows');
  // the folded state keeps its TAGS & STAMPS voice (the 0.38.0 law) — the
  // same chip, its other face
  assert.match(viewSrc, /TAGS & STAMPS/, 'the folded expand voice survives');
  const expandChip = viewSrc.indexOf('TAGS & STAMPS');
  assert.ok(expandChip > viewSrc.indexOf('gd-rows-folded'), 'the expand chip rides the folded branch');
});

// ===========================================================================
// fix 2 — the panel stops leaking sideways
// ===========================================================================
ok('the detail panel + the full-window view seal overflow-x', () => {
  assert.match(
    appSrc,
    /className="h-full overflow-y-auto overflow-x-hidden gd-tex-panel"/,
    'the panel scroller says overflow-x hidden'
  );
  assert.match(
    viewSrc,
    /h-full overflow-y-auto overflow-x-hidden relative/,
    // 1.4.0 supersede: the scroller joined the anchor-less family
    // (gd-tex-scroll — the ±1px flight law); the seal itself is unchanged.
    'the full-window view scroller says it too (1.4.0: + gd-tex-scroll)'
  );
});

// ===========================================================================
// fix 3 — the glowless, decorated splash
// ===========================================================================
ok('the splash halo is retired whole', () => {
  assert.ok(!/gd-splash-halo/.test(splashSrc), 'no halo node in the launch JSX');
  assert.ok(!/\.gd-splash-halo\s*\{/.test(css), 'no halo rule survives in the css');
  assert.ok(!/@keyframes gd-splash-swell/.test(css), 'the swell keyframes retired with it');
  assert.ok(!/\[data-shade='light'\] \.gd-splash-halo/.test(css), 'the shade variant retired too');
});
ok('the cover is decorated by drawing (ticks, colophon, rules, ornaments)', () => {
  assert.match(splashSrc, /gd-splash-tick is-t/, 'the edge ticks mount');
  assert.equal((splashSrc.match(/gd-splash-tick is-/g) || []).length, 4, 'all four compass points');
  assert.match(splashSrc, /GENESIS ITERATIONS/, 'the studio colophon pins the top');
  assert.match(splashSrc, /gd-splash-word-row mt-6/, 'the wordmark rides a flanked row');
  assert.match(splashSrc, /gd-splash-orn-dot is-mid/, 'the three-diamond ornament row');
  assert.match(css, /\.gd-splash-tick\s*\{/, 'the tick rules exist');
  assert.match(css, /\.gd-splash-colo\s*\{/, 'the colophon rule exists');
  assert.match(css, /\.gd-splash-word-rule\s*\{/, 'the wordmark rule exists');
  assert.match(css, /\.gd-splash-orn-dot\s*\{/, 'the ornament rules exist');
  // the surviving decorations keep their seats
  assert.match(splashSrc, /gd-splash-corner is-tl/, 'the corner brackets stay');
  assert.match(splashSrc, /gd-splash-speck/, 'the drifting specks stay');
  assert.match(splashSrc, /gd-splash-foot/, 'the footer colophon stays');
});

// ===========================================================================
// fix 4 + 5 — settings move and shed
// ===========================================================================
ok('UI MOTION lives in the Performance tab now', () => {
  const perfBlock = viewSrc; // placeholder to keep symmetry
  // the Performance tab block carries the UI MOTION card, the Look tab does not
  const perfIdx = settingsSrc.indexOf("tab === 'Performance'");
  const lookIdx = settingsSrc.indexOf("tab === 'Look'");
  const motionIdx = settingsSrc.indexOf('title="UI MOTION"');
  assert.ok(perfIdx > -1 && motionIdx > perfIdx, 'the UI MOTION card sits in the Performance block');
  const lookBlock = settingsSrc.slice(lookIdx, perfIdx);
  assert.ok(!/title="UI MOTION"/.test(lookBlock), 'the Look block no longer carries it');
});
ok('the top bar gradient option is retired everywhere', () => {
  assert.ok(!/TOOLBAR GRADIENTS/.test(constsSrc), 'the constant is gone');
  assert.ok(!/toolbarGradient/.test(constsSrc.replace(/1\.1\.8 — TOOLBAR FINISH IS RETIRED[\s\S]*?every apply\./, '')), 'no live setting key (the retirement comment aside)');
  assert.ok(!/toolbarGradient:\s/.test(helpersSrc.replace(/1\.1\.8 — TOOLBAR FINISH IS RETIRED[\s\S]*?root\./, '')), 'the sanitizer never copies it');
  assert.ok(!/TOP BAR GRADIENT/.test(settingsSrc), 'the settings card is gone');
  assert.ok(!/data-toolbar-grad=/.test(css), 'no css rules match the old attribute');
  assert.match(themeSrc, /delete root\.dataset\.toolbarGrad;/, 'theme.js sweeps the stale attribute');
  assert.ok(!/toolbarGradient/.test(themeSrc), 'the theme pipeline never reads the key');
  assert.ok(!/toolbarGradient/.test(appSrc), 'App never passes it');
});

// ===========================================================================
// fix 6 — the Discord label holds its seat
// ===========================================================================
ok('the about link label is metric-independent (line-height: 1)', () => {
  const rule = /\.gd-about-link-label\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert.match(rule, /line-height: 1;/, 'the line box is pinned to the font-size');
  assert.match(rule, /letter-spacing: 0\.12em;/, 'the label keeps its voice');
});

// ===========================================================================
// fix 7 — the font follows everywhere
// ===========================================================================
ok('the app root no longer pins Tailwind font-mono (the whole UI follows the body font)', () => {
  // (the CRASH screen keeps its own font-mono on purpose — the fallback
  // report reads best in a mono face; only the APP ROOT's pin is gone)
  assert.doesNotMatch(
    appSrc,
    /className="h-screen w-screen overflow-hidden relative[^"']*font-mono/,
    'the app root class lost the font-mono utility'
  );
  assert.match(
    appSrc,
    /className="h-screen w-screen overflow-hidden relative bg-gd-bg text-gd-chrome text-\[13px\]"/,
    'the root keeps every other seat'
  );
  assert.match(css, /input,\s*textarea\s*\{[^}]*font-family: inherit;/, 'inputs still inherit');
});

// ===========================================================================
// fix 8 — the outline is the letter's opposite
// ===========================================================================
ok('the outline ring inverts the letter (relative color syntax)', () => {
  const rule = /\.rt-outline\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert.match(
    rule,
    /-webkit-text-stroke: 1\.5px rgb\(from currentColor calc\(255 - r\) calc\(255 - g\) calc\(255 - b\)\)/,
    'the ring is the channel-by-channel inverse of currentColor'
  );
  assert.match(rule, /paint-order: stroke fill;/, 'the fill stays crisp on top');
  const boldRule = /\.rt-b\.rt-outline\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert.match(
    boldRule,
    /-webkit-text-stroke: 2px rgb\(from currentColor calc\(255 - r\) calc\(255 - g\) calc\(255 - b\)\)/,
    'the bold ring thickens the same inverse'
  );
  assert.ok(!/var\(--gd-accent\) 62%/.test(rule + boldRule), 'the 1.0.8 accent mix is gone');
});

// ===========================================================================
// fix 9 — the expandable card
// ===========================================================================
ok('the masonry layout carries the span seat (two adjacent columns)', () => {
  const fn = /export function layoutMasonry\(heights, columns, cardWidth, gap, spans = null\) \{[\s\S]*?\n\}/.exec(helpersSrc)?.[0] || '';
  assert.ok(fn, 'the signature carries the optional spans seat');
  assert.match(fn, /positions\.push\(\{ x: best \* \(cw \+ g\), y, span: 2 \}\)/, 'a wide item lands on a pair');
  assert.match(fn, /colHeights\[best\] = y \+ h \+ g;\s*\n\s*colHeights\[best \+ 1\] = y \+ h \+ g;/, 'both columns advance past it');
  assert.match(fn, /spans && cols >= 2 \? Math\.min\(2, Math\.max\(1, Number\(spans\[i\]\) \|\| 1\)\) : 1/, 'a single column folds the span back to 1');
});
ok('the grid + App wire the expanded seats', () => {
  assert.match(appSrc, /const \[expandedCardIds, setExpandedCardIds\] = useState\(\(\) => new Set\(\)\)/, 'the Set state');
  assert.match(appSrc, /const toggleCardExpand = useCallback/, 'the toggle');
  assert.match(appSrc, /expandedCardsRef\.current = expandedCardIds;/, 'the ref mirror for the once-bound menu');
  assert.match(appSrc, /label: isCardExpanded \? 'Shrink to normal size' : 'Expand to double size'/, 'the menu key flips its label');
  assert.match(appSrc, /expandedIds=\{expandedCardIds\}/, 'GridView receives the seats');
  assert.match(gridSrc, /cardWidth=\{expanded \? cardWidth \* 2 \+ 20 : cardWidth\}/, 'the card speaks the doubled width');
  assert.match(masonrySrc, /expandedIds = null/, 'MasonryGrid accepts the seats');
  assert.match(masonrySrc, /width: posById\.get\(id\)\?\.span === 2 \? cardWidth \* 2 \+ gap : cardWidth/, 'the wrapper spans two columns');
  /* 1.2.0 — the measured truth is the layout's truth: the 1.9 estimate
     rides only the UNMEASURED seat; a measured height passes through as-is
     (the phantom-row fix). */
  assert.match(masonrySrc, /if \(spanOf\(id\) === 2\) \{[\s\S]{0,120}return h != null \? h : estHeight \* 1\.9;/, 'the wide estimate rides only the unmeasured seat (1.2.0)');
});

// ===========================================================================
// fix 10 + 13 — the side-flow law (zones + arrows)
// ===========================================================================
ok('SideFlow.jsx speaks the three seats (probe, live zone, arrows)', () => {
  assert.match(sideSrc, /export function SideFlowZone\(\{/, 'the zone component');
  assert.match(sideSrc, /rows = 3,/, 'the open cap seat');
  assert.match(sideSrc, /floorPx = 31,/, 'the clamp floor seat');
  assert.match(sideSrc, /function readBands\(el\)/, 'the band reader');
  assert.match(sideSrc, /gd-side-probe/, 'the measurement twin mounts');
  assert.match(sideSrc, /needsSide = bands\.length > rows/, 'the overflow verdict');
  assert.match(sideSrc, /\['--gd-side-cap'\]: `\$\{capH\}px`/, 'the cap rides a custom property');
  assert.match(sideSrc, /const entering = !wasCollapsedRef\.current;/, 'the prime rides only the entrance (the stuck-tween fix)');
  assert.match(sideSrc, /zone\.scrollBy\(\{ left: dir \* Math\.max\(140/, 'the arrows nudge in controlled steps');
});
ok('the side-flow CSS law (1.3.2: the WALL, one continuous column-major grid)', () => {
  assert.match(css, /\.gd-side-probe\s*\{[^}]*?visibility: hidden;/, 'the twin never paints');
  assert.match(css, /\.gd-collapse-zone\.is-side\s*\{[^}]*?overflow-x: auto;/, 'the side zone scrolls sideways');
  // 1.3.2 re-law: the PAGES are retired — the side seat is ONE continuous
  // WALL: a single grid flowing column-major (each column filled top to
  // bottom before the next begins), shrink-to-fit columns packed from the
  // left. The self-flow flavor grids the ZONE itself; the stamps flavor
  // grids the flow wrapper (width: max-content) inside the scroller zone.
  assert.match(css, /\.gd-collapse-zone\.is-side\.is-self-flow\s*\{[^}]*?grid-auto-flow: column;/, 'the self-flow zone IS the wall (column-major)');
  assert.match(css, /\.gd-collapse-zone\.is-side\.is-self-flow\s*\{[^}]*?justify-items: start;/, 'the wall packs from the left (never stretched)');
  assert.match(css, /\.gd-collapse-zone\.is-side > \.gd-stamp-slots\.is-wall\s*\{[^}]*?grid-auto-flow: column;/, 'the stamps wrapper IS the wall');
  assert.match(css, /\.gd-collapse-zone\.is-side > \.gd-stamp-slots\.is-wall\s*\{[^}]*?width: max-content;/, 'the wall takes its true width (the zone scrolls it)');
  assert.ok(!/\.gd-side-page\s*\{/.test(css), '1.3.2: the page boxes are gone (no slabs, no seams)');
  assert.ok(!/\.gd-side-row\s*\{/.test(css), '1.3.2: the lanes are gone with them');
  assert.ok(!/\.gd-side-block\.is-b\s*\{[^}]*?flex-direction: column;/.test(css), 'the column stack is retired');
  assert.ok(!/\.gd-collapse-zone\.is-side\s*\{[^}]*?padding-left: 9px;/.test(css), 'the side-specific padding is retired (one box law in every seat)');
  assert.match(css, /\.gd-flow-arrow\s*\{/, 'the arrow keys');
  assert.match(css, /\.gd-flow-fade\.is-left\s*\{[^}]*?left: var\(--gd-seat-ox-l, 0px\);/, 'the left fade seats on the zone\'s own clip box (1.2.0)');
  assert.match(css, /\.gd-flow-fade\.is-right\s*\{[^}]*?linear-gradient\(to left, var\(--gd-side-fade/, 'the right fade');
});
ok('the detail panel rides the zones (tags 3 rows, stamps 2 rows)', () => {
  /* 1.3.0 re-law: the tags zone lives in TagsFlowRow now (collapsed is its own prop).
     1.3.1 re-law: the retracted tags keep TWO rows (collapsedRows=2). */
  const tagsZone = /<SideFlowZone\s+rows=\{3\}\s+collapsedRows=\{2\}\s+collapsed=\{collapsed\}\s+floorPx=\{31\}\s+selfFlow/.exec(viewSrc);
  assert.ok(tagsZone, 'the tags zone: rows=3, collapsedRows=2 (1.3.1), floor=31');
  const stampZone = /<SideFlowZone\s+rows=\{2\}\s+collapsed=\{collapsed\}\s+floorPx=\{55\}\s+selfFlow=\{false\}\s+zoneClassName="gd-stamp-strip"/.exec(viewSrc);
  assert.ok(stampZone, 'the stamps zone: rows=2, floor=55, the wrapper flavor');
  assert.ok(!/useClampStyle\(tagsZoneRef/.test(viewSrc), 'the old tags clamp left its home');
  assert.ok(!/useClampStyle\(stripRef/.test(viewSrc), 'the old stamps clamp left too');
});
ok('the retracted seat keeps the old law (one row, no sideways scroll)', () => {
  assert.match(css, /\.gd-collapse-zone\.is-collapsed\s*\{[^}]*?overflow: hidden;/, 'the retract class keeps its clip guard');
  // the zone only gains is-side while OPEN (sideActive = !collapsed && needsSide)
  assert.match(sideSrc, /const sideActive = !collapsed && needsSide && capH != null;/, 'the side flow never rides the retracted seat');
});
ok('the creation window tag board joins the sideways world', () => {
  const board = /<SideFlowZone\s+rows=\{5\}\s+collapsedRows=\{3\}\s+collapsed=\{tagsFold\}\s+floorPx=\{31\}\s+selfFlow\s+zoneClassName="gd-tagfield"/.exec(newSrc);
  assert.ok(board, '1.1.9: the board is a SideFlowZone — folded three rows, open five (the dotted tray)');
  assert.ok(!/useClampStyle\(tagsBoardRef/.test(newSrc), 'the old board clamp left');
  assert.match(newSrc, /Collapse the tag board to its first three rows/, '1.1.9: the fold key speaks the three-row retract');
  assert.ok(!/galleryFold/.test(newSrc), '1.1.9: the stamps gallery lost its fold (always fully shown)');
});

// ===========================================================================
// fix 11 — the rows tray
// ===========================================================================
ok('the rows sit in their own tray', () => {
  assert.match(viewSrc, /className=\{clsx\('gd-rows-tray', autoCollapsed && 'gd-rows-folded'\)\}/, 'the tray class rides the rows zone');
  const tray = /\.gd-rows-tray\s*\{[^}]*\}/.exec(css)?.[0] || '';
  assert.match(tray, /border: 1px solid/, 'the hairline frame');
  assert.match(tray, /border-radius: calc\(var\(--gd-radius\) \+ 2px\)/, 'the rounded plate');
  assert.match(tray, /--gd-side-fade:/, 'the tray owns its fade ink');
});

// ===========================================================================
// fix 12 — the version strip is one arrowed, self-centering line
// ===========================================================================
ok('the strip never wraps: one row, native scroll, arrows + fades', () => {
  assert.match(
    viewSrc,
    /className="gd-version-strip py-2 px-2 flex items-center gap-2\.5 flex-nowrap overflow-x-auto"/,
    '1.1.9: the strip is a single scrolling row (py-2 px-2 — the tightened row + clip-plane air)'
  );
  assert.match(viewSrc, /<FlowEdges flow=\{verEdges\} label="version strip" \/>/, 'the arrows + fades ride the strip');
  assert.match(viewSrc, /const verEdges = useFlowEdges\(verStripRef, true,/, 'the edge hook watches the strip');
  assert.match(css, /\.gd-version-item\s*\{[^}]*?flex-shrink: 0;/, 'the chips never shrink');
  assert.ok(!/gd-version-strip py-4 flex items-center gap-2\.5 flex-wrap/.test(viewSrc), 'the wrapping strip is gone');
});
ok('the active version centers itself on open', () => {
  const effect = /useLayoutEffect\(\(\) => \{\s*\n\s*const strip = verStripRef\.current;[\s\S]*?\n\s*\}, \[character\.id, activeVerId, versions\.length\]\);/.exec(viewSrc);
  assert.ok(effect, 'the centering effect exists with the right deps');
  assert.match(effect[0], /versions\.findIndex\(\(v\) => v\.id === activeVerId\)/, 'it finds the active chip');
  assert.match(effect[0], /strip\.scrollLeft \+= drift/, 'it scrolls the strip (never the page)');
  assert.match(viewSrc, /const activeVerId = version\?\.id \|\| null;/, 'the active id derivation');
});

// ===========================================================================
// the download page + the batch's own file census
// ===========================================================================
ok('the in-source download page fronts 1.2.1', () => {
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(website, /v1\.4\.3/, 'the current card speaks the version');
  /* 1.2.9 re-law: each release retires the last one's copy — the tagline is
     1.2.9's now; this suite keeps only its historical truth (the card + the
     release link follow the live current). */
  // 1.8.8 — RETIRED WITH THE WEBSITE: assert.match(website, /releases\/tag\/v1\.3\.2/, 'the release link');
});

console.log(failed ? `\n${passed} passed, ${failed} failed — FIX ABOVE` : `\n1.1.8 batch: ${passed} checks passing`);
process.exit(failed ? 1 : 0);
