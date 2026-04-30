#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
ENV_LOCAL="$ROOT/infra/env.development"

if [[ ! -f "$ENV_LOCAL" ]]; then
  echo "No hay infra/env.development — parando igual con valores por defecto del compose:"
  docker compose down
  exit 0
fi

docker compose --env-file "$ENV_LOCAL" down
