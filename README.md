# LeetEase


This repository contains a Flask backend and React frontend.

## Deployment Notes

- JWT authentication cookies are configured to be sent only over HTTPS by default.
- When running the backend locally without HTTPS, set:

  ```bash
  export JWT_COOKIE_SECURE=False
  ```

- Use HTTPS in production so that authentication works correctly.


## Backend Environment Variables

The backend expects certain security keys to be set before it starts:

- `SECRET_KEY`: Flask's secret key used for sessions.
- `JWT_SECRET_KEY`: key used to sign JWT tokens.

If either variable is missing, the application will raise a `RuntimeError` at startup.
Define them in your `.env` file or export them in your deployment environment.

