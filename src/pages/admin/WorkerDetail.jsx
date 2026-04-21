import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, FileText, FlaskConical, Pill, UserRound } from 'lucide-react'
import HealthScoreMeter from '../../components/shared/HealthScoreMeter'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { formatDate, getDiagnosisStatusKey, getRiskLevelKey } from '../../lib/helpers'
import { RISK_BADGE_CLASSES } from '../../lib/constants'
import { getWorkerDetailById } from '../../lib/queries'
import { useTranslation } from 'react-i18next'

export default function WorkerDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      try {
        const detail = await getWorkerDetailById(id)
        if (!cancelled) setData(detail)
      } catch (fetchError) {
        if (!cancelled) setError(fetchError.message || t('unable_load_worker_details'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (id) load()

    return () => {
      cancelled = true
    }
  }, [id])

  const worker = data?.worker
  const records = data?.records || []
  const prescriptions = data?.prescriptions || []
  const reports = data?.reports || []

  const riskBadgeClass = useMemo(() => {
    if (!worker?.risk_level) return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
    return RISK_BADGE_CLASSES[worker.risk_level] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
  }, [worker?.risk_level])

  if (loading) {
    return (
      <div className="min-h-[45vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !worker) {
    return (
      <div className="space-y-4 page-enter">
        <Link to="/admin/risk-table" className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          <ArrowLeft className="w-4 h-4" /> {t('back_to_risk_table')}
        </Link>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('unable_load_worker')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{error || t('no_data')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter leading-relaxed">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link to="/admin/risk-table" className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          <ArrowLeft className="w-4 h-4" /> {t('back_to_risk_table')}
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-2xl font-semibold">
            {worker.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{worker.name}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${riskBadgeClass}`}>{t(getRiskLevelKey(worker.risk_level))}</span>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex flex-wrap gap-3">
              <span>{worker.health_id}</span>
              <span>{worker.region || t('unknown_region')}</span>
              <span>{worker.occupation || t('occupation_not_set')}</span>
              <span>{worker.gender || t('gender_not_set')}</span>
              <span>{worker.blood_type || t('blood_type_not_set')}</span>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('last_checkup')}: {formatDate(worker.last_checkup_date)}
            </div>
          </div>
          <HealthScoreMeter score={worker.health_score ?? 0} size={120} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-indigo-500" /> {t('full_medical_history')}
          </h2>
          {records.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('no_data')}</p>
          ) : (
            <div className="space-y-3">
              {records.map(record => (
                <div key={record.id} className="border border-slate-100 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">{(getDiagnosisStatusKey(record.diagnosis) ? t(getDiagnosisStatusKey(record.diagnosis)) : record.diagnosis) || t('diagnosis_not_recorded')}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        <Calendar className="inline w-3.5 h-3.5 mr-1" />
                        {formatDate(record.visit_date)}
                        {record.doctors?.users?.full_name ? ` · ${record.doctors.users.full_name}` : ''}
                      </p>
                    </div>
                    <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-lg">
                      {record.icd10_code || t('not_available')}
                    </span>
                  </div>
                  {record.notes && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{record.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <UserRound className="w-5 h-5 text-indigo-500" /> {t('worker_info')}
          </h2>
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p><span className="text-slate-400">{t('phone')}:</span> {worker.phone || t('not_provided')}</p>
            <p><span className="text-slate-400">{t('preferred_language')}:</span> {worker.preferred_language || 'en'}</p>
            <p><span className="text-slate-400">{t('dob')}:</span> {formatDate(worker.date_of_birth)}</p>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <Pill className="w-5 h-5 text-indigo-500" /> {t('prescriptions')}
          </h2>
          {prescriptions.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('no_data')}</p>
          ) : (
            <div className="space-y-3">
              {prescriptions.map(prescription => (
                <div key={prescription.id} className="border border-slate-100 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-800 dark:text-slate-100">{prescription.drug_name}</p>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full ${prescription.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'}`}>
                      {prescription.is_active ? t('active') : t('inactive')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {prescription.dosage || '—'} · {prescription.frequency || '—'} · {t('days_count', { count: prescription.duration_days || 0 })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <FlaskConical className="w-5 h-5 text-indigo-500" /> {t('reports')}
          </h2>
          {reports.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('no_data')}</p>
          ) : (
            <div className="space-y-3">
              {reports.map(report => (
                <a
                  key={report.id}
                  href={report.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block border border-slate-100 dark:border-slate-700 rounded-xl p-4 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors"
                >
                  <p className="font-medium text-slate-800 dark:text-slate-100">{report.report_type || t('lab_report')}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('uploaded_on', { date: formatDate(report.uploaded_at) })}</p>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
