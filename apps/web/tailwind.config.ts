import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0B0F17',
        surface: '#151C28',
        'surface-elevated': '#1F293D',
        primary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
        },
        risk: {
          none: '#10B981',
          notice: '#3B82F6',
          caution: '#F59E0B',
          strong: '#EF4444',
        },
      },
    },
  },
  plugins: [],
};

export default config;
