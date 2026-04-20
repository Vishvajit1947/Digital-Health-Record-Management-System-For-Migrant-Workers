export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export function calculateBMI(weight, heightCm) {
  if (!weight || !heightCm) return null
  const heightM = heightCm / 100
  return (weight / (heightM * heightM)).toFixed(1)
}

export function getHealthScoreColor(score) {
  if (score > 70) return '#16A34A'
  if (score >= 40) return '#D97706'
  return '#DC2626'
}

export function getRiskFromScore(score) {
  if (score > 75) return 'Low'
  if (score > 50) return 'Moderate'
  if (score > 25) return 'High'
  return 'Critical'
}

export function generateHealthId() {
  const year = new Date().getFullYear()
  const num = Math.floor(Math.random() * 90000) + 10000
  return `HW-${year}${num}`
}

export function slugifyName(name = '') {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'patient'
}

export function buildPatientNfcUrl(token, patientName, origin = window.location.origin) {
  const safeToken = encodeURIComponent(String(token || '').trim())
  const nameSlug = slugifyName(patientName)
  return `${origin}/patient/${safeToken}/${encodeURIComponent(nameSlug)}`
}

export function extractPatientToken(input = '') {
  const value = String(input || '').trim()
  if (!value) return ''

  try {
    const asUrl = new URL(value)
    const parts = asUrl.pathname.split('/').filter(Boolean)
    const patientIndex = parts.indexOf('patient')
    if (patientIndex >= 0 && parts[patientIndex + 1]) {
      return decodeURIComponent(parts[patientIndex + 1])
    }
  } catch {
    // Not a valid URL, continue with raw token parsing.
  }

  const normalized = value.replace(/^\/+|\/+$/g, '')
  const segments = normalized.split('/')
  const patientIndex = segments.indexOf('patient')
  if (patientIndex >= 0 && segments[patientIndex + 1]) {
    return decodeURIComponent(segments[patientIndex + 1])
  }

  return decodeURIComponent(value)
}

// Mock data generators for demo
export function mockWorker(id = '1') {
  return {
    id,
    full_name: 'Ravi Kumar Sharma',
    health_id: 'HW-20240001',
    region: 'Maharashtra',
    age: 34,
    blood_type: 'O+',
    gender: 'Male',
    occupation: 'Construction Worker',
    health_score: 72,
    risk_level: 'Low',
    height: 170,
    weight: 68,
  }
}

export function mockHealthRecords() {
  return [
    { id: '1', date: '2024-03-15', doctor: 'Dr. Priya Mehta', hospital: 'City Hospital', diagnosis: 'Upper Respiratory Infection', icd10: 'J06.9', notes: 'Prescribed antibiotics for 5 days.' },
    { id: '2', date: '2024-02-10', doctor: 'Dr. Arun Singh', hospital: 'Primary Health Center', diagnosis: 'Hypertension', icd10: 'I10', notes: 'BP: 140/90. Lifestyle modifications advised.' },
    { id: '3', date: '2024-01-05', doctor: 'Dr. Priya Mehta', hospital: 'City Hospital', diagnosis: 'Dermatitis', icd10: 'L30.9', notes: 'Topical corticosteroid cream prescribed.' },
  ]
}

export function mockPrescriptions() {
  return [
    { id: '1', drug: 'Amoxicillin', dosage: '500mg', frequency: 'Thrice daily', duration: 5, status: 'Active' },
    { id: '2', drug: 'Paracetamol', dosage: '650mg', frequency: 'As needed', duration: 3, status: 'Active' },
    { id: '3', drug: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: 30, status: 'Completed' },
  ]
}
