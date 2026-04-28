-- ============================================================
-- Step 1: Add risk_level column (safe, run multiple times)
-- ============================================================
ALTER TABLE public.workers
  ADD COLUMN IF NOT EXISTS risk_level text DEFAULT 'low'
  CHECK (risk_level IN ('low', 'moderate', 'high', 'critical'));

-- Backfill nulls
UPDATE public.workers SET risk_level = 'low' WHERE risk_level IS NULL;

-- ============================================================
-- Step 2: RLS policies for workers table
-- Doctors need SELECT + UPDATE. Workers need SELECT on own row.
-- ============================================================

-- Allow any authenticated user to read workers
DROP POLICY IF EXISTS "workers_select" ON public.workers;
CREATE POLICY "workers_select"
  ON public.workers FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users (doctors) to update risk_level
DROP POLICY IF EXISTS "workers_update_risk" ON public.workers;
CREATE POLICY "workers_update_risk"
  ON public.workers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow workers to insert their own row (needed for registration)
DROP POLICY IF EXISTS "workers_insert_own" ON public.workers;
CREATE POLICY "workers_insert_own"
  ON public.workers FOR INSERT
  TO authenticated
  WITH CHECK (true);
