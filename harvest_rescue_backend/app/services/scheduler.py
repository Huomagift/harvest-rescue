"""
Continuous monitoring service powered by APScheduler and the Centralized Environmental Service.

Evaluates farms on a controlled schedule while providing 24/7 continuous monitoring,
caching environmental data (24h TTL), batching provider requests, deduplicating alerts,
and strictly separating demo vs authenticated user monitoring.
"""

from datetime import datetime, timedelta
import logging
from typing import Optional

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app import models
from app.database import SessionLocal
from app.services.environmental_service import (
    batch_refresh_farms,
    get_farm_environmental_data,
    get_monitoring_diagnostics,
)
from app.services.satellite import get_ndvi_signal
from app.services.risk_engine import evaluate_risk, generate_farm_signals_and_intelligence
from app.services.email_notifications import send_compounded_risk_notification

logger = logging.getLogger("harvest_rescue")

_scheduler = BackgroundScheduler()
_last_manual_sweep_time = 0.0
MIN_SWEEP_INTERVAL_SECONDS = 5.0


def create_or_update_alert(db: Session, farm: models.Farm, risk_event: models.RiskEvent) -> bool:
    """
    Deduplication logic:
    Before creating a new alert, checks for an existing unresolved alert
    ("unread" or "read", created in the last 48 hours) for the same farm_id and risk_type.
    If found, updates severity, message, days_to_impact, and timestamp instead of duplicating.
    """
    cutoff_time = datetime.utcnow() - timedelta(hours=48)
    existing_alert = (
        db.query(models.Alert)
        .filter(
            models.Alert.farm_id == farm.id,
            models.Alert.risk_type == risk_event.risk_type,
            models.Alert.status != "dismissed",
            models.Alert.created_at >= cutoff_time,
        )
        .first()
    )

    days_str = (
        f"in ~{int(risk_event.days_to_impact)} day(s)"
        if risk_event.days_to_impact is not None
        else "currently active"
    )

    title = f"{risk_event.severity.capitalize()} {risk_event.risk_type.replace('_', ' ').capitalize()} Risk Alert"
    message = (
        f"{risk_event.risk_type.replace('_', ' ').capitalize()} risk detected for {farm.name} "
        f"({days_str}). Immediate agronomic monitoring recommended."
    )

    if existing_alert:
        existing_alert.title = title
        existing_alert.message = message
        existing_alert.severity = risk_event.severity
        existing_alert.days_to_impact = risk_event.days_to_impact
        existing_alert.created_at = datetime.utcnow()
        existing_alert.risk_event_id = risk_event.id
        return False  # Updated existing
    else:
        new_alert = models.Alert(
            farm_id=farm.id,
            risk_event_id=risk_event.id,
            risk_type=risk_event.risk_type,
            title=title,
            message=message,
            severity=risk_event.severity,
            status="unread",
            days_to_impact=risk_event.days_to_impact,
        )
        db.add(new_alert)
        return True  # Created new


def run_monitoring_sweep(
    db: Session = None,
    scope: str = "all",  # "all" | "demo" | "user"
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
    force_refresh: bool = False,
) -> dict:
    """
    Executes a continuous monitoring sweep across farms within the specified scope.
    
    1. Selects farms based on scope (demo vs authenticated user).
    2. Batches coordinates and refreshes expired environmental data via Central Service.
    3. Evaluates agronomic risks using cached/stale snapshots with zero 502 crash potential.
    4. Deduplicates alerts and notifies only appropriate user accounts (never demo).
    5. Logs and records full monitoring diagnostics.
    """
    should_close_db = False
    if db is None:
        db = SessionLocal()
        should_close_db = True

    try:
        # 1. Filter farms by scope
        query = db.query(models.Farm)
        if scope == "demo":
            query = query.filter(models.Farm.is_demo == True)
        elif scope == "user":
            query = query.filter(models.Farm.is_demo == False)
            if user_id:
                query = query.filter(models.Farm.user_id == user_id)
            elif user_email:
                query = query.filter(models.Farm.farmer_email == user_email.strip().lower())
        farms = query.all()
        farms_checked = len(farms)

        logger.info(
            f"[Monitoring Sweep] Starting sweep across {farms_checked} farms (scope={scope}, force_refresh={force_refresh})..."
        )

        if farms_checked == 0:
            diag = get_monitoring_diagnostics(db)
            return {
                "farms_checked": 0,
                "risks_found": 0,
                "alerts_created_or_updated": 0,
                "scope": scope,
                "diagnostics": diag,
                "timestamp": datetime.utcnow().isoformat(),
            }

        # 2. Batch refresh environmental data for farms needing fresh provider data
        batch_summary = batch_refresh_farms(db, farms, force_refresh=force_refresh)

        # 3. Evaluate each farm using cached environmental snapshot + satellite NDVI
        risks_found = 0
        alerts_affected = 0
        failed_evaluations = 0

        for farm in farms:
            try:
                # Retrieve from centralized service (returns cached snapshot)
                weather = get_farm_environmental_data(db, farm, force_refresh=False)
                ndvi = get_ndvi_signal(farm.latitude, farm.longitude, farm_name=farm.name)

                events = evaluate_risk(weather, ndvi)
                farm.last_monitored_at = datetime.utcnow()

                farm_saved_events = []
                for event_data in events:
                    risks_found += 1
                    risk_event = models.RiskEvent(farm_id=farm.id, **event_data)
                    db.add(risk_event)
                    db.flush()
                    farm_saved_events.append(risk_event)

                    create_or_update_alert(db, farm, risk_event)
                    alerts_affected += 1

                # 4. Strictly isolated notifications:
                # User farms: send email only to that user
                # Demo farms: NEVER dispatch email to user accounts or external emails
                if not farm.is_demo and farm.farmer_email and farm_saved_events:
                    try:
                        intel = generate_farm_signals_and_intelligence(farm, weather, ndvi, events)
                        send_compounded_risk_notification(
                            db=db,
                            farm=farm,
                            events=farm_saved_events,
                            why_factors=intel.get("why_factors"),
                            recommended_action=intel.get("recommended_action"),
                        )
                    except Exception as email_err:
                        logger.error(f"[Monitoring Sweep] User notification error for farm {farm.name}: {email_err}")

            except Exception as farm_err:
                logger.error(f"[Monitoring Sweep] Error evaluating farm {farm.name} ({farm.id}): {farm_err}")
                failed_evaluations += 1
                continue

        db.commit()

        # 5. Telemetry & Diagnostics logging
        diag = get_monitoring_diagnostics(db)
        logger.info(
            f"[Monitoring Sweep] Sweep completed: {farms_checked} farms, {risks_found} risks, "
            f"{alerts_affected} alerts. Open-Meteo requests: {diag['open_meteo_request_count']}, "
            f"429s: {diag['occurrences_429']}, Cache hits: {diag['cached_data_usage_count']}."
        )

        return {
            "farms_checked": farms_checked,
            "risks_found": risks_found,
            "alerts_created_or_updated": alerts_affected,
            "failed_evaluations": failed_evaluations,
            "scope": scope,
            "batch_summary": batch_summary,
            "diagnostics": diag,
            "timestamp": datetime.utcnow().isoformat(),
        }

    finally:
        if should_close_db:
            db.close()


def scheduled_sweep_job():
    """Controlled scheduled background monitoring sweep."""
    logger.info("[APScheduler] Executing controlled recurring monitoring sweep...")
    try:
        run_monitoring_sweep(scope="all", force_refresh=False)
    except Exception as e:
        logger.error(f"[APScheduler] Error in background monitoring sweep: {e}")


def start_scheduler():
    """Starts APScheduler background job if not already running."""
    if not _scheduler.running:
        _scheduler.add_job(
            scheduled_sweep_job,
            trigger="interval",
            hours=1,  # Runs continuous monitoring checks hourly (using cached 24h snapshots)
            id="daily_farm_sweep",
            replace_existing=True,
            next_run_time=datetime.now() + timedelta(seconds=10),
        )
        _scheduler.start()
        logger.info("[APScheduler] Background farm monitoring scheduler started (running hourly checks with 24h cache TTL).")


def shutdown_scheduler():
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("[APScheduler] Scheduler shut down cleanly.")
