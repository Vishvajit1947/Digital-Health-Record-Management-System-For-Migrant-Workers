import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { assertSupabaseConfigured, isSupabaseConfigured } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    let active = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!active) return

        setSession(newSession)

        if (newSession?.user) {
          await fetchUserProfile(newSession.user, active)
        } else {
          // No session — clear everything and stop loading
          setUser(null)
          setRole(null)
          setLoading(false)
        }
      }
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function fetchUserProfile(authUser, active = true) {
    const metadataRole =
      authUser?.user_metadata?.role || authUser?.app_metadata?.role || null

    try {
      // Direct query — no withTimeout wrapper.
      // withTimeout uses Promise.race() which abandons the Supabase request mid-flight,
      // leaving the auth lock held → "Lock broken by another request" AbortError.
      const { data, error } = await supabase
        .from('users')
        .select('id, role, full_name, phone, preferred_language')
        .eq('id', authUser.id)
        .maybeSingle()

      if (!active) return

      if (error) {
        // Log but don't crash — fall through to metadata fallback below
        console.error('fetchUserProfile DB error:', error.message)
      }

      if (data) {
        setUser(data)
        setRole(data.role || metadataRole || 'worker')
      } else {
        // No profile row yet (e.g. just registered) — use auth metadata
        const fallbackRole = metadataRole || 'worker'
        setRole(fallbackRole)
        setUser({
          id: authUser.id,
          role: fallbackRole,
          full_name: authUser.email || 'User',
          email: authUser.email,
        })
      }
    } catch (err) {
      if (!active) return
      // Only set a fallback if we have a real authenticated user.
      // Do NOT set role/user from a catch block when there's no session —
      // that would make NfcPatientGuard think the user is logged in.
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
      if (active) setLoading(false)
    }
  }

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
    setUser({
      id: 'demo',
      role: demoRole,
      full_name: 'Demo User',
      email: 'demo@healthid.app',
    })
    setSession({ user: { id: 'demo' } })
    setLoading(false)
  }

  return (
    <AuthContext.Provider
      value={{ session, user, role, loading, signIn, signOut, demoLogin }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
