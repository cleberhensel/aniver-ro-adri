/** Filtros compartilhados — export ffmpeg espelha a cadeia do Web Audio */

export const DEFAULT_FX = {
  trimStartMs: 0,
  trimEndMs: 0,
  volumeDb: 0,
  bassDb: 0,
  midDb: 0,
  trebleDb: 0,
  highpassHz: 80,
  lowpassHz: 12000,
  noiseReduction: 0,
  noiseGateDb: -60,
  compressorOn: false,
  compressorThreshold: -22,
  compressorRatio: 3,
  fadeInMs: 80,
  fadeOutMs: 120,
  normalize: true,
  extraFft: false,
};

export const PRESETS = {
  neutro: { label: "Neutro", ...DEFAULT_FX },
  vozLimpa: {
    label: "Voz limpa",
    ...DEFAULT_FX,
    highpassHz: 100,
    bassDb: -2,
    trebleDb: 2,
    compressorThreshold: -20,
    compressorRatio: 3.5,
    normalize: true,
  },
  reduzirFundo: {
    label: "Reduzir fundo",
    ...DEFAULT_FX,
    highpassHz: 120,
    bassDb: -4,
    midDb: -1,
    lowpassHz: 10000,
    compressorThreshold: -24,
    compressorRatio: 4,
    normalize: true,
  },
  podcast: {
    label: "Podcast",
    ...DEFAULT_FX,
    highpassHz: 90,
    bassDb: 3,
    midDb: 2,
    trebleDb: 1,
    compressorThreshold: -18,
    compressorRatio: 2.5,
    fadeInMs: 150,
    fadeOutMs: 200,
    normalize: true,
  },
};

/** Parâmetros de mix sem corte fino — usado em presets e batch */
export function mixOnlyFx(fx) {
  const f = clampFx(fx);
  return { ...f, trimStartMs: 0, trimEndMs: 0 };
}

export function clampFx(fx) {
  return {
    trimStartMs: clamp(fx.trimStartMs, 0, 30000),
    trimEndMs: clamp(fx.trimEndMs, 0, 30000),
    volumeDb: clamp(fx.volumeDb, -24, 12),
    bassDb: clamp(fx.bassDb, -12, 12),
    midDb: clamp(fx.midDb, -12, 12),
    trebleDb: clamp(fx.trebleDb, -12, 12),
    highpassHz: clamp(fx.highpassHz, 0, 400),
    lowpassHz: clamp(fx.lowpassHz, 2000, 20000),
    noiseReduction: clamp(fx.noiseReduction, 0, 30),
    noiseGateDb: clamp(fx.noiseGateDb, -60, -20),
    compressorOn: Boolean(fx.compressorOn),
    compressorThreshold: clamp(fx.compressorThreshold, -40, -6),
    compressorRatio: clamp(fx.compressorRatio, 1, 8),
    fadeInMs: clamp(fx.fadeInMs, 0, 3000),
    fadeOutMs: clamp(fx.fadeOutMs, 0, 3000),
    normalize: Boolean(fx.normalize),
    extraFft: Boolean(fx.extraFft),
  };
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Number(n) || 0));
}

/** Mesma ordem do preview: HP → LP → EQ → compressor → volume → fades → (opcional FFT/gate) */
export function buildFfmpegFilterChain(fx, durationSec) {
  const f = clampFx(fx);
  const chain = [];

  const trimStart = f.trimStartMs / 1000;
  const trimEnd = Math.max(0.1, durationSec - f.trimEndMs / 1000);
  if (trimStart > 0 || f.trimEndMs > 0) {
    chain.push(`atrim=start=${trimStart}:end=${trimEnd},asetpts=PTS-STARTPTS`);
  }

  if (f.highpassHz > 0) chain.push(`highpass=f=${f.highpassHz}`);
  if (f.lowpassHz < 20000) chain.push(`lowpass=f=${f.lowpassHz}`);

  chain.push(`equalizer=f=200:width_type=h:width=100:g=${f.bassDb}`);
  chain.push(`equalizer=f=1000:width_type=o:width=1:g=${f.midDb}`);
  chain.push(`equalizer=f=4000:width_type=h:width=2000:g=${f.trebleDb}`);

  if (f.compressorOn) {
    chain.push(
      `acompressor=threshold=${f.compressorThreshold}dB:ratio=${f.compressorRatio}:attack=8:release=120`,
    );
  }

  const totalVol = f.volumeDb + (f.normalize ? 3 : 0);
  chain.push(`volume=${totalVol}dB`);

  const outDur = trimEnd - trimStart;
  if (f.fadeInMs > 0) chain.push(`afade=t=in:st=0:d=${f.fadeInMs / 1000}`);
  if (f.fadeOutMs > 0 && outDur > f.fadeOutMs / 1000) {
    chain.push(`afade=t=out:st=${outDur - f.fadeOutMs / 1000}:d=${f.fadeOutMs / 1000}`);
  }

  if (f.extraFft && f.noiseReduction > 0) {
    chain.push(`afftdn=nr=${Math.min(f.noiseReduction, 18)}:nf=-40`);
  }
  if (f.noiseGateDb >= -42) {
    chain.push(`agate=threshold=${f.noiseGateDb}dB:ratio=2:attack=20:release=200`);
  }

  return chain.join(",");
}

export function formatFxSummary(fx) {
  const f = clampFx(fx);
  const totalDb = f.volumeDb + (f.normalize ? 3 : 0);
  const parts = [
    `vol ${totalDb > 0 ? "+" : ""}${totalDb} dB`,
    `G${f.bassDb > 0 ? "+" : ""}${f.bassDb}`,
    `M${f.midDb > 0 ? "+" : ""}${f.midDb}`,
    `A${f.trebleDb > 0 ? "+" : ""}${f.trebleDb}`,
  ];
  if (f.compressorOn) parts.push("comp");
  if (f.extraFft && f.noiseReduction > 0) parts.push(`FFT${f.noiseReduction}`);
  return parts.join(" · ");
}
