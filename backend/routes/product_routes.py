"""
routes/product_routes.py
------------------------
  GET    /products/             - List all products
  POST   /products/             - Create product
  POST   /products/upload-image - Upload product image to Cloudinary
  PATCH  /products/{id}         - Update product
  DELETE /products/{id}         - Delete product
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, status
from datetime import datetime
from bson import ObjectId

from database import get_database
from models.product_model import ProductCreateRequest, ProductUpdateRequest, ProductResponse
from utils.dependencies import get_current_user

router = APIRouter(prefix="/products", tags=["Products"])


def serialize(p: dict) -> dict:
    return {
        "id": str(p["_id"]),
        "business_id": p["business_id"],
        "name": p["name"],
        "description": p.get("description"),
        "image_url": p.get("image_url"),
        "created_at": p["created_at"],
    }


def get_or_404(db, product_id: str, business_id: str) -> dict:
    try:
        oid = ObjectId(product_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product ID.")
    p = db["products"].find_one({"_id": oid, "business_id": business_id})
    if not p:
        raise HTTPException(status_code=404, detail="Product not found.")
    return p


# ── Upload image to Cloudinary ────────────────────────────────────────────────
@router.post("/upload-image")
async def upload_product_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP, GIF allowed.")

    try:
        file_bytes = await file.read()
        print(f"[Upload] File received: {file.filename}, size: {len(file_bytes)} bytes")  # ← ADD
        from utils.cloudinary_utils import upload_product_image as cloudinary_upload
        image_url = cloudinary_upload(file_bytes, file.filename)
        print(f"[Upload] Cloudinary URL: {image_url}")  # ← ADD
    except Exception as e:
        print(f"[Upload] ERROR: {e}")  # ← ADD
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

    return {"image_url": image_url}


# ── CRUD ──────────────────────────────────────────────────────────────────────
@router.get("/", response_model=list[ProductResponse])
def list_products(current_user: dict = Depends(get_current_user)):
    db = get_database()
    products = list(db["products"].find(
        {"business_id": current_user["business_id"]},
        sort=[("created_at", -1)]
    ))
    return [serialize(p) for p in products]


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(data: ProductCreateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    doc = {
        **data.dict(),
        "business_id": current_user["business_id"],
        "created_at": datetime.utcnow(),
    }
    result = db["products"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize(doc)


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(product_id: str, data: ProductUpdateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    get_or_404(db, product_id, current_user["business_id"])
    fields = {k: v for k, v in data.dict().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update.")
    db["products"].update_one({"_id": ObjectId(product_id)}, {"$set": fields})
    return serialize(get_or_404(db, product_id, current_user["business_id"]))


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    result = db["products"].delete_one({
        "_id": ObjectId(product_id),
        "business_id": current_user["business_id"],
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found.")