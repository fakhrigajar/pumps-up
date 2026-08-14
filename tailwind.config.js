/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        plane: 'var(--plane)',
        surface: {
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
        },
        ink: {
          1: 'var(--ink-1)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
        },
        line: 'var(--line)',
        axis: 'var(--axis)',
        accent: 'var(--series-1)',
        'accent-soft': 'var(--accent-soft)',
        status: {
          good: 'var(--status-good)',
          warning: 'var(--status-warning)',
          serious: 'var(--status-serious)',
          critical: 'var(--status-critical)',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11, 11, 11, 0.04)',
        pop: '0 8px 24px rgba(11, 11, 11, 0.12)',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}
