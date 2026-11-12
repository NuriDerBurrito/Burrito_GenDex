// 1.7.6 probe — THE SPINE IS THE LIGHTEST ELEMENT (helpers.partContainerFace)
// Verifies: spine luminance > face, title, well on the measured dial
// (light + deep), and that the focus ground (well 88% + face 12%) can
// never reach the spine's rung. Runs INSIDE the project dir so the ESM
// import of the live helper resolves.
import { partContainerFace } from '../src/utils/helpers.js';

function lum(hex) {
  const c = hex.replace('#', '');
  const ch = (i) => parseInt(c.slice(i * 2, i * 2 + 2), 16) / 255;
  const lin = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const r = lin(ch(0)), g = lin(ch(1)), b = lin(ch(2));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => {
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};
const mix = (a, b, w) => {
  const pa = a.replace('#', ''), pb = b.replace('#', '');
  const f = (i) => Math.round(parseInt(pa.slice(i * 2, i * 2 + 2), 16) * (1 - w) + parseInt(pb.slice(i * 2, i * 2 + 2), 16) * w);
  return '#' + [0, 1, 2].map((i) => f(i).toString(16).padStart(2, '0')).join('');
};

const DIAL = [
  '#ff3df5', '#f5d36b', '#f7e8a0', '#c8402f', '#4b7bd8', '#1c2e5e',
  '#2e7d5b', '#e8b4c8', '#8d5fb8', '#d97b29', '#f3f0e7', '#0d0d12',
  '#7a2e2e', '#15b2cf', '#ff5a1f',
];

let fails = 0;
for (const hex of DIAL) {
  for (const deep of [false, true]) {
    const f = partContainerFace(hex, deep);
    if (!f) { console.log('FAIL parse', hex, deep); fails++; continue; }
    const face = f['--part-face'], title = f['--part-title'], well = f['--part-well'], spine = f['--part-spine'];
    const lightestSeat = Math.max(lum(face), lum(title), lum(well));
    const okLightest = lum(spine) >= Math.min(lightestSeat + 0.085, 0.99); // slack: near-white raws clamp at the ceiling
    const focusGround = mix(well, face, 0.12); // the box's own focus law
    const focusToSpine = contrast(focusGround, spine);
    const okIsolation = focusToSpine >= 1.05;
    const status = okLightest && okIsolation ? 'ok' : 'FAIL';
    if (status === 'FAIL') fails++;
    console.log(
      `${hex}${deep ? ' deep ' : ' light'} ${status} | lum spine=${lum(spine).toFixed(3)} lightestSeat=${lightestSeat.toFixed(3)} (face=${lum(face).toFixed(3)} title=${lum(title).toFixed(3)} well=${lum(well).toFixed(3)}) | focus-ground vs spine ${focusToSpine.toFixed(2)}:1 | spine=${spine}`
    );
  }
}
console.log(fails === 0 ? '\nALL GREEN — spine is the lightest element on every hex' : `\n${fails} FAILURES`);
process.exit(fails === 0 ? 0 : 1);
