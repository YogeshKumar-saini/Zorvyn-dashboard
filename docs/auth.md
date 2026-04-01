# Authentication & Profile Documentation

This module handles user registration, secure login, profile retrieval, and session termination. All endpoints use JWT-based authentication.

## Security
Endpoints in this module are rate-limited to prevent brute-force attacks.

## Endpoints

### 1. Register a New User
`POST /api/v1/auth/register`

Creates a new user account with a default role of **VIEWER**.

**Request Body:**
- `email` (string, required): A valid email address (lowercased).
- `password` (string, required): Minimum 8 characters. Must contain at least one uppercase letter, one lowercase letter, one number, and one special character.
- `name` (string, required): At least 2 characters.

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "c cuid here",
    "email": "user@email.com",
    "name": "Jane Doe",
    "role": "VIEWER",
    "createdAt": "iso-date"
  }
}
```

### 2. Login
`POST /api/v1/auth/login`

Authenticates a user and returns a signed JWT token.

**Request Body:**
- `email` (string, required)
- `password` (string, required)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5...",
    "user": {
      "id": "c cuid here",
      "email": "jane@doe.com",
      "name": "Jane Doe",
      "role": "VIEWER"
    }
  }
}
```

**Errors:**
- `401`: Invalid email or password.
- `403`: Account is **INACTIVE** or **SUSPENDED**.

### 3. Logout
`POST /api/v1/auth/logout`

Invalidates the current session by blacklisting the active JWT token.

**Security:** `Bearer Token` required.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 4. Get Current Profile
`GET /api/v1/auth/me`

Returns the profile details of the currently authenticated user.

**Security:** `Bearer Token` required.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "c cuid here",
    "email": "jane@doe.com",
    "name": "Jane Doe",
    "role": "VIEWER"
  }
}
```
