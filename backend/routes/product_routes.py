"""
routes/product_routes.py
------------------------
Product management endpoints (scoped to the authenticated user's business):
  GET    /products/          - List all products
  GET    /products/{id}      - Get a single product
  POST   /products/          - Create a product
  PATCH  /products/{id}      - Update a product
  DELETE /products/{id}      - Delete a product
"""

from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from bson import ObjectId

from database import get_database
from models.product_model import ProductCreateRequest, ProductUpdateRequest, ProductResponse
from utils.dependencies import get_current_user

router = APIRouter(prefix="/products", tags=["Products"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def serialize_product(p: dict) -> dict:
    """Convert MongoDB product document to JSON-safe dict."""
    return {
        "id": str(p["_id"]),
        "business_id": p["business_id"],
        "name": p["name"],
        "description": p.get("description"),
        "price": p["price"],
        "image_url": p.get("image_url"),
        "created_at": p["created_at"],
    }


def get_product_or_404(db, product_id: str, business_id: str) -> dict:
    """
    Fetch a product by ID, scoped to the user's business.
    Raises 404 if not found or doesn't belong to this business.
    """
    try:
        oid = ObjectId(product_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product ID format.")

    product = db["products"].find_one({"_id": oid, "business_id": business_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    return product


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[ProductResponse])
def list_products(current_user: dict = Depends(get_current_user)):
    """List all products for the authenticated user's business."""
    db = get_database()
    products = list(db["products"].find({"business_id": current_user["business_id"]}))
    return [serialize_product(p) for p in products]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single product by ID."""
    db = get_database()
    product = get_product_or_404(db, product_id, current_user["business_id"])
    return serialize_product(product)


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new product for the authenticated user's business."""
    db = get_database()

    doc = {
        **data.dict(),
        "business_id": current_user["business_id"],
        "created_at": datetime.utcnow(),
    }
    result = db["products"].insert_one(doc)
    doc["_id"] = result.inserted_id

    return serialize_product(doc)


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    data: ProductUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Partially update a product. Only provided fields are updated."""
    db = get_database()

    # Verify ownership
    get_product_or_404(db, product_id, current_user["business_id"])

    update_fields = {k: v for k, v in data.dict().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided to update.")

    db["products"].update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_fields},
    )

    updated = get_product_or_404(db, product_id, current_user["business_id"])
    return serialize_product(updated)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a product. Returns 204 on success."""
    db = get_database()

    try:
        oid = ObjectId(product_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product ID format.")

    result = db["products"].delete_one({
        "_id": oid,
        "business_id": current_user["business_id"],  # Scoped to owner only
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found.")