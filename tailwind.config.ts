import type { Config } from 'tailwindcss'

/**
 * Brand palette — sampled directly from the three reference PDFs
 * (wadi-pak / wadi2 / wadiii3), which are the design system of record.
 *
 * Every value below was read off the rendered pages by pixel sampling: solid
 * interiors for fills, darkest-pixel-in-region for text, so nothing here is an
 * eyeballed approximation. Where a sampled value differed from the previous
 * token, the PDF wins — notably maroon, which is #8D1F2C in the reference and
 * was #751220 before, and the canvas, which is a neutral #FAFAFA rather than
 * the cooler #F6F6F9.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1D254F', // structure, headings, body text, avatars
          light: '#2C335A', // active tab, raised navy on navy
          soft: '#39406A', // navy-on-navy borders
          deep: '#192653', // header band
          darker: '#121739', // occupancy panel — deepest navy surface
          tint: '#F2F3F7', // selected rows, hovers
        },
        maroon: {
          DEFAULT: '#8D1F2C', // primary CTA, badges, accent numerals
          deep: '#7A1725', // hover / pressed
          soft: '#B03A44', // slot-mine border
          tint: '#F5EDEB', // slot-mine fill
          wash: '#FBECEA', // rose chip fill
        },
        sky: {
          DEFAULT: '#9DC6DC', // available-slot accent, stat accent
          deep: '#6FA8C4',
          wash: '#EFF4FA', // info alert fill
          line: '#DCE6EE', // info alert border
          chip: '#EAF2F9', // table entity chip
        },
        // The nav-rail container and other warm neutral surfaces.
        sand: {
          DEFAULT: '#F6F2EF',
          wash: '#FAF7F5',
        },
        canvas: {
          DEFAULT: '#FAFAFA', // page background
          sunk: '#F5F5F7', // wells, table heads, disabled controls
        },
        surface: {
          DEFAULT: '#FFFFFF',
          field: '#FAFAFA', // input/select fill
        },
        muted: {
          DEFAULT: '#5C6273', // secondary text
          soft: '#8A90A0', // tertiary text, placeholders
          faint: '#B0B4BE', // booked-slot text
        },
        line: {
          DEFAULT: '#EAEAEA', // hairline borders — neutral, not blue
          strong: '#DEDEE2',
          soft: '#F0F0F2',
        },
        success: {
          DEFAULT: '#1F7A48',
          bright: '#0CA142', // status dot
          tint: '#EAF6EE',
          line: '#CBE7D6',
        },
        warning: { DEFAULT: '#9A6208', tint: '#FDF5E9', line: '#EFDCBB' },
        danger: { DEFAULT: '#8D1F2C', tint: '#FBECEA', line: '#EFD3D0' },
        // The gold in the Wadi Jeddah lockup, used only for "powered by".
        gold: '#C08B3E',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Reference display sizes, measured off the PDFs at 1x.
        'display-sm': ['1.75rem', { lineHeight: '1.35' }],
        'display-md': ['2.25rem', { lineHeight: '1.3' }],
        'display-lg': ['2.75rem', { lineHeight: '1.25' }],
        stat: ['2.6rem', { lineHeight: '1.1' }], // stat-card numeral
        eyebrow: ['0.6875rem', { lineHeight: '1.45', letterSpacing: '0.14em' }],
      },
      /**
       * The reference is markedly rounder than the old scale: fields and cards
       * sit around 18–20px, the login card near 28px, and every pill is fully
       * round. Keeping distinct steps is what preserves hierarchy.
       */
      borderRadius: {
        chip: '10px', // slot chips
        field: '16px', // inputs, selects
        card: '18px', // cards, panels
        panel: '24px', // large surfaces, nav rail
        hero: '28px', // the login card
      },
      boxShadow: {
        // Soft, wide, low-opacity — the reference has almost no hard edge.
        xs: '0 1px 2px rgba(29,37,79,0.04)',
        sm: '0 1px 3px rgba(29,37,79,0.05)',
        card: '0 1px 2px rgba(29,37,79,0.03), 0 8px 24px rgba(29,37,79,0.06)',
        'card-hover': '0 2px 4px rgba(29,37,79,0.05), 0 16px 40px rgba(29,37,79,0.09)',
        hero: '0 2px 6px rgba(29,37,79,0.04), 0 24px 64px rgba(29,37,79,0.10)',
        modal: '0 32px 80px rgba(29,37,79,0.24)',
        cta: '0 2px 6px rgba(141,31,44,0.22), 0 10px 24px rgba(141,31,44,0.18)',
        'cta-hover': '0 3px 8px rgba(141,31,44,0.26), 0 16px 32px rgba(141,31,44,0.24)',
        inset: 'inset 0 1px 2px rgba(29,37,79,0.05)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        shimmer: { '100%': { transform: 'translateX(-100%)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.24s ease-out both',
        'fade-in': 'fade-in 0.18s ease-out both',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
      },
      transitionTimingFunction: {
        enterprise: 'cubic-bezier(0.2, 0, 0.13, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config
