"""
routes/chat_routes.py

Founder AI Assistant
POST /chat/
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId

from database import get_database
from utils.dependencies import get_current_user
from utils.gemini_utils_chatbot import generate_chat_response

router = APIRouter(prefix="/chat", tags=["Founder AI Assistant"])


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)


def build_prompt(business: dict, user_message: str, conversation_history: str) -> str:
    return f"""You are a sharp, experienced business advisor helping a founder grow their business.

RESPONSE RULES — FOLLOW STRICTLY:
- Maximum 150 words. No exceptions.
- Be direct and specific — no fluff, no filler
- Give 2-4 concrete action points maximum
- Use bullet points or numbered steps for actions
- Complete every sentence — never trail off mid-thought
- Tailor advice to THIS specific business only

========================
BUSINESS PROFILE
========================
Business Name: {business.get("business_name", "N/A")}
Category: {business.get("category", "N/A")}
Description: {business.get("description", "N/A")}
Target Audience: {business.get("target_audience", "N/A")}
Offerings: {business.get("offerings", "N/A")}
Location: {business.get("location", "N/A")}
Primary Goal: {business.get("primary_goal", "N/A")}
Brand Tone: {business.get("brand_tone", "N/A")}

========================
RECENT CONVERSATION
========================
{conversation_history if conversation_history.strip() else "No prior context."}

========================
FOUNDER'S QUESTION
========================
{user_message}

========================
YOUR RESPONSE (max 150 words, fully complete)
========================"""


@router.post("/")
def chat(body: ChatRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()

    business_id = current_user.get("business_id")
    if not business_id:
        raise HTTPException(status_code=404, detail="No business linked to this account.")

    try:
        business = db["businesses"].find_one({"_id": ObjectId(business_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid business ID.")

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business profile not found. Please set up your business first."
        )

    recent_chats = list(
        db["chatlogs"]
        .find({"business_id": business_id})
        .sort("timestamp", -1)
        .limit(5)
    )
    recent_chats.reverse()

    conversation_history = ""
    for chat_log in recent_chats:
        conversation_history += f"Founder: {chat_log.get('message')}\nAdvisor: {chat_log.get('response')}\n\n"

    prompt = build_prompt(business, body.message.strip(), conversation_history)

    try:
        response_text = generate_chat_response(prompt)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    db["chatlogs"].insert_one({
        "business_id": business_id,
        "user_email": current_user.get("email"),
        "message": body.message.strip(),
        "response": response_text,
        "timestamp": datetime.utcnow(),
    })

    return {"response": response_text}