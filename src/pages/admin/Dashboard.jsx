import { Users, ShieldAlert, FileText, MapPin, TrendingUp } from 'lucide-react'
import StatCard from '../../components/shared/StatCard'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts'

// Mock data
const trendData = [
  { month: 'Apr', URI: 42, Hypertension: 28, Malaria: 15, Diabetes: 22, Dermatitis: 10 },
  { month: 'May', URI: 38, Hypertension: 31, Malaria: 18, Diabetes: 25, Dermatitis: 12 },
  { month: 'Jun', URI: 55, Hypertension: 29, Malaria: 22, Diabetes: 24, Dermatitis: 14 },
  { month: 'Jul', URI: 48, Hypertension: 35, Malaria: 30, Diabetes: 27, Dermatitis: 11 },
  { month: 'Aug', URI: 60, Hypertension: 38, Malaria: 28, Diabetes: 30, Dermatitis: 16 },
  { month: 'Sep', URI: 52, Hypertension: 40, Malaria: 20, Diabetes: 32, Dermatitis: 18 },
  { month: 'Oct', URI: 44, Hypertension: 42, Malaria: 12, Diabetes: 35, Dermatitis: 20 },
  { month: 'Nov', URI: 36, Hypertension: 45, Malaria: 8,  Diabetes: 38, Dermatitis: 15 },
  { month: 'Dec', URI: 70, Hypertension: 44, Malaria: 5,  Diabetes: 36, Dermatitis: 22 },
  { month: 'Jan', URI: 65, Hypertension: 48, Malaria: 6,  Diabetes: 40, Dermatitis: 19 },
  { month: 'Feb', URI: 58, Hypertension: 50, Malaria: 9,  Diabetes: 42, Dermatitis: 17 },
  { month: 'Mar', URI: 62, Hypertension: 52, Malaria: 11, Diabetes: 45, Dermatitis: 21 },
]

const riskData = [
  { name: 'Low', value: 2340, color: '#16A34A' },
  { name: 'Moderate', value: 1580, color: '#D97706' },
  { name: 'High', value: 620, color: '#DC2626' },
  { name: 'Critical', value: 280, color: '#7C3AED' },
]

const LINE_COLORS = { URI: '#4F46E5', Hypertension: '#DC2626', Malaria: '#D97706', Diabetes: '#16A34A', Dermatitis: '#8B5CF6' }

const RADIAN = Math.PI / 180
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>{`${(percent * 100).toFixed(0)}%`}</text>
}

// Simple India SVG region map mock
const regions = [
  { name: 'Maharashtra', x: 200, y: 320, count: 820, risk: 'moderate' },
  { name: 'Gujarat', x: 155, y: 275, count: 640, risk: 'low' },
  { name: 'Tamil Nadu', x: 250, y: 450, count: 580, risk: 'high' },
  { name: 'Karnataka', x: 220, y: 400, count: 510, risk: 'moderate' },
  { name: 'Delhi', x: 225, y: 180, count: 490, risk: 'moderate' },
  { name: 'UP', x: 265, y: 200, count: 720, risk: 'high' },
  { name: 'West Bengal', x: 340, y: 270, count: 430, risk: 'low' },
  { name: 'Rajasthan', x: 175, y: 220, count: 380, risk: 'low' },
]
const riskColor = { low: '#16A34A', moderate: '#D97706', high: '#DC2626' }

export default function AdminDashboard() {
  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Admin Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">System-wide health metrics overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Registered Workers" value="4,820" icon={Users} color="indigo" trend="↑ 124 this month" />
        <StatCard title="High Risk Workers" value="900" icon={ShieldAlert} color="red" trend="↑ 18 from last month" />
        <StatCard title="Records This Month" value="1,243" icon={FileText} color="green" />
        <StatCard title="Regions Covered" value="10" icon={MapPin} color="purple" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Disease Trend Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-indigo-500" /> Disease Trends — Last 12 Months
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              {Object.entries(LINE_COLORS).map(([k, c]) => (
                <Line key={k} type="monotone" dataKey={k} stroke={c} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-5">Risk Distribution</h3>
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
                <span className="text-slate-600 dark:text-slate-400">{r.name}</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 ml-auto">{r.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Region Heatmap */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-5">Region Coverage Map</h3>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* SVG India outline map (simplified) */}
          <div className="flex-1 flex items-center justify-center">
            <svg viewBox="100 80 340 440" className="w-full max-w-sm opacity-90" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))' }}>
              {/* Simplified India outline */}
              <path d="M160,100 L200,85 L260,90 L320,105 L370,130 L400,170 L410,210 L400,250 L380,280 L370,320 L360,370 L340,410 L310,440 L290,460 L275,480 L260,470 L245,455 L240,430 L250,400 L260,380 L265,350 L255,320 L240,300 L220,290 L210,310 L200,340 L195,370 L185,390 L170,380 L155,360 L150,330 L160,300 L170,270 L180,240 L175,210 L165,190 L155,165 L145,140 Z"
                fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="2" className="dark:fill-slate-700 dark:stroke-slate-600" />
              {/* Region bubbles */}
              {regions.map(r => (
                <g key={r.name}>
                  <circle cx={r.x} cy={r.y} r={Math.sqrt(r.count / 12)} fill={riskColor[r.risk]} opacity={0.75} />
                  <title>{r.name}: {r.count} workers</title>
                </g>
              ))}
            </svg>
          </div>

          {/* Region legend table */}
          <div className="lg:w-72">
            <div className="space-y-2">
              {regions.sort((a, b) => b.count - a.count).map(r => (
                <div key={r.name} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: riskColor[r.risk] }} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1">{r.name}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{r.count.toLocaleString()}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${r.risk === 'low' ? 'bg-green-100 text-green-700' : r.risk === 'moderate' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{r.risk}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" />Low</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />Moderate</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />High</span>
              <span className="text-slate-300 ml-2">● size = worker count</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
