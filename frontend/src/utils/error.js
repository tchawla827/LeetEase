export function extractErrorMessage(err) {
  const description = err?.response?.data?.description;
  const error = err?.response?.data?.error;

  if (description || error) {
    return description || error;
  }

  if (err?.response?.status === 401) {
    const url = err?.config?.url || '';
    if (url.includes('/auth/login')) {
      return 'Bad email or password';
    }
    if (url.includes('/auth/me')) {
      // Silence unauthorized errors from the initial auth check
      return '';
    }
    return 'Unauthorized';
  }

  return err?.message || 'Network Error';
}
