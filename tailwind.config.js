/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'luxury': ['Cormorant Garamond', 'serif'],
        'sans': ['Jost', 'sans-serif'],
      },
      colors: {
        gold: {
          50: '#FFF8DC',
          100: '#FDF0C4',
          200: '#F5E1A0',
          300: '#E8C874',
          400: '#D4AF37',
          500: '#C9A528',
          600: '#A8842F',
          700: '#8B6F28',
          800: '#6B5520',
          900: '#4A3A15',
        },
        silver: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#C0C0C0',
          500: '#A8A8A8',
          600: '#94A3B8',
          700: '#475569',
          800: '#334155',
          900: '#1E293B',
        },
        platinum: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#E5E4E2',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',
        },
        charcoal: {
          50: '#F7F7F7',
          100: '#E3E3E3',
          200: '#C8C8C8',
          300: '#A4A4A4',
          400: '#818181',
          500: '#666666',
          600: '#515151',
          700: '#434343',
          800: '#2A2A2A',
          900: '#1A1A1A',
          950: '#0C0C0C',
        }
      },
      backgroundImage: {
        'luxury-gradient': 'linear-gradient(135deg, #1A1A1A 0%, #0C0C0C 100%)',
        'gold-gradient': 'linear-gradient(135deg, #E8C874 0%, #D4AF37 50%, #A8842F 100%)',
        'silver-gradient': 'linear-gradient(135deg, #E2E8F0 0%, #C0C0C0 50%, #A8A8A8 100%)',
        'platinum-gradient': 'linear-gradient(135deg, #F4F4F5 0%, #E5E4E2 50%, #D3D3D3 100%)',
      },
      boxShadow: {
        'luxury': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'luxury-sm': '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        'gold': '0 4px 20px rgba(212, 175, 55, 0.25)',
        'gold-glow': '0 0 25px rgba(212, 175, 55, 0.15)',
        'silver': '0 4px 15px rgba(192, 192, 192, 0.2)',
        'platinum': '0 4px 15px rgba(229, 228, 226, 0.2)',
      },
      animation: {
        'shimmer': 'shimmer 3s infinite',
        'glow': 'glowPulse 3s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) both',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(212, 175, 55, 0.5)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
