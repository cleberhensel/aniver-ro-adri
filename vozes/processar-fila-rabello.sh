#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

LOG="$SCRIPT_DIR/ultimo-run-fila.log"
FILA="$SCRIPT_DIR/fila-extracao-rabello-matogrosso.md"

declare -a ITEMS=(
  "08|1ELr-NJEYmE|O Mundo É Um Moinho"
  "09|Bi3nfTpgGFw|As Rosas Não Falam"
  "10|WKp54sG21_4|Autonomia"
  "11|A7wlOiegWDQ|Prelúdio No.3 (Prelúdio da Solidão)"
  "12|Vj2kqqcj_Kw|Três Apitos"
  "14|_AZbTLk8nTE|Negue"
  "15|sVFoB7iwKtQ|Na Baixa do Sapateiro"
  "16|mZJPoPgfzcY|Vereda Tropical"
  "17|J1fzFgdyPII|Balada do Louco"
)

mark_done() {
  local num="$1"
  local name="$2"
  sed -i '' "s/| ${num} | ⏳ pendente | ${name} |/| ${num} | ✅ feito | ${name} |/" "$FILA" 2>/dev/null || true
}

is_done() {
  local num="$1"
  local dir
  dir=$(find "$SCRIPT_DIR/stems/htdemucs" -maxdepth 1 -type d -name "${num} *" 2>/dev/null | head -1)
  [[ -n "$dir" && -f "$dir/guitar.wav" && -f "$dir/vocals-metronomo.wav" ]]
}

finish_metronome_if_needed() {
  local dir="$1"
  if [[ -f "$dir/guitar.wav" && ! -f "$dir/vocals-metronomo.wav" ]]; then
    python3 "$SCRIPT_DIR/gerar-metronomo.py" "$dir"
  fi
}

{
  echo "=== Retomando fila — $(date) ==="
  for entry in "${ITEMS[@]}"; do
    IFS='|' read -r num id name <<< "$entry"
    url="https://www.youtube.com/watch?v=${id}"
    dir=$(find "$SCRIPT_DIR/stems/htdemucs" -maxdepth 1 -type d -name "${num} *" 2>/dev/null | head -1)

    if is_done "$num"; then
      mark_done "$num" "$name"
      echo "→ [#${num}] ${name} — já completo, pulando"
      continue
    fi

    if [[ -n "$dir" && -f "$dir/guitar.wav" ]]; then
      echo "→ [#${num}] ${name} — finalizando metrônomo"
      finish_metronome_if_needed "$dir"
      mark_done "$num" "$name"
      echo "  ✅ concluído"
      continue
    fi

    echo
    echo "→ [#${num}] ${name}"
    echo "  ${url}"
    if ./extrair-voz.sh "$url"; then
      mark_done "$num" "$name"
      echo "  ✅ concluído"
    else
      echo "  ❌ falhou"
      exit 1
    fi
  done
  echo
  echo "=== Fila completa — $(date) ==="
} 2>&1 | tee -a "$LOG"
