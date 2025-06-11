# Flask application factory and shared utilities

import os
import random
from io import BytesIO
from datetime import timedelta
import requests
import re
import gridfs

from dotenv import load_dotenv

from flask import (
    Flask, jsonify, request, abort, session, send_file,
    send_from_directory, current_app
)
from werkzeug.exceptions import HTTPException
from flask_cors import CORS
from flask_wtf.csrf import generate_csrf
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity,
    set_access_cookies, unset_jwt_cookies, decode_token
)
from flask_jwt_extended.exceptions import JWTExtendedException
from flask_mail import Message
import bleach


try:
    from .. import config
    from ..config import get_db, ensure_indexes
    from ..extensions import jwt, sess, bcrypt, mail, csrf
except ImportError:  # Fallback for direct execution or tests
    import config
    from config import get_db, ensure_indexes
    from extensions import jwt, sess, bcrypt, mail, csrf


# Globals for easy mocking in tests
USERS = None
QUEST = None
COMPANIES = None
CQ = None
USER_META = None
FS = None

STATS_CACHE = {}
STATS_TTL_SECONDS = 60

PROB_API = "https://leetcode.com/api/problems/algorithms/"
GRAPHQL_API = "https://leetcode.com/graphql"
BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json, text/html",
    "Referer": "https://leetcode.com/",
    "Origin": "https://leetcode.com",
}
GRAPHQL_HEADERS = {
    "User-Agent": BROWSER_HEADERS["User-Agent"],
    "Content-Type": "application/json",
}


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
    if not user:
        return None
    user = dict(user)
    user['id'] = str(user.pop('_id'))
    photo_id = user.pop('profilePhotoId', None)
    user['profilePhoto'] = f"/api/profile/photo/{photo_id}" if photo_id else None
    return user


def _fetch_solved_slugs_via_list(session_cookie: str) -> set[str]:
    cookies = {"LEETCODE_SESSION": session_cookie}
    try:
        resp = requests.get(PROB_API, headers=BROWSER_HEADERS, cookies=cookies, timeout=10)
    except requests.RequestException as e:
        current_app.logger.error("Problems API request failed: %s", e)
        abort(502, description="Unable to contact LeetCode")

    try:
        resp.raise_for_status()
    except requests.HTTPError as e:
        current_app.logger.error(
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
        resp = requests.post(GRAPHQL_API, headers=GRAPHQL_HEADERS, json=payload, timeout=10)
    except requests.RequestException as e:
        current_app.logger.error("Tag request failed for %s: %s", slug, e)
        abort(502, description="Unable to contact LeetCode")

    try:
        resp.raise_for_status()
    except requests.HTTPError as e:
        current_app.logger.warning("Failed to fetch tags for %s: %s", slug, e)
        return []
    tags = resp.json().get("data", {}).get("question", {}).get("topicTags", [])
    return [t["name"] for t in tags]


def sync_leetcode(username: str, session_cookie: str, user_id: str) -> int:
    solved_slugs = _fetch_solved_slugs_via_list(session_cookie)

    slug_to_qid = {
        q["link"].rstrip("/").split("/")[-1]: str(q["_id"])
        for q in QUEST.find({}, {"_id": 1, "link": 1})
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


def create_app():
    """Application factory used by tests and production."""
    global USERS, QUEST, COMPANIES, CQ, USER_META, FS

    load_dotenv()
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    app = Flask(
        __name__,
        static_folder=os.path.join(base_dir, 'frontend', 'build', 'static'),
        template_folder=os.path.join(base_dir, 'frontend', 'build'),
    )
    app.config.from_object(config)

    sess.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    mail.init_app(app)
    csrf.init_app(app)
    CORS(app, supports_credentials=True, origins=app.config['CORS_ORIGINS'].split(','))

    db = get_db()
    if os.getenv("AUTO_INDEX", "False").lower() in ("true", "1", "yes"):
        try:
            ensure_indexes(db)
        except Exception as e:
            app.logger.warning("Index setup failed: %s", e)
    QUEST = db.questions
    COMPANIES = db.companies
    CQ = db.company_questions
    USER_META = db.user_meta
    USERS = db.users
    FS = gridfs.GridFS(db)

    @app.after_request
    def set_csrf_cookie(response):
        response.set_cookie(
            "csrf_token",
            generate_csrf(),
            secure=app.config.get("SESSION_COOKIE_SECURE", True),
            httponly=False,
            samesite="Lax",
        )
        return response

    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        response = jsonify({'error': e.name, 'description': e.description})
        return response, e.code

    @app.errorhandler(Exception)
    def handle_exception(e):
        app.logger.exception("Unhandled exception")
        return jsonify({'error': 'Internal Server Error'}), 500

    from .auth import auth_bp
    from .profile import profile_bp
    from .admin import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(admin_bp)

    return app


# Convenience for gunicorn / scripts
app = create_app()
