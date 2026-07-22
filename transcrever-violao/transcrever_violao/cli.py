"""CLI da aplicação isolada de transcrição."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from transcrever_violao.export_assets import export_assets
from transcrever_violao.pipeline import run


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Transcreve violão (guitar.wav) com GAPS → MIDI → tab → GP5.",
    )
    parser.add_argument(
        "input",
        type=Path,
        help="guitar.wav, no_vocals.wav ou pasta do stem",
    )
    parser.add_argument(
        "-o",
        "--output-dir",
        type=Path,
        default=None,
        help="Pasta de saída (padrão: <stem>/transcricao/)",
    )
    parser.add_argument("--bpm", type=float, default=None, help="BPM fixo (senão detecta)")
    parser.add_argument(
        "--division",
        type=int,
        default=32,
        choices=(8, 16, 32),
        help="Resolução rítmica da tab",
    )
    parser.add_argument(
        "--device",
        choices=("auto", "cpu", "cuda", "mps"),
        default="auto",
    )
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--skip-gp5", action="store_true", help="Não gera arranjo.gp5")
    parser.add_argument(
        "--assets-only",
        action="store_true",
        help="Só gera resumo.json / alphatex / playback a partir de transcricao/ existente",
    )
    args = parser.parse_args(argv)

    if not args.input.exists():
        print(f"Erro: não encontrado: {args.input}", file=sys.stderr)
        return 1

    if args.assets_only:
        out = export_assets(args.input.resolve())
        print(f"Assets: {out}")
        print("Servidor: node server.mjs")
        return 0

    print(f"Entrada:  {args.input}")
    result = run(
        args.input,
        output_dir=args.output_dir,
        bpm=args.bpm,
        division=args.division,
        device=args.device,
        batch_size=args.batch_size,
        skip_gp5=args.skip_gp5,
    )

    print(f"BPM:        {result.bpm:.1f}")
    print(f"Notas MIDI: {result.notes_raw}")
    print(f"Eventos:    {result.events}")
    print(f"Tempo:      {result.elapsed_sec:.1f}s")
    print(f"MIDI:       {result.midi}")
    print(f"Tab:        {result.tab}")
    if not args.skip_gp5:
        print(f"GP5:        {result.gp5}")
    print(f"Análise:    {result.analysis}")
    print(f"Assets:     {result.assets}")
    print("Visualizar: cd transcrever-violao && node server.mjs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
