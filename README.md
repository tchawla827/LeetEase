# LeetEase


This project contains a Flask backend and a React frontend. No `node_modules` directory or Python virtual environment is committed to the repository. All dependencies are installed locally or in Docker containers.

The backend can run in either development or production mode.

## Running Locally

The project can be run directly on your machine using Python and Node.js.

1. Install **Python 3.11+** and **Node.js 20+**.
2. (Optional) create a virtual environment:

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install backend dependencies:

   ```bash
   pip install -r backend/requirements.txt
   ```

4. Install frontend dependencies and build the React app:

   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

5. Copy the example environment file and adjust values:

   ```bash
   cp backend/.env.example backend/.env
   # edit backend/.env
   ```

6. Ensure MongoDB is running locally (or start it via Docker with `docker compose up mongo`).
7. Start the Flask server:

   ```bash
   FLASK_DEBUG=1 python backend/app.py
   ```

The application will be available on `http://localhost:5000`.

## Deployment Notes

- JWT authentication cookies are configured to be sent only over HTTPS by default.
- When running the backend locally without HTTPS, set:

  ```bash
  export JWT_COOKIE_SECURE=False
  ```

- Use HTTPS in production so that authentication works correctly.

### CSRF Protection

All state-changing API requests are protected with [Flask-SeaSurf](https://flask-seasurf.readthedocs.io).
Install the `Flask-SeaSurf` package (add it to `backend/requirements.txt`). The backend
issues a `_csrf_token` cookie which the React frontend sends back in the `X-CSRFToken`
header for POST, PUT, PATCH and DELETE requests.

## Backend Environment Variables

The backend expects certain security keys to be set before it starts. Copy
`backend/.env.example` to `.env` and provide values for at least:

- `SECRET_KEY`: Flask's secret key used for sessions.
- `MONGODB_URI`: Mongo connection string.
- `JWT_SECRET_KEY`: key used to sign JWT tokens.

If either variable is missing, the application will raise a `RuntimeError` at startup.
Define them in your `.env` file or export them in your deployment environment.


## Docker and Docker Compose

Docker provides an isolated environment that installs all Python and Node.js
dependencies for you.

1. Copy the example environment file:

   ```bash
   cp backend/.env.example backend/.env
   ```

2. Build and start the containers:

   ```bash
   docker compose up --build
   ```

The backend and built React frontend will be available on
`http://localhost:5000`. MongoDB runs inside the Compose network and persists
data in the `mongo-data` volume.

