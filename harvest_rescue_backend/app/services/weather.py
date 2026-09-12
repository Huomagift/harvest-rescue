"""
Open-Meteo integration. Free, no API key required.
Docs: https://open-meteo.com/en/docs
"""
import requests

from app.services.external_call import call_with_fallback

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

_FALLBACK_WEATHER = {
    "rainfall_next_48h_mm": 0.0,
    "max_temp_next_48h_c": 30.0,
    "raw_daily": {},
}


def get_weather_signal(latitude: float, longitude: float) -> dict:
    """
    Returns forecasted rainfall (next 48h total, mm) and max temperature
    (next 48h) for the given coordinates. Falls back to a labeled default
    on any request failure so the risk pipeline never crashes on a flaky
    network or upstream outage.
    """

    def live_call() -> dict:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": "precipitation",
            "daily": "temperature_2m_max,precipitation_sum",
            "forecast_days": 3,
            "timezone": "auto",
        }
        response = requests.get(OPEN_METEO_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        daily = data.get("daily", {})
        rainfall_next_48h_mm = sum(daily.get("precipitation_sum", [0, 0])[:2])
        max_temp_next_48h = max(daily.get("temperature_2m_max", [0, 0])[:2])

        return {
            "rainfall_next_48h_mm": rainfall_next_48h_mm,
            "max_temp_next_48h_c": max_temp_next_48h,
            "raw_daily": daily,
        }

    return call_with_fallback(live_call, _FALLBACK_WEATHER, source_label="open_meteo")
