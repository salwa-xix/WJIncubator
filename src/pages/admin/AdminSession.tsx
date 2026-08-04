import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardSubtitle, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { InputField } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader, SessionStatusPill, runAction, useSessions } from '@/features/admin/shared'
import {
  adminCloseSession,
  adminCreateSession,
  adminOpenSession,
  adminUpdateSession,
} from '@/lib/adminApi'

export default function AdminSession() {
  useDocumentTitle('إدارة الجلسة')
  const { sessions, current, isLoading } = useSessions()
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)

  const [newName, setNewName] = useState('جلسات الإرشاد — WJIncubator')
  const [newDate, setNewDate] = useState('')
  const [dateDraft, setDateDraft] = useState('')
  const [capDraft, setCapDraft] = useState('')

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ['admin'] })
  }

  async function act(fn: () => Promise<boolean>) {
    setBusy(true)
    const ok = await fn()
    setBusy(false)
    if (ok) await refresh()
  }

  if (isLoading) return <p className="text-muted">جارٍ التحميل…</p>

  return (
    <>
      <PageHeader
        title="إدارة الجلسة"
        description="الجلسة تحدّد التاريخ وشبكة المواعيد وحد الحجوزات. لا يمكن فتح جلسة بدون تاريخ ومواعيد."
      />

      {sessions.length === 0 ? (
        <EmptyState title="لا توجد جلسات" description="أنشئ أول جلسة للبدء." className="mb-6" />
      ) : (
        <div className="mb-8 space-y-4">
          {sessions.map((s) => (
            <Card key={s.id} className={s.id === current?.id ? 'border-navy/25 ring-1 ring-navy/10' : undefined}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <CardTitle>{s.name}</CardTitle>
                    <SessionStatusPill status={s.status} />
                  </div>
                  <CardSubtitle className="mt-2">
                    <span className="ltr-embed">{s.session_date ?? '—'}</span> ·{' '}
                    <span className="ltr-embed">
                      {s.starts_at}–{s.ends_at}
                    </span>{' '}
                    · كل <span className="tabular-nums">{s.slot_minutes}</span> دقيقة · الحد{' '}
                    <span className="tabular-nums">{s.max_bookings_per_startup}</span> حجوزات
                  </CardSubtitle>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone="neutral">
                      مرشدون مُسنَدون: <span className="tabular-nums">{s.mentors_assigned}</span>
                    </Badge>
                    <Badge tone="neutral">
                      مفعّلون: <span className="tabular-nums">{s.mentors_active}</span>
                    </Badge>
                    <Badge tone="neutral">
                      مواعيد: <span className="tabular-nums">{s.slots_total}</span>
                    </Badge>
                    <Badge tone="maroon">
                      حجوزات: <span className="tabular-nums">{s.bookings}</span>
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {s.status !== 'open' ? (
                    <Button
                      size="sm"
                      loading={busy}
                      onClick={() =>
                        void act(() => runAction(() => adminOpenSession(s.id), 'تم فتح الجلسة'))
                      }
                    >
                      فتح الجلسة
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="danger"
                      loading={busy}
                      onClick={() =>
                        void act(() => runAction(() => adminCloseSession(s.id), 'تم إغلاق الجلسة'))
                      }
                    >
                      إغلاق الجلسة
                    </Button>
                  )}
                </div>
              </div>

              {/* Blockers are stated before the admin tries and is refused. */}
              {s.status !== 'open' && (!s.session_date || s.slots_total === 0) && (
                <Alert tone="warning" className="mt-4">
                  {!s.session_date && 'يجب تحديد تاريخ الجلسة. '}
                  {s.slots_total === 0 && 'يجب إنشاء المواعيد قبل فتح الجلسة.'}
                </Alert>
              )}

              {s.id === current?.id && (
                <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
                  <div className="flex items-end gap-2">
                    <InputField
                      label="تاريخ الجلسة"
                      type="date"
                      dir="ltr"
                      value={dateDraft || s.session_date || ''}
                      onChange={(e) => setDateDraft(e.target.value)}
                    />
                    <Button
                      size="md"
                      variant="secondary"
                      loading={busy}
                      disabled={!dateDraft}
                      onClick={() =>
                        void act(() =>
                          runAction(
                            () => adminUpdateSession(s.id, { date: dateDraft }),
                            'تم تحديث التاريخ',
                          ),
                        )
                      }
                    >
                      حفظ
                    </Button>
                  </div>

                  <div className="flex items-end gap-2">
                    <InputField
                      label="الحد الأقصى للحجوزات لكل شركة"
                      type="number"
                      min={0}
                      max={10}
                      dir="ltr"
                      value={capDraft || String(s.max_bookings_per_startup)}
                      onChange={(e) => setCapDraft(e.target.value)}
                    />
                    <Button
                      size="md"
                      variant="secondary"
                      loading={busy}
                      disabled={!capDraft}
                      onClick={() =>
                        void act(() =>
                          runAction(
                            () => adminUpdateSession(s.id, { maxBookings: Number(capDraft) }),
                            'تم تحديث الحد الأقصى',
                          ),
                        )
                      }
                    >
                      حفظ
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardTitle>إنشاء جلسة جديدة</CardTitle>
        <CardSubtitle className="mt-1.5">
          تُنشأ الجلسة كمسودة بدون مرشدين وبدون مواعيد. الإسناد وإنشاء المواعيد خطوتان منفصلتان.
        </CardSubtitle>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <InputField label="اسم الجلسة" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <InputField
            label="التاريخ (اختياري الآن)"
            type="date"
            dir="ltr"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
        </div>
        <Button
          className="mt-5"
          loading={busy}
          disabled={!newName.trim()}
          onClick={() =>
            void act(() =>
              runAction(
                () => adminCreateSession({ name: newName.trim(), date: newDate || null }),
                'تم إنشاء الجلسة',
              ),
            )
          }
        >
          إنشاء الجلسة
        </Button>
      </Card>
    </>
  )
}
