"""
Alerts management endpoints protected by X-API-Key authentication.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import require_api_key
from app import models, schemas
from app.routers.auth import get_current_user_from_header

router = APIRouter(prefix="/alerts", tags=["alerts"], dependencies=[Depends(require_api_key)])


@router.get("", response_model=list[schemas.AlertOut])
@router.get("/", response_model=list[schemas.AlertOut])
def list_alerts(
    status: Optional[str] = Query(None, description="Filter by status: unread, read, or dismissed"),
    email: Optional[str] = Query(None, description="Filter by farmer account email"),
    is_demo: Optional[bool] = Query(None, description="Filter demo alerts"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Returns alerts scoped to the caller's context:
    - If user is authenticated or email is provided: returns ONLY alerts belonging to that farmer's private farms.
    - If NO user or email (public visitor): returns ONLY alerts belonging to demo benchmark farms.
    """
    user = get_current_user_from_header(authorization, db)
    target_email = email.strip().lower() if email and email.strip() else (user.email if user else None)

    query = db.query(models.Alert).join(models.Farm, models.Alert.farm_id == models.Farm.id)
    if status:
        query = query.filter(models.Alert.status == status)

    if user:
        # Authenticated user mode: ONLY alerts belonging to this farmer's private registered farms
        query = query.filter(
            or_(
                models.Farm.user_id == user.id,
                models.Farm.farmer_email == user.email,
            ),
            models.Farm.is_demo == False,
        )
    elif target_email:
        query = query.filter(models.Farm.farmer_email == target_email, models.Farm.is_demo == False)
    elif is_demo is True or target_email is None:
        # Visitor mode: ONLY demo benchmark alerts
        query = query.filter(models.Farm.is_demo == True)

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
