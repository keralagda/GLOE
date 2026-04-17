-- Logistics SaaS: Vehicle Dispatch Module Migration
-- 1. Enums and Extensions
CREATE TYPE override_type AS ENUM ('manual_complete', 'reason_add');
CREATE TYPE trigger_mode AS ENUM ('manual', 'auto');

-- 2. Tables
CREATE TABLE dispatch_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    order_index INTEGER NOT NULL UNIQUE
);

CREATE TABLE milestone_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID REFERENCES dispatch_milestones(id) ON DELETE CASCADE,
    mode trigger_mode NOT NULL DEFAULT 'manual',
    auto_condition JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL UNIQUE,
    current_milestone_id UUID REFERENCES dispatch_milestones(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispatch_id UUID REFERENCES dispatches(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES dispatch_milestones(id),
    updater_id UUID DEFAULT auth.uid(), -- Integrated with Supabase Auth
    override_type override_type NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Seed Milestones (First Mile / Dispatch)
INSERT INTO dispatch_milestones (name, order_index) VALUES
('DISPATCH_ASSIGNED', 1),
('EN_ROUTE_TO_PICKUP', 2),
('ARRIVED_AT_PICKUP', 3),
('LOADING_STARTED', 4),
('LOADING_FINISHED', 5),
('DISPATCHED', 6),
('EN_ROUTE_TO_DESTINATION', 7),
('ARRIVED_AT_DESTINATION', 8),
('UNLOADING_STARTED', 9),
('UNLOADING_FINISHED', 10),
('COMPLETED', 11);

-- 4. Triggers and Functions

-- Sequential Locking & Timestamp Validation
CREATE OR REPLACE FUNCTION validate_dispatch_transition()
RETURNS TRIGGER AS $$
DECLARE
    current_order INTEGER;
    new_order INTEGER;
BEGIN
    -- 1. Timestamp Validation: completed_at <= CURRENT_TIMESTAMP + 5min grace
    IF NEW.completed_at IS NOT NULL AND NEW.completed_at > (CURRENT_TIMESTAMP + INTERVAL '5 minutes') THEN
        RAISE EXCEPTION 'Future timestamps not allowed. Max grace is 5 minutes.';
    END IF;

    -- 2. Sequential Locking (N -> N+1)
    IF OLD.current_milestone_id IS DISTINCT FROM NEW.current_milestone_id THEN
        SELECT order_index INTO current_order FROM dispatch_milestones WHERE id = OLD.current_milestone_id;
        SELECT order_index INTO new_order FROM dispatch_milestones WHERE id = NEW.current_milestone_id;

        -- Handle initial assignment (current_milestone_id is NULL)
        IF OLD.current_milestone_id IS NULL THEN
            IF new_order != 1 THEN
                RAISE EXCEPTION 'New dispatch must start at the first milestone.';
            END IF;
        ELSIF new_order != current_order + 1 THEN
            RAISE EXCEPTION 'Invalid transition. Milestones must be completed sequentially (from % to %).', current_order, current_order + 1;
        END IF;
    END IF;

    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_dispatch
BEFORE UPDATE ON dispatches
FOR EACH ROW
EXECUTE FUNCTION validate_dispatch_transition();

-- 5. Row Level Security (RLS)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only insert their own audit logs"
ON audit_logs
FOR INSERT
WITH CHECK (auth.uid() = updater_id);

CREATE POLICY "Users can view all audit logs"
ON audit_logs
FOR SELECT
USING (true); -- Adjust as needed for privacy

ALTER TABLE dispatches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authorized users can view dispatches" ON dispatches FOR SELECT USING (true);
CREATE POLICY "Authorized users can update dispatches" ON dispatches FOR UPDATE USING (true);
