import axios    from 'axios';
import Cookies  from 'js-cookie';

// Create a single Axios instance for the whole app
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  withCredentials: true,                 // send / receive cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ------------------------------------------------------------------ */
/*                 Attach CSRF token for state-changing calls          */
/* ------------------------------------------------------------------ */
api.interceptors.request.use(config => {
  // Methods that modify state need the CSRF header
  const needsCsrf = /^(post|put|patch|delete)$/i.test(config.method);
  if (needsCsrf) {
    const csrf = Cookies.get('csrf_access_token');   // set by Flask on login
    if (csrf) {
      config.headers['X-CSRF-TOKEN'] = csrf;
    }
  }
  return config;
}, error => Promise.reject(error));

export default api;
