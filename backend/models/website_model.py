"""
models/website_model.py
-----------------------
Pydantic models for AI-generated website management.

DB Schema (MongoDB websites collection):
{
  _id: ObjectId,
  business_id: str,
  template: str,
  content_json: dict,
  vercel_project_name: str,
  published_url: str,
  version: int,
  created_at: datetime,
  updated_at: datetime
}
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------

class WebsiteCreateRequest(BaseModel):
    template: str = Field(..., description="Template identifier e.g. 'modern', 'classic'")
    content_json: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="AI-generated or user-edited content as structured JSON"
    )
    vercel_project_name: Optional[str] = None
    published_url: Optional[str] = None


class WebsiteUpdateRequest(BaseModel):
    template: Optional[str] = None
    content_json: Optional[Dict[str, Any]] = None
    vercel_project_name: Optional[str] = None
    published_url: Optional[str] = None


# ---------------------------------------------------------------------------
# Response Models
# ---------------------------------------------------------------------------

class WebsiteResponse(BaseModel):
    id: str
    business_id: str
    template: str
    content_json: Optional[Dict[str, Any]]
    vercel_project_name: Optional[str]
    published_url: Optional[str]
    version: int
    created_at: datetime
    updated_at: datetime