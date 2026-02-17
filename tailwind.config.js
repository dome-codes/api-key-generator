/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Corporate Design Farben
        primary: {
          DEFAULT: 'var(--color-primary)',
          rgb: 'rgb(var(--color-primary-rgb))',
          hover: '#d50000',
          active: '#ba0000',
          50: 'rgba(var(--color-primary-rgb), 0.05)',
          100: 'rgba(var(--color-primary-rgb), 0.1)',
          200: 'rgba(var(--color-primary-rgb), 0.2)',
          300: 'rgba(var(--color-primary-rgb), 0.3)',
          400: 'rgba(var(--color-primary-rgb), 0.4)',
          500: 'var(--color-primary)',
          600: '#d50000',
          700: '#ba0000',
          800: '#990000',
          900: '#770000',
        },
        navbar: {
          DEFAULT: 'var(--coyo-navbar)',
          border: 'var(--color-navbar-border)',
          active: 'var(--coyo-navbar-active)',
          text: 'var(--coyo-navbar-text)',
        },
        btn: {
          primary: {
            bg: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-color)',
            'bg-rgb': 'rgb(var(--btn-primary-bg-rgb))',
          },
        },
        link: {
          DEFAULT: 'var(--link-color)',
          rgb: 'rgb(var(--link-color-rgb))',
        },
        corporate: {
          green: 'var(--color-green)',
          blue: 'var(--color-blue)',
          yellow: 'var(--color-yellow)',
          orange: 'var(--color-orange)',
          red: 'var(--color-red)',
          white: 'var(--color-white)',
          gray: 'var(--color-gray)',
        },
        background: {
          main: 'var(--color-background-main)',
        },
        text: {
          DEFAULT: 'var(--text-color)',
        },
      },
    },
  },
  plugins: [],
}
