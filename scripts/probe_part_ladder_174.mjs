// 1.7.4 probe — the pink preset's ladder, before and after the contrast law.
import { partContainerFace } from '../src/utils/helpers.js';

const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};
const contrast = (a, b) => {
  const la = lum(a);
  const lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

// the OLD ladder (1.7.3 law), for the side-by-side
const oldFace = (hex) => {
  const mix = (a, b, w) => {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return '#' + pa.map((v, i) => Math.round(v * w + pb[i] * (1 - w)).toString(16).padStart(2, '0')).join('');
  };
  const face = mix(hex, '#ffffff', 1 - (0.2 + 0.34 * lum(hex)));
  const anchor = lum(face) > 0.45 ? '#101010' : '#ffffff';
  return { face, title: mix(face, anchor, 0.92), well: mix(face, anchor, 0.76), ink: lum(face) > 0.45 ? '#17130c' : '#f7f1e4' };
};

for (const [name, hex, deep] of [['PINK #ff3df5', '#ff3df5', false], ['PINK deep', '#ff3df5', true], ['PALE GOLD', '#f5d36b', false], ['NAVY deep', '#1c2e5e', true]]) {
  const o = oldFace(hex);
  const n = partContainerFace(hex, deep);
  console.log(`\n${name}${deep ? ' (DEEP)' : ''}`);
  console.log(`  OLD: title ${contrast(o.title, o.face).toFixed(2)}:1 | well ${contrast(o.well, o.face).toFixed(2)}:1 | ink ${contrast(o.ink, o.face).toFixed(2)}:1 on face`);
  console.log(`  NEW: title ${contrast(n['--part-title'], n['--part-face']).toFixed(2)}:1 | well ${contrast(n['--part-well'], n['--part-face']).toFixed(2)}:1 | line ${contrast(n['--part-line'], n['--part-face']).toFixed(2)}:1 | ink ${contrast(n['--part-ink'], n['--part-well']).toFixed(2)}:1 on well, ${contrast(n['--part-ink'], n['--part-face']).toFixed(2)}:1 on face`);
  console.log(`       face ${n['--part-face']} · title ${n['--part-title']} · well ${n['--part-well']} · line ${n['--part-line']} · ink ${n['--part-ink']}`);
}
