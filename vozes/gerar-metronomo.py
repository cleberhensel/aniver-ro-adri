#!/usr/bin/env python3
"""Detecta BPM fixo (referência no violão) e gera metrônomo alinhado."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf

HOP_LENGTH = 512


def click_sample(
    sr: int,
    freq: float,
    duration: float = 0.010,
    amp: float = 0.9,
) -> np.ndarray:
    n = max(1, int(sr * duration))
    t = np.linspace(0, duration, n, endpoint=False)
    env = np.exp(-t * 200)
    return (amp * np.sin(2 * np.pi * freq * t) * env).astype(np.float32)


def score_grid(
    onset_env: np.ndarray,
    sr: int,
    bpm: float,
    offset: float,
    duration: float,
    beats_per_bar: int,
) -> float:
    period = 60.0 / bpm
    times = np.arange(offset, duration, period)
    frames = librosa.time_to_frames(times, sr=sr, hop_length=HOP_LENGTH)
    frames = frames[frames < len(onset_env)]
    if len(frames) < 8:
        return -1e9

    vals = onset_env[frames]
    weights = np.array(
        [1.5 if i % beats_per_bar == 0 else 1.0 for i in range(len(vals))]
    )
    return float(np.sum(vals * weights))


def find_best_offset(
    onset_env: np.ndarray,
    sr: int,
    bpm: float,
    duration: float,
    beats_per_bar: int,
) -> float:
    period = 60.0 / bpm
    best = (-1e9, 0.0)
    for offset in np.arange(0, period, 0.0002):
        score = score_grid(onset_env, sr, bpm, offset, duration, beats_per_bar)
        if score > best[0]:
            best = (score, float(offset))
    return best[1]


def detect_fixed_tempo(
    y: np.ndarray,
    sr: int,
    beats_per_bar: int,
    bpm_fixed: float | None = None,
) -> tuple[float, float]:
    duration = len(y) / sr
    onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=HOP_LENGTH)

    if bpm_fixed is not None:
        offset = find_best_offset(onset_env, sr, bpm_fixed, duration, beats_per_bar)
        return bpm_fixed, offset

    tempo, _ = librosa.beat.beat_track(y=y, sr=sr, hop_length=HOP_LENGTH)
    bpm_hint = float(np.atleast_1d(tempo)[0])
    seeds = {bpm_hint, bpm_hint / 2, bpm_hint * 2, 120.0}
    seeds = {round(s, 3) for s in seeds if 55 <= s <= 200}

    best = (-1e9, bpm_hint, 0.0)
    for seed in seeds:
        for bpm in np.arange(seed - 5, seed + 5, 0.02):
            period = 60.0 / bpm
            for offset in np.arange(0, period, 0.001):
                score = score_grid(onset_env, sr, bpm, offset, duration, beats_per_bar)
                if score > best[0]:
                    best = (score, float(bpm), float(offset))

    _, bpm, offset = best
    for bpm_f in np.arange(bpm - 0.5, bpm + 0.5, 0.002):
        period = 60.0 / bpm_f
        for offset_f in np.arange(max(0, offset - 0.05), offset + 0.05, 0.0002):
            offset_f = offset_f % period
            score = score_grid(onset_env, sr, bpm_f, offset_f, duration, beats_per_bar)
            if score > best[0]:
                best = (score, float(bpm_f), float(offset_f))

    return best[1], best[2]


def render_metronome(
    sr: int,
    duration: float,
    bpm: float,
    offset: float,
    beats_per_bar: int,
) -> np.ndarray:
    samples = int(np.ceil(duration * sr))
    track = np.zeros(samples, dtype=np.float32)

    tick = click_sample(sr, 2000, amp=0.45)
    accent = click_sample(sr, 1400, duration=0.014, amp=0.85)

    period = 60.0 / bpm
    beat_idx = 0
    t = offset
    while t < duration:
        start = int(t * sr)
        sample = accent if beat_idx % beats_per_bar == 0 else tick
        end = min(start + len(sample), samples)
        if start < samples:
            track[start:end] += sample[: end - start]
        t += period
        beat_idx += 1

    peak = np.max(np.abs(track))
    if peak > 0:
        track /= peak * 1.02
    return track


def mix_background(vocals: np.ndarray, metronome: np.ndarray, level_db: float) -> np.ndarray:
    n = max(len(vocals), len(metronome))
    if vocals.ndim == 1:
        vocals = vocals[:, np.newaxis]
    out = np.zeros((n, vocals.shape[1]), dtype=np.float32)
    out[: len(vocals)] = vocals

    gain = 10 ** (level_db / 20)
    mono_click = metronome[:n] * gain

    for ch in range(out.shape[1]):
        out[: len(metronome), ch] += mono_click[: len(metronome)]

    peak = np.max(np.abs(out))
    if peak > 0.99:
        out *= 0.99 / peak
    return out


def resolve_paths(audio: Path) -> tuple[Path, Path | None, Path]:
    if audio.is_dir():
        stem_dir = audio
        vocals = stem_dir / "vocals.wav"
        guitar = stem_dir / "no_vocals.wav"
        if not vocals.is_file():
            raise FileNotFoundError(f"vocals.wav não encontrado em {stem_dir}")
        return vocals, guitar if guitar.is_file() else None, stem_dir

    stem_dir = audio.parent
    guitar = stem_dir / "no_vocals.wav"
    vocals = audio if audio.name == "vocals.wav" else None
    return audio, guitar if guitar.is_file() else None, stem_dir


def generate(
    audio: Path,
    output_dir: Path | None = None,
    beats_per_bar: int = 2,
    bpm_override: float | None = None,
    mix_level_db: float = -16.0,
) -> dict:
    ref_vocals, guitar_path, stem_dir = resolve_paths(audio)
    out_dir = output_dir or stem_dir

    tempo_source = guitar_path or ref_vocals
    y_tempo, sr = librosa.load(tempo_source, sr=None, mono=True)
    bpm, offset = detect_fixed_tempo(y_tempo, sr, beats_per_bar, bpm_override)

    duration = len(y_tempo) / sr
    metronome = render_metronome(sr, duration, bpm, offset, beats_per_bar)

    metronome_path = out_dir / "metronome.wav"
    sf.write(metronome_path, metronome, sr, subtype="PCM_16")

    result = {
        "bpm": bpm,
        "offset": offset,
        "tempo_source": tempo_source.name,
        "metronome": metronome_path,
        "beats": int((duration - offset) / (60.0 / bpm)) + 1,
    }

    vocals_path = stem_dir / "vocals.wav"
    if vocals_path.is_file():
        vocals, sr_v = librosa.load(vocals_path, sr=sr, mono=False)
        if vocals.ndim == 1:
            vocals = vocals[np.newaxis, :]
        vocals = vocals.T.astype(np.float32)
        mixed = mix_background(vocals, metronome, mix_level_db)
        mixed_path = out_dir / "vocals-metronomo.wav"
        sf.write(mixed_path, mixed, sr, subtype="PCM_16")
        result["vocals_metronomo"] = mixed_path

    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "audio",
        type=Path,
        help="Pasta do stem, vocals.wav ou áudio original",
    )
    parser.add_argument("-o", "--output-dir", type=Path, default=None)
    parser.add_argument(
        "--compasso",
        type=int,
        default=2,
        choices=(2, 3, 4, 6),
        help="Acento a cada N tempos (padrão: 2, comum em MPB/samba)",
    )
    parser.add_argument("--bpm", type=float, default=None, help="BPM fixo manual")
    parser.add_argument(
        "--mix-db",
        type=float,
        default=-16.0,
        help="Volume do click no fundo da voz (dB, padrão: -16)",
    )
    args = parser.parse_args()

    if not args.audio.exists():
        print(f"Erro: não encontrado: {args.audio}", file=sys.stderr)
        return 1

    result = generate(
        args.audio,
        args.output_dir,
        args.compasso,
        args.bpm,
        args.mix_db,
    )

    print(f"BPM fixo:      {result['bpm']:.3f}")
    print(f"Início (offset): {result['offset']:.4f}s")
    print(f"Referência:    {result['tempo_source']}")
    print(f"Ticks:         {result['beats']}")
    print(f"Metrônomo:     {result['metronome']}")
    if "vocals_metronomo" in result:
        print(f"Voz + click:   {result['vocals_metronomo']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
