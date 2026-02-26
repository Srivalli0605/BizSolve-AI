"""
routes/chatlog_routes.py
------------------------
Chatbot log management endpoints:
  GET  /chatlogs/                    - List all chatlogs (optionally filter by customer_email)
  GET  /chatlogs/{id}                - Get a single chatlog entry
  POST /chatlogs/                    - Save a chatlog entry
  DELETE /chatlogs/{id}              - Delete a chatlog entry

NOTE: Actual AI chatbot response logic will be integrated separately.
      These endpoints handle storing and retrieving the chat history.
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

from database import get_database
from utils.dependencies import get_current_user

router = APIRouter(prefix="/chatlogs", tags=["Chatbot Logs"])


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class ChatlogCreateRequest(BaseModel):
    customer_email: Optional[EmailStr] = None
    message: str = Field(..., min_length=1)
    response: str = Field(..., min_length=1)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def serialize_chatlog(c: dict) -> dict:
    return {
        "id": str(c["_id"]),
        "business_id": c["business_id"],
        "customer_email": c.get("customer_email"),
        "message": c["message"],
        "response": c["response"],
        "timestamp": c["timestamp"],
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/")
def list_chatlogs(
    customer_email: Optional[str] = Query(None, description="Filter by customer email"),
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    query = {"business_id": current_user["business_id"]}
    if customer_email:
        query["customer_email"] = customer_email

    chatlogs = list(db["chatlogs"].find(query).sort("timestamp", -1))
    return [serialize_chatlog(c) for c in chatlogs]


@router.get("/{chatlog_id}")
def get_chatlog(chatlog_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        oid = ObjectId(chatlog_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid chatlog ID format.")

    chatlog = db["chatlogs"].find_one({"_id": oid, "business_id": current_user["business_id"]})
    if not chatlog:
        raise HTTPException(status_code=404, detail="Chatlog entry not found.")
    return serialize_chatlog(chatlog)


@router.post("/", status_code=status.HTTP_201_CREATED)
def save_chatlog(
    data: ChatlogCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Save a chatbot message + response to the log."""
    db = get_database()
    doc = {
        **data.dict(),
        "business_id": current_user["business_id"],
        "timestamp": datetime.utcnow(),
    }
    result = db["chatlogs"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_chatlog(doc)


@router.delete("/{chatlog_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chatlog(chatlog_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        oid = ObjectId(chatlog_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid chatlog ID format.")

    result = db["chatlogs"].delete_one({
        "_id": oid,
        "business_id": current_user["business_id"],
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chatlog entry not found.")