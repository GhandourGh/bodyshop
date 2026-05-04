#!/usr/bin/env bash
# One-shot verification: builds + optional live HTTP checks.
# Usage (from repo root):
#   bash scripts/verify-autoforge-stack.sh
#
# Live HTTP checks (optional): VERIFY_LIVE=1 with Next.js running
#   VERIFY_LIVE=1 NEXT_BASE_URL=http://127.0.0.1:3000 \
#   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='secret' \
#   bash scripts/verify-autoforge-stack.sh
#
# If the admin user has TOTP enabled, also set:
#   TOTP_CODE=123456
#
# Skip live HTTP (builds only):
#   VERIFY_LIVE=0 bash scripts/verify-autoforge-stack.sh
#
# FastAPI (optional):
#   AI_SERVICE_URL=http://127.0.0.1:8000 bash scripts/verify-autoforge-stack.sh

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FAIL=0
pass() { echo "[PASS] $*"; }
fail() { echo "[FAIL] $*"; FAIL=$((FAIL + 1)); }
warn() { echo "[WARN] $*"; }

run_named() {
  local name="$1" x=0
  shift
  if "$@"; then
    pass "$name"
  else
    x=$?
    fail "$name (exit $x)"
  fi
}

echo "=== Repo: $ROOT ==="
echo ""

echo "=== Prisma schema (intern-db) ==="
run_named "prisma validate" bash -c "cd \"${ROOT}/intern-db\" && npx prisma validate"

echo ""
echo "=== Builds ==="
run_named "intern-db npm run build" bash -c "cd \"${ROOT}/intern-db\" && npm run build"
run_named "autoforge-frontend npm run build" bash -c "cd \"${ROOT}/autoforge-frontend\" && npm run build"

echo ""
echo "=== Python (FastAPI entry) ==="
if command -v python3 >/dev/null 2>&1; then
  run_named "py_compile main.py" python3 -m py_compile "$ROOT/main.py"
else
  warn "python3 not found — skipping py_compile"
fi

VERIFY_LIVE="${VERIFY_LIVE:-0}"
if [[ "$VERIFY_LIVE" != "1" ]]; then
  echo ""
  echo "VERIFY_LIVE=0 — skipping HTTP checks."
  if [[ "$FAIL" -eq 0 ]]; then
    echo ""
    echo "All static checks passed."
    exit 0
  fi
  echo ""
  echo "Done with $FAIL failure(s)."
  exit 1
fi

echo ""
echo "=== Live HTTP (NEXT_BASE_URL, admin APIs, optional AI) ==="

NEXT_BASE_URL="${NEXT_BASE_URL:-http://127.0.0.1:3000}"
NEXT_BASE_URL="${NEXT_BASE_URL%/}"

curl_json() {
  curl -sS --connect-timeout 2 --max-time 15 "$@"
}

# Public Next route
if out=$(curl_json -o /dev/null -w "%{http_code}" "$NEXT_BASE_URL/api/damage-repair-guide" 2>/dev/null); then
  if [[ "$out" == "200" ]]; then
    pass "GET $NEXT_BASE_URL/api/damage-repair-guide (200)"
  else
    fail "GET /api/damage-repair-guide HTTP $out (is Next.js running on intern-db?)"
  fi
else
  fail "GET /api/damage-repair-guide — connection failed (start: cd intern-db && npm run dev)"
fi

ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
TOTP_CODE="${TOTP_CODE:-}"

if [[ -z "$ADMIN_EMAIL" || -z "$ADMIN_PASSWORD" ]]; then
  warn "ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping authenticated API checks"
else
  login_body=$(curl_json -X POST "$NEXT_BASE_URL/api/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":$(python3 -c "import json,sys; print(json.dumps(sys.argv[1]))" "$ADMIN_EMAIL"),\"password\":$(python3 -c "import json,sys; print(json.dumps(sys.argv[1]))" "$ADMIN_PASSWORD")}")

  if ! python3 -c "import json,sys; j=json.loads(sys.argv[1]); sys.exit(0 if j.get('success') else 1)" "$login_body" 2>/dev/null; then
    fail "POST /api/auth/login — $login_body"
  else
    pass "POST /api/auth/login (success JSON)"
    step=$(python3 -c "import json,sys; print(json.loads(sys.argv[1]).get('data',{}).get('step','') or '')" "$login_body" 2>/dev/null || echo "")
    token=""
    if [[ "$step" == "totp_required" ]]; then
      if [[ -z "$TOTP_CODE" ]]; then
        fail "Login requires TOTP — set TOTP_CODE=... or use an admin without 2FA for this script"
      else
        pending=$(python3 -c "import json,sys; print(json.loads(sys.argv[1]).get('data',{}).get('pendingToken',''))" "$login_body")
        complete_body=$(curl_json -X POST "$NEXT_BASE_URL/api/auth/login/complete" \
          -H 'Content-Type: application/json' \
          -d "{\"pendingToken\":$(python3 -c "import json,sys; print(json.dumps(sys.argv[1]))" "$pending"),\"code\":$(python3 -c "import json,sys; print(json.dumps(sys.argv[1]))" "$TOTP_CODE")}")
        if python3 -c "import json,sys; j=json.loads(sys.argv[1]); sys.exit(0 if j.get('success') else 1)" "$complete_body" 2>/dev/null; then
          pass "POST /api/auth/login/complete"
          token=$(python3 -c "import json,sys; print(json.loads(sys.argv[1]).get('data',{}).get('token',''))" "$complete_body")
        else
          fail "POST /api/auth/login/complete — $complete_body"
        fi
      fi
    else
      token=$(python3 -c "import json,sys; print(json.loads(sys.argv[1]).get('data',{}).get('token',''))" "$login_body")
    fi

    if [[ -n "$token" ]]; then
      hdr=(-H "Authorization: Bearer $token")
      if code=$(curl_json "${hdr[@]}" -o /dev/null -w "%{http_code}" "$NEXT_BASE_URL/api/admin/credentials" 2>/dev/null); then
        [[ "$code" == "200" ]] && pass "GET /api/admin/credentials ($code)" || fail "GET /api/admin/credentials HTTP $code"
      else
        fail "GET /api/admin/credentials — request failed"
      fi
      if code=$(curl_json "${hdr[@]}" -o /dev/null -w "%{http_code}" "$NEXT_BASE_URL/api/admin/integration-logs?limit=5" 2>/dev/null); then
        [[ "$code" == "200" ]] && pass "GET /api/admin/integration-logs ($code)" || fail "GET /api/admin/integration-logs HTTP $code"
      fi
      if code=$(curl_json "${hdr[@]}" -o /dev/null -w "%{http_code}" "$NEXT_BASE_URL/api/jobs" 2>/dev/null); then
        [[ "$code" == "200" ]] && pass "GET /api/jobs ($code)" || fail "GET /api/jobs HTTP $code"
      fi
    fi
  fi
fi

AI_SERVICE_URL="${AI_SERVICE_URL:-}"
if [[ -n "$AI_SERVICE_URL" ]]; then
  AI_SERVICE_URL="${AI_SERVICE_URL%/}"
  if code=$(curl_json -o /dev/null -w "%{http_code}" "$AI_SERVICE_URL/health" 2>/dev/null); then
    [[ "$code" == "200" ]] && pass "GET $AI_SERVICE_URL/health ($code)" || fail "GET /health HTTP $code (FastAPI up?)"
  else
    fail "GET $AI_SERVICE_URL/health — connection failed"
  fi
else
  warn "AI_SERVICE_URL unset — skipping FastAPI /health"
fi

echo ""
if [[ "$FAIL" -eq 0 ]]; then
  echo "=== Summary: all checks passed ==="
  exit 0
fi
echo "=== Summary: $FAIL failure(s) ==="
exit 1
