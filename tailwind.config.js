/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#07070f',
        surface:  '#0e0e1a',
        elevated: '#16162a',
        border:   '#1e1e35',
        'border-light': '#2d2d50',

        primary: {
          DEFAULT: '#7c3aed',
          light:   '#a78bfa',
          dark:    '#5b21b6',
          dim:     'rgba(124,58,237,0.15)',
        },
        accent: {
          DEFAULT: '#f59e0b',
          light:   '#fcd34d',
          dim:     'rgba(245,158,11,0.15)',
          // alias for bg-accent-dim utility
        },
        'accent-dim': 'rgba(245,158,11,0.12)',

        text: {
          primary:   '#e2e8f0',
          secondary: '#94a3b8',
          muted:     '#475569',
          on:        '#ffffff',
        },

        success: '#10b981',
        error:   '#ef4444',
        warning: '#f59e0b',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        ui:      ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card:    '0 4px 24px rgba(0,0,0,0.5)',
        glow:    '0 0 20px rgba(124,58,237,0.35)',
        'glow-sm': '0 0 8px rgba(124,58,237,0.25)',
        player:  '0 -8px 40px rgba(124,58,237,0.2)',
      },
      backgroundImage: {
        'grid': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg stroke='%231e1e35' stroke-width='0.5'%3E%3Cpath d='M0 40V0h40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'scanlines': "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
      },
      animation: {
        'eq-1': 'eq 1.2s ease-in-out infinite',
        'eq-2': 'eq 0.9s ease-in-out infinite 0.2s',
        'eq-3': 'eq 1.4s ease-in-out infinite 0.4s',
        'eq-4': 'eq 1.1s ease-in-out infinite 0.1s',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        eq: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%':      { transform: 'scaleY(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(124,58,237,0.3)' },
          '50%':      { boxShadow: '0 0 24px rgba(124,58,237,0.6)' },
        },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
