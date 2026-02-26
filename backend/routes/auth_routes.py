"""
routes/auth_routes.py
---------------------
Authentication endpoints:
  POST /auth/register  - JSON body with business intelligence fields
  POST /auth/login     - JSON body, returns JWT
  GET  /auth/me        - Returns current user profile

NOTE: Logo upload is handled separately via PATCH /business/me after registration.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

from database import get_database
from models.user_model import LoginRequest, UserResponse
from utils.auth_utils import hash_password, verify_password, create_access_token
from utils.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ---------------------------------------------------------------------------
# Registration Request Model (JSON)
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    # Required user fields
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)

    # Required business intelligence fields
    business_name: str = Field(..., min_length=2, max_length=200)
    category: str
    description: str
    target_audience: str
    primary_goal: str
    brand_tone: str
    offerings: str

    # Optional branding fields
    location: Optional[str] = None
    brand_colors: Optional[List[str]] = None   # e.g. ["#FF0000", "#00FF00"]
    preferred_style: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def serialize_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "business_id": user.get("business_id"),
        "created_at": user["created_at"],
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest):
    """
    Register a new business owner with full business intelligence fields.
    Accepts JSON body.
    Logo can be uploaded later via PATCH /business/me
    """
    db = get_database()

    # 1. Check for duplicate email
    if db["users"].find_one({"email": data.email}):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # 2. Create business document
    business_doc = {
        "business_name": data.business_name,
        "category": data.category,
        "description": data.description,
        "target_audience": data.target_audience,
        "primary_goal": data.primary_goal,
        "brand_tone": data.brand_tone,
        "offerings": data.offerings,
        "location": data.location,
        "brand_colors": data.brand_colors or [],
        "preferred_style": data.preferred_style,
        "logo_url": None,   # Updated later via PATCH /business/me
        "created_at": datetime.utcnow(),
    }
    business_result = db["businesses"].insert_one(business_doc)
    business_id = str(business_result.inserted_id)

    # 3. Create user document
    user_doc = {
        "name": data.name,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "role": "user",
        "business_id": business_id,
        "created_at": datetime.utcnow(),
    }
    user_result = db["users"].insert_one(user_doc)
    user_id = str(user_result.inserted_id)

    # 4. Return JWT — user is auto logged-in after registration
    token = create_access_token({"sub": user_id})

    return {
        "message": "Registration successful.",
        "access_token": token,
        "token_type": "bearer",
        "business_id": business_id,
    }


@router.post("/login")
def login(data: LoginRequest):
    """Authenticate user and return JWT."""
    db = get_database()

    user = db["users"].find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_access_token({"sub": str(user["_id"])})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": serialize_user(user),
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return serialize_user(current_user)