/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1c2b39',
          dark: '#0f1923',
        },
        secondary: {
          DEFAULT: '#62bb46',
          dark: '#4a9035',
        },
      },
    },
  },
  plugins: [],
};
