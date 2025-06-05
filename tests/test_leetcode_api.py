import os
import unittest
from unittest.mock import patch

# Ensure required env vars before importing app
os.environ.setdefault('SECRET_KEY', 'test')
os.environ.setdefault('MONGODB_URI', 'mongodb://localhost:27017/test')
os.environ.setdefault('JWT_SECRET_KEY', 'testjwt')

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app import app, _fetch_solved_slugs_via_list, fetch_leetcode_tags
from werkzeug.exceptions import HTTPException
import requests

class LeetEaseLeetCodeErrorTests(unittest.TestCase):
    def test_fetch_solved_slugs_connection_error(self):
        with app.test_request_context():
            with patch('app.requests.get', side_effect=requests.ConnectionError("fail")):
                with self.assertRaises(HTTPException) as cm:
                    _fetch_solved_slugs_via_list('cookie')
                resp, code = app.handle_http_exception(cm.exception)
                self.assertEqual(code, 502)
                self.assertEqual(resp.get_json()['description'], 'Unable to contact LeetCode')

    def test_fetch_leetcode_tags_connection_error(self):
        with app.test_request_context():
            with patch('app.requests.post', side_effect=requests.ConnectionError("fail")):
                with self.assertRaises(HTTPException) as cm:
                    fetch_leetcode_tags('two-sum')
                resp, code = app.handle_http_exception(cm.exception)
                self.assertEqual(code, 502)
                self.assertEqual(resp.get_json()['description'], 'Unable to contact LeetCode')

if __name__ == '__main__':
    unittest.main()
