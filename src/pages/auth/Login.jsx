import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Nfc, Mail, Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../../lib/constants'
import { isSupabaseConfigured } from '../../lib/supabaseClient'

const ROLE_REDIRECT = {
  worker: '/worker/dashboard',
  doctor: '/doctor/dashboard',
  admin: '/admin/dashboard',
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // AuthContext is the single source of truth — no extra supabase calls here.
  const { signIn, demoLogin, role, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { setLanguage } = useLanguage()
  const { t, i18n } = useTranslation()

  // Capture intended path once on mount into a ref so it never becomes a reactive dep.
  const intendedPath = useRef(location.state?.from?.pathname || null)

  // Redirect fires exactly once — ref prevents double-navigation.
  const didRedirect = useRef(false)

  function getTarget(currentRole) {
    return intendedPath.current || ROLE_REDIRECT[currentRole] || '/worker/dashboard'
  }

  // Single effect: fires when auth resolves. If already logged in → redirect immediately.
  // If not logged in (role is null after loading) → stay and show form.
  useEffect(() => {
    if (authLoading) return
    if (!role) return
    if (didRedirect.current) return
    didRedirect.current = true
    navigate(getTarget(role), { replace: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, role])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isSupabaseConfigured) {
      toast.error('Supabase is not configured. Add env vars in Vercel.')
      return
    }
    setSubmitting(true)
    try {
      await signIn(email, password)
      toast.success(t('toast_welcome_back'))
      // Redirect handled by the useEffect above once AuthContext sets role.
    } catch (err) {
      toast.error(err.message || t('toast_login_failed'))
    } finally {
      setSubmitting(false)
    }
  }

  function handleDemoLogin(demoRole) {
    if (didRedirect.current) return
    didRedirect.current = true
    demoLogin(demoRole)
    toast.success(t('toast_demo_login', { role: t(demoRole) }))
    navigate(getTarget(demoRole), { replace: true })
  }

  // While auth is resolving, show a neutral spinner — not the form.
  // This prevents the form from flashing before an already-logged-in user is redirected.
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <Nfc className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">{t('app_name')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{t('tagline')}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8">
          <h2 className="text-xl font-semibold leading-relaxed text-slate-800 dark:text-slate-100 mb-6">{t('login_heading')}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium mb-1.5">
                {t('email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium mb-1.5">
                {t('password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white rounded-xl px-5 py-2.5 font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {submitting ? t('login_signing_in') : t('login')}
            </button>
          </form>

          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-4">
            {t('login_no_account')}{' '}
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              {t('register')}
            </Link>
          </p>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full mt-4 border border-slate-200 dark:border-slate-600 rounded-xl px-5 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            ← Back to Home
          </button>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-center text-slate-400 mb-3 uppercase tracking-wide font-medium">{t('demo_access')}</p>
            <div className="grid grid-cols-3 gap-2">
              {['worker', 'doctor', 'admin'].map(r => (
                <button
                  key={r}
                  onClick={() => handleDemoLogin(r)}
                  className="text-xs py-2 px-3 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 capitalize transition-colors"
                >
                  {t(r)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <select
              value={i18n.language}
              onChange={e => setLanguage(e.target.value)}
              className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
