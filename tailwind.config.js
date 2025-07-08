/** @type {import('tailwindcss').Config} */
const { nextui } = require("@nextui-org/react");

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'beamly-primary': '#0F43EE',
        'beamly-secondary': '#FCE90D',
        'beamly-third': '#011241',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'outfit': ['Outfit', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: 0 },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      screens: {
        'xs': '475px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(15, 67, 238, 0.5)',
        'glow-yellow': '0 0 20px rgba(252, 233, 13, 0.5)',
      },
    },
  },
  darkMode: "class",
  plugins: [
    nextui({
      themes: {
        light: {
          colors: {
            background: "#FFFFFF",
            foreground: "#11181C",
            primary: {
              50: "#e6f1ff",
              100: "#b3d4ff",
              200: "#80b8ff",
              300: "#4d9bff",
              400: "#1a7eff",
              500: "#0F43EE",
              600: "#0c36be",
              700: "#092a8f",
              800: "#061d5f",
              900: "#031130",
              foreground: "#FFFFFF",
              DEFAULT: "#0F43EE",
            },
            secondary: {
              50: "#fffce6",
              100: "#fff7b3",
              200: "#fff280",
              300: "#ffed4d",
              400: "#ffe81a",
              500: "#FCE90D",
              600: "#c9ba0a",
              700: "#978c08",
              800: "#645d05",
              900: "#322f03",
              foreground: "#011241",
              DEFAULT: "#FCE90D",
            },
            success: {
              DEFAULT: "#17c964",
              foreground: "#FFFFFF",
            },
            warning: {
              DEFAULT: "#f5a524",
              foreground: "#FFFFFF",
            },
            danger: {
              DEFAULT: "#f31260",
              foreground: "#FFFFFF",
            },
          },
        },
        dark: {
          colors: {
            background: "#010b29",
            foreground: "#ECEDEE",
            primary: {
              50: "#e6f1ff",
              100: "#b3d4ff",
              200: "#80b8ff",
              300: "#4d9bff",
              400: "#1a7eff",
              500: "#0F43EE",
              600: "#0c36be",
              700: "#092a8f",
              800: "#061d5f",
              900: "#031130",
              foreground: "#FFFFFF",
              DEFAULT: "#0F43EE",
            },
            secondary: {
              50: "#fffce6",
              100: "#fff7b3",
              200: "#fff280",
              300: "#ffed4d",
              400: "#ffe81a",
              500: "#FCE90D",
              600: "#c9ba0a",
              700: "#978c08",
              800: "#645d05",
              900: "#322f03",
              foreground: "#011241",
              DEFAULT: "#FCE90D",
            },
            success: {
              DEFAULT: "#17c964",
              foreground: "#FFFFFF",
            },
            warning: {
              DEFAULT: "#f5a524",
              foreground: "#FFFFFF",
            },
            danger: {
              DEFAULT: "#f31260",
              foreground: "#FFFFFF",
            },
          },
        },
      },
    }),
  ],
}