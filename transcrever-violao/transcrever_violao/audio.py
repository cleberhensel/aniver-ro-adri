"""Resolução de entrada e análise de áudio."""

from __future__ import annotations

from pathlib import Path

import librosa
import numpy as np


def resolve_guitar_audio(path: Path) -> Path:
    """Aceita guitar.wav, no_vocals.wav ou pasta do stem."""
    if path.is_dir():
        for name in ("guitar.wav", "no_vocals.wav"):
            candidate = path / name
            if candidate.is_file():
                return candidate
        raise FileNotFoundError(
            f"Nenhum stem de violão em {path} (esperado guitar.wav ou no_vocals.wav)"
        )
    if not path.is_file():
        raise FileNotFoundError(f"Arquivo não encontrado: {path}")
    return path


def detect_bpm(audio_path: Path) -> float:
    y, sr = librosa.load(audio_path, sr=None, mono=True)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    bpm = float(np.atleast_1d(tempo)[0])
    if bpm > 160:
        half = bpm / 2
        if 55 <= half <= 160:
            bpm = half
    return bpm


def audio_duration(audio_path: Path) -> float:
    return float(librosa.get_duration(path=str(audio_path)))
