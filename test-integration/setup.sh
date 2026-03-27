#!/usr/bin/env bash
set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────
BACKEND_URL="${QAMELOT_URL:-http://localhost:5002}"
PROJECT_NAME="${QAMELOT_PROJECT:-Playwright Integration Test}"
PLAN_NAME="${QAMELOT_PLAN:-Automation Plan}"

# Auth: expects QAMELOT_USER and QAMELOT_PASS env vars (or .env file)
if [ -f "$(dirname "$0")/.env" ]; then
  # shellcheck source=/dev/null
  source "$(dirname "$0")/.env"
fi

QAMELOT_USER="${QAMELOT_USER:?Set QAMELOT_USER (email) in env or test-integration/.env}"
QAMELOT_PASS="${QAMELOT_PASS:?Set QAMELOT_PASS in env or test-integration/.env}"

echo "==> Qamelot automation setup"
echo "    Backend: $BACKEND_URL"
echo "    Project: $PROJECT_NAME"
echo "    Plan:    $PLAN_NAME"

# ─── Step 1: Log in to get JWT ───────────────────────────────────
echo "==> Logging in as $QAMELOT_USER..."
LOGIN_RESPONSE=$(curl -sf "$BACKEND_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\": \"$QAMELOT_USER\", \"password\": \"$QAMELOT_PASS\"}" \
  2>&1) || { echo "ERROR: Login failed"; exit 1; }

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "ERROR: Could not extract access token from login response"
  exit 1
fi

# ─── Step 2: Find or create project + plan ───────────────────────
echo "==> Setting up project + plan (idempotent)..."
SETUP_RESPONSE=$(curl -sf "$BACKEND_URL/automation/setup" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"projectName\": \"$PROJECT_NAME\", \"planName\": \"$PLAN_NAME\"}" \
  2>&1) || { echo "ERROR: Setup call failed"; exit 1; }

PROJECT_ID=$(echo "$SETUP_RESPONSE" | jq -r '.projectId')
PLAN_ID=$(echo "$SETUP_RESPONSE" | jq -r '.planId')
CREATED=$(echo "$SETUP_RESPONSE" | jq -r '.created')

if [ "$CREATED" = "true" ]; then
  echo "    Created new project: $PROJECT_ID"
else
  echo "    Reusing existing project: $PROJECT_ID"
fi
echo "    Plan ID: $PLAN_ID"

# ─── Output ──────────────────────────────────────────────────────
echo ""
echo "==> Done! Use these values in your Playwright config:"
echo "    projectId: $PROJECT_ID"
echo "    planId:    $PLAN_ID"
echo ""
echo "    Export for CI:"
echo "    export QAMELOT_PROJECT_ID=$PROJECT_ID"
echo "    export QAMELOT_PLAN_ID=$PLAN_ID"
