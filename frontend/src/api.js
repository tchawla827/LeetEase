// ─── Existing code ───
import axios from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  config => {
    const needsCsrf = /^(post|put|patch|delete)$/i.test(config.method)
    if (needsCsrf) {
      const csrf = Cookies.get('csrf_access_token')
      if (csrf) {
        config.headers['X-CSRF-TOKEN'] = csrf
      }
    }
    return config
  },
  error => Promise.reject(error)
)

// ─── NEW: Fetch company progress ────────────────────────────────────────
export function fetchCompanyProgress(companyName) {
  const path = `/api/companies/${encodeURIComponent(companyName)}/progress`
  return api.get(path)
}

export default api
