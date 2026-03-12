"""
routes/campaign_routes.py
--------------------------
IMPORTANT: Static routes (/generate, /stats) must be defined
BEFORE dynamic routes (/{campaign_id}) to prevent FastAPI from
treating "generate" or "stats" as a campaign ID parameter.
"""

import re
from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from bson import ObjectId

from database import get_database
from models.campaign_model import (
    CampaignCreateRequest,
    CampaignUpdateRequest,
    CampaignResponse,
    GenerateEmailRequest,
    SendEmailRequest,
)
from utils.dependencies import get_current_user
from services.email_service import generate_email_with_gemini, send_email_via_resend

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def serialize_campaign(c: dict) -> dict:
    return {
        "id": str(c["_id"]),
        "business_id": c["business_id"],
        "name": c["name"],
        "subject": c["subject"],
        "body": c.get("body", ""),
        "sender_name": c.get("sender_name", ""),
        "reply_to": c.get("reply_to"),
        "status": c.get("status", "draft"),
        "analytics": c.get("analytics", {"sent": 0, "opened": 0, "clicked": 0}),
        "body_html": c.get("body_html"),
        "preview_text": c.get("preview_text"),
        "cta_text": c.get("cta_text"),
        "recipients": c.get("recipients", []),
        "sent_count": c.get("sent_count", 0),
        "sent_at": c.get("sent_at"),
        "created_at": c["created_at"],
    }


def get_campaign_or_404(db, campaign_id: str, business_id: str) -> dict:
    try:
        oid = ObjectId(campaign_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid campaign ID format.")
    campaign = db["campaigns"].find_one({"_id": oid, "business_id": business_id})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    return campaign


# ---------------------------------------------------------------------------
# ✅ STATIC ROUTES — defined first to avoid conflict with /{campaign_id}
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[CampaignResponse])
def list_campaigns(current_user: dict = Depends(get_current_user)):
    db = get_database()
    campaigns = list(db["campaigns"].find({"business_id": current_user["business_id"]}))
    return [serialize_campaign(c) for c in campaigns]


@router.post("/", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    data: CampaignCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    doc = {
        **data.dict(),
        "business_id": current_user["business_id"],
        "analytics": {"sent": 0, "opened": 0, "clicked": 0},
        "created_at": datetime.utcnow(),
    }
    result = db["campaigns"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_campaign(doc)


@router.post("/generate", status_code=status.HTTP_201_CREATED)
def generate_campaign_email(
    data: GenerateEmailRequest,
    current_user: dict = Depends(get_current_user),
):
    """Generate AI email via Gemini and save as draft campaign."""
    db = get_database()
    business_id = current_user["business_id"]

    business = db["businesses"].find_one({"_id": ObjectId(business_id)}) or {}

    generated = generate_email_with_gemini(
        business_name=business.get("business_name", "Our Company"),
        category=business.get("category", "Business"),
        target_audience=data.target_audience,
        email_type=data.email_type,
        offer_details=data.offer_details,
        discount=data.discount or "None",
        tone=data.tone,
        cta_text=data.cta_text,
    )

    doc = {
        "business_id": business_id,
        "name": data.campaign_name,
        "subject": generated["subject"],
        "body": generated["preview_text"],
        "body_html": generated["body_html"],
        "preview_text": generated["preview_text"],
        "cta_text": generated.get("cta_text", data.cta_text),
        "sender_name": business.get("business_name", ""),
        "reply_to": None,
        "recipients": [],
        "status": "draft",
        "sent_count": 0,
        "sent_at": None,
        "analytics": {"sent": 0, "opened": 0, "clicked": 0},
        "created_at": datetime.utcnow(),
    }

    result = db["campaigns"].insert_one(doc)

    return {
        "campaign_id": str(result.inserted_id),
        "subject": generated["subject"],
        "preview_text": generated["preview_text"],
        "body_html": generated["body_html"],
        "cta_text": generated.get("cta_text", data.cta_text),
    }


@router.get("/stats/summary")
def campaign_stats(current_user: dict = Depends(get_current_user)):
    """Email stats for dashboard widget."""
    db = get_database()
    business_id = current_user["business_id"]

    total = db["campaigns"].count_documents({"business_id": business_id})
    sent = db["campaigns"].count_documents({"business_id": business_id, "status": "sent"})

    agg = list(db["campaigns"].aggregate([
        {"$match": {"business_id": business_id, "status": "sent"}},
        {"$group": {"_id": None, "total": {"$sum": "$sent_count"}}}
    ]))
    emails_delivered = agg[0]["total"] if agg else 0

    return {
        "total_campaigns": total,
        "sent_campaigns": sent,
        "emails_delivered": emails_delivered,
    }


# ---------------------------------------------------------------------------
# ✅ DYNAMIC ROUTES — must come after all static routes above
# ---------------------------------------------------------------------------

@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    campaign = get_campaign_or_404(db, campaign_id, current_user["business_id"])
    return serialize_campaign(campaign)


@router.patch("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(
    campaign_id: str,
    data: CampaignUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    get_campaign_or_404(db, campaign_id, current_user["business_id"])

    update_fields = {k: v for k, v in data.dict().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided to update.")

    db["campaigns"].update_one(
        {"_id": ObjectId(campaign_id)},
        {"$set": update_fields},
    )
    updated = get_campaign_or_404(db, campaign_id, current_user["business_id"])
    return serialize_campaign(updated)


@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        oid = ObjectId(campaign_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid campaign ID format.")

    result = db["campaigns"].delete_one({
        "_id": oid,
        "business_id": current_user["business_id"],
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found.")


@router.post("/send/{campaign_id}")
def send_campaign(
    campaign_id: str,
    data: SendEmailRequest,
    current_user: dict = Depends(get_current_user),
):
    """Send campaign via Resend API."""
    db = get_database()
    business_id = current_user["business_id"]

    campaign = get_campaign_or_404(db, campaign_id, business_id)

    if not data.recipients:
        raise HTTPException(status_code=400, detail="At least one recipient is required.")

    subject = data.subject or campaign["subject"]
    body_html = data.body_html or campaign.get("body_html") or campaign.get("body", "")

    if not subject.strip():
        raise HTTPException(status_code=400, detail="Subject cannot be empty.")
    if not body_html.strip():
        raise HTTPException(status_code=400, detail="Email body cannot be empty.")

    email_pattern = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    recipients_str = [str(r) for r in data.recipients]
    invalid = [r for r in recipients_str if not email_pattern.match(r.strip())]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid email(s): {', '.join(invalid)}")

    send_email_via_resend(to=recipients_str, subject=subject, html=body_html)

    db["campaigns"].update_one(
        {"_id": ObjectId(campaign_id)},
        {"$set": {
            "recipients": recipients_str,
            "subject": subject,
            "body_html": body_html,
            "status": "sent",
            "sent_count": len(recipients_str),
            "sent_at": datetime.utcnow(),
            "analytics.sent": len(recipients_str),
        }}
    )

    return {"message": "Email sent successfully.", "sent_count": len(recipients_str)}