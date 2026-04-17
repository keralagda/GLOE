-- Seed Data for Vehicle Dispatch + Governance + Customer Exec + Export Module
INSERT INTO dispatch_milestones (name, order_index, is_mismatch, default_lat, default_lng) VALUES
('DISPATCH_ASSIGNED', 1, false, 33.9416, -118.4085),
('EN_ROUTE_TO_PICKUP', 2, false, 33.9416, -118.4085),
('ARRIVED_AT_PICKUP', 3, false, 33.9416, -118.4085),
('LOADING_STARTED', 4, false, 33.9416, -118.4085),
('LOADING_FINISHED', 5, false, 33.9416, -118.4085),
('DISPATCHED', 6, false, 33.9416, -118.4085),
('EN_ROUTE_TO_DESTINATION', 7, false, 1.3644, 103.9915),
('ARRIVED_AT_DESTINATION', 8, true, 1.3644, 103.9915),
('UNLOADING_STARTED', 9, false, 1.3644, 103.9915),
('UNLOADING_FINISHED', 10, false, 1.3644, 103.9915),
('COMPLETED', 11, false, 1.3644, 103.9915)
ON CONFLICT (name) DO UPDATE SET is_mismatch = EXCLUDED.is_mismatch, default_lat = EXCLUDED.default_lat, default_lng = EXCLUDED.default_lng;

INSERT INTO milestone_configs (milestone_id, mode, auto_condition)
SELECT id, 'manual', '{}'::jsonb
FROM dispatch_milestones
ON CONFLICT DO NOTHING;

INSERT INTO milestone_settings (milestone_id, milestone_name, trigger_type, require_approval, auto_condition)
SELECT
  dm.id,
  dm.name,
  CASE WHEN dm.name = 'ARRIVED_AT_DESTINATION' THEN 'auto'::trigger_type ELSE 'manual'::trigger_type END,
  dm.name = 'COMPLETED',
  CASE
    WHEN dm.name = 'ARRIVED_AT_DESTINATION' THEN '{"wait_for_all_transshipment_legs": true}'::jsonb
    ELSE '{}'::jsonb
  END
FROM dispatch_milestones dm
ON CONFLICT (milestone_name) DO UPDATE
SET milestone_id = EXCLUDED.milestone_id,
    trigger_type = EXCLUDED.trigger_type,
    require_approval = EXCLUDED.require_approval,
    auto_condition = EXCLUDED.auto_condition,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO feature_flags (key, is_enabled, description) VALUES
('enable_manual_override_audit', true, 'Track driver and operations overrides in audit logs.'),
('strict_sequential_locking', true, 'Require N to N+1 dispatch transitions.'),
('enable_transshipment_governance', true, 'Activate recursive transshipment and policy evaluation.'),
('enable_completion_approvals', true, 'Route policy-bound milestones through approval workflows.'),
('enable_async_exports', true, 'Queue workbook exports through background processing.'),
('enforce_four_eyes_signoff', true, 'Require distinct approvers where four-eyes review is enabled.'),
('enable_customer_exec_api', true, 'Expose customer-scoped executive metrics with strict redaction.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO customer_accounts (id, name)
VALUES ('66666666-6666-6666-6666-666666666661', 'Acme Retail')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (user_id, role, customer_account_id)
VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin', NULL),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'customer', '66666666-6666-6666-6666-666666666661'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ops', NULL),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'finance', NULL)
ON CONFLICT (user_id) DO UPDATE
SET role = EXCLUDED.role,
    customer_account_id = EXCLUDED.customer_account_id,
    updated_at = CURRENT_TIMESTAMP;

WITH completed AS (
  SELECT id FROM dispatch_milestones WHERE name = 'COMPLETED'
), destination AS (
  SELECT id FROM dispatch_milestones WHERE name = 'ARRIVED_AT_DESTINATION'
), policies AS (
  INSERT INTO policy_rules (policy_code, scope, action, applies_to_milestone_id, condition, description)
  VALUES
    (
      'DISPATCH_COMPLETION_REQUIRES_APPROVAL',
      'dispatch',
      'require_approval',
      (SELECT id FROM completed),
      '{"required_roles": ["ops", "finance"], "four_eyes": true}'::jsonb,
      'Completion requires explicit multi-role approval before the final milestone can be committed.'
    ),
    (
      'TRANSSHIP_SAIL_AFTER_ARRIVAL',
      'transshipment',
      'block',
      NULL,
      '{"arrival_required": true}'::jsonb,
      'A transshipment leg may only sail after an arrival timestamp has been logged.'
    ),
    (
      'DESTINATION_MISMATCH_REQUIRES_RESOLUTION',
      'governance',
      'flag',
      (SELECT id FROM destination),
      '{"resolution_required": true}'::jsonb,
      'Destination arrival mismatch requires a resolution workflow before approvals can proceed.'
    )
  ON CONFLICT (policy_code) DO UPDATE
    SET scope = EXCLUDED.scope,
        action = EXCLUDED.action,
        applies_to_milestone_id = EXCLUDED.applies_to_milestone_id,
        condition = EXCLUDED.condition,
        description = EXCLUDED.description,
        updated_at = CURRENT_TIMESTAMP
  RETURNING id, policy_code
)
INSERT INTO milestone_policy_bindings (milestone_id, policy_id)
SELECT completed.id, policies.id
FROM completed
JOIN policies ON policies.policy_code = 'DISPATCH_COMPLETION_REQUIRES_APPROVAL'
ON CONFLICT DO NOTHING;

INSERT INTO dispatches (
  id,
  identifier,
  origin_code,
  destination_code,
  carrier_name,
  phase,
  current_milestone_id,
  planned_lead_time_minutes,
  actual_lead_time_minutes,
  governance_status,
  created_by
)
SELECT
  '11111111-1111-1111-1111-111111111111',
  'TRK-2026-001',
  'USLAX',
  'SGSIN',
  'Tazy Freight',
  'dispatch',
  id,
  720,
  690,
  'pending_approval',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
FROM dispatch_milestones
WHERE name = 'COMPLETED'
ON CONFLICT (identifier) DO NOTHING;

INSERT INTO customer_dispatch_access (customer_account_id, dispatch_id)
VALUES ('66666666-6666-6666-6666-666666666661', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

INSERT INTO shipment_finance_entries (dispatch_id, side, amount, currency, description)
VALUES
('11111111-1111-1111-1111-111111111111', 'sell', 12500.00, 'USD', 'Customer-facing sell amount'),
('11111111-1111-1111-1111-111111111111', 'buy', 9100.00, 'USD', 'Internal carrier buy amount')
ON CONFLICT DO NOTHING;

INSERT INTO transshipment_legs (
  id,
  dispatch_id,
  parent_leg_id,
  leg_order,
  port_code,
  port_name,
  arrived_at,
  sailed_at,
  governance_status,
  created_by
) VALUES
(
  '22222222-2222-2222-2222-222222222221',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  1,
  'AEJEA',
  'Jebel Ali',
  CURRENT_TIMESTAMP - INTERVAL '5 days',
  CURRENT_TIMESTAMP - INTERVAL '4 days',
  'clear',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
),
(
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222221',
  2,
  'SGSIN',
  'Singapore',
  CURRENT_TIMESTAMP - INTERVAL '2 days',
  CURRENT_TIMESTAMP - INTERVAL '1 day',
  'clear',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
)
ON CONFLICT DO NOTHING;

INSERT INTO approval_requests (
  id,
  dispatch_id,
  transshipment_leg_id,
  policy_id,
  milestone_id,
  requested_by,
  requester_id,
  request_reason,
  status,
  request_type,
  required_roles,
  four_eyes,
  metadata
)
SELECT
  '33333333-3333-3333-3333-333333333331',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  pr.id,
  dm.id,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Seeded approval request for dashboard and export validation.',
  'pending',
  'approval',
  '["ops","finance"]'::jsonb,
  true,
  '{"fraud_test_expected": true}'::jsonb
FROM policy_rules pr
JOIN dispatch_milestones dm ON dm.name = 'COMPLETED'
WHERE pr.policy_code = 'DISPATCH_COMPLETION_REQUIRES_APPROVAL'
ON CONFLICT (id) DO NOTHING;

INSERT INTO approval_requests (
  id,
  dispatch_id,
  transshipment_leg_id,
  policy_id,
  milestone_id,
  requested_by,
  requester_id,
  request_reason,
  status,
  request_type,
  required_roles,
  four_eyes,
  resolution_of_request_id,
  metadata
)
SELECT
  '33333333-3333-3333-3333-333333333332',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  pr.id,
  dm.id,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Seeded mismatch resolution request.',
  'pending',
  'resolution',
  '["ops","compliance"]'::jsonb,
  true,
  '33333333-3333-3333-3333-333333333331',
  '{"mismatch_reason": "destination_scan_conflict"}'::jsonb
FROM policy_rules pr
JOIN dispatch_milestones dm ON dm.name = 'ARRIVED_AT_DESTINATION'
WHERE pr.policy_code = 'DESTINATION_MISMATCH_REQUIRES_RESOLUTION'
ON CONFLICT (id) DO NOTHING;

INSERT INTO approvals_received (id, request_id, role, user_id, comment)
VALUES
(
  '44444444-4444-4444-4444-444444444441',
  '33333333-3333-3333-3333-333333333331',
  'ops',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Ops signoff for seeded approval chain.'
),
(
  '44444444-4444-4444-4444-444444444442',
  '33333333-3333-3333-3333-333333333332',
  'compliance',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Compliance signoff for seeded resolution chain.'
)
ON CONFLICT DO NOTHING;

INSERT INTO shipment_messages (dispatch_id, milestone_id, user_id, type, message_scope, message_text)
SELECT
  '11111111-1111-1111-1111-111111111111',
  id,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'system',
  'customer',
  'Dispatch status updated for customer visibility.'
FROM dispatch_milestones WHERE name = 'COMPLETED'
ON CONFLICT DO NOTHING;

INSERT INTO shipment_messages (dispatch_id, milestone_id, user_id, type, message_scope, message_text)
SELECT
  '11111111-1111-1111-1111-111111111111',
  id,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'human',
  'internal',
  'Internal ops note that must remain hidden from customer exports.'
FROM dispatch_milestones WHERE name = 'ARRIVED_AT_DESTINATION'
ON CONFLICT DO NOTHING;

INSERT INTO auth_security_events (user_id, event_type, status, details)
VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'login', 'success', '{"ip": "10.0.0.1"}'::jsonb),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'mfa', 'failure', '{"reason": "totp_mismatch"}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO permission_audit_logs (actor_id, target_user_id, action_type, details)
VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'role_change', '{"from": "ops", "to": "ops"}'::jsonb),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'admin_override', '{"action": "forensic_export"}'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO export_requests (
  id,
  requested_by,
  requester_email,
  filters,
  total_count,
  status,
  export_type
) VALUES
(
  '55555555-5555-5555-5555-555555555551',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'admin@example.com',
  '{"phase": "dispatch", "status": "pending_approval"}'::jsonb,
  1,
  'queued',
  'forensic'
)
ON CONFLICT DO NOTHING;
