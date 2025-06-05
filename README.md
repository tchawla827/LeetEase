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
