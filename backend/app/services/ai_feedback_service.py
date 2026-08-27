import os

import anthropic

from app.schemas.resume import AIFeedback, TailoringSuggestions

MODEL = os.getenv("ANTHROPIC_MODEL", "claude-opus-5")

SYSTEM_PROMPT = (
    "You are a career coach reviewing a resume for a student applying to internships "
    "or new-grad roles. Be specific and concrete, referencing actual content from the "
    "resume rather than generic advice."
)

TAILOR_SYSTEM_PROMPT = (
    "You are a career coach helping a student tailor an existing resume to a specific "
    "job description. Reference actual content from the resume and actual language "
    "from the job description — never generic advice. Suggest a rewritten professional "
    "summary (2-3 sentences) that speaks directly to this role, which existing resume "
    "bullets to emphasize or reorder toward the top, and which keywords from the job "
    "description are missing from the resume and should be worked in naturally."
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


def get_tailoring_suggestions(
    resume_text: str, job_description: str
) -> tuple[TailoringSuggestions | None, str]:
    """Returns (suggestions, status) — same status vocabulary as get_ai_feedback."""
    client = anthropic.Anthropic()

    user_content = f"Resume:\n{resume_text}\n\nJob description to tailor toward:\n{job_description}"

    try:
        response = client.messages.parse(
            model=MODEL,
            max_tokens=2048,
            system=TAILOR_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_content}],
            output_format=TailoringSuggestions,
        )
        return response.parsed_output, "ok"
    except (anthropic.AuthenticationError, TypeError):
        return None, "not_configured"
    except (anthropic.APIStatusError, anthropic.APIConnectionError):
        return None, "error"
