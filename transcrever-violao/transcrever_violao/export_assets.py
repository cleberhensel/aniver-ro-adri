"""Exporta ficheiros leves para o viewer web (sem HTML por pasta)."""

from __future__ import annotations

import json
from pathlib import Path

from transcrever_violao.alphatex import export_alphatex
from transcrever_violao.midi_io import load_notes, quantize_notes
from transcrever_violao.tab import render_tab


def export_assets(
    output_dir: Path,
    *,
    title: str | None = None,
    audio_path: Path | None = None,
) -> Path:
    output_dir = output_dir.resolve()
    analysis_path = output_dir / "analise.json"
    midi_path = output_dir / "arranjo.mid"

    if not analysis_path.is_file():
        raise FileNotFoundError(f"analise.json não encontrado em {output_dir}")

    analysis = json.loads(analysis_path.read_text(encoding="utf-8"))
    stem_title = title or output_dir.parent.name

    resumo = {
        "id": output_dir.parent.name,
        "title": stem_title,
        "bpm": analysis.get("bpm"),
        "duration_sec": analysis.get("duration_sec"),
        "notes_raw": analysis.get("notes_raw"),
        "events_quantized": analysis.get("events_quantized"),
        "polyphony": analysis.get("polyphony", {}),
        "model": analysis.get("model"),
        "generated_at": analysis.get("generated_at"),
        "audio": _pick_audio_name(output_dir.parent, audio_path),
    }
    (output_dir / "resumo.json").write_text(
        json.dumps(resumo, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    if midi_path.is_file():
        raw_notes = load_notes(midi_path)
        alphatex = export_alphatex(
            [],
            title=stem_title,
            bpm=float(resumo.get("bpm") or 120),
            division=int(analysis.get("division") or 32),
            raw_notes=raw_notes,
        )
        (output_dir / "arranjo.alphatex.txt").write_text(alphatex, encoding="utf-8")
        events = quantize_notes(raw_notes, float(resumo.get("bpm") or 120))
        (output_dir / "arranjo.tab.txt").write_text(
            render_tab(
                events,
                float(resumo.get("bpm") or 120),
                division=int(analysis.get("division") or 32),
                raw_notes=raw_notes,
            ),
            encoding="utf-8",
        )

    if midi_path.is_file():
        playback = [
            {"s": round(s, 4), "d": round(max(0.05, e - s), 4), "p": int(p)}
            for s, e, p in load_notes(midi_path)
        ]
        (output_dir / "playback.json").write_text(
            json.dumps(playback, ensure_ascii=False),
            encoding="utf-8",
        )

    return output_dir


def _pick_audio_name(stem_dir: Path, audio_path: Path | None) -> str:
    for name in ("guitar.mp3", "guitar.wav", "no_vocals.wav"):
        if (stem_dir / name).is_file():
            return name
    if audio_path and audio_path.is_file():
        return audio_path.name
    return "guitar.mp3"
