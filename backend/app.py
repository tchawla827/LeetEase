# backend/app.py

import os
import random
import csv
from datetime import timedelta
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

# Initialize extensions
sess.init_app(app)
jwt.init_app(app)
bcrypt.init_app(app)
mail.init_app(app)

# Collections (normalized)
db = get_db()
QUEST       = db.questions            # canonical questions
COMPANIES   = db.companies            # company list
CQ          = db.company_questions    # join: company × bucket × question
USER_META   = db.user_meta            # per-user metadata
USERS       = db.users                # auth users

# Helpers
def to_json(doc):
    """Convert Mongo doc _id → id string."""
    doc['id'] = str(doc.pop('_id'))
    return doc

def generate_otp():
    return f"{random.randint(100000, 999999)}"


# ----------------------------
# Authentication Endpoints
# ----------------------------

@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    if not (email and password):
        abort(400, description='Email and password are required')

    if USERS.find_one({'email': email}):
        abort(400, description='Email already registered')

    otp = generate_otp()
    session['reg_data'] = {'email': email, 'password': password}
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
    user_doc = {'email': reg['email'], 'password': pw_hash, 'role': 'user'}
    USERS.insert_one(user_doc)
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

    user = USERS.find_one({'_id': ObjectId(uid)})
    if not user:
        abort(404, description='User not found')

    pw_hash = bcrypt.generate_password_hash(data.get('newPassword')).decode('utf-8')
    USERS.update_one({'_id': ObjectId(uid)}, {'$set': {'password': pw_hash}})
    return jsonify({'msg': 'Password has been reset'}), 200


# ----------------------------
# Health-check for front-end auth
# ----------------------------
@app.route('/api/ping', methods=['GET'])
@jwt_required()
def ping():
    return jsonify({'msg': 'pong'}), 200


# ----------------------------
# Admin: CSV Import into normalized schema
# ----------------------------
@app.route('/api/import', methods=['POST'])
@jwt_required()
def import_questions():
    uid = get_jwt_identity()
    user = USERS.find_one({'_id': ObjectId(uid)})
    if user.get('role') != 'admin':
        abort(403, description='Only admin can import questions')

    if 'file' not in request.files:
        abort(400, description='CSV file required')
    data = request.files['file'].stream.read().decode('utf-8').splitlines()
    reader = csv.DictReader(data)

    created = 0
    for row in reader:
        # canonical upsert
        q_doc = {
            'link': row['link'],
            'title': row['title'],
            'leetDifficulty': row.get('leetDifficulty')
        }
        q_res = QUEST.find_one_and_update(
            {'link': q_doc['link']},
            {'$setOnInsert': q_doc},
            upsert=True,
            return_document=True
        )
        qid = q_res['_id']

        # company upsert
        co_res = COMPANIES.find_one_and_update(
            {'name': row['company']},
            {'$setOnInsert': {'name': row['company']}},
            upsert=True,
            return_document=True
        )
        cid = co_res['_id']

        # join upsert
        CQ.replace_one(
            {
                'company_id': cid,
                'question_id': qid,
                'bucket': row['bucket']
            },
            {
                'company_id': cid,
                'question_id': qid,
                'bucket': row['bucket'],
                'frequency': float(row.get('frequency', 0)),
                'acceptanceRate': float(row.get('acceptanceRate', 0))
            },
            upsert=True
        )
        created += 1

    return jsonify({'imported': created}), 201


# ----------------------------
# Public listings (with per-user metadata)
# ----------------------------

@app.route('/api/companies', methods=['GET'])
@jwt_required()
def list_companies():
    names = COMPANIES.distinct('name')
    return jsonify(names), 200

@app.route('/api/companies/<company>/buckets', methods=['GET'])
@jwt_required()
def list_buckets(company):
    co = COMPANIES.find_one({'name': company})
    if not co:
        abort(404, description=f"No company '{company}'")
    buckets = CQ.distinct('bucket', {'company_id': co['_id']})
    return jsonify(buckets), 200

@app.route('/api/companies/<company>/buckets/<bucket>/questions', methods=['GET'])
@jwt_required()
def list_questions(company, bucket):
    co = COMPANIES.find_one({'name': company})
    if not co:
        abort(404, description=f"No company '{company}'")
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 50))
    skip = (page - 1) * limit

    # match stage
    match = {'company_id': co['_id'], 'bucket': bucket}
    search = request.args.get('search')
    # aggregate pipeline
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

    # sorting
    sf = request.args.get('sortField')
    so = request.args.get('sortOrder', 'asc')
    field_map = {
        'title': 'q.title',
        'frequency': 'frequency',
        'acceptanceRate': 'acceptanceRate',
        'leetDifficulty': 'q.leetDifficulty'
    }
    if sf in field_map:
        dir = 1 if so == 'asc' else -1
        pipeline.append({'$sort': {field_map[sf]: dir}})

    # count total (without skip/limit)
    count_pipe = pipeline + [{'$count': 'count'}]
    cnt_res = list(CQ.aggregate(count_pipe))
    total = cnt_res[0]['count'] if cnt_res else 0

    # apply pagination
    pipeline += [{'$skip': skip}, {'$limit': limit}]

    docs = list(CQ.aggregate(pipeline))

    # attach user_meta and serialize
    uid = get_jwt_identity()
    out = []
    for doc in docs:
        q = doc['q']
        q_json = {
            'id': str(q['_id']),
            'title': q['title'],
            'link': q['link'],
            'frequency': doc.get('frequency'),
            'acceptanceRate': doc.get('acceptanceRate'),
            'leetDifficulty': q.get('leetDifficulty'),
        }
        meta = USER_META.find_one({'user_id': uid, 'question_id': q_json['id']})
        q_json['solved'] = meta.get('solved', False) if meta else False
        q_json['userDifficulty'] = meta.get('userDifficulty') if meta else None
        out.append(q_json)

    return jsonify({'data': out, 'total': total}), 200

@app.route('/api/questions/<qid>', methods=['PATCH'])
@jwt_required()
def update_question(qid):
    uid = get_jwt_identity()
    data = request.get_json() or {}

    # Only allow these fields
    allowed = {'solved', 'userDifficulty'}
    updates = {k: data[k] for k in allowed if k in data}
    if not updates:
        abort(400, description='No valid fields to update')

    # Upsert the per-user metadata
    USER_META.update_one(
        {'user_id': uid, 'question_id': qid},
        {'$set': updates},
        upsert=True
    )

    # Fetch the fresh doc
    raw = USER_META.find_one({'user_id': uid, 'question_id': qid})
    if not raw:
        abort(404, description='Metadata not found')

    # Build a JSON-safe dict
    meta = {
        'id':              str(raw.pop('_id')),
        'user_id':         raw.get('user_id'),
        'question_id':     raw.get('question_id'),
        'solved':          raw.get('solved', False),
        'userDifficulty':  raw.get('userDifficulty')
    }

    return jsonify(meta), 200



if __name__ == '__main__':
    app.run(debug=True)
