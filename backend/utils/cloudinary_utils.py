"""
utils/cloudinary_utils.py
--------------------------
Handles optional logo upload to Cloudinary.

Setup:
1. pip install cloudinary
2. Add to .env:
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
"""

import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

# Configure Cloudinary from environment variables
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)


def upload_logo(file_bytes: bytes, filename: str) -> str:
    """
    Upload a logo image to Cloudinary.

    Args:
        file_bytes: Raw bytes of the uploaded file
        filename: Original filename (used for public_id)

    Returns:
        str: The secure URL of the uploaded image

    Raises:
        Exception: If upload fails
    """
    # Strip extension from filename to use as public_id
    public_id = f"bizsolve/logos/{filename.rsplit('.', 1)[0]}"

    result = cloudinary.uploader.upload(
        file_bytes,
        public_id=public_id,
        overwrite=True,
        resource_type="image",
        transformation=[
            {"width": 500, "height": 500, "crop": "limit"},  # Max 500x500
            {"quality": "auto"},                               # Auto compress
            {"fetch_format": "auto"},                          # Auto format (webp etc)
        ]
    )

    return result["secure_url"]