"""
routes/website_routes.py
------------------------
  POST /generate-website         - Generate website via Gemini + deploy to Vercel
  GET  /public-website/{id}      - Serve website publicly (no auth)
  GET  /websites/                - Get user's website
  DELETE /generate-website/reset - Reset for regeneration
"""

from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List

from database import get_database
from utils.dependencies import get_current_user
from utils.gemini_utils_website import generate_website_content

router = APIRouter(tags=["Website"])


class GenerateWebsiteRequest(BaseModel):
    tagline:               Optional[str]       = None
    website_goal:          Optional[str]       = None
    current_offers:        Optional[str]       = None
    festival_promotion:    Optional[str]       = None
    promo_code:            Optional[str]       = None
    sections:              Optional[List[str]] = None
    extra_notes:           Optional[str]       = None
    image_source:          Optional[str]       = "auto"
    selected_product_ids:  Optional[List[str]] = None
    brand_colors_override: Optional[List[str]] = None  # ← from palette picker


@router.post("/generate-website")
def generate_website(
    data: GenerateWebsiteRequest,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    business_id = current_user.get("business_id")

    if not business_id:
        raise HTTPException(status_code=400, detail="No business linked to this account.")

    # Check if website already exists
    existing = db["websites"].find_one({"business_id": ObjectId(business_id)})
    if existing:
        return {
            "message": "Website already exists.",
            "website_id": str(existing["_id"]),
            "content_json": existing.get("content_json", {}),
            "published_url": existing.get("published_url", ""),
            "status": existing.get("status", "generated"),
        }

    # Fetch business from DB
    business = db["businesses"].find_one({"_id": ObjectId(business_id)})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found.")

    # ── Resolve brand colors ──────────────────────────────────────────────
    if data.brand_colors_override:
        brand_colors = data.brand_colors_override
        print(f"[Website] Using palette override: {brand_colors}")
    else:
        brand_colors = business.get("brand_colors", [])
        print(f"[Website] Using business colors: {brand_colors}")

    # ── Fetch user products if image_source is "products" ─────────────────
    user_products = None
    if data.image_source == "products" and data.selected_product_ids:
        try:
            product_ids = [ObjectId(pid) for pid in data.selected_product_ids]
            fetched = list(db["products"].find({
                "_id": {"$in": product_ids},
                "business_id": current_user["business_id"],
            }))
            # Preserve selection order
            id_order = {str(p["_id"]): i for i, p in enumerate(fetched)}
            fetched.sort(key=lambda p: data.selected_product_ids.index(str(p["_id"])) if str(p["_id"]) in data.selected_product_ids else 999)
            print(f"[Products] selected={len(data.selected_product_ids)}, fetched={len(fetched)}")
            user_products = [
                {
                    "name":        p.get("name", ""),
                    "description": p.get("description", ""),
                    "image_url":   p.get("image_url", ""),
                }
                for p in fetched
            ] if fetched else None
        except Exception as e:
            print(f"[Products] fetch failed: {e}")
            user_products = None

    # ── Generate content via Gemini ───────────────────────────────────────
    try:
        content_json = generate_website_content(
            business=business,
            tagline=data.tagline,
            website_goal=data.website_goal,
            current_offers=data.current_offers,
            festival_promotion=data.festival_promotion,
            promo_code=data.promo_code,
            sections=data.sections,
            extra_notes=data.extra_notes,
            user_products=user_products,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    # ── Deploy to Vercel ──────────────────────────────────────────────────
    published_url       = ""
    vercel_project_name = ""
    try:
        from utils.vercel_utils import deploy_to_vercel
        branding = {
            "business_name": business.get("business_name", ""),
            "logo_url":      business.get("logo_url", ""),
            "brand_colors":  brand_colors,  # ← uses override or business default
        }
        vercel_result       = deploy_to_vercel(business.get("business_name", "bizsolve"), content_json, branding)
        published_url       = vercel_result.get("url", "")
        vercel_project_name = vercel_result.get("project_name", "")
        print(f"[Vercel] ✅ published_url = {published_url}")
    except Exception as e:
        import traceback
        print(f"[Vercel] ❌ FAILED: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Vercel deployment failed: {str(e)}")

    # ── Save to MongoDB ───────────────────────────────────────────────────
    website_doc = {
        "user_id":             current_user["_id"],
        "business_id":         ObjectId(business_id),
        "template_type":       "template_1",
        "content_json":        content_json,
        "published_url":       published_url,
        "vercel_project_name": vercel_project_name,
        "brand_colors_used":   brand_colors,
        "status":              "published" if published_url else "generated",
        "created_at":          datetime.utcnow(),
        "updated_at":          datetime.utcnow(),
    }
    result     = db["websites"].insert_one(website_doc)
    website_id = str(result.inserted_id)

    return {
        "message":       "Website generated successfully.",
        "website_id":    website_id,
        "content_json":  content_json,
        "published_url": published_url,
        "status":        "published" if published_url else "generated",
    }


@router.get("/websites/")
def get_my_website(current_user: dict = Depends(get_current_user)):
    db = get_database()
    business_id = current_user.get("business_id")
    website = db["websites"].find_one({"business_id": ObjectId(business_id)})
    if not website:
        return {"website": None}
    return {
        "website": {
            "id":                  str(website["_id"]),
            "status":              website.get("status"),
            "published_url":       website.get("published_url", ""),
            "template_type":       website.get("template_type"),
            "brand_colors_used":   website.get("brand_colors_used", []),
            "created_at":          website.get("created_at"),
            "updated_at":          website.get("updated_at"),
        }
    }


@router.get("/public-website/{website_id}")
def get_public_website(website_id: str):
    db = get_database()
    try:
        website = db["websites"].find_one({"_id": ObjectId(website_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid website ID.")
    if not website:
        raise HTTPException(status_code=404, detail="Website not found.")

    business = db["businesses"].find_one({"_id": website["business_id"]})
    return {
        "website_id":    website_id,
        "content_json":  website.get("content_json", {}),
        "template_type": website.get("template_type", "template_1"),
        "branding": {
            "business_name": business.get("business_name") if business else "",
            "logo_url":      business.get("logo_url") if business else None,
            # Use the colors that were actually used when generating
            "brand_colors":  website.get("brand_colors_used") or (business.get("brand_colors", []) if business else []),
        },
        "status":     website.get("status"),
        "updated_at": website.get("updated_at"),
    }


@router.delete("/generate-website/reset")
def reset_website(current_user: dict = Depends(get_current_user)):
    db = get_database()
    business_id = current_user.get("business_id")
    db["websites"].delete_one({"business_id": ObjectId(business_id)})
    return {"message": "Reset successful."}