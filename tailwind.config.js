/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'media', // or 'class' if we want manual toggle
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        fintech: {
          dark: '#0f172a',    // slate-900
          card: '#1e293b',    // slate-800
          border: '#334155',  // slate-700
          positive: '#10b981', // emerald-500
          negative: '#f43f5e', // rose-500
          text: '#f8fafc',     // slate-50
          muted: '#94a3b8'     // slate-400
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow-positive': '0 0 15px rgba(16, 185, 129, 0.3)',
        'glow-negative': '0 0 15px rgba(244, 63, 94, 0.3)',
      }
    },
  },
  plugins: [],
}
