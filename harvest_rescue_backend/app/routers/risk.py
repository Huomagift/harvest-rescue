import time
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import require_api_key
from app import models, schemas
from app.routers.auth import get_current_user_from_header
from app.services.environmental_service import (
    get_farm_environmental_data,
    get_monitoring_diagnostics,
)
from app.services.satellite import get_ndvi_signal
from app.services.risk_engine import evaluate_risk, generate_farm_signals_and_intelligence
from app.services.scheduler import run_monitoring_sweep, create_or_update_alert
from app.services.email_notifications import send_compounded_risk_notification

router = APIRouter(prefix="/risk", tags=["risk"], dependencies=[Depends(require_api_key)])

_last_sweep_time = 0.0


@router.post("/sweep", response_model=schemas.SweepResultOut)
def trigger_full_monitoring_sweep(
    authorization: Optional[str] = Header(None),
    scope: Optional[str] = Query(None, description="all | demo | user"),
    force_refresh: bool = Query(False, description="Force refresh provider data regardless of cache TTL"),
    db: Session = Depends(get_db),
):
    """
    Manually triggers a monitoring sweep with strict demo vs user isolation.
    - If called by an authenticated user: sweeps that user's private farms only and alerts them.
    - If unauthenticated (visitor / demo mode): sweeps demo benchmark farms only.
    - Demo notifications and data NEVER leak into user accounts.
    """
    global _last_sweep_time
    now = time.time()
    if now - _last_sweep_time < 5.0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Sweep requested too rapidly. Please wait a few seconds.",
        )
    _last_sweep_time = now

    auth_header = authorization if isinstance(authorization, str) else None
    user = get_current_user_from_header(auth_header, db)

    # Determine scope
    if scope in ("all", "demo", "user"):
        active_scope = scope
    elif user:
        active_scope = "user"
    else:
        active_scope = "demo"

    user_id = user.id if user else None
    user_email = user.email if user else None

    summary = run_monitoring_sweep(
        db=db,
        scope=active_scope,
        user_id=user_id,
        user_email=user_email,
        force_refresh=force_refresh,
    )
    return summary


@router.get("/diagnostics", response_model=schemas.MonitoringDiagnosticsOut)
@router.get("/monitoring-status", response_model=schemas.MonitoringDiagnosticsOut)
def get_diagnostics(db: Session = Depends(get_db)):
    """
    Returns live monitoring system telemetry:
    - Last successful refresh timestamp
    - Next scheduled refresh timestamp
    - Data freshness counts (fresh vs stale snapshots)
    - Total Open-Meteo requests sent
    - HTTP 429 occurrences & backoffs
    - Failed farms (if any)
    - Cached-data usage count
    """
    return get_monitoring_diagnostics(db)


@router.post("/{farm_id}/evaluate", response_model=list[schemas.RiskEventOut])
def evaluate_farm_risk(
    farm_id: str,
    force_refresh: bool = Query(False, description="Force live Open-Meteo refresh"),
    db: Session = Depends(get_db),
):
    """
    Pulls environmental data (from cache if fresh, or live with backoff if expired),
    runs the risk engine, persists any triggered risk events, updates last_monitored_at,
    creates deduplicated alerts, and sends compounded email notifications.
    """
    farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    weather = get_farm_environmental_data(db, farm, force_refresh=force_refresh)
    ndvi = get_ndvi_signal(farm.latitude, farm.longitude, farm_name=farm.name)

    triggered = evaluate_risk(weather, ndvi)
    farm.last_monitored_at = datetime.utcnow()

    saved_events = []
    for event in triggered:
        db_event = models.RiskEvent(farm_id=farm_id, **event)
        db.add(db_event)
        db.flush()
        create_or_update_alert(db, farm, db_event)
        saved_events.append(db_event)

    db.commit()

    # User farms only receive email notifications (demo farms do not dispatch emails to users)
    if not farm.is_demo and farm.farmer_email and saved_events:
        intel = generate_farm_signals_and_intelligence(farm, weather, ndvi, triggered)
        try:
            send_compounded_risk_notification(
                db=db,
                farm=farm,
                events=saved_events,
                why_factors=intel.get("why_factors"),
                recommended_action=intel.get("recommended_action"),
            )
        except Exception:
            pass

    for e in saved_events:
        db.refresh(e)

    return saved_events


@router.post("/{farm_id}/refresh-environmental")
def refresh_farm_environmental(farm_id: str, db: Session = Depends(get_db)):
    """
    Explicitly forces a fresh Open-Meteo query for a specific farm,
    updating its database snapshot and resetting the 24-hour cache expiration.
    """
    farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    weather = get_farm_environmental_data(db, farm, force_refresh=True)
    return {
        "status": "refreshed",
        "farm_id": farm.id,
        "farm_name": farm.name,
        "data_freshness": weather.get("data_freshness", "fresh"),
        "fetched_at": weather.get("fetched_at"),
        "expires_at": weather.get("expires_at"),
    }


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


@router.get("/{farm_id}/signals")
def get_raw_signals(farm_id: str, db: Session = Depends(get_db)):
    """
    Returns the comprehensive agricultural intelligence package for a farm:
    farm-specific 15-day coherent signal progressions, multi-day risk outlook,
    risk trend, plain-language why factors, and recommended agronomic actions.
    
    Uses cached environmental snapshot so dashboard views do NOT make external API requests.
    """
    farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    weather = get_farm_environmental_data(db, farm, force_refresh=False)
    ndvi = get_ndvi_signal(farm.latitude, farm.longitude, farm_name=farm.name)

    # Get latest active events for this farm
    recent_events = (
        db.query(models.RiskEvent)
        .filter(models.RiskEvent.farm_id == farm_id)
        .order_by(models.RiskEvent.created_at.desc())
        .limit(10)
        .all()
    )
    event_dicts = [
        {
            "risk_type": e.risk_type,
            "severity": e.severity,
            "days_to_impact": e.days_to_impact,
            "contributing_data": e.contributing_data,
        }
        for e in recent_events
    ]

    intel = generate_farm_signals_and_intelligence(farm, weather, ndvi, event_dicts)

    return {
        "farm_id": farm_id,
        "farm_name": farm.name,
        "crop_stage": intel.get("crop_stage"),
        "days_since_planting": intel.get("days_since_planting"),
        "agronomic_status_text": intel.get("agronomic_status_text"),
        "weather": weather,
        "ndvi": ndvi,
        "last_monitored_at": farm.last_monitored_at,
        "current_severity": intel["current_severity"],
        "risk_trend": intel["risk_trend"],
        "headline": intel["headline"],
        "why_factors": intel["why_factors"],
        "recommended_action": intel["recommended_action"],
        "outlook": intel["outlook"],
        "signals": intel["signals"],
        "data_freshness": weather.get("data_freshness", "fresh"),
        "fetched_at": weather.get("fetched_at"),
        "expires_at": weather.get("expires_at"),
        "cached": weather.get("cached", True),
    }
