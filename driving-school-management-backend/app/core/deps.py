"""FastAPI dependencies for authentication and database sessions."""
from typing import Annotated, Optional

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.schemas.auth import TokenPayload

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(bearer_scheme)],
) -> TokenPayload:
    """Validate the Bearer token and return the decoded payload.

    Accepts either FastAPI's HTTPBearer result or a raw Authorization header.
    Raises 401 if the token is missing or invalid.
    """
    token: Optional[str] = None
    if credentials is not None:
        token = credentials.credentials

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenPayload(**payload)


DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[TokenPayload, Depends(get_current_user)]
