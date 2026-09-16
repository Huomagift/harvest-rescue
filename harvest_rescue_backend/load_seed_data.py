"""
Populate or sync the 3 demo benchmark farms.
Usage: python load_seed_data.py
"""
from datetime import date

from app.database import SessionLocal, init_db
from app import models
from seed_data import MOCK_FARMS

init_db()
db = SessionLocal()

try:
    # Clear out old demo farms if needed or upsert
    for farm_data in MOCK_FARMS:
        existing = db.query(models.Farm).filter(models.Farm.name == farm_data["name"]).first()
        planting_date = date.fromisoformat(farm_data["planting_date"])
        
        if existing:
            existing.latitude = farm_data["latitude"]
            existing.longitude = farm_data["longitude"]
            existing.elevation = farm_data.get("elevation")
            existing.crop_type = farm_data["crop_type"]
            existing.planting_date = planting_date
            existing.is_demo = True
            print(f"Updated demo farm: {farm_data['name']}")
        else:
            db_farm = models.Farm(
                name=farm_data["name"],
                owner_name=farm_data["owner_name"],
                latitude=farm_data["latitude"],
                longitude=farm_data["longitude"],
                elevation=farm_data.get("elevation"),
                crop_type=farm_data["crop_type"],
                planting_date=planting_date,
                is_demo=True,
            )
            db.add(db_farm)
            print(f"Added demo farm: {farm_data['name']} ({farm_data['notes']})")

    db.commit()
    print("Demo farms successfully loaded.")
finally:
    db.close()
