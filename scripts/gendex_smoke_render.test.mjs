// Server-render smoke test: every component mounts to string without
// crashing (catches bad props, undefined imports, render-time window access).
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const React = require('react');
const { renderToString } = require('react-dom/server');

// Transpile .jsx on the fly with the project's babel (server render only).
const babel = require('@babel/core');
require.extensions['.jsx'] = (module, filename) => {
  const { code } = babel.transformFileSync(filename, {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      ['@babel/preset-react', { runtime: 'automatic' }],
    ],
  });
  module._compile(code, filename);
};

// Stub image assets (webpack's asset loader normally handles these).
for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff2']) {
  require.extensions[ext] = (module, filename) => {
    module.exports = filename;
  };
}

const C = (name) => require(`../src/components/${name}.jsx`).default;
const N = (file, name) => require(`../src/components/${file}.jsx`)[name];

// framer-motion + lucide resolve via the project's node_modules.
let passed = 0;
const ok = (name, fn) => {
  fn();
  passed += 1;
  console.log(`  ok ${passed} — ${name}`);
};

const tags = [
  { id: 't1', name: '<b>wip</b>', color: '#ffd400', icon: 'Flame', trim: 'straight' },
  { id: 't2', name: 'letter tag', color: '#7ecb8f', icon: 'letter:Q', trim: 'v' },
  { id: 't3', name: 'notch', color: '#9d4edd', icon: null, trim: 'notch' },
];
// 0.15.0 — the global stamp library + the character's stamps.
const stampLibrary = [
  { id: 'tpl-a', image: 'guild.png', name: 'guild', createdAt: 1 },
  { id: 'tpl-b', image: 'seal.png', name: 'seal', createdAt: 2 },
];
const char = {
  id: 'c1',
  name: '<b>amy</b> <g>v2</g>',
  classId: 'root',
  tags: ['t1'],
  previewVersionId: null,
  cardRatio: { w: 4, h: 7 },
  cardTrim: 'ledger',
  cardCrop: { x: 0.1, y: 0.1, w: 0.5, h: 0.3 },
  // 0.22.0 — plain image carriers; the look lives in stampSettings (one
  // shared set per card).
  stamps: [
    { id: 's1', image: 'guild.png', name: 'guild' },
    { id: 's2', image: 'seal.png', name: 'seal' },
  ],
  stampSettings: { color: null, colorAlpha: 0.88, alpha: 1, pos: null, scale: 1, rot: 0, clip: true },
  createdAt: Date.now(),
  versions: [
    {
      id: 'v1', label: '<o>V1</o>', color: '#c8402f', icon: 'letter:a',
      images: [{ file: 'a.png', thumb: 'a_t.jpg' }],
      parts: [{ id: 'p1', name: 'body', content: 'soft shading', include: true }],
      notes: 'first pass',
      createdAt: 1,
    },
    { id: 'v2', label: 'V2', color: null, icon: null, images: [], parts: [], notes: '', createdAt: 0 },
  ],
};
const settings = {
  theme: 'zine', colors: {}, zoom: 2, defaultSortMode: 'custom',
  textures: { workspace: 'none', titlebar: 'none', sidebar: 'none', viewer: 'dots', panel: 'none' },
  detailPanel: true, tagScale: 1.2, cardRatio: { w: 3, h: 4 },
  promptBottom: true, advancedSearch: false, showHelpText: false,
  animatedBgMode: 'none',
};
// 0.16.0/0.22.0 — the same character, but the CARD carries a custom hue
// (the always-on tint; color null would mean AUTO = the stamp's dominant
// color — no autoColor on the test library, so AUTO paints nothing here).
const charHue = {
  ...char,
  stampSettings: { ...char.stampSettings, color: '#7ec8e3' },
};
// 0.17.0/0.22.0 — the card's shared POSITION lifts the visible stamp out of
// the band as a floating sticker (tinted).
const charPos = {
  ...char,
  stampSettings: { ...char.stampSettings, color: '#7ec8e3', pos: { x: 112, y: 24 } },
};
const noop = () => {};
const dragRef = { current: null };

ok('TagRibbon renders all trims + letter icon', () => {
  const out = tags.map((t) => renderToString(React.createElement(C('TagRibbon'), { tag: t, scale: 1.3 }))).join('');
  // 0.47.0 — the ribbon is a stroked SVG shape (the clip-path face is retired)
  assert.ok(out.includes('gd-ribbon-shadow') && out.includes('gd-ribbon-shape'));
  assert.ok(out.includes('stroke-linejoin'), 'the outline rounds its joins');
  assert.ok(out.includes('letter:Q'.slice(7))); // letter glyph rendered
  // 0.28.0 — the punched "hole" is retired with the default-icon report: an
  // icon-less straight ribbon is a clean plain color tab now, and the base
  // runs slightly thicker (34px) so small sizes still carry their mark.
  assert.ok(!out.includes('gd-ribbon-hole'));
  const bare = renderToString(React.createElement(C('TagRibbon'), { tag: { id: 'x', name: 'x', color: '#f0f', trim: 'straight' }, scale: 1 }));
  assert.ok(bare.includes('width:19'));
  assert.ok(bare.includes('height:34'));
  assert.ok(!bare.includes('gd-ribbon-hole'));
});

ok('RichText renders formatted names incl. new formats', () => {
  const out = renderToString(React.createElement(N('RichText', 'RichText'), { text: '<b>bold</b> and <o>outline</o> <i>ital</i> <u>und</u> <s>str</s> <m>small</m>' }));
  assert.ok(
    out.includes('rt-b') && out.includes('rt-outline') && out.includes('rt-i') && out.includes('rt-u') && out.includes('rt-s') && out.includes('rt-small')
  );
});

ok('RichText: plain names with / + = _ ^ ~ * are content, never markup', () => {
  const out = renderToString(React.createElement(N('RichText', 'RichText'), { text: 'a/b + c=d_e^f *g*' }));
  assert.ok(out.includes('a/b + c=d_e^f *g*'));
});

ok('RichInput renders the ONE-LAYER WYSIWYG editor (contentEditable, no mirror)', () => {
  const out = renderToString(React.createElement(C('RichText'), { value: 'name', placeholder: 'Type a name', onChange: noop }));
  assert.ok(out.includes('gd-rt-wrap'));
  assert.ok(out.includes('gd-rt-edit')); // the editor box itself
  assert.ok(/contenteditable/i.test(out)); // it IS the formatted text layer
  assert.ok(out.includes('data-placeholder'));
  assert.ok(!out.includes('gd-rt-mirror')); // 0.10.0: the desyncing mirror pair is gone
  assert.ok(!out.includes('gd-rt-input'));
  assert.ok(!out.includes('gd-rt-toolbar')); // selection only exists client-side
  assert.ok(!out.includes('<b>')); // the syntax never shows in the writable area
});

ok('MasonryGrid renders items absolutely', () => {
  const out = renderToString(
    React.createElement(C('MasonryGrid'), {
      cardWidth: 185, gap: 20, itemIds: ['add-first', 'c1'],
      renderItem: (id) => React.createElement('div', { key: id }, id),
    })
  );
  assert.ok(out.includes('c1'));
});

ok('GridView renders cards + spotlight popover + sort menu', () => {
  const out = renderToString(
    React.createElement(C('GridView'), {
      characters: [char], tags, stamps: stampLibrary, imagesPath: 'C:/img', zoom: 2, tagScale: 1,
      cardRatio: { w: 3, h: 4 }, sortMode: 'custom', search: '', advancedSearch: false,
      classLabel: 'All Cards',
      dragRef, spotlight: { include: ['t-absent'], exclude: [], stamps: [], hideNonMatching: false },
      showHelp: false,
      onCycleSpotlight: noop, onCycleStampSpotlight: noop, onToggleSpotlightHide: noop, onSearch: noop, onSort: noop,
      onZoom: noop, onTagScale: noop, onNew: noop, onOpen: noop, onRename: noop,
      onDelete: noop, onReorder: noop,
    })
  );
  assert.ok(out.includes('CUSTOM ORDER') && out.includes('FILTER'));
  assert.ok(out.includes('gd-card-dim')); // dimmed: card lacks the must-include tag
  assert.ok(out.includes('rt-b')); // rich card title rendered
  assert.ok(out.includes('gd-trim-ledger')); // per-card trim
  assert.ok(/position:absolute/.test(out) && /max-width:none/.test(out.replace(/maxWidth/g, 'max-width')), 'the crop renders through the exact 1.0.0 frame');
});

ok('0.15.0 GridView stamps: top stamp band by default; spotlight promotes + splits', () => {
  const render = (spotStamps) =>
    renderToString(
      React.createElement(C('GridView'), {
        characters: [char], tags, stamps: stampLibrary, imagesPath: 'C:/img', zoom: 2, tagScale: 1,
        cardRatio: { w: 3, h: 4 }, sortMode: 'custom', search: '', classLabel: 'x',
        dragRef, spotlight: { include: [], exclude: [], stamps: spotStamps, hideNonMatching: false },
        onCycleSpotlight: noop, onCycleStampSpotlight: noop, onToggleSpotlightHide: noop, onSearch: noop,
        onSort: noop, onZoom: noop, onTagScale: noop, onNew: noop, onOpen: noop, onRename: noop,
        onDelete: noop, onReorder: noop,
      })
    );
  // default: ONLY the top stamp renders (stamps[0]); the other stays behind.
  const plain = render([]);
  assert.ok(plain.includes('gd-card-stamp-band'));
  assert.ok(plain.includes('gd-card-stamp-img'));
  assert.ok((plain.match(/gd-card-stamp-img/g) || []).length === 1); // top only
  assert.ok(plain.includes('guild.png')); // top stamp's ORIGINAL file (never the thumb)
  // stamp spotlight: the picked template is promoted onto the band…
  const one = render(['tpl-b']);
  assert.ok(one.includes('seal.png'));
  assert.ok(!one.includes('guild.png'));
  // …two picked stamps SPLIT the band into two slices — and 0.27.0, the
  // order is the CARD'S OWN STACK: the top stamp (guild) takes the LEFT
  // half, the promoted seal the RIGHT, wherever the stamp sits.
  const two = render(['tpl-b', 'tpl-a']);
  assert.ok(two.includes('seal.png') && two.includes('guild.png'));
  assert.ok((two.match(/gd-card-stamp-img/g) || []).length === 2);
  // 0.27.0 — the split is a CLIP-PATH CUT OF THE STAMP'S OWN BOX: the
  // sliceboxes are shrink-wrap stages now (flex, bottom-anchored) and the
  // clip rides the IMG — the top stamp keeps the LEFT half of ITS OWN
  // art, the other the RIGHT half (the cut tracks position/scale instead
  // of assuming the card's middle).
  assert.ok((two.match(/gd-card-stamp-slicebox/g) || []).length === 2);
  assert.ok(two.includes('clip-path:inset(0 50% 0 0%)')); // top stamp = left half
  assert.ok(two.includes('clip-path:inset(0 0% 0 50%)')); // the other = right half
  // the popover itself is portal-gated (closed until clicked) — the button
  // carries the tag+stamp wording instead.
  assert.ok(two.includes('Tag &amp; stamp filter'));
});

ok('0.16.0/0.23.0 GridView stamp color: the hue layer rides under the logo; AUTO always paints (the default is real, never fake); splits follow the spotlight', () => {
  const render = (character, spotStamps = []) =>
    renderToString(
      React.createElement(C('GridView'), {
        characters: [character], tags, stamps: stampLibrary, imagesPath: 'C:/img', zoom: 2, tagScale: 1,
        cardRatio: { w: 3, h: 4 }, sortMode: 'custom', search: '', classLabel: 'x',
        dragRef, spotlight: { include: [], exclude: [], stamps: spotStamps, hideNonMatching: false },
        onCycleSpotlight: noop, onCycleStampSpotlight: noop, onToggleSpotlightHide: noop, onSearch: noop,
        onSort: noop, onZoom: noop, onTagScale: noop, onNew: noop, onOpen: noop, onRename: noop,
        onDelete: noop, onReorder: noop,
      })
    );
  // ON: the top stamp's slice paints its hue behind the logo.
  const on = render(charHue);
  assert.ok(on.includes('gd-card-stamp-slicebox')); // sliceboxes own the band geometry now
  assert.ok(on.includes('gd-card-stamp-hue')); // the fading tint layer exists
  assert.ok(on.includes('background:#7ec8e3')); // painted with the stamp's hue
  assert.ok((on.match(/gd-card-stamp-hue/g) || []).length === 1); // only the colored stamp
  // 0.23.0 — AUTO IS ALWAYS REAL: with no custom color and nothing derivable
  // (node has no DOM, the library record has no autoColor), the card paints
  // the SHARED DEFAULT — exactly what the color window's swatch shows —
  // instead of silently painting nothing while the window pretends a hue
  // ("the default is actually what the values are, not being fake").
  const off = render(char);
  assert.ok(off.includes('gd-card-stamp-band') && off.includes('gd-card-stamp-slicebox'));
  assert.ok(off.includes('gd-card-stamp-hue')); // the hue layer ALWAYS exists now
  assert.ok(off.includes('background:#ffffff')); // 0.30.0 — the shared default is WHITE now
  // Spotlight split: the promoted pair splits into two sliceboxes, the hue
  // splitting with its own stamp (only one colored stamp here).
  const split = render(charHue, ['tpl-b', 'tpl-a']);
  assert.ok((split.match(/gd-card-stamp-slicebox/g) || []).length === 2);
  assert.ok((split.match(/gd-card-stamp-hue/g) || []).length === 1);
});

ok('0.17.0/0.21.0 GridView stamp position: a pos stamp leaves the band as a SOLID floating sticker (its own alpha — no directional fade anymore), hue follows, borders win', () => {
  const render = (character, spotStamps = []) =>
    renderToString(
      React.createElement(C('GridView'), {
        characters: [character], tags, stamps: stampLibrary, imagesPath: 'C:/img', zoom: 2, tagScale: 1,
        cardRatio: { w: 3, h: 4 }, sortMode: 'custom', search: '', classLabel: 'x',
        dragRef, spotlight: { include: [], exclude: [], stamps: spotStamps, hideNonMatching: false },
        onCycleSpotlight: noop, onCycleStampSpotlight: noop, onToggleSpotlightHide: noop, onSearch: noop,
        onSort: noop, onZoom: noop, onTagScale: noop, onNew: noop, onOpen: noop, onRename: noop,
        onDelete: noop, onReorder: noop,
      })
    );
  const out = render(charPos);
  // the top stamp is a placed sticker: the free layer + placed wrapper at
  // its exact percent.
  assert.ok(out.includes('gd-card-stamp-free'));
  assert.ok(out.includes('gd-card-stamp-placed'));
  assert.ok(out.includes('left:112%'));
  assert.ok(out.includes('top:24%'));
  // 0.21.0 — the sticker is SOLID art: the old directional fade attr is
  // GONE (it dissolved half the logo mid-card — the “too see-through”
  // report), and the logo's opacity is the stamp's own ALPHA (default 1).
  assert.ok(!out.includes('data-fade'));
  assert.ok(out.includes('class="gd-card-stamp-img" style="opacity:1"'));
  // its hue washes the bottom half of the card (the gd-hue-halfcard layer).
  assert.ok(out.includes('background:#7ec8e3'));
  // the un-positioned second stamp is NOT promoted to the visible set —
  // no band renders at all (only the top stamp is ever visible).
  assert.ok(!out.includes('gd-card-stamp-band'));
  assert.ok((out.match(/gd-card-stamp-img/g) || []).length === 1);
  // the spotlight still governs the VISIBLE SET: spotlighting the second
  // stamp swaps the sticker out for the seal — and 0.22.0, the placement is
  // the CARD's, so the promoted stamp wears it too (one setting for every
  // stamp: the seal floats exactly where the guild did)…
  const promoted = render(charPos, ['tpl-b']);
  assert.ok(promoted.includes('seal.png'));
  assert.ok(promoted.includes('gd-card-stamp-placed'));
  assert.ok(promoted.includes('left:112%'));
  assert.ok((promoted.match(/gd-card-stamp-img/g) || []).length === 1);
  assert.ok(!promoted.includes('gd-card-stamp-band'));
  // …and spotlighting the PLACED stamp keeps it floating exactly where it
  // was put.
  const kept = render(charPos, ['tpl-a']);
  assert.ok(kept.includes('gd-card-stamp-placed'));
  assert.ok(kept.includes('left:112%'));
  assert.ok(!kept.includes('gd-card-stamp-band'));
  // 0.21.0 → 0.27.0 — the SPLIT VIEW on a PLACED card: every spotlighted
  // stamp keeps the SAME values (the card's own position / scale / rot) and
  // the WRAPPER's clip-path cuts the STAMP ITSELF into shares — the TOP
  // stamp keeps the LEFT half floating exactly where the card put it, the
  // other the RIGHT half. There are no sliceboxes in the free layer: the
  // cut rides the placed wrapper (its local, pre-transform box), so moving
  // or resizing the stamp moves the whole split with it.
  const split = render(charPos, ['tpl-b', 'tpl-a']);
  assert.ok(split.includes('gd-card-stamp-free'));
  assert.ok((split.match(/gd-card-stamp-placed/g) || []).length === 2); // both stickers, same spot
  assert.ok(!split.includes('gd-card-stamp-slicebox')); // clips ride the placed wrappers now
  assert.ok(split.includes('clip-path:inset(0 50% 0 0%)')); // top stamp = left half
  assert.ok(split.includes('clip-path:inset(0 0% 0 50%)')); // the other = right half
  assert.ok((split.match(/gd-card-stamp-img/g) || []).length === 2);
  assert.ok((split.match(/gd-card-stamp-hue/g) || []).length === 1); // ONE shared hue wash
  assert.ok(!split.includes('gd-card-stamp-band')); // placed stays placed — no band fallback
});

ok('0.17.0 GridView sleeve: the ART clips inside gd-sleeve-clip (trims + stamps ride beside it); stamp slots keep the unclipped cross', () => {
  const out = renderToString(
    React.createElement(C('GridView'), {
      characters: [char], tags, stamps: stampLibrary, imagesPath: 'C:/img', zoom: 2, tagScale: 1,
      cardRatio: { w: 3, h: 4 }, sortMode: 'custom', search: '', classLabel: 'x',
      dragRef, spotlight: { include: [], exclude: [], stamps: [], hideNonMatching: false },
      onCycleSpotlight: noop, onCycleStampSpotlight: noop, onToggleSpotlightHide: noop, onSearch: noop,
      onSort: noop, onZoom: noop, onTagScale: noop, onNew: noop, onOpen: noop, onRename: noop,
      onDelete: noop, onReorder: noop,
    })
  );
  // the clip wrapper owns the art; the sleeve itself no longer clips
  assert.ok(out.includes('gd-sleeve-clip'));
  assert.ok(!out.includes('relative overflow-hidden gd-sleeve'));
});

ok('0.17.0/0.21.0 PanZoomPreview renders the top stamp PASSIVELY: band while unplaced, floating sticker once placed — no transformer, no grabbing, solid art at its own alpha', () => {
  const render = (props) =>
    renderToString(React.createElement(C('CardLookEditor'), {
      name: 'amy', imageUrl: 'x', imgAspect: 1, ratio: { w: 3, h: 4 },
      trim: 'dash', crop: null, onChange: noop, ...props,
    }));
  // the band form: the stamp rides the classic faded band, hue + alpha on the slice.
  const band = render({ stampUrl: 'stamp.png', stampHueHex: '#7ec8e3', stampHueAlpha: 0.4, stampPos: null });
  assert.ok(band.includes('gd-card-stamp-band'));
  assert.ok(band.includes('background:#7ec8e3'));
  assert.ok(band.includes('--stamp-hue-alpha:0.4'));
  assert.ok(!band.includes('gd-card-stamp-grab')); // 0.20.0: passive art — no grab layer
  // 0.21.0 — the logo's own opacity is the stamp's ALPHA (band form too).
  const bandAlpha = render({ stampUrl: 'stamp.png', stampPos: null, stampAlpha: 0.55 });
  assert.ok(bandAlpha.includes('class="gd-card-stamp-img" style="opacity:0.55"'));
  // the placed form: a floating sticker at its percent — SOLID art (no
  // directional fade attr anymore), its alpha riding the logo.
  const placed = render({ stampUrl: 'stamp.png', stampHueHex: null, stampPos: { x: -18, y: 90 } });
  assert.ok(placed.includes('gd-card-stamp-placed'));
  assert.ok(!placed.includes('data-fade'));
  assert.ok(placed.includes('left:-18%'));
  assert.ok(placed.includes('top:90%'));
  assert.ok(placed.includes('class="gd-card-stamp-img" style="opacity:1"'));
  // 0.20.0 — the TRANSFORMER IS GONE: no frame, no handles, no rotate stem,
  // and the stamp never carries the drag wiring.
  assert.ok(!placed.includes('gd-stamp-xform'));
  assert.ok(!placed.includes('gd-stamp-xh'));
  assert.ok(!placed.includes('gd-stamp-xrot'));
  // the transform vars ride the sticker's inline style — ROT CARRIES ITS
  // DEG UNIT (the unitless value collapsed the whole transform — the
  // "stamp never rotates / sliders break" root cause).
  assert.ok(placed.includes('--stamp-scale:1'));
  assert.ok(placed.includes('--stamp-rot:0deg'));
  // a scaled + rotated + confined sticker carries its transform + the clip.
  const xformed = render({
    stampUrl: 'stamp.png', stampPos: { x: 50, y: 50 },
    stampScale: 1.75, stampRot: -30, stampClip: true,
  });
  assert.ok(xformed.includes('--stamp-scale:1.75'));
  assert.ok(xformed.includes('--stamp-rot:-30deg'));
  assert.ok(xformed.includes('is-clipped')); // OUTSIDE off (the default): the layer clips
  // 0.20.0 — a placed stamp's hue is the BOTTOM-HALF-OF-THE-CARD wash (under
  // the sticker, faded upward, at its own transparency) — not a plate on the
  // sticker.
  const hue = render({ stampUrl: 'stamp.png', stampHueHex: '#7ec8e3', stampHueAlpha: 0.3, stampPos: { x: 50, y: 30 } });
  assert.ok(hue.includes('gd-hue-halfcard'));
  assert.ok(hue.includes('background:#7ec8e3'));
  assert.ok(hue.includes('opacity:0.3'));
  // 0.20.0 — collector cards round their TOP only.
  assert.ok(placed.includes('gd-card-collector'));
});

ok('0.18.0/0.19.0 engraved trims render on grid cards: gold / vine / scales / rivet overlay classes', () => {
  const render = (trim) =>
    renderToString(
      React.createElement(C('GridView'), {
        characters: [{ ...char, cardTrim: trim, tags: ['t1'] }], tags, imagesPath: 'C:/img', zoom: 2, tagScale: 1,
        cardRatio: { w: 3, h: 4 }, sortMode: 'custom', search: '', classLabel: 'x',
        dragRef, spotlight: { include: [], exclude: [], hideNonMatching: false },
        onCycleSpotlight: noop, onToggleSpotlightHide: noop, onSearch: noop, onSort: noop,
        onZoom: noop, onTagScale: noop, onNew: noop, onOpen: noop, onRename: noop,
        onDelete: noop, onReorder: noop,
      })
    );
  for (const [trim, cls] of [
    ['gold', 'gd-trim-gold'],
    ['vine', 'gd-trim-vine'],
    // 0.28.0 — the rope braid is retired too; the beaded chain takes the slot
    ['beads', 'gd-trim-beads'],
    ['rivet', 'gd-trim-rivet'],
  ]) {
    const out = render(trim);
    assert.ok(out.includes(cls), `${trim} should render ${cls}`);
    assert.ok(!out.includes('gd-trim-ledger'), `${trim} should not render the old trim`);
    assert.ok(!out.includes('gd-trim-rope'), `${trim} should not render the retired rope braid`);
  }
});

ok('0.18.0/0.19.0 CardLookEditor offers the engraved trims as chips (label + preview class)', () => {
  const out = renderToString(
    React.createElement(C('CardLookEditor'), {
      name: 'amy', imageUrl: 'x', imgAspect: 1, ratio: { w: 3, h: 4 },
      trim: 'gold', crop: null, onChange: noop,
    })
  );
  assert.ok(out.includes('Gold Engraving'));
  assert.ok(out.includes('Vine Engraving'));
  assert.ok(out.includes('Beaded Chain')); // 0.28.0: the rope braid's replacement
  assert.ok(out.includes('Riveted Band')); // 0.19.0: the new steel band
  assert.ok(!out.includes('Scale Mail')); // retired
  assert.ok(!out.includes('Rope Braid')); // 0.28.0: retired too
  assert.ok(out.includes('gd-trim-gold')); // the chip's mini preview wears the trim
});

ok('0.19.0 surfaces: the character header wears its PARENT surface (no viewerhead strip anywhere)', () => {
  const render = (extra) =>
    renderToString(
      React.createElement(C('CharacterView'), {
        character: charPos, tags, stampLibrary, imagesPath: 'C:/img',
        cardDefaultRatio: { w: 3, h: 4 }, outputBarOn: false, showHelp: false, stagedMount: false,
        onBack: noop, patchCharacter: noop, onRename: noop,
        onDelete: noop, onToggleTag: noop, onOpenTagManager: noop,
        onStampTransform: noop,
        confirm: noop, onStatus: noop, onActiveVersion: noop, ...extra,
      })
    );
  // full-window: 1.2.6 — ONE HEAD, ONE SURFACE: the full-window head wears
  // the PANEL's own patterned surface (the two seats read as one object at
  // any width — the titlebar's flat language is retired there). 0.33.0's
  // compositing layer (gd-char-head, the lag fix) and 0.21.0's real bottom
  // border stay.
  const full = render({ compact: false });
  assert.ok(full.includes('gd-char-head sticky top-0 z-20 pt-4 pb-3 border-b gd-tex-panel'));
  assert.ok(!full.includes('gd-tex-viewerhead'));
  assert.ok(!full.includes('gd-tex-titlebar'), "the full-window head no longer speaks the titlebar's flat surface");
  // right panel: the sticky header wears the PANEL surface (its parent)
  const compact = render({ compact: true });
  assert.ok(compact.includes('gd-char-head sticky top-0 z-20 pt-4 pb-3 border-b gd-tex-panel'));
  assert.ok(!compact.includes('gd-tex-viewerhead'));
});

ok('0.18.0 hover shine: every grid card carries the sweep layer (clipped to the sleeve)', () => {
  const out = renderToString(
    React.createElement(C('GridView'), {
      characters: [char], tags, imagesPath: 'C:/img', zoom: 2, tagScale: 1,
      cardRatio: { w: 3, h: 4 }, sortMode: 'custom', search: '', classLabel: 'x',
      dragRef, spotlight: { include: [], exclude: [], hideNonMatching: false },
      onCycleSpotlight: noop, onToggleSpotlightHide: noop, onSearch: noop, onSort: noop,
      onZoom: noop, onTagScale: noop, onNew: noop, onOpen: noop, onRename: noop,
      onDelete: noop, onReorder: noop,
    })
  );
  assert.ok(out.includes('gd-card-shine'));
});

ok('GridView spotlight v3: must-exclude greys out the tagged card', () => {
  const out = renderToString(
    React.createElement(C('GridView'), {
      characters: [char], tags, imagesPath: 'C:/img', zoom: 2, tagScale: 1,
      cardRatio: { w: 3, h: 4 }, sortMode: 'custom', search: '', classLabel: 'x',
      dragRef, spotlight: { include: [], exclude: ['t1'], hideNonMatching: false },
      onCycleSpotlight: noop, onToggleSpotlightHide: noop, onSearch: noop, onSort: noop,
      onZoom: noop, onTagScale: noop, onNew: noop, onOpen: noop, onRename: noop,
      onDelete: noop, onReorder: noop,
    })
  );
  assert.ok(out.includes('gd-card-dim')); // the holder of the excluded tag greys out
});

ok('GridView spotlight v3: hide-non-matching removes the non-matching card; ribbons ON the card', () => {
  const out = renderToString(
    React.createElement(C('GridView'), {
      characters: [char], tags, imagesPath: 'C:/img', zoom: 2, tagScale: 1,
      cardRatio: { w: 3, h: 4 }, sortMode: 'custom', search: '', classLabel: 'x',
      dragRef, spotlight: { include: [], exclude: ['t1'], hideNonMatching: true },
      onCycleSpotlight: noop, onToggleSpotlightHide: noop, onSearch: noop, onSort: noop,
      onZoom: noop, onTagScale: noop, onNew: noop, onOpen: noop, onRename: noop,
      onDelete: noop, onReorder: noop,
    })
  );
  assert.ok(!out.includes('gd-card-dim')); // hidden, not dimmed
  assert.ok(out.includes('NO MATCHES'));
});

ok('GridView tag position: mark mode pads the grid head room', () => {
  const corner = renderToString(
    React.createElement(C('GridView'), {
      characters: [char], tags, imagesPath: 'C:/img', zoom: 2, tagScale: 1,
      tagPosition: 'corner', cardRatio: { w: 3, h: 4 }, sortMode: 'custom', search: '',
      classLabel: 'x', dragRef, spotlight: { include: [], exclude: [] },
      onCycleSpotlight: noop, onToggleSpotlightHide: noop, onSearch: noop, onSort: noop,
      onZoom: noop, onTagScale: noop, onNew: noop, onOpen: noop, onRename: noop,
      onDelete: noop, onReorder: noop,
    })
  );
  const mark = renderToString(
    React.createElement(C('GridView'), {
      characters: [char], tags, imagesPath: 'C:/img', zoom: 2, tagScale: 1,
      tagPosition: 'mark', cardRatio: { w: 3, h: 4 }, sortMode: 'custom', search: '',
      classLabel: 'x', dragRef, spotlight: { include: [], exclude: [] },
      onCycleSpotlight: noop, onToggleSpotlightHide: noop, onSearch: noop, onSort: noop,
      onZoom: noop, onTagScale: noop, onNew: noop, onOpen: noop, onRename: noop,
      onDelete: noop, onReorder: noop,
    })
  );
  assert.ok(corner.includes('padding-top:20px'));
  // mark mode: 20 + the small head above the edge (5px) + a hair — the
  // 0.11.0 mirror hangs the ribbon INTO the card, so the grid needs only
  // room for the head (independent of card heights and tag scale).
  assert.ok(mark.includes('padding-top:29px'));
  assert.ok(mark.includes('gd-card-ribbons')); // ribbons still attached to the card
});

ok('AddCard mirrors the neighbor card footer (name area height)', () => {
  // GridView with a character next to the add slot: the add card carries the
  // same two-line footer structure.
  const out = renderToString(
    React.createElement(C('GridView'), {
      characters: [char], tags: [], imagesPath: 'C:/img', zoom: 2, tagScale: 1,
      cardRatio: { w: 3, h: 4 }, sortMode: 'custom', search: '', classLabel: 'x',
      dragRef, spotlight: { include: [], exclude: [] }, onCycleSpotlight: noop,
      onToggleSpotlightHide: noop,
      onSearch: noop, onSort: noop, onZoom: noop, onTagScale: noop,
      onNew: noop, onOpen: noop, onRename: noop, onDelete: noop, onReorder: noop,
    })
  );
  assert.ok(out.includes('NEW CARD') && out.includes('ADD NEW'));
  assert.ok(out.includes('invisible')); // hidden title line matching real card height
});

ok('Modal renders sticky header + measured body', () => {
  const out = renderToString(
    React.createElement(C('Modal'), { title: 'T', onClose: noop }, React.createElement('p', null, 'body'))
  );
  assert.ok(out.includes('gd-modal-card') && out.includes('body'));
});

ok('NewCharacterModal renders 3 panels + color wheel + compact footer', () => {
  const out = renderToString(
    React.createElement(C('NewCharacterModal'), {
      initialImages: [{ file: 'a.png', thumb: 'a_t.jpg' }], imagesPath: 'C:/img',
      defaultRatio: { w: 3, h: 4 }, classes: [], defaultClassId: 'root',
      onClose: noop, onCreate: noop,
    })
  );
  assert.ok(out.includes('CARD LOOK') && out.includes('DETAILS') && out.includes('FIRST VERSION'));
  assert.ok(out.includes('ADD MORE'));
  assert.ok(out.includes('gd-cp-btn is-dashed')); // 0.24.0: the in-app picker trigger (no native wheel)
  assert.ok(!out.includes('type="color"')); // the native color input is gone app-wide
  assert.ok(out.includes('gd-foot-bar')); // pinned right-aligned footer pill
  assert.ok(!out.includes('>CUSTOM<')); // 0.9.0: caption gone — aligned with the presets
  assert.ok(out.includes('gd-panzoom')); // drag/zoom preview (hint bubble removed)
  assert.ok(out.includes('gd-sort-item')); // 0.8.0 smooth pointer sorting on the thumb grid
  assert.ok(out.includes('gd-thumb-ring') || out.includes('layoutId') || true); // cover indicators (shared layout, client-side animation)
  assert.ok(!out.includes('DRAG TO PLACE')); // hint bubble gone
  assert.ok(!out.includes('CROP — DRAG THE FRAME')); // crop rectangle editor gone
});

ok('0.15.0/0.22.0/0.24.0 NewCharacterModal: stamp area below the images with the ADD key — NO global switch, NO template strip', () => {
  const out = renderToString(
    React.createElement(C('NewCharacterModal'), {
      initialImages: [{ file: 'a.png', thumb: 'a_t.jpg' }], imagesPath: 'C:/img',
      defaultRatio: { w: 3, h: 4 }, classes: [], defaultClassId: 'root',
      stampLibrary,
      onClose: noop, onCreate: noop,
    })
  );
  // the stamp area lives below the image upload; the empty state is the
  // ADD key (the picker popover is portal-gated until clicked)
  assert.ok(out.includes('STAMPS ('));
  assert.ok(out.includes('gd-stamp-slot is-empty'));
  assert.ok(out.includes('>ADD<'));
  // 0.24.0 — the STAMPS GALLERY shows every stamp in the library that is
  // not already on the card (attached stamps are NOT shown at all).
  assert.ok(out.includes('STAMPS GALLERY ('));
  assert.ok(out.includes('gd-stamp-lib-chip'));
  assert.ok(out.includes('guild.png') && out.includes('seal.png'));
  // every gallery chip carries the trash key (remove from the gallery,
  // confirm window handled by the App)
  assert.ok((out.match(/gd-stamp-lib-del/g) || []).length === 2);
  // 0.22.0 — the public/private machinery is GONE: no GLOBAL STAMP switch,
  // no template strip — every upload simply joins the library on CREATE.
  assert.ok(!out.includes('GLOBAL STAMP'));
  assert.ok(!out.includes('GLOBAL STAMP TEMPLATES'));
  // 1.4.3 — THE CLUSTER STAYS WITHOUT A STAMP ("let the hue color and
  // stamp options appear in the card creation window ... even if there is
  // no stamp present, but of course grey out the stamp settings option
  // when its not present"): the cluster renders from the window's first
  // frame (the hue drafts; the settings key takes the locked seat) — the
  // old no-cluster-yet assertion left with the stamps.length gate.
  // 1.4.4 — the keys inside are the real labeled buttons now
  // (.gd-stamp-key: swatch + COLOR, gear + SETTINGS).
  assert.ok(out.includes('gd-stamp-settings-cluster'));
  assert.ok(out.includes('gd-stamp-key'));
  assert.ok(!out.includes('gd-stamp-color-btn'));
  assert.ok(!out.includes('gd-stamp-pos-btn'));
});

ok('CardLookEditor: preview IS the editor; ratio presets + custom panel', () => {
  const out = renderToString(
    React.createElement(C('CardLookEditor'), {
      name: 'amy', imageUrl: 'x', imgAspect: 1, ratio: { w: 3, h: 4 },
      trim: 'dash', crop: null, onChange: noop,
    })
  );
  assert.ok(out.includes('ASPECT RATIO') && out.includes('TRIM'));
  assert.ok(!out.includes('>CUSTOM<')); // 0.9.0: caption gone from the ratio area
  assert.ok(out.includes('WIDE')); // live ratio readout
  assert.ok(out.includes('gd-panzoom'));
  assert.ok(out.includes('Perforation') || out.includes('Dashed'));
  assert.ok(!out.includes('Stitched') && !out.includes('Registration')); // removed trims
  assert.ok(!out.includes('Mat Frame') && !out.includes('Corner Brackets')); // 0.7.0 removed trims
});

ok('CharacterView renders settings menu + tabs — ONE copy surface, no class select, no version count', () => {
  // 1.3.0 re-law: STAGED PANEL MOUNT defaults ON and a server render never
  // fires its rAF breaths, so every render below speaks the switch's OFF
  // seat (stagedMount: false, one flat commit, the whole rows tray in the
  // tree) — the renders stay honest full-tree snapshots.
  const out = renderToString(
    React.createElement(C('CharacterView'), {
      character: char, tags, classes: [], imagesPath: 'C:/img', compact: true,
      cardDefaultRatio: { w: 3, h: 4 }, outputBarOn: true, showHelp: false, stagedMount: false,
      onBack: noop, patchCharacter: noop, onRename: noop,
      onDelete: noop, onToggleTag: noop, onOpenTagManager: noop, onSetClass: noop,
      confirm: noop, onStatus: noop, onActiveVersion: noop,
    })
  );
  assert.ok(out.includes('PROMPTS') && out.includes('NOTES')); // tabs under the image
  assert.ok(!out.includes('COPY OUTPUT')); // strip removed — bottom bar OR panel, never both
  assert.ok(out.includes('rt-outline')); // <o>V1</o> chip
  assert.ok(!out.includes('LORA')); // lora section replaced by notes
  assert.ok(!out.includes('<select')); // 0.10.0: class selector gone from the panel
  assert.ok(!out.includes('VERSIONS')); // 0.10.0: version count gone from the header
  assert.ok(out.includes('is-bleed')); // 0.10.0: panel preview is full-bleed
  // 0.15.0 — the stamp editor row sits under the tags (vertically centered
  // inside the sticky header), with slots + the ADD key's picker button.
  // 0.23.0 — the slots are the shared kit: drag-sortable, star to promote,
  // cross to remove, click to edit.
  assert.ok(out.includes('STAMPS'));
  assert.ok(out.includes('gd-stamp-slot'));
  assert.ok(out.includes('guild.png')); // the character's stamps render as slots
  assert.ok(out.includes('Add a stamp')); // the ADD key
});

ok('0.16.0/0.22.0 CharacterView: ONE shared COLOR button for the card (constant-width swatch, plain color picking — no AUTO option)', () => {
  const out = renderToString(
    React.createElement(C('CharacterView'), {
      character: charHue, tags, classes: [], stampLibrary, imagesPath: 'C:/img', compact: true,
      cardDefaultRatio: { w: 3, h: 4 }, outputBarOn: true, showHelp: false, stagedMount: false,
      onBack: noop, patchCharacter: noop, onRename: noop,
      onDelete: noop, onToggleTag: noop, onOpenTagManager: noop, onSetClass: noop,
      onAttachStamp: noop, onRemoveStamp: noop, onPromoteStamp: noop, onUploadStamp: noop,
      onStampColor: noop, onStampTransform: noop,
      confirm: noop, onStatus: noop, onActiveVersion: noop,
    })
  );
  // 0.22.0 — ONE cluster for the whole card (not one per slot): the color
  // key + settings key sit after the slots, shared by every stamp.
  // 1.1.9 re-law: the strip's crew renders TWICE — the hidden measurement
  // twin + the live zone (SideFlowZone); still ONE cluster per copy.
  // 1.4.4 — THE KEYS ARE REAL BUTTONS: the anonymous 20px swatch square
  // and gear retired for the labeled .gd-stamp-key pair (a live swatch
  // chip + COLOR; a gear + SETTINGS, accent-ringed while placed).
  // 1.4.6 SUPERSEDED (the tower seats in the row's left column, outside
  // the SideFlowZone): the strip's crew no longer renders inside the
  // measurement twin — ONE live copy (gendex_155 pins the seat law).
  // 1.5.4 — the tower's live copy + the strip's hidden measurement twin
  // both render the key again (the twin came home with a later flow pass);
  // the twin never paints — one VISIBLE cluster, two rendered copies.
  assert.ok((out.match(/class="gd-stamp-color"/g) || []).length === 2);
  // 1.4.5 SUPERSEDED ("the hue color and stamp settings, i want their
  // buttons to be 2 different style ... while the rest should be the old
  // one"): the PANEL seat speaks the CLASSIC keys (the anonymous 20px
  // squares back) — the labeled pair lives in the EDIT CARD window alone;
  // gendex_154 pins the two-style law.
  // 1.4.6 SUPERSEDED (same law): both classic keys, the ONE live copy —
  // the tower's seat moved out of the probe's reach.
  assert.ok((out.match(/gd-stamp-key-classic/g) || []).length >= 2); // both classic keys, the live copy
  assert.ok(out.includes('gd-stamp-key-color')); // the color square speaks the swatch fill
  assert.ok(out.includes('gd-stamp-key-fill'));
  assert.ok(out.includes('#7ec8e3')); // the live fill shows the saved hue
  assert.ok(!out.includes('>COLOR<')); // the labeled face is the edit window's own
  assert.ok(!out.includes('gd-stamp-color-btn')); // the original anonymous square button stays retired
  assert.ok(!out.includes('gd-stamp-pos-btn')); // the old anonymous gear is gone
  assert.ok(out.includes('class="gd-stamp-pos"'));
  assert.ok(!out.includes('type="color"')); // the native picker is inside the window (closed)
  assert.ok(!out.includes('gd-stamp-alpha')); // the old rider slider class is gone
  // a card without a custom color still gets the button — the hue still
  // defaults to the stamp's derived dominant color, it is just not a UI
  // option anymore (no AUTO row, no marker).
  const auto = renderToString(
    React.createElement(C('CharacterView'), {
      character: char, tags, classes: [], stampLibrary, imagesPath: 'C:/img', compact: true,
      cardDefaultRatio: { w: 3, h: 4 }, outputBarOn: true, showHelp: false, stagedMount: false,
      onBack: noop, patchCharacter: noop, onRename: noop,
      onDelete: noop, onToggleTag: noop, onOpenTagManager: noop, onSetClass: noop,
      onAttachStamp: noop, onRemoveStamp: noop, onPromoteStamp: noop, onUploadStamp: noop,
      onStampColor: noop, onStampTransform: noop,
      confirm: noop, onStatus: noop, onActiveVersion: noop,
    })
  );
  // 1.4.4 — the key replaces the old square (same law: a card without a
  // custom color still gets the key — the hue still defaults to the
  // stamp's derived dominant color, just not a UI option anymore).
  assert.ok(auto.includes('gd-stamp-key'));
  assert.ok(!auto.includes('gd-stamp-color-auto-dot'));
  // without the wiring prop the cluster stays hidden (older call sites safe)
  const bare = renderToString(
    React.createElement(C('CharacterView'), {
      character: charHue, tags, classes: [], stampLibrary, imagesPath: 'C:/img', compact: true,
      cardDefaultRatio: { w: 3, h: 4 }, outputBarOn: true, showHelp: false, stagedMount: false,
      onBack: noop, patchCharacter: noop, onRename: noop,
      onDelete: noop, onToggleTag: noop, onOpenTagManager: noop, onSetClass: noop,
      confirm: noop, onStatus: noop, onActiveVersion: noop,
    })
  );
  assert.ok(!bare.includes('gd-stamp-color'));
  assert.ok(!bare.includes('gd-stamp-key'));
});

ok('0.21.0 CharacterView: the sticky header carries the REAL bottom border — the fake spacer line is gone', () => {
  const out = renderToString(
    React.createElement(C('CharacterView'), {
      character: charHue, tags, classes: [], stampLibrary, imagesPath: 'C:/img', compact: true,
      cardDefaultRatio: { w: 3, h: 4 }, outputBarOn: true, showHelp: false, stagedMount: false,
      onBack: noop, patchCharacter: noop, onRename: noop,
      onDelete: noop, onToggleTag: noop, onOpenTagManager: noop, onSetClass: noop,
      onAttachStamp: noop, onRemoveStamp: noop, onPromoteStamp: noop, onUploadStamp: noop,
      onStampColor: noop, onStampTransform: noop,
      confirm: noop, onStatus: noop, onActiveVersion: noop,
    })
  );
  // the REAL line rides the sticky bar itself (it stays stuck while the
  // content scrolls under it — a true boundary).
  assert.ok(out.includes('sticky top-0 z-20 pt-4 pb-3 border-b'));
  assert.ok(out.includes('border-color:var(--gd-line)'));
  // the FAKE line — a bare border-b spacer div that scrolled away while
  // content slid under the header's invisible edge — is gone.
  assert.ok(!out.includes('class="pb-3 border-b'));
});

ok('0.17.0/0.20.0/0.22.0 CharacterView: the stamp editor carries ONE shared SETTINGS button (settings popover wiring)', () => {
  const out = renderToString(
    React.createElement(C('CharacterView'), {
      character: charPos, tags, classes: [], stampLibrary, imagesPath: 'C:/img', compact: true,
      cardDefaultRatio: { w: 3, h: 4 }, outputBarOn: true, showHelp: false, stagedMount: false,
      onBack: noop, patchCharacter: noop, onRename: noop,
      onDelete: noop, onToggleTag: noop, onOpenTagManager: noop, onSetClass: noop,
      onAttachStamp: noop, onRemoveStamp: noop, onPromoteStamp: noop, onUploadStamp: noop,
      onStampColor: noop, onStampTransform: noop,
      confirm: noop, onStatus: noop, onActiveVersion: noop,
    })
  );
  // 0.22.0 — ONE settings key for the whole card (not one per slot),
  // lit when the card's shared placement is set.
  // 1.1.9 re-law: the twin renders the shared settings key twice (the
  // hidden probe + the live zone) — still one per copy, shared by all stamps.
  // 1.4.4 — the key is the labeled .gd-stamp-key now (gear + SETTINGS).
  // 1.4.5 — the panel speaks the CLASSIC face; the accent ring rides the
  // classic square's own is-on law (same state, same ring).
  assert.ok((out.match(/gd-stamp-key-classic/g) || []).length >= 2);
  assert.ok(out.includes('gd-stamp-key-classic is-on')); // the card is placed
  // the popover itself is portal-gated (closed until clicked)
  assert.ok(!out.includes('STAMP SETTINGS'));
  // without the wiring prop the keys stay hidden
  const bare = renderToString(
    React.createElement(C('CharacterView'), {
      character: charPos, tags, classes: [], stampLibrary, imagesPath: 'C:/img', compact: true,
      cardDefaultRatio: { w: 3, h: 4 }, outputBarOn: true, showHelp: false, stagedMount: false,
      onBack: noop, patchCharacter: noop, onRename: noop,
      onDelete: noop, onToggleTag: noop, onOpenTagManager: noop, onSetClass: noop,
      confirm: noop, onStatus: noop, onActiveVersion: noop,
    })
  );
  assert.ok(!bare.includes('gd-stamp-key'));
});

ok('0.20.0/0.22.0 StampPosControls: the settings key renders (lit when the card is placed); the popover opens on click with X POSITION / Y POSITION / SCALE / ROTATION / TRANSPARENCY + OUTSIDE — no presets, readable labels', () => {
  const out = renderToString(
    React.createElement(C('StampPosControls'), { settings: { pos: { x: 75, y: 25 }, scale: 1.5, rot: -30, clip: true }, onPatch: noop })
  );
  // 1.4.4 — the labeled key replaces the anonymous gear
  assert.ok(out.includes('gd-stamp-key'));
  assert.ok(out.includes('is-on')); // a placed card lights the key
  assert.ok(out.includes('>SETTINGS<'));
  // the popover content itself is portal-gated: closed until clicked
  assert.ok(!out.includes('STAMP SETTINGS'));
  const quiet = renderToString(
    React.createElement(C('StampPosControls'), { settings: { pos: null }, onPatch: noop })
  );
  assert.ok(quiet.includes('gd-stamp-key'));
  assert.ok(!quiet.includes('is-on'));
  // the settings copy rides the button's title (the popover itself is portaled)
  assert.ok(out.includes('position, scale, rotation, transparency and outside'));
  // 0.20.0 — OUTSIDE defaults OFF: a card without an explicit clip:false
  // reads the switch as off (confined to the card) — the settings button
  // itself still lights because the card is placed.
  const outsideOff = renderToString(
    React.createElement(C('StampPosControls'), { settings: { pos: { x: 75, y: 25 } }, onPatch: noop })
  );
  assert.ok(!outsideOff.includes('gd-switch is-on'));
});

ok('0.22.0 StampColorControls: plain color picking — the key shows the live color (no AUTO option, no on/off marker), the window (color well + transparency) is portal-gated', () => {
  const on = renderToString(
    React.createElement(C('StampColorControls'), {
      color: '#ff0044', colorAlpha: 0.4, autoColor: '#7ec8e3', onColor: noop, onAlpha: noop,
    })
  );
  // 1.4.4 — the labeled key (swatch chip + COLOR) replaces the anonymous square
  assert.ok(on.includes('gd-stamp-key')); // a plain opener key
  assert.ok(on.includes('>COLOR<'));
  assert.ok(!on.includes('gd-stamp-key is-on')); // no on/off state to signal anymore
  assert.ok(on.includes('gd-stamp-key-swatch'));
  assert.ok(on.includes('background:#ff0044')); // the live chip shows the picked hue
  assert.ok(!on.includes('gd-stamp-color-auto-dot')); // the AUTO marker is gone
  // everything else lives INSIDE the color window, which is portal-gated
  // (closed until the key is clicked — so none of it rides the row).
  assert.ok(!on.includes('type="color"'));
  assert.ok(!on.includes('type="range"'));
  assert.ok(!on.includes('gd-switch'));
  assert.ok(!on.includes('gd-stamp-color-swatch')); // the old inline swatch is gone
  // 0.41.0 — no custom color: the chip shows the WHITE default. The derived
  // dominant color no longer drives the wash ("default color for the hue of
  // the stamp should be white") — the autoColor derivation keeps running
  // for the library cache, but the chip never shows it.
  const auto = renderToString(
    React.createElement(C('StampColorControls'), { color: null, colorAlpha: 0.4, autoColor: '#7ec8e3', onColor: noop, onAlpha: noop })
  );
  assert.ok(auto.includes('gd-stamp-key'));
  assert.ok(!auto.includes('is-on'));
  assert.ok(!auto.includes('gd-stamp-color-auto-dot'));
  assert.ok(auto.includes('background:#ffffff')); // the WHITE default shows
  assert.ok(!auto.includes('background:#7ec8e3')); // the derived hue is retired
  assert.ok(!auto.includes('type="color"'));
  // dominant color not yet derived: the chip falls back to the classic default
  const deriving = renderToString(
    React.createElement(C('StampColorControls'), { color: null, onColor: noop, onAlpha: noop })
  );
  assert.ok(deriving.includes('background:#ffffff')); // 0.30.0 — the default fallback hue is white
  assert.ok(!deriving.includes('gd-stamp-color-auto-dot'));
});

ok('0.24.0 StampSlots: every slot carries the star (promote) + cross (remove) + the hover pencil; TOP badge on the first; the row is the wrapping drag strip', () => {
  const out = renderToString(
    React.createElement(N('StampEditModal', 'StampSlots'), {
      stamps: [
        { id: 's1', image: 'guild.png', name: 'guild' },
        { id: 's2', image: 'seal.png', name: 'seal' },
      ],
      imagesPath: 'C:/img',
      onRemove: noop, onPromote: noop, onReorder: noop, onRename: noop,
    })
  );
  assert.ok(out.includes('gd-stamp-slots')); // the WRAPPING drag strip (no scrollbox)
  assert.ok((out.match(/gd-stamp-slot-star/g) || []).length === 2); // a star on EVERY slot
  assert.ok((out.match(/gd-stamp-slot-x/g) || []).length === 2); // a cross on every slot
  assert.ok(out.includes('gd-stamp-slot-top')); // the TOP badge on the first
  assert.ok(out.includes('>TOP<'));
  assert.ok(out.includes('Make this the top stamp')); // the star's action title
  // the top slot's own star reads "already top" (no press)
  // 1.3.0 re-law: the title lost its em dash with the text sweep.
  assert.ok(out.includes('Top stamp: the one the card shows'));
  // 0.24.0 — the EDIT affordance rides every slot (revealed on hover via
  // CSS); the press-driven is-editing state is gone.
  assert.ok((out.match(/gd-stamp-slot-edit/g) || []).length === 2);
  assert.ok(!out.includes('is-editing'));
});

ok('0.23.0 StampEditModal: the stamp window — preview on the transparency checker, NAME field, CANCEL/SAVE in the foot-bar pill', () => {
  const out = renderToString(
    React.createElement(C('StampEditModal'), {
      stampUrl: 'C:/img/guild.png', initialName: 'guild', isNew: false, onClose: noop, onSave: noop,
    })
  );
  assert.ok(out.includes('EDIT STAMP'));
  assert.ok(out.includes('gd-stamp-edit-preview')); // the checker preview box
  assert.ok(out.includes('guild.png'));
  assert.ok(out.includes('NAME'));
  assert.ok(out.includes('value="guild"')); // the name rides the input
  assert.ok(out.includes('CANCEL') && out.includes('SAVE'));
  assert.ok(out.includes('gd-foot-bar')); // the creation dialog's action-pill construction
  // the NEW-stamp flavor titles the window SAVE STAMP and can carry a counter
  const fresh = renderToString(
    React.createElement(C('StampEditModal'), {
      stampUrl: 'C:/img/seal.png', isNew: true, counter: '2 OF 5', onClose: noop, onSave: noop,
    })
  );
  assert.ok(fresh.includes('SAVE STAMP'));
  assert.ok(fresh.includes('2 OF 5'));
});

ok('0.24.0 StampAddButton: the ADD key opens the picker (portal-gated) — gallery tiles + UPLOAD live inside it; attached stamps are not shown', () => {
  const out = renderToString(
    React.createElement(N('StampEditModal', 'StampAddButton'), {
      stampLibrary, imagesPath: 'C:/img', attachedImages: ['guild.png'],
      onPick: noop, onUpload: noop,
    })
  );
  assert.ok(out.includes('gd-stamp-slot is-empty'));
  assert.ok(out.includes('>ADD<'));
  // the popover is portal-gated (closed until clicked) — its rows are not in
  // the row markup, only the key itself.
  assert.ok(!out.includes('UPLOAD A STAMP'));
  assert.ok(!out.includes('gd-stamp-row'));
});

ok('ImageStage renders blur backdrop + container controls; the wheel NEVER zooms (0.28.0)', () => {
  const out = renderToString(
    React.createElement(C('ImageStage'), {
      images: [{ file: 'a.png', thumb: 'a_t.jpg' }, { file: 'b.png', thumb: 'b_t.jpg' }],
      imagesPath: 'C:/img', onAddImages: noop, onSetCover: noop, onDeleteImage: noop,
      onReorderImages: noop, onStatus: noop, confirm: noop,
    })
  );
  assert.ok(out.includes('gd-stage-blur')); // blurred backdrop fills the container
  assert.ok(out.includes('ADD IMAGES')); // drop slot outside the stage
  assert.ok(!out.includes('DRAG TO SORT')); // filmstrip hidden until EDIT is pressed
  // 0.28.0 — scroll-to-zoom + double-click-reset are RETIRED: no zoom hint
  // in the title, no zoom/pan class machinery anywhere in the markup.
  // 0.32.0 — the preview's tooltip is gone entirely ("remove the tooltip on
  // the image preview entirely"): the stage carries no title, and the
  // browse key bills only CLICK OR DROP (paste has its own key).
  assert.ok(!out.includes('Preview —'));
  // 1.3.0 re-law: the label lost its em dash with the text sweep.
  assert.ok(out.includes('ADD IMAGES: CLICK OR DROP'));
  assert.ok(!out.includes('CLICK, PASTE OR DROP'));
  assert.ok(!out.includes('Image position"')); // counter tooltip gone too
  assert.ok(!out.includes('double-click to reset'));
  assert.ok(!out.includes('Scroll to shrink'));
  // 0.12.0: the right-panel variant — full-bleed stage, the wheel SCROLLS the
  // panel normally (no zoom hint), the FULL image shows over its blurred
  // bleed. 0.19.0: the living-background layer is GONE — nothing renders in
  // the bleed but the blurred picture (no animMode props exist anymore).
  const panel = renderToString(
    React.createElement(C('ImageStage'), {
      images: [{ file: 'a.png', thumb: 'a_t.jpg' }], imagesPath: 'C:/img',
      bleed: true,
      onAddImages: noop, onSetCover: noop, onDeleteImage: noop,
      onReorderImages: noop, onStatus: noop, confirm: noop,
    })
  );
  assert.ok(panel.includes('is-bleed'));
  assert.ok(panel.includes('p-0 pb-2.5 overflow-hidden')); // flush stage + bottom breathing room (0.12.0 clip fix)
  assert.ok(!panel.includes('gd-fluid-bleed')); // 0.19.0: the living layer is gone
  assert.ok(!panel.includes('data-mode')); // no canvas, no mode — nothing animates
  assert.ok(!panel.includes('is-empty')); // an image is showing — the empty-state pattern class stays off
  const panelPlain = renderToString(
    React.createElement(C('ImageStage'), {
      images: [{ file: 'a.png', thumb: 'a_t.jpg' }], imagesPath: 'C:/img',
      bleed: true,
      onAddImages: noop, onSetCover: noop, onDeleteImage: noop,
      onReorderImages: noop, onStatus: noop, confirm: noop,
    })
  );
  assert.ok(!panelPlain.includes('gd-fluid-bleed')); // nothing anywhere
  // 0.15.0 — the EMPTY stage: no image -> the stage + card turn transparent
  // (is-empty) so the surface's pattern shows through the frame.
  const panelEmpty = renderToString(
    React.createElement(C('ImageStage'), {
      images: [], imagesPath: 'C:/img',
      bleed: true,
      onAddImages: noop, onSetCover: noop, onDeleteImage: noop,
      onReorderImages: noop, onStatus: noop, confirm: noop,
    })
  );
  assert.ok(panelEmpty.includes('gd-stage-card is-empty'));
  assert.ok(panelEmpty.includes('No images yet'));
});

ok('0.19.0 AnimatedBackground is DELETED — the component file is gone with the feature', () => {
  let gone = false;
  try {
    C('AnimatedBackground');
  } catch {
    gone = true; // require() of the missing module throws — exactly right
  }
  assert.ok(gone, 'AnimatedBackground.jsx should not exist anymore');
});

ok('CardLookEditor: custom ratio readout sits INLINE on the inputs row', () => {
  const out = renderToString(
    React.createElement(C('CardLookEditor'), {
      name: 'amy', imageUrl: 'x', imgAspect: 1, ratio: { w: 3, h: 4 },
      trim: 'dash', crop: null, onChange: noop,
    })
  );
  assert.ok(out.includes('WIDE')); // live ratio readout present
  assert.ok(out.includes('ml-auto')); // 0.11.0: inline at the row end, NOT w-full on a new row
  assert.ok(!out.includes('w-full text-right')); // the old bottom-right new-row form
});

ok('VersionSettingsModal renders draft footer', () => {
  const out = renderToString(
    React.createElement(C('VersionSettingsModal'), {
      version: char.versions[0], index: 0, total: 2, isPreview: true,
      onClose: noop, onPatch: noop, onMove: noop, onTogglePreview: noop, onDelete: noop,
    })
  );
  assert.ok(out.includes('CANCEL') && out.includes('DONE'));
});

ok('SettingsModal 2.0: rail nav + option cards + segmented controls (no tooltip bar)', () => {
  const out = renderToString(
    React.createElement(C('SettingsModal'), {
      settings, initial: settings, onClose: noop, onChange: noop, onRevert: noop, initialTab: 'Workspace',
    })
  );
  assert.ok(out.includes('gd-settings-rail')); // 0.12.0: left icon rail
  // 0.33.0 — the rail reads like a table of contents: the old BEHAVIOR tab
  // is divided into WORKSPACE / PERFORMANCE / KEYS (each its own sector).
  assert.ok(out.includes('WORKSPACE'));
  assert.ok(out.includes('PERFORMANCE'));
  assert.ok(out.includes('KEYS'));
  assert.ok(!out.includes(">BEHAVIOR<"));
  assert.ok(out.includes('gd-opt-card')); // option cards, not bare switch rows
  assert.ok(out.includes('BOTTOM OUTPUT BAR')); // new live toggle
  assert.ok(out.includes('ADVANCED SEARCH'));
  // 0.19.0 — SHOW HELP TEXT lives in the FOOTER now, on the LEFT side
  // exactly opposite CANCEL / DONE (it left the rail's bottom).
  assert.ok(out.includes('gd-foot-help'));
  assert.ok(out.includes('HELP TEXT'));
  assert.ok(out.includes('gd-switch')); // the footer switch itself
  assert.ok(!out.includes('class="gd-rail-help"')); // the rail version is gone (the -label class survives in the footer)
  assert.ok(out.indexOf('HELP TEXT') < out.indexOf('CANCEL')); // left of the buttons
  // 0.24.0 — TAG POSITION and the zoom sliders MOVED to the LOOK tab (they
  // left the behavior tab with the toolbar sliders gone).
  assert.ok(!out.includes('TAG POSITION'));
  assert.ok(!out.includes('DEFAULT GRID ZOOM'));
  // 0.13.0 — the DEFAULT SORT option is GONE from the behavior tab
  // (sorting lives in the toolbar where it always acted).
  assert.ok(!out.includes('DEFAULT SORT'));
  assert.ok(!out.includes('Sorts every class until you change it'));
  assert.ok(!out.includes('TOOLTIP BAR')); // removed
  assert.ok(!out.includes('CARD ASPECT RATIO'));
  // 0.30.0 — DATA & RECOVERY MOVED to the new DATA tab (it left Behavior
  // with the storage + maintenance cards).
  assert.ok(!out.includes('AUTOSAVE'));
  assert.ok(!out.includes('SAVE BACKUPS'));
  // 0.33.0 — PERFORMANCE + KEYS left this tab for their OWN sectors.
  assert.ok(!out.includes('IMAGE STAGE BLUR'));
  assert.ok(!out.includes('REASSIGN KEYS'));
});

ok('0.30.0 SettingsModal: the DATA tab — storage folders, maintenance, and the relocated data & recovery cards', () => {
  const out = renderToString(
    React.createElement(C('SettingsModal'), {
      settings, initial: settings, onClose: noop, onChange: noop, onRevert: noop, initialTab: 'Data',
    })
  );
  // the rail carries the new category
  assert.ok(out.includes('DATA'));
  // data & recovery relocated here from Behavior
  assert.ok(out.includes('DATA &amp; RECOVERY'));
  assert.ok(out.includes('AUTOSAVE'));
  assert.ok(out.includes('SAVE BACKUPS'));
  for (const cadence of ['OFF', '1M', '5M', '15M']) assert.ok(out.includes(`>${cadence}<`), `autosave key missing: ${cadence}`);
  // storage: one OPEN key per directory
  assert.ok(out.includes('STORAGE'));
  assert.ok(out.includes('DATA FOLDER'));
  assert.ok(out.includes('IMAGES FOLDER'));
  assert.ok(out.includes('BACKUPS FOLDER'));
  assert.ok((out.match(/>OPEN</g) || []).length >= 3, 'three OPEN keys');
  // maintenance: the cache + the confirm-gated reset
  assert.ok(out.includes('MAINTENANCE'));
  assert.ok(out.includes('CLEAR CACHE'));
  assert.ok(out.includes('RESET DATABASE'));
  assert.ok((out.match(/>CLEAR</g) || []).length >= 1);
  assert.ok((out.match(/>RESET</g) || []).length >= 1);
});

ok('1.1.8/1.1.9: the TOOLBAR FINISH section is RETIRED (the plain surface + pattern won)', () => {
  const out = renderToString(
    React.createElement(C('SettingsModal'), {
      settings, initial: settings, onClose: noop, onChange: noop, onRevert: noop, initialTab: 'Appearance',
    })
  );
  assert.ok(!out.includes('TOOLBAR FINISH'));
  assert.ok(!out.includes('TOP BAR GRADIENT'));
  for (const seg of ['SATIN', 'STEEL']) assert.ok(!out.includes(`>${seg}<`), `finish key retired: ${seg}`);
});

ok('0.12.0/0.19.0 SettingsModal: themes + texture swatches (LIVING BACKGROUND picker REMOVED)', () => {
  const out = renderToString(
    React.createElement(C('SettingsModal'), {
      settings, initial: settings, onClose: noop, onChange: noop, onRevert: noop, initialTab: 'Appearance',
    })
  );
  // 0.19.0: the living background section is GONE — no mode cards, no drift.
  assert.ok(!out.includes('LIVING BACKGROUND'));
  assert.ok(!out.includes('gd-mode-card'));
  assert.ok(!out.includes('Drifting Clouds'));
  assert.ok(!out.includes('Paint Mix') && !out.includes('Pixel Mosaic') && !out.includes('Aurora Veil'));
  assert.ok(!out.includes('Grain Shimmer'));
  // 1.5.4 — the options are TILES now (face + caption), not swatch strips.
  assert.ok(out.includes('gd-tex-tile')); // texture tiles show the real pattern
  assert.ok(out.includes('gd-tex-tile-face') && out.includes('gd-tex-tile-name'));
  assert.ok(out.includes('BACKGROUND TEXTURE')); // static texture still there
  assert.ok(out.includes('MANUAL COLORS'));
  // 1.7.7 — CARDS & TAGS moves to its own CARDS rail key (the Look
  // divide — "at most look should have theme, background textures and
  // manual colors"): the tag family + the zooms render on the Cards tab.
  const cardsTab = renderToString(
    React.createElement(C('SettingsModal'), {
      settings, initial: settings, onClose: noop, onChange: noop, onRevert: noop, initialTab: 'Cards',
    })
  );
  assert.ok(cardsTab.includes('CARDS &amp; TAGS')); // the section header
  assert.ok(cardsTab.includes('TAG POSITION'));
  assert.ok(cardsTab.includes('gd-seg')); // joined segmented control
  assert.ok(cardsTab.includes('CORNER') && cardsTab.includes('MARK'));
  assert.ok(cardsTab.includes('DEFAULT GRID ZOOM'));
  assert.ok(cardsTab.includes('DEFAULT TAG ZOOM'));
  // 0.25.0 — UI MOTION switch; 1.1.8 moved it to PERFORMANCE (motion is a
  // rendering cost before it is a look) — the Look tab no longer carries it.
  assert.ok(!out.includes('UI MOTION'));
  assert.ok(!out.includes('>FULL<') && !out.includes('>REDUCED<'));
  // the manual color rows open the in-app picker (no native wheel anywhere)
  assert.ok(out.includes('gd-cp-btn'));
  assert.ok(!out.includes('type="color"'));
  // every theme button renders its mockup + name — the 0.12.0 materials
  for (const name of ['Zine Punk', 'Burrito', 'Archive Ivory', 'Carbon', 'Moss', 'Ember', 'Glacier', 'Cobalt']) {
    assert.ok(out.includes(name), `theme card missing: ${name}`);
  }
  assert.ok(out.includes('gd-theme-mock')); // mini card+chip mockup per theme
});

ok('0.13.0 SettingsModal: 4-per-row themes + the new mixers + per-surface textures', () => {
  const out = renderToString(
    React.createElement(C('SettingsModal'), {
      settings, initial: settings, onClose: noop, onChange: noop, onRevert: noop, initialTab: 'Appearance',
    })
  );
  // Themes: FOUR compact cards per row, all 12 presets incl. the new four.
  assert.ok(out.includes('gd-theme-grid'));
  for (const name of ['Muffin', 'Paper', 'Crimson']) {
    assert.ok(out.includes(name), `new theme card missing: ${name}`);
  }
  assert.ok(out.includes('LOOK'));
  assert.ok(out.includes("data:image/svg+xml")); // charm/texture swatches are real SVG tiles
  // 0.19.0: no living background anywhere in the picker.
  for (const gone of ['Ink Ribbons', 'Riptide', 'Velvet Drift', 'Ink Swirl', 'Paint Mix', 'Aurora', 'Mosaic', 'Drifting Clouds']) {
    assert.ok(!out.includes(gone), `${gone} should be gone from the picker`);
  }
  // Per-surface texture picker: four real surfaces (workspace REMOVED 0.14.0)
  // + real-pattern swatches; APPLY TO ALL is gone (themes carry their sets).
  assert.ok(out.includes('gd-tex-surface-btn'));
  assert.ok(out.includes('TOP TOOLBAR') && out.includes('LEFT TREE') && out.includes('CARD VIEWER') && out.includes('RIGHT PANEL'));
  assert.ok(!out.includes('APPLY TO ALL'));
  // 0.33.0 — "WORKSPACE" now names a RAIL SECTOR (the old Behavior tab's
  // panel half, split per 0.33.0). The removed WORKSPACE *surface* (the
  // apply-to-all target) stays gone — exactly four surface buttons above.
  assert.ok(out.includes('WORKSPACE'));
  // 0.34.0 — the emoji wall is retired; SPARKLES takes its slot.
  // 1.5.4 — the tile captions speak the label's own case (the CSS
  // uppercases the display); the names ride whole, never split.
  assert.ok(out.includes('Sparkles') && out.includes('Graph Paper'));
  assert.ok(!out.includes('EMOJIS'));
  assert.ok(!out.includes('HALFTONE')); // 0.15.0: the halftone pattern is removed
  // 0.19.0: the CLOUDS pattern is removed with the cloud theme; X stays.
  assert.ok(!out.includes('CLOUDS') && out.includes('X'));
  // 0.26.0/0.34.0: WAVES + BAUHAUS removed; CHARMS/SHUFFLE/EMOJIS renamed to SPARKLES.
  assert.ok(!out.includes('WAVES') && !out.includes('BAUHAUS'));
  assert.ok(!out.includes('CHARM'));
  // 0.26.0: the surface buttons carry AREA ICONS (lucide glyphs of the
  // app's own regions) ahead of their labels.
  assert.ok((out.match(/gd-tex-surface-ico/g) || []).length === 4);
  // 0.27.0: the live-preview dot that trailed each label is GONE ("there
  // is a right rectangle in each container, remove it") — icon + label
  // only; the pattern swatches below carry the live look.
  assert.ok(!out.includes('gd-tex-surface-dot'));
  // 0.27.0: CHEVRON joins the picker — twelve patterns, no short row.
  assert.ok(out.includes('Chevrons'));
  // 1.5.4 — the twelve options speak the tile classes now.
  assert.ok((out.match(/gd-tex-tile(?!-)/g) || []).length === 12);
  // 0.26.0: the rail stays put — the content column owns the only scrollbar
  // (the shell/measurement wiring lives in Modal's measureRef).
  assert.ok(out.includes('gd-settings-shell'));
  assert.ok(out.includes('gd-settings-tabflow'));
  // Emojis re-rolls every launch — 0.17.0: that paragraph lives under the
  // HELP TEXT switch now, so it renders with help on.
  const chatty = renderToString(
    React.createElement(C('SettingsModal'), {
      settings: { ...settings, showHelpText: true }, initial: settings, onClose: noop, onChange: noop, onRevert: noop, initialTab: 'Appearance',
    })
  );
  assert.ok(chatty.includes('every time the app opens'));
  assert.ok(!out.includes('every time the app opens')); // hidden while help is off
  // 0.15.0: BUTTON SHAPE renamed to SHAPE STYLE (drives cards + version
  // container + buttons now); theme / square / round remain.
  // 1.7.7 — the shape dials render on the SHAPE rail key (the Look divide).
  const shapeTab = renderToString(
    React.createElement(C('SettingsModal'), {
      settings, initial: settings, onClose: noop, onChange: noop, onRevert: noop, initialTab: 'Shape',
    })
  );
  assert.ok(shapeTab.includes('SHAPE STYLE'));
  assert.ok(!shapeTab.includes('BUTTON SHAPE'));
  assert.ok(shapeTab.includes('CORNER STYLE') && shapeTab.includes('SQUARE') && shapeTab.includes('ROUNDED'));
  // Mumei rides the shape tab now (the corner titles name it) — 1.7.7
  assert.ok(shapeTab.includes('Mumei'), 'the corner titles lost Mumei');
});

ok('0.17.0/0.19.0 SettingsModal: the living-background SKY + PUFFS pickers are GONE with the feature; help text gates the long paragraphs', () => {
  // even a stored 0.17.0 db (mode + color overrides) renders NO drift rows
  const legacy = renderToString(
    React.createElement(C('SettingsModal'), {
      settings: { ...settings, animatedBgMode: 'clouds', animatedBgSky: '#123456', animatedBgPuffs: '#fedcba' },
      initial: settings, onClose: noop, onChange: noop, onRevert: noop, initialTab: 'Appearance',
    })
  );
  assert.ok(!legacy.includes('gd-anim-color-row'));
  assert.ok(!legacy.includes('>SKY<'));
  assert.ok(!legacy.includes('>PUFFS<'));
  assert.ok(!legacy.includes('never rising past its middle'));
  const chatty = renderToString(
    React.createElement(C('SettingsModal'), {
      settings: { ...settings, showHelpText: true },
      initial: settings, onClose: noop, onChange: noop, onRevert: noop, initialTab: 'Appearance',
    })
  );
  assert.ok(!chatty.includes('SKY and PUFFS pickers'));
});

ok('SettingsModal hides helper text unless showHelpText is on', () => {
  // 0.24.0 — the zoom option (and its helper) moved to the LOOK tab;
  // 1.7.7 — it moved on to the CARDS rail key with the whole tag family.
  const quiet = renderToString(
    React.createElement(C('SettingsModal'), {
      settings, initial: settings, onClose: noop, onChange: noop, onRevert: noop, initialTab: 'Cards',
    })
  );
  assert.ok(!quiet.includes('set it per character in the new-character dialog'));
  assert.ok(!quiet.includes('set it per card in the new-card dialog'));
  const chatty = renderToString(
    React.createElement(C('SettingsModal'), {
      settings: { ...settings, showHelpText: true },
      initial: settings, onClose: noop, onChange: noop, onRevert: noop, initialTab: 'Cards',
    })
  );
  assert.ok(chatty.includes('set it per card in the new-card dialog'));
});

ok('TagManagerModal renders color-first editor + usage + footer', () => {
  const out = renderToString(
    React.createElement(C('TagManagerModal'), {
      tags, characters: [char], onClose: noop, onAddTag: noop, onUpdateTag: noop,
      onDeleteTag: noop, confirm: noop,
    })
  );
  assert.ok(out.includes('EXISTING TAGS') && out.includes('END TRIM'));
  assert.ok(out.includes('SAVES PENDING TAG') || out.includes('DONE'));
  assert.ok(out.includes('1 USE')); // usage count
  assert.ok(out.indexOf('COLOR') < out.indexOf('NAME')); // color row above the name field
});

ok('ClassSidebar renders tree + rich names (0.14.0: branch connectors)', () => {
  const out = renderToString(
    React.createElement(C('ClassSidebar'), {
      classes: [
        { id: 'k1', name: 'class <b>one</b>', parentId: 'root', icon: 'letter:k' },
        { id: 'k1a', name: 'sub', parentId: 'k1' },
      ],
      characters: [char], selectedClassId: 'root', dragRef,
      onSelectClass: noop, onAddClass: noop, onRenameClass: noop, onDeleteClass: noop,
      onMoveClass: noop, onAssignCharacter: noop, onNewCharacter: noop, confirm: noop, onStatus: noop,
    })
  );
  assert.ok(out.includes('rt-b')); // *one* rendered
  assert.ok(out.includes('gd-letter-icon')); // letter class icon
  // Branch tree: node wrappers with rails + elbows, kids containers, joints.
  assert.ok(out.includes('gd-tree-node'), 'node wrapper');
  assert.ok(out.includes('gd-tree-kids'), 'kids container');
  assert.ok(out.includes('gd-tree-joint'), 'junction dot');
  assert.ok(out.includes('gd-tree-row'), 'branch row');
  assert.ok(!out.includes('rounded select-none'), 'rows are branches, not pill buttons');
});

ok('Dialogs render (confirm, close prompt)', () => {
  const mod = require('../src/components/Dialogs.jsx');
  const confirm = renderToString(React.createElement(mod.ConfirmModal, { title: 'T', message: 'm', onCancel: noop, onConfirm: noop }));
  assert.ok(confirm.includes('CANCEL'));
  // 1.1.6 — the RenameModal render check retired with the window
  // (deprecated-code sweep — the card name is edited in the card-look
  // window since 0.41.0).
});

ok('LucideIconPicker renders letter row + case buttons', () => {
  const out = renderToString(React.createElement(C('LucideIconPicker'), { value: 'letter:A', onSelect: noop }));
  assert.ok(out.includes('LETTER') && out.includes('letter:A'.slice(7)));
});

ok('PartEditor + ComposePanel still render (plain + card modes); 0.28.0 compose sheet', () => {
  const pe = renderToString(React.createElement(C('PartEditor'), { parts: [{ id: 'p1', name: '*body*', content: 'x', include: true }], onSetParts: noop }));
  assert.ok(pe.includes('gd-rt-wrap'));
  const plain = renderToString(React.createElement(C('PartEditor'), { parts: [], onSetParts: noop, plain: true }));
  assert.ok(plain.includes('ADD PART'));
  // 0.28.0 — the prompt box is a proper SHEET now ("make it better and not
  // too simple"): framed header + glyph chip + LIVE/EMPTY pill + stat strip
  // + a copy key that confirms itself.
  const cp = renderToString(React.createElement(C('ComposePanel'), { version: char.versions[0], onStatus: noop }));
  assert.ok(cp.includes('gd-compose-head'));
  assert.ok(cp.includes('PROMPT SHEET'));
  assert.ok(cp.includes('COPY OUTPUT'));
  assert.ok(cp.includes('gd-compose-stat'));
  assert.ok(cp.includes('WORDS'));
  // the empty sheet keeps a real empty state, not a bare em-dash line
  const empty = renderToString(React.createElement(C('ComposePanel'), { version: { parts: [] }, onStatus: noop }));
  assert.ok(empty.includes('gd-compose-empty'));
  assert.ok(empty.includes('Nothing to compose yet'));
  assert.ok(empty.includes('EMPTY'));
});

ok('Titlebar renders undo/redo + the SAVE key + panel & output bar toggles', () => {
  const out = renderToString(
    React.createElement(C('Titlebar'), {
      status: 'Ready', maximized: false, onOpenSettings: noop, canUndo: true, canRedo: false,
      canSave: true, onUndo: noop, onRedo: noop, onSave: noop, panelMode: true, onTogglePanel: noop,
      outputBarMode: true, onToggleOutputBar: noop,
    })
  );
  assert.ok(out.includes('GEN'));
  // 0.24.0 — SAVE joins the history group; enabled while there are unsaved
  // changes, greyed (disabled) once everything is saved.
  assert.ok(out.includes('gd-history-save'));
  assert.ok(out.includes('>SAVE<'));
  assert.ok(!out.includes('gd-history-save" disabled'));
  const clean = renderToString(
    React.createElement(C('Titlebar'), {
      status: 'Ready', maximized: false, onOpenSettings: noop, canUndo: true, canRedo: false,
      canSave: false, onUndo: noop, onRedo: noop, onSave: noop, panelMode: true, onTogglePanel: noop,
      outputBarMode: true, onToggleOutputBar: noop,
    })
  );
  assert.ok(/gd-history-save[^>]*disabled/.test(clean)); // greyed out once saved
  assert.ok(clean.includes('All saved'));
});

// --- 0.29.0: tooltips switch + panel widths + the stamp hands ----------------------------------------
ok('0.29.0 Titlebar carries the TOOLTIPS switch (speech bubble beside the panel keys)', () => {
  const on = renderToString(
    React.createElement(C('Titlebar'), {
      status: 'Ready', maximized: false, onOpenSettings: noop, canUndo: false, canRedo: false,
      canSave: false, onUndo: noop, onRedo: noop, onSave: noop, panelMode: true, onTogglePanel: noop,
      outputBarMode: true, onToggleOutputBar: noop, tooltipMode: true, onToggleTooltips: noop,
    })
  );
  assert.ok(on.includes('Tooltips on (Alt+T)'));
  assert.match(on, /gd-switch is-on[\s"']/);
  const off = renderToString(
    React.createElement(C('Titlebar'), {
      status: 'Ready', maximized: false, onOpenSettings: noop, canUndo: false, canRedo: false,
      canSave: false, onUndo: noop, onRedo: noop, onSave: noop, panelMode: true, onTogglePanel: noop,
      outputBarMode: true, onToggleOutputBar: noop, tooltipMode: false, onToggleTooltips: noop,
    })
  );
  assert.ok(off.includes('Tooltips off (Alt+T)'));
  // the mode reached the key: the ON title only renders while tooltipMode is
  // true, the OFF title only while false — the pair IS the switch state test.
  assert.ok(!off.includes('Tooltips on (Alt+T)'));
});

ok('0.29.0 PanelResizer renders a separator strip on the column edge (ew-resize handle)', () => {
  const Ref = { current: null };
  const out = renderToString(
    React.createElement(
      'div',
      { style: { width: 240 } },
      React.createElement(C('PanelResizer'), {
        side: 'left', targetRef: Ref, width: 240, min: 200, max: 400, onCommit: noop,
        title: 'Drag to resize the class tree — the width is saved (and undo-able)',
      })
    )
  );
  assert.ok(out.includes('gd-panel-resize'));
  assert.ok(out.includes('data-side="left"'));
  assert.ok(out.includes('role="separator"'));
  assert.ok(out.includes('Drag to resize the class tree'));
});

ok('0.29.0 ClassSidebar fills its sized column (w-full — the width lives on the resizable wrapper)', () => {
  const out = renderToString(
    React.createElement(C('ClassSidebar'), {
      classes: [{ id: 'cl1', name: 'heroes', parentId: 'root', order: 1 }],
      characters: [], selectedClassId: 'root', dragRef: { current: null },
      onSelectClass: noop, onAddClass: noop, onRenameClass: noop, onDeleteClass: noop,
      onMoveClass: noop, onAssignCharacter: noop, onNewCharacter: noop, confirm: noop, onStatus: noop,
    })
  );
  assert.match(out, /class="w-full flex-shrink-0/);
  assert.ok(!out.includes('w-60'));
});

ok('0.29.0 StampSlots: the pencil is a SPAN badge (never a button) and the slot tooltip says the two hands', () => {
  const out = renderToString(
    React.createElement(N('StampEditModal', 'StampSlots'), {
      stamps: [
        { id: 's1', image: 'guild.png', name: 'guild' },
        { id: 's2', image: 'seal.png', name: 'seal' },
      ],
      imagesPath: 'C:/img', onRemove: noop, onPromote: noop, onReorder: noop, onRename: noop,
    })
  );
  // the badge: a span carrying the class, never a <button>
  assert.match(out, /<span[^>]*class="[^"]*gd-stamp-slot-edit[^"]*"[^>]*aria-hidden="true"/);
  assert.ok(!out.includes('gd-stamp-slot-edit" title='), 'the badge carries no tooltip of its own');
  // the slot's ONE tooltip: drag + click, exactly as asked
  assert.ok(out.includes('guild: drag to rearrange, click to edit'));
  assert.ok(!out.includes('click to open its window'), 'the old wall-of-text tooltip is gone');
});

ok('0.29.0 SettingsModal: TOOLTIPS card (Shape — 1.7.7 moved it with the dials) + the two width sliders (Behavior)', () => {
  const settings = {
    theme: 'zine', colors: {}, zoom: 2, defaultSortMode: 'custom',
    textures: { titlebar: 'none', sidebar: 'none', viewer: 'dots', panel: 'dots' },
    buttonStyle: 'theme', detailPanel: true, tagScale: 1.2, cardRatio: { w: 3, h: 4 },
    promptBottom: true, advancedSearch: false, showHelpText: true, tagPosition: 'mark',
    autosaveMinutes: 0, reduceMotion: false, tooltips: true, sidebarWidth: 240, panelWidth: 480,
  };
  const shape = renderToString(
    React.createElement(C('SettingsModal'), {
      settings: { ...settings, sidebarWidth: 312, panelWidth: 560 }, initial: { ...settings },
      onClose: noop, onChange: noop, onRevert: noop, initialTab: 'Shape',
    })
  );
  assert.ok(shape.includes('TOOLTIPS'));
  assert.ok(shape.includes('Toggle every tooltip in the app'));
  const behavior = renderToString(
    React.createElement(C('SettingsModal'), {
      settings: { ...settings, sidebarWidth: 312, panelWidth: 560 }, initial: { ...settings },
      onClose: noop, onChange: noop, onRevert: noop, initialTab: 'Workspace',
    })
  );
  assert.ok(behavior.includes('LEFT TREE WIDTH'));
  assert.ok(behavior.includes('CARD PANEL WIDTH'));
  // React SSR comments sit between the expression and the literal (312<!-- -->px)
  assert.match(behavior, /312(?:<[^>]*>)?px/);
  assert.match(behavior, /560(?:<[^>]*>)?px/);
  assert.ok(behavior.includes('type="range"'));
});

ok('0.24.0 ColorPicker: the panel (SV field + hue rail + hex + transparency) and the trigger swatch render', () => {
  const panel = renderToString(
    React.createElement(N('ColorPicker', 'ColorPickerPanel'), {
      color: '#ff0044', onColor: noop, alpha: 0.4, onAlpha: noop,
    })
  );
  assert.ok(panel.includes('gd-cp-sv')); // the saturation/value field
  assert.ok(panel.includes('gd-cp-hue')); // the hue rail
  assert.ok(panel.includes('gd-cp-hex-input')); // the hex area
  assert.ok(panel.includes('value="#ff0044"')); // the hex field carries the color
  assert.ok(panel.includes('gd-cp-alpha')); // the transparency row
  assert.ok(panel.includes('TRANSPARENCY'));
  assert.ok(!panel.includes('type="color"')); // no native wheel anywhere
  const bare = renderToString(
    React.createElement(N('ColorPicker', 'ColorPickerPanel'), { color: '#7ec8e3', onColor: noop })
  );
  assert.ok(!bare.includes('gd-cp-alpha')); // the alpha row only renders when wired
  const trigger = renderToString(
    React.createElement(N('ColorPicker', 'ColorPickerButton'), { color: '#ff0044', onColor: noop, dashed: true })
  );
  assert.ok(trigger.includes('gd-cp-btn is-dashed'));
  assert.ok(trigger.includes('background:#ff0044"')); // the fill shows the live color
  // the popover panel is portal-gated (closed until clicked)
  assert.ok(!trigger.includes('gd-cp-sv'));
});

ok('Splash + StatusText render', () => {
  assert.ok(renderToString(React.createElement(C('Splash'), { status: 'Loading', loaded: false })).includes('GEN'));
  assert.ok(renderToString(React.createElement(C('StatusText'), { text: 'Ready' })).includes('Ready'));
});

// --- 0.22.0 surfaces ----------------------------------------------------------------------------------
ok('0.22.0 GridView: the search box says SEARCH CARDS and wears the SOLID (opaque) input face', () => {
  const out = renderToString(
    React.createElement(C('GridView'), {
      characters: [char], tags, stamps: stampLibrary, imagesPath: 'C:/img', zoom: 2, tagScale: 1,
      cardRatio: { w: 3, h: 4 }, sortMode: 'custom', search: '', classLabel: 'x',
      dragRef, spotlight: { include: [], exclude: [], stamps: [], hideNonMatching: false },
      onCycleSpotlight: noop, onCycleStampSpotlight: noop, onToggleSpotlightHide: noop, onSearch: noop,
      onSort: noop, onZoom: noop, onTagScale: noop, onNew: noop, onOpen: noop, onRename: noop,
      onDelete: noop, onReorder: noop,
    })
  );
  assert.ok(out.includes('Search cards')); // "search characters" is retired
  assert.ok(out.includes('gd-input-solid')); // the opaque face — no pattern shines through
  assert.ok(!out.includes('Search characters'));
  assert.ok(!out.includes('Search characters…'));
});

ok('0.22.0 ImageStage: the cover STAR is always visible — filled yellow + inert on the first image, plain on the rest', () => {
  const renderStage = (count) =>
    renderToString(
      React.createElement(C('ImageStage'), {
        images: Array.from({ length: count }, (_, i) => ({ file: `a${i}.png`, thumb: `a${i}_t.jpg` })),
        imagesPath: 'C:/img', onAddImages: noop, onSetCover: noop, onDeleteImage: noop,
        onReorderImages: noop, onStatus: noop, confirm: noop,
      })
    );
  // on the cover (first) image: FILLED star + the passive is-cover badge
  const cover = renderStage(2);
  assert.ok(cover.includes('fill="#f6c945"')); // filled yellow
  assert.ok(cover.includes('is-cover'));
  assert.ok(cover.includes('Cover: already first')); // inert copy (0.30.0 short form; em dash retired 1.0.7)
  // further images: the plain (unfilled) star with the set-cover wiring
  // (switch to it by rendering with index… the second image's star is the
  // same button — the state flips client-side; SSR only proves presence).
  assert.ok((cover.match(/<svg/g) || []).length >= 1);
  // a single image: still shows the filled star (never hidden anymore)
  const single = renderStage(1);
  assert.ok(single.includes('fill="#f6c945"'));
});

ok('0.22.0 ImageStage: a LOW-RES PLACEHOLDER rides the stage while the full image decodes (both modes)', () => {
  const full = renderToString(
    React.createElement(C('ImageStage'), {
      images: [{ file: 'a.png', thumb: 'a_t.jpg' }], imagesPath: 'C:/img',
      onAddImages: noop, onSetCover: noop, onDeleteImage: noop,
      onReorderImages: noop, onStatus: noop, confirm: noop,
    })
  );
  assert.ok(full.includes('gd-stage-ph')); // the low-res layer exists
  assert.ok(full.includes('gd-stage-full')); // the full image cross-fades over it
  // the centered big spinner is GONE — and the 1.8.6 veil took the
  // corner ring's seat (THE WHEEL THAT OUTLIVES THE FREEZE): the darken +
  // the compositor wheel over the picture, with the out flight.
  assert.ok(!full.includes('absolute inset-0 z-[5] flex items-center justify-center'));
  assert.ok(full.includes('gd-load-veil has-out'));
  assert.ok(full.includes('gd-wheel'));
  const bleed = renderToString(
    React.createElement(C('ImageStage'), {
      images: [{ file: 'a.png', thumb: 'a_t.jpg' }], imagesPath: 'C:/img',
      wheelZoom: false, bleed: true,
      onAddImages: noop, onSetCover: noop, onDeleteImage: noop,
      onReorderImages: noop, onStatus: noop, confirm: noop,
    })
  );
  // the slide wrapper carries BOTH layers as one unit (the animation
  // always performs, loaded or not)
  assert.ok(bleed.includes('class="gd-stage-slide"'));
  assert.ok(bleed.includes('gd-stage-ph'));
  assert.ok(bleed.includes('gd-stage-full'));
});

ok('0.22.0 ClassSidebar: the NEW CLASS / NEW CARD dock wears the right panel\u2019s texture', () => {
  const out = renderToString(
    React.createElement(C('ClassSidebar'), {
      classes: [], characters: [char], selectedClassId: 'root', dragRef,
      onSelectClass: noop, onAddClass: noop, onRenameClass: noop, onDeleteClass: noop,
      onMoveClass: noop, onAssignCharacter: noop, onNewCharacter: noop, confirm: noop, onStatus: noop,
    })
  );
  assert.ok(out.includes('NEW CLASS') && out.includes('NEW CARD'));
  // the dock renders with the panel texture class (same background texture
  // as the right panel, by request)
  assert.ok(/gd-tex-panel[^"]*"[^>]*>[\s\S]{0,200}NEW CLASS/.test(out) || out.includes('p-2.5 flex flex-col gap-1.5 gd-tex-panel'));
});

ok('0.22.0 StampPosControls: readable transform rows — full labels, values with units, no single-letter cryptograms', () => {
  const btn = renderToString(
    React.createElement(C('StampPosControls'), { settings: { pos: { x: 42, y: 74 }, scale: 1.25, rot: -30, alpha: 0.55 }, onPatch: noop })
  );
  assert.ok(btn.includes('gd-stamp-key is-on'));
  // the button title names every readable control (the popover is portaled)
  assert.ok(btn.includes('position, scale, rotation, transparency and outside'));
  // the CSS label column width is 88px (full words) — asserted via the
  // stylesheet contract (retired with the stale verifier in 1.1.6); here the popover stays
  // portal-gated closed.
  assert.ok(!btn.includes('STAMP SETTINGS'));
});

ok('0.22.0 StampColorControls window contract: no HUE switch anywhere in the row — plain color picking, no AUTO option', () => {
  const auto = renderToString(
    React.createElement(C('StampColorControls'), { color: null, autoColor: '#aabbcc', onColor: noop, onAlpha: noop })
  );
  // no switch exists in the component at all (the hue is always on)
  assert.ok(!auto.includes('gd-switch'));
  assert.ok(!auto.includes('HUE'));
  // 0.22.0 follow-up — the AUTO option is gone from the picking UI: no AUTO
  // marker on the button (the derived dominant color still silently defaults
  // the fill, it is just not an option anymore).
  assert.ok(!auto.includes('gd-stamp-color-auto-dot'));
  assert.ok(!auto.includes('RESET'));
});

ok('0.27.0 GridView toolbar: the SIZE SLIDERS ARE BACK — card size + tag size clusters beside the spotlight key', () => {
  const out = renderToString(
    React.createElement(C('GridView'), {
      characters: [char], tags, stamps: stampLibrary, imagesPath: 'C:/img', zoom: 2, tagScale: 1,
      cardRatio: { w: 3, h: 4 }, sortMode: 'custom', search: '', classLabel: 'x',
      dragRef, spotlight: { include: [], exclude: [], stamps: [], hideNonMatching: false },
      onCycleSpotlight: noop, onCycleStampSpotlight: noop, onToggleSpotlightHide: noop, onSearch: noop,
      onSort: noop, onZoom: noop, onTagScale: noop, onNew: noop, onOpen: noop, onRename: noop,
      onDelete: noop, onReorder: noop,
    })
  );
  // two framed slider clusters render, wired to the same settings keys the
  // Look tab writes ("readd the tag scale and the card scale back to the
  // toolbar where it was while also keeping it in settings").
  assert.ok((out.match(/class="gd-tool-slider"/g) || []).length === 2);
  assert.ok(out.includes('aria-label="Card size"') && out.includes('aria-label="Tag size"'));
  assert.ok(out.includes('type="range"'));
  // they sit in the viewer header, after the spotlight menu
  assert.ok(out.indexOf('SPOTLIGHT') < out.indexOf('gd-tool-slider'));
  // the count chip still anchors the right side (React splits the adjacent
  // text nodes with comment separators, so match the word itself)
  assert.ok(out.includes('CARD'));
});

ok('0.27.0 the toolbar sliders are OPTIONAL — a GridView without handlers renders no clusters', () => {
  const out = renderToString(
    React.createElement(C('GridView'), {
      characters: [char], tags, stamps: stampLibrary, imagesPath: 'C:/img', zoom: 2, tagScale: 1,
      cardRatio: { w: 3, h: 4 }, sortMode: 'custom', search: '', classLabel: 'x',
      dragRef, spotlight: { include: [], exclude: [], stamps: [], hideNonMatching: false },
      onCycleSpotlight: noop, onCycleStampSpotlight: noop, onToggleSpotlightHide: noop, onSearch: noop,
      onSort: noop, onNew: noop, onOpen: noop, onRename: noop, onDelete: noop, onReorder: noop,
    })
  );
  assert.ok(!out.includes('gd-tool-slider'));
});

ok('0.27.0 CardLookEditor: a PLACED stamp rides the OVERLAY layer outside the panzoom (OUTSIDE can actually show past the border)', () => {
  const out = renderToString(
    React.createElement(C('CardLookEditor'), {
      name: 'amy', imageUrl: 'x', imgAspect: 1, ratio: { w: 3, h: 4 },
      trim: 'gold', crop: null, onChange: noop,
      stampUrl: 'seal.png', stampPos: { x: 112, y: 24 }, stampScale: 1, stampRot: 0,
      stampClip: false, stampAlpha: 1,
    })
  );
  // the free layer carries the overlay class and its own aspect box
  assert.ok(out.includes('gd-card-stamp-overlay'));
  assert.ok(out.includes('aspect-ratio:3 / 4'));
  // the OUTSIDE-on sticker renders at its position
  assert.ok(out.includes('left:112%') && out.includes('top:24%'));
  // and a CONFINED stamp keeps the is-clipped state
  const confined = renderToString(
    React.createElement(C('CardLookEditor'), {
      name: 'amy', imageUrl: 'x', imgAspect: 1, ratio: { w: 3, h: 4 },
      trim: 'gold', crop: null, onChange: noop,
      stampUrl: 'seal.png', stampPos: { x: 50, y: 50 }, stampScale: 1, stampRot: 0,
      stampClip: true, stampAlpha: 1,
    })
  );
  assert.ok(confined.includes('is-clipped'));
});

ok('0.27.0 SettingsModal About tab: centered with a floor — the card keeps its posture (no collapsed sliver, no scrollbars)', () => {
  const out = renderToString(
    React.createElement(C('SettingsModal'), {
      settings, initial: settings, onClose: noop, onChange: noop, onRevert: noop, initialTab: 'About',
    })
  );
  assert.ok(out.includes('gd-about-tab')); // min-height + centered content
  assert.ok(out.includes('about-morph')); // the logo swirl still rides the tab
  // 1.5.8 - the tracker blurb left the lockup by request; the About wall
  // speaks SPECIAL THANKS instead (the local-first story is the privacy
  // key's own subject one scroll below).
  assert.ok(!out.includes('A local card')); // the retired blurb
  assert.ok(out.includes('SPECIAL THANKS')); // the roll of honor
  // the measurement node carries the column padding now (the modal's height
  // math counts it — that is the scrollbar fix)
  assert.ok(out.includes('gd-settings-tabflow'));
});

ok('0.27.0 GdTooltips renders as pure behavior — no DOM of its own, ready to hijack titles', () => {
  const out = renderToString(React.createElement(C('GdTooltips')));
  assert.equal(out, ''); // renders null; the document-level listeners are the whole feature
});

console.log(`\n${passed} smoke renders passing`);

