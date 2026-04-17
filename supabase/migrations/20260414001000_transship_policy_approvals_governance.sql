-- Logistics SaaS: Transshipment + Policy + Approvals + Governance Pivot
ALTER TYPE override_type ADD VALUE IF NOT EXISTS 'transshipment_update';
ALTER TYPE override_type ADD VALUE IF NOT EXISTS 'approval_resolution';
ALTER TYPE override_type ADD VALUE IF NOT EXISTS 'governance_hold';

DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE governance_status AS ENUM ('clear', 'pending_approval', 'correction_required', 'data_mismatch');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE policy_scope AS ENUM ('dispatch', 'transshipment', 'approval', 'governance');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE policy_action AS ENUM ('require_approval', 'flag', 'block');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE dispatches
  ADD COLUMN IF NOT EXISTS origin_code TEXT,
  ADD COLUMN IF NOT EXISTS destination_code TEXT,
  ADD COLUMN IF NOT EXISTS carrier_name TEXT,
  ADD COLUMN IF NOT EXISTS phase TEXT NOT NULL DEFAULT 'dispatch',
  ADD COLUMN IF NOT EXISTS planned_lead_time_minutes NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS actual_lead_time_minutes NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS governance_status governance_status NOT NULL DEFAULT 'clear',
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS active_approval_id UUID;

CREATE TABLE IF NOT EXISTS transshipment_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID NOT NULL REFERENCES dispatches(id) ON DELETE CASCADE,
  parent_leg_id UUID REFERENCES transshipment_legs(id) ON DELETE CASCADE,
  leg_order INTEGER NOT NULL,
  port_code TEXT,
  port_name TEXT NOT NULL,
  arrived_at TIMESTAMPTZ,
  sailed_at TIMESTAMPTZ,
  governance_status governance_status NOT NULL DEFAULT 'clear',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (dispatch_id, parent_leg_id, leg_order),
  CHECK (leg_order > 0),
  CHECK (sailed_at IS NULL OR (arrived_at IS NOT NULL AND sailed_at >= arrived_at))
);

CREATE TABLE IF NOT EXISTS policy_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_code TEXT NOT NULL UNIQUE,
  scope policy_scope NOT NULL,
  action policy_action NOT NULL,
  applies_to_milestone_id UUID REFERENCES dispatch_milestones(id) ON DELETE SET NULL,
  condition JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS milestone_policy_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES dispatch_milestones(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES policy_rules(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (milestone_id, policy_id)
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID NOT NULL REFERENCES dispatches(id) ON DELETE CASCADE,
  transshipment_leg_id UUID REFERENCES transshipment_legs(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES policy_rules(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  request_reason TEXT NOT NULL,
  status approval_status NOT NULL DEFAULT 'pending',
  decision_reason TEXT,
  decided_by UUID,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE dispatches
  DROP CONSTRAINT IF EXISTS dispatches_active_approval_id_fkey,
  ADD CONSTRAINT dispatches_active_approval_id_fkey
    FOREIGN KEY (active_approval_id) REFERENCES approval_requests(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS governance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID NOT NULL REFERENCES dispatches(id) ON DELETE CASCADE,
  transshipment_leg_id UUID REFERENCES transshipment_legs(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES policy_rules(id) ON DELETE SET NULL,
  approval_request_id UUID REFERENCES approval_requests(id) ON DELETE SET NULL,
  event_type governance_status NOT NULL,
  severity SMALLINT NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 3),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  raised_by UUID,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS transshipment_leg_id UUID REFERENCES transshipment_legs(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS approval_request_id UUID REFERENCES approval_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS governance_event_id UUID REFERENCES governance_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS snapshot JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION set_row_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_transshipment_leg()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.arrived_at IS NOT NULL AND NEW.arrived_at > (CURRENT_TIMESTAMP + INTERVAL '5 minutes') THEN
    RAISE EXCEPTION 'Future arrival timestamps not allowed. Max grace is 5 minutes.';
  END IF;

  IF NEW.sailed_at IS NOT NULL AND NEW.sailed_at > (CURRENT_TIMESTAMP + INTERVAL '5 minutes') THEN
    RAISE EXCEPTION 'Future sailing timestamps not allowed. Max grace is 5 minutes.';
  END IF;

  IF NEW.sailed_at IS NOT NULL AND NEW.arrived_at IS NULL THEN
    RAISE EXCEPTION 'Sailed timestamp requires a matching arrival timestamp.';
  END IF;

  IF NEW.parent_leg_id = NEW.id THEN
    RAISE EXCEPTION 'Recursive transshipment leg cannot reference itself.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION requires_approval_for_milestone(p_dispatch_id UUID, p_milestone_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM milestone_policy_bindings mpb
    JOIN policy_rules pr ON pr.id = mpb.policy_id
    WHERE mpb.milestone_id = p_milestone_id
      AND pr.action = 'require_approval'
      AND pr.is_active = true
      AND NOT EXISTS (
        SELECT 1
        FROM approval_requests ar
        WHERE ar.dispatch_id = p_dispatch_id
          AND ar.policy_id = pr.id
          AND ar.status = 'approved'
      )
  );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION calculate_le(actual NUMERIC, planned NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  IF planned IS NULL OR planned = 0 OR actual IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN ROUND((actual / planned) * 100, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP TRIGGER IF EXISTS trg_dispatches_updated_at ON dispatches;
CREATE TRIGGER trg_dispatches_updated_at
BEFORE UPDATE ON dispatches
FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

DROP TRIGGER IF EXISTS trg_policy_rules_updated_at ON policy_rules;
CREATE TRIGGER trg_policy_rules_updated_at
BEFORE UPDATE ON policy_rules
FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

DROP TRIGGER IF EXISTS trg_approval_requests_updated_at ON approval_requests;
CREATE TRIGGER trg_approval_requests_updated_at
BEFORE UPDATE ON approval_requests
FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

DROP TRIGGER IF EXISTS trg_transshipment_legs_updated_at ON transshipment_legs;
CREATE TRIGGER trg_transshipment_legs_updated_at
BEFORE UPDATE ON transshipment_legs
FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

DROP TRIGGER IF EXISTS trg_validate_transshipment_leg ON transshipment_legs;
CREATE TRIGGER trg_validate_transshipment_leg
BEFORE INSERT OR UPDATE ON transshipment_legs
FOR EACH ROW EXECUTE FUNCTION validate_transshipment_leg();

ALTER TABLE transshipment_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_policy_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Transshipment legs are readable" ON transshipment_legs;
CREATE POLICY "Transshipment legs are readable"
ON transshipment_legs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Transshipment legs are writable by actor or service role" ON transshipment_legs;
CREATE POLICY "Transshipment legs are writable by actor or service role"
ON transshipment_legs FOR ALL
USING (auth.role() = 'service_role' OR auth.uid() = created_by)
WITH CHECK (auth.role() = 'service_role' OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Policy rules are readable" ON policy_rules;
CREATE POLICY "Policy rules are readable"
ON policy_rules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Policy rules are managed by service role" ON policy_rules;
CREATE POLICY "Policy rules are managed by service role"
ON policy_rules FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Milestone bindings are readable" ON milestone_policy_bindings;
CREATE POLICY "Milestone bindings are readable"
ON milestone_policy_bindings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Milestone bindings are managed by service role" ON milestone_policy_bindings;
CREATE POLICY "Milestone bindings are managed by service role"
ON milestone_policy_bindings FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Approvals are readable" ON approval_requests;
CREATE POLICY "Approvals are readable"
ON approval_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Approvals are writable by requester or service role" ON approval_requests;
CREATE POLICY "Approvals are writable by requester or service role"
ON approval_requests FOR ALL
USING (auth.role() = 'service_role' OR auth.uid() = requested_by OR auth.uid() = decided_by)
WITH CHECK (auth.role() = 'service_role' OR auth.uid() = requested_by OR auth.uid() = decided_by);

DROP POLICY IF EXISTS "Governance events are readable" ON governance_events;
CREATE POLICY "Governance events are readable"
ON governance_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Governance events are writable by actor or service role" ON governance_events;
CREATE POLICY "Governance events are writable by actor or service role"
ON governance_events FOR ALL
USING (auth.role() = 'service_role' OR auth.uid() = raised_by OR auth.uid() = resolved_by)
WITH CHECK (auth.role() = 'service_role' OR auth.uid() = raised_by OR auth.uid() = resolved_by);
