from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.student import router as student_router

__all__ = ["auth_router", "dashboard_router", "student_router"]
