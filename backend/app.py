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
    """Quick MongoDB connectivity test: list your database’s collections."""
    colls = db.list_collection_names()
    return jsonify({"collections": colls}), 200

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
    → Returns the 5 buckets (e.g. 30Days, 3Months, …, All) available for that company.
    """
    buckets = questions.distinct("bucket", {"company": company})
    if not buckets:
        abort(404, description="Company not found")
    return jsonify(buckets), 200

@app.route("/api/companies/<company>/buckets/<bucket>/questions", methods=["GET"])
def list_questions(company, bucket):
    """
    GET /api/companies/<company>/buckets/<bucket>/questions
    Query params:
       - page (1-based, default 1)
       - limit (items per page, default 50)
    → Returns a paginated list of questions for a given company + bucket.
    """
    # Parse pagination parameters
    try:
        page  = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 50))
    except ValueError:
        abort(400, description="`page` and `limit` must be integers")

    if page < 1 or limit < 1:
        abort(400, description="`page` and `limit` must be positive integers")

    skip = (page - 1) * limit

    cursor = questions.find(
        {"company": company, "bucket": bucket}
    ).skip(skip).limit(limit)

    result = [to_json(doc) for doc in cursor]
    return jsonify(result), 200

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

    # 1) Find original to extract its link
    orig = questions.find_one({"_id": ObjectId(id)})
    if not orig:
        abort(404, description="Question not found")

    link_key = orig.get("link")
    if not link_key:
        abort(400, description="Original question has no link field")

    # 2) Update all docs with that link
    questions.update_many(
        {"link": link_key},
        {"$set": update_fields}
    )

    # 3) Return all updated documents
    updated_docs = questions.find({"link": link_key})
    return jsonify([to_json(doc) for doc in updated_docs]), 200

if __name__ == "__main__":
    # Default: listen on 127.0.0.1:5000 with debug on
    app.run(debug=True)
