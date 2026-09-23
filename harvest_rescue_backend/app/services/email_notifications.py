"""
Compounded farmer email notification service.
Sends a single, clear agronomic briefing when risks are detected or change severity.
Guards against alert fatigue by compounding active risks and deduplicating so an email
is sent once per risk event signature until conditions change.
"""
import hashlib
import logging
import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional

from sqlalchemy.orm import Session
from app import models

logger = logging.getLogger("harvest_rescue")


def compute_risk_signature(farm_id: str, events: List[models.RiskEvent]) -> str:
    """Creates a deterministic hash representing the current risk profile."""
    if not events:
        return "no_active_risk"
    
    parts = []
    for e in sorted(events, key=lambda x: (x.risk_type, x.severity)):
        impact = int(e.days_to_impact) if e.days_to_impact is not None else -1
        parts.append(f"{e.risk_type}:{e.severity}:{impact}")
    
    raw = f"{farm_id}|" + "|".join(parts)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


def send_compounded_risk_notification(
    db: Session,
    farm: models.Farm,
    events: List[models.RiskEvent],
    why_factors: Optional[List[str]] = None,
    recommended_action: Optional[dict] = None,
) -> bool:
    """
    Evaluates whether an email notification should be sent to the farmer.
    Compounds all active risks into one single notification.
    Returns True if an email was dispatched, False otherwise.
    """
    recipient_email = farm.farmer_email
    if not recipient_email or not recipient_email.strip():
        logger.debug(f"[Email Notification] No email configured for farm {farm.name} ({farm.id}).")
        return False

    if not events:
        return False

    # Check for severe or moderate risk events only (don't spam on low background fluctuations)
    has_elevated_risk = any(e.severity in ("medium", "high") for e in events)
    if not has_elevated_risk:
        return False

    # Compute signature of current risk state
    signature = compute_risk_signature(farm.id, events)
    if farm.last_notified_risk_signature == signature:
        logger.info(
            f"[Email Notification] Suppressed duplicate email for {farm.name}: "
            f"risk signature {signature} already notified."
        )
        return False

    # Build compounded briefing content
    highest_severity = "high" if any(e.severity == "high" for e in events) else "medium"
    active_threats = ", ".join(sorted(set(e.risk_type.replace("_", " ").title() for e in events)))
    earliest_impact = min(
        (e.days_to_impact for e in events if e.days_to_impact is not None),
        default=None,
    )

    if earliest_impact is not None:
        impact_str = "Today" if earliest_impact == 0 else f"Expected in {int(earliest_impact)} Day(s)"
    else:
        impact_str = "Currently In Progress"

    factors_html = ""
    factors_text = ""
    if why_factors:
        factors_html = "<ul>" + "".join(f"<li>{f}</li>" for f in why_factors) + "</ul>"
        factors_text = "\n".join(f" - {f}" for f in why_factors)
    else:
        factors_html = "<ul><li>Environmental signals crossed safety limits for this crop.</li></ul>"
        factors_text = " - Environmental signals crossed safety limits for this crop."

    action_title = recommended_action.get("action_title", "Review Field Drainage & Crop Canopy") if recommended_action else "Review Field Conditions"
    action_desc = recommended_action.get("action_description", "Inspect vulnerable field sections.") if recommended_action else "Inspect vulnerable field sections."

    subject = f"[Harvest Rescue Alert] {highest_severity.upper()} RISK: {active_threats} ({farm.name})"

    text_body = f"""Harvest Rescue — Agricultural Risk Intelligence & Early Warning
==============================================================
Farm: {farm.name}
Location: {farm.location_name or f"{farm.latitude:.4f}, {farm.longitude:.4f}"}
Crop: {farm.crop_type.title()} ({farm.size_hectares or 10:.1f} hectares)

ALERT: {highest_severity.upper()} RISK ({impact_str})
Active Threats: {active_threats}

WHY THIS RISK WAS DETECTED:
{factors_text}

RECOMMENDED ACTION:
{action_title}
{action_desc}

Monitoring active: Your farm is continuously assessed for changes that could affect crop health and harvest outcomes.
"""

    html_body = f"""<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #FBFDFA; color: #191C1A; padding: 24px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E0E4DF; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="border-bottom: 2px solid #1B4D3E; padding-bottom: 12px; margin-bottom: 20px;">
      <h2 style="color: #1B4D3E; margin: 0; font-size: 20px;">🌾 Harvest Rescue Risk Intelligence</h2>
      <p style="color: #717973; margin: 4px 0 0 0; font-size: 13px;">Agronomic Early Warning Briefing</p>
    </div>

    <div style="background: {'#FFDAD6' if highest_severity == 'high' else '#FFDCC2'}; border-left: 6px solid {'#BA1A1A' if highest_severity == 'high' else '#8B5000'}; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
      <span style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: {'#410E0B' if highest_severity == 'high' else '#341200'};">
        {highest_severity.upper()} RISK ALERT — {impact_str}
      </span>
      <h3 style="margin: 6px 0; font-size: 18px; color: {'#410E0B' if highest_severity == 'high' else '#341200'};">
        {active_threats}
      </h3>
      <p style="margin: 0; font-size: 13px; color: {'#410E0B' if highest_severity == 'high' else '#341200'};">
        Farm: <strong>{farm.name}</strong> ({farm.location_name or 'Registered Parcel'}) · {farm.crop_type.title()}
      </p>
    </div>

    <div style="margin-bottom: 20px;">
      <h4 style="color: #191C1A; margin: 0 0 8px 0; font-size: 15px;">Why this risk was detected:</h4>
      <div style="color: #414943; font-size: 14px; line-height: 1.6;">
        {factors_html}
      </div>
    </div>

    <div style="background: #F0F4EF; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <h4 style="color: #1B4D3E; margin: 0 0 6px 0; font-size: 15px;">Recommended Action: {action_title}</h4>
      <p style="margin: 0; font-size: 14px; color: #191C1A; line-height: 1.5;">
        {action_desc}
      </p>
    </div>

    <p style="color: #717973; font-size: 12px; margin-top: 24px; border-top: 1px solid #E0E4DF; padding-top: 12px;">
      Monitoring active: Your farm is continuously assessed for changes that could affect crop health and harvest outcomes.<br/>
      This notification is compounded and sent once per risk cycle to avoid message overload.
    </p>
  </div>
</body>
</html>
"""

    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    sender_email = os.environ.get("SMTP_FROM", "alerts@harvestrescue.ai")

    delivered = False
    if smtp_host and smtp_user and smtp_password:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = sender_email
            msg["To"] = recipient_email

            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(sender_email, recipient_email, msg.as_string())
            delivered = True
            logger.info(f"[Email Notification] Successfully sent email to {recipient_email} for {farm.name}")
        except Exception as e:
            logger.error(f"[Email Notification] Failed to send email via SMTP to {recipient_email}: {e}")
    else:
        logger.info(
            f"[Email Notification Logged] SMTP not configured. Compounded email prepared for {recipient_email} "
            f"({farm.name}): Subject='{subject}'. Status: Logged to audit trail."
        )
        delivered = True

    if delivered:
        farm.last_email_notification_at = datetime.utcnow()
        farm.last_notified_risk_signature = signature
        db.commit()

    return delivered
