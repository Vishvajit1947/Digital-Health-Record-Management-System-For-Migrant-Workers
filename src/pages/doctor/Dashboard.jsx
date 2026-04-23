import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Activity, ClipboardList, Stethoscope, ScanLine, ExternalLink } from 'lucide-react'
import StatCard from '../../components/shared/StatCard'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { formatDate } from '../../lib/helpers'
import { supabase } from '../../lib/supabase'
import { getDoctorIdByUserId } from '../../lib/queries'
import { useTranslation } from 'react-i18next'

export default function DoctorDashboard() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recentPatients, setRecentPatients] = useState([])

  useEffect(() => {
    let cancelled = false

    async function loadRecentPatients() {
      setLoading(true)
      setError('')

      try {
        const { data: authData } = await supabase.auth.getUser()
        const authUserId = authData?.user?.id

        // Resolve doctors.id — health_records.doctor_id is a FK to doctors.id, not auth uid
        const doctorId = await getDoctorIdByUserId(authUserId)
        console.log('Doctor ID:', doctorId)

        if (!doctorId) {
          if (!cancelled) setLoading(false)
          return
        }

        const { data, error: recentError } = await supabase
          .from('health_records')
          .select('id, worker_id, visit_date, diagnosis, icd10_code, workers(id, health_id, region, user_id, users(full_name))')
          .eq('doctor_id', doctorId)
          .order('visit_date', { ascending: false })
          .limit(8)

        if (recentError) throw recentError

        console.log('Filtered Data:', data)

        const normalized = (data || []).map(record => {
          const worker = Array.isArray(record.workers) ? record.workers[0] : record.workers
          return {
            id: record.id,
            worker_id: worker?.id || record.worker_id,
            name: worker?.users?.full_name || worker?.health_id || t('unknown_worker'),
            health_id: worker?.health_id || '—',
            last_visit: record.visit_date,
            diagnosis: record.diagnosis || '—',
            region: worker?.region || '—',
          }
        })

        if (!cancelled) setRecentPatients(normalized)
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError.message || t('unable_load_recent_patients'))
          setRecentPatients([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadRecentPatients()

    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo(() => [
    { title: t('patients_today'), value: recentPatients.length, icon: Users, color: 'indigo' },
    { title: t('total_patients'), value: new Set(recentPatients.map(p => p.worker_id)).size, icon: Stethoscope, color: 'green' },
    { title: t('pending_followups'), value: recentPatients.filter(p => !p.last_visit).length, icon: ClipboardList, color: 'amber' },
    { title: t('records_this_week'), value: recentPatients.filter(p => {
      const daysAgo = (Date.now() - new Date(p.last_visit).getTime()) / 86400000
      return daysAgo <= 7
    }).length, icon: Activity, color: 'purple' },
  ], [recentPatients, t])

  return (
    <div className="space-y-6 page-enter leading-relaxed">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{t('doctor_dashboard')}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('doctor_dashboard_subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(stat => <StatCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} color={stat.color} />)}
      </div>

      <Link to="/doctor/scan" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl p-8 flex items-center gap-6 transition-colors group card-hover">
        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          <ScanLine className="w-8 h-8" />
        </div>
        <div>
          <p className="font-semibold text-xl break-words">{t('scan_nfc_patient')}</p>
          <p className="text-indigo-200 text-sm mt-1 break-words">{t('scan_nfc_patient_subtitle')}</p>
        </div>
        <ExternalLink className="w-5 h-5 ml-auto opacity-60 group-hover:opacity-100 shrink-0" />
      </Link>

      {loading && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {error && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">{error}</div>}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">{t('recent_patients')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                {[t('name'), t('health_id'), t('last_visit'), t('diagnosis'), t('region'), t('action')].map(h => (
                  <th key={h} className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {recentPatients.map(patient => (
                <tr key={patient.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">{patient.name}</td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-transparent">{patient.health_id}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{formatDate(patient.last_visit)}</td>
                  <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{patient.diagnosis}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{patient.region}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <Link to={`/doctor/patient/${patient.worker_id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">{t('view')}</Link>
                      <span className="text-cyan-600 dark:text-cyan-400 font-medium">{t('nfc_ready')}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && recentPatients.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">{t('no_data')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
