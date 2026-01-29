import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Zeroe Brand Colors
        zeroe: {
          blue: '#2673EA',
          'blue-dark': '#1E5BC0',
          'blue-light': '#4A8FF0',
        },
        charcoal: '#0D1318',
        dusty: {
          rose: '#C17B7E',
        },
        slate: {
          blue: '#6B7FA3',
        },
        coral: '#E07065',
      },
      fontFamily: {
        heading: ['Inter', 'sans-serif'],
        body: ['Work Sans', 'sans-serif'],
      },
      backgroundImage: {
        'zeroe-gradient': 'linear-gradient(90deg, #2673EA 0%, #8B7B9E 50%, #E07065 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
