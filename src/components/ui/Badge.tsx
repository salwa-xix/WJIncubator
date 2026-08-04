import { cn } from '@/lib/cn'

type Tone = 'navy' | 'maroon' | 'sky' | 'neutral' | 'success' | 'warning'

const TONES: Record<Tone, string> = {
  navy: 'bg-navy text-white',
  maroon: 'bg-maroon/10 text-maroon',
  sky: 'bg-sky/25 text-navy',
  neutral: 'bg-canvas text-muted border border-line',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
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
