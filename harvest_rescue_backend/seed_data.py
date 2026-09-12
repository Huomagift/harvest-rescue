"""
Seed data for Harvest Rescue AI demo.
Coordinates are real locations chosen to give plausible risk signals:
- Lokoja: Niger/Benue river confluence, real flood exposure history -> good for flood-risk demo
- Makurdi: Benue basin, also flood-prone -> second flood example / contrast farm
- Kaduna (rural maize belt): real cropland, gives a genuine NDVI signal -> good for vigor-decline demo
"""

MOCK_FARMS = [
    {
        "name": "Lokoja Confluence Farm",
        "owner_name": "Demo Farmer A",
        "latitude": 7.8023,
        "longitude": 6.7333,
        "crop_type": "maize",
        "planting_date": "2026-06-15",
        "notes": "Near Niger/Benue confluence — real historical flood exposure, use for flood-risk scenario",
    },
    {
        "name": "Makurdi Riverside Farm",
        "owner_name": "Demo Farmer B",
        "latitude": 7.7322,
        "longitude": 8.5391,
        "crop_type": "rice",
        "planting_date": "2026-06-01",
        "notes": "Benue basin — second flood-prone example, useful as a contrast/control farm",
    },
    {
        "name": "Kaduna Maize Belt Farm",
        "owner_name": "Demo Farmer C",
        "latitude": 10.5105,
        "longitude": 7.4165,
        "crop_type": "maize",
        "planting_date": "2026-05-20",
        "notes": "Real cropland in maize-growing region — use for NDVI/vigor-decline scenario",
    },
]
