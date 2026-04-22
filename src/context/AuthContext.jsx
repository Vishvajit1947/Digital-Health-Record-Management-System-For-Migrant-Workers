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
      setLoading(true)
      if (!isSupabaseConfigured) {
        if (!active) return
        setSession(null)
        setUser(null)
        setRole(null)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          undefined,
          'Unable to verify session. Please check your network and Supabase settings.',
        )

        if (!active) return

        if (error) {
          setSession(null)
          setUser(null)
          setRole(null)
          setLoading(false)
          return
        }

        const session = data?.session || null
        setSession(session)
        if (session?.user) {
          await fetchUserRole(session.user)
        } else {
          setUser(null)
          setRole(null)
          setLoading(false)
        }
      } catch (_error) {
        if (!active) return
        setSession(null)
        setUser(null)
        setRole(null)
        setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return
      setSession(session)
      if (session?.user) {
        await fetchUserRole(session.user)
      } else {
        setUser(null)
        setRole(null)
        setLoading(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function fetchUserRole(authUser) {
    const metadataRole = resolveRoleFromAuthUser(authUser)

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single(),
        PROFILE_REQUEST_TIMEOUT_MS,
        'Timed out while loading your profile.',
      )

      if (error) {
        console.error('Supabase Database Error in fetchUserRole:', error)
      }

      if (data) {
        setUser(data)
        setRole(data.role || metadataRole || 'worker')
      } else {
        setRole(metadataRole || 'worker')
        setUser({ id: authUser.id, role: metadataRole || 'worker', full_name: authUser.email || 'User' })
      }
    } catch (e) {
      // If DB lookup fails, try demo role first and then metadata/default role.
      const demoRole = localStorage.getItem('demo_role')
      if (demoRole) {
        setRole(demoRole)
        setUser({ id: authUser.id, role: demoRole, full_name: 'Demo User' })
      } else {
        const fallbackRole = metadataRole || 'worker'
        setRole(fallbackRole)
        setUser({ id: authUser.id, role: fallbackRole, full_name: authUser.email || 'User' })
      }
    } finally {
      setLoading(false)
    }
  }

  function resolveRoleFromAuthUser(authUser) {
    return authUser?.user_metadata?.role || authUser?.app_metadata?.role || null
  }

  async function signIn(email, password) {
    assertSupabaseConfigured()
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      undefined,
      'Login is taking longer than expected. Please retry.',
    )
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    localStorage.removeItem('demo_role')
    localStorage.removeItem('admin_portal_access')
    setUser(null)
    setRole(null)
    setSession(null)
  }

  // Demo login function for development
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
