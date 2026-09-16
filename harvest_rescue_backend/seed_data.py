"""
Seed data for Harvest Rescue AI demo.
Demo benchmark farms configured per user specifications:
1. Majek farms kaduna: 10°29'11.83"N 7°26'36.50"E, 578 m elevation
2. Adum, Yala LGA: 6°38'31.84"N 8°21'26.19"E, 78 m elevation
3. Shiroro Mokwa: 9°58'55.79"N 6°48'33.92"E, 278 m elevation
"""

MOCK_FARMS = [
    {
        "name": "Majek farms kaduna",
        "owner_name": "Demo Farmer - Kaduna",
        "latitude": 10.486619,
        "longitude": 7.443472,
        "elevation": 578.0,
        "crop_type": "maize",
        "planting_date": "2026-05-20",
        "is_demo": True,
        "notes": "10°29'11.83\"N 7°26'36.50\"E, 578 m elevation — Kaduna grain belt demo",
    },
    {
        "name": "Adum, Yala LGA",
        "owner_name": "Demo Farmer - Yala",
        "latitude": 6.642178,
        "longitude": 8.357275,
        "elevation": 78.0,
        "crop_type": "rice",
        "planting_date": "2026-06-01",
        "is_demo": True,
        "notes": "6°38'31.84\"N 8°21'26.19\"E, 78 m elevation — Yala Cross River basin demo",
    },
    {
        "name": "Shiroro Mokwa",
        "owner_name": "Demo Farmer - Niger",
        "latitude": 9.982164,
        "longitude": 6.809422,
        "elevation": 278.0,
        "crop_type": "sorghum",
        "planting_date": "2026-06-15",
        "is_demo": True,
        "notes": "9°58'55.79\"N 6°48'33.92\"E, 278 m elevation — Shiroro Mokwa Niger State demo",
    },
]
