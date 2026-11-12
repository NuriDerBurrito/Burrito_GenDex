// probe_strip_census_188.mjs — THE LAYOUT CENSUS, proven live on real
// Chromium. This is the probe the 1.8.7 law never had: the last census
// probe replicated the law beside a disease arm that only modelled the
// rim's shave — it never flew the trailing key's FLIP, so it never met
// the lie the paint tells while the flight lives. This probe builds the
// version strip's real geometry (the wrapper's relative seat, the
// overflow-x-auto strip, the chips + the trailing NEW VERSION key), flies
// the 1.6.9 FLIP verbatim on every switch, runs the report's own case
// (long card -> short card) on a deliberately BUSY breath (the rAF that
// starts the glide delayed 120ms — the images decoding, the swap fade),
// and speaks THREE laws over the same breath: the 1.8.6 law (the paint
// census, max > 1), the 1.8.7 law (the paint census + WORTH + the nets +
// the 200ms settle), and the 1.8.8 law (the layout census, verbatim from
// SideFlow.jsx's useFlowEdges). The old laws' arrows stand guard over the
// phantom rim exactly as the owner reported; the new law retires them at
// the switch's own door.
import { chromium } from 'playwright';

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font: 12px/1 sans-serif; padding: 24px; background: #efe7d2; }
  .gd-wrap { position: relative; min-width: 0; width: 480px; }
  /* the strip's own seat: the real class list's geometry, handwritten
     (tailwind compiles these away in the app): py-2 px-2 flex
     items-center gap-2.5 flex-nowrap overflow-x-auto */
  .gd-version-strip { display: flex; align-items: center; gap: 10px;
      flex-wrap: nowrap; overflow-x: auto; padding: 8px 8px; }
  .gd-version-item { flex-shrink: 0; width: 90px; height: 34px;
      background: #d8c9a3; border: 1px solid #8b7d5a; border-radius: 8px; }
  .gd-version-item.gd-key { width: 110px; background: #b9d3c0; }
  /* the arrows + fades: extracted from index.css (the app's own laws,
     verbatim — only the theme vars are pinned to plain values so the
     computed seats read without the theme engine) */
  .gd-flow-arrow { position: absolute; top: 50%;
      transform: translateY(calc(-50% - var(--gd-flow-arrow-lift, 0px)));
      z-index: 6; width: 20px; height: 20px; display: inline-flex;
      align-items: center; justify-content: center; padding: 0;
      border: 1px solid #8b7d5a; border-radius: 999px; background: #f4ead2;
      color: #3a3226; cursor: pointer;
      transition: color 0.12s ease, border-color 0.12s ease,
        background-color 0.12s ease, opacity 0.18s ease, translate 0.18s ease;
      opacity: 0; pointer-events: none; }
  .gd-flow-arrow.is-left { left: 7px; translate: -4px 0; }
  .gd-flow-arrow.is-right { right: 7px; translate: 4px 0; }
  .gd-flow-arrow.is-live { opacity: 1; translate: 0 0; pointer-events: auto; }
`;

const HTML = (chipCount) => `<!doctype html><html><head><style>${CSS}</style></head>
<body>
  <div class="gd-wrap" id="wrap">
    <div class="gd-version-strip" id="strip">
      ${Array.from({ length: chipCount }, () => '<div class="gd-version-item"></div>').join('')}
      <div class="gd-version-item gd-key" id="key"></div>
    </div>
    <button type="button" id="arrowL" class="gd-flow-arrow is-left">‹</button>
    <button type="button" id="arrowR" class="gd-flow-arrow is-right">›</button>
  </div>
</body></html>`;

// the three laws, each a verdict record + the nets it trusts. The 1.8.8
// law is SideFlow.jsx's useFlowEdges read() copied verbatim (the setCanL
// / setCanR seats spoken as record writes); the older laws are their own
// versions' forms, nets and all.
const LAWS = `
const WORTH = 24;
const strip = document.getElementById('strip');
const key = document.getElementById('key');
const arrowL = document.getElementById('arrowL');
const arrowR = document.getElementById('arrowR');
const paint = () => { const v = strip.querySelectorAll('.gd-version-item').length; return v; };

// THE VERDICT RECORDS — { canL, canR, reads, pins }
const law186 = { canL: false, canR: false, reads: 0, pins: 0 };
const law187 = { canL: false, canR: false, reads: 0, pins: 0 };
const law188 = { canL: false, canR: false, reads: 0, pins: 0 };
window.__log = [];
const note = (law, rec) => window.__log.push({
  t: Math.round(performance.now()), law,
  engineMax: strip.scrollWidth - strip.clientWidth,
  offset: Math.round(strip.scrollLeft),
  canL: rec.canL, canR: rec.canR,
});

const read186 = () => {
  law186.reads++;
  const max = strip.scrollWidth - strip.clientWidth;
  law186.canL = strip.scrollLeft > 1;
  law186.canR = max > 1 && strip.scrollLeft < max - 1;
  note('186', law186);
};
const read187 = () => {
  law187.reads++;
  const max = Math.max(0, strip.scrollWidth - strip.clientWidth);
  if (strip.scrollLeft > max) { strip.scrollLeft = max; law187.pins++; }
  const live = max > WORTH;
  law187.canL = live && strip.scrollLeft > 1;
  law187.canR = live && strip.scrollLeft < max - 1;
  note('187', law187);
};
// the 1.8.8 law — verbatim from SideFlow.jsx's useFlowEdges (the pin's
// scroll-beat and gd-sort-live guards included)
const read188 = (pin = true) => {
  law188.reads++;
  let max;
  const kids = strip.children;
  const sameOrigin = kids.length > 0 && kids[0].offsetParent === strip.offsetParent;
  if (sameOrigin) {
    let right = 0;
    for (let i = 0; i < kids.length; i++) {
      const c = kids[i];
      const r = (c.offsetLeft || 0) + (c.offsetWidth || 0);
      if (r > right) right = r;
    }
    max = Math.max(0, right - (strip.offsetLeft || 0) - (strip.clientLeft || 0) - strip.clientWidth);
  } else {
    max = Math.max(0, strip.scrollWidth - strip.clientWidth);
  }
  const dragging = typeof document !== 'undefined' && document.body &&
    document.body.classList.contains('gd-sort-live');
  if (pin && !dragging && strip.scrollLeft > max) { strip.scrollLeft = max; law188.pins++; }
  const live = max > WORTH;
  law188.canL = live && strip.scrollLeft > 1;
  law188.canR = live && strip.scrollLeft < max - 1;
  law188.max = max;
  note('188', law188);
};

// THE NETS — each law hears only the nets its own version trusted
strip.addEventListener('scroll', () => { read186(); read187(); read188(false); }, { passive: true });
const ro = new ResizeObserver(() => { read186(); read187(); read188(true); });
ro.observe(strip);
const mo = new MutationObserver(() => { read187(); read188(true); });
mo.observe(strip, { childList: true, subtree: true, characterData: true });
window.__rafOneShot = (fn) => requestAnimationFrame(fn);

// the arrows' own flight (FlowEdges' is-live law, verbatim)
window.__speakArrows = () => {
  arrowL.className = 'gd-flow-arrow is-left' + (law188.canL ? ' is-live' : '');
  arrowR.className = 'gd-flow-arrow is-right' + (law188.canR ? ' is-live' : '');
};

// THE FLIP — CharacterView's 1.6.9 law, verbatim (the rAF delay is the
// busy breath: the new card's images decoding under the commit — the
// census effect's door-read runs BEFORE the paint, the flight starts
// only when the frame finally comes)
window.__flipKey = (prevX, delayMs = 0) => {
  const key = window.__key;
  const x = key.offsetLeft;
  key.style.transition = 'none';
  key.style.transform = 'translateX(' + Math.round(prevX - x) + 'px)';
  return x;
};
window.__armFlip = (delayMs = 0) => {
  const key = window.__key;
  const arm = () => {
    key.style.transition = 'transform 0.15s ease-out';
    key.style.transform = '';
  };
  if (delayMs > 0) {
    const busy = performance.now() + delayMs;
    while (performance.now() < busy) { /* the main thread is busy */ }
  }
  requestAnimationFrame(arm);
};

// THE DOOR — the census effect's own re-run (the caller's deps changed
// with the commit): every law reads at the door, and only 187/188 arm
// their settle clocks
let settleTimers = [];
window.__door = () => {
  settleTimers.forEach(clearTimeout); settleTimers = [];
  read186(); read187(); read188(true);
  const s187 = setTimeout(read187, 200);
  const s188 = setTimeout(() => read188(true), 200);
  settleTimers.push(s187, s188);
  window.__speakArrows();
};
window.__state = () => ({
  scrollWidth: strip.scrollWidth, clientWidth: strip.clientWidth,
  scrollLeft: Math.round(strip.scrollLeft),
  keyTransform: key.style.transform,
  engineMax: strip.scrollWidth - strip.clientWidth,
  layoutMax: law188.max,
  law186: { ...law186 }, law187: { ...law187 }, law188: { ...law188 },
  arrowLOpacity: getComputedStyle(arrowL).opacity,
  arrowROpacity: getComputedStyle(arrowR).opacity,
  arrowLVisible: arrowL.className.includes('is-live'),
  arrowRVisible: arrowR.className.includes('is-live'),
});
window.__strip = strip; window.__key = key; window.__read188 = read188;
read186(); read187(); read188(true); window.__speakArrows();
`;

const results = [];
let failed = 0;
const ok = (name, cond, detail = '') => {
  results.push([cond ? 'ok' : 'FAIL', name, detail]);
  if (!cond) failed++;
  console.log(`  ${cond ? 'ok' : 'FAIL'} — ${name}${detail ? `  [${detail}]` : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));

// ---------------------------------------------------------------------------
// A — THE LONG CARD: the right edge alone is worth the scroll
// ---------------------------------------------------------------------------
await page.setContent(HTML(9));
await page.evaluate(LAWS);
await sleep(80);
let s = await page.evaluate(() => window.__state());
ok('A1 the long card lights the RIGHT edge alone (paint + layout agree, max 538)',
  s.law188.canL === false && s.law188.canR === true && s.law188.max === 538,
  `canL=${s.law188.canL} canR=${s.law188.canR} max=${s.law188.max}`);
await sleep(320); // the arrows' own 0.18s flight settles
s = await page.evaluate(() => window.__state());
ok('A1b the arrows speak it: right visible (opacity 1), left hidden (opacity 0)',
  s.arrowRVisible === true && s.arrowLVisible === false &&
  s.arrowROpacity === '1' && s.arrowLOpacity === '0',
  `R=${s.arrowROpacity} L=${s.arrowLOpacity}`);

// the long card's genuine scroll: both edges honest through a real pan
await page.evaluate(() => { window.__strip.scrollLeft = 300; });
await sleep(60);
s = await page.evaluate(() => window.__state());
ok('A2 a real pan lights the LEFT edge and keeps the RIGHT (a genuine scroll, both keys honest)',
  s.law188.canL === true && s.law188.canR === true && Math.round(s.scrollLeft) === 300,
  `canL=${s.law188.canL} canR=${s.law188.canR} offset=${s.scrollLeft}`);
await page.evaluate(() => { window.__strip.scrollLeft = 9999; });
await sleep(60);
s = await page.evaluate(() => window.__state());
ok('A3 the far end retires the RIGHT edge and keeps the LEFT',
  s.law188.canR === false && s.law188.canL === true && s.scrollLeft >= 537,
  `canR=${s.law188.canR} offset=${s.scrollLeft}`);

// ---------------------------------------------------------------------------
// B — THE REPORT OWN CASE, ON A BUSY BREATH: long -> short, the FLIP's
//     rAF delayed 120ms (the flight outlives the 187 settle clock)
// ---------------------------------------------------------------------------
const prevX = await page.evaluate(() => window.__key.offsetLeft); // 908
await page.evaluate((prevX) => {
  // React's commit: the short card's chips (2), the key keeps its id
  const strip = window.__strip;
  strip.innerHTML = '<div class="gd-version-item"></div><div class="gd-version-item"></div>' +
    '<div class="gd-version-item gd-key" id="key"></div>';
  window.__key = document.getElementById('key');
  // the FLIP's layout effect (the transform set, the rAF pending)
  window.__flipKey(prevX);
  // the census effects re-run at the door (the caller's deps changed)
  window.__door();
  // the busy breath: the main thread is held 120ms before the frame —
  // the flight starts late and outlives the 200ms settle clock
  window.__armFlip(120);
}, prevX);
await sleep(30); // one breath past the door, the flight still airborne
s = await page.evaluate(() => window.__state());
ok('B1 the paint lies while the flight lives: engineMax reads the phantom rim though the layout truth is 0',
  s.engineMax > 200 && s.layoutMax === 0,
  `engineMax=${s.engineMax} layoutMax=${s.layoutMax}`);
ok('B2 THE 1.8.6 LAW ARROWS STAND (the disease, live): the right edge lit over the phantom rim',
  s.law186.canR === true,
  `186: canL=${s.law186.canL} canR=${s.law186.canR}`);
ok('B3 THE 1.8.7 LAW ARROWS STAND TOO (the disease the owner reported on 1.8.7): the settle clock still running, the flight still airborne',
  s.law187.canR === true,
  `187: canL=${s.law187.canL} canR=${s.law187.canR}`);
ok('B4 THE 1.8.8 LAW RETIRES THEM AT THE DOOR — in the same breath the short card arrives, mid-flight, no waiting',
  s.law188.canL === false && s.law188.canR === false && s.arrowRVisible === false,
  `188: canL=${s.law188.canL} canR=${s.law188.canR} R-class-retired=${!s.arrowRVisible}`);

await sleep(190); // the settle clock (200ms from the door) fired MID-FLIGHT (the log spoke it at engineMax=102)
s = await page.evaluate(() => window.__state());
const timeline = await page.evaluate(() => window.__log.slice(-12));
console.log('    timeline:', JSON.stringify(timeline));
ok('B5 the 1.8.7 settle spoke its last word airborne (mid-flight) — and the verdict STANDS while the engine itself has already told the truth (0)',
  s.law187.canR === true && s.engineMax === 0,
  `187 canR=${s.law187.canR} engineMax=${s.engineMax}`);
await sleep(450); // the flight is long over; nothing re-reads
s = await page.evaluate(() => window.__state());
ok('B6 the flight is over and NOTHING speaks again: the 1.8.7 arrows stand guard forever (the owner\'s literal report), the 1.8.6 law likewise',
  s.law187.canR === true && s.law186.canR === true && s.engineMax === 0,
  `187 canR=${s.law187.canR} 186 canR=${s.law186.canR} engineMax=${s.engineMax}`);
ok('B7 the 1.8.8 law never changed its word (retired at the door, still retired, the fade long settled)',
  s.law188.canL === false && s.law188.canR === false && s.arrowROpacity === '0',
  `188: canL=${s.law188.canL} canR=${s.law188.canR} R-opacity=${s.arrowROpacity}`);

// ---------------------------------------------------------------------------
// C — THE STALE SEAT: the long card's scroll retires with its content
// ---------------------------------------------------------------------------
await page.setContent(HTML(9));
await page.evaluate(LAWS);
await page.evaluate(() => { window.__strip.scrollLeft = 9999; });
await sleep(60);
const prevX2 = await page.evaluate(() => window.__key.offsetLeft);
await page.evaluate((prevX) => {
  const strip = window.__strip;
  strip.innerHTML = '<div class="gd-version-item"></div><div class="gd-version-item"></div>' +
    '<div class="gd-version-item gd-key" id="key"></div>';
  window.__key = document.getElementById('key');
  window.__flipKey(prevX);
  window.__armFlip(0);
  window.__door();
}, prevX2);
await sleep(50);
s = await page.evaluate(() => window.__state());
ok('C1 the stale seat retires with its content (the far-right offset pinned to the layout truth at the door)',
  s.scrollLeft <= 8 && s.law188.pins >= 1 && s.law188.canL === false,
  `offset=${s.scrollLeft} pins=${s.law188.pins}`);
const pinsBefore = s.law188.pins;
await page.evaluate(() => window.__door());
await sleep(20);
s = await page.evaluate(() => window.__state());
ok('C2 the pin is idempotent (the second door reads no pin — already at the truth)',
  s.law188.pins === pinsBefore, `pins=${s.law188.pins} (was ${pinsBefore})`);

// ---------------------------------------------------------------------------
// D — THE BOUNDARY: the WORTH threshold against the layout arithmetic
// ---------------------------------------------------------------------------
// the short card's content (2 chips + key + gaps + padding) = 318; a strip
// width of 294 leaves exactly 24 (retire), 293 leaves 25 (light)
for (const [w, expectLive, name] of [[294, false, 'D1 max 24 retires'], [293, true, 'D2 max 25 lights']]) {
  await page.setContent(HTML(2).replace('width: 480px', `width: ${w}px`));
  await page.evaluate(LAWS);
  await sleep(50);
  s = await page.evaluate(() => window.__state());
  ok(`${name} (calibrated against the chips' own layout seats)`,
    s.law188.canR === expectLive && (expectLive ? s.layoutMax === 25 : s.layoutMax === 24),
    `layoutMax=${s.layoutMax} canR=${s.law188.canR}`);
}

// ---------------------------------------------------------------------------
// E — THE DRAG'S OWN POKE: a transformed chip past the end never lights
//     the edges (the census is transform-blind), and the pin never fires
//     while the drag lives
// ---------------------------------------------------------------------------
await page.setContent(HTML(3));
await page.evaluate(LAWS);
await sleep(50);
await page.evaluate(() => {
  document.body.classList.add('gd-sort-live'); // the body's own drag word
  const chips = window.__strip.querySelectorAll('.gd-version-item:not(.gd-key)');
  chips[chips.length - 1].style.transform = 'translateX(400px)'; // the poke
  window.__read188(true); // a door-style read while the drag lives
});
await sleep(30);
s = await page.evaluate(() => window.__state());
ok('E1 the dragged chip poke (400px past the end) never lights the edges — the engine counts it, the census cannot see it',
  s.engineMax > 150 && s.law188.canR === false && s.law188.canL === false,
  `engineMax=${s.engineMax} canR=${s.law188.canR}`);
ok('E2 the pin never fires while the drag lives (the poke is a flight, not a seat)',
  s.law188.pins === 0, `pins=${s.law188.pins}`);

// ---------------------------------------------------------------------------
// F — THE CONTENT'S OWN VOICE: a chip arriving with no deps change speaks
//     through the MutationObserver alone
// ---------------------------------------------------------------------------
await page.setContent(HTML(3));
await page.evaluate(LAWS);
await sleep(50);
let before = await page.evaluate(() => window.__state());
ok('F1 the short strip starts retired (3 chips + key fit the frame)', before.law188.canR === false, `canR=${before.law188.canR}`);
const readsBefore = before.law188.reads;
await page.evaluate(() => {
  const chip = document.createElement('div');
  chip.className = 'gd-version-item';
  window.__strip.insertBefore(chip, window.__key); // a version born, no deps change
});
await sleep(60);
s = await page.evaluate(() => window.__state());
ok('F2 the born chip re-reads the census through the MutationObserver alone (content speaks for itself, the fourth chip overflows)',
  s.law188.reads > readsBefore && s.law188.canR === true && s.law188.max === 38,
  `reads ${readsBefore} -> ${s.law188.reads}, canR=${s.law188.canR}, max=${s.law188.max}`);

// ---------------------------------------------------------------------------
// G — THE SAME-ORIGIN GUARD: a geometry the arithmetic cannot name falls
//     back to the engine's own word
// ---------------------------------------------------------------------------
await page.setContent(HTML(9));
await page.evaluate(`${LAWS}
window.__strip.style.position = 'relative'; // the chips' offsetParent becomes the strip itself
read188(true);`);
await sleep(50);
s = await page.evaluate(() => window.__state());
ok('G1 a broken kinship (the strip positioned) falls back to the engine word — still lit on a long card',
  s.law188.canR === true && s.law188.max === s.engineMax,
  `max=${s.law188.max} engineMax=${s.engineMax}`);

await browser.close();

console.log(`\n${results.length - failed}/${results.length} green, ${failed} red`);
if (failed) process.exit(1);
