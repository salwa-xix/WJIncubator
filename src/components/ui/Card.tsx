import { cn } from '@/lib/cn'

type Props = React.HTMLAttributes<HTMLDivElement> & {
  /** Lift on hover — for cards that are themselves interactive. */
  interactive?: boolean
  padded?: boolean
}

export function Card({ interactive = false, padded = true, className, ...props }: Props) {
  return (
    <div
      className={cn(
        'rounded-card border border-line/70 bg-white shadow-card',
        padded && 'p-5 sm:p-6',
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
