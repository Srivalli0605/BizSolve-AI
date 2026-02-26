"""
routes/asset_routes.py
----------------------
Brand Vault asset management (folders, notes, files, images):
  GET    /assets/               - List assets (optionally filtered by parent_folder_id)
  GET    /assets/{id}           - Get a single asset
  POST   /assets/               - Create an asset or folder
  PATCH  /assets/{id}           - Update an asset
  DELETE /assets/{id}           - Delete an asset (and optionally its children)
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from datetime import datetime
from typing import Optional
from bson import ObjectId

from database import get_database
from models.asset_model import AssetCreateRequest, AssetUpdateRequest, AssetResponse
from utils.dependencies import get_current_user

router = APIRouter(prefix="/assets", tags=["Brand Vault"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def serialize_asset(a: dict) -> dict:
    return {
        "id": str(a["_id"]),
        "business_id": a["business_id"],
        "name": a["name"],
        "type": a["type"],
        "parent_folder_id": a.get("parent_folder_id"),
        "content": a.get("content"),
        "file_url": a.get("file_url"),
        "created_at": a["created_at"],
        "updated_at": a["updated_at"],
    }


def get_asset_or_404(db, asset_id: str, business_id: str) -> dict:
    try:
        oid = ObjectId(asset_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid asset ID format.")
    asset = db["assets"].find_one({"_id": oid, "business_id": business_id})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found.")
    return asset


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[AssetResponse])
def list_assets(
    parent_folder_id: Optional[str] = Query(None, description="Filter by folder. Omit for root."),
    current_user: dict = Depends(get_current_user),
):
    """
    List assets for the authenticated business.
    Pass ?parent_folder_id=<id> to list contents of a specific folder.
    Omit to list root-level assets.
    """
    db = get_database()
    query = {
        "business_id": current_user["business_id"],
        "parent_folder_id": parent_folder_id,   # None = root level
    }
    assets = list(db["assets"].find(query))
    return [serialize_asset(a) for a in assets]


@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(asset_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    asset = get_asset_or_404(db, asset_id, current_user["business_id"])
    return serialize_asset(asset)


@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(
    data: AssetCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new asset (folder, note, file, or image)."""
    db = get_database()

    # If a parent_folder_id is given, verify it exists and is a folder
    if data.parent_folder_id:
        parent = db["assets"].find_one({
            "_id": ObjectId(data.parent_folder_id),
            "business_id": current_user["business_id"],
            "type": "folder",
        })
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found.")

    now = datetime.utcnow()
    doc = {
        **data.dict(),
        "business_id": current_user["business_id"],
        "created_at": now,
        "updated_at": now,
    }
    result = db["assets"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_asset(doc)


@router.patch("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: str,
    data: AssetUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    get_asset_or_404(db, asset_id, current_user["business_id"])

    update_fields = {k: v for k, v in data.dict().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided to update.")

    update_fields["updated_at"] = datetime.utcnow()

    db["assets"].update_one(
        {"_id": ObjectId(asset_id)},
        {"$set": update_fields},
    )

    updated = get_asset_or_404(db, asset_id, current_user["business_id"])
    return serialize_asset(updated)


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(asset_id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete an asset. If it's a folder, all children are also deleted (cascade).
    """
    db = get_database()
    asset = get_asset_or_404(db, asset_id, current_user["business_id"])

    # Cascade delete children if this is a folder
    if asset["type"] == "folder":
        db["assets"].delete_many({
            "parent_folder_id": asset_id,
            "business_id": current_user["business_id"],
        })

    db["assets"].delete_one({"_id": ObjectId(asset_id)})