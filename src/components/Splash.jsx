import { useMemo, useState } from 'react';
import clsx from 'clsx';
import gendexLogo from '../assets/gendex_logo.png';
import { APP } from '../constants/index.js';
import { buildSplashReels } from '../utils/helpers.js';

// 1.0.2 — THE SPLASH SPEAKS THE NEW MARK ("the rest of the instances like on
// launch/splash screen and such will utilize Burrito_GenDex_logo.png and will
// remove the x between gen and dex"): the burrito mark is the launch image
// and the wordmark is GENDEX — one language with the titlebar and the About
// page, no tilted ✖ anywhere.
// 1.0.3 — THE FULL NAME ("in the splash screen, it should be 'Burrito GenDex'
// not just gendex"): the wordmark reads the whole studio name now. One line,
// tracking eased a touch so the longer lockup keeps the same ceremonial width.
// 1.0.4 — THE SPLASH BECOMES A PLACE ("make the splash screen a bit better by
// including effects maybe and loading feedback"): the launch cover now has
// weather. A soft halo breathing behind the lockup (compositor-only, see
// .gd-splash-* in index.css), a quiet drift of specks rising past it, and a
// one-shot entrance rise for the whole stack. Feedback: the boot speaks its
// REAL phases (App drives status through Loading database -> Preparing
// workspace -> Ready) and an indeterminate progress bar sweeps under the
// status line, so the wait visibly moves. The logo keeps its 2.5s pulse —
// the signature beat.
// 1.0.5 — THE RAYS STEP ASIDE ("i dont like the godrays, remove them from
// splash screen and about section, and improve the glow"): the fan of beams
// is gone from the launch too. The halo grew — bigger, layered, breathing
// deeper.
// 1.0.7 — THE LIGHT SPEAKS THE THEME ("the glow in about and splash should
// be related to the theme color"): the halo's stops mix the active theme's
// own accent pair, with the house green as the pre-boot fallback.
// 1.1.0 — THE LIGHT MOVES UNDER THE MARK ("the glow in splash screen should
// be below the app icon, not in the center"): the halo used to center on the
// SCREEN — which lands it between the wordmark and the tagline, floating in
// the lockup's middle. It now seats INSIDE the mark wrapper, centered a
// hand's width below the icon's bottom edge: a light pool the mark stands
// over, wherever the stack ends up sitting. AND THE PLACE STOPS BEING EMPTY
// ("improve the splash screen since it does seem empty still"): a faint dot
// field + edge veil gives the dark some texture (masked away from the
// lockup so the center stays clean), four hairline corner brackets frame the
// composition (tinted by the theme's accent), the mark gains a soft mirrored
// REFLECTION dissolving into its own glow, the drift of specks widens its
// spread, and a quiet footer line pins the bottom edge — the screen now
// reads as a designed cover, not a logo on a void.
// 1.1.4 — THE PULSE-IN IS ONE SHOT ("make the icon start as grey as it
// pulses in and gets colored, but dont pulse it back out or grey it or
// darken it again"): the looping opacity/scale pulse is retired with the
// old wake-split (see .splash-logo-animate in index.css). The mark makes
// ONE entrance — grey, dim and small, swelling to full color and full
// presence over the same 2.5s signature beat — and holds there for the
// rest of the launch: no pulse-out, no re-grey, no darkening, ever.
// 1.1.6 — THE COVER SPEAKS THE THEME ("the splash screen ensure it also
// fits the style so its not darkmode and suddenly it changes in style and
// colors, fix it so it starts with the appropriate theme"): the cover used
// to be hard-coded dark — a near-black board, cream wordmark, dark veil —
// so every light theme (Paper, Archive Ivory, Numei…) booted as a DARK
// launch screen that visibly flipped to light the moment the workspace
// arrived. The cover is born in the user's own theme now: renderer.js
// replays the theme snapshot BEFORE React mounts (1.0.9), so by the time
// this component paints, --gd-bg / --gd-chrome / --gd-mute / --gd-accent
// are ALREADY the user's theme tokens — the cover's board, wordmark,
// status line, veil and foot all read them directly (see .gd-splash-root
// in index.css). What CSS vars alone cannot decide is the LIGHT-ONLY law
// (the halo's screen blend washes out on paper, the veil darkens what
// should brighten), so the shade is measured ONCE at mount from the live
// --gd-bg luminance and carried as data-shade — dark covers keep the
// screen-blended glow, light covers switch to a normal-blend bloom and a
// soft ink veil. Either way the FIRST frame is already the right theme:
// no dark-mode prologue, no mid-flight style change.
// 1.1.8 — THE GLOW LEAVES, THE COVER GROWS ("remove glow from the splash
// screen, instead just decoreate it more so its not empty"): the halo
// that breathed under the mark since 1.0.4 is retired — every trace of
// it (the pool, the breath, the shade law that only existed to tune its
// blend) — and in its seat the cover gains a fuller specimen-sheet
// composition: edge TICKS pairing the corner brackets, a STUDIO COLOPHON
// at the top edge (the footer's twin), hairline RULES flanking the
// wordmark, and a three-diamond ORNAMENT row under the tagline. The
// screen reads as a printed plate now — decorated by DRAWING, not by
// light.
// 1.2.6 — THE FILM REELS RIDE THE WINGS ("add a film reel scroll on the
// left and right empty spaces of the splash screen, one that scrolls up
// and the other down, containing random cards from the collection — the
// cards must have a thumbnail/top image to be included, cards without a
// thumbnail dont count, the cards shouldnt repeat consequetivly, each
// side needs at least 4 different cards before repeating, so 8 total,
// if there is less than 8 cards fill the rest with fake cards — pixel
// art or animated grain, or your own design"): the empty wings beside
// the lockup become two vertical film strips — a strip of real card
// covers (prev/thumb tier, the fast-decoding seat) drifting in opposite
// directions (the left reel climbs, the right reel falls), each frame
// sprocketed like a frame of film and faded at both ends so the strips
// read as atmosphere, never as content fighting the lockup. The seating
// law lives in ONE place (buildSplashReels in utils/helpers.js — the
// never-adjacent law, the 4-deep windows on BOTH sides, the every-card-
// seats + fake-pad law for short pools), and the FAKE frames are painted
// here: pixel-art leader frames (a deterministic 6x8 glyph in the
// theme's own accent, seeded per seat) wearing an animated grain wash —
// a film leader between features, not a broken image. The reels mount
// the moment the db lands (App passes the pool the same beat), so the
// strips are already rolling for most of the boot's 2.5s ceremony.
const REEL_SLOTS = 8;

// THE FAKE FRAME: a deterministic pixel glyph (seeded 6x8 grid, two ink
// tones of the theme's accent) + the animated grain wash. Pure inline
// SVG (shape-rendering: crispEdges) — no assets, no decode, and the
// pattern differs per seed so a padded strip never reads as one stamp
// repeated. The grain is CSS (see .gd-reel-grain): two layered dot
// fields stepping their positions — a quiet static, the film-leader
// language.
function ReelFakeFrame({ seed }) {
  const px = useMemo(() => {
    let a = (Number(seed) + 1) * 2654435761;
    const next = () => {
      a ^= a << 13;
      a ^= a >>> 17;
      a ^= a << 5;
      return ((a >>> 0) % 1000) / 1000;
    };
    const cells = [];
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 6; x += 1) {
        const r = next();
        // a card silhouette bias: the lower band denser (the "art" of a
        // placeholder card), the top sparse (its sky)
        const bias = y < 3 ? 0.72 : 0.42;
        if (r > bias) cells.push({ x, y, tone: r > 0.88 ? 2 : 1 });
      }
    }
    return cells;
  }, [seed]);
  return (
    <span className="gd-reel-fake">
      <svg viewBox="0 0 6 8" shapeRendering="crispEdges" aria-hidden>
        {px.map((c) => (
          <rect
            key={`${c.x}-${c.y}`}
            x={c.x}
            y={c.y}
            width={1}
            height={1}
            fill={c.tone === 2 ? 'var(--gd-accent)' : 'var(--gd-chrome)'}
            opacity={c.tone === 2 ? 0.85 : 0.34}
          />
        ))}
      </svg>
      <span className="gd-reel-grain" aria-hidden />
    </span>
  );
}

// THE REEL: one masked column of frames (two stacked copies of the
// sequence, translateY looped — the marquee law, transform-only). `dir`
// picks the climb (up) or the fall (down); both reels share the clock so
// the pair reads as one mechanism.
// 1.2.7 — THE STRIP STARTS MID-REEL ("the cards in the splash area should
// be slightly more randomized"): both strips used to begin their loop at
// frame one every launch — the same opening card led the same sequence
// each time, reading as a fixed playlist. Each reel now rolls a random
// NEGATIVE animation-delay (a mid-loop starting phase), so the strips
// enter at a different point of their run on every launch — same law,
// different opening frame.
// 1.2.9 — THE SEAT SPEAKS ITS WING POSITION: `seat` names the reel's
// column ('lo' left-outer, 'li' left-inner, 'ri' right-inner, 'ro'
// right-outer) — the CSS seats each wing's pair at its own offset from
// the window's edge (see .gd-reel.is-lo/.is-li/.is-ri/.is-ro), with the
// inner pair bowing out on narrower windows so the lockup never fights
// the strips for room.
function SplashReel({ seats, dir, seat }) {
  const startDelay = useMemo(() => -(Math.random() * 26), []);
  // 1.3.1 — A BROKEN COVER READS AS A LEADER (the pool only carries cards
  // that own covers, but a record whose FILE is gone on disk used to paint
  // a broken box mid-reel — a frame that reads as a ghost slot, exactly the
  // "i just see all pixels / blank frames" report). Every reel tracks the
  // URLs that failed to decode and re-renders those frames as pixel-art
  // leaders: a missing file is indistinguishable from a short pool, the
  // reel never shows a hole, and the boot keeps its film-leader language.
  const [bad, setBad] = useState(() => new Set());
  const markBad = (url) =>
    setBad((prev) => {
      if (prev.has(url)) return prev;
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  // each stacked copy speaks its own key namespace — the track's children
  // are one flat list and the two runs must never collide.
  const copy = (p) =>
    (seats || []).flatMap((s, i) =>
      s.fake || bad.has(s.url)
        ? [<ReelFakeFrame key={`${p}f${i}`} seed={(s.seed ?? 0) + i} />, <span key={`${p}h${i}`} className="gd-reel-holes" aria-hidden />]
        : [<img key={`${p}r${i}`} src={s.url} alt="" draggable={false} onError={() => markBad(s.url)} />, <span key={`${p}h${i}`} className="gd-reel-holes" aria-hidden />]
    );
  return (
    <div className={clsx('gd-reel', `is-${seat}`, dir === 'down' && 'is-down')} aria-hidden>
      <div className="gd-reel-track" style={{ animationDelay: `${startDelay.toFixed(2)}s` }}>
        {copy('a-')}
        {copy('b-')}
      </div>
    </div>
  );
}

export default function Splash({ status, loaded, reels = null }) {
  const phase = String(status || 'Starting').toUpperCase();

  // 1.1.6 — THE SHADE READ (see the note above): one measurement of the
  // theme the snapshot already applied. A missing/unreadable token falls
  // back to dark — the historical look, and the CSS default tokens' shade.
  const shade = useMemo(() => {
    try {
      if (typeof document === 'undefined' || !window.getComputedStyle) return 'dark';
      const raw = getComputedStyle(document.documentElement).getPropertyValue('--gd-bg').trim();
      const h = String(raw).replace('#', '');
      if (!/^[0-9a-fA-F]{6}$/.test(h)) return 'dark';
      const chan = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
      const lin = chan.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
      const lum = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
      return lum > 0.5 ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  }, []);

  // 1.2.6 — THE DRAW: one deal per pool identity (the pool lands in a
  // single beat when the db arrives — a stable deal for the whole boot).
  // 1.2.9 — THE DRAW IS AN ARRAY OF REELS NOW (see buildSplashReels): four
  // seat arrays — the wings' outer and inner columns — dealt from ONE law
  // with no card repeating anywhere on the screen. The seats render
  // wing-major: [left-outer, left-inner, right-inner, right-outer], the
  // directions alternating (up / down / up / down) so the four columns
  // read as one mechanism turning beside the lockup.
  // 1.3.3 — THE DEAL IS SEEDED BY THE POOL'S OWN CONTENT ("the splash film
  // reels sometimes would flicker, or morelike be invisible then visible
  // suddenly"): buildSplashReels seeded itself from Date.now(), so ANY
  // re-run of this memo dealt a DIFFERENT shuffle — and the memo re-runs
  // whenever the `reels` prop changes identity, which happens on every db
  // state commit after the pool lands (the boot's own settings writes,
  // a patch, a save) even when the pool's CONTENT is identical. Every
  // frame's img then took a NEW src, the covers re-decoded from scratch
  // (the strip's plate reads near-invisible against the cover), and the
  // reels blinked out and popped back in — the left columns, first in
  // DOM order, showed it worst. The seed is a djb2 hash of the pool's
  // joined URLs now: the same pool ALWAYS deals the same seats, an
  // identity-only re-run paints nothing at all, and the strips only
  // truly re-deal when the collection itself changes.
  const dealSeed = useMemo(() => {
    const key = Array.isArray(reels) ? reels.join('|') : String(reels || '');
    let h = 5381;
    for (let i = 0; i < key.length; i += 1) h = ((h * 33) ^ key.charCodeAt(i)) & 0x7fffffff;
    return h | 0;
  }, [reels]);
  const reelSeats = useMemo(
    () => buildSplashReels(reels, { slots: REEL_SLOTS, seed: dealSeed }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reels, dealSeed]
  );
  const REEL_SEATS = [
    { seat: 'lo', dir: 'up' },
    { seat: 'li', dir: 'down' },
    // 1.6.3 — THE WINGS MIRROR ("the splash film reels … the two on right
    // and two on left , i want you to reverse the direction of one, either
    // reverse the two on the right so instead of up its down and down is
    // up , or the other, just so it gives a better visual sync on the
    // splash window"): the right wing's pair swaps its directions — the
    // inner right reel climbs where it used to fall, the outer right
    // falls where it used to climb — so the two wings read as one
    // mirrored mechanism (left's up/down answered by right's down/up)
    // instead of two columns running the same ladder side by side.
    { seat: 'ri', dir: 'down' },
    { seat: 'ro', dir: 'up' },
  ];

  return (
    <div
      className={clsx('gd-splash-root fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500', loaded ? 'opacity-0 pointer-events-none' : 'opacity-100')}
      data-shade={shade}
      aria-hidden={loaded}
    >
      {/* 1.2.6 — THE REELS: the wings' film strips (see the note at the
          top of this file). The gate is the pool being KNOWN, not the pool
          being full — a landed-but-empty collection (a fresh install, or a
          db whose cards carry no covers) mounts the reels as all pixel
          leaders per the fake-fill law; only a pool that has not landed
          yet (null — the db still loading) leaves the wings empty.
          1.2.9 — FOUR COLUMNS: two per wing (the outer pair at the window's
          edges, the inner pair a column closer to the lockup, hidden on
          narrow windows by CSS), dealt as one screen-wide no-repeat draw. */}
      {reels !== null &&
        REEL_SEATS.map((slot, i) => <SplashReel key={slot.seat} seats={reelSeats[i]} dir={slot.dir} seat={slot.seat} />)}
      {/* The ambient field — pure decoration, aria-hidden, and every layer
          animates a single compositor property (transform or opacity); the
          static layers (dots, veil, corners, ticks) paint nothing that
          moves at all. */}
      <div className="gd-splash-fx" aria-hidden>
        <div className="gd-splash-field" />
        <div className="gd-splash-veil" />
        <span className="gd-splash-corner is-tl" />
        <span className="gd-splash-corner is-tr" />
        <span className="gd-splash-corner is-bl" />
        <span className="gd-splash-corner is-br" />
        {/* 1.1.8 — THE EDGE TICKS: four short hairline marks at the middle
            of each edge, pairing the corner brackets — the specimen
            sheet's full framing language (corners + compass points). */}
        <span className="gd-splash-tick is-t" />
        <span className="gd-splash-tick is-b" />
        <span className="gd-splash-tick is-l" />
        <span className="gd-splash-tick is-r" />
        <span className="gd-splash-speck" style={{ '--gd-sp-x': '-260px', '--gd-sp-d': '-2.4s', '--gd-sp-s': '2px', '--gd-sp-o': '0.35' }} />
        <span className="gd-splash-speck" style={{ '--gd-sp-x': '-150px', '--gd-sp-d': '0s', '--gd-sp-s': '2px', '--gd-sp-o': '0.5' }} />
        <span className="gd-splash-speck" style={{ '--gd-sp-x': '-60px', '--gd-sp-d': '-6.4s', '--gd-sp-s': '2px', '--gd-sp-o': '0.45' }} />
        <span className="gd-splash-speck" style={{ '--gd-sp-x': '40px', '--gd-sp-d': '-4.8s', '--gd-sp-s': '3px', '--gd-sp-o': '0.4' }} />
        <span className="gd-splash-speck" style={{ '--gd-sp-x': '120px', '--gd-sp-d': '-3.2s', '--gd-sp-s': '3px', '--gd-sp-o': '0.35' }} />
        <span className="gd-splash-speck" style={{ '--gd-sp-x': '210px', '--gd-sp-d': '-1.6s', '--gd-sp-s': '2px', '--gd-sp-o': '0.3' }} />
        <span className="gd-splash-speck" style={{ '--gd-sp-x': '290px', '--gd-sp-d': '-5.6s', '--gd-sp-s': '2px', '--gd-sp-o': '0.28' }} />
      </div>

      {/* 1.1.8 — THE STUDIO COLOPHON: the foot's twin at the top edge —
          the maker's line, flanked by fading rules, pinning the cover's
          top so the composition reads framed from both ends. */}
      <div className="gd-splash-colo select-none" aria-hidden>
        <span className="gd-splash-foot-rule" />
        <span className="gd-splash-foot-word">GENESIS ITERATIONS</span>
        <span className="gd-splash-foot-rule is-right" />
      </div>

      <div className="gd-splash-stack">
        {/* 1.1.0 — THE MARK'S STAGE: the wrapper that owned the icon's own
            box (the halo used to seat here — 1.1.8 retired it with every
            trace of the glow; the wrapper stays as the mark's frame).
            1.1.1 — THE REFLECTION IS RETIRED ("there is some weird grey shape
            on the glow in the splash screen"): the mirrored mark used to sit
            here at 16% opacity straight over the light pool, and on the dark
            boot cover it read exactly as the user described — a desaturated
            grey smudge IN the glow, more glitch than gloss. The mark stands
            on its own now; the board beneath it stays clean. */}
        <div className="gd-splash-mark">
          <img src={gendexLogo} alt="" className="w-24 h-24 object-contain splash-logo-animate" draggable={false} />
        </div>
        {/* 1.1.8 — THE WORDMARK WEARS RULES: hairlines fading out from both
            ends of the lockup line — the same rule language the footer and
            the colophon speak, now holding the title's wings so the center
            block reads anchored to the page's frame. */}
        <div className="gd-splash-word-row mt-6">
          <span className="gd-splash-word-rule" aria-hidden />
          <div className="gd-splash-word font-display text-xl font-bold tracking-[0.24em] select-none">
            BURRITO GENDEX
          </div>
          <span className="gd-splash-word-rule is-right" aria-hidden />
        </div>
        <div className="gd-splash-tag mt-2 font-mono text-[10px] tracking-[0.32em] select-none">
          {APP.tagline} · V{APP.version}
        </div>
        {/* 1.1.8 — THE ORNAMENT ROW: three small diamonds under the tagline
            — a printer's fleuron. Pure drawing, static, whisper-quiet. */}
        <div className="gd-splash-orn mt-4" aria-hidden>
          <span className="gd-splash-orn-dot" />
          <span className="gd-splash-orn-dot is-mid" />
          <span className="gd-splash-orn-dot" />
        </div>

        {/* Loading feedback — the indeterminate sweep says "working" while
            the status line says WHERE the boot is. */}
        <div className="gd-splash-progress mt-9" aria-hidden>
          <span className="gd-splash-progress-bar" />
        </div>
        <div className="gd-splash-status mt-3 font-mono text-[10px] tracking-[0.22em]">
          {phase}
        </div>
      </div>

      {/* 1.1.0 — THE FOOTER: a quiet line pinned to the bottom edge, flanked
          by fading rules — the cover's colophon. */}
      <div className="gd-splash-foot select-none" aria-hidden>
        <span className="gd-splash-foot-rule" />
        <span className="gd-splash-foot-word">RUNS OFFLINE · YOUR ARCHIVE STAYS YOURS</span>
        <span className="gd-splash-foot-rule is-right" />
      </div>
    </div>
  );
}
