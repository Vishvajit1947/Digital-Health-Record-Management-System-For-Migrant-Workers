import { useState } from 'react'
import { Download, Filter } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, Legend
} from 'recharts'
import { REGIONS } from '../../lib/constants'

const diagnosisData = [
  { diagnosis: 'URI', count: 487 },
  { diagnosis: 'Hypertension', count: 412 },
  { diagnosis: 'Malaria', count: 298 },
  { diagnosis: 'Diabetes', count: 275 },
  { diagnosis: 'Dermatitis', count: 214 },
  { diagnosis: 'Anemia', count: 196 },
  { diagnosis: 'TB (Pulmonary)', count: 143 },
  { diagnosis: 'Back Pain', count: 128 },
  { diagnosis: 'Dengue', count: 115 },
  { diagnosis: 'Asthma', count: 98 },
]

const registrationData = [
  { month: 'Apr \'23', workers: 180 },
  { month: 'May', workers: 240 },
  { month: 'Jun', workers: 310 },
  { month: 'Jul', workers: 280 },
  { month: 'Aug', workers: 420 },
  { month: 'Sep', workers: 380 },
  { month: 'Oct', workers: 450 },
  { month: 'Nov', workers: 520 },
  { month: 'Dec', workers: 490 },
  { month: 'Jan \'24', workers: 610 },
  { month: 'Feb', workers: 580 },
  { month: 'Mar', workers: 750 },
]

const scoreTrendData = [
  { month: 'Apr', Maharashtra: 68, Gujarat: 72, 'Tamil Nadu': 61, Karnataka: 70, Delhi: 65 },
  { month: 'May', Maharashtra: 69, Gujarat: 73, 'Tamil Nadu': 62, Karnataka: 71, Delhi: 66 },
  { month: 'Jun', Maharashtra: 67, Gujarat: 74, 'Tamil Nadu': 60, Karnataka: 69, Delhi: 64 },
  { month: 'Jul', Maharashtra: 70, Gujarat: 75, 'Tamil Nadu': 63, Karnataka: 72, Delhi: 68 },
  { month: 'Aug', Maharashtra: 72, Gujarat: 76, 'Tamil Nadu': 65, Karnataka: 73, Delhi: 70 },
  { month: 'Sep', Maharashtra: 71, Gujarat: 74, 'Tamil Nadu': 64, Karnataka: 74, Delhi: 71 },
  { month: 'Oct', Maharashtra: 73, Gujarat: 77, 'Tamil Nadu': 66, Karnataka: 75, Delhi: 72 },
  { month: 'Nov', Maharashtra: 74, Gujarat: 78, 'Tamil Nadu': 67, Karnataka: 76, Delhi: 73 },
  { month: 'Dec', Maharashtra: 72, Gujarat: 76, 'Tamil Nadu': 65, Karnataka: 74, Delhi: 71 },
  { month: 'Jan', Maharashtra: 75, Gujarat: 79, 'Tamil Nadu': 68, Karnataka: 77, Delhi: 74 },
  { month: 'Feb', Maharashtra: 76, Gujarat: 80, 'Tamil Nadu': 69, Karnataka: 78, Delhi: 75 },
  { month: 'Mar', Maharashtra: 77, Gujarat: 81, 'Tamil Nadu': 70, Karnataka: 79, Delhi: 76 },
]

const REGION_COLORS = ['#4F46E5', '#16A34A', '#D97706', '#DC2626', '#8B5CF6']

function exportCSV(data, filename) {
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
  const [region, setRegion] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [disease, setDisease] = useState('')

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Deep-dive into health trends and demographics</p>
        </div>
        <button
          onClick={() => exportCSV(diagnosisData, 'healthid-analytics.csv')}
          className="flex items-center gap-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Download className="w-4 h-4" />Export CSV
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select value={region} onChange={e => setRegion(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Regions</option>
            {REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <span className="text-slate-400 text-sm">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="text" value={disease} onChange={e => setDisease(e.target.value)} placeholder="Filter by disease..."
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-36" />
          {(region || dateFrom || dateTo || disease) && (
            <button onClick={() => { setRegion(''); setDateFrom(''); setDateTo(''); setDisease('') }}
              className="text-sm text-red-500 hover:text-red-700">Clear</button>
          )}
        </div>
      </div>

      {/* Top 10 Diagnoses Bar Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-5">Top 10 Diagnoses by Frequency</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={diagnosisData.filter(d => !disease || d.diagnosis.toLowerCase().includes(disease.toLowerCase()))} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
            <XAxis type="number" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="diagnosis" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} width={100} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#EEF2FF' }} />
            <Bar dataKey="count" fill="#4F46E5" radius={[0, 6, 6, 0]} maxBarSize={18} name="Cases" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Worker Registration Area Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-5">Worker Registration Over Time</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={registrationData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="workersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="workers" stroke="#4F46E5" strokeWidth={2.5} fill="url(#workersGrad)" name="New Workers" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Health Score Trends per Region */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-5">Health Score Trends by Region</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={scoreTrendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis domain={[55, 85]} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            {['Maharashtra', 'Gujarat', 'Tamil Nadu', 'Karnataka', 'Delhi'].map((r, i) => (
              <Line key={r} type="monotone" dataKey={r} stroke={REGION_COLORS[i]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
