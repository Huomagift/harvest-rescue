"""
Composite risk scoring — explicitly rules-based, not a trained model.
Each rule is independent and can fire on its own; a farm can have multiple
active risk events at once (e.g. flood risk AND vigor decline).

Thresholds below are starting points for a demo, not calibrated agronomic
science — tune them against your actual demo farms so at least one clearly
triggers and one clearly doesn't (for contrast).
"""
from typing import Optional

FLOOD_RAINFALL_THRESHOLD_MM = 40.0        # forecasted rainfall over next 48h
HEAT_TEMP_THRESHOLD_C = 38.0               # max temp over next 48h
DROUGHT_LOW_RAINFALL_MM = 2.0              # paired with high temp for drought stress
VIGOR_DECLINE_NDVI_DELTA_THRESHOLD = -0.08 # negative trend over ~14 days


def severity_from_margin(value: float, threshold: float, scale: float) -> str:
    """Simple severity bucketing based on how far past threshold the value is."""
    margin = (value - threshold) / scale
    if margin >= 1.0:
        return "high"
    elif margin >= 0.4:
        return "medium"
    return "low"


def evaluate_risk(weather: dict, ndvi: dict, farmer_flag: Optional[dict] = None) -> list[dict]:
    """
    Takes weather signal dict (from services.weather) and ndvi signal dict
    (from services.satellite), returns a list of triggered risk events.
    Each farm-check can produce zero, one, or multiple risk events.
    """
    events = []

    rainfall = weather.get("rainfall_next_48h_mm", 0)
    max_temp = weather.get("max_temp_next_48h_c", 0)
    ndvi_delta = ndvi.get("ndvi_trend_delta")

    # Flood risk
    if rainfall >= FLOOD_RAINFALL_THRESHOLD_MM:
        events.append({
            "risk_type": "flood",
            "severity": severity_from_margin(rainfall, FLOOD_RAINFALL_THRESHOLD_MM, 20.0),
            "days_to_impact": 2,
            "contributing_data": {"rainfall_next_48h_mm": rainfall},
        })

    # Heat / drought stress
    if max_temp >= HEAT_TEMP_THRESHOLD_C and rainfall <= DROUGHT_LOW_RAINFALL_MM:
        events.append({
            "risk_type": "drought_heat",
            "severity": severity_from_margin(max_temp, HEAT_TEMP_THRESHOLD_C, 4.0),
            "days_to_impact": 3,
            "contributing_data": {"max_temp_next_48h_c": max_temp, "rainfall_next_48h_mm": rainfall},
        })

    # Crop vigor decline (satellite-derived, already in progress rather than future)
    if ndvi_delta is not None and ndvi_delta <= VIGOR_DECLINE_NDVI_DELTA_THRESHOLD:
        events.append({
            "risk_type": "vigor_decline",
            "severity": severity_from_margin(-ndvi_delta, -VIGOR_DECLINE_NDVI_DELTA_THRESHOLD, 0.1),
            "days_to_impact": None,
            "contributing_data": {"ndvi_current": ndvi.get("ndvi_current"), "ndvi_trend_delta": ndvi_delta},
        })

    # Farmer-reported flag adds context to whatever is already firing,
    # or can stand alone as a lower-confidence signal.
    if farmer_flag:
        events.append({
            "risk_type": farmer_flag.get("category", "farmer_reported"),
            "severity": "low",
            "days_to_impact": None,
            "contributing_data": {"note": farmer_flag.get("note")},
        })

    return events
