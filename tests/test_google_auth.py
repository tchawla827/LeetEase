import os
import unittest
from unittest.mock import patch, MagicMock

# Ensure env vars before importing app
os.environ.setdefault('SECRET_KEY', 'test')
os.environ.setdefault('MONGODB_URI', 'mongodb://localhost:27017/test')
os.environ.setdefault('JWT_SECRET_KEY', 'testjwt')
os.environ.setdefault('GOOGLE_CLIENT_ID', 'cid123')
os.environ.setdefault('DISABLE_INTEGRITY_CHECK', '1')

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend import app as app_module
from backend.app import app
import requests

class GoogleAuthTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        # Disable CSRF for testing
        app_module.csrf.exempt(app_module.google_login)
        
    def test_invalid_token(self):
        with patch('backend.app.requests.get', side_effect=requests.RequestException("fail")):
            self.client.set_cookie('csrf_token', 't', domain='localhost')
            resp = self.client.post('/auth/google', json={'idToken': 'bad'}, headers={'X-CSRFToken': 't'})
        self.assertEqual(resp.status_code, 400)

    def test_create_user(self):
        response_obj = MagicMock()
        response_obj.raise_for_status.return_value = None
        response_obj.json.return_value = {
            'aud': 'cid123',
            'email': 'u@example.com',
            'given_name': 'User',
            'family_name': 'Test'
        }
        with patch('backend.app.requests.get', return_value=response_obj), \
             patch.object(app_module, 'USERS') as mock_users:
            mock_users.find_one.return_value = None
            mock_users.insert_one.return_value.inserted_id = '1'
            self.client.set_cookie('csrf_token', 't', domain='localhost')
            resp = self.client.post('/auth/google', json={'idToken': 'good'}, headers={'X-CSRFToken': 't'})
            self.assertEqual(resp.status_code, 200)
            mock_users.insert_one.assert_called()

if __name__ == '__main__':
    unittest.main()
