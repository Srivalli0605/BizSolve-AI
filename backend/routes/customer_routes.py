from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from bson import ObjectId

from database import get_database
from utils.dependencies import get_current_user

router = APIRouter(prefix="/customers", tags=["Customers"])


class CustomerCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr


def serialize_customer(c: dict) -> dict:
    return {
        "id": str(c["_id"]),
        "business_id": c["business_id"],
        "name": c["name"],
        "email": c["email"],
        "created_at": c["created_at"],
    }


@router.get("/")
def list_customers(current_user: dict = Depends(get_current_user)):
    db = get_database()
    customers = list(db["customers"].find({"business_id": current_user["business_id"]}))
    return [serialize_customer(c) for c in customers]


@router.get("/{customer_id}")
def get_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        oid = ObjectId(customer_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid customer ID format.")
    customer = db["customers"].find_one({"_id": oid, "business_id": current_user["business_id"]})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")
    return serialize_customer(customer)


@router.post("/", status_code=status.HTTP_201_CREATED)
def add_customer(data: CustomerCreateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    existing = db["customers"].find_one({
        "email": data.email,
        "business_id": current_user["business_id"],
    })
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Customer already exists.")
    doc = {
        **data.dict(),
        "business_id": current_user["business_id"],
        "created_at": datetime.utcnow(),
    }
    result = db["customers"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_customer(doc)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        oid = ObjectId(customer_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid customer ID format.")
    result = db["customers"].delete_one({"_id": oid, "business_id": current_user["business_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found.")