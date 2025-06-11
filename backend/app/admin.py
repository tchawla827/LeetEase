"""Admin routes for importing and backfilling data."""

from concurrent.futures import ThreadPoolExecutor
from io import BytesIO

from bson import ObjectId
import concurrent.futures
from flask import Blueprint, jsonify, request, abort, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import pandas as pd
from pandas.errors import EmptyDataError

from . import COMPANIES, QUEST, CQ, USERS
from . import fetch_leetcode_tags

admin_bp = Blueprint('admin', __name__, url_prefix='/api')


@admin_bp.route('/import', methods=['POST'])
@jwt_required()
def import_questions():
    uid = get_jwt_identity()
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
            df = pd.read_excel(BytesIO(up_file.read()), engine='openpyxl')
        else:
            abort(400, description='Unsupported file type; only CSV/Excel')
    except (EmptyDataError, pd.errors.ParserError) as e:
        abort(400, description=f'Could not parse file: {e}')

    if df.empty:
        abort(400, description='Uploaded file contained no rows')

    df.columns = [c.strip().lower() for c in df.columns]

    required_cols = {'title', 'link', 'company', 'bucket'}
    if not required_cols.issubset(set(df.columns)):
        missing = required_cols - set(df.columns)
        abort(400, description=f'Missing required columns: {missing}')

    imported, skipped = 0, 0

    for _, row in df.iterrows():
        title = str(row.get('title') or '').strip()
        link = str(row.get('link') or row.get('url') or '').strip()
        company = str(row.get('company') or '').strip()
        bucket = str(row.get('bucket') or '').strip()

        if not (title and link and company and bucket):
            skipped += 1
            continue

        try:
            freq = float(row.get('frequency') or 0)
        except (ValueError, TypeError):
            freq = 0.0

        try:
            acc = float(row.get('acceptancerate') or 0)
        except (ValueError, TypeError):
            acc = 0.0

        ldiff = str(row.get('difficulty') or '').capitalize().strip()

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

        c_doc = COMPANIES.find_one_and_update(
            {'name': company},
            {'$setOnInsert': {'name': company}},
            upsert=True,
            return_document=True
        )
        cid = c_doc['_id']

        CQ.replace_one(
            {'company_id': cid, 'question_id': qid, 'bucket': bucket},
            {
                'company_id': cid,
                'question_id': qid,
                'bucket': bucket,
                'frequency': freq,
                'acceptanceRate': acc
            },
            upsert=True
        )
        imported += 1

    return jsonify({'imported': imported, 'skipped': skipped}), 201


@admin_bp.route('/admin/backfill-tags', methods=['POST'])
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
                current_app.logger.warning('Failed to backfill tags for %s: %s', qid, e)
                tags = []
            QUEST.update_one({'_id': qid}, {'$set': {'tags': tags}})

    return jsonify({'msg': 'Backfill complete'}), 200

