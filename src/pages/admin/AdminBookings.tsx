import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'
import { InputField, SelectField } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader, runAction, useSessions } from '@/features/admin/shared'
import {
  adminCancelBooking,
  adminListBookings,
  adminListMentors,
  adminListSlots,
  adminListStartups,
  adminReassignBooking,
  type AdminBooking,
} from '@/lib/adminApi'

export default function AdminBookings() {
  useDocumentTitle('الحجوزات')
  const { current } = useSessions()
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [filters, setFilters] = useState({ startupId: '', mentorId: '', startTime: '', status: 'confirmed' })
  const [cancelling, setCancelling] = useState<AdminBooking | null>(null)
  const [reason, setReason] = useState('')
  const [moving, setMoving] = useState<AdminBooking | null>(null)
  const [targetSlot, setTargetSlot] = useState('')

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin', 'bookings', current?.id, filters],
    queryFn: async () => {
      const res = await adminListBookings({ sessionId: current?.id ?? null, ...filters })
      if (!res.ok) throw new Error(res.code)
      return res.bookings
    },
    enabled: Boolean(current),
  })

  const { data: mentors } = useQuery({
    queryKey: ['admin', 'mentors', current?.id],
    queryFn: async () => {
      const res = await adminListMentors(current?.id ?? null)
      return res.ok ? res.mentors : []
    },
    enabled: Boolean(current),
  })

  const { data: startups } = useQuery({
    queryKey: ['admin', 'startups', current?.id],
    queryFn: async () => {
      const res = await adminListStartups(current?.id ?? null)
      return res.ok ? res.startups : []
    },
    enabled: Boolean(current),
  })

  const { data: slotData } = useQuery({
    queryKey: ['admin', 'slots', current?.id],
    queryFn: async () => {
      const res = await adminListSlots(current?.id ?? null)
      return res.ok ? res : null
    },
    enabled: Boolean(current),
  })

  const times = useMemo(
    () => [...new Set((slotData?.slots ?? []).map((s) => s.start_time))].sort(),
    [slotData],
  )

  // Only slots that are open, unbooked, and belong to an active mentor can
  // receive a moved booking. The database re-checks all of it anyway; this
  // just avoids offering a choice that would be refused.
  const moveTargets = useMemo(
    () =>
      (slotData?.slots ?? []).filter(
        (s) => !s.booking_id && s.status === 'open' && s.mentor_session_active,
      ),
    [slotData],
  )

  async function act(fn: () => Promise<boolean>) {
    setBusy(true)
    const ok = await fn()
    setBusy(false)
    if (ok) await qc.invalidateQueries({ queryKey: ['admin'] })
  }

  if (!current) return <EmptyState title="أنشئ جلسة أولًا" />

  const rows = bookings ?? []

  return (
    <>
      <PageHeader title="الحجوزات" description="عرض جميع الحجوزات مع إمكانية التصفية والإلغاء والنقل." />

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SelectField
            label="الشركة"
            value={filters.startupId}
            onChange={(e) => setFilters({ ...filters, startupId: e.target.value })}
          >
            <option value="">الكل</option>
            {startups?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name_ar}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="المرشد"
            value={filters.mentorId}
            onChange={(e) => setFilters({ ...filters, mentorId: e.target.value })}
          >
            <option value="">الكل</option>
            {mentors?.filter((m) => m.assigned).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name_ar}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="الوقت"
            value={filters.startTime}
            onChange={(e) => setFilters({ ...filters, startTime: e.target.value })}
          >
            <option value="">الكل</option>
            {times.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="الحالة"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">الكل</option>
            <option value="confirmed">مؤكد</option>
            <option value="cancelled">ملغى</option>
          </SelectField>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            النتائج: <span className="font-bold tabular-nums text-navy">{rows.length}</span>
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFilters({ startupId: '', mentorId: '', startTime: '', status: '' })}
          >
            مسح التصفية
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <p className="text-muted">جارٍ التحميل…</p>
      ) : rows.length === 0 ? (
        <EmptyState title="لا توجد حجوزات مطابقة" description="جرّب تعديل خيارات التصفية." />
      ) : (
        <Card padded={false} className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas-sunk text-start">
                <th scope="col" className="px-4 py-3 text-start font-bold text-navy">الشركة</th>
                <th scope="col" className="px-4 py-3 text-start font-bold text-navy">المرشد</th>
                <th scope="col" className="px-4 py-3 text-start font-bold text-navy">الوقت</th>
                <th scope="col" className="px-4 py-3 text-start font-bold text-navy">التاريخ</th>
                <th scope="col" className="px-4 py-3 text-start font-bold text-navy">الحالة</th>
                <th scope="col" className="px-4 py-3 text-center font-bold text-navy">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {b.startup_logo && (
                        <img src={b.startup_logo} alt="" className="size-7 rounded object-contain" />
                      )}
                      <span className="font-semibold text-navy">{b.startup_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-navy">{b.mentor_name}</td>
                  <td className="ltr-embed px-4 py-3 tabular-nums text-muted">
                    {b.start_time}–{b.end_time}
                  </td>
                  <td className="ltr-embed px-4 py-3 tabular-nums text-muted">
                    {b.session_date ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {b.status === 'confirmed' ? (
                      <Badge tone="success">مؤكد</Badge>
                    ) : (
                      <Badge tone="neutral">ملغى</Badge>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    {b.status === 'confirmed' ? (
                      <div className="flex justify-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setMoving(b); setTargetSlot('') }}>
                          نقل
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => { setCancelling(b); setReason('') }}>
                          إلغاء
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted">{b.cancel_reason ?? '—'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* ---- cancel ---- */}
      <Modal
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        title="إلغاء الحجز"
        footer={
          <>
            <Button variant="secondary" block onClick={() => setCancelling(null)}>
              تراجع
            </Button>
            <Button
              variant="danger"
              block
              loading={busy}
              onClick={() =>
                void act(async () => {
                  const ok = await runAction(
                    () => adminCancelBooking(cancelling!.id, reason),
                    'تم إلغاء الحجز وإتاحة الموعد',
                  )
                  if (ok) setCancelling(null)
                  return ok
                })
              }
            >
              تأكيد الإلغاء
            </Button>
          </>
        }
      >
        {cancelling && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted">
              إلغاء حجز <span className="font-bold text-navy">{cancelling.startup_name}</span> مع{' '}
              <span className="font-bold text-navy">{cancelling.mentor_name}</span> الساعة{' '}
              <span className="ltr-embed font-bold text-navy">{cancelling.start_time}</span>.
            </p>
            <InputField
              label="سبب الإلغاء (اختياري)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <Alert tone="info">
              سيعود الموعد متاحًا للشركات الأخرى مباشرة، وستُسترد الحصة للشركة.
            </Alert>
          </div>
        )}
      </Modal>

      {/* ---- reassign ---- */}
      <Modal
        open={Boolean(moving)}
        onClose={() => setMoving(null)}
        title="نقل الحجز"
        footer={
          <>
            <Button variant="secondary" block onClick={() => setMoving(null)}>
              إلغاء
            </Button>
            <Button
              block
              loading={busy}
              disabled={!targetSlot}
              onClick={() =>
                void act(async () => {
                  const ok = await runAction(
                    () => adminReassignBooking(moving!.id, targetSlot),
                    'تم نقل الحجز',
                  )
                  if (ok) setMoving(null)
                  return ok
                })
              }
            >
              نقل
            </Button>
          </>
        }
      >
        {moving && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted">
              نقل حجز <span className="font-bold text-navy">{moving.startup_name}</span> من{' '}
              <span className="font-bold text-navy">{moving.mentor_name}</span>{' '}
              <span className="ltr-embed">{moving.start_time}</span> إلى موعد آخر.
            </p>
            <SelectField
              label="الموعد الجديد"
              value={targetSlot}
              onChange={(e) => setTargetSlot(e.target.value)}
            >
              <option value="">اختر موعدًا</option>
              {moveTargets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.mentor_name} — {s.start_time}
                </option>
              ))}
            </SelectField>
            <Alert tone="info">
              يُعاد فحص جميع القواعد عند النقل: تعارض التوقيت، وتكرار المرشد، وتوفر الموعد. لن يتم
              النقل إذا نتج عنه تعارض.
            </Alert>
          </div>
        )}
      </Modal>
    </>
  )
}
