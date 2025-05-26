# ./.venv/Scripts/Activate                             
# python app.py

import os
from flask import Flask, jsonify, request, abort
from dotenv import load_dotenv
from bson import ObjectId
from config import get_db

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)
db = get_db()
questions = db.questions

def to_json(doc):
    """
    Convert a MongoDB document to a JSON-serializable dict:
     - rename `_id` → `id`
     - remove the original `_id` field
    """
    doc["id"] = str(doc.pop("_id"))
    return doc

@app.route("/api/ping", methods=["GET"])
def ping():
    """Health-check endpoint."""
    return jsonify({"msg": "pong"}), 200

@app.route("/api/db-test", methods=["GET"])
def db_test():
    """Quick MongoDB connectivity test: return one sample question."""
    sample = questions.find_one()
    if not sample:
        abort(500, description="No documents found in `questions` collection")
    return jsonify(to_json(sample)), 200

@app.route("/api/companies", methods=["GET"])
def list_companies():
    """
    GET /api/companies
    → Returns a list of all distinct company names.
    """
    companies = questions.distinct("company")
    return jsonify(companies), 200

@app.route("/api/companies/<company>/buckets", methods=["GET"])
def list_buckets(company):
    """
    GET /api/companies/<company>/buckets
    → Returns the list of buckets (e.g. 30Days, 3Months, …) for that company.
    """
    buckets = questions.distinct("bucket", {"company": company})
    if not buckets:
        abort(404, description=f"No buckets found for company `{company}`")
    return jsonify(buckets), 200

@app.route("/api/companies/<company>/buckets/<bucket>/questions", methods=["GET"])
def list_questions(company, bucket):
    """
    GET /api/companies/<company>/buckets/<bucket>/questions
    Query params:
       - page (1-based, default 1)
       - limit (items per page, default 50)
       - sortField (optional; one of: title, frequency, acceptanceRate, leetDifficulty)
       - sortOrder (optional; asc or desc; default asc)
    → Returns a JSON object { data: [...], total: N } where `data` is the requested
      page of questions (sorted if requested) and `total` is the total matching count.
    """
    # --- 1) Parse & validate pagination params ---
    try:
        page  = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 50))
    except ValueError:
        abort(400, description="`page` and `limit` must be integers")

    if page < 1 or limit < 1:
        abort(400, description="`page` and `limit` must be positive integers")

    skip = (page - 1) * limit

    # --- 2) Parse & validate sorting params ---
    field_map = {
        "title":          "title",
        "frequency":      "frequency",
        "acceptanceRate": "acceptanceRate",
        "leetDifficulty": "leetDifficulty"
    }
    sort_field = request.args.get("sortField")
    sort_order = request.args.get("sortOrder", "asc").lower()
    sort_spec  = None

    if sort_field:
        if sort_field not in field_map:
            abort(
                400,
                description=(
                    f"Invalid `sortField` (“{sort_field}”). "
                    f"Must be one of: {', '.join(field_map.keys())}"
                )
            )
        direction = 1 if sort_order == "asc" else -1
        sort_spec = [(field_map[sort_field], direction)]

    # --- 3) Build base filter & total count ---
    base_filter = {"company": company, "bucket": bucket}
    total = questions.count_documents(base_filter)

    # --- 4) Fetch the requested page, applying sort if any ---
    cursor = questions.find(base_filter)
    if sort_spec:
        cursor = cursor.sort(sort_spec)
    cursor = cursor.skip(skip).limit(limit)

    page_data = [to_json(doc) for doc in cursor]

    return jsonify({
        "data":  page_data,
        "total": total
    }), 200

@app.route("/api/questions/<id>", methods=["PATCH"])
def update_question(id):
    """
    PATCH /api/questions/<id>
    Body JSON: { "solved": true|false, "userDifficulty": "Easy"|"Medium"|"Hard" }
    Marks ALL questions sharing the same `link` as updated.
    Returns the array of updated question documents.
    """
    data = request.get_json() or {}
    allowed = {"solved", "userDifficulty"}
    update_fields = {k: data[k] for k in allowed if k in data}

    if not update_fields:
        abort(400, description=f"Only these fields can be updated: {allowed}")

    # Lookup original by ObjectId
    try:
        orig = questions.find_one({"_id": ObjectId(id)})
    except:
        abort(400, description="Invalid question ID")

    if not orig:
        abort(404, description="Question not found")

    link_key = orig.get("link")
    if not link_key:
        abort(400, description="Original question has no link field")

    # Update all docs with that link
    questions.update_many(
        {"link": link_key},
        {"$set": update_fields}
    )

    # Return all updated docs
    updated = questions.find({"link": link_key})
    return jsonify([to_json(doc) for doc in updated]), 200

if __name__ == "__main__":
    # Default: listen on 127.0.0.1:5000 with debug on
    app.run(debug=True)
