from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.contact import (
    ContactCreate,
    ContactRead,
    ContactUpdate,
    InteractionCreate,
    InteractionRead,
)
from app.services import contact_service

router = APIRouter(prefix="/contacts", tags=["contacts"])


def _get_contact_or_404(db: Session, user_id: int, contact_id: int):
    contact = contact_service.get_contact(db, user_id, contact_id)
    if contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


def _get_interaction_or_404(db: Session, user_id: int, contact_id: int, interaction_id: int):
    interaction = contact_service.get_interaction(db, user_id, contact_id, interaction_id)
    if interaction is None:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return interaction


@router.get("", response_model=list[ContactRead])
def get_contacts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return contact_service.list_contacts(db, current_user.id)


@router.post("", response_model=ContactRead, status_code=201)
def create_contact(
    contact: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return contact_service.create_contact(db, current_user.id, contact)


@router.get("/{contact_id}", response_model=ContactRead)
def get_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_contact_or_404(db, current_user.id, contact_id)


@router.patch("/{contact_id}", response_model=ContactRead)
def update_contact(
    contact_id: int,
    contact: ContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = _get_contact_or_404(db, current_user.id, contact_id)
    return contact_service.update_contact(db, existing, contact)


@router.delete("/{contact_id}", status_code=204)
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = _get_contact_or_404(db, current_user.id, contact_id)
    contact_service.delete_contact(db, existing)


@router.post("/{contact_id}/interactions", response_model=InteractionRead, status_code=201)
def create_interaction(
    contact_id: int,
    interaction: InteractionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contact = _get_contact_or_404(db, current_user.id, contact_id)
    return contact_service.add_interaction(db, current_user.id, contact, interaction)


@router.delete("/{contact_id}/interactions/{interaction_id}", status_code=204)
def delete_interaction(
    contact_id: int,
    interaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_contact_or_404(db, current_user.id, contact_id)
    interaction = _get_interaction_or_404(db, current_user.id, contact_id, interaction_id)
    contact_service.delete_interaction(db, interaction)
