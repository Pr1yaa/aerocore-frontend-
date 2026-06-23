/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
        display: ['"Syne"', 'system-ui', 'sans-serif'],
      },
      colors: {
        indigo: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          base:    '#f4f5f9',
          raised:  '#ffffff',
          overlay: '#f0f1f7',
          border:  '#e2e4ee',
          subtle:  '#eaecf5',
        },
        ink: {
          primary:   '#14162a',
          secondary: '#4a5073',
          muted:     '#9196b4',
          inverse:   '#ffffff',
        },
        status: {
          ok:    '#16a34a',
          warn:  '#d97706',
          alert: '#dc2626',
          info:  '#0284c7',
        },
        accent: {
          violet: '#7c3aed',
          cyan:   '#0891b2',
        },
      },
      borderRadius: {
        'sm':  '4px',
        DEFAULT: '6px',
        'md':  '8px',
        'lg':  '12px',
        'xl':  '16px',
      },
      boxShadow: {
        'rail':        '1px 0 0 0 #e2e4ee',
        'card':        '0 1px 3px 0 rgba(20,22,42,0.08), 0 1px 2px -1px rgba(20,22,42,0.06)',
        'panel':       '0 4px 24px 0 rgba(20,22,42,0.10)',
        'glow-violet': '0 0 16px rgba(124,58,237,0.20)',
        'sidebar':     '1px 0 0 0 #e2e4ee',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.3' },
        },
      },
      animation: {
        'fade-in':       'fade-in 0.2s ease-out',
        'slide-in-left': 'slide-in-left 0.2s ease-out',
        'pulse-dot':     'pulse-dot 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
