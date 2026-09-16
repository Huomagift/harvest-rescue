"""
Composite risk scoring — explicitly rules-based, not a trained model.
Scans the full 16-day forecast horizon day-by-day to provide 1-2 week advance warning
with calculated days_to_impact and full explainability in contributing_data.
"""
from typing import Optional

FLOOD_RAINFALL_THRESHOLD_MM = 40.0        # cumulative rainfall over rolling 3 days (or single day heavy rain)
HEAT_TEMP_THRESHOLD_C = 35.0               # max temp threshold for heat/drought stress window
DROUGHT_LOW_RAINFALL_MM = 3.0              # low rainfall limit over multi-day heat window
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
    (from services.satellite), scans the 16-day forecast horizon day-by-day,
    and returns a list of triggered risk events with computed days_to_impact.
    """
    events = []

    daily_dates = weather.get("daily_dates", [])
    daily_rainfall = weather.get("daily_rainfall_mm", [])
    daily_temps = weather.get("daily_max_temp_c", [])
    ndvi_delta = ndvi.get("ndvi_trend_delta")

    # Fallback to 48h totals if daily arrays are unavailable
    if not daily_rainfall:
        daily_rainfall = [weather.get("rainfall_next_48h_mm", 0.0)]
    if not daily_temps:
        daily_temps = [weather.get("max_temp_next_48h_c", 30.0)]

    num_days = min(len(daily_rainfall), len(daily_temps))

    # --- 1. FLOOD RISK (Rolling 3-day cumulative rainfall or single heavy downpour) ---
    flood_earliest_day: Optional[int] = None
    flood_max_rain: float = 0.0
    flood_window_rain: float = 0.0

    for i in range(num_days):
        # 3-day rolling sum starting at day i
        window_sum = sum(daily_rainfall[i:min(i + 3, num_days)])
        single_day_rain = daily_rainfall[i]

        if window_sum >= FLOOD_RAINFALL_THRESHOLD_MM or single_day_rain >= 30.0:
            if flood_earliest_day is None:
                flood_earliest_day = i
                flood_window_rain = window_sum
            flood_max_rain = max(flood_max_rain, window_sum)

    if flood_earliest_day is not None:
        impact_date = daily_dates[flood_earliest_day] if flood_earliest_day < len(daily_dates) else None
        severity = severity_from_margin(flood_max_rain, FLOOD_RAINFALL_THRESHOLD_MM, 20.0)
        events.append({
            "risk_type": "flood",
            "severity": severity,
            "days_to_impact": float(flood_earliest_day),
            "contributing_data": {
                "impact_day_index": flood_earliest_day,
                "impact_date": impact_date,
                "window_rainfall_mm": round(flood_window_rain, 1),
                "max_window_rainfall_mm": round(flood_max_rain, 1),
                "threshold_mm": FLOOD_RAINFALL_THRESHOLD_MM,
                "rainfall_next_48h_mm": weather.get("rainfall_next_48h_mm", 0.0),
            },
        })

    # --- 2. DROUGHT / HEAT STRESS (Sustained high temp + low rainfall over multi-day window) ---
    drought_earliest_day: Optional[int] = None
    drought_max_temp: float = 0.0
    drought_window_rain: float = 0.0

    for i in range(num_days):
        # 3-day window evaluation starting at day i
        window_temps = daily_temps[i:min(i + 3, num_days)]
        window_rain = sum(daily_rainfall[i:min(i + 3, num_days)])
        max_t = max(window_temps) if window_temps else 0.0

        if max_t >= HEAT_TEMP_THRESHOLD_C and window_rain <= DROUGHT_LOW_RAINFALL_MM:
            if drought_earliest_day is None:
                drought_earliest_day = i
                drought_window_rain = window_rain
            drought_max_temp = max(drought_max_temp, max_t)

    if drought_earliest_day is not None:
        impact_date = daily_dates[drought_earliest_day] if drought_earliest_day < len(daily_dates) else None
        severity = severity_from_margin(drought_max_temp, HEAT_TEMP_THRESHOLD_C, 4.0)
        events.append({
            "risk_type": "drought_heat",
            "severity": severity,
            "days_to_impact": float(drought_earliest_day),
            "contributing_data": {
                "impact_day_index": drought_earliest_day,
                "impact_date": impact_date,
                "max_temp_c": round(drought_max_temp, 1),
                "window_rainfall_mm": round(drought_window_rain, 1),
                "threshold_temp_c": HEAT_TEMP_THRESHOLD_C,
                "max_temp_next_48h_c": weather.get("max_temp_next_48h_c", 0.0),
            },
        })

    # --- 3. CROP VIGOR DECLINE (Satellite-derived, already in progress) ---
    if ndvi_delta is not None and ndvi_delta <= VIGOR_DECLINE_NDVI_DELTA_THRESHOLD:
        events.append({
            "risk_type": "vigor_decline",
            "severity": severity_from_margin(-ndvi_delta, -VIGOR_DECLINE_NDVI_DELTA_THRESHOLD, 0.1),
            "days_to_impact": None,
            "contributing_data": {
                "ndvi_current": ndvi.get("ndvi_current"),
                "ndvi_trend_delta": ndvi_delta,
            },
        })

    # --- 4. FARMER-REPORTED OBSERVATIONS ---
    if farmer_flag:
        events.append({
            "risk_type": farmer_flag.get("category", "farmer_reported"),
            "severity": "low",
            "days_to_impact": None,
            "contributing_data": {"note": farmer_flag.get("note")},
        })

    return events

