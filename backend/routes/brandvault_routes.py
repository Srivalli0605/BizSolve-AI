"""
routes/brandvault_routes.py

BrandVault — Digital Brand Locker
Handles brand identity, media assets, content bank, contact info.
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

from database import get_database
from utils.dependencies import get_current_user
from utils.cloudinary_brandvault_utils import upload_to_cloudinary, delete_from_cloudinary

router = APIRouter(prefix="/brandvault", tags=["Brand Vault"])


# ─────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────

def serialize_vault(v: dict) -> dict:
    return {
        "id":                  str(v["_id"]),
        "business_id":         str(v["business_id"]),
        "logo_url":            v.get("logo_url"),
        "alternate_logo_url":  v.get("alternate_logo_url"),
        "brand_colors":        v.get("brand_colors", {"primary": "", "secondary": ""}),
        "brand_fonts":         v.get("brand_fonts", ""),
        "brand_tone":          v.get("brand_tone", ""),
        "tagline":             v.get("tagline", ""),
        "mission_statement":   v.get("mission_statement", ""),
        "vision_statement":    v.get("vision_statement", ""),
        "short_description":   v.get("short_description", ""),
        "long_description":    v.get("long_description", ""),
        "contact_info":        v.get("contact_info", {}),
        "created_at":          v.get("created_at"),
        "updated_at":          v.get("updated_at"),
    }


def serialize_asset(a: dict) -> dict:
    return {
        "id":          str(a["_id"]),
        "business_id": str(a["business_id"]),
        "file_url":    a.get("file_url"),
        "file_type":   a.get("file_type"),
        "public_id":   a.get("public_id"),
        "category":    a.get("category", "general"),
        "tags":        a.get("tags", []),
        "uploaded_at": a.get("uploaded_at"),
    }


def serialize_content(c: dict) -> dict:
    return {
        "id":           str(c["_id"]),
        "business_id":  str(c["business_id"]),
        "content_type": c.get("content_type"),
        "content_text": c.get("content_text"),
        "created_at":   c.get("created_at"),
        "updated_at":   c.get("updated_at"),
    }


def get_business_id(current_user: dict) -> str:
    bid = current_user.get("business_id")
    if not bid:
        raise HTTPException(status_code=404, detail="No business linked to this account.")
    return bid


def compute_brand_score(vault: dict, asset_count: int, content_count: int) -> dict:
    score = 0
    breakdown = []

    if vault.get("logo_url"):
        score += 20
        breakdown.append({"label": "Logo uploaded", "points": 20, "done": True})
    else:
        breakdown.append({"label": "Upload your logo", "points": 20, "done": False})

    colors = vault.get("brand_colors", {})
    if colors.get("primary") or colors.get("secondary"):
        score += 15
        breakdown.append({"label": "Brand colors set", "points": 15, "done": True})
    else:
        breakdown.append({"label": "Set brand colors", "points": 15, "done": False})

    if vault.get("short_description") or vault.get("long_description"):
        score += 15
        breakdown.append({"label": "Brand description filled", "points": 15, "done": True})
    else:
        breakdown.append({"label": "Add brand description", "points": 15, "done": False})

    contact = vault.get("contact_info", {})
    if contact.get("phone") or contact.get("email"):
        score += 15
        breakdown.append({"label": "Contact info added", "points": 15, "done": True})
    else:
        breakdown.append({"label": "Add contact info", "points": 15, "done": False})

    if asset_count >= 3:
        score += 15
        breakdown.append({"label": "3+ media assets uploaded", "points": 15, "done": True})
    else:
        breakdown.append({"label": f"Upload media assets ({asset_count}/3)", "points": 15, "done": False})

    if content_count > 0:
        score += 20
        breakdown.append({"label": "Content bank populated", "points": 20, "done": True})
    else:
        breakdown.append({"label": "Add content to content bank", "points": 20, "done": False})

    return {"score": score, "breakdown": breakdown}


# ─────────────────────────────────────────
# MODELS
# ─────────────────────────────────────────

class BrandColors(BaseModel):
    primary:   Optional[str] = ""
    secondary: Optional[str] = ""

class ContactInfo(BaseModel):
    phone:     Optional[str] = ""
    whatsapp:  Optional[str] = ""
    email:     Optional[str] = ""
    address:   Optional[str] = ""
    instagram: Optional[str] = ""
    facebook:  Optional[str] = ""
    maps_link: Optional[str] = ""
    website:   Optional[str] = ""

class VaultUpdateRequest(BaseModel):
    brand_colors:       Optional[BrandColors] = None
    brand_fonts:        Optional[str] = ""
    brand_tone:         Optional[str] = ""
    tagline:            Optional[str] = ""
    mission_statement:  Optional[str] = ""
    vision_statement:   Optional[str] = ""
    short_description:  Optional[str] = ""
    long_description:   Optional[str] = ""
    contact_info:       Optional[ContactInfo] = None

class ContentRequest(BaseModel):
    content_type: str = Field(..., min_length=1)
    content_text: str = Field(..., min_length=1)

class ContentUpdateRequest(BaseModel):
    content_text: str = Field(..., min_length=1)


# ─────────────────────────────────────────
# BRAND IDENTITY ROUTES
# ─────────────────────────────────────────

@router.get("/")
def get_vault(current_user: dict = Depends(get_current_user)):
    db = get_database()
    bid = get_business_id(current_user)

    vault = db["brandvault"].find_one({"business_id": bid})

    if not vault:
        # Create empty vault on first access
        now = datetime.utcnow()
        new_vault = {
            "business_id":        bid,
            "logo_url":           None,
            "alternate_logo_url": None,
            "brand_colors":       {"primary": "", "secondary": ""},
            "brand_fonts":        "",
            "brand_tone":         "",
            "tagline":            "",
            "mission_statement":  "",
            "vision_statement":   "",
            "short_description":  "",
            "long_description":   "",
            "contact_info":       {},
            "created_at":         now,
            "updated_at":         now,
        }
        result = db["brandvault"].insert_one(new_vault)
        new_vault["_id"] = result.inserted_id
        vault = new_vault

    asset_count   = db["brand_assets"].count_documents({"business_id": bid})
    content_count = db["brand_content"].count_documents({"business_id": bid})
    score_data    = compute_brand_score(vault, asset_count, content_count)

    return {**serialize_vault(vault), "brand_score": score_data}


@router.put("/")
def update_vault(body: VaultUpdateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    bid = get_business_id(current_user)

    update_data = {"updated_at": datetime.utcnow()}

    if body.brand_colors is not None:
        update_data["brand_colors"] = body.brand_colors.dict()
    if body.contact_info is not None:
        update_data["contact_info"] = body.contact_info.dict()
    for field in ["brand_fonts", "brand_tone", "tagline", "mission_statement",
                  "vision_statement", "short_description", "long_description"]:
        val = getattr(body, field, None)
        if val is not None:
            update_data[field] = val

    result = db["brandvault"].update_one(
        {"business_id": bid},
        {"$set": update_data},
        upsert=True,
    )

    vault = db["brandvault"].find_one({"business_id": bid})
    return serialize_vault(vault)


# ─────────────────────────────────────────
# LOGO UPLOAD
# ─────────────────────────────────────────

@router.post("/logo")
async def upload_logo(
    file: UploadFile = File(...),
    is_alternate: bool = Form(False),
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    bid = get_business_id(current_user)

    allowed = {"image/jpeg", "image/png", "image/webp", "image/svg+xml"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WEBP, SVG allowed.")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB.")

    try:
        result = upload_to_cloudinary(contents, folder=f"brandvault/{bid}/logos")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    field = "alternate_logo_url" if is_alternate else "logo_url"
    db["brandvault"].update_one(
        {"business_id": bid},
        {"$set": {field: result["secure_url"], "updated_at": datetime.utcnow()}},
        upsert=True,
    )

    return {"url": result["secure_url"], "field": field}


# ─────────────────────────────────────────
# MEDIA ASSETS ROUTES
# ─────────────────────────────────────────

VALID_CATEGORIES = {"product", "team", "banner", "campaign", "store", "general"}

@router.get("/media")
def list_media(
    category: Optional[str] = None,
    page: int = 1,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    bid = get_business_id(current_user)

    query = {"business_id": bid}
    if category and category in VALID_CATEGORIES:
        query["category"] = category

    skip  = (page - 1) * 20
    total = db["brand_assets"].count_documents(query)
    assets = list(
        db["brand_assets"]
        .find(query)
        .sort("uploaded_at", -1)
        .skip(skip)
        .limit(20)
    )

    return {
        "assets": [serialize_asset(a) for a in assets],
        "total":  total,
        "page":   page,
        "pages":  (total + 19) // 20,
    }


@router.post("/media", status_code=status.HTTP_201_CREATED)
async def upload_media(
    file:     UploadFile = File(...),
    category: str        = Form("general"),
    tags:     str        = Form(""),        # comma-separated
    current_user: dict   = Depends(get_current_user),
):
    db = get_database()
    bid = get_business_id(current_user)

    if category not in VALID_CATEGORIES:
        category = "general"

    allowed_types = {
        "image/jpeg", "image/png", "image/webp", "image/gif",
        "video/mp4", "video/quicktime",
    }
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    contents = await file.read()
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 20MB.")

    resource_type = "video" if file.content_type.startswith("video") else "image"

    try:
        result = upload_to_cloudinary(
            contents,
            folder=f"brandvault/{bid}/media",
            resource_type=resource_type,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []

    asset_doc = {
        "business_id": bid,
        "file_url":    result["secure_url"],
        "public_id":   result.get("public_id"),
        "file_type":   file.content_type,
        "category":    category,
        "tags":        tag_list,
        "uploaded_at": datetime.utcnow(),
    }

    inserted = db["brand_assets"].insert_one(asset_doc)
    asset_doc["_id"] = inserted.inserted_id

    return serialize_asset(asset_doc)


@router.delete("/media/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media(asset_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    bid = get_business_id(current_user)

    try:
        oid = ObjectId(asset_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid asset ID.")

    asset = db["brand_assets"].find_one({"_id": oid, "business_id": bid})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found.")

    # Delete from Cloudinary
    if asset.get("public_id"):
        try:
            resource_type = "video" if asset.get("file_type", "").startswith("video") else "image"
            delete_from_cloudinary(asset["public_id"], resource_type=resource_type)
        except Exception:
            pass  # Don't block deletion if Cloudinary fails

    db["brand_assets"].delete_one({"_id": oid, "business_id": bid})


# ─────────────────────────────────────────
# CONTENT BANK ROUTES
# ─────────────────────────────────────────

VALID_CONTENT_TYPES = {
    "about_us", "instagram_bio", "whatsapp_message",
    "elevator_pitch", "product_description", "sales_pitch", "cta_phrase", "other"
}

@router.get("/content")
def list_content(current_user: dict = Depends(get_current_user)):
    db = get_database()
    bid = get_business_id(current_user)

    items = list(
        db["brand_content"]
        .find({"business_id": bid})
        .sort("created_at", -1)
    )

    return [serialize_content(c) for c in items]


@router.post("/content", status_code=status.HTTP_201_CREATED)
def add_content(body: ContentRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    bid = get_business_id(current_user)

    content_type = body.content_type if body.content_type in VALID_CONTENT_TYPES else "other"

    now = datetime.utcnow()
    doc = {
        "business_id":  bid,
        "content_type": content_type,
        "content_text": body.content_text.strip(),
        "created_at":   now,
        "updated_at":   now,
    }

    inserted = db["brand_content"].insert_one(doc)
    doc["_id"] = inserted.inserted_id

    return serialize_content(doc)


@router.put("/content/{content_id}")
def update_content(
    content_id: str,
    body: ContentUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    bid = get_business_id(current_user)

    try:
        oid = ObjectId(content_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid content ID.")

    result = db["brand_content"].update_one(
        {"_id": oid, "business_id": bid},
        {"$set": {"content_text": body.content_text.strip(), "updated_at": datetime.utcnow()}},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Content not found.")

    doc = db["brand_content"].find_one({"_id": oid})
    return serialize_content(doc)


@router.delete("/content/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_content(content_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    bid = get_business_id(current_user)

    try:
        oid = ObjectId(content_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid content ID.")

    result = db["brand_content"].delete_one({"_id": oid, "business_id": bid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Content not found.")