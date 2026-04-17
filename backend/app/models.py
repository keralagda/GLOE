import enum
import uuid

from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, JSON, Numeric, String, Text, func
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()
new_uuid = lambda: str(uuid.uuid4())


class OverrideType(str, enum.Enum):
    manual_complete = "manual_complete"
    reason_add = "reason_add"
    transshipment_update = "transshipment_update"
    approval_resolution = "approval_resolution"
    governance_hold = "governance_hold"


class ApprovalStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    cancelled = "cancelled"


class GovernanceStatus(str, enum.Enum):
    clear = "clear"
    pending_approval = "pending_approval"
    correction_required = "correction_required"
    data_mismatch = "data_mismatch"


class PolicyScope(str, enum.Enum):
    dispatch = "dispatch"
    transshipment = "transshipment"
    approval = "approval"
    governance = "governance"


class PolicyAction(str, enum.Enum):
    require_approval = "require_approval"
    flag = "flag"
    block = "block"


class DispatchMilestone(Base):
    __tablename__ = "dispatch_milestones"
    id = Column(String(36), primary_key=True, default=new_uuid)
    name = Column(String, unique=True, nullable=False)
    order_index = Column(Integer, unique=True, nullable=False)
    default_lat = Column(Float)
    default_lng = Column(Float)


class PolicyRule(Base):
    __tablename__ = "policy_rules"
    id = Column(String(36), primary_key=True, default=new_uuid)
    policy_code = Column(String, unique=True, nullable=False)
    scope = Column(Enum(PolicyScope), nullable=False)
    action = Column(Enum(PolicyAction), nullable=False)
    applies_to_milestone_id = Column(String(36), ForeignKey("dispatch_milestones.id"))
    condition = Column(JSON, nullable=False, default=dict)
    is_active = Column(Boolean, nullable=False, default=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Dispatch(Base):
    __tablename__ = "dispatches"
    id = Column(String(36), primary_key=True, default=new_uuid)
    identifier = Column(String, unique=True, nullable=False)
    current_milestone_id = Column(String(36), ForeignKey("dispatch_milestones.id"))
    origin_code = Column(String)
    destination_code = Column(String)
    carrier_name = Column(String)
    phase = Column(String, nullable=False, default="dispatch")
    planned_lead_time_minutes = Column(Numeric(10, 2))
    actual_lead_time_minutes = Column(Numeric(10, 2))
    current_lat = Column(Float)
    current_lng = Column(Float)
    pos_is_manual = Column(Boolean, nullable=False, default=False)
    governance_status = Column(Enum(GovernanceStatus), nullable=False, default=GovernanceStatus.clear)
    created_by = Column(String(36))
    active_approval_id = Column(String(36), ForeignKey("approval_requests.id"))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    current_milestone = relationship("DispatchMilestone")


class MilestonePolicyBinding(Base):
    __tablename__ = "milestone_policy_bindings"
    id = Column(String(36), primary_key=True, default=new_uuid)
    milestone_id = Column(String(36), ForeignKey("dispatch_milestones.id"), nullable=False)
    policy_id = Column(String(36), ForeignKey("policy_rules.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TransshipmentLeg(Base):
    __tablename__ = "transshipment_legs"
    id = Column(String(36), primary_key=True, default=new_uuid)
    dispatch_id = Column(String(36), ForeignKey("dispatches.id", ondelete="CASCADE"), nullable=False)
    parent_leg_id = Column(String(36), ForeignKey("transshipment_legs.id", ondelete="CASCADE"))
    leg_order = Column(Integer, nullable=False)
    port_code = Column(String)
    port_name = Column(String, nullable=False)
    arrived_at = Column(DateTime(timezone=True))
    sailed_at = Column(DateTime(timezone=True))
    governance_status = Column(Enum(GovernanceStatus), nullable=False, default=GovernanceStatus.clear)
    created_by = Column(String(36))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    dispatch = relationship("Dispatch")


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"
    id = Column(String(36), primary_key=True, default=new_uuid)
    dispatch_id = Column(String(36), ForeignKey("dispatches.id", ondelete="CASCADE"), nullable=False)
    transshipment_leg_id = Column(String(36), ForeignKey("transshipment_legs.id", ondelete="CASCADE"))
    policy_id = Column(String(36), ForeignKey("policy_rules.id"), nullable=False)
    requested_by = Column(String(36), nullable=False)
    request_reason = Column(Text, nullable=False)
    status = Column(Enum(ApprovalStatus), nullable=False, default=ApprovalStatus.pending)
    decision_reason = Column(Text)
    decided_by = Column(String(36))
    decided_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class GovernanceEvent(Base):
    __tablename__ = "governance_events"
    id = Column(String(36), primary_key=True, default=new_uuid)
    dispatch_id = Column(String(36), ForeignKey("dispatches.id", ondelete="CASCADE"), nullable=False)
    transshipment_leg_id = Column(String(36), ForeignKey("transshipment_legs.id", ondelete="CASCADE"))
    policy_id = Column(String(36), ForeignKey("policy_rules.id"))
    approval_request_id = Column(String(36), ForeignKey("approval_requests.id"))
    event_type = Column(Enum(GovernanceStatus), nullable=False)
    severity = Column(Integer, nullable=False, default=1)
    details = Column(JSON, nullable=False, default=dict)
    raised_by = Column(String(36))
    resolved_by = Column(String(36))
    resolved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ApprovalReceipt(Base):
    __tablename__ = "approvals_received"
    id = Column(String(36), primary_key=True, default=new_uuid)
    request_id = Column(String(36), ForeignKey("approval_requests.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)
    user_id = Column(String(36), nullable=False)
    comment = Column(Text)
    metadata_json = Column("metadata", JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PositionHistory(Base):
    __tablename__ = "position_history"
    id = Column(String(36), primary_key=True, default=new_uuid)
    dispatch_id = Column(String(36), ForeignKey("dispatches.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36))
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String(36), primary_key=True, default=new_uuid)
    dispatch_id = Column(String(36), ForeignKey("dispatches.id", ondelete="CASCADE"), nullable=False)
    transshipment_leg_id = Column(String(36), ForeignKey("transshipment_legs.id", ondelete="CASCADE"))
    milestone_id = Column(String(36), ForeignKey("dispatch_milestones.id"))
    approval_request_id = Column(String(36), ForeignKey("approval_requests.id"))
    governance_event_id = Column(String(36), ForeignKey("governance_events.id"))
    updater_id = Column(String(36))
    override_type = Column(Enum(OverrideType), nullable=False)
    reason = Column(Text)
    snapshot = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


Milestone = DispatchMilestone
