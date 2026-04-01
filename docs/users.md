# User Management Documentation

This module provides administrators with powerful tools to manage the user database, including role assignments and account status controls.

> [!IMPORTANT]
> **Administrative Access Required**: All endpoints in this module strictly require the **ADMIN** role. Analysts and Viewers will receive a **403 Forbidden** error.

## Endpoints

### 1. List Users (Paginated)
`GET /api/v1/users`

Returns a paginated list of all active users in the system.

**Security:** `Bearer Token (Admin)` required.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "c cuid here",
      "email": "user1@zorvyn.com",
      "name": "User One",
      "role": "ANALYST",
      "status": "ACTIVE",
      "createdAt": "iso-date"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1
  }
}
```

### 2. Get User Details
`GET /api/v1/users/:id`

Retrieves the full profile of a specific user.

**Security:** `Bearer Token (Admin)` required.

**Success Response (200):**
```json
{
  "success": true,
  "data": { ...user_details }
}
```

**Errors:**
- `404`: User not found or is soft-deleted.

### 3. Create User
`POST /api/v1/users`

Allows an administrator to manually create an account with a specific role.

**Request Body:**
- `email` (string, required)
- `password` (string, required)
- `name` (string, required)
- `role` (enum: VIEWER, ANALYST, ADMIN, default: VIEWER)

**Success Response (201):**
```json
{
  "success": true,
  "data": { ...created_user }
}
```

### 4. Update Role
`PATCH /api/v1/users/:id/role`

Promotes or demotes a user by updating their system role.

**Request Body:**
- `role` (enum: VIEWER, ANALYST, ADMIN)

**Success Response (200):**
```json
{
  "success": true,
  "data": { ...updated_user }
}
```

### 5. Update Status (Suspension/Deactivation)
`PATCH /api/v1/users/:id/status`

Changes the operational status of a user account.

**Request Body:**
- `status` (enum: ACTIVE, INACTIVE, SUSPENDED)

**Success Response (200):**
```json
{
  "success": true,
  "data": { ...updated_user }
}
```

> [!TIP]
> **Suspension Impact**: Setting a user to **SUSPENDED** or **INACTIVE** immediately blocks their ability to log in or use existing JWT tokens.

### 6. Delete User (Soft-Delete)
`DELETE /api/v1/users/:id`

Soft-deletes a user from the system. The user is marked as deleted but remains in the database for audit integrity.

**Security:** `Bearer Token (Admin)` required.

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

> [!CAUTION]
> **Self-Deletion Denied**: Administrators cannot delete their own account using this endpoint. This prevents accidental lockouts.
