import os

import anthropic

from app.schemas.interview import MockQuestionSet

MODEL = os.getenv("ANTHROPIC_MODEL", "claude-opus-5")

SYSTEM_PROMPT = (
    "You are an interview coach preparing a student for an internship or new-grad "
    "interview. Generate realistic, specific interview questions for the given role "
    "and interview type — not generic filler. For each question, add a one-sentence "
    "tip on what a strong answer should cover (e.g. which STAR-method element to "
    "emphasize for behavioral questions, or which concept to demonstrate for "
    "technical ones)."
)


def generate_mock_questions(
    role: str,
    company: str | None,
    interview_type: str,
    job_description: str | None,
) -> tuple[MockQuestionSet | None, str]:
    """Returns (question_set, status) where status is one of: ok, not_configured, error."""
    client = anthropic.Anthropic()

    context_lines = [f"Role: {role}", f"Interview type: {interview_type}"]
    if company:
        context_lines.append(f"Company: {company}")
    if job_description:
        context_lines.append(f"Job description:\n{job_description}")
    user_content = (
        "\n".join(context_lines)
        + "\n\nGenerate 5 mock interview questions for this."
    )

    try:
        response = client.messages.parse(
            model=MODEL,
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_content}],
            output_format=MockQuestionSet,
        )
        return response.parsed_output, "ok"
    except (anthropic.AuthenticationError, TypeError):
        return None, "not_configured"
    except (anthropic.APIStatusError, anthropic.APIConnectionError):
        return None, "error"
