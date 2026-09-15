import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#007536',
        'primary-brand': '#009540',
        'bg-app': '#fcf9f8',
        'bg-surface': '#ffffff',
        'bg-surface-elevated': '#f6f3f2',
        'text-primary': '#1c1b1b',
        'text-tertiary': '#3e4a3d',
        'border-outline': '#bdcaba',
        'accent-lime': '#c2d832',
        status: {
          approved: { bg: '#f7fff1', text: '#007536', border: '#007536' },
          pending: { bg: '#ffddb5', text: '#835400', border: '#fcab29' },
          declined: { bg: '#ffd9de', text: '#ba1a1a', border: '#ba1a1a' },
        },
      },
      fontFamily: {
        heading: ['var(--font-sanchez)', 'Georgia', 'serif'],
        body: ['var(--font-noto-sans)', 'system-ui', 'sans-serif'],
        data: ['var(--font-ibm-plex-sans)', "'Courier New'", 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        md: '16px',
        search: '22px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '40px',
        '3xl': '48px',
        '4xl': '64px',
      },
      boxShadow: {
        'nav-bottom': '0 -4px 5px rgba(0,0,0,0.02)',
        'bar-top': '0 4px 5px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
