import { chromium } from 'playwright';
import path from 'node:path';
const tree = '/home/z/my-project/burrito_gendex_196';
const html = `<!doctype html><html><head><style>
  body { margin: 0; background: #2a2a33; }
  .pc { position: relative; width: 180px; height: 250px; overflow: hidden; border-radius: 10px; }
</style></head><body>
<div class="pc gd-fin-ground-dark" style="--gd-card-tint:#141414; --gd-fin-ink:#141414; background:#141414">
  <span class="gd-card-face-finish gd-finish-holographic"><span class="gd-holo-shards"></span><span class="gd-holo-dots"></span></span>
</div>
<div class="pc gd-fin-ground-dark" style="--gd-card-tint:#141414; background:#141414">
  <span class="gd-card-face-finish gd-finish-holographic"></span>
</div>
</body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
await page.setContent(html);
await page.addStyleTag({ path: path.join(tree, 'src/index.css') });
await page.waitForTimeout(1100);
// computed styles of the holo seat
const cs = await page.evaluate(() => {
  const el = document.querySelector('.gd-card-face-finish');
  const s = getComputedStyle(el);
  const card = document.querySelector('.pc');
  return {
    blend: s.mixBlendMode, opacity: s.opacity, bg: s.backgroundImage.slice(0, 120),
    anim: s.animationName, filter: s.filter,
    cardOpacity: getComputedStyle(card).opacity,
    rect: JSON.stringify(el.getBoundingClientRect()),
    holoChildren: document.querySelectorAll('.gd-holo-shards').length,
  };
});
console.log(JSON.stringify(cs, null, 2));
const shot = await page.screenshot();
const sharp = (await import('sharp')).default;
const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
let diff = 0, total = 0;
for (let y = 0; y < 250; y += 2) for (let x = 0; x < 180; x += 2) {
  const i = (y * info.width + x) * info.channels;
  total++;
  if (Math.abs(data[i]-0x14) > 12 || Math.abs(data[i+1]-0x14) > 12 || Math.abs(data[i+2]-0x14) > 12) diff++;
}
console.log(`card1 ratio ${(diff/total*100).toFixed(1)}%`);
let diff2 = 0;
for (let y = 0; y < 250; y += 2) for (let x = 200; x < 380; x += 2) {
  const i = (y * info.width + x) * info.channels;
  if (Math.abs(data[i]-0x14) > 12 || Math.abs(data[i+1]-0x14) > 12 || Math.abs(data[i+2]-0x14) > 12) diff2++;
}
console.log(`card2 (no children) ratio ${(diff2/total*100).toFixed(1)}%`);
await browser.close();
