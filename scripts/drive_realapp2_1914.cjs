#!/usr/bin/env node
// 1.9.14 REAL-APP DRIVER v2 — verbose, every step timed; grabs via ffmpeg
// x11grab with a hard timeout. Roads: rest -> Ctrl+A -> drag-from-label.
const PORT = process.argv[2] || '9337';
const DISPLAY = process.argv[3] || ':77';
const OUT = '/tmp/render_1914';
const fs = require('node:fs');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const t0 = Date.now();
const log = (...a) => console.log(`[+${String(Math.round((Date.now() - t0) / 100) / 10)}s]`, ...a);

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => {
      const to = setTimeout(() => rej(new Error('ws connect timeout')), 8000);
      ws.onopen = () => { clearTimeout(to); res(); };
      ws.onerror = (e) => { clearTimeout(to); rej(new Error('ws error ' + e.message)); };
    });
    const cdp = new CDP(ws);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && cdp.pending.has(msg.id)) {
        const { res, rej } = cdp.pending.get(msg.id); cdp.pending.delete(msg.id);
        if (msg.error) rej(new Error(JSON.stringify(msg.error).slice(0, 200))); else res(msg.result);
      }
    };
    return cdp;
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      const to = setTimeout(() => { this.pending.delete(id); rej(new Error(method + ' timeout')); }, 60000);
      this.pending.set(id, { res: (v) => { clearTimeout(to); res(v); }, rej: (e) => { clearTimeout(to); rej(e); } });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}

const run = async () => {
  fs.mkdirSync(OUT, { recursive: true });
  log('driver start; listing targets...');
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  log('targets:', list.map((t) => `${t.type}:${t.url.slice(0, 50)}`));
  const page = list.find((t) => t.type === 'page');
  if (!page) throw new Error('no page target');
  const cdp = await CDP.connect(page.webSocketDebuggerUrl);
  log('connected');
  await cdp.send('Runtime.enable');
  log('runtime enabled');

  const evalJs = async (expr) => {
    const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (r.exceptionDetails) return 'EXC:' + JSON.stringify(r.exceptionDetails.exception?.description || '').slice(0, 150);
    return r.result.value;
  };

  const grab = async (name) => {
    // CDP software re-render: the Xvfb screen never presents without a GPU,
    // and the swiftshader fallback crashes this renderer — fromSurface:false
    // renders the frame offscreen through the software path instead
    try {
      const r = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: false });
      fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.data, 'base64'));
      log('grabbed', name, `${Math.round(r.data.length / 1024)}KB`);
    } catch (e) {
      log('GRAB FAILED', name, String(e.message).slice(0, 90));
    }
  };

  for (let i = 0; i < 60; i += 1) {
    await sleep(1000);
    const q = await evalJs(`JSON.stringify({ n: document.querySelectorAll('.gd-card.gd-has-finish').length, any: document.querySelectorAll('.gd-card').length })`);
    log(`grid wait ${i}:`, q);
    if (JSON.parse(q).n > 0) break;
  }
  // THE AUDIT FREEZE (LAW #2): every animation + transition, elements AND
  // pseudo-elements, stands down — the software-rasterized coats stop
  // pegging the main thread and the frame lands
  await evalJs(`(() => {
    const s = document.createElement('style');
    s.id = 'probe-freeze';
    s.textContent = '*, *::before, *::after { animation: none !important; transition: none !important; }';
    document.head.appendChild(s);
    return 'frozen';
  })()`);
  await sleep(1500);
  const seats = await evalJs(`(() => {
    const cards = [...document.querySelectorAll('.gd-card.gd-has-finish')];
    return JSON.stringify(cards.slice(0, 3).map((card) => {
      const t = card.querySelector('.gd-card-title');
      const m = card.querySelector('.gd-card-meta');
      const box = (el) => { const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
      return { title: t ? box(t) : null, meta: m ? box(m) : null, name: t ? t.textContent.slice(0, 24) : '',
        finish: getComputedStyle(card).getPropertyValue('--gd-fin-ink-outline').trim(),
        scale: getComputedStyle(card).getPropertyValue('--card-scale').trim() };
    }));
  })()`);
  log('seats:', seats);
  fs.writeFileSync(`${OUT}/real_seats.json`, seats);

  const selState = async () => evalJs(`(() => { const s = window.getSelection(); return JSON.stringify({ r: s.rangeCount, len: String(s).length }); })()`);

  await evalJs(`window.getSelection().removeAllRanges()`);
  await sleep(500);
  grab('real_rest');
  log('rest sel:', await selState());

  // ROAD 1: real Ctrl+A
  await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 });
  await sleep(700);
  log('ctrlA sel:', await selState());
  grab('real_ctrlA');
  await evalJs(`window.getSelection().removeAllRanges()`);
  await sleep(400);

  // ROAD 2: the label drag
  const label = JSON.parse(await evalJs(`(() => {
    const els = [...document.querySelectorAll('div')].filter((d) => /CARDS/i.test(d.textContent || '') && (d.textContent || '').length < 40 && d.children.length === 0);
    if (!els.length) return '{"x":1200,"y":30}';
    const el = els[els.length - 1];
    const b = el.getBoundingClientRect();
    return JSON.stringify({ x: b.x + b.width / 2, y: b.y + b.height / 2, text: el.textContent });
  })()`));
  log('label anchor:', JSON.stringify(label));
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: Math.round(label.x), y: Math.round(label.y), button: 'left', clickCount: 1 });
  await sleep(150);
  for (let s = 1; s <= 8; s += 1) {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(label.x + (500 - label.x) * s / 8), y: Math.round(label.y + (400 - label.y) * s / 8), button: 'left' });
    await sleep(60);
  }
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 500, y: 400, button: 'left', clickCount: 1 });
  await sleep(700);
  log('drag sel:', await selState());
  grab('real_drag');
  await evalJs(`window.getSelection().removeAllRanges()`);
  log('DONE');
};

run().catch((e) => { console.error('driver failed:', e.message); process.exit(1); });
