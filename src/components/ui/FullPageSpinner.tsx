export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas">
      <span
        aria-hidden="true"
        className="size-9 animate-spin rounded-full border-[3px] border-navy/15 border-t-maroon"
      />
      <p role="status" className="text-sm font-medium text-muted">
        {label ?? 'جارٍ التحميل…'}
      </p>
    </div>
  )
}
