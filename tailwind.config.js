// client/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Light Mode (Soft White-Green)
        "base-light": "#F0F0F0",
        "primary-light": "#2ecc71",
        "text-primary-light": "#363a4f",
        "text-secondary-light": "#5b5f77",
        "shadow-dark-light": "#BEBEBE",
        "shadow-light-light": "#FFFFFF",

        // Dark Mode (Dark Zinc-Blue)
        "base-dark": "#27272A", // Zinc 800
        "primary-dark": "#3B82F6", // Blue 500
        "text-primary-dark": "#E4E4E7", // Zinc 200
        "text-secondary-dark": "#A1A1AA", // Zinc 400
        "shadow-dark-dark": "#18181B", // Zinc 900
        "shadow-light-dark": "#3f3f46", // Zinc 700
      },
      // REMOVE boxShadow from here
      // boxShadow: { ... },
      borderRadius: {
        neumorphic: "12px",
        "neumorphic-lg": "15px",
        "neumorphic-sm": "10px",
      },
      transitionDuration: {
        neumorphic: "0.3s",
      },
      transitionTimingFunction: {
        neumorphic: "ease-in-out",
      },
      // Enhanced neumorphic animations and effects
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-in-out',
        'pulse-gentle': 'pulseGentle 2s infinite ease-in-out',
        'pulse-slow': 'pulseSlow 3s infinite ease-in-out',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGentle: {
          '0%, 100%': { 
            opacity: '1', 
            boxShadow: 'var(--shadow-outset)' 
          },
          '50%': { 
            opacity: '0.95', 
            boxShadow: 'var(--shadow-outset), 0 0 15px rgba(58, 134, 255, 0.3)' 
          },
        },
        pulseSlow: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.5' },
          '50%': { transform: 'scale(1.05)', opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200%' },
          '100%': { backgroundPosition: '200%' },
        },
      },
      scale: {
        '98': '0.98',
        '102': '1.02',
        '95': '0.95',
        '105': '1.05',
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'neumorphic-light': '10px 10px 20px #d1d1d1, -10px -10px 20px #ffffff',
        'neumorphic-dark': '8px 8px 16px #1a1a1d, -8px -8px 16px #32323a',
        'neumorphic-pressed-light': 'inset 6px 6px 12px #d1d1d1, inset -6px -6px 12px #ffffff',
        'neumorphic-pressed-dark': 'inset 4px 4px 8px #1a1a1d, inset -4px -4px 8px #32323a',
      },
    },
  },
  plugins: [],
};
