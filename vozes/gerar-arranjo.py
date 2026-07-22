#!/usr/bin/env python3
"""Mescla cifra conhecida com timing do áudio para gerar arranjo/tab."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import librosa
import numpy as np

ROOTS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]

ROOT_MAP = {
    "C": 0,
    "C#": 1,
    "Db": 1,
    "D": 2,
    "D#": 3,
    "Eb": 3,
    "E": 4,
    "F": 5,
    "F#": 6,
    "Gb": 6,
    "G": 7,
    "G#": 8,
    "Ab": 8,
    "A": 9,
    "A#": 10,
    "Bb": 10,
    "B": 11,
}

# Cordas 6→1: trastes (-1 = abafada)
CHORD_SHAPES: dict[str, list[tuple[int, int]]] = {
    "A": [(6, -1), (5, 0), (4, 2), (3, 2), (2, 2), (1, 0)],
    "A5+": [(6, -1), (5, 0), (4, 2), (3, 3), (2, 2), (1, 0)],
    "A6": [(6, -1), (5, 0), (4, 2), (3, 2), (2, 2), (1, 2)],
    "A6M": [(6, -1), (5, 0), (4, 2), (3, 1), (2, 2), (1, 0)],
    "A7": [(6, -1), (5, 0), (4, 2), (3, 0), (2, 2), (1, 0)],
    "A9": [(6, -1), (5, 0), (4, 2), (3, 0), (2, 2), (1, 0)],
    "A#m/A": [(6, 0), (5, 0), (4, 2), (3, 1), (2, 2), (1, 0)],
    "G": [(6, 3), (5, 2), (4, 0), (3, 0), (2, 0), (1, 3)],
    "F#": [(6, 2), (5, 4), (4, 3), (3, 2), (2, 2), (1, 2)],
    "Bm7": [(6, -1), (5, 2), (4, 4), (3, 2), (2, 3), (1, 2)],
    "Bm": [(6, -1), (5, 2), (4, 4), (3, 4), (2, 3), (1, 2)],
    "Bm5+": [(6, -1), (5, 2), (4, 4), (3, 3), (2, 3), (1, 2)],
    "Bm6": [(6, -1), (5, 2), (4, 4), (3, 4), (2, 4), (1, 2)],
    "E7": [(6, 0), (5, 2), (4, 0), (3, 1), (2, 0), (1, 0)],
    "E7(9)": [(6, 0), (5, 2), (4, 0), (3, 1), (2, 0), (1, 0)],
    "E7(9)(13)": [(6, 0), (5, 2), (4, 0), (3, 1), (2, 0), (1, 0)],
    "E7(9b)": [(6, 0), (5, 2), (4, 0), (3, 1), (2, 0), (1, 0)],
    "E7sus4(9)": [(6, 0), (5, 2), (4, 2), (3, 1), (2, 0), (1, 0)],
    "E6(9-)(5-)": [(6, 0), (5, 2), (4, 1), (3, 1), (2, 0), (1, 0)],
    "D7/E": [(6, 0), (5, 0), (4, 0), (3, 2), (2, 1), (1, 2)],
    "B7+/A": [(6, 0), (5, 2), (4, 1), (3, 3), (2, 0), (1, 2)],
    "B/C#": [(6, -1), (5, 4), (4, 4), (3, 4), (2, 4), (1, 2)],
    "Cm7": [(6, -1), (5, 3), (4, 5), (3, 3), (2, 4), (1, 3)],
    "C#m7": [(6, -1), (5, 4), (4, 6), (3, 4), (2, 5), (1, 4)],
    "Dm7": [(6, -1), (5, 5), (4, 7), (3, 5), (2, 6), (1, 5)],
    "G7(13b)": [(6, 3), (5, 2), (4, 0), (3, 0), (2, 0), (1, 1)],
    "G7": [(6, 3), (5, 2), (4, 0), (3, 0), (2, 0), (1, 1)],
    "F#7(13b)": [(6, 2), (5, 4), (4, 3), (3, 2), (2, 2), (1, 2)],
    "Em": [(6, 0), (5, 2), (4, 2), (3, 0), (2, 0), (1, 0)],
    "E/G": [(6, 3), (5, 2), (4, 2), (3, 0), (2, 0), (1, 0)],
    "Dm7/9": [(6, -1), (5, 5), (4, 7), (3, 5), (2, 6), (1, 5)],
    "Dm7(9)/B": [(6, -1), (5, 2), (4, 0), (3, 0), (2, 1), (1, 0)],
    "B9": [(6, -1), (5, 2), (4, 1), (3, 2), (2, 0), (1, 2)],
}

CHORD_RE = re.compile(
    r"\b("
    r"A#m/A|B7\+/A|B/C#|D7/E|E/G|Dm7\(9\)/B|Dm7/9|"
    r"[A-G][#b]?(?:m|dim|°|º|5\+|6M|6|7M|7|9|11|13|sus4|add9)?"
    r"(?:\([^)]+\))*"
    r"(?:/[A-G][#b]?)?"
    r")\b"
)

STRING_LABELS = ["e", "B", "G", "D", "A", "E"]


def is_chord_line(line: str) -> bool:
    chords = CHORD_RE.findall(line)
    if len(chords) >= 2:
        return True
    if len(chords) == 1:
        pos = line.find(chords[0]) + len(chords[0])
        rest = line[pos:].strip()
        return not rest or bool(CHORD_RE.match(rest))
    return False


def parse_cifra(path: Path) -> tuple[list[str], list[str], str | None]:
    sections: list[str] = []
    chord_lines: list[str] = []
    intro_tab: list[str] = []
    in_intro = False
    in_tab = False

    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.rstrip()
        if line.startswith("[") and line.endswith("]"):
            in_intro = "INTRO" in line.upper()
            sections.append(line)
            in_tab = False
            continue
        if in_intro and line.startswith(("e|", "B|", "G|", "D|", "A|", "E|")):
            intro_tab.append(line)
            in_tab = True
            continue
        if in_tab and not line:
            in_tab = False
            continue
        if not line or line.startswith("─") or line.startswith("Tom:") or line.startswith("Fonte:"):
            continue
        if is_chord_line(line):
            chord_lines.append(line)

    intro = "\n".join(intro_tab) if intro_tab else None
    return sections, chord_lines, intro


def extract_chord_sequence(chord_lines: list[str]) -> list[str]:
    seq: list[str] = []
    for line in chord_lines:
        seq.extend(CHORD_RE.findall(line))
    return seq


def chord_pitch_classes(name: str) -> np.ndarray:
    base = name.split("/")[0]
    slash = name.split("/")[1] if "/" in name else None
    m = re.match(r"^([A-G][#b]?)(.*)$", base)
    if not m:
        return np.ones(12) / 12
    root = ROOT_MAP[m.group(1)]
    qual = m.group(2)

    pcs = {root}
    if qual.startswith("m") and not qual.startswith("m7") and "m7" not in qual:
        pcs.add((root + 3) % 12)
        pcs.add((root + 7) % 12)
    elif "m7" in qual or qual == "m7":
        pcs.update({(root + 3) % 12, (root + 7) % 12, (root + 10) % 12})
    elif "7" in qual or "9" in qual or "13" in qual or "sus4" in qual:
        pcs.update({(root + 4) % 12, (root + 7) % 12, (root + 10) % 12})
    elif "5+" in qual or "5+":
        pcs.update({(root + 4) % 12, (root + 8) % 12})
    elif "6M" in qual:
        pcs.update({(root + 4) % 12, (root + 7) % 12, (root + 9) % 12})
    elif "6" in qual:
        pcs.update({(root + 4) % 12, (root + 7) % 12, (root + 9) % 12})
    else:
        pcs.update({(root + 4) % 12, (root + 7) % 12})

    if slash:
        sm = re.match(r"^([A-G][#b]?)$", slash)
        if sm:
            pcs.add(ROOT_MAP[sm.group(1)])

    vec = np.zeros(12, dtype=np.float32)
    for pc in pcs:
        vec[pc] = 1.0
    if vec.sum():
        vec /= vec.sum()
    return vec


def detect_bpm(y: np.ndarray, sr: int) -> float:
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    bpm = float(np.atleast_1d(tempo)[0])
    if bpm > 160:
        half = bpm / 2
        if 55 <= half <= 160:
            bpm = half
    return bpm


def detect_transpose(chroma_beats: np.ndarray, chords: list[str]) -> int:
    best_shift, best_score = 0, -1e9
    n = min(16, len(chords), chroma_beats.shape[1])
    for shift in range(12):
        score = 0.0
        for i in range(n):
            template = np.roll(chord_pitch_classes(chords[i]), shift)
            score += float(np.dot(chroma_beats[:, i], template))
        if score > best_score:
            best_score = score
            best_shift = shift
    return best_shift


def align_chords(
    chroma_beats: np.ndarray,
    chords: list[str],
    transpose: int,
) -> list[tuple[int, str]]:
    beats = chroma_beats.shape[1]
    n = len(chords)
    templates = [np.roll(chord_pitch_classes(c), transpose) for c in chords]

    dp = np.full((n, beats), -1e9, dtype=np.float32)
    back = np.zeros((n, beats), dtype=np.int32)
    dp[0, :] = [np.dot(chroma_beats[:, j], templates[0]) for j in range(beats)]

    for i in range(1, n):
        for j in range(i, beats):
            local = np.dot(chroma_beats[:, j], templates[i])
            best_prev = j - 1
            best_val = -1e9
            for k in range(i - 1, j):
                val = dp[i - 1, k] + local
                if val > best_val:
                    best_val = val
                    best_prev = k
            dp[i, j] = best_val
            back[i, j] = best_prev

    j = int(np.argmax(dp[-1]))
    indices = [j]
    for i in range(n - 1, 0, -1):
        j = int(back[i, j])
        indices.append(j)
    indices.reverse()
    return [(idx, chords[i]) for i, idx in enumerate(indices)]


def transpose_chord_name(name: str, semitones: int) -> str:
    if semitones == 0:
        return name

    def shift_note(note: str) -> str:
        for sym, pc in ROOT_MAP.items():
            if note == sym:
                return ROOTS[(pc + semitones) % 12]
        return note

    if "/" in name:
        head, bass = name.split("/", 1)
        return f"{transpose_chord_name(head, semitones)}/{shift_note(bass)}"

    m = re.match(r"^([A-G][#b]?)(.*)$", name)
    if not m:
        return name
    return f"{shift_note(m.group(1))}{m.group(2)}"


def shape_for_chord(name: str) -> list[tuple[int, int]]:
    if name in CHORD_SHAPES:
        return CHORD_SHAPES[name]
    base = name.split("/")[0]
    if base in CHORD_SHAPES:
        return CHORD_SHAPES[base]
    root = re.match(r"^([A-G][#b]?)", name)
    if root and root.group(1) in CHORD_SHAPES:
        return CHORD_SHAPES[root.group(1)]
    return CHORD_SHAPES.get("A", [])


def render_shape_tab(shape: list[tuple[int, int]]) -> list[str]:
    by_string = {s: f for s, f in shape}
    lines = []
    for s in range(1, 7):
        fret = by_string.get(s, -1)
        cell = "x" if fret < 0 else str(fret)
        lines.append(f"{STRING_LABELS[s - 1]}|---{cell}---|")
    return lines


def render_timeline(
    aligned: list[tuple[int, str]],
    beat_times: np.ndarray,
    bpm: float,
    transpose: int,
    cifra_path: Path,
    intro_tab: str | None,
) -> str:
    parts = [
        "Arranjo mesclado: cifra + alinhamento cromático no violão gravado",
        f"Cifra: {cifra_path.name}",
        f"BPM: {bpm:.1f} | Transposição detectada: {transpose:+d} semitom(s)",
        "Voicings: shapes comuns em Lá; confira pelo ouvido na gravação do Stefano",
        "",
    ]

    if intro_tab:
        parts.extend(["[INTRO — da cifra]", intro_tab, ""])

    parts.append("[HARMONIA — tempos onde o acorde entra]")
    for beat_idx, chord in aligned:
        t = beat_times[min(beat_idx, len(beat_times) - 1)]
        played = transpose_chord_name(chord, transpose)
        label = f"{played} ({chord})" if transpose else chord
        parts.append(f"\n{label}  @ {t:6.1f}s (tempo {beat_idx + 1})")
        parts.extend(render_shape_tab(shape_for_chord(chord)))

    parts.append("\n\n[SEQUÊNCIA COMPLETA DA CIFRA]")
    parts.append(" → ".join(c for _, c in aligned))
    return "\n".join(parts)


def generate(
    audio: Path,
    cifra: Path,
    output: Path | None = None,
    bpm: float | None = None,
) -> dict:
    if audio.is_dir():
        audio = audio / "no_vocals.wav"

    out = output or audio.parent / "arranjo" / "arranjo-cifra.tab.txt"
    out.parent.mkdir(parents=True, exist_ok=True)

    _, chord_lines, intro_tab = parse_cifra(cifra)
    chords = extract_chord_sequence(chord_lines)
    if not chords:
        raise ValueError(f"Nenhum acorde encontrado em {cifra}")

    y, sr = librosa.load(audio, sr=None, mono=True)
    if bpm is None:
        bpm = detect_bpm(y, sr)

    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, bpm=bpm)
    beat_times = librosa.frames_to_time(beat_frames, sr=sr)

    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    chroma_beats = librosa.util.sync(chroma, beat_frames, aggregate=np.median)

    transpose = detect_transpose(chroma_beats, chords)
    aligned = align_chords(chroma_beats, chords, transpose)

    text = render_timeline(aligned, beat_times, bpm, transpose, cifra, intro_tab)
    out.write_text(text, encoding="utf-8")

    return {
        "output": out,
        "bpm": bpm,
        "chords": len(chords),
        "transpose": transpose,
        "aligned": aligned,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("audio", type=Path, help="no_vocals.wav ou pasta do stem")
    parser.add_argument("cifra", type=Path, help="Arquivo .cifra.txt")
    parser.add_argument("-o", "--output", type=Path, default=None)
    parser.add_argument("--bpm", type=float, default=None)
    args = parser.parse_args()

    if not args.audio.exists():
        print(f"Erro: áudio não encontrado: {args.audio}", file=sys.stderr)
        return 1
    if not args.cifra.is_file():
        print(f"Erro: cifra não encontrada: {args.cifra}", file=sys.stderr)
        return 1

    result = generate(args.audio, args.cifra, args.output, args.bpm)
    print(f"BPM:          {result['bpm']:.1f}")
    print(f"Acordes:      {result['chords']}")
    print(f"Transposição: {result['transpose']:+d} semitom(s)")
    print(f"Arranjo:      {result['output']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
