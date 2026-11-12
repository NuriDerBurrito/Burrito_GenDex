import { Component } from 'react';
import { AlertTriangle, ClipboardCopy, RefreshCw, Save } from 'lucide-react';
import { APP } from '../constants/index.js';

// 0.25.0 — THE GREY SCREEN MUST NEVER COME BACK. 0.24.0 shipped a render-time
// TDZ crash (a useCallback deps array naming a const declared 20 lines lower):
// React unmounted the WHOLE tree and the window sat as an empty grey void —
// no message, no recovery, edits lost. This boundary sits ABOVE <App/> in
// renderer.js, so any future render crash lands on a proper GenDex panel
// instead: what broke, a COPY REPORT key, and — because App mirrors its db
// state onto window.__GENDX_DB after every commit — a SAVE & RELOAD key that
// writes the LAST GOOD db to disk before reloading, so even a crash mid
// session doesn't eat your unsaved work.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, saved: null };
    this.onSaveAndReload = this.onSaveAndReload.bind(this);
    this.onCopyReport = this.onCopyReport.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error, saved: null };
  }

  componentDidCatch(error, info) {
    this.errorInfo = info;
  }

  async onSaveAndReload() {
    const api = typeof window !== 'undefined' ? window.api : null;
    const snapshot = typeof window !== 'undefined' ? window.__GENDX_DB : null;
    if (!api || !snapshot) {
      this.setState({ saved: 'no' });
      return;
    }
    try {
      const res = await api.saveDB(snapshot);
      if (res && res.ok === false) throw new Error(res.error);
      this.setState({ saved: 'ok' }, () => setTimeout(() => window.location.reload(), 350));
    } catch {
      this.setState({ saved: 'no' });
    }
  }

  onCopyReport() {
    const err = this.state.error;
    const lines = [
      `${APP.name} v${APP.version} crash report`,
      new Date().toISOString(),
      '',
      String(err?.message || err),
      String(err?.stack || ''),
      this.errorInfo?.componentStack ? `\ncomponent stack:\n${this.errorInfo.componentStack}` : '',
    ].join('\n');
    const api = typeof window !== 'undefined' ? window.api : null;
    if (api?.clipboardWriteText) api.clipboardWriteText(lines);
    else if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(lines).catch(() => {});
    this.setState((s) => ({ saved: s.saved || 'copied' }));
  }

  render() {
    const { error, saved } = this.state;
    if (!error) return this.props.children;
    const hasSnapshot = typeof window !== 'undefined' && !!window.__GENDX_DB;

    return (
      <div className="fixed inset-0 z-[10000] gd-crash-bg flex items-center justify-center p-6">
        <div className="gd-crash-panel w-full max-w-xl">
          <div className="gd-crash-head">
            <AlertTriangle size={15} />
            <span>SOMETHING BROKE</span>
            <span className="ml-auto gd-crash-ver">V{APP.version}</span>
          </div>

          <p className="gd-crash-lede">
            A rendering error stopped the interface. Your library lives in a file on disk; this screen only means
            the window stopped drawing. If you made edits you had not saved yet, SAVE &amp; RELOAD below writes the
            last good state before restarting.
          </p>

          <pre className="gd-crash-report">{String(error?.message || error)}</pre>

          <div className="gd-crash-keys">
            <button
              className="gd-btn !py-1.5"
              onClick={() => window.location.reload()}
              title="Restart the interface (unsaved edits since the last save are kept only via Save & Reload)"
            >
              <RefreshCw size={13} />
              RELOAD
            </button>
            <button
              className="gd-btn gd-crash-save !py-1.5"
              onClick={this.onSaveAndReload}
              disabled={!hasSnapshot || saved === 'ok' || saved === 'no'}
              title={hasSnapshot ? 'Write the last good database to disk, then restart' : 'No database snapshot available'}
            >
              <Save size={13} />
              {saved === 'ok' ? 'SAVED: RELOADING…' : saved === 'no' ? 'SAVE FAILED' : 'SAVE & RELOAD'}
            </button>
            <button
              className="gd-btn !py-1.5"
              onClick={this.onCopyReport}
              title="Copy the error details to the clipboard (for a bug report)"
            >
              <ClipboardCopy size={13} />
              COPY REPORT
            </button>
          </div>

          {saved === 'no' && (
            <p className="gd-crash-note">
              The snapshot could not be written; your last manual save on disk is untouched.
            </p>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
