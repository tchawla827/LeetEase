"""Authentication related routes."""

from flask import Blueprint, jsonify, request, abort, session, current_app
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity,
    set_access_cookies, unset_jwt_cookies, decode_token
)
import re
from bson import ObjectId
from flask_jwt_extended.exceptions import JWTExtendedException
from flask_mail import Message
from datetime import timedelta
import threading
import requests

from . import USERS, bcrypt, mail
from . import sanitize_text, generate_otp, serialize_user, sync_leetcode

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = sanitize_text((data.get('email') or '').strip().lower())
    password = data.get('password')
    first_name = sanitize_text((data.get('firstName') or '').strip())
    last_name = sanitize_text((data.get('lastName') or '').strip())
    college = sanitize_text((data.get('college') or '').strip())
    leetcode_username = sanitize_text((data.get('leetcodeUsername') or '').strip())

    if not (email and password and first_name):
        abort(400, description='First name, email, and password are required')

    email_regex = r'^[^@\s]+@[^@\s]+\.[^@\s]+$'
    if not re.match(email_regex, email):
        abort(400, description='Invalid email format')

    if USERS.find_one({'email': email}):
        abort(400, description='Email already registered')

    otp = generate_otp()
    session['reg_data'] = {
        'email': email,
        'password': password,
        'firstName': first_name,
        'lastName': last_name or None,
        'college': college or None,
        'leetcodeUsername': leetcode_username or None
    }
    session['otp'] = otp

    msg = Message('Your Registration OTP', recipients=[email])
    msg.body = f"Your registration OTP is {otp}"
    mail.send(msg)
    return jsonify({'msg': 'OTP sent via email'}), 200


@auth_bp.route('/verify', methods=['POST'])
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
        'lastName': reg.get('lastName'),
        'college': reg.get('college'),
        'leetcode_username': reg.get('leetcodeUsername'),
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
    })
    return jsonify({'msg': 'Registration complete'}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    if not (data.get('email') and data.get('password')):
        abort(400, description='Email and password required')

    email = (data.get('email') or '').strip().lower()
    password = data.get('password')
    user = USERS.find_one({'email': email})
    if not user or not bcrypt.check_password_hash(user['password'], password):
        abort(401, description='Bad email or password')

    token = create_access_token(identity=str(user['_id']))
    resp = jsonify({'msg': 'Login successful'})
    set_access_cookies(resp, token)

    def _bg_sync(u, s, uid):
        try:
            sync_leetcode(u, s, uid)
        except Exception as e:
            current_app.logger.warning("Background sync failed for %s: %s", uid, e)

    uname = user.get('leetcode_username')
    sc = user.get('leetcode_session')
    if uname and sc:
        threading.Thread(target=_bg_sync, args=(uname, sc, str(user['_id'])), daemon=True).start()

    return resp, 200


@auth_bp.route('/google', methods=['POST'])
def google_login():
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
        current_app.logger.error('Google token verify failed: %s', e)
        abort(400, description='Invalid Google token')

    info = r.json() or {}
    if info.get('aud') != current_app.config.get('GOOGLE_CLIENT_ID'):
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


@auth_bp.route('/logout', methods=['POST'])
def logout():
    resp = jsonify({'msg': 'Logout successful'})
    unset_jwt_cookies(resp)
    session.clear()
    return resp, 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    uid = get_jwt_identity()
    user = USERS.find_one({'_id': ObjectId(uid)}, {'password': 0})
    if not user:
        abort(404, description='User not found')
    return jsonify(serialize_user(user)), 200


@auth_bp.route('/forgot-password', methods=['POST'])
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
    if current_app.config.get('FRONTEND_URL'):
        link = f"{current_app.config['FRONTEND_URL'].rstrip('/')}/reset-password?token={reset_token}"
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


@auth_bp.route('/reset-password', methods=['POST'])
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

