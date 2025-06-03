"""
Load CSV or Excel files into the **normalized** MongoDB schema:

    questions            (canonical LeetCode problem)
    companies            (one per company)
    company_questions    (join: company × bucket × problem stats)

Usage:

    # Default path = backend/data
    python backend/modules/loader_normalised.py

    # Or specify a custom data root:
    python backend/modules/loader_normalised.py /path/to/dataset
"""

import os
from pathlib import Path
import pandas as pd
from pandas.errors import EmptyDataError
from bson import ObjectId
from backend.config import get_db

# ── CSV/Excel bucket filenames → bucket key ─────────────────────────────
BUCKET_MAP = {
    "1. Thirty Days.csv":          "30Days",
    "2. Three Months.csv":         "3Months",
    "3. Six Months.csv":           "6Months",
    "4. More Than Six Months.csv": "MoreThan6Months",
    "5. All.csv":                  "All"
}

# ── Collections ──────────────────────────────────────────────────────────
db  = get_db()
Q   = db.questions           # canonical problems
CO  = db.companies
CQ  = db.company_questions

# ── Build indexes once ───────────────────────────────────────────────────
# Ensure unique problem links, unique company names, and unique (company, bucket, question) combos
Q.create_index('link', unique=True)
CO.create_index('name', unique=True)
CQ.create_index([('company_id', 1), ('bucket', 1), ('question_id', 1)], unique=True)
CQ.create_index('question_id')

# ── Helper caches to minimise round-trips ────────────────────────────────
company_id_cache  = {}   # name  -> ObjectId
question_id_cache = {}   # link  -> ObjectId

def get_company_id(name: str) -> ObjectId:
    """
    Return the ObjectId for a given company name. If not present, create it.
    Caches results to avoid repeated DB hits.
    """
    if name in company_id_cache:
        return company_id_cache[name]

    doc = CO.find_one_and_update(
        {'name': name},
        {'$setOnInsert': {'name': name}},
        upsert=True,
        return_document=True
    )
    company_id_cache[name] = doc['_id']
    return doc['_id']

def get_question_id(link: str, title: str, leet_diff: str) -> ObjectId:
    """
    Return the ObjectId for a given problem link. If not present, create it
    with the provided title and leetDifficulty.
    Caches results to avoid repeated DB hits.
    """
    if link in question_id_cache:
        return question_id_cache[link]

    doc = Q.find_one_and_update(
        {'link': link},
        {'$setOnInsert': {
            'link': link,
            'title': title,
            'leetDifficulty': leet_diff
        }},
        upsert=True,
        return_document=True
    )
    question_id_cache[link] = doc['_id']
    return doc['_id']

def load_company_data(data_root: str | Path | None = None):
    """
    Walk data_root/<Company>/*.{csv,xlsx,xls} and populate the normalized collections.
    - Creates companies if they don't exist.
    - Creates questions if they don't exist.
    - Upserts company_questions rows (so existing data is preserved).
    """
    # Determine the root path for company folders
    root = Path(data_root) if data_root else (Path(__file__).parent.parent / "data")
    if not root.exists():
        raise FileNotFoundError(f"Data root '{root}' does not exist")

    total_cq = 0
    for company_dir in sorted(os.listdir(root)):
        cpath = root / company_dir
        if not cpath.is_dir():
            continue  # skip non-directory files

        print(f"→ Loading company: {company_dir}")
        cid = get_company_id(company_dir)
        batch = []

        # Iterate over our predefined filenames → bucket keys
        for fname, bucket in BUCKET_MAP.items():
            fpath = cpath / fname
            if not fpath.exists():
                continue  # skip missing buckets

            # ─── Read CSV or Excel ────────────────────────────────────
            try:
                if fpath.suffix.lower() == ".csv":
                    df = pd.read_csv(fpath)
                elif fpath.suffix.lower() in (".xlsx", ".xls"):
                    df = pd.read_excel(fpath, engine="openpyxl")
                else:
                    print(f"  • Skipped unsupported file type: {fpath.name}")
                    continue
            except (EmptyDataError, pd.errors.ParserError) as e:
                print(f"  • Warning: could not read '{fpath.name}': {str(e)}")
                continue

            if df is None or df.empty:
                print(f"  • No data in '{fpath.name}', skipping.")
                continue

            # Normalize column names (strip whitespace)
            df.columns = [c.strip() for c in df.columns]

            # Process each row
            for _, row in df.iterrows():
                # Title: look for common variants
                title = (
                    str(row.get("Title") or
                        row.get("Question") or
                        row.get("Problem") or
                        "")
                ).strip()

                # Link/URL: look for several possible column names
                link = (
                    str(row.get("Link") or
                        row.get("URL") or
                        row.get("url") or
                        "")
                ).strip()

                # Frequency (float); default to 0 if missing or invalid
                try:
                    freq = float(row.get("Frequency") or 0)
                except (ValueError, TypeError):
                    freq = 0.0

                # Acceptance rate: look for variants, default 0
                try:
                    acc = float(
                        row.get("Acceptance Rate")
                        or row.get("AcceptanceRate")
                        or row.get("Acceptance")
                        or 0
                    )
                except (ValueError, TypeError):
                    acc = 0.0

                # User-defined difficulty or existing leetDifficulty
                ldiff = (
                    str(row.get("Difficulty") or
                        row.get("LeetDiff") or
                        "")
                ).capitalize().strip()

                # Skip if no valid link
                if not link:
                    continue

                # Get or create question ID
                qid = get_question_id(link, title, ldiff)

                # Prepare upsert payload for company_questions
                batch.append({
                    'company_id'    : cid,
                    'question_id'   : qid,
                    'bucket'        : bucket,
                    'frequency'     : freq,
                    'acceptanceRate': acc
                })

        # Upsert all rows for this company
        if batch:
            for doc in batch:
                CQ.replace_one(
                    {
                        'company_id' : doc['company_id'],
                        'question_id': doc['question_id'],
                        'bucket'     : doc['bucket']
                    },
                    doc,
                    upsert=True
                )
            print(f"  ✔ added/updated {len(batch)} bucket rows")
            total_cq += len(batch)
        else:
            print("  • No valid rows found for this company.")

    # Final summary
    print("\n✅ Load complete")
    print(f"  companies         : {CO.count_documents({})}")
    print(f"  questions         : {Q.count_documents({})}")
    print(f"  company_questions : {CQ.count_documents({})}")
    print(f"  rows processed    : {total_cq}")

if __name__ == "__main__":
    import sys

    data_path = sys.argv[1] if len(sys.argv) > 1 else None
    load_company_data(data_path)
