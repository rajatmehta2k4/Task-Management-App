# Task Manager — Frontend (Next.js)

This is the frontend for the Task Manager app, built with Next.js 14 (App Router) and TypeScript. It handles the user interface, Google OAuth login flow, and communicates with the Flask backend API.

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 14 | React framework with App Router for routing and SSR |
| TypeScript | Typed JavaScript — catches errors before runtime |
| Tailwind CSS | Utility-first CSS for styling without writing custom CSS |
| Supabase JS SDK | Browser client for Supabase (used for auth session) |
| React Hooks | `useState`, `useEffect`, `useCallback` for state management |

---

## Folder Structure

```
frontend/
├── app/                            # Next.js App Router — each folder = a route
│   ├── layout.tsx                  # Root layout — wraps every page (fonts, metadata)
│   ├── globals.css                 # Global CSS styles + Tailwind imports
│   ├── page.tsx                    # Homepage at "/" — root login page
│   ├── login/
│   │   └── page.tsx                # Login page at "/login" — shows error messages
│   └── dashboard/
│       └── page.tsx                # Dashboard at "/dashboard" — main app page
│
├── components/                     # Reusable UI components
│   ├── TaskCard.tsx                # Displays a single task card with action buttons
│   └── TaskForm.tsx                # Modal form for creating a new task
│
├── lib/                            # Utility/helper files
│   ├── supabase.ts                 # Creates Supabase browser client
│   └── api.ts                      # All functions for calling Flask backend + TypeScript types
│
├── .env.local.example              # Copy to .env.local and fill in values
├── next.config.ts                  # Next.js configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Project dependencies and scripts
```

---

## Local Setup

### Step 1 — Install dependencies

```bash
cd frontend
npm install
```

### Step 2 — Set up environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in the values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_API_URL=http://localhost:5000
```

> Variables starting with `NEXT_PUBLIC_` are safe to expose in the browser.
> Never put secret keys (like the Supabase service role key) in frontend env variables.

### Step 3 — Start the development server

```bash
npm run dev
```

App runs at: `http://localhost:3000`

---

## Environment Variables

| Variable | Where to get it | Description |
|----------|----------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | Your project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public | Safe public key |
| `NEXT_PUBLIC_API_URL` | Where Flask backend runs | `http://localhost:5000` locally |

---

## Pages

### `/` — Home / Login Page (`app/page.tsx`)
- Checks if user is already logged in (token in localStorage)
- If logged in → redirects to `/dashboard`
- If not → shows "Sign in with Google" button
- Clicking the button redirects to `NEXT_PUBLIC_API_URL/api/auth/google`

### `/login` — Login with Error Handling (`app/login/page.tsx`)
- Same as the home page but also reads `?error=` from the URL
- Shows a red error message if OAuth failed (e.g. `?error=auth_failed`)
- Flask redirects here when something goes wrong during login

### `/dashboard` — Main App (`app/dashboard/page.tsx`)
- Protected page — redirects to `/` if no token found
- On first load, reads `?token=` from URL (set by Flask after OAuth)
- Saves token to `localStorage` and cleans the URL
- Fetches tasks, users, and current user from Flask API in parallel
- Shows task stats (Total, Pending, In Progress, Completed)
- Allows filtering by status or "My Tasks"
- Opens `TaskForm` modal when "+ New Task" is clicked

---

## Components

### `TaskCard.tsx`
Displays a single task as a card with:
- Title (strikethrough when completed)
- Status badge (color-coded)
- Priority badge
- Due date
- Created by / Assigned to names
- Action buttons: **Start**, **Complete**, **Delete**
- Buttons only shown to the task creator or assigned user

### `TaskForm.tsx`
A modal popup form for creating new tasks:
- Title (required)
- Description (optional)
- Priority dropdown (Low / Medium / High)
- Due date picker
- Assign to user dropdown (fetched from backend)
- Validates that title is not empty before submitting
- Closes on clicking outside the modal or Cancel button

---

## How Authentication Works (Frontend Side)

```
1. User clicks "Sign in with Google"
   → window.location.href = Flask /api/auth/google

2. After Google login, Flask redirects to:
   → /dashboard?token=eyJhbGci...

3. Dashboard page useEffect reads the token from URL:
   → localStorage.setItem('auth_token', token)
   → router.replace('/dashboard')  ← cleans URL

4. Every API call includes the token in headers:
   → Authorization: Bearer eyJhbGci...

5. On logout:
   → localStorage.removeItem('auth_token')
   → redirect to /
```

---

## How API Calls Work

All backend calls are centralized in `lib/api.ts`.

Each function:
1. Reads the auth token from `localStorage`
2. Adds it to the `Authorization: Bearer` header
3. Makes a `fetch()` call to the Flask backend
4. Returns typed data or throws an error

Example:
```typescript
// Fetch all tasks
const tasks = await fetchTasks({ status: 'pending' })

// Create a task
const newTask = await createTask({
  title: 'Fix bug',
  priority: 'high',
  assigned_to: 'user-uuid'
})

// Update status
await updateTask(taskId, { status: 'completed' })

// Delete task
await deleteTask(taskId)
```

---

## TypeScript Interfaces

Defined in `lib/api.ts`:

```typescript
interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  created_by: string
  assigned_to: string | null
  created_at: string
  updated_at: string
  created_by_profile?: { id: string; full_name: string; email: string; avatar_url: string }
  assigned_to_profile?: { id: string; full_name: string; email: string; avatar_url: string }
}

interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string
}
```

---

## Available Scripts

Run these from inside the `frontend/` folder:

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start development server at localhost:3000 with hot reload |
| `npm run build` | Build the app for production |
| `npm run start` | Start the production build locally |
| `npm run lint` | Run ESLint to check for code issues |

---

## Key Next.js Concepts Used

**App Router** — Each folder inside `app/` becomes a URL route. A `page.tsx` file inside the folder is what gets rendered.

**`'use client'`** — Added at the top of files that use browser APIs (`localStorage`, `useState`, `useEffect`). Without it, Next.js tries to render on the server where these don't exist.

**`useRouter`** — Programmatic navigation (e.g. `router.push('/dashboard')`).

**`useSearchParams`** — Reads URL query parameters like `?token=...` or `?error=...`.

**`useEffect`** — Runs code after the component renders in the browser. Used for checking login status and fetching data.

**`useState`** — Holds data that can change (tasks list, loading state, form values). When state changes, the component re-renders.

**`useCallback`** — Memoizes a function so it isn't recreated on every render. Used for the `loadData` function to prevent infinite loops in `useEffect`.

---

## Deployment to Vercel

### Step 1 — Push to GitHub
Make sure your code is pushed to a GitHub repository.

### Step 2 — Deploy
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Set **Root Directory** to `frontend`
4. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```
5. Click Deploy

Vercel automatically redeploys every time you push to the `main` branch.

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `404` on `/dashboard` | `app/dashboard/page.tsx` missing | Create the file |
| `404` on `/login` | `app/login/page.tsx` missing | Create the file |
| `Cannot find module '@/lib/api'` | `lib/api.ts` missing or wrong path | Check file exists at `frontend/lib/api.ts` |
| Tasks show "Created by: Unknown" | Update response missing profile join | Use `{ ...task, status: newStatus }` spread in `handleStatusChange` |
| White screen / no error | JS error in console | Open browser DevTools → Console tab |
| API calls failing with 401 | Token not being sent | Check `localStorage.getItem('auth_token')` in DevTools |
| CORS error in browser | Backend CORS not configured | Check `FRONTEND_URL` in Flask `.env` matches exactly |