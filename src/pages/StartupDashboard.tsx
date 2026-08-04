import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FullPageSpinner } from '@/components/ui/FullPageSpinner'
import { Alert } from '@/components/ui/Alert'
import { LeafPattern } from '@/components/brand/LeafPattern'
import { QuotaMeter } from '@/features/booking/QuotaMeter'
import { MentorCard } from '@/features/booking/MentorCard'
import { MyBookings } from '@/features/booking/MyBookings'
import { ConfirmBookingModal } from '@/features/booking/ConfirmBookingModal'
import { useStartupAuth } from '@/features/auth/StartupAuthProvider'
import { bookSlot, getStartupDashboard, type DashboardMentor, type DashboardSlot } from '@/lib/api'
import { SESSION_DEAD_CODES, messageFor } from '@/lib/errors'

export default function StartupDashboard() {
  useDocumentTitle('لوحة الحجز')
  const { startup, token, signOut, invalidate } = useStartupAuth()
  const queryClient = useQueryClient()

  const [target, setTarget] = useState<{ mentor: DashboardMentor; slot: DashboardSlot } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', token],
    queryFn: async () => {
      const res = await getStartupDashboard(token!)
      if (!res.ok) {
        // A revoked or expired token surfaces here first; drop the session
        // rather than leaving the user on a dashboard that cannot load.
        if (SESSION_DEAD_CODES.has(res.code)) invalidate()
        throw new Error(res.code)
      }
      return res
    },
    enabled: Boolean(token),
    // Slot availability changes under us during the event. Booking safety
    // never depends on this — the database is the authority — but a stale
    // grid wastes the user's clicks.
    refetchInterval: 15_000,
  })

  const quota = data?.quota ?? null
  const quotaExhausted = quota ? quota.remaining <= 0 : false

  const totals = useMemo(() => {
    const slots = data?.mentors.flatMap((m) => m.slots) ?? []
    return {
      mentors: data?.mentors.length ?? 0,
      open: slots.filter((s) => s.state === 'available').length,
      any: slots.length,
    }
  }, [data])

  async function confirmBooking() {
    if (!target || !token) return
    setSubmitting(true)
    setModalError(null)

    const res = await bookSlot(token, target.slot.id)
    setSubmitting(false)

    if (!res.ok) {
      if (SESSION_DEAD_CODES.has(res.code)) {
        invalidate()
        return
      }
      // Keep the modal open so the reason sits next to what was attempted,
      // but refresh underneath: SLOT_TAKEN means the grid is already stale.
      setModalError(messageFor(res.code))
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      return
    }

    toast.success(`تم تأكيد الحجز مع ${target.mentor.name_ar} الساعة ${target.slot.start_time}`)
    setTarget(null)
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  if (isLoading) return <FullPageSpinner label="جارٍ تحميل لوحة الحجز…" />

  return (
    <div className="min-h-dvh">
      <header className="relative overflow-hidden bg-navy">
        <LeafPattern rows={3} cols={10} className="absolute -top-10 start-0 w-[120%] text-white/[0.06]" />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {startup?.logo_url ? (
                <img
                  src={startup.logo_url}
                  alt=""
                  className="size-12 rounded-xl bg-white object-contain p-1.5"
                />
              ) : (
                <div className="grid size-12 place-items-center rounded-xl bg-white/10 text-lg font-bold text-white/70">
                  {startup?.name_ar?.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-white">{startup?.name_ar}</h1>
                {startup?.name_en && (
                  <p className="ltr-embed text-sm text-white/55">{startup.name_en}</p>
                )}
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => void signOut()}>
              خروج
            </Button>
          </div>

          {quota && (
            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-5">
              <QuotaMeter {...quota} />
              {data?.session?.session_date && (
                <p className="ltr-embed text-sm text-white/55">{data.session.session_date}</p>
              )}
            </div>
          )}
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        {isError && (
          <Alert tone="error" className="mb-8">
            تعذّر تحميل البيانات. الرجاء تحديث الصفحة.
          </Alert>
        )}

        {/* No open session: a real state the admin controls, not a failure. */}
        {data && !data.session ? (
          <EmptyState
            title="لا توجد جلسة حجز مفتوحة حاليًا"
            description="سيتم فتح باب الحجز من قِبل فريق المنظمين. الرجاء المحاولة لاحقًا."
          />
        ) : (
          <>
            <section className="mb-12">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-xl font-bold text-navy">حجوزاتي</h2>
                {quota && (
                  <p className="text-sm text-muted">
                    <span className="tabular-nums font-semibold text-navy">{quota.used}</span> من{' '}
                    <span className="tabular-nums">{quota.limit}</span> جلسات
                  </p>
                )}
              </div>
              <MyBookings bookings={data?.bookings ?? []} />
            </section>

            <section>
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-xl font-bold text-navy">المرشدون</h2>
                {totals.mentors > 0 && (
                  <p className="text-sm text-muted">
                    <span className="tabular-nums">{totals.mentors}</span> مرشدًا ·{' '}
                    <span className="tabular-nums">{totals.open}</span> موعدًا متاحًا
                  </p>
                )}
              </div>

              {quotaExhausted && (
                <Alert tone="info" className="mb-5">
                  لقد استخدمت جميع حجوزاتك ({quota?.limit}). لتعديل أي حجز، تواصل مع إدارة المعسكر.
                </Alert>
              )}

              {totals.mentors === 0 ? (
                <EmptyState
                  title="لم يُضَف مرشدون لهذه الجلسة بعد"
                  description="سيقوم فريق المنظمين بإسناد المرشدين وتفعيلهم قبل بدء الحجز."
                />
              ) : totals.any === 0 ? (
                <EmptyState
                  title="لم تُنشأ المواعيد بعد"
                  description="تم إسناد المرشدين، وسيتم إنشاء مواعيد الجلسات قريبًا."
                />
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  {data?.mentors.map((mentor) => (
                    <MentorCard
                      key={mentor.id}
                      mentor={mentor}
                      quotaExhausted={quotaExhausted}
                      onSelectSlot={(m, s) => {
                        setModalError(null)
                        setTarget({ mentor: m, slot: s })
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-center">
          <Badge tone="sky">متاح</Badge>
          <Badge tone="maroon">حجزك</Badge>
          <Badge tone="neutral">محجوز</Badge>
          <Badge tone="neutral">مغلق</Badge>
        </div>
      </main>

      <ConfirmBookingModal
        target={target}
        submitting={submitting}
        error={modalError}
        onConfirm={() => void confirmBooking()}
        onClose={() => {
          setTarget(null)
          setModalError(null)
        }}
      />
    </div>
  )
}
