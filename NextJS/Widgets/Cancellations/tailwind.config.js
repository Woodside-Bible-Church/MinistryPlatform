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
        status: {
          closed: '#dc2626',
          'closed-light': '#fef2f2',
          modified: '#d97706',
          'modified-light': '#fffbeb',
          open: '#16a34a',
          'open-light': '#f0fdf4',
        },
      },
    },
  },
  plugins: [],
};
