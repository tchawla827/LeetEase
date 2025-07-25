import os
import unittest
from unittest.mock import patch, MagicMock

os.environ.setdefault('SECRET_KEY', 'test')
os.environ.setdefault('MONGODB_URI', 'mongodb://localhost:27017/test')
os.environ.setdefault('JWT_SECRET_KEY', 'testjwt')
os.environ.setdefault('DISABLE_INTEGRITY_CHECK', '1')

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend import app as app_module
from backend.app import app, create_access_token
from bson.objectid import ObjectId

class FakeColl:
    def __init__(self):
        self.docs = []
    def find_one(self, query, projection=None):
        for doc in self.docs:
            if all(doc.get(k) == v for k, v in query.items() if not isinstance(v, dict)):
                return doc.copy()
        return None
    def find_one_and_update(self, query, update, upsert=False, return_document=False):
        doc = self.find_one(query)
        if doc:
            if "$set" in update:
                doc.update(update["$set"])
            if return_document:
                return doc.copy()
            return None
        elif upsert:
            new_doc = query.copy()
            if "$setOnInsert" in update:
                new_doc.update(update["$setOnInsert"])
            if "$set" in update:
                new_doc.update(update["$set"])
            self.docs.append(new_doc)
            return new_doc.copy()
        return None
    def update_one(self, query, update, upsert=False):
        doc = self.find_one(query)
        if doc:
            if "$set" in update:
                doc.update(update["$set"])
        elif upsert:
            new_doc = query.copy()
            if "$set" in update:
                new_doc.update(update["$set"])
            self.docs.append(new_doc)
    def update_many(self, *args, **kwargs):
        pass

class UserMetaTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        with app.app_context():
            self.token = create_access_token(identity="u1")
        self.headers = {"Authorization": f"Bearer {self.token}", "X-CSRFToken": "t"}
        self.client.set_cookie("csrf_token", "t")
        app_module.csrf.exempt(app_module.update_question_meta)
        self.fake_meta = FakeColl()

    def test_rating_update_preserves_solved(self):
        self.fake_meta.docs.append({"user_id": "u1", "question_id": "000000000000000000000001", "solved": True})
        with patch("backend.app.USER_META", self.fake_meta), \
             patch("backend.app.QUEST.find_one", return_value=True), \
             patch("backend.app.COMPANIES.find_one", return_value={"_id": "co1", "name": "Acme"}):
            resp = self.client.patch(
                "/api/questions/000000000000000000000001",
                json={"userDifficulty": "Easy", "company": "Acme", "bucket": "30d"},
                headers=self.headers,
            )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data["solved"])
        doc = self.fake_meta.find_one({"user_id": "u1", "question_id": "000000000000000000000001", "company_id": "co1", "bucket": "30d"})
        self.assertTrue(doc["solved"])

if __name__ == "__main__":
    unittest.main()
