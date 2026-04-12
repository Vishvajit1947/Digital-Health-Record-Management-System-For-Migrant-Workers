import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { User, FileText, Pill, FlaskConical, Calendar, Plus, Download, Shield } from 'lucide-react'
import HealthScoreMeter from '../../components/shared/HealthScoreMeter'
import { formatDate, mockHealthRecords, mockPrescriptions } from '../../lib/helpers'
import { RISK_BADGE_CLASSES } from '../../lib/constants'

const patient = {
  id: '1', name: 'Ravi Kumar Sharma', health_id: 'HW-20240001',
  age: 34, blood_group: 'O+', region: 'Maharashtra', health_score: 72,
  risk_level: 'Low', gender: 'Male', occupation: 'Construction Worker',
}

const visitLogs = [
  { id: '1', date: '2024-03-15', hospital: 'City Hospital', nfc_used: true, doctor: 'Dr. Priya Mehta' },
  { id: '2', date: '2024-02-10', hospital: 'Primary Health Center', nfc_used: false, doctor: 'Dr. Arun Singh' },
  { id: '3', date: '2024-01-05', hospital: 'City Hospital', nfc_used: true, doctor: 'Dr. Priya Mehta' },
]

const labReports = [
  { id: '1', name: 'CBC Report - Mar 2024.pdf', date: '2024-03-15', type: 'Blood Test' },
  { id: '2', name: 'Chest X-Ray - Jan 2024.pdf', date: '2024-01-05', type: 'Radiology' },
]

const TABS = [
  { id: 'history', label: 'Medical History', icon: FileText },
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  { id: 'lab', label: 'Lab Reports', icon: FlaskConical },
  { id: 'visits', label: 'Visit Log', icon: Calendar },
]

export default function PatientDetail() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('history')
  const [prescFilter, setPrescFilter] = useState('all')

  const records = mockHealthRecords()
  const prescriptions = mockPrescriptions()
  const filteredPresc = prescFilter === 'all' ? prescriptions : prescriptions.filter(p => p.status === (prescFilter === 'active' ? 'Active' : 'Completed'))

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-semibold">
            {patient.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{patient.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${RISK_BADGE_CLASSES[patient.risk_level]}`}>{patient.risk_level} Risk</span>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-mono text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full">{patient.health_id}</span>
              <span>{patient.age}y · {patient.gender}</span>
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" />{patient.blood_group}</span>
              <span>{patient.region}</span>
            </div>
          </div>
          <HealthScoreMeter score={patient.health_score} size={110} />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="flex border-b border-slate-100 dark:border-slate-700 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 -mb-px' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Medical History */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {records.map(r => (
                <div key={r.id} className="border border-slate-100 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">{r.diagnosis}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(r.date)} · {r.doctor}</p>
                    </div>
                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg">{r.icd10}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{r.notes}</p>
                </div>
              ))}
            </div>
          )}

          {/* Prescriptions */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                {['all', 'active', 'past'].map(f => (
                  <button key={f} onClick={() => setPrescFilter(f)}
                    className={`px-4 py-1.5 rounded-xl text-sm capitalize ${prescFilter === f ? 'bg-indigo-600 text-white' : 'border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {filteredPresc.map(p => (
                  <div key={p.id} className="border border-slate-100 dark:border-slate-700 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{p.drug}</p>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full ${p.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}>{p.status}</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{p.dosage} · {p.frequency} · {p.duration}d</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lab Reports */}
          {activeTab === 'lab' && (
            <div className="space-y-3">
              {labReports.map(r => (
                <div key={r.id} className="flex items-center justify-between border border-slate-100 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                      <FlaskConical className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{r.name}</p>
                      <p className="text-xs text-slate-400">{r.type} · {formatDate(r.date)}</p>
                    </div>
                  </div>
                  <button className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                    <Download className="w-4 h-4" />Download
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Visit Log */}
          {activeTab === 'visits' && (
            <div className="space-y-3">
              {visitLogs.map(v => (
                <div key={v.id} className="flex items-center justify-between border border-slate-100 dark:border-slate-700 rounded-xl p-4">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">{v.hospital}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(v.date)} · {v.doctor}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${v.nfc_used ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                    {v.nfc_used ? 'NFC' : 'Manual'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <div className="fixed bottom-8 right-8">
        <Link to={`/doctor/add-record/${id}`}
          className="flex items-center gap-2 bg-indigo-600 text-white rounded-2xl px-5 py-3 shadow-xl shadow-indigo-300/30 hover:bg-indigo-700 transition-colors font-medium">
          <Plus className="w-5 h-5" />
          Add Record
        </Link>
      </div>
    </div>
  )
}
