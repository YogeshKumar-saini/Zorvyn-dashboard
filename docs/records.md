# Financial Records Documentation

This module manages the core financial data of the system. It handles income, expenses, and powerful filtering capabilities.

## Access Control

The level of interaction is determined by the user's role:

| Action | Allowed Roles |
| :--- | :--- |
| **List/View Records** | **ANALYST**, **ADMIN** |
| **Create/Update/Delete** | **ADMIN** only |

> [!CAUTION]
> **VIEWER Restricted**: Users with the **VIEWER** role cannot access the records list or individual record details. They are only permitted to see aggregated data in the [Dashboard](./dashboard.md).

## Endpoints

### 1. List Records (Paginated & Filtered)
`GET /api/v1/records`

Returns a list of all active (non-deleted) financial records in the system.

**Security:** `Bearer Token (Analyst+)` required.

**Filtering Query Parameters:**
- `type` (enum: INCOME, EXPENSE)
- `category` (string, exact match)
- `startDate` (string, ISO-8601 date)
- `endDate` (string, ISO-8601 date)
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "c cuid here",
      "amount": 2500,
      "type": "INCOME",
      "category": "Sales",
      "date": "2026-04-01T00:00:00.000Z",
      "notes": "Deal #1234",
      "creator": { "id": "admin_id", "email": "admin@zorvyn.com", "name": "Admin User" },
      "createdAt": "iso-date"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

### 2. Get Single Record
`GET /api/v1/records/:id`

Retrieves the full details of a specific record.

**Security:** `Bearer Token (Analyst+)` required.

**Success Response (200):**
```json
{
  "success": true,
  "data": { ...record_details }
}
```

**Errors:**
- `404`: Record not found or is soft-deleted.

### 3. Create Record
`POST /api/v1/records`

Allows an administrator to manually record a transaction.

**Security:** `Bearer Token (Admin)` required.

**Request Body:**
- `amount` (number, strictly positive)
- `type` (enum: INCOME, EXPENSE)
- `category` (string, min 1 char)
- `date` (string, ISO date, optional, default: now)
- `notes` (string, optional)

**Success Response (201):**
```json
{
  "success": true,
  "data": { ...created_record }
}
```

### 4. Update Record
`PATCH /api/v1/records/:id`

Updates the details of an existing financial record. Only provided fields will be modified.

**Security:** `Bearer Token (Admin)` required.

**Success Response (200):**
```json
{
  "success": true,
  "data": { ...updated_record }
}
```

### 5. Delete Record (Soft-Delete)
`DELETE /api/v1/records/:id`

Soft-deletes a record. It will no longer appear in the listing or summary, but remains in the database for audit integrity.

**Security:** `Bearer Token (Admin)` required.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Record deleted successfully"
}
```

> [!NOTE]
> **Audit Trail**: Every creation, update, and deletion is automatically recorded in the system audit logs, tracking the administrator's ID and the timestamp of the action.
