import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { mockHealthRecords } from '../lib/helpers'

export function useHealthRecords(workerId) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!workerId) return
    async function fetch() {
      try {
        const { data, error } = await supabase
          .from('health_records')
          .select('*, doctors(full_name, hospital_name)')
          .eq('worker_id', workerId)
          .order('visit_date', { ascending: false })
        if (error) throw error
        setRecords(data || [])
      } catch {
        setRecords(mockHealthRecords())
      } finally {
        setLoading(false)
      }
    }
    fetch()

    // Realtime subscription
    const channel = supabase
      .channel(`health_records:${workerId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'health_records', filter: `worker_id=eq.${workerId}` },
        payload => {
          if (payload.eventType === 'INSERT') setRecords(prev => [payload.new, ...prev])
        })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [workerId])

  return { records, loading, error }
}
