import { useEffect, useMemo, useState } from 'react'
import { Pill, Clock, CheckCircle2 } from 'lucide-react'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { useAuth } from '../../context/AuthContext'
import { getWorkerByUserId, getWorkerPrescriptions } from '../../lib/queries'

export default function WorkerPrescriptions() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [prescriptions, setPrescriptions] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      try {
        const worker = await getWorkerByUserId(user.id)
        const rows = await getWorkerPrescriptions(worker.id)
        if (!cancelled) setPrescriptions(rows)
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError.message || 'Unable to load prescriptions')
          setPrescriptions([])
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

  const filtered = useMemo(() => {
    if (filter === 'all') return prescriptions
    if (filter === 'active') return prescriptions.filter(p => p.is_active !== false)
    return prescriptions.filter(p => p.is_active === false)
  }, [prescriptions, filter])

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Prescriptions</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">All your medication history</p>
      </div>

      <div className="flex gap-2">
        {['all', 'active', 'completed'].map(value => (
          <button key={value} onClick={() => setFilter(value)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${filter === value ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            {value}
          </button>
        ))}
      </div>

      {error && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(prescription => (
          <div key={prescription.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Pill className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${prescription.is_active === false ? 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                {prescription.is_active === false ? 'Completed' : 'Active'}
              </span>
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{prescription.drug_name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{prescription.dosage || '—'}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{prescription.frequency || '—'}</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{prescription.duration_days || 0} days</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No data available</p>}
      </div>
    </div>
  )
}
