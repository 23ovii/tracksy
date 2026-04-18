export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        spotify: {
          bg: '#0f1419',
          surface: '#12171f',
          panel: '#181f2a',
          border: '#373f55',
          green: '#1db954',
          soft: '#a7b8d8',
        }
      },
      boxShadow: {
        glow: '0 18px 45px rgba(29, 185, 84, 0.12)',
      }
    }
  },
  plugins: [],
};
