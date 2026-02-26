"""
models/campaign_model.py
------------------------
Pydantic models for email campaign management.

DB Schema (MongoDB campaigns collection):
{
  _id: ObjectId,
  business_id: str,
  name: str,
  subject: str,
  body: str,
  sender_name: str,
  reply_to: str,
  status: "draft" | "sent" | "scheduled",
  analytics: { sent: int, opened: int, clicked: int },
  created_at: datetime
}
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal, Dict
from datetime import datetime


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------

class CampaignCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    subject: str = Field(..., min_length=1, max_length=300)
    body: str = Field(..., min_length=1)
    sender_name: str
    reply_to: Optional[EmailStr] = None
    status: Literal["draft", "sent", "scheduled"] = "draft"


class CampaignUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    subject: Optional[str] = Field(None, min_length=1, max_length=300)
    body: Optional[str] = None
    sender_name: Optional[str] = None
    reply_to: Optional[EmailStr] = None
    status: Optional[Literal["draft", "sent", "scheduled"]] = None


# ---------------------------------------------------------------------------
# Response Models
# ---------------------------------------------------------------------------

class CampaignAnalytics(BaseModel):
    sent: int = 0
    opened: int = 0
    clicked: int = 0


class CampaignResponse(BaseModel):
    id: str
    business_id: str
    name: str
    subject: str
    body: str
    sender_name: str
    reply_to: Optional[str]
    status: str
    analytics: CampaignAnalytics
    created_at: datetime