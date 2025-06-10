// src/api.js
import axios from 'axios';
import Cookies from 'js-cookie';
import { emitGlobalError } from './context/ErrorToastContext';
import { extractErrorMessage } from './utils/error';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  withCredentials: true,
  // ⚠️ Don’t set a global Content-Type header here; each request will specify its own.
});

// ─── CSRF interceptor ───────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const needsCsrf = /^(post|put|patch|delete)$/i.test(config.method);
    if (needsCsrf) {
      const csrf = Cookies.get('_csrf_token');
      if (csrf) {
        config.headers['X-CSRFToken'] = csrf;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Error toast interceptor ─────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    const msg = response.data?.description || response.data?.error;
    if (msg) emitGlobalError(msg);
    return response;
  },
  (error) => {
    const msg = extractErrorMessage(error);
    emitGlobalError(msg);
    return Promise.reject(error);
  }
);

// ───────────────────────────────
// Auth / Registration
// ───────────────────────────────
export function registerUser(payload) {
  return api.post('/auth/register', payload);
}
export function verifyOtp(payload) {
  return api.post('/auth/verify', payload);
}

export function requestPasswordReset(email) {
  return api.post('/auth/forgot-password', { email });
}

export function resetPassword(token, newPassword) {
  return api.post('/auth/reset-password', { token, newPassword });
}

// ───────────────────────────────
// Profile – Account & Photo
// ───────────────────────────────
export function getAccountProfile() {
  return api.get('/profile/account');
}
export function updateAccountProfile(payload) {
  return api.patch('/profile/account', payload);
}
export function uploadProfilePhoto(formData) {
  return api.post('/profile/account/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
export function deleteProfilePhoto() {
  return api.delete('/profile/account/photo');
}

// ───────────────────────────────
// User Settings
// ───────────────────────────────
export function getUserSettings() {
  return api.get('/profile/settings');
}
export function updateUserSettings(settings) {
  return api.patch('/profile/settings', settings);
}
export function syncLeetCode() {
  return api.post('/profile/leetcode/sync');
}

// ───────────────────────────────
// Admin – Import Questions
// ───────────────────────────────
export function uploadQuestions(file) {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function backfillTags() {
  return api.post('/api/admin/backfill-tags');
}

// ───────────────────────────────
// Company / Progress
// ───────────────────────────────
export function fetchCompanyProgress(companyName) {
  const path = `/api/companies/${encodeURIComponent(companyName)}/progress`;
  return api.get(path);
}

export function fetchRecentBuckets(limit = 8) {
  return api.get(`/api/recent-buckets?limit=${limit}`);
}

export function fetchUserStats() {
  return api.get('/api/user-stats');
}

export default api;
