/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          DEFAULT: '#0d9488', // Primary healthcare teal
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f8fafc', // Light grey background
          subtle: '#f1f5f9',
          border: '#e2e8f0',
        },
        status: {
          booked: {
            bg: '#eff6ff',
            text: '#1d4ed8',
            border: '#bfdbfe',
          },
          checkedin: {
            bg: '#fffbeb',
            text: '#b45309',
            border: '#fde68a',
          },
          inconsultation: {
            bg: '#faf5ff',
            text: '#7e22ce',
            border: '#e9d5ff',
          },
          completed: {
            bg: '#f0fdf4',
            text: '#15803d',
            border: '#bbf7d0',
          },
          noshow: {
            bg: '#fef2f2',
            text: '#b91c1c',
            border: '#fecaca',
          },
          cancelled: {
            bg: '#f8fafc',
            text: '#64748b',
            border: '#cbd5e1',
          },
          unpaid: {
            bg: '#fff7ed',
            text: '#c2410c',
            border: '#fed7aa',
          },
          paid: {
            bg: '#f0fdf4',
            text: '#15803d',
            border: '#bbf7d0',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft-xs': '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        'soft': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.06)',
        'soft-md': '0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
        'soft-lg': '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
