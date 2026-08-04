import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Chip, type ChipTone } from '@/components/ui/Chip'
import { cn } from '@/lib/cn'
import { messageFor } from '@/lib/errors'
import { adminListSessions, type AdminSession } from '@/lib/adminApi'
import type { RpcResult } from '@/lib/api'

/**
 * The session every admin screen operates on: the open one, or the most
 * recently created if none is open yet. Everything downstream keys off this,
 * so no screen has to ask "which session?" separately.
 */
export function useSessions() {
  const query = useQuery({
    queryKey: ['admin', 'sessions'],
    queryFn: async () => {
      const res = await adminListSessions()
      if (!res.ok) throw new Error(res.code)
      return res.sessions
    },
  })
  const sessions = query.data ?? []
  const current: AdminSession | null =
    sessions.find((s) => s.status === 'open') ?? sessions[0] ?? null
  return { ...query, sessions, current }
}

/**
 * Uniform handling for every admin mutation: a green toast on success, the
 * mapped Arabic message on failure. Returning a boolean lets callers branch
 * without re-inspecting the envelope.
 */
export async function runAction(
  action: () => Promise<RpcResult<Record<string, unknown>>>,
  successMessage: string,
): Promise<boolean> {
  const res = await action()
  if (!res.ok) {
    toast.error(messageFor(res.code))
    return false
  }
  toast.success(successMessage)
  return true
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  /**
   * The reference sets the page title large (~36px) with any status chip on the
   * SAME baseline beside it, then the description underneath — not the title and
   * actions on opposite sides of the row, which is what pushed the status pill
   * away from the thing it describes.
   */
  return (
    <div className="mb-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-display-sm font-extrabold text-navy sm:text-display-md">{title}</h1>
          {actions}
        </div>
      </div>
      {description && <p className="mt-2.5 max-w-3xl text-sm text-muted">{description}</p>}
    </div>
  )
}

/**
 * The stat card from the reference: a 6px accent bar down the inline-start edge,
 * a small muted label, then an oversized numeral in the accent's colour. The
 * numeral is the whole point of the card, so it is ~42px against a 15px label —
 * the previous 30px value beside a 12px label read as a table cell, not a stat.
 *
 * `tone` drives the bar and the numeral together; they are never different
 * colours in the reference.
 */
export function StatTile({
  label,
  value,
  tone = 'navy',
  hint,
}: {
  label: string
  value: number | string
  tone?: 'navy' | 'maroon' | 'sky' | 'muted'
  hint?: string
}) {
  const numeral = {
    navy: 'text-navy',
    maroon: 'text-maroon',
    sky: 'text-sky-deep',
    muted: 'text-muted',
  }
  const accent = { navy: 'navy', maroon: 'maroon', sky: 'sky', muted: 'navy' } as const
  return (
    <Card accent={accent[tone]} className="flex min-h-[9.5rem] flex-col justify-center px-6 py-5">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className={cn('mt-2 text-stat font-extrabold tabular-nums', numeral[tone])}>{value}</p>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </Card>
  )
}

const SESSION_STATUS: Record<AdminSession['status'], { label: string; tone: ChipTone }> = {
  draft: { label: 'مسودة', tone: 'neutral' },
  open: { label: 'مفتوحة', tone: 'status' },
  closed: { label: 'مغلقة', tone: 'rose' },
}

export function SessionStatusPill({ status }: { status: AdminSession['status'] }) {
  const s = SESSION_STATUS[status]
  return <Chip tone={s.tone}>{s.label}</Chip>
}

/** A small labelled toggle used across mentor/startup rows. */
export function Toggle({
  checked,
  onChange,
  disabled,
  labelOn = 'مفعّل',
  labelOff = 'موقوف',
}: {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  labelOn?: string
  labelOff?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        checked
          ? 'border-success-line bg-success-tint text-success'
          : 'border-line bg-canvas-sunk text-muted',
      )}
    >
      <span
        aria-hidden="true"
        className={cn('size-2 rounded-full', checked ? 'bg-success-bright' : 'bg-muted-soft')}
      />
      {checked ? labelOn : labelOff}
    </button>
  )
}
