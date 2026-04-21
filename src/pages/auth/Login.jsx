import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Nfc, Mail, Lock, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../../lib/constants'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, demoLogin, role } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()

  const ROLE_REDIRECT = { worker: '/dashboard/worker', doctor: '/dashboard/doctor', admin: '/admin/dashboard' }
  const intendedPath = location.state?.from?.pathname

  function getRedirectTarget(currentRole) {
    if (currentRole === 'doctor' && intendedPath) return intendedPath
    return ROLE_REDIRECT[currentRole] || '/'
  }

  useEffect(() => {
    if (!role || loading) return
    navigate(getRedirectTarget(role), { replace: true })
  }, [role, loading, navigate, intendedPath])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(email, password)
      // role will be set in AuthContext via onAuthStateChange
      toast.success('Welcome back!')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  function handleDemoLogin(demoRole) {
    demoLogin(demoRole)
    toast.success(`Logged in as demo ${demoRole}`)
    navigate(getRedirectTarget(demoRole), { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <Nfc className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">{t('app_name')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{t('tagline')}</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-6">{t('login_heading')}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium mb-1.5">
                {t('email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
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
              disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-xl px-5 py-2.5 font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Signing in...' : t('login')}
            </button>
          </form>

          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              {t('register')}
            </Link>
          </p>

          {/* Demo Login */}
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

          {/* Language selector */}
          <div className="mt-4">
            <select
              value={i18n.language}
              onChange={e => { i18n.changeLanguage(e.target.value); localStorage.setItem('lang', e.target.value) }}
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
