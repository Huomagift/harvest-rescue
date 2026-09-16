"""
Open-Meteo integration. Free, no API key required.
Docs: https://open-meteo.com/en/docs
"""
import requests
from datetime import date, timedelta

from app.services.external_call import call_with_fallback

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# Generate 16 fallback dates starting today
_today = date.today()
_fallback_dates = [(_today + timedelta(days=i)).isoformat() for i in range(16)]

_FALLBACK_WEATHER = {
    "daily_dates": _fallback_dates,
    "daily_rainfall_mm": [0.0] * 16,
    "daily_max_temp_c": [30.0] * 16,
    "rainfall_next_48h_mm": 0.0,
    "max_temp_next_48h_c": 30.0,
    "raw_daily": {},
}


def get_weather_signal(latitude: float, longitude: float) -> dict:
    """
    Returns forecasted 16-day daily rainfall and max temperature arrays for the
    given coordinates, enabling day-by-day horizon scanning and advance warning.
    Falls back to a labeled default on any request failure so the risk pipeline
    never crashes on a flaky network or upstream outage.
    """

    def live_call() -> dict:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": "precipitation",
            "daily": "temperature_2m_max,precipitation_sum",
            "forecast_days": 16,
            "timezone": "auto",
        }
        response = requests.get(OPEN_METEO_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        daily = data.get("daily", {})
        daily_dates = daily.get("time", [])
        daily_rainfall = [float(r) if r is not None else 0.0 for r in daily.get("precipitation_sum", [])]
        daily_temps = [float(t) if t is not None else 0.0 for t in daily.get("temperature_2m_max", [])]

        rainfall_next_48h_mm = sum(daily_rainfall[:2]) if len(daily_rainfall) >= 2 else sum(daily_rainfall)
        max_temp_next_48h = max(daily_temps[:2]) if len(daily_temps) >= 2 else (daily_temps[0] if daily_temps else 30.0)

        return {
            "daily_dates": daily_dates,
            "daily_rainfall_mm": daily_rainfall,
            "daily_max_temp_c": daily_temps,
            "rainfall_next_48h_mm": rainfall_next_48h_mm,
            "max_temp_next_48h_c": max_temp_next_48h,
            "raw_daily": daily,
        }

    return call_with_fallback(live_call, _FALLBACK_WEATHER, source_label="open_meteo")

