from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.chat import ChatMessageCreate, ChatMessageRead
from app.services import assistant_ai_service, assistant_service

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.get("/messages", response_model=list[ChatMessageRead])
def get_messages(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return assistant_service.list_messages(db, current_user.id)


@router.post("/messages", response_model=ChatMessageRead, status_code=201)
def send_message(
    data: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assistant_service.add_message(db, current_user.id, "user", data.content)

    history = assistant_service.list_messages(db, current_user.id)[-assistant_service.MAX_HISTORY :]
    # Anthropic requires the first message in a turn to be role "user" — a slice
    # of an alternating user/assistant sequence can start on "assistant" if the
    # window boundary lands there, so drop a leading assistant message.
    if history and history[0].role == "assistant":
        history = history[1:]
    context_summary = assistant_service.build_context_summary(db, current_user.id)
    reply_text = assistant_ai_service.get_reply(context_summary, history)

    return assistant_service.add_message(db, current_user.id, "assistant", reply_text)


@router.delete("/messages", status_code=204)
def clear_messages(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    assistant_service.clear_messages(db, current_user.id)
