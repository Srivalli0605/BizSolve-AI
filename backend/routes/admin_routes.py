"""
routes/admin_routes.py
----------------------
Admin-only endpoints. All routes in this file require the "admin" role.

  GET /admin/analytics          - Platform-wide stats
  GET /admin/users              - List all users
  GET /admin/users/{id}         - Get a specific user
  DELETE /admin/users/{id}      - Delete a user and their business
"""

from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId

from database import get_database
from utils.dependencies import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def serialize_user(u: dict) -> dict:
    return {
        "id": str(u["_id"]),
        "name": u["name"],
        "email": u["email"],
        "role": u["role"],
        "business_id": u.get("business_id"),
        "created_at": u["created_at"],
    }


# ---------------------------------------------------------------------------
# Endpoints (all protected by require_admin)
# ---------------------------------------------------------------------------

@router.get("/analytics")
def platform_analytics(admin: dict = Depends(require_admin)):
    """
    Return platform-wide statistics.
    Only accessible by admin users.
    """
    db = get_database()

    return {
        "total_users": db["users"].count_documents({"role": "user"}),
        "total_businesses": db["businesses"].count_documents({}),
        "total_products": db["products"].count_documents({}),
        "total_websites": db["websites"].count_documents({}),
        "total_campaigns": db["campaigns"].count_documents({}),
        "total_posters": db["posters"].count_documents({}),
        "total_customers": db["customers"].count_documents({}),
        "total_chatlogs": db["chatlogs"].count_documents({}),
        "total_assets": db["assets"].count_documents({}),
    }


@router.get("/users")
def list_all_users(admin: dict = Depends(require_admin)):
    """List all registered users on the platform."""
    db = get_database()
    users = list(db["users"].find({}))
    return [serialize_user(u) for u in users]


@router.get("/users/{user_id}")
def get_user(user_id: str, admin: dict = Depends(require_admin)):
    """Get a specific user by ID."""
    db = get_database()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format.")

    user = db["users"].find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return serialize_user(user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: str, admin: dict = Depends(require_admin)):
    """
    Delete a user account and all associated business data.
    This is a destructive operation — use with caution.
    """
    db = get_database()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format.")

    user = db["users"].find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    business_id = user.get("business_id")

    # Delete all business-scoped data
    if business_id:
        for collection in ["businesses", "products", "websites", "campaigns", "posters", "customers", "chatlogs", "assets"]:
            db[collection].delete_many({"business_id": business_id})

    # Delete the user
    db["users"].delete_one({"_id": oid})