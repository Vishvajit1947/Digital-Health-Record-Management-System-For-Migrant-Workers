import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Nfc } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { BLOOD_TYPES, REGIONS } from '../../lib/constants'
import { buildPatientNfcUrl } from '../../lib/helpers'

const SPECIALIZATIONS = [
  { value: 'General Medicine', key: 'spec_general_medicine' },
  { value: 'Orthopedics', key: 'spec_orthopedics' },
  { value: 'Pulmonology', key: 'spec_pulmonology' },
  { value: 'Dermatology', key: 'spec_dermatology' },
  { value: 'ENT', key: 'spec_ent' },
  { value: 'Cardiology', key: 'spec_cardiology' },
  { value: 'Neurology', key: 'spec_neurology' },
]

export default function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState('')
  const { t } = useTranslation()
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', phone: '',
    // Worker
    dob: '', gender: '', blood_type: '', region: '', occupation: '',
    // Doctor
    license_number: '', specialization: '', hospital_name: '',
  })

  function update(field, val) {
    setForm(f => ({ ...f, [field]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!role) {
      toast.error(t('please_select_role'))
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name, role } }
      })
      if (error) throw error

      const userId = data.user?.id
      if (userId) {
        // 1. Insert into public.users (don't insert email here, it's not in schema)
        const { error: userErr } = await supabase.from('users').insert({ 
          id: userId, 
          full_name: form.full_name, 
          phone: form.phone || null, 
          role 
        })
        if (userErr) throw userErr;

        // 2. Insert into role-specific table
        if (role === 'worker') {
          const health_id = 'W-' + Math.random().toString(36).substring(2, 10).toUpperCase();
          const nfcToken = crypto.randomUUID()
          const { error: workerErr } = await supabase.from('workers').insert({ 
            user_id: userId, 
            health_id: health_id,
            date_of_birth: form.dob || null, 
            gender: form.gender || null, 
            blood_type: form.blood_type || null, 
            region: form.region || null, 
            occupation: form.occupation || null
          })
          if (workerErr) throw workerErr;

          const { data: workerRow, error: workerLookupErr } = await supabase
            .from('workers')
            .select('id')
            .eq('user_id', userId)
            .single()

          if (workerLookupErr) throw workerLookupErr

          const { error: tokenErr } = await supabase.from('nfc_tokens').insert({
            worker_id: workerRow.id,
            token: nfcToken,
            is_active: true,
          })
          if (tokenErr) throw tokenErr

          const nfcUrl = buildPatientNfcUrl(nfcToken, form.full_name)
          toast.success(t('nfc_url_created'))
          toast(nfcUrl, { duration: 7000 })
        } else if (role === 'doctor') {
          const { error: docErr } = await supabase.from('doctors').insert({ 
            user_id: userId, 
            license_number: form.license_number || ('DOC-' + Math.floor(Math.random()*10000)), 
            specialization: form.specialization || null, 
            hospital_name: form.hospital_name || null, 
            region: form.region || null 
          })
          if (docErr) throw docErr;
        }
      }
      toast.success(t('registration_success'))
      navigate('/login')
    } catch (err) {
      toast.error(err.message || t('registration_failed'))
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
  const labelCls = "block text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium mb-1.5 leading-relaxed break-words"

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 py-12 leading-relaxed">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <Nfc className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{t('register_heading')}</h1>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector */}
            <div>
              <label className={labelCls}>{t('register_role_label')}</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'worker', label: t('worker') },
                  { value: 'doctor', label: t('doctor') },
                  { value: 'admin', label: t('administrator') },
                ].map(({ value, label }) => (
                  <button type="button" key={value} onClick={() => setRole(value)}
                    className={`py-3 rounded-xl text-sm font-medium border transition-colors capitalize ${role === value ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Common fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('full_name')}</label>
                <input type="text" value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="Ravi Kumar" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>{t('phone')}</label>
                <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91 9876543210" className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>{t('email')}</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" className={inputCls} required />
            </div>

            <div>
              <label className={labelCls}>{t('password')}</label>
              <input type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder={t('min_8_characters')} className={inputCls} minLength={8} required />
            </div>

            {/* Worker specific */}
            {role === 'worker' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{t('date_of_birth')}</label>
                    <input type="date" value={form.dob} onChange={e => update('dob', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t('gender')}</label>
                    <select value={form.gender} onChange={e => update('gender', e.target.value)} className={inputCls}>
                      <option value="">{t('select')}</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{t('blood_type')}</label>
                    <select value={form.blood_type} onChange={e => update('blood_type', e.target.value)} className={inputCls}>
                      <option value="">{t('select')}</option>
                      {BLOOD_TYPES.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{t('region')}</label>
                    <select value={form.region} onChange={e => update('region', e.target.value)} className={inputCls}>
                      <option value="">{t('select')}</option>
                      {REGIONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t('occupation')}</label>
                  <input type="text" value={form.occupation} onChange={e => update('occupation', e.target.value)} placeholder="e.g. Construction Worker" className={inputCls} />
                </div>
              </>
            )}

            {/* Doctor specific */}
            {role === 'doctor' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{t('license_number')}</label>
                    <input type="text" value={form.license_number} onChange={e => update('license_number', e.target.value)} placeholder="MCI-123456" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t('specialization')}</label>
                    <select value={form.specialization} onChange={e => update('specialization', e.target.value)} className={inputCls}>
                      <option value="">{t('select')}</option>
                      {SPECIALIZATIONS.map(s => <option key={s.value} value={s.value}>{t(s.key)}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t('hospital_name')}</label>
                  <input type="text" value={form.hospital_name} onChange={e => update('hospital_name', e.target.value)} placeholder="City General Hospital" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('region')}</label>
                  <select value={form.region} onChange={e => update('region', e.target.value)} className={inputCls}>
                    <option value="">{t('select')}</option>
                    {REGIONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-xl px-5 py-2.5 font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? t('register_creating') : t('register_cta')}
            </button>
          </form>

          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-4">
            {t('register_have_account')}{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">{t('login')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
