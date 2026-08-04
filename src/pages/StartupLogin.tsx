import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { InputField, SelectField } from '@/components/ui/Field'
import { listStartups, startupLogin } from '@/lib/api'
import { messageFor } from '@/lib/errors'
import { useStartupAuth } from '@/features/auth/StartupAuthProvider'
import { isSupabaseConfigured } from '@/lib/env'

export default function StartupLogin() {
  useDocumentTitle('تسجيل الدخول')
  const navigate = useNavigate()
  const { signIn } = useStartupAuth()

  const [startupId, setStartupId] = useState('')
  const [code, setCode] = useState('')
  const [shown, setShown] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { data: startups = [], isLoading } = useQuery({
    queryKey: ['startups'],
    queryFn: listStartups,
    staleTime: 5 * 60_000,
  })

  // Errors are cleared by the change handlers below, NOT by an effect on
  // [startupId, code]. An effect would also fire when the code is reset
  // programmatically after a failure, wiping the very message that reset it.
  function onStartupChange(value: string) {
    setStartupId(value)
    setError(null)
  }

  function onCodeChange(value: string) {
    setCode(value.replace(/\D/g, '').slice(0, 4))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startupId) return setError('الرجاء اختيار الشركة الناشئة.')
    if (!/^\d{4}$/.test(code)) return setError(messageFor('BAD_FORMAT'))

    setSubmitting(true)
    const res = await startupLogin(startupId, code)
    setSubmitting(false)

    if (!res.ok) {
      setError(messageFor(res.code))
      return
    }
    signIn({ token: res.token, expiresAt: res.expires_at, startup: res.startup })
    navigate('/dashboard', { replace: true })
  }

  return (
    <AuthSplitLayout>
      <div className="mb-8 text-center lg:text-start">
        <h1 className="text-4xl font-bold text-navy">مرحبًا بك</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          اختر شركتك الناشئة وأدخل الرمز السري المخصص لك للمتابعة.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-card border border-line/70 bg-white p-6 shadow-card sm:p-7"
      >
        <div className="space-y-5">
          {!isSupabaseConfigured && (
            <Alert tone="warning" title="لم يتم ربط قاعدة البيانات">
              أضف بيانات Supabase في ملف <span className="ltr-embed font-mono">.env</span> لتفعيل
              تسجيل الدخول.
            </Alert>
          )}

          <SelectField
            label="اختر شركتك الناشئة"
            value={startupId}
            onChange={(e) => onStartupChange(e.target.value)}
            disabled={isLoading || !isSupabaseConfigured}
            invalid={Boolean(error) && !startupId}
            autoComplete="organization"
          >
            <option value="">{isLoading ? 'جارٍ التحميل…' : 'اختر الشركة'}</option>
            {startups.map((s) => (
              <option key={s.id} value={s.id} disabled={!s.is_active}>
                {s.name_ar}
                {s.name_en ? ` — ${s.name_en}` : ''}
                {s.is_active ? '' : ' (غير مفعّلة)'}
              </option>
            ))}
          </SelectField>

          <InputField
            label="الرمز السري"
            placeholder="••••"
            // `text` rather than `number`: a 4-digit code is a string, and a
            // number input would silently drop the leading zero in "0042".
            type={shown ? 'text' : 'password'}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            disabled={!isSupabaseConfigured}
            invalid={Boolean(error)}
            reveal={{ shown, onToggle: () => setShown((v) => !v) }}
          />

          {error && <Alert tone="error">{error}</Alert>}

          <Button
            type="submit"
            size="lg"
            block
            loading={submitting}
            disabled={!isSupabaseConfigured}
            className="mt-1"
          >
            دخول
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5 rtl:rotate-180"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        للحصول على الرمز السري، الرجاء التواصل مع فريق المنظمين.
      </p>
    </AuthSplitLayout>
  )
}
