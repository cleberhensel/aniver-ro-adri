#!/usr/bin/env bash
# Inicia o servidor web (lista + viewer de todas as transcrições)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
exec node server.mjs "${1:-}"
