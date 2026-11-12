import { chromium } from 'playwright';
import path from 'node:path';
const tree = '/home/z/my-project/burrito_gendex_196';
const twin = (hex6) => {
  const n = parseInt(hex6.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const d = mx - mn; let h = 0, s = 0; const l = (mx + mn) / 2;
  if (d !== 0) {
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (mx === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  }
  const target = lum >= 0.5 ? Math.min(0.35 + 0.3 * lum, lum - 0.16) : lum + 0.16;
  const hslToRgb = (hh, ss, ll) => {
    if (ss === 0) return [ll, ll, ll];
    const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
    const p = 2 * ll - q;
    const hue = (t) => { let tt = t; if (tt < 0) tt += 1; if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt; if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6; return p; };
    return [hue(hh + 1 / 3), hue(hh), hue(hh - 1 / 3)];
  };
  const lumaAt = (ll) => { const [rr, gg, bb] = hslToRgb(h, s, ll); return 0.2126 * rr + 0.7152 * gg + 0.0722 * bb; };
  let lo = 0, hi = 1;
  for (let i = 0; i < 24; i += 1) { const mid = (lo + hi) / 2; if (lumaAt(mid) < target) lo = mid; else hi = mid; }
  const rgb = hslToRgb(h, s, (lo + hi) / 2);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  return `#${rgb.map((v) => ch(v).toString(16).padStart(2, '0')).join('')}`;
};
// one numeix card per SEAT on green (light ground)
const SEATS = ['gd-finish-numeix','gd-numeix-dapple','gd-numeix-streams','gd-numeix-xmarks','gd-numeix-stars','gd-numeix-moon'];
const PLATE = '#00ff00';
const html = `<!doctype html><html><head><style>
  body { margin: 0; background: #2a2a33; }
  #field { display: grid; grid-template-columns: repeat(3, 190px); gap: 10px; padding: 10px; }
  .pc { position: relative; width: 180px; height: 250px; overflow: hidden; border-radius: 10px; }
</style></head><body><div id="field">${SEATS.map((c) =>
  `<div class="pc gd-fin-ground-light" style="--gd-card-tint:${PLATE}; --gd-fin-ink:${twin(PLATE)}; background:${PLATE}"><span class="gd-card-face-finish ${c}"></span></div>`
).join('\n')}</div></body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 600, height: 900 } });
await page.setContent(html);
await page.addStyleTag({ path: path.join(tree, 'src/index.css') });
await page.waitForTimeout(1100);
const shot = await page.screenshot();
const sharp = (await import('sharp')).default;
const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
const pc = [0, 255, 0];
SEATS.forEach((c, i) => {
  const x0 = 10 + (i % 3) * 200 + 8, y0 = 10 + Math.floor(i / 3) * 260 + 8;
  let diff = 0, total = 0, mag = 0;
  for (let y = y0; y < y0 + 234; y += 2) for (let x = x0; x < x0 + 164; x += 2) {
    const p = (y * info.width + x) * info.channels;
    total++;
    const m = (Math.abs(data[p]-pc[0]) + Math.abs(data[p+1]-pc[1]) + Math.abs(data[p+2]-pc[2])) / 3;
    mag += m; if (m > 12) diff++;
  }
  console.log(`${c.padEnd(22)} ratio=${(diff/total*100).toFixed(1).padStart(5)}%  mag=${(mag/total).toFixed(1)}`);
});
await browser.close();
