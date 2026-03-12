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
  body_html: str,          ← AI-generated HTML version
  preview_text: str,       ← inbox preview snippet
  sender_name: str,
  reply_to: str,
  status: "draft" | "sent" | "scheduled",
  recipients: [str],       ← list of recipient emails
  sent_count: int,
  sent_at: datetime,
  analytics: { sent: int, opened: int, clicked: int },
  created_at: datetime
}
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal, List
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


# New: AI generation request
class GenerateEmailRequest(BaseModel):
    campaign_name: str = Field(..., min_length=1, max_length=200)
    email_type: str
    target_audience: str
    offer_details: str
    discount: Optional[str] = ""
    tone: str
    cta_text: str


# New: Send request
class SendEmailRequest(BaseModel):
    recipients: List[EmailStr]
    subject: Optional[str] = None
    body_html: Optional[str] = None


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
    sender_name: Optional[str] = None
    reply_to: Optional[str] = None
    status: str
    analytics: CampaignAnalytics
    # AI generation fields (optional — only present on AI-generated campaigns)
    body_html: Optional[str] = None
    preview_text: Optional[str] = None
    cta_text: Optional[str] = None
    recipients: Optional[List[str]] = []
    sent_count: Optional[int] = 0
    sent_at: Optional[datetime] = None
    created_at: datetime