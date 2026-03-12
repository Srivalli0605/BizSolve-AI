"""
models/product_model.py
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProductCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=300)
    image_url: Optional[str] = None


class ProductUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=300)
    image_url: Optional[str] = None


class ProductResponse(BaseModel):
    id: str
    business_id: str
    name: str
    description: Optional[str]
    image_url: Optional[str]
    created_at: datetime