import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  /** Stretch to the container width — used for the login CTA. */
  block?: boolean
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-maroon text-white hover:bg-maroon-deep active:bg-maroon-deep shadow-sm',
  secondary: 'bg-white text-navy border border-line hover:border-navy/30 hover:bg-canvas',
  ghost: 'bg-transparent text-navy hover:bg-navy/5',
  danger: 'bg-white text-maroon border border-maroon/25 hover:bg-maroon/5',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-chip gap-1.5',
  md: 'h-11 px-5 text-[0.95rem] rounded-chip gap-2',
  lg: 'h-14 px-7 text-lg rounded-card gap-2.5',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  className,
  disabled,
  children,
  ...props
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-55',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  )
}
