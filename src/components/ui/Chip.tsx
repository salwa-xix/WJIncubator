import { cn } from '@/lib/cn'

/**
 * The small labels the reference uses in three distinct roles. They look
 * similar but are not interchangeable, so they are one component with an
 * explicit tone rather than three lookalikes drifting apart:
 *
 *  - `success` — "مؤكد" on a booking card: pale green fill, green text.
 *  - `rose`    — "لديك حجز مع هذا المرشد": pale rose fill, maroon text, rose border.
 *  - `entity`  — "شركة" in the admin activity table: pale blue fill, navy text.
 *  - `solid`   — "لوحة المشرف" in the admin header: solid maroon, white text.
 *  - `status`  — "مفتوحة" beside a page title: pale green with a live dot.
 *  - `neutral` — everything unremarkable.
 *
 * All are fully round except `solid`, which the reference draws as a softly
 * rounded rectangle.
 */
export type ChipTone = 'success' | 'rose' | 'entity' | 'solid' | 'status' | 'neutral' | 'warning'

const TONES: Record<ChipTone, string> = {
  success: 'rounded-full bg-success-tint text-success border border-success-line',
  rose: 'rounded-full bg-maroon-wash text-maroon border border-danger-line',
  entity: 'rounded-full bg-sky-chip text-navy',
  solid: 'rounded-[0.5rem] bg-maroon text-white',
  status: 'rounded-full bg-success-tint text-success border border-success-line',
  neutral: 'rounded-full bg-canvas-sunk text-muted border border-line',
  warning: 'rounded-full bg-warning-tint text-warning border border-warning-line',
}

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: ChipTone
  children: React.ReactNode
}

export function Chip({ tone = 'neutral', className, children, ...props }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold leading-none',
        TONES[tone],
        className,
      )}
      {...props}
    >
      {tone === 'status' && (
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-success-bright" />
      )}
      {children}
    </span>
  )
}
