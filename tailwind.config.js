/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        blue: {
          DEFAULT: '#2055F0',
          light: '#EEF2FE',
          mid: '#C7D4FC',
          hover: '#1744CC',
        },
        ink: {
          DEFAULT: '#111111',
          soft: '#222222',
          muted: '#444444',
        },
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E8E8E8',
          300: '#C8C8C8',
          400: '#A0A0A0',
          500: '#717171',
          600: '#4B4B4B',
          700: '#333333',
          800: '#222222',
          900: '#111111',
        },
        green: { DEFAULT: '#16A34A', light: '#F0FDF4' },
        red: { DEFAULT: '#DC2626', light: '#FEF2F2' },
        amber: { DEFAULT: '#D97706', light: '#FFFBEB' },
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs: ['11px', '16px'],
        sm: ['12px', '18px'],
        base: ['13px', '20px'],
        md: ['14px', '21px'],
        lg: ['15px', '23px'],
        xl: ['18px', '26px'],
        '2xl': ['22px', '30px'],
        '3xl': ['28px', '36px'],
        '4xl': ['36px', '42px'],
        '5xl': ['48px', '54px'],
        '6xl': ['60px', '66px'],
      },
      borderColor: { DEFAULT: '#E8E8E8' },
      spacing: { 18: '4.5rem' },
    },
  },
  plugins: [],
}