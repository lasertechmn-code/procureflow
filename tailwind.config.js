/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        background: 'var(--c-background)',
        surface: 'var(--c-surface)',
        border: 'var(--c-border)',
        input: 'var(--c-input)',
        brand: '#3b82f6',      // Electric Blue (Safe/Action)
        brandHover: '#2563eb',
        logoRed: '#EE3124',    // Honeywell Red (Logo Only)
        primary: '#3b82f6',    // Mapped to brand
        accent: '#3f3f46',     // Zinc 700
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
      },
    },
  },
  plugins: [],
};
