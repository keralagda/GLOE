-- Logistics SaaS: Export + Security + Multi-Role Approval Pivot
ALTER TYPE override_type ADD VALUE IF NOT EXISTS 'approval_signoff';
ALTER TYPE override_type ADD VALUE IF NOT EXISTS 'export_requested';
ALTER TYPE approval_status ADD VALUE IF NOT EXISTS 'draft';

DO $$ BEGIN
  CREATE TYPE approval_request_type AS ENUM ('approval', 'resolution');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE export_request_status AS ENUM ('queued', 'processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE trigger_type AS ENUM ('manual', 'auto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE dispatch_milestones
  ADD COLUMN IF NOT EXISTS is_mismatch BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE approval_requests
  ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES dispatch_milestones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS requester_id UUID,
  ADD COLUMN IF NOT EXISTS request_type approval_request_type NOT NULL DEFAULT 'approval',
  ADD COLUMN IF NOT EXISTS required_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS four_eyes BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolution_of_request_id UUID REFERENCES approval_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE approval_requests
SET requester_id = COALESCE(requester_id, requested_by)
WHERE requester_id IS NULL;

CREATE TABLE IF NOT EXISTS milestone_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID UNIQUE REFERENCES dispatch_milestones(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL UNIQUE,
  trigger_type trigger_type NOT NULL DEFAULT 'manual',
  require_approval BOOLEAN NOT NULL DEFAULT false,
  auto_condition JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approvals_received (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  user_id UUID NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (request_id, role, user_id)
);

CREATE TABLE IF NOT EXISTS export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by UUID NOT NULL,
  requester_email TEXT,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_count INTEGER,
  status export_request_status NOT NULL DEFAULT 'queued',
  storage_path TEXT,
  signed_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_milestone_settings_trigger_type ON milestone_settings(trigger_type, require_approval);
CREATE INDEX IF NOT EXISTS idx_approval_requests_request_type ON approval_requests(request_type, status);
CREATE INDEX IF NOT EXISTS idx_approvals_received_request_id ON approvals_received(request_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_requests_status ON export_requests(status, created_at DESC);

CREATE OR REPLACE FUNCTION all_roles_signed(p_request_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  required_roles_json JSONB := '[]'::jsonb;
  required_role_count INTEGER := 0;
  signed_role_count INTEGER := 0;
  distinct_user_count INTEGER := 0;
  requires_four_eyes BOOLEAN := false;
  has_any_receipt BOOLEAN := false;
BEGIN
  SELECT required_roles, COALESCE(jsonb_array_length(required_roles), 0), four_eyes
  INTO required_roles_json, required_role_count, requires_four_eyes
  FROM approval_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT EXISTS(SELECT 1 FROM approvals_received WHERE request_id = p_request_id)
  INTO has_any_receipt;

  SELECT COUNT(DISTINCT role), COUNT(DISTINCT user_id)
  INTO signed_role_count, distinct_user_count
  FROM approvals_received
  WHERE request_id = p_request_id
    AND (
      required_role_count = 0
      OR role IN (SELECT jsonb_array_elements_text(required_roles_json))
    );

  IF required_role_count = 0 THEN
    RETURN has_any_receipt AND (NOT requires_four_eyes OR distinct_user_count >= 2);
  END IF;

  RETURN signed_role_count >= required_role_count
    AND (
      NOT requires_four_eyes
      OR distinct_user_count >= GREATEST(required_role_count, 2)
    );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION all_transshipment_legs_completed(p_dispatch_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1
    FROM transshipment_legs
    WHERE dispatch_id = p_dispatch_id
      AND (arrived_at IS NULL OR sailed_at IS NULL)
  );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION validate_approval_receipt()
RETURNS TRIGGER AS $$
DECLARE
  request_actor UUID;
  requires_four_eyes BOOLEAN := false;
BEGIN
  SELECT requester_id, four_eyes
  INTO request_actor, requires_four_eyes
  FROM approval_requests
  WHERE id = NEW.request_id;

  IF request_actor IS NULL THEN
    RAISE EXCEPTION 'Approval request not found for signoff.';
  END IF;

  IF request_actor = NEW.user_id THEN
    RAISE EXCEPTION 'Self-approval is prohibited for this request.';
  END IF;

  IF requires_four_eyes AND EXISTS (
    SELECT 1
    FROM approvals_received
    WHERE request_id = NEW.request_id
      AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Four-eyes policy requires a distinct approver for each signoff.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_approval_status_from_receipts()
RETURNS TRIGGER AS $$
DECLARE
  active_request_id UUID := COALESCE(NEW.request_id, OLD.request_id);
BEGIN
  IF all_roles_signed(active_request_id) THEN
    UPDATE approval_requests
    SET status = 'approved',
        decided_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = active_request_id
      AND request_type = 'approval'
      AND status IN ('draft', 'pending');
  ELSIF EXISTS (
    SELECT 1
    FROM approval_requests
    WHERE id = active_request_id
      AND request_type = 'approval'
      AND status = 'approved'
  ) THEN
    UPDATE approval_requests
    SET status = 'pending',
        decided_at = NULL,
        decided_by = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = active_request_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION guard_resolution_before_pending_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_type = 'approval'
     AND NEW.status = 'pending'
     AND EXISTS (
       SELECT 1
       FROM approval_requests pending_resolution
       WHERE pending_resolution.dispatch_id = NEW.dispatch_id
         AND pending_resolution.milestone_id IS NOT DISTINCT FROM NEW.milestone_id
         AND pending_resolution.request_type = 'resolution'
         AND pending_resolution.status IN ('draft', 'pending')
         AND pending_resolution.id <> NEW.id
     ) THEN
    RAISE EXCEPTION 'Resolution request is still pending for this dispatch milestone.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_resolution_request_for_mismatch()
RETURNS TRIGGER AS $$
DECLARE
  mismatch_detected BOOLEAN := false;
BEGIN
  IF NEW.request_type <> 'approval' OR NEW.milestone_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT is_mismatch INTO mismatch_detected
  FROM dispatch_milestones
  WHERE id = NEW.milestone_id;

  IF mismatch_detected
     AND NOT EXISTS (
       SELECT 1
       FROM approval_requests existing_resolution
       WHERE existing_resolution.dispatch_id = NEW.dispatch_id
         AND existing_resolution.milestone_id = NEW.milestone_id
         AND existing_resolution.request_type = 'resolution'
         AND existing_resolution.status IN ('draft', 'pending')
     ) THEN
    INSERT INTO approval_requests (
      dispatch_id,
      transshipment_leg_id,
      policy_id,
      milestone_id,
      requested_by,
      requester_id,
      request_reason,
      status,
      decision_reason,
      request_type,
      required_roles,
      four_eyes,
      resolution_of_request_id,
      metadata
    ) VALUES (
      NEW.dispatch_id,
      NEW.transshipment_leg_id,
      NEW.policy_id,
      NEW.milestone_id,
      NEW.requested_by,
      COALESCE(NEW.requester_id, NEW.requested_by),
      'Resolution required before milestone approval can proceed.',
      'pending',
      NULL,
      'resolution',
      CASE WHEN NEW.required_roles = '[]'::jsonb THEN '["ops","compliance"]'::jsonb ELSE NEW.required_roles END,
      true,
      NEW.id,
      jsonb_build_object('source_request_id', NEW.id, 'reason', 'milestone_mismatch')
    );

    UPDATE approval_requests
    SET status = 'draft',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id
      AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_transshipment_completion_gate()
RETURNS TRIGGER AS $$
DECLARE
  target_name TEXT;
  wait_for_legs BOOLEAN := false;
BEGIN
  IF NEW.current_milestone_id IS NOT DISTINCT FROM OLD.current_milestone_id THEN
    RETURN NEW;
  END IF;

  SELECT name INTO target_name
  FROM dispatch_milestones
  WHERE id = NEW.current_milestone_id;

  SELECT COALESCE((auto_condition ->> 'wait_for_all_transshipment_legs')::BOOLEAN, false)
  INTO wait_for_legs
  FROM milestone_settings
  WHERE milestone_id = NEW.current_milestone_id;

  IF wait_for_legs AND NOT all_transshipment_legs_completed(NEW.id) THEN
    RAISE EXCEPTION 'Milestone % requires all transshipment legs to be completed before transition.', target_name;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_approval_receipt ON approvals_received;
CREATE TRIGGER trg_validate_approval_receipt
BEFORE INSERT ON approvals_received
FOR EACH ROW EXECUTE FUNCTION validate_approval_receipt();

DROP TRIGGER IF EXISTS trg_sync_approval_status_from_receipts_insert ON approvals_received;
CREATE TRIGGER trg_sync_approval_status_from_receipts_insert
AFTER INSERT ON approvals_received
FOR EACH ROW EXECUTE FUNCTION sync_approval_status_from_receipts();

DROP TRIGGER IF EXISTS trg_sync_approval_status_from_receipts_delete ON approvals_received;
CREATE TRIGGER trg_sync_approval_status_from_receipts_delete
AFTER DELETE ON approvals_received
FOR EACH ROW EXECUTE FUNCTION sync_approval_status_from_receipts();

DROP TRIGGER IF EXISTS trg_guard_resolution_before_pending_approval ON approval_requests;
CREATE TRIGGER trg_guard_resolution_before_pending_approval
BEFORE INSERT OR UPDATE ON approval_requests
FOR EACH ROW EXECUTE FUNCTION guard_resolution_before_pending_approval();

DROP TRIGGER IF EXISTS trg_create_resolution_request_for_mismatch ON approval_requests;
CREATE TRIGGER trg_create_resolution_request_for_mismatch
AFTER INSERT ON approval_requests
FOR EACH ROW EXECUTE FUNCTION create_resolution_request_for_mismatch();

DROP TRIGGER IF EXISTS trg_enforce_transshipment_completion_gate ON dispatches;
CREATE TRIGGER trg_enforce_transshipment_completion_gate
BEFORE UPDATE ON dispatches
FOR EACH ROW EXECUTE FUNCTION enforce_transshipment_completion_gate();

DROP TRIGGER IF EXISTS trg_milestone_settings_updated_at ON milestone_settings;
CREATE TRIGGER trg_milestone_settings_updated_at
BEFORE UPDATE ON milestone_settings
FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

DROP TRIGGER IF EXISTS trg_export_requests_updated_at ON export_requests;
CREATE TRIGGER trg_export_requests_updated_at
BEFORE UPDATE ON export_requests
FOR EACH ROW EXECUTE FUNCTION set_row_updated_at();

ALTER TABLE milestone_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals_received ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Milestone settings are readable" ON milestone_settings;
CREATE POLICY "Milestone settings are readable"
ON milestone_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Milestone settings are managed by service role" ON milestone_settings;
CREATE POLICY "Milestone settings are managed by service role"
ON milestone_settings FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Approvals received are readable" ON approvals_received;
CREATE POLICY "Approvals received are readable"
ON approvals_received FOR SELECT
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM approval_requests ar
    WHERE ar.id = approvals_received.request_id
      AND (ar.requester_id = auth.uid() OR ar.requested_by = auth.uid() OR ar.decided_by = auth.uid())
  )
  OR auth.uid() = user_id
);

DROP POLICY IF EXISTS "Approvals received are writable by approver or service role" ON approvals_received;
CREATE POLICY "Approvals received are writable by approver or service role"
ON approvals_received FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Export requests are readable by requester or service role" ON export_requests;
CREATE POLICY "Export requests are readable by requester or service role"
ON export_requests FOR SELECT
USING (auth.role() = 'service_role' OR auth.uid() = requested_by);

DROP POLICY IF EXISTS "Export requests are writable by requester or service role" ON export_requests;
CREATE POLICY "Export requests are writable by requester or service role"
ON export_requests FOR ALL
USING (auth.role() = 'service_role' OR auth.uid() = requested_by)
WITH CHECK (auth.role() = 'service_role' OR auth.uid() = requested_by);

DROP POLICY IF EXISTS "Approvals are writable by requester, decider, or service role" ON approval_requests;
CREATE POLICY "Approvals are writable by requester, decider, or service role"
ON approval_requests FOR ALL
USING (auth.role() = 'service_role' OR auth.uid() = requester_id OR auth.uid() = requested_by OR auth.uid() = decided_by)
WITH CHECK (auth.role() = 'service_role' OR auth.uid() = requester_id OR auth.uid() = requested_by OR auth.uid() = decided_by);

CREATE OR REPLACE VIEW export_audit_trail_view AS
SELECT
  al.id AS audit_log_id,
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
  al.updater_id AS audit_actor_id,
  al.created_at AS audit_timestamp
FROM audit_logs al
JOIN dispatches d ON d.id = al.dispatch_id
LEFT JOIN approval_requests ar ON ar.id = al.approval_request_id
LEFT JOIN approvals_received apr ON apr.request_id = ar.id;
