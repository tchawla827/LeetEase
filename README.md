# LeetEase

This repository contains a Flask backend and React frontend.

## Deployment Notes

- JWT authentication cookies are configured to be sent only over HTTPS by default.
- When running the backend locally without HTTPS, set:

  ```bash
  export JWT_COOKIE_SECURE=False
  ```

- Use HTTPS in production so that authentication works correctly.

