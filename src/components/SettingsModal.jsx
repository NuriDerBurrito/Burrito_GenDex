import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Blend,
  Bookmark,
  UnfoldVertical,
  Check,
  CircleHelp,
  Copy,
  DatabaseBackup,
  FileDown,
  FileUp,
  FolderOpen,
  FolderTree,
  Gauge,
  HardDrive,
  Images,
  Info,
  Keyboard,
  LayoutGrid,
  Layers,
  LocateFixed,
  MousePointerClick,
  Palette,
  PanelRight,
  PanelTop,
  Radio,
  Redo2,
  RefreshCw,
  RotateCcw,
  Save,
  ScrollText,
  Search,
  Shapes,
  SlidersHorizontal,
  Spline,
  Sparkles,
  Speech,
  Square,
  Stamp,
  Sun,
  Tags,
  Timer,
  Trash2,
  Type,
  Undo2,
  UserPlus,
  X,
  ZoomIn,
} from 'lucide-react';
import Modal from './Modal.jsx';
import { ColorPickerButton } from './ColorPicker.jsx';
import {
  AUTOSAVE_OPTIONS,
  PANEL_WIDTH_RANGE,
  SIDEBAR_WIDTH_RANGE,
  CARD_COL_WIDTH_RANGE,
  TAG_LIMIT_RANGE,
  LOG_LIMIT_RANGE,
  clampLogLimit,
  TAG_POSITIONS,
  TAG_SCALE_RANGE,
  TAG_SEPARATION_RANGE,
  TEXTURES,
  TEX_SURFACES,
  THEME_PRESETS,
  UPDATE_CHANNELS,
  DOWNLOAD_PAGE_URL,
  ZOOM_RANGE,
  COLORABLE_ELEMENTS,
  BUTTON_STYLES,
  BODY_FONT_OPTIONS,
  DEFAULT_SHORTCUTS,
  SHORTCUT_ACTIONS,
  comboFromEvent,
} from '../constants/index.js';
import { surfaceTextureStyle, setThemeOnDocumentLive } from '../utils/theme.js';
import { APP } from '../constants/index.js';
// 1.5.8 — TOS_VERSION rides the About LEGAL keys' tooltips (the reader
// window's own posture); the live battery caught the missing import.
import { TOS_VERSION } from '../constants/legal.js';
// 1.0.2 — the About mark is About_Logo.png now (the pre-hover face of the
// morph), wearing a green BLOOM on its edges (see .about-morph in css).
import aboutLogo from '../assets/about_logo.png';
import companyLogo from '../assets/company_logo.png';
// 0.32.0 — the ABOUT page's brand marks (the link buttons' icons).
import brandHuggingface from '../assets/brand_huggingface.png';
import brandGithub from '../assets/brand_github.png';
import brandDiscord from '../assets/brand_discord.png';
import brandGenesis from '../assets/brand_genesis.png';
import brandKofi from '../assets/brand_kofi.png';
import brandPaypal from '../assets/brand_paypal.png';
// 1.5.5 — THE CREDITS' OWN MARK: Duskfallcrew's emblem (the blue mandala
// blossom), worn round in the About tab's BETA TESTERS row.
import duskAvatar from '../assets/dusk_avatar.jpg';
// 1.5.5 — THE LEGAL READER (About → LEGAL: re-read the terms / privacy
// notice any time; the GATE posture lives in App.jsx).
import LegalModal from './LegalModal.jsx';
import { ShieldCheck } from 'lucide-react';

// 0.19.0 — SETTINGS 2.5. What changed from 0.17.0:
//   · LIVING BACKGROUND GONE — the cloud-drift mode picker, its sky and
//     puff color pickers and every animated-background code path are
//     removed with the feature itself (request: "remove cloud theme and
//     animated backgrounds in general").
//   · the HELP TEXT switch moved from the left rail into the FOOTER — it
//     sits on the LEFT side of the window, exactly opposite CANCEL / DONE,
//     so it is impossible to miss (the rail version was easy to overlook
//     at the bottom of the nav).
// Still fully LIVE — every change lands instantly, CANCEL rolls back.

const TABS = [
  { id: 'Appearance', icon: Palette, label: 'Look' },
  // 1.7.7 — THE LOOK TAB IS DIVIDED ("the look tab in settings is too
  //   full and long, the sector of 'look' could have some options move to
  //   new sectors instead, at most look should have theme, background
  //   textures and manual colors for example, rest should have their own
  //   sectors so its not full/cluttered in look sector"): the Look keeps
  //   its three cloths — THEMES, BACKGROUND TEXTURE, MANUAL COLORS — and
  //   the rest earns its own rail keys: SHAPE (the typeface, the shape
  //   dials, the tooltips) and CARDS (the tag family, the grid zooms, the
  //   shine family), so each sector breathes and the rail reads like a
  //   table of contents.
  { id: 'Shape', icon: Shapes, label: 'Shape' },
  { id: 'Cards', icon: Layers, label: 'Cards' },
  // 0.33.0 — THE BEHAVIOR TAB IS DIVIDED ("divide the settings so they go
  // under more sectors on the left instead of cluttering the behavior
  // area"): its four sections become three own rail keys — WORKSPACE (the
  // panels + their widths + search), PERFORMANCE (the three motion/repaint
  // switches) and KEYS (the shortcuts editor) — so each sector breathes
  // and the rail reads like a table of contents, not a crowd.
  { id: 'Workspace', icon: PanelRight, label: 'Workspace' },
  { id: 'Performance', icon: Gauge, label: 'Performance' },
  { id: 'Keys', icon: Keyboard, label: 'Keys' },
  // 0.30.0 — the DATA & SYSTEM tab ("add more categories and more settings
  // in the settings window, so the categories dont seem empty ... one of
  // them related to the database like opening the directory of the database
  // for images/the data itself, or clearing database, or clearing cache"):
  // storage folders, maintenance, and the data & recovery cards that used
  // to crowd Behavior.
  { id: 'Data', icon: HardDrive, label: 'Data' },
  // 1.2.7 — THE LOGS TAB ("add a logs left section in settings, opening it
  // shows the logs that appear on the topbar (shows last 50 lines), allow
  // to copy or select specific areas to copy etc"): the top bar's own
  // ledger — every status verdict this session, newest at the bottom,
  // selectable text + copy keys. Read-only by design: the log IS the
  // record, not an editor.
  { id: 'Logs', icon: ScrollText, label: 'Logs' },
  { id: 'About', icon: Info, label: 'About' },
];

const stableStringify = (obj) => {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const keys = Object.keys(obj).sort();
    const parts = keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`);
    return `{${parts.join(',')}}`;
  }
  return JSON.stringify(obj);
};
const normSettings = (s) => stableStringify({ ...s, colors: s.colors || {} });

// One manual-color row. The swatch opens the in-app picker (0.24.0 — the
// native wheel is gone); the hex field keeps its own draft so you can type
// freely; a valid 6-digit hex commits, anything else reverts on blur.
// 1.1.2 — THE TWO-LANE ROW ("its still laggy when i use a colorpicker on
// the manual colors in the settings look section"): every intermediate
// color of a drag used to ride the FULL pipeline — a db write (an undo
// push), a React pass over the whole app, a theme apply — ~25 times a
// second; the governor (1.1.1) only spaced the beats. The gesture now
// PREVIEWS through the cheap lane (onColor writes the resolved tokens
// straight onto the document — microseconds, no state, no render, the
// swatch and the world stay honest) and the pointer's release is the ONE
// moment the db hears the color (onCommit → the real settings write, one
// undo step, the debounced texture lane). Typing a hex or the reset key
// are discrete acts — they preview and commit in the same beat.
function ColorRow({ el, overridden, value, onSetColors, onPreviewColor }) {
  const [draft, setDraft] = useState(value.toUpperCase());
  useEffect(() => {
    setDraft(value.toUpperCase());
  }, [value]);

  return (
    <div className="gd-opt-card !py-2 !px-2.5">
      <ColorPickerButton
        color={value}
        onColor={(hex) => onPreviewColor({ [el.key]: hex })}
        onCommit={(hex) => onSetColors({ [el.key]: hex })}
        // 1.6.3 — the picker's reset clears THIS row's override (the same
        // commit the per-row RESET key beside it speaks).
        onReset={() => onSetColors({ [el.key]: null })}
        title={`Pick a color for ${el.label}`}
        active={false}
        width={216}
      />
      <span className="flex-1 min-w-0 text-[11px] text-gd-chrome truncate">
        {el.label}
        {overridden && (
          <span className="ml-2 gd-stamp" style={{ color: 'var(--gd-accent)' }}>
            CUSTOM
          </span>
        )}
      </span>
      <input
        className="gd-input !w-24 !py-0.5 text-[10px] uppercase flex-shrink-0"
        spellCheck={false}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          const v = e.target.value.trim();
          if (/^#[0-9a-fA-F]{6}$/.test(v)) onSetColors({ [el.key]: v });
        }}
        onBlur={() => setDraft(value.toUpperCase())}
        title="Hex value"
      />
      {overridden && (
        <button
          className="gd-icon-btn flex-shrink-0"
          title={`Reset ${el.label} to theme default`}
          onClick={() => onSetColors({ [el.key]: null })}
        >
          <RotateCcw size={11} />
        </button>
      )}
    </div>
  );
}

// Option card — icon + title + description on the left, control on the right.
function OptCard({ icon: Icon, title, desc, children, help }) {
  return (
    <div className="gd-opt-card">
      <span className="gd-opt-icon">
        <Icon size={14} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="gd-opt-title">{title}</div>
        {(help || desc) && (
          <div className="gd-opt-desc">
            {desc}
            {help && <span className="ml-1 text-gd-chrome">{help}</span>}
          </div>
        )}
      </div>
      {children && <div className="flex-shrink-0 self-center">{children}</div>}
    </div>
  );
}

// 0.32.0 — THE ABOUT PAGE'S LINK WALL ("in the about section in settings,
// add buttons that lead to things related to me"). 0.33.0 — the marks ride
// BARE ("the icons of the about me buttons should not have a container and
// should be slightly bigger"): no dark chip, no frame — the brand mark
// itself at a readable size, so the row reads like a signature wall of
// logos instead of a grid of little boxes. 0.48.0 — the GITHUB key went
// live with the rest of the wall: the SOON chip retired with the release
// approaching ("make the github button clickable instead of soon, since we
// are making the last couple of versions"). DISCORD is not a link: the key
// shows the username and
// pressing it COPIES it ("pressing the button just copies it"), confirming
// itself with a COPIED beat exactly like the compose sheet's copy key.
// SUPPORT sits under its own label (Ko-fi + PayPal).
function AboutLinkButton({ icon, label, href, title, onClick }) {
  return (
    <button
      type="button"
      className="gd-about-link"
      title={title}
      onClick={onClick || (href ? () => window.api?.openExternal?.(href) : undefined)}
    >
      {/* 0.33.0 — the bare mark: the span stays (a flex shrink-guard), but
          it paints NOTHING — no chip, no border, no ground. */}
      <span className="gd-about-link-ico">
        <img src={icon} alt="" draggable={false} />
      </span>
      <span className="gd-about-link-label">{label}</span>
    </button>
  );
}

// 1.5.8 — THE CONFETTI BURST ("when it gets clicked just add some
// confetti"): a one-gesture celebration for the SPECIAL THANKS key — N
// small paper pieces born at the key's own seat, each flung along its own
// angle and spin, all of them riding ONE compositor-owned CSS flight
// (transform + opacity only: no timers in JS, no layout, one keyframes
// law in index.css — .gd-confetti-piece). The palette speaks the theme's
// own accents plus a festive white/gold pair, so the burst belongs to
// whatever cloth it fires on. Each piece carries its own --dx / --dy /
// --rot / --dur CSS vars inline, the keyframes read them, and the whole
// stack removes itself when the slowest piece has landed (the pieces are
// pointer-inert furniture; they can never cover a key that matters).
const CONFETTI_COLORS = [
  'var(--gd-accent)',
  'var(--gd-accent-2)',
  'color-mix(in srgb, var(--gd-accent) 55%, #ffffff)',
  'color-mix(in srgb, var(--gd-accent-2) 55%, #ffffff)',
  '#fff8dc',
];
function confettiBurst(el) {
  if (typeof document === 'undefined' || !document.body) return;
  const rect = (typeof el?.getBoundingClientRect === 'function' && el.getBoundingClientRect()) || {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  };
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const frag = document.createDocumentFragment();
  const pieces = [];
  const N = 34;
  for (let i = 0; i < N; i += 1) {
    const piece = document.createElement('i');
    piece.className = 'gd-confetti-piece';
    // golden-angle spread with a jitter, biased UPWARD (a burst, not a
    // drip): full ring, stronger reach above the horizon.
    const ang = (i / N) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
    const reach = 46 + Math.random() * 78;
    const dx = Math.cos(ang) * reach;
    const dy = Math.sin(ang) * reach - 34 - Math.random() * 30;
    piece.style.left = `${Math.round(cx)}px`;
    piece.style.top = `${Math.round(cy)}px`;
    piece.style.setProperty('--dx', `${dx.toFixed(1)}px`);
    piece.style.setProperty('--dy', `${dy.toFixed(1)}px`);
    piece.style.setProperty('--rot', `${Math.round((Math.random() - 0.5) * 720)}deg`);
    piece.style.setProperty('--dur', `${(0.9 + Math.random() * 0.7).toFixed(2)}s`);
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    frag.appendChild(piece);
    pieces.push(piece);
  }
  document.body.appendChild(frag);
  // the slowest possible piece is 1.6s; sweep at 1.8s with a hair of
  // margin. The pieces are collected BEFORE the fragment is appended (an
  // appended fragment hands its children over and empties itself — the
  // 164 battery caught the first sweep iterating an empty bag).
  setTimeout(() => {
    for (const piece of pieces) piece.remove?.();
  }, 1800);
}

function AboutLinks() {
  // The Discord username copy — a beat of COPIED ✓ on the key itself (the
  // about tab has no status line of its own).
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef(0);
  const DISCORD_USER = 'nuriderburrito';
  // 1.5.5 — THE LEGAL READER SEAT (About → LEGAL): which document the
  // read-only viewer is showing (null = closed). One seat, two documents.
  const [legalView, setLegalView] = useState(null); // 'tos' | 'privacy' | null

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const copyDiscord = async () => {
    try {
      await window.api?.clipboardWriteText?.(DISCORD_USER);
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      /* quiet — the clipboard refused; the key simply doesn't confirm */
    }
  };

  return (
    <>
      <div className="gd-about-sec">LINKS</div>
      <div className="gd-about-links">
        <AboutLinkButton
          icon={brandHuggingface}
          label="HUGGINGFACE"
          href="https://huggingface.co/NuriDerBurrito"
          title="Open the HuggingFace page (huggingface.co/NuriDerBurrito)"
        />
        {/* GITHUB — 0.47.0 — THE REPO URL WAS BAKED IN while the key kept its
            SOON posture ("we will fill it when we finalize and upload the app
            to github, so not now at all"). 0.48.0 — THE KEY IS LIVE ("make
            the github button clickable instead of soon, since we are making
            the last couple of versions"): the repository
            github.com/NuriDerBurrito/Burrito_GenDex is the release target,
            same owner, same Burrito_ naming as GenStack — the button opens
            it like every other link on the wall. */}
        <AboutLinkButton
          icon={brandGithub}
          label="GITHUB"
          href="https://github.com/NuriDerBurrito/Burrito_GenDex"
          title="Open the GitHub repository (github.com/NuriDerBurrito/Burrito_GenDex)"
        />
        <AboutLinkButton
          icon={brandGenesis}
          label="GENESIS ITERATIONS"
          href="https://nuriderburrito.github.io/Genesis-Website/index.html"
          title="Open the Genesis Iterations website"
        />
        {/* DISCORD — not a link: the username IS the label, pressing copies. */}
        <button
          type="button"
          className={clsx('gd-about-link', copied && 'is-copied')}
          title={`Copy the Discord username (${DISCORD_USER})`}
          onClick={copyDiscord}
        >
          <span className="gd-about-link-ico">
            <img src={brandDiscord} alt="" draggable={false} />
          </span>
          <span className="gd-about-link-label">{copied ? 'COPIED ✓' : DISCORD_USER}</span>
          {copied ? <Check size={11} strokeWidth={3} /> : <Copy size={11} />}
        </button>
      </div>

      <div className="gd-about-sec">SUPPORT</div>
      <div className="gd-about-links">
        <AboutLinkButton
          icon={brandKofi}
          label="KO-FI"
          href="https://ko-fi.com/genesisiterations"
          title="Support Genesis Iterations on Ko-fi (ko-fi.com/genesisiterations)"
        />
        {/* 0.37.0 — THE REAL PAYPAL LINK ("fix the paypal tooltips again, and
            thats the correct link: paypal.com/paypalme/genesisiterations"):
            the key used to detour through Ko-fi. It now opens the PayPalMe
            page directly — the tooltip says exactly where it goes. */}
        <AboutLinkButton
          icon={brandPaypal}
          label="PAYPAL"
          href="https://www.paypal.com/paypalme/genesisiterations"
          title="Support via PayPal (paypal.me/genesisiterations)"
        />
      </div>

      {/* 1.5.5 — THE LEGAL SECTION: the Terms of Service and the Data
          Privacy Notice are one click away forever — the gate asks once
          per terms version, but the documents are always readable here.
          The keys open the read-only reader (LegalModal variant="view"),
          which stacks above this settings window (portals mount later).
          1.5.8 — THE LEGAL SECTION NOW SITS ABOVE THE THANKS ("duskfallcrew
          button in abouts section should be below the tos and such"): the
          roll of honor closes the wall now — the studio's own promises
          first, the people who shaped them last. */}
      <div className="gd-about-sec">LEGAL</div>
      <div className="gd-about-links">
        <button
          type="button"
          className="gd-about-link"
          title={`Read the Terms of Service (v${TOS_VERSION})`}
          onClick={() => setLegalView('tos')}
        >
          <span className="gd-about-link-ico">
            <ScrollText size={17} />
          </span>
          <span className="gd-about-link-label">TERMS OF SERVICE</span>
        </button>
        <button
          type="button"
          className="gd-about-link"
          title={`Read the Data Privacy Notice (v${TOS_VERSION})`}
          onClick={() => setLegalView('privacy')}
        >
          <span className="gd-about-link-ico">
            <ShieldCheck size={17} />
          </span>
          <span className="gd-about-link-label">DATA PRIVACY</span>
        </button>
      </div>

      {/* 1.5.5 — THE CREDITS SECTION ("in the about section, add below the
          rest credits section, and add 'Duskfallcrew' as a beta tester"):
          the wall's own roll of honor. 1.5.8 — the row grew into a key
          (SPECIAL THANKS, below LEGAL, redirecting to the Ktiseos Nyx
          GitHub home with a confetti burst at its seat). 1.5.9 — THE KEY
          AND THE BADGE PART WAYS ("the beta tester label should be on the
          space on the right like a badge not on the button itself,
          clicking on the badge just creates confetti"): the DUSKFALLCREW
          key is a pure REDIRECT now (avatar + centered name — the label
          leaned down a hair next to the chip that used to share its row),
          and the BETA TESTER badge sits in the row's own right space as
          its own little key whose whole job is the celebration: pressing
          it fires the confetti burst at its seat and nothing else. The
          row spans the wall's full width (both grid columns), so the key
          keeps its breathing room beside the badge. */}
      <div className="gd-about-sec">SPECIAL THANKS</div>
      <div className="gd-about-credit-row">
        <button
          type="button"
          className="gd-about-link gd-about-credit"
          title="Duskfallcrew — opens github.com/Ktiseos-Nyx"
          onClick={() => window.api?.openExternal?.('https://github.com/Ktiseos-Nyx/')}
        >
          <span className="gd-about-credit-ava">
            <img src={duskAvatar} alt="" draggable={false} />
          </span>
          <span className="gd-about-link-label">DUSKFALLCREW</span>
        </button>
        {/* 1.8.9 — THE BADGE WEARS THE WALL'S OWN CLOTH ("the 'beta tester'
            label next to duskfallcrew button in settings about section style
            is different from the others, fix that so its stylized too like
            them"): the badge keeps its own job — the dot, the celebration,
            the right-hand seat — but its FRAME is the link family's own now
            (gd-about-link rides the class list and carries the border, the
            panel fill, the text color, the radius, the shadow and the whole
            hover lift; see the CSS note at .gd-about-credit-badge).
            1.9.0 — BUT THE CLOTH TAKES THE ACCENT'S OWN COLOR ("beta
            tester container should be colored not clear like the rest like
            before, taking in teh accent theme color"): the family's clear
            panel cloth made the badge read as one more key on the wall —
            the badge keeps the family's frame (geometry, radius, shadow,
            lift — still "stylized like them") but its colors are the
            accent's own again, tinted at its seat (see the 1.9.0 half of
            the CSS note at .gd-about-credit-badge). */}
        <button
          type="button"
          className="gd-about-link gd-about-credit-badge"
          title="Beta tester — press for a little celebration"
          onClick={(e) => confettiBurst(e.currentTarget)}
        >
          <span className="gd-about-credit-badge-dot" aria-hidden />
          BETA TESTER
        </button>
      </div>

      {/* The reader itself — a plain window over the settings window. */}
      <AnimatePresence>
        {legalView && (
          <LegalModal key="about-legal" variant="view" doc={legalView} onClose={() => setLegalView(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

// Segmented control — joined buttons, one active.
function Seg({ options, value, onPick, wrap = false }) {
  return (
    <div className={clsx('gd-seg', wrap && 'flex-wrap max-w-[220px]')}>
      {options.map((o) => (
        <button
          key={o.id}
          className={clsx('gd-seg-btn', value === o.id && 'is-active')}
          title={o.title || o.label}
          onClick={() => onPick(o.id)}
        >
          {o.label.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// 0.31.0 — THE REASSIGNABLE SHORTCUTS EDITOR ("allow me to reassign
// shortcuts (must be two combinations like ctrl s or alt f etc)").
// Every app-level action key is a TWO-KEY COMBO: one modifier (Ctrl/Cmd or
// Alt) plus exactly one real key, Shift allowed as a rider. Clicking a
// combo key ARMS the row — it listens for the next valid press; an
// INVALID press is forgotten on the spot (the row keeps listening until a
// valid combo lands), and Escape, the row's own CANCEL key or clicking
// outside DISCARDS the reassignment. A combo already owned by another
// action is refused with a red flash and a note naming the owner. RESET
// asks before it wipes. The map commits LIVE through
// onChange('shortcuts', …), same as every other setting.
// 1.7.7 — THE SECTOR EARNS ITS MANNERS ("rework the keys sector, the
//   container isnt fammilar and isnt easy to use (aka the reassign keys
//   container, rework how it looks/functions, explanatory text should be
//   behind the help text option, reset should have a confirmation, theme's
//   related color glow when confirming a new keybind, red when
//   discarding/canceling/resetting the keybinds, when clicking on one it
//   should also have a button to cancel to press on instead of just
//   relying on any input to cancel, (as long as its not a valid combo then
//   it should forget it until it finds a valid combo, otherwise when
//   pressing cancel it will discard)"): the explanatory copy and the
//   per-row hints ride the HELP TEXT switch like every other OptCard; the
//   armed row carries its own CANCEL key; RESET confirms before it wipes;
//   and every verdict GLOWS — the theme's accent when a combo commits, red
//   when one is discarded or the whole map resets.
// 1.7.9 — THE ROWS EARN THEIR MARKS ("add dividors between each of the
//   keys and an icon associated"): every action carries the GLYPH of the
//   thing it does (the save disk, the undo/redo arcs, the new-card plus,
//   the settings sliders, the two panels, the tooltip speech-bubble) in
//   its own framed seat, and a hairline DIVIDER holds the line between
//   rows — the roster reads as a keyed manifest, the eye walking it by
//   its marks. See .gd-scut-ico / the divider law in index.css.
const SCUT_ICONS = {
  save: Save,
  undo: Undo2,
  redo: Redo2,
  newCharacter: UserPlus,
  settings: SlidersHorizontal,
  panel: PanelRight,
  outputBar: PanelTop,
  tooltips: Speech,
  // 1.8.2 — HELP TEXT JOINS THE MAP: the roster's row carries the same
  // CircleHelp glyph the toolbar key wears — one mark per action, the
  // family's own seat (see DEFAULT_SHORTCUTS for the Alt+H law).
  helpText: CircleHelp,
};

function ShortcutsCard({ shortcuts, onChange, showHelp = false }) {
  const [listeningId, setListeningId] = useState(null);
  const [conflict, setConflict] = useState(null); // { id, combo, ownerId }
  const [confirmReset, setConfirmReset] = useState(false);
  const [flash, setFlash] = useState(null); // { id, kind: 'confirmed' | 'discarded' }
  const [resetFlash, setResetFlash] = useState(false);
  const cardRef = useRef(null);
  const flashTimer = useRef(null);
  const resetTimer = useRef(null);

  // The verdict glow: one beat, then silence.
  const glow = (id, kind) => {
    setFlash({ id, kind });
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 620);
  };
  // Discard the armed row — the red beat the report asked for.
  const disarm = (id) => {
    setListeningId(null);
    if (id) glow(id, 'discarded');
  };
  useEffect(() => () => {
    clearTimeout(flashTimer.current);
    clearTimeout(resetTimer.current);
  }, []);

  // While armed, the next valid two-key press rebinds (or is refused).
  // 1.7.7 — an invalid press is FORGOTTEN (never stored, never committed):
  // the row keeps listening until a valid combo lands or a discard ends it.
  useEffect(() => {
    if (!listeningId) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        disarm(listeningId);
        return;
      }
      const combo = comboFromEvent(e);
      if (!combo) return; // not a valid two-key combo — keep listening
      e.preventDefault();
      const owner = SHORTCUT_ACTIONS.find((a) => a.id !== listeningId && shortcuts[a.id] === combo);
      if (owner) {
        setConflict({ id: listeningId, combo, ownerId: owner.id });
        setTimeout(() => setConflict((c) => (c && c.combo === combo && c.id === listeningId ? null : c)), 1600);
        return;
      }
      onChange({ ...shortcuts, [listeningId]: combo });
      glow(listeningId, 'confirmed'); // the theme's own color answers the commit
      setListeningId(null);
    };
    // Clicking anywhere outside the card disarms the row quietly (the
    // pointer's own verdict — a click away is not a discard the eye needs
    // narrated in red).
    const onPointerDown = (e) => {
      if (cardRef.current && e.target instanceof Node && !cardRef.current.contains(e.target)) setListeningId(null);
    };
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [listeningId, shortcuts, onChange]);

  // 1.7.7 — RESET CONFIRMS FIRST ("reset should have a confirmation"):
  // the first press arms the red question; only CONFIRM RESET wipes the
  // map (every key wearing the red beat as it lands on its default).
  const doReset = () => {
    setListeningId(null);
    setConfirmReset(false);
    onChange({ ...DEFAULT_SHORTCUTS });
    setResetFlash(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setResetFlash(false), 620);
  };

  return (
    <div className="gd-opt-card !py-3" ref={cardRef}>
      {/* 1.8.0 — THE SECTOR SHEDS ITS BADGE ("make the areas for each of
          the keys bigger since they are too small in the window, also
          remove the keyboard icon on the left side"): the card-header's
          KEYBOARD badge (the 30px gd-opt-icon square) rides off — the
          sector's title alone opens the window, every saved pixel of
          width feeding the rows below (the left rail's own tab mark
          keeps its seat — it is navigation, not content). */}
      <div className="flex-1 min-w-0">
        {/* 1.8.1 — THE TITLE SPEAKS ONCE ("remove the two 'reassign keys'
            inside the keybinds area (one is a title separator the other
            is a container one, remove whichever one so the other one
            fits with the rest)"): the sector's gd-set-section header
            above and the card's own gd-opt-title said the SAME two words
            back to back — the only seat in the app where a section
            header repeats its card's title verbatim. The card-internal
            title rides off; the SECTION header keeps the word (every
            sector opens with one — the family the tab already speaks),
            and the card now opens directly with its teaching copy the
            way every other sector's cards read under their headers. */}
        {/* 1.7.7 — the explanatory copy rides the HELP TEXT switch (the
            footer's own law — every other OptCard speaks it this way). */}
        {showHelp && (
          <div className="gd-opt-desc">
            Click a key, then press a two-key combo (Ctrl or Alt + a key). CANCEL or Esc discards the reassignment; an
            invalid press is forgotten until a valid combo lands.
          </div>
        )}
        {/* 1.7.8 — THE SECTOR SPEAKS ONE COLUMN ("keys sector is better
            ish, but its sorted in two columns, fix that so its a single
            column and each row gets its rights and accounted for when
            the buttons clip over help text or such, rework it to fit
            better in ui/ux design"): the roster rode a 2-column grid
            capped at 430px — ~207px a cell, where the never-shrinking
            key cluster (CANCEL + the combo key ≈ 130px) squeezed the
            label column under 75px and the centered buttons rode ACROSS
            the hint's line. One column at the content's full width now
            (see .gd-scut-grid / .gd-scut-row / .gd-scut-keys in
            index.css): every row owns its height, the label + hint
            column breathes, and the key cluster reserves its own width
            so the armed row's CANCEL mount never reflows the text. */}
        <div className={clsx('gd-scut-grid', resetFlash && 'is-reset-flash')}>
          {SHORTCUT_ACTIONS.map((act) => {
            const isListen = listeningId === act.id;
            const isConflict = conflict?.id === act.id;
            const isConfirm = flash?.id === act.id && flash.kind === 'confirmed';
            const isDiscard = flash?.id === act.id && flash.kind === 'discarded';
            /* 1.7.9 — the action's own GLYPH rides a framed seat at the
                row's head (SCUT_ICONS above) — the key pill's own family,
                one mark per action, the dividers holding the lines. */
            const RowIcon = SCUT_ICONS[act.id] || null;
            return (
              <span key={act.id} className="gd-scut-row flex items-center justify-between gap-3 text-[11px] text-gd-chrome min-w-0">
                {RowIcon && (
                  <span className="gd-scut-ico" aria-hidden>
                    <RowIcon size={15} />
                  </span>
                )}
                <span className="gd-scut-label min-w-0 flex flex-col" title={act.hint}>
                  <span className="truncate">{act.label}</span>
                  {/* 1.7.7 — the per-row hint joins the HELP TEXT law (it
                      lived only in the tooltip before). 1.7.8 — the hint
                      rides the label's own full-width column now: no more
                      squeezing under the buttons. */}
                  {showHelp && <span className="gd-scut-hint truncate">{act.hint}</span>}
                </span>
                <span className="gd-scut-keys">
                  {/* 1.7.7 — THE ARMED ROW'S OWN CANCEL KEY ("when clicking
                      on one it should also have a button to cancel to press
                      on instead of just relying on any input to cancel"). */}
                  {isListen && (
                    <button
                      type="button"
                      className="gd-scut-cancel"
                      title="Discard this reassignment"
                      onClick={() => disarm(act.id)}
                    >
                      <X size={11} />
                      CANCEL
                    </button>
                  )}
                  <button
                    type="button"
                    className={clsx(
                      'gd-scut-key',
                      isListen && 'is-listening',
                      isConflict && 'is-conflict',
                      isConfirm && 'is-confirmed',
                      isDiscard && 'is-discarded'
                    )}
                    title={isListen ? 'Press a two-key combo (CANCEL or Esc discards)' : `Reassign ${act.label}`}
                    onClick={() => (isListen ? disarm(act.id) : setListeningId(act.id))}
                  >
                    {isListen ? 'PRESS KEYS…' : shortcuts?.[act.id] || DEFAULT_SHORTCUTS[act.id]}
                  </button>
                </span>
              </span>
            );
          })}
        </div>
        {conflict && (
          <div className="gd-scut-note mt-1.5">
            {conflict.combo} already belongs to {SHORTCUT_ACTIONS.find((a) => a.id === conflict.ownerId)?.label}. Pick another combo.
          </div>
        )}
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          {confirmReset ? (
            <>
              <span className="gd-scut-note !text-[10px] !text-gd-chrome">Reset every key to the shipped defaults?</span>
              <button
                type="button"
                className="gd-btn gd-btn-danger !py-1 !px-2.5 !text-[10px]"
                title="Discard every custom combo and restore the shipped defaults"
                onClick={doReset}
              >
                <RotateCcw size={11} />
                CONFIRM RESET
              </button>
              <button
                type="button"
                className="gd-btn !py-1 !px-2.5 !text-[10px]"
                title="Keep the current combos"
                onClick={() => setConfirmReset(false)}
              >
                KEEP
              </button>
            </>
          ) : (
            <button
              type="button"
              className="gd-btn !py-1 !px-2.5 !text-[10px]"
              title="Restore the shipped default combos (asks first)"
              onClick={() => {
                setListeningId(null);
                setConfirmReset(true);
              }}
            >
              <RotateCcw size={11} />
              RESET
            </button>
          )}
          {/* 1.7.7 — the fixed-keys note rides the HELP TEXT switch too. */}
          {showHelp && (
            <span className="gd-scut-note">Fixed: ← → walk images · Esc closes windows · right-click opens the region menus</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Theme card mockup — a tiny card + chip on the theme's own workspace color,
// so the preview carries the theme's palette AND its corner language.
// Themes that ship their own background look carry a LOOKS chip.
// 0.38.0 — NO TOOLTIPS ON THE THEMES ("remove tooltips for the themes"):
// the card's mockup, its name row and its LOOK chip speak for themselves —
// no hover pill pops over the picker anymore.
function ThemeCard({ theme, active, onPick }) {
  const shipsLook = !!theme.texDefaults;
  return (
    <button
      className={clsx('gd-theme-card', active && 'is-active')}
      onClick={() => onPick(theme.id)}
    >
      <div className="gd-theme-mock" style={{ ['--theme-bg']: theme.bg, background: theme.bg }}>
        <span className="gd-theme-mock-card" style={{ borderColor: theme.ink, background: theme.panel }}>
          <span className="gd-theme-mock-img" style={{ background: theme.panel }} />
          <span
            className="gd-theme-mock-foot"
            style={{ background: theme.panel, color: theme.panelText, borderTop: `1px solid ${theme.line}` }}
          >
            NAME
          </span>
        </span>
        <span
          className="gd-theme-mock-chip"
          style={{ background: theme.accent, color: theme.accentInk, borderColor: theme.ink }}
        >
          V1
        </span>
        <span
          className="gd-theme-mock-chip"
          style={{ background: theme.panel, color: theme.panelText, borderColor: theme.ink, marginTop: 3 }}
        >
          TAG
        </span>
      </div>
      <div className="gd-theme-name-row">
        <span className="gd-theme-name font-display">{theme.name}</span>
        {shipsLook && <span className="gd-theme-look-chip">LOOK</span>}
      </div>
      {/* 0.42.0 — NO DESCRIPTION LINE ("remove descriptions from themes"):
          the mockup + the name + the LOOK chip say everything a picker
          needs; the little caption is gone. */}
    </button>
  );
}

// One texture option — a TILE now (1.5.4, "rework the buttons for the
// background textures in settings so they display better rather than very
// small text"): the REAL pattern fills a tall face (the same CSS the
// surface will wear, in the live theme colors) and the option's whole name
// rides UNDER it as a caption — the 7px overlay chip the old 76x32 swatch
// pasted over a sliver of pattern is retired.
function TexSwatch({ tex, active, onPick, style, title }) {
  return (
    <button
      className={clsx('gd-tex-tile', active && 'is-active')}
      title={title}
      onClick={() => onPick(tex.id)}
    >
      <span className="gd-tex-tile-face" style={style} aria-hidden />
      <span className="gd-tex-tile-name">{tex.label}</span>
    </button>
  );
}

// 0.26.0 — the lucide glyph for each texture surface (TEX_SURFACES carries
// the name; see the constants' own note). The icons make the surface buttons
// read as the app's own AREAS — a toolbar bar, the class tree, the card
// grid, the docked panel — instead of anonymous texture squares you had to
// decode by label.
const SURFACE_ICONS = { PanelTop, FolderTree, LayoutGrid, PanelRight };

// Settings — LIVE: every change applies the instant you make it (theme, zoom,
// colors — you watch them land). CANCEL rolls everything back to how it was
// when the window opened; DONE just closes.
// 0.30.0 — the fourth tab (Data) carries the storage / maintenance / data &
// recovery cards; Behavior gains a PERFORMANCE section and a SHORTCUTS
// list; Look gains TOOLBAR FINISH (the old Metallic gradient as a setting).
function SettingsModalInner({
  settings,
  initial,
  onClose,
  onChange,
  onRevert,
  onOpenFolder = null,
  onClearCache = null,
  onResetDatabase = null,
  /* 1.3.2 — the preview GENERATE and ERASE props are retired with the
     whole preview system (the thumbnail builds automatically at import).
     The LIBRARY portability pair stays (Data → LIBRARY: export one zip /
     import one back). All App-owned: the keys only speak, App does the
     work. */
  onExportLibrary = null,
  onImportLibrary = null,
  /* 1.1.3 — THE UPDATE CHANNEL (Data → UPDATES): App owns the ask; the
     section speaks the verdict from updateState and offers the CHECK +
     VIEW RELEASE keys. updateState: { status: 'idle' | 'checking' |
     'none' | 'latest' | 'available' | 'error', latest?, current?, url?,
     publishedAt?, message? }. */
  updateState = { status: 'idle' },
  onCheckUpdates = null,
  /* 1.1.3 — FACTORY RESET (Data → FACTORY RESET): App owns the whole road
     — the DOUBLE confirmation included; the key here only starts it. */
  onFactoryReset = null,
  /* 1.2.7 — THE LEDGER (the Logs tab): the top bar's status lines as
     { ts, msg, kind } entries, newest last, capped at 50 by the App. */
  logs = [],
  initialTab = 'Appearance',
}) {
  const [tab, setTab] = useState(initialTab);
  const [tabDir, setTabDir] = useState(1);
  const [texSurface, setTexSurface] = useState('viewer');
  // 1.9.11 — THE LEDGER'S OWN DIAL (the Logs tab — see the seat below the
  // logs container): the numeric cell's DRAFT. The committed cap lives in
  // settings.logLimit (App trims the ledger the frame it lands — see the
  // trim effect there); the draft exists so the field can be typed into
  // (empty, leading zeros, half-finished numbers) without the controlled
  // value snapping the caret out from under the owner's hand, and the
  // field follows the committed value back whenever the setting moves
  // from outside (CANCEL's revert, the factory reset).
  // 1.9.12 — THE DIAL SPEAKS ONLY WHEN DONE ANSWERS ("when changing how
  // many lines the log should contain it activates instantly, it
  // shouldnt do that it should only update after i press on okay, since
  // currently if i type 60, it applies 6 first and deletes the rest"):
  // the 1.9.11 law committed every keystroke that parsed — typing "60"
  // landed "6" the instant it parsed, and App's trim effect cut the
  // ledger to 6 ON THE SPOT; the "0" that followed could only ever
  // re-raise the ceiling, never recover the lines the "6" had already
  // deleted. The draft is a pure draft now: NO keystroke writes the
  // setting, nothing trims, nothing is lost mid-type — the ONE commit
  // happens on the DONE key (the window's "okay"), clamped whole, and a
  // draft that is empty or junk when DONE answers commits nothing (the
  // blur normalizes the field back to the committed cap instead). ESC
  // and CANCEL never see the draft at all — it dies with the window,
  // exactly like every other un-committed change.
  const liveLogCap = clampLogLimit(settings.logLimit ?? LOG_LIMIT_RANGE.default);
  const [logLimitDraft, setLogLimitDraft] = useState(String(liveLogCap));
  useEffect(() => {
    setLogLimitDraft(String(liveLogCap));
  }, [liveLogCap]);
  // the keystroke road: the draft alone moves (no set, no trim, no loss)
  const typeLogLimit = (raw) => {
    setLogLimitDraft(raw);
  };
  // the parse the DONE road shares with the dirty flag: a draft that
  // parses to a cap different from the committed one is a PENDING change
  const parseLogLimitDraft = () => {
    const trimmed = String(logLimitDraft ?? '').trim();
    if (!trimmed) return null; // an emptied field commits nothing
    const n = Math.round(Number.parseInt(trimmed, 10));
    if (!Number.isFinite(n)) return null; // junk commits nothing
    return clampLogLimit(n);
  };
  const logLimitPending = () => parseLogLimitDraft() != null && parseLogLimitDraft() !== liveLogCap;
  // the ONE commit — DONE's own road (and nothing else's)
  const finishLogLimit = () => {
    const clamped = parseLogLimitDraft();
    if (clamped != null && clamped !== liveLogCap) set('logLimit', clamped);
  };
  // blur: normalize the half-typed shape — a parsing draft collapses to
  // its canonical number ("060" -> "60"), an empty or junk field restores
  // the committed cap — but NEVER writes anything (normalizing is not
  // committing; the draft still needs DONE to land)
  const normalizeLogLimit = () => {
    const clamped = parseLogLimitDraft();
    setLogLimitDraft(clamped != null ? String(clamped) : String(liveLogCap));
  };
  // 0.26.0 — the natural-height node Modal measures (the content column keeps
  // its own scroll; the shell around it is height-pinned, so IT can't be the
  // measurement — see Modal's measureRef note).
  const tabFlowRef = useRef(null);

  // 1.0.9 — THE ABOUT MARK'S RANDOM RAINBOW ("when hovering over the icon
  // in the about section, it should shift the glow color between colors
  // randomly, like all the rainbow colors including white"): while the
  // pointer rests on the morph, a fresh hue is rolled onto the mark every
  // 1.6s — a full random walk around the color wheel (never repeating the
  // neighborhood it just left), and roughly one pick in five is a WHITE
  // PASS (the w flag lights the pure-white layer while the hue layer
  // steps back). The CSS glides between picks on the registered
  // --gd-rainbow-h transition (index.css — the rainbow rider), so the
  // glow SLIDES from color to color instead of snapping. Leaving the mark
  // stops the walk; the halo's own fade takes the light away. Reduced
  // motion keeps the feature honest but still: ONE static pick per hover,
  // no ongoing drift.
  const aboutMorphRef = useRef(null);
  const rainbowTimerRef = useRef(0);
  const lastRainbowHueRef = useRef(null);
  const stopRainbow = useCallback(() => {
    if (rainbowTimerRef.current) {
      clearInterval(rainbowTimerRef.current);
      rainbowTimerRef.current = 0;
    }
  }, []);
  const startRainbow = useCallback(() => {
    stopRainbow();
    const el = aboutMorphRef.current;
    if (!el || typeof el.style.setProperty !== 'function') return;
    const reduced =
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('gd-reduced-motion');
    const pick = () => {
      // 1.7.6 — THE RAINBOW RESTS IN THE DARK (App's "the dark works
      // nothing" law): the drift's interval keeps firing while the window
      // is hidden, mutating custom properties that trigger style recalc
      // nobody can see. A hidden tick does nothing; the drift resumes on
      // the next beat after the window shows.
      if (typeof document !== 'undefined' && document.hidden) return;
      let h = Math.floor(Math.random() * 360);
      if (lastRainbowHueRef.current != null) {
        const d = Math.abs(h - lastRainbowHueRef.current);
        if (Math.min(d, 360 - d) < 40) h = (h + 90 + Math.floor(Math.random() * 180)) % 360;
      }
      lastRainbowHueRef.current = h;
      const whitePass = Math.random() < 0.2;
      el.style.setProperty('--gd-rainbow-h', String(h));
      el.style.setProperty('--gd-rainbow-w', whitePass ? '1' : '0');
    };
    pick();
    if (reduced) return; // one static random color per hover — no drift
    rainbowTimerRef.current = setInterval(pick, 1600);
  }, [stopRainbow]);
  // The modal can unmount mid-hover (DONE / ESC while resting on the mark):
  // the walk must not outlive its element.
  useEffect(() => () => stopRainbow(), [stopRainbow]);

  const activeTheme = THEME_PRESETS.find((t) => t.id === settings.theme) || THEME_PRESETS[0];
  const overrides = settings.colors || {};
  const showHelp = settings.showHelpText === true;
  const textures = settings.textures || {};

  const dirty =
    useMemo(() => normSettings(settings) !== normSettings(initial), [settings, initial]) ||
    // 1.9.12 — the ledger's PENDING draft speaks too (see the dial's note
    // above): the draft is not in settings yet, but a typed cap waiting
    // for DONE is exactly the "unsaved change" the DONE key's own 1.2.9
    // law speaks of — the solid accent asks for the save, and CANCEL's
    // tooltip promises the roll-back (the draft dies un-landed, which IS
    // its rollback).
    logLimitPending();
  // the LANDED dirtiness alone — the revert road's own truth (a pending
  // draft has nothing in settings to revert; it simply dies with the
  // window, and the 'Settings reverted' toast must never speak for a
  // change that never landed).
  const landedDirty = useMemo(() => normSettings(settings) !== normSettings(initial), [settings, initial]);

  const set = (key, value) => onChange(key, value);

  // 1.2.7 — THE LOGS TAB'S HELPERS (see the Logs panel): one text builder
  // (the ledger as plain lines, newest last), one time formatter, and one
  // copy road that speaks the app's own clipboard bridge first (the
  // packaged app's trusted lane) and the web clipboard as the fallback —
  // with a small COPIED note that breathes out on its own.
  const [copiedNote, setCopiedNote] = useState('');
  const copiedTimerRef = useRef(0);
  useEffect(() => () => clearTimeout(copiedTimerRef.current), []);
  const fmtLogTime = (ts) => {
    const d = new Date(Number(ts) || 0);
    if (Number.isNaN(d.getTime())) return '--:--:--';
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };
  const logText = () =>
    (logs || [])
      .map((e) => `[${fmtLogTime(e?.ts)}] ${String(e?.msg || '')}`)
      .join('\n');
  const copyLogText = async (text, what) => {
    const payload = String(text || '');
    if (!payload) return;
    let ok = false;
    try {
      if (typeof window !== 'undefined' && window.api?.clipboardWriteText) {
        await window.api.clipboardWriteText(payload);
        ok = true;
      } else if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (ok) {
      setCopiedNote(`COPIED ${what === 'selected' ? 'SELECTION' : 'LEDGER'} ✓`);
      clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopiedNote(''), 1400);
    }
  };
  // 1.1.2 — THE PREVIEW LANE (see ColorRow's note): the drag's intermediate
  // colors never touch the db — they resolve against the ACTIVE theme and
  // land straight on the document (cheap tokens this frame, the debounced
  // texture/snapshot lane when the pointer rests). The commit (onSetColors)
  // is what writes the settings; the App's own theme effect then re-applies
  // the identical values through the same live form — a no-op repaint.
  const previewColors = (patch) => {
    const colors = { ...settings.colors };
    for (const [k, v] of Object.entries(patch || {})) {
      if (v === null) delete colors[k];
      else colors[k] = v;
    }
    setThemeOnDocumentLive(
      settings.theme,
      colors,
      settings.textures || null,
      settings.buttonStyle || 'theme',
      settings.uiFont || 'mono'
    );
  };
  const setColors = (patch) => {
    if (patch === null) {
      onChange('colors', {});
      return;
    }
    const colors = { ...settings.colors };
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) delete colors[k];
      else colors[k] = v;
    }
    onChange('colors', colors);
  };

  // Picking a theme: land its colors, and if it ships its own background
  // look (Mumei's polka paper, Bastel's charm shuffle, Paper's graph,
  // Metallic's blueprint) land that too — ONE settings patch, one undo
  // step. 0.19.0: no living background to land anymore.
  const pickTheme = (id) => {
    const theme = THEME_PRESETS.find((t) => t.id === id);
    if (!theme) return;
    const patch = { theme: id };
    if (theme.texDefaults) patch.textures = { ...textures, ...theme.texDefaults };
    onChange(patch);
  };

  const setSurfacePattern = (pattern) => {
    onChange('textures', { ...textures, [texSurface]: pattern });
  };

  const switchTab = (t) => {
    setTabDir(TABS.findIndex((x) => x.id === t) > TABS.findIndex((x) => x.id === tab) ? 1 : -1);
    setTab(t);
  };

  const cancel = () => {
    // 1.9.12 — the ledger's draft dies here with the window (never
    // landed, nothing to revert); the revert speaks only for changes
    // that DID land live.
    if (landedDirty) onRevert(initial);
    onClose();
  };

  // 1.9.12 — DONE IS THE DIAL'S ONLY DOOR (see the ledger dial's note):
  // the one commit lands here — clamped whole, BEFORE the window closes
  // so the write rides the same synchronous settings lane every other
  // change speaks, and App's trim effect cuts the ledger to the new cap
  // the frame AFTER the window is already gone (nothing the owner is
  // looking at moves under them mid-type, and nothing ever trims twice).
  const doneClose = () => {
    finishLogLimit();
    onClose();
  };

  return (
    <Modal
      title="SETTINGS"
      onClose={onClose}
      width="w-[760px]"
      bodyClassName="!p-0 gd-settings-shell"
      measureRef={tabFlowRef}
      footer={
        /* 0.19.0 — HELP TEXT lives in the FOOTER, on the LEFT side,
            exactly opposite CANCEL / DONE: one glance, one click, from
            every tab (it was too easy to overlook at the rail's bottom). */
        <div className="flex items-center gap-3">
          <div className="gd-foot-help" title="Show the explanatory paragraphs under settings and editors everywhere">
            <span className="gd-rail-icon">
              <CircleHelp size={12} />
            </span>
            <span className={clsx('gd-rail-help-label', showHelp && 'is-on')}>HELP TEXT</span>
            <button
              className={clsx('gd-switch', showHelp && 'is-on')}
              title={showHelp ? 'Help text ON: hide the helper paragraphs' : 'Help text OFF: show the helper paragraphs'}
              onClick={() => set('showHelpText', !showHelp)}
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              className="gd-btn"
              onClick={cancel}
              title={dirty ? 'Roll back every change made in this window' : 'Close settings'}
            >
              CANCEL
            </button>
            {/* 1.2.9 — THE DONE KEY SPEAKS THE CHANGE ("the done button in
                settings when there is an unsaved change and when there is
                no unsaved change should swap, so the highlighted is when
                unsaved changes exists while the normal one exists when no
                changes to save exist"): the solid accent key is the
                LOUDEST voice the app's buttons speak — it now belongs to
                the state that ASKS for attention (unsaved changes waiting
                for the save), and a clean window lands on the quiet
                accent-outline key. The old pair was inverted: closing a
                clean window shouted, and a dirty one whispered. */}
            <button className={clsx('gd-btn', dirty ? 'gd-btn-solid' : 'gd-btn-accent')} onClick={doneClose}>
              DONE
            </button>
          </div>
        </div>
      }
    >
      <div className="gd-settings-body">
        {/* Rail — section navigation. */}
        <div className="gd-settings-rail">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button key={id} className={clsx('gd-rail-btn', tab === id && 'is-active')} onClick={() => switchTab(id)}>
              <span className="gd-rail-icon">
                <Icon size={12} />
              </span>
              {/* 0.36.0 — the label rides in its OWN min-width-0 span: a bare
                  text node can't shrink, so PERFORMANCE (the longest word in
                  the rail) painted straight past the button's right edge
                  ("the performance sector on the left side in settings window
                  still clips on the right, the text is clipping outside the
                  container"). The span can ellipsize as the last resort; the
                  rail also widened and the tracking eased so every label
                  fits WHOLE (see .gd-settings-rail / .gd-rail-label). */}
              <span className="gd-rail-label">{label.toUpperCase()}</span>
            </button>
          ))}
        </div>

        {/* 0.26.0 — THE CONTENT COLUMN scrolls ON ITS OWN: the rail on the
            left stays pinned for the whole ride ("make the left area of
            settings that contain the category not scroll with the window"),
            and only this column — the tab panels — scrolls. The ref'd
            gd-settings-tabflow node keeps the NATURAL height measurement
            alive for the card's own height tweening (it is the node Modal
            measures; the shell around it is height-pinned). */}
        <div className="gd-settings-content">
          <div className="gd-settings-tabflow" ref={tabFlowRef}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: 22 * tabDir }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -22 * tabDir }}
                /* 1.8.2 — THE SWAP LANDS IN ONE FRAME UNDER REDUCED MOTION
                   ("in reduced ui motion, the feedback of switching sections
                   in settings is very choppy, fix that"): the flight is a
                   SEQUENTIAL theater — the old panel exits (fade + slide),
                   AnimatePresence waits out the exit, then the new panel
                   enters — and under MotionConfig's reducedMotion="always"
                   the transform half lands instantly while the two 0.14s
                   fades still breathe: a hard sideways jump, a blank beat,
                   a fade-in — the reported chop. The targeted still (the
                   1.4.9 family's own pattern): under the switch, exit and
                   enter both land at duration 0 — one commit, one paint,
                   the rail key's colors keeping their own 0.12s breath. */
                transition={settings.reduceMotion ? { duration: 0 } : { duration: 0.14, ease: 'easeOut' }}
                className="space-y-4"
              >
              {tab === 'Appearance' && (
                <>
                  {/* THEMES — 12 presets, four compact cards per row. */}
                  <div className="gd-set-section">THEMES</div>
                  <div className="gd-theme-grid">
                    {THEME_PRESETS.map((theme) => (
                      <ThemeCard
                        key={theme.id}
                        theme={theme}
                        active={settings.theme === theme.id}
                        onPick={pickTheme}
                      />
                    ))}
                  </div>

                  {/* LIVING BACKGROUND — REMOVED (0.19.0, with the cloud
                      theme and every animated background). The workspace is
                      always still; the viewer toolbar + character header
                      simply wear their surface's own pattern. */}

                  {/* BACKGROUND TEXTURE — per-surface pattern picker. */}
                  <div className="gd-set-section">BACKGROUND TEXTURE</div>
                  {showHelp && (
                    <p className="text-[9px] leading-relaxed text-gd-mute -mt-2">
                      Each surface wears its own pattern: pick a surface (the icons show the app&apos;s own areas), then its
                      look. The card viewer&apos;s top header follows the Top Toolbar&apos;s pattern. Sparkles re-rolls its little
                      stars (a big random scatter) every time the app opens.
                    </p>
                  )}
                  <div className="gd-tex-surface-row">
                    {TEX_SURFACES.map((s) => {
                      const SurfaceIcon = SURFACE_ICONS[s.icon] || PanelTop;
                      return (
                        <button
                          key={s.id}
                          className={clsx('gd-tex-surface-btn', texSurface === s.id && 'is-active')}
                          onClick={() => setTexSurface(s.id)}
                          title={`Pick the pattern for the ${s.label.toLowerCase()}`}
                        >
                          {/* 0.26.0 — the AREA ICON: a lucide glyph of the
                              surface itself, so each button reads as the part
                              of the app it dresses (the old bare texture
                              dots were anonymous squares). 0.27.0 — the live
                              texture preview dot that trailed the label is
                              GONE ("i love the icons, but there is a right
                              rectangle in each container, remove it"): icon +
                              label read as the area, and the pattern swatches
                              below already carry the live look. */}
                          <span className="gd-tex-surface-ico" aria-hidden>
                            <SurfaceIcon size={13} strokeWidth={2.4} />
                          </span>
                          {s.label.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                  {/* 1.5.4 — the options ride a TILE GRID (four across, the
                      theme grid's own rhythm) instead of the wrapped row of
                      little strips. */}
                  <div className="gd-tex-tile-grid">
                    {TEXTURES.map((t) => (
                      <TexSwatch
                        key={t.id}
                        tex={t}
                        active={(textures[texSurface] || 'none') === t.id}
                        onPick={(id) => setSurfacePattern(id)}
                        style={surfaceTextureStyle(t.id, settings.theme, settings.colors, texSurface, true)}
                        title={`${t.label}: on the ${TEX_SURFACES.find((s) => s.id === texSurface)?.label.toLowerCase()}`}
                      />
                    ))}
                  </div>

                  {/* MANUAL COLORS. */}
                  <div className="gd-set-section">MANUAL COLORS</div>
                  <div className="space-y-1.5">
                    {COLORABLE_ELEMENTS.map((el) => {
                      const overridden = !!overrides[el.key];
                      const value = overrides[el.key] || activeTheme[el.key];
                      return <ColorRow key={el.key} el={el} overridden={overridden} value={value} onSetColors={setColors} onPreviewColor={previewColors} />;
                    })}
                  </div>
                  <div className="flex justify-end">
                    <button
                      className="gd-btn"
                      disabled={Object.keys(overrides).length === 0}
                      onClick={() => setColors(null)}
                      title="Clear every manual color override"
                    >
                      <X size={11} />
                      RESET ALL OVERRIDES
                    </button>
                  </div>

                  
                </>
              )}

              {tab === 'Shape' && (
                <>
                  {/* 1.7.7 — THE SHAPE SECTOR (the Look divide — see
                      TABS): the typeface, the corner/shadow/line/tilt/
                      hover dials and the tooltip switch — the app's own
                      SHAPE, not its cloth. */}
{/* 0.42.0 — THE FONT ("add the option to edit the font in
                      the settings (in the look tab)"): the app's BODY
                      typeface — the three faces the app ships, live on every
                      theme; display text keeps following the theme itself.
                      0.48.0 — THE IMPORT SEAT IS RETIRED ("remove the custom
                      font option"): the three base faces are the whole
                      ladder again; the IMPORT key, the REMOVE key and the
                      stored-file caption are gone with it, and an old
                      database still holding uiFont 'custom' sanitizes back
                      to the classic mono on load. */}
                  <div className="gd-set-section">FONT</div>
                  <OptCard
                    icon={Type}
                    title="APP FONT"
                    desc={
                      showHelp
                        ? 'The typeface everything reads in: titles and card names keep their theme’s own display face.'
                        : null
                    }
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Seg
                        wrap
                        options={BODY_FONT_OPTIONS.map((f) => ({
                          id: f.id,
                          label: f.label,
                          title:
                            f.id === 'mono'
                              ? 'IBM Plex Mono: the classic GenDex body'
                              : f.id === 'grotesk'
                                ? 'Space Grotesk: the display face, as body text'
                                : 'Spectral: the serif face, as body text',
                        }))}
                        value={settings.uiFont || 'mono'}
                        onPick={(id) => set('uiFont', id)}
                      />
                    </div>
                  </OptCard>

                  {/* SHAPE STYLE (0.15.0 — renamed from the old button-shape
                      option): the corner language for cards, the version
                      container, buttons, chips, inputs and most framed
                      surfaces. Theme-owned hand-drawn outlines (Mumei's
                      painted chip rims) still win over the geometric radii. */}
                  <div className="gd-set-section">SHAPE STYLE</div>
                  <OptCard
                    icon={MousePointerClick}
                    title="CORNER STYLE"
                    desc={
                      showHelp
                        ? (settings.buttonStyle || 'theme') === 'theme'
                          ? `Cards, the version container, buttons and chips follow the ${activeTheme.name} theme's own corner language.`
                          : settings.buttonStyle === 'round'
                            ? 'Cards, the version container, buttons, chips and fields all run rounded.'
                            : 'Cards, the version container, buttons, chips and fields all run hard square corners.'
                        : null
                    }
                  >
                    <Seg
                      options={BUTTON_STYLES.map((b) => ({
                        id: b.id,
                        label: b.label,
                        title:
                          b.id === 'theme'
                            ? 'Use the active theme\'s own corner language (rounded for Mumei & the soft family, squared for Burrito\'s sticker look)'
                            : b.id === 'round'
                              ? 'Round cards, the version container, buttons, chips and fields'
                              : 'Square cards, the version container, buttons, chips and fields',
                      }))}
                      value={settings.buttonStyle || 'theme'}
                      onPick={(id) => set('buttonStyle', id)}
                    />
                  </OptCard>

                  {/* 1.6.3 — THE CARD'S OWN DIALS ("there are some inconsistant
                      settings between themes , such as some themes having
                      dropback shadow for cards , or hovering would move either
                      up or top left corner , etc.. or even roundess such as in
                      numeix theme and any rounded theme option etc.. , im not
                      asking to remove the inconsistancies , instead i want you
                      to add settings for them"): three per-card overrides,
                      each born at 'theme' (the theme's own law — nothing
                      changes for anyone until a dial turns). CARD CORNERS
                      speaks the CARDS' half of the shape language alone — the
                      numeix roundness on any theme, the square base on the
                      soft family, buttons untouched. */}
                  <OptCard
                    icon={Square}
                    title="CARD CORNERS"
                    desc={
                      showHelp
                        ? (settings.cardCorners || 'theme') === 'theme'
                          ? `Cards and framed surfaces follow the ${activeTheme.name} theme's own corners.`
                          : settings.cardCorners === 'round'
                            ? 'Cards and framed surfaces run rounded (16px), buttons keep the shape style above.'
                            : 'Cards and framed surfaces run square, buttons keep the shape style above.'
                        : null
                    }
                  >
                    <Seg
                      options={[
                        { id: 'theme', label: 'Theme', title: `Cards follow the ${activeTheme.name} theme's own corner language` },
                        { id: 'round', label: 'Round', title: 'Round cards and framed surfaces (16px) on any theme' },
                        { id: 'square', label: 'Square', title: 'Hard square card corners on any theme' },
                      ]}
                      value={settings.cardCorners || 'theme'}
                      onPick={(id) => set('cardCorners', id)}
                    />
                  </OptCard>

                  <OptCard
                    icon={Blend}
                    title="CARD SHADOW"
                    desc={
                      showHelp
                        ? (settings.cardShadow || 'theme') === 'theme'
                          ? `Cards wear the ${activeTheme.name} theme's own resting shadow — its style, its weight.`
                          : settings.cardShadow === 'soft'
                            ? 'Every card carries a soft blurred drop shadow, resting and hovered.'
                            : settings.cardShadow === 'sharp'
                              ? 'Every card carries a hard offset sticker shadow, resting and hovered.'
                              : 'Cards sit flat on the workspace: no resting shadow, no hover bloom.'
                        : null
                    }
                  >
                    <Seg
                      options={[
                        { id: 'theme', label: 'Theme', title: `Cards follow the ${activeTheme.name} theme's own shadow law (soft blur on the paper family, hard offsets on the sticker family)` },
                        { id: 'soft', label: 'Soft', title: 'A soft blurred drop shadow on every card (the burrito / moss / glacier family)' },
                        { id: 'sharp', label: 'Sharp', title: 'A hard offset sticker shadow on every card (the zine / muffin / crimson family)' },
                        { id: 'off', label: 'Off', title: 'No resting or hover shadow on any card' },
                      ]}
                      value={settings.cardShadow || 'theme'}
                      onPick={(id) => set('cardShadow', id)}
                    />
                  </OptCard>

                  {/* 1.6.4 — THE AUDIT'S OTHER TWO AXES ("same with the muffin
                      button trim sometimes it has dashed lines , i want you to
                      check each theme to see what unique options they have and
                      implement them in options"): the cut-line family and the
                      stamp's stance — every axis the twelve themes visibly
                      disagree on now owns a dial, each born at 'theme'. */}
                  <OptCard
                    icon={Spline}
                    title="TRIM LINES"
                    desc={
                      showHelp
                        ? (settings.trimLines || 'theme') === 'theme'
                          ? `Chips, buttons and rules follow the ${activeTheme.name} theme's own line style.`
                          : settings.trimLines === 'dashed'
                            ? 'Chip and button trims, section rules and hairlines all run dashed — the muffin cut-line look.'
                            : 'Every trim, rule and hairline runs solid, whatever the theme.'
                        : null
                    }
                  >
                    <Seg
                      options={[
                        { id: 'theme', label: 'Theme', title: `Lines follow the ${activeTheme.name} theme's own law (dashed on Muffin and Carbon, solid elsewhere)` },
                        { id: 'solid', label: 'Solid', title: 'Solid trim lines on every theme' },
                        { id: 'dashed', label: 'Dashed', title: 'Dashed cut lines on every theme (the muffin craft table)' },
                      ]}
                      value={settings.trimLines || 'theme'}
                      onPick={(id) => set('trimLines', id)}
                    />
                  </OptCard>

                  <OptCard
                    icon={Stamp}
                    title="STAMP TILT"
                    desc={
                      showHelp
                        ? (settings.stampTilt || 'theme') === 'theme'
                          ? `The version stamp leans the way the ${activeTheme.name} theme leans it.`
                          : settings.stampTilt === 'flat'
                            ? 'Every stamp stands perfectly level.'
                            : 'Every stamp leans a playful -3 degrees.'
                        : null
                    }
                  >
                    <Seg
                      options={[
                        { id: 'theme', label: 'Theme', title: `The stamp follows the ${activeTheme.name} theme's own stance (tilted on Burrito / Muffin / Ember, level elsewhere)` },
                        { id: 'flat', label: 'Flat', title: 'Every stamp stands perfectly level' },
                        { id: 'tilted', label: 'Tilted', title: 'Every stamp leans -3 degrees (the muffin stance)' },
                      ]}
                      value={settings.stampTilt || 'theme'}
                      onPick={(id) => set('stampTilt', id)}
                    />
                  </OptCard>

                  <OptCard
                    icon={UnfoldVertical}
                    title="CARD HOVER"
                    desc={
                      showHelp
                        ? (settings.cardHover || 'theme') === 'theme'
                          ? `Hovering a card moves it the way the ${activeTheme.name} theme moves it.`
                          : settings.cardHover === 'up'
                            ? 'Hovered cards lift straight up.'
                            : settings.cardHover === 'corner'
                              ? 'Hovered cards lift toward the top-left corner.'
                              : 'Hovered cards stay planted (the hover shadow still speaks).'
                        : null
                    }
                  >
                    <Seg
                      options={[
                        { id: 'theme', label: 'Theme', title: `Hover movement follows the ${activeTheme.name} theme's own law` },
                        { id: 'up', label: 'Up', title: 'Hovered cards lift straight up' },
                        { id: 'corner', label: 'Corner', title: 'Hovered cards lift toward the top-left corner' },
                        { id: 'none', label: 'None', title: 'Hovered cards never move' },
                      ]}
                      value={settings.cardHover || 'theme'}
                      onPick={(id) => set('cardHover', id)}
                    />
                  </OptCard>

                  {/* 0.29.0 — TOOLTIPS, the app-wide switch ("add a new
                      option in the top bar and also in settings which will
                      disable tooltips in general"). ON = the stylized hover
                      pills paint; OFF = nothing at all — the OS-native
                      boxes stay suppressed, off means OFF. Same key as the
                      titlebar's speech-bubble switch. */}
                  <OptCard
                    icon={Speech}
                    title="TOOLTIPS"
                    desc={
                      showHelp
                        ? settings.tooltips !== false
                          ? 'Hover hints show as styled pills on every key.'
                          : 'No hover hints anywhere: the native boxes stay off too.'
                        : null
                    }
                  >
                    <button
                      className={clsx('gd-switch', settings.tooltips !== false && 'is-on')}
                      title="Toggle every tooltip in the app"
                      onClick={() => set('tooltips', settings.tooltips === false)}
                    />
                  </OptCard>

                  {/* 1.1.8 — TOP BAR GRADIENT IS RETIRED ("remove top bar
                      gradient option"): the TOOLBAR FINISH section and its
                      SATIN/STEEL/OFF switch left the Look tab with 1.1.8 —
                      the bars wear their plain surface + pattern on every
                      theme now, the setting key is gone from the database
                      (createSafeDb drops it; theme.js sweeps any attribute
                      a previous session left on the root), and the SHAPE tab
                      flows from the TOOLTIP card straight into its close
                      (1.7.7 — the Look tab keeps themes, textures and
                      manual colors alone). */}

                                  </>
              )}

              {tab === 'Cards' && (
                <>
                  {/* 1.7.7 — THE CARDS SECTOR (the Look divide — see
                      TABS): the tag family, the grid zooms, and the
                      shine family — everything the CARDS wear, not the
                      workspace. */}
{/* 0.24.0 — CARDS & TAGS MOVED HERE ("tag position and
                      default zoom should be moved to the looks settings
                      instead"): tag position, the default grid zoom, and the
                      DEFAULT TAG ZOOM ("add also the default zoom for tags
                      there too") all live on the LOOK tab now — the grid
                      toolbar's zoom / tag sliders are gone.
                      1.7.7 — THE LOOK TAB IS DIVIDED (see TABS): the whole
                      family moves to its own CARDS rail key. */}
                  <div className="gd-set-section">CARDS &amp; TAGS</div>
                  <OptCard
                    icon={Bookmark}
                    title="TAG POSITION"
                    desc={
                      showHelp
                        ? (settings.tagPosition || 'mark') === 'corner'
                          ? 'Ribbons pinned flat on the card art.'
                          : 'Ribbons hang into the card from the top edge.'
                        : null
                    }
                  >
                    <Seg
                      options={TAG_POSITIONS.map((p) => ({
                        id: p.id,
                        label: p.label,
                        title:
                          p.id === 'corner'
                            ? 'Ribbons pinned on the card art'
                            : 'Ribbons hang into the card from its top edge, like bookmarks slipped in (the default)',
                      }))}
                      value={settings.tagPosition || 'mark'}
                      onPick={(id) => set('tagPosition', id)}
                    />
                  </OptCard>
                  <OptCard
                    icon={ZoomIn}
                    title="DEFAULT GRID ZOOM"
                    desc={showHelp ? 'Card width in the grid (1 = smallest, 10 = largest — the 1.6.8 ladder grew five smaller steps below the old five). Cards can each have their own shape: set it per card in the new-card dialog or CARD LOOK.' : null}
                  >
                    <div className="flex items-center gap-3 w-[190px]">
                      <input
                        type="range"
                        className="gd-range flex-1"
                        min={ZOOM_RANGE.min}
                        max={ZOOM_RANGE.max}
                        step={1}
                        value={settings.zoom}
                        onChange={(e) => set('zoom', Number(e.target.value), 'zoom')}
                        title="Card size"
                      />
                      <span className="text-[11px] text-gd-chrome w-5 text-right">{settings.zoom}</span>
                    </div>
                  </OptCard>
                  <OptCard
                    icon={Tags}
                    title="DEFAULT TAG ZOOM"
                    desc={showHelp ? 'How big the tag ribbons sit on every card (0.6 = smallest, 2 = largest).' : null}
                  >
                    <div className="flex items-center gap-3 w-[190px]">
                      <input
                        type="range"
                        className="gd-range flex-1"
                        min={TAG_SCALE_RANGE.min}
                        max={TAG_SCALE_RANGE.max}
                        step={0.1}
                        value={settings.tagScale ?? TAG_SCALE_RANGE.default}
                        onChange={(e) => set('tagScale', Number(e.target.value), 'tagScale')}
                        title="Tag ribbon size"
                      />
                      <span className="text-[11px] text-gd-chrome w-8 text-right">{(settings.tagScale ?? TAG_SCALE_RANGE.default).toFixed(1)}</span>
                    </div>
                  </OptCard>
                  {/* 0.47.0 — TOP TAGS + TAG SEPARATION ("an option to control
                      the number of top tags more or less than 3" + "a slider
                      that will increase separation between the tags (will not
                      extend from the card"). */}
                  <OptCard
                    icon={Bookmark}
                    title="TOP TAGS"
                    desc={showHelp ? 'How many tag ribbons a card wears (1\u20138). Cards carrying fewer tags than this simply show them all.' : null}
                  >
                    <div className="flex items-center gap-3 w-[190px]">
                      <input
                        type="range"
                        className="gd-range flex-1"
                        min={TAG_LIMIT_RANGE.min}
                        max={TAG_LIMIT_RANGE.max}
                        step={1}
                        value={settings.tagLimit ?? TAG_LIMIT_RANGE.default}
                        onChange={(e) => set('tagLimit', Number(e.target.value), 'tagLimit')}
                        title="Top tags per card"
                      />
                      <span className="text-[11px] text-gd-chrome w-4 text-right">{settings.tagLimit ?? TAG_LIMIT_RANGE.default}</span>
                    </div>
                  </OptCard>
                  <OptCard
                    icon={UnfoldVertical}
                    title="TAG SEPARATION"
                    desc={showHelp ? 'How far apart the ribbons sit: negative overlaps them like stacked bookmarks, positive spreads them apart. The row clamps itself so it never extends past the card.' : null}
                  >
                    <div className="flex items-center gap-3 w-[190px]">
                      <input
                        type="range"
                        className="gd-range flex-1"
                        min={TAG_SEPARATION_RANGE.min}
                        max={TAG_SEPARATION_RANGE.max}
                        step={1}
                        value={settings.tagSeparation ?? TAG_SEPARATION_RANGE.default}
                        onChange={(e) => set('tagSeparation', Number(e.target.value), 'tagSeparation')}
                        title="Tag ribbon separation (px)"
                      />
                      <span className="text-[11px] text-gd-chrome w-10 text-right">
                        {(() => { const v = Number(settings.tagSeparation ?? TAG_SEPARATION_RANGE.default); return `${v > 0 ? '+' : ''}${v}px`; })()}
                      </span>
                    </div>
                  </OptCard>
              {/* 1.7.5 — THE UNSELECTED TAGS SWITCH ("add an option in
                  setting, when its on tags that are not selected onto the
                  card will be visible (default), but when its off, the tags
                  will be hidden if not selected, and it will also make it so
                  when pressing + tags to first open a window that shows tags
                  and allow the user to add them, then the tag manager
                  button, but when its on then it will open tag manager
                  right away"): one switch, two voices — the detail view's
                  tags ROW (the full vocabulary on the wall vs only the
                  card's own chips) and the + TAGS key's door (the manager
                  right away vs the picker first, the manager inside it).
                  Default ON: the wall keeps exactly the census it always
                  spoke. */}
              <OptCard
                icon={Tags}
                title="UNSELECTED TAGS"
                desc={showHelp ? "ON: the tags row shows every tag and + TAG opens the tag manager right away. OFF: only this card's own tags show, + TAG opens a tag picker first (with the tag manager inside it)." : null}
              >
                <button
                  className={clsx('gd-switch', settings.showAllTags !== false && 'is-on')}
                  title="Toggle unselected tags on the tags row + the + TAGS flow"
                  onClick={() => set('showAllTags', settings.showAllTags === false)}
                />
              </OptCard>
                  <div className="gd-set-section">CARD SHINE</div>

                  {/* 1.6.7 — THE CARD SHINE FAMILY ("add an option in settings
                      to enable or disable the shine animation, aka the white
                      effect from top left to bottom right when i hover over a
                      card" + "add also an option in settings to allow it to do
                      so over trims or not, and another one that changes the
                      shine animation, one should be a pulse and one should be
                      something else, figure it out"): the reflection's three
                      dials — the master switch, the trims rung, and the style
                      ladder (SWEEP, the classic corner-to-corner band; PULSE,
                      a soft double bloom that swells in place; GLINT, a quick
                      double flash at the near corner). All three land live
                      through the same root-class / data-attribute lane App
                      writes; the keys default to the classic law so nothing
                      changes for anyone until a dial turns. */}
                  <OptCard
                    icon={Sparkles}
                    title="CARD SHINE"
                    desc={
                      showHelp
                        ? settings.shineOn !== false
                          ? 'The white reflection plays over a card while the cursor rests on it.'
                          : 'No reflection plays on hover: the cards keep their glare lift and zoom alone.'
                        : null
                    }
                  >
                    <button
                      className={clsx('gd-switch', settings.shineOn !== false && 'is-on')}
                      title="Toggle the hover shine animation app-wide"
                      onClick={() => set('shineOn', settings.shineOn === false)}
                    />
                  </OptCard>
                  <OptCard
                    icon={Blend}
                    title="SHINE OVER TRIMS"
                    desc={
                      showHelp
                        ? settings.shineOverTrims !== false
                          ? 'The reflection passes over the card\u2019s trim ink — a reflection covering the whole print.'
                          : 'The reflection rides under the trim ink — the frame reads as drawn above the glare.'
                        : null
                    }
                  >
                    <button
                      className={clsx('gd-switch', settings.shineOverTrims !== false && 'is-on')}
                      title="Toggle whether the shine passes over the card trims"
                      onClick={() => set('shineOverTrims', settings.shineOverTrims === false)}
                    />
                  </OptCard>
                  <OptCard
                    icon={Sun}
                    title="SHINE STYLE"
                    desc={
                      showHelp
                        ? (settings.shineMode || 'sweep') === 'sweep'
                          ? 'SWEEP: the bright band glides from the near corner to the far one, one pass per hover (the classic).'
                          : 'PULSE: a soft glare blooms in place at the near corner and breathes twice — no travel at all.'
                        : null
                    }
                  >
                    <Seg
                      options={[
                        { id: 'sweep', label: 'Sweep', title: 'The classic: the band glides corner to corner, one pass per hover' },
                        { id: 'pulse', label: 'Pulse', title: 'A soft double bloom that swells in place — no travel' },
                      ]}
                      value={settings.shineMode === 'pulse' ? 'pulse' : 'sweep'}
                      onPick={(id) => set('shineMode', id)}
                    />
                  </OptCard>
                  {/* 1.9.12 — THE PRESS DIAL ("add an option for the
                      squish/stretch animation when clicking on a card in
                      settings, the option should allow to either (squish
                      (current) / pulse / none) with the default being none
                      (meaning also add a pulse animation)"): what a click
                      on a card speaks — SQUISH, the 1.4.0 jelly the grid
                      has always flown; PULSE, the new one-breath bloom that
                      swells in place; NONE, silence (the default — the
                      press arms nothing at all). The dial rides the same
                      root-attribute lane as the shine family (App arms
                      data-gd-press-mode; the flights + the grid's own arm
                      gate read it — see .gd-card-pulse in index.css), so
                      the setting lands live on the very next press. */}
                  <OptCard
                    icon={MousePointerClick}
                    title="PRESS ANIMATION"
                    desc={
                      showHelp
                        ? (settings.cardPressAnim || 'none') === 'squish'
                          ? 'SQUISH: the card squashes wide and settles tall — the jelly the grid has always flown.'
                          : (settings.cardPressAnim || 'none') === 'pulse'
                            ? 'PULSE: the card breathes up in one soft swell and settles home — no squash.'
                            : 'NONE: a press arms nothing — the card holds perfectly still (the default).'
                        : null
                    }
                  >
                    <Seg
                      options={[
                        { id: 'squish', label: 'Squish', title: 'The 1.4.0 classic: the card squashes wide and settles tall' },
                        { id: 'pulse', label: 'Pulse', title: 'The new bloom: one soft uniform swell in place, no squash' },
                        { id: 'none', label: 'None', title: 'Silence: a press arms nothing at all (the default)' },
                      ]}
                      value={['squish', 'pulse', 'none'].includes(settings.cardPressAnim) ? settings.cardPressAnim : 'none'}
                      onPick={(id) => set('cardPressAnim', id)}
                    />
                  </OptCard>
                </>
              )}

              {tab === 'Workspace' && (
                <>
                  {/* 0.33.0 — the old BEHAVIOR tab's WORKSPACE half (the
                      panel switches + every width slider + search — "divide
                      the settings so they go under more sectors on the left
                      instead of cluttering the behavior area"). */}
                  <div className="gd-set-section">WORKSPACE</div>
                  <OptCard
                    icon={PanelRight}
                    title="CHARACTER PANEL"
                    desc={
                      showHelp
                        ? settings.detailPanel !== false
                          ? 'Characters open in the right panel next to the grid.'
                          : 'Characters open in the full window.'
                        : null
                    }
                  >
                    <button
                      className={clsx('gd-switch', settings.detailPanel !== false && 'is-on')}
                      title="Toggle the card detail panel"
                      onClick={() => set('detailPanel', settings.detailPanel === false)}
                    />
                  </OptCard>
                  <OptCard
                    icon={SlidersHorizontal}
                    title="BOTTOM OUTPUT BAR"
                    desc={
                      showHelp
                        ? settings.promptBottom !== false
                          ? 'The composed prompt docks to the bottom of the viewer.'
                          : 'The composed prompt stays in the card view.'
                        : null
                    }
                  >
                    <button
                      className={clsx('gd-switch', settings.promptBottom !== false && 'is-on')}
                      title="Toggle the bottom output bar"
                      onClick={() => set('promptBottom', settings.promptBottom === false)}
                    />
                  </OptCard>
                  {/* 0.40.0 — CENTER THE REVEALED CLASS ("when clicking on an
                      offscreen class and it moves to it , if its possible to
                      centralize it , do so … (also add an option in settings
                      to disable that)"): the tree's reveal glide aims for
                      the MIDDLE of the sidebar on both axes — as far as the
                      scrollable range allows; off = the minimal
                      bring-into-view. */}
                  <OptCard
                    icon={LocateFixed}
                    title="CENTER REVEALED CLASSES"
                    desc={
                      showHelp
                        ? settings.centerClassOnReveal !== false
                          ? 'Clicking an offscreen class glides it toward the middle of the tree, as far as the tree allows.'
                          : 'Offscreen classes only scroll far enough to become visible.'
                        : null
                    }
                  >
                    <button
                      className={clsx('gd-switch', settings.centerClassOnReveal !== false && 'is-on')}
                      title="Toggle centering the class the tree reveals"
                      onClick={() => set('centerClassOnReveal', settings.centerClassOnReveal === false)}
                    />
                  </OptCard>

                  {/* 0.29.0 — PANEL WIDTHS ("in settings add the width scale
                      for each of the two left and right panels to ensure
                      its savable setting, so undo would work on it"). The
                      sliders write the SAME keys the panel edges' drag
                      handles commit — sidebarWidth / panelWidth — so one
                      undo step replays either handle's change. */}
                  <OptCard
                    icon={FolderTree}
                    title="LEFT TREE WIDTH"
                    desc={showHelp ? 'The class tree column, also resizable by dragging its right edge.' : null}
                  >
                    <div className="flex items-center gap-3 w-[190px]">
                      <input
                        type="range"
                        className="gd-range flex-1"
                        min={SIDEBAR_WIDTH_RANGE.min}
                        max={SIDEBAR_WIDTH_RANGE.max}
                        step={2}
                        value={settings.sidebarWidth ?? SIDEBAR_WIDTH_RANGE.default}
                        onChange={(e) => set('sidebarWidth', Number(e.target.value))}
                        title="Class tree width in pixels"
                      />
                      <span className="text-[11px] text-gd-chrome w-9 text-right">
                        {Math.round(settings.sidebarWidth ?? SIDEBAR_WIDTH_RANGE.default)}px
                      </span>
                    </div>
                  </OptCard>
                  <OptCard
                    icon={PanelRight}
                    title="CARD PANEL WIDTH"
                    desc={showHelp ? 'The right card panel, also resizable by dragging its left edge.' : null}
                  >
                    <div className="flex items-center gap-3 w-[190px]">
                      <input
                        type="range"
                        className="gd-range flex-1"
                        min={PANEL_WIDTH_RANGE.min}
                        max={PANEL_WIDTH_RANGE.max}
                        step={4}
                        value={settings.panelWidth ?? PANEL_WIDTH_RANGE.default}
                        onChange={(e) => set('panelWidth', Number(e.target.value))}
                        title="Character panel width in pixels"
                      />
                      <span className="text-[11px] text-gd-chrome w-9 text-right">
                        {Math.round(settings.panelWidth ?? PANEL_WIDTH_RANGE.default)}px
                      </span>
                    </div>
                  </OptCard>

                  {/* 0.31.0 — the full-window view's CARD column width (the
                      separator between the image preview and the prompt /
                      notes details — "add a separator between the image
                      preview and the prompt/notes so i can resize the
                      separator between the two"): drag writes the same key. */}
                  <OptCard
                    icon={PanelRight}
                    title="PREVIEW COLUMN WIDTH"
                    desc={showHelp ? 'The full-window view\u2019s image-preview column, also resizable by dragging its separator.' : null}
                  >
                    <div className="flex items-center gap-3 w-[190px]">
                      <input
                        type="range"
                        className="gd-range flex-1"
                        min={CARD_COL_WIDTH_RANGE.min}
                        max={CARD_COL_WIDTH_RANGE.max}
                        step={4}
                        value={settings.cardColWidth ?? CARD_COL_WIDTH_RANGE.default}
                        onChange={(e) => set('cardColWidth', Number(e.target.value))}
                        title="Preview column width in pixels"
                      />
                      <span className="text-[11px] text-gd-chrome w-9 text-right">
                        {Math.round(settings.cardColWidth ?? CARD_COL_WIDTH_RANGE.default)}px
                      </span>
                    </div>
                  </OptCard>

                  {/* 0.17.0 — SHOW HELP TEXT moved to the settings window's
                      LEFT RAIL (always visible, every tab). This section is
                      search-only now. */}
                  <div className="gd-set-section">SEARCH</div>
                  <OptCard
                    icon={Search}
                    title="ADVANCED SEARCH"
                    desc={showHelp ? 'Search also looks inside prompt parts and version names. Tags are never searched either way.' : null}
                  >
                    <button
                      className={clsx('gd-switch', settings.advancedSearch && 'is-on')}
                      title="Include prompts and version names in search"
                      onClick={() => set('advancedSearch', !settings.advancedSearch)}
                    />
                  </OptCard>
                </>
              )}

              {tab === 'Performance' && (
                <>
                  {/* 1.1.8 — UI MOTION MOVED HERE ("move ui motion option to
                      performance category"): the manual reduced-motion switch
                      used to live in Look, but motion is a rendering COST
                      before it is a look. It leads the Performance tab now,
                      the most global switch first.
                      1.7.1 — THE TEXT SPEAKS THE TRUE SCOPE ("update the ui
                      motion option in settings's help text, since currently
                      its missleading"): the old copy promised that REDUCED
                      cut "entrance animations, hover lifts and pattern
                      motion" — but the switch has been SCOPED since 1.4.9:
                      REDUCED lands only the HEAVY movement instantly (the
                      right panel's opening curtain, the cards' own layout
                      glides and sort moves, and the living finish coats'
                      clocks), while every fade keeps its breath and the
                      hover lifts, the jelly and the folds all keep their
                      full voice. A user reading the old text expected the
                      whole app to go still and found it still breathing —
                      the text now names exactly what stops and what runs,
                      both states, the Seg keys included. */}
                  <OptCard
                    icon={Sparkles}
                    title="UI MOTION"
                    desc={
                      showHelp
                        ? settings.reduceMotion
                          ? 'The heavy movement lands instantly: the panel\u2019s opening curtain, the cards\u2019 layout glides and the finish coats\u2019 animation. Fades, hover lifts and the rest of the motion keep running.'
                          : 'Everything animates at full speed: the panel\u2019s curtain, the cards\u2019 glides, the finish coats, the fades and the hover lifts alike.'
                        : null
                    }
                  >
                    <Seg
                      options={[
                        { id: 'full', label: 'FULL', title: 'Panel curtain, card glides and finish coats all animate' },
                        { id: 'reduced', label: 'REDUCED', title: 'Panel curtain, card glides and finish coats land instantly; fades and hover lifts keep running' },
                      ]}
                      value={settings.reduceMotion ? 'reduced' : 'full'}
                      onPick={(id) => set('reduceMotion', id === 'reduced')}
                    />
                  </OptCard>
                  {/* 1.5.7 — LIVING FINISHES ("the experimental feature seem to
                      still show the finishes even tho i had it turned off
                      alegidly, fix that"): the finish coats' OWN master
                      switch, its own lane — UI MOTION above stills the panel
                      curtain and the cards' sort flights with them, and the
                      per-card image/stamp motion switches speak single
                      cards; a user who only wants the living coats quiet had
                      no honest seat anywhere (hence "allegedly" — nothing
                      they could flip ever answered). OFF pauses every
                      material coat in the whole app on its current frame:
                      the materials STAY (Numeix still reads as ink, Auric
                      as gold), every clock inside them stops — the pour, the
                      ripples, the falling marks, the gloss sweeps — until
                      the switch comes back on, and every coat resumes
                      exactly in phase.
                      1.5.8 — THE SWITCH GREW ITS TEETH ("i cant see the
                      experimental option anymore for some reason thats
                      related to the finishes, the current living finishes
                      option is bad as in its not hiding all the finishes
                      (for example nuri finish still exists, it shouldnt),
                      and it isnt giving the lag warning, fix that"): three
                      laws at once. (1) The key speaks its true name now —
                      EXPERIMENTAL FINISHES — the seat the owner always
                      described, findable where they looked for it. (2) OFF
                      HIDES THE FINISHES FROM THE PICKERS (both card editors:
                      the material row falls back to None alone; saved cards
                      keep their coats, stilled — the past is never rewritten,
                      only the NEW picks are gated). (3) THE LAG WARNING IS
                      ALWAYS SPOKEN — not folded into the help text: while
                      ON, the card carries the warning line itself (the
                      coats are the app's heaviest constant paint; large
                      libraries and weak GPUs feel them). The description
                      no longer waits for SHOW HELP either — a switch this
                      consequential says what it does on its own face. */}
                  <OptCard
                    icon={Layers}
                    title="EXPERIMENTAL FINISHES"
                    /* 1.6.4 — the OFF face went quiet ("remove this text:
                       'The material coats are switched off: the editors pick
                       None only, and every coat in the app holds its current
                       frame.'"): the switch's own state + the MAY LAG warn
                       carry the ON story; OFF says nothing — the key speaks
                       by its position alone. */
                    desc={
                      settings.livingFinishes !== false
                        ? 'The material coats are enabled and animated app-wide.'
                        : null
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      {settings.livingFinishes !== false && (
                        <div className="gd-fin-lag-warn" title="The animated finishes are the app's heaviest constant paint; they can lag scrolling and the grid on large libraries or weak GPUs">
                          <span className="gd-fin-lag-warn-dot" aria-hidden />
                          MAY LAG
                        </div>
                      )}
                      <button
                        className={clsx('gd-switch', settings.livingFinishes !== false && 'is-on')}
                        title="Toggle every finish coat: off hides the finishes in the editors and pauses every coat in the app"
                        onClick={() => set('livingFinishes', settings.livingFinishes === false)}
                      />
                    </div>
                  </OptCard>
                  {/* 0.30.0 — PERFORMANCE ("add more settings ... to enhance
                      performance or for accessability or so on"): three
                      switches, each a real code path — the stage blur, the
                      hover lifts, and the tooltip's scroll follow. All three
                      default ON (the full look); flipping any of them lifts
                      real GPU/layout work on weak machines. 0.33.0 — its own
                      rail key, split out of the old crowded Behavior tab. */}
                  <OptCard
                    icon={Gauge}
                    title="IMAGE STAGE BLUR"
                    desc={showHelp ? (settings.stageBlur !== false ? 'The blurred backdrop behind image previews runs (the full look).' : 'A flat tint replaces the blurred backdrop: much cheaper to repaint while scrolling.') : null}
                  >
                    <button
                      className={clsx('gd-switch', settings.stageBlur !== false && 'is-on')}
                      title="Toggle the image backdrop blur"
                      onClick={() => set('stageBlur', settings.stageBlur === false)}
                    />
                  </OptCard>
                  <OptCard
                    icon={MousePointerClick}
                    title="HOVER LIFTS"
                    desc={showHelp ? (settings.hoverLifts !== false ? 'Cards, buttons and slots lift slightly under the pointer.' : 'Everything stays at rest height under the pointer: less repaint churn.') : null}
                  >
                    <button
                      className={clsx('gd-switch', settings.hoverLifts !== false && 'is-on')}
                      title="Toggle the hover lift effects"
                      onClick={() => set('hoverLifts', settings.hoverLifts === false)}
                    />
                  </OptCard>
                  {/* 1.6.8 — THE LIVE DRAG PREVIEW ("add an option for settings
                      in performance to allow for live drags preview, when
                      enabled it would be like currently, but when off it will
                      instead just show the shine on left or right of the card
                      and THEN update when i let go"): ON keeps the 1.6.3 live
                      gap — the wall previews the reorder while the card flies,
                      gliding the displaced cards aside in real time. OFF holds
                      the board STILL through the whole drag: the hovered
                      card's edge glow alone speaks, and the reorder lands
                      with the release as one animated commit — the cheap
                      lane for the biggest walls, where every previewed
                      re-pack costs a full masonry pass.
                      1.9.12 — THE DEFAULT FLIPS OFF ("the live drag previews
                      option default should be off"): the switch now rests at
                      the still-wall lane (the === true polarity — a missing
                      key reads as OFF, not ON), and a stored choice keeps its
                      own. */}
                  <OptCard
                    icon={MousePointerClick}
                    title="LIVE DRAG PREVIEW"
                    desc={
                      showHelp
                        ? settings.liveDragPreview === true
                          ? 'While you drag a card, the wall previews the new arrangement live and the drop settles exactly what you saw.'
                          : 'While you drag, the wall holds still — the hovered card\u2019s edge glow marks the seat, and the reorder lands in one animated step when you let go.'
                        : null
                    }
                  >
                    <button
                      className={clsx('gd-switch', settings.liveDragPreview === true && 'is-on')}
                      title="Toggle the live drag preview (off: the edge glow marks the seat and the wall updates on release)"
                      onClick={() => set('liveDragPreview', settings.liveDragPreview !== true)}
                    />
                  </OptCard>
                  {/* 1.2.4 — TOOLTIP SCROLL FOLLOW is RETIRED (the pill pins at
                      its hover point now — see GdTooltips): the switch rode a
                      behavior that no longer exists, so the row is gone. Old
                      saves keep their tooltipFollow key; it reads as
                      nothing. */}
                  {/* 0.34.0 — AUTO-SWITCH IMAGES ("add an option in settings in
                      performance that would auto swipe the images right and
                      left every 4 or 5 seconds, up to u to decide the
                      period"): the image stage walks forward through a
                      version's images every 5 seconds — paused while the
                      pointer rests on the stage or any window is open. */}
                  <OptCard
                    icon={Images}
                    title="AUTO-SWITCH IMAGES"
                    desc={
                      showHelp
                        ? settings.autoSwipeImages === true
                          ? 'The image stage walks to the next picture every 5 seconds, pausing while you rest on it or a window is open.'
                          : 'The stage keeps the picture you picked until you step away yourself.'
                        : null
                    }
                  >
                    <button
                      className={clsx('gd-switch', settings.autoSwipeImages === true && 'is-on')}
                      title="Toggle the 5-second image walk"
                      onClick={() => set('autoSwipeImages', settings.autoSwipeImages !== true)}
                    />
                  </OptCard>
                  {/* 1.5.0 — STAGED PANEL MOUNT IS RETIRED ("remove the
                      staged panel mount option in performance, it does
                      nothing"): the switch rode a ladder the 1.3.x passes
                      already dismantled — the tags and stamps breaths left
                      in 1.3.6/1.3.8, and the view's own mountStage had
                      been a constant since (true and false took the SAME
                      code path; the toggle changed nothing but its own
                      chip). The row left with the dead rail it rode in on;
                      old saves keep their stagedPanelMount key and it
                      reads as nothing, exactly like tooltipFollow before
                      it. */}
                  {/* 1.3.2 — THE PREVIEW SYSTEM IS RETIRED ("just remove the
                      preview system and options, just make it so the
                      thumbnail is auto generated and thats it"): the CARD
                      PREVIEW THUMBNAILS switch, the AUTO PREVIEW GENERATION
                      switch and the GENERATE PREVIEWS key are all gone.
                      Every import builds its lightweight thumb + preview
                      copies automatically (main.js saveImage, always) and
                      every cover reads the lightest tier its record owns
                      (GridView's prev-or-thumb law) — nothing to configure,
                      nothing to run. */}
                  {/* 1.2.7 — THE SPLASH'S LIGHTWEIGHT SEAT. 1.3.3 — THE
                      SWITCH SPEAKS ITS OWN NAME ("reverse the splash film
                      reel option in settings, when its on its on when its
                      off its off"): the old key was inverted from the
                      label's promise — ON rolled generated pixel frames
                      instead of the cards (reading as the reels NOT on),
                      OFF rolled the real covers. The switch now says what
                      it does: ON = the splash's wings roll the film reels
                      with the cards' own covers (the default); OFF = no
                      film reels at all — the wings stay empty and no
                      covers are read at boot (the lightweight seat). */}
                  <OptCard
                    icon={Images}
                    title="SPLASH FILM REELS"
                    desc={
                      showHelp
                        ? settings.splashFilmReels !== false
                          ? "ON: the splash screen rolls your cards' cover thumbnails as film strips in the wings. OFF: the film reels are hidden and no card art loads at boot."
                          : "OFF: the splash shows no film reels and loads no card art at boot. Turn this on to roll your cards' cover thumbnails in the wings."
                        : null
                    }
                  >
                    <button
                      className={clsx('gd-switch', settings.splashFilmReels !== false && 'is-on')}
                      title="Toggle the splash screen's film reels (your cards' covers) on or off"
                      onClick={() => set('splashFilmReels', settings.splashFilmReels === false)}
                    />
                  </OptCard>
                </>
              )}

              {tab === 'Keys' && (
                <>
                  {/* 0.31.0 — SHORTCUTS, now REASSIGNABLE ("allow me to
                      reassign shortcuts (must be two combinations like ctrl
                      s or alt f etc)"): the editable roster — click a key,
                      press the new combo, conflicts refused, RESET for the
                      shipped defaults. The top buttons' tooltips and the
                      app's keydown listener all read the same live map.
                      0.33.0 — its own rail key, split out of the old
                      crowded Behavior tab.
                      1.7.7 — THE SECTOR EARNS ITS FURNITURE ("rework the
                      keys sector, the container isnt fammilar and isnt
                      easy to use ... explanatory text should be behind the
                      help text option, reset should have a confirmation"):
                      a gd-set-section header like every other sector, the
                      roster with per-row hints behind HELP TEXT, an
                      explicit CANCEL key on the armed row, a two-step
                      RESET with a red confirm, and the glow law — the
                      theme's accent when a combo commits, red when it's
                      discarded or the map resets. */}
                  <div className="gd-set-section">REASSIGN KEYS</div>
                  <ShortcutsCard shortcuts={settings.shortcuts} onChange={(map) => set('shortcuts', map)} showHelp={showHelp} />
                </>
              )}

              {tab === 'Data' && (
                <>
                  {/* 1.1.3 — UPDATES ("add auto update channel"): the channel
                      reads the repo's GitHub Releases feed — OFF keeps the
                      app fully offline, STABLE asks once on launch + on
                      demand. The verdict line speaks whatever the last check
                      found; a newer release offers VIEW RELEASE (the browser
                      opens the page — the app itself never downloads
                      anything). */}
                  <div className="gd-set-section">UPDATES</div>
                  <OptCard
                    icon={Radio}
                    title="UPDATE CHANNEL"
                    desc={
                      showHelp
                        ? 'Where the app looks for new versions: the GitHub Releases feed of Burrito GenDex’s own repository. STABLE asks once on launch and whenever you press CHECK; OFF stays fully offline.'
                        : null
                    }
                  >
                    <Seg
                      options={UPDATE_CHANNELS.map((o) => ({ id: o.id, label: o.label, title: o.title }))}
                      value={settings.updateChannel ?? 'stable'}
                      onPick={(id) => set('updateChannel', id)}
                    />
                  </OptCard>
                  <OptCard
                    icon={RefreshCw}
                    title="CHECK FOR UPDATES"
                    desc={showHelp ? `Asks GitHub right now whether a newer release exists. This is v${APP.version}.` : null}
                  >
                    <div className="flex items-center gap-2">
                      {updateState?.status === 'available' && updateState?.url && (
                        <button
                          className="gd-btn"
                          title="Open the release page in your browser"
                          onClick={() => window.api?.openExternal?.(updateState.url)}
                        >
                          VIEW RELEASE
                        </button>
                      )}
                      {/* 1.1.6 — THE DOWNLOAD PAGE KEY ("i cant see version
                          1.1.5 to download … make a simple download website
                          page"): opens the one-file download page — direct
                          installer + source-zip asset links for the current
                          release and every older one, immune to the release
                          page's flakiness. See DOWNLOAD_PAGE_URL in
                          constants for where it points.
                          1.9.11 — THE REPOSITORY IS THE DOWNLOAD PAGE
                          ("the download page link should be
                          'https://github.com/NuriDerBurrito/Burrito_GenDex'
                          in the data section in settings window"): the key
                          opens the repository itself now — its Releases
                          page carries every version's installer and source
                          assets, and the one URL can never 404 behind a
                          website that no longer exists. */}
                      <button
                        className="gd-btn"
                        title="Open the download page (the GitHub repository): releases carry every version's installer and source assets"
                        onClick={() => window.api?.openExternal?.(DOWNLOAD_PAGE_URL)}
                      >
                        DOWNLOAD PAGE
                      </button>
                      <button
                        className="gd-btn"
                        disabled={!onCheckUpdates || updateState?.status === 'checking'}
                        onClick={onCheckUpdates}
                        title="Ask GitHub for the latest release"
                      >
                        <RefreshCw size={12} />
                        {updateState?.status === 'checking' ? 'CHECKING…' : 'CHECK'}
                      </button>
                    </div>
                  </OptCard>
                  <div className="gd-update-line" data-gd-update-status={updateState?.status || 'idle'}>
                    {updateState?.status === 'checking' && 'Asking GitHub…'}
                    {updateState?.status === 'none' && 'The channel is live: no release has been published there yet.'}
                    {updateState?.status === 'latest' && `Up to date: v${updateState.current || APP.version} is the newest release.`}
                    {updateState?.status === 'available' &&
                      `New release available: v${updateState.latest}${updateState.publishedAt ? ` · published ${String(updateState.publishedAt).slice(0, 10)}` : ''}.`}
                    {updateState?.status === 'error' && (updateState.message || 'The check could not reach GitHub.')}
                    {(!updateState || updateState.status === 'idle') && `This is v${APP.version}; the channel has not been asked yet.`}
                  </div>

                  {/* 0.25.0 — DATA & RECOVERY (moved here from Behavior in
                      0.30.0 — this tab is its natural home): autosave cadence
                      + the on-save backup rotation (main process). AUTOSAVE
                      only writes while there ARE unsaved changes; BACKUPS is
                      always on. */}
                  <div className="gd-set-section">DATA &amp; RECOVERY</div>
                  <OptCard
                    icon={Timer}
                    title="AUTOSAVE"
                    desc={
                      showHelp
                        ? (settings.autosaveMinutes || 0) === 0
                          ? 'Autosave is off: the SAVE key and Ctrl+S are the only writers.'
                          : `Unsaved changes are written to disk every ${settings.autosaveMinutes} minute(s).`
                        : null
                    }
                  >
                    <Seg
                      options={AUTOSAVE_OPTIONS.map((o) => ({ id: o.id, label: o.label, title: o.title }))}
                      value={settings.autosaveMinutes ?? 0}
                      onPick={(id) => set('autosaveMinutes', id)}
                    />
                  </OptCard>
                  <OptCard
                    icon={DatabaseBackup}
                    title="SAVE BACKUPS"
                    desc={showHelp ? 'Every save first copies the previous database into the backups folder (newest 8 kept), next to your images, in the app data folder.' : null}
                  >
                    <span className="gd-stamp" style={{ color: 'var(--gd-mute)' }}>
                      AUTO
                    </span>
                  </OptCard>

                  {/* 0.30.0 — STORAGE: the database / image / backup
                      directories, one key each ("one of them related to the
                      database like opening the directory of the database for
                      images/the data itself"). */}
                  <div className="gd-set-section">STORAGE</div>
                  <OptCard
                    icon={FolderOpen}
                    title="DATA FOLDER"
                    desc={showHelp ? 'Where gendex_db.json lives: the whole archive in one file, in your OS user data folder.' : null}
                  >
                    <button className="gd-btn" onClick={() => onOpenFolder?.('data')} title="Open the data folder in your file browser">
                      <FolderOpen size={12} />
                      OPEN
                    </button>
                  </OptCard>
                  <OptCard
                    icon={LayoutGrid}
                    title="IMAGES FOLDER"
                    desc={showHelp ? 'Every image you imported: originals plus their thumbnails.' : null}
                  >
                    <button className="gd-btn" onClick={() => onOpenFolder?.('images')} title="Open the images folder in your file browser">
                      <FolderOpen size={12} />
                      OPEN
                    </button>
                  </OptCard>
                  <OptCard
                    icon={DatabaseBackup}
                    title="BACKUPS FOLDER"
                    desc={showHelp ? 'The last 8 database snapshots, taken before every save.' : null}
                  >
                    <button className="gd-btn" onClick={() => onOpenFolder?.('backups')} title="Open the backups folder in your file browser">
                      <FolderOpen size={12} />
                      OPEN
                    </button>
                  </OptCard>

                  {/* 0.30.0 — MAINTENANCE: the renderer cache and the nuclear
                      database reset ("or clearing database, or clearing
                      cache") — the reset is confirm-gated.
                      1.3.2 — the PREVIEW ERASE key is retired with the whole
                      preview system: previews build automatically and are
                      always wanted back. */}
                  <div className="gd-set-section">MAINTENANCE</div>
                  <OptCard
                    icon={Gauge}
                    title="CLEAR CACHE"
                    desc={showHelp ? 'Drops the renderer\u2019s cached image data: the app re-decodes pictures as you visit them.' : null}
                  >
                    <button className="gd-btn" onClick={onClearCache} title="Clear the renderer cache">
                      <RotateCcw size={12} />
                      CLEAR
                    </button>
                  </OptCard>
                  <OptCard
                    icon={Trash2}
                    title="RESET DATABASE"
                    desc={showHelp ? 'Wipes every card, class, tag and stamp (the image files stay on disk). Asks first.' : null}
                  >
                    <button className="gd-btn" style={{ color: '#ff8d7d' }} onClick={onResetDatabase} title="Wipe the database (with confirmation)">
                      <Trash2 size={12} />
                      RESET
                    </button>
                  </OptCard>

                  {/* 1.1.2 — LIBRARY PORTABILITY ("add library import/export,
                      also include logic to tie them to their images as it
                      claims a zip file, and let it also read the zip file and
                      extract it to import the data"): one EXPORT key writes
                      the whole archive — the database plus every referenced
                      image — into a single .zip you can carry to another
                      machine; one IMPORT key reads one back (merge into the
                      current library or replace it — App asks before a
                      single byte moves). */}
                  <div className="gd-set-section">LIBRARY</div>
                  <OptCard
                    icon={FileDown}
                    title="EXPORT LIBRARY"
                    desc={showHelp ? 'Packs the database and every image it references into one .zip: the whole archive, self-contained, ready to move or back up.' : null}
                  >
                    <button className="gd-btn" disabled={!onExportLibrary} onClick={onExportLibrary} title="Export the library as a zip">
                      <FileDown size={12} />
                      EXPORT
                    </button>
                  </OptCard>
                  <OptCard
                    icon={FileUp}
                    title="IMPORT LIBRARY"
                    desc={showHelp ? 'Reads a Burrito GenDex .zip and brings its cards, classes, tags, stamps and images back, merged into this library or replacing it (your call).' : null}
                  >
                    <button className="gd-btn" disabled={!onImportLibrary} onClick={onImportLibrary} title="Import a library zip">
                      <FileUp size={12} />
                      IMPORT
                    </button>
                  </OptCard>

                  {/* 1.1.3 — FACTORY RESET ("implement a factory reset button
                      in the data settings, pressing on it would reset
                      everything (add DOUBLE confirmation of course)"): the
                      terminal key, last seat of the last section on purpose.
                      RESET DATABASE above wipes the collection but keeps
                      settings, theme and image files; THIS returns the whole
                      app to its first-install day — cards, classes, tags,
                      stamps, every image and preview, every backup, the
                      settings AND the theme — then restarts it empty. App
                      owns the road: two confirm windows stand between the key
                      and the wipe. */}
                  <div className="gd-set-section">FACTORY RESET</div>
                  <OptCard
                    icon={AlertTriangle}
                    title="FACTORY RESET"
                    desc={
                      showHelp
                        ? 'The nuclear key: erases EVERYTHING (the whole collection, every image and preview on disk, every backup, all settings and your theme), then restarts the app empty the way it was the day you first ran it. Asks twice; there is no undo.'
                        : null
                    }
                  >
                    <button
                      className="gd-btn gd-btn-danger"
                      disabled={!onFactoryReset}
                      onClick={onFactoryReset}
                      title="Erase everything and restart fresh (asks twice)"
                    >
                      <AlertTriangle size={12} />
                      RESET ALL
                    </button>
                  </OptCard>
                </>
              )}

              {tab === 'Logs' && (
                <>
                  {/* 1.2.7 — THE LEDGER (see App's pushStatusLog): the top
                      bar's last 50 status lines, newest at the bottom. The
                      list is a plain selectable text block — drag over any
                      area to select exactly those lines, then COPY SELECTED
                      (or the OS's own ctrl+c); COPY ALL takes the whole
                      ledger. Failures wear the warm red; everything else
                      reads in the quiet mono ink. */}
                  <OptCard
                    icon={ScrollText}
                    title="TOP BAR LOGS"
                    desc={
                      showHelp
                        ? `Every line the top bar's status spoke this session (the last ${liveLogCap}, newest last — the dial below sets how many are kept). Select any area to copy it, or copy the whole ledger.`
                        : null
                    }
                  >
                    <div className="flex items-center gap-2">
                      {copiedNote && (
                        <span className="text-[9px] tracking-[0.14em] text-gd-mute" aria-live="polite">{copiedNote}</span>
                      )}
                      <button
                        className="gd-btn"
                        title="Copy whatever is selected in the ledger below (falls back to everything when nothing is selected)"
                        onClick={() => {
                          let picked = '';
                          try {
                            picked = String(window.getSelection?.()?.toString?.() || '');
                          } catch {
                            picked = '';
                          }
                          const text = picked.trim() || logText();
                          copyLogText(text, picked.trim() ? 'selected' : 'all');
                        }}
                      >
                        <Copy size={11} />
                        COPY SELECTED
                      </button>
                      <button
                        className="gd-btn"
                        title={`Copy the whole ledger (the last ${liveLogCap} lines)`}
                        onClick={() => copyLogText(logText(), 'all')}
                      >
                        <Copy size={11} />
                        COPY ALL
                      </button>
                    </div>
                  </OptCard>
                  {/* 1.3.0 — THE LEDGER IS A SHELL + ITS OWN SCROLLER ("the
                      logs container looks goofy when in round theme and not
                      in sharp corner theme, fix that"): the list used to BE
                      the scroller — a rounded box with overflow-y-auto — so
                      Chromium's classic 10px scrollbar ran the padding box's
                      full height, its square ends poking straight past the
                      corner curves (worst on the round style, where the cut
                      is deepest). The shell clips (overflow hidden) and an
                      inner div owns the scroll — the scrollbar's whole lane
                      lives inside the shell's straight-walled zone, clear of
                      every corner curve (the LucideIconPicker's own 1.2.9
                      law, spoken here for the ledger). */}
                  <div className="gd-logs-list select-text" role="log" aria-live="polite">
                    <div className="gd-logs-scroll">
                    {logs.length === 0 ? (
                      <div className="gd-logs-empty">No lines yet: the top bar\'s status verdicts collect here as they happen.</div>
                    ) : (
                      logs.map((entry, i) => (
                        <div key={`${entry.ts}-${i}`} className={clsx('gd-logs-line', entry.kind === 'fail' && 'is-fail')}>
                          <span className="gd-logs-time">{fmtLogTime(entry.ts)}</span>
                          <span className="gd-logs-msg">{String(entry.msg || '')}</span>
                        </div>
                      ))
                    )}
                    </div>
                  </div>
                  {/* 1.9.11 — THE LEDGER'S OWN DIAL ("add an option to
                      control how much logs are saved (default is 50 like
                      usual) in the logs section in settings window, right
                      below the logs container, the cell takes a numeric
                      value"): the cap used to be a flat 50 hard-coded in
                      App's ledger and repeated in this footer's word. The
                      numeric cell sits exactly where the report drew it —
                      right below the logs container, on the footer line —
                      and speaks the ONE law the whole ledger now reads
                      (settings.logLimit, clamped 1-999 through
                      LOG_LIMIT_RANGE, sanitized at load, trimmed by App
                      the frame it lands).
                      1.9.12 — THE DIAL SPEAKS ONLY WHEN DONE ANSWERS
                      ("it activates instantly, it shouldnt do that it
                      should only update after i press on okay, since
                      currently if i type 60, it applies 6 first and
                      deletes the rest"): typing moves the DRAFT alone
                      (the keystroke road — nothing lands, nothing trims,
                      no line is ever lost mid-type); the ONE commit is
                      the DONE key's own road (see doneClose), clamped
                      whole; the blur normalizes the field without
                      writing; junk beyond the ladder clamps on the way
                      in; the count beside it keeps telling the truth
                      about what IS kept. */}
                  <div className="mt-1 flex items-center justify-end gap-2">
                    <label
                      htmlFor="gd-log-limit"
                      className="text-[9px] tracking-[0.14em] text-gd-mute"
                      title="How many status lines the ledger keeps — in the top bar, in this tab, across restarts (1-999). The typed number lands only when DONE answers; nothing changes while you type."
                    >
                      LOGS KEPT
                    </label>
                    <input
                      id="gd-log-limit"
                      type="number"
                      className="gd-input gd-logs-limit-cell"
                      min={LOG_LIMIT_RANGE.min}
                      max={LOG_LIMIT_RANGE.max}
                      step={1}
                      inputMode="numeric"
                      value={logLimitDraft}
                      onChange={(e) => typeLogLimit(e.target.value)}
                      onBlur={normalizeLogLimit}
                      onKeyDown={(e) => {
                        // Enter inside the cell is a DONE in the owner's
                        // hand — the draft commits and the window closes,
                        // exactly the "okay" the report named (anything
                        // else would leave a typed draft that LOOKS applied
                        // while the ledger still holds the old cap).
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          doneClose();
                        }
                      }}
                      title={`How many status lines the ledger keeps (${LOG_LIMIT_RANGE.min}-${LOG_LIMIT_RANGE.max}; the default is ${LOG_LIMIT_RANGE.default} like usual) — lands only on DONE`}
                    />
                    <span className="text-[9px] tracking-[0.14em] opacity-60">
                      {logs.length ? `${logs.length} LINE${logs.length === 1 ? '' : 'S'} · LAST ${liveLogCap} KEPT` : `LAST ${liveLogCap} KEPT`}
                    </span>
                  </div>
                </>
              )}

              {tab === 'About' && (
                /* 0.27.0 — ABOUT KEEPS ITS POSTURE: a min-height + vertical
                   centering so the card never collapses into a sliver when
                   the tab switches ("about page shrinks too much that it
                   shows scrollbars") — the measurement fix lives in the
                   settings CSS (the tabflow node now carries the column's
                   padding, so the modal's height math counts it).
                   0.32.0 — the LINK WALL joins the panel: LINKS (HuggingFace,
                   GitHub-soon, Genesis Iterations, the Discord username COPY)
                   and SUPPORT (Ko-fi, PayPal) under the blurb, every key
                   wearing its own brand mark. */
                <div className="gd-about-tab flex flex-col items-center justify-center text-center py-6">
                  {/* 1.0.2 — THE ABOUT MARK'S OWN LIGHT ("replace it with
                      About_Logo.png and let it bloom green on its edges").
                      1.0.3 — the bloom was tamed and doubled, one per face.
                      1.0.4 — GLOW, SHINE AND GODRAYS ("remove the bloom on
                      the two logos in the about section in settings and
                      instead just add glow/shien and godrays behind them,
                      ensure its not laggy").
                      1.0.5 — THE RAYS RETIRE, THE GLOW DEEPENS ("i dont
                      like the godrays, remove them from splash screen and
                      about section, and improve the glow"): the spinning
                      fan is gone from both faces — each mark now sits over
                      a LAYERED breathing glow alone (a bright core over a
                      wide soft field, opacity + a barely-there swell —
                      both compositor-only, 60fps by construction). One halo
                      per face stays: A shines behind the resting mark, B
                      behind the second logo the hover morph lands on —
                      same green language, opposite flights. */}
                  <div
                    className="about-morph"
                    ref={aboutMorphRef}
                    onMouseEnter={startRainbow}
                    onMouseLeave={stopRainbow}
                  >
                    {/* 1.0.7 — THE LIGHT SPEAKS THE THEME ("the glow in about
                        and splash should be related to the theme color
                        (except on hover it would be shifting in colors
                        including white)"): the resting halo (A, behind this
                        mark) paints in the THEME's own accent pair —
                        index.css mixes every stop from --gd-accent /
                        --gd-accent-2.
                        1.0.9 — AND THE HOVER FACE WALKS THE RAINBOW
                        ("when hovering over the icon in the about section,
                        it should shift the glow color between colors
                        randomly, like all the rainbow colors including
                        white"): halo B's shift layers now follow the RANDOM
                        hue this element's handlers roll (--gd-rainbow-h glides
                        on the registered transition, --gd-rainbow-w lights the
                        white pass), not the fixed accent2-then-white ladder.
                        The theme paints the resting light; chance paints the
                        hover. */}
                    <div className="morph-halo morph-halo-a" aria-hidden>
                      <div className="halo-glow" />
                    </div>
                    <div className="morph-halo morph-halo-b" aria-hidden>
                      <div className="halo-glow" />
                      <div className="halo-glow halo-shift-2" />
                      <div className="halo-glow halo-shift-3" />
                    </div>
                    <img src={aboutLogo} alt="" className="morph-a" draggable={false} />
                    <img src={companyLogo} alt="" className="morph-b" draggable={false} />
                  </div>
                  {/* 1.0.7 — THE FULL STUDIO NAME HERE TOO ("rename gendex to
                      burrito gendex in teh about section in settings"): the
                      wordmark under the mark reads the whole name, one
                      language with the splash screen's lockup. */}
                  <div className="mt-3 font-display text-2xl font-bold tracking-[0.2em] text-gd-chrome">
                    BURRITO GENDEX
                  </div>
                  <div className="mt-1 text-[10px] tracking-[0.3em] text-gd-mute">
                    {APP.tagline} · V{APP.version}
                  </div>
                  {/* 1.0.7 — EMDASH-FREE AND BETTER SHAPED ("remove em dashes
                      from … the about settings, ensure its also formatted
                      better"): the blurb is three short sentences on its
                      own lines instead of one dash-chained ribbon. */}
                  
                  <AboutLinks />
                  <div className="mt-4 text-[10px] tracking-[0.18em] text-gd-mute">
                    {APP.name.toUpperCase()} · GENESIS ITERATIONS · MIT
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// 1.7.0 — THE WINDOW IS MEMO'D ("i will say that the window of 'new card
// creation' and 'settings', sometimes redo and undo specific actions and
// such is sometimes really slow (do account that its on an old cpu), so if
// its optimized as it is currently then good enough, if not then improve
// it"): the creation window already rides its own memo'd retained seat
// (the 1.5.4 NewCardSeat — its props were stabilized then), but the
// settings window re-rendered its whole 2100-line tree on EVERY App
// render — every status ping, every drag verdict, every tooltip breath
// — because two of its props were born-fresh closures at the call site.
// The window now carries the memo itself and App passes it STABLE
// handles (see closeSettingsWindow / checkUpdatesNow): while the window
// is open, the app's frequent ping renders cost it nothing — its tree
// re-renders only when its own state moves (a tab flip, a setting, the
// ledger, the update verdict). The undo/redo snapshot itself keeps its
// design (the full-history clone is what guarantees a clean restore);
// the WINDOW no longer multiplies it.
export default memo(SettingsModalInner);
