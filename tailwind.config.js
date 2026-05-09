/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ccs: {
          red: 'var(--brand-primary, #E8272A)',
          'red-dark': 'var(--brand-primary-dark, #C41F22)',
          black: '#1A1A1A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}
