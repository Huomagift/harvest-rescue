"""
Centralized Environmental Data Service for Harvest Rescue.

All environmental data requests (from farm pages, risk calculations, monitoring sweeps,
or schedulers) pass through this service to prevent Open-Meteo 429 rate-limit errors
and maintain continuous 24/7 monitoring.

Architecture & Invariants:
1. Centralized provider queries: Individual farm pages and risk calculations NEVER query
   Open-Meteo directly. They always request through this service.
2. Batched coordinate queries: When multiple farms need refreshing, their coordinates
   are batched together into single HTTP requests (up to BATCH_SIZE per request).
3. Database caching with 24-hour TTL: Each farm/location caches the latest successful
   observation snapshot with fetched_at, expires_at, and data_freshness status.
4. Deduplication & locking: Concurrent requests for the same farm or locations reuse
   the active refresh or serve the cached snapshot, preventing duplicate API requests.
5. Retry with exponential backoff: On HTTP 429, requests back off and retry progressively.
6. Stale data resilience: If Open-Meteo is temporarily unreachable, the service falls back
   to stale cached snapshots with clear telemetry, never returning a 502 or creating
   erroneous high-risk alerts.
7. Demo vs User separation: Demo benchmarks and authenticated user farms are isolated.
8. Comprehensive diagnostics tracking and logging.
"""

from datetime import datetime, timedelta
import logging
import threading
import time
from typing import Dict, List, Optional, Tuple, Any

import requests
from sqlalchemy.orm import Session

from app import models

logger = logging.getLogger("harvest_rescue")

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
CACHE_TTL_HOURS = 24
BATCH_SIZE = 25
MAX_RETRIES = 3
BASE_BACKOFF_SECONDS = 1.5


class EnvironmentalDiagnosticsTracker:
    """Thread-safe telemetry tracker for environmental monitoring operations."""

    def __init__(self):
        self._lock = threading.Lock()
        self.last_successful_refresh: Optional[datetime] = None
        self.next_scheduled_refresh: Optional[datetime] = None
        self.open_meteo_request_count: int = 0
        self.occurrences_429: int = 0
        self.failed_farms: List[Dict[str, Any]] = []
        self.cached_data_usage_count: int = 0
        self.total_refreshes_completed: int = 0

    def record_request(self, batch_size: int = 1):
        with self._lock:
            self.open_meteo_request_count += 1
            logger.info(
                f"[environmental_service] Outgoing Open-Meteo request (batch_size={batch_size}, "
                f"total_requests={self.open_meteo_request_count})"
            )

    def record_429(self):
        with self._lock:
            self.occurrences_429 += 1
            logger.warning(
                f"[environmental_service] Provider 429 Rate-Limit encountered. "
                f"Total 429 occurrences: {self.occurrences_429}"
            )

    def record_success(self, refreshed_count: int = 1):
        with self._lock:
            now = datetime.utcnow()
            self.last_successful_refresh = now
            self.next_scheduled_refresh = now + timedelta(hours=CACHE_TTL_HOURS)
            self.total_refreshes_completed += refreshed_count
            logger.info(
                f"[environmental_service] Successful environmental refresh. "
                f"Refreshed: {refreshed_count}, next scheduled: {self.next_scheduled_refresh.isoformat()}"
            )

    def record_cache_hit(self, farm_id: Optional[str] = None):
        with self._lock:
            self.cached_data_usage_count += 1

    def record_failed_farm(self, farm_id: str, farm_name: str, error: str):
        with self._lock:
            entry = {
                "farm_id": farm_id,
                "farm_name": farm_name,
                "error": str(error),
                "timestamp": datetime.utcnow().isoformat(),
            }
            self.failed_farms.append(entry)
            # Keep list bounded
            if len(self.failed_farms) > 100:
                self.failed_farms = self.failed_farms[-100:]
            logger.error(f"[environmental_service] Farm refresh failed: {farm_name} ({farm_id}): {error}")

    def get_diagnostics(self, db: Optional[Session] = None) -> Dict[str, Any]:
        with self._lock:
            fresh_count = 0
            stale_count = 0
            total_snapshots = 0
            if db:
                try:
                    now = datetime.utcnow()
                    snapshots = db.query(models.EnvironmentalSnapshot).all()
                    total_snapshots = len(snapshots)
                    for s in snapshots:
                        if s.status == "fresh" and s.expires_at > now:
                            fresh_count += 1
                        else:
                            stale_count += 1
                except Exception as e:
                    logger.debug(f"[environmental_service] Error reading snapshot stats: {e}")

            return {
                "last_successful_refresh": self.last_successful_refresh.isoformat() if self.last_successful_refresh else None,
                "next_scheduled_refresh": self.next_scheduled_refresh.isoformat() if self.next_scheduled_refresh else None,
                "open_meteo_request_count": self.open_meteo_request_count,
                "occurrences_429": self.occurrences_429,
                "failed_farms": list(self.failed_farms[-20:]),  # Return recent 20
                "failed_farms_count": len(self.failed_farms),
                "cached_data_usage_count": self.cached_data_usage_count,
                "total_snapshots": total_snapshots,
                "fresh_snapshots_count": fresh_count,
                "stale_snapshots_count": stale_count,
                "refresh_interval_hours": CACHE_TTL_HOURS,
            }


# Singleton diagnostics tracker
diagnostics = EnvironmentalDiagnosticsTracker()

# In-process synchronization structures to prevent duplicate concurrent refreshes
_refresh_lock = threading.Lock()
_active_farm_refreshes = set()


def parse_open_meteo_item(data: dict, source_label: str = "live_open_meteo") -> dict:
    """
    Parses a single location Open-Meteo dictionary into the standard 15-day sequential
    environmental signal package used by Harvest Rescue risk engine and dashboard.
    """
    daily = data.get("daily", {})
    daily_dates = daily.get("time", [])
    daily_rainfall = [float(r) if r is not None else 0.0 for r in daily.get("precipitation_sum", [])]
    daily_max_temps = [float(t) if t is not None else 30.0 for t in daily.get("temperature_2m_max", [])]
    daily_min_temps = [float(t) if t is not None else 22.0 for t in daily.get("temperature_2m_min", [])]
    daily_et0 = [float(e) if e is not None else 3.5 for e in daily.get("et0_fao_evapotranspiration", [])]

    hourly = data.get("hourly", {})
    hourly_moisture = hourly.get("soil_moisture_0_to_7cm", [])
    hourly_humidity = hourly.get("relative_humidity_2m", [])

    num_days = len(daily_dates)
    daily_moisture_pct: List[float] = []
    daily_humidity_pct: List[float] = []

    for day_idx in range(num_days):
        start_h = day_idx * 24
        end_h = start_h + 24

        day_moist_vals = [float(v) for v in hourly_moisture[start_h:end_h] if v is not None]
        if day_moist_vals:
            avg_m = (sum(day_moist_vals) / len(day_moist_vals)) * 100.0
            daily_moisture_pct.append(round(avg_m, 1))
        else:
            daily_moisture_pct.append(30.0)

        day_hum_vals = [float(v) for v in hourly_humidity[start_h:end_h] if v is not None]
        if day_hum_vals:
            avg_h = sum(day_hum_vals) / len(day_hum_vals)
            daily_humidity_pct.append(round(avg_h, 1))
        else:
            daily_humidity_pct.append(65.0)

    today_idx = 7 if len(daily_dates) > 7 else (len(daily_dates) - 1 if daily_dates else 0)

    past_7d_rainfall = sum(daily_rainfall[:today_idx])
    next_48h_rainfall = sum(daily_rainfall[today_idx : min(today_idx + 2, num_days)])
    forecast_7d_rainfall = sum(daily_rainfall[today_idx : min(today_idx + 7, num_days)])

    current_moisture = daily_moisture_pct[today_idx] if len(daily_moisture_pct) > today_idx else 30.0
    current_humidity = daily_humidity_pct[today_idx] if len(daily_humidity_pct) > today_idx else 65.0
    current_temp = daily_max_temps[today_idx] if len(daily_max_temps) > today_idx else 30.0
    current_et0 = daily_et0[today_idx] if len(daily_et0) > today_idx else 3.5

    return {
        "daily_dates": daily_dates,
        "daily_rainfall_mm": daily_rainfall,
        "daily_max_temp_c": daily_max_temps,
        "daily_min_temp_c": daily_min_temps,
        "daily_soil_moisture_pct": daily_moisture_pct,
        "daily_humidity_pct": daily_humidity_pct,
        "daily_et0_mm": daily_et0,
        "past_7d_rainfall_mm": round(past_7d_rainfall, 1),
        "rainfall_next_48h_mm": round(next_48h_rainfall, 1),
        "forecast_7d_rainfall_mm": round(forecast_7d_rainfall, 1),
        "current_soil_moisture_pct": round(current_moisture, 1),
        "current_humidity_pct": round(current_humidity, 1),
        "current_temp_c": round(current_temp, 1),
        "current_et0_mm": round(current_et0, 1),
        "today_index": today_idx,
        "source": source_label,
        "raw_daily": daily,
    }


def build_safe_baseline_snapshot(latitude: float, longitude: float, note: str = "baseline_stale") -> dict:
    """
    Constructs a safe, non-extreme agronomic fallback snapshot.
    Guarantees that temporary provider outages do NOT crash calculations or trigger false alerts.
    """
    today = datetime.utcnow().date()
    dates = [(today + timedelta(days=i - 7)).isoformat() for i in range(15)]
    rainfall = [0.0] * 15
    max_temps = [29.0] * 15
    min_temps = [21.0] * 15
    moisture = [32.0] * 15
    humidity = [65.0] * 15
    et0 = [3.8] * 15

    return {
        "daily_dates": dates,
        "daily_rainfall_mm": rainfall,
        "daily_max_temp_c": max_temps,
        "daily_min_temp_c": min_temps,
        "daily_soil_moisture_pct": moisture,
        "daily_humidity_pct": humidity,
        "daily_et0_mm": et0,
        "past_7d_rainfall_mm": 0.0,
        "rainfall_next_48h_mm": 0.0,
        "forecast_7d_rainfall_mm": 0.0,
        "current_soil_moisture_pct": 32.0,
        "current_humidity_pct": 65.0,
        "current_temp_c": 29.0,
        "current_et0_mm": 3.8,
        "today_index": 7,
        "source": note,
        "raw_daily": {},
        "is_baseline": True,
    }


def _request_open_meteo_batch(
    coords: List[Tuple[float, float]],
    max_retries: int = MAX_RETRIES,
    base_delay: float = BASE_BACKOFF_SECONDS,
) -> Optional[List[dict]]:
    """
    Performs batched query to Open-Meteo for multiple coordinates with retry
    and exponential backoff on 429 and transient provider errors.
    Returns list of location dicts in order, or None if all retries fail.
    """
    if not coords:
        return []

    lat_str = ",".join(f"{lat:.5f}" for lat, _ in coords)
    lon_str = ",".join(f"{lon:.5f}" for _, lon in coords)

    params = {
        "latitude": lat_str,
        "longitude": lon_str,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration",
        "hourly": "relative_humidity_2m,soil_moisture_0_to_7cm",
        "past_days": 7,
        "forecast_days": 8,  # Total 15 days (7 past + today + 7 forecast)
        "timezone": "auto",
    }

    for attempt in range(max_retries):
        diagnostics.record_request(batch_size=len(coords))
        try:
            resp = requests.get(OPEN_METEO_URL, params=params, timeout=15)

            if resp.status_code == 429:
                diagnostics.record_429()
                retry_after = resp.headers.get("Retry-After")
                if retry_after and retry_after.isdigit():
                    wait_time = min(float(retry_after), 10.0)
                else:
                    wait_time = base_delay * (2 ** attempt)

                logger.warning(
                    f"[environmental_service] 429 rate limit hit. Attempt {attempt + 1}/{max_retries}. "
                    f"Backing off for {wait_time:.1f}s before retry..."
                )
                time.sleep(wait_time)
                continue

            resp.raise_for_status()
            data = resp.json()

            # Single coordinate query returns dict, multiple coordinates returns list of dicts
            if isinstance(data, dict):
                return [data]
            elif isinstance(data, list):
                return data
            else:
                logger.error(f"[environmental_service] Unexpected response format from Open-Meteo: {type(data)}")
                return None

        except requests.exceptions.RequestException as req_err:
            wait_time = base_delay * (2 ** attempt)
            logger.warning(
                f"[environmental_service] Network/provider error on attempt {attempt + 1}/{max_retries}: {req_err}. "
                f"Retrying in {wait_time:.1f}s..."
            )
            time.sleep(wait_time)
        except Exception as e:
            logger.error(f"[environmental_service] Unexpected error querying Open-Meteo: {e}")
            break

    logger.error(f"[environmental_service] Batch request for {len(coords)} coordinates failed after {max_retries} attempts.")
    return None


def get_farm_environmental_data(
    db: Session,
    farm: models.Farm,
    force_refresh: bool = False,
) -> dict:
    """
    Returns environmental observation data for a specific farm.
    Always checks cache first: if fresh, returns immediately without calling Open-Meteo.
    If expired or missing, refreshes data safely with locking and falls back to stale data on provider error.
    """
    now = datetime.utcnow()
    snapshot = (
        db.query(models.EnvironmentalSnapshot)
        .filter(models.EnvironmentalSnapshot.farm_id == farm.id)
        .first()
    )

    # 1. Cache hit: fresh snapshot exists and force_refresh is not requested
    if snapshot and not force_refresh:
        if snapshot.expires_at > now and snapshot.status == "fresh":
            diagnostics.record_cache_hit(farm.id)
            result = dict(snapshot.data)
            result["data_freshness"] = "fresh"
            result["fetched_at"] = snapshot.fetched_at.isoformat()
            result["expires_at"] = snapshot.expires_at.isoformat()
            result["cached"] = True
            return result

    # 2. Concurrency guard: avoid duplicate simultaneous refreshes for the same farm
    with _refresh_lock:
        if farm.id in _active_farm_refreshes:
            if snapshot:
                diagnostics.record_cache_hit(farm.id)
                result = dict(snapshot.data)
                result["data_freshness"] = "stale" if snapshot.expires_at <= now else "fresh"
                result["fetched_at"] = snapshot.fetched_at.isoformat()
                result["expires_at"] = snapshot.expires_at.isoformat()
                result["cached"] = True
                return result

        _active_farm_refreshes.add(farm.id)

    try:
        # 3. Refresh live provider data
        logger.info(f"[environmental_service] Fetching fresh environmental data for farm {farm.name} ({farm.id})...")
        coords = [(farm.latitude, farm.longitude)]
        results = _request_open_meteo_batch(coords)

        if results and len(results) > 0:
            parsed = parse_open_meteo_item(results[0], source_label="live_open_meteo")
            expires_at = now + timedelta(hours=CACHE_TTL_HOURS)

            if snapshot:
                snapshot.data = parsed
                snapshot.raw_daily = parsed.get("raw_daily")
                snapshot.latitude = farm.latitude
                snapshot.longitude = farm.longitude
                snapshot.fetched_at = now
                snapshot.expires_at = expires_at
                snapshot.status = "fresh"
                snapshot.is_demo = farm.is_demo
                snapshot.updated_at = now
            else:
                snapshot = models.EnvironmentalSnapshot(
                    farm_id=farm.id,
                    latitude=farm.latitude,
                    longitude=farm.longitude,
                    data=parsed,
                    raw_daily=parsed.get("raw_daily"),
                    fetched_at=now,
                    expires_at=expires_at,
                    status="fresh",
                    is_demo=farm.is_demo,
                )
                db.add(snapshot)

            db.commit()
            db.refresh(snapshot)
            diagnostics.record_success(1)

            res = dict(snapshot.data)
            res["data_freshness"] = "fresh"
            res["fetched_at"] = snapshot.fetched_at.isoformat()
            res["expires_at"] = snapshot.expires_at.isoformat()
            res["cached"] = False
            return res
        else:
            # Provider failed after retries: fallback to stale cached data or baseline
            diagnostics.record_failed_farm(farm.id, farm.name, "Open-Meteo provider unavailable after retries")
            if snapshot:
                snapshot.status = "stale"
                db.commit()
                diagnostics.record_cache_hit(farm.id)
                res = dict(snapshot.data)
                res["data_freshness"] = "stale"
                res["fetched_at"] = snapshot.fetched_at.isoformat()
                res["expires_at"] = snapshot.expires_at.isoformat()
                res["cached"] = True
                res["is_stale"] = True
                logger.warning(
                    f"[environmental_service] Provider unavailable for {farm.name}. "
                    f"Using stale cached snapshot from {snapshot.fetched_at.isoformat()}."
                )
                return res
            else:
                # No snapshot exists at all yet: construct safe baseline to prevent 502/crashes
                baseline = build_safe_baseline_snapshot(farm.latitude, farm.longitude, note="stale_baseline_fallback")
                snapshot = models.EnvironmentalSnapshot(
                    farm_id=farm.id,
                    latitude=farm.latitude,
                    longitude=farm.longitude,
                    data=baseline,
                    raw_daily={},
                    fetched_at=now,
                    expires_at=now + timedelta(hours=1),  # Retry sooner
                    status="stale",
                    is_demo=farm.is_demo,
                )
                db.add(snapshot)
                db.commit()
                res = dict(baseline)
                res["data_freshness"] = "stale"
                res["fetched_at"] = now.isoformat()
                res["expires_at"] = (now + timedelta(hours=1)).isoformat()
                res["cached"] = False
                res["is_stale"] = True
                return res

    finally:
        with _refresh_lock:
            _active_farm_refreshes.discard(farm.id)


def batch_refresh_farms(
    db: Session,
    farms: List[models.Farm],
    force_refresh: bool = False,
) -> dict:
    """
    Central batch refresh for multiple farms.
    1. Determines which farms need fresh data based on expiration/freshness.
    2. Groups coordinates into batched requests (up to BATCH_SIZE per API call).
    3. Updates database snapshots per farm.
    4. Fault tolerant: If a batch fails, existing snapshots are marked stale and execution continues.
    """
    now = datetime.utcnow()
    farms_to_refresh: List[models.Farm] = []
    cached_fresh_count = 0
    refreshed_count = 0
    stale_count = 0
    failed_farms_list = []

    # Map existing snapshots
    farm_ids = [f.id for f in farms]
    snapshots = (
        db.query(models.EnvironmentalSnapshot)
        .filter(models.EnvironmentalSnapshot.farm_id.in_(farm_ids))
        .all()
    )
    snapshot_by_farm_id = {s.farm_id: s for s in snapshots}

    for farm in farms:
        s = snapshot_by_farm_id.get(farm.id)
        if s and s.status == "fresh" and s.expires_at > now and not force_refresh:
            cached_fresh_count += 1
            diagnostics.record_cache_hit(farm.id)
        else:
            farms_to_refresh.append(farm)

    logger.info(
        f"[environmental_service] Batch check for {len(farms)} farms: "
        f"{cached_fresh_count} fresh in cache, {len(farms_to_refresh)} need provider refresh."
    )

    if not farms_to_refresh:
        return {
            "total_farms": len(farms),
            "refreshed_count": 0,
            "cached_fresh_count": cached_fresh_count,
            "stale_fallback_count": 0,
            "failed_count": 0,
            "diagnostics": diagnostics.get_diagnostics(db),
        }

    # Process in chunks of BATCH_SIZE
    for i in range(0, len(farms_to_refresh), BATCH_SIZE):
        chunk = farms_to_refresh[i : i + BATCH_SIZE]
        coords = [(f.latitude, f.longitude) for f in chunk]

        logger.info(
            f"[environmental_service] Sending batched Open-Meteo request for chunk of {len(chunk)} farms "
            f"({i + 1} to {min(i + BATCH_SIZE, len(farms_to_refresh))} of {len(farms_to_refresh)})..."
        )
        batch_results = _request_open_meteo_batch(coords)

        if batch_results and len(batch_results) == len(chunk):
            expires_at = now + timedelta(hours=CACHE_TTL_HOURS)
            for farm, res_item in zip(chunk, batch_results):
                try:
                    parsed = parse_open_meteo_item(res_item, source_label="live_open_meteo")
                    s = snapshot_by_farm_id.get(farm.id)
                    if s:
                        s.data = parsed
                        s.raw_daily = parsed.get("raw_daily")
                        s.latitude = farm.latitude
                        s.longitude = farm.longitude
                        s.fetched_at = now
                        s.expires_at = expires_at
                        s.status = "fresh"
                        s.is_demo = farm.is_demo
                        s.updated_at = now
                    else:
                        s = models.EnvironmentalSnapshot(
                            farm_id=farm.id,
                            latitude=farm.latitude,
                            longitude=farm.longitude,
                            data=parsed,
                            raw_daily=parsed.get("raw_daily"),
                            fetched_at=now,
                            expires_at=expires_at,
                            status="fresh",
                            is_demo=farm.is_demo,
                        )
                        db.add(s)
                        snapshot_by_farm_id[farm.id] = s
                    refreshed_count += 1
                except Exception as parse_err:
                    logger.error(f"[environmental_service] Error parsing result for farm {farm.name}: {parse_err}")
                    diagnostics.record_failed_farm(farm.id, farm.name, str(parse_err))
                    failed_farms_list.append(farm.id)

            db.commit()
            diagnostics.record_success(len(chunk))
        else:
            # Batch failed after retries: fallback to stale snapshots for this chunk
            logger.error(
                f"[environmental_service] Batch provider query failed for chunk of {len(chunk)} farms. "
                f"Falling back to stale data without crashing sweep."
            )
            for farm in chunk:
                diagnostics.record_failed_farm(farm.id, farm.name, "Batch request failed after retries")
                failed_farms_list.append(farm.id)
                s = snapshot_by_farm_id.get(farm.id)
                if s:
                    s.status = "stale"
                    stale_count += 1
                else:
                    # Create safe baseline
                    baseline = build_safe_baseline_snapshot(farm.latitude, farm.longitude, note="stale_baseline_fallback")
                    s = models.EnvironmentalSnapshot(
                        farm_id=farm.id,
                        latitude=farm.latitude,
                        longitude=farm.longitude,
                        data=baseline,
                        raw_daily={},
                        fetched_at=now,
                        expires_at=now + timedelta(hours=1),
                        status="stale",
                        is_demo=farm.is_demo,
                    )
                    db.add(s)
                    snapshot_by_farm_id[farm.id] = s
                    stale_count += 1
            db.commit()

    return {
        "total_farms": len(farms),
        "refreshed_count": refreshed_count,
        "cached_fresh_count": cached_fresh_count,
        "stale_fallback_count": stale_count,
        "failed_count": len(failed_farms_list),
        "diagnostics": diagnostics.get_diagnostics(db),
    }


def get_monitoring_diagnostics(db: Optional[Session] = None) -> dict:
    """Returns current telemetry and diagnostics summary."""
    return diagnostics.get_diagnostics(db)
