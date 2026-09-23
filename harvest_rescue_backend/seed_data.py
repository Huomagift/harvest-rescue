"""
Seed data for Harvest Rescue Risk Intelligence Platform.
Configures 5 diverse Nigerian agro-ecological benchmark farms with real coordinates:
1. Riverside Farm (Omuma, Rivers State: 5.0935°N, 7.2154°E) — Rainforest / Niger Delta
2. Dawanau Grain Belt (Kano State: 12.0022°N, 8.5920°E) — Sudan Savannah (Semi-Arid)
3. Jos Plateau Farm (Plateau State: 9.8965°N, 8.8583°E) — High Altitude Midland
4. Adum Rice Basin (Yala LGA, Cross River: 6.642178°N, 8.357275°E) — River Basin Rice Belt
5. Majek Farms Kaduna (Kaduna Grain Belt: 10.486619°N, 7.443472°E) — Guinea Savannah
"""

BENCHMARK_FARMS = [
    {
        "name": "Majek Farms Kaduna",
        "owner_name": "Alhaji Majekodunmi & Sons",
        "farmer_email": "operations@majek-kaduna.com",
        "location_name": "Kaduna Grain Belt",
        "latitude": 10.486619,
        "longitude": 7.443472,
        "elevation": 578.0,
        "crop_type": "maize",
        "size_hectares": 8.5,
        "planting_date": "2026-05-20",
        "is_demo": True,
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [7.4422, 10.4879],
                [7.4447, 10.4879],
                [7.4447, 10.4853],
                [7.4422, 10.4853],
                [7.4422, 10.4879],
            ]]
        },
        "risk_zones": [],
    },
    {
        "name": "Adum, Yala LGA",
        "owner_name": "Adum Rice Growers Association",
        "farmer_email": "monitoring@adum-rice.org",
        "location_name": "Yala LGA, Cross River",
        "latitude": 6.642178,
        "longitude": 8.357275,
        "elevation": 78.0,
        "crop_type": "rice",
        "size_hectares": 2.2,
        "planting_date": "2026-06-01",
        "is_demo": True,
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [8.3566, 6.6428],
                [8.3580, 6.6428],
                [8.3580, 6.6415],
                [8.3566, 6.6415],
                [8.3566, 6.6428],
            ]]
        },
        "risk_zones": [
            {
                "zone_name": "Northern Paddy Inlet",
                "risk_type": "flood",
                "severity": "medium",
                "label": "Rising Soil Moisture Zone",
                "coordinates": [
                    [8.3568, 6.6426],
                    [8.3578, 6.6426],
                    [8.3578, 6.6420],
                    [8.3568, 6.6420],
                    [8.3568, 6.6426],
                ]
            }
        ],
    },
    {
        "name": "Shiroro Mokwa",
        "owner_name": "Sunrise Agro-Allied Ltd",
        "farmer_email": "agronomy@sunrise-mokwa.ng",
        "location_name": "Mokwa, Niger State",
        "latitude": 9.982164,
        "longitude": 6.809422,
        "elevation": 278.0,
        "crop_type": "sorghum",
        "size_hectares": 2.0,
        "planting_date": "2026-06-15",
        "is_demo": True,
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [6.8087, 9.9828],
                [6.8101, 9.9828],
                [6.8101, 9.9815],
                [6.8087, 9.9815],
                [6.8087, 9.9828],
            ]]
        },
        "risk_zones": [
            {
                "zone_name": "Central Ridge Sector",
                "risk_type": "drought_heat",
                "severity": "medium",
                "label": "Moisture Deficit & Evaporative Stress Zone",
                "coordinates": [
                    [6.8090, 9.9825],
                    [6.8098, 9.9825],
                    [6.8098, 9.9818],
                    [6.8090, 9.9818],
                    [6.8090, 9.9825],
                ]
            }
        ],
    },
    {
        "name": "Riverside Farm",
        "owner_name": "Riverside Agricultural Cooperative",
        "farmer_email": "farm-manager@riverside-agri.ng",
        "location_name": "Omuma, Rivers State",
        "latitude": 5.0935,
        "longitude": 7.2154,
        "elevation": 42.0,
        "crop_type": "maize",
        "size_hectares": 1.4,
        "planting_date": "2026-05-15",
        "is_demo": True,
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [7.2148, 5.0941],
                [7.2160, 5.0941],
                [7.2160, 5.0929],
                [7.2148, 5.0929],
                [7.2148, 5.0941],
            ]]
        },
        "risk_zones": [
            {
                "zone_name": "Lower Basin Furrows",
                "risk_type": "flood",
                "severity": "high",
                "label": "Water Accumulation Risk Zone",
                "coordinates": [
                    [7.2150, 5.0938],
                    [7.2158, 5.0938],
                    [7.2158, 5.0931],
                    [7.2150, 5.0931],
                    [7.2150, 5.0938],
                ]
            }
        ],
    },
    {
        "name": "Jos Plateau Farm",
        "owner_name": "Plateau Growers Union",
        "farmer_email": "contact@jos-plateau-farms.ng",
        "location_name": "Jos, Plateau State",
        "latitude": 9.8965,
        "longitude": 8.8583,
        "elevation": 1217.0,
        "crop_type": "maize",
        "size_hectares": 6.5,
        "planting_date": "2026-05-25",
        "is_demo": True,
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [8.8571, 9.8977],
                [8.8595, 9.8977],
                [8.8595, 9.8953],
                [8.8571, 9.8953],
                [8.8571, 9.8977],
            ]]
        },
        "risk_zones": [],
    },
]
