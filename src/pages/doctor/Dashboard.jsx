import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Activity, ClipboardList, Stethoscope, ScanLine, Search, ExternalLink } from 'lucide-react'
import StatCard from '../../components/shared/StatCard'
import { formatDate } from '../../lib/helpers'
import { RISK_BADGE_CLASSES } from '../../lib/constants'

const recentPatients = [
  { id: '1', name: 'Ravi Kumar Sharma', health_id: 'HW-20240001', last_visit: '2024-03-15', diagnosis: 'Upper Respiratory Infection', risk: 'Low' },
  { id: '2', name: 'Sunita Devi', health_id: 'HW-20240045', last_visit: '2024-03-15', diagnosis: 'Hypertension', risk: 'Moderate' },
  { id: '3', name: 'Mohammad Iqbal', health_id: 'HW-20230198', last_visit: '2024-03-14', diagnosis: 'Diabetes Type 2', risk: 'High' },
  { id: '4', name: 'Anita Kumari', health_id: 'HW-20230412', last_visit: '2024-03-13', diagnosis: 'Anemia', risk: 'Moderate' },
  { id: '5', name: 'Deepak Verma', health_id: 'HW-20231087', last_visit: '2024-03-12', diagnosis: 'Back Pain', risk: 'Low' },
]

export default function DoctorDashboard() {
  const [searchId, setSearchId] = useState('')
  const navigate = useNavigate()

  function handleSearch(e) {
    e.preventDefault()
    if (searchId.trim()) navigate(`/doctor/patient/${searchId.trim()}`)
  }

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Doctor Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Overview of your patients and activities</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Patients Today" value="8" icon={Users} color="indigo" trend="↑ 2 from yesterday" />
        <StatCard title="Total Patients" value="342" icon={Stethoscope} color="green" />
        <StatCard title="Pending Follow-ups" value="14" icon={ClipboardList} color="amber" />
        <StatCard title="Records This Week" value="23" icon={Activity} color="purple" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/doctor/scan"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl p-6 flex items-center gap-4 transition-colors group card-hover">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <ScanLine className="w-7 h-7" />
          </div>
          <div>
            <p className="font-semibold text-lg">Scan NFC Patient</p>
            <p className="text-indigo-200 text-sm">Tap to start reading NFC card</p>
          </div>
          <ExternalLink className="w-5 h-5 ml-auto opacity-60 group-hover:opacity-100" />
        </Link>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <p className="font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400" /> Search Patient by ID
          </p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              placeholder="e.g. HW-20240001"
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="bg-indigo-600 text-white rounded-xl px-4 py-2.5 text-sm hover:bg-indigo-700 transition-colors">
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Recent Patients */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Recent Patients</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                {['Name', 'Health ID', 'Last Visit', 'Diagnosis', 'Risk', 'Action'].map(h => (
                  <th key={h} className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {recentPatients.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-200">{p.name}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-transparent">{p.health_id}</td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{formatDate(p.last_visit)}</td>
                  <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">{p.diagnosis}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${RISK_BADGE_CLASSES[p.risk]}`}>{p.risk}</span>
                  </td>
                  <td className="py-3">
                    <Link to={`/doctor/patient/${p.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
