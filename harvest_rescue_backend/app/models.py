import uuid
from datetime import datetime, date

from sqlalchemy import Column, String, Float, Date, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Farm(Base):
    __tablename__ = "farms"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    owner_name = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    crop_type = Column(String, nullable=False)
    planting_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    risk_events = relationship("RiskEvent", back_populates="farm")


class RiskEvent(Base):
    __tablename__ = "risk_events"

    id = Column(String, primary_key=True, default=gen_uuid)
    farm_id = Column(String, ForeignKey("farms.id"), nullable=False)
    risk_type = Column(String, nullable=False)       # flood | drought_heat | vigor_decline
    severity = Column(String, nullable=False)         # low | medium | high
    days_to_impact = Column(Float, nullable=True)      # null if already-occurring (e.g. vigor decline)
    contributing_data = Column(JSON, nullable=True)    # raw values that triggered this event
    created_at = Column(DateTime, default=datetime.utcnow)

    farm = relationship("Farm", back_populates="risk_events")


class FarmerReport(Base):
    __tablename__ = "farmer_reports"

    id = Column(String, primary_key=True, default=gen_uuid)
    farm_id = Column(String, ForeignKey("farms.id"), nullable=False)
    note = Column(String, nullable=False)
    category = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
