-- Logistics SaaS: Position Choice Approval Flow
ALTER TABLE dispatch_milestones
  ADD COLUMN IF NOT EXISTS default_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS default_lng DOUBLE PRECISION;

ALTER TABLE dispatches
  ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS pos_is_manual BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE approvals_received
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS position_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID NOT NULL REFERENCES dispatches(id) ON DELETE CASCADE,
  user_id UUID,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_position_history_dispatch_time ON position_history(dispatch_id, created_at DESC);

ALTER TABLE position_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Position history is readable by shipment stakeholders" ON position_history;
CREATE POLICY "Position history is readable by shipment stakeholders"
ON position_history FOR SELECT
USING (
  auth.role() = 'service_role'
  OR is_current_user_admin()
  OR EXISTS (
    SELECT 1
    FROM customer_dispatch_access cda
    JOIN user_profiles up ON up.customer_account_id = cda.customer_account_id
    WHERE up.user_id = auth.uid()
      AND cda.dispatch_id = position_history.dispatch_id
  )
);

DROP POLICY IF EXISTS "Position history is writable by service role" ON position_history;
CREATE POLICY "Position history is writable by service role"
ON position_history FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
