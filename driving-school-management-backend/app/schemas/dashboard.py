"""Dashboard aggregate stats schemas."""
from datetime import date
from decimal import Decimal
from typing import List

from pydantic import BaseModel


class LicenseDistribution(BaseModel):
    license_type: str
    count: int
    percentage: float


class FinancialOverview(BaseModel):
    total_revenue: Decimal
    pending_payments: Decimal
    total_collected: Decimal
    total_course_fees: Decimal


class RecentAdmission(BaseModel):
    id: int
    name: str
    email: str
    license_type: str
    admission_date: date
    status: str


class DashboardStats(BaseModel):
    total_students: int
    active_students: int
    completed_students: int
    dropped_students: int

    license_distribution: List[LicenseDistribution]
    financial_overview: FinancialOverview
    recent_admissions: List[RecentAdmission]
