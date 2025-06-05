# LeetEase


This project contains a Flask backend and a React frontend. The backend can run in either development or production mode.

## Backend

1. Install Python dependencies:

```bash
pip install -r backend/requirements.txt
```

2. Create a `.env` file in `backend/` with the required settings as described in `backend/config.py`.

3. Run the server.

### Development

Enable Flask's debug mode by setting `FLASK_DEBUG=1`:

```bash
export FLASK_DEBUG=1
python backend/app.py
```

### Production

By default, debug mode is disabled. Simply run:

```bash
python backend/app.py
```

For a production deployment you may wish to run the app using a WSGI server such as Gunicorn.
=======

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


