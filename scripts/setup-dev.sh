#!/usr/bin/env bash
set -euo pipefail

# TCG Matchmaker — local dev setup
# Resets the database (migrations + seed), then creates auth users via the
# Supabase Auth Admin API with the same hardcoded UUIDs from the seed.
# This ensures all foreign key references (events, participants, etc.) work.
#
# Usage: bash scripts/setup-dev.sh

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== 1. Reset database (migrations + seed) ==="
cd "$PROJECT_DIR"
supabase db reset --local

echo ""
echo "=== 2. Wait for Auth API to be ready ==="
SUPABASE_JSON=$(cd "$PROJECT_DIR" && supabase status --output json 2>/dev/null)
API_URL=$(echo "$SUPABASE_JSON" | grep -o '"API_URL":"[^"]*"' | cut -d'"' -f4)
SERVICE_ROLE_KEY=$(echo "$SUPABASE_JSON" | grep -o '"SERVICE_ROLE_KEY":"[^"]*"' | cut -d'"' -f4)

for i in $(seq 1 30); do
  HEALTH=$(curl -s -o /dev/null -w '%{http_code}' "$API_URL/auth/v1/health" 2>/dev/null || true)
  if [ "$HEALTH" = "200" ]; then
    echo "Auth API ready"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Timed out waiting for Auth API"
    exit 1
  fi
  sleep 1
done

echo ""
echo "=== 3. Create auth users ==="
AUTH_API="$API_URL/auth/v1"

create_user() {
  local id="$1" email="$2"
  local status
  status=$(curl -s -X POST "$AUTH_API/admin/users" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -d "{\"id\":\"$id\",\"email\":\"$email\",\"password\":\"password123\",\"email_confirm\":true}" \
    -w "%{http_code}" -o /dev/null 2>/dev/null)
  echo "  $email ($status)"
}

create_user "00000000-0000-0000-0000-000000000001" "admin@tcgmatch.app"
create_user "00000000-0000-0000-0000-000000000002" "alice@example.com"
create_user "00000000-0000-0000-0000-000000000003" "bob@example.com"
create_user "00000000-0000-0000-0000-000000000004" "carol@example.com"
create_user "00000000-0000-0000-0000-000000000005" "dave@example.com"

echo ""
echo "=== Done ==="
echo "All accounts: password123"
echo "  admin@tcgmatch.app  (role: admin)"
echo "  alice@example.com   (role: player)"
echo "  bob@example.com     (role: player)"
echo "  carol@example.com   (role: player)"
echo "  dave@example.com    (role: player)"
