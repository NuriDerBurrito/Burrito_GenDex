#!/usr/bin/env node
// 1.8.3 KEYS-PROBE (Playwright/Chromium) — settles the two key laws on a
// real engine before the version ships:
//   A. THE NOTES' KEYS JOIN THE FRAME — does the notes' copy + expand pair
//      (seated on the label line, wrapped in .gd-notes-keys) now render
//      the parts' framed key law: the 24px stature, the ink-weight border,
//      the panel-mix face, the grounded shadow, the hover lift, the
//      copied beat — instead of the base ghost (transparent face, no
//      border) the report called "not clear"?
//   B. THE KEYS SPEAK THE ROW'S OWN COLOR — inside a colored container
//      (the vars threaded by the app's own partContainerFace), do the
//      right-rail keys and the notes' label-line keys both read the
//      color's own rungs (the --part-title ground, the --part-ink glyph,
//      the outline-ink frame), while the danger key keeps its tongue and
//      the uncolored keys keep the theme's neutral law?
// The probe replicates the app's own seats: the base .gd-icon-btn ghost,
// the .gd-part-keys framed family, the new .gd-notes-keys lane, the
// colored scope — with real vars from the app's own partContainerFace.
import { chromium } from 'playwright';
import { partContainerFace } from '../src/utils/helpers.js';

const pinkFace = partContainerFace('#c2417f', false) || {};
const navyFace = partContainerFace('#1f3a5f', true) || {};
const varText = (face, color) =>
  `--part-color: ${color}; ` +
  Object.entries(face)
    .map(([k, v]) => `${k}: ${v};`)
    .join(' ');

const html = `<!doctype html><html><head><style>
  :root {
    --gd-bg: #f2efe9;
    --gd-panel: #faf8f4;
    --gd-ink: #17130c;
    --gd-line: #d8d2c6;
    --gd-chrome: #2a241a;
    --gd-mute: #8a8375;
    --gd-accent: #3e6b8f;
    --gd-accent-ink: #f7f1e4;
    --gd-radius: 6px;
    --gd-btn-radius: 4px;
  }
  body { margin: 0; padding: 16px; background: var(--gd-bg); font: 12px/1.4 sans-serif; display: flex; gap: 24px; align-items: flex-start; }
  .gd-part-row { display: flex; gap: 8px; align-items: stretch; position: relative; padding: 9px 10px; border: 1.5px solid var(--gd-ink); border-radius: var(--gd-radius); background: color-mix(in srgb, var(--gd-panel) 92%, var(--gd-bg)); margin-bottom: 14px; }
  .gd-part-row.is-colored { border-color: var(--part-line); background: var(--part-face); color: var(--part-ink); }
  /* the base ghost (index.css's own law) */
  .gd-icon-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 26px; height: 26px; border: 1px solid transparent; border-radius: var(--gd-btn-radius);
    background: transparent; color: var(--gd-mute);
    transition: color 0.12s ease, border-color 0.12s ease, background-color 0.12s ease;
  }
  /* the parts' framed family (index.css verbatim) */
  .gd-part-keys { display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; align-self: flex-start; }
  .gd-part-keys .gd-icon-btn {
    width: 24px; height: 24px;
    border: 1px solid color-mix(in srgb, var(--gd-ink) 55%, var(--gd-line));
    border-radius: var(--gd-btn-radius, calc(var(--gd-radius) - 2px));
    background: color-mix(in srgb, var(--gd-panel) 92%, var(--gd-bg));
    color: var(--gd-chrome);
    box-shadow: 0 1.5px 0 color-mix(in srgb, var(--gd-ink) 26%, transparent);
  }
  .gd-part-keys .gd-icon-btn.is-copied { color: var(--gd-accent-ink); background: var(--gd-accent); border-color: var(--gd-accent); }
  /* the notes' own lane (the 1.8.3 law, index.css verbatim) */
  .gd-notes-keys { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
  .gd-notes-keys .gd-icon-btn {
    width: 24px; height: 24px;
    border: 1px solid color-mix(in srgb, var(--gd-ink) 55%, var(--gd-line));
    border-radius: var(--gd-btn-radius, calc(var(--gd-radius) - 2px));
    background: color-mix(in srgb, var(--gd-panel) 92%, var(--gd-bg));
    color: var(--gd-chrome);
    box-shadow: 0 1.5px 0 color-mix(in srgb, var(--gd-ink) 26%, transparent);
  }
  .gd-notes-keys .gd-icon-btn:not(:disabled):hover { color: var(--gd-chrome); border-color: var(--gd-ink); background: var(--gd-panel); box-shadow: 0 2.5px 0 color-mix(in srgb, var(--gd-ink) 34%, transparent); transform: translateY(-1px); }
  .gd-notes-keys .gd-icon-btn.is-copied { color: var(--gd-accent-ink); background: var(--gd-accent); border-color: var(--gd-accent); box-shadow: 0 1.5px 0 color-mix(in srgb, var(--gd-ink) 30%, transparent); }
  /* the colored scope (the 1.8.3 law, index.css verbatim) */
  .gd-part-row.is-colored .gd-part-keys .gd-icon-btn,
  .gd-part-row.is-colored .gd-notes-keys .gd-icon-btn {
    border-color: color-mix(in srgb, var(--part-line, var(--gd-ink)) 55%, var(--part-title, var(--gd-line)));
    background: var(--part-title, color-mix(in srgb, var(--gd-panel) 92%, var(--gd-bg)));
    color: var(--part-ink, var(--gd-chrome));
    box-shadow: 0 1.5px 0 color-mix(in srgb, var(--part-ink, var(--gd-ink)) 26%, transparent);
  }
  .gd-part-row.is-colored .gd-part-keys .gd-icon-btn.is-part-del { color: #ff8d7d; border-color: color-mix(in srgb, #c8402f 45%, var(--part-line, var(--gd-line))); }
  .probe { width: 24px; height: 24px; }
</style></head><body>
  <div>
    <!-- the UNCOLORED pair: a part row + a notes box, theme-neutral -->
    <div class="gd-part-row" id="plainRow">
      <div class="gd-part-keys">
        <button class="gd-icon-btn" id="plainPartCopy">C</button>
        <button class="gd-icon-btn is-part-del" id="plainPartDel">X</button>
      </div>
    </div>
    <div class="gd-part-row" id="plainNotes">
      <div class="gd-notes-keys">
        <button class="gd-icon-btn" id="noteCopy">C</button>
        <button class="gd-icon-btn" id="noteExpand">E</button>
      </div>
    </div>
  </div>
  <div>
    <!-- the COLORED pair: the pink part row (light shade) + the navy notes box (deep shade) -->
    <div class="gd-part-row is-colored" id="pinkRow" style="${varText(pinkFace, '#c2417f')}">
      <div class="gd-part-keys">
        <button class="gd-icon-btn" id="pinkCopy">C</button>
        <button class="gd-icon-btn is-part-del" id="pinkDel">X</button>
      </div>
      <div class="probe" id="probePinkTitle" style="background: var(--part-title);"></div>
      <div class="probe" id="probePinkInk" style="background: var(--part-ink);"></div>
      <div class="probe" id="probePinkBorder" style="border: 1px solid color-mix(in srgb, var(--part-line) 55%, var(--part-title));"></div>
    </div>
    <div class="gd-part-row is-colored" id="navyNotes" style="${varText(navyFace, '#1f3a5f')}">
      <div class="gd-notes-keys">
        <button class="gd-icon-btn" id="navyNoteCopy">C</button>
      </div>
      <div class="probe" id="probeNavyTitle" style="background: var(--part-title);"></div>
      <div class="probe" id="probeNavyInk" style="background: var(--part-ink);"></div>
    </div>
  </div>
</body></html>`;

let passed = 0;
let failed = 0;
const ok = (name, cond, detail = '') => {
  if (cond) {
    passed += 1;
    console.log(`  ok — ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL — ${name}${detail ? ` (${detail})` : ''}`);
  }
};
const sameColor = (a, b) => a.replace(/\s+/g, '') === b.replace(/\s+/g, '');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
await page.setContent(html);
const styleOf = (sel) =>
  page.locator(sel).evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      w: cs.width,
      h: cs.height,
      bg: cs.backgroundColor,
      color: cs.color,
      borderW: cs.borderTopWidth,
      borderC: cs.borderTopColor,
      shadow: cs.boxShadow,
      transform: cs.transform,
    };
  });

console.log("\nA. THE NOTES' KEYS JOIN THE FRAME (\"they dont have a button style\")");
{
  const note = await styleOf('#noteCopy');
  const part = await styleOf('#plainPartCopy');
  ok('A1 — the ghost is retired (a real face + a real border)', note.bg !== 'rgba(0, 0, 0, 0)' && note.borderW === '1px', `bg=${note.bg}, borderW=${note.borderW}`);
  ok('A2 — the parts\' own stature (24px, the framed family)', note.w === '24px' && note.h === '24px', `${note.w}x${note.h}`);
  ok('A3 — the framed law verbatim (face + border + shadow match the parts\' rail)', sameColor(note.bg, part.bg) && sameColor(note.borderC, part.borderC) && note.shadow === part.shadow, `bg=${note.bg}/${part.bg}`);
  const copied = await page.evaluate(() => {
    document.getElementById('noteCopy').classList.add('is-copied');
    document.getElementById('plainPartCopy').classList.add('is-copied');
    return null;
  });
  // let the 0.12s background-color breath settle, then read both seats in
  // the engine's own serialization (the beat must MATCH, not spell alike)
  await page.waitForTimeout(300);
  const noteCopiedBg = await page.locator('#noteCopy').evaluate((el) => getComputedStyle(el).backgroundColor);
  const partCopiedBg = await page.locator('#plainPartCopy').evaluate((el) => getComputedStyle(el).backgroundColor);
  const accentBg = await page.evaluate(() => {
    const el = document.createElement('div');
    el.style.background = 'var(--gd-accent)';
    document.body.appendChild(el);
    const v = getComputedStyle(el).backgroundColor;
    el.remove();
    return v;
  });
  ok(
    'A4 — the copied beat reaches the pair (the accent face at last)',
    sameColor(noteCopiedBg, partCopiedBg) && sameColor(partCopiedBg, accentBg),
    `note=${noteCopiedBg}, part=${partCopiedBg}, accent=${accentBg}`
  );
  await page.hover('#noteExpand');
  const hovered = await styleOf('#noteExpand');
  await page.mouse.move(0, 0);
  ok('A5 — the hover lift speaks (translateY(-1px) + the ink border)', hovered.transform.includes('matrix') && hovered.borderW === '1px' && hovered.borderC !== 'rgb(0, 0, 0)', `transform=${hovered.transform}`);
}

console.log("\nB. THE KEYS SPEAK THE ROW'S OWN COLOR (\"follow the container's color theme too\")");
{
  const key = await styleOf('#pinkCopy');
  const title = await styleOf('#probePinkTitle');
  const ink = await styleOf('#probePinkInk');
  const border = await styleOf('#probePinkBorder');
  ok('B1 — the ground is the title band\'s own rung (--part-title)', sameColor(key.bg, title.bg), `key=${key.bg}, title=${title.bg}`);
  ok('B2 — the glyph is the face\'s readable ink (--part-ink)', sameColor(key.color, ink.bg), `key=${key.color}, ink=${ink.bg}`);
  ok('B3 — the frame is the outline ink\'s 55% word over the title rung', sameColor(key.borderC, border.borderC), `key=${key.borderC}, probe=${border.borderC}`);
  const plain = await styleOf('#plainPartCopy');
  ok('B4 — the theme-neutral face is gone (the colored keys read different)', !sameColor(key.bg, plain.bg) && !sameColor(key.color, plain.color), `bg same=${sameColor(key.bg, plain.bg)}`);
  const navy = await styleOf('#navyNoteCopy');
  const navyTitle = await styleOf('#probeNavyTitle');
  const navyInk = await styleOf('#probeNavyInk');
  ok('B5 — the notes\' lane rides the same twin (the navy notes box speaks too)', sameColor(navy.bg, navyTitle.bg) && sameColor(navy.color, navyInk.bg), `bg=${navy.bg}/${navyTitle.bg}`);
  const del = await styleOf('#pinkDel');
  ok('B6 — the danger key keeps its tongue inside the scope (#ff8d7d)', del.color === 'rgb(255, 141, 125)', `color=${del.color}`);
}

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
