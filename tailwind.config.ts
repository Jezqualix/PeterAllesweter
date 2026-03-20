import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e8f5ee',
          100: '#c3e6d0',
          200: '#8dcbaa',
          300: '#52ae7e',
          400: '#00995a',
          500: '#00a040',
          600: '#007c30',
          700: '#026c3d',
          800: '#005526',
          900: '#003012',
        },
        accent: {
          DEFAULT: '#ffdd00',
          hover:   '#e6c800',
          light:   '#fff8cc',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
