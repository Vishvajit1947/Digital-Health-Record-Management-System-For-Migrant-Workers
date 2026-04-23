import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { mockWorker } from '../lib/helpers'

export function useWorkerData(workerId) {
  const [worker, setWorker] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!workerId) return
    async function fetchWorker() {
      try {
        const { data, error } = await supabase
          .from('workers')
          .select('*')
          .eq('id', workerId)
          .maybeSingle()
        if (error) throw error
        setWorker(data || mockWorker(workerId))
      } catch {
        setWorker(mockWorker(workerId))
      } finally {
        setLoading(false)
      }
    }
    fetchWorker()
  }, [workerId])

  return { worker, loading, error }
}
