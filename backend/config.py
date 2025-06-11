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

def ensure_indexes(db):
    """Create indexes used across the application."""
    db.questions.create_index('link', unique=True)
    db.companies.create_index('name', unique=True)
    db.company_questions.create_index(
        [('company_id', 1), ('bucket', 1), ('question_id', 1)], unique=True
    )
    db.company_questions.create_index('question_id')
    db.user_meta.create_index([('user_id', 1), ('question_id', 1)])
    db.user_meta.create_index([('user_id', 1), ('company_id', 1), ('bucket', 1)])

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
# Cookie is sent only over HTTPS by default. Override with JWT_COOKIE_SECURE=False for local testing.
JWT_COOKIE_SECURE = os.getenv("JWT_COOKIE_SECURE", "True").lower() in ("true", "1", "yes")
JWT_COOKIE_SAMESITE = os.getenv("JWT_COOKIE_SAMESITE", "Lax")
JWT_COOKIE_CSRF_PROTECT = False

# ————————————————
# Flask-Session (server-side sessions)
# ————————————————
SESSION_TYPE = "filesystem"
SESSION_PERMANENT = False
SESSION_USE_SIGNER = True
SESSION_FILE_DIR = os.getenv("SESSION_FILE_DIR", "./.flask_session/")
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "True").lower() in ("true", "1", "yes")
WTF_CSRF_TIME_LIMIT = None

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
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000")

# Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# ————————————————
# File Uploads (Profile Photos)
# ————————————————
# Maximum file size (in bytes). E.g., 2 MB max.
MAX_CONTENT_LENGTH = 2 * 1024 * 1024

# Allowed file extensions for profile photos
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}
