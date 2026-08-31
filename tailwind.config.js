/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{svelte,js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        dgt: {
          50: '#fdfcf0',
          100: '#f1f8e9',
          200: '#e2f0cc',
          300: '#c5e09a',
          400: '#a8cc5f',
          500: '#8fb339',
          600: '#7a9a30',
          700: '#6d8a2b',
          800: '#56701f',
          900: '#3f5216',
        },
        warm: {
          50: '#fdf6e3',
          100: '#fdf6e3',
          200: '#f5ecd7',
          300: '#e8dcc6',
          400: '#c4b49a',
          500: '#a09070',
          600: '#5c4b37',
          700: '#4a3c2c',
          800: '#382d21',
          900: '#261e16',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
