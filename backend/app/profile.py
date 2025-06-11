"""Profile and photo related routes."""

from io import BytesIO
import re
from flask import Blueprint, jsonify, request, abort, current_app, send_file
from . import bcrypt
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from bson.errors import InvalidId
import gridfs

from . import USERS, FS
from . import sanitize_text, allowed_file, serialize_user, sync_leetcode

profile_bp = Blueprint('profile', __name__)


@profile_bp.route('/profile/leetcode', methods=['POST'])
@jwt_required()
def save_leetcode_profile():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    session_cookie = (data.get('sessionCookie') or '').strip()
    if not (username and session_cookie):
        abort(400, description='Both username and sessionCookie are required')

    uid = get_jwt_identity()
    USERS.update_one(
        {'_id': ObjectId(uid)},
        {'$set': {
            'leetcode_username': username,
            'leetcode_session': session_cookie
        }}
    )
    return jsonify({'msg': 'LeetCode profile saved'}), 200


@profile_bp.route('/profile/leetcode/sync', methods=['POST'])
@jwt_required()
def manual_leetcode_sync():
    uid = get_jwt_identity()
    user = USERS.find_one({'_id': ObjectId(uid)})
    if not user or not user.get('leetcode_username') or not user.get('leetcode_session'):
        abort(400, description='Username & sessionCookie must be set first')

    synced = sync_leetcode(
        user['leetcode_username'],
        user['leetcode_session'],
        str(uid)
    )

    return jsonify({'synced': synced}), 200


@profile_bp.route('/profile/settings', methods=['PATCH'])
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


@profile_bp.route('/profile/account', methods=['GET'])
@jwt_required()
def get_account_profile():
    uid = get_jwt_identity()
    user = USERS.find_one({'_id': ObjectId(uid)}, {'password': 0})
    if not user:
        abort(404, description='User not found')
    return jsonify(serialize_user(user)), 200


@profile_bp.route('/profile/account', methods=['PATCH'])
@jwt_required()
def update_account_profile():
    uid = get_jwt_identity()
    data = request.get_json() or {}
    update = {}

    if 'firstName' in data:
        new_first = sanitize_text((data.get('firstName') or '').strip())
        if not new_first:
            abort(400, description='First name cannot be empty')
        update['firstName'] = new_first

    if 'lastName' in data:
        update['lastName'] = sanitize_text((data.get('lastName') or '').strip()) or None

    if 'college' in data:
        update['college'] = sanitize_text((data.get('college') or '').strip()) or None

    if 'email' in data:
        new_email = sanitize_text((data.get('email') or '').strip().lower())
        if not new_email:
            abort(400, description='Email cannot be empty')
        email_regex = r'^[^@\s]+@[^@\s]+\.[^@\s]+$'
        if not re.match(email_regex, new_email):
            abort(400, description='Invalid email format')
        existing = USERS.find_one({'email': new_email})
        if existing and str(existing['_id']) != uid:
            abort(400, description='Email is already in use')
        update['email'] = new_email

    if 'newPassword' in data:
        new_pw = data.get('newPassword')
        if not new_pw or len(new_pw) < 8:
            abort(400, description='New password must be at least 8 characters')
        pw_hash = bcrypt.generate_password_hash(new_pw).decode('utf-8')
        update['password'] = pw_hash

    if not update:
        abort(400, description='No valid fields to update')

    USERS.update_one({'_id': ObjectId(uid)}, {'$set': update})
    updated_user = USERS.find_one({'_id': ObjectId(uid)}, {'password': 0})
    return jsonify(serialize_user(updated_user)), 200


@profile_bp.route('/profile/account/photo', methods=['POST'])
@jwt_required()
def upload_profile_photo():
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
        old = USERS.find_one({'_id': ObjectId(uid)}, {'profilePhotoId': 1})
        if old and old.get('profilePhotoId'):
            try:
                FS.delete(old['profilePhotoId'])
            except Exception as e:
                current_app.logger.warning("Could not delete old photo %s: %s", old['profilePhotoId'], e)

        file_id = FS.put(file.stream, filename=filename, content_type=file.content_type)
    except Exception as e:
        current_app.logger.error("Failed to save profile photo: %s", e)
        abort(500, description='Failed to save photo')

    USERS.update_one({'_id': ObjectId(uid)}, {'$set': {'profilePhotoId': file_id}})
    photo_url = f"/api/profile/photo/{file_id}"
    return jsonify({'profilePhotoUrl': photo_url}), 200


@profile_bp.route('/profile/account/photo', methods=['DELETE'])
@jwt_required()
def delete_profile_photo():
    uid = get_jwt_identity()
    user = USERS.find_one({'_id': ObjectId(uid)}, {'profilePhotoId': 1})
    if not user:
        abort(404, description='User not found')

    photo_id = user.get('profilePhotoId')
    if photo_id:
        try:
            FS.delete(photo_id)
        except Exception as e:
            current_app.logger.warning("Could not delete photo file %s: %s", photo_id, e)

    USERS.update_one({'_id': ObjectId(uid)}, {'$unset': {'profilePhotoId': ""}})
    return jsonify({'msg': 'Profile photo removed'}), 200


@profile_bp.route('/api/profile/photo/<file_id>', methods=['GET'])
@jwt_required()
def get_profile_photo(file_id):
    try:
        oid = ObjectId(file_id)
    except (InvalidId, TypeError):
        abort(400, description='Invalid file id')
    try:
        grid_out = FS.get(oid)
    except gridfs.NoFile:
        abort(404, description='File not found')
    return send_file(BytesIO(grid_out.read()), mimetype=grid_out.content_type)

