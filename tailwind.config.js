/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          green: '#00ff9d',
          blue: '#00d4ff',
          purple: '#bf4bff',
          pink: '#ff4bd0',
        }
      },
      boxShadow: {
        'neon': '0 0 10px rgba(0, 255, 157, 0.5)',
        'neon-blue': '0 0 10px rgba(0, 212, 255, 0.5)',
      }
    },
  },
  plugins: [],
}