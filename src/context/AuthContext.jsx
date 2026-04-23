import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { assertSupabaseConfigured } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  // Keep a ref to the latest session so the profile fetch effect can read it
  const sessionRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    // onAuthStateChange MUST be synchronous — no async work inside the callback.
    // Doing async work (DB queries) inside the listener holds the Supabase auth lock
    // and causes "Lock not released within 5000ms" warnings.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      sessionRef.current = newSession
      setSession(newSession)

      if (!newSession) {
        setUser(null)
        setRole(null)
        setLoading(false)
      }
      // If newSession exists, the useEffect below will pick it up and fetch the profile
    })

    return () => subscription.unsubscribe()
  }, [])

  // Separate effect handles the async DB work — runs whenever session changes.
  // This keeps the onAuthStateChange callback synchronous (no lock contention).
  useEffect(() => {
    if (!session?.user) return

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
          const fallbackRole = metadataRole || 'worker'
          setRole(fallbackRole)
          setUser({
            id: authUser.id,
            role: fallbackRole,
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
    await supabase.auth.signOut()
    localStorage.removeItem('demo_role')
    localStorage.removeItem('admin_portal_access')
    setUser(null)
    setRole(null)
    setSession(null)
    if (typeof onComplete === 'function') onComplete()
  }

  function demoLogin(demoRole) {
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
