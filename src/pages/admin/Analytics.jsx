import { useEffect, useMemo, useState } from 'react'
import { Download, Filter } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { getDiseaseTrends, getRiskDistribution } from '../../lib/queries'

const RISK_COLORS = { Low: '#16A34A', Moderate: '#D97706', High: '#DC2626', Critical: '#7C3AED' }

function exportCSV(data, filename) {
  if (!data.length) return
  const keys = Object.keys(data[0])
  const csv = [keys.join(','), ...data.map(row => keys.map(k => row[k]).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

const tooltipStyle = { borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 12 }

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [trends, setTrends] = useState([])
  const [riskDistribution, setRiskDistribution] = useState([])
  const [disease, setDisease] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadAnalytics() {
      setLoading(true)
      setError('')

      try {
        const [trendRows, riskRows] = await Promise.all([
          getDiseaseTrends(12),
          getRiskDistribution(),
        ])

        if (cancelled) return
        setTrends(trendRows)
        setRiskDistribution(riskRows)
      } catch (fetchError) {
        if (!cancelled) setError(fetchError.message || 'Unable to load analytics')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadAnalytics()

    return () => {
      cancelled = true
    }
  }, [])

  const monthlyTotals = useMemo(
    () => trends.map(item => ({ month: item.month, records: item.total })),
    [trends],
  )

  const topDiseases = useMemo(() => {
    const totals = {}

    for (const row of trends) {
      for (const [diagnosis, count] of Object.entries(row.diseases || {})) {
        totals[diagnosis] = (totals[diagnosis] || 0) + count
      }
    }

    return Object.entries(totals)
      .map(([diagnosis, count]) => ({ diagnosis, count }))
      .filter(item => !disease || item.diagnosis.toLowerCase().includes(disease.toLowerCase()))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [trends, disease])

  const pieData = useMemo(
    () => riskDistribution.map(item => ({ ...item, color: RISK_COLORS[item.name] || '#64748B' })),
    [riskDistribution],
  )

  const csvExportData = useMemo(
    () => topDiseases.map(item => ({ diagnosis: item.diagnosis, cases: item.count })),
    [topDiseases],
  )

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Deep-dive into health trends and demographics</p>
        </div>
        <button
          onClick={() => exportCSV(csvExportData, 'healthid-analytics.csv')}
          className="flex items-center gap-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Download className="w-4 h-4" />Export CSV
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <input type="text" value={disease} onChange={e => setDisease(e.target.value)} placeholder="Filter by disease..."
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-36" />
          {disease && (
            <button onClick={() => setDisease('')}
              className="text-sm text-red-500 hover:text-red-700">Clear</button>
          )}
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

      {/* Top 10 Diagnoses Bar Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-5">Top 10 Diagnoses by Frequency</h3>
        {topDiseases.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topDiseases} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="diagnosis" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} width={140} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#EEF2FF' }} />
              <Bar dataKey="count" fill="#4F46E5" radius={[0, 6, 6, 0]} maxBarSize={18} name="Cases" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Disease Trends */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-5">Disease Trends (Last 12 Months)</h3>
        {monthlyTotals.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyTotals} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="records" fill="#2563EB" radius={[6, 6, 0, 0]} name="Records" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Risk Distribution */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-5">Risk Distribution</h3>
        {pieData.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                {pieData.map(item => (
                  <Cell key={item.key} fill={item.color} />
                ))}
              </Pie>
              <Tooltip formatter={value => `${value} workers`} contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
