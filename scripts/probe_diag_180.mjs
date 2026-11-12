#!/usr/bin/env node
// diagnostic — dump where the right-side wash actually lands, per x column
import { readFileSync, writeFileSync } from 'node:fs';
const CSS_PATH = process.argv[2] || '/home/z/my-project/burrito_gendex_180/src/index.css';
const CSS = readFileSync(CSS_PATH, 'utf8');

const CARD = (id, fam) => `
  <div id="${id}" class="gd-card gd-has-finish gd-fin-on-trim gd-fin-under-art" style="position:absolute; width:300px;">
    <span class="gd-card-face-finish is-plate-only is-over-trim" style="--gd-fin-ph: 0.5; --gd-art-h: 160px; background: rgba(255,0,0,0.55);"></span>
    <div class="probe-sleeve" style="position:relative; height:160px; border-radius: 8px;">
      <div class="gd-sleeve-clip" style="position:absolute; inset:0; overflow:hidden; border-radius: inherit; background: rgb(0,170,60);"></div>
      <div class="gd-sleeve-deco" style="position:absolute; inset:0;">
        ${fam ? `<span class="gd-trim gd-trim-${fam}"></span>` : ''}
      </div>
    </div>
    <div class="probe-foot" style="height:80px; background: rgb(0,170,60);"></div>
  </div>`;

const FAMS = ['gallery', 'dash', 'frame'];
const html = `<!doctype html><html><head><meta charset="utf-8">
<style>${CSS.replace(/@tailwind[^;]+;/g, '')}</style>
<style>body { margin: 0; background: #0f0f0f; --gd-shape-radius: 10px; --gd-radius: 10px; }</style></head><body>
${FAMS.map((f, i) => CARD(`card_${f}`, f).replace(
  'style="position:absolute; width:300px;"',
  `style="position:absolute; left:${16 + i * 316}px; top:${8}px; width:300px;"`
)).join('\n')}
</body></html>`;
writeFileSync('/tmp/probe_diag_180.html', html);

const { chromium } = await import('/home/z/.npm-global/lib/node_modules/playwright/index.mjs');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 400 } });
await page.goto('file:///tmp/probe_diag_180.html');
await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
await page.waitForTimeout(200);
const shot = await page.screenshot();
const dataUrl = `data:image/png;base64,${shot.toString('base64')}`;
const out = await page.evaluate(async ({ dataUrl, FAMS }) => {
  const img = new Image();
  await new Promise((res) => { img.onload = res; img.src = dataUrl; });
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const res = {};
  for (const f of FAMS) {
    const el = document.getElementById(`card_${f}`);
    const r = el.getBoundingClientRect();
    const ox = Math.round(r.left) + 2;
    const oy = Math.round(r.top) + 2;
    // per-x washed counts for the right 30 columns + left 12 columns, y in [0,160)
    const right = {};
    const left = {};
    for (let x = 266; x < 296; x += 1) {
      let n = 0;
      for (let y = 0; y < 160; y += 1) {
        const d = ctx.getImageData(ox + x, oy + y, 1, 1).data;
        if (d[0] > d[1] + 30 && d[0] > d[2] + 30) n += 1;
      }
      right[x] = n;
    }
    for (let x = 0; x < 12; x += 1) {
      let n = 0;
      for (let y = 0; y < 160; y += 1) {
        const d = ctx.getImageData(ox + x, oy + y, 1, 1).data;
        if (d[0] > d[1] + 30 && d[0] > d[2] + 30) n += 1;
      }
      left[x] = n;
    }
    res[f] = { left, right };
  }
  return res;
}, { dataUrl, FAMS });
await browser.close();

console.log(`column wash counts (y 0-159) — ${CSS_PATH.includes('_179') ? 'PRE-FIX 179' : 'POST-FIX 180'}`);
for (const f of FAMS) {
  console.log(`\n${f}:`);
  console.log('  left  x0-11 :', Object.values(out[f].left).join(' '));
  const rkeys = Object.keys(out[f].right);
  console.log('  right x266-295:', Object.values(out[f].right).join(' '));
  console.log('  (from right edge: ', rkeys.map((k) => 296 - Number(k)).join(' '), ')');
}
