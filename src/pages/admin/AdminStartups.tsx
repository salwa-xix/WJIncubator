import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader, Toggle, runAction, useSessions } from '@/features/admin/shared'
import {
  adminListBookings,
  adminListStartups,
  adminResetStartupCode,
  adminSetStartupActive,
  type AdminStartup,
} from '@/lib/adminApi'

export default function AdminStartups() {
  useDocumentTitle('الشركات الناشئة')
  const { current } = useSessions()
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [revealed, setRevealed] = useState<{ name: string; code: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState<AdminStartup | null>(null)
  const [detail, setDetail] = useState<AdminStartup | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'startups', current?.id],
    queryFn: async () => {
      const res = await adminListStartups(current?.id ?? null)
      if (!res.ok) throw new Error(res.code)
      return res.startups
    },
  })

  const { data: detailBookings } = useQuery({
    queryKey: ['admin', 'bookings', current?.id, detail?.id],
    queryFn: async () => {
      const res = await adminListBookings({ sessionId: current?.id ?? null, startupId: detail!.id })
      return res.ok ? res.bookings : []
    },
    enabled: Boolean(detail && current),
  })

  async function act(fn: () => Promise<boolean>) {
    setBusy(true)
    const ok = await fn()
    setBusy(false)
    if (ok) await qc.invalidateQueries({ queryKey: ['admin'] })
  }

  if (isLoading) return <p className="text-muted">جارٍ التحميل…</p>
  const startups = data ?? []

  return (
    <>
      <PageHeader
        title="الشركات الناشئة"
        description="تفعيل الشركات، ومتابعة الحصص، وإعادة تعيين الرموز السرية."
      />

      <Alert tone="info" className="mb-6">
        الرموز السرية مُخزّنة مشفّرة ولا يمكن عرضها. عند إعادة التعيين يظهر الرمز الجديد مرة واحدة
        فقط — احفظه قبل إغلاق النافذة.
      </Alert>

      {startups.length === 0 ? (
        <EmptyState title="لا توجد شركات" />
      ) : (
        <Card padded={false} className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas/70">
                <th scope="col" className="px-4 py-3 text-start font-bold text-navy">الشركة</th>
                <th scope="col" className="px-4 py-3 text-start font-bold text-navy">القطاع</th>
                <th scope="col" className="px-4 py-3 text-center font-bold text-navy">الحجوزات</th>
                <th scope="col" className="px-4 py-3 text-center font-bold text-navy">الرمز</th>
                <th scope="col" className="px-4 py-3 text-center font-bold text-navy">الحالة</th>
                <th scope="col" className="px-4 py-3 text-center font-bold text-navy">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {startups.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {s.logo_url ? (
                        <img src={s.logo_url} alt="" className="size-9 rounded object-contain" />
                      ) : (
                        <div className="grid size-9 place-items-center rounded bg-canvas text-xs font-bold text-navy/30">
                          {s.name_ar.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-navy">{s.name_ar}</p>
                        <p className="ltr-embed text-xs text-muted">{s.name_en}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{s.sector ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold tabular-nums text-navy">{s.used}</span>
                    <span className="text-muted"> / </span>
                    <span className="tabular-nums text-muted">{s.limit}</span>
                    <p className="text-[0.68rem] text-muted">متبقٍ {Math.max(s.limit - s.used, 0)}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {/* Never the code or its hash — only whether one exists. */}
                    {s.has_code ? (
                      <Badge tone="success">مُعيَّن</Badge>
                    ) : (
                      <Badge tone="warning">غير مُعيَّن</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle
                      checked={s.is_active}
                      disabled={busy}
                      onChange={(next) =>
                        void act(() =>
                          runAction(
                            () => adminSetStartupActive(s.id, next),
                            next ? 'تم تفعيل الشركة' : 'تم إيقاف الشركة',
                          ),
                        )
                      }
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setDetail(s)}>
                        الحجوزات
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setConfirmReset(s)}>
                        رمز جديد
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* ---- reset confirmation ---- */}
      <Modal
        open={Boolean(confirmReset)}
        onClose={() => setConfirmReset(null)}
        title="إعادة تعيين الرمز السري"
        footer={
          <>
            <Button variant="secondary" block onClick={() => setConfirmReset(null)}>
              إلغاء
            </Button>
            <Button
              block
              loading={busy}
              onClick={() =>
                void act(async () => {
                  setBusy(true)
                  const res = await adminResetStartupCode(confirmReset!.id)
                  setBusy(false)
                  if (!res.ok) return runAction(async () => res, '')
                  setRevealed({ name: confirmReset!.name_ar, code: res.code })
                  setConfirmReset(null)
                  return true
                })
              }
            >
              إنشاء رمز جديد
            </Button>
          </>
        }
      >
        {confirmReset && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted">
              سيتم إنشاء رمز جديد لـ{' '}
              <span className="font-bold text-navy">{confirmReset.name_ar}</span> وإبطال الرمز
              الحالي فورًا.
            </p>
            <Alert tone="warning">
              إذا كانت الشركة تستخدم الرمز الحالي فلن تتمكن من الدخول به بعد الآن.
            </Alert>
          </div>
        )}
      </Modal>

      {/* ---- reveal once ---- */}
      <Modal
        open={Boolean(revealed)}
        onClose={() => setRevealed(null)}
        title="الرمز الجديد"
        footer={
          <Button block onClick={() => setRevealed(null)}>
            حفظته — إغلاق
          </Button>
        }
      >
        {revealed && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted">{revealed.name}</p>
            <p className="ltr-embed rounded-card border border-line bg-canvas py-6 text-5xl font-bold tabular-nums tracking-[0.35em] text-navy">
              {revealed.code}
            </p>
            <Alert tone="warning">
              هذه هي المرة الوحيدة التي يظهر فيها الرمز. الرموز مُخزّنة مشفّرة ولا يمكن استرجاعها.
            </Alert>
          </div>
        )}
      </Modal>

      {/* ---- one startup's bookings ---- */}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? `حجوزات ${detail.name_ar}` : ''}
        footer={
          <Button variant="secondary" block onClick={() => setDetail(null)}>
            إغلاق
          </Button>
        }
      >
        {detail && (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              مستخدم <span className="font-bold tabular-nums text-navy">{detail.used}</span> من{' '}
              <span className="tabular-nums">{detail.limit}</span> — متبقٍ{' '}
              <span className="font-bold tabular-nums text-navy">
                {Math.max(detail.limit - detail.used, 0)}
              </span>
            </p>
            {(detailBookings ?? []).length === 0 ? (
              <p className="rounded-chip border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
                لا توجد حجوزات
              </p>
            ) : (
              <ul className="divide-y divide-line rounded-chip border border-line">
                {detailBookings!.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="text-sm font-semibold text-navy">{b.mentor_name}</span>
                    <span className="ltr-embed text-sm tabular-nums text-muted">
                      {b.start_time}–{b.end_time}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
