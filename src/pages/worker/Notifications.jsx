import { useEffect, useMemo, useState } from 'react'
import { Bell, CheckCircle, AlertCircle, Info, Calendar } from 'lucide-react'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../lib/helpers'
import { getWorkerByUserId, getHealthRecords, getWorkerPrescriptions, getWorkerReports } from '../../lib/queries'
import { useTranslation } from 'react-i18next'

const iconMap = {
  info: { icon: Info, bg: 'bg-blue-50 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400' },
  alert: { icon: AlertCircle, bg: 'bg-amber-50 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
  success: { icon: CheckCircle, bg: 'bg-green-50 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
}

export default function WorkerNotifications() {
  const { t } = useTranslation()
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
            title: t('notification_new_record'),
            message: t('notification_new_record_message', {
              doctor: record.doctors?.users?.full_name || t('your_doctor'),
              diagnosis: record.diagnosis || t('new_visit'),
              date: formatDate(record.visit_date),
            }),
            date: record.visit_date,
            read: false,
          })),
          ...prescriptions.slice(0, 3).map(prescription => ({
            id: `prescription-${prescription.id}`,
            type: prescription.is_active === false ? 'success' : 'alert',
            title: prescription.is_active === false ? t('notification_prescription_completed') : t('notification_active_prescription'),
            message: t('notification_prescription_message', {
              drug: prescription.drug_name,
              dosage: prescription.dosage || t('dosage_not_set'),
              status: prescription.is_active === false ? t('completed') : t('active'),
            }),
            date: prescription.issued_at,
            read: true,
          })),
          ...reports.slice(0, 3).map(report => ({
            id: `report-${report.id}`,
            type: 'success',
            title: t('notification_lab_report_uploaded'),
            message: t('notification_lab_report_message', {
              report: report.report_type || t('lab_report'),
              date: formatDate(report.uploaded_at),
            }),
            date: report.uploaded_at,
            read: true,
          })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        if (!cancelled) setItems(derived)
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError.message || t('unable_load_notifications'))
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
    <div className="space-y-6 page-enter leading-relaxed">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{t('notifications')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {unread > 0 ? t('unread_notifications', { count: unread }) : t('all_caught_up')}
          </p>
        </div>
        {unread > 0 && (
          <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">{t('mark_all_read')}</button>
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
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed break-words">{item.message}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-400 dark:text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(item.date)}
                </div>
              </div>
            </div>
          )
        })}
        {items.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400">{t('no_data')}</div>}
      </div>
    </div>
  )
}
