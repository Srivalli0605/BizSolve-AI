"""
routes/campaign_routes.py
--------------------------
Email campaign management endpoints:
  GET    /campaigns/          - List all campaigns
  GET    /campaigns/{id}      - Get a single campaign
  POST   /campaigns/          - Create a campaign
  PATCH  /campaigns/{id}      - Update a campaign
  DELETE /campaigns/{id}      - Delete a campaign
"""

from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from bson import ObjectId

from database import get_database
from models.campaign_model import CampaignCreateRequest, CampaignUpdateRequest, CampaignResponse
from utils.dependencies import get_current_user

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
        "body": c["body"],
        "sender_name": c["sender_name"],
        "reply_to": c.get("reply_to"),
        "status": c.get("status", "draft"),
        "analytics": c.get("analytics", {"sent": 0, "opened": 0, "clicked": 0}),
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
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[CampaignResponse])
def list_campaigns(current_user: dict = Depends(get_current_user)):
    db = get_database()
    campaigns = list(db["campaigns"].find({"business_id": current_user["business_id"]}))
    return [serialize_campaign(c) for c in campaigns]


@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    campaign = get_campaign_or_404(db, campaign_id, current_user["business_id"])
    return serialize_campaign(campaign)


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