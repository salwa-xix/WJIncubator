import { Logo } from '@/components/brand/Logo'
import { LeafMosaic, LeafPattern } from '@/components/brand/LeafPattern'

/**
 * The approved login composition: content panel leading, navy brand panel
 * trailing. In RTL the first DOM child renders on the right, which puts the
 * form where the prototype has it and the navy panel on the left — mirrored
 * correctly without a single physical-direction property.
 *
 * On small screens the brand panel collapses to a compact header so the form
 * stays above the fold.
 */
export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1fr_42%]">
      {/* Mobile-only brand bar */}
      <header className="relative overflow-hidden bg-navy px-6 py-7 lg:hidden">
        <LeafPattern rows={2} cols={6} className="absolute -top-4 start-0 w-[120%] text-white/[0.07]" />
        <div className="relative">
          <Logo tone="light" />
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex items-center justify-center px-5 py-10 sm:px-10 lg:py-16">
        <div className="w-full max-w-[30rem]">{children}</div>
      </main>

      <aside className="relative hidden overflow-hidden bg-navy lg:flex lg:flex-col lg:justify-between lg:p-12">
        <LeafPattern rows={6} cols={7} className="absolute -start-10 -top-16 w-[135%] text-white/[0.06]" />
        <div className="relative">
          <Logo tone="light" />
        </div>
        <div className="relative">
          <LeafMosaic count={12} className="max-w-[16rem]" />
          <p className="mt-8 max-w-xs text-sm leading-relaxed text-white/55">
            نخبة من روّاد الأعمال والخبراء ترافق الفرق خلال أيام المعسكر.
          </p>
        </div>
      </aside>
    </div>
  )
}
