#!/usr/bin/env bash
# Compare regenerated artifacts with their current contents, including uncommitted changes.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
snapshot="$(mktemp -d)"
trap 'rm -rf "$snapshot"' EXIT
files=(openapi/openapi.json packages/client/src/schema.d.ts packages/client/README.md)
for index in "${!files[@]}"; do
  cp "$root/${files[$index]}" "$snapshot/$index"
done
(cd "$root/api" && npm run --silent openapi:export)
(cd "$root/packages/client" && npm run --silent build)
changed=0
for index in "${!files[@]}"; do
  if ! cmp -s "$snapshot/$index" "$root/${files[$index]}"; then
    echo "Regenerated ${files[$index]}; review and commit this updated artifact." >&2
    changed=1
  fi
done
if [ "$changed" -ne 0 ]; then exit 1; fi
echo "SDK is up to date."
