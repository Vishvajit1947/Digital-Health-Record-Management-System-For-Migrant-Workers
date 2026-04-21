import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Pill, Calendar, ShieldCheck, Nfc, ExternalLink, Copy, Link2 } from 'lucide-react'
import StatCard from '../../components/shared/StatCard'
import HealthScoreMeter from '../../components/shared/HealthScoreMeter'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { useAuth } from '../../context/AuthContext'
import { buildPatientNfcUrl, formatDate, getHealthScoreColor } from '../../lib/helpers'
import { RISK_BADGE_CLASSES } from '../../lib/constants'
import { supabase } from '../../lib/supabase'
import {
  getWorkerByUserId,
  getHealthRecords,
  getWorkerPrescriptions,
  getWorkerReports,
  getWorkerLatestHealthScore,
} from '../../lib/queries'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { getRiskLevelKey } from '../../lib/helpers'

export default function WorkerDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [worker, setWorker] = useState(null)
  const [workerId, setWorkerId] = useState(null)
  const [records, setRecords] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [reports, setReports] = useState([])
  const [nfcUrl, setNfcUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    async function loadWorkerData() {
      setLoading(true)
      setError('')

      try {
        const workerData = await getWorkerByUserId(user.id)
        const [healthRecords, prescriptionRows, reportRows, latestScore] = await Promise.all([
          getHealthRecords(workerData.id),
          getWorkerPrescriptions(workerData.id),
          getWorkerReports(workerData.id),
          getWorkerLatestHealthScore(workerData.id),
        ])

        if (cancelled) return

        const mergedWorker = {
          ...workerData,
          health_score: latestScore?.score != null ? Number(latestScore.score) : workerData.health_score ?? null,
          risk_level: workerData.risk_level || 'Low',
          full_name: workerData.name,
        }

        setWorker(mergedWorker)
        setWorkerId(workerData.id)
        setRecords(healthRecords)
        setPrescriptions(prescriptionRows)
        setReports(reportRows)
        setNfcUrl(workerData.nfc_token ? buildPatientNfcUrl(workerData.nfc_token, mergedWorker.full_name) : workerData.id)
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError.message || t('unable_load_worker_data'))
          setWorker(null)
          setWorkerId(null)
          setRecords([])
          setPrescriptions([])
          setReports([])
          setNfcUrl('')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadWorkerData()

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (!workerId) return undefined

    const reload = async () => {
      try {
        const workerData = await getWorkerByUserId(user.id)
        const [healthRecords, prescriptionRows, reportRows, latestScore] = await Promise.all([
          getHealthRecords(workerData.id),
          getWorkerPrescriptions(workerData.id),
          getWorkerReports(workerData.id),
          getWorkerLatestHealthScore(workerData.id),
        ])

        setWorker({
          ...workerData,
          health_score: latestScore?.score != null ? Number(latestScore.score) : workerData.health_score ?? null,
          risk_level: workerData.risk_level || 'Low',
          full_name: workerData.name,
        })
        setRecords(healthRecords)
        setPrescriptions(prescriptionRows)
        setReports(reportRows)
        setNfcUrl(workerData.nfc_token ? buildPatientNfcUrl(workerData.nfc_token, workerData.name) : workerData.id)
      } catch {
        // Keep the last known data visible if realtime refresh fails.
      }
    }

    const channel = supabase
      .channel(`worker-portal-${workerId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'health_records', filter: `worker_id=eq.${workerId}` }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions', filter: `worker_id=eq.${workerId}` }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lab_reports', filter: `worker_id=eq.${workerId}` }, reload)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workerId, user?.id])

  async function copyNfcLink() {
    if (!nfcUrl) return
    try {
      await navigator.clipboard.writeText(nfcUrl)
      toast.success(t('toast_nfc_url_copied'))
    } catch {
      toast.error(t('toast_copy_failed'))
    }
  }

  const activePrescriptions = useMemo(() => prescriptions.filter(p => p.is_active !== false), [prescriptions])
  const recentRecords = useMemo(() => records.slice(0, 5), [records])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !worker) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{t('worker_dashboard')}</h1>
        <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 mt-2">{error || t('no_data')}</p>
      </div>
    )
  }

  const latestVisit = recentRecords[0]?.visit_date || null
  const scoreColor = getHealthScoreColor(Number(worker.health_score || 0))

  return (
    <div className="space-y-6 page-enter leading-relaxed">
      {/* Profile Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar & Info */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none">
              {worker.full_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 break-words">{worker.full_name}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm break-words">{worker.occupation}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full font-medium">
                  {worker.health_id}
                </span>
                <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-full">
                  {worker.region}
                </span>
              </div>
            </div>
          </div>

          {/* NFC Card visual */}
          <div className="md:ml-auto min-w-0 w-full md:w-auto">
            <div className="w-full max-w-72 min-h-32 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-xl shadow-indigo-300/30 dark:shadow-none relative overflow-hidden">
              <div className="absolute top-3 right-3 opacity-20">
                <div className="w-12 h-12 border-2 border-white rounded-full" />
                <div className="w-8 h-8 border-2 border-white rounded-full absolute top-2 left-2" />
              </div>
              <Nfc className="w-6 h-6 mb-3 opacity-80" />
              <p className="text-xs opacity-70 mb-0.5">{t('health_id')}</p>
              <p className="text-sm font-mono font-medium tracking-widest">{worker.health_id}</p>
              <p className="text-xs opacity-70 mt-2">{worker.full_name}</p>
              <p className="text-[11px] opacity-70 mt-1">{worker.nfc_token ? t('nfc_linked') : t('no_nfc_linked')}</p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={copyNfcLink}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 text-white px-4 py-2 text-xs font-medium hover:bg-indigo-700 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> {t('copy_nfc_url')}
              </button>
              <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-700 px-2.5 py-1.5 text-[11px] text-slate-600 dark:text-slate-300 max-w-full md:max-w-64 truncate" title={nfcUrl}>
                <Link2 className="w-3.5 h-3.5" />
                {nfcUrl || worker.id}
              </span>
            </div>
          </div>

          {/* Health score */}
          <div className="md:ml-4">
            <HealthScoreMeter score={Number(worker.health_score || 0)} size={130} />
            <p className="mt-2 text-center text-xs font-medium" style={{ color: scoreColor }}>{t('live_data')}</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title={t('total_visits')} value={records.length} icon={Activity} color="indigo" />
        <StatCard title={t('active_prescriptions')} value={activePrescriptions.length} icon={Pill} color="green" />
        <StatCard title={t('last_visit')} value={formatDate(latestVisit)} icon={Calendar} color="amber" />
        <StatCard
          title={t('health_risk_level')}
          value={
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${RISK_BADGE_CLASSES[worker.risk_level] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
              {t(getRiskLevelKey(worker.risk_level))}
            </span>
          }
          icon={ShieldCheck}
          color="purple"
        />
      </div>

      {/* Recent Records */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('recent_records')}</h3>
          <Link to="/worker/records" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
            {t('view_all')} <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                {[t('date'), t('doctor_name'), t('diagnosis'), t('icd10'), t('action')].map(h => (
                  <th key={h} className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {recentRecords.map(r => (
                <tr key={r.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{formatDate(r.visit_date)}</td>
                  <td className="px-4 py-2 text-slate-800 dark:text-slate-200 font-medium">{r.doctors?.users?.full_name || t('doctor_name')}</td>
                  <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{r.diagnosis}</td>
                  <td className="px-4 py-2">
                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg">{r.icd10_code || t('not_available')}</span>
                  </td>
                  <td className="px-4 py-2">
                    <button className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium">{t('view')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Prescriptions */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('active_prescriptions')}</h3>
          <Link to="/worker/prescriptions" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">{t('view_all')}</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {activePrescriptions.slice(0, 6).map(p => (
            <div key={p.id} className="border border-slate-100 dark:border-slate-700 rounded-xl p-4 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100">{p.drug_name}</h4>
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">{p.is_active === false ? t('inactive') : t('active')}</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{p.dosage || '—'} · {p.frequency || '—'}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('days_count', { count: p.duration_days || 0 })}</p>
            </div>
          ))}
          {activePrescriptions.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">{t('no_data')}</p>}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('reports')}</h3>
          <span className="text-sm text-slate-500 dark:text-slate-400">{t('total_count', { count: reports.length })}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {reports.map(report => (
            <a key={report.id} href={report.file_url} target="_blank" rel="noreferrer" className="border border-slate-100 dark:border-slate-700 rounded-xl p-4 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors">
              <h4 className="font-semibold text-slate-800 dark:text-slate-100">{report.report_type || t('lab_report')}</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('uploaded_on', { date: formatDate(report.uploaded_at) })}</p>
            </a>
          ))}
          {reports.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">{t('no_data')}</p>}
        </div>
      </div>
    </div>
  )
}
