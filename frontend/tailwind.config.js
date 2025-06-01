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
        // Dark theme base (sample palette—tweak as needed)
        background: '#0d1117', // GitHub‐style dark bg
        surface: '#161b22',    // Slightly elevated surfaces
        primary: '#1f6feb',    // GitHub blue
        secondary: '#238636',  // GitHub green
        accent: '#f78166',     // GitHub orange
        error: '#f85149',      // GitHub red
        warning: '#e3b341',    // GitHub yellow
        success: '#3fb950',    // Brighter green
        info: '#58a6ff',       // Lighter blue

        // Syntax‐highlight variants (for code blocks if you want to style in‐JS):
        code: {
          keyword: '#ff7b72',   // red‐pink
          function: '#d2a8ff',  // purple
          string: '#a5d6ff',    // light blue
          number: '#79c0ff',    // blue
          comment: '#8b949e',   // gray
          variable: '#ffa657',  // orange
        },

        // Grayscale ramp (e.g. use "gray‐100", "gray‐200", … "gray‐900")
        gray: {
          100: '#f0f6fc',
          200: '#c9d1d9',
          300: '#b1bac4',
          400: '#8b949e',
          500: '#6e7681',
          600: '#484f58',
          700: '#30363d',
          800: '#21262d',
          900: '#161b22',
        },
      },
    }, // end extend
  },

  // ──────────── 5) PLUGINS ────────────
  plugins: [
    // If you want to use any official Tailwind plugins (e.g. forms, typography), add them here:
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
  ],
};
