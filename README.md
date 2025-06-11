# LeetEase

LeetEase is a full stack web application that helps you practise company specific LeetCode questions.
It is built with a **Flask** backend and a **React** frontend styled with **Tailwind CSS**.
Questions are stored in MongoDB in a normalised schema and users can track their progress and sync solved problems directly from LeetCode.

<!-- TODO: Screenshot of landing/home page -->
![Home](docs/screenshots/home.png)
<!-- TODO: Screenshot of company buckets page -->
![Company buckets](docs/screenshots/company.png)
<!-- TODO: Screenshot of statistics/profile page -->
![Profile](docs/screenshots/profile.png)
<!-- TODO: Screenshot of settings page -->
![Settings](docs/screenshots/settings.png)

## Features

- Email registration with OTP verification and password reset
- Google sign–in
- Manage account details and upload a profile photo
- Synchronise solved questions from LeetCode using your session cookie
- Browse company question buckets, filter by tags and mark problems as solved
- View personal statistics and company progress dashboards
- Admin utilities to import questions from CSV/Excel and backfill tags
- Secure APIs using JWT cookies with CSRF protection and CORS configuration

## Running Locally

1. Install **Python 3.11+** and **Node.js 20+**.
2. (Optional) create and activate a virtual environment
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install backend dependencies
   ```bash
   pip install -r backend/requirements.txt
   ```
4. Build the React frontend
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```
5. Copy the example environment file and adjust values
   ```bash
   cp backend/.env.example backend/.env
   # edit backend/.env
   ```
6. Ensure MongoDB is running (e.g. `docker compose up mongo`)
7. Start the Flask server
   ```bash
   FLASK_DEBUG=1 python backend/app.py
   ```

The site will be available at `http://localhost:5000`.

## Docker

Docker removes the need to install Python or Node locally.

1. Copy the example environment files for backend **and** frontend
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
   When using HTTP locally set
   ```bash
   echo "JWT_COOKIE_SECURE=False" >> backend/.env
   sed -i "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=|" frontend/.env
   ```
2. Build and start the containers (Gunicorn by default)
   ```bash
   docker compose up --build
   # APP_SERVER=flask docker compose up  # use Flask dev server
   ```

The backend and the built React app will run on `http://localhost:5000`.
MongoDB stores its data in the `mongo-data` volume and uploaded profile photos
are kept in the `profile-photos` volume.

## Backend Environment Variables

Set these in `backend/.env` or in your deployment environment:

- `SECRET_KEY` &ndash; Flask secret key used for sessions
- `MONGODB_URI` &ndash; Mongo connection string
- `JWT_SECRET_KEY` &ndash; key used to sign JWT tokens
- `GOOGLE_CLIENT_ID` &ndash; OAuth client ID for Google sign‑in

The app will fail to start if any required variable is missing.

### CSRF Protection

Every response sets a `csrf_token` cookie. The frontend sends this token in the
`X-CSRFToken` header for all POST, PUT, PATCH and DELETE requests. This behaviour
comes from **Flask-WTF**'s `CSRFProtect` extension.

### CORS Configuration

Cross‑origin requests are allowed from the URLs listed in `CORS_ORIGINS`. Only
those origins may send credentials such as cookies.

## Frontend Environment Variables

Create `frontend/.env` and set:

- `REACT_APP_GOOGLE_CLIENT_ID` &ndash; Google Identity Services client ID
- `REACT_APP_API_URL` &ndash; base URL of the backend API (leave empty when
  served from the same origin)

Use `npm start` in the `frontend` directory to run the development server if
needed.

