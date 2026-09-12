"""
Single source of truth for request authentication. Every protected route
depends on `require_api_key` instead of each router re-implementing a key
check — one place to change if the auth strategy ever evolves.
"""
from fastapi import Header, HTTPException, status

from app.config import settings


def require_api_key(x_api_key: str = Header(..., alias="X-API-Key")) -> None:
    if x_api_key != settings.backend_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )
