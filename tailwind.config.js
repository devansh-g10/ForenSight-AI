/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0E14",
        secondary: "#111827",
        accent: {
          cyan: "#00F5FF",
          glow: "rgba(0, 245, 255, 0.4)",
          danger: "#FF4D4D",
        },
        panel: "rgba(17, 24, 39, 0.6)",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 15px rgba(0, 245, 255, 0.4)',
        'cyan-strong': '0 0 25px rgba(0, 245, 255, 0.6)',
      }
    },
  },
  plugins: [],
}
