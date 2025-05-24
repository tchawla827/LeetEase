# backend/modules/loader.py

import os
from pathlib import Path
import pandas as pd
from config import get_db

# Map exact CSV filenames to bucket keys
BUCKET_MAP = {
    "1. Thirty Days.csv":           "30Days",
    "2. Three Months.csv":          "3Months",
    "3. Six Months.csv":            "6Months",
    "4. More Than Six Months.csv":  "MoreThan6Months",
    "5. All.csv":                   "All"
}

def load_company_data(data_root: str = None):
    """
    Walk data_root/<Company>/*.csv and upsert each row into MongoDB.
    Expects files named exactly as in BUCKET_MAP.
    """
    # Default data directory is backend/data
    if data_root is None:
        data_root = Path(__file__).parent.parent / "data"
    else:
        data_root = Path(data_root)

    if not data_root.exists():
        raise FileNotFoundError(f"Data root '{data_root}' does not exist")

    db   = get_db()
    coll = db.questions

    for company_dir in sorted(os.listdir(data_root)):
        company_path = data_root / company_dir
        if not company_path.is_dir():
            continue

        print(f"→ Loading company: {company_dir}")

        for fname, bucket in BUCKET_MAP.items():
            csv_path = company_path / fname
            if not csv_path.exists():
                continue

            # Read CSV
            df = pd.read_csv(csv_path)
            df.columns = [col.strip() for col in df.columns]

            for _, row in df.iterrows():
                title = row.get("Title") or row.get("Question") or ""
                link  = row.get("Link") or ""
                freq  = row.get("Frequency") or 0
                acc   = row.get("Acceptance Rate") or row.get("AcceptanceRate") or 0.0
                topics = row.get("Topics") or ""
                topic_list = [t.strip() for t in str(topics).split(",") if t.strip()]

                doc = {
                    "company":        company_dir,
                    "bucket":         bucket,
                    "title":          str(title).strip(),
                    "link":           str(link).strip(),
                    "frequency":      int(freq),
                    "acceptanceRate": float(acc),
                    "topics":         topic_list,
                    "leetDifficulty": str(row.get("Difficulty", "")).capitalize().strip(),
                    "userDifficulty": None,
                    "solved":         False,
                }

                coll.update_one(
                    {"company": doc["company"], "bucket": doc["bucket"], "title": doc["title"]},
                    {"$set": doc},
                    upsert=True
                )

        print(f"  ✔ Completed {company_dir}")

    print("✅ All companies loaded.")

if __name__ == "__main__":
    load_company_data()
