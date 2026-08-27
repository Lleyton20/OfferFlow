import os

import anthropic

from app.models.chat import ChatMessage

MODEL = os.getenv("ANTHROPIC_MODEL", "claude-opus-5")

SYSTEM_PROMPT_TEMPLATE = (
    "You are OfferFlow's career assistant, helping a student with their internship "
    "or new-grad job search. You have access to their real tracked data below — use "
    "it to give specific, actionable advice (which applications to follow up on, "
    "whether their resume needs work, how their pipeline looks) instead of generic "
    "career advice. Be concise and direct — a few sentences or a short list, not an "
    "essay.\n\n"
    "Current data:\n{context}"
)

NOT_CONFIGURED_MESSAGE = (
    "AI isn't configured yet — set ANTHROPIC_API_KEY on the backend to enable the "
    "career assistant."
)
ERROR_MESSAGE = "Something went wrong reaching the AI service. Try again in a moment."


def get_reply(context_summary: str, message_history: list[ChatMessage]) -> str:
    """Always returns a message to show the user — errors become a friendly
    assistant-role reply rather than a failed request, so the chat UI never
    has to special-case a broken turn."""
    client = anthropic.Anthropic()
    messages = [{"role": m.role, "content": m.content} for m in message_history]

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=SYSTEM_PROMPT_TEMPLATE.format(context=context_summary),
            messages=messages,
        )
        return next((block.text for block in response.content if block.type == "text"), "")
    except (anthropic.AuthenticationError, TypeError):
        return NOT_CONFIGURED_MESSAGE
    except (anthropic.APIStatusError, anthropic.APIConnectionError):
        return ERROR_MESSAGE
