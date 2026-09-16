"""
Alerts management endpoints protected by X-API-Key authentication.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import require_api_key
from app import models, schemas

router = APIRouter(prefix="/alerts", tags=["alerts"], dependencies=[Depends(require_api_key)])


@router.get("/", response_model=list[schemas.AlertOut])
def list_alerts(
    status: Optional[str] = Query(None, description="Filter by status: unread, read, or dismissed"),
    db: Session = Depends(get_db),
):
    """
    Returns all alerts, newest first, optionally filtered by status ('unread' | 'read' | 'dismissed').
    """
    query = db.query(models.Alert)
    if status:
        query = query.filter(models.Alert.status == status)
    alerts = query.order_by(models.Alert.created_at.desc()).all()
    return alerts


@router.get("/farm/{farm_id}", response_model=list[schemas.AlertOut])
def list_farm_alerts(
    farm_id: str,
    status: Optional[str] = Query(None, description="Filter by status: unread, read, or dismissed"),
    db: Session = Depends(get_db),
):
    """
    Returns all alerts for a specific farm, newest first.
    """
    farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    query = db.query(models.Alert).filter(models.Alert.farm_id == farm_id)
    if status:
        query = query.filter(models.Alert.status == status)
    alerts = query.order_by(models.Alert.created_at.desc()).all()
    return alerts


@router.patch("/{alert_id}", response_model=schemas.AlertOut)
def update_alert_status(
    alert_id: str,
    update: schemas.AlertUpdate,
    db: Session = Depends(get_db),
):
    """
    Updates status of an alert ('unread' -> 'read' or 'dismissed').
    """
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = update.status
    db.commit()
    db.refresh(alert)
    return alert
