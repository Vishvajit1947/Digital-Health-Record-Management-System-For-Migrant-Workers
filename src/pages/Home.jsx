import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  HeartPulse,
  Languages,
  Leaf,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Users,
  Workflow,
  Nfc,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { LANGUAGES } from '../lib/constants'
import { useTranslation } from 'react-i18next'

const ROLE_ROUTES = {
  worker: '/worker/dashboard',
  doctor: '/doctor/dashboard',
  admin: '/admin/dashboard',
}

const ROLE_CARDS = [
  {
    role: 'worker',
    title: 'Workers',
    description: 'Access records, prescriptions, and updates from any device with a single secure identity.',
    icon: Smartphone,
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    role: 'doctor',
    title: 'Doctors',
    description: 'Scan NFC, add records quickly, and keep patient history organized in one place.',
    icon: HeartPulse,
    accent: 'from-indigo-500 to-blue-500',
  },
  {
    role: 'admin',
    title: 'Administrators',
    description: 'Monitor risk, adoption, and system health across regions with analytics that stay actionable.',
    icon: BarChart3,
    accent: 'from-amber-500 to-orange-500',
  },
]

const FEATURES = [
  {
    icon: Nfc,
    title: 'NFC-first identity',
    description: 'Fast patient access through NFC tags with minimal typing and fewer handoff errors.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access',
    description: 'Workers, doctors, and admins see only the tools and records relevant to their role.',
  },
  {
    icon: Workflow,
    title: 'Clear workflow',
    description: 'Structured records, prescriptions, and analytics keep care movement simple across teams.',
  },
  {
    icon: Languages,
    title: 'Built for language access',
    description: 'Multilingual support helps the interface stay usable across diverse field conditions.',
  },
]

const STATS = [
  { value: '3', label: 'roles supported' },
  { value: '4', label: 'languages ready' },
  { value: '1', label: 'shared record system' },
]

export default function Home({ darkMode, onToggleDark }) {
  const navigate = useNavigate()
  const { demoLogin } = useAuth()
  const { i18n, t } = useTranslation()
  const [langOpen, setLangOpen] = useState(false)

  const roleCards = [
    {
      role: 'worker',
      title: t('home_role_worker_title'),
      description: t('home_role_worker_desc'),
      icon: Smartphone,
      accent: 'from-emerald-500 to-teal-500',
    },
    {
      role: 'doctor',
      title: t('home_role_doctor_title'),
      description: t('home_role_doctor_desc'),
      icon: HeartPulse,
      accent: 'from-indigo-500 to-blue-500',
    },
    {
      role: 'admin',
      title: t('home_role_admin_title'),
      description: t('home_role_admin_desc'),
      icon: BarChart3,
      accent: 'from-amber-500 to-orange-500',
    },
  ]

  const features = [
    {
      icon: Nfc,
      title: t('home_feature_nfc_title'),
      description: t('home_feature_nfc_desc'),
    },
    {
      icon: ShieldCheck,
      title: t('home_feature_access_title'),
      description: t('home_feature_access_desc'),
    },
    {
      icon: Workflow,
      title: t('home_feature_workflow_title'),
      description: t('home_feature_workflow_desc'),
    },
    {
      icon: Languages,
      title: t('home_feature_lang_title'),
      description: t('home_feature_lang_desc'),
    },
  ]

  const stats = [
    { value: '3', label: t('home_stat_roles') },
    { value: '4', label: t('home_stat_languages') },
    { value: '1', label: t('home_stat_system') },
  ]

  const currentLang = useMemo(
    () => LANGUAGES.find(language => language.code === i18n.language) || LANGUAGES[0],
    [i18n.language],
  )

  function handleDemoLogin(role) {
    demoLogin(role)
    navigate(ROLE_ROUTES[role], { replace: true })
  }

  function handleLanguageChange(code) {
    i18n.changeLanguage(code)
    localStorage.setItem('lang', code)
    setLangOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.24),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(180deg,_#0f172a_0%,_#111827_42%,_#020617_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-30 bg-[linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-lg shadow-cyan-500/20">
              <Nfc className="h-6 w-6 text-white" />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-tight">{t('app_name')}</span>
              <span className="block text-xs text-slate-400">{t('tagline')}</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button
                onClick={() => setLangOpen(value => !value)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              >
                <Languages className="h-4 w-4" />
                <span className="hidden sm:inline">{currentLang.label}</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/30">
                  {LANGUAGES.map(language => (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageChange(language.code)}
                      className={`block w-full px-4 py-2.5 text-left text-sm transition hover:bg-white/10 ${i18n.language === language.code ? 'text-cyan-300' : 'text-slate-300'}`}
                    >
                      {language.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onToggleDark}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
              to="/login"
              className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 sm:inline-flex"
            >
              {t('login')}
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-100"
            >
              {t('register')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pt-14">
        <section className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 shadow-lg shadow-cyan-950/10">
              <Sparkles className="h-4 w-4" />
              {t('home_badge')}
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {t('home_title')}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                {t('home_subtitle')}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                {t('home_get_started')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={() => handleDemoLogin('doctor')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                {t('home_try_demo')}
                <BadgeCheck className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map(stat => (
                <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <div className="text-2xl font-semibold text-white">{stat.value}</div>
                  <div className="mt-1 text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-cyan-400/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{t('home_live_overview')}</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">{t('home_field_ready')}</h2>
                </div>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300">{t('home_active')}</span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-indigo-500/15 p-3 text-indigo-300">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{t('home_secure_access')}</p>
                      <p className="text-sm text-slate-400">{t('home_secure_access_desc')}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-300">
                      <Leaf className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{t('home_mobile_workflow')}</p>
                      <p className="text-sm text-slate-400">{t('home_mobile_workflow_desc')}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-amber-500/15 p-3 text-amber-300">
                      <LockKeyhole className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{t('home_controlled_visibility')}</p>
                      <p className="text-sm text-slate-400">{t('home_controlled_visibility_desc')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map(feature => {
            const Icon = feature.icon
            return (
              <article
                key={feature.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/10 backdrop-blur transition hover:-translate-y-1 hover:bg-white/8"
              >
                <div className="inline-flex rounded-2xl bg-cyan-400/10 p-3 text-cyan-200">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
              </article>
            )
          })}
        </section>

        <section className="mt-16 grid gap-5 lg:grid-cols-3">
          {roleCards.map(card => {
            const Icon = card.icon
            return (
              <article
                key={card.role}
                className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
              >
                <div className={`inline-flex rounded-2xl bg-gradient-to-br ${card.accent} p-3 text-white shadow-lg`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{card.description}</p>
                <button
                  onClick={() => handleDemoLogin(card.role)}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                >
                  {t('home_open_demo')}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </article>
            )
          })}
        </section>
      </main>
    </div>
  )
}
