import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { assertSupabaseConfigured } from '../lib/supabaseClient'

const AuthContext = createContext(null)

// If auth hasn't resolved within this time, force loading=false so the UI
// never shows an infinite spinner (e.g. network timeout, Supabase unreachable).
const AUTH_TIMEOUT_MS = 5000

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser]       = useState(null)
  const [role, setRole]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Tracks the last uid we fetched a profile for.
  // Prevents re-fetching on TOKEN_REFRESHED (same uid, new token).
  const lastProfileUid = useRef(null)

  // ── Fail-safe timeout ─────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(prev => {
        if (prev) console.warn('AuthContext: timed out waiting for auth — forcing loading=false')
        return false
      })
    }, AUTH_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [])

  // ── Effect 1: auth state listener (must be synchronous) ───────────────────
  // Async work inside onAuthStateChange holds the Supabase auth lock →
  // "Lock not released within 5000ms". Keep this callback synchronous only.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession)
        if (!newSession) {
          lastProfileUid.current = null
          setUser(null)
          setRole(null)
          setLoading(false)
        }
        // newSession present → Effect 2 handles the async profile fetch
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ── Effect 2: async profile fetch (outside the auth lock) ─────────────────
  useEffect(() => {
    if (!session?.user) return
    // Only skip re-fetch if uid matches AND role is already set.
    // If role is null (e.g. component remounted), always re-fetch.
    if (lastProfileUid.current === session.user.id && role !== null) return

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
          const fallback = metadataRole || 'worker'
          setRole(fallback)
          setUser({ id: authUser.id, role: fallback, full_name: authUser.email || 'User', email: authUser.email })
        }
      } catch {
        if (cancelled) return
        const demoRole = localStorage.getItem('demo_role')
        const fallback = demoRole || metadataRole || 'worker'
        setRole(fallback)
        setUser({ id: authUser.id, role: fallback, full_name: demoRole ? 'Demo User' : (authUser.email || 'User'), email: authUser.email })
      } finally {
        // Always call setLoading(false) — even when cancelled.
        // Skipping it when cancelled=true leaves loading=true forever on remount.
        setLoading(false)
      }
    }

    loadProfile()
    return () => { cancelled = true }
  }, [session, role]) // role in deps so effect re-runs if role is null after remount

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
