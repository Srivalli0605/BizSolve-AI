"""
routes/chatlog_routes.py

Handles storing and retrieving founder AI chat history.
No AI logic here. Only database operations.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from bson import ObjectId

from database import get_database
from utils.dependencies import get_current_user

router = APIRouter(prefix="/chatlogs", tags=["Founder AI Logs"])


# -----------------------------
# Helper
# -----------------------------
def serialize_chatlog(c: dict) -> dict:
    return {
        "id": str(c["_id"]),
        "business_id": str(c["business_id"]),
        "user_email": c.get("user_email"),
        "message": c["message"],
        "response": c["response"],
        "timestamp": c["timestamp"],
    }


# -----------------------------
# Get All Logs
# -----------------------------
@router.get("/")
def list_chatlogs(current_user: dict = Depends(get_current_user)):
    db = get_database()

    business_id = current_user.get("business_id")

    chatlogs = list(
        db["chatlogs"]
        .find({"business_id": business_id})
        .sort("timestamp", -1)
    )

    return [serialize_chatlog(c) for c in chatlogs]


# -----------------------------
# Delete Log
# -----------------------------
@router.delete("/{chatlog_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chatlog(chatlog_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()

    try:
        oid = ObjectId(chatlog_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid chatlog ID.")

    result = db["chatlogs"].delete_one({
        "_id": oid,
        "business_id": current_user.get("business_id"),
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chatlog not found.")