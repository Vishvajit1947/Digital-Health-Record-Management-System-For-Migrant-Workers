import { useState } from 'react'
import { ChevronDown, ChevronUp, FileText, Search, Calendar } from 'lucide-react'
import { formatDate, mockHealthRecords } from '../../lib/helpers'

const records = [
  ...mockHealthRecords(),
  { id: '4', date: '2023-12-01', doctor: 'Dr. Kavita Rao', hospital: 'Apollo Clinic', diagnosis: 'Malaria (mild)', icd10: 'B50.0', notes: 'Antimalarial treatment started.', prescriptions: [{drug: 'Chloroquine', dosage: '250mg', frequency: 'Twice daily', duration: 7}] },
  { id: '5', date: '2023-11-12', doctor: 'Dr. Arun Singh', hospital: 'Primary Health Center', diagnosis: 'Vitamin D deficiency', icd10: 'E55.9', notes: 'Supplements prescribed for 3 months.', prescriptions: [{drug: 'Vitamin D3', dosage: '60,000 IU', frequency: 'Once weekly', duration: 90}] },
]

export default function WorkerRecords() {
  const [expanded, setExpanded] = useState(null)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filtered = records.filter(r => {
    const matchSearch = !search || r.diagnosis.toLowerCase().includes(search.toLowerCase()) || r.doctor.toLowerCase().includes(search.toLowerCase())
    const matchFrom = !dateFrom || r.date >= dateFrom
    const matchTo = !dateTo || r.date <= dateTo
    return matchSearch && matchFrom && matchTo
  })

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Health Records</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Complete timeline of your medical history</p>
      </div>

      {/* Filter bar */}
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
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <span className="text-slate-400 text-sm">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {filtered.map(r => (
          <div key={r.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden card-hover">
            <button
              onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{r.diagnosis}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(r.date)} · {r.doctor} · {r.hospital}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg hidden sm:inline">{r.icd10}</span>
                {expanded === r.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>
            </button>

            {expanded === r.id && (
              <div className="border-t border-slate-100 dark:border-slate-700 p-5 space-y-4 bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Notes</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{r.notes || '—'}</p>
                </div>
                {r.prescriptions?.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Prescriptions from this visit</p>
                    <div className="flex flex-wrap gap-2">
                      {r.prescriptions.map((p, i) => (
                        <div key={i} className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl px-4 py-2 text-sm">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{p.drug}</span>
                          <span className="text-slate-500 dark:text-slate-400"> · {p.dosage} · {p.frequency} · {p.duration}d</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Lab Reports</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">No lab reports attached.</p>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No records found</p>
          </div>
        )}
      </div>
    </div>
  )
}
