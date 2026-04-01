# Zorvyn Finance Backend

An **industrial-grade** Node.js / TypeScript / Express backend for financial data processing, analytics, and role-based access control.

---

## ✨ Features

| Category | Details |
|---|---|
| **Auth** | JWT authentication with logout/token blacklisting |
| **RBAC** | VIEWER → ANALYST → ADMIN role hierarchy |
| **Security** | Helmet, CORS whitelist, rate limiting, bcrypt cost 12 |
| **Validation** | Zod schemas on all inputs — fail fast with clear messages |
| **Audit Trail** | Every mutation logged to `AuditLog` with before/after state |
| **Soft Delete** | Users and records are never hard-deleted |
| **Observability** | Structured Pino logging with per-request trace IDs |
| **API Docs** | Swagger UI at `/api/docs` with full requestBody/response specs |
| **Testing** | Vitest + Supertest integration tests |
| **DevOps** | Multi-stage Dockerfile, Docker Compose, GitHub Actions CI |

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20
- npm >= 9

### 1. Clone & Install
```bash
git clone <repo-url>
cd zorvyn-dashboard
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET (32+ chars)
```

### 3. Set Up Database
```bash
npm run db:migrate    # Run migrations
npm run db:seed       # Seed test users and records
```

### 4. Run
```bash
npm run dev
```

Server starts at `http://localhost:3000`  
API docs at `http://localhost:3000/api/docs`

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | No | `development` / `production` / `test` |
| `PORT` | No | Server port (default: `3000`) |
| `DATABASE_URL` | **Yes** | SQLite: `file:./prisma/dev.db` |
| `JWT_SECRET` | **Yes** | Min 32 chars. Generate: `openssl rand -hex 64` |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `7d`) |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |
| `LOG_LEVEL` | No | `info` / `debug` / `warn` / `error` |

---

## 📁 Project Structure

```
src/
├── app.ts                    # Express app — middleware, routes, graceful shutdown
├── config/
│   └── env.ts                # Zod-validated env config — throws on missing vars
├── constants/
│   └── index.ts              # Single source of truth for Role, Status, RecordType
├── lib/
│   ├── prisma.ts             # Prisma singleton with structured logging
│   └── logger.ts             # Pino structured logger
├── middleware/
│   ├── auth.middleware.ts    # JWT verify + token blacklist
│   ├── rbac.middleware.ts    # requireRole / requireMinRole guards
│   ├── error.middleware.ts   # Centralised error → JSON handler
│   ├── rateLimiter.middleware.ts  # Global + auth-specific rate limits
│   ├── requestId.middleware.ts    # Per-request trace ID
│   └── notFound.middleware.ts     # JSON 404 handler
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts  # Thin: parse → call service → respond
│   │   ├── auth.service.ts     # Business logic: register, login, logout
│   │   ├── auth.schema.ts      # Zod: strong password enforcement
│   │   └── auth.router.ts      # Routes + Swagger annotations
│   ├── users/      (same structure)
│   ├── records/    (same structure)
│   └── dashboard/  (same structure)
├── types/
│   └── express.d.ts          # Global Express Request augmentation
└── utils/
    ├── response.ts           # sendSuccess / sendError helpers
    └── pagination.ts         # getPagination / buildPaginationMeta
prisma/
├── schema.prisma             # User, FinancialRecord, AuditLog models
└── seed.ts                   # Idempotent seed script
```

---

## 🔐 API Endpoints

All routes are prefixed `/api/v1`. Full interactive docs at `/api/docs`.

### Auth
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new account |
| POST | `/auth/login` | Public | Login, returns JWT |
| POST | `/auth/logout` | Any | Revoke current token |
| GET | `/auth/me` | Any | Get own profile |

### Records
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/records` | Analyst+ | List with filter/pagination |
| GET | `/records/:id` | Analyst+ | Get single record |
| POST | `/records` | Admin | Create record |
| PATCH | `/records/:id` | Admin | Update record |
| DELETE | `/records/:id` | Admin | Soft-delete record |

### Dashboard
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/dashboard/summary` | Any | Income/expense/balance totals |
| GET | `/dashboard/recent` | Any | Last 10 transactions |
| GET | `/dashboard/by-category` | Analyst+ | Totals by category |
| GET | `/dashboard/trends` | Analyst+ | Monthly trends (last N months) |
| GET | `/dashboard/stats` | Analyst+ | Record count breakdown |

### Users (Admin only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | List all users |
| GET | `/users/:id` | Get user by ID |
| POST | `/users` | Create user |
| PATCH | `/users/:id/role` | Update role |
| PATCH | `/users/:id/status` | Update status |
| DELETE | `/users/:id` | Soft-delete user |

---

## 🧪 Testing

```bash
npm run test          # Run all tests once
npm run test:watch    # Watch mode
npm run test:cover    # With coverage report
```

---

## 🛠 Development Scripts

```bash
npm run dev           # Start with hot-reload
npm run build         # Compile TypeScript → dist/
npm run lint          # Check for lint errors
npm run lint:fix      # Auto-fix lint errors
npm run format        # Prettier format
npm run db:studio     # Open Prisma Studio (visual DB browser)
npm run db:reset      # Reset DB + re-seed
```

---

## 🐳 Docker

```bash
# Development (with hot-reload)
docker-compose up

# Production build
docker build -t zorvyn-api .
docker run -p 3000:3000 --env-file .env zorvyn-api
```

---

## 📊 Monitoring

| Endpoint | Description |
|---|---|
| `GET /health` | DB connectivity + uptime check |
| `GET /ready` | Kubernetes readiness probe |
| `GET /api/docs` | Swagger UI |

---

## 🔒 Security

- **Helmet** — HTTP security headers (XSS, clickjacking, MIME sniffing)
- **CORS** — Whitelist-only origin policy via `ALLOWED_ORIGINS`
- **Rate Limiting** — 300 req/15min globally; 10 attempts/15min on auth routes
- **JWT Blacklisting** — Revoked on logout (in-memory, upgrade to Redis for HA)
- **Soft Delete** — No hard deletes; data preserved for audit
- **Audit Log** — Every mutation traced to the acting user with IP and before/after state
- **Bcrypt cost 12** — Resistant to GPU-based cracking

---


