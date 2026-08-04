import { Logo } from '@/components/brand/Logo'
import { BandPattern } from '@/components/brand/BandPattern'
import { HadhinaMark } from '@/components/brand/HadhinaMark'

/**
 * The sign-in composition, rebuilt to the reference (wadi-pak.pdf).
 *
 * Structure there: a navy panel on the left carrying the Wadi Jeddah lockup at
 * the top, the الحاضنة mark on a large white card in the middle, and the
 * innovation-hub headline at the bottom; the form sits on a near-white canvas to
 * the right.
 *
 * Direction comes entirely from document order. The form is the first DOM child,
 * so in Arabic (RTL) it renders on the right and the panel on the left — which is
 * the reference arrangement — and the whole thing mirrors in English without a
 * single physical-direction property. Every offset is `start-*`/`end-*`.
 *
 * The panel is 42% at `lg`, matching the reference proportion.
 */
export function AuthSplitLayout({
  children,
  panelTitle = 'مِنصّة الإرشاد في حاضنة وادي جدة',
  panelBody = 'نخبة من روّاد الأعمال والخبراء ترافق الفرق خلال أيام المعسكر.',
}: {
  children: React.ReactNode
  panelTitle?: string
  panelBody?: string
}) {
  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[1fr_42%]">
      {/* Mobile-only brand bar. The full panel is far too tall for a phone, so
          the small screen gets the band treatment: same navy, same pattern. */}
      <header className="relative overflow-hidden bg-navy-deep px-6 py-8 lg:hidden">
        <BandPattern />
        <div className="relative">
          <Logo tone="light" />
        </div>
      </header>

      {/* ---------------------------------------------------------------- form */}
      <main
        id="main"
        tabIndex={-1}
        className="relative flex items-center justify-center overflow-hidden px-5 py-12 sm:px-10 lg:px-16 lg:py-20"
      >
        <div className="relative z-10 w-full max-w-[26rem]">{children}</div>

        {/* The thin maroon arcs the reference sweeps across the lower canvas.
            Hairline strokes at low opacity — the only decoration on this half. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 600 400"
          fill="none"
          preserveAspectRatio="xMidYMax slice"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] w-full text-maroon/20"
        >
          <path d="M-40 400C120 300 300 250 660 236" stroke="currentColor" strokeWidth="1.5" />
          <path d="M-40 470C140 350 340 292 660 286" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </main>

      {/* --------------------------------------------------------------- brand */}
      <aside className="relative hidden overflow-hidden bg-navy-deep lg:block">
        {/* Layer 1 — the sweeping leaf outlines. Layer 2 — a warm bloom in the
            lower corner, which is what stops the panel reading as flat navy. */}
        <BandPattern />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(120%_100%_at_30%_100%,rgba(141,31,44,0.16),transparent_60%)]"
        />

        <div className="relative flex h-dvh flex-col justify-between p-12 xl:p-14">
          <Logo tone="light" layout="stacked" className="mx-auto max-w-[16rem]" />

          {/* The الحاضنة mark on its white card — the panel's focal element. */}
          <div className="mx-auto w-full max-w-[15rem] rounded-panel bg-white p-8 shadow-hero">
            <HadhinaMark className="w-full" />
          </div>

          <div className="text-center">
            <p className="text-eyebrow font-bold uppercase text-sky/80">
              Wadi Jeddah Innovation Hub
            </p>
            <h2 className="mt-4 text-[1.6rem] font-bold leading-[1.5] text-white">{panelTitle}</h2>
            <p className="mt-3.5 text-sm leading-relaxed text-white/55">{panelBody}</p>
          </div>
        </div>
      </aside>
    </div>
  )
}
