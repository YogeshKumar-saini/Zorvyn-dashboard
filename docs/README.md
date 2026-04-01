# Zorvyn Finance Dashboard API Documentation

Welcome to the Zorvyn Finance Dashboard API documentation. This is an industrial-grade, secure, and role-based access control (RBAC) backend built with Node.js, TypeScript, and Prisma.

## Base URL
The API is versioned and currently deployed at:
`http://localhost:3000/api/v1`

## Authentication
All protected routes require a Bearer Token in the `Authorization` header:
`Authorization: Bearer <your_jwt_token>`

Tokens are obtained via the [Login](./auth.md#login) endpoint. On logout, the token is blacklisted and cannot be reused.

## Role-Based Access Control (RBAC)
The system enforces a strict hierarchy:

| Role | Description |
| :--- | :--- |
| **VIEWER** | Can view summaries and recent activity. Cannot view detailed record lists. |
| **ANALYST** | Can view all records, summaries, trends, and statistics. Cannot modify data. |
| **ADMIN** | Full control over users and financial records. |

## Global Security Features
- **Helmet**: Hardened security headers (Clickjacking, XSS, etc.).
- **Rate Limiting**: Protection against brute-force (Global and Auth-specific).
- **Audit Logging**: Every mutation and login is tracked in the system audit logs.
- **Swagger Documentation**: Interactive API documentation is available at `/api/docs`.

## System Routes (Unauthenticated)
| Route | Description |
| :--- | :--- |
| `GET /health` | Detailed health check (DB connectivity, uptime, version). |
| `GET /ready` | Simple readiness probe for orchestration. |
| `GET /` | Redirects to interactive Swagger documentation. |

## API Modules
Detailed route documentation is split into the following files:

1. [**Authentication & Profile**](./auth.md): Registration, Login, Logout, and Profile.
2. [**User Management**](./users.md): Admin-only user CRUD and status/role updates.
3. [**Financial Records**](./records.md): Transaction management and filtering.
4. [**Dashboard & Analytics**](./dashboard.md): Summaries, trends, and statistics.

## Error Responses
The API uses a structured JSON error format:

```json
{
  "success": false,
  "message": "Specific error message",
  "errors": { "field": ["detail"] }, // Optional Zod validation issues
  "stack": "..." // Only in development mode
}
```

### Common Status Codes
- `200 OK`: Successful response.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Input error or illegal operation (e.g. self-deletion).
- `401 Unauthorized`: Authentication required or invalid token.
- `403 Forbidden`: Insufficient role permissions.
- `404 Not Found`: Resource not found.
- `409 Conflict`: Resource already exists (e.g. duplicate email).
- `422 Unprocessable Entity`: Schema validation failed (Zod).
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Serious unexpected server error.
