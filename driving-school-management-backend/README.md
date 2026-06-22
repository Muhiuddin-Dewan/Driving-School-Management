# Driving School Management — Backend API

Production-grade FastAPI backend with JWT authentication, dashboard analytics,
student CRUD, and class-session tracking.

## Tech Stack

| Layer            | Choice                                              |
| ---------------- | --------------------------------------------------- |
| Framework        | FastAPI                                             |
| ORM              | SQLAlchemy 2.x                                      |
| Migrations       | Alembic                                             |
| DB (dev)         | SQLite (`./driving_school.db`)                      |
| DB (production)  | PostgreSQL (`postgresql+psycopg://...`)             |
| Auth             | JWT (HS256) via `PyJWT` + `passlib[bcrypt]`         |
| Settings         | `pydantic-settings` reading from `.env` / env vars  |
| File uploads     | Local disk under `uploads/photos/`                  |

## Project Layout

```
driving-school-management-backend/
├── alembic/                # Migration scripts
│   ├── env.py
│   └── versions/           # Migration files
├── app/
│   ├── api/                # Route handlers
│   │   ├── auth.py         # POST /api/v1/auth/login
│   │   ├── dashboard.py    # GET  /api/v1/dashboard/stats
│   │   └── student.py      # Students + class sessions CRUD
│   ├── core/
│   │   ├── config.py       # Env-based settings
│   │   ├── security.py     # JWT + password hashing
│   │   └── deps.py         # Auth dependency
│   ├── models/
│   │   └── student.py      # Student + ClassSession ORM models
│   ├── schemas/            # Pydantic schemas
│   ├── services/
│   │   ├── class_initializer.py
│   │   └── photo_storage.py
│   ├── database.py
│   └── main.py             # FastAPI app entry point
├── uploads/photos/         # Uploaded student photos (gitignored)
├── .env.example            # Copy to .env and edit
├── .env                    # Local dev config (gitignored)
├── alembic.ini
├── requirements.txt
└── README.md
```

## API Endpoints

All `/api/v1/*` endpoints (except `/auth/login`) require a `Authorization: Bearer <token>` header.

| Method | Path                                       | Description                                            |
| ------ | ------------------------------------------ | ------------------------------------------------------ |
| POST   | `/api/v1/auth/login`                       | Issue JWT for admin email/password                     |
| GET    | `/api/v1/dashboard/stats`                  | Aggregate stats for the dashboard                      |
| GET    | `/api/v1/students/`                        | List students (`?search=&status=&drivingType=&page=1`) |
| POST   | `/api/v1/students/`                        | Create student (multipart form, optional photo)        |
| GET    | `/api/v1/students/{id}`                    | Get a single student with all class sessions           |
| PUT    | `/api/v1/students/{id}`                    | Update student (multipart form, optional photo)        |
| DELETE | `/api/v1/students/{id}`                    | Delete student (cascades classes + removes photo)      |
| PATCH  | `/api/v1/students/{id}/classes/{class_id}` | Toggle completion or update note of a class session    |
| GET    | `/health`                                  | Health check                                           |
| GET    | `/api/v1/docs`                             | Swagger UI                                             |
| GET    | `/uploads/photos/<file>`                   | Served static student photos                           |

## Quick Start

### 1. Install dependencies

```bash
cd driving-school-management-backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env to set:
#   DATABASE_URL           (use SQLite for local dev or Postgres for prod)
#   JWT_SECRET_KEY         (generate with: python -c "import secrets;print(secrets.token_hex(32))")
#   ADMIN_EMAIL            (your admin login email)
#   ADMIN_PASSWORD         (your admin login password)
#   BACKEND_CORS_ORIGINS   (comma-separated list of allowed frontend origins)
```

> **Security note**: The admin credentials are stored ONLY in the backend `.env`
> file (or as real environment variables in production). They are never sent to
> the frontend; the frontend only POSTs the user-entered email/password to
> `/auth/login` and receives a JWT.

### 3. Run database migrations

```bash
alembic upgrade head
```

### 4. Start the server

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000/api/v1` with interactive
docs at `http://localhost:8000/api/v1/docs`.

## Switching to PostgreSQL

1. Set `DATABASE_URL=postgresql+psycopg://user:password@host:5432/driving_school` in `.env`.
2. Run `alembic upgrade head` to apply migrations to the new database.

## Production Deployment Checklist

- [ ] Set `DEBUG=False`
- [ ] Set `JWT_SECRET_KEY` to a long random string (≥ 32 bytes)
- [ ] Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` to real values
- [ ] Set `BACKEND_CORS_ORIGINS` to your production frontend URL only
- [ ] Set `DATABASE_URL` to your managed PostgreSQL instance
- [ ] Run `alembic upgrade head` against the production DB
- [ ] Serve uploads via a CDN or S3 in front of FastAPI (or replace `photo_storage.py`)
- [ ] Run behind HTTPS (e.g., via Nginx/Caddy/ALB)
- [ ] Restrict `/api/v1/docs` to internal traffic (or set `openapi_url=None`)

## Adding New Migrations

After changing models in `app/models/`:

```bash
# Auto-generate a migration
alembic revision --autogenerate -m "describe change here"

# Review the generated file in alembic/versions/, then apply
alembic upgrade head
```

## License

Proprietary — internal use only.
