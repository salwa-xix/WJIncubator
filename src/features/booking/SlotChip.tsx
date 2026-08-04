import { cn } from '@/lib/cn'
import type { DashboardSlot } from '@/lib/api'

type Props = {
  slot: DashboardSlot
  disabled?: boolean
  onSelect: (slot: DashboardSlot) => void
}

const LABELS: Record<DashboardSlot['state'], string> = {
  available: 'متاح',
  booked: 'محجوز',
  mine: 'حجزك',
  closed: 'مغلق',
}

const STYLES: Record<DashboardSlot['state'], string> = {
  available: 'border-sky bg-sky/15 text-navy hover:bg-sky/35 hover:border-sky-deep cursor-pointer',
  mine: 'border-maroon/35 bg-maroon/10 text-maroon cursor-default',
  booked: 'border-line bg-canvas text-muted/70 cursor-not-allowed line-through decoration-muted/40',
  closed: 'border-line bg-canvas text-muted/60 cursor-not-allowed',
}

export function SlotChip({ slot, disabled = false, onSelect }: Props) {
  const interactive = slot.state === 'available' && !disabled
  // A quota-blocked slot is still genuinely available to others, so it keeps
  // its "available" styling and only loses interactivity — dimming it would
  // wrongly suggest someone else took it.
  const blocked = slot.state === 'available' && disabled

  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={() => interactive && onSelect(slot)}
      aria-label={`${slot.start_time} — ${LABELS[slot.state]}`}
      className={cn(
        'flex min-w-[5.25rem] flex-col items-center gap-0.5 rounded-chip border px-3 py-2 text-sm font-semibold transition-colors',
        STYLES[slot.state],
        blocked && 'cursor-not-allowed opacity-55',
      )}
    >
      <span className="ltr-embed tabular-nums">{slot.start_time}</span>
      <span className="text-[0.68rem] font-medium opacity-80">{LABELS[slot.state]}</span>
    </button>
  )
}
