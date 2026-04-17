-- Logistics SaaS: KPI Aggregates, Indexed Lists, and Realtime Publication
CREATE INDEX IF NOT EXISTS idx_dispatches_origin_code ON dispatches(origin_code);
CREATE INDEX IF NOT EXISTS idx_dispatches_governance_status ON dispatches(governance_status);
CREATE INDEX IF NOT EXISTS idx_dispatches_phase ON dispatches(phase);
CREATE INDEX IF NOT EXISTS idx_dispatches_created_at ON dispatches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_requests_dispatch_status ON approval_requests(dispatch_id, status);
CREATE INDEX IF NOT EXISTS idx_governance_events_dispatch_type ON governance_events(dispatch_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transshipment_legs_dispatch_order ON transshipment_legs(dispatch_id, leg_order);

CREATE OR REPLACE VIEW dispatch_list_view AS
SELECT
  d.id,
  d.identifier,
  d.origin_code,
  d.destination_code,
  d.carrier_name,
  d.phase,
  d.governance_status,
  d.current_milestone_id,
  m.name AS current_milestone_name,
  d.planned_lead_time_minutes,
  d.actual_lead_time_minutes,
  calculate_le(d.actual_lead_time_minutes, d.planned_lead_time_minutes) AS lead_time_efficiency,
  d.active_approval_id,
  d.completed_at,
  d.created_at,
  d.updated_at
FROM dispatches d
LEFT JOIN dispatch_milestones m ON m.id = d.current_milestone_id;

CREATE OR REPLACE VIEW dispatch_kpi_view AS
SELECT
  COUNT(*) FILTER (WHERE completed_at IS NULL) AS total_active_dispatches,
  ROUND(AVG(calculate_le(actual_lead_time_minutes, planned_lead_time_minutes)), 2) AS average_lead_time_efficiency,
  COUNT(*) FILTER (WHERE governance_status = 'pending_approval') AS pending_approval_count,
  COUNT(*) FILTER (WHERE governance_status = 'correction_required') AS correction_required_count,
  COUNT(*) FILTER (WHERE governance_status = 'data_mismatch') AS data_mismatch_count
FROM dispatches;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE dispatches; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE approval_requests; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE governance_events; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;
