/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#171717',
        surfaceHover: '#262626',
        primary: '#ef4444',
        secondary: '#f59e0b',
        textPrimary: '#f5f5f5',
        textSecondary: '#a3a3a3',
        border: '#404040'
      }
    },
  },
  plugins: [],
}
