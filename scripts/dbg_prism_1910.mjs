import { chromium } from 'playwright';
const card = `<div class="pc" style="--gd-card-tint:#4d1a00; --gd-fin-ink:#6b3a00; --gd-fin-glow:#dfb26a; --gd-fin-art:#d9a75c; background:#4d1a00"><span class="gd-card-face-finish gd-finish-prismatic"><span class="gd-prism-stars"></span><span class="gd-prism-particles"></span><span class="gd-prism-waves"></span><span class="gd-prism-sweep"></span></span></div>`;
const html = (css) => `<!doctype html><html><head><style>body{margin:0;background:#2a2a33}.pc{position:relative;width:180px;height:250px;overflow:hidden;border-radius:10px}* { animation-play-state: paused !important; }</style><link rel="stylesheet" href="${css}"></head><body>${card}</body></html>`;
const browser = await chromium.launch();
const out = {};
for (const [name, css] of [['cur', '/home/z/my-project/burrito_gendex_196/src/index.css'], ['fix', '/home/z/my-project/burrito_gendex_196/scripts/fixtures/index_classic_192_coat.css']]) {
  const page = await browser.newPage();
  await page.route('**/*', route => route.fulfill({ contentType: 'text/css', path: css.replace('file://','') }));
  await page.setContent(html('file://x.css'));
  await page.waitForTimeout(300);
  const styles = await page.evaluate(() => {
    const el = document.querySelector('.gd-finish-prismatic');
    const cs = getComputedStyle(el);
    const pick = (e, cls) => { if (!e) return null; const c = getComputedStyle(e); return { blend: c.mixBlendMode, bg: c.background.slice(0, 160), anim: c.animationName, op: c.opacity }; };
    return {
      body: pick(el, null),
      stars: pick(el.querySelector('.gd-prism-stars')),
      particles: pick(el.querySelector('.gd-prism-particles')),
      waves: pick(el.querySelector('.gd-prism-waves')),
      sweep: pick(el.querySelector('.gd-prism-sweep')),
    };
  });
  out[name] = styles;
  await page.close();
}
await browser.close();
for (const seat of ['body', 'stars', 'particles', 'waves', 'sweep']) {
  const a = JSON.stringify(out.cur[seat]), b = JSON.stringify(out.fix[seat]);
  console.log(seat, a === b ? 'SAME' : `DIFF\n  cur: ${a}\n  fix: ${b}`);
}
