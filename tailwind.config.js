/** @type {import('tailwindcss').Config} */

// Los colores se declaran como variables CSS con triplete RGB (ver src/style.css).
// Así el tema oscuro es un intercambio de tokens y no un `dark:` repetido en cada clase.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,html}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        surface: {
          DEFAULT: token('surface'),
          muted: token('surface-muted'),
          raised: token('surface-raised'),
        },
        line: {
          DEFAULT: token('line'),
          strong: token('line-strong'),
        },
        content: {
          DEFAULT: token('content'),
          muted: token('content-muted'),
          subtle: token('content-subtle'),
          inverse: token('content-inverse'),
        },
        accent: {
          DEFAULT: token('accent'),
          hover: token('accent-hover'),
          soft: token('accent-soft'),
          fg: token('accent-fg'),
          ring: token('accent-ring'),
        },
        violet: { brand: token('violet-brand') },
        positive: { DEFAULT: token('positive'), soft: token('positive-soft') },
        caution: { DEFAULT: token('caution'), soft: token('caution-soft') },
        // Series de datos (gráficos de macros y desgloses)
        data: {
          1: token('data-1'),
          2: token('data-2'),
          3: token('data-3'),
        },
      },
      fontFamily: {
        sans: [
          'Inter Variable',
          'Inter Fallback',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.04em' }],
        display: ['clamp(2.25rem, 1.3rem + 3.6vw, 3.75rem)', { lineHeight: '1.04', letterSpacing: '-0.035em' }],
        title: ['clamp(1.75rem, 1.2rem + 1.9vw, 2.5rem)', { lineHeight: '1.12', letterSpacing: '-0.028em' }],
      },
      // Pasos extra para el modificador de opacidad (bg-accent/12, ring-line/35...)
      opacity: { 12: '0.12', 15: '0.15', 35: '0.35', 45: '0.45', 55: '0.55', 65: '0.65', 85: '0.85' },
      maxWidth: { content: '78rem', prose: '68ch' },
      borderRadius: { '4xl': '2rem' },
      boxShadow: {
        subtle: '0 1px 2px 0 rgb(var(--shadow) / 0.05)',
        raised:
          '0 1px 2px -1px rgb(var(--shadow) / 0.09), 0 4px 12px -2px rgb(var(--shadow) / 0.07)',
        float:
          '0 2px 4px -2px rgb(var(--shadow) / 0.1), 0 12px 28px -6px rgb(var(--shadow) / 0.12)',
        pop: '0 8px 16px -6px rgb(var(--shadow) / 0.16), 0 24px 48px -12px rgb(var(--shadow) / 0.18)',
        glow: '0 8px 30px -8px rgb(var(--accent) / 0.55)',
      },
      backgroundImage: {
        'accent-gradient':
          'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--violet-brand)) 100%)',
        'hero-glow':
          'radial-gradient(60rem 32rem at 12% -10%, rgb(var(--accent) / 0.16), transparent 60%), radial-gradient(46rem 28rem at 92% 4%, rgb(var(--violet-brand) / 0.14), transparent 62%)',
        grid: 'linear-gradient(rgb(var(--line) / 0.7) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--line) / 0.7) 1px, transparent 1px)',
      },
      backgroundSize: { 'grid-cell': '44px 44px' },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'none' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      transitionTimingFunction: { spring: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    },
  },
  plugins: [],
};
