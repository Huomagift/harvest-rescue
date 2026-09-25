import uuid
from datetime import datetime, date

from sqlalchemy import Column, String, Float, Date, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Farm(Base):
    __tablename__ = "farms"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    owner_name = Column(String, nullable=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation = Column(Float, nullable=True)
    crop_type = Column(String, nullable=False)
    planting_date = Column(Date, nullable=True)
    farmer_email = Column(String, nullable=True)
    size_hectares = Column(Float, nullable=True)
    location_name = Column(String, nullable=True)
    boundary_geojson = Column(JSON, nullable=True)
    risk_zones = Column(JSON, nullable=True)
    last_email_notification_at = Column(DateTime, nullable=True)
    last_notified_risk_signature = Column(String, nullable=True)
    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_monitored_at = Column(DateTime, nullable=True)

    risk_events = relationship("RiskEvent", back_populates="farm", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="farm", cascade="all, delete-orphan")
    environmental_snapshot = relationship("EnvironmentalSnapshot", back_populates="farm", uselist=False, cascade="all, delete-orphan")


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


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=gen_uuid)
    farm_id = Column(String, ForeignKey("farms.id"), nullable=False)
    risk_event_id = Column(String, ForeignKey("risk_events.id"), nullable=True)
    risk_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    severity = Column(String, nullable=False)         # low | medium | high
    status = Column(String, nullable=False, default="unread") # unread | read | dismissed
    days_to_impact = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    farm = relationship("Farm", back_populates="alerts")
    risk_event = relationship("RiskEvent")


class FarmerReport(Base):
    __tablename__ = "farmer_reports"

    id = Column(String, primary_key=True, default=gen_uuid)
    farm_id = Column(String, ForeignKey("farms.id"), nullable=False)
    note = Column(String, nullable=False)
    category = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    auth_token = Column(String, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class EnvironmentalSnapshot(Base):
    __tablename__ = "environmental_snapshots"

    id = Column(String, primary_key=True, default=gen_uuid)
    farm_id = Column(String, ForeignKey("farms.id", ondelete="CASCADE"), nullable=True, unique=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    data = Column(JSON, nullable=False)
    raw_daily = Column(JSON, nullable=True)
    fetched_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    status = Column(String, nullable=False, default="fresh")  # "fresh" | "stale" | "error"
    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    farm = relationship("Farm", back_populates="environmental_snapshot")


