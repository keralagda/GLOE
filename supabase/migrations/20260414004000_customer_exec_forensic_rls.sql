-- Logistics SaaS: Customer Executive API + Forensic Export + RLS
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'customer', 'ops', 'finance', 'compliance');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE finance_side AS ENUM ('buy', 'sell');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE message_scope AS ENUM ('customer', 'internal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE export_type AS ENUM ('standard', 'forensic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS customer_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY,
  role app_role NOT NULL,
  customer_account_id UUID REFERENCES customer_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_dispatch_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_account_id UUID NOT NULL REFERENCES customer_accounts(id) ON DELETE CASCADE,
  dispatch_id UUID NOT NULL REFERENCES dispatches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (customer_account_id, dispatch_id)
);

CREATE TABLE IF NOT EXISTS shipment_finance_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID NOT NULL REFERENCES dispatches(id) ON DELETE CASCADE,
  side finance_side NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permission_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  target_user_id UUID,
  action_type TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shipment_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID NOT NULL REFERENCES dispatches(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES dispatch_milestones(id) ON DELETE SET NULL,
  user_id UUID,
  type TEXT NOT NULL,
  message_scope message_scope NOT NULL DEFAULT 'customer',
  message_text TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE export_requests
  ADD COLUMN IF NOT EXISTS export_type export_type NOT NULL DEFAULT 'standard';

CREATE INDEX IF NOT EXISTS idx_customer_dispatch_access_account ON customer_dispatch_access(customer_account_id, dispatch_id);
CREATE INDEX IF NOT EXISTS idx_finance_entries_dispatch_side ON shipment_finance_entries(dispatch_id, side);
CREATE INDEX IF NOT EXISTS idx_security_events_user_time ON auth_security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_permission_audit_time ON permission_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipment_messages_dispatch_scope ON shipment_messages(dispatch_id, message_scope, created_at DESC);

CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE;

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

ALTER TABLE customer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_dispatch_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_finance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customer accounts are readable by owner or admin" ON customer_accounts;
CREATE POLICY "Customer accounts are readable by owner or admin"
ON customer_accounts FOR SELECT
USING (
  is_current_user_admin()
  OR EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.customer_account_id = customer_accounts.id
  )
);

DROP POLICY IF EXISTS "Customer accounts are service managed" ON customer_accounts;
CREATE POLICY "Customer accounts are service managed"
ON customer_accounts FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "User profiles are readable by self or admin" ON user_profiles;
CREATE POLICY "User profiles are readable by self or admin"
ON user_profiles FOR SELECT
USING (user_id = auth.uid() OR is_current_user_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "User profiles are service managed" ON user_profiles;
CREATE POLICY "User profiles are service managed"
ON user_profiles FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Customer dispatch access is readable by account or admin" ON customer_dispatch_access;
CREATE POLICY "Customer dispatch access is readable by account or admin"
ON customer_dispatch_access FOR SELECT
USING (
  is_current_user_admin()
  OR EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.customer_account_id = customer_dispatch_access.customer_account_id
  )
  OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Customer dispatch access is service managed" ON customer_dispatch_access;
CREATE POLICY "Customer dispatch access is service managed"
ON customer_dispatch_access FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Finance entries are readable with no-leak rules" ON shipment_finance_entries;
CREATE POLICY "Finance entries are readable with no-leak rules"
ON shipment_finance_entries FOR SELECT
USING (
  auth.role() = 'service_role'
  OR is_current_user_admin()
  OR (
    side = 'sell'
    AND EXISTS (
      SELECT 1
      FROM customer_dispatch_access cda
      JOIN user_profiles up ON up.customer_account_id = cda.customer_account_id
      WHERE up.user_id = auth.uid()
        AND cda.dispatch_id = shipment_finance_entries.dispatch_id
    )
  )
);

DROP POLICY IF EXISTS "Finance entries are service managed" ON shipment_finance_entries;
CREATE POLICY "Finance entries are service managed"
ON shipment_finance_entries FOR ALL
USING (auth.role() = 'service_role' OR is_current_user_admin())
WITH CHECK (auth.role() = 'service_role' OR is_current_user_admin());

DROP POLICY IF EXISTS "Security events are admin only" ON auth_security_events;
CREATE POLICY "Security events are admin only"
ON auth_security_events FOR SELECT
USING (auth.role() = 'service_role' OR is_current_user_admin());

DROP POLICY IF EXISTS "Security events are service managed" ON auth_security_events;
CREATE POLICY "Security events are service managed"
ON auth_security_events FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Permission audit logs are admin only" ON permission_audit_logs;
CREATE POLICY "Permission audit logs are admin only"
ON permission_audit_logs FOR SELECT
USING (auth.role() = 'service_role' OR is_current_user_admin());

DROP POLICY IF EXISTS "Permission audit logs are service managed" ON permission_audit_logs;
CREATE POLICY "Permission audit logs are service managed"
ON permission_audit_logs FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Shipment messages are scoped with no-leak rules" ON shipment_messages;
CREATE POLICY "Shipment messages are scoped with no-leak rules"
ON shipment_messages FOR SELECT
USING (
  auth.role() = 'service_role'
  OR is_current_user_admin()
  OR (
    message_scope = 'customer'
    AND EXISTS (
      SELECT 1
      FROM customer_dispatch_access cda
      JOIN user_profiles up ON up.customer_account_id = cda.customer_account_id
      WHERE up.user_id = auth.uid()
        AND cda.dispatch_id = shipment_messages.dispatch_id
    )
  )
);

DROP POLICY IF EXISTS "Shipment messages are service managed" ON shipment_messages;
CREATE POLICY "Shipment messages are service managed"
ON shipment_messages FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Export requests are readable with forensic restrictions" ON export_requests;
CREATE POLICY "Export requests are readable with forensic restrictions"
ON export_requests FOR SELECT
USING (
  auth.role() = 'service_role'
  OR (
    requested_by = auth.uid()
    AND export_type <> 'forensic'
  )
  OR is_current_user_admin()
);

DROP POLICY IF EXISTS "Export requests are writable with forensic restrictions" ON export_requests;
CREATE POLICY "Export requests are writable with forensic restrictions"
ON export_requests FOR ALL
USING (
  auth.role() = 'service_role'
  OR (requested_by = auth.uid() AND export_type <> 'forensic')
  OR is_current_user_admin()
)
WITH CHECK (
  auth.role() = 'service_role'
  OR (requested_by = auth.uid() AND export_type <> 'forensic')
  OR is_current_user_admin()
);

CREATE OR REPLACE VIEW customer_exec_dispatch_view AS
SELECT
  d.id AS dispatch_id,
  d.identifier,
  d.phase,
  d.governance_status,
  d.origin_code,
  d.destination_code,
  d.carrier_name,
  d.completed_at,
  d.created_at,
  d.updated_at,
  dm.name AS current_milestone_name,
  calculate_le(d.actual_lead_time_minutes, d.planned_lead_time_minutes) AS lead_time_efficiency,
  COALESCE(SUM(CASE WHEN sfe.side = 'sell' THEN sfe.amount ELSE 0 END), 0)::NUMERIC(14,2) AS customer_sell_total,
  cda.customer_account_id
FROM customer_dispatch_access cda
JOIN dispatches d ON d.id = cda.dispatch_id
LEFT JOIN dispatch_milestones dm ON dm.id = d.current_milestone_id
LEFT JOIN shipment_finance_entries sfe ON sfe.dispatch_id = d.id
GROUP BY d.id, dm.name, cda.customer_account_id;

CREATE OR REPLACE VIEW customer_exec_metrics_view AS
SELECT
  customer_account_id,
  COUNT(*) AS shipment_count,
  ROUND(AVG(lead_time_efficiency), 2) AS average_lead_time_efficiency,
  COALESCE(SUM(customer_sell_total), 0)::NUMERIC(14,2) AS total_sell_amount
FROM customer_exec_dispatch_view
GROUP BY customer_account_id;

CREATE OR REPLACE VIEW export_audit_trail_view AS
SELECT
  al.dispatch_id,
  d.identifier,
  al.approval_request_id,
  ar.request_type,
  ar.status AS approval_status,
  ar.request_reason,
  ar.decision_reason,
  ar.required_roles,
  ar.four_eyes,
  apr.role,
  apr.user_id,
  apr.comment AS approval_comment,
  apr.created_at AS approval_timestamp,
  al.reason AS audit_reason,
  al.created_at AS audit_timestamp
FROM audit_logs al
JOIN dispatches d ON d.id = al.dispatch_id
LEFT JOIN approval_requests ar ON ar.id = al.approval_request_id
LEFT JOIN approvals_received apr ON apr.request_id = ar.id;

CREATE OR REPLACE VIEW customer_audit_export_view AS
SELECT *
FROM export_audit_trail_view;

CREATE OR REPLACE VIEW forensic_security_view AS
SELECT id, user_id, event_type, status, details, created_at
FROM auth_security_events;

CREATE OR REPLACE VIEW forensic_permissions_view AS
SELECT id, actor_id, target_user_id, action_type, details, created_at
FROM permission_audit_logs;

CREATE OR REPLACE VIEW forensic_data_lineage_view AS
SELECT
  al.id AS audit_log_id,
  al.dispatch_id,
  d.identifier,
  dm.name AS milestone_name,
  al.override_type,
  al.reason,
  al.snapshot,
  al.updater_id,
  al.created_at
FROM audit_logs al
JOIN dispatches d ON d.id = al.dispatch_id
LEFT JOIN dispatch_milestones dm ON dm.id = al.milestone_id;
