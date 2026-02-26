"""
models/product_model.py
-----------------------
Pydantic models for product management.

DB Schema (MongoDB products collection):
{
  _id: ObjectId,
  business_id: str,
  name: str,
  description: str,
  price: float,
  image_url: str,
  created_at: datetime
}
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------

class ProductCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    price: float = Field(..., ge=0)      # ge=0 means price >= 0
    image_url: Optional[str] = None


class ProductUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    image_url: Optional[str] = None


# ---------------------------------------------------------------------------
# Response Models
# ---------------------------------------------------------------------------

class ProductResponse(BaseModel):
    id: str
    business_id: str
    name: str
    description: Optional[str]
    price: float
    image_url: Optional[str]
    created_at: datetime