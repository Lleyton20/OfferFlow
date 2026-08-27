"""add password reset token fields to users

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-27

"""
import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def _existing_columns(table_name: str) -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {c["name"] for c in inspector.get_columns(table_name)}


def upgrade() -> None:
    existing = _existing_columns("users")
    if "reset_token_hash" not in existing:
        op.add_column("users", sa.Column("reset_token_hash", sa.String(), nullable=True))
    if "reset_token_expires_at" not in existing:
        op.add_column(
            "users", sa.Column("reset_token_expires_at", sa.DateTime(timezone=True), nullable=True)
        )


def downgrade() -> None:
    op.drop_column("users", "reset_token_expires_at")
    op.drop_column("users", "reset_token_hash")
