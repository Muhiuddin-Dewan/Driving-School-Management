"""initial schema: students + class_sessions

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-22 12:00:00.000000

A single consolidated initial migration that creates both tables from scratch.
This replaces the previously broken migration chain that assumed an existing
PostgreSQL database.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001_initial"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "students",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone_number", sa.String(length=50), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=False),
        sa.Column("address", sa.String(), nullable=False),
        sa.Column("emergency_contact", sa.String(length=50), nullable=False),
        sa.Column("driving_type", sa.String(length=100), nullable=False),
        sa.Column("admission_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="active"),
        sa.Column("course_fee", sa.Numeric(10, 2), nullable=False),
        sa.Column("discount", sa.Numeric(10, 2), server_default="0"),
        sa.Column("amount_paid", sa.Numeric(10, 2), nullable=False),
        sa.Column("net_payable", sa.Numeric(10, 2), nullable=False),
        sa.Column("photo_path", sa.String(length=500), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
    )
    op.create_index("ix_students_id", "students", ["id"])
    op.create_index("ix_students_email", "students", ["email"], unique=True)
    op.create_index("ix_students_phone_number", "students", ["phone_number"])
    op.create_index("ix_students_driving_type", "students", ["driving_type"])
    op.create_index("ix_students_admission_date", "students", ["admission_date"])
    op.create_index("ix_students_status", "students", ["status"])

    op.create_table(
        "class_sessions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "student_id",
            sa.Integer(),
            sa.ForeignKey("students.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("class_type", sa.String(length=20), nullable=False),
        sa.Column("class_number", sa.Integer(), nullable=False),
        sa.Column("completed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completed_date", sa.Date(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
    )
    op.create_index("ix_class_sessions_id", "class_sessions", ["id"])
    op.create_index("ix_class_sessions_student_id", "class_sessions", ["student_id"])
    op.create_index("ix_class_sessions_class_type", "class_sessions", ["class_type"])


def downgrade() -> None:
    op.drop_index("ix_class_sessions_class_type", table_name="class_sessions")
    op.drop_index("ix_class_sessions_student_id", table_name="class_sessions")
    op.drop_index("ix_class_sessions_id", table_name="class_sessions")
    op.drop_table("class_sessions")

    op.drop_index("ix_students_status", table_name="students")
    op.drop_index("ix_students_admission_date", table_name="students")
    op.drop_index("ix_students_driving_type", table_name="students")
    op.drop_index("ix_students_phone_number", table_name="students")
    op.drop_index("ix_students_email", table_name="students")
    op.drop_index("ix_students_id", table_name="students")
    op.drop_table("students")
