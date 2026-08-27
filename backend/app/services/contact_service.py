from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.contact import Contact, ContactInteraction
from app.schemas.contact import ContactCreate, ContactUpdate, InteractionCreate


def _with_interactions(stmt):
    return stmt.options(selectinload(Contact.interactions))


def list_contacts(db: Session, user_id: int) -> list[Contact]:
    return list(
        db.scalars(
            _with_interactions(
                select(Contact).where(Contact.user_id == user_id).order_by(Contact.created_at.desc())
            )
        )
    )


def get_contact(db: Session, user_id: int, contact_id: int) -> Contact | None:
    return db.scalar(
        _with_interactions(
            select(Contact).where(Contact.id == contact_id, Contact.user_id == user_id)
        )
    )


def create_contact(db: Session, user_id: int, data: ContactCreate) -> Contact:
    contact = Contact(user_id=user_id, **data.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


def update_contact(db: Session, contact: Contact, data: ContactUpdate) -> Contact:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(contact, field, value)
    db.commit()
    db.refresh(contact)
    return contact


def delete_contact(db: Session, contact: Contact) -> None:
    db.delete(contact)
    db.commit()


def add_interaction(
    db: Session, user_id: int, contact: Contact, data: InteractionCreate
) -> ContactInteraction:
    interaction = ContactInteraction(
        contact_id=contact.id, user_id=user_id, date=data.date, note=data.note
    )
    db.add(interaction)
    db.commit()
    db.refresh(contact)
    return interaction


def get_interaction(
    db: Session, user_id: int, contact_id: int, interaction_id: int
) -> ContactInteraction | None:
    return db.scalar(
        select(ContactInteraction).where(
            ContactInteraction.id == interaction_id,
            ContactInteraction.contact_id == contact_id,
            ContactInteraction.user_id == user_id,
        )
    )


def delete_interaction(db: Session, interaction: ContactInteraction) -> None:
    db.delete(interaction)
    db.commit()
