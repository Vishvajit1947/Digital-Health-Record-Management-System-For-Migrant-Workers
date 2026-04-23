import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Copy, ExternalLink, HeartPulse, LoaderCircle,
  LockKeyhole, Mail, User, FileText, Pill, FlaskConical,
} from 'lucide-react'
import { buildPatientNfcUrl, formatDate, slugifyName, getDiagnosisStatusKey, getRiskLevelKey } from '../../lib/helpers'
import HealthScoreMeter from '../../components/shared/HealthScoreMeter'
import { RISK_BADGE_CLASSES } from '../../lib/constants'
import {
  getWorkerByNfcToken, getHealthRecords,
  getWorkerPrescriptions, getWorkerReports, getWorkerLatestHealthScore,
} from '../../lib/queries'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

// NfcPatientGuard in App.jsx guarantees:
//   • auth is fully resolved (loading=false, session exists, role='doctor')
//   • AppLayout is already rendered around this component
// So this component only needs to fetch patient data — no auth checks needed here.

export default function PatientAccess() {
  const { t } = useTranslation()
  const { token, patientName } = useParams()

  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [error, setError] = useState(null)
  const [patient, setPatient] = useState(null)
  const [records, setRecords] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [reports, setReports] = useState([])
  const [healthScore, setHealthScore] = useState(null)

  const patientLink = useMemo(() => {
    return buildPatientNfcUrl(token, patient?.name || patientName || 'patient')
  }, [token, patient?.name, patientName])

  // Runs exactly once — token is stable from URL params.
  useEffect(() => {
    if (!token) { setStatus('error'); setError('No NFC token in URL.'); return }

    let cancelled = false

    async function load() {
      setStatus('loading')
      try {
        const worker = await getWorkerByNfcToken(token)
        const [history, prescriptionRows, reportRows, latestScore] = await Promise.all([
          getHealthRecords(worker.id),
          getWorkerPrescriptions(worker.id),
          getWorkerReports(worker.id),
          getWorkerLatestHealthScore(worker.id),
        ])
        if (cancelled) return
        setPatient(worker)
        setHealthScore(latestScore)
        setRecords(history)
        setPrescriptions(prescriptionRows)
        setReports(reportRows)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setError(err.message || t('unable_load_patient_record'))
        setStatus('error')
      }
    }

    load()
    return () => { cancelled = true }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  async function copyPatientLink() {
    try {
      await navigator.clipboard.writeText(patientLink)
      toast.success(t('toast_patient_link_copied'))
    } catch {
      toast.error(t('toast_copy_failed'))
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <LoaderCircle className="h-7 w-7 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="space-y-6 page-enter pb-10">
        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <h1 className="text-lg font-semibold">{t('patient_link_not_found')}</h1>
          <p className="mt-2 text-sm">{error || t('patient_access_invalid_link')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter pb-10 leading-relaxed">
      {/* Header */}
      <div className="rounded-[2rem] border border-slate-200/70 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/90">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white text-2xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none">
              {patient?.name?.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{patient?.name}</h1>
                {healthScore && (
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${RISK_BADGE_CLASSES[healthScore.risk_level] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
                    {t(getRiskLevelKey(healthScore.risk_level))}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span className="rounded-full bg-indigo-50 px-3 py-1 font-mono text-xs text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">{patient?.health_id || '—'}</span>
                <span className="rounded-full bg-cyan-50 px-3 py-1 font-mono text-xs text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">/{slugifyName(patient?.name || patientName || 'patient')}</span>
                {patient?.gender && <span>{patient.gender}</span>}
                {patient?.region && <span>{patient.region}</span>}
                {patient?.occupation && <span>{patient.occupation}</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={copyPatientLink} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
              <Copy className="h-4 w-4" /> {t('copy_nfc_link')}
            </button>
            <Link to={`/doctor/add-record/${patient?.id || ''}`} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700">
              <ExternalLink className="h-4 w-4" /> {t('add_record')}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Info cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><User className="h-4 w-4" />{t('patient')}</div>
              <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{patient?.name}</div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{patient?.phone || t('phone_unavailable')}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><HeartPulse className="h-4 w-4" />{t('health_score')}</div>
              <div className="mt-3"><HealthScoreMeter score={Number(healthScore?.score || 0)} size={92} /></div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Mail className="h-4 w-4" />{t('email')}</div>
              <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{patient?.email || t('not_provided')}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><LockKeyhole className="h-4 w-4" />NFC</div>
              <div className="mt-2 break-all text-sm font-medium text-slate-700 dark:text-slate-200">{patientLink}</div>
            </div>
          </div>

          {/* Records */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100 mb-5">
              <FileText className="h-5 w-5 text-indigo-600" />{t('recent_records')}
            </div>
            <div className="space-y-4">
              {records.length > 0 ? records.map(record => (
                <div key={record.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {getDiagnosisStatusKey(record.diagnosis) ? t(getDiagnosisStatusKey(record.diagnosis)) : record.diagnosis}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(record.visit_date)}{record.doctors?.users?.full_name ? ` · ${record.doctors.users.full_name}` : ''}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {record.icd10_code || t('not_available')}
                    </span>
                  </div>
                  {record.notes && <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{record.notes}</p>}
                </div>
              )) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('no_records_yet')}</p>
              )}
            </div>
          </div>

          {/* Prescriptions */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100 mb-5">
              <Pill className="h-5 w-5 text-indigo-600" />{t('prescriptions')}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {prescriptions.length > 0 ? prescriptions.map(p => (
                <div key={p.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{p.drug_name}</div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{p.dosage || '—'} · {p.frequency || '—'}</div>
                  <div className="mt-1 text-xs text-slate-400">{t('days_count', { count: p.duration_days || 0 })}</div>
                </div>
              )) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('no_active_prescriptions')}</p>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          {/* Reports */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100 mb-5">
              <FlaskConical className="h-5 w-5 text-indigo-600" />{t('reports')}
            </div>
            <div className="space-y-3">
              {reports.length > 0 ? reports.map(report => (
                <a key={report.id} href={report.file_url} target="_blank" rel="noreferrer"
                  className="block rounded-2xl border border-slate-200 p-4 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{report.report_type || t('lab_report')}</p>
                  <p className="mt-1 text-xs text-slate-400">{t('uploaded_on', { date: formatDate(report.uploaded_at) })}</p>
                </a>
              )) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('no_data')}</p>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-500/30 dark:bg-indigo-500/10">
            <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Doctor access</div>
            <p className="mt-2 text-sm leading-6 text-indigo-900/80 dark:text-indigo-200/80">
              Tap the NFC card, sign in as a doctor, and you will return to this patient record automatically.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
