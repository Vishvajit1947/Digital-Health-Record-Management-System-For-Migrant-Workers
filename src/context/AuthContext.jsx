import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { assertSupabaseConfigured } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser]       = useState(null)
  const [role, setRole]       = useState(null)
  // loading=true until we know whether the user is logged in or not
  const [loading, setLoading] = useState(true)

  // Prevent a second loadProfile call if session object reference changes
  // but the user id hasn't changed (e.g. TOKEN_REFRESHED).
  const lastProfileUid = useRef(null)

  // ── Effect 1: subscribe to auth state changes (SYNCHRONOUS callback only) ──
  // Never do async work inside onAuthStateChange — it holds the Supabase auth
  // lock and causes "Lock not released within 5000ms" warnings.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession)
        if (!newSession) {
          // Signed out — clear state immediately
          lastProfileUid.current = null
          setUser(null)
          setRole(null)
          setLoading(false)
        }
        // If newSession exists, Effect 2 picks it up and loads the profile
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ── Effect 2: load user profile from DB whenever session user changes ──
  // Runs outside the auth lock — safe to be async.
  useEffect(() => {
    if (!session?.user) return

    // Skip if we already loaded the profile for this exact user id
    // (avoids re-fetching on TOKEN_REFRESHED which keeps the same uid)
    if (lastProfileUid.current === session.user.id) return

    lastProfileUid.current = session.user.id
    let cancelled = false

    async function loadProfile() {
      const authUser = session.user
      const metadataRole =
        authUser?.user_metadata?.role || authUser?.app_metadata?.role || null

      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, role, full_name, phone, preferred_language')
          .eq('id', authUser.id)
          .maybeSingle()

        if (cancelled) return
        if (error) console.error('loadProfile error:', error.message)

        if (data) {
          setUser(data)
          setRole(data.role || metadataRole || 'worker')
        } else {
          // No profile row yet — use auth metadata
          const fallback = metadataRole || 'worker'
          setRole(fallback)
          setUser({
            id: authUser.id,
            role: fallback,
            full_name: authUser.email || 'User',
            email: authUser.email,
          })
        }
      } catch {
        if (cancelled) return
        const demoRole = localStorage.getItem('demo_role')
        const fallback = demoRole || metadataRole || 'worker'
        setRole(fallback)
        setUser({
          id: authUser.id,
          role: fallback,
          full_name: demoRole ? 'Demo User' : (authUser.email || 'User'),
          email: authUser.email,
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProfile()
    return () => { cancelled = true }
  }, [session])

  async function signIn(email, password) {
    assertSupabaseConfigured()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut(onComplete) {
    lastProfileUid.current = null
    await supabase.auth.signOut()
    localStorage.removeItem('demo_role')
    localStorage.removeItem('admin_portal_access')
    setUser(null)
    setRole(null)
    setSession(null)
    if (typeof onComplete === 'function') onComplete()
  }

  function demoLogin(demoRole) {
    // Demo mode: set a synthetic session so guards treat the user as logged in
    lastProfileUid.current = 'demo'
    localStorage.setItem('demo_role', demoRole)
    setRole(demoRole)
    setUser({ id: 'demo', role: demoRole, full_name: 'Demo User', email: 'demo@healthid.app' })
    setSession({ user: { id: 'demo' } })
    setLoading(false)
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
