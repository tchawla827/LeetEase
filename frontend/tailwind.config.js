// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // if you want to toggle light/dark via a "dark" class
  content: [
    // Tell Tailwind to scan all of your React JSX/TSX files:
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    // ──────────── 1) TYPOGRAPHY ────────────
    fontFamily: {
      // “sans” and “mono” will be available as utility classes: font‐sans / font‐mono
      sans: ['JetBrains Mono', 'Fira Code', 'monospace'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
    },
    extend: {
      fontSize: {
        // Code‐friendly sizes (13px, 15px, 17px)
        'code-sm': '0.8125rem',  // 13px
        'code-base': '0.9375rem',// 15px
        'code-lg': '1.0625rem',  // 17px
      },
      lineHeight: {
        // Line‐height for code blocks
        code: '1.6',
      },

      // ──────────── 2) SPACING & LAYOUT ────────────
      spacing: {
        code: '0.375rem',   // ~6px, for tight code‐like gaps
        section: '3rem',    // ~48px, for big vertical sections
        card: '1.25rem',    // ~20px, for card padding
      },
      borderRadius: {
        code: '0.375rem',   // ~6px
        card: '0.75rem',    // ~12px
      },
      boxShadow: {
        // “elevation” shadows:
        elevation: '0 4px 14px rgba(0, 0, 0, 0.15)',
        'elevation-md': '0 8px 24px rgba(0, 0, 0, 0.2)',
        'inset-code': 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
      },

      // ──────────── 3) BREAKPOINTS ────────────
      screens: {
        sm: '640px',   // small tablets
        md: '768px',   // tablets
        lg: '1024px',  // small laptops
        xl: '1280px',  // desktop
        '2xl': '1536px', // large screens
        ide: '1800px', // IDE‐width screens
      },

      // ──────────── 4) DESIGN TOKENS (COLORS) ────────────
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
        code: {
          keyword: 'rgb(var(--color-code-keyword) / <alpha-value>)',
          function: 'rgb(var(--color-code-function) / <alpha-value>)',
          string: 'rgb(var(--color-code-string) / <alpha-value>)',
          number: 'rgb(var(--color-code-number) / <alpha-value>)',
          comment: 'rgb(var(--color-code-comment) / <alpha-value>)',
          variable: 'rgb(var(--color-code-variable) / <alpha-value>)',
        },
        gray: {
          100: 'rgb(var(--color-gray-100) / <alpha-value>)',
          200: 'rgb(var(--color-gray-200) / <alpha-value>)',
          300: 'rgb(var(--color-gray-300) / <alpha-value>)',
          400: 'rgb(var(--color-gray-400) / <alpha-value>)',
          500: 'rgb(var(--color-gray-500) / <alpha-value>)',
          600: 'rgb(var(--color-gray-600) / <alpha-value>)',
          700: 'rgb(var(--color-gray-700) / <alpha-value>)',
          800: 'rgb(var(--color-gray-800) / <alpha-value>)',
          900: 'rgb(var(--color-gray-900) / <alpha-value>)',
        },
      },

      // ──────────── 5) BACKGROUND PATTERNS ────────────
      backgroundImage: {
        'dev-grid': "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='0.15'%3E%3Ccircle cx='10' cy='10' r='1.5' fill='%231f6feb'/%3E%3Ccircle cx='50' cy='50' r='1.5' fill='%231f6feb'/%3E%3Ccircle cx='90' cy='90' r='1.5' fill='%231f6feb'/%3E%3Ccircle cx='10' cy='90' r='1.5' fill='%231f6feb'/%3E%3Ccircle cx='90' cy='10' r='1.5' fill='%231f6feb'/%3E%3Cpath d='M10 10L50 50L90 10M10 90L50 50L90 90' stroke='%231f6feb' stroke-width='0.25'/%3E%3C/g%3E%3C/svg%3E\")",
      },
    }, // end extend
  },

  // ──────────── 6) PLUGINS ────────────
  plugins: [
    // If you want to use any official Tailwind plugins (e.g. forms, typography), add them here:
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
  ],
};
