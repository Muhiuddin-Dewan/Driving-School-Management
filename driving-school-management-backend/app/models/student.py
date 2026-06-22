"""SQLAlchemy models for the driving school application."""
from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Student(Base):
    """A driving-school student."""

    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    phone_number = Column(String(50), nullable=False, index=True)
    date_of_birth = Column(Date, nullable=False)
    address = Column(String, nullable=False)
    emergency_contact = Column(String(50), nullable=False)

    # Renamed from license_type to driving_type
    driving_type = Column(String(100), nullable=False, index=True)
    admission_date = Column(Date, nullable=False, index=True)
    status = Column(String(50), nullable=False, default="active", index=True)

    course_fee = Column(Numeric(10, 2), nullable=False)
    discount = Column(Numeric(10, 2), default=0)
    amount_paid = Column(Numeric(10, 2), nullable=False)
    net_payable = Column(Numeric(10, 2), nullable=False)

    photo_path = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)

    classes = relationship(
        "ClassSession",
        back_populates="student",
        cascade="all, delete-orphan",
        order_by="ClassSession.class_type, ClassSession.class_number",
    )


class ClassSession(Base):
    """A single scheduled class session belonging to a student."""

    __tablename__ = "class_sessions"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    class_type = Column(String(20), nullable=False, index=True)  # practical|engine|theory
    class_number = Column(Integer, nullable=False)
    completed = Column(Integer, nullable=False, default=0)  # treated as boolean (0/1)
    completed_date = Column(Date, nullable=True)
    note = Column(Text, nullable=True)

    student = relationship("Student", back_populates="classes")
