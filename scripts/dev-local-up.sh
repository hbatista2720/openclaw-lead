#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_LOCAL="$ROOT/infra/env.development"
EXAMPLE="$ROOT/infra/env.development.example"

if [[ ! -f "$ENV_LOCAL" ]]; then
  echo "No existe $ENV_LOCAL"
  cp "$EXAMPLE" "$ENV_LOCAL"
  echo "✓ Creado desde ejemplo. Revísalo y ejecuta de nuevo:"
  echo "  $ENV_LOCAL"
  exit 0
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker no está instalado o no está en PATH."
  exit 1
fi

if [[ -f "$ROOT/.env" ]]; then
  echo "⚠ Aviso: existe también .env en la raíz. Docker Compose puede mezclar variables."
  echo "   Si ves URL o contraseña del VPS, renombra .env temporalmente, p. ej.:"
  echo "   mv .env .env.backup_produccion"
  echo ""
fi

mkdir -p "$ROOT/data/openclaw-config" "$ROOT/data/openclaw-workspace"

echo "Levantando Twenty (db + redis + server + worker) con $ENV_LOCAL ..."
docker compose --env-file "$ENV_LOCAL" up -d twenty-db twenty-redis twenty-server twenty-worker

PORT="$(grep -E '^TWENTY_HTTP_PORT=' "$ENV_LOCAL" | head -1 | cut -d= -f2 | tr -d '\r')" || true
PORT="${PORT:-30002}"

echo ""
echo "✓ Listo cuando twenty-server esté healthy:"
echo "  docker compose --env-file $ENV_LOCAL ps"
echo ""
echo "Abre Twenty en: http://localhost:${PORT}"
