-- Security trigger bundle for the Freight FSM stack.
-- Source of truth is the dated migration:
--   supabase/migrations/20260414003000_export_security_pivots.sql
-- This file exists as a review-friendly security extract for lead/ops validation.

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

DROP TRIGGER IF EXISTS trg_validate_approval_receipt ON approvals_received;
CREATE TRIGGER trg_validate_approval_receipt
BEFORE INSERT ON approvals_received
FOR EACH ROW EXECUTE FUNCTION validate_approval_receipt();

DROP TRIGGER IF EXISTS trg_guard_resolution_before_pending_approval ON approval_requests;
CREATE TRIGGER trg_guard_resolution_before_pending_approval
BEFORE INSERT OR UPDATE ON approval_requests
FOR EACH ROW EXECUTE FUNCTION guard_resolution_before_pending_approval();
