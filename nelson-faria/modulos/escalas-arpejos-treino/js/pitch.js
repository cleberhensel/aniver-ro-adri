(function (global) {
  'use strict';

  function rms(buf) {
    let s = 0;
    for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
    return Math.sqrt(s / buf.length);
  }

  function detectPitch(buf, sampleRate) {
    const volume = rms(buf);
    if (volume < 0.008) return { freq: 0, clarity: 0, volume };

    const SIZE = buf.length;
    const r = new Float32Array(SIZE);
    for (let lag = 0; lag < SIZE; lag++) {
      let sum = 0;
      for (let i = 0; i < SIZE - lag; i++) sum += buf[i] * buf[i + lag];
      r[lag] = sum;
    }
    if (r[0] === 0) return { freq: 0, clarity: 0, volume };

    const minLag = Math.floor(sampleRate / 1200);
    const maxLag = Math.min(Math.floor(sampleRate / 70), SIZE - 2);
    let bestLag = -1;
    let bestVal = 0;

    for (let lag = minLag; lag <= maxLag; lag++) {
      const norm = r[lag] / r[0];
      if (norm > bestVal) { bestVal = norm; bestLag = lag; }
    }
    if (bestLag < 0 || bestVal < 0.75) return { freq: 0, clarity: bestVal, volume };

    const y1 = r[bestLag - 1] / r[0];
    const y2 = r[bestLag] / r[0];
    const y3 = r[bestLag + 1] / r[0];
    const denom = 2 * (2 * y2 - y1 - y3);
    const shift = denom !== 0 ? (y1 - y3) / denom : 0;
    const refinedLag = bestLag + shift;
    const freq = sampleRate / refinedLag;
    return { freq, clarity: bestVal, volume };
  }

  function freqToNote(freq, A4, NOTE_NAMES) {
    if (!freq || freq < 60) return null;
    const midi = 69 + 12 * Math.log2(freq / A4);
    const rounded = Math.round(midi);
    const cents = (midi - rounded) * 100;
    const pc = ((rounded % 12) + 12) % 12;
    const octave = Math.floor(rounded / 12) - 1;
    return { midi: rounded, pc, cents, name: NOTE_NAMES[pc], octave, freq };
  }

  function degreeFromPc(rootPc, pc, intervals) {
    const interval = (pc - rootPc + 12) % 12;
    const idx = intervals.indexOf(interval);
    if (idx < 0) return null;
    const fam = global.EatCatalog?.getFamily?.('');
    return idx + 1;
  }

  function matchDegree(rootPc, pc, family) {
    const interval = (pc - rootPc + 12) % 12;
    const idx = (family?.intervals || []).indexOf(interval);
    if (idx < 0) return null;
    return (family?.degreeLabels || [])[idx] || String(idx + 1);
  }

  global.Eat = global.Eat || {};
  global.Eat.Pitch = {
    rms,
    detectPitch,
    freqToNote,
    matchDegree
  };
})(typeof window !== 'undefined' ? window : globalThis);
