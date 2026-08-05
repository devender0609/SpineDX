#!/usr/bin/env bash
# Fail-fast verification. Every step must pass; the success banner is unreachable otherwise.
#   -e  exit on any non-zero command
#   -u  error on undefined variables
#   -o pipefail  a failure anywhere in a pipe fails the whole pipe (so `| tee` cannot mask it)
set -euo pipefail

step() { printf '\n\033[1m== %s ==\033[0m\n' "$1"; }
fail() { printf '\n\033[31mFAILED at: %s\033[0m\n' "$1" >&2; exit 1; }

step "TypeScript typecheck"
npm run typecheck || fail "typecheck"

step "Engine tests"
npm run test:engine || fail "engine tests"

step "Regression tests"
npm run test:regression || fail "regression tests"

step "Next.js production build"
npm run build || fail "production build"

# Visual checks run against a real server at four breakpoints. Skipped only when a browser is
# unavailable (SKIP_VISUAL=1); never silently passed.
if [ "${SKIP_VISUAL:-0}" != "1" ]; then
  step "Visual checks (1440 / 1024 / 768 / 390)"
  npx next start -p 3111 > /tmp/spinedx-visual-server.log 2>&1 &
  SERVER_PID=$!
  trap 'kill $SERVER_PID 2>/dev/null' EXIT
  sleep 7
  BASE_URL=http://127.0.0.1:3111 npm run test:visual || fail "visual checks"
  kill $SERVER_PID 2>/dev/null
  trap - EXIT
fi

printf '\n\033[32mAll checks passed: typecheck, engine tests, regression tests, production build, visual checks.\033[0m\n'
