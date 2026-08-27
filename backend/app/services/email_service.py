import os
import smtplib
from email.message import EmailMessage

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER or "")

IS_CONFIGURED = bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)


def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    """Returns True if an email was actually sent. False if SMTP isn't
    configured — callers should not treat that as an error (see auth.py:
    the API response never reveals whether email delivery succeeded, to
    avoid leaking whether an account exists)."""
    if not IS_CONFIGURED:
        return False

    message = EmailMessage()
    message["Subject"] = "Reset your OfferFlow password"
    message["From"] = SMTP_FROM
    message["To"] = to_email
    message.set_content(
        "Someone requested a password reset for your OfferFlow account.\n\n"
        f"Reset your password: {reset_url}\n\n"
        "This link expires in 1 hour. If you didn't request this, you can "
        "ignore this email — your password won't change."
    )

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(message)
    return True
