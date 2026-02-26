"""
models/business_model.py
------------------------
Updated business model with full AI generation fields.

DB Schema (MongoDB businesses collection):
{
  _id: ObjectId,
  business_name: str,
  category: str,
  description: str,
  target_audience: str,
  primary_goal: str,
  brand_tone: str,
  offerings: str,
  location: str (optional),
  brand_colors: [str] (optional),
  preferred_style: str (optional),
  logo_url: str (optional),
  created_at: datetime
}
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------

class BusinessUpdateRequest(BaseModel):
    business_name: Optional[str] = Field(None, min_length=2, max_length=200)
    category: Optional[str] = None
    description: Optional[str] = None
    target_audience: Optional[str] = None
    primary_goal: Optional[str] = None
    brand_tone: Optional[str] = None
    offerings: Optional[str] = None
    location: Optional[str] = None
    brand_colors: Optional[List[str]] = None
    preferred_style: Optional[str] = None
    logo_url: Optional[str] = None


# ---------------------------------------------------------------------------
# Response Models
# ---------------------------------------------------------------------------

class BusinessResponse(BaseModel):
    id: str
    business_name: str
    category: Optional[str]
    description: Optional[str]
    target_audience: Optional[str]
    primary_goal: Optional[str]
    brand_tone: Optional[str]
    offerings: Optional[str]
    location: Optional[str]
    brand_colors: Optional[List[str]]
    preferred_style: Optional[str]
    logo_url: Optional[str]
    created_at: datetime