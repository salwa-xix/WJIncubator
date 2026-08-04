import { cn } from '@/lib/cn'

type Props = React.HTMLAttributes<HTMLDivElement> & {
  /** Lift on hover — for cards that are themselves interactive. */
  interactive?: boolean
  padded?: boolean
  /**
   * The stat-card treatment from the reference: a 6px accent bar down the
   * inline-start edge. Logical border, so it sits on the right in Arabic and
   * flips with the language.
   */
  accent?: 'navy' | 'maroon' | 'sky' | 'success'
}

const ACCENTS: Record<NonNullable<Props['accent']>, string> = {
  navy: 'border-s-[6px] border-s-navy',
  maroon: 'border-s-[6px] border-s-maroon',
  sky: 'border-s-[6px] border-s-sky',
  success: 'border-s-[6px] border-s-success',
}

export function Card({ interactive = false, padded = true, accent, className, ...props }: Props) {
  return (
    <div
      className={cn(
        'rounded-card border border-line bg-white shadow-card',
        padded && 'p-5 sm:p-6',
        accent && ACCENTS[accent],
        interactive && 'transition-shadow duration-200 hover:shadow-card-hover',
        className,
      )}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-bold text-navy', className)} {...props} />
}

export function CardSubtitle({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm leading-relaxed text-muted', className)} {...props} />
}
