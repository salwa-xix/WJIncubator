import { cn } from '@/lib/cn'

type Tone = 'error' | 'warning' | 'info' | 'success'

/**
 * Tones taken from the reference. The info alert on the dashboard is the one
 * shown there: a pale blue fill with a light blue hairline and navy text — not
 * blue text, which would fight the body copy around it. `amber-*`/`emerald-*`
 * are gone; they are Tailwind defaults and read as a different product beside
 * the sampled palette.
 */
const TONES: Record<Tone, string> = {
  error: 'bg-danger-tint text-maroon border-danger-line',
  warning: 'bg-warning-tint text-warning border-warning-line',
  info: 'bg-sky-wash text-navy border-sky-line',
  success: 'bg-success-tint text-success border-success-line',
}

const ICONS: Record<Tone, string> = {
  error: 'M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z',
  warning: 'M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z',
  info: 'M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  success: 'M20 6 9 17l-5-5',
}

type Props = {
  tone?: Tone
  title?: string
  children: React.ReactNode
  className?: string
}

/**
 * `role="alert"` so a screen reader announces a failed login immediately —
 * without it the message is silent for anyone not watching the field.
 */
export function Alert({ tone = 'error', title, children, className }: Props) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-field border px-4 py-3.5 text-sm leading-relaxed animate-fade-in',
        TONES[tone],
        className,
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 size-4 shrink-0"
      >
        <path d={ICONS[tone]} />
      </svg>
      <div>
        {title && <p className="mb-0.5 font-bold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  )
}
