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

    // onAuthStateChange is the single source of truth.
    // It fires INITIAL_SESSION on mount, then SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED.
    // No separate getSession() call needed — that would create a second concurrent lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!active) return

        setSession(newSession)

        if (newSession?.user) {
          await fetchUserProfile(newSession.user, active)
        } else {
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
      // maybeSingle() returns null instead of throwing when no row found
      const { data, error } = await withTimeout(
        supabase.from('users').select('*').eq('id', authUser.id).maybeSingle(),
        PROFILE_REQUEST_TIMEOUT_MS,
        'Timed out loading profile.',
      )

      if (!active) return

      if (error) {
        console.error('fetchUserProfile error:', error.message)
      }

      if (data) {
        setUser(data)
        setRole(data.role || metadataRole || 'worker')
      } else {
        // No profile row yet — use metadata or default
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
      if (!active) return
      // DB unreachable — fall back to demo role or metadata
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
    // No withTimeout wrapper — signInWithPassword holds the auth lock internally.
    // A timeout rejection would abandon the lock mid-flight → "lock stolen" error.
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
