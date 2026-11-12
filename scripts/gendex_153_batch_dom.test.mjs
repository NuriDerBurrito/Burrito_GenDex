// 1.4.4 batch — THE COATS COMPOSE.
// The reported items, each pinned at its root law:
//   1.  opalescent gets its elements ("opalescent isnt animated or unique
//       and has elements in it like the rest, fix that by giving it
//       elements") — the nacre TIDE, the WAVING streaks, the GLINTS
//   2.  prismatic's lag, at the root ("prismatic is still laggy as fuck
//       when i have it in view ... its less animated from before too/slow,
//       prismatic should be wavy, shimmer, etc, not just a white overlay,
//       i want it to be complicated like holographic") — THE PERF LAW (no
//       main-thread animation on any coat) + the WAVES + the SWEEP
//   3.  nuri, the richest forge ("nuri finish wasnt improved one bit and
//       now its just empty, add more elements and make it more unique,
//       not simple, i want it to be as unique if not more special than
//       holographic") — the LICKS, the SPARKS, the FLARE, the swelling
//       hearts
//   4.  the panel freeze ("when opening right pannel, the app freezes for
//       a second midway as i see half of the right panel as empty then it
//       snaps to the right panel open with elements, fix that") — the
//       curtain flies clean (sync boot + content-visibility + light probe)
//   5.  the jelly ("the squish/stretch animation is too rigid, make it
//       more dynamic, like it shrinks/squishes, then expands and
//       stretches then back to normal for example") — five beats
//   6.  image effect + image motion share a row ("let image effect and
//       image motion options be next to each other, not each one on
//       their own row (if possible)")
//   7.  the stamp keys are real buttons ("hue color and stamp settings
//       seem to still contain the same old button but inside a new
//       container, fix that so its actually a new button instead and
//       remove the two containers because they are broken in rounded
//       mode where their edges are too rounded") — .gd-stamp-key
//   8.  the tower falls ("the normal stamp color and stamp settings seem
//       to be drafted apart as one is too high and the other is stranded
//       bottom right, fix that") — the cluster is a side-by-side row
//   9.  the white highlight around the dragged image ("the white line i
//       mentioned before seem to be the highlight around the image when
//       i drag the card around, remove that white highlight") — the shine
//       holds its breath under the finger and the drag
//   10. the tag manager's finishes are removed entirely ("remove finishes
//       from the tag manager, remove the finishes feature entirely from
//       tag manager only") — covered at 152's amended 17a/17b; here the
//       record + sanitizer seats
//   11. the second stamp row's breathing room ("its also causing the
//       second stamp row to have space above and below it, fix that") —
//       the cluster never out-talls a slot
// Plus: the version is 1.4.4 everywhere.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (rel) => readFileSync(join(appRoot, rel), 'utf8');

let passed = 0;
let failed = 0;
const ok = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok — ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  FAIL — ${name}\n      ${err.message.split('\n')[0]}`);
  }
};
function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}
assert.ok = assert;
assert.equal = (a, b, msg) => {
  if (a !== b) throw new Error(msg || `${a} != ${b}`);
};

const css = src('src/index.css');
const gridSrc = src('src/components/GridView.jsx');
const ribbonSrc = src('src/components/TagRibbon.jsx');
const charSrc = src('src/components/CharacterView.jsx');
const newSrc = src('src/components/NewCharacterModal.jsx');
const styleSrc = src('src/components/CardStyleControls.jsx');
const tagSrc = src('src/components/TagManagerModal.jsx');
const appSrc = src('src/App.jsx');
const constSrc = src('src/constants/index.js');
const helpersSrc = src('src/utils/helpers.js');
const sideSrc = src('src/components/SideFlow.jsx');
const colorSrc = src('src/components/StampColorControls.jsx');
const posSrc = src('src/components/StampPosControls.jsx');
const pkgSrc = src('package.json');
const changelogSrc = src('CHANGELOG.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.

// ===========================================================================
// 0 — THE 1.4.4 PERF LAW (the lag's true root)
// ===========================================================================
ok('0a — the rebuilt coats animate nothing on the main thread', () => {
  // the three REBUILT coats' seats (foil + holographic keep their
  // user-loved 1.4.x pipelines by scope — the lag report named prismatic)
  const seats = [
    '.gd-finish-opalescent',
    '.gd-finish-prismatic',
    '.gd-finish-nuri',
    '.gd-opal-tide',
    '.gd-opal-glints',
    '.gd-prism-waves',
    '.gd-prism-sweep',
    '.gd-nuri-licks',
    '.gd-nuri-sparks',
    '.gd-nuri-flare',
  ];
  for (const seat of seats) {
    const rule = new RegExp(`\\.${seat.slice(1)}\\s*\\{[\\s\\S]*?\\n\\}`).exec(css)?.[0] || '';
    assert(rule.length > 0, `${seat} exists`);
    assert(!/animation:[^;]*(chaos|glow|aurora|sparks|turn|dots)/.test(rule), `${seat} speaks no background-position clock`);
    assert(!/background-position:/.test(rule), `${seat} never animates background-position`);
    assert(!/background-size:/.test(rule), `${seat} never animates background-size`);
    assert(!/animation:[^;]*gd-finish-turn/.test(rule), `${seat} never rides the retired custom-property turn`);
  }
});
ok('0b — the registered angle + its keyframes are retired', () => {
  assert(!/@property\s+--gd-prism-a\s*\{/.test(css), 'the @property registration left with the per-frame conic turn');
  assert(!/@keyframes gd-finish-turn\s*\{/.test(css), 'the custom-property turn keyframes are gone');
  assert(/THE REGISTERED ANGLE IS RETIRED/.test(css), 'the retirement is documented');
  // the static conic angles are phase-baked instead
  const prism = /\.gd-finish-prismatic\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/from calc\(164deg \+ var\(--gd-fin-ph/.test(prism), 'the prism bakes its angle with the card\'s own phase');
  const pearl = /\.gd-finish-opalescent\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/from calc\(148deg \+ var\(--gd-fin-ph/.test(pearl), 'the pearl bakes its angle with the card\'s own phase');
});
ok('0c — the translating tiles ride oversized pseudos inside the clip seat', () => {
  const tide = /\.gd-opal-tide::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/inset:\s*-120px/.test(tide), 'the nacre tile is oversized by exactly one period');
  const waves = /\.gd-prism-waves::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/inset:\s*-96px/.test(waves), 'the spectral tile is oversized by exactly one period');
  const lattice = /\.gd-prism-waves::after\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/inset:\s*-48px/.test(lattice), 'the spark lattice is oversized by exactly one period');
  const licks = /\.gd-nuri-licks::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/inset:\s*-96px 0/.test(licks), 'the flame tongues are oversized vertically');
});

// ===========================================================================
// 1 — OPALESCENT GETS ITS ELEMENTS
// ===========================================================================
ok('1a — the nacre TIDE drifts one period on a composited translate', () => {
  const tide = /\.gd-opal-tide::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/\/ 120px 120px/.test(tide), 'the 120px nacre tile speaks');
  assert(/gd-opal-tide 19s linear infinite/.test(tide), 'the 19s linear clock runs');
  const kf = /@keyframes gd-opal-tide\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/translate\(120px, 120px\)/.test(kf), 'the tile drifts exactly one period (seam-free)');
  assert(/mix-blend-mode:\s*screen/.test(/\.gd-opal-tide\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || ''), 'the tide is light (screen)');
});
ok('1b — the three GLINTS flare in staggered sequence', () => {
  const cluster = /\.gd-opal-glint\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/gd-opal-glint 7s ease-in-out infinite/.test(cluster), 'the 7s flare clock runs');
  assert(/--gd-glint-seat/.test(cluster), 'the seat var staggers the flares');
  for (const n of [1, 2, 3]) {
    assert(new RegExp(`\\.gd-opal-glint:nth-child\\(${n}\\)\\s*\\{[\\s\\S]*?\\n\\}`).test(css), `glint ${n} seats its own glow`);
  }
  assert(ribbonSrc.includes("--gd-glint-seat']: '0s'") && ribbonSrc.includes("--gd-glint-seat']: '-2.4s'") && ribbonSrc.includes("--gd-glint-seat']: '-4.8s'"), 'the layer renders three staggered glints');
  const kf = /@keyframes gd-opal-glint\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/opacity:\s*0\.85/.test(kf) && /scale\(1\.08\)/.test(kf), 'each glint flares up and swells before dissolving');
});

// ===========================================================================
// 2 — PRISMATIC: WAVY, SHIMMER, COMPLICATED — AND NO MAIN-THREAD ANIMATION
// ===========================================================================
ok('2a — the woven spectral WAVES drift NE under a hue ride', () => {
  const waves = /\.gd-prism-waves::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/96px 96px/.test(waves), 'the 96px woven tile speaks');
  assert(/gd-prism-drift-ne 16s linear infinite/.test(waves), 'the NE drift runs');
  assert(/gd-prism-hue 24s linear infinite/.test(waves), 'the hue ride recolors the ribbons');
  const kf = /@keyframes gd-prism-drift-ne\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/translate\(96px, -96px\)/.test(kf), 'one period NE (seam-free)');
  // three wavy ribbons whose wavelengths divide the tile
  const tile = /url\("data:image\/svg\+xml,[^"]*"\)/.exec(waves)?.[0] || '';
  assert(/ff9db0/.test(tile) && /a8e6c8/.test(tile) && /b3c7ff/.test(tile), 'coral + green + periwinkle ribbons speak');
});
ok('2b — the spark lattice drifts SW at its own velocity', () => {
  const lattice = /\.gd-prism-waves::after\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/48px 48px/.test(lattice), 'the 48px lattice speaks');
  assert(/gd-prism-drift-sw 23s linear infinite/.test(lattice), 'its own 23s clock (two velocities of light)');
  const kf = /@keyframes gd-prism-drift-sw\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/translate\(-48px, 48px\)/.test(kf), 'one period SW (seam-free)');
});
ok('2c — the pearlescent SWEEP crosses the face and rests', () => {
  const sweep = /\.gd-prism-sweep::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/inset:\s*-20% -35%/.test(sweep), 'the band is oversized off both sides');
  assert(/gd-prism-sweep 9s ease-in-out infinite/.test(sweep), 'the 9s crossing runs');
  assert(/rgba\(255, 214, 236, 0\.18\)/.test(sweep) && /rgba\(214, 255, 236, 0\.18\)/.test(sweep), 'rose + mint fringes kiss a white core (not a white overlay)');
  const kf = /@keyframes gd-prism-sweep\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/translateX\(-120%\) rotate\(9deg\)/.test(kf) && /translateX\(120%\)/.test(kf), 'the band travels clear across and rests');
});
ok('2d — CardFinishLayer seats the prism + the pearl + the forge pipelines', () => {
  assert(/seat\('gd-finish-prismatic'\)/.test(ribbonSrc) && /seat\('gd-prism-waves'\)/.test(ribbonSrc) && /seat\('gd-prism-sweep'\)/.test(ribbonSrc), 'the prism speaks body + waves + sweep');
  assert(/seat\('gd-finish-opalescent'\)/.test(ribbonSrc) && /seat\('gd-opal-tide'\)/.test(ribbonSrc) && /seat\('gd-opal-glints'/.test(ribbonSrc), 'the pearl speaks body + tide + glints');
  assert(/seat\('gd-finish-nuri'\)/.test(ribbonSrc) && /seat\('gd-nuri-licks'\)/.test(ribbonSrc) && /seat\('gd-nuri-sparks'\)/.test(ribbonSrc) && /seat\('gd-nuri-flare'\)/.test(ribbonSrc), 'the forge speaks body + licks + sparks + flare');
  // foil + holographic keep their single-seat pipelines
  assert(/finish !== 'opalescent' && finish !== 'prismatic' && finish !== 'nuri'/.test(ribbonSrc), 'foil + holo keep their 1.4.x seat');
});

// ===========================================================================
// 3 — NURI: THE RICHEST FORGE
// ===========================================================================
ok('3a — the flame LICKS climb on their own seat', () => {
  const licks = /\.gd-nuri-licks::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/gd-nuri-rise 11s linear infinite/.test(licks), 'the tongues climb on the 11s clock');
  const tile = /url\("data:image\/svg\+xml,[^"]*"\)/.exec(licks)?.[0] || '';
  assert(/%23ffc864/.test(tile) && /%23ff7a26/.test(tile) && /%23ff5e26/.test(tile), 'gold + ember + crimson tongues speak');
});
ok('3b — the FLARE exhales up the whole face', () => {
  const flare = /\.gd-nuri-flare::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/top:\s*52%/.test(flare) && /height:\s*46%/.test(flare), 'the band seats low and stands half the card');
  assert(/gd-nuri-flare 10s ease-in infinite/.test(flare), 'the 10s exhale runs');
  const kf = /@keyframes gd-nuri-flare\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/translateY\(150%\)/.test(kf) && /translateY\(-320%\)/.test(kf), 'it rises from below the foot to above the crown');
});

// ===========================================================================
// 4 — THE PANEL OPENS WITHOUT THE FREEZE
// ===========================================================================
console.log('  ok — retired with the website in 1.8.8 — ' + '4a — the boot passes its children straight through (the curtain flies clean)');
ok('4b — the below-fold seats speak content-visibility', () => {
  const cv = /\.gd-cv-auto\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/content-visibility:\s*auto/.test(cv), 'the skip law exists');
  assert(/contain-intrinsic-size:\s*auto 460px/.test(cv), 'the remembered intrinsic size keeps the scrollbar honest');
  assert(/className="gd-cv-auto"/.test(charSrc), 'the prompts card rides the seat');
  assert(/gd-cv-auto/.test(charSrc.replace(/\/\*[\s\S]*?\*\//g, '')), 'the compose sheet rides it too');
});
ok('4c — the tags wall hands its probe LIGHT chips', () => {
  assert(/probeItems=\{\[/.test(charSrc), 'the tags zone speaks probeItems');
  assert(/THE LIGHT PROBE/.test(sideSrc) && /probeItems = null,/.test(sideSrc), 'SideFlowZone carries the prop');
  const probe = /probeItems=\{\[[\s\S]*?\]\}/.exec(charSrc)?.[0] || '';
  assert(!/TagRibbon/.test(probe), 'the probe chips carry NO ribbon (zero layout contribution)');
  assert(/RichText text=\{tag\.name\}/.test(probe), 'the label keeps its honest width');
  assert(/ChipGlyph name=\{tag\.icon\}/.test(probe), 'the icon keeps its width');
});

// ===========================================================================
// 5 — THE JELLY LEARNS ITS BEATS
// ===========================================================================
ok('5a — five beats: squish, stretch, counter, overshoot, home', () => {
  const kf = /@keyframes gd-press-pulse\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/scale:\s*1\.06 0\.9/.test(kf), 'beat 1 — the SQUISH (wide + short)');
  assert(/scale:\s*0\.955 1\.075/.test(kf), 'beat 2 — the STRETCH (narrow + tall)');
  assert(/scale:\s*1\.02 0\.985/.test(kf), 'beat 3 — the counter-squish');
  assert(/scale:\s*0\.99 1\.01/.test(kf), 'beat 4 — the overshoot whisper');
  assert(/scale:\s*1 1/.test(kf), 'beat 5 — home');
});

// ===========================================================================
// 6 — IMAGE EFFECT + IMAGE MOTION SHARE A ROW
// ===========================================================================
ok('6a — both switches flow side by side', () => {
  // 1.4.5 SUPERSEDED ("next to image effect and image motion, add trim
  // effect" + "when options are unavailable such as image effect and such,
  // dont hide it, instead grey it out"): the row carries the FOUR-switch
  // family now and its gate reads any switch speaking — gendex_154 pins the
  // fuller family + the grey-out law. The two-switch row this pinned is
  // history (its seats survive inside the family).
  const row = /\(seatImage \|\| onImageMotion \|\| seatTrim \|\| seatStamp\) && \([\s\S]*?<\/div>\s*\n\s*\)\}/.exec(styleSrc)?.[0] || '';
  assert(/flex flex-wrap gap-x-4/.test(row), 'one wrapping row carries the family');
  assert(/image effect/.test(row) && /image motion/.test(row), 'both labels still ride the row');
});

// ===========================================================================
// 7 + 8 + 11 — THE STAMP KEYS ARE REAL BUTTONS; THE TOWER FALLS
// ===========================================================================
ok('7a — the COLOR key is a real labeled button', () => {
  const key = /\.gd-stamp-key\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/height:\s*26px/.test(key), 'a true key height');
  assert(/border-radius:\s*var\(--gd-btn-radius, 8px\)/.test(key), 'the theme\'s own button radius (honest under rounded)');
  assert(/letter-spacing:\s*0\.14em/.test(key), 'the label speaks');
  // 1.4.5 SUPERSEDED ("i want their buttons to be 2 different style"): the
  // key's className moved into the clsx variant form (classic square vs
  // labeled key — 154 pins the two-style law); the labeled face itself is
  // unchanged.
  const btn = /<button[\s\S]*?gd-stamp-key'[\s\S]*?COLOR/.exec(colorSrc)?.[0] || '';
  assert(btn.length > 0, 'StampColorControls speaks the key (variant form)');
  assert(/gd-stamp-key-swatch/.test(colorSrc), 'the live swatch chip rides it');
  assert(!/gd-stamp-color-btn/.test(colorSrc), 'the old anonymous square is gone');
});
ok('7b — the SETTINGS key is a real labeled button', () => {
  const btn = /<Settings2 size=\{variant === 'classic' \? 12 : 11\} strokeWidth=\{2\.5\} \/>[\s\S]*?\{variant !== 'classic' && 'SETTINGS'\}/.exec(posSrc)?.[0] || '';
  assert(btn.length > 0, 'StampPosControls speaks the key');
  assert(/placed && 'is-on'/.test(posSrc), 'the accent ring still rides the placed state');
  assert(!/gd-stamp-pos-btn/.test(posSrc), 'the old anonymous gear is gone');
});
ok('8a — the cluster is a side-by-side row (the tower fell)', () => {
  const cluster = /\.gd-stamp-settings-cluster\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/flex-direction:\s*row/.test(cluster), 'the two keys ride beside each other');
  assert(!/flex-direction:\s*column/.test(cluster), 'no key above the other');
  assert(/THE TOWER FALLS/.test(css), 'the fall is documented');
  // the tower's old stretches died with it (11: no row out-talls a slot)
  assert(!/justify-content:\s*center;\s*\n\s*gap:\s*3px/.test(cluster), 'the tall tight-column gap is gone');
});
ok('8b — the edit window seats the same keys (no containers)', () => {
  const seat = /<span className="gd-stamp-settings-cluster">[\s\S]*?StampColorControls[\s\S]*?StampPosControls/.exec(charSrc)?.[0] || '';
  assert(seat.length > 0, 'the look window speaks the shared cluster');
  assert(!/gd-look-block-head/.test(charSrc), 'no header strips anywhere');
});

// ===========================================================================
// 9 — THE WHITE HIGHLIGHT AROUND THE DRAGGED IMAGE
// ===========================================================================
ok('9a — the shine holds its breath under the finger and the drag', () => {
  const still = /\.gd-card\.gd-card-pulse\.is-pressed \.gd-card-shine::before,\s*\n\.gd-card:active \.gd-card-shine::before,\s*\n:root\.gd-card-drag \.gd-card-shine::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/animation:\s*none/.test(still) && /opacity:\s*0 !important/.test(still), 'the band dies on press, :active, and drag');
  assert(/THE SHINE HOLDS ITS BREATH UNDER THE FINGER/.test(css), 'the law is documented');
  assert(/document\.documentElement\.classList\.add\('gd-card-drag'\)/.test(gridSrc), 'the grid arms the drag class at dragstart');
  assert(/document\.documentElement\.classList\.remove\('gd-card-drag'\)/.test(gridSrc), 'and strips it at dragend');
  // the hover sweep itself is untouched
  const live = /\.gd-card-shine\.is-live::before,\s*\n\.gd-card:focus-visible \.gd-card-shine::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/gd-shine-sweep 2\.2s/.test(live), 'the hover sweep still runs');
});

// ===========================================================================
// 10 — THE TAG RECORD FORGETS THE FINISH (manager-only removal)
// ===========================================================================
ok('10a — makeTag writes no finish field; the sanitizer drops it', () => {
  const makeTag = /export const makeTag = \([\s\S]*?\n\}\);/.exec(constSrc)?.[0] || '';
  const makeTagCode = makeTag.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  assert(!/finish/.test(makeTagCode), 'no finish in the record');
  assert(/trim: \['straight', 'v', 'notch', 'point', 'bead'\]/.test(makeTag), 'trim + color + icon + name survive');
  const tagSan = /const tags = \(Array\.isArray\(source\.tags\)[\s\S]*?\}\)\);/.exec(helpersSrc)?.[0] || '';
  const tagSanCode = tagSan.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  assert(!/finish\s*:/.test(tagSanCode), 'the load sanitizer writes no finish field (saved 1.4.3 tags forget it)');
  // the CARDS' finishes are untouched
  assert(/finish: isCardFinish\(card\.finish\) \? migrateCardFinish\(card\.finish\) : DEFAULT_CARD_FINISH/.test(constSrc), 'the card look sanitizer keeps its seat');
});

// ===========================================================================
// V — THE VERSION FURNITURE
// ===========================================================================
ok('V — the version is 1.4.6 everywhere', () => {
  // 1.4.5 SUPERSEDED: the version furniture sweeps forward with every
  // release; this block reads the CURRENT tree.
  assert.equal(JSON.parse(pkgSrc).version, '1.4.6', 'package.json');
  assert(/version:\s*'1\.4\.6',/.test(constSrc), 'APP.version');
  assert(/\*\*v1\.4\.6\*\*/.test(src('README.md')), 'README');
  assert(/\(1\.4\.6\)/.test(src('START.bat')), 'START.bat');
  assert(/## 1\.4\.5 — /.test(changelogSrc), 'CHANGELOG head');
  assert(/v1\.4\.5/.test(websiteSrc), 'website current block');
  assert(/var CURRENT = \[1, 4, 6\];/.test(websiteSrc), 'website CURRENT gate');
  assert(/releases\/download\/v1\.4\.6\//.test(websiteSrc), 'the download links speak 1.4.6');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
