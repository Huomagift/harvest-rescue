from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import require_api_key
from app import models, schemas

router = APIRouter(prefix="/farms", tags=["farms"], dependencies=[Depends(require_api_key)])


@router.post("/", response_model=schemas.FarmOut)
def create_farm(farm: schemas.FarmCreate, db: Session = Depends(get_db)):
    db_farm = models.Farm(**farm.model_dump())
    db.add(db_farm)
    db.commit()
    db.refresh(db_farm)
    return db_farm


@router.get("/", response_model=list[schemas.FarmOut])
def list_farms(db: Session = Depends(get_db)):
    return db.query(models.Farm).all()


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
    
    # Delete associated alerts, risk events, and reports
    db.query(models.Alert).filter(models.Alert.farm_id == farm_id).delete()
    db.query(models.RiskEvent).filter(models.RiskEvent.farm_id == farm_id).delete()
    db.query(models.FarmerReport).filter(models.FarmerReport.farm_id == farm_id).delete()
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
