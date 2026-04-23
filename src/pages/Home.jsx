import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  HeartPulse,
  Languages,
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
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { LANGUAGES } from '../lib/constants'
import { useTranslation } from 'react-i18next'

const ROLE_ROUTES = {
  worker: '/dashboard/worker',
  doctor: '/dashboard/doctor',
  admin: '/admin/dashboard',
}

export default function Home() {
  const navigate = useNavigate()
  const { demoLogin, user, role } = useAuth()
  const { setLanguage } = useLanguage()
  const { darkMode, toggleDark } = useTheme()
  const { i18n, t } = useTranslation()
  const [langOpen, setLangOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)

  const roleCards = [
    {
      role: 'worker',
      title: 'Workers',
      description: 'View your health records, prescriptions, and updates anytime-no documents required.',
      icon: Smartphone,
      accent: 'from-emerald-500 to-teal-500',
    },
    {
      role: 'doctor',
      title: 'Doctors',
      description: 'Tap, access, and update patient data instantly-no paperwork, no delays.',
      icon: HeartPulse,
      accent: 'from-indigo-500 to-blue-500',
    },
    {
      role: 'admin',
      title: 'Administrators',
      description: 'Monitor health trends, risks, and system usage to make better decisions at scale.',
      icon: BarChart3,
      accent: 'from-amber-500 to-orange-500',
    },
  ]

  const features = [
    {
      icon: Nfc,
      title: 'NFC-first identity',
      description: 'One tap is all it takes. Instantly access a worker\'s complete health record without manual entry or delays.',
    },
    {
      icon: ShieldCheck,
      title: 'Role-based access',
      description: 'Workers, doctors, and administrators each get a tailored view-ensuring the right data reaches the right person.',
    },
    {
      icon: Workflow,
      title: 'Seamless workflow',
      description: 'From diagnosis to follow-ups, everything stays organized and accessible across locations.',
    },
    {
      icon: Languages,
      title: 'Multilingual support',
      description: 'Designed for real users-supporting multiple languages for better understanding and usability.',
    },
  ]

  const currentLang = useMemo(
    () => LANGUAGES.find(language => language.code === i18n.language) || LANGUAGES[0],
    [i18n.language],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    setIsClient(true)
  }, [])

  function handleDemoLogin(role) {
    demoLogin(role)
    navigate(ROLE_ROUTES[role], { replace: true })
  }

  async function handleGetStarted() {
    if (!isClient || redirectLoading) return

    // If already logged in via AuthContext, redirect immediately — no extra auth call
    if (role) {
      navigate(ROLE_ROUTES[role] || ROLE_ROUTES.worker, { replace: true })
      return
    }

    navigate('/login')
  }

  function handleLanguageChange(code) {
    setLanguage(code)
    setLangOpen(false)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      <div className="absolute inset-0 -z-10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.24),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(180deg,_#0f172a_0%,_#111827_42%,_#020617_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-30 dark:bg-[linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] dark:bg-[size:72px_72px] dark:[mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />

      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-lg shadow-cyan-500/20">
              <Nfc className="h-6 w-6 text-white" />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{t('app_name')}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{t('tagline')}</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button
                onClick={() => setLangOpen(value => !value)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <Languages className="h-4 w-4" />
                <span className="hidden sm:inline">{currentLang.label}</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl dark:shadow-black/30">
                  {LANGUAGES.map(language => (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageChange(language.code)}
                      className={`block w-full px-4 py-2.5 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-white/10 ${i18n.language === language.code ? 'text-indigo-600 dark:text-cyan-300 font-medium' : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      {language.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={toggleDark}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-white/10"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link
              to="/login"
              className="hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-white/10 sm:inline-flex"
            >
              {t('login')}
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-slate-950 transition hover:bg-indigo-700 dark:hover:bg-slate-100"
            >
              {t('register')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8 lg:pt-14">
        <section className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div className="space-y-7 sm:space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-cyan-400/20 bg-indigo-50 dark:bg-cyan-400/10 px-4 py-2 text-sm text-indigo-700 dark:text-cyan-200 shadow-lg dark:shadow-cyan-950/10">
              <Sparkles className="h-4 w-4" />
              Built for real-world healthcare challenges
            </div>

            <div className="space-y-4 sm:space-y-5">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
                Healthcare that travels with every worker.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                Migrant workers often lose access to their medical history when they move. Our NFC-based system ensures their health records stay with them-anywhere, anytime.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleGetStarted}
                disabled={!isClient}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 dark:bg-cyan-400 px-6 py-3.5 text-sm font-semibold text-white dark:text-slate-950 transition hover:bg-indigo-700 dark:hover:bg-cyan-300"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDemoLogin('doctor')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-6 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-100 transition hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Explore Demo
                <BadgeCheck className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-indigo-200/50 dark:bg-cyan-400/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 p-6 shadow-2xl dark:shadow-black/30 dark:backdrop-blur-xl sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Care snapshot</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">Real-time care, wherever they go</h2>
                </div>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">Live</span>
              </div>

              <div className="mt-6 space-y-3 sm:space-y-4">
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-indigo-100 dark:bg-indigo-500/15 p-3 text-indigo-600 dark:text-indigo-300">
                      <Nfc className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Instant patient identification using NFC</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 p-3 text-emerald-600 dark:text-emerald-300">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Access full medical history in seconds</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-amber-100 dark:bg-amber-500/15 p-3 text-amber-600 dark:text-amber-300">
                      <Workflow className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Update records from any location</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-cyan-100 dark:bg-cyan-500/15 p-3 text-cyan-700 dark:text-cyan-300">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Track health risks and trends centrally</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-rose-200/80 dark:border-rose-400/20 bg-rose-50/80 dark:bg-rose-400/5 p-6 sm:mt-14 sm:p-8">
          <p className="text-base leading-7 text-rose-900 dark:text-rose-100 sm:text-lg">
            Millions of migrant workers lose access to their medical history every time they relocate. This leads to repeated tests, delayed treatment, and poor healthcare outcomes.
          </p>
        </section>

        <section className="mt-12 grid gap-5 md:mt-14 md:grid-cols-2 xl:grid-cols-4">
          {features.map(feature => {
            const Icon = feature.icon
            return (
              <article
                key={feature.title}
                className="rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-6 dark:shadow-black/10 dark:backdrop-blur transition hover:-translate-y-1 hover:bg-slate-100 dark:hover:bg-white/8"
              >
                <div className="inline-flex rounded-2xl bg-indigo-100 dark:bg-cyan-400/10 p-3 text-indigo-600 dark:text-cyan-200">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{feature.description}</p>
              </article>
            )
          })}
        </section>

        <section className="mt-12 sm:mt-14">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">User roles built for action</h2>
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {roleCards.map(card => {
            const Icon = card.icon
            return (
              <article
                key={card.role}
                className="overflow-hidden rounded-[2rem] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 p-6 dark:shadow-black/20 dark:backdrop-blur-xl"
              >
                <div className={`inline-flex rounded-2xl bg-gradient-to-br ${card.accent} p-3 text-white shadow-lg`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{card.description}</p>
                <button
                  onClick={() => handleDemoLogin(card.role)}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-100 transition hover:bg-slate-200 dark:hover:bg-white/10"
                >
                  Explore Demo
                  <ArrowRight className="h-4 w-4" />
                </button>
              </article>
            )
          })}
          </div>
        </section>

        <section className="mt-12 pb-4 text-center sm:mt-14">
          <p className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            One system. Continuous care. Better decisions.
          </p>
        </section>
      </main>
    </div>
  )
}
