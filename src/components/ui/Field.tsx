import { useId } from 'react'
import { cn } from '@/lib/cn'

/**
 * Controls as the reference draws them: a 56px box at the field radius, filled
 * with the faint surface tint rather than white, and bordered with a hairline
 * that is almost invisible until focus. The fill is what separates the control
 * from the white card behind it — on white-on-white the fields disappeared.
 */
const CONTROL =
  'h-14 w-full rounded-field border bg-surface-field px-4 text-base text-navy transition-colors ' +
  'placeholder:text-muted-soft disabled:cursor-not-allowed disabled:bg-canvas-sunk disabled:text-muted-soft ' +
  'focus:outline-none focus:ring-2 focus:ring-maroon/40 focus:border-maroon/40'

/**
 * Leading glyph. Positioned on the wrapper, not inside the control, so it
 * follows the *document* direction even when the input itself is force-embedded
 * LTR (the 4-digit code field is). `start-4` therefore lands on the right in
 * Arabic and the left in English.
 */
function LeadingIcon({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 start-4 my-auto flex size-5 items-center justify-center text-muted"
    >
      {children}
    </span>
  )
}

type LabelProps = {
  label: string
  hint?: string
  error?: boolean
  children: React.ReactNode
  htmlFor?: string
}

function FieldShell({ label, hint, children, htmlFor }: LabelProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2.5 block text-sm font-bold text-navy">
        {label}
      </label>
      {children}
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  )
}

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'> & {
  label: string
  hint?: string
  invalid?: boolean
  icon?: React.ReactNode
}

export function SelectField({ label, hint, invalid, icon, id, ...props }: SelectProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <FieldShell label={label} hint={hint} htmlFor={fieldId}>
      <div className="relative">
        {icon && <LeadingIcon>{icon}</LeadingIcon>}
        <select
          id={fieldId}
          aria-invalid={invalid || undefined}
          className={cn(
            CONTROL,
            // `pe-` (padding-inline-end) not `pr-`: in RTL the chevron sits on
            // the left, and a physical property would pad the wrong side.
            'appearance-none pe-11',
            Boolean(icon) && 'ps-12',
            invalid ? 'border-maroon/60' : 'border-line',
          )}
          {...props}
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute inset-y-0 end-4 my-auto size-5 text-muted"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </FieldShell>
  )
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  label: string
  hint?: string
  invalid?: boolean
  /** Renders a show/hide toggle, as in the reference login card. */
  reveal?: { shown: boolean; onToggle: () => void }
  icon?: React.ReactNode
}

export function InputField({ label, hint, invalid, reveal, icon, id, ...props }: InputProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <FieldShell label={label} hint={hint} htmlFor={fieldId}>
      <div className="relative">
        {icon && <LeadingIcon>{icon}</LeadingIcon>}
        <input
          id={fieldId}
          aria-invalid={invalid || undefined}
          className={cn(
            CONTROL,
            // Symmetric padding, not `pe-`: `ltr-embed` below flips the input's
            // own inline direction, so a logical property would pad the side
            // OPPOSITE the reveal button and let the text run under it. It is
            // also what a leading icon plus a trailing button needs anyway.
            Boolean(reveal || icon) && 'px-12',
            invalid ? 'border-maroon/60' : 'border-line',
            // Digits read left-to-right even inside an RTL form, and centring
            // keeps a short code clear of the button on either side.
            props.inputMode === 'numeric' &&
              'ltr-embed text-center text-lg font-semibold tracking-[0.6em] indent-[0.6em]',
          )}
          {...props}
        />
        {reveal && (
          <button
            type="button"
            onClick={reveal.onToggle}
            aria-label={reveal.shown ? 'إخفاء الرمز' : 'إظهار الرمز'}
            className="absolute inset-y-0 end-3 my-auto flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas-sunk hover:text-navy"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              {reveal.shown ? (
                <>
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <path d="m2 2 20 20" />
                </>
              ) : (
                <>
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        )}
      </div>
    </FieldShell>
  )
}
