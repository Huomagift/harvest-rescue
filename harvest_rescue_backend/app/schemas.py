from datetime import date, datetime
from typing import Optional, Any

from pydantic import BaseModel, Field


class FarmCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    owner_name: Optional[str] = Field(None, max_length=200)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    crop_type: str = Field(..., min_length=1, max_length=100)
    planting_date: Optional[date] = None


class FarmOut(BaseModel):
    id: str
    name: str
    owner_name: Optional[str]
    latitude: float
    longitude: float
    crop_type: str
    planting_date: Optional[date]
    created_at: datetime

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


class FarmerReportCreate(BaseModel):
    note: str
    category: Optional[str] = None
