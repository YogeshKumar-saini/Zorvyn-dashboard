#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api/v1"
ADMIN_EMAIL="admin@zorvyn.com"
ADMIN_PASS="Password@123!"
ANALYST_EMAIL="analyst@zorvyn.com"
ANALYST_PASS="Password@123!"
VIEWER_EMAIL="viewer@zorvyn.com"
VIEWER_PASS="Password@123!"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🚀 Starting End-to-End Tests for Zorvyn Finance Backend..."

# Helper to log in and get token
get_token() {
  local email=$1
  local pass=$2
  curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\", \"password\":\"$pass\"}" | jq -r '.data.token'
}

# Helper to check status code
check_status() {
  local method=$1
  local path=$2
  local token=$3
  local data=$4
  local expected=$5
  local description=$6

  local response
  if [ -n "$data" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$API_URL$path" \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      -d "$data")
  else
    response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$API_URL$path" \
      -H "Authorization: Bearer $token")
  fi

  if [ "$response" -eq "$expected" ]; then
    echo -e "${GREEN}[PASS]${NC} $description (Status: $response)"
  else
    echo -e "${RED}[FAIL]${NC} $description (Expected: $expected, Got: $response)"
  fi
}

echo "--- 🔐 Authentication Tests ---"
check_status "POST" "/auth/login" "" "{\"email\":\"$ADMIN_EMAIL\", \"password\":\"$ADMIN_PASS\"}" 200 "Admin login success"
check_status "POST" "/auth/login" "" "{\"email\":\"$ADMIN_EMAIL\", \"password\":\"wrong\"}" 401 "Admin login fail (wrong pass)"

ADMIN_TOKEN=$(get_token "$ADMIN_EMAIL" "$ADMIN_PASS")
ANALYST_TOKEN=$(get_token "$ANALYST_EMAIL" "$ANALYST_PASS")
VIEWER_TOKEN=$(get_token "$VIEWER_EMAIL" "$VIEWER_PASS")

echo "--- 👥 User Management Tests (RBAC) ---"
check_status "GET" "/users" "$ADMIN_TOKEN" "" 200 "Admin can list users"
check_status "GET" "/users" "$ANALYST_TOKEN" "" 403 "Analyst cannot list users"
check_status "GET" "/users" "$VIEWER_TOKEN" "" 403 "Viewer cannot list users"

echo "--- 📊 Dashboard Access Tests ---"
check_status "GET" "/dashboard/summary" "$VIEWER_TOKEN" "" 200 "Viewer can see summary"
check_status "GET" "/dashboard/trends" "$VIEWER_TOKEN" "" 403 "Viewer cannot see trends"
check_status "GET" "/dashboard/trends" "$ANALYST_TOKEN" "" 200 "Analyst can see trends"

echo "--- 💰 Financial Records Tests ---"
# Create a test record
RECORD_JSON="{\"amount\": 500, \"type\": \"EXPENSE\", \"category\": \"Test\", \"date\": \"$(date -I)\", \"notes\": \"E2E Test Record\"}"
check_status "POST" "/records" "$ADMIN_TOKEN" "$RECORD_JSON" 201 "Admin can create record"
check_status "POST" "/records" "$ANALYST_TOKEN" "$RECORD_JSON" 403 "Analyst cannot create record"

# Get a record ID for further tests
RECORD_ID=$(curl -s -X GET "$API_URL/records" -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.data[0].id')

check_status "GET" "/records/$RECORD_ID" "$ANALYST_TOKEN" "" 200 "Analyst can view specific record"
check_status "GET" "/records/$RECORD_ID" "$VIEWER_TOKEN" "" 403 "Viewer cannot view specific record"

# Update test
check_status "PATCH" "/records/$RECORD_ID" "$ADMIN_TOKEN" "{\"amount\": 600}" 200 "Admin can update record"
check_status "PATCH" "/records/$RECORD_ID" "$ANALYST_TOKEN" "{\"amount\": 700}" 403 "Analyst cannot update record"

# Delete test
check_status "DELETE" "/records/$RECORD_ID" "$ADMIN_TOKEN" "" 200 "Admin can delete record"
check_status "GET" "/records/$RECORD_ID" "$ADMIN_TOKEN" "" 404 "Deleted record not found (soft delete check)"

echo "--- ✅ E2E Testing Complete ---"
