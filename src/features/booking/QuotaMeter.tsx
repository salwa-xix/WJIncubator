import { cn } from '@/lib/cn'

type Props = { limit: number; used: number; remaining: number }

/**
 * Used / remaining, shown as discrete pips rather than a percentage bar —
 * with a cap of three, "2 of 3" is a countable thing and a bar would be
 * vaguer than the number it replaces.
 */
export function QuotaMeter({ limit, used, remaining }: Props) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: limit }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-2.5 w-7 rounded-full transition-colors',
              i < used ? 'bg-maroon' : 'bg-white/25',
            )}
          />
        ))}
      </div>
      <p className="text-sm font-semibold text-white">
        <span className="tabular-nums">{used}</span>
        <span className="text-white/50"> / </span>
        <span className="tabular-nums text-white/70">{limit}</span>
        <span className="ms-2 font-normal text-white/60">
          {remaining > 0 ? `متبقٍ ${remaining}` : 'اكتمل الحد'}
        </span>
      </p>
    </div>
  )
}
