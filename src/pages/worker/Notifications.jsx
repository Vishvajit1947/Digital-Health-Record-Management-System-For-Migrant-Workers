import { Bell, CheckCircle, AlertCircle, Info, Calendar } from 'lucide-react'
import { formatDate } from '../../lib/helpers'

const notifications = [
  { id: '1', type: 'info', title: 'New health record added', message: 'Dr. Priya Mehta added a new record for your visit on 15 Mar 2024.', date: '2024-03-15', read: false },
  { id: '2', type: 'alert', title: 'Prescription reminder', message: 'You have an active prescription for Amoxicillin. Please complete your course.', date: '2024-03-14', read: false },
  { id: '3', type: 'success', title: 'Health score improved', message: 'Your health score has improved to 72. Keep up the good work!', date: '2024-03-10', read: true },
  { id: '4', type: 'info', title: 'Follow-up appointment', message: 'Please schedule a follow-up appointment within 2 weeks for blood pressure check.', date: '2024-02-15', read: true },
  { id: '5', type: 'alert', title: 'Lab report available', message: 'Your blood test results have been uploaded by Dr. Arun Singh.', date: '2024-01-20', read: true },
]

const iconMap = {
  info: { icon: Info, bg: 'bg-blue-50 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400' },
  alert: { icon: AlertCircle, bg: 'bg-amber-50 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
  success: { icon: CheckCircle, bg: 'bg-green-50 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
}

export default function WorkerNotifications() {
  const unread = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Notifications</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unread > 0 && (
          <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Mark all as read</button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map(n => {
          const { icon: Icon, bg, color } = iconMap[n.type]
          return (
            <div key={n.id} className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border ${n.read ? 'border-slate-100 dark:border-slate-700' : 'border-indigo-200 dark:border-indigo-700'} p-5 flex gap-4 card-hover`}>
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-medium text-sm ${n.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-slate-100'}`}>{n.title}</p>
                  {!n.read && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0" />}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-400 dark:text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(n.date)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
