import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import {
  ArrowLeft,
  ArrowUpDown,
  Ban,
  ClipboardPaste,
  Copy,
  CopyPlus,
  Expand,
  FolderPlus,
  Maximize2,
  Minimize2,
  Pencil,
  Plus,
  Save,
  Scissors,
  Settings as SettingsIcon,
  Shrink,
  SquarePen,
  Trash2,
  Undo2,
  Redo2,
} from 'lucide-react';
import Splash from './components/Splash.jsx';
// 1.5.8 — the stage-size prewarm door (see the effect that walks the
// library's thumbs after the database lands).
import { prewarmStageSizes } from './components/ImageStage.jsx';
import Titlebar from './components/Titlebar.jsx';
import GridView from './components/GridView.jsx';
import CharacterView, { CardLookModal } from './components/CharacterView.jsx';
import { useImageAspect } from './components/CardLookEditor.jsx';
import ClassSidebar from './components/ClassSidebar.jsx';
import NewCharacterModal from './components/NewCharacterModal.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import TagManagerModal from './components/TagManagerModal.jsx';
import TagPickerModal from './components/TagPickerModal.jsx';
import GdContextMenu from './components/GdContextMenu.jsx';
import UpdateModal from './components/UpdateModal.jsx';
import { ConfirmModal, ClosePromptModal, ImportLibraryModal } from './components/Dialogs.jsx';
import ToastHub from './components/ToastHub.jsx';
import { gdToast } from './utils/toasts.js';
import { RichText } from './components/RichText.jsx';
import { ChipGlyph } from './components/LucideIconPicker.jsx';
import { APP, makeCharacter, makeClass, makeStamp, makeTag, ROOT_CLASS_ID, PANEL_WIDTH_RANGE, SIDEBAR_WIDTH_RANGE, CARD_COL_WIDTH_RANGE, clampPanelWidth, clampSidebarWidth, clampCardColWidth, DEFAULT_SHORTCUTS, comboFromEvent, sanitizeStampAlpha, sanitizeStampHueAlpha, sanitizeStampRot, sanitizeStampScale, sanitizeStampPos, sanitizeStampSettings, normalizeFinishTransparency, LOG_LIMIT_RANGE, clampLogLimit } from './constants/index.js';
import {
  buildImageUrl,
  imageRecord,
  classLabelPath,
  composeVersionOutput,
  countOutputStats,
  createSafeDb,
  deferToPaint,
  descendantClassIds,
  dominantColorOf,
  getPreviewVersion,
  isHexColor,
  moveClass as moveClassInTree,
  readableInk,
  saveImageBlobWithThumb,
  sortCharacters,
  stripRichText,
} from './utils/helpers.js';
import { setThemeOnDocumentLive, clearLegacyCustomFontStorage } from './utils/theme.js';
import { markImageDead, probeImageAliveness, sweepImageDeaths } from './utils/imageDeaths.js';
import { cmpVersions } from './utils/dbio.js';
import { TOS_VERSION } from './constants/legal.js';
import LegalModal from './components/LegalModal.jsx';
import PanelResizer from './components/PanelResizer.jsx';

const SPLASH_MIN_MS = 2500; // one full logo pulse — GenStack law
const TRANSIENT_MS = 2500;
const HISTORY_LIMIT = 100;
const COALESCE_MS = 800;
// 1.1.4 — THE LAST-RUN SEAT (the update window's memory, see the boot
// check below): which version this machine ran the last time the app
// opened. localStorage (not the db) on purpose — it speaks the MACHINE's
// last run, not the library's state, and it must read/write even before
// the database has loaded.
const LAST_RUN_KEY = 'gd:last-run-version';

// 1.4.1 — DeferredPanelBoot (see the detail panel's own mount note below):
// holds its children back for exactly ONE animation frame on the panel's
// FIRST mount (the aside's shell + width flight paint alone on the click's
// own frame), then builds the heavy CharacterView inside the opening
// curtain.
// 1.4.3 — THE TRANSITION IS RETIRED ("when right panel opens, its blank and
// i have to wait until the data pops in, fix that"): the 1.4.1 flight built
// the view inside startTransition — a LOW-PRIORITY lane that yields to keep
// the curtain smooth but COMMITS ONLY when the whole heavy tree has
// rendered, and under load that commit slid hundreds of milliseconds late
// (measured live in the harness with a 20-tags / 20-stamps / 20-images /
// 20-prompts character: the panel held a blank aside for ~400ms before the
// data popped in — exactly the report). The rAF stays (the shell + curtain
// still own the click's frame — the 1.4.1 law holds), but the build inside
// it is SYNCHRONOUS now: one honest frame of work the moment the shell has
// painted, and the content is simply THERE — no blank drawer, no pop. Card
// swaps while the panel lives keep their instant seat (the latch is the
// component's own first mount, never the character's).
// 1.4.4 — THE CURTAIN FLIES CLEAN ("when opening right pannel, the app
// freezes for a second midway as i see half of the right panel as empty
// then it snaps to the right panel open with elements, fix that"): the
// 1.4.3 sync build landed ONE rAF after the press — dead center in the
// 0.22s width flight, and its 100-280ms commit (measured live under the
// 20-tags card: 82+279+138ms long tasks) froze the curtain at HALF-WIDTH:
// the "half-empty panel" the eye caught, then the snap. The deferral is
// retired: the view builds in the CLICK'S OWN COMMIT now — the press pays
// one honest heavy frame (the press pulse is already animating under the
// finger, and the squish owns the dead time), and the curtain that starts
// on the very next frame glides to full width WITHOUT a single heavy task
// in its lane — no mid-flight freeze, no blank drawer, no pop. The shell's
// cheap first paint is kept for the panel's mount alone (the aside + clip
// paint while the commit's layout settles in the same frame).
// 1.4.5 — THE CLICK'S FRAME IS CHEAP AGAIN, THE BUILD RIDES THE TRANSITION
// LANE ("when right panel opens, its delayed, at this point sure keep it
// delayed, but first of all fix the lag issue coming from the right panel
// opening (it wasnt laggy before)" + "when right panel opens, it
// interrupts the squish/stretch animation of the card click, fix that"):
// the 1.4.4 sync-in-the-click law traded one freeze for another — the
// 100-280ms of render+layout landed IN THE PRESS'S OWN COMMIT, stalling
// the click's frame exactly where the eye is sharpest: the squish's first
// beats died under the block (the "interrupts the squish/stretch
// animation" report) and the whole app read as laggy at the touch. The
// boot speaks THREE beats now, none of them heavy in the wrong lane:
//   · THE CLICK'S COMMIT mounts ONLY the aside shell + the skeleton (a
//     handful of nodes) — the curtain starts on the very next frame, the
//     squish owns the compositor untouched, the cursor never stutters;
//   · ONE rAF LATER the heavy CharacterView build enters
//     startTransition — React renders it in SLICED, interruptible chunks
//     (the lane yields to input, rAF and paint between slices), so no
//     single long task ever owns the main thread while the curtain flies;
//   · the commit lands when the tree is ready — the DELAYED arrival the
//     owner has explicitly blessed ("at this point sure keep it delayed")
//     — and the skeleton's quiet paper (the character's own name + three
//     settling bars) keeps the drawer reading as OPENING, never as blank.
// Card SWAPS while the panel lives keep their instant seat (the latch is
// the boot's own first mount, never the character's).
// 1.4.8 — THE SKELETON LEAVES, THE DRAWER ARRIVES LOADED ("remove skeleton
// loading, when right detail panel opens it should already be loaded,
// instead of opening with a skeleton loading or causing lag" + "windows
// take a while to open, such as ... right panel, fix that"): the 1.4.5 boot
// gated the build behind a 150ms timer + a startTransition lane and painted
// the skeleton's paper while it waited — the drawer read as EMPTY-ish, then
// the content landed late; and since the 1.4.6 retained seat keeps the
// aside mounted after the first close, that whole ceremony only ever rode
// the FIRST open of a session (every open after it already had its tree).
// The gate is now ONE rAF and NOTHING MORE: the shell still owns the
// click's own frame (the curtain starts sweeping under the finger — and the
// squish is a compositor-owned flight since the 1.4.8 never-interrupted
// law, so it keeps breathing through whatever the next frame costs), and
// the content builds SYNCHRONOUSLY in the very next frame — no 150ms wait,
// no transition lane, no placeholder paper. The drawer arrives with its
// content already in it, mid-sweep; the skeleton's name + bars left with
// the request.
// 1.4.9 — THE LAST GATE LEAVES TOO ("the windows seem to handle the data
// badly, as in when i open detail windows/panels its delayed and takes a
// while, while also not being ready, or in card edit where it seems to do
// it from start, fix all of this , preload them or something"): even that
// one 16ms breath read as a beat of EMPTY drawer riding the curtain's
// first sweep — and the squish it used to protect is a COMPOSITOR-OWNED
// flight since the 1.4.8 never-interrupted law, safe through any commit
// the build could ever cost. The component is a PASS-THROUGH now: the
// click's own commit carries the shell AND the whole view, the drawer
// opens with its content already in it on the very first frame, and the
// retained seat (the aside never unmounting after the first close) still
// means only a session's first open ever pays the build at all.
function DeferredPanelBoot({ children }) {
  return children;
}

// 1.2.8 — THE LEDGER'S OWN SEAT ("the logs should stay after i close the
// app / restart it"): the status log's localStorage key. The ring buffer
// (last 50 lines) hydrates from here at boot and every push writes
// through — the top bar's verdicts survive restarts and app closes, so
// the Settings → LOGS tab reads the session's real history, not a blank
// page. A storage failure (private mode, wiped storage) degrades to the
// old in-memory behavior — the archive itself never depends on it.
const STATUS_LOG_KEY = 'gd:status-log';

// 1.5.4 — THE CREATION WINDOW'S MEMOIZED SEAT SHELL: every prop the window
// reads is compared by value or stable reference (the db's own arrays, the
// stable handlers App passes), so the app's chatter — status flips, search
// keystrokes, hover state — never diffs the ~850-node window while it sits
// parked. The three inline arrows the old call site spoke (the manager
// open, the close, the help toggle) arrive as useCallbacks instead.
const NewCardSeat = memo(function NewCardSeat(props) {
  return <NewCharacterModal {...props} />;
});

export default function App() {
  const api = window.api;

  const [db, setDb] = useState(null);
  // 1.0.4 — the boot now SPEAKS its phases (splash loading feedback):
  // Loading database -> Preparing workspace -> Ready. The splash paints
  // them under its progress sweep; the titlebar only ever sees the last.
  const [status, setStatus] = useState('Loading database');
  const [loaded, setLoaded] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const [view, setView] = useState({ mode: 'grid' });
  const [modal, setModal] = useState(null); // {type, ...payload}
  // 1.5.4 — THE CREATION WINDOW'S RETAINED SEAT ("the new card window is
  // still quite delayed, fix that"): the window used to pay its full
  // mount on EVERY open — the ~850-node tree, the first layout, the whole
  // build — between the click and the first frame of the entrance (and the
  // one-shot "fast reopen" was an illusion: reopening inside the exit
  // flight's ~130ms reused the dying instance; past it, every open was
  // cold again). The window now rides ONE instance for the whole session:
  // born hidden a beat after the app settles (or on the first open,
  // whichever comes first), never unmounting again. `live` is the open
  // state — the CSS flight owns the fade + rise both ways (Modal's flight
  // law) — and every open bumps `newCardSeq`, which resets the entire
  // draft in one pre-paint commit (NewCharacterModal's RESET law): each
  // open is born exactly as fresh as a cold mount, on a warm path.
  const [newCardSeatArmed, setNewCardSeatArmed] = useState(false);
  // 1.1.2 — THE TAG MANAGER'S OVERLAY SEAT ("when i press on the + to add a
  // new tag the tag manager will open (and it would overlay over the card
  // creation window, closing the tag manager window doesnt close the window
  // before it, and dont allow me to close the card creation window if i
  // have tag manager open)"): while the creation window is up, the manager
  // rides this SEPARATE flag (not the modal slot — opening it there would
  // REPLACE the creation window and its draft with it) and mounts AFTER it
  // in the tree, so it stacks above at the same z and shades it like a
  // window over a window. Its close only clears the flag; the creation
  // window's own accidental-close gestures are locked while the flag is up
  // (Modal's closeLocked, passed by NewCharacterModal). A tag minted above
  // lands in db.tags and the creation window re-renders with it pickable.
  const [tagManagerOver, setTagManagerOver] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const [showClosePrompt, setShowClosePrompt] = useState(false);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState('custom');
  const [selectedClassId, setSelectedClassId] = useState(ROOT_CLASS_ID);
  const [maximized, setMaximized] = useState(false);
  const [panelCharacterId, setPanelCharacterId] = useState(null);
  // 0.30.0 — the app-level RIGHT-CLICK MENU ("right clicking opens windows,
  // such as select all or paste or copy, some special ones like new class or
  // edit whats selected or delete"). The listener builds the item list from
  // whatever is under the cursor (a card, a class row, plain surface) and
  // this state paints GdContextMenu at the pointer.
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y, items }
  // Tag spotlight (0.9.0, v3): per-tag tri-state — 'include' tags are
  // REQUIRED on a card, 'exclude' tags DISQUALIFY it, neutral tags do
  // nothing. hideNonMatching is its own independent switch (grey out vs
  // remove the non-matching cards) — no tag state ever touches it. Never
  // touches the sort order either.
  // 0.15.0: `stamps` — the ordered STAMP spotlight (click a global template
  // in the popover): matching cards must carry every picked stamp, and the
  // picked stamps are promoted onto the visible stamp band while it lasts.
  const [spotlight, setSpotlight] = useState({ include: [], exclude: [], stamps: [], stampExclude: [], hideNonMatching: false });
  // 0.45.0 — the live filter state for the context-menu builder (the
  // document-level listener's closure must never go stale).
  const spotlightRef = useRef(spotlight);
  spotlightRef.current = spotlight;
  // The version the bottom output bar follows (lifted from CharacterView).
  const [activeVersion, setActiveVersion] = useState(null); // { charId, verId }
  // 1.1.1 — THE OUTPUT COVER'S OWN TRUTH + THE REMOTE RETRACT (see
  // OutputBar's comment): `outputExpandedRef` mirrors the cover's expanded
  // state up to App (a ref, not state — nothing re-renders for a ping), and
  // `retractRequest` is the rising nonce that tells whichever bar is mounted
  // to fold its cover NOW. closeViewToGrid() reads the one and raises the
  // other so a BACK while expanded plays the cover's contract flight BEFORE
  // the view itself closes — the fix for the frozen-exit vanish.
  const outputExpandedRef = useRef(false);
  const retractNonceRef = useRef(0);
  const [retractRequest, setRetractRequest] = useState(0);
  const retractTimerRef = useRef(0);
  // the stable mirror: OutputBar reports its cover's expanded truth, App
  // just parks it in the ref (no state — the world never re-renders for a
  // bookkeeping ping).
  const setOutputExpandedRef = useCallback((v) => {
    outputExpandedRef.current = !!v;
  }, []);
  const [histLen, setHistLen] = useState({ u: 0, r: 0 });
  // 0.24.0 — unsaved state as REACT STATE (the ref can't re-render the
  // titlebar's SAVE key): true the moment anything mutates, false again on
  // a successful save. The SAVE key greys out while false.
  const [unsaved, setUnsaved] = useState(false);

  const dbRef = useRef(null);
  const imagesPathRef = useRef('');
  const unsavedRef = useRef(false);
  const confirmRef = useRef(null);
  const stateRef = useRef({});
  const dragRef = useRef(null);
  const sortModeRef = useRef(sortMode);
  // 1.1.8 — THE EXPANDED GRID SEATS ("when right clicking on a card, add an
  // option to expand it, which will allow the card to take 2 rows instead
  // of one, while still remaining in the same aspect ratio … when right
  // clicking on it again there is the option to shrink it instead back to
  // default"): a Set of card ids sitting at double size in the masonry.
  // The ref mirror feeds the document-level contextmenu listener (it binds
  // once, so it can never read the state directly).
  // 1.1.9 — THE SEAT IS SAVED NOW ("expanding a card or retracting it
  // should be a savable thing and retain"): the Set hydrates from
  // db.settings.expandedCards once the db lands and every toggle writes
  // back through setSetting (same write/save machinery as any setting) —
  // the seats survive restarts. See the hydrate + persist effects beside
  // setSetting below.
  const [expandedCardIds, setExpandedCardIds] = useState(() => new Set());
  const expandedCardsRef = useRef(expandedCardIds);
  expandedCardsRef.current = expandedCardIds;
  const expandedHydratedRef = useRef(false);
  const toggleCardExpand = useCallback((id) => {
    if (!id) return;
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const lastPushRef = useRef({ key: null, ts: 0 });
  // 1.1.2 — the LIVE tag-id set (kept current by a tiny effect below): the
  // creation window's picked tags are validated against it at CREATE time —
  // a tag deleted while the manager floated above the window can never ride
  // a card that outlives it.
  const tagIdsSetRef = useRef(new Set());
  // 0.29.0 — the resizable panel columns (the edge handles write straight
  // to these nodes during a drag; the committed width lands in settings).
  const leftColRef = useRef(null);
  const panelColRef = useRef(null);
  // 1.0.4 — the right panel's fixed-width content wrapper (the scroll
  // surface): the resizer drives it live alongside the column so the
  // panel's content reflows THROUGHOUT the drag, not only after release.
  const panelContentRef = useRef(null);
  // 1.0.4 — RESIZE COMMITS DON'T REPLAY THE CURTAIN ("it would replay the
  // opening animation again"): framer-motion owns the panel's width
  // flight (0 -> W on open, W -> 0 on close, 0.22s easeOut). A resize
  // commit re-renders with a new `animate` target, and framer would fly
  // the width from its LAST KNOWN seat to the new one — a visible replay
  // of the opening animation for a change the user already dragged into
  // place with their own hand. While this flag is armed, the width change
  // lands INSTANTLY (duration 0); the flag resets one render later, so the
  // next genuine open/close flies the curtain exactly as before.
  const [panelSnap, setPanelSnap] = useState(false);
  useEffect(() => {
    if (panelSnap) setPanelSnap(false);
  }, [panelSnap]);
  // 1.5.4 — THE SEAT'S OWN CLOCKS (see newCardSeatArmed's note at the
  // state): ARM only while the app is settled (db landed, NO window of any
  // kind open — a seat mounting under an open window warms nothing and only
  // competes with it for the frame), a beat after the grid is on screen.
  // The first real open arms it too (a click inside the settle window must
  // never mount cold twice) — and once armed, the seat LIVES: closing parks
  // it, never unmounts it.
  // 1.5.8 — THE BEAT SHORTENS ("new card window still has some delay,
  // fix that"): 900ms -> 350ms. The old beat was sized to clear the whole
  // boot's heavy tail, but the window's cold build is ~a quarter second on
  // its own — a user who opens the creation window inside the old beat
  // paid that build INSIDE the click (the armed seat was the entire point
  // of the retained seat).
  // 1.6.0 — THE BEAT BECOMES A BREATHE ("some delay still exists when i try
  // to open the new card creation window"): a FIXED 350ms is a guess that
  // is simultaneously too long for a fast machine (the boot tail cleared at
  // 120ms — the rest of the wait served nothing) and too short for a slow
  // one (a click at 300ms still paid the cold build inside the click). The
  // arm now rides the browser's OWN definition of "the boot is done": a
  // requestIdleCallback with a 350ms ceiling — the seat mounts the first
  // idle frame after the db-load/grid-paint work drains, and NEVER later
  // than the old law's whole beat. The click-to-warm window shrinks to the
  // true minimum on every machine, and a first open still arms it outright
  // (the effect below).
  useEffect(() => {
    if (!db || modal) return undefined;
    let armed = false;
    const arm = () => {
      armed = true;
      setNewCardSeatArmed(true);
    };
    if (typeof requestIdleCallback === 'function') {
      const handle = requestIdleCallback(arm, { timeout: 350 });
      return () => {
        if (!armed && typeof cancelIdleCallback === 'function') cancelIdleCallback(handle);
      };
    }
    const t = setTimeout(arm, 200);
    return () => {
      if (!armed) clearTimeout(t);
    };
  }, [db, modal]);
  useEffect(() => {
    if (modal?.type === 'newCharacter') setNewCardSeatArmed(true);
  }, [modal?.type]);
  // 1.5.4 — THE OPEN COUNT (the seat's RESET key): a render-time mirror,
  // the app's own LIVE-MIRROR idiom — the flip to live and the bumped count
  // travel in the SAME commit, so NewCharacterModal's reset pass lands
  // before the window's first paint (no stale draft flash, ever). The mirror
  // lives beside the render it feeds; see the seat's render below.
  const creationOpen = modal?.type === 'newCharacter';
  const creationOpenRef = useRef(false);
  const creationSeqRef = useRef(0);
  if (creationOpen && !creationOpenRef.current) creationSeqRef.current += 1;
  creationOpenRef.current = creationOpen;
  // 0.31.0 — REASSIGNABLE SHORTCUTS: the live map from settings (sanitized
  // total + unique by createSafeDb). The keydown listener reads it through
  // this ref so it never re-binds mid-session; the SHORTCUTS editor and the
  // top buttons' tooltips read the same keys.
  const shortcutsRef = useRef(null);
  shortcutsRef.current = db?.settings?.shortcuts || DEFAULT_SHORTCUTS;
  dbRef.current = db;
  stateRef.current = { view, modal, panelCharacterId };
  sortModeRef.current = sortMode;

  // --------------------------------------------------------------------------
  // Status handling — transient statuses flash-reset back to the baseline
  // (Unsaved Changes* or Ready). GenStack v1.5.9 law.
  // 0.35.0 — EVERY transient verdict now ALSO fires a GLOBAL TOAST (the
  // gd-toast event → ToastHub's pill stack at the top of the screen,
  // above every window). The titlebar status text alone proved invisible
  // at exactly the moments feedback matters: it is 11px quiet chrome, and
  // since the 0.34.0 lockout it DIMS while any window is open — so "class
  // created" printed into a darkened bar the moment the creation window
  // closed over it. The optional second argument is the toast TONE:
  //   · 'ok'   (default) — the accent pill, the normal verdict
  //   · 'fail'           — the red pill (save failed, paste failed…)
  //   · 'quiet'          — titlebar ONLY, no pill (interim chatter like
  //                        "Duplicating…" that a verdict follows anyway)
  // Every action surface in the app already reports through this one
  // function (directly, or as the onStatus prop the views carry), so one
  // junction here lights the WHOLE catalogue up: class/card/tag/stamp
  // creation, deletes, renames, moves, covers, paste verdicts, output
  // copies, undo/redo — and, through saveDb below, saving + auto-saving.
  // 1.2.6 — THE READ OWNS THE CLOCK ("the noticification that scrolls to
  // the left should only end it after it reaches the end of the message
  // then move to the next or the save status etc.. since sometimes its too
  // fast to read it fully" + "as long as the user hovers over the
  // noticification it should also keep the top bar status as it until the
  // hover is done or pressed"): a transient verdict used to die at a FIXED
  // 2500ms — a covered status whose marquee runs 6-10s was cut mid-word,
  // the tail the user was reading replaced by the baseline. THREE laws:
  //   · THE FLIGHT SPEAKS THE HOLD — StatusText reports how long its
  //     marquee needs to REACH the message's end (the 88% travel mark plus
  //     the end dwell); the reset waits for the READ, never less than the
  //     classic 2500ms.
  //   · THE HOVER FREEZES THE LINE — a pointer resting on the status text
  //     pauses the countdown entirely (the reader is mid-sentence); the
  //     hover's end re-arms the full hold.
  //   · THE PRESS SKIPS — a click on the status text is a "read it": the
  //     verdict ends and the baseline returns at once.
  // --------------------------------------------------------------------------
  const transientTimerRef = useRef(null);
  const statusHoldRef = useRef(false); // the hover freeze
  const statusFlightMsRef = useRef(0); // the current message's read time
  // 1.2.7 — THE TOP BAR'S OWN LEDGER ("add a logs left section in settings,
  // opening it shows the logs that appear on the topbar (shows last 50
  // lines), allow to copy or select specific areas to copy"): every verdict
  // the status line ever speaks lands here too — the same message, the same
  // tone, a timestamp — capped at the last 50 lines. The Settings → LOGS
  // tab reads this array; nothing else ever writes it.
  // 1.2.8 — THE LEDGER PERSISTS ("the logs should stay after i close the
  // app / restart it"): the buffer hydrates from localStorage at boot (a
  // lazy initializer — one read, before the first paint) and every push
  // writes through, so the last 50 lines survive restarts and app closes.
  const [statusLog, setStatusLog] = useState(() => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STATUS_LOG_KEY) : null;
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((e) => e && Number.isFinite(e.ts) && typeof e.msg === 'string')
        // 1.9.11 — THE LEDGER'S OWN DIAL (see LOG_LIMIT_RANGE): the boot's
        // restore bounds itself at the ladder's SAFE MAX, not the old flat
        // 50 — an owner whose dial reads 200 must not lose 150 lines every
        // restart. The LIVE cap (db.settings.logLimit) lands a moment later
        // with the database, and the trim effect below cuts to it then.
        .slice(-LOG_LIMIT_RANGE.max)
        .map((e) => ({ ts: e.ts, msg: e.msg, kind: e.kind === 'fail' ? 'fail' : 'ok' }));
    } catch {
      return [];
    }
  });
  // 1.9.11 — THE LEDGER'S OWN DIAL ("add an option to control how much logs
  // are saved (default is 50 like usual) in the logs section in settings
  // window, right below the logs container, the cell takes a numeric
  // value"): the cap used to be a flat 50 hard-coded at three seats (the
  // boot restore, every push, the Settings footer's word). It is ONE law
  // now, read LIVE from db.settings.logLimit (sanitized through
  // LOG_LIMIT_RANGE in createSafeDb — 50 the eternal default, 1..999 the
  // honest ladder):
  //   · logLimitRef — the live cap, mirrored from the db for the stable
  //     push callback (the push must never re-mount its identity when the
  //     dial turns — every setStatusLog listener would re-run for
  //     nothing);
  //   · logLimitKnownRef — false until the database lands: the boot's own
  //     pushes ("Loading database", "Preparing workspace", "Ready") fire
  //     BEFORE db exists, and capping those at the default 50 would cut a
  //     200-line restored ledger to 50 on every launch — so until the dial
  //     is known, pushes bound themselves at the SAFE MAX alone and the
  //     trim effect does the honest cut once the db speaks;
  //   · the trim effect — whenever the live cap changes (the db landing,
  //   or the dial turning mid-session) the ledger trims to it and writes
  //   through, so a lower dial shortens the ledger the very frame it
  //   lands and a higher one simply lets the lines accumulate.
  const logLimitRef = useRef(LOG_LIMIT_RANGE.default);
  const logLimitKnownRef = useRef(false);
  const liveLogLimit = db?.settings ? clampLogLimit(db.settings.logLimit ?? LOG_LIMIT_RANGE.default) : null;
  logLimitRef.current = liveLogLimit ?? logLimitRef.current;
  if (db?.settings) logLimitKnownRef.current = true;
  useEffect(() => {
    // no db, no dial — the boot window keeps the safe-max bound (the
    // first trim happens when the database lands and the effect re-runs)
    if (liveLogLimit == null) return undefined;
    const cap = liveLogLimit;
    setStatusLog((prev) => {
      if (prev.length <= cap) return prev;
      const trimmed = prev.slice(prev.length - cap);
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(STATUS_LOG_KEY, JSON.stringify(trimmed));
      } catch {
        /* storage full or unavailable — the in-memory ledger stands */
      }
      return trimmed;
    });
    return undefined;
  }, [liveLogLimit]);
  const pushStatusLog = useCallback((message, kind = 'ok') => {
    const msg = String(message ?? '');
    if (!msg) return;
    setStatusLog((prev) => {
      const next = [...prev, { ts: Date.now(), msg, kind }];
      // the known dial owns the cap; the boot window (dial not yet known)
      // bounds itself at the ladder's safe max so no restored history is
      // ever cut before the database lands
      const cap = logLimitKnownRef.current ? logLimitRef.current : LOG_LIMIT_RANGE.max;
      const capped = next.length > cap ? next.slice(next.length - cap) : next;
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(STATUS_LOG_KEY, JSON.stringify(capped));
      } catch {
        /* storage full or unavailable — the in-memory ledger stands */
      }
      return capped;
    });
  }, []);
  const armStatusReset = useCallback((flightMs = null) => {
    if (Number.isFinite(flightMs) && flightMs > 0) statusFlightMsRef.current = flightMs;
    if (transientTimerRef.current) {
      clearTimeout(transientTimerRef.current);
      transientTimerRef.current = null;
    }
    // the hover owns the line: the countdown re-arms when the hover ends
    if (statusHoldRef.current) return;
    const hold = Math.max(TRANSIENT_MS, statusFlightMsRef.current || 0);
    transientTimerRef.current = setTimeout(() => {
      transientTimerRef.current = null;
      setStatus(unsavedRef.current ? 'Unsaved Changes*' : 'Ready');
    }, hold);
  }, []);
  const setStatusTransient = useCallback((message, kind = 'ok') => {
    setStatus(message);
    pushStatusLog(message, kind);
    statusFlightMsRef.current = 0; // the new message's flight reports its own
    if (kind !== 'quiet') gdToast(message, kind);
    armStatusReset();
  }, [armStatusReset, pushStatusLog]);
  // the hover freeze / the press skip (wired through Titlebar → StatusText)
  const onStatusHold = useCallback(
    (holding) => {
      if (statusHoldRef.current === holding) return;
      statusHoldRef.current = holding;
      if (holding) {
        if (transientTimerRef.current) {
          clearTimeout(transientTimerRef.current);
          transientTimerRef.current = null;
        }
      } else {
        armStatusReset(); // the hover's end re-arms the full hold
      }
    },
    [armStatusReset]
  );
  const onStatusSkip = useCallback(() => {
    if (transientTimerRef.current) {
      clearTimeout(transientTimerRef.current);
      transientTimerRef.current = null;
    }
    setStatus(unsavedRef.current ? 'Unsaved Changes*' : 'Ready');
  }, []);
  const onStatusFlight = useCallback(
    (flightMs) => {
      // only the CURRENT message's flight may extend its own hold (a late
      // report for a replaced message re-arms for the message on screen)
      armStatusReset(flightMs);
    },
    [armStatusReset]
  );

  // --------------------------------------------------------------------------
  // DB + unsaved tracking + UNDO/REDO — EVERY mutation goes through
  // mutateDb(updater, coalesceKey). Typing bursts that share a coalesceKey
  // collapse into one history entry. Never watch db for dirtiness.
  // --------------------------------------------------------------------------
  const markUnsaved = useCallback(() => {
    unsavedRef.current = true;
    setUnsaved(true);
    setStatus('Unsaved Changes*');
    api?.sendUnsavedState(true);
  }, [api]);

  const mutateDb = useCallback(
    (updater, coalesceKey = null) => {
      const prev = dbRef.current;
      if (prev == null) return;
      const now = Date.now();
      const lp = lastPushRef.current;
      const coalesced = coalesceKey && lp.key === coalesceKey && now - lp.ts < COALESCE_MS;
      if (!coalesced) {
        undoStackRef.current.push(structuredClone(prev));
        if (undoStackRef.current.length > HISTORY_LIMIT) undoStackRef.current.shift();
        lastPushRef.current = { key: coalesceKey, ts: now };
      } else {
        lp.ts = now;
      }
      redoStackRef.current = [];
      const next = typeof updater === 'function' ? updater(prev) : updater;
      dbRef.current = next;
      setDb(next);
      setHistLen({ u: undoStackRef.current.length, r: 0 });
      markUnsaved();
      // 1.7.5 — THE DEATH ROW SWEEPS WITH EVERY MUTATION (see
      // utils/imageDeaths.js — the "undo restores a broken image" cure):
      // the stacks just moved, so the set of files no history can
      // resurrect may have grown — cheap when the row is empty.
      sweepImageDeaths(api);
    },
    [markUnsaved, api]
  );

  const undo = useCallback(() => {
    const stack = undoStackRef.current;
    if (!stack.length) return;
    const prev = stack.pop();
    redoStackRef.current.push(structuredClone(dbRef.current));
    dbRef.current = prev;
    setDb(prev);
    lastPushRef.current = { key: null, ts: 0 };
    setHistLen({ u: undoStackRef.current.length, r: redoStackRef.current.length });
    markUnsaved();
    setStatusTransient('Undo');
    // 1.7.5 — the death row sweeps after an UNDO too: a restored record
    // keeps its file alive by definition, and the popped stack may have
    // been the last home of an older death.
    sweepImageDeaths(api);
  }, [markUnsaved, setStatusTransient, api]);

  const redo = useCallback(() => {
    const stack = redoStackRef.current;
    if (!stack.length) return;
    const next = stack.pop();
    undoStackRef.current.push(structuredClone(dbRef.current));
    dbRef.current = next;
    setDb(next);
    lastPushRef.current = { key: null, ts: 0 };
    setHistLen({ u: undoStackRef.current.length, r: redoStackRef.current.length });
    markUnsaved();
    setStatusTransient('Redo');
    // 1.7.5 — and after a REDO (the stacks moved both directions here).
    sweepImageDeaths(api);
  }, [markUnsaved, setStatusTransient, api]);

  // 1.7.5 — THE DEATH ROW'S ALIVENESS PROBE (see utils/imageDeaths.js —
  // the "undo restores a broken image" cure): one registration per App
  // instance, the app's whole life. The sweep asks "can ANY history
  // resurrect this file?" and this probe walks every db the stacks hold —
  // the live db first, then the whole undo stack, then the redo stack,
  // exiting at the first reference it meets.
  const imageProbeOnceRef = useRef(false);
  if (!imageProbeOnceRef.current) {
    imageProbeOnceRef.current = true;
    probeImageAliveness((file) => {
      const inDb = (db) => {
        if (!db) return false;
        for (const c of db.characters || []) {
          for (const v of c?.versions || []) {
            for (const img of v?.images || []) {
              if (img?.file === file) return true;
            }
          }
        }
        return false;
      };
      if (inDb(dbRef.current)) return true;
      for (const snap of undoStackRef.current) if (inDb(snap)) return true;
      for (const snap of redoStackRef.current) if (inDb(snap)) return true;
      return false;
    });
  }

  // 0.35.0 — saveDb learns WHO is calling: a manual save (the titlebar's
  // SAVE key, Ctrl+S) toasts "Saved ✓", the AUTOSAVE cycle toasts
  // "Auto-saved ✓" ("make it so its feedback on others like … saving or
  // auto saving etc") — the two must never read the same, or a silent
  // background write looks like the user's own press. The argument is
  // guarded with `=== true` on purpose: the titlebar's onSave hands the
  // CLICK EVENT straight through (onClick={onSave}), and a truthy event
  // must not masquerade as the auto flag.
  const closeSettingsWindow = useCallback(() => setModal(null), []);

  const saveDb = useCallback(
    async (mode) => {
      const auto = mode === true;
      const current = dbRef.current;
      if (!current) return;
      setStatus('Saving…');
      try {
        const res = await api.saveDB(current);
        if (res && res.ok === false) throw new Error(res.error);
        unsavedRef.current = false;
        setUnsaved(false);
        api.sendUnsavedState(false);
        setStatusTransient(auto ? 'Auto-saved ✓' : 'Saved ✓');
      } catch {
        setStatusTransient('Save failed', 'fail');
      }
    },
    [api, setStatusTransient]
  );

  // --------------------------------------------------------------------------
  // Initial load — behind the splash, minimum 2500ms total, then 500ms fade.
  // --------------------------------------------------------------------------
  // 1.5.5 — THE BOOT'S OWN LEDGER (the compatibility report): the load now
  // carries a VERDICT from the main process's salvage ladder (dbio.js —
  // 'ok' / 'repaired' / 'tmp' / 'backup' / 'corrupt' / 'missing' — and,
  // 1.8.9, 'migrated', the ONE-time verdict of the import door) plus the
  // version stamp of whichever file answered. The boot parks the whole
  // story here and the [loaded] flush below speaks it — the user reads
  // what happened to their archive in verdicts, never in a silent default
  // library. dbLoadInfoRef is write-once (the boot's only load).
  const dbLoadInfoRef = useRef({ status: 'ok', fromAppVersion: '', recoveredFrom: '', corruptSetAside: '' });
  // 1.5.5 — THE BRIDGE GUARD: window.api exists only when the preload ran
  // (contextIsolation on). Before this seat, a failed preload threw inside
  // the boot's own try/catch — which read as "fresh start" and painted a
  // DEFAULT library over a machine that may own a full archive. The guard
  // renders a hard error screen instead (the render-side branch below);
  // the effects all no-op while it is down, so NOTHING writes to disk.
  const bridgeDown = !api;
  useEffect(() => {
    let cancelled = false;
    const t0 = Date.now();
    if (bridgeDown) return undefined; // no bridge, no boot, no default library
    // 1.2.7 — the boot's own phases ride the ledger too (see pushStatusLog):
    // the LOGS tab can read the whole boot story, not just its verdicts.
    pushStatusLog('Loading database', 'quiet');
    (async () => {
      let rawDb = null;
      let imagesPath = '';
      try {
        const res = await api.loadDB();
        rawDb = res?.db ?? null;
        imagesPath = res?.imagesPath || '';
        // 1.5.5 — the verdict fields are additive (an older main bundle
        // never spoke them): a db with no status reads 'ok' (or 'missing'
        // when nothing loaded) so the flush never mis-speaks.
        dbLoadInfoRef.current = {
          status:
            typeof res?.status === 'string' &&
            ['ok', 'repaired', 'tmp', 'backup', 'corrupt', 'missing', 'migrated'].includes(res.status)
              ? res.status
              : rawDb
                ? 'ok'
                : 'missing',
          fromAppVersion: typeof res?.fromAppVersion === 'string' ? res.fromAppVersion.slice(0, 24) : '',
          recoveredFrom: typeof res?.recoveredFrom === 'string' ? res.recoveredFrom.slice(0, 80) : '',
          corruptSetAside: typeof res?.corruptSetAside === 'string' ? res.corruptSetAside.slice(0, 80) : '',
        };
      } catch {
        /* fresh start */
      }
      imagesPathRef.current = imagesPath;
      // 1.0.4 — the second phase lands while the safe db is built and the
      // first paint of the workspace happens behind the cover.
      if (!cancelled) {
        setStatus('Preparing workspace');
        pushStatusLog('Preparing workspace', 'quiet');
      }
      const safe = createSafeDb(rawDb);
      if (cancelled) return;
      setDb(safe);
      setSortMode(safe.settings.defaultSortMode || 'custom');
      const wait = Math.max(0, SPLASH_MIN_MS - (Date.now() - t0));
      setTimeout(() => {
        if (cancelled) return;
        setStatus('Ready');
        pushStatusLog('Ready', 'quiet');
        setLoaded(true);
        setTimeout(() => {
          if (!cancelled) setSplashVisible(false);
        }, 500);
      }, wait);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  // --------------------------------------------------------------------------
  // 1.2.6 — THE SPLASH'S REEL POOL ("add a film reel scroll on the left and
  // right empty spaces of the splash screen … the cards must have a
  // thumbnail/top image to be included, cards without a thumbnail dont
  // count"): every character whose preview version carries a real image,
  // resolved to the SMALLEST tier it owns (prev → thumb → file — the splash
  // wants fast decodes while the workspace still warms behind it, never
  // quality). Cards with no cover image never enter the pool; the Splash
  // pads whatever the pool lacks with its own pixel-art leader frames (see
  // Splash.jsx). The pool recomputes the moment the db lands (which is the
  // same beat imagesPathRef takes its value — the load effect writes the
  // ref before setDb, so the memo never reads a stale base).
  // --------------------------------------------------------------------------
  const reelPool = useMemo(() => {
    // null = the pool is not yet KNOWN (the db has not landed); [] = the db
    // landed and owns no cover cards — the Splash mounts its all-leader
    // reels for that case (the fake-fill law), so the two must never blur.
    if (!db) return null;
    const base = imagesPathRef.current;
    const out = [];
    for (const ch of db.characters || []) {
      const pv = getPreviewVersion(ch);
      const img = pv?.images?.[0];
      const src = img?.prev || img?.thumb || img?.file;
      if (!src) continue;
      const url = buildImageUrl(base, src);
      if (url) out.push(url);
    }
    return out;
    // imagesPathRef is a ref (the load effect writes it before setDb — the
    // db change is the only beat that can move the pool's inputs).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  // --------------------------------------------------------------------------
  // 1.1.4 — THE UPDATE WINDOW ("create an update window when the app updates
  // which says that the app got updated from version x to x, pops up after an
  // update"). The boot compares the LAST-RUN seat (localStorage) with the
  // version this build actually runs:
  //   · a remembered DIFFERENT version -> the window speaks the crossing
  //     (v{from} -> v{to}) once, right after the splash lifts;
  //   · the same version (a plain relaunch) -> nothing, ever;
  //   · no memory at all (first install) -> the seat is written silently —
  //     there is no "from" to celebrate on day one.
  // Closing the window (CONTINUE / ✕ / Escape / backdrop) seals the seat to
  // the running version, so one crossing can never nag twice. The check
  // waits for `loaded` so the window never fights the splash for the stage,
  // and a localStorage failure (private mode, wiped storage) degrades to a
  // silent boot — the archive itself never depends on it.
  // --------------------------------------------------------------------------
  const [updateNotice, setUpdateNotice] = useState(null); // { from, to }
  const sealUpdateNotice = useCallback(() => {
    try {
      localStorage.setItem(LAST_RUN_KEY, APP.version);
    } catch {
      /* best-effort — a silent boot is always allowed */
    }
    setUpdateNotice(null);
  }, []);
  // 1.5.5 — THE LEGAL GATE ("add terms of service … make it so if the user
  // didnt have them and the app launched, after the update, do show that
  // terms of service and data privacy etc has been updated, allowing the
  // user to view them by clicking on them, then with a acknowledge button,
  // after acknowledgement it will save that the user has accepted terms of
  // service, if the app opens again it will not need to do so again, UNLESS
  // the terms of service version updates (separate to the normal versions),
  // if the user decides to decline, then close the app"): the gate mounts
  // once the workspace is up (after the splash) whenever the archive's
  // acceptance record does not match the running TOS_VERSION — a fresh
  // install, every pre-1.5.5 database (the seat simply did not exist), and
  // any future terms bump. Accepting writes the record through the ordinary
  // settings machinery AND saves immediately (an instant close must never
  // un-accept); declining closes the app without saving (the next launch
  // asks again — the user's own law). While the gate is up it owns the
  // stage: the update window waits below it.
  const [legalGate, setLegalGate] = useState(false);
  useEffect(() => {
    if (!loaded || !db) return;
    const acc = db?.settings?.tosAcceptance;
    if (!acc || acc.version !== TOS_VERSION) setLegalGate(true);
    // else: an accepted, matching record — nothing to ask, ever
  }, [loaded, db]);
  // (acceptLegal / declineLegal live with setSetting below — they ride
  // the settings machinery, which is declared later in the file.)
  useEffect(() => {
    if (!loaded) return;
    let last = null;
    try {
      last = localStorage.getItem(LAST_RUN_KEY);
    } catch {
      last = null;
    }
    // 1.5.5 — the gate speaks FIRST: while the terms window owns the
    // stage, the update window stays unmounted (it would otherwise sit
    // beneath the gate and answer the Escape the gate should own). The
    // moment the gate resolves, this effect re-runs and the crossing
    // celebrates — or, if the user declined, the app is closing anyway.
    if (legalGate) return;
    if (last && last !== APP.version) {
      setUpdateNotice({ from: last, to: APP.version });
    } else {
      // remember the running version for the NEXT boot's comparison
      try {
        localStorage.setItem(LAST_RUN_KEY, APP.version);
      } catch {
        /* best-effort */
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, legalGate]);
  // --------------------------------------------------------------------------
  // 1.5.5 — THE BOOT'S OWN VERDICTS: the load's story (parked in
  // dbLoadInfoRef by the boot effect) is spoken the moment the workspace
  // is up — recovery notices the user can act on, the corrupt-file
  // warning with the set-aside name, and the NEWER-ARCHIVE warning (a
  // database stamped by a newer app version landed in an older app:
  // fields it doesn't know fall away on save, so the user hears it BEFORE
  // they ever save over it — the reverse of the compatibility promise).
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!loaded) return;
    const info = dbLoadInfoRef.current;
    if (info.status === 'migrated') {
      // 1.9.1 — THE TRANSLATION DOOR'S OWN VERDICT: the library was
      // carried into the NoSQL document store this boot (a legacy JSON
      // archive folded in once — or the SQLite house translated whole,
      // read once and never touched again; one word for both doors,
      // exactly as 1.8.9 spoke its own two). The old file stays on disk
      // as the snapshot it already was; the user hears the whole story
      // once, at the boot.
      setStatusTransient(
        info.corruptSetAside
          ? `Library imported into the NoSQL document store — the previous file was unreadable, set aside as ${info.corruptSetAside}`
          : 'Library translated into the NoSQL document store — the old database file stays on disk, untouched, as your backup',
        'info'
      );
    } else if (info.status === 'repaired') {
      setStatusTransient('Database repaired: minor file damage was recovered', 'info');
    } else if (info.status === 'tmp') {
      setStatusTransient('Database recovered from the last save\u2019s temporary file', 'info');
    } else if (info.status === 'backup') {
      setStatusTransient(`Database recovered from backup (${info.recoveredFrom || 'newest readable'})`, 'info');
    } else if (info.status === 'corrupt') {
      setStatusTransient(
        info.corruptSetAside
          ? `Database file was unreadable — set aside as ${info.corruptSetAside}; check gendex_backups for older saves`
          : 'Database file was unreadable — nothing was overwritten; check gendex_backups for older saves',
        'fail'
      );
    }
    if (info.fromAppVersion && cmpVersions(info.fromAppVersion, APP.version) > 0) {
      setStatusTransient(
        `This library was last saved by v${info.fromAppVersion} — newer than this app (v${APP.version}). Back it up before saving.`,
        'fail'
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // --------------------------------------------------------------------------
  // Theme + per-surface textures + button shape
  // --------------------------------------------------------------------------
  // `textures` is PER SURFACE (toolbar / tree / viewer / panel — the
  // workspace surface is gone). 0.19.0: the living background is REMOVED —
  // the workspace is always still; the viewer's toolbar row and the
  // character header wear their parent surface's pattern directly (no more
  // phase-shifted tinted strip). `buttonStyle` ('theme' | 'square' |
  // 'round') drives the button corner language. 1.1.8: `toolbarGradient`
  // (TOOLBAR FINISH) is RETIRED ("remove top bar gradient option") — the
  // bars wear their plain surface + pattern on every theme now.
  // 0.33.0 — THE DEPS LAW ("fix also the lag when the background texture
  // reapplies after the panel closes etc.."): the effect used to read `db`
  // in its dependency list, so EVERY database write (every coalesced
  // keystroke, every undo, every panel toggle) rebuilt all four surface
  // tiles and rewrote the CSS vars — each rebuild re-rolled the Math.random
  // party patterns into a NEW data URI, and every surface repainted behind
  // it. The effect now watches ONLY the fields it actually reads; together
  // with the tile cache in utils/textures.js, a settings flip that leaves
  // the theme's colors alone re-sets the IDENTICAL URIs and paints nothing.
  const themeId = db?.settings?.theme;
  const themeColors = db?.settings?.colors;
  const themeTextures = db?.settings?.textures;
  const themeButtonStyle = db?.settings?.buttonStyle;
  // 0.42.0 — the BODY typeface (Settings → Look → FONT) rides the same
  // theme effect: one settings patch, one repaint of every surface's text.
  const themeUiFont = db?.settings?.uiFont;
  // 1.6.3 — THE CARDS' OWN CORNERS ride the theme lane too (the dial
  // rewrites --gd-shape-radius through the same cheap pass the shape style
  // speaks — see theme.js's cardShapeId law).
  const themeCardCorners = db?.settings?.cardCorners;
  useEffect(() => {
    if (!db?.settings) return;
    // 0.48.0 — THE IMPORTED FONT IS RETIRED ("remove the custom font option"):
    // nothing registers a stored face anymore — this boot pass just sweeps
    // the legacy localStorage keys the Look tab's IMPORT key used to write,
    // then writes the theme as ever. An old database holding uiFont
    // 'custom' already sanitized to mono at load (createSafeDb).
    clearLegacyCustomFontStorage();
    // 1.1.1 — THE LIVE WRITER ("fix the lag coming from the color picker
    // when i change color values in the settings"): every drag step of a
    // theme color used to run the FULL apply — texture tiles rebuilt for
    // each intermediate hue (the tile cache keys on colors, so every step
    // was a MISS: a fresh SVG scatter string, a fresh data-URI decode, four
    // surface repaints) plus the snapshot write, on top of the React pass.
    // The LIVE lane splits the work: the cheap tokens (CSS vars, radii,
    // fonts, dataset — microseconds) land THIS frame so the preview stays
    // honest, while the heavy lane (textures + snapshot) rides a short
    // trailing debounce inside theme.js — one rebuild per pause, never per
    // pixel. Boot and restore keep the synchronous setThemeOnDocument.
    setThemeOnDocumentLive(themeId, themeColors, themeTextures, themeButtonStyle || 'theme', themeUiFont || 'mono', themeCardCorners || 'theme');
     
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeId, themeColors, themeTextures, themeButtonStyle, themeUiFont, themeCardCorners]);

  // --------------------------------------------------------------------------
  // 0.25.0 — CRASH RECOVERY SNAPSHOT: every committed db state is mirrored
  // onto the window object. The ErrorBoundary above <App/> cannot reach
  // React state, but it CAN read this — so its SAVE & RELOAD key writes the
  // last good database to disk even after a render crash. Cheap by design:
  // a reference assignment, no serialization, nothing observes it.
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (db) window.__GENDX_DB = db;
  }, [db]);

  // --------------------------------------------------------------------------
  // 0.25.0 — AUTOSAVE (settings → Behavior → DATA & RECOVERY). A single
  // interval at the chosen cadence; it only writes when the unsaved flag is
  // up, so a clean db is never touched and manual saves reset the cycle.
  // saveDb flips the flag down itself on success.
  // --------------------------------------------------------------------------
  const saveDbRef = useRef(null);
  saveDbRef.current = saveDb;
  // 1.2.1 — THE SETTINGS SEAT ("the auto save should not trigger while in
  // settings menu"): the settings window is where you sit READING and
  // tweaking — every toggle lands live in the db and raises the unsaved
  // flag, so the cycle kept firing mid-visit ("Auto-saved ✓" popping over
  // the menu you were still inside). The cycle holds its tongue while the
  // window is up: a tick that lands inside the visit is SKIPPED (not
  // deferred — the cadence keeps its own time), and the first tick after
  // the window closes writes if there is anything to write. The ref is
  // assigned in the render pass (the expandedCardsRef pattern) so the
  // interval — bound once per cadence — always reads the live truth.
  const settingsOpenRef = useRef(false);
  settingsOpenRef.current = modal?.type === 'settings';
  // 1.8.6 — THE WHEEL THAT OUTLIVES THE FREEZE ("when pressing on buttons
  // that load things (such as ... opening settings ...) ... or in settings
  // button it would replace the icon until the window pops up ... ensure
  // the wheel works even when app is frozen since it does freeze when
  // these actions occur"): the gear's press marks the key pending (the
  // Titlebar swaps its glyph for the wheel and darkens it as pressed) and
  // hands the window's mount through deferToPaint — the wheel paints its
  // compositor layer FIRST, the settings window builds inside the freeze
  // (the wheel still turning, the compositor's own seat), and the pending
  // mark clears in the SAME commit that mounts the window: the gear
  // answers again exactly when the window has popped up. An appear and a
  // disappear, no out flight (the report reserves that for the image
  // previews); the keyboard and context-menu roads keep their instant
  // seats — they carry no key to speak for.
  const [settingsLoading, setSettingsLoading] = useState(false);
  const openSettingsWindow = useCallback(() => {
    if (settingsOpenRef.current || settingsLoading) return;
    setSettingsLoading(true);
    deferToPaint(() => {
      setModal({ type: 'settings', snapshot: structuredClone(dbRef.current?.settings || {}) });
      setSettingsLoading(false);
    });
  }, [settingsLoading]);
  // 1.8.6 — THE CARD VIEWER'S OWN VEIL ("or in new card in the card viewer
  // the card will have the loading wheel animation as it loads"): while a
  // new card builds, the veil (a slight darkening + the compositor wheel
  // dead center) covers whichever viewer the card will open in — the
  // right detail panel or the full-window cover. The CREATE press closes
  // the creation window FIRST (its job is done the moment the hand commits
  // — the veil takes the story from there), the veil paints, and only then
  // does the creation run: through the whole freeze the wheel turns over
  // the viewer, and the veil answers only to the load — it clears one
  // painted breath after the new view has landed (the nested deferToPaint
  // below), never outliving the card it was born for.
  const [newCardPending, setNewCardPending] = useState(false);
  useEffect(() => {
    const minutes = Number(db?.settings?.autosaveMinutes) || 0;
    if (!minutes) return undefined;
    const id = setInterval(() => {
      // 1.2.1 — the settings seat: ticks inside an open settings window
      // never fire the write (see settingsOpenRef above).
      if (settingsOpenRef.current) return;
      // 1.7.6 — THE DARK SAVES NOTHING ("it still processes … in the
      // background, fix the issue where it processes unnecessarily"):
      // a hidden window owes the CPU silence — a db write there commits
      // React trees that mount fresh finish clocks nobody held, and the
      // user cannot read the toast anyway. The moment the window shows,
      // the very next tick speaks if there is anything unsaved to say.
      if (typeof document !== 'undefined' && document.hidden) return;
      // 0.35.0 — the cycle hands saveDb its AUTO flag, so the verdict
      // toast says "Auto-saved ✓", never a plain "Saved ✓".
      if (unsavedRef.current) saveDbRef.current?.(true);
    }, minutes * 60 * 1000);
    return () => clearInterval(id);
  }, [db?.settings?.autosaveMinutes]);

  // 1.1.2 — the live tag-id set (see tagIdsSetRef above).
  useEffect(() => {
    tagIdsSetRef.current = new Set((db?.tags || []).map((t) => t.id));
  }, [db?.tags]);

  // 0.25.0 — REDUCED UI MOTION: the html class kills CSS animation/
  // transition durations (index.css); the MotionConfig below carries the
  // same order to framer-motion's entrances, which the CSS cannot reach.
  // 0.34.0 — AND THE FADES TOO ("if animations are disabled, fix the issue
  // where they dissapear and reappaear again (as in elements like moving
  // cards and such)"): framer's reducedMotion only makes TRANSFORM and
  // layout values instant — opacity still animates, so every enter/exit
  // swap (class switches, panel toggles, window opens, card re-lays)
  // still FADED out and in: elements visibly "disappeared and reappeared".
  // MotionConfig's skipAnimations made EVERY value jump instantly (see
  // motion-dom's animateMotionValue — element.shouldSkipAnimations short-
  // circuits the whole keyframe run), so with the switch on, nothing
  // faded anywhere: cards teleported, windows popped, full stop.
  // 1.4.9 — THE STILL LEARNS ITS SCOPE ("reduced motion mode should only
  // effect the finishes animation and the right panel opening and card
  // moving animation"): the 0.25.0 kill switch was TOTAL — the jelly
  // squish, the hover lifts, the folds, every transition the app speaks
  // snapped to 0.01ms the moment the switch went on, and skipAnimations
  // did the same to every framer flight (windows popped, toasts jumped).
  // The CSS kill switch is RETIRED (index.css now arms targeted stills:
  // the finish family and the cards' own glide/sort moves — and nothing
  // else), and skipAnimations leaves with it — framer keeps its
  // reducedMotion="always" alone, which speaks EXACTLY the two framer
  // flights the scope names: the right panel's width curtain and the
  // cards' own layout moves (masonry springs, sort glides) land INSTANT,
  // while every opacity value (window entrances, toasts, fades) keeps its
  // breath. The jelly, the hovers and the folds were never framer's to
  // still — they run full voice under the switch now, exactly as asked.
  useEffect(() => {
    if (!db) return;
    document.documentElement.classList.toggle('gd-reduced-motion', !!db?.settings?.reduceMotion);
  }, [db?.settings?.reduceMotion]);
  // 1.5.7 — THE LIVING FINISHES SWITCH (Settings → Performance, the new
  // seat beside UI MOTION; renamed EXPERIMENTAL FINISHES in 1.5.8).
  // 1.5.9 — OFF RETIRES THE COATS FROM PAINT ("nuri finish still visible
  // when experimental is off, the stripes and the stars specifically"):
  // the 1.5.7 law only paused the family's clocks, so a saved coat kept
  // painting its static material while the owner read the switch as "the
  // feature does not exist". Off now stamps .gd-finishes-still on the root
  // and every finish coat in the app is display: none — no body, no marks,
  // no gloss (see the retirement law in index.css; the rim law follows it
  // off the stage). The saved cardFinish values are never rewritten —
  // the moment the switch returns, every coat paints again at full voice.
  // The switch defaults ON and every pre-1.5.7 database sanitizes to ON,
  // so nothing changes for anyone until they ask for the retirement
  // themselves.
  useEffect(() => {
    if (!db) return;
    document.documentElement.classList.toggle('gd-finishes-still', db?.settings?.livingFinishes === false);
  }, [db?.settings?.livingFinishes]);

  // 1.5.8 — THE BOOT-TIME STAGE PREWARM ("when opening a card for the
  // first time, the image seems to start small and the container is small
  // then it snaps big in the detail panel, fix that so it just starts big
  // right away, i dont want inconsistant shifting container sizes"): the
  // stage's own aspect cache only fills when a stage MOUNTS, so every
  // card's FIRST open sized its container on the 16:10 fallback and then
  // snapped to the true aspect when the thumb's measurement landed. Here
  // the app walks the WHOLE library's thumbnails in idle chunks after the
  // database lands (24 decodes per idle beat — a whisper beside the boot,
  // and never inside a frame the user is dragging something through), so
  // the first open of any card already finds its aspect in the cache and
  // the container is born the size it stays. The walk re-arms whenever the
  // library's characters array changes identity, but it only ever pays for
  // files it has never measured (the cache skips the known), so re-runs
  // are free and new imports are covered the same idle breath they land.
  // 1.5.9 — THE WALK LEARNS WHERE THE IMAGES LIVE ("same issue with the
  // image in detail panel, its like it appears small at first then it
  // fits, it should just fit right away and not wait"): the 1.5.8 walk
  // read c.images — a TOP-LEVEL array no character has ever carried (the
  // images live on the card's VERSIONS: v.images, exactly what the detail
  // panel's stage renders) — so the walk queued NOTHING, the cache stayed
  // empty, and every first open still paid the fallback-and-snap the walk
  // was built to retire. The walk speaks the true shape now: every
  // version of every character (plus the legacy top-level seat, kept for
  // any archive that ever carried it), and the first open of any card
  // mounts its stage at the TRUE aspect.
  useEffect(() => {
    const characters = db?.characters;
    if (!Array.isArray(characters) || characters.length === 0) return undefined;
    const list = [];
    for (const c of characters) {
      for (const img of c?.images || []) list.push(img);
      for (const v of c?.versions || []) {
        for (const img of v?.images || []) list.push(img);
      }
    }
    if (list.length === 0) return undefined;
    let alive = true;
    const CHUNK = 24;
    let i = 0;
    const ric = typeof requestIdleCallback === 'function' ? requestIdleCallback : (fn) => setTimeout(fn, 80);
    const step = () => {
      if (!alive) return;
      prewarmStageSizes(imagesPathRef.current, list.slice(i, i + CHUNK));
      i += CHUNK;
      if (i < list.length) ric(step);
    };
    const handle = ric(step);
    return () => {
      alive = false;
      if (typeof cancelIdleCallback === 'function' && typeof handle === 'number') cancelIdleCallback(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db?.characters]);

  // 1.4.9 — THE HIDDEN APP HOLDS ITS BREATH ("when i open task manager i
  // see 2 instances of burrito gendex, both taking alot of cpu"): a
  // minimized or fully covered window still composites every animated coat
  // on the wall — the compositor keeps rasterizing frames nobody can see,
  // and the task manager reads it as two hot processes. The moment the
  // document goes hidden the root gains .gd-app-hidden and every finish +
  // motion clock in the app PAUSES (see index.css — the same family the
  // freeze law speaks); the moment it shows again they resume at the exact
  // phase they froze at. No timers, no listener churn — one class riding
  // the browser's own visibility signal.
  // 1.7.3 — THE HIDDEN CLOCK HOLDS IN THE ANIMATION MODEL ("when i alt tab
  // or open something and go back, the card finishes would suddenly snap
  // as if it calculated where it should have been during all of this off
  // time, fix that so it continues from where it was paused instead"):
  // the class law alone could never hold a hidden clock. CSS animations
  // ride the document timeline — wall clock — and `animation-play-state:
  // paused` only COMMITS when the engine produces a frame (style recalc
  // is part of the rendering loop); a hidden window produces no frames,
  // so the pause never landed, the timeline kept advancing through the
  // dark, and every coat snapped to wall-clock phase on the first painted
  // frame back. The same visibility signal now drives the Web Animations
  // API: on HIDE, every RUNNING animation in the document
  // (document.getAnimations() — the coats' pseudo-element flights
  // included) is pause()d — a synchronous freeze of currentTime in the
  // animation model that needs no frame; on SHOW, exactly the animations
  // that were held are play()ed again and each one continues FROM WHERE
  // IT FROZE. The held list is remembered (a finished-forwards flight is
  // never play()ed — play() would REWIND it; only the running voices we
  // silenced are woken), and the class law below stays armed as the belt
  // to these suspenders for anything the model misses.
  // 1.7.6 — THE DARK WORKS NOTHING, AND THE WAKE COMES BACK FRESH ("when
  //   the app is working in the background, it still processes the
  //   finishes and snaps them when i reopen the window, fix the issue
  //   where it processes unnecessarily in the background, and the issue
  //   that the finishes are still working, when i open back they just
  //   seem to loop back to where they used to after a long lag spike
  //   (basically account for older hardware cpu shenanigans)"): the 1.7.3
  //   freeze was a one-shot SNAPSHOT, and the wake was one synchronous
  //   long task. Two diseases grew out of it:
  //   · THE DARK KEPT WORKING: the shine heartbeat's timer (GridView)
  //     fired through the dark on a stale :hover and re-armed UNPAUSED
  //     pulse flights — animations born after the snapshot, never held,
  //     burning style/layout on a window nobody watched (its forced
  //     reflow and all), while the autosave / auto-swipe / rainbow
  //     intervals churned React commits that mounted yet more clocks.
  //     Every one of those doors now stands down while the document is
  //     hidden (see their own 1.7.6 notes) — the app paints NOTHING in
  //     the background, exactly what a background window owes the CPU.
  //   · THE WAKE STORMED: on show, hundreds of held Animation objects
  //     were play()ed in one breath beside the class removal's full-sheet
  //     style invalidation — a long task on old hardware, and every
  //     ambient loop resumed at its FROZEN wall-clock phase ("they just
  //     seem to loop back to where they used to"). The wake is CHUNKED
  //     now (rAF bites of 48 — no single frame back ever carries the
  //     whole storm), and every INFINITE loop comes back FRESH:
  //     currentTime seeks to 0, where each coat's own baked negative
  //     delay lands it at its per-card phase — the loops restart
  //     breathing, never looping back to a stale yesterday. Finite
  //     one-shots still resume from their held phase (they finish out
  //     and retire through their own animationend laws — a play() on a
  //     finished flight would rewind it, so only the paused are woken).
  const hiddenAnimsRef = useRef(null);
  useEffect(() => {
    if (typeof document === 'undefined' || !document.addEventListener) return undefined;
    const onVis = () => {
      const hidden = document.visibilityState === 'hidden';
      document.documentElement.classList.toggle('gd-app-hidden', hidden);
      try {
        if (hidden) {
          // hold every RUNNING clock: pause() freezes currentTime in the
          // model, frame or no frame. (Finished flights are left alone —
          // play() on a finished animation rewinds it to its start.)
          const running = document.getAnimations().filter((a) => a.playState === 'running');
          running.forEach((a) => {
            try { a.pause(); } catch { /* a dead seat answers nothing */ }
          });
          hiddenAnimsRef.current = running;
        } else {
          // 1.7.6 — wake exactly the clocks we hold, in rAF BITES, so no
          // frame back ever carries the whole storm (the old-hardware lag
          // spike retired) — and every infinite loop SEEKS TO ZERO first:
          // its own baked negative delay lands it at its per-card phase, a
          // fresh breath, never a resume at the frozen wall-clock phase
          // that read as "looping back to where it used to".
          const held = (hiddenAnimsRef.current || []).slice();
          hiddenAnimsRef.current = null;
          if (!held.length) return;
          const WAKE_BITE = 48;
          const wake = () => {
            const bite = held.splice(0, WAKE_BITE);
            for (const a of bite) {
              try {
                if (a.playState !== 'paused') continue;
                let infinite = false;
                try {
                  infinite =
                    !!a.effect &&
                    typeof a.effect.getTiming === 'function' &&
                    a.effect.getTiming().iterations === Infinity;
                } catch { /* a dead effect answers nothing */ }
                if (infinite) a.currentTime = 0;
                a.play();
              } catch { /* a dead seat answers nothing */ }
            }
            if (held.length) requestAnimationFrame(wake);
          };
          requestAnimationFrame(wake);
        }
      } catch {
        /* getAnimations unavailable — the gd-app-hidden class law speaks alone */
      }
    };
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // --------------------------------------------------------------------------
  // 0.34.0 — ANY-WINDOW WATCHER. A MutationObserver over document.body
  // tracks whether ANY [data-gd-modal] window is mounted — App-level ones
  // (settings, creation, tag manager, confirms) AND the deep ones rendered
  // inside the views (image manager, stamp windows, version windows, card
  // look…). Two things read it:
  //   · the TITLEBAR LOCKOUT ("dont allow me to access the very top bar …
  //     when i have another window open, dark it out too") — the top bar's
  //     app keys dim and go inert while any window is up (the window
  //     controls stay alive);
  //   · the DROPDOWN SWEEP ("ensure that any dropdown windows such as
  //     spotlight or such would be closed when i open another window such
  //     as settings") — the moment a window appears, every open Popover
  //     dismisses itself (they listen for the gd-close-popovers event; the
  //     settings key sits ABOVE a popover's backdrop, so the old
  //     click-away sheet could never catch it).
  // --------------------------------------------------------------------------
  const [anyWindowOpen, setAnyWindowOpen] = useState(false);
  useEffect(() => {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return undefined;
    const check = () => {
      const open = !!document.querySelector('[data-gd-modal]');
      setAnyWindowOpen((prev) => (prev === open ? prev : open));
    };
    check();
    const mo = new MutationObserver(check);
    // 1.5.7 — ATTRIBUTES JOIN THE WATCH: the retained creation seat never
    // unmounts — its OPEN and CLOSE are pure ATTRIBUTE flips on a layer
    // that has sat in the body since it parked (data-gd-modal riding the
    // layer only while live, Modal's ghost law). A childList-only observer
    // is blind to exactly that: the parked ghost's mount fired the watcher
    // once (locking the bar with nothing on screen — the reported bug),
    // and after the ghost law stripped the parked attribute the LIVE open
    // flipped nothing the watcher could see (the bar never locked, the
    // dropdown sweep never fired). The watch now speaks both dialects:
    // childList for every window that mounts and unmounts, attributes for
    // the one window that only ever flips.
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-gd-modal'] });
    return () => mo.disconnect();
  }, []);
  // Rising edge only: the sweep fires the instant a window APPEARS (a
  // window closing must not dismiss dropdowns that were never open).
  // The event is built through window's OWN constructor (the same
  // CE pattern gd-paste-image uses) — never a bare global Event, which in
  // a non-browser harness is a different realm's class and dispatch
  // rejects outright.
  useEffect(() => {
    if (anyWindowOpen && typeof window !== 'undefined') {
      const CE = window.CustomEvent || window.Event;
      if (CE) window.dispatchEvent(new CE('gd-close-popovers'));
    }
  }, [anyWindowOpen]);

  // 0.30.0 — PERFORMANCE switches (Settings → Performance):
  // stageBlur off = the previews' blurred backdrop becomes a flat tint
  // (the blur is the single most expensive paint in the panel); hoverLifts
  // off = every hover lift freezes at rest height (the transform churn on
  // big grids). Both are plain root classes the CSS respects.
  useEffect(() => {
    if (!db) return;
    document.documentElement.classList.toggle('gd-no-blur', db.settings.stageBlur === false);
    document.documentElement.classList.toggle('gd-no-lift', db.settings.hoverLifts === false);
    // 1.6.7 — THE CARD SHINE FAMILY (Settings → Cards & Tags): the
    // reflection's three dials ride the same lane — gd-no-shine retires
    // the glare layer outright (display: none, the layer never even
    // composites), gd-shine-under-trims demotes its rung below the ink
    // work (the trim reads as ink drawn over the reflection), and
    // data-gd-shine-mode speaks the style ladder the CSS reads ('sweep'
    // is the unattributed default — the classic band, zero specificity
    // fights, the same retirement lane the card dials speak).
    document.documentElement.classList.toggle('gd-no-shine', db.settings.shineOn === false);
    document.documentElement.classList.toggle('gd-shine-under-trims', db.settings.shineOverTrims === false);
    // 1.6.8 — THE GLINT LEAVES THE LADDER ("remove glint from shine
    // style"): only 'pulse' arms the attribute now — 'sweep' stays the
    // unattributed default and a stale 'glint' seat reads as nothing
    // (the sanitize lane walks it onto 'sweep' at load).
    if (db.settings.shineMode === 'pulse') {
      document.documentElement.dataset.gdShineMode = db.settings.shineMode;
    } else {
      delete document.documentElement.dataset.gdShineMode;
    }
    // 1.9.12 — THE PRESS DIAL (Settings → Cards): what a card's press
    // speaks, read by BOTH seats of the flight — the CSS that keys the
    // two animations on html[data-gd-press-mode] (see .gd-card-pulse in
    // index.css) and the grid's own arm gate (firePulse in GridView
    // reads this same attribute, so 'none' never even sets
    // [data-pressed] — no flight, no lingering ribbons-hold seat). Only
    // the two true voices arm the attribute; 'none' is the unattributed
    // rest (the report's default), zero specificity fights — the same
    // retirement lane every dial here speaks.
    if (db.settings.cardPressAnim === 'squish' || db.settings.cardPressAnim === 'pulse') {
      document.documentElement.dataset.gdPressMode = db.settings.cardPressAnim;
    } else {
      delete document.documentElement.dataset.gdPressMode;
    }
    // 1.6.3 — THE CARD'S OWN DIALS ride the root as data attributes the
    // override ladder in index.css reads (see :root[data-gd-card-shadow] /
    // :root[data-gd-card-hover] there). 'theme' RETIRES the attribute
    // outright — the theme's own law wins with zero specificity fights,
    // exactly the look the dial's default promises; the override seats
    // speak their ladders over every theme's own rule (the :root+attr
    // ladder outranks the [data-theme] seats by weight).
    // 1.6.4 — the audit's seats join the same lane: the shadow dial's
    // 'soft' / 'sharp' STYLE ladder (the 1.6.3 'on' value walks onto
    // 'soft' — the sanitize lane already migrated the stored seat, this
    // is the belt for a live db that skipped it), plus the trim-lines
    // and stamp-tilt dials (Muffin's dashed cut lines and the tilted
    // stamp stances, pickable on any theme).
    const shadowRaw = db.settings.cardShadow;
    const cardShadow =
      shadowRaw === 'on' ? 'soft' : ['off', 'soft', 'sharp'].includes(shadowRaw) ? shadowRaw : null;
    if (cardShadow) document.documentElement.dataset.gdCardShadow = cardShadow;
    else delete document.documentElement.dataset.gdCardShadow;
    const cardHover = ['up', 'corner', 'none'].includes(db.settings.cardHover) ? db.settings.cardHover : null;
    if (cardHover) document.documentElement.dataset.gdCardHover = cardHover;
    else delete document.documentElement.dataset.gdCardHover;
    const trimLines = ['solid', 'dashed'].includes(db.settings.trimLines) ? db.settings.trimLines : null;
    if (trimLines) document.documentElement.dataset.gdTrimLines = trimLines;
    else delete document.documentElement.dataset.gdTrimLines;
    const stampTilt = ['flat', 'tilted'].includes(db.settings.stampTilt) ? db.settings.stampTilt : null;
    if (stampTilt) document.documentElement.dataset.gdStampTilt = stampTilt;
    else delete document.documentElement.dataset.gdStampTilt;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    db?.settings?.stageBlur,
    db?.settings?.hoverLifts,
    db?.settings?.shineOn,
    db?.settings?.shineOverTrims,
    db?.settings?.shineMode,
    db?.settings?.cardPressAnim,
    db?.settings?.cardShadow,
    db?.settings?.cardHover,
    db?.settings?.trimLines,
    db?.settings?.stampTilt,
  ]);

  // --------------------------------------------------------------------------
  // 0.19.0 — SCROLL HOVER GUARD: while ANY scroller in the app is moving
  // (grid, right panel, modal bodies), the <html> element carries the
  // gd-scrolling class and every hover LIFT is suppressed for the duration.
  // That was the "elements move around / glitch while scrolling" report:
  // the pointer stays put while the content slides under it, so rows of
  // chips / buttons / slots flickered in and out of their hover
  // transforms mid-scroll and visibly jumped. The class drops ~140ms after
  // the last scroll event; normal hover returns instantly after that.
  // --------------------------------------------------------------------------
  useEffect(() => {
    let t = null;
    const onScroll = () => {
      document.documentElement.classList.add('gd-scrolling');
      if (t) clearTimeout(t);
      t = setTimeout(() => document.documentElement.classList.remove('gd-scrolling'), 140);
    };
    window.addEventListener('scroll', onScroll, true); // capture: every scroller
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      if (t) clearTimeout(t);
      document.documentElement.classList.remove('gd-scrolling');
    };
  }, []);

  // --------------------------------------------------------------------------
  // Window events — THE SHORTCUT MAP (0.30.0 introduced the shortcuts; 0.31.0
  // made them REASSIGNABLE, "allow me to reassign shortcuts (must be two
  // combinations like ctrl s or alt f etc)"). The keydown normalizes the
  // press into the stored combo form (comboFromEvent — Ctrl/Cmd or Alt plus
  // one real key, Shift as a rider) and looks it up in the LIVE map, so a
  // reassigned key works the same instant the editor commits it. Presses
  // that map to nothing fall through to the browser untouched (Ctrl+C/V/F
  // keep their native roles unless the user wires them).
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handler = (e) => {
      const combo = comboFromEvent(e);
      if (!combo) return; // plain keys / bare modifiers — not shortcut territory
      // The map is ACTION-ID → COMBO, so the press resolves through the
      // REVERSE lookup: the action whose combo equals this press. (The
      // sanitize pass keeps one combo per action, so the match is unique.)
      const map = shortcutsRef.current || DEFAULT_SHORTCUTS;
      let action = null;
      for (const [id, c] of Object.entries(map || {})) {
        if (c === combo) {
          action = id;
          break;
        }
      }
      // Legacy alias: Ctrl+Shift+Z has always meant redo (the shipped combo
      // is Ctrl+Y, but Shift+Z is muscle memory) — it stays a silent alias
      // for as long as the user hasn't wired it to anything else.
      if (!action && combo === 'Ctrl+Shift+Z' && !Object.values(map).includes('Ctrl+Shift+Z')) {
        action = 'redo';
      }
      if (!action) return; // not ours — the browser keeps the press

      const t = e.target;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      // While editing text, undo/redo belong to the FIELD (native input
      // undo) — same carve-out the hardcoded handler had.
      if ((action === 'undo' || action === 'redo') && typing) return;

      e.preventDefault();
      switch (action) {
        case 'save':
          saveDb();
          return;
        case 'undo':
          undo();
          return;
        case 'redo':
          redo();
          return;
        case 'newCharacter':
          if (stateRef.current.view.mode !== 'character') setModal({ type: 'newCharacter' });
          return;
        case 'settings':
          setModal({ type: 'settings', snapshot: structuredClone(dbRef.current?.settings || {}) });
          return;
        case 'panel':
          togglePanelModeRef.current?.();
          return;
        case 'outputBar':
          togglePromptBottomRef.current?.();
          return;
        case 'tooltips':
          toggleTooltipsRef.current?.();
          return;
        // 1.8.2 — HELP TEXT JOINS THE MAP ("add a shortcut to the help
        //   text"): the teaching copy's toggle — the same stable handler
        //   the creation seat owns (seatToggleHelp below), writing the same
        //   db.settings.showHelpText every seat speaks.
        case 'helpText':
          toggleHelpRef.current?.();
          return;
        default:
          return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveDb, undo, redo]);
  // The Alt-switch trio lives behind refs so the listener never re-binds
  // mid-session (the callbacks below are stable, but the ref keeps the
  // effect's dep list from dragging them in).
  const togglePanelModeRef = useRef(null);
  const togglePromptBottomRef = useRef(null);
  const toggleTooltipsRef = useRef(null);
  // 1.8.2 — the help-text key rides the same ref family (the listener
  // never re-binds mid-session; the assignment lives where the stable
  // handler exists, at seatToggleHelp below).
  const toggleHelpRef = useRef(null);

  useEffect(() => {
    api?.onPromptUnsaved(() => setShowClosePrompt(true));
    api?.onWindowMaximized(() => setMaximized(true));
    api?.onWindowUnmaximized(() => setMaximized(false));
  }, [api]);

  const handleClose = (saveFirst) => {
    setShowClosePrompt(false);
    if (saveFirst) {
      api.saveAndClose(dbRef.current);
    } else {
      api.forceClose();
    }
  };

  // Grid-level paste: attach EVERY image on the clipboard to the
  // new-character modal when open, or seed a fresh one. (Card view
  // handles its own paste while active.)
  // 0.32.0 — the Ctrl+V FALLBACK: an image FILE copied in the OS file
  // manager never reaches clipboardData.items (Explorer/Finder put a FILE
  // LIST on the clipboard, not bitmap data) — the same blind spot the PASTE
  // keys had. When the event carries no image items, the multi-strategy
  // main-process reader gets the last word, QUIETLY (a text clipboard must
  // not flash "no image" at anyone).
  // --------------------------------------------------------------------------
  useEffect(() => {
    const onPaste = async (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (stateRef.current.view.mode === 'character') return; // CharacterView owns it
      const items = Array.from(e.clipboardData?.items || []).filter((it) => it.type && it.type.startsWith('image/'));
      const records = [];
      if (items.length) e.preventDefault();
      for (const item of items) {
        const blob = item.getAsFile();
        if (!blob) continue;
        try {
          // 0.33.0 — the blob goes through the renderer's OWN thumb pass
          // (canvas 480px JPEG) so the grid never decodes the full-quality
          // file for the card's outer thumbnail.
          const record = await saveImageBlobWithThumb(blob);
          if (record) records.push(record);
        } catch {
          /* skip unreadable item */
        }
      }
      if (!records.length) {
        // no bitmap items — a copied FILE (or nothing at all): ask the
        // main-process reader, silently.
        let record = null;
        try {
          const img = await api?.clipboardReadImage?.();
          if (img?.base64) record = (await api.saveImageBuffer(img.base64, img.ext || '.png')) || null;
        } catch {
          record = null;
        }
        if (record) records.push(record);
      }
      if (!records.length) return;
      if (stateRef.current.modal?.type === 'newCharacter') {
        setModal((m) => (m ? { ...m, images: [...(m.images || []), ...records] } : m));
      } else {
        setModal({ type: 'newCharacter', images: records });
      }
      // 1.1.2 — THE PREVIEW RIDES ALONG ("it has feedback when creating a
      // card or setting a new thumbnail that its generated"): the save
      // already writes the small PREV beside the thumb — the status now
      // SAYS so, so the grid's lightness is never a surprise.
      setStatusTransient(`${records.length} image${records.length === 1 ? '' : 's'} attached: name the card`);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [api, setStatusTransient]);

  // --------------------------------------------------------------------------
  // 0.32.0 — THE CLIPBOARD IMAGE READ, split in two: the quiet record reader
  // (no statuses — for the Ctrl+V fallback, which must stay silent when the
  // clipboard holds text) and the loud PASTE key wrapper. The main process
  // hunts through EVERY clipboard shape an image can wear (bitmap, copied
  // FILES, the raw PNG format) — see the multi-strategy reader in main.js.
  // --------------------------------------------------------------------------
  const readClipboardImageRecord = useCallback(async () => {
    try {
      const img = await api?.clipboardReadImage?.();
      if (!img?.base64) return null;
      return (await api.saveImageBuffer(img.base64, img.ext || '.png')) || null;
    } catch {
      return null;
    }
  }, [api]);

  // --------------------------------------------------------------------------
  // 0.30.0 — MANUAL PASTE (the PASTE keys + the context menu's Paste item):
  // reads the clipboard's IMAGE through the main process and routes it
  // exactly like a Ctrl+V: into the open creation window, a fresh one on the
  // grid, or the character being edited (via the gd-paste-image event
  // CharacterView listens for). Nothing on the clipboard but text -> a quiet
  // status note, never an error.
  // --------------------------------------------------------------------------
  const pasteImageFromClipboard = useCallback(async () => {
    const record = await readClipboardImageRecord();
    if (!record) {
      // 0.35.0 — the fail tone rides the toast too (the red pill), matching
      // the stage's own paste verdict.
      setStatusTransient('No image on the clipboard', 'fail');
      return;
    }
    if (stateRef.current.view.mode === 'character') {
      // the card view owns its version's images — hand it over
      const CE = (typeof window !== 'undefined' && window.CustomEvent) || null;
      if (CE) window.dispatchEvent(new CE('gd-paste-image', { detail: record }));
      setStatusTransient('Image pasted into the version');
      return;
    }
    if (stateRef.current.modal?.type === 'newCharacter') {
      setModal((m) => (m ? { ...m, images: [...(m.images || []), record] } : m));
    } else {
      setModal({ type: 'newCharacter', images: [record] });
    }
    setStatusTransient('Image attached: name the card');
  }, [readClipboardImageRecord, setStatusTransient]);

  // --------------------------------------------------------------------------
  // Character mutations
  // --------------------------------------------------------------------------
  const patchCharacter = useCallback(
    (id, patch, coalesceKey = null) => {
      mutateDb(
        (d) => ({
          ...d,
          characters: d.characters.map((c) =>
            c.id === id ? { ...c, ...(typeof patch === 'function' ? patch(c) : patch) } : c
          ),
        }),
        coalesceKey
      );
    },
    [mutateDb]
  );

  const setSetting = useCallback(
    (key, value, coalesceKey = null) => {
      mutateDb((d) => ({ ...d, settings: { ...d.settings, [key]: value } }), coalesceKey);
    },
    [mutateDb]
  );

  // 1.1.9 — THE EXPANDED SEATS' HYDRATE + PERSIST ("expanding a card or
  // retracting it should be a savable thing and retain"): the Set hydrates
  // from db.settings.expandedCards the moment the db lands (once, ever),
  // and every change writes back through the ordinary settings machinery.
  // A write that would only echo what is already stored never fires — the
  // hydrate itself must not push a history entry or a save.
  //
  // 1.2.0 — THE STALE STATE NEVER WRITES ("when restarting, after the
  // splash screen it seems to have an unsaved change that occurs even tho
  // nothing happened"): the hydrate effect (declared first) ran setExpanded-
  // CardIds(saved) and the persist effect read the db in the SAME commit —
  // but React state updates are scheduled, so that first persist run still
  // saw the PRE-hydrate Set (empty) while prev carried the saved seats.
  // Measured live: boot with expandedCards ['mc4'] flipped "Unsaved
  // Changes*" on the splash's wake-up breath AND wrote [] over the stored
  // seats. The hydrate now arms a one-shot latch: the persist effect skips
  // exactly its first (stale) run and speaks from the landed state on its
  // next — the phantom write is gone, the seats survive.
  const expandedStaleRef = useRef(false);
  useEffect(() => {
    if (expandedHydratedRef.current || !db) return;
    expandedHydratedRef.current = true;
    const saved = db?.settings?.expandedCards;
    if (Array.isArray(saved) && saved.length) {
      const next = new Set(saved.map((x) => String(x || '')).filter(Boolean));
      if (next.size) {
        expandedStaleRef.current = true; // the state lands next commit
        setExpandedCardIds(next);
        return;
      }
    }
  }, [db]);
  useEffect(() => {
    if (!expandedHydratedRef.current) return;
    if (expandedStaleRef.current) {
      // this run sees the pre-hydrate state — the saved value is the
      // truth; the landed Set speaks on the next run.
      expandedStaleRef.current = false;
      return;
    }
    const next = [...expandedCardIds];
    const prev = db?.settings?.expandedCards;
    const same =
      Array.isArray(prev) &&
      prev.length === next.length &&
      next.every((id) => prev.includes(id));
    if (!same) setSetting('expandedCards', next, 'expanded-cards');
  }, [expandedCardIds, db, setSetting]);

  const setSortAndPersist = useCallback(
    (mode) => {
      setSortMode(mode);
      setSetting('defaultSortMode', mode);
    },
    [setSetting]
  );

  // 1.5.5 — THE LEGAL GATE'S OWN HANDLERS (the gate's state + mount effect
  // live up with the update window's, near the boot's verdicts): ACCEPT
  // writes the record through the ordinary settings machinery AND saves
  // immediately (setSetting -> mutateDb updates dbRef.current
  // SYNCHRONOUSLY, so the save that follows persists the acceptance in the
  // same breath — an instant close must never un-accept). DECLINE is the
  // user's own law: close the app, save nothing, ask again on the next
  // launch.
  const acceptLegal = useCallback(() => {
    setSetting('tosAcceptance', { version: TOS_VERSION, at: Date.now(), appVersion: APP.version });
    setLegalGate(false);
    saveDb(true); // persist NOW, not on the autosave's clock
    setStatusTransient('Terms acknowledged ✓');
  }, [setSetting, saveDb, setStatusTransient]);
  const declineLegal = useCallback(() => {
    api?.forceClose?.();
  }, [api]);

  const togglePanelMode = useCallback(() => {
    // 0.28.0 — the HAND-OFF lives in the effect below (it watches the
    // setting itself, so the titlebar key AND the settings switch both
    // route through it): turning the panel off while it is open hands the
    // character to the full window view; turning it on while a character
    // is full-window hands it back to the panel.
    const current = dbRef.current?.settings?.detailPanel !== false;
    setSetting('detailPanel', !current);
  }, [setSetting]);

  const createCharacter = useCallback(
    ({ name, classId, images, card, version, stamps, stampSettings, tags: pickedTags }) => {
      // 1.8.6 — THE WHEEL THAT OUTLIVES THE FREEZE (see newCardPending's
      // note above — the veil's own road): the creation window closes FIRST
      // (the hand has committed; the viewer takes over the story), the veil
      // + wheel paint over the card viewer, and only THEN does the build
      // run — the freeze meets a wheel already on its compositor layer,
      // turning through the whole build, and the veil clears one painted
      // breath after the new card's view has landed.
      setModal(null);
      setNewCardPending(true);
      deferToPaint(() => {
        const character = makeCharacter(
          name,
          classId || selectedClassId,
          (images || []).map(imageRecord),
          card || {},
          version || {},
          (stamps || []).map((s) => ({ image: s.image, name: s.name })),
          stampSettings || {},
          // 1.1.2 — TAGS AT BIRTH ("add adding tags to the card when creating
          // it in card creation window"): the creation window's picked tag
          // ids — filtered to the ids that still exist (a tag deleted with the
          // manager open above the window can never ride the card).
          (pickedTags || []).filter((id) => tagIdsSetRef.current.has(id))
        );
        // 0.22.0 — every stamp image joins the library in the same write
        // (deduped by file): there is no public/private anymore, so anything
        // uploaded here is pickable — and spotlightable — everywhere.
        // 0.23.0 — images already in the library get their NAME synced to the
        // one given in the creation dialog's stamp window (one world, one
        // name: the spotlight list and every picker read the update).
        mutateDb((d) => {
          const lib = d.stamps || [];
          const byImage = new Map(lib.map((t) => [t.image, t]));
          const fresh = character.stamps
            .filter((s) => s.image && !byImage.has(s.image))
            .map((s) => makeStamp(s.image, s.name));
          const renamed = lib.map((t) => {
            const carried = character.stamps.find((s) => s.image === t.image);
            return carried && carried.name && carried.name !== t.name ? { ...t, name: carried.name } : t;
          });
          return { ...d, stamps: [...renamed, ...fresh], characters: [...d.characters, character] };
        });
        if (dbRef.current?.settings?.detailPanel !== false) setPanelCharacterId(character.id);
        else setView({ mode: 'character', id: character.id });
        setStatusTransient(`"${stripRichText(character.name)}" created`);
        // the veil clears one PAINTED breath after the card lands — the
        // panel's own mount is deferred a frame (DeferredPanelBoot) and the
        // view's first paint is the moment the card truly "has loaded".
        deferToPaint(() => setNewCardPending(false));
      });
    },
    [mutateDb, selectedClassId, setStatusTransient]
  );

  // ---- stamps (0.15.0) -------------------------------------------------------
  // A stamp image FILE can be shared by the library and several characters;
  // it is only deleted from disk once nothing references it anymore.

  // 0.31.0 — DUPLICATE (the card context menu's "Duplicate"): a full copy
  // of the character — versions, parts, notes, stamps, card look — that
  // OWNS its image files. Every version image is copied through the main
  // process first (image:copy → a fresh { file, thumb } on disk), so
  // deleting a version image on the copy can never unlink the original's
  // art. The copy lands in the same class, right after the original, with
  // " copy" riding the name. Fails quiet (status note) if the file copy
  // isn't available (web/test harness) — no half-shared clone is written.
  const duplicateCharacter = useCallback(
    async (id) => {
      const src = dbRef.current?.characters.find((c) => c.id === id);
      if (!src) return;
      setStatusTransient('Duplicating…', 'quiet');
      const clone = JSON.parse(JSON.stringify(src));
      let imagesFailed = false;
      for (const v of clone.versions || []) {
        const copied = [];
        for (const img of v.images || []) {
          let rec = null;
          try {
            rec = await api?.copyImageFile?.(img.file);
          } catch {
            rec = null;
          }
          if (rec?.file) copied.push(imageRecord(rec));
          else {
            imagesFailed = true;
            copied.push(imageRecord(img));
          }
        }
        v.images = copied;
      }
      if (imagesFailed) {
        setStatusTransient('Duplicate failed: image copy unavailable', 'fail');
        return;
      }
      // Fresh ids everywhere (character, versions, parts, stamps) — the
      // clone is its own entity, never a mutation proxy of the original.
      // 0.47.0 — THE COPY KEEPS ITS POSTURE ("when duplicating a card, ensure
      // its duplicated properly including order and top version and image"):
      // the version ids are remapped as they are re-issued, and the clone's
      // previewVersionId lands on the REMAPPED id of the ORIGINAL's top
      // version (explicit pin or derived — the same one whose cover art the
      // grid shows), so the duplicate card paints the same top version and
      // the same cover image, in the same inner order, right after its
      // source in the list.
      // 1.1.5 — BUT ITS BIRTH IS ITS OWN ("account for copies too as the
      // copies are created newer than them of course"): the deep clone used
      // to carry the SOURCE's createdAt verbatim, so in NEWEST FIRST the
      // copy tied with the original and the stable sort kept it parked right
      // beside its source — switching to newest read as "nothing happened".
      // The copy is BORN now: createdAt lands on the moment of duplication,
      // so newest-first seats it at the top with the other freshly made
      // cards. (The custom order keeps its own law — the copy still lands
      // right after its source in the array.)
      clone.id = uuidv4();
      clone.name = `${src.name || 'Unnamed'} copy`;
      clone.createdAt = Date.now();
      const srcPreview = getPreviewVersion(src);
      let previewVersionId = null;
      for (const v of clone.versions || []) {
        const fresh = uuidv4();
        if (srcPreview && v.id === srcPreview.id) previewVersionId = fresh;
        v.id = fresh;
        for (const p of v.parts || []) p.id = uuidv4();
      }
      clone.previewVersionId = previewVersionId;
      for (const s of clone.stamps || []) s.id = uuidv4();
      // 1.6.0 — THE COPY KEEPS ITS SIZE ("when duplicating an enlarged card,
      // ensure that its still enlarged"): the expanded seats are a Set of IDS
      // (1.1.8's double-width masonry span), and a fresh id meant the copy
      // always mounted at single width however its source sat — the duplicate
      // read as a different card than the one it was born from. The seat now
      // follows the bloodline: a source sitting enlarged hands its span to
      // the copy in the same breath, so the twin lands beside it at the SAME
      // size, and the pair reads as the pair it is (retracting either one
      // still speaks its own key — the Set holds them independently).
      if (expandedCardsRef.current.has(id)) {
        setExpandedCardIds((prev) => {
          const next = new Set(prev);
          next.add(clone.id);
          return next;
        });
      }
      const at = dbRef.current?.characters.findIndex((c) => c.id === id);
      mutateDb((d) => {
        const list = [...d.characters];
        const insert = at >= 0 ? at + 1 : list.length;
        list.splice(insert, 0, clone);
        return { ...d, characters: list };
      });
      setStatusTransient(`"${stripRichText(clone.name)}" created`);
    },
    [api, mutateDb, setStatusTransient]
  );

  const stampFileUsers = useCallback((d, file) => {
    let n = 0;
    for (const t of d?.stamps || []) if (t.image === file) n += 1;
    for (const c of d?.characters || []) for (const s of c.stamps || []) if (s.image === file) n += 1;
    return n;
  }, []);

  const deleteStampFileIfOrphan = useCallback(
    (file) => {
      if (!file) return;
      if (stampFileUsers(dbRef.current, file) === 0) api?.deleteImageFile(file);
    },
    [api, stampFileUsers]
  );

  // Attach a stamp from the library (a COPY of the image — removing the
  // library entry later never strips characters that carry it; matching is
  // by image either way). 0.22.0 — dedupe by IMAGE, not by link.
  const attachStampTemplate = useCallback(
    (characterId, tpl) => {
      mutateDb((d) => ({
        ...d,
        characters: d.characters.map((c) =>
          c.id === characterId && !(c.stamps || []).some((s) => s.image === tpl.image)
            ? { ...c, stamps: [...(c.stamps || []), makeStamp(tpl.image, tpl.name)] }
            : c
        ),
      }));
      setStatusTransient(`Stamp "${tpl.name}" added`);
    },
    [mutateDb, setStatusTransient]
  );

  const removeCharacterStamp = useCallback(
    (characterId, stampId) => {
      let file = null;
      mutateDb((d) => ({
        ...d,
        characters: d.characters.map((c) => {
          if (c.id !== characterId) return c;
          const victim = (c.stamps || []).find((s) => s.id === stampId);
          if (victim) file = victim.image;
          return { ...c, stamps: (c.stamps || []).filter((s) => s.id !== stampId) };
        }),
      }));
      deleteStampFileIfOrphan(file);
      setStatusTransient('Stamp removed');
    },
    [mutateDb, deleteStampFileIfOrphan, setStatusTransient]
  );

  // Bring a stamp to the TOP of its card (the only one the card shows by
  // default — the rest render behind).
  const promoteCharacterStamp = useCallback(
    (characterId, stampId) => {
      mutateDb((d) => ({
        ...d,
        characters: d.characters.map((c) => {
          if (c.id !== characterId) return c;
          const list = c.stamps || [];
          const i = list.findIndex((s) => s.id === stampId);
          if (i <= 0) return c;
          const next = [...list];
          const [moved] = next.splice(i, 1);
          next.unshift(moved);
          return { ...c, stamps: next };
        }),
      }));
      setStatusTransient('Stamp moved to top');
    },
    [mutateDb, setStatusTransient]
  );

  // 0.22.0 — a local upload joins the character AND the library (one world,
  // no public/private): the image is pickable and spotlightable everywhere
  // right away. 0.23.0 — the NAME travels with it: the picker surfaces pick
  // the file and open the STAMP WINDOW (preview + name + save) themselves,
  // then hand the chosen records + name here. The library record and the
  // character copy both carry the name the user typed.
  const addStampsToCharacter = useCallback(
    async (characterId, records, name = 'stamp') => {
      if (!records?.length) return;
      const clean = String(name || '').trim() || 'stamp';
      const copies = records.map((r) => makeStamp(r.file, clean));
      mutateDb((d) => {
        const lib = d.stamps || [];
        const have = new Set(lib.map((t) => t.image));
        const fresh = copies.filter((s) => s.image && !have.has(s.image)).map((s) => makeStamp(s.image, s.name));
        return {
          ...d,
          stamps: [...lib, ...fresh],
          characters: d.characters.map((c) => (c.id === characterId ? { ...c, stamps: [...(c.stamps || []), ...copies] } : c)),
        };
      });
      setStatusTransient(`${records.length} stamp${records.length === 1 ? '' : 's'} added`);
    },
    [mutateDb, setStatusTransient]
  );

  // 0.23.0 — RENAME a stamp the character carries (the stamp window's SAVE).
  // One world, one name: the character's record AND the library record for
  // the same image both take it, so every picker and the spotlight list read
  // the update.
  const renameCharacterStamp = useCallback(
    (characterId, stampId, name) => {
      const clean = String(name || '').trim();
      if (!clean) return;
      let image = null;
      mutateDb((d) => ({
        ...d,
        characters: d.characters.map((c) => {
          if (c.id !== characterId) return c;
          const victim = (c.stamps || []).find((s) => s.id === stampId);
          if (victim) image = victim.image;
          return {
            ...c,
            stamps: (c.stamps || []).map((s) => (s.id === stampId ? { ...s, name: clean } : s)),
          };
        }),
        stamps: (d.stamps || []).map((t) => (image && t.image === image ? { ...t, name: clean } : t)),
      }));
      setStatusTransient('Stamp renamed');
    },
    [mutateDb, setStatusTransient]
  );

  // 0.23.0 — DRAG-REORDER the character's stamps (the slot row's smooth
  // pointer sort commits here). The top slot stays the card's visible stamp;
  // dropping a stamp onto slot 0 makes it the new top.
  const reorderCharacterStamps = useCallback(
    (characterId, from, to) => {
      mutateDb(
        (d) => ({
          ...d,
          characters: d.characters.map((c) => {
            if (c.id !== characterId) return c;
            const list = c.stamps || [];
            const i = Math.max(0, Math.min(list.length - 1, from));
            const j = Math.max(0, Math.min(list.length - 1, to));
            if (i === j) return c;
            const next = [...list];
            const [moved] = next.splice(i, 1);
            next.splice(j, 0, moved);
            return { ...c, stamps: next };
          }),
        }),
        `stampOrder:${characterId}`
      );
    },
    [mutateDb]
  );

  // 0.16.0 — STAMP COLOR; 0.22.0 — card-level (ONE hue setting shared by
  // every stamp on the card) and always on: color null = AUTO (the dominant
  // color of the card's top stamp image), '#rrggbb' = the picked hue.
  // colorAlpha stays the hue's own transparency (0..1, sanitized here).
  const setCharacterStampColor = useCallback(
    (characterId, patch = {}) => {
      const clean = {};
      if ('color' in patch)
        clean.color = patch.color && /^#[0-9a-fA-F]{6}$/.test(String(patch.color)) ? String(patch.color).toLowerCase() : null;
      if ('colorAlpha' in patch) clean.colorAlpha = sanitizeStampHueAlpha(patch.colorAlpha);
      /* 1.3.8 — THE HUE'S SECOND LAYER ORDER rides the color window's own
         lane (the over-trim switch lives in the hue settings — see
         StampColorControls; the whitelist learned its name so the switch
         actually commits, the same lesson the hueOver fix below speaks). */
      if ('hueOverTrim' in patch) clean.hueOverTrim = patch.hueOverTrim === true;
      if (!Object.keys(clean).length) return;
      mutateDb(
        (d) => ({
          ...d,
          characters: d.characters.map((c) =>
            c.id === characterId
              ? { ...c, stampSettings: { ...sanitizeStampSettings(c.stampSettings), ...clean } }
              : c
          ),
        }),
        // the color window's slider bursts coalesce into ONE undo step per
        // burst (same folding rule as the transform sliders).
        `stampColor:${characterId}`
      );
    },
    [mutateDb]
  );

  // 0.17.0 — STAMP POSITION; 0.19.0 — the full TRANSFORM; 0.20.0 — the
  // SETTINGS-ONLY path (the transformer and stamp dragging are gone from
  // the previews; the STAMP SETTINGS popover is the only writer); 0.22.0 —
  // card-level: the settings the visible stamp wears ({ pos {x,y} percent
  // of the art box — may hang past the borders — pos null for the classic
  // bottom band; scale a multiplier of the sticker's base size; rot in
  // degrees; clip true = parts beyond the card's border are hidden — the
  // OUTSIDE-off default; alpha the stamp ART's own transparency — a look,
  // never a placement). All values are re-validated on load by createSafeDb.
  // Slider bursts coalesce into ONE undo step per burst (the same key keeps
  // folding for a second).
  const setCharacterStampTransform = useCallback(
    (characterId, patch = {}) => {
      const clean = {};
      if ('pos' in patch) clean.pos = sanitizeStampPos(patch.pos);
      if ('scale' in patch) clean.scale = sanitizeStampScale(patch.scale);
      if ('rot' in patch) clean.rot = sanitizeStampRot(patch.rot);
      if ('clip' in patch) clean.clip = patch.clip === true;
      if ('alpha' in patch) clean.alpha = sanitizeStampAlpha(patch.alpha);
      /* 1.3.8 — THE HUE SWITCHES RIDE THE WHITELIST ("fix the issue where
         the hue over stamp switch isnt turning on when i press on it"):
         hueOver was born in 0.38.0 with its switch in the popover, but
         this cleaner never learned its name — the key fell silently out
         of every patch, sanitizeStampSettings re-seated the default
         false, and the switch read OFF forever no matter how many times
         it was pressed. Both hue layer orders commit now: hueOver (the
         wash over the stamp art) and hueOverTrim (the wash over the
         trim — 1.3.8). */
      if ('hueOver' in patch) clean.hueOver = patch.hueOver === true;
      if ('hueOverTrim' in patch) clean.hueOverTrim = patch.hueOverTrim === true;
      mutateDb(
        (d) => ({
          ...d,
          characters: d.characters.map((c) =>
            c.id === characterId
              ? { ...c, stampSettings: { ...sanitizeStampSettings(c.stampSettings), ...clean } }
              : c
          ),
        }),
        `stampPos:${characterId}`
      );
    },
    [mutateDb]
  );

  // 0.22.0 — AUTO HUE PRIMING: derives the dominant color of every stamp
  // image the library has not seen yet (dominantColorOf memoizes per url)
  // and caches it on the library record's autoColor. This is DERIVED data,
  // not user content: it writes straight to state (no undo entry, no
  // unsaved flag — an unsaved db simply re-derives on next launch).
  // 0.23.0 — THE LOST-RACE FIX: the old loop pre-marked images as primed and
  // dropped every derived color the moment any other db write landed
  // mid-loop (the cleanup flipped `alive` and the batched write never
  // happened — while the pre-mark kept the effect from ever retrying, so
  // those stamps stayed colorless for the whole session and their cards
  // painted NO hue: "the hue needs to be updated for it to show"). The loop
  // now writes EACH derivation the moment it resolves — a functional setDb
  // that always lands on the latest state — and an image is only ever
  // marked done AFTER its write. A db change during the loop no longer
  // cancels anything; the in-flight guard just prevents duplicate loops.
  const primedStampsRef = useRef(new Set());
  const primingLoopRef = useRef(false);
  useEffect(() => {
    if (!db || !imagesPathRef.current) return;
    const need = (db.stamps || []).filter(
      (s) => s.image && !s.autoColor && !primedStampsRef.current.has(s.image)
    );
    if (!need.length || primingLoopRef.current) return;
    primingLoopRef.current = true;
    (async () => {
      try {
        for (const st of need) {
          const hex = await dominantColorOf(buildImageUrl(imagesPathRef.current, st.image));
          if (hex) {
            // write it immediately — against the LATEST db, never a snapshot
            setDb((d) => {
              if (!d) return d;
              const next = {
                ...d,
                stamps: (d.stamps || []).map((s) => (s.image === st.image ? { ...s, autoColor: hex } : s)),
              };
              dbRef.current = next;
              return next;
            });
          }
          primedStampsRef.current.add(st.image); // marked done only after the write
        }
      } finally {
        primingLoopRef.current = false; // never strand the guard, whatever happens
        // anything that arrived while we were busy? one more sweep picks it up
        setDb((d) => {
          if (!d) return d;
          const still = (d.stamps || []).some((s) => s.image && !s.autoColor && !primedStampsRef.current.has(s.image));
          return still ? { ...d, stamps: [...d.stamps] } : d; // identity change re-runs the effect only when needed
        });
      }
    })();
  }, [db]);

  // Live library management: add images to the library, or remove one
  // (cards keep their copies — matching is by image, which survives
  // without the record). 0.22.0 — with no public/private split, the creation
  // dialog no longer carries a template strip; this stays for any picker
  // surfaces that grow later.
  const addStampTemplates = useCallback(
    (images) => {
      const templates = (images || []).filter(Boolean).map((img) => makeStamp(img, 'stamp'));
      if (!templates.length) return [];
      mutateDb((d) => {
        const lib = d.stamps || [];
        const fresh = templates.filter((t) => !lib.some((x) => x.image === t.image));
        return { ...d, stamps: [...lib, ...fresh] };
      });
      setStatusTransient(`${templates.length} stamp template${templates.length === 1 ? '' : 's'} saved`);
      return templates;
    },
    [mutateDb, setStatusTransient]
  );

  const removeStampTemplate = useCallback(
    (templateId) => {
      let file = null;
      mutateDb((d) => {
        const victim = (d.stamps || []).find((t) => t.id === templateId);
        if (victim) file = victim.image;
        return {
          ...d,
          stamps: (d.stamps || []).filter((t) => t.id !== templateId),
        };
      });
      deleteStampFileIfOrphan(file);
      setSpotlight((f) => ({ ...f, stamps: (f.stamps || []).filter((id) => id !== templateId) }));
      setStatusTransient('Stamp removed from the library: cards keep theirs');
    },
    [mutateDb, deleteStampFileIfOrphan, setStatusTransient]
  );

  // Stamp spotlight cycle (0.37.0 — THREE STATES, like the tags: "just like
  // there is include exclude and normal mode, add that to the stamps too"):
  // neutral → INCLUDE (promoted on the band) → EXCLUDE (cards carrying it
  // are non-matches) → neutral. Two independent lists — an include never
  // shadows an exclude; cycling one list never touches the other.
  const cycleStampSpotlight = useCallback((stampId) => {
    setSpotlight((f) => {
      const inc = f.stamps || [];
      const exc = f.stampExclude || [];
      if (inc.includes(stampId)) {
        return { ...f, stamps: inc.filter((id) => id !== stampId), stampExclude: [...exc, stampId] };
      }
      if (exc.includes(stampId)) {
        return { ...f, stampExclude: exc.filter((id) => id !== stampId) };
      }
      return { ...f, stamps: [...inc, stampId] };
    });
  }, []);

  // 0.24.0 grey-screen hotfix — `confirm` used to live BELOW
  // deleteStampFromGallery, whose deps array read it during render →
  // TDZ ReferenceError → React unmounted the whole tree (grey screen).
  // It only touches a ref + a setter, so it hoists safely above every
  // consumer. Keep declaration-order hygiene: no dep may be named before
  // its const exists.
  const confirm = useCallback((opts) => {
    confirmRef.current = opts;
    setConfirmState({
      title: opts.title,
      message: opts.message,
      confirmLabel: opts.confirmLabel,
      danger: opts.danger,
      // 1.7.4 — THE ASK'S OWN LANE ("the confirmation window should be above
      // the windows not below it"): a caller born above the huge image
      // viewer — the image manager riding the over-viewer lane, the viewer's
      // own delete — passes overAll: true and the ask rides the z 960 lane
      // above every window (see ConfirmModal + .gd-modal-layer.is-over-all
      // in index.css). Every classic caller keeps the classic seat.
      overAll: opts.overAll === true,
    });
  }, []);

  // 0.24.0 — STAMPS GALLERY handlers. A stamp saved through the creation
  // dialog's stamp window joins the LIBRARY right away (not only when the
  // character is created): the image record lands in db.stamps wearing its
  // name the moment SAVE is pressed. Removing one from the gallery asks
  // first (the confirm window) — characters that carry the stamp keep their
  // copies (matching is by image), and the file itself is only deleted when
  // nothing references it anymore (the creation DRAFT's stamps aren't in the
  // db yet, so the dialog tells us when the file is still needed).
  const addStampToGallery = useCallback(
    (image, name = 'stamp', prev = null) => {
      const file = String(image || '');
      if (!file) return;
      const clean = String(name || '').trim() || 'stamp';
      mutateDb((d) => {
        const lib = d.stamps || [];
        const existing = lib.find((t) => t.image === file);
        if (existing) {
          // already in the gallery — the name the user just typed wins (and
          // 1.1.5: a prev that arrived later rides along too, without
          // stepping on one the record already holds)
          const nextPrev = existing.prev || prev || null;
          return existing.name === clean && existing.prev === nextPrev
            ? d
            : {
                ...d,
                stamps: lib.map((t) => (t.image === file ? { ...t, name: clean, prev: nextPrev } : t)),
              };
        }
        // 1.1.5 — THE PREVIEW RIDES THE RECORD AT BIRTH: the import already
        // built the lightweight prev file (saveImage writes it with the
        // image itself), so the gallery record carries it from the first
        // breath — the spotlight tiles and pickers read the cheap decode
        // immediately instead of falling back to the full-res stamp until
        // the generator is pressed once.
        const rec = makeStamp(file, clean);
        if (prev) rec.prev = prev;
        return { ...d, stamps: [...lib, rec] };
      });
    },
    [mutateDb]
  );

  const deleteStampFromGallery = useCallback(
    (tpl, opts = {}) => {
      if (!tpl?.id) return;
      confirm({
        title: 'DELETE STAMP',
        message: `Remove "${tpl.name}" from the stamps gallery? Characters that use it keep their copy. This cannot be undone.`,
        confirmLabel: 'DELETE',
        danger: true,
        onConfirm: () => {
          let file = null;
          mutateDb((d) => {
            const victim = (d.stamps || []).find((t) => t.id === tpl.id);
            if (victim) file = victim.image;
            return { ...d, stamps: (d.stamps || []).filter((t) => t.id !== tpl.id) };
          });
          setSpotlight((f) => ({ ...f, stamps: (f.stamps || []).filter((id) => id !== tpl.id) }));
          // the creation dialog's DRAFT may still reference the image — it
          // asked us to keep the file in that case (it is not in the db yet,
          // so the orphan count below can't see it).
          if (!opts.keepFile) deleteStampFileIfOrphan(file);
          setStatusTransient('Stamp removed from the gallery');
        },
      });
    },
    [confirm, mutateDb, deleteStampFileIfOrphan, setStatusTransient]
  );

  const deleteCharacterNow = useCallback(
    (characterId) => {
      const victim = dbRef.current?.characters.find((c) => c.id === characterId);
      mutateDb((d) => ({ ...d, characters: d.characters.filter((c) => c.id !== characterId) }));
      if (victim) {
        /* 1.7.5 — THE DEATH ROW TAKES THE FILES (see utils/imageDeaths.js —
           the "undo restores a broken image" cure): the unlinks wait until
           no snapshot can resurrect the character — an undone delete
           brings every picture back WHOLE. */
        victim.versions?.forEach((v) => v.images?.forEach((img) => markImageDead(img.file)));
        // Stamps are SHARED files — only delete the ones nothing else uses
        // (the template library or other characters).
        (victim.stamps || []).forEach((s) => deleteStampFileIfOrphan(s.image));
      }
      setView({ mode: 'grid' });
      setPanelCharacterId(null);
      setStatusTransient('Card deleted');
    },
    [mutateDb, deleteStampFileIfOrphan, setStatusTransient]
  );

  const askDeleteCharacter = useCallback(
    (character) => {
      confirm({
        title: 'DELETE CARD',
        message: `Delete "${stripRichText(character.name)}" with ${character.versions.length} version(s) and all of its images? This cannot be undone.`,
        confirmLabel: 'DELETE',
        danger: true,
        onConfirm: () => deleteCharacterNow(character.id),
      });
    },
    [confirm, deleteCharacterNow]
  );

  // 0.41.0 — renameCharacter is RETIRED with the standalone rename window
  // ("remove rename card button and option and just include it in the card
  // look options, and edit it to be edit card instead"): the card's name is
  // edited inside the EDIT CARD window, which commits it through
  // patchCharacter like every other card field.

  const openCharacter = useCallback((id) => {
    if (dbRef.current?.settings?.detailPanel !== false) setPanelCharacterId(id);
    else setView({ mode: 'character', id });
  }, []);

  // 1.2.6 — THE OPEN CARD'S CLICK CLOSES IT ("when pressing on a card that
  // is already opened it should close it"): the card body's click speaks a
  // TOGGLE now — the already-open card (the right panel's character, or the
  // full-window view's) folds away on its own click, exactly like a
  // disclosure. The context menu's explicit "open" keys keep openCharacter
  // (an open command should open, not toggle), and every other surface
  // (drop, keyboard, the tree) is untouched.
  const toggleOrOpenCard = useCallback((id) => {
    if (dbRef.current?.settings?.detailPanel !== false) {
      if (stateRef.current.panelCharacterId === id) setPanelCharacterId(null);
      else setPanelCharacterId(id);
      return;
    }
    const v = stateRef.current.view;
    if (v.mode === 'character' && v.id === id) setView({ mode: 'grid' });
    else setView({ mode: 'character', id });
  }, []);

  /* 1.7.2 — THE COVER'S GOODBYE RIDES A STABLE ANCESTOR ("closing
     animation for the expanded composed bottom panel is missing when i
     press on teh back button for fucks sake, it should at least fade out
     in this condition"): the live probe caught the 1.7.1 prop road dead —
     framer's AnimatePresence keeps the EXITING bar mounted through its
     height exit but renders the child's SNAPSHOT, so the retractRequest
     nonce raised on the same click never reached it: the effect that
     armed the cover's CSS-out never ran, the cover rode the bar's fall
     at FULL opacity and tore with the presence at its last frame — the
     closing animation missing exactly as reported. The retract class
     now seats on document.body — an ancestor that never exits — and the
     CSS law below fades the cover from there, whichever back spoke it
     (the panel's or the full window's), while the bar falls and the
     panel parks its width. The class retires a beat after the tear
     (380ms) and a fresh EXPAND strips it on sight, so a cover born
     inside the window never inherits a stale goodbye. */
  const coverRetractTimerRef = useRef(0);
  const armCoverRetract = useCallback(() => {
    try {
      document.body.classList.add('gd-cover-retract');
    } catch {
      /* a body-less host (tests) — nothing to seat */
    }
    if (coverRetractTimerRef.current) clearTimeout(coverRetractTimerRef.current);
    coverRetractTimerRef.current = setTimeout(() => {
      coverRetractTimerRef.current = 0;
      try {
        document.body.classList.remove('gd-cover-retract');
      } catch {}
    }, 380);
  }, []);
  useEffect(
    () => () => {
      if (coverRetractTimerRef.current) clearTimeout(coverRetractTimerRef.current);
    },
    []
  );

  // 1.1.1 — THE RETRACT-AWARE BACK ("clicking back while the output window
  // is expanded stretches it then it dissapears, fix that so it gets
  // retracted too"). framer's exit law freezes every child flight inside an
  // exiting parent (the B2 probe: the bar's height tween and the cover's
  // slide never ran — the whole column rode the parent's fade and vanished
  // in one frame). So the back is TWO PHASES now: while the output cover is
  // expanded, the first click raises the retract nonce (the cover plays its
  // contract flight on the LIVE tree) and the view close follows a beat
  // later — the user SEES the window retract instead of watching it smear
  // away with the parent. A collapsed cover (the common case) closes
  // exactly as before, with the view's own exit flight. The context menu's
  // "Back to the grid" rides the same road.
  const closeViewToGrid = useCallback(() => {
    if (outputExpandedRef.current) {
      retractNonceRef.current += 1;
      setRetractRequest(retractNonceRef.current);
      armCoverRetract();
      if (retractTimerRef.current) clearTimeout(retractTimerRef.current);
      retractTimerRef.current = setTimeout(() => {
        retractTimerRef.current = 0;
        setView({ mode: 'grid' });
      }, 200);
      return;
    }
    setView({ mode: 'grid' });
  }, [armCoverRetract]);
  // never leak the pending close: the view could close by other means
  // (delete, reset) while the retract flight is still running.
  useEffect(
    () => () => {
      if (retractTimerRef.current) clearTimeout(retractTimerRef.current);
    },
    []
  );
  // 1.1.1 — THE RESTART KEY ("add on the top bar 2 buttons, one next to the
  // save which would restart the app from the splash screen, think of it as
  // a refresh, would warn the user if there is unsaved changes and require
  // confirmation"). A reload IS the restart here: renderer.js replays the
  // theme snapshot before the first paint, so the window comes back through
  // the splash (the full boot ceremony — sweep, phases, pulse) with the
  // user's theme already on. Unsaved work gets the confirm window first; a
  // clean tree reloads straight away.
  const restartApp = useCallback(() => {
    if (unsavedRef.current) {
      confirm({
        title: 'RESTART APP',
        message: 'There are unsaved changes. Restarting now will discard them.',
        confirmLabel: 'RESTART ANYWAY',
        danger: true,
        onConfirm: () => window.location.reload(),
      });
      return;
    }
    window.location.reload();
  }, [confirm]);

  // 1.3.2 — THE PREVIEW SYSTEM IS RETIRED ("honestly, just remove the
  // preview system and options, just make it so the thumbnail is auto
  // generated and thats it because im giving up"): the GENERATE key, the
  // titlebar's thumb key, the ERASE key and every verdict they spoke are
  // GONE — here and in main.js, preload.js, SettingsModal and Titlebar.
  // The thumbnail + preview copies build automatically in the same breath
  // an image imports (main.js saveImage, always on), and the covers read
  // the lightest tier each record owns (GridView's prev-or-thumb law).
  // There is nothing to configure, nothing to run, nothing to erase.

  // --------------------------------------------------------------------------
  // 1.1.2 — LIBRARY PORTABILITY ("add library import/export, also include
  // logic to tie them to their images as it claims a zip file, and let it
  // also read the zip file and extract it to import the data").
  // EXPORT: one zip — gendex_db.json + every referenced image (the renderer
  // holds the LIVE db, unsaved edits included; main collects the files and
  // writes the archive through the save dialog).
  // IMPORT: pick+validate (nothing written) → the verdict window (MERGE /
  // REPLACE / CANCEL) → the commit writes the image files (collisions land
  // under fresh names with a remap) → THIS side lands the db through the
  // normal mutateDb road: merge re-mints every colliding id (classes, tags,
  // stamps, characters) and repoints the references (children parentId,
  // characters' classId + tag ids, every image file/thumb/prev + stamp art
  // through the file remap); replace simply installs the sanitized archive
  // as the whole library (image files on disk stay, exactly like RESET).
  // --------------------------------------------------------------------------
  const exportLibrary = useCallback(async () => {
    if (!dbRef.current || !api?.exportLibrary) {
      setStatusTransient('Library export is not available here');
      return;
    }
    setStatus('Exporting library…');
    try {
      const res = await api.exportLibrary(JSON.stringify(dbRef.current));
      if (res?.ok) {
        const mb = res.bytes ? ` (${(res.bytes / 1048576).toFixed(1)} MB)` : '';
        setStatusTransient(
          `Library exported · ${res.images} image${res.images === 1 ? '' : 's'}${mb}${res.missing ? ` · ${res.missing} missing on disk` : ''}`
        );
      } else if (!res?.canceled) {
        setStatusTransient(res?.error || 'Library export failed', 'fail');
      } else {
        setStatusTransient('Ready');
      }
    } catch {
      setStatusTransient('Library export failed', 'fail');
    }
  }, [api, setStatus, setStatusTransient]);

  // The import's pending verdict: { counts, path, db, images } from the
  // pick (kept in a ref — the buffers never ride React state; the modal
  // only needs the counts + path for its sentence).
  const importPendingRef = useRef(null);
  const [importPendingView, setImportPendingView] = useState(null); // { counts, path }

  const importLibrary = useCallback(async () => {
    if (!api?.importLibraryPick) {
      setStatusTransient('Library import is not available here');
      return;
    }
    setStatus('Reading library archive…');
    try {
      const res = await api.importLibraryPick();
      if (!res?.ok) {
        setStatusTransient(res?.canceled ? 'Ready' : res?.error || 'The archive could not be read', res?.canceled ? undefined : 'fail');
        return;
      }
      setStatusTransient('Ready');
      importPendingRef.current = { db: res.db, images: res.images || [] };
      setImportPendingView({ counts: res.counts || {}, path: res.path || '' });
    } catch {
      setStatusTransient('The archive could not be read', 'fail');
    }
  }, [api, setStatus, setStatusTransient]);

  // The commit: one road for both verdicts. `mode` is 'merge' | 'replace'.
  const importLibraryCommit = useCallback(
    (mode) => {
      const pending = importPendingRef.current;
      setImportPendingView(null);
      if (!pending) return;
      const finish = (label) => {
        importPendingRef.current = null;
        setStatusTransient(label);
      };
      const fail = (label) => {
        importPendingRef.current = null;
        setStatusTransient(label, 'fail');
      };
      const run = async () => {
        setStatus(mode === 'merge' ? 'Merging library…' : 'Importing library…');
        // 1) the FILES land first (collision-safe names + the remap).
        const committed = await api.importLibraryCommit({ images: pending.images || [] });
        if (!committed?.ok) {
          fail(committed?.error || 'The archive images could not be written');
          return;
        }
        const fileMap = committed.fileMap || {};
        const remapFile = (name) => fileMap[String(name)] ?? String(name);
        // 2) the db lands through the sanitizer (the archive's shapes are
        //    foreign until createSafeDb has spoken — ids, settings, records).
        const incoming = createSafeDb(pending.db);
        if (!incoming) {
          fail('The archive database could not be read');
          return;
        }
        // 3) the file remap rides every image reference the db carries.
        const remapped = {
          ...incoming,
          characters: (incoming.characters || []).map((ch) => ({
            ...ch,
            classId: ch.classId,
            stamps: (ch.stamps || []).map((s) => ({ ...s, image: remapFile(s.image) })),
            versions: (ch.versions || []).map((v) => ({
              ...v,
              images: (v.images || []).map((img) => ({
                ...img,
                file: remapFile(img.file),
                thumb: img.thumb ? remapFile(img.thumb) : img.thumb,
                prev: img.prev ? remapFile(img.prev) : img.prev,
              })),
            })),
          })),
          stamps: (incoming.stamps || []).map((s) => ({ ...s, image: remapFile(s.image) })),
        };
        if (mode === 'replace') {
          mutateDb(() => remapped, 'import:replace');
          finish(
            `Library imported: ${(remapped.characters || []).length} card${(remapped.characters || []).length === 1 ? '' : 's'} · ${Object.keys(fileMap).length} image${Object.keys(fileMap).length === 1 ? '' : 's'}`
          );
          return;
        }
        // MERGE: colliding ids re-mint, references repoint, locals survive.
        mutateDb(
          (d) => {
            const classIdMap = new Map();
            for (const cls of remapped.classes || []) {
              if (d.classes.some((c) => c.id === cls.id)) classIdMap.set(cls.id, uuidv4());
            }
            const tagIdMap = new Map();
            for (const tag of remapped.tags || []) {
              if ((d.tags || []).some((t) => t.id === tag.id)) tagIdMap.set(tag.id, (d.tags || []).find((t) => t.id === tag.id).id);
            }
            const stampIdMap = new Map();
            for (const st of remapped.stamps || []) {
              if ((d.stamps || []).some((s) => s.id === st.id)) stampIdMap.set(st.id, uuidv4());
            }
            const charIdMap = new Map();
            for (const ch of remapped.characters || []) {
              if (d.characters.some((c) => c.id === ch.id)) charIdMap.set(ch.id, uuidv4());
            }
            const mapClass = (id) => classIdMap.get(id) || id;
            const mapTag = (id) => tagIdMap.get(id) || id;
            const classesIn = (remapped.classes || []).map((cls) => ({
              ...cls,
              id: mapClass(cls.id),
              parentId: cls.parentId && cls.parentId !== ROOT_CLASS_ID ? mapClass(cls.parentId) : cls.parentId,
            }));
            const tagsIn = (remapped.tags || []).filter((tag) => !tagIdMap.has(tag.id));
            const stampsIn = (remapped.stamps || []).map((st) => ({ ...st, id: stampIdMap.get(st.id) || st.id }));
            const charsIn = (remapped.characters || []).map((ch) => ({
              ...ch,
              id: charIdMap.get(ch.id) || ch.id,
              classId: ch.classId && ch.classId !== ROOT_CLASS_ID ? mapClass(ch.classId) : ch.classId,
              tags: (ch.tags || []).map(mapTag),
            }));
            return {
              ...d,
              classes: [...d.classes, ...classesIn],
              tags: [...(d.tags || []), ...tagsIn],
              stamps: [...(d.stamps || []), ...stampsIn],
              characters: [...d.characters, ...charsIn],
            };
          },
          'import:merge'
        );
        const added = (remapped.characters || []).length;
        finish(`Library merged: ${added} card${added === 1 ? '' : 's'} joined · ${Object.keys(fileMap).length} image${Object.keys(fileMap).length === 1 ? '' : 's'} written`);
      };
      run();
    },
    [api, mutateDb, setStatus, setStatusTransient]
  );

  // 1.0.2 — THE REMOTE EDIT-CARD REQUEST ("when right clicking on a card and
  // selecting edit card nothing happens"): the grid card's right-click Edit
  // key used to only OPEN the card — a literal no-op when that card was
  // already sitting in the panel (or the full-window view). 1.0.3 — THE
  // WINDOW STANDS ALONE ("fix the issue where right click and editing the
  // card it would pop the details panel right away"): the request no longer
  // opens the card AT ALL — the EDIT CARD window itself now lives at App
  // level (see the CardLookModal mount by ToastHub), so picking Edit card
  // pops the window OVER whatever is on screen without touching the panel,
  // the grid or the full-window view.
  // The nonce is a monotonically rising counter (never Date.now(), which can
  // collide inside one ms) and the request is CONSUMED when the window
  // closes — so a plain card open (1.0.3's other half: "when i open a card
  // it would pop the edit card window right away") can never inherit a stale
  // request and accidentally pop the window.
  const lookNonceRef = useRef(0);
  const [lookRequest, setLookRequest] = useState(null); // { id, nonce }
  const openCardLook = useCallback((id) => {
    lookNonceRef.current += 1;
    setLookRequest({ id, nonce: lookNonceRef.current });
  }, []);

  const reorderCharacters = useCallback(
    (draggedId, targetId, side) => {
      const current = dbRef.current;
      if (!current || draggedId === targetId) return;
      if (!current.characters.some((c) => c.id === draggedId)) return;
      if (!current.characters.some((c) => c.id === targetId)) return;
      // 1.1.5 — THE CUSTOM BASE IS WHAT YOU SEE ("the custom order isnt
      // working properly, as when i go back to newest first it defaults to
      // the same… fix that so it saves the state of the custom once an edit
      // has occured like moving a card to the right or left of another
      // card"): a drag committed while the grid wears a SORT (newest /
      // oldest / a-z) used to splice the RAW array — indices that have
      // nothing to do with the order on screen — and then flip the mode to
      // custom, so the "custom order" that loaded was the OLD array plus a
      // cut at a meaningless seat. The splice now lands on the VISUAL
      // order: when a sort is being worn, the array is first re-based to
      // exactly what the screen shows (the same sortCharacters pass the
      // grid just rendered), and the move is applied on top of that. The
      // custom order only ever changes when an EDIT happens — a mere
      // look at newest/oldest never rewrites it (no drag, no bake).
      const mode = sortModeRef.current;
      mutateDb((d) => {
        const list = mode !== 'custom' ? sortCharacters([...d.characters], mode) : [...d.characters];
        const di = list.findIndex((c) => c.id === draggedId);
        if (di < 0) return d;
        const [moved] = list.splice(di, 1);
        let ti = list.findIndex((c) => c.id === targetId);
        if (ti < 0) return d;
        if (side === 'right') ti += 1;
        list.splice(ti, 0, moved);
        return { ...d, characters: list };
      });
      if (mode !== 'custom') {
        setSortMode('custom');
        setSetting('defaultSortMode', 'custom');
      }
      setStatusTransient('Card order updated');
    },
    [mutateDb, setSetting, setStatusTransient]
  );

  const assignCharacterClass = useCallback(
    (characterId, classId) => {
      mutateDb((d) => ({
        ...d,
        characters: d.characters.map((c) => (c.id === characterId ? { ...c, classId: classId || ROOT_CLASS_ID } : c)),
      }));
      const label = classId === ROOT_CLASS_ID ? 'Unsorted' : classLabelPath(dbRef.current?.classes || [], classId);
      setStatusTransient(`Moved to ${label}`);
    },
    [mutateDb, setStatusTransient]
  );

  // --------------------------------------------------------------------------
  // Class mutations
  // --------------------------------------------------------------------------
  const addClass = useCallback(
    (name, parentId, icon = null, color = null) => {
      const cls = makeClass(name, parentId || ROOT_CLASS_ID, icon, color);
      mutateDb((d) => ({ ...d, classes: [...d.classes, cls] }));
      setSelectedClassId(cls.id);
      setStatusTransient(`Class "${cls.name}" created`);
    },
    [mutateDb, setStatusTransient]
  );

  const renameClass = useCallback(
    (id, name, icon = null, color = null) => {
      mutateDb((d) => ({
        ...d,
        classes: d.classes.map((c) => (c.id === id ? { ...c, name, icon, color } : c)),
      }));
      setStatusTransient('Class updated');
    },
    [mutateDb, setStatusTransient]
  );

  const deleteClassNow = useCallback(
    (id) => {
      mutateDb((d) => {
        const doomed = new Set([id]);
        let grew = true;
        while (grew) {
          grew = false;
          for (const c of d.classes) {
            if (!doomed.has(c.id) && doomed.has(c.parentId || ROOT_CLASS_ID)) {
              doomed.add(c.id);
              grew = true;
            }
          }
        }
        return {
          ...d,
          classes: d.classes.filter((c) => !doomed.has(c.id)),
          characters: d.characters.map((c) => (doomed.has(c.classId || ROOT_CLASS_ID) ? { ...c, classId: ROOT_CLASS_ID } : c)),
        };
      });
      setSelectedClassId((prev) => (prev === id ? ROOT_CLASS_ID : prev));
      setStatusTransient('Class deleted: cards moved to Unsorted');
    },
    [mutateDb, setStatusTransient]
  );

  const moveClass = useCallback(
    (dragId, targetId, zone) => {
      mutateDb((d) => ({ ...d, classes: moveClassInTree(d.classes, dragId, targetId, zone) }));
    },
    [mutateDb]
  );

  // --------------------------------------------------------------------------
  // 0.30.0 — THE RIGHT-CLICK MENU. Editable targets (inputs, textareas,
  // contentEditable) keep the NATIVE menu — its cut/copy/paste/select-all
  // roles already run with correct enablement. Everything else gets the
  // app's own styled menu, built from whatever is under the cursor:
  //   · a CARD -> Edit selected / Rename / Delete (confirm)
  //   · a class tree row -> New class inside / Delete class (confirm)
  //   · any surface -> New card, New class, Copy (text selection),
  //     Paste (clipboard image), Select all, Undo / Redo
  // (Declared after the class/character mutations it calls — declaration
  // order hygiene, the same law the 0.24.0 confirm-hoist wrote.)
  // --------------------------------------------------------------------------
  const copySelectionText = useCallback(async () => {
    const text = String(window.getSelection?.()?.toString?.() || '').trim();
    if (!text) {
      setStatusTransient('Nothing selected to copy');
      return;
    }
    try {
      await api.clipboardWriteText(text);
      setStatusTransient('Copied ✓');
    } catch {
      setStatusTransient('Copy failed', 'fail');
    }
  }, [api, setStatusTransient]);

  const selectAllVisible = useCallback(
    (scopeEl) => {
      const sel = window.getSelection?.();
      if (!sel || typeof document.createRange !== 'function') return;
      const range = document.createRange();
      range.selectNodeContents(scopeEl || document.body);
      sel.removeAllRanges();
      sel.addRange(range);
      setStatusTransient('Selected');
    },
    [setStatusTransient]
  );

  const askDeleteClassById = useCallback(
    (classId) => {
      const cls = dbRef.current?.classes.find((c) => c.id === classId);
      if (!cls) return;
      confirm({
        title: 'DELETE CLASS',
        message: `Delete "${stripRichText(cls.name)}" and its subclasses? Characters move to Unsorted. This cannot be undone.`,
        confirmLabel: 'DELETE',
        danger: true,
        onConfirm: () => deleteClassNow(cls.id),
      });
    },
    [confirm, deleteClassNow]
  );

  useEffect(() => {
    // 0.31.0 — PER-REGION CONTEXT MENUS ("each region ... would have
    // different right click context windows, since so far they all look the
    // same"). Detection runs in priority order: a CARD wins over its
    // viewer; a CLASS ROW wins over the tree; otherwise the nearest
    // [data-gd-region] names the surface. Every menu opens with a header
    // chip naming its region and speaks ONLY that region's language — no
    // more generic crew appended to everything.
    //
    // 0.32.0 — TWO NEW LAWS:
    //   · "make the selection text context window stylized like the rest" —
    //     the NATIVE menu is retired: editable fields now get the app's OWN
    //     pill (cut / copy / paste / delete / select all — undo / redo on
    //     the rich boxes, where execCommand can actually drive them), and
    //     inside windows a selected text run gets the stylized Copy crew
    //     while pictures offer Copy image. Nothing OS-styled pops anywhere.
    //   · "i dont think i will be right clicking on the dropdown of
    //     spotlight or sorting options for example" — the app's DROPDOWN
    //     surfaces (popover cards + their backdrops) and the open menu
    //     itself never answer the right button at all.
    const buildTextMenu = (el, x, y) => {
      const isField = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA';
      // Snapshot the selection WHILE it is live: picking a menu button
      // takes the focus off the field, so the saved span (or range) is put
      // back before any command runs.
      let selStart = 0;
      let selEnd = 0;
      let range = null;
      if (isField) {
        selStart = el.selectionStart ?? 0;
        selEnd = el.selectionEnd ?? 0;
      } else {
        const s = window.getSelection?.();
        if (s && s.rangeCount > 0 && el.contains(s.anchorNode)) {
          try {
            range = s.getRangeAt(0).cloneRange();
          } catch {
            range = null;
          }
        }
      }
      const hasSel = isField ? selEnd > selStart : !!(range && !range.collapsed);
      const refocus = () => {
        el.focus();
        if (isField) {
          try {
            el.setSelectionRange(selStart, selEnd);
          } catch {
            /* a field without selection APIs — focus is the best we can do */
          }
        } else if (range) {
          const s = window.getSelection?.();
          try {
            s.removeAllRanges();
            s.addRange(range);
          } catch {
            /* the DOM moved under us — the caret lands where the browser puts it */
          }
        }
      };
      const run = (cmd) => () => {
        refocus();
        try {
          document.execCommand(cmd);
        } catch {
          /* quiet — the field simply keeps its text */
        }
      };

      const items = [{ id: 'hdr', header: 'TEXT' }];
      // Undo / Redo only where they truly work: the RICH boxes are
      // contentEditable, whose native undo execCommand drives. The plain
      // <input>/<textarea> undo stack is internal to the control and
      // unreachable from JS — those fields keep their keyboard Ctrl+Z
      // instead of a menu key that lies.
      if (!isField) {
        items.push(
          { id: 'undo', label: 'Undo', icon: Undo2, onPick: run('undo') },
          { id: 'redo', label: 'Redo', icon: Redo2, onPick: run('redo') },
          { id: 'sep-0', separator: true }
        );
      }
      items.push(
        { id: 'cut', label: 'Cut', icon: Scissors, disabled: !hasSel, onPick: run('cut') },
        { id: 'copy', label: 'Copy', icon: Copy, disabled: !hasSel, onPick: run('copy') },
        // Paste runs through the main process (webContents.paste) — the
        // browser's own paste into the refocused field, so rich boxes keep
        // their plain-text-only paste rule.
        { id: 'paste', label: 'Paste', icon: ClipboardPaste, onPick: () => { refocus(); api?.pasteToFocused?.(); } },
        { id: 'sep-1', separator: true },
        { id: 'delete', label: 'Delete', icon: Trash2, disabled: !hasSel, onPick: run('delete') },
        {
          id: 'selectall',
          label: 'Select all',
          onPick: () => {
            if (isField) {
              el.focus();
              if (typeof el.select === 'function') el.select();
            } else {
              selectAllVisible(el);
            }
          },
        }
      );
      setCtxMenu({ x, y, items });
    };

    const onContext = (e) => {
      if (typeof document === 'undefined' || !document.querySelector) return;
      const target = e.target;
      if (!target || typeof target.closest !== 'function') return;

      // 0.32.0 — EDITABLE FIELDS speak the app's STYLIZED text menu now
      // ("make the selection text context window stylized like the rest") —
      // everywhere, windows included. The old carve-out handed them to the
      // OS menu; the OS menu is gone. This runs BEFORE the dropdown
      // suppression so a field LIVING inside a popover (a picker's hex box)
      // still gets its text menu.
      const editable = target.closest('input, textarea, [contenteditable="true"], [contenteditable=""]');
      if (editable) {
        e.preventDefault();
        buildTextMenu(editable, e.clientX, e.clientY);
        return;
      }

      // 0.32.0 — DROPDOWNS + the open menu itself never spawn menus (the
      // spotlight popover, the sort menu, every portaled picker — and their
      // fixed backdrops).
      if (target.closest('[data-gd-popover], .gd-ctx-menu')) {
        e.preventDefault();
        return;
      }

      // A modal is open — the modal's own surfaces: a selected text run
      // gets the stylized Copy crew, a picture offers Copy image, anything
      // else stays quiet (the native menu is retired app-wide).
      if (document.querySelector('[data-gd-modal]')) {
        const sel = String(window.getSelection?.()?.toString?.() || '').trim();
        if (sel) {
          e.preventDefault();
          setCtxMenu({
            x: e.clientX,
            y: e.clientY,
            items: [
              { id: 'hdr', header: 'SELECTION' },
              {
                id: 'copy',
                label: 'Copy',
                icon: Copy,
                onPick: async () => {
                  try {
                    await api.clipboardWriteText(sel);
                    setStatusTransient('Copied ✓');
                  } catch {
                    setStatusTransient('Copy failed', 'fail');
                  }
                },
              },
              { id: 'sep-1', separator: true },
              {
                id: 'selectall',
                label: 'Select all',
                onPick: () => selectAllVisible(target.closest('[data-gd-modal]') || document.body),
              },
            ],
          });
          return;
        }
        const img = target.closest('img');
        if (img) {
          // 0.32.0 — pictures inside windows offer COPY IMAGE through the
          // stylized menu (the file is read from the images folder in the
          // main process — the src is a local-resource URL).
          e.preventDefault();
          const src = img.getAttribute('src') || '';
          // The src is a local-resource URL whose whole path is encoded —
          // decode first, then keep the bare FILENAME.
          let name = '';
          try {
            name = decodeURIComponent(src).split(/[\\/]/).pop() || '';
          } catch {
            name = src.split('/').pop() || '';
          }
          setCtxMenu({
            x: e.clientX,
            y: e.clientY,
            items: [
              { id: 'hdr', header: 'IMAGE' },
              {
                id: 'copyimg',
                label: 'Copy image',
                icon: Copy,
                disabled: !name,
                onPick: async () => {
                  try {
                    const res = await api?.clipboardWriteImageFile?.(name);
                    setStatusTransient(res?.ok ? 'Image copied ✓' : 'Copy failed', res?.ok ? 'ok' : 'fail');
                  } catch {
                    setStatusTransient('Copy failed', 'fail');
                  }
                },
              },
            ],
          });
        }
        return;
      }
      // The image STAGE owns its own menu (ImageStage stops propagation
      // before this listener ever sees the press); nothing to do here.

      // 0.33.0 — SELECTED TEXT ANYWHERE speaks Copy. 1.2.0 — ONLY WHEN THE
      // PRESS LANDS ON THE RUN ITSELF ("if i have text selected but i right
      // click on something else, deselect it first then right click should
      // pop normally, only when right clicking on selected text is where it
      // would have the copy or select all function etc"): the old law let a
      // live selection anywhere outrank every region menu, so right-clicking
      // a card or the grid while a run stayed selected still opened the
      // SELECTION crew. The press now tests whether the target sits INSIDE
      // the selection: on it — Copy + Select all, exactly the OS way; off
      // it — the selection is cleared and the pill falls through to the
      // normal region menu for whatever is under the cursor. Editable
      // fields kept their own fuller text menu above.
      const liveSel = typeof window !== 'undefined' && window.getSelection ? window.getSelection() : null;
      const selNow = String(liveSel?.toString?.() || '').trim();
      const selectionOwnsTarget = (() => {
        if (!selNow || !liveSel || !target || typeof target !== 'object') return false;
        try {
          if (typeof liveSel.containsNode === 'function') return liveSel.containsNode(target, true);
        } catch {
          /* fall through to the range test */
        }
        try {
          const ranges = typeof liveSel.rangeCount === 'number' ? liveSel.rangeCount : 0;
          for (let ri = 0; ri < ranges; ri += 1) {
            const rng = liveSel.getRangeAt(ri);
            if (rng && typeof rng.intersectsNode === 'function' && rng.intersectsNode(target)) return true;
          }
        } catch {
          /* best effort */
        }
        return false;
      })();
      if (selNow && !selectionOwnsTarget) {
        // the press is OFF the run: deselect it first, then the normal
        // menu speaks for the surface under the cursor (below).
        try {
          liveSel?.removeAllRanges?.();
        } catch {
          /* a stuck selection never blocks the menu */
        }
      } else if (selNow) {
        e.preventDefault();
        const scope =
          target.closest('.gd-tex-viewer, .gd-tex-panel, .gd-leftcol, main, [data-gd-modal]') ||
          document.body;
        setCtxMenu({
          x: e.clientX,
          y: e.clientY,
          items: [
            { id: 'hdr', header: 'SELECTION' },
            {
              id: 'copy',
              label: 'Copy',
              icon: Copy,
              onPick: async () => {
                try {
                  await api.clipboardWriteText(selNow);
                  setStatusTransient('Copied ✓');
                } catch {
                  setStatusTransient('Copy failed', 'fail');
                }
              },
            },
            { id: 'selectall', label: 'Select all', onPick: () => selectAllVisible(scope) },
          ],
        });
        return;
      }

      // 0.43.0 — BUTTONS SPEAK THEIR OWN OPTIONS ("sometimes when i right
      // click over buttons like the settings button of the details pannel …
      // it would do undo and redo — i want it so if its above a button that it
      // would show the options of the button alongside the undo and redo").
      // 0.44.0 — THE "PRESS" ROW IS GONE ("fix the issue where right clicking
      // on buttons would say 'press that button' instead it should just be
      // called said actions, like right clicking on the pin etc"): the menu
      // now carries just the ACTIONS themselves — the app's undo / redo crew
      // under a header naming the key — never an entry that pretends to BE
      // the button. The 0.43 registered option sets (the card-settings gear)
      // are gone too: the gear is silent now (see CharSettingsMenu), and
      // every other key's only real options are the app-level ones.
      // 0.46.0 — THE TITLEBAR'S KEYS SAY NOTHING ("prevent right clicking on
      // the top bar buttons — the right panel, bottom panel and tooltip
      // switches and the undo and redo and save and settings and close and
      // minimize and maximize buttons"): every key in the titlebar region
      // (app furniture + OS window controls alike) swallows the press
      // silently. Their toggles are single-shot switches with no options
      // worth a menu, and undo/redo/save already wear their shortcuts in the
      // tooltips. Keys that DO own real actions keep their menus: the gear
      // crew (CharSettingsMenu), the pin, the filter/order keys below.
      const btn = target.closest('button');
      if (btn) {
        e.preventDefault();
        if (btn.closest('[data-gd-region="titlebar"]')) return;
        // 0.45.0 — THE FILTER / ORDER KEYS SPEAK FOR THEMSELVES ("on filters
        // or order it would just say clear selection and thats it"): two
        // toolbar keys carry data-gd-opts, and their whole menu is the ONE
        // action that makes sense there — clearing whatever selection that
        // popover owns (the tag/stamp filter states; the picked sort). No
        // undo/redo riders, no generic crew — just the action.
        const optsKey = btn.getAttribute('data-gd-opts');
        if (optsKey === 'filter' || optsKey === 'order') {
          const isFilter = optsKey === 'filter';
          const spot = spotlightRef.current || {};
          const activeSel =
            (spot.include?.length || 0) +
            (spot.exclude?.length || 0) +
            (spot.stamps?.length || 0) +
            (spot.stampExclude?.length || 0);
          setCtxMenu({
            x: e.clientX,
            y: e.clientY,
            items: [
              { id: 'hdr', header: isFilter ? 'FILTER' : 'ORDER' },
              {
                id: 'clear',
                label: 'Clear selection',
                icon: isFilter ? Ban : ArrowUpDown,
                disabled: isFilter ? activeSel === 0 : sortModeRef.current === 'custom',
                title: isFilter
                  ? 'Reset every tag and stamp filter to neutral'
                  : 'Return the grid to its custom order',
                onPick: () => {
                  if (isFilter) {
                    setSpotlight((s) => ({ ...(s || {}), include: [], exclude: [], stamps: [], stampExclude: [] }));
                  } else {
                    setSortAndPersist('custom');
                  }
                },
              },
            ],
          });
          return;
        }
        const rawLabel =
          (btn.getAttribute('title') || btn.getAttribute('aria-label') || btn.textContent || '')
            .replace(/\s+/g, ' ')
            .trim();
        // A short, menu-worthy name: the key's own text when it has one
        // (BACK, ADD, DONE…), else the first clause of its tooltip ("Pinned
        // — the tag and stamp rows…" → "PINNED"). Never a whole sentence.
        let name = (btn.textContent || '').replace(/\s+/g, ' ').trim();
        if (!name || name.length > 24) {
          name = rawLabel.split(/[—–]/)[0].trim();
        }
        if (name.length > 24) name = `${name.slice(0, 23)}…`;
        const header = (name || 'KEY').toUpperCase();
        setCtxMenu({
          x: e.clientX,
          y: e.clientY,
          items: [
            { id: 'hdr', header },
            { id: 'undo', label: 'Undo', icon: Undo2, shortcut: (shortcutsRef.current || DEFAULT_SHORTCUTS).undo, disabled: !undoStackRef.current.length, onPick: undo },
            { id: 'redo', label: 'Redo', icon: Redo2, shortcut: (shortcutsRef.current || DEFAULT_SHORTCUTS).redo, disabled: !redoStackRef.current.length, onPick: redo },
          ],
        });
        return;
      }

      // 0.43.0 — THE TOOLBARS AND HEADERS STAY QUIET ("to not do anything
      // when right clicking on the toolbars or the headers"): the top
      // titlebar, the viewer's toolbar row and the detail view's sticky
      // header bar used to answer with a generic menu — the bars themselves
      // now say nothing (their KEYS still speak through the button branch
      // above).
      {
        const barRegion = target.closest('[data-gd-region]')?.getAttribute('data-gd-region') || null;
        if (barRegion === 'titlebar' || barRegion === 'header' || target.closest('.gd-char-head')) {
          e.preventDefault();
          return;
        }
      }

      e.preventDefault();

      const sc = shortcutsRef.current || DEFAULT_SHORTCUTS;
      const items = [];
      const charId = target.closest('[data-gd-char-id]')?.getAttribute('data-gd-char-id') || null;
      const classId = target.closest('[data-gd-class-id]')?.getAttribute('data-gd-class-id') || null;
      const region = target.closest('[data-gd-region]')?.getAttribute('data-gd-region') || null;
      const character = charId ? dbRef.current?.characters.find((c) => c.id === charId) : null;
      const cls = classId && classId !== ROOT_CLASS_ID ? dbRef.current?.classes.find((c) => c.id === classId) : null;

      // Shared helpers -----------------------------------------------------
      const promptOf = (ch) => {
        const v = getPreviewVersion(ch) || (ch.versions || [])[0] || null;
        return v ? composeVersionOutput(v) : '';
      };
      const copyPromptOf = async (ch) => {
        const output = promptOf(ch);
        if (!output) {
          setStatusTransient('Nothing to compose yet');
          return;
        }
        try {
          await api.clipboardWriteText(output);
          setStatusTransient('Prompt copied ✓');
        } catch {
          setStatusTransient('Copy failed', 'fail');
        }
      };
      const openSettings = () =>
        setModal({ type: 'settings', snapshot: structuredClone(dbRef.current?.settings || {}) });

      if (character) {
        // === ON A CARD === ("on a card it will show the option to edit,
        //     delete etc..") — character actions only.
        //     0.41.0 — RENAME IS GONE ("remove rename card button and option
        //     and just include it in the card look options, and edit it to
        //     be edit card instead"): the card's name is edited inside the
        //     EDIT CARD window — reachable from the card view's settings
        //     menu and the panel's header.
        //     1.0.2 — THE EDIT KEY EDITS ("when right clicking on a card and
        //     selecting edit card nothing happens"): the key used to only
        //     OPEN the card, which read as nothing at all when the card was
        //     already open in the panel. 1.0.3 — it no longer even opens the
        //     card ("fix the issue where right click and editing the card it
        //     would pop the details panel right away"): openCardLook just
        //     requests the App-level EDIT CARD window, over whatever is on
        //     screen — fresh on every pick.
        //     1.1.8 — THE EXPAND / SHRINK KEY ("when right clicking on a
        //     card, add an option to expand it, which will allow the card
        //     to take 2 rows instead of one, while still remaining in the
        //     same aspect ratio"): the card doubles its width and height
        //     in the wall (the aspect ratio preserved by geometry — the
        //     same art box, twice the canvas), and the SAME KEY on the next
        //     right-click offers the shrink back to default. The state
        //     rides App (this menu's own home), through the
        //     expandedCardsRef mirror the once-bound listener reads.
        const name = stripRichText(character.name);
        const isCardExpanded = expandedCardsRef.current?.has?.(character.id) === true;
        items.push(
          { id: 'hdr', header: `CARD: ${name}` },
          { id: 'edit', label: 'Edit card', icon: SquarePen, onPick: () => openCardLook(character.id) },
          { id: 'duplicate', label: 'Duplicate', icon: CopyPlus, onPick: () => duplicateCharacter(character.id) },
          {
            id: 'expand',
            label: isCardExpanded ? 'Shrink to normal size' : 'Expand to double size',
            icon: isCardExpanded ? Shrink : Expand,
            onPick: () => toggleCardExpand(character.id),
          },
          { id: 'sep-1', separator: true },
          { id: 'copyprompt', label: 'Copy prompt', icon: Copy, disabled: !promptOf(character), onPick: () => copyPromptOf(character) },
          { id: 'sep-2', separator: true },
          { id: 'delete', label: 'Delete', icon: Trash2, danger: true, onPick: () => askDeleteCharacter(character) }
        );
      } else if (cls) {
        // === ON A CLASS ROW (left tree) === ("when right clicking on a class
        //     it only lets me edit the name, remove the edit name and let it
        //     just be edit the class"): the single EDIT CLASS key opens the
        //     tree's FULL editor (name + icon + color + preview) — not the
        //     bare rename window anymore.
        //     1.1.0 — THE CREATION KEYS SWAP SEATS ("swap the new class under
        //     class and new card in class"): the menu used to lead with NEW
        //     CARD, then NEW CLASS — while the root class row and the tree's
        //     empty area both lead with NEW CLASS, then NEW CARD. Every class
        //     row now speaks the same order: class under the class first,
        //     then card in the class — one grammar for the whole tree.
        const name = stripRichText(cls.name);
        items.push(
          { id: 'hdr', header: `CLASS: ${name}` },
          { id: 'newclass-under', label: `New class under "${name}"`, icon: FolderPlus, onPick: () => addClass('New Class', cls.id) },
          { id: 'newchar-in', label: `New card in "${name}"`, icon: Plus, onPick: () => setModal({ type: 'newCharacter', classId: cls.id }) },
          { id: 'edit', label: 'Edit class', icon: Pencil, onPick: () => setEditClassId(cls.id) },
          { id: 'sep-1', separator: true },
          { id: 'delete', label: 'Delete class', icon: Trash2, danger: true, onPick: () => askDeleteClassById(cls.id) }
        );
      } else if (region === 'tree') {
        // === LEFT TREE, EMPTY AREA === ("on empty area on left tree it
        //     will be create a new class, etc..").
        items.push(
          { id: 'hdr', header: 'CLASS TREE' },
          { id: 'newclass', label: 'New class', icon: FolderPlus, onPick: () => addClass('New Class', ROOT_CLASS_ID) },
          { id: 'newchar', label: 'New card', icon: Plus, shortcut: sc.newCharacter, onPick: () => setModal({ type: 'newCharacter' }) },
          { id: 'sep-1', separator: true },
          { id: 'undo', label: 'Undo', icon: Undo2, shortcut: sc.undo, disabled: !undoStackRef.current.length, onPick: undo },
          { id: 'redo', label: 'Redo', icon: Redo2, shortcut: sc.redo, disabled: !redoStackRef.current.length, onPick: redo }
        );
      } else if (region === 'charview' || region === 'panel') {
        // === THE CARD VIEW (full window) / THE RIGHT PANEL === —
        //     the open card's actions. The image stage inside keeps
        //     its own menu; the prompt sheet (compose) too.
        const ch =
          region === 'panel'
            ? dbRef.current?.characters.find((c) => c.id === stateRef.current.panelCharacterId)
            : dbRef.current?.characters.find((c) => c.id === stateRef.current.view?.id);
        if (ch) {
          const name = stripRichText(ch.name);
          items.push(
            { id: 'hdr', header: `CARD: ${name}` },
            // 1.0.2 — EDIT CARD rides the open card's own menu too (the
            // lookRequest nonce pops the window whether this view is the
            // panel or the full window).
            { id: 'editlook', label: 'Edit card', icon: SquarePen, onPick: () => openCardLook(ch.id) },
            region === 'panel'
              ? { id: 'full', label: 'Open in full window', icon: Maximize2, onPick: () => openCharacter(ch.id) }
              : { id: 'back', label: 'Back to the grid', icon: ArrowLeft, onPick: closeViewToGrid },
            { id: 'sep-1', separator: true },
            { id: 'copyprompt', label: 'Copy prompt', icon: Copy, disabled: !promptOf(ch), onPick: () => copyPromptOf(ch) },
            { id: 'sep-2', separator: true },
            { id: 'undo', label: 'Undo', icon: Undo2, shortcut: sc.undo, disabled: !undoStackRef.current.length, onPick: undo },
            { id: 'redo', label: 'Redo', icon: Redo2, shortcut: sc.redo, disabled: !redoStackRef.current.length, onPick: redo },
            { id: 'sep-3', separator: true },
            { id: 'delete', label: 'Delete', icon: Trash2, danger: true, onPick: () => askDeleteCharacter(ch) }
          );
        } else {
          items.push(
            { id: 'hdr', header: 'CARD PANEL' },
            { id: 'undo', label: 'Undo', icon: Undo2, shortcut: sc.undo, disabled: !undoStackRef.current.length, onPick: undo },
            { id: 'redo', label: 'Redo', icon: Redo2, shortcut: sc.redo, disabled: !redoStackRef.current.length, onPick: redo }
          );
        }
      } else if (region === 'compose') {
        // === THE PROMPT SHEET / COMPOSED OUTPUT === — output actions.
        const st = stateRef.current;
        const ch = dbRef.current?.characters.find(
          (c) => c.id === (st.panelCharacterId || (st.view?.mode === 'character' ? st.view.id : null))
        );
        const output = ch ? promptOf(ch) : '';
        items.push(
          { id: 'hdr', header: 'PROMPT SHEET' },
          { id: 'copyout', label: 'Copy output', icon: Copy, disabled: !output, onPick: () => copyPromptOf(ch) },
          {
            id: 'selectall',
            label: 'Select all',
            onPick: () => selectAllVisible(target.closest('.gd-compose-body, .gd-card') || document.body),
          },
          { id: 'sep-1', separator: true },
          { id: 'undo', label: 'Undo', icon: Undo2, shortcut: sc.undo, disabled: !undoStackRef.current.length, onPick: undo },
          { id: 'redo', label: 'Redo', icon: Redo2, shortcut: sc.redo, disabled: !redoStackRef.current.length, onPick: redo }
        );
      } else {
        // === THE CARD VIEWER, EMPTY AREA === (the default region —
        //     "on the card viewer empty area it will show create a new
        //     character, undo, redo, settings, etc..").
        //     0.33.0 — COPY left with the region menus' selection clause: a
        //     highlighted run now opens the SELECTION crew from ANYWHERE
        //     (see the selNow branch above), so a region Copy that can
        //     never be enabled was dead weight.
        const scope = target.closest('.gd-tex-viewer, .gd-tex-panel, .gd-leftcol, main') || document.body;
        items.push(
          { id: 'hdr', header: 'CARD VIEWER' },
          { id: 'newchar', label: 'New card', icon: Plus, shortcut: sc.newCharacter, onPick: () => setModal({ type: 'newCharacter' }) },
          { id: 'newclass', label: 'New class', icon: FolderPlus, onPick: () => addClass('New Class', selectedClassId) },
          { id: 'sep-1', separator: true },
          { id: 'paste', label: 'Paste image', icon: ClipboardPaste, onPick: pasteImageFromClipboard },
          { id: 'selectall', label: 'Select all', onPick: () => selectAllVisible(scope) },
          { id: 'sep-2', separator: true },
          { id: 'undo', label: 'Undo', icon: Undo2, shortcut: sc.undo, disabled: !undoStackRef.current.length, onPick: undo },
          { id: 'redo', label: 'Redo', icon: Redo2, shortcut: sc.redo, disabled: !redoStackRef.current.length, onPick: redo },
          { id: 'sep-3', separator: true },
          { id: 'settings', label: 'Settings', icon: SettingsIcon, shortcut: sc.settings, onPick: openSettings }
        );
      }

      setCtxMenu({ x: e.clientX, y: e.clientY, items });
    };
    document.addEventListener('contextmenu', onContext);
    return () => document.removeEventListener('contextmenu', onContext);
     
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addClass, askDeleteCharacter, askDeleteClassById, copySelectionText, duplicateCharacter, openCardLook, openCharacter, pasteImageFromClipboard, redo, saveDb, selectAllVisible, selectedClassId, setSortAndPersist, undo]);

  // --------------------------------------------------------------------------
  // Tag mutations + filters
  // --------------------------------------------------------------------------
  const addTag = useCallback(
    (name, color, icon = null, trim = 'straight', finish = 'none') => {
      // 1.4.3 — the finish rides the tag's own record (the manager's
      // FINISH ladder under the icon picker): a miniature material on the
      // ribbon's face, sanitized + migrated in makeTag with the same voice
      // the card coats speak.
      const tag = makeTag(name, color, icon, trim, finish);
      mutateDb((d) => ({ ...d, tags: [...d.tags, tag] }));
      setStatusTransient(`Tag "${stripRichText(tag.name)}" created`);
    },
    [mutateDb, setStatusTransient]
  );

  const updateTag = useCallback(
    (tagId, patch) => {
      mutateDb((d) => ({ ...d, tags: d.tags.map((t) => (t.id === tagId ? { ...t, ...patch } : t)) }));
      setStatusTransient('Tag updated');
    },
    [mutateDb, setStatusTransient]
  );

  // 0.30.0 — DRAG-REORDER the tag list itself ("allow me to drag tags
  // around in the tag manager which changes the order for the default"):
  // db.tags IS the default order — the tag manager's rows and every
  // character's tag strip + card ribbons all read it.
  const reorderTags = useCallback(
    (from, to) => {
      mutateDb(
        (d) => {
          const list = [...(d.tags || [])];
          const i = Math.max(0, Math.min(list.length - 1, from));
          const j = Math.max(0, Math.min(list.length - 1, to));
          if (i === j) return d;
          const [moved] = list.splice(i, 1);
          list.splice(j, 0, moved);
          return { ...d, tags: list };
        },
        'tagOrder'
      );
      setStatusTransient('Tag order updated');
    },
    [mutateDb, setStatusTransient]
  );

  const deleteTagNow = useCallback(
    (tagId) => {
      mutateDb((d) => ({
        ...d,
        tags: d.tags.filter((t) => t.id !== tagId),
        characters: d.characters.map((c) => ({ ...c, tags: (c.tags || []).filter((t) => t !== tagId) })),
      }));
      setSpotlight((f) => ({
        ...f,
        include: (f.include || []).filter((id) => id !== tagId),
        exclude: (f.exclude || []).filter((id) => id !== tagId),
      }));
      setStatusTransient('Tag deleted');
    },
    [mutateDb, setStatusTransient]
  );

  const toggleTag = useCallback(
    (characterId, tagId) => {
      // 1.5.9 — THE CHANGE SPEAKS ("feedback of changing cards, as in
      // feedback of tags and stamps and name and what not"): toggling a
      // tag on a card used to be the one mute edit in the whole flow —
      // the ribbon appeared or left with no verdict anywhere, and the
      // owner read the silence as a feature that had gone missing. The
      // toggle speaks the same sentence-case voice every other card edit
      // has always used: the tag's own name, added or removed.
      const before = (dbRef.current?.characters.find((c) => c.id === characterId)?.tags || []).includes(tagId);
      const tagLabel = stripRichText(dbRef.current?.tags.find((t) => t.id === tagId)?.name || 'tag');
      mutateDb((d) => ({
        ...d,
        characters: d.characters.map((c) => {
          if (c.id !== characterId) return c;
          const has = (c.tags || []).includes(tagId);
          return { ...c, tags: has ? (c.tags || []).filter((t) => t !== tagId) : [...(c.tags || []), tagId] };
        }),
      }));
      setStatusTransient(`Tag "${tagLabel}" ${before ? 'removed from card' : 'added to card'}`);
    },
    [mutateDb, setStatusTransient]
  );

  // Tag spotlight cycle: neutral → MUST INCLUDE → MUST EXCLUDE → neutral.
  // The hide-non-matching switch stays untouched — the modes never
  // overwrite it.
  const cycleSpotlight = useCallback((tagId) => {
    setSpotlight((f) => {
      const include = new Set(f.include || []);
      const exclude = new Set(f.exclude || []);
      if (include.has(tagId)) {
        include.delete(tagId);
        exclude.add(tagId);
      } else if (exclude.has(tagId)) {
        exclude.delete(tagId);
      } else {
        include.add(tagId);
      }
      return { ...f, include: [...include], exclude: [...exclude] };
    });
  }, []);

  // Grey out non-matching cards, or remove them entirely — the independent
  // switch; the tag modes never overwrite it.
  const toggleSpotlightHide = useCallback(() => {
    setSpotlight((f) => ({ ...f, hideNonMatching: !f.hideNonMatching }));
  }, []);

  // Settings are LIVE: every change writes straight through (one coalesced
  // undo step per key); CANCEL rolls the whole window back to its snapshot.
  // 0.13.0: also accepts a PATCH OBJECT — picking a theme that ships its
  // own background look (Mumei, Bastel, Paper, Metallic) lands theme +
  // textures + living mode in ONE write, one undo step.
  const applyLiveSetting = useCallback(
    (keyOrPatch, value) => {
      if (keyOrPatch && typeof keyOrPatch === 'object') {
        mutateDb((d) => ({ ...d, settings: { ...d.settings, ...keyOrPatch } }), 'set:theme-pick');
        return;
      }
      setSetting(keyOrPatch, value, `set:${keyOrPatch}`);
    },
    [mutateDb, setSetting]
  );

  const revertSettings = useCallback(
    (snapshot) => {
      mutateDb((d) => ({ ...d, settings: { ...snapshot } }));
      setStatusTransient('Settings reverted');
    },
    [mutateDb, setStatusTransient]
  );

  const togglePromptBottom = useCallback(() => {
    const current = dbRef.current?.settings?.promptBottom !== false;
    setSetting('promptBottom', !current);
    setStatusTransient(`Output bar ${current ? 'off: docked on the right' : 'on: back to the bottom'}`);
  }, [setSetting, setStatusTransient]);

  // 0.29.0 — TOOLTIPS, the app-wide switch (titlebar key + Settings → Look
  // both route here). The GdTooltips layer lives OUTSIDE the React tree
  // (mounted once in renderer.js), so the setting reaches it as a DOM
  // event: OFF paints nothing at all (and dismisses a visible pill) while
  // the native title boxes stay suppressed — off means OFF.
  const toggleTooltips = useCallback(() => {
    const current = dbRef.current?.settings?.tooltips !== false;
    setSetting('tooltips', !current);
    setStatusTransient(`Tooltips ${current ? 'off' : 'on'}`);
  }, [setSetting, setStatusTransient]);

  // 0.30.0 — wire the Alt+P / Alt+B / Alt+T shortcut refs (declared above
  // the keydown effect, assigned here where the callbacks exist).
  togglePanelModeRef.current = togglePanelMode;
  togglePromptBottomRef.current = togglePromptBottom;
  toggleTooltipsRef.current = toggleTooltips;

  // --------------------------------------------------------------------------
  // 0.30.0 — DATABASE MAINTENANCE (Settings → Data & System): open the
  // data / images / backups folders in the OS file browser, clear the
  // renderer's cache, and the nuclear reset (confirm-gated). All thin IPC
  // wrappers — the main process owns the paths.
  // --------------------------------------------------------------------------
  const openFolder = useCallback(
    (which) => {
      api?.openDataFolder?.(which);
      setStatusTransient(
        which === 'images' ? 'Images folder opened' : which === 'backups' ? 'Backups folder opened' : 'Data folder opened'
      );
    },
    [api, setStatusTransient]
  );

  const clearRendererCache = useCallback(async () => {
    try {
      await api?.clearCache?.();
      setStatusTransient('Cache cleared ✓');
    } catch {
      setStatusTransient('Cache clear failed');
    }
  }, [api, setStatusTransient]);

  const resetDatabase = useCallback(() => {
    confirm({
      title: 'RESET DATABASE',
      message:
        'Wipe every card, class, tag and stamp from the database? The image FILES stay on disk (delete them by hand from the images folder). This cannot be undone.',
      confirmLabel: 'WIPE',
      danger: true,
      onConfirm: () => {
        mutateDb((d) => ({
          ...d,
          characters: [],
          classes: [],
          tags: [],
          stamps: [],
        }));
        setPanelCharacterId(null);
        setView({ mode: 'grid' });
        setStatusTransient('Database wiped: a fresh dex starts');
      },
    });
  }, [confirm, mutateDb, setStatusTransient]);

  // 1.1.3 — FACTORY RESET ("implement a factory reset button in the data
  // settings, pressing on it would reset everything (add DOUBLE
  // confirmation of course)"): two confirm windows stand between the key and
  // the wipe. The first asks the question; the second makes the stakes
  // impossible to misread (no undo, no backup, no recovery) — only its
  // ERASE EVERYTHING key fires the gun. Main wipes the db file, every image
  // (originals, thumbs, prevs, stamps) and every backup in one pass, with a
  // dead-man switch that makes any straggler save a no-op; the renderer
  // then clears its own localStorage (the theme snapshot included — the
  // theme resets too) and reloads. The next boot finds no database anywhere
  // and builds the fresh first-install one. A failed wipe speaks honestly
  // and erases nothing else — the reload only happens on a clean ok.
  const factoryReset = useCallback(() => {
    confirm({
      title: 'FACTORY RESET · STEP 1 OF 2',
      message:
        'This erases EVERYTHING: every card, class, tag and stamp, every imported image, thumbnail and preview on disk, every backup, and all settings (your theme included). Nothing is kept back, nothing is recoverable. Do you want to continue?',
      confirmLabel: 'CONTINUE',
      danger: true,
      onConfirm: () => {
        confirm({
          title: 'FACTORY RESET · STEP 2 OF 2',
          message:
            'Last chance. After this there is no undo, no backup, and no recovery: the app restarts empty, exactly as it was the day you first ran it. Erase everything now?',
          confirmLabel: 'ERASE EVERYTHING',
          danger: true,
          onConfirm: async () => {
            // stop the unsaved trackers first — the quit-time save prompt
            // must never fire over a wipe in flight
            unsavedRef.current = false;
            api?.sendUnsavedState?.(false);
            const res = await api?.factoryReset?.();
            if (res?.ok) {
              try {
                localStorage.clear();
              } catch {
                /* best-effort — the db wipe already succeeded */
              }
              window.location.reload();
            } else {
              setStatusTransient('Factory reset failed: nothing was erased');
            }
          },
        });
      },
    });
  }, [api, confirm, setStatusTransient]);

  // 1.1.3 — THE UPDATE CHANNEL ("add auto update channel"): one state slot
  // speaks every verdict the settings section reads; checkUpdates runs the
  // ask (main owns the fetch — the renderer never touches the network
  // itself). The quiet lane: when the channel is STABLE, the boot asks once
  // — offline fails silent, the section can still be asked by hand. A
  // newer release also seats itself in the bottom bar's status (until the
  // next status beat replaces it).
  const [updateState, setUpdateState] = useState({ status: 'idle' });
  const updateAutoCheckedRef = useRef(false);
  const checkUpdates = useCallback(
    async (manual = false) => {
      setUpdateState((s) => ({ ...s, status: 'checking' }));
      let res = null;
      try {
        res = await api?.updatesCheck?.();
      } catch {
        res = null;
      }
      if (!res) {
        setUpdateState({ status: 'error', message: 'The updater bridge is unavailable in this build.' });
        if (manual) setStatusTransient('Update check unavailable');
        return;
      }
      if (!res.ok) {
        setUpdateState({ status: 'error', message: res.error || 'The check failed.' });
        if (manual) setStatusTransient('Update check failed');
        return;
      }
      if (res.none) {
        setUpdateState({ status: 'none', message: 'The channel is live: no release has been published there yet.', current: res.current });
        if (manual) setStatusTransient('No releases published yet');
        return;
      }
      if (res.newer) {
        setUpdateState({
          status: 'available',
          latest: res.latest,
          current: res.current,
          url: res.url,
          publishedAt: res.publishedAt,
        });
        setStatus(`Update available · v${res.latest}`);
        if (manual) gdToast(`Update available · v${res.latest}`, 'ok');
        return;
      }
      setUpdateState({ status: 'latest', latest: res.latest, current: res.current });
      if (manual) setStatusTransient(`Up to date · v${res.current}`);
    },
    [api, setStatus, setStatusTransient]
  );
  // 1.7.0 — the settings window's STABLE HANDLE (see SettingsModal's own memo
  // note): a born-fresh closure at the call site would re-render the whole
  // window on every App render. Lives beside its source on purpose — the
  // TDZ the 170 battery caught taught this seat to keep dependencies above
  // their users.
  const checkUpdatesNow = useCallback(() => checkUpdates(true), [checkUpdates]);

  // The quiet boot ask: exactly once per session, only on the STABLE seat
  // (a session that starts OFF and turns STABLE on later still gets its one
  // ask — the guard trips on the first stable sighting, not on boot). It
  // waits for the splash to finish: the boot's own last word is "Ready",
  // and an update verdict that lands a breath earlier would be overwritten
  // by it — the news must arrive AFTER the welcome, never under it.
  useEffect(() => {
    if (!loaded || !db) return;
    const channel = db.settings?.updateChannel ?? 'stable';
    if (channel !== 'stable' || updateAutoCheckedRef.current) return;
    updateAutoCheckedRef.current = true;
    checkUpdates(false);
  }, [loaded, db, checkUpdates]);

  // The bottom bar follows whatever version is being edited.
  const handleActiveVersion = useCallback((charId, verId) => {
    setActiveVersion((prev) => (prev && prev.charId === charId && prev.verId === verId ? prev : { charId, verId }));
  }, []);

  // 1.6.9 — THE VIEW'S STABLE HANDLES ("i feel like i do understand why some
  //   buttons get delayed sometimes and it could relate to calculations such
  //   as if i press on a class and it goes right away or when i press on it
  //   and it has to calculate if it needs to scroll left or right for
  //   example, and that also applies to alot like new card window or settings
  //   window, if possible do fix that long delay issue"): the retained panel
  //   and the full-window view are the app's heaviest trees, and they
  //   re-rendered on EVERY App state change — a class press, a grid drag, a
  //   settings toggle, a modal open — because their prop lists carried fresh
  //   inline closures every render (onBack / onDelete / onEditCard /
  //   onOpenTagManager / the card-column commit), so the memo below could
  //   never hold. The handles are STABLE now (one identity per dep change,
  //   nothing else), and CharacterView itself is React.memo'd: an App
  //   re-render that does not touch the open character, the tags, the
  //   stamps or the view's own settings SKIPS the whole 4000-line tree —
  //   the class press, the drag, the window opens pay for what they touch
  //   and nothing more.
  const openTagManagerWindow = useCallback(() => {
    setModal({ type: 'tagManager' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 1.7.5 — THE PICKER DOOR (the UNSELECTED TAGS switch's other half —
  // see SettingsModal's 1.7.5 note): while the switch is off the + TAGS
  // keys call THIS instead of the manager — the picker window shows the
  // full vocabulary to add onto the card, the manager rides inside it.
  // Stable like its sibling (one identity for the memo'd views), the
  // character id rides the call.
  const openTagPickerWindow = useCallback((characterId) => {
    setModal({ type: 'tagPicker', characterId: characterId || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const editPanelCard = useCallback(() => {
    if (panelCharacterId) openCardLook(panelCharacterId);
  }, [panelCharacterId, openCardLook]);
  const closePanelCard = useCallback(() => {
    // 1.7.0 — THE PANEL'S BACK IS RETRACT-AWARE ("when pressing back
    // while the composed output is expanded, it dissapears, fix that so
    // when back is pressed it would retract and close in its normal
    // animation and no just a snap/dissapearance"): the full-window back
    // already played the two-phase close (closeViewToGrid — the 1.1.1
    // retract nonce, then the view), but the PANEL's own back button went
    // straight at the panel id — the bar unmounted beneath its expanded
    // cover, framer froze every child flight inside the exiting parent,
    // and the cover smeared away in one frame exactly as the 1.1.1 report
    // once described it.
    // 1.7.1 — THE TWO FLIGHTS SHARE ONE BREATH ("when pressing back while
    // the composed output tab is expanded, the output closes first then
    // the panel, fix that so they close together, no pause between the
    // retract and the close"): the 1.7.0 answer kept the two PHASES and
    // only tuned the tail — the cover contracted its 0.18s flight, the
    // id cleared 20ms later, and the panel's own 0.15s width flight
    // followed: two beats, a visible seam. Back now raises the retract
    // nonce AND clears the panel id in the same tick, and the retract
    // nonce speaks a CSS flight inside the bar (see OutputBar's own
    // 1.7.1 note — the live A/B against the pristine 1.7.0 tree taught
    // the framer-presence race the hard way): the cover fades on its
    // keyframed twin, the bar falls through its own height exit, and the
    // aside parks its width curtain — three voices, one 0.15s breath, no
    // seam, no pause, and no presence bookkeeping ever left waiting. A
    // collapsed cover reads the nonce as the no-op it always was — one
    // road for both states. The full window's back keeps its two phases
    // (its parent's exit law freezes everything beneath it — the 1.1.1
    // measured truth that made the tail structural there, not cosmetic).
    retractNonceRef.current += 1;
    setRetractRequest(retractNonceRef.current);
    /* 1.7.2 — and the cover's goodbye seats on the body (the exiting
       bar's snapshot never sees the nonce — see armCoverRetract's note):
       the cover fades from the stable ancestor while the bar falls. */
    armCoverRetract();
    setPanelCharacterId(null);
  }, [armCoverRetract]);
  const deletePanelCharacter = useCallback(() => {
    if (panelCharacterId) askDeleteCharacter(panelCharacterId);
  }, [panelCharacterId, askDeleteCharacter]);
  const editViewCard = useCallback(() => {
    if (view.mode === 'character' && view.id) openCardLook(view.id);
  }, [view, openCardLook]);
  const commitCardColWidth = useCallback((w) => setSetting('cardColWidth', w), [setSetting]);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  const activeCharacter = useMemo(
    () => (view.mode === 'character' ? db?.characters.find((c) => c.id === view.id) || null : null),
    [view, db]
  );
  // 1.6.9 — the view's delete handle lives here (its dep — activeCharacter
  // — is born on the line above).
  const deleteViewCharacter = useCallback(() => {
    if (activeCharacter) askDeleteCharacter(activeCharacter);
  }, [activeCharacter, askDeleteCharacter]);

  const panelCharacter = useMemo(
    () => (panelCharacterId ? db?.characters.find((c) => c.id === panelCharacterId) || null : null),
    [panelCharacterId, db]
  );

  // 1.4.6 — THE PANEL'S RETAINED SEAT ("the detail panel lags alot when
  // opening, fix that"): the aside used to UNMOUNT on every close (the
  // AnimatePresence conditional), so every reopen paid the whole heavy
  // build again — the skeleton, the 150ms gate, the ~828-node
  // CharacterView mount, its measurement cascade (measured live on the
  // 20-everything card: 68 + 158 + 105ms of main-thread block, ~350ms to
  // content in the harness and multiples of that on a real machine) — on
  // EVERY single open, all session long. The aside now stays mounted for
  // the app's whole life once it has opened: closing parks it at width 0
  // (the same closing flight the exit used to fly, now an animate target
  // instead of an unmount), and reopening is the width flight alone — the
  // content is already built, already measured, already live. The parked
  // tree keeps rendering the LAST character it showed (the retained id
  // below), kept fresh by the same db-driven re-renders it always had, so
  // it can never go stale; it never answers the pointer (zero width),
  // and it speaks the DORMANT prop so its own clocks (the image stage's
  // auto-swipe) sleep while it waits. The first open of a session keeps
  // the full 1.4.5 boot (skeleton + gated transition) — the owner-blessed
  // delay — and every open after it is instant.
  const [panelRetainedId, setPanelRetainedId] = useState(null);
  useEffect(() => {
    if (panelCharacterId) setPanelRetainedId(panelCharacterId);
  }, [panelCharacterId]);
  const panelRetained = useMemo(
    () => (panelRetainedId ? db?.characters.find((c) => c.id === panelRetainedId) || null : null),
    [panelRetainedId, db]
  );
  const panelShown = panelCharacter || panelRetained;

  // 1.0.3 — THE APP-LEVEL EDIT CARD WINDOW's own card channel: the window
  // no longer lives inside CharacterView, so it needs its own cover (the
  // preview version's first image) — the exact same chain the view used to
  // compute. The aspect hook runs unconditionally (hook law) and only
  // measures while a live request holds a card with a cover.
  const lookCharacter = useMemo(
    () => (lookRequest ? db?.characters.find((c) => c.id === lookRequest.id) || null : null),
    [lookRequest, db]
  );
  const lookCoverUrl = useMemo(() => {
    if (!lookCharacter) return '';
    const cover = getPreviewVersion(lookCharacter)?.images?.[0] || null;
    return cover ? buildImageUrl(imagesPathRef.current, cover.file) : '';
  }, [lookCharacter]);
  // 1.6.2 — THE EDIT WINDOW'S OWN PROGRESSIVE LADDER ("the zoom in and out
  // and fit option appears late when i open the card edit window, it should
  // appear right away and not wait for the image, also make the image have
  // a low quality placeholder (aka the thumbnail) when it loads at the
  // start then the full later"): the window's cover used to speak the FULL
  // file alone — the preview AND the aspect AND the zoom keys all waited
  // on one heavy decode. The thumb tier (the record's lightest copy) now
  // feeds the placeholder AND the aspect (identical ratio, near-instant
  // decode, already warmed by the boot prewarm), so the window paints its
  // picture immediately and the zoom keys seat on the first frame; the
  // full file cross-fades over the placeholder when it lands.
  const lookCoverThumbUrl = useMemo(() => {
    if (!lookCharacter) return '';
    const cover = getPreviewVersion(lookCharacter)?.images?.[0] || null;
    return cover ? buildImageUrl(imagesPathRef.current, cover.prev || cover.thumb || cover.file) : '';
  }, [lookCharacter]);
  const lookCoverAspect = useImageAspect(lookCoverThumbUrl || lookCoverUrl);

  // Recursive class visibility: a class shows its whole subtree; Unsorted is
  // the parent of them all, so it shows everything.
  const classCharacters = useMemo(() => {
    if (!db) return [];
    if (selectedClassId === ROOT_CLASS_ID) return db.characters;
    const ids = new Set(descendantClassIds(db.classes, selectedClassId));
    return db.characters.filter((c) => ids.has(c.classId || ROOT_CLASS_ID));
  }, [db, selectedClassId]);

  const selectedClassLabel = useMemo(() => {
    if (!db) return '';
    // 0.33.0 — CARDS, not characters ("on the top header of the card viewer
    // it still shows all characters and characters it should instead be
    // cards"): the root class reads ALL CARDS and the count beside it counts
    // CARDS — the grid's whole vocabulary is cards.
    if (selectedClassId === ROOT_CLASS_ID) return 'All Cards';
    return classLabelPath(db.classes, selectedClassId);
  }, [db, selectedClassId]);

  const detailPanelOn = db?.settings?.detailPanel !== false;
  // 1.2.6 armed .gd-flight here to BLANK every patterned surface through the
  // width tween (the pop-out's cheap lane). 1.2.7 — THE BLANKING IS
  // RETIRED ("the texture background is delayed … when it opens it makes
  // all textures go missing / blink in and out, fix that" + "performance
  // on the cpu still declines"): the blanking bought its frames by making
  // the whole workspace visibly shed its cloth twice per flight — and the
  // CPU cost it targeted was never mostly the patterns (the grid already
  // re-lays only on column crossings since 1.2.0; the per-frame burn was
  // the side-flow zones re-measuring on every width tick — see
  // SideFlow's 1.2.7 flight-blind observer). The class stays armed for
  // exactly that observer: while it rides, the stamps/tags zones hold
  // their seat and re-pack once, at rest. The patterns never leave.
  const panelFlightTimerRef = useRef(0);
  const panelLive = detailPanelOn && !!panelCharacter;
  const panelLiveEverRef = useRef(false);
  // 1.3.0 — THE FLIGHT AS STATE TOO (the grid's projection rests while the
  // panel flies — see MasonryGrid's `flighting` prop): the class alone
  // speaks to CSS; the grid needs a PROP, and this is it. Measured live:
  // the heaviest frame of a panel open is the mid-flight COLUMN CROSSING —
  // the grid re-packs AND framer's layout projection re-measured every
  // visible card (~176 getBoundingClientRect reads in ONE frame on top of
  // the re-pack itself). With the projection rested during the flight the
  // crossing is one honest re-layout and the cards snap to their new
  // columns inside the 0.22s stretch — at rest (window resizes, drags,
  // zoom) the springs keep their seat, exactly as before.
  const [panelFlight, setPanelFlight] = useState(false);
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    // the boot's first run arms nothing (the splash owns the screen and no
    // flight is happening) — only genuine transitions speak the class.
    if (!panelLiveEverRef.current && !panelLive) {
      panelLiveEverRef.current = true;
      return undefined;
    }
    panelLiveEverRef.current = true;
    const root = document.documentElement;
    root.classList.add('gd-flight');
    setPanelFlight(true);
    if (panelFlightTimerRef.current) clearTimeout(panelFlightTimerRef.current);
    panelFlightTimerRef.current = setTimeout(() => {
      panelFlightTimerRef.current = 0;
      root.classList.remove('gd-flight');
      setPanelFlight(false);
    }, 380);
    return () => {
      if (panelFlightTimerRef.current) {
        clearTimeout(panelFlightTimerRef.current);
        panelFlightTimerRef.current = 0;
      }
    };
  }, [panelLive]);
  const outputBarOn = db?.settings?.promptBottom !== false;
  const showHelp = db?.settings?.showHelpText === true;
  // 1.5.4 — the creation seat's STABLE HANDLERS (see the seat's render):
  // three little useCallbacks so the memoized window never re-renders for
  // an inline arrow's sake. The help toggle reads the live db through the
  // ref the way every once-bound listener here does.
  const showHelpRef = useRef(showHelp);
  showHelpRef.current = showHelp;
  const seatOpenTagManager = useCallback(() => setTagManagerOver(true), []);
  const seatClose = useCallback(() => setModal(null), []);
  const seatToggleHelp = useCallback(() => setSetting('showHelpText', !showHelpRef.current), [setSetting]);
  // 1.8.2 — wire the help-text shortcut ref (see the keydown map above):
  // the stable creation-seat handler, assigned in the render's own breath
  // the way the showHelp mirror above reads — Alt+H lands in the same
  // toggle every footer and the toolbar key speak.
  toggleHelpRef.current = seatToggleHelp;
  const advancedSearch = db?.settings?.advancedSearch === true;
  // 0.29.0 — the tooltip layer's mode + the panel columns' widths. Widths
  // are hard-clamped on read (a stale db can carry anything) and the edge
  // handles commit through setSetting — the SAME keys the Settings sliders
  // write, so undo/redo replays a resize exactly like any other change.
  const tooltipsOn = db?.settings?.tooltips !== false;
  const leftPanelW = clampSidebarWidth(db?.settings?.sidebarWidth);
  // 1.1.5 — THE PANEL YIELDS TO THE ROOM IT SITS IN ("for some reason i can
  // scroll to the right when i open the detail pannel, fix that"): the tree
  // and the panel are both flex-shrink-0 columns, so a panel width that fit
  // a wide window can outrun a narrow one — 400px tree + 760px panel on the
  // 1100px minimum window left the viewer column with NOTHING, and the
  // viewer's own scroller (overflow-y: auto, its overflow-x defaulting to
  // auto as a result) grew a real sideways scrollbar you could scroll. The
  // RENDERED width is room-aware now: the panel never asks for more than
  // the window can spare beside the tree and a livable viewer column, and
  // the window's width is WATCHED live so resizing re-flows the same frame.
  // The SETTING keeps the user's number untouched — widen the window and
  // the panel takes its full width back.
  const [winW, setWinW] = useState(() => (typeof window !== 'undefined' && window.innerWidth) || 1600);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onResize = () => setWinW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  // the viewer column's floor: enough for one card column + the toolbar's
  // wrapped rows — the panel steps aside before the cards starve.
  const VIEWER_MIN_W = 320;
  const rawPanelW = clampPanelWidth(db?.settings?.panelWidth);
  const panelRoom = Math.max(PANEL_WIDTH_RANGE.min, winW - leftPanelW - VIEWER_MIN_W);
  const rightPanelW = Math.min(rawPanelW, panelRoom);
  // 0.31.0 — the full-window view's card column (the separator commits it).
  const cardColW = clampCardColWidth(db?.settings?.cardColWidth);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    // window.CustomEvent (NOT the bare global — Node's own realm-bound
    // constructor would hand jsdom an event it rejects).
    const CE = (typeof window !== 'undefined' && window.CustomEvent) || null;
    // 0.30.0 — the event also carried `follow` (settings.tooltipFollow);
    // 1.2.4 — THE PILL PINS AT ITS HOVER POINT (see GdTooltips): the follow
    // behavior — and the setting that drove it — is retired. Old saves may
    // still carry the key; it reads as nothing now.
    if (CE)
      document.dispatchEvent(
        new CE('gd-tooltips-mode', {
          detail: { on: db?.settings?.tooltips !== false },
        })
      );
  }, [tooltipsOn]);

  // 0.28.0 — THE PANEL HAND-OFF ("when switching right panel option off
  // while the right panel is open, make it change into the full one"). The
  // effect watches the SETTING itself, so both entry points — the titlebar
  // panel key and the Behavior tab's CARD PANEL switch — route through
  // the same logic:
  //   · ON -> OFF with the panel open: the character HANDS OFF to the full
  //     window view instead of vanishing with the aside.
  //   · OFF -> ON while a character is full-window: it hands BACK to the
  //     freshly-enabled right panel (and the grid returns beneath it).
  const prevDetailPanelRef = useRef(detailPanelOn);
  // 1.0.7 — THE HAND-OFF FLAG ("when disabling or enabling the bottom output
  // panel or right detail panel, it should update seemlessly and not retract
  // then repull"): while true (for the ~350ms a hand-off takes), the
  // full-window cover enters and exits with an IN-PLACE crossfade instead of
  // its directional slide, and a newly mounting output bar appears already
  // open instead of growing from zero height. The old choreography ran BOTH
  // flights at once: the aside retracted its whole width while the cover
  // re-entered from the side (and the bar retracted in one column to
  // re-grow in the other) — the content visibly packed itself away and then
  // unpacked again. Under the flag the cover simply fades over its final
  // seat while the panel's edge slides beneath it: one motion, one story.
  const [handoff, setHandoff] = useState(false);
  const handoffTimerRef = useRef(0);
  useEffect(() => () => clearTimeout(handoffTimerRef.current), []);
  const armHandoff = () => {
    setHandoff(true);
    clearTimeout(handoffTimerRef.current);
    handoffTimerRef.current = setTimeout(() => setHandoff(false), 350);
  };
  useEffect(() => {
    const was = prevDetailPanelRef.current;
    prevDetailPanelRef.current = detailPanelOn;
    if (was === detailPanelOn) return;
      if (!detailPanelOn) {
      const id = stateRef.current.panelCharacterId;
      if (id) {
        armHandoff();
        setPanelCharacterId(null);
        setView({ mode: 'character', id });
        setStatusTransient('Card panel off: cards open in the full window');
      }
    } else {
      const v = stateRef.current.view;
      if (v.mode === 'character' && v.id) {
        armHandoff();
        setView({ mode: 'grid' });
        setPanelCharacterId(v.id);
        setStatusTransient('Card panel on: cards open in the right panel');
      }
    }
     
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailPanelOn, setStatusTransient]);

  // Bottom output bar target: the version being edited in the panel or the
  // full-window view. 0.30.0 — SPLIT in two: the grid column's bar only
  // paints while the grid is the visible surface (the full-window character
  // view is now an OVERLAY above it — the grid never unmounts, so its bar
  // must not mount underneath the cover), and the overlay carries its own.
  const barCharacter = activeVersion?.charId ? db?.characters.find((c) => c.id === activeVersion.charId) || null : null;
  const barVersion = barCharacter ? barCharacter.versions.find((v) => v.id === activeVersion.verId) || null : null;
  const barInGrid = !!barVersion && view.mode === 'grid' && panelCharacter?.id === barCharacter.id;
  const barInFull = !!barVersion && view.mode === 'character' && view.id === barCharacter.id;

  // 0.39.0 — "EDIT CLASS" HANDOFF: the right-click menu names a class id;
  // the sidebar (which owns the full editor) picks it up and reports back.
  // 1.1.8 — HOISTED ABOVE THE API GUARD (a lint-law fix, not a behavior
  // change): this useState used to sit BELOW the `if (!api)` early return,
  // which the react-compiler lint rightly reads as a conditionally-called
  // hook; the state initializes identically up here (null, unconditionally)
  // and nothing between here and the guard touches it.
  const [editClassId, setEditClassId] = useState(null);

  if (!api) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0f0f0f] text-[#f2f2f2] font-mono text-sm">
        Burrito GenDex must run inside Electron (npm start).
      </div>
    );
  }

  // 0.28.0/0.29.0 — THE LEFT TREE, HOISTED AND PERSISTENT: the class
  // sidebar renders exactly once, in its own sized column OUTSIDE the
  // grid/character AnimatePresence — beside the GRID and beside the
  // FULL-WINDOW card view, never remounting when the two swap
  // (collapse state survives), and structurally impossible for the full
  // view to cover. One node, one source of truth for its props; the
  // column's width is the sidebarWidth setting (edge-drag + slider).

  const sidebarNode = db ? (
    <ClassSidebar
      classes={db.classes}
      characters={db.characters}
      selectedClassId={selectedClassId}
      dragRef={dragRef}
      onSelectClass={setSelectedClassId}
      onAddClass={addClass}
      onRenameClass={renameClass}
      onDeleteClass={deleteClassNow}
      onMoveClass={moveClass}
      onAssignCharacter={assignCharacterClass}
      onNewCharacter={() => setModal({ type: 'newCharacter' })}
      confirm={confirm}
      onStatus={setStatusTransient}
      editClassRequest={editClassId}
      onEditClassHandled={() => setEditClassId(null)}
      centerOnReveal={db.settings.centerClassOnReveal !== false}
    />
  ) : null;

  // 1.5.5 — THE BRIDGE GUARD'S OWN FACE: rendered INSTEAD of the whole app
  // when window.api never landed (the preload failed to run — a broken
  // install, an asar that didn't match). Before this seat the app painted a
  // fresh DEFAULT library over a machine that may own a full archive and
  // let its autosave bury the file; now it stops where it stands and says
  // so. Placed AFTER every hook (a conditional return between hooks would
  // be a violation); every effect above already no-ops on bridgeDown, so
  // nothing renders, nothing saves, nothing writes.
  if (bridgeDown) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-8" style={{ background: 'var(--gd-bg, #141210)' }}>
        <div className="gd-card p-6 max-w-[440px] text-center">
          <div className="gd-rule">APP SUPPORT FAILED TO LOAD</div>
          <p className="mt-3 text-[12px] leading-relaxed" style={{ color: 'var(--gd-mute)' }}>
            The bridge between the app and your files did not start, so Burrito GenDex stopped instead of
            opening an empty library.
          </p>
          <p className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--gd-mute)' }}>
            Nothing on your disk was changed. Reinstall or rebuild the app (delete the <b>out</b> folder and
            run START.bat again) and it will open with your library exactly where you left it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <MotionConfig
      reducedMotion={db?.settings?.reduceMotion ? 'always' : 'normal'}
    >
    {/* 1.1.8 — `font-mono` LEFT THE ROOT ("some text like 'search cards'
        doesnt follow the font, fix that"): the root used to carry Tailwind's
        font-mono utility, which PINNED the entire main UI — titlebar, class
        tree, viewer, the search field — to the IBM Plex Mono stack no
        matter what Settings → Look → FONT said. Only the portal-mounted
        windows (modals) inherited body's --gd-body-font, so switching the
        face changed the windows while the app behind them stood still in
        mono — "some text follows, some doesn't". The root now inherits
        body's var like everything else: mono by default (the var's
        fallback IS the classic mono stack), Space Grotesk / Spectral the
        moment the user picks them — everywhere, the search field's
        placeholder included. */}
    <div className="h-screen w-screen overflow-hidden relative bg-gd-bg text-gd-chrome text-[13px]">
      {/* 0.14.0 — NO WORKSPACE TEXTURE LAYER anymore: the root wears the
          plain base color only. Each surface (top toolbar, left tree, card
          viewer body, right panel) paints its OWN opaque color + its own
          pattern, so patterns never blend into each other. 0.19.0 — the
          living background is GONE: nothing animates, the workspace is
          always still. */}

      <Titlebar
        status={status}
        /* 1.2.6 — THE READ OWNS THE CLOCK (items 18 + 19): StatusText
            reports its marquee's read time (the transient hold waits for
            the message's end), the hover freezes the countdown, and a
            press skips to the baseline. See the status block above. */
        onStatusFlight={onStatusFlight}
        onStatusHold={onStatusHold}
        onStatusSkip={onStatusSkip}
        maximized={maximized}
        /* 0.34.0 — the LOCKOUT: while any window is open the app keys on the
            top bar dim and go inert (the window controls stay alive). */
        locked={anyWindowOpen}
        onOpenSettings={openSettingsWindow}
        settingsLoading={settingsLoading}
        canUndo={histLen.u > 0}
        canRedo={histLen.r > 0}
        canSave={unsaved}
        onUndo={undo}
        onRedo={redo}
        onSave={saveDb}
        panelMode={detailPanelOn}
        onTogglePanel={togglePanelMode}
        outputBarMode={outputBarOn}
        onToggleOutputBar={togglePromptBottom}
        tooltipMode={tooltipsOn}
        onToggleTooltips={toggleTooltips}
        /* 1.8.1 — HELP TEXT joins the app keys (the teaching copy's
           top-bar seat, beside its fellow teacher tooltips): the same
           db.settings.showHelpText the windows' footers write — the
           stable handler the creation seat already owns. */
        helpMode={showHelp}
        onToggleHelp={seatToggleHelp}
        /* 1.1.1 — RESTART rides the history group beside SAVE (a refresh
           through the full splash ceremony; unsaved work gets the confirm
           window first). 1.3.2 — the THUMB key is retired with the whole
           preview system: thumbnails build automatically, there is nothing
           to generate on demand. */
        onRestart={restartApp}
        sc={db?.settings?.shortcuts}
      />

      <main className="relative z-10 h-full pt-10 flex flex-col">
        <div className="flex-1 min-h-0 relative flex min-w-0">
          {/* 0.29.0 — THE PERSISTENT LEFT TREE. The class sidebar used to
              live INSIDE the grid/character branches, so every switch
              REMOUNTED it (collapse state reset, the tree re-faded with the
              swap) and the full view could sit visually over it. It now
              mounts ONCE, outside the switching AnimatePresence: the
              grid/character swap animates only the REST of the workspace,
              the tree never flickers, and the full-window card view is
              structurally confined to the middle + right space ("ensure
              its only taking the space of the right and the middle area,
              aka not covering the left tree"). The column's width is a
              SETTING — the edge handle resizes it live and commits
              sidebarWidth, the Settings slider writes the same key. */}
          {db && (
            <div ref={leftColRef} className="gd-leftcol h-full flex-shrink-0 relative" style={{ width: leftPanelW }}>
              {sidebarNode}
              <PanelResizer
                side="left"
                targetRef={leftColRef}
                width={leftPanelW}
                min={SIDEBAR_WIDTH_RANGE.min}
                max={SIDEBAR_WIDTH_RANGE.max}
                onCommit={(w) => setSetting('sidebarWidth', w)}
                title="Drag to resize the class tree: the width is saved (and undo-able)"
              />
            </div>
          )}

          {/* 0.30.0 — THE MIDDLE+RIGHT ZONE: its own relative wrapper beside
              the persistent left tree. The grid fills it, and the full-window
              card view mounts as an absolute cover INSIDE it — inset-0
              here means "everything right of the tree", never the tree
              itself (the first cut hung the overlay on the whole row and
              covered the tree: coverLeft measured 0).
              1.1.5 — AND IT CLIPS (the T10 belt-and-suspenders): the zone's
              children are all width-honest now (the panel yields to the
              room), but any residual overflow in a degenerate window clips
              at the zone's edge instead of growing a sideways scrollbar
              anywhere up the chain. Every dropdown lives behind a body
              portal, so nothing that matters can be cut. */}
          <div className="flex-1 min-w-0 relative flex overflow-hidden">
          {/* 0.30.0 — THE GRID STAYS MOUNTED, ALWAYS. It used to swap out
              with the card view inside one AnimatePresence (the cards
              HID and re-laid-out while the detail window was open —
              "dont reposition the cards or hide them, only cover the window
              above them"). Now the full-window card view is an
              ABSOLUTE OVERLAY above this column: the grid keeps its exact
              DOM, scroll position and layout underneath, and the cover
              slides over it. (The RIGHT PANEL keeps its own docked behavior
              — it narrows the grid beside it, exactly as before.) */}
          {db && (
            <motion.div
              key="grid"
              className="flex-1 min-w-0 flex h-full"
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.16 }}
            >
              {/* CENTER — the viewer column. The composed-output bar docks
                  to the bottom of THIS column only: it never spans into the
                  class tree on the left or the card panel on the right,
                  and it never pushes them around.
                  0.30.0 — the PATTERN rides the SCROLLER now (the toolbar
                  header wears the Top Toolbar's own pattern — the two bars
                  no longer share one sheet): scrolling the cards moves the
                  viewer pattern under a header whose pattern stays put,
                  exactly like the right panel's header vs its container. */}
              <div className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
                  <div className="flex-1 min-h-0 relative overflow-hidden">
                    {/* 0.13.0 — the grid floats over the viewer surface's
                        own pattern (0.19.0: the living background canvas is
                        gone with the animated backgrounds — always still).
                        0.37.0 — THE CLASS SWITCH JUST UPDATES ("when
                        switching between classes, the card viewer should
                        just update, no need for the swipe animation"): the
                        old directional page-turn (grid slid out/in from the
                        side of the tree you moved toward) is RETIRED — the
                        GridView is a plain child now, its content swaps in
                        place, and only the cards' own gentle enter/exit
                        crossfade (MasonryGrid) plays underneath. */}
                    <GridView
                      characters={classCharacters}
                      tags={db.tags}
                      stamps={db.stamps}
                      imagesPath={imagesPathRef.current}
                      zoom={db.settings.zoom}
                      tagScale={db.settings.tagScale}
                      tagPosition={db.settings.tagPosition}
                      tagLimit={db.settings.tagLimit}
                      tagSeparation={db.settings.tagSeparation}
                      cardRatio={db.settings.cardRatio}
                      sortMode={sortMode}
                      search={search}
                      advancedSearch={advancedSearch}
                      classLabel={selectedClassLabel}
                      /* 1.3.0 — THE PANEL FLIGHT (see panelFlight above):
                         while the right panel's width flight runs, the
                         cards' framer layout projection rests — the
                         crossing frame stops carrying ~176 projection
                         reads on top of the re-pack (the panel lag's
                         heaviest single frame, measured live). */
                      flighting={panelFlight}
                      /* 1.6.8 — THE LIVE DRAG PREVIEW (Settings →
                         Performance): ON keeps the 1.6.3 live gap; OFF
                         holds the wall still through a card drag — the
                         hovered card's edge glow alone marks the seat,
                         and the reorder lands with the release as one
                         animated commit. 1.9.12 — the default flips OFF
                         (the === true polarity: a missing key never
                         previews). */
                      liveDragPreview={db?.settings?.liveDragPreview === true}
                      /* 1.0.9 — THE SELECTED CARD SPEAKS ("add feedback to
                         the card selected, like have some effect or
                         something on it to show that its selected"): the
                         character open in the detail panel is passed down,
                         and its grid card wears the accent ring + OPEN tab.
                         Null when the panel is closed — nothing is ringed. */
                      selectedId={panelCharacterId}
                      /* 1.1.8 — the expanded grid seats ride the wall (see
                         expandedCardIds at the state): span-2 wrappers,
                         doubled widths, the shrink key on the same menu. */
                      expandedIds={expandedCardIds}
                      /* 1.3.2 — the cover reads the record's lightest tier (prev,
                      else the thumb) — always; the CARD PREVIEW THUMBNAILS
                      switch is retired with the preview system. */
                      dragRef={dragRef}
                      spotlight={spotlight}
                      onCycleSpotlight={cycleSpotlight}
                      onCycleStampSpotlight={cycleStampSpotlight}
                      onToggleSpotlightHide={toggleSpotlightHide}
                      onSearch={setSearch}
                      onSort={setSortAndPersist}
                      onNew={() => setModal({ type: 'newCharacter' })}
                      onOpen={toggleOrOpenCard}
                      onDelete={askDeleteCharacter}
                      onReorder={reorderCharacters}
                      /* 0.27.0 — the size sliders are back in the toolbar
                         ("readd the tag scale and the card scale back to the
                         toolbar where it was while also keeping it in
                         settings"): coalesced undo keys, same as the Look
                         tab's sliders — one setting, two handles. */
                      onZoom={(v) => setSetting('zoom', v, 'zoom')}
                      onTagScale={(v) => setSetting('tagScale', v, 'tagScale')}
                      onTagSeparation={(v) => setSetting('tagSeparation', v, 'tagSeparation')}
                    />
                  </div>

                  <AnimatePresence initial={false}>
                    {outputBarOn && db && barInGrid && (
                      <OutputBar
                        key="output-bar"
                        character={barCharacter}
                        version={barVersion}
                        instant={handoff}
                        onStatus={setStatusTransient}
                        retractRequest={retractRequest}
                        onExpandedChange={setOutputExpandedRef}
                      />
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {/* 1.4.6 — THE ASIDE NEVER UNMOUNTS ON CLOSE (the retained
                      seat — see the panelRetained note above): the mount
                      condition speaks the RETAINED character too, so BACK
                      parks the panel at width 0 instead of tearing it
                      down, and the next open is the width flight alone.
                      Only the setting turning off (or the retained card
                      leaving the library) breaks the condition and plays
                      the exit. */}
                  {detailPanelOn && panelShown && (
                    <motion.aside
                      key="detail-panel"
                      ref={panelColRef}
                      data-gd-region="panel"
                      className={`flex-shrink-0 relative overflow-hidden${panelLive ? '' : ' gd-panel-parked'}`}
                      style={{ borderLeft: panelLive ? '1.5px solid var(--gd-edge)' : 'none' }}
                      /* 0.38.0 — THE PANEL STRETCHES, IT DOESN'T SNAP ("when
                         right panel opens, its clear when the background
                         texture gets erased and when the header of the card
                         viewer gets collapsed to the left more, and cropped,
                         fix that so it does stretch with the panel and the
                         background does only get hidden when its covered,
                         same when its also collapsing it would move back
                         slowly and would also show it as it gets revealed"):
                         the WIDTH animates now (not a transform slide over an
                         instantly-narrowed grid) — the grid, its toolbar and
                         the viewer's pattern all stretch and relax WITH the
                         panel; the background is only ever hidden by the
                         panel's own edge as it covers it, and closing slides
                         that edge back slowly, revealing what was beneath.
                         The inner wrapper keeps the panel's FULL width so the
                         panel's own content never reflows mid-flight.
                         1.2.6 — AND THE FLIGHT ITSELF GOES COMPOSITOR-CHEAP
                         ("when right panel pops out it lags, i suspect it
                         could be because the background shifting or the top
                         toolbar and the bottom output panels transforming"):
                         a width flight re-LAYS-OUT every surface it touches,
                         and the patterned backgrounds re-RASTER their tiles
                         on every one of those frames (measured live: a
                         183ms frame plus 38-67ms frames through the pop-
                         out). TWO laws carry the stretch without the jank:
                         App arms the root's .gd-flight class for the whole
                         flight (every .gd-tex-* surface drops its pattern
                         layer and paints its flat band color — pattern
                         raster happens ONCE, at rest) and the panel's own
                         CONTENT defers its mount until the width flight
                         lands (onAnimationComplete below): the heavy
                         CharacterView mount lands AFTER the motion, fading
                         in over a beat, instead of colliding with the
                         tween's first frames. */
                      initial={{ width: 0, opacity: 0.6 }}
                      animate={{ width: panelLive ? rightPanelW : 0, opacity: panelLive ? 1 : 0.6 }}
                      exit={{ width: 0, opacity: 0.6 }}
                      /* 1.0.4 — a resize commit renders ONE beat with a zero
                         duration (see panelSnap above) so the width the
                         user dragged into place lands without re-flying
                         the curtain; every other width change (open /
                         close) keeps its easeOut flight (1.4.8: 0.15s). */
                      /* 1.4.8 — THE CURTAIN QUICKENS ("windows take a while
                         to open, such as edit card, or card creation window,
                         or right panel, fix that"): the width flight spoke
                         0.22s easeOut — a deliberate, heavy-door feel that
                         read as WAITING once the content stopped arriving
                         late (the skeleton's 150ms+transition lane made the
                         drawer feel slow twice over). The boot is instant
                         now (one rAF), and the flight speaks 0.15s: the
                         drawer snaps open with its content already in it —
                         still a flight (never a frame-swap), a third faster. */
                      transition={
                        panelSnap
                          ? { width: { duration: 0 }, opacity: { duration: 0.15, ease: 'easeOut' } }
                          : { duration: 0.15, ease: 'easeOut' }
                      }
                    >
                      {/* 0.29.0 — the panel column is RESIZABLE: the edge
                          handle on its left border writes the live width
                          straight to this node (no re-render per frame) and
                          commits panelWidth on release — the same setting
                          the Settings → Behavior slider writes, so undo
                          replays a resize like any other change. The scroll
                          lives on an inner wrapper so the handle spans the
                          whole column, never the scrolled content.
                          1.0.4 — the wrapper is now driven LIVE during a
                          drag too (panelContentRef feeds the resizer's
                          contentRef), so the panel's content reflows with
                          the user's hand instead of waiting for release. */}
                      <div
                        ref={panelContentRef}
                        /* 1.1.8 — OVERFLOW-X HIDDEN, BY LAW ("i still can scroll
                           to the right of the right detail panel, fix that"):
                           a scroller that says overflow-y:auto and nothing
                           else COMPUTES its overflow-x to auto (the CSS
                           visible/auto coupling), so anything that pokes a
                           pixel past the panel's right edge — a hover halo,
                           a hanging ribbon, a drag translate — grew a real
                           sideways scrollbar on the whole panel. The viewer
                           column got this exact law in 1.1.5; the panel
                           joins it now: the panel is a vertical animal,
                           full stop. The version strip / tags / stamps
                           scrollers own their own sideways seats (1.1.8)
                           and are unaffected. */
                        className="h-full overflow-y-auto overflow-x-hidden gd-tex-panel"
                        style={{ width: rightPanelW }}
                      >
                        {/* 1.2.7 — THE CONTENT MOUNTS NOW ("when opening
                            right panel it is blank for a moment then it
                            loads, fix that"): the 1.2.6 staged entrance
                            held a flat ghost until the width flight landed
                            — the pop-out read as a blank drawer that
                            suddenly found its content. The CharacterView
                            mounts with the flight's FIRST frame instead:
                            its seat is the fixed-width wrapper (laid out
                            ONCE at rightPanelW — the aside's clip is the
                            only thing that animates), so the mount cost
                            lands in one frame and every tween frame after
                            it is pure width — no reflow churn, no ghost.
                            The fade-in keeps the arrival soft. Card swaps
                            mid-life keep the landed content (the aside
                            never re-animates). */}
                        <div className="gd-panel-content-in relative h-full">
                        {/* 1.4.1 — THE PANEL'S FIRST FRAME IS THE CURTAIN
                            ("when i press on a card, the right detail
                            panel is slightly delayed, fix that"): the
                            CharacterView mount is a heavy frame (measured
                            live: ~83ms of build in the small harness, and
                            a real library carries far more weight), and
                            it used to land in the SAME frame as the
                            click — the curtain could not even START
                            opening until the whole view had built, so
                            the press read as dead time. The FIRST mount
                            of the aside now defers the view by exactly
                            ONE rAF: the shell + the width flight paint
                            alone on the click's own frame (a cheap
                            frame — the curtain is already sweeping), and
                            the view builds inside the opening flight
                            (the 0.22s easeOut hides the one heavy frame
                            mid-sweep). Card SWAPS while the panel lives
                            keep their instant seat: the deferral arms
                            only on the aside's own first mount, never
                            again. */}
                        {/* 1.4.8 — the label prop left with the skeleton
                            (nothing renders in the deferred frame but the
                            panel's own paper — see DeferredPanelBoot). */}
                        {/* 1.8.6 — THE CARD VIEWER'S OWN VEIL (see
                            newCardPending in App): while a new card builds
                            the veil + the compositor wheel cover the panel —
                            the wheel turning through the whole freeze, the
                            darkening reading as the card loading in. */}
                        {newCardPending && (
                          <div className="gd-load-veil" aria-hidden="true">
                            <span className="gd-wheel" style={{ ['--gd-wheel-s']: '20px' }} />
                          </div>
                        )}
                        <DeferredPanelBoot>
                        <CharacterView
                          compact
                          character={panelShown}
                          /* 1.4.6 — THE DORMANT SEAT (the retained panel's
                             own clock gate): while the aside is parked at
                             width 0 the view sleeps its self-driven
                             timers (the image stage's auto-swipe) — the
                             tree stays built and fresh, it just stops
                             spending frames nobody can see. */
                          dormant={!panelLive}
                          /* 1.0.3 — the gear's EDIT CARD key asks App for
                             the App-level window (openCardLook) — this view
                             no longer hosts the modal itself. */
                          /* 1.6.9 — THE STABLE HANDLES (see the view's
                             own note at openTagManagerWindow): fresh
                             closures here were defeating the memo on
                             every App render. */
                          onEditCard={editPanelCard}
                          tags={db.tags}
                          stampLibrary={db.stamps}
                          imagesPath={imagesPathRef.current}
                          cardDefaultRatio={db.settings.cardRatio}
                          /* 1.5.8 — the experimental finishes gate rides the
                             view too (the edit-card window's finish row). */
                          finishesHidden={db.settings.livingFinishes === false}
                          outputBarOn={outputBarOn}
                          showHelp={showHelp}
                          autoSwipe={db.settings.autoSwipeImages === true}
                          onBack={closePanelCard}
                          patchCharacter={patchCharacter}
                          onDelete={deletePanelCharacter}
                          onToggleTag={toggleTag}
                          onOpenTagManager={openTagManagerWindow}
                          /* 1.7.5 — THE UNSELECTED TAGS SWITCH'S VIEW SEAT (see
                             SettingsModal's 1.7.5 note): the tags row's
                             census + the + TAG key's door. */
                          showAllTags={db.settings.showAllTags !== false}
                          onOpenTagPicker={openTagPickerWindow}
                          /* 1.3.0 — the tags row's drag writes the GLOBAL
                             order (db.tags) through the same road the tag
                             manager's own list speaks. */
                          onReorderTags={reorderTags}
                          onAttachStamp={attachStampTemplate}
                          onRemoveStamp={removeCharacterStamp}
                          onPromoteStamp={promoteCharacterStamp}
                          onUploadStamp={addStampsToCharacter}
                          onRenameStamp={renameCharacterStamp}
                          onReorderStamps={reorderCharacterStamps}
                          onStampColor={setCharacterStampColor}
                          onStampTransform={setCharacterStampTransform}
                          confirm={confirm}
                          onStatus={setStatusTransient}
                          onActiveVersion={handleActiveVersion}
                          onUndo={undo}
                          onRedo={redo}
                          canUndo={histLen.u > 0}
                          canRedo={histLen.r > 0}
                          scUndo={(db?.settings?.shortcuts || DEFAULT_SHORTCUTS).undo}
                          scRedo={(db?.settings?.shortcuts || DEFAULT_SHORTCUTS).redo}
                        />
                        </DeferredPanelBoot>
                        </div>
                      </div>
                      {/* 1.1.5 — THE DRAG CEILING IS THE ROOM TOO: the edge
                          handle can no longer commit a width the window
                          cannot fit beside the tree (the same room the
                          rendered width reads — see rightPanelW above). */}
                      <PanelResizer
                        side="right"
                        targetRef={panelColRef}
                        contentRef={panelContentRef}
                        width={rightPanelW}
                        min={PANEL_WIDTH_RANGE.min}
                        max={Math.min(PANEL_WIDTH_RANGE.max, panelRoom)}
                        onCommit={(w) => {
                          setPanelSnap(true);
                          setSetting('panelWidth', w);
                        }}
                        title="Drag to resize the card panel: the width is saved (and undo-able)"
                      />
                    </motion.aside>
                  )}
                </AnimatePresence>
            </motion.div>
          )}

          {/* 0.30.0 — THE FULL-WINDOW CARD VIEW AS AN OVERLAY. It used
              to REPLACE the grid (mode="wait" swap — cards hid/re-laid-out
              beneath it); now it COVERS the middle+right area above the
              still-mounted grid ("dont reposition the cards or hide them,
              only cover the window above them"), slides in from the right,
              and slides back out to reveal the grid exactly as it was. The
              left tree stays visible beside it (0.29.0 law — the overlay
              rides the MIDDLE+RIGHT wrapper above, so it physically cannot
              reach the tree column); the right panel's docked behavior is
              untouched — this branch only runs when the detail-panel setting
              is OFF.
              1.0.7 — THE HAND-OFF CROSSFADES ("… it should update seemlessly
              and not retract then repull"): the entrance/exit are VARIANTS
              now, resolved through AnimatePresence's `custom` — a normal
              open keeps the directional slide (in from the right, the
              readable 0.39.0 out-flight), while a PANEL HAND-OFF (custom
              true) fades IN PLACE both ways: the cover materializes over
              the seat it is taking while the aside's edge slides away
              beneath it, and hands BACK the same way. No directional
              re-entry, no second motion stacked on the panel's own — the
              transfer reads as one continuous breath. */}
          <AnimatePresence custom={handoff}>
          {db && view.mode === 'character' && (
            <motion.div
              key={`char-${view.id}`}
              className="absolute inset-0 z-30 flex flex-col overflow-hidden h-full gd-viewer-cover"
              variants={CHAR_COVER_VARIANTS}
              custom={handoff}
              initial="enter"
              animate="center"
              exit="exit"
              /* 1.2.0 — the exit carries its own longer clock (see
                 CHAR_COVER_VARIANTS); the enter keeps the quick one.
                 1.2.6 — the exit's clock and its KEYFRAMED opacity ride
                 the VARIANT itself (a transition inside transition.exit
                 does not reach per-value overrides — the fade kept its
                 front-loaded curve; see the variant note). */
              transition={{ duration: 0.2, ease: [0.2, 0.9, 0.3, 1] }}
            >
              {/* 0.28.0 + 0.29.0 — THE FULL VIEW (the right panel's
                  full-screen mode): the character spreads across the
                  MIDDLE + RIGHT space only — the persistent left tree
                  column mounts outside this branch and stays put, so the
                  full view can never cover it, and classes stay one click
                  away while a character is open. The 0.28.0 panel hand-off
                  (turning the right panel off while it is open) lands the
                  character HERE. The covering surface paints the viewer's
                  own color + pattern (opaque — the grid beneath never
                  shows through). */}
              <div className="flex-1 min-h-0 relative">
                  {/* 1.8.6 — THE CARD VIEWER'S OWN VEIL, the full-window twin
                      (see newCardPending in App): the same darkening + the
                      same compositor wheel, covering the cover while the new
                      card builds — the wheel turning through the freeze. */}
                  {newCardPending && (
                    <div className="gd-load-veil" aria-hidden="true">
                      <span className="gd-wheel" style={{ ['--gd-wheel-s']: '20px' }} />
                    </div>
                  )}
                  <CharacterView
                    character={activeCharacter}
                    /* 1.0.3 — panel twin of the gear's EDIT CARD key: the
                       window lives at App level now. */
                    /* 1.6.9 — THE STABLE HANDLES (the panel twin's own
                       note — see openTagManagerWindow above). */
                    onEditCard={editViewCard}
                    tags={db.tags}
                    stampLibrary={db.stamps}
                    imagesPath={imagesPathRef.current}
                    cardDefaultRatio={db.settings.cardRatio}
                    /* 1.5.8 — the experimental finishes gate rides the view
                       too (the edit-card window's finish row). */
                    finishesHidden={db.settings.livingFinishes === false}
                    outputBarOn={outputBarOn}
                    showHelp={showHelp}
                    /* 0.31.0 — the CARD column width + its commit: the
                       separator writes the live px straight to the column
                       node during the drag and lands here on release —
                       one undo step per completed drag, same as the
                       panel/tree edges. */
                    cardColWidth={cardColW}
                    onCardColWidth={commitCardColWidth}
                    autoSwipe={db.settings.autoSwipeImages === true}
                    onBack={closeViewToGrid}
                    patchCharacter={patchCharacter}
                    onDelete={deleteViewCharacter}
                    onToggleTag={toggleTag}
                    onOpenTagManager={openTagManagerWindow}
                    /* 1.7.5 — THE UNSELECTED TAGS SWITCH'S VIEW SEAT (the
                       panel twin's own note above). */
                    showAllTags={db.settings.showAllTags !== false}
                    onOpenTagPicker={openTagPickerWindow}
                    /* 1.3.0 — the tags row's drag writes the GLOBAL order
                       (db.tags), exactly like the panel mount. */
                    onReorderTags={reorderTags}
                    onAttachStamp={attachStampTemplate}
                    onRemoveStamp={removeCharacterStamp}
                    onPromoteStamp={promoteCharacterStamp}
                    onUploadStamp={addStampsToCharacter}
                    onRenameStamp={renameCharacterStamp}
                    onReorderStamps={reorderCharacterStamps}
                    onStampColor={setCharacterStampColor}
                    onStampTransform={setCharacterStampTransform}
                    confirm={confirm}
                    onStatus={setStatusTransient}
                    onActiveVersion={handleActiveVersion}
                    onUndo={undo}
                    onRedo={redo}
                    canUndo={histLen.u > 0}
                    canRedo={histLen.r > 0}
                    scUndo={(db?.settings?.shortcuts || DEFAULT_SHORTCUTS).undo}
                    scRedo={(db?.settings?.shortcuts || DEFAULT_SHORTCUTS).redo}
                  />
                </div>

                {/* Full-window card view: the bar docks to the bottom of
                    the viewer area (everything except the left tree). */}
                <AnimatePresence initial={false}>
                  {outputBarOn && db && barInFull && (
                    <OutputBar
                      key="output-bar"
                      character={barCharacter}
                      version={barVersion}
                      instant={handoff}
                      onStatus={setStatusTransient}
                      retractRequest={retractRequest}
                      onExpandedChange={setOutputExpandedRef}
                    />
                  )}
                </AnimatePresence>
            </motion.div>
          )}
          </AnimatePresence>
          </div>
        </div>
      </main>

      {/* 1.5.4 — THE CREATION WINDOW'S RETAINED SEAT (see newCardSeatArmed's
          note at the state): ONE NewCharacterModal for the whole session,
          born hidden a beat after the app settles (or on the first open),
          never unmounting again. Rendered BEFORE the window stack below so
          every window that can float ABOVE it (the tag manager, the asks)
          still portals later in the body and wins the paint. `live` rides
          the open state; `openSeq` rides the render-time mirror above — the
          flip and the count land in the same commit, and NewCharacterModal's
          RESET law turns the count into a fresh draft before the first
          paint. The seat is memoized with stable handlers so the app's own
          chatter (status flips, search keystrokes) never re-renders an
          850-node window nobody is looking at. */}
      {db && (newCardSeatArmed || creationOpen) && (
        <NewCardSeat
          key="new-card-seat"
          live={creationOpen}
          openSeq={creationSeqRef.current}
          initialImages={creationOpen ? modal.images : null}
          imagesPath={imagesPathRef.current}
          defaultRatio={db.settings.cardRatio}
          /* 1.5.8 — THE EXPERIMENTAL GATE RIDES THE SEAT (CardStyleControls'
             finishesHidden law): the creation window's finish row offers
             None alone while the master switch is off. */
          finishesHidden={db.settings.livingFinishes === false}
          classes={db.classes}
          defaultClassId={modal?.classId ?? selectedClassId}
          stampLibrary={db.stamps}
          tags={db.tags || []}
          tagManagerOpen={tagManagerOver}
          showHelp={showHelp}
          confirm={confirm}
          onDeleteFromGallery={deleteStampFromGallery}
          onAddToGallery={addStampToGallery}
          onCreate={createCharacter}
          onOpenTagManager={seatOpenTagManager}
          onClose={seatClose}
          onToggleHelp={seatToggleHelp}
        />
      )}

      <AnimatePresence>

        {/* 1.1.2 — THE TAG MANAGER OVER THE CREATION WINDOW: mounted AFTER
            it in the tree (same z plane — later DOM wins the paint), riding
            its own flag so its close NEVER touches the window beneath it
            (see tagManagerOver's note at the state). The manager's own
            writes land in db.tags; the creation window re-renders with the
            fresh vocabulary beneath.
            1.5.4 — THE MANAGER LEAVES WITH ITS EXIT ("when opening the tag
            manager in the card creation window and closing the tag manager,
            it lacks the closing animation, fix that"): every direct child
            of this AnimatePresence now carries an explicit KEY. The
            conditionals were keyless, and framer's exit tracking could not
            tell the manager's slot from the creation window's when BOTH
            were live (the stacked pair is the one place two element
            children coexist here) — the manager's unmount matched nothing
            and the window vanished in a single frame, no exit flight. The
            key gives the manager its own tracked identity: the close plays
            the same fade-and-settle every window speaks (verified live:
            the layer lingers its full ~130ms before leaving). */}
        {tagManagerOver && modal?.type === 'newCharacter' && db && (
          <TagManagerModal
            key="tag-manager-over"
            tags={db.tags}
            characters={db.characters}
            onClose={() => setTagManagerOver(false)}
            onAddTag={addTag}
            onUpdateTag={updateTag}
            onReorderTags={reorderTags}
            onDeleteTag={deleteTagNow}
            confirm={confirm}
          />
        )}

        {modal?.type === 'settings' && db && (
          <SettingsModal
            key="settings-window"
            settings={db.settings}
            initial={modal.snapshot || db.settings}
            /* 1.7.0 — THE STABLE HANDS (the settings window's memo — see the
               modal's own 1.7.0 note): born-fresh closures here would
               re-render the whole window on every App render. */
            onClose={closeSettingsWindow}
            onChange={applyLiveSetting}
            onRevert={revertSettings}
            /* 0.30.0 — the Data & System tab's maintenance keys.
               1.3.2 — the preview GENERATE and ERASE keys are retired with
               the whole preview system (thumbnails build automatically). */
            onOpenFolder={openFolder}
            onClearCache={clearRendererCache}
            onResetDatabase={resetDatabase}
            /* 1.1.2 — the Data tab's LIBRARY export/import pair
               (App owns every road). */
            onExportLibrary={exportLibrary}
            onImportLibrary={importLibrary}
            /* 1.1.3 — the update channel's verdict + ask, and the factory
               reset's whole road (double confirm included). */
            updateState={updateState}
            onCheckUpdates={checkUpdatesNow}
            onFactoryReset={factoryReset}
            /* 1.2.7 — THE LEDGER (see pushStatusLog): the top bar's last 50
               status lines, read by the Settings → LOGS tab. */
            logs={statusLog}
          />
        )}

        {/* 1.1.2 — THE IMPORT VERDICT WINDOW (see importLibrary): speaks the
            archive's counts and lands MERGE or REPLACE — nothing has been
            written until one of them is pressed. */}
        {importPendingView && (
          <ImportLibraryModal
            key="import-verdict"
            counts={importPendingView.counts}
            path={importPendingView.path}
            onCancel={() => {
              importPendingRef.current = null;
              setImportPendingView(null);
            }}
            onMerge={() => importLibraryCommit('merge')}
            onReplace={() => importLibraryCommit('replace')}
          />
        )}

        {modal?.type === 'tagManager' && db && (
          <TagManagerModal
            key="tag-manager-window"
            tags={db.tags}
            characters={db.characters}
            onClose={() => setModal(null)}
            onAddTag={addTag}
            onUpdateTag={updateTag}
            onReorderTags={reorderTags}
            onDeleteTag={deleteTagNow}
            confirm={confirm}
          />
        )}

        {/* 1.7.5 — THE TAG PICKER WINDOW (the UNSELECTED TAGS switch's off
            mode — see TagPickerModal's own note): the + TAGS keys' first
            door while unselected tags are hidden; the manager rides inside
            it as the footer's own key, replacing this window when it
            opens.
            1.7.9 — THE PICKER'S OWN HAND ("allow me to drag and sort them,
            simmilar to how it works normally"): the picker speaks the same
            reorder door the manager and the wall ride — reorderTags below
            (App's own callback), so a drag in the off-mode window commits
            the GLOBAL order exactly as it does everywhere else. */}
        {modal?.type === 'tagPicker' && db && (
          <TagPickerModal
            key="tag-picker-window"
            tags={db.tags}
            character={db.characters.find((c) => c.id === modal.characterId) || null}
            onToggleTag={toggleTag}
            onOpenTagManager={openTagManagerWindow}
            onReorderTags={reorderTags}
            onClose={() => setModal(null)}
            /* 1.8.0 — the footer's hint joins the HELP TEXT law (the
               picker's own report — the instruction line teaches, it does
               not decorate). */
            showHelp={showHelp}
          />
        )}

        {confirmState && (
          <ConfirmModal
            key="confirm-ask"
            title={confirmState.title}
            message={confirmState.message}
            confirmLabel={confirmState.confirmLabel}
            danger={confirmState.danger}
            overAll={confirmState.overAll === true}
            onCancel={() => {
              setConfirmState(null);
              confirmRef.current = null;
            }}
            onConfirm={() => {
              const opts = confirmRef.current;
              setConfirmState(null);
              confirmRef.current = null;
              opts?.onConfirm?.();
            }}
          />
        )}

        {showClosePrompt && (
          <ClosePromptModal
            key="close-prompt"
            onCancel={() => setShowClosePrompt(false)}
            onDiscard={() => handleClose(false)}
            onSave={() => handleClose(true)}
          />
        )}

        {/* 0.30.0 — THE RIGHT-CLICK MENU (built by the contextmenu listener
            above; painting it through AnimatePresence gives it the same
            pop-in/out language as the other windows). */}
        {ctxMenu && (
          <GdContextMenu
            key={ctxMenu.x + '-' + ctxMenu.y}
            x={ctxMenu.x}
            y={ctxMenu.y}
            items={ctxMenu.items}
            onClose={() => setCtxMenu(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* 1.2.7 — THE SPLASH SEAT. 1.3.3 — THE SWITCH SPEAKS ITS OWN NAME
            ("reverse the splash film reel option in settings, when its on
            its on when its off its off"): the old splashGeneratedReels key
            was inverted from the label (ON = generated pixel frames, OFF =
            the real covers). splashFilmReels is honest: OFF (=== false)
            mounts NO reels at all — the wings stay empty and no covers are
            read at boot; ON (the default, and anything unset) rolls the
            pool exactly as the 1.2.6 law speaks it. null still means
            "db not landed" — the wings stay empty until the pool is
            known. */}
        {splashVisible && (
          <Splash
            status={status}
            loaded={loaded}
            reels={db ? (db.settings?.splashFilmReels === false ? null : reelPool) : null}
          />
        )}
      </AnimatePresence>

      {/* 1.0.3 — THE APP-LEVEL EDIT CARD WINDOW: one window, every entry
          point. The grid card's right-click Edit key, the open card's own
          region menu and the gear's EDIT CARD key all ride openCardLook,
          which parks a request here WITHOUT opening the card anywhere — so
          editing never drags the details panel (or the full-window view)
          along ("fix the issue where right click and editing the card it
          would pop the details panel right away"). The request is CONSUMED
          on close/apply, so a later plain card open can never inherit it
          ("when i open a card it would pop the edit card window right
          away" — fixed). key=id: a re-pick while the window already sits
          open keeps its draft; after it closes, the next pick mounts fresh. */}
      <AnimatePresence>
        {lookRequest && lookCharacter && (
          <CardLookModal
            key={lookRequest.id}
            character={lookCharacter}
            coverUrl={lookCoverUrl}
            /* 1.6.2 — the thumb tier feeds the window's placeholder (the
               progressive ladder — see lookCoverThumbUrl's note). */
            coverThumbUrl={lookCoverThumbUrl}
            coverAspect={lookCoverAspect}
            defaultRatio={db?.settings?.cardRatio}
            imagesPath={imagesPathRef.current}
            stampLibrary={db?.stamps}
            /* 1.5.9 — the experimental gate rides the App-level window too
               (the 1.5.8 seat crashed on the bare identifier; the switch now
               reaches the window's finish row the way it always should
               have). */
            finishesHidden={db?.settings?.livingFinishes === false}
            onClose={() => setLookRequest(null)}
            onApply={(card) => {
              // 1.4.0 — THE STAMP SETTINGS RIDE THE SAME COMMIT ("include
              // also stamp color and settings option inside that window"):
              // the window's own draft (hue + transparency + the over-trim
              // switch + position / scale / rotation / confinement) merges
              // onto the card's sanitized settings INSIDE the same mutate
              // the look fields speak — one DONE, one history entry, one
              // undo step for the whole window (the panel's live lanes
              // stay exactly as they were; this is the window's own voice).
              patchCharacter(
                lookCharacter.id,
                (c) => {
                  const next = {
                    // 0.41.0 — the NAME rides the same commit: the window IS the
                    // card's editor now ("include it in the card look options,
                    // and edit it to be edit card instead").
                    name: card.name,
                    cardRatio: card.ratio,
                    cardTrim: card.trim,
                    // 1.6.2 — the trim's own ink rides the same commit (the
                    // color picker's seat — one DONE, one undo step).
                    cardTrimColor: isHexColor(card.trimColor) ? card.trimColor : null,
                    cardCrop: card.crop,
                    // 0.38.0 — the CARD COLOR rides the same commit.
                    cardColor: card.color,
                    // 1.3.8 — THE CARD'S OWN LOOKS ride it too: the finish
                    // (+ its image switch) — one commit, one undo step, exactly
                    // like the color always has. 1.3.9 — the secondary color
                    // and the pattern left with the feature (the retire law at
                    // CARD_FINISHES in constants); the window no longer speaks
                    // them, and the sanitizer drops them from saved cards.
                    cardFinish: card.finish,
                    cardFinishOnImage: card.finishOnImage,
                    // 1.9.5 — the coat's own volume rides the same commit
                    // (the transparency knob — one family, one undo step).
                    cardFinishTransparency: normalizeFinishTransparency(card.finishTransparency),
                    // 1.9.6 — the split volume rides the same commit (the
                    // checkbox + the image knob — one family, one undo
                    // step).
                    cardFinishSplitImage: card.finishSplitImage === true,
                    cardFinishImageTransparency: normalizeFinishTransparency(card.finishImageTransparency),
                    // 1.4.5 — the coat's trim reach rides the same
                    // commit. 1.7.2 — the stamp reach is retired with the
                    // option: the saved field never arms anything anymore,
                    // and a card edited here keeps whatever it wore (the
                    // inert data rides untouched — the classic look is
                    // the only law now).
                    cardFinishOnTrim: card.finishOnTrim === true,
                    // 1.4.1 — the image's own sway switch rides the same
                    // commit (the switch beside affect-the-image).
                    cardImageMotion: card.imageMotion === true,
                    // 1.4.7 — the stamp's trailing sway switch rides the
                    // same commit (one family, one undo step).
                    cardStampMotion: card.stampMotion === true,
                  };
                  // 1.4.0 — the stamp settings ride the same commit; 1.4.1 —
                  // the hue drafts even on a card with no stamps ("allow me
                  // to have a hue setting even when there is no stamp"): the
                  // sanitized settings sit on the card and speak the moment
                  // a stamp arrives (the merge keeps the card's own fields
                  // wherever the window never spoke).
                  if (card.stampSettings) {
                    next.stampSettings = {
                      ...sanitizeStampSettings(c.stampSettings),
                      ...sanitizeStampSettings(card.stampSettings),
                    };
                  }
                  return next;
                },
                'look:' + lookCharacter.id
              );
              setLookRequest(null);
              /* 1.5.9 — the verdict speaks the card's own name ("feedback
                 of changing cards, as in feedback of tags and stamps and
                 name and what not"): the window edits the name, the look,
                 the finish family and the stamp settings in one commit —
                 a bare "Card updated" never said WHO was updated. */
              setStatusTransient(`Card "${stripRichText(card.name).trim()}" updated`);
            }}
          />
        )}
      </AnimatePresence>

      {/* 1.1.4 — THE UPDATE WINDOW: mounted once per crossing (see the
          boot check at the top) — it speaks the version the machine ran
          last and the one it runs now, and closing it seals the memory.
          1.1.5 — AND IT LEAVES WITH A FADE ("the update window should have
          an out animation, like the fadeout instead of just dissapearing"):
          the window was the only one mounted OUTSIDE an AnimatePresence, so
          clearing updateNotice unmounted it in a single frame — the card's
          exit flight (Modal.jsx already speaks opacity + a small settle)
          never got to run. The same wrapper every other window rides gives
          it the built-in fade-out: the card settles down through its
          0.16s exit while the backdrop dissolves, instead of blinking out. */}
      <AnimatePresence>
        {/* 1.5.7 — THE UPDATE WINDOW STANDS ON ITS OWN ("if the user clicks
            on decline and closes the app and then reopens it, ensure the
            update window will stil popup, so its like a seperate check so
            the user doesnt miss anything"): the mount condition gains the
            gate — while the terms window owns the stage, the update window
            does not exist at all (before, both mounted together: the update
            card sat BENEATH the gate's layer, invisible but alive, and its
            Escape listener was the one that answered — a habit press of
            Esc while reading the terms SEALED the crossing sight unseen
            and closed a window the user never saw; decline, reopen, and
            the update window was gone for good). The two checks are fully
            separate now: the gate asks (and re-asks after every decline,
            because decline saves nothing), and ONLY its resolution unmounts
            this window — the crossing celebrates after the terms are
            answered, every time, and the seal still belongs to the
            window's own close alone. */}
        {updateNotice && !legalGate && (
          <UpdateModal fromVersion={updateNotice.from} toVersion={updateNotice.to} onClose={sealUpdateNotice} />
        )}
      </AnimatePresence>

      {/* 1.5.5 — THE LEGAL GATE (see legalGate's seat near the boot's
          verdicts): mounted whenever the archive's terms acceptance does
          not match the running TOS_VERSION — every pre-1.5.5 database and
          fresh install (the seat never existed), plus any future terms
          bump. Rendered AFTER the update window's block so it stacks ABOVE
          it: the gate owns the stage until it is answered (accept writes +
          saves; decline closes the app). The gate's own card is
          close-locked by design — there is no ✕, no Escape, no backdrop
          exit: the only roads out are the two labeled keys. */}
      <AnimatePresence>
        {legalGate && (
          <LegalModal variant="gate" onAccept={acceptLegal} onDecline={declineLegal} />
        )}
      </AnimatePresence>

      {/* 0.35.0 — THE GLOBAL FEEDBACK LAYER: one hub catches every gd-toast
          event (setStatusTransient routes the whole app's verdicts through
          them — creations, deletes, saves, auto-saves, paste verdicts…) and
          paints the pill stack at the top of the screen, ABOVE every window
          (z-1100), so feedback reads even while the settings window, the
          image manager or any other window is open. It portals itself to
          document.body, so no transforming ancestor can ever trap it. */}
      <ToastHub />
    </div>
    </MotionConfig>
  );
}

// The bottom output bar — docked INSIDE the viewer column (between the class
// tree and the card panel), flush with the bottom edge, showing the composed
// output of the version being edited. 1.0.1: the bar grows/shrinks by HEIGHT
// (the right panel's curtain law — the viewer stretches with it and the
// background is covered/revealed edge-first, never snapped away).
// 0.8.0: line breaks the user typed render as real line breaks, and the
// EXPAND button covers the whole card-viewing area with the full prompt —
// press it again and it contracts back to the bottom, revealing the cards.
// 1.0.7 — THE FULL-WINDOW COVER'S FLIGHTS, as variants resolved through
// AnimatePresence's `custom` (the hand-off flag). A NORMAL open keeps the
// language the cover has always spoken: in from the right (x: 20), out with
// the readable 0.39.0 flight (x: 44). A PANEL HAND-OFF fades IN PLACE both
// ways — no directional motion at all, just the cover settling over (or
// dissolving off) the seat the card already occupies while the panel's edge
// slides beneath it. One motion instead of two; the transfer reads as the
// same view widening, not as content packing itself away and unpacking.
const CHAR_COVER_VARIANTS = {
  enter: (handoff) => (handoff ? { opacity: 0, x: 0 } : { opacity: 0, x: 20 }),
  center: { opacity: 1, x: 0 },
  /* 1.2.0 — THE CLOSE READS AS A CLOSE ("add closing animation to the full
     detail panel"): the old out-flight (44px in 0.2s) finished most of its
     motion inside the first two frames — on the user's machine it read as
     an instant vanish, no closing ANIMATION at all.
     1.2.6 — THE SLIDE STAYS VISIBLE ("the full screen detail window needs
     an animation when closing — it has none"): the 1.2.0 exit WAS running
     (measured live: x 240→368, 128px of travel) but the linear fade
     buried it — opacity hit 0.31 by 50ms and 0.04 by 117ms, so
     three-quarters of the flight was invisible and the close read as a
     blink. The opacity now HOLDS while the cover travels: keyframed
     [1, 1, 0] with the fade packed into the last 40% of a slightly longer
     clock — the first ~180ms is a fully OPAQUE slide away (a close you
     can see), the tail breathes out. The hand-off crossfade stays in
     place (a transfer, not a close). */
  exit: (handoff) =>
    handoff
      ? { opacity: 0, x: 0 }
      : {
          opacity: [1, 1, 0],
          x: 88,
          /* the exit's OWN clock (framer honors the transition that rides
             the variant): 0.3s of travel, opacity keyframed to hold until
             the 60% mark — the slide stays OPAQUE for its first ~180ms. */
          transition: {
            duration: 0.3,
            ease: [0.3, 0.7, 0.3, 1],
            opacity: { duration: 0.3, times: [0, 0.6, 1], ease: 'linear' },
          },
        },
};

function OutputBar({ character, version, onStatus, instant = false, retractRequest = 0, onExpandedChange = null }) {
  const [expanded, setExpanded] = useState(false);
  const stats = useMemo(() => countOutputStats(version), [version]);
  // 1.7.0 — THE BAR FITS ITS CONTENT WITH A FLIGHT ("when i switch cards,
  // the bottom panel for the composed output just snaps to the new size,
  // instead the container should be animated to fit the new size"): the
  // bar animates height:'auto' exactly ONCE — at mount — and every later
  // content change (the switched card's name, its version chip, a longer
  // or shorter composed pre) reflowed the box in a single frame: the
  // snap. The content now sits in a measured inner wrapper whose honest
  // height a ResizeObserver threads into the flight — each card switch
  // retargets the SAME height animation the mount spoke (0.15s easeOut,
  // the bar's own clock) and the box GLIDES to the new size while the
  // swap's 190ms fade breathes inside it (the container never fades —
  // the 1.6.9 law holds). RO-less hosts (the test DOM) keep the plain
  // 'auto': the classic behavior, byte-for-byte.
  const barInnerRef = useRef(null);
  const [barH, setBarH] = useState(0);
  useEffect(() => {
    const inner = barInnerRef.current;
    if (!inner || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => {
      const h = Math.round(inner.offsetHeight || 0);
      setBarH((was) => (was === h ? was : h));
    });
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);
  /* 1.6.9 — THE BAR'S OWN SWAP FLIGHT ("add the fade feedback of switching
     cards to the bottom composed output panel too, same logic, dont fade
     the container, animate its expansion and shrink, but fade whats
     inside, except buttons, also account for it resizing in animation and
     the text fading properly without being stretched"): the bar follows the
     card the panel edits, and on a card switch its contents (the name, the
     version chip, the composed output) all changed at once with nothing
     saying so. The panel's own flight rides a root class + CSS descendant
     seats; the bar borrows the same law: a .gd-ob-swap class lands for the
     flight's 190ms breath and the CONTENT seats inside (the texts, the
     chip, the output) fade in — the CONTAINER never does. The bar's own
     height already tweens with its content (framer's height flight — the
     expansion and shrink the request names: the box grows and shrinks
     WHILE the text inside fades, the clip keeping the fade honest — the
     <pre> fades as opacity, never stretched, and the keys (EXPAND / COPY /
     CONTRACT) stay solid, exactly the except-buttons law the panel
     speaks). */
  const obSwapIdRef = useRef(null);
  const obSwapTimerRef = useRef(0);
  const [obSwap, setObSwap] = useState(false);
  useLayoutEffect(() => {
    const id = character?.id || null;
    const prev = obSwapIdRef.current;
    obSwapIdRef.current = id;
    if (prev == null || prev === id) return;
    if (obSwapTimerRef.current) clearTimeout(obSwapTimerRef.current);
    setObSwap(true);
    obSwapTimerRef.current = setTimeout(() => {
      obSwapTimerRef.current = 0;
      setObSwap(false);
    }, 190);
  }, [character?.id]);
  useEffect(
    () => () => {
      if (obSwapTimerRef.current) clearTimeout(obSwapTimerRef.current);
    },
    []
  );

  // 1.1.1 — THE REMOTE RETRACT ("clicking back while the output window is
  // expanded … fix that so it gets retracted too"): framer's exit law froze
  // every child animation inside an exiting parent (measured: on BACK the
  // bar's height flight and the cover's slide never ran — the whole column
  // vanished in one frame with the parent). App RETRACTS the cover FIRST,
  // while the tree is still alive, and only then closes the view: this nonce
  // lands from closeViewToGrid(), the cover plays its contract flight, and
  // the view close follows it out. The nonce pattern is the lookRequest
  // law's little sibling — a rising number says "do it now", never "it
  // changed".
  // 1.7.1 — THE RETRACT PLAYS OUTSIDE FRAMER (the live A/B: the concurrent
  // back of the 1.7.1 first cut wedged the renderer whole — the pristine
  // 1.7.0 tree closed clean under the identical probe): the bar's outer
  // presence tears its subtree down the moment the BAR's own height exit
  // completes, and a NESTED presence child mid-exit at that instant is a
  // bookkeeping race framer never resolves — the teardown waits on a flight
  // the rip itself is destroying. The cover's contract now rides a CSS
  // animation (the same 0.15s fade + settle, keyframed in index.css) while
  // `expanded` holds true a beat longer: the three flights still LEAVE
  // together — the cover's CSS fade beside the bar's height exit beside the
  // panel's width curtain — but the outer presence only ever tracks the
  // bar's own exit, and the inner child it rips is mounted, not exiting:
  // a plain unmount, never a pending promise. A 165ms beat later the cover
  // unmounts for real (its framer exit reads the CSS's settled opacity 0
  // and completes instantly — nothing to see either way).
  const [coverOut, setCoverOut] = useState(false);
  const coverOutTimerRef = useRef(0);
  useEffect(() => {
    if (retractRequest) {
      setCoverOut(true);
      if (coverOutTimerRef.current) clearTimeout(coverOutTimerRef.current);
      coverOutTimerRef.current = setTimeout(() => {
        coverOutTimerRef.current = 0;
        setExpanded(false);
      }, 165);
    }
  }, [retractRequest]);
  useEffect(
    () => () => {
      if (coverOutTimerRef.current) clearTimeout(coverOutTimerRef.current);
    },
    []
  );
  // 1.1.1 — App needs the cover's own truth to decide whether a back needs
  // the two-phase close: the state mirrors up on every flip, through a ref
  // on App's side (no re-render of the world for a bookkeeping ping).
  useEffect(() => {
    onExpandedChange?.(expanded);
     
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const copy = async () => {
    if (!stats.output) return;
    try {
      await window.api.clipboardWriteText(stats.output);
      onStatus('Output copied ✓');
    } catch {
      onStatus('Copy failed', 'fail');
    }
  };

  return (
    <>
      <motion.div
        className={clsx('gd-output-bar flex-shrink-0', obSwap && 'gd-ob-swap')}
        /* 1.0.1 — THE BAR STRETCHES, IT DOESN'T SNAP ("the bottom panel,
           when popping in or out, it should act like the right panel when it
           deals with background textures, as it exposes it slowly as it
           retracts or covers slowly as it expands"): the HEIGHT animates now
           (not a y-slide under an already-shortened viewer) — the same law
           the right panel has spoken since 0.38.0. The viewer column, its
           toolbar and the grid's pattern all stretch and relax WITH the bar;
           the background is only ever hidden by the bar's own top edge as it
           rises, and closing lowers that edge back slowly, revealing what was
           beneath. The node carries overflow: hidden (index.css) so the
           content reveals under the rising edge — header first, output last —
           exactly like the panel's inner column under its sliding edge.
           1.0.7 — EXCEPT DURING A HAND-OFF (instant): the bar used to
           retract all the way to zero in one column and then grow back from
           zero in the other — a full "retract then repull" of its own on
           every detail-panel toggle. When App flags a hand-off, the bar
           mounts at its final height (initial={false}): the bar is simply
           THERE under the cover's crossfade, same content, same seat. */
        initial={instant ? false : { height: 0, opacity: 0.6 }}
        animate={{ height: barH > 0 ? barH : 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0.6 }}
        /* 1.4.8 — the cover quickens with the panel (the same 0.15s
           easeOut — one speed for every window the app opens). */
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        {/* 1.7.0 — THE MEASURED INNER WRAPPER (see barInnerRef above): the
            whole bar's content rides one measured box so the RO's honest
            height IS the bar's own content height — the box above glides
            between its sizes instead of snapping. */}
        <div ref={barInnerRef}>
        <div className="flex items-center gap-3 px-4 pt-2 pb-1.5">
          <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute flex-shrink-0 gd-ob-label">COMPOSED OUTPUT</span>
          {/* 1.0.6 — THE HEADER ROW SPEAKS IN PARTS: the name keeps its
              ellipsis and the VERSION CHIP is min-w-0 with a capped,
              ellipsizing label, so EXPAND / COPY never move, whatever the
              texts wear.
              1.0.7 — THE TEXTS ARE THE REAL TEXTS ("ensure that in bottom
              output panel that the version would be accurate in name, with
              text formats and emojies included"): the name and the version
              label render through RichText now — bold, italics, big,
              outline, emojis, everything the label actually wears in the
              version strip — instead of a stripRichText approximation. The
              chip keeps its cap; the titles keep the plain-text hover.
              1.0.8 — THE CHIP IS THE VERSION'S OWN CONTAINER ("the version
              container inside the output panel at the bottom is not
              accurate to the version, it should mimic the version container
              including the emojie icon selected and color"): the chip now
              wears EXACTLY what the version strip's chip wears — the
              version's own COLOR as its face (with readableInk picking the
              text's polarity) and its chosen ICON glyph riding the label,
              the same ChipGlyph the strip renders. What you read at the
              bottom is what you selected up top, tint and glyph included.
              1.0.8 — AND THE STATS WAIT FOR THE EXPANSION ("0/0 parts and
              word count and lines should only be shown when the output
              container expands not when its collapsed"): the collapsed
              bar's header carries NO ledger — parts, words, chars and
              lines live on the expanded cover only, where there is room to
              read them; the resting bar is just the texts and the keys.
              1.0.9 — THE 50/50 SPLIT ("the space below in the output panel
              to show the name of the card and the version name should be
              divided, 50% for the card, 50% for the tag, if one of them
              takes the space but some space is left empty, let the other
              occupy the rest"): the name and the chip now sit in a wrapper
              that owns the row's whole leftover width, and each wears
              gd-out-split — grow from zero, cap at content — so both long
              texts split the space exactly in half (each truncating inside
              its own half) while a short one hands its unused room to the
              other. The label and the keys stay outside the wrapper, so
              the halves are halves OF THE NAME-AND-VERSION SPACE. */}
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <span
              className="gd-out-split text-[11px] font-bold text-gd-chrome truncate"
              title={stripRichText(character.name)}
              /* 1.0.8 — a NAME-LABEL tooltip: two lines and no more. */
              data-gd-tip-name="1"
            >
              <RichText text={character.name} />
            </span>
            <span
              /* gd-chip-flat: a version label, standing straight (1.0.7).
                 1.0.8 — and the version's OWN face + glyph, exactly like the
                 strip's chip (see the header comment above).
                 1.0.9 — gd-out-split carries the seat (the old min-w-0 is
                 its min-width half).
                 1.1.0 — THE CHIP IS THE STRIP CHIP'S EXACT TWIN ("the output
                 panel version emojie is smaller than the normal version
                 emojie"): the slim seat (!py-0.5 !px-2 + a text-[10px] that
                 the .gd-chip base outranked anyway) made the whole container
                 4px shorter than the strip's — and its glyph read smaller
                 with it. The slimming classes are gone: same padding, same
                 12px type, same height — what you read at the bottom is
                 pixel-for-pixel the chip you picked up top. */
              className="gd-out-split gd-chip gd-chip-flat"
              style={version.color ? { background: version.color, color: readableInk(version.color) } : undefined}
              title={stripRichText(version.label)}
              /* 1.0.8 — a NAME-LABEL tooltip: two lines and no more. */
              data-gd-tip-name="1"
            >
              {version.icon && <ChipGlyph name={version.icon} size={12} />}
              <RichText text={version.label} className="gd-chip-label-cap" />
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              className="gd-btn !py-1 !px-2.5"
              onClick={() => {
                /* 1.7.1 — a fresh EXPAND retires any lingering retract class
                   (the CSS-out of a back that never finished unmounting) so
                   the cover enters clean. 1.7.2 — the BODY seat joins the
                   strip (see armCoverRetract): a cover born inside the
                   retract's 380ms window must never inherit a stale
                   goodbye. */
                setCoverOut(false);
                try { document.body.classList.remove('gd-cover-retract'); } catch {}
                setExpanded(true);
              }}
              title="Expand: cover the card area with the full prompt"
            >
              <Maximize2 size={12} />
              EXPAND
            </button>
            <button
              className="gd-btn gd-btn-solid !py-1 !px-3"
              disabled={!stats.output}
              onClick={copy}
              title="Copy the composed prompt to clipboard"
            >
              <Copy size={12} />
              COPY
            </button>
          </div>
        </div>
        <div className="px-4 pb-2">
          <pre className="max-h-[76px] rounded" style={{ background: 'color-mix(in srgb, var(--gd-ink) 6%, var(--gd-panel))', color: 'var(--gd-panel-text)' }}>
            {stats.output || '(nothing to compose yet)'}
          </pre>
        </div>
        </div>
      </motion.div>

      {/* Expanded — covers the entire card-viewing area of this column with
          the full prompt; CONTRACT slides it back down to the bar.
          1.1.1 — THE HEADER'S TWO ROWS ("lines, parts, words and chars all
          should be moved to a new line, first line should contain the two
          buttons and the name and version and the full prompt label"): row
          one carries the FULL PROMPT label, the 50/50 name+version split and
          the CONTRACT / COPY keys; the ledger (parts, words, chars, lines)
          owns its own full-width row underneath. The old single flex-wrap
          row wrapped into up to four ragged lines at real window widths and
          its flex squeeze crushed the version chip to a 28px sliver — the
          "small emoji" report (measured at a 1100px window: chip 28.6px,
          label 0px). Nothing wraps now; nothing starves; the glyph renders
          at its true size whatever the width. */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className={clsx('gd-output-full', obSwap && 'gd-ob-swap', coverOut && 'is-cover-out')}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            /* 1.7.1 — THE COVER JOINS THE HOUSE CLOCK (the 1.7.1 back
               report: "they close together, no pause between the retract
               and the close"): the contract flight spoke 0.18s while the
               bar's own height exit and the panel's width flight speak
               the 0.15s every window has spoken since 1.4.8 — on the
               concurrent back the outer presence tears the bar down at
               its own 150ms completion and the cover's last 30ms popped.
               One clock for all three flights: the cover lands exactly
               as the bar and the panel finish — nothing pops, the close
               reads as one breath. */
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {/* ROW ONE — the label, the split texts, and the two keys. No
                wrap: the row is bounded by the split's own truncation laws,
                and the keys sit outside the split wrapper exactly as the
                collapsed bar's keys do. */}
            <div className="flex items-center gap-3 px-4 pt-3 pb-2">
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-gd-mute flex-shrink-0 gd-ob-label">FULL PROMPT</span>
              {/* 1.0.6 — the same parts-only law as the bar's own header.
                  1.0.7 — and the same REAL-TEXT law: both texts render
                  through RichText (formats + emojis included), capped and
                  titled exactly like the bar.
                  1.1.1 — and the same 50/50 split, now on a row that never
                  wraps: the wrapper owns the leftover width, gd-out-split
                  gives each text its half (and the other's unused room),
                  and the chip's shrink floor (index.css) keeps the version's
                  glyph and a readable label alive under any squeeze — the
                  emoji can never collapse again. */}
              <div className="flex-1 min-w-0 flex items-center gap-3">
                <span
                  className="gd-out-split text-[11px] font-bold text-gd-chrome truncate"
                  title={stripRichText(character.name)}
                  /* 1.0.8 — a NAME-LABEL tooltip: two lines and no more. */
                  data-gd-tip-name="1"
                >
                  <RichText text={character.name} />
                </span>
                <span
                  /* gd-chip-flat: a version label, standing straight (1.0.7).
                     1.0.8 — and the version's OWN face + glyph, exactly like
                     the strip's chip (see the bar's header comment).
                     1.0.9 — gd-out-split carries the seat.
                     1.1.0 — and the strip chip's exact twin, same as the
                     bar's chip (the slimming classes retired).
                     1.1.1 — plus the shrink floor: min-width 96px on the
                     split chip (index.css) so a tight row ellipsizes the
                     label instead of crushing the glyph. */
                  className="gd-out-split gd-chip gd-chip-flat"
                  style={version.color ? { background: version.color, color: readableInk(version.color) } : undefined}
                  title={stripRichText(version.label)}
                  /* 1.0.8 — a NAME-LABEL tooltip: two lines and no more. */
                  data-gd-tip-name="1"
                >
                  {version.icon && <ChipGlyph name={version.icon} size={12} />}
                  <RichText text={version.label} className="gd-chip-label-cap" />
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  className="gd-btn !py-1 !px-2.5"
                  onClick={() => setExpanded(false)}
                  title="Contract: back to the bottom bar, revealing the cards"
                >
                  <Minimize2 size={12} />
                  CONTRACT
                </button>
                <button
                  className="gd-btn gd-btn-solid !py-1 !px-3"
                  disabled={!stats.output}
                  onClick={copy}
                  title="Copy the composed prompt to clipboard"
                >
                  <Copy size={12} />
                  COPY
                </button>
              </div>
            </div>
            {/* ROW TWO — the ledger's own line: parts, words, chars and
                lines moved off the text row entirely (the 1.0.8 law — the
                ledger prints ONLY on this expanded cover — unchanged; its
                SEAT is what moved).
                1.6.9 — THE LEDGER SPEAKS THE SHEET'S OWN CHIP VOICE
                ("when the bottom panel exists, its not showing the 'empty
                skipped' value when expanded, it should show it in the same
                way as it is when the bottom panel is turned off, in those
                small containers around each value and out of what etc.."):
                the row painted as one bare text sentence — no containers,
                and the EMPTY SKIPPED counter was missing entirely, so a
                version with skipped parts never said so on the cover. The
                row re-uses the compose sheet's own stat strip exactly
                (.gd-compose-stats / .gd-compose-stat — the small framed
                containers each value wears when the bottom bar is OFF)
                and the skipped counter rides the accent chip whenever
                there is one to name, the same law the right-hand sheet
                always spoke. */}
            <div className="gd-output-full-stats gd-compose-stats">
              <span className="gd-compose-stat">
                <b>{stats.included}</b>/{stats.total} PARTS
              </span>
              <span className="gd-compose-stat">
                <b>{stats.words}</b> WORDS
              </span>
              <span className="gd-compose-stat">
                <b>{stats.chars}</b> CHARS
              </span>
              <span className="gd-compose-stat">
                <b>{stats.lines}</b> LINES
              </span>
              {stats.skipped > 0 && (
                <span className="gd-compose-stat is-accent">
                  <b>{stats.skipped}</b> EMPTY SKIPPED
                </span>
              )}
            </div>
            <div className="flex-1 min-h-0 px-4 py-3">
              <pre className="gd-output-full-pre">
                {stats.output || '(nothing to compose yet)'}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
