#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
VENV="$ROOT/.venv"

if [[ ! -d "$VENV" ]]; then
  echo "Criando venv em $VENV ..."
  python3 -m venv "$VENV"
fi

# shellcheck disable=SC1091
source "$VENV/bin/activate"

pip install --upgrade pip
pip install -r "$ROOT/requirements.txt"

if command -v npm >/dev/null 2>&1; then
  echo "Instalando alphaTab (viewer web)..."
  npm install --prefix "$ROOT" --omit=dev
else
  echo "Aviso: npm não encontrado — viewer web precisa de node + npm install" >&2
fi

echo ""
echo "Pronto. Use: $ROOT/transcrever.sh <guitar.wav|pasta-do-stem>"
echo "Viewer:   $ROOT/servir.sh  →  http://localhost:8765/"
