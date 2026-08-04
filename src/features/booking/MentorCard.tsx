import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { SlotChip } from './SlotChip'
import type { DashboardMentor, DashboardSlot } from '@/lib/api'

type Props = {
  mentor: DashboardMentor
  /** True once this startup has hit its cap — available slots stay visible but inert. */
  quotaExhausted: boolean
  onSelectSlot: (mentor: DashboardMentor, slot: DashboardSlot) => void
}

export function MentorCard({ mentor, quotaExhausted, onSelectSlot }: Props) {
  const bookedByMe = mentor.slots.some((s) => s.state === 'mine')
  const openCount = mentor.slots.filter((s) => s.state === 'available').length

  return (
    <Card
      padded={false}
      className={bookedByMe ? 'border-maroon/30 ring-1 ring-maroon/15' : undefined}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {mentor.image_url ? (
            <img
              src={mentor.image_url}
              alt=""
              loading="lazy"
              className="size-20 shrink-0 rounded-full border border-line object-cover"
            />
          ) : (
            <div className="grid size-20 shrink-0 place-items-center rounded-full border border-line bg-canvas text-2xl font-bold text-navy/25">
              {mentor.name_ar.charAt(0)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-navy">{mentor.name_ar}</h3>
              {/* Verbatim from the source file; display metadata only. */}
              {mentor.availability_label && (
                <span className="text-xs font-semibold text-maroon">
                  {mentor.availability_label}
                </span>
              )}
            </div>
            {mentor.role && <p className="mt-0.5 text-sm text-muted">{mentor.role}</p>}
            {bookedByMe && (
              <Badge tone="maroon" className="mt-2">
                لديك حجز مع هذا المرشد
              </Badge>
            )}
          </div>
        </div>

        {mentor.bio && (
          <p className="mt-4 text-sm leading-relaxed text-muted">{mentor.bio}</p>
        )}

        {mentor.organizations.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-4">
            {mentor.organizations.map((org, i) => (
              <div key={`${org.name}-${i}`} className="flex items-center gap-2">
                {org.logo_url && (
                  <img src={org.logo_url} alt="" loading="lazy" className="h-7 w-auto object-contain" />
                )}
                <span className="text-xs font-medium text-muted">{org.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-line bg-canvas/60 px-5 py-4 sm:px-6">
        {mentor.slots.length === 0 ? (
          <p className="text-sm text-muted">لم تُضَف مواعيد لهذا المرشد بعد.</p>
        ) : (
          <>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <p className="text-xs font-bold text-navy">المواعيد</p>
              <p className="text-xs text-muted">
                {openCount > 0 ? `${openCount} موعد متاح` : 'لا توجد مواعيد متاحة'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {mentor.slots.map((slot) => (
                <SlotChip
                  key={slot.id}
                  slot={slot}
                  // A second booking with the same mentor is refused by the
                  // database anyway; disabling here avoids a round trip that
                  // could only ever fail.
                  disabled={quotaExhausted || bookedByMe}
                  onSelect={(s) => onSelectSlot(mentor, s)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
