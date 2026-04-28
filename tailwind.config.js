/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e8f4fd',
          100: '#c5e3f9',
          200: '#9ecff4',
          300: '#6eb8ee',
          400: '#45a5e9',
          500: '#1a91e4',
          600: '#0d7dc7',
          700: '#0a65a3',
          800: '#084e7e',
          900: '#05375a',
        },
        emerald: {
          500: '#10b981',
          600: '#059669',
        },
        navy: {
          900: '#0a1628',
          800: '#0d1f3c',
          700: '#112952',
        }
      },
      fontFamily: {
        heading: ['Georgia', 'serif'],
        body: ['system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.15)',
      }
    },
  },
  plugins: [],
}
