"""
routes/website_routes.py
------------------------
Website management endpoints (scoped to the authenticated user's business):
  GET   /websites/      - List all websites
  GET   /websites/{id}  - Get a single website
  POST  /websites/      - Create a website
  PATCH /websites/{id}  - Update a website (auto-increments version)
  DELETE /websites/{id} - Delete a website
"""

from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from bson import ObjectId

from database import get_database
from models.website_model import WebsiteCreateRequest, WebsiteUpdateRequest, WebsiteResponse
from utils.dependencies import get_current_user

router = APIRouter(prefix="/websites", tags=["Websites"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def serialize_website(w: dict) -> dict:
    return {
        "id": str(w["_id"]),
        "business_id": w["business_id"],
        "template": w["template"],
        "content_json": w.get("content_json", {}),
        "vercel_project_name": w.get("vercel_project_name"),
        "published_url": w.get("published_url"),
        "version": w.get("version", 1),
        "created_at": w["created_at"],
        "updated_at": w["updated_at"],
    }


def get_website_or_404(db, website_id: str, business_id: str) -> dict:
    try:
        oid = ObjectId(website_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid website ID format.")
    website = db["websites"].find_one({"_id": oid, "business_id": business_id})
    if not website:
        raise HTTPException(status_code=404, detail="Website not found.")
    return website


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[WebsiteResponse])
def list_websites(current_user: dict = Depends(get_current_user)):
    db = get_database()
    websites = list(db["websites"].find({"business_id": current_user["business_id"]}))
    return [serialize_website(w) for w in websites]


@router.get("/{website_id}", response_model=WebsiteResponse)
def get_website(website_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    website = get_website_or_404(db, website_id, current_user["business_id"])
    return serialize_website(website)


@router.post("/", response_model=WebsiteResponse, status_code=status.HTTP_201_CREATED)
def create_website(
    data: WebsiteCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    now = datetime.utcnow()
    doc = {
        **data.dict(),
        "business_id": current_user["business_id"],
        "version": 1,
        "created_at": now,
        "updated_at": now,
    }
    result = db["websites"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_website(doc)


@router.patch("/{website_id}", response_model=WebsiteResponse)
def update_website(
    website_id: str,
    data: WebsiteUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()

    # Verify ownership
    existing = get_website_or_404(db, website_id, current_user["business_id"])

    update_fields = {k: v for k, v in data.dict().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided to update.")

    # Auto-increment version and update timestamp
    update_fields["updated_at"] = datetime.utcnow()

    db["websites"].update_one(
        {"_id": ObjectId(website_id)},
        {
            "$set": update_fields,
            "$inc": {"version": 1},
        },
    )

    updated = get_website_or_404(db, website_id, current_user["business_id"])
    return serialize_website(updated)


@router.delete("/{website_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_website(website_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        oid = ObjectId(website_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid website ID format.")

    result = db["websites"].delete_one({
        "_id": oid,
        "business_id": current_user["business_id"],
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Website not found.")