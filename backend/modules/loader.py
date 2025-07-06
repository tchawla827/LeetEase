# python -m backend.modules.loader_normalised "C:\Users\tavis\Downloads\companie"

"""
Load CSV files into the **normalized** MongoDB schema:

    questions            (canonical LeetCode problem)
    companies            (one per company)
    company_questions    (join: company × bucket × problem stats)

Run:

    # activate venv first
    python backend/modules/loader_normalized.py            # default path = backend/data
    python backend/modules/loader_normalized.py /path/to/dataset
"""

import os
from pathlib import Path
import pandas as pd
from bson import ObjectId
import re
from backend.config import get_db

# ── CSV bucket filenames → bucket key ───────────────────────────────────
BUCKET_MAP = {
    "1. Thirty Days.csv": "30Days",
    "2. Three Months.csv": "3Months",
    "3. Six Months.csv": "6Months",
    "4. More Than Six Months.csv": "MoreThan6Months",
    "5. All.csv": "All",
}

# ── Collections ────────────────────────────────────────────────────────
db = get_db()
Q = db.questions  # canonical
CO = db.companies
CQ = db.company_questions

# ── Build indexes once ─────────────────────────────────────────────────
Q.create_index("link", unique=True)
Q.create_index("slug", unique=True)
CO.create_index("name", unique=True)
CQ.create_index([("company_id", 1), ("bucket", 1)])
CQ.create_index("question_id")

# ── Helper caches to minimise round-trips ──────────────────────────────
company_id_cache = {}  # name  -> ObjectId
question_id_cache = {}  # slug -> ObjectId


def get_company_id(name: str) -> ObjectId:
    if name in company_id_cache:
        return company_id_cache[name]
    doc = CO.find_one_and_update(
        {"name": name},
        {"$setOnInsert": {"name": name}},
        upsert=True,
        return_document=True,
    )
    company_id_cache[name] = doc["_id"]
    return doc["_id"]


def slug_from_link(link: str) -> str:
    slug = re.sub(r"/+$", "", link.strip())
    slug = slug.split("?")[0]
    return slug.rsplit("/", 1)[-1]


def get_question_id(link: str, title: str, leet_diff: str) -> ObjectId:
    slug = slug_from_link(link)
    if slug in question_id_cache:
        return question_id_cache[slug]
    doc = Q.find_one_and_update(
        {"$or": [{"link": link}, {"slug": slug}]},
        {
            "$setOnInsert": {
                "link": link,
                "slug": slug,
                "title": title,
                "leetDifficulty": leet_diff,
            }
        },
        upsert=True,
        return_document=True,
    )
    question_id_cache[slug] = doc["_id"]
    return doc["_id"]


# ── Loader main ────────────────────────────────────────────────────────
def load_company_data(data_root: str | Path | None = None):
    """
    Walk data_root/<Company>/*.csv and populate the normalized collections.
    """
    root = Path(data_root) if data_root else Path(__file__).parent.parent / "data"
    if not root.exists():
        raise FileNotFoundError(f"Data root '{root}' does not exist")

    total_cq = 0
    for company_dir in sorted(os.listdir(root)):
        cpath = root / company_dir
        if not cpath.is_dir():
            continue

        print(f"→ Loading company: {company_dir}")
        cid = get_company_id(company_dir)
        batch = []

        for fname, bucket in BUCKET_MAP.items():
            fpath = cpath / fname
            if not fpath.exists():
                continue

            df = pd.read_csv(fpath)
            df.columns = [c.strip() for c in df.columns]

            for _, row in df.iterrows():
                title = str(row.get("Title") or row.get("Question") or "").strip()
                link = str(row.get("Link") or "").strip()
                freq = float(row.get("Frequency") or 0)
                acc = float(
                    row.get("Acceptance Rate") or row.get("AcceptanceRate") or 0
                )
                ldiff = str(row.get("Difficulty") or "").capitalize().strip()

                if not link:
                    continue  # skip malformed rows

                qid = get_question_id(link, title, ldiff)

                batch.append(
                    {
                        "company_id": cid,
                        "question_id": qid,
                        "bucket": bucket,
                        "frequency": freq,
                        "acceptanceRate": acc,
                    }
                )

        if batch:
            # Upsert each pair; replaceOne keeps stats idempotent
            for doc in batch:
                CQ.replace_one(
                    {
                        "company_id": doc["company_id"],
                        "question_id": doc["question_id"],
                        "bucket": doc["bucket"],
                    },
                    doc,
                    upsert=True,
                )
        print(f"  ✔ added/updated {len(batch)} bucket rows")
        total_cq += len(batch)

    print("\n✅ Load complete")
    print("  companies         :", CO.count_documents({}))
    print("  questions         :", Q.count_documents({}))
    print("  company_questions :", CQ.count_documents({}))
    print(f"  rows processed    : {total_cq}")


if __name__ == "__main__":
    import sys

    load_company_data(sys.argv[1] if len(sys.argv) > 1 else None)
