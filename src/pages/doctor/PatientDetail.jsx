import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { User, FileText, Pill, FlaskConical, Calendar, Plus, Download, Shield } from 'lucide-react'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import HealthScoreMeter from '../../components/shared/HealthScoreMeter'
import { formatDate, getDiagnosisStatusKey, getRiskLevelKey } from '../../lib/helpers'
import { RISK_BADGE_CLASSES } from '../../lib/constants'
import { getWorkerById, getWorkerByNfcToken, getHealthRecords, getWorkerPrescriptions, getWorkerReports } from '../../lib/queries'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

export default function PatientDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('history')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [patient, setPatient] = useState(null)
  const [records, setRecords] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [reports, setReports] = useState([])

  useEffect(() => {
    if (!id) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      try {
        let worker
        try {
          worker = await getWorkerById(id)
        } catch {
          worker = await getWorkerByNfcToken(id)
        }

        const [history, prescriptionRows, reportRows] = await Promise.all([
          getHealthRecords(worker.id),
          getWorkerPrescriptions(worker.id),
          getWorkerReports(worker.id),
        ])

        if (cancelled) return

        setPatient(worker)
        setRecords(history)
        setPrescriptions(prescriptionRows)
        setReports(reportRows)
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError.message || t('unable_load_patient_details'))
          setPatient(null)
          setRecords([])
          setPrescriptions([])
          setReports([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [id])

  const filteredPrescriptions = useMemo(() => prescriptions, [prescriptions])

  async function handleRiskChange(e) {
    const raw = e.target.value
    // DB stores lowercase: 'low' | 'moderate' | 'high' | 'critical'
    const newRisk = raw.toLowerCase()
    const prevRisk = patient.risk_level

    // Optimistic update
    setPatient(prev => ({ ...prev, risk_level: raw }))

    const { error: updateError } = await supabase
      .from('workers')
      .update({ risk_level: newRisk })
      .eq('id', patient.id)

    if (updateError) {
      console.error('Risk update error:', JSON.stringify(updateError))
      toast.error(`Failed: ${updateError.message || updateError.code || 'Unknown error'}`)
      setPatient(prev => ({ ...prev, risk_level: prevRisk }))
    } else {
      toast.success('Risk level updated')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[45vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="space-y-6 page-enter">
        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <h1 className="text-lg font-semibold">{t('patient_record_not_found')}</h1>
          <p className="mt-2 text-sm">{error || t('no_data')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter leading-relaxed">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-semibold">
            {patient.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 break-words">{patient.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${RISK_BADGE_CLASSES[patient.risk_level] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>{t(getRiskLevelKey(patient.risk_level))}</span>
              {/* Editable risk level — doctor only */}
              <select
                value={(patient.risk_level || 'low').toLowerCase()}
                onChange={handleRiskChange}
                className="text-xs border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                title="Update risk level"
              >
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-mono text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full">{patient.health_id}</span>
              <span>{patient.gender || '—'}</span>
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" />{patient.blood_type || '—'}</span>
              <span>{patient.region || '—'}</span>
            </div>
          </div>
          <HealthScoreMeter score={Number(patient.health_score || 0)} size={110} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="flex border-b border-slate-100 dark:border-slate-700 overflow-x-auto">
          {[
            { id: 'history', label: t('medical_history'), icon: FileText },
            { id: 'prescriptions', label: t('prescriptions'), icon: Pill },
            { id: 'lab', label: t('lab_reports'), icon: FlaskConical },
            { id: 'visits', label: t('visit_log'), icon: Calendar },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 -mb-px' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'history' && (
            <div className="space-y-4">
              {records.map(record => (
                <div key={record.id} className="border border-slate-100 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100 break-words">{(getDiagnosisStatusKey(record.diagnosis) ? t(getDiagnosisStatusKey(record.diagnosis)) : record.diagnosis) || t('diagnosis_not_recorded')}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(record.visit_date)} · {record.doctors?.users?.full_name || t('doctor_name')}</p>
                    </div>
                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg">{record.icd10_code || t('not_available')}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 break-words">{record.notes || t('no_notes')}</p>
                </div>
              ))}
              {records.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">{t('no_data')}</p>}
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {filteredPrescriptions.map(prescription => (
                  <div key={prescription.id} className="border border-slate-100 dark:border-slate-700 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{prescription.drug_name}</p>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full ${prescription.is_active === false ? 'bg-slate-100 text-slate-500 dark:bg-slate-700' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>{prescription.is_active === false ? t('inactive') : t('active')}</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{prescription.dosage || '—'} · {prescription.frequency || '—'} · {t('days_count_short', { count: prescription.duration_days || 0 })}</p>
                  </div>
                ))}
                {filteredPrescriptions.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">{t('no_data')}</p>}
              </div>
            </div>
          )}

          {activeTab === 'lab' && (
            <div className="space-y-3">
              {reports.map(report => (
                <a key={report.id} href={report.file_url} target="_blank" rel="noreferrer" className="flex items-center justify-between border border-slate-100 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                      <FlaskConical className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{report.report_type || t('lab_report')}</p>
                      <p className="text-xs text-slate-400">{t('uploaded_on', { date: formatDate(report.uploaded_at) })}</p>
                    </div>
                  </div>
                  <button className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                    <Download className="w-4 h-4" />{t('download')}
                  </button>
                </a>
              ))}
              {reports.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">{t('no_data')}</p>}
            </div>
          )}

          {activeTab === 'visits' && (
            <div className="space-y-3">
              {records.map(record => (
                <div key={record.id} className="flex items-center justify-between border border-slate-100 dark:border-slate-700 rounded-xl p-4">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">{record.doctors?.hospital_name || t('clinic')}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(record.visit_date)} · {record.doctors?.users?.full_name || t('doctor_name')}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">{t('visit')}</span>
                </div>
              ))}
              {records.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">{t('no_data')}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-8 right-8">
        <Link to={`/doctor/add-record/${patient.id}`} className="flex items-center gap-2 bg-indigo-600 text-white rounded-2xl px-5 py-3 shadow-xl shadow-indigo-300/30 hover:bg-indigo-700 transition-colors font-medium">
          <Plus className="w-5 h-5" />
          {t('add_record')}
        </Link>
      </div>
    </div>
  )
}
