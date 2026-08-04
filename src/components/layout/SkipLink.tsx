/**
 * Skip-to-content link.
 *
 * Visually hidden until focused, then rendered normally. Without it a keyboard
 * user has to tab through the entire header and nav on every page before
 * reaching the mentor grid or a data table — on the admin slot grid that is
 * dozens of stops.
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:z-[100] focus:rounded-chip focus:bg-maroon focus:px-5 focus:py-3 focus:font-bold focus:text-white focus:shadow-modal focus:start-3"
    >
      تخطَّ إلى المحتوى
    </a>
  )
}
