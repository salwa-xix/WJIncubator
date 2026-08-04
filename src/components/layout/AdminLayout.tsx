import { NavLink, Outlet } from 'react-router-dom'
import { Logo } from '@/components/brand/Logo'
import { BandPattern } from '@/components/brand/BandPattern'
import { Chip } from '@/components/ui/Chip'
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

/**
 * The admin shell, rebuilt to the reference (wadiii3.pdf).
 *
 * Two pieces the previous version did not have:
 *
 *  1. A navy header band — the reference puts the whole identity block on navy
 *     with the leaf pattern behind it, not on white. The lockup, the maroon
 *     "لوحة المشرف" badge, the email and the sign-out control all sit there.
 *  2. A sand nav rail floating below the band, with the active item as a solid
 *     navy pill. The old nav was an underline tab strip, which is a different
 *     idiom entirely.
 */
export function AdminLayout() {
  const { email, signOut } = useAdminAuth()

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="relative overflow-hidden bg-navy-deep">
        <BandPattern />
        <div className="relative mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-4">
            <Logo tone="light" />
            <Chip tone="solid" className="px-3 py-1.5 text-[0.7rem]">
              لوحة المشرف
            </Chip>
          </div>

          <div className="flex items-center gap-3">
            {email && (
              // The reference frames the email as a pill with a person glyph
              // rather than bare text, which is what balances the sign-out
              // control beside it.
              <span className="hidden items-center gap-2 rounded-full border border-white/25 bg-white/[0.07] px-4 py-2 sm:inline-flex">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  className="size-4 text-white/70"
                >
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
                </svg>
                <span className="ltr-embed text-sm text-white/85">{email}</span>
              </span>
            )}
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
        </div>
      </header>

      {/* The nav rail. Scrolls horizontally on narrow screens so it never wraps
          to a second row or pushes the page wider than the viewport. */}
      <div className="mx-auto w-full max-w-7xl px-5 pt-5 sm:px-8">
        <nav className="overflow-x-auto">
          <ul className="flex min-w-max gap-1 rounded-panel bg-sand p-1.5">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'block whitespace-nowrap rounded-field px-5 py-2.5 text-sm font-bold transition-colors duration-200 ease-enterprise',
                      isActive
                        ? 'bg-navy text-white shadow-sm'
                        : 'text-muted hover:bg-white/70 hover:text-navy',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <Outlet />
      </main>
    </div>
  )
}
