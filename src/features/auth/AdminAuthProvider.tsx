import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'
import { isSupabaseConfigured } from '@/lib/env'
import { isAdmin as checkIsAdmin } from '@/lib/api'

type Status = 'checking' | 'admin' | 'anonymous'

type AdminAuthValue = {
  status: Status
  email: string | null
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null)

/**
 * Admins are real Supabase Auth users, but authentication alone is not
 * authorisation: the account must ALSO be listed in admin_users. Both are
 * checked here, and the database enforces the same thing again on every admin
 * RPC — so a signed-in non-admin gets nothing even if they reach the routes.
 */
export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('checking')
  const [email, setEmail] = useState<string | null>(null)

  const evaluate = useCallback(async (session: Session | null) => {
    if (!session) {
      setStatus('anonymous')
      setEmail(null)
      return
    }
    const admin = await checkIsAdmin()
    setEmail(session.user.email ?? null)
    setStatus(admin ? 'admin' : 'anonymous')
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus('anonymous')
      return
    }
    let cancelled = false
    const supabase = getSupabase()

    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) void evaluate(data.session)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) void evaluate(session)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [evaluate])

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) return
    const { data } = await getSupabase().auth.getSession()
    await evaluate(data.session)
  }, [evaluate])

  const signOut = useCallback(async () => {
    setStatus('anonymous')
    setEmail(null)
    if (isSupabaseConfigured) await getSupabase().auth.signOut()
  }, [])

  const value = useMemo<AdminAuthValue>(
    () => ({ status, email, signOut, refresh }),
    [status, email, signOut, refresh],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider')
  return ctx
}
