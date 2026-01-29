import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,html}',
  ],
  theme: {
    extend: {
      colors: {
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
    },
  },
  plugins: [],
};

export default config;
