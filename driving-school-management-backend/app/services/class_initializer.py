"""Class structure definitions and initialization helpers.

These mirror the frontend's `CLASS_STRUCTURE` so that new students always
get a full set of scheduled classes when they are created.
"""
from typing import Dict

from sqlalchemy.orm import Session

from app.models.student import ClassSession, Student

# Total class counts per driving type — keep in sync with frontend CLASS_STRUCTURE.
CLASS_STRUCTURE: Dict[str, Dict[str, int]] = {
    "car": {"practical": 20, "engine": 2, "theory": 2, "total": 24},
    "motorcycle": {"practical": 15, "engine": 1, "theory": 2, "total": 18},
    "commercial": {"practical": 30, "engine": 4, "theory": 6, "total": 40},
}

VALID_DRIVING_TYPES = set(CLASS_STRUCTURE.keys())


def initialize_classes_for_student(db: Session, student: Student) -> None:
    """Create the full set of ClassSession rows for `student`.

    Idempotent: if the student already has sessions, do nothing.
    """
    if student.classes:
        return

    structure = CLASS_STRUCTURE.get(student.driving_type)
    if not structure:
        return

    sessions: list[ClassSession] = []
    for class_type in ("practical", "engine", "theory"):
        for n in range(1, structure[class_type] + 1):
            sessions.append(
                ClassSession(
                    student_id=student.id,
                    class_type=class_type,
                    class_number=n,
                    completed=0,
                )
            )
    db.add_all(sessions)
    db.flush()
