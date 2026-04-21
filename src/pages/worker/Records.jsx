import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, FileText, Search, Calendar } from 'lucide-react'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../lib/helpers'
import { getWorkerByUserId, getHealthRecords } from '../../lib/queries'

export default function WorkerRecords() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [records, setRecords] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      try {
        const worker = await getWorkerByUserId(user.id)
        const healthRecords = await getHealthRecords(worker.id)
        if (!cancelled) setRecords(healthRecords)
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError.message || 'Unable to load records')
          setRecords([])
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

  const filtered = useMemo(() => records.filter(record => {
    const doctorName = record.doctors?.users?.full_name || ''
    const matchSearch = !search || String(record.diagnosis || '').toLowerCase().includes(search.toLowerCase()) || doctorName.toLowerCase().includes(search.toLowerCase())
    const visitDate = record.visit_date ? new Date(record.visit_date).toISOString().slice(0, 10) : ''
    const matchFrom = !dateFrom || visitDate >= dateFrom
    const matchTo = !dateTo || visitDate <= dateTo
    return matchSearch && matchFrom && matchTo
  }), [records, search, dateFrom, dateTo])

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
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Health Records</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Complete timeline of your medical history</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by diagnosis or doctor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-sm bg-transparent text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <span className="text-slate-400 text-sm">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">{error}</div>}

      <div className="space-y-3">
        {filtered.map(record => (
          <div key={record.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden card-hover">
            <button
              onClick={() => setExpanded(expanded === record.id ? null : record.id)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{record.diagnosis || 'Diagnosis not available'}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(record.visit_date)} · {record.doctors?.users?.full_name || 'Doctor'} · {record.doctors?.hospital_name || 'Hospital not set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg hidden sm:inline">{record.icd10_code || 'N/A'}</span>
                {expanded === record.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>
            </button>

            {expanded === record.id && (
              <div className="border-t border-slate-100 dark:border-slate-700 p-5 space-y-4 bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Notes</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{record.notes || 'No notes available'}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white dark:bg-slate-700/50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Blood pressure</p>
                    <p className="font-medium text-slate-700 dark:text-slate-200">{record.blood_pressure || '—'}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-700/50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Temperature</p>
                    <p className="font-medium text-slate-700 dark:text-slate-200">{record.temperature ?? '—'}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-700/50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Weight</p>
                    <p className="font-medium text-slate-700 dark:text-slate-200">{record.weight ?? '—'}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-700/50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Record ID</p>
                    <p className="font-medium text-slate-700 dark:text-slate-200 font-mono text-xs break-all">{record.id}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No data available</p>
          </div>
        )}
      </div>
    </div>
  )
}
