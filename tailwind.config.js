/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Pastel Green Palette
        sage: {
          50: '#f8faf8',
          100: '#f0f5f0',
          200: '#d9e8d9',
          300: '#b8d4b8',
          400: '#8fb88f',
          500: '#6b9c6b',
          600: '#4f7f4f',
          700: '#3e663e',
          800: '#2e4d2e',
          900: '#1e3a1e',
        },
        // Pastel Brown Palette
        latte: {
          50: '#faf9f7',
          100: '#f4f1ed',
          200: '#e8e0d7',
          300: '#d7c9b7',
          400: '#c2a98a',
          500: '#a88967',
          600: '#8b6f4f',
          700: '#6f5740',
          800: '#544232',
          900: '#3a2e24',
        },
        // Accent Colors
        cream: {
          50: '#fffef9',
          100: '#fffcf0',
          200: '#fef7d6',
          300: '#fcefad',
          400: '#f9e373',
          500: '#f5d53a',
          600: '#e6c229',
          700: '#c1a01f',
          800: '#997e19',
          900: '#735e13',
        },
        // Background and Surface Colors
        pearl: {
          50: '#fcfcfc',
          100: '#fafafa',
          200: '#f5f5f5',
          300: '#eeeeee',
          400: '#e0e0e0',
          500: '#bdbdbd',
          600: '#9e9e9e',
          700: '#757575',
          800: '#424242',
          900: '#212121',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}