import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FullPageSpinner } from '@/components/ui/FullPageSpinner'
import { Alert } from '@/components/ui/Alert'
import { BandPattern } from '@/components/brand/BandPattern'
import { Avatar } from '@/components/ui/Avatar'
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
      <header className="relative overflow-hidden bg-navy-deep">
        <BandPattern />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="ltr-embed text-xs font-semibold text-white/55">
              WJIncubator · <span className="font-bold">منصّة الإرشاد</span>
            </p>
            <Button variant="onNavy" size="sm" onClick={() => void signOut()}>
              خروج
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 rtl:rotate-180"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
            <div className="flex items-center gap-4">
              {/* A rounded square, not a circle: the reference reserves circles
                  for people and squircles for organisations. */}
              <Avatar
                name={startup?.name_ar}
                src={startup?.logo_url}
                shape="squircle"
                tone="onNavy"
                size="lg"
              />
              <div>
                <h1 className="text-xl font-bold text-white">{startup?.name_ar}</h1>
                {startup?.name_en && (
                  <p className="ltr-embed mt-1 text-sm text-white/55">{startup.name_en}</p>
                )}
              </div>
            </div>

            {quota && (
              <QuotaMeter {...quota} date={data?.session?.session_date} />
            )}
          </div>
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
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-display-sm font-extrabold text-navy">حجوزاتي</h2>
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
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-display-sm font-extrabold text-navy">المرشدون</h2>
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
