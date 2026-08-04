import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'
import { InputField } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader, runAction, useSessions } from '@/features/admin/shared'
import {
  adminAddSlot,
  adminDeleteSlot,
  adminGenerateSlots,
  adminListSlots,
  adminSetMentorSlotsStatus,
  adminSetSlotStatus,
  type AdminSlot,
} from '@/lib/adminApi'
import { cn } from '@/lib/cn'

export default function AdminSlots() {
  useDocumentTitle('إدارة المواعيد')
  const { current } = useSessions()
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [detail, setDetail] = useState<AdminSlot | null>(null)
  const [adding, setAdding] = useState<{ mentorId: string; mentorName: string } | null>(null)
  const [newTime, setNewTime] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'slots', current?.id],
    queryFn: async () => {
      const res = await adminListSlots(current?.id ?? null)
      if (!res.ok) throw new Error(res.code)
      return res
    },
    enabled: Boolean(current),
  })

  async function act(fn: () => Promise<boolean>) {
    setBusy(true)
    const ok = await fn()
    setBusy(false)
    if (ok) await qc.invalidateQueries({ queryKey: ['admin'] })
  }

  const grid = useMemo(() => {
    const slots = data?.slots ?? []
    const times = [...new Set(slots.map((s) => s.start_time))].sort()
    const byMentor = new Map<string, { name: string; active: boolean; slots: Map<string, AdminSlot> }>()
    for (const s of slots) {
      if (!byMentor.has(s.mentor_id))
        byMentor.set(s.mentor_id, {
          name: s.mentor_name,
          active: s.mentor_session_active,
          slots: new Map(),
        })
      byMentor.get(s.mentor_id)!.slots.set(s.start_time, s)
    }
    return { times, byMentor: [...byMentor.entries()] }
  }, [data])

  if (!current) return <EmptyState title="أنشئ جلسة أولًا" />
  if (isLoading) return <p className="text-muted">جارٍ التحميل…</p>

  const hasSlots = (data?.slots.length ?? 0) > 0

  return (
    <>
      <PageHeader
        title="إدارة المواعيد"
        description={`أنشئ شبكة المواعيد القياسية (${current.starts_at}–${current.ends_at}، كل ${current.slot_minutes} دقيقة) ثم عدّل مواعيد كل مرشد على حدة.`}
        actions={
          <Button
            loading={busy}
            onClick={() =>
              void act(async () => {
                const res = await adminGenerateSlots(current.id)
                if (!res.ok) return runAction(async () => res, '')
                const created = (res as { created: number }).created
                return runAction(
                  async () => res,
                  created > 0 ? `تم إنشاء ${created} موعدًا` : 'لا مواعيد جديدة لإضافتها',
                )
              })
            }
          >
            إنشاء شبكة المواعيد
          </Button>
        }
      />

      <Alert tone="info" className="mb-6">
        الشبكة تُنشأ للمرشدين المفعّلين فقط، ولا تُنشأ تلقائيًا. تكرار الإنشاء آمن — لا يُضاف موعد
        مكرر.
      </Alert>

      {!hasSlots ? (
        <EmptyState
          title="لم تُنشأ مواعيد بعد"
          description="أسنِد المرشدين أولًا، ثم اضغط «إنشاء شبكة المواعيد»."
        />
      ) : (
        <Card padded={false} className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas/70">
                <th scope="col" className="px-4 py-3 text-start font-bold text-navy">المرشد</th>
                {grid.times.map((t) => (
                  <th key={t} scope="col" className="ltr-embed px-2 py-3 text-center font-bold tabular-nums text-navy">
                    {t}
                  </th>
                ))}
                <th scope="col" className="px-4 py-3 text-center font-bold text-navy">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {grid.byMentor.map(([mentorId, row]) => (
                <tr key={mentorId} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-navy">{row.name}</span>
                      {!row.active && <Badge tone="neutral">موقوف</Badge>}
                    </div>
                  </td>
                  {grid.times.map((t) => {
                    const slot = row.slots.get(t)
                    if (!slot)
                      return (
                        <td key={t} className="px-2 py-2.5 text-center text-muted/40">
                          —
                        </td>
                      )
                    const state = slot.booking_id ? 'booked' : slot.status
                    return (
                      <td key={t} className="px-2 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => setDetail(slot)}
                          title={slot.booked_by ?? undefined}
                          className={cn(
                            'w-full rounded-lg px-2 py-1.5 text-xs font-bold transition-colors',
                            state === 'booked' && 'bg-maroon/10 text-maroon hover:bg-maroon/20',
                            state === 'open' && 'bg-sky/20 text-navy hover:bg-sky/40',
                            state === 'closed' && 'bg-canvas text-muted hover:bg-line/60',
                          )}
                        >
                          {state === 'booked' ? 'محجوز' : state === 'open' ? 'متاح' : 'مغلق'}
                        </button>
                      </td>
                    )
                  })}
                  <td className="whitespace-nowrap px-4 py-2.5 text-center">
                    <div className="flex justify-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={busy}
                        onClick={() =>
                          void act(() =>
                            runAction(
                              () => adminSetMentorSlotsStatus(current.id, mentorId, 'closed'),
                              'تم إغلاق مواعيد المرشد',
                            ),
                          )
                        }
                      >
                        إغلاق الكل
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={busy}
                        onClick={() =>
                          void act(() =>
                            runAction(
                              () => adminSetMentorSlotsStatus(current.id, mentorId, 'open'),
                              'تم فتح مواعيد المرشد',
                            ),
                          )
                        }
                      >
                        فتح الكل
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setAdding({ mentorId, mentorName: row.name })
                          setNewTime('')
                        }}
                      >
                        + موعد
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Badge tone="sky">متاح</Badge>
        <Badge tone="maroon">محجوز</Badge>
        <Badge tone="neutral">مغلق</Badge>
      </div>

      {/* ---- single-slot detail ---- */}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? `${detail.mentor_name} — ${detail.start_time}` : ''}
        footer={
          detail && (
            <>
              <Button variant="secondary" block onClick={() => setDetail(null)}>
                إغلاق
              </Button>
              {!detail.booking_id && (
                <Button
                  block
                  loading={busy}
                  onClick={() =>
                    void act(async () => {
                      const ok = await runAction(
                        () => adminSetSlotStatus(detail.id, detail.status === 'open' ? 'closed' : 'open'),
                        detail.status === 'open' ? 'تم إغلاق الموعد' : 'تم فتح الموعد',
                      )
                      if (ok) setDetail(null)
                      return ok
                    })
                  }
                >
                  {detail.status === 'open' ? 'إغلاق الموعد' : 'فتح الموعد'}
                </Button>
              )}
            </>
          )
        }
      >
        {detail && (
          <div className="space-y-4">
            <p className="ltr-embed text-sm font-semibold tabular-nums text-muted">
              {detail.start_time} – {detail.end_time}
            </p>
            {detail.booking_id ? (
              <Alert tone="warning">
                محجوز من <span className="font-bold">{detail.booked_by}</span>. لإغلاق هذا الموعد أو
                حذفه، ألغِ الحجز أولًا من صفحة الحجوزات.
              </Alert>
            ) : (
              <>
                <p className="text-sm text-muted">
                  الحالة الحالية:{' '}
                  <span className="font-bold text-navy">
                    {detail.status === 'open' ? 'متاح' : 'مغلق'}
                  </span>
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  loading={busy}
                  onClick={() =>
                    void act(async () => {
                      const ok = await runAction(() => adminDeleteSlot(detail.id), 'تم حذف الموعد')
                      if (ok) setDetail(null)
                      return ok
                    })
                  }
                >
                  حذف الموعد نهائيًا
                </Button>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* ---- add a single slot ---- */}
      <Modal
        open={Boolean(adding)}
        onClose={() => setAdding(null)}
        title={adding ? `إضافة موعد — ${adding.mentorName}` : ''}
        footer={
          <>
            <Button variant="secondary" block onClick={() => setAdding(null)}>
              إلغاء
            </Button>
            <Button
              block
              loading={busy}
              disabled={!/^\d{2}:\d{2}$/.test(newTime)}
              onClick={() =>
                void act(async () => {
                  const ok = await runAction(
                    () => adminAddSlot(current.id, adding!.mentorId, newTime),
                    'تمت إضافة الموعد',
                  )
                  if (ok) setAdding(null)
                  return ok
                })
              }
            >
              إضافة
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <InputField
            label="وقت البداية"
            type="time"
            dir="ltr"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
          />
          <Alert tone="info">
            مدة الجلسة <span className="tabular-nums">{current.slot_minutes}</span> دقيقة، تُحسب
            نهاية الموعد تلقائيًا.
          </Alert>
        </div>
      </Modal>
    </>
  )
}
