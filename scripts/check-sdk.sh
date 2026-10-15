#!/usr/bin/env bash
# Fails if openapi/openapi.json or the generated client types are out of date
# with the API source. Run before committing API changes (or in CI).
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"

(cd "$root/api" && npm run --silent openapi:export)
(cd "$root/packages/client" && npm run --silent build)

if ! git -C "$root" diff --exit-code -- openapi packages/client/src/schema.d.ts; then
  echo "SDK is stale: commit the regenerated files above." >&2
  exit 1
fi
echo "SDK is up to date."
