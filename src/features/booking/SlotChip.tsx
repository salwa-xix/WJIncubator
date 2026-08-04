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

/**
 * Slot states exactly as the reference draws them:
 *  - available — white, hairline border, navy time, muted label
 *  - mine      — pale maroon fill, maroon border, maroon text
 *  - booked    — faint sunken fill, faint text, no strike-through
 *  - closed    — same as booked
 *
 * Note there is no strike-through in the reference. It was removed rather than
 * kept "for clarity": a line through a time is hard to read at 13px, and the
 * fill plus the "محجوز" label already carry the state.
 */
const STYLES: Record<DashboardSlot['state'], string> = {
  available:
    'border-line bg-white text-navy hover:border-maroon/40 hover:bg-maroon-tint/60 cursor-pointer',
  mine: 'border-maroon-soft bg-maroon-tint text-maroon cursor-default',
  booked: 'border-line-soft bg-canvas-sunk text-muted-faint cursor-not-allowed',
  closed: 'border-line-soft bg-canvas-sunk text-muted-faint cursor-not-allowed',
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
        'flex min-w-[5.5rem] flex-col items-center gap-1 rounded-chip border px-4 py-2.5 transition-colors duration-200 ease-enterprise',
        STYLES[slot.state],
        blocked && 'cursor-not-allowed opacity-55',
      )}
    >
      <span className="ltr-embed text-[0.95rem] font-bold tabular-nums leading-none">
        {slot.start_time}
      </span>
      <span className="text-[0.7rem] font-medium leading-none opacity-80">
        {LABELS[slot.state]}
      </span>
    </button>
  )
}
