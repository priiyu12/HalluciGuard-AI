/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        audit: {
          bg: '#F8FAFC',
          text: '#0F172A',
          muted: '#64748B',
          accent: '#6366F1',
          accentHover: '#4F46E5',
          border: '#E2E8F0'
        }
      }
    },
  },
  plugins: [],
}
