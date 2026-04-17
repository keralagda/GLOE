from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from .models import ApprovalStatus, GovernanceStatus, OverrideType, PolicyAction, PolicyScope


class MilestoneRead(BaseModel):
    id: str
    name: str
    order_index: int
    model_config = ConfigDict(from_attributes=True)


class DispatchCreate(BaseModel):
    identifier: str
    origin_code: Optional[str] = None
    destination_code: Optional[str] = None
    carrier_name: Optional[str] = None
    phase: str = "dispatch"
    planned_lead_time_minutes: Optional[float] = Field(default=None, gt=0)
    actual_lead_time_minutes: Optional[float] = Field(default=None, ge=0)
    created_by: Optional[str] = None


class DispatchUpdate(BaseModel):
    current_milestone_id: str
    completed_at: Optional[datetime] = None
    actual_lead_time_minutes: Optional[float] = Field(default=None, ge=0)
    reason: Optional[str] = None


class DispatchRead(BaseModel):
    id: str
    identifier: str
    current_milestone_id: Optional[str]
    current_milestone_name: Optional[str] = None
    origin_code: Optional[str] = None
    destination_code: Optional[str] = None
    carrier_name: Optional[str] = None
    phase: str
    governance_status: GovernanceStatus
    planned_lead_time_minutes: Optional[float] = None
    actual_lead_time_minutes: Optional[float] = None
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    pos_is_manual: bool = False
    lead_time_efficiency: Optional[float] = None
    active_approval_id: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class DispatchListResponse(BaseModel):
    data: list[DispatchRead]
    total_count: int
    page: int
    limit: int


class DispatchDashboard(BaseModel):
    total_active_dispatches: int
    average_lead_time_efficiency: Optional[float]
    status_counts: dict[str, int]


class TransshipmentLegCreate(BaseModel):
    parent_leg_id: Optional[str] = None
    leg_order: int = Field(gt=0)
    port_code: Optional[str] = None
    port_name: str
    arrived_at: Optional[datetime] = None
    sailed_at: Optional[datetime] = None


class TransshipmentLegRead(BaseModel):
    id: str
    dispatch_id: str
    parent_leg_id: Optional[str]
    leg_order: int
    port_code: Optional[str]
    port_name: str
    arrived_at: Optional[datetime]
    sailed_at: Optional[datetime]
    governance_status: GovernanceStatus
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PolicyRuleCreate(BaseModel):
    policy_code: str
    scope: PolicyScope
    action: PolicyAction
    applies_to_milestone_id: Optional[str] = None
    condition: dict[str, Any] = Field(default_factory=dict)
    description: Optional[str] = None


class PolicyRuleRead(PolicyRuleCreate):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ApprovalRequestCreate(BaseModel):
    dispatch_id: str
    transshipment_leg_id: Optional[str] = None
    policy_id: str
    request_reason: str


class ApprovalDecision(BaseModel):
    status: ApprovalStatus
    decision_reason: Optional[str] = None
    position_choice: Optional[str] = Field(default=None, pattern="^(snap|keep)$")


class ApprovalRequestRead(BaseModel):
    id: str
    dispatch_id: str
    transshipment_leg_id: Optional[str]
    policy_id: str
    requested_by: str
    request_reason: str
    status: ApprovalStatus
    decision_reason: Optional[str]
    decided_by: Optional[str]
    decided_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class GovernanceEventRead(BaseModel):
    id: str
    dispatch_id: str
    transshipment_leg_id: Optional[str]
    policy_id: Optional[str]
    approval_request_id: Optional[str]
    event_type: GovernanceStatus
    severity: int
    details: dict[str, Any]
    raised_by: Optional[str]
    resolved_by: Optional[str]
    resolved_at: Optional[datetime]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AuditLogRead(BaseModel):
    id: str
    dispatch_id: str
    transshipment_leg_id: Optional[str]
    milestone_id: Optional[str]
    approval_request_id: Optional[str]
    governance_event_id: Optional[str]
    updater_id: Optional[str]
    override_type: OverrideType
    reason: Optional[str]
    snapshot: dict[str, Any]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
