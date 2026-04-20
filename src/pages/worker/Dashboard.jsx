import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Pill, Calendar, ShieldCheck, Nfc, ExternalLink, Copy, Link2 } from 'lucide-react'
import StatCard from '../../components/shared/StatCard'
import HealthScoreMeter from '../../components/shared/HealthScoreMeter'
import { useAuth } from '../../context/AuthContext'
import { buildPatientNfcUrl, formatDate, mockWorker, mockHealthRecords, mockPrescriptions } from '../../lib/helpers'
import { RISK_BADGE_CLASSES } from '../../lib/constants'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function WorkerDashboard() {
  const { user } = useAuth()
  const [worker, setWorker] = useState(null)
  const [records, setRecords] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [nfcUrl, setNfcUrl] = useState('')

  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    async function loadWorkerData() {
      try {
        const { data: workerRow, error: workerErr } = await supabase
          .from('workers')
          .select('id, user_id, health_id, date_of_birth, gender, blood_type, region, occupation')
          .eq('user_id', user.id)
          .single()

        if (workerErr) throw workerErr

        const { data: userRow } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', workerRow.user_id)
          .single()

        const { data: tokenRow } = await supabase
          .from('nfc_tokens')
          .select('token')
          .eq('worker_id', workerRow.id)
          .single()

        if (cancelled) return

        const workerData = {
          ...workerRow,
          full_name: userRow?.full_name || 'Worker',
          health_score: 72,
          risk_level: 'Low',
        }

        setWorker(workerData)
        setRecords(mockHealthRecords())
        setPrescriptions(mockPrescriptions())
        if (tokenRow?.token) {
          setNfcUrl(buildPatientNfcUrl(tokenRow.token, workerData.full_name))
        }
      } catch {
        const demoWorker = mockWorker(user.id)
        setWorker(demoWorker)
        setRecords(mockHealthRecords())
        setPrescriptions(mockPrescriptions())
        setNfcUrl(buildPatientNfcUrl('demo-token', demoWorker.full_name))
      }
    }

    loadWorkerData()

    return () => {
      cancelled = true
    }
  }, [user])

  async function copyNfcLink() {
    if (!nfcUrl) return
    try {
      await navigator.clipboard.writeText(nfcUrl)
      toast.success('NFC patient URL copied')
    } catch {
      toast.error('Unable to copy NFC URL')
    }
  }

  if (!worker) return null

  const activePrescriptions = prescriptions.filter(p => p.status === 'Active')

  return (
    <div className="space-y-6 page-enter">
      {/* Profile Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar & Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none">
              {worker.full_name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{worker.full_name}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{worker.occupation}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full font-medium">
                  {worker.health_id}
                </span>
                <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-full">
                  {worker.region}
                </span>
              </div>
            </div>
          </div>

          {/* NFC Card visual */}
          <div className="md:ml-auto">
            <div className="w-56 h-32 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-xl shadow-indigo-300/30 dark:shadow-none relative overflow-hidden">
              <div className="absolute top-3 right-3 opacity-20">
                <div className="w-12 h-12 border-2 border-white rounded-full" />
                <div className="w-8 h-8 border-2 border-white rounded-full absolute top-2 left-2" />
              </div>
              <Nfc className="w-6 h-6 mb-3 opacity-80" />
              <p className="text-xs opacity-70 mb-0.5">Health ID</p>
              <p className="text-sm font-mono font-medium tracking-widest">{worker.health_id}</p>
              <p className="text-xs opacity-70 mt-2">{worker.full_name}</p>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={copyNfcLink}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 text-white px-3 py-2 text-xs font-medium hover:bg-indigo-700 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copy NFC URL
              </button>
              <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-700 px-2.5 py-1.5 text-[11px] text-slate-600 dark:text-slate-300 max-w-64 truncate" title={nfcUrl}>
                <Link2 className="w-3.5 h-3.5" />
                {nfcUrl || 'NFC URL not available'}
              </span>
            </div>
          </div>

          {/* Health score */}
          <div className="md:ml-4">
            <HealthScoreMeter score={worker.health_score} size={130} />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Visits" value={records.length} icon={Activity} color="indigo" />
        <StatCard title="Active Prescriptions" value={activePrescriptions.length} icon={Pill} color="green" />
        <StatCard title="Last Visit" value={formatDate(records[0]?.date)} icon={Calendar} color="amber" />
        <StatCard
          title="Health Risk Level"
          value={
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${RISK_BADGE_CLASSES[worker.risk_level]}`}>
              {worker.risk_level}
            </span>
          }
          icon={ShieldCheck}
          color="purple"
        />
      </div>

      {/* Recent Records */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Recent Records</h3>
          <Link to="/worker/records" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
            View all <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                {['Date', 'Doctor', 'Diagnosis', 'ICD-10', 'Action'].map(h => (
                  <th key={h} className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {records.map(r => (
                <tr key={r.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{formatDate(r.date)}</td>
                  <td className="py-3 pr-4 text-slate-800 dark:text-slate-200 font-medium">{r.doctor}</td>
                  <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">{r.diagnosis}</td>
                  <td className="py-3 pr-4">
                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg">{r.icd10}</span>
                  </td>
                  <td className="py-3">
                    <button className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Prescriptions */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Active Prescriptions</h3>
          <Link to="/worker/prescriptions" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {activePrescriptions.map(p => (
            <div key={p.id} className="border border-slate-100 dark:border-slate-700 rounded-xl p-4 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100">{p.drug}</h4>
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">{p.status}</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{p.dosage} · {p.frequency}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{p.duration} days</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
