import { CheckCircle2, Sparkles } from 'lucide-react';
import Modal from './Modal.jsx';
import { APP } from '../constants/index.js';
import gendexLogo from '../assets/gendex_logo.png';

// 1.1.4 — THE UPDATE WINDOW ("create an update window when the app updates
// which says that the app got updated from version x to x, pops up after an
// update"). After an update lands and the app boots, the FIRST thing the
// workspace shows is a small celebratory window speaking the crossing: the
// version this machine ran last time, the version it runs now, and one
// welcoming line. It appears ONCE per update — the renderer remembers the
// last-run version (a localStorage seat, see App's boot check), and a fresh
// install (no memory of a previous version) stays quiet: there is no
// "from" to speak of on day one. Closing the window (CONTINUE, the ✕,
// Escape, the backdrop) writes the new version into the memory, so the
// window can never nag the same crossing twice.
export default function UpdateModal({ fromVersion, toVersion, onClose }) {
  const from = String(fromVersion || '').trim();
  const to = String(toVersion || APP.version).trim();
  return (
    <Modal
      title="GENDEX UPDATED"
      onClose={onClose}
      width="w-[430px]"
      footer={
        <div className="flex justify-end gap-2">
          {/* 1.1.9 — NO AUTOFOCUS ("in update window, dont highlight with an
              outline around the button"): the focused button painted the
              app-wide :focus-visible ring around CONTINUE the moment the
              window opened — an outline the user never asked to see on a
              window whose only action is already the button. The key no
              longer takes focus on mount; a keyboard user still reaches it
              with Tab (and only then is a ring welcome). */}
          <button className="gd-btn gd-btn-solid" onClick={onClose}>
            CONTINUE
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-3 pt-2 pb-1 text-center select-none">
        {/* The mark, on its own small stage — the same logo the splash
            pulses in, at rest and fully colored. */}
        <img src={gendexLogo} alt="" className="w-14 h-14 object-contain" draggable={false} />
        <div className="flex items-center gap-2.5 font-display font-bold" style={{ color: 'var(--gd-panel-text)' }}>
          <span className="gd-card-meta tracking-[0.12em] px-2 py-0.5 border" style={{ borderColor: 'var(--gd-line)', color: 'var(--gd-mute)' }}>
            V{from || '?'}
          </span>
          <Sparkles size={14} style={{ color: 'var(--gd-accent)' }} />
          <span
            className="gd-card-meta tracking-[0.12em] px-2 py-0.5 border-2"
            style={{ borderColor: 'var(--gd-accent)', color: 'var(--gd-accent)' }}
          >
            V{to}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed max-w-[300px]" style={{ color: 'var(--gd-mute)' }}>
          The app got updated from <b style={{ color: 'var(--gd-panel-text)' }}>v{from || '?'}</b> to{' '}
          <b style={{ color: 'var(--gd-panel-text)' }}>v{to}</b>. Your cards, settings and library are exactly where
          you left them.
        </p>
        <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--gd-accent)' }}>
          <CheckCircle2 size={11} />
          Everything carried over
        </div>
      </div>
    </Modal>
  );
}
