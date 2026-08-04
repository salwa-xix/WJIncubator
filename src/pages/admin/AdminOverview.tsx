import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { PageHeader, SessionStatusPill, StatTile, useSessions } from '@/features/admin/shared'
import { adminAuditLog, adminOverview } from '@/lib/adminApi'

const ACTION_LABELS: Record<string, string> = {
  login: 'تسجيل دخول شركة',
  book: 'حجز جلسة',
  cancel: 'إلغاء حجز (شركة)',
  create_session: 'إنشاء جلسة',
  update_session: 'تعديل جلسة',
  open_session: 'فتح الجلسة',
  close_session: 'إغلاق الجلسة',
  assign_mentors: 'إسناد مرشدين',
  unassign_mentor: 'إزالة إسناد مرشد',
  activate_mentor: 'تفعيل مرشد',
  deactivate_mentor: 'إيقاف مرشد',
  generate_slots: 'إنشاء شبكة المواعيد',
  add_slot: 'إضافة موعد',
  delete_slot: 'حذف موعد',
  set_slot_status: 'تغيير حالة موعد',
  set_mentor_slots_status: 'تغيير حالة مواعيد مرشد',
  cancel_booking: 'إلغاء حجز (مشرف)',
  reassign_booking: 'نقل حجز',
  set_startup_active: 'تغيير تفعيل شركة',
  set_startup_limit: 'تغيير حد الحجوزات',
  set_startup_code: 'تعيين رمز شركة',
  reset_startup_code: 'إعادة تعيين رمز شركة',
  set_mentor_active: 'تغيير تفعيل مرشد',
  update_mentor: 'تعديل بيانات مرشد',
}

export default function AdminOverview() {
  useDocumentTitle('نظرة عامة')
  const { current, isLoading } = useSessions()

  const { data: stats } = useQuery({
    queryKey: ['admin', 'overview', current?.id],
    queryFn: async () => {
      const res = await adminOverview(current?.id ?? null)
      if (!res.ok) throw new Error(res.code)
      return res
    },
    enabled: Boolean(current),
  })

  const { data: audit } = useQuery({
    queryKey: ['admin', 'audit'],
    queryFn: async () => {
      const res = await adminAuditLog(25)
      if (!res.ok) throw new Error(res.code)
      return res.entries
    },
  })

  if (isLoading) return <p className="text-muted">جارٍ التحميل…</p>

  if (!current) {
    return (
      <>
        <PageHeader title="نظرة عامة" />
        <EmptyState
          title="لا توجد جلسة بعد"
          description="ابدأ بإنشاء جلسة حجز، ثم أسنِد المرشدين وأنشئ المواعيد."
        />
        <div className="mt-5 flex justify-center">
          <Link to="/admin/session">
            <Button>إنشاء جلسة</Button>
          </Link>
        </div>
      </>
    )
  }

  const fillRate =
    stats && stats.total_slots > 0 ? Math.round((stats.booked_slots / stats.total_slots) * 100) : 0

  return (
    <>
      <PageHeader
        title="نظرة عامة"
        description={`${current.name} — ${current.session_date ?? 'لم يُحدَّد التاريخ بعد'}`}
        actions={<SessionStatusPill status={current.status} />}
      />

      {current.status !== 'open' && (
        <Alert tone="warning" className="mb-6">
          الجلسة غير مفتوحة حاليًا، ولا يمكن للشركات الحجز.{' '}
          <Link to="/admin/session" className="font-bold underline underline-offset-4">
            إدارة الجلسة
          </Link>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="الشركات المفعّلة" value={`${stats?.active_startups ?? 0} / ${stats?.total_startups ?? 0}`} />
        <StatTile label="مرشدو الجلسة المفعّلون" value={stats?.session_mentors ?? 0} hint={`من ${stats?.total_mentors ?? 0} ملف مرشد`} />
        <StatTile label="الحجوزات المؤكدة" value={stats?.confirmed_bookings ?? 0} tone="maroon" />
        <StatTile label="الحجوزات الملغاة" value={stats?.cancelled_bookings ?? 0} tone="muted" />
        <StatTile label="إجمالي المواعيد" value={stats?.total_slots ?? 0} />
        <StatTile label="مواعيد متاحة" value={stats?.available_slots ?? 0} tone="sky" />
        <StatTile label="مواعيد محجوزة" value={stats?.booked_slots ?? 0} tone="maroon" />
        <StatTile label="مواعيد مغلقة" value={stats?.closed_slots ?? 0} tone="muted" />
      </div>

      <Card className="mt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-base font-bold text-navy">نسبة الإشغال</h2>
          <p className="text-sm font-bold tabular-nums text-navy">{fillRate}%</p>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-canvas" role="img" aria-label={`نسبة الإشغال ${fillRate}%`}>
          <div className="h-full rounded-full bg-maroon transition-all" style={{ width: `${fillRate}%` }} />
        </div>
      </Card>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-navy">آخر العمليات</h2>
        {audit && audit.length > 0 ? (
          <Card padded={false} className="overflow-hidden">
            <ul className="divide-y divide-line">
              {audit.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-canvas px-2.5 py-0.5 text-[0.68rem] font-bold text-muted">
                      {e.actor === 'admin' ? 'مشرف' : e.actor === 'startup' ? 'شركة' : 'النظام'}
                    </span>
                    <span className="text-sm font-medium text-navy">
                      {ACTION_LABELS[e.action] ?? e.action}
                    </span>
                  </div>
                  <time className="ltr-embed text-xs tabular-nums text-muted">
                    {new Date(e.created_at).toLocaleString('en-GB', { hour12: false })}
                  </time>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <EmptyState title="لا توجد عمليات مسجّلة بعد" />
        )}
      </section>
    </>
  )
}
