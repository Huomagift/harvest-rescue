"""
Continuous monitoring service powered by APScheduler.
Evaluates all registered farms on a recurring schedule (daily) and provides
a manual sweep trigger with persistent deduplicated alert creation.
"""
import logging
import time
from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app import models
from app.database import SessionLocal
from app.services.weather import get_weather_signal
from app.services.satellite import get_ndvi_signal
from app.services.risk_engine import evaluate_risk, generate_farm_signals_and_intelligence
from app.services.email_notifications import send_compounded_risk_notification

logger = logging.getLogger("harvest_rescue")

_scheduler = BackgroundScheduler()
_last_manual_sweep_time = 0.0
MIN_SWEEP_INTERVAL_SECONDS = 10.0  # Simple rate-limiting guard against rapid sweep hammering


def create_or_update_alert(db: Session, farm: models.Farm, risk_event: models.RiskEvent) -> bool:
    """
    Deduplication logic:
    Before creating a new alert, check for an existing unresolved alert
    ("unread" or "read", or created in the last 48 hours) for the same farm_id and risk_type.
    If found, update its severity, message, days_to_impact, and timestamp instead of duplicating.
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


def run_monitoring_sweep(db: Session = None) -> dict:
    """
    Evaluates ALL registered farms automatically on a recurring basis or manual trigger.
    Logs each sweep and returns a summary dict.
    """
    should_close_db = False
    if db is None:
        db = SessionLocal()
        should_close_db = True

    try:
        farms = db.query(models.Farm).all()
        farms_checked = len(farms)
        risks_found = 0
        alerts_affected = 0

        logger.info(f"[Monitoring Sweep] Starting sweep across {farms_checked} farms...")

        for farm in farms:
            try:
                weather = get_weather_signal(farm.latitude, farm.longitude)
                ndvi = get_ndvi_signal(farm.latitude, farm.longitude, farm_name=farm.name)

                events = evaluate_risk(weather, ndvi)
                farm.last_monitored_at = datetime.utcnow()

                farm_saved_events = []
                for event_data in events:
                    risks_found += 1
                    risk_event = models.RiskEvent(farm_id=farm.id, **event_data)
                    db.add(risk_event)
                    db.flush()  # populate risk_event.id
                    farm_saved_events.append(risk_event)

                    # Create or update persistent alert for medium and high risk events (or any triggered event)
                    create_or_update_alert(db, farm, risk_event)
                    alerts_affected += 1

                if farm.farmer_email and farm_saved_events:
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
                        logger.error(f"[Monitoring Sweep] Email notification error for farm {farm.name}: {email_err}")

            except Exception as farm_err:
                logger.error(f"[Monitoring Sweep] Error scanning farm {farm.id} ({farm.name}): {farm_err}")
                continue

        db.commit()
        summary = {
            "farms_checked": farms_checked,
            "risks_found": risks_found,
            "alerts_created_or_updated": alerts_affected,
            "timestamp": datetime.utcnow(),
        }
        logger.info(
            f"[Monitoring Sweep] Sweep completed: {farms_checked} farms checked, "
            f"{risks_found} risk events, {alerts_affected} alerts updated/created."
        )
        return summary
    finally:
        if should_close_db:
            db.close()


def scheduled_sweep_job():
    logger.info("[APScheduler] Executing scheduled daily monitoring sweep...")
    run_monitoring_sweep()


def start_scheduler():
    """Starts the APScheduler in-process background job if not already running."""
    if not _scheduler.running:
        _scheduler.add_job(
            scheduled_sweep_job,
            trigger="interval",
            hours=24,
            id="daily_farm_sweep",
            replace_existing=True,
            next_run_time=datetime.now() + timedelta(seconds=5),  # First run 5s after startup
        )
        _scheduler.start()
        logger.info("[APScheduler] Background farm monitoring scheduler started (running every 24h).")


def shutdown_scheduler():
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("[APScheduler] Scheduler shut down cleanly.")
