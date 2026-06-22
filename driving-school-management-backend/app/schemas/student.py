"""Pydantic schemas for student resources."""
from datetime import date
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------------------------------------------------------------------------
# Class session
# ---------------------------------------------------------------------------
class ClassSessionBase(BaseModel):
    class_type: str = Field(..., description="practical | engine | theory")
    class_number: int
    completed: bool = False
    completed_date: Optional[date] = None
    note: Optional[str] = None


class ClassSessionResponse(ClassSessionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class ClassSessionUpdate(BaseModel):
    completed: Optional[bool] = None
    completed_date: Optional[date] = None
    note: Optional[str] = None


class CourseClasses(BaseModel):
    practical: List[ClassSessionResponse] = []
    engine: List[ClassSessionResponse] = []
    theory: List[ClassSessionResponse] = []


# ---------------------------------------------------------------------------
# Student
# ---------------------------------------------------------------------------
class StudentCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    email: EmailStr
    phone: str
    dateOfBirth: date
    address: str
    emergencyContact: str
    drivingType: str
    admissionDate: date
    status: str = "active"
    courseFee: Decimal
    discount: Decimal = Decimal("0")
    paidAmount: Decimal
    notes: Optional[str] = None


class StudentUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    dateOfBirth: Optional[date] = None
    address: Optional[str] = None
    emergencyContact: Optional[str] = None
    drivingType: Optional[str] = None
    admissionDate: Optional[date] = None
    status: Optional[str] = None
    courseFee: Optional[Decimal] = None
    discount: Optional[Decimal] = None
    paidAmount: Optional[Decimal] = None
    notes: Optional[str] = None


class StudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int

    name: str = Field(validation_alias="full_name")
    email: str
    phone: str = Field(validation_alias="phone_number")
    dateOfBirth: date = Field(validation_alias="date_of_birth")
    address: str
    emergencyContact: str = Field(validation_alias="emergency_contact")
    drivingType: str = Field(validation_alias="driving_type")
    admissionDate: date = Field(validation_alias="admission_date")
    status: str

    courseFee: Decimal = Field(validation_alias="course_fee")
    discount: Decimal
    paidAmount: Decimal = Field(validation_alias="amount_paid")
    netPayable: Decimal = Field(validation_alias="net_payable")

    notes: Optional[str] = None
    photoUrl: Optional[str] = Field(default=None, validation_alias="photo_path")
    classes: CourseClasses = Field(default_factory=CourseClasses)


class StudentListResponse(BaseModel):
    """Paginated list of students with optional filter metadata."""

    items: List[StudentResponse]
    total: int
    page: int
    page_size: int
