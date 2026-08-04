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

printf '\n\033[32mAll checks passed: typecheck, engine tests, regression tests, production build.\033[0m\n'
