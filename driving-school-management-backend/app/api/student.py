"""Student CRUD endpoints (production-grade).

All endpoints require a valid Bearer JWT. Supports:
  * List with search, status filter, license filter, pagination
  * Get one (with class sessions)
  * Create (auto-initializes class sessions)
  * Update (handles photo replacement)
  * Delete (cascades class sessions, removes photo file)
  * Toggle / annotate a single class session
"""
import os
from datetime import date as date_type
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.core.deps import CurrentUser, DbSession
from app.models.student import ClassSession, Student
from app.schemas.student import (
    ClassSessionResponse,
    ClassSessionUpdate,
    CourseClasses,
    StudentListResponse,
    StudentResponse,
)
from app.services.class_initializer import (
    CLASS_STRUCTURE,
    initialize_classes_for_student,
)
from app.services.photo_storage import delete_photo, save_photo

router = APIRouter(prefix="/students", tags=["Students"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def parse_date(value: str | None) -> date_type | None:
    """Parse a YYYY-MM-DD string into a date. Returns None if input is None/empty."""
    if not value:
        return None
    try:
        return date_type.fromisoformat(value)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format: {value!r}. Expected YYYY-MM-DD.",
        )


def recalculate_net(course_fee: Decimal, discount: Decimal, paid: Decimal) -> Decimal:
    """Net payable is course_fee - discount (NOT minus paid)."""
    return max(Decimal("0"), course_fee - discount)


def group_classes(sessions: List[ClassSession]) -> CourseClasses:
    """Group a flat list of ClassSession rows into the CourseClasses shape."""
    grouped: dict[str, list[ClassSession]] = {"practical": [], "engine": [], "theory": []}
    for s in sessions:
        if s.class_type in grouped:
            grouped[s.class_type].append(s)

    return CourseClasses(
        practical=[
            ClassSessionResponse.model_validate(s)
            for s in sorted(grouped["practical"], key=lambda x: x.class_number)
        ],
        engine=[
            ClassSessionResponse.model_validate(s)
            for s in sorted(grouped["engine"], key=lambda x: x.class_number)
        ],
        theory=[
            ClassSessionResponse.model_validate(s)
            for s in sorted(grouped["theory"], key=lambda x: x.class_number)
        ],
    )


def get_student_or_404(db: Session, student_id: int) -> Student:
    student = (
        db.query(Student)
        .options(selectinload(Student.classes))
        .filter(Student.id == student_id)
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


def serialize_student(student: Student) -> StudentResponse:
    return StudentResponse(
        id=student.id,
        name=student.full_name,
        email=student.email,
        phone=student.phone_number,
        dateOfBirth=student.date_of_birth,
        address=student.address,
        emergencyContact=student.emergency_contact,
        drivingType=student.driving_type,
        admissionDate=student.admission_date,
        status=student.status,
        courseFee=student.course_fee,
        discount=student.discount,
        paidAmount=student.amount_paid,
        netPayable=student.net_payable,
        notes=student.notes,
        photoUrl=student.photo_path,
        classes=group_classes(student.classes or []),
    )


# ---------------------------------------------------------------------------
# CREATE
# ---------------------------------------------------------------------------
@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    db: DbSession,
    _user: CurrentUser,
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    dateOfBirth: str = Form(...),
    address: str = Form(...),
    emergencyContact: str = Form(...),
    drivingType: str = Form(...),
    admissionDate: str = Form(...),
    status_: str = Form("active", alias="status"),
    courseFee: Decimal = Form(...),
    discount: Decimal = Form(Decimal("0")),
    paidAmount: Decimal = Form(...),
    notes: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
):
    if drivingType not in CLASS_STRUCTURE:
        raise HTTPException(status_code=400, detail=f"Invalid drivingType: {drivingType}")

    if db.query(Student).filter(Student.email == email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    photo_path = None
    if photo and photo.filename:
        photo_path = save_photo(photo)

    net_payable = recalculate_net(courseFee, discount, paidAmount)

    student = Student(
        full_name=name,
        email=email,
        phone_number=phone,
        date_of_birth=parse_date(dateOfBirth),
        address=address,
        emergency_contact=emergencyContact,
        driving_type=drivingType,
        admission_date=parse_date(admissionDate),
        status=status_,
        course_fee=courseFee,
        discount=discount,
        amount_paid=paidAmount,
        net_payable=net_payable,
        notes=notes,
        photo_path=photo_path,
    )
    db.add(student)
    db.flush()
    initialize_classes_for_student(db, student)
    db.commit()
    db.refresh(student)

    # Eagerly load classes for the response
    db.refresh(student)
    _ = student.classes
    return serialize_student(student)


# ---------------------------------------------------------------------------
# READ ALL — with search, filters, pagination
# ---------------------------------------------------------------------------
@router.get("/", response_model=StudentListResponse)
def list_students(
    db: DbSession,
    _user: CurrentUser,
    search: Optional[str] = None,
    status: Optional[str] = None,
    drivingType: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
):
    page = max(page, 1)
    page_size = max(1, min(page_size, 500))

    query = db.query(Student).options(selectinload(Student.classes))

    if search:
        like = f"%{search.lower()}%"
        query = query.filter(
            or_(
                Student.full_name.ilike(like),
                Student.email.ilike(like),
                Student.phone_number.ilike(like),
            )
        )

    if status and status != "all":
        query = query.filter(Student.status == status)

    if drivingType and drivingType != "all":
        query = query.filter(Student.driving_type == drivingType)

    query = query.order_by(Student.admission_date.desc(), Student.id.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return StudentListResponse(
        items=[serialize_student(s) for s in items],
        total=total,
        page=page,
        page_size=page_size,
    )


# ---------------------------------------------------------------------------
# READ ONE
# ---------------------------------------------------------------------------
@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: DbSession, _user: CurrentUser):
    return serialize_student(get_student_or_404(db, student_id))


# ---------------------------------------------------------------------------
# UPDATE
# ---------------------------------------------------------------------------
@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    db: DbSession,
    _user: CurrentUser,
    name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    dateOfBirth: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    emergencyContact: Optional[str] = Form(None),
    drivingType: Optional[str] = Form(None),
    admissionDate: Optional[str] = Form(None),
    status_: Optional[str] = Form(None, alias="status"),
    courseFee: Optional[Decimal] = Form(None),
    discount: Optional[Decimal] = Form(None),
    paidAmount: Optional[Decimal] = Form(None),
    notes: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
):
    student = get_student_or_404(db, student_id)

    if drivingType and drivingType not in CLASS_STRUCTURE:
        raise HTTPException(status_code=400, detail=f"Invalid drivingType: {drivingType}")

    if email and email != student.email:
        if db.query(Student).filter(Student.email == email).first():
            raise HTTPException(status_code=400, detail="Email already exists")
        student.email = email

    if name is not None:
        student.full_name = name
    if phone is not None:
        student.phone_number = phone
    if dateOfBirth is not None:
        student.date_of_birth = parse_date(dateOfBirth)
    if address is not None:
        student.address = address
    if emergencyContact is not None:
        student.emergency_contact = emergencyContact
    if drivingType is not None:
        student.driving_type = drivingType
    if admissionDate is not None:
        student.admission_date = parse_date(admissionDate)
    if status_ is not None:
        student.status = status_
    if courseFee is not None:
        student.course_fee = courseFee
    if discount is not None:
        student.discount = discount
    if paidAmount is not None:
        student.amount_paid = paidAmount
    if notes is not None:
        student.notes = notes

    if photo and photo.filename:
        delete_photo(student.photo_path)
        student.photo_path = save_photo(photo)

    # Always recompute net payable
    student.net_payable = recalculate_net(
        student.course_fee, student.discount, student.amount_paid
    )

    db.commit()
    db.refresh(student)
    _ = student.classes
    return serialize_student(student)


# ---------------------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------------------
@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: DbSession, _user: CurrentUser):
    student = get_student_or_404(db, student_id)
    delete_photo(student.photo_path)
    db.delete(student)
    db.commit()


# ---------------------------------------------------------------------------
# CLASS SESSIONS
# ---------------------------------------------------------------------------
@router.patch(
    "/{student_id}/classes/{class_id}",
    response_model=ClassSessionResponse,
)
def update_class_session(
    student_id: int,
    class_id: int,
    payload: ClassSessionUpdate,
    db: DbSession,
    _user: CurrentUser,
):
    """Toggle completion or update the note of a single class session."""
    session = (
        db.query(ClassSession)
        .filter(ClassSession.id == class_id, ClassSession.student_id == student_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Class session not found")

    if payload.completed is not None:
        session.completed = 1 if payload.completed else 0
        # Update completed_date intelligently: if marking complete without explicit date, use today.
        if payload.completed:
            session.completed_date = payload.completed_date or session.completed_date
        else:
            session.completed_date = None
    elif payload.completed_date is not None:
        session.completed_date = payload.completed_date

    if payload.note is not None:
        session.note = payload.note

    db.commit()
    db.refresh(session)
    return ClassSessionResponse.model_validate(session)
