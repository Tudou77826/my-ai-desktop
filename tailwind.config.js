/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm gray palette
        gray: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
          950: '#0C0A09',
        },
        // Amber accent color
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'Monaco',
          '"Cascadia Code"',
          '"Roboto Mono"',
          'monospace',
        ],
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-in': 'slideIn 200ms ease-out',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    // Simple prose plugin for markdown content
    function({ addUtilities }) {
      const newUtilities = {
        '.prose': {
          'color': '#374151',
          'max-width': '65ch',
          '& h1': {
            'font-size': '1.875rem',
            'font-weight': '700',
            'margin-top': '0',
            'margin-bottom': '1rem',
            'line-height': '1.2',
          },
          '& h2': {
            'font-size': '1.5rem',
            'font-weight': '600',
            'margin-top': '2rem',
            'margin-bottom': '1rem',
            'line-height': '1.3',
          },
          '& h3': {
            'font-size': '1.25rem',
            'font-weight': '600',
            'margin-top': '1.6rem',
            'margin-bottom': '0.75rem',
            'line-height': '1.4',
          },
          '& p': {
            'margin-top': '0',
            'margin-bottom': '1.25em',
            'line-height': '1.75',
          },
          '& strong': {
            'font-weight': '600',
            'color': '#111827',
          },
          '& em': {
            'font-style': 'italic',
          },
          '& code': {
            'color': '#111827',
            'font-weight': '600',
            'font-size': '0.875em',
          },
          '& pre': {
            'color': '#e5e7eb',
            'backgroundColor': '#1f2937',
            'overflowX': 'auto',
            'fontSize': '0.875em',
            'lineHeight': '1.7142857',
            'marginTop': '1.7142857em',
            'marginBottom': '1.7142857em',
            'borderRadius': '0.375rem',
            'padding': '0.8571429em 1.1428571em',
          },
          '& pre code': {
            'backgroundColor': 'transparent',
            'borderWidth': '0',
            'borderRadius': '0',
            'padding': '0',
            'fontWeight': '400',
            'color': 'inherit',
            'fontSize': 'inherit',
            'fontFamily': 'inherit',
            'lineHeight': 'inherit',
          },
          '& a': {
            'color': '#d97706',
            'textDecoration': 'underline',
            'fontWeight': '500',
          },
          '& ul': {
            'listStyleType': 'disc',
            'paddingLeft': '1.625rem',
            'marginTop': '1.25em',
            'marginBottom': '1.25em',
          },
          '& ol': {
            'listStyleType': 'decimal',
            'paddingLeft': '1.625rem',
            'marginTop': '1.25em',
            'marginBottom': '1.25em',
          },
          '& li': {
            'marginTop': '0.5em',
            'marginBottom': '0.5em',
          },
          '& blockquote': {
            'fontWeight': '500',
            'fontStyle': 'italic',
            'color': '#111827',
            'borderLeftWidth': '0.25rem',
            'borderLeftColor': '#e5e7eb',
            'quotes': '"\\201C""\\201D""\\2018""\\2019"',
            'marginTop': '1.6em',
            'marginBottom': '1.6em',
            'paddingLeft': '1em',
          },
        },
        '.prose-sm': {
          'fontSize': '0.875rem',
          'lineHeight': '1.7142857',
          '& h1': {
            'fontSize': '1.5rem',
            'marginTop': '0',
            'marginBottom': '0.8888889em',
            'lineHeight': '1.1111111',
          },
          '& h2': {
            'fontSize': '1.25rem',
            'marginTop': '1.6em',
            'marginBottom': '0.8888889em',
            'lineHeight': '1.2222222',
          },
          '& h3': {
            'fontSize': '1.125rem',
            'marginTop': '1.6666667em',
            'marginBottom': '0.6666667em',
            'lineHeight': '1.3333333',
          },
          '& p': {
            'marginTop': '0',
            'marginBottom': '1.1428571em',
          },
          '& pre': {
            'fontSize': '0.875em',
            'lineHeight': '1.7142857',
            'marginTop': '1.7142857em',
            'marginBottom': '1.7142857em',
            'borderRadius': '0.375rem',
            'paddingTop': '0.8571429em',
            'paddingRight': '1.1428571em',
            'paddingBottom': '0.8571429em',
            'paddingLeft': '1.1428571em',
          },
        },
      }
      addUtilities(newUtilities)
    },
  ],
}
