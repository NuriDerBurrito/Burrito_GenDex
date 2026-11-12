import { v4 as uuidv4 } from 'uuid';

export const APP = {
  name: 'Burrito GenDex',
  version: '1.9.19',
  // 1.0.2 — the tilted ✖ is retired ("remove the x in gen "x" dex … so its
  // gendex"): one wordmark everywhere — GENDEX.
  wordmark: 'GENDEX',
  tagline: 'CARD ARCHIVE',
};

// 1.1.6 — DB_FILE_NAME / IMAGES_DIR_NAME are RETIRED ("remove deprecated
// code"): main.js owns the on-disk names (its own DB_FILE / IMAGES_PATH
// constants) and nothing in the renderer ever read these two — dead seats
// from before the IPC split.

// The virtual "Unsorted" class — default home for every character.
export const ROOT_CLASS_ID = 'root';

// ---------------------------------------------------------------------------
// Themes — 12 hand-tuned material presets. Every theme re-skins the whole
// dex, and the Manual Colors panel can override any single token on top of
// the active theme.
//
// 0.12.0 — THEMES, DESIGNED ON PRINCIPLES. Each preset is a full MATERIAL
// (palette ladder + shape language), not a recolor:
//   1. LADDER — one lightness step per role, top to bottom:
//        bg (deepest) < panel (one step up) < line < ink < panelText/chrome
//      INK (outer frames) always reads clearly STRONGER than LINE (inner
//      hairlines) against the panel; mute sits between them for recessed text.
//   2. HARMONY — accent + accent2 share one saturation family and a planned
//      hue relationship (complement or triad); accentInk is picked for >= 4.5:1
//      on the accent. No stray warm hues on cold cloth, no neon on muted cloth.
//   3. SHAPE — radius / border weight / shadow style / typeface differ per
//      theme (soft plush vs hard stencil vs hairline catalog), extended by the
//      [data-theme] structural rules in index.css (chip shape, stamp tilt,
//      dividers, corner language).
// The ladder is machine-checked (scripts/gendex_theme_contrast.test.mjs).
// ---------------------------------------------------------------------------
export const THEME_PRESETS = [
  {
    // Paper-on-ink fanzine: white ink frames, polka grit, sticker tilt.
    id: 'zine',
    name: 'Zine Punk',
    desc: 'Hard white rules, polka grit, tilted sticker badges.',
    bg: '#101014',
    chrome: '#f2f2f0',
    panel: '#1a1a1f',
    panelText: '#f2f2f0',
    ink: '#f2f2f0',
    line: '#3f3f47',
    mute: '#9a9aa4',
    accent: '#ffd400',
    accent2: '#7ecb8f',
    accentInk: '#17140a',
    radius: '2px',
    borderW: '2px',
    font: 'display',
    shadow: '4px 4px 0 rgba(0,0,0,0.55)',
    // 0.14.0 — every theme ships its own background look + corner language.
    // 0.15.0: the halftone pattern is gone — Zine's viewer wears polka
    // dots instead (sticker-sheet grit, same family).
    btnShape: 'square',
    texDefaults: { titlebar: 'none', sidebar: 'none', viewer: 'dots', panel: 'dots' },
  },
  {
    // Purple dusk made of plush: hard sticker corners, gold highlights.
    // 0.33.0 — SQUARE EVERYWHERE ("fix the burrito theme where soem areas
    // are square and some arent, as it shouldnt be rounded"): the radius
    // drops from the old plush 10px to a hard 0, so the sticker look holds
    // on every surface — cards, chips, inputs, windows — with no stray
    // rounded corners breaking the language (the structural [data-theme]
    // overrides in index.css dropped their round radii to 0 with it).
    id: 'burrito',
    name: 'Burrito',
    desc: 'Plush purple dusk: hard square corners, gold highlights.',
    bg: '#120c1d',
    chrome: '#ece5f4',
    panel: '#1c1330',
    panelText: '#efeaf8',
    ink: '#8f78c4',
    line: '#4a3970',
    mute: '#a89bce',
    accent: '#f2c94c',
    accent2: '#7ecb8f',
    accentInk: '#221607',
    radius: '0px',
    borderW: '2px',
    font: 'display',
    shadow: '0 6px 18px rgba(18,10,38,0.55)',
    // 0.14.0 — the sticker look returns: SQUARE corners, stamps tilted 5deg.
    // 0.33.0 — the paper look swaps for a party look ("burrito theme should
    // have toolbar as none, and card viewer as confetti"): a CLEAN toolbar,
    // CONFETTI raining over the card viewer; the tree keeps its graph
    // paper and the panel its blueprint grid.
    btnShape: 'square',
    texDefaults: { titlebar: 'none', sidebar: 'graph', viewer: 'confetti', panel: 'grid' },
  },
  {
    // Museum catalog: ivory paper, hairline rules, serif headers, no tilt.
    id: 'archive',
    name: 'Archive Ivory',
    desc: 'Museum-catalog ivory, hairline rules, serif headings.',
    bg: '#e7dfc9',
    chrome: '#2c261b',
    panel: '#f6f0e2',
    panelText: '#2c261b',
    ink: '#2c261b',
    line: '#c3b795',
    mute: '#7a7057',
    accent: '#7a2e2e',
    accent2: '#4a7c59',
    accentInk: '#f6f0e2',
    radius: '0px',
    borderW: '1px',
    font: 'serif',
    shadow: '0 1px 3px rgba(44,38,27,0.28)',
    btnShape: 'square',
    texDefaults: { titlebar: 'none', sidebar: 'none', viewer: 'none', panel: 'lines' },
  },
  {
    // Machined steel panels, stencil squared edges, signal-orange stamp.
    id: 'carbon',
    name: 'Carbon',
    desc: 'Machined steel panels with a signal-orange stamp.',
    bg: '#0e1012',
    chrome: '#e6e8eb',
    panel: '#1c1f24',
    panelText: '#e6e8eb',
    ink: '#5c6670',
    line: '#333a41',
    mute: '#8d95a0',
    accent: '#ff5a1f',
    accent2: '#57c785',
    accentInk: '#170f0a',
    radius: '3px',
    borderW: '1px',
    font: 'mono',
    shadow: '3px 3px 0 rgba(0,0,0,0.5)',
    btnShape: 'square',
    // 1.2.1 — THE TOOLBAR STARTS CLEAN IN EVERY THEME ("the top toolbar
    // in all themes should start as none"): Carbon used to be one of the
    // two seats that landed its cloth on the bar (blueprint). The bar
    // stays clean now — the machined pattern lives on in the viewer and
    // the panel, where it always read best.
    texDefaults: { titlebar: 'none', sidebar: 'none', viewer: 'grid', panel: 'hatch' },
  },
  {
    // Forest hollow: very rounded leaves, pill chips, soft floating shadow.
    id: 'moss',
    name: 'Moss',
    desc: 'Deep forest greens, pill badges, softly floating cards.',
    bg: '#0f1308',
    chrome: '#e6ead9',
    panel: '#1e2913',
    panelText: '#e8ecd9',
    ink: '#5d7540',
    line: '#37452a',
    mute: '#a0af8a',
    accent: '#a3c24a',
    accent2: '#f5d36b',
    accentInk: '#161c0b',
    radius: '12px',
    borderW: '2px',
    font: 'display',
    shadow: '0 5px 16px rgba(10,16,6,0.55)',
    btnShape: 'round',
    texDefaults: { titlebar: 'none', sidebar: 'none', viewer: 'dots', panel: 'xmark' },
  },
  {
    // Hearth light: smoked oak with warm mid frames and an ember stamp.
    id: 'ember',
    name: 'Ember',
    desc: 'Smoked browns, hearth-warm frames, ember-orange stamp.',
    bg: '#170f09',
    chrome: '#f2e6d9',
    panel: '#271a10',
    panelText: '#f4e7d8',
    ink: '#7d5433',
    line: '#46301e',
    mute: '#b09a84',
    accent: '#ff8c42',
    accent2: '#d9a441',
    accentInk: '#22130a',
    radius: '6px',
    borderW: '2px',
    font: 'display',
    shadow: '4px 4px 0 rgba(0,0,0,0.5)',
    btnShape: 'round',
    texDefaults: { titlebar: 'none', sidebar: 'none', viewer: 'hatch', panel: 'none' },
  },
  {
    // Frosted morning: cold slate, crisp thin edges, glacial cyan mark.
    // 0.34.0 — THE MAIN THEME ("mage glacier the main theme"): the app's
    // own house look — fresh databases wake up frosted instead of on the
    // old Zine fanzine cloth.
    id: 'glacier',
    name: 'Glacier',
    desc: 'Cold frosted slate, crisp hairline edges, cyan mark.',
    bg: '#0c1114',
    chrome: '#e7edf0',
    panel: '#151d22',
    panelText: '#e7eef1',
    ink: '#4f6772',
    line: '#2d3b43',
    mute: '#8798a1',
    accent: '#7fd1d8',
    accent2: '#5b8def',
    accentInk: '#0b1417',
    radius: '5px',
    borderW: '1px',
    font: 'display',
    shadow: '0 4px 14px rgba(0,10,20,0.5)',
    btnShape: 'square',
    texDefaults: { titlebar: 'none', sidebar: 'graph', viewer: 'grid', panel: 'none' },
  },
  {
    // 1.1.6 — COBALT (was Ghost Mono): "rework ghost mono theme, maybe it
    // should be a blue theme, since there is too many grey themes right
    // now". The monochrome ladder is retired — the same seat now speaks a
    // DEEP NAVY material: a near-black blue workspace, indigo panels, a
    // mid-blue frame ladder, a vivid sky-blue mark and a warm gold second
    // voice (blue's classic complement), all on the same quiet no-pattern
    // cloth the monochrome wore. The ID stays 'ghost' so every database
    // that selected the old seat wakes up on the new blue one — the
    // rework is a reskin of the same theme, not a removal.
    id: 'ghost',
    name: 'Cobalt',
    desc: 'Deep navy blues with a sky-blue mark and gold second voice.',
    bg: '#0a0f1e',
    chrome: '#e8edf8',
    panel: '#141d36',
    panelText: '#e8edf8',
    ink: '#5d78ad',
    line: '#2b3c63',
    mute: '#93a5cc',
    accent: '#4d8dff',
    accent2: '#ffd166',
    accentInk: '#0b1428',
    radius: '4px',
    borderW: '1px',
    font: 'display',
    shadow: '3px 3px 0 rgba(0,0,0,0.4)',
    // The quiet cloth keeps its minimalism: no pattern anywhere.
    btnShape: 'square',
    texDefaults: { titlebar: 'none', sidebar: 'none', viewer: 'none', panel: 'none' },
  },
  {
    // 0.13.0 — the craft table: kraft paper, washi tape, dashed cut lines.
    // 0.42.0 — RENAMED ("rename bastel to something like muffin"): the same
    // kraft-paper look, the friendlier name.
    id: 'craft',
    name: 'Muffin',
    desc: 'Kraft-paper craft table: tape chips, cut lines.',
    bg: '#2a2119',
    chrome: '#f0e7d8',
    panel: '#3a2f23',
    panelText: '#f5ecdd',
    ink: '#a98c5f',
    line: '#564631',
    mute: '#c4ad8a',
    accent: '#f2698c',
    accent2: '#8fbf6a',
    accentInk: '#2a1620',
    radius: '10px',
    borderW: '2px',
    font: 'display',
    shadow: '4px 4px 0 rgba(0,0,0,0.4)',
    // Playful defaults: re-rolled sparkle icons on the viewer, confetti in
  // the character panel. 0.34.0 — the emoji wall is retired; the craft
  // table wears SPARKLES instead.
    btnShape: 'round',
    texDefaults: { titlebar: 'none', sidebar: 'none', viewer: 'sparkles', panel: 'confetti' },
  },
  {
    // 0.13.0 — clean stationery: warm paper, red-pen stamp, ruled hairlines.
    id: 'paper',
    name: 'Paper',
    desc: 'Clean stationery: graph-paper body, red-pen stamp.',
    bg: '#efeae0',
    chrome: '#262626',
    panel: '#faf7f0',
    panelText: '#262626',
    ink: '#262626',
    line: '#d8d2c4',
    mute: '#6b675c',
    accent: '#c9402f',
    accent2: '#3d6bd9',
    accentInk: '#fdf9f2',
    radius: '3px',
    borderW: '1px',
    font: 'serif',
    shadow: '0 1px 3px rgba(38,38,38,0.18)',
    btnShape: 'square',
    texDefaults: { titlebar: 'none', sidebar: 'none', viewer: 'graph', panel: 'lines' },
  },
  {
    // 1.1.6 — CRIMSON (was Metallic): "rework metallic to be a red theme,
    // since there is too many grey themes right now". The brushed-steel
    // greys are retired — the seat now speaks a FORGED CRIMSON material:
    // a deep maroon-black workspace, oxblood panels, a mid-maroon frame
    // ladder, a vivid ember-red mark and a cool teal second voice (red's
    // complement), keeping the industrial hatched cloth and squared edges
    // the steel wore. The ID stays 'metal' so every database that selected
    // the old seat wakes up on the new red one.
    id: 'metal',
    name: 'Crimson',
    desc: 'Forged crimson panels, squared edges, ember-red mark.',
    bg: '#150c10',
    chrome: '#f4e7ea',
    panel: '#26141a',
    panelText: '#f4e7ea',
    ink: '#96525e',
    line: '#4a2830',
    mute: '#c09098',
    accent: '#ff4d5e',
    accent2: '#45c4a0',
    accentInk: '#2a0a10',
    radius: '2px',
    borderW: '2px',
    font: 'display',
    shadow: '2px 2px 0 rgba(0,0,0,0.55)',
    btnShape: 'square',
    // 1.2.1 — THE TOOLBAR STARTS CLEAN IN EVERY THEME: Crimson was the
    // other seat that landed its cloth on the bar (hatch). The bar stays
    // clean now; the forge keeps its hatched cloth on the viewer and the
    // panel (and a database still carrying the old landing wakes up clean
    // — see the pair check in createSafeDb).
    texDefaults: { titlebar: 'none', sidebar: 'none', viewer: 'grid', panel: 'hatch' },
  },
  {
    // 0.13.0 — MUMEI. 0.19.0 — REDONE from the reference: WHITE first
    // (soft white paper workspace + pure white panels), CYAN second (deep
    // cyan frames, pale cyan hairlines, vivid cyan accent) and BLACK the
    // least — near-black only for text and the tiniest marks, never a
    // significant surface. The old all-cyan ladder (cyan sky + cyan ink +
    // cyan line + cyan accent) was why everything blended together;
    // splitting the roles across three inks keeps every surface separate.
    // userPalette = the hexes are EXACT — the theme ladder test pins them
    // to this table instead of the generic rules.
    // 1.6.4 — THE THEME SIGNS ITS NEW NAME ("the mumeix theme should be
    // renamed to 'numeix' too"): the id walks with the name for the first
    // time (mumei → numeix) — every lane that reads a stored theme id
    // carries the migration (createSafeDb for the database, applyThemeTokens
    // for the boot snapshot, the splash's peek map), so no saved seat is
    // ever left homeless.
    id: 'numeix',
    name: 'Numeix',
    desc: 'White & cyan idol paper: brushstroke stamps, black mark.',
    bg: '#E7F5F9',
    chrome: '#101519',
    panel: '#FFFFFF',
    panelText: '#15191E',
    ink: '#0E5E75',
    line: '#BCE3ED',
    mute: '#52707E',
    accent: '#15B2CF',
    accent2: '#101820',
    accentInk: '#FFFFFF',
    radius: '8px',
    borderW: '2px',
    font: 'display',
    shadow: '0 4px 14px rgba(16,21,25,0.16)',
    userPalette: true,
    texTint: '#2FB9D6',
    texAlpha: 0.22,
    // 0.19.0 — the cloud drift and cloud patterns left with the living
    // background removal; the look is clean white paper. 0.20.0 — the
    // RIGHT PANEL wears the X pattern (the wordmark's tilted-X motif,
    // cyan-tinted): the panel is the busy side, the viewer keeps its
    // whisper of polka dots.
    btnShape: 'round',
    texDefaults: { titlebar: 'none', sidebar: 'none', viewer: 'dots', panel: 'xmark' },
  },
];

// 0.42.0 — THE FONT SETTING (Settings → Look → FONT): the app's BODY
// typeface. The three faces the app ships (@fontsource) — the classic mono,
// the display grotesk and the serif — pickable on every theme; display text
// (titles, card names) keeps following the THEME's own font token, so a
// theme's character survives a body swap. Stored as settings.uiFont.
// 0.48.0 — THE CUSTOM SEAT IS RETIRED ("remove the custom font option"):
// the imported-face fourth seat (0.43.0) is gone — the three shipped faces
// are the whole ladder; old databases holding uiFont 'custom' sanitize back
// to the default mono on load.
export const BODY_FONT_OPTIONS = [
  { id: 'mono', label: 'Mono' },
  { id: 'grotesk', label: 'Grotesk' },
  { id: 'serif', label: 'Serif' },
];

// Elements tweakable from Settings → Appearance → Manual Colors.
export const COLORABLE_ELEMENTS = [
  { key: 'bg', label: 'Workspace background' },
  { key: 'chrome', label: 'Workspace text' },
  { key: 'panel', label: 'Panels & cards' },
  { key: 'panelText', label: 'Text on panels' },
  { key: 'ink', label: 'Ink & borders' },
  { key: 'line', label: 'Divider lines' },
  { key: 'mute', label: 'Muted text' },
  { key: 'accent', label: 'Accent / stamp' },
  { key: 'accent2', label: 'Secondary accent (checks)' },
  { key: 'accentInk', label: 'Text on accent' },
];

// Background texture patterns (0.13.0 — per surface, applied on top of any
// theme). CSS-gradient patterns plus SVG-tile patterns; every theme ships
// its own set (texDefaults) — picking a theme lands its patterns in the
// same step.
// 0.15.0: 'halftone' REMOVED by request. 0.19.0: 'clouds' REMOVED with the
// cloud theme. 0.26.0 — 'waves' and 'bauhaus' are REMOVED by request (old
// databases sanitize them away — helpers falls back to the shipped default
// per surface). 0.34.0 — 'emojis' RETIRED for 'sparkles' (see below); old
// databases migrate onto the survivor while sanitizing.
export const TEXTURES = [
  { id: 'none', label: 'None' },
  { id: 'dots', label: 'Polka Dots' },
  // 0.15.0: 'halftone' REMOVED by request. Old databases sanitize it away
  // (helpers falls back to the shipped default per surface).
  { id: 'grid', label: 'Blueprint' },
  { id: 'graph', label: 'Graph Paper' },
  { id: 'lines', label: 'Scanlines' },
  { id: 'hatch', label: 'Hatch' },
  { id: 'crosshatch', label: 'Crosshatch' },
  { id: 'plus', label: 'Plus Grid' },
  { id: 'confetti', label: 'Confetti' },
  // 0.34.0 — 'emojis' is RETIRED ("at this point just delete the emojies
  // pattern, replace it with a pattern that works better") — a pattern that
  // leans on the system's emoji FONT can never be trusted (missing glyphs
  // paint as nothing, per-font metrics mis-size, color fonts ignore the
  // tint). Its slot goes to SPARKLES — the emoji wall's *idea* (a big,
  // truly random scatter of little icons) redrawn as pure SVG four-point
  // stars: no font in the pipeline, every mark always paints, still re-rolled
  // every launch. Old 'charms' / 'shuffle' / 'emojis' databases migrate onto
  // it (helpers renames the ids while sanitizing).
  { id: 'sparkles', label: 'Sparkles' },
  { id: 'xmark', label: 'X Marks' },
  // 0.27.0 — 'chevron': a zigzag arrow-walk wallpaper. The picker row used
  // to end one swatch short (11 patterns, 6 per row); the twelfth fills it.
  { id: 'chevron', label: 'Chevrons' },
];

// The surfaces that each carry their OWN texture (Settings -> Look ->
// BACKGROUND TEXTURE). Splitting them keeps the app from reading as one
// blended sheet: the toolbar can stay clean while the tree wears dots.
// 0.26.0 — every surface carries a lucide ICON that REPRESENTS it in the
// settings picker (the old bare texture dots read as anonymous squares —
// you had to read the label to know which area you were dressing):
//   top toolbar → PanelTop (a bar across the window's top)
//   left tree   → FolderTree (the class tree's own branches)
//   card viewer → LayoutGrid (the grid of collector cards)
//   right panel → PanelRight (the docked detail panel)
export const TEX_SURFACES = [
  { id: 'titlebar', label: 'Top Toolbar', icon: 'PanelTop' },
  { id: 'sidebar', label: 'Left Tree', icon: 'FolderTree' },
  { id: 'viewer', label: 'Card Viewer', icon: 'LayoutGrid' },
  { id: 'panel', label: 'Right Panel', icon: 'PanelRight' },
];

// SHAPE STYLE (0.15.0 — renamed from "button shape"; it now drives the
// corner language of CARDS, the version container, buttons, chips, inputs
// and most framed surfaces — not just buttons). 'theme' follows the active
// theme's own corner language (rounded for Numei & the soft family, squared
// for Burrito's sticker look); 'square' and 'round' force it. Theme-owned
// hand-drawn outlines (Numei's painted chip rims) keep winning — the shape
// setting only rewrites the geometric radii.
export const BUTTON_STYLES = [
  { id: 'theme', label: 'Theme' },
  { id: 'square', label: 'Square' },
  { id: 'round', label: 'Rounded' },
];

// ---------------------------------------------------------------------------
// LIVING BACKGROUND — GONE (0.19.0, by request: "remove cloud theme and
// animated backgrounds in general"). The whole system is deleted: the
// canvas painter, the mode settings, the theme recommended looks and every
// CSS layer that carried it. Old databases lose their stored mode keys in
// createSafeDb — the workspace is always still now.
// ---------------------------------------------------------------------------

// Tag ribbon end trims.
// 1.0.8 — TWO MORE JOIN THE FAMILY (user request: "end trims for the tags,
// add 2 more, one should be like a square but ends as a triangle at the
// bottom, and the other should be thin but then be a circle at the bottom
// with the icon inside of it"):
//   point — SQUARE BODY, POINTED FOOT: the ribbon keeps its full square
//           width for the top two-thirds, then both sides converge to a
//           single point at the bottom center — a lance tip of a bookmark.
//   bead  — THIN STRIP, ROUND FOOT: the ribbon narrows to a thin stem and
//           ends in a full-width CIRCLE at the bottom — and the icon rides
//           INSIDE that circle instead of near the top (the circle is the
//           glyph's seat; a bead tag without an icon shows the empty bead).
export const TAG_TRIMS = [
  { id: 'straight', label: 'Straight' },
  { id: 'v', label: 'V Cut' },
  { id: 'notch', label: 'Inverted V' },
  { id: 'point', label: 'Point' },
  { id: 'bead', label: 'Bead' },
];

// ---------------------------------------------------------------------------
// Card trims — decorative frames drawn around/inside the card's image area.
// 0.15.0 — the four flat rules are gone (Solid Line, Perforation, Edge Ring,
// Wide Ring: they read as barely-there boxes). What remains is either
// characterful or BOLD: the dashed sleeve hairline (the default), the double
// rule, the bold frame, the ledger lines — plus three NEW frames:
//   frame   — PICTURE FRAME: thick outer rail + inner bevel rule, corner
//             blocks — reads like a framed print.
//   gallery — GALLERY CORNERS: four heavy L-brackets, like photo-corner
//             mounts. Maximum visibility, minimum coverage.
//   scallop — SCALLOPED EDGE: a lace of half-circles running along all four
//             edges. Decorative, reads clearly on every theme.
// 0.18.0 — three ENGRAVED trims join the family (user request: detailed,
// shaded, textured — the flat line rules stay as they are):
//   gold    — GOLD ENGRAVING: a cast-gold band with directional shading,
//             engraved crosshatch, bright/dark bevel hairlines and a corner
//             medallion over each joint. Real gold palette — gold only
//             reads as gold.
//   vine    — VINE ENGRAVING: a living laurel border — twin staggered rows
//             of shaded leaves clinging to a stem line, a larger leaf
//             breaking each corner. The greens lean toward the theme's ink
//             so the foliage stays in the card's family.
// 0.28.0 — THE ROPE BRAID IS RETIRED TOO ("rope praid is still offsetted
//   wrong, replace it with something else and rework it, since its always
//   offset or not aligned correctly": the 45-degree twist stripes march
//   along each edge and can never meet the corners on the same phase — the
//   same disease the scale mail had). Its slot goes to BEADS — a BEADED
//   CHAIN frame: a slim strung band per edge (two hairline rails, a fine
//   cord line, and a repeating row of shaded PEARLS — big, small, big,
//   small — every tile identical and axis-aligned, so there is nothing
//   left to drift), capped with a larger shaded corner bead. Old 'scales'
//   AND 'rope' databases migrate onto 'beads'.
// 0.19.0 — one new frame joins (user request), and every engraved frame
// now HUGS the card's border (the old 3–4px insets made them read as
// floating in the middle of the art):
//   rivet   — RIVETED BAND: a steel band of rivets — every rivet shaded
//             with its own specular dot + dark rim, a hairline rail under
//             the row, and a corner plate with four rivets capping each
//             joint. Ink-toned steel, reads on every theme.
// Rendered by the .gd-trim-* CSS classes on an overlay inside the image box;
// trim ink now runs at higher opacity (see --trim-c / --trim-c-strong).
// ---------------------------------------------------------------------------
export const CARD_TRIMS = [
  { id: 'none', label: 'No Trim' },
  { id: 'dash', label: 'Dashed Line' },
  { id: 'double', label: 'Double Rule' },
  { id: 'bold', label: 'Bold Frame' },
  { id: 'ledger', label: 'Ledger Lines' },
  { id: 'frame', label: 'Picture Frame' },
  { id: 'gallery', label: 'Gallery Corners' },
  { id: 'scallop', label: 'Scalloped' },
  { id: 'gold', label: 'Gold Engraving' },
  { id: 'vine', label: 'Vine Engraving' },
  { id: 'beads', label: 'Beaded Chain' },
  { id: 'rivet', label: 'Riveted Band' },
];
export const DEFAULT_CARD_TRIM = 'dash';

// 1.3.8 — THE CARD'S OWN LOOKS (the "for fun" pass): a FINISH (a surface
// coat: chromatic / foil / holographic / prismatic, with an AFFECTS IMAGE
// switch) riding the character's card object beside the color, speaking
// on every card surface (the grid card, the look editor's preview, the
// compact preview).
// 1.3.9 — THE SECONDARY COLOR AND THE PATTERN ARE RETIRED ("remove
// secondary color and pattern option"): the pattern's ink and the eleven
// prints left with the request — the finish keeps its seat, and every
// pattern seat (the constants, the layers, the windows' rows, the CSS
// prints) is gone from the app. A card saved with 1.3.8 patterns simply
// loses the print on load (the sanitizer drops the fields).
// 1.4.0 — THE FOUR COATS ARE SHADERS NOW ("each of them should be like a
// shader"): foil keeps its name, prismatic keeps its name, holographic
// keeps its name — and CHROMATIC leaves for the pour coat that replaced it.
// 1.4.1 — THE FIFTH COAT ARRIVES: NURI, the ember ("add one last finisher
// called Nuri, that finish should be as cool as the ones i liked,
// improvise and surprise me with its effects and uniqueness"): obsidian +
// molten glow + rising sparks on a strictly WARM hue band.
// The AFFECTS IMAGE family also gains the IMAGE MOTION switch (the card's
// own field below) — the sprite sways on a slow clock, auto-zoomed just
// enough to keep the sway inside the clip.
// 1.4.3 — POLYCHROME LEAVES FOR OPALESCENT ("remove polychrome, replace it
// with Opalescent, ensure finishes dont extend beyond the edges of the
// card"): the liquid spectrum is retired; the pearl takes its seat — a
// milky, translucent pastel shimmer (soft pinks, mint greens, pale
// lavenders) with fine diagonal wave-like refraction streaks shifting in
// brightness for a glossy mother-of-pearl sheen. The coat's one law the
// pour never spoke: NOTHING extends beyond the card's edges (the coat's
// seat clips at its own rounded frame). Saved polychrome AND chromatic
// cards migrate onto opalescent at load (the map below), so every old coat
// keeps a living finish. The IMAGE MOTION sway halves too (±1.5% — "the
// image motion goes too high/too low, half the distance").
// 1.4.8 — THE PEARL LEAVES FOR MUMEI ("remove opaulescent, instead lets add
// a new finish instead and call it mumei, surprise me, make them as
// impressive as the remaining finishes"): the noise-map pearl retires
// outright; MUMEI takes the seat — the nameless ink (a living ink-wash:
// parchment tint + flowing sepia streams + drifting feathers + the owl's
// breathing moon-halo — see .gd-finish-numeix in index.css).
// 1.4.9 — THE INK SIGNS ITS X ("change mumei to instead have the wavy lines
// and feathers more see through, alongside replacing the feathers with
// 'x', and add stars" + "chnage instances of mumei to 'mumeix'"): the
// sixth coat keeps its seat and its name gains the X — MUMEIX, the same
// nameless ink one breath lighter: the streams and the falling marks
// step down to veils, the quills leave (X marks drift in their place —
// the anonymous signature, no name, just the cross it signs with) and a
// quiet gold star field joins the wash. Every saved mumei card migrates
// onto mumeix at load (the map below — one living coat, no card left
// bare).
// 1.5.0 — THE INK STEPS INTO THE SUN ("remove the big wavy lines in the
// front, keep the thin ones in the back" + "stylize the x's and add an
// animation to them, they're currently stationary" + "remove the white
// card mask, replace it with a dappled sunlight effect"): the cream
// parchment wash (the white mask) retires for a whisper of paper grain,
// DAPPLED SUNLIGHT takes its seat, the broad front rivers leave and the
// X marks finally fall (their keyframes were never defined — see
// .gd-finish-numeix in index.css).
// 1.4.9 — KINTSUGI JOINS THE LADDER ("after foil finish, add a surprise
// finish for me, up to u to call it and make it whatever") — retired in
// 1.5.0 ("kintsugi had no animation and the name is too long, remove it
// and make a new one with a shorter name and normal animations"): AURIC
// takes the seventh seat — the living gold (honey wash + flowing
// currents + falling twinkling flakes + a gloss sweep every 8s — see
// .gd-finish-auric in index.css). Every saved kintsugi card migrates
// onto auric at load (the map below).
export const CARD_FINISHES = [
  { id: 'none', label: 'None' },
  { id: 'numeix', label: 'Numeix' },
  { id: 'foil', label: 'Foil' },
  { id: 'auric', label: 'Auric' },
  { id: 'holographic', label: 'Holographic' },
  { id: 'prismatic', label: 'Prismatic' },
  { id: 'nuri', label: 'Nuri' },
];
export const DEFAULT_CARD_FINISH = 'none';
// 1.9.5 — THE COAT'S OWN VOLUME ("finish effects are a bit too clear now
// on the cards like prismatic effects and such, you may add also a
// transparency slider for the finishes in order to control it, add that
// slider in the card creation window and card edit window"): the coat's
// clarity is a knob on the card itself — 0 paints the full coat (every
// word the material ever spoke), 1 retires it to clear glass. The default
// answers the report's own complaint: 15% transparency — the coat a bit
// softer than the 1.9.4 voice, one slider-move from either extreme.
export const DEFAULT_FINISH_TRANSPARENCY = 0.15;
export const normalizeFinishTransparency = (v) =>
  Number.isFinite(+v) ? Math.min(1, Math.max(0, +v)) : DEFAULT_FINISH_TRANSPARENCY;
/* 1.9.6 — THE SPLIT VOLUME'S OWN DEFAULT ("add a checkbox that adds
   another transparency slider, but this slider affects the transparency
   of teh finishes on the image itself"): the image knob is born at the
   same 15% the main knob speaks — arming the split changes nothing until
   the second slider moves (what you see is what you had, then it's
   yours). */
export const normalizeFinishSplit = (v) => v === true;
// 1.4.3 — the legacy seats (chromatic 1.3.8, polychrome 1.4.0) both map
// onto opalescent: one pearl, and every saved coat keeps breathing.
// 1.4.8 — opalescent itself joins the map (onto mumei): three retired
// coats, one road, every card that ever spoke a finish keeps one.
// 1.4.9 — mumei walks the same road onto mumeix (the rename's own
// migration): four retired names, one living ink.
// 1.5.0 — kintsugi joins the road onto auric (the seventh coat's own
// migration): five retired names, and the gold keeps moving.
// 1.6.4 — mumeix itself joins the road onto NUMEIX (the second rename's
// own migration — "the mumeix finish should be renamed to 'numeix'
// instead"): six retired names, one living ink, no card left bare.
export const migrateCardFinish = (v) =>
  v === 'chromatic' || v === 'polychrome' || v === 'opalescent' || v === 'mumei' || v === 'mumeix'
    ? 'numeix'
    : v === 'kintsugi'
      ? 'auric'
      : v;
export const isCardFinish = (v) => CARD_FINISHES.some((f) => f.id === migrateCardFinish(v));
// The card-look fields, normalized (one voice for the editors + renderers:
// junk falls to the defaults, an undefined switch falls to OFF).
// 1.3.9 — the color2 / pattern / patternOnImage rails left with the
// feature; the sanitizer drops them from any saved card that carries them.
// 1.4.1 — imageMotion joins the rails (the sway switch beside the
// affect-the-image one).
// 1.4.5 — finishOnTrim + finishOnStamp join the rails ("add trim effect
// next to image effect and image motion, which will make the finish apply
// above the trim" + "add option to effect stamp too, where finishes would
// effect the stamp if checked"): two more switches in the finish's own
// family — the coat rides ABOVE the trim ring while onTrim is on, and
// ABOVE the stamps while onStamp is on. Junk falls to OFF, a saved card
// keeps its own law.
export const sanitizeCardLook = (card = {}) => ({
  finish: isCardFinish(card.finish) ? migrateCardFinish(card.finish) : DEFAULT_CARD_FINISH,
  finishOnImage: card.finishOnImage === true,
  // 1.9.5 — the coat's own volume joins the rails (the slider's law —
  // see DEFAULT_FINISH_TRANSPARENCY): junk falls to the softened default,
  // a saved card keeps its own knob.
  finishTransparency: normalizeFinishTransparency(card.finishTransparency),
  // 1.9.6 — the split volume joins the rails (the checkbox + the image
  // knob's own law): the split falls to OFF, the image knob falls to the
  // shared default, and a saved card keeps both of its own words.
  finishSplitImage: normalizeFinishSplit(card.finishSplitImage),
  finishImageTransparency: normalizeFinishTransparency(card.finishImageTransparency),
  finishOnTrim: card.finishOnTrim === true,
  finishOnStamp: card.finishOnStamp === true,
  imageMotion: card.imageMotion === true,
  // 1.4.7 — STAMP MOTION joins the rails ("add stamp motion too, which
  // when checked will move the stamp alongside the image with a slight
  // delay"): the band + the placed stickers follow the image's sway a
  // beat behind it. Junk falls to OFF, a saved card keeps its own law.
  stampMotion: card.stampMotion === true,
});

// Card aspect ratio presets (custom allowed via inputs).
export const RATIO_PRESETS = [
  { label: '3:4', w: 3, h: 4 },
  { label: '4:7', w: 4, h: 7 },
  { label: '2:3', w: 2, h: 3 },
  { label: '4:5', w: 4, h: 5 },
  { label: '1:1', w: 1, h: 1 },
  { label: '16:10', w: 16, h: 10 },
];

// ---------------------------------------------------------------------------
// Version chip colors (also used to auto-color new tags)
// ---------------------------------------------------------------------------
export const CHIP_COLORS = [
  '#c8402f',
  '#ff8c42',
  '#ffd400',
  '#a3c24a',
  '#2f9e77',
  '#7fd1d8',
  '#5b8def',
  '#9d4edd',
  '#ff3df5',
  '#f5d36b',
  '#9aa0a6',
  '#f2ead9',
];

// 0.38.0 — PRESET COLORS for the CLASS picker ("add preset colors for the
// class colors"): a curated ladder that reads as a WASH — every hex keeps
// names, counts and icons legible when mixed into the panel (the wash is
// always a color-mix, so even the loudest shade stays tame). Shared with the
// CARD color picker ("add the option to color the card itself").
export const CLASS_COLOR_PRESETS = [
  '#c8402f',
  '#ff8c42',
  '#ffd400',
  '#a3c24a',
  '#2f9e77',
  '#7fd1d8',
  '#5b8def',
  '#3d6bd9',
  '#9d4edd',
  '#ff3df5',
  '#f5d36b',
  '#9aa0a6',
];

// ---------------------------------------------------------------------------
// Lucide icon palette for version chips. Names only — the component map lives
// in LucideIconPicker.jsx so pure-logic tests never import React components.
// ---------------------------------------------------------------------------
export const ICON_GROUPS = [
  {
    label: 'Marks',
    list: ['Star', 'Heart', 'Flame', 'Sparkles', 'Zap', 'Moon', 'Sun', 'Cloud', 'Snowflake', 'Droplets', 'Bomb', 'Rainbow', 'Skull', 'Ghost', 'Eye'],
  },
  {
    label: 'Nature',
    list: ['Leaf', 'Flower', 'Flower2', 'TreePine', 'Cat', 'Dog', 'Rabbit', 'Fish', 'Bird', 'Bug', 'Turtle', 'Snail', 'Squirrel', 'PawPrint'],
  },
  {
    label: 'Faces',
    list: ['Smile', 'Angry', 'Frown', 'Laugh', 'User', 'Users', 'Bot'],
  },
  {
    label: 'Regalia',
    list: ['Crown', 'Gem', 'Key', 'Lock', 'Sword', 'Swords', 'Shield', 'Axe', 'Target', 'Crosshair', 'Flag', 'Trophy'],
  },
  {
    label: 'Objects',
    list: ['Gift', 'Wand', 'Wand2', 'Shirt', 'Glasses', 'Scissors', 'Hammer', 'Brush', 'Palette', 'Camera', 'Music', 'Headphones', 'Gamepad2', 'Dices', 'Puzzle', 'Book', 'Bookmark', 'Map', 'Compass', 'Package', 'Bell', 'Pin', 'Anchor'],
  },
  {
    label: 'Snacks',
    list: ['Cherry', 'Citrus', 'Apple', 'Banana', 'Cake', 'CupSoda', 'Coffee', 'Candy', 'Pizza', 'Cookie'],
  },
  {
    label: 'Shapes',
    list: ['Circle', 'Hexagon', 'Triangle', 'Square', 'Diamond', 'Octagon', 'Pentagon'],
  },
];

const ICON_NAMES = new Set(ICON_GROUPS.flatMap((g) => g.list));

// ---------------------------------------------------------------------------
// Sort modes & grid zoom
// ---------------------------------------------------------------------------
export const SORT_MODES = [
  { id: 'custom', label: 'Custom Order' },
  { id: 'newest', label: 'Newest First' },
  { id: 'oldest', label: 'Oldest First' },
  { id: 'az', label: 'Name A-Z' },
  { id: 'za', label: 'Name Z-A' },
];

/* 1.6.8 — THE LADDER GREW FIVE SMALLER STEPS ("card size should not be
   1-5, should allow smaller cards too, but dont make it negative values,
   so just add more, maybe 5 more, so the current 1 will be the new 6 and
   so on"): the five-step ladder keeps every pixel it ever spoke — the
   old 1..5 are the new 6..10 (130 / 155 / 185 / 215 / 250) — and five
   SMALLER seats join below them on an even +13 climb (65 / 78 / 91 /
   104 / 117): mini-card walls, overview scales, dense archives. Nothing
   negative, nothing under 65px (the foot's type floor and the ribbons'
   clamps keep their honesty at every step). A database saved before this
   ladder has its stored zoom walked +5 exactly once at load (marked by
   settings.zoomLadder — see createSafeDb), so the PIXELS a user chose
   never move; the fresh default stays 155px (step 7 now). */
export const ZOOM_RANGE = { min: 1, max: 10, default: 7 };
// Zoom = fixed card pixel width. The masonry grid reflows columns around it,
// so cards keep their size when panels open/close; contents scale with width.
export const CARD_WIDTHS = { 1: 65, 2: 78, 3: 91, 4: 104, 5: 117, 6: 130, 7: 155, 8: 185, 9: 215, 10: 250 };
export const TAG_SCALE_RANGE = { min: 0.6, max: 2, default: 1 };
// 0.47.0 — TAG SEPARATION (px between neighboring ribbons on a card;
// negative = the classic overlap). The ribbon row CLAMPS itself to the
// card's width at render time, so a big separation can never push the tags
// past the card's edge — the slider just raises the ceiling.
export const TAG_SEPARATION_RANGE = { min: -12, max: 14, default: -8 };
// 0.47.0 — TOP TAGS: how many tag ribbons a card wears (was hard-coded 3 —
// "an option to control the number of top tags more or less than 3").
export const TAG_LIMIT_RANGE = { min: 1, max: 8, default: 3 };

// 1.9.11 — THE LEDGER'S OWN DIAL ("add an option to control how much logs
// are saved (default is 50 like usual) in the logs section in settings
// window, right below the logs container, the cell takes a numeric
// value"): how many status lines the top bar's ledger keeps — in memory,
// in localStorage, and across restarts. The whole ladder is ONE law: the
// boot's restore, every push, the settings dial and the createSafeDb
// sanitize all clamp through THIS range, so a stored choice can never
// drift outside it (junk and pre-1.9.11 databases fall to the 50 the
// ledger always spoke). The ceiling keeps localStorage honest (~999
// lines is still a sliver of the 5MB quota); the floor lets an owner who
// wants almost nothing keep almost nothing.
export const LOG_LIMIT_RANGE = { min: 1, max: 999, default: 50 };
export const clampLogLimit = (v) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return LOG_LIMIT_RANGE.default;
  return Math.min(LOG_LIMIT_RANGE.max, Math.max(LOG_LIMIT_RANGE.min, Math.round(v)));
};

// 0.29.0 — PANEL WIDTHS (px). The left tree and the right character panel
// are resizable by dragging their inner edge (cursor: ew-resize), and the
// widths live in settings — so the sliders in Settings → Behavior and the
// edge-drags commit the SAME keys and undo/redo replays them like any other
// change. Ranges are hard clamps both for the sliders and the drag handles.
export const SIDEBAR_WIDTH_RANGE = { min: 200, max: 400, default: 240 };
export const PANEL_WIDTH_RANGE = { min: 360, max: 760, default: 480 };

// 0.31.0 — THE FULL-WINDOW CARD COLUMN (the first column of the character
// view's 3-column spread: the image preview stage). Its width is live-
// resizable through the SEPARATOR between the card column and the merged
// prompt/notes column ("add a separator between the image preview and the
// prompt/notes so i can resize the separator between the two"), persisted
// like the panel widths — one setting, drag + settings, undo-able per drag.
export const CARD_COL_WIDTH_RANGE = { min: 260, max: 560, default: 360 };

export const clampCardColWidth = (v) =>
  Number.isFinite(v)
    ? Math.min(CARD_COL_WIDTH_RANGE.max, Math.max(CARD_COL_WIDTH_RANGE.min, Math.round(v)))
    : CARD_COL_WIDTH_RANGE.default;

// ---------------------------------------------------------------------------
// 0.31.0 — REASSIGNABLE SHORTCUTS ("allow me to reassign shortcuts (must be
// two combinations like ctrl s or alt f etc)"). Every app-level action key
// is a TWO-KEY COMBO: one modifier (Ctrl/Cmd or Alt — Meta maps onto Ctrl)
// plus exactly one non-modifier key, Shift allowed as a rider but never
// alone. The stored map lives in settings.shortcuts; a missing/invalid
// entry falls back to the default. The renderer normalizes any keydown
// into the same string form, so matching is a plain lookup.
// ---------------------------------------------------------------------------
export const DEFAULT_SHORTCUTS = {
  save: 'Ctrl+S',
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Y',
  newCharacter: 'Ctrl+N',
  settings: 'Ctrl+,',
  panel: 'Alt+P',
  outputBar: 'Alt+B',
  tooltips: 'Alt+T',
  // 1.8.2 — HELP TEXT JOINS THE MAP ("add a shortcut to the help text"):
  // the teaching copy's switch earns its own two-key combo — Alt+H, the
  // bar-toggle family's own row (Alt+P / Alt+B / Alt+T / Alt+H), H free
  // of every default and the Ctrl+Shift+Z alias alike. Reassignable like
  // every neighbor: the toolbar key, the roster and the keydown listener
  // all read the same live map, and an old db without the key falls back
  // to this default through the sanitize pass.
  helpText: 'Alt+H',
};

// The editable roster (Settings → Behavior → SHORTCUTS). `hint` is the
// plain-language description of what the key does.
export const SHORTCUT_ACTIONS = [
  { id: 'save', label: 'Save', hint: 'Write the database to disk now' },
  { id: 'undo', label: 'Undo', hint: 'Step back one change' },
  { id: 'redo', label: 'Redo', hint: 'Step forward one undone change' },
  { id: 'newCharacter', label: 'New card', hint: 'Open the creation window' },
  { id: 'settings', label: 'Settings', hint: 'Open the settings window' },
  { id: 'panel', label: 'Detail panel', hint: 'Right panel on / off' },
  { id: 'outputBar', label: 'Output bar', hint: 'Bottom bar on / off' },
  { id: 'tooltips', label: 'Tooltips', hint: 'Tooltip layer on / off' },
  { id: 'helpText', label: 'Help text', hint: 'Teaching paragraphs on / off' },
];

// A combo is valid when it reads Modifier(+Shift)+Key with a REAL key —
// letters, digits, punctuation and F-keys all count; bare modifiers,
// bare Shift and anything with no modifier are rejected.
const COMBO_RE = /^(Ctrl|Alt)(\+Shift)?\+(.+)$/;
export const isComboStr = (v) => typeof v === 'string' && COMBO_RE.test(v.trim());

// Normalize a keydown into the stored combo form, or null when the press
// is not a valid two-key combo (no modifier / only modifiers / dead keys).
export function comboFromEvent(e) {
  const ctrl = e.ctrlKey || e.metaKey;
  const alt = e.altKey;
  if (!ctrl && !alt) return null;
  if (e.key === 'Control' || e.key === 'Meta' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Dead') return null;
  let key = e.key;
  // Single characters store as their uppercase glyph — 's' and 'S' are the
  // same physical key, and Shift itself rides as an explicit modifier so
  // 'Ctrl+Z' and 'Ctrl+Shift+Z' stay distinct combos.
  if (key.length === 1) key = key.toUpperCase();
  const mod = ctrl ? 'Ctrl' : 'Alt';
  const rider = e.shiftKey ? '+Shift' : '';
  return `${mod}${rider}+${key}`;
}

// Render a stored combo for display: keep it compact (Ctrl+S, Alt+F,
// Ctrl+Shift+Home). Meta on macOS prints as Ctrl for parity with the stored
// form — the renderer maps Cmd onto Ctrl anyway.
// 1.1.6 — formatCombo is RETIRED ("remove deprecated code"): the tooltip
// layer composes its own combo strings where it needs them; this helper
// had no callers left.

export const clampSidebarWidth = (v) =>
  Number.isFinite(v)
    ? Math.min(SIDEBAR_WIDTH_RANGE.max, Math.max(SIDEBAR_WIDTH_RANGE.min, Math.round(v)))
    : SIDEBAR_WIDTH_RANGE.default;

export const clampPanelWidth = (v) =>
  Number.isFinite(v)
    ? Math.min(PANEL_WIDTH_RANGE.max, Math.max(PANEL_WIDTH_RANGE.min, Math.round(v)))
    : PANEL_WIDTH_RANGE.default;

// Where tag ribbons sit relative to a card (Settings → Defaults → Tag
// Position, live-applied). 'corner' pins them ON the card's art (the 0.8.0
// look); 'mark' hangs them INTO the card from the top edge — a small head
// pokes above, the body grows down the art (0.11.0 mirror).
export const TAG_POSITIONS = [
  { id: 'corner', label: 'Corner' },
  { id: 'mark', label: 'Mark' },
];

// Rich-text inline tokens for names (character / class / tag / version / part).
// Rendered by RichText; stripped for search & sorting. Formats can be mixed —
// the parser stacks ranges, so <b><g>bold and big</g></b> renders both at once.
// TAG-BASED MARKUP (0.7.0): the old single-char tokens (* / + = ^ _ ~) lived on
// keys every keyboard name uses ("a/b", "x+y", "some_name") — they ate real
// letters and fired phantom formats. Inline tags never collide with content.
export const RICH_TOKENS = {
  bold: 'b',
  italic: 'i',
  underline: 'u',
  strike: 's',
  big: 'g',
  small: 'm',
  outline: 'o',
};

// Legacy single-char token map (0.5.0–0.6.0 data) — used ONLY by the one-time
// migration in helpers.js, never by the live parser.
export const LEGACY_RICH_TOKENS = {
  bold: '*',
  italic: '/',
  underline: '+',
  strike: '=',
  big: '^',
  small: '_',
  outline: '~',
};

// ---------------------------------------------------------------------------
// Defaults & factories
// ---------------------------------------------------------------------------
export const DEFAULT_SETTINGS = {
  // 1.6.0 — ZINE PUNK IS THE MAIN THEME ("zine pink should be the default
  // theme"): the default theme + the fresh-database texture set are the
  // house look again — the paper-on-ink fanzine the app's own CSS root
  // tokens have mirrored all along (index.css's "Defaults mirror the Zine
  // Punk theme"), so a fresh install's FIRST PAINT, its splash and its
  // database all speak one cloth with no mid-boot flip. The 0.34.0 glacier
  // era ends here; every database that already selected a theme keeps it
  // exactly as saved (the past is never rewritten).
  theme: 'zine',
  colors: {},
  zoom: ZOOM_RANGE.default,
  defaultSortMode: 'custom',
  // 0.14.0 — per-surface texture ids (see TEX_SURFACES / TEXTURES). The old
  // single `texture` string migrates in createSafeDb (spread over the
  // surfaces it used to cover); the 0.13.0 `workspace` key is dropped (the
  // workspace surface is gone — each surface paints its own opaque base).
  // Fresh databases start on the ZINE PUNK look (1.6.0 — the main theme's
  // own set: a clean toolbar, a clean tree, POLKA DOTS over the card viewer
  // and the panel — the sticker-sheet grit the coat was born with).
  textures: {
    titlebar: 'none',
    sidebar: 'none',
    viewer: 'dots',
    panel: 'dots',
  },
  // 'theme' | 'square' | 'round' — square vs rounded button corners.
  // 'theme' follows the active theme's btnShape (rounded for Mumei & the
  // soft family, squared for Burrito's sticker look).
  buttonStyle: 'theme',
  // 1.6.3 — THE CARD'S OWN DIALS ("there are some inconsistant settings
  // between themes , such as some themes having dropback shadow for cards ,
  // or hovering would move either up or top left corner , etc.. or even
  // roundess ... im not asking to remove the inconsistancies , instead i
  // want you to add settings for them"): three per-card overrides, each
  // defaulting to 'theme' (the active theme's own law, exactly the look
  // every version before this painted):
  //   cardCorners — 'theme' | 'round' | 'square': the CARDS' own corner
  //     language, overriding --gd-shape-radius alone (the shape style's
  //     button half keeps its own voice — the numeix roundness, the burrito
  //     square, any theme either way);
  //   cardHover   — 'theme' | 'up' | 'corner' | 'none': the cards' hover
  //     movement (lift up, lift to the top-left corner, or stay put).
  // 1.6.4 — THE AUDIT GREW THE LADDER ("the card's shadow still has an
  // option that is inaccessible where either its a soft shadow or a sharp
  // shadow, add that option too, same with the muffin button trim
  // sometimes it has dashed lines, i want you to check each theme to see
  // what unique options they have and implement them in options"): every
  // axis the twelve themes visibly disagree on now owns a dial:
  //   cardShadow — 'theme' | 'off' | 'soft' | 'sharp': the resting drop's
  //     STYLE speaks too (the blur family — burrito / archive / moss /
  //     glacier / paper / numeix — against the hard offset family — zine /
  //     carbon / ember / ghost / muffin / crimson); the 1.6.3 'on' seat
  //     migrates onto 'soft' at load (the same look, its honest name).
  //   trimLines  — 'theme' | 'solid' | 'dashed': the cut-line family
  //     (Muffin's dashed chip trim + Carbon's dashed rules vs the solid
  //     everywhere else) — chips, buttons, rules and hairlines, one dial.
  //   stampTilt  — 'theme' | 'flat' | 'tilted': the stamp's stance (the
  //     burrito -5deg / muffin -3deg / ember -1.5deg families vs the
  //     upright seats) — any theme either way.
  cardCorners: 'theme',
  cardShadow: 'theme',
  cardHover: 'theme',
  trimLines: 'theme',
  stampTilt: 'theme',
  // 0.42.0 — the BODY typeface ('mono' | 'grotesk' | 'serif'); see
  // BODY_FONT_OPTIONS above. Display text keeps following the theme.
  uiFont: 'mono',
  detailPanel: true,
  tagScale: TAG_SCALE_RANGE.default,
  // 0.47.0 — ribbons: how many a card wears + how far apart they sit.
  tagLimit: TAG_LIMIT_RANGE.default,
  tagSeparation: TAG_SEPARATION_RANGE.default,
  // 1.7.5 — THE UNSELECTED TAGS SWITCH ("add an option in setting, when its
  // on tags that are not selected onto the card will be visible (default),
  // but when its off, the tags will be hidden if not selected, and it will
  // also make it so when pressing + tags to first open a window that shows
  // tags and allow the user to add them, then the tag manager button, but
  // when its on then it will open tag manager right away"): one switch,
  // two voices — the detail view's tags ROW (the full vocabulary on the
  // wall vs only the card's own chips) and the + TAGS key's door (the
  // manager right away vs the tag picker first, the manager inside it).
  // ON keeps the wall exactly as it always spoke it.
  showAllTags: true,
  // 1.9.11 — THE LEDGER'S OWN DIAL (see LOG_LIMIT_RANGE above): how many
  // status lines the top bar's ledger keeps. 50 is the eternal default
  // ("default is 50 like usual"); a stored choice always keeps its own
  // clamp (createSafeDb), and the LOGS tab's dial writes it live.
  logLimit: LOG_LIMIT_RANGE.default,
  cardRatio: { w: 3, h: 4 },
  // Composed-prompt bar docked to the bottom of the workspace (toggle also
  // lives in the titlebar, right next to the character-panel toggle).
  promptBottom: true,
  // Search matches character names only; with this on it also looks inside
  // prompt parts and version names. Tags are NEVER searched.
  advancedSearch: false,
  // Explanatory paragraphs under editors & settings. Off by default (clean
  // look) — flip it on if you want the helper text back.
  showHelpText: false,
  // 'corner' = ribbons pinned on the card art · 'mark' = ribbons hang into
  // the card from the top edge with a small head above (0.11.0 mirror).
  // 0.24.0 — 'mark' is the DEFAULT for fresh databases ("tags should be mark
  // by default"); a database that already stores a choice keeps it.
  tagPosition: 'mark',
  // 0.25.0 — DATA & RECOVERY. autosaveMinutes: 0 = off (the SAVE key and
  // Ctrl+S stay the only writers); 1/5/15 fires a timer that saves whenever
  // there are unsaved changes (it never saves a clean db, and it never
  // stacks with a manual save — the flag resets on both).
  // 1.1.2 — FIVE IS THE DEFAULT ("auto save make it occur every 5 mins now
  // (keep the none option still ofc)"): fresh databases start on the 5M
  // cadence — the archive keeps itself — while a stored choice always keeps
  // its own (OFF included; the picker still offers 0/1/5/15).
  autosaveMinutes: 5,
  // 0.25.0 — REDUCED UI MOTION: kills CSS animation/transition durations
  // (html.gd-reduced-motion) AND orders framer-motion to skip its entrance
  // animations (MotionConfig reducedMotion="always"). For weak GPUs and
  // motion-sensitive eyes; the OS-level prefers-reduced-motion stays
  // independent of this switch.
  reduceMotion: false,
  // 1.5.7 — LIVING FINISHES (Settings → Performance): the finish coats'
  // own master switch, OFF their own lane — distinct from reduceMotion
  // above (which stills the panel curtain and the cards' sort flights
  // too) and from the per-card image/stamp motion switches. off stamps
  // html.gd-finishes-still on the root: every material coat in the app
  // (the .gd-card-face-finish family, the artfin twin, the foil ripples)
  // holds its breath on the current frame — the MATERIALS stay (a Numeix
  // card still reads as ink, an Auric card as gold), every clock inside
  // them stops. Default ON — the coats have always breathed — and every
  // pre-1.5.7 database sanitizes to ON, so the switch changes nothing
  // until it is flipped.
  livingFinishes: true,
  // 0.29.0 — TOOLTIPS, the layer itself: on = the stylized hover pills paint;
  // off = nothing paints at all (the OS-native title boxes stay suppressed —
  // off means OFF). The titlebar carries the same switch.
  tooltips: true,
  // 0.29.0 — RESIZABLE PANELS: the left tree's and the right panel's widths
  // in px (clamped by SIDEBAR_WIDTH_RANGE / PANEL_WIDTH_RANGE). Dragging the
  // edge commits here too — one undo step per completed drag.
  sidebarWidth: SIDEBAR_WIDTH_RANGE.default,
  // 0.31.0 — the full-window character view's CARD column width (the image
  // preview stage column). Resized by dragging the SEPARATOR between it
  // and the merged prompt/notes column; same persistence story as the
  // panel widths.
  cardColWidth: CARD_COL_WIDTH_RANGE.default,
  panelWidth: PANEL_WIDTH_RANGE.default,
  // 1.1.8 — TOOLBAR FINISH IS RETIRED ("remove top bar gradient option"):
  // the toolbarGradient key left the settings with 1.1.8 — the bars wear
  // their plain surface + pattern on every theme. createSafeDb simply
  // never copies the key, so an old database carrying 'satin' or 'steel'
  // drops it on load, and theme.js sweeps any stale attribute off the
  // root element at every apply.
  // 0.30.0 — PERFORMANCE switches (Settings → Performance).
  // stageBlur: the blurred backdrop behind the image previews is pretty but
  // costs GPU on every repaint — off swaps it for a flat tint.
  stageBlur: true,
  // 1.1.9 — THE EXPANDED SEATS ("expanding a card or retracting it should
  // be a savable thing and retain"): the ids of cards sitting at double
  // size, written by App on every toggle and re-read at boot — see
  // sanitizeSettings (createSafeDb) for the load-side law.
  expandedCards: [],
  // hoverLifts: the little -1px lift on cards / buttons / slots while the
  // pointer passes over; off freezes everything at rest height.
  hoverLifts: true,
  // 1.6.7 — THE CARD SHINE FAMILY (Settings → Cards & Tags): the white
  // glare that plays over a card on hover ("the shine animation, aka the
  // white effect from top left to bottom right when i hover over a card").
  // shineOn: the family's master switch — off retires the sweep (and every
  // style below) app-wide; on is the eternal default.
  shineOn: true,
  // shineOverTrims: whether the reflection passes OVER the card's trim ink
  // (a reflection covers the print, the law the 1.6.2 rung spoke) or rides
  // UNDER it (the trim reads as ink drawn above the glare — "allow it to do
  // so over trims or not"). Default true = the 1.6.2 law unchanged.
  shineOverTrims: true,
  // shineMode: the reflection's STYLE — 'sweep' (the default: the diagonal
  // band gliding corner to corner) or 'pulse' (a soft breathing bloom
  // that swells in place — no travel at all). The 1.6.7 'glint' seat is
  // retired (1.6.8 — "remove glint from shine style"): a stored 'glint'
  // walks onto 'sweep' at load.
  shineMode: 'sweep',
  // 1.9.12 — THE PRESS DIAL ("add an option for the squish/stretch
  // animation when clicking on a card in settings, the option should allow
  // to either (squish (current) / pulse / none) with the default being none
  // (meaning also add a pulse animation)"): what a card's press speaks —
  //   · 'squish' — the 1.4.0 jelly: the card squashes wide and settles
  //     tall (620ms, the flight the grid has always flown)
  //   · 'pulse'  — the new bloom: a soft uniform swell in place, one
  //     breath, no squash (the option the report asked born)
  //   · 'none'   — silence: the press arms nothing, the card holds still
  // The DEFAULT is 'none' — the report's own word — so fresh databases
  // and every pre-1.9.12 save (the key never existed) rest silent until
  // the dial is turned. App arms data-gd-press-mode on the root; the CSS
  // keys both flights on it (see .gd-card-pulse in index.css), and the
  // grid's own arm gate reads the same attribute so 'none' never even
  // sets [data-pressed] (no flight, no lingering seat).
  cardPressAnim: 'none',
  // 1.6.8 — THE LIVE DRAG PREVIEW (Settings → Performance): ON keeps the
  // live gap — the board previews the reorder while the card flies. OFF
  // holds the board still through a card drag (the hovered card's edge
  // glow alone marks the seat, and the reorder lands with the release as
  // one animated commit).
  // 1.9.12 — THE DEFAULT FLIPS OFF ("the live drag previews option default
  // should be off"): the option was born ON because the live gap was the
  // behavior the 1.6.3 era shipped — but the still wall is the lighter
  // lane (one masonry pass at the release instead of one per previewed
  // seat), and the report asks the app to start there. Fresh databases
  // begin OFF; a stored boolean keeps its own (the house law every
  // default flip speaks — flip the switch once and it stays yours).
  liveDragPreview: false,
  // 1.6.8 — THE ZOOM LADDER MARKER: 2 = the ten-step ladder this release
  // speaks (five smaller seats below the old five). A database saved
  // without it has its stored zoom walked +5 exactly once at load (see
  // createSafeDb) so the pixels the user chose never move.
  zoomLadder: 2,
  // tooltipFollow: the hover pill re-anchors on scroll; off dismisses it
  // instead (cheapest of all).
  tooltipFollow: true,
  // 0.34.0 — AUTO-SWITCH IMAGES ("add an option in settings in performance
  // that would auto swipe the images right and left every 4 or 5 seconds"):
  // the image stage walks forward through a version's images on a calm 5s
  // cadence — paused while the pointer rests on the stage or any window is
  // open, so it never fights the reader.
  // 0.36.0 — ON BY DEFAULT ("auto switch image slides is on by default"):
  // fresh databases start walking; a stored choice always keeps its own.
  autoSwipeImages: true,
  // 0.40.0 — CENTER THE REVEALED CLASS ("when clicking on an offscreen
  // class and it moves to it , if its possible to centralize it , do so
  // … (also add an option in settings to disable that)"): clicking (or
  // creating) an offscreen class glides it toward the MIDDLE of the tree
  // on both axes — as far as the scrollable range allows; off = the
  // minimal bring-into-view scroll.
  centerClassOnReveal: true,
  // 1.3.2 — THE PREVIEW SETTINGS ARE RETIRED with the whole preview
  // system: cardThumbs and autoPreviews are gone (every cover reads the
  // record's lightest tier, every import builds its lightweight copies
  // automatically — there is nothing to configure). Old databases may
  // still carry the dead keys; createSafeDb drops them on the next save.
  // 1.3.0 — STAGED PANEL MOUNT (Settings → Performance): ON (the
  // default, the 1.2.9 law) lands the detail view's heavy rows tray in
  // its own breaths — the tags zone one frame after the first paint, the
  // stamps zone the frame after — with height placeholders standing in
  // until each lands (a skeleton seat, sized from the tray's last paint).
  // OFF mounts everything in one breath (the pre-1.2.9 behavior) for
  // machines that prefer one flat commit over the staged landing.
  stagedPanelMount: true,
  // 1.1.3 — THE UPDATE CHANNEL ("add auto update channel"): 'stable' asks
  // GitHub for the repo's latest release on launch + on demand (Settings →
  // Data → UPDATES) and speaks when a newer one exists — a read-only look,
  // never a silent download. 'off' keeps the app fully offline (no ask at
  // all, not even on boot). A database that stores a choice keeps it.
  updateChannel: 'stable',
  // 1.3.3 — THE SPLASH FILM REELS, IN THEIR OWN VOICE ("reverse the splash
  // film reel option in settings, when its on its on when its off its
  // off"): the old splashGeneratedReels switch was a performance toggle
  // wearing the reels' name — ON meant "generated pixel frames instead of
  // your cards" (reading, to the user, as the reels being NOT on) and OFF
  // meant the real covers. The key now says exactly what it does:
  // splashFilmReels, default true — ON rolls the wings' film strips with
  // the cards' own cover thumbnails, OFF mounts no reels at all (the
  // wings stay empty and no covers are read at boot — the lightweight
  // seat, one honest voice). The retired splashGeneratedReels key is
  // dropped on load (helpers' sanitizer), so no stored value survives to
  // fight the new law.
  splashFilmReels: true,
  // 0.31.0 — REASSIGNABLE SHORTCUTS: per-action combos (see
  // DEFAULT_SHORTCUTS / SHORTCUT_ACTIONS above). Edited in Settings →
  // Behavior → SHORTCUTS; missing or clashing entries fall back to the
  // defaults on load.
  shortcuts: { ...DEFAULT_SHORTCUTS },
  // 1.5.5 — THE LEGAL SEAT (see constants/legal.js): the acknowledgment
  // record the gate writes when the user accepts the terms —
  // { version, at, appVersion } — or null when the terms have not been
  // accepted (every pre-1.5.5 database, and every fresh install, starts
  // null so the gate asks exactly once per terms version).
  tosAcceptance: null,
  // 0.19.0 — LIVING BACKGROUND REMOVED: every stored mode key and color
  // override is dropped on load; the workspace is always still.
};

// 0.25.0 — the AUTOSAVE cadence picker (settings → Behavior → DATA &
// RECOVERY). id doubles as the stored minutes value.
export const AUTOSAVE_OPTIONS = [
  { id: 0, label: 'OFF', title: 'Autosave off: save with the SAVE key or Ctrl+S' },
  { id: 1, label: '1M', title: 'Save every minute while there are unsaved changes' },
  { id: 5, label: '5M', title: 'Save every 5 minutes while there are unsaved changes' },
  { id: 15, label: '15M', title: 'Save every 15 minutes while there are unsaved changes' },
];

// 1.1.3 — the UPDATE CHANNEL picker (Settings → Data → UPDATES). 'stable'
// is the live seat: one quiet ask on launch + the CHECK key whenever the
// user wants one; 'off' is full silence. The channel reads the repo's
// GitHub Releases feed — the same feed CI publishes to (see
// .github/workflows/ci.yml), so a pushed v* tag is all it takes to go live.
export const UPDATE_CHANNELS = [
  { id: 'off', label: 'OFF', title: 'Never check for updates: the app stays fully offline' },
  { id: 'stable', label: 'STABLE', title: 'Ask GitHub for a newer release on launch and on demand' },
];

// 1.1.6 — THE DOWNLOAD PAGE ("i cant see version 1.1.5 to download, often
// times its the website's issue so maybe make a simple download website page
// for me to download the new version from"): a one-file page (website/
// index.html in the repository) that lists the current release with direct
// installer + source-zip asset links, every older version, and the
// run-from-source recipe — immune to the release page's occasional
// flakiness, because each link goes straight at the asset.
// 1.8.7 — THE WEBSITE RETIRED ("delete the website folder"): the one-file
// page left the repository with the whole website/ folder — the key now
// opens the repository itself, whose Releases page carries every version's
// installer and source assets.
// 1.9.11 — THE REPOSITORY IS THE DOWNLOAD PAGE ("the download page link
// should be 'https://github.com/NuriDerBurrito/Burrito_GenDex' in the
// data section in settings window"): the key speaks the repository's own
// address — one URL, the releases live a click away, and nothing the app
// opens can ever 404 behind a site that no longer exists.
export const DOWNLOAD_PAGE_URL = 'https://github.com/NuriDerBurrito/Burrito_GenDex';

// 1.1.6 — DEFAULT_DB is RETIRED ("remove deprecated code"): the fresh-boot
// shape comes from createSafeDb(null) in helpers — the constant was a
// pre-sanitizer leftover nothing imported anymore.

// A STAMP (0.15.0) — an image (usually a transparent-background logo) shown
// faded over the bottom of a card's art. 0.22.0 — ONE flavor for everyone:
// a plain image record. The library (db.stamps) and a character's stamps
// share the same shape; two records with the same `image` are THE SAME
// stamp wherever it appears (that is what the spotlight matches on — the
// old srcId links were invisible bookkeeping that broke detection).
// IMPORTANT: stamps render from the ORIGINAL file, never the JPEG thumb —
// thumbs would fill the transparent background with black.
export const makeStamp = (image, name = '') => ({
  id: uuidv4(),
  image: String(image || ''),
  name: String(name || '').trim() || 'stamp',
  createdAt: Date.now(),
});

// 0.16.0 — STAMP COLOR: the hue a stamp's band slice is tinted with (behind
// the logo, fading toward the card's center line just like the stamp
// itself). 0.22.0 — there is NO hue switch anymore: the hue is always on.
// color === null means AUTO — the hue follows the dominant color of the
// stamp's own image (derived once per image, cached in the library record's
// autoColor). This constant is only the fallback when derivation fails
// (unreadable image) — picked to read on both light and dark themes.
export const DEFAULT_STAMP_COLOR = '#ffffff';

// 0.20.0 — the hue's OWN TRANSPARENCY. The hue paints the bottom half of the
// card, faded like the classic band; this says how strongly. The default is
// the 0.16.0 look (0.88) so existing cards read unchanged until the slider is
// touched. Junk/absent -> the default (never 0, which would fake the hue
// invisible, and never > 1). 0.22.0 — card-level (shared by every stamp on
// the card); the slider lives in the color window.
export const DEFAULT_STAMP_HUE_ALPHA = 0.88;
export const STAMP_HUE_ALPHA_RANGE = { min: 0, max: 1 };
export const sanitizeStampHueAlpha = (v) => {
  if (v === null || v === undefined || v === '') return DEFAULT_STAMP_HUE_ALPHA;
  const n = Number(v);
  if (!Number.isFinite(n)) return DEFAULT_STAMP_HUE_ALPHA;
  return Math.min(STAMP_HUE_ALPHA_RANGE.max, Math.max(STAMP_HUE_ALPHA_RANGE.min, Math.round(n * 100) / 100));
};

// 0.21.0 — the stamp art's OWN TRANSPARENCY (independent of the hue's): how
// solid the logo itself paints. 0.26.0 — the default is 0.5 ("the default
// of the stamp transparency should be 50%"): a fresh stamp reads as a
// classic translucent badge over the art instead of a solid sticker; the
// slider still runs 0.1..1 and cards that already stored an alpha are
// untouched. 0.22.0 — card-level; the slider lives in the STAMP SETTINGS
// popover (a look, not a placement — it never lifts a band stamp out of
// the band).
export const DEFAULT_STAMP_ALPHA = 0.5;
export const STAMP_ALPHA_RANGE = { min: 0.1, max: 1 };
export const sanitizeStampAlpha = (v) => {
  if (v === null || v === undefined || v === '') return DEFAULT_STAMP_ALPHA;
  const n = Number(v);
  if (!Number.isFinite(n)) return DEFAULT_STAMP_ALPHA;
  return Math.min(STAMP_ALPHA_RANGE.max, Math.max(STAMP_ALPHA_RANGE.min, Math.round(n * 100) / 100));
};

// 0.17.0 — a stamp's free-floating position: its CENTER as a percentage of
// the card's art box. Values may leave the 0..100 box on purpose (that is
// how a stamp hangs off a card's edge), but never further than the guard
// rails; anything that is not two finite numbers is the band (null).
export const STAMP_POS_RANGE = { min: -40, max: 140 };
export const sanitizeStampPos = (pos) => {
  if (!pos || typeof pos !== 'object') return null;
  const x = Number(pos.x);
  const y = Number(pos.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const clamp = (v) =>
    Math.min(STAMP_POS_RANGE.max, Math.max(STAMP_POS_RANGE.min, Math.round(v * 100) / 100));
  return { x: clamp(x), y: clamp(y) };
};

// 0.19.0 — a placed stamp's TRANSFORM: scale (a multiplier of the sticker's
// base size) and rotation (degrees). Both clamp to their rails; anything
// malformed falls back to the identity (1x / 0deg).
export const STAMP_SCALE_RANGE = { min: 0.25, max: 4 };
export const STAMP_ROT_RANGE = { min: -180, max: 180 };
// null / undefined / '' mean "unset" -> the identity (1x / 0deg); any other
// junk falls to the identity too (Number() would turn null into 0, which
// is a legal scale — so the empty values are filtered first).
export const sanitizeStampScale = (v) => {
  if (v === null || v === undefined || v === '') return 1;
  const n = Number(v);
  if (!Number.isFinite(n)) return 1;
  return Math.min(STAMP_SCALE_RANGE.max, Math.max(STAMP_SCALE_RANGE.min, Math.round(n * 100) / 100));
};
export const sanitizeStampRot = (v) => {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.min(STAMP_ROT_RANGE.max, Math.max(STAMP_ROT_RANGE.min, Math.round(n)));
};

// 0.22.0 — THE CARD'S SHARED STAMP SETTINGS. Only one stamp is visible at a
// time (stamps[0], the top one — or a spotlight-promoted one), so there is
// exactly ONE setting for hue, position, size, angle, transparency and
// clipping per CARD: whichever stamp shows wears these values. Swapping the
// top stamp keeps the look — no per-stamp bookkeeping, nothing to reset.
//   · color        — '#rrggbb' custom hue, or null = AUTO (the dominant color
//                    of the stamp's own image; see resolveStampHue)
//   · colorAlpha   — the hue's transparency (0..1, classic 0.88)
//   · alpha        — the stamp art's transparency (0.1..1, default solid)
//   · pos          — {x, y} center % of the art box, or null = the classic
//                    faded bottom band
//   · scale / rot  — the sticker's transform (multiplier / degrees)
//   · clip         — true = confined to the card (OUTSIDE off, the default);
//                    false = parts past the border show
// 0.38.0 — THE HUE LAYER ORDER ("add an option for the stamp settings for
// the stamp to be above or below the color hue"): hueOver false (default,
// the classic look) = the stamp ART paints ABOVE the hue wash; true = the
// hue wash covers the stamp art (a tint over the logo). One setting for the
// whole card, exactly like every other stamp knob.
export const DEFAULT_STAMP_SETTINGS = {
  color: null,
  colorAlpha: DEFAULT_STAMP_HUE_ALPHA,
  alpha: DEFAULT_STAMP_ALPHA,
  pos: null,
  scale: 1,
  rot: 0,
  clip: true,
  hueOver: false,
  hueOverTrim: false,
};

// Normalizes any settings-shaped object into a COMPLETE one — every field
// present, every value on its rails. Both editors and both renderers read
// through this, so an undefined clip can never disagree with what the
// switch shows again (the "toggle OUTSIDE once and nothing happens" bug:
// an undefined clip rendered as not-clipped while the switch read it as
// confined — the first click wrote the state it already looked like).
export const sanitizeStampSettings = (settings = {}) => {
  const raw = settings?.color;
  // Only a real '#rrggbb' is a CUSTOM hue; everything else (null, legacy
  // colorOn:false, junk) normalizes to null = AUTO — the dominant color of
  // the stamp's own image (0.22.0: the hue is always on).
  const color = typeof raw === 'string' && isHexColor(raw) ? raw.toLowerCase() : null;
  return {
    color,
    colorAlpha: sanitizeStampHueAlpha(settings?.colorAlpha),
    alpha: sanitizeStampAlpha(settings?.alpha),
    pos: sanitizeStampPos(settings?.pos),
    scale: sanitizeStampScale(settings?.scale),
    rot: sanitizeStampRot(settings?.rot),
    clip: settings?.clip === false ? false : true,
    hueOver: settings?.hueOver === true,
    hueOverTrim: settings?.hueOverTrim === true,
  };
};

// Card-level look: per-character ratio/trim/crop overrides. Null ratio = the
// settings default; crop is a normalized rect on the ORIGINAL image (kept
// intact — only the card preview is cropped).
// stamps: ordered array of the character's stamp images (stamps[0] = the TOP
// one — the only one visible by default; the rest sit behind it). 0.22.0 —
// records are plain image carriers {id, image, name}; every look knob lives
// in stampSettings (above) and is shared by all of them.
export const makeCharacter = (
  name,
  classId = ROOT_CLASS_ID,
  images = [],
  card = {},
  version = {},
  stamps = [],
  stampSettings = {},
  // 1.1.2 — TAGS AT BIRTH ("add adding tags to the card when creating it
  // in card creation window"): the creation window's TAGS row picks
  // existing tags (and can open the tag manager over the window to mint
  // new ones); their ids ride the character the moment it exists. Valid
  // uuid-ish strings only — anything else drops (the id must survive the
  // sanitizer's Set membership test on the other side).
  tagIds = []
) => ({
  id: uuidv4(),
  name: String(name || 'Unnamed').trim() || 'Unnamed',
  classId: classId || ROOT_CLASS_ID,
  tags: Array.isArray(tagIds) ? tagIds.filter((t) => typeof t === 'string' && t) : [],
  previewVersionId: null,
  cardRatio: card.ratio || null,
  cardTrim: card.trim || DEFAULT_CARD_TRIM,
  // 1.6.2 — THE TRIM'S OWN COLOR rides the card object with the trim (the
  // picker's seat): junk falls to null = the theme's own trim ink.
  cardTrimColor: isHexColor(card.trimColor) ? card.trimColor : null,
  cardCrop: card.crop || null,
  // 0.38.0 — CARD COLOR ("in card creation also add the option to color the
  // card itself"): an optional #rrggbb that paints the card's FOOT (the
  // name / date plate under the art). null = the theme's own foot.
  // 1.3.8 — THE CARD'S OWN LOOKS ride the same object, one field-by-field
  // law (sanitizeCardLook's rails): finish + finishOnImage (the surface
  // coat). Junk falls to the defaults, so a legacy card reads exactly
  // as it always did.
  // 1.3.9 — the color2 / pattern / patternOnImage fields left with the
  // retired feature; a saved 1.3.8 card simply drops them here.
  cardColor: isHexColor(card.color) ? card.color : null,
  cardFinish: sanitizeCardLook(card).finish,
  cardFinishOnImage: sanitizeCardLook(card).finishOnImage,
  // 1.9.5 — THE COAT'S OWN VOLUME rides the card object with the finish
  // family (the transparency knob — what the creation window slides is
  // what the card is born wearing).
  cardFinishTransparency: sanitizeCardLook(card).finishTransparency,
  // 1.9.6 — THE SPLIT VOLUME rides it too (the checkbox + the image
  // knob — one family, one field-by-field law).
  cardFinishSplitImage: sanitizeCardLook(card).finishSplitImage,
  cardFinishImageTransparency: sanitizeCardLook(card).finishImageTransparency,
  // 1.4.5 — the trim + stamp switches ride the card object with the finish
  // family (the coat's own reach, field by field).
  cardFinishOnTrim: sanitizeCardLook(card).finishOnTrim,
  cardFinishOnStamp: sanitizeCardLook(card).finishOnStamp,
  // 1.4.1 — IMAGE MOTION rides the card object with the finish family
  // (the sway switch beside affect-the-image).
  cardImageMotion: sanitizeCardLook(card).imageMotion,
  // 1.4.7 — STAMP MOTION rides it too (the stamp's trailing sway — one
  // family, one field-by-field law).
  cardStampMotion: sanitizeCardLook(card).stampMotion,
  stamps: (Array.isArray(stamps) ? stamps : []).map((s) => ({
    id: String(s.id || uuidv4()),
    image: String(s.image || ''),
    name: String(s.name || 'stamp'),
  })).filter((s) => s.image),
  stampSettings: sanitizeStampSettings(stampSettings),
  versions: [makeVersion([], images, version)],
  createdAt: Date.now(),
});

export function makeVersion(existingVersions = [], images = [], overrides = {}) {
  let max = 0;
  for (const v of existingVersions || []) {
    const m = /^v(\d+)$/i.exec(String(v?.label || '').trim());
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return {
    id: uuidv4(),
    label: String(overrides.label || '').trim() || `V${max + 1}`,
    color: isHexColor(overrides.color) ? overrides.color : null,
    icon: isValidIcon(overrides.icon) ? overrides.icon : null,
    images: [...images],
    parts: [],
    notes: String(overrides.notes || ''),
    // 1.6.7 — THE NOTES' OWN CONTAINER COLOR ("update the color picker to
    // be in corner too" — the notes container joins the parts' 1.5.2 law):
    // an optional hex that tints the notes box's frame + wash (the same
    // .is-colored voice the part rows speak); null = the theme's own
    // frame, every version before the picker painted.
    notesColor: isHexColor(overrides.notesColor) ? overrides.notesColor : null,
    createdAt: Date.now(),
  };
}

const isHexColor = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);

export const makePart = (name = '') => ({
  id: uuidv4(),
  name: String(name || 'New Part'),
  content: '',
  include: true,
  // 1.6.3 — THE PART'S OWN INK (the prompt coloring): an optional hex
  // that tints the part's row (frame + name + check accent) so a long
  // stack reads at a glance. null = the theme's own ink, every part
  // before the picker painted.
  color: null,
});

export const makeClass = (name, parentId = ROOT_CLASS_ID, icon = null, color = null) => ({
  id: uuidv4(),
  name: String(name || 'New Class').trim() || 'New Class',
  parentId: parentId || ROOT_CLASS_ID,
  icon: isValidIcon(icon) ? icon : null,
  // 0.37.0 — CLASS COLORS ("add the option to color classes"): an optional
  // hex that tints the class's own card in the tree (plate wash + ring +
  // left bar + icon) and the rail that drops from it to its children. Text
  // stays the theme's chrome — the wash is always a PANEL MIX, so names,
  // counts and icons read on it in every theme, light or dark.
  color: isHexColor(color) ? color : null,
  createdAt: Date.now(),
});

const LETTER_ICON_RE = /^letter:[A-Za-z0-9]$/;
export const isLetterIcon = (icon) => typeof icon === 'string' && LETTER_ICON_RE.test(icon);

// 1.4.3 — THE TAG'S OWN FINISH joined the record (the tag manager's
// FINISH ladder under the icon picker).
// 1.4.4 — THE FIELD IS RETIRED WITH THE MANAGER'S LADDER ("remove finishes
// from the tag manager, remove the finishes feature entirely from tag
// manager only"): makeTag ignores any finish argument it is still handed
// (the 1.4.3 call sites' shape) and writes no field — a tag is color +
// trim + icon + name, and the ribbon paints no coat.
export const makeTag = (name, color, icon = null, trim = 'straight') => ({
  id: uuidv4(),
  name: String(name || 'tag').trim() || 'tag',
  color: color || CHIP_COLORS[0],
  icon: isValidIcon(icon) ? icon : null,
  // 1.0.8 — the trim whitelist grows with the family: point + bead join
  // straight / v / notch (anything else still resolves to straight).
  trim: ['straight', 'v', 'notch', 'point', 'bead'].includes(trim) ? trim : 'straight',
});

function isValidIcon(icon) {
  return (typeof icon === 'string' && ICON_NAMES.has(icon)) || isLetterIcon(icon);
}
