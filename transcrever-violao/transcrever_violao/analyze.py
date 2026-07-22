"""Gera analise.json com métricas da transcrição."""

from __future__ import annotations

import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from transcrever_violao.fretboard import assign_chord_frets


def build_analysis(
    *,
    audio_path: Path,
    midi_path: Path,
    bpm: float,
    duration_sec: float,
    raw_notes: list[tuple[float, float, int]],
    events: list[tuple[float, list[int]]],
    division: int,
    model: str = "guitar-gaps.pth",
    device: str = "auto",
) -> dict:
    poly = [len(p) for _, p in events]
    pitch_hist = Counter(p for _, _, p in raw_notes)

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "pipeline": "transcrever-violao/0.1.0",
        "audio": str(audio_path),
        "midi": str(midi_path),
        "model": model,
        "device": device,
        "duration_sec": round(duration_sec, 2),
        "bpm": round(bpm, 2),
        "division": division,
        "notes_raw": len(raw_notes),
        "events_quantized": len(events),
        "polyphony": {
            "max": max(poly) if poly else 0,
            "mean": round(sum(poly) / len(poly), 2) if poly else 0,
        },
        "pitch_range": {
            "min": min(pitch_hist) if pitch_hist else None,
            "max": max(pitch_hist) if pitch_hist else None,
        },
        "top_pitches": [
            {"midi": p, "count": c}
            for p, c in pitch_hist.most_common(12)
        ],
        "events": [
            {
                "time": round(t, 4),
                "pitches": pitches,
                "fingering": [
                    {"string": s, "fret": f}
                    for s, f in assign_chord_frets(pitches)
                ],
            }
            for t, pitches in events
        ],
    }


def write_analysis(data: dict, path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    return path
