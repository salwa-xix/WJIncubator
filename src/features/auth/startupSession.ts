import type { StartupSummary } from '@/lib/api'

/**
 * Startup session persistence.
 *
 * The token is an opaque server-issued string; it carries no claims and cannot
 * be forged or inspected for privileges. Storing it client-side is therefore
 * a convenience, not a trust boundary — every request re-validates it against
 * the database, so a tampered value simply fails.
 */

const KEY = 'wj-startup-session'

export type StoredSession = {
  token: string
  expiresAt: string
  startup: StartupSummary
}

export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredSession
    if (!parsed?.token || !parsed?.startup?.id) return null
    // Drop an obviously stale token before spending a round trip on it.
    if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveSession(session: StoredSession): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    // Private browsing with storage disabled: the session simply won't
    // survive a reload. Not worth failing the login over.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* nothing meaningful to do */
  }
}
