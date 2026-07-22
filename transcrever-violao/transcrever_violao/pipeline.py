"""Orquestração da Fase 1: GAPS → MIDI → tab → GP5."""

from __future__ import annotations

import time
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from transcrever_violao.analyze import build_analysis, write_analysis
from transcrever_violao.audio import audio_duration, detect_bpm, resolve_guitar_audio
from transcrever_violao.gaps import transcribe_to_midi
from transcrever_violao.gp5 import export_gp5
from transcrever_violao.midi_io import load_notes, quantize_notes
from transcrever_violao.export_assets import export_assets
from transcrever_violao.tab import render_tab

Device = Literal["auto", "cpu", "cuda", "mps"]


@dataclass
class TranscriptionResult:
    audio: Path
    output_dir: Path
    midi: Path
    tab: Path
    gp5: Path
    analysis: Path
    assets: Path
    bpm: float
    notes_raw: int
    events: int
    elapsed_sec: float


def default_output_dir(audio_path: Path, explicit: Path | None) -> Path:
    if explicit:
        return explicit
    if audio_path.parent.name in {"htdemucs", "stems"}:
        return audio_path.parent / "transcricao"
    return audio_path.parent / "transcricao"


def run(
    input_path: Path,
    *,
    output_dir: Path | None = None,
    bpm: float | None = None,
    division: int = 32,
    device: Device = "auto",
    batch_size: int = 4,
    skip_gp5: bool = False,
) -> TranscriptionResult:
    t0 = time.time()
    audio_path = resolve_guitar_audio(input_path)
    out_dir = default_output_dir(audio_path, output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    midi_path = out_dir / "arranjo.mid"
    tab_path = out_dir / "arranjo.tab.txt"
    gp5_path = out_dir / "arranjo.gp5"
    analysis_path = out_dir / "analise.json"

    transcribe_to_midi(audio_path, midi_path, device=device, batch_size=batch_size)

    raw_notes = load_notes(midi_path)
    if bpm is None:
        bpm = detect_bpm(audio_path)

    events = quantize_notes(raw_notes, bpm, division)
    tab_path.write_text(
        render_tab(events, bpm, division=division, raw_notes=raw_notes),
        encoding="utf-8",
    )

    if not skip_gp5:
        title = audio_path.parent.name if audio_path.parent else audio_path.stem
        export_gp5(
            events,
            gp5_path,
            title=title,
            bpm=bpm,
            division=division,
            raw_notes=raw_notes,
        )

    analysis = build_analysis(
        audio_path=audio_path,
        midi_path=midi_path,
        bpm=bpm,
        duration_sec=audio_duration(audio_path),
        raw_notes=raw_notes,
        events=events,
        division=division,
        device=device,
    )
    write_analysis(analysis, analysis_path)

    title = audio_path.parent.name if audio_path.parent else audio_path.stem
    assets_dir = export_assets(out_dir, title=title, audio_path=audio_path)

    return TranscriptionResult(
        audio=audio_path,
        output_dir=out_dir,
        midi=midi_path,
        tab=tab_path,
        gp5=gp5_path,
        analysis=analysis_path,
        assets=assets_dir,
        bpm=bpm,
        notes_raw=len(raw_notes),
        events=len(events),
        elapsed_sec=time.time() - t0,
    )
