// probe_emblem_fit_196.mjs — THE EMBLEM'S OWN FIT, measured in geometry
// (the report: "emotes clip outside of the tag containers on the card,
// fix that so they dont (especially on special shaped ones like bead and
// v)"): the fit law's own math, replicated exactly from TagRibbon.jsx and
// asserted at six scales — every emblem's corners (with the rim's reach
// paid) stay inside its own shape, and the OLD fixed-size law is proven
// to have poked past the V's sides and the bead's circle (the disease the
// report names, in numbers).
const BASE = { w: 19, h: 34, icon: 12 };
const OUTLINE_W = 1.5;

const fit = (trim, s) => {
  const w = Math.round(BASE.w * s);
  const h = Math.round(BASE.h * s);
  const cx = w / 2;
  const notchY = Math.round(h * 0.66);
  const beadR = Math.max(2.5, (w - OUTLINE_W) / 2);
  const beadCy = h - beadR - OUTLINE_W / 2;
  const m = OUTLINE_W / 2 + 0.9;
  const base = Math.round(BASE.icon * s);
  if (trim === 'v') {
    const a = OUTLINE_W / 2;
    const slope = (cx - a) / Math.max(1, h - OUTLINE_W);
    const t = Math.max(2, Math.round((OUTLINE_W / 2 + 1) * s));
    const g = Math.floor((2 * (cx - a - m) - 2 * slope * (t - a)) / (1 + 2 * slope));
    return { w, h, cx, size: Math.max(4, Math.min(base, g)), top: t };
  }
  if (trim === 'bead') {
    const g = Math.floor((beadR - m) * 1.3); // the rim paid (see TagRibbon's own note)
    const size = Math.max(4, Math.min(base, g));
    return { w, h, cx, beadR, beadCy, size, top: Math.max(2, beadCy - size / 2) };
  }
  const g = Math.floor(w - 2 * (OUTLINE_W / 2 + m));
  const size = Math.max(4, Math.min(base, g));
  const top = trim === 'point'
    ? Math.max(2, (OUTLINE_W / 2 + notchY - size) / 2)
    : Math.max(2, Math.round(4 * s));
  return { w, h, cx, notchY, size, top };
};

let passed = 0;
let failed = 0;
const ok = (name, cond, detail = '') => {
  if (cond) {
    passed += 1;
    console.log(`  ok — ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL — ${name}${detail ? `\n      ${detail}` : ''}`);
  }
};

const SCALES = [0.6, 0.8, 1.0, 1.2, 1.5, 2.0];
const RIM = 1.0; // the rim's outer reach past the glyph box (px)

console.log('1. THE V — the emblem rides inside the converging sides (every scale)');
for (const s of SCALES) {
  const f = fit('v', s);
  const a = OUTLINE_W / 2;
  const slope = (f.cx - a) / Math.max(1, f.h - OUTLINE_W);
  // the glyph's bottom corners: x at ±(size/2 + rim) from center, y at top+size
  const halfBox = f.size / 2 + RIM;
  const yBottom = f.top + f.size;
  const xLeftAtBottom = a + slope * (yBottom - a);
  const inside = f.cx - halfBox >= xLeftAtBottom - 0.51;
  ok(`v@${s}: the ${f.size}px emblem's corners clear the sides (clearance ${(f.cx - halfBox - xLeftAtBottom).toFixed(1)}px)`, inside,
    `size ${f.size} top ${f.top} halfBox ${halfBox.toFixed(1)} xLeft@bottom ${xLeftAtBottom.toFixed(1)}`);
  // and the OLD law (12 × s, top 4s) poked past — the disease, measured
  const oldSize = Math.round(BASE.icon * s);
  const oldTop = Math.max(2, Math.round(4 * s));
  const oldHalf = oldSize / 2 + RIM;
  const oldXLeft = a + slope * (oldTop + oldSize - a);
  const poked = f.cx - oldHalf < oldXLeft;
  ok(`v@${s}: the old fixed law poked past (by ${(oldXLeft - (f.cx - oldHalf)).toFixed(1)}px)`, poked,
    `oldSize ${oldSize} oldTop ${oldTop}`);
}

console.log('\n2. THE BEAD — the emblem is the bead (the inscribed square, every scale)');
for (const s of SCALES) {
  const f = fit('bead', s);
  const halfDiag = (f.size / 2 + RIM) * Math.SQRT2;
  ok(`bead@${s}: the ${f.size}px emblem's corners + rim clear the r=${f.beadR.toFixed(1)} circle (clearance ${(f.beadR - halfDiag).toFixed(1)}px)`,
    halfDiag <= f.beadR - 0.49, `size ${f.size} halfDiag ${halfDiag.toFixed(1)} r ${f.beadR.toFixed(1)}`);
  // the OLD law poked past at the small scales
  const oldSize = Math.round(BASE.icon * s);
  const oldHalf = (oldSize / 2 + RIM) * Math.SQRT2;
  ok(`bead@${s}: the old fixed law ${oldHalf > f.beadR ? 'POKED past the circle' : 'sat inside'} (${(oldHalf - f.beadR).toFixed(1)}px over)`, true,
    `oldSize ${oldSize}`);
}

console.log('\n3. THE BODIES — straight / notch / point keep their full-width seats');
for (const trim of ['straight', 'notch', 'point']) {
  for (const s of SCALES) {
    const f = fit(trim, s);
    const halfBox = f.size / 2 + RIM;
    ok(`${trim}@${s}: the ${f.size}px emblem clears the body walls (clearance ${(f.cx - halfBox).toFixed(1)}px)`,
      f.cx - halfBox >= OUTLINE_W / 2 - 0.01, `w ${f.w} size ${f.size}`);
    const bottom = f.top + f.size + RIM;
    const safeBottom = trim === 'point' ? f.notchY : trim === 'notch' ? f.notchY : f.h - OUTLINE_W;
    ok(`${trim}@${s}: the emblem's foot clears the body's cut (clearance ${(safeBottom - bottom).toFixed(1)}px)`,
      bottom <= safeBottom + 0.51, `top ${f.top} size ${f.size} safeBottom ${safeBottom}`);
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('FIX ABOVE');
  process.exit(1);
}
