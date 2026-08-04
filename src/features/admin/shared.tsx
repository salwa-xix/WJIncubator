import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
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
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

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
  const tones = {
    navy: 'text-navy',
    maroon: 'text-maroon',
    sky: 'text-sky-deep',
    muted: 'text-muted',
  }
  return (
    <Card className="py-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className={cn('mt-1 text-3xl font-bold tabular-nums', tones[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  )
}

const SESSION_STATUS: Record<AdminSession['status'], { label: string; cls: string }> = {
  draft: { label: 'مسودة', cls: 'bg-canvas text-muted border border-line' },
  open: { label: 'مفتوحة', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  closed: { label: 'مغلقة', cls: 'bg-maroon/10 text-maroon border border-maroon/20' },
}

export function SessionStatusPill({ status }: { status: AdminSession['status'] }) {
  const s = SESSION_STATUS[status]
  return (
    <span className={cn('rounded-full px-3 py-1 text-xs font-bold', s.cls)}>{s.label}</span>
  )
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
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-line bg-canvas text-muted',
      )}
    >
      <span
        aria-hidden="true"
        className={cn('size-2 rounded-full', checked ? 'bg-emerald-500' : 'bg-muted/40')}
      />
      {checked ? labelOn : labelOff}
    </button>
  )
}
