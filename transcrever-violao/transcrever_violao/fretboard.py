"""Atribuição de corda/traste a partir de pitches MIDI."""

from __future__ import annotations

from itertools import combinations

OPEN_STRINGS = {6: 40, 5: 45, 4: 50, 3: 55, 2: 59, 1: 64}
MAX_FRET = 20


def fret_options(midi_note: int) -> list[tuple[int, int]]:
    opts: list[tuple[int, int]] = []
    for string, open_pitch in OPEN_STRINGS.items():
        fret = midi_note - open_pitch
        if 0 <= fret <= MAX_FRET:
            opts.append((string, fret))
    return opts


def _position_cost(
    string: int,
    fret: int,
    *,
    pitch: int,
    index: int,
    last_string: int | None,
    last_fret: int | None,
) -> float:
    score = fret * 1.8
    if index == 0 and pitch <= 57:
        score += (7 - string) * 2.0
    if last_string is not None:
        score += abs(string - last_string) * 1.5
    if last_fret is not None:
        score += abs(fret - last_fret) * 0.35
    if string >= 5 and fret > 12:
        score += 3.0
    return score


def assign_frets(pitches: list[int]) -> list[tuple[int, int]]:
    """Greedy por nota, com viés de playability (Fase 1 — sem modelo aprendido)."""
    ordered = sorted(pitches)
    assigned: list[tuple[int, int]] = []
    last_string: int | None = None
    last_fret: int | None = None

    for i, pitch in enumerate(ordered):
        options = fret_options(pitch)
        if not options:
            continue
        best = min(
            options,
            key=lambda opt: _position_cost(
                opt[0],
                opt[1],
                pitch=pitch,
                index=i,
                last_string=last_string,
                last_fret=last_fret,
            ),
        )
        assigned.append(best)
        last_string, last_fret = best

    return assigned


def assign_chord_frets(pitches: list[int]) -> list[tuple[int, int]]:
    """Evita duas notas na mesma corda; tenta minimizar span de trastes."""
    unique = sorted(set(pitches))
    if len(unique) <= 1:
        return assign_frets(unique)

    best: list[tuple[int, int]] | None = None
    best_score = float("inf")

    for combo in combinations(unique, len(unique)):
        partial = assign_frets(list(combo))
        strings = [s for s, _ in partial]
        if len(strings) != len(set(strings)):
            continue
        frets = [f for _, f in partial]
        span = max(frets) - min(frets) if frets else 0
        score = span * 2 + sum(frets)
        if score < best_score:
            best_score = score
            best = partial

    if best:
        return best
    return assign_frets(unique)
