# LeetEase

This repository contains a React frontend and a Flask backend.

## Backend Environment Variables

The backend expects certain security keys to be set before it starts:

- `SECRET_KEY`: Flask's secret key used for sessions.
- `JWT_SECRET_KEY`: key used to sign JWT tokens.

If either variable is missing, the application will raise a `RuntimeError` at startup.
Define them in your `.env` file or export them in your deployment environment.
