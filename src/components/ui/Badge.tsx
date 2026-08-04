import { cn } from '@/lib/cn'

type Tone = 'navy' | 'maroon' | 'sky' | 'neutral' | 'success' | 'warning'

/**
 * Onto the sampled palette. `emerald-*`/`amber-*` are Tailwind defaults and read
 * as a different product beside the reference colours.
 *
 * New work should prefer `Chip`, which carries the reference's own label roles
 * (success / rose / entity / solid / status). Badge stays for the call sites that
 * still use its tone names.
 */
const TONES: Record<Tone, string> = {
  navy: 'bg-navy text-white',
  maroon: 'bg-maroon-wash text-maroon border border-danger-line',
  sky: 'bg-sky-chip text-navy',
  neutral: 'bg-canvas-sunk text-muted border border-line',
  success: 'bg-success-tint text-success border border-success-line',
  warning: 'bg-warning-tint text-warning border border-warning-line',
}

type Props = React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }

export function Badge({ tone = 'neutral', className, ...props }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
        TONES[tone],
        className,
      )}
      {...props}
    />
  )
}
