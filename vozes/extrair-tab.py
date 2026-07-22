#!/usr/bin/env python3
"""Transcreve violão (stem) para MIDI e tablatura ASCII."""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

import librosa
import numpy as np
import pretty_midi
from basic_pitch import ICASSP_2022_MODEL_PATH
from basic_pitch.inference import predict

OPEN_STRINGS = {6: 40, 5: 45, 4: 50, 3: 55, 2: 59, 1: 64}
STRING_LABELS = ["e", "B", "G", "D", "A", "E"]
MAX_FRET = 20


def detect_bpm(audio_path: Path) -> float:
    y, sr = librosa.load(audio_path, sr=None, mono=True)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    bpm = float(np.atleast_1d(tempo)[0])
    if bpm > 160:
        half = bpm / 2
        if 55 <= half <= 160:
            bpm = half
    return bpm


def fret_options(midi_note: int) -> list[tuple[int, int]]:
    opts = []
    for string, open_pitch in OPEN_STRINGS.items():
        fret = midi_note - open_pitch
        if 0 <= fret <= MAX_FRET:
            opts.append((string, fret))
    return opts


def assign_frets(pitches: list[int]) -> list[tuple[int, int]]:
    assigned: list[tuple[int, int]] = []
    last_string: int | None = None
    for i, pitch in enumerate(sorted(pitches)):
        options = fret_options(pitch)
        if not options:
            continue

        def cost(option: tuple[int, int]) -> float:
            string, fret = option
            score = fret * 2.0
            if i == 0 and pitch <= 57:
                score += (7 - string) * 2.5
            if last_string is not None:
                score += abs(string - last_string) * 1.2
            return score

        best = min(options, key=cost)
        assigned.append(best)
        last_string = best[0]
    return assigned


def transcribe_to_midi(audio_path: Path, midi_path: Path) -> int:
    _, midi_data, note_events = predict(str(audio_path), ICASSP_2022_MODEL_PATH)
    midi_data.write(str(midi_path))
    return len(note_events)


def load_notes(midi_path: Path) -> list[tuple[float, float, int]]:
    pm = pretty_midi.PrettyMIDI(str(midi_path))
    notes: list[tuple[float, float, int]] = []
    for instrument in pm.instruments:
        for note in instrument.notes:
            notes.append((note.start, note.end, note.pitch))
    notes.sort()
    return notes


def quantize_notes(
    notes: list[tuple[float, float, int]],
    bpm: float,
    division: int = 16,
) -> list[tuple[float, list[int]]]:
    step = 60.0 / bpm / (division / 4)
    buckets: dict[float, set[int]] = defaultdict(set)
    for start, _end, pitch in notes:
        q = round(start / step) * step
        buckets[q].add(pitch)

    return [(t, sorted(pitches)) for t, pitches in sorted(buckets.items()) if pitches]


def render_tab(
    events: list[tuple[float, list[int]]],
    bpm: float,
    division: int = 16,
    cols_per_line: int = 48,
) -> str:
    step = 60.0 / bpm / (division / 4)
    lines = {s: [] for s in range(1, 7)}

    def push_cell(cell: dict[int, str]) -> None:
        for string in range(1, 7):
            lines[string].append(cell.get(string, "-"))

    push_cell({})

    for _time, pitches in events:
        frets = assign_frets(pitches)
        cell = {string: str(fret) for string, fret in frets}
        push_cell(cell)

    def fmt_line(string_num: int) -> str:
        label = STRING_LABELS[string_num - 1]
        chunks = []
        cells = lines[string_num]
        for i in range(0, len(cells), cols_per_line):
            part = cells[i : i + cols_per_line]
            body = "".join(f"-{c}-" for c in part)
            chunks.append(f"{label}|{body}|")
        return "\n".join(chunks)

    header = (
        f"Tablatura gerada automaticamente (referência, não é partitura oficial)\n"
        f"BPM: {bpm:.1f} | Resolução: 1/{division} | Dica: confira pelo ouvido\n\n"
    )
    return header + "\n\n".join(fmt_line(s) for s in range(1, 7))


def export_json(events: list[tuple[float, list[int]]], bpm: float, path: Path) -> None:
    data = {
        "bpm": bpm,
        "events": [
            {
                "time": round(t, 4),
                "pitches": pitches,
                "fingering": [
                    {"string": s, "fret": f} for s, f in assign_frets(pitches)
                ],
            }
            for t, pitches in events
        ],
    }
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def resolve_audio(path: Path) -> Path:
    if path.is_dir():
        guitar = path / "no_vocals.wav"
        if not guitar.is_file():
            raise FileNotFoundError(f"no_vocals.wav não encontrado em {path}")
        return guitar
    return path


def extract(
    audio: Path,
    output_dir: Path | None = None,
    bpm: float | None = None,
    division: int = 16,
) -> dict:
    audio_path = resolve_audio(audio)
    out_dir = output_dir or audio_path.parent / "arranjo"
    out_dir.mkdir(parents=True, exist_ok=True)

    midi_path = out_dir / "arranjo.mid"
    tab_path = out_dir / "arranjo.tab.txt"
    json_path = out_dir / "arranjo.json"

    note_count = transcribe_to_midi(audio_path, midi_path)
    notes = load_notes(midi_path)
    if bpm is None:
        bpm = detect_bpm(audio_path)

    events = quantize_notes(notes, bpm, division)
    tab_path.write_text(render_tab(events, bpm, division), encoding="utf-8")
    export_json(events, bpm, json_path)

    return {
        "audio": audio_path,
        "midi": midi_path,
        "tab": tab_path,
        "json": json_path,
        "bpm": bpm,
        "notes": note_count,
        "events": len(events),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("audio", type=Path, help="no_vocals.wav ou pasta do stem")
    parser.add_argument("-o", "--output-dir", type=Path, default=None)
    parser.add_argument("--bpm", type=float, default=None)
    parser.add_argument(
        "--division",
        type=int,
        default=16,
        choices=(8, 16, 32),
        help="Resolução rítmica da tab (semicolcheias = 16)",
    )
    args = parser.parse_args()

    if not args.audio.exists():
        print(f"Erro: não encontrado: {args.audio}", file=sys.stderr)
        return 1

    result = extract(args.audio, args.output_dir, args.bpm, args.division)
    print(f"BPM:        {result['bpm']:.1f}")
    print(f"Notas MIDI: {result['notes']}")
    print(f"Eventos:    {result['events']}")
    print(f"MIDI:       {result['midi']}")
    print(f"Tab:        {result['tab']}")
    print(f"JSON:       {result['json']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
