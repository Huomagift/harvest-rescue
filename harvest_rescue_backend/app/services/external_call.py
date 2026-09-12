"""
Shared helper for calling an external data source with a guaranteed,
labeled fallback on failure. Both weather.py and satellite.py need this
exact pattern (try live call, on any exception return a clearly-marked
fallback instead of crashing) — written once here instead of duplicated
in each service.
"""
import logging
from typing import Callable, TypeVar

logger = logging.getLogger("harvest_rescue")

T = TypeVar("T")


def call_with_fallback(live_call: Callable[[], dict], fallback_value: dict, source_label: str) -> dict:
    """
    Runs `live_call`. On success, tags the result with source="live_<label>".
    On any exception, logs it and returns `fallback_value` tagged with
    source="fallback_mock" and the failure reason attached.
    """
    try:
        result = live_call()
        result["source"] = f"live_{source_label}"
        return result
    except Exception as e:
        logger.warning(f"[{source_label}] live call failed, using fallback: {e}")
        fallback = dict(fallback_value)
        fallback["source"] = "fallback_mock"
        fallback["fallback_reason"] = str(e)
        return fallback
