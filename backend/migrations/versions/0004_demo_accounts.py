"""demo accounts: is_demo flag on users

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-20

"""

import sqlalchemy as sa
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # As in 0002/0003: on a fresh database 0001's create_all() already added this.
    columns = {c["name"] for c in sa.inspect(op.get_bind()).get_columns("users")}
    if "is_demo" not in columns:
        op.add_column(
            "users",
            sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        )
        op.create_index("ix_users_is_demo", "users", ["is_demo"])


def downgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.drop_index("ix_users_is_demo")
        batch.drop_column("is_demo")
