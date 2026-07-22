#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
VENV="$ROOT/.venv"

if [[ ! -d "$VENV" ]]; then
  echo "Ambiente não instalado. Rode: $ROOT/install.sh" >&2
  exit 1
fi

# shellcheck disable=SC1091
source "$VENV/bin/activate"
exec python -m transcrever_violao "$@"
