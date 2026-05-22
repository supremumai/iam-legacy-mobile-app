/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        black: '#0a0900',
        black2: '#111008',
        charcoal: '#1c1a14',
        gold: '#c9a84c',
        gold2: '#e8c060',
      },
    },
  },
  plugins: [],
};
