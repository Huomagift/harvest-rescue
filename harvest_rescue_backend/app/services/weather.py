"""
Location-specific weather and environmental data service.
Delegates to the centralized environmental service with retry, backoff, and caching.
Maintains backward compatibility for callers expecting get_weather_signal(lat, lon).
"""
import logging
from typing import Dict, Any

from app.services.environmental_service import (
    _request_open_meteo_batch,
    parse_open_meteo_item,
    build_safe_baseline_snapshot,
)

logger = logging.getLogger("harvest_rescue")


def get_weather_signal(latitude: float, longitude: float) -> dict:
    """
    Returns authentic location-specific environmental data for the given coordinates:
    15-day sequential actuals and forecast for precipitation, root zone soil moisture,
    temperatures, relative humidity, and evapotranspiration.

    Uses centralized retry and exponential backoff to guard against 429 rate limits.
    Falls back to safe baseline on provider outage rather than crashing.
    """
    results = _request_open_meteo_batch([(latitude, longitude)])
    if results and len(results) > 0:
        return parse_open_meteo_item(results[0], source_label="live_open_meteo")

    logger.warning(
        f"[weather] Open-Meteo live request failed for ({latitude}, {longitude}). "
        f"Returning safe baseline snapshot to prevent crash/502."
    )
    return build_safe_baseline_snapshot(latitude, longitude, note="stale_baseline_fallback")
