import { useEffect } from 'react'

const BASE = 'WJIncubator — حجز الجلسات الإرشادية'

/**
 * Per-route document title.
 *
 * A single-page app keeps whatever title index.html shipped with unless
 * something changes it, which leaves every browser-history entry and every
 * open tab looking identical. Announcing the title also gives screen-reader
 * users the only signal that client-side navigation happened at all.
 */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${BASE}` : BASE
    return () => {
      document.title = BASE
    }
  }, [title])
}
