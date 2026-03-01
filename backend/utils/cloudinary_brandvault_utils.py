"""
utils/cloudinary_brandvault_utils.py
--------------------------------------
Cloudinary helpers specifically for BrandVault.
Handles logo uploads, media asset uploads, and deletions.

Does NOT touch the existing upload_logo() in cloudinary_utils.py.
"""

import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)


def upload_to_cloudinary(
    file_bytes: bytes,
    folder: str = "bizsolve/brandvault",
    resource_type: str = "image",
) -> dict:
    """
    Upload raw bytes to Cloudinary.
    Returns full Cloudinary response dict (secure_url, public_id, etc.)
    """
    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            folder=folder,
            resource_type=resource_type,
        )
        return result
    except Exception as e:
        raise RuntimeError(f"Cloudinary upload error: {str(e)}")


def delete_from_cloudinary(
    public_id: str,
    resource_type: str = "image",
) -> dict:
    """
    Delete an asset from Cloudinary by public_id.
    Called when user deletes a media asset from BrandVault.
    """
    try:
        result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        return result
    except Exception as e:
        raise RuntimeError(f"Cloudinary delete error: {str(e)}")