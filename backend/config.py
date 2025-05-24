# backend/config.py
from dotenv import load_dotenv
import os
from pymongo import MongoClient

load_dotenv()  # loads .env

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI not set in .env")

# Create a client and expose a helper to get the DB
_client = MongoClient(MONGODB_URI)

def get_db():
    # This returns the default database you specified in the URI
    return _client.get_default_database()
