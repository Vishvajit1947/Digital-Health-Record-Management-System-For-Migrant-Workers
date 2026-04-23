import { supabase } from './supabaseClient'
import { getRiskFromScore } from './helpers'

const RISK_ORDER = ['low', 'moderate', 'high', 'critical']

function normalizeRiskLevel(riskLevel, score) {
  if (riskLevel) {
    return String(riskLevel).toLowerCase()
  }

  if (score == null || Number.isNaN(Number(score))) {
    return 'low'
  }

  return getRiskFromScore(Number(score)).toLowerCase()
}

function titleCaseRisk(riskLevel) {
  const value = String(riskLevel || 'low').toLowerCase()
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function monthKey(dateValue) {
  const date = new Date(dateValue)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key) {
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-IN', {
    month: 'short',
  })
}

function getLastMonthKeys(months = 12) {
  const keys = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(monthKey(date))
  }

  return keys
}

async function getWorkersBase(region = '') {
  let query = supabase
    .from('workers')
    .select('id, user_id, health_id, region, date_of_birth, created_at')

  if (region) {
    query = query.eq('region', region)
  }

  const { data, error } = await query
  if (error) throw error

  const workers = data || []
  const userIds = workers.map(worker => worker.user_id).filter(Boolean)

  let userMap = new Map()
  if (userIds.length) {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, phone, preferred_language')
      .in('id', userIds)

    if (usersError) throw usersError
    userMap = new Map((users || []).map(user => [user.id, user]))
  }

  return workers.map(worker => ({
    ...worker,
    user_profile: userMap.get(worker.user_id) || null,
  }))
}

async function getLatestHealthScoresByWorker(workerIds) {
  if (!workerIds.length) return new Map()

  const { data, error } = await supabase
    .from('health_scores')
    .select('worker_id, score, risk_level, computed_at')
    .in('worker_id', workerIds)
    .order('computed_at', { ascending: false })

  if (error) throw error

  const scoreMap = new Map()
  for (const item of data || []) {
    if (!scoreMap.has(item.worker_id)) {
      scoreMap.set(item.worker_id, item)
    }
  }

  return scoreMap
}

async function getLatestCheckupByWorker(workerIds) {
  if (!workerIds.length) return new Map()

  const { data, error } = await supabase
    .from('health_records')
    .select('worker_id, visit_date')
    .in('worker_id', workerIds)
    .order('visit_date', { ascending: false })

  if (error) throw error

  const checkupMap = new Map()
  for (const item of data || []) {
    if (!checkupMap.has(item.worker_id)) {
      checkupMap.set(item.worker_id, item.visit_date)
    }
  }

  return checkupMap
}

export async function getTotalWorkers() {
  const { count, error } = await supabase
    .from('workers')
    .select('id', { count: 'exact', head: true })

  if (error) throw error
  return count || 0
}

export async function getHighRiskWorkers(threshold = 70, options = {}) {
  const workers = await getWorkersBase(options.region || '')
  const workerIds = workers.map(worker => worker.id)

  const [scoreMap, checkupMap] = await Promise.all([
    getLatestHealthScoresByWorker(workerIds),
    getLatestCheckupByWorker(workerIds),
  ])

  const rows = workers
    .map(worker => {
      const scoreRow = scoreMap.get(worker.id)
      const score = scoreRow?.score != null ? Number(scoreRow.score) : null
      const riskLevel = normalizeRiskLevel(scoreRow?.risk_level, score)

      return {
        id: worker.id,
        name: worker.user_profile?.full_name || worker.health_id || 'Unknown worker',
        health_id: worker.health_id,
        region: worker.region || 'Unknown',
        health_score: score,
        risk_level: titleCaseRisk(riskLevel),
        risk_level_key: riskLevel,
        last_checkup_date: checkupMap.get(worker.id) || null,
      }
    })
    .filter(worker => {
      const aboveThreshold = worker.health_score != null && worker.health_score > threshold
      const elevatedRisk = worker.risk_level_key === 'high' || worker.risk_level_key === 'critical'
      const matchesRisk = !options.riskLevel || worker.risk_level_key === String(options.riskLevel).toLowerCase()
      return (aboveThreshold || elevatedRisk) && matchesRisk
    })
    .sort((a, b) => {
      const scoreA = a.health_score ?? -1
      const scoreB = b.health_score ?? -1
      return scoreB - scoreA
    })

  if (options.countOnly) {
    return rows.length
  }

  return rows
}

export async function getMonthlyRecords(referenceDate = new Date()) {
  const from = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1).toISOString()
  const to = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1).toISOString()

  const { count, error } = await supabase
    .from('health_records')
    .select('id', { count: 'exact', head: true })
    .gte('visit_date', from)
    .lt('visit_date', to)

  if (error) throw error
  return count || 0
}

export async function getDiseaseTrends(months = 12) {
  const monthKeys = getLastMonthKeys(months)
  const from = new Date(new Date().getFullYear(), new Date().getMonth() - (months - 1), 1).toISOString()

  const { data, error } = await supabase
    .from('health_records')
    .select('visit_date, diagnosis')
    .gte('visit_date', from)

  if (error) throw error

  const grouped = new Map(monthKeys.map(key => [key, { month: monthLabel(key), total: 0, diseases: {} }]))

  for (const record of data || []) {
    if (!record.visit_date) continue
    const key = monthKey(record.visit_date)
    if (!grouped.has(key)) continue

    const bucket = grouped.get(key)
    bucket.total += 1

    const disease = (record.diagnosis || 'Unknown').trim()
    bucket.diseases[disease] = (bucket.diseases[disease] || 0) + 1
  }

  return monthKeys.map(key => grouped.get(key))
}

export async function getRiskDistribution() {
  const workers = await getWorkersBase('')
  const workerIds = workers.map(worker => worker.id)
  const scoreMap = await getLatestHealthScoresByWorker(workerIds)

  const counts = { low: 0, moderate: 0, high: 0, critical: 0 }

  for (const worker of workers) {
    const scoreRow = scoreMap.get(worker.id)
    const score = scoreRow?.score != null ? Number(scoreRow.score) : null
    const normalized = normalizeRiskLevel(scoreRow?.risk_level, score)
    counts[normalized] += 1
  }

  return RISK_ORDER.map(key => ({
    key,
    name: titleCaseRisk(key),
    value: counts[key] || 0,
  }))
}

export async function getDistinctRegionsCount() {
  const { data, error } = await supabase
    .from('workers')
    .select('region')
    .not('region', 'is', null)

  if (error) throw error

  const distinct = new Set((data || []).map(item => item.region).filter(Boolean))
  return distinct.size
}

export async function getAdminDashboardStats() {
  const [totalWorkers, highRiskWorkers, monthlyRecords, regionsCovered] = await Promise.all([
    getTotalWorkers(),
    getHighRiskWorkers(70, { countOnly: true }),
    getMonthlyRecords(),
    getDistinctRegionsCount(),
  ])

  return {
    totalWorkers,
    highRiskWorkers,
    monthlyRecords,
    regionsCovered,
  }
}

export async function getWorkerRegistrationTrends(months = 12) {
  const monthKeys = getLastMonthKeys(months)
  const from = new Date(new Date().getFullYear(), new Date().getMonth() - (months - 1), 1).toISOString()

  const { data, error } = await supabase
    .from('workers')
    .select('created_at')
    .gte('created_at', from)

  if (error) throw error

  const grouped = new Map(monthKeys.map(key => [key, { month: monthLabel(key), workers: 0 }]))

  for (const worker of data || []) {
    if (!worker.created_at) continue
    const key = monthKey(worker.created_at)
    if (!grouped.has(key)) continue
    grouped.get(key).workers += 1
  }

  return monthKeys.map(key => grouped.get(key))
}

export async function getAdminRiskTableData({ riskLevel = '', region = '' } = {}) {
  const workers = await getWorkersBase(region)
  const workerIds = workers.map(worker => worker.id)

  const [scoreMap, checkupMap] = await Promise.all([
    getLatestHealthScoresByWorker(workerIds),
    getLatestCheckupByWorker(workerIds),
  ])

  const rows = workers
    .map(worker => {
      const scoreRow = scoreMap.get(worker.id)
      const score = scoreRow?.score != null ? Number(scoreRow.score) : null
      const riskKey = normalizeRiskLevel(scoreRow?.risk_level, score)

      return {
        id: worker.id,
        name: worker.user_profile?.full_name || worker.health_id || 'Unknown worker',
        health_score: score != null ? Math.round(score) : null,
        risk_level: titleCaseRisk(riskKey),
        risk_level_key: riskKey,
        last_checkup_date: checkupMap.get(worker.id) || null,
        region: worker.region || 'Unknown',
      }
    })
    .filter(worker => !riskLevel || worker.risk_level_key === String(riskLevel).toLowerCase())
    .sort((a, b) => {
      const priority = RISK_ORDER.indexOf(b.risk_level_key) - RISK_ORDER.indexOf(a.risk_level_key)
      if (priority !== 0) return priority
      return (b.health_score ?? -1) - (a.health_score ?? -1)
    })

  return rows
}

export async function getWorkerDetailById(workerId) {
  const { data: worker, error: workerError } = await supabase
    .from('workers')
    .select('id, user_id, health_id, date_of_birth, gender, blood_type, region, occupation')
    .eq('id', workerId)
    .maybeSingle()

  if (workerError) throw workerError
  if (!worker) throw new Error('Worker not found')

  const { data: userProfile, error: userError } = await supabase
    .from('users')
    .select('full_name, phone, preferred_language')
    .eq('id', worker.user_id)
    .maybeSingle()

  if (userError) throw userError

  const { data: scoreRows, error: scoreError } = await supabase
    .from('health_scores')
    .select('score, risk_level, computed_at')
    .eq('worker_id', workerId)
    .order('computed_at', { ascending: false })
    .limit(1)

  if (scoreError) throw scoreError

  const { data: records, error: recordsError } = await supabase
    .from('health_records')
    .select('id, visit_date, diagnosis, icd10_code, notes, doctors(hospital_name, users(full_name))')
    .eq('worker_id', workerId)
    .order('visit_date', { ascending: false })

  if (recordsError) throw recordsError

  const { data: prescriptions, error: prescriptionsError } = await supabase
    .from('prescriptions')
    .select('id, drug_name, dosage, frequency, duration_days, is_active, issued_at')
    .eq('worker_id', workerId)
    .order('issued_at', { ascending: false })

  if (prescriptionsError) throw prescriptionsError

  const { data: reports, error: reportsError } = await supabase
    .from('lab_reports')
    .select('id, report_type, file_url, uploaded_at')
    .eq('worker_id', workerId)
    .order('uploaded_at', { ascending: false })

  if (reportsError) throw reportsError

  const latestScore = scoreRows?.[0]
  const riskLevel = normalizeRiskLevel(latestScore?.risk_level, latestScore?.score)

  return {
    worker: {
      id: worker.id,
      name: userProfile?.full_name || worker.health_id || 'Unknown worker',
      health_id: worker.health_id,
      gender: worker.gender,
      blood_type: worker.blood_type,
      region: worker.region,
      occupation: worker.occupation,
      phone: userProfile?.phone,
      preferred_language: userProfile?.preferred_language,
      date_of_birth: worker.date_of_birth,
      health_score: latestScore?.score != null ? Math.round(Number(latestScore.score)) : null,
      risk_level: titleCaseRisk(riskLevel),
      last_checkup_date: records?.[0]?.visit_date || null,
    },
    records: records || [],
    prescriptions: prescriptions || [],
    reports: reports || [],
  }
}

export async function getWorkerByUserId(userId) {
  if (!userId) throw new Error('user_id is required')

  const { data: worker, error: workerError } = await supabase
    .from('workers')
    .select('id, user_id, health_id, date_of_birth, gender, blood_type, region, occupation')
    .eq('user_id', userId)
    .maybeSingle()

  if (workerError) throw workerError
  if (!worker) throw new Error('Worker profile not found')

  const { data: userProfile, error: userError } = await supabase
    .from('users')
    .select('full_name, phone, preferred_language')
    .eq('id', userId)
    .maybeSingle()

  if (userError) throw userError

  const { data: scoreRows, error: scoreError } = await supabase
    .from('health_scores')
    .select('score, risk_level, computed_at')
    .eq('worker_id', worker.id)
    .order('computed_at', { ascending: false })
    .limit(1)

  if (scoreError) throw scoreError

  const { data: tokenRow, error: tokenError } = await supabase
    .from('nfc_tokens')
    .select('token, is_active, last_used')
    .eq('worker_id', worker.id)
    .maybeSingle()

  if (tokenError) throw tokenError

  const latestScore = scoreRows?.[0]
  const riskLevel = normalizeRiskLevel(latestScore?.risk_level, latestScore?.score)

  return {
    ...worker,
    ...userProfile,
    name: userProfile?.full_name || worker.health_id || 'Unknown worker',
    health_score: latestScore?.score != null ? Math.round(Number(latestScore.score)) : null,
    risk_level: titleCaseRisk(riskLevel),
    nfc_token: tokenRow?.token || null,
    nfc_active: tokenRow?.is_active ?? null,
    nfc_last_used: tokenRow?.last_used || null,
  }
}

export async function getWorkerById(workerId) {
  if (!workerId) throw new Error('worker_id is required')
  const detail = await getWorkerDetailById(workerId)
  return detail.worker
}

export async function getHealthRecords(workerId) {
  if (!workerId) throw new Error('worker_id is required')

  const { data, error } = await supabase
    .from('health_records')
    .select('id, worker_id, doctor_id, visit_date, diagnosis, icd10_code, notes, blood_pressure, temperature, weight, created_at, doctors(hospital_name, users(full_name))')
    .eq('worker_id', workerId)
    .order('visit_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getWorkerPrescriptions(workerId) {
  if (!workerId) throw new Error('worker_id is required')

  const { data, error } = await supabase
    .from('prescriptions')
    .select('id, record_id, worker_id, drug_name, dosage, frequency, duration_days, issued_at, is_active, health_records(visit_date, diagnosis, icd10_code)')
    .eq('worker_id', workerId)
    .order('issued_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getWorkerReports(workerId) {
  if (!workerId) throw new Error('worker_id is required')

  const { data, error } = await supabase
    .from('lab_reports')
    .select('id, worker_id, record_id, report_type, file_url, uploaded_at')
    .eq('worker_id', workerId)
    .order('uploaded_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getWorkerLatestHealthScore(workerId) {
  if (!workerId) throw new Error('worker_id is required')

  const { data, error } = await supabase
    .from('health_scores')
    .select('score, risk_level, computed_at')
    .eq('worker_id', workerId)
    .order('computed_at', { ascending: false })
    .limit(1)

  if (error) throw error
  return data?.[0] || null
}

/**
 * Resolves the doctors.id (PK) from an auth user id.
 * health_records.doctor_id is a FK to doctors.id, NOT auth.users.id.
 * Returns null if no doctor profile exists for this user.
 */
export async function getDoctorIdByUserId(authUserId) {
  if (!authUserId) return null

  const { data, error } = await supabase
    .from('doctors')
    .select('id')
    .eq('user_id', authUserId)
    .maybeSingle()

  if (error) {
    console.error('getDoctorIdByUserId error:', error)
    return null
  }

  return data?.id ?? null
}

export async function getWorkerByNfcToken(token) {
  if (!token) throw new Error('nfc token is required')

  const { data: tokenRow, error: tokenError } = await supabase
    .from('nfc_tokens')
    .select('worker_id, token, is_active, last_used')
    .eq('token', token)
    .maybeSingle()

  if (tokenError) throw tokenError
  if (!tokenRow) throw new Error('NFC token not found')

  const worker = await getWorkerById(tokenRow.worker_id)
  return {
    ...worker,
    nfc_token: tokenRow.token,
    nfc_active: tokenRow.is_active,
    nfc_last_used: tokenRow.last_used,
  }
}

export async function addHealthRecord(data) {
  const recordPayload = {
    worker_id: data.worker_id,
    doctor_id: data.doctor_id || null,
    visit_date: data.visit_date || new Date().toISOString(),
    diagnosis: data.diagnosis,
    icd10_code: data.icd10_code || null,
    notes: data.notes || null,
    blood_pressure: data.blood_pressure || null,
    temperature: data.temperature ?? null,
    weight: data.weight ?? null,
  }

  const { data: record, error } = await supabase
    .from('health_records')
    .insert(recordPayload)
    .select()
    .single()

  if (error) throw error

  if (Array.isArray(data.prescriptions) && data.prescriptions.length > 0) {
    const prescriptionRows = data.prescriptions
      .filter(item => item?.drug_name?.trim())
      .map(item => ({
        worker_id: data.worker_id,
        record_id: record.id,
        drug_name: item.drug_name,
        dosage: item.dosage || null,
        frequency: item.frequency || null,
        duration_days: item.duration_days ?? null,
        is_active: item.is_active ?? true,
      }))

    if (prescriptionRows.length > 0) {
      const { error: prescriptionError } = await supabase.from('prescriptions').insert(prescriptionRows)
      if (prescriptionError) throw prescriptionError
    }
  }

  if (Array.isArray(data.reports) && data.reports.length > 0) {
    const reportRows = data.reports
      .filter(item => item?.file_url)
      .map(item => ({
        worker_id: data.worker_id,
        record_id: record.id,
        report_type: item.report_type || null,
        file_url: item.file_url,
      }))

    if (reportRows.length > 0) {
      const { error: reportError } = await supabase.from('lab_reports').insert(reportRows)
      if (reportError) throw reportError
    }
  }

  return record
}
