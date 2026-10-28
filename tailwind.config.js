/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: '#000000',
          card: '#141417',
          cardHover: '#1C1C20',
          subcard: '#1F1F24',
          subcardLight: '#2A2A30',
          divider: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(255, 255, 255, 0.10)',
          green: '#D4FB45', // Electric Lime
          lime: '#D4FB45',
          neon: '#30D158', // Apple Neon Green
          orange: '#FF9F0A', // Solar Amber
          cyan: '#38BDF8', // Radiant Ice Blue
          indigo: '#5E5CE6',
          red: '#FF453A',
          yellow: '#FFD60A',
          gray: '#94A3B8', // High legibility silver slate
          darkGray: '#64748B',
          lightGray: '#E2E8F0',
          textMuted: '#94A3B8'
        }
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif'
        ],
        display: [
          '"Plus Jakarta Sans"',
          '-apple-system',
          'sans-serif'
        ],
        mono: [
          '"JetBrains Mono"',
          '"SF Mono"',
          'ui-monospace',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ]
      },
      boxShadow: {
        'apple-card': '0 4px 24px -1px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        'apple-dock': '0 12px 36px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.12)',
        'apple-sheet': '0 -8px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'apple-glow-green': '0 0 20px rgba(212, 251, 69, 0.35)',
        'apple-glow-orange': '0 0 20px rgba(255, 159, 10, 0.35)',
        'apple-glow-cyan': '0 0 20px rgba(56, 189, 248, 0.35)'
      }
    },
  },
  plugins: [],
};
