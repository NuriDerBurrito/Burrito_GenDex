import { useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Check, Copy, ScrollText } from 'lucide-react';
import { countOutputStats, stripRichText } from '../utils/helpers.js';

// 0.28.0 — THE COMPOSE SHEET ("make the prompt box, the one in the right
// panel better and not too simple"). The old composed-output card was one
// dashed <pre> with a plain COPY key under it — honest, but bare. The sheet
// keeps exactly the same data and the same one-click copy, but dresses like
// the rest of the app: a framed header (glyph chip + title + the version
// it mirrors), a real output surface with its own scroll and typography,
// a stat strip (parts / chars / words / lines — the skipped counter stays
// accent-loud), and a COPY key that CONFIRMS itself ("COPIED ✓" for a beat)
// instead of only writing to the status bar.
export default function ComposePanel({ version, onStatus, showHelp = false }) {
  const stats = useMemo(() => countOutputStats(version), [version]);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef(0);

  const copy = async () => {
    if (!stats.output) return;
    try {
      await window.api.clipboardWriteText(stats.output);
      onStatus('Output copied ✓');
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      onStatus('Copy failed', 'fail');
    }
  };

  const label = version ? stripRichText(version.label || '') : '';

  return (
    // 0.31.0 — data-gd-region="compose": the app-level right-click menu
    // reads this to know the cursor is over the PROMPT SHEET (its menu
    // speaks output — copy, select — not the grid's).
    <div data-gd-region="compose" className="gd-card p-4">
      <div className="gd-rule">COMPOSED OUTPUT</div>

      {/* The sheet — header + output surface as one framed unit. */}
      <div className="gd-compose mt-3">
        <div className="gd-compose-head">
          <span className="gd-compose-ico" aria-hidden>
            <ScrollText size={12} />
          </span>
          <span className="gd-compose-title">
            PROMPT SHEET
            {label ? <span className="gd-compose-ver">: {label}</span> : null}
          </span>
          <span className={clsx('gd-compose-live', stats.output && 'is-live')}>
            <span className="gd-compose-live-dot" aria-hidden />
            {stats.output ? 'LIVE' : 'EMPTY'}
          </span>
        </div>
        <div className="gd-compose-body">
          {stats.output ? (
            <pre className="m-0">{stats.output}</pre>
          ) : (
            <div className="gd-compose-empty">
              <span className="gd-compose-empty-mark" aria-hidden>
                ✖
              </span>
              <span className="text-[9px] tracking-[0.18em] uppercase">Nothing to compose yet</span>
              <span className="gd-compose-empty-hint">add prompt parts below: included ones join here, one per line</span>
            </div>
          )}
        </div>
      </div>

      {/* Stat strip — the sheet's ledger. */}
      <div className="gd-compose-stats">
        <span className="gd-compose-stat">
          <b>{stats.included}</b>/{stats.total} PARTS
        </span>
        <span className="gd-compose-stat">
          <b>{stats.chars}</b> CHARS
        </span>
        <span className="gd-compose-stat">
          <b>{stats.words}</b> WORDS
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

      <button
        className={clsx('gd-btn gd-btn-solid w-full mt-3', copied && 'is-copied')}
        disabled={!stats.output}
        onClick={copy}
        title="Copy the composed prompt to clipboard"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? 'COPIED ✓' : 'COPY OUTPUT'}
      </button>

      {showHelp && (
        <p className="mt-3 text-[10px] leading-relaxed" style={{ color: 'var(--gd-mute)' }}>
          Included parts for this version only, joined one per line; line breaks inside a part are kept.
        </p>
      )}
    </div>
  );
}
