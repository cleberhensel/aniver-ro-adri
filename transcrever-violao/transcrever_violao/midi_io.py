"""Leitura e quantização de MIDI."""

from __future__ import annotations

from pathlib import Path

import pretty_midi

TimedEvent = tuple[float, list[int], float]


def load_notes(midi_path: Path) -> list[tuple[float, float, int]]:
    pm = pretty_midi.PrettyMIDI(str(midi_path))
    notes: list[tuple[float, float, int]] = []
    for instrument in pm.instruments:
        for note in instrument.notes:
            notes.append((note.start, note.end, note.pitch))
    notes.sort()
    return notes


def quantize_onsets(
    notes: list[tuple[float, float, int]],
    bpm: float,
    *,
    merge_ms: float = 15.0,
    min_duration_ms: float = 40.0,
) -> list[TimedEvent]:
    """Agrupa apenas ataques quase simultâneos; preserva arpejos.

    Retorna (tempo, pitches, duração em segundos até o próximo ataque).
    """
    if not notes:
        return []

    sorted_notes = sorted(notes)
    min_dur = min_duration_ms / 1000.0
    merge = merge_ms / 1000.0
    clusters: list[tuple[float, list[int], float]] = []

    i = 0
    while i < len(sorted_notes):
        start = sorted_notes[i][0]
        cluster_notes = [sorted_notes[i]]
        pitches = {sorted_notes[i][2]}
        j = i + 1
        while j < len(sorted_notes) and sorted_notes[j][0] - start <= merge:
            cluster_notes.append(sorted_notes[j])
            pitches.add(sorted_notes[j][2])
            j += 1
        midi_dur = max(e - s for s, e, _ in cluster_notes)
        clusters.append((start, sorted(pitches), max(midi_dur, min_dur)))
        i = j

    timed: list[TimedEvent] = []
    for idx, (start, pitches, midi_dur) in enumerate(clusters):
        if idx + 1 < len(clusters):
            gap = clusters[idx + 1][0] - start
            dur = max(min_dur, min(gap, max(midi_dur, min_dur)))
        else:
            dur = max(midi_dur, min_dur)
        timed.append((start, pitches, dur))

    return timed


def quantize_notes(
    notes: list[tuple[float, float, int]],
    bpm: float,
    division: int = 32,
    *,
    merge_ms: float = 15.0,
) -> list[tuple[float, list[int]]]:
    """Compat: retorna só (tempo, pitches) para tab/GP5 legado."""
    _ = division  # reservado; durações vêm do MIDI, não da grelha
    return [(t, p) for t, p, _ in quantize_onsets(notes, bpm, merge_ms=merge_ms)]
