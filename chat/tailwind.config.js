/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          dark: 'var(--color-bg-dark)',
          light: 'var(--color-bg-light)',
        },
        surface: {
          dark: 'var(--color-surface-dark)',
          light: 'var(--color-surface-light)',
        },
        primary: 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        'primary-light': 'var(--color-primary-light)',
        secondary: 'var(--color-secondary)',
        'secondary-alt': 'var(--color-secondary-alt)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        text: {
          dark: 'var(--color-text-primary-dark)',
          light: 'var(--color-text-primary-light)',
          subtle: 'var(--color-text-secondary)',
        },
      },
      borderRadius: { xl2: '1.25rem' },
      boxShadow: {
        glass: '0 4px 24px rgba(0,0,0,.35)',
        'inner-glow': 'inset 0 0 0 .5px var(--color-surface-light)',
      },
      keyframes: {
        pulse1: { '0%,100%': { opacity: '.85' }, '50%': { opacity: '1' } },
      },
      animation: {
        pulse1: 'pulse1 .8s ease-out infinite',
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};
