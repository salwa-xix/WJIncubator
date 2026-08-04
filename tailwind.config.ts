import type { Config } from 'tailwindcss'

/**
 * Brand palette — every value below was extracted directly from the WJIncubator /
 * Wadi Jeddah source PDFs (vector fills + rendered page sampling), not from the
 * generated prototype images. See README "Brand system" for provenance.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1D254F', // primary structure — headers, sidebars
          light: '#202B59', // elevated navy surfaces
          soft: '#39406A', // navy on navy borders
        },
        maroon: {
          DEFAULT: '#751220', // primary CTA — دخول / تأكيد الحجز
          deep: '#74031B', // hover / pressed
          soft: '#8E2333', // subtle maroon accents
        },
        sky: {
          DEFAULT: '#9DC6DC', // "available" slot state
          deep: '#6FA8C4', // available, hovered
          wash: '#EEF3F6', // card tint
        },
        sand: '#EAE4E0', // warm neutral accent
        canvas: '#F6F6F9', // page background
        muted: '#596480', // secondary text
        line: '#E4E6EE', // hairline borders
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '18px',
        chip: '10px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(29,37,79,0.04), 0 8px 24px rgba(29,37,79,0.06)',
        'card-hover': '0 2px 4px rgba(29,37,79,0.06), 0 14px 34px rgba(29,37,79,0.10)',
        modal: '0 24px 64px rgba(29,37,79,0.24)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.24s ease-out both',
        'fade-in': 'fade-in 0.18s ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config
