# Task Manager App

A full-stack task management web application where teams can create accounts using Google OAuth, assign tasks to each other, and receive email notifications when tasks are created or completed.

## Live URLs

- **Frontend:** `https://your-app.vercel.app` *(replace after deployment)*
- **Backend API:** `https://your-app.railway.app` *(replace after deployment)*

---

## Architecture

```
┌─────────────┐        ┌──────────────────┐        ┌─────────────────┐
│   Browser   │ ──────▶│  Next.js 14      │ ──────▶│  Flask REST API │
│   (User)    │        │  (Vercel)        │        │  (Railway)      │
└─────────────┘        └──────────────────┘        └────────┬────────┘
                                                            │
                              ┌─────────────────────────────┼──────────────────┐
                              │                             │                  │
                    ┌─────────▼────────┐        ┌──────────▼───────┐  ┌───────▼──────┐
                    │   Supabase       │        │  Google OAuth 2.0│  │  Gmail SMTP  │
                    │   PostgreSQL DB  │        │  (Authentication)│  │  (Emails)    │
                    └──────────────────┘        └──────────────────┘  └──────────────┘
```

### How it works

1. User visits the frontend (Next.js on Vercel)
2. User clicks "Sign in with Google" → redirected to Flask backend → redirected to Google
3. Google authenticates the user and sends back an authorization code
4. Flask exchanges the code for tokens, verifies with Supabase Auth
5. Supabase auto-creates a profile for new users (via database trigger)
6. User is redirected to the dashboard with a JWT token
7. All API calls from Next.js include the JWT token in the `Authorization: Bearer` header
8. Flask verifies the token with Supabase on every protected route
9. When a task is assigned or completed, Flask sends an email via Gmail SMTP

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 + TypeScript | UI, routing, client-side logic |
| Styling | Tailwind CSS | Utility-first CSS framework |
| Backend | Flask (Python) | REST API, business logic |
| Database | Supabase (PostgreSQL) | Data storage, Row Level Security |
| Auth | Google OAuth 2.0 + Supabase Auth | Login without passwords |
| Email | Gmail SMTP | Task assignment & completion notifications |
| Deploy (Frontend) | Vercel | Serverless frontend hosting |
| Deploy (Backend) | Railway | Python backend hosting |

---

## Features

- **Google OAuth Login** — No passwords, sign in with your Gmail account
- **Create Tasks** — Add title, description, priority, and due date
- **Assign Tasks** — Assign tasks to any registered team member
- **Task Status** — Move tasks through Pending → In Progress → Completed
- **Email Notifications** — Automatic emails when tasks are assigned or completed
- **Filter Tasks** — Filter by status or view only your assigned tasks
- **Responsive UI** — Works on both desktop and mobile

---

## Project Structure

```
task-management-app/
│
├── backend/                        # Flask Python backend
│   ├── app/
│   │   ├── __init__.py             # Flask app factory, registers blueprints, CORS setup
│   │   ├── auth.py                 # Google OAuth routes (/api/auth/google, /callback, /me)
│   │   ├── tasks.py                # Task CRUD routes (/api/tasks/)
│   │   ├── email_service.py        # Gmail SMTP email sending functions
│   │   └── db.py                   # Supabase client connection
│   ├── migrations/
│   │   └── 001_initial.sql         # Database schema (tables, RLS policies, triggers)
│   ├── .env.example                # Template for environment variables
│   ├── requirements.txt            # Python package dependencies
│   └── run.py                      # Entry point to start Flask server
│
├── frontend/                       # Next.js TypeScript frontend
│   ├── app/
│   │   ├── layout.tsx              # Root layout wrapping all pages
│   │   ├── page.tsx                # Homepage (root login page)
│   │   ├── login/
│   │   │   └── page.tsx            # Login page with error handling
│   │   └── dashboard/
│   │       └── page.tsx            # Main dashboard (tasks, filters, stats)
│   ├── components/
│   │   ├── TaskCard.tsx            # Single task card with status actions
│   │   └── TaskForm.tsx            # Modal form for creating new tasks
│   ├── lib/
│   │   ├── supabase.ts             # Supabase browser client setup
│   │   └── api.ts                  # All Flask API call functions + TypeScript interfaces
│   ├── .env.local.example          # Template for frontend environment variables
│   └── package.json
│
└── README.md
```

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- A [Supabase](https://supabase.com) account (free tier works)
- A [Google Cloud Console](https://console.cloud.google.com) project
- A Gmail account with 2FA enabled (for email notifications)

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-username/task-management-app.git
cd task-management-app
```

---

### Step 2 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** and run the contents of `backend/migrations/001_initial.sql`
3. Go to **Authentication → Providers → Google** and enable it
4. Paste your Google Client ID and Secret (from Step 4 below)
5. Note down your **Project URL** and **anon key** from Settings → API
6. Note down your **service_role key** from Settings → API (keep this secret!)

---

### Step 3 — Set up Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project called "Task Manager"
3. Go to **APIs & Services → OAuth consent screen** → External → fill in app name
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
5. Choose **Web application**
6. Add Authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
7. Copy the **Client ID** and **Client Secret**

---

### Step 4 — Set up Gmail App Password

1. Enable 2-Factor Authentication on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Create an App Password for "Task Manager"
4. Copy the 16-character password (remove spaces)

---

### Step 5 — Backend setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Copy env template and fill in values
cp .env.example .env
```

Edit `.env`:

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

```bash
# Start the Flask server
python run.py
# Runs at http://localhost:5000
```

---

### Step 6 — Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Copy env template and fill in values
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:5000
```

```bash
# Start the Next.js dev server
npm run dev
# Runs at http://localhost:3000
```

---

### Step 7 — Open the app

Visit [http://localhost:3000](http://localhost:3000) and click **Sign in with Google**.

---

## Database Schema

### `profiles` table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, linked to Supabase auth.users |
| email | TEXT | User's Gmail address |
| full_name | TEXT | Display name from Google |
| avatar_url | TEXT | Profile picture URL from Google |
| created_at | TIMESTAMPTZ | Auto-set on creation |

### `tasks` table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Auto-generated primary key |
| title | TEXT | Task title (required) |
| description | TEXT | Optional task details |
| status | TEXT | `pending` / `in_progress` / `completed` |
| priority | TEXT | `low` / `medium` / `high` |
| due_date | DATE | Optional deadline |
| created_by | UUID | Foreign key → profiles.id |
| assigned_to | UUID | Foreign key → profiles.id |
| created_at | TIMESTAMPTZ | Auto-set on creation |
| updated_at | TIMESTAMPTZ | Auto-updated via trigger |

---

## API Endpoints

### Auth routes (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Redirect to Google login |
| GET | `/api/auth/google/callback` | OAuth callback, returns JWT token |
| GET | `/api/auth/me` | Get current user profile |
| POST | `/api/auth/logout` | Clear session |

### Task routes (`/api/tasks`) — all require `Authorization: Bearer <token>`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/` | Get all tasks (supports `?status=` and `?assigned_to_me=true`) |
| POST | `/api/tasks/` | Create a new task |
| PUT | `/api/tasks/<id>` | Update a task (status, title, assignee, etc.) |
| DELETE | `/api/tasks/<id>` | Delete a task (creator only) |
| GET | `/api/tasks/users` | Get all users (for assignment dropdown) |

---

## Deployment

### Deploy Backend to Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo, set root directory to `backend`
4. Add all environment variables from `.env` (update `FRONTEND_URL` to your Vercel URL)
5. Railway auto-detects the `Procfile` and runs `gunicorn run:app`

### Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Set root directory to `frontend`
3. Add environment variables (set `NEXT_PUBLIC_API_URL` to your Railway URL)
4. Vercel auto-deploys on every push to `main`

### After deployment — update Google OAuth

Add your production callback URL in Google Cloud Console:
```
https://your-app.railway.app/api/auth/google/callback
```

---

## Environment Variables Reference

### Backend `.env`

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Service role key (bypasses RLS — backend only!) |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GMAIL_SENDER_EMAIL` | Gmail address for sending notifications |
| `GMAIL_APP_PASSWORD` | 16-character Gmail App Password |
| `FLASK_SECRET_KEY` | Random string for signing sessions |
| `FRONTEND_URL` | e.g. `http://localhost:3000` or Vercel URL |
| `BACKEND_URL` | e.g. `http://localhost:5000` or Railway URL |

### Frontend `.env.local`

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (safe to expose) |
| `NEXT_PUBLIC_API_URL` | Flask backend URL |

---

## Key Concepts (for reference)

**OAuth 2.0** — An authentication protocol where users log in via Google instead of creating a password. The app never sees the user's password.

**JWT (JSON Web Token)** — A signed string the server issues after login. The frontend stores it and sends it with every API request to prove identity.

**Row Level Security (RLS)** — A Supabase/PostgreSQL feature that restricts which rows a user can read or write, enforced at the database level.

**Flask Blueprint** — A way to organize Flask routes into separate files (`auth.py`, `tasks.py`) instead of one large file.

**CORS** — Browsers block requests to different domains by default. Flask-CORS tells the browser to allow requests from the Next.js frontend URL.

---

## Author

**Rajat Mehta**
- GitHub: [github.com/rajatmehta2k4](https://github.com/rajatmehta2k4)
- LinkedIn: [linkedin.com/in/rajat-mehta2k4](https://linkedin.com/in/rajat-mehta2k4)
- Email: rajatmehta2k4@gmail.com