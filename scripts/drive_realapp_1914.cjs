#!/usr/bin/env node
// 1.9.14 REAL-APP DRIVER — drives the RUNNING Burrito GenDex app over CDP
// (Node's global WebSocket + fetch; the app was launched with
// --remote-debugging-port). Reads the grid's rim-wearing seats, captures
// REST, performs the REAL selection (Ctrl+A through Input.dispatchKeyEvent
// AND the label-drag through Input.dispatchMouseEvent), captures each state,
// and saves the card crops for measurement.
// Run: node scripts/drive_realapp_1914.mjs <port>
const PORT = process.argv[2] || '9333';
const DISPLAY = process.argv[3] || ':78';
const OUT = '/tmp/render_1914';
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const cdp = new CDP(ws);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && cdp.pending.has(msg.id)) {
        const { res, rej } = cdp.pending.get(msg.id);
        cdp.pending.delete(msg.id);
        if (msg.error) rej(new Error(JSON.stringify(msg.error)));
        else res(msg.result);
      }
    };
    return cdp;
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}

const run = async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = list.find((t) => t.type === 'page' && !/devtools/i.test(t.url));
  if (!page) throw new Error('no page target: ' + JSON.stringify(list.map((t) => t.type + t.url)));
  console.log('target:', page.url.slice(0, 80));
  const cdp = await CDP.connect(page.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  const evalJs = async (expr) => {
    const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300));
    return r.result.value;
  };

  // wait for the app to mount the grid (up to 40s)
  let seats = null;
  for (let i = 0; i < 40; i += 1) {
    await sleep(1000);
    const q = await evalJs(`(() => {
      const cards = [...document.querySelectorAll('.gd-card.gd-has-finish')];
      return JSON.stringify({ n: cards.length, any: document.querySelectorAll('.gd-card').length });
    })()`);
    const parsed = JSON.parse(q);
    console.log(`wait ${i}: finish-cards=${parsed.n} any-cards=${parsed.any}`);
    if (parsed.n > 0) {
      seats = await evalJs(`(() => {
        const cards = [...document.querySelectorAll('.gd-card.gd-has-finish')];
        return JSON.stringify(cards.slice(0, 3).map((card, idx) => {
          const t = card.querySelector('.gd-card-title');
          const m = card.querySelector('.gd-card-meta');
          const box = (el) => { const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
          return { i: idx, title: t ? box(t) : null, meta: m ? box(m) : null,
            finish: getComputedStyle(card).getPropertyValue('--gd-fin-ink-outline').trim(),
            scale: getComputedStyle(card).getPropertyValue('--card-scale').trim(),
            name: t ? t.textContent.slice(0, 30) : '' };
        }));
      })()`);
      break;
    }
  }
  console.log('seats:', seats);
  fs.writeFileSync(`${OUT}/real_seats.json`, seats || 'null');

  const shot = async (name) => {
    // the screen itself, via ffmpeg x11grab (CDP captureScreenshot fails
    // under this app's GPU state; the Xvfb compositor paints the window)
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'x11grab', '-i', DISPLAY, '-frames:v', '1', `${OUT}/${name}.png`], { env: { ...process.env, DISPLAY } });
    console.log('captured', name);
  };
  const selState = async () => evalJs(`(() => {
    const s = window.getSelection();
    return JSON.stringify({ ranges: s.rangeCount, len: String(s).length, head: String(s).slice(0, 60) });
  })()`);

  await evalJs(`window.getSelection().removeAllRanges()`);
  await sleep(400);
  await shot('real_rest');
  console.log('rest selection:', await selState());

  // ROAD 1 — real Ctrl+A through the input pipeline
  await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65, modifiers: 2 });
  await sleep(80);
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65, modifiers: 2 });
  await sleep(500);
  console.log('ctrl-A selection:', await selState());
  await shot('real_ctrlA');

  // clear
  await evalJs(`window.getSelection().removeAllRanges()`);
  await sleep(400);

  // ROAD 2 — the user's actual gesture: a mouse DRAG from the top-bar label
  // sweeping down past the header across the card wall
  const label = await evalJs(`(() => {
    const els = [...document.querySelectorAll('div')].filter((d) => /CARDS/i.test(d.textContent) && d.textContent.length < 40 && d.children.length === 0);
    const el = els[els.length - 1];
    if (!el) return 'null';
    const b = el.getBoundingClientRect();
    return JSON.stringify({ x: b.x + b.width / 2, y: b.y + b.height / 2, text: el.textContent.slice(0, 40) });
  })()`);
  console.log('label anchor:', label);
  const L = JSON.parse(label === 'null' ? '{"x":700,"y":30}' : label);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: Math.round(L.x), y: Math.round(L.y), button: 'left', clickCount: 1 });
  await sleep(120);
  // sweep down past the header, across the card wall
  const steps = 8;
  for (let s = 1; s <= steps; s += 1) {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(L.x + (400 - L.x) * (s / steps)), y: Math.round(L.y + (380 - L.y) * (s / steps)), button: 'left' });
    await sleep(50);
  }
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 400, y: 380, button: 'left', clickCount: 1 });
  await sleep(500);
  console.log('drag selection:', await selState());
  await shot('real_drag');

  await evalJs(`window.getSelection().removeAllRanges()`);
  console.log('DONE');
};

run().catch((e) => { console.error('driver failed:', e); process.exit(1); });
