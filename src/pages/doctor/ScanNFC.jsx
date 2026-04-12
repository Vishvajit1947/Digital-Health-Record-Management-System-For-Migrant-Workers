import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Nfc, Search, AlertCircle, User, RotateCcw, ChevronRight, Activity } from 'lucide-react'
import HealthScoreMeter from '../../components/shared/HealthScoreMeter'
import { RISK_BADGE_CLASSES } from '../../lib/constants'
import toast from 'react-hot-toast'

const STATES = { READY: 'ready', SCANNING: 'scanning', FOUND: 'found', NOT_FOUND: 'not_found' }

const mockPatient = {
  id: '1',
  name: 'Ravi Kumar Sharma',
  health_id: 'HW-20240001',
  age: 34,
  blood_type: 'O+',
  region: 'Maharashtra',
  health_score: 72,
  risk_level: 'Low',
  gender: 'Male',
  occupation: 'Construction Worker',
}

export default function ScanNFC() {
  const [scanState, setScanState] = useState(STATES.READY)
  const [patient, setPatient] = useState(null)
  const [manualId, setManualId] = useState('')
  const navigate = useNavigate()

  async function startNFCScan() {
    if (!('NDEFReader' in window)) {
      toast('NFC not supported on this device. Use manual search below.', { icon: '📱' })
      return
    }
    setScanState(STATES.SCANNING)
    try {
      const ndef = new window.NDEFReader()
      await ndef.scan()
      ndef.addEventListener('reading', ({ message }) => {
        const record = message.records[0]
        const decoder = new TextDecoder()
        const token = decoder.decode(record.data)
        lookupPatient(token)
      })
      ndef.addEventListener('readingerror', () => {
        setScanState(STATES.NOT_FOUND)
      })
    } catch (err) {
      setScanState(STATES.NOT_FOUND)
      toast.error('NFC scan failed: ' + err.message)
    }
  }

  function lookupPatient(token) {
    setScanState(STATES.SCANNING)
    // Simulate lookup
    setTimeout(() => {
      if (token || token === 'demo') {
        setPatient(mockPatient)
        setScanState(STATES.FOUND)
      } else {
        setScanState(STATES.NOT_FOUND)
      }
    }, 1500)
  }

  function handleManualSearch(e) {
    e.preventDefault()
    if (!manualId.trim()) return
    lookupPatient(manualId)
  }

  function handleDemoScan() {
    setScanState(STATES.SCANNING)
    setTimeout(() => {
      setPatient(mockPatient)
      setScanState(STATES.FOUND)
    }, 1800)
  }

  function reset() {
    setScanState(STATES.READY)
    setPatient(null)
    setManualId('')
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] page-enter">
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

            <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-2">NFC Patient Scan</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Hold the patient's NFC card near the device to read their health record</p>

            <button
              onClick={handleDemoScan}
              className="w-full bg-indigo-600 text-white rounded-xl px-5 py-3 font-medium hover:bg-indigo-700 transition-colors mb-4"
            >
              Start NFC Scan
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-700" /></div>
              <span className="relative bg-white dark:bg-slate-800 px-3 text-xs text-slate-400">or search manually</span>
            </div>

            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input
                type="text"
                value={manualId}
                onChange={e => setManualId(e.target.value)}
                placeholder="Enter Health ID (e.g. HW-20240001)"
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
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Reading NFC tag...</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Keep the card near the device</p>
          </div>
        )}

        {/* Found state */}
        {scanState === STATES.FOUND && patient && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 page-enter">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Patient Found
              </h2>
              <button onClick={reset} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-semibold">
                {patient.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{patient.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{patient.age}y · {patient.blood_type} · {patient.region}</p>
                <span className="text-xs font-mono bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full mt-1 inline-block">{patient.health_id}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <HealthScoreMeter score={patient.health_score} size={100} />
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Risk Level</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${RISK_BADGE_CLASSES[patient.risk_level]}`}>
                  {patient.risk_level}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate(`/doctor/patient/${patient.id}`)}
                className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl px-5 py-3 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Activity className="w-4 h-4" />
                View Full History
              </button>
              <button
                onClick={() => navigate(`/doctor/add-record/${patient.id}`)}
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl px-5 py-3 text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
                Add New Record
              </button>
            </div>
          </div>
        )}

        {/* Not found state */}
        {scanState === STATES.NOT_FOUND && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-10 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Patient Not Found</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">No patient found for this NFC tag or Health ID</p>
            <button onClick={reset} className="bg-indigo-600 text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
