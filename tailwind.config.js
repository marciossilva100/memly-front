/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        avocado: {
          50:  '#f6f8e8',
          100: '#e8edc2',
          200: '#d8e29a',
          300: '#c7d66f',
          400: '#b6cb49',
          500: '#50ba01', // principal
          600: '#6e8b1c',
          700: '#556d16',
          800: '#3c4f10',
          900: '#243009',
        },
      },
    },
    
  },
  plugins: [],
}
