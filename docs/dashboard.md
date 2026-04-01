# Dashboard & Analytics Documentation

The dashboard module provides powerful, real-time insights into the financial system by aggregating data across the entire platform.

## Access Control

The level of analytical granularity available is determined by the user's role:

| Action | Allowed Roles |
| :--- | :--- |
| **Get Summary** | **VIEWER**, **ANALYST**, **ADMIN** |
| **Recent Activity** | **VIEWER**, **ANALYST**, **ADMIN** |
| **All Other Analytics** | **ANALYST**, **ADMIN** |

## Endpoints

### 1. Financial Summary
`GET /api/v1/dashboard/summary`

Returns the total income, total expenses, and net balance across all recorded data.

**Security:** `Bearer Token (Any Role)` required.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalIncome": 2500,
    "totalExpenses": 1200,
    "netBalance": 1300,
    "currency": "USD"
  }
}
```

### 2. Category Breakdown
`GET /api/v1/dashboard/by-category`

Returns financial data grouped by category and type.

**Security:** `Bearer Token (Analyst+)` required.

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    { "category": "Sales", "type": "INCOME", "_sum": { "amount": 2500 } },
    { "category": "Office", "type": "EXPENSE", "_sum": { "amount": 200 } }
  ]
}
```

### 3. Monthly Trends
`GET /api/v1/dashboard/trends`

Returns aggregated monthly income and expense data for the last `N` months.

**Security:** `Bearer Token (Analyst+)` required.

**Query Parameters:**
- `months` (number, default: 6, max: 24)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    { "month": "2026-03", "income": 1000, "expense": 500 },
    { "month": "2026-04", "income": 1500, "expense": 700 }
  ]
}
```

### 4. Recent Activity
`GET /api/v1/dashboard/recent`

Returns the last 10 transactions recorded in the system.

**Security:** `Bearer Token (Any Role)` required.

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "c cuid here",
      "amount": 100,
      "type": "EXPENSE",
      "category": "Travel",
      "date": "iso-date",
      "creator": { "name": "Admin User" }
    }
  ]
}
```

### 5. Statistics Overview
`GET /api/v1/dashboard/stats`

Returns record count statistics and type breakdowns.

**Security:** `Bearer Token (Analyst+)` required.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 12,
    "typeBreakdown": [
      { "type": "INCOME", "_count": 8 },
      { "type": "EXPENSE", "_count": 4 }
    ],
    "recentCount": 5 // Records created in the last 30 days
  }
}
```

> [!TIP]
> **Real-Time Data**: All aggregates are calculated directly on the database using optimized queries. They reflect the current state of all non-deleted records in real-time.
