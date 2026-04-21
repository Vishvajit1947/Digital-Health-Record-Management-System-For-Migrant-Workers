import { useEffect, useMemo, useState } from 'react'
import { Bell, CheckCircle, AlertCircle, Info, Calendar } from 'lucide-react'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../lib/helpers'
import { getWorkerByUserId, getHealthRecords, getWorkerPrescriptions, getWorkerReports } from '../../lib/queries'

const iconMap = {
  info: { icon: Info, bg: 'bg-blue-50 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400' },
  alert: { icon: AlertCircle, bg: 'bg-amber-50 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
  success: { icon: CheckCircle, bg: 'bg-green-50 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
}

export default function WorkerNotifications() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      try {
        const worker = await getWorkerByUserId(user.id)
        const [records, prescriptions, reports] = await Promise.all([
          getHealthRecords(worker.id),
          getWorkerPrescriptions(worker.id),
          getWorkerReports(worker.id),
        ])

        const derived = [
          ...records.slice(0, 3).map(record => ({
            id: `record-${record.id}`,
            type: 'info',
            title: 'New health record',
            message: `${record.doctors?.users?.full_name || 'Your doctor'} recorded ${record.diagnosis || 'a new visit'} on ${formatDate(record.visit_date)}.`,
            date: record.visit_date,
            read: false,
          })),
          ...prescriptions.slice(0, 3).map(prescription => ({
            id: `prescription-${prescription.id}`,
            type: prescription.is_active === false ? 'success' : 'alert',
            title: prescription.is_active === false ? 'Prescription completed' : 'Active prescription',
            message: `${prescription.drug_name} (${prescription.dosage || 'dosage not set'}) is ${prescription.is_active === false ? 'completed' : 'active'}.`,
            date: prescription.issued_at,
            read: true,
          })),
          ...reports.slice(0, 3).map(report => ({
            id: `report-${report.id}`,
            type: 'success',
            title: 'Lab report uploaded',
            message: `${report.report_type || 'A lab report'} was uploaded on ${formatDate(report.uploaded_at)}.`,
            date: report.uploaded_at,
            read: true,
          })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        if (!cancelled) setItems(derived)
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError.message || 'Unable to load notifications')
          setItems([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const unread = useMemo(() => items.filter(item => !item.read).length, [items])

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

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

      {error && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">{error}</div>}

      <div className="space-y-3">
        {items.map(item => {
          const { icon: Icon, bg, color } = iconMap[item.type] || iconMap.info
          return (
            <div key={item.id} className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border ${item.read ? 'border-slate-100 dark:border-slate-700' : 'border-indigo-200 dark:border-indigo-700'} p-5 flex gap-4 card-hover`}>
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-medium text-sm ${item.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-slate-100'}`}>{item.title}</p>
                  {!item.read && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0" />}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.message}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-400 dark:text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(item.date)}
                </div>
              </div>
            </div>
          )
        })}
        {items.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400">No data available</div>}
      </div>
    </div>
  )
}
