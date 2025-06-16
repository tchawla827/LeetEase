# backend/app.py  – LeetEase ©2025

import os
import random
import csv
import threading
import time
import concurrent.futures
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from datetime import timedelta, datetime

import requests
import re
from dotenv import load_dotenv
from flask import (
    Flask, jsonify, request, abort,
    session, send_file, send_from_directory
)
from bson import ObjectId
from bson.errors import InvalidId
import gridfs
from werkzeug.exceptions import HTTPException

# ─── New imports for CSV/Excel parsing ─────────────────────────────────
import pandas as pd
from pandas.errors import EmptyDataError

try:
    from . import config
    from .config import get_db, ensure_indexes
except ImportError:  # Allow running as a script
    import config
    from config import get_db, ensure_indexes

try:
    from .extensions import jwt, sess, bcrypt, mail, csrf
except ImportError:  # Fallback for script execution
    from extensions import jwt, sess, bcrypt, mail, csrf
from flask_cors import CORS
from flask_wtf.csrf import generate_csrf
import bleach
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    set_access_cookies,
    unset_jwt_cookies,
    decode_token,
)
from flask_jwt_extended.exceptions import JWTExtendedException
from flask_mail import Message

load_dotenv()
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

app = Flask(
    __name__,
    static_folder=os.path.join(BASE_DIR, 'frontend', 'build', 'static'),
    template_folder=os.path.join(BASE_DIR, 'frontend', 'build')
)
app.config.from_object(config)


# ─── Initialize extensions ────────────────────────────────────────────────
sess.init_app(app)
jwt.init_app(app)
bcrypt.init_app(app)
mail.init_app(app)
csrf.init_app(app)
CORS(app, supports_credentials=True, origins=app.config['CORS_ORIGINS'].split(','))
# ─── MongoDB collections ───────────────────────────────────────────────────
db        = get_db()
if os.getenv("AUTO_INDEX", "False").lower() in ("true", "1", "yes"):
    try:
        ensure_indexes(db)
    except Exception as e:
        app.logger.warning("Index setup failed: %s", e)
QUEST     = db.questions
COMPANIES = db.companies
CQ        = db.company_questions
USER_META = db.user_meta
USERS     = db.users
FS        = gridfs.GridFS(db)

# Cache for per-user statistics (simple in-memory)
STATS_CACHE = {}
STATS_TTL_SECONDS = 60

@app.after_request
def set_csrf_cookie(response):
    """Set a CSRF token cookie for the frontend."""
    response.set_cookie(
        "csrf_token",
        generate_csrf(),
        secure=app.config.get("SESSION_COOKIE_SECURE", True),
        httponly=False,
        samesite="Lax",
    )
    return response

# ─── Error Handlers ───────────────────────────────────────────────────────
@app.errorhandler(HTTPException)
def handle_http_exception(e):
    """Return JSON for HTTP errors."""
    response = jsonify({'error': e.name, 'description': e.description})
    return response, e.code


@app.errorhandler(Exception)
def handle_exception(e):
    """Log stack trace and return generic 500 response."""
    app.logger.exception("Unhandled exception")
    return jsonify({'error': 'Internal Server Error'}), 500

# ─── Helpers ──────────────────────────────────────────────────────────────
def generate_otp() -> str:
    return f"{random.randint(100_000, 999_999)}"

def sanitize_text(text: str) -> str:
    """Basic HTML sanitization for user supplied strings."""
    return bleach.clean(text or "", tags=[], strip=True)

def allowed_file(filename):
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in getattr(config, 'ALLOWED_EXTENSIONS', {'png','jpg','jpeg','gif'})

def serialize_user(user):
    """Convert a MongoDB user doc to JSON-friendly dict with photo URL."""
    if not user:
        return None
    user = dict(user)
    user['id'] = str(user.pop('_id'))
    photo_id = user.pop('profilePhotoId', None)
    user['profilePhoto'] = f"/api/profile/photo/{photo_id}" if photo_id else None
    return user



# ─── LeetCode API endpoints & fetch helpers ───────────────────────────────
PROB_API        = "https://leetcode.com/api/problems/algorithms/"
GRAPHQL_API     = "https://leetcode.com/graphql"
BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept":     "application/json, text/html",
    "Referer":    "https://leetcode.com/",
    "Origin":     "https://leetcode.com"
}
GRAPHQL_HEADERS = {
    "User-Agent": BROWSER_HEADERS["User-Agent"],
    "Content-Type": "application/json"
}

def _fetch_solved_slugs_via_list(session_cookie: str) -> set[str]:
    cookies = {"LEETCODE_SESSION": session_cookie}
    try:
        resp = requests.get(
            PROB_API, headers=BROWSER_HEADERS, cookies=cookies, timeout=10
        )
    except requests.RequestException as e:
        app.logger.error("Problems API request failed: %s", e)
        abort(502, description="Unable to contact LeetCode")

    try:
        resp.raise_for_status()
    except requests.HTTPError as e:
        app.logger.error(
            "Problems API error %s: %s", resp.status_code, resp.text[:200]
        )
        abort(502, description="Failed to fetch LeetCode problem list: " + str(e))

    data = resp.json().get("stat_status_pairs", [])
    return {
        p["stat"]["question__title_slug"]
        for p in data
        if p.get("status") == "ac"
    }

def fetch_leetcode_tags(slug: str) -> list[str]:
    query = """
    query getQuestionDetail($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        topicTags {
          name
        }
      }
    }
    """
    payload = {"query": query, "variables": {"titleSlug": slug}}
    try:
        resp = requests.post(
            GRAPHQL_API, headers=GRAPHQL_HEADERS, json=payload, timeout=10
        )
    except requests.RequestException as e:
        app.logger.error("Tag request failed for %s: %s", slug, e)
        abort(502, description="Unable to contact LeetCode")

    try:
        resp.raise_for_status()
    except requests.HTTPError as e:
        app.logger.warning("Failed to fetch tags for %s: %s", slug, e)
        return []
    tags = resp.json().get("data", {}).get("question", {}).get("topicTags", [])
    return [t["name"] for t in tags]

def fetch_leetcode_content(slug: str) -> str:
    query = """
    query getQuestion($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        content
      }
    }
    """
    payload = {"query": query, "variables": {"titleSlug": slug}}
    try:
        resp = requests.post(
            GRAPHQL_API, headers=GRAPHQL_HEADERS, json=payload, timeout=10
        )
    except requests.RequestException as e:
        app.logger.error("Content request failed for %s: %s", slug, e)
        abort(502, description="Unable to contact LeetCode")

    try:
        resp.raise_for_status()
    except requests.HTTPError as e:
        app.logger.warning("Failed to fetch content for %s: %s", slug, e)
        return ""
    return resp.json().get("data", {}).get("question", {}).get("content", "")

def sync_leetcode(username: str, session_cookie: str, user_id: str) -> int:
    solved_slugs = _fetch_solved_slugs_via_list(session_cookie)

    slug_to_qid = {
        q["link"].rstrip("/").split("/")[-1]: str(q["_id"])
        for q in QUEST.find({}, {"_id":1,"link":1})
    }

    from pymongo import UpdateOne

    ops = []
    for slug in solved_slugs:
        qid = slug_to_qid.get(slug)
        if not qid:
            continue
        ops.append(
            UpdateOne(
                {"user_id": user_id, "question_id": qid},
                {"$set": {"solved": True}},
                upsert=True,
            )
        )

    if ops:
        USER_META.bulk_write(ops)

    return len(ops)

# =============================================================================
# Authentication & User Management
# =============================================================================
@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email             = sanitize_text((data.get('email') or '').strip().lower())
    password          = data.get('password')
    first_name        = sanitize_text((data.get('firstName') or '').strip())
    last_name         = sanitize_text((data.get('lastName') or '').strip())
    college           = sanitize_text((data.get('college') or '').strip())
    leetcode_username = sanitize_text((data.get('leetcodeUsername') or '').strip())

    # Only firstName, email, and password are strictly required
    if not (email and password and first_name):
        abort(400, description='First name, email, and password are required')

    # Basic email format validation
    import re
    email_regex = r'^[^@\s]+@[^@\s]+\.[^@\s]+$'
    if not re.match(email_regex, email):
        abort(400, description='Invalid email format')

    if USERS.find_one({'email': email}):
        abort(400, description='Email already registered')

    otp = generate_otp()
    session['reg_data'] = {
        'email':             email,
        'password':          password,
        'firstName':         first_name,
        'lastName':          last_name or None,
        'college':           college or None,
        'leetcodeUsername':  leetcode_username or None
    }
    session['otp'] = otp

    msg = Message('Your Registration OTP', recipients=[email])
    msg.body = f"Your registration OTP is {otp}"
    mail.send(msg)
    return jsonify({'msg': 'OTP sent via email'}), 200

@app.route('/auth/verify', methods=['POST'])
def verify():
    data = request.get_json() or {}
    if session.get('otp') != data.get('otp'):
        abort(400, description='Invalid OTP')
    reg = session.pop('reg_data', None)
    session.pop('otp', None)
    if not reg:
        abort(400, description='No registration data found')

    pw_hash = bcrypt.generate_password_hash(reg['password']).decode('utf-8')
    USERS.insert_one({
        'email':             reg['email'],
        'password':          pw_hash,
        'role':              'user',
        'firstName':         reg['firstName'],
        'lastName':         reg.get('lastName'),
        'college':           reg.get('college'),
        'leetcode_username': reg.get('leetcodeUsername'),
        'leetcode_session':  None,
        'profilePhotoId':    None,
        'settings': {
            'colorMode': 'leet',
            'palette': {
                'easy':   '#8BC34A',
                'medium': '#FFB74D',
                'hard':   '#E57373',
                'solved': '#9E9E9E'
            }
        }
    })
    return jsonify({'msg': 'Registration complete'}), 201

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    if not (data.get('email') and data.get('password')):
        abort(400, description='Email and password required')

    email    = (data.get('email') or '').strip().lower()
    password = data.get('password')
    user     = USERS.find_one({'email': email})
    if not user or not bcrypt.check_password_hash(user['password'], password):
        abort(401, description='Bad email or password')

    token = create_access_token(identity=str(user['_id']))
    resp  = jsonify({'msg': 'Login successful'})
    set_access_cookies(resp, token)

    def _bg_sync(u, s, uid):
        try:
            sync_leetcode(u, s, uid)
        except Exception as e:
            app.logger.warning("Background sync failed for %s: %s", uid, e)

    uname = user.get('leetcode_username')
    sc    = user.get('leetcode_session')
    if uname and sc:
        threading.Thread(target=_bg_sync, args=(uname, sc, str(user['_id'])), daemon=True).start()

    return resp, 200

@app.route('/auth/google', methods=['POST'])
def google_login():
    """Sign up or sign in a user via a Google ID token."""
    data = request.get_json() or {}
    id_token = data.get('idToken') or data.get('token')
    if not id_token:
        abort(400, description='idToken required')

    try:
        r = requests.get(
            'https://oauth2.googleapis.com/tokeninfo',
            params={'id_token': id_token},
            timeout=5
        )
        r.raise_for_status()
    except requests.RequestException as e:
        app.logger.error('Google token verify failed: %s', e)
        abort(400, description='Invalid Google token')

    info = r.json() or {}
    if info.get('aud') != app.config.get('GOOGLE_CLIENT_ID'):
        abort(400, description='Invalid Google token')

    email = info.get('email')
    if not email:
        abort(400, description='Email not available')

    user = USERS.find_one({'email': email})
    if not user:
        user_doc = {
            'email': email,
            'password': None,
            'role': 'user',
            'firstName': info.get('given_name') or '',
            'lastName': info.get('family_name'),
            'college': None,
            'leetcode_username': None,
            'leetcode_session': None,
            'profilePhotoId': None,
            'settings': {
                'colorMode': 'leet',
                'palette': {
                    'easy': '#8BC34A',
                    'medium': '#FFB74D',
                    'hard': '#E57373',
                    'solved': '#9E9E9E'
                }
            }
        }
        result = USERS.insert_one(user_doc)
        user_doc['_id'] = result.inserted_id
        user = user_doc

    access = create_access_token(identity=str(user['_id']))
    resp = jsonify({'msg': 'Login successful'})
    set_access_cookies(resp, access)
    return resp, 200

@app.route('/auth/logout', methods=['POST'])
def logout():
    resp = jsonify({'msg': 'Logout successful'})
    unset_jwt_cookies(resp)
    session.clear()
    return resp, 200

@app.route('/auth/me', methods=['GET'])
@jwt_required()
def me():
    uid = get_jwt_identity()
    user = USERS.find_one({'_id': ObjectId(uid)}, {'password': 0})
    if not user:
        abort(404, description='User not found')
    return jsonify(serialize_user(user)), 200

@app.route('/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    user = USERS.find_one({'email': (data.get('email') or '').strip().lower()})
    if not user:
        abort(400, description='Email not found')

    reset_token = create_access_token(
        identity=str(user['_id']),
        expires_delta=timedelta(minutes=15)
    )

    msg = Message('Password Reset', recipients=[user['email']])
    if config.FRONTEND_URL:
        link = f"{config.FRONTEND_URL.rstrip('/')}/reset-password?token={reset_token}"
        body = (
            "Click the link below to reset your password:\n"
            f"{link}\n"
            "This link expires in 15 minutes."
        )
    else:
        body = (
            f"Your reset token: {reset_token}\n"
            "Use it to reset your password. Token expires in 15 minutes."
        )

    msg.body = body
    mail.send(msg)
    return jsonify({'msg': 'Password reset email sent'}), 200

@app.route('/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    try:
        decoded = decode_token(data.get('token'))
        uid = decoded['sub']
    except JWTExtendedException:
        abort(400, description='Invalid or expired token')

    new_password = data.get('newPassword')
    if not new_password:
        abort(400, description='New password is required')

    pw_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
    USERS.update_one({'_id': ObjectId(uid)}, {'$set': {'password': pw_hash}})
    return jsonify({'msg': 'Password has been reset'}), 200

# =============================================================================
# Profile: LeetCode handle + sessionCookie, sync endpoint
# =============================================================================
@app.route('/profile/leetcode', methods=['POST'])
@jwt_required()
def save_leetcode_profile():
    data = request.get_json() or {}
    username      = (data.get('username') or '').strip()
    sessionCookie = (data.get('sessionCookie') or '').strip()
    if not (username and sessionCookie):
        abort(400, description='Both username and sessionCookie are required')

    uid = get_jwt_identity()
    USERS.update_one(
        {'_id': ObjectId(uid)},
        {'$set': {
            'leetcode_username': username,
            'leetcode_session':  sessionCookie
        }}
    )
    return jsonify({'msg': 'LeetCode profile saved'}), 200

@app.route('/profile/leetcode/sync', methods=['POST'])
@jwt_required()
def manual_leetcode_sync():
    uid  = get_jwt_identity()
    user = USERS.find_one({'_id': ObjectId(uid)})
    if not user or not user.get('leetcode_username') or not user.get('leetcode_session'):
        abort(400, description='Username & sessionCookie must be set first')

    synced = sync_leetcode(
        user['leetcode_username'],
        user['leetcode_session'],
        str(uid)
    )

    return jsonify({'synced': synced}), 200

# ─── Update per‐user color settings ────────────────────────────────────────
@app.route('/profile/settings', methods=['PATCH'])
@jwt_required()
def update_profile_settings():
    data = request.get_json() or {}
    allowed = {'easy', 'medium', 'hard', 'solved'}
    update = {}

    if 'colorMode' in data and data['colorMode'] in ['leet', 'user']:
        update['settings.colorMode'] = data['colorMode']

    if 'palette' in data and isinstance(data['palette'], dict):
        for k in allowed:
            if k in data['palette']:
                update[f'settings.palette.{k}'] = data['palette'][k]

    if not update:
        abort(400, description="No valid settings to update")

    uid = get_jwt_identity()
    USERS.update_one({'_id': ObjectId(uid)}, {'$set': update})
    result = USERS.find_one({'_id': ObjectId(uid)}, {'settings': 1, '_id': 0})
    return jsonify(result.get('settings', {})), 200

# =============================================================================
# NEW: Account Settings & Profile Photo Endpoints
# =============================================================================
@app.route('/profile/account', methods=['GET'])
@jwt_required()
def get_account_profile():
    """Fetch the current user's account details (excluding password)."""
    uid = get_jwt_identity()
    user = USERS.find_one({'_id': ObjectId(uid)}, {'password': 0})
    if not user:
        abort(404, description='User not found')
    return jsonify(serialize_user(user)), 200

@app.route('/profile/account', methods=['PATCH'])
@jwt_required()
def update_account_profile():
    """
    Update fields like firstName, lastName, college, email, and optionally newPassword.
    If email is changed, ensure uniqueness. If newPassword provided, hash it.
    """
    uid = get_jwt_identity()
    data = request.get_json() or {}
    update = {}

    # Validate and set firstName
    if 'firstName' in data:
        new_first = sanitize_text((data.get('firstName') or '').strip())
        if not new_first:
            abort(400, description='First name cannot be empty')
        update['firstName'] = new_first

    # lastName (optional)
    if 'lastName' in data:
       update['lastName'] = sanitize_text((data.get('lastName') or '').strip()) or None

    # college (optional)
    if 'college' in data:
        update['college'] = sanitize_text((data.get('college') or '').strip()) or None
       
    # email (required & unique if changed)
    if 'email' in data:
        new_email = sanitize_text((data.get('email') or '').strip().lower())
        if not new_email:
            abort(400, description='Email cannot be empty')
        # Basic email format validation
        import re
        email_regex = r'^[^@\s]+@[^@\s]+\.[^@\s]+$'
        if not re.match(email_regex, new_email):
            abort(400, description='Invalid email format')
        # Check if email already exists on a different user
        existing = USERS.find_one({'email': new_email})
        if existing and str(existing['_id']) != uid:
            abort(400, description='Email is already in use')
        update['email'] = new_email

    # newPassword (optional)
    if 'newPassword' in data:
        new_pw = data.get('newPassword')
        if not new_pw or len(new_pw) < 8:
            abort(400, description='New password must be at least 8 characters')
        pw_hash = bcrypt.generate_password_hash(new_pw).decode('utf-8')
        update['password'] = pw_hash

    if not update:
        abort(400, description='No valid fields to update')

    USERS.update_one({'_id': ObjectId(uid)}, {'$set': update})
    # Return updated user (excluding password)
    updated_user = USERS.find_one({'_id': ObjectId(uid)}, {'password': 0})
    return jsonify(serialize_user(updated_user)), 200

@app.route('/profile/account/photo', methods=['POST'])
@jwt_required()
def upload_profile_photo():
    """Upload (or replace) a profile photo to GridFS."""
    uid = get_jwt_identity()
    if 'photo' not in request.files:
        abort(400, description='No file part in the request')

    file = request.files['photo']
    if file.filename == '':
        abort(400, description='No selected file')
    if not allowed_file(file.filename):
        abort(400, description='File type not allowed')

    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uid}.{ext}"

    try:
        # remove old photo if exists
        old = USERS.find_one({'_id': ObjectId(uid)}, {'profilePhotoId': 1})
        if old and old.get('profilePhotoId'):
            try:
                FS.delete(old['profilePhotoId'])
            except Exception as e:
                app.logger.warning("Could not delete old photo %s: %s", old['profilePhotoId'], e)

        file_id = FS.put(file.stream, filename=filename, content_type=file.content_type)
    except Exception as e:
        app.logger.error("Failed to save profile photo: %s", e)
        abort(500, description='Failed to save photo')

    USERS.update_one({'_id': ObjectId(uid)}, {'$set': {'profilePhotoId': file_id}})
    photo_url = f"/api/profile/photo/{file_id}"
    return jsonify({'profilePhotoUrl': photo_url}), 200

@app.route('/profile/account/photo', methods=['DELETE'])
@jwt_required()
def delete_profile_photo():
    """Remove the existing profile photo from GridFS and unset the field."""
    uid = get_jwt_identity()
    user = USERS.find_one({'_id': ObjectId(uid)}, {'profilePhotoId': 1})
    if not user:
        abort(404, description='User not found')

    photo_id = user.get('profilePhotoId')
    if photo_id:
        try:
            FS.delete(photo_id)
        except Exception as e:
            app.logger.warning("Could not delete photo file %s: %s", photo_id, e)

    USERS.update_one({'_id': ObjectId(uid)}, {'$unset': {'profilePhotoId': ""}})
    return jsonify({'msg': 'Profile photo removed'}), 200


@app.route('/api/profile/photo/<file_id>', methods=['GET'])
@jwt_required()
def get_profile_photo(file_id):
    """Stream a profile photo stored in GridFS."""
    try:
        oid = ObjectId(file_id)
    except (InvalidId, TypeError):
        abort(400, description='Invalid file id')
    try:
        grid_out = FS.get(oid)
    except gridfs.NoFile:
        abort(404, description='File not found')
    return send_file(BytesIO(grid_out.read()), mimetype=grid_out.content_type)

# =============================================================================
# Health-check
# =============================================================================
@app.route('/api/ping', methods=['GET'])
@jwt_required()
def ping():
    return jsonify({'msg': 'pong'}), 200

# =============================================================================
# Admin CSV / Excel import
# =============================================================================
@app.route('/api/import', methods=['POST'])
@jwt_required()
def import_questions():
    """
    Admin-only endpoint.
      • Accepts a single file (.csv | .xlsx | .xls)
      • Expected columns (case-insensitive):
          title, link/url, company, bucket, difficulty (optional),
          frequency (optional), acceptanceRate (optional)
      • If a company already exists we *append* new questions;
        otherwise we create the company on the fly.
    """
    # 1) Authorize ─────────────────────────────────────────────────────────
    uid  = get_jwt_identity()
    user = USERS.find_one({'_id': ObjectId(uid)})
    if user.get('role') != 'admin':
        abort(403, description='Only admin can import questions')

    if 'file' not in request.files:
        abort(400, description='File field is required')

    up_file = request.files['file']
    if up_file.filename == '':
        abort(400, description='No file selected')

    ext = up_file.filename.rsplit('.', 1)[-1].lower()
    try:
        if ext == 'csv':
            df = pd.read_csv(up_file.stream)
        elif ext in ('xlsx', 'xls'):
            # Must read the raw bytes first; BytesIO lets pandas parse it
            df = pd.read_excel(BytesIO(up_file.read()), engine='openpyxl')
        else:
            abort(400, description='Unsupported file type; only CSV/Excel')
    except (EmptyDataError, pd.errors.ParserError) as e:
        abort(400, description=f'Could not parse file: {e}')

    if df.empty:
        abort(400, description='Uploaded file contained no rows')

    # ── Normalize column names: strip & lower for lookup convenience ──────
    df.columns = [c.strip().lower() for c in df.columns]

    required_cols = {'title', 'link', 'company', 'bucket'}
    if not required_cols.issubset(set(df.columns)):
        missing = required_cols - set(df.columns)
        abort(400, description=f'Missing required columns: {missing}')

    imported, skipped = 0, 0

    for _, row in df.iterrows():
        title   = str(row.get('title') or '').strip()
        link    = str(row.get('link') or row.get('url') or '').strip()
        company = str(row.get('company') or '').strip()
        bucket  = str(row.get('bucket') or '').strip()           # e.g. “30Days”, “3Months”, etc.

        if not (title and link and company and bucket):
            skipped += 1
            continue  # malformed row

        try:
            freq = float(row.get('frequency') or 0)
        except (ValueError, TypeError):
            freq = 0.0

        try:
            acc = float(row.get('acceptancerate') or 0)
        except (ValueError, TypeError):
            acc = 0.0

        ldiff = str(row.get('difficulty') or '').capitalize().strip()

        # 2) Upsert canonical question ───────────────────────────────────
        q_doc = QUEST.find_one_and_update(
            {'link': link},
            {'$setOnInsert': {
                'link': link,
                'title': title,
                'leetDifficulty': ldiff or None
            }},
            upsert=True,
            return_document=True
        )
        qid = q_doc['_id']

        # 3) Fetch (or insert) company ────────────────────────────────────
        c_doc = COMPANIES.find_one_and_update(
            {'name': company},
            {'$setOnInsert': {'name': company}},
            upsert=True,
            return_document=True
        )
        cid = c_doc['_id']

        # 4) Upsert join row (company × bucket × question) ───────────────
        CQ.replace_one(
            {'company_id': cid, 'question_id': qid, 'bucket': bucket},
            {
                'company_id':    cid,
                'question_id':   qid,
                'bucket':        bucket,
                'frequency':     freq,
                'acceptanceRate': acc
            },
            upsert=True
        )
        imported += 1

    return jsonify({
        'imported': imported,
        'skipped':  skipped
    }), 201

# ─── Admin-only: backfill tags for existing questions ─────────────────────
@app.route('/api/admin/backfill-tags', methods=['POST'])
@jwt_required()
def backfill_tags():
    uid = get_jwt_identity()
    user = USERS.find_one({'_id': ObjectId(uid)})
    if user.get('role') != 'admin':
        abort(403, description='Only admin can run backfill')

    cursor = QUEST.find({}, {'link': 1})
    slugs = [
        (q['_id'], q['link'].rstrip('/').split('/')[-1])
        for q in cursor
    ]

    with ThreadPoolExecutor(max_workers=5) as pool:
        future_to_id = {
            pool.submit(fetch_leetcode_tags, slug): qid
            for qid, slug in slugs
        }
        for fut in concurrent.futures.as_completed(future_to_id):
            qid = future_to_id[fut]
            try:
                tags = fut.result()
            except Exception as e:
                app.logger.warning('Failed to backfill tags for %s: %s', qid, e)
                tags = []
            QUEST.update_one({'_id': qid}, {'$set': {'tags': tags}})

    return jsonify({'msg': 'Backfill complete'}), 200

# =============================================================================
# Public listings & per-user metadata
# =============================================================================
@app.route('/api/companies', methods=['GET'])
@jwt_required()
def list_companies():
    return jsonify(COMPANIES.distinct('name')), 200

@app.route('/api/companies/<company>/buckets', methods=['GET'])
@jwt_required()
def list_buckets(company):
    co = COMPANIES.find_one({'name': company})
    if not co:
        abort(404, description=f"No company '{company}'")
    return jsonify(CQ.distinct('bucket', {'company_id': co['_id']})), 200

@app.route('/api/companies/<company>/topics', methods=['GET'])
@jwt_required()
def get_company_topics(company):
    co = COMPANIES.find_one({'name': company})
    if not co:
        abort(404, description=f"No company '{company}'")

    bucket   = request.args.get('bucket', 'All')
    unsolved = request.args.get('unsolved', 'false').lower() == 'true'
    uid      = get_jwt_identity()

    match = {'company_id': co['_id']}
    # When "All" bucket is requested, restrict to the actual "All" bucket
    # document instead of every bucket to avoid duplicates.
    # The CSV/Excel dataset already contains a pre-made "All" bucket with
    # unique questions, so querying all buckets would return duplicates.
    if bucket != 'All':
        match['bucket'] = bucket
    else:
        match['bucket'] = 'All'

    pipeline = [
        {'$match': match},
        # Deduplicate questions in case multiple company_question documents
        # exist for the same question ID and bucket.
        {'$group': {'_id': '$question_id'}},
        {'$set': {'question_id': '$_id'}},
        {'$lookup': {
            'from': 'questions',
            'localField': 'question_id',
            'foreignField': '_id',
            'as': 'q'
        }},
        {'$unwind': '$q'}
    ]

    if unsolved:
        pipeline += [
            {'$lookup': {
                'from': 'user_meta',
                'let': {'qid': '$question_id'},
                'pipeline': [
                    {'$match': {
                        '$expr': {
                            '$and': [
                                {'$eq': ['$question_id', {'$toString': '$$qid'}]},
                                {'$eq': ['$user_id', uid]}
                            ]
                        }
                    }},
                    {'$project': {'solved': 1}}
                ],
                'as': 'meta'
            }},
            {'$match': {
                '$or': [
                    {'meta': {'$eq': []}},
                    {'meta.0.solved': False}
                ]
            }}
        ]

    pipeline += [
        {'$unwind': '$q.tags'},
        {'$group':   {'_id': '$q.tags', 'count': {'$sum': 1}}},
        {'$sort':    {'count': -1}}
    ]

    results = list(CQ.aggregate(pipeline))
    topics  = [{'tag': r['_id'], 'count': r['count']} for r in results]
    return jsonify({'data': topics}), 200

@app.route('/api/companies/<company>/buckets/<bucket>/questions', methods=['GET'])
@jwt_required()
def list_questions(company, bucket):
    co = COMPANIES.find_one({'name': company})
    if not co:
        abort(404, description=f"No company '{company}'")

    page         = int(request.args.get('page', 1))
    limit        = int(request.args.get('limit', 50))
    skip         = (page - 1) * limit
    search       = request.args.get('search')
    if search:
        if len(search) > 100:
            abort(400, description='Search query too long')
        search = re.escape(search)
    sortField    = request.args.get('sortField')
    sortOrder    = request.args.get('sortOrder', 'asc')
    tag_filter   = request.args.get('tag')
    showUnsolved = request.args.get('showUnsolved', 'false').lower() == 'true'

    match = {'company_id': co['_id']}
    # Show the dedicated "All" bucket instead of combining all buckets to
    # avoid duplicates when viewing "All" questions for a company.
    if bucket != 'All':
        match['bucket'] = bucket
    else:
        match['bucket'] = 'All'

    pipeline = [
        {'$match': match},
        # Group by question to avoid duplicates if multiple rows exist
        {'$group': {
            '_id': '$question_id',
            'frequency': {'$max': '$frequency'},
            'acceptanceRate': {'$max': '$acceptanceRate'}
        }},
        {'$set': {'question_id': '$_id'}},
        {'$lookup': {
            'from': 'questions',
            'localField': 'question_id',
            'foreignField': '_id',
            'as': 'q'
        }},
        {'$unwind': '$q'}
    ]

    if tag_filter:
        pipeline.append({'$match': {'q.tags': tag_filter}})

    if search:
        pipeline.append({
            '$match': {
                'q.title': {'$regex': search, '$options': 'i'}
            }
        })

    fmap = {
        'title':          'q.title',
        'frequency':      'frequency',
        'acceptanceRate': 'acceptanceRate',
        'leetDifficulty': 'q.leetDifficulty'
    }
    if sortField in fmap:
        pipeline.append({
            '$sort': {fmap[sortField]: 1 if sortOrder == 'asc' else -1}
        })

    total_count = list(CQ.aggregate(pipeline + [{'$count': 'c'}]))
    total = total_count[0]['c'] if total_count else 0

    pipeline += [
        {'$skip': skip},
        {'$limit': limit}
    ]

    results = list(CQ.aggregate(pipeline))

    uid = get_jwt_identity()
    qids = [str(r['q']['_id']) for r in results]

    meta_generic = {
        m['question_id']: m
        for m in USER_META.find({'user_id': uid, 'question_id': {'$in': qids}})
    }

    meta_filter = {'user_id': uid, 'company_id': co['_id'], 'question_id': {'$in': qids}}
    if bucket != 'All':
        meta_filter['bucket'] = bucket
    meta_specific = {m['question_id']: m for m in USER_META.find(meta_filter)}

    out = []
    for doc in results:
        q = doc['q']
        qid_str = str(q['_id'])
        meta = meta_specific.get(qid_str) or meta_generic.get(qid_str)
        solved = meta.get('solved', False) if meta else False
        if showUnsolved and solved:
            continue

        out.append({
            'id':             qid_str,
            'title':          q['title'],
            'link':           q['link'],
            'frequency':      doc.get('frequency'),
            'acceptanceRate': doc.get('acceptanceRate'),
            'leetDifficulty': q.get('leetDifficulty'),
            'solved':         solved,
            'userDifficulty': meta.get('userDifficulty') if meta else None
        })

    return jsonify({'data': out, 'total': total}), 200

@app.route('/api/questions/<question_id>', methods=['GET'])
@jwt_required()
def get_question(question_id):
    try:
        q_oid = ObjectId(question_id)
    except InvalidId:
        abort(400, description=f"Invalid question ID '{question_id}'")

    q = QUEST.find_one({'_id': q_oid})
    if not q:
        abort(404, description=f"Question '{question_id}' not found")

    slug = q['link'].rstrip('/').split('/')[-1]
    content = fetch_leetcode_content(slug)
    resp = {
        'id': str(q['_id']),
        'title': q.get('title'),
        'link': q.get('link'),
        'leetDifficulty': q.get('leetDifficulty'),
        'tags': q.get('tags', []),
        'content': content
    }
    return jsonify(resp), 200

@app.route('/api/questions/<question_id>', methods=['PATCH'])
@jwt_required()
def update_question_meta(question_id):
    uid = get_jwt_identity()

    try:
        q_oid = ObjectId(question_id)
    except InvalidId:
        abort(400, description=f"Invalid question ID '{question_id}'")

    if not QUEST.find_one({'_id': q_oid}):
        abort(404, description=f"Question '{question_id}' not found")

    data = request.get_json() or {}
    update_fields = {}

    company_name = data.get('company')
    bucket       = data.get('bucket')
    company_id   = None
    if company_name and bucket:
        co = COMPANIES.find_one({'name': company_name})
        if not co:
            abort(404, description=f"No company '{company_name}'")
        company_id = co['_id']

    if 'solved' in data:
        update_fields['solved'] = bool(data['solved'])
    if 'userDifficulty' in data:
        update_fields['userDifficulty'] = data.get('userDifficulty') or None

    if not update_fields:
        abort(400, description="No valid fields to update (solved, userDifficulty)")

    update_fields['updatedAt'] = datetime.utcnow()


    query = {'user_id': uid, 'question_id': question_id}
    if company_id:
        query.update({'company_id': company_id, 'bucket': bucket})

    meta = USER_META.find_one_and_update(
        query,
        {'$set': update_fields | ({'company_id': company_id, 'bucket': bucket} if company_id else {})},
        upsert=True,
        return_document=True,
    )
    resp = {
        'question_id':    question_id,
        'solved':         meta.get('solved', False),
        'userDifficulty': meta.get('userDifficulty')
    }
    return jsonify(resp), 200

@app.route('/api/questions/batch-meta', methods=['PATCH'])
@jwt_required()
def batch_update_questions_meta():
    uid   = get_jwt_identity()
    data  = request.get_json() or {}
    ids   = data.get('ids')
    if not isinstance(ids, list) or not ids:
        abort(400, description="Field 'ids' must be a non-empty list")

    update_fields = {}
    if 'solved' in data:
        update_fields['solved'] = bool(data['solved'])
    if 'userDifficulty' in data:
        update_fields['userDifficulty'] = data.get('userDifficulty') or None
    if not update_fields:
        abort(400, description="No valid fields to update (solved, userDifficulty)")

    update_fields['updatedAt'] = datetime.utcnow()

    company_name = data.get('company')
    bucket       = data.get('bucket')
    company_id   = None
    if company_name and bucket:
        co = COMPANIES.find_one({'name': company_name})
        if not co:
            abort(404, description=f"No company '{company_name}'")
        company_id = co['_id']


    from pymongo import UpdateOne

    ops = []
    for qid in ids:
        query = {'user_id': uid, 'question_id': qid}
        if company_id:
            query.update({'company_id': company_id, 'bucket': bucket})
        ops.append(
            UpdateOne(
                query,
                {'$set': update_fields | ({'company_id': company_id, 'bucket': bucket} if company_id else {})},
                upsert=True,
            )
        )

    if ops:
        USER_META.bulk_write(ops)

    filter_query = {'user_id': uid, 'question_id': {'$in': ids}}
    if company_id:
        filter_query.update({'company_id': company_id, 'bucket': bucket})
    meta_docs = {
        m['question_id']: m
        for m in USER_META.find(filter_query)
    }

    results = []
    for qid in ids:
        meta = meta_docs.get(qid, {})
        results.append({
            'question_id':    qid,
            'solved':         meta.get('solved', False),
            'userDifficulty': meta.get('userDifficulty')
        })

    return jsonify(results), 200

# ─── Global Question Search Endpoints ─────────────────────────────────────

@app.route('/api/questions/suggestions', methods=['GET'])
@jwt_required()
def question_suggestions():
    """Return question title suggestions across all companies."""
    query = request.args.get('query', '').strip()
    limit = int(request.args.get('limit', 10))
    if not query:
        return jsonify({'suggestions': []}), 200
    if len(query) > 100:
        abort(400, description='Query too long')
    regex = re.escape(query)
    docs = QUEST.find(
        {'title': {'$regex': regex, '$options': 'i'}},
        {'title': 1}
    ).limit(limit)
    suggestions = [{'id': str(d['_id']), 'title': d['title']} for d in docs]
    return jsonify({'suggestions': suggestions}), 200


@app.route('/api/questions/<question_id>/companies', methods=['GET'])
@jwt_required()
def question_companies(question_id):
    """List companies that include the given question in any bucket."""
    try:
        q_oid = ObjectId(question_id)
    except InvalidId:
        abort(400, description=f"Invalid question ID '{question_id}'")

    pipeline = [
        {'$match': {'question_id': q_oid}},
        {'$lookup': {
            'from': 'companies',
            'localField': 'company_id',
            'foreignField': '_id',
            'as': 'co'
        }},
        {'$unwind': '$co'},
        {'$group': {'_id': '$co.name'}},
        {'$sort': {'_id': 1}}
    ]
    results = list(CQ.aggregate(pipeline))
    companies = [r['_id'] for r in results]
    return jsonify({'companies': companies}), 200

# ─── Company-wide progress (per bucket) ───────────────────────────────────
@app.route('/api/companies/<company>/progress', methods=['GET'])
@jwt_required()
def company_progress(company):
    """
    Returns, for each predefined bucket, how many questions there are for <company>
    and how many of those the current user has marked as solved.
    Response format:
      [
        { "bucket": "30Days",         "total": 12,  "solved": 7 },
        { "bucket": "3Months",        "total": 45,  "solved": 12 },
        { "bucket": "6Months",        "total": 30,  "solved": 4 },
        { "bucket": "MoreThan6Months","total": 20,  "solved": 1 },
        { "bucket": "All",            "total": 107, "solved": 24 }
      ]
    """
    uid = get_jwt_identity()

    # 1) Find the company document
    co = COMPANIES.find_one({'name': company})
    if not co:
        abort(404, description=f"No company '{company}'")

    # 2) Aggregate: for each bucket, count total vs. solved
    pipeline = [
        { '$match': { 'company_id': co['_id'] } },
        { '$lookup': {
            'from': 'user_meta',
            'let': { 'qid': '$question_id' },
            'pipeline': [
                { '$match': {
                    '$expr': {
                        '$and': [
                            # user_meta.question_id is stored as STRING, so compare to stringified ObjectId
                            { '$eq': [ '$question_id', { '$toString': '$$qid' } ] },
                            { '$eq': [ '$user_id', uid ] }
                        ]
                    }
                }},
                { '$project': { 'solved': 1, '_id': 0 } }
            ],
            'as': 'meta'
        }},
        { '$group': {
            '_id': '$bucket',
            'total': { '$sum': 1 },
            # If meta array is non-empty and meta[0].solved == true, count as solved
            'solved': {
                '$sum': {
                    '$cond': [
                        {
                          '$and': [
                            { '$ne': [ '$meta', [] ] },
                            { '$eq': [ { '$arrayElemAt': [ '$meta.solved', 0 ] }, True ] }
                          ]
                        },
                        1,
                        0
                      ]
                }
            }
        }},
        { '$project': {
            'bucket': '$_id',
            'total': 1,
            'solved': 1,
            '_id': 0
        }}
    ]

    results = list(CQ.aggregate(pipeline))

    # Fill in missing buckets with total=0, solved=0
    BUCKET_ORDER = ["30Days", "3Months", "6Months", "MoreThan6Months", "All"]
    bucket_map = { r['bucket']: r for r in results }
    final_list = []
    for b in BUCKET_ORDER:
        if b in bucket_map:
            final_list.append(bucket_map[b])
        else:
            final_list.append({ 'bucket': b, 'total': 0, 'solved': 0 })
    return jsonify(final_list), 200

# ─── Recently worked buckets for Home page ───────────────────────────────
@app.route('/api/recent-buckets', methods=['GET'])
@jwt_required()
def recent_buckets():
    """Return most recently updated company buckets for the current user."""
    uid   = get_jwt_identity()
    limit = int(request.args.get('limit', 8))

    pipeline = [

        { '$match': {
            'user_id': uid,
            'company_id': { '$exists': True },
            'bucket': { '$exists': True },
            'updatedAt': { '$exists': True }
        }},
        { '$sort': { 'updatedAt': -1 } },
        { '$lookup': {
            'from': 'companies',
            'localField': 'company_id',

            'foreignField': '_id',
            'as': 'co'
        }},
        { '$unwind': '$co' },
        { '$group': {

            '_id': { 'company': '$co.name', 'bucket': '$bucket' },

            'updatedAt': { '$first': '$updatedAt' }
        }},
        { '$sort': { 'updatedAt': -1 } },
        { '$limit': limit },
        { '$project': {
            '_id': 0,
            'company': '$_id.company',
            'bucket': '$_id.bucket',
            'updatedAt': 1
        }}
    ]

    results = list(USER_META.aggregate(pipeline))
    return jsonify({'data': results}), 200

# ─── Aggregate user statistics for Home page ─────────────────────────────
@app.route('/api/user-stats', methods=['GET'])
@jwt_required()
def user_stats():
    """Return solved/attempted counts and per-company breakdown."""
    uid = get_jwt_identity()

    cached = STATS_CACHE.get(uid)
    now = datetime.utcnow()
    if cached and (now - cached['ts']).total_seconds() < STATS_TTL_SECONDS:
        if 'totalQuestions' in cached['data']:
            return jsonify(cached['data']), 200

    total_attempted = USER_META.count_documents({'user_id': uid})
    total_solved = USER_META.count_documents({'user_id': uid, 'solved': True})

    diff_pipeline = [
        {'$match': {'user_id': uid, 'solved': True}},

        {
            '$lookup': {
                'from': 'questions',
                'let': {'qid': '$question_id'},
                'pipeline': [
                    {
                        '$match': {
                            '$expr': {
                                '$eq': ['$_id', {'$toObjectId': '$$qid'}]
                            }
                        }
                    },
                    {'$project': {'leetDifficulty': 1}}
                ],
                'as': 'q'
            }
        },
        {'$unwind': '$q'},
        {'$group': {'_id': '$q.leetDifficulty', 'count': {'$sum': 1}}}
    ]
    raw_counts = {d['_id']: d['count'] for d in USER_META.aggregate(diff_pipeline)}
    diff_counts = {'Easy': 0, 'Medium': 0, 'Hard': 0}
    for k, v in raw_counts.items():
        key = str(k).strip().capitalize()
        if key in diff_counts:
            diff_counts[key] += v


    company_pipeline = [
        {'$match': {'bucket': 'All'}},
        {'$lookup': {
            'from': 'user_meta',
            'let': {'qid': '$question_id'},
            'pipeline': [
                {'$match': {
                    '$expr': {
                        '$and': [
                            {'$eq': ['$question_id', {'$toString': '$$qid'}]},
                            {'$eq': ['$user_id', uid]},
                            {'$eq': ['$solved', True]}
                        ]
                    }
                }},
                {'$project': {'_id': 0}}
            ],
            'as': 'meta'
        }},
        {'$lookup': {
            'from': 'companies',
            'localField': 'company_id',
            'foreignField': '_id',
            'as': 'co'
        }},
        {'$unwind': '$co'},
        {'$group': {
            '_id': '$co.name',
            'total': {'$sum': 1},
            'solved': {'$sum': {'$cond': [{'$gt': [{'$size': '$meta'}, 0]}, 1, 0]}}
        }},
        {'$project': {'company': '$_id', 'total': 1, 'solved': 1, '_id': 0}},
        {'$sort': {'company': 1}}
    ]
    company_stats = list(CQ.aggregate(company_pipeline))


    # Count unique question slugs across all companies to avoid duplicates
    qids = CQ.distinct('question_id')
    links = [q.get('link', '') for q in QUEST.find({'_id': {'$in': qids}}, {'link': 1})]
    slugs = {
        link.rstrip('/').split('/')[-1].split('?')[0].lower()
        for link in links if link
    }
    total_questions = len(slugs)


    data = {
        'totalSolved': total_solved,
        'totalAttempted': total_attempted,
        'totalQuestions': total_questions,
        'difficulty': diff_counts,
        'companies': company_stats
    }
    STATS_CACHE[uid] = {'ts': now, 'data': data}
    return jsonify(data), 200

# ─── Ask AI Chat Endpoint ───────────────────────────────────────────────
@app.route('/api/ask-ai/<question_id>', methods=['GET', 'POST'])
@jwt_required()
def ask_ai(question_id):
    uid = get_jwt_identity()
    try:
        q_oid = ObjectId(question_id)
    except InvalidId:
        abort(400, description=f"Invalid question ID '{question_id}'")

    q = QUEST.find_one({'_id': q_oid})
    if not q:
        abort(404, description=f"Question '{question_id}' not found")

    slug = q['link'].rstrip('/').split('/')[-1]
    content = fetch_leetcode_content(slug)
    tags = q.get('tags', [])
    title = q.get('title')

    threads = session.setdefault('ai_threads', {})
    thread = threads.setdefault(f"{uid}:{question_id}", [])

    if request.method == 'POST':
        data = request.get_json() or {}
        message = sanitize_text(data.get('message', ''))
        if not message:
            abort(400, description='message required')
        thread.append({'role': 'user', 'content': message})

        system_prompt = (
            "You are a helpful and precise AI coding assistant. "
            "Always return clean, readable, and well-formatted code. "
            "Use proper indentation, line breaks, and spacing to improve clarity. "
            "If responding with explanations or instructions, structure them using bullet points or short paragraphs. "
            "When providing code, enclose it in markdown-style triple backticks with the language specified (e.g., ```python). "
            "Do not compress code into a single line unless explicitly asked to."
        )
        messages = [
            {'role': 'system', 'content': system_prompt},
            {
                'role': 'assistant',
                'content': (
                    f"The user is trying to solve the following question: {title}. "
                    f"{content or ''} The tags are {', '.join(tags)}. "
                    "Provide helpful hints or explanations. Avoid directly giving the full answer unless requested."
                ),
            },
        ] + thread

        ai_resp = ""
        if OPENROUTER_API_KEY:
            try:
                r = requests.post(
                    'https://openrouter.ai/api/v1/chat/completions',
                    headers={
                        'Authorization': f'Bearer {OPENROUTER_API_KEY}',
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://github.com/tchawla827/LeetEase',
                        'X-Title': 'LeetEase',
                    },
                    json={'model': 'qwen/qwen-2.5-coder-32b-instruct:free', 'messages': messages},
                    timeout=10,
                )
                r.raise_for_status()
                ai_resp = r.json()['choices'][0]['message']['content']
            except Exception as e:
                app.logger.error('OpenRouter request failed: %s', e)
                ai_resp = "Sorry, I'm unable to generate a hint right now."
        else:
            ai_resp = "OpenRouter API key not configured."

        thread.append({'role': 'assistant', 'content': ai_resp})
        session.modified = True
        return jsonify({'thread': thread}), 200

    # GET request returns existing thread
    return jsonify({'thread': thread, 'title': title, 'content': content, 'tags': tags, 'link': q.get('link')}), 200

# ─── Run & Startup Sync ────────────────────────────────────────────────────
def _startup_sync():
    """Sync every user who has both handle & session saved."""
    users = list(USERS.find({
        'leetcode_username': {'$exists': True},
        'leetcode_session':  {'$exists': True}
    }))

    if not users:
        return

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_uid = {
            executor.submit(
                sync_leetcode,
                u['leetcode_username'],
                u['leetcode_session'],
                str(u['_id'])
            ): u['_id']
            for u in users
        }
        for fut in concurrent.futures.as_completed(future_to_uid):
            uid = future_to_uid[fut]
            try:
                fut.result()
            except Exception as e:
                app.logger.warning("Startup sync failed for %s: %s", uid, e)

# ─── Serve React Frontend ────────────────────────────────────────────────
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path: str):
    """Serve the React single-page application."""
    if path.startswith('api/') or path.startswith('uploads/'):
        abort(404)

    build_dir = os.path.join(BASE_DIR, 'frontend', 'build')
    public_dir = os.path.join(BASE_DIR, 'frontend', 'public')

    target = os.path.join(build_dir, path)
    if os.path.exists(target) and os.path.isfile(target):
        return send_from_directory(build_dir, path)

    index_build = os.path.join(build_dir, 'index.html')
    if os.path.exists(index_build):
        return send_from_directory(build_dir, 'index.html')

    target_public = os.path.join(public_dir, path)
    if os.path.exists(target_public) and os.path.isfile(target_public):
        return send_from_directory(public_dir, path)
    return send_from_directory(public_dir, 'index.html')

if __name__ == '__main__':
    # If you want to perform a one-time sync on startup, uncomment below:
    # _startup_sync()
    debug_env = os.getenv('FLASK_DEBUG', '').lower()
    debug = debug_env in ('1', 'true', 'yes')

    host = os.getenv('FLASK_RUN_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_RUN_PORT', 5000))
    app.run(host=host, port=port, debug=debug)
