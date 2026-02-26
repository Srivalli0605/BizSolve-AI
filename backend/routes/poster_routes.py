"""
routes/poster_routes.py
-----------------------
Poster management endpoints (for AI-generated marketing posters):
  GET    /posters/       - List all posters
  GET    /posters/{id}   - Get a single poster
  POST   /posters/       - Save a generated poster
  DELETE /posters/{id}   - Delete a poster

NOTE: Actual AI image generation (e.g. DALL-E, Stable Diffusion) will be
      integrated separately. This route handles storage of generated results.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

from database import get_database
from utils.dependencies import get_current_user

router = APIRouter(prefix="/posters", tags=["Posters"])


# ---------------------------------------------------------------------------
# Models (simple enough to keep inline)
# ---------------------------------------------------------------------------

class PosterCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    prompt_used: Optional[str] = None
    image_url: str = Field(..., description="URL of the generated poster image")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def serialize_poster(p: dict) -> dict:
    return {
        "id": str(p["_id"]),
        "business_id": p["business_id"],
        "title": p["title"],
        "prompt_used": p.get("prompt_used"),
        "image_url": p["image_url"],
        "created_at": p["created_at"],
    }


def get_poster_or_404(db, poster_id: str, business_id: str) -> dict:
    try:
        oid = ObjectId(poster_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid poster ID format.")
    poster = db["posters"].find_one({"_id": oid, "business_id": business_id})
    if not poster:
        raise HTTPException(status_code=404, detail="Poster not found.")
    return poster


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/")
def list_posters(current_user: dict = Depends(get_current_user)):
    db = get_database()
    posters = list(db["posters"].find({"business_id": current_user["business_id"]}))
    return [serialize_poster(p) for p in posters]


@router.get("/{poster_id}")
def get_poster(poster_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    poster = get_poster_or_404(db, poster_id, current_user["business_id"])
    return serialize_poster(poster)


@router.post("/", status_code=status.HTTP_201_CREATED)
def save_poster(
    data: PosterCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Save a generated poster to the business's library."""
    db = get_database()
    doc = {
        **data.dict(),
        "business_id": current_user["business_id"],
        "created_at": datetime.utcnow(),
    }
    result = db["posters"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_poster(doc)


@router.delete("/{poster_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_poster(poster_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        oid = ObjectId(poster_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid poster ID format.")

    result = db["posters"].delete_one({
        "_id": oid,
        "business_id": current_user["business_id"],
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Poster not found.")