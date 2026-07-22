"""Exportação para Guitar Pro 5 (.gp5)."""

from __future__ import annotations

from pathlib import Path

import guitarpro as gp

from transcrever_violao.fretboard import assign_chord_frets
from transcrever_violao.midi_io import quantize_onsets

QUARTERS_PER_MEASURE = 4.0
VALID_DURATIONS = (1, 2, 4, 8, 16, 32, 64)


def _duration_value(dur_sec: float, bpm: float) -> int:
    quarters = max(1 / 64, dur_sec * bpm / 60.0)
    target = QUARTERS_PER_MEASURE / quarters
    return min(VALID_DURATIONS, key=lambda d: abs(d - target))


def _duration_quarters(dur_value: int) -> float:
    return QUARTERS_PER_MEASURE / dur_value


def _gp_duration(value: int) -> gp.models.Duration:
    return gp.models.Duration(value=value)


def _append_rest_beats(voice: gp.models.Voice, quarters: float) -> None:
    remaining = quarters
    while remaining > 0.01:
        placed = False
        for value in VALID_DURATIONS:
            q = _duration_quarters(value)
            if remaining + 0.01 >= q:
                beat = gp.models.Beat(voice)
                beat.duration = _gp_duration(value)
                beat.status = gp.models.BeatStatus.rest
                voice.beats.append(beat)
                remaining -= q
                placed = True
                break
        if not placed:
            break


def export_gp5(
    events: list[tuple[float, list[int]]],
    output_path: Path,
    *,
    title: str = "Transcrição automática",
    bpm: float = 120.0,
    division: int = 32,
    raw_notes: list[tuple[float, float, int]] | None = None,
) -> Path:
    _ = division
    if raw_notes is not None:
        timed = quantize_onsets(raw_notes, bpm)
    else:
        timed = [(t, p, 60.0 / bpm / 4) for t, p in events]

    song = gp.models.Song()
    song.title = title[:255]
    song.artist = "transcrever-violao"
    song.tempo = int(round(bpm))
    song.tempoName = "Auto"

    track = song.tracks[0]
    track.name = "Violão"
    track.measures = []

    measure_beats: list[tuple[list[tuple[int, int]] | None, int]] = []
    measure_fill = 0.0

    def flush_measure() -> None:
        nonlocal measure_beats, measure_fill
        if not measure_beats:
            return
        if measure_fill < QUARTERS_PER_MEASURE:
            remain = QUARTERS_PER_MEASURE - measure_fill
            rest_val = _duration_value(remain * 60.0 / bpm, bpm)
            measure_beats.append((None, rest_val))
        _write_measure(song, track, measure_beats, bpm)
        measure_beats = []
        measure_fill = 0.0

    for _time, pitches, dur_sec in timed:
        cell = assign_chord_frets(pitches)
        dur_value = _duration_value(dur_sec, bpm)
        beat_q = _duration_quarters(dur_value)

        if measure_fill + beat_q > QUARTERS_PER_MEASURE + 0.01 and measure_beats:
            flush_measure()

        measure_beats.append((cell, dur_value))
        measure_fill += beat_q

        if measure_fill >= QUARTERS_PER_MEASURE - 0.01:
            flush_measure()

    if measure_beats:
        flush_measure()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    gp.write(song, output_path)
    return output_path


def _write_measure(
    song: gp.models.Song,
    track: gp.models.Track,
    beats: list[tuple[list[tuple[int, int]] | None, int]],
    bpm: float,
) -> None:
    if not track.measures:
        header = song.measureHeaders[0]
        header.tempo = int(round(bpm))
    else:
        header = gp.models.MeasureHeader()
        header.tempo = int(round(bpm))
        song.addMeasureHeader(header)

    measure = gp.models.Measure(track, header=header)
    track.measures.append(measure)
    voice = gp.models.Voice(measure)
    measure.voices.append(voice)

    for cell, dur_value in beats:
        if not cell:
            _append_rest_beats(voice, _duration_quarters(dur_value))
            continue
        beat = gp.models.Beat(voice)
        beat.duration = _gp_duration(dur_value)
        for string, fret in cell:
            note = gp.models.Note(beat)
            note.string = string
            note.value = min(int(fret), 24)
            beat.notes.append(note)
        voice.beats.append(beat)
