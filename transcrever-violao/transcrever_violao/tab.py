"""Renderização de tablatura ASCII."""

from __future__ import annotations

from transcrever_violao.fretboard import assign_chord_frets
from transcrever_violao.midi_io import quantize_onsets

STRING_LABELS = ["e", "B", "G", "D", "A", "E"]
CELL_WIDTH = 4


def _format_cell(fret: str) -> str:
    """Coluna de largura fixa (trastes 10+ quebravam o alinhamento)."""
    if fret == "-":
        return "-" * CELL_WIDTH
    n = int(fret)
    if n < 10:
        return f"-{n}{'-' * (CELL_WIDTH - 2)}"
    return f"-{n}"[:CELL_WIDTH].ljust(CELL_WIDTH, "-")


def _duration_cells(dur_sec: float, bpm: float, division: int) -> int:
    step = 60.0 / bpm / (division / 4)
    return max(1, int(round(dur_sec / step)))


def render_tab(
    events: list[tuple[float, list[int]]],
    bpm: float,
    *,
    division: int = 32,
    cols_per_line: int = 32,
    model: str = "GAPS",
    raw_notes: list[tuple[float, float, int]] | None = None,
) -> str:
    if raw_notes is not None:
        timed = quantize_onsets(raw_notes, bpm)
    else:
        timed = [(t, p, 60.0 / bpm / 4) for t, p in events]

    beats_per_measure = division
    lines = {s: [] for s in range(1, 7)}

    def push_cell(cell: dict[int, str]) -> None:
        for string in range(1, 7):
            lines[string].append(cell.get(string, "-"))

    for _time, pitches, dur_sec in timed:
        width = _duration_cells(dur_sec, bpm, division)
        frets = assign_chord_frets(pitches)
        cell = {string: str(fret) for string, fret in frets}
        for _ in range(width):
            push_cell(cell)

    max_cells = max(len(lines[s]) for s in range(1, 7))
    blocks: list[str] = []

    for chunk_start in range(0, max_cells, cols_per_line):
        chunk_end = min(chunk_start + cols_per_line, max_cells)
        block_lines: list[str] = []
        for string_num in range(1, 7):
            label = STRING_LABELS[string_num - 1]
            part = lines[string_num][chunk_start:chunk_end]
            body = "".join(_format_cell(c) for c in part)
            block_lines.append(f"{label}|{body}|")
        blocks.append("\n".join(block_lines))

    header = (
        "Tablatura gerada automaticamente (RASCUNHO — não é partitura oficial)\n"
        f"Motor: {model} | BPM: {bpm:.1f} | Resolução: 1/{division}\n"
        "Aviso: fingerstyle com rubato; use o GP5/MIDI e revise no ouvido.\n\n"
    )
    return header + "\n\n".join(blocks)
