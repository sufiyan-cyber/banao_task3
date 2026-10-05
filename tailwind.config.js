/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAFAF8',
        foreground: '#1A1A1A',
        muted: '#F5F3F0',
        'muted-foreground': '#6B6B6B',
        accent: {
          DEFAULT: '#B8860B',
          secondary: '#D4A84B',
          foreground: '#FFFFFF',
          muted: 'rgba(184, 134, 11, 0.08)',
        },
        border: '#E8E4DF',
        card: '#FFFFFF',
        stone: {
          50: '#FAFAF8',
          100: '#F5F3F0',
          200: '#E8E4DF',
          300: '#D6D0C7',
          400: '#A39B8E',
          500: '#6B6B6B',
          700: '#3D3A36',
          900: '#1A1A1A',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Source Sans 3', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'IBM Plex Mono', 'monospace'],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(26, 26, 26, 0.04)',
        md: '0 4px 12px rgba(26, 26, 26, 0.06)',
        lg: '0 8px 24px rgba(26, 26, 26, 0.08)',
        accent: '0 4px 14px rgba(184, 134, 11, 0.25)',
      },
      borderRadius: {
        md: '6px',
        lg: '8px',
      },
      letterSpacing: {
        smallcaps: '0.15em',
        relaxed: '0.02em',
      },
      lineHeight: {
        relaxed: '1.75',
      },
    },
  },
  plugins: [],
};
