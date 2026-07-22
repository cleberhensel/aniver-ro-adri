"""Transcrição áudio → MIDI com modelo GAPS (guitar-gaps.pth)."""

from __future__ import annotations

from pathlib import Path
from typing import Literal

from hf_midi_transcription import MidiTranscriptionModel

Device = Literal["auto", "cpu", "cuda", "mps"]

_model: MidiTranscriptionModel | None = None
_model_device: str | None = None


def load_model(
    device: Device = "auto",
    batch_size: int = 4,
    onset_threshold: float = 0.3,
    offset_threshold: float = 0.3,
    frame_threshold: float = 0.1,
) -> MidiTranscriptionModel:
    global _model, _model_device

    resolved = None if device == "auto" else device
    if _model is not None and _model_device == (resolved or "auto"):
        return _model

    kwargs: dict = {
        "instrument": "guitar",
        "checkpoint_path": "guitar-gaps.pth",
        "batch_size": batch_size,
        "onset_threshold": onset_threshold,
        "offset_threshold": offset_threshold,
        "frame_threshold": frame_threshold,
    }
    if resolved:
        kwargs["device"] = resolved

    _model = MidiTranscriptionModel(**kwargs)
    _model_device = resolved or "auto"
    return _model


def transcribe_to_midi(
    audio_path: Path,
    midi_path: Path,
    *,
    device: Device = "auto",
    batch_size: int = 4,
) -> Path:
    model = load_model(device=device, batch_size=batch_size)
    midi_path.parent.mkdir(parents=True, exist_ok=True)
    model.transcribe(str(audio_path), str(midi_path))
    return midi_path
