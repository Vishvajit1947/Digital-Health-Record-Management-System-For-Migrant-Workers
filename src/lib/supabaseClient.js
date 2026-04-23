import { createClient } from '@supabase/supabase-js'

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || ''
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(rawSupabaseUrl && rawSupabaseAnonKey)

const supabaseUrl = isSupabaseConfigured ? rawSupabaseUrl : 'https://placeholder.supabase.co'
const supabaseAnonKey = isSupabaseConfigured ? rawSupabaseAnonKey : 'placeholder-anon-key'

export const AUTH_REQUEST_TIMEOUT_MS = 20000
export const PROFILE_REQUEST_TIMEOUT_MS = 10000

export function withTimeout(promise, timeoutMs = AUTH_REQUEST_TIMEOUT_MS, timeoutMessage = 'Request timed out') {
	let timeoutId
	const timeoutPromise = new Promise((_, reject) => {
		timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
	})

	return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId))
}

export function assertSupabaseConfigured() {
	if (isSupabaseConfigured) return
	throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // true causes hangs on Vercel when URL has no token
    storageKey: 'healthid-auth-token',
  },
})

// Remove the old default Supabase storage key if it exists.
// When storageKey was changed, the old token stays in localStorage and
// causes "Invalid Refresh Token" 400 errors on every page load.
if (typeof window !== 'undefined') {
  const oldKey = `sb-${rawSupabaseUrl.replace('https://', '').split('.')[0]}-auth-token`
  if (localStorage.getItem(oldKey)) {
    localStorage.removeItem(oldKey)
  }
}
