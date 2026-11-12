import { chromium } from 'playwright';
import path from 'node:path';
const tree = '/home/z/my-project/burrito_gendex_196';
const html = `<!doctype html><html><head><style>
  body { margin: 0; background: #333; }
  .tg { position: relative; width: 200px; height: 80px; margin: 20px; border-radius: 8px; background: #e0567a; }
  .tg .gd-ribbon-glyph { position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); display: flex; align-items: flex-start; justify-content: center; color: #fff0f3; --gd-glyph-rim: rgba(0,0,0,0.55); --gd-glyph-size: 28px; }
</style></head><body>
<div class="tg"><span class="gd-ribbon-glyph"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8z"/></svg></span></div>
</body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 260, height: 130 }, deviceScaleFactor: 2 });
await page.setContent(html);
await page.addStyleTag({ path: path.join(tree, 'src/index.css') });
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/render/chip_halo.png' });
await browser.close();
console.log('saved');
