/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        garden: {
          dark: '#1c352d',    // Deep Emerald Green
          muted: '#27443a',   // Secondary Sage Green
        },
        slate: {
          custom: '#4a5560',  // Distance/Transit Slate Gray
        },
        sky: {
          custom: '#7a92a3',    // LDR Soft Sky Blue
        },
        stark: '#111111',     // Elegant Black Accents
      },
      fontFamily: {
        serif: ['Times New Roman', 'Times', 'serif'],
        sans: ['Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}