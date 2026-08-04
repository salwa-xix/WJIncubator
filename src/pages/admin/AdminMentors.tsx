import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'
import { InputField } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader, Toggle, runAction, useSessions } from '@/features/admin/shared'
import {
  adminAssignMentors,
  adminListMentors,
  adminSetSessionMentorActive,
  adminUnassignMentor,
  adminUpdateMentor,
  type AdminMentor,
} from '@/lib/adminApi'

export default function AdminMentors() {
  useDocumentTitle('المرشدون')
  const { current } = useSessions()
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<AdminMentor | null>(null)
  const [draft, setDraft] = useState({ name_ar: '', role: '', bio: '', availability_label: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'mentors', current?.id],
    queryFn: async () => {
      const res = await adminListMentors(current?.id ?? null)
      if (!res.ok) throw new Error(res.code)
      return res.mentors
    },
    enabled: Boolean(current),
  })

  async function act(fn: () => Promise<boolean>) {
    setBusy(true)
    const ok = await fn()
    setBusy(false)
    if (ok) await qc.invalidateQueries({ queryKey: ['admin'] })
  }

  if (!current) return <EmptyState title="أنشئ جلسة أولًا" description="إسناد المرشدين يتم لجلسة محددة." />
  if (isLoading) return <p className="text-muted">جارٍ التحميل…</p>

  const mentors = data ?? []
  const assigned = mentors.filter((m) => m.assigned)
  const unassigned = mentors.filter((m) => !m.assigned)

  return (
    <>
      <PageHeader
        title="المرشدون"
        description={`جميع ملفات المرشدين (${mentors.length}) محفوظة في قاعدة البيانات. المشاركة في الجلسة قرار يتخذه المشرف — لا يُسنَد أحد تلقائيًا.`}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Badge tone="neutral">
          مُسنَدون: <span className="tabular-nums">{assigned.length}</span>
        </Badge>
        <Badge tone="success">
          مفعّلون: <span className="tabular-nums">{assigned.filter((m) => m.session_active).length}</span>
        </Badge>
        <Badge tone="neutral">
          غير مُسنَدين: <span className="tabular-nums">{unassigned.length}</span>
        </Badge>
      </div>

      {/* ---- assign ---- */}
      {unassigned.length > 0 && (
        <Card className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-navy">إسناد مرشدين إلى الجلسة</h2>
              <p className="mt-1 text-sm text-muted">اختر من تريد إسنادهم، ثم أكّد الإسناد.</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPicked(new Set(unassigned.map((m) => m.id)))}
              >
                تحديد الكل
              </Button>
              <Button
                size="sm"
                loading={busy}
                disabled={picked.size === 0}
                onClick={() =>
                  void act(async () => {
                    const ok = await runAction(
                      () => adminAssignMentors(current.id, [...picked]),
                      `تم إسناد ${picked.size} مرشدًا`,
                    )
                    if (ok) setPicked(new Set())
                    return ok
                  })
                }
              >
                إسناد المحدد ({picked.size})
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unassigned.map((m) => {
              const on = picked.has(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    setPicked((prev) => {
                      const next = new Set(prev)
                      next.has(m.id) ? next.delete(m.id) : next.add(m.id)
                      return next
                    })
                  }
                  aria-pressed={on}
                  className={`flex items-center gap-3 rounded-chip border px-3 py-2.5 text-start transition-colors ${
                    on ? 'border-maroon/40 bg-maroon/5' : 'border-line bg-white hover:border-navy/25'
                  }`}
                >
                  {m.image_url && (
                    <img src={m.image_url} alt="" className="size-9 rounded-full object-cover" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-navy">
                    {m.name_ar}
                  </span>
                  {on && <span className="text-maroon">✓</span>}
                </button>
              )
            })}
          </div>
        </Card>
      )}

      {/* ---- assigned roster ---- */}
      <h2 className="mb-4 text-lg font-bold text-navy">مرشدو الجلسة</h2>
      {assigned.length === 0 ? (
        <EmptyState
          title="لم يُسنَد أي مرشد بعد"
          description="اختر المرشدين من القائمة أعلاه لإسنادهم إلى هذه الجلسة."
        />
      ) : (
        <div className="space-y-3">
          {assigned.map((m) => (
            <Card key={m.id} className="flex flex-wrap items-center gap-4">
              {m.image_url ? (
                <img src={m.image_url} alt="" className="size-14 rounded-full object-cover" />
              ) : (
                <div className="grid size-14 place-items-center rounded-full bg-canvas font-bold text-muted-soft">
                  {m.name_ar.charAt(0)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-navy">{m.name_ar}</p>
                  {m.availability_label && (
                    <span className="text-xs font-semibold text-maroon">{m.availability_label}</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted">
                  مواعيد: <span className="tabular-nums">{m.slots_total}</span> · مغلقة:{' '}
                  <span className="tabular-nums">{m.slots_closed}</span> · حجوزات:{' '}
                  <span className="tabular-nums">{m.bookings}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Toggle
                  checked={m.session_active}
                  disabled={busy}
                  onChange={(next) =>
                    void act(() =>
                      runAction(
                        () => adminSetSessionMentorActive(current.id, m.id, next),
                        next ? 'تم تفعيل المرشد' : 'تم إيقاف المرشد',
                      ),
                    )
                  }
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(m)
                    setDraft({
                      name_ar: m.name_ar,
                      role: m.role ?? '',
                      bio: m.bio ?? '',
                      availability_label: m.availability_label ?? '',
                    })
                  }}
                >
                  تعديل
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={busy}
                  // Refused by the database while bookings exist; disabling
                  // here explains why before the click rather than after.
                  disabled={m.bookings > 0}
                  title={m.bookings > 0 ? 'لا يمكن الإزالة لوجود حجوزات' : undefined}
                  onClick={() =>
                    void act(() =>
                      runAction(
                        () => adminUnassignMentor(current.id, m.id),
                        'تمت إزالة المرشد من الجلسة',
                      ),
                    )
                  }
                >
                  إزالة
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="تعديل بيانات المرشد"
        footer={
          <>
            <Button variant="secondary" block onClick={() => setEditing(null)}>
              إلغاء
            </Button>
            <Button
              block
              loading={busy}
              onClick={() =>
                void act(async () => {
                  const ok = await runAction(
                    () =>
                      adminUpdateMentor(editing!.id, {
                        nameAr: draft.name_ar,
                        role: draft.role,
                        bio: draft.bio,
                        availabilityLabel: draft.availability_label,
                      }),
                    'تم حفظ بيانات المرشد',
                  )
                  if (ok) setEditing(null)
                  return ok
                })
              }
            >
              حفظ
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <InputField
            label="الاسم"
            value={draft.name_ar}
            onChange={(e) => setDraft({ ...draft, name_ar: e.target.value })}
          />
          <InputField
            label="الدور / التخصص"
            value={draft.role}
            onChange={(e) => setDraft({ ...draft, role: e.target.value })}
          />
          <InputField
            label="وسم التوفر"
            value={draft.availability_label}
            onChange={(e) => setDraft({ ...draft, availability_label: e.target.value })}
          />
          <div>
            <label className="mb-2 block text-sm font-bold text-navy">النبذة</label>
            <textarea
              rows={4}
              value={draft.bio}
              onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
              className="w-full rounded-chip border border-line bg-white p-4 text-sm leading-relaxed text-navy focus:border-maroon/40 focus:outline-none focus:ring-2 focus:ring-maroon/50"
            />
          </div>
          <Alert tone="info">
            البيانات مأخوذة من ملف المصدر. أي تعديل هنا يُسجَّل في سجل العمليات.
          </Alert>
        </div>
      </Modal>
    </>
  )
}
