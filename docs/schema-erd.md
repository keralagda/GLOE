# GLOE: International Freight Forwarding SaaS - Database Schema (ERD)

This document serves as the Single Source of Truth (SSoT) for the GLOE database architecture, as mandated by the V116.0 "ERD Pre-Cognition" Protocol.

## Entity Relationship Diagram

```mermaid
erDiagram
    dispatch_milestones ||--o{ milestone_configs : "configured_by"
    dispatch_milestones ||--o{ milestone_settings : "settings_defined_by"
    dispatch_milestones ||--o{ policy_rules : "restricted_by"
    dispatch_milestones ||--o{ milestone_policy_bindings : "bound_to"
    
    dispatches }|--|| dispatch_milestones : "current_position"
    dispatches ||--o{ transshipment_legs : "has_legs"
    dispatches ||--o{ audit_logs : "audited_by"
    dispatches ||--o{ approval_requests : "requires_approval"
    dispatches ||--o{ governance_events : "raises_events"
    dispatches ||--o{ export_requests : "requested_export"
    
    transshipment_legs ||--o{ transshipment_legs : "recursive_parent"
    transshipment_legs ||--o{ audit_logs : "leg_audited"
    transshipment_legs ||--o{ approval_requests : "leg_approval"
    transshipment_legs ||--o{ governance_events : "leg_governance"
    
    policy_rules ||--o{ milestone_policy_bindings : "applied_via"
    policy_rules ||--o{ approval_requests : "triggers"
    policy_rules ||--o{ governance_events : "defines"
    
    approval_requests ||--o{ approvals_received : "signed_by"
    approval_requests ||--o{ audit_logs : "approval_logged"
    approval_requests ||--o{ governance_events : "linked_to"
    
    governance_events ||--o{ audit_logs : "event_logged"

    dispatch_milestones {
        uuid id PK
        text name
        int order_index
        bool is_mismatch
    }

    dispatches {
        uuid id PK
        text identifier
        uuid current_milestone_id FK
        timestamptz completed_at
        text origin_code
        text destination_code
        text carrier_name
        text phase
        numeric planned_lead_time_minutes
        numeric actual_lead_time_minutes
        governance_status governance_status
        uuid created_by
        uuid active_approval_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    transshipment_legs {
        uuid id PK
        uuid dispatch_id FK
        uuid parent_leg_id FK
        int leg_order
        text port_code
        text port_name
        timestamptz arrived_at
        timestamptz sailed_at
        governance_status governance_status
        uuid created_by
        timestamptz created_at
        timestamptz updated_at
    }

    policy_rules {
        uuid id PK
        text policy_code
        policy_scope scope
        policy_action action
        uuid applies_to_milestone_id FK
        jsonb condition
        bool is_active
        text description
        timestamptz created_at
        timestamptz updated_at
    }

    approval_requests {
        uuid id PK
        uuid dispatch_id FK
        uuid transshipment_leg_id FK
        uuid policy_id FK
        uuid requested_by
        uuid requester_id
        text request_reason
        approval_status status
        text decision_reason
        uuid decided_by
        timestamptz decided_at
        approval_request_type request_type
        jsonb required_roles
        bool four_eyes
        uuid resolution_of_request_id FK
        jsonb metadata
        timestamptz created_at
        timestamptz updated_at
    }

    approvals_received {
        uuid id PK
        uuid request_id FK
        text role
        uuid user_id
        text comment
        timestamptz created_at
    }

    audit_logs {
        uuid id PK
        uuid dispatch_id FK
        uuid milestone_id FK
        uuid transshipment_leg_id FK
        uuid approval_request_id FK
        uuid governance_event_id FK
        uuid updater_id
        override_type override_type
        text reason
        jsonb snapshot
        timestamptz created_at
    }

    governance_events {
        uuid id PK
        uuid dispatch_id FK
        uuid transshipment_leg_id FK
        uuid policy_id FK
        uuid approval_request_id FK
        governance_status event_type
        int16 severity
        jsonb details
        uuid raised_by
        uuid resolved_by
        timestamptz resolved_at
        timestamptz created_at
    }

    export_requests {
        uuid id PK
        uuid requested_by
        text requester_email
        jsonb filters
        int total_count
        export_request_status status
        text storage_path
        text signed_url
        text error_message
        timestamptz created_at
        timestamptz updated_at
        timestamptz completed_at
    }
```

## Architectural Notes

1. **State Machine Integrity**: The `dispatches` table and `dispatch_milestones` drive the 28-step core. Sequential transitions are enforced via the `trg_validate_dispatch` trigger.
2. **Recursive Transshipment**: The `transshipment_legs` table uses a `parent_leg_id` self-reference to allow N-legs of transit ports, anchoring back to the main `dispatch`.
3. **Governance & Four-Eyes**: Approvals require multi-role sign-off and prohibit self-approval through the `validate_approval_receipt` and `all_roles_signed` functions.
4. **Mismatch Detection**: The system automatically triggers `resolution` requests if a `milestone_id` is flagged with `is_mismatch = true`.
5. **Polyglot Strategy**: Primary transactional data resides in PostgreSQL (Supabase), with audit trails and snapshots providing a forensic history for all state mutations.
