"""
models/asset_model.py
---------------------
Pydantic models for Brand Vault asset management.
Assets support a folder hierarchy (files, notes, images inside folders).

DB Schema (MongoDB assets collection):
{
  _id: ObjectId,
  business_id: str,
  name: str,
  type: "folder" | "note" | "file" | "image",
  parent_folder_id: str | None,   # None = root level
  content: str | None,            # Used for notes
  file_url: str | None,           # Used for files/images
  created_at: datetime,
  updated_at: datetime
}
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------

class AssetCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    type: Literal["folder", "note", "file", "image"]
    parent_folder_id: Optional[str] = None     # None means root level
    content: Optional[str] = None              # For notes
    file_url: Optional[str] = None             # For files/images


class AssetUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = None
    file_url: Optional[str] = None
    parent_folder_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Response Models
# ---------------------------------------------------------------------------

class AssetResponse(BaseModel):
    id: str
    business_id: str
    name: str
    type: str
    parent_folder_id: Optional[str]
    content: Optional[str]
    file_url: Optional[str]
    created_at: datetime
    updated_at: datetime