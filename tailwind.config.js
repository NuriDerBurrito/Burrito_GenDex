/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gd: {
          bg: 'var(--gd-bg)',
          chrome: 'var(--gd-chrome)',
          panel: 'var(--gd-panel)',
          paneltext: 'var(--gd-panel-text)',
          ink: 'var(--gd-ink)',
          line: 'var(--gd-line)',
          mute: 'var(--gd-mute)',
          accent: 'var(--gd-accent)',
          accentink: 'var(--gd-accent-ink)',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        serif: ['Spectral', 'Georgia', 'serif'],
      },
      borderRadius: {
        gd: 'var(--gd-radius)',
      },
    },
  },
  plugins: [],
};
