import html
import os
import smtplib
from dataclasses import dataclass
from email.message import EmailMessage

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER or "")


def is_configured() -> bool:
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)


def _send(message: EmailMessage) -> bool:
    """Returns True if the email was actually sent, False if SMTP isn't configured."""
    if not (SMTP_HOST and SMTP_USER and SMTP_PASSWORD):
        return False
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(message)
    return True


def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    """Returns True if an email was actually sent. False if SMTP isn't
    configured — callers should not treat that as an error (see auth.py:
    the API response never reveals whether email delivery succeeded, to
    avoid leaking whether an account exists)."""
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
    return _send(message)


@dataclass
class DigestItem:
    company: str
    title: str
    location: str | None
    url: str
    reason: str | None


def send_job_digest(to_email: str, first_name: str, items: list[DigestItem], app_url: str) -> bool:
    count = len(items)
    message = EmailMessage()
    message["Subject"] = f"{count} new opening{'s' if count != 1 else ''} picked for you"
    message["From"] = SMTP_FROM
    message["To"] = to_email

    text_lines = [f"Hi {first_name},", "", "New openings that match your search:", ""]
    for item in items:
        where = f" · {item.location}" if item.location else ""
        text_lines.append(f"- {item.company}: {item.title}{where}\n  {item.url}")
    text_lines += [
        "",
        f"See all recommendations: {app_url}/discover",
        "",
        "You can turn these emails off in OfferFlow settings.",
    ]
    message.set_content("\n".join(text_lines))

    rows = "".join(_digest_row(item) for item in items)
    discover = html.escape(f"{app_url}/discover")
    message.add_alternative(
        f"""<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#2a2f2c">
<p style="font-size:15px">Hi {html.escape(first_name)},</p>
<p style="font-size:15px">New openings that match your search:</p>
<table style="width:100%;border-collapse:collapse">{rows}</table>
<p style="margin-top:24px"><a href="{discover}" style="background:#0f7a45;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">See all recommendations</a></p>
<p style="color:#8f9591;font-size:12px;margin-top:24px">You can turn these emails off in OfferFlow settings.</p>
</div>""",
        subtype="html",
    )
    return _send(message)


def _digest_row(item: DigestItem) -> str:
    where = f" · {html.escape(item.location)}" if item.location else ""
    reason = (
        f'<div style="color:#0b6439;font-size:12px;margin-top:4px">{html.escape(item.reason)}</div>'
        if item.reason
        else ""
    )
    return f"""<tr><td style="padding:14px 0;border-bottom:1px solid #e8e9e6">
<a href="{html.escape(item.url)}" style="color:#0c0f0d;font-weight:600;text-decoration:none">{html.escape(item.title)}</a>
<div style="color:#646a66;font-size:13px;margin-top:2px">{html.escape(item.company)}{where}</div>
{reason}
</td></tr>"""
