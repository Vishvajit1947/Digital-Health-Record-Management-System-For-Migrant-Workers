import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Upload, CheckCircle, Thermometer, Weight, Activity, Heart } from 'lucide-react'
import { calculateBMI } from '../../lib/helpers'
import { addHealthRecord, getDoctorIdByUserId } from '../../lib/queries'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

const FREQUENCIES = [
  { value: 'Once daily', labelKey: 'freq_once_daily' },
  { value: 'Twice daily', labelKey: 'freq_twice_daily' },
  { value: 'Thrice daily', labelKey: 'freq_thrice_daily' },
  { value: 'Four times daily', labelKey: 'freq_four_times_daily' },
  { value: 'As needed', labelKey: 'freq_as_needed' },
  { value: 'After meals', labelKey: 'freq_after_meals' },
  { value: 'Before meals', labelKey: 'freq_before_meals' },
]

const emptyPresc = () => ({ drug: '', dosage: '', frequency: 'Once daily', duration: '' })

export default function AddRecord() {
  const { t } = useTranslation()
  const { patientId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
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
    if (!diagnosis.text.trim()) { toast.error(t('diagnosis_required')); return }
    setLoading(true)

    try {
      const doctorId = await getDoctorIdByUserId(user?.id || null)

      if (!doctorId) {
        toast.error('Doctor profile not found. Please contact your administrator.')
        setLoading(false)
        return
      }

      const prescriptionsPayload = prescriptions.filter(p => p.drug.trim()).map(p => ({
        drug_name: p.drug,
        dosage: p.dosage,
        frequency: p.frequency,
        duration_days: parseInt(p.duration, 10) || 0,
        is_active: true,
      }))

      const uploadedReports = []
      for (const file of files) {
        const path = `${patientId}/${Date.now()}_${file.name}`
        const { error: uploadError } = await supabase.storage.from('lab-reports').upload(path, file)
        if (uploadError) throw uploadError
        const { data: publicUrlData } = supabase.storage.from('lab-reports').getPublicUrl(path)
        uploadedReports.push({
          report_type: file.name,
          file_url: publicUrlData.publicUrl,
        })
      }

      const record = await addHealthRecord({
        worker_id: patientId,
        doctor_id: doctorId,
        diagnosis: diagnosis.text,
        icd10_code: diagnosis.icd10,
        notes: diagnosis.notes,
        blood_pressure: [vitals.bp_sys, vitals.bp_dia].filter(Boolean).join('/') || null,
        temperature: vitals.temp || null,
        weight: vitals.weight || null,
        visit_date: new Date().toISOString(),
        prescriptions: prescriptionsPayload,
        reports: uploadedReports,
      })

      if (!record?.id) throw new Error(t('record_save_failed'))

      toast.success(t('record_saved_successfully'))
      navigate(`/doctor/patient/${patientId}`)
    } catch (err) {
      toast.error(err.message || t('unable_save_record'))
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
  const labelCls = "block text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium mb-1.5 leading-relaxed break-words"
  const sectionCls = "bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6"

  return (
    <div className="max-w-3xl mx-auto space-y-6 page-enter pb-12 leading-relaxed">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{t('add_health_record')}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('patient_id')}: <span className="font-mono text-indigo-600 dark:text-indigo-400">{patientId}</span></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1 — Vitals */}
        <div className={sectionCls}>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-5">
            <Activity className="w-5 h-5 text-indigo-500" /> {t('vitals')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>{t('systolic_bp')}</label>
              <div className="relative">
                <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="number" value={vitals.bp_sys} onChange={e => updateVital('bp_sys', e.target.value)}
                  placeholder="120" className={`${inputCls} pl-9`} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">mmHg</p>
            </div>
            <div>
              <label className={labelCls}>{t('diastolic_bp')}</label>
              <input type="number" value={vitals.bp_dia} onChange={e => updateVital('bp_dia', e.target.value)}
                placeholder="80" className={inputCls} />
              <p className="text-xs text-slate-400 mt-0.5">mmHg</p>
            </div>
            <div>
              <label className={labelCls}>{t('temperature')}</label>
              <div className="relative">
                <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="number" step="0.1" value={vitals.temp} onChange={e => updateVital('temp', e.target.value)}
                  placeholder="36.6" className={`${inputCls} pl-9`} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">°C</p>
            </div>
            <div>
              <label className={labelCls}>{t('weight')}</label>
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
                {bmi < 18.5 ? t('bmi_underweight') : bmi < 25 ? t('bmi_normal') : bmi < 30 ? t('bmi_overweight') : t('bmi_obese')}
              </span>
            </div>
          )}
        </div>

        {/* Section 2 — Diagnosis */}
        <div className={sectionCls}>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-5">
            <CheckCircle className="w-5 h-5 text-green-500" /> {t('diagnosis')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>{t('diagnosis')} *</label>
              <textarea value={diagnosis.text} onChange={e => updateDx('text', e.target.value)}
                rows={2} placeholder={t('primary_diagnosis_placeholder')}
                className={`${inputCls} resize-none`} required />
            </div>
            <div>
              <label className={labelCls}>
                {t('icd10')}
                <span className="ml-1 text-slate-400 normal-case">({t('icd10_hint')})</span>
              </label>
              <input type="text" value={diagnosis.icd10} onChange={e => updateDx('icd10', e.target.value)}
                placeholder="J06.9" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('clinical_notes')}</label>
              <textarea value={diagnosis.notes} onChange={e => updateDx('notes', e.target.value)}
                rows={3} placeholder={t('clinical_notes_placeholder')}
                className={`${inputCls} resize-none`} />
            </div>
          </div>
        </div>

        {/* Section 3 — Prescriptions */}
        <div className={sectionCls}>
          <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              💊 {t('prescriptions')}
            </h2>
            <button type="button" onClick={addPresc}
              className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium px-4 py-2">
              <Plus className="w-4 h-4" />{t('add_drug')}
            </button>
          </div>
          <div className="space-y-3">
            {prescriptions.map((p, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="col-span-12 sm:col-span-4">
                  <label className={labelCls}>{t('drug_name')}</label>
                  <input type="text" value={p.drug} onChange={e => updatePresc(i, 'drug', e.target.value)}
                    placeholder={t('drug_name_placeholder')} className={inputCls} />
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <label className={labelCls}>{t('dosage')}</label>
                  <input type="text" value={p.dosage} onChange={e => updatePresc(i, 'dosage', e.target.value)}
                    placeholder="500mg" className={inputCls} />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <label className={labelCls}>{t('frequency')}</label>
                  <select value={p.frequency} onChange={e => updatePresc(i, 'frequency', e.target.value)} className={inputCls}>
                    {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{t(f.labelKey)}</option>)}
                  </select>
                </div>
                <div className="col-span-10 sm:col-span-2">
                  <label className={labelCls}>{t('duration_days')}</label>
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
            <Upload className="w-5 h-5 text-purple-500" /> {t('lab_reports')}
          </h2>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors">
            <Upload className="w-7 h-7 text-slate-400 mb-2" />
            <span className="text-sm text-slate-500 dark:text-slate-400">{t('upload_pdf_images')}</span>
            <span className="text-xs text-slate-400 mt-0.5">{t('upload_hint')}</span>
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
            className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            {t('cancel')}
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-indigo-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? t('saving_record') : t('save_record')}
          </button>
        </div>
      </form>
    </div>
  )
}
