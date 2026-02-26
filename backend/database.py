"""
database.py
-----------
Manages the MongoDB connection using pymongo.
Provides a single reusable get_database() function.
Indexes are created once on first connection.
"""

from pymongo import MongoClient, ASCENDING
from config import MONGO_URI

# Module-level singletons — connection is reused across requests
_client = None
_db = None


def get_database():
    """
    Returns the MongoDB database instance.
    Initializes the connection and creates indexes on first call.
    """
    global _client, _db

    if _db is None:
        _client = MongoClient(MONGO_URI)
        _db = _client["bizsolve"]
        _create_indexes(_db)

    return _db


def _create_indexes(db):
    """
    Creates all necessary indexes for performance and data integrity.
    Called once at startup.
    """
    # Unique index on users.email — prevents duplicate accounts
    db["users"].create_index([("email", ASCENDING)], unique=True)

    # Index business_id across all business-scoped collections
    collections_with_business_id = [
        "websites",
        "products",
        "posters",
        "campaigns",
        "customers",
        "chatlogs",
        "assets",
    ]
    for collection in collections_with_business_id:
        db[collection].create_index([("business_id", ASCENDING)])