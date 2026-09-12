"""
Run this once after the app has started (so tables exist) to populate
the three demo farms. Usage: python load_seed_data.py
"""
from datetime import date

from app.database import SessionLocal, engine, Base
from app import models
from seed_data import MOCK_FARMS

Base.metadata.create_all(bind=engine)
db = SessionLocal()

for farm_data in MOCK_FARMS:
    existing = db.query(models.Farm).filter(models.Farm.name == farm_data["name"]).first()
    if existing:
        print(f"Skipping (already exists): {farm_data['name']}")
        continue

    planting_date = date.fromisoformat(farm_data["planting_date"])
    db_farm = models.Farm(
        name=farm_data["name"],
        owner_name=farm_data["owner_name"],
        latitude=farm_data["latitude"],
        longitude=farm_data["longitude"],
        crop_type=farm_data["crop_type"],
        planting_date=planting_date,
    )
    db.add(db_farm)
    print(f"Added: {farm_data['name']} ({farm_data['notes']})")

db.commit()
db.close()
print("Done.")
