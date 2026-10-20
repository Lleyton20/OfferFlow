"""browser capture and job discovery: api tokens, job postings, application source fields

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-20

"""

import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


# 0001's baseline runs create_all() against the current models, so on a brand-new
# database these tables and columns already exist by the time this runs. Every step
# checks first, matching 0002.
def _inspector():
    return sa.inspect(op.get_bind())


def _has_table(name: str) -> bool:
    return name in _inspector().get_table_names()


def _columns(table: str) -> set[str]:
    return {c["name"] for c in _inspector().get_columns(table)}


def upgrade() -> None:
    application_columns = _columns("applications")
    if "job_url" not in application_columns:
        op.add_column("applications", sa.Column("job_url", sa.String(), nullable=True))
        op.create_index("ix_applications_job_url", "applications", ["job_url"])
    if "location" not in application_columns:
        op.add_column("applications", sa.Column("location", sa.String(), nullable=True))
    if "source" not in application_columns:
        op.add_column(
            "applications",
            sa.Column("source", sa.String(), nullable=False, server_default="manual"),
        )

    user_columns = _columns("users")
    if "job_keywords" not in user_columns:
        op.add_column(
            "users", sa.Column("job_keywords", sa.JSON(), nullable=False, server_default="[]")
        )
    if "digest_enabled" not in user_columns:
        op.add_column(
            "users",
            sa.Column("digest_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        )
    if "last_digest_at" not in user_columns:
        op.add_column(
            "users", sa.Column("last_digest_at", sa.DateTime(timezone=True), nullable=True)
        )

    if not _has_table("api_tokens"):
        op.create_table(
            "api_tokens",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("token_hash", sa.String(), nullable=False),
            sa.Column("prefix", sa.String(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True)),
            sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index("ix_api_tokens_user_id", "api_tokens", ["user_id"])
        op.create_index("ix_api_tokens_token_hash", "api_tokens", ["token_hash"], unique=True)

    if not _has_table("job_postings"):
        op.create_table(
            "job_postings",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("source", sa.String(), nullable=False),
            sa.Column("external_id", sa.String(), nullable=False),
            sa.Column("company", sa.String(), nullable=False),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("location", sa.String(), nullable=True),
            sa.Column("url", sa.String(), nullable=False),
            sa.Column("job_type", sa.String(), nullable=False),
            sa.Column("category", sa.String(), nullable=True),
            sa.Column("description", sa.String(), nullable=True),
            sa.Column("tags", sa.JSON(), nullable=False),
            sa.Column("posted_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("first_seen_at", sa.DateTime(timezone=True)),
            sa.Column("last_seen_at", sa.DateTime(timezone=True)),
            sa.Column("is_active", sa.Boolean(), nullable=False),
            sa.UniqueConstraint("source", "external_id", name="uq_job_source_external"),
        )
        op.create_index("ix_job_postings_company", "job_postings", ["company"])
        op.create_index("ix_job_postings_job_type", "job_postings", ["job_type"])
        op.create_index("ix_job_postings_first_seen_at", "job_postings", ["first_seen_at"])
        op.create_index("ix_job_postings_is_active", "job_postings", ["is_active"])

    if not _has_table("job_interactions"):
        op.create_table(
            "job_interactions",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("job_id", sa.Integer(), sa.ForeignKey("job_postings.id"), nullable=False),
            sa.Column("state", sa.String(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True)),
            sa.UniqueConstraint("user_id", "job_id", name="uq_job_interaction_user_job"),
        )
        op.create_index("ix_job_interactions_user_id", "job_interactions", ["user_id"])
        op.create_index("ix_job_interactions_job_id", "job_interactions", ["job_id"])


def downgrade() -> None:
    op.drop_table("job_interactions")
    op.drop_table("job_postings")
    op.drop_table("api_tokens")
    with op.batch_alter_table("users") as batch:
        batch.drop_column("last_digest_at")
        batch.drop_column("digest_enabled")
        batch.drop_column("job_keywords")
    with op.batch_alter_table("applications") as batch:
        batch.drop_index("ix_applications_job_url")
        batch.drop_column("source")
        batch.drop_column("location")
        batch.drop_column("job_url")
