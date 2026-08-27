"""baseline — creates any tables that don't exist yet

Uses Base.metadata.create_all(), which is idempotent (checkfirst=True by
default): on a brand-new database it creates every table from scratch: on
the existing production database, it's a no-op since those tables already
exist. This is what lets `alembic upgrade head` run safely as the very
first thing on startup — see render.yaml — before app/main.py's own
create_all() in the lifespan handler ever gets a chance to run.

Revision ID: 0001
Revises:
Create Date: 2026-08-27

"""
from alembic import op

from app.database import Base

# revision identifiers, used by Alembic.
revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    pass
