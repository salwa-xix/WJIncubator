import { Chip } from '@/components/ui/Chip'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { SlotChip } from './SlotChip'
import { avatarTone } from './avatarTone'
import type { DashboardMentor, DashboardSlot } from '@/lib/api'

type Props = {
  mentor: DashboardMentor
  /** True once this startup has hit its cap — available slots stay visible but inert. */
  quotaExhausted: boolean
  onSelectSlot: (mentor: DashboardMentor, slot: DashboardSlot) => void
}

/**
 * The mentor card, rebuilt to the reference (wadi2.pdf).
 *
 * Order there: circular avatar, name in bold navy with the availability label in
 * maroon on the same line, the rose "لديك حجز" chip below, the bio, a hairline
 * divider, the organisations as dotted tags, then the slots under a "المواعيد"
 * heading with its available-count on the opposite side.
 *
 * The slots sit inside the same white card, separated by a divider. The previous
 * version put them in a tinted footer strip, which split one card into two
 * visually and is not what the reference does.
 */
export function MentorCard({ mentor, quotaExhausted, onSelectSlot }: Props) {
  const bookedByMe = mentor.slots.some((s) => s.state === 'mine')
  const openCount = mentor.slots.filter((s) => s.state === 'available').length

  return (
    <Card padded={false}>
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <Avatar
            name={mentor.name_ar}
            src={mentor.image_url}
            tone={avatarTone(mentor.name_ar)}
            size="lg"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-lg font-bold text-navy">{mentor.name_ar}</h3>
              {/* Verbatim from the source file; display metadata only. */}
              {mentor.availability_label && (
                <span className="text-xs font-bold text-maroon">{mentor.availability_label}</span>
              )}
            </div>
            {mentor.role && <p className="mt-1 text-sm text-muted">{mentor.role}</p>}
            {bookedByMe && (
              <Chip tone="rose" className="mt-2.5">
                لديك حجز مع هذا المرشد
              </Chip>
            )}
          </div>
        </div>

        {mentor.bio && <p className="mt-4 text-sm leading-relaxed text-muted">{mentor.bio}</p>}

        {mentor.organizations.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-4">
            {mentor.organizations.map((org, i) => (
              <div key={`${org.name}-${i}`} className="flex items-center gap-2">
                {org.logo_url ? (
                  <img
                    src={org.logo_url}
                    alt=""
                    loading="lazy"
                    className="h-7 w-auto object-contain"
                  />
                ) : (
                  // The reference marks each organisation with a small sky dot
                  // when there is no logo, which is what keeps the tags legible
                  // as a list rather than a run-on line of grey text.
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-sky" />
                )}
                <span className="text-xs font-semibold text-muted">{org.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-line px-5 py-5 sm:px-6">
        {mentor.slots.length === 0 ? (
          <p className="text-sm text-muted">لم تُضَف مواعيد لهذا المرشد بعد.</p>
        ) : (
          <>
            <div className="mb-3.5 flex items-baseline justify-between gap-3">
              <p className="text-sm font-bold text-navy">المواعيد</p>
              <p className="text-xs text-muted">
                {openCount > 0 ? `${openCount} موعد متاح` : 'لا توجد مواعيد متاحة'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
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
