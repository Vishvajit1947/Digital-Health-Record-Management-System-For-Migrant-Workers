import { createContext, useContext, useEffect, useRef, useState } from 'react'
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

  // Tracks whether a fetchUserRole call is already in-flight.
  // Prevents concurrent DB lookups when onAuthStateChange fires rapidly.
  const fetchingRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    let active = true

    // onAuthStateChange is the single source of truth for session state.
    // It fires INITIAL_SESSION on mount (replaces the need for getSession()),
    // then fires SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED etc. as they happen.
    // Using ONLY this listener eliminates the duplicate-call race condition.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!active) return

        setSession(newSession)

        if (newSession?.user) {
          await fetchUserRole(newSession.user, active)
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

  async function fetchUserRole(authUser, active = true) {
    // Deduplicate: if a fetch is already running, skip this one.
    if (fetchingRef.current) return
    fetchingRef.current = true

    const metadataRole =
      authUser?.user_metadata?.role || authUser?.app_metadata?.role || null

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
        setUser({
          id: authUser.id,
          role: metadataRole || 'worker',
          full_name: authUser.email || 'User',
        })
      }
    } catch {
      if (!active) return
      const demoRole = localStorage.getItem('demo_role')
      const fallback = demoRole || metadataRole || 'worker'
      setRole(fallback)
      setUser({
        id: authUser.id,
        role: fallback,
        full_name: demoRole ? 'Demo User' : (authUser.email || 'User'),
      })
    } finally {
      fetchingRef.current = false
      if (active) setLoading(false)
    }
  }

  async function signIn(email, password) {
    assertSupabaseConfigured()
    // Do NOT wrap signInWithPassword in withTimeout — it holds the auth lock
    // and a timeout rejection leaves the lock held, causing "lock stolen" errors.
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
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
