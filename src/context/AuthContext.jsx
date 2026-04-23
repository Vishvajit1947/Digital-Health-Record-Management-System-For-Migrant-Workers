import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  assertSupabaseConfigured,
  isSupabaseConfigured,
  PROFILE_REQUEST_TIMEOUT_MS,
  withTimeout,
} from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    let active = true

    async function initAuth() {
      if (!isSupabaseConfigured) {
        if (active) { setSession(null); setUser(null); setRole(null); setLoading(false) }
        return
      }

      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          undefined,
          'Unable to verify session.',
        )
        if (!active) return

        if (error || !data?.session) {
          setSession(null); setUser(null); setRole(null); setLoading(false)
          return
        }

        setSession(data.session)
        await fetchUserRole(data.session.user, active)
      } catch {
        if (active) { setSession(null); setUser(null); setRole(null); setLoading(false) }
      }
    }

    initAuth()

    // Only subscribe to real auth events — INITIAL_SESSION is already handled by initAuth above.
    // Handling it twice causes loading to toggle true→false→true→false = blink.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!active) return
      if (event === 'INITIAL_SESSION') return // handled by initAuth

      setSession(newSession)
      if (newSession?.user) {
        await fetchUserRole(newSession.user, active)
      } else {
        setUser(null); setRole(null); setLoading(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function fetchUserRole(authUser, active = true) {
    const metadataRole = authUser?.user_metadata?.role || authUser?.app_metadata?.role || null

    // Keep loading=true for the entire duration of the DB lookup.
    // This prevents guards from rendering children with role=null.
    if (active) setLoading(true)

    try {
      const { data } = await withTimeout(
        supabase.from('users').select('*').eq('id', authUser.id).single(),
        PROFILE_REQUEST_TIMEOUT_MS,
        'Timed out loading profile.',
      )

      if (!active) return

      if (data) {
        setUser(data)
        setRole(data.role || metadataRole || 'worker')
      } else {
        setRole(metadataRole || 'worker')
        setUser({ id: authUser.id, role: metadataRole || 'worker', full_name: authUser.email || 'User' })
      }
    } catch {
      if (!active) return
      const demoRole = localStorage.getItem('demo_role')
      const fallback = demoRole || metadataRole || 'worker'
      setRole(fallback)
      setUser({ id: authUser.id, role: fallback, full_name: demoRole ? 'Demo User' : (authUser.email || 'User') })
    } finally {
      if (active) setLoading(false)
    }
  }

  async function signIn(email, password) {
    assertSupabaseConfigured()
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      undefined,
      'Login timed out. Please retry.',
    )
    if (error) throw error
    return data
  }

  async function signOut(onComplete) {
    await supabase.auth.signOut()
    localStorage.removeItem('demo_role')
    localStorage.removeItem('admin_portal_access')
    setUser(null); setRole(null); setSession(null)
    if (typeof onComplete === 'function') onComplete()
  }

  function demoLogin(demoRole) {
    localStorage.setItem('demo_role', demoRole)
    setRole(demoRole)
    setUser({ id: 'demo', role: demoRole, full_name: 'Demo User', email: 'demo@healthid.app' })
    setSession({ user: { id: 'demo' } })
  }

  return (
    <AuthContext.Provider value={{ session, user, role, loading, signIn, signOut, demoLogin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
