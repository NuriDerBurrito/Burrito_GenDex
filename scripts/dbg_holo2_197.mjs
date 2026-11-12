import { chromium } from 'playwright';
import path from 'node:path';
const tree = '/home/z/my-project/burrito_gendex_196';
const html = `<!doctype html><html><head><style>
  body { margin: 0; background: #2a2a33; }
  .pc { position: relative; width: 180px; height: 250px; overflow: hidden; border-radius: 10px; }
</style></head><body>
<div class="pc gd-fin-ground-dark" style="--gd-card-tint:#141414; background:#141414">
  <span class="gd-card-face-finish gd-finish-holographic"></span>
</div>
</body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 300, height: 300 } });
await page.setContent(html);
await page.addStyleTag({ path: path.join(tree, 'src/index.css') });
await page.waitForTimeout(1100);
const cs = await page.evaluate(() => {
  const el = document.querySelector('.gd-card-face-finish');
  const s = getComputedStyle(el);
  return { blend: s.mixBlendMode, bg: s.backgroundImage.slice(0, 80), anim: s.animation,
    filter: s.filter, op: s.opacity, bgc: s.backgroundColor,
    holoRules: [...document.styleSheets].length };
});
console.log(JSON.stringify(cs, null, 2));
// freeze animations to be sure
await page.evaluate(() => {
  document.getAnimations().forEach(a => a.pause());
});
const shot = await page.screenshot();
const sharp = (await import('sharp')).default;
const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
// sample some rows
for (const y of [10, 60, 125, 200]) {
  let row = [];
  for (let x = 0; x < 180; x += 20) {
    const i = (y * info.width + x) * info.channels;
    row.push(`${data[i]},${data[i+1]},${data[i+2]}`);
  }
  console.log(`y=${y}: ${row.join(' | ')}`);
}
await browser.close();
