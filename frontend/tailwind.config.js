/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0b1329",
          card: "#111b36",
          border: "#1e294b",
          primary: "#3b82f6",
          secondary: "#6366f1",
          accent: "#10b981",
          text: "#f8fafc",
          muted: "#94a3b8"
        }
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "sans-serif"]
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
