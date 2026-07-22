#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR"
STEMS_DIR="$OUTPUT_DIR/stems"
METRONOME_SCRIPT="$SCRIPT_DIR/gerar-metronomo.py"

# Passo 1: voz (qualidade excelente no modo karaoke)
VOCALS_MODEL="htdemucs"
VOCALS_ARGS=(--two-stems=vocals -o "$STEMS_DIR")

# Passo 2: violão com stem dedicado (htdemucs_6s tem saída "guitar")
GUITAR_MODEL="htdemucs_6s"
GUITAR_ARGS=(--two-stems=guitar -o "$STEMS_DIR")

# Mais shifts = melhor qualidade, mais lento (padrão Demucs: 1; paper: 10)
GUITAR_SHIFTS="${DEMUCS_GUITAR_SHIFTS:-2}"

usage() {
  cat <<'EOF'
Uso: extrair-voz.sh <url-do-youtube> [nome-da-pasta]

Baixa o áudio do YouTube e separa voz e violão em dois passos:

  1. htdemucs --two-stems=vocals   → vocals.wav (voz limpa)
  2. htdemucs_6s --two-stems=guitar → guitar.wav (violão dedicado)

O no_vocals.wav antigo (tudo menos voz) virou karaoke.wav.
O violão isolado fica em guitar.wav e também em no_vocals.wav (compat).

Saída:
  vozes/<titulo>.wav
  vozes/stems/htdemucs/<titulo>/
    vocals.wav
    karaoke.wav
    guitar.wav
    no_vocals.wav       (= guitar.wav)
    metronome.wav
    vocals-metronomo.wav

Dependências: yt-dlp, ffmpeg, demucs, python3 + librosa + soundfile
  pip install demucs librosa soundfile

Variáveis opcionais:
  DEMUCS_GUITAR_SHIFTS=2   # aumenta qualidade do violão (mais lento)

Exemplo:
  ./extrair-voz.sh "https://www.youtube.com/watch?v=Gk63pcDYkLE"
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Erro: '$1' não encontrado." >&2
    exit 1
  fi
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" || $# -lt 1 ]]; then
  usage
  [[ $# -lt 1 ]] && exit 1
fi

URL="$1"
CUSTOM_NAME="${2:-}"

require_cmd yt-dlp
require_cmd ffmpeg
require_cmd demucs
require_cmd python3

if [[ ! -x "$METRONOME_SCRIPT" ]]; then
  echo "Erro: gerar-metronomo.py não encontrado em $METRONOME_SCRIPT" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR" "$STEMS_DIR"

if [[ -n "$CUSTOM_NAME" ]]; then
  DOWNLOAD_TEMPLATE="$OUTPUT_DIR/${CUSTOM_NAME}.%(ext)s"
  AUDIO_FILE="$OUTPUT_DIR/${CUSTOM_NAME}.wav"
else
  DOWNLOAD_TEMPLATE="$OUTPUT_DIR/%(title)s.%(ext)s"
  AUDIO_FILE="$(yt-dlp --skip-download --print filename -x --audio-format wav -o "$DOWNLOAD_TEMPLATE" "$URL")"
fi

echo "→ Baixando áudio do YouTube..."
yt-dlp -x --audio-format wav -o "$DOWNLOAD_TEMPLATE" "$URL"

if [[ ! -f "$AUDIO_FILE" && "$AUDIO_FILE" == *.mp4 ]]; then
  AUDIO_FILE="${AUDIO_FILE%.mp4}.wav"
fi

if [[ ! -f "$AUDIO_FILE" ]]; then
  echo "Erro: arquivo não encontrado após download: $AUDIO_FILE" >&2
  exit 1
fi

STEM_FOLDER="$(basename "$AUDIO_FILE" .wav)"
STEM_PATH="$STEMS_DIR/$VOCALS_MODEL/$STEM_FOLDER"
GUITAR_PATH="$STEMS_DIR/$GUITAR_MODEL/$STEM_FOLDER"

echo "→ [1/2] Extraindo voz ($VOCALS_MODEL)..."
demucs "${VOCALS_ARGS[@]}" "$AUDIO_FILE"

if [[ -f "$STEM_PATH/no_vocals.wav" ]]; then
  mv "$STEM_PATH/no_vocals.wav" "$STEM_PATH/karaoke.wav"
fi

echo "→ [2/2] Extraindo violão ($GUITAR_MODEL, stem dedicado, shifts=$GUITAR_SHIFTS)..."
demucs -n "$GUITAR_MODEL" --shifts "$GUITAR_SHIFTS" "${GUITAR_ARGS[@]}" "$AUDIO_FILE"

if [[ ! -f "$GUITAR_PATH/guitar.wav" ]]; then
  echo "Erro: guitar.wav não gerado em $GUITAR_PATH" >&2
  exit 1
fi

cp "$GUITAR_PATH/guitar.wav" "$STEM_PATH/guitar.wav"
cp "$GUITAR_PATH/guitar.wav" "$STEM_PATH/no_vocals.wav"

echo "→ Gerando metrônomo (BPM fixo a partir do violão)..."
python3 "$METRONOME_SCRIPT" "$STEM_PATH"

echo
echo "Pronto!"
echo "  Original:     $AUDIO_FILE"
echo "  Voz:          $STEM_PATH/vocals.wav"
echo "  Violão:       $STEM_PATH/guitar.wav"
echo "  Karaoke:      $STEM_PATH/karaoke.wav  (tudo menos voz, passo 1)"
echo "  Metrônomo:    $STEM_PATH/metronome.wav"
echo "  Voz + click:  $STEM_PATH/vocals-metronomo.wav"
