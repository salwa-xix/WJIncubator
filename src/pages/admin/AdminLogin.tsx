import { useDocumentTitle } from '@/lib/useDocumentTitle'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { InputField } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { messageFor } from '@/lib/errors'
import { getSupabase } from '@/lib/supabase'
import { isSupabaseConfigured } from '@/lib/env'
import { isAdmin } from '@/lib/api'
import { useAdminAuth } from '@/features/auth/AdminAuthProvider'

/**
 * Deliberately reachable only at /admin/login and never linked from the
 * startup side — the two audiences share no navigation, per the requirements.
 */
export default function AdminLogin() {
  useDocumentTitle('دخول المشرف')
  const navigate = useNavigate()
  const { refresh } = useAdminAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [shown, setShown] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return setError(messageFor('ADMIN_BAD_CREDENTIALS'))

    setSubmitting(true)
    try {
      const supabase = getSupabase()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(messageFor('ADMIN_BAD_CREDENTIALS'))
        return
      }

      // Authentication is not authorisation. A valid account that is not in
      // admin_users must not get in, so sign it straight back out rather than
      // leaving a half-privileged session lying around.
      if (!(await isAdmin())) {
        await supabase.auth.signOut()
        setError(messageFor('NOT_ADMIN'))
        return
      }

      await refresh()
      navigate('/admin', { replace: true })
    } catch {
      setError(messageFor('NETWORK'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthSplitLayout>
      <div className="mb-8 text-center lg:text-start">
        <Badge tone="navy" className="mb-4">
          لوحة المشرف
        </Badge>
        <h1 className="text-4xl font-bold text-navy">تسجيل دخول المشرف</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          هذه الصفحة مخصصة لفريق التنظيم فقط.
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

          <InputField
            label="البريد الإلكتروني"
            type="email"
            dir="ltr"
            placeholder="admin@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null) }}
            disabled={!isSupabaseConfigured}
            invalid={Boolean(error)}
          />

          <InputField
            label="كلمة المرور"
            type={shown ? 'text' : 'password'}
            dir="ltr"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null) }}
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
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        هل أنت شركة ناشئة؟{' '}
        <a href="/" className="font-semibold text-maroon underline-offset-4 hover:underline">
          انتقل إلى صفحة دخول الشركات
        </a>
      </p>
    </AuthSplitLayout>
  )
}
