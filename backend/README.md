# Task Manager — Backend (Flask)

This is the REST API backend for the Task Manager app, built with Python and Flask. It handles Google OAuth authentication, task CRUD operations, and email notifications via Gmail.

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Python 3.10+ | Programming language |
| Flask | Web framework for building REST APIs |
| Flask-CORS | Allows frontend (different domain) to call this API |
| Supabase Python SDK | Connects to PostgreSQL database and handles auth token verification |
| Google Auth Library | Verifies Google OAuth tokens |
| smtplib (built-in) | Sends emails via Gmail SMTP |
| python-dotenv | Loads `.env` file into environment variables |
| Gunicorn | Production WSGI server (used on Railway) |

---

## Folder Structure

```
backend/
├── app/
│   ├── __init__.py         # Creates Flask app, registers blueprints, sets up CORS
│   ├── auth.py             # Google OAuth login routes
│   ├── tasks.py            # Task create/read/update/delete routes
│   ├── email_service.py    # Gmail SMTP email functions
│   └── db.py               # Supabase client connection
├── migrations/
│   └── 001_initial.sql     # Run this in Supabase SQL Editor to create tables
├── .env.example            # Copy this to .env and fill in your values
├── requirements.txt        # All Python packages needed
├── Procfile                # Tells Railway how to start the server
└── run.py                  # Start the development server
```

---

## Local Setup

### Step 1 — Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 2 — Set up environment variables

```bash
cp .env.example .env
```

Then open `.env` and fill in all values:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

GMAIL_SENDER_EMAIL=youremail@gmail.com
GMAIL_APP_PASSWORD=your16charpassword

FLASK_SECRET_KEY=any-random-long-string
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
```

### Step 3 — Run database migrations

Go to your Supabase dashboard → SQL Editor → paste and run the contents of:
```
migrations/001_initial.sql
```

This creates the `profiles` and `tasks` tables, Row Level Security policies, and database triggers.

### Step 4 — Start the server

```bash
python run.py
```

Server runs at: `http://localhost:5000`

---

## Environment Variables

| Variable | Where to get it | Description |
|----------|----------------|-------------|
| `SUPABASE_URL` | Supabase → Settings → API | Your project URL |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → service_role | Bypasses RLS — never expose this publicly |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials | OAuth client secret |
| `GMAIL_SENDER_EMAIL` | Your Gmail address | Used as the "From" email |
| `GMAIL_APP_PASSWORD` | Google Account → Security → App Passwords | 16-character app-specific password |
| `FLASK_SECRET_KEY` | Make up any random string | Used to sign session cookies |
| `FRONTEND_URL` | Where your Next.js app runs | Used for CORS and redirects |
| `BACKEND_URL` | Where this Flask app runs | Used in OAuth redirect URI |

---

## API Endpoints

All task endpoints require the header:
```
Authorization: Bearer <supabase_jwt_token>
```

### Authentication

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/auth/google` | Redirects user to Google login page |
| GET | `/api/auth/google/callback` | Google redirects here after login; returns JWT token |
| GET | `/api/auth/me` | Returns current logged-in user's profile |
| POST | `/api/auth/logout` | Clears the server-side session |

### Tasks

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/tasks/` | Get all tasks. Optional: `?status=pending` or `?assigned_to_me=true` |
| POST | `/api/tasks/` | Create a new task |
| PUT | `/api/tasks/<id>` | Update a task (status, title, assignee, etc.) |
| DELETE | `/api/tasks/<id>` | Delete a task (only the creator can delete) |
| GET | `/api/tasks/users` | Get all users (for assignment dropdown in frontend) |

### Example — Create a task

```bash
POST /api/tasks/
Authorization: Bearer eyJhbGci...

{
  "title": "Fix login bug",
  "description": "Button not working on mobile",
  "priority": "high",
  "due_date": "2024-12-31",
  "assigned_to": "user-uuid-here"
}
```

### Example — Update task status

```bash
PUT /api/tasks/abc-123
Authorization: Bearer eyJhbGci...

{
  "status": "completed"
}
```

---

## How Google OAuth Works (step by step)

```
1. User clicks "Sign in with Google" on frontend
2. Frontend redirects to → GET /api/auth/google
3. Flask builds Google OAuth URL and redirects user to Google
4. User logs in on Google and grants permission
5. Google redirects to → GET /api/auth/google/callback?code=...
6. Flask exchanges the code for access_token + id_token
7. Flask calls Google API to get user's email, name, photo
8. Flask calls Supabase auth.sign_in_with_id_token()
9. Supabase verifies the Google token and creates/finds the user
10. Supabase database trigger auto-creates a profile row
11. Flask redirects to frontend /dashboard?token=<jwt>
12. Frontend stores the JWT in localStorage
```

---

## How Email Notifications Work

Uses Python's built-in `smtplib` to connect to Gmail's SMTP server on port 587 with TLS encryption.

**Two types of emails are sent:**

1. **Task Assigned** — When a new task is created with an `assigned_to` user, that user receives an email with the task title, description, and a link to the dashboard.

2. **Task Completed** — When a task's status changes to `completed`, the task creator receives an email telling them who completed it.

**Gmail setup required:**
- Enable 2-Factor Authentication on your Google account
- Generate an App Password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
- Use that 16-character password as `GMAIL_APP_PASSWORD` in `.env`

---

## How Authentication Middleware Works

The `require_auth` decorator in `tasks.py` protects routes:

```python
@tasks_bp.route('/', methods=['GET'])
@require_auth   # ← this runs first
def get_tasks():
    # only reaches here if token is valid
```

It reads the `Authorization: Bearer <token>` header, verifies the token with Supabase, and attaches the user object to `request.current_user` so route functions can use it.

---

## Database Schema

### `profiles`
```sql
id          UUID  (references auth.users)
email       TEXT
full_name   TEXT
avatar_url  TEXT
created_at  TIMESTAMPTZ
```

### `tasks`
```sql
id           UUID  (auto-generated)
title        TEXT  (required)
description  TEXT
status       TEXT  ('pending' | 'in_progress' | 'completed')
priority     TEXT  ('low' | 'medium' | 'high')
due_date     DATE
created_by   UUID  (references profiles.id)
assigned_to  UUID  (references profiles.id)
created_at   TIMESTAMPTZ
updated_at   TIMESTAMPTZ  (auto-updated via trigger)
```

---

## Deployment to Railway

### Step 1 — Create Procfile (already exists)
```
web: gunicorn run:app
```

### Step 2 — Deploy
1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo and set root directory to `backend`
4. Add all environment variables from `.env`
5. Update `FRONTEND_URL` to your Vercel frontend URL
6. Update `BACKEND_URL` to your Railway URL (shown after first deploy)

### Step 3 — Update Google OAuth
Add the production callback URL in Google Cloud Console:
```
https://your-app.railway.app/api/auth/google/callback
```

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `ImportError: cannot import name 'supabase'` | Old import style | Use `get_supabase()` function instead |
| `ModuleNotFoundError: websockets.asyncio` | Outdated websockets | `pip install "websockets>=11,<16"` |
| `TypeError: proxy keyword argument` | httpx version conflict | `pip install supabase` (latest, no version pin) |
| `SMTPAuthenticationError` | Wrong Gmail credentials | Check `GMAIL_APP_PASSWORD` in `.env` |
| `auth_failed` redirect | Supabase Google provider not enabled | Enable Google in Supabase Auth → Providers |