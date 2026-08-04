import { cn } from '@/lib/cn'

type Tone = 'error' | 'warning' | 'info' | 'success'

const TONES: Record<Tone, string> = {
  error: 'bg-maroon/[0.06] text-maroon border-maroon/25',
  warning: 'bg-amber-50 text-amber-800 border-amber-300',
  info: 'bg-sky-wash text-navy border-sky/50',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-300',
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
        'flex items-start gap-3 rounded-chip border px-4 py-3 text-sm leading-relaxed animate-fade-in',
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
