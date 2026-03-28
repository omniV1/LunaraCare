/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'serif'],
        playfair: ['Playfair Display', 'serif'],
        script: ['"Luxurious Script"', 'cursive'],
        roman: ['"Luxurious Roman"', 'serif'],
      },
      colors: {
        cream: '#FAF7F2',
        brown: {
          light: '#A27B5C',
          DEFAULT: '#6B4D37',
          dark: '#2C3639',
        },
        sage: {
          light: '#8C9A8C',
          DEFAULT: '#3F4E4F',
        },
        dash: {
          bg: 'var(--dash-bg)',
          card: 'var(--dash-card)',
          border: 'var(--dash-card-border)',
          'section-border': 'var(--dash-section-border)',
          'text-primary': 'var(--dash-text-primary)',
          'text-secondary': 'var(--dash-text-secondary)',
        },
      },
      backgroundImage: {
        'hero-pattern': "url('/images/leaf-pattern.png')",
        'leaf-texture': "url('/images/leaf-texture.png')"
      },
      maxWidth: {
        'readable': '65ch'
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      },
      animation: {
        'shimmer': 'shimmer 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
      });
    },
  ],
} 