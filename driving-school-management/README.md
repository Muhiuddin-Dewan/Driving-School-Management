# Driving School Management — Frontend

Next.js 16 dashboard for managing driving-school students, class progress, and payments.

## Tech Stack

| Layer        | Choice                                   |
| ------------ | ---------------------------------------- |
| Framework    | Next.js 16 (App Router)                  |
| Language     | TypeScript + React 19                    |
| Styling      | Tailwind CSS v4                          |
| Components   | shadcn/ui (Radix UI primitives)          |
| State        | React Context (`AuthContext`, `StudentContext`) |
| HTTP         | Native `fetch` wrapped in `lib/api.ts`   |
| Auth         | JWT stored in `localStorage`             |

## Project Layout

```
driving-school-management/
├── app/
│   ├── layout.tsx                      # Root layout (wraps in AuthProvider)
│   ├── page.tsx                        # Redirects to /dashboard or /login
│   ├── login/page.tsx                  # Login page (no demo creds shown)
│   └── (dashboard)/
│       ├── layout.tsx                  # Auth gate + sidebar + StudentProvider
│       ├── dashboard/page.tsx          # Stats overview (fetches /dashboard/stats)
│       └── students/
│           ├── page.tsx                # List with search/filter/pagination
│           ├── new/page.tsx            # New admission form
│           └── [id]/
│               ├── page.tsx            # Student detail + class tracker
│               └── edit/page.tsx       # Edit student
├── components/
│   ├── sidebar.tsx
│   ├── stat-card.tsx
│   ├── student-form.tsx                # Create/edit form (multipart upload)
│   ├── class-tracker.tsx               # Practical/engine/theory class toggles + notes
│   └── ui/                             # shadcn/ui primitives
├── lib/
│   ├── api.ts                          # Backend API client
│   ├── auth-context.tsx                # Auth provider (uses /auth/login)
│   ├── student-context.tsx             # Students state (uses /students/*)
│   ├── types.ts                        # Student / ClassSession / CourseClasses types
│   └── utils.ts
├── public/                             # Logos + placeholder images
├── .env.local.example                  # Copy to .env.local
└── package.json
```

## Quick Start

### 1. Install dependencies

```bash
cd driving-school-management
npm install   # or pnpm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
# Edit if your backend runs somewhere other than http://localhost:8000/api/v1
```

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

### 4. Logging in

Use the admin email and password configured in the **backend's** `.env` file
(`ADMIN_EMAIL` and `ADMIN_PASSWORD`). The login page intentionally does NOT
show any demo credentials — those values live only on the server.

## How authentication works

1. User enters email + password on `/login`.
2. Frontend `POST /api/v1/auth/login` → backend validates against env-based
   `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
3. On success, backend returns `{ access_token, user }`.
4. Frontend stores `{ user, token }` in `localStorage` under
   `driving-school-auth` and `driving-school-token`.
5. Every subsequent API call attaches `Authorization: Bearer <token>` via
   `lib/api.ts`.
6. `logout()` clears both keys.

Tokens expire after `ACCESS_TOKEN_EXPIRE_MINUTES` (default 24 h). On 401,
the dashboard layout redirects to `/login`.

## How the dashboard works

The dashboard no longer reads from `localStorage`. It calls
`GET /api/v1/dashboard/stats` which returns aggregate counts, license-type
distribution, financial totals, and the 7 most recent admissions — all
computed in the database by the backend.

## How students / classes work

- `GET /api/v1/students/?search=&status=&drivingType=` powers the list page.
- `POST /api/v1/students/` creates a student AND auto-initializes the full set
  of class sessions (20 practical + 2 engine + 2 theory for cars, etc.) based
  on `CLASS_STRUCTURE` in `app/services/class_initializer.py`.
- `PATCH /api/v1/students/{id}/classes/{class_id}` toggles completion or
  updates the note for a single class session. The frontend optimistically
  updates the local cache and rolls back on error.

## Production deployment

1. Build the production bundle:

   ```bash
   npm run build
   npm start
   ```

2. Set `NEXT_PUBLIC_API_URL` to your production backend URL
   (e.g. `https://api.your-domain.com/api/v1`).
3. Deploy on Vercel / Netlify / your own Node host.
4. Make sure your backend's `BACKEND_CORS_ORIGINS` includes your production
   frontend URL.

## Notes

- The original demo credentials block (`admin@drivingschool.com` / `admin123`)
  has been **removed** from the login page UI, error messages, and placeholders.
  Those values are now defined ONLY in the backend's environment.
- The `licenseType` field was renamed to `drivingType` across the codebase to
  match the backend model — the migration is handled in
  `alembic/versions/a1b2c3d4e5f6_rename_license_type_add_columns.py`.
