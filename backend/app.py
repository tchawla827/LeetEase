# backend/app.py  – LeetEase ©2025
import os
import random
import csv
from datetime import timedelta

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request, abort, session
from bson import ObjectId

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

# ─── LeetCode sync via /api/problems/algorithms ────────────────────────────
PROB_API       = "https://leetcode.com/api/problems/algorithms/"
BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept":     "application/json, text/html",
    "Referer":    "https://leetcode.com/",
    "Origin":     "https://leetcode.com"
}

def _fetch_solved_slugs_via_list(session_cookie: str) -> set[str]:
    """
    Fetch the full problem list; each entry's 'status' == 'ac'
    means the current (logged-in) user has solved it.
    """
    cookies = {"LEETCODE_SESSION": session_cookie}
    resp = requests.get(PROB_API, headers=BROWSER_HEADERS, cookies=cookies, timeout=10)
    try:
        resp.raise_for_status()
    except requests.HTTPError as e:
        app.logger.error("Problems API error %s: %s", resp.status_code, resp.text[:200])
        abort(502, description="Failed to fetch LeetCode problem list: " + str(e))

    data = resp.json().get("stat_status_pairs", [])
    slugs = {
        p["stat"]["question__title_slug"]
        for p in data
        if p.get("status") == "ac"
    }
    return slugs

def sync_leetcode(username: str, session_cookie: str, user_id: str) -> int:
    """
    Mark all 'ac' slugs in USER_META as solved.
    Returns how many were updated.
    """
    solved_slugs = _fetch_solved_slugs_via_list(session_cookie)

    # Build slug → our question _id map
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
    email     = data.get('email')
    password  = data.get('password')
    firstName = data.get('firstName')
    lastName  = data.get('lastName')
    college   = data.get('college')  # optional

    if not (email and password and firstName and lastName):
        abort(400, description='Email, password, first name and last name are required')
    if USERS.find_one({'email': email}):
        abort(400, description='Email already registered')

    otp = generate_otp()
    session['reg_data'] = {
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
        'college': college
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
        'email': reg['email'],
        'password': pw_hash,
        'role': 'user',
        'firstName': reg['firstName'],
        'lastName': reg['lastName'],
        'college': reg.get('college')
    })
    return jsonify({'msg': 'Registration complete'}), 201

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    if not (data.get('email') and data.get('password')):
        abort(400, description='Email and password required')

    user = USERS.find_one({'email': data['email']})
    if not user or not bcrypt.check_password_hash(user['password'], data['password']):
        abort(401, description='Bad email or password')

    token = create_access_token(identity=str(user['_id']))
    resp = jsonify({'msg': 'Login successful'})
    set_access_cookies(resp, token)
    return resp, 200

@app.route('/auth/logout', methods=['POST'])
@jwt_required()
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
    user = USERS.find_one({'email': data.get('email')})
    if not user:
        abort(400, description='Email not found')

    reset_token = create_access_token(
        identity=str(user['_id']),
        expires_delta=timedelta(minutes=15)
    )
    msg = Message('Password Reset Token', recipients=[user['email']])
    msg.body = f"Your reset token: {reset_token}\nExpires in 15 minutes."
    mail.send(msg)
    return jsonify({'msg': 'Password reset token sent via email'}), 200

@app.route('/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    try:
        decoded = decode_token(data.get('token'))
        uid = decoded['sub']
    except:
        abort(400, description='Invalid or expired token')

    pw_hash = bcrypt.generate_password_hash(data.get('newPassword')).decode('utf-8')
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
        uid
    )
    return jsonify({'synced': synced}), 200

# =============================================================================
# Health-check
# =============================================================================
@app.route('/api/ping', methods=['GET'])
@jwt_required()
def ping():
    return jsonify({'msg': 'pong'}), 200

# =============================================================================
# Admin CSV import
# =============================================================================
@app.route('/api/import', methods=['POST'])
@jwt_required()
def import_questions():
    uid  = get_jwt_identity()
    user = USERS.find_one({'_id': ObjectId(uid)})
    if user.get('role') != 'admin':
        abort(403, description='Only admin can import questions')

    if 'file' not in request.files:
        abort(400, description='CSV file required')
    lines  = request.files['file'].stream.read().decode('utf-8').splitlines()
    reader = csv.DictReader(lines)
    created = 0
    for row in reader:
        q_res = QUEST.find_one_and_update(
            {'link': row['link']},
            {'$setOnInsert': {
                'link':           row['link'],
                'title':          row['title'],
                'leetDifficulty': row.get('leetDifficulty')
            }},
            upsert=True,
            return_document=True
        )
        qid = q_res['_id']

        co_res = COMPANIES.find_one_and_update(
            {'name': row['company']},
            {'$setOnInsert': {'name': row['company']}},
            upsert=True,
            return_document=True
        )
        cid = co_res['_id']

        CQ.replace_one(
            {'company_id': cid, 'question_id': qid, 'bucket': row['bucket']},
            {
                'company_id':    cid,
                'question_id':   qid,
                'bucket':        row['bucket'],
                'frequency':     float(row.get('frequency', 0)),
                'acceptanceRate': float(row.get('acceptanceRate', 0))
            },
            upsert=True
        )
        created += 1

    return jsonify({'imported': created}), 201

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

@app.route('/api/companies/<company>/buckets/<bucket>/questions', methods=['GET'])
@jwt_required()
def list_questions(company, bucket):
    co = COMPANIES.find_one({'name': company})
    if not co:
        abort(404, description=f"No company '{company}'")

    page  = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 50))
    skip  = (page - 1) * limit
    search = request.args.get('search')

    match = {'company_id': co['_id'], 'bucket': bucket}
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
    if search:
        pipeline.append({'$match': {'q.title': {'$regex': search, '$options': 'i'}}})

    sf = request.args.get('sortField')
    so = request.args.get('sortOrder', 'asc')
    field_map = {
        'title':          'q.title',
        'frequency':      'frequency',
        'acceptanceRate': 'acceptanceRate',
        'leetDifficulty': 'q.leetDifficulty'
    }
    if sf in field_map:
        pipeline.append({'$sort': {field_map[sf]: 1 if so == 'asc' else -1}})

    cnt = list(CQ.aggregate(pipeline + [{'$count': 'c'}]))
    total = cnt[0]['c'] if cnt else 0

    pipeline += [{'$skip': skip}, {'$limit': limit}]
    docs = list(CQ.aggregate(pipeline))

    uid = get_jwt_identity()
    out = []
    for doc in docs:
        q = doc['q']
        itm = {
            'id':             str(q['_id']),
            'title':          q['title'],
            'link':           q['link'],
            'frequency':      doc.get('frequency'),
            'acceptanceRate': doc.get('acceptanceRate'),
            'leetDifficulty': q.get('leetDifficulty'),
        }
        meta = USER_META.find_one({'user_id': uid, 'question_id': itm['id']})
        itm['solved']         = meta.get('solved', False) if meta else False
        itm['userDifficulty'] = meta.get('userDifficulty') if meta else None
        out.append(itm)

    return jsonify({'data': out, 'total': total}), 200

@app.route('/api/questions/<qid>', methods=['PATCH'])
@jwt_required()
def update_question(qid):
    uid  = get_jwt_identity()
    data = request.get_json() or {}

    allowed = {'solved', 'userDifficulty'}
    updates = {k: data[k] for k in allowed if k in data}
    if not updates:
        abort(400, description='No valid fields to update')

    USER_META.update_one(
        {'user_id': uid, 'question_id': qid},
        {'$set': updates},
        upsert=True
    )

    raw = USER_META.find_one({'user_id': uid, 'question_id': qid})
    if not raw:
        abort(404, description='Metadata not found')

    return jsonify({
        'id':             str(raw.pop('_id')),
        'user_id':        raw.get('user_id'),
        'question_id':    raw.get('question_id'),
        'solved':         raw.get('solved', False),
        'userDifficulty': raw.get('userDifficulty')
    }), 200

# ─── Run ──────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    app.run(debug=True)
