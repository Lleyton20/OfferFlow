import os

import anthropic

from app.schemas.resume import AIFeedback

MODEL = os.getenv("ANTHROPIC_MODEL", "claude-opus-5")

SYSTEM_PROMPT = (
    "You are a career coach reviewing a resume for a student applying to internships "
    "or new-grad roles. Be specific and concrete, referencing actual content from the "
    "resume rather than generic advice."
)


def get_ai_feedback(resume_text: str, job_description: str | None) -> tuple[AIFeedback | None, str]:
    """Returns (feedback, status) where status is one of: ok, not_configured, error."""
    client = anthropic.Anthropic()

    context = f"\n\nTarget job description:\n{job_description}" if job_description else ""
    user_content = f"Resume:\n{resume_text}{context}"

    try:
        response = client.messages.parse(
            model=MODEL,
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_content}],
            output_format=AIFeedback,
        )
        return response.parsed_output, "ok"
    except (anthropic.AuthenticationError, TypeError):
        # TypeError: the SDK raises this (not AuthenticationError) when no
        # credentials can be resolved at all — no ANTHROPIC_API_KEY, no
        # ant auth profile, nothing.
        return None, "not_configured"
    except (anthropic.APIStatusError, anthropic.APIConnectionError):
        return None, "error"
