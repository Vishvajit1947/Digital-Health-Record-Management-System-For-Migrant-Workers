import { useEffect, useMemo, useState } from 'react'
import { Users, ShieldAlert, FileText, MapPin, TrendingUp } from 'lucide-react'
import StatCard from '../../components/shared/StatCard'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts'
import { getAdminDashboardStats, getDiseaseTrends, getRiskDistribution } from '../../lib/queries'
import { useTranslation } from 'react-i18next'
import { getRiskLevelKey } from '../../lib/helpers'

const RISK_COLORS = { Low: '#16A34A', Moderate: '#D97706', High: '#DC2626', Critical: '#7C3AED' }

const RADIAN = Math.PI / 180
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>{`${(percent * 100).toFixed(0)}%`}</text>
}

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    totalWorkers: 0,
    highRiskWorkers: 0,
    monthlyRecords: 0,
    regionsCovered: 0,
  })
  const [diseaseTrends, setDiseaseTrends] = useState([])
  const [riskDistribution, setRiskDistribution] = useState([])

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      setError('')

      try {
        const [dashboardStats, trendRows, riskRows] = await Promise.all([
          getAdminDashboardStats(),
          getDiseaseTrends(12),
          getRiskDistribution(),
        ])

        if (cancelled) return
        setStats(dashboardStats)
        setDiseaseTrends(trendRows)
        setRiskDistribution(riskRows)
      } catch (fetchError) {
        if (!cancelled) setError(fetchError.message || t('unable_load_dashboard_data'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  const diseaseSeries = useMemo(() => diseaseTrends.map(row => ({ month: row.month, total: row.total })), [diseaseTrends])

  const riskData = useMemo(
    () => riskDistribution.map(row => ({ ...row, color: RISK_COLORS[row.name] || '#64748B' })),
    [riskDistribution],
  )

  return (
    <div className="space-y-6 page-enter leading-relaxed">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{t('admin_dashboard')}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('admin_dashboard_subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title={t('total_registered_workers')} value={stats.totalWorkers.toLocaleString()} icon={Users} color="indigo" />
        <StatCard title={t('high_risk_workers')} value={stats.highRiskWorkers.toLocaleString()} icon={ShieldAlert} color="red" />
        <StatCard title={t('records_this_month')} value={stats.monthlyRecords.toLocaleString()} icon={FileText} color="green" />
        <StatCard title={t('regions_covered')} value={stats.regionsCovered.toLocaleString()} icon={MapPin} color="purple" />
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        {/* Disease Trend Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-indigo-500" /> {t('disease_trends_last_12_months')}
          </h3>
          {diseaseSeries.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('no_data')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={diseaseSeries} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="total" stroke="#4F46E5" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} name={t('records')} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Risk Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-5">{t('risk_distribution')}</h3>
          {riskData.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('no_data')}</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={riskData} cx="50%" cy="50%" outerRadius={85} dataKey="value" labelLine={false} label={<CustomLabel />}>
                    {riskData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v.toLocaleString()} workers`, n]} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {riskData.map(r => (
                  <div key={r.name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: r.color }} />
                    <span className="text-slate-600 dark:text-slate-400">{t(getRiskLevelKey(r.name))}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 ml-auto">{r.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
