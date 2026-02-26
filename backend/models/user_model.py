"""
models/user_model.py
--------------------
Updated registration model with full business intelligence fields
required for AI website and marketing generation.

NOTE: Registration uses multipart/form-data (not JSON)
      because logo file upload is included.
      Form fields are defined directly in auth_routes.py using FastAPI Form().
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# ---------------------------------------------------------------------------
# Login Request (stays as JSON body)
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ---------------------------------------------------------------------------
# Update user name
# ---------------------------------------------------------------------------

class UpdateUserRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)


# ---------------------------------------------------------------------------
# Response Model
# ---------------------------------------------------------------------------

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    business_id: Optional[str]
    created_at: datetime


# ---------------------------------------------------------------------------
# NOTE: RegisterRequest is NO LONGER a Pydantic BaseModel.
# Registration uses Form() fields directly in the route
# because Pydantic body models are incompatible with multipart/form-data.
# See: routes/auth_routes.py → register()
# ---------------------------------------------------------------------------