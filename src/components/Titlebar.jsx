import { CircleHelp, PanelBottom, PanelRight, Redo2, RotateCcw, Save, Settings, Speech, Undo2 } from 'lucide-react';
import clsx from 'clsx';
import gendexLogo from '../assets/gendex_logo.png';
import StatusText from './StatusText.jsx';
import { APP, DEFAULT_SHORTCUTS } from '../constants/index.js';

// 0.31.0 — `sc` carries the LIVE shortcut map (settings.shortcuts — see the
// SHORTCUTS editor in Settings → Behavior): the top buttons' tooltips print
// whatever combo the user actually wired, not the shipped default. Falls
// back to DEFAULT_SHORTCUTS when the map is missing (tests, boot races).
// 0.34.0 — THE LOCKOUT ("dont allow me to access the very top bar (the one
// containing the save and settings and so on) when i have another window
// open, dark it out too"): while ANY window is mounted (App watches the
// DOM for [data-gd-modal] and passes `locked`), the bar's app furniture —
// wordmark, history group (undo/redo/save), status, and the app keys
// cluster (tooltips, panel, output bar, settings) — dims and goes inert.
// The WINDOW controls (minimize / maximize / close) stay alive: they are
// OS furniture, and closing the app through a window still runs the
// unsaved-changes prompt.
export default function Titlebar({
  status,
  /* 1.2.6 — THE READ OWNS THE CLOCK (see App's status block): the
     marquee's read time extends the transient hold, the hover freezes it,
     a press skips it. */
  onStatusFlight = null,
  onStatusHold = null,
  onStatusSkip = null,
  maximized,
  locked = false,
  onOpenSettings,
  /* 1.8.6 — THE WHEEL THAT OUTLIVES THE FREEZE (see App's
     openSettingsWindow): while the settings window builds, the gear's
     glyph swaps for the compositor wheel and the key holds the pressed
     darken — "it would replace the icon until the window pops up", the
     report's own word. */
  settingsLoading = false,
  canUndo,
  canRedo,
  canSave = false,
  onUndo,
  onRedo,
  onSave,
  /* 1.1.1 — RESTART ("one next to the save which would restart the app
     from the splash screen, think of it as a refresh, would warn the user
     if there is unsaved changes and require confirmation"): App owns the
     confirm window; the key itself is history-group furniture. */
  onRestart = null,
  /* 1.1.1 — THE THUMB KEY ("the second button which will be on the right
     next to the switches, it will be a button that will generate the
     thumbnails, it will be not highlighted when the thumbnail option is
     turned off and would prompt the user to turn it on if the user tries
     to click on it"): lit while preview thumbs are on, dim while off.
     1.3.2 — THE THUMB KEY IS RETIRED with the whole preview system: the
     thumbnail + preview copies build automatically at import, there is
     nothing left to generate on demand. */
  panelMode,
  onTogglePanel,
  outputBarMode,
  onToggleOutputBar,
  tooltipMode,
  onToggleTooltips,
  /* 1.8.1 — HELP TEXT'S TOP-BAR SEAT ("add a help text switch on the top
     toolbar next to the tooltips option and side panel and bottom panel
     option"): the teaching copy's switch lived only in the two windows'
     footers — the seat the lesson itself gates, hidden behind the very
     thing it opens. The key joins the app keys here, speaking the SAME
     db.settings.showHelpText the footers write. */
  helpMode = false,
  onToggleHelp = null,
  sc = DEFAULT_SHORTCUTS,
}) {
  const api = typeof window !== 'undefined' ? window.api : null;
  const combo = (id) => sc?.[id] || DEFAULT_SHORTCUTS[id];

  return (
    <div
      data-gd-region="titlebar"
      className={clsx('gd-titlebar drag-region absolute top-0 left-0 right-0 h-10 z-[400] flex items-center px-3', locked && 'is-locked')}
    >
      {/* 1.0.2 — THE WORDMARK TAB: GENDEX (the tilted ✖ is retired) with
          the burrito mark riding the tab's left edge, oversized and CLIPPING
          OUT of its container like a sticker stuck on the tab — hover plays a
          small springy pop, the cursor leaving eases it back home (CSS lives
          on .gd-wordmark-logo in index.css — transform-only, compositor
          friendly).
          1.0.8 — THE TOOLTIP SPEAKS THE VERSION ("when hovering over the top
          left on the app icon and tooltip appears, include app version in it
          too"): the pill reads "Burrito GenDex (vX.Y.Z)" — the studio name
          and the build you are running, straight from APP.version, so the
          number never drifts from the About page or the splash. */}
      <div className="gd-wordmark-tab no-drag flex-shrink-0" title={`Burrito GenDex (v${APP.version})`}>
        <img src={gendexLogo} alt="" className="gd-wordmark-logo no-drag" draggable={false} />
        GENDEX
      </div>

      {/* 0.24.0 — HISTORY GROUP: undo + redo + SAVE in one framed container
          (they were two bare floating icon buttons — the only unframed
          controls in the titlebar). The group reads like the other button
          clusters. SAVE is a labeled key: solid + warm while there ARE
          unsaved changes, greyed out the moment everything is saved. */}
      <div className="gd-history-group no-drag flex-shrink-0 ml-1.5" role="group" aria-label="History">
        <button className={clsx('gd-icon-btn', canUndo && 'gd-is-live')} title={`Undo (${combo('undo')})`} disabled={!canUndo} onClick={onUndo}>
          <Undo2 size={13} />
        </button>
        <span className="gd-history-sep" aria-hidden />
        <button className={clsx('gd-icon-btn', canRedo && 'gd-is-live')} title={`Redo (${combo('redo')})`} disabled={!canRedo} onClick={onRedo}>
          <Redo2 size={13} />
        </button>
        <span className="gd-history-sep" aria-hidden />
        <button
          className="gd-icon-btn gd-history-save"
          title={canSave ? `Save (${combo('save')})` : 'All saved'}
          disabled={!canSave}
          onClick={onSave}
        >
          <Save size={13} />
          SAVE
        </button>
        {/* 1.1.1 — THE RESTART KEY: a refresh through the whole boot — the
            splash, the sweep, the phases. Unsaved work meets the confirm
            window before anything reloads (App's restartApp). It rides the
            history group's tail, right beside SAVE, and stays live whatever
            the tree's state — the one key that can always fix a bad frame. */}
        {onRestart && (
          <button className="gd-icon-btn is-keyed" title="Restart the app (from the splash screen)" onClick={onRestart}>
            <RotateCcw size={13} />
          </button>
        )}
      </div>

      {/* 0.34.0 — the status text gets its own wrap so the lockout can dim
          it with the rest of the app furniture. */}
      <span className={clsx('contents', locked && 'gd-titlebar-locked-bit')}>
        <StatusText text={status} onFlight={onStatusFlight} onHold={onStatusHold} onSkip={onStatusSkip} />
      </span>

      <div className="ml-auto flex items-center gap-2 flex-shrink-0 no-drag">
        {/* 0.34.0 — THE APP KEYS cluster: wrapped so the LOCKOUT can dim and
            inert the whole group at once. The window controls after the
            divider stay live while locked. */}
        <div className={clsx('flex items-center gap-2 flex-shrink-0', locked && 'gd-titlebar-locked-bit')}>
        {/* 0.29.0 — TOOLTIPS: the app-wide on/off ("on will have them on,
            off will have them off") — the same switch lives in Settings →
            Look. OFF strips the hover pills entirely (the OS-native boxes
            stay suppressed — off means OFF).
            0.30.0 — top buttons carry their SHORTCUTS in the tooltip
            ("add shortcuts to the top buttons") — Alt+T here, and the
            tooltips are trimmed to the short form. */}
        <button
          className="gd-btn !px-2 !py-1"
          title={tooltipMode ? `Tooltips on (${combo('tooltips')})` : `Tooltips off (${combo('tooltips')})`}
          onClick={onToggleTooltips}
        >
          <Speech size={13} />
          <span className={`gd-switch ${tooltipMode ? 'is-on' : ''}`} aria-hidden="true" />
        </button>
        {/* 1.8.1 — HELP TEXT JOINS THE APP KEYS: the teaching copy's only
            seats were the two windows' footers (Settings + the creation
            window) — the switch itself hidden behind the lesson it gates.
            The HELP TEXT key rides the cluster's second seat, right beside
            its fellow teacher TOOLTIPS: same button, same pill, the same
            db.settings.showHelpText the footers write — one switch, every
            seat, the explanatory paragraphs answering at the bar now.
            1.8.2 — THE KEY EARNS ITS COMBO ("add a shortcut to the help
            text, also its tooltip should include the shortcut instead of
            the 'explanatory paragraph' text"): Alt+H by default — the
            bar-toggle family's own row (see DEFAULT_SHORTCUTS), read LIVE
            from the same reassigned map the siblings read — and the
            tooltip speaks the sibling form now: the on/off word and the
            combo in parens, exactly the way TOOLTIPS answers beside it,
            the explanatory sentence riding off with the paragraph it
            named. */}
        <button
          className="gd-btn !px-2 !py-1"
          title={helpMode ? `Help text on (${combo('helpText')})` : `Help text off (${combo('helpText')})`}
          onClick={onToggleHelp}
        >
          <CircleHelp size={13} />
          <span className={`gd-switch ${helpMode ? 'is-on' : ''}`} aria-hidden="true" />
        </button>
        <button
          className="gd-btn !px-2 !py-1"
          title={`Detail panel: right panel / full window (${combo('panel')})`}
          onClick={onTogglePanel}
        >
          <PanelRight size={13} />
          <span className={`gd-switch ${panelMode ? 'is-on' : ''}`} aria-hidden="true" />
        </button>
        <button
          className="gd-btn !px-2 !py-1"
          title={`Output bar: bottom dock / card view (${combo('outputBar')})`}
          onClick={onToggleOutputBar}
        >
          <PanelBottom size={13} />
          <span className={`gd-switch ${outputBarMode ? 'is-on' : ''}`} aria-hidden="true" />
        </button>
        {/* 1.1.1 — THE THUMB KEY: the preview-thumbnail generator, seated
            with the switches (after the output-bar switch, before the
            settings gear). gd-is-live while the option is ON — the lit
            reading every live control in the bar speaks; unlit while OFF,
            and App's handler offers to turn the option on before running. */}
        {/* 1.3.2 — the THUMB key is retired with the preview system (see
            the props note above): thumbnails build automatically. */}
        {/* 1.8.6 — THE WHEEL THAT OUTLIVES THE FREEZE (see App's
            openSettingsWindow): while the settings window builds, the
            gear's glyph swaps for the compositor wheel and the key holds
            the pressed darken — "it would replace the icon until the
            window pops up", the report's own word. */}
        <button
          className={clsx('gd-icon-btn is-keyed', settingsLoading && 'is-loading')}
          title={`Settings (${combo('settings')})`}
          onClick={onOpenSettings}
        >
          {settingsLoading ? <span className="gd-wheel" aria-hidden /> : <Settings size={14} />}
        </button>
        </div>
        <div className="w-px h-4 mx-1" style={{ background: 'var(--gd-line)' }} />

        <button className="gd-win-btn" title="Minimize" onClick={() => api.windowControl('minimize')}>
          <span className="block w-[9px] h-[2px] bg-current" />
        </button>
        <button
          className="gd-win-btn"
          title={maximized ? 'Restore' : 'Maximize'}
          onClick={() => api.windowControl('maximize')}
        >
          {maximized ? (
            <span className="relative block w-[10px] h-[10px]">
              <span className="absolute top-0 right-0 w-[7px] h-[7px] border-2 border-current" />
              <span className="absolute bottom-0 left-0 w-[7px] h-[7px] border-2 border-current bg-[var(--gd-titlebar)]" />
            </span>
          ) : (
            <span className="block w-[9px] h-[9px] border-2 border-current" />
          )}
        </button>
        <button className="gd-win-btn gd-win-close" title="Close" onClick={() => api.windowControl('close')}>
          <span className="text-[13px] leading-none font-bold">✖</span>
        </button>
      </div>
    </div>
  );
}
