"""Dashboard aggregate stats endpoint."""
from datetime import date
from decimal import Decimal
from typing import List

from fastapi import APIRouter
from sqlalchemy import func

from app.core.deps import CurrentUser, DbSession
from app.models.student import Student
from app.schemas.dashboard import (
    DashboardStats,
    FinancialOverview,
    LicenseDistribution,
    RecentAdmission,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

VALID_LICENSE_TYPES = ("car", "motorcycle", "commercial")


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: DbSession, _user: CurrentUser) -> DashboardStats:
    base = db.query(Student)

    total_students = base.count()
    active_students = base.filter(Student.status == "active").count()
    completed_students = base.filter(Student.status == "completed").count()
    dropped_students = base.filter(Student.status == "dropped").count()

    # License distribution
    license_rows = (
        db.query(Student.driving_type, func.count(Student.id))
        .group_by(Student.driving_type)
        .all()
    )
    license_map = {row[0]: row[1] for row in license_rows}
    license_distribution: List[LicenseDistribution] = []
    for lt in VALID_LICENSE_TYPES:
        count = license_map.get(lt, 0)
        license_distribution.append(
            LicenseDistribution(
                license_type=lt,
                count=count,
                percentage=round((count / total_students * 100), 2) if total_students else 0.0,
            )
        )

    # Financial overview
    financial_row = (
        db.query(
            func.coalesce(func.sum(Student.course_fee), 0),
            func.coalesce(func.sum(Student.discount), 0),
            func.coalesce(func.sum(Student.amount_paid), 0),
            func.coalesce(func.sum(Student.net_payable), 0),
        )
        .one()
    )
    total_course_fees = Decimal(financial_row[0] or 0)
    total_collected = Decimal(financial_row[2] or 0)
    total_net_payable = Decimal(financial_row[3] or 0)
    pending_payments = max(Decimal("0"), total_net_payable - total_collected)

    financial_overview = FinancialOverview(
        total_revenue=total_collected,
        pending_payments=pending_payments,
        total_collected=total_collected,
        total_course_fees=total_course_fees,
    )

    # Recent admissions (latest 7)
    recent_rows = (
        db.query(Student)
        .order_by(Student.admission_date.desc(), Student.id.desc())
        .limit(7)
        .all()
    )
    recent_admissions = [
        RecentAdmission(
            id=s.id,
            name=s.full_name,
            email=s.email,
            license_type=s.driving_type,
            admission_date=s.admission_date,
            status=s.status,
        )
        for s in recent_rows
    ]

    return DashboardStats(
        total_students=total_students,
        active_students=active_students,
        completed_students=completed_students,
        dropped_students=dropped_students,
        license_distribution=license_distribution,
        financial_overview=financial_overview,
        recent_admissions=recent_admissions,
    )
