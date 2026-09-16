from datetime import date, datetime
from typing import Optional, Any, Literal

from pydantic import BaseModel, Field


class FarmCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    owner_name: Optional[str] = Field(None, max_length=200)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    elevation: Optional[float] = None
    crop_type: str = Field(..., min_length=1, max_length=100)
    planting_date: Optional[date] = None
    is_demo: bool = False


class FarmOut(BaseModel):
    id: str
    name: str
    owner_name: Optional[str]
    latitude: float
    longitude: float
    elevation: Optional[float] = None
    crop_type: str
    planting_date: Optional[date]
    is_demo: bool = False
    created_at: datetime
    last_monitored_at: Optional[datetime] = None

    class Config:
        from_attributes = True


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

