export function extractErrorMessage(err) {
  return (
    err?.response?.data?.description ||
    err?.response?.data?.error ||
    (err?.response?.status === 401 ? 'Bad email or password' : null) ||
    err?.message ||
    'Network Error'
  );
}
