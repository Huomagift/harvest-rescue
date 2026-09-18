"""
Google Earth Engine NDVI integration.

Setup required before this works live:
1. Locally: `earthengine authenticate` once (opens a browser to log in with
   your approved GEE account) — used only for local dev.
2. In production (Render): a service account is used instead. Set these
   environment variables:
   - GEE_SERVICE_ACCOUNT_EMAIL: the service account's email
   - GEE_SERVICE_ACCOUNT_KEY: the service account's JSON key, base64-encoded
   - GEE_PROJECT_ID (optional): your GCP project ID

Fallback behavior: if the live GEE call fails (auth not finished, no
imagery for the date range, network issue), returns a clearly-labeled
fallback value instead of crashing the demo. Drop real NDVI values pulled
manually from the GEE code editor into FALLBACK_NDVI_BY_FARM_NAME so the
demo still runs on real numbers even if the live call isn't working yet.
"""
import base64
import datetime
import os

import ee

from app.services.external_call import call_with_fallback

_EE_INITIALIZED = False

FALLBACK_NDVI_BY_FARM_NAME = {
    "Kaduna Maize Belt Farm": 0.42,
}
_DEFAULT_FALLBACK_NDVI = 0.5


def init_earth_engine(project_id: str | None = None) -> None:
    global _EE_INITIALIZED
    if _EE_INITIALIZED:
        return

    service_account_email = os.environ.get("GEE_SERVICE_ACCOUNT_EMAIL")
    encoded_key = os.environ.get("GEE_SERVICE_ACCOUNT_KEY")

    if service_account_email and encoded_key:
        # Production path (Render): authenticate as a service account.
        key_json_str = base64.b64decode(encoded_key).decode("utf-8")
        credentials = ee.ServiceAccountCredentials(service_account_email, key_data=key_json_str)
        ee.Initialize(credentials, project=project_id) if project_id else ee.Initialize(credentials)
    else:
        # Local dev path: relies on `earthengine authenticate` having been run.
        ee.Initialize(project=project_id) if project_id else ee.Initialize()

    _EE_INITIALIZED = True


def get_ndvi_signal(latitude: float, longitude: float, farm_name: str = "") -> dict:
    """
    Returns latest NDVI reading and a rolling trend (delta vs ~14 days prior)
    for the given coordinates, using Sentinel-2 surface reflectance.
    """
    fallback = {
        "ndvi_current": FALLBACK_NDVI_BY_FARM_NAME.get(farm_name, _DEFAULT_FALLBACK_NDVI),
        "ndvi_trend_delta": -0.05,  # mild simulated decline; adjust per demo farm
    }

    def live_call() -> dict:
        today = ee.Date(datetime.datetime.utcnow())

        point = ee.Geometry.Point([longitude, latitude])

        collection = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(point)
            .filterDate(today.advance(-30, "day"), today)
            .sort("system:time_start", False)
        )

        def add_ndvi(image):
            ndvi = image.normalizedDifference(["B8", "B4"]).rename("NDVI")
            return image.addBands(ndvi)

        with_ndvi = collection.map(add_ndvi)

        latest = with_ndvi.first()
        latest_ndvi = latest.select("NDVI").reduceRegion(
            reducer=ee.Reducer.mean(), geometry=point, scale=10
        ).get("NDVI").getInfo()

        earlier = with_ndvi.filterDate(
            today.advance(-30, "day"), today.advance(-14, "day")
        ).first()
        earlier_ndvi = earlier.select("NDVI").reduceRegion(
            reducer=ee.Reducer.mean(), geometry=point, scale=10
        ).get("NDVI").getInfo()

        return {
            "ndvi_current": latest_ndvi,
            "ndvi_trend_delta": (latest_ndvi - earlier_ndvi) if earlier_ndvi is not None else None,
        }

    return call_with_fallback(live_call, fallback, source_label="gee")