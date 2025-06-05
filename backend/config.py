# backend/config.py

from dotenv import load_dotenv
import os
from pymongo import MongoClient
from datetime import timedelta

load_dotenv()  # loads variables from your .env

# ————————————————
# Flask Core
# ————————————————
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY not set in environment")

# ————————————————
# MongoDB
# ————————————————
MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI not set in .env")

_client = MongoClient(MONGODB_URI)
def get_db():
    return _client.get_default_database()

# ————————————————
# Flask-JWT-Extended
# ————————————————
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY not set in environment")
# How long access tokens last
JWT_ACCESS_TOKEN_EXPIRES = timedelta(
    seconds=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 3600))
)
# Store tokens in headers and cookies
JWT_TOKEN_LOCATION = ["headers", "cookies"]
JWT_COOKIE_SECURE = False       # Set to True in production (HTTPS)
JWT_COOKIE_CSRF_PROTECT = True

# ————————————————
# Flask-Session (server-side sessions)
# ————————————————
SESSION_TYPE = "filesystem"
SESSION_PERMANENT = False
SESSION_USE_SIGNER = True
SESSION_FILE_DIR = os.getenv("SESSION_FILE_DIR", "./.flask_session/")
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"

# ————————————————
# Flask-Mail (for password reset / email verification)
# ————————————————
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.example.com")
MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "True").lower() in ("true", "1", "yes")
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", "noreply@example.com")

# Base URL of the frontend (used for password reset links)
FRONTEND_URL = os.getenv("FRONTEND_URL")

# ————————————————
# File Uploads (Profile Photos)
# ————————————————
# Base directory of the project
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Directory where profile photos will be stored
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads", "profile_photos")
# Maximum file size (in bytes). E.g., 2 MB max.
MAX_CONTENT_LENGTH = 2 * 1024 * 1024

# Allowed file extensions for profile photos
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}
