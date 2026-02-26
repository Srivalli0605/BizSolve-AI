"""
routes/business_routes.py
--------------------------
Business profile endpoints (scoped to the authenticated user's business):
  GET   /business/me        - Get my business profile
  PATCH /business/me        - Update my business profile
  POST  /business/me/logo   - Upload business logo
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from bson import ObjectId

from database import get_database
from models.business_model import BusinessUpdateRequest, BusinessResponse
from utils.dependencies import get_current_user

router = APIRouter(prefix="/business", tags=["Business"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def serialize_business(b: dict) -> dict:
    """Convert MongoDB business document to JSON-safe dict."""
    return {
        "id": str(b["_id"]),
        "business_name": b.get("business_name"),
        "category": b.get("category"),
        "description": b.get("description"),
        "target_audience": b.get("target_audience"),
        "primary_goal": b.get("primary_goal"),
        "brand_tone": b.get("brand_tone"),
        "offerings": b.get("offerings"),
        "location": b.get("location"),
        "brand_colors": b.get("brand_colors", []),
        "preferred_style": b.get("preferred_style"),
        "logo_url": b.get("logo_url"),
        "created_at": b["created_at"],
    }


def get_business_or_404(db, business_id: str) -> dict:
    """Fetch a business by ID or raise 404."""
    business = db["businesses"].find_one({"_id": ObjectId(business_id)})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found.")
    return business


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/me", response_model=BusinessResponse)
def get_my_business(current_user: dict = Depends(get_current_user)):
    """Get the authenticated user's business profile."""
    db = get_database()
    business = get_business_or_404(db, current_user["business_id"])
    return serialize_business(business)


@router.patch("/me", response_model=BusinessResponse)
def update_my_business(
    data: BusinessUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Partially update the authenticated user's business profile."""
    db = get_database()

    update_fields = {k: v for k, v in data.dict().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided to update.")

    db["businesses"].update_one(
        {"_id": ObjectId(current_user["business_id"])},
        {"$set": update_fields},
    )

    business = get_business_or_404(db, current_user["business_id"])
    return serialize_business(business)


@router.post("/me/logo")
async def upload_logo(
    logo: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload a logo image for the authenticated user's business.
    Accepts: jpg, jpeg, png, webp, svg
    The logo is uploaded to Cloudinary and the URL is saved to the business document.
    """

    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"]
    if logo.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{logo.content_type}'. Allowed: jpg, png, webp, svg"
        )

    # Read file bytes
    file_bytes = await logo.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Upload to Cloudinary
    try:
        from utils.cloudinary_utils import upload_logo as cloudinary_upload
        logo_url = cloudinary_upload(file_bytes, logo.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logo upload failed: {str(e)}")

    # Save logo URL to business document
    db = get_database()
    db["businesses"].update_one(
        {"_id": ObjectId(current_user["business_id"])},
        {"$set": {"logo_url": logo_url}},
    )

    return {
        "message": "Logo uploaded successfully.",
        "logo_url": logo_url,
    }