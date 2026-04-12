import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) fetchUserRole(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) fetchUserRole(session.user.id)
      else {
        setUser(null)
        setRole(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchUserRole(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
        
      if (error) {
        console.error("Supabase Database Error in fetchUserRole:", error)
      }
      
      if (data) {
        setUser(data)
        setRole(data.role)
      } else {
        console.warn("No user profile found in the database for this auth account!", userId)
      }
    } catch (e) {
      // If no DB, use demo mode
      const demoRole = localStorage.getItem('demo_role')
      if (demoRole) {
        setRole(demoRole)
        setUser({ id: userId, role: demoRole, full_name: 'Demo User' })
      }
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    localStorage.removeItem('demo_role')
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
