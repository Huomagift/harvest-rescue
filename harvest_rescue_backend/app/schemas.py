from datetime import date, datetime
from typing import Optional, Any, Literal

from pydantic import BaseModel, Field


class FarmCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    owner_name: Optional[str] = Field(None, max_length=200)
    farmer_email: Optional[str] = Field(None, max_length=255)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    elevation: Optional[float] = None
    crop_type: str = Field(..., min_length=1, max_length=100)
    planting_date: Optional[date] = None
    size_hectares: Optional[float] = None
    location_name: Optional[str] = None
    boundary_geojson: Optional[Any] = None
    risk_zones: Optional[Any] = None
    is_demo: bool = False


class FarmOut(BaseModel):
    id: str
    name: str
    owner_name: Optional[str]
    farmer_email: Optional[str] = None
    latitude: float
    longitude: float
    elevation: Optional[float] = None
    crop_type: str
    planting_date: Optional[date]
    size_hectares: Optional[float] = None
    location_name: Optional[str] = None
    boundary_geojson: Optional[Any] = None
    risk_zones: Optional[Any] = None
    is_demo: bool = False
    created_at: datetime
    last_monitored_at: Optional[datetime] = None
    last_email_notification_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RiskOutlookDay(BaseModel):
    day_offset: int
    date: str
    day_label: str       # "Today", "Tomorrow", "Sep 25", etc.
    severity: str        # "low" | "medium" | "high"
    risk_label: str      # "Low Risk", "Moderate Risk", "High Risk"
    summary: str


class RecommendedAction(BaseModel):
    action_title: str
    action_description: str
    urgency: Literal["immediate", "advisory", "standard"]
    protocol_code: Optional[str] = "AGR-RISK-2026"


class RiskIntelligenceOut(BaseModel):
    farm_id: str
    farm_name: str
    current_severity: str     # "low" | "medium" | "high"
    risk_trend: Literal["increasing", "decreasing", "stable"]
    headline: str
    why_factors: list[str]
    recommended_action: RecommendedAction
    outlook: list[RiskOutlookDay]
    events: list[RiskEventOut]


class RiskEventOut(BaseModel):
    id: str
    farm_id: str
    risk_type: str
    severity: str
    days_to_impact: Optional[float]
    contributing_data: Optional[Any]
    created_at: datetime

    class Config:
        from_attributes = True


class AlertOut(BaseModel):
    id: str
    farm_id: str
    risk_event_id: Optional[str] = None
    risk_type: str
    title: str
    message: str
    severity: str
    status: str
    days_to_impact: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AlertUpdate(BaseModel):
    status: Literal["unread", "read", "dismissed"] = Field(
        ..., description="New status for alert: unread, read, or dismissed"
    )


class SweepResultOut(BaseModel):
    farms_checked: int
    risks_found: int
    alerts_created_or_updated: int
    timestamp: datetime


class FarmerReportCreate(BaseModel):
    note: str = Field(..., min_length=1, max_length=1000)
    category: Optional[str] = Field(None, max_length=100)


class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=1, max_length=128)


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    token: str
    user: UserOut


