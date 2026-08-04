import { cn } from '@/lib/cn'

/**
 * Referenced by URL, not imported. The file lives in `public/`, which Vite
 * copies verbatim and does not treat as a module graph entry — an `import` of
 * this path fails to resolve at build time.
 */
const WADI_JEDDAH_LOGO = '/assets/brand/wadi-jeddah.png'

/**
 * The lockup as the reference draws it: the Wadi Jeddah logo on a white rounded
 * card, a hairline divider, then "WJIncubator" with the Arabic name and a gold
 * "powered by Wadi Jeddah" beneath.
 *
 * The Wadi Jeddah logo stays a raster asset. It has gradient strokes in olive
 * and gold, so tracing it would either lose the gradients or bloat the bundle
 * with a path nobody can maintain — and unlike the leaf, it is never recoloured.
 * Extracted from the reference PDF at 22× into public/assets/brand/.
 *
 * `stacked` is the login variant, where the card sits above centred type; the
 * default is the header variant, where card and type sit side by side.
 */
type Props = {
  tone?: 'light' | 'dark'
  layout?: 'row' | 'stacked'
  /** Hide the Wadi Jeddah card and show type only (tight spaces). */
  markless?: boolean
  className?: string
}

export function Logo({ tone = 'dark', layout = 'row', markless = false, className = '' }: Props) {
  const light = tone === 'light'
  const title = light ? 'text-white' : 'text-navy'
  const sub = light ? 'text-white/70' : 'text-muted'
  const rule = light ? 'bg-white/20' : 'bg-line-strong'

  const mark = (
    <div className="shrink-0 rounded-[0.85rem] bg-white p-2 shadow-sm">
      <img
        src={WADI_JEDDAH_LOGO}
        alt="وادي جدة"
        className="block h-9 w-auto"
        // Decorative duplicate of the adjacent wordmark in the row layout, but
        // the sole brand identifier when stacked — so it keeps a real alt.
        loading="eager"
      />
    </div>
  )

  const type = (
    <div className={cn(layout === 'stacked' ? 'text-center' : 'text-start')}>
      <div className={cn('ltr-embed text-[1.55rem] font-bold leading-none tracking-tight', title)}>
        <span className="font-extrabold">WJ</span>
        <span className="font-semibold">Incubator</span>
      </div>
      <div className={cn('mt-2 text-[0.9rem] font-bold leading-none', light ? 'text-white/85' : 'text-navy')}>
        حاضنة وادي جدة
      </div>
      <div className={cn('ltr-embed mt-2 text-[0.7rem] font-bold leading-none text-gold')}>
        powered by Wadi Jeddah
      </div>
      {layout === 'stacked' && <div className="mx-auto mt-3.5 h-[3px] w-14 rounded-full bg-maroon" />}
    </div>
  )

  if (layout === 'stacked') {
    return (
      <div className={cn('flex w-full flex-col items-center gap-5', className)}>
        {!markless && mark}
        {type}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {!markless && mark}
      {!markless && <div className={cn('h-11 w-px shrink-0', rule)} />}
      {type}
      <span className={cn('sr-only', sub)}>WJIncubator — حاضنة وادي جدة</span>
    </div>
  )
}
