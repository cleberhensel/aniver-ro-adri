"""Exporta transcrição para alphaTex (player web alphaTab)."""

from __future__ import annotations

from transcrever_violao.fretboard import assign_chord_frets
from transcrever_violao.midi_io import TimedEvent, quantize_onsets

QUARTERS_PER_MEASURE = 4.0
VALID_DURATIONS = (1, 2, 4, 8, 16, 32, 64)


def _escape_tex(text: str) -> str:
    return text.replace("\\", "\\\\").replace('"', '\\"')


def _duration_value(dur_sec: float, bpm: float) -> int:
    quarters = max(1 / 64, dur_sec * bpm / 60.0)
    target = QUARTERS_PER_MEASURE / quarters
    return min(VALID_DURATIONS, key=lambda d: abs(d - target))


def _duration_quarters(dur_value: int) -> float:
    return QUARTERS_PER_MEASURE / dur_value


def _format_beat(cell: list[tuple[int, int]] | None, dur_value: int) -> str:
    if not cell:
        return f"r.{dur_value}"
    if len(cell) == 1:
        string, fret = cell[0]
        return f"{fret}.{string}.{dur_value}"
    inner = " ".join(f"{fret}.{string}" for string, fret in cell)
    return f"({inner}).{dur_value}"


def export_alphatex(
    events: list[tuple[float, list[int]]] | list[TimedEvent],
    *,
    title: str = "Transcrição",
    bpm: float = 120.0,
    division: int = 32,
    raw_notes: list[tuple[float, float, int]] | None = None,
) -> str:
    """Gera alphaTex com durações reais (menos pausas artificiais)."""
    _ = division

    if raw_notes is not None:
        timed = quantize_onsets(raw_notes, bpm)
    elif events and len(events[0]) == 3:
        timed = events  # type: ignore[assignment]
    else:
        timed = [(t, p, 60.0 / bpm / 4) for t, p in events]  # type: ignore[misc]

    lines = [
        f'\\title "{_escape_tex(title)}"',
        f"\\tempo {int(round(bpm))}",
        '\\track "Violão" { instrument 25 }',
        "\\staff {tabs}",
    ]

    measure_parts: list[str] = []
    measure_fill = 0.0

    for _time, pitches, dur_sec in timed:
        cell = assign_chord_frets(pitches)
        dur_value = _duration_value(dur_sec, bpm)
        beat_q = _duration_quarters(dur_value)

        if measure_fill + beat_q > QUARTERS_PER_MEASURE + 0.01 and measure_parts:
            lines.append(" ".join(measure_parts) + " |")
            measure_parts = []
            measure_fill = 0.0

        measure_parts.append(_format_beat(cell, dur_value))
        measure_fill += beat_q

        if measure_fill >= QUARTERS_PER_MEASURE - 0.01:
            lines.append(" ".join(measure_parts) + " |")
            measure_parts = []
            measure_fill = 0.0

    if measure_parts:
        if measure_fill < QUARTERS_PER_MEASURE:
            remain_q = QUARTERS_PER_MEASURE - measure_fill
            rest_val = _duration_value(remain_q * 60.0 / bpm, bpm)
            measure_parts.append(_format_beat(None, rest_val))
        lines.append(" ".join(measure_parts) + " |")

    return "\n".join(lines)
