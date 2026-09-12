from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import require_api_key
from app import models, schemas
from app.services.weather import get_weather_signal
from app.services.satellite import get_ndvi_signal
from app.services.risk_engine import evaluate_risk

router = APIRouter(prefix="/risk", tags=["risk"], dependencies=[Depends(require_api_key)])


@router.post("/{farm_id}/evaluate", response_model=list[schemas.RiskEventOut])
def evaluate_farm_risk(farm_id: str, db: Session = Depends(get_db)):
    """
    Pulls fresh weather + NDVI data for the farm, runs the risk engine,
    and persists any triggered risk events. Call this on-demand for the
    demo rather than waiting on a schedule.
    """
    farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    weather = get_weather_signal(farm.latitude, farm.longitude)
    ndvi = get_ndvi_signal(farm.latitude, farm.longitude, farm_name=farm.name)

    triggered = evaluate_risk(weather, ndvi)

    saved_events = []
    for event in triggered:
        db_event = models.RiskEvent(farm_id=farm_id, **event)
        db.add(db_event)
        saved_events.append(db_event)

    db.commit()
    for e in saved_events:
        db.refresh(e)

    return saved_events


@router.get("/{farm_id}/latest", response_model=list[schemas.RiskEventOut])
def get_latest_risk(farm_id: str, db: Session = Depends(get_db)):
    """Returns the most recent risk events for a farm (used by the dashboard and the agent)."""
    events = (
        db.query(models.RiskEvent)
        .filter(models.RiskEvent.farm_id == farm_id)
        .order_by(models.RiskEvent.created_at.desc())
        .limit(10)
        .all()
    )
    return events
