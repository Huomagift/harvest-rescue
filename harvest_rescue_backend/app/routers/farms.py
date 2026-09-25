from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import require_api_key
from app import models, schemas
from app.routers.auth import get_current_user_from_header

router = APIRouter(prefix="/farms", tags=["farms"], dependencies=[Depends(require_api_key)])


@router.post("", response_model=schemas.FarmOut)
@router.post("/", response_model=schemas.FarmOut)
def create_farm(
    farm: schemas.FarmCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user = get_current_user_from_header(authorization, db)
    data = farm.model_dump()
    
    if user:
        data["user_id"] = user.id
        if not data.get("farmer_email"):
            data["farmer_email"] = user.email
        if not data.get("owner_name"):
            data["owner_name"] = user.name
    
    if data.get("farmer_email"):
        data["farmer_email"] = data["farmer_email"].strip().lower()
    
    # If no custom polygon provided, automatically build a tight ~1.2 ha plot
    if not data.get("boundary_geojson") and data.get("latitude") and data.get("longitude"):
        lat = data["latitude"]
        lon = data["longitude"]
        d = 0.0005  # ~55m radius -> ~1.2 ha pure plot
        data["boundary_geojson"] = {
            "type": "Polygon",
            "coordinates": [[
                [round(lon - d, 6), round(lat + d, 6)],
                [round(lon + d, 6), round(lat + d, 6)],
                [round(lon + d, 6), round(lat - d, 6)],
                [round(lon - d, 6), round(lat - d, 6)],
                [round(lon - d, 6), round(lat + d, 6)],
            ]]
        }
    
    data["is_demo"] = False
    db_farm = models.Farm(**data)
    db.add(db_farm)
    db.commit()
    db.refresh(db_farm)

    # Pre-populate environmental snapshot
    try:
        from app.services.environmental_service import get_farm_environmental_data
        get_farm_environmental_data(db, db_farm, force_refresh=False)
    except Exception:
        pass

    return db_farm


@router.get("", response_model=list[schemas.FarmOut])
@router.get("/", response_model=list[schemas.FarmOut])
def list_farms(
    email: Optional[str] = Query(None, description="Filter by farmer account email"),
    is_demo: Optional[bool] = Query(None, description="Filter demo status"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """
    Returns farms matching account ownership:
    - If user is authenticated or email is provided: returns ONLY the farms owned by that farmer account.
    - If NO user or email (public visitor): returns ONLY public demo benchmark farms.
      Private farms belonging to registered farmers are strictly protected and never leaked.
    """
    user = get_current_user_from_header(authorization, db)
    target_email = email.strip().lower() if email and email.strip() else (user.email if user else None)

    query = db.query(models.Farm)
    if user:
        # Match by user_id OR email
        return query.filter(
            or_(
                models.Farm.user_id == user.id,
                models.Farm.farmer_email == user.email,
            )
        ).all()
    elif target_email:
        return query.filter(models.Farm.farmer_email == target_email).all()
    elif is_demo is False:
        # Cannot query all private farms without an account email or session
        return []
    else:
        # Visitor mode: ONLY demo benchmark farms
        return query.filter(models.Farm.is_demo == True).all()


@router.get("/{farm_id}", response_model=schemas.FarmOut)
def get_farm(farm_id: str, db: Session = Depends(get_db)):
    farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm


@router.delete("/{farm_id}")
def delete_farm(farm_id: str, db: Session = Depends(get_db)):
    farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm.is_demo:
        raise HTTPException(status_code=400, detail="Demo farms cannot be deleted.")
    
    # Delete associated alerts, risk events, reports, and environmental snapshots
    db.query(models.Alert).filter(models.Alert.farm_id == farm_id).delete()
    db.query(models.RiskEvent).filter(models.RiskEvent.farm_id == farm_id).delete()
    db.query(models.FarmerReport).filter(models.FarmerReport.farm_id == farm_id).delete()
    db.query(models.EnvironmentalSnapshot).filter(models.EnvironmentalSnapshot.farm_id == farm_id).delete()
    db.delete(farm)
    db.commit()
    return {"id": farm_id, "status": "deleted"}


@router.post("/{farm_id}/reports")
def add_farmer_report(farm_id: str, report: schemas.FarmerReportCreate, db: Session = Depends(get_db)):
    farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    db_report = models.FarmerReport(farm_id=farm_id, **report.model_dump())
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return {"id": db_report.id, "status": "recorded"}


@router.post("/{farm_id}/send-test-email")
def send_farm_test_email(farm_id: str, db: Session = Depends(get_db)):
    """
    Triggers an immediate test compounded agronomic risk email to this farm's configured email address.
    """
    from app.services.email_notifications import send_test_email
    farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    result = send_test_email(db, farm)
    return result

