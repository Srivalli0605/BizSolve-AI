"""
config.py
---------
Loads all environment variables from .env file.
Fails fast at startup if required variables are missing.
"""

from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10080))

# Fail fast — don't let the server boot with missing config
if not MONGO_URI:
    raise RuntimeError("Missing environment variable: MONGO_URI")
if not SECRET_KEY:
    raise RuntimeError("Missing environment variable: SECRET_KEY")