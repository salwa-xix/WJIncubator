import { cn } from '@/lib/cn'

/**
 * The initial badge the reference puts on every mentor and booking card: a solid
 * circle carrying the first Arabic letter of the name in white.
 *
 * Two shapes, and the distinction is deliberate in the reference rather than
 * incidental — people are circles, organisations are rounded squares. The
 * startup avatar in the dashboard header is a rounded square holding either a
 * logo or an initial; mentors are always circles.
 */
type Props = {
  name?: string | null
  /** Overrides the derived initial. */
  initial?: string
  src?: string | null
  shape?: 'circle' | 'squircle'
  tone?: 'navy' | 'maroon' | 'onNavy'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: 'size-10 text-base',
  md: 'size-12 text-lg',
  lg: 'size-16 text-2xl',
} as const

const TONES = {
  navy: 'bg-navy text-white',
  maroon: 'bg-maroon text-white',
  // On a navy band the avatar inverts: white plate, maroon letter.
  onNavy: 'bg-white text-maroon',
} as const

/**
 * First letter of the first *substantive* word.
 *
 * Arabic names here carry honorifics — "د. بسمة خوجة", "أ. محمد" — and taking
 * `name[0]` yields "د" for every doctor on the list, which is exactly what the
 * reference does not show: it renders "ب" for بسمة. So leading single-letter
 * tokens ending in a full stop, and the spelled-out honorifics, are skipped.
 */
const HONORIFICS = new Set(['د', 'أ', 'م', 'الدكتور', 'الدكتورة', 'الأستاذ', 'الأستاذة', 'المهندس', 'المهندسة'])

function deriveInitial(name?: string | null): string {
  if (!name) return '—'
  for (const raw of name.trim().split(/\s+/)) {
    const word = raw.replace(/[.\u060C،]/g, '')
    if (!word || HONORIFICS.has(word)) continue
    return word.charAt(0)
  }
  return name.trim().charAt(0)
}

export function Avatar({
  name,
  initial,
  src,
  shape = 'circle',
  tone = 'navy',
  size = 'md',
  className = '',
}: Props) {
  const letter = initial ?? deriveInitial(name)
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-[0.9rem]'

  if (src) {
    return (
      <div
        className={cn(
          'grid shrink-0 place-items-center overflow-hidden bg-white p-1.5',
          radius,
          SIZES[size],
          className,
        )}
      >
        <img src={src} alt="" className="size-full object-contain" />
      </div>
    )
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center font-bold leading-none',
        radius,
        SIZES[size],
        TONES[tone],
        className,
      )}
    >
      {letter}
    </div>
  )
}
