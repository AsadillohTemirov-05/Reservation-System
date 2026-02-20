/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        available: '#10b981',    // Green
        reserved: '#f59e0b',     // Yellow
        confirmed: '#ef4444',    // Red
        selected: '#3b82f6',     // Blue
      },
    },
  },
  plugins: [],
}