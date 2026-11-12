import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
// 0.27.0 — the stylized tooltip layer: hijacks every `title` attribute at
// the document level and paints a GenDex pill instead of the OS tooltip.
import GdTooltips from './components/GdTooltips.jsx';
// 1.0.9 — THE THEME ARRIVES BEFORE THE FIRST PAINT ("in splash screen, the
// color of the glow sometimes would update from a theme to another, ensure
// that it appears with the right one right away"): the theme used to land
// only when the database loaded, so the splash painted its opening frames
// in the default green and visibly flipped. The snapshot the last
// setThemeOnDocument call persisted is replayed HERE — synchronously,
// before React mounts a thing — so the splash's halo is born in the user's
// own theme and never updates from one theme to another mid-flight.
import { restoreThemeSnapshot } from './utils/theme.js';
import './index.css';

import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource/spectral/500.css';
import '@fontsource/spectral/700.css';

restoreThemeSnapshot();

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <GdTooltips />
    <App />
  </ErrorBoundary>
);
