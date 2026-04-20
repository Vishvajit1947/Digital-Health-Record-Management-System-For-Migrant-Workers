import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { Copy, ExternalLink, HeartPulse, LoaderCircle, LockKeyhole, Mail, Phone, Stethoscope, User, Calendar, FileText, Pill, FlaskConical } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { buildPatientNfcUrl, formatDate, mockHealthRecords, mockPrescriptions, mockWorker, slugifyName } from '../../lib/helpers'
import HealthScoreMeter from '../../components/shared/HealthScoreMeter'
import { RISK_BADGE_CLASSES } from '../../lib/constants'
import toast from 'react-hot-toast'

const ROLE_REDIRECT = { worker: '/worker/dashboard', doctor: '/doctor/dashboard', admin: '/admin/dashboard' }

export default function PatientAccess() {
  const { token, patientName } = useParams()
  const location = useLocation()
  const { session, role, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [patient, setPatient] = useState(null)
  const [records, setRecords] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [healthScore, setHealthScore] = useState(null)

  const patientLink = useMemo(() => {
    const patientLabel = patient?.name || patient?.full_name || patientName || 'patient'
    return buildPatientNfcUrl(token, patientLabel)
  }, [token, patient?.name, patient?.full_name, patientName])

  useEffect(() => {
    if (authLoading) return
    if (!session) return
    if (role && role !== 'doctor') return

    let cancelled = false

    async function loadPatient() {
      setLoading(true)
      setError(null)

      try {
        if (!token || token === 'demo-token' || token === 'demo') {
          if (cancelled) return
          const demoWorker = mockWorker()
          setPatient({
            ...demoWorker,
            name: demoWorker.full_name,
          })
          setRecords(mockHealthRecords())
          setPrescriptions(mockPrescriptions())
          setHealthScore({ score: 72, risk_level: 'Low' })
          return
        }

        const { data: tokenRow, error: tokenError } = await supabase
          .from('nfc_tokens')
          .select('worker_id, token, is_active')
          .eq('token', token)
          .single()

        if (tokenError) throw tokenError
        if (!tokenRow?.is_active) throw new Error('This NFC token is inactive')

        const { data: workerRow, error: workerError } = await supabase
          .from('workers')
          .select('id, user_id, health_id, date_of_birth, gender, blood_type, region, occupation')
          .eq('id', tokenRow.worker_id)
          .single()

        if (workerError) throw workerError

        const { data: userRow, error: userError } = await supabase
          .from('users')
          .select('full_name, phone, preferred_language')
          .eq('id', workerRow.user_id)
          .single()

        if (userError) throw userError

        const { data: scoreRows } = await supabase
          .from('health_scores')
          .select('score, risk_level, computed_at')
          .eq('worker_id', workerRow.id)
          .order('computed_at', { ascending: false })
          .limit(1)

        const { data: recordRows, error: recordError } = await supabase
          .from('health_records')
          .select('id, visit_date, diagnosis, icd10_code, notes, blood_pressure, temperature, weight, doctors(hospital_name, user_id, users(full_name))')
          .eq('worker_id', workerRow.id)
          .order('visit_date', { ascending: false })

        if (recordError) throw recordError

        const { data: prescriptionRows } = await supabase
          .from('prescriptions')
          .select('id, record_id, drug_name, dosage, frequency, duration_days, is_active, issued_at')
          .eq('worker_id', workerRow.id)
          .order('issued_at', { ascending: false })

        await supabase
          .from('nfc_tokens')
          .update({ last_used: new Date().toISOString() })
          .eq('token', token)

        if (cancelled) return
        setPatient({
          ...workerRow,
          ...userRow,
          name: userRow.full_name || 'Patient',
          age: workerRow.date_of_birth ? Math.floor((Date.now() - new Date(workerRow.date_of_birth).getTime()) / 31557600000) : null,
        })
        setHealthScore(scoreRows?.[0] || { score: 72, risk_level: 'Low' })
        setRecords(recordRows || [])
        setPrescriptions(prescriptionRows || [])
      } catch (fetchError) {
        if (cancelled) return
        setError(fetchError.message || 'Unable to load patient record')
        setPatient(null)
        setRecords([])
        setPrescriptions([])
        setHealthScore(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPatient()

    return () => {
      cancelled = true
    }
  }, [authLoading, session, role, token])

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <LoaderCircle className="h-7 w-7 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (role && role !== 'doctor') {
    return <Navigate to={ROLE_REDIRECT[role] || '/'} replace />
  }

  if (!loading && !patient) {
    return (
      <div className="space-y-6 page-enter pb-10">
        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <h1 className="text-lg font-semibold">Patient link not found</h1>
          <p className="mt-2 text-sm">This NFC URL is invalid, expired, or you do not have access to this patient.</p>
          {error && <p className="mt-2 text-sm opacity-90">{error}</p>}
        </div>
      </div>
    )
  }

  async function copyPatientLink() {
    try {
      await navigator.clipboard.writeText(patientLink)
      toast.success('Patient NFC link copied')
    } catch {
      toast.error('Unable to copy link')
    }
  }

  return (
    <div className="space-y-6 page-enter pb-10">
      <div className="rounded-[2rem] border border-slate-200/70 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/90">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white text-2xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none">
              {patient?.name?.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{patient?.name || 'Loading patient'}</h1>
                {healthScore && (
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${RISK_BADGE_CLASSES[(healthScore.risk_level || 'Low')[0].toUpperCase() + (healthScore.risk_level || 'Low').slice(1).toLowerCase()] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
                    {healthScore.risk_level || 'Low'} Risk
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span className="rounded-full bg-indigo-50 px-3 py-1 font-mono text-xs text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">{patient?.health_id || 'Pending link'}</span>
                <span className="rounded-full bg-cyan-50 px-3 py-1 font-mono text-xs text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">/{slugifyName(patient?.name || patient?.full_name || patientName || 'patient')}</span>
                {patient?.gender && <span>{patient.gender}</span>}
                {patient?.region && <span>{patient.region}</span>}
                {patient?.occupation && <span>{patient.occupation}</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={copyPatientLink} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
              <Copy className="h-4 w-4" /> Copy NFC link
            </button>
            <Link to={`/doctor/add-record/${patient?.id || ''}`} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700">
              <ExternalLink className="h-4 w-4" /> Add record
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center rounded-[2rem] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <LoaderCircle className="h-7 w-7 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><User className="h-4 w-4" />Patient</div>
                <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{patient?.full_name || patient?.name}</div>
                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{patient?.age ? `${patient.age} years` : 'Age unavailable'}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><HeartPulse className="h-4 w-4" />Health Score</div>
                <div className="mt-3"><HealthScoreMeter score={Number(healthScore?.score || 72)} size={92} /></div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Mail className="h-4 w-4" />Phone</div>
                <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{patient?.phone || 'Not provided'}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><LockKeyhole className="h-4 w-4" />NFC</div>
                <div className="mt-2 break-all text-sm font-medium text-slate-700 dark:text-slate-200">{patientLink}</div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100"><FileText className="h-5 w-5 text-indigo-600" />Recent Records</div>
              <div className="mt-5 space-y-4">
                {records.length > 0 ? records.map(record => (
                  <div key={record.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{record.diagnosis}</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatDate(record.visit_date)} {record.doctors?.users?.full_name ? `· ${record.doctors.users.full_name}` : ''}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">{record.icd10_code || 'N/A'}</span>
                    </div>
                    {record.notes && <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{record.notes}</p>}
                  </div>
                )) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No records have been added yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100"><Pill className="h-5 w-5 text-indigo-600" />Prescriptions</div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {prescriptions.length > 0 ? prescriptions.map(prescription => (
                  <div key={prescription.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{prescription.drug_name}</div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{prescription.dosage || '—'} · {prescription.frequency || '—'}</div>
                    <div className="mt-1 text-xs text-slate-400">{prescription.duration_days || 0} days</div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No active prescriptions.</p>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100"><FlaskConical className="h-5 w-5 text-indigo-600" />Quick facts</div>
              <div className="mt-5 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between gap-3"><span className="text-slate-500 dark:text-slate-400">Blood type</span><span className="font-medium">{patient?.blood_type || '—'}</span></div>
                <div className="flex items-center justify-between gap-3"><span className="text-slate-500 dark:text-slate-400">Region</span><span className="font-medium">{patient?.region || '—'}</span></div>
                <div className="flex items-center justify-between gap-3"><span className="text-slate-500 dark:text-slate-400">Preferred language</span><span className="font-medium">{patient?.preferred_language || 'en'}</span></div>
                <div className="flex items-center justify-between gap-3"><span className="text-slate-500 dark:text-slate-400">Link status</span><span className="font-medium text-emerald-600 dark:text-emerald-400">Active</span></div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-500/30 dark:bg-indigo-500/10">
              <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Doctor access</div>
              <p className="mt-2 text-sm leading-6 text-indigo-900/80 dark:text-indigo-200/80">Use the unique NFC URL on the card, sign in as a doctor, and you will return to this patient record automatically.</p>
            </div>
          </aside>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {error}
        </div>
      )}
    </div>
  )
}