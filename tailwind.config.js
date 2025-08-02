/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
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
        // Golden/Amber Primary Palette
        golden: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Primary golden
          600: '#d97706', // Primary amber
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Warm Beige Background Palette
        beige: {
          50: '#fefdfb',
          100: '#fdf9f3',
          200: '#faf2e4',
          300: '#f6e8d1',
          400: '#f0d9b8',
          500: '#e8c89f',
          600: '#deb084',
          700: '#c89665',
          800: '#a67c52',
          900: '#8b6440',
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
        // Dark mode specific colors
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#212121',
          950: '#0a0a0a',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}