// render_certain_ink_196.mjs — the eye's own field: every coat on the
// WHITE plate (the report's own seat), the split volume's pair, and the
// polished emblems on every trim — one PNG for the record
// (/tmp/render/certain_ink_196.png).
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

const root = path.dirname(fileURLToPath(import.meta.url));
const tree = path.join(root, '..');

const twin = (hex6) => {
  const n = parseInt(hex6.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  if (l <= 0.5) return hex6;
  const d = mx - mn;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (mx === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  }
  const tl = 0.5 + (l - 0.5) * 0.3;
  let rgb;
  if (s === 0) rgb = [tl, tl, tl];
  else {
    const q = tl < 0.5 ? tl * (1 + s) : tl + s - tl * s;
    const p = 2 * tl - q;
    const hue = (t) => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };
    rgb = [hue(h + 1 / 3), hue(h), hue(h - 1 / 3)];
  }
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  return `#${rgb.map((v) => ch(v).toString(16).padStart(2, '0')).join('')}`;
};

const SEATS = {
  numeix: ['gd-finish-numeix', 'gd-numeix-dapple', 'gd-numeix-streams', 'gd-numeix-xmarks', 'gd-numeix-stars', 'gd-numeix-moon'],
  foil: ['gd-finish-foil', 'gd-finish-foil-ripples'],
  auric: ['gd-finish-auric', 'gd-auric-currents', 'gd-auric-flakes', 'gd-auric-sweep', 'gd-auric-summon'],
  nuri: ['gd-finish-nuri', 'gd-nuri-licks', 'gd-nuri-sparks', 'gd-nuri-flare'],
  holographic: ['gd-finish-holographic'],
  prismatic: ['gd-finish-prismatic', 'gd-prism-stars', 'gd-prism-particles', 'gd-prism-waves', 'gd-prism-sweep'],
};
const card = (finish, tint, toneClass, twinHex, strength = null, extra = '') => {
  const seats = SEATS[finish]
    .map((c) => {
      let inner = '';
      if (c === 'gd-finish-foil-ripples') {
        inner = '<span class="gd-foil-ripple" style="--gd-ripple-seat:0s"></span><span class="gd-foil-ripple" style="--gd-ripple-seat:3s"></span><span class="gd-foil-ripple" style="--gd-ripple-seat:6s"></span>';
      }
      if (c === 'gd-finish-holographic') {
        inner = '<span class="gd-holo-shards"></span><span class="gd-holo-dots"></span>';
      }
      const artVar = extra.includes('is-art-zone') || extra.includes('is-plate-only') ? ' style="--gd-art-h:160px"' : '';
      return `<span class="gd-card-face-finish ${c}${extra ? ` ${extra}` : ''}"${artVar}>${inner}</span>`;
    })
    .join('');
  return `<div class="pc${toneClass ? ` ${toneClass}` : ''}${extra.includes('split') ? ' gd-fin-split' : ''}" style="--gd-card-tint:${tint};${twinHex ? ` --gd-fin-ink:${twinHex};` : ''}${strength ? ` --gd-fin-strength:${strength.main}; --gd-fin-strength-art:${strength.art}; --gd-art-h:160px; --gd-shape-radius:10px;` : ''} background:${tint}">${seats}</div>`;
};

// the polished emblem's own ribbon (TagRibbon's geometry, hand-built)
const OUTLINE_W = 1.5;
const ribbon = (trim, s, color, ink) => {
  const w = Math.round(19 * s);
  const h = Math.round(34 * s);
  const cx = w / 2;
  const notchY = Math.round(h * 0.66);
  const r = Math.max(2, Math.round(3 * s));
  const beadR = Math.max(2.5, (w - OUTLINE_W) / 2);
  const beadCy = h - beadR - OUTLINE_W / 2;
  const stripHW = Math.max(1.5, Math.round(w * 0.27 * 100) / 100);
  const meetY = beadCy - Math.sqrt(Math.max(0, beadR * beadR - stripHW * stripHW));
  const shape =
    trim === 'v'
      ? `M ${OUTLINE_W / 2} ${OUTLINE_W / 2} L ${w - OUTLINE_W / 2} ${OUTLINE_W / 2} L ${w / 2} ${h - OUTLINE_W / 2} Z`
      : trim === 'notch'
        ? `M ${OUTLINE_W / 2} ${OUTLINE_W / 2} L ${w - OUTLINE_W / 2} ${OUTLINE_W / 2} L ${w - OUTLINE_W / 2} ${h - OUTLINE_W / 2} L ${w / 2} ${notchY} L ${OUTLINE_W / 2} ${h - OUTLINE_W / 2} Z`
        : trim === 'point'
          ? `M ${OUTLINE_W / 2} ${OUTLINE_W / 2} L ${w - OUTLINE_W / 2} ${OUTLINE_W / 2} L ${w - OUTLINE_W / 2} ${notchY} L ${w / 2} ${h - OUTLINE_W / 2} L ${OUTLINE_W / 2} ${notchY} Z`
          : trim === 'bead'
            ? `M ${cx - stripHW} ${OUTLINE_W / 2} L ${cx - stripHW} ${meetY} A ${beadR} ${beadR} 0 1 0 ${cx + stripHW} ${meetY} L ${cx + stripHW} ${OUTLINE_W / 2} Z`
            : `M ${OUTLINE_W / 2} ${OUTLINE_W / 2} L ${w - OUTLINE_W / 2} ${OUTLINE_W / 2} L ${w - OUTLINE_W / 2} ${h - r} Q ${w - OUTLINE_W / 2} ${h - OUTLINE_W / 2} ${w - r} ${h - OUTLINE_W / 2} L ${r} ${h - OUTLINE_W / 2} Q ${OUTLINE_W / 2} ${h - OUTLINE_W / 2} ${OUTLINE_W / 2} ${h - r} Z`;
  // the fit law (TagRibbon's own math)
  const m = OUTLINE_W / 2 + 0.9;
  const base = Math.round(12 * s);
  let glyphSize;
  let glyphTop;
  if (trim === 'v') {
    const a = OUTLINE_W / 2;
    const slope = (cx - a) / Math.max(1, h - OUTLINE_W);
    const t = Math.max(2, Math.round((OUTLINE_W / 2 + 1) * s));
    const g = Math.floor((2 * (cx - a - m) - 2 * slope * (t - a)) / (1 + 2 * slope));
    glyphSize = Math.max(4, Math.min(base, g));
    glyphTop = t;
  } else if (trim === 'bead') {
    const g = Math.floor((beadR - m) * 1.3); // the rim paid (TagRibbon's own law)
    glyphSize = Math.max(4, Math.min(base, g));
    glyphTop = Math.max(2, beadCy - glyphSize / 2);
  } else {
    const g = Math.floor(w - 2 * (OUTLINE_W / 2 + m));
    glyphSize = Math.max(4, Math.min(base, g));
    glyphTop = trim === 'point' ? Math.max(2, (OUTLINE_W / 2 + notchY - glyphSize) / 2) : Math.max(2, Math.round(4 * s));
  }
  const mix = (hex, target, amt) => {
    const t = target === 'white' ? 255 : 0;
    const ch = (i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amt) + t * amt);
    return `#${[ch(1), ch(3), ch(5)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  };
  const rim = ink === '#f7f1e4' ? 'rgba(23, 19, 12, 0.62)' : 'rgba(247, 241, 228, 0.66)';
  const star = `<svg width="${glyphSize}" height="${glyphSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>`;
  return `<span class="gd-ribbon-shadow" style="width:${w}px;height:${h}px;display:inline-block;margin:6px 10px;vertical-align:top">
  <svg class="gd-ribbon-shape" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="position:absolute;inset:0">
    <defs><linearGradient id="g-${trim}-${s}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${mix(color, 'white', 0.22)}"/><stop offset="0.42" stop-color="${color}"/><stop offset="1" stop-color="${mix(color, 'black', 0.24)}"/>
    </linearGradient></defs>
    <path d="${shape}" fill="url(#g-${trim}-${s})" stroke="rgba(0,0,0,0.78)" stroke-width="${OUTLINE_W}" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>
  <span class="gd-ribbon-glyph" style="top:${glyphTop}px;color:${ink};--gd-glyph-rim:${rim};--gd-glyph-size:${glyphSize}px;line-height:0">${star}</span>
</span>`;
};

/* the split volume's own PAIR (the pixel probe's builder, verbatim — the
   plate twin + the art twin, --gd-art-h threaded INLINE exactly the way
   the real CardFinishLayer threads it) */
const splitCard = (finish, tint, mainStrength, artStrength) => {
  const seats = SEATS[finish]
    .map((c) => {
      let inner = '';
      if (c === 'gd-finish-holographic') {
        inner = '<span class="gd-holo-shards"></span><span class="gd-holo-dots"></span>';
      }
      return `<span class="gd-card-face-finish ${c} is-plate-only" style="--gd-art-h:160px">${inner}</span><span class="gd-card-face-finish ${c} is-art-zone" style="--gd-art-h:160px">${inner}</span>`;
    })
    .join('');
  return `<div class="pc gd-fin-split" style="--gd-card-tint:${tint}; --gd-fin-strength:${mainStrength}; --gd-fin-strength-art:${artStrength}; --gd-art-h:160px; --gd-shape-radius:10px; background:${tint}">${seats}</div>`;
};

const WHITE = '#f7f7f7';
const finishes = Object.keys(SEATS);
const html = `<!doctype html><html><head><style>
  body { margin: 0; background: #2a2a33; font-family: sans-serif; }
  .row { display: flex; flex-wrap: wrap; gap: 12px; padding: 12px; align-items: flex-start; }
  .label { color: #bbb; font-size: 11px; letter-spacing: 0.2em; padding: 14px 0 0 14px; }
  .pc { position: relative; width: 180px; height: 250px; overflow: hidden; border-radius: 10px; }
  .ribbons { padding: 8px; }
</style></head><body>
<div class="label">THE CERTAIN INK — EVERY COAT ON THE WHITE PLATE (the twin's shadows)</div>
<div class="row">${finishes.map((f) => card(f, WHITE, 'gd-fin-ground-light', twin(WHITE))).join('')}</div>
<div class="label">THE SPLIT VOLUME — NURI (main/art: 1-0, 0-1, 1-1) + PRISMATIC (1-0, 0-1)</div>
<div class="row">
${splitCard('nuri', '#4466aa', 1, 0)}
${splitCard('nuri', '#4466aa', 0, 1)}
${splitCard('nuri', '#4466aa', 1, 1)}
${splitCard('prismatic', '#4466aa', 1, 0)}
${splitCard('prismatic', '#4466aa', 0, 1)}
</div>
<div class="label">THE POLISHED EMBLEMS — every trim at scales 1.0 and 1.6 (fit + halo + emboss)</div>
<div class="ribbons">
${['straight', 'v', 'notch', 'point', 'bead'].map((t) => ribbon(t, 1.0, '#c2544e', '#f7f1e4')).join('')}
${['straight', 'v', 'notch', 'point', 'bead'].map((t) => ribbon(t, 1.6, '#4e7ac2', '#f7f1e4')).join('')}
${['v', 'bead'].map((t) => ribbon(t, 1.6, '#e8d9a8', '#231206')).join('')}
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1240, height: 1400 } });
await page.setContent(html);
await page.addStyleTag({ path: path.join(tree, 'src/index.css') });
await page.waitForTimeout(1300);
const shot = await page.screenshot({ fullPage: true });
mkdirSync('/tmp/render', { recursive: true });
writeFileSync('/tmp/render/certain_ink_196.png', shot);
console.log('saved /tmp/render/certain_ink_196.png');
await browser.close();
