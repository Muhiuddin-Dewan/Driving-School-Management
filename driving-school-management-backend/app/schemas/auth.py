"""Auth-related schemas."""
from typing import Optional

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenPayload(BaseModel):
    sub: str
    email: Optional[str] = None
    name: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "AuthUser"


class AuthUser(BaseModel):
    email: str
    name: str


TokenResponse.model_rebuild()
