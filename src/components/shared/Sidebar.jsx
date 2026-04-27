import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Pill, Bell, ScanLine, Users,
  BarChart2, ShieldAlert, ChevronLeft, ChevronRight, User
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'

const NAV_ITEMS = {
  worker: [
    { to: '/worker/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
    { to: '/worker/records', icon: FileText, labelKey: 'my_records' },
    { to: '/worker/prescriptions', icon: Pill, labelKey: 'prescriptions' },
    { to: '/worker/notifications', icon: Bell, labelKey: 'notifications' },
  ],
  doctor: [
    { to: '/doctor/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
    { to: '/doctor/scan', icon: ScanLine, labelKey: 'scan_patient' },
    { to: '/dashboard/doctor/patients', icon: Users, labelKey: 'my_patients' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
    { to: '/admin/analytics', icon: BarChart2, labelKey: 'analytics' },
    { to: '/admin/risk-table', icon: ShieldAlert, labelKey: 'risk_table' },
  ],
}

export default function Sidebar() {
  const { role, user } = useAuth()
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)
  const items = NAV_ITEMS[role] || []

  return (
    <aside className={`${collapsed ? 'w-14 md:w-16' : 'w-14 md:w-60'} bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 shrink-0`}>
      {/* User profile mini — hidden on mobile */}
      {!collapsed && (
        <div className="hidden md:block p-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                {user?.full_name || t('user')}
              </p>
              <p className="text-xs text-slate-400 capitalize">{role ? t(role) : ''}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1">
        {items.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="hidden md:inline">{t(labelKey)}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle — desktop only */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="hidden md:flex m-3 p-2 items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </aside>
  )
}
