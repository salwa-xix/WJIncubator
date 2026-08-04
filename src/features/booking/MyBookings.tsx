import { Chip } from '@/components/ui/Chip'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { avatarTone } from './avatarTone'
import type { DashboardBooking } from '@/lib/api'

/**
 * Confirmed bookings, as the reference draws them: a circular initial avatar,
 * the mentor's name in bold navy with the time beneath, then a hairline divider
 * and the "مؤكد" chip in its own footer strip.
 *
 * The card carries no maroon border. The reference distinguishes these cards by
 * the green chip alone — tinting the border as well said "warning" twice and
 * competed with the mentor cards below.
 */
export function MyBookings({ bookings }: { bookings: DashboardBooking[] }) {
  if (bookings.length === 0) {
    return (
      <EmptyState
        title="لا توجد حجوزات بعد"
        description="اختر موعدًا متاحًا من قائمة المرشدين أدناه لتأكيد أول جلسة."
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {bookings.map((b) => (
        <Card key={b.id} padded={false} className="overflow-hidden">
          <div className="flex items-center gap-4 p-5">
            <Avatar
              name={b.mentor_name}
              src={b.mentor_image}
              tone={avatarTone(b.mentor_name)}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-navy">{b.mentor_name}</p>
              <p className="ltr-embed mt-1 text-sm font-semibold tabular-nums text-muted">
                {b.start_time} – {b.end_time}
              </p>
            </div>
          </div>
          <div className="border-t border-line px-5 py-3">
            <Chip tone="success">مؤكد</Chip>
          </div>
        </Card>
      ))}
    </div>
  )
}
