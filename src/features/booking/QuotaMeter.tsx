import { cn } from '@/lib/cn'

type Props = { limit: number; used: number; remaining: number; date?: string | null }

/**
 * Used / remaining, shown as discrete pips rather than a percentage bar — with a
 * cap of three, "2 of 3" is a countable thing and a bar would be vaguer than the
 * number it replaces.
 *
 * The reference wraps the pips and the count together in a single translucent
 * pill on the navy band rather than letting them float loose against it. Pips are
 * maroon dashes; spent ones stay maroon and unspent drop to white/20, so the
 * fill is what reads as "used up".
 */
export function QuotaMeter({ limit, used, remaining, date }: Props) {
  return (
    <div className="inline-flex flex-wrap items-center gap-x-4 gap-y-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2.5">
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: limit }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 w-7 rounded-full transition-colors',
              i < used ? 'bg-maroon' : 'bg-white/20',
            )}
          />
        ))}
      </div>
      <p className="text-sm font-bold text-white">
        <span className="tabular-nums">{used}</span>
        <span className="text-white/45"> / </span>
        <span className="tabular-nums text-white/75">{limit}</span>
        <span className="ms-2 font-medium text-white/60">
          {remaining > 0 ? `متبقٍ ${remaining}` : 'اكتمل الحد'}
        </span>
      </p>
      {date && (
        <>
          <span aria-hidden="true" className="h-4 w-px bg-white/20" />
          <span className="ltr-embed text-sm tabular-nums text-white/60">{date}</span>
        </>
      )}
    </div>
  )
}
