import { useState } from 'react'
import { Nfc, LogOut, Sun, Moon, Globe, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../../lib/constants'

const ROLE_LABELS = { worker: 'Worker', doctor: 'Doctor', admin: 'Admin' }
const ROLE_COLORS = {
  worker: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  doctor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

export default function Navbar({ darkMode, onToggleDark }) {
  const { role, signOut } = useAuth()
  const { i18n, t } = useTranslation()
  const [langOpen, setLangOpen] = useState(false)

  function handleLang(code) {
    i18n.changeLanguage(code)
    localStorage.setItem('lang', code)
    setLangOpen(false)
  }

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]

  return (
    <nav className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-6 gap-4 sticky top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-auto">
        <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
          <Nfc className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-slate-800 dark:text-slate-100 text-lg">{t('app_name')}</span>
      </div>

      {/* Role Badge */}
      {role && (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[role]}`}>
          {ROLE_LABELS[role]}
        </span>
      )}

      {/* Language Selector */}
      <div className="relative">
        <button
          onClick={() => setLangOpen(v => !v)}
          className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span>{currentLang.label}</span>
          <ChevronDown className="w-3 h-3" />
        </button>
        {langOpen && (
          <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-50">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => handleLang(l.code)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${i18n.language === l.code ? 'text-indigo-600 font-medium' : 'text-slate-700 dark:text-slate-300'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dark mode toggle */}
      <button
        onClick={onToggleDark}
        className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
        aria-label="Toggle dark mode"
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Logout */}
      <button
        onClick={signOut}
        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </nav>
  )
}
