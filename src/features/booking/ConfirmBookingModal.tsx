import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import type { DashboardMentor, DashboardSlot } from '@/lib/api'

type Props = {
  target: { mentor: DashboardMentor; slot: DashboardSlot } | null
  submitting: boolean
  error: string | null
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmBookingModal({ target, submitting, error, onConfirm, onClose }: Props) {
  return (
    <Modal
      open={Boolean(target)}
      onClose={submitting ? () => {} : onClose}
      title="تأكيد الحجز"
      footer={
        <>
          <Button variant="secondary" block onClick={onClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button block loading={submitting} onClick={onConfirm}>
            تأكيد الحجز
          </Button>
        </>
      }
    >
      {target && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-chip border border-line bg-canvas p-4">
            {target.mentor.image_url ? (
              <img
                src={target.mentor.image_url}
                alt=""
                className="size-14 shrink-0 rounded-full border border-line object-cover"
              />
            ) : (
              <div className="grid size-14 shrink-0 place-items-center rounded-full border border-line bg-white text-lg font-bold text-navy/25">
                {target.mentor.name_ar.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-navy">{target.mentor.name_ar}</p>
              <p className="ltr-embed text-sm font-semibold tabular-nums text-muted">
                {target.slot.start_time} – {target.slot.end_time}
              </p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-muted">
            هل تريد حجز جلسة مع <span className="font-bold text-navy">{target.mentor.name_ar}</span>{' '}
            الساعة <span className="ltr-embed font-bold text-navy">{target.slot.start_time}</span>؟
          </p>

          {/* Stated up front: self-cancellation is disabled for this event, so
              the startup needs to know the route to a change exists — via the
              organisers — rather than believing the booking is irreversible. */}
          <Alert tone="info">
            لا يمكنك إلغاء الحجز مباشرة بعد التأكيد. إذا احتجت إلى تعديل الحجز أو إلغائه، تواصل مع
            إدارة المعسكر.
          </Alert>

          {error && <Alert tone="error">{error}</Alert>}
        </div>
      )}
    </Modal>
  )
}
