import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Nfc, Search, AlertCircle, RotateCcw, ChevronRight, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import { extractPatientToken } from '../../lib/helpers'
import { useTranslation } from 'react-i18next'

const STATES = { READY: 'ready', SCANNING: 'scanning', FOUND: 'found', NOT_FOUND: 'not_found' }

export default function ScanNFC() {
  const { t } = useTranslation()
  const [scanState, setScanState] = useState(STATES.READY)
  const [manualId, setManualId] = useState('')
  const navigate = useNavigate()

  async function startNFCScan() {
    if (!('NDEFReader' in window)) {
      toast(t('nfc_not_supported'), { icon: '📱' })
      return
    }
    setScanState(STATES.SCANNING)
    try {
      const ndef = new window.NDEFReader()
      await ndef.scan()
      ndef.addEventListener('reading', ({ message }) => {
        const record = message.records[0]
        const decoder = new TextDecoder()
        const token = extractPatientToken(decoder.decode(record.data))
        if (token?.trim()) {
          navigate(`/patient/${encodeURIComponent(token.trim())}`)
        } else {
          setScanState(STATES.NOT_FOUND)
        }
      })
      ndef.addEventListener('readingerror', () => {
        setScanState(STATES.NOT_FOUND)
      })
    } catch (err) {
      setScanState(STATES.NOT_FOUND)
      toast.error(`${t('nfc_scan_failed')}: ${err.message}`)
    }
  }

  function handleManualSearch(e) {
    e.preventDefault()
    if (!manualId.trim()) return
    const token = extractPatientToken(manualId)
    if (!token) {
      toast.error(t('enter_valid_nfc'))
      return
    }
    navigate(`/patient/${encodeURIComponent(token)}`)
  }

  function handleDemoScan() {
    navigate('/patient/demo-token/ravi-kumar-sharma')
  }

  function reset() {
    setScanState(STATES.READY)
    setManualId('')
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] page-enter leading-relaxed">
      <div className="w-full max-w-lg">
        {/* Ready state */}
        {scanState === STATES.READY && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-10 text-center">
            <div className="relative inline-flex mb-8">
              <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center relative z-10">
                <Nfc className="w-12 h-12 text-white" />
              </div>
              <span className="absolute inset-0 rounded-full bg-indigo-400/30 animate-ping" />
              <span className="absolute inset-[-12px] rounded-full bg-indigo-400/20 animate-ping" style={{animationDelay:'0.5s'}} />
            </div>

            <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-2">{t('nfc_patient_scan')}</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">{t('nfc_patient_scan_subtitle')}</p>

            <button
              onClick={startNFCScan}
              className="w-full bg-indigo-600 text-white rounded-xl px-4 py-2 font-medium hover:bg-indigo-700 transition-colors mb-4"
            >
              {t('start_nfc_scan')}
            </button>

            <button
              onClick={handleDemoScan}
              className="w-full border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 rounded-xl px-4 py-2 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors mb-4"
            >
              {t('open_demo_patient_link')}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-700" /></div>
              <span className="relative bg-white dark:bg-slate-800 px-3 text-xs text-slate-400">{t('or_search_manually')}</span>
            </div>

            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input
                type="text"
                value={manualId}
                onChange={e => setManualId(e.target.value)}
                placeholder={t('enter_nfc_or_link')}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button type="submit" className="bg-slate-800 dark:bg-slate-600 text-white rounded-xl px-4 py-2.5 text-sm hover:bg-slate-900 dark:hover:bg-slate-500 transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Scanning state */}
        {scanState === STATES.SCANNING && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-10 text-center">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{t('reading_nfc_tag')}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">{t('keep_card_near')}</p>
          </div>
        )}

        {/* Not found state */}
        {scanState === STATES.NOT_FOUND && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-10 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">{t('patient_link_not_found')}</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{t('patient_link_not_found_desc')}</p>
            <button onClick={reset} className="bg-indigo-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors">
              {t('try_again')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
