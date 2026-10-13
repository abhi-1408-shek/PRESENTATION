/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: '#060913',
          50: '#0a0f1e',
          100: '#0F172A',
          200: '#1a2340',
          300: '#243050',
        },
        cyber: {
          cyan: '#00F2FE',
          blue: '#00B4D8',
          purple: '#9D4EDD',
          amber: '#F59E0B',
          red: '#FF2A6D',
          green: '#10B981',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan-line': 'scanLine 4s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 242, 254, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 242, 254, 0.6)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      boxShadow: {
        'cyber': '0 0 15px rgba(0, 242, 254, 0.15)',
        'cyber-strong': '0 0 30px rgba(0, 242, 254, 0.3)',
        'alert': '0 0 20px rgba(255, 42, 109, 0.3)',
        'amber': '0 0 15px rgba(245, 158, 11, 0.2)',
      },
    },
  },
  plugins: [],
};
