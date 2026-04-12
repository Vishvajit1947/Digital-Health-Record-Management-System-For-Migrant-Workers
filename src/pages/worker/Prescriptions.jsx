import { useState } from 'react'
import { Pill, Clock, CheckCircle2 } from 'lucide-react'
import { mockPrescriptions } from '../../lib/helpers'

const allPrescriptions = [
  ...mockPrescriptions(),
  { id: '4', drug: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: 90, status: 'Completed' },
  { id: '5', drug: 'Antacid Syrup', dosage: '10ml', frequency: 'After meals', duration: 14, status: 'Completed' },
  { id: '6', drug: 'Vitamin B12', dosage: '1000mcg', frequency: 'Once daily', duration: 30, status: 'Active' },
]

export default function WorkerPrescriptions() {
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? allPrescriptions : allPrescriptions.filter(p => p.status === (filter === 'active' ? 'Active' : 'Completed'))

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Prescriptions</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">All your medication history</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'active', 'completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Pill className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                {p.status}
              </span>
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{p.drug}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{p.dosage}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{p.frequency}</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{p.duration} days</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
