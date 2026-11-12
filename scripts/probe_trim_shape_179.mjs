#!/usr/bin/env node
// 1.7.9 PIXEL PROBE (Playwright/Chromium) — THE WASH SPEAKS THE FAMILY'S
// OWN SHAPE ("the trim works alone thats correct but its not accounting
// for the trim's shape and the gabs that it has, fix that so it accounts
// for them"): verifies, on real Chromium + the real index.css, that the
// over-trim plate-only coat's PER-FAMILY masks paint each family's own
// shape — the gaps the family leaves stay RAW. (Electron 42 SIGSEGVs in
// this container — Playwright's Chromium speaks the same engine truth.)
//   · DASH    — the run's ON segment washed, the rhythm's OFF gap raw;
//   · DOUBLE  — both rules washed, the 1px daylight between them raw;
//   · BOLD    — the 3px ring washed, past the ring raw;
//   · LEDGER  — the two rails washed (bottom at the ART line), the left +
//               right mid-edges raw (no verticals, ever);
//   · FRAME   — the band + a corner stud washed, past raw;
//   · GALLERY — the bracket arm washed, the mid-edge + mid-left raw;
//   · SCALLOP — the main arc washed, the cusp air between arcs raw;
//   · GOLD    — the band + the filigree corner washed, past raw;
//   · VINE    — the stem band washed, the air beneath the leaves raw;
//   · BEADS   — a pearl washed, the daylight beside it raw, the clasp too;
//   · RIVET   — a dome washed, the clear beside it raw;
//   · NONE    — the plate alone: the art zone raw everywhere;
//   · C       — no trim effect: the art zone raw (the veiled-coat law);
//   · D       — image effect on: the full face washed (its own promise);
//   · AURIC   — the real material reaches the ledger's rail, not its left.
// Run: node probe_trim_shape_179.mjs   (needs the global playwright)
import { readFileSync, writeFileSync } from 'node:fs';

const CSS = readFileSync('/home/z/my-project/burrito_gendex_179/src/index.css', 'utf8');

const FAMS = ['dash', 'double', 'bold', 'ledger', 'frame', 'gallery', 'scallop', 'gold', 'vine', 'beads', 'rivet', 'none'];

const CARD = (id, fam, seatClass, seatExtra) => `
  <div id="${id}" class="gd-card gd-has-finish gd-fin-on-trim gd-fin-under-art" style="position:absolute; width:300px;">
    <span class="gd-card-face-finish ${seatClass}" style="--gd-fin-ph: 0.5; --gd-art-h: 160px; ${seatExtra || ''}"></span>
    <div class="probe-sleeve" style="position:relative; height:160px; border-radius: 8px;">
      <div class="gd-sleeve-clip" style="position:absolute; inset:0; overflow:hidden; border-radius: inherit; background: rgb(0,170,60);"></div>
      <span class="gd-sleeve-deco" style="position:absolute; inset:0;">
        ${fam && fam !== 'none' ? `<span class="gd-trim gd-trim-${fam}"></span>` : ''}
      </span>
    </div>
    <div class="probe-foot" style="height:80px; background: rgb(0,170,60);"></div>
  </div>`;

const SEATS = [
  ...FAMS.map((f) => ({ id: `card_${f}`, fam: f, seat: 'is-plate-only is-over-trim', extra: 'background: rgba(255,0,0,0.55);' })),
  { id: 'cardC', fam: 'ledger', seat: 'is-plate-only', extra: 'background: rgba(255,0,0,0.55);' },
  { id: 'cardD', fam: 'ledger', seat: '', extra: 'background: rgba(255,0,0,0.55);' },
  { id: 'card_auric', fam: 'ledger', seat: 'gd-finish-auric is-plate-only is-over-trim', extra: '' },
];

const html = `<!doctype html><html><head><meta charset="utf-8">
<style>${CSS.replace(/@tailwind[^;]+;/g, '')}</style>
<style>
  body { margin: 0; background: #0f0f0f; --gd-shape-radius: 10px; --gd-radius: 10px; }
</style></head><body>
${SEATS.map((s, i) => {
  const col = i % 4;
  const row = Math.floor(i / 4);
  return CARD(s.id, s.fam, s.seat, s.extra).replace(
    'style="position:absolute; width:300px;"',
    `style="position:absolute; left:${16 + col * 316}px; top:${8 + row * 246}px; width:300px;"`
  );
}).join('\n')}
</body></html>`;

writeFileSync('/tmp/probe_trim_shape_179.html', html);

const { chromium } = await import('/home/z/.npm-global/lib/node_modules/playwright/index.mjs');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1024 } });
await page.goto('file:///tmp/probe_trim_shape_179.html');
await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
await page.waitForTimeout(250);
const shot = await page.screenshot();
const dataUrl = `data:image/png;base64,${shot.toString('base64')}`;

// sample the screenshot inside the page itself (canvas + getImageData)
const pixelMap = await page.evaluate(async (url) => {
  const img = new Image();
  await new Promise((res) => { img.onload = res; img.src = url; });
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, img.width, img.height).data;
  const ids = ['card_dash', 'card_double', 'card_bold', 'card_ledger', 'card_frame', 'card_gallery', 'card_scallop', 'card_gold', 'card_vine', 'card_beads', 'card_rivet', 'card_none', 'cardC', 'cardD', 'card_auric'];
  const out = {};
  for (const id of ids) {
    const el = document.getElementById(id);
    const r = el.getBoundingClientRect();
    out[id] = {
      left: r.left, top: r.top,
      // coat-box origin: 2px inside the card's border
      at(x, y) {
        const px = Math.round(this.left) + 2 + x;
        const py = Math.round(this.top) + 2 + y;
        const i = (py * img.width + px) * 4;
        return [data[i], data[i + 1], data[i + 2]];
      },
    };
  }
  // serialize the sampler (functions can't cross the bridge — send raw seats)
  const seats = {};
  for (const id of ids) {
    const el = document.getElementById(id);
    const r = el.getBoundingClientRect();
    seats[id] = { left: Math.round(r.left) + 2, top: Math.round(r.top) + 2 };
  }
  return { seats, w: img.width, data: Array.from(data.subarray(0, 0)) };
}, dataUrl);
// simpler: read pixels via a second evaluate that returns them directly
const seats = pixelMap.seats;
const grab = (id) => {
  return page.evaluate(({ id, seats, dataUrl }) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const s = seats[id];
        const pick = (x, y) => {
          const i = ((s.top + y) * img.width + (s.left + x)) * 4;
          return [ctx.getImageData(s.left + x, s.top + y, 1, 1).data[0], ctx.getImageData(s.left + x, s.top + y, 1, 1).data[1], ctx.getImageData(s.left + x, s.top + y, 1, 1).data[2]];
        };
        resolve({ pick: pick.toString() });
      };
      img.src = dataUrl;
    });
  }, { id, seats, dataUrl });
};
// NOTE: functions cannot cross the evaluate bridge — sample with a fixed
// seat table instead (one round-trip per card, coordinates baked in)
const SEAT_TABLE = {
  card_dash: [[12, 3], [16, 3], [150, 40], [150, 200]],
  card_double: [[150, 3], [150, 4], [150, 5]],
  card_bold: [[150, 4], [150, 8]],
  card_ledger: [[150, 6], [150, 153], [5, 80], [291, 80]],
  card_frame: [[150, 3], [5, 5], [150, 8]],
  card_gallery: [[60, 2], [150, 5], [5, 150]],
  card_scallop: [[148, 5], [154, 5]],
  card_gold: [[150, 3], [5, 5], [150, 8]],
  card_vine: [[150, 2], [150, 6]],
  card_beads: [[144, 5], [8, 8], [150, 6]],
  card_rivet: [[148, 3], [153, 6]],
  card_none: [[150, 3], [5, 80], [150, 200]],
  cardC: [[150, 6], [150, 200]],
  cardD: [[150, 8], [150, 200]],
  card_auric: [[150, 6], [5, 80]],
};
const pixels = await page.evaluate(async ({ dataUrl, seats, seatTable }) => {
  const img = new Image();
  await new Promise((res) => { img.onload = res; img.src = dataUrl; });
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const out = {};
  for (const [id, pts] of Object.entries(seatTable)) {
    const s = seats[id];
    out[id] = pts.map(([x, y]) => {
      const d = ctx.getImageData(s.left + x, s.top + y, 1, 1).data;
      return [d[0], d[1], d[2]];
    });
  }
  return out;
}, { dataUrl, seats, seatTable: SEAT_TABLE });

await browser.close();

const isRed = (p) => p[0] > p[1] + 25 && p[0] > p[2] + 25;
const dist = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
const P = (id) => pixels[id];
const results = [];
const check = (name, cond, detail) => {
  results.push({ name, ok: !!cond, detail });
  console.log(`  ${cond ? 'ok' : 'FAIL'} — ${name} ${detail}`);
};

console.log('\n1.7.9 family-shape probe (the wash speaks the family\'s own shape):\n');

check('dash — ON washes, OFF stays raw', isRed(P('card_dash')[0]) && !isRed(P('card_dash')[1]),
  `on=${P('card_dash')[0]} off=${P('card_dash')[1]}`);
check('dash — interior raw, plate washed', !isRed(P('card_dash')[2]) && isRed(P('card_dash')[3]),
  `inner=${P('card_dash')[2]} plate=${P('card_dash')[3]}`);

check('double — both rules wash, daylight raw', isRed(P('card_double')[0]) && !isRed(P('card_double')[1]) && isRed(P('card_double')[2]),
  `outer=${P('card_double')[0]} gap=${P('card_double')[1]} inner=${P('card_double')[2]}`);

check('bold — ring washes, past raw', isRed(P('card_bold')[0]) && !isRed(P('card_bold')[1]),
  `ring=${P('card_bold')[0]} out=${P('card_bold')[1]}`);

check('ledger — both rails wash (bottom at the ART line)', isRed(P('card_ledger')[0]) && isRed(P('card_ledger')[1]),
  `top=${P('card_ledger')[0]} bottom=${P('card_ledger')[1]}`);
check('ledger — left + right mid-edges raw (no verticals)', !isRed(P('card_ledger')[2]) && !isRed(P('card_ledger')[3]),
  `left=${P('card_ledger')[2]} right=${P('card_ledger')[3]}`);

check('frame — band + stud wash, past raw', isRed(P('card_frame')[0]) && isRed(P('card_frame')[1]) && !isRed(P('card_frame')[2]),
  `band=${P('card_frame')[0]} stud=${P('card_frame')[1]} out=${P('card_frame')[2]}`);

check('gallery — arm washes, the mid-edge (above the seal) + mid-left raw', isRed(P('card_gallery')[0]) && !isRed(P('card_gallery')[1]) && !isRed(P('card_gallery')[2]),
  `arm=${P('card_gallery')[0]} mid=${P('card_gallery')[1]} midleft=${P('card_gallery')[2]}`);

check('scallop — arc washes, cusp air raw', isRed(P('card_scallop')[0]) && !isRed(P('card_scallop')[1]),
  `arc=${P('card_scallop')[0]} cusp=${P('card_scallop')[1]}`);

check('gold — band + filigree wash, past raw', isRed(P('card_gold')[0]) && isRed(P('card_gold')[1]) && !isRed(P('card_gold')[2]),
  `band=${P('card_gold')[0]} filigree=${P('card_gold')[1]} out=${P('card_gold')[2]}`);

check('vine — stem band washes, leaf air raw', isRed(P('card_vine')[0]) && !isRed(P('card_vine')[1]),
  `band=${P('card_vine')[0]} air=${P('card_vine')[1]}`);

check('beads — pearl + clasp wash, daylight raw', isRed(P('card_beads')[0]) && isRed(P('card_beads')[1]) && !isRed(P('card_beads')[2]),
  `pearl=${P('card_beads')[0]} clasp=${P('card_beads')[1]} daylight=${P('card_beads')[2]}`);

check('rivet — dome washes, clear raw', isRed(P('card_rivet')[0]) && !isRed(P('card_rivet')[1]),
  `dome=${P('card_rivet')[0]} clear=${P('card_rivet')[1]}`);

check('none — plate alone (art zone raw everywhere)', !isRed(P('card_none')[0]) && !isRed(P('card_none')[1]) && isRed(P('card_none')[2]),
  `mid=${P('card_none')[0]} left=${P('card_none')[1]} plate=${P('card_none')[2]}`);

check('control C — no trim effect: art raw, plate washed', !isRed(P('cardC')[0]) && isRed(P('cardC')[1]),
  `rail=${P('cardC')[0]} plate=${P('cardC')[1]}`);
check('control D — image effect on: full face washed (the trim-free band + plate)', isRed(P('cardD')[0]) && isRed(P('cardD')[1]),
  `rail=${P('cardD')[0]} plate=${P('cardD')[1]}`);

const auricRail = P('card_auric')[0];
const auricLeft = P('card_auric')[1];
check('auric — the real material reaches the rail (not the left edge)', dist(auricRail, auricLeft) >= 8,
  `rail=${auricRail} left=${auricLeft} dist=${dist(auricRail, auricLeft)}`);

const bad = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - bad}/${results.length} checks green`);
process.exit(bad === 0 ? 0 : 1);
