import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { startupLogout, startupSessionInfo, type StartupSummary } from '@/lib/api'
import { clearSession, loadSession, saveSession, type StoredSession } from './startupSession'

type Status = 'checking' | 'authenticated' | 'anonymous'

type StartupAuthValue = {
  status: Status
  startup: StartupSummary | null
  token: string | null
  signIn: (session: StoredSession) => void
  signOut: () => Promise<void>
  /** Called when an RPC reports the session is dead mid-flight. */
  invalidate: () => void
}

const StartupAuthContext = createContext<StartupAuthValue | null>(null)

export function StartupAuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('checking')
  const [session, setSession] = useState<StoredSession | null>(null)

  // Revalidate the stored token against the database on mount. Trusting
  // localStorage alone would keep a revoked or expired session looking live.
  useEffect(() => {
    let cancelled = false
    const stored = loadSession()
    if (!stored) {
      setStatus('anonymous')
      return
    }
    void startupSessionInfo(stored.token).then((res) => {
      if (cancelled) return
      if (res.ok) {
        const refreshed = { ...stored, startup: res.startup }
        saveSession(refreshed)
        setSession(refreshed)
        setStatus('authenticated')
      } else {
        clearSession()
        setSession(null)
        setStatus('anonymous')
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback((next: StoredSession) => {
    saveSession(next)
    setSession(next)
    setStatus('authenticated')
  }, [])

  const invalidate = useCallback(() => {
    clearSession()
    setSession(null)
    setStatus('anonymous')
  }, [])

  const signOut = useCallback(async () => {
    const token = session?.token
    // Clear locally first so the UI never appears stuck behind a slow network.
    invalidate()
    if (token) await startupLogout(token)
  }, [session?.token, invalidate])

  const value = useMemo<StartupAuthValue>(
    () => ({
      status,
      startup: session?.startup ?? null,
      token: session?.token ?? null,
      signIn,
      signOut,
      invalidate,
    }),
    [status, session, signIn, signOut, invalidate],
  )

  return <StartupAuthContext.Provider value={value}>{children}</StartupAuthContext.Provider>
}

export function useStartupAuth(): StartupAuthValue {
  const ctx = useContext(StartupAuthContext)
  if (!ctx) throw new Error('useStartupAuth must be used inside StartupAuthProvider')
  return ctx
}
