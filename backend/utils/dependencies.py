"""
utils/dependencies.py
---------------------
FastAPI dependency functions for route protection.

Usage:
  - get_current_user  → any authenticated user
  - require_admin     → admin-only routes
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from bson import ObjectId

from database import get_database
from utils.auth_utils import decode_access_token

# Points to the login endpoint so Swagger UI can auto-authenticate
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Dependency: Validates the Bearer JWT token and returns the user document.
    
    Raises 401 if:
    - Token is missing or malformed
    - Token is expired
    - User no longer exists in DB
    
    Inject with: current_user: dict = Depends(get_current_user)
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    db = get_database()
    user = db["users"].find_one({"_id": ObjectId(user_id)})

    if user is None:
        raise credentials_exception

    return user


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency: Extends get_current_user — additionally enforces admin role.
    
    Raises 403 if the authenticated user is not an admin.
    
    Inject with: admin: dict = Depends(require_admin)
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required.",
        )
    return current_user