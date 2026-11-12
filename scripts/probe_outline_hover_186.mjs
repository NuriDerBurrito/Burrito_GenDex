#!/usr/bin/env node
// 1.8.6 OUTLINE-HOVER PROBE (Playwright/Chromium) — settles THE OUTLINE
// ANSWERS THE HAND on a real engine before the version ships. The design
// under test ("prompt/note container have an outline , that outline
// dissapears when i hover over them (unselected ones , not selected ones)
// fix that so its visible and maybe reacts to it too"):
//   · THE DISEASE — the colored hover gathered to the RAW picked color,
//     which on a DEEP container IS the face: the outline hit ~1:1 and
//     stopped existing under the pointer.
//   · THE CURE — the hover gathers toward the face's own INK RUNG at half
//     weight: a light face's frame DARKENS, a deep face's frame BRIGHTENS,
//     both stepping AWAY from the face so the outline grows MORE legible
//     exactly when the hand reaches for it. The plain row keeps its accent
//     hue over a deeper ink floor.
// Measured LIVE: computed border-color at rest vs hover vs focus+hover,
// with WCAG-ish luminance contrast against the face — the outline must be
// MORE readable hovered than the disease's 1:1, and it must visibly
// REACT (the border changes between rest and hover).
import { chromium } from 'playwright';

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};
const settle = (ms) => new Promise((r) => setTimeout(r, ms));

// the app's own seats, verbatim in shape from index.css: the row's rest +
// hover laws, the doubled :has focus family (the 1.8.5 crown), the colored
// + deep twins, and the 1.8.6 ink-rung hovers.
const html = `<!doctype html><html><head><style>
  :root {
    --gd-ink: #2a2620; --gd-accent: #e8c14a; --gd-panel: #efe6d0;
    --gd-line: #cdc2a8; --gd-bg: #e4d9bf;
  }
  .gd-part-row {
    display: flex; gap: 8px; align-items: stretch; position: relative;
    padding: 9px 10px 9px 12px;
    border: 1.5px solid var(--gd-ink);
    background: color-mix(in srgb, var(--gd-panel) 92%, var(--gd-bg));
    box-shadow: 2px 2px 0 color-mix(in srgb, var(--gd-ink) 30%, transparent);
    transition: border-color 0.14s ease, box-shadow 0.14s ease;
    width: 280px; margin: 10px;
  }
  .gd-part-row:hover {
    border-color: color-mix(in srgb, var(--gd-accent) 50%, var(--gd-ink));
    box-shadow: 2.5px 2.5px 0 color-mix(in srgb, var(--gd-ink) 38%, transparent);
  }
  .gd-part-row.gd-part-row:has(.gd-prompt-box:focus) {
    border-color: color-mix(in srgb, var(--gd-accent) 72%, var(--gd-ink));
    box-shadow: 2px 2px 0 color-mix(in srgb, var(--gd-accent) 45%, transparent);
  }
  /* the colored container (the LIGHT face — a vivid yellow) */
  .gd-part-row.is-colored {
    border-color: var(--part-line);
    background: var(--part-face);
    color: var(--part-ink);
  }
  .gd-part-row.is-colored:hover {
    border-color: color-mix(in srgb, var(--part-color) 50%, var(--part-ink));
    box-shadow: 2.5px 2.5px 0 color-mix(in srgb, var(--part-color) 55%, #0e0e0e);
  }
  .gd-part-row.gd-part-row.is-colored:has(.gd-prompt-box:focus) {
    border-color: color-mix(in srgb, var(--gd-accent) 55%, var(--part-line));
    box-shadow: 2px 2px 0 color-mix(in srgb, var(--gd-accent) 40%, transparent);
  }
  /* the deep twin (a full-weight navy face) */
  .gd-part-row.is-colored.is-shade-deep {
    border-color: var(--part-line);
    background: var(--part-face);
  }
  .gd-part-row.is-colored.is-shade-deep:hover {
    border-color: color-mix(in srgb, var(--part-color) 50%, var(--part-ink));
    box-shadow: 2.5px 2.5px 0 color-mix(in srgb, var(--part-color) 62%, #0e0e0e);
  }
  .gd-part-row.is-colored.is-shade-deep.gd-part-row:has(.gd-prompt-box:focus),
  .gd-part-row.gd-part-row.is-colored.is-shade-deep:has(.gd-prompt-box:focus) {
    border-color: color-mix(in srgb, var(--gd-accent) 55%, var(--part-line));
  }
  .gd-prompt-box { flex: 1; border: none; background: transparent; outline: none; }
  .yellow-light { --part-color: #e8c14a; --part-face: #f3dfa0; --part-ink: #3a3210; --part-line: #8a7420; }
  .navy-deep    { --part-color: #1d2b64; --part-face: #1d2b64; --part-ink: #f0f2fa; --part-line: #3d4d85; }
</style></head><body>
  <div class="gd-part-row" id="plain"><input class="gd-prompt-box" id="plainBox"></div>
  <div class="gd-part-row is-colored yellow-light" id="light"><input class="gd-prompt-box" id="lightBox"></div>
  <div class="gd-part-row is-colored navy-deep is-shade-deep" id="deep"><input class="gd-prompt-box" id="deepBox"></div>
  <script>
    // the app's partContainerFace law in miniature: the LIGHT face is the
    // color lifted toward white, the DEEP face the color at full weight,
    // and --part-ink is the readable pick against the face.
  </script>
</body></html>`;

// WCAG relative luminance + contrast, verbatim in shape
const lumEval = `(function (c) {
  const s = String(c || '').trim();
  const lin = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  let m = s.match(/rgba?\\(([^)]+)\\)/);
  if (m) {
    const [r, g, b] = m[1].split(',').slice(0, 3).map(Number);
    return 0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255);
  }
  m = s.match(/oklab\\(([\\d.\\-e]+) ([\\d.\\-e]+) ([\\d.\\-e]+)/);
  if (m) {
    const L = parseFloat(m[1]) / 100, a = parseFloat(m[2]), b = parseFloat(m[3]);
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;
    const l = l_ * l_ * l_, mm = m_ * m_ * m_, ss = s_ * s_ * s_;
    const r = 4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * ss;
    const g = -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * ss;
    const bb = -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * ss;
    const cl = (v) => Math.min(1, Math.max(0, v));
    return 0.2126 * cl(r) + 0.7152 * cl(g) + 0.0722 * cl(bb);
  }
  m = s.match(/color\\(srgb ([\\d.\\-e]+) ([\\d.\\-e]+) ([\\d.\\-e]+)/);
  if (m) {
    const [r, g, b] = m.slice(1).map(Number);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  return null;
})`;
const contrastEval = `(function (a, b) {
  const la = ${lumEval}(a), lb = ${lumEval}(b);
  if (la == null || lb == null) return null;
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
})`;

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 340, height: 300 } });
  await page.setContent(html);
  await settle(80);

  const readRow = async (id) =>
    page.evaluate(
      ({ id, contrast }) => {
        const el = document.getElementById(id);
        const cs = getComputedStyle(el);
        return {
          border: cs.borderColor,
          face: cs.backgroundColor,
          contrast: window.eval(contrast)(cs.borderColor, cs.backgroundColor),
        };
      },
      { id, contrast: contrastEval }
    );

  const probeRow = async (id, label) => {
    // REST
    const rest = await readRow(id);
    // HOVER (unselected — no focus; the 0.14s transition settles first)
    await page.hover(`#${id}`);
    await settle(250);
    const hover = await readRow(id);
    // the outline must still EXIST (a real contrast against the face)
    check(`${label} · the unselected outline stays VISIBLE under the hover (a readable contrast)`, hover.contrast != null && hover.contrast >= 1.3, `contrast=${hover.contrast ? hover.contrast.toFixed(2) : 'null'}:1 (rest ${(rest.contrast || 0).toFixed(2)}:1)`);
    // and it must REACT (the border changed from its rest)
    check(`${label} · the outline REACTS to the hand (rest -> hover speaks a change)`, hover.border !== rest.border, `rest=${rest.border} hover=${hover.border}`);
    return { rest, hover };
  };

  // ── the three faces ────────────────────────────────────────────────────
  await probeRow('plain', 'A1 · the PLAIN row');
  await probeRow('light', 'A2 · the colored LIGHT row (a yellow family)');
  const deep = await probeRow('deep', 'A3 · the colored DEEP row (the report own worst case)');

  // ── the disease arm: the RAW-color hover on the deep face IS 1:1 ──────
  const rawDeep = await page.evaluate(
    ({ contrast }) => {
      const el = document.getElementById('deep');
      const face = getComputedStyle(el).backgroundColor;
      return window.eval(contrast)('rgb(29, 43, 100)', face); // the raw picked color
    },
    { contrast: contrastEval }
  );
  check('A4 · the disease arm speaks — the RAW color on the deep face is ~1:1 (the outline that stopped existing)', rawDeep != null && rawDeep < 1.1, `raw-on-face=${rawDeep ? rawDeep.toFixed(2) : 'null'}:1`);

  // ── the deep hover BRIGHTENS away from the face (the cure's direction) ─
  // (probeRow's own measures — rest read BEFORE the hover, hover read after
  // the transition settled: mid-flight blends never speak here)
  check('A5 · the deep frame BRIGHTENS under the pointer (hover steps AWAY from the face)', deep.hover.contrast > deep.rest.contrast * 1.25, `rest=${deep.rest.contrast.toFixed(2)}:1 -> hover=${deep.hover.contrast.toFixed(2)}:1`);

  // ── the 1.8.5 crown: the SELECTED outline out-ranks every hover ───────
  // (every read waits out the 0.14s border transition — a mid-flight blend
  // would read as a change that is not one; the pointer sits OFF the rows
  // for the focused read so the hover law cannot speak into it)
  for (const [rowId, boxId, label] of [
    ['plain', 'plainBox', 'B1 · the PLAIN row'],
    ['light', 'lightBox', 'B2 · the LIGHT row'],
    ['deep', 'deepBox', 'B3 · the DEEP row'],
  ]) {
    await page.mouse.move(1, 1); // the pointer off every row
    await settle(200);
    await page.focus(`#${boxId}`);
    await settle(250);
    const focused = await readRow(rowId);
    await page.hover(`#${rowId}`);
    await settle(250);
    const focusedHover = await readRow(rowId);
    check(`${label} · the SELECTED outline survives the hover (the 1.8.5 crown, kept)`, focusedHover.border === focused.border, `focused=${focused.border} focused+hover=${focusedHover.border}`);
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.mouse.move(1, 1);
    await settle(200);
  }

  await browser.close();
  const bad = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - bad}/${results.length} checks green`);
  process.exit(bad ? 1 : 0);
};

run().catch((e) => {
  console.error('PROBE ERROR:', e.message);
  process.exit(1);
});
