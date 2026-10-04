/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clinical: {
          slate: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          teal: '#0D9488',
          tealLight: '#10B981',
          blue: '#2563EB',
          crimson: '#E11D48',
          amber: '#D97706',
        }
      },
      fontFamily: {
        space: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
