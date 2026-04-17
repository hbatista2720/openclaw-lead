#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/repos"
if [[ ! -d "$ROOT/repos/twenty/.git" ]]; then
  git clone --depth 1 https://github.com/twentyhq/twenty.git "$ROOT/repos/twenty"
fi
if [[ ! -d "$ROOT/repos/openclaw/.git" ]]; then
  git clone --depth 1 https://github.com/openclaw/openclaw.git "$ROOT/repos/openclaw"
fi
echo "Listo: repos/twenty y repos/openclaw"
