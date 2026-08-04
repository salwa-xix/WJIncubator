import { NavLink, Outlet } from 'react-router-dom'
import { Logo } from '@/components/brand/Logo'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAdminAuth } from '@/features/auth/AdminAuthProvider'
import { cn } from '@/lib/cn'

const NAV = [
  { to: '/admin', label: 'نظرة عامة', end: true },
  { to: '/admin/session', label: 'الجلسة' },
  { to: '/admin/mentors', label: 'المرشدون' },
  { to: '/admin/slots', label: 'المواعيد' },
  { to: '/admin/bookings', label: 'الحجوزات' },
  { to: '/admin/startups', label: 'الشركات' },
]

export function AdminLayout() {
  const { email, signOut } = useAdminAuth()

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-4">
            <Logo />
            <Badge tone="navy">لوحة المشرف</Badge>
          </div>
          <div className="flex items-center gap-3">
            {email && <span className="ltr-embed hidden text-sm text-muted sm:inline">{email}</span>}
            <Button variant="secondary" size="sm" onClick={() => void signOut()}>
              خروج
            </Button>
          </div>
        </div>

        {/* Horizontally scrollable on narrow screens so the nav never wraps
            into a second row or pushes the page wider than the viewport. */}
        <nav className="mx-auto w-full max-w-7xl overflow-x-auto px-5 sm:px-8">
          <ul className="flex min-w-max gap-1 pb-px">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'block whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors',
                      isActive
                        ? 'border-maroon text-maroon'
                        : 'border-transparent text-muted hover:text-navy',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <Outlet />
      </main>
    </div>
  )
}
