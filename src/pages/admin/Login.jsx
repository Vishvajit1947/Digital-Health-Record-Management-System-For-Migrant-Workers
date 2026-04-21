import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

export default function AdminLogin() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, demoLogin, role, session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const target = location.state?.from?.pathname || '/admin/dashboard'

  useEffect(() => {
    const simulated = localStorage.getItem('admin_portal_access') === 'true'
    if (session && (role === 'admin' || simulated)) {
      navigate(target, { replace: true })
    }
  }, [session, role, navigate, target])

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)

    try {
      await signIn(email, password)
      localStorage.setItem('admin_portal_access', 'true')
      toast.success(t('admin_access_granted'))
      navigate('/admin/dashboard', { replace: true })
    } catch (error) {
      toast.error(error.message || t('admin_login_failed'))
    } finally {
      setLoading(false)
    }
  }

  function handleDemoAdmin() {
    demoLogin('admin')
    localStorage.setItem('admin_portal_access', 'true')
    toast.success(t('admin_demo_entered'))
    navigate('/admin/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{t('admin_login')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('admin_login_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium mb-1.5">{t('email')}</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="admin@example.com"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium mb-1.5">{t('password')}</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-xl px-5 py-2.5 font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {loading ? t('login_signing_in') : t('login_admin')}
          </button>
        </form>

        <button
          onClick={handleDemoAdmin}
          className="w-full mt-3 border border-slate-200 dark:border-slate-600 rounded-xl px-5 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          {t('continue_simulated_admin')}
        </button>

        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-5">
          {t('need_user_account')}{' '}
          <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            {t('register')}
          </Link>
        </p>
      </div>
    </div>
  )
}
