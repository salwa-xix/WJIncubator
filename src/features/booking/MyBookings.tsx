import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import type { DashboardBooking } from '@/lib/api'

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
        <Card key={b.id} padded={false} className="overflow-hidden border-maroon/25">
          <div className="flex items-center gap-4 p-4">
            {b.mentor_image ? (
              <img
                src={b.mentor_image}
                alt=""
                loading="lazy"
                className="size-14 shrink-0 rounded-full border border-line object-cover"
              />
            ) : (
              <div className="grid size-14 shrink-0 place-items-center rounded-full border border-line bg-canvas text-lg font-bold text-navy/25">
                {b.mentor_name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-navy">{b.mentor_name}</p>
              <p className="ltr-embed mt-0.5 text-sm font-semibold tabular-nums text-muted">
                {b.start_time} – {b.end_time}
              </p>
            </div>
          </div>
          <div className="border-t border-line bg-canvas/60 px-4 py-2.5">
            <Badge tone="success">مؤكد</Badge>
          </div>
        </Card>
      ))}
    </div>
  )
}
