import { useState } from 'react'
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, User, Shield } from 'lucide-react'
import { RISK_BADGE_CLASSES, REGIONS } from '../../lib/constants'
import { formatDate } from '../../lib/helpers'
import HealthScoreMeter from '../../components/shared/HealthScoreMeter'

// Generate mock worker list
const RISK_LEVELS = ['Low', 'Moderate', 'High', 'Critical']
const OCCUPATIONS = ['Construction Worker', 'Migrant Farmer', 'Factory Worker', 'Textile Worker', 'Domestic Worker', 'Sanitation Worker']
function genWorkers(n) {
  return Array.from({ length: n }, (_, i) => {
    const risk = RISK_LEVELS[Math.floor(Math.random() * 4)]
    const score = risk === 'Low' ? 75 + Math.floor(Math.random() * 20) : risk === 'Moderate' ? 50 + Math.floor(Math.random() * 25) : risk === 'High' ? 25 + Math.floor(Math.random() * 25) : Math.floor(Math.random() * 25)
    return {
      id: String(i + 1),
      name: ['Ravi Kumar', 'Sunita Devi', 'Mohammad Iqbal', 'Anita Kumari', 'Deepak Verma', 'Priya Sharma', 'Rajesh Singh', 'Kavita Rao', 'Arun Patel', 'Meena Gupta'][i % 10] + ` #${i + 1}`,
      health_id: `HW-2024${String(i + 1).padStart(4, '0')}`,
      region: REGIONS[i % REGIONS.length],
      age: 20 + (i % 40),
      risk_level: risk,
      last_score: score,
      last_visit: `2024-0${(i % 3) + 1}-${String(1 + (i % 28)).padStart(2, '0')}`,
      occupation: OCCUPATIONS[i % OCCUPATIONS.length],
    }
  })
}
const ALL_WORKERS = genWorkers(120)
const PAGE_SIZE = 20

export default function RiskTable() {
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [sortKey, setSortKey] = useState('last_score')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null)

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = ALL_WORKERS
    .filter(w => {
      const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.health_id.toLowerCase().includes(search.toLowerCase())
      const matchRisk = !riskFilter || w.risk_level === riskFilter
      const matchRegion = !regionFilter || w.region === regionFilter
      return matchSearch && matchRisk && matchRegion
    })
    .sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey]
      if (typeof av === 'string') av = av.toLowerCase(), bv = bv.toLowerCase()
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function SortIcon({ col }) {
    if (sortKey !== col) return <ChevronUp className="w-3.5 h-3.5 opacity-30" />
    return sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
  }

  const COLS = [
    { key: 'name', label: 'Name' },
    { key: 'health_id', label: 'Health ID' },
    { key: 'region', label: 'Region' },
    { key: 'age', label: 'Age' },
    { key: 'risk_level', label: 'Risk Level' },
    { key: 'last_score', label: 'Last Score' },
    { key: 'last_visit', label: 'Last Visit' },
  ]

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Risk Table</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          {filtered.length.toLocaleString()} workers · Page {page} of {totalPages}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-48 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search by name or ID..."
              className="w-full text-sm bg-transparent text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none" />
          </div>
          <select value={riskFilter} onChange={e => { setRiskFilter(e.target.value); setPage(1) }}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Risk Levels</option>
            {RISK_LEVELS.map(r => <option key={r}>{r}</option>)}
          </select>
          <select value={regionFilter} onChange={e => { setRegionFilter(e.target.value); setPage(1) }}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Regions</option>
            {REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>

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
                <th className="px-5 py-3.5 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {paginated.map(w => (
                <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200">{w.name}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">{w.health_id}</td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">{w.region}</td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">{w.age}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${RISK_BADGE_CLASSES[w.risk_level]}`}>{w.risk_level}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${w.last_score}%`, background: w.last_score > 70 ? '#16A34A' : w.last_score >= 40 ? '#D97706' : '#DC2626' }} />
                      </div>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{w.last_score}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{formatDate(w.last_visit)}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => setModal(w)}
                      className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
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
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Worker Detail Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-8 max-w-sm w-full page-enter" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Worker Profile</h2>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-semibold">
                {modal.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{modal.name}</p>
                <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">{modal.health_id}</p>
                <span className={`inline-flex mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${RISK_BADGE_CLASSES[modal.risk_level]}`}>{modal.risk_level} Risk</span>
              </div>
            </div>

            <HealthScoreMeter score={modal.last_score} size={140} />

            <div className="grid grid-cols-2 gap-3 mt-6 text-sm">
              {[['Age', modal.age + ' years'], ['Region', modal.region], ['Occupation', modal.occupation], ['Last Visit', formatDate(modal.last_visit)]].map(([k, v]) => (
                <div key={k} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">{k}</p>
                  <p className="font-medium text-slate-700 dark:text-slate-200">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
