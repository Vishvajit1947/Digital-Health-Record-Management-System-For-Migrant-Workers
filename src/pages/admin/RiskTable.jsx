import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { RISK_BADGE_CLASSES } from '../../lib/constants'
import { formatDate, getRiskLevelKey } from '../../lib/helpers'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { getAdminRiskTableData } from '../../lib/queries'
import { useTranslation } from 'react-i18next'

const RISK_LEVELS = ['Low', 'Moderate', 'High', 'Critical']
const PAGE_SIZE = 20

export default function RiskTable() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [workers, setWorkers] = useState([])
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [sortKey, setSortKey] = useState('health_score')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false

    async function loadWorkers() {
      setLoading(true)
      setError('')

      try {
        const rows = await getAdminRiskTableData({
          riskLevel: riskFilter.toLowerCase(),
          region: regionFilter,
        })

        if (cancelled) return
        setWorkers(rows)
      } catch (fetchError) {
        if (!cancelled) {
          setWorkers([])
          setError(fetchError.message || t('unable_load_risk_table'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadWorkers()

    return () => {
      cancelled = true
    }
  }, [riskFilter, regionFilter])

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const regions = useMemo(
    () => [...new Set(workers.map(worker => worker.region).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [workers],
  )

  const filtered = workers
    .filter(worker => {
      const matchSearch = !search || worker.name.toLowerCase().includes(search.toLowerCase())
      return matchSearch
    })
    .sort((a, b) => {
      let valueA = a[sortKey]
      let valueB = b[sortKey]

      if (valueA == null) valueA = sortDir === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY
      if (valueB == null) valueB = sortDir === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY

      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase()
        valueB = String(valueB).toLowerCase()
      }

      if (valueA === valueB) return 0
      return sortDir === 'asc' ? (valueA > valueB ? 1 : -1) : (valueA < valueB ? 1 : -1)
    })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const safeTotalPages = Math.max(1, totalPages)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    if (page > safeTotalPages) {
      setPage(safeTotalPages)
    }
  }, [page, safeTotalPages])

  function SortIcon({ col }) {
    if (sortKey !== col) return <ChevronUp className="w-3.5 h-3.5 opacity-30" />
    return sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
  }

  const COLS = [
    { key: 'name', label: t('name') },
    { key: 'health_score', label: t('health_score') },
    { key: 'risk_level', label: t('risk_level') },
    { key: 'last_checkup_date', label: t('last_checkup_date') },
  ]

  return (
    <div className="space-y-6 page-enter leading-relaxed">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{t('risk_table')}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          {t('workers_count', { count: filtered.length.toLocaleString() })} {totalPages > 0 ? `· ${t('page_of', { page, total: safeTotalPages })}` : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-48 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder={t('search_worker_name')}
              className="w-full text-sm bg-transparent text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none" />
          </div>
          <select value={riskFilter} onChange={e => { setRiskFilter(e.target.value); setPage(1) }}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">{t('all_risk_levels')}</option>
            {RISK_LEVELS.map(r => <option key={r}>{t(getRiskLevelKey(r))}</option>)}
          </select>
          <select value={regionFilter} onChange={e => { setRegionFilter(e.target.value); setPage(1) }}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">{t('all_regions')}</option>
            {regions.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {loading && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                {COLS.map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)}
                    className="text-left px-5 py-3.5 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none">
                    <span className="flex items-center gap-1.5">{col.label}<SortIcon col={col.key} /></span>
                  </th>
                ))}
                <th className="px-5 py-3.5 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium text-left">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {!loading && paginated.length === 0 && (
                <tr>
                  <td colSpan={COLS.length + 1} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    {t('no_data')}
                  </td>
                </tr>
              )}
              {paginated.map(worker => (
                <tr key={worker.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200">{worker.name}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{worker.health_score == null ? '—' : worker.health_score}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${RISK_BADGE_CLASSES[worker.risk_level] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{t(getRiskLevelKey(worker.risk_level))}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{formatDate(worker.last_checkup_date)}</td>
                  <td className="px-5 py-3.5">
                    <Link to={`/admin/worker/${worker.id}`} className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">{t('view_details')}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filtered.length === 0 ? t('workers_count', { count: 0 }) : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} ${t('of')} ${filtered.length}`}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-xl text-sm font-medium transition-colors ${page === p ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                  {p}
                </button>
              )
            })}
            <button onClick={() => setPage(p => Math.min(safeTotalPages, p + 1))} disabled={page === safeTotalPages || totalPages === 0}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
