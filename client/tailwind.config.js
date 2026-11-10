/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        aurora: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065'
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif'
        ]
      },
      boxShadow: {
        tarjeta: '0 18px 45px -20px rgba(30, 27, 75, 0.28)',
        brillo: '0 18px 50px -15px rgba(109, 40, 217, 0.45)'
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'barra-progreso': {
          '0%': { width: '100%' },
          '100%': { width: '0%' }
        },
        'latido-suave': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' }
        }
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.35s ease-out both',
        'barra-progreso': 'barra-progreso 5s linear forwards',
        'latido-suave': 'latido-suave 1.8s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
