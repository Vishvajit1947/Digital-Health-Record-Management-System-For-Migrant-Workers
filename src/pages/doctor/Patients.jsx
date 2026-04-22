import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, FileText, Users } from 'lucide-react'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { formatDate } from '../../lib/helpers'
import { supabase } from '../../lib/supabase'

export default function DoctorPatients() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [patients, setPatients] = useState([])
  const [records, setRecords] = useState([])
  const [doctorName, setDoctorName] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadPatients() {
      setLoading(true)
      setError('')

      try {
        const { data } = await supabase.auth.getUser()
        const doctorId = data?.user?.id

        console.log('Doctor ID:', doctorId)

        if (!doctorId) {
          navigate('/login', { replace: true })
          return
        }

        if (!cancelled) {
          setDoctorName(data?.user?.email || 'Doctor')
        }

        const { data: directRecords, error: directRecordsError } = await supabase
          .from('health_records')
          .select('id, worker_id, doctor_id, visit_date, diagnosis')
          .eq('doctor_id', doctorId)
          .order('visit_date', { ascending: false })

        if (directRecordsError) throw directRecordsError

        let effectiveDoctorId = doctorId
        let resolvedRecords = directRecords || []

        if (resolvedRecords.length === 0) {
          const { data: doctorRow, error: doctorRowError } = await supabase
            .from('doctors')
            .select('id, user_id')
            .eq('user_id', doctorId)
            .maybeSingle()

          if (doctorRowError) throw doctorRowError

          if (doctorRow?.id) {
            effectiveDoctorId = doctorRow.id

            const { data: fallbackRecords, error: fallbackRecordsError } = await supabase
              .from('health_records')
              .select('id, worker_id, doctor_id, visit_date, diagnosis')
              .eq('doctor_id', doctorRow.id)
              .order('visit_date', { ascending: false })

            if (fallbackRecordsError) throw fallbackRecordsError
            resolvedRecords = fallbackRecords || []
          }
        }

        console.log('Records:', resolvedRecords)

        if (!cancelled) {
          setRecords(resolvedRecords)
        }

        const uniqueWorkerIds = Array.from(
          new Set((resolvedRecords || []).map(record => record.worker_id).filter(Boolean)),
        )

        const workerMap = new Map()

        if (uniqueWorkerIds.length > 0) {
          const { data: workers, error: workersError } = await supabase
            .from('workers')
            .select('id, health_id, region, user_id, users(full_name)')
            .in('id', uniqueWorkerIds)

          if (workersError) throw workersError

          for (const worker of workers || []) {
            workerMap.set(worker.id, worker)
          }
        }

        const uniquePatients = new Map()

        for (const record of resolvedRecords || []) {
          const worker = workerMap.get(record.worker_id)
          const patientId = worker?.id || record.worker_id

          if (!patientId || uniquePatients.has(patientId)) continue

          uniquePatients.set(patientId, {
            id: patientId,
            name: worker?.users?.full_name || worker?.health_id || 'Unknown patient',
            health_id: worker?.health_id || '—',
            region: worker?.region || '—',
            last_visit: record.visit_date || null,
            diagnosis: record.diagnosis || '—',
          })
        }

        if (!cancelled) {
          setPatients(Array.from(uniquePatients.values()))
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError.message || 'Unable to load patients')
          setPatients([])
          setRecords([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPatients()

    return () => {
      cancelled = true
    }
  }, [navigate])

  const patientCount = patients.length

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter leading-relaxed">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Doctor Portal</p>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">My Patients</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Records assigned to {doctorName}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
            <Users className="h-4 w-4" />
            {patientCount} patients
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {error}
        </div>
      )}

      {!error && records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
            <FileText className="h-7 w-7 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">No patients found</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Patients will appear here after you add or review records for them.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  {['Patient Name', 'Health ID', 'Last Visit', 'Diagnosis', 'Region', 'Action'].map(column => (
                    <th
                      key={column}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {patients.map(patient => (
                  <tr key={patient.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{patient.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{patient.health_id}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(patient.last_visit)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{patient.diagnosis}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{patient.region}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/doctor/patient/${patient.id}`}
                        className="inline-flex items-center rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}