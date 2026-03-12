"""
utils/cloudinary_utils.py
--------------------------
Handles image uploads to Cloudinary using direct HTTP (no SDK hanging issues).
"""

import os
import uuid
import hashlib
import time
import requests
from dotenv import load_dotenv

load_dotenv()


def _get_config():
    return {
        "cloud_name": os.getenv("CLOUDINARY_CLOUD_NAME"),
        "api_key": os.getenv("CLOUDINARY_API_KEY"),
        "api_secret": os.getenv("CLOUDINARY_API_SECRET"),
    }


def _upload(file_bytes: bytes, public_id: str) -> str:
    """
    Upload image to Cloudinary using direct HTTP POST.
    Avoids SDK hanging issues by using requests with explicit timeout.
    """
    config = _get_config()
    cloud_name = config["cloud_name"]
    api_key = config["api_key"]
    api_secret = config["api_secret"]

    if not all([cloud_name, api_key, api_secret]):
        raise ValueError("Cloudinary credentials missing in .env")

    # Generate signature
    timestamp = str(int(time.time()))
    signature_str = f"public_id={public_id}&timestamp={timestamp}{api_secret}"
    signature = hashlib.sha1(signature_str.encode()).hexdigest()

    url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"

    response = requests.post(
        url,
        data={
            "api_key": api_key,
            "timestamp": timestamp,
            "public_id": public_id,
            "signature": signature,
        },
        files={"file": ("upload.jpg", file_bytes, "image/jpeg")},
        timeout=20,
    )

    if response.status_code != 200:
        raise Exception(f"Cloudinary upload failed: {response.status_code} — {response.text}")

    return response.json()["secure_url"]


def upload_logo(file_bytes: bytes, filename: str) -> str:
    """Upload a logo image to Cloudinary."""
    name = filename.rsplit(".", 1)[0]
    public_id = f"bizsolve/logos/{name}"
    return _upload(file_bytes, public_id)


def upload_product_image(file_bytes: bytes, filename: str) -> str:
    """Upload a product image to Cloudinary."""
    public_id = f"bizsolve/products/{uuid.uuid4().hex}"
    return _upload(file_bytes, public_id)