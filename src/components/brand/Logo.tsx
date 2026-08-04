import { cn } from '@/lib/cn'

type Props = {
  /** `light` for dark backgrounds, `dark` for the canvas. */
  tone?: 'light' | 'dark'
  className?: string
}

/**
 * The WJIncubator lockup, set in type exactly as it appears in the source
 * decks: "WJIncubator" / "حاضنة وادي جدة" / "powered by Wadi Jeddah", with the
 * short maroon rule beneath.
 */
export function Logo({ tone = 'dark', className = '' }: Props) {
  const primary = tone === 'light' ? 'text-white' : 'text-navy'
  const secondary = tone === 'light' ? 'text-white/70' : 'text-muted'

  return (
    // `w-fit` keeps the Latin and Arabic lines on the same edge — without it the
    // ltr-embedded lines hug the opposite side of a full-width block.
    <div className={cn('w-fit text-start', className)}>
      <div className={`ltr-embed text-[1.6rem] font-bold leading-none tracking-tight ${primary}`}>
        <span className="font-extrabold">WJ</span>
        <span className="font-semibold">Incubator</span>
      </div>
      <div className={`mt-1.5 text-base font-bold leading-none ${primary}`}>حاضنة وادي جدة</div>
      <div className={`ltr-embed mt-2 text-[0.7rem] font-medium leading-none ${secondary}`}>
        powered by <span className="font-bold">Wadi Jeddah</span>
      </div>
      <div className="mt-2.5 h-[3px] w-14 rounded-full bg-maroon" />
    </div>
  )
}
