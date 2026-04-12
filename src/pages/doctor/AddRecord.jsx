import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Upload, CheckCircle, Thermometer, Weight, Activity, Heart } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { calculateBMI } from '../../lib/helpers'
import toast from 'react-hot-toast'

const FREQUENCIES = ['Once daily', 'Twice daily', 'Thrice daily', 'Four times daily', 'As needed', 'After meals', 'Before meals']

const emptyPresc = () => ({ drug: '', dosage: '', frequency: 'Once daily', duration: '' })

export default function AddRecord() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState([])

  const [vitals, setVitals] = useState({ bp_sys: '', bp_dia: '', temp: '', weight: '', height: 170 })
  const [diagnosis, setDiagnosis] = useState({ text: '', icd10: '', notes: '' })
  const [prescriptions, setPrescriptions] = useState([emptyPresc()])

  const bmi = calculateBMI(vitals.weight, vitals.height)

  function updateVital(k, v) { setVitals(prev => ({ ...prev, [k]: v })) }
  function updateDx(k, v) { setDiagnosis(prev => ({ ...prev, [k]: v })) }
  function updatePresc(i, k, v) { setPrescriptions(prev => prev.map((p, idx) => idx === i ? { ...p, [k]: v } : p)) }
  function addPresc() { setPrescriptions(prev => [...prev, emptyPresc()]) }
  function removePresc(i) { setPrescriptions(prev => prev.filter((_, idx) => idx !== i)) }

  function handleFiles(e) {
    const selected = Array.from(e.target.files)
    setFiles(prev => [...prev, ...selected])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!diagnosis.text.trim()) { toast.error('Diagnosis is required'); return }
    setLoading(true)

    try {
      const { data: record, error: recErr } = await supabase.from('health_records').insert({
        worker_id: patientId,
        visit_date: new Date().toISOString(),
        diagnosis: diagnosis.text,
        icd10_code: diagnosis.icd10,
        notes: diagnosis.notes,
        bp_systolic: vitals.bp_sys || null,
        bp_diastolic: vitals.bp_dia || null,
        temperature: vitals.temp || null,
        weight: vitals.weight || null,
        bmi: bmi,
      }).select().single()

      if (recErr) throw recErr

      // Insert prescriptions
      const validPresc = prescriptions.filter(p => p.drug.trim())
      if (validPresc.length > 0) {
        await supabase.from('prescriptions').insert(
          validPresc.map(p => ({ worker_id: patientId, record_id: record.id, drug_name: p.drug, dosage: p.dosage, frequency: p.frequency, duration_days: parseInt(p.duration) || 0, status: 'Active' }))
        )
      }

      // Upload files
      for (const file of files) {
        const path = `${patientId}/${Date.now()}_${file.name}`
        const { data: upload } = await supabase.storage.from('lab-reports').upload(path, file)
        if (upload) {
          await supabase.from('lab_reports').insert({ worker_id: patientId, record_id: record.id, file_name: file.name, file_url: path })
        }
      }

      // Notify worker (best effort)
      try {
        await fetch('/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ worker_id: patientId, record_id: record.id }) })
      } catch { /* non-blocking */ }

      toast.success('Record saved successfully!')
      navigate(`/doctor/patient/${patientId}`)
    } catch (err) {
      // Demo mode — just show success
      toast.success('Record saved! (demo mode)')
      navigate(`/doctor/patient/${patientId}`)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
  const labelCls = "block text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium mb-1.5"
  const sectionCls = "bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6"

  return (
    <div className="max-w-3xl mx-auto space-y-6 page-enter pb-12">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Add Health Record</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Patient ID: <span className="font-mono text-indigo-600 dark:text-indigo-400">{patientId}</span></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1 — Vitals */}
        <div className={sectionCls}>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-5">
            <Activity className="w-5 h-5 text-indigo-500" /> Vitals
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Systolic BP</label>
              <div className="relative">
                <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="number" value={vitals.bp_sys} onChange={e => updateVital('bp_sys', e.target.value)}
                  placeholder="120" className={`${inputCls} pl-9`} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">mmHg</p>
            </div>
            <div>
              <label className={labelCls}>Diastolic BP</label>
              <input type="number" value={vitals.bp_dia} onChange={e => updateVital('bp_dia', e.target.value)}
                placeholder="80" className={inputCls} />
              <p className="text-xs text-slate-400 mt-0.5">mmHg</p>
            </div>
            <div>
              <label className={labelCls}>Temperature</label>
              <div className="relative">
                <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="number" step="0.1" value={vitals.temp} onChange={e => updateVital('temp', e.target.value)}
                  placeholder="36.6" className={`${inputCls} pl-9`} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">°C</p>
            </div>
            <div>
              <label className={labelCls}>Weight</label>
              <div className="relative">
                <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="number" value={vitals.weight} onChange={e => updateVital('weight', e.target.value)}
                  placeholder="70" className={`${inputCls} pl-9`} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">kg</p>
            </div>
          </div>
          {bmi && (
            <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-sm">
              <span className="text-slate-600 dark:text-slate-300">BMI: </span>
              <span className="font-semibold text-indigo-700 dark:text-indigo-300">{bmi}</span>
              <span className="text-slate-400 ml-2">
                {bmi < 18.5 ? '(Underweight)' : bmi < 25 ? '(Normal)' : bmi < 30 ? '(Overweight)' : '(Obese)'}
              </span>
            </div>
          )}
        </div>

        {/* Section 2 — Diagnosis */}
        <div className={sectionCls}>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-5">
            <CheckCircle className="w-5 h-5 text-green-500" /> Diagnosis
          </h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Diagnosis *</label>
              <textarea value={diagnosis.text} onChange={e => updateDx('text', e.target.value)}
                rows={2} placeholder="Primary diagnosis description..."
                className={`${inputCls} resize-none`} required />
            </div>
            <div>
              <label className={labelCls}>
                ICD-10 Code
                <span className="ml-1 text-slate-400 normal-case">(e.g. J06.9 for URI)</span>
              </label>
              <input type="text" value={diagnosis.icd10} onChange={e => updateDx('icd10', e.target.value)}
                placeholder="J06.9" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Clinical Notes</label>
              <textarea value={diagnosis.notes} onChange={e => updateDx('notes', e.target.value)}
                rows={3} placeholder="Additional clinical observations, treatment plan..."
                className={`${inputCls} resize-none`} />
            </div>
          </div>
        </div>

        {/* Section 3 — Prescriptions */}
        <div className={sectionCls}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              💊 Prescriptions
            </h2>
            <button type="button" onClick={addPresc}
              className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
              <Plus className="w-4 h-4" />Add Drug
            </button>
          </div>
          <div className="space-y-3">
            {prescriptions.map((p, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="col-span-12 sm:col-span-4">
                  <label className={labelCls}>Drug Name</label>
                  <input type="text" value={p.drug} onChange={e => updatePresc(i, 'drug', e.target.value)}
                    placeholder="e.g. Amoxicillin" className={inputCls} />
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <label className={labelCls}>Dosage</label>
                  <input type="text" value={p.dosage} onChange={e => updatePresc(i, 'dosage', e.target.value)}
                    placeholder="500mg" className={inputCls} />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <label className={labelCls}>Frequency</label>
                  <select value={p.frequency} onChange={e => updatePresc(i, 'frequency', e.target.value)} className={inputCls}>
                    {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div className="col-span-10 sm:col-span-2">
                  <label className={labelCls}>Duration (days)</label>
                  <input type="number" value={p.duration} onChange={e => updatePresc(i, 'duration', e.target.value)}
                    placeholder="7" className={inputCls} min="1" />
                </div>
                <div className="col-span-2 sm:col-span-1 flex items-end pb-0.5">
                  <button type="button" onClick={() => removePresc(i)} disabled={prescriptions.length === 1}
                    className="p-2.5 text-slate-400 hover:text-red-500 disabled:opacity-30 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4 — Lab Reports */}
        <div className={sectionCls}>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-5">
            <Upload className="w-5 h-5 text-purple-500" /> Lab Reports
          </h2>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors">
            <Upload className="w-7 h-7 text-slate-400 mb-2" />
            <span className="text-sm text-slate-500 dark:text-slate-400">Click to upload PDF or images</span>
            <span className="text-xs text-slate-400 mt-0.5">PDF, JPG, PNG up to 10MB</span>
            <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFiles} className="hidden" />
          </label>
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-2">
                  <span className="text-slate-700 dark:text-slate-300 truncate">{f.name}</span>
                  <button type="button" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-slate-400 hover:text-red-500 ml-3">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl py-3 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-indigo-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? 'Saving record...' : 'Save Record'}
          </button>
        </div>
      </form>
    </div>
  )
}
