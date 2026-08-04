import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'onNavy'
type Size = 'sm' | 'md' | 'lg'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  /** Stretch to the container width — used for the login CTA. */
  block?: boolean
}

/**
 * Sizes and radii follow the reference: the login CTA is a 60px maroon block at
 * the field radius, and secondary controls are pills. `onNavy` is the treatment
 * the reference uses for "خروج" and the email badge inside a navy band — a
 * transparent pill with a hairline white border, which is not the same thing as
 * `secondary` on canvas.
 */
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-maroon text-white hover:bg-maroon-deep active:bg-maroon-deep shadow-cta hover:shadow-cta-hover',
  secondary: 'bg-white text-navy border border-line hover:border-line-strong hover:bg-canvas',
  ghost: 'bg-transparent text-navy hover:bg-navy-tint',
  danger: 'bg-white text-maroon border border-danger-line hover:bg-danger-tint',
  onNavy: 'bg-white/[0.07] text-white border border-white/25 hover:bg-white/[0.14]',
}

const SIZES: Record<Size, string> = {
  sm: 'h-10 px-4 text-sm rounded-full gap-2',
  md: 'h-12 px-5 text-[0.95rem] rounded-field gap-2',
  lg: 'h-[3.75rem] px-7 text-[1.05rem] rounded-field gap-2.5',
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
        'inline-flex items-center justify-center font-bold transition-all duration-200 ease-enterprise',
        'disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none',
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
