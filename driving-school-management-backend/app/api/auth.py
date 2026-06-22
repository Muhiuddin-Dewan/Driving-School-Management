"""Authentication endpoints.

Login is checked against `ADMIN_EMAIL` / `ADMIN_PASSWORD` from the
environment. On success we issue a JWT that the frontend stores and sends
back as a Bearer token for all subsequent requests.
"""
from fastapi import APIRouter, HTTPException, status

from app.core.config import settings
from app.core.security import create_access_token
from app.schemas.auth import AuthUser, LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    email = payload.email.strip().lower()
    if email != settings.ADMIN_EMAIL.lower() or payload.password != settings.ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(
        subject=email,
        extra={"email": email, "name": settings.ADMIN_NAME},
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=AuthUser(email=email, name=settings.ADMIN_NAME),
    )
