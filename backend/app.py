# backend/app.py  – LeetEase ©2025

import os
import random
import csv
import threading
import time
from io import BytesIO
from datetime import timedelta, datetime

import requests
import re
from dotenv import load_dotenv
from flask import (
    Flask, jsonify, request, abort,
    session, send_from_directory, current_app
)
from bson import ObjectId

# ─── New imports for CSV/Excel parsing ─────────────────────────────────
import pandas as pd
from pandas.errors import EmptyDataError

import config
from config import get_db
from extensions import jwt, sess, bcrypt, mail
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    set_access_cookies,
    unset_jwt_cookies,
    decode_token,
)
from flask_mail import Message

load_dotenv()
app = Flask(__name__)
app.config.from_object(config)

# Ensure upload folder exists
os.makedirs(
    app.config.get('UPLOAD_FOLDER',
                   os.path.join(os.getcwd(), 'uploads', 'profile_photos')),
    exist_ok=True
)

# ─── Initialize extensions ────────────────────────────────────────────────
sess.init_app(app)
jwt.init_app(app)
bcrypt.init_app(app)
mail.init_app(app)

# ─── MongoDB collections ───────────────────────────────────────────────────
db        = get_db()
QUEST     = db.questions
COMPANIES = db.companies
CQ        = db.company_questions
USER_META = db.user_meta
USERS     = db.users

# ─── Helpers ──────────────────────────────────────────────────────────────
def to_json(doc):
    doc['id'] = str(doc.pop('_id'))
    return doc

def generate_otp() -> str:
    return f"{random.randint(100_000, 999_999)}"

def allowed_file(filename):
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in getattr(config, 'ALLOWED_EXTENSIONS', {'png','jpg','jpeg','gif'})

# ─── Route to serve profile photos ────────────────────────────────────────
@app.route('/uploads/profile_photos/<filename>')
@jwt_required()
def serve_profile_photo(filename):
    """Serve a saved profile photo from the upload folder."""
    upload_folder = current_app.config.get('UPLOAD_FOLDER')
    return send_from_directory(upload_folder, filename)

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
    resp = requests.get(PROB_API, headers=BROWSER_HEADERS, cookies=cookies, timeout=10)
    try:
        resp.raise_for_status()
    except requests.HTTPError as e:
        app.logger.error("Problems API error %s: %s", resp.status_code, resp.text[:200])
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
    resp = requests.post(GRAPHQL_API, headers=GRAPHQL_HEADERS, json=payload, timeout=10)
    try:
        resp.raise_for_status()
    except requests.HTTPError as e:
        app.logger.warning("Failed to fetch tags for %s: %s", slug, e)
        return []
    tags = resp.json().get("data", {}).get("question", {}).get("topicTags", [])
    return [t["name"] for t in tags]

def sync_leetcode(username: str, session_cookie: str, user_id: str) -> int:
    solved_slugs = _fetch_solved_slugs_via_list(session_cookie)

    slug_to_qid = {
        q["link"].rstrip("/").split("/")[-1]: str(q["_id"])
        for q in QUEST.find({}, {"_id":1,"link":1})
    }

    updated = 0
    for slug in solved_slugs:
        qid = slug_to_qid.get(slug)
        if not qid:
            continue
        USER_META.update_one(
            {"user_id": user_id, "question_id": qid},
            {"$set": {"solved": True}},
            upsert=True
        )
        updated += 1
    return updated

# =============================================================================
# Authentication & User Management
# =============================================================================
@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email             = (data.get('email') or '').strip().lower()
    password          = data.get('password')
    first_name        = (data.get('firstName') or '').strip()
    last_name         = (data.get('lastName') or '').strip()
    college           = (data.get('college') or '').strip()
    leetcode_username = (data.get('leetcodeUsername') or '').strip()

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
        'profilePhoto':      None,
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
    user['id'] = str(user.pop('_id'))
    return jsonify(user), 200

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
    except:
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
    user['id'] = str(user.pop('_id'))
    return jsonify(user), 200

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
        new_first = (data.get('firstName') or '').strip()
        if not new_first:
            abort(400, description='First name cannot be empty')
        update['firstName'] = new_first

    # lastName (optional)
    if 'lastName' in data:
        update['lastName'] = (data.get('lastName') or '').strip() or None

    # college (optional)
    if 'college' in data:
        update['college'] = (data.get('college') or '').strip() or None

    # email (required & unique if changed)
    if 'email' in data:
        new_email = (data.get('email') or '').strip().lower()
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
    updated_user['id'] = str(updated_user.pop('_id'))
    return jsonify(updated_user), 200

@app.route('/profile/account/photo', methods=['POST'])
@jwt_required()
def upload_profile_photo():
    """
    Upload (or replace) a profile photo. Expects multipart-form data with 'photo' field.
    Saves the file as <userId>.<ext> in UPLOAD_FOLDER and updates the 'profilePhoto' URL in the user doc.
    """
    uid = get_jwt_identity()
    if 'photo' not in request.files:
        abort(400, description='No file part in the request')
    file = request.files['photo']
    if file.filename == '':
        abort(400, description='No selected file')
    if not allowed_file(file.filename):
        abort(400, description='File type not allowed')

    # Save the file under a deterministic name: <userId>.<ext>
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uid}.{ext}"
    upload_folder = app.config.get('UPLOAD_FOLDER')
    filepath = os.path.join(upload_folder, filename)
    try:
        file.save(filepath)
    except Exception as e:
        app.logger.error("Failed to save profile photo: %s", e)
        abort(500, description='Failed to save photo')

    # Construct a URL for serving the photo
    photo_url = f"/uploads/profile_photos/{filename}"
    USERS.update_one({'_id': ObjectId(uid)}, {'$set': {'profilePhoto': photo_url}})
    return jsonify({'profilePhotoUrl': photo_url}), 200

@app.route('/profile/account/photo', methods=['DELETE'])
@jwt_required()
def delete_profile_photo():
    """
    Remove the existing profile photo (if any). Deletes the file from disk and unsets 'profilePhoto'.
    """
    uid = get_jwt_identity()
    user = USERS.find_one({'_id': ObjectId(uid)}, {'profilePhoto': 1})
    if not user:
        abort(404, description='User not found')

    photo_url = user.get('profilePhoto')
    if photo_url:
        # Extract filename from URL
        filename = photo_url.split('/')[-1]
        upload_folder = app.config.get('UPLOAD_FOLDER')
        filepath = os.path.join(upload_folder, filename)
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception as e:
            app.logger.warning("Could not delete photo file %s: %s", filepath, e)
    # Unset in database regardless
    USERS.update_one({'_id': ObjectId(uid)}, {'$unset': {'profilePhoto': ""}})
    return jsonify({'msg': 'Profile photo removed'}), 200

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
    for q in cursor:
        slug = q['link'].rstrip('/').split('/')[-1]
        tags = fetch_leetcode_tags(slug)
        QUEST.update_one({'_id': q['_id']}, {'$set': {'tags': tags}})
        time.sleep(0.2)

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
    if bucket != 'All':
        match['bucket'] = bucket

    pipeline = [
        {'$match': match},
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
    if bucket != 'All':
        match['bucket'] = bucket

    pipeline = [
        {'$match': match},
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
    out = []
    for doc in results:
        q = doc['q']
        meta_query = {
            'user_id': uid,
            'question_id': str(q['_id'])
        }
        if bucket != 'All':
            meta_query.update({'company_id': co['_id'], 'bucket': bucket})
        else:
            meta_query.update({'company_id': co['_id']})
        meta = USER_META.find_one(meta_query)
        if not meta:
            meta = USER_META.find_one({'user_id': uid, 'question_id': str(q['_id'])})
        solved = meta.get('solved', False) if meta else False
        if showUnsolved and solved:
            continue

        out.append({
            'id':             str(q['_id']),
            'title':          q['title'],
            'link':           q['link'],
            'frequency':      doc.get('frequency'),
            'acceptanceRate': doc.get('acceptanceRate'),
            'leetDifficulty': q.get('leetDifficulty'),
            'solved':         solved,
            'userDifficulty': meta.get('userDifficulty') if meta else None
        })

    return jsonify({'data': out, 'total': total}), 200

@app.route('/api/questions/<question_id>', methods=['PATCH'])
@jwt_required()
def update_question_meta(question_id):
    uid = get_jwt_identity()

    try:
        q_oid = ObjectId(question_id)
    except:
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

    USER_META.update_one(
        query,
        {'$set': update_fields | ({'company_id': company_id, 'bucket': bucket} if company_id else {})},
        upsert=True,
    )

    meta = USER_META.find_one(query)
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


    results = []
    for qid in ids:
        query = {'user_id': uid, 'question_id': qid}
        if company_id:
            query.update({'company_id': company_id, 'bucket': bucket})

        USER_META.update_one(
            query,
            {'$set': update_fields | ({'company_id': company_id, 'bucket': bucket} if company_id else {})},
            upsert=True,
        )
        meta = USER_META.find_one(query)
        results.append({
            'question_id':    qid,
            'solved':         meta.get('solved', False),
            'userDifficulty': meta.get('userDifficulty')
        })

    return jsonify(results), 200

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
    limit = int(request.args.get('limit', 4))

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

# ─── Run & Startup Sync ────────────────────────────────────────────────────
def _startup_sync():
    """Sync every user who has both handle & session saved."""
    for u in USERS.find({
        'leetcode_username': {'$exists': True},
        'leetcode_session':  {'$exists': True}
    }):
        try:
            sync_leetcode(u['leetcode_username'], u['leetcode_session'], str(u['_id']))
        except Exception as e:
            app.logger.warning("Startup sync failed for %s: %s", u['_id'], e)

if __name__ == '__main__':
    # If you want to perform a one-time sync on startup, uncomment below:
    # _startup_sync()
    debug_env = os.getenv('FLASK_DEBUG', '').lower()
    debug = debug_env in ('1', 'true', 'yes')
    app.run(debug=debug)
