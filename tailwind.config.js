/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './views/**/*.{ejs,html}',
    './public/**/*.{js,html}',
  ],
  theme: {
    extend: {
      fontFamily: {
        cyber: ["'Orbitron'", 'sans-serif'],
      },
    },
  },
  plugins: [],
}
