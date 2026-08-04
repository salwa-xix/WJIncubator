import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useStartupAuth } from './StartupAuthProvider'
import { useAdminAuth } from './AdminAuthProvider'
import { FullPageSpinner } from '@/components/ui/FullPageSpinner'

/**
 * Route guards.
 *
 * `checking` renders a spinner rather than redirecting, so a reload with a
 * valid session never flashes the login screen before settling. These guards
 * are a navigation convenience only — the database re-checks identity on every
 * call, so bypassing them client-side yields nothing.
 */

export function RequireStartup() {
  const { status } = useStartupAuth()
  const location = useLocation()

  if (status === 'checking') return <FullPageSpinner label="جارٍ التحقق من الجلسة…" />
  if (status === 'anonymous') return <Navigate to="/" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function RequireAdmin() {
  const { status } = useAdminAuth()
  const location = useLocation()

  if (status === 'checking') return <FullPageSpinner label="جارٍ التحقق من الصلاحيات…" />
  if (status !== 'admin')
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

/** Sends an already-signed-in user straight to their dashboard. */
export function RedirectIfStartup({ children }: { children: React.ReactNode }) {
  const { status } = useStartupAuth()
  if (status === 'checking') return <FullPageSpinner label="جارٍ التحقق…" />
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export function RedirectIfAdmin({ children }: { children: React.ReactNode }) {
  const { status } = useAdminAuth()
  if (status === 'checking') return <FullPageSpinner label="جارٍ التحقق…" />
  if (status === 'admin') return <Navigate to="/admin" replace />
  return <>{children}</>
}
