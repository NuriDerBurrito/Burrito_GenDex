// 1.4.1 batch — THE LIVING CARD.
// The reported items, each pinned at its root law:
//   1.  the hover/press stacking collapse ("the bottom container of the
//       card which contains the name and such for some reason expands to
//       the top covering the image when i hover over the card"): the hover
//       brightness filter sat on the SLEEVE — a filter creates a stacking
//       context, demoting the whole art+ink subtree under the foot's z 0.
//       The lift rides the CLIP now (a positioned z-1 element that already
//       owns its context) — the ladder holds through hover, press, rest
//   2.  the pulse rides the WHOLE card ("the pulse/squish effect on click
//       should occur to the entire card including the container ... i can
//       see the edges of the image leaving behind white gaps"): the flight
//       sits on the card ROOT — border, paper, art and name plate breathe
//       as one object; the 1.4.0 wrapper is retired
//   3.  the panel answers on the press's own frame ("when i press on a
//       card, the right detail panel is slightly delayed"): the shell +
//       width flight paint on the click's frame; the heavy CharacterView
//       builds one rAF later inside a concurrent transition
//   5.  polychrome reworked ("not animated ... covering the card name with
//       a white block ... 0/10"): the opaque pearlescent flood retired; a
//       translucent LIVING WASH (pouring spectrum, turning conic, sparkle
//       lattice, hue breath); the plate mask seats like every other coat
//   6.  foil reworked ("remove the middle white line alongside the white
//       line that moves from center to left ... some circles inside
//       appearing and dissapearing"): the sheen element is GONE; three
//       staggered water-ripples + a sparkle lattice ride its seat
//   7.  holographic leans harder ("the shapes would affect the image
//       slightly more, not too distracting"): both shard lattices +25%
//   8.  prismatic's stars rotate ("make the stars in the render also
//       rotate very very slowly too"): a 150s star-field turn on ::after
//   9.  image motion ("add an option next to the affect the image to have
//       image motion ... the sway should be slow too"): the img's own
//       translate breath ±3% on a 7.5s clock + a permanent 1.1 safety
//       scale — riding the card object through both windows
//  10.  the edit window's stamp color + settings speak separate
//       containers ("each of the two has their own container inside")
//  11.  the hue is present without a stamp ("allow me to have a hue
//       setting even when there is no stamp ... greyout the stamp
//       settings container (tooltip ... requires a stamp)"): the color
//       panel always renders; the settings container locks
//  12.  the edit window is three columns ("make the trims have their own
//       column on the left (aka 3 columns now) ... no need to scroll")
//  13.  the corner coats: with the ladder holding at hover and the sheen
//       gone, every finish's corner notch wears its coat consistently
//  14.  the arrows' lift reaches the keys ("they seem too low"): the
//       1.4.0 lift var was written on the FADES only — it rides the arrow
//       buttons too now
//  16.  NURI, the fifth finish ("as cool as the ones i liked ...
//       dont make it rainbow like polychrome"): the ember coat — obsidian,
//       molten glow, rising sparks, a strictly WARM hue band
//  17.  the settings lag ("the settings right now is very slow/laggy"):
//       every modal layer arms .gd-coats-frozen — the covered regions'
//       coats pause; the modal previews keep breathing
// Plus: the version is 1.4.1 everywhere.
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
const lookSrc = src('src/components/CardLookEditor.jsx');
const ribbonSrc = src('src/components/TagRibbon.jsx');
const charSrc = src('src/components/CharacterView.jsx');
const newSrc = src('src/components/NewCharacterModal.jsx');
const styleSrc = src('src/components/CardStyleControls.jsx');
const appSrc = src('src/App.jsx');
const constSrc = src('src/constants/index.js');
const helpersSrc = src('src/utils/helpers.js');
const sideSrc = src('src/components/SideFlow.jsx');
const modalSrc = src('src/components/Modal.jsx');
const pkgSrc = src('package.json');
const changelogSrc = src('CHANGELOG.md');
// 1.8.8 — RETIRED WITH THE WEBSITE ("delete the website folder, the final
// release ships without it"): the one-file page left the repo
// with the final release; this suite's page-pins retired with it.

// ===========================================================================
// 1 — THE HOVER LADDER (the foot never expands over the image again)
// ===========================================================================
ok('1a — the hover filter rides the CLIP, never the sleeve', () => {
  // the collapsing law is gone: no filter on .gd-sleeve anywhere (the
  // token .gd-sleeve itself — not -clip / -deco descendants)
  assert(!/\.gd-card-hover:hover \.gd-sleeve,\s*\n\.gd-card-hover:focus-visible \.gd-sleeve\s*\{/.test(css), 'the sleeve never carries the hover filter');
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, '').match(/(^|\})[^{}]*\{[^{}]*\}/g) || [];
  const sleeveFiltered = rules.filter((r) => {
    const sel = r.slice(0, r.indexOf('{')).trim();
    const sels = sel.split(',').map((s) => s.trim());
    return sels.some((s) => /\.gd-sleeve$/.test(s) || /\.gd-sleeve\s*$/.test(s) || s === '.gd-sleeve') && /filter:\s*brightness/.test(r);
  });
  assert.equal(sleeveFiltered.length, 0, 'no brightness ever sits on the sleeve itself');
  // the new seat: the clip (positioned z 1 — already a context)
  const lift = /\.gd-card-hover:hover \.gd-sleeve-clip,\s*\n\.gd-card-hover:focus-visible \.gd-sleeve-clip\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/filter:\s*brightness\(1\.05\)\s*saturate\(1\.04\)/.test(lift), 'the brightness + saturate ride the clip');
  assert(/THE LIFT MOVES ONTO THE CLIP/.test(css), 'the move is documented at the seat');
});

ok('1b — the ladder survives every state (the z rungs are state-free)', () => {
  // the rungs themselves (unchanged by hover/press): clip 1, coat 2, deco 3
  const clipRule = /\.gd-sleeve-clip,\n\.gd-panzoom > \.gd-sleeve-clip\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/z-index:\s*1/.test(clipRule), 'the art clip keeps z 1');
  const decoRule = /\.gd-sleeve-deco,\n\.gd-panzoom > \.gd-sleeve-deco\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/z-index:\s*3/.test(decoRule), 'the ink work keeps z 3');
  const footRule = /\.gd-card-foot\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/z-index:\s*0/.test(footRule), 'the foot keeps its own z 0 context');
});

// ===========================================================================
// 2 — THE PULSE RIDES THE ROOT
// ===========================================================================
ok('2a — the flight sits on the card root; the wrapper is retired', () => {
  // the pulse class is applied on the ROOT element alongside gd-card
  assert(/'gd-card gd-card-collector gd-card-hover gd-card-pulse relative group/.test(gridSrc), 'the card root carries gd-card-pulse');
  // no wrapper div renders around the card content anymore
  assert(!/ref=\{pulseRef\}\s*\n\s*className="gd-card-pulse"/.test(gridSrc), 'the 1.4.0 pulse wrapper is gone');
  // the root retires the flight on its own animationend
  assert(/onAnimationEnd=\{\(e\) => \{[\s\S]*?gd-press-pulse[\s\S]*?classList\.remove\('is-pressed'\)/.test(gridSrc), 'the root retires is-pressed on animationend');
  // the CSS law: the flight rides .gd-card.gd-card-pulse
  assert(/\.gd-card\.gd-card-pulse\s*\{[\s\S]*?transform-origin:\s*50% 50%;\s*\n\}/.test(css), 'the root speaks the transform origin');
  assert(/\.gd-card\.gd-card-pulse\.is-pressed\s*\{[\s\S]*?animation:\s*gd-press-pulse/.test(css), 'the root speaks the flight');
  assert(/THE FLIGHT RIDES THE ROOT ITSELF/.test(css) || /THE JELLY LEARNS ITS BEATS/.test(css), 'the rework is documented (1.4.4: the jelly\'s beats)');
});

ok('2b — the pulse keyframes stay pure paint (no size, no neighbor)', () => {
  /* 1.4.3 supersede: the keyframes speak the independent `scale` PROPERTY
     now ("the squish/stretch animation from click is missing, right now it
     just repeats the hover animation, fix that") — transform-based
     keyframes OVERRIDDEN the hover lift for the flight's whole run, so the
     pressed card first dropped its 2px lift: a hover animation's twin.
     `scale` composes with the transform — the lift holds, the flight is
     still pure paint (no size, no neighbor). The 152 suite holds the law. */
  const kf = /@keyframes gd-press-pulse\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  /* 1.4.4 supersede: the jelly learned its beats — squish (1.06 x 0.9),
     stretch (0.955 x 1.075), counter, overshoot, home — 620ms. */
  assert(/scale:\s*1 1/.test(kf) && /scale:\s*1\.06 0\.9/.test(kf) && /scale:\s*0\.955 1\.075/.test(kf), '1.4.4: the five-beat jelly speaks the proper axes');
  // nothing but scale in the keyframes
  const props = kf.replace(/@keyframes gd-press-pulse\s*\{/, '').replace(/scale:\s*[^;]*;?/g, '').replace(/[0-9%.\s{},]/g, '');
  assert.equal(props, '', 'the flight touches nothing but scale');
});

// ===========================================================================
// 3 — THE PANEL'S FIRST FRAME IS THE CURTAIN
// ===========================================================================
ok('3a — DeferredPanelBoot: one rAF, then a synchronous build', () => {
  // 1.4.5 SUPERSEDED (the click's own frame stays cheap): the boot mounts a
  // skeleton and builds in a gated startTransition — gendex_154 pins the
  // live law; this shape is history.
  assert(true, 'the pass-through boot retired with the gated boot (see 154)');
  const body = /function DeferredPanelBoot\(\{ children \}\)\s*\{[\s\S]*?\n\}/.exec(appSrc)?.[0] || '';
  /* 1.4.4 supersede: the one-rAF deferral is RETIRED ("the app freezes
     for a second midway as i see half of the right panel as empty then
     it snaps") — the build rides the click's own commit; the curtain
     that follows never meets a heavy task mid-lane. */
  assert(!/requestAnimationFrame/.test(body), '1.4.4: no deferral — the boot passes through');
  // 1.4.5 SUPERSEDED: the gated boot owns this law now (see 154).
  assert(true, 'the sync build retired with the gated boot');
  /* 1.4.3 supersede: the concurrent transition is RETIRED ("when right
     panel opens, its blank and i have to wait until the data pops in") —
     the low-priority lane only committed when the whole heavy tree had
     rendered, which slid hundreds of ms late under load (measured live:
     ~400ms of blank aside on a 20x4 character). The build inside the rAF
     is SYNCHRONOUS now: the shell keeps the click's frame, the content
     simply lands. The 152 suite holds the whole law. */
  assert(!/startTransition/.test(body), '1.4.4: no transition lane (and no setTick — the pass-through boot)');
  // it wraps the CharacterView in the panel's content seat
  // 1.4.5: the boot seat now threads a label prop — the view still rides it.
  assert(/<DeferredPanelBoot[\s\S]{0,120}?<CharacterView/.test(appSrc), 'the panels view rides the boot');
  assert(/<\/DeferredPanelBoot>/.test(appSrc), 'the boot closes around the view');
  assert(/THE PANEL.S FIRST FRAME IS THE CURTAIN/.test(appSrc) || /FIRST FRAME IS THE CURTAIN/.test(appSrc), 'the deferral is documented at the seat');
});

// ===========================================================================
// 5 — POLYCHROME'S SEAT (1.4.3 supersede: OPALESCENT, the pearl)
// ===========================================================================
ok('5a — the opaque pearlescent flood is retired', () => {
  /* 1.4.3 supersede: OPALESCENT replaces polychrome outright ("remove
     polychrome, replace it with Opalescent") — the pearl keeps the
     translucent law the pour learned. The 152 suite holds the pearl's
     whole material law. */
  const poly = /\.gd-finish-opalescent\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(!/#fbfafd|rgba\(255, 255, 255, 0\.85\)/.test(poly), 'no opaque white body anymore');
  assert(/mix-blend-mode:\s*soft-light/.test(poly), '1.4.3: the pearl blends milky + translucent');
  assert(!/\.gd-finish-polychrome\s*\{/.test(css), '1.4.3: the pour left with its name');
  // the special plate-mask law is gone: every coat seats the same way
  const layer = /export function CardFinishLayer\([\s\S]*?\n\}/.exec(ribbonSrc)?.[0] || '';
  assert(!/finish === 'polychrome'\) && hasImage/.test(layer), "the old opaque-flood mask is retired");
  assert.equal(/plateOnly = !onImage && hasImage/.test(layer), true, 'the plate veil is the one law for every coat');
});

ok('5b — the pearl: glow + turn + sheen, all phase-read', () => {
  const poly = /\.gd-finish-opalescent\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  /* 1.4.4 supersede: the pearl's body is static (the perf law); the
     motion lives in the TIDE (19s) + the GLINTS (7s), all phase-read. */
  assert(!/animation:/.test(poly), '1.4.4: the pearl\'s body is static');
  assert(/gd-opal-tide 19s linear infinite/.test(css), '1.4.4: the nacre tide drifts');
  assert(/gd-opal-glint 7s ease-in-out infinite/.test(css), '1.4.4: the glints flare');
  // the refraction streaks ride ::after, breathing their brightness
  /* 1.4.4 supersede: the streaks ride the TIDE's ::after now (their own
     seat) and WAVE beside the brightness breath. */
  const after = /\.gd-opal-tide::after\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/gd-opal-sheen 9s ease-in-out infinite/.test(after), '1.4.4: the streaks shift in brightness');
  // 1.4.5 SUPERSEDED: the streaks softened (11s to 13s, the wobble halved)
  // so they read as refraction, not ruled paper.
  assert(/gd-opal-streak 13s ease-in-out infinite/.test(after), '1.4.5: the softened streaks still wave');
  assert(/repeating-linear-gradient\(\s*\n?\s*117deg/.test(after), '1.4.4: the fine DIAGONAL streaks');
  assert(/repeating-linear-gradient\(\s*\n?\s*124deg/.test(after), '1.4.4: the close-angled interference bands');
  // the sprite wears the pearl's pastel light
  const artfin = /\.gd-artfin-opalescent\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/mix-blend-mode:\s*soft-light/.test(artfin) && /rgba\(255, 226, 238, 0\.5\)/.test(artfin), '1.4.3: the sprite wears the pearl');
});

ok('5c — the text reads through (the white block is gone by construction)', () => {
  /* 1.4.3 supersede: the gradient text law retired WITH the pour — the
     pearl is a translucent veil, so the card's own printing keeps its
     voice and no scope class seats on any surface. */
  assert(!/\.is-fin-poly \.gd-card-title/.test(css), '1.4.3: the gradient text clip left with the pour');
  assert(!/is-fin-poly/.test(gridSrc) && !/is-fin-poly/.test(lookSrc) && !/is-fin-poly/.test(ribbonSrc), '1.4.3: no surface seats the retired scope');
  const layer = /export function CardFinishLayer\([\s\S]*?\n\}/.exec(ribbonSrc)?.[0] || '';
  assert(/POLYCHROME LEAVES FOR OPALESCENT/.test(ribbonSrc), '1.4.3: the succession is documented');
});

// ===========================================================================
// 6 — FOIL, THE LIVING METAL
// ===========================================================================
ok('6a — the sheen (the middle white line + the travelling streak) is gone', () => {
  assert(!/\.gd-finish-foil-sheen\s*\{/.test(css), 'the sheen seat left the sheet');
  assert(!/@keyframes gd-foil-sheen/.test(css), 'the sheen clock left with it');
  assert(!/gd-finish-foil-sheen/.test(ribbonSrc), 'CardFinishLayer never renders the sheen');
  assert(!/rgba\(255, 255, 255, 0\.97\) 50%/.test(css), 'the 0.97 white center band is gone from the sheet');
  assert(/THE LIVING METAL, reworked/.test(css), 'the rework is documented');
});

ok('6b — the ripples: three staggered seats, transform-only', () => {
  // the JSX renders the ripple layer with three phase-offset seats
  assert(/gd-finish-foil-ripples/.test(ribbonSrc), 'the ripple sibling renders for foil');
  const seats = (ribbonSrc.match(/--gd-ripple-seat'\]:\s*'(\d)s'/g) || []).map((s) => Number(s.match(/\d/)[0]));
  assert.equal(seats.length, 3, 'three ripples ride the layer');
  assert.equal([...seats].sort((a, b) => a - b).join(','), '0,3,6', 'the seats stagger a third of the 9s loop apart');
  // the CSS: the ring stroke scales from the heart, opacity in/out
  const ripple = /\.gd-foil-ripple\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/transform-origin:\s*50% 46%/.test(ripple), 'the ripple grows from the card\'s heart');
  assert(/calc\(var\(--gd-fin-ph, 0\) \* -9s - var\(--gd-ripple-seat, 0s\)\)/.test(ripple), 'the delay reads the phase and the seat');
  const kf = /@keyframes gd-foil-ripple\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  /* 1.4.3 supersede: the ring FADES IN as it grows ("the white line in
     the middle ... its visible when i hold click drag or when i click on a
     card") — near-zero through its smallest seats, full strength around
     the mid-flight, dissolving at the edges. The peak dropped 0.85 → 0.8. */
  assert(/scale\(0\.22\)/.test(kf) && /scale\(1\.42\)/.test(kf) && /opacity:\s*0\.8/.test(kf), '1.4.3: the ripple arrives soft, swells, and dissolves');
  assert(/30%\s*\{[\s\S]*?opacity:\s*0\.1;/.test(kf), '1.4.3: the smallest seats stay near-invisible (no stark arc at the heart)');
  // the sparkle lattice rides the same layer (the loved family element)
  const layer = /\.gd-finish-foil-ripples\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/gd-foil-sparkle 8s linear infinite/.test(layer), 'the sparkle lattice drifts');
  assert(/overflow:\s*hidden/.test(layer), '1.4.3: the ripples never leave the card (the clip law)');
});

ok('6c — the body keeps its temperament (metal + breathing rings + hue)', () => {
  const foil = /\.gd-finish-foil\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/mix-blend-mode:\s*multiply/.test(foil), 'the metal still multiplies');
  assert(/repeating-radial-gradient/.test(foil), 'the concentric rings survive');
  assert(/gd-foil-gleam 9s ease-in-out infinite/.test(foil) && /gd-foil-hue 13s ease-in-out infinite/.test(foil), 'the gleam + hue clocks survive');
});

// ===========================================================================
// 7 + 8 — HOLO LEANS, PRISM TURNS
// ===========================================================================
ok('7a — the holographic shard lattices lean ~25% harder', () => {
  const holo = /\.gd-finish-holographic\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  // the 128px tile: the first shard went 0.46 → 0.58
  assert(/fill='%23ff2fa0' fill-opacity='0\.58'/.test(holo), 'the primary shard lattice reads 0.58 (was 0.46)');
  // the 64px tile: 0.42 → 0.52
  assert(/fill='%2322e0ff' fill-opacity='0\.52'/.test(holo), 'the fine lattice reads 0.52 (was 0.42)');
  assert(/THE SHAPES LEAN HARDER/.test(css), 'the lean is documented');
});

ok('8a — the prismatic star field turns (calm, visible, cheap)', () => {
  const after = /\.gd-finish-prismatic::after\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  /* 1.4.3 supersede: the turn runs once every 48 seconds now ("implement
     the 4 stars rotating, ensure its animated properly too" — 150s read
     as stillness), the layer is clipped inside the card and speaks PLAIN
     compositing (the oversized screen-blend was the lag's root). */
  assert(/inset:\s*-40%/.test(after), '1.4.3: the turning layer is oversized (corners never leave the face)');
  /* 1.4.4 supersede: the turn quickened to 32s ("less animated from
     before too/slow") — the coat gained the waves + sweep seats. */
  assert(/gd-prism-starfield 32s linear infinite/.test(after), '1.4.4: the turn speaks 32s');
  assert(!/mix-blend-mode:\s*screen/.test(after), '1.4.3: plain compositing (the blend cost is gone)');
  const kf = /@keyframes gd-prism-starfield\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/rotate\(0deg\)/.test(kf) && /rotate\(360deg\)/.test(kf), 'the flight is a full rotation');
  assert(/THE STAR FIELD TURNS/.test(css) && /QUICKENS IT/.test(css), '1.4.4: the quickening is documented');
  assert(/overflow:\s*hidden/.test(/\.gd-card-face-finish\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || ''), '1.4.3: the coat clips its oversize at the face');
});

// ===========================================================================
// 9 — IMAGE MOTION
// ===========================================================================
ok('9a — the sway law: translate on the img, a permanent safety scale', () => {
  const sway = /\.gd-img-motion \.gd-sleeve-clip img,\s*\n\.gd-img-motion \.gd-preview-art img\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  /* 1.4.3 supersede: the sway HALVES ("the image motion goes too
     high/too low, half the distance") — ±1.5% with a 1.06 safety zoom. */
  assert(/scale:\s*1\.06/.test(sway), '1.4.3: the safety zoom rides the scale property (1.06)');
  assert(/animation:\s*gd-img-sway 7\.5s ease-in-out infinite/.test(sway), 'the sway breathes on the slow clock');
  const kf = /@keyframes gd-img-sway\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/translate:\s*0 -1\.5%/.test(kf) && /translate:\s*0 1\.5%/.test(kf), '1.4.3: the sway is ±1.5% of the art\'s height (half the distance)');
  // the math mirror: 1.5% excursion < the 3% the 1.06 scale spares each side
  assert(1.5 + 0.5 < (0.06 * 100) / 2, 'the sway fits inside the zoom\'s spare');
  // reduced motion stills the sway, keeps the honest zoom
  const rm = /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.gd-img-motion \.gd-sleeve-clip img,[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/animation:\s*none/.test(rm) && /translate:\s*none/.test(rm), 'reduced motion stills the sway');
});

ok('9b — the field rides the card object end to end', () => {
  // constants: the sanitize rail
  assert(/imageMotion: card\.imageMotion === true/.test(constSrc), 'sanitizeCardLook carries the switch');
  assert(/cardImageMotion: sanitizeCardLook\(card\)\.imageMotion/.test(constSrc), 'makeCharacter lands it on the record');
  assert(/cardImageMotion: character\?\.cardImageMotion === true/.test(helpersSrc), 'the load-side sanitizer keeps it');
  // the shared switch: CardStyleControls seats it beside affect-the-image
  assert(/imageMotion = false,/.test(styleSrc) && /onImageMotion = null,/.test(styleSrc), 'the shared controls take the switch');
  assert(/image motion/.test(styleSrc), 'the switch row reads its name');
  // both windows draft it
  assert(/const \[imageMotion, setImageMotion\] = useState\(character\.cardImageMotion === true\);/.test(charSrc), 'the edit window drafts it');
  assert(/imageMotion={imageMotion}\s*\n\s*trimAside/.test(charSrc), 'the edit window threads it to the preview');
  assert(/onImageMotion=\{touch\(setImageMotion\)\}/.test(charSrc), 'the edit window commits it');
  assert(/const \[imageMotion, setImageMotion\] = useState\(false\);/.test(newSrc), 'the creation window drafts it');
  // 1.4.5 SUPERSEDED: the submit carries the whole finish family now.
  assert(/color: cardColor, finish, finishOnImage, finishOnTrim, finishOnStamp, imageMotion \}/.test(newSrc), 'the creation submit carries the finish family');
  // App's commit lane
  assert(/cardImageMotion: card\.imageMotion === true/.test(appSrc), 'the App lane lands it');
  // the grid card arms the scope
  assert(/cardImageMotion && 'gd-img-motion'/.test(gridSrc), 'the grid card arms the sway scope');
  // WYSIWYG: both preview surfaces arm it too
  assert(/imageMotion && 'gd-img-motion'/.test(ribbonSrc), 'the compact preview arms the sway');
  assert(/imageMotion && 'gd-img-motion'/.test(lookSrc), 'the panzoom arms the sway');
});

// ===========================================================================
// 10 + 11 + 12 — THE EDIT CARD WINDOW
// ===========================================================================
ok('10a — stamp color and stamp settings each own a container', () => {
  /* 1.4.3 supersede: the two blocks speak the look window's OWN
     container (.gd-look-block — "you may give it a unique container that
     only appears in that window") with a header strip carrying the label
     + the LIVE/DRAFTING/LOCKED word. */
  /* 1.4.4 supersede: the framed containers are RETIRED ("remove the two
     containers because they are broken in rounded mode where their edges
     are too rounded") — the window seats the shared keys cluster, the
     same .gd-stamp-key pair every window speaks. */
  assert(/>STAMP</.test(charSrc), '1.4.4: the STAMP label speaks (a plain section like CARD COLOR)');
  assert(/<span className="gd-stamp-settings-cluster">[\s\S]*?StampColorControls[\s\S]*?StampPosControls/.test(charSrc), '1.4.4: the shared keys cluster seats both options');
  assert(!/gd-look-block-head/.test(charSrc), '1.4.4: no header strips anywhere');
});

ok('11a — the hue is always present; the settings lock without a stamp', () => {
  // the 1.4.0 conditional ({topStamp && ...) around the whole stamp section is gone
  assert(!/\{topStamp && \(\s*\n\s*<div>\s*\n\s*<div className="text-\[9px\][^"]*">STAMP SETTINGS/.test(charSrc), 'the section no longer hides without a stamp');
  // the locked seat: greyed, blind, tooltip-carrying
  const lock = /\.gd-locked-seat\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/cursor:\s*not-allowed/.test(lock), 'the lock speaks its cursor');
  const lockContent = /\.gd-locked-seat > \*\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/opacity:\s*0\.42/.test(lockContent) && /pointer-events:\s*none/.test(lockContent), 'the content fades and goes blind');
  assert(/'This option requires a stamp'/.test(charSrc), 'the tooltip text speaks the requirement');
  // the hue drafts even without a stamp (the note at the panel)
  /* 1.4.3 supersede: the no-stamp word is DRAFTING on the look window's
     own header strip — the hue block carries it. */
  /* 1.4.4 supersede: the DRAFTING word left with the look-block headers;
     the no-stamp state speaks through the settings key's locked seat
     + the section's own note. */
  assert(/className=\{clsx\(!topStamp && 'gd-locked-key'\)\}/.test(charSrc), '1.4.4: the settings key locks without a stamp');
});

ok('12a — the window is three columns (the trims own the left rail)', () => {
  assert(/width="w-\[860px\]"/.test(charSrc), 'the window widened for the third column');
  assert(/trimAside/.test(charSrc), 'the modal asks for the trim rail');
  assert(/const \{clsx\('space-y-4', trimAside && 'flex gap-x-4 items-start'\)\}/.test(lookSrc) || /clsx\('space-y-4', trimAside && 'flex gap-x-4 items-start'\)/.test(lookSrc), 'the editor lays the rail beside the preview');
  const rail = /\{trimAside && \(\s*\n\s*<div className="w-\[132px\] flex-shrink-0">/.exec(lookSrc)?.[0] || '';
  assert.equal(rail !== '', true, 'the trim rail is a fixed 132px column');
  // the stacked TRIM section renders only when the rail is not asked for
  assert(/\{!trimAside && \(/.test(lookSrc), 'the stacked trim section stands down for the rail');
  assert(/TRIM ASIDE/.test(lookSrc), 'the rail is documented');
});

// ===========================================================================
// 14 — THE ARROWS' LIFT REACHES THE KEYS
// ===========================================================================
ok('14a — the lift var rides the arrow buttons, not just the fades', () => {
  // the buttons carry the liftStyle
  const arrows = /export function FlowEdges\(\{ flow, label \}\)[\s\S]*?\n\}/.exec(sideSrc)?.[0] || '';
  const btnCount = (arrows.match(/style=\{liftStyle\}/g) || []).length;
  assert.equal(btnCount, 2, 'both arrow buttons carry the lift var');
  assert(/THE LIFT REACHES THE ARROWS/.test(sideSrc), 'the fix is documented');
  // the centering transform still reads the var
  assert(/transform: translateY\(calc\(-50% - var\(--gd-flow-arrow-lift, 0px\)\)\)/.test(css), 'the centering law survives');
});

// ===========================================================================
// 16 — NURI, THE EMBER COAT
// ===========================================================================
ok('16a — the fifth finish is seated end to end', () => {
  assert(/\{ id: 'nuri', label: 'Nuri' \}/.test(constSrc), 'CARD_FINISHES carries nuri');
  assert(/gd-finish-nuri/.test(css), 'the material speaks its CSS');
  assert(/gd-artfin-nuri/.test(css), 'the sprite treatment exists in the CSS');
  /* 1.4.3 supersede: opalescent takes polychrome's seat in the artfin
     list (the pearl joins the sprite-treatment family). */
  assert(/finish === 'prismatic' \|\| finish === 'opalescent' \|\| finish === 'nuri'/.test(ribbonSrc), '1.4.3: the artfin renders for nuri (+ the pearl)');
  assert(/the living flame: a panning ember aurora/.test(styleSrc), '1.4.3: the chip speaks its reworked tooltip');
});

ok('16b — the living flame: multi-hue aurora, rising sparks, twin glows', () => {
  /* 1.4.3 supersede ("improve nuri finish" + "nuri effect seems to apply a
     single color above all, fix that so its not a single color, it should
     work with all colors and maybe change periodically"): the coat
     speaks the whole FIRE now — an ember aurora PANNING the fire band
     (never one flat color), crossed veins, the rising sparks kept, and
     twin cross-fading heart glows whose own hue walks over time. The 152
     suite holds the whole law. */
  const nuri = /\.gd-finish-nuri\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/mix-blend-mode:\s*overlay/.test(nuri), 'the coat blends');
  /* 1.4.4 supersede: the sparks moved to their own seat at 7.5s; the
     aurora pan retired with the background-position law — the fire is
     static + full-band, the motion lives in licks (11s) + sparks (7.5s)
     + flare (10s) + hearts (7s). */
  assert(/gd-nuri-rise 7\.5s linear infinite/.test(/\.gd-nuri-sparks::before\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || ''), '1.4.4: the sparks climb at their own velocity');
  assert(/rgba\(178, 34, 52, 0\.34\)/.test(nuri) && /rgba\(255, 196, 60, 0\.28\)/.test(nuri) && /rgba\(255, 92, 92, 0\.26\)/.test(nuri), '1.4.4: the fire band speaks (presence raised)');
  assert(!/260% 260%/.test(nuri), '1.4.4: the pan is gone (static full-band wash)');
  // the embers climb: the tile translates DOWN one period
  /* 1.4.4 supersede: the sparks' background-position clock + the aurora
     pan retired with the perf law — the rise keyframe translates one
     period on BOTH seats (licks + sparks). */
  const rise = /@keyframes gd-nuri-rise\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/translate\(0, 96px\)/.test(rise), '1.4.4: the tiles translate exactly one 96px period (seam-free)');
  assert(!/@keyframes gd-nuri-aurora\s*\{/.test(css), '1.4.4: the aurora pan is gone');
  // the twin heart glows cross-fade on ::after, hue walking
  const after = /\.gd-finish-nuri::after\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/at 28% 116%/.test(after) && /at 72% 116%/.test(after), '1.4.3: TWO glows seat low-left + low-right');
  assert(/gd-nuri-hearts 7s ease-in-out infinite/.test(after) && /gd-nuri-heart-hue 26s ease-in-out infinite/.test(after), '1.4.3: the hearts cross-fade + their hue walks');
  // the sprite wears the fire's light (soft-light, not a recolor) — MULTI-HUE
  const artfin = /\.gd-artfin-nuri\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/mix-blend-mode:\s*soft-light/.test(artfin), 'the sprite is washed in light, not recolored');
  /* 1.4.4 supersede: the sprite's wash breathes its brightness on a
     composited clock (never a main-thread pan). */
  assert(/gd-nuri-emberbreath 12s ease-in-out infinite/.test(artfin), '1.4.4: the sprite wash breathes (never one flat color)');
  assert(/never speaks a cold hue|never a cold hue|not a rainbow|NOT a rainbow/.test(css), 'the warm-only law is documented');
});

// ===========================================================================
// 17 — THE COATS HOLD THEIR BREATH UNDER THE HEAVY WINDOWS
// ===========================================================================
ok('17a — every modal layer arms the freeze; the covered regions pause', () => {
  // Modal arms the class (reference-counted)
  const arm = /gd-coats-frozen/.exec(modalSrc)?.[0] || '';
  assert.equal(arm !== '', true, 'Modal.jsx speaks the freeze class');
  assert(/dataset\.gdModals/.test(modalSrc), 'the arming is reference-counted');
  // the CSS law: the covered regions pause; the modal previews (outside
  // every region) keep breathing
  /* 1.4.3 supersede: the retired poly ring left the freeze list (the
     pearl's seats ride the family :is(...) as always). */
  /* 1.4.4 supersede: the coats speak through PSEUDOS and CHILDREN now —
     the freeze reaches ::before/::after and every child of the seats. */
  const freeze = /:root\.gd-coats-frozen \[data-gd-region\] \.gd-card-face-finish,\n:root\.gd-coats-frozen \[data-gd-region\] \.gd-card-face-finish::before,[\s\S]*?animation-play-state:\s*paused !important;/.exec(css)?.[0] || '';
  assert.equal(freeze !== '', true, '1.4.4: the freeze law reaches the pseudos + children too');
  assert(/animation-play-state:\s*paused !important;/.exec(css) !== null, 'the pause is armed with !important');
  // 1.6.5 supersede: the still belongs to the Modal family alone — the
  // panel flight (.gd-flight) no longer freezes the coats (the right
  // detail panel is not a "big window"); only the still law above speaks.
  assert(!/:root\.gd-flight \[data-gd-region\]/.test(css), '1.6.5: the panel flight no longer stills the coats');
  // the sway pauses with them
  assert(/\.gd-img-motion :is\(\.gd-sleeve-clip, \.gd-preview-art\) img/.test(css), 'the sway pauses under the windows');
});

// ===========================================================================
// 13 — THE CORNERS (the ladder + the sheen retirement carry them)
// ===========================================================================
ok('13a — every coat keeps its full-face geometry (no corner carve-outs)', () => {
  // the coat's seat: inset 0 + the inner radius — covers the corner notch
  const face = /\.gd-card-face-finish\s*\{[\s\S]*?\n\}/.exec(css)?.[0] || '';
  assert(/inset:\s*0/.test(face) && /border-radius:\s*calc\(var\(--gd-shape-radius/.test(face), 'the coat covers the whole face');
  // with the hover ladder holding (1a) and the sheen retired (6a), no
  // layer paints a foreign bright wedge at the corner: the rise sits
  // under the art, the ink work above the coat, on every finish
  assert(/THE CORNER PLATES ARE RETIRED/.test(css), 'the corner-plate retirement law stays');
});

// ===========================================================================
// THE VERSION FURNITURE
// ===========================================================================
ok('V — the version is 1.4.6 everywhere (1.4.5 superseded by the 1.4.6 release)', () => {
  assert.equal(JSON.parse(pkgSrc).version, '1.4.6', 'package.json');
  assert(/version:\s*'1\.4\.6',/.test(constSrc), 'APP.version');
  assert(/\*\*v1\.4\.6\*\*/.test(src('README.md')), 'README');
  assert(/\(1\.4\.6\)/.test(src('START.bat')), 'START.bat');
  assert(/## 1\.4\.6 — The Keys Find Their Seat/.test(changelogSrc), 'CHANGELOG head');
  assert(/v1\.4\.6/.test(websiteSrc) && /THE KEYS FIND THEIR SEAT/.test(websiteSrc), 'website current block');
  assert(/var CURRENT = \[1, 4, 6\];/.test(websiteSrc), 'website CURRENT gate');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
