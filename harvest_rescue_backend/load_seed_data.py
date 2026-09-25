"""
Populate and sync the 5 benchmark demo farms in Supabase database.
Removes obsolete demo test farms while strictly preserving user's registered farms.
Usage: python load_seed_data.py
"""
from datetime import date

from app.database import SessionLocal, init_db
from app import models
from seed_data import BENCHMARK_FARMS

init_db()
db = SessionLocal()

try:
    benchmark_names = set(f["name"] for f in BENCHMARK_FARMS)

    # 1. Sync the 5 benchmark demo farms
    for farm_data in BENCHMARK_FARMS:
        existing = db.query(models.Farm).filter(models.Farm.name == farm_data["name"]).first()
        planting_date = date.fromisoformat(farm_data["planting_date"]) if farm_data.get("planting_date") else None
        
        if existing:
            existing.owner_name = farm_data["owner_name"]
            existing.farmer_email = farm_data.get("farmer_email")
            existing.location_name = farm_data.get("location_name")
            existing.latitude = farm_data["latitude"]
            existing.longitude = farm_data["longitude"]
            existing.elevation = farm_data.get("elevation")
            existing.crop_type = farm_data["crop_type"]
            existing.size_hectares = farm_data.get("size_hectares")
            existing.planting_date = planting_date
            existing.boundary_geojson = farm_data.get("boundary_geojson")
            existing.risk_zones = farm_data.get("risk_zones")
            existing.is_demo = True
            print(f"Updated benchmark farm: {farm_data['name']} ({farm_data.get('location_name')})")
        else:
            db_farm = models.Farm(
                name=farm_data["name"],
                owner_name=farm_data["owner_name"],
                farmer_email=farm_data.get("farmer_email"),
                location_name=farm_data.get("location_name"),
                latitude=farm_data["latitude"],
                longitude=farm_data["longitude"],
                elevation=farm_data.get("elevation"),
                crop_type=farm_data["crop_type"],
                size_hectares=farm_data.get("size_hectares"),
                planting_date=planting_date,
                boundary_geojson=farm_data.get("boundary_geojson"),
                risk_zones=farm_data.get("risk_zones"),
                is_demo=True,
            )
            db.add(db_farm)
            print(f"Added benchmark farm: {farm_data['name']} ({farm_data.get('location_name')})")

    # 2. Clean up obsolete demo farms (is_demo == True and not in benchmark_names)
    obsolete_demos = db.query(models.Farm).filter(
        models.Farm.is_demo == True,
        ~models.Farm.name.in_(benchmark_names)
    ).all()
    for ob in obsolete_demos:
        print(f"Cleaning up obsolete demo farm: {ob.name} ({ob.id})")
        db.query(models.Alert).filter(models.Alert.farm_id == ob.id).delete()
        db.query(models.RiskEvent).filter(models.RiskEvent.farm_id == ob.id).delete()
        db.query(models.FarmerReport).filter(models.FarmerReport.farm_id == ob.id).delete()
        db.query(models.EnvironmentalSnapshot).filter(models.EnvironmentalSnapshot.farm_id == ob.id).delete()
        db.delete(ob)

    # 3. Clean up any anonymous test farms without owner/email
    anon_tests = db.query(models.Farm).filter(
        models.Farm.name.in_(["My Farm Field 1"])
    ).all()
    for an in anon_tests:
        print(f"Cleaning up anonymous test farm: {an.name} ({an.id})")
        db.query(models.Alert).filter(models.Alert.farm_id == an.id).delete()
        db.query(models.RiskEvent).filter(models.RiskEvent.farm_id == an.id).delete()
        db.query(models.FarmerReport).filter(models.FarmerReport.farm_id == an.id).delete()
        db.query(models.EnvironmentalSnapshot).filter(models.EnvironmentalSnapshot.farm_id == an.id).delete()
        db.delete(an)

    db.commit()

    # 4. Batch refresh environmental snapshots for all benchmark demo farms in ONE batched call
    print("Pre-warming environmental snapshot cache for benchmark demo farms...")
    from app.services.environmental_service import batch_refresh_farms
    active_demos = db.query(models.Farm).filter(models.Farm.is_demo == True).all()
    refresh_result = batch_refresh_farms(db, active_demos)
    print(f"Benchmark snapshots ready: {refresh_result['refreshed_count']} refreshed, {refresh_result['cached_fresh_count']} cached.")

    print("Database sync completed. 5 benchmark demo farms active, user farms preserved.")
finally:
    db.close()
